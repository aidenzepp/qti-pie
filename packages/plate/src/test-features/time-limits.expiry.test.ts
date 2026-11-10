import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  allowedIntents,
  configure,
  current,
  decodeSession,
  encodeIntent,
  encodeSession,
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
  ItemView,
  Responses,
  TimeState,
} from "#plate/index.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import type { SessionItem, TestSession } from "#plate/session/session.ts";
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
 * Give the responses that choose one choice of `choice.xml`.
 *
 * @param choice The choice's identifier.
 * @returns The responses.
 */
const choosing = (choice: "A" | "B"): Responses => ({
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: choice }],
  },
});

/**
 * The responses a candidate saves before a limit runs out: the choice `A`, the correct response.
 */
const answer = choosing("A");

/**
 * The responses a request posts once a limit has run out: the choice `B`, which no expiry saves.
 */
const late = choosing("B");

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
 * @param replacement What stands in its place.
 * @returns The rewrite of a fixture's text.
 */
const retimed =
  (written: string, replacement: string) =>
  (text: string): string =>
    text.includes(written)
      ? text.replace(written, replacement)
      : assert.fail(`the fixture holds no ${written}`);

/**
 * The test's own limit in `expiry.xml`, which a variant tightens.
 */
const testLimits = '<qti-time-limits max-time="900"/>';

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a test of `fixtures/m3f/time-limits` at `tests/<name>.xml`, and `choice.xml` beside it for
 * every item ref, through the public `open`.
 *
 * @param name The test document's name without its extension.
 * @param edit Rewrites the document's text before it is opened, for a variant of the fixture.
 * @returns The test and its items keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery(
  name: "expiry" | "late",
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
 * Advance a session with an intent and some responses, leaving the result as `advance` gave it.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after the session started.
 * @param responses The responses the request posts.
 * @returns The session after the intent, or `advance`'s failure.
 */
const stepped = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
  responses: Responses,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(given.test, given.items, sitting, { intent, responses }, configuration, {
    now: atSecond(seconds),
  });

/**
 * Advance a session with an intent and some responses, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after the session started.
 * @param responses The responses the request posts.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  intent: Intent,
  seconds: number,
  responses: Responses,
): TestSession =>
  Result.getOrElse(stepped(given, configuration, sitting, intent, seconds, responses), (failure) =>
    assert.fail(`advance refused ${encodeIntent(intent)} at ${seconds} s: ${failure.message}`),
  );

/**
 * Save {@link answer} on the current item and stay there at a time, through `go` to its own
 * sequence index.
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
    answer,
  );
};

/**
 * Post `next` with {@link answer} once a second from 1 s, submitting each item of a linear part
 * as it is left.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @param count How many times, the last at `count` seconds.
 * @returns The session after the last `next`.
 */
const nextsFrom = (
  given: Delivery,
  configuration: Configuration,
  sitting: TestSession,
  count: number,
): TestSession => {
  let session = sitting;
  for (let seconds = 1; seconds <= count; seconds += 1) {
    session = advanced(given, configuration, session, { kind: "next" }, seconds, answer);
  }

  return session;
};

/**
 * Give the session item of an item ref, failing the test when the session holds none.
 *
 * @param sitting The session.
 * @param ref The item ref's identifier.
 * @returns The session item.
 */
const itemOf = (sitting: TestSession, ref: string): SessionItem =>
  sitting.items.find((item) => item.ref === ref) ?? assert.fail(`the session holds no ${ref}`);

/**
 * Give the values the record of an item holds for its `RESPONSE`, none for a NULL or absent one.
 *
 * @param item The session item.
 * @returns The values.
 */
const recorded = (item: SessionItem): readonly unknown[] => {
  const response = item.record.responses["RESPONSE"];

  return response === undefined ? [] : response.values;
};

/**
 * The value {@link answer} posts, as a record holds it.
 */
const chosenA = { baseType: "identifier", value: "A" };

/**
 * The value {@link late} posts, as a record would hold it.
 */
const chosenB = { baseType: "identifier", value: "B" };

/**
 * Check that an item was submitted once with {@link answer}, and holds nothing of {@link late}.
 *
 * @param item The session item.
 */
const assertSubmittedWithA = (item: SessionItem): void => {
  assert.strictEqual(item.record.attempt, "submitted", item.ref);
  assert.deepStrictEqual(recorded(item), [chosenA], item.ref);
};

/**
 * Check that an item was submitted with no value equal to {@link late}'s.
 *
 * @param item The session item.
 */
const assertSubmittedWithoutB = (item: SessionItem): void => {
  assert.strictEqual(item.record.attempt, "submitted", item.ref);
  assert.notDeepInclude(recorded(item), chosenB, item.ref);
};

/**
 * Check that an item the candidate never met was ended without an attempt and locked.
 *
 * @param item The session item.
 */
const assertNeverMet = (item: SessionItem): void => {
  assert.isFalse(item.presented, item.ref);
  assert.strictEqual(item.record.attempt, "none", item.ref);
  assert.isTrue(item.locked, item.ref);
};

/**
 * Give the item a session shows now, failing the test when it shows a summary or `current` fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param sitting The session.
 * @returns The item's view.
 */
const shownIn = (given: Delivery, configuration: Configuration, sitting: TestSession): ItemView => {
  const shown = Result.getOrElse(current(given.test, sitting, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown : assert.fail("the session shows its summary");
};

/**
 * Read the time a session's navigation carries, failing the test when it carries none.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @returns The navigation's `time`.
 */
const timeIn = (given: Delivery, sitting: TestSession): TimeState => {
  const state = Result.getOrElse(navigationState(given.test, sitting), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

  return state.time ?? assert.fail("the navigation carries no time");
};

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
 * The posted value of `submit-item`.
 */
const submitItem = encodeIntent({ kind: "submit-item" });

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
 * Encode a session and decode it against its test, failing the test when either refuses.
 *
 * @param given The test and its items.
 * @param sitting The session.
 * @returns The session as the host hands it back.
 */
const throughHost = (given: Delivery, sitting: TestSession): TestSession =>
  Result.getOrElse(
    Result.flatMap(encodeSession(sitting), (stored) => {
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the session survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
      const handedBack: unknown = JSON.parse(JSON.stringify(stored));

      return decodeSession(handedBack, given.test);
    }),
    (failure) => assert.fail(`the session did not survive the host: ${failure.message}`),
  );

/**
 * A session of `expiry.xml` at `i1`, the item ref whose `max-time` is 60, with {@link answer}
 * saved on it at 10 s.
 */
interface AtTimedItem {
  readonly configuration: Configuration;
  readonly given: Delivery;
  readonly sitting: TestSession;
}

/**
 * Reach `i1` of `expiry.xml` (or a variant) through `next` at 1 s and 2 s, saving {@link answer}
 * on it at 10 s when asked to.
 *
 * @param saving Whether to save {@link answer} on `i1` at 10 s.
 * @param edit Rewrites the test's text, for a variant.
 * @returns The delivery, the configuration and the session.
 */
const atTimedItem = Effect.fnUntraced(function* atTimedItem(
  saving: boolean,
  edit: (text: string) => string = (text) => text,
) {
  const configuration = yield* configure({});
  const given = yield* delivery("expiry", edit);
  const reached = nextsFrom(given, configuration, started(given, configuration), 2);
  assert.strictEqual(itemOf(reached, "i1"), reached.items[reached.position]);

  return {
    configuration,
    given,
    sitting: saving ? stayed(given, configuration, reached, 10) : reached,
  } satisfies AtTimedItem;
});

/**
 * The session of `expiry.xml` in the nonlinear part `P2`, at `p2a` (`max-time` 60) with
 * {@link answer} saved on it at 10 s, and after the `go` to `p2b` posted at 70 s, by when `p2a`
 * has used 66 s.
 */
interface NonlinearExpiry extends AtTimedItem {
  readonly expiredAt: TestSession;
}

/**
 * Walk `expiry.xml` into `P2` through `next` at 1 s to 4 s, save {@link answer} on `p2a` at
 * 10 s, then post `go` to `p2b` with {@link answer} at 70 s.
 *
 * @returns The delivery, the configuration, the session before the `go` and the one after it.
 */
const nonlinearExpiry = Effect.fnUntraced(function* nonlinearExpiry() {
  const configuration = yield* configure({});
  const given = yield* delivery("expiry");
  const inP2 = nextsFrom(given, configuration, started(given, configuration), 4);
  assert.strictEqual(inP2.items[inP2.position]?.ref, "p2a");

  const sitting = stayed(given, configuration, inP2, 10);
  const expiredAt = advanced(
    given,
    configuration,
    sitting,
    { kind: "go", sequenceIndex: itemOf(sitting, "p2b").sequenceIndex },
    70,
    answer,
  );

  return { configuration, expiredAt, given, sitting } satisfies NonlinearExpiry;
});

describe("time limits at max-time", () => {
  it.effect(
    "[I-16] a submit-item past an item's max-time saves nothing and submits the item with its saved responses",
    () =>
      Effect.gen(function* submitPastItem() {
        const { configuration, given, sitting } = yield* atTimedItem(true);
        const after = advanced(given, configuration, sitting, { kind: "submit-item" }, 90, late);

        const i1 = itemOf(after, "i1");
        assertSubmittedWithA(i1);
        assert.isTrue(i1.locked);
        assert.deepStrictEqual(after.expired, [{ identifier: "i1", kind: "item-ref" }]);
        assert.strictEqual(shownIn(given, configuration, after).ref, "s2a");
      }),
  );

  it.effect(
    "[I-16] a next past an item's max-time in a linear part moves on with the saved responses submitted, and the host reads the expiry",
    () =>
      Effect.gen(function* nextPastItem() {
        const { configuration, given, sitting } = yield* atTimedItem(true);
        const after = advanced(given, configuration, sitting, { kind: "next" }, 70, late);

        const i1 = itemOf(after, "i1");
        assertSubmittedWithA(i1);
        assert.isTrue(i1.locked);
        assert.deepStrictEqual(after.expired.slice(sitting.expired.length), [
          { identifier: "i1", kind: "item-ref" },
        ]);
        assert.strictEqual(shownIn(given, configuration, after).ref, "s2a");
      }),
  );

  it.effect(
    "[I-16] with no saved response an item past its max-time is submitted with its NULL",
    () =>
      Effect.gen(function* nullPastItem() {
        const { configuration, given, sitting } = yield* atTimedItem(false);
        const after = advanced(given, configuration, sitting, { kind: "next" }, 70, late);

        const i1 = itemOf(after, "i1");
        assert.strictEqual(i1.record.attempt, "submitted");
        assert.strictEqual(i1.record.numAttempts, 1);
        assert.deepStrictEqual(recorded(i1), []);
      }),
  );

  it.effect("[S-2] a section's max-time submits the items met and leaves the section", () =>
    Effect.gen(function* sectionMet() {
      const configuration = yield* configure({});
      const given = yield* delivery("expiry");
      const saved = stayed(given, configuration, started(given, configuration), 10);
      const atS1b = advanced(given, configuration, saved, { kind: "next" }, 20, answer);
      assert.strictEqual(atS1b.items[atS1b.position]?.ref, "s1b");

      const after = advanced(given, configuration, atS1b, { kind: "submit-item" }, 130, late);

      assertSubmittedWithA(itemOf(after, "s1a"));
      assertSubmittedWithoutB(itemOf(after, "s1b"));
      assert.isTrue(itemOf(after, "s1a").locked);
      assert.isTrue(itemOf(after, "s1b").locked);
      assert.strictEqual(shownIn(given, configuration, after).ref, "i1");
      assert.deepStrictEqual(after.expired, [{ identifier: "S1", kind: "section" }]);
    }),
  );

  it.effect(
    "[S-2] an item of an expired section the candidate never met is ended without an attempt",
    () =>
      Effect.gen(function* sectionUnmet() {
        const configuration = yield* configure({});
        const given = yield* delivery("expiry");
        const saved = stayed(given, configuration, started(given, configuration), 10);
        const after = advanced(given, configuration, saved, { kind: "submit-item" }, 130, late);

        assertSubmittedWithA(itemOf(after, "s1a"));
        assertNeverMet(itemOf(after, "s1b"));
        assert.strictEqual(shownIn(given, configuration, after).ref, "i1");
      }),
  );

  it.effect("[T-6] a part's max-time ends the part and makes the next part current", () =>
    Effect.gen(function* partExpiry() {
      const configuration = yield* configure({});
      const given = yield* delivery("expiry");
      const inP2 = nextsFrom(given, configuration, started(given, configuration), 4);
      assert.strictEqual(inP2.items[inP2.position]?.ref, "p2a");

      const after = advanced(
        given,
        configuration,
        inP2,
        { kind: "go", sequenceIndex: itemOf(inP2, "p2b").sequenceIndex },
        310,
        answer,
      );

      assert.deepStrictEqual(after.parts, [
        { identifier: "P1", status: "ended" },
        { identifier: "P2", status: "ended" },
        { identifier: "P3", status: "current" },
      ]);
      assert.strictEqual(shownIn(given, configuration, after).ref, "p3a");

      const p2a = itemOf(after, "p2a");
      assert.strictEqual(p2a.record.attempt, "submitted");
      assert.notDeepInclude(recorded(p2a), chosenA);
      assert.isTrue(p2a.locked);
      assertNeverMet(itemOf(after, "p2b"));
      assert.deepStrictEqual(after.expired, [{ identifier: "P2", kind: "part" }]);
    }),
  );

  it.effect("[T-2] the test's max-time closes the session with every part ended", () =>
    Effect.gen(function* testExpiry() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        "expiry",
        retimed(testLimits, '<qti-time-limits max-time="100"/>'),
      );
      const saved = stayed(given, configuration, started(given, configuration), 10);
      const after = advanced(given, configuration, saved, { kind: "submit-item" }, 110, late);

      assert.strictEqual(after.status, "closed");
      assert.isTrue(after.parts.every((part) => part.status === "ended"));
      assertSubmittedWithA(itemOf(after, "s1a"));
      for (const item of after.items.filter((each) => each.ref !== "s1a")) {
        assertNeverMet(item);
      }
      assert.isTrue(after.items.every((item) => item.locked));
      assert.deepStrictEqual(after.expired, [{ identifier: "expiry", kind: "test" }]);
    }),
  );

  it.effect(
    "[T-2] [I-16] when an item's and the test's max-time have both run out, the widest scope expires and the test closes in one step",
    () =>
      Effect.gen(function* widestScope() {
        const { configuration, given, sitting } = yield* atTimedItem(
          true,
          retimed(testLimits, '<qti-time-limits max-time="62"/>'),
        );
        const after = advanced(given, configuration, sitting, { kind: "submit-item" }, 70, late);

        assert.strictEqual(after.status, "closed");

        const i1 = itemOf(after, "i1");
        assertSubmittedWithA(i1);
        assert.isTrue(i1.locked);
        assert.deepStrictEqual(after.expired, [{ identifier: "expiry", kind: "test" }]);
      }),
  );

  it.effect("[T-2] with allow-late-submission true nothing locks", () =>
    Effect.gen(function* lateAccepted() {
      const configuration = yield* configure({});
      const given = yield* delivery("late");
      const after = advanced(
        given,
        configuration,
        started(given, configuration),
        { kind: "submit-item" },
        90,
        answer,
      );

      const item = after.items[after.position] ?? assert.fail("no current item");
      assert.strictEqual(item.record.numAttempts, 1);
      assert.isFalse(item.locked);
      assert.deepStrictEqual(after.expired, []);
      assert.isTrue(timeIn(given, after).allowLateSubmission);
    }),
  );

  it.effect(
    "[I-16] in a nonlinear part an item's max-time locks that item where it stands and a later go leaves it",
    () =>
      Effect.gen(function* nonlinearItem() {
        const { configuration, expiredAt, given } = yield* nonlinearExpiry();

        const stillShown = shownIn(given, configuration, expiredAt);
        assert.strictEqual(stillShown.ref, "p2a");
        assert.isTrue(stillShown.disabled);

        const p2a = itemOf(expiredAt, "p2a");
        assertSubmittedWithA(p2a);
        assert.isTrue(p2a.locked);

        const p2b = itemOf(expiredAt, "p2b");
        assert.isFalse(p2b.locked);
        assert.isFalse(p2b.presented);
        assert.deepStrictEqual(expiredAt.expired, [{ identifier: "p2a", kind: "item-ref" }]);

        const moved = advanced(
          given,
          configuration,
          expiredAt,
          { kind: "go", sequenceIndex: p2b.sequenceIndex },
          71,
          answer,
        );
        const shown = shownIn(given, configuration, moved);
        assert.strictEqual(shown.ref, "p2b");
        assert.isFalse(shown.disabled);
      }),
  );

  it.effect(
    "[I-16] after the expiry step allowedIntents no longer offers submit-item for the locked item",
    () =>
      Effect.gen(function* notOffered() {
        const { configuration, expiredAt, given } = yield* nonlinearExpiry();
        assert.notInclude(allowedNow(given, expiredAt), submitItem);

        const moved = advanced(
          given,
          configuration,
          expiredAt,
          { kind: "go", sequenceIndex: itemOf(expiredAt, "p2b").sequenceIndex },
          71,
          answer,
        );
        assert.include(allowedNow(given, moved), submitItem);
      }),
  );

  it.effect("[I-16] a timer read after the expiry step reports timeLeft 0 and no min-time", () =>
    Effect.gen(function* timerRead() {
      const { expiredAt, given } = yield* nonlinearExpiry();

      assert.deepStrictEqual(timeIn(given, expiredAt), {
        allowLateSubmission: false,
        minTimeLeft: Option.none(),
        timeLeft: Option.some(0),
      });
    }),
  );

  it.effect("[I-16] the time part announces the expiry and shows no min-time", () =>
    Effect.gen(function* timeNotice() {
      const { configuration, expiredAt, given } = yield* nonlinearExpiry();
      const shown = rendered(given, configuration, expiredAt);

      assert.notStrictEqual(textIn(theElement(shown, "data-time", "notice")), "");
      assert.deepStrictEqual(elementsWith(shown, "data-time", "min"), []);
    }),
  );

  it.effect(
    "[I-16] a session after an expiry restores exactly through encodeSession and decodeSession, the lock included",
    () =>
      Effect.gen(function* restored() {
        const { expiredAt, given } = yield* nonlinearExpiry();
        const back = throughHost(given, expiredAt);

        assert.deepStrictEqual(back, expiredAt);
        assert.isTrue(itemOf(back, "p2a").locked);
        assert.deepStrictEqual(back.expired, [{ identifier: "p2a", kind: "item-ref" }]);
        assert.notInclude(allowedNow(given, back), submitItem);
      }),
  );
});
