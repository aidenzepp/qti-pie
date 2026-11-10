/**
 * The goal's one recorded command for making the text rendering of a cached HTML specification
 * (aidenzepp/qti-pie#98): the line-keeping tag strip. Every tag becomes one space, the character
 * references are decoded, and each run of spaces and tabs then becomes one space, in that order;
 * nothing else changes, no trim and no newline added or removed, so a document whose tags each
 * stand on one line keeps its line count, and line N of the text is line N of the HTML. A tag that
 * spans lines takes those newlines with it. On every input it accepts it gives the bytes of
 * Python's `re.sub(r"[ \t]+", " ", html.unescape(re.sub(r"<[^>]*>", " ", s)))`, which reproduces
 * the pinned renderings byte for byte.
 *
 * Three rules of that formula decide bytes a reader would not expect:
 *
 * 1. The references are decoded before the blanks are collapsed, so a reference to a space (`&#32;`)
 *    joins the run of blanks it stands in.
 * 2. A legacy named reference decodes without its `;` (`&amp b` is `& b`), and a run of name
 *    characters that starts with a legacy name decodes that name and keeps the rest (`&ampx` is
 *    `&x`). A name that HTML5 spells only with its `;`, such as `apos`, stays as written without
 *    it. A decimal or hex reference decodes without its `;` too.
 * 3. A reference to a noncharacter, U+FDD0 to U+FDEF and the last two code points of each plane
 *    (U+FFFE and U+FFFF, U+1FFFE and U+1FFFF, up to U+10FFFF), decodes to nothing.
 *
 * The decoding is closed: a named entity or a legacy name outside {@link namedEntities}, or a
 * character reference to a control character, a surrogate or a value past U+10FFFF, fails with
 * {@link UnknownEntity} rather than render, so a changed input can never be rendered silently
 * differently from the pins made with this command.
 *
 * @see {@link https://github.com/python/cpython/blob/v3.12.3/Lib/html/__init__.py | CPython's html.unescape}
 */
import { Result, Schema } from "effect";

/**
 * The named entities the renderer decodes, and the character each stands for: those the cached IMS
 * specifications and XML Schema Part 2 use, and no other. Of these names `amp`, `copy`, `gt`,
 * `laquo`, `lt`, `nbsp`, `quot` and `raquo` are legacy names, which {@link legacyNames} holds, and
 * `apos` is not.
 */
const namedEntities: ReadonlyMap<string, string> = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["copy", "©"],
  ["gt", ">"],
  ["laquo", "«"],
  ["lt", "<"],
  ["nbsp", "\u{A0}"],
  ["quot", '"'],
  ["raquo", "»"],
]);

/**
 * The 106 legacy named character references of HTML5, the names it accepts without their closing
 * `;`: the keys of Python's `html.entities.html5` that do not end in `;`. The formula decodes a
 * name only when it is one of these or ends in `;`, so this is how the renderer tells a run of name
 * characters the formula decodes from one it leaves, and fails on one outside
 * {@link namedEntities} rather than leave what the formula would decode.
 */
const legacyNames: ReadonlySet<string> = new Set(
  `AElig AMP Aacute Acirc Agrave Aring Atilde Auml COPY Ccedil ETH Eacute Ecirc Egrave Euml GT
  Iacute Icirc Igrave Iuml LT Ntilde Oacute Ocirc Ograve Oslash Otilde Ouml QUOT REG THORN
  Uacute Ucirc Ugrave Uuml Yacute aacute acirc acute aelig agrave amp aring atilde auml brvbar
  ccedil cedil cent copy curren deg divide eacute ecirc egrave eth euml frac12 frac14 frac34 gt
  iacute icirc iexcl igrave iquest iuml laquo lt macr micro middot nbsp not ntilde oacute ocirc
  ograve ordf ordm oslash otilde ouml para plusmn pound quot raquo reg sect shy sup1 sup2 sup3
  szlig thorn times uacute ucirc ugrave uml uuml yacute yen yuml`.split(/\s+/u),
);

/**
 * A tag.
 */
const tag = /<[^>]*>/gu;

/**
 * A run of spaces and tabs.
 */
const blanks = /[ \t]+/gu;

/**
 * A character reference as Python's `html.unescape` finds one: an `&` and a decimal or hex number,
 * or a run of 1 to 32 characters other than tab, line feed, form feed, space, `&`, `#` and `;`,
 * each ended by its `;` when it has one. An ampersand that starts none of them stays as it is.
 */
