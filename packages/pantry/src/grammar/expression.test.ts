import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { int8Max, roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { mappableBaseType } from "#pantry/grammar/expression.ts";
import { baseTypes } from "#pantry/grammar/attributes.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import {
  elementsOf,
  loadXsd,
  resolverOf,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type { Particle } from "#pantry/test/gen/grammar.ts";

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
    120_000,
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
