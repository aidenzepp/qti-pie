/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload.
 *
 * The import's write program is declared with no rows, so that grizzle compiles it wherever it
 * compiles a workload: `grizzle generate`, `grizzle check` and every `DbLayer` startup. A schema
 * whose writes cannot compile then fails there, never at the first import (R87, whose
 * `BranchResolution.instanceEnd` made every import's ChangeSet refuse once a migrated schema ran
 * it). The declared program carries no package: a family member is written from an array or a
 * Stream, never from a query or a parameter, so `importPackage` still sends a ChangeSet built per
 * package (the W5 amendment's C19), which `db.apply` compiles for its call from the same
 * Description.
 */
import { login, workload } from "@bjornpagen/grizzle";
import { Result } from "effect";
import { documentScan, documentsOf, entriesOf } from "#pantry/export/scan.ts";
import { unionsOf } from "#pantry/import/overlays/index.ts";
import { writtenNames } from "#pantry/import/roster.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The author application's workload: one document's ordered scan, the documents of a package and
 * a package's record, each compiled once when the login's `DbLayer` is built, its access paths
 * earning their indexes (the W5 amendment's C20).
 */
export const exportWork = workload(Author, { documentScan, documentsOf, entriesOf });

/**
 * A package's inputs with no row: each written relation's empty keyed set, the union of no part,
 * which has no two rows to conflict.
 */
const noInputs = Result.getOrThrowWith(
  unionsOf<PackageInputs>(writtenNames, []),
  (conflict) => conflict,
);

/**
 * The import's write program: `changeSetOf`'s ChangeSet with no rows. grizzle compiles a ChangeSet
 * from its Description, which names each insert and none of its rows, so this is the program every
 * package's import compiles, and its compilation runs grizzle's write filler over every family of
 * the schema. It is declared to be compiled, never run.
 */
export const importWork = workload(Author, { importWrite: changeSetOf(Author, noInputs) });

/**
 * The author application's login, `qti__author_app` on the cluster. Its name is the one every
 * earlier installation used, so a migration from scratch needs no `--rename @…`.
 */
export const AuthorApp = login(Qti, "author_app", [Author], {
  workload: [exportWork, importWork],
});
