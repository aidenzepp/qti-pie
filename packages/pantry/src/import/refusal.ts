/**
 * The names a refused import carries, and how a refusal names one (plan W5, Q5.17; the W5
 * amendment's C22).
 *
 * A package is refused before any row exists, by the reader, the ZIP container or the codec
 * ({@link ruleOfError}), or by grizzle's `invariant-rejected` outcome, which names every law
 * merged into the PostgreSQL object that refused the write ({@link refusalOf}). Each law keeps the
 * rule of the guard or schema rule it replaces, so a verdict reads as it did.
 *
 * - **Laws by name.** Every law the schema states has a name, the law oracle's (`src/test/oracle.ts`
 *   `LawName`) where the oracle states the law, with its rule and its spec source
 *   ({@link lawTable}). An outcome's law is named by its own fields ({@link lawNameOf}): a check by
 *   its name ({@link checkNameOf}), a primary key by its relation, a generated field by its
 *   relation and field, a contract by its name, a pattern by its field's type, and a statement's
 *   law by the group its module files the statement under, matched by grizzle's `sameLaw`. The
 *   tables are dictionaries keyed by the database's law, never a judge.
 * - **A refusal is what the database said.** A family's axis foreign key discharges the family and
 *   every containment and fold merged into it, and its violation names them all. The refusal
 *   carries how grizzle decided them, every law it named and the set of their rules
 *   ({@link rulesOf}), listed by one fixed order ({@link precedence}) for display. It singles out
 *   no law where grizzle's outcome does not, and reads no row of the import's.
 * - **Explanations are computed.** {@link explain} reads the laws, the witness and the installed
 *   grammar's rows; for a content-order law it names the positions `Follow` allows next, each with
 *   its XSD particle. There is no catalog of messages.
 */
