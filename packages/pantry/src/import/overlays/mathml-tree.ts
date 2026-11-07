/**
 * What the four MathML families' builders read of a document's tree alike (spec reading 2, §C's
 * `rowsOf`): the kinds that are no element, the interaction kinds, each node's nearest interaction
 * (N8), and the attributes an element writes.
 */
import { interactionKinds, nonElementKinds } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId, NodeRow } from "#pantry/model/xdm.ts";

/**
 * The kinds that are no element: the document node and character data.
 */
export const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
export const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * its context's, or itself; a child of an interaction's is that interaction; every other node's is
 * its parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's own, its context's; itself where none is given.
 * @returns Each node's nearest interaction, by its id.
 */
export const nearestOf = (
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
 * Read the attributes of the given names that each element writes, the first of each by name.
 *
 * @param attributes - A document's attribute rows.
 * @param names - The attribute names to read.
 * @returns Each element's lexical forms, by its id.
 */
export const writtenOf = (
  attributes: FlatRows<Composed>["attributes"],
  names: ReadonlySet<string>,
): ReadonlyMap<NodeId, ReadonlyMap<string, string>> => {
  const written = new Map<NodeId, Map<string, string>>();
  for (const { lexical, name, node } of attributes) {
    if (names.has(name)) {
      const values = written.get(node) ?? new Map<string, string>();
      if (!values.has(name)) {
        values.set(name, lexical);
      }

      written.set(node, values);
    }
  }

  return written;
};
