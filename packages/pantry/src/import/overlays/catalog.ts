/**
 * The catalog overlays' rows (spec reading R9-a, `#pantry/qti/catalog.ts`): from one document's XDM
 * tree and the ids its nodes are written under, one `CardSupport` row per `qti-card`'s `support`
 * and one `DefaultEntry` row per `qti-card-entry` whose `default` designates it, each keyed by its
 * node.
 *
 * The rows restate what the tree says and nothing else: each row's node tuple (C18), its parent,
 * the attribute as written and that form collapsed. The database proves every one of them
 * (`catalogLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { interactionKinds } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { collapse } from "#pantry/import/overlays/metadata.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { designatingValues } from "#pantry/qti/catalog.ts";
import type { CardSupport, DefaultEntry } from "#pantry/qti/catalog.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, and the document's context (spec reading 117), its own where none is given.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface CatalogIds {
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's catalog rows, one keyed set per relation: each map from the text of a row's key, its
 * node's id, to the row as its writer writes it.
 */
export interface CatalogRows {
  readonly CardSupport: ReadonlyMap<string, Addition<typeof CardSupport>>;
  readonly DefaultEntry: ReadonlyMap<string, Addition<typeof DefaultEntry>>;
}

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The values that designate an entry, collapsed.
 */
const designating: ReadonlySet<string> = new Set(designatingValues);

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

    nearest.set(
      node.id,
      interactions.has(kinds.get(node.parent) ?? "")
        ? node.parent
        : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

/**
 * Build the catalog overlays' rows of one document: a `CardSupport` for each `qti-card` that writes
 * a `support`, and a `DefaultEntry` for each `qti-card-entry` whose `default` collapses to `true`
 * or `1`. A document with no such element gives no row.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Every catalog relation's rows, keyed by node.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: CatalogIds): CatalogRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const nearest = nearestOf(rows.nodes, ids.context?.nearest);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const supports = new Map<string, Addition<typeof CardSupport>>();
  const defaults = new Map<string, Addition<typeof DefaultEntry>>();

  for (const { lexical, name, node: id } of rows.attributes) {
    const node = byId.get(id);
    if (node === undefined) {
      continue;
    }

    const value = collapse(lexical);
    const tuple = {
      document,
      kind: node.kind,
      lexical,
      nearest: nearest.get(id) ?? document,
      node: id,
      start: node.start,
      version: node.version,
    };
    if (node.kind === "qti-card" && name === "support") {
      supports.set(id, { ...tuple, catalog: node.parent, support: value });
    } else if (node.kind === "qti-card-entry" && name === "default" && designating.has(value)) {
      defaults.set(id, { ...tuple, card: node.parent, value });
    }
  }

  return { CardSupport: supports, DefaultEntry: defaults };
};
