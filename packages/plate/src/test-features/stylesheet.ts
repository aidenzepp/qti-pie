/**
 * Test-level Stylesheet (T-3), a stub module: the test model dispatches each `qti-stylesheet` to
 * its `parse`, which records the mark `qti-stylesheet` the model records for every test feature it
 * does not deliver, and its hooks have no effect, so the verdict, the sequence and the HTML stay
 * what they were. Issue m5-06 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Test-level Stylesheet module, a stub until issue m5-06 lands it.
 */
export const stylesheetModule: TestFeatureModule<"qti-stylesheet", never> = stub({
  element: "qti-stylesheet",
  feature: ["T-3"],
  issue: "m5-06",
  key: "qti-stylesheet",
  namespace: qtiNamespace,
});
