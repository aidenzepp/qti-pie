/**
 * The read half of export: one tree's rows back out of the database.
 *
 * `#pantry/export/queries.ts` builds the queries: one recursive walk of a tree's edges joined to
 * each node's own row, with everything the importer wrote for the node attached to it, and the
 * `Tree` row with the fidelity rows around it. {@link readTree} runs them and reassembles their rows
 * into the `Rows` the importer builds, which `renderTree` renders.
 */
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation, DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Array as Arr, Effect, Option } from "effect";
import { fieldNamesOf, nodeQueries, nodeRuns, treeAttachments } from "#pantry/export/queries.ts";
import type { Attachment } from "#pantry/export/queries.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { AuthorApp, nodeQueryName } from "#pantry/schema/logins.ts";
import { Node, Tree } from "#pantry/schema/node.ts";
import type { Author } from "#pantry/schema/roles.ts";

/**
 * A value a decoded row holds: a column, or the rows an attachment delivers, as an optional row
 * for an arm or an at-most-one child and as an array otherwise.
 */
type Cell = string | bigint | Option.Option<Row> | Row[];

/**
 * A row as the reader decodes it: the head's columns and its attachments under their names.
 */
interface Row {
  readonly [field: string]: Cell;
}

/**
 * An opened database of the run-time view: it runs any query value the builder made and decodes
 * its rows as {@link Row}s.
 */
interface LooseDb {
  readonly workload: Readonly<
    Record<
      string,
      {
        readonly execute: (
          params: Readonly<Record<string, string>>,
        ) => Effect.Effect<
          { readonly collect: Effect.Effect<readonly Row[], ReadError> },
          ReadError
        >;
      }
    >
  >;
}

/**
 * The rows the workload program `name` delivers for the tree `treeId`. A name the workload does not
 * hold is a defect of this module, which names only the programs `#pantry/schema/logins.ts` builds.
 */
const runOf = (db: LooseDb, name: string, treeId: string) =>
  Effect.gen(function* programRows() {
    const program = yield* Effect.fromNullishOr(db.workload[name]).pipe(Effect.orDie);

    return yield* (yield* program.execute({ tree: treeId })).collect;
  });

/**
 * The ids of a package's trees: the manifest's, which is the package id, then every document's.
 */
export const treesOf = Effect.fn("export.treesOf")(function* treesOf(
  packageId: Uuid,
): Effect.fn.Return<readonly Uuid[], OpenError | ReadError, DbLayer<typeof Author>> {
  const db = yield* Db.open(AuthorApp.roles.author, {});
  const documents = yield* (yield* db.workload.documentIdsOf.execute({ package: packageId }))
    .collect;

  return [packageId, ...documents.map((row) => row.id)];
});

/**
 * The fact an attachment's child is of the attachment's relation: its fields with the owner field
 * the parent's id.
 */
const factOf = (child: Row, attached: Attachment, owner: Cell | undefined): Row => ({
  ...child,
  [attached.owner]: owner ?? "",
});

/**
 * The rows an attachment delivered, as a list: an optional child is none or one.
 */
const childrenOf = (delivered: Cell | undefined): readonly Row[] => {
  if (Option.isOption(delivered)) {
    return Option.toArray(delivered);
  }

  return Arr.isArray(delivered) ? delivered : [];
};

/**
 * Add `facts` to `relation`'s rows in `rows`.
 */
const append = (
  rows: Map<AnyRelation, object[]>,
  relation: AnyRelation,
  facts: readonly Row[],
): void => {
  rows.set(relation, [...(rows.get(relation) ?? []), ...facts]);
};

/**
 * Add the facts a query row's attachments delivered to `rows`, under their relations.
 */
const addAttached = (
  rows: Map<AnyRelation, object[]>,
  row: Row,
  attached: readonly Attachment[],
): void => {
  for (const one of attached) {
    append(
      rows,
      one.relation,
      childrenOf(row[one.name]).map((child) => factOf(child, one, row["id"])),
    );
  }
};

/**
 * The columns of `row` named by `fields`, as a fact.
 */
const columns = (row: Row, fields: readonly string[]): Row =>
  Object.fromEntries(fields.map((field): readonly [string, Cell] => [field, row[field] ?? ""]));

/**
 * Read the rows of one tree: its `Tree` row and fidelity rows, then every node's `Node` row, `Edge`
 * and the rows the node owns, as the importer built them.
 *
 * @param packageId - The id of the package the tree belongs to.
 * @param treeId - The id of the tree, which is its root node's id.
 * @returns The tree's rows, which `renderTree` renders back to the tree's document. Fails with the
 *   database's error when it cannot be opened or read.
 */
export const readTree = Effect.fn("export.readTree")(function* readTree(
  packageId: string,
  treeId: string,
): Effect.fn.Return<Rows, OpenError | ReadError, DbLayer<typeof Author>> {
  yield* Effect.annotateCurrentSpan({ packageId, treeId });

  const opened = yield* Db.open(AuthorApp.roles.author, {});
  // SAFETY: an opened `Db` is the database the run-time view describes, which runs any query value the builder made.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same database, so no direct assertion compiles.
  const db = opened as unknown as LooseDb;
  const rows = new Map<AnyRelation, object[]>();

  for (const row of yield* runOf(db, "treeOf", treeId)) {
    append(rows, Tree, [columns(row, fieldNamesOf(Tree))]);
    addAttached(rows, row, treeAttachments);
  }

  for (const index of nodeQueries.keys()) {
    for (const row of yield* runOf(db, nodeQueryName(index), treeId)) {
      if (index === 0) {
        append(rows, Node, [columns(row, fieldNamesOf(Node))]);
      }

      addAttached(rows, row, nodeRuns[index] ?? []);
    }
  }

  return rows;
});
