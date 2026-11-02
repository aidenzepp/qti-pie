/**
 * Which attributes a node kind may carry, and the attributes every element shares.
 *
 * `AttributeAdmission` is seeded from the registries (`seed/attribute-admission.ts`) and read-only
 * to every role. Each family relation stores one attribute of the base families (spec 4.2) as an
 * optional value keyed by its node, and its kind is contained into the admission rows of that one
 * attribute, so a node of a kind that does not carry the attribute cannot hold the row. The
 * statements that read `AttributeAdmission` live here, in the leaf: the O3 containment of the
 * lexical forms and the kind copy of the HTML ids.
 *
 * The 48 ARIA relations (`role` and 47 `aria-*` attributes, `aria-keyshorts` the 48th) are one
 * relation per attribute, `Aria<Name>`, each kind-copied and admitted like the base families. Their
 * value patterns, by relation:
 * AriaActivedescendant: `patterns.ncName`
 * AriaAtomic: `patterns.xsBoolean`
 * AriaAutocomplete: `patterns.ariaAutocomplete`
 * AriaBusy: `patterns.xsBoolean`
 * AriaChecked: `patterns.ariaChecked`
 * AriaColcount: `patterns.xsInteger`
 * AriaColindex: `patterns.xsInteger`
 * AriaColspan: `patterns.xsInteger`
 * AriaControls: `patterns.ncNameList`
 * AriaCurrent: `patterns.ariaCurrent`
 * AriaDescribedby: `patterns.ncNameList`
 * AriaDetails: `patterns.ncName`
 * AriaDisabled: `patterns.xsBoolean`
 * AriaErrormessage: `patterns.ncName`
 * AriaExpanded: `patterns.ariaExpanded`
 * AriaFlowto: `patterns.ncNameList`
 * AriaHaspopup: `patterns.xsBoolean`
 * AriaHidden: `patterns.xsBoolean`
 * AriaInvalid: `patterns.ariaInvalid`
 * AriaKeyshortcuts: `patterns.xsString`
 * AriaKeyshorts: `patterns.xsString`
 * AriaLabel: `patterns.xsNormalizedString`
 * AriaLabelledby: `patterns.ncNameList`
 * AriaLevel: `patterns.positiveInteger`
 * AriaLive: `patterns.ariaLive`
 * AriaModal: `patterns.xsBoolean`
 * AriaMultiline: `patterns.xsBoolean`
 * AriaMultiselectable: `patterns.xsBoolean`
 * AriaOrientation: `patterns.ariaOrientation`
 * AriaOwns: `patterns.ncNameList`
 * AriaPlaceholder: `patterns.xsString`
 * AriaPosinset: `patterns.positiveInteger`
 * AriaPressed: `patterns.ariaPressed`
 * AriaReadonly: `patterns.xsBoolean`
 * AriaRelevant: `patterns.ariaRelevantList`
 * AriaRequired: `patterns.xsBoolean`
 * AriaRole: `patterns.ariaRole`
 * AriaRoledescription: `patterns.xsString`
 * AriaRowcount: `patterns.xsInteger`
 * AriaRowindex: `patterns.xsInteger`
 * AriaRowspan: `patterns.xsInteger`
 * AriaSelected: `patterns.ariaSelected`
 * AriaSetsize: `patterns.xsInteger`
 * AriaSort: `patterns.ariaSort`
 * AriaValuemax: `patterns.xsDecimal`
 * AriaValuemin: `patterns.xsDecimal`
 * AriaValuenow: `patterns.xsDecimal`
 * AriaValuetext: `patterns.xsString` *
 * `aria-haspopup` is `xs:boolean` in the XSD, so it takes `xsBoolean` and no ARIA pattern; the XSD
 * names no ARIA types, each enumeration being anonymous per attribute. The `IDREF` and `IDREFS`
 * attributes also write their token rows to `AttributeIdref`.
 *
 * O1: one-selector form built. A containment from `(kind)` into
 * `select(AttributeAdmission, { attribute: "<name>" })`'s `(kind)` builds, because the selector
 * binds `attribute` and so the projection holds the key.
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
import { IdrefAttribute } from "#qti/schema/content/rosters.ts";
import { DocumentId, HtmlId } from "#qti/schema/document.ts";
import { AttributeLexical, AttributeName, Node, NodeKind, RootKind } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.classList) },
  ["node"],
);

/**
 * The `lang` of a node.
 */
