/**
 * Catalog Resources (I-14), a stub module: the item root's walk dispatches each `qti-catalog-info`
 * to its `parse`, which records the mark that walk records for every `qti-*` element it does not
 * read, so the verdict stays what it was. Every other step throws {@link ContentNotImplemented}.
 * Issue m3e-04 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ItemContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Catalog Resources is read from, which its mark names.
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
export const catalogInfoModule: ItemContentModule<typeof element, never> = {
  element,
  feature: ["I-14"],
  /**
   * False: the module is a stub until issue m3e-04 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Record the mark `qti-catalog-info`, as the item root's walk records any `qti-*` element it does
   * not read, until issue m3e-04 reads the element.
   */
  parse: (_source, context) => context.mark(element),
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
