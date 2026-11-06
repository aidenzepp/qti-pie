/**
 * The import's guards, run as one: the tree, manifest, item, content, reference, test, processing,
 * usage and wildcard checks a built `Rows` must pass before anything is written.
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
import { referenceGuards } from "#pantry/import/guards/reference.ts";
import type { ReferenceGuardRefusal } from "#pantry/import/guards/reference.ts";
import { testGuards } from "#pantry/import/guards/test.ts";
import type { TestGuardRefusal } from "#pantry/import/guards/test.ts";
import { processingGuards } from "#pantry/import/guards/processing.ts";
import type { ProcessingGuardRefusal } from "#pantry/import/guards/processing.ts";
import { wildcardGuards } from "#pantry/import/guards/wildcard.ts";
import type { WildcardGuardRefusal } from "#pantry/import/guards/wildcard.ts";
import { treeGuards } from "#pantry/import/guards/tree.ts";
import type { GuardRefusal } from "#pantry/import/guards/tree.ts";
import type { Rows } from "#pantry/import/tree.ts";
import type { Entry } from "#pantry/package/read.ts";

/**
 * Run the tree, manifest, item, content, reference, test, processing, usage and wildcard guards in
 * that order over the rows an import built. The wildcard guard runs last, so every other refusal
 * still comes first.
 *
 * @param rows - The rows the import built.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @returns Nothing when every guard passes; fails with the first refusal, in the order tree,
 *   manifest, item, content, reference, test, processing, usage, wildcard.
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
  | ReferenceGuardRefusal
  | TestGuardRefusal
  | ProcessingGuardRefusal
  | UsageGuardRefusal
  | WildcardGuardRefusal
> {
  yield* treeGuards(rows);
  yield* manifestGuards(rows, entries);
  yield* itemGuards(rows);
  yield* contentGuards(rows);
  yield* referenceGuards(rows);
  yield* testGuards(rows);
  yield* processingGuards(rows);
  yield* usageGuards(rows);
  yield* wildcardGuards(rows);
});
