/**
 * The comparison family of the engine: the evaluators of `qti-match`, `qti-equal` in its three
 * tolerance modes, `qti-gt`, `qti-gte`, `qti-lt` and `qti-lte`, and the stub markers of
 * `qti-duration-lt` and `qti-duration-gte`, which M3.b-3 lands.
 *
 * Integers are exact and floats are doubles. An integer and a float compare exactly, never through
 * a lossy conversion ({@link orderOf}). `qti-equal`'s tolerance modes compare their two operands
 * in one domain: exactly when both are integers, and otherwise as two floats, an integer through
 * `toFloat` ({@link withinTolerance}).
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Option` and
 * `Result`, and reads the evaluator's types from `#plate/engine/evaluate.ts` as types, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Evaluator, FamilyTable, Scope } from "#plate/engine/evaluate.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { booleanOf, floatOf, numberOf, sameNumber } from "#plate/engine/numbers.ts";
import type { NumberSingle } from "#plate/engine/numbers.ts";
import { referenceValue } from "#plate/engine/refs.ts";
import type { Expression, FloatOrRef } from "#plate/model/expression.ts";
import { isNull, match, nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Give the single boolean NULL, the value of a comparison whose operand or tolerance is not known.
 *
 * @returns The NULL.
 */
const unknown = (): Value => nullOf("boolean", "single");

/**
 * Give the value of a `qti-match`: a single boolean, whether the operands match by `match` of the
 * value model; NULL when either is NULL.
 *
 * Operands are evaluated left to right, and the first failure is the result.
 *
 * @param expression The `qti-match`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 */
const evaluateMatch: Evaluator<"match"> = (expression, scope, evaluate) => {
  const [left, right] = expression.operands;

  return Result.gen(function* matchOperands() {
    const leftValue = yield* evaluate(left, scope);
    const rightValue = yield* evaluate(right, scope);

    return isNull(leftValue) || isNull(rightValue)
      ? unknown()
      : booleanOf(match(leftValue, rightValue));
  });
};

/**
 * The order of one number against another: below, the same, or above.
 */
type Order = -1 | 0 | 1;

/**
 * Give the order of two numbers of one kind, two integers or two floats, by `<`, `>` and `===`.
 *
 * @param left One number.
 * @param right The other, of the same kind.
 * @returns The order of `left` against `right`, or none when the two are unordered, as NaN is
 *   against every float.
 */
const orderWithin = (left: bigint | number, right: bigint | number): Option.Option<Order> => {
  if (left < right) {
    return Option.some(-1);
  }

  if (left > right) {
    return Option.some(1);
  }

  return left === right ? Option.some(0) : Option.none();
};

/**
 * Give the order seen from the other side: below for above, above for below.
 *
 * @param order An order.
 * @returns The reverse order.
 */
const reverse = (order: Order): Order => {
  switch (order) {
    case -1: {
      return 1;
    }
    case 0: {
      return 0;
    }
    case 1: {
      return -1;
    }
    default: {
      return order satisfies never;
    }
  }
};

/**
 * Give the order of an integer against a float, exactly.
 *
 * An infinity lies beyond every integer. A finite float is compared through its floor, an integer
 * that converts to a `bigint` exactly: an integer below the floor is below the float, one above it
 * is at least the floor plus one and so above the float, and the floor itself is the float when the
 * float is integral and below it otherwise. So `2^53 + 1` is above the float `2^53`, which
 * `toFloat` would make it equal to; no integer is converted to a float.
 *
 * @param integer The integer.
 * @param float The float.
 * @returns The integer's order against the float, or none when the float is NaN.
 */
const integerAgainstFloat = (integer: bigint, float: number): Option.Option<Order> => {
  if (Number.isNaN(float)) {
    return Option.none();
  }

  if (!Number.isFinite(float)) {
    return Option.some(float > 0 ? -1 : 1);
  }

  const floor = BigInt(Math.floor(float));
  if (integer !== floor) {
    return Option.some(integer < floor ? -1 : 1);
  }

  return Option.some(Number.isInteger(float) ? 0 : -1);
};

/**
 * Give the order of one number against another, exactly: two integers or two floats by value, and
 * an integer and a float by {@link integerAgainstFloat}, so the order {@link sameNumber}'s
 * equality agrees with.
 *
 * @param left One number.
 * @param right The other.
 * @returns The order of `left` against `right`, or none when a float is NaN.
 */
const orderOf = (left: NumberSingle, right: NumberSingle): Option.Option<Order> => {
  if (left.baseType === "integer") {
    return right.baseType === "integer"
      ? orderWithin(left.value, right.value)
      : integerAgainstFloat(left.value, right.value);
  }

  return right.baseType === "integer"
    ? Option.map(integerAgainstFloat(right.value, left.value), reverse)
    : orderWithin(left.value, right.value);
};

