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
import {
  aritiesOf,
  cnDefaultType,
  cnForms,
  cnPatternOf,
  mappableBaseType,
  mathArities,
  mathHeadOperators,
  mathHeadQualifiers,
} from "#pantry/grammar/expression.ts";
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
 * One interaction's binding as the information model states it (section 2.4,
 * https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4): the section, the base types and
 * cardinalities a typed response variable it is bound to may take, and whether it may be bound to
 * a record. Every interaction section with a binding sentence is here but the order interaction's
 * (section 2.4.1.2), which stands where the information model marks it not normative, while its
 * class description (section 5.97) states none (spec reading 172); the custom and portable custom
 * interactions (sections 2.4.4.5 and 2.4.4.6) state none either, so these three bind nothing.
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
 * state `BindingFit`'s rows. Each comment quotes the sentence.
 */
const statedBindings: readonly StatedBinding[] = [
  // "must be bound to a response variable with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-choice-interaction",
    record: false,
    section: "2.4.1.1",
  },
  // "with base-type pair and either single or multiple cardinality"
  {
    baseTypes: ["pair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-associate-interaction",
    record: false,
    section: "2.4.1.3",
  },
  // "with base-type 'directedPair' and either single or multiple cardinality"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-match-interaction",
    record: false,
    section: "2.4.1.4",
  },
  // "with base-type 'directedPair' and either single or multiple cardinality, depending on the number of gaps"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-gap-match-interaction",
    record: false,
    section: "2.4.1.5",
  },
  // "with a base-type of identifier and single cardinality only"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single"],
    kind: "qti-inline-choice-interaction",
    record: false,
    section: "2.4.2.1",
  },
  // "with either single or record cardinality only. For single cardinality the base-type must be
  // one of string, integer or float"
  {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single"],
    kind: "qti-text-entry-interaction",
    record: true,
    section: "2.4.2.2",
  },
  // "of single, multipe, ordered or record cardinality ... Otherwise it must have a base-type of
  // string, integer or float"
  {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "multiple", "ordered"],
    kind: "qti-extended-text-interaction",
    record: true,
    section: "2.4.2.3",
  },
  // "with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-hottext-interaction",
    record: false,
    section: "2.4.2.4",
  },
  // "with a base-type of identifier and single or multiple cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
    kind: "qti-hotspot-interaction",
    record: false,
    section: "2.4.3.1",
  },
  // "with a base-type of identifier and ordered cardinality"
  {
    baseTypes: ["identifier"],
    cardinalities: ["ordered"],
    kind: "qti-graphic-order-interaction",
    record: false,
    section: "2.4.3.2",
  },
  // "with base-type pair and either single or multiple cardinality"
  {
    baseTypes: ["pair"],
    cardinalities: ["single", "multiple"],
    kind: "qti-graphic-associate-interaction",
    record: false,
    section: "2.4.3.3",
  },
  // "with base-type 'directedPair' and multiple cardinality"
  {
    baseTypes: ["directedPair"],
    cardinalities: ["multiple"],
    kind: "qti-graphic-gap-match-interaction",
    record: false,
    section: "2.4.3.4",
  },
  // "with a base-type of point and single or multiple cardinality"
  {
    baseTypes: ["point"],
    cardinalities: ["single", "multiple"],
    kind: "qti-select-point-interaction",
    record: false,
    section: "2.4.3.5",
  },
  // "with a base-type of point and single or multiple cardinality"
  {
    baseTypes: ["point"],
    cardinalities: ["single", "multiple"],
    kind: "qti-position-object-interaction",
    record: false,
    section: "2.4.3.6",
  },
  // "with single cardinality with a base-type of either integer or float"
  {
    baseTypes: ["integer", "float"],
    cardinalities: ["single"],
    kind: "qti-slider-interaction",
    record: false,
    section: "2.4.4.1",
  },
  // "which must be of base-type integer and single cardinality"
  {
    baseTypes: ["integer"],
    cardinalities: ["single"],
    kind: "qti-media-interaction",
    record: false,
    section: "2.4.4.2",
  },
  // "with base-type file and single cardinality"
  {
    baseTypes: ["file"],
    cardinalities: ["single"],
    kind: "qti-drawing-interaction",
    record: false,
    section: "2.4.4.3",
  },
  // "with base-type file and single cardinality"
  {
    baseTypes: ["file"],
    cardinalities: ["single"],
    kind: "qti-upload-interaction",
    record: false,
    section: "2.4.4.4",
  },
  // "with base-type boolean and single cardinality"
  {
    baseTypes: ["boolean"],
    cardinalities: ["single"],
    kind: "qti-end-attempt-interaction",
    record: false,
    section: "2.4.5",
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
    "hold exactly the (base type, cardinality, kind) triples and the record kinds section 2.4's binding sentences state",
    () =>
      // Oracle: the specification as a checker, each interaction's binding sentence of the
      // information model's section 2.4, stated above from its text. Set equality: a row the
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

/**
 * Every row of `mathArities` before selector and partialdiff were added and the own qualifiers were
 * folded into `mathHeadQualifiers`: operator, least, greatest, section, qualifiers.
 */
const arityRowsBefore: readonly (readonly [string, number, number, string, readonly string[]])[] = [
  ["m:inverse", 1, 1, "4.4.1.2", []],
  ["m:ident", 1, 1, "4.4.1.5", []],
  ["m:domain", 1, 1, "4.4.1.6", []],
  ["m:codomain", 1, 1, "4.4.1.7", []],
  ["m:image", 1, 1, "4.4.1.8", []],
  ["m:factorial", 1, 1, "4.4.2.2", []],
  ["m:not", 1, 1, "4.4.2.16", []],
  ["m:abs", 1, 1, "4.4.2.20", []],
  ["m:conjugate", 1, 1, "4.4.2.21", []],
  ["m:arg", 1, 1, "4.4.2.22", []],
  ["m:real", 1, 1, "4.4.2.23", []],
  ["m:imaginary", 1, 1, "4.4.2.24", []],
  ["m:floor", 1, 1, "4.4.2.26", []],
  ["m:ceiling", 1, 1, "4.4.2.27", []],
  ["m:divergence", 1, 1, "4.4.4.4", []],
  ["m:grad", 1, 1, "4.4.4.5", []],
  ["m:curl", 1, 1, "4.4.4.6", []],
  ["m:laplacian", 1, 1, "4.4.4.7", []],
  ["m:card", 1, 1, "4.4.5.12", []],
  ["m:sin", 1, 1, "4.4.7.1", []],
  ["m:cos", 1, 1, "4.4.7.1", []],
  ["m:tan", 1, 1, "4.4.7.1", []],
  ["m:sec", 1, 1, "4.4.7.1", []],
  ["m:csc", 1, 1, "4.4.7.1", []],
  ["m:cot", 1, 1, "4.4.7.1", []],
  ["m:arcsin", 1, 1, "4.4.7.2", []],
  ["m:arccos", 1, 1, "4.4.7.2", []],
  ["m:arctan", 1, 1, "4.4.7.2", []],
  ["m:arcsec", 1, 1, "4.4.7.2", []],
  ["m:arccsc", 1, 1, "4.4.7.2", []],
  ["m:arccot", 1, 1, "4.4.7.2", []],
  ["m:sinh", 1, 1, "4.4.7.3", []],
  ["m:cosh", 1, 1, "4.4.7.3", []],
  ["m:tanh", 1, 1, "4.4.7.3", []],
  ["m:sech", 1, 1, "4.4.7.3", []],
  ["m:csch", 1, 1, "4.4.7.3", []],
  ["m:coth", 1, 1, "4.4.7.3", []],
  ["m:arcsinh", 1, 1, "4.4.7.4", []],
  ["m:arccosh", 1, 1, "4.4.7.4", []],
  ["m:arctanh", 1, 1, "4.4.7.4", []],
  ["m:arcsech", 1, 1, "4.4.7.4", []],
  ["m:arccsch", 1, 1, "4.4.7.4", []],
  ["m:arccoth", 1, 1, "4.4.7.4", []],
  ["m:exp", 1, 1, "4.4.7.5", []],
  ["m:ln", 1, 1, "4.4.7.6", []],
  ["m:log", 1, 1, "4.4.7.7", ["m:logbase"]],
  ["m:determinant", 1, 1, "4.4.9.4", []],
  ["m:transpose", 1, 1, "4.4.9.5", []],
  ["m:quotient", 2, 2, "4.4.2.1", []],
  ["m:divide", 2, 2, "4.4.2.3", []],
  ["m:power", 2, 2, "4.4.2.8", []],
  ["m:rem", 2, 2, "4.4.2.9", []],
  ["m:implies", 2, 2, "4.4.2.17", []],
  ["m:neq", 2, 2, "4.4.3.2", []],
  ["m:equivalent", 2, 2, "4.4.3.7", []],
  ["m:approx", 2, 2, "4.4.3.8", []],
  ["m:factorof", 2, 2, "4.4.3.9", []],
  ["m:in", 2, 2, "4.4.5.5", []],
  ["m:notin", 2, 2, "4.4.5.6", []],
  ["m:notsubset", 2, 2, "4.4.5.9", []],
  ["m:notprsubset", 2, 2, "4.4.5.10", []],
  ["m:setdiff", 2, 2, "4.4.5.11", []],
  ["m:tendsto", 2, 2, "4.4.6.4", []],
  ["m:vectorproduct", 2, 2, "4.4.9.7", []],
  ["m:scalarproduct", 2, 2, "4.4.9.8", []],
  ["m:outerproduct", 2, 2, "4.4.9.9", []],
  ["m:minus", 1, 2, "4.4.2.6", []],
  ["m:root", 1, 2, "4.4.2.11", ["m:degree"]],
];

describe("mathArities", () => {
  it("keeps every row it held, unchanged", () => {
    const kept = arityRowsBefore.map(([kind]) => {
      const row = mathArities.get(kind);

      return [kind, row?.min, row?.max, row?.section, row?.qualifiers];
    });

    assert.deepStrictEqual(JSON.stringify(kept), JSON.stringify(arityRowsBefore));
  });

  it("gives selector one argument or more, with no greatest (MathML 3, 4.4.9.6)", () => {
    const row = mathArities.get("m:selector");

    assert.deepStrictEqual(
      [row?.min, row?.max, row?.section],
      [1, Number.POSITIVE_INFINITY, "4.4.9.6"],
    );
  });

  it("gives partialdiff two arguments when it has no bvar (MathML 3, 4.4.4.3)", () => {
    const row = mathArities.get("m:partialdiff");

    assert.deepStrictEqual([row?.min, row?.max, row?.section], [2, 2, "4.4.4.3"]);
  });
});

/**
 * Whether `mathHeadQualifiers` lists a qualifier beside a head.
 */
const admits = (head: string, qualifier: string): boolean =>
  mathHeadQualifiers.some((row) => row.head === head && row.qualifier === qualifier);

describe("mathHeadQualifiers", () => {
  it("lists each head's qualifier with its section (R6-head-qualifiers)", () => {
    assert.deepStrictEqual(
      mathHeadQualifiers
        .map(({ head, qualifier, section }) => `${head} ${qualifier} ${section}`)
        .toSorted((a, b) => a.localeCompare(b)),
      [
        "m:diff m:degree 4.4.4.2",
        "m:log m:logbase 4.4.7.7",
        "m:moment m:degree 4.4.8.6",
        "m:moment m:momentabout 4.4.8.6",
        "m:partialdiff m:degree 4.4.4.3",
        "m:root m:degree 4.4.2.11",
      ],
    );
  });

  it("admits logbase beside log and not beside sin", () => {
    assert.isTrue(admits("m:log", "m:logbase"));
    assert.isFalse(admits("m:sin", "m:logbase"));
  });

  it("judges every operator of the arity table and every head", () => {
    assert.isTrue([...mathArities.keys()].every((kind) => mathHeadOperators.has(kind)));
    assert.isTrue(mathHeadQualifiers.every(({ head }) => mathHeadOperators.has(head)));
    assert.isTrue(["m:plus", "m:forall", "m:exists"].every((kind) => mathHeadOperators.has(kind)));
  });

  it("folds into the arity table's own qualifiers", () => {
    assert.deepStrictEqual(mathArities.get("m:log")?.qualifiers, ["m:logbase"]);
    assert.deepStrictEqual(mathArities.get("m:root")?.qualifiers, ["m:degree"]);
    assert.deepStrictEqual(mathArities.get("m:sin")?.qualifiers, []);
  });
});

/**
 * Whether a pattern, anchored as XML Schema anchors one, matches a whole text.
 */
const matches = (pattern: string | undefined, text: string): boolean =>
  pattern !== undefined && new RegExp(`^(?:${pattern})$`, "u").test(text);

const pattern = (form: "double" | "hexdouble" | "integer" | "real", base: number) =>
  Option.getOrUndefined(cnPatternOf(form, base));

describe("cn forms", () => {
  it("gives each type the forms of its parts in order (R6-hexdouble, MathML 3 4.2.1)", () => {
    assert.deepStrictEqual(
      [...cnForms].toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["complex-cartesian", ["real", "real"]],
        ["complex-polar", ["real", "real"]],
        ["double", ["double"]],
        ["e-notation", ["real", "integer"]],
        ["hexdouble", ["hexdouble"]],
        ["integer", ["integer"]],
        ["rational", ["integer", "integer"]],
        ["real", ["real"]],
      ],
    );
    assert.strictEqual(cnForms.get("rational")?.length, 2);
    assert.strictEqual(cnDefaultType, "real");
  });

  it("reads a hexdouble as sixteen hex digits of either case", () => {
    const hex = pattern("hexdouble", 10);

    assert.isTrue(matches(hex, "7ff8000000000000"));
    assert.isTrue(matches(hex, "7FF800000000000a"));
    assert.isFalse(matches(hex, "7ff8"));
  });

  it("reads an integer in the digits of its base", () => {
    const hex = pattern("integer", 16);

    assert.isTrue(matches(hex, "FF"));
    assert.isTrue(matches(hex, "-7e"));
    assert.isTrue(matches(hex, "+7e"));
    assert.isFalse(matches(hex, "G1"));
    assert.isFalse(matches(hex, ""));
    assert.isFalse(matches(pattern("integer", 10), "a"));
    assert.isFalse(matches(pattern("integer", 2), "2"));
    assert.isTrue(matches(pattern("integer", 36), "Zz"));
  });

  it("reads a real with at most one point and a digit", () => {
    const decimal = pattern("real", 10);

    assert.isTrue(matches(decimal, "-1.5"));
    assert.isTrue(matches(decimal, "1."));
    assert.isTrue(matches(decimal, ".5"));
    assert.isFalse(matches(decimal, "1.2.3"));
    assert.isFalse(matches(decimal, "."));
  });

  it("reads a double as the lexical space of xs:double", () => {
    const double = pattern("double", 10);

    assert.isTrue(["1.5e-3", "INF", "-INF", "NaN", ".5"].every((text) => matches(double, text)));
    assert.isFalse(matches(double, "inf"));
  });

  it("has no integer or real pattern for a base outside 2 to 36", () => {
    assert.isTrue(Option.isNone(cnPatternOf("integer", 40)));
    assert.isTrue(Option.isNone(cnPatternOf("real", 1)));
    assert.isTrue(Option.isSome(cnPatternOf("double", 40)));
  });
});
