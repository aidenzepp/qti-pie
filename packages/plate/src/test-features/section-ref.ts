/**
 * Section Reference (S-9, P-2), a stub module: the test model dispatches each
 * `qti-assessment-section-ref` to its `parse`, which records the mark `qti-assessment-section-ref`
 * the model records for every test feature it does not deliver, and its hooks have no effect, so
 * the verdict, the sequence and the HTML stay what they were. Issue m3f-03 fills the module.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Section Reference module, a stub until issue m3f-03 lands it.
 */
export const sectionRefModule: TestFeatureModule<"qti-assessment-section-ref", never> = stub({
  element: "qti-assessment-section-ref",
  feature: ["S-9", "P-2"],
  issue: "m3f-03",
  key: "qti-assessment-section-ref",
  namespace: qtiNamespace,
});
