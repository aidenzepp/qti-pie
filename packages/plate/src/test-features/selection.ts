/**
 * Selection (S-3), a stub module: the test model dispatches each `qti-selection` to its `parse`,
 * which records the mark `qti-selection` the model records for every test feature it does not
 * deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay what they
 * were. Issue m3f-02 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Selection module, a stub until issue m3f-02 lands it.
 */
export const selectionModule: TestFeatureModule<"qti-selection", never> = stub({
  element: "qti-selection",
  feature: ["S-3"],
  issue: "m3f-02",
  key: "qti-selection",
  namespace: qtiNamespace,
});
