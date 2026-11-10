/**
 * Where the 1EdTech QTI 3 example corpus sits on this machine, and how code reads one of its files.
 *
 * The corpus is extracted once, outside the repository, by phase 1's one-time step (spec §10.2);
 * this module never extracts it and never writes. It reads through `node:fs/promises` inside
 * `Effect.tryPromise`, because the package carries no platform layer for Effect's `FileSystem`.
 *
 * @module
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Config, Effect, Schema } from "effect";

/**
 * The tarball's own top directory, the name the extraction step creates under `qti3-examples`.
 */
const corpusDirectory = "qti-examples-0a92fbbb6d2e620a1f7fad19977be4c418246bc0";

/**
 * The one-time extraction of spec §10.2, the text {@link CorpusMissing} hands the operator.
 *
 * It unpacks the cached tarball into its own directory, then each nested `X.zip` beside itself into
 * `X.zip.d/`.
 */
const extractionCommand = [
  "D=~/.cache/gr8des/qti3-examples",
  'tar -xzf "$D/qti-examples-0a92fbb.tar.gz" -C "$D"',
  `find "$D/${corpusDirectory}" -name '*.zip' -exec sh -c 'unzip -q -n "$1" -d "$1.d"' _ {} \\;`,
].join("\n");

/**
 * The corpus root: `PLATE_CORPUS_DIR` when it is set and not empty, otherwise the extraction
 * directory under `HOME`, `<HOME>/.cache/gr8des/qti3-examples/<corpusDirectory>`.
 *
 * `HOME` is read only when `PLATE_CORPUS_DIR` is absent, so a run that names the root needs no
 * home.
 */
export const corpusRoot: Config.Config<string> = Config.NonEmptyString("PLATE_CORPUS_DIR").pipe(
  Config.orElse(() =>
    Config.NonEmptyString("HOME").pipe(
      Config.map((home) => path.join(home, ".cache", "gr8des", "qti3-examples", corpusDirectory)),
    ),
  ),
);

/**
 * The failure of a corpus read whose root directory does not exist.
 *
 * `root` is the directory {@link corpusRoot} resolved, and `command` is spec §10.2's extraction,
 * which creates the default root.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class CorpusMissing extends Schema.TaggedError<CorpusMissing>()("CorpusMissing", {
  command: Schema.String,
  root: Schema.String,
}) {
  /**
   * The missing root and the two ways to supply it: run the extraction, or point
   * `PLATE_CORPUS_DIR` at a directory that holds the corpus.
   */
  override get message(): string {
    return [
      `No corpus directory at ${this.root}.`,
      "Extract the 1EdTech QTI 3 examples once (phase 1 spec §10.2), or set PLATE_CORPUS_DIR to the directory that holds them:",
      this.command,
    ].join("\n");
  }
}

/**
 * The failure of a corpus read that names no readable file inside the root.
 *
 * `path` is the relative path the caller gave, and `detail` says why it cannot be read: it leaves
 * the root, or the operating system refused the file it names.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class CorpusFileUnreadable extends Schema.TaggedError<CorpusFileUnreadable>()(
  "CorpusFileUnreadable",
  { detail: Schema.String, path: Schema.String },
) {
  /**
   * The path asked for, why it cannot be read, and the two repairs: name a file inside the corpus
   * root, or point `PLATE_CORPUS_DIR` at the directory that holds the corpus.
   */
  override get message(): string {
    return `Cannot read corpus file ${this.path}: ${this.detail}. Name a file inside the corpus root, or set PLATE_CORPUS_DIR to the directory that holds the corpus.`;
  }
}

/**
 * Confirm that the corpus root is a directory.
 *
 * @param root The directory {@link corpusRoot} resolved.
 * @returns Nothing; {@link CorpusMissing} when it does not exist or is not a directory.
 */
const requireRoot = (root: string): Effect.Effect<void, CorpusMissing> => {
  const missing = new CorpusMissing({ command: extractionCommand, root });

  return Effect.tryPromise({ catch: () => missing, try: () => stat(root) }).pipe(
    Effect.flatMap((stats) => (stats.isDirectory() ? Effect.void : Effect.fail(missing))),
  );
};

/**
 * Read the bytes of one corpus file, named by its path relative to {@link corpusRoot}.
 *
 * A path that resolves outside the root, `..` segments or an absolute path, fails as
 * {@link CorpusFileUnreadable} before anything is read, so a caller can never read beyond the
 * corpus through this function. Symbolic links inside the root are followed.
 *
 * @param relative The file's path under the corpus root, such as
 *   `QTI3_BPIG_Examples/items/BG007.xml`.
 * @returns The file's bytes; {@link CorpusMissing} when the root directory does not exist,
 *   {@link CorpusFileUnreadable} when the path leaves the root or names no readable file, and a
 *   `ConfigError` when neither `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
export const readCorpusFile = Effect.fn("plate.readCorpusFile")(function* readCorpusFile(
  relative: string,
): Effect.fn.Return<Uint8Array, CorpusMissing | CorpusFileUnreadable | Config.ConfigError> {
  yield* Effect.annotateCurrentSpan("corpus.path", relative);

  const root = yield* corpusRoot;
  const file = path.resolve(root, relative);
  const fromRoot = path.relative(root, file);

  if (fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
    return yield* new CorpusFileUnreadable({
      detail: `it resolves to ${file}, outside the corpus root ${root}`,
      path: relative,
    });
  }

  yield* requireRoot(root);

  return yield* Effect.tryPromise({
    catch: (cause) =>
      new CorpusFileUnreadable({
        detail: `${cause instanceof Error ? cause.message : String(cause)}; the corpus root is ${root}`,
        path: relative,
      }),
    try: () => readFile(file),
  });
});

/**
 * The folder under the corpus root that holds the QTI 2.2 examples, which the document set leaves
 * out.
 */
const qti2Folder = "qtiv2p2-examples";

/**
 * The corpus's document set: every regular file whose name ends in `.xml` under {@link corpusRoot},
 * at any depth, outside the root's own `qtiv2p2-examples/` folder.
 *
 * Each member is a corpus-relative POSIX path, the form {@link readCorpusFile} takes, and the set
 * is sorted in JavaScript's default string order. A nested zip's extracted copy, under `X.zip.d/`,
 * is a member like any other file. Symbolic links are not followed, so a link is never a member. It
 * is the one list the sweeps, the playground and the one command read.
 *
 * Fails with {@link CorpusMissing} when the root directory does not exist,
 * {@link CorpusFileUnreadable} when a directory under it cannot be listed, and a `ConfigError` when
 * neither `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
export const corpusDocuments: Effect.Effect<
  readonly string[],
  CorpusMissing | CorpusFileUnreadable | Config.ConfigError
> = Effect.gen(function* corpusDocuments() {
  const root = yield* corpusRoot;

  yield* requireRoot(root);

  const entries = yield* Effect.tryPromise({
    catch: (cause) =>
      new CorpusFileUnreadable({
        detail: `${cause instanceof Error ? cause.message : String(cause)}; make every directory under the corpus root ${root} readable`,
        path: ".",
      }),
    try: () => readdir(root, { recursive: true, withFileTypes: true }),
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".xml"))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((member) => !member.startsWith(`${qti2Folder}/`))
    .toSorted();
}).pipe(Effect.withSpan("plate.corpusDocuments"));
