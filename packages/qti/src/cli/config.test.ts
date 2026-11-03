import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Effect, Exit } from "effect";
import { CliError } from "effect/cli";
import { captureCli, spawnCli } from "#qti/test/cli.ts";

layer(NodeServices.layer, { excludeTestServices: true })("p14-u2d: no wizard", (it) => {
  it.effect("refuses --wizard as an unrecognized flag, with nothing on stdout", () =>
    Effect.gen(function* wizardRefused() {
      const { exit, stdout } = yield* captureCli(["--wizard"]);

      assert.isTrue(Exit.isFailure(exit));

      if (Exit.isFailure(exit)) {
        assert.isTrue(CliError.isCliError(Cause.squash(exit.cause)));
      }

      assert.strictEqual(stdout, "");
    }),
  );

  it.effect("does not list --wizard in the root help", () =>
    Effect.gen(function* helpWithoutWizard() {
      const { exit, stdout } = yield* captureCli(["--help"]);

      assert.isTrue(Exit.isSuccess(exit));
      assert.notInclude(stdout, "--wizard");
    }),
  );

  it.effect("exits non-zero as a child process, with nothing on stdout", () =>
    Effect.gen(function* wizardChild() {
      const { code, stdout } = yield* spawnCli(["--wizard"]);

      assert.notStrictEqual(code, 0);
      assert.strictEqual(stdout, "");
    }),
  );
});