import { constraintNamesOf, lawsByStatement, lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { AnySchema, Law, Refused, RegexText, Statement, Witness } from "@bjornpagen/grizzle";
import {
  Array as Arr,
  Function as Fn,
  Formatter,
  Match,
  Option,
  Order,
  pipe,
  Predicate,
  Schema,
} from "effect";
import type { Types } from "effect";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { followPairsOf } from "#pantry/grammar/content.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { NotQti3, UnmodeledVocabulary } from "#pantry/model/shred.ts";
import {
  attributeLawsByName,
  EntityName,
  Lexical,
  OpenLocal,
  Space,
} from "#pantry/qti/attributes.ts";
import {
  Affix,
  expressionLawsByName,
  referenceLawsByName,
  referenceRelations,
  Separator,
} from "#pantry/qti/expressions.ts";
import {
  chardataLawsByName,
  CommentText,
  DoctypeText,
  EncName,
  EntryPath,
  ForeignNamespace,
  NamespacePrefix,
  NamespaceUri,
  NcName,
  PiData,
  PiTarget,
  XmlVersion,
} from "#pantry/qti/chardata.ts";
import { readerOrigin, RefusalOrigin } from "#pantry/package/refusal-origin.ts";
import type { RefusedLaw } from "#pantry/package/refusal-origin.ts";
import { keyText, namespaceText } from "#pantry/qti/limits.ts";
import { interactionLawsByName, interactionRelations } from "#pantry/qti/interactions.ts";
import {
  Digits,
  Gap,
  Item,
  mappingLawsByName,
  Negative,
  Sign,
  Zeros,
} from "#pantry/qti/mapping.ts";
import { DayForm, metadataLawsByName, metadataRelations } from "#pantry/qti/metadata.ts";
import { Chars, EndCharacter, nodeLawsByName, Prefix } from "#pantry/qti/node.ts";
import { declarationLawsByName } from "#pantry/qti/declarations.ts";
import { catalogLawsByName, catalogRelations } from "#pantry/qti/catalog.ts";
import { htmlLawsByName, htmlRelations } from "#pantry/qti/html.ts";
import { identityLawsByName } from "#pantry/qti/identity.ts";
import { mathmlLawsByName, mathmlRelations } from "#pantry/qti/mathml.ts";
import { operatorLawsByName, operatorRelations } from "#pantry/qti/operators.ts";
import { HrefParams, packageLawsByName } from "#pantry/qti/package.ts";
import { quotationLawsByName, quotationRelations } from "#pantry/qti/quotation.ts";
import { SelectForm, testLawsByName } from "#pantry/qti/tests.ts";
import type { testRelations } from "#pantry/qti/tests.ts";
import { builtLawsByName, Qti } from "#pantry/qti/own.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import type { ZipRefusal } from "#pantry/package/zip.ts";
import type { Source } from "#pantry/vocab/inventory/types.ts";
import { lawTable, precedence } from "#pantry/vocab/laws.ts";

/**
 * The rules a package is refused under before any row exists, which no law keeps: the codec's
 * `not-qti3` (shred reads no schema version or a QTI 2 root), the reader's `reader-refusal`, and
 * the ZIP container's and the package reader's (`src/package/zip.ts`, `read.ts`). The codec's
 * `unmodeled-vocabulary` and `attribute-admission` and the reader's `well-formedness` are laws'
 * rules as well, in {@link precedence}.
 */
const codecRules = [
  "not-qti3",
  "reader-refusal",
  "zip-format",
  "manifest-root",
  "href-path",
] as const;

/**
 * The rules that name a stated limit of the representation, never a law of the specification:
 * `key-text-bound` is the bound on a text a key holds (`src/qti/limits.ts` `keyText`), which
 * grizzle's representability rule derives from PostgreSQL's `BTMaxItemSize`, and `href-form` an
 * href the importer reads no name from (reading 102, `overlays/package.ts` `Limit`), and
 * `fragment-context` the one context an included fragment's rows are judged in (reading 117,
 * `tests.ts` `Fragment_context`): a fragment two includes place in different interactions would
 * need two rows per node, and `remote-section` a section ref whose href resolves outside the
 * package (reading 170, `tests.ts` `Remote_section_ref`): the import is offline and never fetches
 * the section, which is the test's own content, so it cannot assemble the test.
 *
 * A value over the bound is valid QTI the model cannot key, so its verdict says so by its rule. The
 * import meets it as the bound's pattern law: grizzle's encoder and its family fill check a text's
 * type, its NUL and its surrogates and never its pattern (`core/text.ts` `validateText`,
 * `write/family/fold.ts` `admittedAt`), so the column's domain CHECK refuses it as the statement
 * casts it, `invariant-rejected` on its field's pattern law, its witness the key of the stated row
 * that holds the value (README, "Errors and outcomes").
 */
export const limitRules = [
  "key-text-bound",
  "href-form",
  "fragment-context",
  "remote-section",
] as const satisfies readonly (typeof precedence)[number][];

/**
 * Every name a refused import may carry: the laws' rules, the codec's, the reader's and the
 * container's, in the order a refusal lists its rules ({@link ruleOrder}).
 *
 * The verdict file names its refusals by these (`verdicts/*.tsv`, `src/test/verdicts.ts`).
 */
export const ImportRule = Schema.Literals([...precedence, ...codecRules]);

/**
 * One name of the roster.
 */
export type Rule = typeof ImportRule.Type;

/**
 * The order a refusal lists its rules in, and the verdict file writes them in: the roster's, the
 * laws' rules most specific first by {@link precedence}, then the codec's. It is a total order, so
 * a set of rules has one listing, and it decides nothing: a refusal carries every rule its laws
 * carry.
 */
export const ruleOrder: Order.Order<Rule> = Order.mapInput(Order.Number, (rule: Rule) =>
  ImportRule.literals.indexOf(rule),
);

/**
 * The rules no law of the schema keeps yet, each with the W5 slice that states its law, so the
 * census shows them. Each slice names its law, and its row joins {@link lawTable} or
 * {@link statedLaws} when it lands.
 *
 * - `typed-copy`: a typed value proved against its lexical form through G-parse (the tier 1
 *   addendum), as a relation of its own per typed form.
 * - The O2 to O4 and O6 laws the oracle states no host predicate for.
 */
export const owedRules = {} as const satisfies Partial<Readonly<Record<Rule, string>>>;

/**
 * The name of a law of {@link lawTable}.
 */
export type LawName = keyof typeof lawTable;

/**
 * Every law name, in the table's order.
 */
export const lawNames: readonly LawName[] = Object.keys(lawTable).filter((name): name is LawName =>
  Object.hasOwn(lawTable, name),
);

/**
 * Name the check that states a law: its name with each space an underscore, since grizzle's check
 * names are `[A-Za-z0-9_]` and no law name holds an underscore, so {@link lawOfCheck} inverts it.
 *
 * @param law - The law.
 * @returns The check's name.
 */
export const checkNameOf = (law: LawName): string => law.replaceAll(" ", "_");

/**
 * Read the law a check states from the check's name, as an `invariant-rejected` outcome reports it.
 *
 * @param name - The check's name.
 * @returns The law, or none for a name no law's check bears.
 */
export const lawOfCheck = (name: string): Option.Option<LawName> => {
  const law = name.replaceAll("_", " ");

  return Option.fromUndefinedOr(lawNames.find((known) => known === law));
};

/**
 * The relation each side of a law reads, in the order the law names its sides: the part of a law
 * {@link bucketOf} files it under beside its kind. A contract reads no relation, and a law of a
 * level above the schema reads its own law's relations: `Qti` is one level, which no level extends,
 * so no outcome names one (grizzle `999facc6`'s `above`), and none is in the table.
 *
 * @param law - A law as grizzle names it.
 * @returns Its sides' relations.
 */
const relationsOf = (law: Law): readonly string[] =>
  Match.value(law).pipe(
    Match.discriminatorsExhaustive("kind")({
      above: ({ law: stated }) => relationsOf(stated),
      check: ({ relation }) => [relation],
      contained: ({ from, to }) => [from.relation, to.relation],
      contract: () => [],
      coverage: ({ from, to }) => [from.relation, to.relation],
      family: ({ member, slots }) => [member.relation, slots.owner],
      fold: ({ end, family, step }) => [family.owner, step.relation, end.relation],
      generated: ({ relation }) => [relation],
      key: ({ side }) => [side.relation],
      pattern: ({ relation }) => [relation],
      primaryKey: ({ relation }) => [relation],
      tree: ({ member, slots }) => [member.relation, slots.owner],
    }),
  );

/**
 * File a law by its kind and its sides' relations, so {@link lawNameOf} holds an outcome's law to
 * the few stated laws of that kind over those relations, never every law of Qti.
 *
 * This is no identity of the law: grizzle's `sameLaw` decides whether two laws are one, comparing
 * them whole, and two laws one bucket holds may still differ in their terms or selections. The
 * bucket only needs one law's two descriptions to fall in it together, which they do, since
 * `sameLaw` holds only of laws of one kind whose sides read the same relations.
 *
 * @param law - A law as grizzle names it.
 * @returns Its bucket.
 */
const bucketOf = (law: Law): string => [law.kind, ...relationsOf(law)].join(" ");

/**
 * The law of a given kind.
 */
type LawOf<Kind extends Law["kind"]> = Extract<Law, { readonly kind: Kind }>;

/**
 * Name each key by one law: one row per key, so a table lists its laws as their names group them.
 *
 * @param name - The law.
 * @param keys - The keys it names.
 * @returns The rows.
 */
const namedBy = (
  name: LawName,
  ...keys: readonly string[]
): readonly (readonly [string, LawName])[] => keys.map((key) => [key, name] as const);

/**
 * Name every stored relation of a module's relations by one law: a module whose rows one law holds
 * whole. A roster, a closed relation or a derived one the module declares has no primary key law,
 * and no row.
 *
 * @param name - The law.
 * @param modules - The modules' relations, each by its name.
 * @returns A row per stored relation, by its name.
 */
const namedWhole = (
  name: LawName,
  ...modules: readonly Readonly<Record<string, { readonly kind: string; readonly name: string }>>[]
): readonly (readonly [string, LawName])[] =>
  modules.flatMap((relations) =>
    Object.values(relations).flatMap((relation) =>
      relation.kind === "relation" ? [[relation.name, name] as const] : [],
    ),
  );

/**
 * The law each primary key of `tests.ts`'s relations is named by: an overlay's "Test overlay", and
 * the assembled test's instances', its names' and its branch resolutions' (Q5.13) the law their
 * key states. The record is total over `testRelations`, so a relation `tests.ts` gains is named
 * here or fails to compile.
 */
const testKeyNames = {
  AssembledName: "Test name key",
  BranchResolution: "Branch target",
  BranchRule: "Test overlay",
  BranchShuffle: "Branch forward",
  BranchTarget: "Branch target",
  Inclusion: "Test overlay",
  Instance: "Inclusion cycle",
  InstanceName: "Test name key",
  ItemRefDocument: "Test overlay",
  ItemRefTarget: "Item ref target",
  Named: "Test overlay",
  Section: "Test overlay",
  SectionMember: "Test overlay",
  SectionOrdering: "Test overlay",
  SectionSelection: "Test overlay",
  Site: "Test overlay",
  SitePath: "Test overlay",
  SiteTarget: "Test overlay",
  StimulusRef: "Test overlay",
  TestDocument: "Test overlay",
  TestFlag: "Test overlay",
  TestToken: "Test overlay",
  VariableMapping: "Test overlay",
} as const satisfies { readonly [Name in keyof typeof testRelations]: LawName };

/**
 * The law each primary key of Qti's stored relations is named by, by the relation's name: grizzle's
 * `lawsOf` lists one primary key law per stored relation, `{ kind: "primaryKey", relation, fields
 * }`, so an outcome's names its relation (README, "Errors and outcomes"). Each is named by the law
 * its module's rows belong to, in the module order of the plan's §C: an overlay's rows by its
 * overlay's law, the assembled test's by the law their key states ({@link testKeyNames}), and the
 * rows the import derives from others' by "E1 derived", a module whose every row it derives by
 * {@link namedWhole}.
 *
 * The census (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways, every primary
 * key named and every row a stored relation's, each once. A row is the relation's name, never the
 * relation, so a module that gains, drops or turns a relation into a query lands in either order
 * with the row's edit here.
 */
export const keyNames: readonly (readonly [string, LawName])[] = [
  ...namedBy("Node key", "Node"),
  ...namedBy("E1 derived", "ElementType"),
  ...namedBy("comment arm", "Comment"),
  ...namedBy("pi arm", "Pi"),
  ...namedBy("doctype arm", "Doctype"),
  ...namedBy("Document", "Document", "XmlDecl", "EncodingDecl", "SdDecl"),
  ...namedBy("Namespace family", "Namespace"),
  ...namedBy("OpenElementName", "OpenElementName"),
  ...namedBy("E1 derived", "OpenElementType"),
  ...namedBy("AL2 count", "Attribute"),
  ...namedBy("AL4 open names", "OpenAttributeName"),
  ...namedBy("E1 derived", "Idref"),
  ...namedBy("AttributeEntity owner", "AttributeEntity"),
  ...namedBy("Double value", "DoubleValue", "TextDoubleValue"),
  ...namedBy("Package key", "Package"),
  ...namedBy("Entry family", "Entry"),
  ...namedBy(
    "Manifest overlay",
    "ManifestId",
    "Resource",
    "ResourceId",
    "File",
    "Dependency",
    "DependencyTarget",
    "ManifestIdSpace",
    "ResourceHref",
  ),
  ...namedBy("E1 derived", "ResourceDocument", "ResourceTyped"),
  ...namedBy("File listed", "FileHref"),
  ...namedBy("Href listed", "ResourceFile"),
  ...namedBy(
    "Reference overlay",
    "Reference",
    "ReferencePath",
    "TextReference",
    "TextReferencePath",
  ),
  ...namedBy(
    "E1 derived",
    "IdBinding",
    "IdrefTarget",
    "PlacedId",
    "AssembledId",
    "PlacedIdref",
    "IdentityText",
    "TextIdref",
  ),
  ...namedBy("DocumentId key", "DocumentId"),
  ...namedBy(
    "E1 derived",
    "XmlLang",
    "DocumentLang",
    "PlacedXmlLang",
    "AssembledLang",
    "SsmlAttribute",
    "BodyXmlLang",
    "PlacedBodyXmlLang",
    "CatalogScope",
    "ShareFragment",
    "SsmlScope",
    "FragmentValue",
    "LomLanguage",
    "ResourceLomLanguageSet",
  ),
  ...namedBy("Label tools", "LabelUse"),
  ...namedBy(
    "Declaration overlay",
    "Declaration",
    "DeclarationCardinality",
    "DeclarationBaseType",
    "DeclarationIdentifier",
    "DeclarationName",
    "ValueSet",
    "ValueSetCardinality",
    "Value",
    "TypedValue",
    "ValueBaseType",
    "FieldValue",
    "RecordField",
    "RecordFieldName",
    "MasteryValue",
    "NormalMinimum",
    "NormalMaximum",
    "MasteryFloor",
    "MasteryCeiling",
  ),
  ...Object.entries(testKeyNames),
  ...namedBy(
    "Mapping overlay",
    "Mapping",
    "MappingBaseType",
    "MappingCardinality",
    "MapKey",
    "MapKeyType",
    "MapKeyPoint",
    "MapKeyPair",
    "MapKeyDirectedPair",
    "AreaMapping",
    "AreaMappingCardinality",
    "LookupTable",
    "LookupTableCardinality",
    "LookupValue",
    "LookupValueType",
  ),
  ...namedBy(
    "E1 derived",
    "Expression",
    "ExpressionAttribute",
    "Literal",
    "LiteralTyped",
    "Operand",
    "Processing",
    "ProcessingTemplate",
    "VariableRef",
  ),
  ...namedWhole(
    "E1 derived",
    interactionRelations,
    referenceRelations,
    metadataRelations,
    htmlRelations,
    quotationRelations,
    operatorRelations,
    catalogRelations,
    mathmlRelations,
  ),
];

/**
 * The law each generated field of Qti's stored relations is named by, by `Relation.field`: grizzle
 * names one when PostgreSQL refuses a row because the field's column is NULL there (23502). grizzle
 * writes no NULL, so only the field's term can have no value: a closed read `C.at` at a key its
 * closed relation holds no row at. No term of Qti's reads `C.at`, so no row breaks one. Each is
 * named by the law that states its value exists, its relation's rows', and the census
 * (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways:
 *
 * - An IDREF token's piece, a header's and a tolerance value's, and a reference segment's token, is
 *   its own whitespace or separator and its token concatenated, its concat fold's step: written
 *   texts, none NULL, so the term is never NULL. A piece or a token past its keyText bound is
 *   refused by its own pattern law, named by keyText's row of {@link textLaws}, "Key text bound".
 * - An operand's type bits read `ValueBaseBit.row` and `ValueCardinalityBit.row`, closed reads of a
 *   set keyed by the row's own NOT NULL `baseType` and `cardinality`: ∅ where the diagonal holds no
 *   row (`any`, `unknown`), never NULL, which only a NULL key, an absent `C.at`, reads
 *   (docs/grizzle-findings.md, lane DBT's). A field a closed relation determines is E1 derived.
 * - A selection's `select` casts `selectForm`, which its pattern law, named by SelectForm's row of
 *   {@link textLaws}, holds to the language the cast reads total: a form outside it is refused by
 *   that law as the statement casts it into its column, before PostgreSQL computes `select`.
 * - A statistic's `date` casts `day`, which its pattern law, named by DayForm's row of
 *   {@link textLaws}, holds to the days 0001-01-01 to 9999-12-31 the cast reads total, refused the
 *   same way. Its value is the calendar day `lastUpdated` names, which the value domain states
 *   exists, so it is the value domain's.
 * - A typed map key's generated fields read its own split, by concatenation and conditionals. No term
 *   reads a closed relation, so none is NULL.
 * - A document's and an item's assembly's `xml:lang` form's compared `value` is the form collapsed
 *   and case-folded, cast into the form's own key text, a cast the schema proves total: a written
 *   text, never NULL.
 */
export const generatedNames: readonly (readonly [string, LawName])[] = [
  ...namedBy(
    "E1 derived",
    "Idref.piece",
    "TextIdref.piece",
    "HeaderToken.piece",
    "ToleranceToken.piece",
    "ReferenceSegment.token",
    "Operand.baseTypeBit",
    "Operand.cardinalityBit",
    "SectionSelection.select",
  ),
  ...namedBy("value domain", "StatisticDate.date"),
  ...namedBy(
    "E1 derived",
    "MapKeyPoint.value",
    "MapKeyPoint.xNegative",
    "MapKeyPoint.yNegative",
    "MapKeyPair.value",
    "MapKeyDirectedPair.value",
    "DocumentLang.value",
    "AssembledLang.value",
  ),
];

/**
 * The law each contract Qti's fields are of is named by, by the contract's name: grizzle's builtin
 * `natural`, a bigint never below zero (README, "Tables and types": "A negative value is an outcome
 * on the law `{ kind: "contract", contract: "natural" }`"), the type of every count, position and
 * bit set of the model. Each natural the import writes is a count or a position of its own rows, or
 * a set of a closed relation's bits, and grizzle draws or accumulates the rest, so no row breaks
 * it, and it is named by the law of the values the import derives, "E1 derived". The census
 * (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways.
 */
export const contractNames: readonly (readonly [string, LawName])[] = namedBy(
  "E1 derived",
  "natural",
);

/**
 * A field PostgreSQL or grizzle writes, read from its descriptor: the type `generated(type, term)`
 * or `accumulated(type, start)` declared it of (grizzle's `schema/relation.ts` `generatedField`
 * and `accumulatedField`), which grizzle's installation types its column by.
 */
const Written = Schema.Union([
  Schema.Struct({ type: Schema.Unknown, writing: Schema.Literal("generated") }),
  Schema.Struct({ field: Schema.Unknown, writing: Schema.Literal("accumulated") }),
]);

/**
 * A relation with fields, its fields' descriptors as they are: decoding passes each descriptor
 * through by its identity, so {@link patternNameIn} finds a field's type by it.
 */
const Fielded = Schema.Struct({ fields: Schema.Record(Schema.String, Schema.Unknown) });

/**
 * Read the type a pattern law's field is declared of: a generated or accumulated field's declared
 * type, any other field's descriptor itself. A schema holds each relation under its own name
 * (grizzle's `schema/schema.ts` `underOwnName`), so the law's relation is its key there.
 *
 * @param relations - The schema's `relations`.
 * @param law - A pattern law of the schema's.
 * @returns The field's type; none where the schema holds no such field.
 */
export const patternTypeOf = (
  relations: AnySchema["relations"],
  { field, relation }: LawOf<"pattern">,
): Option.Option<unknown> =>
  pipe(
    Schema.decodeUnknownOption(Fielded)(relations[relation]),
    Option.flatMap(({ fields }) => Option.fromUndefinedOr(fields[field])),
    Option.map((descriptor) =>
      Option.match(Schema.decodeUnknownOption(Written)(descriptor), {
        onNone: () => descriptor,
        onSome: (written) => (written.writing === "generated" ? written.type : written.field),
      }),
    ),
  );

/**
 * Name a pattern law by its field's type's row.
 *
 * The law is grizzle's, one per stored field whose patterns state a law, spelled as the field
 * declares its patterns (one for `str.regex`, each joined one in order for `str.and`): a
 * tautology, a contract's pattern and a closed relation's payload state none. Two fields of one
 * language share one domain and are two laws, so a refusal names the field whose value broke it,
 * and each field's law takes its own type's name.
 *
 * @param relations - The schema's `relations`.
 * @param names - Each text type, by its identity, with the law its patterns state.
 * @param law - A pattern law of the schema's.
 * @returns Its name; none where its field's type has no row.
 */
export const patternNameIn = (
  relations: AnySchema["relations"],
  names: ReadonlyMap<RegexText<string>, LawName>,
  law: LawOf<"pattern">,
): Option.Option<LawName> => {
  const byType: ReadonlyMap<unknown, LawName> = names;

  return Option.flatMap(patternTypeOf(relations, law), (type) =>
    Option.fromUndefinedOr(byType.get(type)),
  );
};

/**
 * The law each text type of Qti's fields states, by the type's identity: the one object its module
 * exports and its relations type their fields by, so a bound that moves moves its row. Every text
 * field's pattern law is named by its type's row ({@link patternNameIn}), in the classes of the
 * orchestrator's ruling of 2026-11-06:
 *
 * - A bound on a text is "Key text bound", a stated limit. `keyText` and `namespaceText` hold any
 *   text; the bounded names and paths also carry a production no package the reader accepts breaks,
 *   so their refusal means the bound alone. A prefix and a local name are NCNames because crust
 *   reads with saxes's `xmlns` on, which refuses a name that is no QName (Namespaces in XML 1.0,
 *   §4); a foreign namespace name is `Char`s because crust reads no other; an entry path begins
 *   with no `/` because the directory reader lists paths relative to the package root and `zip.ts`
 *   refuses an absolute name;
 * - A pair's or a directed pair's item is "Typed attribute value": `Item` (wider than an identifier)
 *   refuses only a key `Typed_attribute_value` refuses on its `MapKeyType` row;
 * - An unbounded XML production (a node's or an attribute's `Char*`, a comment, an instruction, a
 *   doctype, an encoding name, a version number, an NCName) is "XML production", which crust
 *   refuses before any row exists;
 * - A namespace declaration's value is "Namespace name": an RFC 3986 URI reference (reading 131),
 *   which crust does not check, so the domain is the law;
 * - The whitespace around an IDREF token is the host's own split, "E1 derived", as is every other
 *   piece the host splits a lexical form into: a map key's, a reference's, a node's end characters.
 *   A selection's form and a statistic's day restate an attribute's value, so each is "value
 *   domain", the law of the value it restates.
 *
 * The census (`refusal.oracle.test.ts`) names every pattern law of `lawsOf(Qti)` by a row, and
 * holds each row to a field's type.
 */
export const textLaws: ReadonlyMap<RegexText<string>, LawName> = new Map<
  RegexText<string>,
  LawName
>([
  [keyText, "Key text bound"],
  [namespaceText, "Key text bound"],
  [Prefix, "Key text bound"],
  [OpenLocal, "Key text bound"],
  [NamespacePrefix, "Key text bound"],
  [ForeignNamespace, "Key text bound"],
  [EntryPath, "Key text bound"],
  [NamespaceUri, "Namespace name"],
  [Chars, "XML production"],
  [Lexical, "XML production"],
  [CommentText, "XML production"],
  [PiTarget, "XML production"],
  [PiData, "XML production"],
  [DoctypeText, "XML production"],
  [EncName, "XML production"],
  [XmlVersion, "XML production"],
  [NcName, "XML production"],
  [EntityName, "XML production"],
  [Space, "E1 derived"],
  [Sign, "E1 derived"],
  [Zeros, "E1 derived"],
  [Digits, "E1 derived"],
  [Negative, "E1 derived"],
  [Gap, "E1 derived"],
  [Item, "Typed attribute value"],
  [Affix, "E1 derived"],
  [Separator, "E1 derived"],
  [HrefParams, "E1 derived"],
  [EndCharacter, "E1 derived"],
  // `selectForm` restates a selection's `select`, an `xs:int`, whose lexical space the attribute's
  // value domain states, with its whitespace split off. The import writes every selection's row
  // whatever its `select` holds, so PostgreSQL may meet `SelectForm`'s domain before the
  // attribute's value domain. Its pattern law is the value domain's, with its rule, so one cause
  // names one rule, as `DayForm`'s is.
  [SelectForm, "value domain"],
  // `day` restates `lastUpdated`, a `DateDType`, whose language the attribute's value domain
  // states: xs:date's lexical space, the month lengths and the leap rule included, under its
  // pattern. Its type, `DayForm`, `lexical(date)`, is that language, and its pattern law is the
  // value domain's, with its rule, so one cause names one rule (the orchestrator's ruling of
  // 2026-11-06).
  [DayForm, "value domain"],
]);

/**
 * A module's statements by the law each states, the law's name its key: `nodeLawsByName` of
 * `#pantry/qti/node.ts` and its peers, so a law is named where it is stated and this module reads
 * the name rather than restating the law.
 */
type LawsByName = { readonly [Name in LawName]?: readonly Statement[] };

/**
 * The modules that name their laws where they state them, each a {@link LawsByName}: the stored
 * level's, then the groups built with `Qti` (`#pantry/qti/own.ts` `builtLawsByName`), its policy's
 * and each domain's rules over the queries (`#pantry/qti/queries.ts`).
 */
export const namedLaws: readonly LawsByName[] = [
  nodeLawsByName,
  chardataLawsByName,
  attributeLawsByName,
  packageLawsByName,
  identityLawsByName,
  declarationLawsByName,
  mappingLawsByName,
  interactionLawsByName,
  expressionLawsByName,
  referenceLawsByName,
  metadataLawsByName,
  htmlLawsByName,
  quotationLawsByName,
  operatorLawsByName,
  catalogLawsByName,
  mathmlLawsByName,
  testLawsByName,
  ...builtLawsByName,
];

/**
 * Read a module's groups: each law name it groups statements under, with them. A name the module
 * states no law of has no entry.
 *
 * @param byName - The module's statements by law.
 * @returns Its groups.
 */
const groupsOf = (byName: LawsByName): readonly (readonly [LawName, readonly Statement[]])[] =>
  Object.entries(byName).flatMap(([held, statements]) =>
    lawNames.flatMap((name) => (name === held ? [[name, statements] as const] : [])),
  );

/**
 * The name of the law each statement of {@link namedLaws} states, by the statement: the very value
 * a module declares and `Qti` lists, which grizzle's `lawsByStatement` looks its laws up by.
 */
const nameOfStatement: ReadonlyMap<Statement, LawName> = new Map(
  namedLaws.flatMap((byName) =>
    groupsOf(byName).flatMap(([name, statements]) =>
      statements.map((statement) => [statement, name] as const),
    ),
  ),
);

/**
 * Each statement of a schema beside its laws, as grizzle's `lawsByStatement` names them: each law
 * one `lawsOf` lists, in `lawsOf`'s order, a mirrors' two containments and an alternatives law's
 * each its statement's.
 *
 * `lawsByStatement` compiles the schema's law model, which takes seconds, and returns a lookup that
 * compiles nothing, so this builds one lookup per schema, on its first call, and pairs every
 * statement through it, memoized by the schema's identity. It is exported: the laws this module
 * names by their statements ({@link statementNamesOf}) and the laws the tests' host judges read
 * (`#pantry/test/host-judge.ts`, `src/test/judged-laws.ts`, `src/test/gen/genetic/host-laws.ts`)
 * share that one lookup per process, which a memo of the tests' own would compile again in every
 * test that loads both (on 2026-11-08 a compile of `Qti`'s law model took 51 s, and a second one
 * 62 s, under load). Loading this module builds none.
 */
export const statementLawsOf = Fn.memoize((schema: typeof Qti) => {
  const lawsOfStatement = lawsByStatement(schema);

  return schema.statements.map((statement) => ({ laws: lawsOfStatement(statement), statement }));
});

/**
 * The laws a schema's statements state that are no check, each with the name its module groups the
 * statement under ({@link nameOfStatement}), filed by {@link bucketOf}: each statement's laws as
 * grizzle's `lawsByStatement` gives them ({@link statementLawsOf}), a mirrors' two containments and
 * an alternatives law's each its statement's. A check is named by its own name, so its law is left
 * out; a statement no module groups names none of its laws, which `law-names.test.ts` refuses.
 *
 * Memoized by the schema's identity, over {@link statementLawsOf}'s one compile.
 *
 * @param schema - The schema, `Qti`.
 * @returns Its statements' laws, with their names, by bucket.
 */
const statementNamesOf = Fn.memoize(
  (schema: typeof Qti): ReadonlyMap<string, Arr.NonEmptyReadonlyArray<readonly [Law, LawName]>> =>
    new Map(
      Object.entries(
        Arr.groupBy(
          statementLawsOf(schema).flatMap(({ laws, statement }) =>
            Option.match(Option.fromUndefinedOr(nameOfStatement.get(statement)), {
              onNone: () => [],
              onSome: (name) =>
                laws.flatMap((law) => (law.kind === "check" ? [] : [[law, name] as const])),
            }),
          ),
          ([law]) => bucketOf(law),
        ),
      ),
    ),
);

/**
 * The tables keyed by an outcome's own fields, each a map: {@link keyNames} by relation,
 * {@link generatedNames} by `Relation.field` and {@link contractNames} by contract.
 */
const byKey = {
  contract: new Map(contractNames),
  generated: new Map(generatedNames),
  primaryKey: new Map(keyNames),
};

/**
 * Name the laws a schema states, each by its own fields: a check by its name ({@link lawOfCheck}),
 * a primary key by its relation, a generated field by its relation and field, a contract by its
 * name ({@link byKey}), a pattern by its field's type ({@link patternNameIn} over
 * {@link textLaws}); and a statement's law by the group its module files the statement under, the
 * law of its bucket ({@link statementNamesOf}) that grizzle's `sameLaw` holds it to be. grizzle's
 * `lawsOf` lists every law an outcome over the schema names (README, "Errors and outcomes"), so a
 * law's own fields find its row, and only a statement's law is matched whole.
 *
 * Only a statement's law reads the statements' laws, whose first read compiles the schema's law
 * model: naming any other law compiles nothing. The namer is memoized by the schema, and each name
 * by the law value (Effect's `Function.memoize`): a law read again, as a refusal's laws are when
 * the same outcome is explained and its facts and rules are read, is named once. A level above the
 * schema states none of the schema's laws (grizzle `999facc6`'s `above`), so it is named by none.
 *
 * @param schema - The schema, `Qti`.
 * @returns The namer: a law's name, or none for a law no row of the tables states.
 */
const namerOf = Fn.memoize((schema: typeof Qti) => {
  const stated = (law: Law): Option.Option<LawName> =>
    pipe(
      Option.fromUndefinedOr(statementNamesOf(schema).get(bucketOf(law))),
      Option.flatMap(Arr.findFirst(([held]) => sameLaw(held, law))),
      Option.map(([, name]) => name),
    );

  return Fn.memoize((law: Law): Option.Option<LawName> =>
    Match.value(law).pipe(
      Match.discriminatorsExhaustive("kind")({
        above: stated,
        check: ({ name }) => lawOfCheck(name),
        contained: stated,
        contract: ({ contract }) => Option.fromUndefinedOr(byKey.contract.get(contract)),
        coverage: stated,
        family: stated,
        fold: stated,
        generated: ({ field, relation }) =>
          Option.fromUndefinedOr(byKey.generated.get(`${relation}.${field}`)),
        key: stated,
        pattern: (pattern) => patternNameIn(schema.relations, textLaws, pattern),
        primaryKey: ({ relation }) => Option.fromUndefinedOr(byKey.primaryKey.get(relation)),
        tree: stated,
      }),
    ),
  );
});

/**
 * Name the law an outcome over `Qti` names ({@link namerOf}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its name, or none for a law no row of the tables states.
 */
export const lawNameOf = (law: Law): Option.Option<LawName> => namerOf(Qti)(law);

/**
 * Every law a schema states, as grizzle's `lawsOf` lists them, each once and in its canonical
 * order: the primary keys, the statements' laws, the contracts, the pattern laws and the generated
 * fields' laws (grizzle `3ba13e38`, `program/laws.ts`).
 *
 * The importer reads none of it: {@link lawNameOf} names a law by its own fields or its
 * statement's. It is the list the census and the tests read the table against. `lawsOf` compiles
 * the schema's law model, which takes seconds, so this is memoized by the schema's identity.
 */
export const schemaLawsOf = Fn.memoize((schema: AnySchema): readonly Law[] => lawsOf(schema));

/**
 * Read every law a schema states that is no check, each with its name, in `lawsOf`'s order: a law
 * no row names is left out, which the census (`refusal.oracle.test.ts`) refuses. Memoized by the
 * schema's identity.
 *
 * @param schema - The schema, `Qti`.
 * @returns Its laws, with their names.
 */
const statedIn = Fn.memoize((schema: typeof Qti): readonly (readonly [Law, LawName])[] =>
  schemaLawsOf(schema).flatMap((law) =>
    law.kind === "check"
      ? []
      : Option.toArray(Option.map(namerOf(schema)(law), (name) => [law, name] as const)),
  ),
);

/**
 * Every law `Qti` states that is no check, as grizzle's `lawsOf` lists it, with its name in
 * {@link lawTable} ({@link lawNameOf}): the tests that read the laws by their names read the very
 * names production names a refusal by. The first call compiles Qti's law model, twice: `lawsOf`'s
 * list and `lawsByStatement`'s lookup.
 *
 * @returns The laws, with their names.
 */
export const statedLaws = (): readonly (readonly [Law, LawName])[] => statedIn(Qti);

/**
 * The rule the law table gives a law: its name's row's ({@link lawNameOf}).
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its rule, or none for a law no row of the table states.
 */
export const ruleOfLaw = (law: Law): Option.Option<Rule> =>
  Option.map(lawNameOf(law), (name) => lawTable[name].rule);

/**
 * The rules a refusal that names `laws` is refused under: the rule of each law the table states,
 * each once, listed in {@link ruleOrder}.
 *
 * The laws are a set, and so are the rules: the laws' order and any repeat change nothing. No law
 * is singled out: grizzle's `some` and `first` say only that one or more of the laws broke, so the
 * refusal is under all of their rules, and a reader of the verdict reads them all. A law no row of
 * the table states carries no rule, and still prints its text in the refusal; the census in
 * `refusal.oracle.test.ts` keeps every law the schema states in the table.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @returns The rules, none when no law of the set is in the table.
 */
export const rulesOf = (laws: readonly Law[]): readonly Rule[] =>
  Arr.sort(Arr.dedupe(laws.flatMap((law) => Option.toArray(ruleOfLaw(law)))), ruleOrder);

/**
 * What a refusal knows of the row that broke its laws: grizzle's witness, or the row's fields as
 * the caller read them.
 *
 * Grizzle names a violating row by its key fields alone, never another column: a key's, and a row
 * check's, a closed relation's check's, a contract's or a pattern's where the host judges a row the
 * ChangeSet states to break it. A foreign key, and a check no stated row breaks as the host judges
 * it, it names by none: its witness is `unreported` (README, "Errors and outcomes"). The fields a
 * content-order law reads (a node's `version`, its parent's kind and its predecessor's state) are
 * in no witness grizzle gives, so a caller that holds the row passes it as `row`.
 */
export type RefusalWitness =
  | Witness
  | {
      readonly kind: "row";
      readonly relation: string;
      readonly values: Readonly<Record<string, string>>;
    };

/**
 * The installed grammar's rows an explanation reads: the content grammar and `Admission`, the
 * generators' rows `src/grammar/install.ts` installs (its `grammar`).
 */
export type RefusalConstants = Pick<ComposedGrammar, "admission" | "content">;

/**
 * A position a content model allows next: its code, the kinds that stand at it, and the particle
 * of the XSD or the reading that states it.
 */
export interface Allowed {
  readonly kinds: readonly string[];
  readonly position: string;
  readonly source: Option.Option<string>;
}

/**
 * The explanation of a refusal: what broke, where each of its laws is stated, and for a
 * content-order law the positions its parent's content model allows next.
 */
export interface Explanation {
  /**
   * Each law, its rule and the law as grizzle reports it; the witness's row; and for a
   * content-order law the state it broke at and what its model allows there.
   */
  readonly detail: string;
  /**
   * The positions `Follow` allows after the state a content-order law broke at, ascending; none
   * when no content-order law is named, or the witness gives no row it reads.
   */
  readonly next: Option.Option<readonly Allowed[]>;
  /**
   * Each law's spec source, then for a content-order law its model's and each allowed position's,
   * each once; none where the law table holds none of the laws.
   */
  readonly sources: readonly string[];
}

/**
 * The content-order laws, by name, with the fields of a node row each reads its model's state by:
 * the parent's kind and the predecessor's state for a child's step (N5), the node's own kind and
 * its last child's state for its family's end (N7).
 */
const contentOrderLaws: Readonly<
  Partial<Record<LawName, { readonly parent: string; readonly state: string }>>
> = {
  "N5 Follow": { parent: "parentKind", state: "was" },
  "N7 Last": { parent: "kind", state: "lastState" },
};

/**
 * The content grammar as an explanation reads it, every lookup a map's: each family's content
 * model by `version parent` (`ContentModelOf`), `Follow`'s successors by `model position`, `Last`'s
 * ends by model, and the kinds at each position of each family by `version parent position`, those
 * its `Admission` gives the position and then those its shared model's `Symbol` does.
 */
interface ContentIndex {
  readonly ends: ReadonlyMap<string, readonly string[]>;
  readonly kinds: ReadonlyMap<string, readonly string[]>;
  readonly models: ReadonlyMap<string, string>;
  readonly next: ReadonlyMap<string, readonly string[]>;
}

/**
 * Each content grammar's index, built on its first explanation, which no later explanation scans
 * the rows for again.
 */
const contentIndexes = new WeakMap<RefusalConstants, ContentIndex>();

/**
 * Key a row of a relation over (version, parent, position).
 *
 * @param version - The schema version.
 * @param parent - The model's kind.
 * @param position - The position.
 * @returns The key.
 */
const positionKey = (version: string, parent: string, position: string): string =>
  `${version} ${parent} ${position}`;

/**
 * Group values under keys, each key's values in first-seen order and each once.
 *
 * @param pairs - The (key, value) pairs.
 * @returns The groups.
 */
const grouped = (pairs: Iterable<readonly [string, string]>): ReadonlyMap<string, string[]> => {
  const groups = new Map<string, string[]>();
  for (const [key, value] of pairs) {
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, [value]);
    } else if (!group.includes(value)) {
      group.push(value);
    }
  }

  return groups;
};

