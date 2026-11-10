/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload, built over any `Qti` schema value.
 *
 * The import's write program is the login's `importWrite` member, declared with an empty array for
 * each relation an import writes, so each is an array member that takes a package's rows with each
 * call (README, "Reading": `db.workload.<name>`). `grizzle generate` compiles it into the login's
 * served file and `grizzle check` holds the committed file to it, so a schema whose writes cannot
 * compile fails there, never at the first import (R87, whose `BranchResolution.instanceEnd` made
 * every import's ChangeSet refuse once a migrated schema ran it). `importPackage` applies it to
 * each package's facts (`packageFactsOf` of `#pantry/import/write.ts`), and the layer loads it
 * compiling nothing.
 */
import { insertableNamesOf, login, paged, workload } from "@bjornpagen/grizzle";
import { pipe, Record as Rec, Struct } from "effect";
import { exportQueriesOf } from "#pantry/export/scan.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { authorRoleOf } from "#pantry/qti/roles.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * A package's inputs with no row: each relation an import writes, grizzle's `insertableNamesOf`,
 * with its empty keyed set.
 *
 * @param qti - The `Qti` schema.
 * @returns The inputs.
 */
const noInputsOf = (qti: QtiSchema): PackageInputs =>
  pipe(
    Struct.pick(qti.relations, insertableNamesOf(qti)),
    Rec.map(() => new Map<string, never>()),
  );

/**
 * Build the author application's two workloads over an author role ({@link authorAppOf}): the
 * export's reads with `packageOf`, and the import's write program. A database test compiles them
 * with members of its own beside them over a role of its own (`#pantry/test/served-members.ts`),
 * since grizzle puts a role in one login only.
 *
 * @param qti - The `Qti` schema.
 * @param author - The author role over it (`#pantry/qti/roles.ts` `authorRoleOf`).
 * @returns The workloads, in the login's order.
 */
export const authorWorkloadsOf = (qti: QtiSchema, author: AuthorRole) => {
  const { documentScan, documentsOf, entriesOf } = exportQueriesOf(qti);

  return [
    workload(author, {
      documentScan: paged(documentScan),
      documentsOf,
      entriesOf,
      packageOf: qti.relations.Package,
    }),
    workload(author, { importWrite: changeSetOf(author, noInputsOf(qti)) }),
  ] as const;
};

/**
 * Build the author application's login over a `Qti` schema, over its author role
 * (`#pantry/qti/roles.ts` `authorRoleOf`), with two workloads:
 *
 * - **the export's reads**: one document's ordered scan, the documents of a package and a package's
 *   record (`#pantry/export/scan.ts` `exportQueriesOf`), each compiled once when the login's
 *   `DbLayer` is built, its access paths earning their indexes (the W5 amendment's C20), and
 *   `packageOf`, the `Package` row by its key, a key member whose handle's `get` the export reads
 *   to refuse an id no package has and the import reads back after a commit with no answer, so
 *   every read pantry runs is a member of the workload;
 * - **the import's write program**: `changeSetOf`'s ChangeSet with no rows, every insert an array
 *   member, which each import applies to its package's facts (`importWrite`). The schema's own
 *   compile already refuses a column or a relation no write fills, so compiling it guards the
 *   refusals of the write program itself, an insert outside the author role (`OutsideRole`) and a
 *   stratum no order of its statements keeps every key at (`UnorderableStratum`).
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it, named by the level of `Qti` it is over, and its connection's password is that role's
 * (`#pantry/db/connection.ts`). Each call builds a login, a role and workloads of its own, and
 * grizzle puts a role in one login only: an install builds its login once and holds it
 * (`#pantry/qti/own.ts` for this package's own).
 *
 * @param qti - The `Qti` schema, built for an install's policy or none
 *   (`#pantry/qti/schema.ts` `qtiSchema`).
 * @returns The login.
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/engine/src/program/names.ts#L61-L76
 */
export const authorAppOf = (qti: QtiSchema) => {
  const author = authorRoleOf(qti);

  return login(qti, "author_app", [author], { workload: authorWorkloadsOf(qti, author) });
};

/**
 * The author application's login, whatever `Qti` it is built over: the type the runtime serves the
 * login's committed workload as (`#pantry/db/served.ts`), read by `import type` alone.
 */
export type AuthorAppLogin = ReturnType<typeof authorAppOf>;
