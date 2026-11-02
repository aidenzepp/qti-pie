/**
 * The logins that open a connection: the author application, with the export queries in its
 * workload.
 *
 * The import is not a program of the workload. One `ChangeSet` over `Author` with a relation
 * parameter for each of the relations the author role writes compiles to a statement larger than a
 * program may hold: 1,608,527 bytes against the 1,048,576 `Db.open` allows, which `grizzle
 * generate` does not check. `importPackage` applies an ad hoc `ChangeSet` instead.
 */
import { login, workload } from "@bjornpagen/grizzle";
import { documentIdsOf, nodeQueries, treeOf } from "#qti/export/queries.ts";
import type { LooseQuery } from "#qti/export/queries.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Author } from "#qti/schema/roles.ts";

/**
 * The name the query of run `run` of a node's attachments runs under in `db.workload`.
 */
export const nodeQueryName = (run: number): string => `nodeQuery${run}`;

/**
 * A query the run-time view of the builder made, as the query a workload takes.
 */
// SAFETY: a query value is the same value under either type; the run-time view leaves out only the static heading.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const asProgram = (loose: LooseQuery) => loose as unknown as typeof documentIdsOf;

/**
 * The export queries: the documents of a package, the `Tree` row with its fidelity rows, and the
 * nodes of a tree, a run of attachments at a time.
 */
export const authorWork = workload(Author, {
  ...Object.fromEntries(
    nodeQueries.map((nodeQuery, run) => [nodeQueryName(run), asProgram(nodeQuery)]),
  ),
  documentIdsOf,
  treeOf: asProgram(treeOf),
});

export const AuthorApp = login(Qti, "author_app", [Author], { workload: [authorWork] });
