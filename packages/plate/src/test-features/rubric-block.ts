/**
 * Test-level Rubric Block (S-5, T-13), a stub module: the test model dispatches each
 * `qti-rubric-block` to its `parse`, which records the mark `qti-rubric-block` the model records
 * for every test feature it does not deliver, and its hooks have no effect, so the verdict, the
 * sequence and the HTML stay what they were. Issue m3e-01 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Test-level Rubric Block module, a stub until issue m3e-01 lands it.
 */
export const rubricBlockModule: TestFeatureModule<"qti-rubric-block", never> = stub({
  element: "qti-rubric-block",
  feature: ["S-5", "T-13"],
  issue: "m3e-01",
  key: "qti-rubric-block",
  namespace: qtiNamespace,
});
