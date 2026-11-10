/**
 * Catalog Resources (I-14), a stub module: the item root's walk does not call it yet: it records a
 * `qti-catalog-info` as a mark, as it records every `qti-*` element it does not read, so the
 * verdict stays what it was. Its `parse` gives the notice the body walk gives any QTI element it
 * does not read, and every other step throws {@link ContentNotImplemented}. Issue m3e-04 fills the
 * module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Catalog Resources is read from, which its notice names.
 */
const element = "qti-catalog-info";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-catalog-info`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Catalog Resources module, a stub.
 */
export const catalogInfoModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-14"],
  /**
   * False: the module is a stub until issue m3e-04 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-catalog-info`, as the body walk gives any QTI element it does not read;
   * the item root's walk does not call it until issue m3e-04 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "item",
  /**
   * Catalog Resources's payload copy: not implemented; issue m3e-04 fills it.
   */
  redact: notImplemented,
  /**
   * Catalog Resources's render function: not implemented; issue m3e-04 fills it.
   */
  render: notImplemented,
};
