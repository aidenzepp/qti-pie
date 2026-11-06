/**
 * Which attributes a node kind may carry, and the attributes every element shares.
 *
 * `AttributeAdmission` is seeded from the registries (`seed/attribute-admission.ts`) and read-only
 * to every role. Each family relation stores one attribute of the base families (spec 4.2) as an
 * optional value keyed by its node, and its kind and attribute are contained together into the
 * admission rows, so a node of a kind that does not carry the attribute cannot hold the row. The
 * statements that read `AttributeAdmission` live here, in the leaf: the O3 containment of the
 * lexical forms.
 *
 * The 48 ARIA relations (`role` and 47 `aria-*` attributes, `aria-keyshorts` the 48th) are one
 * relation per attribute, `Aria<Name>`, each kind-copied and admitted like the base families. Their
 * value patterns or closed rosters, by relation:
 * AriaActivedescendant: `patterns.ncName`
 * AriaAtomic: `XsBoolean`, a closed roster
 * AriaAutocomplete: `AriaAutocompleteValue`, a closed roster
 * AriaBusy: `XsBoolean`, a closed roster
 * AriaChecked: `AriaTristate`, a closed roster
 * AriaColcount: `patterns.xsInteger`
 * AriaColindex: `patterns.xsInteger`
 * AriaColspan: `patterns.xsInteger`
 * AriaControls: `patterns.ncNameList`
 * AriaCurrent: `AriaCurrentValue`, a closed roster
 * AriaDescribedby: `patterns.ncNameList`
 * AriaDetails: `patterns.ncName`
 * AriaDisabled: `XsBoolean`, a closed roster
 * AriaErrormessage: `patterns.ncName`
 * AriaExpanded: `AriaTrueFalseUndefined`, a closed roster
 * AriaFlowto: `patterns.ncNameList`
 * AriaHaspopup: `XsBoolean`, a closed roster
 * AriaHidden: `XsBoolean`, a closed roster
 * AriaInvalid: `AriaInvalidValue`, a closed roster
 * AriaKeyshortcuts: `patterns.xsString`
 * AriaKeyshorts: `patterns.xsString`
 * AriaLabel: `patterns.xsNormalizedString`
 * AriaLabelledby: `patterns.ncNameList`
 * AriaLevel: `patterns.positiveInteger`
 * AriaLive: `AriaLiveValue`, a closed roster
 * AriaModal: `XsBoolean`, a closed roster
 * AriaMultiline: `XsBoolean`, a closed roster
 * AriaMultiselectable: `XsBoolean`, a closed roster
 * AriaOrientation: `AriaOrientationValue`, a closed roster
 * AriaOwns: `patterns.ncNameList`
 * AriaPlaceholder: `patterns.xsString`
 * AriaPosinset: `patterns.positiveInteger`
 * AriaPressed: `AriaTristate`, a closed roster
 * AriaReadonly: `XsBoolean`, a closed roster
 * AriaRelevant: `patterns.ariaRelevantList`
 * AriaRequired: `XsBoolean`, a closed roster
 * AriaRole: `AriaRoleValue`, a closed roster
 * AriaRoledescription: `patterns.xsString`
 * AriaRowcount: `patterns.xsInteger`
 * AriaRowindex: `patterns.xsInteger`
 * AriaRowspan: `patterns.xsInteger`
 * AriaSelected: `AriaTrueFalseUndefined`, a closed roster
 * AriaSetsize: `patterns.xsInteger`
 * AriaSort: `AriaSortValue`, a closed roster
 * AriaValuemax: `patterns.xsDecimal`
 * AriaValuemin: `patterns.xsDecimal`
 * AriaValuenow: `patterns.xsDecimal`
 * AriaValuetext: `patterns.xsString` *
 * `aria-haspopup` is `xs:boolean` in the XSD, so it takes `xsBoolean` and no ARIA pattern; the XSD
 * names no ARIA types, each enumeration being anonymous per attribute. The `IDREF` and `IDREFS`
 * attributes also write their token rows to `AttributeIdref`.
 *
 * O1: composite-key form taken, refusal: `UnsupportedLawFamily at contained
 * AriaActivedescendant(kind) in AttributeAdmission(kind) selected (attributes.ts:794:3): a
 * containment into a selected target into a projection that contains a key of AttributeAdmission;
 * (kind) contains none, and a containment into an unkeyed projection is not admitted`. Each
 * relation so carries a constant `attribute` column, held to its one handle by a check.
 */
