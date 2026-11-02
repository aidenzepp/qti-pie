/**
 * The rows of the other interactions: media, upload, drawing, slider and end-attempt.
 */
import { Effect } from "effect";
import type { InteractionContext } from "#qti/import/interactions.ts";
import type { ItemRefusal } from "#qti/import/item.ts";
import type { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";

/**
 * The other interactions' rows.
 *
 * @param _ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows so far, unchanged until p2-41 fills this builder.
 */
// Filled by p2-41.
export const otherRows = (
  _ctx: InteractionContext,
  rows: Rows,
): Effect.Effect<Rows, UnmodeledVocabulary | ItemRefusal> => Effect.succeed(rows);
