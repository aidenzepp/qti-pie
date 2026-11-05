import path from "node:path";
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import {
  Array as Arr,
  Context,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Layer,
  Option,
} from "effect";
import { Digest } from "effect/crypto";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { constraintAdmits, probeText, probeValueOf } from "#pantry/test/gen/vocab.ts";
import { vpFmt } from "#pantry/test/vp-fmt.ts";
import {
  attributeDeclarationsOf,
  attributeWildcardsOf,
  globalKindsOf,
  governingRowsOf,
  loadDeclarations,
  loadGlobalAttributes,
  renderAttributes,
  renderVocabularies,
  rostersOf,
  textTypesOf,
} from "#pantry/vocab/derive/declarations.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import {
  classOf,
  probeTargetsOf,
  probeWorldOf,
  rootNameOf,
  validate,
} from "#pantry/test/gen/xmllint.ts";
import type { ValidityError } from "#pantry/test/gen/xmllint.ts";
import { attributeDeclarations, attributeWildcards } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";
import { xmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The package folder, `packages/pantry`, which the committed leaves and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when every pinned
 * XSD is present.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, of the hook that reads both versions' schemas and runs the XSD
 * oracle over every probe, and of each regeneration. Measured on 2026-11-05 on a 10-CPU M2 Max at a
 * load average near 12: 25 to 35 s in all. The budget is four times that.
 */
const hookTimeoutMs = 160_000;

/**
 * How long one search case may run: each reads precomputed verdicts.
 */
const caseHang = Duration.minutes(1);

/**
 * The handle of an `xml:` attribute's local name.
 *
 * @param local - The local name.
 * @returns `xml:<local>`.
 */
const xmlHandle = (local: string): string => `xml:${local}`;

/**
 * Every no-namespace attribute name a kind of any vocabulary declares, and one no XSD declares:
 * the names an omission check tries on each kind that does not declare them.
 */
const universe: readonly string[] = [
  ...Arr.dedupe(attributeDeclarations.flatMap(({ name }) => (name.includes(":") ? [] : [name]))),
  "zz-undeclared",
];

/**
 * The four `xml:` names `xml.xsd` declares.
 */
const xmlNames: readonly string[] = ["lang", "space", "base", "id"].map(xmlHandle);

/**
 * What one attribute probe asks.
 *
 * - `required`: the kind with no attribute; the leaf says which names it requires.
 * - `declared`: the kind with every name it declares; the leaf says none is refused.
 * - `undeclared`: the kind with one name it does not declare; the leaf's wildcard says whether it is
 *   admitted.
 */
type Question =
  | { readonly _tag: "declared"; readonly names: readonly string[] }
  | { readonly _tag: "required"; readonly names: readonly string[] }
  | {
      readonly _tag: "undeclared";
      readonly admitted: boolean;
      readonly name: string;
      readonly underOtherLax: boolean;
    };

/**
 * One judged question: the version, the kind, the question, and the validator's errors for its
 * probe.
 */
interface Judged {
  readonly errors: readonly ValidityError[];
  readonly kind: string;
  readonly question: Question;
  readonly version: SchemaVersion;
}

/**
 * The attribute a validity error names, as a handle: the local name in no namespace, `xml:` in the
 * XML namespace, and the Clark name otherwise.
 *
 * @param reported - The error.
 * @returns The handle, or `None` for an error on no attribute.
 */
const attributeHandleOf = (reported: ValidityError): Option.Option<string> =>
  reported.attribute.pipe(
    Option.map((written) =>
      written.startsWith(`{${xmlNamespace}}`)
        ? xmlHandle(written.slice(xmlNamespace.length + 2))
        : written,
    ),
  );

/**
 * The names a probe's `attribute-required` errors name.
 *
 * @param errors - The probe's errors.
 * @returns The names, sorted.
 */
const requiredNamesOf = (errors: readonly ValidityError[]): readonly string[] =>
  errors
    .flatMap((reported) =>
      classOf(reported) === "attribute-required"
        ? Option.toArray(
            Option.fromNullishOr(
              /The attribute '(?<name>.+)' is required/u.exec(reported.message)?.groups?.["name"],
            ),
          )
        : [],
    )
    .map((written) =>
      written.startsWith(`{${xmlNamespace}}`)
        ? xmlHandle(written.slice(xmlNamespace.length + 2))
        : written,
    )
    .toSorted((left, right) => (left < right ? -1 : 1));

/**
 * The names a probe's validator refused as attributes: not allowed, or refused by a strict
 * wildcard.
 *
 * @param errors - The probe's errors.
 * @returns The handles of the refused names.
 */
const refusedNamesOf = (errors: readonly ValidityError[]): ReadonlySet<string> =>
  new Set(
    errors.flatMap((reported) =>
      classOf(reported) === "attribute-not-allowed" || classOf(reported) === "attribute-strict"
        ? Option.toArray(attributeHandleOf(reported))
        : [],
    ),
  );

/**
 * Pose every attribute question of one version.
 *
 * @param version - The version.
 * @returns The judged questions.
 */
const judgeVersion = Effect.fn("test.judgeAttributes")(function* judgeVersion(
  version: SchemaVersion,
) {
  const { driver, targets } = yield* probeTargetsOf(version);
  const world = probeWorldOf(version, {
    attributes: attributeDeclarations,
    models: contentModels,
    vocabularies,
  });
  const declared = Map.groupBy(
    attributeDeclarations.filter((row) => row.versions.includes(version)),
    (row) => row.kind,
  );
  const wildcards = new Map(
    attributeWildcards.flatMap((row) =>
      row.versions.includes(version) ? [[row.kind, row] as const] : [],
    ),
  );
  const posed: {
    readonly kind: string;
    readonly probe: string;
    readonly questions: readonly Question[];
  }[] = [];

  for (const [kind, target] of targets) {
    const own = Option.match(world.elementOf(kind), {
      onNone: () => "",
      onSome: ({ namespace }) => namespace,
    });
    const root = rootNameOf(world, target);
    const names = (declared.get(kind) ?? []).map(({ name }) => name);
    const required = (declared.get(kind) ?? []).flatMap(({ name, use }) =>
      use === "required" ? [name] : [],
    );
    const wildcard = Option.fromNullishOr(wildcards.get(kind));
    const admittedLocal = Option.exists(
      wildcard,
      ({ namespace, processing }) =>
        processing !== "strict" && constraintAdmits(namespace, own, ""),
    );
    const undeclared = [
      ...universe.filter((name) => !names.includes(name)),
      ...xmlNames.filter((name) => !names.includes(name)),
    ];

    posed.push(
      {
        kind,
        probe: probeText(world, root, [], [], ""),
        questions: [
          { _tag: "required", names: required.toSorted((left, right) => (left < right ? -1 : 1)) },
        ],
      },
      {
        kind,
        probe: probeText(
          world,
          root,
          names.map((name) => [name, probeValueOf(name)] as const),
          [],
          "",
        ),
        questions: [{ _tag: "declared", names }],
      },
      {
        kind,
        probe: probeText(
          world,
          root,
          [
            ...world.requiredOf(kind).map(({ name }) => [name, probeValueOf(name)] as const),
            ...undeclared.map((name) => [name, probeValueOf(name)] as const),
          ],
          [],
          "",
        ),
        questions: undeclared.map((name): Question => ({
          _tag: "undeclared",
          admitted: name.startsWith("xml:") ? Option.isSome(wildcard) : admittedLocal,
          name,
          underOtherLax:
            !name.includes(":") &&
            Option.exists(
              wildcard,
              ({ namespace, processing }) => namespace === "##other" && processing === "lax",
            ),
        })),
      },
    );
  }

  const errors = yield* validate(
    `${packageRoot}/work/vocab-attributes-oracle/${version}`,
    driver,
    posed.map(({ probe }) => probe),
  );

  return posed.flatMap(({ kind, questions }, at) =>
    questions.map((question): Judged => ({ errors: errors[at] ?? [], kind, question, version })),
  );
});

/**
 * Every version's judged questions, read once for the suite.
 */
class Judgements extends Context.Service<Judgements, readonly Judged[]>()(
  "vocab/derive/declarations.test/Judgements",
) {}

/**
 * Pose and judge every version's questions.
 */
const JudgementsLayer = Layer.effect(
  Judgements,
  Effect.gen(function* judgeAll() {
    const judged: Judged[][] = [];

    for (const version of schemaVersions) {
      judged.push([...(yield* judgeVersion(version))]);
    }

    return Judgements.of(judged.flat());
  }),
);

/**
 * The layers the suite runs on.
 */
const SuiteLayer = Layer.mergeAll(
  JudgementsLayer,
  NodeServices.layer,
  NodeChildProcessSpawner.layer,
  Digest.layerWebCrypto,
).pipe(
  Layer.provide(
    Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto, NodeChildProcessSpawner.layer),
  ),
  Layer.provide(NodeServices.layer),
);

