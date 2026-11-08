/**
 * The record of a package (fin.md P7, settled D6): every entry's bytes as read, in listing order,
 * as the rows of the `Entry` family over the package. The model is rebuildable from these rows.
 */
import type { PackageFile } from "#pantry/package/read.ts";

/**
 * One row of the record: a package entry's path and its bytes as read, which `Entry.content`, a
 * grizzle `bytes` field, holds as they are.
 *
 * A row carries nothing that another field or its place determines: its `at` is its position in
 * the listing, which grizzle draws when the family is written under its package; whether it is the
 * manifest is a function of `path`; and its byte length is a function of `content` (review R19).
 */
export interface EntryRow {
  readonly content: Uint8Array<ArrayBuffer>;
  readonly path: string;
}

/**
 * Read an entry's bytes as a grizzle `bytes` value, a `Uint8Array` over an `ArrayBuffer`: a view of
 * the same bytes where they lie in one, which a file the platform reads always does, and a copy
 * where they lie in a `SharedArrayBuffer`. grizzle copies the value once more, into its
 * statement's binary array, as it sends the row.
 *
 * @param bytes - The entry's bytes as read.
 * @returns The same bytes over an `ArrayBuffer`.
 */
const contentOf = (bytes: Uint8Array): Uint8Array<ArrayBuffer> =>
  bytes.buffer instanceof ArrayBuffer
    ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    : new Uint8Array(bytes);

/**
 * Turn a package's entries, as `readPackage` reads them, into the rows of its record.
 *
 * @param files - The entries with their bytes, in listing order.
 * @returns One {@link EntryRow} per entry, in the same order.
 */
export const recordOf = (files: readonly PackageFile[]): readonly EntryRow[] =>
  files.map(({ bytes, path }): EntryRow => ({ content: contentOf(bytes), path }));
