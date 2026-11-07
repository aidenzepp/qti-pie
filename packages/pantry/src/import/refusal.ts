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
import { EntityName, Lexical, OpenLocal, Space } from "#pantry/qti/attributes.ts";
import {
  Affix,
  AssembledReference,
  DeclarationTable,
  Expression,
  ExpressionAttribute,
  expressionLaws,
  ItemTiming,
  Literal,
  MappingLookup,
  MappingSource,
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
  TestReference,
  VariableLookup,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import {
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
import { keyText, namespaceText } from "#pantry/qti/limits.ts";
import {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceVariableName,
  ContextRef,
  CountBound,
  FeedbackRef,
  Hotspot,
  Hottext,
  InteractionAttribute,
  interactionLaws,
  ItemMode,
  PlacedBinding,
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
  VarRef,
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
  mappingLaws,
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
  metadataLaws,
  ObjectLang,
  ResourceLomGeneral,
  StatisticDate,
  UsageValue,
} from "#pantry/qti/metadata.ts";
import { Chars, EndCharacter, prefixPattern } from "#pantry/qti/node.ts";
import { EntryContent, HrefParams, Reference, ReferencePath } from "#pantry/qti/package.ts";
import { mathmlLaws } from "#pantry/qti/mathml.ts";
import { headQualifierLaw } from "#pantry/qti/mathml-apply.ts";
import { quotationLaws } from "#pantry/qti/quotation.ts";
import {
  branchLaws,
  inclusionLaws,
  itemRefLaws,
  SelectForm,
  testNameLaws,
  testOverlayLaws,
  testRelations,
} from "#pantry/qti/tests.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import type { ZipRefusal } from "#pantry/package/zip.ts";
import type { Source } from "#pantry/vocab/inventory/types.ts";

/**
 * Every rule a law keeps or will keep, most specific first: the order {@link ruleOfLaws} picks a
 * refusal's rule by when one PostgreSQL object discharges several laws.
 *
 * The tiers run from QTI's own rules to the representation's:
 *
 * 1. QTI's information model, its overlays O1 to O7 in the plan's order (§1.7), then packaging's P1 to
 *    P4 (§1.6);
 * 2. The embedded languages' readings (MathML, SSML);
 * 3. XML Schema's assessment of an element's governing type, its attributes and its text;
 * 4. The content model: the ancestry bans, the nearest interaction, then the automaton's order, the
 *    counts it relaxes, the family's end and admission;
 * 5. The document layer: the stated bound on a key's text, foreign names, derived fields and the tree.
 *
 * A specific law says what in the content to change, and a general one only that the
 * representation broke, so a QTI rule wins over a tree law and a content-order law over a family
 * law. The rules {@link owedRules} lists stand at their tier already, so the order holds when their
 * laws land.
 */
export const precedence = [
  // O1, identity.
  "document-key",
  "idref-target",
  "table-headers",
  "label-tool",
  "document-lang",
  // O2, declarations.
  "declaration-key",
  "declaration-reserved",
  "reserved-type",
  "declaration-type",
  "value-cardinality",
  "typed-copy",
  "mastery-range",
  // O3, interactions.
  "binding-declared",
  "binding-fit",
  "record-binding-fit",
  "binding-unique",
  "choice-bounds",
  "choice-identifier-distinct",
  "hotspot-default",
  "feedback-ref",
  "template-ref",
  "printed-variable-ref",
  "context-variable-ref",
  "slider-bounds",
  "max-strings-required",
  "aria-value-range",
  "varref-copy",
  "adaptive-feedback",
  // HTML content.
  "source-srcset",
  "source-src",
  "track-srclang",
  "q-punctuation",
  // O4, expressions.
  "P2",
  "P8",
  "P10",
  "P36",
  "prefixed-ref",
  "variable-kind",
  "P20",
  "P21",
  "P22",
  "P23",
  "P24",
  "P25",
  "P26",
  "P27",
  "P29",
  "item-duration",
  // O5 to O7: mapping, metadata, tests.
  "mapping-base-type",
  "lookup-cardinality",
  "map-key-unique",
  "lom-identifier",
  "lom-title",
  "lom-learning-resource-type",
  "calendar",
  "selection-bounds",
  "selection-required",
  "structure-identifier",
  "test-name-key",
  "section-identifier-target",
  "branch-target",
  "branch-forward",
  "section-empty",
  "stimulus-ref-key",
  "variable-mapping-target",
  "variable-mapping-source",
  "template-default-target",
  "item-ref-target",
  "stimulus-ref-target",
  "include-target",
  "include-root",
  "inclusion-cycle",
  // P1 to P4, packaging.
  "resource-type",
  "root-type-reverse",
  "entry-kind",
  "file-listed",
  "file-exists",
  "href-listed",
  "self-dependency",
  "manifest-id-space",
  // The embedded languages.
  "math-arity",
  "ssml-fragment",
  "include-href",
  // XML Schema's assessment.
  "xsi-type",
  "required-attribute",
  "attribute-count",
  "attribute-lexical",
  "text-copy",
  "attribute-admission",
  // The content model.
  "ancestry-ban",
  "owner-copy",
  "ordering",
  "child-set",
  "union-count",
  "admission",
  // The document layer: its stated limit, then its laws.
  "key-text-bound",
  "href-form",
  "fragment-context",
  "namespace-name",
  "well-formedness",
  "unmodeled-vocabulary",
  "derived",
  "reachability",
] as const;

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
 * A law's rule and where its statement comes from: a reading of `docs/spec-readings.md`, an XML
 * Schema or XSD anchor, a specification section, or the design document a structural law follows.
 */
interface LawEntry {
  readonly rule: Rule;
  readonly source: string;
}

/**
 * Every law the schema states, by name, with the rule its refusal keeps and its spec source.
 *
 * The names are the law oracle's, each with the oracle's rule and source (`src/test/oracle.ts`
 * `lawRules`, `lawSources`, which `refusal.test.ts` holds equal), and a name of its own for each
 * law the oracle states no host predicate for: the tree as grizzle states it, the package's
 * structure, a dependency's target and a choice's key.
 */
export const lawTable = {
  "AL1 admission": {
    rule: "attribute-admission",
    source:
      "the XSDs' attribute declarations and wildcards as AttributeAdmission (fin.md D2); reading 13 for data-*, reading 47 for xsi:; and the declarations readings refuse (attributes.ts readingRefusals): 9 (role on source, the Schematron's RULE ARIA ROLE 1a) and 85 (xi:include's xpointer)",
  },
  "AL1 owner": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's owner copy (kind, version, document)",
  },
  "AL2 count": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's count",
  },
  "AL2 distinct": {
    rule: "attribute-admission",
    source:
      "XML 1.0 §3.1, WFC Unique Att Spec, by position (fin.md §16, masked by the open classes, D2)",
  },
  "AL2 fold": {
    rule: "attribute-admission",
    source: "fin.md §16, attrs = attrsWas | bit(position)",
  },
  "AL2 last slot": {
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's end value",
  },
  "AL3 required": {
    rule: "required-attribute",
    source:
      "the XSDs' use=\"required\", and reading 123: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BDO (§5.11: 'Authors must specify the dir attribute on this tag'), where the XSD declares bdo's dir optional (attributes.ts readingUses): AttributeAdmission's use side (Required)",
  },
  "AL4 open name key": {
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  },
  "AL4 open names": {
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  },
  "AL5 attribute count": {
    rule: "attribute-count",
    source:
      "readings 41 and 43 (attributes.ts attributeCounts): https://www.w3.org/TR/speech-synthesis11/#S3.1.6 (SSML 1.1 §3.1.6, meta: 'Either a name or http-equiv attribute is required. It is an error to provide both name and http-equiv attributes'); https://www.w3.org/TR/speech-synthesis11/#S3.2.1 and #S3.2.4 (§3.2.1, voice, and §3.2.4, prosody: 'Although each attribute individually is optional, it is an error if no attributes are specified'), counting what §2.2.1's fragment removal keeps: SSML's own attributes, xml:lang and xml:base",
  },
  "Adaptive feedback": {
    rule: "adaptive-feedback",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_FeedbackBlock (§5.49, FeedbackBlock, and §5.52, FeedbackInline: 'A feedback element that forms part of a Non-adaptive Item must not contain an interaction object, either directly or indirectly'), plan §1.7 O3 (Q5.09): a non-adaptive item binds no response variable whose interaction stands inside feedback, select(BoundVariable, response, adaptive = false) contained in the interactions outside every feedback flag",
  },
  "AreaMapping base type": {
    rule: "mapping-base-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_AreaMapping (§5.5, the AreaMapping class: 'A special class used to create a mapping from a source set of point values to a target set of float values'): an area mapping's response declaration is of base type point (mapping.ts AreaMapping_base_type)",
  },
  "Aria value range": {
    rule: "aria-value-range",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ARIABase.Attr_aria-valuemax (§5.2.31, and §7.1.31 of ARIABaseEmpty: 'Authors MUST ensure the value of 'aria-valuemax' is greater than or equal to the value of 'aria-valuemin''), both read as xs:decimal, as the XSD types them (interactions.ts AriaRange); reading 91 makes the MUST a law",
  },
  Arity: {
    rule: "P2",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 (§2.11.3, Operators: each operator's sub-expression count, as §2.11.3.28 Match, https://www.imsglobal.org/spec/qti/v3p0/info#OpMatch, 'takes two sub-expressions') (expression.ts OperatorArity); reading 21",
  },
  "Attribute prefix": {
    rule: "attribute-admission",
    source:
      "reading 47 (an xsi: attribute is exported byte for byte, C54), with https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 §3: 'The prefix xml is by definition bound to the namespace name http://www.w3.org/XML/1998/namespace … Other prefixes MUST NOT be bound to this namespace name'; 'The prefix xmlns is used only to declare namespace bindings') and https://www.w3.org/TR/xml-names/#defaulting (§6.2: 'The namespace name for an unprefixed attribute name always has no value'): every attribute keeps the prefix its name is written with, empty for a name in no namespace, xml for the XML namespace's, and neither empty, xml nor xmlns for an xsi:, xlink: or namespaced open name (attributes.ts Attribute_prefix)",
  },
  "AttributeEntity owner": {
    rule: "attribute-lexical",
    source: "XML 1.0 §4.1 (entity references in attribute values), kept unexpanded (plan §1.4)",
  },
  "Binding cardinality": {
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_max-choices (§5.30.2: 'If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with multiple cardinality'), and the same sentence of max-choices (§5.66.1, §5.68.2, §5.107.3, §5.128.2) and max-associations (§5.8.2, §5.57.3, §5.59.2, §5.60.2, §5.89.2), reading 92; the Schematron's RESPONSEDEC rule 2 is the choice interaction's case; a most left unwritten reads its XSD default",
  },
  "Binding declared": {
    rule: "binding-declared",
    source:
      "reading 75: https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4: each interaction 'must be bound to a response variable', as §2.4.1.1's 'The qti-choice-interaction must be bound to a response variable with a base-type of identifier and single or multiple cardinality'), https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'Response variables are declared by response declarations and bound to interactions in the itemBody') and https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: 'All variables must be declared except for the built-in session variables'); the text entry interaction's response-identifier is the XSD's IDREF (reading 14), every other interaction's, the extended text interaction's among them, an IdentifierDType this law resolves",
  },
  "Binding unique": {
    rule: "binding-unique",
    source:
      "reading 92: https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'Each response variable declared may be bound to one and only one interaction'): no two interactions of an item name one response variable",
  },
  BindingFit: {
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4, each interaction's 'must be bound to a response variable with a base-type of … and … cardinality', as §2.4.1.1 https://www.imsglobal.org/spec/qti/v3p0/info#ChoiceInt) (expression.ts BindingFit)",
  },
  "Branch forward": {
    rule: "branch-forward",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'the test jumps forward to the item, section or part referred to by the target identifier', 'the target must refer to an item or section in the same test-part that has not yet been presented'; §2.8.3.2): a target lies after its source's end in the assembled test, unless the section that orders the two shuffles (§5.98, an invisible section not kept together mixing its children into its parent's order); fixed is not read, a recorded limit (tests.ts Branch_forward)",
  },
  "Branch target": {
    rule: "branch-target",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'In the case of an item or section, the target must refer to an item or section in the same test-part … For test-parts, the target must refer to another test-part'; §5.23.1, the reserved EXIT_SECTION, EXIT_TESTPART and EXIT_TEST), §7.5 ('branching rules should treat referred sections as leaf nodes') and §5.98 ('It is therefore an error to make such an item the target of a branch-rule', of an item a selection with replacement can repeat): a target is an exit, or a part of its source's kind in its source's test part, in an instance that holds its source's, never a replaceable item ref (tests.ts Branch_target)",
  },
  "Calendar date": {
    rule: "calendar",
    source:
      "the usage data XSD usagedata/imsqti_usagedatav3p0_v1p0.xsd:127-131 (DateDType, xs:date restricted by the pattern [0-9]{4}-[0-9]{2}-[0-9]{2}), the type of lastUpdated on CategorizedStatisticDType (:161) and OrdinaryStatisticDType (:198), with XML Schema 1.0 Part 2 §3.2.9.1's lexical space (no year 0000, the Gregorian month lengths and the leap rule) under whiteSpace collapse: exactly grizzle's lexical(date), 0001 to 9999 with no timezone, between XML whitespace (Q5.12)",
  },
  "Choice bounds": {
    rule: "choice-bounds",
    source:
      "reading 76: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_min-choices (§5.30.3: 'min-choices must be less than or equal to the limit imposed by max-choices'; §5.30.2: 'If max-choices is 0 then there is no restriction'), the same sentence for min-associations (§5.8.3, §5.57.2, §5.59.1, §5.60.1, §5.89.3), match-min (§5.7.9, §5.56.6, §5.58.6, §5.131.7), min-choices (§5.66.2, §5.68.1, §5.107.2, §5.128.1) and min-strings (§5.48.7, with reading 53's 0); reading 18: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_OrderInteraction.Attr_max-choices (§5.97.3, and §5.61.2 of the graphic order interaction: 'Used in conjunction with min-choices, if specified, max-choices must be greater than or equal to min-choices and must not exceed the number of choices available'; §5.97.2, §5.61.1: min-choices 'must not exceed the number of choices available. If unspecified, all of the choices must be ordered and max-choices is ignored'), with no 0 exemption, read only where min-choices is written (references.ts ChoiceBound's counted zero and ChoiceCount); the media interaction's plays by reading 9, the Schematron's rule 13Ba read by intent, max-plays 0 no limit (§5.92.3)",
  },
  "Choice identifier key": {
    rule: "choice-identifier-distinct",
    source:
      'reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1, and §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and §5.131.1: \'This identifier must not be used by any other choice or item variable\', each class naming its own noun) and https://www.imsglobal.org/spec/qti/v3p0/info#Data_Identifier (§7.16: an identifier is \'a logical reference to another object in the item, such as an itemVariable or choice\'): no two choices of one kind in a document share an identifier, whichever interactions hold them, nor two hottexts of a document, compared collapsed (interactions.ts key(on(Choice, "document", "kind", "identifier")) and key(on(Hottext, "document", "identifier")))',
  },
  "Choice not variable": {
    rule: "choice-identifier-distinct",
    source:
      "reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1 and the other choice classes' identifier: 'This identifier must not be used by any other choice or item variable') and https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: item variables are declared, 'except for the built-in session variables referred to below which are declared implicitly'; §2.2.2.1, QTI_CONTEXT): no choice or hottext bears the identifier of a declaration of its document, nor in an item that of a built-in variable, compared collapsed (interactions.ts ChoiceVariableName, Choice_not_variable)",
  },
  "Condition type": {
    rule: "P21",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_ResponseIf (§2.5.1.2, ResponseIf and ResponseElseIf: 'An expression which must have an effective value of boolean' single), the outcome and template branches alike, and TemplateConstraint (§2.8.1.6) (expressions.ts Condition_type; the old checker's P21)",
  },
  "Context variable reference": {
    rule: "context-variable-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Context (§2.2.2.1, Context Variable: the built-in QTI_CONTEXT and the context declarations) and the Schematron's rule 20Ba (reading 9): a PCI's qti-context-variable names QTI_CONTEXT or a declared context variable (references.ts ContentReference)",
  },
  "Declaration base type": {
    rule: "declaration-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_base-type (§4.5.3, and §5.34.3, §5.115.3, §5.151.3: 'The value space from which the variable's value can be drawn (or in the case of containers, from which the individual values are drawn) is identified with a base-type', 'Variables with record cardinality have no base-type'): a record declares no base type (BaseType none), and every other variable declares one",
  },
  "Declaration key": {
    rule: "declaration-key",
    source:
      "reading 74: https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: 'The purpose of the declaration is to associate an identifier with the variable') and https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, and §5.34.1, §5.115.1, §5.151.1: 'All item variables declared in an item share the same namespace'); a response's and a context's identifier is a UniqueIdentifier (§5.115.1, §5.34.1; §7.43: 'unique within the scope of the instance'), though the XSD types the context's an IdentifierDType, an xs:NCName, so DocumentId key counts it among the IDs",
  },
  "Declaration not reserved": {
    rule: "declaration-reserved",
    source:
      "reading 72: https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: 'All variables must be declared except for the built-in session variables referred to below which are declared implicitly and must not be declared'; §2.2.2.2: numAttempts and duration 'must not appear in a response declaration'; §2.2.2.3: completionStatus 'must not appear in an outcome declaration') and https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, §5.115.1, §5.151.1: 'The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration'), each spelled exactly, with no alias, the identifier compared collapsed (references.ts BuiltInVariable, its session variables); the context variable QTI_CONTEXT is Reserved type's",
  },
  "Declaration overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O2 and the W5 amendment's C18: each O2 overlay (Declaration, ValueSet, Value, RecordField, OutcomeRange) is its element's row, keyed by its node: it copies its node's nodeRef tuple and takes its values from its element's attributes and Node's string value, a value set copies its declaration through declarationRef, and every value set and value has its row (Q5.08)",
  },
  "Dependency target": {
    rule: "idref-target",
    source:
      'IMS Content Packaging 1.2: a dependency\'s identifierref names a resource of its manifest, contained(on(Dependency, "package", "ref"), on(Resource, "package", "identifier")) (Q5.06)',
  },
  Document: {
    rule: "reachability",
    source: "the XDM document node as the Document row (plan §1.4, fin.md D7)",
  },
  "Document entry": {
    rule: "entry-kind",
    source: "IMS Content Packaging 1.2: a listed document is an entry of the package",
  },
  "Document lang": {
    rule: "document-lang",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.3, Language: 'There must be one value for each of the languages referred to by the language attributes on the associated assessmentItem, test or object bank and its 'bodyElements'', normative by its §1.2; ~/.cache/gr8des/qti-md-bind/index.txt:1509 and :388): each language an item's or a test's xml:lang states (XML 1.0 §2.12, the empty one stating none) is listed by every general category of each record of the resource whose href names the document (identity.ts documentLang, through metadata.ts LomObject); xml:lang compared by its collapsed xs:language value and the LOM language as written, both as tags without regard to case (RFC 5646 §2.1.1)",
  },
  "DocumentId key": {
    rule: "document-key",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): no id's [binding] has more than one member, an attribute's binding its element, an ID-typed element text's its parent (§3.15.5; reading 101; identity.ts IdBinding); reading 14; reading 74: a context declaration's identifier, a UniqueIdentifier (https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_ContextDeclaration.Attr_identifier, §5.34.1), is one of the document's IDs, though the XSD types it an IdentifierDType",
  },
  "E1 derived": {
    rule: "derived",
    source:
      "fin.md §17, E1: the fields closed relations determine, and the string value (folds.ts)",
  },
  "Entry family": {
    rule: "reachability",
    source:
      "plan §1.6: the package's entries in listing order, an ordered family under Package at entries, one entry per path; the record the model is rebuilt from",
  },
  "Equal tolerance": {
    rule: "P36",
    source:
      "reading 121: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Equal.Attr_tolerance (§5.46.2: 'If the tolerance mode is absolute or relative then the tolerance must be specified. The tolerance consists of two positive numbers, t0 and t1, that define the lower and upper bounds. If only one value is given it is used for both') and #DataModel_ToleranceList (§9.1.5: 'a space separated list of either strings (must not contain a space) or numbers'): a qti-equal whose tolerance-mode is absolute or relative writes tolerance, every tolerance holds one or two values, and each value in xs:double's lexical space is above 0, a string naming a variable read at run time (operators.ts Tolerance, toleranceRequired, Equal_tolerance)",
  },
  "Feedback outcome type": {
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'); the built-in completionStatus is 'a single identifier' (§2.2.2.3)",
  },
  "Feedback reference": {
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'), the built-in completionStatus among them (§2.2.2.3: 'a single identifier'); the outcome's base type and cardinality are Feedback outcome type's (references.ts ContentReference)",
  },
  "File exists": {
    rule: "file-exists",
    source:
      "imscp_infov1p2pd2.txt:409 and :411 (IMS Content Packaging 1.2, InterchangePackage (b): 'Any file described in the Manifest using a URI that resolves to a location within the InterchangePackage shall be included in the InterchangePackage'; (d): 'When a file contained in an InterchangePackage references another file using a URI that resolves to a location within the InterchangePackage, the referenced file shall be described in the InterchangePackage's Manifest'): a cp:file's href that resolves in the package names an entry, an external one left out (reading 35), and so does each reference a document resolves in the package (readings 102 and 103, package.ts ReferencePath)",
  },
  "File listed": {
    rule: "file-listed",
    source: "IMS Content Packaging 1.2 and QTI packaging: every file is described; reading 33",
  },
  "Foreign attribute class": {
    rule: "attribute-admission",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: an open attribute's class agrees with its stored namespace against its element's",
  },
  "Foreign element class": {
    rule: "unmodeled-vocabulary",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: a foreign element's class agrees with its stored namespace against its parent's; and Namespaces in XML 1.0 §5 (Namespace constraint: No Prefix Undeclaring) with §6.2, a name in no namespace is unprefixed, so a no-namespace element is written with no prefix (C4)",
  },
  "Foreign simple content": {
    rule: "child-set",
    source:
      "reading 60: https://www.w3.org/TR/xmlschema-1/#cvc-type (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Type), clause 3.1.2: an element a simple type governs holds no element child), over each foreign element whose xsi:type names a simple type (attributes.ts Governor, TypeText); its attributes are AL1's under the governor, the four xsi: names alone (clause 3.1.1), and its text TextDomain's under the type (clause 3.1.3)",
  },
  "Fragment context": {
    rule: "fragment-context",
    source:
      "reading 117: https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 (§2.12: 'the content of the fragment must satisfy the requirements of the specification in the context of the item in which it is being included'): an included fragment's content is one written element per node, judged under the union of the ancestries of the includes that place it and under one nearest interaction; a fragment two includes place inside different interactions, or one inside an interaction and one outside, would need two rows per node, so it is refused: a stated limit of the representation, not a law of the specification",
  },
  "Graphic gap match default hotspot": {
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_GraphicGapMatchInteraction_qti-associable-hotspot (§5.60.9: 'The default hotspot must not be defined')",
  },
  "Href form": {
    rule: "href-form",
    source:
      "reading 102 (overlays/package.ts Limit): every href is resolved before its row is written, its value read by its whitespace class, its path merged with the xml:base in scope or its document's path, its dot segments removed and each segment percent-decoded (RFC 3986 §2.1, §5.2 and §6.2.2.2); a path with a scheme, a leading /, a climb above the package root or an external base is external (reading 35), admitted and never resolved where a cp:file or a content reference holds it, and refused where a law needs the href to name an entry; an empty path names its own document (§4.4). What stays refused is a stated limit of the representation, not a law of the specification: a % that starts no percent-encoding, octets that spell no UTF-8, a segment that decodes to / or U+0000, a backslash, a tab, line feed or carriage return a preserving type keeps, a : in the first segment of a path with no scheme, and a srcset of more than one candidate or with a descriptor",
  },
  "Href listed": {
    rule: "href-listed",
    source:
      "imscp_infov1p2pd2.txt:770 (IMS Content Packaging 1.2, §6.6.2: 'A file reference declared in a Resource{ Href } shall have an associated declaration in a File object in the same Resource'): a resource href names the file one of its own files names, compared by resolved path in the package and as written outside it, its launch parameters aside (reading 102)",
  },
  "Idref target": {
    rule: "idref-target",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): an IDREF names an ID of its document, an attribute's tokens and an IDREF- or IDREFS-typed element text's alike (§3.15.5; reading 101); reading 14; reading 2 and https://www.w3.org/TR/MathML3/chapter4.html#contm.share (MathML 3 §4.2.7: a share's src names 'the id attribute of the root node of the expression tree' it stands for): a same-document fragment of an m:share's src, a # and the characters after it, names an ID of its document as an IDREF token does, and a src that is no fragment is reading 103's file reference, which is not read here (operator decision 321)",
  },
  "Include fragment identifier": {
    rule: "include-href",
    source:
      "reading 115: https://www.w3.org/TR/xinclude/#include_element (XInclude 1.0 Second Edition §3.1, href: 'Fragment identifiers must not be used; their appearance is a fatal error'): an xi:include's href carries no #, wherever it stands after the path",
  },
  "Include root": {
    rule: "include-root",
    source:
      "reading 114: https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 (§2.12: an include 'is treated as if it was actually an instance of the root element of the fragment referred to'; 'A fragment may appear anywhere in the model where one of the following abstract classes may appear') and Table 9.4.1 (Include's parent classes): an include under a parent whose model holds one stands for its fragment's root, which is one of its particle's choice-group alternatives, a kind whose position the parent's automaton follows and ends on as the include's",
  },
  "Include target": {
    rule: "include-target",
    source:
      "reading 115: https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 (§2.12: 'Fragments are packaged as separate resources'); https://www.w3.org/TR/xinclude/#include_element (XInclude 1.0 §3.1: 'If the href attribute is absent when parse=\"xml\", the xpointer attribute must be present', and reading 85 refuses xpointer): an include the information model reads names, by an href this representation resolves, a document its package lists",
  },
  "Inclusion cycle": {
    rule: "inclusion-cycle",
    source:
      "reading 85: https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 (§2.12: an include 'is treated as if it was actually an instance of the root element of the fragment referred to'), §7.5 (a section ref 'functions as a facade for the qti-assessment-section to which it refers') and §2.8.3.2 ('unbounded repetition is not supported'); https://www.w3.org/TR/xinclude/#loops (XInclude 1.0 §4.2.7: an inclusion loop is 'a fatal error'): no chain of qti-assessment-section-ref and xi:include hrefs, over the documents the manifest lists, returns to a document already on it",
  },
  "Item duration": {
    rule: "item-duration",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'The value of duration for items that are not time dependent must not be used in any item or test-level expression', info.txt:8468) (expressions.ts Item_duration over ItemTiming; the UP audit's A62)",
  },
  "Item ref target": {
    rule: "item-ref-target",
    source:
      "the UP audit's B2: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_AssessmentItemRef.Attr_href (§5.6.5: 'The URI used to refer to the item's file (e.g., elsewhere in the same content package)', info.txt:14764): an item ref's href names a document of the package, and that document's root is an item (tests.ts ItemRefTarget)",
  },
  "Key text bound": {
    rule: "key-text-bound",
    source:
      "src/qti/limits.ts: a text a key, a containment or a family's hidden columns hold takes its kind's one bound, the least every key of the kind leaves it under grizzle's representability rule, PostgreSQL's BTMaxItemSize (nbtree.h): a key text (keyText) at most keyTextBytes UTF-8 bytes, a namespace name (namespaceText) at most namespaceBytes, a local name at most localNameBytes, each what grizzle's keyTextBytes leaves beside its widest key's other fields; a stated limit of the representation, not a law of the specification",
  },
  "LOM learning resource type": {
    rule: "lom-learning-resource-type",
    source:
      "reading 122: https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.5.1, Learning Resource Type: 'the LOM-defined values self assessment and exam are forbidden', normative by its §1.2): a learningResourceType of the LOM vocabulary holds neither, its term the LOM vocabulary's where its source is LOMv1.0, empty, or not written, which the loose binding defaults to LOMv1.0 (imsmd_loose_v1p3p2.xsd:1288); a term of another source is another vocabulary's, which the loose binding does not enforce (§3.6), and is not refused; source and value compared collapsed (metadata.ts LomResourceType, LomResourceTypeSource)",
  },
  "Label tools": {
    rule: "label-tool",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BaseSequence.Attr_label (§5.16.5, and §5.15.5, §5.17.5 to §5.21.5 and §5.79.4: 'If an item uses labels then values for the associated toolName and toolVersion characteristics must also be provided'), of a body element's label in both versions; reading 128: https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html (QTI 3.0.1 §4.1.3, the item's label: 'If an item uses labels then values for the associated toolName and toolVersion attributes must also be provided'; ~/.cache/gr8des/qti301/info301.txt:11490) of a 3.0.1 item root's own label, where 3.0.0's §4.1.3 ('A human readable label that can be used to describe the Item', ~/.cache/gr8des/anyuri-specs/qti/info.txt:10162) states none; the version is the manifest's schemaversion (reading 67), and the sentence binds an item, not a stimulus or a test",
  },
  "Literal lexical": {
    rule: "attribute-lexical",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_BaseType (§8.13, BaseTypeEnum, each base type's value set): a qti-base-value's text is a lexical form of its base-type, the same language as Typed value's (expression-types.ts BaseTypePattern; readings 7, 34, 45 and 71)",
  },
  LomObjectIdentifier: {
    rule: "lom-identifier",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.1, Identifier: 'One of the values given for the identifier must have an entry that matches the identifier of the associated item, test or object bank', normative by its §1.2), over the general category's identifiers alone; info §4.1.1 and §4.4.1 ('MUST be the same'); reading 62 as UP's audit merges it (docs/research/up.md §2.2), the entry compared collapsed",
  },
  LomObjectTitle: {
    rule: "lom-title",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.2, Title: 'The title must have a value that matches the value of the title attribute of the associated item, test or object bank. The language used to interpret the title is taken from the language attribute of the associated item, test or object bank', normative by its §1.2); info §4.1.2 and §4.4.2; reading 62 as UP's audit merges it (docs/research/up.md §2.2). Titles compare in xs:normalizedString's value space and language tags without regard to case (RFC 5646 §2.1.1; metadata.ts)",
  },
  "Lookup table cardinality": {
    rule: "lookup-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_OutcomeDeclaration_lookupTable (§4.5.13: a lookup table maps 'a numeric source value to a single outcome value in the declared value set'): a qti-match-table's or qti-interpolation-table's outcome declaration is of single cardinality (mapping.ts Lookup_table_cardinality)",
  },
  "Lookup type": {
    rule: "P22",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_LookupOutcomeValue (§2.5.1.4: the expression 'must have single cardinality and an effective value type of integer, float or duration', looked up in the outcome's matchTable or interpolationTable; a match table's source values are integers) (expressions.ts Lookup_type; the old checker's P22)",
  },
  "Manifest id space": {
    rule: "manifest-id-space",
    source:
      "IMS Content Packaging 1.2: the manifest's and its resources' identifiers are one xs:ID space",
  },
  "Manifest overlay": {
    rule: "reachability",
    source:
      "plan §1.6 and the W5 amendment's C18: each manifest overlay (ManifestId, Resource, ResourceHref, File, Dependency) is its element's row, keyed by its node: it copies its node's nodeRef tuple, names a node of its kind and its package's Document row, takes its values from its element's attributes, and a file's and a dependency's resource is their node's parent; one manifest per package (Q5.06)",
  },
  "Map key": {
    rule: "map-key-unique",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88.4 and §7.21: 'The map is defined by a set of mapEntries, each of which maps a single value from the source set onto a single float'), so a mapping is a function of its source value: no two of its entries share a key, compared as values of its base type where the schema holds one (an integer's canonical form, a float of grizzle's double form as its double, mapping.ts MapKeyInteger and MapKeyFloat) and as written otherwise (readings 7, 34 and 45)",
  },
  MappableBaseType: {
    rule: "mapping-base-type",
    source:
      "reading 78: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88, the Mapping class: 'A special class used to create a mapping from a source set of any base-type (except file and duration) to a single float') and https://www.imsglobal.org/spec/qti/v3p0/info#ExpMapResponse (§2.11.1.5: 'This expression cannot be applied to variables of record cardinality') (expression.ts MappableBaseType)",
  },
  "Mapped response": {
    rule: "P27",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#ExprMapResponse (§2.11.3.29, MapResponse: 'the response variable must have been declared with an associated mapping'; §2.11.3.30, MapResponsePoint: an areaMapping, of base-type point) (expressions.ts Mapped_response; the old checker's P27)",
  },
  "Mapping overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O5 and the W5 amendment's C18: each O5 overlay (Mapping, MapKey, MapKeyInteger, MapKeyFloat, AreaMapping, MatchTable, InterpolationTable) is its element's row, keyed by its node: it copies its node's nodeRef tuple and its declaration's declarationRef tuple, names a node of its kind, takes its key from its element's map-key attribute, and a typed key is the row of exactly the map keys of its form (Q5.11)",
  },
  "Mastery range": {
    rule: "mastery-range",
    source:
      "reading 9: the Schematron's RULE SPECIFIC CLASS OUTCOMEDEC 1 (ASI 3.0.1 XSD, on qti-outcome-declaration: 'not(@mastery-value < @normal-minimum)', 'The mastery-value attribute value must not be less than the normal-minimum value'; 'not(@mastery-value > @normal-maximum)', 'The mastery-value attribute value must not be greater than the normal-maximum value'), read by its intent: each pair judged where both are written, as xs:double values (INF and -INF infinite), NaN ordered against nothing; a value outside grizzle's double lexical form (outer whitespace, over 15 significant digits, an exponent beyond 293) is not judged, a recorded limit",
  },
  "MathML align first": {
    rule: "ordering",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.malign.group (MathML 3 §3.5.5.2: 'the first complete element must be an maligngroup element' in a table cell whose alignment groups are checked, a complete element being one with no element children); a cell is judged when it holds a group that stands where §3.5.5.2 lets it (the align placement law), and a group outside a cell or under an maction child that is not selected is not judged (§3.5.5.9)",
  },
  "MathML align placement": {
    rule: "admission",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.malign.group (MathML 3 §3.5.5.2: an maligngroup in a table cell stands in the cell directly or inside an mrow or mstyle that changes no direction, mphantom, mfenced, the selected sub-expression of an maction, or semantics) and #presm.malign.mtable (§3.5.5.9); a group with no cell above it is ignored, only an maction's selected sub-expression is checked, and a change of direction is a dir other than the one the element inherits, so mrow dir='ltr' in a formula that reads left to right changes none (operator decision 321)",
  },
  "MathML arity": {
    rule: "math-arity",
    source:
      "reading 2 (expression.ts mathArities): https://www.w3.org/TR/MathML3/chapter4.html#contm.unary (MathML 3 §4.3.4.6: 'Unary operators take a single argument') and #contm.binary (§4.3.4.5: 'Binary operators take two arguments'), each operator's class from its syntax table in §4.4 (§4.1.5: the Class row 'indicate[s] how many arguments the operator represented by this element takes'); an apply with a qualifier or an interval beside its operator is not judged, and moment is left out, since §4.4.8.6's own example applies it to five arguments",
  },
  "MathML cn form": {
    rule: "attribute-lexical",
    source:
      "spec readings 2 and R6-hexdouble: https://www.w3.org/TR/MathML3/chapter4.html#contm.cn (MathML 3 §4.2.1: the content of a cn has the form its type implies, integer, real, double, hexdouble, e-notation, rational, complex-cartesian and complex-polar, split at m:sep; every other type is text), digits read in its base from 2 to 36; a part holding an element or an entity reference is not judged, and a base beyond the alphabet leaves the digits application specific (expression.ts cnForms and cnPatternOf)",
  },
  "MathML foreign element": {
    rule: "unmodeled-vocabulary",
    source:
      "MathML 3 RelaxNG mathml3-common.rnc: start = math (line 15) and anyElement = element (* - m:*) (line 61); MathML 3 §2.2, 'All other MathML content must be contained in a math element'; reading 2",
  },
  "MathML head qualifier": {
    rule: "admission",
    source:
      "spec reading R6-head-qualifiers (expression.ts mathHeadQualifiers) and MathML 3's §4.4 syntax tables: https://www.w3.org/TR/MathML3/chapter4.html#contm.root (§4.4.2.11), #contm.log (§4.4.7.7) and #contm.moment (§4.4.8.6) list degree, logbase and momentabout beside their operators; an apply whose first child is no built-in operator is not judged",
  },
  "MathML maction selection": {
    rule: "union-count",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter3.html#presm.maction (MathML 3 §3.7.1.1: 'If the value specified is out of range, it is an error' and 'If no selected sub-expression exists, it is a MathML error'): an maction has at least one element child and its selection, 1 when absent, is at most their number",
  },
  "MathML share cycle": {
    rule: "document-key",
    source:
      "reading 2: https://www.w3.org/TR/MathML3/chapter4.html#contm.share (MathML 3 §4.2.7, c4#contm.acyclicity: 'An element may not dominate itself'): an element dominates its children and, where it is an m:share whose src is a same-document fragment, the element that fragment names, so an m:share on a cycle of those edges is refused",
  },
  "Max strings required": {
    rule: "max-strings-required",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ExtendedTextInteraction.Attr_max-strings (§5.48.6: 'The max-strings characteristic is required when the interaction is bound to a response variable that is a container'): an extended text interaction bound to a multiple or ordered response writes max-strings, select(BoundVariable, response-identifier, extended text, multiple or ordered)(node, kind) contained in select(CountBound, maxWritten)(node, kind) (interactions.ts, Q5.09)",
  },
  "Media source src": {
    rule: "source-src",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_src (§5.135.1: 'The value must be a valid non-empty URL potentially surrounded by spaces. This characteristic must be present'), read in a media element as the HTML Standard it restates splits it (https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element: where 'The source element's parent is a media element', 'This attribute must be present'; where it is a picture element, 'The src attribute must not be present'): a source whose parent is an audio or a video carries src (html.ts Media_source_src)",
  },
  "N1 one document node": {
    rule: "reachability",
    source: "XML 1.0 §2.1, one document entity; fin.md §12, entry 8",
  },
  "N1 sentinel": {
    rule: "reachability",
    source:
      "fin.md §12, entry 8: the document node is its own parent, document and nearest, at slot 0",
  },
  "N2 key": {
    rule: "reachability",
    source: "fin.md §5.2, the ordered family's key (parent, at)",
  },
  "N2 mirrors": {
    rule: "reachability",
    source: "fin.md §5.2, the ordered family: slots 0 to children − 1, each held",
  },
  "N2 tree": {
    rule: "reachability",
    source:
      'trees.md §2 to §4, T0 to T6: tree(on(Node, "parent", "at"), fin(Node, "children"), { root: "document" }), its key (parent, at), UNIQUE (document, start) and its interval checks (plan §1.3 N2, N9 and N10)',
  },
  "N4 kinds": {
    rule: "admission",
    source: "fin.md §17, the NodeKind and SchemaVersion rosters",
  },
  "N5 Follow": {
    rule: "ordering",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Follow; the operator's ruling of 2026-11-05)",
  },
  "N5 admitted": {
    rule: "admission",
    source: "the XSDs' content models as Admission (content.ts); reading 6 for wildcard content",
  },
  "N5 first slot": {
    rule: "ordering",
    source: "fin.md §4.3, each fold's identity at slot 0",
  },
  "N5 fold": {
    rule: "ordering",
    source: "fin.md §4.5a, the predecessor copy",
  },
  "N6 ancestry": {
    rule: "ancestry-ban",
    source:
      "fin.md §13 P3 and §16: the information model's nesting rules as Banned and Needs (ancestry.ts, facets.ts); readings 25 and 38",
  },
  "N7 Counted": {
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.9 occurrence bounds of 2 to n, which a position automaton relaxes (content.ts Counted), and the loose LOM binding's Schematron caps: each element the binding bounds to one inside an unbounded choice stands at most once in its family (lom/imsmd_loose_v1p3p2.xsd:18-21 and 85-92, its 94 asserts at 93-911; reading 130)",
  },
  "N7 Last": {
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Last)",
  },
  "N7 barred by": {
    rule: "child-set",
    source:
      "the HTML Standard, colgroup: a span attribute bars col children (children.ts ChildBarredBy)",
  },
  "N7 empty family": {
    rule: "union-count",
    source: "fin.md §5.2, an empty family's end values are each fold's identity",
  },
  "N7 last slot": {
    rule: "union-count",
    source: "fin.md §5.2, the last-slot copy",
  },
  "N8 nearest": {
    rule: "owner-copy",
    source: "plan-qti-pie N8, the nearest interaction (fin.md §15, rule 3)",
  },
  "Namespace family": {
    rule: "reachability",
    source: "Namespaces in XML 1.0 §3, declarations in source order (fin.md §5.2)",
  },
  "Namespace name": {
    rule: "namespace-name",
    source:
      "reading 131: https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 (Third Edition) §3: 'The attribute's normalized value MUST be either a URI reference — the namespace name identifying the namespace — or an empty string'; §2.1: 'An XML namespace is identified by a URI reference [RFC3986]'; a relative reference is deprecated, §2.2, not refused; §8 lets a processor leave it unchecked, which leaves the document's constraint standing): a namespace declaration's normalized value is RFC 3986's URI-reference (https://www.rfc-editor.org/rfc/rfc3986#appendix-A), the empty one a relative-ref of an empty path (chardata.ts NamespaceUri)",
  },
  "Node key": {
    rule: "reachability",
    source: "trees.md §1, the tree relation's key, id",
  },
  "One base": {
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 (§2.11.3: Multiple, Ordered and Repeat take sub-expressions 'of the same base-type'; Match, Member, Delete and Contains compare two values 'of the same base-type', and Match and Contains 'of the same cardinality'), a type no declaration says aside (reading 4) (expressions.ts One_base; the old checker's P23)",
  },
  OpenElementName: {
    rule: "unmodeled-vocabulary",
    source: "fin.md D2, a foreign element keeps its expanded name; reading 6",
  },
  "OpenElementName canonical": {
    rule: "unmodeled-vocabulary",
    source:
      "https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clauses 1.1.1.2 and 1.1.1.3.2: an element is assessed against the declaration its context determines or its name resolves to, a particle's own or a top-level one a lax or strict wildcard finds, §3.10.4 clause 2), so an element whose expanded name its parent admits there is that declaration's kind and never a foreign element (shred.ts childReadingOf; install.ts KindByNameUnder, the names each (version, parent) admits, C8)",
  },
  "Operand fit": {
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 (§2.11.3, each operator's sub-expression base types and cardinalities; Member's and Delete's first single and second a container), a type no declaration says aside (reading 4) (expression.ts expressionTypings, OperandBase, LeadCardinality and TailCardinality; the old checker's P23)",
  },
  "Outcome only": {
    rule: "P25",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#ExprTestNumberCorrect (§2.11.4, the test operators NumberCorrect, NumberIncorrect, NumberPresented, NumberResponded, NumberSelected, OutcomeMaximum, OutcomeMinimum and TestVariables: 'can only be used in outcomes processing') (expressions.ts Outcome_only, its language Processing's; the old checker's P25)",
  },
  "Package key": {
    rule: "reachability",
    source:
      "plan §1.6: one Package row per imported package, keyed by the id the importer mints for it",
  },
  "Picture source srcset": {
    rule: "source-srcset",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_srcset (§5.135.3: \"This attribute is required when 'source' is used in 'picture'\"); https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element (where 'The source element's parent is a picture element', 'The srcset attribute must be present'): a source whose parent is a picture carries srcset (html.ts Picture_source_srcset)",
  },
  "Prefixed reference": {
    rule: "prefixed-ref",
    source:
      "readings 48 and 88: https://www.imsglobal.org/spec/qti/v3p0/info#ExprVariable (§2.11.1.2: 'values taken from an individual item session can be looked up by prefixing the name of the item variable with the identifier assigned to the item in the qti-assessment-item-ref, separated by a period character'; under with-replacement 'a number that denotes the instance's place in the sequence of the item's instantiation is inserted between the item variable identifier and the item variable'), §2.2.2 ('The values of these durations can be refered to during outcome-processing by using the variable name duration prefixed with the identifier of the part or section followed by the period character', info.txt:9214), read over the assembled test (readings 4, 5 and 86): a test-level reference is accepted when exactly one of its readings, unsplit, split at a dot, or numbered at two dots, names a scope of the test and a variable of that scope, a numbered one only under a selection with replacement and only from 1, and none through a name two placements give (expressions.ts Reading: the key and the containment over its resolving readings, M3, and Prefixed_reference)",
  },
  "Printed variable reference": {
    rule: "printed-variable-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_PrintedVariable.Attr_identifier (§7.30.6: 'The outcome variable or template variable must have been defined. The values of response variables cannot be printed directly'), the built-in completionStatus among them (§2.2.2.3) (references.ts ContentReference)",
  },
  "Quotation punctuation": {
    rule: "q-punctuation",
    source:
      "reading 127: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Q (§5.111, Q: 'Quotation punctuation (such as quotation marks) that is quoting the contents of the tag must not appear immediately before, after, or inside q tags; they will be inserted into the rendering by the user agent'; ~/.cache/gr8des/anyuri-specs/qti/info.txt:38400, and the 3.0.1 model's ~/.cache/gr8des/qti301/info301.txt:55430): a q is refused where the last character of its sibling before it, the first of its sibling after it, or the first or last character of its own content is a quotation mark, one of \" « » ‘ ‚ ‛ “ ” „ ‟ ‹ › (main's set, which leaves out the apostrophes ' and ’), each read off a text, whitespace or entity reference row, so an element, a comment or an instruction beside the q holds no punctuation (quotation.ts Quotation_punctuation)",
  },
  "Record field key": {
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Cardinality (§8.16, CardinalityEnum, record: 'a special container that contains a set of independent values each identified by its own identifier and having its own base-type'): no two fields of one record value share a field-identifier, compared collapsed",
  },
  RecordBindingFit: {
    rule: "record-binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4.2.2: 'must be bound to a response variable with either single or record cardinality only'; §2.4.2.3 likewise) (expression.ts RecordBindingFit)",
  },
  "Reference overlay": {
    rule: "reachability",
    source:
      "IMS Content Packaging 1.2 (b) and (d), and readings 102 and 103: each document's references (Reference) are an attribute's copy keyed by its node and name, and each the importer resolves in the package has its ReferencePath, in its document's package",
  },
  "Reference type": {
    rule: "P24",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_IntegerOrVariableRef (§8.25, §8.24 and §8.42: an integerOrVariableRef, floatOrVariableRef or stringOrVariableRef names a template or outcome variable of that base type, single) (expression.ts ReferenceBase; the old checker's P24)",
  },
  "Reserved type": {
    rule: "reserved-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Outcome (§2.2.2.3, Outcomes Variable: 'SCORE MUST be a float', 'MAXSCORE MUST be a float', 'PASSED MUST be a boolean'), of an outcome declaration of that identifier; https://www.imsglobal.org/spec/qti/v3p0/info#IV_Context (§2.2.2.1: 'There is one built-in context variable: 'QTI_CONTEXT', which has record cardinality'), which the implementation guide declares explicitly (§3.7.11, 'an explicit (though unnecessary) qti-context-declaration of QTI_CONTEXT'): a declaration of QTI_CONTEXT is a record context declaration, since one of another kind or cardinality would make one identifier name two variables (reading 74)",
  },
  ResourceTypeOf: {
    rule: "resource-type",
    source:
      "QTI 3 packaging: the resource types each schema version admits (package.ts); reading 33",
  },
  RootOfType: {
    rule: "root-type-reverse",
    source: "QTI 3 packaging: the document root of each resource type (package.ts)",
  },
  "Rounding figures": {
    rule: "P10",
    source:
      "reading 119: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_EqualRounded.Attr_figures (§5.47.2: 'If roundingMode= 'significantFigures', the value of figures must be a non-zero positive integer. If roundingMode='decimalPlaces', the value of figures must be an integer greater than or equal to zero') and #DataCharacteristic_RoundTo.Attr_figures (§5.119.2, the same of rounding-mode), under the EqualRounded default significantFigures (§5.47.1): a figures whose collapsed form is an integer is at least 1 under significantFigures and at least 0 under decimalPlaces, a variable's name read at run time (operators.ts Rounding, Rounding_figures)",
  },
  "SSML lexicon reference": {
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.5.2 (SSML 1.1 §3.1.5.2: 'The ref attribute specifies a name that references a lexicon document as assigned by the xml:id attribute of the lexicon element') and #S3.1.5.1 (§3.1.5.1: 'The scope of this name is the current SSML document'), the document being the lookup's nearest speak (identity.ts ssmlLexiconReference, through SsmlScope)",
  },
  "SSML trim mark": {
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.1.1 (SSML 1.1 §3.1.1.1: 'Only markers defined once in the document, i.e. that are unique, are permitted as the value of either startmark or endmark'; 'It is an error if the value given for either startmark or endmark is not a valid mark in the document'), the document being the speak, each name an xs:token (§3.3.2) compared by its collapsed value (identity.ts ssmlTrimMark)",
  },
  "Section identifier target": {
    rule: "section-identifier-target",
    source:
      "readings 5 and 86: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Number.Attr_section-identifier (§7.27.1, and §7.28.1, §7.39.1: 'If specified, only variables from items in the qti-assessment-section with matching identifier are matched', info.txt:69115), resolved over each test that places the document: a section-identifier names exactly one section or section ref of the assembled test (expressions.ts Reading, form name; the UP audit's A61)",
  },
  "Section parts": {
    rule: "section-empty",
    source:
      "reading 26: https://www.imsglobal.org/spec/qti/v3p0/info#Root_AssessmentSection (§4.2: a section holds 'at least one other Section or Item'): a section holds at least one part, an item ref, section, section ref or include standing for one (references.ts SectionPart; tests.ts Section_parts)",
  },
  "Selection bound": {
    rule: "selection-bounds",
    source:
      "reading 79: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select (§5.129.1: 'The number of children to select may exceed the number of child elements defined only if with-replacement is true'; 'Sub-sections always count as 1') (references.ts SectionPart); reading 26",
  },
  "Selection required": {
    rule: "selection-required",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_required (§4.2.2, and §5.6.2 of the item ref: 'If a child element is required it must appear (at least once) in the selection. It is an error if a section contains a selection rule that selects fewer child elements than the number of required elements it contains'): a section's parts whose required is true are at most its selection's select (tests.ts Selection_required)",
  },
  "Self dependency": {
    rule: "self-dependency",
    source:
      "imscp_infov1p2pd2.txt:1105 (IMS Content Packaging 1.2, §6.11.5, the IdentifierRef class, rule B ii: an IdentifierRef child of a Dependency object 'Shall not reference the Dependency's parent Resource'): a cp:dependency's identifierref is not its own resource's identifier, compared as written (package.ts Self_dependency)",
  },
  "Set type": {
    rule: "P20",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_SetOutcomeValue (§2.5.1.3: 'The expression must have an effective value type which is compatible with the variable's base-type and cardinality'), and the template, default and correct setters (§2.8.1) (expressions.ts Set_type; the old checker's P20)",
  },
  "Slider bounds": {
    rule: "slider-bounds",
    source:
      "reading 9, the Schematron's rule 14Ba (RULE_SET_INTERACTION_14B, ASI 3.0.1 XSD, on qti-slider-interaction: 'not(@upper-bound < @lower-bound)', 'The upper-bound attribute value must not be less than the lower-bound value'), its values read as xs:double; the information model (§5.134.1-2) states no order",
  },
  "Stimulus ref key": {
    rule: "stimulus-ref-key",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_AssessmentStimulusRef.Attr_identifier (§7.6.1: 'The unique identifier for the stimulus reference'; §7.6.2: 'each reference must have a unique identifier'), compared collapsed: no two stimulus refs of one item share an identifier (tests.ts StimulusRef)",
  },
  "Stimulus ref target": {
    rule: "stimulus-ref-target",
    source:
      "info.txt:67012 and :67066 (https://www.imsglobal.org/spec/qti/v3p0/info#Root_AssessmentStimulusRef, §7.6: the stimulus ref 'enables reference to a 'qti-assessment-stimulus' instance', and its href is 'The uri used to refer to the stimulus file'): a stimulus ref's href that resolves in the package names a listed document whose root is a qti-assessment-stimulus; an external href is not resolved (reading 35's reading of an absolute URI) (package.ts ReferencePath, the UP audit's B5)",
  },
  "Strictly held": {
    rule: "unmodeled-vocabulary",
    source:
      "reading 81: https://www.w3.org/TR/xmlschema-1/#cvc-wildcard (XML Schema 1.0 Part 1 §3.10.4, Item Valid (Wildcard), clause 2: a strict wildcard's element has the context-determined declaration mustFind), with §3.3.4 clause 1.2 and §3.3.5 [validity] clause 1.1.3: an element only the strict wildcards of its parent's model hold (install.ts StrictlyHeld) stands only under an xsi:type naming a type of its document's schema set or a built-in, so its governing type is not none (C44; shred: strict-undeclared), but for reading 6's root whose declaration the wildcard finds (§3.10.4 clause 2, §3.3.4 clause 1.1.1.3.2), kept foreign and unrefused (install.ts HeldRootsUnder, C13)",
  },
  "Structure identifier": {
    rule: "structure-identifier",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1: 'The identifier of the section or item reference must be unique within the test and must not be the identifier of any testPart') and §5.159.1 ('The identifier of the test part must be unique within the test and must not be the identifier of any qti-assessment-section or qti-assessment-item-ref'), compared collapsed: no two test parts, sections, section refs or item refs of one document share an identifier, whatever their roles (tests.ts Named)",
  },
  "T1 document order": {
    rule: "reachability",
    source: "trees.md §2, T1",
  },
  "T2 root": {
    rule: "reachability",
    source: "trees.md §2, T2",
  },
  "T3 first child": {
    rule: "reachability",
    source: "trees.md §2, T3, with the merged parent copy (trees.md §6)",
  },
  "T4 next sibling": {
    rule: "reachability",
    source: "trees.md §2, T4",
  },
  "T5 last child": {
    rule: "reachability",
    source: "trees.md §2, T5",
  },
  "T6 nonempty and leaf": {
    rule: "reachability",
    source: "trees.md §2, T6",
  },
  "Table headers": {
    rule: "table-headers",
    source:
      "reading 126: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TDH.Attr_headers (§5.140.1: \"an unordered set of unique space-separated tokens that are case-sensitive, each of which must have the value of an ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag\"); https://html.spec.whatwg.org/multipage/tables.html#attr-tdth-headers: a cell's headers tokens are unique, and each is the id of a th whose nearest table is the cell's, a cell no table holds taking part in none (html.ts TableScope, TableHeader, tableHeaders)",
  },
  "Template default target": {
    rule: "template-default-target",
    source:
      "the UP audit's A37: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateDefault.Attr_template-identifier (§5.152.1: 'The identifier of the template variable affected'; §5.152: 'The default value of a template variable in an item can be overridden based on the test context'): a template default names a template declaration of the item its item ref names, compared collapsed (expressions.ts TemplateDefault, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no template of it (reading 110)",
  },
  "Template default type": {
    rule: "P20",
    source:
      "the UP audit's A38, the old checker's P20 for a setter: https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateDefault (§5.152: the template variable's default 'is obtained by evaluating an expression defined within the reference to the item'), so the expression's value is a value of the template variable, and https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_SetOutcomeValue (§2.5.1.3: 'The expression must have an effective value type which is compatible with the variable's base-type and cardinality'): a template default's expression fits its template variable's type, a type no declaration says aside (reading 4) (expressions.ts Template_default_type)",
  },
  "Template reads": {
    rule: "P26",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#TemplateProcessing (§2.8: template processing sets template variables and default and correct values, and reads no response or outcome variable; QTI_CONTEXT is a context variable) (expressions.ts Template_reads; the old checker's P26)",
  },
  "Template reference": {
    rule: "template-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateBlock.Attr_template-identifier (§5.145.1, §5.155.1; §2.7.2: 'A references must match the identifier in a corresponding template declaration') (references.ts ContentReference)",
  },
  "Test name key": {
    rule: "test-name-key",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1) and §5.159.1, read over the assembled test (reading 5): the test document and every section document its section refs and includes place; and §7.5.3 ('A test may refer to the same section multiple times within a test'), so a section document placed twice is one document and names nothing twice: no two written elements of one test share an identifier (tests.ts InstanceName, AssembledName)",
  },
  "Test overlay": {
    rule: "reachability",
    source:
      "plan §1.7 O7 and the W5 amendment's C15, C18: each O7 overlay (TestDocument, TestToken, TestFlag, Named, Section, SectionMember, SectionSelection, SectionOrdering, Site, BranchRule) is its element's row, keyed by its node (a token or flag by node and name): it copies its node's nodeRef tuple and its attributes' values, collapsed, and exists exactly where its element does (Q5.13)",
  },
  TextDomain: {
    rule: "text-copy",
    source:
      "XML Schema Part 2, each simple-content kind's type compiled with its whiteSpace (domains.ts); reading 7; and https://www.w3.org/TR/xmlschema-2/#NOTATION (§3.2.19: 'The ·value space· of NOTATION is the set of QNames of notations declared in the current schema'), which no pinned XSD declares, so a text read in xs:NOTATION's empty domain is refused (reading 60, C47: attributes.ts emptyDomains)",
  },
  "Track srclang": {
    rule: "track-srclang",
    source:
      'reading 125: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Track.Attr_srclang (§5.163.3: "This attribute must be present if the tag\'s kind attribute is in the subtitles state"); https://html.spec.whatwg.org/multipage/media.html#the-track-element (kind: "The attribute\'s missing value default is the subtitles state"): a track that writes no kind, or writes kind as subtitles, carries srclang (html.ts Track_srclang, subtitleTrackSrclang)',
  },
  "Typed attribute value": {
    rule: "attribute-lexical",
    source:
      "readings 7 and 8, and https://www.imsglobal.org/spec/qti/v3p0/info#Data_BaseType (§8.13, BaseTypeEnum, each base type's value set): a qti-map-entry's map-key is a value of its mapping's base type (§7.21.1, 'The source value'), and a lookup table entry's target-value and a table's default-value are values of its outcome's base type (§5.90.1, §5.78.1, §7.23.2, §7.18.3); each is written as its base type's lexical form with no whitespace around it unless the base type is string (mapping.ts Typed_attribute_value over expression-types.ts BaseTypePattern)",
  },
  "Typed value": {
    rule: "typed-copy",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Value (§7.46, Value: 'The base-type is defined by the 'base-type' attribute of the declaration except in the case of variables with record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_BaseType (§8.13, BaseTypeEnum, each base type's value set): a qti-value's text is a lexical form of its base type, outer whitespace formatting but for string (reading 7): boolean true or false (reading 34), integer xs:integer unbounded (reading 45), float and duration xs:double (§8.13: durations 'are represented using the 'xsd:double' datatype'), identifier IdentifierDType, uri xs:anyURI (reading 71), point two integers, pair and directedPair two identifiers; string and file any text",
  },
  "Usage typed value": {
    rule: "typed-copy",
    source:
      "reading 105: https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html (QTI 3.0 Usage Data binding §2.6.5, Value: 'A class that can represent a single value of any baseType'; §2.7.1, BaseTypeEnum) and https://www.imsglobal.org/spec/qti/v3p0/info#Data_BaseType (§8.13, BaseTypeEnum, each base type's value set): a ud:value that writes baseType holds a lexical form of that base type, read as a qti-value's text is (readings 7, 34, 45 and 71), and one that writes none is xs:normalizedString text (metadata.ts UsageValue over expression-types.ts BaseTypePattern)",
  },
  "Value cardinality": {
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Cardinality (§8.16, CardinalityEnum: single 'a single value'; record 'a set of independent values each identified by its own identifier and having its own base-type') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_Value (§7.46.1, §7.46.2: field-identifier and base-type are 'only used for' a value that forms part of a record): a single variable's default or correct value holds one qti-value, and a value is a record's field, with its field-identifier and base-type, exactly when its variable is a record",
  },
  "Variable declared": {
    rule: "P8",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: 'All variables must be declared except for the built-in session variables'; §2.11.1.2, a variable expression names 'an item variable that has been declared … or is one of the built-in variables') (references.ts); readings 4, 29 and 48",
  },
  "Variable kind": {
    rule: "variable-kind",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info, each processing element's definition of the variable it reads or sets: §7.10.1 Correct ('The identifier of the associated response variable'), §7.22.1 MapResponse ('the associated Response variable'), §6.9.46 MapResponsePoint ('looks up the value of a response variable'), §5.87.1 and §6.32.1 LookupOutcomeValue ('the outcome variable to be set'), §6.32.3 and §6.39.4 SetOutcomeValue ('sets the value of an outcome variable'), §6.50.1 SetTemplateValue ('sets the value of a template variable'), §6.50.4 SetDefaultValue ('The response variable or outcome variable to have its default value set'), §6.50.5 SetCorrectResponse ('The response variable to have its correct value set'), and §7.47.1 Variable and §7.12.1 Default, any item variable (§2.2.2: 'context, response, outcome or template variables'): a reference by identifier names a declaration, or a built-in standing as one (BuiltInVariable), of a kind its element reads or sets; and a setter (§5.130.1 SetValue: 'The identifier of the variable to be set') sets a variable of its own document, which only an unsplit reading names, since an item's variables reach a test only to be looked up (§2.11.1.2: 'values taken from an individual item session can be looked up by prefixing'), reading 112 (expression-types.ts ReferenceDeclaration and setterKinds, over VariableRef and a test's Reading)",
  },
  "Variable mapping source": {
    rule: "variable-mapping-source",
    source:
      "the UP audit's A34: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_VariableMapping.Attr_source-identifier (§7.48.1: 'The identifier of the outcome variable to identify the name of the source identifier during outcome processing variable mapping', info.txt:71656): a mapping's source names an outcome declaration of the item its item ref names, compared collapsed (expressions.ts MappingSource, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no outcome of it (reading 110)",
  },
  "Variable mapping target": {
    rule: "variable-mapping-target",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_VariableMapping (§7.48: 'Variable mappings allow outcome variables declared with the name source-identifier in the corresponding item to be treated as if they were declared with the name target-identifier during outcome processing') with §4.5.1 ('All item variables declared in an item share the same namespace'; 'The identifiers of the built-in session variables are reserved') and reading 74: no two mappings of one item ref name one target, no target names a built-in session variable, and no target names another variable its item declares (reading 97), compared collapsed (tests.ts VariableMapping; expressions.ts MappingSource, its declared half)",
  },
  "Variable reference copy": {
    rule: "varref-copy",
    source:
      "plan §1.7 O3, the varref-copy rule (Q5.09): every printed variable base or index that names a variable has its VarRef row, which resolves it; the XSD's union of xs:integer and VariableStringDType on those attributes decides what names a variable",
  },
  "Weighted base": {
    rule: "P29",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#ExprTestVariables (§2.11.4.8, TestVariables: with a weight-identifier the result is a float, so a base-type, where written, is float) (expressions.ts Weighted_base; the old checker's P29)",
  },
  "XML production": {
    rule: "well-formedness",
    source:
      "XML 1.0 §2.2 Char, §2.5 Comment, §2.6 PI, §2.8 doctypedecl and VersionNum, §4.3.3 EncName, and Namespaces in XML 1.0 §3 NCName: a stored text outside its production is no well-formed XML, which crust's reader refuses before any row exists, so only an importer defect reaches the law",
  },
  "XsiType available": {
    rule: "xsi-type",
    source:
      "readings 60 and 81: https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clause 1.2: an element no declaration assesses is assessed against the type its xsi:type resolves to in the schema its document is assessed against), so a foreign element's governing type is none, one of XML Schema's own, or a type of a schema set its parent's namespace stands in (open.ts typeAvailable; install.ts TypeAvailable, C15 and C36); a parent in no vocabulary's namespace stands in documents of every set, and the document's own set is reading 81's recorded limit",
  },
  "XsiType derived": {
    rule: "xsi-type",
    source:
      "reading 47: https://www.w3.org/TR/xmlschema-1/#cvc-elt (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Element), clause 4.3: the local type definition 'must be validly derived from the {type definition}', §3.4.6 and §3.14.6), over the type that governs each element of a vocabulary kind (Node.governs: its xsi:type's, else its declared type; xsi.ts XsiType). Clauses 4.1 and 4.2, a value that is no QName in scope or names no type, are the codec's (shred: type-unresolved, type-unknown)",
  },
  "comment arm": {
    rule: "text-copy",
    source: "the XDM comment nodes as rows (plan §1.4)",
  },
  "default hotspot last slot": {
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_HotspotInteraction_qti-hotspot-choice (§5.68.6, and the HotspotChoice class description, §5.67: 'The default hotspot, if defined, must appear last'), of qti-hotspot-choice only, since the AssociableHotspot class (§5.7) and the graphic associate interaction's hotspots (§5.59.4) state no such rule; last among its parent's element children, so whitespace, comments and instructions after it do not count (children.ts LastWhere, ruling D3)",
  },
  "doctype arm": {
    rule: "text-copy",
    source: "the XDM doctype as a row (plan §1.4)",
  },
  "entityRef arm": {
    rule: "text-copy",
    source: "the XDM entity references as rows (plan §1.4)",
  },
  "pi arm": {
    rule: "text-copy",
    source: "the XDM processing instructions as rows (plan §1.4)",
  },
  "text arm": {
    rule: "text-copy",
    source: "the XDM text nodes as rows (plan §1.4)",
  },
  "value domain": {
    rule: "attribute-lexical",
    source:
      "XML Schema Part 2, each attribute's simple type compiled with its whiteSpace and residual facets (domains.ts); readings 7, 45, 46, 56 and 71; and the readings that hold a type to its stricter source (attributes.ts specReadings): 2 (MathML's number without a plus, and cn's base a positive integer), 9 (h1's role heading, tab or presentation, the Schematron's RULE ARIA ROLE 1b), 120 (qti-index's n at least 1), 123 (bdo's dir without auto), 124 and 125 (a media URL non-empty), 129 (xml:lang, lang and srclang BCP 47 language tags), 132 (a printed variable's format a printf format string of at most one conversion) and 135 (a MIME type RFC 2045's two tokens and a slash)",
  },
  "ws arm": {
    rule: "text-copy",
    source: "the XDM whitespace nodes as rows (plan §1.4)",
  },
} as const satisfies Readonly<Record<string, LawEntry>>;

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
 * schema states differ by a selection alone, which the census in `refusal.test.ts` holds. A family
 * and a tree are their slots, since one count counts one family, and a fold is its family's slots,
 * its monoid and its end, since an accumulated end is filled by one statement.
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
      key: ({ side }) => `key ${sideText(side)}`,
      pattern: ({ flags, source }) => `pattern /${source}/${flags}`,
      primaryKey: ({ fields, relation }) => `primary key ${relation}(${fields.join(", ")})`,
      tree: ({ root, slots }) => `tree ${slots.owner}.${slots.count} by ${root}`,
    }),
  );

