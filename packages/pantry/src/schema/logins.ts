/**
 * The logins that open a connection: the author application, with the export queries and the
 * import program in its workload.
 */
import { login, workload } from "@bjornpagen/grizzle";
import { documentIdsOf, nodesOf, treeOf } from "#pantry/export/queries.ts";
import { importRows } from "#pantry/import/program.ts";
import type { LooseQuery } from "#pantry/export/queries.ts";
import { Qti } from "#pantry/schema/qti.ts";
import { Author } from "#pantry/schema/roles.ts";

/**
 * A query the run-time view of the builder made, as the query a workload takes.
 */
// SAFETY: a query value is the same value under either type; the run-time view leaves out only the static heading.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const asProgram = (loose: LooseQuery) => loose as unknown as typeof documentIdsOf;

/**
 * The export queries (the documents of a package, the `Tree` row with its fidelity rows, and the
 * nodes of a tree with everything they own) and the import program.
 */
export const authorWork = workload(Author, {
  documentIdsOf,
  importRows,
  nodesOf: asProgram(nodesOf),
  treeOf: asProgram(treeOf),
});

export const AuthorApp = login(Qti, "author_app", [Author], { workload: [authorWork] });
