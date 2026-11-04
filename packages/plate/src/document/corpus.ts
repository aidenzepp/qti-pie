/**
 * Where the 1EdTech QTI 3 example corpus sits on this machine, and how code reads one of its files.
 *
 * The corpus is extracted once, outside the repository, by phase 1's one-time step (spec §10.2);
 * this module never extracts it and never writes. It reads through `node:fs/promises` inside
 * `Effect.tryPromise`, because the package carries no platform layer for Effect's `FileSystem`.
 */
import { readFile, stat } from "node:fs/promises";
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
  `find "$D/${corpusDirectory}" -name '*.zip' -exec sh -c 'unzip -q -n "$1" -d "$1.d"' _ {} ;`,
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
      `no corpus directory at ${this.root}.`,
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
   * The path asked for and why it cannot be read, in one line.
   */
  override get message(): string {
    return `cannot read corpus file ${this.path}: ${this.detail}`;
  }
}

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
export const readCorpusFile = Effect.fn("readCorpusFile")(function* readCorpusFile(
  relative: string,
): Effect.fn.Return<Uint8Array, CorpusMissing | CorpusFileUnreadable | Config.ConfigError> {
  yield* Effect.annotateCurrentSpan("corpus.path", relative);

  const root = yield* corpusRoot;
  const file = path.resolve(root, relative);
  const fromRoot = path.relative(root, file);

  if (fromRoot === ".." || fromRoot.startsWith(`..${path.sep}`) || path.isAbsolute(fromRoot)) {
    return yield* new CorpusFileUnreadable({
      detail: `it resolves to ${file}, outside the corpus root ${root}; name a path inside the root`,
      path: relative,
    });
  }

  const missing = new CorpusMissing({ command: extractionCommand, root });
  const rootStats = yield* Effect.tryPromise({ catch: () => missing, try: () => stat(root) });

  if (!rootStats.isDirectory()) {
    return yield* missing;
  }

  return yield* Effect.tryPromise({
    catch: (cause) =>
      new CorpusFileUnreadable({
        detail: `${cause instanceof Error ? cause.message : String(cause)}; name a file the corpus root ${root} holds`,
        path: relative,
      }),
    try: () => readFile(file),
  });
});
