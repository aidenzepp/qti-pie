import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { domainReader } from "#pantry/grammar/attributes.ts";
import { faultOf } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { documentRoots } from "#pantry/grammar/facets.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { ssmlNamespace } from "#pantry/vocab/namespaces.ts";
import * as open from "#pantry/vocab/open.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type { ContentModel, Occurs, Particle } from "#pantry/vocab/inventory/types.ts";
import {
  elementsOf,
  resolverOf,
  loadXsd,
  toyFacets,
  toyGrammar,
  toySources,
  toyVocabulary,
  wildcardAdmits,
  wildcardsOf,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type { Content, Particle as TestParticle } from "#pantry/test/gen/grammar.ts";
import {
  contentExpressionParents,
  mathmlNamespace,
  mathmlRoot,
  semanticsContexp,
} from "#pantry/test/gen/relaxng.ts";
import { admittedOf } from "#pantry/test/indexes.ts";

/**
 * The wildcards a parent's content reads, a spec reading's in place of the XSD's: spec reading 61
 * (upstream's 61) reads `qti-ordering`'s extension slot as `##any` where the XSD writes `##other`
 * (information model §5.98.3; `facets.ts`, `orderingModel`).
 *
 * @param parent - The parent's kind.
 * @param wildcards - Its XSD particles' wildcards.
 * @returns The wildcards the grammar reads.
 */
const readWildcards = (
  parent: string,
  wildcards: readonly Extract<TestParticle, { readonly _tag: "any" }>[],
): readonly Extract<TestParticle, { readonly _tag: "any" }>[] =>
  parent === "qti-ordering"
    ? wildcards.map((wildcard) => ({ ...wildcard, namespace: "##any" }))
    : wildcards;

/**
 * The names a spec reading takes out of a parent's model where the XSD declares them, each as
 * `parent {namespace}local`: spec reading 44, after SSML 1.1 §3.1.8.2, lists `token`'s elements
 * without `voice` and makes `w` its alias, where the XSD's `tokenType` admits a `voice`
 * (`facets.ts`, `tokenEdits`).
 */
const takenOut: ReadonlySet<string> = new Set(
  ["ssml:token", "ssml:w"].map((parent) => `${parent} {${ssmlNamespace}}voice`),
);

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Whether every pinned XSD is in the cache. The XSD differential needs them; without them it is
 * skipped with its reason.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The pinned schema sets the differential walks, each with the version its rows are read in. The
 * metadata XSD is one for both versions.
 */
const schemas: readonly (readonly [SourcePath, (typeof schemaVersions)[number]])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
  ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "3.0.0"],
  ["imsqtiv3p0p1_imscpv1p2_v1p0.xsd", "3.0.1"],
  ["imsqti_metadatav3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_metadatav3p0_v1p0.xsd", "3.0.1"],
];

/**
 * How long reading the pinned XSDs and walking them may take: the two ASI XSDs are 18 MB each, and
 * a read of one took 3.2 s on 2026-11-05 at a load average of about 15, beside the swarm's other
 * suites. Twice the six reads' worst, rounded up.
 * Measured 2026-11-07: 54.7 s at a load average of 63 to 73, the slower of its two tests.
 */
const xsdTimeout = 120_000;

/**
 * How long one of the two compose searches may take, each a few hundred toy grammars composed in
 * turn. Vitest's 5 s default was met under load (seats PG and IN, 2026-11-06). Measured on
 * 2026-11-06 at `0f6264a` with this file's searches run alone on seeds 1 to 3: the projection
 * search took 3195, 2475 and 2573 ms and the restated search 940, 770 and 643 ms at one-minute load
 * averages of 14.6 to 16.0. Beside the whole free suite, on seeds 1, 101, 202, 303 and 202 again,
 * they took 3704, 4074, 2908, 5168 and 7074 ms, and 1128, 1127, 879, 1655 and 1741 ms, at loads of
 * 26 to 28 where sampled. Measured 2026-11-07: 23.1 s at a load average of 63 to 73, the projection
 * search, and the budget is the hang guard of 60 s, over twice that. Raise it only on a new
 * measurement recorded here, never to make a run pass.
 */
const searchTimeout = 60_000;

/**
 * The character data XML Schema Part 1 §3.4.4 lets stand between an element's children, by its
 * content type: whitespace, comments and processing instructions in element content, comments and
 * processing instructions alone in empty content, text and entity references too where the content
 * is character data. The oracle states the rule from the specification; the content type is read
 * independently, by the test's own XSD reader.
 *
 * @param content - The content, as the reader reads it.
 * @returns The character-data kinds.
 */
