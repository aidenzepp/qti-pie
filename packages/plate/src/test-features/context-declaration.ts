/**
 * Context Declarations (I-15), a stub module: the test model dispatches each
 * `qti-context-declaration` to its `parse`, which records the mark `qti-context-declaration` the
 * model records for every test feature it does not deliver, and its hooks have no effect, so the
 * verdict, the sequence and the HTML stay what they were. Issue m3f-08 fills the module, and with
 * it the host's {@link QtiContext}, the values of the built-in `QTI_CONTEXT` a session resolves
 * before any processing runs.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The values a host supplies for the built-in `QTI_CONTEXT`, which template and response
 * processing read through a `qti-context-declaration`: who sits the test, which test, and where.
 * Each is optional, since a host may know none of them. A stub type: issue m3f-08 reads it into
 * the session, and no function takes it yet.
 */
export interface QtiContext {
  /**
   * The candidate's identifier, `QTI_CONTEXT.candidateIdentifier`.
   */
  readonly candidateIdentifier?: string;
  /**
   * The delivery environment's identifier, `QTI_CONTEXT.environmentIdentifier`.
   */
  readonly environmentIdentifier?: string;
  /**
   * The test's identifier as the host names it, `QTI_CONTEXT.testIdentifier`.
   */
  readonly testIdentifier?: string;
}

/**
 * The Context Declarations module, a stub until issue m3f-08 lands it.
 */
export const contextDeclarationModule: TestFeatureModule<"qti-context-declaration", never> = stub({
  element: "qti-context-declaration",
  feature: ["I-15"],
  issue: "m3f-08",
  key: "qti-context-declaration",
  namespace: qtiNamespace,
});
