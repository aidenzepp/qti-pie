/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload, built over the `Qti` schema value it is
 * handed.
 *
 * The import's write program is declared with no rows, so that grizzle compiles it wherever it
 * compiles a workload: `grizzle generate`, which writes the compiled login as the served file
 * `migrations/qti/served/author_app.json`, and `grizzle check`, which compiles it again and holds
 * the file to it. A schema whose writes cannot compile then fails there, never at the first
 * import (R87, whose `BranchResolution.instanceEnd` made every import's ChangeSet refuse once a
 * migrated schema ran it). The runtime serves that file and compiles nothing
 * (`#pantry/db/served.ts`). The declared program carries no package: it names each insert and none
 * of its rows, so every import applies the served `importWrite` member to its own package's facts
 * (`packageFactsOf` of `#pantry/import/write.ts`; the W5 amendment's C19).
 */
import { insertableNamesOf, login, workload } from "@bjornpagen/grizzle";
import { Function as Fn, pipe, Record as Rec, Struct } from "effect";
import { authorReadsOf } from "#pantry/export/scan.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { authorRole } from "#pantry/qti/roles.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build a package's inputs with no row over a `Qti` schema: each relation an import writes,
 * grizzle's `insertableNamesOf`, with its empty keyed set. It reads the schema only when called, so
 * loading this module builds none.
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
 * Build the author application's two workloads over a `Qti` schema, both over its author role
 * (`#pantry/qti/roles.ts` `authorRole`):
 *
 * - **the export's reads**: one document's ordered scan, which the export pages, the documents of a
 *   package, a package's record, the `Package` row by its key, and the listing queries an app
 *   pages, `packages` and `documents` (`#pantry/export/scan.ts` `authorReadsOf`), each compiled
 *   once when the login's `DbLayer` is built, its access paths earning their indexes (the W5
 *   amendment's C20);
 * - **the import's write program**: `changeSetOf`'s ChangeSet with no rows, the member `importWrite`.
 *   grizzle compiles a ChangeSet from its Description, which names each insert and none of its
 *   rows, so this is the program every package's import applies, compiled once into the served
 *   file. Compiling it also guards the refusals of the write program itself: the schema's own
 *   compile already refuses a column or a relation no write fills, and this one refuses an insert
 *   outside the author role (`OutsideRole`) and a stratum no order of its statements keeps every
 *   key at (`UnorderableStratum`).
 *
 * Built once per schema value. {@link authorLogin} holds them; a database test's probe login holds
 * them beside members of its own (`#pantry/test/served-members.ts`), over the same author role, so
 * such a test never builds the author login: grizzle puts a role in one login only.
 *
 * @param qti - The `Qti` schema the workloads are over (`#pantry/qti/schema.ts` `qti`).
 * @returns The workloads, in the login's order: the export's reads, then the import's write
 *   program.
 */
export const authorWorkloads = Fn.memoize((qti: QtiSchema) => {
  const author = authorRole(qti);

  return [
    workload(author, authorReadsOf(qti)),
    workload(author, { importWrite: changeSetOf(author, noInputsOf(qti)) }),
  ] as const;
});

/**
 * Build the author application's login over a `Qti` schema, `qti__author_app` where it is
 * installed, over its author role (`#pantry/qti/roles.ts` `authorRole`), with
 * {@link authorWorkloads} as its workload.
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it, named by the level of `Qti` it is over, and its connection's password is that role's
 * (`#pantry/db/connection.ts`). Built once per schema value, so every caller holds the one login
 * over the one author role.
 *
 * @param qti - The `Qti` schema the login is over (`#pantry/qti/schema.ts` `qti`).
 * @returns The login; its `workload` is the export's reads, then the import's write program.
 * @see https://github.com/bjornpagen/grizzle/blob/4b0d45ef2156b9b83d628fdb8c3bdd96dcf7f38a/packages/engine/src/program/names.ts#L61-L76
 */
export const authorLogin = Fn.memoize((qti: QtiSchema) =>
  login(qti, "author_app", [authorRole(qti)], { workload: authorWorkloads(qti) }),
);

/**
 * The author login {@link authorLogin} builds: the login an author-side `DbLayer` serves, and the
 * type its committed served file is read as (`#pantry/db/served.ts`).
 */
export type AuthorLogin = ReturnType<typeof authorLogin>;