/**
 * Construct the evaluator of an order comparison: a single boolean, whether its first operand's
 * order against its second is one `holds` accepts; NULL when either operand is NULL.
 *
 * QTI types both operands as single numbers. Two numbers that have no order, a NaN among them, or
 * an operand that is not a single number, compare as false, as `qti-equal` gives false for values
 * that are not numerically equal. Operands are evaluated left to right, and the first failure is
 * the result.
 *
 * @param holds Whether an order makes the comparison true.
 * @returns The evaluator.
 */
const comparing =
  <K extends "gt" | "gte" | "lt" | "lte">(holds: (order: Order) => boolean): Evaluator<K> =>
  (expression, scope, evaluate) => {
    const [left, right] = expression.operands;

    return Result.gen(function* orderOperands() {
      const leftValue = yield* evaluate(left, scope);
      const rightValue = yield* evaluate(right, scope);
      if (isNull(leftValue) || isNull(rightValue)) {
        return unknown();
      }

      return booleanOf(
        Option.exists(Option.all([numberOf(leftValue), numberOf(rightValue)]), ([one, other]) =>
          Option.exists(orderOf(one, other), holds),
        ),
      );
    });
  };

/**
 * Give the value of a `qti-gt`: whether the first operand is greater than the second.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpGT
 */
const evaluateGt: Evaluator<"gt"> = comparing((order) => order > 0);

/**
 * Give the value of a `qti-gte`: whether the first operand is greater than or equal to the second.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpGTE
 */
const evaluateGte: Evaluator<"gte"> = comparing((order) => order >= 0);

/**
 * Give the value of a `qti-lt`: whether the first operand is less than the second.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpLT
 */
const evaluateLt: Evaluator<"lt"> = comparing((order) => order < 0);

/**
 * Give the value of a `qti-lte`: whether the first operand is less than or equal to the second.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpLTE
 */
const evaluateLte: Evaluator<"lte"> = comparing((order) => order <= 0);

/**
 * Give the number one `tolerance` token stands for: its literal, or the value of the float or
 * integer template or outcome variable it names (9.11), an integer through `toFloat`.
 *
 * The token is resolved through `referenceValue` with `qti-equal`'s unchecked facet, which never
 * fails and reads only the outcomes the attempt holds: a token that names a response, a built-in
 * or no variable the attempt holds gives NULL.
 *
 * @param scope The item and the variables of the attempt.
 * @param token The token.
 * @returns The float, or none when the token names no outcome, a NULL, or a value that is not a
 *   single number.
 */
const toleranceTokenOf = (
  scope: Scope,
  token: FloatOrRef,
): Result.Result<Option.Option<number>, EngineFailure> =>
  Result.map(
    referenceValue(scope.variables, { baseType: "float", checked: false, reference: token }),
    (value) => Option.map(numberOf(value), floatOf),
  );

/**
 * Give the tolerance of a `qti-equal` in a tolerance mode: `t0`, the distance below its first
 * operand, and `t1`, the distance above it. "If only one value is given it is used for both."
 *
 * The information model defines a tolerance of one or two numbers, so a tolerance of none, or of
 * more than two tokens, holds no `t0` and `t1`, and neither does one whose token stands for no
 * number ({@link toleranceTokenOf}); the `qti-equal` is then NULL.
 *
 * @param scope The item and the variables of the attempt.
 * @param tolerance The tokens of its `tolerance`, in written order.
 * @returns `t0` and `t1`, or none when the tolerance holds no such pair.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#DataCharacteristic_Equal.Attr_tolerance
 */
const toleranceOf = (
  scope: Scope,
  tolerance: readonly FloatOrRef[],
): Result.Result<Option.Option<readonly [number, number]>, EngineFailure> =>
  Result.map(
    Result.all(tolerance.map((token) => toleranceTokenOf(scope, token))),
    (numbers): Option.Option<readonly [number, number]> => {
      const [lower, upper, ...extra] = numbers;
      if (lower === undefined || extra.length > 0) {
        return Option.none();
      }

      return Option.all([lower, upper ?? lower]);
    },
  );

/**
 * Give the bounds of a `qti-equal`'s range in a tolerance mode, in floats, as {@link floatsWithin}
 * reads them.
 *
 * @param mode The tolerance mode, `absolute` or `relative` (`exact` reads no range).
 * @param x The first operand, as a float.
 * @param t0 The tolerance below `x`.
 * @param t1 The tolerance above `x`.
 * @returns The lower bound, then the upper.
 */
const rangeOf = (
  mode: Extract<Expression, { readonly kind: "equal" }>["toleranceMode"],
  x: number,
  t0: number,
  t1: number,
): readonly [number, number] => {
  if (mode !== "relative") {
    return [x - t0, x + t1];
  }

  return x < 0
    ? [x * (1 + t0 / 100), x * (1 - t1 / 100)]
    : [x * (1 - t0 / 100), x * (1 + t1 / 100)];
};

