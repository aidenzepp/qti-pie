/**
 * Every overlay builder's rows of one package, merged into one keyed set per relation (plan W5,
 * Q5.15; §C's `overlayRowsOf`).
 *
 * Each builder (`#pantry/import/overlays/<family>.ts`) reads one document's tree under the ids its
 * rows are written under and returns each of its relations' rows as a `ReadonlyMap` from the text
 * of a row's key to the row. The merge keeps them a set (rule 0): a key met twice with one value is
 * one row, and a key met twice with two values is a defect of the builders, reported as an
 * {@link OverlayConflict} and never overwritten.
 *
 * Five builders also read the whole package: the tests' assemblies (Q5.13), what each test reads
 * of the documents it places and what each item ref names (Q5.10's, PE's), the sections'
 * placements under each test (Q5.09), the LOM records' objects (Q5.12) and the LOM languages'
 * witnesses (Q5.07). A builder joins {@link overlayRowsOf} when its module joins the schema
 * (`#pantry/qti/schema.ts`): a ChangeSet over the author role writes only the relations the schema
 * holds.
 */
/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { Equal, Formatter, Result, Schema } from "effect";
import { rowsOf as declarationRowsOf } from "#pantry/import/overlays/declarations.ts";
import type { DeclarationRows } from "#pantry/import/overlays/declarations.ts";
import {
  assembledExpressionRowsOf,
  rowsOf as expressionRowsOf,
  placedVariableRowsOf,
} from "#pantry/import/overlays/expressions.ts";
import type {
  AssembledExpressionRows,
  ExpressionRows,
  PlacedVariableRows,
} from "#pantry/import/overlays/expressions.ts";
import { rowsOf as htmlRowsOf } from "#pantry/import/overlays/html.ts";
import type { HtmlRows } from "#pantry/import/overlays/html.ts";
import {
  languageRowsOf,
  placedIdRowsOf,
  placedLanguageRowsOf,
  rowsOf as identityRowsOf,
} from "#pantry/import/overlays/identity.ts";
import type {
  IdentityRows,
  LanguageRows,
  PlacedIdRows,
  PlacedLanguageRows,
} from "#pantry/import/overlays/identity.ts";
import {
  rowsOf as interactionRowsOf,
  placedBindingRowsOf,
  sectionRowsOf,
} from "#pantry/import/overlays/interactions.ts";
import type {
  InteractionRows,
  PlacedBindingRows,
  SectionRows,
} from "#pantry/import/overlays/interactions.ts";
import { rowsOf as mappingRowsOf } from "#pantry/import/overlays/mapping.ts";
import type { MappingRows } from "#pantry/import/overlays/mapping.ts";
import { rowsOf as metadataRowsOf, objectRowsOfPackage } from "#pantry/import/overlays/metadata.ts";
import type { MetadataRows, NamedDocument, ObjectRows } from "#pantry/import/overlays/metadata.ts";
import { rowsOf as operatorRowsOf } from "#pantry/import/overlays/operators.ts";
import type { OperatorRows } from "#pantry/import/overlays/operators.ts";
import {
  noPackageRows,
  rowsOf as packageRowsOf,
  referenceCensus,
  referenceRowsOf,
} from "#pantry/import/overlays/package.ts";
import type { PackageRows, ReferenceRows } from "#pantry/import/overlays/package.ts";
import { rowsOf as quotationRowsOf } from "#pantry/import/overlays/quotation.ts";
import type { QuotationRows } from "#pantry/import/overlays/quotation.ts";
import { assembledRowsOf, rowsOf as testRowsOf } from "#pantry/import/overlays/tests.ts";
import type { AssembledRows, TestRows } from "#pantry/import/overlays/tests.ts";
import type { ListedDocument, NodeIds } from "#pantry/import/write.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { manifestPath } from "#pantry/qti/package.ts";

/**
 * Every overlay's rows of a package, one keyed set per relation: each document builder's, and the
 * four a package's documents build together.
 */
