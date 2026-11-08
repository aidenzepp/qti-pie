import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { int8Max, roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { aritiesOf, mappableBaseType } from "#pantry/grammar/expression.ts";
import { baseTypes } from "#pantry/grammar/attributes.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { Occurs, Particle as IrParticle } from "#pantry/vocab/inventory/types.ts";
import {
  elementsOf,
  loadXsd,
  resolverOf,
  toySources,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type { Particle } from "#pantry/test/gen/grammar.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 50.9 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * Whether every pinned XSD is in the cache; without them the XSD read is skipped.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * The operator whose operands are every expression (information model, `And`): the oracle reads the
 * expression kinds as the kinds its content model names.
 */
const anyExpression = "qti-and";

/**
 * The least and greatest count of something, `Infinity` for no greatest.
 */
interface Bounds {
  readonly max: number;
  readonly min: number;
}

/**
 * The least and greatest number of element children a particle's valid contents hold, by XML
 * Schema Part 1's occurrence arithmetic: an element counts 1, a sequence the sum of its particles',
 * a choice the least or greatest of its alternatives', each times the particle's own bounds;
 * `Infinity` for no greatest.
 *
 * @param particle - The particle.
 * @returns The bounds.
 */
const childBounds = (particle: Particle): Bounds => {
  const inner = ((): Bounds => {
    switch (particle._tag) {
      case "element":
      case "any": {
        return { max: 1, min: 1 };
      }
      case "sequence":
      case "all": {
        const parts = particle.particles.map(childBounds);

        return {
          max: parts.reduce((sum, { max }) => sum + max, 0),
          min: parts.reduce((sum, { min }) => sum + min, 0),
        };
      }
      case "choice": {
        const parts = particle.particles.map(childBounds);

        return parts.length === 0
          ? { max: 0, min: 0 }
          : {
              max: Math.max(...parts.map(({ max }) => max)),
              min: Math.min(...parts.map(({ min }) => min)),
            };
      }
      default: {
        return particle satisfies never;
      }
    }
  })();

  return {
    max: inner.max === 0 ? 0 : inner.max * particle.occurs.max,
    min: inner.min * particle.occurs.min,
  };
};

describe.skipIf(!cached)("OperatorArity against the ASI XSDs", () => {
  it.effect(
    "holds exactly the expression kinds, each at the occurrence arithmetic of its content model, in both versions",
    () =>
      Effect.gen(function* arity() {
        const { kinds: composedKinds, operatorArity: relation } = yield* grammar;
        for (const root of ["imsqti_asiv3p0_v1p0.xsd", "imsqti_asiv3p0p1_v1p0.xsd"] as const) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, (namespace, local, parent) =>
            resolverOf(composedKinds)(namespace, local, parent),
          );
          const expressions = new Set(
            (contents.get(anyExpression) ?? [])
              .flatMap(({ particle }) => Option.toArray(particle))
              .flatMap(elementsOf)
              .flatMap(({ members }) => members)
              .flatMap(({ name }) =>
                Option.toArray(
                  resolverOf(composedKinds)(name.namespace, name.local, anyExpression),
                ),
              ),
          );

          assert.deepStrictEqual(
            new Set(relation.rows.map(({ kind }) => kind)),
            expressions,
            `${root}: the expression kinds`,
          );

          const differing = relation.rows.flatMap(({ kind, max, min }) => {
            const [content] = contents.get(kind) ?? [];
            const bounds = Option.match(
              Option.flatMap(Option.fromNullishOr(content), ({ particle }) => particle),
              {
                onNone: () => ({ max: 0, min: 0 }),
                onSome: childBounds,
              },
            );
            const xsdMax = Number.isFinite(bounds.max) ? BigInt(bounds.max) : int8Max;

            return BigInt(bounds.min) === min && xsdMax === max
              ? []
              : [`${root} ${kind}: ${min}..${max} against the XSD's ${bounds.min}..${bounds.max}`];
          });

          assert.isAbove(relation.rows.length, 0);
          assert.deepStrictEqual(differing, []);
        }
      }).pipe(Effect.provide(XsdOracleLayer)),
    testTimeoutMs,
  );
});

