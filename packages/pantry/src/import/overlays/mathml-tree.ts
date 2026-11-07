/**
 * What the four MathML families' builders read of a document's tree alike (spec reading 2, §C's
 * `rowsOf`): the kinds that are no element, and the attributes an element writes. Each node's
 * nearest interaction (N8) and element counts they read from the host fold
 * (`#pantry/import/fold.ts`).
 */
import { nonElementKinds } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";

/**
 * The kinds that are no element: the document node and character data.
 */
export const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

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
