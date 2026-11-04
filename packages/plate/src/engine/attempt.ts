/**
 * The attempt: one non-adaptive submission of an item, from the record before it to the record
 * after its response processing.
 *
 * {@link runAttempt} is pure. It sets the responses, counts the attempt, resets the outcomes and
 * runs the item's rules with the evaluator. The session decides whether an attempt may run; this
 * module only runs it.
 *
 * @module
 */
import { Option } from "effect";
import { runRules } from "#plate/engine/evaluate.ts";
import type { Item } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";

/**
 * Run one non-adaptive attempt of an item.
 *
 * In order: the given responses replace the record's values of the same identifiers, and every
 * other response keeps the record's value; `numAttempts` goes up by one; the outcomes reset to
 * {@link outcomeDefaults}, because a non-adaptive item resets them before each response processing
 * run; the item's rules run over those variables, and with no processing the outcomes stay at their
 * defaults; `attempt` becomes `submitted`. The record passed in is not changed.
 *
 * A defect the evaluator throws is not caught: it propagates from here, before any record is
 * returned. The caller runs the attempt inside an Effect, where a throw becomes a defect.
 *
 * @param item The item the record belongs to.
 * @param record The session record before the attempt.
 * @param responses The candidate's responses, by identifier, each a value of its declaration's
 *   base type and cardinality.
 * @returns The record after the attempt.
 * @throws {import("#plate/engine/evaluate.ts").UnknownIdentifierError} When a rule names an
 *   identifier the item or the variables do not hold.
 * @throws {import("#plate/engine/evaluate.ts").OutcomeMismatchError} When a rule sets an outcome to
 *   a value of another type.
 * @throws {import("#plate/engine/evaluate.ts").UnmappedResponseError} When a rule maps a response
 *   that has no mapping.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IV_Outcome
 */
export const runAttempt = (
  item: Item,
  record: ItemRecord,
  responses: ItemRecord["responses"],
): ItemRecord => {
  const before = {
    outcomes: outcomeDefaults(item),
    responses: { ...record.responses, ...responses },
  };
  const after = Option.match(item.processing, {
    onNone: () => before,
    onSome: (rules) => runRules(rules, item, before),
  });

  return {
    ...record,
    attempt: "submitted",
    numAttempts: record.numAttempts + 1,
    outcomes: after.outcomes,
    responses: before.responses,
  };
};
