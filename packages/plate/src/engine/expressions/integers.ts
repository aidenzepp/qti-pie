/**
 * The integers family of the engine: `qti-integer-divide`, `qti-integer-modulus`,
 * `qti-integer-to-float`, `qti-gcd` and `qti-lcm`. The family has landed no kind yet, so each entry
 * is the stub marker (ruling R2); its slice (`p7-05`) replaces each marker with the kind's
 * evaluator.
 *
 * It reads the evaluator's types from `#plate/engine/evaluate.ts` as types only, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import type { FamilyTable } from "#plate/engine/evaluate.ts";

/**
 * The integers family's evaluators by kind: the stub marker for each, which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item, because the reader marks an unlanded
 * kind and its processing never runs.
 */
export const integersEvaluators: FamilyTable<
  "gcd" | "integer-divide" | "integer-modulus" | "integer-to-float" | "lcm"
> = {
  gcd: "unlanded",
  "integer-divide": "unlanded",
  "integer-modulus": "unlanded",
  "integer-to-float": "unlanded",
  lcm: "unlanded",
};
