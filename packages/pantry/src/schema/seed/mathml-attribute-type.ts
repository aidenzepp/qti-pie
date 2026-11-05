/**
 * The type each MathML `(kind, attribute)` pair takes: the seed of `MathmlAttributeType`.
 */
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { families } from "#pantry/schema/mathml/values.ts";

/**
 * One pair's home: the kind, the attribute and the `MathmlValueType` handle of the one family that
 * holds the attribute's values. The fields are strings until the handles exist to narrow them.
 */
export interface MathmlAttributeTypeRow {
  readonly attribute: string;
  readonly kind: string;
  readonly type: string;
}

/**
 * Each kind's position in the XSD inventory, the order the rows follow.
 */
const kindOrder: ReadonlyMap<string, number> = new Map(
  Object.keys(mathmlInventory).map((kind, index) => [kind, index]),
);

/**
 * The seed rows of `MathmlAttributeType`, one per pair of the 67 families (1,484 in all), derived
 * at load from `families` and ordered by kind in the inventory's order, then by attribute name.
 * `id`, `xref` and `m:maction/@actiontype` have no row: they belong to no family.
 */
export const mathmlAttributeType: readonly MathmlAttributeTypeRow[] = families
  .flatMap((family) =>
    family.pairs.map(([kind, attribute]) => ({ attribute, kind, type: family.handle })),
  )
  .toSorted(
    (a, b) =>
      (kindOrder.get(a.kind) ?? Number.POSITIVE_INFINITY) -
        (kindOrder.get(b.kind) ?? Number.POSITIVE_INFINITY) ||
      Number(a.attribute > b.attribute) - Number(a.attribute < b.attribute),
  );
