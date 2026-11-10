/**
 * The relations one package's import writes, by name: the relations `insertAll` takes over `Qti` at
 * its top level, committed here so that the importer names them without building the schema. The
 * writer inserts each, and the merge unions each by the one part of a relation it reads, its name.
 *
 * The list is held to the schema both ways. The type checker holds {@link writtenRelations} to
 * grizzle's `InsertAllRowsOf<QtiSchema>`: a name it lacks or one it does not take fails the build.
 * `roster.test.ts` holds it to `insertableNamesOf(Qti)` and to the relations the builders and the
 * writer write with a real package. A relation a module adds to the schema fails both until its
 * name is listed here.
 *
 * Each name is one keyed set of a package's inputs (`PackageInputs` of `#pantry/import/write.ts`):
 * the two roots, `Node` and `Package`, each with its tree or record nested; the document layer's
 * relations, which `documentRowsOf` writes; and every overlay's.
 */
import type { InsertAllRowsOf } from "@bjornpagen/grizzle";
import { Struct } from "effect";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * A relation an import writes directly: one `insertAll` takes over `Qti` at its top level, every
 * stored relation of `Qti` but an ordered family's member (`Attribute`, `Namespace`, `Entry` and
 * the like), which is written nested at its owner's count field.
 */
export type WrittenName = keyof InsertAllRowsOf<QtiSchema>;

/**
 * Every relation an import writes directly, by its name, each as the name the merge reads
 * (`unionsOf` of `#pantry/import/overlays/index.ts`). Its `satisfies` makes the type checker refuse
 * a relation `insertAll` takes that it lacks, a name `insertAll` does not take, and an entry whose
 * name is not its key.
 */
