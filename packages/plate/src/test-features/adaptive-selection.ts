/**
 * Adaptive Selection, a stub module: the test model dispatches each `qti-adaptive-selection` to its
 * `parse`, which records the mark `qti-adaptive-selection` the model records for every test feature
 * it does not deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay
 * what they were. No issue fills the module: adaptive selection (computerised adaptive testing) is
 * out of the fan-out's scope, so the feature stays marked and the module stands for its mark.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Adaptive Selection module, a stub that stays, since no issue fills it.
 */
export const adaptiveSelectionModule: TestFeatureModule<"qti-adaptive-selection", never> = stub({
  element: "qti-adaptive-selection",
  feature: [],
  issue: "none",
  key: "qti-adaptive-selection",
  namespace: qtiNamespace,
});
