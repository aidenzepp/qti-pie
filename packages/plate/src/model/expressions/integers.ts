/**
 * The integers family of the item model: the kind rules of `qti-integer-divide`,
 * `qti-integer-modulus`, `qti-integer-to-float`, `qti-gcd` and `qti-lcm`. The family has landed no
 * kind yet, so each entry is the unlanded rule; its slice (`p7-05`) replaces each with the kind's
 * rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The integers family's kind rules by kind: the unlanded rule for each.
 */
export const integersRules: FamilyRules<
  "gcd" | "integer-divide" | "integer-modulus" | "integer-to-float" | "lcm"
> = {
  gcd: unlandedRule,
  "integer-divide": unlandedRule,
  "integer-modulus": unlandedRule,
  "integer-to-float": unlandedRule,
  lcm: unlandedRule,
};
