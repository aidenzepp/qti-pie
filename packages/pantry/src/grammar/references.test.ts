/**
 * The reference relations' tests, each against an independent oracle:
 *
 * - **The XSD, read naively.** Each relation is compared, as a set, with what the 3.0.0 and the 3.0.1
 *   ASI XSD state under QTI's readings. The XSD is read by the tests' own reader
 *   (`#pantry/test/gen/grammar.ts` for kinds, attributes and particles,
 *   `#pantry/test/gen/references.ts` for attribute types), never through the inventory leaves the
 *   relations derive from, and the readings are restated here from the information model. The bound
 *   is the whole XSD: `DeclarationKind` and `ChoiceBound` over every kind the walk reaches,
 *   `ChoiceCount`'s choices among the children each order interaction's model admits, the
 *   references over what the three processing roots reach (processing) and what an item reaches
 *   besides (an item's content), and `SectionPart` over the section's model. Skipped, with its
 *   reason, without the pinned cache.
 * - **Laws of production's relations.** Every restricted reference is a stated reference, every
 *   target and built-in is a declaration kind, and every built-in is an NCName, the XML Names
 *   production a reference spells.
 * - **A naive model of the coding.** Over toy rosters of 4 kinds and 3 attribute names, the relations
 *   answer every point of their key space as the facets' rows say, and each of the 9 named faults
 *   meets its refusal; every fault and `valid` is a required situation of the search.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import { roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import {
  asiReferences,
  references,
  sectionPartsIn,
  spellings,
} from "#pantry/grammar/references.ts";
import type { Spelling } from "#pantry/grammar/references.ts";
import { ncName } from "#pantry/schema/patterns.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";
import {
  elementsOf,
  loadXsd,
  toySources,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type { Particle as IrParticle } from "#pantry/vocab/inventory/types.ts";
import type { Content, Particle } from "#pantry/test/gen/grammar.ts";
import {
  faults,
  refusalOf,
  toyCase,
  toyKinds,
  toyNames,
  typedAttributesOf,
} from "#pantry/test/gen/references.ts";
import type { Fault } from "#pantry/test/gen/references.ts";

/**
 * The composed grammar of production, whose rosters the reference relations are coded in. It is
 * composed once, when a test first reads it, so only the tests that read it fail when a generator
 * refuses.
 */
const grammar = await Effect.runPromise(
  Effect.cached(Effect.suspend(() => Effect.fromResult(composed()))),
);

/**
 * How long the first read of the composed grammar may take: one composition took 11.2 s on
 * 2026-11-05 at a load average of 41, beside the swarm's other suites. About five times that,
 * rounded up.
 */
const composeTimeout = 60_000;

/**
 * The reference relations of production: the ASI facet, coded in the composed `NodeKind` and
 * `AttributeName` rosters.
 */
const production = grammar.pipe(
  Effect.flatMap(({ kinds }) =>
    Effect.fromResult(
      references({
        facets: [asiReferences],
        kinds: kinds.nodeKind,
        names: kinds.attributeName,
      }),
    ),
  ),
);

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
 * The ASI XSD of each schema version: every relation here holds in both, which is why none has a
 * version digit.
 */
const schemas: readonly (readonly [SourcePath, string])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
];

/**
 * How long reading one ASI XSD and walking it may take: an 18 MB read took 3.2 s on 2026-11-05 at
 * a load average of about 15 (`admission.test.ts`). Twice two reads' worst, rounded up.
 */
const xsdTimeout = 120_000;

/**
 * The XML Schema namespace.
 */
const xs = "http://www.w3.org/2001/XMLSchema";

/**
 * QTI's readings as the oracle states them, from the information model's classes: which union
 * member spells a variable reference, and how; which attributes of an item's content name which
 * declarations; the printed variable's and the PCI context variable's references; the processing
 * roots; the count pairs; the section. Each is the specification turned into a checker, stated
 * apart from `#pantry/grammar/references.ts`.
 */