import {
  Compute,
  capacity,
  check,
  closedId,
  contained,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import {
  AriaAutocompleteValue,
  AriaCurrentValue,
  AriaInvalidValue,
  AriaLiveValue,
  AriaOrientationValue,
  AriaRoleValue,
  AriaSortValue,
  AriaTristate,
  AriaTrueFalseUndefined,
  IdrefAttribute,
  SuppressTtsMode,
  TextDirection,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import { DocumentId, HtmlId } from "#pantry/schema/document.ts";
import {
  AttributeLexical,
  AttributeName,
  AttributeSpelling,
  Node,
  NodeKind,
  RootKind,
} from "#pantry/schema/node.ts";
import {
  AriaInteger,
  AriaPositiveInteger,
  ClassList,
  ContentLanguage,
  IdReference,
  XmlBaseUri,
} from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * One attribute a node kind may carry. Seeded by a custom migration and read-only to every role.
 */
export const AttributeAdmission = relation(
  "AttributeAdmission",
  { attribute: closedId(AttributeName), kind: closedId(NodeKind) },
  ["kind", "attribute"],
);

/**
 * The `class` of a node: space-separated tokens, or empty.
 */
export const NodeClass = relation(
  "NodeClass",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: ClassList,
  },
  ["node"],
);

/**
 * The `lang` of a node.
 */
export const NodeLang = relation(
  "NodeLang",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: ContentLanguage,
  },
  ["node"],
);

/**
 * The `xml:lang` of a node, with the tree and root kind of the node copied for the rules that
 * read it by root.
 */
export const NodeXmlLang = relation(
  "NodeXmlLang",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    rootKind: closedId(RootKind),
    tree: uuid,
    value: str.regex(patterns.bcp47),
  },
  ["node"],
);

/**
 * The `label` of a node that is not an item or stimulus root, whose `label` is
 * `AssessmentItemLabel`'s.
 */
export const NodeLabel = relation(
  "NodeLabel",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    rootKind: closedId(RootKind),
    tree: uuid,
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  },
  ["node"],
);

/**
 * The `dir` of a node.
 */
export const NodeDir = relation(
  "NodeDir",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(TextDirection),
  },
  ["node"],
);

/**
 * The `xml:base` of a node.
 */
export const NodeXmlBase = relation(
  "NodeXmlBase",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: XmlBaseUri,
  },
  ["node"],
);

/**
 * The `data-qti-suppress-tts` of a node.
 */
export const NodeSuppressTts = relation(
  "NodeSuppressTts",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(SuppressTtsMode),
  },
  ["node"],
);

/**
 * The `data-catalog-idref` of a node. Its containment into the catalog holder is declared with
 * the catalog holder, not here.
 */
export const NodeCatalogIdref = relation(
  "NodeCatalogIdref",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    value: IdReference,
  },
  ["node"],
);

/**
 * One identifier an `IDREF` or `IDREFS` attribute names, at its position among the attribute's
 * tokens.
 */
export const AttributeIdref = relation(
  "AttributeIdref",
  {
    attribute: closedId(IdrefAttribute),
    document: uuid,
    node: uuid,
    position: pg.bigint,
    target: str.regex(patterns.ncName),
  },
  ["node", "attribute", "position"],
);

/**
 * The copy of an `AttributeIdref` row of `headers`, which must name a `th`. The importer writes it
 * for exactly the `headers` rows; the statement that selects `AttributeIdref` by attribute and
 * `HtmlId` by kind in one containment has two selectors, which the engine refuses, so the `th`
 * rule reads this thin relation instead.
 */
export const HeadersTarget = relation(
  "HeadersTarget",
  {
    attribute: closedId(IdrefAttribute),
    document: uuid,
    node: uuid,
    position: pg.bigint,
    target: str.regex(patterns.ncName),
  },
  ["node", "position"],
);

/**
 * The `aria-activedescendant` of a node, by `patterns.ncName`.
 */
