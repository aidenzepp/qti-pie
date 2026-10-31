/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { createHash } from "node:crypto";
import { Config, Effect, FileSystem, Match, Option, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The version of this module's own extraction code, one of the four inputs of every fixture's hash.
 *
 * A fix-forward of the materializer that changes what any directory holds bumps it, so the
 * corrected directories appear beside the old ones under new names instead of replacing them.
 */
export const FIXTURES_VERSION = "1" as const;

/**
 * A string edit applied to one file of a freshly extracted package, as plain data.
 *
 * An edit is part of a fixture's hash, so it stays `JSON.stringify`-able. A file is read as
 * latin1, so ASCII and single-byte text round-trips byte for byte, and is written back as
 * latin1 unless an `EncodeUtf16` edit names it. Edits of one file apply in list order.
 *
 * - `ReplaceText` replaces the one occurrence of `search` in `file` with `replacement`.
 * - `InsertAfterLine` inserts `text` as a new line after the 1-based line `line` of `file`, ended
 *   with the terminator that line has (`\r\n` or `\n`).
 * - `EncodeUtf16` writes `file` as a byte order mark `FF FE` followed by its text as UTF-16 little
 *   endian.
 */
export type Edit =
  | {
      readonly _tag: "ReplaceText";
      readonly file: string;
      readonly search: string;
      readonly replacement: string;
    }
  | {
      readonly _tag: "InsertAfterLine";
      readonly file: string;
      readonly line: number;
      readonly text: string;
    }
  | { readonly _tag: "EncodeUtf16"; readonly file: string };

/**
 * A fixture's whole definition: what it is called, the tarball member it comes from and the edits
 * applied to the extracted copy. Its directory is named by a hash of exactly these three values and
 * the module version.
 */
export interface FixtureSpec {
  readonly name: string;
  readonly member: string;
  readonly edits: readonly Edit[];
}

/**
 * The failure of the examples tarball as a source, never of a test's own assertion.
 *
 * `missing` is a tarball that is not at the configured path, `tar` and `unzip` are a non-zero exit
 * of that command, with its standard error as the `detail`.
 */
export class ExamplesError extends Schema.TaggedError<ExamplesError>()("ExamplesError", {
  detail: Schema.String,
  step: Schema.Literals(["tar", "unzip", "missing"]),
}) {
  /**
   * The step that failed and why, in one line.
   */
  override get message(): string {
    return `${this.step}: ${this.detail}`;
  }
}

/**
 * Compute the hex sha256 that names a fixture's directory.
 *
 * Every input is an argument, so the hash cannot depend on anything but the spec and the version a
 * caller names. The module itself always passes {@link FIXTURES_VERSION}.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @param version - The extraction code's version.
 * @returns The 64 lower-case hex digits of the sha256 of `JSON.stringify([name, member, edits,
 *   version])`.
 */
export const transformHash = (spec: FixtureSpec, version: string): string =>
  createHash("sha256")
    .update(JSON.stringify([spec.name, spec.member, spec.edits, version]))
    .digest("hex");

/**
 * Shorten {@link transformHash} to the 12 digits that go into a directory name.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @returns The first 12 hex digits of the hash under {@link FIXTURES_VERSION}.
 */
export const hash12 = (spec: FixtureSpec): string =>
  transformHash(spec, FIXTURES_VERSION).slice(0, 12);

/**
 * The names `materialize` accepts: `simple` and, as later slices add them, its variants.
 */
export const fixtureNames = ["simple"] as const;

/**
 * One of {@link fixtureNames}.
 */
export type FixtureName = (typeof fixtureNames)[number];

/**
 * The spec table: one row per {@link FixtureName}, so adding a name without its row does not
 * compile.
 */
const specs: Record<FixtureName, FixtureSpec> = {
  simple: { edits: [], member: "qtiv3-examples/packaging/simple/simple.zip", name: "simple" },
};

/**
 * Look up the spec a fixture name stands for.
 *
 * @param name - A fixture name.
 * @returns Its spec, the same value every call.
 */
export const specOf = (name: FixtureName): FixtureSpec => specs[name];

/**
 * The four packages the importer refuses (a manifest outside the supported QTI 3 subset), which
 * the importer's tests still read.
 */
export type RefusedPackage = "metaData" | "lti" | "CAT_Test01_Adaptive_EchoAdapt" | "sample_pci";

/**
 * The tarball member of each {@link RefusedPackage}.
 */
const refusedMembers: Record<RefusedPackage, string> = {
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
};

/**
 * The one zip of the tarball the corpus leaves out: a QTI 2.2 items archive, not a QTI 3 package.
 */
const corpusExcludedMember = "qtiv2p2-examples/items/items.zip";

/**
 * The root every fixture directory lives under, relative to the test runner's working directory
 * (`packages/qti`) unless the environment gives an absolute path.
 */
const fixturesRoot = Config.NonEmptyString("GR8DES_QTI_FIXTURES").pipe(
  Config.withDefault("work/fixtures"),
);

/**
 * The examples tarball, read from `GR8DES_QTI_EXAMPLES`, or else from the shared cache under
 * `HOME`.
 */
const examplesTarball = Effect.gen(function* examplesTarball() {
  const configured = yield* Config.option(Config.NonEmptyString("GR8DES_QTI_EXAMPLES"));

  if (Option.isSome(configured)) {
    return configured.value;
  }

  const home = yield* Config.NonEmptyString("HOME");

  return `${home}/.cache/gr8des/qti3-examples/qti-examples-0a92fbb.tar.gz`;
});

/**
 * Collect a byte stream into text.
 *
 * @param bytes - A process's output stream.
 * @returns The whole stream decoded as UTF-8.
 */
const collect = (bytes: Stream.Stream<Uint8Array, PlatformError.PlatformError>) =>
  Stream.mkString(Stream.decodeText(bytes));

/**
 * Run `tar` or `unzip` to completion and return what it wrote to standard output.
 *
 * @param step - The command to run, which names the failure when it exits non-zero.
 * @param args - The command's arguments.
 * @returns The standard output, or an {@link ExamplesError} carrying the exit code and standard
 *   error.
 */
const run = Effect.fn("fixtures.run")(function* run(
  step: "tar" | "unzip",
  args: readonly string[],
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const result = yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner.spawn(ChildProcess.make(step, args, { stdin: "ignore" }));

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: collect(handle.stderr),
          stdout: collect(handle.stdout),
        },
        { concurrency: "unbounded" },
      );
    }),
  );

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new ExamplesError({
      detail: `\`${step} ${args.join(" ")}\` exited ${result.code}: ${result.stderr.trim()}`,
      step,
    });
  }

  return result.stdout;
});