const reference = /&(?:#[0-9]+;?|#[xX][0-9a-fA-F]+;?|[^\t\n\f <&#;]{1,32};?)/gu;

/**
 * The shape of an HTML5 entity name: a letter, then letters and digits.
 */
const entityName = /^[A-Za-z][A-Za-z0-9]*$/u;

/**
 * A tag or a character reference, the tag first, so a reference inside a tag is the tag's and
 * leaves with it, as the strip removes it before the decoding.
 */
const tagOrReference = new RegExp(`${tag.source}|${reference.source}`, "gu");

/**
 * The HTML holds a character reference the renderer does not decode: a named entity or a legacy
 * name outside its table, or a character reference to a control character, a surrogate or a value
 * past U+10FFFF.
 */
export class UnknownEntity extends Schema.TaggedError<UnknownEntity>()("UnknownEntity", {
  entity: Schema.String,
  offset: Schema.Number,
}) {
  /**
   * The reference, where it stands, and the repair.
   */
  override get message(): string {
    return `The HTML holds ${this.entity} at offset ${this.offset}, which the spec-cache renderer does not decode, so its text rendering would not be the recorded one. Check the source against its pin, and add the entity to the renderer's table only if the pinned rendering decodes it.`;
  }
}

/**
 * Cut the closing `;` off a reference's body.
 *
 * @param body - A {@link reference} match without its `&`.
 * @returns The body without its last character when that is `;`, and the body itself otherwise.
 */
const withoutSemicolon = (body: string): string => (body.endsWith(";") ? body.slice(0, -1) : body);

/**
 * Decode a decimal or hex character reference.
 *
 * @param body - A {@link reference} match from its `#` on, ended by its `;` or not.
 * @returns The character it stands for, the empty string for a noncharacter, or `undefined` for a
 *   code point that is a control character, a surrogate or past U+10FFFF.
 */
const numericOf = (body: string): string | undefined => {
  const hexadecimal = body[1] === "x" || body[1] === "X";
  const digits = withoutSemicolon(body).slice(hexadecimal ? 2 : 1);
  const codePoint = hexadecimal ? Number.parseInt(digits, 16) : Number(digits);
  const control = codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f);
  const surrogate = codePoint >= 0xd8_00 && codePoint <= 0xdf_ff;
  const noncharacter =
    (codePoint >= 0xfd_d0 && codePoint <= 0xfd_ef) || codePoint % 0x1_00_00 >= 0xff_fe;

  if (control || surrogate || codePoint > 0x10_ff_ff) {
    return undefined;
  }

  return noncharacter ? "" : String.fromCodePoint(codePoint);
};

/**
 * Decode a named character reference as `html.unescape` does: a name ended by `;` is looked up
 * whole, a name without one only among the legacy names, and otherwise the longest legacy name of
 * at least two characters that the run starts with decodes and the rest of the run stays.
 *
 * @param body - A {@link reference} match without its `&`, ended by its `;` or not.
 * @returns What the run stands for, the run as written when the formula leaves it, or `undefined`
 *   for a name that {@link namedEntities} does not hold and the formula may decode: a legacy name
 *   with or without its `;`, or a name shaped like an entity name that ends in `;`.
 */
const namedOf = (body: string): string | undefined => {
  const closed = body.endsWith(";");
  const name = withoutSemicolon(body);

  if (closed ? entityName.test(name) : legacyNames.has(name)) {
    return namedEntities.get(name);
  }

  for (let length = body.length - 1; length >= 2; length -= 1) {
    const prefix = body.slice(0, length);

    if (legacyNames.has(prefix)) {
      const character = namedEntities.get(prefix);

      return character === undefined ? undefined : `${character}${body.slice(length)}`;
    }
  }

  return `&${body}`;
};

/**
 * Decode a character reference.
 *
 * @param entity - A {@link reference} match, from its `&` to its last character.
 * @returns The text it stands for, which is the reference itself when the formula leaves it, or
 *   `undefined` for a reference the renderer does not decode: see {@link namedOf} and
 *   {@link numericOf}.
 */
const decodedOf = (entity: string): string | undefined =>
  entity[1] === "#" ? numericOf(entity.slice(1)) : namedOf(entity.slice(1));

/**
 * Render a cached HTML specification as its text, by the goal's one recorded command.
 *
 * @param html - The HTML, as read from the cache.
 * @returns The text rendering, or {@link UnknownEntity} for the first character reference outside
 *   the tags that the renderer does not decode, with its offset in `html`.
 */
export const renderText = (html: string): Result.Result<string, UnknownEntity> => {
  const unknown = html
    .matchAll(tagOrReference)
    .find(([match]) => !match.startsWith("<") && decodedOf(match) === undefined);

  return unknown === undefined
    ? Result.succeed(
        html
          .replaceAll(tag, " ")
          .replaceAll(reference, (entity) => decodedOf(entity) ?? entity)
          .replaceAll(blanks, " "),
      )
    : Result.fail(new UnknownEntity({ entity: unknown[0], offset: unknown.index }));
};
