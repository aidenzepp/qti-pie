/**
 * The test family of the item model: the kind rules and reader specs of the test-level expressions
 * `qti-number-correct`, `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`,
 * `qti-number-selected`, `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables`. The
 * family has landed no kind yet, so each kind has the unlanded rule and the stub reader spec; a
 * test's outcome processing reads them, and M3.b-3 replaces each with the kind's rule and reader
 * spec.
 *
 * It value-imports only `#plate/model/expression.ts`, and names the registry's reader types with
 * `import type` only, so the registry in `#plate/model/expressions/read.ts` may import it without a
 * cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";
import type { FamilyReaders, UnlandedReader } from "#plate/model/expressions/read.ts";

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

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The test family's reader specs by kind: the stub for each.
 */
export const testReaders: FamilyReaders<
  | "number-correct"
  | "number-incorrect"
  | "number-presented"
  | "number-responded"
  | "number-selected"
  | "outcome-maximum"
  | "outcome-minimum"
  | "test-variables"
> = {
  "number-correct": unlanded,
  "number-incorrect": unlanded,
  "number-presented": unlanded,
  "number-responded": unlanded,
  "number-selected": unlanded,
  "outcome-maximum": unlanded,
  "outcome-minimum": unlanded,
  "test-variables": unlanded,
};
