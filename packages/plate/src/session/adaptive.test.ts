import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  allowedIntents,
  configure,
  encodeSession,
  IntentRefused,
  itemView,
  open,
  results,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  AdvanceFailure,
  Configuration,
  Intent,
  Responses,
  SessionItem,
  TestSession,
} from "#plate/index.ts";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
 */
const startedAt = new Date("2026-11-10T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * Read a fixture of `fixtures/m5` as bytes.
 *
 * @param name The fixture's path under `fixtures/m5`.
 * @returns The bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m5/${name}`, import.meta.url)));

/**
 * The responses of a step that types a word into the Text Entry bound to `RESPONSE`.
 *
 * @param word The word.
 * @returns The responses.
 */
const typed = (word: string): Responses => ({
  RESPONSE: {
    baseType: "string",
    cardinality: "single",
    values: [{ baseType: "string", value: word }],
  },
});

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a test and its items through the public `open`, failing the test unless each is accepted.
 *
 * @param path The test's document path.
 * @param bytes The test's bytes.
 * @param items The item refs' fixtures under `fixtures/m5`, by item ref identifier.
 * @returns The test and its items, keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery(
  path: string,
  bytes: Uint8Array,
  items: Readonly<Record<string, string>>,
) {
  const verdict = yield* open(path, bytes);
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const accepted = new Map<string, Accepted>();
  for (const [ref, name] of Object.entries(items)) {
    const opened = yield* open(name, fixture(name));
    accepted.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  return { items: accepted, test } satisfies Delivery;
});

/**
 * Open `fixtures/m5/adaptive/test.xml`: `planet`, the adaptive item of `items/adaptive.xml`, in a
 * linear individual part under `max-attempts="1"`, then `tally`, the adaptive item of
 * `items/adaptive-never-complete.xml`, in a simultaneous part.
 *
 * @returns The test and its items.
 */
const bothModes = (): ReturnType<typeof delivery> =>
  delivery("adaptive/test.xml", fixture("adaptive/test.xml"), {
    planet: "items/adaptive.xml",
    tally: "items/adaptive-never-complete.xml",
  });

/**
 * Open a hand-built test of one linear individual part under `max-attempts="1"` that holds only
 * `tally`, the adaptive item of `items/adaptive-never-complete.xml`, so it can be submitted item
 * by item.
 *
 * @returns The test and its item.
 */
const tallyAlone = (): ReturnType<typeof delivery> =>
  delivery(
    "adaptive/alone.xml",
    new TextEncoder().encode(
      [
        '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="alone" title="Alone">',
        '<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
        '<qti-item-session-control max-attempts="1"/>',
        '<qti-assessment-section identifier="S" title="S" visible="true">',
        '<qti-assessment-item-ref identifier="tally" href="../items/adaptive-never-complete.xml"/>',
        "</qti-assessment-section></qti-test-part></qti-assessment-test>",
      ].join(""),
    ),
    { tally: "items/adaptive-never-complete.xml" },
  );

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
 * Advance a session with an intent and the responses posted with it.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param responses The responses the step posts.
 * @param seconds When it happens, in seconds after {@link startedAt}.
 * @returns What `advance` returned.
 */
const step = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  responses: Responses,
  seconds: number,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(given.test, given.items, session, { intent, responses }, configuration, {
    now: after(seconds),
  });

/**
 * Read the session `advance` accepted, failing the test when it refused.
 *
 * @param result What `advance` returned.
 * @returns The session after the intent.
 */
const accepted = (result: Result.Result<TestSession, AdvanceFailure>): TestSession =>
  Result.getOrElse(result, (failure) => assert.fail(`advance refused: ${failure.message}`));

/**
 * Read the rule `advance` refused a step with, failing the test unless it refused it with an
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
 * Find a session's item by its item ref.
 *
 * @param session The session.
 * @param ref The item ref identifier.
 * @returns The session item.
 */
const itemOf = (session: TestSession, ref: string): SessionItem =>
  session.items.find((item) => item.ref === ref) ?? assert.fail(`no session item ${ref}`);

/**
 * Read a single outcome's one value from a session item's record, as text.
 *
 * @param item The session item.
 * @param identifier The outcome.
 * @returns The value as text, or none when the record holds no value.
 */
const outcomeOf = (item: SessionItem, identifier: string): string | undefined => {
  const value = item.record.outcomes[identifier]?.values[0];
  if (value === undefined) {
    return undefined;
  }

  return value.baseType === "identifier" || value.baseType === "integer"
    ? String(value.value)
    : assert.fail(`${identifier} holds a ${value.baseType}, not an identifier or an integer`);
};

describe("adaptive items in a test session", () => {
  it.effect(
    "[adaptive] in a linear individual part, max-attempts 1 does not stop a second attempt of an adaptive item",
    () =>
      Effect.gen(function* secondAttempt() {
        const given = yield* bothModes();
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const first = accepted(
          step(given, configuration, begun, { kind: "submit-item" }, typed("Venus"), 5),
        );
        const second = accepted(
          step(given, configuration, first, { kind: "submit-item" }, typed("Mars"), 10),
        );

        assert.strictEqual(itemOf(second, "planet").record.numAttempts, 2);
        assert.strictEqual(outcomeOf(itemOf(second, "planet"), "TRIES"), "2");
        assert.strictEqual(outcomeOf(itemOf(second, "planet"), "completionStatus"), "incomplete");
      }),
  );

  it.effect(
    "[adaptive] submitting the right response closes the item: a further submit is item-closed",
    () =>
      Effect.gen(function* closesAtCompletion() {
        const given = yield* bothModes();
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const wrong = accepted(
          step(given, configuration, begun, { kind: "submit-item" }, typed("Venus"), 5),
        );
        const right = accepted(
          step(given, configuration, wrong, { kind: "submit-item" }, typed("Mercury"), 10),
        );

        assert.strictEqual(outcomeOf(itemOf(right, "planet"), "completionStatus"), "completed");
        assert.strictEqual(
          refusedRule(
            step(given, configuration, right, { kind: "submit-item" }, typed("Venus"), 15),
          ),
          "item-closed",
        );
      }),
  );

  it.effect("[adaptive] an adaptive item that never completes stays open after many attempts", () =>
    Effect.gen(function* neverCompletes() {
      const given = yield* tallyAlone();
      const configuration = yield* configure({});
      let session = started(given, configuration);
      for (let attempt = 1; attempt <= 10; attempt += 1) {
        const result = step(
          given,
          configuration,
          session,
          { kind: "submit-item" },
          typed(`word${String(attempt)}`),
          attempt * 5,
        );
        assert.isTrue(Result.isSuccess(result), `attempt ${String(attempt)} is accepted`);
        session = accepted(result);
      }

      assert.strictEqual(itemOf(session, "tally").record.numAttempts, 10);
      assert.strictEqual(outcomeOf(itemOf(session, "tally"), "TRIES"), "10");
    }),
  );

  it.effect(
    "[adaptive] the results report carries the last attempt's outcomes and completionStatus",
    () =>
      Effect.gen(function* reported() {
        const given = yield* bothModes();
        const configuration = yield* configure({});
        let session = started(given, configuration);
        for (const [index, word] of ["Venus", "Mars", "Mercury"].entries()) {
          session = accepted(
            step(given, configuration, session, { kind: "submit-item" }, typed(word), index * 5),
          );
        }
        const stored = Result.getOrElse(encodeSession(session), (failure) =>
          assert.fail(failure.message),
        );
        const xml = Result.getOrElse(
          results({
            context: {},
            items: given.items,
            kind: "test",
            session: stored,
            test: given.test,
          }),
          (failure) => assert.fail(failure.message),
        );
        const planet =
          /<itemResult [^>]*identifier="planet"[^>]*>(?<body>[\s\S]*?)<\/itemResult>/u.exec(xml)
            ?.groups?.["body"] ?? assert.fail(`no itemResult for planet in ${xml}`);
        const outcome = (identifier: string): string | undefined =>
          new RegExp(
            `<outcomeVariable [^>]*identifier="${identifier}"[^>]*>\\s*<value>(?<value>[^<]*)</value>`,
            "u",
          ).exec(planet)?.groups?.["value"];

        assert.strictEqual(outcome("TRIES"), "3");
        assert.strictEqual(outcome("SCORE"), "1");
        assert.strictEqual(outcome("completionStatus"), "completed");
        assert.strictEqual(outcome("numAttempts"), undefined);
        assert.match(
          planet,
          /<responseVariable [^>]*identifier="numAttempts"[^>]*>\s*<candidateResponse>\s*<value>3<\/value>/u,
        );
      }),
  );

  it.effect(
    "[adaptive] in a simultaneous part an adaptive item gets one attempt, processed at the part's end",
    () =>
      Effect.gen(function* simultaneous() {
        const given = yield* bothModes();
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const done = accepted(
          step(given, configuration, begun, { kind: "submit-item" }, typed("Mercury"), 5),
        );
        const together = accepted(step(given, configuration, done, { kind: "next" }, {}, 10));

        assert.strictEqual(itemOf(together, "tally").record.numAttempts, 0);
        assert.strictEqual(
          refusedRule(
            step(given, configuration, together, { kind: "submit-item" }, typed("one"), 15),
          ),
          "wrong-submission-mode",
        );

        const ended = accepted(
          step(given, configuration, together, { kind: "submit-part" }, typed("one"), 20),
        );

        assert.strictEqual(itemOf(ended, "tally").record.numAttempts, 1);
        assert.strictEqual(outcomeOf(itemOf(ended, "tally"), "TRIES"), "1");
        assert.strictEqual(outcomeOf(itemOf(ended, "tally"), "completionStatus"), "unknown");
        assert.notInclude(
          given.items.get("tally")?.item.unsupported.map((feature) => feature.feature) ?? [],
          'adaptive="true"',
        );
      }),
  );

  it.effect(
    "[adaptive] allowedIntents offers submit-item on an open adaptive item after its max-attempts is reached",
    () =>
      Effect.gen(function* offered() {
        const given = yield* bothModes();
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const offers = (session: TestSession): boolean =>
          Result.getOrElse(allowedIntents(given.test, session, given.items), (failure) =>
            assert.fail(failure.message),
          ).some((intent) => intent.kind === "submit-item");
        const disabled = (session: TestSession): boolean =>
          Result.getOrElse(itemView(given.test, session, configuration, 1), (failure) =>
            assert.fail(failure.message),
          ).disabled;
        const wrong = accepted(
          step(given, configuration, begun, { kind: "submit-item" }, typed("Venus"), 5),
        );

        assert.strictEqual(itemOf(wrong, "planet").record.numAttempts, 1);
        assert.isTrue(offers(wrong));
        assert.isFalse(disabled(wrong));

        const right = accepted(
          step(given, configuration, wrong, { kind: "submit-item" }, typed("Mercury"), 10),
        );

        assert.isFalse(offers(right));
        assert.isTrue(disabled(right));
      }),
  );
});
