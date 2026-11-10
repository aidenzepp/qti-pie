/**
 * The table of test-feature modules, one per {@link TestFeatureKey}, in `testMarks`' order: what
 * the test model, the session and the package consult, and what `testMarks` derives its element
 * keys from. A key with no module, or a module under another key, fails to compile.
 *
 * @module
 */
import { adaptiveSelectionModule } from "#plate/test-features/adaptive-selection.ts";
import { branchRuleModule } from "#plate/test-features/branch-rule.ts";
import { contextDeclarationModule } from "#plate/test-features/context-declaration.ts";
import { testFeatureKeys } from "#plate/test-features/contract.ts";
import type { TestFeatureKey, TestFeatureModule } from "#plate/test-features/contract.ts";
import { includeModule } from "#plate/test-features/include.ts";
import { orderingModule } from "#plate/test-features/ordering.ts";
import { preConditionModule } from "#plate/test-features/pre-condition.ts";
import { rubricBlockModule } from "#plate/test-features/rubric-block.ts";
import { sectionRefModule } from "#plate/test-features/section-ref.ts";
import { selectionModule } from "#plate/test-features/selection.ts";
import { stylesheetModule } from "#plate/test-features/stylesheet.ts";
import { testFeedbackModule } from "#plate/test-features/test-feedback.ts";
import { timeLimitsModule } from "#plate/test-features/time-limits.ts";

/**
 * Each module by its key, so a key and its module cannot drift.
 */
const byKey = {
  "qti-adaptive-selection": adaptiveSelectionModule,
  "qti-assessment-section-ref": sectionRefModule,
  "qti-branch-rule": branchRuleModule,
  "qti-context-declaration": contextDeclarationModule,
  "qti-ordering": orderingModule,
  "qti-pre-condition": preConditionModule,
  "qti-rubric-block": rubricBlockModule,
  "qti-selection": selectionModule,
  "qti-stylesheet": stylesheetModule,
  "qti-test-feedback": testFeedbackModule,
  "qti-time-limits": timeLimitsModule,
  "xi:include": includeModule,
} as const satisfies { readonly [K in TestFeatureKey]: TestFeatureModule<K, unknown> };

/**
 * One of the test-feature modules.
 */
export type AnyTestFeature = (typeof byKey)[TestFeatureKey];

/**
 * A table of test-feature modules, as the hubs take one: `testFeatures` by default, or, in a test,
 * one holding a module that has landed, whose node type the hubs read erased.
 */
export type TestFeatureTable = readonly TestFeatureModule<TestFeatureKey, unknown>[];

/**
 * The test-feature modules, in `testMarks`' order.
 */
export const testFeatures: readonly AnyTestFeature[] = testFeatureKeys.map((key) => byKey[key]);

export { testFeatureKeys } from "#plate/test-features/contract.ts";
