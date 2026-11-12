/**
 * The identity overlays (plan §1.7 O1; the W5 amendment's C3, C18 and C25; the tier-1 addendum's
 * "Text in keys"; sets ruling 2; UP's port audit, B35 and C50): each document's IDs, the ID/IDREF
 * table's bindings and the IDREF tokens that name them, the `xml:lang` forms a document carries and
 * the languages each LOM general category lists, each as a set, with R26 between the two; SSML's
 * marks and lexicons named within their fragment (spec reading 3); and an item's tool
 * identification where its body uses labels.
 *
 * - **{@link DocumentId}** holds one row per element that carries an ID: an attribute whose value
 *   domain's identity is `xs:ID`, a context declaration's `identifier`, which spec reading 74
 *   counts among its document's IDs though 3.0.1's XSD types it an `IdentifierDType`, or the
 *   element's own text, where its governing type's text domain is an `xs:ID` (C50, an
 *   {@link IdentityText}). Its `id` is the value, the lexical form with its outer whitespace set
 *   apart (an `xs:ID` is an `xs:NCName`, whose whiteSpace is `collapse`), and its `owner` the
 *   element the ID/IDREF table binds the ID to: the element that carries the attribute, or the
 *   parent of the element whose text it is (XML Schema 1.0 Part 1 §3.15.5, `[binding]`: "an
 *   attribute information item in its [attributes] or an element information item in its
 *   [children]"). A form whose value is no NCName ({@link namingPattern}), empty, whitespace alone
 *   or holding whitespace inside, is no ID value: it has no row, binds nothing and names nothing,
 *   and its value domain or TextDomain refuses it alone (spec reading 156).
 * - **{@link IdBinding}** is the projection of the IDs onto (package, path, id, owner), keyed by its
 *   heading, and its key on (package, path, id) over the bindings of admitted elements is cvc-id
 *   clause 2, "no ID/IDREF binding … whose [binding] has more than one member" (law "DocumentId
 *   key", rule `document-key`). An element the grammar does not admit where it stands keeps its
 *   {@link DocumentId} but binds nothing, so "N5 admitted" alone refuses it, as the law oracle
 *   judges it (R2). An element whose two children are one ID's, or whose attribute and child are,
 *   is one binding, as the table's letter has it; the key over the ID-typed attributes' element,
 *   `(package, path, start)`, is XML Schema's one ID attribute per element.
 * - **Idref target** (rule `idref-target`): every `Idref` token, Q5.05's split of an IDREF or IDREFS
 *   attribute value, and every {@link TextIdref} token, this module's split of an IDREF or IDREFS
 *   element's text (C50), is an id of its document. Spec reading 14 follows the XSD, so a
 *   text-entry interaction's `response-identifier` and `string-identifier` are IDREFs, and a
 *   response declaration's `identifier`, an `xs:ID`, is what they name; the grammar's value domains
 *   carry it, and nothing here names a kind. A MathML `share`'s `src` of the form `#id` is no token
 *   but names an element of its document all the same (MathML 3 §4.2.7), so each such `src` is a
 *   {@link ShareFragment}, and its id is an id of its document under this rule.
 * - **{@link DocumentLang}** is the set of a document's `xml:lang` lexical forms, keyed by its whole
 *   heading (sets ruling 2), and **{@link ResourceLomLanguageSet}** the set of the languages each
 *   LOM `general` category lists. The rule they replace, `lang-set-copy`, is each one's two
 *   directions as laws: every source element has its member row ({@link XmlLang},
 *   {@link LomLanguage}) and every member row its element, every member names a row of the set (its
 *   counted family's owner axis), and every row of the set is named by one (`carriers > 0`).
 * - **R26 `document-lang`** (law "Document lang"): the QTI 3.0 metadata binding's LOM profile,
 *   §2.7.1.3, "There must be one value for each of the languages referred to by the language
 *   attributes on the associated assessmentItem, test or object bank and its 'bodyElements'",
 *   normative by its §1.2. Each language an item's or a test's `xml:lang` states is listed by every
 *   general category of each record that names the document (a `lom:lom` of the `cp:metadata` of a
 *   resource of an item or a test type whose `href` names it). A document no such category
 *   describes states nothing, so a resource whose record has no general category is not judged. It
 *   is a universal over pairs, which the database states as a rule over a query (`DescribedLang`,
 *   `#pantry/qti/queries.ts`): each form that states a language, under each category describing its
 *   document, has its compared value ({@link DocumentLang}'s `value`) among the languages the
 *   category lists ({@link ResourceLomLanguageSet}). Q5.07 had culled the old one-sided flag
 *   `DocumentLang.lomGeneral` with a read in its place, on the orchestrator's ruling that R26 had
 *   no source; UP's audit found the source and the ruling is reversed, so the read is this refusal.
 *   In place (spec reading 117), an included fragment's elements are its item's body elements: each
 *   item instance's `xml:lang` carriers are placed under its assembly ({@link PlacedXmlLang}, as
 *   many as its document has, `Document.langs`), gathered per form ({@link AssembledLang}), and
 *   each form the assembly states is listed by every category that describes the item
 *   (`DescribedAssembledLang`). The binding counts "the associated assessmentItem ... and its
 *   'bodyElements'", and a catalog is "outside the content body node" (information model §5.28), so
 *   R26 counts no `xml:lang` under a `qti-catalog-info` (reading R9-c): each {@link XmlLang} names
 *   its {@link CatalogScope}, read up the tree as {@link SsmlScope} reads a fragment, and
 *   {@link DocumentLang}, {@link AssembledLang} and their carriers count only the carriers whose
 *   scope is their document ({@link BodyXmlLang}, {@link PlacedBodyXmlLang}). Every `xml:lang`
 *   keeps its row.
 * - **Reading 3** (rule `ssml-fragment`): SSML's "document" is each `speak` fragment. A `speak`'s
 *   `startmark` and `endmark` name a `mark` its fragment defines exactly once (law "SSML trim
 *   mark", SSML 1.1 §3.1.1.1), and a `lookup`'s `ref` a `lexicon` of its fragment (law "SSML
 *   lexicon reference", §3.1.5.1); a mark name may otherwise repeat, and fragments see none of each
 *   other's names. {@link SsmlAttribute} holds the attributes the two laws read,
 *   {@link FragmentValue} each fragment's values by element kind, and {@link SsmlScope} each
 *   element's fragment, read up the tree from the elements those attributes stand on, so `Node`
 *   carries no copy of it. A name is compared by its value, the lexical form collapsed (an
 *   `xs:token`'s or an `xs:ID`'s whiteSpace, SSML 1.1 §3.3.2), which `Compute.collapse` states.
 * - **Label tools** (rule `label-tool`): an item that labels an element of its content names the tool
 *   that labelled it, by both `tool-name` and `tool-version` on its root ({@link LabelUse}), where
 *   the element's `label` characteristic says so, as BasePromptInteraction's, the BaseSequence
 *   family's and ItemBody's do ({@link toolLabelKinds}); in a QTI 3.0.1 item the root's own `label`
 *   asks for them too (3.0.1's §4.1.3, spec reading 128), and in a 3.0.0 item it does not (3.0.0's
 *   §4.1.3 states no such sentence), nor does an `ItemFileInfo`'s or a printed variable's.
 *
 * **Language equality.** A language is the one a tag names: `xml:lang` is an `xs:language`,
 * compared by its value, its lexical form collapsed (XML Schema 1.0 Part 2 §3.3.3, whiteSpace
 * `collapse` from `xs:token`), and a LOM `language` a `CharacterString`, an `xs:string` read as
 * written; BCP 47 compares tags without regard to case ("At all times, language tags and their
 * subtags … are to be treated as case insensitive", RFC 5646 §2.1.1, which XML 1.0 §2.12 names for
 * `xml:lang`). A tag's subtags are ASCII letters, digits and hyphens (RFC 5646 §2.1), so its case
 * is ASCII's, and both sides compare by `Compute.lowerAscii`: {@link LomLanguage}'s `tag` and
 * {@link DocumentLang}'s `value`. An empty `xml:lang`, or one of whitespace alone, states no
 * language ("there is no language information available", XML 1.0 §2.12), so it asks for no
 * listing; nor does a form that is no language tag once collapsed, which identifies no language
 * (RFC 5646 §2.1), so its value domain refuses it alone (spec reading 174,
 * {@link statedLanguagePattern}).
 *
 * Every copy of an attribute into an overlay follows C18 the other way round, from
 * `select(Attribute, φ)` into the overlay, keyed by `Attribute`'s own key, `(package, path, start,
 * name)` (`#pantry/qti/attributes.ts`), whose index over the selection's element serves the copy's
 * reverse probe, so no index holds `Attribute.lexical`. Every overlay is keyed by its element,
 * `(package, path, start)`, and names another element of its document by its position alone. Every
 * copied text that takes part in a cross-row equality is `keyText` (`#pantry/qti/limits.ts`): a
 * value past its bound has no overlay row, so its copy's foreign key refuses it beside the schema's
 * one limit law.
 *
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores. The overlays' agreement with what the tree holds is "E1 derived" (rule
 * `derived`): a field or a row the database derives that the host built otherwise.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#cvc-id | XML Schema 1.0 Part 1, Validation Root (the ID/IDREF table)}
 * @see {@link https://www.w3.org/TR/xmlschema-1/#cvc-complex-type | XML Schema 1.0 Part 1, Element Locally Valid (Complex Type), clause 5}
 * @see {@link https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html | QTI 3.0 Metadata, §2.7.1.3 Language}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5646#section-2.1.1 | RFC 5646, §2.1.1 Formatting of Language Tags}
 */
