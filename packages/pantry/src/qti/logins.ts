/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan and the import's write program as its workload, built over the `Qti` schema value it is
 * handed.
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
import { Function as Fn, Result } from "effect";
import { authorReadsOf } from "#pantry/export/scan.ts";
import { unionsOf } from "#pantry/import/overlays/index.ts";
import { writtenNamesOf } from "#pantry/import/roster.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { authorRole } from "#pantry/qti/roles.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the author application's login over a `Qti` schema, `qti__author_app` where it is
 * installed, over its author role (`#pantry/qti/roles.ts` `authorRole`), with two workloads:
 *
 * - **the export's reads**: one document's ordered scan, which the export pages, the documents of a
 *   package and a package's record (`#pantry/export/scan.ts` `authorReadsOf`), each compiled once
 *   when the login's `DbLayer` is built, its access paths earning their indexes (the W5 amendment's
 *   C20);
 * - **the import's write program**: `changeSetOf`'s ChangeSet with no rows, a package's inputs with
 *   no row being each written relation's empty keyed set, the union of no part, which has no two
 *   rows to conflict. grizzle compiles a ChangeSet from its Description, which names each insert
 *   and none of its rows, so this is the program every package's import compiles. It is declared to
 *   be compiled, never run: the schema's own compile already refuses a column or a relation no
 *   write fills, so compiling it guards the refusals of the write program itself, an insert outside
 *   the author role (`OutsideRole`) and a stratum no order of its statements keeps every key at
 *   (`UnorderableStratum`).
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Built once per schema value, so every caller holds the one login over the one
 * author role.
 *
 * @param qti - The `Qti` schema the login is over (`#pantry/qti/schema.ts` `qti`).
 * @returns The login; its `workload` is the export's reads, then the import's write program.
 */
export const authorLogin = Fn.memoize((qti: QtiSchema) => {
  const author = authorRole(qti);
  const noInputs = Result.getOrThrowWith(
    unionsOf<PackageInputs>(writtenNamesOf(), []),
    (conflict) => conflict,
  );

  return login(qti, "author_app", [author], {
    workload: [
      workload(author, authorReadsOf(qti)),
      workload(author, { importWrite: changeSetOf(author, noInputs) }),
    ],
  });
});

/**
 * The author login {@link authorLogin} builds, the login an author-side `DbLayer` serves.
 */
export type AuthorLogin = ReturnType<typeof authorLogin>;
