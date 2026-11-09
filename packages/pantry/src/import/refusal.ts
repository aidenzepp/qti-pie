/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The names a refused import carries, and how a refusal names one (plan W5, Q5.17; the W5
 * amendment's C22).
 *
 * A package is refused before any row exists, by the reader, the ZIP container or the codec
 * ({@link ruleOfError}), or by grizzle's `invariant-rejected` outcome, which names every law
 * merged into the PostgreSQL object that refused the write ({@link refusalOfLaws}). Each law keeps
 * the rule of the guard or schema rule it replaces, so a verdict reads as it did.
 *
 * - **Laws by name.** Every law the schema states has a name, the law oracle's (`src/test/oracle.ts`
 *   `LawName`) where the oracle states the law, with its rule and its spec source
 *   ({@link lawTable}). A check is named by its law ({@link checkNameOf}); every other law is a row
 *   of {@link statedLaws}, as grizzle's `lawsOf` names it, matched to an outcome's law by grizzle's
 *   `sameLaw` ({@link lawNameOf}).
 * - **One rule per refusal.** A family's axis foreign key discharges the family and every containment
 *   and fold merged into it, and its violation names them all, so a refusal picks the rule of its
 *   most specific law by one fixed order ({@link precedence}).
 * - **Explanations are computed.** {@link explain} reads the laws, the witness and the installed
 *   grammar's rows; for a content-order law it names the positions `Follow` allows next, each with
 *   its XSD particle. There is no catalog of messages.
 */
import { lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { AnySchema, Law, Statement, Witness } from "@bjornpagen/grizzle";
import {
  Array as Arr,
  Function as Fn,
  Formatter,
  Match,
  Option,
  Order,
  pipe,
  Predicate,
  Result,
  Schema,
} from "effect";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { NotQti3, UnmodeledVocabulary } from "#pantry/model/shred.ts";
import {
  attributeLawsByName,
  EntityName,
  Idref,
  Lexical,
  OpenLocal,
  Space,
} from "#pantry/qti/attributes.ts";
import {
  Affix,
  AssembledReference,
  DeclarationTable,
  Expression,
  ExpressionAttribute,
  expressionLawsByName,
  HeldType,
  referenceLawsByName,
  Literal,
  LiteralTyped,
  MappingItemRef,
  MappingItemRefType,
  MappingLookup,
  MappingSourceDeclaration,
  NameLookup,
  Operand,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  PlacedVariableRefDeclaration,
  Processing,
  ProcessingTemplate,
  Reading,
  ReadingCardinality,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  Separator,
  TemplateDefault,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TestReference,
  VariableLookup,
  VariableRef,
  VariableRefCardinality,
  VariableRefDeclaration,
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
import { anyText, keyText, namespaceText } from "#pantry/qti/limits.ts";
import {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingBaseType,
  BindingCardinality,
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ChoiceVariableName,
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefCardinality,
  FeedbackRefDeclaration,
  GapInteraction,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  interactionLawsByName,
  ItemMode,
  LeastCount,
  MostCount,
  PciModuleForm,
  PlacedBinding,
  PlacedBindingBaseType,
  PlacedBindingCardinality,
  PlacedBindingDeclaration,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  PrintedVariableRefDeclaration,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionContextRefDeclaration,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionFeedbackRefCardinality,
  SectionFeedbackRefDeclaration,
  SectionPrintedName,
  SectionPrintedRef,
  SectionPrintedRefDeclaration,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  SectionTemplateRefCardinality,
  SectionTemplateRefDeclaration,
  Slider,
  TemplateRef,
  TemplateRefCardinality,
  TemplateRefDeclaration,
} from "#pantry/qti/interactions.ts";
import {
  Digits,
  FloatKey,
  Gap,
  Item,
  LookupValue,
  LookupValueType,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  mappingLawsByName,
  Negative,
  Sign,
  Zeros,
} from "#pantry/qti/mapping.ts";
import {
  AssessmentObject,
  DayForm,
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
  metadataLawsByName,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  ResourceLomGeneral,
  StatisticDate,
  UsageBaseType,
  UsageValue,
  UsageValueBaseType,
} from "#pantry/qti/metadata.ts";
import { Chars, EndCharacter, nodeLawsByName, Prefix } from "#pantry/qti/node.ts";
import { declarationLawsByName } from "#pantry/qti/declarations.ts";
import { catalogLawsByName } from "#pantry/qti/catalog.ts";
import { HeaderToken, htmlLawsByName } from "#pantry/qti/html.ts";
import { identityLawsByName, TextIdref } from "#pantry/qti/identity.ts";
import { operatorLawsByName, ToleranceToken } from "#pantry/qti/operators.ts";
import {
  HrefParams,
  packageLawsByName,
  Reference,
  ReferencePath,
  TextReference,
  TextReferencePath,
} from "#pantry/qti/package.ts";
import { mathmlLawsByName } from "#pantry/qti/mathml.ts";
import { quotationLawsByName } from "#pantry/qti/quotation.ts";
import { SectionSelection, SelectForm, testLawsByName, testRelations } from "#pantry/qti/tests.ts";
import { Qti } from "#pantry/qti/schema.ts";
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
 * container's.
 *
 * The verdict file names its refusals by these (`verdicts/*.tsv`, `src/test/verdicts.ts`).
 */
export const ImportRule = Schema.Literals([...precedence, ...codecRules]);

/**
 * One name of the roster.
 */
export type Rule = typeof ImportRule.Type;

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
 * {@link bucketOf} files it under beside its kind. A contract reads no relation.
 *
 * @param law - A law as grizzle names it.
 * @returns Its sides' relations.
 */
const relationsOf = (law: Law): readonly string[] =>
  Match.value(law).pipe(
    Match.discriminatorsExhaustive("kind")({
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
 * A law no statement states, which {@link writtenLaws} writes out: a relation's primary key, a text
 * pattern, or a generated field. Every other law is a statement's, as grizzle's `lawsOf` names it,
 * so no row of the table can name a containment, key, family, tree or fold no statement states.
 */
type WrittenLaw = LawOf<"generated" | "pattern" | "primaryKey">;

/**
 * Build a relation's primary key law.
 *
 * @param relation - The relation.
 * @param fields - Its key's fields.
 * @returns The law.
 */
const primaryKeyOf = (relation: string, ...fields: readonly string[]): LawOf<"primaryKey"> => ({
  fields,
  kind: "primaryKey",
  relation,
});

/**
 * Build a generated field's law, which grizzle names when PostgreSQL refuses a row because the
 * field's column is NULL there (23502). grizzle writes no NULL, so only the field's term can have
 * no value: a closed read `C.at` at a key its closed relation holds no row at.
 *
 * @param relation - The relation.
 * @param field - Its generated field.
 * @returns The law.
 */
const generatedOf = <R extends { readonly fields: object; readonly name: string }>(
  relation: R,
  field: keyof R["fields"] & string,
): LawOf<"generated"> => ({ field, kind: "generated", relation: relation.name });

/**
 * A text field type, as `str.regex` and `str.bytes` build it: its pattern's source and flags.
 */
export interface TextType {
  readonly pattern: { readonly flags: "su" | "u"; readonly source: string };
}

/**
 * Whether a value is a text field type ({@link TextType}), read by its shape. The guard reads the
 * value itself, never a decoded copy, so {@link textLaws} finds it by its identity.
 */
const isTextType: (value: unknown) => value is TextType = Schema.is(
  Schema.Struct({
    pattern: Schema.Struct({ flags: Schema.Literals(["su", "u"]), source: Schema.String }),
  }),
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
 * An ordinary relation as {@link patternLawsOf} reads it, its fields' descriptors as they are. A
 * closed relation is of another kind, and its payloads state no law.
 */
const Ordinary = Schema.Struct({
  fields: Schema.Record(Schema.String, Schema.Unknown),
  kind: Schema.Literal("relation"),
  name: Schema.String,
});

/**
 * A text field whose type no row of the table names: its relation and its field.
 */
export interface UnnamedText {
  readonly field: string;
  readonly relation: string;
}

/**
 * Build the pattern law of each text field of a schema's ordinary relations, as its domain's CHECK
 * reports it, with the name of its type's row.
 *
 * Grizzle states one law per stored field a text domain types, spelled as the field declares its
 * pattern (`physical/install/compile.ts` `textDomainConstraintLaws` of the vendored engine): every
 * field of an ordinary relation, a generated or accumulated one included, whose type is a text of a
 * pattern some text breaks. Two fields of one pattern share one domain and are two laws, so a
 * refusal names the field whose value broke it, and each field's law takes its own type's name. A
 * type of `plain` is a tautology, which grizzle installs as plain text, so its fields state none.
 *
 * @param relations - The schema's `relations`.
 * @param names - Each text type, by its identity, with the law its pattern states.
 * @param plain - The text types whose pattern is a tautology.
 * @returns The laws, one per text field; or the first field whose type neither holds.
 */
export const patternLawsOf = (
  relations: AnySchema["relations"],
  names: ReadonlyMap<TextType, LawName>,
  plain: ReadonlySet<TextType>,
): Result.Result<readonly (readonly [LawOf<"pattern">, LawName])[], UnnamedText> => {
  const named: (readonly [LawOf<"pattern">, LawName])[] = [];
  const ordinary = Object.values(relations).flatMap((member) =>
    Option.toArray(Schema.decodeUnknownOption(Ordinary)(member)),
  );
  for (const { fields, name: relation } of ordinary) {
    for (const [field, descriptor] of Object.entries(fields)) {
      // The type grizzle's installation types the field's column by: a generated or accumulated
      // field's declared type, any other field's descriptor itself.
      const type = Option.match(Schema.decodeUnknownOption(Written)(descriptor), {
        onNone: () => descriptor,
        onSome: (written) => (written.writing === "generated" ? written.type : written.field),
      });
      if (isTextType(type) && !plain.has(type)) {
        const name = names.get(type);
        if (name === undefined) {
          return Result.fail({ field, relation });
        }

        const { flags, source } = type.pattern;
        named.push([{ field, flags, kind: "pattern", relation, source }, name]);
      }
    }
  }

  return Result.succeed(named);
};

/**
 * The law each text type of Qti's fields states, by the type's identity: the one object its module
 * exports and its relations type their fields by, so a bound that moves moves its row. Every text
 * field's pattern law is named by its type's row ({@link patternLawsOf}), in the classes of the
 * orchestrator's ruling of 2026-11-06:
 *
 * - A bound on a text is "Key text bound", a stated limit. `keyText` and `namespaceText` hold any
 *   text; the bounded names and paths also carry a production no package the reader accepts breaks,
 *   so their refusal means the bound alone. A prefix and a local name are NCNames because crust
 *   reads with saxes's `xmlns` on, which refuses a name that is no QName (Namespaces in XML 1.0,
 *   §4); a foreign namespace name is `Char`s because crust reads no other; an entry path begins
 *   with no `/` because the directory reader lists paths relative to the package root and `zip.ts`
 *   refuses an absolute name; a typed float map key is an `xs:double` lexical form because the
 *   import writes its row only for one (`doublePattern`);
 * - An unbounded XML production (a node's or an attribute's `Char*`, a comment, an instruction, a
 *   doctype, an encoding name, a version number, an NCName) is "XML production", which crust
 *   refuses before any row exists;
 * - A namespace declaration's value is "Namespace name": an RFC 3986 URI reference (reading 131),
 *   which crust does not check, so the domain is the law;
 * - The whitespace around an IDREF token is the host's own split, "E1 derived", as is every other
 *   piece the host splits a lexical form into: a map key's, a reference's, a node's end characters,
 *   a selection's form.
 */
export const textLaws: ReadonlyMap<TextType, LawName> = new Map<TextType, LawName>([
  [keyText, "Key text bound"],
  [namespaceText, "Key text bound"],
  [Prefix, "Key text bound"],
  [OpenLocal, "Key text bound"],
  [NamespacePrefix, "Key text bound"],
  [ForeignNamespace, "Key text bound"],
  [EntryPath, "Key text bound"],
  [FloatKey, "Key text bound"],
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
  [Item, "E1 derived"],
  [Affix, "E1 derived"],
  [Separator, "E1 derived"],
  [HrefParams, "E1 derived"],
  [EndCharacter, "E1 derived"],
  [SelectForm, "E1 derived"],
  // `day` restates `lastUpdated`, a `DateDType`, whose language the attribute's value domain
  // states: xs:date's lexical space, the month lengths and the leap rule included, under its
  // pattern. Its type, `DayForm`, `lexical(date)`, is that language, and its pattern law is the
  // value domain's, with its rule, so one cause names one rule (the orchestrator's ruling of
  // 2026-11-06).
  [DayForm, "value domain"],
]);

/**
 * The text types whose pattern is a tautology, which grizzle installs as plain text, with no domain
 * and so no law (`physical/ddl/domains.ts` `structuralRegex` and `text/refinement.ts` of the
 * vendored engine): `anyText`, a package's name. Grizzle reports no reading of whether a type's
 * pattern is a tautology, so its type is listed here, beside the named ones.
 */
export const plainTexts: ReadonlySet<TextType> = new Set([anyText]);

/**
 * Every pattern law Qti states, one per text field, each named by its type's row of
 * {@link textLaws}. The table is a constant no caller can repair, so a text field whose type has
 * no row fails the module's load, naming the field.
 */
const patternLaws = Result.getOrThrowWith(
  patternLawsOf(Qti.relations, textLaws, plainTexts),
  ({ field, relation }) =>
    new Error(
      `${relation}.${field} is typed by a text type no row of textLaws in src/import/refusal.ts names. Export the type from its module, type the field by that one object, and give it a row of textLaws, or of plainTexts if its pattern is a tautology.`,
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
 * The laws written out row by row, each as its outcome names it, with its name in {@link lawTable}:
 * each text field's pattern law ({@link patternLaws}); each relation's primary key; and the
 * generated fields' laws ({@link WrittenLaw}), in the module order of the plan's §C. A statement's
 * laws are named where it is stated ({@link namedLaws}).
 *
 * - **The text fields' patterns**, one law per field, named by its type's row of {@link textLaws}.
 * - **Each relation's primary key**, under the law its module's rows belong to.
 * - **The generated fields**: each one's law, its term's NULL, beside its relation's rows, under the
 *   law that states its value exists. No term of Qti's reads `C.at`, the one read that can miss, so
 *   no row breaks one. Each row says which law refuses first, or why none needs to, and is stated
 *   so an outcome naming it still has a rule.
 */
const writtenLaws: readonly (readonly [WrittenLaw, LawName])[] = [
  ...patternLaws,
  [primaryKeyOf("Node", "id"), "Node key"],
  ...(
    [
      ["Comment", "comment arm"],
      ["Pi", "pi arm"],
      ["Doctype", "doctype arm"],
      ["Document", "Document"],
      ["XmlDecl", "Document"],
      ["EncodingDecl", "Document"],
      ["SdDecl", "Document"],
    ] as const
  ).map(([relation, name]) => [primaryKeyOf(relation, "node"), name] as const),
  [primaryKeyOf("Namespace", "node", "at"), "Namespace family"],
  [primaryKeyOf("OpenElementName", "node"), "OpenElementName"],
  [primaryKeyOf("Attribute", "node", "id"), "AL2 count"],
  [primaryKeyOf("OpenAttributeName", "node", "attribute", "at"), "AL4 open names"],
  [primaryKeyOf("Idref", "node", "attribute", "at"), "E1 derived"],
  [primaryKeyOf("AttributeEntity", "node", "attribute", "at"), "AttributeEntity owner"],
  [primaryKeyOf("DoubleValue", "node", "attribute", "at"), "Double value"],
  [primaryKeyOf("TextDoubleValue", "node", "at"), "Double value"],
  [primaryKeyOf("Package", "id"), "Package key"],
  [primaryKeyOf("Entry", "package", "at"), "Entry family"],
  ...(
    ["ManifestId", "Resource", "ResourceId", "File", "Dependency", "DependencyTarget"] as const
  ).map((overlay) => [primaryKeyOf(overlay, "node"), "Manifest overlay"] as const),
  [primaryKeyOf("ManifestIdSpace", "package", "identifier", "kind"), "Manifest overlay"],
  [primaryKeyOf("ResourceHref", "node"), "Manifest overlay"],
  [primaryKeyOf("ResourceTyped", "node"), "E1 derived"],
  [primaryKeyOf("TypedHref", "node"), "E1 derived"],
  [primaryKeyOf("UnreadTypeHref", "node"), "E1 derived"],
  [primaryKeyOf("UnreadTypePath", "package", "path"), "E1 derived"],
  [primaryKeyOf("NamedHref", "package", "path", "type"), "RootOfType"],
  [primaryKeyOf("FileHref", "package", "scope", "path"), "File listed"],
  [primaryKeyOf("ResourceFile", "resource", "scope", "path"), "Href listed"],
  [primaryKeyOf("IdBinding", "document", "id", "owner"), "E1 derived"],
  [primaryKeyOf("IdrefTarget", "document", "id"), "E1 derived"],
  [primaryKeyOf("PlacedId", "instance", "node"), "E1 derived"],
  [primaryKeyOf("AssembledId", "assembly", "id", "owner", "copy"), "E1 derived"],
  [primaryKeyOf("PlacedIdref", "instance", "id"), "E1 derived"],
  [primaryKeyOf("IdentityText", "node"), "E1 derived"],
  [primaryKeyOf("TextIdref", "node", "at"), "E1 derived"],
  [primaryKeyOf("DocumentId", "node"), "DocumentId key"],
  [primaryKeyOf("XmlLang", "node"), "E1 derived"],
  [primaryKeyOf("DocumentLang", "document", "lang"), "E1 derived"],
  [primaryKeyOf("ShareFragment", "node"), "E1 derived"],
  [primaryKeyOf("GeneralNamed", "general"), "E1 derived"],
  [primaryKeyOf("GeneralObject", "general"), "E1 derived"],
  [primaryKeyOf("DocumentGenerals", "document"), "E1 derived"],
  [primaryKeyOf("GeneralLang", "general", "lang"), "E1 derived"],
  [primaryKeyOf("PlacedBodyXmlLang", "instance", "node"), "E1 derived"],
  [primaryKeyOf("PlacedXmlLang", "instance", "node"), "E1 derived"],
  [primaryKeyOf("AssembledLang", "assembly", "lang"), "E1 derived"],
  [primaryKeyOf("PlacedGeneralLang", "general", "lang"), "E1 derived"],
  [primaryKeyOf("SsmlAttribute", "node", "name"), "E1 derived"],
  [primaryKeyOf("BodyXmlLang", "node"), "E1 derived"],
  [primaryKeyOf("CatalogScope", "node"), "E1 derived"],
  [primaryKeyOf("SsmlScope", "node"), "E1 derived"],
  [primaryKeyOf("FragmentValue", "fragment", "kind", "value"), "E1 derived"],
  [primaryKeyOf("LomLanguage", "node"), "E1 derived"],
  [primaryKeyOf("ResourceLomLanguageSet", "general", "lang"), "E1 derived"],
  [primaryKeyOf("Quotation", "node"), "E1 derived"],
  [primaryKeyOf("LabelUse", "node"), "Label tools"],
  [primaryKeyOf("CardSupport", "node"), "E1 derived"],
  [primaryKeyOf("DefaultEntry", "node"), "E1 derived"],
  [primaryKeyOf("CatalogRef", "node"), "E1 derived"],
  [primaryKeyOf("CatalogId", "node"), "E1 derived"],
  [primaryKeyOf("CatalogTarget", "document", "id"), "E1 derived"],
  [primaryKeyOf("PlacedCatalogRef", "instance", "id"), "E1 derived"],
  [primaryKeyOf("AssembledCatalog", "assembly", "id"), "E1 derived"],
  [primaryKeyOf("TableScope", "node"), "E1 derived"],
  [primaryKeyOf("CellHeaders", "node"), "E1 derived"],
  [primaryKeyOf("HeaderToken", "node", "at"), "E1 derived"],
  [primaryKeyOf("TableHeader", "node"), "E1 derived"],
  [primaryKeyOf("Rounding", "node"), "E1 derived"],
  [primaryKeyOf("RoundingFigures", "node"), "E1 derived"],
  [primaryKeyOf("RoundingMode", "node"), "E1 derived"],
  [primaryKeyOf("RoundingModeFigures", "node"), "E1 derived"],
  [primaryKeyOf("Tolerance", "node"), "E1 derived"],
  [primaryKeyOf("ToleranceToken", "node", "at"), "E1 derived"],
  // An IDREF token's piece, a header's and a tolerance value's, is its own whitespace and token
  // concatenated, its concat fold's step: written texts, none NULL, so the term is never NULL and
  // no row breaks these. A piece past its keyText bound is refused by the piece's own pattern law,
  // named by keyText's row, "Key text bound".
  [generatedOf(Idref, "piece"), "E1 derived"],
  [generatedOf(TextIdref, "piece"), "E1 derived"],
  [generatedOf(HeaderToken, "piece"), "E1 derived"],
  [generatedOf(ToleranceToken, "piece"), "E1 derived"],
  ...(
    [
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
    ] as const
  ).map((overlay) => [primaryKeyOf(overlay, "node"), "Declaration overlay"] as const),
  // An operand's type bits read `ValueBaseBit.row` and `ValueCardinalityBit.row`, closed reads of
  // a set keyed by the row's own NOT NULL `baseType` and `cardinality`: ∅ where the diagonal holds
  // no row (`any`, `unknown`), never NULL, which only a NULL key, an absent `C.at`, reads
  // (docs/grizzle-findings.md, lane DBT's). So no row breaks either law. A field a closed relation
  // determines is E1 derived.
  [generatedOf(Operand, "baseTypeBit"), "E1 derived"],
  [generatedOf(Operand, "cardinalityBit"), "E1 derived"],
  ...(
    [
      "Mapping",
      "MappingBaseType",
      "MappingCardinality",
      "MapKey",
      "MapKeyType",
      "MapKeyInteger",
      "MapKeyFloat",
      "AreaMapping",
      "AreaMappingCardinality",
      "LookupTable",
      "LookupTableCardinality",
    ] as const
  ).map((overlay) => [primaryKeyOf(overlay, "node"), "Mapping overlay"] as const),
  ...Object.values(testRelations).map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        testKeyNames[name],
      ] as const,
  ),
  // `select` casts `selectForm`, which its pattern law, named by SelectForm's row of textLaws,
  // holds to the language the cast reads total: a form outside it is refused by that law as the
  // statement casts it into its column, before PostgreSQL computes `select`, so no row breaks this
  // one.
  [generatedOf(SectionSelection, "select"), "E1 derived"],
  ...[
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
    UsageBaseType,
    UsageValue,
    UsageValueBaseType,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  // `date` casts `day`, which its pattern law, named by DayForm's row of textLaws, holds to the
  // days 0001-01-01 to 9999-12-31 the cast reads total: a day outside it is refused by that law as
  // the statement casts it into its column, before PostgreSQL computes `date`, so no row breaks
  // this one. Its value is the calendar day `lastUpdated` names, which the value domain states
  // exists.
  [generatedOf(StatisticDate, "date"), "value domain"],
  ...[
    AriaElement,
    AriaRange,
    AriaValue,
    Binding,
    BindingBaseType,
    BindingCardinality,
    BindingDeclaration,
    BindingName,
    BoundVariable,
    Choice,
    ChoiceInteraction,
    ChoiceVariableName,
    ContextRef,
    ContextRefDeclaration,
    CountBound,
    CountRange,
    FeedbackRef,
    FeedbackRefCardinality,
    FeedbackRefDeclaration,
    GapInteraction,
    Hotspot,
    Hottext,
    Interaction,
    InteractionAttribute,
    ItemMode,
    LeastCount,
    MostCount,
    PciModuleForm,
    PlacedBinding,
    PlacedBindingBaseType,
    PlacedBindingCardinality,
    PlacedBindingDeclaration,
    PlacedChoice,
    PlacedHottext,
    PrintedVariableRef,
    PrintedVariableRefDeclaration,
    ReferringDocument,
    SectionContextName,
    SectionContextRef,
    SectionContextRefDeclaration,
    SectionFeedbackName,
    SectionFeedbackRef,
    SectionFeedbackRefCardinality,
    SectionFeedbackRefDeclaration,
    SectionPrintedName,
    SectionPrintedRef,
    SectionPrintedRefDeclaration,
    SectionScope,
    SectionTemplateName,
    SectionTemplateRef,
    SectionTemplateRefCardinality,
    SectionTemplateRefDeclaration,
    Slider,
    TemplateRef,
    TemplateRefCardinality,
    TemplateRefDeclaration,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  ...[MapKeyPoint, MapKeyPair, MapKeyDirectedPair, LookupValue, LookupValueType].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Mapping overlay",
      ] as const,
  ),
  // A typed map key's generated fields read its own split, by concatenation and conditionals, or a
  // float key's `Compute.parseDouble`, which its key's pattern law, named by FloatKey's row of
  // textLaws, holds to `xs:double`'s lexical space, inside the `doubleText` the parse reads total.
  // No term reads a closed relation, so none is NULL and no row breaks these.
  [generatedOf(MapKeyInteger, "negative"), "E1 derived"],
  [generatedOf(MapKeyInteger, "value"), "E1 derived"],
  [generatedOf(MapKeyFloat, "value"), "E1 derived"],
  [generatedOf(MapKeyPoint, "value"), "E1 derived"],
  [generatedOf(MapKeyPoint, "xNegative"), "E1 derived"],
  [generatedOf(MapKeyPoint, "yNegative"), "E1 derived"],
  [generatedOf(MapKeyPair, "value"), "E1 derived"],
  [generatedOf(MapKeyDirectedPair, "value"), "E1 derived"],
  ...[
    AssembledReference,
    DeclarationTable,
    Expression,
    ExpressionAttribute,
    HeldType,
    Literal,
    LiteralTyped,
    MappingItemRef,
    MappingItemRefType,
    MappingLookup,
    MappingSourceDeclaration,
    NameLookup,
    Operand,
    PlacedDocument,
    PlacedReference,
    PlacedVariableRef,
    PlacedVariableRefDeclaration,
    Processing,
    ProcessingTemplate,
    Reading,
    ReadingCardinality,
    ReferenceDocument,
    ReferenceSegment,
    SectionIdentifier,
    TemplateDefault,
    TemplateDefaultCardinality,
    TemplateDefaultTarget,
    TestReference,
    VariableLookup,
    VariableRef,
    VariableRefCardinality,
    VariableRefDeclaration,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  // A segment's token is its separator and its piece concatenated, its concat fold's step: written
  // texts, none NULL, so no row breaks this. A token past its keyText bound is refused by the
  // token's own pattern law, named by keyText's row, "Key text bound".
  [generatedOf(ReferenceSegment, "token"), "E1 derived"],
  ...[Reference, ReferencePath, TextReference, TextReferencePath].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Reference overlay",
      ] as const,
  ),
  [primaryKeyOf("MathApply", "node"), "E1 derived"],
  [primaryKeyOf("MathArgument", "node"), "E1 derived"],
  [primaryKeyOf("MathQualifier", "node"), "E1 derived"],
  [primaryKeyOf("CnAttribute", "node", "name"), "E1 derived"],
  [primaryKeyOf("CnPartText", "node", "part"), "E1 derived"],
  [primaryKeyOf("CnCount", "node"), "E1 derived"],
  [primaryKeyOf("CnSlot", "node", "part"), "E1 derived"],
  [primaryKeyOf("MathCn", "node"), "E1 derived"],
  [primaryKeyOf("CellLeaf", "cell", "at"), "E1 derived"],
  [primaryKeyOf("MathAction", "node"), "E1 derived"],
  [primaryKeyOf("MathAlignGroup", "node"), "E1 derived"],
  [primaryKeyOf("MathAlignScope", "node"), "E1 derived"],
  [primaryKeyOf("MathCell", "node"), "E1 derived"],
  [primaryKeyOf("MathDir", "node"), "E1 derived"],
  [primaryKeyOf("MathRank", "node"), "E1 derived"],
  [primaryKeyOf("PlacedMathRank", "instance", "node"), "E1 derived"],
  [primaryKeyOf("PlacedShareTarget", "instance", "node"), "E1 derived"],
  [primaryKeyOf("ShareTarget", "node"), "E1 derived"],
];

/**
 * A module's statements by the law each states, the law's name its key: `nodeLawsByName` of
 * `#pantry/qti/node.ts` and its peers, so a law is named where it is stated and this module reads
 * the name rather than restating the law.
 */
type LawsByName = { readonly [Name in LawName]?: readonly Statement[] };

/**
 * The modules that name their laws where they state them, each a {@link LawsByName}.
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
 * a module declares and `Qti` lists, which grizzle's `lawsOf` returns beside its laws.
 */
const nameOfStatement: ReadonlyMap<Statement, LawName> = new Map(
  namedLaws.flatMap((byName) =>
    groupsOf(byName).flatMap(([name, statements]) =>
      statements.map((statement) => [statement, name] as const),
    ),
  ),
);

/**
 * The laws a schema states that are no check, each with its name, and the same laws filed by
 * {@link bucketOf}.
 */
interface Stated {
  readonly buckets: ReadonlyMap<string, Arr.NonEmptyReadonlyArray<readonly [Law, LawName]>>;
  readonly laws: readonly (readonly [Law, LawName])[];
}

/**
 * Read the laws a schema states that are no check, each as an `invariant-rejected` outcome names
 * it, with its name in {@link lawTable}: each statement's laws as grizzle's `lawsOf` gives them, a
 * mirrors' two containments and an alternatives law's each its statement's, under the name its
 * module groups the statement by ({@link nameOfStatement}); then {@link writtenLaws}' rows, the
 * primary keys, patterns and generated fields no statement states. A check is named by its own
 * name ({@link lawOfCheck}), so its law is left out. A statement no module groups names none of its
 * laws, which the census in `refusal.oracle.test.ts` refuses.
 *
 * `lawsOf` compiles the schema's law model, which takes seconds, so this is memoized by the
 * schema's identity: the first refusal compiles it once per process, loading this module never
 * does, and every later call returns the same laws.
 *
 * @param schema - The schema, `Qti`.
 * @returns Its laws, with their names.
 */
const statedIn = Fn.memoize((schema: typeof Qti): Stated => {
  const laws = [
    ...lawsOf(schema).flatMap(({ laws: own, statement }) =>
      Option.match(Option.fromUndefinedOr(nameOfStatement.get(statement)), {
        onNone: () => [],
        onSome: (name) =>
          own.flatMap((law) => (law.kind === "check" ? [] : [[law, name] as const])),
      }),
    ),
    ...writtenLaws,
  ];

  return { buckets: new Map(Object.entries(Arr.groupBy(laws, ([law]) => bucketOf(law)))), laws };
});

/**
 * Every law `Qti` states that is no check, each as its outcome names it, with its name in
 * {@link lawTable} ({@link statedIn}). The first call compiles Qti's law model.
 *
 * @returns The laws, with their names.
 */
export const statedLaws = (): readonly (readonly [Law, LawName])[] => statedIn(Qti).laws;

/**
 * Name the law an outcome's law is: a check by its name ({@link lawOfCheck}), any other law by the
 * law of {@link statedLaws} that grizzle's `sameLaw` holds it to be, among those of its bucket
 * ({@link bucketOf}).
 *
 * `sameLaw` encodes both laws on every call, so the name is memoized by the law value (Effect's
 * `Function.memoize`): a law read again, as a refusal's laws are when the same outcome is explained
 * and ruled, is named once.
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its name, or none for a law no row of the table states.
 */
export const lawNameOf: (law: Law) => Option.Option<LawName> = Fn.memoize(
  (law: Law): Option.Option<LawName> =>
    law.kind === "check"
      ? lawOfCheck(law.name)
      : pipe(
          Option.fromUndefinedOr(statedIn(Qti).buckets.get(bucketOf(law))),
          Option.flatMap(Arr.findFirst(([stated]) => sameLaw(stated, law))),
          Option.map(([, name]) => name),
        ),
);

/**
 * Name the one rule a refusal that names `laws` is refused under: the most specific rule among
 * theirs, by {@link precedence}.
 *
 * The laws are a set: their order and any repeat change nothing. A law no row of the table states
 * is left out, so the rule is the most specific of the others; the census in
 * `refusal.oracle.test.ts` keeps every law the schema states in the table.
 *
 * @param laws - The `laws` of an `invariant-rejected` outcome.
 * @returns The rule, or none when no law of the set is in the table.
 */
export const ruleOfLaws = (laws: Arr.NonEmptyReadonlyArray<Law>): Option.Option<Rule> =>
  Arr.head(
    Arr.sort(
      laws.flatMap((law) =>
        Option.toArray(Option.map(lawNameOf(law), (name) => lawTable[name].rule)),
      ),
      Order.mapInput(Order.Number, (rule: (typeof precedence)[number]) => precedence.indexOf(rule)),
    ),
  );

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
   * Each law's spec source, then for a content-order law its model's and each allowed position's.
   */
  readonly sources: Arr.NonEmptyReadonlyArray<string>;
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
      content.follow.rows.map(({ from, model, to }) => [`${model} ${from}`, to] as const),
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
  const [first, ...rest] = Arr.dedupe([
    ...named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.map((law) => lawTable[law].source))),
    ),
    ...modelSources,
  ]);

  return {
    detail: `${lawText}, ${witnessText(witness)}${stateText}`,
    next,
    sources:
      first === undefined
        ? ["no law of the refusal is in the law table, so none names its source"]
        : [first, ...rest],
  };
};

/**
 * The package was refused under one rule of the roster.
 *
 * `detail` says what broke it, and `origin` where the refusal came from
 * (`#pantry/package/refusal-origin.ts`): the reader, the container or the codec, or the database,
 * whose case carries the laws it named, each shown as grizzle reports it with its name and rule,
 * where each is stated, and how the refusal names the row that broke them. A reader that tells the
 * user where to look reads the witness's kind rather than the detail's wording.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  origin: RefusalOrigin,
  rule: ImportRule,
}) {
  /**
   * What was refused and by which rule, in one sentence.
   */
  override get message(): string {
    return `The package was refused under the ${this.rule} rule: ${this.detail}`;
  }
}

