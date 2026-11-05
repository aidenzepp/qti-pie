/**
 * The record of a package (fin.md P7, settled D6): every entry's bytes as read, in listing order,
 * as the rows of the `Entry` family over the package. The model is rebuildable from these rows.
 */
import type { Entry, PackageFile } from "#pantry/package/read.ts";

/**
 * One row of the record: a package entry at its place in the listing, with its bytes.
 *
 * `at` is the entry's 0-based position in `readPackage`'s order, so a package of `n` entries
 * holds `at` 0 to `n - 1` (its `entries` count is `n`). `byteLength` is the length of the bytes as
 * read, and `content` those bytes in standard base64 with padding (RFC 4648, section 4), the
 * canonical `xs:base64Binary` form, because grizzle has no bytes type.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648#section-4 | RFC 4648, section 4}
 */
export interface EntryRow {
  readonly at: bigint;
  readonly byteLength: bigint;
  readonly content: string;
  readonly kind: Entry["kind"];
  readonly path: string;
}

/**
 * Turn a package's entries, as `readPackage` reads them, into the rows of its record.
 *
 * @param files - The entries with their bytes, in listing order.
 * @returns One {@link EntryRow} per entry, in the same order, `at` its index.
 */
export const recordOf = (files: readonly PackageFile[]): readonly EntryRow[] =>
  files.map(({ bytes, kind, path }, at): EntryRow => ({
    at: BigInt(at),
    byteLength: BigInt(bytes.length),
    content: bytes.toBase64(),
    kind,
    path,
  }));