export const NodeLang = relation(
  "NodeLang",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.bcp47) },
  ["node"],
);

/**
 * The `xml:lang` of a node, with the tree and root kind of the node copied for the rules that
 * read it by root.
 */
export const NodeXmlLang = relation(
  "NodeXmlLang",
  {
    kind: closedId(NodeKind),
    node: uuid,
    rootKind: closedId(RootKind),
    tree: uuid,
    value: str.regex(patterns.bcp47),
  },
  ["node"],
);

/**
 * The `label` of a node that is not an item root, whose `label` is `AssessmentItemLabel`'s.
 */
export const NodeLabel = relation(
  "NodeLabel",
  {
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
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.dirEnum) },
  ["node"],
);

/**
 * The `xml:base` of a node.
 */
export const NodeXmlBase = relation(
  "NodeXmlBase",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * The `data-qti-suppress-tts` of a node.
 */
export const NodeSuppressTts = relation(
  "NodeSuppressTts",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.suppressTts) },
  ["node"],
);

/**
 * The `data-catalog-idref` of a node. Its containment into the catalog holder is declared with
 * the catalog holder, not here.
 */
export const NodeCatalogIdref = relation(
  "NodeCatalogIdref",
  {
    document: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.ncName),
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
  { document: uuid, node: uuid, position: pg.bigint, target: str.regex(patterns.ncName) },
  ["node", "position"],
);

/**
 * The `aria-activedescendant` of a node, by `patterns.ncName`.
 */
export const AriaActivedescendant = relation(
  "AriaActivedescendant",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncName) },
  ["node"],
);

/**
 * The `aria-atomic` of a node, by `patterns.xsBoolean`.
 */
export const AriaAtomic = relation(
  "AriaAtomic",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-autocomplete` of a node, by `patterns.ariaAutocomplete`.
 */
export const AriaAutocomplete = relation(
  "AriaAutocomplete",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaAutocomplete) },
  ["node"],
);

/**
 * The `aria-busy` of a node, by `patterns.xsBoolean`.
 */
export const AriaBusy = relation(
  "AriaBusy",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-checked` of a node, by `patterns.ariaChecked`.
 */
export const AriaChecked = relation(
  "AriaChecked",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaChecked) },
  ["node"],
);

/**
 * The `aria-colcount` of a node, by `patterns.xsInteger`.
 */
export const AriaColcount = relation(
  "AriaColcount",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-colindex` of a node, by `patterns.xsInteger`.
 */
export const AriaColindex = relation(
  "AriaColindex",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-colspan` of a node, by `patterns.xsInteger`.
 */
export const AriaColspan = relation(
  "AriaColspan",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-controls` of a node, by `patterns.ncNameList`.
 */
export const AriaControls = relation(
  "AriaControls",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncNameList) },
  ["node"],
);

/**
 * The `aria-current` of a node, by `patterns.ariaCurrent`.
 */
export const AriaCurrent = relation(
  "AriaCurrent",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaCurrent) },
  ["node"],
);

/**
 * The `aria-describedby` of a node, by `patterns.ncNameList`.
 */
export const AriaDescribedby = relation(
  "AriaDescribedby",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncNameList) },
  ["node"],
);

/**
 * The `aria-details` of a node, by `patterns.ncName`.
 */
export const AriaDetails = relation(
  "AriaDetails",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncName) },
  ["node"],
);

/**
 * The `aria-disabled` of a node, by `patterns.xsBoolean`.
 */
export const AriaDisabled = relation(
  "AriaDisabled",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-errormessage` of a node, by `patterns.ncName`.
 */
export const AriaErrormessage = relation(
  "AriaErrormessage",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncName) },
  ["node"],
);

/**
 * The `aria-expanded` of a node, by `patterns.ariaExpanded`.
 */
export const AriaExpanded = relation(
  "AriaExpanded",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaExpanded) },
  ["node"],
);

/**
 * The `aria-flowto` of a node, by `patterns.ncNameList`.
 */
export const AriaFlowto = relation(
  "AriaFlowto",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncNameList) },
  ["node"],
);

