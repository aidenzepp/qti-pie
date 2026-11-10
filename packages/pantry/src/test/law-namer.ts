/**
 * The schema's own naming of its laws, which the committed law-name dictionary
 * (`#pantry/vocab/law-names.json`) is generated from and held to: a check by its name, a primary
 * key by its relation, a generated field by its relation and field, a contract by its name, a
 * pattern by its field's type, and a statement's law by the group its module files the statement
 * under, matched by grizzle's `sameLaw` over the schema's law model (`lawsByStatement`), with the
 * installed name of each check the schema states (`constraintNamesOf`). Each compiles `Qti`'s law
 * model, which takes seconds, so production never runs it: `#pantry/import/refusal.ts` names a
 * refusal from the dictionary alone, a check by its name and every other law by its id.
 */
import { constraintNamesOf, lawsByStatement, lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { AnySchema, Law, RegexText, Statement } from "@bjornpagen/grizzle";
import { Array as Arr, Function as Fn, Match, Option, pipe, Schema } from "effect";
import { attributeLawsByName, EntityName, OpenLocal, Space } from "#pantry/qti/attributes.ts";
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
import { keyText, namespaceText } from "#pantry/qti/limits.ts";
import { interactionLawsByName, interactionRelations } from "#pantry/qti/interactions.ts";
import { Gap, mappingLawsByName, Run } from "#pantry/qti/mapping.ts";
import { DayForm, metadataLawsByName, metadataRelations } from "#pantry/qti/metadata.ts";
import { Chars, EndCharacter, nodeLawsByName, Prefix } from "#pantry/qti/node.ts";
import { declarationLawsByName } from "#pantry/qti/declarations.ts";
import { catalogLawsByName, catalogRelations } from "#pantry/qti/catalog.ts";
import { dataSsmlLawsByName, dataSsmlRelations } from "#pantry/qti/data-ssml.ts";
import { htmlLawsByName, htmlRelations } from "#pantry/qti/html.ts";
import { identityLawsByName } from "#pantry/qti/identity.ts";
import { mathmlLawsByName, mathmlRelations } from "#pantry/qti/mathml.ts";
import { operatorLawsByName, operatorRelations } from "#pantry/qti/operators.ts";
import { HrefParams, packageLawsByName, Sha256Hex } from "#pantry/qti/package.ts";
import { quotationLawsByName, quotationRelations } from "#pantry/qti/quotation.ts";
import { SelectForm, testLawsByName } from "#pantry/qti/tests.ts";
import type { testRelations } from "#pantry/qti/tests.ts";
import { builtLawsByName, Qti } from "#pantry/qti/own.ts";
import { lawNames, lawOfCheck } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { ruleOrder } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import { lawTable } from "#pantry/vocab/laws.ts";

/**
 * The relation each side of a law reads, in the order the law names its sides: the part of a law
 * {@link bucketOf} files it under beside its kind. A contract reads no relation, and a law of a
 * level above the schema reads its own law's relations: `Qti` is one level, which no level extends,
 * so no outcome names one (grizzle `999facc6`'s `above`), and none is in the table.
 *
 * @param law - A law as grizzle names it.
 * @returns Its sides' relations.
 */
export const relationsOf = (law: Law): readonly string[] =>
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
 * File a law by its kind and its sides' relations, so the schema's naming ({@link namerOf}) and the
 * dictionary's generator (`#pantry/test/law-names.ts` `lawIdOf`) hold a law to the few stated laws
 * of that kind over those relations, never every law of Qti.
 *
 * This is no identity of the law: grizzle's `sameLaw` decides whether two laws are one, comparing
 * them whole, and two laws one bucket holds may still differ in their terms or selections. The
 * bucket only needs one law's two descriptions to fall in it together, which they do, since
 * `sameLaw` holds only of laws of one kind whose sides read the same relations.
 *
 * @param law - A law as grizzle names it.
 * @returns Its bucket.
 */
export const bucketOf = (law: Law): string => [law.kind, ...relationsOf(law)].join(" ");

/**
 * The law of a given kind.
 */
export type LawOf<Kind extends Law["kind"]> = Extract<Law, { readonly kind: Kind }>;

/**
 * Name each key by one law: one row per key, so a table lists its laws as their names group them.
 *
 * @param name - The law.
 * @param keys - The keys it names.
 * @returns The rows.
 */
export const namedBy = (
  name: LawName,
  ...keys: readonly string[]
): readonly (readonly [string, LawName])[] => keys.map((key) => [key, name] as const);

/**
 * The law each generated field of Qti's stored relations is named by, by `Relation.field`: grizzle
 * names one when PostgreSQL refuses a row because the field's column is NULL there (23502). grizzle
 * writes no NULL, so only the field's term can have no value: a closed read `C.at` at a key its
 * closed relation holds no row at. No term of Qti's reads `C.at`, so no row breaks one. Each is
 * named by the law that states its value exists, its relation's rows'. The dictionary's generator
 * (`#pantry/test/law-names.ts`) enters each under its GeneratedLawId, and the census
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
 * - A document's and an item's assembly's `xml:lang` form's compared `value` is the form collapsed
 *   and case-folded, cast into the form's own key text, a cast the schema proves total: a written
 *   text, never NULL.
 * - An entry's `digest` is the SHA-256 of its `content`, `Compute.sha256`, defined on every bytes
 *   value: never NULL, so it is named by the law of its relation's rows, "Entry family".
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
    "DocumentLang.value",
    "AssembledLang.value",
    "MapKeyItems.ordered",
    "MapKeyItems.unordered",
  ),
  ...namedBy("Entry family", "Entry.digest"),
];

/**
 * The law each contract Qti's fields are of is named by, by the contract's name: grizzle's builtin
 * `natural`, a bigint never below zero (README, "Tables and types": "A negative value is an outcome
 * on the law `{ kind: "contract", contract: "natural" }`"), the type of every count, position and
 * bit set of the model. Each natural the import writes is a count or a position of its own rows, or
 * a set of a closed relation's bits, and grizzle draws or accumulates the rest, so no row breaks
 * it, and it is named by the law of the values the import derives, "E1 derived". The dictionary's
 * generator (`#pantry/test/law-names.ts`) enters it under its LawId, and the census
 * (`refusal.oracle.test.ts`) holds the table to `lawsOf(Qti)` both ways.
 */
export const contractNames: readonly (readonly [string, LawName])[] = namedBy(
  "E1 derived",
  "natural",
);

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
  ItemRefHref: "Item ref target",
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
    "MapKeyItems",
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
    dataSsmlRelations,
  ),
];

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
  [CommentText, "XML production"],
  [PiTarget, "XML production"],
  [PiData, "XML production"],
  [DoctypeText, "XML production"],
  [EncName, "XML production"],
  [XmlVersion, "XML production"],
  [NcName, "XML production"],
  [EntityName, "XML production"],
  [Space, "E1 derived"],
  [Gap, "E1 derived"],
  [Run, "E1 derived"],
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
  // An entry's `digest` is PostgreSQL's SHA-256 of its stored bytes, which `Compute.sha256` writes
  // in this very language, so no row breaks it; it is named by the law of the record it is a
  // field of, its relation's rows'.
  [Sha256Hex, "Entry family"],
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
  dataSsmlLawsByName,
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
export const namerOf = Fn.memoize((schema: typeof Qti) => {
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
 * Every law a schema states, as grizzle's `lawsOf` lists them, each once and in its canonical
 * order: the primary keys, the statements' laws, the contracts, the pattern laws and the generated
 * fields' laws (grizzle `3ba13e38`, `program/laws.ts`).
 *
 * The importer reads none of it: `#pantry/import/refusal.ts` names a law from the committed
 * dictionary, by its own name or its id. It is the list the census and the tests read the table
 * against. `lawsOf` compiles
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
 * {@link lawTable} ({@link schemaLawNameOf}): the tests that read the laws by their names read the
 * very names production names a refusal by, which the committed dictionary is held to. The first
 * call compiles Qti's law model, twice: `lawsOf`'s list and `lawsByStatement`'s lookup.
 *
 * @returns The laws, with their names.
 */
export const statedLaws = (): readonly (readonly [Law, LawName])[] => statedIn(Qti);

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
 * package-media install's stored level states checks the default `Qti` does not
 * (`#pantry/qti/media.ts`), so a refusal read against another schema than the one the database
 * installed names a check this one lacks. Such a check has no installed name here, so the refusal
 * still prints, with its text and the name and rule the table gives it. Only a check the schema
 * states is asked for, so a refusal that names none compiles nothing.
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
 * Name a law an outcome over `Qti` names by the schema's own naming ({@link namerOf}), the naming
 * the committed dictionary is generated from and held to.
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its name, or none for a law no row of the tables states.
 */
export const schemaLawNameOf = (law: Law): Option.Option<LawName> => namerOf(Qti)(law);

/**
 * Read the rule the law table gives a law, by the schema's own naming ({@link schemaLawNameOf}).
 *
 * @param law - A law as the schema states it.
 * @returns Its rule, or none for a law no row of the table states.
 */
export const schemaRuleOfLaw = (law: Law): Option.Option<Rule> =>
  Option.map(schemaLawNameOf(law), (name) => lawTable[name].rule);

/**
 * Read the rules a set of laws is refused under, by the schema's own naming: each law's rule once,
 * listed in the importer's order (`#pantry/import/rules.ts` `ruleOrder`), as the importer reads a
 * refusal's (`#pantry/import/refusal.ts` `rulesOf`).
 *
 * @param laws - The laws, as the schema states them.
 * @returns The rules, none when no law of the set is in the table.
 */
export const schemaRulesOf = (laws: readonly Law[]): readonly Rule[] =>
  Arr.sort(Arr.dedupe(laws.flatMap((law) => Option.toArray(schemaRuleOfLaw(law)))), ruleOrder);