/**
 * Read the content grammar's index, building it once per grammar.
 *
 * @param constants - The installed grammar's rows.
 * @returns The index.
 */
const contentIndexOf = (constants: RefusalConstants): ContentIndex => {
  const known = contentIndexes.get(constants);
  if (known !== undefined) {
    return known;
  }

  const { admission, content } = constants;
  const index: ContentIndex = {
    ends: grouped(content.last.rows.map(({ model, position }) => [model, position] as const)),
    kinds: grouped([
      ...admission.rows.map(
        ({ child, parent, position, version }) =>
          [positionKey(version, parent, position), child] as const,
      ),
      // Each shared family's model's symbols, joined on the model in each side's own order: a
      // scan, run once per grammar, so the index holds no lookup that can miss.
      ...content.sharedModelOf.rows.flatMap(({ model, parent, version }) =>
        content.symbol.rows.flatMap((symbol) =>
          symbol.model === model
            ? [[positionKey(version, parent, symbol.position), symbol.kind] as const]
            : [],
        ),
      ),
    ]),
    models: new Map(
      content.contentModelOf.rows.map(
        ({ model, parent, version }) => [`${version} ${parent}`, model] as const,
      ),
    ),
    next: grouped(
      followPairsOf(content).map(({ from, model, to }) => [`${model} ${from}`, to] as const),
    ),
  };
  contentIndexes.set(constants, index);

  return index;
};

