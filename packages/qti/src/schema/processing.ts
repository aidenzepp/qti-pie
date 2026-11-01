/**
 * Response processing: the `qti-response-processing` node, the item it belongs to, and the
 * standard template a document may name.
 *
 * A processing node is rooted in an item or in a response-processing template. An item-rooted node
 * has a `ResponseProcessingItem` row naming its item, and a template-rooted node is the root of
 * its tree. A `template` or `templateLocation` URI is kept as written and never fetched; a
 * `StandardTemplateReference` exists only where the `template` URI named one of the published
 * templates.
 */
import {
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The response-processing templates 1EdTech publishes.
 */
export const StandardTemplate = closed("StandardTemplate", [
  "match_correct",
  "map_response",
  "map_response_point",
  "CC2_match",
  "CC2_match_basic",
  "CC2_map_response",
]);

/**
 * A `qti-response-processing` node, with the root kind of its tree.
 */
export const ResponseProcessing = relation(
  "ResponseProcessing",
  { id: uuid, rootKind: closedId(node.RootKind) },
  ["id"],
);

/**
 * The item an item-rooted response processing belongs to; an item has at most one.
 */
export const ResponseProcessingItem = relation("ResponseProcessingItem", { id: uuid, item: uuid }, [
  "id",
]);

/**
 * A response processing's `template` attribute, as written and collapsed.
 */
export const ResponseProcessingTemplate = relation(
  "ResponseProcessingTemplate",
  { node: uuid, uri: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * A response processing's `template-location` attribute, as written and collapsed.
 */
export const ResponseProcessingTemplateLocation = relation(
  "ResponseProcessingTemplateLocation",
  { node: uuid, uri: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * The published template a response processing's `template` URI names.
 */
export const StandardTemplateReference = relation(
  "StandardTemplateReference",
  { node: uuid, template: closedId(StandardTemplate) },
  ["node"],
);

/**
 * The response processing kind's arm, keyed by its `NodeKind` handle.
 *
 * `ResponseProcessingItem` is a companion row, not an arm. The containment of the arm into `Node`
 * is not written here: `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands
 * to it.
 */
export const arms = {
  "qti-response-processing": ResponseProcessing,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplate,
  StandardTemplateReference,
};

/**
 * The statements over this module's relations: a processing node is item- or template-rooted; an
 * item-rooted one and its item row name each other, and the row hangs under its item by an edge; a
 * template-rooted one is the root of its tree; the template attributes belong to a processing
 * node, and a standard template reference to a written `template`.
 *
 * The row check names the root kinds as literals: `RootKind.handle("item")` is typed exactly
 * `"item"`, and a comparison against a `closedId` field takes the field's own type, so the handle
 * term is refused there.
 */
export const rules = [
  contained(on(ResponseProcessing, "id", "rootKind"), on(node.Node, "id", "rootKind")),
  check("ProcessingRoot", ResponseProcessing, (r) =>
    r.or(r.eq(r.rootKind, "item"), r.eq(r.rootKind, "rptemplate")),
  ),
  key(ResponseProcessingItem, ["item"]),
  contained(on(ResponseProcessingItem, "id", "item"), on(node.Edge, "child", "parent")),
  contained(on(ResponseProcessingItem, "item"), on(item.AssessmentItem, "id")),
  mirrors(
    on(select(ResponseProcessing, { rootKind: "item" }), "id"),
    on(ResponseProcessingItem, "id"),
  ),
  contained(
    on(select(ResponseProcessing, { rootKind: "rptemplate" }), "id"),
    on(node.TreeRoot, "node"),
  ),
  contained(on(ResponseProcessingTemplate, "node"), on(ResponseProcessing, "id")),
  contained(on(ResponseProcessingTemplateLocation, "node"), on(ResponseProcessing, "id")),
  contained(on(StandardTemplateReference, "node"), on(ResponseProcessingTemplate, "node")),
] as const;
