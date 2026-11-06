/**
 * The test's rule elements: pre-conditions, branch rules, variable mappings, weights and template
 * defaults.
 *
 * `PreCondition` stays thin: its one expression is phase 3's tree under the node. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them, and the statements over these rows, other than the one
 * candidate key a later containment targets, arrive with the laws heading.
 *
 * A required attribute is a column of its arm. `source` and `templateIdentifier` are bare plain
 * names, because the declaration they name is another module's: they join phase 13's blocked
 * component through `Declaration.(document, identifier)`.
 */
import {
  alternatives,
  check,
  closedId,
  contained,
  key,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { BranchExit, BranchTarget, StructureHolder } from "#pantry/schema/content/rosters.ts";
import {
  MappedVariableName,
  TestStructureIdentifier,
  WeightReference,
  WeightValue,
} from "#pantry/schema/contracts.ts";
import { Declaration } from "#pantry/schema/declaration.ts";
import { Edge } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { ItemRefDocument } from "#pantry/schema/reference.ts";
import { RuleOperand } from "#pantry/schema/rule.ts";
import {
  AssessmentSection,
  ItemRef,
  TestIdentifier,
  TestPart,
} from "#pantry/schema/test/structure.ts";

const ncName = str.regex(patterns.ncName);

/**
 * A `qti-pre-condition` element, thin: its expression is the tree under the node.
 */
export const PreCondition = relation("PreCondition", { id: uuid }, ["id"]);

/**
 * A `qti-branch-rule` element, held by the part, section or item reference `owner` of
 * `ownerKind`, in `document`. `targetKind` says whether its `target` is one of the exit
 * keywords or a structure identifier, which `BranchRuleExit` or `BranchRuleTarget` holds.
 */
export const BranchRule = relation(
  "BranchRule",
  {
    document: uuid,
    id: uuid,
    owner: uuid,
    ownerKind: closedId(StructureHolder),
    targetKind: closedId(BranchTarget),
  },
  ["id"],
);

/**
 * The exit keyword a branch rule targets, one row where `targetKind` is `exit`.
 */
export const BranchRuleExit = relation(
  "BranchRuleExit",
  { exit: closedId(BranchExit), rule: uuid },
  ["rule"],
);

/**
 * The structure identifier a branch rule targets, one row where `targetKind` is `ref`: the
 * identifier, the `scope` document that declares it, and the kinds of its holder and of the rule's
 * owner.
 */
export const BranchRuleTarget = relation(
  "BranchRuleTarget",
  {
    holderKind: closedId(StructureHolder),
    identifier: TestStructureIdentifier,
    ownerKind: closedId(StructureHolder),
    rule: uuid,
    scope: uuid,
  },
  ["rule"],
);

/**
 * A `qti-variable-mapping` element of the item reference `itemRef`, in `itemDocument`. `source`
 * names an outcome of the item and `target` the name it takes in the test, which is unique
 * within the item reference.
 */
export const VariableMapping = relation(
  "VariableMapping",
  {
    id: uuid,
    itemDocument: uuid,
    itemRef: uuid,
    source: ncName,
    target: MappedVariableName,
  },
  ["id"],
);

/**
 * A `qti-weight` element of the item reference `itemRef`: the `identifier` it names and its
 * `value` as written.
 */
export const Weight = relation(
  "Weight",
  { id: uuid, identifier: WeightReference, itemRef: uuid, value: WeightValue },
  ["id"],
);

/**
 * A `qti-template-default` element of the item reference `itemRef`, in `itemDocument`, naming the
 * template variable it sets.
 */
export const TemplateDefault = relation(
  "TemplateDefault",
  { id: uuid, itemDocument: uuid, itemRef: uuid, templateIdentifier: ncName },
  ["id"],
);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-branch-rule": BranchRule,
  "qti-pre-condition": PreCondition,
  "qti-template-default": TemplateDefault,
  "qti-variable-mapping": VariableMapping,
  "qti-weight": Weight,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
  BranchRule,
  BranchRuleExit,
  BranchRuleTarget,
  PreCondition,
  TemplateDefault,
  VariableMapping,
  Weight,
} as const;

