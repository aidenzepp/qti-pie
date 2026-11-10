import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import { startTest } from "#plate/session/start.ts";
import type { TestSession } from "#plate/session/session.ts";
import { stub } from "#plate/test-features/contract.ts";
import type {
  EnterContext,
  EnterVerdict,
  PresentContext,
  TestFeatureKey,
  TestFeatureModule,
} from "#plate/test-features/contract.ts";
import { enteredBy, presentedBy } from "#plate/test-features/dispatch.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * Write a hand-built item: one Choice bound to `RESPONSE`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  `<qti-assessment-item xmlns="${qtiNamespace}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * The two-item test the session below walks.
 */
const testXml = `<qti-assessment-test xmlns="${qtiNamespace}" identifier="t" title="T"><qti-test-part identifier="P1" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S1" title="S" visible="true"><qti-assessment-item-ref identifier="i1" href="i1.xml"/><qti-assessment-item-ref identifier="i2" href="i2.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Construct the context a hub hands `enter` for the second place of a session.
 *
 * @param items The accepted items.
 * @param session The session.
 * @param test The test.
 * @returns The context.
 */
const enterContextOf = (
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  test: AcceptedTest,
): EnterContext => ({
  items: Option.some(items),
  now: Option.none(),
  sequenceIndex: 2,
  session,
  test: test.test,
});

/**
 * Open the two-item test and its items, and start a session of it.
 */
const startedSession = Effect.gen(function* startSession() {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/t.xml", encoder.encode(testXml));
  const test: AcceptedTest =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict}`);
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2"]) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(itemXml(ref)));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  const configuration = yield* configure({});
  const session: TestSession = Result.getOrElse(
    startTest(test, items, configuration, { instance: "sitting", now: new Date(0) }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

  return { context: enterContextOf(items, session, test), items, session, test };
});

/**
 * Give the table of stubs with the pre-condition stub's `enter` replaced by an answer.
 *
 * @param answer What the module answers.
 * @returns The table.
 */
const answering = (answer: Option.Option<EnterVerdict>): TestFeatureTable =>
  testFeatures.map((module) =>
    module.key === "qti-pre-condition"
      ? {
          ...stub({
            element: module.element,
            feature: module.feature,
            issue: module.issue,
            key: module.key,
            namespace: module.namespace,
          }),
          enter: () => answer,
          implemented: true,
        }
      : module,
  );

describe("enteredBy", () => {
  it.effect(
    "[W0-BE] enteredBy folds the first module's answer: none then skip gives skip; none everywhere gives none",
    () =>
      Effect.gen(function* folds() {
        const { context } = yield* startedSession;
        const skipping: TestFeatureTable = answering(Option.some({ kind: "skip" }));
        const silent: TestFeatureTable = answering(Option.none());

        assert.deepStrictEqual(enteredBy(skipping, context), Option.some({ kind: "skip" }));
        assert.deepStrictEqual(enteredBy(silent, context), Option.none());
        assert.deepStrictEqual(
          enteredBy(
            [
              ...answering(Option.some({ kind: "skip" })),
              ...answering(
                Option.some({ kind: "exit", scope: { identifier: "S1", kind: "section" } }),
              ),
            ],
            context,
          ),
          Option.some({ kind: "skip" }),
        );
      }),
  );

  it.effect("[W0-BE] every stub lets every place be entered: the default table answers none", () =>
    Effect.gen(function* stubsEnter() {
      const { context } = yield* startedSession;
      for (const module of testFeatures) {
        assert.deepStrictEqual(module.enter(context), Option.none(), module.key);
      }

      assert.deepStrictEqual(enteredBy(testFeatures, context), Option.none());
    }),
  );
});

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
