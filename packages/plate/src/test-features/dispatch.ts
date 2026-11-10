/**
 * The delegations the hubs consult the test-feature table through, each the one site of its hub:
 * {@link featureAt} and {@link parseFeature} for the test model, {@link sequencedBy} for the
 * session's start, {@link gatedBy} for its moves and submissions, and {@link deliveredBy} for the
 * package. Each takes the table, so a test can hand one holding a module that has landed, and each
 * folds the modules in the table's order. This is a browser module, reached from the session: it
 * value-imports from `effect` only `Option`.
 *
 * @module
 */
import { Option } from "effect";
import type { SourceElement } from "#plate/document/source.ts";
import type { Test } from "#plate/model/test.ts";
import type {
  DeliveryContext,
  FeatureRefusal,
  GateContext,
  SequenceContext,
  SequencePlace,
  TestFeatureKey,
  TestFeatureModule,
} from "#plate/test-features/contract.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";

/**
 * What a gate decides for an intent: a feature's refusal, the sequence index a move reaches in a
 * feature's place of the modes' target, or nothing.
 */
export type Gated =
  | { readonly kind: "refused"; readonly refusal: FeatureRefusal }
  | { readonly kind: "target"; readonly sequenceIndex: number };

/**
 * Find the module whose element an element is, by namespace and local name.
 *
 * @param features The table.
 * @param element The element.
 * @returns The module, none when no module names the element.
 */
export const featureAt = (
  features: TestFeatureTable,
  element: SourceElement,
): Option.Option<TestFeatureModule<TestFeatureKey, unknown>> =>
  Option.fromUndefinedOr(
    features.find(
      (module) => module.namespace === element.namespace && module.element === element.local,
    ),
  );

/**
 * Give the places a session walks: each module's `sequence` over the places the one before it
 * gave, from the test's document order.
 *
 * @param features The table.
 * @param context The test, the places in document order, and the session's seed.
 * @returns The places, in the order the candidate meets them.
 */
export const sequencedBy = (
  features: TestFeatureTable,
  context: SequenceContext,
): readonly SequencePlace[] => {
  let { places } = context;
  for (const module of features) {
    places = module.sequence({ ...context, places });
  }

  return places;
};

/**
 * Ask each module, in order, what it does with an intent, and give the first answer: a refusal
 * under the module's key, or a move's target.
 *
 * @param features The table.
 * @param context The intent, the session, the test, and the time where the hub has one.
 * @returns The first module's answer, none when every module lets the intent through.
 */
export const gatedBy = (features: TestFeatureTable, context: GateContext): Option.Option<Gated> => {
  for (const module of features) {
    const verdict = module.gate(context);
    if (Option.isSome(verdict)) {
      return Option.some(
        verdict.value.kind === "refuse"
          ? {
              kind: "refused",
              refusal: {
                detail: verdict.value.detail,
                feature: module.key,
                rule: verdict.value.rule,
              },
            }
          : verdict.value,
      );
    }
  }

  return Option.none();
};

/**
 * Give the test a package delivers: each module's `deliver` over the test the one before it gave.
 *
 * @param features The table.
 * @param context The test as delivered so far, its document, and the package's documents.
 * @returns The test to deliver.
 */
export const deliveredBy = (features: TestFeatureTable, context: DeliveryContext): Test => {
  let { test } = context;
  for (const module of features) {
    test = module.deliver({ ...context, test });
  }

  return test;
};
