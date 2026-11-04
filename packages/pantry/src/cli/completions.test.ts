import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Effect, Exit } from "effect";
import { CliError } from "effect/cli";
import { captureCli } from "#pantry/test/cli.ts";
import { scratchEnv } from "#pantry/test/scratch.ts";

/**
 * The folder the run's home and cluster state live under, `packages/pantry/work/cli-completions`.
 * No other test file writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "work", "cli-completions");

/**
 * The environment of a run, with the database pointed at nothing: `completions` reads no
 * configuration, so a run that touched it would fail.
 */
const env = { GR8DES_PG_PORT: "1", ...scratchEnv(root) } as const;

layer(NodeServices.layer, { excludeTestServices: true })("qti completions, database-free", (it) => {
  it.effect("completions zsh prints the zsh script", () =>
    Effect.gen(function* zshScript() {
      const { exit, stdout } = yield* captureCli(["completions", "zsh"], { env });

      assert.isTrue(Exit.isSuccess(exit));
      assert.isTrue(stdout.startsWith("#compdef qti"));
    }),
  );

  it.effect("completions names a script for each other shell", () =>
    Effect.gen(function* everyShell() {
      for (const shell of ["bash", "fish", "powershell"]) {
        const { exit, stdout } = yield* captureCli(["completions", shell], { env });

        assert.isTrue(Exit.isSuccess(exit));
        assert.isAbove(stdout.length, 0);
      }
    }),
  );

  it.effect("the script lists the completions command itself", () =>
    Effect.gen(function* listsItself() {
      const { stdout } = yield* captureCli(["completions", "bash"], { env });

      assert.include(stdout, "completions");
    }),
  );

  it.effect("the --completions flag is gone, and fails with a CliError", () =>
    Effect.gen(function* flagGone() {
      const { exit, stdout } = yield* captureCli(["--completions", "zsh"], { env });

      assert.isTrue(Exit.isFailure(exit));
      assert.isTrue(Exit.isFailure(exit) && CliError.isCliError(Cause.squash(exit.cause)));
      assert.strictEqual(stdout, "");
    }),
  );
});
