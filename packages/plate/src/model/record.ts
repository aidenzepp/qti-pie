/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */

/**
 * The session record: everything the renderer keeps about one item between requests, as data the
 * host stores and hands back.
 *
 * The renderer holds no session state of its own, so {@link ItemRecord} is the whole of an item's
 * session. {@link fresh} starts one, the attempt advances it, and {@link decodeRecord} checks one
 * the host returns before the renderer trusts it.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import type { Item, OutcomeDeclaration } from "#plate/model/item.ts";
import { Value, nullOf } from "#plate/model/values.ts";

/**
 * One item's session as the host stores it.
 *
 * `item` is the item's identifier and `document` its location. `attempt` says how the last submit
 * ended: `none` before any, `refused` when its responses failed validation, `submitted` when they
 * were processed. `responses` and `outcomes` hold every modelled variable by identifier, NULL
 * included. `notices` names the unsupported features the item shows as notices.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ItemRecord` is a Schema and the type it decodes under one name, as section 0.5 of the phase-1 slice list names it, so the record reads as one thing in the attempt, the payload and the session.
export const ItemRecord = Schema.Struct({
  attempt: Schema.Literals(["none", "refused", "submitted"]),
  document: Schema.String,
  instance: Schema.String,
  item: Schema.String,
  kind: Schema.Literal("item"),
  notices: Schema.Array(Schema.String),
  numAttempts: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  outcomes: Schema.Record(Schema.String, Value),
  responses: Schema.Record(Schema.String, Value),
});

/**
 * One item's session as the host stores it.
 */
export type ItemRecord = typeof ItemRecord.Type;

/**
 * Give an outcome's value before any processing that has no default: 0 for a single integer or
 * float, NULL otherwise (`ea422814` §8.2).
 *
 * @param outcome The outcome's declaration.
 * @returns The value.
 */
const initial = (outcome: OutcomeDeclaration): Value =>
  outcome.cardinality === "single" &&
  (outcome.baseType === "integer" || outcome.baseType === "float")
    ? {
        baseType: outcome.baseType,
        cardinality: "single",
        values: [{ baseType: outcome.baseType, value: 0 }],
      }
    : nullOf(outcome.baseType, outcome.cardinality);

/**
 * Give each outcome of an item its starting value, the value a non-adaptive attempt resets it to.
 *
 * @param item The item.
 * @returns Each outcome at its declared default, else 0 for a single integer or float, else NULL,
 *   keyed by identifier.
 */
export const outcomeDefaults = (item: Item): ItemRecord["outcomes"] =>
  Object.fromEntries(
    Array.from(item.outcomes, ([identifier, outcome]) => [
      identifier,
      Option.getOrElse(outcome.defaultValue, () => initial(outcome)),
    ]),
  );

/**
 * Start the session of an item that has not been attempted.
 *
 * @param item The item.
 * @param instance The host's name for this use of the item, which scopes its ids.
 * @returns The record: every response NULL, the outcomes at {@link outcomeDefaults}, no attempts,
 *   and the features of `item.unsupported` shown as notices.
 */
export const fresh = (item: Item, instance: string): ItemRecord => ({
  attempt: "none",
  document: item.document,
  instance,
  item: item.identifier,
  kind: "item",
  notices: item.unsupported.flatMap((entry) => (entry.shown === "notice" ? [entry.feature] : [])),
  numAttempts: 0,
  outcomes: outcomeDefaults(item),
  responses: Object.fromEntries(
    Array.from(item.responses, ([identifier, response]) => [
      identifier,
      nullOf(response.baseType, response.cardinality),
    ]),
  ),
});

/**
 * A session record the host handed back that is not one the renderer could have written.
 */
export class InvalidRecord extends Schema.TaggedError<InvalidRecord>()("InvalidRecord", {
  /**
   * What the record's Schema found wrong, with the path to it.
   */
  issue: Schema.String,
}) {
  /**
   * What is wrong and what to pass instead, in one line.
   */
  override get message(): string {
    return `The session record is not one the renderer wrote: ${this.issue}. Pass back the record the last open or submit returned, unchanged.`;
  }
}

/**
 * Check a session record the host handed back.
 *
 * @param input The stored record, as the host returned it.
 * @returns The record, or {@link InvalidRecord} naming what does not fit.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The host stores the record and hands it back as any value, and this is the check that parses it.
export const decodeRecord = (input: unknown): Effect.Effect<ItemRecord, InvalidRecord> =>
  Schema.decodeUnknownEffect(ItemRecord)(input).pipe(
    Effect.mapError((schemaError) => new InvalidRecord({ issue: schemaError.message })),
  );
