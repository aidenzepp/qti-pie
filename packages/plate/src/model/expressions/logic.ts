/**
 * The logic family of the item model: the kind rules of `qti-and`, `qti-or`, `qti-not` and
 * `qti-any-n`. The family has landed no kind yet, so each entry is the unlanded rule; its slice
 * (`p7-02`) replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The logic family's kind rules by kind: the unlanded rule for each.
 */
export const logicRules: FamilyRules<"and" | "any-n" | "not" | "or"> = {
  and: unlandedRule,
  "any-n": unlandedRule,
  not: unlandedRule,
  or: unlandedRule,
};
