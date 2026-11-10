/**
 * The markup the writer and the canonical form give alike: an attribute value with its recorded
 * entity references, a comment and a processing instruction.
 *
 * Canonical XML 1.0 section 2.2 escapes an attribute value's `&`, `<`, `"`, TAB, LF and CR, the
 * set the writer escapes too, so a re-read keeps the value; the canonical form writes every other
 * character as itself, the writer each one above its encoder's threshold as a reference.
 *
 * @see {@link https://www.w3.org/TR/2001/REC-xml-c14n-20010315#ProcessingModel | Canonical XML 1.0, section 2.2}
 */
import { codePointOf } from "#crust/charset.ts";
import type { Attribute, Misc } from "#crust/tree.ts";

/**
 * The characters an attribute value always escapes, with the reference each becomes.
 */
const attributeEscapes: ReadonlyMap<string, string> = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  ['"', "&quot;"],
  ["\t", "&#x9;"],
  ["\n", "&#xA;"],
  ["\r", "&#xD;"],
]);

/**
 * Write the numeric character reference to a code point, in upper-case hexadecimal.
 *
 * @param codePoint - The code point.
 * @returns The reference, `&#x...;`.
 */
export const characterReference = (codePoint: number): string =>
  `&#x${codePoint.toString(16).toUpperCase()};`;

/**
 * Escape the text of an attribute value, writing each code point above `threshold` as a character
 * reference.
 *
 * @param value - The text, a lone surrogate counting as one code point.
 * @param threshold - The highest code point written as itself.
 * @returns The escaped text.
 */
const escapeAttribute = (value: string, threshold: number): string => {
  let escaped = "";

  for (const character of value) {
    const codePoint = codePointOf(character);
    escaped +=
      codePoint > threshold
        ? characterReference(codePoint)
        : (attributeEscapes.get(character) ?? character);
  }

  return escaped;
};

/**
 * Write an attribute value: each recorded entity reference as `&name;`, and the text between them
 * escaped.
 *
 * @param attribute - The attribute, its value holding each reference in its lexical form at its
 *   recorded offset.
 * @param threshold - The highest code point written as itself; `Number.POSITIVE_INFINITY` for every
 *   one.
 * @returns The value's markup, without its quotes.
 */
export const attributeValue = (attribute: Attribute, threshold: number): string => {
  let rendered = "";
  let position = 0;

  for (const reference of attribute.references) {
    rendered += escapeAttribute(attribute.value.slice(position, reference.offset), threshold);
    rendered += `&${reference.name};`;
    position = reference.offset + reference.name.length + 2;
  }

  return rendered + escapeAttribute(attribute.value.slice(position), threshold);
};

/**
 * Write a comment or a processing instruction, an instruction's data led by one space only when it
 * has any.
 *
 * @param misc - The comment or instruction.
 * @returns Its markup.
 */
export const miscMarkup = (misc: Misc): string =>
  misc.kind === "comment"
    ? `<!--${misc.text}-->`
    : `<?${misc.target}${misc.data === "" ? "" : ` ${misc.data}`}?>`;
