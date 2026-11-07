import path from "node:path";
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { int, shuffled } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import {
  Array as Arr,
  Context,
  Duration,
  Effect,
  Equal,
  FileSystem,
  Formatter,
  Layer,
  Option,
  Result,
} from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  admitsWord,
  editsOf,
  probeText,
  probeValueOf,
  targetsOf,
  wordWith,
} from "#pantry/test/gen/vocab.ts";
import type { Edit, MatchScope, Word } from "#pantry/test/gen/vocab.ts";
import { vpFmt } from "#pantry/test/vp-fmt.ts";
import {
  loadModels,
  loadWorld,
  loadWorldDocuments,
  modelsOf,
  renderModels,
  rowsOf,
  worldOf,
} from "#pantry/vocab/derive/models.ts";
import type { WorldDocuments } from "#pantry/vocab/derive/models.ts";
import { checkCache, readPlaced, sourcePaths, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { Placed, XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import {
  classOf,
  probeTargetsOf,
  probeWorldOf,
  rootNameOf,
  validate,
} from "#pantry/test/gen/xmllint.ts";
import type { ErrorClass, ValidityError } from "#pantry/test/gen/xmllint.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels, typeDerivations } from "#pantry/vocab/inventory/models.ts";
import type {
  ContentModel,
  ContentType,
  ExpandedName,
  Particle,
  Source,
} from "#pantry/vocab/inventory/types.ts";
import { xincludeNamespace, xsNamespace } from "#pantry/vocab/namespaces.ts";
import { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The key of an expanded name: `{namespace}local`.
 *
 * @param name - The name.
 * @returns The key.
 */
const keyOf = ({ local, namespace }: ExpandedName): string => `{${namespace}}${local}`;

/**
 * The folder the xmllint probes are written to, `work/vocab-models-oracle-*`, the run's own, so two
 * runs at once never rewrite each other's driver under xmllint.
 */
const oracleRoot = fileScratchDirectory("vocab-models-oracle-");

/**
 * The package folder, `packages/pantry`, which the committed leaf and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * The committed leaf this suite regenerates.
 */
const leafPath = "src/vocab/inventory/models.ts";

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
 * oracle over every probe, and of each test under it. Measured 2026-11-07: 427.5 s at a load
 * average of 76 to 87, the hook, beside three other suites that read the pinned XSDs, under
 * `nice -n 15`; its slowest test took 103.9 s. The budget is twice the slowest, rounded up to the
 * next minute. On 2026-11-05, at a load average near 12, reading a version's 20 pinned files took 4
 * to 5 s and `xmllint` 7 to 10 s a version, and four times that, 240 s, cut the hook at the busier
 * load. With every batch's report in the verdict cache (`#pantry/test/gen/verdict-cache.ts`) the
 * hook took 72.9 s at 68 to 88, but a run that finds none, as a fresh clone's or one after a probe
 * changes, pays the whole, so the budget is the uncached run's. Raise it only on a new measurement
 * recorded here, never to make a run pass.
 */
const hookTimeoutMs = 900_000;

/**
 * How long one search case may run: each reads precomputed verdicts, or derives one version's
 * models, a few seconds at most.
 */
const caseHang = Duration.minutes(2);

/**
 * The structural classes of validity error: every class but `value`, whose errors the vocabulary's
 * structure does not decide.
 */
const structural: ReadonlySet<ErrorClass> = new Set<ErrorClass>([
  "attribute-not-allowed",
  "attribute-required",
  "attribute-strict",
  "character-content",
  "children-missing",
  "element-strict",
  "element-unexpected",
]);

/**
 * What one probe asks, and what the IR answers, so its verdict is judged against the answer.
 *
 * - `empty`: the kind with no content; the IR says whether its model admits no element child.
 * - `text`: the kind with text only; the IR says whether its content type admits character data.
 * - `whitespace`: the kind with one space only, for a kind of complex type; the IR says whether its
 *   content type is not `empty`, the one complex content type that refuses whitespace (XML Schema
 *   1.0 Part 1, §3.4.4, clause 1.1).
 * - `word`: a word the IR generates, covering one particle and kind; the IR says it is admitted.
 * - `edit`: one named edit of such a word; the IR's matcher says whether it is admitted.
 */
type Question =
  | { readonly _tag: "edit"; readonly admitted: boolean; readonly edit: Edit; readonly word: Word }
  | { readonly _tag: "empty"; readonly admitted: boolean }
  | { readonly _tag: "text"; readonly admitted: boolean }
  | { readonly _tag: "whitespace"; readonly admitted: boolean }
  | { readonly _tag: "word"; readonly admitted: true; readonly word: Word };

/**
 * One probe of one version's kind: the question, and the validator's errors for it.
 */
interface Judged {
  readonly errors: readonly ValidityError[];
  readonly kind: string;
  readonly question: Question;
  readonly version: SchemaVersion;
}

/**
 * Whether a content type admits character data between or as its children.
 *
 * @param content - The content type.
 * @returns Whether it is mixed or simple.
 */
const admitsText = (content: ContentType): boolean =>
  content._tag === "mixed" || content._tag === "simple";

/**
 * The kinds of a position a probe covers: its first, middle and last kind, so a substitution
 * group's members are tried at both ends and inside without trying every one.
 *
 * @param count - How many kinds the position stands for.
 * @returns The indexes to cover.
 */
const coveredIndexes = (count: number): readonly number[] =>
  Arr.dedupe([0, Math.floor(count / 2), count - 1]);

/**
 * Pose every question of one version: for each kind its probe stands for, the empty and text
 * probes, each covering word, and each edit of the covering words of four children or fewer.
 *
 * @param version - The version.
 * @returns The judged probes.
 */
const judgeVersion = Effect.fn("test.judgeVersion")(function* judgeVersion(version: SchemaVersion) {
  const { driver, targets } = yield* probeTargetsOf(version);
  const world = probeWorldOf(version, {
    attributes: attributeDeclarations,
    models: contentModels,
    vocabularies,
  });
  const posed: { readonly kind: string; readonly probe: string; readonly question: Question }[] =
    [];

  for (const [kind, target] of targets) {
    const content = world.modelOf(kind);
    const own = Option.match(world.elementOf(kind), {
      onNone: () => "",
      onSome: ({ namespace }) => namespace,
    });
    const root = rootNameOf(world, target);
    const required = world.requiredOf(kind).map(({ name }) => [name, probeValueOf(name)] as const);
    const scope: MatchScope = {
      kindNamespace: (letter) => Option.map(world.elementOf(letter), ({ namespace }) => namespace),
      own,
    };

    if (Option.isNone(content)) {
      continue;
    }

    posed.push(
      {
        kind,
        probe: probeText(world, root, required, [], ""),
        question: { _tag: "empty", admitted: admitsWord(content.value, scope, []) },
      },
      {
        kind,
        probe: probeText(world, root, required, [], "x"),
        question: { _tag: "text", admitted: admitsText(content.value) },
      },
    );

    if (content.value._tag !== "simple") {
      posed.push({
        kind,
        probe: probeText(world, root, required, [], " "),
        question: { _tag: "whitespace", admitted: content.value._tag !== "empty" },
      });
    }

    if (content.value._tag === "element-only" || content.value._tag === "mixed") {
      const { particle } = content.value;
      const words = new Map<string, Word>();
      const byPlace = Map.groupBy(targetsOf(particle), ({ place }) => place);

      for (const group of byPlace.values()) {
        for (const index of coveredIndexes(group.length)) {
          const covered = Arr.getUnsafe(group, index);
          const word = wordWith(particle, covered, world.cost);

          if (Option.isSome(word)) {
            words.set(JSON.stringify(word.value), word.value);
          }
        }
      }

      for (const word of words.values()) {
        posed.push({
          kind,
          probe: probeText(world, root, required, word, ""),
          question: { _tag: "word", admitted: true, word },
        });

        if (word.length <= 4) {
          for (const [edit, edited] of editsOf(word)) {
            posed.push({
              kind,
              probe: probeText(world, root, required, edited, ""),
              question: {
                _tag: "edit",
                admitted: admitsWord(content.value, scope, edited),
                edit,
                word: edited,
              },
            });
          }
        }
      }
    }
  }

  const errors = yield* validate(
    `${oracleRoot}/${version}`,
    driver,
    posed.map(({ probe }) => probe),
  );

  return posed.map(({ kind, question }, at): Judged => ({
    errors: errors[at] ?? [],
    kind,
    question,
    version,
  }));
});

/**
 * What the validator's errors say a probe's question's answer is.
 *
 * @param judged - The judged probe.
 * @returns Whether the XSDs admit what the probe asks.
 */
const xsdAdmits = (judged: Judged): boolean => {
  const classes = judged.errors.map(classOf);

  switch (judged.question._tag) {
    case "empty": {
      return !classes.includes("children-missing");
    }
    case "text":
    case "whitespace": {
      return !classes.includes("character-content");
    }
    case "edit":
    case "word": {
      return !classes.some((found) => structural.has(found));
    }
    default: {
      return judged.question satisfies never;
    }
  }
};

/**
 * Every version's judged probes, read once for the suite.
 */
class Judgements extends Context.Service<Judgements, readonly Judged[]>()(
  "vocab/derive/models.test/Judgements",
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
 * The documents of 3.0.1's schemas, read once for the determinism checks.
 */
class Documents extends Context.Service<Documents, WorldDocuments>()(
  "vocab/derive/models.test/Documents",
) {}

/**
 * Read 3.0.1's documents.
 */
const DocumentsLayer = Layer.effect(Documents, loadWorldDocuments("3.0.1"));

/**
 * The layers the suite runs on: the judgements, the documents, the file system and the process
 * spawner.
 */
const SuiteLayer = Layer.mergeAll(
  JudgementsLayer,
  DocumentsLayer,
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
 * Rename the XML Schema namespace's prefix in a schema document and put a comment between every
 * two of its elements: two edits XML Schema reads no differently, which a derivation that is a
 * function of the schema, not of its spelling, must not see.
 *
 * @param document - The document.
 * @returns The edited document.
 */
const respelled = (placed: Placed) =>
  Effect.gen(function* respell() {
    const text = yield* writeXml(placed.document);
    const edited = text
      .replaceAll(/\bxsd?:/gu, "renamed:")
      .replaceAll(/xmlns:xsd?=/gu, "xmlns:renamed=")
      .replaceAll("><", "><!-- c --><");

    return { ...placed, document: yield* readXml(new TextEncoder().encode(edited)) };
  });

/**
 * Declare LOM's local `aggregationLevel`, whose type holds a lax `##other` wildcard, unqualified:
 * the element leaves LOM's namespace while its wildcard's target namespace stays LOM's. The edit
 * adds no line, so the document keeps its lines.
 *
 * @param placed - A document of LOM's schema.
 * @returns The edited document.
 */
const unqualifiedAggregationLevel = (placed: Placed) =>
  Effect.gen(function* unqualify() {
    const text = yield* writeXml(placed.document);
    const document = yield* readXml(
      new TextEncoder().encode(
        text.replace(
          /<xs:element(?<space>\s+)name="aggregationLevel"/u,
          '<xs:element form="unqualified"$<space>name="aggregationLevel"',
        ),
      ),
    );

    return { ...placed, document };
  });

/**
 * The XSD constructs a source of each IR construct may begin with, by the construct: an element
 * particle's `xs:element`, a wildcard's `xs:any`, a group's compositor or the `xs:group` that
 * references it, or, for a type's content as a whole, its `xs:complexType`, and a model's
 * `xs:complexType`, or its element's `xs:element`.
 */
const startTags = {
  any: ["any"],
  element: ["element"],
  group: ["all", "choice", "complexType", "group", "sequence"],
  model: ["complexType", "element"],
} as const;

/**
 * Whether a line of an XSD holds the start of one of some constructs: `<`, any prefix, and the
 * construct's name, read from the file's text apart from the deriver's reading of it.
 *
 * @param line - The line.
 * @param names - The constructs' local names.
 * @returns Whether it does.
 */
const startsConstruct = (line: string, names: readonly string[]): boolean =>
  names.some((name) =>
    new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?${name}[\\s/>]|<(?:[A-Za-z_][\\w.-]*:)?${name}$`, "u").test(
      line,
    ),
  );

/**
 * Every source of a model and its particles, each with the constructs its line must begin.
 *
 * @param model - A row of the leaf.
 * @returns The sources, the model's first.
 */
const sourcesOf = (model: ContentModel): readonly (readonly [Source, readonly string[]])[] => {
  const ofParticle = (particle: Particle): readonly (readonly [Source, readonly string[]])[] => [
    ...particle.sources.map((source) => [source, startTags[particle._tag]] as const),
    ...(particle._tag === "group" ? particle.particles.flatMap(ofParticle) : []),
  ];

  return [
    ...model.sources.map((source) => [source, startTags.model] as const),
    ...(model.content._tag === "element-only" || model.content._tag === "mixed"
      ? ofParticle(model.content.particle)
      : []),
  ];
};

describe("vocab/inventory/models.ts type derivations", () => {
  it("states each model's type, and derives every type from itself first, transitively", () => {
    const derivedIn = new Map(
      typeDerivations.flatMap(({ derived, type, versions }) =>
        versions.map(
          (version) => [`${version} ${keyOf(type)}`, new Set(derived.map(keyOf))] as const,
        ),
      ),
    );
    const wrong = [
      ...contentModels.flatMap(({ kind, type, versions }) =>
        Option.toArray(type).flatMap((named) =>
          versions.flatMap((version) =>
            derivedIn.has(`${version} ${keyOf(named)}`)
              ? []
              : [`${version} ${kind}: its type ${keyOf(named)} has no derivation row`],
          ),
        ),
      ),
      ...typeDerivations.flatMap(({ derived, type, versions }) => [
        ...(keyOf(derived[0]) === keyOf(type)
          ? []
          : [`${keyOf(type)} is not first in its own row`]),
        ...versions.flatMap((version) =>
          derived.flatMap((held) =>
            [...(derivedIn.get(`${version} ${keyOf(held)}`) ?? new Set<string>())]
              .filter((below) => derivedIn.get(`${version} ${keyOf(type)}`)?.has(below) !== true)
              .map(
                (below) =>
                  `${version} ${below} derives from ${keyOf(held)} but not from ${keyOf(type)}`,
              ),
          ),
        ),
      ]),
      ...schemaVersions.flatMap((version) => {
        const fromAnyType =
          derivedIn.get(`${version} {${xsNamespace}}anyType`) ?? new Set<string>();

        return [...derivedIn.keys()]
          .filter((key) => key.startsWith(`${version} `))
          .filter((key) => !fromAnyType.has(key.slice(version.length + 1)))
          .map((key) => `${key} is not derived from xs:anyType`);
      }),
    ];

    assert.strictEqual(wrong.slice(0, 8).join("\n"), "", `${wrong.length} wrong`);
  });
});

if (Option.isSome(absence)) {
  it("derives the content-model IR from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/models.ts over the pinned XSDs", () => {
  layer(SuiteLayer, { timeout: hookTimeoutMs })("from the cache", (cached) => {
    cached.effect(
      `regenerates ${leafPath} byte for byte after vp fmt`,
      () =>
        Effect.gen(function* regenerate() {
          const fs = yield* FileSystem.FileSystem;
          const derived = yield* vpFmt(renderModels(yield* loadModels()), leafPath);

          assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${leafPath}`));
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "agrees with xmllint on every probe: empty, text, whitespace, covering words and their edits",
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
                box: `every (version, kind) of the IR, each probed empty, with text, with white space, and with its covering words and their one-step edits: ${byKind.length} probes`,
                caseHang,
                coverage: requiredInSpace<
                  "admitted" | "edit" | "empty" | "refused" | "text" | "whitespace" | "word"
                >(["empty", "text", "whitespace", "word", "edit", "admitted", "refused"]),
                generator: int(0, byKind.length - 1),
                limit: byKind.length,
                literal: Formatter.format,
                oracle: {
                  kind: "second-implementation",
                  name: "libxml2's schema validator over the pinned XSDs",
                },
                suite: "vocab/derive-models-xmllint",
              },
              (index, c) =>
                Effect.sync(() => {
                  const disagreements = Arr.getUnsafe(byKind, index).flatMap((probe) => {
                    c.note(probe.question._tag);
                    c.note(probe.question.admitted ? "admitted" : "refused");

                    return xsdAdmits(probe) === probe.question.admitted
                      ? []
                      : [
                          `${probe.version} ${probe.kind} ${Formatter.format(probe.question)}: the IR says ${probe.question.admitted ? "admitted" : "refused"}, xmllint ${Formatter.format(probe.errors)}`,
                        ];
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

    cached.effect(
      "derives the committed leaf's models whatever order each version's documents are read in",
      (ctx) =>
        Effect.gen(function* permuted() {
          const newer = yield* Effect.fromResult(worldOf(yield* Documents));
          const older = yield* loadWorld("3.0.0");

          return yield* searched(
            ctx,
            explore(
              {
                caseHang,
                concurrency: 1,
                coverage: noCoverage,
                draw: drawn((source) => ({
                  newer: source.draw(
                    shuffled(newer.documents, {
                      max: newer.documents.length,
                      min: newer.documents.length,
                    }),
                  ),
                  older: source.draw(
                    shuffled(older.documents, {
                      max: older.documents.length,
                      min: older.documents.length,
                    }),
                  ),
                })),
                kept: [],
                literal: (orders) =>
                  Formatter.format({
                    newer: orders.newer.map(([, document]) => document.root.qname),
                    older: orders.older.map(([, document]) => document.root.qname),
                  }),
                oracle: {
                  kind: "specification",
                  name: "the committed leaf (contentModels), which the regenerate test ties to the read order",
                },
                runs: 4,
                shrink: completeShrink,
                steerEvery: 16,
                suite: "vocab/derive-models-order",
              },
              (orders) =>
                Effect.sync(() => {
                  assert.isTrue(
                    Equal.equals(
                      rowsOf([
                        ["3.0.0", Result.getOrThrow(modelsOf(older.world, orders.older))],
                        ["3.0.1", Result.getOrThrow(modelsOf(newer.world, orders.newer))],
                      ]),
                      contentModels,
                    ),
                  );
                }),
            ),
          );
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "cites, for every model and particle, a line of its file that begins the construct it is",
      (ctx) =>
        Effect.gen(function* cite() {
          const fs = yield* FileSystem.FileSystem;
          const directory = yield* xsdDirectory;
          const files = new Map<string, readonly string[]>();

          for (const file of new Set(
            contentModels
              .flatMap(sourcesOf)
              .flatMap(([source]) => (source._tag === "xsd" ? [source.file] : [])),
          )) {
            const bytes = yield* fs.readFile(`${directory}/${file}`);
            // The one pinned file in UTF-16, XInclude's, begins with its byte order mark.
            const text = new TextDecoder(
              bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le" : "utf-8",
            ).decode(bytes);

            files.set(file, text.split("\n"));
          }

          return yield* searched(
            ctx,
            exhaust(
              {
                box: `every content model of the IR and each of its particles: ${contentModels.length} models`,
                caseHang,
                coverage: requiredInSpace<"cited">(["cited"]),
                generator: int(0, contentModels.length - 1),
                limit: contentModels.length,
                literal: Formatter.format,
                oracle: {
                  kind: "specification",
                  name: "the pinned XSD files' own text, line by line, read apart from the deriver (startsConstruct)",
                },
                suite: "vocab/derive-models-sources",
              },
              (index, c) =>
                Effect.sync(() => {
                  const model = Arr.getUnsafe(contentModels, index);
                  const wrong = sourcesOf(model).flatMap(([source, names]) => {
                    if (source._tag === "spec") {
                      return [];
                    }

                    c.note("cited");

                    const line = files.get(source.file)?.[source.line - 1] ?? "";

                    return startsConstruct(line, names)
                      ? []
                      : [
                          `${model.kind}: ${source.file}:${source.line} begins no ${names.join(" or ")}: ${line.trim()}`,
                        ];
                  });

                  assert.strictEqual(wrong.slice(0, 8).join("\n"), "", `${wrong.length} wrong`);
                }),
            ),
          );
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "finds no block in any pinned XSD, and no final but XInclude's, which no pinned type breaks",
      () =>
        Effect.gen(function* blockers() {
          const written: string[] = [];
          const visit = (file: string, node: Element): void => {
            for (const name of ["block", "blockDefault", "final", "finalDefault"]) {
              const held = node.attributes.find(
                ({ local, namespace }) => local === name && namespace === "",
              );

              if (held !== undefined) {
                written.push(`${file} ${node.qname} ${name}="${held.value}"`);
              }
            }

            for (const child of node.children) {
              if (child.kind === "element") {
                visit(file, child);
              }
            }
          };

          for (const file of sourcePaths) {
            visit(file, (yield* readPlaced(file)).document.root);
          }

          assert.deepStrictEqual(written, ['w3/XInclude.xsd xs:schema finalDefault="extension"']);
          assert.deepStrictEqual(
            typeDerivations
              .filter(({ type }) => type.namespace === xincludeNamespace)
              .map(({ derived }) => derived.length),
            [1, 1, 1],
          );
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "refuses a wildcard whose schema's target namespace is not its element's namespace",
      () =>
        Effect.gen(function* unqualified() {
          const read = yield* Documents;
          const edited: WorldDocuments = {
            sets: yield* Effect.all(
              read.sets.map(([source, set]) =>
                Effect.all(
                  set.map((placed) =>
                    source === "lom/imsmd_loose_v1p3p2.xsd"
                      ? unqualifiedAggregationLevel(placed)
                      : Effect.succeed(placed),
                  ),
                ).pipe(Effect.map((documents) => [source, documents] as const)),
              ),
            ),
            ssml: read.ssml,
          };
          const { documents, world } = yield* Effect.fromResult(worldOf(edited));
          const refused = Result.flip(modelsOf(world, documents));

          assert.include(
            Result.getOrThrow(refused).message,
            "the element {}aggregationLevel holds a wildcard written in a schema whose target namespace is http://ltsc.ieee.org/xsd/LOM",
          );
        }),
      hookTimeoutMs,
    );

    cached.effect(
      "derives the same models from the XSDs respelled: another prefix, and comments between",
      () =>
        Effect.gen(function* respell() {
          const read = yield* Documents;
          const edited: WorldDocuments = {
            sets: yield* Effect.all(
              read.sets.map(([source, set]) =>
                Effect.all(set.map(respelled)).pipe(
                  Effect.map((documents) => [source, documents] as const),
                ),
              ),
            ),
            ssml: [yield* respelled(read.ssml[0]), yield* respelled(read.ssml[1])],
          };
          const before = yield* Effect.fromResult(worldOf(read));
          const after = yield* Effect.fromResult(worldOf(edited));

          assert.isTrue(
            Equal.equals(
              rowsOf([["3.0.1", yield* Effect.fromResult(modelsOf(after.world, after.documents))]]),
              rowsOf([
                ["3.0.1", yield* Effect.fromResult(modelsOf(before.world, before.documents))],
              ]),
            ),
          );
        }),
      hookTimeoutMs,
    );
  });
});
