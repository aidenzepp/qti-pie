/**
 * What the identity and package overlays read of a document's characters alike: each element's
 * string value, as `Node.stringValue` folds it.
 */
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows } from "#pantry/model/xdm.ts";

/**
 * Compute each element's string value as `Node.stringValue` folds it: its children's characters in
 * order, a text's and whitespace's own, an unexpanded entity reference's `&name;`, a comment's and
 * an instruction's none.
 *
 * @param rows - The document's flat rows.
 * @returns Each parent's string value, by its `start`; an element with no character child has
 * none.
 */
export const stringValuesOf = (rows: FlatRows<Composed>): ReadonlyMap<bigint, string> => {
  const chars = new Map<bigint, string>([
    ...rows.texts.map(({ start, value }) => [start, value] as const),
    ...rows.whitespace.map(({ start, value }) => [start, value] as const),
    ...rows.entityRefs.map(({ name, start }) => [start, `&${name};`] as const),
  ]);
  const values = new Map<bigint, string>();

  for (const node of rows.nodes) {
    const held = chars.get(node.start);
    if (held !== undefined && node.parent !== node.start) {
      values.set(node.parent, (values.get(node.parent) ?? "") + held);
    }
  }

  return values;
};
