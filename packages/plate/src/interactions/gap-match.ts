/**
 * Gap Match (Q-6), a stub module: its `parse` gives the notice the body walk gives any QTI element
 * it does not read, so a `qti-gap-match-interaction` renders as it did; its `payloadSchema` refuses
 * the kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue m3d-03 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Gap Match part in the part table.
 */
const owner = "gap-match-interaction";

/**
 * Gap Match's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-6";

/**
 * The QTI element Gap Match is read from, which its notice names.
 */
const element = "qti-gap-match-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Gap Match's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Gap Match module, a stub.
 */
export const gapMatchModule: InteractionModule<
  "gap-match",
  ModuleInteraction<"gap-match">,
  never
> = {
  /**
   * The responses Gap Match binds, which `postings` reads: not implemented; issue m3d-03 fills it.
   */
  bindings: notImplemented,
  /**
   * Gap Match's connect function: not implemented; issue m3d-03 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Gap Match renders: not implemented; issue m3d-03 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue m3d-03 lands it.
   */
  implemented: false,
  kind: "gap-match",
  /**
   * The NULL of Gap Match's own binding: not implemented; issue m3d-03 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-gap-match-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue m3d-03 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue m3d-03 adds Gap Match's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Gap Match's feature, as the codec refused it before:
   * the model holds no node of it until issue m3d-03 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "gap-match" }),
  /**
   * Gap Match's payload copy: not implemented; issue m3d-03 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Gap Match's render function: not implemented; issue m3d-03 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Gap Match shows for a stored response: not implemented; issue m3d-03 fills it.
   */
  restore: notImplemented,
  /**
   * The order Gap Match's choices were presented in: not implemented; issue m3d-03 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Gap Match shows for the correct response: not implemented; issue m3d-03 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Gap Match's Controls: not implemented; issue m3d-03 fills it.
   */
  unnamed: notImplemented,
  /**
   * Gap Match's response validation: not implemented; issue m3d-03 fills it.
   */
  validate: notImplemented,
};
