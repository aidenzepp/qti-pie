/**
 * A test run's own scratch folder under `packages/pantry/work/`, for a test whose files another
 * program reads (xmllint, the CLI) or that it lays out on disk. The folder's name is a prefix the
 * test chooses and a random suffix, so two runs of a suite at once (the sentinel's, a lane's) never
 * write, read or remove each other's files, and it is removed when the scope that made it closes.
 */
import path from "node:path";
import { Effect, FileSystem } from "effect";

/**
 * `packages/pantry/work`, which git ignores.
 */
export const workRoot = path.resolve(import.meta.dirname, "..", "..", "work");

/**
 * Make a fresh folder `work/<prefix><random>` for one run, removed with everything in it when the
 * scope closes.
 *
 * @param prefix - The folder's name before its random suffix, naming the test that writes it, as
 *   `xsd-lexical-`.
 * @returns The folder's absolute path.
 */
export const scratchDirectory = Effect.fn("test.scratchDirectory")(function* scratchDirectory(
  prefix: string,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workRoot, { recursive: true });

  return yield* fs.makeTempDirectoryScoped({ directory: workRoot, prefix });
});