export const AriaActivedescendant = relation(
  "AriaActivedescendant",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: IdReference,
  },
  ["node"],
);

/**
 * The `aria-atomic` of a node, by the `XsBoolean` roster.
 */
export const AriaAtomic = relation(
  "AriaAtomic",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-autocomplete` of a node, by the `AriaAutocompleteValue` roster.
 */
export const AriaAutocomplete = relation(
  "AriaAutocomplete",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaAutocompleteValue),
  },
  ["node"],
);

/**
 * The `aria-busy` of a node, by the `XsBoolean` roster.
 */
export const AriaBusy = relation(
  "AriaBusy",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-checked` of a node, by the `AriaTristate` roster.
 */
export const AriaChecked = relation(
  "AriaChecked",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaTristate),
  },
  ["node"],
);

/**
 * The `aria-colcount` of a node, by `patterns.xsInteger`.
 */
export const AriaColcount = relation(
  "AriaColcount",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-colindex` of a node, by `patterns.xsInteger`.
 */
export const AriaColindex = relation(
  "AriaColindex",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-colspan` of a node, by `patterns.xsInteger`.
 */
export const AriaColspan = relation(
  "AriaColspan",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-controls` of a node, by `patterns.ncNameList`.
 */
export const AriaControls = relation(
  "AriaControls",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncNameList),
  },
  ["node"],
);

/**
 * The `aria-current` of a node, by the `AriaCurrentValue` roster.
 */
export const AriaCurrent = relation(
  "AriaCurrent",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaCurrentValue),
  },
  ["node"],
);

/**
 * The `aria-describedby` of a node, by `patterns.ncNameList`.
 */
export const AriaDescribedby = relation(
  "AriaDescribedby",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncNameList),
  },
  ["node"],
);

/**
 * The `aria-details` of a node, by `patterns.ncName`.
 */
export const AriaDetails = relation(
  "AriaDetails",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: IdReference,
  },
  ["node"],
);

/**
 * The `aria-disabled` of a node, by the `XsBoolean` roster.
 */
export const AriaDisabled = relation(
  "AriaDisabled",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-errormessage` of a node, by `patterns.ncName`.
 */
export const AriaErrormessage = relation(
  "AriaErrormessage",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: IdReference,
  },
  ["node"],
);

/**
 * The `aria-expanded` of a node, by the `AriaTrueFalseUndefined` roster.
 */
export const AriaExpanded = relation(
  "AriaExpanded",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaTrueFalseUndefined),
  },
  ["node"],
);

/**
 * The `aria-flowto` of a node, by `patterns.ncNameList`.
 */
export const AriaFlowto = relation(
  "AriaFlowto",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncNameList),
  },
  ["node"],
);

/**
 * The `aria-haspopup` of a node, by the `XsBoolean` roster.
 */
export const AriaHaspopup = relation(
  "AriaHaspopup",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-hidden` of a node, by the `XsBoolean` roster.
 */
export const AriaHidden = relation(
  "AriaHidden",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-invalid` of a node, by the `AriaInvalidValue` roster.
 */
export const AriaInvalid = relation(
  "AriaInvalid",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaInvalidValue),
  },
  ["node"],
);

/**
 * The `aria-keyshortcuts` of a node, by `patterns.xsString`.
 */
export const AriaKeyshortcuts = relation(
  "AriaKeyshortcuts",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node"],
);

/**
 * The `aria-keyshorts` of a node, by `patterns.xsString`.
 */
export const AriaKeyshorts = relation(
  "AriaKeyshorts",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node"],
);

/**
 * The `aria-label` of a node, by `patterns.xsNormalizedString`.
 */
export const AriaLabel = relation(
  "AriaLabel",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  },
  ["node"],
);

/**
 * The `aria-labelledby` of a node, by `patterns.ncNameList`.
 */
export const AriaLabelledby = relation(
  "AriaLabelledby",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncNameList),
  },
  ["node"],
);

/**
 * The `aria-level` of a node, by `patterns.positiveInteger`.
 */
export const AriaLevel = relation(
  "AriaLevel",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaPositiveInteger,
  },
  ["node"],
);

/**
 * The `aria-live` of a node, by the `AriaLiveValue` roster.
 */
