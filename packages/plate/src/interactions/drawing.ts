/**
 * Drawing (Q-3), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-drawing-interaction` renders as it did; its `payloadSchema` refuses the
 * kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue ei-17 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Drawing part in the part table.
 */
const owner = "drawing-interaction";

/**
 * Drawing's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-3";

/**
 * The QTI element Drawing is read from, which its notice names.
 */
const element = "qti-drawing-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Drawing's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Drawing module, a stub.
 */
export const drawingModule: InteractionModule<"drawing", ModuleInteraction<"drawing">, never> = {
  /**
   * The responses Drawing binds, which `postings` reads: not implemented; issue ei-17 fills it.
   */
  bindings: notImplemented,
  /**
   * Drawing's connect function: not implemented; issue ei-17 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Drawing renders: not implemented; issue ei-17 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-17 lands it.
   */
  implemented: false,
  kind: "drawing",
  /**
   * The NULL of Drawing's own binding: not implemented; issue ei-17 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-drawing-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-17 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-17 adds Drawing's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Drawing's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-17 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "drawing" }),
  /**
   * Drawing's payload copy: not implemented; issue ei-17 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Drawing's render function: not implemented; issue ei-17 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Drawing shows for a stored response: not implemented; issue ei-17 fills it.
   */
  restore: notImplemented,
  /**
   * The order Drawing's choices were presented in: not implemented; issue ei-17 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Drawing shows for the correct response: not implemented; issue ei-17 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Drawing's Controls: not implemented; issue ei-17 fills it.
   */
  unnamed: notImplemented,
  /**
   * Drawing's response validation: not implemented; issue ei-17 fills it.
   */
  validate: notImplemented,
};