const characterDataOf = (content: Content): readonly string[] => {
  if (content.simple || content.mixed) {
    return ["comment", "entityRef", "pi", "text", "ws"];
  }

  return Option.isSome(content.particle) ? ["comment", "pi", "ws"] : ["comment", "pi"];
};

describe.skipIf(!cached)("Admission against the XSD", () => {
  it.effect(
    "admits under each kind exactly the elements its content model names, wildcards apart, in every pinned schema",
    () =>
      Effect.gen(function* admissionIsTheXsds() {
        const { content, kinds } = yield* grammar;
        const admission = admittedOf(content.contentModelOf, content.admissionIn);
        const isElement = (kind: string) => Option.isSome(kinds.isElement.lookup({ kind }));
        const namespaceOf = (kind: string) =>
          Option.map(kinds.elementName.lookup({ kind }), ({ namespace }) => namespace);
        const differences: string[] = [];
        let compared = 0;
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, (namespace, local, parent) =>
            resolverOf(kinds)(namespace, local, parent),
          );
          for (const [parent, models] of contents) {
            const particles = models.flatMap((model) => Option.toArray(model.particle));
            const named = new Set<string>(
              particles
                .flatMap(elementsOf)
                .flatMap((particle) => particle.members)
                .flatMap((member) =>
                  Option.toArray(
                    resolverOf(kinds)(member.name.namespace, member.name.local, parent),
                  ),
                ),
            );
            const wildcards = readWildcards(parent, particles.flatMap(wildcardsOf));
            const admitted = admission
              .filter((row) => row.version === version && row.parent === parent)
              .map(({ child }) => child);
            const elements = admitted.filter(isElement);
            compared += elements.length;
            for (const child of elements) {
              // A foreign kind is its namespace class: a namespace of that class stands for it.
              const classNamespace = (wildcard: { readonly target: string }): string => {
                if (child === foreignKinds.absent) {
                  return "";
                }

                return child === foreignKinds.own ? wildcard.target : "urn:x-grammar-test-foreign";
              };
              const byWildcard = isForeignKind(child)
                ? wildcards.some((wildcard) => wildcardAdmits(wildcard, classNamespace(wildcard)))
                : Option.exists(namespaceOf(child), (namespace) =>
                    wildcards.some((wildcard) => wildcardAdmits(wildcard, namespace)),
                  );
              // Spec reading 2: the RelaxNG's `ContExp` holds `semantics-contexp`, which the XSD's
              // drops (`mathml3-strict-content.rnc` line 14).
              const readingTwo = child === semanticsContexp && contentExpressionParents.has(parent);
              if (!named.has(child) && !byWildcard && !readingTwo) {
                differences.push(
                  `${root} ${version} ${parent} admits ${child}, which its model does not name`,
                );
              }
            }

            for (const child of named) {
              if (!elements.includes(child)) {
                differences.push(
                  `${root} ${version} ${parent} does not admit ${child}, which its model names`,
                );
              }
            }

            const data = new Set(admitted.filter((child) => !isElement(child)));
            // Spec reading 2: MathML's RelaxNG matches whitespace against `empty` (§2), which the
            // XSD's empty content type does not admit (decision 321 (5)).
            const readingTwoEmpty =
              Option.exists(namespaceOf(parent), (namespace) => namespace === mathmlNamespace) &&
              models.some(
                (model) => !model.simple && !model.mixed && Option.isNone(model.particle),
              );
            const expected = new Set([
              ...models.flatMap(characterDataOf),
              ...(readingTwoEmpty ? ["ws"] : []),
            ]);
            if (data.symmetricDifference(expected).size > 0) {
              differences.push(
                `${root} ${version} ${parent} admits ${[...data].toSorted().join(",")} of character data, and its content type admits ${[...expected].toSorted().join(",")}`,
              );
            }
          }
        }

        assert.isAbove(compared, 0);
        assert.deepStrictEqual(differences, []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );

  it.effect(
    "resolves every element name under every parent by locality, as the XSD reads it: a local declaration, else a global one a wildcard finds in the schema set of the parent's document, else none",
    () =>
      // Oracle: XML Schema Part 1 §3.3.2 and §3.10.4 over the tests' own reading of the XSDs: a
      // parent's model declares a name by an element particle, and a wildcard admitting the name's
      // namespace finds its top-level declaration in the schema set the parent was read from, its
      // root XSD and what that imports (spec reading 81), but for reading 6's roots, which stay
      // foreign; any other name is undeclared there. A parent read from several roots finds a
      // declaration any of their sets holds, as reading 81's limit says. The document node
      // declares the roots its model (R5) names, and `qti-ordering`'s slot is spec reading 61's
      // `##any` (`readWildcards`), and spec reading 44 takes `voice` out of `ssml:token` and
      // `ssml:w` (`takenOut`). The box is every parent the walks reach, in either version, by every
      // element name.
      Effect.gen(function* locality() {
        const { kinds } = yield* grammar;
        const names = kinds.elementName.rows.map(({ local, namespace }) => ({ local, namespace }));
        const declared = new Set<string>(
          documentRoots.flatMap((root) =>
            Option.toArray(kinds.elementName.lookup({ kind: root })).map(
              ({ local, namespace }) => `document {${namespace}}${local}`,
            ),
          ),
        );
        const parents = new Set<string>(["document"]);
        const read = [];
        // The usage-data XSD declares `usageData`, a root no other walk reaches.
        for (const root of [
          ...schemas.map(([held]) => held),
          "usagedata/imsqti_usagedatav3p0_v1p0.xsd" as const,
        ]) {
          const { set } = yield* loadXsd(root);
          read.push({ contents: xsdContents(set, resolverOf(kinds)).contents, set });
        }

        const kept = new Set(
          [...open.foreignRoots].flatMap((root) =>
            Option.toArray(kinds.elementName.lookup({ kind: root })).map(
              ({ local, namespace }) => `{${namespace}}${local}`,
            ),
          ),
        );
        for (const { contents, set } of read) {
          // Spec reading 2, from the MathML 3 RelaxNG: `annotation-xml` holds the math expressions,
          // what `m:mrow` names (`MathExpression`), and elements of other namespaces
          // (`mathml3-common.rnc` lines 59 and 61); a wildcard finds no MathML element but the
          // root, `math` (line 15); and `semantics` stands where `ContExp` does
          // (`mathml3-strict-content.rnc` line 14).
          const rootName = Option.match(kinds.elementName.lookup({ kind: mathmlRoot }), {
            onNone: () => "",
            onSome: ({ local, namespace }) => `{${namespace}}${local}`,
          });
          const foundByWildcard = (parent: string, key: string, namespace: string): boolean =>
            namespace !== mathmlNamespace || (parent !== "m:annotation-xml" && key === rootName);
          for (const { name } of (contents.get("m:mrow") ?? [])
            .flatMap(({ particle }) => Option.toArray(particle))
            .flatMap(elementsOf)
            .flatMap(({ members }) => members)) {
            declared.add(`m:annotation-xml {${name.namespace}}${name.local}`);
          }

          for (const parent of contentExpressionParents) {
            declared.add(`${parent} {${mathmlNamespace}}semantics`);
          }

          for (const [parent, models] of contents) {
            parents.add(parent);
            for (const particle of models.flatMap((model) => Option.toArray(model.particle))) {
              for (const { members } of elementsOf(particle)) {
                for (const member of members) {
                  declared.add(`${parent} {${member.name.namespace}}${member.name.local}`);
                }
              }

              for (const wildcard of readWildcards(parent, wildcardsOf(particle))) {
                for (const name of names) {
                  const key = `{${name.namespace}}${name.local}`;
                  if (
                    set.elements.has(key) &&
                    !kept.has(key) &&
                    wildcardAdmits(wildcard, name.namespace) &&
                    foundByWildcard(parent, key, name.namespace)
                  ) {
                    declared.add(`${parent} ${key}`);
                  }
                }
              }
            }
          }
        }

        const stated = declared.difference(takenOut);
        const differences: string[] = [];
        for (const parent of parents) {
          for (const name of names) {
            const key = `{${name.namespace}}${name.local}`;
            const resolved = resolverOf(kinds)(name.namespace, name.local, parent);
            const named = Option.exists(resolved, (kind) =>
              Option.exists(
                kinds.elementName.lookup({ kind }),
                (held) => held.local === name.local && held.namespace === name.namespace,
              ),
            );
            if (stated.has(`${parent} ${key}`) !== named) {
              differences.push(
                `${key} under ${parent}: the XSD ${stated.has(`${parent} ${key}`) ? "declares" : "does not declare"} it, the grammar resolves it to ${Option.getOrElse(resolved, () => "nothing")}`,
              );
            }
          }
        }

        assert.isAbove(parents.size, 1);
        assert.deepStrictEqual(differences.slice(0, 30), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

/**
 * The toy kinds a generated content model's element particles name, each named once, so the model
 * keeps Unique Particle Attribution by construction.
 */
const toyKinds = Array.from({ length: 12 }, (_, at) => `e${at + 1}`);

/**
 * The domain reader every toy composition of this file shares: each composition carries the
 * document layer's attributes, the same definitions every time, so they compile once for the file.
 */
const toyDomains = domainReader();

/**
 * Occurrence bounds in a small box: least 0 to 2, greatest 1 to 2 or unbounded, the least never
 * above the greatest; and, on its own arm so every run reaches it, the named variant the IR finding
 * is about, a greatest of 0 (`maxOccurs="0"`, CP 3.0.1's `cp:resource`).
 */
const occursGen: Gen<Occurs> = weighted([
  [
    3,
    (source) => {
      const max = source.draw(
        weighted<Option.Option<number>>([
          [2, (inner) => Option.some(inner.draw(int(1, 2)))],
          [1, () => Option.none()],
        ]),
      );

      return {
        max,
        min: source.draw(
          int(
            0,
            Option.getOrElse(max, () => 2),
          ),
        ),
      };
    },
  ],
  [1, () => ({ max: Option.some(0), min: 0 })],
]);

/**
 * An element particle of one toy kind, its kind left to be numbered.
 */
const leaf: Gen<Particle> = (source) => ({
  _tag: "element",
  kinds: ["e1"],
  occurs: source.draw(occursGen),
  sources: toySources(schemaVersions),
});

/**
 * A particle tree at most two levels of groups deep, its element particles' kinds left to be
 * numbered.
 *
 * @param depth - The levels of groups it may still open.
 * @returns The generator.
 */
const treeGen = (depth: number): Gen<Particle> => {
  const group: Gen<Particle> = (source) => ({
    _tag: "group",
    compositor: source.draw(element(["sequence", "choice", "all"] as const)),
    occurs: source.draw(occursGen),
    particles: source.draw(array(treeGen(depth - 1), { max: 3, min: 0 })),
    sources: toySources(schemaVersions),
  });

  return depth === 0
    ? leaf
    : weighted([
        [2, leaf],
        [1, group],
      ]);
};

/**
 * Number a tree's element particles with distinct toy kinds, in tree order.
 *
 * @param particle - The tree.
 * @returns The tree, its kinds distinct.
 */
const numbered = (particle: Particle): Particle => {
  let next = 0;
  const walk = (node: Particle): Particle => {
    switch (node._tag) {
      case "element": {
        next += 1;

        return { ...node, kinds: [`e${next}`] };
      }
      case "any": {
        return node;
      }
      case "group": {
        return { ...node, particles: node.particles.map(walk) };
      }
      default: {
        return node satisfies never;
      }
    }
  };

  return walk(particle);
};

/**
 * The element kinds a particle may hold as children, by XML Schema Part 1's rule written as a
 * naive walk: a particle names its kinds unless it, or a group enclosing it, can never occur.
 *
 * @param particle - The particle.
 * @returns The kinds.
 */
const mayHold = (particle: Particle): readonly string[] => {
  if (Option.contains(particle.occurs.max, 0)) {
    return [];
  }

  switch (particle._tag) {
    case "element": {
      return particle.kinds;
    }
    case "any": {
      return [];
    }
    case "group": {
      return particle.particles.flatMap(mayHold);
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * The situations a projection case reaches: an element particle that never occurs, one that may
 * occur inside a group that never does, a group inside a group, an empty group, and each
 * compositor.
 */
type ProjectionFeature =
  | "all"
  | "choice"
  | "empty group"
  | "excluded by its group"
  | "maxOccurs 0 element"
  | "nested group"
  | "sequence";

/**
 * Every situation a projection search must reach.
 */
const projectionFeatures = [
  "all",
  "choice",
  "empty group",
  "excluded by its group",
  "maxOccurs 0 element",
  "nested group",
  "sequence",
] as const satisfies readonly ProjectionFeature[];

/**
 * The situations a particle holds.
 *
 * @param particle - The particle.
 * @param excluded - Whether an enclosing group never occurs.
 * @param nested - Whether it sits inside a group.
 * @returns Its situations.
 */
const projectionFeaturesOf = (
  particle: Particle,
  excluded: boolean,
  nested: boolean,
): readonly ProjectionFeature[] => {
  const never = Option.contains(particle.occurs.max, 0);
  switch (particle._tag) {
    case "element": {
      if (never) {
        return ["maxOccurs 0 element"];
      }

      return excluded ? ["excluded by its group"] : [];
    }
    case "any": {
      return [];
    }
    case "group": {
      return [
        particle.compositor,
        ...(nested ? (["nested group"] as const) : []),
        ...(particle.particles.length === 0 ? (["empty group"] as const) : []),
        ...particle.particles.flatMap((inner) =>
          projectionFeaturesOf(inner, excluded || never, true),
        ),
      ];
    }
    default: {
      return particle satisfies never;
    }
  }
};

describe("Admission projected from content models", () => {
  it.effect(
    "admits exactly the elements a particle that may occur names, and never a maxOccurs 0 particle's, through compose",
    (ctx) =>
      // Bound: particle trees of depth 2, groups of up to 3 particles.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<ProjectionFeature>(projectionFeatures, {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawn((source) => numbered(source.draw(treeGen(2)))),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "XML Schema Part 1's rule as a naive particle walk (mayHold)",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/admission/projection",
          },
          (particle, c) =>
            Effect.sync(() => {
              c.noteAll(projectionFeaturesOf(particle, false, false));

              const model: ContentModel = {
                content: {
                  _tag: "element-only",
                  particle: {
                    _tag: "group",
                    compositor: "sequence",
                    occurs: { max: Option.some(1), min: 1 },
                    particles: [particle],
                    sources: toySources(schemaVersions),
                  },
                },
                kind: "e0",
                sources: toySources(schemaVersions),
                type: Option.none(),
                versions: schemaVersions,
              };
              const toy = toyVocabulary({
                admission: [],
                attributes: [],
                data: ["ws", "comment", "pi"],
                facets: toyFacets({}),
                kinds: ["e0", ...toyKinds],
              });
              const result = toyGrammar([{ ...toy, models: [model] }], toyDomains);
              const held = result.pipe(
                Result.map((composedToy) =>
                  admittedOf(composedToy.content.contentModelOf, composedToy.content.admissionIn)
                    .filter(({ parent, version }) => parent === "e0" && version === "3.0.1")
                    .map(({ child }) => child)
                    .filter((child) => !["comment", "pi", "ws"].includes(child))
                    .toSorted(),
                ),
              );

              assert.deepStrictEqual(
                held,
                Result.succeed([...new Set(mayHold(particle))].toSorted()),
              );
            }),
        ),
      ),
    searchTimeout,
  );
});

/**
 * The toy kinds of the restated-triple search.
 */
const restatedKinds = ["e1", "e2", "e3", "e4"] as const;

describe("Admission through compose", () => {
  it.effect(
    "refuses a triple two vocabularies both state, and keeps one stated once",
    (ctx) =>
      // Bound: up to 6 rows over 4 kinds, one restated.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<"restated" | "stated once">(["restated", "stated once"], {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn((source) => ({
              restated: source.draw(int(0, 1)) === 1,
              rows: source.draw(
                array(
                  (s) => ({
                    child: s.draw(element(restatedKinds)),
                    parent: s.draw(element(restatedKinds)),
                  }),
                  { max: 6, min: 1 },
                ),
              ),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "a closed relation's key (E4) holds one row per (version, parent, child), whichever vocabulary states it",
            },
            runs: 200,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/admission/restated",
          },
          ({ restated, rows }, c) =>
            Effect.sync(() => {
              c.note(restated ? "restated" : "stated once");

              const triples = [
                ...new Map(
                  rows.map((row) => [
                    `${row.parent} ${row.child}`,
                    { ...row, version: "3.0.1" as const },
                  ]),
                ).values(),
              ];
              const [first] = triples;
              const second = restated && first !== undefined ? [first] : [];
              const result = toyGrammar(
                [
                  toyVocabulary({
                    admission: triples,
                    attributes: [],
                    data: ["ws"],
                    facets: toyFacets({}),
                    kinds: restatedKinds,
                  }),
                  toyVocabulary({
                    admission: second,
                    attributes: [],
                    data: [],
                    facets: toyFacets({}),
                    kinds: [],
                  }),
                ],
                toyDomains,
              );

              // A triple stated twice is no generator's refusal: `faultOf` finds it in its
              // family's admission map's `AdmissionIn` rows, and grizzle refuses it when it
              // declares `AdmissionIn`.
              if (second.length > 0) {
                assert.strictEqual(
                  Result.match(result, {
                    onFailure: ({ _tag }) => _tag,
                    onSuccess: ({ content }) =>
                      Option.match(faultOf(content.admissionIn), {
                        onNone: () => "composed",
                        onSome: ({ _tag }) => _tag,
                      }),
                  }),
                  "KeyCollision",
                );
              } else {
                assert.deepStrictEqual(
                  result.pipe(
                    Result.map(
                      (composedToy) =>
                        admittedOf(
                          composedToy.content.contentModelOf,
                          composedToy.content.admissionIn,
                        ).length,
                    ),
                  ),
                  Result.succeed(triples.length),
                );
              }
            }),
        ),
      ),
    searchTimeout,
  );
});