import {
  accumulated,
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { languageTag } from "#pantry/grammar/attributes.ts";
import {
  AttributeName,
  Governor,
  Identity,
  NodeKind,
  SchemaVersion,
  TextDomain,
  toolLabelKinds,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Attribute, identityIn, Idref, namingPattern, Space } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { EntryPath, keyText, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { ObjectLang } from "#pantry/qti/metadata.ts";
import { admitsHere, Node, nodeRef } from "#pantry/qti/node.ts";
import { ManifestId, ResourceId } from "#pantry/qti/package.ts";
import { Instance } from "#pantry/qti/tests.ts";
import { recordDocumentTypes } from "#pantry/vocab/terms/metadata.ts";
import { itemKind, testKind } from "#pantry/vocab/terms/tests.ts";

/**
 * XML whitespace `S`, possibly none: what an ID's lexical form holds around its value, the
 * language of `Space` (`#pantry/qti/attributes.ts`), the type its pieces are of.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const spacePattern = Compute.pattern("^[\\t\\n\\r ]*$");

/**
 * A nonempty run holding no XML whitespace: an ID's value once its lexical form's outer whitespace
 * is set apart, and an IDREF token. That an ID's run is an NCName is its copy source's
 * ({@link namingPattern}); that an IDREF token is, AL1's lexical half over the attribute and
 * TextDomain's over the element's text.
 */
export const idValuePattern = Compute.pattern("^[^\\t\\n\\r ]+$");

/**
 * An `xml:lang` form that states a language once collapsed: a well-formed BCP 47 tag
 * (`languageTag`, spec reading 129) with XML whitespace around it, which collapsing strips, since a
 * tag holds none. Any other form states no language and asks no record to list it: the empty one
 * and one of whitespace alone (XML 1.0 §2.12), and one that is no tag, which identifies no language
 * (RFC 5646 §2.1), so its value domain refuses it alone (spec reading 174).
 */
export const statedLanguagePattern = Compute.pattern<string>(
  `^[\\t\\n\\r ]*(?:${languageTag})[\\t\\n\\r ]*$`,
);

/**
 * A same-document fragment reference: `#` and one or more characters (MathML 3 §4.2.7).
 */
const shareFragmentPattern = Compute.pattern("^#.+$");

/**
 * The schema version whose item root's own `label` asks for the root's tools (spec reading 128):
 * QTI 3.0.1's §4.1.3 says of the item's `label` "If an item uses labels then values for the
 * associated toolName and toolVersion attributes must also be provided", where 3.0.0's §4.1.3 says
 * only "A human readable label that can be used to describe the Item".
 */
const labelledRootVersion = "3.0.1";

/**
 * The document node's position in its document, `Node.start` of the root: the scope of an element
 * no scope element holds, and the parent a document's root element names.
 */
const documentNode = 0n;

/**
 * One ID of a document, keyed by the element that carries it, `(package, path, start)`: XML Schema
 * gives a valid element at most one attribute of an ID type, an attribute use's or a wildcard's
 * (cvc-complex-type clause 5, ct-props-correct clause 5), and a governor whose text is an ID's
 * admits the four `xsi:` attributes alone, so no element carries both.
 *
 * - **copied from the attribute or the text:** `package`, `path`, `start` and `lexical`, and for a
 *   text, `owner`, the element's parent's position;
 * - **the host's:** `before`, `id` and `after`, the lexical form split around its value, which
 *   `E1_derived` proves, and for an attribute, `owner`, the element's own position: a row whose
 *   `owner` is its `start` is an attribute's, every other a text's; and `admitted`, whether the
 *   grammar admits the element that carries it where it stands (its parent's admission map,
 *   {@link admittedNodes}), which `E1_derived` proves both ways.
 *
 * Every ID has its row, an unadmitted element's too, so the copy from the attribute or the text
 * stays complete; only an admitted element's ID is bound ({@link IdBinding}'s `admitted`).
 */
export const DocumentId = relation(
  "DocumentId",
  {
    admitted: pg.boolean,
    after: Space,
    before: Space,
    id: keyText,
    lexical: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * One binding of the ID/IDREF table, a projection keyed by its heading (sets ruling 2): an id of a
 * document and the position of the element it is bound to, `carriers` the IDs that bind it, and
 * `admitted` its IDs' (`DocumentId.admitted`). Only an admitted binding is in the table
 * ({@link admittedBindings}): an element the grammar does not admit where it stands is refused by
 * "N5 admitted" alone, and the law oracle drops it with its attributes, so its ID binds nothing
 * (R2).
 */
export const IdBinding = relation(
  "IdBinding",
  {
    admitted: pg.boolean,
    carriers: drawn(natural),
    id: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "path", "id", "owner"],
);

/**
 * One element whose text is of an identity type (C50), keyed by the element: its governing type's
 * text domain is an `xs:ID`, an `xs:IDREF` or an `xs:IDREFS` one (`ValueIdentity`), which only an
 * `xsi:type` gives an element in the pinned grammar.
 *
 * - **copied from the node:** `package`, `path`, `start`, `kind`, `version`, `governor`, `owner` (its
 *   parent's position) and `lexical`, its string value, `Node.stringValue`, which the string
 *   value's fold steps because TextDomain checks the text (`#pantry/qti/node.ts` `inCheckedText`);
 * - **drawn:** `idrefs`, its {@link TextIdref} count;
 * - **accumulated:** `idrefText`, the end of its tokens' concatenation.
 */
export const IdentityText = relation(
  "IdentityText",
  {
    governor: closedId(Governor),
    idrefText: accumulated(keyText, ""),
    idrefs: drawn(natural),
    kind: closedId(NodeKind),
    lexical: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * One IDREF token of an element whose text is an `xs:IDREF` or `xs:IDREFS` (C50), in order, with
 * the whitespace written before and after it, so its `piece` is a stretch of the text and the
 * pieces concatenate to it, as Q5.05's `Idref` splits an attribute's. The order is the text's: an
 * `xs:IDREFS` value is an `xs:list`, an ordered sequence of tokens.
 *
 * - **the host's:** `before`, `token` and `after`;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step, a `keyText` whose
 *   domain refuses a piece past the bound;
 * - **the family's group:** `package`, `path` and `start`, its element's, which `Idref target` reads;
 * - **drawn:** `at`;
 * - **accumulated:** `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const TextIdref = relation.generated(
  "TextIdref",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    package: ManifestIdentifier,
    path: EntryPath,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    start: natural,
    token: keyText,
  },
  ["package", "path", "start", "at"],
  (i) => ({
    piece: generated(keyText, Compute.concat(Compute.concat(i.before, i.token), i.after)),
  }),
);

/**
 * One element's `xml:lang`, keyed by the element: the attribute's lexical form, and `scope`, the
 * position of the element's {@link CatalogScope}, the member that carries a {@link DocumentLang}
 * value where that scope is the document node.
 */
export const XmlLang = relation(
  "XmlLang",
  {
    lang: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    scope: natural,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * The `xml:lang` lexical forms a document carries, a projection keyed by its heading (sets ruling
 * 2): one row per (document, form), its `carriers` the elements that carry it, and `value`, the
 * language the form names as R26 compares it: the form's value, collapsed (an `xs:language`'s
 * whiteSpace) and case-folded (`Compute.lowerAscii`, RFC 5646 §2.1.1), which the database derives,
 * within the form's own byte bound.
 */
export const DocumentLang = relation.generated(
  "DocumentLang",
  { carriers: drawn(natural), lang: keyText, package: ManifestIdentifier, path: EntryPath },
  ["package", "path", "lang"],
  (d) => ({
    value: generated(keyText, Compute.cast(Compute.lowerAscii(Compute.collapse(d.lang)), keyText)),
  }),
);

/**
 * One language a LOM `general` category lists, keyed by its `lom:language` element: `general`, the
 * category's position, its parent's; `lang`, the element's string value as written; and `tag`,
 * that value case-folded (`Compute.lowerAscii`, RFC 5646 §2.1.1), the member that carries a
 * {@link ResourceLomLanguageSet} value. `Node.stringValue` folds a `lom:language`'s characters
 * though no domain checks them, since it is one of `copiedTextKinds` (`#pantry/qti/node.ts`).
 */
export const LomLanguage = relation(
  "LomLanguage",
  {
    general: natural,
    lang: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    // GRIZZLE-PENDING: Q20: a family that groups by a generated field; then `tag` is generated as lowerAscii(lang), and tsc names its writer.
    tag: keyText,
  },
  ["package", "path", "start"],
);

/**
 * The languages each LOM `general` category lists, a projection keyed by its heading: one row per
 * (category, language), the language its tag case-folded ({@link LomLanguage}'s `tag`), so two
 * listings that differ only in case are one language, and its `carriers` the `lom:language`
 * elements that list it.
 *
 * It is keyed by the category's element, not by a resource: one hop from a `lom:language` cannot
 * tell a resource's record from the manifest's, a file's or an external one. R26 reads the
 * categories of the records that name a document through a query (`namingGenerals`,
 * `#pantry/qti/queries.ts`).
 */
export const ResourceLomLanguageSet = relation(
  "ResourceLomLanguageSet",
  {
    carriers: drawn(natural),
    general: natural,
    lang: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "path", "general", "lang"],
);

/**
 * One `label` on an element of a document that asks for its tool, keyed by the element
 * ({@link labelAttributes}, spec reading 128), with its document's root kind, which says whether
 * Label tools binds it.
 */
export const LabelUse = relation(
  "LabelUse",
  {
    package: ManifestIdentifier,
    path: EntryPath,
    rootKind: closedId(NodeKind),
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * An SSML attribute a reading 3 law reads, keyed by its element and its name: a `mark`'s `name`, a
 * `speak`'s `startmark` and `endmark`, a `lexicon`'s `xml:id` and a `lookup`'s `ref`.
 *
 * - **copied from the attribute:** `package`, `path`, `start`, `name`, `kind` (its element's) and
 *   `lexical`;
 * - **the host's:** `value`, the lexical form collapsed (`Compute.collapse`: an `xs:token`'s or an
 *   `xs:ID`'s whiteSpace), `refers`, the kind its value names (a trim a `mark`'s, a lookup a
 *   `lexicon`'s, a definition its own kind), and `fragment`, the position of its element's
 *   {@link SsmlScope}.
 */
export const SsmlAttribute = relation(
  "SsmlAttribute",
  {
    fragment: natural,
    kind: closedId(NodeKind),
    lexical: keyText,
    name: closedId(AttributeName),
    package: ManifestIdentifier,
    path: EntryPath,
    refers: closedId(NodeKind),
    start: natural,
    // GRIZZLE-PENDING: Q20: a family that groups by a generated field; then `value` is generated as collapse(lexical), and tsc names its writer.
    value: keyText,
  },
  ["package", "path", "start", "name"],
);

/**
 * One element on the way from an element an SSML law reads up to its SSML fragment, keyed by the
 * element (spec reading 3: "the document" is each `speak` fragment): its {@link nodeRef} tuple and
 * `fragment`, the position of its nearest `ssml:speak`, itself included, or of the document node
 * for an element no `speak` holds. A `speak` is its own fragment, a document's root the document's
 * where it is no `speak`, and every other element its parent's, so a fragment is read up the tree
 * with no copy on `Node`.
 */
export const SsmlScope = relation(
  "SsmlScope",
  {
    fragment: natural,
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * One element on the way from an element that carries an `xml:lang` up to its catalog scope, keyed
 * by the element (spec reading R9-c: a catalog is outside the content body, so the language of its
 * cards, entries and HTML content is not the item's): its {@link nodeRef} tuple and `scope`, the
 * position of its nearest `qti-catalog-info`, itself included, or of the document node for an
 * element no catalog holds. A `qti-catalog-info` is its own scope, a document's root the
 * document's where it is no catalog info, and every other element its parent's, so a scope is read
 * up the tree with no copy on `Node`, as {@link SsmlScope} reads a fragment.
 */
export const CatalogScope = relation(
  "CatalogScope",
  {
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    scope: natural,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * The values each SSML fragment's attributes of each kind of element hold, a projection keyed by
 * its heading: one row per (fragment, element kind, value), its `carriers` the attributes that
 * hold it, so a `mark` name a fragment defines once has `carriers` 1.
 */
export const FragmentValue = relation(
  "FragmentValue",
  {
    carriers: drawn(natural),
    fragment: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    value: keyText,
  },
  ["package", "path", "fragment", "kind", "value"],
);

/**
 * An id a document's IDREF tokens name, a projection keyed by its heading (spec reading 117): every
 * `Idref` and `TextIdref` token's value, with its document's `assembled`. A document in no
 * assembly resolves each in its own IDs; one in an assembly, in its assembly's, once per instance
 * ({@link PlacedIdref}). Its rows count as `Document.idrefTargets`.
 */
export const IdrefTarget = relation(
  "IdrefTarget",
  { assembled: pg.boolean, id: keyText, package: ManifestIdentifier, path: EntryPath },
  ["package", "path", "id"],
);

/**
 * One `m:share` whose `src` is a fragment of its own document, keyed by the element (MathML 3
 * §4.2.7; a `src` that is `#` and a name stands in the same document): `src` as written (C18), and
 * `id`, the text after the `#`, which an {@link IdrefTarget} of the document names under "Idref
 * target". A `src` with any text before its `#`, or no text after it, is no same-document fragment
 * and has no row.
 *
 * Two fields are not the share's own: `assembled`, its document's `assembled` (as
 * {@link IdrefTarget}'s is), which tells a document in no assembly, whose share resolves in its own
 * IDs, from one in an assembly, whose share resolves once per instance; and `placements`, the count
 * of its `PlacedShareTarget` rows (`#pantry/qti/mathml-share.ts`).
 */
export const ShareFragment = relation(
  "ShareFragment",
  {
    assembled: pg.boolean,
    id: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    placements: drawn(natural),
    src: keyText,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * One ID of an instance of an assembly (Q5.13's `Instance`, spec reading 117), keyed by the
 * instance, `(package, assembly, instance)`, and the position `start` of the element that carries
 * it in the instance's document, `path`: a {@link DocumentId} of that document, with the
 * instance's assembly kind, and its `copy`, which copy of the document's elements the assembly's
 * merged document holds it in: the instance, or under a test's assembly the document itself, its
 * document node's position, since a section document placed twice is written once there (reading
 * 86), and `path` already names the document.
 */
export const PlacedId = relation(
  "PlacedId",
  {
    assembly: EntryPath,
    assemblyKind: closedId(NodeKind),
    // GRIZZLE-PENDING: Q20: a family that groups by a generated field; then `copy` is generated as cond(assemblyKind = test, 0, instance), and tsc names its writer.
    copy: natural,
    id: keyText,
    instance: natural,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start"],
);

/**
 * One binding of an assembly's ID/IDREF table, a projection of {@link PlacedId} keyed by its
 * heading: an id, the element it is bound to (its document's `path` and its `owner` position), and
 * the copy of the document that holds it, `carriers` the placed IDs that bind it. Its key on
 * `(package, assembly, id)` is cvc-id clause 2 over the merged document ("DocumentId key"): an
 * included fragment's ID is distinct from its item's, and a fragment placed twice in one item holds
 * its IDs twice, as its merged document does (information model §2.12).
 */
export const AssembledId = relation(
  "AssembledId",
  {
    assembly: EntryPath,
    carriers: drawn(natural),
    copy: natural,
    id: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "assembly", "id", "path", "owner", "copy"],
);

/**
 * One id an instance's document's IDREFs name (spec reading 117), keyed by the instance and the id:
 * an {@link IdrefTarget} of the instance's document, `path`, which resolves among its assembly's
 * IDs ("Idref target").
 */
export const PlacedIdref = relation(
  "PlacedIdref",
  {
    assembly: EntryPath,
    id: keyText,
    instance: natural,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "assembly", "instance", "id"],
);

/**
 * Each document's IDs, counted by `Document.ids`.
 */
const documentIdFamily = counted(on(DocumentId, "package", "path"), fin(Document, "ids"));

/**
 * Each document's IDREF targets, counted by `Document.idrefTargets`.
 */
const idrefTargetFamily = counted(
  on(IdrefTarget, "package", "path"),
  fin(Document, "idrefTargets"),
);

/**
 * Each instance's IDs, counted by `Instance.ids`, its document's count.
 */
const placedIdFamily = counted(
  on(PlacedId, "package", "assembly", "instance"),
  fin(Instance, "ids"),
);

/**
 * Each assembly's ID bindings, counted by `AssembledId.carriers`.
 */
const assembledIdFamily = counted(
  on(PlacedId, "package", "assembly", "id", "path", "owner", "copy"),
  fin(AssembledId, "carriers"),
);

/**
 * Each instance's IDREF targets, counted by `Instance.idrefTargets`, its document's count.
 */
const placedIdrefFamily = counted(
  on(PlacedIdref, "package", "assembly", "instance"),
  fin(Instance, "idrefTargets"),
);

/**
 * One `xml:lang` outside every catalog (R9-c), keyed by its element: an {@link XmlLang} whose scope
 * is its document node, the member a counted family can count, as a family counts a relation and
 * no selection. R26's forms are these.
 */
export const BodyXmlLang = relation(
  // GRIZZLE-PENDING: Q16, a family whose member side is a selection; then this stored copy goes.
  "BodyXmlLang",
  { lang: keyText, package: ManifestIdentifier, path: EntryPath, start: natural },
  ["package", "path", "start"],
);

/**
 * One `xml:lang` of an instance of an item's assembly (Q5.13's `Instance`, spec reading 117), keyed
 * by the instance and the element's position in the instance's document, `path`: an
 * {@link XmlLang} of that document, under the assembly, with its `scope`. An included fragment's
 * elements are its item's body elements in place, so their languages are among those R26 holds the
 * item's records to list, those a catalog holds aside.
 */
export const PlacedXmlLang = relation(
  "PlacedXmlLang",
  {
    assembly: EntryPath,
    instance: natural,
    lang: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    scope: natural,
    start: natural,
  },
  ["package", "assembly", "instance", "start"],
);

/**
 * One `xml:lang` of an instance of an item's assembly outside every catalog (R9-c), keyed as
 * {@link PlacedXmlLang} is: a placed `xml:lang` whose scope is its document node, the member the
 * assembly's family counts.
 */
export const PlacedBodyXmlLang = relation(
  // GRIZZLE-PENDING: Q16, a family whose member side is a selection; then this stored copy goes.
  "PlacedBodyXmlLang",
  {
    assembly: EntryPath,
    instance: natural,
    lang: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start"],
);

/**
 * The `xml:lang` forms an item's assembly carries, a projection keyed by its heading: one row per
 * (assembly, form), its `carriers` the placed elements that carry it, and `value`, the language the
 * form names as R26 compares it, derived as {@link DocumentLang}'s is.
 */
export const AssembledLang = relation.generated(
  "AssembledLang",
  { assembly: EntryPath, carriers: drawn(natural), lang: keyText, package: ManifestIdentifier },
  ["package", "assembly", "lang"],
  (a) => ({
    value: generated(keyText, Compute.cast(Compute.lowerAscii(Compute.collapse(a.lang)), keyText)),
  }),
);

/**
 * Each document's `xml:lang` carriers, counted by `Document.langs`.
 */
const documentLangFamily = counted(on(XmlLang, "package", "path"), fin(Document, "langs"));

/**
 * Each item instance's `xml:lang` carriers, counted by `Instance.langs`, its document's count.
 */
const placedLangFamily = counted(
  on(PlacedXmlLang, "package", "assembly", "instance"),
  fin(Instance, "langs"),
);

/**
 * The placed `xml:lang`s that R26 counts: those of elements outside every catalog, whose scope is
 * their document node (R9-c), the source of {@link PlacedBodyXmlLang}.
 */
const bodyPlacedLangs = select(PlacedXmlLang, (p) => p.eq(p.scope, documentNode));

/**
 * The placed elements outside every catalog that carry each assembly's forms, counted by
 * `AssembledLang.carriers`.
 */
const assembledLangFamily = counted(
  on(PlacedBodyXmlLang, "package", "assembly", "lang"),
  fin(AssembledLang, "carriers"),
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const identityRelations = {
  AssembledId,
  AssembledLang,
  BodyXmlLang,
  CatalogScope,
  DocumentId,
  DocumentLang,
  FragmentValue,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedBodyXmlLang,
  PlacedId,
  PlacedIdref,
  PlacedXmlLang,
  ResourceLomLanguageSet,
  ShareFragment,
  SsmlAttribute,
  SsmlScope,
  TextIdref,
  XmlLang,
};

/**
 * An `Attribute` row as a selection reads it.
 */
type AttributeRow = RowScalars<typeof Attribute>;

/**
 * An `Identity` handle: `ID`, `IDREF` or `IDREFS`.
 */
type IdentityHandle = (typeof Identity.handles)[number];

/**
 * A `Node` or {@link IdentityText} row as a selection reads it: the fields an element's governor is
 * read from.
 */
type GovernedRow = RowScalars<typeof Node> | RowScalars<typeof IdentityText>;

/**
 * State that an element's text is of one of `identities`: its governor has a `TextDomain`, and that
 * domain has a `ValueIdentity` row naming one of them. A governor with no simple content has no
 * `TextDomain` row and a domain of no identity no `ValueIdentity` row, so the statement is false of
 * either.
 *
 * @param n - The row.
 * @param identities - The identity types.
 * @returns The predicate.
 */
const textIdentityIn = (n: GovernedRow, identities: readonly IdentityHandle[]) => {
  const domain = TextDomain.at("domain", n.version, n.governor);

  return n.and(
    TextDomain.has(n.version, n.governor),
    ValueIdentity.has(domain),
    n.in(ValueIdentity.at("identity", domain), identities),
  );
};

/**
 * Every identity type: `ID`, `IDREF` and `IDREFS`.
 */
const identities: readonly IdentityHandle[] = Identity.handles;

/**
 * State that an attribute is ID-typed: its domain is an `xs:ID` one, or it is a context
 * declaration's `identifier` (spec reading 74).
 *
 * @param a - The attribute row.
 * @returns The statement.
 */
const idTyped = (a: AttributeRow) =>
  a.or(
    identityIn(a, ["ID"]),
    a.and(a.eq(a.kind, "qti-context-declaration"), a.eq(a.name, "identifier")),
  );

/**
 * The ID-typed attributes, whatever their value, which the key over their element holds to one per
 * element: XML Schema gives a valid element at most one attribute of an ID type (cvc-complex-type
 * clause 5), a statement of types, not of values.
 */
export const idAttributes = select(Attribute, idTyped);

/**
 * The ID-typed attributes whose value is one of their document's IDs: those whose lexical form
 * names something once collapsed ({@link namingPattern}), each the source of a {@link DocumentId}.
 * Its conditions include every one of {@link idAttributes}', whose key over the element holds it to
 * one per element, so it needs no key of its own: grizzle keys a containment's target by a key
 * whose selection's conditions are all the target's (README, "Keys"), and installs the UNIQUE each
 * copy back into it references, a {@link DocumentId}'s and a `th`'s `TableHeader`'s at its kind
 * (`#pantry/qti/html.ts`).
 */
export const namingIdAttributes = select(Attribute, (a) =>
  a.and(idTyped(a), Compute.matches(a.lexical, namingPattern)),
);

/**
 * The ID values of one element kind: the {@link namingIdAttributes} of that kind, which a `th`'s
 * `TableHeader` copies back into (`#pantry/qti/html.ts`). Its conditions include every one of
 * {@link idAttributes}', whose key over the element holds it, and its kind is a field it fixes to a
 * value beyond its terms, so it needs no key of its own (grizzle's README, "Fixed fields").
 *
 * @param kind - The element kind.
 * @returns The selection.
 */
export const namingIdAttributesOf = (kind: "th") =>
  select(Attribute, (a) =>
    a.and(idTyped(a), Compute.matches(a.lexical, namingPattern), a.eq(a.kind, kind)),
  );

/**
 * The ID-typed attributes of one manifest element kind in a manifest, a `cp:manifest`'s or a
 * `cp:resource`'s `identifier`, which its {@link ManifestId} or {@link ResourceId} copies back
 * into. Its conditions include every one of {@link idAttributes}', whose key over the element
 * holds it, and its kind and document type are fields it fixes to values beyond its terms, so it
 * needs no key of its own (grizzle's README, "Fixed fields").
 *
 * @param kind - The manifest element's kind.
 * @returns The selection.
 */
const manifestIdAttributes = (kind: "cp:manifest" | "cp:resource") =>
  select(Attribute, (a) => a.and(idTyped(a), a.eq(a.kind, kind), a.eq(a.documentType, "manifest")));

/**
 * The elements whose text is of an identity type, the source of {@link IdentityText}.
 */
const identityNodes = select(Node, (n) => textIdentityIn(n, identities));

/**
 * The elements whose text is an ID, each the source of a {@link DocumentId}: those whose text is
 * of an `xs:ID` domain and names something once collapsed ({@link namingPattern}).
 */
const idTexts = select(IdentityText, (t) =>
  t.and(textIdentityIn(t, ["ID"]), Compute.matches(t.lexical, namingPattern)),
);

/**
 * The IDs an attribute carries: those whose owner is their own element.
 */
const attributeIds = select(DocumentId, (d) => d.eq(d.owner, d.start));

/**
 * The IDs an element's text carries: those bound to another element, its parent.
 */
const textIds = select(DocumentId, (d) => d.ne(d.owner, d.start));

/**
 * The nodes the grammar admits where they stand, whose IDs bind: their parent's family's admission
 * map holds their kind (`#pantry/qti/node.ts` `admitsHere`, the guard decision 440 put in
 * `positioned`). "N5 admitted" refuses every member it is false of.
 */
export const admittedNodes = select(Node, admitsHere);

/**
 * The nodes the grammar does not admit where they stand, whose IDs bind nothing.
 */
const unadmittedNodes = select(Node, (n) => n.not(admitsHere(n)));

/**
 * The IDs of admitted elements.
 */
const admittedIds = select(DocumentId, (d) => d.eq(d.admitted, true));

/**
 * The IDs of elements the grammar does not admit where they stand.
 */
const unadmittedIds = select(DocumentId, (d) => d.eq(d.admitted, false));

/**
 * The bindings of the ID/IDREF table: those of admitted elements' IDs, which "DocumentId key" holds
 * to one element per (document, id) and "Idref target" resolves an IDREF among (R2).
 */
const admittedBindings = select(IdBinding, (b) => b.eq(b.admitted, true));

/**
 * Every element's `xml:lang`, the source of {@link XmlLang}.
 */
const langAttributes = select(Attribute, (a) => a.eq(a.name, "xml:lang"));

/**
 * Every MathML `share` whose `src` is a fragment of its own document, the source of
 * {@link ShareFragment}: `#` and one or more characters.
 */
const shareSources = select(Attribute, (a) =>
  a.and(
    a.eq(a.kind, "m:share"),
    a.eq(a.name, "src"),
    Compute.matches(a.lexical, shareFragmentPattern),
  ),
);

/**
 * The IDREF targets of documents in no assembly, each an id of its own document; an assembled
 * document's resolve per instance ({@link PlacedIdref}).
 */
const unassembledTargets = select(IdrefTarget, (t) => t.eq(t.assembled, false));

/**
 * Every `label` that asks for its tool, the source of {@link LabelUse} (spec reading 128): one of
 * the kinds whose declared type takes its `label` from a characteristic that states the sentence
 * ({@link toolLabelKinds}), and a QTI 3.0.1 item root's own. `version` is the document's schema
 * version, which shred reads from its manifest's `schemaversion` (spec reading 67). An
 * `ItemFileInfo`'s label (`qti-digital-material`, `qti-calculator-info`, §5.80.2) and a printed
 * variable's (§7.30.4) are text for a reader, and ask for no tool.
 */
const labelAttributes = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "label"),
    a.or(
      a.in(a.kind, toolLabelKinds),
      a.and(a.eq(a.kind, itemKind), a.eq(a.version, labelledRootVersion)),
    ),
  ),
);

/**
 * An item root's `tool-name`, one per item document.
 */
const toolNames = select(Attribute, (a) =>
  a.and(a.eq(a.name, "tool-name"), a.eq(a.kind, itemKind)),
);

/**
 * An item root's `tool-version`, one per item document.
 */
const toolVersions = select(Attribute, (a) =>
  a.and(a.eq(a.name, "tool-version"), a.eq(a.kind, itemKind)),
);

/**
 * Every `lom:language` of a LOM `general` category of a document a package's records are read from
 * (`recordDocumentTypes`), the source of {@link LomLanguage}: its element, its parent and its
 * string value.
 */
const lomLanguages = select(Node, (n) =>
  n.and(
    n.in(n.documentType, recordDocumentTypes),
    n.eq(n.kind, "lom:language"),
    n.eq(n.parentKind, "lom:general"),
  ),
);

/**
 * The SSML attributes reading 3's laws read, the source of {@link SsmlAttribute}.
 */
const ssmlAttributes = select(Attribute, (a) =>
  a.or(
    a.and(a.eq(a.kind, "ssml:mark"), a.eq(a.name, "name")),
    a.and(a.eq(a.kind, "ssml:speak"), a.in(a.name, ["startmark", "endmark"])),
    a.and(a.eq(a.kind, "ssml:lexicon"), a.eq(a.name, "xml:id")),
    a.and(a.eq(a.kind, "ssml:lookup"), a.eq(a.name, "ref")),
  ),
);

/**
 * A `speak`'s `startmark` and `endmark`, each naming a `mark` of its own fragment.
 */
const trims = select(SsmlAttribute, (t) => t.eq(t.kind, "ssml:speak"));

/**
 * A `lookup`'s `ref`, naming a `lexicon` of its own fragment.
 */
const lookups = select(SsmlAttribute, (l) => l.eq(l.kind, "ssml:lookup"));

/**
 * The values a fragment's attributes of one kind hold once, a mark name defined once among them.
 */
const onceHeld = select(FragmentValue, (v) => v.eq(v.carriers, 1n));

/**
 * The scopes a fragment is read from the parent: every element but a `speak` and a document's
 * root.
 */
const inheritedScopes = select(SsmlScope, (s) =>
  s.and(s.ne(s.kind, "ssml:speak"), s.ne(s.parent, documentNode)),
);

/**
 * The scopes a catalog scope is read from the parent: every element but a `qti-catalog-info` and a
 * document's root.
 */
const inheritedCatalogScopes = select(CatalogScope, (s) =>
  s.and(s.ne(s.kind, "qti-catalog-info"), s.ne(s.parent, documentNode)),
);

/**
 * The labels Label tools binds: those in a document whose root is an item's.
 */
const itemLabels = select(LabelUse, (l) => l.eq(l.rootKind, itemKind));

/**
 * The IDs that bind each (package, path, id, owner), counted by `IdBinding.carriers`.
 */
const idBindingFamily = counted(
  on(DocumentId, "package", "path", "id", "owner"),
  fin(IdBinding, "carriers"),
);

/**
 * Each IDREF or IDREFS element's tokens in order, counted by `IdentityText.idrefs`.
 */
const textIdrefFamily = ordered(
  on(TextIdref, "package", "path", "start", "at"),
  fin(IdentityText, "idrefs"),
);

/**
 * The `xml:lang`s that R26 counts: those of elements outside every catalog, whose scope is their
 * document node (R9-c), the source of {@link BodyXmlLang}. Every `xml:lang` keeps its
 * {@link XmlLang} row; only this selection narrows.
 */
const bodyLangs = select(XmlLang, (x) => x.eq(x.scope, documentNode));

/**
 * The elements outside every catalog that carry each document's `xml:lang` forms, counted by
 * `DocumentLang.carriers`.
 */
const langFamily = counted(
  on(BodyXmlLang, "package", "path", "lang"),
  fin(DocumentLang, "carriers"),
);

/**
 * The `lom:language` elements that list each category's languages, counted by
 * `ResourceLomLanguageSet.carriers`.
 */
const lomLanguageFamily = counted(
  on(LomLanguage, "package", "path", "general", "tag"),
  fin(ResourceLomLanguageSet, "carriers"),
);

/**
 * The attributes that hold each fragment's values, counted by `FragmentValue.carriers`.
 */
const fragmentValueFamily = counted(
  on(SsmlAttribute, "package", "path", "fragment", "kind", "value"),
  fin(FragmentValue, "carriers"),
);

/**
 * Spec reading 3's trims (law "SSML trim mark", rule `ssml-fragment`; SSML 1.1 §3.1.1.1: "Only
 * markers defined once in the document, i.e. that are unique, are permitted as the value of either
 * startmark or endmark"): a `speak`'s `startmark` and `endmark` each name a `mark` its own
 * fragment defines exactly once. A mark name may otherwise repeat.
 *
 * A trim stands on its `speak`, which is its own fragment ({@link SsmlScope}), so the statement
 * reads the trim's `start` where {@link ssmlLexiconReference} reads `fragment`: the two say the
 * same of a trim.
 */
export const ssmlTrimMark = contained(
  on(trims, "package", "path", "start", "refers", "value"),
  on(onceHeld, "package", "path", "fragment", "kind", "value"),
);

/**
 * Spec reading 3's lookups (law "SSML lexicon reference", rule `ssml-fragment`; SSML 1.1 §3.1.5.2:
 * "The ref attribute specifies a name that references a lexicon document as assigned by the xml:id
 * attribute of the lexicon element"; §3.1.5.1: "The scope of this name is the current SSML
 * document"): a `lookup`'s `ref` names a `lexicon` of its own fragment.
 */
export const ssmlLexiconReference = contained(
  on(lookups, "package", "path", "fragment", "refers", "value"),
  on(FragmentValue, "package", "path", "fragment", "kind", "value"),
);

/**
 * Every statement over the identity overlays, each `check` named by its oracle law:
 *
 * - **DocumentId:** at most one ID-typed attribute per element (the key over its selection), each
 *   whose value is an NCName copied into its row and each attribute row such an attribute's (C18),
 *   the way back keyed by that key, since its selection lies within the key's; each ID-typed text
 *   whose value is an NCName copied into its row, bound to the element's parent, and each text row
 *   such a text's, the way back keyed by `IdentityText`'s own; the value set apart from its outer
 *   whitespace (`E1_derived`);
 * - **IdBinding:** the projection's counted family, each binding carried and admitted as its IDs are,
 *   each ID admitted exactly where its element is (`E1_derived`), and "DocumentId key" over the
 *   admitted bindings;
 * - **IdentityText:** each element whose text is of an identity type copied into its row with its
 *   string value and its parent, and each row such an element's, its IDREF tokens concatenating to
 *   its text and an ID's none (`E1_derived`);
 * - **Idref target:** each IDREF token, an attribute's or a text's, names one of its document's
 *   {@link IdrefTarget} rows, each an id an admitted element of its document binds where the
 *   document is in no assembly;
 * - **in place** (spec reading 117): under each instance of each assembly, as many {@link PlacedId}
 *   and {@link PlacedIdref} rows as its document has IDs and IDREF targets, each its document's;
 *   their projection {@link AssembledId}, each binding carried, under "DocumentId key" over the
 *   assembly (a fragment's ID distinct from its item's, and a fragment placed twice in one item
 *   holding its IDs twice; a section document placed twice in a test, once, reading 86); and "Idref
 *   target" over the assembly, so an item's IDREF may name its fragment's ID and a fragment's its
 *   item's;
 * - **DocumentLang:** each `xml:lang` copied into its `XmlLang` row and each row an attribute's, the
 *   counted family over the carriers outside every catalog, and each form carried (`E1_derived`);
 *   and each assessment object's `ObjectLang` (`#pantry/qti/metadata.ts`) an attribute's, through
 *   `Attribute`'s key at `xml:lang` (the one-way rule), its element an assessment object's root by
 *   its containment into `AssessmentObject`;
 * - **CatalogScope:** each `XmlLang` on its scope's row, each scope on its element's {@link nodeRef}
 *   tuple, a `qti-catalog-info` its own scope, a root that is none the document node's and every
 *   other element its parent's (`E1_derived`);
 * - **ResourceLomLanguageSet:** each general category's `lom:language` copied into its `LomLanguage`
 *   row, its category its parent and its language its string value, and each row an element's; its
 *   tag the value case-folded, the counted family over the tags, and each language listed
 *   (`E1_derived`);
 * - **R26:** in place, each item instance's carriers placed and counted against its document's, and
 *   each assembly form's carriers counted; R26 itself reads the documents the records name, so it
 *   is a rule over a query (`identityQueryLawsByName`, `#pantry/qti/queries.ts`);
 * - **Reading 3:** each read SSML attribute copied into its {@link SsmlAttribute} row, both ways, its
 *   value its lexical form collapsed, and placed in its element's fragment; each fragment's values
 *   counted; each scope on its element's {@link nodeRef} tuple, a `speak` its own fragment, a root
 *   that is no `speak` the document node's and every other element its parent's;
 *   {@link ssmlTrimMark} and {@link ssmlLexiconReference};
 * - **Label tools:** each `label` that asks for its tool copied into its `LabelUse` row and each row
 *   a label's, its root kind its document's, and in an item each label's document one whose root
 *   carries `tool-name` and `tool-version`;
 * - **Manifest overlay:** each {@link ManifestId} and {@link ResourceId} row has its element's
 *   `identifier`, the way back of the copy `#pantry/qti/package.ts` states (C18): an ID-typed
 *   attribute at its element, of its kind (`cp:manifest` or `cp:resource`), in the manifest (type
 *   `manifest`). Each of the two kinds has one ID-typed attribute, its `identifier`, in every
 *   version, so this is the containment in the manifest's `identifier` selection, read through the
 *   key over the ID-typed attributes, with no second key over the narrower selection (the one-way
 *   rule; `#pantry/qti/identity.copyback.test.ts`).
 */
export const identityLawsByName = {
  "DocumentId key": [
    key(on(idAttributes, "package", "path", "start")),
    contained(
      on(namingIdAttributes, "package", "path", "start", "lexical"),
      on(DocumentId, "package", "path", "start", "lexical"),
    ),
    contained(
      on(attributeIds, "package", "path", "start"),
      on(namingIdAttributes, "package", "path", "start"),
    ),
    contained(
      on(idTexts, "package", "path", "start", "owner", "lexical"),
      on(DocumentId, "package", "path", "start", "owner", "lexical"),
    ),
    contained(on(textIds, "package", "path", "start"), on(idTexts, "package", "path", "start")),
    idBindingFamily,
    key(on(admittedBindings, "package", "path", "id")),
    key(on(AssembledId, "package", "assembly", "id")),
  ],
  "E1 derived": [
    check("E1_derived", DocumentId, (d) =>
      d.and(
        d.eq(d.lexical, Compute.concat(Compute.concat(d.before, d.id), d.after)),
        Compute.matches(d.id, idValuePattern),
      ),
    ),
    check("E1_derived", IdBinding, (b) => b.gt(b.carriers, 0n)),
    contained(
      on(DocumentId, "package", "path", "id", "owner", "admitted"),
      on(IdBinding, "package", "path", "id", "owner", "admitted"),
    ),
    contained(
      on(admittedIds, "package", "path", "start"),
      on(admittedNodes, "package", "path", "start"),
    ),
    contained(
      on(unadmittedIds, "package", "path", "start"),
      on(unadmittedNodes, "package", "path", "start"),
    ),
    contained(
      on(identityNodes, "package", "path", "start", "parent", "stringValue"),
      on(IdentityText, "package", "path", "start", "owner", "lexical"),
    ),
    contained(
      on(IdentityText, "package", "path", "start", "kind", "version", "governor"),
      on(Node, "package", "path", "start", "kind", "version", "governor"),
    ),
    textIdrefFamily,
    fold(
      textIdrefFamily,
      Monoid.concat,
      on(TextIdref, "package", "path", "start", "piece", "piecesWas", "piecesAfter"),
      on(IdentityText, "package", "path", "start", "idrefText"),
    ),
    check("E1_derived", IdentityText, (t) =>
      t.or(
        t.and(textIdentityIn(t, ["ID"]), t.eq(t.idrefs, 0n)),
        t.and(textIdentityIn(t, ["IDREF", "IDREFS"]), t.eq(t.lexical, t.idrefText)),
      ),
    ),
    check("E1_derived", TextIdref, (i) =>
      i.and(Compute.matches(i.token, idValuePattern), i.or(i.eq(i.at, 0n), i.ne(i.before, ""))),
    ),
    contained(
      on(IdrefTarget, "package", "path", "assembled"),
      on(Document, "package", "path", "assembled"),
    ),
    contained(
      on(ShareFragment, "package", "path", "assembled"),
      on(Document, "package", "path", "assembled"),
    ),
    idrefTargetFamily,
    documentIdFamily,
    placedIdFamily,
    assembledIdFamily,
    placedIdrefFamily,
    contained(
      on(PlacedId, "package", "assembly", "instance", "path", "assemblyKind"),
      on(Instance, "package", "assembly", "start", "document", "assemblyKind"),
    ),
    contained(
      on(PlacedId, "package", "path", "start", "id", "owner"),
      on(DocumentId, "package", "path", "start", "id", "owner"),
    ),
    check("E1_derived", PlacedId, (p) =>
      p.or(
        p.and(p.eq(p.assemblyKind, testKind), p.eq(p.copy, documentNode)),
        p.and(p.ne(p.assemblyKind, testKind), p.eq(p.copy, p.instance)),
      ),
    ),
    check("E1_derived", AssembledId, (a) => a.gt(a.carriers, 0n)),
    contained(
      on(PlacedIdref, "package", "assembly", "instance", "path"),
      on(Instance, "package", "assembly", "start", "document"),
    ),
    contained(on(PlacedIdref, "package", "path", "id"), on(IdrefTarget, "package", "path", "id")),
    contained(
      on(langAttributes, "package", "path", "start", "lexical"),
      on(XmlLang, "package", "path", "start", "lang"),
    ),
    contained(
      on(XmlLang, "package", "path", "start"),
      on(langAttributes, "package", "path", "start"),
    ),
    contained(
      on(ObjectLang, "package", "path", "start"),
      on(langAttributes, "package", "path", "start"),
    ),
    contained(
      on(XmlLang, "package", "path", "start", "scope"),
      on(CatalogScope, "package", "path", "start", "scope"),
    ),
    contained(
      on(bodyLangs, "package", "path", "start", "lang"),
      on(BodyXmlLang, "package", "path", "start", "lang"),
    ),
    contained(
      on(BodyXmlLang, "package", "path", "start"),
      on(bodyLangs, "package", "path", "start"),
    ),
    contained(
      on(bodyPlacedLangs, "package", "assembly", "instance", "start", "path", "lang"),
      on(PlacedBodyXmlLang, "package", "assembly", "instance", "start", "path", "lang"),
    ),
    contained(
      on(PlacedBodyXmlLang, "package", "assembly", "instance", "start"),
      on(bodyPlacedLangs, "package", "assembly", "instance", "start"),
    ),
    contained(
      on(CatalogScope, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", CatalogScope, (s) =>
      s.or(
        s.and(s.eq(s.kind, "qti-catalog-info"), s.eq(s.scope, s.start)),
        s.and(
          s.ne(s.kind, "qti-catalog-info"),
          s.eq(s.parent, documentNode),
          s.eq(s.scope, documentNode),
        ),
        s.and(s.ne(s.kind, "qti-catalog-info"), s.ne(s.parent, documentNode)),
      ),
    ),
    contained(
      on(inheritedCatalogScopes, "package", "path", "parent", "scope"),
      on(CatalogScope, "package", "path", "start", "scope"),
    ),
    langFamily,
    check("E1_derived", DocumentLang, (d) => d.gt(d.carriers, 0n)),
    contained(
      on(lomLanguages, "package", "path", "start", "parent", "stringValue"),
      on(LomLanguage, "package", "path", "start", "general", "lang"),
    ),
    contained(
      on(LomLanguage, "package", "path", "start"),
      on(lomLanguages, "package", "path", "start"),
    ),
    check("E1_derived", LomLanguage, (l) => l.eq(l.tag, Compute.lowerAscii(l.lang))),
    lomLanguageFamily,
    check("E1_derived", ResourceLomLanguageSet, (s) => s.gt(s.carriers, 0n)),
    documentLangFamily,
    placedLangFamily,
    assembledLangFamily,
    contained(
      on(PlacedXmlLang, "package", "assembly", "instance", "path"),
      on(Instance, "package", "assembly", "start", "document"),
    ),
    contained(
      on(PlacedXmlLang, "package", "path", "start", "lang", "scope"),
      on(XmlLang, "package", "path", "start", "lang", "scope"),
    ),
    check("E1_derived", AssembledLang, (a) => a.gt(a.carriers, 0n)),
    contained(
      on(ssmlAttributes, "package", "path", "start", "name", "kind", "lexical"),
      on(SsmlAttribute, "package", "path", "start", "name", "kind", "lexical"),
    ),
    contained(
      on(SsmlAttribute, "package", "path", "start", "name"),
      on(ssmlAttributes, "package", "path", "start", "name"),
    ),
    contained(
      on(SsmlAttribute, "package", "path", "start", "fragment"),
      on(SsmlScope, "package", "path", "start", "fragment"),
    ),
    check("E1_derived", SsmlAttribute, (s) =>
      s.and(
        s.eq(s.value, Compute.collapse(s.lexical)),
        s.or(
          s.and(s.eq(s.kind, "ssml:speak"), s.eq(s.refers, "ssml:mark")),
          s.and(s.eq(s.kind, "ssml:lookup"), s.eq(s.refers, "ssml:lexicon")),
          s.and(s.in(s.kind, ["ssml:mark", "ssml:lexicon"]), s.eq(s.refers, s.kind)),
        ),
      ),
    ),
    fragmentValueFamily,
    check("E1_derived", FragmentValue, (v) => v.gt(v.carriers, 0n)),
    contained(
      on(SsmlScope, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", SsmlScope, (s) =>
      s.or(
        s.and(s.eq(s.kind, "ssml:speak"), s.eq(s.fragment, s.start)),
        s.and(
          s.ne(s.kind, "ssml:speak"),
          s.eq(s.parent, documentNode),
          s.eq(s.fragment, documentNode),
        ),
        s.and(s.ne(s.kind, "ssml:speak"), s.ne(s.parent, documentNode)),
      ),
    ),
    contained(
      on(inheritedScopes, "package", "path", "parent", "fragment"),
      on(SsmlScope, "package", "path", "start", "fragment"),
    ),
    contained(
      on(shareSources, "package", "path", "start", "lexical"),
      on(ShareFragment, "package", "path", "start", "src"),
    ),
    contained(
      on(ShareFragment, "package", "path", "start"),
      on(shareSources, "package", "path", "start"),
    ),
    check("E1_derived", ShareFragment, (f) =>
      f.and(
        f.eq(Compute.startsWith(f.src, "#"), true),
        f.eq(Compute.endsWith(f.src, f.id), true),
        f.eq(Compute.charLength(f.src), Compute.add(Compute.charLength(f.id), 1)),
        Compute.matches(f.src, shareFragmentPattern),
      ),
    ),
  ],
  "Idref target": [
    contained(on(Idref, "package", "path", "token"), on(IdrefTarget, "package", "path", "id")),
    contained(on(TextIdref, "package", "path", "token"), on(IdrefTarget, "package", "path", "id")),
    contained(on(ShareFragment, "package", "path", "id"), on(IdrefTarget, "package", "path", "id")),
    contained(
      on(unassembledTargets, "package", "path", "id"),
      on(admittedBindings, "package", "path", "id"),
    ),
    contained(
      on(PlacedIdref, "package", "assembly", "id"),
      on(AssembledId, "package", "assembly", "id"),
    ),
  ],
  "Label tools": [
    contained(
      on(labelAttributes, "package", "path", "start"),
      on(LabelUse, "package", "path", "start"),
    ),
    contained(
      on(LabelUse, "package", "path", "start"),
      on(labelAttributes, "package", "path", "start"),
    ),
    contained(
      on(LabelUse, "package", "path", "rootKind"),
      on(Document, "package", "path", "rootKind"),
    ),
    key(on(toolNames, "package", "path")),
    key(on(toolVersions, "package", "path")),
    contained(on(itemLabels, "package", "path"), on(toolNames, "package", "path")),
    contained(on(itemLabels, "package", "path"), on(toolVersions, "package", "path")),
  ],
  "Manifest overlay": [
    contained(
      on(ManifestId, "package", "path", "start"),
      on(manifestIdAttributes("cp:manifest"), "package", "path", "start"),
    ),
    contained(
      on(ResourceId, "package", "path", "start"),
      on(manifestIdAttributes("cp:resource"), "package", "path", "start"),
    ),
  ],
  "SSML lexicon reference": [ssmlLexiconReference],
  "SSML trim mark": [ssmlTrimMark],
} as const;

/**
 * {@link identityLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const identityLaws = Object.values(identityLawsByName).flat();
