/**
 * The `Qti` schema's stored level, `QtiBase`, composed by name: every roster and closed relation
 * `install.ts` declares, every stored relation of the `src/qti/` modules, and every module's laws
 * over them, each array once (plan §1.1, the W5 amendment's §C), and an install's single-CDN laws
 * where its policy states them (`#pantry/qti/cdn.ts`). `Qti` (`#pantry/qti/schema.ts`) is the level
 * over it that names the queries its rules read (`#pantry/qti/queries.ts`).
 *
 * Loading this module builds no schema: {@link qtiBaseOf} builds one where it is called, each call
 * its own, and the caller holds it (`#pantry/qti/own.ts` for this package's own install).
 *
 * No relation is `mutable`: qti-pie writes each package once, every owner inserted with its whole
 * family in one ChangeSet step (the W5 amendment's A). A module joins the composition when it
 * lands; `schema.test.ts` lists the modules composed and checks each law array is here once.
 */
import { schema } from "@bjornpagen/grizzle";
import {
  AnonymousType,
  AttributeCountOf,
  AttributeGrammar,
  AttributeModel,
  AttributeModelOf,
  AttributeName,
  AttributeSlot,
  AttributeSlotOf,
  AttributeSlots,
  Banned,
  BarredOf,
  BaseType,
  BaseTypeLexical,
  BindingFit,
  BoundFacet,
  BoundZero,
  BuiltIn,
  BuiltInVariable,
  Capped,
  Cardinality,
  CardinalityLexical,
  ChildGrammar,
  ChoiceBound,
  ChoiceCount,
  CnBase,
  CnForm,
  CnPart,
  CnPartForm,
  CnParts,
  CnPattern,
  CnType,
  ContentModel,
  ContentModelOf,
  ContentReference,
  CountedOf,
  CountedSlot,
  DeclarationKind,
  Declares,
  DocumentType,
  DomainPrimitive,
  DoubleBound,
  Enters,
  Flag,
  FollowMember,
  FollowSet,
  FollowSetOf,
  GoverningOf,
  Governor,
  HeadQualifier,
  HeldRootsUnder,
  Identity,
  IncludeParent,
  IncludeParentKind,
  IncludeRoot,
  KindByNameUnder,
  KindGovernor,
  KindNamespace,
  Last,
  MappableBaseType,
  MathArity,
  MathHeadOperator,
  ModelPositions,
  Needs,
  NodeKind,
  OperatorArity,
  Position,
  RecordBindingFit,
  ReferenceAttribute,
  ReferenceForm,
  ReferenceSpelling,
  Required,
  ResourceDocumentType,
  ResourceType,
  ResourceTypeLexical,
  RootOfType,
  SchemaVersion,
  SectionPart,
  SharedModel,
  SharedModelOf,
  SharedPositions,
  StrictlyHeld,
  Symbol,
  TextDomain,
  TypeAvailable,
  TypeName,
  Use,
  ValueDomain,
  ValueDomainOf,
  ValueIdentity,
  VariableReference,
  XsiType,
} from "#pantry/grammar/install.ts";
import {
  Attribute,
  AttributeEntity,
  attributeLaws,
  Idref,
  OpenAttributeName,
} from "#pantry/qti/attributes.ts";
import {
  Comment,
  chardataLaws,
  Doctype,
  Document,
  EncodingDecl,
  Namespace,
  OpenElementName,
  OpenElementType,
  Pi,
  SdDecl,
  XmlDecl,
  XmlStandalone,
} from "#pantry/qti/chardata.ts";
import {
  Declaration,
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
  declarationLaws,
  DeclarationName,
  FieldValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  TypedValue,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
} from "#pantry/qti/declarations.ts";
import type { cdnLawsByName } from "#pantry/qti/cdn.ts";
import { catalogLaws, catalogRelations } from "#pantry/qti/catalog.ts";
import { htmlLaws, htmlRelations } from "#pantry/qti/html.ts";
import { identityLaws, identityRelations } from "#pantry/qti/identity.ts";
import { interactionLaws, interactionRelations } from "#pantry/qti/interactions.ts";
import {
  AreaMapping,
  AreaMappingCardinality,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyItems,
  MapKeyType,
  Mapping,
  MappingBaseType,
  MappingCardinality,
  mappingLaws,
  LookupTable,
} from "#pantry/qti/mapping.ts";
import { metadataLaws, metadataRelations } from "#pantry/qti/metadata.ts";
import {
  BaseTypePattern,
  Language,
  LeadCardinality,
  OperandBase,
  ReadingForm,
  ReadingSource,
  ReferenceBase,
  ReferenceDeclaration,
  ReferencedTable,
  ReferenceResolution,
  ReferenceRole,
  ResultBase,
  ResultCardinality,
  RpTemplate,
  TableReader,
  TailCardinality,
  ValueBase,
  ValueBaseBit,
  ValueBaseForm,
  ValueBaseOf,
  ValueCardinality,
  ValueCardinalityBit,
  ValueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import {
  Expression,
  ExpressionAttribute,
  expressionLaws,
  Literal,
  LiteralTyped,
  Operand,
  Processing,
  ProcessingTemplate,
  referenceRelations,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import { ElementType, Node, nodeLaws } from "#pantry/qti/node.ts";
import { mathmlLaws, mathmlRelations } from "#pantry/qti/mathml.ts";
import { operatorLaws, operatorRelations } from "#pantry/qti/operators.ts";
import {
  Dependency,
  DependencyTarget,
  Entry,
  File,
  FileHref,
  HrefScope,
  ManifestId,
  ManifestIdSpace,
  Package,
  packageLaws,
  Reference,
  ReferencePath,
  Resource,
  ResourceDocument,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceTyped,
  TextReference,
  TextReferencePath,
} from "#pantry/qti/package.ts";
import { quotationLaws, quotationRelations } from "#pantry/qti/quotation.ts";
import { testLaws, testRelations } from "#pantry/qti/tests.ts";

/**
 * The rosters `install.ts` declares: each a closed id's code space, read as codes, never a table.
 */
const grammarRosters = {
  AttributeModel,
  AttributeName,
  AttributeSlot,
  BaseType,
  BoundFacet,
  BoundZero,
  BuiltIn,
  Cardinality,
  CnBase,
  CnPart,
  CnPartForm,
  CnType,
  ContentModel,
  DeclarationKind,
  DocumentType,
  DomainPrimitive,
  Flag,
  FollowSet,
  Governor,
  Identity,
  IncludeParent,
  NodeKind,
  Position,
  ReferenceForm,
  ReferenceSpelling,
  ResourceType,
  SchemaVersion,
  SharedModel,
  TypeName,
  Use,
  ValueDomain,
};

/**
 * The closed relations `install.ts` declares: the grammar's rows, installed as constants only where
 * a law or a generated field reads them.
 */
const grammarRelations = {
  AnonymousType,
  AttributeCountOf,
  AttributeGrammar,
  AttributeModelOf,
  AttributeSlotOf,
  AttributeSlots,
  Banned,
  BarredOf,
  BaseTypeLexical,
  BindingFit,
  BuiltInVariable,
  Capped,
  CardinalityLexical,
  ChildGrammar,
  ChoiceBound,
  ChoiceCount,
  CnForm,
  CnParts,
  CnPattern,
  ContentModelOf,
  ContentReference,
  CountedOf,
  CountedSlot,
  Declares,
  DoubleBound,
  Enters,
  FollowMember,
  FollowSetOf,
  GoverningOf,
  HeadQualifier,
  HeldRootsUnder,
  IncludeParentKind,
  IncludeRoot,
  KindByNameUnder,
  KindGovernor,
  KindNamespace,
  Last,
  MappableBaseType,
  MathArity,
  MathHeadOperator,
  ModelPositions,
  Needs,
  OperatorArity,
  RecordBindingFit,
  ReferenceAttribute,
  Required,
  ResourceDocumentType,
  ResourceTypeLexical,
  RootOfType,
  SectionPart,
  SharedModelOf,
  SharedPositions,
  StrictlyHeld,
  Symbol,
  TextDomain,
  TypeAvailable,
  ValueDomainOf,
  ValueIdentity,
  VariableReference,
  XsiType,
};

/**
 * `node.ts`'s relations: every node of every document, and each vocabulary element's named
 * governing type.
 */
const nodeRelations = { ElementType, Node };

/**
 * `chardata.ts`'s relations and roster: character data, documents, namespaces and foreign names.
 */
const chardataRelations = {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  Namespace,
  OpenElementName,
  OpenElementType,
  Pi,
  SdDecl,
  XmlDecl,
  XmlStandalone,
};

/**
 * `attributes.ts`'s relations: every attribute, its IDREF tokens, its entity references and its
 * open name.
 */
const attributeRelations = {
  Attribute,
  AttributeEntity,
  Idref,
  OpenAttributeName,
};

/**
 * `package.ts`'s relations: the package, its entries, the manifest's resources, files and
 * dependencies, the hrefs that tie them, and each document's references with the entries they
 * resolve to, each href's outcome read under the `HrefScope` roster.
 */
const packageRelations = {
  Dependency,
  DependencyTarget,
  Entry,
  File,
  FileHref,
  HrefScope,
  ManifestId,
  ManifestIdSpace,
  Package,
  Reference,
  ReferencePath,
  Resource,
  ResourceDocument,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceTyped,
  TextReference,
  TextReferencePath,
};

/**
 * `declarations.ts`'s relations: each variable's declaration, its cardinality, its base type, its
 * identifier and its name, its value sets and values, each set beside its declaration's
 * cardinality, a value's text beside its declaration's base type, a value's own base type and its
 * text beside it, a record's fields and their names, and an outcome's mastery value and normal
 * range, each end and each pair of them.
 */
const declarationRelations = {
  Declaration,
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
  DeclarationName,
  FieldValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  TypedValue,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
};

/**
 * `mapping.ts`'s relations: each response mapping, its declaration's base type and its map keys,
 * each beside that base type, with each two-item key's split (every typed key's value is a query,
 * `#pantry/qti/queries.ts`), each area mapping, each outcome's lookup table and its tables' typed
 * values, each beside its declaration's base type, and each mapping, area mapping and lookup table
 * beside its declaration's cardinality.
 */
const mappingRelations = {
  AreaMapping,
  AreaMappingCardinality,
  LookupTable,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyItems,
  MapKeyType,
  Mapping,
  MappingBaseType,
  MappingCardinality,
};

/**
 * `expression-types.ts`'s rosters and closed relations, the expression-typing codes and the
 * per-kind typing, and `expressions.ts`'s relations: every expression and its operands, every rule
 * and its language, every processing reference, the attributes and text an expression's type
 * follows from, and a response processing's published template; and the readings of a test's
 * references with the lookups they read (`referenceRelations`).
 */
const expressionRelations = {
  ...referenceRelations,
  BaseTypePattern,
  Expression,
  ExpressionAttribute,
  Language,
  LeadCardinality,
  Literal,
  LiteralTyped,
  Operand,
  OperandBase,
  Processing,
  ProcessingTemplate,
  ReadingForm,
  ReadingSource,
  ReferenceBase,
  ReferenceDeclaration,
  ReferenceResolution,
  ReferenceRole,
  ReferencedTable,
  ResultBase,
  ResultCardinality,
  RpTemplate,
  TableReader,
  TailCardinality,
  ValueBase,
  ValueBaseBit,
  ValueBaseForm,
  ValueBaseOf,
  ValueCardinality,
  ValueCardinalityBit,
  ValueCardinalityOf,
  VariableRef,
};

/**
 * One statement of any module, as its module states it. Written as a type, the union is reduced by
 * identity alone: an array literal of every module's statements would ask the checker to reduce it
 * by subtype, which past about a thousand statement types it refuses as too complex (TS2590).
 */
type QtiStatement =
  | (typeof nodeLaws)[number]
  | (typeof chardataLaws)[number]
  | (typeof attributeLaws)[number]
  | (typeof packageLaws)[number]
  | (typeof identityLaws)[number]
  | (typeof declarationLaws)[number]
  | (typeof testLaws)[number]
  | (typeof mappingLaws)[number]
  | (typeof interactionLaws)[number]
  | (typeof expressionLaws)[number]
  | (typeof metadataLaws)[number]
  | (typeof htmlLaws)[number]
  | (typeof quotationLaws)[number]
  | (typeof operatorLaws)[number]
  | (typeof mathmlLaws)[number]
  | (typeof catalogLaws)[number]
  | NonNullable<CdnStatements[keyof CdnStatements]>[number];

/**
 * The single-CDN laws a policy states, by name (`#pantry/qti/cdn.ts`).
 */
type CdnStatements = ReturnType<typeof cdnLawsByName>;

/**
 * Every module's statements, in module order, each module's list one element: a list of lists
 * holds sixteen types, where a list literal of every statement would hold them all.
 */
const moduleLaws: readonly (readonly QtiStatement[])[] = [
  nodeLaws,
  chardataLaws,
  attributeLaws,
  packageLaws,
  identityLaws,
  declarationLaws,
  testLaws,
  mappingLaws,
  interactionLaws,
  expressionLaws,
  metadataLaws,
  htmlLaws,
  quotationLaws,
  operatorLaws,
  mathmlLaws,
  catalogLaws,
];

/**
 * The relations of the QTI 3.0 schema: the grammar's rosters and closed relations, then each
 * module's relations, each under its own name. A scratch schema of a test reads them here, with no
 * schema built.
 */
export const qtiRelations = {
  ...grammarRosters,
  ...grammarRelations,
  ...nodeRelations,
  ...chardataRelations,
  ...attributeRelations,
  ...packageRelations,
  ...identityRelations,
  ...declarationRelations,
  ...testRelations,
  ...mappingRelations,
  ...interactionRelations,
  ...expressionRelations,
  ...metadataRelations,
  ...htmlRelations,
  ...quotationRelations,
  ...operatorRelations,
  ...mathmlRelations,
  ...catalogRelations,
};

/**
 * Build the stored level of the QTI 3.0 schema for a single-CDN install's laws: the relations and
 * every module's laws, then the policy's. Its name, `Qti`, names the installation: its PostgreSQL
 * schema, which holds every table, and its migrations folder, `migrations/qti/`.
 *
 * @param cdnLaws - The policy's laws, none for no policy.
 * @returns The stored level.
 */
export const qtiBaseOf = (cdnLaws: readonly QtiStatement[]) =>
  schema("Qti", qtiRelations, [...moduleLaws, cdnLaws].flat());

/**
 * The stored level of the QTI 3.0 schema, whatever policy built it: every policy's holds the same
 * relations, and its statements are every module's, then the policy's.
 */
export type QtiBase = ReturnType<typeof qtiBaseOf>;