/**
 * Write a source as an explanation names it: an XSD's file and line, or a specification's cite.
 *
 * @param source - The source.
 * @returns Its text.
 */
const sourceText = (source: Source): string =>
  source._tag === "xsd" ? `${source.file}:${String(source.line)}` : source.cite;

/**
 * Order positions by their code.
 */
const byPosition = Order.mapInput(Order.Number, Number);

/**
 * The state a content-order law broke at, read from a row: the version, the model's kind and the
 * state, and the node's own kind where the row holds it.
 */
interface BrokenState {
  readonly kind: Option.Option<string>;
  readonly law: LawName;
  readonly parent: string;
  readonly state: string;
  readonly version: SchemaVersion;
}

/**
 * Read the state a content-order law broke at from a row witness.
 *
 * @param law - The law's name.
 * @param witness - The refusal's witness.
 * @returns The state, or none when the law reads no content model or the witness gives no row
 *   holding its fields.
 */
const brokenStateOf = (law: LawName, witness: RefusalWitness): Option.Option<BrokenState> => {
  const reads = contentOrderLaws[law];
  if (reads === undefined || witness.kind !== "row") {
    return Option.none();
  }

  const { values } = witness;
  const version = schemaVersions.find((known) => known === values["version"]);
  const parent = values[reads.parent];
  const state = values[reads.state];

  return version === undefined || parent === undefined || state === undefined
    ? Option.none()
    : Option.some({
        kind: Option.fromUndefinedOr(values["kind"]),
        law,
        parent,
        state,
        version,
      });
};

