/**
 * Hotspot (Q-10), a stub module: its `parse` gives the notice the body walk gives any QTI element
 * it does not read, so a `qti-hotspot-interaction` renders as it did; its `payloadSchema` refuses
 * the kind, its `content`, `regions` and `replaceRegions` give no content, no region and the node
 * itself, and every other step throws {@link NotImplemented}. No hub reaches those: the model holds
 * no node of this kind. Issue m3d-07 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule, ModuleInteraction } from "#plate/interactions/contract.ts";

/**
 * The owner of every Hotspot part in the part table.
 */
const owner = "hotspot-interaction";

/**
 * Hotspot's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-10";

/**
 * The QTI element Hotspot is read from, which its notice names.
 */
const element = "qti-hotspot-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Hotspot's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Hotspot module, a stub.
 */
export const hotspotModule: InteractionModule<"hotspot", ModuleInteraction<"hotspot">, never> = {
  /**
   * The responses Hotspot binds, which `postings` reads: not implemented; issue m3d-07 fills it.
   */
  bindings: notImplemented,
  /**
   * Hotspot's connect function: not implemented; issue m3d-07 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Hotspot renders: not implemented; issue m3d-07 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue m3d-07 lands it.
   */
  implemented: false,
  kind: "hotspot",
  /**
   * The NULL of Hotspot's own binding: not implemented; issue m3d-07 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-hotspot-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue m3d-07 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue m3d-07 adds Hotspot's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Hotspot's feature, as the codec refused it before:
   * the model holds no node of it until issue m3d-07 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "hotspot" }),
  /**
   * Hotspot's payload copy: not implemented; issue m3d-07 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Hotspot's render function: not implemented; issue m3d-07 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Hotspot shows for a stored response: not implemented; issue m3d-07 fills it.
   */
  restore: notImplemented,
  /**
   * The order Hotspot's choices were presented in: not implemented; issue m3d-07 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Hotspot shows for the correct response: not implemented; issue m3d-07 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Hotspot's Controls: not implemented; issue m3d-07 fills it.
   */
  unnamed: notImplemented,
  /**
   * Hotspot's response validation: not implemented; issue m3d-07 fills it.
   */
  validate: notImplemented,
};