/**
 * Report whether the second operand of a `qti-equal` in a tolerance mode lies in its range, from
 * its order against each bound, each bound closed when its flag is true.
 *
 * @param equal The `qti-equal`, whose flags close or open each bound.
 * @param lower The second operand's order against the lower bound, none when they have no order.
 * @param upper Its order against the upper bound, none when they have no order.
 * @returns Whether it lies in the range; never when an order is none.
 */
const inRange = (
  equal: Extract<Expression, { readonly kind: "equal" }>,
  lower: Option.Option<Order>,
  upper: Option.Option<Order>,
): boolean =>
  Option.exists(lower, (order) => (equal.includeLowerBound ? order >= 0 : order > 0)) &&
  Option.exists(upper, (order) => (equal.includeUpperBound ? order <= 0 : order < 0));

/**
 * Report whether a `qti-equal` in a tolerance mode holds for two floats: whether `y` lies in the
 * range `x` defines with `t0` and `t1` ({@link inRange}).
 *
 * The range is `[x − t0, x + t1]` in `absolute` mode. In `relative` mode, `t0` and `t1` are
 * percentages, `t0` below `x` and `t1` above it, and the range is computed by the sign of `x`
 * (Mind amendments 2 and 3, for the M3.b-1 readings): for `x ≥ 0`, `−0` included, it is the
 * information model's `[x·(1 − t0/100), x·(1 + t1/100)]` exactly, so `x = INF` holds `INF` alone
 * for a tolerance below 100 and `x = 0` holds `0` alone; for `x < 0` it is the same band mirrored,
 * `[x·(1 + t0/100), x·(1 − t1/100)]`, where the range as written would put its lower bound above
 * its upper and hold no value. The bounds and `y` are floats, so a bound's rounding moves it as it
 * moves `y`, and a NaN bound, such as `INF·0` for an infinite `x` and a tolerance of 100, holds
 * nothing.
 *
 * @param equal The `qti-equal`, in its `absolute` or `relative` mode.
 * @param x The first operand.
 * @param y The second operand.
 * @param tolerance `t0`, the tolerance below `x`, then `t1`, the tolerance above it.
 * @returns Whether `y` lies in the range.
 */
const floatsWithin = (
  equal: Extract<Expression, { readonly kind: "equal" }>,
  x: number,
  y: number,
  [t0, t1]: readonly [number, number],
): boolean => {
  const [lower, upper] = rangeOf(equal.toleranceMode, x, t0, t1);

  return inRange(equal, orderWithin(y, lower), orderWithin(y, upper));
};

/**
 * Give a finite float as an exact fraction, `numerator / 2^shift`.
 *
 * Every finite double is an integer times a power of two. One that is not integral is below 2^52
 * in magnitude, so doubling it is exact, and at most 1,074 doublings, a subnormal's, make it
 * integral; an integral double converts to a `bigint` exactly.
 *
 * @param float The float, finite.
 * @returns Its numerator, then the power of two that divides it.
 */
const fractionOf = (float: number): readonly [bigint, bigint] => {
  let numerator = float;
  let shift = 0n;
  while (!Number.isInteger(numerator)) {
    numerator *= 2;
    shift += 1n;
  }

  return [BigInt(numerator), shift];
};

/**
 * Give the order of an integer against the product of an integer and a float, exactly.
 *
 * An exact zero factor makes the product zero whatever the float but NaN, an infinity among them,
 * as "`t0` percent of 0" is 0. Otherwise an infinite float makes the product an infinity of the
 * sign of the two, which lies beyond every integer, and a finite one is compared through its exact
 * fraction ({@link fractionOf}), so no step rounds.
 *
 * @param integer The integer.
 * @param factor The integer factor of the product.
 * @param float The float factor of the product.
 * @returns The integer's order against the product, or none when the float is NaN.
 */
const againstProduct = (integer: bigint, factor: bigint, float: number): Option.Option<Order> => {
  if (Number.isNaN(float)) {
    return Option.none();
  }

  if (factor === 0n) {
    return orderWithin(integer, 0n);
  }

  if (!Number.isFinite(float)) {
    return Option.some(float > 0 === factor > 0n ? -1 : 1);
  }

  const [numerator, shift] = fractionOf(float);

  return orderWithin(integer * 2n ** shift, factor * numerator);
};

