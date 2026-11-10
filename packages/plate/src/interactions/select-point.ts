/**
 * Select Point (Q-18), a stub module: its `parse` gives the notice the body walk gives any QTI
 * element it does not read, so a `qti-select-point-interaction` renders as it did, and every other
 * step throws {@link NotImplemented}. No hub reaches those: the model holds no node of this kind.
 * Issue ei-14 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { SelectPointInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Select Point part in the part table.
 */
const owner = "select-point-interaction";

/**
 * Select Point's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-18";

/**
 * The QTI element Select Point is read from, which its notice names.
 */
const element = "qti-select-point-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Select Point's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Select Point module, a stub.
 */
export const selectPointModule: InteractionModule<"select-point", SelectPointInteraction, never> = {
  /**
   * The responses Select Point binds, which `postings` reads: not implemented; issue ei-14 fills
   * it.
   */
  bindings: notImplemented,
  /**
   * Select Point's connect function: not implemented; issue ei-14 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Select Point renders: not implemented; issue ei-14 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-14 lands it.
   */
  implemented: false,
  kind: "select-point",
  /**
   * The NULL of Select Point's own binding: not implemented; issue ei-14 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-select-point-interaction`, as the body walk gives any QTI element it does
   * not read, so the verdict and the HTML stay what they were until issue ei-14 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-14 adds Select Point's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Select Point's feature, as the codec refused it
   * before: the model holds no node of it until issue ei-14 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "select-point" }),
  /**
   * Select Point's payload copy: not implemented; issue ei-14 fills it.
   */
  redact: notImplemented,
  /**
   * Select Point's render function: not implemented; issue ei-14 fills it.
   */
  render: notImplemented,
  /**
   * The value Select Point shows for a stored response: not implemented; issue ei-14 fills it.
   */
  restore: notImplemented,
  /**
   * The order Select Point's choices were presented in: not implemented; issue ei-14 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Select Point shows for the correct response: not implemented; issue ei-14 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Select Point's Controls: not implemented; issue ei-14 fills it.
   */
  unnamed: notImplemented,
  /**
   * Select Point's response validation: not implemented; issue ei-14 fills it.
   */
  validate: notImplemented,
};
