/**
 * Package-media mode: the laws an install's media policy adds to `Qti`, so the database refuses a
 * fetch of anything but a file of the package whose type the policy lists
 * (`#pantry/db/install.ts` `MediaPolicy`), and pantry's importer states nothing of them. A player
 * fetches each such file from wherever the install serves the package's files, by the entry's
 * digest (`Entry.digest`), with the media type the policy gives its extension. Each law is a row
 * check, a CHECK constraint the migration compiles from the policy, so every writer meets it, and a
 * refused import names its law and rule as any other refusal does.
 *
 * - **Media path** (rule `media-path`): every address a player fetches, each field
 *   `#pantry/vocab/fetched.ts` declares, names a file of the package, which `file-exists` holds to
 *   an `Entry`:
 *
 *   - An attribute fetched under any governor of its kind's type ({@link governorsOf}) is one the
 *     reference census resolves (`ReferenceAttribute`), and the text of a fetched element is one the
 *     text census resolves (`textReferenceKinds` of `#pantry/grammar/references.ts`), so the import
 *     writes it a `Reference` or a `TextReference`;
 *   - That reference resolved in the package (its `HrefScope` is `entry`), so it has its
 *     `ReferencePath` or `TextReferencePath`: no external address, none above the package's root or
 *     under an `xml:base` outside it, and no same-document reference (an empty one, a query or a
 *     fragment alone);
 *   - Its value holds no scheme, `data:` among them, and starts with no `/` or `\`, an absolute path or
 *     a network path's `//` authority, as the URL Standard reads it ({@link nonRelative}).
 *
 *   So it refuses, whatever they hold, the fetched fields no census resolves: a
 *   `qti-interaction-module`'s `primary-path` and `fallback-path`, which name a module the loader
 *   resolves and extends with `.js`, not a file; the text of a `qti-file-href` other than a card's (a
 *   calculator's or a digital material's), which the information model does not hold to the package;
 *   and an attribute fetched under the governor of another kind's type (a `qti-null` governed by
 *   `ImgDType`), since the census reads an element by its kind. None of them names an entry a law can
 *   hold, so none could be served as a file of the package.
 * - **Media type** (rule `media-type`): every entry a fetched reference resolves to has an extension
 *   the policy lists: the text after the last `.` of its path's last segment, where that `.` is not
 *   the segment's first character, as Node's `path.posix.extname` reads that segment
 *   ({@link extensionPattern}), so a path that ends with `/` has none; matched case-sensitively, so
 *   `photo.JPG` and `photo.jpeg` are refused under a policy that lists `jpg`. The law reads the
 *   reference's resolved path, which `file-exists` holds to be the entry's own.
 * - **Media data** (rule `media-data`): no address uses the `data:` scheme, so no value carries a
 *   base64 payload: no admitted attribute and no element text whose domain is an `xs:anyURI`, links
 *   and identifiers included, as the URL Standard reads its scheme ({@link dataScheme}), and no
 *   token of an address list (`xsi:schemaLocation`). A `source`'s `src` and `srcset`, a `video`'s
 *   `poster` and an `object`'s `data` are fetched fields typed as strings rather than `xs:anyURI`
 *   (`URLDType`, `xs:normalizedString`), and Media path refuses a scheme in every fetched field,
 *   `data:` among them.
 * - **Media style** (rule `media-style`): no `style` attribute holds `url(`, `@import`, `image-set(`
 *   or `src(`, in any case, or a backslash, which begins a CSS escape ({@link styleFetch}).
 * - **Media foreign** (rule `media-foreign`): no markup pantry keeps but cannot interpret, which
 *   could carry an address no law above reads: no foreign element, of any of the three namespace
 *   classes (`foreignKinds` of `#pantry/grammar/kinds.ts`), and no attribute of an open class but
 *   `data-*`, so no `foreign`, `no-namespace` or `own-namespace` attribute. A `data-*` attribute is
 *   kept, as QTI writes them (`data-catalog-idref`).
 *
 * The laws read only the fields `#pantry/vocab/fetched.ts` declares: a manifest's `href`, an item,
 * section or stimulus ref's, an `xi:include`'s, a link's and every other reference that names a
 * document rather than fetched media stays `file-exists`'s alone, whatever its extension.
 *
 * Every check is named by its law with spaces written as underscores, as every check of the schema
 * is (`#pantry/import/refusal.ts` `checkNameOf`).
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 * @see {@link https://nodejs.org/api/path.html#pathextnamepath | Node.js, path.extname}
 */
