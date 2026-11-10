/**
 * Test Feedback (T-8, T-10), a stub module: the test model dispatches each `qti-test-feedback` to
 * its `parse`, which records the mark `qti-test-feedback` the model records for every test feature
 * it does not deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay
 * what they were. Issue m5-04 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Test Feedback module, a stub until issue m5-04 lands it.
 */
export const testFeedbackModule: TestFeatureModule<"qti-test-feedback", never> = stub({
  element: "qti-test-feedback",
  feature: ["T-8", "T-10"],
  issue: "m5-04",
  key: "qti-test-feedback",
  namespace: qtiNamespace,
});