/**
 * One interaction's binding as the information model states it, in its class description (section
 * 5, as https://www.imsglobal.org/spec/qti/v3p0/info#Data_ChoiceInteraction): the section, the base
 * types and cardinalities a typed response variable it is bound to may take, and whether it may be
 * bound to a record. Every interaction class with a binding sentence is here; the custom and
 * portable custom interactions (sections 5.36 and 5.106) state none, so they bind nothing. The
 * order interaction's class description (section 5.97) states none either: its row's one carrier
 * is section 2.4.1.2, which the information model marks not normative, and it stands until the
 * schema change that drops it (`#pantry/import/refusal.sources.test.ts` knows it).
 */
interface StatedBinding {
  readonly baseTypes: readonly string[];
  readonly cardinalities: readonly string[];
  readonly kind: string;
  readonly record: boolean;
  readonly section: string;
}

/**
 * The information model's binding sentences, read off its text, independently of the facets that
 * state `BindingFit`'s rows. Each comment quotes the sentence of the section it names.
 */
const statedBindings: readonly StatedBinding[] = [
  // "must be bound to a response variable with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-choice-interaction",
    record: false,
    section: "5.30",
  },
  // Section 2.4.1.2, not normative: "with a base-type of identifier and ordered cardinality only"
  {
    baseTypes: ["identifier"],
    cardinalities: ["ordered"],
    kind: "qti-order-interaction",
    record: false,
    section: "2.4.1.2",
  },
  // "with base-type pair and either single or multiple cardinality"
  {
    baseTypes: ["pair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-associate-interaction",
    record: false,
    section: "5.8",
  },
  // "with base-type 'directedPair' and either single or multiple cardinality"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-match-interaction",
    record: false,
    section: "5.89",
  },
  // "with base-type directedPair and either single or multiple cardinality, depending on the number of gaps"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-gap-match-interaction",
    record: false,
    section: "5.57",
  },
  // "with a base-type of identifier and single cardinality only"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single"],
    kind: "qti-inline-choice-interaction",
    record: false,
    section: "5.74",
  },
  // "with single or record cardinality only. If the response variable has single cardinality the
  // base-type must be one of string, integer or float"
  {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single"],
    kind: "qti-text-entry-interaction",
    record: true,
    section: "5.162",
  },
  // "of single, multiple, ordered or record cardinality ... Otherwise it ust [sic] have a
  // base-type of string, integer or float"
  {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "multiple", "ordered"],
    kind: "qti-extended-text-interaction",
    record: true,
    section: "5.48",
  },
  // "with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-hottext-interaction",
    record: false,
    section: "5.66",
  },
  // "with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-hotspot-interaction",
    record: false,
    section: "5.68",
  },
  // "with a base-type of identifier and ordered cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["ordered"],
    kind: "qti-graphic-order-interaction",
    record: false,
    section: "5.61",
  },
  // "with base-type pair and either single or multiple cardinality"
  {
    baseTypes: ["pair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-graphic-associate-interaction",
    record: false,
    section: "5.59",
  },
  // "with base-type directedPair and multiple cardinality"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["multiple"],
    kind: "qti-graphic-gap-match-interaction",
    record: false,
    section: "5.60",
  },
  // "with a base-type of point and single or multiple cardinality"
  {
    baseTypes: ["point"],
    cardinalities: ["single", "multiple"],
    kind: "qti-select-point-interaction",
    record: false,
    section: "5.128",
  },
  // "with a base-type of point and single or multiple cardinality"
  {
    baseTypes: ["point"],
    cardinalities: ["single", "multiple"],
    kind: "qti-position-object-interaction",
    record: false,
    section: "5.107",
  },
  // "with single cardinality with a base-type of either integer or float"
  {
    baseTypes: ["integer", "float"],
    cardinalities: ["single"],
    kind: "qti-slider-interaction",
    record: false,
    section: "5.134",
  },
  // "which must be of base-type integer and single cardinality"
  {
    baseTypes: ["integer"],
    cardinalities: ["single"],
    kind: "qti-media-interaction",
    record: false,
    section: "5.92",
  },
  // "with base-type file and single cardinality"
  {
    baseTypes: ["file"],
    cardinalities: ["single"],
    kind: "qti-drawing-interaction",
    record: false,
    section: "5.44",
  },
  // "with base-type file and single cardinality"
  {
    baseTypes: ["file"],
    cardinalities: ["single"],
    kind: "qti-upload-interaction",
    record: false,
    section: "5.165",
  },
  // "with base-type boolean and single cardinality"
  {
    baseTypes: ["boolean"],
    cardinalities: ["single"],
    kind: "qti-end-attempt-interaction",
    record: false,
    section: "5.45",
  },
];

