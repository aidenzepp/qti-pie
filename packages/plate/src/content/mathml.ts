/**
 * MathML (I-18), a stub module: the body walk hands a MathML `math` element to its `parse`, which
 * gives the notice the body walk gives any element outside the QTI namespace, so the element
 * renders as it did, its subtree dropped. In practice no checked item holds one: the verdict hands
 * each MathML island to its `check`, which leaves the document unchecked as the verdict did, so no
 * item with MathML is built. Its `normalise` is the hook that rewrites deprecated MathML, such as
 * `mfenced` and `menclose`, before `parse` reads it; the walk calls it, so the stub gives the
 * element as written. Every other step throws {@link ContentNotImplemented}, and no walk reaches
 * them. Issue m3e-05 fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { BodyContentModule } from "#plate/content/contract.ts";
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
export const mathmlModule: BodyContentModule<typeof element, never> = {
  /**
   * Leave a document holding MathML unchecked, with the reason `mathml` at the island, as the
   * verdict left it before issue m3e-05 judges MathML through this module.
   */
  check: (_island, path) => [{ path, reason: "mathml" }],
  /**
   * MathML's payload copy: not implemented; issue m3e-05 fills it.
   */
  /**
   * No content: a stub has no payload node, so the heading shift reads none.
   */
  content: () => [],
  copy: notImplemented,
  element,
  feature: ["I-18"],
  /**
   * False: the module is a stub until issue m3e-05 lands it.
   */
  implemented: false,
  namespace: mathmlNamespace,
  /**
   * Give the element as written: the body walk hands every `math` here before `parse`, so a stub
   * rewrites nothing; issue m3e-05 rewrites deprecated MathML, such as `mfenced`, here.
   */
  normalise: (source) => source,
  /**
   * Give the notice `{http://www.w3.org/1998/Math/MathML}math`, as the body walk gives any element
   * outside the QTI namespace, so the verdict and the HTML stay what they were until issue m3e-05
   * reads the element.
   */
  parse: (_source, context) => context.notice(notice),
  /**
   * Refuse the element in a redacted item, as the codec refused every node of it before: the model
   * holds none until issue m3e-05 reads the element.
   */
  payloadSchema: ({ unimplementedContent }) => unimplementedContent({ element }),
  placement: "body",
  /**
   * MathML's redaction: not implemented; issue m3e-05 fills it.
   */
  redact: notImplemented,
  /**
   * MathML's render function: not implemented; issue m3e-05 fills it.
   */
  render: notImplemented,
};
