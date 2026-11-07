/**
 * The metadata overlays (plan §1.7 O6; the W5 amendment's C2, C3, C17 and C18; the tier-1
 * addendum's G-concat, G-parse and "Text in keys"; UP's port audit, B33 and B34; RV's B4): the LOM
 * records a package's elements carry, the identifier, title and language of each assessment item
 * and test, each LOM learning resource type's value and source, and the day each usage statistic
 * was last updated, with the laws that read them across rows.
 *
 * A record names its document when it is a `lom:lom` child of the `cp:metadata` of a resource of
 * type `imsqti_item_xmlv3p0` or `imsqti_test_xmlv3p0` whose `href` names a document (reading 93):
 * its {@link LomRecord}'s `named` is the resource's type, and its {@link LomObject} the document at
 * the `href`. A file's record describes the file, and an external record ({@link LomRecord}'s owner
 * is the document node) may describe many items, so neither names one. A record whose resource's
 * `href` names no document names none, so no law here reads it: there is no "associated item, test
 * or object bank" (§2.7.1) to read it against, and "Document entry" refuses the `href`. Spec
 * reading 62, as UP's audit merges it (§2.2), reads the information model's "MUST be the same"
 * (sections 4.1.1, 4.1.2, 4.4.1 and 4.4.2) through the metadata binding's LOM profile (QTI 3.0
 * Metadata §2.7.1, normative by its §1.2):
 *
 * - **`lom-identifier`** (law "LomObjectIdentifier", §2.7.1.1: "One of the values given for the
 *   identifier must have an entry that matches the identifier of the associated item, test or
 *   object bank"): when the record's general category lists `identifier` entries, one of them is
 *   the document's identifier, compared collapsed. A meta-metadata or a relation's identifier is no
 *   general one, and is not read.
 * - **`lom-title`** (law "LomObjectTitle", §2.7.1.2: "The title must have a value that matches the
 *   value of the title attribute of the associated item, test or object bank. The language used to
 *   interpret the title is taken from the language attribute of the associated item, test or object
 *   bank"): when the record's general category has a `title`, one of its strings in the document's
 *   language is the document's `title`: a string whose `language` is the root's `xml:lang`, or one
 *   with no `language`, or any string where the root states no `xml:lang`. An empty `xml:lang`, or
 *   one of whitespace alone, states none ("the absence of language information", XML 1.0 §2.12),
 *   and an empty `language` is read alike.
 * - **`lom-learning-resource-type`** (law "LOM learning resource type", spec reading 122, §2.7.5.1:
 *   "QTI objects are designed to be reusable in a variety of assessment scenarios. Therefore, the
 *   LOM-defined values self assessment and exam are forbidden"): a `learningResourceType` of the
 *   LOM vocabulary holds neither, compared collapsed. Its term is the LOM vocabulary's when its
 *   `source` collapses to `LOMv1.0`, or to the empty source the binding's `default="LOMv1.0"`
 *   fills, or when it writes no `source` (`imsmd_loose_v1p3p2.xsd` line 1288); a term of any other
 *   source is another vocabulary's, which the binding does not enforce (§3.6), and is not refused
 *   (reading 1). So the law is an existential, as `lom-identifier`'s is: a forbidden value's type
 *   has a source of another vocabulary ({@link LomResourceTypeSource}), and a type that writes no
 *   source has no row there to name.
 * - **The date** (G-parse, `attribute-lexical`): every `lastUpdated` of a usage statistic, a
 *   `DateDType`, is a day of the Gregorian calendar, its value the typed `date` PostgreSQL derives
 *   from it ({@link StatisticDate}). The attribute's value domain states it; `day`'s type restates
 *   it under the same law, so the cast is total (the orchestrator's ruling of 2026-11-06).
 * - **Usage typed value** (G-match, spec reading 105): a usage statistic's `ud:value` that writes a
 *   `baseType` holds a value of that base type ("A class that can represent a single value of any
 *   baseType", the usage data binding's Value class, §2.6.5), its text read as a `qti-value`'s is,
 *   by `BaseTypePattern`; one that writes none is the XSD's `xs:normalizedString` text
 *   ({@link UsageValue}).
 *
 * **`lom-title`'s comparisons.** The binding compares a title in `xs:normalizedString`'s value
 * space, where a tab, a line feed and a carriage return each read as a space (XML Schema 1.0 Part 2
 * §4.3.6, whiteSpace `replace`), and a language tag without regard to case (RFC 5646 §2.1.1), whose
 * subtags are ASCII (§2.1). So each side carries its compared form beside its written one, which
 * `E1_derived` proves: a title its `Compute.replaceWhitespace` ({@link AssessmentObject}'s
 * `titleValue`, {@link LomTitleString}'s `textValue`), the root's `xml:lang` its value collapsed
 * (an `xs:language`) and case-folded by `Compute.lowerAscii` (`langTag`), and a string's
 * `language`, an `xs:string`, case-folded as written (`languageTag`).
 *
 * "Compared collapsed" is stated with G-concat's pieces: a text is `lead ‖ token ‖ trail`, its
 * outer whitespace set apart. A document's identifier holds no whitespace (an `IdentifierDType`,
 * an `xs:NCName`), so an entry's collapsed value is that identifier exactly when the entry's text
 * with its outer whitespace set apart is: a text whose collapse holds an inner space equals no
 * identifier, and neither does its trimmed form. So the law compares trimmed tokens, and no padding
 * is refused (reading 1).
 *
 * The record's facts are copied down its tree once, by the nodes' {@link nodeRef} tuples:
 * {@link LomRecord} climbs from each `lom:lom` to its owner and the owner's parent (the
 * `cp:resource` where the owner is a resource's `cp:metadata`), and each element below copies from
 * its record. {@link ResourceLomGeneral} is the shared interface: each resource's general category
 * and that resource, which Q5.07's `ResourceLomLanguageSet` and the `document-lang` law join.
 *
 * The other metadata the package carries has no overlay, since no law reads it across rows: QTI
 * metadata, curriculum standards metadata and the rest of LOM are judged by their content models
 * (N5, N7) and their value domains (AL1, TextDomain), and a usage statistic's children by N5's
 * content order, with no ordering law of their own: only its `lastUpdated` and its typed value are
 * copied, each into a row of its own.
 *
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores: an overlay's agreement with the tree it restates is "E1 derived" (rule
 * `derived`). Every copied text that takes part in a cross-row equality is `keyText`
 * (`#pantry/qti/limits.ts`), and a value past its bound is refused under the schema's one limit
 * law, never under a QTI law's name. No containment pairs two such texts: each `keyText` bound is
 * derived for one text in a key, and two would pass PostgreSQL's B-tree entry limit
 * (`UnrepresentableKey`), so a title and its language are compared by two containments.
 *
 * @see {@link https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html | QTI 3.0 Metadata, §2.7.1 The General Category}
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  date,
  drawn,
  fin,
  generated,
  key,
  lexical,
  mirrors,
  natural,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  BaseType,
  BaseTypeLexical,
  NodeKind,
  ResourceType,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { baseTypes } from "#pantry/grammar/attributes.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { BaseTypePattern, unjudgedBaseTypes } from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { Resource, TypedHref } from "#pantry/qti/package.ts";

/**
 * The resource types whose LOM record names its document (reading 62): an item's and a test's.
 */
