/**
 * Graphic Order (Q-9), a stub module: its `parse` gives the notice the body walk gives any QTI
 * element it does not read, so a `qti-graphic-order-interaction` renders as it did, and every other
 * step throws {@link NotImplemented}. No hub reaches those: the model holds no node of this kind.
 * Issue ei-10 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { GraphicOrderInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Graphic Order part in the part table.
 */
const owner = "graphic-order-interaction";

/**
 * Graphic Order's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-9";

/**
 * The QTI element Graphic Order is read from, which its notice names.
 */
const element = "qti-graphic-order-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Graphic Order's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Graphic Order module, a stub.
 */
export const graphicOrderModule: InteractionModule<
  "graphic-order",
  GraphicOrderInteraction,
  never
> = {
  /**
   * The responses Graphic Order binds, which `postings` reads: not implemented; issue ei-10 fills
   * it.
   */
  bindings: notImplemented,
  /**
   * Graphic Order's connect function: not implemented; issue ei-10 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Graphic Order renders: not implemented; issue ei-10 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-10 lands it.
   */
  implemented: false,
  kind: "graphic-order",
  /**
   * The NULL of Graphic Order's own binding: not implemented; issue ei-10 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-graphic-order-interaction`, as the body walk gives any QTI element it does
   * not read, so the verdict and the HTML stay what they were until issue ei-10 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-10 adds Graphic Order's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Graphic Order's feature, as the codec refused it
   * before: the model holds no node of it until issue ei-10 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "graphic-order" }),
  /**
   * Graphic Order's payload copy: not implemented; issue ei-10 fills it.
   */
  redact: notImplemented,
  /**
   * Graphic Order's render function: not implemented; issue ei-10 fills it.
   */
  render: notImplemented,
  /**
   * The value Graphic Order shows for a stored response: not implemented; issue ei-10 fills it.
   */
  restore: notImplemented,
  /**
   * The order Graphic Order's choices were presented in: not implemented; issue ei-10 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Graphic Order shows for the correct response: not implemented; issue ei-10 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Graphic Order's Controls: not implemented; issue ei-10 fills it.
   */
  unnamed: notImplemented,
  /**
   * Graphic Order's response validation: not implemented; issue ei-10 fills it.
   */
  validate: notImplemented,
};
