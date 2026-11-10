import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { stub } from "#plate/test-features/contract.ts";
import type {
  PresentContext,
  TestFeatureKey,
  TestFeatureModule,
} from "#plate/test-features/contract.ts";
import { presentedBy } from "#plate/test-features/dispatch.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The node the fakes below present: a label that names the fake.
 */
interface LabelNode {
  readonly label: string;
}

/**
 * Build a module as it would land, for this test alone: it presents the labels it is given at every
 * place, and renders each as a paragraph.
 *
 * @param key The module's key.
 * @param labels The labels it presents, in order.
 * @returns The module.
 */
const presenting = (
  key: TestFeatureKey,
  labels: readonly string[],
): TestFeatureModule<TestFeatureKey, LabelNode> => ({
  ...stub({ element: key, feature: [], issue: "test", key, namespace: qtiNamespace }),
  implemented: true,
  present: () => labels.map((label) => ({ label })),
  render: (node) => Result.succeed(h("p", { id: node.label })),
});

/**
 * The table of stubs built from the default table's declarations, then each given module in its own
 * stub's place, whatever the default table holds.
 *
 * @param modules The modules.
 * @returns The table.
 */
const tableWith = (
  ...modules: readonly TestFeatureModule<TestFeatureKey, LabelNode>[]
): TestFeatureTable =>
  testFeatures.map(
    (feature) =>
      modules.find(({ key }) => key === feature.key) ??
      stub({
        element: feature.element,
        feature: feature.feature,
        issue: feature.issue,
        key: feature.key,
        namespace: feature.namespace,
      }),
  );

/**
 * Open a one-item test and start its session, and read the context a read of the summary hands a
 * module.
 */
const summaryContext = Effect.gen(function* summaryContextOf() {
  const encoder = new TextEncoder();
  const verdict = yield* open(
    "tests/t.xml",
    encoder.encode(
      `<qti-assessment-test xmlns="${qtiNamespace}" identifier="t" title="T"><qti-test-part identifier="P1" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S1" title="S" visible="true"><qti-assessment-item-ref identifier="i1" href="i1.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
    ),
  );
  const test: AcceptedTest =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict}`);
  const opened = yield* open(
    "tests/i1.xml",
    encoder.encode(
      `<qti-assessment-item xmlns="${qtiNamespace}" identifier="i1" title="i1" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`,
    ),
  );
  const items = new Map<string, Accepted>([
    ["i1", Option.getOrElse(acceptedItem(opened), () => assert.fail(`i1 is ${opened.verdict}`))],
  ]);
  const session: TestSession = Result.getOrElse(
    startTest(test, items, yield* configure({}), { instance: "sitting", now: new Date(0) }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );
  const context: PresentContext = { place: { kind: "summary" }, session, test: test.test };

  return context;
});

describe("the content the test-feature table presents", () => {
  it.effect("[W0-BF] presentedBy gives every module's nodes in table order", () =>
    Effect.gen(function* inTableOrder() {
      const context = yield* summaryContext;
      const rubric = presenting("qti-rubric-block", ["rubric"]);
      const feedback = presenting("qti-test-feedback", ["feedback"]);

      assert.deepStrictEqual(presentedBy(tableWith(), context), []);
      assert.deepStrictEqual(presentedBy(tableWith(feedback, rubric), context), [
        { key: "qti-rubric-block", node: { label: "rubric" } },
        { key: "qti-test-feedback", node: { label: "feedback" } },
      ]);
    }),
  );
});
