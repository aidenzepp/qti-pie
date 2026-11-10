/**
 * Pantry's import and preview programs, as an app calls them: a package in, a verdict out.
 *
 * Each wraps the importer's own program (`#pantry/import/package.ts`, `#pantry/import/preview.ts`)
 * and turns its refusals, `ImportRefused` and `RefusedAbove`, into the refused verdict
 * (`#pantry/api/verdict.ts`). Every other failure stays an error, as the platform's or grizzle's
 * own type, since it says nothing about the package. The importer's programs own the spans
 * (`import.importPackage`, `import.previewPackage`), so these add none.
 */
import type { ApplyError, DbLayer, OpenError } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { refusalOf } from "#pantry/api/verdict.ts";
import type { ImportVerdict, PreviewVerdict, Refusal } from "#pantry/api/verdict.ts";
import type { RefusedAbove } from "#pantry/import/above.ts";
import { importPackage as storePackage } from "#pantry/import/package.ts";
import type { CommitUnresolved } from "#pantry/import/package.ts";
import { previewPackage as countPackage } from "#pantry/import/preview.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import type { PackageSource } from "#pantry/package/read.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";

/**
 * Succeed with the refused verdict of an importer refusal.
 *
 * @param error - The importer's refusal.
 * @returns The refused verdict, carrying the refusal as plain data.
 */
const refusedVerdict = (
  error: ImportRefused | RefusedAbove,
): Effect.Effect<{ readonly verdict: "refused"; readonly refusal: Refusal }> =>
  Effect.succeed({ refusal: refusalOf(error), verdict: "refused" });

/**
 * Import the package at `source` into the database, as one transaction: the database holds the
 * whole package or nothing of it. Every id is minted afresh, so the same package imported twice
 * is two packages.
 *
 * Requires the platform's `FileSystem` and the author login's `DbLayer`, the app's own connection
 * to the installation of the `Qti` schema.
 *
 * @param source - The package: a directory, a `.zip` file, or a zip archive's bytes.
 * @returns `accepted` with the stored package's id, or `refused` with the {@link Refusal} that
 *   names the level and rule the package broke, whether the reader, the codec or the database
 *   refused it. Fails with the platform's error when the package cannot be read; with
 *   `CommitUnresolved` when the commit got no answer and reading the package back failed, so it
 *   may or may not be stored; and with grizzle's own error when the database failed for a reason
 *   that is not a refusal.
 */
export const importPackage = (
  source: PackageSource,
): Effect.Effect<
  ImportVerdict,
  PlatformError.PlatformError | ApplyError | OpenError | CommitUnresolved,
  FileSystem.FileSystem | DbLayer<AuthorRole>
> =>
  storePackage(source).pipe(
    Effect.map((packageId) => ({ packageId, verdict: "accepted" }) as const),
    Effect.catchTags({ ImportRefused: refusedVerdict, RefusedAbove: refusedVerdict }),
  );

/**
 * Read the package at `source` and build its rows as an import does, without opening the
 * database or writing anything, and count them.
 *
 * The database's laws do not run, so `databaseChecked` is false and an import of a previewed
 * package can still be refused. Requires only the platform's `FileSystem`.
 *
 * @param source - The package: a directory, a `.zip` file, or a zip archive's bytes.
 * @returns `previewed` with the number of relations that would hold a row and the number of rows,
 *   or `refused` with the {@link Refusal} the reader, the container or the codec names. Fails with
 *   the platform's error when the package cannot be read.
 */
export const previewPackage = (
  source: PackageSource,
): Effect.Effect<PreviewVerdict, PlatformError.PlatformError, FileSystem.FileSystem> =>
  countPackage(source).pipe(
    Effect.map((preview) => ({ ...preview, verdict: "previewed" }) as const),
    Effect.catchTag("ImportRefused", refusedVerdict),
  );
