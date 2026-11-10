/**
 * Ordering (S-4), a stub module: the test model dispatches each `qti-ordering` to its `parse`,
 * which records the mark `qti-ordering` the model records for every test feature it does not
 * deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay what they
 * were. Issue m3f-02 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Ordering module, a stub until issue m3f-02 lands it.
 */
export const orderingModule: TestFeatureModule<"qti-ordering", never> = stub({
  element: "qti-ordering",
  feature: ["S-4"],
  issue: "m3f-02",
  key: "qti-ordering",
  namespace: qtiNamespace,
});
