/**
 * Single-CDN mode: the laws an install's policy adds to `Qti`, so the database refuses media off
 * the install's one origin (`#pantry/db/install.ts` `CdnPolicy`), and pantry's importer states
 * nothing of them. Each is a row check, a CHECK constraint the migration compiles from the policy,
 * so every writer meets it, and a refused import names its law and rule as any other refusal does.
 *
 * - **CDN origin** (rule `cdn-origin`): every address a player fetches, each field
 *   `#pantry/vocab/fetched.ts` declares, starts with the origin after the leading whitespace and C0
 *   controls the URL Standard strips: an attribute read under any governor of its kind's type
 *   ({@link governorsOf}), every image candidate of a `srcset` ({@link candidatesPattern}), and the
 *   text of a `qti-file-href`. A value the player would fetch from another host, a relative one, a
 *   `data:` one and one written through an entity reference are all refused: only the origin's own
 *   text, written out, starts the value.
 * - **CDN data** (rule `cdn-data`): no address uses the `data:` scheme, so no value carries a base64
 *   payload: no admitted attribute and no element text whose domain is an `xs:anyURI`, links and
 *   identifiers included, as the URL Standard reads its scheme ({@link dataScheme}), and no token
 *   of an address list (`xsi:schemaLocation`). A `srcset`'s candidates and a media URL's are
 *   fetched fields, typed `URLDType` rather than `xs:anyURI`, which CDN origin holds to the
 *   origin.
 * - **CDN style** (rule `cdn-style`): no `style` attribute holds `url(`, `@import`, `image-set(` or
 *   `src(`, in any case, or a backslash, which begins a CSS escape ({@link styleFetch}).
 * - **CDN foreign** (rule `cdn-foreign`): no markup pantry keeps but cannot interpret, which could
 *   carry an address no law above reads: no foreign element, of any of the three namespace classes
 *   (`foreignKinds` of `#pantry/grammar/kinds.ts`), and no attribute of an open class but `data-*`,
 *   so no `foreign`, `no-namespace` or `own-namespace` attribute. A `data-*` attribute is kept, as
 *   QTI writes them (`data-catalog-idref`).
 *
 * Every check is named by its law with spaces written as underscores, as every check of the schema
 * is (`#pantry/import/refusal.ts` `checkNameOf`).
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
import { check, Compute } from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import type { CdnPolicy } from "#pantry/db/install.ts";
import { grammar, TextDomain } from "#pantry/grammar/install.ts";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { admitted, Attribute, domainOf } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";
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
 * The ASCII tab and newline the URL Standard removes from anywhere in a URL, as the body of a
 * character class.
 *
 * @see {@link https://url.spec.whatwg.org/#ascii-tab-or-newline | URL Standard, ASCII tab or newline}
 */
const tabOrNewline = String.raw`\t\n\r`;

/**
 * HTML's ASCII whitespace, which separates a `srcset`'s candidates, its URLs and their descriptors,
 * as the body of a character class.
 *
 * @see {@link https://infra.spec.whatwg.org/#ascii-whitespace | Infra Standard, ASCII whitespace}
 */
const htmlSpace = String.raw`\t\n\f\r `;

/**
 * An address that uses the `data:` scheme, as the URL Standard reads a scheme: past the leading C0
 * controls and spaces it strips, the letters `data` in any case, any tab or newline among them
 * removed, and the colon that ends a scheme.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-state | URL Standard, scheme state}
 */
export const dataScheme = `^[${leadingStripped}]*[dD][${tabOrNewline}]*[aA][${tabOrNewline}]*[tT][${tabOrNewline}]*[aA][${tabOrNewline}]*:`;

/**
 * A token of an address list that uses the `data:` scheme: at the list's start or after the
 * whitespace that separates its tokens, which a token never holds.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#atomic-vs-list | XML Schema 1.0 Part 2, §2.5.1.2 List datatypes}
 */
export const dataToken = `(?:^|[${tabOrNewline} ])[${leadingStripped}]*[dD][aA][tT][aA]:`;

/**
 * A style that makes the player fetch, or could spell a fetch past this pattern, in any case: CSS's
 * `url(`, an `@import`, `image-set(` (`-webkit-image-set(` among them) and `src(`, each of which
 * takes an address as a plain string, and any backslash, which begins a CSS escape, so no escaped
 * spelling such as `\75 rl(` names a function the pattern does not read.
 *
 * @see {@link https://www.w3.org/TR/css-syntax-3/#consume-escaped-code-point | CSS Syntax 3, consume an escaped code point}
 * @see {@link https://www.w3.org/TR/css-images-4/#image-set-notation | CSS Images 4, image-set()}
 * @see {@link https://www.w3.org/TR/css-values-4/#urls | CSS Values 4, src()}
 */
export const styleFetch = String.raw`[uU][rR][lL]\(|@[iI][mM][pP][oO][rR][tT]|[iI][mM][aA][gG][eE]-[sS][eE][tT]\(|[sS][rR][cC]\(|\\`;

/**
 * Write an origin as the text a pattern matches literally: its dots escaped, the only operator a
 * policy's origin holds (`#pantry/db/install.ts` `CdnOrigin`).
 *
 * @param origin - The origin.
 * @returns Its pattern.
 */
const literal = (origin: string): string => origin.replaceAll(".", String.raw`\.`);

/**
 * An address on the origin: the origin's own text, after the leading C0 controls and spaces the
 * URL Standard strips.
 *
 * @param origin - The policy's origin.
 * @returns The pattern.
 */
