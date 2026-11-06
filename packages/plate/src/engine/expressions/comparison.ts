/**
 * The comparison family of the engine: the evaluators of `qti-match` and `qti-equal`, and the stub
 * markers of the kinds the family has not landed (`qti-gt`, `qti-gte`, `qti-lt`, `qti-lte`,
 * `qti-duration-lt` and `qti-duration-gte`).
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Option` and
 * `Result`, and reads the evaluator's types from `#plate/engine/evaluate.ts` as types, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Evaluator, FamilyTable } from "#plate/engine/evaluate.ts";
import { booleanOf, numberOf, sameNumber } from "#plate/engine/numbers.ts";
import { isNull, match, nullOf } from "#plate/model/values.ts";

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
      ? nullOf("boolean", "single")
      : booleanOf(match(leftValue, rightValue));
  });
};

/**
 * Give the value of a `qti-equal`: a single boolean, whether the operands are the same number in
 * `exact` mode ({@link sameNumber}); NULL when either is NULL.
 *
 * QTI types both operands as single numbers; an operand that is not one is not numerically equal
 * to anything, so the value is false, as `match` gives false for values of different types. The
 * reader builds an `equal` only in its `exact` mode, the one mode the engine runs. Operands are
 * evaluated left to right, and the first failure is the result.
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
    const leftValue = yield* evaluate(left, scope);
    const rightValue = yield* evaluate(right, scope);
    if (isNull(leftValue) || isNull(rightValue)) {
      return nullOf("boolean", "single");
    }

    return booleanOf(
      Option.exists(Option.all([numberOf(leftValue), numberOf(rightValue)]), ([one, other]) =>
        sameNumber(one, other),
      ),
    );
  });
};

/**
 * The comparison family's evaluators by kind: M1's `match` and `equal` landed, and the stub marker
 * for each kind the family has not landed (ruling R2), which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item.
 */
export const comparisonEvaluators: FamilyTable<
  "duration-gte" | "duration-lt" | "equal" | "gt" | "gte" | "lt" | "lte" | "match"
> = {
  "duration-gte": "unlanded",
  "duration-lt": "unlanded",
  equal: evaluateEqual,
  gt: "unlanded",
  gte: "unlanded",
  lt: "unlanded",
  lte: "unlanded",
  match: evaluateMatch,
};
