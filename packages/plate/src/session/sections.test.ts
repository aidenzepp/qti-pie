import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  allowedIntents,
  configure,
  current,
  encodeIntent,
  IntentRefused,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  AdvanceFailure,
  Configuration,
  Intent,
  Responses,
  TestSession,
} from "#plate/index.ts";
import { open } from "#plate/validate/open.ts";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
 */
const startedAt = new Date("2026-11-06T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * The responses every step posts: the choice `A`, the correct response, which every item's checks
 * pass.
 */
const answer: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * The item refs of the test part, in document order: `S1a` and `S1b` in section `S1`, then `S2a`
 * in section `S2`.
 */
const refs = ["S1a", "S1b", "S2a"] as const;

/**
 * Write the text of a hand-built Choice item: `RESPONSE`, an identifier whose correct response is
 * `A`, scored by `match_correct` into `SCORE`, from a Choice of `A` and `B`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    "<qti-item-body>",
    '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
    '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
    '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
    "</qti-choice-interaction></qti-item-body>",
    '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test of one part with individual submission that holds two
 * sections: `S1` with the item refs `S1a` and `S1b`, then `S2` with `S2a`, each ref naming
 * `<ref>.xml` beside the test.
 *
 * @param navigation The part's navigation mode.
 * @returns The test's text.
 */
const testXml = (navigation: "linear" | "nonlinear"): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    `<qti-test-part identifier="P" navigation-mode="${navigation}" submission-mode="individual">`,
    '<qti-assessment-section identifier="S1" title="Section 1" visible="true">',
    '<qti-assessment-item-ref identifier="S1a" href="S1a.xml"/>',
    '<qti-assessment-item-ref identifier="S1b" href="S1b.xml"/>',
    "</qti-assessment-section>",
    '<qti-assessment-section identifier="S2" title="Section 2" visible="true">',
    '<qti-assessment-item-ref identifier="S2a" href="S2a.xml"/>',
    "</qti-assessment-section>",
    "</qti-test-part></qti-assessment-test>",
  ].join("");

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open the hand-built test of {@link testXml} at `tests/T.xml` and its three items beside it,
 * through the public `open`.
 *
 * @param navigation The part's navigation mode.
 * @returns The test and its items, keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery(navigation: "linear" | "nonlinear") {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/T.xml", encoder.encode(testXml(navigation)));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const ref of refs) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(itemXml(ref)));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  return { items, test } satisfies Delivery;
});

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Advance a session with an intent and {@link answer}, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after {@link startedAt}.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  seconds: number,
): TestSession =>
  Result.getOrElse(
    advance(given.test, given.items, session, { intent, responses: answer }, configuration, {
      now: after(seconds),
    }),
    (failure) => assert.fail(`advance refused ${encodeIntent(intent)}: ${failure.message}`),
  );

/**
 * Read the rule `advance` refuses a step with, failing the test unless it refuses it with an
 * `IntentRefused`.
 *
 * @param result What `advance` returned.
 * @returns The rule.
 */
const refusedRule = (result: Result.Result<TestSession, AdvanceFailure>): string => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );

  return failure instanceof IntentRefused
    ? failure.rule
    : assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
};

/**
 * Read the item ref a session shows now, failing the test when it shows the summary or `current`
 * fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's ref.
 */
const shownRef = (given: Delivery, configuration: Configuration, session: TestSession): string => {
  const shown = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown.ref : assert.fail("current shows the summary, not an item");
};

/**
 * List the intents allowed now as their posted values, failing the test when the session does not
 * fit the test.
 *
 * @param given The test and its items.
 * @param session The session.
 * @returns The posted value of each intent `allowedIntents` lists.
 */
const allowedNow = (given: Delivery, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(given.test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

describe("a test part of two sections", () => {
  it.effect(
    "[T-12] delivers section S1's items, then S2's, in document order: nonlinear, Next from S1's last item presents S2's first, Previous returns, and S2's item is offered from S1; linear, Next crosses from S1 into S2 and never back",
    () =>
      Effect.gen(function* twoSections() {
        const configuration = yield* configure({});

        const nonlinear = yield* delivery("nonlinear");
        const atFirst = started(nonlinear, configuration);
        assert.deepStrictEqual(
          atFirst.items.map((item) => item.ref),
          [...refs],
        );

        const atLastOfS1 = advanced(nonlinear, configuration, atFirst, { kind: "next" }, 10);
        const atFirstOfS2 = advanced(nonlinear, configuration, atLastOfS1, { kind: "next" }, 20);
        const backInS1 = advanced(nonlinear, configuration, atFirstOfS2, { kind: "previous" }, 30);
        assert.deepStrictEqual(
          [atFirst, atLastOfS1, atFirstOfS2, backInS1].map((session) =>
            shownRef(nonlinear, configuration, session),
          ),
          ["S1a", "S1b", "S2a", "S1b"],
        );
        for (const inS1 of [atFirst, atLastOfS1, backInS1]) {
          assert.include(
            allowedNow(nonlinear, inS1),
            encodeIntent({ kind: "go", sequenceIndex: 3 }),
          );
        }
        const jumped = advanced(
          nonlinear,
          configuration,
          atFirst,
          { kind: "go", sequenceIndex: 3 },
          40,
        );
        assert.strictEqual(shownRef(nonlinear, configuration, jumped), "S2a");

        const linear = yield* delivery("linear");
        const linearFirst = started(linear, configuration);
        const linearLastOfS1 = advanced(linear, configuration, linearFirst, { kind: "next" }, 10);
        const linearFirstOfS2 = advanced(
          linear,
          configuration,
          linearLastOfS1,
          { kind: "next" },
          20,
        );
        assert.deepStrictEqual(
          [linearFirst, linearLastOfS1, linearFirstOfS2].map((session) =>
            shownRef(linear, configuration, session),
          ),
          [...refs],
        );

        const offeredInS2 = allowedNow(linear, linearFirstOfS2);
        for (const back of [
          { kind: "previous" },
          { kind: "go", sequenceIndex: 1 },
          { kind: "go", sequenceIndex: 2 },
        ] satisfies readonly Intent[]) {
          assert.notInclude(offeredInS2, encodeIntent(back));
        }
        const backRules = [
          { kind: "previous" },
          { kind: "go", sequenceIndex: 2 },
        ] satisfies readonly Intent[];
        assert.deepStrictEqual(
          backRules.map((intent) =>
            refusedRule(
              advance(
                linear.test,
                linear.items,
                linearFirstOfS2,
                { intent, responses: answer },
                configuration,
                { now: after(30) },
              ),
            ),
          ),
          ["linear-back", "linear-jump"],
        );
      }),
  );
});
