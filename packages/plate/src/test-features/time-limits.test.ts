import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  allowedIntents,
  configure,
  encodeIntent,
  IntentRefused,
  itemRefs,
  navigationState,
  open,
  renderNavigation,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  AdvanceFailure,
  Configuration,
  Intent,
  Responses,
  TimeState,
} from "#plate/index.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import type { TestSession } from "#plate/session/session.ts";
import type { AdditionalTestingTime } from "#plate/supports.ts";
import { extendedMaxTime, pauseTime, resumeTime } from "#plate/test-features/time-limits.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * A test session with no items, as the hooks take one: none of its fields matters to a stub.
 */
const session: TestSession = {
  document: "tests/t.xml",
  instance: "sitting",
  items: [],
  kind: "test",
  outcomeRuns: 0,
  outcomes: {},
  parts: [],
  position: 0,
  seed: "seed",
  shuffleSeed: Option.none(),
  started: "1970-01-01T00:00:00.000Z",
  status: "interacting",
  test: "t",
  updated: "1970-01-01T00:00:00.000Z",
};

/**
 * Each kind of additional testing time a candidate may be allowed.
 */
const extensions: readonly AdditionalTestingTime[] = [
  { factor: 1.5, kind: "multiplier" },
  { kind: "minutes", minutes: 10 },
  { kind: "unlimited" },
];

describe("the time-limits stub's hooks for m4-03 and m4-08", () => {
  it("extendedMaxTime gives the max-time unextended, with or without additional testing time", () => {
    assert.deepStrictEqual(extendedMaxTime(600, Option.none()), Option.some(600));
    for (const extension of extensions) {
      assert.deepStrictEqual(
        extendedMaxTime(600, Option.some(extension)),
        Option.some(600),
        extension.kind,
      );
    }
  });

  it("pauseTime and resumeTime give the session back unchanged", () => {
    const at = new Date(100_000);

    assert.strictEqual(pauseTime(session, at), session);
    assert.strictEqual(resumeTime(session, at), session);
  });
});

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * Give the time some whole seconds after the epoch, where every session here starts.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const atSecond = (seconds: number): Date => new Date(seconds * 1000);

/**
 * The responses every step posts: the choice `A`, the correct response, which every check passes.
 */
const answer: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * Read a document of `fixtures/m3f/time-limits` as text.
 *
 * @param name The file's name under the directory.
 * @returns The file's text.
 */
const fixtureText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m3f/time-limits/${name}`, import.meta.url), "utf-8");

/**
 * Rewrite one exact `qti-time-limits` of a fixture, failing the test when the fixture does not
 * hold it, so a variant names the limits it changes and breaks loudly when the fixture moves.
 *
 * @param written The element as the fixture writes it.
 * @param replacement What stands in its place, empty to drop it.
 * @returns The rewrite of a fixture's text.
 */
const retimed =
  (written: string, replacement: string) =>
  (text: string): string =>
    text.includes(written)
      ? text.replace(written, replacement)
      : assert.fail(`the fixture holds no ${written}`);

/**
 * Drop every `qti-time-limits` of a fixture: the untimed variant.
 *
 * @param text The fixture's text.
 * @returns The text with no time limits.
 */
const untimed = (text: string): string => text.replaceAll(/<qti-time-limits[^>]*\/>/gu, "");

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`, and the
 * verdict `open` gave the test.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
  readonly verdict: "accepted" | "accepted-with-unsupported";
}

/**
 * Open a test of `fixtures/m3f/time-limits` at `tests/<name>.xml`, and `choice.xml` beside it for
 * every item ref, through the public `open`.
 *
 * @param name The test document's name without its extension.
 * @param edit Rewrites the document's text before it is opened, for a variant of the fixture.
 * @returns The test, its items keyed by item ref, and the test's verdict.
 */
