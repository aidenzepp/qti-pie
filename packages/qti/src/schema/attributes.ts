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
 * O1: one-selector form built. A containment from `(kind)` into
 * `select(AttributeAdmission, { attribute: "<name>" })`'s `(kind)` builds, because the selector
 * binds `attribute` and so the projection holds the key.
 */
import {
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
 * The relations of this module, as schema members.
 */
export const relations = {
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
] as const;
