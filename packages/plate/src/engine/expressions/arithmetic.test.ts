import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Expression, ExpressionType } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, scopeOf } from "#plate/test/processing.ts";

/**
 * 2^53, the least integer above which a double cannot hold every integer.
 */
const twoTo53 = 9_007_199_254_740_992n;

/**
 * Construct the `qti-base-value` operand of a value.
 *
 * @param value The value.
 * @returns The operand.
 */
const operandOf = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Construct a container of integers.
 *
 * @param cardinality The container's cardinality.
 * @param members Its members, none for an empty container, which is NULL.
 * @returns The value.
 */
const integers = (cardinality: "multiple" | "ordered", members: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality,
  values: members.map((value): Single => ({ baseType: "integer", value })),
});

/**
 * Construct a container of floats.
 *
 * @param cardinality The container's cardinality.
 * @param members Its members.
 * @returns The value.
 */
const floats = (cardinality: "multiple" | "ordered", members: readonly number[]): Value => ({
  baseType: "float",
  cardinality,
  values: members.map((value): Single => ({ baseType: "float", value })),
});

/**
 * A single string, a value no arithmetic kind takes.
 */
const written: Value = {
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value: "4" }],
};

/**
 * Give the value of an arithmetic expression through the engine's dispatcher, after checking that
 * it succeeded and holds the type its kind's rule gives over its operands' types (the family's type
 * invariant).
 *
 * @param expression The expression, whose operands are each a `qti-base-value`.
 * @returns Its value.
 */
const evaluated = (expression: Expression): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, { outcomes: {}, responses: {} }));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  const operands: readonly Expression[] = expression.operands;
  assertKindType(
    value,
    expression.kind,
    operands.map((operand): ExpressionType =>
      operand.kind === "base-value"
        ? { baseType: operand.value.baseType, cardinality: operand.value.cardinality }
        : { baseType: "unknown", cardinality: "unknown" },
    ),
  );

  return value;
};

/**
 * Construct an arithmetic expression of one or more values.
 *
 * @param kind The kind: `qti-sum`, `qti-product`, `qti-min` or `qti-max`.
 * @param first Its first operand's value.
 * @param rest Its other operands' values.
 * @returns The expression.
 */
const aggregateOf = (
  kind: "max" | "min" | "product" | "sum",
  first: Value,
  ...rest: readonly Value[]
): Expression => ({ kind, operands: [operandOf(first), ...rest.map(operandOf)] });

/**
 * Construct an arithmetic expression of two values.
 *
 * @param kind The kind: `qti-subtract` or `qti-divide`.
 * @param left Its first operand's value.
 * @param right Its second operand's value.
 * @returns The expression.
 */
const pairOf = (kind: "divide" | "subtract", left: Value, right: Value): Expression => ({
  kind,
  operands: [operandOf(left), operandOf(right)],
});

