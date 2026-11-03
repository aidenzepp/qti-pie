import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { captureCli } from "#qti/test/cli.ts";

layer(NodeServices.layer, { excludeTestServices: true })("the text error shape", (it) => {
  it.effect("an unknown command prints its usage and the valid commands, not the whole help", () =>
    Effect.gen(function* unknownCommand() {
      const { stderr, stdout } = yield* captureCli(["frobnicate"]);

      assert.isTrue(stderr.startsWith("error[cli-usage]:"));
      assert.include(stderr, "= help:");

      for (const command of ["import", "export", "roundtrip"]) {
        assert.include(stderr, command);
      }

      assert.notInclude(stderr, "GLOBAL FLAGS");
      assert.strictEqual(stdout, "");
    }),
  );

  it.effect("a missing path prints error[cli-path-missing] with the path once", () =>
    Effect.gen(function* missingPath() {
      const { stderr } = yield* captureCli(["import", "/nonexistent"]);

      assert.include(stderr, "error[cli-path-missing]:");
      assert.include(stderr, "= help:");
      assert.strictEqual(stderr.split("/nonexistent").length - 1, 1);
    }),
  );
});
