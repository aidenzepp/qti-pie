/**
 * The HTML overlays' rows (spec reading 126, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every relation `#pantry/qti/html.ts`
 * declares, each a keyed set.
 *
 * The rows restate what the tree says and nothing else: each table cell's `headers` as written,
 * split into its tokens; each `th`'s `id` that is an NCName, its value as `DocumentId` holds it;
 * and each element on the way from those cells up to the table they take part in. The database
 * proves every one of them (`htmlLaws`), so a row this builder gets wrong is refused, never
 * accepted. Readings 124 and 125 read `Node` and `Attribute` alone, so they have no rows here.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { namedBy } from "#pantry/import/names.ts";
import { tokensOf } from "#pantry/import/pieces.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeId, NodeRow } from "#pantry/model/xdm.ts";
import type { CellHeaders, HeaderToken, TableHeader, TableScope } from "#pantry/qti/html.ts";
import { cellKinds } from "#pantry/vocab/terms/html.ts";

/**
 * One token of a cell's `headers` as its cell's family nests it: without the `node` the nesting
 * supplies, nor the `at` the family draws.
 */
type HeaderTokenInsert = Omit<Addition<typeof HeaderToken>, "node">;

/**
 * A cell's `headers`, with its tokens nested at its count field.
 */
type CellHeadersRow = Addition<typeof CellHeaders> & {
  readonly tokens: readonly HeaderTokenInsert[];
};

/**
 * A document's HTML rows, one keyed set per relation: each map from the text of a row's key, its
 * node's id, to the row as its writer writes it.
 */
export interface HtmlRows {
  readonly CellHeaders: ReadonlyMap<string, CellHeadersRow>;
  readonly TableHeader: ReadonlyMap<string, Addition<typeof TableHeader>>;
  readonly TableScope: ReadonlyMap<string, Addition<typeof TableScope>>;
}

/**
 * The table cell kinds, whose `headers` reading 126 reads.
 */
const cells: ReadonlySet<string> = new Set(cellKinds);

/**
 * The walk from a cell up to the table it takes part in, the cell first, and the table it ends at:
 * a `table`, or the document node where no `table` holds the cell.
 */
interface TableWalk {
  readonly table: NodeId;
  readonly walk: readonly NodeRow<Composed>[];
}

/**
 * Walk from an element up to its nearest `table`: the element, then each parent, ending at the
 * first `table` or at the document's root.
 *
 * @param byId - The document's nodes by id.
 * @param document - The document node.
 * @param element - The element.
 * @returns The walk, the element first, and its table.
 * @throws {Error} When an element on the walk has a parent that is neither the document node nor
 *   one of the document's nodes, which `flatten` rules out: a defect of the caller, never of the
 *   document.
 */
const tableWalkOf = (
  byId: ReadonlyMap<NodeId, NodeRow<Composed>>,
  document: NodeId,
  element: NodeRow<Composed>,
): TableWalk => {
  const walk: NodeRow<Composed>[] = [];
  for (let at = element; ;) {
    walk.push(at);
    if (at.kind === "table") {
      return { table: at.id, walk };
    }

    if (at.parent === document) {
      return { table: document, walk };
    }

    const parent = byId.get(at.parent);
    if (parent === undefined) {
      throw new Error(
        `Node ${at.id}'s parent ${at.parent} is not among its document's nodes, but flatten writes every parent. Walk the rows of the document the node is flattened in.`,
      );
    }

    at = parent;
  }
};

/**
 * Build a document's HTML rows.
 *
 * Each cell that writes `headers` has its {@link CellHeadersRow}, and each `th` that writes an `id`
 * whose value names something ({@link namedBy}) its `TableHeader`, the ID's value its lexical form
 * with its outer whitespace set apart, as `DocumentId` holds it; any other `id` names no header
 * (spec reading 156). Each element on the walk up from either to its nearest `table` has its
 * `TableScope`. A text past `keyText`'s bound keeps its row, which `keyText` refuses under "Key
 * text bound". A document with no such cell gives no row.
 *
 * The NCName test decides whether a `TableHeader` row exists, so it stays until the relation is a
 * query over its source, `headerIds` in `#pantry/qti/html.ts` (the constraint-engine plan's B9, at
 * the grizzle cutover). Writing a row for every `th`'s `id` instead breaks the reading. The row's
 * copy back into `namingIdAttributes` and `DocumentId` ("E1 derived") would refuse it beside the
 * value domain that reading 156 says refuses the `id` alone. And a cell's `headers` token naming
 * that `id` would find the row and hold "Table headers", which the reading says refuses it.
 * `documentIdOf` (`#pantry/import/overlays/identity.ts`) keeps the same test for the reading's
 * other half.
 *
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @returns Every HTML relation's rows.
 */
export const rowsOf = (view: DocumentView): HtmlRows => {
  const { folds, rows } = view;
  const document = rows.document.node;
  const lexicals = new Map(rows.attributes.map((row) => [`${row.node} ${row.name}`, row.lexical]));
  const valueOf = (node: NodeRow<Composed>, name: string): string | undefined =>
    lexicals.get(`${node.id} ${name}`);
  const scopes = new Map<string, Addition<typeof TableScope>>();
  const headers = new Map<string, CellHeadersRow>();
  const headerIds = new Map<string, Addition<typeof TableHeader>>();
  const cellNodes = rows.nodes.filter(({ kind }) => cells.has(kind));
  if (cellNodes.length === 0) {
    return { CellHeaders: headers, TableHeader: headerIds, TableScope: scopes };
  }

  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const tableOf = (cell: NodeRow<Composed>): NodeId => {
    const { table, walk } = tableWalkOf(byId, document, cell);
    for (const node of walk) {
      scopes.set(node.id, {
        document,
        kind: node.kind,
        nearest: foldAt(folds, node.id).nearest,
        node: node.id,
        parent: node.parent,
        start: node.start,
        table,
        version: node.version,
      });
    }

    return table;
  };

  for (const cell of cellNodes) {
    const lexical = valueOf(cell, "headers");
    if (lexical !== undefined) {
      headers.set(cell.id, {
        lexical,
        node: cell.id,
        table: tableOf(cell),
        tokens: tokensOf(lexical),
      });
    }

    const id = cell.kind === "th" ? valueOf(cell, "id") : undefined;
    for (const value of id === undefined ? [] : Option.toArray(namedBy(id))) {
      headerIds.set(cell.id, {
        document,
        id: value,
        node: cell.id,
        owner: cell.id,
        table: tableOf(cell),
      });
    }
  }

  return { CellHeaders: headers, TableHeader: headerIds, TableScope: scopes };
};
