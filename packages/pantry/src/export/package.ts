/**
 * The export of a package: every document the database holds for it rebuilt from its scan and
 * written in its charset, and every other entry written from the record (fin.md P7, D6, §4.6).
 *
 * A package's entries are its `Entry` family, in listing order. Each entry that is a document, a
 * `Document` row of the package at its path, is read by one ordered scan of its nodes, page by page
 * (`#pantry/export/scan.ts` `documentScanOf`, `#pantry/export/pages.ts`), and written from its
 * folded rows by `scanXml` (`#pantry/export/render.ts`) in its export charset; every other entry is
 * written as the bytes the import read. No tree is walked and no query recurses.
 */
import { Db } from "@bjornpagen/grizzle";
import type { CursorError, DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Effect, FileSystem, Option, Path, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { compareRecord } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { addRow, emptyScan, scannedRows } from "#pantry/export/pages.ts";
import type { DocumentRowCount, XmlVersionUnread } from "#pantry/export/pages.ts";
import { scanXml } from "#pantry/export/render.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { writeZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import { qti } from "#pantry/qti/schema.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";

/**
 * The rows each page of a document's scan asks for.
 *
 * A page is one flight of the scan's statements, so its size trades round trips against the rows
 * held at once: a document of the corpus is a few pages of this size, and a page holds a few
 * thousand rows with their attributes.
 */
const pageSize = 1000;

/**
 * An export of a package id that no imported package has.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class PackageNotFound extends Schema.TaggedError<PackageNotFound>()("PackageNotFound", {
  packageId: Schema.String,
}) {
  /**
   * What is missing, naming the id.
   */
  override get message(): string {
    return `No imported package has the id ${this.packageId}.`;
  }
}

/**
 * What can stop an export before it writes: the database, a page cursor the scan does not accept, a
 * package id no package has, a document whose scanned rows are not one document's, or one that
 * cannot be written in its charset.
 */
type EntriesError =
  | OpenError
  | ReadError
  | CursorError
  | PackageNotFound
  | AssembleError
  | DocumentRowCount
  | XmlVersionUnread
  | EncodeError;

/**
 * The entries an export of the package `packageId` writes, in listing order, without writing any.
 *
 * Each document of the package is scanned in pages of `size` rows and written from the folded rows
 * by `scanXml` (`#pantry/export/render.ts`) in its export charset; a document that cannot be
 * written in that charset fails here, and nothing falls back to another. Every other entry is the
 * record's bytes. A document whose path the record lacks, which `Entry`'s laws refuse, is written
 * after the record's entries, so a comparison reports it rather than losing it.
 *
 * The documents, the record and each page are separate reads, each in a snapshot of its own. They
 * agree because a package is written once, in one transaction, and never changed: no relation of
 * the schema is mutable, and an immutable owner's family is fixed when it is inserted.
 *
 * Fails with `PackageNotFound` when no imported package has the id, before any scan.
 *
 * @param packageId - The id of the imported package.
 * @param size - The rows each page of a scan asks for, at least 1; paging is invisible, so every
 *   size gives the same entries.
 * @returns The path and bytes of every entry. Fails with the database's, the scan's or the
 *   encoder's error, or `PackageNotFound`, every one an export raises before it writes.
 */
export const exportEntries = Effect.fn("export.exportEntries")(function* exportEntries(
  packageId: Uuid,
  size: number = pageSize,
): Effect.fn.Return<readonly ZipEntry[], EntriesError, DbLayer<AuthorRole>> {
  yield* Effect.annotateCurrentSpan({ packageId, pageSize: size });

  const db = yield* Db.open(authorLogin(qti()).roles.author, {});
  if (Option.isNone(yield* db.get(Package, { id: packageId }))) {
    return yield* new PackageNotFound({ packageId });
  }

  const documents = yield* (yield* db.workload.documentsOf.execute({ package: packageId })).collect;
  const record = yield* (yield* db.workload.entriesOf.execute({ package: packageId })).collect;
  const rendered = new Map<string, Uint8Array>();
  for (const { node, path } of documents) {
    const scan = yield* Stream.runFold(
      scannedRows((request) => db.workload.documentScan.page({ document: node }, request), size),
      emptyScan<Composed>,
      addRow,
    ).pipe(Effect.withSpan("export.scanDocument", { attributes: { document: node, path } }));

    rendered.set(path, yield* scanXml(node, scan));
  }

  const recorded = new Set(record.map(({ path }) => path));
  const entries: readonly ZipEntry[] = [
    ...record.map(({ content, path }) => ({
      bytes: rendered.get(path) ?? content,
      path,
    })),
    ...[...rendered].flatMap(([path, bytes]) => (recorded.has(path) ? [] : [{ bytes, path }])),
  ];
  yield* Effect.annotateCurrentSpan({ documents: documents.length, entries: entries.length });

  return entries;
});

