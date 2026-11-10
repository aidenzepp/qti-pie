/**
 * The single-CDN level's origin rule, `CdnOrigin`: every address a player fetches, each field
 * `#pantry/vocab/fetched.ts` declares, starts with the CDN's origin after the leading whitespace
 * and C0 controls the URL Standard strips. An attribute is read under any governor of its kind's
 * type ({@link governorsOf}), every image candidate of a `srcset` is one address
 * ({@link candidatesPattern}), and so is the text of a `qti-file-href`. A value the player would
 * fetch from another host, a relative one, a `data:` one and one written through an entity
 * reference are all refused: only the origin's own text, written out, starts the value. A fetched
 * attribute that keeps an entity reference anywhere is refused too: crust keeps one only where its
 * declaration may sit in the external subset, which it never reads, while a player that reads the
 * subset expands it, so the kept form may hide an off-origin candidate in a `srcset`'s
 * descriptors.
 *
 * The rule is stated at the `Cdn` level (`singleCdn`, `#pantry/levels/cdn.ts`), never as a law of
 * `Qti`: three derived relations over `Qti` select the fetched values, each with the text its
 * pattern reads, and a `CdnOrigin` check over each judges that text. A check over a derived
 * relation is a deferred trigger on each table its query reads, so a `Qti` write meets it at commit
 * and a process over `Qti` alone compiles none of it.
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L1866-L1950
 */
