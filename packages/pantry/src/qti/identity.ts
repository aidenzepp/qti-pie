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
 * - **{@link IdBinding}** is the projection of the IDs onto (document, id, owner), keyed by its
 *   heading, and its key on (document, id) is cvc-id clause 2, "no ID/IDREF binding … whose
 *   [binding] has more than one member" (law "DocumentId key", rule `document-key`). An element
 *   whose two children are one ID's, or whose attribute and child are, is one binding, as the
 *   table's letter has it; the key over the ID-typed attributes' `node` is XML Schema's one ID
 *   attribute per element.
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
 *   general category of each record that names the document ({@link GeneralObject}: a `lom:lom` of
 *   the `cp:metadata` of a resource of an item or a test type whose `href` names it). A document no
 *   such category describes states nothing, so a resource whose record has no general category is
 *   not judged. It is a universal over pairs, stated by counts: {@link DocumentGenerals} counts the
 *   categories that describe a document, each language's {@link GeneralLang} witnesses count the
 *   categories that list it (`DocumentLang.generals`), and the two are equal. Q5.07 had culled the
 *   old one-sided flag `DocumentLang.lomGeneral` with a read in its place, on the orchestrator's
 *   ruling that R26 had no source; UP's audit found the source and the ruling is reversed, so the
 *   read is this refusal. In place (spec reading 117), an included fragment's elements are its
 *   item's body elements: each item instance's `xml:lang` carriers are placed under its assembly
 *   ({@link PlacedXmlLang}, as many as its document has, `Document.langs`), gathered per form
 *   ({@link AssembledLang}), and each form the assembly states is listed by every category that
 *   describes the item ({@link PlacedGeneralLang}, {@link assembledLang}). The binding counts "the
 *   associated assessmentItem ... and its 'bodyElements'", and a catalog is "outside the content
 *   body node" (information model §5.28), so R26 counts no `xml:lang` under a `qti-catalog-info`
 *   (reading R9-c): each {@link XmlLang} names its {@link CatalogScope}, read up the tree as
 *   {@link SsmlScope} reads a fragment, and {@link DocumentLang}, {@link AssembledLang} and their
 *   carriers count the carriers whose scope is their document. Every `xml:lang` keeps its row.
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
 * {@link GeneralLang}'s `value`. An empty `xml:lang`, or one of whitespace alone, states no
 * language ("there is no language information available", XML 1.0 §2.12), so it asks for no
 * listing; nor does a form that is no language tag once collapsed, which identifies no language
 * (RFC 5646 §2.1), so its value domain refuses it alone (spec reading 164,
 * {@link statedLanguagePattern}).
 *
 * Every copy of an attribute into an overlay follows C18 the other way round, from
 * `select(Attribute, φ)` into the overlay, beside a key over the same selection whose UNIQUE serves
 * the copy's reverse probe, so no index holds `Attribute.lexical`. Every copied text that takes
 * part in a cross-row equality is `keyText` (`#pantry/qti/limits.ts`): a value past its bound has
 * no overlay row, so its copy's foreign key refuses it beside the schema's one limit law.
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
  mirrors,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { languageTag } from "#pantry/grammar/attributes.ts";
import { ncNamePattern } from "#pantry/grammar/domains.ts";
import {
  AttributeGrammar,
  AttributeModelOf,
  AttributeName,
  AttributeSlotOf,
  Governor,
  Identity,
  NodeKind,
  SchemaVersion,
  TextDomain,
  toolLabelKinds,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Attribute, Idref, Space } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { ObjectLang, recordDocumentTypes } from "#pantry/qti/metadata.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { ManifestId, ResourceId } from "#pantry/qti/package.ts";
import { Instance, itemKind, testKind } from "#pantry/qti/tests.ts";

/**
 * XML whitespace `S`, possibly none: what an ID's lexical form holds around its value, the
 * language of `Space` (`#pantry/qti/attributes.ts`), the type its pieces are of.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const spacePattern = "^[\\t\\n\\r ]*$";

/**
 * A nonempty run holding no XML whitespace: an ID's value once its lexical form's outer whitespace
 * is set apart, and an IDREF token. That an ID's run is an NCName is its copy source's
 * ({@link namingPattern}); that an IDREF token is, AL1's lexical half over the attribute and
 * TextDomain's over the element's text.
 */
export const idValuePattern = "^[^\\t\\n\\r ]+$";

/**
 * A lexical form that names something once collapsed: an NCName (`ncNamePattern`) with XML
 * whitespace around it, which collapsing strips. Only such a form of an ID-typed attribute or text
 * is an ID value, `xs:ID` being a restriction of `xs:NCName`; any other form names nothing and has
 * no {@link DocumentId}, so its value domain refuses it alone (spec reading 156).
 */
export const namingPattern = `^[\\t\\n\\r ]*${ncNamePattern}[\\t\\n\\r ]*$`;

/**
 * An `xml:lang` form that states a language once collapsed: a well-formed BCP 47 tag
 * (`languageTag`, spec reading 129) with XML whitespace around it, which collapsing strips, since a
 * tag holds none. Any other form states no language and asks no record to list it: the empty one
 * and one of whitespace alone (XML 1.0 §2.12), and one that is no tag, which identifies no language
 * (RFC 5646 §2.1), so its value domain refuses it alone (spec reading 164).
 */
export const statedLanguagePattern = `^[\\t\\n\\r ]*(?:${languageTag})[\\t\\n\\r ]*$`;

/**
 * A same-document fragment reference: `#` and one or more characters (MathML 3 §4.2.7).
 */