/**
 * The database refused an apply under laws no row of the law table states, so no rule names the
 * refusal. It is a defect of this module's table, which the census in `refusal.oracle.test.ts`
 * keeps whole, never a verdict on the package.
 */
export class UnownedLaws extends Schema.TaggedError<UnownedLaws>()("UnownedLaws", {
  laws: Schema.Array(Schema.String),
}) {
  /**
   * The laws, and the repair.
   */
  override get message(): string {
    return `No rule owns the laws ${this.laws.join("; ")}. Group the statement of each under the law it states in its module's laws by name (namedLaws in src/import/refusal.ts), or give a primary key or generated field a row of writtenLaws there and a text type a row of textLaws, and run the census in refusal.oracle.test.ts.`;
  }
}

/**
 * Build the refusal of an `invariant-rejected` outcome: its rule by {@link ruleOfLaws}, its
 * explanation by {@link explain}.
 *
 * A host-side key conflict, two facts of one key that grizzle refuses before any SQL, names its
 * key law and the submitted key as its witness, and is refused the same way, with no SQLSTATE.
 *
 * @param laws - The outcome's `laws`.
 * @param witness - Its `witness`, or the row the caller read.
 * @param constants - The installed grammar's rows.
 * @returns The refusal, or {@link UnownedLaws} when no law of the set is in the table.
 */