import { check, Compute, derived, query, v } from "@bjornpagen/grizzle";
import { Array as Arr } from "effect";
import { GoverningOf, grammar } from "#pantry/grammar/install.ts";
import { noType } from "#pantry/grammar/xsi.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";
import { fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";
import type { AddressForm } from "#pantry/vocab/fetched.ts";

/**
 * The characters the URL Standard strips before a URL, the C0 controls and the space, as the body
 * of a character class. NUL is left out: no XML document holds it, and grizzle admits no pattern
 * that does.
 *
 * @see {@link https://url.spec.whatwg.org/#c0-control | URL Standard, C0 control}
 */
const leadingStripped = String.raw`\u{1}-\u{20}`;

/**
 * HTML's ASCII whitespace, which separates a `srcset`'s candidates, its URLs and their descriptors,
 * as the body of a character class.
 *
 * @see {@link https://infra.spec.whatwg.org/#ascii-whitespace | Infra Standard, ASCII whitespace}
 */
const htmlSpace = String.raw`\t\n\f\r `;

/**
 * Write an origin as the text a pattern matches literally: its dots escaped, the only operator an
 * origin holds (`CdnOrigin` of `#pantry/levels/cdn.ts`).
 *
 * @param origin - The origin.
 * @returns Its pattern.
 */
const literal = (origin: string): string => origin.replaceAll(".", String.raw`\.`);

/**
 * Write the pattern of an address on the origin: the origin's own text, after the leading C0
 * controls and spaces the URL Standard strips.
 *
 * @param origin - The CDN's origin.
 * @returns The pattern's source, read under the flag `u`.
 */
export const addressPattern = (origin: string): string =>
  `^[${leadingStripped}]*${literal(origin)}`;

/**
 * Write the pattern of a `srcset` whose every image candidate's URL is on the origin, as HTML
 * parses a `srcset`: past the whitespace and commas between candidates, a URL is a run of
 * non-whitespace. A URL that ends in a comma ends its candidate there; any other is followed by its
 * descriptors, up to a comma outside parentheses or the end. Each URL here starts with the origin,
 * so the candidates the player fetches are all the origin's; a candidate with no URL is none.
 *
 * @param origin - The CDN's origin.
 * @returns The pattern's source, read under the flag `u`.
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
export const candidatesPattern = (origin: string): string => {
  const space = `[${htmlSpace}]`;
  const run = `[^${htmlSpace}]`;
  const descriptors = String.raw`(?:[^,(]|\([^)]*\))*(?:\([^)]*)?`;
  const candidate = `${literal(origin)}(?:${run}*,|(?:${run}*[^${htmlSpace},])?(?:${space}${descriptors})?(?:,|$))`;

  return `^(?:[${htmlSpace},]*${candidate})*[${htmlSpace},]*$`;
};

/**
 * Collect the governors an element kind's attributes and text are read under: the kind itself,
 * and every governor whose type is the kind's declared type in some version, as an `xsi:type`
 * naming that type makes it govern an element of another kind (`GoverningOf` of
 * `#pantry/grammar/install.ts`). A kind whose type is anonymous declares none.
 *
 * @param kinds - The element kinds.
 * @returns Their governors, each once.
 */
export const governorsOf = (kinds: readonly string[]): readonly string[] => {
  const types = new Set(
    kinds.flatMap((kind) =>
      grammar.kinds.versions.handles.flatMap((version) => {
        const type = grammar.xsi.declaredType(version, kind);

        return type === noType ? [] : [type];
      }),
    ),
  );

  return Arr.dedupe([
    ...kinds,
    ...grammar.attributes.governor.rows.flatMap(({ governor, governs }) =>
      types.has(governs) ? [governor] : [],
    ),
  ]);
};

/**
 * One fetched attribute name in one address form, with every governor it is fetched under.
 */
interface FetchedName {
  readonly form: AddressForm;
  readonly governors: readonly string[];
  readonly name: (typeof fetchedAttributes)[number]["name"];
}

/**
 * The fetched attributes by name and form, each with the governors of every kind that fetches it.
 */
const fetchedNames: readonly FetchedName[] = Object.values(
  Arr.groupBy(fetchedAttributes, ({ form, name }) => `${form} ${name}`),
).map((rows) => ({
  form: rows[0].form,
  governors: governorsOf(rows.map(({ kind }) => kind)),
  name: rows[0].name,
}));

/**
 * The governors whose text a player fetches.
 */
const textGovernors = governorsOf(fetchedTexts);

/**
 * Select, over a base level, the attributes a player fetches in one address form: each `(node, id)`
 * whose name is one a kind fetches in that form, under a governor of such a kind, with its lexical
 * form as `value` and its count of kept entity references as `entities`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @param form - The address form.
 * @returns The query.
 */
const fetchedAttributesIn = (base: QtiSchema, form: AddressForm) =>
  query(base).rule((r) => {
    const { entities, governs, id, kind, lexical, name, node, version } = v(Attribute, "attribute");
    const { governor } = v(GoverningOf, "governing");

    return r
      .match(Attribute, { entities, governs, id, kind, lexical, name, node, version })
      .match(GoverningOf, { governor, governs, kind, version })
      .where(
        r.or(
          ...fetchedNames
            .filter((fetched) => fetched.form === form)
            .map((fetched) =>
              r.and(r.eq(name, fetched.name), r.inSet(governor, fetched.governors)),
            ),
        ),
      )
      .find({ entities, id, node, value: lexical });
  });

/**
 * Select, over a base level, the elements whose text a player fetches: each node under a governor
 * whose text is fetched, with its string value as `value`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedTextsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governs, id, kind, stringValue, version } = v(Node, "node");
    const { governor } = v(GoverningOf, "governing");

    return r
      .match(Node, { governs, id, kind, stringValue, version })
      .match(GoverningOf, { governor, governs, kind, version })
      .where(r.inSet(governor, textGovernors))
      .find({ id, value: stringValue });
  });

/**
 * Build the origin rule for one base level and origin: the derived relations over the base it
 * judges, by name, and a `CdnOrigin` check over each.
 *
 * - `CdnFetchedAddress`: the fetched attributes read as one address, each held to
 *   {@link addressPattern} and to keep no entity reference;
 * - `CdnFetchedCandidates`: the fetched attributes read as a `srcset`, each held to
 *   {@link candidatesPattern} and to keep no entity reference;
 * - `CdnFetchedText`: the fetched texts, each held to {@link addressPattern}.
 *
 * Each check is a trigger's violation query, and grizzle compiles a match in a query only over a
 * text whose type bounds its bytes within what PostgreSQL's regular expressions read: an
 * attribute's lexical form is bounded so (`regexTextBytes` of `#pantry/qti/limits.ts`), and so is
 * a string value, so each pattern is #55's, matched as it stands.
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @param origin - The origin the CDN serves, as the level's options hold it.
 * @returns The relations and statements the rule adds to the `Cdn` level.
 */
export const cdnOriginRule = (base: QtiSchema, origin: string) => {
  const address = Compute.pattern(addressPattern(origin));
  const candidates = Compute.pattern(candidatesPattern(origin));
  const CdnFetchedAddress = derived("CdnFetchedAddress", fetchedAttributesIn(base, "address"));
  const CdnFetchedCandidates = derived(
    "CdnFetchedCandidates",
    fetchedAttributesIn(base, "candidates"),
  );
  const CdnFetchedText = derived("CdnFetchedText", fetchedTextsOf(base));

  return {
    relations: { CdnFetchedAddress, CdnFetchedCandidates, CdnFetchedText },
    statements: [
      check("CdnOrigin", CdnFetchedAddress, (f) =>
        f.and(f.eq(f.entities, 0n), Compute.matches(f.value, address)),
      ),
      check("CdnOrigin", CdnFetchedCandidates, (f) =>
        f.and(f.eq(f.entities, 0n), Compute.matches(f.value, candidates)),
      ),
      check("CdnOrigin", CdnFetchedText, (f) => Compute.matches(f.value, address)),
    ] as const,
  };
};