const delivery = Effect.fnUntraced(function* delivery(
  name: "late" | "linear" | "nonlinear",
  edit: (text: string) => string = (text) => text,
) {
  const encoder = new TextEncoder();
  const opened = yield* open(`tests/${name}.xml`, encoder.encode(edit(fixtureText(`${name}.xml`))));
  const accepted =
    (opened.verdict === "accepted" || opened.verdict === "accepted-with-unsupported") &&
    opened.kind === "test"
      ? opened
      : assert.fail(`${name}.xml is ${opened.verdict} on a ${opened.kind}`);
  const item = yield* open("tests/choice.xml", encoder.encode(fixtureText("choice.xml")));
  const choice = Option.getOrElse(acceptedItem(item), () =>
    assert.fail(`choice.xml is ${item.verdict}, not an accepted item`),
  );
  const items = new Map<string, Accepted>(
    itemRefs(accepted.accepted).map(({ identifier }) => [identifier, choice]),
  );

  return { items, test: accepted.accepted, verdict: accepted.verdict } satisfies Delivery;
});

/**
 * Start a session of a delivery at 0 s, failing the test when `startTest` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now: atSecond(0) }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Advance a session with an intent and {@link answer}, leaving the result as `advance` gave it.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after the session started.
 * @returns The session after the intent, or `advance`'s failure.
 */
const stepped = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(given.test, given.items, sitting, { intent, responses: answer }, configuration, {
    now: atSecond(seconds),
  });

/**
 * Advance a session with an intent and {@link answer}, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after the session started.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
): TestSession =>
  Result.getOrElse(stepped(given, configuration, sitting, intent, seconds), (failure) =>
    assert.fail(`advance refused ${encodeIntent(intent)} at ${seconds} s: ${failure.message}`),
  );

/**
 * Save and stay on the current item at a time, through `go` to its own sequence index, so the
 * session's `updated` is that time and the navigation reads the time then.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session, open on an item.
 * @param seconds When it happens, in seconds after the session started.
 * @returns The session after the step.
 */
const stayed = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  seconds: number,
): TestSession => {
  const shown = sitting.items[sitting.position] ?? assert.fail("the session shows no current item");

  return advanced(
    given,
    configuration,
    sitting,
    { kind: "go", sequenceIndex: shown.sequenceIndex },
    seconds,
  );
};

/**
 * Check that `advance` refused an intent through the time-limits module's `min-time`: an
 * `IntentRefused` under the rule `feature`, naming `qti-time-limits` and its rule `min-time`.
 *
 * @param result What `advance` returned.
 */
const assertMinTimeRefusal = (result: Result.Result<TestSession, AdvanceFailure>): void => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );
  if (!(failure instanceof IntentRefused)) {
    assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
  }

  assert.strictEqual(failure.rule, "feature");

  const feature = Option.getOrElse(failure.feature, () =>
    assert.fail(`expected a feature refusal, not ${failure.message}`),
  );
  assert.strictEqual(feature.feature, "qti-time-limits");
  assert.strictEqual(feature.rule, "min-time");
};

/**
 * Read the time a session's navigation carries, none when it carries none.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @returns The navigation's `time`.
 */