/**
 * List the tarball: its one top directory and every member under it.
 *
 * @param tarball - The path of the examples tarball.
 * @returns `top`, the tarball's single top-level directory, and `members`, every entry under it
 *   as a path relative to `top` (directories end in `/`), or an {@link ExamplesError}.
 */
const listTarball = Effect.fn("fixtures.listTarball")(function* listTarball(tarball: string) {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(tarball))) {
    return yield* new ExamplesError({
      detail: `the examples tarball is not at ${tarball}; fetch qti-examples-0a92fbb.tar.gz into ~/.cache/gr8des/qti3-examples/ or point GR8DES_QTI_EXAMPLES at it`,
      step: "missing",
    });
  }

  const entries = (yield* run("tar", ["-tzf", tarball])).split("\n").filter((line) => line !== "");
  const top = (entries[0] ?? "").replace(/\/$/u, "");
  const members = entries
    .filter((entry) => entry.startsWith(`${top}/`))
    .map((entry) => entry.slice(top.length + 1))
    .filter((member) => member !== "");

  return { members, top };
});

/**
 * Delete every Finder metadata file the extraction left in a package directory.
 *
 * @param pkg - The extracted package directory.
 * @returns Completes once no `.DS_Store` remains anywhere under `pkg`.
 */
const removeFinderMetadata = Effect.fn("fixtures.removeFinderMetadata")(
  function* removeFinderMetadata(pkg: string) {
    const fs = yield* FileSystem.FileSystem;
    const entries = yield* fs.readDirectory(pkg, { recursive: true });

    yield* Effect.forEach(
      entries.filter((entry) => entry === ".DS_Store" || entry.endsWith("/.DS_Store")),
      (entry) => fs.remove(`${pkg}/${entry}`),
      { discard: true },
    );
  },
);

/**
 * Replace the one occurrence of a string in text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming `search` and `replacement`.
 * @returns `text` with `search` replaced; throws when `search` does not occur exactly once.
 */
