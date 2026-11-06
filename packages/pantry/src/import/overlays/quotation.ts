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
import { interactionKinds } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
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
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * its context's; a child of an interaction's is that interaction; every other node's is its
 * parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's own, its context's; itself where none is given.
 * @returns Each node's nearest interaction, by its id.
 */
const nearestOf = (
  nodes: readonly NodeRow<Composed>[],
  rootNearest: NodeId | undefined,
): ReadonlyMap<NodeId, NodeId> => {
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();
  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    const parentKind = kinds.get(node.parent) ?? "";
    nearest.set(
      node.id,
      interactions.has(parentKind) ? node.parent : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

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
  const nearest = nearestOf(rows.nodes, ids.context?.nearest);
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
        nearest: nearest.get(node.id) ?? document,
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
