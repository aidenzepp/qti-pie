/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { Effect, FileSystem, Schema } from "effect";
import type { PlatformError } from "effect";
import { packageBudget, readZip, readZipBytes, unsafeEntryPath } from "#pantry/package/zip.ts";
import type { ZipEntry, ZipRefusal } from "#pantry/package/zip.ts";

/**
 * The file name that marks a directory as a QTI package, looked for at the directory's root only.
 */
const MANIFEST = "imsmanifest.xml";

/**
 * How many entries `listPackage` inspects, and `readPackage` reads, at once; a package is read
 * from a local disk, so a small bound keeps the read quick without opening an unbounded number of
 * requests.
 */
const INSPECT_CONCURRENCY = 16;

/**
 * Where a package is read from: a directory or a `.zip` file by its path, or a zip archive's bytes
 * under the archive's name.
 *
 * Bytes are always read as a zip, whatever their name; the name stands where a path would, in a
 * refusal and in the package's stored name.
 */
export type PackageSource = string | { readonly name: string; readonly bytes: Uint8Array };

/**
 * Whether a package source is a path, a directory or a `.zip` file, rather than a zip archive's
 * bytes.
 *
 * @param source - The package source.
 * @returns True for a path, false for bytes.
 */
const isPathSource = (source: PackageSource): source is string => typeof source === "string";

/**
 * Name a package source as a refusal and a record name it.
 *
 * @param source - The package source.
 * @returns The path of a path source, the archive's name of a bytes source.
 */
export const sourceNameOf = (source: PackageSource): string =>
  isPathSource(source) ? source : source.name;

/**
 * The directory or an entry path cannot be read as part of a package, under the named rule.
 *
 * `manifest-root` is a package that has no `imsmanifest.xml` at its root. `entry-path` is a path
 * that is no entry path by the rule a zip's entry names meet too (`unsafeEntryPath`, reading 138),
 * or not a regular file inside the package directory. `dir` is the package's source as
 * {@link sourceNameOf} names it, and `path` the entry path concerned, `imsmanifest.xml` for
 * `manifest-root`.
 */
export class PackageReadError extends Schema.TaggedError<PackageReadError>()("PackageReadError", {
  dir: Schema.String,
  path: Schema.String,
  rule: Schema.Literals(["manifest-root", "entry-path"]),
}) {
  /**
   * What was refused, why, and what to change, in one or two sentences.
   */
  override get message(): string {
    return this.rule === "manifest-root"
      ? `${this.dir} has no ${MANIFEST} at its root. A package keeps its manifest in its top directory, so pass the directory that holds ${MANIFEST}.`
      : `${this.path} is not an entry of the package at ${this.dir} (an entry path is relative, begins with no drive prefix, holds no backslash and no .. segment, resolves inside the package directory and names a regular file). Rename the file, or fix the href that names it.`;
  }
}

/**
 * One regular file of a package: its path relative to the package directory and its role.
 *
 * `kind` is `manifest` for the `imsmanifest.xml` at the package root and `file` for every other
 * file, an `imsmanifest.xml` in a subdirectory included.
 */
export interface Entry {
  readonly path: string;
  readonly kind: "manifest" | "file";
}

/**
 * One entry of a package with its bytes, untouched, as {@link readPackage} reads it.
 */
export interface PackageFile extends Entry {
  readonly bytes: Uint8Array;
}

/**
 * Name an entry's role from its path.
 *
 * @param path - The entry's path relative to the package root.
 * @returns `manifest` for the root `imsmanifest.xml`, `file` for any other path.
 */
const kindOf = (path: string): Entry["kind"] => (path === MANIFEST ? "manifest" : "file");

/**
 * Whether a path is a package zip: a regular file whose name ends `.zip`.
 *
 * @param path - The package path, a directory or a zip file.
 * @returns True for a `.zip` file, false for a directory or any other name.
 */
