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
 *   of {@link statedLaws}, keyed by its identity as the outcome reports it ({@link lawIdentity}).
 *   {@link lawRules} is the one table from identity to rule.
 * - **One rule per refusal.** A family's axis foreign key discharges the family and every containment
 *   and fold merged into it, and its violation names them all, so a refusal picks the rule of its
 *   most specific law by one fixed order ({@link precedence}).
 * - **Explanations are computed.** {@link explain} reads the laws, the witness and the installed
 *   grammar's rows; for a content-order law it names the positions `Follow` allows next, each with
 *   its XSD particle. There is no catalog of messages.
 */
import { date, lexical, str } from "@bjornpagen/grizzle";
import type { Law, LawSide, Statement, Witness } from "@bjornpagen/grizzle";
import {
  Array as Arr,
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
import { noSharedModel } from "#pantry/grammar/content.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { NotQti3, UnmodeledVocabulary } from "#pantry/model/shred.ts";
import { attributeLawsByName, EntityName, OpenLocal, Space } from "#pantry/qti/attributes.ts";
import {
  Affix,
  AssembledReference,
  DeclarationTable,
  Expression,
  ExpressionAttribute,
  expressionLawsByName,
  referenceLawsByName,
  ItemTiming,
  Literal,
  LiteralTyped,
  MappingLookup,
  MappingSourceDeclaration,
  NameLookup,
  Operand,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  Processing,
  ProcessingTemplate,
  Reading,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  Separator,
  TemplateDefault,
  TemplateDefaultTarget,
  TestReference,
  VariableLookup,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import {
  chardataLawsByName,
  CommentText,
  DeclaredEncoding,
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
import { keyText, namespaceText } from "#pantry/qti/limits.ts";
import {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ChoiceVariableName,
  ContextRef,
  CountBound,
  CountRange,
  FeedbackRef,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  interactionLawsByName,
  ItemMode,
  LeastCount,
  MostCount,
  PlacedBinding,
  PlacedBindingDeclaration,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionPrintedName,
  SectionPrintedRef,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  Slider,
  TemplateRef,
} from "#pantry/qti/interactions.ts";
import {
  Digits,
  floatKeyPattern,
  Gap,
  Item,
  LookupValue,
  MapKeyDirectedPair,
  MapKeyPair,
  MapKeyPoint,
  mappingLawsByName,
  Negative,
  pairKeyPattern,
  pointKeyPattern,
  Sign,
  Zeros,
} from "#pantry/qti/mapping.ts";
import {
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
  metadataLawsByName,
  ObjectLang,
  ResourceLomGeneral,
  StatisticDate,
  UsageValue,
} from "#pantry/qti/metadata.ts";
import { EndCharacter, nodeLawsByName, prefixPattern } from "#pantry/qti/node.ts";
import { declarationLawsByName } from "#pantry/qti/declarations.ts";
import { htmlLawsByName } from "#pantry/qti/html.ts";
import { identityLawsByName } from "#pantry/qti/identity.ts";
import { operatorLawsByName } from "#pantry/qti/operators.ts";
import {
  EntryContent,
  HrefParams,
  packageLawsByName,
  Reference,
  ReferencePath,
} from "#pantry/qti/package.ts";
import { quotationLawsByName } from "#pantry/qti/quotation.ts";
import { SectionSelection, SelectForm, testLawsByName, testRelations } from "#pantry/qti/tests.ts";
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
 * need two rows per node.
 *
 * A value over the bound is valid QTI the model cannot key, so its verdict says so by its rule.
 * The import meets it as the bound's pattern law: grizzle's encoder and its family fill check a
 * text's type, its NUL and its surrogates and never its pattern (`core/text.ts` `validateText`,
 * `write/family/fold.ts` `admittedAt`), so the column's domain CHECK refuses it as the statement
 * casts it, `invariant-rejected` on the pattern's law with an unreported witness (README, "Errors
 * and outcomes").
 */
export const limitRules = [
  "key-text-bound",
  "href-form",
  "fragment-context",
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
 * One term of a law side: a field, or `pred` of a natural field.
 */
type Term = LawSide["terms"][number];

/**
 * Write a term as a law's identity spells it: a field by its name, `pred` of one as `pred(field)`.
 *
 * @param term - The term.
 * @returns Its text.
 */
const termText = (term: Term): string =>
  term.kind === "field" ? term.field : `pred(${term.field})`;

/**
 * Write a side as a law's identity spells it: its relation and its terms in the order the law
 * pairs them, as `Node(parent, pred(at), was)`.
 *
 * @param side - The side.
 * @returns Its text.
 */
const sideText = (side: LawSide): string =>
  `${side.relation}(${side.terms.map(termText).join(", ")})`;

/**
 * Write a law's identity: the text {@link lawRules} is keyed by, one per law the schema states.
 *
 * A check is its name alone, since every check is named by its law ({@link checkNameOf}) and one
 * law may be checked on several relations, as E1 is on `Node`, `Attribute` and `Idref`. A side is
 * its relation and its terms; its selection is no part of the identity, since no two laws the
 * schema states differ by a selection alone, which the census in `refusal.oracle.test.ts` holds. A
 * family and a tree are their slots, since one count counts one family, and a fold is its family's
 * slots, its monoid and its end, since an accumulated end is filled by one statement. A generated
 * field is its relation and field, since grizzle names one by them where a closed read in its term
 * has no row and its column's NOT NULL refuses the row.
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its identity.
 */
export const lawIdentity = (law: Law): string =>
  Match.value(law).pipe(
    Match.discriminatorsExhaustive("kind")({
      check: ({ name }) => `check ${name}`,
      contained: ({ from, to }) => `contained ${sideText(from)} in ${sideText(to)}`,
      contract: ({ contract }) => `contract ${contract}`,
      coverage: ({ from, to }) => `coverage ${sideText(from)} in ${sideText(to)}`,
      family: ({ order, slots }) => `${order} family ${slots.owner}.${slots.count}`,
      fold: ({ end, family, monoid }) =>
        `${monoid} fold over ${family.owner}.${family.count} into ${sideText(end)}`,
      generated: ({ field, relation }) => `generated ${relation}.${field}`,
      key: ({ side }) => `key ${sideText(side)}`,
      pattern: ({ flags, source }) => `pattern /${source}/${flags}`,
      primaryKey: ({ fields, relation }) => `primary key ${relation}(${fields.join(", ")})`,
      tree: ({ root, slots }) => `tree ${slots.owner}.${slots.count} by ${root}`,
    }),
  );

/**
 * The prefix that marks a `pred` term among a side's terms, as a statement's reading writes it.
 */
const predPrefix = "pred:";

/**
 * Read one term of a side: `pred:field` is `pred(field)`, any other text a field.
 *
 * @param term - The term's text.
 * @returns The term.
 */
const termOf = (term: string): Term =>
  term.startsWith(predPrefix)
    ? { field: term.slice(predPrefix.length), kind: "pred" }
    : { field: term, kind: "field" };

/**
 * Build a containment law.
 *
 * @param from - The side whose tuples are contained.
 * @param to - The side they are among.
 * @returns The law.
 */
const containedIn = (from: LawSide, to: LawSide): Law => ({ from, kind: "contained", to });

/**
 * Build both containments of a mirrors statement.
 *
 * @param left - One side.
 * @param right - The other.
 * @returns The two laws.
 */
const mirrored = (left: LawSide, right: LawSide): readonly Law[] => [
  containedIn(left, right),
  containedIn(right, left),
];

/**
 * Build a key law over a side.
 *
 * @param side - The side.
 * @returns The law.
 */
const keyOver = (side: LawSide): Law => ({ kind: "key", side });

/**
 * Build a relation's primary key law.
 *
 * @param relation - The relation.
 * @param fields - Its key's fields.
 * @returns The law.
 */
const primaryKeyOf = (relation: string, ...fields: readonly string[]): Law => ({
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
): Law => ({ field, kind: "generated", relation: relation.name });

/**
 * Build a family law: an ordered family's members indexed by their own field, a counted family's
 * by a hidden one.
 *
 * @param order - `ordered` or `counted`.
 * @param member - The member side, its group then an ordered family's index.
 * @param owner - The owner relation.
 * @param count - The owner's drawn count.
 * @returns The law.
 */
const familyOf = (
  order: "counted" | "ordered",
  member: LawSide,
  owner: string,
  count: string,
): Law => ({ kind: "family", member, order, slots: { count, owner } });

/**
 * Build a fold law over a family's slots.
 *
 * @param slots - The family's slots.
 * @param slots.owner - The owner relation.
 * @param slots.count - The owner's count.
 * @param monoid - The monoid it combines by.
 * @param step - The member side it steps by.
 * @param end - The owner side it ends at.
 * @returns The law.
 */
const foldOf = (
  slots: { readonly count: string; readonly owner: string },
  monoid: Extract<Law, { kind: "fold" }>["monoid"],
  step: LawSide,
  end: LawSide,
): Law => ({ end, family: slots, kind: "fold", monoid, step });

/**
 * A text field type, as `str.regex` builds it: its pattern's source and flags.
 */
interface TextType {
  readonly pattern: { readonly flags: "su" | "u"; readonly source: string };
}

/**
 * Two text types whose rows of {@link writtenLaws} name one pattern law by two names.
 */
export interface PatternConflict {
  readonly first: LawName;
  readonly identity: string;
  readonly second: LawName;
}

/**
 * Build the pattern law of each text type, as its domain's CHECK reports it, once per language.
 *
 * Grizzle reports one law for every spelling of the same pattern, carrying only its source and its
 * flags (docs/grizzle-findings.md, the pattern law's refusal), so two types of one source are one
 * law, and one name must hold for both: a refusal cannot tell which type's column broke it. Two
 * rows of one source that name two laws are a conflict, never the first row's silent win.
 *
 * @param types - Each type, with the law it states.
 * @returns The laws, one per source; or the first {@link PatternConflict}.
 */
export const patternLawsOf = (
  types: readonly (readonly [TextType, LawName])[],
): Result.Result<readonly (readonly [Law, LawName])[], PatternConflict> => {
  const named = new Map<string, readonly [Law, LawName]>();
  for (const [{ pattern }, name] of types) {
    const law: Law = { flags: pattern.flags, kind: "pattern", source: pattern.source };
    const identity = lawIdentity(law);
    const held = named.get(identity);
    if (held === undefined) {
      named.set(identity, [law, name]);
    } else if (held[1] !== name) {
      return Result.fail({ first: held[1], identity, second: name });
    }
  }

  return Result.succeed([...named.values()]);
};

/**
 * {@link patternLawsOf} of the table's own rows, which fails the module's load on a conflict, naming
 * the pattern and its two laws, since the table is a constant no caller can repair.
 *
 * @param types - Each type, with the law it states.
 * @returns The laws, one per source.
 */
const patternLaws = (
  types: readonly (readonly [TextType, LawName])[],
): readonly (readonly [Law, LawName])[] =>
  Result.getOrThrowWith(
    patternLawsOf(types),
    ({ first, identity, second }) =>
      new Error(
        `Two rows of writtenLaws in src/import/refusal.ts name the law ${identity} "${first}" and "${second}", and grizzle reports one law per pattern. Name both rows by the one law a package can break, or give one type a pattern of its own.`,
      ),
  );

/**
 * The names of the primary keys of `tests.ts`'s relations that are no overlay's: the assembled
 * test's instances, its names and its branch resolutions (Q5.13).
 */
const testKeyNames: ReadonlyMap<string, LawName> = new Map<string, LawName>([
  ["AssembledName", "Test name key"],
  ["BranchResolution", "Branch target"],
  ["BranchShuffle", "Branch forward"],
  ["BranchTarget", "Branch target"],
  ["Instance", "Inclusion cycle"],
  ["InstanceName", "Test name key"],
  ["ItemRefTarget", "Item ref target"],
]);

/**
 * The laws written out row by row, each as its outcome names it, with its name in {@link lawTable}:
 * the text types' patterns, each read from the type its module exports, so a bound that moves moves
 * its row; each relation's primary key; the generated fields' laws; and the laws of the modules
 * that do not yet name them where they state them ({@link namedLaws} holds those that do), in the
 * module order of the plan's §C.
 *
 * - **The text patterns**, in three classes (the orchestrator's ruling of 2026-11-06):
 *
 *   - A bound on a text is "Key text bound", a stated limit. `keyText` and `namespaceText` hold any
 *     text; the bounded names and paths also carry a production no package the reader accepts breaks,
 *     so their refusal means the bound alone. A prefix and a local name are NCNames because crust
 *     reads with saxes's `xmlns` on, which refuses a name that is no QName (Namespaces in XML 1.0,
 *     §4); a foreign namespace name is `Char`s because crust reads no other; an entry path begins
 *     with no `/` because the directory reader lists paths relative to the package root and `zip.ts`
 *     refuses an absolute name;
 *   - An unbounded XML production (a comment, an instruction, a doctype, an encoding name, a version
 *     number, an NCName) is "XML production", which crust refuses before any row exists. `Char*`
 *     (`Chars`, an attribute's `Lexical`) has the foreign namespace name's very pattern, so it is
 *     that law, "Key text bound": grizzle reports one law per pattern ({@link patternLawsOf}), and
 *     the bound is the one cause of it a package reaches;
 *   - A namespace declaration's value is "Namespace name": an RFC 3986 URI reference (reading 131),
 *     which crust does not check, so the domain is the law;
 *   - The whitespace around an IDREF token and an entry's base64 bytes are the host's own split and
 *     encoding, "E1 derived".
 * - **Each relation's primary key**, under the law its module's rows belong to.
 * - **The other overlays**: the keys, families and containments the W5 briefs state exactly.
 * - **The generated fields**: each one's law, its term's NULL, beside its relation's rows, under the
 *   law that states its value exists. No term of Qti's reads `C.at`, the one read that can miss, so
 *   no row breaks one. Each row says which law refuses first, or why none needs to, and is stated
 *   so an outcome naming it still has a rule.
 */
const writtenLaws: readonly (readonly [Law, LawName])[] = [
  ...patternLaws([
    [keyText, "Key text bound"],
    [namespaceText, "Key text bound"],
    [str.regex(prefixPattern), "Key text bound"],
    [OpenLocal, "Key text bound"],
    [NamespacePrefix, "Key text bound"],
    [ForeignNamespace, "Key text bound"],
    [EntryPath, "Key text bound"],
    [NamespaceUri, "Namespace name"],
    [CommentText, "XML production"],
    [PiTarget, "XML production"],
    [PiData, "XML production"],
    [DoctypeText, "XML production"],
    [EncName, "XML production"],
    [DeclaredEncoding, "XML production"],
    [XmlVersion, "XML production"],
    [NcName, "XML production"],
    [EntityName, "XML production"],
    [Space, "E1 derived"],
    [str.regex(floatKeyPattern), "E1 derived"],
    [str.regex(pointKeyPattern), "E1 derived"],
    [str.regex(pairKeyPattern), "E1 derived"],
    [Sign, "E1 derived"],
    [Zeros, "E1 derived"],
    [Digits, "E1 derived"],
    [Negative, "E1 derived"],
    [Gap, "E1 derived"],
    [Item, "E1 derived"],
    [Affix, "E1 derived"],
    [Separator, "E1 derived"],
    [HrefParams, "E1 derived"],
    [EntryContent, "E1 derived"],
    [EndCharacter, "E1 derived"],
  ]),
  [primaryKeyOf("Node", "id"), "Node key"],
  ...(
    [
      ["Comment", "comment arm"],
      ["Pi", "pi arm"],
      ["Doctype", "doctype arm"],
      ["Document", "Document"],
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
  ...(["ManifestId", "Resource", "File", "Dependency"] as const).map(
    (overlay) => [primaryKeyOf(overlay, "node"), "Manifest overlay"] as const,
  ),
  [primaryKeyOf("ResourceHref", "node"), "Manifest overlay"],
  [primaryKeyOf("ResourceTyped", "node"), "E1 derived"],
  [primaryKeyOf("TypedHref", "node"), "E1 derived"],
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
  [primaryKeyOf("GeneralNamed", "general"), "E1 derived"],
  [primaryKeyOf("GeneralObject", "general"), "E1 derived"],
  [primaryKeyOf("DocumentGenerals", "document"), "E1 derived"],
  [primaryKeyOf("GeneralLang", "general", "lang"), "E1 derived"],
  [primaryKeyOf("PlacedXmlLang", "instance", "node"), "E1 derived"],
  [primaryKeyOf("AssembledLang", "assembly", "lang"), "E1 derived"],
  [primaryKeyOf("PlacedGeneralLang", "general", "lang"), "E1 derived"],
  [primaryKeyOf("SsmlAttribute", "node", "name"), "E1 derived"],
  [primaryKeyOf("SsmlScope", "node"), "E1 derived"],
  [primaryKeyOf("FragmentValue", "fragment", "kind", "value"), "E1 derived"],
  [primaryKeyOf("LomLanguage", "node"), "E1 derived"],
  [primaryKeyOf("ResourceLomLanguageSet", "general", "lang"), "E1 derived"],
  [primaryKeyOf("Quotation", "node"), "E1 derived"],
  [primaryKeyOf("LabelUse", "node"), "Label tools"],
  [primaryKeyOf("TableScope", "node"), "E1 derived"],
  [primaryKeyOf("CellHeaders", "node"), "E1 derived"],
  [primaryKeyOf("HeaderToken", "node", "at"), "E1 derived"],
  [primaryKeyOf("TableHeader", "node"), "E1 derived"],
  [primaryKeyOf("Rounding", "node"), "E1 derived"],
  [primaryKeyOf("Tolerance", "node"), "E1 derived"],
  [primaryKeyOf("ToleranceToken", "node", "at"), "E1 derived"],
  ...(["Declaration", "ValueSet", "Value", "RecordField", "OutcomeRange"] as const).map(
    (overlay) => [primaryKeyOf(overlay, "node"), "Declaration overlay"] as const,
  ),
  // An operand's type bits read `ValueBaseBit.row` and `ValueCardinalityBit.row`, closed reads of
  // a set keyed by the row's own NOT NULL `baseType` and `cardinality`: ∅ where the diagonal holds
  // no row (`any`, `unknown`), never NULL, which only a NULL key, an absent `C.at`, reads
  // (docs/grizzle-findings.md, lane DBT's). So no row breaks either law. A field a closed relation
  // determines is E1 derived.
  [generatedOf(Operand, "baseTypeBit"), "E1 derived"],
  [generatedOf(Operand, "cardinalityBit"), "E1 derived"],
  ...(
    ["Mapping", "MapKey", "MapKeyInteger", "MapKeyFloat", "AreaMapping", "LookupTable"] as const
  ).map((overlay) => [primaryKeyOf(overlay, "node"), "Mapping overlay"] as const),
  ...Object.values(testRelations).map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        testKeyNames.get(name) ?? "Test overlay",
      ] as const,
  ),
  ...patternLaws([[SelectForm, "E1 derived"]]),
  // `select` casts `selectForm`, which SelectForm's pattern, the row above, holds to the language
  // the cast reads total: a form outside it is refused by that law as the statement casts it into
  // its column, before PostgreSQL computes `select`, so no row breaks this one.
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
    ObjectLang,
    ResourceLomGeneral,
    StatisticDate,
    UsageValue,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  // `day` restates `lastUpdated`, a `DateDType`, whose language the attribute's value domain
  // states: xs:date's lexical space, the month lengths and the leap rule included, under its
  // pattern. Its type, lexical(date), is that language, and its pattern law is the value domain's,
  // with its rule, so one cause names one rule (the orchestrator's ruling of 2026-11-06).
  ...patternLaws([[lexical(date), "value domain"]]),
  // `date` casts `day`, which lexical(date)'s pattern, the row above, holds to the days 0001-01-01
  // to 9999-12-31 the cast reads total: a day outside it is refused by that law as the statement
  // casts it into its column, before PostgreSQL computes `date`, so no row breaks this one. Its
  // value is the calendar day `lastUpdated` names, which the value domain states exists.
  [generatedOf(StatisticDate, "date"), "value domain"],
  ...[
    AriaElement,
    AriaRange,
    AriaValue,
    Binding,
    BindingDeclaration,
    BindingName,
    BoundVariable,
    Choice,
    ChoiceInteraction,
    ChoiceVariableName,
    ContextRef,
    CountBound,
    CountRange,
    FeedbackRef,
    Hotspot,
    Hottext,
    Interaction,
    InteractionAttribute,
    ItemMode,
    LeastCount,
    MostCount,
    PlacedBinding,
    PlacedBindingDeclaration,
    PlacedChoice,
    PlacedHottext,
    PrintedVariableRef,
    ReferringDocument,
    SectionContextName,
    SectionContextRef,
    SectionFeedbackName,
    SectionFeedbackRef,
    SectionPrintedName,
    SectionPrintedRef,
    SectionScope,
    SectionTemplateName,
    SectionTemplateRef,
    Slider,
    TemplateRef,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  ...[MapKeyPoint, MapKeyPair, MapKeyDirectedPair, LookupValue].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Mapping overlay",
      ] as const,
  ),
  ...[
    AssembledReference,
    DeclarationTable,
    Expression,
    ExpressionAttribute,
    ItemTiming,
    Literal,
    LiteralTyped,
    MappingLookup,
    MappingSourceDeclaration,
    NameLookup,
    Operand,
    PlacedDocument,
    PlacedReference,
    PlacedVariableRef,
    Processing,
    ProcessingTemplate,
    Reading,
    ReferenceDocument,
    ReferenceSegment,
    SectionIdentifier,
    TemplateDefault,
    TemplateDefaultTarget,
    TestReference,
    VariableLookup,
    VariableRef,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  ...[Reference, ReferencePath].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Reference overlay",
      ] as const,
  ),
];

/**
 * A term of a side as a statement value holds it: a field's name, or `pred` of one.
 */
const TermValue = Schema.Union([
  Schema.String,
  Schema.Struct({ field: Schema.String, kind: Schema.Literal("pred") }),
]);

/**
 * A relation as a statement value names it.
 */
const NamedValue = Schema.Struct({ name: Schema.String });

/**
 * A side as a statement value holds it: its source, a relation or a selection of one, and its
 * terms. A selection's predicate is no part of the value, nor of a law's identity.
 */
const SideValue = Schema.Struct({
  source: Schema.Union([NamedValue, Schema.Struct({ relation: NamedValue })]),
  terms: Schema.NonEmptyArray(TermValue),
});

/**
 * A family statement's value: `ordered`, `counted` or `tree`, its member side and its slots.
 */
const FamilyValue = Schema.Struct({
  family: SideValue,
  kind: Schema.Literals(["counted", "ordered", "tree"]),
  root: Schema.optional(Schema.String),
  slots: Schema.Struct({ count: Schema.String, owner: NamedValue }),
});

/**
 * Every statement value a module's group of {@link namedLaws} may hold, as grizzle's constructors
 * build it.
 */
const StatementValue = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("check") }),
  Schema.Struct({ kind: Schema.Literal("key"), side: SideValue }),
  Schema.Struct({
    kind: Schema.Literals(["contained", "mirrors"]),
    left: SideValue,
    right: SideValue,
  }),
  FamilyValue,
  Schema.Struct({
    end: SideValue,
    family: FamilyValue,
    kind: Schema.Literal("fold"),
    monoid: Schema.Struct({
      name: Schema.Literals(["count", "sum", "or", "twos", "max", "concat"]),
    }),
    step: SideValue,
  }),
]);

