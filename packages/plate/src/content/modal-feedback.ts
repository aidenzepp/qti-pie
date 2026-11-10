/**
 * Modal Feedback (I-10), a stub module: the item root's walk dispatches each `qti-modal-feedback`
 * to its `parse`, which records the mark that walk records for every `qti-*` element it does not
 * read, so the verdict stays what it was. Every other step throws {@link ContentNotImplemented}.
 * Issue m5-01 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ItemContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Modal Feedback is read from, which its mark names.
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
export const modalFeedbackModule: ItemContentModule<typeof element, never> = {
  element,
  feature: ["I-10"],
  /**
   * False: the module is a stub until issue m5-01 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Record the mark `qti-modal-feedback`, as the item root's walk records any `qti-*` element it
   * does not read, until issue m5-01 reads the element.
   */
  parse: (_source, context) => context.mark(element),
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