const replaceOnce = (text: string, edit: Extract<Edit, { _tag: "ReplaceText" }>): string => {
  const first = text.indexOf(edit.search);
  const occurrences = text.split(edit.search).length - 1;

  if (first === -1 || occurrences !== 1) {
    throw new Error(
      `edit of ${edit.file}: ${JSON.stringify(edit.search)} occurs ${occurrences} times, and must occur exactly once; give the search enough surrounding text to be unique`,
    );
  }

  return text.slice(0, first) + edit.replacement + text.slice(first + edit.search.length);
};

/**
 * Insert a line after a numbered line of text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming the 1-based `line` and the `text` to insert.
 * @returns `text` with the new line after line `line`; throws when `text` has no such line.
 */
const insertAfterLine = (
  text: string,
  edit: Extract<Edit, { _tag: "InsertAfterLine" }>,
): string => {
  let end = -1;

  for (let seen = 0; seen < edit.line; seen += 1) {
    end = text.indexOf("\n", end + 1);

    if (end === -1) {
      throw new Error(
        `edit of ${edit.file}: there is no line ${edit.line} to insert after, and the text ends a line with a line feed only after its first ${seen}`,
      );
    }
  }

  const terminator = text[end - 1] === "\r" ? "\r\n" : "\n";

  return text.slice(0, end + 1) + edit.text + terminator + text.slice(end + 1);
};

/**
 * Apply one edit to a file's text.
 *
 * @param text - The file's text.
 * @param edit - The edit to apply.
 * @returns The edited text; an `EncodeUtf16` edit leaves the text as it is, because it only changes
 *   how the bytes are written.
 */
const applyEdit = (text: string, edit: Edit): string =>
  Match.value(edit).pipe(
    Match.tag("ReplaceText", (replace) => replaceOnce(text, replace)),
    Match.tag("InsertAfterLine", (insert) => insertAfterLine(text, insert)),
    Match.tag("EncodeUtf16", () => text),
    Match.exhaustive,
  );

/**
 * Apply the edits that name one file to that file's bytes.
 *
 * The text is read as latin1 and written as latin1, so the bytes an edit does not touch survive
 * exactly. This is pure so a test can read each edit's effect without a tarball.
 *
 * @param original - The file's bytes as extracted.
 * @param edits - The edits that name this file, in order.
 * @returns The edited bytes. Throws, a defect, when an edit does not apply (a search that does not
 *   occur exactly once, a line that does not exist) or the text holds a character latin1 cannot
 *   write.
 */
export const editBytes = (original: Uint8Array, edits: readonly Edit[]): Uint8Array => {
  let text = Buffer.from(original).toString("latin1");

  for (const edit of edits) {
    text = applyEdit(text, edit);
  }

  if (edits.some((edit) => edit._tag === "EncodeUtf16")) {
    return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
  }

  if (/[\u{100}-\u{10FFFF}]/u.test(text)) {
    throw new Error(
      "an edit put a character above U+00FF into a file written as latin1; write it as a character reference, or add an EncodeUtf16 edit",
    );
  }

  return Buffer.from(text, "latin1");
};

/**
 * Apply a spec's edits to the files they name, inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param edits - The spec's edit list.
 * @returns Completes once every named file has been rewritten once.
 */
const applyEdits = Effect.fn("fixtures.applyEdits")(function* applyEdits(
  pkg: string,
  edits: readonly Edit[],
) {
  const fs = yield* FileSystem.FileSystem;

  yield* Effect.forEach(
    new Set(edits.map((edit) => edit.file)),
    (file) =>
      Effect.gen(function* rewrite() {
        const original = yield* fs.readFile(`${pkg}/${file}`);

        yield* fs.writeFile(
          `${pkg}/${file}`,
          editBytes(
            original,
            edits.filter((edit) => edit.file === file),
          ),
        );
      }),
    { discard: true },
  );
});

/**
 * Extract and derive a spec's package into `<tmp>/pkg`.
 *
 * The recipe is `tar` of the one zip member, `unzip` of it, deletion of `.DS_Store`, then the
 * spec's edits, all inside the temporary directory so nothing is visible under the root yet.
 *
 * @param spec - The fixture's spec.
 * @param tarball - The examples tarball.
 * @param tmp - The fresh temporary directory to work in.
 * @returns Completes once `<tmp>/pkg` holds the finished package.
 */
