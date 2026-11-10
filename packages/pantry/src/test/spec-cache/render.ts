/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The goal's one recorded command for making the text rendering of a cached HTML specification
 * (aidenzepp/qti-pie#98): the line-keeping tag strip. Every tag becomes one space, each run of
 * spaces and tabs then becomes one space, and the character references are decoded last; nothing
 * else changes, no trim and no newline added or removed, so a document whose tags each stand on one
 * line keeps its line count, and line N of the text is line N of the HTML. A tag that spans lines
 * takes those newlines with it. On every input it accepts it gives the bytes of Python's
 * `re.sub(r"[ \t]+", " ", html.unescape(re.sub(r"<[^>]*>", " ", s)))`, which reproduces the
 * pinned `qti-md-bind/index.txt` byte for byte.
 *
 * The decoding is closed: a named entity outside {@link namedEntities}, or a character reference to
 * a control character, fails with {@link UnknownEntity} rather than render, so a changed input can
 * never be rendered silently differently from the pins made with this command.
 */
import { Result, Schema } from "effect";

/**
 * The named entities the renderer decodes, and the character each stands for: those the cached IMS
 * specifications and XML Schema Part 2 use, and no other.
 */
const namedEntities: ReadonlyMap<string, string> = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["copy", "©"],
  ["gt", ">"],
  ["laquo", "«"],
  ["lt", "<"],
  ["quot", '"'],
  ["raquo", "»"],
]);

/**
 * A tag.
 */
const tag = /<[^>]*>/gu;

/**
 * A run of spaces and tabs.
 */
const blanks = /[ \t]+/gu;

/**
 * A character reference: a named entity, or a decimal or hex character reference, each ended by
 * its `;`. An ampersand that starts none of them stays as it is.
 */
const reference = /&(?:#[0-9]+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);/gu;

/**
 * A tag or a character reference, the tag first, so a reference inside a tag is the tag's and
 * leaves with it, as the strip removes it before the decoding.
 */
const tagOrReference = new RegExp(`${tag.source}|${reference.source}`, "gu");

/**
 * The HTML holds a character reference the renderer does not decode: a named entity outside its
 * table, or a character reference to a control character.
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
 * Decode a character reference.
 *
 * @param entity - A {@link reference} match, from its `&` to its `;`.
 * @returns The character it stands for, or `undefined` for a named entity outside
 *   {@link namedEntities} or a code point that is a control character, a surrogate or past
 *   U+10FFFF.
 */
const characterOf = (entity: string): string | undefined => {
  if (!entity.startsWith("&#")) {
    return namedEntities.get(entity.slice(1, -1));
  }

  const codePoint =
    entity[2] === "x" || entity[2] === "X"
      ? Number.parseInt(entity.slice(3, -1), 16)
      : Number(entity.slice(2, -1));
  const control = codePoint < 0x20 || (codePoint >= 0x7f && codePoint <= 0x9f);
  const surrogate = codePoint >= 0xd8_00 && codePoint <= 0xdf_ff;

  return control || surrogate || codePoint > 0x10_ff_ff
    ? undefined
    : String.fromCodePoint(codePoint);
};

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
    .find(([match]) => !match.startsWith("<") && characterOf(match) === undefined);

  return unknown === undefined
    ? Result.succeed(
        html
          .replaceAll(tag, " ")
          .replaceAll(blanks, " ")
          .replaceAll(reference, (entity) => characterOf(entity) ?? entity),
      )
    : Result.fail(new UnknownEntity({ entity: unknown[0], offset: unknown.index }));
};
