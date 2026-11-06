/**
 * The functions family of the engine: `qti-math-operator`, `qti-math-constant`,
 * `qti-stats-operator` and `qti-power`. The family has landed no kind yet, so each entry is the
 * stub marker (ruling R2); its slice (`p7-07`) replaces each marker with the kind's evaluator.
 *
 * It reads the evaluator's types from `#plate/engine/evaluate.ts` as types only, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import type { FamilyTable } from "#plate/engine/evaluate.ts";

/**
 * The functions family's evaluators by kind: the stub marker for each, which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item, because the reader marks an unlanded
 * kind and its processing never runs.
 */
export const functionsEvaluators: FamilyTable<
  "math-constant" | "math-operator" | "power" | "stats-operator"
> = {
  "math-constant": "unlanded",
  "math-operator": "unlanded",
  power: "unlanded",
  "stats-operator": "unlanded",
};
