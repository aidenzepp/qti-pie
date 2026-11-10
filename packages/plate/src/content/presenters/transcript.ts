/**
 * The Transcript presenter, a stub: the catalog module hands it each card of the support
 * `transcript` the host enabled, and it attaches the card's content beside the referencing element.
 * It presents none until a follow-up of issue m4-12 fills it; the catalog module reaches no stub
 * presenter, so `present` throws {@link ContentNotImplemented}. Meanwhile, where the catalog module
 * has landed, its listing shows the card's content and files, so a candidate still reaches them,
 * only not placed beside the element; where that module is itself a stub, nothing shows.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";

/**
 * The support the presenter presents.
 */
const support = "transcript";

/**
 * The Transcript presenter, a stub.
 */
export const transcriptPresenter: CatalogPresenter<typeof support> = {
  /**
   * False: the presenter presents no Transcript until a follow-up of issue m4-12 lands it; where
   * the catalog module has landed, its listing shows the card's content and files meanwhile.
   */
  implemented: false,
  /**
   * Transcript's presentation: not implemented; a follow-up of issue m4-12 fills it. Where the
   * catalog module has landed, its listing shows the card's content and files meanwhile.
   *
   * @returns Nothing: it always throws.
   * @throws {ContentNotImplemented} Always, naming the support.
   */
  present: () => {
    throw new ContentNotImplemented({ element: support });
  },
  support,
};