/**
 * Compare entries an export of the package `packageId` wrote with its record: the `Entry`
 * family's bytes, read from the database, against those entries.
 *
 * The record is one read of the package's entries; the export's documents are not scanned again,
 * so a caller that has just exported the package, as `roundtrip` has, compares what it wrote.
 *
 * @param packageId - The id of the imported package.
 * @param exported - The entries an export of it wrote, as {@link exportEntries} or
 *   {@link exportPackage} gives them.
 * @returns One outcome per path (`#pantry/export/compare.ts` `compareRecord`): byte equality
 *   reported, canonical equality held to. Fails with the database's error.
 */
export const compareExported = Effect.fn("export.compareExported")(function* compareExported(
  packageId: Uuid,
  exported: readonly ZipEntry[],
): Effect.fn.Return<Report, OpenError | ReadError, DbLayer<AuthorRole>> {
  const db = yield* Db.open(authorLogin(qti()).roles.author, {});
  const record = yield* (yield* db.workload.entriesOf.execute({ package: packageId })).collect;

  return yield* compareRecord(
    record.map(({ content, path }) => ({ bytes: content, path })),
    exported,
  );
});

/**
 * Compare an export of the package `packageId` with its record, all from the database: the
 * `Entry` family's bytes against the entries {@link exportEntries} writes.
 *
 * @param packageId - The id of the imported package.
 * @returns One outcome per path, as {@link compareExported} gives it. Fails as
 *   {@link exportEntries} does.
 */
export const compareWithRecord = Effect.fn("export.compareWithRecord")(function* compareWithRecord(
  packageId: Uuid,
): Effect.fn.Return<Report, EntriesError, DbLayer<AuthorRole>> {
  return yield* compareExported(packageId, yield* exportEntries(packageId));
});

/**
 * Write entries to `target`: a directory holding each entry as a file at its path, or, when
 * `target` ends `.zip`, one zip file holding the entries at those paths, written by `writeZip`.
 *
 * The directory, or the zip file's directory, and every directory an entry's path names are
 * created when absent.
 *
 * @param entries - The entries to write, as {@link exportEntries} gives them.
 * @param target - The directory to write under, or the `.zip` file to write.
 * @returns Completes once every entry is written. Fails with the file system's error.
 */
export const writeEntries = Effect.fn("export.writeEntries")(function* writeEntries(
  entries: readonly ZipEntry[],
  target: string,
): Effect.fn.Return<void, PlatformError.PlatformError, FileSystem.FileSystem | Path.Path> {
  yield* Effect.annotateCurrentSpan({ entries: entries.length, target });

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  if (target.endsWith(".zip")) {
    yield* fs.makeDirectory(path.dirname(target), { recursive: true });
    yield* fs.writeFile(target, writeZip(entries));

    return;
  }

  for (const entry of entries) {
    const file = path.join(target, entry.path);

    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFile(file, entry.bytes);
  }
});

/**
 * Write the package `packageId` to `target`: a directory of the files it was imported from, or,
 * when `target` ends `.zip`, one zip file holding the same entries.
 *
 * The entries are those of {@link exportEntries}, all read, assembled and encoded before
 * {@link writeEntries} writes anything, so an export that cannot be made writes nothing.
 *
 * @param packageId - The id of the imported package.
 * @param target - The directory to write under, or the `.zip` file to write, created when absent.
 * @returns The entries it wrote, in the order it wrote them. Fails with the database's, the
 *   scan's, the encoder's or the file system's error.
 */
export const exportPackage = Effect.fn("export.exportPackage")(function* exportPackage(
  packageId: Uuid,
  target: string,
): Effect.fn.Return<
  readonly ZipEntry[],
  EntriesError | PlatformError.PlatformError,
  DbLayer<AuthorRole> | FileSystem.FileSystem | Path.Path
> {
  yield* Effect.annotateCurrentSpan({ packageId, target });

  const entries = yield* exportEntries(packageId);
  yield* writeEntries(entries, target);

  return entries;
});
