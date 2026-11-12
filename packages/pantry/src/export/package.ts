/**
 * The export of a package, named by its manifest identifier: every document the database holds for
 * it rebuilt from its scan and written in its charset, and every other entry written from the
 * record (fin.md P7, D6, §4.6).
 *
 * A package's entries are its `Entry` rows, by path, each read with its `Document` row where it is
 * a document (`#pantry/export/scan.ts` `entriesOf`). A document is read by one ordered scan of its
 * nodes at its key, the package and its path, page by page (`documentScan`,
 * `#pantry/export/pages.ts`), assembled with one stack (`#pantry/model/assemble.ts`) and written by
 * `unshred` in its export charset; every other entry is written as the bytes the import read. No
 * tree is walked and no query recurses.
 */
import { Db } from "@bjornpagen/grizzle/runtime";
import type { CursorError } from "@bjornpagen/grizzle";
import type { DbLayer, OpenError, ReadError } from "@bjornpagen/grizzle/runtime";
import { Effect, FileSystem, Option, Path, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { AuthorLogin } from "#pantry/db/served.ts";
import { byPath, compareRecord } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { addRow, emptyScan, scannedRows } from "#pantry/export/pages.ts";
import type { DocumentRowCount } from "#pantry/export/pages.ts";
import { scanXml } from "#pantry/export/render.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { writeZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
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
 * An export of a manifest identifier that no imported package has.
 */
export class PackageNotFound extends Schema.TaggedError<PackageNotFound>()("PackageNotFound", {
  /**
   * The manifest identifier the export named.
   */
  package: Schema.String,
}) {
  /**
   * What is missing, naming the identifier.
   */
  override get message(): string {
    return `No imported package has the manifest identifier ${this.package}.`;
  }
}

/**
 * What can stop an export before it writes: the database, a page cursor the scan does not accept, a
 * manifest identifier no package has, a document whose scanned rows are not one document's, or one
 * that cannot be written in its charset.
 */
type EntriesError =
  | OpenError
  | ReadError
  | CursorError
  | PackageNotFound
  | AssembleError
  | DocumentRowCount
  | EncodeError;

/**
 * The entries an export of the package `identifier` names writes, by path, without writing any.
 *
 * The record is read once, each entry with its document where it is one. Each document is scanned
 * in pages of `size` rows, assembled, and written by `unshred` in its export charset; a document
 * that cannot be written in that charset fails here, and nothing falls back to another. Every
 * other entry is the record's bytes. Every document's path is an entry's: the database holds it,
 * as the law "Document entry" states (`#pantry/qti/package.ts`, `Document` ⊆ `Entry` over package
 * and path), and refused every write that broke it, so the export reads each document from the
 * entry it is, at the entry's key, and checks the law again nowhere.
 *
 * The record and each page are separate reads, each in a snapshot of its own. They agree because
 * a package is written once, in one transaction, and never changed: no relation of the schema is
 * mutable, and an immutable owner's family is fixed when it is inserted.
 *
 * Fails with `PackageNotFound` when no imported package has the identifier, before any scan.
 *
 * @param identifier - The imported package's manifest identifier, its key.
 * @param size - The rows each page of a scan asks for, at least 1; paging is invisible, so every
 *   size gives the same entries.
 * @returns The path and bytes of every entry. Fails with the database's, the scan's or the
 *   encoder's error, or `PackageNotFound`, every one an export raises before it writes.
 */
export const exportEntries = Effect.fn("export.exportEntries")(function* exportEntries(
  identifier: string,
  size: number = pageSize,
): Effect.fn.Return<readonly ZipEntry[], EntriesError, AuthorLogin | DbLayer<AuthorRole>> {
  yield* Effect.annotateCurrentSpan({ package: identifier, pageSize: size });

  const login = yield* AuthorLogin;
  const db = yield* Db.open(login.roles.author, {});
  if (Option.isNone(yield* db.workload.packageOf.get({ identifier }))) {
    return yield* new PackageNotFound({ package: identifier });
  }

  const record = yield* (yield* db.workload.entriesOf.execute({ package: identifier })).collect;
  const entries = yield* Effect.all(
    record.map(({ content, document, path }): Effect.Effect<ZipEntry, EntriesError> =>
      Option.match(document, {
        onNone: () => Effect.succeed({ bytes: content, path }),
        onSome: () =>
          Stream.runFold(
            scannedRows(
              (request) => db.workload.documentScan.page({ package: identifier, path }, request),
              size,
            ),
            emptyScan<Composed>,
            addRow,
          ).pipe(
            Effect.flatMap((scan) => scanXml({ package: identifier, path }, scan)),
            Effect.map((bytes) => ({ bytes, path })),
            Effect.withSpan("export.scanDocument", { attributes: { package: identifier, path } }),
          ),
      }),
    ),
  );
  yield* Effect.annotateCurrentSpan({
    documents: record.filter(({ document }) => Option.isSome(document)).length,
    entries: entries.length,
  });

  return entries;
});

/**
 * Compare entries an export of the package `identifier` names wrote with its record: the `Entry`
 * rows' bytes, read from the database, against those entries.
 *
 * The record is one read of the package's entries; the export's documents are not scanned again,
 * so a caller that has just exported the package, as `roundtrip` has, compares what it wrote.
 *
 * @param identifier - The imported package's manifest identifier.
 * @param exported - The entries an export of it wrote, as {@link exportEntries} or
 *   {@link exportPackage} gives them.
 * @returns One outcome per path (`#pantry/export/compare.ts` `compareRecord`): byte equality
 *   reported, canonical equality held to. Fails with the database's error.
 */
export const compareExported = Effect.fn("export.compareExported")(function* compareExported(
  identifier: string,
  exported: readonly ZipEntry[],
): Effect.fn.Return<Report, OpenError | ReadError, AuthorLogin | DbLayer<AuthorRole>> {
  const login = yield* AuthorLogin;
  const db = yield* Db.open(login.roles.author, {});
  const record = yield* (yield* db.workload.entriesOf.execute({ package: identifier })).collect;

  return yield* compareRecord(
    new Map(record.map(({ content, path }) => [path, content])),
    byPath(exported),
  );
});

/**
 * Compare an export of the package `identifier` names with its record, all from the database: the
 * `Entry` rows' bytes against the entries {@link exportEntries} writes.
 *
 * @param identifier - The imported package's manifest identifier.
 * @returns One outcome per path, as {@link compareExported} gives it. Fails as
 *   {@link exportEntries} does.
 */
export const compareWithRecord = Effect.fn("export.compareWithRecord")(function* compareWithRecord(
  identifier: string,
): Effect.fn.Return<Report, EntriesError, AuthorLogin | DbLayer<AuthorRole>> {
  return yield* compareExported(identifier, yield* exportEntries(identifier));
});

/**
 * Write the package `identifier` names to `target`: a directory of the files it was imported from,
 * or, when `target` ends `.zip`, one zip file holding the same entries.
 *
 * The entries are those of {@link exportEntries}, all read, assembled and encoded before anything
 * is written, so an export that cannot be made writes nothing. A zip target holds those entries at
 * those paths, written by `writeZip`, and its directory is created when absent.
 *
 * @param identifier - The imported package's manifest identifier.
 * @param target - The directory to write under, or the `.zip` file to write, created when absent.
 * @returns The entries it wrote, in the order it wrote them. Fails with the database's, the
 *   scan's, the encoder's or the file system's error.
 */
export const exportPackage = Effect.fn("export.exportPackage")(function* exportPackage(
  identifier: string,
  target: string,
): Effect.fn.Return<
  readonly ZipEntry[],
  EntriesError | PlatformError.PlatformError,
  AuthorLogin | DbLayer<AuthorRole> | FileSystem.FileSystem | Path.Path
> {
  yield* Effect.annotateCurrentSpan({ package: identifier, target });

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* exportEntries(identifier);

  if (target.endsWith(".zip")) {
    yield* fs.makeDirectory(path.dirname(target), { recursive: true });
    yield* fs.writeFile(target, writeZip(entries));

    return entries;
  }

  for (const entry of entries) {
    const file = path.join(target, entry.path);

    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFile(file, entry.bytes);
  }

  return entries;
});
