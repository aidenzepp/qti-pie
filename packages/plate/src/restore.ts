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
import type { Responses } from "#plate/session/session.ts";

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
 * The record alone does not say how to render the item again. Its `instance` need not be the
 * instance the item was rendered with: `score` starts the record of a first attempt with the
 * instance `""`, since it takes no instance and the host chooses one. So for an item delivered on
 * its own the host keeps, beside the record, the instance it passed to `render` and the
 * configuration it rendered with, whose `seed` keys a shuffled Choice's order, and renders the
 * restored values with both, so the ids and the choice order are the ones the candidate saw.
 *
 * @example
 *   const restored = restore(stored);
 *   // Result.succeed({ values }); render(redacted, configuration, { instance, values })
 *
 * @param record The record the last `score` of the item returned, as the host stored it and handed
 *   it back.
 * @returns The record's responses as {@link Restored}, or {@link InvalidRecord} at stage `decode`
 *   for a record the renderer could not have written, the version found when that is what does
 *   not fit.
 */
export const restore = (record: StoredRecord): Result.Result<Restored, InvalidRecord> =>
  Result.map(decodeRecord(record), ({ responses }) => ({ values: responses }));