/**
 * Read a statement value's side as a law names it.
 *
 * @param side - The side's value.
 * @returns The side.
 */
const sideRead = (side: typeof SideValue.Type): LawSide => ({
  relation: "relation" in side.source ? side.source.relation.name : side.source.name,
  selection: { conjuncts: [] },
  terms: pipe(
    side.terms,
    Arr.map((term): Term => (Predicate.isString(term) ? termOf(term) : term)),
  ),
});

/**
 * Read the laws a statement states that are no check, as an `invariant-rejected` outcome names
 * them: a mirrors is its two containments, and a check is named by its law already.
 *
 * @param statement - A statement of a schema.
 * @returns Its laws, none for a check or a statement value no law reads.
 */
export const lawsOfStatement = (statement: Statement): readonly Law[] =>
  Option.match(Schema.decodeUnknownOption(StatementValue)(statement), {
    onNone: () => [],
    onSome: (read): readonly Law[] => {
      if (read.kind === "check") {
        return [];
      }

      if (read.kind === "key") {
        return [keyOver(sideRead(read.side))];
      }

      if (read.kind === "contained" || read.kind === "mirrors") {
        const left = sideRead(read.left);
        const right = sideRead(read.right);

        return read.kind === "contained" ? [containedIn(left, right)] : mirrored(left, right);
      }

      if (read.kind === "fold") {
        return [
          foldOf(
            { count: read.family.slots.count, owner: read.family.slots.owner.name },
            read.monoid.name,
            sideRead(read.step),
            sideRead(read.end),
          ),
        ];
      }

      if (!("slots" in read)) {
        return [];
      }

      const member = sideRead(read.family);
      const slots = { count: read.slots.count, owner: read.slots.owner.name };

      return [
        read.kind === "tree"
          ? { kind: "tree", member, root: read.root ?? "", slots }
          : familyOf(read.kind, member, slots.owner, slots.count),
      ];
    },
  });

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
  testLawsByName,
];