/**
 * Read the values a grouping of the index holds under a key: none where the grouping holds no
 * group of it, as a relation's image of a key no row has is empty.
 *
 * @param groups - The grouping.
 * @param key - The key.
 * @returns Its values, in the grouping's order.
 */
const groupAt = (groups: ReadonlyMap<string, readonly string[]>, key: string): readonly string[] =>
  Option.toArray(Option.fromUndefinedOr(groups.get(key))).flat();

/**
 * Name the positions a model allows after a state, with their kinds and sources.
 *
 * @param broken - The state.
 * @param constants - The installed grammar's rows.
 * @returns The positions, ascending by code, and the parent's content model; none where the
 *   grammar holds no content model of the parent in its version.
 */
const allowedAfter = (
  broken: BrokenState,
  constants: RefusalConstants,
): Option.Option<{ readonly allowed: readonly Allowed[]; readonly model: string }> => {
  const index = contentIndexOf(constants);
  const { parent, state, version } = broken;

  return Option.map(Option.fromUndefinedOr(index.models.get(`${version} ${parent}`)), (model) => ({
    allowed: Arr.sort(groupAt(index.next, `${model} ${state}`), byPosition).map((position) => ({
      kinds: groupAt(index.kinds, positionKey(version, parent, position)),
      position,
      source: Option.map(constants.content.sourceOf({ parent, position, version }), sourceText),
    })),
    model,
  }));
};

