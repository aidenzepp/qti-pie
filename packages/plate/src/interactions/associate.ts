/**
 * Associate (Q-1), a stub module: its `parse` gives the notice the body walk gives any QTI element
 * it does not read, so a `qti-associate-interaction` renders as it did, and every other step throws
 * {@link NotImplemented}. No hub reaches those: the model holds no node of this kind. Issue ei-04
 * fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { AssociateInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Associate part in the part table.
 */
const owner = "associate-interaction";

/**
 * Associate's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-1";

/**
 * The QTI element Associate is read from, which its notice names.
 */
const element = "qti-associate-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Associate's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Associate module, a stub.
 */
export const associateModule: InteractionModule<"associate", AssociateInteraction, never> = {
  /**
   * The responses Associate binds, which `postings` reads: not implemented; issue ei-04 fills it.
   */
  bindings: notImplemented,
  /**
   * Associate's connect function: not implemented; issue ei-04 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Associate renders: not implemented; issue ei-04 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-04 lands it.
   */
  implemented: false,
  kind: "associate",
  /**
   * The NULL of Associate's own binding: not implemented; issue ei-04 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-associate-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-04 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-04 adds Associate's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Associate's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-04 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "associate" }),
  /**
   * Associate's payload copy: not implemented; issue ei-04 fills it.
   */
  redact: notImplemented,
  /**
   * Associate's render function: not implemented; issue ei-04 fills it.
   */
  render: notImplemented,
  /**
   * The value Associate shows for a stored response: not implemented; issue ei-04 fills it.
   */
  restore: notImplemented,
  /**
   * The order Associate's choices were presented in: not implemented; issue ei-04 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Associate shows for the correct response: not implemented; issue ei-04 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Associate's Controls: not implemented; issue ei-04 fills it.
   */
  unnamed: notImplemented,
  /**
   * Associate's response validation: not implemented; issue ei-04 fills it.
   */
  validate: notImplemented,
};
