import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Expression } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, scopeOf } from "#plate/test/processing.ts";

/**
 * Construct the `qti-base-value` operand of a value.
 *
 * @param value The value.
 * @returns The operand.
 */
const operandOf = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Construct an integer container of a cardinality.
 *
 * @param cardinality Its cardinality.
 * @param members Its integers, in order.
 * @returns The value.
 */
const integers = (cardinality: "multiple" | "ordered", members: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality,
  values: members.map((value) => ({ baseType: "integer", value })),
});

/**
 * The single integer NULL.
 */
const unsetInteger = nullOf("integer", "single");

/**
 * Give the value of an integers expression of `qti-base-value` operands through the engine's
 * dispatcher, with no variable, after checking that it succeeded and holds the type its kind's
 * rule gives over its operands' types (the family's type invariant).
 *
 * @param expression The expression.
 * @returns Its value.
 */
const evaluated = (expression: Expression): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, { outcomes: {}, responses: {} }));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  assertKindType(
    value,
    expression.kind,
    expression.operands.map((operand) =>
      operand.kind === "base-value"
        ? { baseType: operand.value.baseType, cardinality: operand.value.cardinality }
        : { baseType: "unknown", cardinality: "unknown" },
    ),
  );

  return value;
};

/**
 * Construct a `qti-integer-divide` of two values.
 *
 * @param dividend Its first operand's value.
 * @param divisor Its second operand's value.
 * @returns The expression.
 */
const divideOf = (dividend: Value, divisor: Value): Expression => ({
  kind: "integer-divide",
  operands: [operandOf(dividend), operandOf(divisor)],
});

/**
 * Construct a `qti-integer-modulus` of two values.
 *
 * @param dividend Its first operand's value.
 * @param divisor Its second operand's value.
 * @returns The expression.
 */
const modulusOf = (dividend: Value, divisor: Value): Expression => ({
  kind: "integer-modulus",
  operands: [operandOf(dividend), operandOf(divisor)],
});

/**
 * Construct a `qti-integer-to-float` of a value.
 *
 * @param value Its operand's value.
 * @returns The expression.
 */
const toFloatOf = (value: Value): Expression => ({
  kind: "integer-to-float",
  operands: [operandOf(value)],
});

/**
 * Construct a `qti-gcd` of one or more values.
 *
 * @param first Its first operand's value.
 * @param rest Its other operands' values.
 * @returns The expression.
 */
const gcdOf = (first: Value, ...rest: readonly Value[]): Expression => ({
  kind: "gcd",
  operands: [operandOf(first), ...rest.map((value) => operandOf(value))],
});

/**
 * Construct a `qti-lcm` of one or more values.
 *
 * @param first Its first operand's value.
 * @param rest Its other operands' values.
 * @returns The expression.
 */
const lcmOf = (first: Value, ...rest: readonly Value[]): Expression => ({
  kind: "lcm",
  operands: [operandOf(first), ...rest.map((value) => operandOf(value))],
});