/**
 * Whether xmllint's verdict on an undeclared name is one where libxml2 departs from XML Schema, so
 * the specification's verdict, the leaf's, stands (the operator's rule: the spec wins).
 *
 * Libxml2 2.9 admits an attribute in no namespace under an `##other` wildcard whose processing is
 * `lax`, though XML Schema 1.0 Part 1, 3.10.4 (Wildcard allows Namespace Name), clause 2.3, keeps
 * `##other` from admitting an absent namespace; it refuses the same attribute under a `strict` or
 * `skip` `##other`, as the specification does.
 *
 * @param question - The question.
 * @param admitted - Xmllint's verdict.
 * @returns Whether the verdict is that departure.
 */
const isOracleDeparture = (
  question: Extract<Question, { readonly _tag: "undeclared" }>,
  admitted: boolean,
): boolean => admitted && !question.admitted && question.underOtherLax;

/**
 * Judge one question against its errors.
 *
 * @param judged - The question.
 * @returns A description of the disagreement, or `None` when the leaf and the XSDs agree.
 */
const disagreementOf = (judged: Judged): Option.Option<string> => {
  const { errors, question } = judged;

  switch (question._tag) {
    case "required": {
      const found = requiredNamesOf(errors);

      return found.join(" ") === question.names.join(" ")
        ? Option.none()
        : Option.some(
            `the leaf requires [${question.names.join(" ")}], xmllint [${found.join(" ")}]`,
          );
    }
    case "declared": {
      const refused = refusedNamesOf(errors);
      const wrong = question.names.filter((name) => refused.has(name));

      return wrong.length === 0
        ? Option.none()
        : Option.some(`xmllint refuses the declared ${wrong.join(" ")}`);
    }
    case "undeclared": {
      const admitted = !refusedNamesOf(errors).has(question.name);

      return admitted === question.admitted || isOracleDeparture(question, admitted)
        ? Option.none()
        : Option.some(
            `the leaf ${question.admitted ? "admits" : "refuses"} the undeclared ${question.name}, xmllint ${admitted ? "admits" : "refuses"} it`,
          );
    }
    default: {
      return question satisfies never;
    }
  }
};

