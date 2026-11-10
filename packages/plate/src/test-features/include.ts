/**
 * Include (I-12, S-6), a stub module for XInclude's `include`: the test model dispatches each
 * `xi:include` to its `parse`, which records the mark `xi:include`, and its hooks have no effect.
 * No accepted test reaches it today: a document holding an include is left unchecked (E23) before
 * the model is built, so the module stands for the mark spec §4.6 lists and for the decision issue
 * m3f-06 delivers: perform each package-local include at `openPackage`, or keep the limit.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { xincludeNamespace } from "#plate/document/source.ts";

/**
 * The Include module, a stub until issue m3f-06 decides and lands it.
 */
export const includeModule: TestFeatureModule<"xi:include", never> = stub({
  element: "include",
  feature: ["I-12", "S-6"],
  issue: "m3f-06",
  key: "xi:include",
  namespace: xincludeNamespace,
});
