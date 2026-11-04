import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Console, Effect, Exit, Logger } from "effect";
import { CliError, Command } from "effect/cli";
import { exitCodeOf } from "#qti/cli/run.ts";
import { verbosityGlobalFlags, withVerbosity } from "#qti/cli/verbosity.ts";
import { captureCli } from "#qti/test/cli.ts";

/**
 * A command that logs at three levels and prints one data line, wired as the root is: the two
 * settings, then the log lines on standard error.
 */
const probe = Command.make("probe", {}, () =>
  Effect.gen(function* probeHandler() {
    yield* Effect.logDebug("debug-line");

    yield* Effect.logInfo("info-line");

    yield* Effect.logWarning("warning-line");

    yield* Console.log("data-line");
  }),
).pipe(
  withVerbosity,
  Command.withGlobalFlags(verbosityGlobalFlags),
  Command.provideSync(Logger.LogToStderr, true),
);

/**
 * The probe's output with the console captured, standard error holding the log lines.
 */
const runProbe = (args: readonly string[]) => captureCli(args, { command: probe });

layer(NodeServices.layer, { excludeTestServices: true })("p14-u8a: --quiet and --verbose", (it) => {
  it.effect("--quiet keeps the data line and drops every log line", () =>
    Effect.gen(function* quiet() {
      const { exit, stderr, stdout } = yield* runProbe(["--quiet"]);

      assert.isTrue(Exit.isSuccess(exit));
      assert.include(stdout, "data-line");
      assert.notInclude(stderr, "warning-line");
      assert.notInclude(stderr, "info-line");
      assert.notInclude(stderr, "debug-line");
    }),
  );

  it.effect("-q acts as --quiet", () =>
    Effect.gen(function* short() {
      const { exit, stderr, stdout } = yield* runProbe(["-q"]);

      assert.isTrue(Exit.isSuccess(exit));
      assert.include(stdout, "data-line");
      assert.notInclude(stderr, "warning-line");
    }),
  );

  it.effect("QTI_QUIET acts as --quiet", () =>
    Effect.gen(function* env() {
      const { stderr, stdout } = yield* captureCli([], {
        command: probe,
        env: { QTI_QUIET: "true" },
      });

      assert.include(stdout, "data-line");
      assert.notInclude(stderr, "warning-line");
    }),
  );

  it.effect("--verbose prints the debug line", () =>
    Effect.gen(function* verbose() {
      const { stderr } = yield* runProbe(["--verbose"]);

      assert.include(stderr, "debug-line");
    }),
  );

  it.effect("with neither flag, debug is dropped and info is kept", () =>
    Effect.gen(function* neither() {
      const { stderr } = yield* runProbe([]);

      assert.notInclude(stderr, "debug-line");
      assert.include(stderr, "info-line");
    }),
  );

  it.effect("--log-level wins over --quiet", () =>
    Effect.gen(function* logLevelWins() {
      const { stderr } = yield* runProbe(["--quiet", "--log-level", "debug"]);

      assert.include(stderr, "debug-line");
    }),
  );

  it.effect("--quiet with --verbose is a usage error", () =>
    Effect.gen(function* both() {
      const { exit, stdout } = yield* runProbe(["--quiet", "--verbose"]);

      assert.isTrue(Exit.isFailure(exit));

      if (Exit.isFailure(exit)) {
        assert.isTrue(CliError.isCliError(Cause.squash(exit.cause)));
      }

      assert.strictEqual(exitCodeOf(exit), 2);
      assert.strictEqual(stdout, "");
    }),
  );

  for (const name of ["import", "export", "roundtrip"]) {
    it.effect(`${name} --help lists --quiet and --verbose`, () =>
      Effect.gen(function* listed() {
        const { exit, stdout } = yield* captureCli([name, "--help"]);

        assert.isTrue(Exit.isSuccess(exit));
        assert.include(stdout, "--quiet");
        assert.include(stdout, "--verbose");
      }),
    );
  }

  it.effect("--quiet import of a missing path exits 2 with the path once on stderr", () =>
    Effect.gen(function* missing() {
      const { exit, stderr, stdout } = yield* captureCli(["--quiet", "import", "/nonexistent"]);

      assert.strictEqual(exitCodeOf(exit), 2);
      assert.strictEqual(stderr.split("/nonexistent").length - 1, 1);
      assert.strictEqual(stdout, "");
    }),
  );
});