export const refusalOfLaws = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
  witness: RefusalWitness,
  constants: RefusalConstants,
): Result.Result<ImportRefused, UnownedLaws> =>
  Option.match(ruleOfLaws(laws), {
    onNone: () => Result.fail(new UnownedLaws({ laws: laws.map((law) => Formatter.format(law)) })),
    onSome: (rule) => {
      const { detail, sources } = explain(laws, witness, constants);
      const named = pipe(
        laws,
        Arr.map((law) => {
          const identity = Formatter.format(law);

          return Option.match(lawNameOf(law), {
            onNone: () => ({ identity }),
            onSome: (name) => ({ identity, name, rule: lawTable[name].rule }),
          });
        }),
      );

      return Result.succeed(
        new ImportRefused({
          detail,
          origin: { _tag: "Database", laws: named, sources, witness: witness.kind },
          rule,
        }),
      );
    },
  });

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
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rule: "not-qti3" }),
      PackageReadError: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rule: refused.rule === "manifest-root" ? "manifest-root" : "href-path",
        }),
      ReaderRefusal: (refused) =>
        new ImportRefused({
          detail: `${refused.rule}: ${refused.detail}`,
          origin: readerOrigin,
          rule: "reader-refusal",
        }),
      UnmodeledVocabulary: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rule: refused.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary",
        }),
      WellFormednessError: (refused) =>
        new ImportRefused({
          detail: `${refused.message} at line ${String(refused.line)}, column ${String(refused.column)}`,
          origin: readerOrigin,
          rule: "well-formedness",
        }),
      ZipRefusal: (refused) =>
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rule: refused.rule }),
    }),
  );
