/**
 * Inline Feedback, which the reading "A feedback element names an outcome variable" governs and no
 * Appendix A row names, a stub module: the body walk hands a `qti-feedback-inline` to its `parse`,
 * which gives the notice the body walk gives any QTI element it does not read, so the element
 * renders as it did, its subtree dropped, and every other step throws {@link ContentNotImplemented}.
 * No walk reaches those: the model holds no node of this element. Issue m5-02 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Inline Feedback is read from, which its notice names.
 */
const element = "qti-feedback-inline";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-feedback-inline`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Inline Feedback module, a stub.
 */
export const feedbackInlineModule: ContentModule<typeof element, never> = {
  element,
  feature: [],
  /**
   * False: the module is a stub until issue m5-02 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-feedback-inline`, as the body walk gives any QTI element it does not read,
   * so the verdict and the HTML stay what they were until issue m5-02 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "body",
  /**
   * Inline Feedback's payload copy: not implemented; issue m5-02 fills it.
   */
  redact: notImplemented,
  /**
   * Inline Feedback's render function: not implemented; issue m5-02 fills it.
   */
  render: notImplemented,
};
