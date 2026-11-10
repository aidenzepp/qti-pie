/**
 * The Glossary on Screen presenter, a stub: the catalog module hands it each card of the support
 * `glossary-on-screen` the host enabled, and it attaches the card's content beside the referencing
 * element. It presents none until issue m3e-08 fills it; the catalog module reaches no stub
 * presenter, so `present` throws {@link ContentNotImplemented}.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";

/**
 * The support the presenter presents.
 */
const support = "glossary-on-screen";

/**
 * The Glossary on Screen presenter, a stub.
 */
export const glossaryOnScreenPresenter: CatalogPresenter<typeof support> = {
  /**
   * False: the presenter is a stub until issue m3e-08 lands it.
   */
  implemented: false,
  /**
   * Glossary on Screen's presentation: not implemented; issue m3e-08 fills it.
   *
   * @returns Nothing: it always throws.
   * @throws {ContentNotImplemented} Always, naming the support.
   */
  present: () => {
    throw new ContentNotImplemented({ element: support });
  },
  support,
};
