import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { parseLexical } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { resultValue, resultValues } from "#plate/results/values.ts";

/**
 * Doubles that stress the shortest round trip: decimals a double cannot hold exactly, an exponent
 * form, the extremes of the finite range, both zeros, the infinities and NaN.
 */
const doubles = [
  0.1,
  0.1 + 0.2,
  1 / 3,
  2.5,
  -1.5e-7,
  1e21,
  123_456_789_012_345_680_000,
  Number.MAX_VALUE,
  -Number.MAX_VALUE,
  Number.MIN_VALUE,
  0,
  -0,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  Number.NaN,
];

/**
 * Count the significant digits of a finite xs:double lexical form: the digits of its mantissa
 * without the sign, the decimal point, the exponent, or leading and trailing zeros.
 *
 * @param lexical The lexical form.
 * @returns How many significant digits it writes.
 */
const significantDigits = (lexical: string): number =>
  lexical
    .replace(/^-/u, "")
    .replace(/[Ee].*$/u, "")
    .replace(".", "")
    .replace(/^0+/u, "")
    .replace(/0+$/u, "").length;

/**
 * Construct a value for a test.
 *
 * @param cardinality The value's cardinality.
 * @param values Its values, each an identifier.
 * @returns The identifier value.
 */
const identifiers = (cardinality: Value["cardinality"], ...names: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: names.map((name): Single => ({ baseType: "identifier", value: name })),
});

describe("resultValue", () => {
  it("writes a duration as its seconds, never an ISO 8601 duration", () => {
    assert.strictEqual(resultValue({ baseType: "duration", value: 90.5 }), "90.5");
    assert.notStrictEqual(resultValue({ baseType: "duration", value: 90.5 }), "PT1M30.5S");
    assert.strictEqual(resultValue({ baseType: "duration", value: 0 }), "0");
    assert.strictEqual(resultValue({ baseType: "duration", value: 3600 }), "3600");
  });

  it.effect("writes an integer's exact digits at any size, which parseLexical reads back", () =>
    Effect.gen(function* integerDigits() {
      for (const integer of [
        9_007_199_254_740_993n,
        -123_456_789_012_345_678_901_234_567_890n,
        0n,
      ]) {
        const lexical = resultValue({ baseType: "integer", value: integer });
        assert.strictEqual(lexical, integer.toString());

        const again = yield* Effect.fromResult(parseLexical("integer", lexical));
        assert.deepStrictEqual(again, { baseType: "integer", value: integer });
      }

      assert.strictEqual(
        resultValue({ baseType: "integer", value: 9_007_199_254_740_993n }),
        "9007199254740993",
      );
    }),
  );

  it.effect("writes a float as its shortest round trip, which parseLexical reads back", () =>
    Effect.gen(function* shortestRoundTrip() {
      for (const double of doubles) {
        const lexical = resultValue({ baseType: "float", value: double });
        const again = yield* Effect.fromResult(parseLexical("float", lexical));
        assert.strictEqual(again.baseType, "float");
        assert.isTrue(
          Object.is(again.value, double),
          `${lexical} reads back as ${String(again.value)}`,
        );

        const digits = significantDigits(lexical);
        if (Number.isFinite(double) && double !== 0 && digits > 1) {
          assert.notStrictEqual(
            Number(double.toPrecision(digits - 1)),
            double,
            `${lexical} has a shorter form that reads back`,
          );
        }
      }

      assert.strictEqual(
        resultValue({ baseType: "float", value: 0.1 + 0.2 }),
        "0.30000000000000004",
      );
      assert.strictEqual(
        resultValue({ baseType: "float", value: Number.POSITIVE_INFINITY }),
        "INF",
      );
      assert.strictEqual(
        resultValue({ baseType: "float", value: Number.NEGATIVE_INFINITY }),
        "-INF",
      );
      assert.strictEqual(resultValue({ baseType: "float", value: Number.NaN }), "NaN");
    }),
  );

  it.effect("writes a point as two space-separated coordinates, x first", () =>
    Effect.gen(function* pointCoordinates() {
      const point: Single = { baseType: "point", value: [9_007_199_254_740_993n, -113n] };
      const lexical = resultValue(point);
      assert.strictEqual(lexical, "9007199254740993 -113");
      assert.deepStrictEqual(lexical.split(" "), ["9007199254740993", "-113"]);
      assert.deepStrictEqual(yield* Effect.fromResult(parseLexical("point", lexical)), point);
    }),
  );

  it("writes identifiers, strings and URIs as written, booleans by name and pairs space-separated", () => {
    assert.strictEqual(resultValue({ baseType: "identifier", value: "choice_A" }), "choice_A");
    assert.strictEqual(resultValue({ baseType: "string", value: " two  words " }), " two  words ");
    assert.strictEqual(
      resultValue({ baseType: "uri", value: "https://example.org/a?b=c" }),
      "https://example.org/a?b=c",
    );
    assert.strictEqual(resultValue({ baseType: "boolean", value: true }), "true");
    assert.strictEqual(resultValue({ baseType: "boolean", value: false }), "false");
    assert.strictEqual(resultValue({ baseType: "pair", value: ["A", "B"] }), "A B");
    assert.strictEqual(resultValue({ baseType: "directedPair", value: ["B", "A"] }), "B A");
  });
});

describe("resultValues", () => {
  it("writes one entry per member of a multiple value, in order, repeats kept", () => {
    assert.deepStrictEqual(resultValues(identifiers("multiple", "C", "A", "C", "B")), [
      "C",
      "A",
      "C",
      "B",
    ]);
  });

  it("writes one entry per member of an ordered value, in order", () => {
    assert.deepStrictEqual(resultValues(identifiers("ordered", "B", "A", "C")), ["B", "A", "C"]);
  });

  it("writes one entry for a single value and none for NULL", () => {
    assert.deepStrictEqual(resultValues(identifiers("single", "A")), ["A"]);
    assert.deepStrictEqual(resultValues(identifiers("single")), []);
    assert.deepStrictEqual(resultValues(identifiers("multiple")), []);
  });

  it("writes each member in its base type's form", () => {
    const points: Value = {
      baseType: "point",
      cardinality: "ordered",
      values: [
        { baseType: "point", value: [1n, 2n] },
        { baseType: "point", value: [-3n, 9_007_199_254_740_993n] },
      ],
    };
    assert.deepStrictEqual(resultValues(points), ["1 2", "-3 9007199254740993"]);

    const floats: Value = {
      baseType: "float",
      cardinality: "multiple",
      values: [
        { baseType: "float", value: 2.5 },
        { baseType: "float", value: Number.NEGATIVE_INFINITY },
      ],
    };
    assert.deepStrictEqual(resultValues(floats), ["2.5", "-INF"]);
  });
});
