/**
 * The import of a package at a path, as the tests run it: the package read once, then what was
 * read imported, as the command line's `import` runs them (`#pantry/cli/import.ts`).
 */
import { Effect } from "effect";
import { importPackage } from "#pantry/import/package.ts";
import { readPackage } from "#pantry/import/read.ts";

/**
 * Read the package at `dir` and import what was read: `readPackage`, then `importPackage`.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The id of the committed package. Fails as the read fails, then as the import fails.
 */
export const importDir = (dir: string) => Effect.flatMap(readPackage(dir), importPackage);
