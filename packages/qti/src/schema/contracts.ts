/**
 * The named contracts of the schema: each concept a column of several relations shares, as one
 * grizzle `contract` over the text pattern that spells its language.
 *
 * A contract is a branded domain over its base. The column keeps its pattern as the domain's
 * CHECK, so a retype changes no stored value; the brand makes every write site and every
 * containment name the concept, and both sides of a containment share one contract (grizzle
 * `types/schema/statements.ts:155-164`). A contract name shares the relation name space (grizzle
 * `physical/ddl/domains.ts:341-366`), so no name here is the name of a relation of `Qti`.
 *
 * There are 72 contracts written out below. The 64 value-arm contracts are minted from the context
 * table of `value.ts` in `value-contracts.ts`, which this module cannot import: 136 in all.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `ShapeCoords` is the contract of the coordinates of an HTML shape, a name the contracts document settles; it is not a structural description. */
import { contract, str } from "@bjornpagen/grizzle";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An XML entity reference's name (`&name;`).
 *
 * The base is `patterns.ncName`.
 */
export const XmlEntityName = contract("XmlEntityName", str.regex(patterns.ncName));

/**
 * A processing instruction's target.
 *
 * The base is `patterns.ncName`.
 */
export const PiTarget = contract("PiTarget", str.regex(patterns.ncName));

/**
 * The prefix of a namespace-qualified `xsi:schemaLocation` pair.
 *
 * The base is `patterns.ncName`.
 */
export const NamespacePrefix = contract("NamespacePrefix", str.regex(patterns.ncName));

/**
 * An `xs:ID` of a content package manifest, shared by the manifest, its resources and every table
 * that names one.
 *
 * The base is `patterns.ncName`.
 */
export const ManifestIdentifier = contract("ManifestIdentifier", str.regex(patterns.ncName));

/**
 * A reference to a declared variable (an outcome, response or template variable) by identifier.
 *
 * The base is `patterns.ncName`.
 */
export const VariableReference = contract("VariableReference", str.regex(patterns.ncName));

/**
 * The identifier of a field of a record value.
 *
 * The base is `patterns.ncName`.
 */
export const RecordFieldIdentifier = contract("RecordFieldIdentifier", str.regex(patterns.ncName));

/**
 * The identifier of a choice, hotspot, gap or other associable item of an interaction.
 *
 * The base is `patterns.ncName`.
 */
export const ChoiceIdentifier = contract("ChoiceIdentifier", str.regex(patterns.ncName));

/**
 * The name of a template parameter a response-processing rule reads.
 *
 * The base is `patterns.ncName`.
 */
export const TemplateParameterName = contract("TemplateParameterName", str.regex(patterns.ncName));

/**
 * A reference to an assessment section by identifier.
 *
 * The base is `patterns.ncName`.
 */
export const SectionReference = contract("SectionReference", str.regex(patterns.ncName));

/**
 * The Java-style class name of a custom operator.
 *
 * The base is `patterns.ncName`.
 */
export const CustomOperatorClassName = contract(
  "CustomOperatorClassName",
  str.regex(patterns.ncName),
);

/**
 * A reference to a weight by identifier.
 *
 * The base is `patterns.ncName`.
 */
export const WeightReference = contract("WeightReference", str.regex(patterns.ncName));

/**
 * An `id` or id-reference a node's ARIA or catalog attribute names.
 *
 * The base is `patterns.ncName`.
 */
export const IdReference = contract("IdReference", str.regex(patterns.ncName));

/**
 * The identifier a `show-hide` feedback or template block is switched by.
 *
 * The base is `patterns.ncName`.
 */
export const ShowHideIdentifier = contract("ShowHideIdentifier", str.regex(patterns.ncName));

/**
 * The name of a usage-data statistic.
 *
 * The base is `patterns.ncName`.
 */
export const StatisticName = contract("StatisticName", str.regex(patterns.ncName));

/**
 * The identifier of a target-object part in usage data.
 *
 * The base is `patterns.ncName`.
 */
export const UsagePartIdentifier = contract("UsagePartIdentifier", str.regex(patterns.ncName));

/**
 * The identifier of a record field in usage data.
 *
 * The base is `patterns.ncName`.
 */
