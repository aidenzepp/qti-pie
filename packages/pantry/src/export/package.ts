/**
 * The export of a package: every tree the database holds for it written back as the file it was
 * imported from, and every other file of the package written from its stored bytes.
 */
import { Db, query, uuid, v } from "@bjornpagen/grizzle";
import type { DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Effect, FileSystem, Option, Path, Schema } from "effect";
import type { PlatformError } from "effect";
import { readTree, treesOf } from "#pantry/export/read.ts";
import { renderTree } from "#pantry/export/render.ts";
import { Rows } from "#pantry/import/tree.ts";
import { writeZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { Document } from "#pantry/schema/document.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { TreeExportCharset } from "#pantry/schema/node.ts";
import { FileContent, Package } from "#pantry/schema/package.ts";
import { Author } from "#pantry/schema/roles.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * The entry a package's manifest tree is written under.
 */
const MANIFEST_PATH = "imsmanifest.xml";

/**
 * The entry path of the document whose tree is `id`.
 */
const documentPathOf = query(Author).rule((r) => {
  const { path } = v(Document, "document");

  return r.match(Document, { id: r.param("id", uuid), path }).find({ path });
});

/**
 * The manifest `identifier` of the package whose id is `id`; no row when no package has that id.
 */
const packageOf = query(Author).rule((r) => {
  const { identifier } = v(Package, "package");

  return r.match(Package, { id: r.param("id", uuid), identifier }).find({ identifier });
});

/**
 * The path and base64 content of every stored file of a package.
 */
const contentsOf = query(Author).rule((r) => {
  const { content, path } = v(FileContent, "fileContent");

  return r.match(FileContent, { content, package: r.param("package", uuid), path }).find({
    content,
    path,
  });
});

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
 * What can stop an export: the database, a package id no package has, a document that cannot be
 * written in its charset, or the file system.
 */
type ExportError =
  | OpenError
  | ReadError
  | PackageNotFound
  | EncodeError
  | PlatformError.PlatformError;

/**
 * The document with its declared encoding set to `label`, when it has a declaration.
 */
const declaring = (doc: XmlDocument, label: string): XmlDocument => ({
  ...doc,
  declaration: doc.declaration.pipe(
    Option.map((declaration) => ({ ...declaration, encoding: Option.some(label) })),
  ),
});

/**
 * The entries an export of the package `packageId` writes, in the order it writes them, without
 * writing any.
 *
 * Every tree is read back, rendered and encoded in its export label: the `TreeExportCharset` row's
 * when the tree has one, with the declaration then naming that label, otherwise the charset it was
 * read in. A document that cannot be written in its label fails here; nothing falls back to
 * another charset. Documents go under their `Document.path`, the manifest under `imsmanifest.xml`,
 * and every stored file's decoded bytes under its path.
 *
 * Fails with `PackageNotFound` when no imported package has the id, before anything is read or
 * written.
 *
 * @param packageId - The id of the imported package.
 * @returns The path and bytes of every entry. Fails with the database's or the encoder's error,
 *   or `PackageNotFound`, every one an export raises before it writes.
 */
export const exportEntries = Effect.fn("export.exportEntries")(function* exportEntries(
  packageId: Uuid,
): Effect.fn.Return<
  readonly ZipEntry[],
  OpenError | ReadError | PackageNotFound | EncodeError,
  DbLayer<typeof Author>
> {
  yield* Effect.annotateCurrentSpan({ packageId });

  const db = yield* Db.open(AuthorApp.roles.author, {});
  const [imported] = yield* (yield* db.execute(packageOf, { id: packageId })).collect;

  if (imported === undefined) {
    return yield* new PackageNotFound({ packageId });
  }

  const entries: ZipEntry[] = [];

  for (const treeId of yield* treesOf(packageId)) {
    const rows = yield* readTree(packageId, treeId);
    const doc = renderTree(rows, treeId);
    const label = Rows.of(rows, TreeExportCharset).find((row) => row.tree === treeId)?.label;
    const bytes = yield* encode(
      label === undefined ? doc : declaring(doc, label),
      label ?? doc.charset,
    );
    const [row] =
      treeId === packageId
        ? [{ path: MANIFEST_PATH }]
        : yield* (yield* db.execute(documentPathOf, { id: treeId })).collect;
    const found =
      row ??
      (yield* Effect.die(`The package ${packageId} has no document row for tree ${treeId}.`));

    entries.push({ bytes, path: found.path });
  }

  for (const file of yield* (yield* db.execute(contentsOf, { package: packageId })).collect) {
    entries.push({ bytes: Buffer.from(file.content, "base64"), path: file.path });
  }

  return entries;
});

/**
 * Write the package `packageId` to `target`: a directory of the files it was imported from, or,
 * when `target` ends `.zip`, one zip file holding the same entries.
 *
 * The entries are those of {@link exportEntries}, all read, rendered and encoded before anything
 * is written, so an export that cannot be made writes nothing. A zip target holds those entries at
 * those paths, written by `writeZip`, and its directory is created when absent.
 *
 * @param packageId - The id of the imported package.
 * @param target - The directory to write under, or the `.zip` file to write, created when absent.
 * @returns Nothing. Fails with the database's, the encoder's or the file system's error.
 */
export const exportPackage = Effect.fn("export.exportPackage")(function* exportPackage(
  packageId: Uuid,
  target: string,
): Effect.fn.Return<void, ExportError, DbLayer<typeof Author> | FileSystem.FileSystem | Path.Path> {
  yield* Effect.annotateCurrentSpan({ packageId, target });

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const entries = yield* exportEntries(packageId);

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