/**
 * Report whether a `qti-equal` in a tolerance mode holds for two integers, exactly: whether `y`
 * lies in the range `x` defines with `t0` and `t1`, as {@link floatsWithin} defines it, with no step
 * rounded.
 *
 * With `d = y − x`, `y ≥ x − t0` is `d ≥ −t0` and `y ≤ x + t1` is `d ≤ t1` in `absolute` mode. In
 * `relative` mode, for either sign of `x`, the band reaches `t0` percent of `|x|` below `x` and
 * `t1` percent above it, so the bounds are `100·d ≥ −|x|·t0` and `100·d ≤ |x|·t1`; `x = 0` holds
 * `0` alone. Each side is compared exactly ({@link againstProduct}), so `equal(v, v)` holds for
 * every integer `v` with tolerances of 0 or more, past 2^53 and past the largest float alike, and a
 * NaN tolerance holds nothing.
 *
 * @param equal The `qti-equal`, in its `absolute` or `relative` mode.
 * @param x The first operand.
 * @param y The second operand.
 * @param tolerance `t0`, the tolerance below `x`, then `t1`, the tolerance above it.
 * @returns Whether `y` lies in the range.
 */
const integersWithin = (
  equal: Extract<Expression, { readonly kind: "equal" }>,
  x: bigint,
  y: bigint,
  [t0, t1]: readonly [number, number],
): boolean => {
  const relative = equal.toleranceMode === "relative";
  const difference = relative ? 100n * (y - x) : y - x;
  const magnitude = x < 0n ? -x : x;
  const weight = relative ? magnitude : 1n;

  return inRange(
    equal,
    againstProduct(difference, weight, -t0),
    againstProduct(difference, weight, t1),
  );
};

/**
 * Report whether a `qti-equal` in a tolerance mode holds: whether its second operand, `y`, lies in
 * the range its first, `x`, defines with `t0` and `t1`.
 *
 * The two operands are compared in one domain, so the range's arithmetic treats `x` as it treats
 * `y`: two integers exactly ({@link integersWithin}), and otherwise two floats, an integer operand
 * through `toFloat` ({@link floatsWithin}).
 *
 * @param equal The `qti-equal`, in its `absolute` or `relative` mode.
 * @param x The first operand.
 * @param y The second operand.
 * @param tolerance `t0`, the tolerance below `x`, then `t1`, the tolerance above it.
 * @returns Whether `y` lies in the range.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#DataCharacteristic_Equal.Attr_tolerance
 */
const withinTolerance = (
  equal: Extract<Expression, { readonly kind: "equal" }>,
  x: NumberSingle,
  y: NumberSingle,
  tolerance: readonly [number, number],
): boolean =>
  x.baseType === "integer" && y.baseType === "integer"
    ? integersWithin(equal, x.value, y.value, tolerance)
    : floatsWithin(equal, floatOf(x), floatOf(y), tolerance);

/**
 * Give the value of a `qti-equal`: a single boolean; NULL when either operand is NULL, or, in a
 * tolerance mode, when its tolerance holds no `t0` and `t1` ({@link toleranceOf}).
 *
 * In `exact` mode it is whether the operands are the same number ({@link sameNumber}), and its
 * tolerance is not read. In `absolute` and `relative` mode it is whether the second operand lies in
 * the range the first defines ({@link withinTolerance}). QTI types both operands as single numbers;
 * an operand that is not one is not numerically equal to anything, so the value is false, as
 * `match` gives false for values of different types.
 *
 * The tolerance is resolved first, as the item model's walks visit it before the operands, then
 * the operands left to right; the first failure is the result.
 *
 * @param expression The `qti-equal`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpEqual
 */
const evaluateEqual: Evaluator<"equal"> = (expression, scope, evaluate) => {
  const [left, right] = expression.operands;

  return Result.gen(function* equalOperands() {
    const exact = expression.toleranceMode === "exact";
    const tolerance = exact ? Option.none() : yield* toleranceOf(scope, expression.tolerance);
    const leftValue = yield* evaluate(left, scope);
    const rightValue = yield* evaluate(right, scope);
    if (isNull(leftValue) || isNull(rightValue)) {
      return unknown();
    }

    const numbers = Option.all([numberOf(leftValue), numberOf(rightValue)]);
    if (exact) {
      return booleanOf(Option.exists(numbers, ([one, other]) => sameNumber(one, other)));
    }

    return Option.match(tolerance, {
      onNone: unknown,
      onSome: (pair) =>
        booleanOf(Option.exists(numbers, ([x, y]) => withinTolerance(expression, x, y, pair))),
    });
  });
};

/**
 * The comparison family's evaluators by kind, and the stub marker for the two duration kinds
 * (ruling R2), which the dispatcher in `#plate/engine/evaluate.ts` never reaches on a checked item.
 */
export const comparisonEvaluators: FamilyTable<
  "duration-gte" | "duration-lt" | "equal" | "gt" | "gte" | "lt" | "lte" | "match"
> = {
  "duration-gte": "unlanded",
  "duration-lt": "unlanded",
  equal: evaluateEqual,
  gt: evaluateGt,
  gte: evaluateGte,
  lt: evaluateLt,
  lte: evaluateLte,
  match: evaluateMatch,
};