const isZipFile = Effect.fn("package.isZipFile")(function* isZipFile(
  path: string,
): Effect.fn.Return<boolean, PlatformError.PlatformError, FileSystem.FileSystem> {
  if (!path.endsWith(".zip")) {
    return false;
  }

  const fs = yield* FileSystem.FileSystem;
  const info = yield* fs.stat(path);

  return info.type === "File";
});

/**
 * Read a package zip's entries, from its file or from its bytes, under {@link packageBudget}.
 *
 * @param source - The `.zip` file, or the archive's bytes.
 * @returns Its files with their bytes, sorted by path, or a {@link ZipRefusal}. A missing file is a
 *   `PlatformError`.
 */
const readZipSource = (
  source: PackageSource,
): Effect.Effect<
  readonly ZipEntry[],
  ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> =>
  isPathSource(source)
    ? readZip(source, packageBudget)
    : readZipBytes(source.name, source.bytes, packageBudget);

/**
 * Read a package zip whole, with `readZip`'s `manifest-root` refusal as a {@link PackageReadError}.
 *
 * @param source - The `.zip` file, or the archive's bytes.
 * @returns Its files with their bytes, sorted by path, or a {@link PackageReadError} with rule
 *   `manifest-root`. Any other {@link ZipRefusal} flows out as itself.
 */
const readZipPackage = Effect.fn("package.readZipPackage")(function* readZipPackage(
  source: PackageSource,
): Effect.fn.Return<
  readonly ZipEntry[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  return yield* readZipSource(source).pipe(
    Effect.catchIf(
      (refusal) => refusal._tag === "ZipRefusal" && refusal.rule === "manifest-root",
      () =>
        new PackageReadError({ dir: sourceNameOf(source), path: MANIFEST, rule: "manifest-root" }),
    ),
  );
});

/**
 * List the regular files under a package directory, sorted by UTF-16 code unit.
 *
 * Node's recursive `readdir` descends through a symbolic link to a directory, so a path listed here
 * can lead outside the package; {@link readDirectoryEntry} refuses such a path when it is read.
 *
 * @param dir - The package directory.
 * @returns The paths relative to `dir`, `/`-separated, or a {@link PackageReadError} with rule
 *   `manifest-root` when `dir` has no `imsmanifest.xml` at its root.
 */
const listDirectory = Effect.fn("package.listDirectory")(function* listDirectory(
  dir: string,
): Effect.fn.Return<
  readonly string[],
  PackageReadError | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const fs = yield* FileSystem.FileSystem;
  const names = yield* fs.readDirectory(dir, { recursive: true });
  const files = yield* Effect.filter(
    names,
    (name) => Effect.map(fs.lstat(`${dir}/${name}`), (info) => info.type === "File"),
    { concurrency: INSPECT_CONCURRENCY },
  );

  if (!files.includes(MANIFEST)) {
    return yield* new PackageReadError({ dir, path: MANIFEST, rule: "manifest-root" });
  }

  return files.toSorted();
});

/**
 * Read one file of a package directory, refusing a path that is not an entry of it.
 *
 * @param dir - The package directory.
 * @param path - The file's path relative to `dir`.
 * @returns The file's bytes, or a {@link PackageReadError} with rule `entry-path` when `path` is no
 *   entry path ({@link unsafeEntryPath}, the rule a zip's names meet too), does not name a regular
 *   file, or resolves, links in its directories included, outside `dir`. A missing file is a
 *   `PlatformError`.
 */
const readDirectoryEntry = Effect.fn("package.readDirectoryEntry")(function* readDirectoryEntry(
  dir: string,
  path: string,
): Effect.fn.Return<
  Uint8Array,
  PackageReadError | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const fs = yield* FileSystem.FileSystem;
  const refused = new PackageReadError({ dir, path, rule: "entry-path" });
  const target = `${dir}/${path}`;

  if (unsafeEntryPath(path) !== undefined) {
    return yield* refused;
  }

  const info = yield* fs.lstat(target);

  if (info.type !== "File") {
    return yield* refused;
  }

  const realDir = yield* fs.realPath(dir);
  const realTarget = yield* fs.realPath(target);

  if (!realTarget.startsWith(`${realDir}/`)) {
    return yield* refused;
  }

  return yield* fs.readFile(target);
});

