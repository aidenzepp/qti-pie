/**
 * The session record: everything the renderer keeps about one item between requests, as data the
 * host stores and hands back.
 *
 * The renderer holds no session state of its own, so {@link ItemRecord} is the whole of an item's
 * session. {@link fresh} starts one and the attempt advances it.
 *
 * @module
 */
import { Option } from "effect";
import type { Item, OutcomeDeclaration } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * One item's session as the renderer holds it, each value of base type integer an exact `bigint`.
 *
 * `item` is the item's identifier and `document` its location. `instance` is the host's name for
 * this use of the item, which scopes its ids. `attempt` is `none` before any attempt and
 * `submitted` once `score` has processed one, and `numAttempts` counts the attempts processed. A
 * refused post is no state of the record: `score` returns no record for it, and a host that counts
 * refused posts keeps that count itself.
 * `responses` and `outcomes` hold every modelled variable by identifier, NULL included. `notices`
 * names the unsupported features the item shows as notices.
 */
export interface ItemRecord {
  readonly attempt: "none" | "submitted";
  readonly document: string;
  readonly instance: string;
  readonly item: string;
  readonly kind: "item";
  readonly notices: readonly string[];
  readonly numAttempts: number;
  readonly outcomes: { readonly [identifier: string]: Value };
  readonly responses: { readonly [identifier: string]: Value };
}

/**
 * Give the value an outcome holds before any processing sets it: its declared default, else 0 for
 * a single integer or float, else NULL. An item's and a test's outcomes start alike, so the record
 * and the results report read the same value.
 *
 * @param outcome The outcome's declaration.
 * @returns The outcome's starting value.
 */
export const startingValue = (outcome: OutcomeDeclaration): Value =>
  Option.getOrElse(outcome.defaultValue, (): Value => {
    if (outcome.cardinality === "single" && outcome.baseType === "integer") {
      return {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: 0n }],
      };
    }

    return outcome.cardinality === "single" && outcome.baseType === "float"
      ? { baseType: "float", cardinality: "single", values: [{ baseType: "float", value: 0 }] }
      : nullOf(outcome.baseType, outcome.cardinality);
  });

/**
 * Give each outcome of an item its starting value, the value a non-adaptive attempt resets it to.
 *
 * @param item The item.
 * @returns Each outcome at {@link startingValue}, keyed by identifier.
 */
export const outcomeDefaults = (item: Item): ItemRecord["outcomes"] =>
  Object.fromEntries(
    Array.from(item.outcomes, ([identifier, outcome]) => [identifier, startingValue(outcome)]),
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
