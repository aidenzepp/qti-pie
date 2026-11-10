/**
 * `itemRefs`, a test's item refs as a host reads them to find the items a session over the test
 * delivers: by `href` when it opens the test and its items one at a time with `open`, or to look
 * at a test of an accepted package.
 *
 * It reads only an `AcceptedTest`, which `open` gives, so it stays in plate's main entry, apart
 * from the content-package entry and the package tables `openPackage` loads.
 *
 * @module
 */
import { itemRefsIn } from "#plate/model/item-refs.ts";
import type { AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * One item ref of a test, as {@link itemRefs} lists it: its identifier and its `href` as the test
 * model reads them.
 */
export interface ItemRefEntry {
  /**
   * The `href` with its outer whitespace removed and each inner run of it one space, as an
   * `anyURI` reads.
   */
  readonly href: string;
  readonly identifier: string;
}

/**
 * List a test's item refs in document order, each with its identifier and its `href`, the item refs
 * a session over the test delivers.
 *
 * @param test The accepted test.
 * @returns Its item refs, every part's and section's, in document order.
 */
export const itemRefs = (test: AcceptedTest): readonly ItemRefEntry[] =>
  test.test.parts.flatMap((part) =>
    itemRefsIn(part.children).map(({ href, identifier }) => ({ href, identifier })),
  );
