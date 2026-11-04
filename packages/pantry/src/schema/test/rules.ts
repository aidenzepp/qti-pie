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
import { closedId, key, relation, str, uuid } from "@bjornpagen/grizzle";
import { BranchExit, BranchTarget, StructureHolder } from "#pantry/schema/content/rosters.ts";
import {
  MappedVariableName,
  TestStructureIdentifier,
  WeightReference,
  WeightValue,
} from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

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
 * The statements this module declares: the candidate key a later containment targets. A mapping's
 * `target` names one variable of its item reference (row 44), so `(itemRef, target)` is unique,
 * and `PrefixedMapped` contains into it.
 */
export const rules = [key(VariableMapping, ["itemRef", "target"])] as const;