/**
 * The `aria-haspopup` of a node, by `patterns.xsBoolean`.
 */
export const AriaHaspopup = relation(
  "AriaHaspopup",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-hidden` of a node, by `patterns.xsBoolean`.
 */
export const AriaHidden = relation(
  "AriaHidden",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-invalid` of a node, by `patterns.ariaInvalid`.
 */
export const AriaInvalid = relation(
  "AriaInvalid",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaInvalid) },
  ["node"],
);

/**
 * The `aria-keyshortcuts` of a node, by `patterns.xsString`.
 */
export const AriaKeyshortcuts = relation(
  "AriaKeyshortcuts",
  {
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
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncNameList) },
  ["node"],
);

/**
 * The `aria-level` of a node, by `patterns.positiveInteger`.
 */
export const AriaLevel = relation(
  "AriaLevel",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * The `aria-live` of a node, by `patterns.ariaLive`.
 */
export const AriaLive = relation(
  "AriaLive",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaLive) },
  ["node"],
);

/**
 * The `aria-modal` of a node, by `patterns.xsBoolean`.
 */
export const AriaModal = relation(
  "AriaModal",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-multiline` of a node, by `patterns.xsBoolean`.
 */
export const AriaMultiline = relation(
  "AriaMultiline",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-multiselectable` of a node, by `patterns.xsBoolean`.
 */
export const AriaMultiselectable = relation(
  "AriaMultiselectable",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-orientation` of a node, by `patterns.ariaOrientation`.
 */
export const AriaOrientation = relation(
  "AriaOrientation",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaOrientation) },
  ["node"],
);

/**
 * The `aria-owns` of a node, by `patterns.ncNameList`.
 */
export const AriaOwns = relation(
  "AriaOwns",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ncNameList) },
  ["node"],
);

/**
 * The `aria-placeholder` of a node, by `patterns.xsString`.
 */
export const AriaPlaceholder = relation(
  "AriaPlaceholder",
  {
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
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * The `aria-pressed` of a node, by `patterns.ariaPressed`.
 */
export const AriaPressed = relation(
  "AriaPressed",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaPressed) },
  ["node"],
);

/**
 * The `aria-readonly` of a node, by `patterns.xsBoolean`.
 */
export const AriaReadonly = relation(
  "AriaReadonly",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `aria-relevant` of a node, by `patterns.ariaRelevantList`.
 */
export const AriaRelevant = relation(
  "AriaRelevant",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaRelevantList) },
  ["node"],
);

/**
 * The `aria-required` of a node, by `patterns.xsBoolean`.
 */
export const AriaRequired = relation(
  "AriaRequired",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * The `role` of a node, by `patterns.ariaRole`.
 */
export const AriaRole = relation(
  "AriaRole",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaRole) },
  ["node"],
);

/**
 * The `aria-roledescription` of a node, by `patterns.xsString`.
 */
export const AriaRoledescription = relation(
  "AriaRoledescription",
  {
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
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-rowindex` of a node, by `patterns.xsInteger`.
 */
export const AriaRowindex = relation(
  "AriaRowindex",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-rowspan` of a node, by `patterns.xsInteger`.
 */
export const AriaRowspan = relation(
  "AriaRowspan",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-selected` of a node, by `patterns.ariaSelected`.
 */
export const AriaSelected = relation(
  "AriaSelected",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaSelected) },
  ["node"],
);

/**
 * The `aria-setsize` of a node, by `patterns.xsInteger`.
 */
export const AriaSetsize = relation(
  "AriaSetsize",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsInteger) },
  ["node"],
);

/**
 * The `aria-sort` of a node, by `patterns.ariaSort`.
 */
export const AriaSort = relation(
  "AriaSort",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.ariaSort) },
  ["node"],
);

/**
 * The `aria-valuemax` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuemax = relation(
  "AriaValuemax",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsDecimal) },
  ["node"],
);

/**
 * The `aria-valuemin` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuemin = relation(
  "AriaValuemin",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsDecimal) },
  ["node"],
);

/**
 * The `aria-valuenow` of a node, by `patterns.xsDecimal`.
 */
export const AriaValuenow = relation(
  "AriaValuenow",
  { kind: closedId(NodeKind), node: uuid, value: str.regex(patterns.xsDecimal) },
  ["node"],
);

