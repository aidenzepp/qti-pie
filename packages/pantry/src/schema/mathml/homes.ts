/**
 * Where each MathML kind's attributes are stored, as data. The attribute-home table
 * (`src/schema/attribute-homes.ts`) is the one the renderer reads, but its source helpers are
 * private and that module imports this one, so a home here is a plain value and that module turns
 * each into a source.
 *
 * A kind's attributes are those the XSD inventory lists for it, in the inventory's (leaf) order.
 * Each has one home:
 *
 * - `{ family }`: the row of that family relation with this node and `attribute = name`. The family
 *   is the one the seeded matrix `MathmlAttributeType` names for the pair.
 * - `{ id: true }`: `HtmlId`'s `id`.
 * - `{ idref: true }`: the `AttributeIdref` tokens of `xref`.
 * - `{ arm, field }`: a column of the kind's own arm (`MathmlMaction.actiontype`).
 *
 * `m:cbytes` renders its content from its text nodes, so its content has no home.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";

import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { familyRelation } from "#pantry/schema/mathml/attributes.ts";
import { MathmlMaction } from "#pantry/schema/mathml/arms.ts";
import { mathmlAttributeType } from "#pantry/schema/seed/mathml-attribute-type.ts";

/**
 * The place one attribute's value is read from.
 */
export type MathmlHomeSource =
  | { readonly arm: AnyRelation; readonly field: string }
  | { readonly family: AnyRelation }
  | { readonly id: true }
  | { readonly idref: true };

/**
 * One attribute of a kind and its home.
 */
export interface MathmlHome {
  readonly home: MathmlHomeSource;
  readonly name: string;
}

/**
 * The matrix's family handle for each `(kind, attribute)` pair, keyed by kind and attribute.
 */
const typeOf = new Map<string, string>(
  mathmlAttributeType.map((row) => [`${row.kind} ${row.attribute}`, row.type]),
);

/**
 * The arm column that holds an attribute instead of a family row, keyed by kind and attribute:
 * `m:maction`'s `actiontype`.
 */
const armColumns: ReadonlyMap<string, MathmlHomeSource> = new Map([
  ["m:maction actiontype", { arm: MathmlMaction, field: "actiontype" }],
]);

/**
 * The home of one attribute of one kind.
 *
 * @param kind - The kind handle.
 * @param name - The attribute name as the XSD spells it.
 * @returns The home.
 */
const homeOf = (kind: string, name: string): MathmlHomeSource => {
  if (name === "id") {
    return { id: true };
  }

  if (name === "xref") {
    return { idref: true };
  }

  const column = armColumns.get(`${kind} ${name}`);
  if (column !== undefined) {
    return column;
  }

  const family = familyRelation.get(typeOf.get(`${kind} ${name}`) ?? "");
  if (family === undefined) {
    throw new Error(`MathML attribute ${kind} ${name} has no family in the matrix`);
  }

  return { family };
};

/**
 * Each MathML kind's attributes with their homes, in the XSD inventory's order, keyed by kind
 * handle.
 */
export const mathmlHomes: Readonly<Record<string, readonly MathmlHome[]>> = Object.fromEntries(
  Object.entries(mathmlInventory).map(([kind, leaf]) => [
    kind,
    leaf.attributes.map((attribute) => ({
      home: homeOf(kind, attribute.name),
      name: attribute.name,
    })),
  ]),
);
