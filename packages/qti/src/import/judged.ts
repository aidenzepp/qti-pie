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
 *
 * The value is one the source wrote, or an empty fill for an attribute whose column pattern
 * refuses `""` at commit (the identifier-class members, refused there under their law-mapped
 * rule). A required attribute of a free-text column never reaches the cast absent, because
 * `requiredAttribute` (`#qti/import/required.ts`) refused it first. The one empty fill left in a
 * free-text column is a `picture`'s `source/@src`, which the export omits.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
export const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the value is the source's own, or an empty fill only where the column's pattern refuses "" at commit; the one free-text fill is a picture's source/@src, and the pattern judges every other value at commit (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;
