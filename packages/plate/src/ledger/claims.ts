/**
 * The claims: the rows the ledger reports as `limited`, each with the source that bounds what a
 * test can prove for it (rule `f000ce54`).
 *
 * A claim outranks the tests: a row a claim names is `limited` even when a passing test carries its
 * tag, so a passing test never makes such a row `covered`.
 *
 * The claims live in one file per area under `src/ledger/claims/`, so an issue of one area writes
 * its own file and no other: `shared.ts` holds those made before the fan-out, and `m3f.ts`, `m4.ts`
 * and `m5.ts` each area's. {@link claimAreas} joins them, in that order, into {@link claims}.
 *
 * @module
 */
import { m3fClaims } from "#plate/ledger/claims/m3f.ts";
import { m4Claims } from "#plate/ledger/claims/m4.ts";
import { m5Claims } from "#plate/ledger/claims/m5.ts";
import { sharedClaims } from "#plate/ledger/claims/shared.ts";

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
   * it.
   */
  readonly source: string;
}

/**
 * One area's claims file: its name, and the claims it holds.
 */
export interface ClaimArea {
  readonly area: string;
  readonly claims: readonly Claim[];
}

/**
 * The areas' claims, in the order {@link claims} joins them.
 */
export const claimAreas: readonly ClaimArea[] = [
  { area: "shared", claims: sharedClaims },
  { area: "m3f", claims: m3fClaims },
  { area: "m4", claims: m4Claims },
  { area: "m5", claims: m5Claims },
];

/**
 * Join some areas' claims into the one list the ledger reads, in the areas' order.
 *
 * @param areas The areas.
 * @returns Every claim, in order.
 */
export const joinClaims = (areas: readonly ClaimArea[]): readonly Claim[] =>
  areas.flatMap((area) => area.claims);

/**
 * The claims: every area's, joined.
 */
export const claims: readonly Claim[] = joinClaims(claimAreas);