/**
 * The `aria-valuetext` of a node, by `patterns.xsString`.
 */
export const AriaValuetext = relation(
  "AriaValuetext",
  {
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
 * Admission of the attribute `name` for a family relation's kind.
 */
const admitted = (name: (typeof AttributeName.handles)[number]) =>
  select(AttributeAdmission, { attribute: name });

/**
 * The statements over this module's relations and the leaf relations it reads. The row checks
 * name handles as literals: a handle term is refused against a `closedId` field of the whole
 * roster (TS2345), while a literal adopts the field's type.
 */
export const rules = [
  contained(on(AttributeLexical, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  contained(on(HtmlId, "kind"), on(admitted("id"), "kind")),
  contained(on(NodeClass, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeClass, "kind"), on(admitted("class"), "kind")),
  contained(on(NodeLang, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeLang, "kind"), on(admitted("lang"), "kind")),
  contained(on(NodeXmlLang, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeXmlLang, "node", "tree", "rootKind"), on(Node, "id", "tree", "rootKind")),
  contained(on(NodeXmlLang, "kind"), on(admitted("xml:lang"), "kind")),
  contained(on(NodeLabel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeLabel, "node", "tree", "rootKind"), on(Node, "id", "tree", "rootKind")),
  contained(on(NodeLabel, "kind"), on(admitted("label"), "kind")),
  check("NodeLabelNotRoot", NodeLabel, (row) => row.ne(row.kind, "qti-assessment-item")),
  contained(on(NodeDir, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeDir, "kind"), on(admitted("dir"), "kind")),
  check("BdoDirNotAuto", NodeDir, (row) =>
    row.or(row.ne(row.kind, "bdo"), row.ne(row.value, "auto")),
  ),
  capacity(on(select(Node, { kind: "bdo" }), "id"), {
    from: on(NodeDir, "node"),
    within: within(1n, 1n),
  }),
  contained(on(NodeXmlBase, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeXmlBase, "kind"), on(admitted("xml:base"), "kind")),
  contained(on(NodeSuppressTts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeSuppressTts, "kind"), on(admitted("data-qti-suppress-tts"), "kind")),
  contained(on(NodeCatalogIdref, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeCatalogIdref, "kind"), on(admitted("data-catalog-idref"), "kind")),
  contained(on(AttributeIdref, "document", "target"), on(DocumentId, "document", "id")),
  contained(on(AttributeIdref, "node", "document"), on(Node, "id", "tree")),
  contained(
    on(HeadersTarget, "document", "target"),
    on(select(HtmlId, { kind: "th" }), "document", "id"),
  ),
  contained(
    on(HeadersTarget, "node", "position", "target"),
    on(select(AttributeIdref, { attribute: "headers" }), "node", "position", "target"),
  ),
  contained(on(AriaActivedescendant, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaActivedescendant, "kind"), on(admitted("aria-activedescendant"), "kind")),
  contained(on(AriaAtomic, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaAtomic, "kind"), on(admitted("aria-atomic"), "kind")),
  contained(on(AriaAutocomplete, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaAutocomplete, "kind"), on(admitted("aria-autocomplete"), "kind")),
  contained(on(AriaBusy, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaBusy, "kind"), on(admitted("aria-busy"), "kind")),
  contained(on(AriaChecked, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaChecked, "kind"), on(admitted("aria-checked"), "kind")),
  contained(on(AriaColcount, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColcount, "kind"), on(admitted("aria-colcount"), "kind")),
  contained(on(AriaColindex, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColindex, "kind"), on(admitted("aria-colindex"), "kind")),
  contained(on(AriaColspan, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaColspan, "kind"), on(admitted("aria-colspan"), "kind")),
  contained(on(AriaControls, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaControls, "kind"), on(admitted("aria-controls"), "kind")),
  contained(on(AriaCurrent, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaCurrent, "kind"), on(admitted("aria-current"), "kind")),
  contained(on(AriaDescribedby, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDescribedby, "kind"), on(admitted("aria-describedby"), "kind")),
  contained(on(AriaDetails, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDetails, "kind"), on(admitted("aria-details"), "kind")),
  contained(on(AriaDisabled, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaDisabled, "kind"), on(admitted("aria-disabled"), "kind")),
  contained(on(AriaErrormessage, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaErrormessage, "kind"), on(admitted("aria-errormessage"), "kind")),
  contained(on(AriaExpanded, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaExpanded, "kind"), on(admitted("aria-expanded"), "kind")),
  contained(on(AriaFlowto, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaFlowto, "kind"), on(admitted("aria-flowto"), "kind")),
  contained(on(AriaHaspopup, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaHaspopup, "kind"), on(admitted("aria-haspopup"), "kind")),
  contained(on(AriaHidden, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaHidden, "kind"), on(admitted("aria-hidden"), "kind")),
  contained(on(AriaInvalid, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaInvalid, "kind"), on(admitted("aria-invalid"), "kind")),
  contained(on(AriaKeyshortcuts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaKeyshortcuts, "kind"), on(admitted("aria-keyshortcuts"), "kind")),
  contained(on(AriaKeyshorts, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaKeyshorts, "kind"), on(admitted("aria-keyshorts"), "kind")),
  contained(on(AriaLabel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLabel, "kind"), on(admitted("aria-label"), "kind")),
  contained(on(AriaLabelledby, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLabelledby, "kind"), on(admitted("aria-labelledby"), "kind")),
  contained(on(AriaLevel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLevel, "kind"), on(admitted("aria-level"), "kind")),
  contained(on(AriaLive, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaLive, "kind"), on(admitted("aria-live"), "kind")),
  contained(on(AriaModal, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaModal, "kind"), on(admitted("aria-modal"), "kind")),
  contained(on(AriaMultiline, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaMultiline, "kind"), on(admitted("aria-multiline"), "kind")),
  contained(on(AriaMultiselectable, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaMultiselectable, "kind"), on(admitted("aria-multiselectable"), "kind")),
  contained(on(AriaOrientation, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaOrientation, "kind"), on(admitted("aria-orientation"), "kind")),
  contained(on(AriaOwns, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaOwns, "kind"), on(admitted("aria-owns"), "kind")),
  contained(on(AriaPlaceholder, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPlaceholder, "kind"), on(admitted("aria-placeholder"), "kind")),
  contained(on(AriaPosinset, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPosinset, "kind"), on(admitted("aria-posinset"), "kind")),
  contained(on(AriaPressed, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaPressed, "kind"), on(admitted("aria-pressed"), "kind")),
  contained(on(AriaReadonly, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaReadonly, "kind"), on(admitted("aria-readonly"), "kind")),
  contained(on(AriaRelevant, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRelevant, "kind"), on(admitted("aria-relevant"), "kind")),
  contained(on(AriaRequired, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRequired, "kind"), on(admitted("aria-required"), "kind")),
  contained(on(AriaRole, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRole, "kind"), on(admitted("role"), "kind")),
  contained(on(AriaRoledescription, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRoledescription, "kind"), on(admitted("aria-roledescription"), "kind")),
  contained(on(AriaRowcount, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowcount, "kind"), on(admitted("aria-rowcount"), "kind")),
  contained(on(AriaRowindex, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowindex, "kind"), on(admitted("aria-rowindex"), "kind")),
  contained(on(AriaRowspan, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaRowspan, "kind"), on(admitted("aria-rowspan"), "kind")),
  contained(on(AriaSelected, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSelected, "kind"), on(admitted("aria-selected"), "kind")),
  contained(on(AriaSetsize, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSetsize, "kind"), on(admitted("aria-setsize"), "kind")),
  contained(on(AriaSort, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaSort, "kind"), on(admitted("aria-sort"), "kind")),
  contained(on(AriaValuemax, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuemax, "kind"), on(admitted("aria-valuemax"), "kind")),
  contained(on(AriaValuemin, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuemin, "kind"), on(admitted("aria-valuemin"), "kind")),
  contained(on(AriaValuenow, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuenow, "kind"), on(admitted("aria-valuenow"), "kind")),
  contained(on(AriaValuetext, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AriaValuetext, "kind"), on(admitted("aria-valuetext"), "kind")),
  check("AriaRoleH1", AriaRole, (row) =>
    row.or(row.ne(row.kind, "h1"), Compute.in(row.value, ["heading", "tab", "presentation"])),
  ),
  check("AriaRoleNotSource", AriaRole, (row) => row.ne(row.kind, "source")),
] as const;
