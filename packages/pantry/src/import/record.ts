/**
 * The record of a package as the importer writes it (plan §1.6, fin.md P7): the `Package` row,
 * keyed by its manifest identifier, and one `Entry` row per entry, from what `readEntries` read.
 *
 * The record is every entry's bytes as read, so the model is rebuildable from it. The entries are a
 * set keyed by their paths, since IMS Content Packaging gives an entry's place in the zip no
 * meaning: no row holds a listing order.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { keyTextOf } from "#pantry/import/key-text.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";
import type { Entry, Package } from "#pantry/qti/package.ts";

/**
 * A package's record as its writer writes it: the `Package` row, and its entries, each keyed by the
 * text of its key (`keyTextOf` of `#pantry/import/key-text.ts`).
 */
export interface PackageRecord {
  readonly entries: ReadonlyMap<string, Addition<typeof Entry>>;
  readonly package: Addition<typeof Package>;
}

/**
 * Build a package's record from its entries, each its path and its bytes, as the read holds them.
 *
 * @param input - The package's identity and its entries.
 * @param input.identifier - Its manifest identifier, the key every row of it holds.
 * @param input.files - Its entries with their bytes.
 * @returns The `Package` row, and each entry's row by its key, its content its bytes.
 */
export const packageRecordOf = (input: {
  readonly files: readonly Pick<PackageFile, "bytes" | "path">[];
  readonly identifier: Addition<typeof Package>["identifier"];
}): PackageRecord => ({
  entries: new Map(
    recordOf(input.files).map(
      ({ content, path }) =>
        [keyTextOf(input.identifier, path), { content, package: input.identifier, path }] as const,
    ),
  ),
  package: { identifier: input.identifier },
});
