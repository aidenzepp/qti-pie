/**
 * The functions family of the item model: the kind rules of `qti-math-operator`,
 * `qti-math-constant`, `qti-stats-operator` and `qti-power`. The family has landed no kind yet, so
 * each entry is the unlanded rule; its slice (`p7-07`) replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The functions family's kind rules by kind: the unlanded rule for each.
 */
export const functionsRules: FamilyRules<
  "math-constant" | "math-operator" | "power" | "stats-operator"
> = {
  "math-constant": unlandedRule,
  "math-operator": unlandedRule,
  power: unlandedRule,
  "stats-operator": unlandedRule,
};
