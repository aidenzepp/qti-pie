import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { spawnCli } from "#qti/test/cli.ts";
import { cliProcessTestTimeoutMs } from "#qti/test/settings.ts";

layer(NodeServices.layer, { excludeTestServices: true })("cli.ts streams, database-free", (it) => {
  it.effect(
    "a mistyped command prints its usage line to standard error and nothing to standard output",
    () =>
      Effect.gen(function* usageOnStderr() {
        const { stderr, stdout } = yield* spawnCli(["export", "only-one"]);

        assert.strictEqual(stdout, "");
        assert.include(stderr, "error[cli-usage]:");
        assert.include(stderr, "package-id");
      }),
    cliProcessTestTimeoutMs,
  );
});
