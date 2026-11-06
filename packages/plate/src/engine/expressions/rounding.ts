/**
 * The rounding family of the engine: `qti-round`, `qti-truncate`, `qti-round-to` and
 * `qti-equal-rounded`. The family has landed no kind yet, so each entry is the stub marker (ruling
 * R2); its slice (`p7-06`) replaces each marker with the kind's evaluator.
 *
 * It reads the evaluator's types from `#plate/engine/evaluate.ts` as types only, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import type { FamilyTable } from "#plate/engine/evaluate.ts";

/**
 * The rounding family's evaluators by kind: the stub marker for each, which the dispatcher in
 * `#plate/engine/evaluate.ts` never reaches on a checked item, because the reader marks an unlanded
 * kind and its processing never runs.
 */
export const roundingEvaluators: FamilyTable<"equal-rounded" | "round" | "round-to" | "truncate"> =
  {
    "equal-rounded": "unlanded",
    round: "unlanded",
    "round-to": "unlanded",
    truncate: "unlanded",
  };