export type OverlayRows = AssembledExpressionRows &
  AssembledRows &
  DeclarationRows &
  ExpressionRows &
  HtmlRows &
  IdentityRows &
  InteractionRows &
  LanguageRows &
  MappingRows &
  MetadataRows &
  ObjectRows &
  OperatorRows &
  PackageRows &
  PlacedBindingRows &
  PlacedIdRows &
  PlacedLanguageRows &
  PlacedVariableRows &
  QuotationRows &
  ReferenceRows &
  SectionRows &
  TestRows;

/**
 * One document's rows from every document builder.
 */
interface DocumentRows {
  readonly declarations: DeclarationRows;
  readonly expressions: ExpressionRows;
  readonly html: HtmlRows;
  readonly identity: IdentityRows;
  readonly interactions: InteractionRows;
  readonly mapping: MappingRows;
  readonly metadata: MetadataRows;
  readonly operators: OperatorRows;
  readonly package: PackageRows;
  readonly quotation: QuotationRows;
  readonly references: ReferenceRows;
  readonly tests: TestRows;
}

/**
 * Run every document builder over one document: each finds the elements its overlays describe by
 * their kind, so a document that holds none gives it no row. The manifest overlays are the
 * package manifest's alone (`noPackageRows`): `rowsOf` of `#pantry/import/overlays/package.ts`
 * reads the manifest's tree, and a `cp:*` element of another document is no part of the package.
 *
 * @param document - The document, listed, under its ids.
 * @param document.ids - Its ids.
 * @param document.listed - The document as listed.
 * @returns Every builder's rows.
 */
const documentRowsOf = ({
  ids,
  listed: { path, tree },
}: {
  readonly ids: NodeIds;
  readonly listed: ListedDocument;
}): DocumentRows => ({
  declarations: declarationRowsOf(tree, ids),
  expressions: expressionRowsOf(tree, ids),
  html: htmlRowsOf(tree, ids),
  identity: identityRowsOf(tree, ids),
  interactions: interactionRowsOf(tree, ids),
  mapping: mappingRowsOf(tree, ids),
  metadata: metadataRowsOf(tree, ids),
  operators: operatorRowsOf(tree, ids),
  package: path === manifestPath ? packageRowsOf(tree, ids) : noPackageRows,
  quotation: quotationRowsOf(tree, ids),
  references: referenceRowsOf(tree, ids, referenceCensus),
  tests: testRowsOf(tree, ids),
});

/**
 * Two rows of one relation at one key that differ: a defect of the builders, which give one fact
 * per key, never something to overwrite.
 */
export class OverlayConflict extends Schema.TaggedError<OverlayConflict>()("OverlayConflict", {
  first: Schema.String,
  key: Schema.String,
  relation: Schema.String,
  second: Schema.String,
}) {
  /**
   * The relation, the key, both rows, and the repair.
   */
  override get message(): string {
    return `Two builders give ${this.relation} two different rows at the key ${this.key}: ${this.first} and ${this.second}. A key names one fact, so correct the builder that wrote the wrong row; the importer keeps neither.`;
  }
}

/**
 * Union one relation's keyed sets: a key met in several sets with equal rows (Effect's structural
 * equality) is one row, the first set's.
 *
 * @param relation - The relation's name, for the conflict.
 * @param sets - Its keyed sets, those a part gives it, in the parts' order.
 * @returns The union; or the {@link OverlayConflict} of the first key, in the sets' order, met
 *   with two different rows.
 */
export const unionOf = <Row>(
  relation: string,
  sets: readonly (ReadonlyMap<string, Row> | undefined)[],
): Result.Result<ReadonlyMap<string, Row>, OverlayConflict> => {
  const union = new Map<string, Row>();
  for (const set of sets) {
    for (const [key, row] of set ?? []) {
      const held = union.get(key);
      if (held === undefined) {
        union.set(key, row);
      } else if (!Equal.equals(held, row)) {
        return Result.fail(
          new OverlayConflict({
            first: Formatter.format(held),
            key,
            relation,
            second: Formatter.format(row),
          }),
        );
      }
    }
  }

  return Result.succeed(union);
};

