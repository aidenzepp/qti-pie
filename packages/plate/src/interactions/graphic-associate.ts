/**
 * Graphic Associate (Q-7), a stub module: its `parse` gives the notice the body walk gives any QTI
 * element it does not read, so a `qti-graphic-associate-interaction` renders as it did; its
 * `payloadSchema` refuses the kind, its `content`, `regions` and `replaceRegions` give no content,
 * no region and the node itself, and every other step throws {@link NotImplemented}. No hub reaches
 * those: the model holds no node of this kind. Issue ei-08 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Graphic Associate part in the part table.
 */
const owner = "graphic-associate-interaction";

/**
 * Graphic Associate's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-7";

/**
 * The QTI element Graphic Associate is read from, which its notice names.
 */
const element = "qti-graphic-associate-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Graphic Associate's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Graphic Associate module, a stub.
 */
export const graphicAssociateModule: InteractionModule<
  "graphic-associate",
  ModuleInteraction<"graphic-associate">,
  never
> = {
  /**
   * The responses Graphic Associate binds, which `postings` reads: not implemented; issue ei-08
   * fills it.
   */
  bindings: notImplemented,
  /**
   * Graphic Associate's connect function: not implemented; issue ei-08 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Graphic Associate renders: not implemented; issue ei-08 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-08 lands it.
   */
  implemented: false,
  kind: "graphic-associate",
  /**
   * The NULL of Graphic Associate's own binding: not implemented; issue ei-08 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-graphic-associate-interaction`, as the body walk gives any QTI element it
   * does not read, so the verdict and the HTML stay what they were until issue ei-08 reads the
   * element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-08 adds Graphic Associate's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Graphic Associate's feature, as the codec refused it
   * before: the model holds no node of it until issue ei-08 reads the element.
   */
  payloadSchema: ({ unimplemented }) =>
    unimplemented({ element, feature, kind: "graphic-associate" }),
  /**
   * Graphic Associate's payload copy: not implemented; issue ei-08 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Graphic Associate's render function: not implemented; issue ei-08 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Graphic Associate shows for a stored response: not implemented; issue ei-08 fills it.
   */
  restore: notImplemented,
  /**
   * The order Graphic Associate's choices were presented in: not implemented; issue ei-08 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Graphic Associate shows for the correct response: not implemented; issue ei-08 fills
   * it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Graphic Associate's Controls: not implemented; issue ei-08 fills it.
   */
  unnamed: notImplemented,
  /**
   * Graphic Associate's response validation: not implemented; issue ei-08 fills it.
   */
  validate: notImplemented,
};
