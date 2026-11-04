/**
 * The rule kinds: the processing fragments and roots, the condition and its branches, the exits,
 * the template processing of an item, the value-setting rules, the template constraint, and the
 * two XInclude kinds.
 *
 * A condition holds exactly one `if`, any number of `else-if` and at most one `else`. The `if`
 * and `else` arms copy the condition they hang under, so the count is a candidate key and a
 * mirror rather than an edge count; an `else-if` is unbounded and stays thin. An arm row is a
 * node; the reverse follows from the `Node` alternatives the composed schema writes, so no
 * per-arm containment into `Node` is declared here.
 *
 * A rule that takes exactly one expression holds it as a `RuleOperand` row, keyed by the rule: the
 * value-setting rules, the template constraint and the `if` and `else-if` branches of the three
 * conditions. The value-setting rules also name their variable through a `VariableRef` row. An
 * XInclude stores its references as read and never resolves them.
 */
import {
  check,
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
import { XIncludeParseValue } from "#pantry/schema/content/rosters.ts";
import * as item from "#pantry/schema/item.ts";
import * as node from "#pantry/schema/node.ts";
import { XIncludeUri } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import * as processing from "#pantry/schema/processing.ts";

const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

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
 * A `qti-set-outcome-value` rule; the outcome it sets is its `VariableRef` row and its value its
 * `RuleOperand` row.
 */
export const SetOutcomeValue = relation("SetOutcomeValue", { id: uuid }, ["id"]);

/**
 * A `qti-lookup-outcome-value` rule; the outcome it sets is its `VariableRef` row and its table
 * input its `RuleOperand` row.
 */
export const LookupOutcomeValue = relation("LookupOutcomeValue", { id: uuid }, ["id"]);

/**
 * A `qti-set-template-value` rule; the template variable it sets is its `VariableRef` row and its
 * value its `RuleOperand` row.
 */
export const SetTemplateValue = relation("SetTemplateValue", { id: uuid }, ["id"]);

/**
 * A `qti-set-default-value` rule; the variable it sets is its `VariableRef` row and its value its
 * `RuleOperand` row.
 */
export const SetDefaultValue = relation("SetDefaultValue", { id: uuid }, ["id"]);

/**
 * A `qti-set-correct-response` rule; the variable it sets is its `VariableRef` row and its value
 * its `RuleOperand` row.
 */
export const SetCorrectResponse = relation("SetCorrectResponse", { id: uuid }, ["id"]);

/**
 * A `qti-template-constraint` rule; its expression is its `RuleOperand` row.
 */
export const TemplateConstraint = relation("TemplateConstraint", { id: uuid }, ["id"]);

/**
 * A `xi:include` element: a reference to other content, stored and never resolved.
 */
export const XInclude = relation("XInclude", { id: uuid }, ["id"]);

/**
 * A `xi:fallback` element. Its character content is `text`, `ws` and `entityRef` children by
 * Admission; its wildcard element children are another module's.
 */
export const Fallback = relation("Fallback", { id: uuid }, ["id"]);

/**
 * The one expression a rule holds: the expression, its position under the rule, and the rule with
 * its kind, which a check names the twelve holder kinds of.
 */
export const RuleOperand = relation(
  "RuleOperand",
  { child: uuid, position: pg.bigint, rule: uuid, ruleKind: closedId(node.NodeKind) },
  ["rule"],
);

/**
 * The `href` of an `xi:include` whose source wrote it.
 */
export const XIncludeHref = relation("XIncludeHref", { node: uuid, value: XIncludeUri }, ["node"]);

/**
 * The `parse` of an `xi:include` whose source wrote it.
 */
export const XIncludeParse = relation(
  "XIncludeParse",
  { node: uuid, value: closedId(XIncludeParseValue) },
  ["node"],
);

/**
 * The `xpointer` of an `xi:include` whose source wrote it, as read.
 */
export const XIncludeXpointer = relation("XIncludeXpointer", { node: uuid, value: xsString }, [
  "node",
]);

/**
 * The `encoding` of an `xi:include` whose source wrote it, as read.
 */
export const XIncludeEncoding = relation("XIncludeEncoding", { node: uuid, value: xsString }, [
  "node",
]);

/**
 * The `accept` of an `xi:include` whose source wrote it, as read.
 */
export const XIncludeAccept = relation("XIncludeAccept", { node: uuid, value: xsString }, ["node"]);

/**
 * The `accept-language` of an `xi:include` whose source wrote it, as read.
 */
export const XIncludeAcceptLanguage = relation(
  "XIncludeAcceptLanguage",
  { node: uuid, value: xsString },
  ["node"],
);

/**
 * The rule kinds' arms, keyed by `NodeKind` handle. The containment of an arm into `Node` is not
 * written here: `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands to it.
 */
export const arms = {
  "qti-exit-response": ExitResponse,
  "qti-exit-template": ExitTemplate,
  "qti-exit-test": ExitTest,
  "qti-lookup-outcome-value": LookupOutcomeValue,
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
  "qti-set-correct-response": SetCorrectResponse,
  "qti-set-default-value": SetDefaultValue,
  "qti-set-outcome-value": SetOutcomeValue,
  "qti-set-template-value": SetTemplateValue,
  "qti-template-condition": TemplateConditionArm,
  "qti-template-constraint": TemplateConstraint,
  "qti-template-else": TemplateElseArm,
  "qti-template-else-if": TemplateElseIfArm,
  "qti-template-if": TemplateIfArm,
  "qti-template-processing": TemplateProcessing,
  "xi:fallback": Fallback,
  "xi:include": XInclude,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  ExitResponse,
  ExitTemplate,
  ExitTest,
  Fallback,
  LookupOutcomeValue,
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
  RuleOperand,
  SetCorrectResponse,
  SetDefaultValue,
  SetOutcomeValue,
  SetTemplateValue,
  TemplateConditionArm,
  TemplateConstraint,
  TemplateElseArm,
  TemplateElseIfArm,
  TemplateIfArm,
  TemplateProcessing,
  XInclude,
  XIncludeAccept,
  XIncludeAcceptLanguage,
  XIncludeEncoding,
  XIncludeHref,
  XIncludeParse,
  XIncludeXpointer,
};

/**
 * The statements over this module's relations: an `if` or `else` arm is a child of its condition
 * and the only one of its kind there (a candidate key on `condition`); every condition has an
 * `if` and every `if` has a condition (a mirror); a template processing is a child of its item,
 * which it is the only one of. A rule holds at most one expression, which is a child of it at its
 * position (`RuleOperand`); each of the twelve kinds that takes exactly one has its row, so the
 * containment names the arm and no handle. A value-setting rule has its `VariableRef` row. An
 * optional XInclude attribute exists only on an `xi:include`.
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
  key(RuleOperand, ["child"]),
  contained(
    on(RuleOperand, "child", "rule", "position"),
    on(node.Edge, "child", "parent", "position"),
  ),
  contained(on(RuleOperand, "rule", "ruleKind"), on(node.Node, "id", "kind")),
  contained(on(RuleOperand, "child"), on(processing.Expression, "id")),
  check("RuleOperandKind", RuleOperand, (o) =>
    o.in(o.ruleKind, [
      "qti-set-outcome-value",
      "qti-lookup-outcome-value",
      "qti-set-template-value",
      "qti-set-default-value",
      "qti-set-correct-response",
      "qti-template-constraint",
      "qti-response-if",
      "qti-response-else-if",
      "qti-outcome-if",
      "qti-outcome-else-if",
      "qti-template-if",
      "qti-template-else-if",
    ]),
  ),
  contained(on(SetOutcomeValue, "id"), on(RuleOperand, "rule")),
  contained(on(LookupOutcomeValue, "id"), on(RuleOperand, "rule")),
  contained(on(SetTemplateValue, "id"), on(RuleOperand, "rule")),
  contained(on(SetDefaultValue, "id"), on(RuleOperand, "rule")),
  contained(on(SetCorrectResponse, "id"), on(RuleOperand, "rule")),
  contained(on(TemplateConstraint, "id"), on(RuleOperand, "rule")),
  contained(on(ResponseIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(ResponseElseIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(OutcomeIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(OutcomeElseIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(TemplateIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(TemplateElseIfArm, "id"), on(RuleOperand, "rule")),
  contained(on(SetOutcomeValue, "id"), on(processing.VariableRef, "id")),
  contained(on(LookupOutcomeValue, "id"), on(processing.VariableRef, "id")),
  contained(on(SetTemplateValue, "id"), on(processing.VariableRef, "id")),
  contained(on(SetDefaultValue, "id"), on(processing.VariableRef, "id")),
  contained(on(SetCorrectResponse, "id"), on(processing.VariableRef, "id")),
  contained(on(XIncludeHref, "node"), on(XInclude, "id")),
  contained(on(XIncludeParse, "node"), on(XInclude, "id")),
  contained(on(XIncludeXpointer, "node"), on(XInclude, "id")),
  contained(on(XIncludeEncoding, "node"), on(XInclude, "id")),
  contained(on(XIncludeAccept, "node"), on(XInclude, "id")),
  contained(on(XIncludeAcceptLanguage, "node"), on(XInclude, "id")),
] as const;
