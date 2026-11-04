/**
 * The browser-support note: the web-features the package's stylesheets use below the floor.
 *
 * The floor is Baseline widely available (`high`). Each row names one web-features feature id
 * (web-features 3.45.0, pinned in `src/test/baseline.ts`) that a stylesheet uses although its
 * baseline is below the floor, and says what a browser without it shows instead. The floor check
 * passes such a use only when its feature has a row here, and refuses a row no use reaches. M1-R's
 * ledger view renders the rows.
 *
 * @module
 */

/**
 * One feature a stylesheet uses below the floor.
 */
export interface SupportNote {
  /**
   * What a browser below the floor shows instead, in one line.
   */
  readonly degrade: string;
  /**
   * The web-features feature id, such as `accent-color`.
   */
  readonly feature: string;
  /**
   * The feature's baseline: `low` for newly available, `limited` for the data's `false`.
   */
  readonly status: "low" | "limited";
}

/**
 * The note's rows, one per web-features feature id below the floor that a stylesheet uses. It
 * starts empty: a row is added with the stylesheet rule that needs it.
 */
export const browserSupport: readonly SupportNote[] = [];
