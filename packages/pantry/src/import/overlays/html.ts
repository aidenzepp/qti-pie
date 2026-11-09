/**
 * The HTML overlays' rows (spec reading 126, §C's `rowsOf`): from one document's XDM tree and the
 * ids its nodes are written under, the rows of every relation `#pantry/qti/html.ts` declares, each
 * a keyed set.
 *
 * The rows restate what the tree says and nothing else: each table cell's `headers` as written,
 * split into its tokens; each `th`'s `id` that is an NCName, its value as `DocumentId` holds it;
 * and each element on the way from those cells up to the table they take part in. The database
 * proves every one of them (`htmlLaws`), so a row this builder gets wrong is refused, never
 * accepted. Readings 124 and 125 read `Node` and `Attribute` alone, so they have no rows here.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { DocumentContext } from "#pantry/import/context.ts";
import { isNcName } from "#pantry/grammar/domains.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { cellKinds } from "#pantry/qti/html.ts";
import type { CellHeaders, HeaderToken, TableHeader, TableScope } from "#pantry/qti/html.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes' and attributes', drawn by
 * the number `flatten` gives it, and the document's context (spec reading 117), whose interaction
 * an included fragment's nodes take as their nearest: `ownContext` of its document node for a
 * document no site names.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface HtmlIds {
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * One token of a cell's `headers` as its cell's family nests it: without the `node` the nesting
 * supplies, nor the `at` the family draws.
 */
export type HeaderTokenInsert = Omit<Addition<typeof HeaderToken>, "node">;

/**
 * A cell's `headers`, with its tokens nested at its count field.
 */
export type CellHeadersRow = Addition<typeof CellHeaders> & {
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
 * The text `HeaderToken.before` and `after` hold: XML whitespace, possibly none.
 */
type Spacing = HeaderTokenInsert["before"];

/**
 * Decide whether a text is XML whitespace, possibly none, the language of {@link Spacing}.
 *
 * @param text - The text, none where a regex group did not take part.
 * @returns Whether it is a text every character of which is a tab, a line feed, a carriage return
 *   or a space.
 */
const isSpacing = (text: string | undefined): text is Spacing =>
  text !== undefined && /^[\t\n\r ]*$/u.test(text);

/**
 * A token of a `headers` value with the whitespace before it: every run the global match takes,
 * each starting where the last ended, so the runs cover the value up to its trailing whitespace.
 */
const tokenRun = /(?<before>[\t\n\r ]*)(?<token>[^\t\n\r ]+)/gu;

/**
 * Split a `headers` value into its tokens, each with the whitespace written before it, and the
 * last with the whitespace after it, so the pieces concatenate to the value and every token but
 * the first follows whitespace (`E1_derived` on `HeaderToken`).
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its pieces, in order; none for a value of whitespace alone, an empty list.
 * @throws {Error} When a run of {@link tokenRun} lacks its `before` or `token` group, or the text
 *   after the last run is no whitespace, which the pattern rules out: a defect of this splitter,
 *   never of the document.
 */
export const headerPiecesOf = (lexical: string): readonly HeaderTokenInsert[] => {
  const runs = [...lexical.matchAll(tokenRun)];
  const tail = runs.reduce((end, run) => end + run[0].length, 0);

  return runs.map((run, at): HeaderTokenInsert => {
    const before = run.groups?.["before"];
    const token = run.groups?.["token"];
    const after = at === runs.length - 1 ? lexical.slice(tail) : "";
    if (!isSpacing(before) || token === undefined || !isSpacing(after)) {
      throw new Error(
        `The headers value ${JSON.stringify(lexical)} split into a run ${JSON.stringify(run[0])} with no whitespace before its token, no token, or no whitespace after it, which the token pattern rules out. Correct headerPiecesOf's pattern.`,
      );
    }

    return { after, before, token };
  });
};

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
 * whose value is an NCName ({@link isNcName}) its `TableHeader`, the ID's value its lexical form
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
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every HTML relation's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: HtmlIds): HtmlRows => {
  const rows = flatten(doc, ids.idOf);
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
  const folds = foldOf(rows.nodes, ids.context);
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
        tokens: headerPiecesOf(lexical),
      });
    }

    const id = cell.kind === "th" ? valueOf(cell, "id") : undefined;
    const value = id?.replace(/^[\t\n\r ]+/u, "").replace(/[\t\n\r ]+$/u, "");
    if (value !== undefined && isNcName(value)) {
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
