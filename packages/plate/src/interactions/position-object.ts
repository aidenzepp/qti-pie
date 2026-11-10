/**
 * Position Object (Q-17), a stub module: its `parse` gives the notice the body walk gives any QTI
 * element it does not read, so a `qti-position-object-interaction` renders as it did; its
 * `payloadSchema` refuses the kind, its `content`, `regions` and `replaceRegions` give no content,
 * no region and the node itself, and every other step throws {@link NotImplemented}. No hub reaches
 * those: the model holds no node of this kind. Issue ei-12 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { PositionObjectInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Position Object part in the part table.
 */
const owner = "position-object-interaction";

/**
 * Position Object's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-17";

/**
 * The QTI element Position Object is read from, which its notice names.
 */
const element = "qti-position-object-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Position Object's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Position Object module, a stub.
 */
export const positionObjectModule: InteractionModule<
  "position-object",
  PositionObjectInteraction,
  never
> = {
  /**
   * The responses Position Object binds, which `postings` reads: not implemented; issue ei-12 fills
   * it.
   */
  bindings: notImplemented,
  /**
   * Position Object's connect function: not implemented; issue ei-12 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Position Object renders: not implemented; issue ei-12 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-12 lands it.
   */
  implemented: false,
  kind: "position-object",
  /**
   * The NULL of Position Object's own binding: not implemented; issue ei-12 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-position-object-interaction`, as the body walk gives any QTI element it
   * does not read, so the verdict and the HTML stay what they were until issue ei-12 reads the
   * element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-12 adds Position Object's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Position Object's feature, as the codec refused it
   * before: the model holds no node of it until issue ei-12 reads the element.
   */
  payloadSchema: ({ unimplemented }) =>
    unimplemented({ element, feature, kind: "position-object" }),
  /**
   * Position Object's payload copy: not implemented; issue ei-12 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Position Object's render function: not implemented; issue ei-12 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Position Object shows for a stored response: not implemented; issue ei-12 fills it.
   */
  restore: notImplemented,
  /**
   * The order Position Object's choices were presented in: not implemented; issue ei-12 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Position Object shows for the correct response: not implemented; issue ei-12 fills
   * it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Position Object's Controls: not implemented; issue ei-12 fills it.
   */
  unnamed: notImplemented,
  /**
   * Position Object's response validation: not implemented; issue ei-12 fills it.
   */
  validate: notImplemented,
};
