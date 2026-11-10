/**
 * Branch Rule, a stub module: the test model dispatches each `qti-branch-rule` to its `parse`,
 * which records the mark `qti-branch-rule` the model records for every test feature it does not
 * deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay what they
 * were. Issue m5-05 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Branch Rule module, a stub until issue m5-05 lands it.
 */
export const branchRuleModule: TestFeatureModule<"qti-branch-rule", never> = stub({
  element: "qti-branch-rule",
  feature: [],
  issue: "m5-05",
  key: "qti-branch-rule",
  namespace: qtiNamespace,
});
