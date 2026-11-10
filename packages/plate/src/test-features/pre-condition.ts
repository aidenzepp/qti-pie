/**
 * Pre-condition, a stub module: the test model dispatches each `qti-pre-condition` to its `parse`,
 * which records the mark `qti-pre-condition` the model records for every test feature it does not
 * deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay what they
 * were. Issue m5-05 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Pre-condition module, a stub until issue m5-05 lands it.
 */
export const preConditionModule: TestFeatureModule<"qti-pre-condition", never> = stub({
  element: "qti-pre-condition",
  feature: [],
  issue: "m5-05",
  key: "qti-pre-condition",
  namespace: qtiNamespace,
});
