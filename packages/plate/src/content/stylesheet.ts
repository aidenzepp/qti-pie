/**
 * Stylesheet (I-6), a stub module: the item root's walk does not call it yet: it records a
 * `qti-stylesheet` as a mark, as it records every `qti-*` element it does not read, so the verdict
 * stays what it was. Its `parse` gives the notice the body walk gives any QTI element it does not
 * read, and every other step throws {@link ContentNotImplemented}. Issue m5-06 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Stylesheet is read from, which its notice names.
 */
const element = "qti-stylesheet";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-stylesheet`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Stylesheet module, a stub.
 */
export const stylesheetModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-6"],
  /**
   * False: the module is a stub until issue m5-06 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-stylesheet`, as the body walk gives any QTI element it does not read; the
   * item root's walk does not call it until issue m5-06 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "item",
  /**
   * Stylesheet's payload copy: not implemented; issue m5-06 fills it.
   */
  redact: notImplemented,
  /**
   * Stylesheet's render function: not implemented; issue m5-06 fills it.
   */
  render: notImplemented,
};