/**
 * Write a binding as one comparable string.
 *
 * @param baseType - Its base type.
 * @param cardinality - Its cardinality.
 * @param kind - Its interaction's kind.
 * @returns The three, space-separated.
 */
const triple = (baseType: string, cardinality: string, kind: string): string =>
  `${kind} ${baseType} ${cardinality}`;

describe("BindingFit and RecordBindingFit against the information model", () => {
  it.effect(
    "hold exactly the (base type, cardinality, kind) triples and the record kinds the binding sentences state",
    () =>
      // Oracle: the specification as a checker, each interaction class's binding sentence in the
      // information model, stated above from its text. Set equality: a row the
      // sentences do not state, and one they state that the relation lacks, both fail.
      Effect.gen(function* bindings() {
        const { bindingFit, recordBindingFit } = yield* grammar;

        assert.deepStrictEqual(
          new Set(
            bindingFit.rows.map(({ baseType, cardinality, kind }) =>
              triple(baseType, cardinality, kind),
            ),
          ),
          new Set(
            statedBindings.flatMap(({ baseTypes: types, cardinalities, kind }) =>
              types.flatMap((baseType) =>
                cardinalities.map((cardinality) => triple(baseType, cardinality, kind)),
              ),
            ),
          ),
        );
        assert.deepStrictEqual(
          new Set(recordBindingFit.rows.map(({ kind }) => kind)),
          new Set(statedBindings.filter(({ record }) => record).map(({ kind }) => kind)),
        );
      }),
  );
});

/**
 * The most children the naive count sets below track: the greatest finite count the box below
 * holds, a group of 3 groups of 3 elements, each at most twice (2 × 3 × 2 × 3 × 2).
 */
const countCap = 72;

/**
 * Every sum of one count of each set, those past {@link countCap} dropped and `Infinity` kept.
 *
 * @param left - One set of counts.
 * @param right - The other.
 * @returns The sums.
 */
const sumOf = (left: ReadonlySet<number>, right: ReadonlySet<number>): ReadonlySet<number> =>
  new Set(
    [...left]
      .flatMap((a) => [...right].map((b) => a + b))
      .filter((count) => count <= countCap || count === Number.POSITIVE_INFINITY),
  );

/**
 * The child counts a particle's valid contents may hold, as a set, by brute force: an element is
 * 1, a sequence or all group every sum of one count of each of its particles, a choice any of its
 * alternatives' (0 for an empty one, as XML Schema Part 1's effective total range reads it), and
 * `k` occurrences every sum of `k` counts, for each `k` its bounds allow. Counts past
 * {@link countCap} are dropped, and an unbounded particle with a positive count holds arbitrarily
 * many, `Infinity`, which every sum with it keeps. A second implementation of
 * the interval arithmetic `aritiesOf` reads, over sets instead of bounds.
 *
 * @param particle - The particle.
 * @returns The counts.
 */
const countsOf = (particle: IrParticle): ReadonlySet<number> => {
  const inner = ((): ReadonlySet<number> => {
    switch (particle._tag) {
      case "element":
      case "any": {
        return new Set([1]);
      }
      case "group": {
        const parts = particle.particles.map(countsOf);

        if (particle.compositor === "choice") {
          return new Set(parts.length === 0 ? [0] : parts.flatMap((part) => [...part]));
        }

        let sums: ReadonlySet<number> = new Set([0]);
        for (const part of parts) {
          sums = sumOf(sums, part);
        }

        return sums;
      }
      default: {
        return particle satisfies never;
      }
    }
  })();
  const most = Option.getOrElse(particle.occurs.max, () => countCap);
  const held = new Set<number>();
  let repeated: ReadonlySet<number> = new Set([0]);
  for (let times = 0; times <= most; times += 1) {
    if (times >= particle.occurs.min) {
      for (const count of repeated) {
        held.add(count);
      }
    }

    repeated = sumOf(repeated, inner);
  }

  return Option.isNone(particle.occurs.max) && [...inner].some((count) => count > 0)
    ? new Set([...held, Number.POSITIVE_INFINITY])
    : held;
};

