/**
 * Pantry's export programs, as an app calls them: a stored package's entries, and one of its
 * documents read alone.
 *
 * `exportPackage` gives the entries the internal export makes (`#pantry/export/package.ts`
 * `exportEntries`), which owns their span; it writes nothing, so an app stores or serves the bytes
 * itself. `readDocument` reads one document by its package and entry path, the read plate needs: it
 * pages that document's scan (`#pantry/export/scan.ts` `documentScanOf`) as the export does and
 * writes the rows with `documentXml` (`#pantry/export/render.ts`). Both run on the author login,
 * so they require its `DbLayer`, the app's own connection to the installation of the `Qti` schema.
 */
import { Db } from "@bjornpagen/grizzle";
import type { CursorError, DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Effect, Option, Schema, Stream } from "effect";
import { PackageNotFound, exportEntries } from "#pantry/export/package.ts";
import { scannedRows } from "#pantry/export/pages.ts";
import type { DocumentRowCount, XmlVersionUnread } from "#pantry/export/pages.ts";
import { documentXml } from "#pantry/export/render.ts";
import type { AssembleError } from "#pantry/model/assemble.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import { qti } from "#pantry/qti/schema.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";

/**
 * The rows each page of a document's scan asks for, the internal export's own page size: a page is
 * one flight of the scan's statements, and paging is invisible in the bytes written.
 */
const pageSize = 1000;

/**
 * One entry of an exported package: its path in the package, and its bytes as QTI 3.0 writes them,
 * a document rebuilt from the database in its export charset and every other file as it was
 * imported.
 */
export interface PackageEntry {
  readonly bytes: Uint8Array;
  readonly path: string;
}

/**
 * A document read for a package id and entry path when the package, which is stored, holds no
 * document at that path: the path names another file of the package, or none.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class DocumentNotFound extends Schema.TaggedError<DocumentNotFound>()("DocumentNotFound", {
  packageId: Schema.String,
  path: Schema.String,
}) {
  /**
   * What is missing, naming the package and the path, and where the paths that exist are listed.
   */
  override get message(): string {
    return `The package ${this.packageId} holds no document at the path ${JSON.stringify(this.path)}. Read a path listDocuments gives for this package.`;
  }
}

/**
 * What can stop a document from being written once its rows are read: rows that are not one
 * document's (`AssembleError`, `DocumentRowCount`), an XML version no declaration can be written
 * from (`XmlVersionUnread`), or a document its export charset cannot write (`EncodeError`).
 */
type WriteError = AssembleError | DocumentRowCount | XmlVersionUnread | EncodeError;

/**
 * What can stop an export: the database refusing the author login's session or a read, a page
 * cursor the scan does not accept, a package id no stored package has, or a document that cannot
 * be written.
 */
export type ExportError = OpenError | ReadError | CursorError | PackageNotFound | WriteError;

/**
 * Export the stored package `packageId`: every entry it was imported with, in listing order, each
 * document rebuilt from the database and written in its export charset, and every other file as
 * the bytes the import read. Nothing is written to a file; the entries are all read, assembled and
 * encoded before the program succeeds, so an export that cannot be made gives no entries.
 *
 * @param packageId - The id `importPackage` accepted the package under.
 * @returns The package's entries. Fails with `PackageNotFound` when no stored package has the id,
 *   with a document's write error when one of its documents cannot be written, or with grizzle's
 *   own error when the database fails.
 */
export const exportPackage = (
  packageId: Uuid,
): Effect.Effect<readonly PackageEntry[], ExportError, DbLayer<AuthorRole>> =>
  exportEntries(packageId);

/**
 * Read one document of the stored package `packageId`, the one at the entry path `path`, as the
 * export writes it: rebuilt from the database in its export charset.
 *
 * The package is checked first, then its documents are read for the path, then that document's
 * scan is paged; each read runs in a snapshot of its own, and they agree because a stored package
 * is never changed.
 *
 * @param packageId - The id `importPackage` accepted the package under.
 * @param path - The document's entry path in the package, as `listDocuments` gives it.
 * @returns The document's XML bytes. Fails with `PackageNotFound` when no stored package has the
 *   id, `DocumentNotFound` when the package holds no document at the path, the document's write
 *   error when it cannot be written, or grizzle's own error when the database fails.
 */
export const readDocument = Effect.fn("api.readDocument")(function* readDocument(
  packageId: Uuid,
  path: string,
): Effect.fn.Return<Uint8Array, ExportError | DocumentNotFound, DbLayer<AuthorRole>> {
  yield* Effect.annotateCurrentSpan({ packageId, path });

  const db = yield* Db.open(authorLogin(qti()).roles.author, {});
  if (Option.isNone(yield* db.get(Package, { id: packageId }))) {
    return yield* new PackageNotFound({ packageId });
  }

  const documents = yield* (yield* db.workload.documentsOf.execute({ package: packageId })).collect;
  const document = documents.find((candidate) => candidate.path === path);
  if (document === undefined) {
    return yield* new DocumentNotFound({ packageId, path });
  }

  yield* Effect.annotateCurrentSpan({ document: document.node });

  const rows = yield* Stream.runCollect(
    scannedRows(
      (request) => db.workload.documentScan.page({ document: document.node }, request),
      pageSize,
    ),
  );

  return yield* documentXml(document.node, rows);
});
