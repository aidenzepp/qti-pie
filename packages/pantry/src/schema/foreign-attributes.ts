/**
 * The `xml:space` of a node and the admission statements of the `xml:id` of a document element:
 * the one model of both names, which the wildcard content and the item's own elements share.
 *
 * `NodeXmlSpace` is a family relation like `NodeXmlBase`: an optional value keyed by its node,
 * contained into `Node` and into the admission rows. `DocumentXmlId` is declared in `document.ts`
 * beside `HtmlId`, because the schemas that compose `document.relations` and `declaration.rules`
 * must find the holder the `DocumentId` alternatives name; the statements that read
 * `AttributeAdmission` are here, as `HtmlId`'s are in `attributes.ts`. The importer writes both
 * relations; the seed writes neither.
 */
import { check, closedId, contained, on, relation, uuid } from "@bjornpagen/grizzle";
import { XmlSpace } from "#pantry/schema/content/rosters.ts";
import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import { DocumentXmlId } from "#pantry/schema/document.ts";
import { AttributeName, Node, NodeKind } from "#pantry/schema/node.ts";

/**
 * The `xml:space` of a node: `default` or `preserve`, with the kind of the node that holds it.
 * `attribute` is always `xml:space`, so `(kind, attribute)` is the pair the `AttributeAdmission`
 * containment reads.
 */
export const NodeXmlSpace = relation(
  "NodeXmlSpace",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(XmlSpace),
  },
  ["node"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = { NodeXmlSpace };

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
  contained(on(NodeXmlSpace, "node", "kind"), on(Node, "id", "kind")),
  contained(on(NodeXmlSpace, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("NodeXmlSpaceAttribute", NodeXmlSpace, (row) => row.eq(row.attribute, "xml:space")),
  contained(on(DocumentXmlId, "kind", "attribute"), on(AttributeAdmission, "kind", "attribute")),
  check("DocumentXmlIdAttribute", DocumentXmlId, (row) => row.eq(row.attribute, "xml:id")),
] as const;
