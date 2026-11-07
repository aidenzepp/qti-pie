/**
 * Start the stored record of an item's first attempt: {@link begin}.
 *
 * This module encodes the record through the record's Schema codec, so it sits on the Schema side
 * beside `score` and `restore`, and no browser module imports it.
 *
 * @module
 */
import { Result } from "effect";
import { encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord, StoredRecord } from "#plate/codec/record.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * Start the stored record of an item's first attempt: run its template processing under the
 * host's seed and set every response and outcome to its default, in the form the host stores.
 *
 * The record holds the seed, written with `String` (`""` when the host gives none, as a shuffled
 * Choice's order keys an absent seed), the template values template processing drew under the
 * seed, the instance and the item, the correct responses and defaults it set, and each response
 * and outcome at its default. The same document, instance and seed give the same record every run.
 * An item that declares no template variable holds no template value, correct response or default.
 *
 * The record is server data: its template values and correct responses can give the answers away.
 * The host stores it where only the server reads it, renders the first page from what
 * `restore(document, record)` gives back, and passes it to `score` with the first responses.
 *
 * @example
 *   const stored = begin(accepted, { instance: "q1", seed: 7 });
 *   // Result.succeed(record); store it, then restore(accepted, record) to render the first page
 *
 * @param document The document `check` accepted.
 * @param start `instance`, the host's name for this use of the item, which scopes its ids, and
 *   `seed`, the host's seed, which keys every value template processing draws; none keys them as
 *   the empty string.
 * @returns The record of the first attempt, in the form the host stores, or {@link InvalidRecord}
 *   at stage `encode`, a renderer defect, or an {@link EngineFailure} from template processing.
 *   The engine's failure cannot occur on a checked item: the validator refuses every cause on an
 *   accepted item (a read of a variable template processing holds no value of, a rule setting a
 *   variable the item does not declare in the kind the rule sets, a value of another type), so a
 *   host writes no handling for it.
 */
export const begin = (
  document: Accepted,
  start: { readonly instance: string; readonly seed?: number },
): Result.Result<StoredRecord, EngineFailure | InvalidRecord> =>
  Result.flatMap(
    firstAttempt(document.item, {
      instance: start.instance,
      seed: start.seed === undefined ? "" : String(start.seed),
    }),
    encodeRecord,
  );
