/**
 * Portable Custom Interaction (Q-16), a stub module: its `parse` gives the notice the body walk
 * gives any QTI element it does not read, so a `qti-portable-custom-interaction` renders as it did,
 * and every other step throws {@link NotImplemented}. No hub reaches those: the model holds no node
 * of this kind. Issue pci-03 fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { PortableCustomInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Portable Custom Interaction part in the part table.
 */
const owner = "portable-custom-interaction";

/**
 * Portable Custom Interaction's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-16";

/**
 * The QTI element Portable Custom Interaction is read from, which its notice names.
 */
const element = "qti-portable-custom-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Portable Custom Interaction's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Portable Custom Interaction module, a stub.
 */
export const portableCustomModule: InteractionModule<
  "portable-custom",
  PortableCustomInteraction,
  never
> = {
  /**
   * The responses Portable Custom Interaction binds, which `postings` reads: not implemented; issue
   * pci-03 fills it.
   */
  bindings: notImplemented,
  /**
   * Portable Custom Interaction's connect function: not implemented; issue pci-03 fills it.
   */
  connect: notImplemented,
  /**
   * No content: a stub has no payload node, so no hub asks.
   */
  content: () => [],
  /**
   * How many Controls Portable Custom Interaction renders: not implemented; issue pci-03 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue pci-03 lands it.
   */
  implemented: false,
  kind: "portable-custom",
  /**
   * The NULL of Portable Custom Interaction's own binding: not implemented; issue pci-03 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-portable-custom-interaction`, as the body walk gives any QTI element it
   * does not read, so the verdict and the HTML stay what they were until issue pci-03 reads the
   * element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue pci-03 adds Portable Custom Interaction's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Portable Custom Interaction's feature, as the codec
   * refused it before: the model holds no node of it until issue pci-03 reads the element.
   */
  payloadSchema: ({ unimplemented }) =>
    unimplemented({ element, feature, kind: "portable-custom" }),
  /**
   * Portable Custom Interaction's payload copy: not implemented; issue pci-03 fills it.
   */
  redact: notImplemented,
  /**
   * No region: the model holds no node of this kind until the module lands.
   */
  regions: () => [],
  /**
   * Portable Custom Interaction's render function: not implemented; issue pci-03 fills it.
   */
  render: notImplemented,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value Portable Custom Interaction shows for a stored response: not implemented; issue
   * pci-03 fills it.
   */
  restore: notImplemented,
  /**
   * The order Portable Custom Interaction's choices were presented in: not implemented; issue
   * pci-03 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Portable Custom Interaction shows for the correct response: not implemented; issue
   * pci-03 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Portable Custom Interaction's Controls: not implemented; issue
   * pci-03 fills it.
   */
  unnamed: notImplemented,
  /**
   * Portable Custom Interaction's response validation: not implemented; issue pci-03 fills it.
   */
  validate: notImplemented,
};