const shareFragmentPattern = "^#.+$";

/**
 * The nil uuid: the start of the owner-axis copy of `document`, which every member's owner
 * replaces.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * The schema version whose item root's own `label` asks for the root's tools (spec reading 128):
 * QTI 3.0.1's §4.1.3 says of the item's `label` "If an item uses labels then values for the
 * associated toolName and toolVersion attributes must also be provided", where 3.0.0's §4.1.3 says
 * only "A human readable label that can be used to describe the Item".
 */
const labelledRootVersion = "3.0.1";

/**
 * One ID of a document, keyed by the node of the element that carries it: XML Schema gives a valid
 * element at most one attribute of an ID type, an attribute use's or a wildcard's (cvc-complex-type
 * clause 5, ct-props-correct clause 5), and a governor whose text is an ID's admits the four `xsi:`
 * attributes alone, so no element carries both.
 *
 * - **copied from the attribute or the text:** `node`, `document` and `lexical`, and for a text,
 *   `owner`, the element's parent;
 * - **the host's:** `before`, `id` and `after`, the lexical form split around its value, which
 *   `E1_derived` proves, and for an attribute, `owner`, the node itself: a row whose `owner` is its
 *   `node` is an attribute's, every other a text's.
 */
export const DocumentId = relation(
  "DocumentId",
  {
    after: Space,
    before: Space,
    document: uuid,
    id: keyText,
    lexical: keyText,
    node: uuid,
    owner: uuid,
  },
  ["node"],
);

/**
 * One binding of the ID/IDREF table, a projection keyed by its heading (sets ruling 2): an id of a
 * document and the element it is bound to, `carriers` the IDs that bind it.
 */
export const IdBinding = relation(
  "IdBinding",
  { carriers: drawn(natural), document: uuid, id: keyText, owner: uuid },
  ["document", "id", "owner"],
);

/**
 * One element whose text is of an identity type (C50), keyed by its node: its governing type's text
 * domain is an `xs:ID`, an `xs:IDREF` or an `xs:IDREFS` one (`ValueIdentity`), which only an
 * `xsi:type` gives an element in the pinned grammar.
 *
 * - **copied from the node:** `node`, `document`, `kind`, `version`, `governor`, `owner` (its parent)
 *   and `lexical`, its string value, `Node.stringValue`, which the string value's fold steps
 *   because TextDomain checks the text (`#pantry/qti/node.ts` `inCheckedText`);
 * - **drawn:** `idrefs`, its {@link TextIdref} count;
 * - **accumulated:** `idrefText`, the end of its tokens' concatenation.
 */
