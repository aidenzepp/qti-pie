/**
 * The `Qti` schema, composed by name: every roster and closed relation `install.ts` declares, every
 * stored relation of the `src/qti/` modules, and every module's laws, each array once (plan §1.1,
 * the W5 amendment's §C).
 *
 * No relation is `mutable`: qti-pie writes each package once, every owner inserted with its whole
 * family in one ChangeSet step (the W5 amendment's A). A module joins the composition when it
 * lands; `schema.test.ts` lists the modules composed and checks each law array is here once.
 */
import { schema } from "@bjornpagen/grizzle";
import {
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
  ContentModel,
  ContentModelOf,
  ContentReference,
  CountedOf,
  DeclarationKind,
  Declares,
  DomainPrimitive,
  DoubleBound,
  Enters,
  Flag,
  Follow,
  GoverningOf,
  Governor,
  HeldRootsUnder,
  Identity,
  IncludeParent,
  IncludeParentKind,
  IncludeRoot,
  KindByNameUnder,
  KindNamespace,
  Last,
  MappableBaseType,
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
  DoubleValue,
  attributeLaws,
  Idref,
  OpenAttributeName,
  TextDoubleValue,
} from "#pantry/qti/attributes.ts";
import {
  Comment,
  chardataLaws,
  Doctype,
  Document,
  EncodingDecl,
  Namespace,
  OpenElementName,
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
  DeclaredValue,
  FieldValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
} from "#pantry/qti/declarations.ts";
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
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
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
import { Node, nodeLaws } from "#pantry/qti/node.ts";
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
  NamedHref,
  Package,
  packageLaws,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceTyped,
  TypedHref,
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
  ContentModel,
  DeclarationKind,
  DomainPrimitive,
  Flag,
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
  ContentModelOf,
  ContentReference,
  CountedOf,
  Declares,
  DoubleBound,
  Enters,
  Follow,
  GoverningOf,
  HeldRootsUnder,
  IncludeParentKind,
  IncludeRoot,
  KindByNameUnder,
  KindNamespace,
  Last,
  MappableBaseType,
  ModelPositions,
  Needs,
  OperatorArity,
  RecordBindingFit,
  ReferenceAttribute,
  Required,
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
 * `node.ts`'s relation: every node of every document.
 */
const nodeRelations = { Node };

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
  Pi,
  SdDecl,
  XmlDecl,
  XmlStandalone,
};

/**
 * `attributes.ts`'s relations: every attribute, its IDREF tokens, its entity references, its open
 * name and its typed value.
 */
const attributeRelations = {
  Attribute,
  AttributeEntity,
  DoubleValue,
  Idref,
  OpenAttributeName,
  TextDoubleValue,
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
  NamedHref,
  Package,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceTyped,
  TypedHref,
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
  DeclaredValue,
  FieldValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
};

/**
 * `mapping.ts`'s relations: each response mapping, its declaration's base type and its map keys,
 * each beside that base type, with the typed values of its integer, float, point, pair and
 * directed pair keys, each area mapping, each outcome's lookup table and its tables' typed values,
 * each beside its declaration's base type, and each mapping, area mapping and lookup table beside
 * its declaration's cardinality.
 */
const mappingRelations = {
  AreaMapping,
  AreaMappingCardinality,
  LookupTable,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
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
  | (typeof operatorLaws)[number];

/**
 * Every module's statements, in module order, each module's list one element: a list of lists
 * holds fourteen types, where a list literal of every statement would hold them all.
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
];

/**
 * Every module's statements, in module order.
 */
const qtiLaws = moduleLaws.flat();

/**
 * The QTI 3.0 schema: the grammar's rosters and closed relations, then each module's relations,
 * each under its own name, and every module's laws.
 */
export const Qti = schema(
  "Qti",
  {
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
  },
  qtiLaws,
);
