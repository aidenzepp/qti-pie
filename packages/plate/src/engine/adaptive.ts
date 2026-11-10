/**
 * The adaptive policy: the three answers the session and the engine give differently for an
 * adaptive item than for a non-adaptive one, gathered in one value the hubs consult and the
 * adaptive items module (`m5-03`) fills.
 *
 * QTI gives an adaptive item attempts until its processing completes it: its outcomes are kept
 * from one attempt to the next rather than reset, the item session ends when the built-in
 * `completionStatus` is `completed`, and `max-attempts` does not limit it. The readings bind the
 * two facts the policy stands on: "Item session control is resolved attribute by attribute", whose
 * `max-attempts` is 1 where no element writes it "for a non-adaptive item", and "The built-in
 * outcome variable is `completionStatus`, spelled exactly" (`docs/spec-readings.md`). Today the
 * policy is a stub: {@link adaptivePolicy} answers for every item as the non-adaptive rules do,
 * its `implemented` is false, and nothing an adaptive item does changes until `m5-03` lands.
 *
 * Three hubs consult it as a module-level value: `runAttempt` (`#plate/engine/attempt.ts`) starts
 * an attempt's outcomes through `startingOutcomes`; `inspect` (`#plate/session/start.ts`) closes
 * an item through `closed`; `submitItem` (`#plate/session/submit.ts`) takes its attempt limit
 * through `limit`. A test puts another policy before every hub by swapping this module
 * (`vi.doMock("#plate/engine/adaptive.ts", ...)`) and loading the hubs afresh, since `inspect` is
 * reached through `current` and `itemView`, which take no context that could carry one.
 *
 * @module
 */
import type { Item } from "#plate/model/item.ts";
import {
  completionStatus,
  completionValue,
  holdsCompletionStatus,
  outcomeDefaults,
} from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * What the session and the engine ask of an item's adaptivity: how an attempt starts its
 * outcomes, when the item's attempts have closed it, and what attempt limit a submission checks.
 * Each member takes whether the item is adaptive (`Item.adaptive`, which the session item
 * carries) and answers for that item; the stub answers as for a non-adaptive item whatever it is
 * given.
 */
export interface AdaptivePolicy {
  /**
   * Say whether an item's attempts have closed it. The stub gives
   * `limit > 0 && record.numAttempts >= limit`, the non-adaptive rule for an adaptive item too.
   * `m5-03` gives, for an adaptive item, whether the record's built-in `completionStatus` is
   * `completed`, the value the item's own processing sets when the candidate is done; the limit
   * does not close it.
   *
   * @param adaptive Whether the item is adaptive.
   * @param record The item's session record.
   * @param limit The item's effective attempt limit, 0 for none.
   * @returns Whether the item takes no further attempt.
   */
  readonly closed: (adaptive: boolean, record: ItemRecord, limit: number) => boolean;
  /**
   * Whether the adaptive answers are in force: false while the policy is the stub, so the item
   * model still marks `adaptive="true"` as a feature it does not render; true once `m5-03` fills
   * the policy, when the mark goes.
   */
  readonly implemented: boolean;
  /**
   * Give the attempt limit a submission checks the record's `numAttempts` against. The stub gives
   * `limit` as resolved from the item session control. `m5-03` gives 0, no limit, for an adaptive
   * item, whose attempts end at completion rather than at a count.
   *
   * @param adaptive Whether the item is adaptive.
   * @param limit The item's effective attempt limit, 0 for none.
   * @returns The limit the submission checks, 0 for none.
   */
  readonly limit: (adaptive: boolean, limit: number) => number;
  /**
   * Give the outcomes an attempt's processing starts from. The stub gives the non-adaptive reset:
   * each declared outcome at its default, the one the record's template processing set, else its
   * starting value ({@link outcomeStart}), and the built-in `completionStatus` at `unknown` at the
   * first attempt and at the record's value after, so no declared outcome the record holds reaches
   * the rules. `m5-03` gives, for an adaptive item, the record's outcomes as the last attempt left
   * them, so its rules read and build on them.
   *
   * @param item The item.
   * @param record The session record before the attempt.
   * @returns The outcomes, keyed by identifier.
   */
  readonly startingOutcomes: (item: Item, record: ItemRecord) => ItemRecord["outcomes"];
}

/**
 * Give each declared outcome of an item the value it holds before any processing sets it: the
 * default template processing set for it, else its starting value, and the built-in
 * `completionStatus` at `not_attempted` where the item holds it, as {@link outcomeDefaults} gives
 * them. A default set for a response is not an outcome's, so it never joins the outcomes. The
 * first attempt starts from these, and the non-adaptive reset returns to them.
 *
 * @param item The item.
 * @param defaults The defaults template processing set, by identifier.
 * @returns The outcomes, keyed by identifier.
 */
export const outcomeStart = (
  item: Item,
  defaults: ItemRecord["defaults"],
): ItemRecord["outcomes"] => ({
  ...outcomeDefaults(item),
  ...Object.fromEntries(
    Object.entries(defaults).filter(([identifier]) => item.outcomes.has(identifier)),
  ),
});

/**
 * Give the value the built-in `completionStatus` holds when an attempt's processing starts. It
 * "starts with the reserved value 'not_attempted'. At the start of the first attempt it changes to
 * the reserved value 'unknown'. It remains with this value for the duration of the item session
 * unless set to a different value by a setOutcomeValue rule" (`info.txt:8488`). So the first
 * attempt, where the record counts none, starts it at `unknown`; every later attempt starts from
 * the record's value, the one the last processing left, `not_attempted` included, adaptive or not,
 * and from `unknown` where the record lacks the built-in, as one written before it was held does.
 * The non-adaptive reset to the declared defaults (`info.txt:8486`) covers declared outcomes, and
 * the built-in has no declaration.
 *
 * @param record The session record before the attempt.
 * @returns The built-in's value as the rules first read it.
 */
const startingCompletion = (record: ItemRecord): Value =>
  record.numAttempts === 0
    ? completionValue("unknown")
    : (record.outcomes[completionStatus] ?? completionValue("unknown"));

/**
 * Give the outcomes a non-adaptive attempt's processing starts from: the declared outcomes at
 * their defaults ({@link outcomeStart}), because a non-adaptive item resets them before each
 * response processing run, and the built-in `completionStatus`, where the item holds it, as
 * {@link startingCompletion} gives it.
 *
 * @param item The item.
 * @param record The session record before the attempt.
 * @returns The outcomes, keyed by identifier.
 */
const resetOutcomes = (item: Item, record: ItemRecord): ItemRecord["outcomes"] => {
  const defaults = outcomeStart(item, record.defaults);

  return holdsCompletionStatus(item)
    ? { ...defaults, [completionStatus]: startingCompletion(record) }
    : defaults;
};

/**
 * The policy in force: the stub, which gives every item the non-adaptive answers and reports
 * `implemented` false. `m5-03` replaces it with the adaptive answers each member's contract
 * states.
 */
export const adaptivePolicy: AdaptivePolicy = {
  closed: (_adaptive, record, limit) => limit > 0 && record.numAttempts >= limit,
  implemented: false,
  limit: (_adaptive, limit) => limit,
  startingOutcomes: resetOutcomes,
};
