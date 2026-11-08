import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { withAuthorApp } from "#pantry/cli/engine.ts";
import { ClusterConfigError } from "#pantry/db/connection.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The folder this file's empty `HOME` and `GRIZZLE_PG_STATE` folders are made in,
 * `packages/pantry/work/cli-engine-*`, the run's own.
 */
const scratch = fileScratchDirectory("cli-engine-");

layer(NodeServices.layer, { excludeTestServices: true })("withAuthorApp", (it) => {
  it.effect("fails on the cluster's settings before it loads the engine module", () =>
    Effect.gen(function* settingsFirst() {
      const fs = yield* FileSystem.FileSystem;
      const home = path.join(scratch, "home");
      const state = path.join(scratch, "state");
      const loaded: string[] = [];

      yield* fs.makeDirectory(home, { recursive: true });
      yield* fs.makeDirectory(state, { recursive: true });

      const failure = yield* withAuthorApp(
        () => {
          loaded.push("engine");

          return Promise.resolve({});
        },
        () => Effect.void,
      ).pipe(
        Effect.provide(
          ConfigProvider.layer(ConfigProvider.fromUnknown({ GRIZZLE_PG_STATE: state, HOME: home })),
        ),
        Effect.flip,
      );

      assert.instanceOf(failure, ClusterConfigError);
      assert.deepStrictEqual(loaded, []);
    }),
  );
});
