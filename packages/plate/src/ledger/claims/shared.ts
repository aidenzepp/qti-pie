/**
 * The claims no fan-out area owns: those plate made before the fan-out, each bounded by a
 * member-only source.
 *
 * @module
 */
import type { Claim } from "#plate/ledger/claims.ts";

/**
 * I-19, whose Basic subset only the member-only certification checklists fix (reading I-8.1), so
 * the tests tagged `[I-19]` cannot make it `covered`.
 */
export const sharedClaims: readonly Claim[] = [
  {
    id: "I-19",
    source:
      "the Basic subset of the shared vocabulary is fixed by the certification checklists, which are member-only (reading I-8.1)",
  },
];
