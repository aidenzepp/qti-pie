/**
 * The package-media level's path rule, `MediaPath`: every address a player fetches, each field
 * `#pantry/vocab/fetched.ts` declares, names a file of the package, which `file-exists` holds to an
 * `Entry`, so a player fetches it from wherever the app serves the package's files.
 *
 * - **It resolved in the package.** A fetched attribute has its `ReferencePath` and a fetched text
 *   its `TextReferencePath`: the reference census read it (`ReferenceAttribute`,
 *   `textReferenceKinds` of `#pantry/grammar/references.ts`) and the importer resolved it to an
 *   entry (its `HrefScope` is `entry`). So no external address, none above the package's root or
 *   under an `xml:base` outside it, and no same-document reference (an empty one, a query or a
 *   fragment alone).
 * - **It is written as a relative path.** Its value holds no scheme, `data:` among them, and starts
 *   with no `/` or `\`, an absolute path or a network path's `//` authority, as the URL Standard
 *   reads it ({@link nonRelative}).
 * - **It keeps no entity reference.** crust keeps one only where its declaration may sit in the
 *   external subset, which it never reads, while a player that reads the subset expands it, so the
 *   kept form, which the importer resolves as written, may stand for an address off the package (as
 *   `CdnOrigin` refuses one, decision 488).
 *
 * A fetched field no census resolves is refused whatever it holds: a `qti-interaction-module`'s
 * `primary-path` and `fallback-path`, which name a module the loader resolves and extends with
 * `.js`, not a file; the text of a `qti-file-href` other than a card's, which the information model
 * does not hold to the package; and an attribute fetched under the governor of another kind's type
 * (a `qti-null` governed by `ImgDType`), since the census reads an element by its kind. None names
 * an entry a law can hold, so none could be served as a file of the package.
 *
 * A field is selected by its name under any governor of a kind that fetches it ({@link governorsOf}
 * of `#pantry/levels/cdn-origin.ts`, as `CdnOrigin` reads it) and by its element's kind, so neither
 * an `xsi:type` nor an element of the kind under another governor takes it out of the rule.
 *
 * The rule is stated at the `Media` level (`packageMedia`, `#pantry/levels/media.ts`), never as a
 * law of `Qti`: derived relations over `Qti` select the fetched values and the fetched fields that
 * did not resolve, and a `MediaPath` check over each judges them. A check over a derived relation
 * is a deferred trigger on each table its query reads, so a `Qti` write meets it at commit and a
 * process over `Qti` alone compiles none of it.
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 */
import { check, Compute, derived, query, v } from "@bjornpagen/grizzle";
import { Array as Arr } from "effect";
import { governorsOf } from "#pantry/levels/cdn-origin.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import { ReferencePath, TextReferencePath } from "#pantry/qti/package.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";
import { fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

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
 * An address that is no path relative to its document, as the URL Standard reads one against the
 * player's page: past the leading C0 controls and spaces it strips, a scheme (an ASCII letter, then
 * letters, digits, `+`, `-` and `.`, any tab or newline among them removed, then the colon that
 * ends it), `data:` among them; or a first `/` or `\`, which the URL Standard reads alike for a
 * special scheme's URL, the start of an absolute path or, doubled, of a network path's authority.
 * Read under the flag `u`.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-start-state | URL Standard, scheme start state}
 * @see {@link https://url.spec.whatwg.org/#relative-state | URL Standard, relative state}
 */
export const nonRelative = `^[${leadingStripped}]*(?:[A-Za-z][A-Za-z0-9+.\\-${tabOrNewline}]*:|[/\\\\])`;

/**
 * One fetched attribute name, with the kinds that fetch it and every governor of those kinds.
 */
export interface MediaFetchedName {
  readonly governors: readonly string[];
  readonly kinds: readonly (typeof fetchedAttributes)[number]["kind"][];
  readonly name: (typeof fetchedAttributes)[number]["name"];
}

/**
 * The fetched attributes by name, whatever their address form: a `srcset` names files of the
 * package as a `src` does, and the census reads both.
 */
export const mediaFetchedNames: readonly MediaFetchedName[] = Object.values(
  Arr.groupBy(fetchedAttributes, ({ name }) => name),
).map((rows) => {
  const kinds = rows.map(({ kind }) => kind);

  return { governors: governorsOf(kinds), kinds, name: rows[0].name };
});

/**
 * The fetched attribute names, each once: every row a relation of fetched attributes holds has one.
 */
export const mediaFetchedNameList = mediaFetchedNames.map(({ name }) => name);

/**
 * The governors whose text a player fetches.
 */
export const mediaTextGovernors = governorsOf(fetchedTexts);

/**
 * Select, over a base level, the fetched attributes: each `(node, id)` whose name is a fetched one,
 * under a governor or on an element of a kind that fetches it, with its lexical form as `value` and
 * its count of kept entity references as `entities`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedAttributesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { entities, governor, id, kind, lexical, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { entities, governor, id, kind, lexical, name, node })
      .where(
        r.or(
          ...mediaFetchedNames.map((fetched) =>
            r.and(
              r.eq(name, fetched.name),
              r.or(r.inSet(governor, fetched.governors), r.inSet(kind, fetched.kinds)),
            ),
          ),
        ),
      )
      .find({ entities, id, node, value: lexical });
  });

/**
 * Select, over a base level, the fetched attributes that did not resolve in the package: each
 * `(node, id)` selected as {@link fetchedAttributesOf} selects it, with no `ReferencePath` of its
 * element and name, and its name. The negation is a filter of its own, as grizzle states a rule
 * over a query whose relational negation stands alone.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const unresolvedAttributesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governor, id, kind, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { governor, id, kind, name, node })
      .where(
        r.or(
          ...mediaFetchedNames.map((fetched) =>
            r.and(
              r.eq(name, fetched.name),
              r.or(r.inSet(governor, fetched.governors), r.inSet(kind, fetched.kinds)),
            ),
          ),
        ),
      )
      .where(r.not(ReferencePath, { name, node }))
      .find({ id, name, node });
  });

/**
 * Select, over a base level, the elements whose text a player fetches: each node under a governor
 * whose text is fetched or of a kind whose text is, with its string value as `value`.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedTextsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governor, id, kind, stringValue } = v(Node, "node");

    return r
      .match(Node, { governor, id, kind, stringValue })
      .where(r.or(r.inSet(governor, mediaTextGovernors), r.inSet(kind, fetchedTexts)))
      .find({ id, value: stringValue });
  });

/**
 * Select, over a base level, the entity references kept in a fetched text: each `entityRef` node
 * whose parent is under a governor whose text is fetched or of a kind whose text is. A string value
 * cannot tell a kept reference from text that reads `&name;`, so the node itself is selected.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const fetchedTextEntitiesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { id, kind, parentGovernor, parentKind } = v(Node, "node");

    return r
      .match(Node, { id, kind, parentGovernor, parentKind })
      .where(
        r.and(
          r.eq(kind, "entityRef"),
          r.or(r.inSet(parentGovernor, mediaTextGovernors), r.inSet(parentKind, fetchedTexts)),
        ),
      )
      .find({ id, kind });
  });

/**
 * Select, over a base level, the fetched texts that did not resolve in the package: each node
 * selected as {@link fetchedTextsOf} selects it with no `TextReferencePath`, with its governor and
 * kind.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const unresolvedTextsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { governor, id, kind } = v(Node, "node");

    return r
      .match(Node, { governor, id, kind })
      .where(r.or(r.inSet(governor, mediaTextGovernors), r.inSet(kind, fetchedTexts)))
      .where(r.not(TextReferencePath, { node: id }))
      .find({ governor, id, kind });
  });

/**
 * Build the path rule for one base level: the derived relations over the base it judges, by name,
 * and a `MediaPath` check over each.
 *
 * - `MediaFetchedAttribute`: the fetched attributes, each held to keep no entity reference and to be
 *   no {@link nonRelative} address;
 * - `MediaUnresolvedAttribute`: the fetched attributes with no `ReferencePath`, each refused: the
 *   check's condition, that the row's name is no fetched name, no row meets;
 * - `MediaFetchedText`: the fetched texts, each held to be no {@link nonRelative} address;
 * - `MediaFetchedTextEntity`: the entity references kept in a fetched text, each refused;
 * - `MediaUnresolvedText`: the fetched texts with no `TextReferencePath`, each refused: the check's
 *   condition, that the row is neither under a fetched text's governor nor of its kind, no row
 *   meets.
 *
 * Each match is a trigger's violation query over a text whose type bounds its bytes within what
 * PostgreSQL's regular expressions read: an attribute's lexical form and a string value are both
 * bounded so (`regexTextBytes` of `#pantry/qti/limits.ts`).
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @returns The relations and statements the rule adds to the `Media` level.
 */
