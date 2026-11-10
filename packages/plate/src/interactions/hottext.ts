/**
 * Hot Text (Q-11), a stub module: its `parse` gives the notice the body walk gives any QTI element
 * it does not read, so a `qti-hottext-interaction` renders as it did; its `payloadSchema` refuses
 * the kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue m3d-09 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { HottextInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Hot Text part in the part table.
 */
const owner = "hottext-interaction";

/**
 * Hot Text's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-11";

/**
 * The QTI element Hot Text is read from, which its notice names.
 */
const element = "qti-hottext-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Hot Text's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Hot Text module, a stub.
 */
export const hottextModule: InteractionModule<"hottext", HottextInteraction, never> = {
  /**
   * The responses Hot Text binds, which `postings` reads: not implemented; issue m3d-09 fills it.
   */
  bindings: notImplemented,
  /**
   * Hot Text's connect function: not implemented; issue m3d-09 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Hot Text renders: not implemented; issue m3d-09 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue m3d-09 lands it.
   */
  implemented: false,
  kind: "hottext",
  /**
   * The NULL of Hot Text's own binding: not implemented; issue m3d-09 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-hottext-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue m3d-09 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue m3d-09 adds Hot Text's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Hot Text's feature, as the codec refused it before:
   * the model holds no node of it until issue m3d-09 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "hottext" }),
  /**
   * Hot Text's payload copy: not implemented; issue m3d-09 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Hot Text's render function: not implemented; issue m3d-09 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Hot Text shows for a stored response: not implemented; issue m3d-09 fills it.
   */
  restore: notImplemented,
  /**
   * The order Hot Text's choices were presented in: not implemented; issue m3d-09 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Hot Text shows for the correct response: not implemented; issue m3d-09 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Hot Text's Controls: not implemented; issue m3d-09 fills it.
   */
  unnamed: notImplemented,
  /**
   * Hot Text's response validation: not implemented; issue m3d-09 fills it.
   */
  validate: notImplemented,
};