/**
 * The prefix that marks a `pred` term among a side's terms as {@link sideOf} takes them.
 */
const predPrefix = "pred:";

/**
 * Read one term as {@link sideOf} takes it: `pred:field` is `pred(field)`, any other text a field.
 *
 * @param term - The term's text.
 * @returns The term.
 */
const termOf = (term: string): Term =>
  term.startsWith(predPrefix)
    ? { field: term.slice(predPrefix.length), kind: "pred" }
    : { field: term, kind: "field" };

/**
 * Build a side over every fact of a relation, as a law states it.
 *
 * @param relation - The relation.
 * @param terms - Its terms in the order the law pairs them: a field's name, or `pred:field`.
 * @returns The side.
 */
const sideOf = (relation: string, ...terms: readonly [string, ...string[]]): LawSide => ({
  relation,
  selection: { conjuncts: [] },
  terms: pipe(terms, Arr.map(termOf)),
});

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
 * Build the pattern law of each text type, as its domain's CHECK reports it, once per language:
 * grizzle reports one law for every spelling of the same pattern, so two types of one source are
 * one law.
 *
 * @param types - Each type, with the law it states.
 * @returns The laws, the first type's name kept for a source two types share.
 */
const patternLaws = (
  types: readonly (readonly [TextType, LawName])[],
): readonly (readonly [Law, LawName])[] =>
  Arr.dedupeWith(
    types.map(
      ([{ pattern }, name]) =>
        [{ flags: pattern.flags, kind: "pattern", source: pattern.source }, name] as const,
    ),
    ([a], [b]) => lawIdentity(a) === lawIdentity(b),
  );