export const mediaPathRule = (base: QtiSchema) => {
  const relative = Compute.pattern(nonRelative);
  const MediaFetchedAttribute = derived("MediaFetchedAttribute", fetchedAttributesOf(base));
  const MediaUnresolvedAttribute = derived(
    "MediaUnresolvedAttribute",
    unresolvedAttributesOf(base),
  );
  const MediaFetchedText = derived("MediaFetchedText", fetchedTextsOf(base));
  const MediaFetchedTextEntity = derived("MediaFetchedTextEntity", fetchedTextEntitiesOf(base));
  const MediaUnresolvedText = derived("MediaUnresolvedText", unresolvedTextsOf(base));

  return {
    relations: {
      MediaFetchedAttribute,
      MediaFetchedText,
      MediaFetchedTextEntity,
      MediaUnresolvedAttribute,
      MediaUnresolvedText,
    },
    statements: [
      check("MediaPath", MediaFetchedAttribute, (f) =>
        f.and(f.eq(f.entities, 0n), f.not(Compute.matches(f.value, relative))),
      ),
      check("MediaPath", MediaUnresolvedAttribute, (f) =>
        f.not(f.in(f.name, mediaFetchedNameList)),
      ),
      check("MediaPath", MediaFetchedText, (f) => f.not(Compute.matches(f.value, relative))),
      check("MediaPath", MediaFetchedTextEntity, (f) => f.ne(f.kind, "entityRef")),
      check("MediaPath", MediaUnresolvedText, (f) =>
        f.and(f.not(f.in(f.governor, mediaTextGovernors)), f.not(f.in(f.kind, fetchedTexts))),
      ),
    ] as const,
  };
};
