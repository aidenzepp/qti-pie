/**
 * The document tree's rosters and the relations that keep a document's XML outside its element
 * tree: the prolog and epilog, the XML declaration, the doctype and the export charset.
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
  str,
  uuid,
} from "@bjornpagen/grizzle";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The kinds files `NodeKind` and `AttributeName` compose, in composition order.
 *
 * Each roster spreads these modules' tuples in this order; a kinds file added to one is added to
 * the other and to this list, which the tests read as the composition's source of truth.
 */
export const vocabularies = [generic, asi, html, cp, lom, qmd] as const;

/**
 * The QTI schema versions the model admits.
 */
export const SchemaVersion = closed("SchemaVersion", ["3.0.0", "3.0.1"]);

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
]);

/**
 * A handle of `SchemaVersion`.
 */
export type SchemaVersionHandle = (typeof SchemaVersion.handles)[number];

/**
 * A handle of `RootKind`.
 */
export type RootKindHandle = (typeof RootKind.handles)[number];

/**
 * A handle of `NodeKind`.
 */
export type NodeKindHandle = (typeof NodeKind.handles)[number];

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
  { tree: uuid, value: str.regex(patterns.yesNo) },
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
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  AttributeName,
  MiscKind,
  NodeKind,
  Placement,
  RootKind,
  SchemaVersion,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeKind,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
};

/**
 * The statements over this module's relations: one tree per root node, one root per tree, every
 * fidelity row owned by a tree, and a manifest tree exactly when its root is a manifest.
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
  check("ManifestTreeHasManifestRoot", Tree, (row) =>
    row.or(row.ne(row.kind, "manifest"), row.eq(row.root, "manifest")),
  ),
  check("ManifestRootIsManifestTree", Tree, (row) =>
    row.or(row.ne(row.root, "manifest"), row.eq(row.kind, "manifest")),
  ),
] as const;