export const UsageFieldIdentifier = contract("UsageFieldIdentifier", str.regex(patterns.ncName));

/**
 * The URI a namespace declaration binds.
 *
 * The base is `patterns.anyUri`.
 */
export const NamespaceUri = contract("NamespaceUri", str.regex(patterns.anyUri));

/**
 * The URI of a variable's long interpretation.
 *
 * The base is `patterns.anyUri`.
 */
export const LongInterpretationUri = contract("LongInterpretationUri", str.regex(patterns.anyUri));

/**
 * The URI of a response-processing template.
 *
 * The base is `patterns.anyUri`.
 */
export const TemplateUri = contract("TemplateUri", str.regex(patterns.anyUri));

/**
 * The location a response-processing template is fetched from.
 *
 * The base is `patterns.anyUri`.
 */
export const TemplateLocationUri = contract("TemplateLocationUri", str.regex(patterns.anyUri));

/**
 * The URI of a custom operator's definition.
 *
 * The base is `patterns.anyUri`.
 */
export const CustomOperatorDefinitionUri = contract(
  "CustomOperatorDefinitionUri",
  str.regex(patterns.anyUri),
);

/**
 * The `href` of an XInclude element.
 *
 * The base is `patterns.anyUri`.
 */
export const XIncludeUri = contract("XIncludeUri", str.regex(patterns.anyUri));

/**
 * The source of an embedded image or object.
 *
 * The base is `patterns.anyUri`.
 */
export const EmbedSourceUri = contract("EmbedSourceUri", str.regex(patterns.anyUri));

/**
 * The URI of an image's long description.
 *
 * The base is `patterns.anyUri`.
 */
export const LongDescriptionUri = contract("LongDescriptionUri", str.regex(patterns.anyUri));

/**
 * A node's `xml:base`.
 *
 * The base is `patterns.anyUri`.
 */
export const XmlBaseUri = contract("XmlBaseUri", str.regex(patterns.anyUri));

/**
 * The target of a hyperlink.
 *
 * The base is `patterns.anyUri`.
 */
export const HyperlinkUri = contract("HyperlinkUri", str.regex(patterns.anyUri));

/**
 * The `cite` URI of a quotation.
 *
 * The base is `patterns.anyUri`.
 */
export const CitationUri = contract("CitationUri", str.regex(patterns.anyUri));

/**
 * The `href` of a stylesheet link.
 *
 * The base is `patterns.anyUri`.
 */
export const StylesheetUri = contract("StylesheetUri", str.regex(patterns.anyUri));

/**
 * The URI of a resource another resource adapts or is adapted from.
 *
 * The base is `patterns.anyUri`.
 */
export const DrdAdaptationUri = contract("DrdAdaptationUri", str.regex(patterns.anyUri));

/**
 * The URI of a case's item in usage data.
 *
 * The base is `patterns.anyUri`.
 */
export const CaseItemUri = contract("CaseItemUri", str.regex(patterns.anyUri));

/**
 * The context a statistic is measured in.
 *
 * The base is `patterns.anyUri`.
 */
export const StatisticContextUri = contract("StatisticContextUri", str.regex(patterns.anyUri));

/**
 * The URI of a statistic's glossary.
 *
 * The base is `patterns.anyUri`.
 */
export const GlossaryUri = contract("GlossaryUri", str.regex(patterns.anyUri));

/**
 * A file path inside a content package.
 *
 * The base is `patterns.hrefInPackage`.
 */
export const PackagePath = contract("PackagePath", str.regex(patterns.hrefInPackage));

/**
 * The entry `href` of a package resource.
 *
 * The base is `patterns.hrefInPackage`.
 */
export const ResourceEntryHref = contract("ResourceEntryHref", str.regex(patterns.hrefInPackage));

/**
 * The media type a package file is stored with.
 *
 * The base is `patterns.mimeType`.
 */
export const FileMediaType = contract("FileMediaType", str.regex(patterns.mimeType));

/**
 * The media type an item's markup declares for a linked resource.
 *
 * The base is `patterns.mimeType`.
 */
export const ContentMediaType = contract("ContentMediaType", str.regex(patterns.mimeType));