export const AriaLive = relation(
  "AriaLive",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaLiveValue),
  },
  ["node"],
);

/**
 * The `aria-modal` of a node, by the `XsBoolean` roster.
 */
export const AriaModal = relation(
  "AriaModal",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-multiline` of a node, by the `XsBoolean` roster.
 */
export const AriaMultiline = relation(
  "AriaMultiline",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-multiselectable` of a node, by the `XsBoolean` roster.
 */
export const AriaMultiselectable = relation(
  "AriaMultiselectable",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-orientation` of a node, by the `AriaOrientationValue` roster.
 */
export const AriaOrientation = relation(
  "AriaOrientation",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaOrientationValue),
  },
  ["node"],
);

/**
 * The `aria-owns` of a node, by `patterns.ncNameList`.
 */
export const AriaOwns = relation(
  "AriaOwns",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncNameList),
  },
  ["node"],
);

/**
 * The `aria-placeholder` of a node, by `patterns.xsString`.
 */
export const AriaPlaceholder = relation(
  "AriaPlaceholder",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node"],
);

/**
 * The `aria-posinset` of a node, by `patterns.positiveInteger`.
 */
export const AriaPosinset = relation(
  "AriaPosinset",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaPositiveInteger,
  },
  ["node"],
);

/**
 * The `aria-pressed` of a node, by the `AriaTristate` roster.
 */
export const AriaPressed = relation(
  "AriaPressed",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaTristate),
  },
  ["node"],
);

/**
 * The `aria-readonly` of a node, by the `XsBoolean` roster.
 */
export const AriaReadonly = relation(
  "AriaReadonly",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `aria-relevant` of a node, by `patterns.ariaRelevantList`.
 */
export const AriaRelevant = relation(
  "AriaRelevant",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ariaRelevantList),
  },
  ["node"],
);

/**
 * The `aria-required` of a node, by the `XsBoolean` roster.
 */
export const AriaRequired = relation(
  "AriaRequired",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XsBoolean),
  },
  ["node"],
);

/**
 * The `role` of a node, by the `AriaRoleValue` roster.
 */
export const AriaRole = relation(
  "AriaRole",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaRoleValue),
  },
  ["node"],
);

/**
 * The `aria-roledescription` of a node, by `patterns.xsString`.
 */
export const AriaRoledescription = relation(
  "AriaRoledescription",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node"],
);

/**
 * The `aria-rowcount` of a node, by `patterns.xsInteger`.
 */
export const AriaRowcount = relation(
  "AriaRowcount",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-rowindex` of a node, by `patterns.xsInteger`.
 */
export const AriaRowindex = relation(
  "AriaRowindex",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-rowspan` of a node, by `patterns.xsInteger`.
 */
export const AriaRowspan = relation(
  "AriaRowspan",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-selected` of a node, by the `AriaTrueFalseUndefined` roster.
 */
export const AriaSelected = relation(
  "AriaSelected",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaTrueFalseUndefined),
  },
  ["node"],
);

/**
 * The `aria-setsize` of a node, by `patterns.xsInteger`.
 */
export const AriaSetsize = relation(
  "AriaSetsize",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: AriaInteger,
  },
  ["node"],
);

/**
 * The `aria-sort` of a node, by the `AriaSortValue` roster.
 */
export const AriaSort = relation(
  "AriaSort",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(AriaSortValue),
  },
  ["node"],
);

/**
 * The `aria-valuemax` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuemax = relation(
  "AriaValuemax",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsDecimal),
  },
  ["node"],
);

/**
 * The `aria-valuemin` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuemin = relation(
  "AriaValuemin",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsDecimal),
  },
  ["node"],
);

/**
 * The `aria-valuenow` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuenow = relation(
  "AriaValuenow",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsDecimal),
  },
  ["node"],
);

/**
 * The `aria-valuetext` of a node, by `patterns.xsString`.
 */
