/**
 * The rows of the associate interactions: associate, match and graphic-associate.
 */
import { Effect } from "effect";
import type { InteractionContext } from "#qti/import/interactions.ts";
import type { ItemRefusal } from "#qti/import/item.ts";
import type { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";

/**
 * The associate interactions' rows.
 *
 * @param _ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows so far, unchanged until p2-37 fills this builder.
 */
// Filled by p2-37.
export const associateRows = (
  _ctx: InteractionContext,
  rows: Rows,
): Effect.Effect<Rows, UnmodeledVocabulary | ItemRefusal> => Effect.succeed(rows);