export const writtenRelations = {
  AreaMapping: { name: "AreaMapping" },
  AreaMappingCardinality: { name: "AreaMappingCardinality" },
  AriaElement: { name: "AriaElement" },
  AriaRange: { name: "AriaRange" },
  AriaValue: { name: "AriaValue" },
  AssembledCatalog: { name: "AssembledCatalog" },
  AssembledId: { name: "AssembledId" },
  AssembledLang: { name: "AssembledLang" },
  AssembledName: { name: "AssembledName" },
  AssembledReference: { name: "AssembledReference" },
  AssessmentObject: { name: "AssessmentObject" },
  Binding: { name: "Binding" },
  BindingBaseType: { name: "BindingBaseType" },
  BindingCardinality: { name: "BindingCardinality" },
  BindingDeclaration: { name: "BindingDeclaration" },
  BindingName: { name: "BindingName" },
  BodyXmlLang: { name: "BodyXmlLang" },
  BoundVariable: { name: "BoundVariable" },
  BranchResolution: { name: "BranchResolution" },
  BranchRule: { name: "BranchRule" },
  BranchShuffle: { name: "BranchShuffle" },
  BranchTarget: { name: "BranchTarget" },
  CardSupport: { name: "CardSupport" },
  CatalogId: { name: "CatalogId" },
  CatalogRef: { name: "CatalogRef" },
  CatalogScope: { name: "CatalogScope" },
  CatalogTarget: { name: "CatalogTarget" },
  CellHeaders: { name: "CellHeaders" },
  Choice: { name: "Choice" },
  ChoiceInteraction: { name: "ChoiceInteraction" },
  CnAttribute: { name: "CnAttribute" },
  CnCount: { name: "CnCount" },
  CnPartText: { name: "CnPartText" },
  CnSlot: { name: "CnSlot" },
  Comment: { name: "Comment" },
  ContextRef: { name: "ContextRef" },
  ContextRefDeclaration: { name: "ContextRefDeclaration" },
  CountBound: { name: "CountBound" },
  CountRange: { name: "CountRange" },
  DataSsml: { name: "DataSsml" },
  DataSsmlMember: { name: "DataSsmlMember" },
  DataSsmlProperty: { name: "DataSsmlProperty" },
  Declaration: { name: "Declaration" },
  DeclarationBaseType: { name: "DeclarationBaseType" },
  DeclarationCardinality: { name: "DeclarationCardinality" },
  DeclarationIdentifier: { name: "DeclarationIdentifier" },
  DeclarationName: { name: "DeclarationName" },
  DefaultEntry: { name: "DefaultEntry" },
  Dependency: { name: "Dependency" },
  DependencyTarget: { name: "DependencyTarget" },
  Doctype: { name: "Doctype" },
  Document: { name: "Document" },
  DocumentId: { name: "DocumentId" },
  DocumentLang: { name: "DocumentLang" },
  ElementType: { name: "ElementType" },
  EncodingDecl: { name: "EncodingDecl" },
  Expression: { name: "Expression" },
  ExpressionAttribute: { name: "ExpressionAttribute" },
  FeedbackRef: { name: "FeedbackRef" },
  FeedbackRefCardinality: { name: "FeedbackRefCardinality" },
  FeedbackRefDeclaration: { name: "FeedbackRefDeclaration" },
  FieldValue: { name: "FieldValue" },
  File: { name: "File" },
  FileHref: { name: "FileHref" },
  FragmentValue: { name: "FragmentValue" },
  GapInteraction: { name: "GapInteraction" },
  Hotspot: { name: "Hotspot" },
  Hottext: { name: "Hottext" },
  IdBinding: { name: "IdBinding" },
  IdentityText: { name: "IdentityText" },
  IdrefTarget: { name: "IdrefTarget" },
  Inclusion: { name: "Inclusion" },
  Instance: { name: "Instance" },
  InstanceName: { name: "InstanceName" },
  Interaction: { name: "Interaction" },
  InteractionAttribute: { name: "InteractionAttribute" },
  ItemMode: { name: "ItemMode" },
  ItemRefDocument: { name: "ItemRefDocument" },
  ItemRefHref: { name: "ItemRefHref" },
  LabelUse: { name: "LabelUse" },
  LeastCount: { name: "LeastCount" },
  Literal: { name: "Literal" },
  LiteralTyped: { name: "LiteralTyped" },
  LomEntry: { name: "LomEntry" },
  LomGeneral: { name: "LomGeneral" },
  LomLanguage: { name: "LomLanguage" },
  LomRecord: { name: "LomRecord" },
  LomResourceType: { name: "LomResourceType" },
  LomResourceTypeSource: { name: "LomResourceTypeSource" },
  LomString: { name: "LomString" },
  LomStringLanguage: { name: "LomStringLanguage" },
  LomTitle: { name: "LomTitle" },
  LomTitleString: { name: "LomTitleString" },
  LookupTable: { name: "LookupTable" },
  LookupTableCardinality: { name: "LookupTableCardinality" },
  LookupValue: { name: "LookupValue" },
  LookupValueType: { name: "LookupValueType" },
  ManifestId: { name: "ManifestId" },
  MapKey: { name: "MapKey" },
  MapKeyItems: { name: "MapKeyItems" },
  MapKeyType: { name: "MapKeyType" },
  Mapping: { name: "Mapping" },
  MappingBaseType: { name: "MappingBaseType" },
  MappingCardinality: { name: "MappingCardinality" },
  MappingItemRef: { name: "MappingItemRef" },
  MappingItemRefType: { name: "MappingItemRefType" },
  MappingSourceDeclaration: { name: "MappingSourceDeclaration" },
  MasteryCeiling: { name: "MasteryCeiling" },
  MasteryFloor: { name: "MasteryFloor" },
  MasteryValue: { name: "MasteryValue" },
  MathAction: { name: "MathAction" },
  MathAlignGroup: { name: "MathAlignGroup" },
  MathAlignScope: { name: "MathAlignScope" },
  MathApply: { name: "MathApply" },
  MathArgument: { name: "MathArgument" },
  MathCell: { name: "MathCell" },
  MathCn: { name: "MathCn" },
  MathDir: { name: "MathDir" },
  MathQualifier: { name: "MathQualifier" },
  MathRank: { name: "MathRank" },
  MostCount: { name: "MostCount" },
  Named: { name: "Named" },
  Node: { name: "Node" },
  NormalMaximum: { name: "NormalMaximum" },
  NormalMinimum: { name: "NormalMinimum" },
  ObjectIdentifier: { name: "ObjectIdentifier" },
  ObjectLang: { name: "ObjectLang" },
  ObjectTitle: { name: "ObjectTitle" },
  OpenElementName: { name: "OpenElementName" },
  OpenElementType: { name: "OpenElementType" },
  Operand: { name: "Operand" },
  Package: { name: "Package" },
  PciModuleForm: { name: "PciModuleForm" },
  Pi: { name: "Pi" },
  PlacedBinding: { name: "PlacedBinding" },
  PlacedBindingBaseType: { name: "PlacedBindingBaseType" },
  PlacedBindingCardinality: { name: "PlacedBindingCardinality" },
  PlacedBindingDeclaration: { name: "PlacedBindingDeclaration" },
  PlacedBodyXmlLang: { name: "PlacedBodyXmlLang" },
  PlacedCatalogRef: { name: "PlacedCatalogRef" },
  PlacedChoice: { name: "PlacedChoice" },
  PlacedDocument: { name: "PlacedDocument" },
  PlacedHottext: { name: "PlacedHottext" },
  PlacedId: { name: "PlacedId" },
  PlacedIdref: { name: "PlacedIdref" },
  PlacedMathRank: { name: "PlacedMathRank" },
  PlacedReference: { name: "PlacedReference" },
  PlacedShareTarget: { name: "PlacedShareTarget" },
  PlacedVariableRef: { name: "PlacedVariableRef" },
  PlacedVariableRefDeclaration: { name: "PlacedVariableRefDeclaration" },
  PlacedXmlLang: { name: "PlacedXmlLang" },
  PrintedVariableRef: { name: "PrintedVariableRef" },
  PrintedVariableRefDeclaration: { name: "PrintedVariableRefDeclaration" },
  Processing: { name: "Processing" },
  ProcessingTemplate: { name: "ProcessingTemplate" },
  Quotation: { name: "Quotation" },
  Reading: { name: "Reading" },
  ReadingCardinality: { name: "ReadingCardinality" },
  ReadingDeclaration: { name: "ReadingDeclaration" },
  RecordField: { name: "RecordField" },
  RecordFieldName: { name: "RecordFieldName" },
  Reference: { name: "Reference" },
  ReferenceDocument: { name: "ReferenceDocument" },
  ReferencePath: { name: "ReferencePath" },
  ReferringDocument: { name: "ReferringDocument" },
  Resource: { name: "Resource" },
  ResourceDocument: { name: "ResourceDocument" },
  ResourceFile: { name: "ResourceFile" },
  ResourceHref: { name: "ResourceHref" },
  ResourceId: { name: "ResourceId" },
  ResourceLomLanguageSet: { name: "ResourceLomLanguageSet" },
  ResourceTyped: { name: "ResourceTyped" },
  Rounding: { name: "Rounding" },
  RoundingFigures: { name: "RoundingFigures" },
  RoundingMode: { name: "RoundingMode" },
  RoundingModeFigures: { name: "RoundingModeFigures" },
  SdDecl: { name: "SdDecl" },
  Section: { name: "Section" },
  SectionContextName: { name: "SectionContextName" },
  SectionContextRef: { name: "SectionContextRef" },
  SectionContextRefDeclaration: { name: "SectionContextRefDeclaration" },
  SectionFeedbackName: { name: "SectionFeedbackName" },
  SectionFeedbackRef: { name: "SectionFeedbackRef" },
  SectionFeedbackRefCardinality: { name: "SectionFeedbackRefCardinality" },
  SectionFeedbackRefDeclaration: { name: "SectionFeedbackRefDeclaration" },
  SectionIdentifier: { name: "SectionIdentifier" },
  SectionMember: { name: "SectionMember" },
  SectionOrdering: { name: "SectionOrdering" },
  SectionPrintedName: { name: "SectionPrintedName" },
  SectionPrintedRef: { name: "SectionPrintedRef" },
  SectionPrintedRefDeclaration: { name: "SectionPrintedRefDeclaration" },
  SectionScope: { name: "SectionScope" },
  SectionSelection: { name: "SectionSelection" },
  SectionTemplateName: { name: "SectionTemplateName" },
  SectionTemplateRef: { name: "SectionTemplateRef" },
  SectionTemplateRefCardinality: { name: "SectionTemplateRefCardinality" },
  SectionTemplateRefDeclaration: { name: "SectionTemplateRefDeclaration" },
  ShareFragment: { name: "ShareFragment" },
  ShareTarget: { name: "ShareTarget" },
  Site: { name: "Site" },
  SitePath: { name: "SitePath" },
  SiteTarget: { name: "SiteTarget" },
  Slider: { name: "Slider" },
  SsmlAttribute: { name: "SsmlAttribute" },
  SsmlScope: { name: "SsmlScope" },
  StatisticDate: { name: "StatisticDate" },
  StimulusRef: { name: "StimulusRef" },
  TableHeader: { name: "TableHeader" },
  TableScope: { name: "TableScope" },
  TemplateDefault: { name: "TemplateDefault" },
  TemplateDefaultCardinality: { name: "TemplateDefaultCardinality" },
  TemplateDefaultTarget: { name: "TemplateDefaultTarget" },
  TemplateRef: { name: "TemplateRef" },
  TemplateRefCardinality: { name: "TemplateRefCardinality" },
  TemplateRefDeclaration: { name: "TemplateRefDeclaration" },
  TestDocument: { name: "TestDocument" },
  TestFlag: { name: "TestFlag" },
  TestReference: { name: "TestReference" },
  TestToken: { name: "TestToken" },
  TextReference: { name: "TextReference" },
  TextReferencePath: { name: "TextReferencePath" },
  Tolerance: { name: "Tolerance" },
  TypedValue: { name: "TypedValue" },
  UsageBaseType: { name: "UsageBaseType" },
  UsageValue: { name: "UsageValue" },
  UsageValueBaseType: { name: "UsageValueBaseType" },
  Value: { name: "Value" },
  ValueBaseType: { name: "ValueBaseType" },
  ValueSet: { name: "ValueSet" },
  ValueSetCardinality: { name: "ValueSetCardinality" },
  VariableMapping: { name: "VariableMapping" },
  VariableRef: { name: "VariableRef" },
  VariableRefCardinality: { name: "VariableRefCardinality" },
  VariableRefDeclaration: { name: "VariableRefDeclaration" },
  VariableRefTable: { name: "VariableRefTable" },
  XmlDecl: { name: "XmlDecl" },
  XmlLang: { name: "XmlLang" },
} as const satisfies { readonly [Name in WrittenName]: { readonly name: Name } };

