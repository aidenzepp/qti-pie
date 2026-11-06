/**
 * The closed vocabularies the content schema shares: data only, each a closed roster with no
 * relation and no attribute name. A relation of another module reads one through `closedId`, and
 * the engine requires the schema to declare the roster, so `relations` carries them all and the
 * composed schema spreads this file like a module.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `Shape` and `ToolShape` are the roster names the spec fixes and `shapes.ts` imports. */
import { closed } from "@bjornpagen/grizzle";

/**
 * The `shape` of a coordinate list; `shapes.ts` reads this roster.
 */
export const Shape = closed("Shape", ["circle", "default", "ellipse", "poly", "rect"]);

/**
 * The `show` and `hide` values of a visibility attribute.
 */
export const ShowHide = closed("ShowHide", ["show", "hide"]);

/**
 * The two layout axes.
 */
export const Orientation = closed("Orientation", ["vertical", "horizontal"]);

/**
 * A limit that is either capped or open.
 */
export const Bound = closed("Bound", ["bounded", "unlimited"]);

/**
 * Which of a name and a version a tool entry carries.
 */
export const ToolShape = closed("ToolShape", ["both", "nameOnly", "versionOnly"]);

/**
 * A two-way yes or no.
 */
export const YesNo = closed("YesNo", ["yes", "no"]);

/**
 * The attributes whose value is an `IDREF` or `IDREFS`, in alphabetical order.
 */
export const IdrefAttribute = closed("IdrefAttribute", [
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
  "data-catalog-idref",
  "headers",
]);

/**
 * The `xs:boolean` lexical space (XML Schema Part 2, section 3.2.2.1): `true`, `false`, `1` or
 * `0`. The built-in type has no enumeration in the QTI XSDs.
 */
export const XsBoolean = closed("XsBoolean", ["true", "false", "1", "0"]);

/**
 * The seven `schema` values of the QTI 3 content-package profile (`imsqtiv3p0_imscpv1p2_v1p0.xsd`
 * lines 327 to 333, `imsqtiv3p0p1_imscpv1p2_v1p0.xsd` lines 295 to 301), in XSD order.
 */
export const CpSchema = closed("CpSchema", [
  "QTI Package",
  "QTI Test Bank",
  "QTI Item Bank",
  "QTI Object Bank",
  "QTI Test",
  "QTI Section",
  "QTI Item",
]);

/**
 * The 22 `interactionType` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines
 * 169 to 190), in XSD order.
 */
export const QmdInteractionTypeValue = closed("QmdInteractionTypeValue", [
  "associateInteraction",
  "choiceInteraction",
  "customInteraction",
  "drawingInteraction",
  "endAttemptInteraction",
  "extendedTextInteraction",
  "gapMatchInteraction",
  "graphicAssociateInteraction",
  "graphicGapMatchInteraction",
  "graphicOrderInteraction",
  "hotspotInteraction",
  "hottextInteraction",
  "inlineChoiceInteraction",
  "matchInteraction",
  "mediaInteraction",
  "orderInteraction",
  "portableCustomInteraction",
  "positionObjectInteraction",
  "selectPointInteraction",
  "sliderInteraction",
  "textEntryInteraction",
  "uploadInteraction",
]);

/**
 * The three `feedbackType` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines
 * 203 to 205), in XSD order.
 */
export const QmdFeedbackTypeValue = closed("QmdFeedbackTypeValue", [
  "adaptive",
  "nonadaptive",
  "none",
]);

/**
 * The three `scoringMode` values of the QTI metadata XSD (`imsqti_metadatav3p0_v1p0.xsd` lines 218
 * to 220), in XSD order. `externalmachine` is spelled in lower case here, unlike `ExternalScored`.
 */
export const QmdScoringModeValue = closed("QmdScoringModeValue", [
  "human",
  "externalmachine",
  "responseprocessing",
]);

/**
 * The `boolean` base-type literal of the QTI information model: `true` or `false`. The XSDs type
 * `qti-value` as `xs:string`, so no enumeration backs it.
 */
