/**
 * The test family of the item model: the kind rules of the test-level expressions
 * `qti-number-correct`, `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`,
 * `qti-number-selected`, `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables`. The
 * family has landed no kind yet, so each entry is the unlanded rule; a test's outcome processing
 * reads them, and M3.b-3 replaces each with the kind's rule.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";

/**
 * The test family's kind rules by kind: the unlanded rule for each.
 */
export const testRules: FamilyRules<
  | "number-correct"
  | "number-incorrect"
  | "number-presented"
  | "number-responded"
  | "number-selected"
  | "outcome-maximum"
  | "outcome-minimum"
  | "test-variables"
> = {
  "number-correct": unlandedRule,
  "number-incorrect": unlandedRule,
  "number-presented": unlandedRule,
  "number-responded": unlandedRule,
  "number-selected": unlandedRule,
  "outcome-maximum": unlandedRule,
  "outcome-minimum": unlandedRule,
  "test-variables": unlandedRule,
};
