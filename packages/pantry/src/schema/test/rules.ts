/**
 * The test's rule elements: pre-conditions, branch rules, variable mappings, weights and template
 * defaults.
 *
 * Each arm is thin: its node only, until the schema slice of its heading widens it. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `qti-pre-condition` element.
 */
export const PreCondition = relation("PreCondition", { id: uuid }, ["id"]);

/**
 * A `qti-branch-rule` element.
 */
export const BranchRule = relation("BranchRule", { id: uuid }, ["id"]);

/**
 * A `qti-variable-mapping` element.
 */
export const VariableMapping = relation("VariableMapping", { id: uuid }, ["id"]);

/**
 * A `qti-weight` element.
 */
export const Weight = relation("Weight", { id: uuid }, ["id"]);

/**
 * A `qti-template-default` element.
 */
export const TemplateDefault = relation("TemplateDefault", { id: uuid }, ["id"]);

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
  PreCondition,
  TemplateDefault,
  VariableMapping,
  Weight,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