/**
 * A LOM value that is one whitespace-collapsed token.
 *
 * The base is `patterns.xsToken` with its flags.
 */
export const LomToken = contract("LomToken", str.regex(patterns.xsToken, patterns.xsTokenFlags));

/**
 * The source of a LOM vocabulary value.
 *
 * The base is `patterns.xsToken` with its flags.
 */
export const LomVocabularySource = contract(
  "LomVocabularySource",
  str.regex(patterns.xsToken, patterns.xsTokenFlags),
);

/**
 * The value of a LOM vocabulary entry.
 *
 * The base is `patterns.xsToken` with its flags.
 */
export const LomVocabularyValue = contract(
  "LomVocabularyValue",
  str.regex(patterns.xsToken, patterns.xsTokenFlags),
);

/**
 * A node's `class` token list.
 *
 * The base is `patterns.classList`.
 */
export const ClassList = contract("ClassList", str.regex(patterns.classList));

/**
 * A usage-data value that is one whitespace-collapsed token.
 *
 * The base is `patterns.xsToken` with its flags.
 */
export const UsageValueToken = contract(
  "UsageValueToken",
  str.regex(patterns.xsToken, patterns.xsTokenFlags),
);

/**
 * The language of a LOM language string, empty when unstated.
 *
 * The base is `patterns.xsLanguageOrEmpty`.
 */
export const LangStringLanguage = contract(
  "LangStringLanguage",
  str.regex(patterns.xsLanguageOrEmpty),
);

/**
 * The name of the tool that authored a package or item.
 *
 * The base is `patterns.toolString` with its flags.
 */
export const ToolName = contract(
  "ToolName",
  str.regex(patterns.toolString, patterns.toolStringFlags),
);

/**
 * The vendor of the tool that authored a package or item.
 *
 * The base is `patterns.toolString` with its flags.
 */
export const ToolVendor = contract(
  "ToolVendor",
  str.regex(patterns.toolString, patterns.toolStringFlags),
);

/**
 * The version of the tool that authored a package or item.
 *
 * The base is `patterns.toolString` with its flags.
 */
export const ToolVersion = contract(
  "ToolVersion",
  str.regex(patterns.toolString, patterns.toolStringFlags),
);

/**
 * An outcome declaration's normal minimum or mastery value.
 *
 * The base is `patterns.xsDouble`.
 */
export const OutcomeScaleValue = contract("OutcomeScaleValue", str.regex(patterns.xsDouble));

/**
 * A mapped score, default or bound of a mapping or area mapping.
 *
 * The base is `patterns.xsDouble`.
 */
export const MappingScore = contract("MappingScore", str.regex(patterns.xsDouble));

/**
 * The source value of an interpolation table entry.
 *
 * The base is `patterns.xsDouble`.
 */
export const InterpolationSourceValue = contract(
  "InterpolationSourceValue",
  str.regex(patterns.xsDouble),
);

/**
 * The source value of a match table entry.
 *
 * The base is `patterns.xsDouble`.
 */
export const MatchSourceValue = contract("MatchSourceValue", str.regex(patterns.xsDouble));

/**
 * A measured statistic, such as a standard deviation or error.
 *
 * The base is `patterns.xsDouble`.
 */
export const StatisticMeasure = contract("StatisticMeasure", str.regex(patterns.xsDouble));

/**
 * A mapped score, default or bound of a usage-data mapping.
 *
 * The base is `patterns.xsDouble`.
 */
export const UsageMappingScore = contract("UsageMappingScore", str.regex(patterns.xsDouble));

/**
 * An ARIA attribute that is an integer (a count or an index).
 *
 * The base is `patterns.xsInteger`.
 */
export const AriaInteger = contract("AriaInteger", str.regex(patterns.xsInteger));

/**
 * The number of cases a usage-data statistic was measured over.
 *
 * The base is `patterns.xsInteger`.
 */
export const UsageCaseCount = contract("UsageCaseCount", str.regex(patterns.xsInteger));

/**
 * A count of choices an interaction asks for or allows.
 *
 * The base is `patterns.xsNonNegativeInteger`.
 */
export const ChoiceCount = contract("ChoiceCount", str.regex(patterns.xsNonNegativeInteger));

