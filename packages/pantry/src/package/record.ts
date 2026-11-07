/**
 * The record of a package (fin.md P7, settled D6): every entry's bytes as read, in listing order,
 * as the rows of the `Entry` family over the package. The model is rebuildable from these rows.
 */
import type { PackageFile } from "#pantry/package/read.ts";

/**
 * One row of the record: a package entry's path and its bytes.
 *
 * `content` is the bytes in standard base64 with padding (RFC 4648, section 4), the canonical
 * `xs:base64Binary` form, because grizzle has no bytes type. A row carries nothing that another
 * field or its place determines: its `at` is its position in the listing, which grizzle draws
 * when the family is written under its package; whether it is the manifest is a function of
 * `path`; and its byte length is a function of `content` (review R19).
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648#section-4 | RFC 4648, section 4}
 */
export interface EntryRow {
  readonly content: string;
  readonly path: string;
}

/**
 * Turn a package's entries, as `readPackage` reads them, into the rows of its record.
 *
 * @param files - The entries with their bytes, in listing order.
 * @returns One {@link EntryRow} per entry, in the same order.
 */
export const recordOf = (files: readonly PackageFile[]): readonly EntryRow[] =>
  files.map(({ bytes, path }): EntryRow => ({ content: bytes.toBase64(), path }));
