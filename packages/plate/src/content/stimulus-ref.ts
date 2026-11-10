/**
 * Shared Stimulus reference (I-4), a stub module: the item root's walk does not call it yet: it
 * records a `qti-assessment-stimulus-ref` as a mark, as it records every `qti-*` element it does
 * not read, so the verdict stays what it was. Its `parse` gives the notice the body walk gives any
 * QTI element it does not read, and every other step throws {@link ContentNotImplemented}. Issue
 * m3e-02 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Shared Stimulus reference is read from, which its notice names.
 */
const element = "qti-assessment-stimulus-ref";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-assessment-stimulus-ref`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Shared Stimulus reference module, a stub.
 */
export const stimulusRefModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-4"],
  /**
   * False: the module is a stub until issue m3e-02 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-assessment-stimulus-ref`, as the body walk gives any QTI element it does
   * not read; the item root's walk does not call it until issue m3e-02 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "item",
  /**
   * Shared Stimulus reference's payload copy: not implemented; issue m3e-02 fills it.
   */
  redact: notImplemented,
  /**
   * Shared Stimulus reference's render function: not implemented; issue m3e-02 fills it.
   */
  render: notImplemented,
};
