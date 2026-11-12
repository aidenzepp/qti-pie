/**
 * What the four MathML families' builders read of a document's tree alike (spec reading 2, §C's
 * `rowsOf`): where the document stands in its package, the kinds that are no element, and the
 * attributes an element writes. Each node's nearest interaction (N8) and element counts they read
 * from the host fold (`#pantry/import/fold.ts`).
 */
import { nonElementKinds } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows } from "#pantry/model/xdm.ts";

/**
 * Where a document stands in its package, as the MathML builders read it: its package's manifest
 * identifier and its path there, which every row they write holds beside its node's `start`.
 */
export interface MathmlIds {
  readonly package: string;
  readonly path: string;
}

/**
 * The text of a row's key in its relation's keyed set: the document's package and path, then the
 * row's own key fields in key order, as a JSON array, so the rows of two documents never meet at
 * one key.
 *
 * @param ids - The document's place.
 * @param values - The row's own key fields after its package and path.
 * @returns The key text.
 */
export const keyTextOf = (ids: MathmlIds, ...values: readonly (bigint | string)[]): string =>
  JSON.stringify([ids.package, ids.path, ...values.map(String)]);

/**
 * The kinds that are no element: the document node and character data.
 */
export const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * Read the attributes of the given names that each element writes. An element writes a name once
 * (Namespaces in XML 1.0 §6.3), so each element's values are its attributes of those names.
 *
 * @param attributes - A document's attribute rows.
 * @param names - The attribute names to read.
 * @returns Each element's lexical forms, by its `start`.
 */
export const writtenOf = (
  attributes: FlatRows<Composed>["attributes"],
  names: ReadonlySet<string>,
): ReadonlyMap<bigint, ReadonlyMap<string, string>> => {
  const written = new Map<bigint, Map<string, string>>();
  for (const { lexical, name, start } of attributes) {
    if (names.has(name)) {
      const values = written.get(start) ?? new Map<string, string>();
      values.set(name, lexical);
      written.set(start, values);
    }
  }

  return written;
};
