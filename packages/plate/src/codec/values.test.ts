import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import type { SingleSchema } from "#plate/codec/values.ts";
import { ValueSchema } from "#plate/codec/values.ts";
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

describe("the plain types", () => {
  it("are the Schemas' types", () => {
    assert.isTrue(valuePinned);
    assert.isTrue(singlePinned);
  });
});
