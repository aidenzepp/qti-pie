/**
 * Order (Q-15), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-order-interaction` renders as it did; its `payloadSchema` refuses the
 * kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue ei-06 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Order part in the part table.
 */
const owner = "order-interaction";

/**
 * Order's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-15";

/**
 * The QTI element Order is read from, which its notice names.
 */
const element = "qti-order-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Order's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Order module, a stub.
 */
export const orderModule: InteractionModule<"order", ModuleInteraction<"order">, never> = {
  /**
   * The responses Order binds, which `postings` reads: not implemented; issue ei-06 fills it.
   */
  bindings: notImplemented,
  /**
   * Order's connect function: not implemented; issue ei-06 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Order renders: not implemented; issue ei-06 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-06 lands it.
   */
  implemented: false,
  kind: "order",
  /**
   * The NULL of Order's own binding: not implemented; issue ei-06 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-order-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-06 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-06 adds Order's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Order's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-06 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "order" }),
  /**
   * Order's payload copy: not implemented; issue ei-06 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Order's render function: not implemented; issue ei-06 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Order shows for a stored response: not implemented; issue ei-06 fills it.
   */
  restore: notImplemented,
  /**
   * The order Order's choices were presented in: not implemented; issue ei-06 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Order shows for the correct response: not implemented; issue ei-06 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Order's Controls: not implemented; issue ei-06 fills it.
   */
  unnamed: notImplemented,
  /**
   * Order's response validation: not implemented; issue ei-06 fills it.
   */
  validate: notImplemented,
};
