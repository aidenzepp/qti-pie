/**
 * The `AttributeAdmission` seed: which attribute names each node kind may carry.
 *
 * The rows are a pure function of the registries, one row per attribute of every registry row,
 * element-specific, family and ARIA names alike, so the seed composition passes the one composed
 * registry list and no second spread of the kinds files exists. This module imports nothing from
 * `node.ts`: the roster composition reads the kinds files, and the seed must not read the roster.
 */

/**
 * What the seed needs of a kinds file's registry: each kind's attribute names.
 */
export type RegistryLike = Readonly<Record<string, { readonly attributes: readonly string[] }>>;

/**
 * One attribute name a node kind may carry.
 */
export interface AttributeAdmissionRow {
  readonly attribute: string;
  readonly kind: string;
}

const compare = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * The attribute admission rows of the registries, deduplicated on (kind, attribute) and sorted by
 * kind, then attribute.
 */
export const attributeAdmissionRows = (
  registries: readonly RegistryLike[],
): readonly AttributeAdmissionRow[] => {
  const unique = new Map<string, AttributeAdmissionRow>();
  for (const registry of registries) {
    for (const [kind, row] of Object.entries(registry)) {
      for (const attribute of row.attributes) {
        unique.set(`${kind}\u0000${attribute}`, { attribute, kind });
      }
    }
  }

  return [...unique.values()].toSorted(
    (left, right) => compare(left.kind, right.kind) || compare(left.attribute, right.attribute),
  );
};