/**
 * The document layer's relations, which `documentRowsOf` of `#pantry/import/write.ts` writes for
 * each document: its `Document` row, its XML declaration's rows where it writes one, its comments',
 * instructions' and doctypes' rows, its foreign elements' expanded names, its elements' named
 * governing types, and the type of the resource that lists it, where one does.
 */
export const documentLayerNames = [
  "Comment",
  "Doctype",
  "Document",
  "ElementType",
  "EncodingDecl",
  "OpenElementName",
  "OpenElementType",
  "Pi",
  "ResourceDocument",
  "SdDecl",
  "XmlDecl",
] as const satisfies readonly WrittenName[];

/**
 * The document layer's relations by name, as the merge reads them: `DocumentLayerRows` is read from
 * this record.
 */
export const documentLayer = Struct.pick(writtenRelations, documentLayerNames);

/**
 * Order relation names by their code points, the order each list here is kept in, so
 * `roster.test.ts` compares each as one set with the relations a real import writes.
 *
 * @param names - The names.
 * @returns The names, sorted.
 */
const sorted = <N extends string>(names: readonly N[]): readonly N[] =>
  names.toSorted((x, y) => (x < y ? -1 : Number(x > y)));

/**
 * Every relation an import writes directly, in code point order: the keys of `PackageInputs`.
 */
export const writtenNames = sorted(Struct.keys(writtenRelations));

/**
 * Every overlay's relation, by its name: each written relation but the two roots, `Node` and
 * `Package`, and the document layer's. `overlayRowsOf` (`#pantry/import/overlays/index.ts`) unions
 * `OverlayRows` over it, which the type checker holds to name every relation of `OverlayRows`.
 */
export const overlayRelations = Struct.omit(writtenRelations, [
  "Node",
  "Package",
  ...documentLayerNames,
]);

/**
 * Every overlay's relation name, the keys of `overlayRelations`, in code point order.
 * `roster.test.ts` holds them to exactly the relations the overlay builders write.
 */
export const overlayNames = sorted(Struct.keys(overlayRelations));
