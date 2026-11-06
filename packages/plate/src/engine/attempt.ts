/**
 * The attempt: one non-adaptive submission of an item, from the record before it to the record
 * after its response processing.
 *
 * {@link runAttempt} is pure. It sets the responses, counts the attempt, resets the outcomes and
 * runs the item's rules with the evaluator, and returns the evaluator's failure rather than throw
 * it. The author's flow decides whether an attempt may run (rule `a9d04969`); this module only
 * runs it.
 *
 * @module
 */
import { Option, Result } from "effect";
import { runRules } from "#plate/engine/evaluate.ts";
import type { EngineFailure, Variables } from "#plate/engine/evaluate.ts";
import type { Item } from "#plate/model/item.ts";
import {
  completionStatus,
  completionValue,
  holdsCompletionStatus,
  outcomeDefaults,
} from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";

/**
 * Give the outcomes an attempt's processing starts from: each outcome at its default
 * ({@link outcomeDefaults}), because a non-adaptive item resets them before each response
 * processing run, and the built-in `completionStatus` at `unknown`, where the item holds it, since
 * it "changes to the reserved value 'unknown'" when an attempt starts (`info.txt:8488`). So no
 * outcome the record holds reaches the rules.
 *
 * @param item The item.
 * @returns The outcomes, keyed by identifier.
 */
const startingOutcomes = (item: Item): ItemRecord["outcomes"] => {
  const defaults = outcomeDefaults(item);

  return holdsCompletionStatus(item)
    ? { ...defaults, [completionStatus]: completionValue("unknown") }
    : defaults;
};

/**
 * Run one non-adaptive attempt of an item.
 *
 * In order: the given responses replace the record's values of the same identifiers, and every
 * other response keeps the record's value; `numAttempts` goes up by one; the outcomes reset to
 * {@link outcomeDefaults}, because a non-adaptive item resets them before each response processing
 * run, and the built-in `completionStatus` starts at `unknown` ({@link startingOutcomes}); the
 * item's rules run over those variables, and with no processing the outcomes stay where they
 * started; `attempt` becomes `submitted`. The rules read the built-in `numAttempts` as the raised
 * count, this attempt included, because QTI raises it at the start of each attempt, and may read
 * and set `completionStatus`, which the record then keeps. The record passed in is not changed, on
 * success or on failure.
 *
 * @param item The item the record belongs to.
 * @param record The session record before the attempt.
 * @param responses The candidate's responses, by identifier, each a value of its declaration's
 *   base type and cardinality.
 * @returns The record after the attempt, or the evaluator's first failure, an
 *   {@link EngineFailure}: a rule names an identifier the item or the variables do not hold, sets
 *   an outcome to a value of another type, or maps a response that has no mapping.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IV_Outcome
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IV_Response
 */
export const runAttempt = (
  item: Item,
  record: ItemRecord,
  responses: ItemRecord["responses"],
): Result.Result<ItemRecord, EngineFailure> => {
  const before: Variables = {
    numAttempts: BigInt(record.numAttempts) + 1n,
    outcomes: startingOutcomes(item),
    responses: { ...record.responses, ...responses },
  };
  const after: Result.Result<Variables, EngineFailure> = Option.match(item.processing, {
    onNone: () => Result.succeed(before),
    onSome: (rules) => runRules(rules, item, before),
  });

  return after.pipe(
    Result.map((variables): ItemRecord => ({
      ...record,
      attempt: "submitted",
      numAttempts: record.numAttempts + 1,
      outcomes: variables.outcomes,
      responses: before.responses,
    })),
  );
};
