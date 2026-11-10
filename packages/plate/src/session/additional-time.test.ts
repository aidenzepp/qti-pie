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
  noSupports,
  open,
  readPnp,
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
  Supports,
  TimeState,
} from "#plate/index.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import type { TestSession } from "#plate/session/session.ts";
import { allowedMaxTime } from "#plate/test-features/time-limits.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

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
 * The candidate's supports as a host hands them to the session functions: some, or none at all,
 * which is not the same as `noSupports` though the two read alike.
 */
type Candidate = Option.Option<Supports>;

/**
 * A host that passes no supports to the session functions.
 */
const passingNone: Candidate = Option.none();

/**
 * A host that passes `noSupports`, every support off.
 */
const passingNoSupports: Candidate = Option.some(noSupports);

/**
 * A candidate allowed one and a half times the written time.
 */
const multiplier: Candidate = Option.some({
  ...noSupports,
  additionalTestingTime: Option.some({ factor: 1.5, kind: "multiplier" }),
});

/**
 * A candidate allowed ten minutes more than the written time.
 */
const tenMinutes: Candidate = Option.some({
  ...noSupports,
  additionalTestingTime: Option.some({ kind: "minutes", minutes: 10 }),
});

/**
 * A candidate with no time limit.
 */
const unlimited: Candidate = Option.some({
  ...noSupports,
  additionalTestingTime: Option.some({ kind: "unlimited" }),
});

/**
 * Read a document of `fixtures/m4/additional-time` as text.
 *
 * @param name The file's name under the directory.
 * @returns The file's text.
 */