describe("the arithmetic family's evaluators", () => {
  it("[I-9a] qti-sum, qti-product, qti-subtract, qti-min and qti-max give an integer when every operand is an integer, else a float", () => {
    assert.deepStrictEqual(evaluated(aggregateOf("sum", integer(2n), integer(3n))), integer(5n));
    assert.deepStrictEqual(evaluated(aggregateOf("sum", integer(2n), float(0.5))), float(2.5));
    assert.deepStrictEqual(
      evaluated(aggregateOf("product", integer(2n), integer(-3n), integer(4n))),
      integer(-24n),
    );
    assert.deepStrictEqual(evaluated(aggregateOf("product", integer(3n), float(0.5))), float(1.5));
    assert.deepStrictEqual(evaluated(pairOf("subtract", integer(2n), integer(5n))), integer(-3n));
    assert.deepStrictEqual(evaluated(pairOf("subtract", float(2.5), integer(1n))), float(1.5));
    assert.deepStrictEqual(
      evaluated(aggregateOf("min", integer(4n), integer(-1n), integer(7n))),
      integer(-1n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("max", integer(4n), integer(-1n), integer(7n))),
      integer(7n),
    );
    assert.deepStrictEqual(evaluated(aggregateOf("sum", float(1.25))), float(1.25));
  });

  it("[I-9a] integer arithmetic is exact past 2^53 (reading 45)", () => {
    assert.deepStrictEqual(
      evaluated(aggregateOf("sum", integer(twoTo53), integer(1n))),
      integer(twoTo53 + 1n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("product", integer(twoTo53), integer(twoTo53), integer(3n))),
      integer(twoTo53 * twoTo53 * 3n),
    );
    assert.deepStrictEqual(
      evaluated(pairOf("subtract", integer(twoTo53 + 3n), integer(2n))),
      integer(twoTo53 + 1n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("max", integer(twoTo53 + 1n), integer(twoTo53))),
      integer(twoTo53 + 1n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("min", integer(twoTo53 + 2n), integer(twoTo53 + 1n))),
      integer(twoTo53 + 1n),
    );
  });

  it("[I-9a] qti-sum, qti-product, qti-min and qti-max take each member of a multiple or ordered container", () => {
    assert.deepStrictEqual(
      evaluated(aggregateOf("sum", integers("multiple", [1n, 2n, 3n]), integer(4n))),
      integer(10n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("sum", integers("ordered", [1n, 2n]), floats("multiple", [0.5]))),
      float(3.5),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("product", integers("ordered", [2n, 3n]), integers("multiple", [4n]))),
      integer(24n),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("min", floats("multiple", [2.5, -0.5]), integer(1n))),
      float(-0.5),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("max", integers("ordered", [2n, 9n, 3n]))),
      integer(9n),
    );
  });

  it("[I-9a] qti-min and qti-max over an integer and a float give the extreme number as a float", () => {
    assert.deepStrictEqual(evaluated(aggregateOf("min", integer(3n), float(2.5))), float(2.5));
    assert.deepStrictEqual(evaluated(aggregateOf("max", integer(3n), float(2.5))), float(3));
    assert.deepStrictEqual(
      evaluated(aggregateOf("max", float(-1.5), integer(-2n), floats("ordered", [-3.5]))),
      float(-1.5),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("min", float(Number.NEGATIVE_INFINITY), integer(0n))),
      float(Number.NEGATIVE_INFINITY),
    );
  });

  it("[I-9a] any NULL operand, an empty container among them, gives NULL of the kind's type", () => {
    const integerNull = nullOf("integer", "single");
    const floatNull = nullOf("float", "single");

    assert.deepStrictEqual(evaluated(aggregateOf("sum", integer(1n), integerNull)), integerNull);
    assert.deepStrictEqual(evaluated(aggregateOf("sum", float(1), integerNull)), floatNull);
    assert.deepStrictEqual(
      evaluated(aggregateOf("product", integer(2n), integers("multiple", []))),
      integerNull,
    );
    assert.deepStrictEqual(evaluated(aggregateOf("min", floatNull, integer(1n))), floatNull);
    assert.deepStrictEqual(evaluated(aggregateOf("max", integerNull)), integerNull);
    assert.deepStrictEqual(evaluated(pairOf("subtract", integerNull, integer(1n))), integerNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", float(1), floatNull)), floatNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", integerNull, integer(2n))), floatNull);
  });

  it("[I-9a] qti-divide gives a float quotient, of two integers too", () => {
    assert.deepStrictEqual(evaluated(pairOf("divide", integer(7n), integer(2n))), float(3.5));
    assert.deepStrictEqual(evaluated(pairOf("divide", integer(6n), integer(3n))), float(2));
    assert.deepStrictEqual(evaluated(pairOf("divide", float(1), integer(4n))), float(0.25));
    assert.deepStrictEqual(
      evaluated(pairOf("divide", float(1), float(Number.POSITIVE_INFINITY))),
      float(0),
    );
  });

  it("[I-9a] qti-divide by 0 gives NULL, and so does a quotient of INF, -INF or NaN (§4.4)", () => {
    const floatNull = nullOf("float", "single");

    assert.deepStrictEqual(evaluated(pairOf("divide", integer(1n), integer(0n))), floatNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", float(0), float(0))), floatNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", float(1), float(-0))), floatNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", float(1e308), float(1e-308))), floatNull);
    assert.deepStrictEqual(evaluated(pairOf("divide", float(-1e308), float(1e-308))), floatNull);
    assert.deepStrictEqual(
      evaluated(pairOf("divide", float(Number.POSITIVE_INFINITY), integer(2n))),
      floatNull,
    );
    assert.deepStrictEqual(evaluated(pairOf("divide", float(Number.NaN), integer(2n))), floatNull);
  });

  it("[I-9a] the other kinds keep INF as a value: only qti-divide (and qti-power) give NULL for it (§4.4)", () => {
    assert.deepStrictEqual(
      evaluated(aggregateOf("sum", float(Number.POSITIVE_INFINITY), integer(1n))),
      float(Number.POSITIVE_INFINITY),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("product", float(1e308), float(10))),
      float(Number.POSITIVE_INFINITY),
    );
    assert.deepStrictEqual(
      evaluated(pairOf("subtract", float(-1e308), float(1e308))),
      float(Number.NEGATIVE_INFINITY),
    );
  });

  it("[I-9a] an operand that is not a number gives NULL, as the information model says of qti-min and qti-max", () => {
    assert.deepStrictEqual(
      evaluated(aggregateOf("min", integer(1n), written)),
      nullOf("float", "single"),
    );
    assert.deepStrictEqual(
      evaluated(aggregateOf("sum", float(1), written)),
      nullOf("float", "single"),
    );
  });
});