/**
 * The holder kinds that hold a branch rule, each with the arm its `owner` is contained into. A
 * section reference holds no rule.
 */
const owners = [
  ["part", TestPart],
  ["section", AssessmentSection],
  ["itemRef", ItemRef],
] as const;

/**
 * The statements this module declares: the candidate key a later containment targets, and the laws
 * of 4.8 and 4.9.
 *
 * A mapping's `target` names one variable of its item reference (row 44), so `(itemRef, target)`
 * is unique, and `PrefixedMapped` contains into it.
 *
 * A branch rule's `owner` is its parent node, `(id, owner)` into `Edge.(child, parent)` with
 * neither side selected, and one containment per owner kind, from the `ownerKind` selection into
 * that kind's arm. Its target is an exit keyword or a structure identifier, and both handles are
 * armed. A target identifier is contained into the identifiers of the rule's own document (S-R35)
 * with the holder kind it names, and the rule's owner kind it carries is the rule's own; a
 * misspelled exit is an NCName target that no `TestIdentifier` holds, so the containment refuses it
 * (`branch-target`). A part's rule targets a part and no other rule does (S-R32, S-R33).
 *
 * `PreCondition`, `BranchRule` and `TemplateDefault` each hold exactly one expression, a
 * `RuleOperand` row keyed by the rule. A mapping, a weight and a template default are edges of
 * their item reference; the mapping's source is an outcome and the template default's name a
 * template variable of the item the reference resolves to (rows 25 and 26).
 */
export const rules = [
  key(VariableMapping, ["itemRef", "target"]),
  contained(on(BranchRule, "id", "owner"), on(Edge, "child", "parent")),
  ...owners.map(([ownerKind, arm]) =>
    contained(on(select(BranchRule, { ownerKind }), "owner"), on(arm, "id")),
  ),
  alternatives(BranchRule, "targetKind", BranchTarget, {
    exit: BranchRuleExit,
    ref: BranchRuleTarget,
  }),
  contained(
    on(BranchRuleTarget, "scope", "identifier", "holderKind"),
    on(TestIdentifier, "scope", "identifier", "holderKind"),
  ),
  contained(on(BranchRuleTarget, "rule", "scope"), on(BranchRule, "id", "document")),
  contained(on(BranchRuleTarget, "rule", "ownerKind"), on(BranchRule, "id", "ownerKind")),
  check("BranchTargetKind", BranchRuleTarget, (t) =>
    t.or(
      t.and(t.eq(t.ownerKind, "part"), t.eq(t.holderKind, "part")),
      t.and(t.ne(t.ownerKind, "part"), t.ne(t.holderKind, "part")),
    ),
  ),
  contained(on(PreCondition, "id"), on(RuleOperand, "rule")),
  contained(on(BranchRule, "id"), on(RuleOperand, "rule")),
  contained(on(TemplateDefault, "id"), on(RuleOperand, "rule")),
  contained(on(VariableMapping, "id", "itemRef"), on(Edge, "child", "parent")),
  contained(
    on(VariableMapping, "itemRef", "itemDocument"),
    on(ItemRefDocument, "itemRef", "document"),
  ),
  contained(
    on(VariableMapping, "itemDocument", "source"),
    on(select(Declaration, { kind: "outcome" }), "document", "identifier"),
  ),
  contained(on(Weight, "id", "itemRef"), on(Edge, "child", "parent")),
  contained(on(TemplateDefault, "id", "itemRef"), on(Edge, "child", "parent")),
  contained(
    on(TemplateDefault, "itemRef", "itemDocument"),
    on(ItemRefDocument, "itemRef", "document"),
  ),
  contained(
    on(TemplateDefault, "itemDocument", "templateIdentifier"),
    on(select(Declaration, { kind: "template" }), "document", "identifier"),
  ),
] as const;
