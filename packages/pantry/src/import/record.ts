/**
 * The record of a package as the importer writes it (plan §1.6, fin.md P7): the `Package` row with
 * its `Entry` rows nested in listing order, from what `readPackage` read.
 *
 * The record is every entry's bytes as read, so the model is rebuildable from it, and it is the
 * write's one sequence over a package: grizzle draws each entry's `at` from its place in the
 * nesting and the package's `entries` from their number, and chunks a family past one statement's
 * transport bounds into consecutive statements of the one transaction (fin.md §4.5a), so the
 * importer never splits a package.
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";
import type { EntryRow } from "#pantry/package/record.ts";
import type { Package } from "#pantry/qti/package.ts";

/**
 * A package's insert as its writer writes it: the `Package` row's own fields, and its entries
 * nested at its count field `entries`, each without the `package` the nesting supplies and the `at`
 * the family draws.
 */
export type PackageRecord = Addition<typeof Package> & { readonly entries: readonly EntryRow[] };

/**
 * Name a package by the place it was read from: the last segment of its directory or zip file's
 * path, as given.
 *
 * @param source - The directory or `.zip` file `readPackage` read, `/`-separated.
 * @returns Its last non-empty segment, or the path itself when it has no `/`.
 */
export const packageNameOf = (source: string): string =>
  source.split("/").findLast((segment) => segment.length > 0) ?? source;

/**
 * Build a package's record from what `readPackage` read.
 *
 * @param input - The package's identity and its entries.
 * @param input.id - The package's id, the one its overlays name it by.
 * @param input.name - Its name, {@link packageNameOf} of where it was read from.
 * @param input.files - Its entries with their bytes, in listing order.
 * @returns The `Package` insert, its entries in the listing's order, each content its bytes.
 */
export const packageRecordOf = (input: {
  readonly files: readonly PackageFile[];
  readonly id: Uuid;
  readonly name: string;
}): PackageRecord => ({ entries: recordOf(input.files), id: input.id, name: input.name });
