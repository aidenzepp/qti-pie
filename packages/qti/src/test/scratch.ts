import path from "node:path";
import { Effect, FileSystem } from "effect";

/**
 * The environment that gives a CLI run a scratch home and a cluster state folder of its own.
 */
export type ScratchEnv = Readonly<{
  /**
   * An empty cluster state folder, so a step that needs the database fails with kind `config`.
   */
  GRIZZLE_PG_STATE: string;
  /**
   * The run's home, so it never reads the real one.
   */
  HOME: string;
}>;

/**
 * The scratch environment under `root`: `state` and `home` folders there.
 *
 * @param root - The folder one test file owns, under `packages/qti/work`.
 */
export const scratchEnv = (root: string): ScratchEnv => ({
  GRIZZLE_PG_STATE: path.join(root, "state"),
  HOME: path.join(root, "home"),
});

/**
 * Make the scratch home and the empty cluster state folder of `env`.
 */
export const makeScratch = Effect.fn("test.scratch.make")(function* makeScratch(env: ScratchEnv) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(env.GRIZZLE_PG_STATE, { recursive: true });
  yield* fs.makeDirectory(env.HOME, { recursive: true });
});
