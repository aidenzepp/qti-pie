/**
 * What an import would write, without the database: the package read, shredded and built into its
 * rows as `importPackage` builds them, and nothing written (plan W5, Q5.15).
 *
 * The dry run is the import's own read and build ({@link readProgram} of
 * `#pantry/import/program.ts`, `readPackage` then `programOf`): the read, the shred and the overlay
 * builders. The database's laws do not run, so a package this accepts can still be refused by an
 * import, and the preview says so (`databaseChecked`). Nothing here reaches the author login
 * (`#pantry/qti/own-login.ts`), whose workload grizzle builds when that module is evaluated, so a
 * dry run never pays for it; `src/cli/startup.test.ts` holds this module to that.
 */
import { Effect } from "effect";
import { readProgram, rowCountsOf } from "#pantry/import/program.ts";

/**
 * How much a package holds: the rows it would write and the relations they fall in, and that no
 * law of the database judged them.
 */
export interface Preview {
  /**
   * Always false: a dry run opens no database, so none of its laws ran.
   */
  readonly databaseChecked: false;
  /**
   * The relations that would hold at least one row, nested members counted under their own.
   */
  readonly relations: number;
  /**
   * The rows of every relation together: each node, attribute, declaration, entry and overlay row.
   */
  readonly rows: number;
}

/**
 * Read the package at `dir` as `importPackage` does and count what it would write, without opening
 * the database.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The counts. Fails with `ImportRefused` naming the rule the reader, the container or the
 *   codec refused the package under, and with the platform's error when the package cannot be
 *   read.
 */
export const previewPackage = Effect.fn("import.previewPackage")(function* previewPackage(
  dir: string,
) {
  const counts = [...rowCountsOf(yield* readProgram(dir)).values()];
  const preview: Preview = {
    databaseChecked: false,
    relations: counts.filter((count) => count > 0).length,
    rows: counts.reduce((total, count) => total + count, 0),
  };

  yield* Effect.annotateCurrentSpan({ relations: preview.relations, rows: preview.rows });

  return preview;
});