import { check, Compute } from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import type { MediaPolicy } from "#pantry/db/install.ts";
import { grammar, ReferenceAttribute, TextDomain } from "#pantry/grammar/install.ts";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import { admitted, Attribute, domainOf } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import { Reference, ReferencePath, TextReference, TextReferencePath } from "#pantry/qti/package.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

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
 * An address that uses the `data:` scheme, as the URL Standard reads a scheme: past the leading C0
 * controls and spaces it strips, the letters `data` in any case, any tab or newline among them
 * removed, and the colon that ends a scheme.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-state | URL Standard, scheme state}
 */
export const dataScheme = Compute.pattern<string>(
  `^[${leadingStripped}]*[dD][${tabOrNewline}]*[aA][${tabOrNewline}]*[tT][${tabOrNewline}]*[aA][${tabOrNewline}]*:`,
);

/**
 * A token of an address list that uses the `data:` scheme: at the list's start or after the
 * whitespace that separates its tokens, which a token never holds.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#atomic-vs-list | XML Schema 1.0 Part 2, §2.5.1.2 List datatypes}
 */
export const dataToken = Compute.pattern<string>(
  `(?:^|[${tabOrNewline} ])[${leadingStripped}]*[dD][aA][tT][aA]:`,
);

/**
 * An address that is no path relative to its document, as the URL Standard reads one against the
 * player's page: past the leading C0 controls and spaces it strips, a scheme (an ASCII letter, then
 * letters, digits, `+`, `-` and `.`, any tab or newline among them removed, then the colon that
 * ends it), `data:` among them; or a first `/` or `\`, which the URL Standard reads alike for a
 * special scheme's URL, the start of an absolute path or, doubled, of a network path's authority.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-start-state | URL Standard, scheme start state}
 * @see {@link https://url.spec.whatwg.org/#relative-state | URL Standard, relative state}
 */
export const nonRelative = Compute.pattern<string>(
  `^[${leadingStripped}]*(?:[A-Za-z][A-Za-z0-9+.\\-${tabOrNewline}]*:|[/\\\\])`,
);

/**
 * A path with an extension, as Node's `path.posix.extname` reads one in its last segment: a `.` in
 * that segment, not its first character, followed by at least one character, none a `.` or a `/`.
 * The extension is what follows that `.`.
 *
 * @see {@link https://nodejs.org/api/path.html#pathextnamepath | Node.js, path.extname}
 */
export const extensionPattern = Compute.pattern<string>(String.raw`[^/]\.[^./]+$`);

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
export const styleFetch = Compute.pattern(
  String.raw`[uU][rR][lL]\(|@[iI][mM][pP][oO][rR][tT]|[iI][mM][aA][gG][eE]-[sS][eE][tT]\(|[sS][rR][cC]\(|\\`,
);

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
 * One fetched attribute name, with every governor it is fetched under.
 */
interface FetchedName {
  readonly governors: readonly string[];
  readonly name: (typeof fetchedAttributes)[number]["name"];
}

/**
 * The fetched attributes by name, each with the governors of every kind that fetches it.
 */
const fetchedNames: readonly FetchedName[] = Object.values(
  Arr.groupBy(fetchedAttributes, ({ name }) => name),
).map((rows) => ({ governors: governorsOf(rows.map(({ kind }) => kind)), name: rows[0].name }));

/**
 * The governors whose text a player fetches.
 */
const textGovernors = governorsOf(fetchedTexts);

/**
 * The fetched element kinds whose text the text census resolves: the only ones whose text the
 * import writes a `TextReference` of.
 */
const resolvedTextKinds = fetchedTexts.filter((kind) =>
  textReferenceKinds.some((resolved) => resolved.kind === kind),
);

/**
 * The value domains that are an `xs:anyURI`'s: every domain whose primitive is `anyURI`.
 */
const uriDomains = grammar.attributes.valueDomain.rows.flatMap(({ domain, primitive }) =>
  primitive === "anyURI" ? [domain] : [],
);

/**
 * The open attribute classes Media foreign refuses: every class but `data-*`.
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
 * A `Reference` row as a row check reads it.
 */
type ReferenceRow = RowScalars<typeof Reference>;

/**
 * A `ReferencePath` row as a row check reads it.
 */
type ReferencePathRow = RowScalars<typeof ReferencePath>;

