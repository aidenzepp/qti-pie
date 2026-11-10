/**
 * Upload (Q-21), a stub module: its `parse` gives the notice the body walk gives any QTI element it
 * does not read, so a `qti-upload-interaction` renders as it did, and every other step throws
 * {@link NotImplemented}. No hub reaches those: the model holds no node of this kind. Issue ei-01
 * fills the module.
 *
 * @module
 */
import { NotImplemented } from "#plate/interactions/contract.ts";
import type { InteractionModule } from "#plate/interactions/contract.ts";
import type { UploadInteraction } from "#plate/model/item.ts";

/**
 * The owner of every Upload part in the part table.
 */
const owner = "upload-interaction";

/**
 * Upload's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-21";

/**
 * The QTI element Upload is read from, which its notice names.
 */
const element = "qti-upload-interaction";

/**
 * Throw for a step the stub does not implement.
 *
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming Upload's feature.
 */
const notImplemented = (): never => {
  throw new NotImplemented({ feature });
};

/**
 * The Upload module, a stub.
 */
export const uploadModule: InteractionModule<"upload", UploadInteraction, never> = {
  /**
   * The responses Upload binds, which `postings` reads: not implemented; issue ei-01 fills it.
   */
  bindings: notImplemented,
  /**
   * Upload's connect function: not implemented; issue ei-01 fills it.
   */
  connect: notImplemented,
  /**
   * How many Controls Upload renders: not implemented; issue ei-01 fills it.
   */
  controls: notImplemented,
  element,
  feature,
  /**
   * False: the module is a stub until issue ei-01 lands it.
   */
  implemented: false,
  kind: "upload",
  /**
   * The NULL of Upload's own binding: not implemented; issue ei-01 fills it.
   */
  nullValue: notImplemented,
  owner,
  /**
   * Give the notice `qti-upload-interaction`, as the body walk gives any QTI element it does not
   * read, so the verdict and the HTML stay what they were until issue ei-01 reads the element.
   */
  parse: (_source, context) => context.notice(element),
  /**
   * No row: issue ei-01 adds Upload's parts.
   */
  parts: {},
  /**
   * Refuse the kind in a redacted body, naming Upload's feature, as the codec refused it before:
   * the model holds no node of it until issue ei-01 reads the element.
   */
  payloadSchema: ({ unimplemented }) => unimplemented({ element, feature, kind: "upload" }),
  /**
   * Upload's payload copy: not implemented; issue ei-01 fills it.
   */
  redact: notImplemented,
  /**
   * Upload's render function: not implemented; issue ei-01 fills it.
   */
  render: notImplemented,
  /**
   * The value Upload shows for a stored response: not implemented; issue ei-01 fills it.
   */
  restore: notImplemented,
  /**
   * The order Upload's choices were presented in: not implemented; issue ei-01 fills it.
   */
  sequence: notImplemented,
  /**
   * The value Upload shows for the correct response: not implemented; issue ei-01 fills it.
   */
  solution: notImplemented,
  /**
   * Whether the renderer names Upload's Controls: not implemented; issue ei-01 fills it.
   */
  unnamed: notImplemented,
  /**
   * Upload's response validation: not implemented; issue ei-01 fills it.
   */
  validate: notImplemented,
};
