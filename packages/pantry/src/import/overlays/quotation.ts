/**
 * The quotation overlay's rows (spec reading 127, `#pantry/qti/quotation.ts`): from one document's
 * XDM tree and the ids its nodes are written under, one `Quotation` row per `q`, keyed by its node.
 *
 * The rows restate what the tree says and nothing else: each `q`'s node tuple (C18), its slot and
 * child count and its parent's, and the four characters beside and inside it, each the end of its
 * neighbour's own characters as `Node` holds them (`endsOf`). The database proves every one of them
 * (`quotationLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import type { Ends } from "#pantry/model/folds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { Quotation } from "#pantry/qti/quotation.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface QuotationIds {
  /**
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's quotation rows: a keyed set from the text of a row's key, its `q`'s node id, to the
 * row as its writer writes it.
 */
export interface QuotationRows {
  readonly Quotation: ReadonlyMap<string, Addition<typeof Quotation>>;
}

/**
 * Build the quotation overlay's rows of one document: a row for each `q`, with the last character
 * of its sibling before it, the first of its sibling after it, and the first and last of its first
 * and last child, each empty where that node does not exist or holds no characters.
 *
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Its `Quotation` rows, keyed by node.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: QuotationIds): QuotationRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const folds = foldOf(rows.nodes, ids.context ?? ownContext(rows.document.node));
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const chars = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const familyOf = new Map<NodeId, NodeRow<Composed>[]>();
  for (const node of rows.nodes) {
    if (node.id !== document) {
      const family = familyOf.get(node.parent) ?? [];
      family.push(node);
      familyOf.set(node.parent, family);
    }
  }

  const endsAt = (family: readonly NodeRow<Composed>[], at: number): Ends => {
    const member = family[at];

    return endsOf(member === undefined ? "" : (chars.get(member.id) ?? ""));
  };
  const quotations = new Map<string, Addition<typeof Quotation>>();
  for (const node of rows.nodes) {
    if (node.kind === "q") {
      const siblings = familyOf.get(node.parent) ?? [];
      const children = familyOf.get(node.id) ?? [];
      const at = Number(node.at);
      quotations.set(node.id, {
        after: endsAt(siblings, at + 1).first,
        at: node.at,
        before: endsAt(siblings, at - 1).last,
        children: BigInt(children.length),
        document,
        first: endsAt(children, 0).first,
        firstAt: 0n,
        kind: node.kind,
        last: endsAt(children, children.length - 1).last,
        nearest: folds.get(node.id)?.nearest ?? document,
        nextAt: node.at + 1n,
        node: node.id,
        parent: node.parent,
        parentAt: byId.get(node.parent)?.at ?? 0n,
        siblings: BigInt(siblings.length),
        start: node.start,
        version: node.version,
      });
    }
  }

  return { Quotation: quotations };
};
