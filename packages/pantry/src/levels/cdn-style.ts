/**
 * The single-CDN level's style rule, `CdnStyle`: no `style` attribute holds CSS that makes the
 * player fetch ({@link styleFetch}), in any case, or a backslash, which begins a CSS escape. A
 * style that keeps an entity reference is refused too: crust keeps one only where its declaration
 * may sit in the external subset, which it never reads, while a player that reads the subset
 * expands it, so the kept form may hide a `url(` the pattern never sees.
 *
 * The rule is stated at the `Cdn` level (`singleCdn`, `#pantry/levels/cdn.ts`), never as a law of
 * `Qti`: a derived relation over `Qti` selects the `style` attributes, each with its lexical form,
 * and a `CdnStyle` check over it judges that form. A check over a derived relation is a deferred
 * trigger on each table its query reads, so a `Qti` write meets it at commit and a process over
 * `Qti` alone compiles none of it.
 *
 * @see {@link https://www.w3.org/TR/xml/#included | XML 1.0, included if validating}
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L1866-L1950
 */
import { check, Compute, derived, query, v } from "@bjornpagen/grizzle";
import { Attribute } from "#pantry/qti/attributes.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * A style that makes the player fetch, or could spell a fetch past this pattern, in any case: CSS's
 * `url(`, an `@import`, `image-set(` (`-webkit-image-set(` among them) and `src(`, each of which
 * takes an address as a plain string, and any backslash, which begins a CSS escape, so no escaped
 * spelling such as `\75 rl(` names a function the pattern does not read. Read under the flag `u`.
 *
 * @see {@link https://www.w3.org/TR/css-syntax-3/#consume-escaped-code-point | CSS Syntax 3, consume an escaped code point}
 * @see {@link https://www.w3.org/TR/css-images-4/#image-set-notation | CSS Images 4, image-set()}
 * @see {@link https://www.w3.org/TR/css-values-4/#urls | CSS Values 4, src()}
 */
export const styleFetch = String.raw`[uU][rR][lL]\(|@[iI][mM][pP][oO][rR][tT]|[iI][mM][aA][gG][eE]-[sS][eE][tT]\(|[sS][rR][cC]\(|\\`;

/**
 * Select, over a base level, the `style` attributes: each `(node, id)` with its lexical form as
 * `value` and its count of kept entity references as `entities`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const stylesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { entities, id, lexical, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { entities, id, lexical, name, node })
      .where(r.eq(name, "style"))
      .find({ entities, id, node, value: lexical });
  });

/**
 * Build the style rule for one base level: the derived relation over the base it judges, by name,
 * and a `CdnStyle` check over it.
 *
 * - `CdnStyleAttribute`: the `style` attributes, each held to keep no entity reference and to hold no
 *   text {@link styleFetch} matches.
 *
 * The check is a trigger's violation query, and grizzle compiles a match in a query only over a
 * text whose type bounds its bytes within what PostgreSQL's regular expressions read: an
 * attribute's lexical form is bounded so (`regexTextBytes` of `#pantry/qti/limits.ts`), so the
 * pattern is #55's, matched as it stands.
 *
 * @param base - The level the derived relation reads, pantry's `Qti`.
 * @param _origin - The origin the CDN serves, as the level's options hold it; the rule reads none.
 * @returns The relations and statements the rule adds to the `Cdn` level.
 */
export const cdnStyleRule = (base: QtiSchema, _origin: string) => {
  const fetch = Compute.pattern(styleFetch);
  const CdnStyleAttribute = derived("CdnStyleAttribute", stylesOf(base));

  return {
    relations: { CdnStyleAttribute },
    statements: [
      check("CdnStyle", CdnStyleAttribute, (f) =>
        f.and(f.eq(f.entities, 0n), f.not(Compute.matches(f.value, fetch))),
      ),
    ] as const,
  };
};