export const BooleanLiteral = closed("BooleanLiteral", ["true", "false"]);

/**
 * The `externalScored` values of an outcome declaration (`imsqti_asiv3p0p1_v1p0.xsd` lines 30147
 * to 30148). The XSD lists `externalMachine` before `human`; the roster lists `human` first.
 */
export const ExternalScored = closed("ExternalScored", ["human", "externalMachine"]);

/**
 * The `toleranceMode` values of `qti-equal` (`imsqti_asiv3p0p1_v1p0.xsd` lines 27021 to 27023), in
 * XSD order.
 */
export const ToleranceMode = closed("ToleranceMode", ["absolute", "exact", "relative"]);

/**
 * The `roundingMode` values of `qti-equal-rounded` and `qti-round-to` (`imsqti_asiv3p0p1_v1p0.xsd`
 * lines 27121 to 27122), in XSD order.
 */
export const RoundingMode = closed("RoundingMode", ["decimalPlaces", "significantFigures"]);

/**
 * The 28 `name` values of `qti-math-operator` (`imsqti_asiv3p0p1_v1p0.xsd` lines 29708 to 29735),
 * in XSD order.
 */
export const MathOperatorName = closed("MathOperatorName", [
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "asin",
  "acos",
  "atan",
  "atan2",
  "asec",
  "acsc",
  "acot",
  "sinh",
  "cosh",
  "tanh",
  "sech",
  "csch",
  "coth",
  "log",
  "ln",
  "exp",
  "abs",
  "signum",
  "floor",
  "ceil",
  "toDegrees",
  "toRadians",
]);

/**
 * The five `name` values of `qti-stats-operator` (`imsqti_asiv3p0p1_v1p0.xsd` lines 32114 to
 * 32118), in XSD order.
 */
export const StatsOperatorName = closed("StatsOperatorName", [
  "mean",
  "sampleVariance",
  "sampleSD",
  "popVariance",
  "popSD",
]);

/**
 * The `name` values of `qti-math-constant` (`imsqti_asiv3p0p1_v1p0.xsd` lines 34421 to 34422), in
 * XSD order.
 */
export const MathConstantName = closed("MathConstantName", ["pi", "e"]);

/**
 * The `parse` values of `xi:include` (`w3/XInclude.xsd` lines 31 to 36), in XSD order.
 */
export const XIncludeParseValue = closed("XIncludeParseValue", ["xml", "text"]);

/**
 * The 74 `role` values of `ARIABaseDType` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24413 to 24486), in
 * XSD order.
 */
export const AriaRoleValue = closed("AriaRoleValue", [
  "article",
  "columnheader",
  "definition",
  "document",
  "group",
  "heading",
  "img",
  "list",
  "listitem",
  "math",
  "note",
  "presentation",
  "region",
  "row",
  "rowgroup",
  "rowheader",
  "separator",
  "toolbar",
  "button",
  "checkbox",
  "gridcell",
  "link",
  "log",
  "option",
  "radio",
  "slider",
  "spinbutton",
  "status",
  "tab",
  "tabpanel",
  "textbox",
  "timer",
  "listbox",
  "radiogroup",
  "tablist",
  "complementary",
  "contentinfo",
  "alert",
  "alertdialog",
  "application",
  "banner",
  "combobox",
  "dialog",
  "form",
  "grid",
  "main",
  "marquee",
  "menu",
  "menubar",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "navigation",
  "progressbar",
  "scrollbar",
  "search",
  "tooltip",
  "tree",
  "treegrid",
  "treeitem",
  "searchbox",
  "switch",
  "term",
  "figure",
  "code",
  "time",
  "subscript",
  "superscript",
  "meter",
  "generic",
  "insertion",
  "deletion",
  "strong",
  "emphasis",
]);

/**
 * The `aria-live` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24504 to 24506), in XSD order.
 */
export const AriaLiveValue = closed("AriaLiveValue", ["off", "polite", "assertive"]);