/**
 * Union every part's keyed sets, relation by relation: {@link unionOf} of each relation of
 * {@link OverlayRows}. The record names every relation, so a builder whose rows join the type and
 * not the record is a type error here.
 *
 * @param parts - The builders' rows, each holding some of the relations.
 * @returns Every relation's union; or the first relation's {@link OverlayConflict}.
 */
const mergedOf = (
  parts: readonly Partial<OverlayRows>[],
): Result.Result<OverlayRows, OverlayConflict> =>
  Result.all({
    AreaMapping: unionOf(
      "AreaMapping",
      parts.map(({ AreaMapping: rows }) => rows),
    ),
    AriaElement: unionOf(
      "AriaElement",
      parts.map(({ AriaElement: rows }) => rows),
    ),
    AriaRange: unionOf(
      "AriaRange",
      parts.map(({ AriaRange: rows }) => rows),
    ),
    AriaValue: unionOf(
      "AriaValue",
      parts.map(({ AriaValue: rows }) => rows),
    ),
    AssembledId: unionOf(
      "AssembledId",
      parts.map(({ AssembledId: rows }) => rows),
    ),
    AssembledLang: unionOf(
      "AssembledLang",
      parts.map(({ AssembledLang: rows }) => rows),
    ),
    AssembledName: unionOf(
      "AssembledName",
      parts.map(({ AssembledName: rows }) => rows),
    ),
    AssembledReference: unionOf(
      "AssembledReference",
      parts.map(({ AssembledReference: rows }) => rows),
    ),
    AssessmentObject: unionOf(
      "AssessmentObject",
      parts.map(({ AssessmentObject: rows }) => rows),
    ),
    Binding: unionOf(
      "Binding",
      parts.map(({ Binding: rows }) => rows),
    ),
    BindingName: unionOf(
      "BindingName",
      parts.map(({ BindingName: rows }) => rows),
    ),
    BoundVariable: unionOf(
      "BoundVariable",
      parts.map(({ BoundVariable: rows }) => rows),
    ),
    BranchResolution: unionOf(
      "BranchResolution",
      parts.map(({ BranchResolution: rows }) => rows),
    ),
    BranchRule: unionOf(
      "BranchRule",
      parts.map(({ BranchRule: rows }) => rows),
    ),
    CellHeaders: unionOf(
      "CellHeaders",
      parts.map(({ CellHeaders: rows }) => rows),
    ),
    Choice: unionOf(
      "Choice",
      parts.map(({ Choice: rows }) => rows),
    ),
    ChoiceVariableName: unionOf(
      "ChoiceVariableName",
      parts.map(({ ChoiceVariableName: rows }) => rows),
    ),
    ContextRef: unionOf(
      "ContextRef",
      parts.map(({ ContextRef: rows }) => rows),
    ),
    CountBound: unionOf(
      "CountBound",
      parts.map(({ CountBound: rows }) => rows),
    ),
    Declaration: unionOf(
      "Declaration",
      parts.map(({ Declaration: rows }) => rows),
    ),
    DeclarationTable: unionOf(
      "DeclarationTable",
      parts.map(({ DeclarationTable: rows }) => rows),
    ),
    Dependency: unionOf(
      "Dependency",
      parts.map(({ Dependency: rows }) => rows),
    ),
    DocumentGenerals: unionOf(
      "DocumentGenerals",
      parts.map(({ DocumentGenerals: rows }) => rows),
    ),
    DocumentId: unionOf(
      "DocumentId",
      parts.map(({ DocumentId: rows }) => rows),
    ),
    DocumentLang: unionOf(
      "DocumentLang",
      parts.map(({ DocumentLang: rows }) => rows),
    ),
    Expression: unionOf(
      "Expression",
      parts.map(({ Expression: rows }) => rows),
    ),
    ExpressionAttribute: unionOf(
      "ExpressionAttribute",
      parts.map(({ ExpressionAttribute: rows }) => rows),
    ),
    FeedbackRef: unionOf(
      "FeedbackRef",
      parts.map(({ FeedbackRef: rows }) => rows),
    ),
    File: unionOf(
      "File",
      parts.map(({ File: rows }) => rows),
    ),
    FileHref: unionOf(
      "FileHref",
      parts.map(({ FileHref: rows }) => rows),
    ),
    FragmentValue: unionOf(
      "FragmentValue",
      parts.map(({ FragmentValue: rows }) => rows),
    ),
    GeneralLang: unionOf(
      "GeneralLang",
      parts.map(({ GeneralLang: rows }) => rows),
    ),
    GeneralNamed: unionOf(
      "GeneralNamed",
      parts.map(({ GeneralNamed: rows }) => rows),
    ),
    GeneralObject: unionOf(
      "GeneralObject",
      parts.map(({ GeneralObject: rows }) => rows),
    ),
    Hotspot: unionOf(
      "Hotspot",
      parts.map(({ Hotspot: rows }) => rows),
    ),
    Hottext: unionOf(
      "Hottext",
      parts.map(({ Hottext: rows }) => rows),
    ),
    IdBinding: unionOf(
      "IdBinding",
      parts.map(({ IdBinding: rows }) => rows),
    ),
    IdentityText: unionOf(
      "IdentityText",
      parts.map(({ IdentityText: rows }) => rows),
    ),
    IdrefTarget: unionOf(
      "IdrefTarget",
      parts.map(({ IdrefTarget: rows }) => rows),
    ),
    Inclusion: unionOf(
      "Inclusion",
      parts.map(({ Inclusion: rows }) => rows),
    ),
    Instance: unionOf(
      "Instance",
      parts.map(({ Instance: rows }) => rows),
    ),
    InstanceName: unionOf(
      "InstanceName",
      parts.map(({ InstanceName: rows }) => rows),
    ),
    InteractionAttribute: unionOf(
      "InteractionAttribute",
      parts.map(({ InteractionAttribute: rows }) => rows),
    ),
    InterpolationTable: unionOf(
      "InterpolationTable",
      parts.map(({ InterpolationTable: rows }) => rows),
    ),
    ItemMode: unionOf(
      "ItemMode",
      parts.map(({ ItemMode: rows }) => rows),
    ),
    ItemRefDocument: unionOf(
      "ItemRefDocument",
      parts.map(({ ItemRefDocument: rows }) => rows),
    ),
    ItemRefTarget: unionOf(
      "ItemRefTarget",
      parts.map(({ ItemRefTarget: rows }) => rows),
    ),
    ItemTiming: unionOf(
      "ItemTiming",
      parts.map(({ ItemTiming: rows }) => rows),
    ),
    LabelUse: unionOf(
      "LabelUse",
      parts.map(({ LabelUse: rows }) => rows),
    ),
    Literal: unionOf(
      "Literal",
      parts.map(({ Literal: rows }) => rows),
    ),
    LomEntry: unionOf(
      "LomEntry",
      parts.map(({ LomEntry: rows }) => rows),
    ),
    LomGeneral: unionOf(
      "LomGeneral",
      parts.map(({ LomGeneral: rows }) => rows),
    ),
    LomLanguage: unionOf(
      "LomLanguage",
      parts.map(({ LomLanguage: rows }) => rows),
    ),
    LomObject: unionOf(
      "LomObject",
      parts.map(({ LomObject: rows }) => rows),
    ),
    LomObjectIdentifier: unionOf(
      "LomObjectIdentifier",
      parts.map(({ LomObjectIdentifier: rows }) => rows),
    ),
    LomObjectTitle: unionOf(
      "LomObjectTitle",
      parts.map(({ LomObjectTitle: rows }) => rows),
    ),
    LomRecord: unionOf(
      "LomRecord",
      parts.map(({ LomRecord: rows }) => rows),
    ),
    LomResource: unionOf(
      "LomResource",
      parts.map(({ LomResource: rows }) => rows),
    ),
    LomResourceType: unionOf(
      "LomResourceType",
      parts.map(({ LomResourceType: rows }) => rows),
    ),
    LomResourceTypeSource: unionOf(
      "LomResourceTypeSource",
      parts.map(({ LomResourceTypeSource: rows }) => rows),
    ),
    LomString: unionOf(
      "LomString",
      parts.map(({ LomString: rows }) => rows),
    ),
    LomStringLanguage: unionOf(
      "LomStringLanguage",
      parts.map(({ LomStringLanguage: rows }) => rows),
    ),
    LomTitle: unionOf(
      "LomTitle",
      parts.map(({ LomTitle: rows }) => rows),
    ),
    LomTitleString: unionOf(
      "LomTitleString",
      parts.map(({ LomTitleString: rows }) => rows),
    ),
    LookupValue: unionOf(
      "LookupValue",
      parts.map(({ LookupValue: rows }) => rows),
    ),
    ManifestId: unionOf(
      "ManifestId",
      parts.map(({ ManifestId: rows }) => rows),
    ),
    MapKey: unionOf(
      "MapKey",
      parts.map(({ MapKey: rows }) => rows),
    ),
    MapKeyDirectedPair: unionOf(
      "MapKeyDirectedPair",
      parts.map(({ MapKeyDirectedPair: rows }) => rows),
    ),
    MapKeyFloat: unionOf(
      "MapKeyFloat",
      parts.map(({ MapKeyFloat: rows }) => rows),
    ),
    MapKeyInteger: unionOf(
      "MapKeyInteger",
      parts.map(({ MapKeyInteger: rows }) => rows),
    ),
    MapKeyPair: unionOf(
      "MapKeyPair",
      parts.map(({ MapKeyPair: rows }) => rows),
    ),
    MapKeyPoint: unionOf(
      "MapKeyPoint",
      parts.map(({ MapKeyPoint: rows }) => rows),
    ),
    Mapping: unionOf(
      "Mapping",
      parts.map(({ Mapping: rows }) => rows),
    ),
    MappingLookup: unionOf(
      "MappingLookup",
      parts.map(({ MappingLookup: rows }) => rows),
    ),
    MappingSource: unionOf(
      "MappingSource",
      parts.map(({ MappingSource: rows }) => rows),
    ),
    MatchTable: unionOf(
      "MatchTable",
      parts.map(({ MatchTable: rows }) => rows),
    ),
    NameLookup: unionOf(
      "NameLookup",
      parts.map(({ NameLookup: rows }) => rows),
    ),
    Named: unionOf(
      "Named",
      parts.map(({ Named: rows }) => rows),
    ),
    NamedHref: unionOf(
      "NamedHref",
      parts.map(({ NamedHref: rows }) => rows),
    ),
    ObjectLang: unionOf(
      "ObjectLang",
      parts.map(({ ObjectLang: rows }) => rows),
    ),
    Operand: unionOf(
      "Operand",
      parts.map(({ Operand: rows }) => rows),
    ),
    OutcomeRange: unionOf(
      "OutcomeRange",
      parts.map(({ OutcomeRange: rows }) => rows),
    ),
    PlacedBinding: unionOf(
      "PlacedBinding",
      parts.map(({ PlacedBinding: rows }) => rows),
    ),
    PlacedChoice: unionOf(
      "PlacedChoice",
      parts.map(({ PlacedChoice: rows }) => rows),
    ),
    PlacedDocument: unionOf(
      "PlacedDocument",
      parts.map(({ PlacedDocument: rows }) => rows),
    ),
    PlacedGeneralLang: unionOf(
      "PlacedGeneralLang",
      parts.map(({ PlacedGeneralLang: rows }) => rows),
    ),
    PlacedHottext: unionOf(
      "PlacedHottext",
      parts.map(({ PlacedHottext: rows }) => rows),
    ),
    PlacedId: unionOf(
      "PlacedId",
      parts.map(({ PlacedId: rows }) => rows),
    ),
    PlacedIdref: unionOf(
      "PlacedIdref",
      parts.map(({ PlacedIdref: rows }) => rows),
    ),
    PlacedReference: unionOf(
      "PlacedReference",
      parts.map(({ PlacedReference: rows }) => rows),
    ),
    PlacedVariableRef: unionOf(
      "PlacedVariableRef",
      parts.map(({ PlacedVariableRef: rows }) => rows),
    ),
    PlacedXmlLang: unionOf(
      "PlacedXmlLang",
      parts.map(({ PlacedXmlLang: rows }) => rows),
    ),
    PrintedVariableRef: unionOf(
      "PrintedVariableRef",
      parts.map(({ PrintedVariableRef: rows }) => rows),
    ),
    Processing: unionOf(
      "Processing",
      parts.map(({ Processing: rows }) => rows),
    ),
    ProcessingTemplate: unionOf(
      "ProcessingTemplate",
      parts.map(({ ProcessingTemplate: rows }) => rows),
    ),
    Quotation: unionOf(
      "Quotation",
      parts.map(({ Quotation: rows }) => rows),
    ),
    Reading: unionOf(
      "Reading",
      parts.map(({ Reading: rows }) => rows),
    ),
    RecordField: unionOf(
      "RecordField",
      parts.map(({ RecordField: rows }) => rows),
    ),
    Reference: unionOf(
      "Reference",
      parts.map(({ Reference: rows }) => rows),
    ),
    ReferenceDocument: unionOf(
      "ReferenceDocument",
      parts.map(({ ReferenceDocument: rows }) => rows),
    ),
    ReferencePath: unionOf(
      "ReferencePath",
      parts.map(({ ReferencePath: rows }) => rows),
    ),
    ReferringDocument: unionOf(
      "ReferringDocument",
      parts.map(({ ReferringDocument: rows }) => rows),
    ),
    Resource: unionOf(
      "Resource",
      parts.map(({ Resource: rows }) => rows),
    ),
    ResourceFile: unionOf(
      "ResourceFile",
      parts.map(({ ResourceFile: rows }) => rows),
    ),
    ResourceHref: unionOf(
      "ResourceHref",
      parts.map(({ ResourceHref: rows }) => rows),
    ),
    ResourceLomGeneral: unionOf(
      "ResourceLomGeneral",
      parts.map(({ ResourceLomGeneral: rows }) => rows),
    ),
    ResourceLomLanguageSet: unionOf(
      "ResourceLomLanguageSet",
      parts.map(({ ResourceLomLanguageSet: rows }) => rows),
    ),
    Rounding: unionOf(
      "Rounding",
      parts.map(({ Rounding: rows }) => rows),
    ),
    Section: unionOf(
      "Section",
      parts.map(({ Section: rows }) => rows),
    ),
    SectionContextName: unionOf(
      "SectionContextName",
      parts.map(({ SectionContextName: rows }) => rows),
    ),
    SectionContextRef: unionOf(
      "SectionContextRef",
      parts.map(({ SectionContextRef: rows }) => rows),
    ),
    SectionFeedbackName: unionOf(
      "SectionFeedbackName",
      parts.map(({ SectionFeedbackName: rows }) => rows),
    ),
    SectionFeedbackRef: unionOf(
      "SectionFeedbackRef",
      parts.map(({ SectionFeedbackRef: rows }) => rows),
    ),
    SectionIdentifier: unionOf(
      "SectionIdentifier",
      parts.map(({ SectionIdentifier: rows }) => rows),
    ),
    SectionMember: unionOf(
      "SectionMember",
      parts.map(({ SectionMember: rows }) => rows),
    ),
    SectionOrdering: unionOf(
      "SectionOrdering",
      parts.map(({ SectionOrdering: rows }) => rows),
    ),
    SectionPrintedName: unionOf(
      "SectionPrintedName",
      parts.map(({ SectionPrintedName: rows }) => rows),
    ),
    SectionPrintedRef: unionOf(
      "SectionPrintedRef",
      parts.map(({ SectionPrintedRef: rows }) => rows),
    ),
    SectionScope: unionOf(
      "SectionScope",
      parts.map(({ SectionScope: rows }) => rows),
    ),
    SectionSelection: unionOf(
      "SectionSelection",
      parts.map(({ SectionSelection: rows }) => rows),
    ),
    SectionTemplateName: unionOf(
      "SectionTemplateName",
      parts.map(({ SectionTemplateName: rows }) => rows),
    ),
    SectionTemplateRef: unionOf(
      "SectionTemplateRef",
      parts.map(({ SectionTemplateRef: rows }) => rows),
    ),
    Site: unionOf(
      "Site",
      parts.map(({ Site: rows }) => rows),
    ),
    SiteTarget: unionOf(
      "SiteTarget",
      parts.map(({ SiteTarget: rows }) => rows),
    ),
    Slider: unionOf(
      "Slider",
      parts.map(({ Slider: rows }) => rows),
    ),
    SsmlAttribute: unionOf(
      "SsmlAttribute",
      parts.map(({ SsmlAttribute: rows }) => rows),
    ),
    SsmlScope: unionOf(
      "SsmlScope",
      parts.map(({ SsmlScope: rows }) => rows),
    ),
    StatisticDate: unionOf(
      "StatisticDate",
      parts.map(({ StatisticDate: rows }) => rows),
    ),
    StimulusRef: unionOf(
      "StimulusRef",
      parts.map(({ StimulusRef: rows }) => rows),
    ),
    TableHeader: unionOf(
      "TableHeader",
      parts.map(({ TableHeader: rows }) => rows),
    ),
    TableScope: unionOf(
      "TableScope",
      parts.map(({ TableScope: rows }) => rows),
    ),
    TemplateDefault: unionOf(
      "TemplateDefault",
      parts.map(({ TemplateDefault: rows }) => rows),
    ),
    TemplateRef: unionOf(
      "TemplateRef",
      parts.map(({ TemplateRef: rows }) => rows),
    ),
    TestDocument: unionOf(
      "TestDocument",
      parts.map(({ TestDocument: rows }) => rows),
    ),
    TestFlag: unionOf(
      "TestFlag",
      parts.map(({ TestFlag: rows }) => rows),
    ),
    TestReference: unionOf(
      "TestReference",
      parts.map(({ TestReference: rows }) => rows),
    ),
    TestToken: unionOf(
      "TestToken",
      parts.map(({ TestToken: rows }) => rows),
    ),
    Tolerance: unionOf(
      "Tolerance",
      parts.map(({ Tolerance: rows }) => rows),
    ),
    UsageValue: unionOf(
      "UsageValue",
      parts.map(({ UsageValue: rows }) => rows),
    ),
    Value: unionOf(
      "Value",
      parts.map(({ Value: rows }) => rows),
    ),
    ValueSet: unionOf(
      "ValueSet",
      parts.map(({ ValueSet: rows }) => rows),
    ),
    VarRef: unionOf(
      "VarRef",
      parts.map(({ VarRef: rows }) => rows),
    ),
    VariableLookup: unionOf(
      "VariableLookup",
      parts.map(({ VariableLookup: rows }) => rows),
    ),
    VariableMapping: unionOf(
      "VariableMapping",
      parts.map(({ VariableMapping: rows }) => rows),
    ),
    VariableRef: unionOf(
      "VariableRef",
      parts.map(({ VariableRef: rows }) => rows),
    ),
    XmlLang: unionOf(
      "XmlLang",
      parts.map(({ XmlLang: rows }) => rows),
    ),
  });

