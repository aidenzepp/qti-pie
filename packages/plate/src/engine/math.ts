/**
 * Every operation the engine approximates, in one leaf: the decimal form of a float
 * ({@link shortestDecimal}) and the case folding of a string ({@link foldCase}). Each reads an
 * algorithm the JavaScript engine supplies (its number-to-string conversion, its Unicode case
 * tables), so each is a place where two engines could give different results.
 *
 * No other engine file calls `String` on a number, `toFixed` or `toPrecision`: a family that writes
 * a float calls {@link shortestDecimal}. `p7-07` adds the functions and owns OD-P7-6's remedy for
 * every entry here, should the engines differ. The module imports nothing.
 *
 * @module
 */

/**
 * Write a float in its shortest decimal form: the fewest significant digits that read back as the
 * same double, as `String` writes a number (`1.5`, `100`, `1e+21`, `0.30000000000000004`, and `0`
 * for `-0`).
 *
 * It is the decimal step of the rounding basis and of reading 54's default float form. It
 * delegates to `String` today, so it is exactly what the engine running it writes.
 *
 * @param x The float.
 * @returns Its shortest decimal form.
 */
// oxlint-disable-next-line unicorn/prefer-native-coercion-functions -- `shortestDecimal` names the one float-to-decimal step the engine approximates, so every caller is found in one place and its remedy lands here.
export const shortestDecimal = (x: number): string => String(x);

/**
 * Fold a string's case for a case-insensitive map entry: upper case then lower case, by Unicode's
 * default mappings and independent of locale, so `YORK` and `york`, or `SS` and `ß`, compare
 * equal.
 *
 * @param text The string.
 * @returns Its folded form.
 */
export const foldCase = (text: string): string => text.toUpperCase().toLowerCase();