const reading = {
  boundPairs: [
    ["min-associations", "max-associations"],
    ["min-choices", "max-choices"],
    ["min-plays", "max-plays"],
    ["match-min", "match-max"],
    // Spec reading 67: "min-strings must be less than or equal to the limit imposed by
    // max-strings" (information model §5.48.7), with reading 53's 0 exemption.
    ["min-strings", "max-strings"],
  ],
  contentNames: new Map([
    ["outcome-identifier", ["qti-outcome-declaration"]],
    ["template-identifier", ["qti-template-declaration"]],
  ]),
  declaring: "cardinality",
  itemRoot: "qti-assessment-item",
  // Spec reading 18: the order interactions' `min-choices` "must not exceed the number of choices
  // available", and so must a `max-choices` beside it, with no 0 exemption (information model
  // §5.97.2 and §5.97.3, §5.61.1 and §5.61.2); their choices are their simple or hotspot choices.
  ordered: new Map([
    ["qti-order-interaction", "qti-simple-choice"],
    ["qti-graphic-order-interaction", "qti-hotspot-choice"],
  ]),
  printed: [
    {
      declarations: ["qti-outcome-declaration", "qti-template-declaration"],
      kind: "qti-printed-variable",
      named: "identifier",
    },
    // A PCI's context variable names the built-in QTI_CONTEXT or a declared context variable
    // (https://www.imsglobal.org/spec/qti/v3p0/info#IV_Context, §2.2.2.1, Context Variable; the
    // Schematron's rule 20Ba, spec reading 9), its `identifier` a bare reference.
    {
      declarations: ["qti-context-declaration"],
      kind: "qti-context-variable",
      named: "identifier",
    },
  ],
  processingName: "identifier",
  processingRoots: ["qti-outcome-processing", "qti-response-processing", "qti-template-processing"],
  referenceMembers: new Map<string, Spelling>([
    [`{${asiNamespace}}EncVariableStringDType`, "braced"],
    [`{${asiNamespace}}VariableStringDType`, "bare"],
    [`{${xs}}NCName`, "bare"],
  ]),
  section: "qti-assessment-section",
} as const;

/**
 * Write a reference row as one comparable string.
 *
 * @param fields - The row's fields, in key order.
 * @returns The fields, space-separated.
 */
const keyed = (...fields: readonly string[]): string => fields.join(" ");

/**
 * Read the spelling an attribute's union members give a variable reference.
 *
 * @param members - The union's member types, as `{namespace}local` keys.
 * @returns The reference member's spelling, or none for a union with no reference member.
 */
const memberSpelling = (members: readonly string[]): Option.Option<Spelling> =>
  Arr.findFirst(members, (member) => Option.fromNullishOr(reading.referenceMembers.get(member)));

/**
 * The alternatives of every choice within a particle that may occur more than once.
 *
 * @param particle - A particle, as the shared XSD reader reads it.
 * @returns The element particles within each such choice.
 */
const repeatedChoices = (
  particle: Particle,
): readonly Extract<Particle, { readonly _tag: "element" }>[] => {
  if (particle._tag === "element" || particle._tag === "any") {
    return [];
  }

  return [
    ...(particle._tag === "choice" && particle.occurs.max === Number.POSITIVE_INFINITY
      ? particle.particles.flatMap(elementsOf)
      : []),
    ...particle.particles.flatMap(repeatedChoices),
  ];
};

/**
 * Read the unqualified attribute names a kind's XSD contents declare.
 *
 * @param models - The kind's contents, as the shared XSD reader reads them.
 * @returns The names.
 */
const namesOf = (models: readonly Content[]): ReadonlySet<string> =>
  new Set(
    models.flatMap(({ attributes }) =>
      attributes.filter(({ name }) => name.namespace === "").map(({ name }) => name.local),
    ),
  );

