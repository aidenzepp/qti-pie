/**
 * The containers family of the engine: the evaluator of `qti-is-null`, and the stub markers of the
 * kinds the family has not landed (`qti-multiple`, `qti-ordered`, `qti-repeat`,
 * `qti-container-size`, `qti-index`, `qti-member`, `qti-delete`, `qti-contains`, `qti-random` and
 * `qti-field-value`).
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Result`, and reads
 * the evaluator's types from `#plate/engine/evaluate.ts` as types, so the dispatcher's table may
 * import it without a cycle.
 *
 * @module
 */
import { Result } from "effect";
import type { Evaluator, FamilyTable } from "#plate/engine/evaluate.ts";
import { booleanOf } from "#plate/engine/numbers.ts";
import { isNull } from "#plate/model/values.ts";

/**
 * Give the value of a `qti-is-null`: a single boolean, whether the operand is NULL.
 *
 * @param expression The `qti-is-null`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives the operand's value.
 * @returns The single boolean, or the operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIsNull
 */
const evaluateIsNull: Evaluator<"is-null"> = (expression, scope, evaluate) => {
  const [operand] = expression.operands;

  return Result.map(evaluate(operand, scope), (value) => booleanOf(isNull(value)));
};

/**
 * The containers family's evaluators by kind: M1's `is-null` landed, and the stub marker for each
 * kind the family has not landed (ruling R2), which the dispatcher in `#plate/engine/evaluate.ts`
 * never reaches on a checked item.
 */
export const containersEvaluators: FamilyTable<
  | "container-size"
  | "contains"
  | "delete"
  | "field-value"
  | "index"
  | "is-null"
  | "member"
  | "multiple"
  | "ordered"
  | "random"
  | "repeat"
> = {
  "container-size": "unlanded",
  contains: "unlanded",
  delete: "unlanded",
  "field-value": "unlanded",
  index: "unlanded",
  "is-null": evaluateIsNull,
  member: "unlanded",
  multiple: "unlanded",
  ordered: "unlanded",
  random: "unlanded",
  repeat: "unlanded",
};
