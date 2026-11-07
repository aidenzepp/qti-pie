import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression, ExpressionType, IntegerOrRef } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, operandOf, scopeOf } from "#plate/test/processing.ts";

/**
 * The single integer type.
 */
const integerType: ExpressionType = { baseType: "integer", cardinality: "single" };

/**
 * The single float type.
 */
const floatType: ExpressionType = { baseType: "float", cardinality: "single" };

/**
 * Construct the single boolean value of a truth.
 *
 * @param held The truth.
 * @returns The value.
 */
const truth = (held: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: held }],
});

/**
 * Construct an integer literal of `figures`.
 *
 * @param value The integer.
 * @returns The literal.
 */
const literal = (value: bigint): IntegerOrRef => ({ _tag: "literal", value });

/**
 * Construct a reference to a variable from `figures`.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const ref = (identifier: string): IntegerOrRef => ({ _tag: "ref", identifier });

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Give the value of a rounding expression through the engine's dispatcher, after checking that it
 * succeeded and holds the type its kind's rule gives over its operands' types (the family's type
 * invariant).
 *
 * @param expression The expression.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const evaluated = (expression: Expression, variables: Variables = none): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, variables));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  assertKindType(
    value,
    expression.kind,
    expression.operands.map((operand) =>
      operand.kind === "base-value" && operand.value.baseType === "integer"
        ? integerType
        : floatType,
    ),
  );

  return value;
};

/**
 * Construct a `qti-round` of a value.
 *
 * @param value Its operand's value.
 * @returns The expression.
 */
const roundOf = (value: Value): Expression => ({ kind: "round", operands: [operandOf(value)] });

/**
 * Construct a `qti-truncate` of a value.
 *
 * @param value Its operand's value.
 * @returns The expression.
 */
const truncateOf = (value: Value): Expression => ({
  kind: "truncate",
  operands: [operandOf(value)],
});

/**
 * Construct a `qti-round-to` of a value.
 *
 * @param roundingMode Its `rounding-mode`.
 * @param figures Its `figures`.
 * @param value Its operand's value.
 * @returns The expression.
 */
const roundToOf = (
  roundingMode: "decimalPlaces" | "significantFigures",
  figures: IntegerOrRef,
  value: Value,
): Expression => ({ figures, kind: "round-to", operands: [operandOf(value)], roundingMode });

/**
 * Construct a `qti-equal-rounded` of two values.
 *
 * @param roundingMode Its `rounding-mode`.
 * @param figures Its `figures`.
 * @param left Its first operand's value.
 * @param right Its second operand's value.
 * @returns The expression.
 */
const equalRoundedOf = (
  roundingMode: "decimalPlaces" | "significantFigures",
  figures: IntegerOrRef,
  left: Value,
  right: Value,
): Expression => ({
  figures,
  kind: "equal-rounded",
  operands: [operandOf(left), operandOf(right)],
  roundingMode,
});