/**
 * Read the laws a module names: every law of each statement under its law's name, a check by its
 * own name already.
 *
 * @param byName - The module's statements by law.
 * @returns Its laws, each with its name.
 */
const lawsNamedIn = (byName: LawsByName): readonly (readonly [Law, LawName])[] =>
  lawNames.flatMap((name) =>
    (byName[name] ?? []).flatMap(lawsOfStatement).map((law) => [law, name] as const),
  );

/**
 * Every law the schema states that is no check, each as its outcome names it, with its name in
 * {@link lawTable}: every law of {@link namedLaws}, under the name its module groups it by, then
 * {@link writtenLaws}' rows for the laws no module names, each once.
 */
export const statedLaws: readonly (readonly [Law, LawName])[] = Arr.dedupeWith(
  [...namedLaws.flatMap(lawsNamedIn), ...writtenLaws],
  ([a], [b]) => lawIdentity(a) === lawIdentity(b),
);

/**
 * Each law's name by its identity: every law's check, by {@link checkNameOf}, and every law of
 * {@link statedLaws}.
 */
const namesByIdentity: ReadonlyMap<string, LawName> = new Map([
  ...lawNames.map((name) => [`check ${checkNameOf(name)}`, name] as const),
  ...statedLaws.map(([law, name]) => [lawIdentity(law), name] as const),
]);