/**
 * Write the positions a model allows, as an explanation lists them.
 *
 * @param allowed - The positions.
 * @returns Their text: each position with its kinds and source, or that the model allows none.
 */
const allowedText = (allowed: readonly Allowed[]): string =>
  allowed.length === 0
    ? "no further child"
    : allowed
        .map(
          ({ kinds, position, source }) =>
            `${position} (${kinds.length === 0 ? "no kind" : kinds.join(" ")}${Option.match(
              source,
              {
                onNone: () => "",
                onSome: (text) => `, ${text}`,
              },
            )})`,
        )
        .join("; ");

/**
 * Write what a content-order law's broken state means: where the node stands in its parent's model,
 * or where its family ends in its own, and what the model allows next.
 *
 * @param broken - The state.
 * @param after - What the model allows after it, and the model.
 * @param after.allowed - The positions it allows.
 * @param after.model - The parent's content model.
 * @param constants - The installed grammar's rows.
 * @returns The sentence.
 */
const brokenStateText = (
  broken: BrokenState,
  after: { readonly allowed: readonly Allowed[]; readonly model: string },
  constants: RefusalConstants,
): string => {
  const { kind, parent, state, version } = broken;
  const { allowed, model } = after;
  if (broken.law === "N7 Last") {
    const ends = Arr.sort(groupAt(contentIndexOf(constants).ends, model), byPosition);

    return `${parent}'s children end in state ${state} of its content model in ${version}, which ends only in ${ends.length === 0 ? "no state" : ends.join(", ")}; after state ${state} it needs one of ${allowedText(allowed)}`;
  }

  return `${Option.match(kind, { onNone: () => "A child", onSome: (own) => own })} follows state ${state} of ${parent}'s content model in ${version}, which allows next ${allowedText(allowed)}`;
};

