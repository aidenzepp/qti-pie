/**
 * The rule kinds that carry no attribute: the processing fragments and roots, the condition and
 * its branches, the exits, and the template processing of an item.
 *
 * A condition holds exactly one `if`, any number of `else-if` and at most one `else`. The `if`
 * and `else` arms copy the condition they hang under, so the count is a candidate key and a
 * mirror rather than an edge count; an `else-if` is unbounded and stays thin. An arm row is a
 * node; the reverse follows from the `Node` alternatives the composed schema writes, so no
 * per-arm containment into `Node` is declared here.
 */
import { contained, key, mirrors, on, relation, uuid } from "@bjornpagen/grizzle";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";

/**
 * A `qti-response-processing-fragment` node, the response-processing language without its attach
 * point.
 */
export const ResponseProcessingFragment = relation("ResponseProcessingFragment", { id: uuid }, [
  "id",
]);

/**
 * A `qti-outcome-processing-fragment` node, the outcome-processing language without its attach
 * point.
 */
export const OutcomeProcessingFragment = relation("OutcomeProcessingFragment", { id: uuid }, [
  "id",
]);

/**
 * A `qti-outcome-processing` node: the outcome-processing language without its attach point.
 */
export const OutcomeProcessing = relation("OutcomeProcessing", { id: uuid }, ["id"]);

/**
 * A `qti-response-condition` node; its branches are `ResponseIfArm`, `ResponseElseIfArm` and
 * `ResponseElseArm` rows.
 */
export const ResponseConditionArm = relation("ResponseConditionArm", { id: uuid }, ["id"]);

/**
 * A `qti-outcome-condition` node; its branches are `OutcomeIfArm`, `OutcomeElseIfArm` and
 * `OutcomeElseArm` rows.
 */
export const OutcomeConditionArm = relation("OutcomeConditionArm", { id: uuid }, ["id"]);

/**
 * A `qti-template-condition` node; its branches are `TemplateIfArm`, `TemplateElseIfArm` and
 * `TemplateElseArm` rows.
 */
export const TemplateConditionArm = relation("TemplateConditionArm", { id: uuid }, ["id"]);

/**
 * A `qti-exit-response` rule.
 */
export const ExitResponse = relation("ExitResponse", { id: uuid }, ["id"]);

/**
 * A `qti-exit-test` rule.
 */
export const ExitTest = relation("ExitTest", { id: uuid }, ["id"]);

/**
 * A `qti-exit-template` rule.
 */
export const ExitTemplate = relation("ExitTemplate", { id: uuid }, ["id"]);

/**
 * A `qti-response-else-if` branch; a condition holds any number, so it is thin.
 */
export const ResponseElseIfArm = relation("ResponseElseIfArm", { id: uuid }, ["id"]);

/**
 * A `qti-outcome-else-if` branch; a condition holds any number, so it is thin.
 */
export const OutcomeElseIfArm = relation("OutcomeElseIfArm", { id: uuid }, ["id"]);

/**
 * A `qti-template-else-if` branch; a condition holds any number, so it is thin.
 */
export const TemplateElseIfArm = relation("TemplateElseIfArm", { id: uuid }, ["id"]);

/**
 * The `qti-response-if` branch of a response condition, with the condition it hangs under; a
 * condition holds exactly one.
 */