/**
 * The rule each law the schema states keeps, by the law's identity ({@link lawIdentity}): the one
 * table from a law as grizzle reports it to the rule its refusal names.
 */
export const lawRules: ReadonlyMap<string, Rule> = new Map(
  [...namesByIdentity].map(([identity, name]) => [identity, lawTable[name].rule] as const),
);

/**
 * Name the law an outcome's law is.
 *
 * @param law - A law as an `invariant-rejected` outcome names it.
 * @returns Its name, or none for a law no row of the table states.
 */
export const lawNameOf = (law: Law): Option.Option<LawName> =>
  Option.fromUndefinedOr(namesByIdentity.get(lawIdentity(law)));

/**
 * Each rule's place in {@link precedence}.
 */
const ranks: ReadonlyMap<Rule, number> = new Map(precedence.map((rule, rank) => [rule, rank]));

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
        Option.toArray(Option.map(lawNameOf(law), (name): Rule => lawTable[name].rule)),
      ),
      Order.mapInput(Order.Number, (rule: Rule) => ranks.get(rule) ?? precedence.length),
    ),
  );

/**
 * What a refusal knows of the row that broke its laws: grizzle's witness, or the row's fields as
 * the caller read them.
 *
 * Grizzle names a key's violating row by its key fields alone, and a constraint PostgreSQL checks
 * itself (a foreign key, a row check, a closed relation's check) by none: its witness is
 * `unreported`. The fields a content-order law reads (a node's `version`, its parent's kind and its
 * predecessor's state) are in no witness grizzle gives, so a caller that holds the row, such as a
 * direct-SQL test or the law oracle's breach, passes it as `row`.
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
   * Each law, its rule and its identity; the witness's row; and for a content-order law the state
   * it broke at and what its model allows there.
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
  const symbols = Map.groupBy(content.symbol.rows, ({ model }) => model);
  const index: ContentIndex = {
    ends: grouped(content.last.rows.map(({ model, position }) => [model, position] as const)),
    kinds: grouped([
      ...admission.rows.map(
        ({ child, parent, position, version }) =>
          [positionKey(version, parent, position), child] as const,
      ),
      ...content.sharedModelOf.rows.flatMap(({ model, parent, version }) =>
        model === noSharedModel
          ? []
          : (symbols.get(model) ?? []).map(
              ({ kind, position }) => [positionKey(version, parent, position), kind] as const,
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
 * state, and the node's own kind.
 */