/**
 * Build every overlay's rows of one package: each document builder over each document, under its
 * ids, then the four that read the whole package: the assemblies from every document's test rows
 * (`assembledRowsOf`), the sections' placements under each test from the declarations, the
 * assemblies and the sections' and fragments' references (`sectionRowsOf`), the LOM records'
 * objects from the manifest and each document's assessment object (`objectRowsOfPackage`), and the
 * LOM languages' witnesses from every document's identity rows (`languageRowsOf`), and in place
 * under each item's assembly (`placedLanguageRowsOf`). The results are merged into one keyed set
 * per relation.
 *
 * @param documents - The package's documents, each listed and under its ids; the manifest is the
 *   one no resource names (resource type `none`).
 * @param mint - Draws a fresh uuid for each assembled instance but a root, whose id is its
 *   document's node.
 * @returns The rows, every relation of {@link OverlayRows} present; or the {@link OverlayConflict}
 *   of two builders that give one key two rows.
 */
export const overlayRowsOf = (
  documents: readonly { readonly ids: NodeIds; readonly listed: ListedDocument }[],
  mint: () => NodeId,
): Result.Result<OverlayRows, OverlayConflict> => {
  const built = documents.map((document) => ({ document, rows: documentRowsOf(document) }));
  const assembled = assembledRowsOf(
    built.map(({ rows }) => rows.tests),
    mint,
  );
  const referenced = assembledExpressionRowsOf(
    built.map(({ document, rows }) => ({
      expressions: rows.expressions,
      ids: document.ids,
      tests: rows.tests,
      tree: document.listed.tree,
    })),
    assembled,
    built.flatMap(({ rows }) => [...rows.package.ResourceHref.values()]),
  );
  const named = new Map<string, NamedDocument>();
  for (const { document, rows } of built) {
    if (document.listed.resourceType !== "none" && !named.has(document.listed.path)) {
      named.set(document.listed.path, {
        document: document.ids.idOf(0),
        object: rows.metadata.AssessmentObject.values().next().value,
      });
    }
  }

  const manifest = built.find(({ document }) => document.listed.resourceType === "none");

  return mergedOf([
    ...built.flatMap(({ rows }) => [
      rows.declarations,
      rows.expressions,
      rows.html,
      rows.identity,
      rows.interactions,
      rows.mapping,
      rows.metadata,
      rows.operators,
      rows.package,
      rows.quotation,
      rows.references,
      rows.tests,
    ]),
    assembled,
    referenced,
    languageRowsOf(built.map(({ rows }) => rows.identity)),
    placedLanguageRowsOf(
      built.map(({ rows }) => rows.identity),
      assembled.Instance.values(),
    ),
    placedVariableRowsOf({
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      instances: assembled.Instance.values(),
      references: built.flatMap(({ rows }) => [...rows.expressions.VariableRef.values()]),
    }),
    ...(manifest === undefined
      ? []
      : [objectRowsOfPackage(manifest.document.listed.tree, manifest.document.ids, named)]),
    placedBindingRowsOf({
      adaptive: built.flatMap(({ rows }) => [...rows.interactions.ItemMode.values()]),
      choices: built.flatMap(({ rows }) => [...rows.interactions.Choice.values()]),
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      hottexts: built.flatMap(({ rows }) => [...rows.interactions.Hottext.values()]),
      instances: assembled.Instance.values(),
      names: built.flatMap(({ rows }) => [...rows.interactions.BindingName.values()]),
    }),
    placedIdRowsOf({
      ids: built.flatMap(({ rows }) => [...rows.identity.DocumentId.values()]),
      instances: assembled.Instance.values(),
      targets: built.flatMap(({ rows }) => [...rows.identity.IdrefTarget.values()]),
    }),
    sectionRowsOf({
      contexts: built.flatMap(({ rows }) => [...rows.interactions.SectionContextName.values()]),
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      feedbacks: built.flatMap(({ rows }) => [...rows.interactions.SectionFeedbackName.values()]),
      instances: assembled.Instance.values(),
      prints: built.flatMap(({ rows }) => [...rows.interactions.SectionPrintedName.values()]),
      templates: built.flatMap(({ rows }) => [...rows.interactions.SectionTemplateName.values()]),
    }),
  ]);
};
