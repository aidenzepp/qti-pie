/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { Effect, FileSystem, Schema } from "effect";
import type { PlatformError } from "effect";

/**
 * The file name that marks a directory as a QTI package, looked for at the directory's root only.
 */
const MANIFEST = "imsmanifest.xml";

/**
 * How many entries `listPackage` inspects at once; a package is read from a local disk, so a small
 * bound keeps the listing quick without opening an unbounded number of requests.
 */
const INSPECT_CONCURRENCY = 16;

/**
 * The directory cannot be read as a package, under the named rule.
 *
 * `manifest-root` is a directory that has no `imsmanifest.xml` at its root; `dir` is that
 * directory.
 */
export class PackageReadError extends Schema.TaggedError<PackageReadError>()("PackageReadError", {
  dir: Schema.String,
  rule: Schema.Literal("manifest-root"),
}) {
  /**
   * The directory, what it lacks, and where a package keeps it, in one line.
   */
  override get message(): string {
    return `${this.dir} has no ${MANIFEST} at its root. A package keeps its manifest in its top directory, so pass the directory that holds ${MANIFEST}.`;
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
 * List every regular file under a package directory.
 *
 * Directories, symbolic links and other special files are not entries. The listing is the whole
 * tree and is sorted by UTF-16 code unit, so it is the same on every host and every run. A ZIP
 * container is not read here: the input is a directory.
 *
 * @param dir - The package directory.
 * @returns Its files as {@link Entry} values, `path` relative to `dir` and `/`-separated as
 *   `readDirectory` reports it on POSIX, or a {@link PackageReadError} with rule `manifest-root`
 *   when `dir` has no `imsmanifest.xml` at its root.
 */
export const listPackage = Effect.fn("package.listPackage")(function* listPackage(
  dir: string,
): Effect.fn.Return<
  readonly Entry[],
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
    return yield* new PackageReadError({ dir, rule: "manifest-root" });
  }

  return files
    .toSorted()
    .map((path): Entry => ({ kind: path === MANIFEST ? "manifest" : "file", path }));
});

/**
 * Read one file of a package.
 *
 * @param dir - The package directory.
 * @param path - A file's path relative to `dir`, as {@link listPackage} returns it.
 * @returns The file's bytes, untouched.
 */
export const readEntry = Effect.fn("package.readEntry")(function* readEntry(
  dir: string,
  path: string,
): Effect.fn.Return<Uint8Array, PlatformError.PlatformError, FileSystem.FileSystem> {
  const fs = yield* FileSystem.FileSystem;

  return yield* fs.readFile(`${dir}/${path}`);
});