/**
 * The tree's slots, `fin(Node, "children")`.
 */
const children = { count: "children", owner: "Node" } as const;

/**
 * The names of the primary keys of `tests.ts`'s relations that are no overlay's: the assembled
 * test's instances, its names and its branch resolutions (Q5.13).
 */
const testKeyNames: ReadonlyMap<string, LawName> = new Map<string, LawName>([
  ["AssembledName", "Test name key"],
  ["BranchResolution", "Branch target"],
  ["Instance", "Inclusion cycle"],
  ["InstanceName", "Test name key"],
  ["ItemRefTarget", "Item ref target"],
]);

/**
 * The laws written out row by row, each as its outcome names it, with its name in
 * {@link lawTable}: the tree, the families, the folds, the keys and the containments of each
 * `src/qti/` module, in the module order of the plan's §C, after the text types' patterns, each
 * read from the type its module exports, so a bound that moves moves its row.
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
 *   - An unbounded XML production (`Char*`, a comment, an instruction, a doctype, an encoding name, a
 *     version number, an NCName) is "XML production", which crust refuses before any row exists;
 *   - A namespace declaration's value is "Namespace name": an RFC 3986 URI reference (reading 131),
 *     which crust does not check, so the domain is the law;
 *   - The whitespace around an IDREF token and an entry's base64 bytes are the host's own split and
 *     encoding, "E1 derived".
 * - **Node** (`node.ts`): the tree; the parent copy on its owner axis, which the oracle checks as
 *   T3's merged copy; the predecessor copy and the last slot (N5, N7); `Follow` and `Last`; the
 *   four folds, the element count read by the default hotspot, the counted and barred positions'
 *   counts and the string value (E1); the capped positions' key (N7, reading 130); `XsiType`.
 * - **Character data** (`chardata.ts`): each arm and `Document` both ways, the root element's kind,
 *   the namespace family and its key, and the foreign names.
 * - **Attributes** (`attributes.ts`): the four families, their owner copies (AL1), AL2's fold, the
 *   open names' key and namespace, and the IDREF tokens' text, a derived value (E1).
 * - **Package** (`package.ts`): the record and P1 to P4, as Q5.06 states them.
 * - **Identity** (`identity.ts`) and **declarations** (`declarations.ts`), as Q5.07 and Q5.08 state
 *   them: each overlay's row and its copies, its families and keys, and its laws' containments.
 * - **The other overlays**: the keys, families and containments the W5 briefs state exactly.
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
    [Chars, "XML production"],
    [Lexical, "XML production"],
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
  [
    {
      kind: "tree",
      member: sideOf("Node", "parent", "at"),
      root: "document",
      slots: children,
    },
    "N2 tree",
  ],
  [primaryKeyOf("Node", "id"), "Node key"],
  [
    containedIn(
      sideOf(
        "Node",
        "parent",
        "version",
        "parentKind",
        "parentGoverns",
        "parentAncestry",
        "parentNearest",
        "parentNearestKind",
        "parentParentKind",
      ),
      sideOf(
        "Node",
        "id",
        "version",
        "kind",
        "governs",
        "ancestry",
        "nearest",
        "nearestKind",
        "parentKind",
      ),
    ),
    "T3 first child",
  ],
  [
    containedIn(
      sideOf("Node", "parent", "pred:at", "was"),
      sideOf("Node", "parent", "at", "state"),
    ),
    "N5 fold",
  ],
  [
    containedIn(
      sideOf("Node", "version", "parentKind", "was", "state"),
      sideOf("Follow", "version", "parent", "from", "to"),
    ),
    "N5 Follow",
  ],
  [
    containedIn(
      sideOf("Node", "id", "pred:children", "lastState"),
      sideOf("Node", "parent", "at", "state"),
    ),
    "N7 last slot",
  ],
  [
    containedIn(
      sideOf("Node", "version", "kind", "lastState"),
      sideOf("Last", "version", "parent", "position"),
    ),
    "N7 Last",
  ],
  [
    foldOf(
      children,
      "count",
      sideOf("Node", "parent", "elementsWas", "elements"),
      sideOf("Node", "id", "elementChildren"),
    ),
    "N5 fold",
  ],
  [
    foldOf(children, "count", sideOf("Node", "parent"), sideOf("Node", "id", "countedChildren")),
    "N7 Counted",
  ],
  [keyOver(sideOf("Node", "parent", "state")), "N7 Counted"],
  [
    foldOf(children, "count", sideOf("Node", "parent"), sideOf("Node", "id", "barredChildren")),
    "N7 barred by",
  ],
  [
    foldOf(
      children,
      "concat",
      sideOf("Node", "parent", "stringPiece", "charsWas", "charsAfter"),
      sideOf("Node", "id", "stringValue"),
    ),
    "E1 derived",
  ],
  [
    containedIn(
      sideOf("Node", "version", "kind", "governs"),
      sideOf("XsiType", "version", "kind", "type"),
    ),
    "XsiType derived",
  ],
  ...(
    [
      ["Comment", "comment arm"],
      ["Pi", "pi arm"],
      ["Doctype", "doctype arm"],
      ["Document", "Document"],
    ] as const
  ).flatMap(([relation, name]) =>
    [
      primaryKeyOf(relation, "node"),
      ...mirrored(sideOf(relation, "node"), sideOf("Node", "id")),
    ].map((law) => [law, name] as const),
  ),
  [
    containedIn(sideOf("Node", "document", "kind"), sideOf("Document", "node", "rootKind")),
    "Document",
  ],
  [
    familyOf("ordered", sideOf("Namespace", "node", "at"), "Node", "namespaces"),
    "Namespace family",
  ],
  [primaryKeyOf("Namespace", "node", "at"), "Namespace family"],
  [keyOver(sideOf("Namespace", "node", "prefix")), "Namespace family"],
  [primaryKeyOf("OpenElementName", "node"), "OpenElementName"],
  [
    containedIn(
      sideOf(
        "OpenElementName",
        "node",
        "document",
        "kind",
        "start",
        "nearest",
        "version",
        "parent",
      ),
      sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
    ),
    "OpenElementName",
  ],
  [containedIn(sideOf("Node", "id"), sideOf("OpenElementName", "node")), "OpenElementName"],
  [
    containedIn(sideOf("OpenElementName", "parent", "parentKind"), sideOf("Node", "id", "kind")),
    "Foreign element class",
  ],
  [
    containedIn(
      sideOf("OpenElementName", "parent", "parentNamespace"),
      sideOf("OpenElementName", "node", "namespace"),
    ),
    "Foreign element class",
  ],
  [familyOf("ordered", sideOf("Attribute", "node", "at"), "Node", "attributes"), "AL2 count"],
  [primaryKeyOf("Attribute", "node", "id"), "AL2 count"],
  [
    familyOf(
      "ordered",
      sideOf("OpenAttributeName", "node", "attribute", "at"),
      "Attribute",
      "openName",
    ),
    "AL4 open names",
  ],
  [primaryKeyOf("OpenAttributeName", "node", "attribute", "at"), "AL4 open names"],
  [
    familyOf("ordered", sideOf("Idref", "node", "attribute", "at"), "Attribute", "idrefs"),
    "E1 derived",
  ],
  [primaryKeyOf("Idref", "node", "attribute", "at"), "E1 derived"],
  [
    familyOf(
      "ordered",
      sideOf("AttributeEntity", "node", "attribute", "at"),
      "Attribute",
      "entities",
    ),
    "AttributeEntity owner",
  ],
  [primaryKeyOf("AttributeEntity", "node", "attribute", "at"), "AttributeEntity owner"],
  [
    containedIn(
      sideOf("Attribute", "node", "kind", "version", "document", "governs"),
      sideOf("Node", "id", "kind", "version", "document", "governs"),
    ),
    "AL1 owner",
  ],
  [
    containedIn(
      sideOf("OpenAttributeName", "node", "attribute", "class", "kind"),
      sideOf("Attribute", "node", "id", "name", "kind"),
    ),
    "AL1 owner",
  ],
  [
    containedIn(
      sideOf("Idref", "node", "attribute", "document"),
      sideOf("Attribute", "node", "id", "document"),
    ),
    "AL1 owner",
  ],
  [
    foldOf(
      { count: "attributes", owner: "Node" },
      "or",
      sideOf("Attribute", "node", "slot", "attrsWas", "attrsAfter"),
      sideOf("Node", "id", "attrs"),
    ),
    "AL2 fold",
  ],
  [keyOver(sideOf("OpenAttributeName", "node", "uri", "local")), "AL4 open name key"],
  [
    containedIn(
      sideOf("OpenAttributeName", "node", "elementNamespace"),
      sideOf("OpenElementName", "node", "namespace"),
    ),
    "Foreign attribute class",
  ],
  [
    foldOf(
      { count: "idrefs", owner: "Attribute" },
      "concat",
      sideOf("Idref", "node", "attribute", "piece", "piecesWas", "piecesAfter"),
      sideOf("Attribute", "node", "id", "idrefText"),
    ),
    "E1 derived",
  ],
  [primaryKeyOf("Package", "id"), "Package key"],
  [familyOf("ordered", sideOf("Entry", "package", "at"), "Package", "entries"), "Entry family"],
  [primaryKeyOf("Entry", "package", "at"), "Entry family"],
  [keyOver(sideOf("Entry", "package", "path")), "Entry family"],
  [
    containedIn(sideOf("Resource", "version", "type"), sideOf("ResourceTypeOf", "version", "type")),
    "ResourceTypeOf",
  ],
  [
    containedIn(
      sideOf("ResourceHref", "package", "path", "type"),
      sideOf("Document", "package", "path", "resourceType"),
    ),
    "RootOfType",
  ],
  [
    containedIn(sideOf("Entry", "package", "path"), sideOf("FileHref", "package", "path")),
    "File listed",
  ],
  [
    containedIn(
      sideOf("ResourceHref", "node", "scope", "path"),
      sideOf("ResourceFile", "resource", "scope", "path"),
    ),
    "Href listed",
  ],
  [
    containedIn(sideOf("ResourceHref", "package", "path"), sideOf("Entry", "package", "path")),
    "Document entry",
  ],
  [
    containedIn(sideOf("Document", "package", "path"), sideOf("Entry", "package", "path")),
    "Document entry",
  ],
  [
    containedIn(
      sideOf("Dependency", "package", "ref"),
      sideOf("Resource", "package", "identifier"),
    ),
    "Dependency target",
  ],
  [keyOver(sideOf("Resource", "package", "identifier")), "DocumentId key"],
  // The stimulus documents' key (package.ts, B5) shares this identity with every document's: it
  // holds by that key, so only an importer defect reaches it, under the one name, Document entry.
  [keyOver(sideOf("Document", "package", "path")), "Document entry"],
  [
    containedIn(sideOf("ReferencePath", "package", "path"), sideOf("Document", "package", "path")),
    "Stimulus ref target",
  ],
  ...(
    [
      [
        "ManifestId",
        "parent",
        "identifier",
        ["document", "package"],
        ["Document", "node", "package"],
      ],
      [
        "Resource",
        "parent",
        "identifier",
        ["document", "package"],
        ["Document", "node", "package"],
      ],
      ["File", "resource", "href", ["resource", "package"], ["Resource", "node", "package"]],
      [
        "Dependency",
        "resource",
        "ref",
        ["resource", "package", "resourceIdentifier"],
        ["Resource", "node", "package", "identifier"],
      ],
    ] as const
  ).flatMap(([overlay, parent, value, [held, ...heldRest], [holder, holds, ...holdsRest]]) =>
    [
      primaryKeyOf(overlay, "node"),
      containedIn(
        sideOf(overlay, "node", "document", "kind", "start", "nearest", "version", parent),
        sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
      ),
      containedIn(sideOf(overlay, "node"), sideOf("Node", "id")),
      containedIn(sideOf(overlay, held, ...heldRest), sideOf(holder, holds, ...holdsRest)),
      containedIn(sideOf("Attribute", "node", "lexical"), sideOf(overlay, "node", value)),
    ].map((law) => [law, "Manifest overlay"] as const),
  ),
  [keyOver(sideOf("Attribute", "node")), "DocumentId key"],
  [keyOver(sideOf("ManifestId", "package")), "Manifest overlay"],
  [
    containedIn(sideOf("Attribute", "node", "lexical"), sideOf("Resource", "node", "typeLexical")),
    "Manifest overlay",
  ],
  [primaryKeyOf("ResourceHref", "node"), "Manifest overlay"],
  [
    containedIn(sideOf("Attribute", "node", "lexical"), sideOf("ResourceHref", "node", "href")),
    "Manifest overlay",
  ],
  [
    containedIn(
      sideOf("ResourceHref", "node", "package", "type"),
      sideOf("Resource", "node", "package", "type"),
    ),
    "Manifest overlay",
  ],
  [
    containedIn(
      sideOf("Resource", "package", "manifestIdentifier"),
      sideOf("ManifestId", "package", "identifier"),
    ),
    "Manifest id space",
  ],
  [
    familyOf("counted", sideOf("ResourceHref", "package", "path", "type"), "NamedHref", "names"),
    "RootOfType",
  ],
  [primaryKeyOf("NamedHref", "package", "path", "type"), "RootOfType"],
  [
    containedIn(
      sideOf("Document", "package", "path", "resourceType"),
      sideOf("NamedHref", "package", "path", "type"),
    ),
    "RootOfType",
  ],
  [
    familyOf("counted", sideOf("File", "package", "scope", "path"), "FileHref", "files"),
    "File listed",
  ],
  [primaryKeyOf("FileHref", "package", "scope", "path"), "File listed"],
  [keyOver(sideOf("FileHref", "package", "path")), "File listed"],
  [
    familyOf("counted", sideOf("File", "resource", "scope", "path"), "ResourceFile", "files"),
    "Href listed",
  ],
  [primaryKeyOf("ResourceFile", "resource", "scope", "path"), "Href listed"],
  [keyOver(sideOf("IdBinding", "document", "id")), "DocumentId key"],
  [
    familyOf("counted", sideOf("DocumentId", "document", "id", "owner"), "IdBinding", "carriers"),
    "DocumentId key",
  ],
  [primaryKeyOf("IdBinding", "document", "id", "owner"), "E1 derived"],
  [
    containedIn(
      sideOf("IdentityText", "node", "document", "owner", "lexical"),
      sideOf("DocumentId", "node", "document", "owner", "lexical"),
    ),
    "DocumentId key",
  ],
  [containedIn(sideOf("DocumentId", "node"), sideOf("IdentityText", "node")), "DocumentId key"],
  [keyOver(sideOf("IdentityText", "node")), "DocumentId key"],
  ...(["Idref", "TextIdref"] as const).map(
    (idref) =>
      [
        containedIn(sideOf(idref, "document", "token"), sideOf("IdrefTarget", "document", "id")),
        "Idref target",
      ] as const,
  ),
  [
    containedIn(sideOf("IdrefTarget", "document", "id"), sideOf("IdBinding", "document", "id")),
    "Idref target",
  ],
  [
    containedIn(sideOf("PlacedIdref", "assembly", "id"), sideOf("AssembledId", "assembly", "id")),
    "Idref target",
  ],
  [keyOver(sideOf("AssembledId", "assembly", "id")), "DocumentId key"],
  ...(
    [
      [sideOf("IdrefTarget", "document", "assembled"), sideOf("Document", "node", "assembled")],
      [
        sideOf("PlacedId", "instance", "document", "assembly", "assemblyKind"),
        sideOf("Instance", "id", "document", "assembly", "assemblyKind"),
      ],
      [
        sideOf("PlacedId", "node", "document", "id", "owner"),
        sideOf("DocumentId", "node", "document", "id", "owner"),
      ],
      [
        sideOf("PlacedIdref", "instance", "document", "assembly"),
        sideOf("Instance", "id", "document", "assembly"),
      ],
      [sideOf("PlacedIdref", "document", "id"), sideOf("IdrefTarget", "document", "id")],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  ...(
    [
      [sideOf("IdrefTarget", "document"), "Document", "idrefTargets"],
      [sideOf("DocumentId", "document"), "Document", "ids"],
      [sideOf("PlacedId", "instance"), "Instance", "ids"],
      [sideOf("PlacedId", "assembly", "id", "owner", "copy"), "AssembledId", "carriers"],
      [sideOf("PlacedIdref", "instance"), "Instance", "idrefTargets"],
    ] as const
  ).map(
    ([member, owner, count]) => [familyOf("counted", member, owner, count), "E1 derived"] as const,
  ),
  [primaryKeyOf("IdrefTarget", "document", "id"), "E1 derived"],
  [primaryKeyOf("PlacedId", "instance", "node"), "E1 derived"],
  [primaryKeyOf("AssembledId", "assembly", "id", "owner", "copy"), "E1 derived"],
  [primaryKeyOf("PlacedIdref", "instance", "id"), "E1 derived"],
  [
    containedIn(
      sideOf(
        "Document",
        "node",
        "nodeChildren",
        "context",
        "nodeDocument",
        "nodeGoverns",
        "nodeKind",
        "contextNearest",
        "contextNearestKind",
        "nodeParentKind",
        "nodeStart",
        "version",
      ),
      sideOf(
        "Node",
        "id",
        "children",
        "ancestry",
        "document",
        "governs",
        "kind",
        "nearest",
        "nearestKind",
        "parentKind",
        "start",
        "version",
      ),
    ),
    "E1 derived",
  ],
  [
    containedIn(
      sideOf("Document", "resourceType", "rootKind"),
      sideOf("RootOfType", "type", "root"),
    ),
    "RootOfType",
  ],
  [primaryKeyOf("IdentityText", "node"), "E1 derived"],
  [
    containedIn(
      sideOf("Node", "id", "document", "parent", "stringValue"),
      sideOf("IdentityText", "node", "document", "owner", "lexical"),
    ),
    "E1 derived",
  ],
  ...(["IdentityText", "OpenElementName"] as const).map(
    (projection) =>
      [
        containedIn(
          sideOf(projection, "node", "kind", "version", "document", "governs"),
          sideOf("Node", "id", "kind", "version", "document", "governs"),
        ),
        "E1 derived",
      ] as const,
  ),
  [familyOf("ordered", sideOf("TextIdref", "node", "at"), "IdentityText", "idrefs"), "E1 derived"],
  [primaryKeyOf("TextIdref", "node", "at"), "E1 derived"],
  [
    containedIn(
      sideOf("TextIdref", "node", "document"),
      sideOf("IdentityText", "node", "document"),
    ),
    "E1 derived",
  ],
  [
    foldOf(
      { count: "idrefs", owner: "IdentityText" },
      "concat",
      sideOf("TextIdref", "node", "piece", "piecesWas", "piecesAfter"),
      sideOf("IdentityText", "node", "idrefText"),
    ),
    "E1 derived",
  ],
  [primaryKeyOf("DocumentId", "node"), "DocumentId key"],
  [
    containedIn(
      sideOf("Attribute", "node", "document", "lexical"),
      sideOf("DocumentId", "node", "document", "lexical"),
    ),
    "DocumentId key",
  ],
  [containedIn(sideOf("DocumentId", "node"), sideOf("Attribute", "node")), "DocumentId key"],
  [primaryKeyOf("XmlLang", "node"), "E1 derived"],
  [
    containedIn(
      sideOf("Attribute", "node", "document", "lexical"),
      sideOf("XmlLang", "node", "document", "lang"),
    ),
    "E1 derived",
  ],
  [containedIn(sideOf("XmlLang", "node"), sideOf("Attribute", "node")), "E1 derived"],
  [
    familyOf("counted", sideOf("XmlLang", "document", "lang"), "DocumentLang", "carriers"),
    "E1 derived",
  ],
  [primaryKeyOf("DocumentLang", "document", "lang"), "E1 derived"],
  ...(
    [
      [sideOf("GeneralNamed", "general"), sideOf("ResourceLomGeneral", "node")],
      [sideOf("ResourceLomGeneral", "node"), sideOf("GeneralNamed", "general")],
      [sideOf("GeneralNamed", "general", "record"), sideOf("LomGeneral", "node", "parent")],
      [sideOf("GeneralNamed", "record", "named"), sideOf("LomRecord", "node", "named")],
      [sideOf("GeneralNamed", "general", "record"), sideOf("GeneralObject", "general", "record")],
      [sideOf("GeneralObject", "general", "record"), sideOf("GeneralNamed", "general", "record")],
      [sideOf("GeneralObject", "record", "document"), sideOf("LomObject", "record", "document")],
      [sideOf("DocumentGenerals", "document"), sideOf("Document", "node")],
      [sideOf("Document", "node"), sideOf("DocumentGenerals", "document")],
      [
        sideOf("GeneralLang", "general", "document"),
        sideOf("GeneralObject", "general", "document"),
      ],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  [
    familyOf("counted", sideOf("GeneralObject", "document"), "DocumentGenerals", "generals"),
    "E1 derived",
  ],
  [
    familyOf("counted", sideOf("GeneralLang", "document", "lang"), "DocumentLang", "generals"),
    "E1 derived",
  ],
  [primaryKeyOf("GeneralNamed", "general"), "E1 derived"],
  [primaryKeyOf("GeneralObject", "general"), "E1 derived"],
  [primaryKeyOf("DocumentGenerals", "document"), "E1 derived"],
  [primaryKeyOf("GeneralLang", "general", "lang"), "E1 derived"],
  [
    containedIn(
      sideOf("GeneralLang", "general", "value"),
      sideOf("ResourceLomLanguageSet", "general", "lang"),
    ),
    "Document lang",
  ],
  [
    containedIn(
      sideOf("DocumentLang", "document", "generals"),
      sideOf("DocumentGenerals", "document", "generals"),
    ),
    "Document lang",
  ],
  [
    containedIn(
      sideOf("PlacedGeneralLang", "general", "value"),
      sideOf("ResourceLomLanguageSet", "general", "lang"),
    ),
    "Document lang",
  ],
  [
    containedIn(
      sideOf("AssembledLang", "assembly", "generals"),
      sideOf("DocumentGenerals", "document", "generals"),
    ),
    "Document lang",
  ],
  ...(
    [
      [
        sideOf("PlacedXmlLang", "instance", "document", "assembly"),
        sideOf("Instance", "id", "document", "assembly"),
      ],
      [
        sideOf("PlacedXmlLang", "node", "document", "lang"),
        sideOf("XmlLang", "node", "document", "lang"),
      ],
      [
        sideOf("PlacedGeneralLang", "general", "assembly"),
        sideOf("GeneralObject", "general", "document"),
      ],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  ...(
    [
      [sideOf("XmlLang", "document"), "Document", "langs"],
      [sideOf("PlacedXmlLang", "instance"), "Instance", "langs"],
      [sideOf("PlacedXmlLang", "assembly", "lang"), "AssembledLang", "carriers"],
      [sideOf("PlacedGeneralLang", "assembly", "lang"), "AssembledLang", "generals"],
    ] as const
  ).map(
    ([member, owner, count]) => [familyOf("counted", member, owner, count), "E1 derived"] as const,
  ),
  [primaryKeyOf("PlacedXmlLang", "instance", "node"), "E1 derived"],
  [primaryKeyOf("AssembledLang", "assembly", "lang"), "E1 derived"],
  [primaryKeyOf("PlacedGeneralLang", "general", "lang"), "E1 derived"],
  ...(
    [
      [
        sideOf("Attribute", "node", "name", "kind", "lexical"),
        sideOf("SsmlAttribute", "node", "name", "kind", "lexical"),
      ],
      [sideOf("SsmlAttribute", "node", "name"), sideOf("Attribute", "node", "name")],
      [sideOf("SsmlAttribute", "node", "fragment"), sideOf("SsmlScope", "node", "fragment")],
      [
        sideOf("SsmlScope", "node", "document", "kind", "start", "nearest", "version", "parent"),
        sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
      ],
      [sideOf("SsmlScope", "parent", "fragment"), sideOf("SsmlScope", "node", "fragment")],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  [
    familyOf(
      "counted",
      sideOf("SsmlAttribute", "fragment", "kind", "value"),
      "FragmentValue",
      "carriers",
    ),
    "E1 derived",
  ],
  [
    containedIn(
      sideOf("SsmlAttribute", "node", "refers", "value"),
      sideOf("FragmentValue", "fragment", "kind", "value"),
    ),
    "SSML trim mark",
  ],
  [
    containedIn(
      sideOf("SsmlAttribute", "fragment", "refers", "value"),
      sideOf("FragmentValue", "fragment", "kind", "value"),
    ),
    "SSML lexicon reference",
  ],
  [primaryKeyOf("SsmlAttribute", "node", "name"), "E1 derived"],
  [primaryKeyOf("SsmlScope", "node"), "E1 derived"],
  [primaryKeyOf("FragmentValue", "fragment", "kind", "value"), "E1 derived"],
  [keyOver(sideOf("Node", "id")), "Node key"],
  [primaryKeyOf("LomLanguage", "node"), "E1 derived"],
  [
    containedIn(
      sideOf("Node", "id", "parent", "stringValue"),
      sideOf("LomLanguage", "node", "general", "lang"),
    ),
    "E1 derived",
  ],
  [containedIn(sideOf("LomLanguage", "node"), sideOf("Node", "id")), "E1 derived"],
  [
    familyOf(
      "counted",
      sideOf("LomLanguage", "general", "lang"),
      "ResourceLomLanguageSet",
      "carriers",
    ),
    "E1 derived",
  ],
  [primaryKeyOf("ResourceLomLanguageSet", "general", "lang"), "E1 derived"],
  [primaryKeyOf("Quotation", "node"), "E1 derived"],
  [primaryKeyOf("LabelUse", "node"), "Label tools"],
  [
    containedIn(sideOf("Attribute", "node", "document"), sideOf("LabelUse", "node", "document")),
    "Label tools",
  ],
  [containedIn(sideOf("LabelUse", "node"), sideOf("Attribute", "node")), "Label tools"],
  [
    containedIn(sideOf("LabelUse", "document", "rootKind"), sideOf("Document", "node", "rootKind")),
    "Label tools",
  ],
  [keyOver(sideOf("Attribute", "document")), "Label tools"],
  [containedIn(sideOf("LabelUse", "document"), sideOf("Attribute", "document")), "Label tools"],
  [containedIn(sideOf("Attribute", "node"), sideOf("Attribute", "node")), "Track srclang"],
  [primaryKeyOf("TableScope", "node"), "E1 derived"],
  [primaryKeyOf("CellHeaders", "node"), "E1 derived"],
  [primaryKeyOf("HeaderToken", "node", "at"), "E1 derived"],
  [primaryKeyOf("TableHeader", "node"), "E1 derived"],
  ...(
    [
      [
        sideOf("TableScope", "node", "document", "kind", "start", "nearest", "version", "parent"),
        sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
      ],
      [sideOf("TableScope", "parent", "table"), sideOf("TableScope", "node", "table")],
      [sideOf("Attribute", "node", "lexical"), sideOf("CellHeaders", "node", "lexical")],
      [sideOf("CellHeaders", "node"), sideOf("Attribute", "node")],
      [sideOf("CellHeaders", "node", "table"), sideOf("TableScope", "node", "table")],
      [sideOf("HeaderToken", "node", "table"), sideOf("CellHeaders", "node", "table")],
      [sideOf("Attribute", "node", "document"), sideOf("TableHeader", "node", "document")],
      [sideOf("TableHeader", "node"), sideOf("Attribute", "node")],
      [
        sideOf("TableHeader", "node", "document", "id", "owner"),
        sideOf("DocumentId", "node", "document", "id", "owner"),
      ],
      [sideOf("TableHeader", "node", "table"), sideOf("TableScope", "node", "table")],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  [familyOf("ordered", sideOf("HeaderToken", "node", "at"), "CellHeaders", "tokens"), "E1 derived"],
  [
    foldOf(
      { count: "tokens", owner: "CellHeaders" },
      "concat",
      sideOf("HeaderToken", "node", "piece", "piecesWas", "piecesAfter"),
      sideOf("CellHeaders", "node", "tokenText"),
    ),
    "E1 derived",
  ],
  [keyOver(sideOf("TableHeader", "table", "id")), "DocumentId key"],
  [keyOver(sideOf("HeaderToken", "node", "token")), "Table headers"],
  [
    containedIn(sideOf("HeaderToken", "table", "token"), sideOf("TableHeader", "table", "id")),
    "Table headers",
  ],
  [primaryKeyOf("Rounding", "node"), "E1 derived"],
  [primaryKeyOf("Tolerance", "node"), "E1 derived"],
  [primaryKeyOf("ToleranceToken", "node", "at"), "E1 derived"],
  ...(
    [
      [
        sideOf("Rounding", "node", "document", "kind", "start", "nearest", "version", "parent"),
        sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
      ],
      [sideOf("Node", "id"), sideOf("Rounding", "node")],
      [sideOf("Attribute", "node", "lexical"), sideOf("Rounding", "node", "figuresLexical")],
      [sideOf("Attribute", "node", "lexical"), sideOf("Rounding", "node", "mode")],
      [sideOf("Rounding", "node"), sideOf("Attribute", "node")],
      [sideOf("Attribute", "node", "lexical"), sideOf("Tolerance", "node", "lexical")],
      [sideOf("Tolerance", "node"), sideOf("Attribute", "node")],
    ] as const
  ).map(([from, to]) => [containedIn(from, to), "E1 derived"] as const),
  [
    familyOf("ordered", sideOf("ToleranceToken", "node", "at"), "Tolerance", "tokens"),
    "E1 derived",
  ],
  [
    foldOf(
      { count: "tokens", owner: "Tolerance" },
      "concat",
      sideOf("ToleranceToken", "node", "piece", "piecesWas", "piecesAfter"),
      sideOf("Tolerance", "node", "tokenText"),
    ),
    "E1 derived",
  ],
  [containedIn(sideOf("Attribute", "node"), sideOf("Tolerance", "node")), "Equal tolerance"],
  [keyOver(sideOf("Declaration", "document", "identifier")), "Declaration key"],
  ...(["Declaration", "ValueSet", "Value", "RecordField", "OutcomeRange"] as const).map(
    (overlay) => [primaryKeyOf(overlay, "node"), "Declaration overlay"] as const,
  ),
  ...(["Declaration", "ValueSet", "Value", "RecordField"] as const).map(
    (overlay) =>
      [
        containedIn(
          sideOf(overlay, "node", "document", "kind", "start", "nearest", "version", "parent"),
          sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
        ),
        "Declaration overlay",
      ] as const,
  ),
  [
    containedIn(
      sideOf("Declaration", "kind", "declarationKind"),
      sideOf("Declares", "kind", "declaration"),
    ),
    "E1 derived",
  ],
  ...(
    [
      ["Declaration", "identifierLexical"],
      ["Declaration", "cardinalityLexical"],
      ["Declaration", "baseTypeLexical"],
      ["OutcomeRange", "masteryValue"],
      ["OutcomeRange", "normalMinimum"],
      ["OutcomeRange", "normalMaximum"],
    ] as const
  ).map(
    ([overlay, field]) =>
      [
        containedIn(sideOf("Attribute", "node", "lexical"), sideOf(overlay, "node", field)),
        "Declaration overlay",
      ] as const,
  ),
  [containedIn(sideOf("Declaration", "node"), sideOf("Attribute", "node")), "Declaration overlay"],
  [containedIn(sideOf("Node", "id"), sideOf("ValueSet", "node")), "Declaration overlay"],
  [
    containedIn(
      sideOf(
        "ValueSet",
        "parent",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
      sideOf(
        "Declaration",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
    ),
    "Declaration overlay",
  ],
  [
    containedIn(
      sideOf("ValueSet", "node", "elements", "elementChildren"),
      sideOf("Node", "id", "elements", "elementChildren"),
    ),
    "Value cardinality",
  ],
  [familyOf("counted", sideOf("RecordField", "parent"), "ValueSet", "fields"), "Value cardinality"],
  [containedIn(sideOf("Node", "id"), sideOf("Value", "node")), "Declaration overlay"],
  [
    containedIn(sideOf("Value", "node", "text"), sideOf("Node", "id", "stringValue")),
    "Declaration overlay",
  ],
  [
    containedIn(sideOf("Value", "parent", "setBaseType"), sideOf("ValueSet", "node", "baseType")),
    "Declaration overlay",
  ],
  [
    containedIn(sideOf("Value", "node", "baseType"), sideOf("RecordField", "node", "baseType")),
    "Declaration overlay",
  ],
  [keyOver(sideOf("RecordField", "parent", "identifier")), "Record field key"],
  [
    containedIn(
      sideOf("Attribute", "node", "lexical"),
      sideOf("RecordField", "node", "identifierLexical"),
    ),
    "Value cardinality",
  ],
  [
    containedIn(
      sideOf("Attribute", "node", "lexical"),
      sideOf("RecordField", "node", "baseTypeLexical"),
    ),
    "Value cardinality",
  ],
  [containedIn(sideOf("RecordField", "node"), sideOf("Attribute", "node")), "Value cardinality"],
  [
    containedIn(sideOf("OutcomeRange", "node"), sideOf("Declaration", "node")),
    "Declaration overlay",
  ],
  [familyOf("counted", sideOf("Operand", "operator"), "Expression", "operands"), "Arity"],
  [
    containedIn(sideOf("Mapping", "baseType"), sideOf("MappableBaseType", "baseType")),
    "MappableBaseType",
  ],
  ...(
    [
      "Mapping",
      "MapKey",
      "MapKeyInteger",
      "MapKeyFloat",
      "AreaMapping",
      "MatchTable",
      "InterpolationTable",
    ] as const
  ).map((overlay) => [primaryKeyOf(overlay, "node"), "Mapping overlay"] as const),
  ...(
    [
      ["Mapping", "declaration"],
      ["MapKey", "mapping"],
      ["AreaMapping", "declaration"],
      ["MatchTable", "declaration"],
      ["InterpolationTable", "declaration"],
    ] as const
  ).flatMap(([overlay, parent]) => [
    [
      containedIn(
        sideOf(overlay, "node", "document", "kind", "start", "nearest", "version", parent),
        sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
      ),
      "Mapping overlay",
    ] as const,
    [containedIn(sideOf(overlay, "node"), sideOf("Node", "id")), "Mapping overlay"] as const,
  ]),
  ...(["AreaMapping", "MatchTable", "InterpolationTable"] as const).map(
    (overlay) =>
      [containedIn(sideOf("Node", "id"), sideOf(overlay, "node")), "Mapping overlay"] as const,
  ),
  ...(["Mapping", "AreaMapping", "MatchTable", "InterpolationTable"] as const).map(
    (overlay) =>
      [
        containedIn(
          sideOf(
            overlay,
            "declaration",
            "document",
            "identifier",
            "declarationKind",
            "baseType",
            "cardinality",
          ),
          sideOf(
            "Declaration",
            "node",
            "document",
            "identifier",
            "declarationKind",
            "baseType",
            "cardinality",
          ),
        ),
        "Mapping overlay",
      ] as const,
  ),
  [
    containedIn(sideOf("MapKey", "mapping", "baseType"), sideOf("Mapping", "node", "baseType")),
    "Mapping overlay",
  ],
  [
    containedIn(sideOf("Attribute", "node", "lexical"), sideOf("MapKey", "node", "key")),
    "Mapping overlay",
  ],
  [keyOver(sideOf("MapKey", "mapping", "key")), "Map key"],
  ...(["MapKeyInteger", "MapKeyFloat"] as const).flatMap((typed) => [
    ...mirrored(
      sideOf("MapKey", "node", "mapping", "key"),
      sideOf(typed, "node", "mapping", "key"),
    ).map((law) => [law, "Mapping overlay"] as const),
    [keyOver(sideOf(typed, "mapping", "value")), "Map key"] as const,
  ]),
  [keyOver(sideOf("Named", "document", "identifier")), "Structure identifier"],
  [keyOver(sideOf("VariableMapping", "parent", "target")), "Variable mapping target"],
  [keyOver(sideOf("StimulusRef", "document", "identifier")), "Stimulus ref key"],
  [keyOver(sideOf("TestDocument", "package", "path")), "Document entry"],
  [
    containedIn(
      sideOf("Site", "package", "path", "target"),
      sideOf("TestDocument", "package", "path", "node"),
    ),
    "Document entry",
  ],
  [
    foldOf(
      { count: "members", owner: "Section" },
      "count",
      sideOf("SectionMember", "section"),
      sideOf("Section", "node", "required"),
    ),
    "Selection required",
  ],
  [keyOver(sideOf("TestFlag", "node")), "Selection required"],
  [keyOver(sideOf("SectionMember", "node")), "Selection required"],
  [containedIn(sideOf("SectionMember", "node"), sideOf("TestFlag", "node")), "Selection required"],
  [containedIn(sideOf("TestFlag", "node"), sideOf("SectionMember", "node")), "Selection required"],
  [
    containedIn(
      sideOf("ItemRefTarget", "node", "package", "path"),
      sideOf("ReferencePath", "node", "package", "path"),
    ),
    "E1 derived",
  ],
  [
    containedIn(
      sideOf(
        "Site",
        "package",
        "path",
        "target",
        "targetRoot",
        "targetNearest",
        "targetNearestKind",
      ),
      sideOf(
        "Document",
        "package",
        "path",
        "node",
        "rootKind",
        "contextNearest",
        "contextNearestKind",
      ),
    ),
    "Include target",
  ],
  [
    containedIn(
      sideOf("Inclusion", "version", "includeParent", "root"),
      sideOf("IncludeRoot", "version", "parent", "kind"),
    ),
    "Include root",
  ],
  [familyOf("counted", sideOf("Site", "target"), "Document", "targetedBy"), "E1 derived"],
  [
    foldOf(
      { count: "targetedBy", owner: "Document" },
      "or",
      sideOf("Site", "ancestry"),
      sideOf("Document", "node", "context"),
    ),
    "E1 derived",
  ],
  [containedIn(sideOf("TestDocument", "node"), sideOf("Document", "node")), "E1 derived"],
  [
    containedIn(
      sideOf("Instance", "document", "ids", "idrefTargets", "choices", "hottexts"),
      sideOf("Document", "node", "ids", "idrefTargets", "choices", "hottexts"),
    ),
    "E1 derived",
  ],
  [
    containedIn(
      sideOf("Instance", "document", "bindings", "langs", "variables"),
      sideOf("Document", "node", "bindings", "langs", "variables"),
    ),
    "E1 derived",
  ],
  ...Object.values(testRelations).map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        testKeyNames.get(name) ?? "Test overlay",
      ] as const,
  ),
  ...patternLaws([[SelectForm, "E1 derived"]]),
  [
    containedIn(
      sideOf("LomObjectIdentifier", "entry", "general", "record", "identifier"),
      sideOf("LomEntry", "node", "holder", "holderParent", "token"),
    ),
    "LomObjectIdentifier",
  ],
  [
    containedIn(sideOf("LomEntry", "holderParent"), sideOf("LomObjectIdentifier", "record")),
    "LomObjectIdentifier",
  ],
  [
    containedIn(
      sideOf("LomObjectTitle", "string", "record", "title"),
      sideOf("LomTitleString", "node", "record", "text"),
    ),
    "LomObjectTitle",
  ],
  [
    containedIn(
      sideOf("LomObjectTitle", "string", "stringLanguage"),
      sideOf("LomTitleString", "node", "language"),
    ),
    "LomObjectTitle",
  ],
  [containedIn(sideOf("LomTitle", "record"), sideOf("LomObjectTitle", "record")), "LomObjectTitle"],
  [
    containedIn(sideOf("LomResourceType", "node"), sideOf("LomResourceTypeSource", "node")),
    "LOM learning resource type",
  ],
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
  ...patternLaws([[lexical(date), "Calendar date"]]),
  [
    containedIn(
      sideOf(
        "BoundVariable",
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
      sideOf(
        "Declaration",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
    ),
    "Binding declared",
  ],
  [
    containedIn(
      sideOf("BoundVariable", "baseType", "cardinality", "kind"),
      sideOf("BindingFit", "baseType", "cardinality", "kind"),
    ),
    "BindingFit",
  ],
  [
    containedIn(sideOf("BoundVariable", "kind"), sideOf("RecordBindingFit", "kind")),
    "RecordBindingFit",
  ],
  [
    containedIn(
      sideOf(
        "PlacedBinding",
        "declaration",
        "assembly",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
      sideOf(
        "Declaration",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ),
    ),
    "Binding declared",
  ],
  [
    containedIn(
      sideOf("PlacedBinding", "baseType", "cardinality", "kind"),
      sideOf("BindingFit", "baseType", "cardinality", "kind"),
    ),
    "BindingFit",
  ],
  [
    containedIn(sideOf("PlacedBinding", "kind"), sideOf("RecordBindingFit", "kind")),
    "RecordBindingFit",
  ],
  [keyOver(sideOf("PlacedBinding", "assembly", "identifier")), "Binding unique"],
  [
    containedIn(sideOf("PlacedBinding", "node"), sideOf("CountBound", "node")),
    "Binding cardinality",
  ],
  [
    containedIn(sideOf("PlacedBinding", "node", "kind"), sideOf("CountBound", "node", "kind")),
    "Max strings required",
  ],
  [containedIn(sideOf("PlacedBinding", "node"), sideOf("Node", "id")), "Adaptive feedback"],
  [keyOver(sideOf("BoundVariable", "document", "identifier")), "Binding unique"],
  [
    containedIn(sideOf("BoundVariable", "node"), sideOf("CountBound", "node")),
    "Binding cardinality",
  ],
  [
    containedIn(sideOf("BoundVariable", "node", "kind"), sideOf("CountBound", "node", "kind")),
    "Max strings required",
  ],
  [containedIn(sideOf("BoundVariable", "node"), sideOf("Node", "id")), "Adaptive feedback"],
  [familyOf("counted", sideOf("Choice", "interaction"), "Binding", "choices"), "N8 nearest"],
  [
    containedIn(
      sideOf("Choice", "node", "document", "kind", "start", "interaction", "version", "parent"),
      sideOf("Node", "id", "document", "kind", "start", "nearest", "version", "parent"),
    ),
    "N8 nearest",
  ],
  [
    containedIn(sideOf("Hottext", "nearest", "nearestKind"), sideOf("Binding", "node", "kind")),
    "N8 nearest",
  ],
  [keyOver(sideOf("Choice", "document", "kind", "identifier")), "Choice identifier key"],
  [keyOver(sideOf("Hottext", "document", "identifier")), "Choice identifier key"],
  [keyOver(sideOf("PlacedChoice", "assembly", "kind", "identifier")), "Choice identifier key"],
  [keyOver(sideOf("PlacedHottext", "assembly", "identifier")), "Choice identifier key"],
  ...(
    [
      ["FeedbackRef", "Feedback reference"],
      ["TemplateRef", "Template reference"],
      ["PrintedVariableRef", "Printed variable reference"],
      ["VarRef", "Printed variable reference"],
      ["ContextRef", "Context variable reference"],
    ] as const
  ).flatMap(([reference, name]) => [
    [
      containedIn(
        sideOf(
          reference,
          "declaration",
          "document",
          "identifier",
          "declarationKind",
          "baseType",
          "cardinality",
        ),
        sideOf(
          "Declaration",
          "node",
          "document",
          "identifier",
          "declarationKind",
          "baseType",
          "cardinality",
        ),
      ),
      name,
    ] as const,
    [
      containedIn(
        sideOf(reference, "kind", "attribute", "declarationKind"),
        sideOf("ContentReference", "kind", "attribute", "declaration"),
      ),
      name,
    ] as const,
  ]),
  [
    containedIn(
      sideOf("InteractionAttribute", "node", "name", "kind", "document", "value"),
      sideOf("VarRef", "node", "attribute", "kind", "document", "identifier"),
    ),
    "Variable reference copy",
  ],
  ...(
    [
      ["SectionFeedbackRef", "SectionFeedbackName", "Feedback reference"],
      ["SectionPrintedRef", "SectionPrintedName", "Printed variable reference"],
      ["SectionTemplateRef", "SectionTemplateName", "Template reference"],
      ["SectionContextRef", "SectionContextName", "Context variable reference"],
    ] as const
  ).flatMap(([reference, names, name]) =>
    [
      containedIn(
        sideOf(
          reference,
          "declaration",
          "assembly",
          "identifier",
          "declarationKind",
          "baseType",
          "cardinality",
        ),
        sideOf(
          "Declaration",
          "node",
          "document",
          "identifier",
          "declarationKind",
          "baseType",
          "cardinality",
        ),
      ),
      containedIn(
        sideOf(reference, "kind", "attribute", "declarationKind"),
        sideOf("ContentReference", "kind", "attribute", "declaration"),
      ),
      containedIn(
        sideOf(reference, "node", "attribute", "kind", "document", "identifier"),
        sideOf(names, "node", "attribute", "kind", "document", "identifier"),
      ),
    ].map((law) => [law, name] as const),
  ),
  ...[
    AriaElement,
    AriaRange,
    AriaValue,
    Binding,
    BindingName,
    BoundVariable,
    Choice,
    ChoiceVariableName,
    ContextRef,
    CountBound,
    FeedbackRef,
    Hotspot,
    Hottext,
    InteractionAttribute,
    ItemMode,
    PlacedBinding,
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
    VarRef,
  ].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "E1 derived",
      ] as const,
  ),
  ...(["MapKeyPoint", "MapKeyPair", "MapKeyDirectedPair"] as const).map(
    (typed) => [keyOver(sideOf(typed, "mapping", "value")), "Map key"] as const,
  ),
  ...[MapKeyPoint, MapKeyPair, MapKeyDirectedPair, LookupValue].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Mapping overlay",
      ] as const,
  ),
  ...(
    [
      ["VariableRef", "document"],
      ["PlacedVariableRef", "assembly"],
    ] as const
  ).map(
    ([reference, scope]) =>
      [
        containedIn(
          sideOf(
            reference,
            "declaration",
            scope,
            "identifier",
            "declarationKind",
            "declBaseType",
            "declCardinality",
          ),
          sideOf(
            "Declaration",
            "node",
            "document",
            "identifier",
            "declarationKind",
            "baseType",
            "cardinality",
          ),
        ),
        "Variable declared",
      ] as const,
  ),
  [keyOver(sideOf("Reading", "assembly", "node", "attribute")), "Prefixed reference"],
  ...(["VariableRef", "PlacedVariableRef", "Reading"] as const).map(
    (reference) =>
      [
        containedIn(
          sideOf(reference, "kind", "attribute", "declarationKind"),
          sideOf("ReferenceDeclaration", "kind", "attribute", "declaration"),
        ),
        "Variable kind",
      ] as const,
  ),
  ...(
    [
      ["TemplateDefault", "Template default target"],
      ["MappingSource", "Variable mapping source"],
    ] as const
  ).map(
    ([claim, name]) =>
      [
        containedIn(
          sideOf(claim, "itemRef", "itemDocument"),
          sideOf("ItemRefDocument", "node", "document"),
        ),
        name,
      ] as const,
  ),
  [
    containedIn(
      sideOf("AssembledReference", "assembly", "node", "attribute"),
      sideOf("Reading", "assembly", "node", "attribute"),
    ),
    "Prefixed reference",
  ],
  [
    containedIn(
      sideOf("AssembledReference", "assembly", "node", "attribute", "kind"),
      sideOf("Reading", "assembly", "node", "attribute", "kind"),
    ),
    "Variable kind",
  ],
  ...(
    [
      ["TemplateDefault", "template", "Template default target"],
      ["MappingSource", "source", "Variable mapping source"],
    ] as const
  ).map(
    ([claim, identifier, name]) =>
      [
        containedIn(
          sideOf(
            claim,
            "declaration",
            "itemDocument",
            identifier,
            "declarationKind",
            "declBaseType",
            "declCardinality",
          ),
          sideOf(
            "Declaration",
            "node",
            "document",
            "identifier",
            "declarationKind",
            "baseType",
            "cardinality",
          ),
        ),
        name,
      ] as const,
  ),
  ...[
    AssembledReference,
    DeclarationTable,
    Expression,
    ExpressionAttribute,
    ItemTiming,
    Literal,
    MappingLookup,
    MappingSource,
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
  [
    containedIn(sideOf("File", "package", "path"), sideOf("Entry", "package", "path")),
    "File exists",
  ],
  [
    containedIn(sideOf("ReferencePath", "package", "path"), sideOf("Entry", "package", "path")),
    "File exists",
  ],
  [
    containedIn(
      sideOf("ReferencePath", "document", "package"),
      sideOf("Document", "node", "package"),
    ),
    "Reference overlay",
  ],
  ...mirrored(
    sideOf("Reference", "node", "name", "document", "kind"),
    sideOf("ReferencePath", "node", "name", "document", "kind"),
  ).map((law) => [law, "Reference overlay"] as const),
  [keyOver(sideOf("Reference", "node", "name")), "Reference overlay"],
  [keyOver(sideOf("ReferencePath", "node")), "Reference overlay"],
  [
    containedIn(
      sideOf("Attribute", "node", "name", "lexical", "document", "kind"),
      sideOf("Reference", "node", "name", "lexical", "document", "kind"),
    ),
    "Reference overlay",
  ],
  [
    containedIn(sideOf("Reference", "node", "name"), sideOf("Attribute", "node", "name")),
    "Reference overlay",
  ],
  // Three keys over Attribute(node, name) share this identity: O3's over the attributes it reads
  // (interactions.ts), the reference census's (package.ts) and the SSML attributes' (identity.ts).
  // Each holds because an element holds one attribute of a name (XML 1.0 §3.1, Unique Att Spec),
  // so only an importer defect reaches one, and the one name all three report is E1 derived.
  [keyOver(sideOf("Attribute", "node", "name")), "E1 derived"],
  ...[Reference, ReferencePath].map(
    ({ name, primaryKey }) =>
      [
        { fields: primaryKey, kind: "primaryKey", relation: name } satisfies Law,
        "Reference overlay",
      ] as const,
  ),
  // The one MathML statement that reads as its own law: an application's head qualifier is a pair
  // MathML 3's §4.4 syntax tables list (`mathml-apply.ts`, reading R6-head-qualifiers). The rest of the
  // module is a restatement of the tree, "E1 derived", through lawGroups.
  [
    containedIn(
      sideOf("MathQualifier", "head", "kind"),
      sideOf("HeadQualifier", "head", "qualifier"),
    ),
    "MathML head qualifier",
  ],
  [primaryKeyOf("MathApply", "node"), "E1 derived"],
  [primaryKeyOf("MathArgument", "node"), "E1 derived"],
  [primaryKeyOf("MathQualifier", "node"), "E1 derived"],
  [primaryKeyOf("CnPartText", "node", "part"), "E1 derived"],
  [primaryKeyOf("MathCn", "node"), "E1 derived"],
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
 * Every statement value a group of {@link lawGroups} may hold, as grizzle's constructors build it.
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
const lawsOfStatement = (statement: Statement): readonly Law[] =>
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
 * The law groups a module exports, each with the one name all of its laws but its checks are
 * stated under, so a law the group gains is named with it.
 *
 * - **Tests** (`tests.ts`, Q5.13): every overlay's row, copies and families is "Test overlay"; the
 *   assembled test's instance tree is "Inclusion cycle", since no finite instance tree has one
 *   child per site under a cycle, which the deferred foreign key from `Instance` into
 *   `TestDocument.sites` refuses; its names are "Test name key"; its branch resolutions are "Branch
 *   target"; each item ref's target is "Item ref target". A row of {@link writtenLaws} names a law
 *   of a group otherwise: a section document's key and an href's entry ("Document entry"), a named
 *   element's key ("Structure identifier") and the required members ("Selection required"), a
 *   variable mapping's target key ("Variable mapping target"), a stimulus ref's key ("Stimulus ref
 *   key"), the item ref target's copy of its resolved path ("E1 derived"), an include's site into
 *   its document ("Include target") and its root's kind ("Include root"), the sites' count and
 *   context fold under their document and the assembled documents' copies ("E1 derived").
 * - **Metadata** (`metadata.ts`, Q5.12): every overlay's row, copy and family is a restatement, "E1
 *   derived"; a row of {@link writtenLaws} names the LOM identifier's and title's own containments
 *   ("LomObjectIdentifier", "LomObjectTitle").
 * - **Interactions** (`interactions.ts`, Q5.09): every copy and existence law is "E1 derived"; a row
 *   of {@link writtenLaws} names the binding laws, the choices' nearest interaction and keys, the
 *   content references and the variable references' copy.
 * - **Mapping** (`mapping.ts`, Q5.11): every overlay's row, copy and typed mirror is "Mapping
 *   overlay"; a row of {@link writtenLaws} names the map keys' keys ("Map key") and the mappable
 *   base type's containment.
 * - **Expressions** (`expressions.ts`, Q5.10): every copy, fold and family is "E1 derived"; a row of
 *   {@link writtenLaws} names a variable's declaration ("Variable declared"), a prefixed
 *   reference's one resolving reading ("Prefixed reference"), the kinds of declaration a reference
 *   may name ("Variable kind"), and the declaration and item a template default or a variable
 *   mapping's source claims ("Template default target", "Variable mapping source").
 * - **Quotation** (`quotation.ts`, reading 127): every copy, key and containment is a restatement of
 *   the `q`'s node, its slot and its neighbours' ends, "E1 derived"; its law is its check,
 *   "Quotation punctuation".
 * - **MathML** (`mathml.ts`, reading 2): each statement of its four families is a restatement, "E1
 *   derived", and a row of {@link writtenLaws} names a law of a group otherwise: the apply family's
 *   head qualifier containment ("MathML head qualifier"; its check is "MathML arity"), which the
 *   group leaves out, so that every law a group holds keeps the group's name.
 */