const build = Effect.fn("fixtures.build")(function* build(
  spec: FixtureSpec,
  tarball: string,
  tmp: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const { top } = yield* listTarball(tarball);

  yield* fs.makeDirectory(`${tmp}/src`);
  yield* run("tar", [
    "-xzf",
    tarball,
    "-C",
    `${tmp}/src`,
    "--strip-components",
    "1",
    `${top}/${spec.member}`,
  ]);
  yield* run("unzip", ["-q", "-o", `${tmp}/src/${spec.member}`, "-d", `${tmp}/pkg`]);
  yield* removeFinderMetadata(`${tmp}/pkg`);
  yield* applyEdits(`${tmp}/pkg`, spec.edits);
});

/**
 * Return a spec's materialized directory, making it first when it is absent.
 *
 * A materialized directory is immutable and appears only by one `rename`:
 *
 * - A present target is returned and nothing is written.
 * - An absent target is built in a fresh `<root>/.tmp-<random>/`, then `rename`d into place. The
 *   loser of two concurrent builds sees its `rename` fail, because the target appeared in the
 *   meantime. `ENOTEMPTY`, what macOS answers for a rename onto a non-empty directory, reaches
 *   Effect as reason `Unknown` rather than `AlreadyExists`, so the failure is not told apart by its
 *   reason: whenever the target exists after a failed `rename` the build lost the race, and returns
 *   the target.
 * - The temporary directory is removed when the build ends, whichever way it ends.
 *
 * Nothing under the root is written outside a `.tmp-*` directory, and there is no marker, lock or
 * sweeper: the name holds the hash of the transform, so a changed transform is a new directory.
 *
 * @param spec - The fixture's spec.
 * @returns The directory `<root>/<name>-<hash12>`.
 */
const materializeSpec = Effect.fn("fixtures.materializeSpec")(function* materializeSpec(
  spec: FixtureSpec,
) {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* Effect.orDie(fixturesRoot);
  const target = `${root}/${spec.name}-${hash12(spec)}`;

  if (yield* fs.exists(target)) {
    return target;
  }

  const tarball = yield* Effect.orDie(examplesTarball);

  yield* fs.makeDirectory(root, { recursive: true });
  yield* Effect.gen(function* buildAndRename() {
    const tmp = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: ".tmp-" });

    yield* build(spec, tarball, tmp);
    yield* fs
      .rename(`${tmp}/pkg`, target)
      .pipe(
        Effect.catch((error) =>
          fs
            .exists(target)
            .pipe(Effect.flatMap((present) => (present ? Effect.void : Effect.fail(error)))),
        ),
      );
  }).pipe(Effect.scoped);

  return target;
});

/**
 * Materialize a named fixture and return its directory.
 *
 * @param name - One of {@link fixtureNames}.
 * @returns `<root>/<name>-<hash12(specOf(name))>`, extracted on first use and never rewritten.
 */
export const materialize = (
  name: FixtureName,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec(specOf(name));

/**
 * Materialize one of the packages the importer refuses.
 *
 * @param pkg - The package's name.
 * @returns `<root>/<pkg>-<hash12>`, a no-edit spec over the package's tarball member.
 */
export const materializePackage = (
  pkg: RefusedPackage,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec({ edits: [], member: refusedMembers[pkg], name: pkg });

/**
 * Materialize every package of the examples tarball.
 *
 * The corpus is each zip of the tarball but {@link corpusExcludedMember}, listed from the tarball,
 * each a no-edit spec named by the zip's file name without `.zip`.
 *
 * @returns Each package's name and directory, in tarball order.
 */
export const materializeCorpus = Effect.fn("fixtures.materializeCorpus")(
  function* materializeCorpus() {
    const tarball = yield* Effect.orDie(examplesTarball);
    const { members } = yield* listTarball(tarball);

    return yield* Effect.forEach(
      members.filter((member) => member.endsWith(".zip") && member !== corpusExcludedMember),
      (member) => {
        const name = member.slice(member.lastIndexOf("/") + 1, -".zip".length);

        return materializeSpec({ edits: [], member, name }).pipe(
          Effect.map((dir) => ({ dir, name })),
        );
      },
      { concurrency: 4 },
    );
  },
);
