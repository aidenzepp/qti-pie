/**
 * The claims: the rows the ledger reports as `limited`, each with the member-only source that
 * bounds what a test can prove for it (rule `f000ce54`).
 *
 * A claim outranks the tests: a row a claim names is `limited` even when a passing test carries its
 * tag, so a passing test never makes such a row `covered`. A claim may also bound a row by a stage
 * of this plan that has not landed, naming the stage that removes it (OD-P7-15).
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
   * The source that bounds the row, in words: a member-only source with the reading that settles
   * it, or a stage of this plan that has not landed with the unit that removes the claim.
   */
  readonly source: string;
}

/**
 * The claims. I-19, whose Basic subset only the member-only certification checklists fix (reading
 * I-8.1), so the tests tagged `[I-19]` cannot make it `covered`; and I-9a, whose full response
 * processing lands in four stages, so the tests tagged `[I-9a]` prove only the kinds landed so far.
 * A claim may also bound a row by a stage of this plan that has not landed, naming the stage that
 * removes it: M3.b-4's P7R-03 removes I-9a's.
 */
export const claims: readonly Claim[] = [
  {
    id: "I-19",
    source:
      "the Basic subset of the shared vocabulary is fixed by the certification checklists, which are member-only (reading I-8.1)",
  },
  {
    id: "I-9a",
    source:
      "full response processing lands in four stages, M3.b-1 to M3.b-4; until the last lands, an item whose processing holds an expression kind not yet landed is marked and its processing runs none, and the roster in src/model/expression.test.ts lists those kinds by the unit that lands each; M3.b-4's P7R-03 removes this claim",
  },
];
