/**
 * What the identity and package overlays read of a document's characters alike: each element's
 * string value, as `Node.stringValue` folds it.
 */
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";

/**
 * Compute each element's string value as `Node.stringValue` folds it: its children's characters in
 * order, a text's and whitespace's own, an unexpanded entity reference's `&name;`, a comment's and
 * an instruction's none.
 *
 * @param rows - The document's flat rows.
 * @returns Each parent's string value, by its id; an element with no character child has none.
 */
export const stringValuesOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, string> => {
  const chars = new Map<NodeId, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const values = new Map<NodeId, string>();

  for (const node of rows.nodes) {
    const held = chars.get(node.id);
    if (held !== undefined && node.parent !== node.id) {
      values.set(node.parent, (values.get(node.parent) ?? "") + held);
    }
  }

  return values;
};