/**
 * State that an attribute is a fetched field: its name one a kind fetches, under a governor of such
 * a kind.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const fetchedAttribute = (a: AttributeRow) =>
  a.or(
    ...fetchedNames.map(({ governors, name }) =>
      a.and(a.eq(a.name, name), a.in(a.governor, governors)),
    ),
  );

/**
 * State that a reference, or a reference resolved in the package, is a fetched field's: its
 * element's kind and its attribute's name are a row of `fetchedAttributes`.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const fetchedReference = (r: ReferencePathRow | ReferenceRow) =>
  r.or(...fetchedAttributes.map(({ kind, name }) => r.and(r.eq(r.kind, kind), r.eq(r.name, name))));

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
 * Build the laws one policy states, by name: the module's header gives each. A roster of no
 * extension lists no type, so its Media type admits no fetched entry at all.
 *
 * @param policy - The install's policy.
 * @returns The statements by law.
 */
const lawsOfPolicy = ({ media }: MediaPolicy) => {
  const rosters = Option.toArray(
    Arr.match(Object.keys(media), {
      onEmpty: () => Option.none(),
      onNonEmpty: (extensions) => Option.some(extensions),
    }),
  );

  return {
    "Media data": [
      check("Media_data", Attribute, (a) =>
        a.and(
          a.or(
            a.not(admitted(a)),
            a.not(a.in(domainOf(a), uriDomains)),
            a.not(Compute.matches(a.lexical, dataScheme)),
          ),
          a.or(a.not(a.in(a.name, addressLists)), a.not(Compute.matches(a.lexical, dataToken))),
        ),
      ),
      check("Media_data", Node, (n) =>
        n.or(n.not(uriText(n)), n.not(Compute.matches(n.stringValue, dataScheme))),
      ),
    ],
    "Media foreign": [
      check("Media_foreign", Attribute, (a) => a.not(a.in(a.name, uninterpretedClasses))),
      check("Media_foreign", Node, (n) => n.not(n.in(n.kind, Object.values(foreignKinds)))),
    ],
    "Media path": [
      check("Media_path", Attribute, (a) =>
        a.or(
          a.not(fetchedAttribute(a)),
          a.and(
            ReferenceAttribute.has(a.version, a.kind, a.name),
            a.not(Compute.matches(a.lexical, nonRelative)),
          ),
        ),
      ),
      check("Media_path", Node, (n) =>
        n.or(
          n.not(n.in(n.governor, textGovernors)),
          n.and(
            n.in(n.kind, resolvedTextKinds),
            n.not(Compute.matches(n.stringValue, nonRelative)),
          ),
        ),
      ),
      check("Media_path", Reference, (r) =>
        r.or(r.not(fetchedReference(r)), r.eq(r.scope, "entry")),
      ),
      check("Media_path", TextReference, (r) =>
        r.or(r.not(r.in(r.kind, fetchedTexts)), r.eq(r.scope, "entry")),
      ),
    ],
    "Media style": [
      check("Media_style", Attribute, (a) =>
        a.or(a.not(a.eq(a.name, "style")), a.not(Compute.matches(a.lexical, styleFetch))),
      ),
    ],
    "Media type": [
      check("Media_type", ReferencePath, (p) =>
        p.or(
          p.not(fetchedReference(p)),
          ...rosters.map((extensions) =>
            p.and(
              Compute.matches(p.path, extensionPattern),
              p.or(
                ...extensions.map((extension) =>
                  p.eq(Compute.endsWith(p.path, `.${extension}`), true),
                ),
              ),
            ),
          ),
        ),
      ),
      check("Media_type", TextReferencePath, (p) =>
        p.or(
          p.not(p.in(p.kind, fetchedTexts)),
          ...rosters.map((extensions) =>
            p.and(
              Compute.matches(p.path, extensionPattern),
              p.or(
                ...extensions.map((extension) =>
                  p.eq(Compute.endsWith(p.path, `.${extension}`), true),
                ),
              ),
            ),
          ),
        ),
      ),
    ],
  } as const;
};

/**
 * The laws one policy states, by name.
 */
type MediaLaws = ReturnType<typeof lawsOfPolicy>;

/**
 * Build the laws a policy states, by name, or none for no policy: each call its own statements,
 * which the schema built of them holds, and which the importer names its refusals by through that
 * build (`#pantry/qti/schema.ts` `qtiLevelsOf`). None for this package's own install, which is why
 * its schema, migrations and snapshot are the same whether the mode exists or not.
 *
 * @param policy - The install's policy, none for this package's own install.
 * @returns The statements by law; empty for none.
 */
export const mediaLawsByName = (policy: Option.Option<MediaPolicy>): Partial<MediaLaws> =>
  Option.match(policy, { onNone: () => ({}), onSome: lawsOfPolicy });
