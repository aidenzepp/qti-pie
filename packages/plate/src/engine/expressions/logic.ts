/**
 * The logic family of the engine: the evaluators of `qti-and`, `qti-or`, `qti-not` and
 * `qti-any-n`, each with the information model's three-valued rules, under which a NULL operand is
 * a truth not known.
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Option` and
 * `Result`, and reads the evaluator's types from `#plate/engine/evaluate.ts` as types, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Evaluate, Evaluator, FamilyTable, Scope } from "#plate/engine/evaluate.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { booleanOf } from "#plate/engine/numbers.ts";
import { referenceValue } from "#plate/engine/refs.ts";
import type { Expression, IntegerOrRef } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Give the single boolean NULL, the value of a logic expression whose truth is not known.
 *
 * @returns The NULL.
 */
const unknown = (): Value => nullOf("boolean", "single");

/**
 * Give the truth an operand's value holds: the boolean of a single boolean, none for NULL.
 *
 * Every operand of a logic kind is a single boolean on a checked item: the validator refuses any
 * other (P23). One that is not is counted as NULL, a truth not known, never as true or false.
 *
 * @param value The operand's value.
 * @returns The boolean, or none when the value is NULL or not a single boolean.
 */
const truthOf = (value: Value): Option.Option<boolean> => {
  const [single, ...rest] = value.values;

  return value.cardinality === "single" && rest.length === 0 && single?.baseType === "boolean"
    ? Option.some(single.value)
    : Option.none();
};

/**
 * How many of an expression's operands are true, false and NULL.
 */
interface Tally {
  readonly falses: bigint;
  readonly nulls: bigint;
  readonly trues: bigint;
}

/**
 * Evaluate every operand and count its truths.
 *
 * Every operand is evaluated, left to right, and the first failure is the result, so a later
 * operand's failure is not hidden by an earlier false: an operator has no side effects, so
 * evaluating them all changes no value.
 *
 * @param operands The operands.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The counts, or the first operand's failure.
 */
const tallyOf = (
  operands: readonly Expression[],
  scope: Scope,
  evaluate: Evaluate,
): Result.Result<Tally, EngineFailure> =>
  Result.map(Result.all(operands.map((operand) => evaluate(operand, scope))), (values): Tally => {
    const truths = values.map((value) => truthOf(value));

    return {
      falses: BigInt(truths.filter((truth) => Option.contains(truth, false)).length),
      nulls: BigInt(truths.filter((truth) => Option.isNone(truth)).length),
      trues: BigInt(truths.filter((truth) => Option.contains(truth, true)).length),
    };
  });

/**
 * Give the value of a `qti-and`: a single boolean, true when every operand is true. It is false
 * when any operand is false, whatever the others are, and NULL when some are NULL and the rest
 * true.
 *
 * @param expression The `qti-and`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpAnd
 */
const evaluateAnd: Evaluator<"and"> = (expression, scope, evaluate) =>
  Result.map(tallyOf(expression.operands, scope, evaluate), ({ falses, nulls }) => {
    if (falses > 0n) {
      return booleanOf(false);
    }

    return nulls > 0n ? unknown() : booleanOf(true);
  });

/**
 * Give the value of a `qti-or`: a single boolean, true when any operand is true, whatever the
 * others are. It is false when every operand is false, and NULL when some are NULL and the rest
 * false.
 *
 * @param expression The `qti-or`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpOr
 */
const evaluateOr: Evaluator<"or"> = (expression, scope, evaluate) =>
  Result.map(tallyOf(expression.operands, scope, evaluate), ({ nulls, trues }) => {
    if (trues > 0n) {
      return booleanOf(true);
    }

    return nulls > 0n ? unknown() : booleanOf(false);
  });

/**
 * Give the value of a `qti-not`: a single boolean, the negation of its operand; NULL when the
 * operand is NULL.
 *
 * @param expression The `qti-not`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives the operand's value.
 * @returns The single boolean, or the operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpNot
 */
const evaluateNot: Evaluator<"not"> = (expression, scope, evaluate) => {
  const [operand] = expression.operands;

  return Result.map(evaluate(operand, scope), (value) =>
    Option.match(truthOf(value), {
      onNone: unknown,
      onSome: (held) => booleanOf(!held),
    }),
  );
};

/**
 * Give the integer a bound of `qti-any-n` stands for: its literal, or the value of the variable it
 * names, through the resolver in `#plate/engine/refs.ts` with the kind's checked integer facet.
 *
 * @param scope The item and the variables of the attempt.
 * @param bound The `min` or the `max`.
 * @returns The integer; none when the named variable holds NULL or a value that is not a single
 *   integer, which the validator refuses (P24) on a checked item; or an `UnknownIdentifierError`
 *   when it names a variable the variables hold no value of.
 */
const boundOf = (
  scope: Scope,
  bound: IntegerOrRef,
): Result.Result<Option.Option<bigint>, EngineFailure> =>
  Result.map(
    referenceValue(scope.variables, { baseType: "integer", checked: true, reference: bound }),
    (value) => {
      const [single, ...rest] = value.values;

      return value.cardinality === "single" && rest.length === 0 && single?.baseType === "integer"
        ? Option.some(single.value)
        : Option.none();
    },
  );

/**
 * Give the truth of a `qti-any-n` from its operands' counts and its bounds, by the information
 * model's three-valued rule, over `t` true, `f` false and `u` NULL operands of `n`:
 *
 * - False when `f > n − min`, so fewer than `min` can be true, or `t > max`, so more than `max` are;
 * - True when `t ≥ min` and `t + u ≤ max`, so the count is in range whatever the NULLs are;
 * - NULL otherwise.
 *
 * With `min` 3 and `max` 4 it gives NULL for {T,T,F,NULL}, false for {T,F,F,NULL} and true for
 * {T,T,T,NULL}, the information model's examples. The counts and the bounds are exact integers, so
 * no bound is too large to compare.
 *
 * @param tally The operands' counts.
 * @param min The least number of true operands.
 * @param max The greatest number of true operands.
 * @returns The single boolean.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpAnyN
 */
const anyNOf = ({ falses, nulls, trues }: Tally, min: bigint, max: bigint): Value => {
  if (falses > falses + nulls + trues - min || trues > max) {
    return booleanOf(false);
  }

  return trues >= min && trues + nulls <= max ? booleanOf(true) : unknown();
};

/**
 * Give the value of a `qti-any-n`: a single boolean, whether at least `min` and at most `max` of
 * its operands are true ({@link anyNOf}); NULL when a bound names a variable that holds NULL.
 *
 * The bounds are resolved first, `min` then `max`, as the item model's walks visit them before the
 * operands, then every operand is evaluated left to right; the first failure is the result.
 *
 * @param expression The `qti-any-n`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first failure of a bound or an operand.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpAnyN
 */
const evaluateAnyN: Evaluator<"any-n"> = (expression, scope, evaluate) =>
  Result.gen(function* countAnyN() {
    const min = yield* boundOf(scope, expression.min);
    const max = yield* boundOf(scope, expression.max);
    const tally = yield* tallyOf(expression.operands, scope, evaluate);

    return Option.match(Option.all([min, max]), {
      onNone: unknown,
      onSome: ([least, greatest]) => anyNOf(tally, least, greatest),
    });
  });

/**
 * The logic family's evaluators by kind.
 */
export const logicEvaluators: FamilyTable<"and" | "any-n" | "not" | "or"> = {
  and: evaluateAnd,
  "any-n": evaluateAnyN,
  not: evaluateNot,
  or: evaluateOr,
};
