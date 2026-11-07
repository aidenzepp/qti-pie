/**
 * A manifest's identifiers as optional parts: the host writes a `ManifestId` only where the
 * `cp:manifest` writes its `identifier`, a `ResourceId` only where a `cp:resource` writes its own,
 * and a `DependencyTarget` only where a dependency's `identifierref` is some resource's identifier,
 * so no row compares an identifier an element does not write. Over every case of the box, the
 * import's rows, judged on the host, break no law the law oracle does not find broken, and are
 * refused under the oracle's rule wherever they break one.
 *
 * Oracle: the specification as a checker, IMS Content Packaging 1.2 (the manifest's and each
 * resource's `identifier` are required `xs:ID`s, one ID space; a dependency's `identifierref`
 * names a resource of its manifest, never its own, §6.11.5 B ii) and the XSDs' use="required"
 * (AL3), through the law oracle's verdict on each case. A missing value is a row of its own
 * relation, never a sentinel (AGENTS.md, Schema intent): before this guard the import wrote an
 * absent identifier as "", so two resources of none broke "DocumentId key" and a manifest and a
 * resource of none "Manifest id space", where AL3 alone is broken.
 */
import { randomUUID } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The content packaging namespace of QTI 3.0's profile.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The identifier a resource of the box writes: its own (`r<n>`), the first resource's (`r0`), the
 * manifest's (`m`), or none.
 */
type IdentifierDraw = "m" | "none" | "own" | "r0";

/**
 * The `identifierref` the first resource's dependency writes: no dependency, its own identifier
 * (`r0`), the second resource's (`r1`), or one no resource writes.
 */
type DependencyDraw = "none" | "nowhere" | "r0" | "r1";

/**
 * One case of the box: the manifest's identifier written or not, a first resource with its
 * identifier, its type written or not and its dependency, and an optional second resource.
 */
interface IdentifierCase {
  readonly dependency: DependencyDraw;
  readonly first: IdentifierDraw;
  readonly manifest: boolean;
  readonly second: IdentifierDraw | undefined;
  readonly typed: boolean;
}

/**
 * Every case: 2 manifests, 4 first identifiers, 2 types, 4 dependencies and 5 second resources,
 * 320 cases.
 */
const cases: Gen<IdentifierCase> = (source) => ({
  dependency: source.draw(element(["none", "r0", "r1", "nowhere"] as const)),
  first: source.draw(element(["own", "r0", "m", "none"] as const)),
  manifest: source.draw(element([true, false] as const)),
  second: source.draw(element([undefined, "own", "r0", "m", "none"] as const)),
  typed: source.draw(element([true, false] as const)),
});

/**
 * The situations a case reaches, each a named variant the box must hold.
 */
type Situation =
  | "dangling-dependency"
  | "duplicate-identifier"
  | "manifest-id-clash"
  | "self-dependency"
  | "unnamed-manifest"
  | "unnamed-resource"
  | "unnamed-resources"
  | "untyped";

/**
 * Write a drawn identifier as the resource at a place writes it.
 *
 * @param draw - The draw.
 * @param at - The resource's place.
 * @returns The identifier, none for none.
 */
const identifierOf = (draw: IdentifierDraw, at: number): Option.Option<string> => {
  if (draw === "none") {
    return Option.none();
  }

  return Option.some(draw === "own" ? `r${String(at)}` : draw);
};

/**
 * Name the situations a case reaches.
 *
 * @param input - The case.
 * @returns Its situations.
 */
