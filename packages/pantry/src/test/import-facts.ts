/**
 * A database test's planted rows as the author login's one write program takes them: the facts of
 * `importWrite` (`#pantry/qti/logins.ts`), keyed by their op, `insert`, then by relation, every
 * relation an import writes with the rows the test states and none for every other. A law probe of
 * the database tier writes through this program, the import's own, so the database judges the rows
 * it plants as it judges a package's: grizzle's served layer runs no ChangeSet the login's served
 * file does not hold.
 */
import { pipe, Record as Rec } from "effect";
import { writtenRelations } from "#pantry/import/roster.ts";
import type { packageFactsOf } from "#pantry/import/write.ts";

/**
 * The facts of one import: one array of rows under each relation an import writes, as
 * `packageFactsOf` builds them from a package's inputs.
 */
export type PackageFacts = ReturnType<typeof packageFactsOf>;

/**
 * The facts of no row: an empty array under every relation an import writes.
 */
const noFacts = pipe(
  writtenRelations,
  Rec.map(() => []),
);

/**
 * Build the facts of a write that states rows of some relations and none of every other.
 *
 * @param stated - The rows of each relation the write states, by the relation's name.
 * @returns The facts `db.workload.importWrite.apply` takes, under their op.
 */
export const importFacts = (stated: Partial<PackageFacts>) =>
  ({ insert: { ...noFacts, ...stated } }) satisfies { readonly insert: PackageFacts };
