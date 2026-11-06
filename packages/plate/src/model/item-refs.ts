/**
 * The walk that lists a test's item refs, which the session, its navigation and the package reader
 * share.
 *
 * It lives apart from the test model because the model builder value-imports the Effect runtime,
 * and the session's modules are browser modules: this module value-imports nothing.
 *
 * @module
 */
import type { ItemRef, SectionChild } from "#plate/model/test.ts";

/**
 * List the item refs among some section children, nested sections' included, in document order.
 *
 * @param children The children.
 * @returns Their item refs.
 */
export const itemRefsIn = (children: readonly SectionChild[]): readonly ItemRef[] =>
  children.flatMap((child) => (child.kind === "item-ref" ? [child] : itemRefsIn(child.children)));

/**
 * List the identifiers of the item refs among some section children, nested sections' included,
 * in document order.
 *
 * @param children The children.
 * @returns Their item refs' identifiers.
 */
export const refIdentifiersIn = (children: readonly SectionChild[]): readonly string[] =>
  itemRefsIn(children).map((ref) => ref.identifier);