/**
 * Write a witness as an explanation names it.
 *
 * @param witness - The refusal's witness.
 * @returns Where the row is, or that the database names none.
 */
const witnessText = (witness: RefusalWitness): string => {
  if (witness.kind === "unreported") {
    return "the database names no row: PostgreSQL reports a constraint it checks itself by the constraint alone";
  }

  const values = Object.entries(witness.values)
    .map(
      ([field, value]) => `${field}=${Predicate.isString(value) ? value : Formatter.format(value)}`,
    )
    .join(" ");

  return `at ${witness.relation} ${values}`;
};

/**
 * Explain a refusal from its laws, its witness and the installed grammar, as a pure function.
 *
 * Each law is named with its rule and shown as grizzle reports it (Effect's `Formatter.format`),
 * and its spec source joins `sources`. For a
 * content-order law (N5's `Follow` step, N7's `Last` end) whose row the witness gives, the
 * explanation names the positions `Follow` allows after the state it broke at, each with its kinds
 * and the XSD particle or reading that states it, and `sources` adds the model's and each
 * position's.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @param witness - Its `witness`, or the row the caller read.
 * @param constants - The installed grammar's rows.
 * @returns The explanation.
 */
export const explain = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
  witness: RefusalWitness,
  constants: RefusalConstants,
): Explanation => {
  const named = laws.map((law) => ({ law, name: lawNameOf(law) }));
  const broken = Arr.head(
    named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.flatMap((law) => brokenStateOf(law, witness)))),
    ),
  );
  const after = broken.pipe(Option.flatMap((state) => allowedAfter(state, constants)));
  const next = after.pipe(Option.map(({ allowed }) => allowed));
  const lawText = named
    .map(({ law, name }) =>
      Option.match(name, {
        onNone: () => `${Formatter.format(law)}, which no rule of the law table owns`,
        onSome: (held) => `${held} (rule ${lawTable[held].rule}): ${Formatter.format(law)}`,
      }),
    )
    .join("; ");
  const stateText = Option.match(Option.all({ after, broken }), {
    onNone: () => "",
    onSome: ({ after: allowed, broken: state }) =>
      `. ${brokenStateText(state, allowed, constants)}`,
  });
  const modelSources = Option.match(broken, {
    onNone: () => [],
    onSome: ({ parent, version }) => [
      ...Option.toArray(
        Option.map(constants.content.sourceOf({ parent, position: "0", version }), sourceText),
      ),
      ...Option.toArray(next)
        .flat()
        .flatMap(({ source }) => Option.toArray(source)),
    ],
  });
  const sources = Arr.dedupe([
    ...named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.map((law) => lawTable[law].source))),
    ),
    ...modelSources,
  ]);

  return { detail: `${lawText}, ${witnessText(witness)}${stateText}`, next, sources };
};

/**
 * Name the rules a refusal is under, as its message says them.
 *
 * @param rules - The refusal's rules, in {@link ruleOrder}.
 * @returns The phrase: the one rule, the rules listed, or that the law table names no rule of the
 *   laws.
 */
const rulesText = (rules: readonly Rule[]): string => {
  const [only, ...more] = rules;
  if (only === undefined) {
    return "under laws no rule of the law table names";
  }

  return more.length === 0 ? `under the ${only} rule` : `under the rules ${rules.join(", ")}`;
};