const situationsOf = (input: IdentifierCase): readonly Situation[] => {
  const written = [
    identifierOf(input.first, 0),
    ...(input.second === undefined ? [] : [identifierOf(input.second, 1)]),
  ];
  const named = written.flatMap((identifier) => Option.toArray(identifier));
  const reached: readonly (readonly [Situation, boolean])[] = [
    ["unnamed-manifest", !input.manifest],
    ["unnamed-resource", written.some(Option.isNone)],
    ["unnamed-resources", written.length === 2 && written.every(Option.isNone)],
    ["untyped", !input.typed],
    ["duplicate-identifier", new Set(named).size < named.length],
    ["manifest-id-clash", input.manifest && named.includes("m")],
    [
      "self-dependency",
      Option.exists(written[0] ?? Option.none(), (id) => id === input.dependency),
    ],
    ["dangling-dependency", input.dependency !== "none" && !named.includes(input.dependency)],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * Write an attribute that may be unwritten.
 *
 * @param name - Its name.
 * @param value - Its lexical form, none where it is unwritten.
 * @returns The attribute's text, with its leading space, or nothing.
 */
const attribute = (name: string, value: Option.Option<string>): string =>
  Option.match(value, { onNone: () => "", onSome: (written) => ` ${name}="${written}"` });

/**
 * Write a case's manifest, the package's one entry.
 *
 * @param input - The case.
 * @returns The manifest's text.
 */
const manifestOf = (input: IdentifierCase): string => {
  const first = `<resource${attribute("identifier", identifierOf(input.first, 0))}${input.typed ? ' type="webcontent"' : ""}>${input.dependency === "none" ? "" : `<dependency identifierref="${input.dependency}"/>`}</resource>`;
  const second =
    input.second === undefined
      ? ""
      : `<resource${attribute("identifier", identifierOf(input.second, 1))} type="webcontent"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="${cpNamespace}"${input.manifest ? ' identifier="m"' : ""}><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${first}${second}</resources></manifest>`;
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/package.ts, a manifest's identifiers",
  (it) => {
    it.effect(
      "writes an identifier only where it is written, and is refused under the oracle's rule",
      (ctx) =>
        // Bound: the 320 cases of `cases`, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "a manifest with or without its identifier, a first resource of its own identifier, the first's, the manifest's or none, typed or not, with no dependency or one on itself, the second resource or nothing, and an optional second resource of the same identifiers",
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<Situation>([
                "dangling-dependency",
                "duplicate-identifier",
                "manifest-id-clash",
                "self-dependency",
                "unnamed-manifest",
                "unnamed-resource",
                "unnamed-resources",
                "untyped",
              ]),
              generator: cases,
              limit: 400,
              literal: (value) => Formatter.format(value),
              oracle: { kind: "specification", name: "the law oracle's verdict on each case" },
              suite: "import/overlays-manifest-identifiers",
            },
            (input, c) =>
              Effect.gen(function* identifierCase() {
                c.noteAll(situationsOf(input));

                const manifest = manifestOf(input);
                const dir = yield* scopedPackage(
                  new Map([[manifestPath, new TextEncoder().encode(manifest)]]),
                );
                const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
                const verdict = verdictOf(judgment);
                const minted = new Set<string>();
                const { inputs } = yield* readProgram(dir, (): NodeId => {
                  const id: NodeId = randomUUID();
                  minted.add(id);

                  return id;
                });
                const host = hostVerdictOf(inputs, minted);
                const oracleLaws: ReadonlySet<string> = new Set(
                  judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
                );

                for (const name of host.broken.keys()) {
                  assert.isTrue(
                    oracleLaws.has(name),
                    `${manifest}: the import's rows break ${name}, which the oracle finds held (${Formatter.format([...oracleLaws])})`,
                  );
                }

                if (Arr.isReadonlyArrayNonEmpty(host.brokenLaws)) {
                  assert.strictEqual(
                    Option.getOrUndefined(ruleOfLaws(host.brokenLaws)),
                    verdict.verdict === "accepted" ? undefined : verdict.rule,
                    `${manifest}: the import's rows, judged on the host, refused under the oracle's rule`,
                  );
                }

                const resources = [
                  identifierOf(input.first, 0),
                  ...(input.second === undefined ? [] : [identifierOf(input.second, 1)]),
                ];
                assert.strictEqual(inputs.ManifestId.size, input.manifest ? 1 : 0, manifest);
                assert.sameMembers(
                  [...inputs.ResourceId.values()].map(({ identifier }) => identifier),
                  resources.flatMap((identifier) => Option.toArray(identifier)),
                  `${manifest}: a ResourceId a written identifier`,
                );
              }).pipe(Effect.scoped),
          ),
        ),
      600_000,
    );
  },
);
