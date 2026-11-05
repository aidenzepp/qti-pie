/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * Format TypeScript text with `vp fmt`, as the committed generated files are formatted, for the
 * tests that check a generator's output byte for byte against its committed file.
 */
import path from "node:path";
import { Effect, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The package folder, `packages/pantry`, which `vp fmt` runs in and the paths it is given are
 * relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * `vp fmt` exited with a failure while formatting generated text.
 *
 * `stderr` is what it printed, which names the syntax it could not parse.
 */
export class VpFmtFailed extends Schema.TaggedError<VpFmtFailed>()("VpFmtFailed", {
  code: Schema.Number,
  filepath: Schema.String,
  stderr: Schema.String,
}) {
  /**
   * Which text failed to format, how, and where to look.
   */
  override get message(): string {
    return `vp fmt exited with code ${this.code} while formatting the generated text for ${this.filepath}: ${this.stderr}. The generator printed text the formatter cannot parse; print it to a file under work/ and run vp fmt on it to see the error in place.`;
  }
}

/**
 * Format TypeScript text with `vp fmt`, without writing anything.
 *
 * The text is read from standard input, and `filepath` only chooses the parser and the formatter
 * configuration that applies to it. `vp` is on `PATH` whenever the suite runs through pnpm.
 *
 * @param text - The unformatted module.
 * @param filepath - The path, relative to `packages/pantry`, the text stands for.
 * @returns What `vp fmt` printed, or a {@link VpFmtFailed} with its standard error when it exits
 *   with a failure.
 */
export const vpFmt = Effect.fn("test.vpFmt")(function* vpFmt(text: string, filepath: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collectFormatted() {
      const handle = yield* spawner.spawn(
        ChildProcess.make("vp", ["fmt", `--stdin-filepath=${filepath}`], {
          cwd: packageRoot,
          stdin: Stream.make(new TextEncoder().encode(text)),
        }),
      );
      const { code, stderr, stdout } = yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );

      if (code !== ChildProcessSpawner.ExitCode(0)) {
        return yield* new VpFmtFailed({ code, filepath, stderr });
      }

      return stdout;
    }),
  );
});
