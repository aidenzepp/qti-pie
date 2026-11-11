/**
 * The author application's login and the import's write program, plain grizzle values over `Qti`:
 * an application's grizzle config lists {@link AuthorApp} beside its own logins, or puts
 * {@link importWrite} and the export's reads (`#pantry/export/scan.ts`) in a workload of a role of
 * its own.
 *
 * The import's write program is declared with no rows: an empty array for each relation an import
 * writes, so each is an array member that takes a package's rows with each call (README, "Reading":
 * `db.workload.<name>`). grizzle compiles it wherever it compiles a workload: `grizzle generate`,
 * which writes the compiled login as the served file (`migrations/qti/served/author_app.json` for
 * this package's own), and `grizzle check`, which compiles it again and holds the file to it. A
 * schema whose writes cannot compile then fails there, never at the first import (R87, whose
 * `BranchResolution.instanceEnd` made every import's ChangeSet refuse once a migrated schema ran
 * it). A process serves that file and compiles nothing: it applies the served `importWrite` member
 * to each package's rows (`importRowsOf` of `#pantry/import/rows.ts`; the W5 amendment's C19).
 */
import { ChangeSet, insertableNamesOf, login, paged, workload } from "@bjornpagen/grizzle";
import { pipe, Record as Rec, Struct } from "effect";
import { documentScan, entriesOf } from "#pantry/export/scan.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import { Author } from "#pantry/qti/roles.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * The import's write program: one ChangeSet step over `Qti`, each relation an import writes
 * (grizzle's `insertableNamesOf`) inserted once by its key with no row (`insertAll`, which types
 * and checks each key's rows as that relation's own insert), every owner in the same stratum as its
 * whole family (the W5 amendment's A, C19). A ChangeSet is canonical, its members sorted by
 * relation, so the order of the inserts is no part of it. Each import applies it to its own
 * package's rows, `db.workload.importWrite.apply({ insert: rows }, {})`, the rows `importRowsOf`
 * builds (`#pantry/import/rows.ts`).
 *
 * It is over the schema, so a workload of any role that inserts into every relation of `Qti` holds
 * it, the author role's ({@link AuthorApp}) or an application's own.
 */
// GRIZZLE-PENDING: Q2: the rowless ChangeSet builder declares these inserts by relation name with no rows.
export const importWrite = ChangeSet.empty(Qti).insertAll(
  packageFactsOf(
    pipe(
      Struct.pick(Qti.relations, insertableNamesOf(Qti)),
      Rec.map(() => new Map<string, never>()),
    ),
  ),
);

/**
 * The export's reads, as the author login's first workload holds them: one document's ordered scan
 * and a package's record with each entry's document (`#pantry/export/scan.ts`), and `packageOf`,
 * the `Package` row by its key. Each is over `Qti`, so a workload of any author role holds them.
 */
export const authorReads = {
  documentScan: paged(documentScan),
  entriesOf,
  packageOf: Qti.relations.Package,
} as const;

/**
 * Build the author application's two workloads over an author role: {@link authorReads}, and
 * {@link importWrite}. {@link AuthorApp} holds them over {@link Author}, and `MediaAuthorApp` of
 * `#pantry/qti/media.ts` the same two over its role over `QtiMedia`. Every program is over `Qti`,
 * so each login serves the same members.
 *
 * @param _qti - `Qti`, which every program is over.
 * @param author - The author role, {@link Author} or a role of the same entries over `Qti`.
 * @returns The workloads, in the login's order.
 */
export const authorWorkloadsOf = (_qti: QtiSchema, author: AuthorRole) =>
  [workload(author, authorReads), workload(author, { importWrite })] as const;

/**
 * The author application's login over `Qti`, over its author role (`#pantry/qti/roles.ts`
 * `Author`), with two workloads:
 *
 * - **the export's reads**: one document's ordered scan and a package's record with each entry's
 *   document (`#pantry/export/scan.ts`), each compiled by `grizzle generate` into the login's
 *   served file, its access paths earning their indexes (the W5 amendment's C20), and `packageOf`,
 *   the `Package` row by its key, a key member whose handle's `get` the export reads to refuse an
 *   id no package has and the command line reads back after a commit with no answer, so every read
 *   pantry runs is a member of the workload;
 * - **the import's write program**: {@link importWrite}, every insert an array member. grizzle
 *   compiles a ChangeSet from its Description, which names each insert and none of its rows, so
 *   this is the program every package's import applies to its rows, compiled once into the served
 *   file. Compiling it also guards the refusals of the write program itself: the schema's own
 *   compile already refuses a column or a relation no write fills, and this one refuses an insert
 *   outside the author role (`OutsideRole`) and a stratum no order of its statements keeps every
 *   key at (`UnorderableStratum`).
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it. A login over `Qti` is a login of any installation whose levels include `Qti`, so an
 * application that stacks a level over `Qti` (`#pantry/qti/media.ts`) lists it as it is.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/engine/src/program/names.ts#L61-L76
 */
export const AuthorApp = login(Qti, "author_app", [Author], {
  workload: authorWorkloadsOf(Qti, Author),
});

/**
 * The author application's login, the type of {@link AuthorApp}: the type the runtime serves the
 * login's committed workload as (`#pantry/db/served.ts`), read by `import type` alone.
 */
export type AuthorAppLogin = typeof AuthorApp;

/**
 * {@link AuthorApp}, under the name earlier installs called to build it over their `Qti`: `Qti` is
 * one schema now, so there is one author login over it, which an install's grizzle config lists
 * beside its own logins.
 *
 * @param _qti - `Qti`.
 * @returns {@link AuthorApp} .
 */
export const authorAppOf = (_qti: QtiSchema): AuthorAppLogin => AuthorApp;