const timeOf = (given: Delivery, sitting: TestSession): Option.Option<TimeState> => {
  const state = Result.getOrElse(navigationState(given.test, sitting), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

  return Option.fromUndefinedOr(state.time);
};

/**
 * Read the time a session's navigation carries, failing the test when it carries none.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @returns The navigation's `time`.
 */
const timeIn = (given: Delivery, sitting: TestSession): TimeState =>
  Option.getOrElse(timeOf(given, sitting), () => assert.fail("the navigation carries no time"));

/**
 * List the intents allowed now as their posted values.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @returns The posted value of each intent `allowedIntents` lists.
 */
const allowedNow = (given: Delivery, sitting: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(given.test, sitting), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

/**
 * Render a session's navigation in the default order and parse it back.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @returns The rendered nodes.
 */
const rendered = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
): readonly Node[] => {
  const state = Result.getOrElse(navigationState(given.test, sitting), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

  return parseHtml(
    Result.getOrElse(renderNavigation(state, configuration), (failure) =>
      assert.fail(`renderNavigation failed: ${failure.message}`),
    ),
  );
};

/**
 * List every element among some nodes, their descendants included, that carries an attribute with
 * a value.
 *
 * @param nodes The nodes.
 * @param name The attribute's name.
 * @param value Its value.
 * @returns The elements, in document order.
 */
const elementsWith = (nodes: readonly Node[], name: string, value: string): readonly Element[] =>
  nodes.flatMap((node) =>
    node.kind === "element"
      ? [...(node.attrs[name] === value ? [node] : []), ...elementsWith(node.children, name, value)]
      : [],
  );

/**
 * Give the one element among some nodes that carries an attribute with a value, failing the test
 * unless exactly one does.
 *
 * @param nodes The nodes.
 * @param name The attribute's name.
 * @param value Its value.
 * @returns The element.
 */
const theElement = (nodes: readonly Node[], name: string, value: string): Element => {
  const found = elementsWith(nodes, name, value);

  return found.length === 1 && found[0] !== undefined
    ? found[0]
    : assert.fail(`expected one element with ${name}="${value}", found ${found.length}`);
};

/**
 * Give the characters an element holds, its descendants' included.
 *
 * @param node The node.
 * @returns Its text.
 */
const textIn = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textIn).join("");

/**
 * A linear timed test's item ref `A1`: its own `min-time`, as `linear.xml` writes it.
 */
const a1Limits = '<qti-time-limits min-time="60"/>';

describe("time limits", () => {
  it.effect("[T-2] a test holding qti-time-limits opens accepted, with no mark", () =>
    Effect.gen(function* opensAccepted() {
      const given = yield* delivery("linear");

      assert.strictEqual(given.verdict, "accepted");
      assert.deepStrictEqual(given.test.unsupported, []);
    }),
  );

  it.effect("[T-2] the test's max-time gives the time left after a step", () =>
    Effect.gen(function* testMaxTime() {
      const configuration = yield* configure({});
      const given = yield* delivery("linear");
      const atA2 = advanced(
        given,
        configuration,
        started(given, configuration),
        { kind: "next" },
        61,
      );
      const atB1 = advanced(given, configuration, atA2, { kind: "next" }, 100);

      assert.deepStrictEqual(timeIn(given, atB1), {
        allowLateSubmission: false,
        minTimeLeft: Option.none(),
        timeLeft: Option.some(500),
      });
    }),
  );

  it.effect("[T-6] a part's max-time tighter than the test's gives the time left", () =>
    Effect.gen(function* partMaxTime() {
      const configuration = yield* configure({});
      const given = yield* delivery("nonlinear");
      const atHundred = stayed(given, configuration, started(given, configuration), 100);

      assert.deepStrictEqual(timeIn(given, atHundred).timeLeft, Option.some(200));
    }),
  );

  it.effect("[S-2] a section's max-time gives the time left only while its item is current", () =>
    Effect.gen(function* sectionMaxTime() {
      const configuration = yield* configure({});
      const given = yield* delivery("linear");
      const inA = stayed(given, configuration, started(given, configuration), 50);
      assert.deepStrictEqual(timeIn(given, inA).timeLeft, Option.some(70));

      const atA2 = advanced(given, configuration, inA, { kind: "next" }, 61);
      const atB1 = advanced(given, configuration, atA2, { kind: "next" }, 110);
      assert.deepStrictEqual(timeIn(given, atB1).timeLeft, Option.some(600 - 110));
    }),
  );

  it.effect("[I-16] an item ref's max-time gives the time left of that item", () =>
    Effect.gen(function* itemMaxTime() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        "linear",
        retimed(a1Limits, '<qti-time-limits max-time="90"/>'),
      );
      const atThirty = stayed(given, configuration, started(given, configuration), 30);

      assert.deepStrictEqual(timeIn(given, atThirty).timeLeft, Option.some(60));
    }),
  );

  it.effect("[I-16] in a linear part an item's min-time refuses next until it has elapsed", () =>
    Effect.gen(function* itemMinTimeNext() {
      const configuration = yield* configure({});
      const given = yield* delivery("linear");
      const sitting = started(given, configuration);

      assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "next" }, 30));

      const moved = advanced(given, configuration, sitting, { kind: "next" }, 61);
      assert.strictEqual(moved.items[moved.position]?.ref, "A2");
    }),
  );

  it.effect(
    "[I-16] in a linear part an item's min-time refuses submit-item until it has elapsed",
    () =>
      Effect.gen(function* itemMinTimeSubmit() {
        const configuration = yield* configure({});
        const given = yield* delivery("linear");
        const sitting = started(given, configuration);

        assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "submit-item" }, 30));

        const submitted = advanced(given, configuration, sitting, { kind: "submit-item" }, 61);
        assert.strictEqual(submitted.items[submitted.position]?.record.numAttempts, 1);
      }),
  );

  it.effect(
    "[S-2] in a linear part a section's min-time refuses only the next that leaves it",
    () =>
      Effect.gen(function* sectionMinTime() {
        const configuration = yield* configure({});
        const given = yield* delivery("linear", retimed(a1Limits, ""));
        const atA2 = advanced(
          given,
          configuration,
          started(given, configuration),
          { kind: "next" },
          10,
        );
        assert.strictEqual(atA2.items[atA2.position]?.ref, "A2");

        assertMinTimeRefusal(stepped(given, configuration, atA2, { kind: "next" }, 50));

        const atB1 = advanced(given, configuration, atA2, { kind: "next" }, 101);
        assert.strictEqual(atB1.items[atB1.position]?.ref, "B1");
      }),
  );

  it.effect("[I-16] [S-2] in a nonlinear part item and section min-times are ignored", () =>
    Effect.gen(function* nonlinearMinTimes() {
      const configuration = yield* configure({});
      const given = yield* delivery("nonlinear");
      const sitting = started(given, configuration);

      const moved = advanced(given, configuration, sitting, { kind: "next" }, 1);
      assert.strictEqual(moved.items[moved.position]?.ref, "N2");

      const submitted = advanced(given, configuration, sitting, { kind: "submit-item" }, 1);
      assert.strictEqual(submitted.items[submitted.position]?.record.numAttempts, 1);
    }),
  );

  it.effect(
    "[T-6] a part's min-time refuses end-part until it has elapsed, in a nonlinear part too",
    () =>
      Effect.gen(function* partMinTime() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          "nonlinear",
          retimed(
            '<qti-time-limits min-time="300" max-time="600"/>',
            '<qti-time-limits max-time="600"/>',
          ),
        );
        const sitting = started(given, configuration);

        assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "end-part" }, 100));

        const ended = advanced(given, configuration, sitting, { kind: "end-part" }, 201);
        assert.deepStrictEqual(
          ended.parts.map((part) => part.status),
          ["ended"],
        );
      }),
  );

  it.effect("[T-2] the test's min-time refuses ending the last part until it has elapsed", () =>
    Effect.gen(function* testMinTime() {
      const configuration = yield* configure({});
      const given = yield* delivery("nonlinear");
      const sitting = started(given, configuration);

      assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "end-part" }, 100));
      assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "end-part" }, 250));

      const closed = advanced(given, configuration, sitting, { kind: "end-part" }, 301);
      assert.strictEqual(closed.status, "closed");
    }),
  );

  it.effect(
    "[T-2] [I-16] a min-time above a max-time stops holding once the max-time has run out",
    () =>
      Effect.gen(function* minAboveMax() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          "linear",
          retimed(a1Limits, '<qti-time-limits min-time="120" max-time="60"/>'),
        );
        const sitting = started(given, configuration);

        assertMinTimeRefusal(stepped(given, configuration, sitting, { kind: "next" }, 30));

        const moved = advanced(given, configuration, sitting, { kind: "next" }, 61);
        assert.strictEqual(moved.items[moved.position]?.ref, "A2");
      }),
  );

  it.effect(
    "[T-2] with allow-late-submission true a submission after max-time is accepted and stays detectable",
    () =>
      Effect.gen(function* lateSubmission() {
        const configuration = yield* configure({});
        const given = yield* delivery("late");
        const submitted = advanced(
          given,
          configuration,
          started(given, configuration),
          { kind: "submit-item" },
          90,
        );

        const time = timeIn(given, submitted);
        assert.deepStrictEqual(time.timeLeft, Option.some(0));
        assert.isTrue(time.allowLateSubmission);

        const item = submitted.items[submitted.position] ?? assert.fail("no current item");
        assert.strictEqual(item.record.numAttempts, 1);
        assert.isAbove(item.duration, 60);
      }),
  );

  it.effect(
    "[T-2] the time part shows the time left and the min-time, and an untimed test shows none",
    () =>
      Effect.gen(function* timePartShown() {
        const configuration = yield* configure({});
        const given = yield* delivery("linear");
        const sitting = started(given, configuration);
        const time = timeIn(given, sitting);

        const atStart = rendered(given, configuration, sitting);
        const part = theElement(atStart, "data-slot", "test-navigation-time");
        assert.notProperty(part.attrs, "hidden");

        const left = theElement([part], "data-time", "left");
        assert.strictEqual(left.attrs["data-seconds"], String(Option.getOrThrow(time.timeLeft)));

        const min = theElement([part], "data-time", "min");
        assert.strictEqual(min.attrs["data-seconds"], String(Option.getOrThrow(time.minTimeLeft)));

        const atA2 = advanced(given, configuration, sitting, { kind: "next" }, 61);
        const atB1 = advanced(given, configuration, atA2, { kind: "next" }, 100);
        const unheld = theElement(
          rendered(given, configuration, atB1),
          "data-slot",
          "test-navigation-time",
        );
        assert.strictEqual(theElement([unheld], "data-time", "left").attrs["data-seconds"], "500");
        assert.deepStrictEqual(elementsWith([unheld], "data-time", "min"), []);

        const plain = yield* delivery("linear", untimed);
        const plainSession = started(plain, configuration);
        assert.isTrue(Option.isNone(timeOf(plain, plainSession)));
        assert.deepStrictEqual(
          elementsWith(
            rendered(plain, configuration, plainSession),
            "data-slot",
            "test-navigation-time",
          ),
          [],
        );
      }),
  );

  it.effect(
    "[T-2] the time part's status region is empty with time to spare and speaks before and at expiry",
    () =>
      Effect.gen(function* timeNotice() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const sitting = started(given, configuration);

        /**
         * Give the status region a session's navigation renders, failing the test unless there is
         * one, with `role="status"`.
         *
         * @param shown The session.
         * @returns The region's text.
         */
        const noticeOf = (shown: TestSession): string => {
          const notice = theElement(rendered(given, configuration, shown), "data-time", "notice");
          assert.strictEqual(notice.attrs["role"], "status");

          return textIn(notice);
        };

        assert.deepStrictEqual(timeIn(given, sitting).timeLeft, Option.some(300));
        assert.strictEqual(noticeOf(sitting), "");

        const warned = stayed(given, configuration, sitting, 255);
        assert.deepStrictEqual(timeIn(given, warned).timeLeft, Option.some(45));
        assert.notStrictEqual(noticeOf(warned), "");

        const expired = stayed(given, configuration, warned, 310);
        assert.deepStrictEqual(timeIn(given, expired).timeLeft, Option.some(0));
        assert.notStrictEqual(noticeOf(expired), "");
      }),
  );

  it.effect(
    "[I-16] while an item's min-time holds in a linear part the navigation does not offer next",
    () =>
      Effect.gen(function* nextNotOffered() {
        const configuration = yield* configure({});
        const given = yield* delivery("linear");
        const next = encodeIntent({ kind: "next" });

        const atThirty = stayed(given, configuration, started(given, configuration), 30);
        assert.notInclude(allowedNow(given, atThirty), next);

        const atSixtyOne = stayed(given, configuration, atThirty, 61);
        assert.include(allowedNow(given, atSixtyOne), next);
      }),
  );
});
