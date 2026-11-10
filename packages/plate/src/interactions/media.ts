/**
 * Media (Q-14), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-media-interaction` renders as it did, and every other step throws
 * {@link NotImplemented}. No hub reaches those: the model holds no node of this kind. Issue ei-03
 * fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { MediaInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Media part in the part table.
 */
const owner = "media-interaction";

/**
 * Media's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-14";

/**
 * The QTI element Media is read from, which its notice names.
 */
const element = "qti-media-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Media's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Media module, a stub.
 */
export const mediaModule: InteractionModule<"media", MediaInteraction, never> = {
  /**
   * The responses Media binds, which `postings` reads: not implemented; issue ei-03 fills it.
   */
  bindings: notImplemented,
  /**
   * Media's connect function: not implemented; issue ei-03 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Media renders: not implemented; issue ei-03 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-03 lands it.
   */
  implemented: false,
  kind: "media",
  /**
   * The NULL of Media's own binding: not implemented; issue ei-03 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-media-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-03 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-03 adds Media's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Media's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-03 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "media" }),
  /**
   * Media's payload copy: not implemented; issue ei-03 fills it.
   */
  redact: notImplemented,
  /**
   * Media's render function: not implemented; issue ei-03 fills it.
   */
  render: notImplemented,
  /**
   * The value Media shows for a stored response: not implemented; issue ei-03 fills it.
   */
  restore: notImplemented,
  /**
   * The order Media's choices were presented in: not implemented; issue ei-03 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Media shows for the correct response: not implemented; issue ei-03 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Media's Controls: not implemented; issue ei-03 fills it.
   */
  unnamed: notImplemented,
  /**
   * Media's response validation: not implemented; issue ei-03 fills it.
   */
  validate: notImplemented,
};
