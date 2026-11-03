import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Effect, Exit, Stdio } from "effect";
import { CliError, Command } from "effect/cli";
import { cli } from "#qti/cli.ts";
import { exitCodeOf, rewriteVerbose } from "#qti/cli/run.ts";
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

layer(NodeServices.layer, { excludeTestServices: true })("p14-u8b: -V and -v", (it) => {
  it.effect("-V and --version print the same line and succeed", () =>
    Effect.gen(function* versionFlags() {
      const short = yield* captureCli(["-V"]);
      const long = yield* captureCli(["--version"]);

      assert.isTrue(Exit.isSuccess(short.exit));
      assert.isTrue(Exit.isSuccess(long.exit));
      assert.notStrictEqual(long.stdout, "");
      assert.strictEqual(short.stdout, long.stdout);
    }),
  );

  it.effect("-v is verbose, not the version", () =>
    Effect.gen(function* verboseShort() {
      const { exit, stdout } = yield* captureCli(["-v", "import", "/nonexistent"]);

      assert.strictEqual(exitCodeOf(exit), 2);
      assert.include(Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "", "/nonexistent");
      assert.notInclude(stdout, "0.0.0");
    }),
  );

  it("rewrites -v before the first --, and only the bare flag", () => {
    assert.deepStrictEqual(rewriteVerbose(["-v", "import", "x"]), ["--verbose", "import", "x"]);
    assert.deepStrictEqual(rewriteVerbose(["import", "--", "-v"]), ["import", "--", "-v"]);
    assert.deepStrictEqual(rewriteVerbose(["-qv", "import", "x"]), ["-qv", "import", "x"]);
  });

  it.effect("the tree runs under Effect's default CliConfig, so it holds no -v alias", () =>
    Effect.gen(function* defaultConfig() {
      yield* Command.run(cli, { version: "0.0.0" }).pipe(
        Effect.provide(Stdio.layerTest({ args: Effect.succeed(["--help"]) })),
      );
    }),
  );
});
