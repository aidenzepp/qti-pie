/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload, built over any `Qti` schema value.
 *
 * The import's write program is the login's `importWrite` member, declared with no rows: an empty
 * array for each relation an import writes, so each is an array member that takes a package's rows
 * with each call (README, "Reading": `db.workload.<name>`). grizzle compiles it wherever it
 * compiles a workload: `grizzle generate`, which writes the compiled login as the served file
 * (`migrations/qti/served/author_app.json` for this package's own), and `grizzle check`, which
 * compiles it again and holds the file to it. A schema whose writes cannot compile then fails
 * there, never at the first import (R87, whose `BranchResolution.instanceEnd` made every import's
 * ChangeSet refuse once a migrated schema ran it). The runtime serves that file and compiles
 * nothing (`#pantry/db/served.ts`): `importPackage` applies the served `importWrite` member to each
 * package's facts (`packageFactsOf` of `#pantry/import/write.ts`; the W5 amendment's C19).
 */
import { ChangeSet, insertableNamesOf, login, paged, workload } from "@bjornpagen/grizzle";
import { pipe, Record as Rec, Struct } from "effect";
import { exportQueriesOf } from "#pantry/export/scan.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import { authorRoleOf } from "#pantry/qti/roles.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Declare the import's write program, the login's `importWrite` member: one ChangeSet step over the
 * author role, each relation an import writes (grizzle's `insertableNamesOf`) inserted once by its
 * key with no row (`insertAll`, which types and checks each key's rows as that relation's own
 * insert), every owner in the same stratum as its whole family (the W5 amendment's A, C19). A
 * ChangeSet is canonical, its members sorted by relation, so the order of the inserts is no part
 * of it. `grizzle generate` compiles it once into the login's served file, and each import applies
 * that member to its own package's facts (`packageFactsOf` of `#pantry/import/write.ts`).
 *
 * @param qti - The `Qti` schema.
 * @param author - The author role over it.
 * @returns The ChangeSet, over no rows.
 */
// GRIZZLE-PENDING: Q2: the rowless ChangeSet builder declares these inserts by relation name with no rows, and this function goes.
const importWriteOf = (qti: QtiSchema, author: AuthorRole) =>
  ChangeSet.empty(author).insertAll(
    packageFactsOf(
      pipe(
        Struct.pick(qti.relations, insertableNamesOf(qti)),
        Rec.map(() => new Map<string, never>()),
      ),
    ),
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
  const { documentScan, entriesOf } = exportQueriesOf(qti);

  return [
    workload(author, {
      documentScan: paged(documentScan),
      entriesOf,
      packageOf: qti.relations.Package,
    }),
    workload(author, { importWrite: importWriteOf(qti, author) }),
  ] as const;
};

/**
 * Build the author application's login over a `Qti` schema, over its author role
 * (`#pantry/qti/roles.ts` `authorRoleOf`), with two workloads:
 *
 * - **the export's reads**: one document's ordered scan and a package's record with each entry's
 *   document (`#pantry/export/scan.ts` `exportQueriesOf`), each compiled by `grizzle generate` into
 *   the login's served file, its access paths earning their indexes (the W5 amendment's C20), and
 *   `packageOf`, the `Package` row by its key, a key member whose handle's `get` the export reads
 *   to refuse an id no package has and the import reads back after a commit with no answer, so
 *   every read pantry runs is a member of the workload;
 * - **the import's write program**: the ChangeSet with no rows ({@link importWriteOf}), the member
 *   `importWrite`, every insert an array member. grizzle compiles a ChangeSet from its Description,
 *   which names each insert and none of its rows, so this is the program every package's import
 *   applies to its package's facts, compiled once into the served file. Compiling it also guards
 *   the refusals of the write program itself: the schema's own compile already refuses a column or
 *   a relation no write fills, and this one refuses an insert outside the author role
 *   (`OutsideRole`) and a stratum no order of its statements keeps every key at
 *   (`UnorderableStratum`).
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it, named by the level of `Qti` it is over, and its connection's password is that role's
 * (`#pantry/db/connection.ts`). Each call builds a login, a role and workloads of its own, and
 * grizzle puts a role in one login only: an install builds its login once and holds it
 * (`#pantry/qti/own-login.ts` for the tests' own).
 *
 * @param qti - The `Qti` schema, built for an install's policy or none
 *   (`#pantry/qti/schema.ts` `qtiSchema`).
 * @returns The login.
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/engine/src/program/names.ts#L61-L76
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
