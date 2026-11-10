/**
 * Block Feedback, which the reading "A feedback element names an outcome variable" governs and no
 * Appendix A row names, a stub module: the body walk hands a `qti-feedback-block` to its `parse`,
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
 * The QTI element Block Feedback is read from, which its notice names.
 */
const element = "qti-feedback-block";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-feedback-block`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Block Feedback module, a stub.
 */
export const feedbackBlockModule: ContentModule<typeof element, never> = {
  element,
  feature: [],
  /**
   * False: the module is a stub until issue m5-02 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-feedback-block`, as the body walk gives any QTI element it does not read,
   * so the verdict and the HTML stay what they were until issue m5-02 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "body",
  /**
   * Block Feedback's payload copy: not implemented; issue m5-02 fills it.
   */
  redact: notImplemented,
  /**
   * Block Feedback's render function: not implemented; issue m5-02 fills it.
   */
  render: notImplemented,
};