export const AriaValuetext = relation(
  "AriaValuetext",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  AriaActivedescendant,
  AriaAtomic,
  AriaAutocomplete,
  AriaBusy,
  AriaChecked,
  AriaColcount,
  AriaColindex,
  AriaColspan,
  AriaControls,
  AriaCurrent,
  AriaDescribedby,
  AriaDetails,
  AriaDisabled,
  AriaErrormessage,
  AriaExpanded,
  AriaFlowto,
  AriaHaspopup,
  AriaHidden,
  AriaInvalid,
  AriaKeyshortcuts,
  AriaKeyshorts,
  AriaLabel,
  AriaLabelledby,
  AriaLevel,
  AriaLive,
  AriaModal,
  AriaMultiline,
  AriaMultiselectable,
  AriaOrientation,
  AriaOwns,
  AriaPlaceholder,
  AriaPosinset,
  AriaPressed,
  AriaReadonly,
  AriaRelevant,
  AriaRequired,
  AriaRole,
  AriaRoledescription,
  AriaRowcount,
  AriaRowindex,
  AriaRowspan,
  AriaSelected,
  AriaSetsize,
  AriaSort,
  AriaValuemax,
  AriaValuemin,
  AriaValuenow,
  AriaValuetext,
  AttributeAdmission,
  AttributeIdref,
  HeadersTarget,
  NodeCatalogIdref,
  NodeClass,
  NodeDir,
  NodeLabel,
  NodeLang,
  NodeSuppressTts,
  NodeXmlBase,
  NodeXmlLang,
};

/**
 * No arms: no relation here is keyed by an arm's node.
 */
export const arms = {};

/**
 * The statements over this module's relations and the leaf relations it reads.
 */
