/**
 * Include (I-12, S-6), a stub module for XInclude's `include`: the test model dispatches each
 * `xi:include` to its `parse`, which records the mark `xi:include`, and its hooks have no effect.
 * No accepted test reaches it: `openPackage` performs each package-local include before the model
 * is built (`#plate/package/include.ts`; issue m3f-06), so a delivered test holds no include, and a
 * test opened alone through `open`, which has no package to resolve one against, is left unchecked
 * (E23) before the model is built. The module stands for the mark spec §4.6 lists.
 *
 * @module
 */
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { xincludeNamespace } from "#plate/document/source.ts";

/**
 * The Include module, a stub: the package performs includes before the model is built (issue
 * m3f-06), so no test the model reads holds one.
 */
export const includeModule: TestFeatureModule<"xi:include", never> = stub({
  element: "include",
  feature: ["I-12", "S-6"],
  issue: "m3f-06",
  key: "xi:include",
  namespace: xincludeNamespace,
});
