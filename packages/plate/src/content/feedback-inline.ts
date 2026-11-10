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
import type { BodyContentModule } from "#plate/content/contract.ts";
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
export const feedbackInlineModule: BodyContentModule<typeof element, never> = {
  /**
   * Inline Feedback's payload copy: not implemented; issue m5-02 fills it.
   */
  /**
   * No content: a stub has no payload node, so the heading shift reads none.
   */
  content: () => [],
  copy: notImplemented,
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
  /**
   * Refuse the element in a redacted item, as the codec refused every node of it before: the model
   * holds none until issue m5-02 reads the element.
   */
  payloadSchema: ({ unimplementedContent }) => unimplementedContent({ element }),
  placement: "body",
  /**
   * Inline Feedback's redaction: not implemented; issue m5-02 fills it.
   */
  redact: notImplemented,
  /**
   * Inline Feedback's render function: not implemented; issue m5-02 fills it.
   */
  render: notImplemented,
};
