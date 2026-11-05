/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { NodeChildProcessSpawner } from "@effect/platform-node";
import { Config, Effect, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The oracle refused a file: `xmllint` ran and exited non-zero.
 *
 * `exitCode` is its exit status and `stderr` is everything it wrote to standard error, which names
 * the file and what is wrong with it (a path that does not exist, text that is not well-formed).
 */
export class OracleError extends Schema.TaggedError<OracleError>()("OracleError", {
  exitCode: Schema.Int,
  stderr: Schema.String,
}) {
  /**
   * The exit status and what `xmllint` said, in one line.
   */
  override get message(): string {
    return `xmllint exited ${this.exitCode}: ${this.stderr.trim()}`;
  }
}

/**
 * The oracle did not start: no `xmllint` runs as `executable`, the path `XMLLINT` names or, when it
 * names none, `xmllint` on `PATH`.
 *
 * `reason` is what the platform said when the process could not be started.
 */
export class OracleUnavailable extends Schema.TaggedError<OracleUnavailable>()(
  "OracleUnavailable",
  { executable: Schema.String, reason: Schema.String },
) {
  /**
   * Which executable did not start, why, and how to supply one.
   */
  override get message(): string {
    return `xmllint did not start as ${this.executable} (${this.reason}); put libxml2's xmllint on PATH, or set XMLLINT to its path`;
  }
}

/**
 * The layer that provides the `ChildProcessSpawner` {@link xmllintC14n} needs, for tests.
 *
 * It requires `FileSystem` and `Path`, which `@effect/platform-node` supplies as `NodeFileSystem`
 * and `NodePath`.
 */
export const OracleLayer = NodeChildProcessSpawner.layer;

/**
 * The `xmllint` executable: `XMLLINT` when set, else `xmllint` on `PATH`.
 *
 * Any libxml2 build is the oracle, so no machine's install path is the default. Measured over all
 * 1,023 corpus and fixture files, libxml2 2.9.13 (macOS's `/usr/bin/xmllint`) and 2.13.9 write the
 * same `--c14n` bytes wherever both succeed. They differ only in the exit code of a failing run (1
 * under 2.9.13, 4 under 2.13.9) and on one fixture, `external`, whose DOCTYPE names a DTD that
 * cannot be resolved: 2.9.13 refuses it. The comparison never sends that fixture to `xmllint`,
 * because it holds an entity reference.
 */
const xmllintPath = Config.String("XMLLINT").pipe(Config.withDefault("xmllint"));

/**
 * Canonicalize a file with `xmllint --c14n --nonet` and return what it wrote to standard output.
 *
 * `xmllint` is the oracle the canonicalizer is compared against, so its bytes are returned
 * untouched and the file is never fetched around: `--nonet` forbids network access, and standard
 * input is closed. An executable that does not start is an {@link OracleUnavailable}, which names
 * it. A process whose output cannot be read, or a `XMLLINT` setting that cannot be read, is a
 * defect rather than an {@link OracleError}, because it says nothing about the file.
 *
 * @param path - The XML file to canonicalize.
 * @returns The canonical form's bytes, an {@link OracleError} when `xmllint` exits non-zero, or an
 *   {@link OracleUnavailable} when it does not start.
 */
export const xmllintC14n = Effect.fn("oracle.xmllintC14n")(function* xmllintC14n(
  path: string,
): Effect.fn.Return<
  Uint8Array,
  OracleError | OracleUnavailable,
  ChildProcessSpawner.ChildProcessSpawner
> {
  const xmllint = yield* Effect.orDie(xmllintPath);
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const result = yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner
        .spawn(ChildProcess.make(xmllint, ["--c14n", "--nonet", path], { stdin: "ignore" }))
        .pipe(
          Effect.mapError(
            (error) => new OracleUnavailable({ executable: xmllint, reason: error.message }),
          ),
        );

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkUint8Array(handle.stdout),
        },
        { concurrency: "unbounded" },
      ).pipe(Effect.orDie);
    }),
  );

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new OracleError({ exitCode: result.code, stderr: result.stderr });
  }

  return result.stdout;
});
