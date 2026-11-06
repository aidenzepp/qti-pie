import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import type { Value } from "#plate/model/values.ts";
import { navigationState, PartlessTestDefect } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import { advance } from "#plate/session/advance.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Step, TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, acceptTestForTest } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The folder of the Beginner's Guide examples under the corpus root.
 */
const guide = "QTI3_BeginnersGuide_Examples";

/**
 * `BGtest.xml`'s six item refs in document order, each with its `href`.
 */
const guideRefs = [
  ["firstexample", "items/firstexample.xml"],
  ["beginnersguide007", "items/BG007.xml"],
  ["beginnersguide008", "items/BG008.xml"],
  ["beginnersguide009", "items/BG009.xml"],
  ["beginnersguide010", "items/BG010.xml"],
  ["beginnersguide011", "items/BG011.xml"],
] as const;

/**
 * The folder of the CASE package's test and items under the corpus root.
 */
const caseFolder = "qtiv3-examples/packaging/CASE/testitems";

/**
 * The CASE test's three item refs in document order, each with its `href`.
 */
const caseRefs = [
  ["res_-TX_G06SAMP_001", "-TX_G06SAMP_001.xml"],
  ["res_-TX_G06SAMP_004", "-TX_G06SAMP_004.xml"],
  ["res_-TX_G06SAMP_005", "-TX_G06SAMP_005.xml"],
] as const;

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * A single identifier value.
 *
 * @param identifier The identifier.
 * @returns The value.
 */
const chosen = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a document and require an accepted item.
 *
 * @param location The document's location, which `open` takes.
 * @param bytes The document's bytes.
 * @returns The accepted item.
 */
