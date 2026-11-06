/**
 * The claims: the rows the ledger reports as `limited`, each with the member-only source that
 * bounds what a test can prove for it (rule `f000ce54`).
 *
 * A claim outranks the tests: a row a claim names is `limited` even when a passing test carries its
 * tag, so a passing test never makes such a row `covered`.
 *
 * @module
 */

/**
 * A `limited` row and the source that limits it.
 */
export interface Claim {
  /**
   * The Appendix A feature ID the claim names.
   */
  readonly id: string;

  /**
   * The member-only source that bounds the row, in words, with the reading that settles it.
   */
  readonly source: string;
}

/**
 * The claims. One row today: I-19, whose Basic subset only the member-only certification
 * checklists fix (reading I-8.1), so the tests tagged `[I-19]` cannot make it `covered`.
 */
export const claims: readonly Claim[] = [
  {
    id: "I-19",
    source:
      "the Basic subset of the shared vocabulary is fixed by the certification checklists, which are member-only (reading I-8.1)",
  },
];
