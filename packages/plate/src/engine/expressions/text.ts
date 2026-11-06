/**
 * The text family of the engine: `qti-string-match`, `qti-substring`, `qti-pattern-match`,
 * `qti-inside` and `qti-custom-operator`. The family has landed no kind yet, so each entry is the
 * stub marker (ruling R2); its slice (`p7-09`) replaces each marker with the kind's evaluator.
 *
 * It reads the evaluator's types from `#plate/engine/evaluate.ts` as types only, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import type { FamilyTable } from "#plate/engine/evaluate.ts";

/**
 * The text family's evaluators by kind: the stub marker for each, which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item, because the reader marks an unlanded
 * kind and its processing never runs.
 */
export const textEvaluators: FamilyTable<
  "custom-operator" | "inside" | "pattern-match" | "string-match" | "substring"
> = {
  "custom-operator": "unlanded",
  inside: "unlanded",
  "pattern-match": "unlanded",
  "string-match": "unlanded",
  substring: "unlanded",
};
