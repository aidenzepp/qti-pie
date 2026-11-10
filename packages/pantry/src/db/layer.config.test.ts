import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { fileURLToPath } from "node:url";
import { ClusterConfigError, PasswordCommandFailed } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";

/**
 * The folder this file's empty `HOME` and `GRIZZLE_PG_STATE` folders are made in, under the
 * package's git-ignored `work/`.
 */
const scratch = fileURLToPath(new URL("../../work/cli-layer-config/", import.meta.url));

/**
 * Build `AuthorAppLayer` under the settings given, and return how it failed, failing where it was
 * built. The layer is built and released at once, so no connection is made: it fails before it
 * reaches the cluster.
 */
const buildFailure = (settings: Readonly<Record<string, string>>) =>
  Effect.provide(Effect.void, AuthorAppLayer).pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(settings))),
    Effect.flip,
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
      assert.strictEqual(failure.path, `${state}/tls/ca.crt`);
      assert.strictEqual(failure.setting, "GRIZZLE_PG_STATE");
      assert.include(failure.message, `${state}/tls/ca.crt`);
      assert.include(failure.message, "pnpm pg:init");
      assert.include(failure.message, "GRIZZLE_PG_STATE");
    }),
  );

  it.effect(
    "a password command that fails is the build's PasswordCommandFailed, before any connection attempt, whose message names the command, its exit code and the setting",
    () =>
      Effect.gen(function* failingCommand() {
        const fs = yield* FileSystem.FileSystem;
        const home = `${scratch}home`;
        const ca = `${scratch}ca.crt`;
        const command = `${scratch}failing.sh`;

        yield* fs.makeDirectory(home, { recursive: true });
        yield* fs.writeFileString(ca, "an unused CA: no connection is made\n");
        yield* fs.writeFileString(command, "#!/bin/sh\nprintf 'half a password'\nexit 3\n");
        yield* fs.chmod(command, 0o755);

        const failure = yield* buildFailure({
          GR8DES_PG_CA: ca,
          GR8DES_PG_PASSWORD_COMMAND: command,
          HOME: home,
        });

        assert.instanceOf(failure, PasswordCommandFailed);
        assert.strictEqual(failure.command, command);
        assert.strictEqual(failure.exitCode, 3);
        assert.match(failure.role, /author_app/u);
        assert.include(failure.message, `${command} exited with code 3 for the role`);
        assert.include(failure.message, "GR8DES_PG_PASSWORD_COMMAND");
        assert.notInclude(failure.message, "half a password");
      }),
  );
});
