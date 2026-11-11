/**
 * Pantry's parse, import and preview programs, as an app calls them: a package in, a verdict out.
 *
 * Each wraps the importer's own program (`#pantry/import/parsed.ts`, `#pantry/import/package.ts`,
 * `#pantry/import/preview.ts`) and turns its refusals, `ImportRefused` and `RefusedAbove`, into
 * the refused verdict (`#pantry/api/verdict.ts`). Every other failure stays an error, as the
 * platform's or grizzle's own type, since it says nothing about the package. The importer's
 * programs own the spans (`import.parsedOf`, `import.importPackage`, `import.previewPackage`), so
 * these add none.
 */
import type { ApplyError, DbLayer, OpenError } from "@bjornpagen/grizzle/runtime";
import { Effect } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { refusalOf } from "#pantry/api/verdict.ts";
import type { ImportVerdict, ParseVerdict, PreviewVerdict, Refusal } from "#pantry/api/verdict.ts";
import type { ServedAuthorLogin } from "#pantry/db/served.ts";
import type { RefusedAbove } from "#pantry/import/above.ts";
import { importPackage as storePackage } from "#pantry/import/package.ts";
import type { CommitUnresolved } from "#pantry/import/package.ts";
import { parsedOf } from "#pantry/import/parsed.ts";
import type { PackageSource } from "#pantry/import/parsed.ts";
import { previewPackage as countPackage } from "#pantry/import/preview.ts";
import type { ImportRefused } from "#pantry/import/rules.ts";
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
 * Read and parse the package at `source` once, as the import and the preview read it, without
 * opening the database or writing anything: every entry's bytes, every document the import writes
 * a `Document` row of, and every path a reference of those documents resolves to.
 *
 * An app reads the parsed package's `files` (each entry a `File` by its path) and `referenced`
 * paths, to store or serve what a player fetches, and then passes the same value to
 * {@link importPackage} or {@link previewPackage}, which read nothing of the package again, so the
 * bytes the app read are the bytes the import stores. A parsed package passed here is itself.
 * Requires only the platform's `FileSystem`.
 *
 * @param source - The package: a directory, a `.zip` file, a zip archive's bytes, or a parsed
 *   package.
 * @returns `parsed` with the parsed package (`ParsedPackage`), or `refused` with the
 *   {@link Refusal} the reader, the container or the codec names. The database's laws do not run,
 *   so an import of a parsed package can still be refused. Fails with the platform's error when
 *   the package cannot be read.
 */
export const parsePackage = (
  source: PackageSource,
): Effect.Effect<ParseVerdict, PlatformError.PlatformError, FileSystem.FileSystem> =>
  parsedOf(source).pipe(
    Effect.map((parsed) => ({ package: parsed, verdict: "parsed" }) as const),
    Effect.catchTag("ImportRefused", refusedVerdict),
  );

/**
 * Import the package at `source` into the database, as one transaction: the database holds the
 * whole package or nothing of it. Every id is minted afresh, so the same package imported twice
 * is two packages.
 *
 * Requires the platform's `FileSystem`, the author login's `DbLayer`, the app's own connection to
 * the installation of the `Qti` schema, and the served login that layer is built over
 * (`ServedAuthorLogin`), whose author role `Db.open` takes.
 *
 * @param source - The package: a directory, a `.zip` file, a zip archive's bytes, or a package
 *   {@link parsePackage} parsed, which is not read again.
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
  FileSystem.FileSystem | ServedAuthorLogin | DbLayer<AuthorRole>
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
 * @param source - The package: a directory, a `.zip` file, a zip archive's bytes, or a package
 *   {@link parsePackage} parsed, which is not read again.
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