export const rules = [
  contained(on(AttributeLexical, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  contained(
    on(AttributeSpelling, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
  contained(on(HtmlId, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("HtmlIdAttribute", HtmlId, (row) => row.eq(row.attribute, "id")),
  contained(on(NodeClass, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeClass, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeClassAttribute", NodeClass, (row) => row.eq(row.attribute, "class")),
  contained(on(NodeLang, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeLang, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeLangAttribute", NodeLang, (row) => row.eq(row.attribute, "lang")),
  contained(on(NodeXmlLang, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeXmlLang, "node", "tree", "rootKind"), on(Node, "id", "tree", "rootKind")),
  contained(on(NodeXmlLang, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeXmlLangAttribute", NodeXmlLang, (row) => row.eq(row.attribute, "xml:lang")),
  contained(on(NodeLabel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeLabel, "node", "tree", "rootKind"), on(Node, "id", "tree", "rootKind")),
  contained(on(NodeLabel, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeLabelAttribute", NodeLabel, (row) => row.eq(row.attribute, "label")),
  check("NodeLabelNotRoot", NodeLabel, (row) =>
    row.and(row.ne(row.kind, "qti-assessment-item"), row.ne(row.kind, "qti-assessment-stimulus")),
  ),
  contained(on(NodeDir, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeDir, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeDirAttribute", NodeDir, (row) => row.eq(row.attribute, "dir")),
  check("BdoDirNotAuto", NodeDir, (row) =>
    row.or(row.ne(row.kind, "bdo"), row.ne(row.value, "auto")),
  ),
  capacity(on(select(Node, { kind: "bdo" }), "id"), {
    from: on(NodeDir, "node"),
    within: within(1n, 1n),
  }),
  contained(on(NodeXmlBase, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeXmlBase, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeXmlBaseAttribute", NodeXmlBase, (row) => row.eq(row.attribute, "xml:base")),
  contained(on(NodeSuppressTts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeSuppressTts, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeSuppressTtsAttribute", NodeSuppressTts, (row) =>
    row.eq(row.attribute, "data-qti-suppress-tts"),
  ),
  contained(on(NodeCatalogIdref, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeCatalogIdref, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeCatalogIdrefAttribute", NodeCatalogIdref, (row) =>
    row.eq(row.attribute, "data-catalog-idref"),
  ),
  contained(on(AttributeIdref, "document", "target"), on(DocumentId, "document", "id")),
  contained(on(AttributeIdref, "node", "document"), on(Node, "id", "tree")),
  contained(
    on(HeadersTarget, "document", "target"),
    on(select(HtmlId, { kind: "th" }), "document", "id"),
  ),
  contained(
    on(HeadersTarget, "node", "attribute", "position", "target"),
    on(AttributeIdref, "node", "attribute", "position", "target"),
  ),
  check("HeadersTargetAttribute", HeadersTarget, (row) => row.eq(row.attribute, "headers")),
  contained(on(AriaActivedescendant, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(AriaActivedescendant, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
  check("AriaActivedescendantAttribute", AriaActivedescendant, (row) =>
    row.eq(row.attribute, "aria-activedescendant"),
  ),
  contained(on(AriaAtomic, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaAtomic, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaAtomicAttribute", AriaAtomic, (row) => row.eq(row.attribute, "aria-atomic")),
  contained(on(AriaAutocomplete, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaAutocomplete, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaAutocompleteAttribute", AriaAutocomplete, (row) =>
    row.eq(row.attribute, "aria-autocomplete"),
  ),
  contained(on(AriaBusy, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaBusy, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaBusyAttribute", AriaBusy, (row) => row.eq(row.attribute, "aria-busy")),
  contained(on(AriaChecked, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaChecked, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaCheckedAttribute", AriaChecked, (row) => row.eq(row.attribute, "aria-checked")),
  contained(on(AriaColcount, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColcount, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaColcountAttribute", AriaColcount, (row) => row.eq(row.attribute, "aria-colcount")),
  contained(on(AriaColindex, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColindex, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaColindexAttribute", AriaColindex, (row) => row.eq(row.attribute, "aria-colindex")),
  contained(on(AriaColspan, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColspan, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaColspanAttribute", AriaColspan, (row) => row.eq(row.attribute, "aria-colspan")),
  contained(on(AriaControls, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaControls, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaControlsAttribute", AriaControls, (row) => row.eq(row.attribute, "aria-controls")),
  contained(on(AriaCurrent, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaCurrent, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaCurrentAttribute", AriaCurrent, (row) => row.eq(row.attribute, "aria-current")),
  contained(on(AriaDescribedby, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDescribedby, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaDescribedbyAttribute", AriaDescribedby, (row) =>
    row.eq(row.attribute, "aria-describedby"),
  ),
  contained(on(AriaDetails, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDetails, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaDetailsAttribute", AriaDetails, (row) => row.eq(row.attribute, "aria-details")),
  contained(on(AriaDisabled, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDisabled, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaDisabledAttribute", AriaDisabled, (row) => row.eq(row.attribute, "aria-disabled")),
  contained(on(AriaErrormessage, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaErrormessage, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaErrormessageAttribute", AriaErrormessage, (row) =>
    row.eq(row.attribute, "aria-errormessage"),
  ),
  contained(on(AriaExpanded, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaExpanded, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaExpandedAttribute", AriaExpanded, (row) => row.eq(row.attribute, "aria-expanded")),
  contained(on(AriaFlowto, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaFlowto, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaFlowtoAttribute", AriaFlowto, (row) => row.eq(row.attribute, "aria-flowto")),
  contained(on(AriaHaspopup, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaHaspopup, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaHaspopupAttribute", AriaHaspopup, (row) => row.eq(row.attribute, "aria-haspopup")),
  contained(on(AriaHidden, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaHidden, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaHiddenAttribute", AriaHidden, (row) => row.eq(row.attribute, "aria-hidden")),
  contained(on(AriaInvalid, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaInvalid, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaInvalidAttribute", AriaInvalid, (row) => row.eq(row.attribute, "aria-invalid")),
  contained(on(AriaKeyshortcuts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaKeyshortcuts, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaKeyshortcutsAttribute", AriaKeyshortcuts, (row) =>
    row.eq(row.attribute, "aria-keyshortcuts"),
  ),
  contained(on(AriaKeyshorts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaKeyshorts, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaKeyshortsAttribute", AriaKeyshorts, (row) => row.eq(row.attribute, "aria-keyshorts")),
  contained(on(AriaLabel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLabel, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaLabelAttribute", AriaLabel, (row) => row.eq(row.attribute, "aria-label")),
  contained(on(AriaLabelledby, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLabelledby, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaLabelledbyAttribute", AriaLabelledby, (row) =>
    row.eq(row.attribute, "aria-labelledby"),
  ),
  contained(on(AriaLevel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLevel, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaLevelAttribute", AriaLevel, (row) => row.eq(row.attribute, "aria-level")),
  contained(on(AriaLive, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLive, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaLiveAttribute", AriaLive, (row) => row.eq(row.attribute, "aria-live")),
  contained(on(AriaModal, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaModal, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaModalAttribute", AriaModal, (row) => row.eq(row.attribute, "aria-modal")),
  contained(on(AriaMultiline, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaMultiline, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaMultilineAttribute", AriaMultiline, (row) => row.eq(row.attribute, "aria-multiline")),
  contained(on(AriaMultiselectable, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(AriaMultiselectable, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
  check("AriaMultiselectableAttribute", AriaMultiselectable, (row) =>
    row.eq(row.attribute, "aria-multiselectable"),
  ),
  contained(on(AriaOrientation, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaOrientation, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaOrientationAttribute", AriaOrientation, (row) =>
    row.eq(row.attribute, "aria-orientation"),
  ),
  contained(on(AriaOwns, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaOwns, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaOwnsAttribute", AriaOwns, (row) => row.eq(row.attribute, "aria-owns")),
  contained(on(AriaPlaceholder, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPlaceholder, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaPlaceholderAttribute", AriaPlaceholder, (row) =>
    row.eq(row.attribute, "aria-placeholder"),
  ),
  contained(on(AriaPosinset, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPosinset, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaPosinsetAttribute", AriaPosinset, (row) => row.eq(row.attribute, "aria-posinset")),
  contained(on(AriaPressed, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPressed, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaPressedAttribute", AriaPressed, (row) => row.eq(row.attribute, "aria-pressed")),
  contained(on(AriaReadonly, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaReadonly, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaReadonlyAttribute", AriaReadonly, (row) => row.eq(row.attribute, "aria-readonly")),
  contained(on(AriaRelevant, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRelevant, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRelevantAttribute", AriaRelevant, (row) => row.eq(row.attribute, "aria-relevant")),
  contained(on(AriaRequired, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRequired, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRequiredAttribute", AriaRequired, (row) => row.eq(row.attribute, "aria-required")),
  contained(on(AriaRole, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRole, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRoleAttribute", AriaRole, (row) => row.eq(row.attribute, "role")),
  contained(on(AriaRoledescription, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(AriaRoledescription, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
  check("AriaRoledescriptionAttribute", AriaRoledescription, (row) =>
    row.eq(row.attribute, "aria-roledescription"),
  ),
  contained(on(AriaRowcount, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowcount, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRowcountAttribute", AriaRowcount, (row) => row.eq(row.attribute, "aria-rowcount")),
  contained(on(AriaRowindex, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowindex, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRowindexAttribute", AriaRowindex, (row) => row.eq(row.attribute, "aria-rowindex")),
  contained(on(AriaRowspan, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowspan, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaRowspanAttribute", AriaRowspan, (row) => row.eq(row.attribute, "aria-rowspan")),
  contained(on(AriaSelected, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSelected, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaSelectedAttribute", AriaSelected, (row) => row.eq(row.attribute, "aria-selected")),
  contained(on(AriaSetsize, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSetsize, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaSetsizeAttribute", AriaSetsize, (row) => row.eq(row.attribute, "aria-setsize")),
  contained(on(AriaSort, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSort, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaSortAttribute", AriaSort, (row) => row.eq(row.attribute, "aria-sort")),
  contained(on(AriaValuemax, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuemax, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaValuemaxAttribute", AriaValuemax, (row) => row.eq(row.attribute, "aria-valuemax")),
  contained(on(AriaValuemin, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuemin, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaValueminAttribute", AriaValuemin, (row) => row.eq(row.attribute, "aria-valuemin")),
  contained(on(AriaValuenow, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuenow, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaValuenowAttribute", AriaValuenow, (row) => row.eq(row.attribute, "aria-valuenow")),
  contained(on(AriaValuetext, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuetext, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("AriaValuetextAttribute", AriaValuetext, (row) => row.eq(row.attribute, "aria-valuetext")),
  check("AriaRoleH1", AriaRole, (row) =>
    row.or(row.ne(row.kind, "h1"), Compute.in(row.value, ["heading", "tab", "presentation"])),
  ),
  check("AriaRoleNotSource", AriaRole, (row) => row.ne(row.kind, "source")),
] as const;
