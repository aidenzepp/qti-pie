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
 * The layer that provides the `ChildProcessSpawner` {@link xmllintC14n} needs, for tests.
 *
 * It requires `FileSystem` and `Path`, which `@effect/platform-node` supplies as `NodeFileSystem`
 * and `NodePath`.
 */
export const OracleLayer = NodeChildProcessSpawner.layer;

/**
 * The `xmllint` executable: `XMLLINT` when set, else the MacPorts libxml2 2.13.9 build.
 *
 * The default is the build whose canonical forms the spec records; `/usr/bin/xmllint` is libxml2
 * 2.9.13 and is not the oracle.
 */
const xmllintPath = Config.String("XMLLINT").pipe(Config.withDefault("/opt/local/bin/xmllint"));

/**
 * Canonicalize a file with `xmllint --c14n --nonet` and return what it wrote to standard output.
 *
 * `xmllint` is the oracle the canonicalizer is compared against, so its bytes are returned
 * untouched and the file is never fetched around: `--nonet` forbids network access, and standard
 * input is closed. A process that cannot be started or read, or a `XMLLINT` setting that cannot
 * be read, is a defect rather than an {@link OracleError}, because it says nothing about the file.
 *
 * @param path - The XML file to canonicalize.
 * @returns The canonical form's bytes, or an {@link OracleError} when `xmllint` exits non-zero.
 */
export const xmllintC14n = Effect.fn("oracle.xmllintC14n")(function* xmllintC14n(
  path: string,
): Effect.fn.Return<Uint8Array, OracleError, ChildProcessSpawner.ChildProcessSpawner> {
  const xmllint = yield* Effect.orDie(xmllintPath);
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const result = yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(xmllint, ["--c14n", "--nonet", path], { stdin: "ignore" }),
      );

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkUint8Array(handle.stdout),
        },
        { concurrency: "unbounded" },
      );
    }),
  ).pipe(Effect.orDie);

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new OracleError({ exitCode: result.code, stderr: result.stderr });
  }

  return result.stdout;
});