/**
 * List every regular file under a package directory, or every file of a package zip.
 *
 * Directories, symbolic links and other special files are not entries. The listing is the whole
 * tree and is sorted by UTF-16 code unit, so it is the same on every host and every run. A path
 * that is a regular file ending `.zip`, and a bytes source, are read as a zip archive, and list
 * the same way: its files, no directory entries.
 *
 * @param source - The package directory, a `.zip` file, or a zip archive's bytes.
 * @returns Its files as {@link Entry} values, `path` relative to the package root and
 *   `/`-separated as `readDirectory` reports it on POSIX, or a {@link PackageReadError} with rule
 *   `manifest-root` when the package has no `imsmanifest.xml` at its root (for a zip, `readZip`'s
 *   `manifest-root` refusal). Any other {@link ZipRefusal} flows out as itself.
 */
export const listPackage = Effect.fn("package.listPackage")(function* listPackage(
  source: PackageSource,
): Effect.fn.Return<
  readonly Entry[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const paths =
    !isPathSource(source) || (yield* isZipFile(source))
      ? (yield* readZipPackage(source)).map((entry) => entry.path)
      : yield* listDirectory(source);

  return paths.map((path): Entry => ({ kind: kindOf(path), path }));
});

/**
 * Read one file of a package directory or of a package zip.
 *
 * The path is untrusted: it comes from a manifest `href`. It must be an entry path (relative, with
 * no drive prefix, backslash or `..` segment), name a regular file (not a link or a directory) and
 * resolve, links in its directories included, to a place inside the package directory.
 *
 * @param source - The package directory, or a `.zip` file or zip archive's bytes, which is read
 *   whole on each call.
 * @param path - A file's path relative to the package root, as {@link listPackage} returns it.
 * @returns The file's bytes, untouched, or a {@link PackageReadError} with rule `entry-path` when
 *   `path` is not an entry of the package. A missing file is a `PlatformError`; a zip's refusals
 *   flow out as {@link ZipRefusal}.
 */
export const readEntry = Effect.fn("package.readEntry")(function* readEntry(
  source: PackageSource,
  path: string,
): Effect.fn.Return<
  Uint8Array,
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  if (!isPathSource(source) || (yield* isZipFile(source))) {
    const found = (yield* readZipSource(source)).find((entry) => entry.path === path);

    return found === undefined
      ? yield* new PackageReadError({ dir: sourceNameOf(source), path, rule: "entry-path" })
      : found.bytes;
  }

  return yield* readDirectoryEntry(source, path);
});

/**
 * Read a package directory or a package zip once: every entry with its bytes.
 *
 * The entries are {@link listPackage}'s, in its order, and each one's bytes are what
 * {@link readEntry} gives for it, so a directory, a zip file and the same zip's bytes read the
 * same. A zip is parsed once, with its budgets checked before any entry is inflated.
 *
 * @param source - The package directory, a `.zip` file, or a zip archive's bytes.
 * @returns Its entries as {@link PackageFile} values, sorted by path, or a {@link PackageReadError}:
 *   `manifest-root` when the package has no `imsmanifest.xml` at its root, `entry-path` when a
 *   listed path leads outside the package directory through a link. Any other {@link ZipRefusal}
 *   flows out as itself.
 */
export const readPackage = Effect.fn("package.readPackage")(function* readPackage(
  source: PackageSource,
): Effect.fn.Return<
  readonly PackageFile[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  if (!isPathSource(source) || (yield* isZipFile(source))) {
    return (yield* readZipPackage(source)).map(({ bytes, path }): PackageFile => ({
      bytes,
      kind: kindOf(path),
      path,
    }));
  }

  return yield* Effect.forEach(
    yield* listDirectory(source),
    (path) =>
      Effect.map(readDirectoryEntry(source, path), (bytes): PackageFile => ({
        bytes,
        kind: kindOf(path),
        path,
      })),
    { concurrency: INSPECT_CONCURRENCY },
  );
});
