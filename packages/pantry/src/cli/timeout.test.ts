import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Cause, Console, Duration, Effect, Exit, FileSystem, Logger } from "effect";
import { Command } from "effect/cli";
import { inject } from "vitest";
import { exitCodeOf } from "#pantry/cli/run.ts";
import { cliProcessTestTimeoutMs, engineLoadHookTimeoutMs } from "#pantry/test/settings.ts";
import {
  CommandTimedOut,
  timeoutGlobalFlags,
  timeoutSetting,
  withTimeout,
} from "#pantry/cli/timeout.ts";
import { captureCli, preloadEngine } from "#pantry/test/cli.ts";

const fixtures = inject("fixtures");

/**
 * The scratch folder this file owns: the home and the cluster state of the run on the real root.
 */
const scratch = path.resolve(import.meta.dirname, "..", "..", "work", "cli-timeout");

/**
 * A command whose handler waits one second, wired as the root is: the setting, then the bound.
 */
const slow = Command.make("slow", {}, () => Effect.sleep("1 second")).pipe(
  withTimeout,
  Command.withGlobalFlags(timeoutGlobalFlags),
  Command.provideSync(Logger.LogToStderr, true),
);

/**
 * A command that prints the limit this run parsed.
 */
const show = Command.make("show", {}, () =>
  Effect.gen(function* showHandler() {
    yield* Console.log(Duration.format(yield* timeoutSetting));
  }),
).pipe(withTimeout, Command.withGlobalFlags(timeoutGlobalFlags));

/**
 * Loads the engine once, before this file's first test, so no test pays that load inside its own
 * timeout.
 */
beforeAll(() => preloadEngine, engineLoadHookTimeoutMs);

layer(NodeServices.layer, { excludeTestServices: true })("p14-u8c: --timeout", (it) => {
  it.effect("a handler that outlasts --timeout fails with CommandTimedOut, exit 1", () =>
    Effect.gen(function* outlasts() {
      const { exit, stdout } = yield* captureCli(["--timeout", "10 millis"], { command: slow });

      assert.isTrue(Exit.isFailure(exit));

      if (Exit.isFailure(exit)) {
        assert.instanceOf(Cause.squash(exit.cause), CommandTimedOut);
      }

      assert.strictEqual(exitCodeOf(exit), 1);
      assert.strictEqual(stdout, "");
    }),
  );

  it.effect("a handler that finishes inside the limit succeeds", () =>
    Effect.gen(function* inside() {
      const { exit } = yield* captureCli(["--timeout", "5 seconds"], { command: slow });

      assert.isTrue(Exit.isSuccess(exit));
    }),
  );

  it.effect("with no flag the limit is 5 minutes", () =>
    Effect.gen(function* byDefault() {
      const { stdout } = yield* captureCli([], { command: show });

      assert.strictEqual(stdout, Duration.format(Duration.minutes(5)));
    }),
  );

  it.effect("QTI_TIMEOUT sets the limit", () =>
    Effect.gen(function* fromEnv() {
      const { stdout } = yield* captureCli([], {
        command: show,
        env: { HOME: scratch, QTI_TIMEOUT: "2 seconds" },
      });

      assert.strictEqual(stdout, Duration.format(Duration.seconds(2)));
    }),
  );

  it.effect("--timeout wins over QTI_TIMEOUT", () =>
    Effect.gen(function* flagWins() {
      const { stdout } = yield* captureCli(["--timeout", "3 seconds"], {
        command: show,
        env: { HOME: scratch, QTI_TIMEOUT: "2 seconds" },
      });

      assert.strictEqual(stdout, Duration.format(Duration.seconds(3)));
    }),
  );

  it.effect("a limit that is not a duration, or not positive, is a usage error, exit 2", () =>
    Effect.gen(function* bad() {
      for (const value of ["soon", "0 millis", "-1 seconds"]) {
        const { exit, stdout } = yield* captureCli(["--timeout", value], { command: show });

        assert.strictEqual(exitCodeOf(exit), 2);
        assert.strictEqual(stdout, "");
      }
    }),
  );

  it.effect(
    "the real import is cut off at --timeout 1 millis with CommandTimedOut, exit 1",
    () =>
      Effect.gen(function* realRoot() {
        const fs = yield* FileSystem.FileSystem;
        const home = path.join(scratch, "home");
        const state = path.join(scratch, "state");

        yield* fs.makeDirectory(path.join(state, "tls"), { recursive: true });
        yield* fs.makeDirectory(home, { recursive: true });
        yield* fs.writeFileString(path.join(state, "tls", "ca.crt"), "placeholder\n");

        // The pool is built before the importer loads (`withAuthorApp`), so the 1 ms timer fires
        // while the layer reads the certificate and the 36 MB snapshot (`src/db/layer.ts:90-103`),
        // before it loads the login. The certificate exists, so nothing fails before the timer; port
        // 1 is where no cluster listens, in case a pool opens before it does.
        const { exit, stdout } = yield* captureCli(
          ["--timeout", "1 millis", "import", fixtures.simple],
          {
            env: { GR8DES_PG_PORT: "1", GRIZZLE_PG_STATE: state, HOME: home },
          },
        );

        assert.isTrue(Exit.isFailure(exit));

        if (Exit.isFailure(exit)) {
          assert.instanceOf(Cause.squash(exit.cause), CommandTimedOut);
        }

        assert.strictEqual(exitCodeOf(exit), 1);
        assert.strictEqual(stdout, "");
      }),
    cliProcessTestTimeoutMs,
  );

  it.effect("import --help lists --timeout", () =>
    Effect.gen(function* listed() {
      const { exit, stdout } = yield* captureCli(["import", "--help"]);

      assert.isTrue(Exit.isSuccess(exit));
      assert.include(stdout, "--timeout");
      assert.include(stdout, "[env: QTI_TIMEOUT] [default: 5 minutes]");
    }),
  );
});