if (Option.isSome(absence)) {
  it("derives the declarations leaves from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/declarations.ts over the pinned XSDs", () => {
  layer(SuiteLayer, { timeout: hookTimeoutMs })("from the cache", (cached) => {
    cached.effect(
      "regenerates both leaves byte for byte after vp fmt",
      () =>
        Effect.gen(function* regenerate() {
          const fs = yield* FileSystem.FileSystem;
          const readings = yield* loadDeclarations();
          const leaves = [
            [
              "src/vocab/inventory/vocabularies.ts",
              renderVocabularies(rostersOf(readings), globalKindsOf(readings)),
            ],
            [
              "src/vocab/inventory/attributes.ts",
              renderAttributes(
                attributeDeclarationsOf(readings),
                attributeWildcardsOf(readings),
                textTypesOf(readings),
                yield* loadGlobalAttributes(),
                governingRowsOf(readings),
              ),
            ],
          ] as const;

          for (const [file, text] of leaves) {
            assert.strictEqual(
              yield* vpFmt(text, file),
              yield* fs.readFileString(`${packageRoot}/${file}`),
              file,
            );
          }
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "agrees with xmllint on every kind's required, declared and undeclared attributes",
      (ctx) =>
        Effect.gen(function* oracle() {
          const judged = yield* Judgements;

          const byKind = [
            ...Map.groupBy(judged, ({ kind, version }) => `${version} ${kind}`).values(),
          ];

          return yield* searched(
            ctx,
            exhaust(
              {
                caseHang,
                coverage: requiredInSpace<
                  | "admitted"
                  | "declared"
                  | "oracle-departure"
                  | "refused"
                  | "required"
                  | "undeclared"
                >([
                  "required",
                  "declared",
                  "undeclared",
                  "admitted",
                  "refused",
                  "oracle-departure",
                ]),
                generator: int(0, byKind.length - 1),
                limit: byKind.length,
                literal: Formatter.format,
                suite: "vocab/derive-declarations-xmllint",
              },
              (index, c) =>
                Effect.sync(() => {
                  const disagreements = Arr.getUnsafe(byKind, index).flatMap((probe) => {
                    c.note(probe.question._tag);
                    if (probe.question._tag === "undeclared") {
                      c.note(probe.question.admitted ? "admitted" : "refused");
                      if (probe.question.underOtherLax) {
                        c.note("oracle-departure");
                      }
                    }

                    return Option.toArray(disagreementOf(probe)).map(
                      (found) => `${probe.version} ${probe.kind}: ${found}`,
                    );
                  });

                  assert.strictEqual(
                    disagreements.slice(0, 12).join("\n"),
                    "",
                    `${disagreements.length} disagreements`,
                  );
                }),
            ),
          );
        }),
      hookTimeoutMs,
    );
  });
});
