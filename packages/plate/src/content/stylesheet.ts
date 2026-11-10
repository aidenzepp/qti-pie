/**
 * Stylesheet (I-6), a stub module: the item root's walk dispatches each `qti-stylesheet` to its
 * `parse`, which records the mark that walk records for every `qti-*` element it does not read, so
 * the verdict stays what it was. Every other step throws {@link ContentNotImplemented}. Issue m5-06
 * fills the module.
 *
 * @module
 */
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type { ItemContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The QTI element Stylesheet is read from, which its mark names.
 */
const element = "qti-stylesheet";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {ContentNotImplemented} Always, naming `qti-stylesheet`.
 */
const notImplemented = (): never => {
  throw new ContentNotImplemented({ element });
};

/**
 * The Stylesheet module, a stub.
 */
export const stylesheetModule: ItemContentModule<typeof element, never> = {
  /**
   * Stylesheet's payload copy: not implemented; issue m5-06 fills it.
   */
  /**
   * No content: a stub has no payload node, so the heading shift reads none.
   */
  content: () => [],
  copy: notImplemented,
  element,
  feature: ["I-6"],
  /**
   * False: the module is a stub until issue m5-06 lands it.
   */
  implemented: false,
  namespace: qtiNamespace,
  /**
   * Record the mark `qti-stylesheet`, as the item root's walk records any `qti-*` element it does
   * not read, until issue m5-06 reads the element.
   */
  parse: (_source, context) => context.mark(element),
  /**
   * Refuse the element in a redacted item, as the codec refused every node of it before: the model
   * holds none until issue m5-06 reads the element.
   */
  payloadSchema: ({ unimplementedContent }) => unimplementedContent({ element }),
  placement: "item",
  /**
   * Stylesheet's redaction: not implemented; issue m5-06 fills it.
   */
  redact: notImplemented,
  /**
   * Stylesheet's render function: not implemented; issue m5-06 fills it.
   */
  render: notImplemented,
};
