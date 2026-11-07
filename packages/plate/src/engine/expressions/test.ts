/**
 * The test family of the engine: the test-level expressions `qti-number-correct`,
 * `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`, `qti-number-selected`,
 * `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables`. The family has landed no
 * kind yet, so each entry is the stub marker (ruling R2); a test's outcome processing reads them,
 * and M3.b-3 replaces each marker with the kind's evaluator.
 *
 * It reads the evaluator's types from `#plate/engine/evaluate.ts` as types only, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import type { FamilyTable } from "#plate/engine/evaluate.ts";

/**
 * The test family's evaluators by kind: the stub marker for each, which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item, because the reader marks an unlanded
 * kind and its processing never runs.
 */
export const testEvaluators: FamilyTable<
  | "number-correct"
  | "number-incorrect"
  | "number-presented"
  | "number-responded"
  | "number-selected"
  | "outcome-maximum"
  | "outcome-minimum"
  | "test-variables"
> = {
  "number-correct": "unlanded",
  "number-incorrect": "unlanded",
  "number-presented": "unlanded",
  "number-responded": "unlanded",
  "number-selected": "unlanded",
  "outcome-maximum": "unlanded",
  "outcome-minimum": "unlanded",
  "test-variables": "unlanded",
};
