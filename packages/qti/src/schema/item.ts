/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `ToolShape` and `shape` are the roster and discriminator names the spec fixes. */
/**
 * The assessment item: its root element, its body and its prompt.
 *
 * `identifier` and `title` are not here: they are the `DocumentIdentifier` and `DocumentTitle` rows
 * of the document. The arms' containments into `Node` are not written here either:
 * `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands to them.
 */
import {
  alternatives,
  closedId,
  contained,
  key,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { ToolShape } from "#qti/schema/content/rosters.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

const toolString = str.regex(patterns.toolString, patterns.toolStringFlags);

/**
 * A `qti-assessment-item` root: whether it is adaptive and whether it is time dependent, and the
 * tree it roots.
 *
 * `time-dependent` is required by the schema, so a written value always exists; `adaptive` is
 * required too, and `DeclaredAdaptive` marks the documents that wrote it. `tree` is a candidate
 * key: the item-level rows that belong to a tree and not to a node hang from it.
 */
export const AssessmentItem = relation(
  "AssessmentItem",
  {
    adaptive: str.regex(patterns.xsBoolean),
    id: uuid,
    timeDependent: str.regex(patterns.xsBoolean),
    tree: uuid,
  },
  ["id"],
);

/**
 * The `label` of an item root, a replace-class string, at the schema version of its tree. It is
 * not a `NodeLabel` row: the root's label is an item-level value of its own.
 */
export const AssessmentItemLabel = relation(
  "AssessmentItemLabel",
  {
    node: uuid,
    tree: uuid,
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
    version: closedId(node.SchemaVersion),
  },
  ["node"],
);

/**
 * The `tool-name` and `tool-version` an item root declares, by which of the two it wrote: one row
 * per item tree, with the arm that holds the written values.
 */
export const ItemTool = relation("ItemTool", { shape: closedId(ToolShape), tree: uuid }, ["tree"]);

/**
 * An item root that wrote both `tool-name` and `tool-version`.
 */
export const ItemToolBoth = relation(
  "ItemToolBoth",
  { toolName: toolString, toolVersion: toolString, tree: uuid },
  ["tree"],
);

/**
 * An item root that wrote `tool-name` only.
 */
export const ItemToolName = relation("ItemToolName", { toolName: toolString, tree: uuid }, [
  "tree",
]);

/**
 * An item root that wrote `tool-version` only.
 */
export const ItemToolVersion = relation(
  "ItemToolVersion",
  { toolVersion: toolString, tree: uuid },
  ["tree"],
);

/**
 * An item whose `adaptive` attribute was written, as opposed to defaulted.
 */
export const DeclaredAdaptive = relation("DeclaredAdaptive", { node: uuid }, ["node"]);

/**
 * A `qti-item-body` under an item; an item has at most one.
 */
export const ItemBody = relation("ItemBody", { id: uuid, item: uuid }, ["id"]);

/**
 * A `qti-prompt` under an interaction; an interaction has at most one.
 */
export const Prompt = relation("Prompt", { id: uuid, parent: uuid }, ["id"]);

/**
 * The item kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "qti-assessment-item": AssessmentItem,
  "qti-item-body": ItemBody,
  "qti-prompt": Prompt,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  AssessmentItem,
  AssessmentItemLabel,
  DeclaredAdaptive,
  ItemBody,
  ItemTool,
  ItemToolBoth,
  ItemToolName,
  ItemToolVersion,
  Prompt,
  ToolShape,
};

/**
 * The statements over this module's relations: an item roots its tree, a declared adaptive marks
 * an item, and a body or a prompt is a child of its parent in an edge; `item` and `parent` are
 * candidate keys, so a parent has at most one of each. A root label is a node of its own tree and
 * version; a tool belongs to an item's tree, and under 3.0.1 a label requires both tool values.
 */
export const rules = [
  key(AssessmentItem, ["tree"]),
  contained(on(AssessmentItem, "id", "tree"), on(node.Node, "id", "tree")),
  contained(
    on(AssessmentItemLabel, "node", "tree", "version"),
    on(node.Node, "id", "tree", "version"),
  ),
  contained(on(ItemTool, "tree"), on(AssessmentItem, "tree")),
  alternatives(ItemTool, "shape", ToolShape, {
    both: ItemToolBoth,
    nameOnly: ItemToolName,
    versionOnly: ItemToolVersion,
  }),
  contained(
    on(select(AssessmentItemLabel, { version: "3.0.1" }), "tree"),
    on(ItemToolBoth, "tree"),
  ),
  contained(on(DeclaredAdaptive, "node"), on(AssessmentItem, "id")),
  key(ItemBody, ["item"]),
  contained(on(ItemBody, "id", "item"), on(node.Edge, "child", "parent")),
  key(Prompt, ["parent"]),
  contained(on(Prompt, "id", "parent"), on(node.Edge, "child", "parent")),
] as const;
