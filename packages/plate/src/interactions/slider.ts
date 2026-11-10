/**
 * Slider (Q-19), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-slider-interaction` renders as it did; its `payloadSchema` refuses the
 * kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue ei-16 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Slider part in the part table.
 */
const owner = "slider-interaction";

/**
 * Slider's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-19";

/**
 * The QTI element Slider is read from, which its notice names.
 */
const element = "qti-slider-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Slider's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Slider module, a stub.
 */
export const sliderModule: InteractionModule<"slider", ModuleInteraction<"slider">, never> = {
  /**
   * The responses Slider binds, which `postings` reads: not implemented; issue ei-16 fills it.
   */
  bindings: notImplemented,
  /**
   * Slider's connect function: not implemented; issue ei-16 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Slider renders: not implemented; issue ei-16 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-16 lands it.
   */
  implemented: false,
  kind: "slider",
  /**
   * The NULL of Slider's own binding: not implemented; issue ei-16 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-slider-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-16 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-16 adds Slider's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Slider's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-16 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "slider" }),
  /**
   * Slider's payload copy: not implemented; issue ei-16 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Slider's render function: not implemented; issue ei-16 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Slider shows for a stored response: not implemented; issue ei-16 fills it.
   */
  restore: notImplemented,
  /**
   * The order Slider's choices were presented in: not implemented; issue ei-16 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Slider shows for the correct response: not implemented; issue ei-16 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Slider's Controls: not implemented; issue ei-16 fills it.
   */
  unnamed: notImplemented,
  /**
   * Slider's response validation: not implemented; issue ei-16 fills it.
   */
  validate: notImplemented,
};