describe.skipIf(!cached)("the reference relations against the XSD", () => {
  it.effect(
    "state exactly the declaration kinds, references, count bounds and section parts each ASI XSD states, under QTI's readings",
    () =>
      Effect.gen(function* againstTheXsds() {
        const { kinds } = yield* grammar;
        const relations = yield* production;
        const resolve = (namespace: string, local: string, parent: string) =>
          kinds.nodeKind.has(parent) ? kinds.resolve(namespace, local, parent) : Option.none();
        const differences: string[] = [];
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, resolve);
          const childrenOf = (kind: string) =>
            (contents.get(kind) ?? [])
              .flatMap((model) => Option.toArray(model.particle))
              .flatMap(elementsOf)
              .flatMap(({ members }) => members)
              .flatMap(({ name }) => Option.toArray(resolve(name.namespace, name.local, kind)));
          const reachedFrom = (roots: readonly string[]) => {
            const reached = new Set<string>();
            const pending = [...roots];
            for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
              if (!reached.has(next) && !next.startsWith("xi:")) {
                reached.add(next);
                pending.push(...childrenOf(next));
              }
            }

            return reached;
          };
          const processing = reachedFrom(reading.processingRoots);
          // An item's content: what an item reaches, processing apart. A test's feedback and
          // template defaults name a test's or another item's variables, never an item's own.
          const content = reachedFrom([reading.itemRoot]).difference(processing);
          // QTI's readings name ASI attributes only; MathML, SSML and the rest name no variable.
          const asi = new Set(
            [...processing.union(content)].filter((kind) =>
              Option.exists(
                kinds.elementName.lookup({ kind }),
                ({ namespace }) => namespace === asiNamespace,
              ),
            ),
          );

          const compare = (what: string, expected: Iterable<string>, actual: Iterable<string>) => {
            const want = new Set(expected);
            const have = new Set(actual);
            differences.push(
              ...[...want.difference(have)].map((row) => `${version} ${what} lacks ${row}`),
              ...[...have.difference(want)].map(
                (row) => `${version} ${what} states ${row}, which the XSD does not`,
              ),
            );
          };
          const walked = [...contents];
          compare(
            "DeclarationKind",
            walked
              .filter(([, models]) => namesOf(models).has(reading.declaring))
              .map(([kind]) => kind),
            relations.declarationKind.handles,
          );
          compare(
            "ChoiceBound",
            walked.flatMap(([kind, models]) => {
              const names = namesOf(models);

              return reading.boundPairs
                .filter(([min, max]) => names.has(min) && names.has(max))
                .map(([min, max]) =>
                  keyed(kind, min, max, reading.ordered.has(kind) ? "counted" : "unbounded"),
                );
            }),
            relations.choiceBound.rows.map(({ kind, max, min, zero }) =>
              keyed(kind, min, max, zero),
            ),
          );
          compare(
            "ChoiceCount",
            [...reading.ordered]
              .filter(([kind, choice]) => childrenOf(kind).some((child) => child === choice))
              .map(([kind, choice]) => keyed(kind, choice)),
            relations.choiceCount.rows.map(({ choice, kind }) => keyed(kind, choice)),
          );

          const stated: string[] = [];
          const restricted: string[] = [];
          for (const [kind, models] of walked.filter(([held]) => asi.has(held))) {
            // An anonymous type's member types are unread, so none of its attributes is read as a
            // union reference: production stating one there is a difference, never a pass.
            const typed = models.map((model) => typedAttributesOf(set, model.type));

            const types = new Map(
              typed.flatMap((held) => (Option.isSome(held) ? [...held.value] : [])),
            );
            const inProcessing = processing.has(kind);
            const printed = reading.printed.find((held) => held.kind === kind);
            for (const attribute of namesOf(models)) {
              const meaning = inProcessing
                ? Option.none()
                : Option.fromNullishOr(reading.contentNames.get(attribute));
              const named = inProcessing
                ? attribute === reading.processingName
                : Option.isSome(meaning) || attribute === printed?.named;
              const spelling = named
                ? Option.some<Spelling>("bare")
                : memberSpelling(types.get(attribute) ?? []);
              for (const spelled of Option.toArray(spelling)) {
                stated.push(keyed(kind, attribute, spelled));

                const targets = Option.getOrElse(
                  meaning,
                  (): readonly string[] => printed?.declarations ?? [],
                );
                restricted.push(...targets.map((target) => keyed(kind, attribute, target)));
              }
            }
          }

          compare(
            "VariableReference",
            stated,
            relations.variableReference.rows.map(({ attribute, kind, spelling }) =>
              keyed(kind, attribute, spelling),
            ),
          );
          compare(
            "ContentReference",
            restricted,
            relations.contentReference.rows.map(({ attribute, declaration, kind }) =>
              keyed(kind, attribute, declaration),
            ),
          );
          compare(
            "SectionPart",
            (contents.get(reading.section) ?? [])
              .flatMap((model) => Option.toArray(model.particle))
              .flatMap(repeatedChoices)
              .flatMap(({ members }) => members)
              .flatMap(({ name }) =>
                Option.toArray(resolve(name.namespace, name.local, reading.section)),
              ),
            relations.sectionPart.rows.map(({ kind }) => kind),
          );
        }

        assert.deepStrictEqual(differences, []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

describe("the reference relations of production", () => {
  it.effect(
    "restrict only references they state, and code every target and built-in as a declaration kind",
    () =>
      Effect.gen(function* lawsHold() {
        const relations = yield* production;
        const referenced = new Set(
          relations.variableReference.rows.map(({ attribute, kind }) => keyed(kind, attribute)),
        );

        assert.deepStrictEqual(
          relations.contentReference.rows
            .map(({ attribute, kind }) => keyed(kind, attribute))
            .filter((pair) => !referenced.has(pair)),
          [],
        );
        assert.deepStrictEqual(
          [
            ...relations.contentReference.rows.map(({ declaration }) => declaration),
            ...relations.builtIn.rows.map(({ declaration }) => declaration),
          ].filter((declaration) => !relations.declarationKind.has(declaration)),
          [],
        );
        assert.deepStrictEqual(
          relations.declares.rows.filter(({ declaration, kind }) => declaration !== kind),
          [],
        );
      }),
    composeTimeout,
  );

  it.effect(
    "count each order interaction's choices among the children it admits, beside a counted bound",
    () =>
      // Oracle: the specification as a checker, spec reading 18: a kind whose choices bound its
      // counts gives a most of 0 no meaning of its own, and its choices are children its content
      // model admits in every version that holds it (`Admission`).
      Effect.gen(function* countsAreChildren() {
        const relations = yield* production;
        const { admission } = yield* grammar;
        const parents = new Map<string, Set<string>>();
        for (const { child, parent, version } of admission.rows) {
          const key = keyed(version, parent);
          parents.set(key, (parents.get(key) ?? new Set()).add(child));
        }

        assert.isNotEmpty(relations.choiceCount.rows);
        assert.deepStrictEqual(
          relations.choiceCount.rows.flatMap(({ choice, kind }) => [
            ...(Option.exists(
              relations.choiceBound.lookup({ kind }),
              ({ zero }) => zero === "counted",
            )
              ? []
              : [`${kind} has no counted bound`]),
            ...schemaVersions
              .filter((version) => parents.has(keyed(version, kind)))
              .filter((version) => !(parents.get(keyed(version, kind))?.has(choice) ?? false))
              .map((version) => `${version} ${kind} admits no ${choice}`),
          ]),
          [],
        );
        assert.deepStrictEqual(
          relations.choiceBound.rows
            .filter(({ zero }) => zero === "counted")
            .map(({ kind }) => kind)
            .filter((kind) => Option.isNone(relations.choiceCount.lookup({ kind }))),
          [],
        );
      }),
    composeTimeout,
  );

  it.effect(
    "hold exactly the information model's built-in variables, each as the declaration kind it stands as",
    () =>
      // Oracle: the specification as a checker, the information model's §2.2.2 (Item Variables):
      // "There is one built-in context variable: 'QTI_CONTEXT'" (§2.2.2.1), "There are two
      // built-in response variables: 'numAttempts' and 'duration'" (§2.2.2.2), and "There is one
      // built-in outcome variable, 'completionStatus'" (§2.2.2.3).
      Effect.gen(function* builtInsAreTheSpecs() {
        const { builtIn } = yield* production;

        assert.deepStrictEqual(
          new Set(builtIn.rows.map(({ declaration, variable }) => keyed(variable, declaration))),
          new Set([
            keyed("QTI_CONTEXT", "qti-context-declaration"),
            keyed("numAttempts", "qti-response-declaration"),
            keyed("duration", "qti-response-declaration"),
            keyed("completionStatus", "qti-outcome-declaration"),
          ]),
        );
      }),
    composeTimeout,
  );

  it.effect(
    "name each built-in variable by an identifier a reference can spell",
    () =>
      Effect.gen(function* builtInsAreIdentifiers() {
        const { builtInVariable } = yield* production;
        const identifier = new RegExp(ncName, "u");

        assert.isNotEmpty(builtInVariable.handles);
        assert.deepStrictEqual(
          builtInVariable.handles.filter((variable) => !identifier.test(variable)),
          [],
        );
      }),
    composeTimeout,
  );
});

/**
 * An element particle of a toy section model.
 *
 * @param kind - The kind it names.
 * @returns The particle, occurring once.
 */
const toyElement = (kind: string): IrParticle => ({
  _tag: "element",
  kinds: [kind],
  occurs: { max: Option.some(1), min: 1 },
  sources: toySources(schemaVersions),
});

/**
 * A group of a toy section model, repeated without bound.
 *
 * @param compositor - Its compositor.
 * @param particles - Its particles.
 * @returns The group.
 */
const toyRepeated = (
  compositor: "choice" | "sequence",
  particles: readonly IrParticle[],
): IrParticle => ({
  _tag: "group",
  compositor,
  occurs: { max: Option.none(), min: 0 },
  particles,
  sources: toySources(schemaVersions),
});

describe("SectionPart's reading of a section's model", () => {
  it("takes the alternatives of a repeated choice, never the other kinds of a repeated sequence around it", () => {
    // Oracle: the specification as a checker: a section's parts are the alternatives of its
    // model's repeated choice, the XSD's spelling of the information model's `sectionPart`
    // (§6.46). The production model holds no repeated sequence, so a toy holds one.
    const parts = sectionPartsIn([
      {
        content: {
          _tag: "element-only",
          particle: toyRepeated("sequence", [
            toyElement("e1"),
            toyRepeated("choice", [toyElement("e2"), toyElement("e3")]),
          ]),
        },
        kind: reading.section,
        sources: toySources(schemaVersions),
        type: Option.none(),
        versions: schemaVersions,
      },
    ]);

    assert.deepStrictEqual(new Set(parts), new Set(["e2", "e3"]));
  });
});

/**
 * How long one toy case may run.
 */
const caseHang = Duration.minutes(1);

describe("references", () => {
  it.effect(
    "codes exactly the facets' rows, and refuses each named fault with its failure",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Fault>(faults, { cases: 300, sense: notesOnly }),
            draw: drawn(toyCase),
            kept: [],
            literal: Formatter.format,
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/references/coding",
          },
          ({ facets, fault }, c) =>
            Effect.gen(function* coding() {
              c.note(fault);

              const kinds = yield* Effect.fromResult(roster("NodeKind", toyKinds));
              const names = yield* Effect.fromResult(roster("AttributeName", toyNames));
              const outcome = references({ facets, kinds, names });

              assert.strictEqual(
                Result.isSuccess(outcome) ? "succeeded" : outcome.failure._tag,
                refusalOf[fault],
              );
              if (Result.isFailure(outcome)) {
                return;
              }

              const relations = outcome.success;
              const rows = facets.flatMap((facet) => facet.references);
              const declarations = facets.flatMap((facet) => facet.declarations);
              const builtIns = facets.flatMap((facet) => facet.builtIns);
              const bounds = facets.flatMap((facet) => facet.choiceBounds);
              const counts = facets.flatMap((facet) => facet.choiceCounts);
              const parts = new Set(facets.flatMap((facet) => facet.sectionParts));

              assert.deepStrictEqual(relations.declarationKind.handles, declarations);
              assert.deepStrictEqual(
                relations.builtInVariable.handles,
                builtIns.map(({ variable }) => variable),
              );
              assert.deepStrictEqual([...relations.spelling.handles], [...spellings]);
              for (const { declaration, variable } of builtIns) {
                assert.deepStrictEqual(
                  Option.map(relations.builtIn.lookup({ variable }), (row) => row.declaration),
                  Option.some(declaration),
                );
              }

              for (const kind of toyKinds) {
                assert.deepStrictEqual(
                  Option.map(relations.declares.lookup({ kind }), (row) => row.declaration),
                  declarations.includes(kind) ? Option.some(kind) : Option.none(),
                );
                assert.strictEqual(
                  Option.isSome(relations.sectionPart.lookup({ kind })),
                  parts.has(kind),
                );
                assert.deepStrictEqual(
                  Option.map(relations.choiceBound.lookup({ kind }), ({ max, min, zero }) =>
                    keyed(min, max, zero),
                  ),
                  Option.map(
                    Arr.findFirst(bounds, (bound) => bound.kind === kind),
                    ({ max, min, zero }) => keyed(min, max, zero),
                  ),
                );
                assert.deepStrictEqual(
                  Option.map(relations.choiceCount.lookup({ kind }), ({ choice }) => choice),
                  Option.map(
                    Arr.findFirst(counts, (count) => count.kind === kind),
                    ({ choice }) => choice,
                  ),
                );
                for (const attribute of toyNames) {
                  const stated = Arr.findFirst(
                    rows,
                    (row) => row.kind === kind && row.attribute === attribute,
                  );
                  assert.deepStrictEqual(
                    relations.variableReference
                      .lookup({ attribute, kind })
                      .pipe(Option.map((row) => row.spelling)),
                    stated.pipe(Option.map((row) => row.spelling)),
                  );
                  for (const declaration of declarations) {
                    assert.strictEqual(
                      Option.isSome(
                        relations.contentReference.lookup({ attribute, declaration, kind }),
                      ),
                      Option.exists(
                        stated,
                        ({ names: named }) =>
                          named._tag === "declaration" && named.kinds.includes(declaration),
                      ),
                    );
                  }
                }
              }
            }),
        ),
      ),
  );
});
