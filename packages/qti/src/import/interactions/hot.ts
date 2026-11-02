/**
 * The rows of the hot interactions: hotspot, hottext, select-point and position-object.
 */
import { Effect } from "effect";
import type { InteractionContext } from "#qti/import/interactions.ts";
import type { ItemRefusal } from "#qti/import/item.ts";
import type { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";

/**
 * The hot interactions' rows.
 *
 * @param _ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows so far, unchanged until p2-39 fills this builder.
 */
// Filled by p2-39.
export const hotRows = (
  _ctx: InteractionContext,
  rows: Rows,
): Effect.Effect<Rows, UnmodeledVocabulary | ItemRefusal> => Effect.succeed(rows);
