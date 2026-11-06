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
 *   [children]").
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
 *   carry it, and nothing here names a kind.
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
 *   general category of each record that names the document (Q5.12's `LomObject`: a `lom:lom` of
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
 *   describes the item ({@link PlacedGeneralLang}, {@link assembledLang}).
 * - **Reading 3** (rule `ssml-fragment`): SSML's "document" is each `speak` fragment. A `speak`'s
 *   `startmark` and `endmark` name a `mark` its fragment defines exactly once (law "SSML trim
 *   mark", SSML 1.1 §3.1.1.1), and a `lookup`'s `ref` a `lexicon` of its fragment (law "SSML
 *   lexicon reference", §3.1.5.1); a mark name may otherwise repeat, and fragments see none of each
 *   other's names. {@link SsmlAttribute} holds the attributes the two laws read,
 *   {@link FragmentValue} each fragment's values by element kind, and {@link SsmlScope} each
 *   element's fragment, read up the tree from the elements those attributes stand on, so `Node`
 *   carries no copy of it. A name is compared with its outer whitespace set apart, a named
 *   weakening of an `xs:token`'s collapse (G-text below).
 * - **Label tools** (rule `label-tool`): an item that labels an element of its content names the tool
 *   that labelled it, by both `tool-name` and `tool-version` on its root ({@link LabelUse}).
 *
 * **Language equality, a named weakening until grizzle's text terms grow.** A language is the one
 * a tag names: `xml:lang` is an `xs:language`, compared by its value, its lexical form collapsed
 * (XML Schema 1.0 Part 2 §3.3.3, whiteSpace `collapse` from `xs:token`), and a LOM `language` a
 * `CharacterString`, an `xs:string` compared as written; BCP 47 compares tags without regard to
 * case ("At all times, language tags and their subtags … are to be treated as case insensitive",
 * RFC 5646 §2.1.1, which XML 1.0 §2.12 names for `xml:lang`). grizzle's `Compute` has no case fold
 * (Q5.12's `lom-title` meets the same), so tags are compared exactly here, and the law
 * over-refuses a document language that differs from a listed one only by case. Marker `G-text`
 * below names the place `Compute.lowerAscii` replaces. An empty `xml:lang`, or one of whitespace
 * alone, states no language ("there is no language information available", XML 1.0 §2.12), so it
 * asks for no listing.
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
  key,
  mirrors,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  AttributeGrammar,
  AttributeName,
  GoverningOf,
  NodeKind,
  ResourceType,
  SchemaVersion,
  TextDomain,
  TypeName,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Attribute, Idref } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { keyText } from "#pantry/qti/limits.ts";
import {
  LomGeneral,
  LomObject,
  LomRecord,
  ResourceLomGeneral,
  trimmedPattern,
} from "#pantry/qti/metadata.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { Instance, testKind } from "#pantry/qti/tests.ts";

/**
 * XML whitespace `S`, possibly none: what an ID's lexical form holds around its value.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const spacePattern = "^[\\t\\n\\r ]*$";

/**
 * The text type of {@link spacePattern}.
 */
const Space = str.regex(spacePattern);

/**
 * A nonempty run holding no XML whitespace: an ID's value once its lexical form's outer whitespace
 * is set apart, and an IDREF token. That the run is an NCName is AL1's lexical half over the
 * attribute, and TextDomain's over the element's text.
 */
export const idValuePattern = "^[^\\t\\n\\r ]+$";

/**
 * The nil uuid: the start of the owner-axis copy of `document`, which every member's owner
 * replaces.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * The kind of an item document's root: the one element whose own `label` asks for no tool, and the
 * one whose `tool-name` and `tool-version` a label asks for.
 */
const itemRoot = "qti-assessment-item";

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
 * - **copied from the node:** `node`, `document`, `kind`, `version`, `governs`, `owner` (its parent)
 *   and `lexical`, its string value, `Node.stringValue`, which the string value's fold steps
 *   because TextDomain checks the text (`#pantry/qti/node.ts` `inCheckedText`);
 * - **drawn:** `idrefs`, its {@link TextIdref} count;
 * - **accumulated:** `idrefText`, the end of its tokens' concatenation.
 */
export const IdentityText = relation(
  "IdentityText",
  {
    document: uuid,
    governs: closedId(TypeName),
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
 * - **the host's:** `before`, `token` and `after`, and `piece`, `before ‖ token ‖ after`, which
 *   `E1_derived` proves; it is written, since a concat fold's accumulators are of its step's type;
 * - **the family's group:** `node`;
 * - **drawn:** `at`;
 * - **accumulated:** `document`, its element's, along the owner axis, which `Idref target` reads;
 *   `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const TextIdref = relation(
  "TextIdref",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    document: accumulated(uuid, nilUuid),
    node: uuid,
    piece: keyText,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "at"],
);

/**
 * One element's `xml:lang`, keyed by the element's node: its document and the attribute's lexical
 * form, the member that carries a {@link DocumentLang} value.
 */
export const XmlLang = relation("XmlLang", { document: uuid, lang: keyText, node: uuid }, ["node"]);

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
 * parent, and the element's string value, the member that carries a
 * {@link ResourceLomLanguageSet} value. `Node.stringValue` folds a `lom:language`'s characters
 * though no domain checks them, since it is one of `copiedTextKinds` (`#pantry/qti/node.ts`).
 */
export const LomLanguage = relation("LomLanguage", { general: uuid, lang: keyText, node: uuid }, [
  "node",
]);

/**
 * The languages each LOM `general` category lists, a projection keyed by its heading: one row per
 * (category, language), its `carriers` the `lom:language` elements that list it.
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
 * A resource's LOM general category, keyed by its `lom:general` node: its record, and `named`, the
 * type of the document the record names (Q5.12's `LomRecord.named`), `none` for a record that
 * names none. It is exactly Q5.12's `ResourceLomGeneral` rows, both ways, so a selection reads the
 * categories R26 binds.
 */
export const GeneralNamed = relation(
  "GeneralNamed",
  { general: uuid, named: closedId(ResourceType), record: uuid },
  ["general"],
);

/**
 * A general category of a record that names a document, keyed by its `lom:general` node: its
 * record and that document (Q5.12's `LomObject`), the item or test whose languages it lists.
 */
export const GeneralObject = relation(
  "GeneralObject",
  { document: uuid, general: uuid, record: uuid },
  ["general"],
);

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
 * - `lang` is the document's `xml:lang` form ({@link DocumentLang}), and `lead ‖ value ‖ trail` is
 *   `lang`, `value` its collapsed value, an `xs:language` holding no whitespace;
 * - `value` is a language the category lists, as written ({@link ResourceLomLanguageSet}).
 */
export const GeneralLang = relation(
  "GeneralLang",
  { document: uuid, general: uuid, lang: keyText, lead: Space, trail: Space, value: keyText },
  ["general", "lang"],
);

/**
 * One `label` on an element of a document other than an item's root, keyed by the element's node:
 * its document and the document's root kind, which says whether Label tools binds it.
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
 * - **the host's:** `lead ‖ value ‖ trail`, the lexical form with its outer whitespace set apart
 *   (`trail` empty where `value` is, so the split is one per form), `refers`, the kind its value
 *   names (a trim a `mark`'s, a lookup a `lexicon`'s, a definition its own kind), and `fragment`,
 *   its element's {@link SsmlScope}.
 */
export const SsmlAttribute = relation(
  "SsmlAttribute",
  {
    fragment: uuid,
    kind: closedId(NodeKind),
    lead: Space,
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    refers: closedId(NodeKind),
    trail: Space,
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
 * One ID of an instance of an assembly (Q5.13's `Instance`, spec reading 117), keyed by the
 * instance and the element that carries it: a {@link DocumentId} of the instance's document, with
 * the instance's assembly and assembly kind, and its `copy`, the instance, but the nil uuid under a
 * test's assembly, where a section document placed twice is written once (reading 86).
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
 * One `xml:lang` of an instance of an item's assembly (Q5.13's `Instance`, spec reading 117), keyed
 * by the instance and the element's node: an {@link XmlLang} of the instance's document, under the
 * assembly. An included fragment's elements are its item's body elements in place, so their
 * languages are among those R26 holds the item's records to list.
 */
export const PlacedXmlLang = relation(
  "PlacedXmlLang",
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
  { assembly: uuid, general: uuid, lang: keyText, lead: Space, trail: Space, value: keyText },
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
 * The placed elements that carry each assembly's forms, counted by `AssembledLang.carriers`.
 */
export const assembledLangFamily = counted(
  on(PlacedXmlLang, "assembly", "lang"),
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
  DocumentGenerals,
  DocumentId,
  DocumentLang,
  FragmentValue,
  GeneralLang,
  GeneralNamed,
  GeneralObject,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedGeneralLang,
  PlacedId,
  PlacedIdref,
  PlacedXmlLang,
  ResourceLomLanguageSet,
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
 * Read an attribute's identity type: its value domain's under its element's governor, absent for a
 * name the governor does not admit, which AL1 refuses.
 *
 * @param a - The row.
 * @returns The closed read.
 */
const identityOf = (a: AttributeRow) =>
  ValueIdentity.at(
    "identity",
    AttributeGrammar.at(
      "domain",
      a.version,
      GoverningOf.at("governor", a.version, a.kind, a.governs),
      a.name,
    ),
  );

/**
 * A `Node` or {@link IdentityText} row as a selection reads it: the fields an element's governor is
 * read from.
 */
type GovernedRow = RowScalars<typeof Node> | RowScalars<typeof IdentityText>;

/**
 * Read the identity type of an element's text: its text domain's under its governor, `none` where
 * the governor reads its text in a domain of no identity (`TextDomain` and `ValueIdentity` are
 * total).
 *
 * @param n - The row.
 * @returns The closed read.
 */
const textIdentityOf = (n: GovernedRow) =>
  ValueIdentity.at(
    "identity",
    TextDomain.at("domain", n.version, GoverningOf.at("governor", n.version, n.kind, n.governs)),
  );

/**
 * The attributes whose value is one of their document's IDs: those of an `xs:ID` domain, and each
 * context declaration's `identifier` (spec reading 74).
 */
export const idAttributes = select(Attribute, (a) =>
  a.or(
    a.eq(identityOf(a), "ID"),
    a.and(a.eq(a.kind, "qti-context-declaration"), a.eq(a.name, "identifier")),
  ),
);

/**
 * The elements whose text is of an identity type, the source of {@link IdentityText}.
 */
const identityNodes = select(Node, (n) => n.ne(textIdentityOf(n), "none"));

/**
 * The elements whose text is an ID, each the source of a {@link DocumentId}.
 */
const idTexts = select(IdentityText, (t) => t.eq(textIdentityOf(t), "ID"));

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
 * The IDREF targets of documents in no assembly, each an id of its own document; an assembled
 * document's resolve per instance ({@link PlacedIdref}).
 */
const unassembledTargets = select(IdrefTarget, (t) => t.eq(t.assembled, false));

/**
 * Every `label` but an item root's own, the source of {@link LabelUse}.
 */
const labelAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.name, "label"), a.ne(a.kind, itemRoot)),
);

/**
 * An item root's `tool-name`, one per item document.
 */
const toolNames = select(Attribute, (a) =>
  a.and(a.eq(a.name, "tool-name"), a.eq(a.kind, itemRoot)),
);

/**
 * An item root's `tool-version`, one per item document.
 */
const toolVersions = select(Attribute, (a) =>
  a.and(a.eq(a.name, "tool-version"), a.eq(a.kind, itemRoot)),
);

/**
 * Every `lom:language` of a LOM `general` category, the source of {@link LomLanguage}: its id, its
 * parent and its string value.
 */
const lomLanguages = select(Node, (n) =>
  n.and(n.eq(n.kind, "lom:language"), n.eq(n.parentKind, "lom:general")),
);

/**
 * The general categories of the records that name a document: each has its
 * {@link GeneralObject}.
 */
const namingGenerals = select(GeneralNamed, (g) => g.ne(g.named, "none"));

/**
 * The forms that state a language: every `xml:lang` but an empty one or one of whitespace alone,
 * which states none (XML 1.0 §2.12).
 */
const statedLangs = select(DocumentLang, (d) => d.not(Compute.matches(d.lang, spacePattern)));

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
 * The labels Label tools binds: those in a document whose root is an item's.
 */
const itemLabels = select(LabelUse, (l) => l.eq(l.rootKind, itemRoot));

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
 * The elements that carry each document's `xml:lang` forms, counted by `DocumentLang.carriers`.
 */
export const langFamily = counted(on(XmlLang, "document", "lang"), fin(DocumentLang, "carriers"));

/**
 * The `lom:language` elements that list each category's languages, counted by
 * `ResourceLomLanguageSet.carriers`.
 */
export const lomLanguageFamily = counted(
  on(LomLanguage, "general", "lang"),
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
  a.not(Compute.matches(a.lang, spacePattern)),
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
 *   copied into its row and each attribute row an attribute's (C18); each ID-typed text copied into
 *   its row, bound to the element's parent, and each text row a text's; the value set apart from
 *   its outer whitespace (`E1_derived`);
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
 *   counted family, and each form carried (`E1_derived`);
 * - **ResourceLomLanguageSet:** each general category's `lom:language` copied into its `LomLanguage`
 *   row, its category its parent and its language its string value, and each row an element's; the
 *   counted family, and each language listed (`E1_derived`);
 * - **R26:** each resource's general category with its record's `named`, both ways; each one of a
 *   naming record with its document; each document with its count of categories; each witness a
 *   category's of its document, listing its form's value; and {@link documentLang}; in place, each
 *   item instance's carriers placed and counted against its document's, each assembly form's
 *   carriers and listing categories counted, each witness a category's of the item, listing its
 *   form's value; and {@link assembledLang};
 * - **Reading 3:** each read SSML attribute copied into its {@link SsmlAttribute} row, both ways,
 *   split around its value and placed in its element's fragment; each fragment's values counted;
 *   each scope on its node's {@link nodeRef} tuple, a `speak` its own fragment, a root that is no
 *   `speak` the document's and every other element its parent's; {@link ssmlTrimMark} and
 *   {@link ssmlLexiconReference};
 * - **Label tools:** each non-root `label` copied into its `LabelUse` row and each row a label's, its
 *   root kind its document's, and in an item each label's document one whose root carries
 *   `tool-name` and `tool-version`.
 */
export const identityLaws = [
  key(on(idAttributes, "node")),
  contained(
    on(idAttributes, "node", "document", "lexical"),
    on(DocumentId, "node", "document", "lexical"),
  ),
  contained(on(attributeIds, "node"), on(idAttributes, "node")),
  contained(
    on(idTexts, "node", "document", "owner", "lexical"),
    on(DocumentId, "node", "document", "owner", "lexical"),
  ),
  contained(on(textIds, "node"), on(idTexts, "node")),
  check("E1_derived", DocumentId, (d) =>
    d.and(
      d.eq(d.lexical, Compute.concat(Compute.concat(d.before, d.id), d.after)),
      Compute.matches(d.id, idValuePattern),
    ),
  ),
  key(on(idTexts, "node")),
  idBindingFamily,
  check("E1_derived", IdBinding, (b) => b.gt(b.carriers, 0n)),
  key(on(IdBinding, "document", "id")),

  key(on(identityNodes, "id")),
  contained(
    on(identityNodes, "id", "document", "parent", "stringValue"),
    on(IdentityText, "node", "document", "owner", "lexical"),
  ),
  contained(
    on(IdentityText, "node", "kind", "version", "document", "governs"),
    on(Node, "id", "kind", "version", "document", "governs"),
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
      t.and(t.eq(textIdentityOf(t), "ID"), t.eq(t.idrefs, 0n)),
      t.and(t.in(textIdentityOf(t), ["IDREF", "IDREFS"]), t.eq(t.lexical, t.idrefText)),
    ),
  ),
  check("E1_derived", TextIdref, (i) =>
    i.and(
      i.eq(i.piece, Compute.concat(Compute.concat(i.before, i.token), i.after)),
      Compute.matches(i.token, idValuePattern),
      i.or(i.eq(i.at, 0n), i.ne(i.before, "")),
    ),
  ),

  contained(on(Idref, "document", "token"), on(IdrefTarget, "document", "id")),
  contained(on(TextIdref, "document", "token"), on(IdrefTarget, "document", "id")),
  contained(on(IdrefTarget, "document", "assembled"), on(Document, "node", "assembled")),
  idrefTargetFamily,
  contained(on(unassembledTargets, "document", "id"), on(IdBinding, "document", "id")),

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
      p.and(p.eq(p.assemblyKind, testKind), p.eq(p.copy, nilUuid)),
      p.and(p.ne(p.assemblyKind, testKind), p.eq(p.copy, p.instance)),
    ),
  ),
  check("E1_derived", AssembledId, (a) => a.gt(a.carriers, 0n)),
  key(on(AssembledId, "assembly", "id")),
  contained(
    on(PlacedIdref, "instance", "document", "assembly"),
    on(Instance, "id", "document", "assembly"),
  ),
  contained(on(PlacedIdref, "document", "id"), on(IdrefTarget, "document", "id")),
  contained(on(PlacedIdref, "assembly", "id"), on(AssembledId, "assembly", "id")),

  key(on(langAttributes, "node")),
  contained(
    on(langAttributes, "node", "document", "lexical"),
    on(XmlLang, "node", "document", "lang"),
  ),
  contained(on(XmlLang, "node"), on(langAttributes, "node")),
  langFamily,
  check("E1_derived", DocumentLang, (d) => d.gt(d.carriers, 0n)),

  key(on(lomLanguages, "id")),
  contained(
    on(lomLanguages, "id", "parent", "stringValue"),
    on(LomLanguage, "node", "general", "lang"),
  ),
  contained(on(LomLanguage, "node"), on(lomLanguages, "id")),
  lomLanguageFamily,
  check("E1_derived", ResourceLomLanguageSet, (s) => s.gt(s.carriers, 0n)),

  mirrors(on(GeneralNamed, "general"), on(ResourceLomGeneral, "node")),
  contained(on(GeneralNamed, "general", "record"), on(LomGeneral, "node", "parent")),
  contained(on(GeneralNamed, "record", "named"), on(LomRecord, "node", "named")),
  contained(on(namingGenerals, "general", "record"), on(GeneralObject, "general", "record")),
  contained(on(GeneralObject, "general", "record"), on(GeneralNamed, "general", "record")),
  contained(on(GeneralObject, "record", "document"), on(LomObject, "record", "document")),
  mirrors(on(DocumentGenerals, "document"), on(Document, "node")),
  generalObjectFamily,
  generalLangFamily,
  contained(on(GeneralLang, "general", "document"), on(GeneralObject, "general", "document")),
  // G-text: `value` and the category's `lang` compare case-folded (BCP 47 §2.1.1) once grizzle has
  // an ASCII case fold, `Compute.lowerAscii`, on both sides; until then, exactly.
  contained(on(GeneralLang, "general", "value"), on(ResourceLomLanguageSet, "general", "lang")),
  check("E1_derived", GeneralLang, (g) =>
    g.and(
      g.eq(g.lang, Compute.concat(Compute.concat(g.lead, g.value), g.trail)),
      Compute.matches(g.value, trimmedPattern),
      g.ne(g.value, ""),
    ),
  ),
  documentLang,
  documentLangFamily,
  placedLangFamily,
  assembledLangFamily,
  placedGeneralLangFamily,
  contained(
    on(PlacedXmlLang, "instance", "document", "assembly"),
    on(Instance, "id", "document", "assembly"),
  ),
  contained(on(PlacedXmlLang, "node", "document", "lang"), on(XmlLang, "node", "document", "lang")),
  check("E1_derived", AssembledLang, (a) => a.gt(a.carriers, 0n)),
  contained(on(PlacedGeneralLang, "general", "assembly"), on(GeneralObject, "general", "document")),
  contained(
    on(PlacedGeneralLang, "general", "value"),
    on(ResourceLomLanguageSet, "general", "lang"),
  ),
  check("E1_derived", PlacedGeneralLang, (g) =>
    g.and(
      g.eq(g.lang, Compute.concat(Compute.concat(g.lead, g.value), g.trail)),
      Compute.matches(g.value, trimmedPattern),
      g.ne(g.value, ""),
    ),
  ),
  assembledLang,

  key(on(ssmlAttributes, "node", "name")),
  contained(
    on(ssmlAttributes, "node", "name", "kind", "lexical"),
    on(SsmlAttribute, "node", "name", "kind", "lexical"),
  ),
  contained(on(SsmlAttribute, "node", "name"), on(ssmlAttributes, "node", "name")),
  contained(on(SsmlAttribute, "node", "fragment"), on(SsmlScope, "node", "fragment")),
  // G-text: a mark name is an xs:token (SSML 1.1 §3.3.2), whose collapse also folds each inner run
  // of whitespace into one space; grizzle cannot state it, so only the outer whitespace is set
  // apart here, and two names that differ only in their inner whitespace are two names.
  check("E1_derived", SsmlAttribute, (s) =>
    s.and(
      s.eq(s.lexical, Compute.concat(Compute.concat(s.lead, s.value), s.trail)),
      Compute.matches(s.value, trimmedPattern),
      s.or(s.ne(s.value, ""), s.eq(s.trail, "")),
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
  ssmlTrimMark,
  ssmlLexiconReference,

  key(on(labelAttributes, "node")),
  contained(on(labelAttributes, "node", "document"), on(LabelUse, "node", "document")),
  contained(on(LabelUse, "node"), on(labelAttributes, "node")),
  contained(on(LabelUse, "document", "rootKind"), on(Document, "node", "rootKind")),
  key(on(toolNames, "document")),
  key(on(toolVersions, "document")),
  contained(on(itemLabels, "document"), on(toolNames, "document")),
  contained(on(itemLabels, "document"), on(toolVersions, "document")),
] as const;