export const lawGroups: readonly (readonly [readonly Statement[], LawName])[] = [
  [testOverlayLaws, "Test overlay"],
  [inclusionLaws, "Inclusion cycle"],
  [testNameLaws, "Test name key"],
  [branchLaws, "Branch target"],
  [itemRefLaws, "Item ref target"],
  [metadataLaws, "E1 derived"],
  [interactionLaws, "E1 derived"],
  [mappingLaws, "Mapping overlay"],
  [expressionLaws, "E1 derived"],
  [quotationLaws, "E1 derived"],
  [mathmlLaws.filter((statement) => statement !== headQualifierLaw), "E1 derived"],
];

/**
 * The identities two statements share while their owners name them by two laws, so no row or group
 * may name them and the census lists them until their sides differ. None stands today: Q5.09 gave
 * the strings a multiple extended text requires (`max-strings-required`) the term `kind`, apart
 * from the single-count binding (`binding-fit`), and identity.ts reads "SSML trim mark" from its
 * speak's `node`, apart from "SSML lexicon reference"'s `fragment`.
 */
export const contestedIdentities: ReadonlySet<string> = new Set<string>();

/**
 * Every law the schema states that is no check, each as its outcome names it, with its name in
 * {@link lawTable}: {@link writtenLaws}, then every law of {@link lawGroups} they do not name and no
 * two owners contest ({@link contestedIdentities}), each once.
 */
