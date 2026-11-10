/**
 * SSML (the accessibility list's A-3a and A-3b, which no item row names), a stub module for every
 * element of the SSML namespace: the body walk hands each one to its `parse`, which gives the
 * notice the body walk gives any element outside the QTI namespace, so the element renders as it
 * did, its subtree dropped. In practice no checked item holds one: the verdict hands each SSML
 * island to its `check`, which leaves the document unchecked as the verdict did, so no item with
 * SSML is built. Every other step throws {@link ContentNotImplemented}, and no walk reaches them.
 * Issue m4-02b fills the module.
 *
 * SSML sits inline in the item's text as islands of several elements, `speak`, `phoneme`,
 * `say-as`, `sub`, `break` and the rest, so the module reads every element of its namespace
 * ({@link anyElement}), and its nodes carry `*` as their element.
 *
 * @module
 */
import { ContentNotImplemented, anyElement } from "#plate/content/contract.ts";
import type { BodyContentModule } from "#plate/content/contract.ts";
import { ssmlNamespace } from "#plate/document/source.ts";

/**
 * The element the SSML module reads: every element of the SSML namespace.
 */
const element = anyElement;

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `*`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The SSML module, a stub.
 */
export const ssmlModule: BodyContentModule<typeof element, never> = {
  /**
   * Leave a document holding SSML unchecked, with the reason `ssml` at the island, as the verdict
   * left it before issue m4-02b judges SSML through this module.
   */
  check: (_island, path) => [{ path, reason: "ssml" }],
  /**
   * SSML's payload copy: not implemented; issue m4-02b fills it.
   */
  /**
   * No content: a stub has no payload node, so the heading shift reads none.
   */
  content: () => [],
  copy: notImplemented,
  element,
  feature: [],
  /**
   * False: the module is a stub until issue m4-02b lands it.
   */
  implemented: false,
  namespace: ssmlNamespace,
  /**
   * Give the notice `{http://www.w3.org/2001/10/synthesis}<local>`, as the body walk gives any
   * element outside the QTI namespace, so the verdict and the HTML stay what they were until issue
   * m4-02b reads the element.
   */
  parse: (source, context) => context.notice(`{${ssmlNamespace}}${source.local}`),
  /**
   * Refuse the element in a redacted item, as the codec refused every node of it before: the model
   * holds none until issue m4-02b reads the element.
   */
  payloadSchema: ({ unimplementedContent }) => unimplementedContent({ element }),
  placement: "body",
  /**
   * SSML's redaction: not implemented; issue m4-02b fills it.
   */
  redact: notImplemented,
  /**
   * SSML's render function: not implemented; issue m4-02b fills it.
   */
  render: notImplemented,
};