interface BrokenState {
  readonly kind: string;
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
    : Option.some({ kind: values["kind"] ?? parent, law, parent, state, version });
};

/**
 * Name the positions a model allows after a state, with their kinds and sources.
 *
 * @param broken - The state.
 * @param constants - The installed grammar's rows.
 * @returns The positions, ascending by code.
 */
const allowedAfter = (broken: BrokenState, constants: RefusalConstants): readonly Allowed[] => {
  const index = contentIndexOf(constants);
  const { parent, state, version } = broken;
  const model = index.models.get(`${version} ${parent}`) ?? "";

  return Arr.sort(index.next.get(`${model} ${state}`) ?? [], byPosition).map((position) => ({
    kinds: index.kinds.get(positionKey(version, parent, position)) ?? [],
    position,
    source: Option.map(constants.content.sourceOf({ parent, position, version }), sourceText),
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
            `${position} (${kinds.join(" ") || "no kind"}${Option.match(source, {
              onNone: () => "",
              onSome: (text) => `, ${text}`,
            })})`,
        )
        .join("; ");

/**
 * Write what a content-order law's broken state means: where the node stands in its parent's model,
 * or where its family ends in its own, and what the model allows next.
 *
 * @param broken - The state.
 * @param allowed - What the model allows after it.
 * @param constants - The installed grammar's rows.
 * @returns The sentence.
 */
const brokenStateText = (
  broken: BrokenState,
  allowed: readonly Allowed[],
  constants: RefusalConstants,
): string => {
  const { kind, parent, state, version } = broken;
  if (broken.law === "N7 Last") {
    const index = contentIndexOf(constants);
    const ends = index.ends.get(index.models.get(`${version} ${parent}`) ?? "") ?? [];

    return `${parent}'s children end in state ${state} of its content model in ${version}, which ends only in ${Arr.sort(ends, byPosition).join(", ") || "no state"}; after state ${state} it needs one of ${allowedText(allowed)}`;
  }

  return `${kind} follows state ${state} of ${parent}'s content model in ${version}, which allows next ${allowedText(allowed)}`;
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
 * Each law is named with its rule and identity, and its spec source joins `sources`. For a
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
  const named = laws.map((law) => ({ identity: lawIdentity(law), name: lawNameOf(law) }));
  const broken = Arr.head(
    named.flatMap(({ name }) =>
      Option.toArray(name.pipe(Option.flatMap((law) => brokenStateOf(law, witness)))),
    ),
  );
  const next = broken.pipe(Option.map((state) => allowedAfter(state, constants)));
  const lawText = named
    .map(({ identity, name }) =>
      Option.match(name, {
        onNone: () => `${identity}, which no rule of the law table owns`,
        onSome: (law) => `${law} (rule ${lawTable[law].rule}): ${identity}`,
      }),
    )
    .join("; ");
  const stateText = Option.match(Option.all({ allowed: next, broken }), {
    onNone: () => "",
    onSome: ({ allowed, broken: state }) => `. ${brokenStateText(state, allowed, constants)}`,
  });
  const modelSources = Option.match(broken, {
    onNone: () => [],
    onSome: ({ parent, version }) => [
      ...Option.toArray(
        Option.map(constants.content.sourceOf({ parent, position: "0", version }), sourceText),
      ),
      ...Option.getOrElse(next, () => []).flatMap(({ source }) => Option.toArray(source)),
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
 * whose case carries the laws it named, each parsed into its identity, name and rule, where each
 * is stated, and how the refusal names the row that broke them. A reader that tells the user where
 * to look reads the witness's kind rather than the detail's wording.
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
    return `No rule owns the laws ${this.laws.join("; ")}. Add each to statedLaws in src/import/refusal.ts under the law it states, and run the census in refusal.oracle.test.ts.`;
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
    onNone: () => Result.fail(new UnownedLaws({ laws: laws.map(lawIdentity) })),
    onSome: (rule) => {
      const { detail, sources } = explain(laws, witness, constants);
      const named = pipe(
        laws,
        Arr.map((law) => {
          const identity = lawIdentity(law);

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
