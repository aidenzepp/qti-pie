/**
 * End Attempt (Q-4), a stub module: its `parse` gives the notice the body walk gives any QTI
 * element it does not read, so a `qti-end-attempt-interaction` renders as it did, and every other
 * step throws {@link NotImplemented}. No hub reaches those: the model holds no node of this kind.
 * Issue ei-02 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { EndAttemptInteraction } from "#plate/model/item.ts";

/**
 * The owner of every End Attempt part in the part table.
 */
const owner = "end-attempt-interaction";

/**
 * End Attempt's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-4";

/**
 * The QTI element End Attempt is read from, which its notice names.
 */
const element = "qti-end-attempt-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming End Attempt's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The End Attempt module, a stub.
 */
export const endAttemptModule: InteractionModule<"end-attempt", EndAttemptInteraction, never> = {
  /**
   * The responses End Attempt binds, which `postings` reads: not implemented; issue ei-02 fills it.
   */
  bindings: notImplemented,
  /**
   * End Attempt's connect function: not implemented; issue ei-02 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls End Attempt renders: not implemented; issue ei-02 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-02 lands it.
   */
  implemented: false,
  kind: "end-attempt",
  /**
   * The NULL of End Attempt's own binding: not implemented; issue ei-02 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-end-attempt-interaction`, as the body walk gives any QTI element it does
   * not read, so the verdict and the HTML stay what they were until issue ei-02 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-02 adds End Attempt's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming End Attempt's feature, as the codec refused it
   * before: the model holds no node of it until issue ei-02 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "end-attempt" }),
  /**
   * End Attempt's payload copy: not implemented; issue ei-02 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * End Attempt's render function: not implemented; issue ei-02 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value End Attempt shows for a stored response: not implemented; issue ei-02 fills it.
   */
  restore: notImplemented,
  /**
   * The order End Attempt's choices were presented in: not implemented; issue ei-02 fills it.
   */
  sequence: notImplemented,
  /**
   * The value End Attempt shows for the correct response: not implemented; issue ei-02 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names End Attempt's Controls: not implemented; issue ei-02 fills it.
   */
  unnamed: notImplemented,
  /**
   * End Attempt's response validation: not implemented; issue ei-02 fills it.
   */
  validate: notImplemented,
};
