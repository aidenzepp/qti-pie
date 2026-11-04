import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import type { SingleSchema } from "#plate/codec/values.ts";
import { decodeStoredFloat, ValueSchema } from "#plate/codec/values.ts";
import { nullOf } from "#plate/model/values.ts";
import type { ModelledBaseType, Single, Value } from "#plate/model/values.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * {@link ValueSchema}'s type is the plain {@link Value}; `tsc` refuses this line when they part.
 */
const valuePinned: Equals<typeof ValueSchema.Type, Value> = true;

/**
 * {@link SingleSchema}'s type is the plain {@link Single}; `tsc` refuses this line when they part.
 */
const singlePinned: Equals<typeof SingleSchema.Type, Single> = true;

/**
 * Construct a value for a test.
 *
 * @param baseType The value's base type.
 * @param cardinality The value's cardinality.
 * @param values Its values.
 * @returns The value.
 */
const value = (
  baseType: ModelledBaseType,
  cardinality: Value["cardinality"],
  values: readonly Single[],
): Value => ({ baseType, cardinality, values });

/**
 * Construct identifier values for a test.
 *
 * @param names The identifiers, in order.
 * @returns One identifier value for each name.
 */
const identifiers = (...names: readonly string[]): readonly Single[] =>
  names.map((name) => ({ baseType: "identifier", value: name }));

/**
 * Construct untyped input for {@link ValueSchema}, with cardinality `single`.
 *
 * @param baseType The input's base type, possibly not a modelled one.
 * @param values Its values, possibly not ones the base type holds.
 * @returns The input object.
 */
const singleInput = (baseType: string, values: readonly object[]) => ({
  baseType,
  cardinality: "single",
  values,
});

describe("ValueSchema", () => {
  it.effect("encodes and decodes through its Schema", () =>
    Effect.gen(function* valueRoundTrips() {
      const values: readonly Value[] = [
        value("identifier", "multiple", identifiers("A", "B", "B")),
        value("pair", "single", [{ baseType: "pair", value: ["A", "B"] }]),
        value("float", "ordered", [
          { baseType: "float", value: 2.5 },
          { baseType: "float", value: Number.POSITIVE_INFINITY },
        ]),
        value("integer", "single", [{ baseType: "integer", value: 2n ** 53n + 1n }]),
        value("boolean", "single", [{ baseType: "boolean", value: true }]),
        value("string", "single", [{ baseType: "string", value: " a " }]),
        nullOf("uri", "single"),
      ];
      for (const original of values) {
        const encoded = yield* Schema.encodeEffect(ValueSchema)(original);
        const decoded = yield* Schema.decodeUnknownEffect(ValueSchema)(encoded);
        assert.deepStrictEqual(decoded, original);
      }
    }),
  );

  it.effect("encodes an integer as its decimal digits and decodes them to the same bigint", () =>
    Effect.gen(function* integerAsDigits() {
      const original = value("integer", "single", [{ baseType: "integer", value: -(10n ** 30n) }]);
      const encoded = yield* Schema.encodeEffect(ValueSchema)(original);

      assert.deepStrictEqual(encoded, {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: "-1000000000000000000000000000000" }],
      });
      assert.deepStrictEqual(yield* Schema.decodeUnknownEffect(ValueSchema)(encoded), original);
    }),
  );

  it.effect(
    "carries a float that is infinite, not a number or negative zero through JSON text unchanged",
    () =>
      Effect.gen(function* nonFiniteFloatsThroughJson() {
        for (const number of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN, -0]) {
          const encoded = yield* Schema.encodeEffect(ValueSchema)(
            value("float", "single", [{ baseType: "float", value: number }]),
          );
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the value survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
          const handedBack: unknown = JSON.parse(JSON.stringify(encoded));
          const decoded = yield* Schema.decodeUnknownEffect(ValueSchema)(handedBack);
          const [single] = decoded.values;

          assert.strictEqual(single?.baseType, "float", String(number));
          assert.isTrue(Object.is(single?.value, number), String(number));
        }
      }),
  );

  it.effect(
    'writes the infinities, NaN and negative zero as "INF", "-INF", "NaN" and "-0", and every other float as a number',
    () =>
      Effect.gen(function* floatEncodedForms() {
        const encoded = yield* Schema.encodeEffect(ValueSchema)(
          value(
            "float",
            "ordered",
            [
              Number.POSITIVE_INFINITY,
              Number.NEGATIVE_INFINITY,
              Number.NaN,
              -0,
              0,
              2.5,
              -1e300,
            ].map((number) => ({ baseType: "float", value: number })),
          ),
        );

        assert.deepStrictEqual(
          encoded.values.map((single) => single.value),
          ["INF", "-INF", "NaN", "-0", 0, 2.5, -1e300],
        );
      }),
  );

  it('refuses a stored float written as "Infinity", "inf" or "1.5"', () => {
    for (const written of ["Infinity", "inf", "1.5"]) {
      const decoded = Schema.decodeUnknownResult(ValueSchema)(
        singleInput("float", [{ baseType: "float", value: written }]),
      );

      assert.isTrue(Result.isResult(decoded), written);
      assert.isTrue(Result.isFailure(decoded), written);
    }
  });

  it("refuses a value of another base type, an invalid value and two values in a single", () => {
    const valid = Schema.is(ValueSchema);
    assert.isTrue(valid(singleInput("integer", [{ baseType: "integer", value: 1n }])));
    assert.isTrue(valid(singleInput("integer", [{ baseType: "integer", value: 2n ** 53n + 1n }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: 1 }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: 2 ** 53 }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "float", value: 1 }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: "1" }])));
    assert.isFalse(valid(singleInput("integer", [{ baseType: "integer", value: 1.5 }])));
    assert.isFalse(valid(singleInput("identifier", [{ baseType: "identifier", value: "1" }])));
    assert.isFalse(valid(singleInput("pair", [{ baseType: "pair", value: ["A", "1"] }])));
    assert.isFalse(valid(singleInput("string", [{ baseType: "string", value: "" }])));
    assert.isFalse(valid(singleInput("identifier", identifiers("A", "B"))));
    assert.isFalse(valid(singleInput("point", [])));
    assert.isFalse(valid({ baseType: "identifier", cardinality: "record", values: [] }));
  });
});

describe("decodeStoredFloat", () => {
  it("reads a stored float as the number it stands for, and refuses a name the codec never writes", () => {
    for (const [stored, number] of [
      [2.5, 2.5],
      ["INF", Number.POSITIVE_INFINITY],
      ["-INF", Number.NEGATIVE_INFINITY],
      ["NaN", Number.NaN],
      ["-0", -0],
    ] as const) {
      const decoded = decodeStoredFloat(stored);

      assert.isTrue(Option.isSome(decoded), String(stored));
      assert.isTrue(Object.is(Option.getOrUndefined(decoded), number), String(stored));
    }
    // @ts-expect-error -- "Infinity" is not a stored float; the decode must refuse it.
    assert.isTrue(Option.isNone(decodeStoredFloat("Infinity")));
  });
});

describe("the plain types", () => {
  it("are the Schemas' types", () => {
    assert.isTrue(valuePinned);
    assert.isTrue(singlePinned);
  });
});