/**
 * The `aria-orientation` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24518 to 24519), in XSD order.
 * An ARIA state of its own, not the QTI layout axis `Orientation`.
 */
export const AriaOrientationValue = closed("AriaOrientationValue", ["vertical", "horizontal"]);

/**
 * The `aria-autocomplete` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24535 to 24538), in XSD order.
 */
export const AriaAutocompleteValue = closed("AriaAutocompleteValue", [
  "inline",
  "list",
  "both",
  "none",
]);

/**
 * The ARIA tristate values, shared by `aria-checked` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24551 to
 * 24554) and `aria-pressed` (lines 24600 to 24603), in XSD order.
 */
export const AriaTristate = closed("AriaTristate", ["true", "false", "mixed", "undefined"]);

/**
 * The ARIA true, false or undefined values, shared by `aria-expanded` (`imsqti_asiv3p0p1_v1p0.xsd`
 * lines 24567 to 24569) and `aria-selected` (lines 24622 to 24624), in XSD order.
 */
export const AriaTrueFalseUndefined = closed("AriaTrueFalseUndefined", [
  "true",
  "false",
  "undefined",
]);

/**
 * The `aria-invalid` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24582 to 24585), in XSD order.
 */
export const AriaInvalidValue = closed("AriaInvalidValue", [
  "true",
  "false",
  "grammar",
  "spelling",
]);

/**
 * The `aria-sort` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24637 to 24640), in XSD order.
 */
export const AriaSortValue = closed("AriaSortValue", ["ascending", "descending", "none", "other"]);

/**
 * The eight `aria-current` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 24659 to 24666), in XSD
 * order.
 */
export const AriaCurrentValue = closed("AriaCurrentValue", [
  "page",
  "step",
  "location",
  "date",
  "time",
  "true",
  "false",
  "undefined",
]);

/**
 * The `dir` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 25240 to 25242), in XSD order.
 */
export const TextDirection = closed("TextDirection", ["ltr", "rtl", "auto"]);

/**
 * The `data-qti-suppress-tts` values (`imsqti_asiv3p0p1_v1p0.xsd` lines 25257 to 25259), in XSD
 * order.
 */
export const SuppressTtsMode = closed("SuppressTtsMode", [
  "computer-read-aloud",
  "screen-reader",
  "all",
]);

/**
 * The `valuetype` values of `param` (`imsqti_asiv3p0p1_v1p0.xsd` lines 34499 to 34500), in XSD
 * order.
 */
export const ParamValuetype = closed("ParamValuetype", ["DATA", "REF"]);

/**
 * The `scope` values of `td` and `th` (`imsqti_asiv3p0p1_v1p0.xsd` lines 32499 to 32502). The XSD
 * lists `col`, `colgroup`, `row`, `rowgroup`; the roster lists `row`, `col`, `rowgroup`,
 * `colgroup`.
 */
export const CellScope = closed("CellScope", ["row", "col", "rowgroup", "colgroup"]);

/**
 * The `align` values of `td` and `th` (`imsqti_asiv3p0p1_v1p0.xsd` lines 32519 to 32523), in XSD
 * order.
 */
export const CellAlign = closed("CellAlign", ["left", "center", "right", "justify", "char"]);

/**
 * The `valign` values of `td` and `th` (`imsqti_asiv3p0p1_v1p0.xsd` lines 32536 to 32539), in XSD
 * order.
 */
export const CellValign = closed("CellValign", ["bottom", "middle", "top", "baseline"]);

/**
 * The `preload` values of `audio` and `video` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24972 to 24974),
 * in XSD order.
 */
export const MediaPreload = closed("MediaPreload", ["none", "auto", "metadata"]);

/**
 * The `crossorigin` values of `audio` and `video` (`imsqti_asiv3p0p1_v1p0.xsd` lines 24958 to
 * 24959), in XSD order.
 */
export const CrossOrigin = closed("CrossOrigin", ["anonymous", "use-credentials"]);

