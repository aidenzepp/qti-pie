/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload, built over any `Qti` schema value.
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
import { Function as Fn, pipe, Record as Rec } from "effect";
import { exportQueriesOf } from "#pantry/export/scan.ts";
import { writtenRelations } from "#pantry/import/roster.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { authorRoleOf } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A package's inputs with no row: each written relation's empty keyed set.
 */
const noInputs: PackageInputs = pipe(
  writtenRelations,
  Rec.map(() => new Map<string, never>()),
);

/**
 * Build the author application's login over a `Qti` schema, over its author role
 * (`#pantry/qti/roles.ts` `authorRoleOf`), with two workloads:
 *
 * - **the export's reads**: one document's ordered scan, the documents of a package and a package's
 *   record (`#pantry/export/scan.ts` `exportQueriesOf`), each compiled once when the login's
 *   `DbLayer` is built, its access paths earning their indexes (the W5 amendment's C20);
 * - **the import's write program**: `changeSetOf`'s ChangeSet with no rows. grizzle compiles a
 *   ChangeSet from its Description, which names each insert and none of its rows, so this is the
 *   program every package's import compiles. It is declared to be compiled, never run: the schema's
 *   own compile already refuses a column or a relation no write fills, so compiling it guards the
 *   refusals of the write program itself, an insert outside the author role (`OutsideRole`) and a
 *   stratum no order of its statements keeps every key at (`UnorderableStratum`).
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it, named by the level of `Qti` it is over, and its connection's password is that role's
 * (`#pantry/db/connection.ts`). Built once per schema value, since grizzle puts a role in one login
 * only.
 *
 * @param qti - The `Qti` schema, built for an install's policy or none
 *   (`#pantry/qti/schema.ts` `qtiSchema`).
 * @returns The login.
 * @see https://github.com/bjornpagen/grizzle/blob/4b0d45ef2156b9b83d628fdb8c3bdd96dcf7f38a/packages/engine/src/program/names.ts#L61-L76
 */
export const authorAppOf = Fn.memoize((qti: typeof Qti) => {
  const author = authorRoleOf(qti);

  return login(qti, "author_app", [author], {
    workload: [
      workload(author, exportQueriesOf(qti)),
      workload(author, { importWrite: changeSetOf(author, noInputs) }),
    ],
  });
});

/**
 * The author application's login over the `Qti` this process opens.
 */
export const AuthorApp = authorAppOf(Qti);

/**
 * The author application's workloads: the export's reads, and the import's write program.
 */
export const [exportWork, importWork] = AuthorApp.workload;
