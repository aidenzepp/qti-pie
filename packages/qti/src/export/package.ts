/**
 * The export of a package: every tree the database holds for it written back as the file it was
 * imported from, and every other file of the package written from its stored bytes.
 */
import { Db, query, uuid, v } from "@bjornpagen/grizzle";
import type { DbLayer, OpenError, ReadError } from "@bjornpagen/grizzle";
import { Effect, FileSystem, Option, Path } from "effect";
import type { PlatformError } from "effect";
import { readTree, treesOf } from "#qti/export/read.ts";
import { renderTree } from "#qti/export/render.ts";
import { Rows } from "#qti/import/tree.ts";
import { writeZip } from "#qti/package/zip.ts";
import type { ZipEntry } from "#qti/package/zip.ts";
import { Document } from "#qti/schema/document.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { TreeExportCharset } from "#qti/schema/node.ts";
import { FileContent } from "#qti/schema/package.ts";
import { Author } from "#qti/schema/roles.ts";
import { encode } from "#qti/xml/encode.ts";
import type { EncodeError } from "#qti/xml/errors.ts";
import type { XmlDocument } from "#qti/xml/tree.ts";

/**
 * The entry a package's manifest tree is written under.
 */
const MANIFEST_PATH = "imsmanifest.xml";

/**
 * The entry path of the document whose tree is `id`.
 */
const documentPathOf = query(Author).rule((r) => {
  const { path } = v(Document);

  return r.match(Document, { id: r.param("id", uuid), path }).find({ path });
});

/**
 * The path and base64 content of every stored file of a package.
 */
const contentsOf = query(Author).rule((r) => {
  const { content, path } = v(FileContent);

  return r.match(FileContent, { content, package: r.param("package", uuid), path }).find({
    content,
    path,
  });
});

/**
 * What can stop an export: the database, a document that cannot be written in its charset, or the
 * file system.
 */
type ExportError = OpenError | ReadError | EncodeError | PlatformError.PlatformError;

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
 * Write the package `packageId` to `target`: a directory of the files it was imported from, or,
 * when `target` ends `.zip`, one zip file holding the same entries.
 *
 * Every tree is read back, rendered and encoded in its export label: the `TreeExportCharset` row's
 * when the tree has one, with the declaration then naming that label, otherwise the charset it was
 * read in. A document that cannot be written in its label fails the export; nothing falls back to
 * another charset. Documents go under their `Document.path`, the manifest under `imsmanifest.xml`,
 * and every stored file's decoded bytes under its path. A zip target holds those entries at those
 * paths, written by `writeZip`, and its directory is created when absent.
 *
 * @param packageId - The id of the imported package.
 * @param target - The directory to write under, or the `.zip` file to write, created when absent.
 * @returns Nothing. Fails with the database's, the encoder's or the file system's error.
 */
export const exportPackage = Effect.fn("export.exportPackage")(function* exportPackage(
  packageId: string,
  target: string,
): Effect.fn.Return<void, ExportError, DbLayer<typeof Author> | FileSystem.FileSystem | Path.Path> {
  yield* Effect.annotateCurrentSpan({ packageId, target });

  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const db = yield* Db.open(AuthorApp.roles.author, {});

  const zipping = target.endsWith(".zip");
  const entries: ZipEntry[] = [];

  const write = Effect.fn("export.write")(function* write(entry: string, bytes: Uint8Array) {
    if (zipping) {
      entries.push({ bytes, path: entry });

      return;
    }

    const file = path.join(target, entry);

    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    yield* fs.writeFile(file, bytes);
  });

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

    yield* write(found.path, bytes);
  }

  for (const file of yield* (yield* db.execute(contentsOf, { package: packageId })).collect) {
    yield* write(file.path, Buffer.from(file.content, "base64"));
  }

  if (zipping) {
    yield* fs.makeDirectory(path.dirname(target), { recursive: true });
    yield* fs.writeFile(target, writeZip(entries));
  }
});