/**
 * The `kind` values of `track` (`imsqti_asiv3p0p1_v1p0.xsd` lines 33586 to 33590), in XSD order.
 */
export const TrackKind = closed("TrackKind", [
  "subtitles",
  "captions",
  "descriptions",
  "chapters",
  "metadata",
]);

/**
 * The `format` values of `qti-extended-text-interaction` (`imsqti_asiv3p0p1_v1p0.xsd` lines 27173
 * to 27175), in XSD order.
 */
export const TextFormat = closed("TextFormat", ["plain", "preformatted", "xhtml"]);

/**
 * The values of `audio` and `video` `autoplay`: the three of the 3.0.1 enumeration
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 24988 to 24990) and the `xs:boolean` spellings `1` and `0`
 * that 3.0.0 admits (`imsqti_asiv3p0_v1p0.xsd` types it `xs:boolean`), each version's own set
 * judged by a check.
 */
export const MediaAutoplay = closed("MediaAutoplay", ["true", "false", "1", "0", "autoplay"]);

/**
 * The values of `audio` and `video` `loop`: the three of the 3.0.1 enumeration
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 25005 to 25007) and the `xs:boolean` spellings `1` and `0`
 * that 3.0.0 admits (`imsqti_asiv3p0_v1p0.xsd` types it `xs:boolean`), each version's own set
 * judged by a check.
 */
export const MediaLoop = closed("MediaLoop", ["true", "false", "1", "0", "loop"]);

/**
 * The values of `audio` and `video` `muted`: the three of the 3.0.1 enumeration
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 25021 to 25023) and the `xs:boolean` spellings `1` and `0`
 * that 3.0.0 admits (`imsqti_asiv3p0_v1p0.xsd` types it `xs:boolean`), each version's own set
 * judged by a check.
 */
export const MediaMuted = closed("MediaMuted", ["true", "false", "1", "0", "muted"]);

/**
 * The values of `audio` and `video` `controls`: the three of the 3.0.1 enumeration
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 25037 to 25039) and the `xs:boolean` spellings `1` and `0`
 * that 3.0.0 admits (`imsqti_asiv3p0_v1p0.xsd` types it `xs:boolean`), each version's own set
 * judged by a check.
 */
export const MediaControls = closed("MediaControls", ["true", "false", "1", "0", "controls"]);

/**
 * The values of `track` `default`: the three of the 3.0.1 enumeration (`imsqti_asiv3p0p1_v1p0.xsd`
 * lines 33606 to 33608) and the `xs:boolean` spellings `1` and `0` that 3.0.0 admits
 * (`imsqti_asiv3p0_v1p0.xsd` types it `xs:boolean`), each version's own set judged by a check.
 */
export const TrackDefaultValue = closed("TrackDefaultValue", [
  "true",
  "false",
  "1",
  "0",
  "default",
]);

/**
 * How a `qti-` wildcard admits the namespaces of its elements: any, any but the target namespace,
 * or any but the target namespace and no namespace (`xs:any` `namespace` of `##any`, `##other`
 * and `##other ##local`).
 */
export const NamespacePolicy = closed("NamespacePolicy", ["any", "other", "otherOrLocal"]);

/**
 * How strictly a wildcard judges the content it admits (`xs:any` `processContents`).
 */
export const ProcessContents = closed("ProcessContents", ["lax", "strict", "skip"]);

/**
 * The namespaces the four schema sets and their imports name, by the prefix `seed/wildcard.ts`
 * gives each, and `absent` for no namespace (XML Schema's word; a roster handle cannot be empty).
 * A column of this roster holds a seeded namespace, never an author's. Handles are prefixes, not
 * URIs: grizzle lowers a roster to a PostgreSQL enum, whose labels hold at most 63 bytes.
 */
export const SchemaNamespace = closed("SchemaNamespace", [
  "asi",
  "cp",
  "cpx",
  "csmd",
  "drd",
  "lom",
  "mathml",
  "qmd",
  "ssml",
  "ud",
  "xi",
  "xlink",
  "xml",
  "xmlns",
  "xsi",
  "absent",
]);

