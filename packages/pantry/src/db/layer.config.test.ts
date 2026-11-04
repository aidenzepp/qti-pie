import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Result } from "effect";
import { fileURLToPath } from "node:url";
import { AuthorAppLayer, ClusterConfigError } from "#pantry/db/layer.ts";

/**
 * The folder this file's empty `HOME` and `GRIZZLE_PG_STATE` folders are made in, under the
 * package's git-ignored `work/`.
 */
const scratch = fileURLToPath(new URL("../../work/cli-layer-config/", import.meta.url));

/**
 * Build `AuthorAppLayer` under the settings given, and return how it failed. The layer is built and
 * released at once, so no connection is made: it fails before it reaches the cluster.
 */
const buildFailure = (settings: Readonly<Record<string, string>>) =>
  Effect.provide(Effect.void, AuthorAppLayer).pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(settings))),
    Effect.result,
    Effect.map((result) => (Result.isFailure(result) ? result.failure : undefined)),
  );

layer(NodeServices.layer)("db/layer.ts, a cluster that is not set up", (it) => {
  it.effect("a missing CA is a ClusterConfigError naming the file and the remedy", () =>
    Effect.gen(function* missingCa() {
      const fs = yield* FileSystem.FileSystem;
      const home = `${scratch}home`;
      const state = `${scratch}state`;

      yield* fs.makeDirectory(home, { recursive: true });
      yield* fs.makeDirectory(state, { recursive: true });

      const failure = yield* buildFailure({ GRIZZLE_PG_STATE: state, HOME: home });

      assert.instanceOf(failure, ClusterConfigError);
      assert.isTrue(failure.path.endsWith("tls/ca.crt"));
      assert.strictEqual(failure.path, `${state}/tls/ca.crt`);
      assert.strictEqual(failure.setting, "GRIZZLE_PG_STATE");
      assert.include(failure.message, `${state}/tls/ca.crt`);
      assert.include(failure.message, "pnpm pg:init");
      assert.include(failure.message, "GRIZZLE_PG_STATE");
    }),
  );

  it.effect("a malformed port is Effect's ConfigError, before any file is read", () =>
    Effect.gen(function* malformedPort() {
      const failure = yield* buildFailure({
        GR8DES_PG_PORT: "x",
        GRIZZLE_PG_STATE: `${scratch}state`,
        HOME: `${scratch}home`,
      });

      assert.deepStrictEqual(
        Object.getOwnPropertyDescriptor(failure, "_tag")?.value,
        "ConfigError",
      );
    }),
  );
});