export const addressPattern = (origin: string): string =>
  `^[${leadingStripped}]*${literal(origin)}`;

/**
 * A `srcset` whose every image candidate's URL is on the origin, as HTML parses a `srcset`: past
 * the whitespace and commas between candidates, a URL is a run of non-whitespace. A URL that ends
 * in a comma ends its candidate there; any other is followed by its descriptors, up to a comma
 * outside parentheses or the end. Each URL here starts with the origin, so the candidates the
 * player fetches are all the origin's; a candidate with no URL is none.
 *
 * @param origin - The policy's origin.
 * @returns The pattern.
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
 * The governors an element kind's attributes and text are read under: the kind itself, and every
 * governor whose type is the kind's declared type in some version, as an `xsi:type` naming that
 * type makes it govern an element of another kind (`Governor` of `#pantry/grammar/install.ts`).
 *
 * @param kinds - The element kinds.
 * @returns Their governors, each once.
 */
export const governorsOf = (kinds: readonly string[]): readonly string[] => {
  const types = new Set(
    kinds.flatMap((kind) =>
      grammar.kinds.versions.handles.flatMap((version) =>
        Option.toArray(grammar.xsi.declaredType(version, kind)),
      ),
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
 * The value domains that are an `xs:anyURI`'s: every domain whose primitive is `anyURI`.
 */
const uriDomains = grammar.attributes.valueDomain.rows.flatMap(({ domain, primitive }) =>
  primitive === "anyURI" ? [domain] : [],
);

/**
 * The open attribute classes CDN foreign refuses: every class but `data-*`.
 */
const uninterpretedClasses = openClasses.filter((name) => name !== "data-*");

/**
 * An `Attribute` row as a row check reads it.
 */
type AttributeRow = RowScalars<typeof Attribute>;

/**
 * A `Node` row as a row check reads it.
 */
type NodeRow = RowScalars<typeof Node>;

/**
 * State that an attribute is a fetched field of one address form: its name one a kind fetches in
 * that form, under a governor of such a kind.
 *
 * @param a - The row.
 * @param form - The form.
 * @returns The predicate.
 */
const fetchedAs = (a: AttributeRow, form: AddressForm) =>
  a.or(
    ...fetchedNames
      .filter((fetched) => fetched.form === form)
      .map(({ governors, name }) => a.and(a.eq(a.name, name), a.in(a.governor, governors))),
  );

/**
 * State that an element's text is in an `xs:anyURI` domain: its governor reads its text in a domain
 * (`TextDomain`), and that domain is an `xs:anyURI`'s.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const uriText = (n: NodeRow) =>
  n.and(
    TextDomain.has(n.version, n.governor),
    n.in(TextDomain.at("domain", n.version, n.governor), uriDomains),
  );

/**
 * Build the laws one origin states, by name: the module's header gives each.
 *
 * @param origin - The policy's origin.
 * @returns The statements by law.
 */
const lawsOfOrigin = (origin: string) => {
  const address = addressPattern(origin);
  const candidates = candidatesPattern(origin);

  return {
    "CDN data": [
      check("CDN_data", Attribute, (a) =>
        a.and(
          a.or(
            a.not(admitted(a)),
            a.not(a.in(domainOf(a), uriDomains)),
            a.not(Compute.matches(a.lexical, dataScheme)),
          ),
          a.or(a.not(a.in(a.name, addressLists)), a.not(Compute.matches(a.lexical, dataToken))),
        ),
      ),
      check("CDN_data", Node, (n) =>
        n.or(n.not(uriText(n)), n.not(Compute.matches(n.stringValue, dataScheme))),
      ),
    ],
    "CDN foreign": [
      check("CDN_foreign", Attribute, (a) => a.not(a.in(a.name, uninterpretedClasses))),
      check("CDN_foreign", Node, (n) => n.not(n.in(n.kind, Object.values(foreignKinds)))),
    ],
    "CDN origin": [
      check("CDN_origin", Attribute, (a) =>
        a.and(
          a.or(a.not(fetchedAs(a, "address")), Compute.matches(a.lexical, address)),
          a.or(a.not(fetchedAs(a, "candidates")), Compute.matches(a.lexical, candidates)),
        ),
      ),
      check("CDN_origin", Node, (n) =>
        n.or(n.not(n.in(n.governor, textGovernors)), Compute.matches(n.stringValue, address)),
      ),
    ],
    "CDN style": [
      check("CDN_style", Attribute, (a) =>
        a.or(a.not(a.eq(a.name, "style")), a.not(Compute.matches(a.lexical, styleFetch))),
      ),
    ],
  } as const;
};

/**
 * The laws one origin states, by name.
 */
type CdnLaws = ReturnType<typeof lawsOfOrigin>;

/**
 * Build the laws a policy states, by name, or none for no policy: each call its own statements,
 * which the schema built of them holds, and which the importer names its refusals by through that
 * build (`#pantry/qti/schema.ts` `qtiLevelsOf`). None for this package's own install, which is why
 * its schema, migrations and snapshot are the same whether the mode exists or not.
 *
 * @param policy - The install's policy, none for this package's own install.
 * @returns The statements by law; empty for none.
 */
export const cdnLawsByName = (policy: Option.Option<CdnPolicy>): Partial<CdnLaws> =>
  Option.match(policy, { onNone: () => ({}), onSome: ({ cdn }) => lawsOfOrigin(cdn) });
