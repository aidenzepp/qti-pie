/**
 * The document tree: its rosters, its nodes and the edges between them, the parent and child kinds
 * each schema version admits, what a node keeps beside its kind-specific attributes, the five
 * generic arms, and the relations that keep a document's XML outside its element tree: the prolog
 * and epilog, the XML declaration, the doctype and the export charset.
 *
 * `NodeKind` and `AttributeName` are composed here, once, from the `as const` tuples of the kinds
 * files. `closed` keeps the roster type of a spread of literal tuples exactly, so a handle no kinds
 * file declares is a type error, while a tuple that lost `as const` widens to `string[]` and is
 * refused at `closed(...)`: no kinds file can widen either roster silently.
 */
import {
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { YesNo } from "#qti/schema/content/rosters.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as csmd from "#qti/schema/kinds/csmd.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import type { SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import * as xi from "#qti/schema/kinds/xi.ts";
import { NamespacePrefix, NamespaceUri, PiTarget, XmlEntityName } from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { ancestryHandles } from "#qti/schema/seed/ancestry.ts";

/**
 * The kinds files `NodeKind` and `AttributeName` compose, in composition order.
 *
 * Each roster spreads these modules' tuples in this order; a kinds file added to one is added to
 * the other and to this list, which the tests read as the composition's source of truth.
 */
export const vocabularies = [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi] as const;

/**
 * The kinds tuples `NodeKind` spreads, in the order of `vocabularies`; the tests read the
 * composed roster against their concatenation.
 */
export const kindTuples = [
  generic.kinds,
  asi.kinds,
  html.kinds,
  cp.kinds,
  lom.kinds,
  qmd.kinds,
  cpx.kinds,
  drd.kinds,
  csmd.kinds,
  ud.kinds,
  xi.kinds,
] as const;

/**
 * The attributes tuples `AttributeName` spreads, in the order of `vocabularies`.
 */
export const attributeTuples = [
  generic.attributes,
  asi.attributes,
  html.attributes,
  cp.attributes,
  lom.attributes,
  qmd.attributes,
  cpx.attributes,
  drd.attributes,
  csmd.attributes,
  ud.attributes,
  xi.attributes,
] as const;

const schemaVersions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * The QTI schema versions the model admits.
 */
export const SchemaVersion = closed("SchemaVersion", schemaVersions);

/**
 * The root element kinds a document tree may have.
 */
export const RootKind = closed("RootKind", [
  "item",
  "test",
  "section",
  "stimulus",
  "rptemplate",
  "outcomes",
  "usagedata",
  "manifest",
  "externalLom",
]);

/**
 * What a tree is: a QTI document, or a package's manifest.
 */
export const TreeKind = closed("TreeKind", ["document", "manifest"]);

/**
 * Where a miscellaneous node outside the root element sits: before it or after it.
 */
export const Placement = closed("Placement", ["prolog", "epilog"]);

/**
 * The miscellaneous nodes the XML grammar admits outside the root element.
 */
export const MiscKind = closed("MiscKind", ["comment", "pi"]);

/**
 * Every node kind, composed from the kinds tuples in the order of `vocabularies`.
 */
export const NodeKind = closed("NodeKind", [
  ...generic.kinds,
  ...asi.kinds,
  ...html.kinds,
  ...cp.kinds,
  ...lom.kinds,
  ...qmd.kinds,
  ...cpx.kinds,
  ...drd.kinds,
  ...csmd.kinds,
  ...ud.kinds,
  ...xi.kinds,
]);

/**
 * Every element-specific attribute local name the registries store, composed from the attributes
 * tuples in the order of `vocabularies`.
 *
 * A name two vocabularies share is listed only by the first that introduces it, so the roster
 * holds each name once.
 */
export const AttributeName = closed("AttributeName", [
  ...generic.attributes,
  ...asi.attributes,
  ...html.attributes,
  ...cp.attributes,
  ...lom.attributes,
  ...qmd.attributes,
  ...cpx.attributes,
  ...drd.attributes,
  ...csmd.attributes,
  ...ud.attributes,
  ...xi.attributes,
]);

/**
 * Every ancestry a node can sit in: the set of flags (`fb`, `int`, `choice` and the rest of
 * `FLAGS`) its ancestors enter, named by those flags joined with `.`, `root` for none.
 *
 * The handles are the closure `seed/ancestry.ts` computes over the kinds files' `Admission` rows;
 * a flag set outside them is a node the model cannot hold.
 */
export const Ancestry = closed("Ancestry", ancestryHandles);

export type { SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

/**
 * A handle of `RootKind`.
 */
export type RootKindHandle = (typeof RootKind.handles)[number];

/**
 * A handle of `NodeKind`.
 */
export type NodeKindHandle = (typeof NodeKind.handles)[number];

/**
 * A handle of `Ancestry`.
 */
export type AncestryHandle = (typeof Ancestry.handles)[number];

/**
 * A handle of `AttributeName`.
 */
export type AttributeNameHandle = (typeof AttributeName.handles)[number];

/**
 * An XML encoding name, as the XML declaration and the charset labels spell it.
 */
const encName = str.regex(patterns.encName);

/**
 * Any text, empty included, newlines included.
 */
const wildcard = str.regex(patterns.wildcard, patterns.wildcardFlags);

/**
 * One parsed XML file: a QTI document or a manifest, its root kind and its schema version, and the
 * charset its bytes were decoded from.
 */
export const Tree = relation(
  "Tree",
  {
    charset: encName,
    id: uuid,
    kind: closedId(TreeKind),
    root: closedId(RootKind),
    version: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * The root element node of a tree; every tree has exactly one, and a node roots at most one tree.
 */
export const TreeRoot = relation("TreeRoot", { node: uuid, tree: uuid }, ["tree"]);

/**
 * A comment or processing instruction before or after a tree's root element, at its position
 * within its placement.
 */
export const TreeMisc = relation(
  "TreeMisc",
  {
    kind: closedId(MiscKind),
    placement: closedId(Placement),
    position: pg.bigint,
    text: wildcard,
    tree: uuid,
  },
  ["tree", "placement", "position"],
);

/**
 * The `version` of a tree's XML declaration, when it has one.
 */
export const TreeXmlVersion = relation(
  "TreeXmlVersion",
  { tree: uuid, value: str.regex(patterns.xmlVersion) },
  ["tree"],
);

/**
 * The `encoding` of a tree's XML declaration, when it names one.
 */
export const TreeXmlEncoding = relation("TreeXmlEncoding", { tree: uuid, value: encName }, [
  "tree",
]);

/**
 * The `standalone` of a tree's XML declaration, when it names one.
 */
export const TreeXmlStandalone = relation(
  "TreeXmlStandalone",
  { tree: uuid, value: closedId(YesNo) },
  ["tree"],
);

/**
 * A tree's document type declaration, verbatim, when it has one.
 */
export const TreeDoctype = relation("TreeDoctype", { text: wildcard, tree: uuid }, ["tree"]);

/**
 * The charset label a tree is exported in, when it differs from the one it was read in.
 */
export const TreeExportCharset = relation("TreeExportCharset", { label: encName, tree: uuid }, [
  "tree",
]);

/**
 * One node of a tree, of one kind, carrying its tree's schema version and root kind so the edges
 * and the kind-specific relations can be judged against them, and the ancestry it sits in: the
 * flags its ancestors enter, `root` for a tree's root element.
 */
export const Node = relation(
  "Node",
  {
    ancestry: closedId(Ancestry),
    id: uuid,
    kind: closedId(NodeKind),
    prefix: str.regex(patterns.ncNameOrEmpty),
    rootKind: closedId(RootKind),
    tree: uuid,
    version: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * A parent kind and a child kind one schema version admits under it. Seeded by a custom migration
 * and read-only to every role.
 */
export const Admission = relation(
  "Admission",
  {
    child: closedId(NodeKind),
    parent: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["version", "parent", "child"],
);

/**
 * A child node at its position under its parent, both of one tree, with both kinds and both
 * ancestries copied so the pair can be judged against `Admission` and `AncestryStep`. A node has
 * at most one parent.
 */
export const Edge = relation(
  "Edge",
  {
    child: uuid,
    childAncestry: closedId(Ancestry),
    childKind: closedId(NodeKind),
    parent: uuid,
    parentAncestry: closedId(Ancestry),
    parentKind: closedId(NodeKind),
    position: pg.bigint,
    tree: uuid,
    version: closedId(SchemaVersion),
  },
  ["parent", "position"],
);

/**
 * A namespace declaration on an element, at its position among the element's declarations; an
 * empty prefix declares the default namespace.
 */
export const NamespaceDeclaration = relation(
  "NamespaceDeclaration",
  {
    node: uuid,
    position: pg.bigint,
    prefix: str.regex(patterns.ncNameOrEmpty),
    uri: NamespaceUri,
  },
  ["node", "position"],
);

/**
 * An element's `xsi:schemaLocation`, verbatim, and the prefix it was written under.
 */
export const SchemaLocation = relation(
  "SchemaLocation",
  {
    node: uuid,
    prefix: NamespacePrefix,
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  },
  ["node"],
);

/**
 * An entity reference inside an attribute value, by the attribute's qualified name and the offset
 * at which the reference stood.
 */
export const AttributeEntityReference = relation(
  "AttributeEntityReference",
  {
    attribute: str.regex(patterns.qName),
    name: XmlEntityName,
    node: uuid,
    offset: pg.bigint,
  },
  ["node", "attribute", "offset"],
);

/**
 * The lexical form of a collapse- or replace-type attribute whose written value differs from its
 * collapsed one, kept for the round trip.
 */
export const AttributeLexical = relation(
  "AttributeLexical",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.uncollapsed, patterns.uncollapsedFlags),
  },
  ["node", "attribute"],
);

/**
 * The spelling of an integer attribute whose collapsed text parses to its typed value but is not
 * that value's canonical rendering (`+5`, `05`, `-0`), kept for the round trip. A row exists only
 * when the spelling differs from the canonical rendering, which the pattern states: a canonical
 * spelling cannot be stored. That the spelling parses to the typed value it sits beside is a guard,
 * not a statement.
 */
export const AttributeSpelling = relation(
  "AttributeSpelling",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.nonCanonicalInteger),
  },
  ["node", "attribute"],
);

/**
 * A text node holding at least one character that is not whitespace. The relation is named
 * `TextNode` because a table named after the builtin type `text` would shadow that type in
 * grizzle's drift replay (campaign decision 28).
 */
export const TextNode = relation(
  "TextNode",
  { id: uuid, value: str.regex(patterns.nonWhitespaceText, patterns.nonWhitespaceTextFlags) },
  ["id"],
);

/**
 * A text node made only of whitespace.
 */
export const Ws = relation("Ws", { id: uuid, value: str.regex(patterns.whitespaceOnly) }, ["id"]);

/**
 * A comment node inside the root element.
 */
export const Comment = relation("Comment", { id: uuid, text: wildcard }, ["id"]);

/**
 * A processing instruction inside the root element.
 */
export const Pi = relation("Pi", { data: wildcard, id: uuid, target: PiTarget }, ["id"]);

/**
 * A general entity reference the reader kept unexpanded.
 */
export const EntityReference = relation("EntityReference", { id: uuid, name: XmlEntityName }, [
  "id",
]);

/**
 * The generic kinds' arms, keyed by their `NodeKind` handles.
 *
 * Their containments into `Node` are not written here: one `mirrors` per handle in the composed
 * schema (`#qti/schema/qti.ts`) binds them.
 */
export const arms = {
  comment: Comment,
  entityRef: EntityReference,
  pi: Pi,
  text: TextNode,
  ws: Ws,
};

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  Admission,
  Ancestry,
  AttributeEntityReference,
  AttributeLexical,
  AttributeName,
  AttributeSpelling,
  Comment,
  Edge,
  EntityReference,
  MiscKind,
  NamespaceDeclaration,
  Node,
  NodeKind,
  Pi,
  Placement,
  RootKind,
  SchemaLocation,
  SchemaVersion,
  TextNode,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeKind,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  Ws,
};

/**
 * The statements over this module's relations: one tree per root node, one root per tree, every
 * fidelity row owned by a tree, and a manifest tree exactly when its root is a manifest; every node
 * of a tree carrying the tree's version and root kind, one parent per node, both ends of an edge in
 * the edge's tree with the kinds and ancestries it names, every edge's kind pair admitted by its
 * version, a tree rooted at a node of ancestry `root`, and every attribute side row owned by a
 * node. The statements that read `AncestryStep` live in `ancestry.ts`.
 *
 * The row checks name the `manifest` handle as a literal: `TreeKind.handle("manifest")` is a term
 * typed exactly `"manifest"`, and a comparison's operand must carry the whole roster's type of the
 * `closedId` field it meets, so the handle term is refused there (TS2345) while the literal adopts
 * the field's type.
 */
export const rules = [
  key(TreeRoot, ["node"]),
  mirrors(on(TreeRoot, "tree"), on(Tree, "id")),
  contained(on(TreeMisc, "tree"), on(Tree, "id")),
  contained(on(TreeXmlVersion, "tree"), on(Tree, "id")),
  contained(on(TreeXmlEncoding, "tree"), on(Tree, "id")),
  contained(on(TreeXmlStandalone, "tree"), on(Tree, "id")),
  contained(on(TreeDoctype, "tree"), on(Tree, "id")),
  contained(on(TreeExportCharset, "tree"), on(Tree, "id")),
  contained(on(TreeRoot, "node", "tree"), on(select(Node, { ancestry: "root" }), "id", "tree")),
  contained(on(Node, "tree", "version", "rootKind"), on(Tree, "id", "version", "root")),
  key(Edge, ["child"]),
  contained(
    on(Edge, "parent", "tree", "version", "parentKind"),
    on(Node, "id", "tree", "version", "kind"),
  ),
  contained(
    on(Edge, "child", "tree", "version", "childKind"),
    on(Node, "id", "tree", "version", "kind"),
  ),
  contained(on(Edge, "parent", "parentAncestry"), on(Node, "id", "ancestry")),
  contained(on(Edge, "child", "childAncestry"), on(Node, "id", "ancestry")),
  contained(
    on(Edge, "version", "parentKind", "childKind"),
    on(Admission, "version", "parent", "child"),
  ),
  contained(on(NamespaceDeclaration, "node"), on(Node, "id")),
  contained(on(SchemaLocation, "node"), on(Node, "id")),
  contained(on(AttributeEntityReference, "node"), on(Node, "id")),
  contained(on(AttributeLexical, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AttributeSpelling, "node", "kind"), on(Node, "id", "kind")),
  check("ManifestTreeHasManifestRoot", Tree, (row) =>
    row.or(row.ne(row.kind, "manifest"), row.eq(row.root, "manifest")),
  ),
  check("ManifestRootIsManifestTree", Tree, (row) =>
    row.or(row.ne(row.root, "manifest"), row.eq(row.kind, "manifest")),
  ),
] as const;