export const statedLaws: readonly (readonly [Law, LawName])[] = Arr.dedupeWith(
  [
    ...writtenLaws,
    ...lawGroups.flatMap(([statements, name]) =>
      statements
        .flatMap(lawsOfStatement)
        .filter((law) => !contestedIdentities.has(lawIdentity(law)))
        .map((law) => [law, name] as const),
    ),
  ],
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
 * is left out, so the rule is the most specific of the others; the census in `refusal.test.ts`
 * keeps every law the schema states in the table.
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
 * How a database refusal names the row that broke its laws, the kind of its {@link RefusalWitness}:
 * `key`, grizzle's key witness, the violating row's key fields; `row`, the row the caller located,
 * such as a test's locator; `unreported`, no row, for a constraint PostgreSQL reports by its name
 * alone.
 */
export const WitnessKind = Schema.Literals(["key", "row", "unreported"]);

/**
 * The package was refused under one rule of the roster.
 *
 * `detail` says what broke it. `laws` are the schema's laws as grizzle reported them, `sources`
 * where each is stated and `witness` how the refusal names the row that broke them, all three
 * present when the database refused the apply, so a reader that tells the user where to look reads
 * the witness's kind rather than the detail's wording.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  laws: Schema.optional(Schema.Unknown),
  rule: ImportRule,
  sources: Schema.optional(Schema.Array(Schema.String)),
  witness: Schema.optional(WitnessKind),
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
 * refusal. It is a defect of this module's table, which the census in `refusal.test.ts` keeps
 * whole, never a verdict on the package.
 */
export class UnownedLaws extends Schema.TaggedError<UnownedLaws>()("UnownedLaws", {
  laws: Schema.Array(Schema.String),
}) {
  /**
   * The laws, and the repair.
   */
  override get message(): string {
    return `No rule owns the laws ${this.laws.join("; ")}. Add each to statedLaws in src/import/refusal.ts under the law it states, and run the census in refusal.test.ts.`;
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

      return Result.succeed(
        new ImportRefused({ detail, laws, rule, sources, witness: witness.kind }),
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
      NotQti3: (refused) => new ImportRefused({ detail: refused.message, rule: "not-qti3" }),
      PackageReadError: (refused) =>
        new ImportRefused({
          detail: refused.message,
          rule: refused.rule === "manifest-root" ? "manifest-root" : "href-path",
        }),
      ReaderRefusal: (refused) =>
        new ImportRefused({ detail: `${refused.rule}: ${refused.detail}`, rule: "reader-refusal" }),
      UnmodeledVocabulary: (refused) =>
        new ImportRefused({
          detail: refused.message,
          rule: refused.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary",
        }),
      WellFormednessError: (refused) =>
        new ImportRefused({
          detail: `${refused.message} at line ${String(refused.line)}, column ${String(refused.column)}`,
          rule: "well-formedness",
        }),
      ZipRefusal: (refused) => new ImportRefused({ detail: refused.message, rule: refused.rule }),
    }),
  );
