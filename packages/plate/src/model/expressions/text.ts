/**
 * The text family of the item model: the kind rules of `qti-string-match`, `qti-substring`,
 * `qti-pattern-match`, `qti-inside` and `qti-custom-operator`. The family has landed no kind yet,
 * so each entry is the unlanded rule; its slice (`p7-09`) replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The text family's kind rules by kind: the unlanded rule for each.
 */
export const textRules: FamilyRules<
  "custom-operator" | "inside" | "pattern-match" | "string-match" | "substring"
> = {
  "custom-operator": unlandedRule,
  inside: unlandedRule,
  "pattern-match": unlandedRule,
  "string-match": unlandedRule,
  substring: unlandedRule,
};
