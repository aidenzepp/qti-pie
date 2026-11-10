/**
 * The Long Description presenter, a stub: the catalog module hands it each card of the support
 * `long-description` the host enabled, and it attaches the card's content beside the referencing
 * element. It presents none until issue m4-09 fills it; the catalog module reaches no stub
 * presenter, so `present` throws {@link ContentNotImplemented}.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";

/**
 * The support the presenter presents.
 */
const support = "long-description";

/**
 * The Long Description presenter, a stub.
 */
export const longDescriptionPresenter: CatalogPresenter<typeof support> = {
  /**
   * False: the presenter is a stub until issue m4-09 lands it.
   */
  implemented: false,
  /**
   * Long Description's presentation: not implemented; issue m4-09 fills it.
   *
   * @returns Nothing: it always throws.
   * @throws {ContentNotImplemented} Always, naming the support.
   */
  present: () => {
    throw new ContentNotImplemented({ element: support });
  },
  support,
};