/**
 * The schema sets a foreign tree is judged against: the QTI assessment-item schema, the content
 * packaging manifest schema, the LOM schema and the usage data schema.
 */
export const SchemaSet = closed("SchemaSet", ["asi", "manifest", "lom", "usagedata"]);

/**
 * The values of `xlink:type` (`w3/xlink.xsd` line 31).
 */
export const XlinkTypeValue = closed("XlinkTypeValue", [
  "simple",
  "extended",
  "title",
  "resource",
  "locator",
  "arc",
]);

/**
 * The values of `xlink:show` (`w3/xlink.xsd` line 72).
 */
export const XlinkShowValue = closed("XlinkShowValue", [
  "new",
  "replace",
  "embed",
  "other",
  "none",
]);

/**
 * The values of `xlink:actuate` (`w3/xlink.xsd` line 84).
 */
export const XlinkActuateValue = closed("XlinkActuateValue", [
  "onLoad",
  "onRequest",
  "other",
  "none",
]);

/**
 * The values of `xml:space` (`w3/xml.xsd`'s enumeration).
 */
export const XmlSpace = closed("XmlSpace", ["default", "preserve"]);

/**
 * The `navigation-mode` of a test part: the paths a candidate may take through it
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 33365 to 33377).
 */
export const NavigationMode = closed("NavigationMode", ["linear", "nonlinear"]);

/**
 * The `submission-mode` of a test part: when responses go to response processing
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 33379 to 33391).
 */
export const SubmissionMode = closed("SubmissionMode", ["individual", "simultaneous"]);

/**
 * The `access` of a test feedback: when it shows to the candidate
 * (`imsqti_asiv3p0p1_v1p0.xsd` lines 33220 to 33231).
 */
export const TestFeedbackAccess = closed("TestFeedbackAccess", ["atEnd", "during"]);

/**
 * The three exit values of a branch rule `target` (INFO#DataCharacteristic_BranchRule.Attr_target).
 */
export const BranchExit = closed("BranchExit", ["EXIT_SECTION", "EXIT_TESTPART", "EXIT_TEST"]);

/**
 * Which a branch rule target is: an exit value or a reference to an identifier.
 */
export const BranchTarget = closed("BranchTarget", ["exit", "ref"]);

/**
 * Which kind of test structure node holds a child.
 */
export const StructureHolder = closed("StructureHolder", [
  "part",
  "section",
  "sectionRef",
  "itemRef",
]);

/**
 * What an item reference resolves to: an item or a learning tools interoperability tool.
 */
export const ItemRefTarget = closed("ItemRefTarget", ["item", "lti"]);

/**
 * Where a prefixed identifier is declared: by the item, by a mapping or by the built in set.
 */
export const PrefixedSource = closed("PrefixedSource", ["declared", "mapped", "builtIn"]);

/**
 * What a section variable reference names: a declared variable, a prefixed one or a duration.
 */
export const SectionVariableTarget = closed("SectionVariableTarget", [
  "declared",
  "prefixed",
  "duration",
]);

/**
 * The rosters as schema members.
 */
export const relations = {
  AriaAutocompleteValue,
  AriaCurrentValue,
  AriaInvalidValue,
  AriaLiveValue,
  AriaOrientationValue,
  AriaRoleValue,
  AriaSortValue,
  AriaTristate,
  AriaTrueFalseUndefined,
  BooleanLiteral,
  Bound,
  BranchExit,
  BranchTarget,
  CellAlign,
  CellScope,
  CellValign,
  CpSchema,
  CrossOrigin,
  ExternalScored,
  IdrefAttribute,
  ItemRefTarget,
  MathConstantName,
  MathOperatorName,
  MediaAutoplay,
  MediaControls,
  MediaLoop,
  MediaMuted,
  MediaPreload,
  NamespacePolicy,
  NavigationMode,
  Orientation,
  ParamValuetype,
  PrefixedSource,
  ProcessContents,
  QmdFeedbackTypeValue,
  QmdInteractionTypeValue,
  QmdScoringModeValue,
  RoundingMode,
  SchemaNamespace,
  SchemaSet,
  SectionVariableTarget,
  Shape,
  ShowHide,
  StatsOperatorName,
  StructureHolder,
  SubmissionMode,
  SuppressTtsMode,
  TestFeedbackAccess,
  TextDirection,
  TextFormat,
  ToleranceMode,
  ToolShape,
  TrackDefaultValue,
  TrackKind,
  XIncludeParseValue,
  XlinkActuateValue,
  XlinkShowValue,
  XlinkTypeValue,
  XmlSpace,
  XsBoolean,
  YesNo,
};