/**
 * The package was refused, under the rules of the roster its refusal names.
 *
 * `rules` is a set, listed in {@link ruleOrder}: the one rule of a refusal made before the
 * database, or every rule the laws of the database's refusal carry, none where the law table holds
 * none of them. `detail` says what broke it, and `origin` where the refusal came from
 * (`#pantry/package/refusal-origin.ts`): the reader, the container or the codec, or the database,
 * whose case carries how grizzle decided the laws it named, each law shown as grizzle reports it
 * with its installed name, its name and its rule, where each is stated, and how the refusal names
 * the row that broke them. A reader that tells the user where to look reads the witness's kind
 * rather than the detail's wording.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  origin: RefusalOrigin,
  rules: Schema.Array(ImportRule),
}) {
  /**
   * What was refused and under which rules, in one sentence.
   */
  override get message(): string {
    return `The package was refused ${rulesText(this.rules)}: ${this.detail}`;
  }
}

/**
 * A check statement as a schema holds it, read for the law it states: its declared name and its
 * relation's name, which are a check law's fields.
 */
const CheckStatement = Schema.Struct({
  kind: Schema.Literal("check"),
  name: Schema.String,
  relation: Schema.Struct({ name: Schema.String }),
});

/**
 * Key a check by its relation and its declared name, the fields of its law.
 *
 * @param relation - The relation the check is stated on.
 * @param name - The check's declared name.
 * @returns The key.
 */
const checkKey = (relation: string, name: string): string => JSON.stringify([relation, name]);

/**
 * Each check a schema states, by its relation and declared name ({@link checkKey}), read from its
 * statements once per schema.
 *
 * @param schema - The schema the import ran against, `Qti`.
 * @returns The checks' keys.
 */
const statedChecksOf = Fn.memoize(
  (schema: typeof Qti): ReadonlySet<string> =>
    new Set(
      schema.statements.flatMap((statement) =>
        Option.toArray(
          Option.map(Schema.decodeUnknownOption(CheckStatement)(statement), ({ name, relation }) =>
            checkKey(relation.name, name),
          ),
        ),
      ),
    ),
);

/**
 * Grizzle's lookup of the name PostgreSQL holds each check of a schema under,
 * `constraintNamesOf(schema)`, bound once per schema by the schema's identity, as
 * {@link statementLawsOf} binds `lawsByStatement`'s: `constraintNamesOf` compiles the schema's law
 * model, which takes seconds, and its lookup compiles nothing (grizzle `e3975d35`).
 */
const constraintNameLookupOf = Fn.memoize(constraintNamesOf);

/**
 * The installed name of a check a schema states: grizzle's name for the one constraint or trigger
 * that discharges it, a row check's CHECK by its declared name and a check over a derived
 * relation's triggers by a digest (grizzle `b34dfbf9`).
 *
 * Grizzle's lookup throws for a law that is no check of the schema, and a refusal may name one: a
 * CDN install's stored level states checks the default `Qti` does not (`#pantry/qti/cdn.ts`), so a
 * refusal read against another schema than the one the database installed names a check this one
 * lacks. Such a check has no installed name here, so the refusal still prints, with its text and
 * the name and rule the table gives it. Only a check the schema states is asked for, so a refusal
 * that names none compiles nothing.
 *
 * @param schema - The schema the import ran against, `Qti`.
 * @param law - A check law a refusal names.
 * @returns The check's installed name, none for a check the schema does not state.
 */
export const installedNameOf = (schema: typeof Qti, law: LawOf<"check">): Option.Option<string> =>
  statedChecksOf(schema).has(checkKey(law.relation, law.name))
    ? Option.some(constraintNameLookupOf(schema)(law))
    : Option.none();

/**
 * One law of a refusal as the refusal carries it: its display text, the installed name of a check
 * the import's schema states ({@link installedNameOf}), and the name and rule the law table
 * gives it.
 *
 * @param law - A law of an `invariant-rejected` outcome.
 * @returns Its facts.
 */
const lawFactOf = (law: Law): typeof RefusedLaw.Type => {
  const fact: Types.Mutable<typeof RefusedLaw.Type> = { text: Formatter.format(law) };
  const installed = law.kind === "check" ? installedNameOf(Qti, law) : Option.none();
  if (Option.isSome(installed)) {
    fact.installed = installed.value;
  }

  const name = lawNameOf(law);
  if (Option.isSome(name)) {
    fact.name = name.value;
    fact.rule = lawTable[name.value].rule;
  }

  return fact;
};

/**
 * Build the refusal of an `invariant-rejected` outcome from the outcome alone: how grizzle decided
 * its laws, each law's facts ({@link lawFactOf}) in the outcome's order, the set of their rules
 * ({@link rulesOf}), and its explanation ({@link explain}). It reads no row and judges no law, so
 * a `some` or `first` refusal stays as undecided as grizzle left it.
 *
 * A host-side key conflict, two facts of one key that grizzle refuses before any SQL, names its
 * key law and the submitted key as its witness, and is refused the same way, with no SQLSTATE.
 *
 * @param refused - The outcome's `refused`.
 * @param witness - Its `witness`, or the row the caller read.
 * @param constants - The installed grammar's rows.
 * @returns The refusal.
 */
export const refusalOf = (
  refused: Refused,
  witness: RefusalWitness,
  constants: RefusalConstants,
): ImportRefused => {
  const { detail, sources } = explain(refused.laws, witness, constants);

  return new ImportRefused({
    detail,
    origin: {
      _tag: "Database",
      kind: refused.kind,
      laws: pipe(refused.laws, Arr.map(lawFactOf)),
      sources,
      witness: witness.kind,
    },
    rules: rulesOf(refused.laws),
  });
};

/**
 * Every error that refuses a package before the database does: the reader's, the ZIP container's,
 * the package reader's and the codec's, and an `ImportRefused` the importer raised itself.
 */
export type ReadRefusal =
  | ImportRefused
  | NotQti3
  | PackageReadError
  | ReaderRefusal
  | UnmodeledVocabulary
  | WellFormednessError
  | ZipRefusal;

/**
 * Build the refusal of an error the reader, the container or the codec raised.
 *
 * Shred's `UnmodeledVocabulary` is `attribute-admission` for an attribute its element admits
 * under no name or open class (reason `unadmitted`, AL1's rule) and `unmodeled-vocabulary` for
 * every other name it cannot represent; `PackageReadError` is `manifest-root` for a missing
 * manifest and `href-path` for an entry outside the package; a `ZipRefusal` names its own rule.
 *
 * @param e - The error raised.
 * @returns The refusal naming its rule.
 */
export const ruleOfError = (e: ReadRefusal): ImportRefused =>
  Match.value(e).pipe(
    Match.tagsExhaustive({
      ImportRefused: (refused) => refused,
      NotQti3: (refused) =>
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rules: ["not-qti3"] }),
      PackageReadError: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rules: [refused.rule === "manifest-root" ? "manifest-root" : "href-path"],
        }),
      ReaderRefusal: (refused) =>
        new ImportRefused({
          detail: `${refused.rule}: ${refused.detail}`,
          origin: readerOrigin,
          rules: ["reader-refusal"],
        }),
      UnmodeledVocabulary: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rules: [refused.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary"],
        }),
      WellFormednessError: (refused) =>
        new ImportRefused({
          detail: `${refused.message} at line ${String(refused.line)}, column ${String(refused.column)}`,
          origin: readerOrigin,
          rules: ["well-formedness"],
        }),
      ZipRefusal: (refused) =>
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rules: [refused.rule] }),
    }),
  );
