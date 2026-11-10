/**
 * Rubric Block (I-11), a stub module: the body walk hands a `qti-rubric-block` to its `parse`,
 * which gives the notice the body walk gives any QTI element it does not read, so the element
 * renders as it did, its subtree dropped, and every other step throws {@link ContentNotImplemented}.
 * No walk reaches those: the model holds no node of this element. Issue m3e-01 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Rubric Block is read from, which its notice names.
 */
const element = "qti-rubric-block";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-rubric-block`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Rubric Block module, a stub.
 */
export const rubricModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-11"],
  /**
   * False: the module is a stub until issue m3e-01 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Give the notice `qti-rubric-block`, as the body walk gives any QTI element it does not read, so
   * the verdict and the HTML stay what they were until issue m3e-01 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  placement: "body",
  /**
   * Rubric Block's payload copy: not implemented; issue m3e-01 fills it.
   */
  redact: notImplemented,
  /**
   * Rubric Block's render function: not implemented; issue m3e-01 fills it.
   */
  render: notImplemented,
};