/**
 * The width of a choices container in pixels.
 *
 * The base is `patterns.xsNonNegativeInteger`.
 */
export const ContainerWidth = contract("ContainerWidth", str.regex(patterns.xsNonNegativeInteger));

/**
 * The expected length of a text answer.
 *
 * The base is `patterns.xsNonNegativeInteger`.
 */
export const ExpectedLength = contract("ExpectedLength", str.regex(patterns.xsNonNegativeInteger));

/**
 * The expected number of lines of a text answer.
 *
 * The base is `patterns.xsNonNegativeInteger`.
 */
export const ExpectedLines = contract("ExpectedLines", str.regex(patterns.xsNonNegativeInteger));

/**
 * A count of strings an extended text interaction asks for or allows.
 *
 * The base is `patterns.xsNonNegativeInteger`.
 */
export const StringCount = contract("StringCount", str.regex(patterns.xsNonNegativeInteger));

/**
 * A list of category identifiers an expression includes or excludes.
 *
 * The base is `patterns.identifierList`.
 */
export const CategoryList = contract("CategoryList", str.regex(patterns.identifierList));

/**
 * The identifiers of the groups a match choice belongs to.
 *
 * The base is `patterns.ncNameListOrEmpty`.
 */
export const MatchGroupList = contract("MatchGroupList", str.regex(patterns.ncNameListOrEmpty));

/**
 * An expression attribute that is an integer or the identifier of a variable holding one.
 *
 * The base is `patterns.integerOrVariableRef`.
 */
export const ExpressionIntegerOrVariable = contract(
  "ExpressionIntegerOrVariable",
  str.regex(patterns.integerOrVariableRef),
);

/**
 * A printed variable's base or index, an integer or a variable identifier.
 *
 * The base is `patterns.integerOrVariableString`.
 */
export const PrintedVariableIntegerOrVariable = contract(
  "PrintedVariableIntegerOrVariable",
  str.regex(patterns.integerOrVariableString),
);

/**
 * The coordinates an `inside` expression tests a point against.
 *
 * The base is `patterns.coords`.
 */
export const ExpressionCoords = contract("ExpressionCoords", str.regex(patterns.coords));

/**
 * The coordinates of a shape of any kind.
 *
 * The base is `patterns.coordsAny`.
 */
export const ShapeCoords = contract("ShapeCoords", str.regex(patterns.coordsAny));

/**
 * An ARIA attribute that is a positive integer (a level or a position).
 *
 * The base is `patterns.positiveInteger`.
 */
export const AriaPositiveInteger = contract(
  "AriaPositiveInteger",
  str.regex(patterns.positiveInteger),
);

/**
 * The span of a table column, column group or cell.
 *
 * The base is `patterns.positiveInteger`.
 */
export const TableSpan = contract("TableSpan", str.regex(patterns.positiveInteger));

/**
 * A node's `lang`, a BCP 47 language tag.
 *
 * The base is `patterns.bcp47`.
 */
export const ContentLanguage = contract("ContentLanguage", str.regex(patterns.bcp47));

/**
 * The language of a text track.
 *
 * The base is `patterns.bcp47`.
 */
export const TrackLanguage = contract("TrackLanguage", str.regex(patterns.bcp47));

/**
 * The four coordinates of a rectangle or an ellipse's bounding box.
 *
 * The base is `patterns.coordsRect`.
 */
export const RectCoords = contract("RectCoords", str.regex(patterns.coordsRect));

/**
 * The four coordinates of a media interaction's rectangle.
 *
 * The base is `patterns.coordsRect`.
 */
export const MediaRectCoords = contract("MediaRectCoords", str.regex(patterns.coordsRect));

/**
 * An accessibility access mode of a resource.
 *
 * The base is `patterns.drdAccessMode`.
 */
export const AccessMode = contract("AccessMode", str.regex(patterns.drdAccessMode));

/**
 * The access mode an adaptation of a resource provides.
 *
 * The base is `patterns.drdAccessModeAdapted`.
 */
export const AccessModeAdapted = contract(
  "AccessModeAdapted",
  str.regex(patterns.drdAccessModeAdapted),
);
