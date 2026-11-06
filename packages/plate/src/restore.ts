/**
 * Give an item's values back from the record the host stored, so the host can render the item
 * again as the candidate left it: {@link restore}.
 *
 * This module decodes the stored record through Schema, so no browser module imports it.
 *
 * @module
 */
import { Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord, StoredRecord } from "#plate/codec/record.ts";
import { fitting } from "#plate/score.ts";
import type { Responses } from "#plate/session/session.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * What {@link restore} gives back for an item: the values its controls show again.
 */
export interface Restored {
  /**
   * The record's responses by identifier, NULL included, to pass to `render` as its `values`.
   */
  readonly values: Responses;
}

/**
 * Give back the values an item's controls showed, from the record the host stored for it.
 *
 * The record is checked against the item as `results` checks it: each response it holds is one
 * the item scores, and each outcome one the item declares, each of its declaration's base type and
 * cardinality, so values the item's controls cannot hold are refused rather than given back.
 *
 * The record alone does not say how to render the item again. Its `instance` need not be the
 * instance the item was rendered with: `score` starts the record of a first attempt with the
 * instance `""`, since it takes no instance and the host chooses one. So for an item delivered on
 * its own the host keeps, beside the record, the instance it passed to `render` and the
 * configuration it rendered with, whose `seed` keys a shuffled Choice's order, and renders the
 * restored values with both, so the ids and the choice order are the ones the candidate saw.
 *
 * @example
 *   const restored = restore(accepted, stored);
 *   // Result.succeed({ values }); render(redacted, configuration, { instance, values })
 *
 * @param document The document `check` accepted, the item the record is for.
 * @param record The record the last `score` of the item returned, as the host stored it and handed
 *   it back.
 * @returns The record's responses as {@link Restored}, or {@link InvalidRecord} at stage `decode`
 *   for a record the renderer could not have written: the version found when that is what does
 *   not fit, or the first response, then the first outcome, that does not fit its declaration.
 */
export const restore = (
  document: Accepted,
  record: StoredRecord,
): Result.Result<Restored, InvalidRecord> =>
  Result.map(
    Result.flatMap(decodeRecord(record), (decoded) => fitting(document.item, decoded)),
    ({ responses }) => ({ values: responses }),
  );
