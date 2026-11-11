/**
 * The host's text splits: every lexical form the import writes in pieces is cut here, since no
 * grizzle `Compute` term splits a text (no substring, split or pattern group at the vendored
 * commit; grizzle's Q7). Each overlay writes the pieces as fields beside the form, and its
 * `E1_derived` proves they concatenate to it, so a wrong split is refused, never stored.
 *
 * Four splits, each written once:
 *
 * - {@link piecesOf}: a form around its collapsed value, `lead ‖ value ‖ trail` (identifiers, IDs,
 *   LOM entries, test tokens, a reference's outer whitespace, a bare processing reference);
 * - {@link tokensOf}: a whitespace-separated list, each token with the whitespace before it (IDREFS,
 *   `headers`, `tolerance`, an IDREF or IDREFS text);
 * - {@link itemsOf}: a two-item map key around its one whitespace character;
 * - {@link hrefPiecesOf}: an href's path and its query or fragment.
 */
import type { Addition } from "@bjornpagen/grizzle";
import type { Qti } from "#pantry/qti/schema.ts";

// GRIZZLE-PENDING: Q7: a total Compute text split (substring, pattern group or k-th token) generates each piece from its form, and this module goes.

/**
 * XML whitespace `S`, possibly none, as the schema's one `Space` type holds every lead, trail and
 * token affix (`#pantry/qti/attributes.ts`).
 */
export type Space = Addition<(typeof Qti)["relations"]["Idref"]>["before"];

/**
 * The whitespace between a point's or a pair's two items, as `Gap` types it.
 */
type Gap = Addition<(typeof Qti)["relations"]["MapKeyItems"]>["gap"];

/**
 * An href's `params` piece, as `ResourceHref` and `Reference` type it: empty, or from a `?` or `#`.
 */
type Params = Addition<(typeof Qti)["relations"]["Reference"]>["params"];

/**
 * The XML whitespace characters (XML 1.0, production 3, `S`).
 */
const spaceCharacters: ReadonlySet<string> = new Set(["\t", "\n", "\r", " "]);

/**
 * State that a text is XML whitespace, possibly none, the language of {@link Space}.
 *
 * @param text - The text.
 * @returns Whether every character is a tab, a line feed, a carriage return or a space.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * Hold a run a split cut at whitespace to {@link Space}.
 *
 * @param text - The run.
 * @returns The run.
 * @throws {Error} When it holds a character that is no XML whitespace, which no split here cuts:
 *   a defect of the split, never of the document.
 */
const spaceOf = (text: string): Space => {
  if (isSpace(text)) {
    return text;
  }

  throw new Error(
    `A split cut ${JSON.stringify(text)} as XML whitespace, and it holds another character. Cut each piece of #pantry/import/pieces.ts at the whitespace it counts.`,
  );
};

/**
 * A form split around its collapsed value: the whitespace before it, the rest with no whitespace
 * at either end, and the whitespace after it.
 */
export interface Pieces {
  readonly lead: Space;
  readonly trail: Space;
  readonly value: string;
}

/**
 * Split a form around its value, as XML Schema's `collapse` strips its ends (Part 2, §4.3.6): the
 * whitespace before its first character that is not whitespace, the value up to and including
 * its last, and the rest. A form of whitespace alone is all lead, its value empty. Each whitespace
 * character is one UTF-16 unit, so the bounds are read by unit.
 *
 * @param text - The form, as written.
 * @returns Its pieces, which concatenate to it.
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const piecesOf = (text: string): Pieces => {
  let start = 0;
  while (start < text.length && spaceCharacters.has(text.charAt(start))) {
    start += 1;
  }

  let end = text.length;
  while (end > start && spaceCharacters.has(text.charAt(end - 1))) {
    end -= 1;
  }

  return {
    lead: spaceOf(text.slice(0, start)),
    trail: spaceOf(text.slice(end)),
    value: text.slice(start, end),
  };
};

/**
 * One token of a whitespace-separated list, with the whitespace written before it, and after it
 * where it is the last.
 */
