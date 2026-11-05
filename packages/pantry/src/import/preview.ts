/**
 * What an import would read, without the database: the package read into rows and judged by the
 * guards, and nothing written.
 */
import { Effect } from "effect";
import type { PlatformError } from "effect";
import { readRows } from "#pantry/import/package.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";

/**
 * Whether `error` is one the guards or the reader raised, as opposed to the platform's.
 *
 * This restates `isReadRefusal` of `import/package.ts`, which that file keeps local; the two are
 * one line each and must agree.
 */
const isReadRefusal = <E extends { readonly _tag: string }>(
  error: E,
): error is Exclude<E, PlatformError.PlatformError> => error._tag !== "PlatformError";

/**
 * How much a package holds: the facts it would write and the relations they fall in.
 */
export interface Preview {
  /**
   * The relations that hold at least one fact, the ones the import program receives facts for.
   */
  readonly relations: number;
  /**
   * The facts of every relation together.
   */
  readonly rows: number;
}

/**
 * Read the package at `dir` as `importPackage` does and count what it would write, without opening
 * the database. The database's own checks, the laws it applies at commit, do not run, so a package
 * this accepts can still be refused by an import.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The counts. Fails with `ImportRefused` naming the rule a guard or the reader refused the
 *   package under, and with the platform's error when the package cannot be read.
 */
export const previewPackage = Effect.fn("import.previewPackage")(function* previewPackage(
  dir: string,
) {
  const { rows } = yield* readRows(dir).pipe(
    Effect.catchIf(isReadRefusal, (error) => Effect.fail(ruleOfError(error))),
  );
  const sizes = [...rows.values()].map((facts) => facts.length);

  return {
    relations: sizes.filter((size) => size > 0).length,
    rows: sizes.reduce((total, size) => total + size, 0),
  } satisfies Preview;
});
