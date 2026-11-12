/**
 * The text of a row's key in a keyed set, which every input of the author login's `importWrite`
 * ChangeSet is keyed by (`#pantry/import/write.ts`), and which the overlay builders and the
 * package's own rows key theirs by alike.
 */

/**
 * The text of a row's key in a keyed set: its key's values, in key order, as one JSON array, so two
 * keys are one text exactly when their values are equal, whatever text a path holds.
 *
 * @param values - The key's values, in the relation's key order.
 * @returns The text.
 */
export const keyTextOf = (...values: readonly (bigint | string)[]): string =>
  JSON.stringify(values.map(String));