export interface Token {
  readonly after: Space;
  readonly before: Space;
  readonly token: string;
}

/**
 * Split a whitespace-separated list into its tokens, each a maximal run of no whitespace with the
 * whitespace written before it, and the last with the whitespace after it, so the pieces
 * concatenate to the list and every token but the first follows whitespace (`E1_derived` on
 * `Idref`, `HeaderToken`, `ToleranceToken` and `TextIdref`).
 *
 * @param text - The list, as written.
 * @returns Its tokens, in order; none for a list of whitespace alone.
 */
export const tokensOf = (text: string): readonly Token[] => {
  const runs = [...text.matchAll(/[^\t\n\r ]+/gu)];

  return runs.map((run, at): Token => {
    const previous = runs[at - 1];
    const from = previous === undefined ? 0 : previous.index + previous[0].length;
    const to = run.index + run[0].length;

    return {
      after: spaceOf(at === runs.length - 1 ? text.slice(to) : ""),
      before: spaceOf(text.slice(from, run.index)),
      token: run[0],
    };
  });
};

/**
 * A two-item key's split, as `twoItemPattern` (`#pantry/qti/mapping.ts`) reads the key: its first
 * run of characters holding no XML whitespace, the one whitespace character after it, and its
 * second run.
 */
const twoItems = /^(?<first>[^\t\n\r ]+)(?<gap>[\t\n\r ])(?<second>[^\t\n\r ]+)$/u;

/**
 * Whether a text is one XML whitespace character, the language of `Gap`.
 *
 * @param text - The text, none where the split did not match.
 * @returns Whether it is one space, tab or line end.
 */
const isGap = (text: string | undefined): text is Gap =>
  text === " " || text === "\t" || text === "\n" || text === "\r";

/**
 * Split a two-item key around the one whitespace character between its items. Every value read
 * from the items is the database's (`#pantry/qti/queries.ts` `MapKeyPoint`, `MapKeyPair` and
 * `MapKeyDirectedPair`), and `E1_derived` proves the split spells the key.
 *
 * @param key - The key.
 * @returns Its first run, the whitespace and its second run, or none for a key that is not two
 *   runs around one whitespace character, the keys `twoItemPattern` leaves out.
 */
export const itemsOf = (
  key: string,
): { readonly first: string; readonly gap: Gap; readonly second: string } | undefined => {
  const groups = twoItems.exec(key)?.groups;
  const first = groups?.["first"];
  const gap = groups?.["gap"];
  const second = groups?.["second"];

  return first === undefined || !isGap(gap) || second === undefined
    ? undefined
    : { first, gap, second };
};

/**
 * An href's two written pieces (reading 102), `href = path ‖ params`.
 */
export interface HrefPieces {
  readonly params: Params;
  readonly path: string;
}

/**
 * State that a text is an href's `params` piece.
 *
 * @param text - The text.
 * @returns Whether it is empty or starts with `?` or `#`.
 */
const isParams = (text: string): text is Params =>
  text === "" || text.startsWith("?") || text.startsWith("#");

/**
 * Hold a piece the split cut as an href's `params` to its type.
 *
 * @param text - The piece: empty, or from the href's first `?` or `#`.
 * @returns The piece.
 * @throws {Error} When it is neither, which the split never cuts.
 */
const paramsOf = (text: string): Params => {
  if (isParams(text)) {
    return text;
  }

  throw new Error(
    `The href split cut ${JSON.stringify(text)} as params, which start at a "?" or "#". Correct hrefPiecesOf.`,
  );
};

/**
 * Split an href into its two written pieces (reading 102): `path`, up to its first `?` or `#`, and
 * `params`, the query or fragment from there, so `href = path ‖ params`.
 *
 * @param href - The href, as written.
 * @returns Its pieces.
 */
export const hrefPiecesOf = (href: string): HrefPieces => {
  const at = href.search(/[?#]/u);

  return at === -1
    ? { params: "", path: href }
    : { params: paramsOf(href.slice(at)), path: href.slice(0, at) };
};
