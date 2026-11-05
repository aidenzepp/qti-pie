/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { Effect, FileSystem, Schema } from "effect";
import type { PlatformError } from "effect";
import { packageBudget, readZip } from "#pantry/package/zip.ts";
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
 * The directory or an entry path cannot be read as part of a package, under the named rule.
 *
 * `manifest-root` is a directory that has no `imsmanifest.xml` at its root. `entry-path` is an
 * entry path that is not a regular file inside the package directory. `dir` is the package
 * directory and `path` the entry path concerned, `imsmanifest.xml` for `manifest-root`.
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
      : `${this.path} is not an entry of the package at ${this.dir} (an entry path is relative, has no .. segment, resolves inside the package directory and names a regular file). Fix the href in the manifest.`;
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
 * Read a package zip whole, with `readZip`'s `manifest-root` refusal as a {@link PackageReadError}.
 *
 * @param dir - The `.zip` file.
 * @returns Its files with their bytes, sorted by path, or a {@link PackageReadError} with rule
 *   `manifest-root`. Any other {@link ZipRefusal} flows out as itself.
 */
const readZipPackage = Effect.fn("package.readZipPackage")(function* readZipPackage(
  dir: string,
): Effect.fn.Return<
  readonly ZipEntry[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  return yield* readZip(dir, packageBudget).pipe(
    Effect.catchIf(
      (refusal) => refusal._tag === "ZipRefusal" && refusal.rule === "manifest-root",
      () => new PackageReadError({ dir, path: MANIFEST, rule: "manifest-root" }),
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
 * @returns The file's bytes, or a {@link PackageReadError} with rule `entry-path` when `path` is
 *   absolute, has a `..` segment, does not name a regular file, or resolves, links in its
 *   directories included, outside `dir`. A missing file is a `PlatformError`.
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

  if (path.startsWith("/") || path.split("/").includes("..")) {
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
 * that is a regular file ending `.zip` is read as a zip archive, and lists the same way: its
 * files, no directory entries.
 *
 * @param dir - The package directory, or a `.zip` file.
 * @returns Its files as {@link Entry} values, `path` relative to `dir` and `/`-separated as
 *   `readDirectory` reports it on POSIX, or a {@link PackageReadError} with rule `manifest-root`
 *   when `dir` has no `imsmanifest.xml` at its root (for a zip, `readZip`'s `manifest-root`
 *   refusal). Any other {@link ZipRefusal} flows out as itself.
 */
export const listPackage = Effect.fn("package.listPackage")(function* listPackage(
  dir: string,
): Effect.fn.Return<
  readonly Entry[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const paths = (yield* isZipFile(dir))
    ? (yield* readZipPackage(dir)).map((entry) => entry.path)
    : yield* listDirectory(dir);

  return paths.map((path): Entry => ({ kind: kindOf(path), path }));
});

/**
 * Read one file of a package directory or of a package zip.
 *
 * The path is untrusted: it comes from a manifest `href`. It must be relative, have no `..`
 * segment, name a regular file (not a link or a directory) and resolve, links in its directories
 * included, to a place inside the package directory.
 *
 * @param dir - The package directory, or a `.zip` file, which is read whole on each call.
 * @param path - A file's path relative to `dir`, as {@link listPackage} returns it.
 * @returns The file's bytes, untouched, or a {@link PackageReadError} with rule `entry-path` when
 *   `path` is not an entry of the package. A missing file is a `PlatformError`; a zip's refusals
 *   flow out as {@link ZipRefusal}.
 */
export const readEntry = Effect.fn("package.readEntry")(function* readEntry(
  dir: string,
  path: string,
): Effect.fn.Return<
  Uint8Array,
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  if (yield* isZipFile(dir)) {
    const found = (yield* readZip(dir, packageBudget)).find((entry) => entry.path === path);

    return found === undefined
      ? yield* new PackageReadError({ dir, path, rule: "entry-path" })
      : found.bytes;
  }

  return yield* readDirectoryEntry(dir, path);
});

/**
 * Read a package directory or a package zip once: every entry with its bytes.
 *
 * The entries are {@link listPackage}'s, in its order, and each one's bytes are what
 * {@link readEntry} gives for it, so a directory and a zip of the same files read the same. A zip
 * is parsed once, with its budgets checked before any entry is inflated.
 *
 * @param dir - The package directory, or a `.zip` file.
 * @returns Its entries as {@link PackageFile} values, sorted by path, or a {@link PackageReadError}:
 *   `manifest-root` when `dir` has no `imsmanifest.xml` at its root, `entry-path` when a listed
 *   path leads outside the package directory through a link. Any other {@link ZipRefusal} flows
 *   out as itself.
 */
export const readPackage = Effect.fn("package.readPackage")(function* readPackage(
  dir: string,
): Effect.fn.Return<
  readonly PackageFile[],
  PackageReadError | ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  if (yield* isZipFile(dir)) {
    return (yield* readZipPackage(dir)).map(({ bytes, path }): PackageFile => ({
      bytes,
      kind: kindOf(path),
      path,
    }));
  }

  return yield* Effect.forEach(
    yield* listDirectory(dir),
    (path) =>
      Effect.map(readDirectoryEntry(dir, path), (bytes): PackageFile => ({
        bytes,
        kind: kindOf(path),
        path,
      })),
    { concurrency: INSPECT_CONCURRENCY },
  );
});
