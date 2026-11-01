/**
 * The assessment item: its root element, its body and its prompt.
 *
 * `identifier` and `title` are not here: they are the `DocumentIdentifier` and `DocumentTitle` rows
 * of the document. The arms' containments into `Node` are not written here either:
 * `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands to them.
 */
import { contained, key, on, relation, str, uuid } from "@bjornpagen/grizzle";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A `qti-assessment-item` root: whether it is adaptive and whether it is time dependent.
 *
 * `time-dependent` is required by the schema, so a written value always exists; `adaptive` is
 * required too, and `DeclaredAdaptive` marks the documents that wrote it.
 */
export const AssessmentItem = relation(
  "AssessmentItem",
  {
    adaptive: str.regex(patterns.xsBoolean),
    id: uuid,
    timeDependent: str.regex(patterns.xsBoolean),
  },
  ["id"],
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
export const relations = { AssessmentItem, DeclaredAdaptive, ItemBody, Prompt };

/**
 * The statements over this module's relations: a declared adaptive marks an item, and a body or a
 * prompt is a child of its parent in an edge; `item` and `parent` are candidate keys, so a parent
 * has at most one of each.
 */
export const rules = [
  contained(on(DeclaredAdaptive, "node"), on(AssessmentItem, "id")),
  key(ItemBody, ["item"]),
  contained(on(ItemBody, "id", "item"), on(node.Edge, "child", "parent")),
  key(Prompt, ["parent"]),
  contained(on(Prompt, "id", "parent"), on(node.Edge, "child", "parent")),
] as const;
