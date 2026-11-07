/**
 * A set field's value as a direct SQL writer sends it, in grizzle's one spelling of a bit string:
 * `X` then whole hex digits, four codes a digit, code 0 the first digit's most significant bit, in
 * the digits `0`-`9` and `A`-`F`. grizzle installs a set over a roster as a `bit(n)` domain whose
 * width is the roster's codes rounded up to whole hex digits, the padding past the last code held
 * at 0 by the domain's CHECK over its `live` constant (grizzle's skill, "setup": "a set's `bit(n)`
 * domain over `live`, n its codes rounded up to whole hex digits"), and bit's input function reads
 * a text that begins with `X` as hex, into a `bit(n)` only at exactly n bits (PostgreSQL's
 * `varbit.c` `bit_in`). grizzle writes a set's parameter text so, and a database test writes it
 * the same way, never as binary.
 */

/**
 * A roster as a set's encoding reads it: its handles in code order.
 */
interface RosterHandles {
  readonly handles: readonly string[];
}

/**
 * The codes one hex digit holds.
 */
const digitCodes = 4;

/**
 * The width of a set over a roster: its codes rounded up to whole hex digits, the `n` of the
 * `bit(n)` domain grizzle installs.
 *
 * @param roster - The roster.
 * @returns The width, in bits.
 */
export const bitsWidth = (roster: RosterHandles): number =>
  Math.ceil(roster.handles.length / digitCodes) * digitCodes;

/**
 * Write a set of a roster's handles as the text a set's column reads: `X` and its hex digits.
 *
 * @param roster - The roster.
 * @param members - The set's handles.
 * @returns The text.
 * @throws {Error} When a member is no handle of the roster, a case that names a set its roster
 *   cannot hold.
 */
export const bitsText = (roster: RosterHandles, members: Iterable<string>): string => {
  const codes = new Set(
    [...members].map((member) => {
      const code = roster.handles.indexOf(member);
      if (code === -1) {
        throw new Error(`${member} is no handle of the roster, so no set of it holds the handle.`);
      }

      return code;
    }),
  );
  const digits = Array.from({ length: bitsWidth(roster) / digitCodes }, (_, digit) =>
    Array.from({ length: digitCodes }, (_unused, bit) =>
      codes.has(digit * digitCodes + bit) ? 2 ** (digitCodes - 1 - bit) : 0,
    ).reduce((sum, value) => sum + value, 0),
  );

  return `X${digits.map((digit) => digit.toString(16).toUpperCase()).join("")}`;
};