const openItem = Effect.fnUntraced(function* openItem(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Open a document and require an accepted test.
 *
 * @param location The document's location, which `open` takes.
 * @param bytes The document's bytes.
 * @returns The accepted test.
 */
const openTest = Effect.fnUntraced(function* openTest(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
    ? verdict.accepted
    : assert.fail(`${location} is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
});

/**
 * Open a test and its items from the corpus cache, each item keyed by its ref.
 *
 * @param folder The folder of the test and its items under the corpus root.
 * @param testHref The test's location in the folder.
 * @param refs Each item ref with its `href` in the folder.
 * @returns The test and its items.
 */
const corpusDelivery = Effect.fnUntraced(function* corpusDelivery(
  folder: string,
  testHref: string,
  refs: readonly (readonly [string, string])[],
) {
  const testLocation = `${folder}/${testHref}`;
  const test = yield* openTest(testLocation, yield* readCorpusFile(testLocation));
  const items = new Map<string, Accepted>();
  for (const [ref, href] of refs) {
    const location = `${folder}/${href}`;
    items.set(ref, yield* openItem(location, yield* readCorpusFile(location)));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Start a session of a delivery and take some steps through `advance`, failing the test when one
 * is refused.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param steps The steps, in order.
 * @returns The session after the last.
 */
const sessionAfter = (
  given: Delivery,
  configuration: Configuration,
  steps: readonly Step[],
): TestSession => {
  let session = Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance: "sitting", now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );
  for (const [index, step] of steps.entries()) {
    session = Result.getOrElse(
      advance(given.test, given.items, session, step, configuration, { now: after(index + 1) }),
      (failure) => assert.fail(`advance refused ${encodeIntent(step.intent)}: ${failure.message}`),
    );
  }

  return session;
};

/**
 * Give a session's navigation, failing the test when it fails.
 *
 * @param test The test.
 * @param session The session.
 * @returns The navigation.
 */
const stateOf = (test: AcceptedTest, session: TestSession): NavigationState =>
  Result.getOrElse(navigationState(test, session), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

/**
 * Give each item of a navigation as its sequence index, state and whether it is current.
 *
 * @param state The navigation.
 * @returns The items, in order.
 */
const itemsOf = (state: NavigationState): readonly (readonly [number, string, boolean])[] =>
  state.items.map((item) => [item.sequenceIndex, item.state, item.current]);

/**
 * Give the intents a session takes now, failing the test when `allowedIntents` fails.
 *
 * @param test The test.
 * @param session The session.
 * @returns The intents' posted values, in order.
 */
const allowedNow = (test: AcceptedTest, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

describe("navigationState", () => {
  it.effect(
    "[T-4] on BGtest.xml, after a response saved on item 1 and a move to item 2, gives position 2, item 1 answered, item 2 current and the intents allowedIntents lists",
    () =>
      Effect.gen(function* guideMove() {
        const given = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
        const configuration = yield* configure({});
        const session = sessionAfter(given, configuration, [
          { intent: { kind: "next" }, responses: { RESPONSE: chosen("A") } },
        ]);
        const state = stateOf(given.test, session);

        assert.strictEqual(state.navigation, "nonlinear");
        assert.strictEqual(state.submission, "individual");
        assert.strictEqual(state.position, 2);
        assert.strictEqual(state.count, 6);
        assert.deepStrictEqual(itemsOf(state), [
          [1, "answered", false],
          [2, "not-answered", true],
          [3, "not-answered", false],
          [4, "not-answered", false],
          [5, "not-answered", false],
          [6, "not-answered", false],
        ]);
        assert.deepStrictEqual(state.allowed.map(encodeIntent), allowedNow(given.test, session));
        assert.isTrue(state.allowed.some((intent) => intent.kind === "previous"));
      }),
  );

  it.effect(
    "[T-4] on the CASE test (linear) allows no previous, and gives an item submitted with attempts left submitted and one at its limit closed",
    () =>
      Effect.gen(function* caseSubmissions() {
        const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
        const configuration = yield* configure({});
        const submit: Step = {
          intent: { kind: "submit-item" },
          responses: { RESPONSE: chosen("A_2") },
        };

        const started = stateOf(given.test, sessionAfter(given, configuration, []));
        assert.strictEqual(started.navigation, "linear");
        assert.isFalse(started.allowed.some((intent) => intent.kind === "previous"));
        assert.deepStrictEqual(itemsOf(started), [
          [1, "not-answered", true],
          [2, "not-answered", false],
          [3, "not-answered", false],
        ]);

        const once = sessionAfter(given, configuration, [submit]);
        const submitted = stateOf(given.test, once);
        assert.strictEqual(once.items[0]?.record.numAttempts, 1);
        assert.isFalse(submitted.allowed.some((intent) => intent.kind === "previous"));
        assert.deepStrictEqual(itemsOf(submitted)[0], [1, "submitted", true]);
        assert.deepStrictEqual(submitted.allowed.map(encodeIntent), allowedNow(given.test, once));

        const twice = stateOf(given.test, sessionAfter(given, configuration, [submit, submit]));
        assert.deepStrictEqual(itemsOf(twice)[0], [1, "closed", true]);
      }),
  );

  it.effect(
    "[T-4] once the CASE test has closed, allows nothing and lists its last part's items, each closed and none current",
    () =>
      Effect.gen(function* caseClosed() {
        const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
        const configuration = yield* configure({});
        const session = sessionAfter(
          given,
          configuration,
          ["A_2", "A_1", "A_3"].map((choice) => ({
            intent: { kind: "next" },
            responses: { RESPONSE: chosen(choice) },
          })),
        );
        assert.strictEqual(session.status, "closed");

        const state = stateOf(given.test, session);
        assert.deepStrictEqual(state.allowed, []);
        assert.strictEqual(state.navigation, "linear");
        assert.strictEqual(state.count, 3);
        assert.strictEqual(state.position, 3);
        assert.deepStrictEqual(itemsOf(state), [
          [1, "closed", false],
          [2, "closed", false],
          [3, "closed", false],
        ]);
      }),
  );

  it.effect("fails with UnknownItemRef on a session of another test", () =>
    Effect.gen(function* otherTest() {
      const guideGiven = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
      const caseGiven = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
      const configuration = yield* configure({});
      const failure = Result.match(
        navigationState(caseGiven.test, sessionAfter(guideGiven, configuration, [])),
        {
          onFailure: (error) => error,
          onSuccess: () => assert.fail("navigationState read a session of another test"),
        },
      );

      assert.strictEqual(failure._tag, "UnknownItemRef");
    }),
  );

  it.effect("throws PartlessTestDefect on a closed session of a test with no part", () =>
    Effect.gen(function* partless() {
      const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
      const configuration = yield* configure({});
      const test = acceptTestForTest({ ...given.test.test, parts: [] });
      const session = Result.getOrElse(
        startTest(test, new Map(), configuration, { instance: "sitting", now: startedAt }),
        (failure) => assert.fail(`startTest refused: ${failure.message}`),
      );
      assert.strictEqual(session.status, "closed");

      assert.throws(() => {
        navigationState(test, session);
      }, PartlessTestDefect);
    }),
  );
});
