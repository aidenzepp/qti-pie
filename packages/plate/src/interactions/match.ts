/**
 * Match (Q-13), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-match-interaction` renders as it did, and every other step throws
 * {@link NotImplemented}. No hub reaches those: the model holds no node of this kind. Issue m3d-11
 * fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { MatchInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Match part in the part table.
 */
const owner = "match-interaction";

/**
 * Match's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-13";

/**
 * The QTI element Match is read from, which its notice names.
 */
const element = "qti-match-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Match's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Match module, a stub.
 */
export const matchModule: InteractionModule<"match", MatchInteraction, never> = {
  /**
   * The responses Match binds, which `postings` reads: not implemented; issue m3d-11 fills it.
   */
  bindings: notImplemented,
  /**
   * Match's connect function: not implemented; issue m3d-11 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Match renders: not implemented; issue m3d-11 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue m3d-11 lands it.
   */
  implemented: false,
  kind: "match",
  /**
   * The NULL of Match's own binding: not implemented; issue m3d-11 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-match-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue m3d-11 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue m3d-11 adds Match's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Match's feature, as the codec refused it before:
   * the model holds no node of it until issue m3d-11 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "match" }),
  /**
   * Match's payload copy: not implemented; issue m3d-11 fills it.
   */
  redact: notImplemented,
  /**
   * Match's render function: not implemented; issue m3d-11 fills it.
   */
  render: notImplemented,
  /**
   * The value Match shows for a stored response: not implemented; issue m3d-11 fills it.
   */
  restore: notImplemented,
  /**
   * The order Match's choices were presented in: not implemented; issue m3d-11 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Match shows for the correct response: not implemented; issue m3d-11 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Match's Controls: not implemented; issue m3d-11 fills it.
   */
  unnamed: notImplemented,
  /**
   * Match's response validation: not implemented; issue m3d-11 fills it.
   */
  validate: notImplemented,
};
