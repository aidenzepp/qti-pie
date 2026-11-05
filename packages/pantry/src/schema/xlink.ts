/**
 * The ten typed `xlink` attributes of the manifest set (`w3/xlink.xsd`): `type`, `href`, `role`,
 * `arcrole`, `title`, `show`, `actuate`, `label`, `from` and `to`.
 *
 * Each is a family relation like `NodeXmlSpace`: an optional value keyed by its node, contained
 * into `Node` and into the admission rows. The value is the attribute's declared type: a roster
 * for the three enumerations, a contract for the three URIs and the three labels, and for `title`
 * the bare wildcard base (`xs:string`, no domain), as `LomValue.value` is. The importer writes
 * the rows; the seed writes none.
 */
import { check, closedId, contained, on, relation, str, uuid } from "@bjornpagen/grizzle";
import {
  XlinkActuateValue,
  XlinkShowValue,
  XlinkTypeValue,
} from "#pantry/schema/content/rosters.ts";
import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import {
  XlinkArcroleUri,
  XlinkHrefUri,
  XlinkLabelName,
  XlinkRoleUri,
} from "#pantry/schema/contracts.ts";
import { AttributeName, Node, NodeKind } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";

const wildcard = str.regex(patterns.wildcard, patterns.wildcardFlags);

/**
 * The `xlink:actuate` of a node: when the link is followed.
 */
export const XlinkActuate = relation(
  "XlinkActuate",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XlinkActuateValue),
  },
  ["node"],
);

/**
 * The `xlink:arcrole` of a node: the URI that names the arc's role.
 */
export const XlinkArcrole = relation(
  "XlinkArcrole",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: XlinkArcroleUri,
  },
  ["node"],
);

/**
 * The `xlink:from` of a node: the label of the arc's starting resource.
 */
export const XlinkFrom = relation(
  "XlinkFrom",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: XlinkLabelName,
  },
  ["node"],
);

/**
 * The `xlink:href` of a node: the URI of the resource it locates.
 */
export const XlinkHref = relation(
  "XlinkHref",
  { attribute: closedId(AttributeName), kind: closedId(NodeKind), node: uuid, value: XlinkHrefUri },
  ["node"],
);

/**
 * The `xlink:label` of a node: the name that arcs refer to it by.
 */
export const XlinkLabel = relation(
  "XlinkLabel",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: XlinkLabelName,
  },
  ["node"],
);

/**
 * The `xlink:role` of a node: the URI that names its role.
 */
export const XlinkRole = relation(
  "XlinkRole",
  { attribute: closedId(AttributeName), kind: closedId(NodeKind), node: uuid, value: XlinkRoleUri },
  ["node"],
);

/**
 * The `xlink:show` of a node: how the linked resource is presented.
 */
export const XlinkShow = relation(
  "XlinkShow",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XlinkShowValue),
  },
  ["node"],
);

/**
 * The `xlink:title` of a node: a string kept as written.
 */
export const XlinkTitle = relation(
  "XlinkTitle",
  { attribute: closedId(AttributeName), kind: closedId(NodeKind), node: uuid, value: wildcard },
  ["node"],
);

/**
 * The `xlink:to` of a node: the label of the arc's ending resource.
 */
export const XlinkTo = relation(
  "XlinkTo",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: XlinkLabelName,
  },
  ["node"],
);

/**
 * The `xlink:type` of a node: which kind of link element it is.
 */
export const XlinkType = relation(
  "XlinkType",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XlinkTypeValue),
  },
  ["node"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  XlinkActuate,
  XlinkArcrole,
  XlinkFrom,
  XlinkHref,
  XlinkLabel,
  XlinkRole,
  XlinkShow,
  XlinkTitle,
  XlinkTo,
  XlinkType,
};

/**
 * No arms: no relation here is keyed by an arm's node.
 */
export const arms = {};

/**
 * The statements over this module's relations. The row checks name handles as literals: a handle
 * term is refused against a `closedId` field of the whole roster (TS2345), while a literal adopts
 * the field's type.
 */
export const rules = [
  contained(on(XlinkActuate, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkActuate, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkActuateAttribute", XlinkActuate, (row) => row.eq(row.attribute, "xlink:actuate")),
  contained(on(XlinkArcrole, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkArcrole, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkArcroleAttribute", XlinkArcrole, (row) => row.eq(row.attribute, "xlink:arcrole")),
  contained(on(XlinkFrom, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkFrom, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkFromAttribute", XlinkFrom, (row) => row.eq(row.attribute, "xlink:from")),
  contained(on(XlinkHref, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkHref, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkHrefAttribute", XlinkHref, (row) => row.eq(row.attribute, "xlink:href")),
  contained(on(XlinkLabel, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkLabel, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkLabelAttribute", XlinkLabel, (row) => row.eq(row.attribute, "xlink:label")),
  contained(on(XlinkRole, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkRole, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkRoleAttribute", XlinkRole, (row) => row.eq(row.attribute, "xlink:role")),
  contained(on(XlinkShow, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkShow, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkShowAttribute", XlinkShow, (row) => row.eq(row.attribute, "xlink:show")),
  contained(on(XlinkTitle, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkTitle, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkTitleAttribute", XlinkTitle, (row) => row.eq(row.attribute, "xlink:title")),
  contained(on(XlinkTo, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkTo, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkToAttribute", XlinkTo, (row) => row.eq(row.attribute, "xlink:to")),
  contained(on(XlinkType, "node", "kind"), on(Node, "id", "kind")),
  contained(on(XlinkType, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("XlinkTypeAttribute", XlinkType, (row) => row.eq(row.attribute, "xlink:type")),
] as const;
