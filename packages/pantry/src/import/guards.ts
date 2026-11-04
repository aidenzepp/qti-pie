/**
 * The import's guards, run as one: the tree, manifest, item, content, processing and usage
 * checks a built `Rows` must pass before anything is written.
 *
 * @module
 */
import { Effect } from "effect";
import { contentGuards } from "#pantry/import/guards/content.ts";
import type { ContentGuardRefusal } from "#pantry/import/guards/content.ts";
import { itemGuards } from "#pantry/import/guards/item.ts";
import type { ItemGuardRefusal } from "#pantry/import/guards/item.ts";
import { usageGuards } from "#pantry/import/guards/usage.ts";
import type { UsageGuardRefusal } from "#pantry/import/guards/usage.ts";
import { manifestGuards } from "#pantry/import/guards/manifest.ts";
import type { ManifestGuardRefusal } from "#pantry/import/guards/manifest.ts";
import { processingGuards } from "#pantry/import/guards/processing.ts";
import type { ProcessingGuardRefusal } from "#pantry/import/guards/processing.ts";
import { treeGuards } from "#pantry/import/guards/tree.ts";
import type { GuardRefusal } from "#pantry/import/guards/tree.ts";
import type { Rows } from "#pantry/import/tree.ts";
import type { Entry } from "#pantry/package/read.ts";

/**
 * Run the tree, manifest, item, content, processing and usage guards in that order over the rows
 * an import built.
 *
 * @param rows - The rows the import built.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @returns Nothing when every guard passes; fails with the first refusal, in the order tree,
 *   manifest, item, content, processing, usage.
 */
export const guards = Effect.fn("guards")(function* guards(
  rows: Rows,
  entries: readonly Entry[],
): Effect.fn.Return<
  void,
  | GuardRefusal
  | ManifestGuardRefusal
  | ItemGuardRefusal
  | ContentGuardRefusal
  | ProcessingGuardRefusal
  | UsageGuardRefusal
> {
  yield* treeGuards(rows);
  yield* manifestGuards(rows, entries);
  yield* itemGuards(rows);
  yield* contentGuards(rows);
  yield* processingGuards(rows);
  yield* usageGuards(rows);
});
