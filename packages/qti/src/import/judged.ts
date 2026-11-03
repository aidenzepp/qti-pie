/**
 * The one cast the importer's attribute builders share.
 *
 * @module
 */

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans,
 * lengths, lists, integers and enumerations are template-literal or literal-union types, and the
 * value read is a string until that pattern says it fits, so the cast narrows only the type; a
 * value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
export const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;