describe("the rounding family's evaluators", () => {
  it("[I-9a] qti-equal-rounded holds the information model's four examples on the shortest-decimal basis (info.txt:25131)", () => {
    const three = literal(3n);
    const two = literal(2n);

    assert.deepStrictEqual(
      evaluated(equalRoundedOf("significantFigures", three, float(3.175), float(3.183))),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("significantFigures", three, float(3.175), float(3.1749))),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, float(1.68572), float(1.69))),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, float(1.68572), float(1.68432))),
      truth(false),
    );
  });

  it("[I-9a] qti-round-to rounds the shortest decimal by the digit rule, a tie away from zero (§5.3)", () => {
    const cases: readonly (readonly [
      "decimalPlaces" | "significantFigures",
      bigint,
      number,
      number,
    ])[] = [
      ["significantFigures", 3n, 3.175, 3.18],
      ["decimalPlaces", 2n, 1.005, 1.01],
      ["decimalPlaces", 2n, 2.675, 2.68],
      ["decimalPlaces", 2n, -2.675, -2.68],
      ["significantFigures", 3n, 1.2345e-7, 1.23e-7],
      ["decimalPlaces", 0n, 0.5, 1],
      ["significantFigures", 1n, 9.5, 10],
      ["decimalPlaces", 1n, -0.04, 0],
    ];

    for (const [mode, figures, given, expected] of cases) {
      assert.deepStrictEqual(
        evaluated(roundToOf(mode, literal(figures), float(given))),
        float(expected),
        `${given} at ${figures} ${mode}`,
      );
    }
  });

  it("[I-9a] qti-round-to of an integer rounds its own decimal digits, to a float", () => {
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", literal(3n), integer(2675n))),
      float(2680),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", literal(16n), integer(12_345_678_901_234_565n))),
      float(12_345_678_901_234_570),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", literal(2n), integer(-7n))),
      float(-7),
    );
  });

  it("[I-9a] qti-round-to keeps INF and -INF, and gives the float NULL for NaN (9.10)", () => {
    const two = literal(2n);

    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", two, float(Number.POSITIVE_INFINITY))),
      float(Number.POSITIVE_INFINITY),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", two, float(Number.NEGATIVE_INFINITY))),
      float(Number.NEGATIVE_INFINITY),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", two, float(Number.NaN))),
      nullOf("float", "single"),
    );
  });

  it("[I-9a] qti-round-to of the largest finite float to 1 significant figure gives that float, of its sign, not an infinity (readings 45 and 56)", () => {
    const one = literal(1n);

    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", one, float(Number.MAX_VALUE))),
      float(Number.MAX_VALUE),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", one, float(-Number.MAX_VALUE))),
      float(-Number.MAX_VALUE),
    );
  });

  it("[I-9a] qti-round gives 7 for 6.5 and 6.8, -6 for -6.5, 6 for 6.49, and an integer operand itself", () => {
    assert.deepStrictEqual(evaluated(roundOf(float(6.5))), integer(7n));
    assert.deepStrictEqual(evaluated(roundOf(float(6.8))), integer(7n));
    assert.deepStrictEqual(evaluated(roundOf(float(-6.5))), integer(-6n));
    assert.deepStrictEqual(evaluated(roundOf(float(-6.51))), integer(-7n));
    assert.deepStrictEqual(evaluated(roundOf(float(6.49))), integer(6n));
    assert.deepStrictEqual(evaluated(roundOf(float(0.49999999999999994))), integer(0n));
    assert.deepStrictEqual(evaluated(roundOf(integer(-12n))), integer(-12n));
  });

  it("[I-9a] qti-truncate rounds toward zero: 6 for 6.8, -6 for -6.8, and an integer operand itself", () => {
    assert.deepStrictEqual(evaluated(truncateOf(float(6.8))), integer(6n));
    assert.deepStrictEqual(evaluated(truncateOf(float(-6.8))), integer(-6n));
    assert.deepStrictEqual(evaluated(truncateOf(float(-0.5))), integer(0n));
    assert.deepStrictEqual(evaluated(truncateOf(integer(-12n))), integer(-12n));
  });

  it("[I-9a] qti-round and qti-truncate give the integer NULL for INF, -INF and NaN (9.10, ruled NULL by head-cto 5e755443)", () => {
    for (const given of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN]) {
      assert.deepStrictEqual(evaluated(roundOf(float(given))), nullOf("integer", "single"));
      assert.deepStrictEqual(evaluated(truncateOf(float(given))), nullOf("integer", "single"));
    }
  });

  it("[I-9a] qti-round and qti-truncate of a huge float give its exact integer (reading 45)", () => {
    assert.deepStrictEqual(
      evaluated(roundOf(float(1_180_591_620_717_411_303_424))),
      integer(1_180_591_620_717_411_303_424n),
    );

    const huge = 1e300;
    assert.deepStrictEqual(evaluated(roundOf(float(huge))), integer(BigInt(huge)));
    assert.deepStrictEqual(evaluated(truncateOf(float(-huge))), integer(-BigInt(huge)));
    assert.notStrictEqual(BigInt(huge), 10n ** 300n, "1e300's exact integer is not 10^300");
  });

  it("[I-9a] the rounding kinds give the NULL of their type for a NULL operand", () => {
    const unset = nullOf("float", "single");
    const two = literal(2n);

    assert.deepStrictEqual(evaluated(roundOf(unset)), nullOf("integer", "single"));
    assert.deepStrictEqual(evaluated(truncateOf(unset)), nullOf("integer", "single"));
    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", two, unset)),
      nullOf("float", "single"),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, unset, float(1))),
      nullOf("boolean", "single"),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, float(1), unset)),
      nullOf("boolean", "single"),
    );
  });

  it("[I-9a] qti-equal-rounded compares the rounded decimals exactly, an integer beside a float", () => {
    const sixteen = literal(16n);

    assert.deepStrictEqual(
      evaluated(
        equalRoundedOf(
          "significantFigures",
          sixteen,
          integer(9_007_199_254_740_993n),
          integer(9_007_199_254_740_992n),
        ),
      ),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("significantFigures", literal(2n), integer(31n), float(3.14e1))),
      truth(true),
    );
  });

  it("[I-9a] qti-equal-rounded rounds INF and -INF to themselves and gives NULL for NaN, as qti-round-to does", () => {
    const two = literal(2n);
    const infinity = float(Number.POSITIVE_INFINITY);

    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, infinity, infinity)),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, infinity, float(Number.NEGATIVE_INFINITY))),
      truth(false),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", two, float(Number.NaN), float(1))),
      nullOf("boolean", "single"),
    );
  });

  it("[I-9a] qti-round-to and qti-equal-rounded read figures from an integer variable, and give NULL when it holds NULL", () => {
    const variables: Variables = {
      outcomes: { FIGURES: integer(2n), UNSET: nullOf("integer", "single") },
      responses: {},
    };

    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", ref("FIGURES"), float(2.675)), variables),
      float(2.68),
    );
    assert.deepStrictEqual(
      evaluated(
        equalRoundedOf("significantFigures", ref("FIGURES"), float(1.24), float(1.15)),
        variables,
      ),
      truth(true),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", ref("UNSET"), float(2.675)), variables),
      nullOf("float", "single"),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("decimalPlaces", ref("UNSET"), float(1), float(1)), variables),
      nullOf("boolean", "single"),
    );
  });

  it("[I-9a] figures below its mode's least, 1 significant figure or 0 decimal places, gives NULL", () => {
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", literal(0n), float(2.675))),
      nullOf("float", "single"),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", literal(-1n), float(2.675))),
      nullOf("float", "single"),
    );
    assert.deepStrictEqual(
      evaluated(equalRoundedOf("significantFigures", literal(0n), float(1), float(1))),
      nullOf("boolean", "single"),
    );
  });

  it("[I-9a] figures at the signed 64-bit greatest leaves every number as it is (reading 46)", () => {
    const greatest = literal(9_223_372_036_854_775_807n);

    assert.deepStrictEqual(
      evaluated(roundToOf("decimalPlaces", greatest, float(5e-324))),
      float(5e-324),
    );
    assert.deepStrictEqual(
      evaluated(roundToOf("significantFigures", greatest, integer(10n ** 40n + 1n))),
      float(1e40),
    );
  });
});
