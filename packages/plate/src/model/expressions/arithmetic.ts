/**
 * The arithmetic family of the item model: the kind rules of `qti-sum`, `qti-product`,
 * `qti-subtract`, `qti-divide`, `qti-min` and `qti-max`. The family has landed no kind yet, so each
 * entry is the unlanded rule; its slice (`p7-04`) replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The arithmetic family's kind rules by kind: the unlanded rule for each.
 */
export const arithmeticRules: FamilyRules<
  "divide" | "max" | "min" | "product" | "subtract" | "sum"
> = {
  divide: unlandedRule,
  max: unlandedRule,
  min: unlandedRule,
  product: unlandedRule,
  subtract: unlandedRule,
  sum: unlandedRule,
};