export const ResponseIfArm = relation("ResponseIfArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-outcome-if` branch of a outcome condition, with the condition it hangs under; a
 * condition holds exactly one.
 */
export const OutcomeIfArm = relation("OutcomeIfArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-template-if` branch of a template condition, with the condition it hangs under; a
 * condition holds exactly one.
 */
export const TemplateIfArm = relation("TemplateIfArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-response-else` branch of a response condition, with the condition it hangs under; a
 * condition holds at most one.
 */
export const ResponseElseArm = relation("ResponseElseArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-outcome-else` branch of a outcome condition, with the condition it hangs under; a
 * condition holds at most one.
 */
export const OutcomeElseArm = relation("OutcomeElseArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-template-else` branch of a template condition, with the condition it hangs under; a
 * condition holds at most one.
 */
export const TemplateElseArm = relation("TemplateElseArm", { condition: uuid, id: uuid }, ["id"]);

/**
 * The `qti-template-processing` node of an item, with the item it belongs to; an item has at most
 * one. The response half is `ResponseProcessingItem` of the processing module.
 */
export const TemplateProcessing = relation("TemplateProcessing", { id: uuid, item: uuid }, ["id"]);

/**
 * The rule kinds' arms, keyed by `NodeKind` handle. The containment of an arm into `Node` is not
 * written here: `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands to it.
 */
export const arms = {
  "qti-exit-response": ExitResponse,
  "qti-exit-template": ExitTemplate,
  "qti-exit-test": ExitTest,
  "qti-outcome-condition": OutcomeConditionArm,
  "qti-outcome-else": OutcomeElseArm,
  "qti-outcome-else-if": OutcomeElseIfArm,
  "qti-outcome-if": OutcomeIfArm,
  "qti-outcome-processing": OutcomeProcessing,
  "qti-outcome-processing-fragment": OutcomeProcessingFragment,
  "qti-response-condition": ResponseConditionArm,
  "qti-response-else": ResponseElseArm,
  "qti-response-else-if": ResponseElseIfArm,
  "qti-response-if": ResponseIfArm,
  "qti-response-processing-fragment": ResponseProcessingFragment,
  "qti-template-condition": TemplateConditionArm,
  "qti-template-else": TemplateElseArm,
  "qti-template-else-if": TemplateElseIfArm,
  "qti-template-if": TemplateIfArm,
  "qti-template-processing": TemplateProcessing,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  ExitResponse,
  ExitTemplate,
  ExitTest,
  OutcomeConditionArm,
  OutcomeElseArm,
  OutcomeElseIfArm,
  OutcomeIfArm,
  OutcomeProcessing,
  OutcomeProcessingFragment,
  ResponseConditionArm,
  ResponseElseArm,
  ResponseElseIfArm,
  ResponseIfArm,
  ResponseProcessingFragment,
  TemplateConditionArm,
  TemplateElseArm,
  TemplateElseIfArm,
  TemplateIfArm,
  TemplateProcessing,
};

/**
 * The statements over this module's relations: an `if` or `else` arm is a child of its condition
 * and the only one of its kind there (a candidate key on `condition`); every condition has an
 * `if` and every `if` has a condition (a mirror); a template processing is a child of its item,
 * which it is the only one of.
 */
export const rules = [
  key(ResponseIfArm, ["condition"]),
  contained(on(ResponseIfArm, "id", "condition"), on(node.Edge, "child", "parent")),
  key(OutcomeIfArm, ["condition"]),
  contained(on(OutcomeIfArm, "id", "condition"), on(node.Edge, "child", "parent")),
  key(TemplateIfArm, ["condition"]),
  contained(on(TemplateIfArm, "id", "condition"), on(node.Edge, "child", "parent")),
  key(ResponseElseArm, ["condition"]),
  contained(on(ResponseElseArm, "id", "condition"), on(node.Edge, "child", "parent")),
  key(OutcomeElseArm, ["condition"]),
  contained(on(OutcomeElseArm, "id", "condition"), on(node.Edge, "child", "parent")),
  key(TemplateElseArm, ["condition"]),
  contained(on(TemplateElseArm, "id", "condition"), on(node.Edge, "child", "parent")),
  mirrors(on(ResponseConditionArm, "id"), on(ResponseIfArm, "condition")),
  mirrors(on(OutcomeConditionArm, "id"), on(OutcomeIfArm, "condition")),
  mirrors(on(TemplateConditionArm, "id"), on(TemplateIfArm, "condition")),
  key(TemplateProcessing, ["item"]),
  contained(on(TemplateProcessing, "id", "item"), on(node.Edge, "child", "parent")),
  contained(on(TemplateProcessing, "item"), on(item.AssessmentItem, "id")),
] as const;
