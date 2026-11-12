/**
 * The author application's login, the import's write program and the replace, plain grizzle values
 * over `Qti`: an application's grizzle config lists {@link AuthorApp} beside its own logins, or
 * puts {@link importWrite} and the export's reads (`#pantry/export/scan.ts`) in a workload of a
 * role of its own, a role that writes {@link authorWrites}, and applies {@link replaceWrite} of a
 * package's rows beside its own ChangeSet.
 *
 * The import's write program is declared with no rows: an empty array for each relation an import
 * writes, so each is an array member that takes a package's rows with each call (README,
 * "Reading": `db.workload.<name>`). grizzle compiles it wherever it compiles a workload: `grizzle
 * generate`, which writes the compiled login as the served file
 * (`migrations/qti/served/author_app.json` for this package's own), and `grizzle check`, which
 * compiles it again and holds the file to it. A schema whose writes cannot compile then fails
 * there, never at the first import (R87, whose `BranchResolution.instanceEnd` made every import's
 * ChangeSet refuse once a migrated schema ran it). A process serves that file and compiles nothing:
 * it applies the served `importWrite` member to each package's rows (`importRowsOf` of
 * `#pantry/import/program.ts`; the W5 amendment's C19).
 */
import { ChangeSet, insertableNamesOf, login, paged, workload } from "@bjornpagen/grizzle";
import { pipe, Record as Rec, Struct } from "effect";
import { documentScan, entriesOf } from "#pantry/export/scan.ts";
import type { ImportRows } from "#pantry/import/program.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The import's write program: one ChangeSet step over `Qti`, each relation an import writes
 * (grizzle's `insertableNamesOf`) inserted once by its key with no row (`insertAll`, which types
 * and checks each key's rows as that relation's own insert), every owner in the same stratum as its
 * whole family (the W5 amendment's A, C19). A ChangeSet is canonical, its members sorted by
 * relation, so the order of the inserts is no part of it. Each import applies it to its own
 * package's rows, `db.workload.importWrite.apply({ insert: rows }, {})`, the rows `importRowsOf`
 * builds (`#pantry/import/program.ts`).
 *
 * Every row is keyed by the package's own identity, its manifest identifier and the paths and
 * positions in it, so the same package applied again is grizzle's `no-change`, and a different
 * package under a stored identifier is `invariant-rejected` on a key it shares with the stored one.
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
 * The replace of one package: the package's rows as `importRowsOf` of `#pantry/import/program.ts`
 * builds them, written over the rows stored under its manifest identifier as a set difference, one
 * ChangeSet: one delete of each top relation's rows of the package (`deletedBy` of
 * `#pantry/import/roster.ts`, each selected by a query on `package`), then the inserts of the new
 * rows, which grizzle plans together. A stored fact the new rows lack is deleted, a new fact the
 * stored rows lack is inserted, and a fact both hold is left as it is, so a replace by the same
 * bytes is `no-change`, and a replace under an identifier no package holds is the package's import.
 * Every relation of `Qti` is immutable, so a fact whose key both hold with other fields is deleted
 * and inserted again, never updated.
 *
 * An application that writes rows of its own in the same transaction, under one login, applies the
 * union of this and its own ChangeSet (`ChangeSet.union(replaceWrite(rows), its own)`), through a
 * role that writes {@link authorWrites}.
 *
 * @param rows - The package's rows.
 * @returns The ChangeSet.
 */
// GRIZZLE-PENDING(WHOLEDEL): a delete whose facts a query selects, a tree's by its root and a
// family's members with their owner, planned with the inserts as one set difference. At 6fcc10c0 a
// tree's row is no delete's (`EditOf`, `types/changeset/changeset.ts:481-489`) and a delete takes
// no member's nested rows, so until it lands the body is the inserts alone: new facts the stored
// rows lack, so the same bytes are `no-change` and a changed package under a stored identifier is
// refused on a key. Then each name of `deletedBy` adds its delete, selected by `package`.
export const replaceWrite = (rows: ImportRows) => ChangeSet.empty(Qti).insertAll(rows.insert);

/**
 * The relations the author role writes, by name ({@link Author}): every stored relation of `Qti`,
 * each inserted into and deleted from, none updated. An application whose own role over its level
 * writes content beside rows of its own, in one transaction and under one login
 * ({@link replaceWrite}), lists these in its role's write list beside its own relations.
 */
export const authorWrites = Author.write;

/**
 * The export's reads, as the author login's first workload holds them: one document's ordered scan
 * and a package's entries with each entry's document (`#pantry/export/scan.ts`), and `packageOf`,
 * the `Package` row by its key, its manifest identifier. Each is over `Qti`, so a workload of any
 * author role holds them.
 */
export const authorReads = {
  documentScan: paged(documentScan),
  entriesOf,
  packageOf: Qti.relations.Package,
} as const;

/**
 * The author application's login over `Qti`, over its author role (`#pantry/qti/roles.ts`
 * `Author`), with two workloads:
 *
 * - **the export's reads** ({@link authorReads}): one document's ordered scan and a package's entries
 *   with each entry's document, each compiled by `grizzle generate` into the login's served file,
 *   its access paths earning their indexes (the W5 amendment's C20), and `packageOf`, the `Package`
 *   row by its manifest identifier, a key member whose handle's `get` the export reads to refuse an
 *   identifier no package has and the import reads back after a commit with no answer, so every
 *   read pantry runs is a member of the workload;
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
// GRIZZLE-PENDING(WHOLEDEL): {@link replaceWrite} is a function of a package's rows, and a function
// is no workload member; once grizzle's set-difference replace has a rowless, served form, it joins
// `importWrite` in the write workload.
export const AuthorApp = login(Qti, "author_app", [Author], {
  workload: [workload(Author, authorReads), workload(Author, { importWrite })],
});

/**
 * The author application's login, the type of {@link AuthorApp}: the type the runtime serves the
 * login's committed workload as (`#pantry/db/served.ts`), read by `import type` alone.
 */
export type AuthorAppLogin = typeof AuthorApp;
