/**
 * Section Reference (S-9, P-2), a stub module: the test model dispatches each
 * `qti-assessment-section-ref` to its `parse`, which records the mark `qti-assessment-section-ref`
 * the model records for every test feature it does not deliver, and its hooks have no effect.
 *
 * The package, not this module, delivers a section ref (issue m3f-03): `openPackage` assembles each
 * test's document from the section documents its section refs place, replacing each ref by the
 * root section of the document it names, recursively and in place (`#plate/package/assemble.ts`),
 * and builds the delivered test from that assembled document, so the placed sections' items are
 * the test's own and no ref is left for this module to mark. A test opened alone through `open`
 * has no package to place a section document from, so its section refs stay marked by this stub
 * and nothing is placed.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The Section Reference module, a stub: it marks a section ref the package has not assembled, which
 * is every section ref of a test opened alone, and places nothing (S-9, P-2; issue m3f-03).
 */
export const sectionRefModule: TestFeatureModule<"qti-assessment-section-ref", never> = stub({
  element: "qti-assessment-section-ref",
  feature: ["S-9", "P-2"],
  issue: "m3f-03",
  key: "qti-assessment-section-ref",
  namespace: qtiNamespace,
});
