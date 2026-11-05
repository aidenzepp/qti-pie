/**
 * The whitespace normalizations of XML Schema's `xs:token` family, which every attribute and
 * value pass of the importer applies.
 */

/**
 * How an attribute's lexical value becomes its typed value: kept, with its tab, line feed and
 * carriage return characters turned to spaces, or collapsed like an `xs:token`.
 */
export type WhiteSpace = "preserve" | "replace" | "collapse";

/**
 * Turn each tab, line feed and carriage return into a space.
 *
 * @param s - The lexical value.
 * @returns The value with every such character replaced by one space.
 */
export const replace = (s: string): string => s.replaceAll(/[\t\n\r]/gu, " ");

/**
 * Apply the `xs:token` whitespace collapse: replace, then remove leading and trailing spaces, then
 * make each run of spaces one space.
 *
 * @param s - The lexical value.
 * @returns The collapsed value.
 */
export const collapse = (s: string): string =>
  replace(s).replaceAll(/ +/gu, " ").replaceAll(/^ | $/gu, "");
