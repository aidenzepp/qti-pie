/**
 * The High Contrast presenter, a stub: the catalog module hands it each card of the support
 * `high-contrast` the host enabled, and it attaches the card's content beside the referencing
 * element. It presents none until issue m5-12 fills it; the catalog module reaches no stub
 * presenter, so `present` throws {@link ContentNotImplemented}.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";

/**
 * The support the presenter presents.
 */
const support = "high-contrast";

/**
 * The High Contrast presenter, a stub.
 */
export const highContrastPresenter: CatalogPresenter<typeof support> = {
  /**
   * False: the presenter is a stub until issue m5-12 lands it.
   */
  implemented: false,
  /**
   * High Contrast's presentation: not implemented; issue m5-12 fills it.
   *
   * @returns Nothing: it always throws.
   * @throws {ContentNotImplemented} Always, naming the support.
   */
  present: () => {
    throw new ContentNotImplemented({ element: support });
  },
  support,
};
