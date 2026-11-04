/**
 * The package-level stage: what is judged and written once every document of a package is read,
 * across documents rather than inside one.
 */
import { Effect } from "effect";
import type { Rows } from "#pantry/import/tree.ts";

/**
 * Run the package-level stage over the rows of every document of one package. Not yet built: the
 * rows come back unchanged.
 *
 * @param rows - The rows of the whole package.
 * @returns The same rows.
 */
export const packageStage = Effect.fn("import.packageStage")(function* packageStage(rows: Rows) {
  return yield* Effect.succeed(rows);
});