/**
 * The statements of this module: none.
 */
export const rules = [];

/**
 * A handle of `Shape`.
 */
export type ShapeHandle = (typeof Shape.handles)[number];

/**
 * A handle of `ShowHide`.
 */
export type ShowHideHandle = (typeof ShowHide.handles)[number];

/**
 * A handle of `Orientation`.
 */
export type OrientationHandle = (typeof Orientation.handles)[number];

/**
 * A handle of `Bound`.
 */
export type BoundHandle = (typeof Bound.handles)[number];

/**
 * A handle of `ToolShape`.
 */
export type ToolShapeHandle = (typeof ToolShape.handles)[number];

/**
 * A handle of `YesNo`.
 */
export type YesNoHandle = (typeof YesNo.handles)[number];

/**
 * A handle of `IdrefAttribute`.
 */
export type IdrefAttributeHandle = (typeof IdrefAttribute.handles)[number];

/**
 * A handle of `XsBoolean`.
 */
export type XsBooleanHandle = (typeof XsBoolean.handles)[number];

/**
 * A handle of `CpSchema`.
 */
export type CpSchemaHandle = (typeof CpSchema.handles)[number];

/**
 * A handle of `QmdInteractionTypeValue`.
 */
export type QmdInteractionTypeValueHandle = (typeof QmdInteractionTypeValue.handles)[number];

/**
 * A handle of `QmdFeedbackTypeValue`.
 */
export type QmdFeedbackTypeValueHandle = (typeof QmdFeedbackTypeValue.handles)[number];

/**
 * A handle of `QmdScoringModeValue`.
 */
export type QmdScoringModeValueHandle = (typeof QmdScoringModeValue.handles)[number];

/**
 * A handle of `BooleanLiteral`.
 */
export type BooleanLiteralHandle = (typeof BooleanLiteral.handles)[number];

/**
 * A handle of `ExternalScored`.
 */
export type ExternalScoredHandle = (typeof ExternalScored.handles)[number];

/**
 * A handle of `ToleranceMode`.
 */
export type ToleranceModeHandle = (typeof ToleranceMode.handles)[number];

/**
 * A handle of `RoundingMode`.
 */
export type RoundingModeHandle = (typeof RoundingMode.handles)[number];

/**
 * A handle of `MathOperatorName`.
 */
export type MathOperatorNameHandle = (typeof MathOperatorName.handles)[number];

/**
 * A handle of `StatsOperatorName`.
 */
export type StatsOperatorNameHandle = (typeof StatsOperatorName.handles)[number];

/**
 * A handle of `MathConstantName`.
 */
export type MathConstantNameHandle = (typeof MathConstantName.handles)[number];

/**
 * A handle of `XIncludeParseValue`.
 */
export type XIncludeParseValueHandle = (typeof XIncludeParseValue.handles)[number];

/**
 * A handle of `AriaRoleValue`.
 */
export type AriaRoleValueHandle = (typeof AriaRoleValue.handles)[number];

/**
 * A handle of `AriaLiveValue`.
 */
export type AriaLiveValueHandle = (typeof AriaLiveValue.handles)[number];

/**
 * A handle of `AriaOrientationValue`.
 */
export type AriaOrientationValueHandle = (typeof AriaOrientationValue.handles)[number];

/**
 * A handle of `AriaAutocompleteValue`.
 */
