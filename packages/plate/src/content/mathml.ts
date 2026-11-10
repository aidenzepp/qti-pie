/**
 * MathML (I-18), a stub module: the body walk hands a MathML `math` element to its `parse`, which
 * gives the notice the body walk gives any element outside the QTI namespace, so the element
 * renders as it did, its subtree dropped. In practice no checked item holds one: the verdict leaves
 * a document holding MathML unchecked, so no item with MathML is built. Its `normalise` is the hook
 * that rewrites deprecated MathML, such as `mfenced` and `menclose`, before `parse` reads it; it
 * and every other step throw {@link ContentNotImplemented}, and no walk reaches them. Issue m3e-05
 * fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ContentModule } from "#plate/content/contract.ts";
import { mathmlNamespace } from "#plate/document/source.ts";

/**
 * The MathML element MathML content is read from.
 */
const element = "math";

/**
 * The feature a `math` element's notice names: `{<namespace>}<local>`, as the body walk names an
 * element outside the QTI namespace.
 */
const notice = `{${mathmlNamespace}}${element}`;

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `math`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The MathML module, a stub.
 */
export const mathmlModule: ContentModule<typeof element, never> = {
  element,
  feature: ["I-18"],
  /**
   * False: the module is a stub until issue m3e-05 lands it.
   */
  implemented: false,
  namespace: mathmlNamespace,
  /**
   * MathML's normalisation of deprecated markup: not implemented; issue m3e-05 fills it.
   */
  normalise: notImplemented,
  /**
   * Give the notice `{http://www.w3.org/1998/Math/MathML}math`, as the body walk gives any element
   * outside the QTI namespace, so the verdict and the HTML stay what they were until issue m3e-05
   * reads the element.
   */
  parse: (_source, context) => context.notice(notice),
  placement: "body",
  /**
   * MathML's payload copy: not implemented; issue m3e-05 fills it.
   */
  redact: notImplemented,
  /**
   * MathML's render function: not implemented; issue m3e-05 fills it.
   */
  render: notImplemented,
};