describe("the integers family's evaluators", () => {
  it("[I-9a] qti-integer-divide rounds the quotient down: -4 for -7 / 2, 3 for 7 / 2, -4 for 7 / -2, 3 for -7 / -2", () => {
    assert.deepStrictEqual(evaluated(divideOf(integer(-7n), integer(2n))), integer(-4n));
    assert.deepStrictEqual(evaluated(divideOf(integer(7n), integer(2n))), integer(3n));
    assert.deepStrictEqual(evaluated(divideOf(integer(7n), integer(-2n))), integer(-4n));
    assert.deepStrictEqual(evaluated(divideOf(integer(-7n), integer(-2n))), integer(3n));
    assert.deepStrictEqual(evaluated(divideOf(integer(-8n), integer(2n))), integer(-4n));
    assert.deepStrictEqual(evaluated(divideOf(integer(0n), integer(-5n))), integer(0n));
  });

  it("[I-9a] qti-integer-modulus is x - z*y for z the floored quotient, so it takes the divisor's sign", () => {
    assert.deepStrictEqual(evaluated(modulusOf(integer(7n), integer(2n))), integer(1n));
    assert.deepStrictEqual(evaluated(modulusOf(integer(-7n), integer(2n))), integer(1n));
    assert.deepStrictEqual(evaluated(modulusOf(integer(7n), integer(-2n))), integer(-1n));
    assert.deepStrictEqual(evaluated(modulusOf(integer(-7n), integer(-2n))), integer(-1n));
    assert.deepStrictEqual(evaluated(modulusOf(integer(-8n), integer(2n))), integer(0n));
  });

  it("[I-9a] qti-integer-divide and qti-integer-modulus compute exactly past 2^53 (reading 45)", () => {
    const big = 10n ** 30n + 7n;

    assert.deepStrictEqual(
      evaluated(divideOf(integer(-big), integer(10n))),
      integer(-(10n ** 29n) - 1n),
    );
    assert.deepStrictEqual(evaluated(modulusOf(integer(-big), integer(10n))), integer(3n));
    assert.deepStrictEqual(
      evaluated(divideOf(integer(2n ** 53n + 1n), integer(1n))),
      integer(2n ** 53n + 1n),
    );
  });

  it("[I-9a] qti-integer-divide and qti-integer-modulus give the integer NULL for a divisor of 0 and for a NULL operand", () => {
    for (const build of [divideOf, modulusOf]) {
      assert.deepStrictEqual(evaluated(build(integer(7n), integer(0n))), unsetInteger);
      assert.deepStrictEqual(evaluated(build(integer(0n), integer(0n))), unsetInteger);
      assert.deepStrictEqual(evaluated(build(unsetInteger, integer(2n))), unsetInteger);
      assert.deepStrictEqual(evaluated(build(integer(7n), unsetInteger)), unsetInteger);
    }
  });

  it("[I-9a] qti-integer-to-float of 10^400 is the largest finite float, of -10^400 its negative (reading 45)", () => {
    assert.deepStrictEqual(evaluated(toFloatOf(integer(10n ** 400n))), float(Number.MAX_VALUE));
    assert.deepStrictEqual(evaluated(toFloatOf(integer(-(10n ** 400n)))), float(-Number.MAX_VALUE));
  });

  it("[I-9a] qti-integer-to-float gives the nearest float, and the float NULL for NULL", () => {
    assert.deepStrictEqual(evaluated(toFloatOf(integer(-7n))), float(-7));
    assert.deepStrictEqual(evaluated(toFloatOf(integer(2n ** 53n + 1n))), float(2 ** 53));
    assert.deepStrictEqual(evaluated(toFloatOf(unsetInteger)), nullOf("float", "single"));
  });

  it("[I-9a] qti-gcd is 0 for gcd(0,0), ignores zeros among others, and reads negatives by their absolute value (9.20)", () => {
    assert.deepStrictEqual(evaluated(gcdOf(integer(0n), integer(0n))), integer(0n));
    assert.deepStrictEqual(evaluated(gcdOf(integer(0n), integer(12n), integer(18n))), integer(6n));
    assert.deepStrictEqual(evaluated(gcdOf(integer(0n), integer(-7n))), integer(7n));
    assert.deepStrictEqual(evaluated(gcdOf(integer(-12n), integer(18n))), integer(6n));
    assert.deepStrictEqual(evaluated(gcdOf(integer(-12n), integer(-18n))), integer(6n));
    assert.deepStrictEqual(evaluated(gcdOf(integer(-5n))), integer(5n));
  });

  it("[I-9a] qti-lcm is 0 when any operand is 0, and reads negatives by their absolute value (9.20)", () => {
    assert.deepStrictEqual(evaluated(lcmOf(integer(4n), integer(0n), integer(6n))), integer(0n));
    assert.deepStrictEqual(evaluated(lcmOf(integer(0n), integer(0n))), integer(0n));
    assert.deepStrictEqual(evaluated(lcmOf(integer(4n), integer(6n))), integer(12n));
    assert.deepStrictEqual(evaluated(lcmOf(integer(-4n), integer(6n))), integer(12n));
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(-4n), integer(-6n), integer(10n))),
      integer(60n),
    );
    assert.deepStrictEqual(evaluated(lcmOf(integer(-5n))), integer(5n));
  });

  it("[I-9a] qti-gcd and qti-lcm read every integer of a multiple or ordered operand", () => {
    assert.deepStrictEqual(
      evaluated(gcdOf(integers("multiple", [12n, 18n]), integer(8n))),
      integer(2n),
    );
    assert.deepStrictEqual(evaluated(gcdOf(integers("ordered", [0n, 0n]))), integer(0n));
    assert.deepStrictEqual(
      evaluated(lcmOf(integers("ordered", [4n, 6n]), integers("multiple", [10n]))),
      integer(60n),
    );
    assert.deepStrictEqual(evaluated(lcmOf(integers("multiple", [3n, 0n]))), integer(0n));
  });

  it("[I-9a] qti-gcd and qti-lcm compute exactly past 2^53 (reading 45)", () => {
    assert.deepStrictEqual(
      evaluated(gcdOf(integer(3n * 2n ** 200n), integer(9n * 2n ** 100n))),
      integer(3n * 2n ** 100n),
    );
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(2n ** 53n + 1n), integer(2n ** 53n - 1n))),
      integer((2n ** 53n + 1n) * (2n ** 53n - 1n)),
    );
  });

  it("[I-9a] qti-gcd and qti-lcm give the integer NULL when any operand is NULL, an empty container among them", () => {
    for (const build of [gcdOf, lcmOf]) {
      assert.deepStrictEqual(evaluated(build(integer(4n), unsetInteger)), unsetInteger);
      assert.deepStrictEqual(evaluated(build(unsetInteger, integer(0n))), unsetInteger);
      assert.deepStrictEqual(evaluated(build(integers("multiple", []), integer(6n))), unsetInteger);
    }
  });
});

describe("the integers family's bound on a computed integer (operator ruling afb7e648)", () => {
  it("[I-9a] qti-lcm keeps a computed integer of exactly 1,000,000 bits and gives the integer NULL for one of 1,000,001, a zero still giving 0", () => {
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(2n ** 999_998n), integer(3n))),
      integer(3n * 2n ** 999_998n),
      "3 × 2^999998 has 1,000,000 bits",
    );
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(2n ** 999_999n), integer(-3n))),
      unsetInteger,
      "3 × 2^999999 has 1,000,001 bits",
    );
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(2n ** 999_999n), integer(3n), integer(0n))),
      integer(0n),
    );
    assert.deepStrictEqual(
      evaluated(lcmOf(integer(-(2n ** 1_000_000n)))),
      unsetInteger,
      "one operand's magnitude is computed, not written",
    );
  });

  it("[I-9a] qti-gcd, qti-integer-divide and qti-integer-modulus stay exact past the bound: they cannot grow past their operands", () => {
    assert.deepStrictEqual(
      evaluated(gcdOf(integer(2n ** 1_000_000n), integer(2n ** 1_000_001n))),
      integer(2n ** 1_000_000n),
    );
    assert.deepStrictEqual(
      evaluated(divideOf(integer(2n ** 1_000_001n), integer(1n))),
      integer(2n ** 1_000_001n),
    );
    assert.deepStrictEqual(
      evaluated(modulusOf(integer(3n * 2n ** 1_000_000n), integer(2n ** 1_000_001n))),
      integer(2n ** 1_000_000n),
    );
  });
});