export const IdentityText = relation(
  "IdentityText",
  {
    document: uuid,
    governor: closedId(Governor),
    idrefText: accumulated(keyText, ""),
    idrefs: drawn(natural),
    kind: closedId(NodeKind),
    lexical: keyText,
    node: uuid,
    owner: uuid,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One IDREF token of an element whose text is an `xs:IDREF` or `xs:IDREFS` (C50), in order, with
 * the whitespace written before and after it, so its `piece` is a stretch of the text and the
 * pieces concatenate to it, as Q5.05's `Idref` splits an attribute's.
 *
 * - **the host's:** `before`, `token` and `after`;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step, a `keyText` whose
 *   domain refuses a piece past the bound;
 * - **the family's group:** `node`;
 * - **drawn:** `at`;
 * - **accumulated:** `document`, its element's, along the owner axis, which `Idref target` reads;
 *   `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const TextIdref = relation.generated(
  "TextIdref",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    document: accumulated(uuid, nilUuid),
    node: uuid,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "at"],
  (i) => ({
    piece: generated(keyText, Compute.concat(Compute.concat(i.before, i.token), i.after)),
  }),
);

/**
 * One element's `xml:lang`, keyed by the element's node: its document, the attribute's lexical
 * form, and `scope`, the element's {@link CatalogScope}, the member that carries a
 * {@link DocumentLang} value where that scope is the document.
 */
export const XmlLang = relation(
  "XmlLang",
  { document: uuid, lang: keyText, node: uuid, scope: uuid },
  ["node"],
);

/**
 * The `xml:lang` lexical forms a document carries, a projection keyed by its heading (sets ruling
 * 2): one row per (document, form), its `carriers` the elements that carry it, and `generals` the
 * general categories that list its language ({@link GeneralLang}).
 */
export const DocumentLang = relation(
  "DocumentLang",
  { carriers: drawn(natural), document: uuid, generals: drawn(natural), lang: keyText },
  ["document", "lang"],
);

/**
 * One language a LOM `general` category lists, keyed by its `lom:language` node: the category, its
 * parent; `lang`, the element's string value as written; and `tag`, that value case-folded
 * (`Compute.lowerAscii`, RFC 5646 §2.1.1), the member that carries a
 * {@link ResourceLomLanguageSet} value. `Node.stringValue` folds a `lom:language`'s characters
 * though no domain checks them, since it is one of `copiedTextKinds` (`#pantry/qti/node.ts`).
 */
export const LomLanguage = relation(
  "LomLanguage",
  { general: uuid, lang: keyText, node: uuid, tag: keyText },
  ["node"],
);

/**
 * The languages each LOM `general` category lists, a projection keyed by its heading: one row per
 * (category, language), the language its tag case-folded ({@link LomLanguage}'s `tag`), so two
 * listings that differ only in case are one language, and its `carriers` the `lom:language`
 * elements that list it.
 *
 * It is keyed by the category's node, not by a resource: one hop from a `lom:language` cannot tell
 * a resource's record from the manifest's, a file's or an external one. R26 reads the categories
 * of the records that name a document through {@link GeneralObject}.
 */
export const ResourceLomLanguageSet = relation(
  "ResourceLomLanguageSet",
  { carriers: drawn(natural), general: uuid, lang: keyText },
  ["general", "lang"],
);

/**
 * A general category of a record that names a document, keyed by its `lom:general` node, with that
 * document, the item or test whose languages it lists: exactly the rows of `NamingGeneral`
 * (`#pantry/qti/queries.ts`), both ways.
 *
 * It is a stored copy of that query, which the import writes, for one reason, gap G2 of the
 * grizzle cutover: {@link generalObjectFamily} counts it into `DocumentGenerals.generals`, and a
 * grizzle family reads tables only, so no family counts a live derived relation. R26 compares those
 * counts ({@link documentLang}, {@link assembledLang}), a universal over pairs that no containment
 * states. Once a counted family may read a derived relation, this is that query and nothing stores
 * it.
 */
export const GeneralObject = relation("GeneralObject", { document: uuid, general: uuid }, [
  "general",
]);

/**
 * A document, keyed by its node, with `generals`, the count of the general categories that describe
 * it ({@link GeneralObject}): the one total fact of how many categories each of its languages is
 * listed by, 0 for a document no naming record describes.
 */
export const DocumentGenerals = relation(
  "DocumentGenerals",
  { document: uuid, generals: drawn(natural) },
  ["document"],
);

/**
 * One language of a document that one of the general categories describing it lists, keyed by
 * (category, form): R26's witness.
 *
 * - `lang` is the document's `xml:lang` form ({@link DocumentLang}), one that states a language
 *   ({@link statedLanguagePattern}), and `value` its value collapsed and case-folded,
 *   `lowerAscii(collapse(lang))`;
 * - `value` is a language the category lists ({@link ResourceLomLanguageSet}).
 */
export const GeneralLang = relation(
  "GeneralLang",
  { document: uuid, general: uuid, lang: keyText, value: keyText },
  ["general", "lang"],
);

/**
 * One `label` on an element of a document that asks for its tool, keyed by the element's node
 * ({@link labelAttributes}, spec reading 128), with its document and the document's root kind,
 * which says whether Label tools binds it.
 */
export const LabelUse = relation(
  "LabelUse",
  { document: uuid, node: uuid, rootKind: closedId(NodeKind) },
  ["node"],
);

/**
 * An SSML attribute a reading 3 law reads, keyed by its element's node and its name: a `mark`'s
 * `name`, a `speak`'s `startmark` and `endmark`, a `lexicon`'s `xml:id` and a `lookup`'s `ref`.
 *
 * - **copied from the attribute:** `node`, `name`, `kind` (its element's) and `lexical`;
 * - **the host's:** `value`, the lexical form collapsed (`Compute.collapse`: an `xs:token`'s or an
 *   `xs:ID`'s whiteSpace), `refers`, the kind its value names (a trim a `mark`'s, a lookup a
 *   `lexicon`'s, a definition its own kind), and `fragment`, its element's {@link SsmlScope}.
 */
export const SsmlAttribute = relation(
  "SsmlAttribute",
  {
    fragment: uuid,
    kind: closedId(NodeKind),
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    refers: closedId(NodeKind),
    value: keyText,
  },
  ["node", "name"],
);

/**
 * One element on the way from an element an SSML law reads up to its SSML fragment, keyed by its
 * node (spec reading 3: "the document" is each `speak` fragment): its {@link nodeRef} tuple and
 * `fragment`, its nearest `ssml:speak`, itself included, or the document node for an element no
 * `speak` holds. A `speak` is its own fragment, a document's root the document's where it is no
 * `speak`, and every other element its parent's, so a fragment is read up the tree with no copy on
 * `Node`.
 */
export const SsmlScope = relation(
  "SsmlScope",
  {
    document: uuid,
    fragment: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One element on the way from an element that carries an `xml:lang` up to its catalog scope, keyed
 * by its node (spec reading R9-c: a catalog is outside the content body, so the language of its
 * cards, entries and HTML content is not the item's): its {@link nodeRef} tuple and `scope`, its
 * nearest `qti-catalog-info`, itself included, or the document node for an element no catalog
 * holds. A `qti-catalog-info` is its own scope, a document's root the document's where it is no
 * catalog info, and every other element its parent's, so a scope is read up the tree with no copy
 * on `Node`, as {@link SsmlScope} reads a fragment.
 */
export const CatalogScope = relation(
  "CatalogScope",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    scope: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The values each SSML fragment's attributes of each kind of element hold, a projection keyed by
 * its heading: one row per (fragment, element kind, value), its `carriers` the attributes that
 * hold it, so a `mark` name a fragment defines once has `carriers` 1.
 */
export const FragmentValue = relation(
  "FragmentValue",
  { carriers: drawn(natural), fragment: uuid, kind: closedId(NodeKind), value: keyText },
  ["fragment", "kind", "value"],
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
/**
 * An id a document's IDREF tokens name, a projection keyed by its heading (spec reading 117): every
 * `Idref` and `TextIdref` token's value, with its document's `assembled`. A document in no
 * assembly resolves each in its own IDs; one in an assembly, in its assembly's, once per instance
 * ({@link PlacedIdref}). Its rows count as `Document.idrefTargets`.
 */
export const IdrefTarget = relation(
  "IdrefTarget",
  { assembled: pg.boolean, document: uuid, id: keyText },
  ["document", "id"],
);

/**
 * One `m:share` whose `src` is a fragment of its own document, keyed by the element's node (MathML
 * 3 §4.2.7; a `src` that is `#` and a name stands in the same document): its document, `src` as
 * written (C18), and `id`, the text after the `#`, which an {@link IdrefTarget} of the document
 * names under "Idref target". A `src` with any text before its `#`, or no text after it, is no
 * same-document fragment and has no row.
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
    document: uuid,
    id: keyText,
    node: uuid,
    placements: drawn(natural),
    src: keyText,
  },
  ["node"],
);

/**
 * One ID of an instance of an assembly (Q5.13's `Instance`, spec reading 117), keyed by the
 * instance and the element that carries it: a {@link DocumentId} of the instance's document, with
 * the instance's assembly and assembly kind, and its `copy`: the instance, or under a test's
 * assembly its document, since a section document placed twice is written once there (reading 86),
 * and the element carrying the ID already names its document. Each value is an id the import mints.
 */
export const PlacedId = relation(
  "PlacedId",
  {
    assembly: uuid,
    assemblyKind: closedId(NodeKind),
    copy: uuid,
    document: uuid,
    id: keyText,
    instance: uuid,
    node: uuid,
    owner: uuid,
  },
  ["instance", "node"],
);

/**
 * One binding of an assembly's ID/IDREF table, a projection of {@link PlacedId} keyed by its
 * heading: an id, the element it is bound to, and the copy of the document that holds it,
 * `carriers` the placed IDs that bind it. Its key on `(assembly, id)` is cvc-id clause 2 over the
 * merged document ("DocumentId key"): an included fragment's ID is distinct from its item's, and a
 * fragment placed twice in one item holds its IDs twice, as its merged document does (information
 * model §2.12).
 */
export const AssembledId = relation(
  "AssembledId",
  { assembly: uuid, carriers: drawn(natural), copy: uuid, id: keyText, owner: uuid },
  ["assembly", "id", "owner", "copy"],
);

/**
 * One id an instance's document's IDREFs name (spec reading 117), keyed by the instance and the id:
 * an {@link IdrefTarget} of the instance's document, which resolves among its assembly's IDs
 * ("Idref target").
 */
export const PlacedIdref = relation(
  "PlacedIdref",
  { assembly: uuid, document: uuid, id: keyText, instance: uuid },
  ["instance", "id"],
);

/**
 * Each document's IDs, counted by `Document.ids`.
 */
export const documentIdFamily = counted(on(DocumentId, "document"), fin(Document, "ids"));

/**
 * Each document's IDREF targets, counted by `Document.idrefTargets`.
 */
export const idrefTargetFamily = counted(
  on(IdrefTarget, "document"),
  fin(Document, "idrefTargets"),
);

/**
 * Each instance's IDs, counted by `Instance.ids`, its document's count.
 */
export const placedIdFamily = counted(on(PlacedId, "instance"), fin(Instance, "ids"));

/**
 * Each assembly's ID bindings, counted by `AssembledId.carriers`.
 */
export const assembledIdFamily = counted(
  on(PlacedId, "assembly", "id", "owner", "copy"),
  fin(AssembledId, "carriers"),
);

/**
 * Each instance's IDREF targets, counted by `Instance.idrefTargets`, its document's count.
 */
export const placedIdrefFamily = counted(
  on(PlacedIdref, "instance"),
  fin(Instance, "idrefTargets"),
);

/**
 * One `xml:lang` outside every catalog (R9-c), keyed by its element's node: an {@link XmlLang}
 * whose scope is its document, the member a counted family can count, as a family counts a relation
 * and no selection. R26's forms are these.
 */
export const BodyXmlLang = relation("BodyXmlLang", { document: uuid, lang: keyText, node: uuid }, [
  "node",
]);

/**
 * One `xml:lang` of an instance of an item's assembly (Q5.13's `Instance`, spec reading 117), keyed
 * by the instance and the element's node: an {@link XmlLang} of the instance's document, under the
 * assembly, with its `scope`. An included fragment's elements are its item's body elements in
 * place, so their languages are among those R26 holds the item's records to list, those a catalog
 * holds aside.
 */
export const PlacedXmlLang = relation(
  "PlacedXmlLang",
  { assembly: uuid, document: uuid, instance: uuid, lang: keyText, node: uuid, scope: uuid },
  ["instance", "node"],
);

/**
 * One `xml:lang` of an instance of an item's assembly outside every catalog (R9-c), keyed as
 * {@link PlacedXmlLang} is: a placed `xml:lang` whose scope is its document, the member the
 * assembly's family counts.
 */
export const PlacedBodyXmlLang = relation(
  "PlacedBodyXmlLang",
  { assembly: uuid, document: uuid, instance: uuid, lang: keyText, node: uuid },
  ["instance", "node"],
);

/**
 * The `xml:lang` forms an item's assembly carries, a projection keyed by its heading: one row per
 * (assembly, form), its `carriers` the placed elements that carry it, and `generals` the general
 * categories describing the item that list its language ({@link PlacedGeneralLang}), as
 * {@link DocumentLang} is a document's.
 */
export const AssembledLang = relation(
  "AssembledLang",
  { assembly: uuid, carriers: drawn(natural), generals: drawn(natural), lang: keyText },
  ["assembly", "lang"],
);

/**
 * One language of an item's assembly that one of the general categories describing the item lists,
 * keyed by (category, form): R26's witness in place, as {@link GeneralLang} is a document's.
 */
export const PlacedGeneralLang = relation(
  "PlacedGeneralLang",
  { assembly: uuid, general: uuid, lang: keyText, value: keyText },
  ["general", "lang"],
);

/**
 * Each document's `xml:lang` carriers, counted by `Document.langs`.
 */
export const documentLangFamily = counted(on(XmlLang, "document"), fin(Document, "langs"));

/**
 * Each item instance's `xml:lang` carriers, counted by `Instance.langs`, its document's count.
 */
export const placedLangFamily = counted(on(PlacedXmlLang, "instance"), fin(Instance, "langs"));

/**
 * The placed `xml:lang`s that R26 counts: those of elements outside every catalog, whose scope is
 * their document (R9-c), the source of {@link PlacedBodyXmlLang}.
 */
const bodyPlacedLangs = select(PlacedXmlLang, (p) => p.eq(p.scope, p.document));

/**
 * The placed elements outside every catalog that carry each assembly's forms, counted by
 * `AssembledLang.carriers`.
 */
export const assembledLangFamily = counted(
  on(PlacedBodyXmlLang, "assembly", "lang"),
  fin(AssembledLang, "carriers"),
);

/**
 * The general categories that list each assembly form's language, counted by
 * `AssembledLang.generals`.
 */
export const placedGeneralLangFamily = counted(
  on(PlacedGeneralLang, "assembly", "lang"),
  fin(AssembledLang, "generals"),
);

export const identityRelations = {
  AssembledId,
  AssembledLang,
  BodyXmlLang,
  CatalogScope,
  DocumentGenerals,
  DocumentId,
  DocumentLang,
  FragmentValue,
  GeneralLang,
  GeneralObject,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedBodyXmlLang,
  PlacedGeneralLang,
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
 * State that an attribute's identity type is one of `identities`: its value domain under its
 * element's governor has a `ValueIdentity` row, and that row names one of them. A domain of no
 * identity has no row, so the statement is false of it; a name the governor does not admit has no
 * domain, so the statement is absent there, and AL1 refuses the attribute.
 *
 * @param a - The row.
 * @param identities - The identity types.
 * @returns The predicate.
 */
const identityIn = (a: AttributeRow, identities: readonly IdentityHandle[]) => {
  const model = AttributeModelOf.at("model", a.version, a.governor);
  const domain = AttributeGrammar.at("domain", model, AttributeSlotOf.at("slot", model, a.name));

  return a.and(ValueIdentity.has(domain), a.in(ValueIdentity.at("identity", domain), identities));
};

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
 * The ID-typed attributes, whatever their value, which the key over `node` holds to one per
 * element: XML Schema gives a valid element at most one attribute of an ID type (cvc-complex-type
 * clause 5), a statement of types, not of values.
 */
export const idAttributes = select(Attribute, idTyped);

/**
 * The ID-typed attributes whose value is one of their document's IDs: those whose lexical form
 * names something once collapsed ({@link namingPattern}), each the source of a {@link DocumentId}.
 * Its conditions include every one of {@link idAttributes}', whose key over `node` holds it to one
 * per element, so it needs no key of its own: grizzle keys a containment's target by a key whose
 * selection's conditions are all the target's (README, "Keys"), and installs the UNIQUE each copy
 * back into it references, a {@link DocumentId}'s and a `th`'s `TableHeader`'s at its kind
 * (`#pantry/qti/html.ts`).
 */
export const namingIdAttributes = select(Attribute, (a) =>
  a.and(idTyped(a), Compute.matches(a.lexical, namingPattern)),
);

/**
 * The ID values of one element kind: the {@link namingIdAttributes} of that kind, which a `th`'s
 * `TableHeader` copies back into (`#pantry/qti/html.ts`). Its conditions include every one of
 * {@link idAttributes}', whose key over `node` holds it, and its kind is a field it fixes to a value
 * beyond its terms, so it needs no key of its own (grizzle's fixed target, at `3cc8fbd`).
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
 * into. Its conditions include every one of {@link idAttributes}', whose key over `node` holds it,
 * and its kind and document type are fields it fixes to values beyond its terms, so it needs no key
 * of its own (grizzle's fixed target, at `3cc8fbd`).
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
 * The IDs an attribute carries: those whose owner is their own node.
 */
const attributeIds = select(DocumentId, (d) => d.eq(d.owner, d.node));

/**
 * The IDs an element's text carries: those bound to another element, its parent.
 */
const textIds = select(DocumentId, (d) => d.ne(d.owner, d.node));

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
 * (`recordDocumentTypes`), the source of {@link LomLanguage}: its id, its parent and its string
 * value.
 */
const lomLanguages = select(Node, (n) =>
  n.and(
    n.in(n.documentType, recordDocumentTypes),
    n.eq(n.kind, "lom:language"),
    n.eq(n.parentKind, "lom:general"),
  ),
);

/**
 * The forms that state a language ({@link statedLanguagePattern}): every `xml:lang` that is a
 * language tag once collapsed.
 */
const statedLangs = select(DocumentLang, (d) => Compute.matches(d.lang, statedLanguagePattern));

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
  s.and(s.ne(s.kind, "ssml:speak"), s.ne(s.parent, s.document)),
);

/**
 * The scopes a catalog scope is read from the parent: every element but a `qti-catalog-info` and a
 * document's root.
 */
const inheritedCatalogScopes = select(CatalogScope, (s) =>
  s.and(s.ne(s.kind, "qti-catalog-info"), s.ne(s.parent, s.document)),
);

/**
 * The labels Label tools binds: those in a document whose root is an item's.
 */
const itemLabels = select(LabelUse, (l) => l.eq(l.rootKind, itemKind));

/**
 * The IDs that bind each (document, id, owner), counted by `IdBinding.carriers`.
 */
export const idBindingFamily = counted(
  on(DocumentId, "document", "id", "owner"),
  fin(IdBinding, "carriers"),
);

/**
 * Each IDREF or IDREFS element's tokens in order, counted by `IdentityText.idrefs`.
 */
export const textIdrefFamily = ordered(on(TextIdref, "node", "at"), fin(IdentityText, "idrefs"));

/**
 * The `xml:lang`s that R26 counts: those of elements outside every catalog, whose scope is their
 * document (R9-c), the source of {@link BodyXmlLang}. Every `xml:lang` keeps its {@link XmlLang}
 * row; only this selection narrows.
 */
const bodyLangs = select(XmlLang, (x) => x.eq(x.scope, x.document));

/**
 * The elements outside every catalog that carry each document's `xml:lang` forms, counted by
 * `DocumentLang.carriers`.
 */
export const langFamily = counted(
  on(BodyXmlLang, "document", "lang"),
  fin(DocumentLang, "carriers"),
);

/**
 * The `lom:language` elements that list each category's languages, counted by
 * `ResourceLomLanguageSet.carriers`.
 */
export const lomLanguageFamily = counted(
  on(LomLanguage, "general", "tag"),
  fin(ResourceLomLanguageSet, "carriers"),
);

/**
 * The general categories that describe each document, counted by `DocumentGenerals.generals`.
 */
export const generalObjectFamily = counted(
  on(GeneralObject, "document"),
  fin(DocumentGenerals, "generals"),
);

/**
 * The general categories that list each document form's language, counted by
 * `DocumentLang.generals`.
 */
export const generalLangFamily = counted(
  on(GeneralLang, "document", "lang"),
  fin(DocumentLang, "generals"),
);

/**
 * R26 (law "Document lang", rule `document-lang`): each form that states a language counts as many
 * listing categories as describe its document. A {@link GeneralLang} witness names a category of
 * the document and a language that category lists, one per category (its key), so the counts are
 * equal exactly when every category lists it.
 */
export const documentLang = contained(
  on(statedLangs, "document", "generals"),
  on(DocumentGenerals, "document", "generals"),
);

/**
 * The forms of an item's assembly that state a language, as {@link statedLangs} are a document's.
 */
const statedAssembledLangs = select(AssembledLang, (a) =>
  Compute.matches(a.lang, statedLanguagePattern),
);

/**
 * R26 in place (law "Document lang", spec reading 117): each form an item's assembly states, its
 * included fragments' among them, counts as many listing categories as describe the item.
 */
export const assembledLang = contained(
  on(statedAssembledLangs, "assembly", "generals"),
  on(DocumentGenerals, "document", "generals"),
);

/**
 * The attributes that hold each fragment's values, counted by `FragmentValue.carriers`.
 */
export const fragmentValueFamily = counted(
  on(SsmlAttribute, "fragment", "kind", "value"),
  fin(FragmentValue, "carriers"),
);

/**
 * Spec reading 3's trims (law "SSML trim mark", rule `ssml-fragment`; SSML 1.1 §3.1.1.1: "Only
 * markers defined once in the document, i.e. that are unique, are permitted as the value of either
 * startmark or endmark"): a `speak`'s `startmark` and `endmark` each name a `mark` its own
 * fragment defines exactly once. A mark name may otherwise repeat.
 *
 * A trim stands on its `speak`, which is its own fragment ({@link SsmlScope}), so the statement
 * reads the trim's `node` where {@link ssmlLexiconReference} reads `fragment`: the two say the
 * same of a trim, and the distinct sides keep the two laws' identities apart, since an identity
 * drops a side's selection.
 */
export const ssmlTrimMark = contained(
  on(trims, "node", "refers", "value"),
  on(onceHeld, "fragment", "kind", "value"),
);

/**
 * Spec reading 3's lookups (law "SSML lexicon reference", rule `ssml-fragment`; SSML 1.1 §3.1.5.2:
 * "The ref attribute specifies a name that references a lexicon document as assigned by the xml:id
 * attribute of the lexicon element"; §3.1.5.1: "The scope of this name is the current SSML
 * document"): a `lookup`'s `ref` names a `lexicon` of its own fragment.
 */
export const ssmlLexiconReference = contained(
  on(lookups, "fragment", "refers", "value"),
  on(FragmentValue, "fragment", "kind", "value"),
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
 * - **IdBinding:** the projection's counted family, each binding carried, and "DocumentId key";
 * - **IdentityText:** each element whose text is of an identity type copied into its row with its
 *   string value and its parent, and each row such an element's, its IDREF tokens concatenating to
 *   its text and an ID's none (`E1_derived`);
 * - **Idref target:** each IDREF token, an attribute's or a text's, names one of its document's
 *   {@link IdrefTarget} rows, each an id of its document where the document is in no assembly;
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
 *   the key over every `xml:lang` (the one-way rule), its node an assessment object's root by its
 *   counted family;
 * - **CatalogScope:** each `XmlLang` on its scope's row, each scope on its node's {@link nodeRef}
 *   tuple, a `qti-catalog-info` its own scope, a root that is none the document's and every other
 *   element its parent's (`E1_derived`);
 * - **ResourceLomLanguageSet:** each general category's `lom:language` copied into its `LomLanguage`
 *   row, its category its parent and its language its string value, and each row an element's; its
 *   tag the value case-folded, the counted family over the tags, and each language listed
 *   (`E1_derived`);
 * - **R26:** each document with its count of the categories that describe it, each a
 *   {@link GeneralObject} (held to the records that name it by the rule over `NamingGeneral` in
 *   `#pantry/qti/queries.ts`); each witness a category's of its document, listing its form's value
 *   collapsed and case-folded; and {@link documentLang}; in place, each item instance's carriers
 *   placed and counted against its document's, each assembly form's carriers and listing categories
 *   counted, each witness a category's of the item, listing its form's value; and
 *   {@link assembledLang};
 * - **Reading 3:** each read SSML attribute copied into its {@link SsmlAttribute} row, both ways, its
 *   value its lexical form collapsed, and placed in its element's fragment; each fragment's values
 *   counted; each scope on its node's {@link nodeRef} tuple, a `speak` its own fragment, a root
 *   that is no `speak` the document's and every other element its parent's; {@link ssmlTrimMark}
 *   and {@link ssmlLexiconReference};
 * - **Label tools:** each `label` that asks for its tool copied into its `LabelUse` row and each row
 *   a label's, its root kind its document's, and in an item each label's document one whose root
 *   carries `tool-name` and `tool-version`;
 * - **Manifest overlay:** each {@link ManifestId} and {@link ResourceId} row has its node's
 *   `identifier`, the way back of the copy `#pantry/qti/package.ts` states (C18): an ID-typed
 *   attribute at its node, of its kind (`cp:manifest` or `cp:resource`), in the manifest (type
 *   `manifest`). Each of the two kinds has one ID-typed attribute, its `identifier`, in every
 *   version, so this is the containment in the manifest's `identifier` selection, read through the
 *   key over the ID-typed attributes, with no second key over the narrower selection (the one-way
 *   rule; `#pantry/qti/identity.copyback.test.ts`).
 */
export const identityLawsByName = {
  "Document lang": [
    contained(on(GeneralLang, "general", "value"), on(ResourceLomLanguageSet, "general", "lang")),
    documentLang,
    contained(
      on(PlacedGeneralLang, "general", "value"),
      on(ResourceLomLanguageSet, "general", "lang"),
    ),
    assembledLang,
  ],
  "DocumentId key": [
    key(on(idAttributes, "node")),
    contained(
      on(namingIdAttributes, "node", "document", "lexical"),
      on(DocumentId, "node", "document", "lexical"),
    ),
    contained(on(attributeIds, "node"), on(namingIdAttributes, "node")),
    contained(
      on(idTexts, "node", "document", "owner", "lexical"),
      on(DocumentId, "node", "document", "owner", "lexical"),
    ),
    contained(on(textIds, "node"), on(idTexts, "node")),
    idBindingFamily,
    key(on(IdBinding, "document", "id")),
    key(on(AssembledId, "assembly", "id")),
    key(on(langAttributes, "node")),
    key(on(labelAttributes, "node")),
    key(on(shareSources, "node")),
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
      on(identityNodes, "id", "document", "parent", "stringValue"),
      on(IdentityText, "node", "document", "owner", "lexical"),
    ),
    contained(
      on(IdentityText, "node", "kind", "version", "document", "governor"),
      on(Node, "id", "kind", "version", "document", "governor"),
    ),
    textIdrefFamily,
    contained(on(TextIdref, "node", "document"), on(IdentityText, "node", "document")),
    fold(
      textIdrefFamily,
      Monoid.concat,
      on(TextIdref, "node", "piece", "piecesWas", "piecesAfter"),
      on(IdentityText, "node", "idrefText"),
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
    contained(on(IdrefTarget, "document", "assembled"), on(Document, "node", "assembled")),
    contained(on(ShareFragment, "document", "assembled"), on(Document, "node", "assembled")),
    idrefTargetFamily,
    documentIdFamily,
    placedIdFamily,
    assembledIdFamily,
    placedIdrefFamily,
    contained(
      on(PlacedId, "instance", "document", "assembly", "assemblyKind"),
      on(Instance, "id", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(PlacedId, "node", "document", "id", "owner"),
      on(DocumentId, "node", "document", "id", "owner"),
    ),
    check("E1_derived", PlacedId, (p) =>
      p.or(
        p.and(p.eq(p.assemblyKind, testKind), p.eq(p.copy, p.document)),
        p.and(p.ne(p.assemblyKind, testKind), p.eq(p.copy, p.instance)),
      ),
    ),
    check("E1_derived", AssembledId, (a) => a.gt(a.carriers, 0n)),
    contained(
      on(PlacedIdref, "instance", "document", "assembly"),
      on(Instance, "id", "document", "assembly"),
    ),
    contained(on(PlacedIdref, "document", "id"), on(IdrefTarget, "document", "id")),
    contained(
      on(langAttributes, "node", "document", "lexical"),
      on(XmlLang, "node", "document", "lang"),
    ),
    contained(on(XmlLang, "node"), on(langAttributes, "node")),
    contained(on(ObjectLang, "node"), on(langAttributes, "node")),
    contained(on(XmlLang, "node", "scope"), on(CatalogScope, "node", "scope")),
    contained(
      on(bodyLangs, "node", "document", "lang"),
      on(BodyXmlLang, "node", "document", "lang"),
    ),
    contained(on(BodyXmlLang, "node"), on(bodyLangs, "node")),
    key(on(bodyLangs, "node")),
    key(on(bodyPlacedLangs, "instance", "node")),
    contained(
      on(bodyPlacedLangs, "instance", "node", "assembly", "document", "lang"),
      on(PlacedBodyXmlLang, "instance", "node", "assembly", "document", "lang"),
    ),
    contained(on(PlacedBodyXmlLang, "instance", "node"), on(bodyPlacedLangs, "instance", "node")),
    contained(
      on(CatalogScope, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", CatalogScope, (s) =>
      s.or(
        s.and(s.eq(s.kind, "qti-catalog-info"), s.eq(s.scope, s.node)),
        s.and(
          s.ne(s.kind, "qti-catalog-info"),
          s.eq(s.parent, s.document),
          s.eq(s.scope, s.document),
        ),
        s.and(s.ne(s.kind, "qti-catalog-info"), s.ne(s.parent, s.document)),
      ),
    ),
    contained(on(inheritedCatalogScopes, "parent", "scope"), on(CatalogScope, "node", "scope")),
    langFamily,
    check("E1_derived", DocumentLang, (d) => d.gt(d.carriers, 0n)),
    contained(
      on(lomLanguages, "id", "parent", "stringValue"),
      on(LomLanguage, "node", "general", "lang"),
    ),
    contained(on(LomLanguage, "node"), on(lomLanguages, "id")),
    check("E1_derived", LomLanguage, (l) => l.eq(l.tag, Compute.lowerAscii(l.lang))),
    lomLanguageFamily,
    check("E1_derived", ResourceLomLanguageSet, (s) => s.gt(s.carriers, 0n)),
    mirrors(on(DocumentGenerals, "document"), on(Document, "node")),
    generalObjectFamily,
    generalLangFamily,
    contained(on(GeneralLang, "general", "document"), on(GeneralObject, "general", "document")),
    check("E1_derived", GeneralLang, (g) =>
      g.and(
        g.eq(g.value, Compute.lowerAscii(Compute.collapse(g.lang))),
        Compute.matches(g.lang, statedLanguagePattern),
      ),
    ),
    documentLangFamily,
    placedLangFamily,
    assembledLangFamily,
    placedGeneralLangFamily,
    contained(
      on(PlacedXmlLang, "instance", "document", "assembly"),
      on(Instance, "id", "document", "assembly"),
    ),
    contained(
      on(PlacedXmlLang, "node", "document", "lang", "scope"),
      on(XmlLang, "node", "document", "lang", "scope"),
    ),
    check("E1_derived", AssembledLang, (a) => a.gt(a.carriers, 0n)),
    contained(
      on(PlacedGeneralLang, "general", "assembly"),
      on(GeneralObject, "general", "document"),
    ),
    check("E1_derived", PlacedGeneralLang, (g) =>
      g.and(
        g.eq(g.value, Compute.lowerAscii(Compute.collapse(g.lang))),
        Compute.matches(g.lang, statedLanguagePattern),
      ),
    ),
    key(on(ssmlAttributes, "node", "name")),
    contained(
      on(ssmlAttributes, "node", "name", "kind", "lexical"),
      on(SsmlAttribute, "node", "name", "kind", "lexical"),
    ),
    contained(on(SsmlAttribute, "node", "name"), on(ssmlAttributes, "node", "name")),
    contained(on(SsmlAttribute, "node", "fragment"), on(SsmlScope, "node", "fragment")),
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
      on(SsmlScope, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", SsmlScope, (s) =>
      s.or(
        s.and(s.eq(s.kind, "ssml:speak"), s.eq(s.fragment, s.node)),
        s.and(s.ne(s.kind, "ssml:speak"), s.eq(s.parent, s.document), s.eq(s.fragment, s.document)),
        s.and(s.ne(s.kind, "ssml:speak"), s.ne(s.parent, s.document)),
      ),
    ),
    contained(on(inheritedScopes, "parent", "fragment"), on(SsmlScope, "node", "fragment")),
    contained(
      on(shareSources, "node", "document", "lexical"),
      on(ShareFragment, "node", "document", "src"),
    ),
    contained(on(ShareFragment, "node"), on(shareSources, "node")),
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
    contained(on(Idref, "document", "token"), on(IdrefTarget, "document", "id")),
    contained(on(TextIdref, "document", "token"), on(IdrefTarget, "document", "id")),
    contained(on(ShareFragment, "document", "id"), on(IdrefTarget, "document", "id")),
    contained(on(unassembledTargets, "document", "id"), on(IdBinding, "document", "id")),
    contained(on(PlacedIdref, "assembly", "id"), on(AssembledId, "assembly", "id")),
  ],
  "Label tools": [
    contained(on(labelAttributes, "node", "document"), on(LabelUse, "node", "document")),
    contained(on(LabelUse, "node"), on(labelAttributes, "node")),
    contained(on(LabelUse, "document", "rootKind"), on(Document, "node", "rootKind")),
    key(on(toolNames, "document")),
    key(on(toolVersions, "document")),
    contained(on(itemLabels, "document"), on(toolNames, "document")),
    contained(on(itemLabels, "document"), on(toolVersions, "document")),
  ],
  "Manifest overlay": [
    contained(on(ManifestId, "node"), on(manifestIdAttributes("cp:manifest"), "node")),
    contained(on(ResourceId, "node"), on(manifestIdAttributes("cp:resource"), "node")),
  ],
  "SSML lexicon reference": [ssmlLexiconReference],
  "SSML trim mark": [ssmlTrimMark],
} as const;

/**
 * {@link identityLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const identityLaws = Object.values(identityLawsByName).flat();