export const objectTypes = [
  "imsqti_item_xmlv3p0",
  "imsqti_test_xmlv3p0",
] as const satisfies readonly (typeof ResourceType.handles)[number][];

/**
 * The root kinds of the documents of {@link objectTypes}, whose `identifier`, `title` and
 * `xml:lang` a record is compared with.
 */
export const objectKinds = [
  "qti-assessment-item",
  "qti-assessment-test",
] as const satisfies readonly (typeof NodeKind.handles)[number][];

/**
 * The usage statistics, the kinds that carry `lastUpdated` (`imsqti_usagedatav3p0_v1p0.xsd`,
 * `CategorizedStatisticDType` and `OrdinaryStatisticDType`).
 */
export const statisticKinds = [
  "ud:ordinaryStatistic",
  "ud:categorizedStatistic",
] as const satisfies readonly (typeof NodeKind.handles)[number][];

/**
 * A usage statistic's value, `ValueDType` of `imsqti_usagedatav3p0_v1p0.xsd`, which may name its
 * base type in `baseType`.
 */
export const usageValueKind = "ud:value" satisfies (typeof NodeKind.handles)[number];

/**
 * The owner whose records name a resource: a resource's `cp:metadata`, whose parent is the
 * `cp:resource`.
 */
const resourceMetadata = "cp:metadata.resource";

/**
 * XML 1.0's `Char` as the body of a class.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-Char | XML 1.0, Char}
 */
const xmlChar = "\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * XML 1.0's `Char` less its whitespace `S`, as the body of a class.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const xmlNonSpace = "\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * A text with no XML whitespace at either end, the empty text included: a piece's `token` once its
 * text's outer whitespace is set apart.
 */
export const trimmedPattern = `^(?:[${xmlNonSpace}](?:[${xmlChar}]*[${xmlNonSpace}])?)?$`;

/**
 * A nonempty text holding no XML whitespace: an assessment object's identifier, collapsed. That it
 * is an NCName is AL1's lexical half over the attribute.
 */
export const identifierPattern = `^[${xmlNonSpace}]+$`;

/**
 * XML whitespace `S`, possibly none: what a piece's text holds around its token.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const Space = str.regex("^[\\t\\n\\r ]*$");

/**
 * A resource as the LOM laws read it, keyed by its `cp:resource` node: `named`, the type of the
 * assessment object document its `href` names: its type where it has a {@link TypedHref} of an item
 * or a test whose path a resource names a document at, else `none`. A resource whose `type` spells
 * nothing names no document, and neither does one whose `href` names none: an item's or a test's
 * {@link TypedHref} is its resource's `named` exactly where the `href` names a document, so the
 * containment that holds it breaks only where "Document entry" does, and is stated under that law.
 */
export const LomResource = relation(
  "LomResource",
  {
    named: closedId(ResourceType),
    node: uuid,
  },
  ["node"],
);

/**
 * The typed hrefs of an assessment object's resources, an item's or a test's: each is its
 * resource's `named`.
 */
const objectHrefs = select(TypedHref, (h) => h.in(h.type, objectTypes));

/**
 * The resources that name an assessment object: each has its {@link objectHrefs} row.
 */
const namingResources = select(LomResource, (r) => r.ne(r.named, "none"));

/**
 * A LOM record, keyed by its `lom:lom` node: its {@link nodeRef} tuple, its owner's kind, start and
 * parent, from the owner's own tuple, and `named`, the type of the document it names: its
 * resource's `named` where its owner is a resource's `cp:metadata`, else `none`.
 *
 * Every copy shares `nearest` with the record's own: no interaction kind admits a `lom:lom`, so the
 * record's nearest interaction is its owner's (N8).
 */
