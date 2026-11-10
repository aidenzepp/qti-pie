/**
 * The Simplified Language Portions presenter, a stub: the catalog module hands it each card of the
 * support `simplified-language-portions` the host enabled, and it attaches the card's content
 * beside the referencing element. It presents none until issue m5-11 fills it; the catalog module
 * reaches no stub presenter, so `present` throws {@link ContentNotImplemented}.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";

/**
 * The support the presenter presents.
 */
const support = "simplified-language-portions";

/**
 * The Simplified Language Portions presenter, a stub.
 */
export const simplifiedLanguagePortionsPresenter: CatalogPresenter<typeof support> = {
  /**
   * False: the presenter is a stub until issue m5-11 lands it.
   */
  implemented: false,
  /**
   * Simplified Language Portions's presentation: not implemented; issue m5-11 fills it.
   *
   * @returns Nothing: it always throws.
   * @throws {ContentNotImplemented} Always, naming the support.
   */
  present: () => {
    throw new ContentNotImplemented({ element: support });
  },
  support,
};
