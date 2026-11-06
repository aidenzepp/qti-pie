/**
 * The rounding family of the item model: the kind rules of `qti-round`, `qti-truncate`,
 * `qti-round-to` and `qti-equal-rounded`. The family has landed no kind yet, so each entry is the
 * unlanded rule; its slice (`p7-06`) replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The rounding family's kind rules by kind: the unlanded rule for each.
 */
export const roundingRules: FamilyRules<"equal-rounded" | "round" | "round-to" | "truncate"> = {
  "equal-rounded": unlandedRule,
  round: unlandedRule,
  "round-to": unlandedRule,
  truncate: unlandedRule,
};