export const LomRecord = relation(
  "LomRecord",
  {
    document: uuid,
    kind: closedId(NodeKind),
    named: closedId(ResourceType),
    nearest: uuid,
    node: uuid,
    owner: closedId(NodeKind),
    ownerParent: uuid,
    ownerStart: natural,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The document a naming record names, keyed by the record: the record's resource and type, the
 * resource's package and the `path` its `href` names (`TypedHref`'s, the href less its query or
 * fragment, reading 102), and the document at that path. Every record whose `named` is not `none`
 * has one, so each law over a record reads its document here.
 */
export const LomObject = relation(
  "LomObject",
  {
    document: uuid,
    package: uuid,
    path: keyText,
    record: uuid,
    resource: uuid,
    type: closedId(ResourceType),
  },
  ["record"],
);

/**
 * A LOM general category, keyed by its `lom:general` node: its {@link nodeRef} tuple, its parent
 * the record, and the record's owner and owner's parent, copied from {@link LomRecord}.
 */
export const LomGeneral = relation(
  "LomGeneral",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    owner: closedId(NodeKind),
    ownerParent: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A resource's LOM general category, keyed by its `lom:general` node: one row for each general
 * category of a record under a resource's `cp:metadata`, and `resource`, that `cp:resource` node
 * (`Resource.node`). It is exactly the {@link LomGeneral} rows whose owner is a resource's
 * metadata, both ways, so a read joined to it reads every resource's category and no other.
 */
export const ResourceLomGeneral = relation("ResourceLomGeneral", { node: uuid, resource: uuid }, [
  "node",
]);

/**
 * A LOM identifier's entry, keyed by its `lom:entry` node (a `CharacterString`, whose parent is
 * always a `lom:identifier`): its {@link nodeRef} tuple, its identifier's kind, start and parent
 * (the holder: a general category, the meta-metadata or a related resource), the holder's kind,
 * start and parent (the record, for a general or meta-metadata identifier), `named`, its record's
 * where its holder is a general category, else `none`, and its string value in pieces.
 *
 * - `text` is the entry's string value, `Node.stringValue`, which `copiedTextKinds` folds
 *   (`#pantry/qti/node.ts`);
 * - `lead ‖ token ‖ trail` is `text`, `token` its trimmed form, `trail` empty when `token` is, so the
 *   split is one per text.
 */
export const LomEntry = relation(
  "LomEntry",
  {
    document: uuid,
    holder: uuid,
    holderKind: closedId(NodeKind),
    holderParent: uuid,
    holderStart: natural,
    identifierKind: closedId(NodeKind),
    identifierStart: natural,
    kind: closedId(NodeKind),
    lead: Space,
    named: closedId(ResourceType),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    text: keyText,
    token: keyText,
    trail: Space,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A LOM title, keyed by its `lom:title` node (a `LangString`, whose parent is always a general
 * category): its {@link nodeRef} tuple, its general category's kind, start and parent (the
 * record), and its record's `named`.
 */
export const LomTitle = relation(
  "LomTitle",
  {
    document: uuid,
    generalKind: closedId(NodeKind),
    generalStart: natural,
    kind: closedId(NodeKind),
    named: closedId(ResourceType),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    record: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A LOM `lom:string`, keyed by its node, wherever it stands: its count of `language` attributes (0
 * or 1, as {@link LomStringLanguage} holds them), the one total fact of whether the optional
 * attribute exists, and `languageTag`, the language as `lom-title` compares it: its
 * {@link LomStringLanguage}'s where it writes one, {@link noLanguage} where it writes none. The
 * attribute's lexical form is its own row's, never a field here.
 */
export const LomString = relation(
  "LomString",
  { languageTag: keyText, languages: drawn(natural), node: uuid },
  ["node"],
);

/**
 * A `lom:string`'s `language`, keyed by the string's node: its lexical form as written, and
 * `languageTag`, that form case-folded (`Compute.lowerAscii`), as `lom-title` compares it.
 */
export const LomStringLanguage = relation(
  "LomStringLanguage",
  { language: keyText, languageTag: keyText, node: uuid },
  ["node"],
);

/**
 * Each string's `language`, counted by {@link LomString}'s `languages`.
 */
export const lomStringLanguages = counted(
  on(LomStringLanguage, "node"),
  fin(LomString, "languages"),
);

/**
 * A string of a LOM title, keyed by its `lom:string` node: its {@link nodeRef} tuple (its parent the
 * title), its title's record, its string value `text`, `Node.stringValue` folded by
 * `copiedTitleText` (`#pantry/qti/node.ts`), and the host's two compared forms, `textValue`, the
 * text in `xs:normalizedString`'s value space (`Compute.replaceWhitespace`), and `languageTag`, its
 * language as {@link LomString} holds it.
 */
export const LomTitleString = relation(
  "LomTitleString",
  {
    document: uuid,
    kind: closedId(NodeKind),
    languageTag: keyText,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    record: uuid,
    start: natural,
    text: keyText,
    textValue: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An assessment object, keyed by the `qti-assessment-item` or `qti-assessment-test` root, whatever
 * it writes: its {@link nodeRef} tuple; its count of `xml:lang` attributes (0 or 1, as
 * {@link ObjectLang} holds them), the one total fact of whether the optional attribute exists; and
 * `langTag`, its language as `lom-title` compares it: its {@link ObjectLang}'s where it writes one,
 * {@link noLanguage} where it writes none. Its required `identifier` and `title` are rows of their
 * own, {@link ObjectIdentifier} and {@link ObjectTitle}, so a root that writes neither still has its
 * row and AL3 alone refuses it, and no LOM entry or title string matches what it does not write
 * (spec reading 148).
 */
export const AssessmentObject = relation(
  "AssessmentObject",
  {
    document: uuid,
    kind: closedId(NodeKind),
    langTag: keyText,
    langs: drawn(natural),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An assessment object's `identifier`, keyed by its root: its document, the lexical form as
 * written, and that form in pieces, `lead ‖ identifier ‖ trail`, `identifier` its collapsed value.
 * A root that writes no `identifier` has no row, and AL3 refuses it.
 */
export const ObjectIdentifier = relation(
  "ObjectIdentifier",
  {
    document: uuid,
    identifier: keyText,
    lead: Space,
    lexical: keyText,
    node: uuid,
    trail: Space,
  },
  ["node"],
);

/**
 * An assessment object's `title`, keyed by its root: its document, the title as written, and
 * `titleValue`, its value as an `xs:normalizedString` (`Compute.replaceWhitespace`). A root that
 * writes no `title` has no row, and AL3 refuses it.
 */
export const ObjectTitle = relation(
  "ObjectTitle",
  { document: uuid, node: uuid, title: keyText, titleValue: keyText },
  ["node"],
);

/**
 * An assessment object's `xml:lang`, keyed by its root: its lexical form as written, and `langTag`,
 * its value collapsed (an `xs:language`) and case-folded (`Compute.lowerAscii`), as `lom-title`
 * compares it.
 */
export const ObjectLang = relation("ObjectLang", { lang: keyText, langTag: keyText, node: uuid }, [
  "node",
]);

/**
 * Each object's `xml:lang`, counted by {@link AssessmentObject}'s `langs`.
 */
export const objectLangs = counted(on(ObjectLang, "node"), fin(AssessmentObject, "langs"));

/**
 * The entry by which a record names its document (`lom-identifier`), keyed by the record: the
 * document, its identifier ({@link ObjectIdentifier}'s), and an entry of one of the record's
 * general categories whose token is that identifier, with its category.
 *
 * A row exists for every naming record that lists a general entry; its entry is the existential's
 * witness, so a record none of whose entries names its document, or whose document writes no
 * identifier, has no row, and the existence refuses it.
 */
export const LomObjectIdentifier = relation(
  "LomObjectIdentifier",
  { document: uuid, entry: uuid, general: uuid, identifier: keyText, record: uuid },
  ["record"],
);

/**
 * The title string by which a record names its document (`lom-title`), keyed by the record: the
 * document, its title's value ({@link ObjectTitle}'s `titleValue`) and its language
 * ({@link AssessmentObject}'s `langTag`, {@link noLanguage} where it states none), and a string of
 * one of the record's titles whose text has that value (`textValue`), with the string's language
 * (`languageTag`, {@link noLanguage} where it has none).
 *
 * A row exists for every naming record that has a general title; its string is the existential's
 * witness, so a record none of whose title strings names its document, or whose document writes no
 * title, has no row, and the existence refuses it.
 */
export const LomObjectTitle = relation(
  "LomObjectTitle",
  {
    document: uuid,
    objectLang: keyText,
    record: uuid,
    string: uuid,
    stringLanguage: keyText,
    title: keyText,
  },
  ["record"],
);

/**
 * The day a usage statistic was last updated, keyed by the statistic: its `lastUpdated` as written,
 * `lexical`, in pieces, `lead ‖ day ‖ trail`, and `date`, the day as PostgreSQL's `date` derives it
 * from `day` (G-parse).
 *
 * `DateDType` restricts `xs:date` by `[0-9]{4}-[0-9]{2}-[0-9]{2}`, so its values are the days from
 * 0001-01-01 to 9999-12-31 with no timezone, around which `xs:date`'s `collapse` admits whitespace:
 * `day`'s type, `lexical(date)`, is that language exactly, and the cast is total.
 */
export const StatisticDate = relation.generated(
  "StatisticDate",
  { day: lexical(date), lead: Space, lexical: keyText, node: uuid, trail: Space },
  ["node"],
  (s) => ({ date: generated(date, Compute.cast(s.day, date)) }),
);

/**
 * A usage statistic's value that names its base type, keyed by its `ud:value` node: its `baseType`
 * as written, `baseTypeLexical`, the `BaseType` code that lexical form spells (C17), and `text`,
 * its string value, `Node.stringValue` folded by `copiedTextKinds` (`#pantry/qti/node.ts`).
 *
 * A value that writes no `baseType` has no row: the usage data binding has no declaration to type
 * it, so it is its governing type's `xs:normalizedString` text, which every text is (spec reading
 * 105). Nor does one whose `baseType` spells no code (`spelledBaseTypes`, as written): no type
 * types its text, and the attribute's value domain refuses it alone, as a declaration's unspelled
 * `base-type` is (lane NIL's audit, B11).
 */
export const UsageValue = relation(
  "UsageValue",
  { baseType: closedId(BaseType), baseTypeLexical: keyText, node: uuid, text: keyText },
  ["node"],
);

/**
 * The LOM vocabulary's source: the `source` the loose binding writes for a vocabulary term that
 * writes none, `default="LOMv1.0"` (`imsmd_loose_v1p3p2.xsd` line 1288,
 * `LearningResourceType.Type`).
 */
export const lomVocabulary = "LOMv1.0";

/**
 * The compared form of a language that states none: the empty text. An empty `xml:lang` states no
 * language, "just as if xml:lang had not been specified" (XML 1.0 §2.12), so a root that writes no
 * `xml:lang` and one whose `xml:lang` collapses to the empty text compare alike (`lom-title`, and
 * R26's forms in `#pantry/qti/identity.ts`); a `lom:string`'s empty `language` is read alike.
 *
 * @see {@link https://www.w3.org/TR/xml/#sec-lang-tag | XML 1.0, §2.12 Language Identification}
 */
export const noLanguage = "";

/**
 * The sources, collapsed, under which a learning resource type is a term of the LOM vocabulary
 * (spec reading 122): `LOMv1.0`, and the empty source the binding's default fills. A source of
 * whitespace alone collapses to the empty one.
 */
export const lomVocabularySources = ["", lomVocabulary] as const;

/**
 * The learning resource types QTI 3.0 Metadata forbids of the LOM vocabulary (§2.7.5.1: "the
 * LOM-defined values self assessment and exam are forbidden"), as their values collapse.
 */
export const forbiddenResourceTypes = ["exam", "self assessment"] as const;

/**
 * A LOM learning resource type's value, keyed by its `lom:learningResourceType` node: `term`, the
 * `lom:value` it holds, and `text`, that value's string value, `Node.stringValue` folded by
 * `copiedVocabularyText` (`#pantry/qti/node.ts`). A learning resource type that holds no value has
 * no row. The binding's Schematron caps its values at one (`imsmd_loose_v1p3p2.xsd` line 533, N7,
 * spec reading 130), so a row for each is a row for the type.
 */
export const LomResourceType = relation(
  "LomResourceType",
  { node: uuid, term: uuid, text: keyText },
  ["node"],
);

/**
 * A LOM learning resource type's source, keyed by its `lom:learningResourceType` node: `term`, the
 * `lom:source` it holds, and `text`, that source's string value, folded as the value's is. A
 * learning resource type that writes no source has no row; the Schematron caps its sources at one
 * (line 529).
 */
export const LomResourceTypeSource = relation(
  "LomResourceTypeSource",
  { node: uuid, term: uuid, text: keyText },
  ["node"],
);

/**
 * The relations this module declares, by name, as `schema.ts` composes them.
 */
export const metadataRelations = {
  AssessmentObject,
  LomEntry,
  LomGeneral,
  LomObject,
  LomObjectIdentifier,
  LomObjectTitle,
  LomRecord,
  LomResource,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  ResourceLomGeneral,
  StatisticDate,
  UsageValue,
};

/**
 * The types of the documents a package's records are read from: its manifest's, `none`, the one
 * document of that type (`RootOfType`'s check), whose `cp:metadata` holds the package's and each
 * resource's records; and an external record file's, `resourcemetadata/xml`, whose root is a
 * `lom:lom` (spec reading 81: an external LOM metadata file, assessed against the loose LOM
 * binding; spec reading 122 places a record in a resource's metadata, the manifest's own or such
 * a file, `#pantry/test/gen/lom-resource-type.ts`). The manifest is the package's one
 * `imsmanifest.xml` (IMS Content Packaging 1.2), and a `cp:metadata` of any other document
 * describes no part of the package (170356bd's ruling), so its `lom:*` elements are no record's.
 */
export const recordDocumentTypes = [
  "none",
  "resourcemetadata/xml",
] as const satisfies readonly (typeof ResourceType.handles)[number][];

/**
 * Whether a node is of a document a package's records are read from ({@link recordDocumentTypes}).
 *
 * @param n - The row.
 * @returns The predicate.
 */
const inRecords = (n: RowScalars<typeof Node>) => n.in(n.documentType, recordDocumentTypes);

/**
 * The `lom:lom` nodes of the records' documents: each has its {@link LomRecord}.
 */
const recordNodes = select(Node, (n) => n.and(inRecords(n), n.eq(n.kind, "lom:lom")));

/**
 * The `lom:general` nodes of the records' documents: each has its {@link LomGeneral}.
 */
const generalNodes = select(Node, (n) => n.and(inRecords(n), n.eq(n.kind, "lom:general")));

/**
 * The `lom:entry` nodes of the records' documents: each has its {@link LomEntry}, carrying its
 * string value.
 */
const entryNodes = select(Node, (n) => n.and(inRecords(n), n.eq(n.kind, "lom:entry")));

/**
 * The `lom:title` nodes of the records' documents: each has its {@link LomTitle}.
 */
const titleNodes = select(Node, (n) => n.and(inRecords(n), n.eq(n.kind, "lom:title")));

/**
 * The `lom:string` nodes of the records' documents: each has its {@link LomString}.
 */
const stringNodes = select(Node, (n) => n.and(inRecords(n), n.eq(n.kind, "lom:string")));

/**
 * The `lom:string` nodes of a title of the records' documents: each has its {@link LomTitleString},
 * carrying its string value.
 */
const titleStringNodes = select(Node, (n) =>
  n.and(inRecords(n), n.eq(n.kind, "lom:string"), n.eq(n.parentKind, "lom:title")),
);

/**
 * The `lom:value` nodes of the records' learning resource types: each has its
 * {@link LomResourceType}, carrying its string value.
 */
const resourceTypeValues = select(Node, (n) =>
  n.and(inRecords(n), n.eq(n.kind, "lom:value"), n.eq(n.parentKind, "lom:learningResourceType")),
);

/**
 * The `lom:source` nodes of the records' learning resource types: each has its
 * {@link LomResourceTypeSource}, carrying its string value.
 */
const resourceTypeSources = select(Node, (n) =>
  n.and(inRecords(n), n.eq(n.kind, "lom:source"), n.eq(n.parentKind, "lom:learningResourceType")),
);

/**
 * The learning resource types whose value, collapsed, QTI 3.0 Metadata §2.7.5.1 forbids of the LOM
 * vocabulary: each needs a source of another vocabulary.
 */
const forbiddenResourceTypeValues = select(LomResourceType, (t) =>
  t.in(Compute.collapse(t.text), forbiddenResourceTypes),
);

/**
 * The sources that name another vocabulary than the LOM's: each collapses to neither `LOMv1.0` nor
 * the empty source the binding's default fills.
 */
const otherVocabularySources = select(LomResourceTypeSource, (s) =>
  s.not(s.in(Compute.collapse(s.text), lomVocabularySources)),
);

/**
 * The records whose owner is a resource's metadata.
 */
const resourceRecords = select(LomRecord, (r) => r.eq(r.owner, resourceMetadata));

/**
 * The records that name a document: each has its {@link LomObject}.
 */
const namingRecords = select(LomRecord, (r) => r.ne(r.named, "none"));

/**
 * The general categories whose record's owner is a resource's metadata.
 */
const resourceGenerals = select(LomGeneral, (g) => g.eq(g.owner, resourceMetadata));

/**
 * The entries of general categories, among which a record names its document.
 */
const generalEntries = select(LomEntry, (e) => e.eq(e.holderKind, "lom:general"));

/**
 * The general entries of the records that name a document: each makes its record's
 * {@link LomObjectIdentifier} row exist.
 */
const namingEntries = select(LomEntry, (e) =>
  e.and(e.eq(e.holderKind, "lom:general"), e.ne(e.named, "none")),
);

/**
 * The titles of the records that name a document: each makes its record's {@link LomObjectTitle}
 * row exist.
 */
const namingTitles = select(LomTitle, (t) => t.ne(t.named, "none"));

/**
 * Select the attributes of one name on the elements of some kinds: the source of an overlay's copy
 * (C18), beside a key over the same selection, whose UNIQUE serves the copy's reverse probe so no
 * index holds `Attribute.lexical`.
 *
 * @param name - The attribute's name.
 * @param kinds - The elements' kinds.
 * @returns The selection.
 */
const attributesOf = (
  name: "baseType" | "identifier" | "lastUpdated" | "title" | "xml:lang",
  kinds: readonly (typeof NodeKind.handles)[number][],
) => select(Attribute, (a) => a.and(a.eq(a.name, name), a.in(a.kind, kinds)));

/**
 * The `identifier` of each item's and test's root.
 */
const objectIdentifiers = attributesOf("identifier", objectKinds);

/**
 * The `title` of each item's and test's root.
 */
const objectTitles = attributesOf("title", objectKinds);

/**
 * The `xml:lang` of each item's and test's root.
 */
const objectLangAttributes = attributesOf("xml:lang", objectKinds);

/**
 * The `language` of each `lom:string` of a record's document.
 */
const stringLanguageAttributes = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "language"),
    a.eq(a.kind, "lom:string"),
    a.in(a.documentType, recordDocumentTypes),
  ),
);

/**
 * The `lastUpdated` of each usage statistic.
 */
const lastUpdateds = attributesOf("lastUpdated", statisticKinds);

/**
 * The `baseType` of each usage statistic's value that writes one.
 */
const usageBaseTypes = attributesOf("baseType", [usageValueKind]);

/**
 * The `baseType` of each usage statistic's value that spells a code, as written
 * (`spelledBaseTypes`): each has its {@link UsageValue}.
 */
const spelledUsageBaseTypes = select(Attribute, (a) =>
  a.and(a.eq(a.name, "baseType"), a.eq(a.kind, usageValueKind), a.in(a.lexical, baseTypes)),
);

/**
 * Every statement over the metadata overlays, each `check` named by its oracle law:
 *
 * - **the resources:** each `Resource` has its {@link LomResource}, both ways; and its `named` is
 *   `none` or its {@link TypedHref}'s type, an item's or a test's ("E1 derived"), and that type
 *   wherever its `href` is of an item's or a test's type, which holds exactly where the `href`
 *   names a document ("Document entry").
 * - **the records:** each `lom:lom` has its {@link LomRecord}; its tuple and its owner's are its
 *   nodes'; its `named` is its resource's where its owner is a resource's metadata, else `none`;
 *   and each naming record has its {@link LomObject}, the document at its resource's `href`'s
 *   path.
 * - **the general categories:** each `lom:general` has its {@link LomGeneral}, whose owner and
 *   owner's parent are its record's; {@link ResourceLomGeneral} is exactly those of a resource's
 *   records, with the resource.
 * - **the entries:** each `lom:entry` has its {@link LomEntry}, whose `text` is its string value,
 *   whose three tuples are its nodes', whose pieces concatenate to its text, and whose `named` is
 *   its record's for a general category's entry, else `none`.
 * - **the titles and strings:** each `lom:title` has its {@link LomTitle} with its record's `named`;
 *   each `lom:string` its {@link LomString}, whose `languages` counts its copied `language`; and
 *   each title's string its {@link LomTitleString}, whose `text` is its string value, whose
 *   `language` is its {@link LomString}'s, and whose compared forms are those two's ("E1
 *   derived").
 * - **the objects:** each item's and test's root has its {@link AssessmentObject}, one per document,
 *   with `langs` counting its `xml:lang` and its language's compared form; and each of its
 *   `identifier` (in pieces), `title` and `xml:lang` is copied into its own row,
 *   {@link ObjectIdentifier}, {@link ObjectTitle} or {@link ObjectLang}, with its compared form,
 *   and no such row stands without its attribute ("E1 derived", spec reading 148).
 * - **`lom-identifier`:** a general entry of a naming record makes its record's
 *   {@link LomObjectIdentifier} exist, whose document is its record's object's, whose identifier is
 *   that document's, and whose entry is a general entry of the record with that token.
 * - **`lom-title`:** a title of a naming record makes its record's {@link LomObjectTitle} exist,
 *   whose document, title value and language tag are its record's object's, and whose string is a
 *   title string of the record with that value, in the document's language ("LomObjectTitle").
 * - **the learning resource types:** each `lom:value` and each `lom:source` of a
 *   `lom:learningResourceType` is copied, with its string value, into its type's
 *   {@link LomResourceType} or {@link LomResourceTypeSource}, and every such row names one, by a
 *   key over its `term`, so no row stands for a term the type does not hold ("E1 derived").
 * - **`lom-learning-resource-type`:** a type whose value collapses to `exam` or `self assessment` has
 *   a source that names another vocabulary ("LOM learning resource type").
 * - **the date:** each statistic's `lastUpdated` is copied into its {@link StatisticDate}, and every
 *   such row has its attribute; its pieces concatenate to the lexical form, and `day`'s type is the
 *   language of the attribute's value domain ("value domain").
 * - **Usage typed value:** each usage value's `baseType` is copied into its {@link UsageValue}, and
 *   every such row has its attribute; its `text` is its node's string value; its code is the one
 *   its lexical form spells ("E1 derived"); and its text is a lexical form of that base type
 *   ("Usage typed value").
 */
export const metadataLawsByName = {
  "Document entry": [contained(on(objectHrefs, "node", "type"), on(LomResource, "node", "named"))],
  "DocumentId key": [
    key(on(stringLanguageAttributes, "node")),
    key(on(objectIdentifiers, "node")),
    key(on(objectTitles, "node")),
    key(on(objectLangAttributes, "node")),
    key(on(lastUpdateds, "node")),
    key(on(usageBaseTypes, "node")),
  ],
  "E1 derived": [
    mirrors(on(LomResource, "node"), on(Resource, "node")),
    contained(on(namingResources, "node", "named"), on(objectHrefs, "node", "type")),
    contained(
      on(LomRecord, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        LomRecord,
        "parent",
        "document",
        "owner",
        "ownerStart",
        "nearest",
        "version",
        "ownerParent",
      ),
      nodeRef,
    ),
    contained(on(recordNodes, "id"), on(LomRecord, "node")),
    check("E1_derived", LomRecord, (r) =>
      r.and(r.eq(r.kind, "lom:lom"), r.or(r.eq(r.owner, resourceMetadata), r.eq(r.named, "none"))),
    ),
    contained(on(resourceRecords, "ownerParent", "named"), on(LomResource, "node", "named")),
    contained(
      on(namingRecords, "node", "named", "ownerParent"),
      on(LomObject, "record", "type", "resource"),
    ),
    contained(
      on(LomObject, "record", "type", "resource"),
      on(LomRecord, "node", "named", "ownerParent"),
    ),
    contained(
      on(LomObject, "resource", "package", "path", "type"),
      on(TypedHref, "node", "package", "path", "type"),
    ),
    contained(
      on(LomObject, "package", "path", "document"),
      on(Document, "package", "path", "node"),
    ),
    contained(
      on(LomGeneral, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(generalNodes, "id"), on(LomGeneral, "node")),
    contained(
      on(LomGeneral, "parent", "owner", "ownerParent"),
      on(LomRecord, "node", "owner", "ownerParent"),
    ),
    check("E1_derived", LomGeneral, (g) => g.eq(g.kind, "lom:general")),
    mirrors(
      on(ResourceLomGeneral, "node", "resource"),
      on(resourceGenerals, "node", "ownerParent"),
    ),
    contained(
      on(LomEntry, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        LomEntry,
        "parent",
        "document",
        "identifierKind",
        "identifierStart",
        "nearest",
        "version",
        "holder",
      ),
      nodeRef,
    ),
    contained(
      on(
        LomEntry,
        "holder",
        "document",
        "holderKind",
        "holderStart",
        "nearest",
        "version",
        "holderParent",
      ),
      nodeRef,
    ),
    contained(on(entryNodes, "id", "stringValue"), on(LomEntry, "node", "text")),
    check("E1_derived", LomEntry, (e) =>
      e.and(
        e.eq(e.kind, "lom:entry"),
        e.eq(e.identifierKind, "lom:identifier"),
        e.eq(e.text, Compute.concat(Compute.concat(e.lead, e.token), e.trail)),
        Compute.matches(e.token, trimmedPattern),
        e.or(e.ne(e.token, ""), e.eq(e.trail, "")),
        e.or(e.eq(e.holderKind, "lom:general"), e.eq(e.named, "none")),
      ),
    ),
    contained(on(generalEntries, "holderParent", "named"), on(LomRecord, "node", "named")),
    contained(
      on(LomTitle, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        LomTitle,
        "parent",
        "document",
        "generalKind",
        "generalStart",
        "nearest",
        "version",
        "record",
      ),
      nodeRef,
    ),
    contained(on(titleNodes, "id"), on(LomTitle, "node")),
    check("E1_derived", LomTitle, (t) =>
      t.and(t.eq(t.kind, "lom:title"), t.eq(t.generalKind, "lom:general")),
    ),
    contained(on(LomTitle, "record", "named"), on(LomRecord, "node", "named")),
    mirrors(on(LomString, "node"), on(stringNodes, "id")),
    lomStringLanguages,
    contained(
      on(stringLanguageAttributes, "node", "lexical"),
      on(LomStringLanguage, "node", "language"),
    ),
    check("E1_derived", LomStringLanguage, (s) =>
      s.eq(s.languageTag, Compute.lowerAscii(s.language)),
    ),
    contained(
      on(
        select(LomString, (s) => s.eq(s.languages, 1n)),
        "node",
        "languageTag",
      ),
      on(LomStringLanguage, "node", "languageTag"),
    ),
    check("E1_derived", LomString, (s) =>
      s.or(s.eq(s.languages, 1n), s.eq(s.languageTag, noLanguage)),
    ),
    contained(
      on(LomTitleString, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(titleStringNodes, "id", "stringValue"), on(LomTitleString, "node", "text")),
    contained(on(LomTitleString, "parent", "record"), on(LomTitle, "node", "record")),
    contained(on(LomTitleString, "node", "languageTag"), on(LomString, "node", "languageTag")),
    check("E1_derived", LomTitleString, (s) =>
      s.and(s.eq(s.kind, "lom:string"), s.eq(s.textValue, Compute.replaceWhitespace(s.text))),
    ),
    contained(
      on(AssessmentObject, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    key(on(AssessmentObject, "document")),
    check("E1_derived", AssessmentObject, (o) =>
      o.and(
        o.in(o.kind, objectKinds),
        o.eq(o.parent, o.document),
        o.or(o.eq(o.langs, 1n), o.eq(o.langTag, noLanguage)),
      ),
    ),
    contained(on(objectIdentifiers, "node", "lexical"), on(ObjectIdentifier, "node", "lexical")),
    contained(on(ObjectIdentifier, "node"), on(objectIdentifiers, "node")),
    contained(on(ObjectIdentifier, "node", "document"), on(AssessmentObject, "node", "document")),
    key(on(ObjectIdentifier, "document")),
    check("E1_derived", ObjectIdentifier, (o) =>
      o.and(
        o.eq(o.lexical, Compute.concat(Compute.concat(o.lead, o.identifier), o.trail)),
        Compute.matches(o.identifier, identifierPattern),
      ),
    ),
    contained(on(objectTitles, "node", "lexical"), on(ObjectTitle, "node", "title")),
    contained(on(ObjectTitle, "node"), on(objectTitles, "node")),
    contained(on(ObjectTitle, "node", "document"), on(AssessmentObject, "node", "document")),
    key(on(ObjectTitle, "document")),
    check("E1_derived", ObjectTitle, (o) => o.eq(o.titleValue, Compute.replaceWhitespace(o.title))),
    objectLangs,
    contained(on(objectLangAttributes, "node", "lexical"), on(ObjectLang, "node", "lang")),
    check("E1_derived", ObjectLang, (o) =>
      o.eq(o.langTag, Compute.lowerAscii(Compute.collapse(o.lang))),
    ),
    contained(
      on(
        select(AssessmentObject, (o) => o.eq(o.langs, 1n)),
        "node",
        "langTag",
      ),
      on(ObjectLang, "node", "langTag"),
    ),
    contained(on(LomObjectIdentifier, "record", "document"), on(LomObject, "record", "document")),
    contained(
      on(LomObjectIdentifier, "document", "identifier"),
      on(ObjectIdentifier, "document", "identifier"),
    ),
    contained(on(LomObjectTitle, "record", "document"), on(LomObject, "record", "document")),
    contained(on(LomObjectTitle, "document", "title"), on(ObjectTitle, "document", "titleValue")),
    contained(
      on(LomObjectTitle, "document", "objectLang"),
      on(AssessmentObject, "document", "langTag"),
    ),
    contained(
      on(resourceTypeValues, "id", "parent", "stringValue"),
      on(LomResourceType, "term", "node", "text"),
    ),
    contained(on(LomResourceType, "term"), on(resourceTypeValues, "id")),
    key(on(LomResourceType, "term")),
    contained(
      on(resourceTypeSources, "id", "parent", "stringValue"),
      on(LomResourceTypeSource, "term", "node", "text"),
    ),
    contained(on(LomResourceTypeSource, "term"), on(resourceTypeSources, "id")),
    key(on(LomResourceTypeSource, "term")),
    contained(on(lastUpdateds, "node", "lexical"), on(StatisticDate, "node", "lexical")),
    contained(on(StatisticDate, "node"), on(lastUpdateds, "node")),
    check("E1_derived", StatisticDate, (s) =>
      s.eq(s.lexical, Compute.concat(Compute.concat(s.lead, s.day), s.trail)),
    ),
    contained(
      on(spelledUsageBaseTypes, "node", "lexical"),
      on(UsageValue, "node", "baseTypeLexical"),
    ),
    contained(on(UsageValue, "node"), on(usageBaseTypes, "node")),
    contained(on(UsageValue, "node", "text"), on(Node, "id", "stringValue")),
    check("E1_derived", UsageValue, (u) =>
      u.and(
        u.ne(u.baseType, "none"),
        u.eq(BaseTypeLexical.at("lexical", u.baseType), u.baseTypeLexical),
      ),
    ),
  ],
  "LOM learning resource type": [
    contained(on(forbiddenResourceTypeValues, "node"), on(otherVocabularySources, "node")),
  ],
  LomObjectIdentifier: [
    contained(on(namingEntries, "holderParent"), on(LomObjectIdentifier, "record")),
    contained(
      on(LomObjectIdentifier, "entry", "general", "record", "identifier"),
      on(generalEntries, "node", "holder", "holderParent", "token"),
    ),
  ],
  LomObjectTitle: [
    contained(on(namingTitles, "record"), on(LomObjectTitle, "record")),
    contained(
      on(LomObjectTitle, "string", "record", "title"),
      on(LomTitleString, "node", "record", "textValue"),
    ),
    contained(
      on(LomObjectTitle, "string", "stringLanguage"),
      on(LomTitleString, "node", "languageTag"),
    ),
    check("LomObjectTitle", LomObjectTitle, (l) =>
      l.or(
        l.eq(l.objectLang, noLanguage),
        l.eq(l.stringLanguage, noLanguage),
        l.eq(l.stringLanguage, l.objectLang),
      ),
    ),
  ],
  "Node key": [
    key(on(entryNodes, "id")),
    key(on(titleStringNodes, "id")),
    key(on(resourceTypeValues, "id")),
    key(on(resourceTypeSources, "id")),
  ],
  "Usage typed value": [
    check("Usage_typed_value", UsageValue, (u) =>
      u.or(
        u.in(u.baseType, unjudgedBaseTypes),
        Compute.matches(u.text, BaseTypePattern.at("pattern", u.baseType)),
      ),
    ),
  ],
} as const;

/**
 * {@link metadataLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const metadataLaws = Object.values(metadataLawsByName).flat();