/**
 * Occurrence bounds in a small box: least 0 to 2, greatest 0 to 2 or unbounded, the least never
 * above the greatest.
 */
const occursGen: Gen<Occurs> = (source) => {
  const max = source.draw(
    weighted<Option.Option<number>>([
      [3, (inner) => Option.some(inner.draw(int(0, 2)))],
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
};

/**
 * An element particle, its bounds drawn.
 */
const leafGen: Gen<IrParticle> = (source) => ({
  _tag: "element",
  kinds: ["e1"],
  occurs: source.draw(occursGen),
  sources: toySources(schemaVersions),
});

/**
 * A particle tree at most `depth` groups deep, groups of 0 to 3 particles of any compositor.
 *
 * @param depth - The depth.
 * @returns The generator.
 */
const particleGen = (depth: number): Gen<IrParticle> => {
  const group: Gen<IrParticle> = (source) => ({
    _tag: "group",
    compositor: source.draw(element(["sequence", "choice", "all"] as const)),
    occurs: source.draw(occursGen),
    particles: source.draw(array(particleGen(depth - 1), { max: 3, min: 0 })),
    sources: toySources(schemaVersions),
  });

  return depth === 0
    ? leafGen
    : weighted([
        [1, leafGen],
        [1, group],
      ]);
};

/**
 * What an arity case reaches: a group that holds no child repeated without bound (0 times
 * infinity), a greatest of 0, an unbounded count, and an empty choice.
 */
type ArityFeature = "empty unbounded" | "empty choice" | "max 0" | "unbounded";

/**
 * The situations a particle holds.
 *
 * @param particle - The particle.
 * @returns Its situations.
 */
const arityFeaturesOf = (particle: IrParticle): readonly ArityFeature[] => {
  const own: ArityFeature[] = [];
  if (Option.contains(particle.occurs.max, 0)) {
    own.push("max 0");
  }

  if (Option.isNone(particle.occurs.max)) {
    own.push("unbounded");
    if (!countsOf({ ...particle, occurs: { max: Option.some(1), min: 1 } }).has(1)) {
      own.push("empty unbounded");
    }
  }

  return particle._tag === "group"
    ? [
        ...own,
        ...(particle.compositor === "choice" && particle.particles.length === 0
          ? (["empty choice"] as const)
          : []),
        ...particle.particles.flatMap(arityFeaturesOf),
      ]
    : own;
};

describe("OperatorArity's occurrence arithmetic against a naive count set", () => {
  it.effect(
    "gives every content's least and greatest child count, int8Max for none, the brute-force set's",
    (ctx) =>
      // Bound: particle trees 2 groups deep, groups of up to 3, bounds 0 to 2 or unbounded, so
      // every finite count is at most countCap.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<ArityFeature>(
              ["empty unbounded", "empty choice", "max 0", "unbounded"],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(particleGen(2)),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the set of a particle's child counts by brute force (countsOf)",
            },
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/expression/arity",
          },
          (particle, c) =>
            Effect.sync(() => {
              c.noteAll(arityFeaturesOf(particle));

              const counts = [...countsOf(particle)];
              const [row] = aritiesOf(
                [
                  {
                    content: { _tag: "element-only", particle },
                    kind: "e0",
                    sources: toySources(schemaVersions),
                    type: Option.none(),
                    versions: schemaVersions,
                  },
                ],
                new Set(["e0"]),
              );
              const most = counts.length === 0 ? 0 : Math.max(...counts);

              assert.deepStrictEqual(row === undefined ? undefined : [row.min, row.max], [
                BigInt(counts.length === 0 ? 0 : Math.min(...counts)),
                Number.isFinite(most) ? BigInt(most) : int8Max,
              ]);
            }),
        ),
      ),
  );
});

describe("MappableBaseType", () => {
  it.effect("holds every base type but the two with no map key, duration and file (spec 4.3)", () =>
    Effect.gen(function* mappable() {
      const relation = yield* Effect.fromResult(
        mappableBaseType(yield* Effect.fromResult(roster("BaseType", baseTypes))),
      );

      assert.deepStrictEqual(
        relation.rows.map(({ baseType }) => baseType),
        baseTypes.filter((baseType) => baseType !== "duration" && baseType !== "file"),
      );
    }),
  );
});