const fixtureText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m4/additional-time/${name}`, import.meta.url), "utf-8");

/**
 * Read the PNP fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const pnpBytes = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Rewrite one exact piece of the fixture, failing the test when the fixture does not hold it, so a
 * variant names what it changes and breaks loudly when the fixture moves.
 *
 * @param written The text as the fixture writes it.
 * @param replacement What stands in its place.
 * @returns The rewrite of a fixture's text.
 */
const rewritten =
  (written: string, replacement: string) =>
  (text: string): string =>
    text.includes(written)
      ? text.replace(written, replacement)
      : assert.fail(`the fixture holds no ${written}`);

/**
 * The fixture's test part, as it opens: the element a part's limits follow.
 */
const partOpening =
  '<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">';

/**
 * The fixture's section, as it opens.
 */
const sectionOpening =
  '<qti-assessment-section identifier="S" title="A timed section" visible="true">';

/**
 * The fixture's first item ref, the one the section holds.
 */
const firstRef = '<qti-assessment-item-ref identifier="I1" href="item.xml"/>';

/**
 * The part's limits as the fixture writes them.
 */
const partLimits = '<qti-time-limits max-time="600"/>';

/**
 * The section's limits as the fixture writes them.
 */
const sectionLimits = '<qti-time-limits max-time="300"/>';

/**
 * The fixture with the part's limits taking late submissions.
 *
 * @param text The fixture's text.
 * @returns The variant.
 */
const lateAllowed = rewritten(
  partLimits,
  '<qti-time-limits max-time="600" allow-late-submission="true"/>',
);

/**
 * The fixture with the section's limits held by a `min-time` as well.
 *
 * @param minTime The section's `min-time`, in seconds.
 * @returns The variant.
 */
const sectionHeld = (minTime: number): ((text: string) => string) =>
  rewritten(sectionLimits, `<qti-time-limits min-time="${minTime}" max-time="300"/>`);

/**
 * The element a `qti-time-limits` may sit on.
 */
type Scope = "item-ref" | "part" | "section" | "test";

/**
 * The fixture with one `max-time` only: every limit it writes is dropped and one written on a
 * scope.
 *
 * @param scope The scope that keeps a limit.
 * @param maxTime The `max-time`, in seconds.
 * @returns The variant.
 */
const limitedOnlyOn =
  (scope: Scope, maxTime: number) =>
  (text: string): string => {
    const stripped = text.replaceAll(/<qti-time-limits[^>]*\/>/gu, "");
    const limits = `<qti-time-limits max-time="${maxTime}"/>`;
    switch (scope) {
      case "test": {
        return rewritten("<qti-test-part ", `${limits}<qti-test-part `)(stripped);
      }
      case "part": {
        return rewritten(partOpening, `${partOpening}${limits}`)(stripped);
      }
      case "section": {
        return rewritten(sectionOpening, `${sectionOpening}${limits}`)(stripped);
      }
      case "item-ref": {
        return rewritten(
          firstRef,
          firstRef.replace("/>", `>${limits}</qti-assessment-item-ref>`),
        )(stripped);
      }
      default: {
        return scope satisfies never;
      }
    }
  };

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open the fixture test, rewritten for a variant, and its item for every item ref, through the
 * public `open`.
 *
 * @param edit Rewrites the document's text before it is opened, for a variant of the fixture.
 * @returns The test and its items keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery(
  edit: (text: string) => string = (text) => text,
) {
  const encoder = new TextEncoder();
  const opened = yield* open("tests/test.xml", encoder.encode(edit(fixtureText("test.xml"))));
  const accepted =
    (opened.verdict === "accepted" || opened.verdict === "accepted-with-unsupported") &&
    opened.kind === "test"
      ? opened
      : assert.fail(`test.xml is ${opened.verdict} on a ${opened.kind}`);
  const item = yield* open("tests/item.xml", encoder.encode(fixtureText("item.xml")));
  const choice = Option.getOrElse(acceptedItem(item), () =>
    assert.fail(`item.xml is ${item.verdict}, not an accepted item`),
  );
  const items = new Map<string, Accepted>(
    itemRefs(accepted.accepted).map(({ identifier }) => [identifier, choice]),
  );

  return { items, test: accepted.accepted } satisfies Delivery;
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
 * @param candidate The candidate's supports; none to hand `advance` none.
 * @returns The session after the intent, or `advance`'s failure.
 */
const stepped = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
  candidate: Candidate,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(
    given.test,
    given.items,
    sitting,
    { intent, responses: answer },
    configuration,
    Option.match(candidate, {
      onNone: () => ({ now: atSecond(seconds) }),
      onSome: (supports) => ({ now: atSecond(seconds), supports }),
    }),
  );

/**
 * Advance a session with an intent and {@link answer}, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after the session started.
 * @param candidate The candidate's supports; none to hand `advance` none.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
  candidate: Candidate,
): TestSession =>
  Result.getOrElse(stepped(given, configuration, sitting, intent, seconds, candidate), (failure) =>
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
 * @param candidate The candidate's supports; none to hand `advance` none.
 * @returns The session after the step.
 */
const stayed = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  seconds: number,
  candidate: Candidate,
): TestSession => {
  const shown = sitting.items[sitting.position] ?? assert.fail("the session shows no current item");

  return advanced(
    given,
    configuration,
    sitting,
    { kind: "go", sequenceIndex: shown.sequenceIndex },
    seconds,
    candidate,
  );
};

/**
 * Sit on the first item at a time.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param seconds When the session last saved, in seconds after it started.
 * @param candidate The candidate's supports.
 * @returns The session, on `I1`, inside the section.
 */
const onFirstItem = (
  given: Delivery,
  configuration: Configuration,
  seconds: number,
  candidate: Candidate,
): TestSession => stayed(given, configuration, started(given, configuration), seconds, candidate);

/**
 * Sit on the second item at a time: the candidate answers the first item after one second and
 * moves on, so the part, which holds both items, has used as much time as the session has run,
 * and the section, which holds the first item only, is out of force.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param seconds When the session last saved, in seconds after it started.
 * @param candidate The candidate's supports.
 * @returns The session, on `I2`, outside the section.
 */
const onSecondItem = (
  given: Delivery,
  configuration: Configuration,
  seconds: number,
  candidate: Candidate,
): TestSession => {
  const moved = advanced(
    given,
    configuration,
    started(given, configuration),
    { kind: "next" },
    1,
    candidate,
  );

  return stayed(given, configuration, moved, seconds, candidate);
};

/**
 * Read a session's navigation, failing the test when it cannot be read.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @param candidate The candidate's supports; none to read it with none.
 * @returns The navigation.
 */
const navigationOf = (given: Delivery, sitting: TestSession, candidate: Candidate) =>
  Result.getOrElse(
    navigationState(given.test, sitting, Option.getOrUndefined(candidate)),
    (failure) => assert.fail(`navigationState failed: ${failure.message}`),
  );

/**
 * Read the time a session's navigation carries, failing the test when it carries none.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @param candidate The candidate's supports; none to read it with none.
 * @returns The navigation's `time`.
 */
const timeIn = (given: Delivery, sitting: TestSession, candidate: Candidate): TimeState =>
  Option.getOrElse(Option.fromUndefinedOr(navigationOf(given, sitting, candidate).time), () =>
    assert.fail("the navigation carries no time"),
  );

/**
 * Render a session's navigation in the default order and parse it back.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param candidate The candidate's supports; none to read the navigation with none.
 * @returns The rendered nodes.
 */
const rendered = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  candidate: Candidate,
): readonly Node[] =>
  parseHtml(
    Result.getOrElse(
      renderNavigation(navigationOf(given, sitting, candidate), configuration),
      (failure) => assert.fail(`renderNavigation failed: ${failure.message}`),
    ),
  );

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
 * Give what the rendered `time` part's status region says.
 *
 * @param nodes The rendered navigation.
 * @returns The region's text, empty when it says nothing.
 */
const noticeIn = (nodes: readonly Node[]): string =>
  textIn(theElement(nodes, "data-time", "notice"));

/**
 * Check that `advance` refused an intent through the time-limits module's `min-time`: an
 * `IntentRefused` under the rule `feature`, naming `qti-time-limits` and its rule `min-time`.
 *
 * @param result What `advance` returned.
 * @returns The refusal's detail.
 */
const minTimeRefusal = (result: Result.Result<TestSession, AdvanceFailure>): string => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );
  if (!(failure instanceof IntentRefused)) {
    assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
  }

  const feature = Option.getOrElse(failure.feature, () =>
    assert.fail(`expected a feature refusal, not ${failure.message}`),
  );
  assert.strictEqual(failure.rule, "feature");
  assert.strictEqual(feature.feature, "qti-time-limits");
  assert.strictEqual(feature.rule, "min-time");

  return feature.detail;
};

/**
 * Say what `advance` did, so two runs compare without comparing refusals by identity: the session
 * it gave, or the message it refused with.
 *
 * @param result What `advance` returned.
 * @returns The session or the message.
 */
const outcomeOf = (result: Result.Result<TestSession, AdvanceFailure>): string | TestSession =>
  Result.match(result, { onFailure: (failure) => failure.message, onSuccess: (after) => after });

describe("additional testing time", () => {
  it("[A-6] allowedMaxTime multiplies, adds minutes as seconds, and lifts", () => {
    assert.deepStrictEqual(allowedMaxTime(600, Option.none()), Option.some(600));
    assert.deepStrictEqual(
      allowedMaxTime(600, Option.some({ factor: 1.5, kind: "multiplier" })),
      Option.some(900),
    );
    assert.deepStrictEqual(
      allowedMaxTime(300, Option.some({ factor: 1.5, kind: "multiplier" })),
      Option.some(450),
    );
    assert.deepStrictEqual(
      allowedMaxTime(600, Option.some({ kind: "minutes", minutes: 10 })),
      Option.some(1200),
    );
    assert.deepStrictEqual(allowedMaxTime(600, Option.some({ kind: "unlimited" })), Option.none());
  });

  it.effect("[A-6] without additional time the limits are m3f-01's", () =>
    Effect.gen(function* unextended() {
      const configuration = yield* configure({});
      const held = yield* delivery(sectionHeld(60));
      const plain = yield* delivery();

      for (const candidate of [passingNone, passingNoSupports]) {
        const atFifty = onFirstItem(plain, configuration, 50, candidate);
        assert.deepStrictEqual(timeIn(plain, atFifty, candidate), {
          allowLateSubmission: false,
          minTimeLeft: Option.none(),
          timeLeft: Option.some(250),
        });

        const atSeven = onSecondItem(plain, configuration, 700, candidate);
        assert.deepStrictEqual(timeIn(plain, atSeven, candidate).timeLeft, Option.some(0));
      }

      for (const seconds of [30, 59, 60, 61]) {
        const sitting = started(held, configuration);
        const bare = stepped(held, configuration, sitting, { kind: "next" }, seconds, passingNone);
        const none = stepped(
          held,
          configuration,
          sitting,
          { kind: "next" },
          seconds,
          passingNoSupports,
        );
        assert.deepStrictEqual(outcomeOf(none), outcomeOf(bare), `next at ${seconds} s`);
        assert.strictEqual(Result.isFailure(bare), seconds < 60, `next at ${seconds} s`);
      }
    }),
  );

  it.effect("[A-6] a multiplier of 1.5 extends a test part's 600 seconds to 900", () =>
    Effect.gen(function* partMultiplied() {
      const configuration = yield* configure({});
      const given = yield* delivery();
      const late = yield* delivery(lateAllowed);

      const atSeven = onSecondItem(given, configuration, 700, multiplier);
      assert.deepStrictEqual(timeIn(given, atSeven, multiplier).timeLeft, Option.some(200));
      assert.deepStrictEqual(
        timeIn(given, onSecondItem(given, configuration, 700, passingNone), passingNone).timeLeft,
        Option.some(0),
      );
      assert.isTrue(
        Result.isSuccess(
          stepped(given, configuration, atSeven, { kind: "submit-item" }, 701, multiplier),
        ),
      );

      const nearEnd = onSecondItem(given, configuration, 899, multiplier);
      assert.deepStrictEqual(timeIn(given, nearEnd, multiplier).timeLeft, Option.some(1));

      const afterEnd = onSecondItem(late, configuration, 901, multiplier);
      assert.deepStrictEqual(timeIn(late, afterEnd, multiplier).timeLeft, Option.some(0));
    }),
  );

  it.effect("[A-6] fixed minutes of 10 extend 600 seconds to 1200", () =>
    Effect.gen(function* partExtended() {
      const configuration = yield* configure({});
      const given = yield* delivery();
      const late = yield* delivery(lateAllowed);

      const atEleven = onSecondItem(given, configuration, 1100, tenMinutes);
      assert.deepStrictEqual(timeIn(given, atEleven, tenMinutes).timeLeft, Option.some(100));
      assert.isTrue(
        Result.isSuccess(
          stepped(given, configuration, atEleven, { kind: "submit-item" }, 1101, tenMinutes),
        ),
      );

      const nearEnd = onSecondItem(given, configuration, 1199, tenMinutes);
      assert.deepStrictEqual(timeIn(given, nearEnd, tenMinutes).timeLeft, Option.some(1));

      const afterEnd = onSecondItem(late, configuration, 1201, tenMinutes);
      assert.deepStrictEqual(timeIn(late, afterEnd, tenMinutes).timeLeft, Option.some(0));
    }),
  );

  it.effect("[A-6] unlimited lifts every max-time", () =>
    Effect.gen(function* limitsLifted() {
      const configuration = yield* configure({});
      const given = yield* delivery();

      for (const sitting of [
        onFirstItem(given, configuration, 100_000, unlimited),
        onSecondItem(given, configuration, 100_000, unlimited),
      ]) {
        assert.deepStrictEqual(timeIn(given, sitting, unlimited), {
          allowLateSubmission: false,
          minTimeLeft: Option.none(),
          timeLeft: Option.none(),
        });

        const nodes = rendered(given, configuration, sitting, unlimited);
        assert.deepStrictEqual(elementsWith(nodes, "data-time", "left"), []);
        assert.strictEqual(noticeIn(nodes), "");
        assert.isTrue(
          Result.isSuccess(
            stepped(given, configuration, sitting, { kind: "submit-item" }, 100_001, unlimited),
          ),
        );
      }
    }),
  );

  it.effect("[A-6] the extension applies to every max-time in force", () =>
    Effect.gen(function* everyLimit() {
      const configuration = yield* configure({});
      const given = yield* delivery();

      const inSection = onFirstItem(given, configuration, 100, multiplier);
      assert.deepStrictEqual(timeIn(given, inSection, multiplier).timeLeft, Option.some(350));

      const inPart = onSecondItem(given, configuration, 100, multiplier);
      assert.deepStrictEqual(timeIn(given, inPart, multiplier).timeLeft, Option.some(800));

      const written: readonly (readonly [Scope, number])[] = [
        ["test", 1000],
        ["part", 600],
        ["section", 300],
        ["item-ref", 90],
      ];
      const candidates: readonly (readonly [
        Candidate,
        (maxTime: number) => Option.Option<number>,
      ])[] = [
        [multiplier, (maxTime) => Option.some(maxTime * 1.5)],
        [tenMinutes, (maxTime) => Option.some(maxTime + 600)],
        [unlimited, () => Option.none()],
      ];
      for (const [scope, maxTime] of written) {
        const alone = yield* delivery(limitedOnlyOn(scope, maxTime));
        for (const [candidate, allowed] of candidates) {
          const sitting = onFirstItem(alone, configuration, 10, candidate);
          assert.deepStrictEqual(
            timeIn(alone, sitting, candidate).timeLeft,
            Option.map(allowed(maxTime), (seconds) => seconds - 10),
            `${scope} max-time of ${maxTime} s`,
          );
        }
      }
    }),
  );

  it.effect("[A-6] min-time is not extended", () =>
    Effect.gen(function* minTimeUnextended() {
      const configuration = yield* configure({});
      const held = yield* delivery(sectionHeld(60));

      for (const candidate of [multiplier, tenMinutes, unlimited]) {
        const sitting = started(held, configuration);
        const refused = minTimeRefusal(
          stepped(held, configuration, sitting, { kind: "next" }, 59, candidate),
        );
        assert.include(refused, "min-time of 60 seconds");
        assert.isTrue(
          Result.isSuccess(stepped(held, configuration, sitting, { kind: "next" }, 60, candidate)),
        );

        const atThirty = onFirstItem(held, configuration, 30, candidate);
        assert.deepStrictEqual(timeIn(held, atThirty, candidate).minTimeLeft, Option.some(30));
      }
    }),
  );

  it.effect(
    "[A-6] a max-time wins over a longer min-time only once the extended limit has run",
    () =>
      Effect.gen(function* maxTimeWins() {
        const configuration = yield* configure({});
        const held = yield* delivery(sectionHeld(400));
        const next: Intent = { kind: "next" };
        const sitting = started(held, configuration);

        assert.isTrue(
          Result.isSuccess(stepped(held, configuration, sitting, next, 350, passingNone)),
        );

        minTimeRefusal(stepped(held, configuration, sitting, next, 350, multiplier));
        assert.isTrue(
          Result.isSuccess(stepped(held, configuration, sitting, next, 401, multiplier)),
        );

        const atThreeFifty = onFirstItem(held, configuration, 350, multiplier);
        const offered = (candidate: Candidate): readonly string[] =>
          Result.getOrElse(
            allowedIntents(held.test, atThreeFifty, undefined, Option.getOrUndefined(candidate)),
            (failure) => assert.fail(`allowedIntents failed: ${failure.message}`),
          ).map(encodeIntent);
        assert.notInclude(offered(multiplier), encodeIntent(next));
        assert.notInclude(
          navigationOf(held, atThreeFifty, multiplier).allowed.map(encodeIntent),
          encodeIntent(next),
        );
        assert.include(offered(passingNone), encodeIntent(next));
        assert.include(
          navigationOf(held, atThreeFifty, passingNone).allowed.map(encodeIntent),
          encodeIntent(next),
        );

        minTimeRefusal(stepped(held, configuration, sitting, next, 399, unlimited));
        assert.isTrue(
          Result.isSuccess(stepped(held, configuration, sitting, next, 400, unlimited)),
        );
      }),
  );

  it.effect("[A-6] the time part shows the extended time left", () =>
    Effect.gen(function* timeShown() {
      const configuration = yield* configure({});
      const given = yield* delivery();
      const sitting = onSecondItem(given, configuration, 100, multiplier);

      const extended = theElement(
        rendered(given, configuration, sitting, multiplier),
        "data-time",
        "left",
      );
      assert.strictEqual(extended.attrs["data-seconds"], "800");
      assert.strictEqual(textIn(extended), "Time left: 13:20");

      const written = theElement(
        rendered(given, configuration, sitting, passingNone),
        "data-time",
        "left",
      );
      assert.strictEqual(written.attrs["data-seconds"], "500");
    }),
  );

  it.effect("[A-6] the expiry warning fires relative to the extended limit", () =>
    Effect.gen(function* warningMoves() {
      const configuration = yield* configure({});
      const given = yield* delivery();
      const noticeAt = (seconds: number, candidate: Candidate): string =>
        noticeIn(
          rendered(
            given,
            configuration,
            onSecondItem(given, configuration, seconds, candidate),
            candidate,
          ),
        );

      const warning = noticeAt(541, passingNone);
      assert.notStrictEqual(warning, "");

      assert.strictEqual(noticeAt(541, multiplier), "");
      assert.strictEqual(noticeAt(839, multiplier), "");
      assert.strictEqual(noticeAt(841, multiplier), warning);
      assert.strictEqual(noticeAt(1141, tenMinutes), warning);
    }),
  );

  it.effect("[A-6] a late submission after the extended limit follows allow-late-submission", () =>
    Effect.gen(function* lateAfterExtension() {
      const configuration = yield* configure({});
      const refusing = yield* delivery();
      const taking = yield* delivery(lateAllowed);

      const whenLate = onSecondItem(taking, configuration, 901, multiplier);
      assert.strictEqual(timeIn(taking, whenLate, multiplier).allowLateSubmission, true);
      assert.isTrue(
        Result.isSuccess(
          stepped(taking, configuration, whenLate, { kind: "submit-item" }, 902, multiplier),
        ),
      );

      const lateNotice = noticeIn(rendered(taking, configuration, whenLate, multiplier));
      assert.include(lateNotice, "Late answers are still accepted");

      const whenOver = onSecondItem(refusing, configuration, 901, multiplier);
      assert.strictEqual(timeIn(refusing, whenOver, multiplier).allowLateSubmission, false);

      const overNotice = noticeIn(rendered(refusing, configuration, whenOver, multiplier));
      assert.notStrictEqual(overNotice, "");
      assert.notInclude(overNotice, "Late answers are still accepted");

      const beforeEnd = onSecondItem(taking, configuration, 700, multiplier);
      assert.strictEqual(noticeIn(rendered(taking, configuration, beforeEnd, multiplier)), "");
    }),
  );

  it.effect("[A-6] a PNP with a time multiplier extends the limits as its Supports does", () =>
    Effect.gen(function* fromPnp() {
      const configuration = yield* configure({});
      const given = yield* delivery();
      const read = Option.some(yield* readPnp(pnpBytes("pnp-additional-time.xml")));
      assert.deepStrictEqual(
        read.pipe(Option.map((supports) => supports.additionalTestingTime)),
        Option.some(Option.some({ factor: 1.5, kind: "multiplier" })),
      );

      const atSeven = onSecondItem(given, configuration, 700, read);
      assert.deepStrictEqual(timeIn(given, atSeven, read).timeLeft, Option.some(200));
      assert.deepStrictEqual(
        timeIn(given, atSeven, read),
        timeIn(given, onSecondItem(given, configuration, 700, multiplier), multiplier),
      );

      const nodes = rendered(
        given,
        configuration,
        onSecondItem(given, configuration, 100, read),
        read,
      );
      assert.strictEqual(theElement(nodes, "data-time", "left").attrs["data-seconds"], "800");
    }),
  );
});