export type AriaAutocompleteValueHandle = (typeof AriaAutocompleteValue.handles)[number];

/**
 * A handle of `AriaTristate`.
 */
export type AriaTristateHandle = (typeof AriaTristate.handles)[number];

/**
 * A handle of `AriaTrueFalseUndefined`.
 */
export type AriaTrueFalseUndefinedHandle = (typeof AriaTrueFalseUndefined.handles)[number];

/**
 * A handle of `AriaInvalidValue`.
 */
export type AriaInvalidValueHandle = (typeof AriaInvalidValue.handles)[number];

/**
 * A handle of `AriaSortValue`.
 */
export type AriaSortValueHandle = (typeof AriaSortValue.handles)[number];

/**
 * A handle of `AriaCurrentValue`.
 */
export type AriaCurrentValueHandle = (typeof AriaCurrentValue.handles)[number];

/**
 * A handle of `TextDirection`.
 */
export type TextDirectionHandle = (typeof TextDirection.handles)[number];

/**
 * A handle of `SuppressTtsMode`.
 */
export type SuppressTtsModeHandle = (typeof SuppressTtsMode.handles)[number];

/**
 * A handle of `ParamValuetype`.
 */
export type ParamValuetypeHandle = (typeof ParamValuetype.handles)[number];

/**
 * A handle of `CellScope`.
 */
export type CellScopeHandle = (typeof CellScope.handles)[number];

/**
 * A handle of `CellAlign`.
 */
export type CellAlignHandle = (typeof CellAlign.handles)[number];

/**
 * A handle of `CellValign`.
 */
export type CellValignHandle = (typeof CellValign.handles)[number];

/**
 * A handle of `MediaPreload`.
 */
export type MediaPreloadHandle = (typeof MediaPreload.handles)[number];

/**
 * A handle of `CrossOrigin`.
 */
export type CrossOriginHandle = (typeof CrossOrigin.handles)[number];

/**
 * A handle of `TrackKind`.
 */
export type TrackKindHandle = (typeof TrackKind.handles)[number];

/**
 * A handle of `TextFormat`.
 */
export type TextFormatHandle = (typeof TextFormat.handles)[number];

/**
 * A handle of `MediaAutoplay`.
 */
export type MediaAutoplayHandle = (typeof MediaAutoplay.handles)[number];

/**
 * A handle of `MediaLoop`.
 */
export type MediaLoopHandle = (typeof MediaLoop.handles)[number];

/**
 * A handle of `MediaMuted`.
 */
export type MediaMutedHandle = (typeof MediaMuted.handles)[number];

/**
 * A handle of `MediaControls`.
 */
export type MediaControlsHandle = (typeof MediaControls.handles)[number];

/**
 * A handle of `TrackDefaultValue`.
 */
export type TrackDefaultValueHandle = (typeof TrackDefaultValue.handles)[number];

/**
 * A handle of `NamespacePolicy`.
 */
export type NamespacePolicyHandle = (typeof NamespacePolicy.handles)[number];

/**
 * A handle of `ProcessContents`.
 */
export type ProcessContentsHandle = (typeof ProcessContents.handles)[number];

/**
 * A handle of `SchemaNamespace`.
 */
export type SchemaNamespaceHandle = (typeof SchemaNamespace.handles)[number];

/**
 * A handle of `SchemaSet`.
 */
export type SchemaSetHandle = (typeof SchemaSet.handles)[number];

/**
 * A handle of `XlinkTypeValue`.
 */
export type XlinkTypeValueHandle = (typeof XlinkTypeValue.handles)[number];

/**
 * A handle of `XlinkShowValue`.
 */
export type XlinkShowValueHandle = (typeof XlinkShowValue.handles)[number];

/**
 * A handle of `XlinkActuateValue`.
 */
export type XlinkActuateValueHandle = (typeof XlinkActuateValue.handles)[number];

/**
 * A handle of `XmlSpace`.
 */
export type XmlSpaceHandle = (typeof XmlSpace.handles)[number];
