/**
 * The type each MathML `(kind, attribute)` pair takes: the seed of `MathmlAttributeType`.
 */
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { MathmlValueType } from "#pantry/schema/content/rosters.ts";
import type { MathmlValueTypeHandle } from "#pantry/schema/content/rosters.ts";
import { families } from "#pantry/schema/mathml/values.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";

/**
 * One pair's home: the kind, the attribute and the `MathmlValueType` handle of the one family that
 * holds the attribute's values. The fields are the roster handles the composed schema declares.
 */
export interface MathmlAttributeTypeRow {
  readonly attribute: AttributeNameHandle;
  readonly kind: NodeKindHandle;
  readonly type: MathmlValueTypeHandle;
}

/**
 * The handle of `roster` that `name` spells, so a row names only a handle its roster declares.
 *
 * @param roster - The handles of the roster.
 * @param name - The text a derived row holds.
 * @returns The handle.
 */
const handleOf = <H extends string>(roster: readonly H[], name: string): H => {
  const found = roster.find((handle) => handle === name);
  if (found === undefined) {
    throw new Error(
      `a MathML attribute type row names "${name}", which its roster does not declare`,
    );
  }

  return found;
};

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
    family.pairs.map(([kind, attribute]) => ({
      attribute: handleOf(AttributeName.handles, attribute),
      kind: handleOf(NodeKind.handles, kind),
      type: handleOf(MathmlValueType.handles, family.handle),
    })),
  )
  .toSorted(
    (a, b) =>
      (kindOrder.get(a.kind) ?? Number.POSITIVE_INFINITY) -
        (kindOrder.get(b.kind) ?? Number.POSITIVE_INFINITY) ||
      Number(a.attribute > b.attribute) - Number(a.attribute < b.attribute),
  );

/**
 * The `MathmlValueType` handle of each `(kind, attribute)` pair, keyed by the kind and the
 * attribute joined with one space: {@link mathmlAttributeType} as a lookup.
 */
export const attributeTypeOf: ReadonlyMap<string, MathmlValueTypeHandle> = new Map(
  mathmlAttributeType.map((row) => [`${row.kind} ${row.attribute}`, row.type]),
);
