/**
 * Modal Feedback (I-10), a stub module: the item root's walk does not call it yet: it records a
 * `qti-modal-feedback` as a mark, as it records every `qti-*` element it does not read, so the
 * verdict stays what it was. Its `parse` gives the notice the body walk gives any QTI element it
 * does not read, and every other step throws {@link ContentNotImplemented}. Issue m5-01 fills the
 * module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Modal Feedback is read from, which its notice names.
 */
const element = "qti-modal-feedback";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-modal-feedback`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Modal Feedback module, a stub.
 */
export const modalFeedbackModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-10"],
  /**
   * False: the module is a stub until issue m5-01 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-modal-feedback`, as the body walk gives any QTI element it does not read;
   * the item root's walk does not call it until issue m5-01 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "item",
  /**
   * Modal Feedback's payload copy: not implemented; issue m5-01 fills it.
   */
  redact: notImplemented,
  /**
   * Modal Feedback's render function: not implemented; issue m5-01 fills it.
   */
  render: notImplemented,
};
