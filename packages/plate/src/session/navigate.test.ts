import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { move, moveTarget } from "#plate/session/navigate.ts";
import type { MoveIntent, MoveRefused, MoveRule, MoveStep } from "#plate/session/navigate.ts";
import type { UnknownItemRef } from "#plate/session/control.ts";
import type { TestSession } from "#plate/session/session.ts";
import { current, startTest } from "#plate/session/start.ts";
import type {
  InvalidTime,
  ItemNotInSession,
  ItemView,
  TestNotDeliverable,
} from "#plate/session/start.ts";
import { integer } from "#plate/test/fixtures.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import type { NavigationMode, SubmissionMode } from "#plate/vocabulary.ts";

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * Give a time some milliseconds after {@link startedAt}.
 *
 * @param milliseconds The offset.
 * @returns The time.
 */
const after = (milliseconds: number): Date => new Date(startedAt.getTime() + milliseconds);

/**
 * The choice `A`, as a single identifier: what a candidate picks on item 1.
 */
const choiceA: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "A" }],
};

/**
 * The default an item built with one declares for `RESPONSE`: the choice `B`.
 */
const choiceB: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "B" }],
};

/**
 * The NULL single identifier, the value of a Choice response nothing has set.
 */
const nullChoice = nullOf("identifier", "single");

/**
 * The intent `next`.
 */
const next: MoveIntent = { kind: "next" };

/**
 * The intent `previous`.
 */
const previous: MoveIntent = { kind: "previous" };

/**
 * Give the intent `go` to a sequence index.
 *
 * @param sequenceIndex The sequence index.
 * @returns The intent.
 */
const go = (sequenceIndex: number): MoveIntent => ({ kind: "go", sequenceIndex });

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `move`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * One test part of a hand-built test: its modes and its item refs' identifiers, in one section.
 */
interface PartSpec {
  readonly identifier: string;
  readonly navigation: NavigationMode;
  readonly refs: readonly string[];
  readonly submission: SubmissionMode;
}

/**
 * Give a one-part test's part.
 *
 * @param navigation The part's navigation mode.
 * @param submission The part's submission mode.
 * @param refs The item refs' identifiers.
 * @returns The part, named `part`.
 */
const onePart = (
  navigation: NavigationMode,
  submission: SubmissionMode,
  refs: readonly string[],
): readonly PartSpec[] => [{ identifier: "part", navigation, refs, submission }];

/**
 * Write the text of a hand-built item: one Choice of `A`, `B` and `C` bound to the single
 * identifier `RESPONSE`.
 *
 * @param identifier The item's identifier.
 * @param defaultValue Whether `RESPONSE` declares the default `B`.
 * @returns The item's text.
 */
const itemXml = (identifier: string, defaultValue: boolean): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    defaultValue ? "<qti-default-value><qti-value>B</qti-value></qti-default-value>" : "",
    "</qti-response-declaration><qti-item-body>",
    '<qti-choice-interaction response-identifier="RESPONSE">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test: each part holds one section that holds its item refs, each
 * ref's `href` its identifier and `.xml`.
 *
 * @param identifier The test's identifier.
 * @param parts The parts.
 * @returns The test's text.
 */
const testXml = (identifier: string, parts: readonly PartSpec[]): string =>
  [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    ...parts.flatMap((part) => [
      `<qti-test-part identifier="${part.identifier}" navigation-mode="${part.navigation}" submission-mode="${part.submission}">`,
      `<qti-assessment-section identifier="${part.identifier}-section" title="Section" visible="true">`,
      ...part.refs.map((ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`),
      "</qti-assessment-section></qti-test-part>",
    ]),
    "</qti-assessment-test>",
  ].join("");

/**
 * Open a document and require an accepted item.
 *
 * @param location The document's location.
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
 * @param location The document's location.
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
 * Open a hand-built test at `tests/<identifier>.xml` and its items beside it, each at
 * `tests/<ref>.xml`.
 *
 * @param identifier The test's identifier.
 * @param parts The test's parts.
 * @param defaults The item refs whose items declare the default `B`.
 * @returns The test and its items, keyed by item ref.
 */
const builtDelivery = Effect.fnUntraced(function* builtDelivery(
  identifier: string,
  parts: readonly PartSpec[],
  defaults: ReadonlySet<string> = new Set(),
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    `tests/${identifier}.xml`,
    encoder.encode(testXml(identifier, parts)),
  );
  const items = new Map<string, Accepted>();
  for (const ref of parts.flatMap((part) => part.refs)) {
    items.set(
      ref,
      yield* openItem(`tests/${ref}.xml`, encoder.encode(itemXml(ref, defaults.has(ref)))),
    );
  }

  return { items, test } satisfies Delivery;
});

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (delivery: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(delivery.test, delivery.items, configuration, { instance, now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Move a session, failing the test when `move` refuses.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param step The request.
 * @param now The time of the move.
 * @returns The session after the move.
 */
const moved = (delivery: Delivery, session: TestSession, step: MoveStep, now: Date): TestSession =>
  Result.getOrElse(move(delivery.test, delivery.items, session, step, now), (failure) =>
    assert.fail(`move refused ${step.intent.kind}: ${failure._tag}: ${failure.message}`),
  );

/**
 * Read the refusal of a move, failing the test unless `move` refused it with `MoveRefused`.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param intent The intent.
 * @returns The refusal.
 */
const refusal = (delivery: Delivery, session: TestSession, intent: MoveIntent): MoveRefused => {
  const failure = Option.getOrElse(
    Result.getFailure(move(delivery.test, delivery.items, session, { intent }, after(60_000))),
    () => assert.fail(`expected ${intent.kind} to be refused, and it moved`),
  );

  return failure._tag === "MoveRefused"
    ? failure
    : assert.fail(`expected MoveRefused for ${intent.kind}, not ${failure._tag}`);
};

/**
 * Read the rule of a refused move.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param intent The intent.
 * @returns The rule.
 */
const ruleOf = (delivery: Delivery, session: TestSession, intent: MoveIntent): MoveRule =>
  refusal(delivery, session, intent).rule;

/**
 * Hand a session through a host's storage: encode it, write it as JSON text, read the text back
 * and decode it, failing the test when either side refuses.
 *
 * @param test The test the session belongs to.
 * @param session The session.
 * @returns The session as the library reads it back.
 */
const throughHost = (test: AcceptedTest, session: TestSession): TestSession => {
  const stored = Result.getOrElse(encodeSession(session), (failure) =>
    assert.fail(failure.message),
  );
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the session survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
  const handedBack: unknown = JSON.parse(JSON.stringify(stored));

  return Result.getOrElse(decodeSession(handedBack, test), (failure) =>
    assert.fail(failure.message),
  );
};

/**
 * Read the current item of a session, failing the test when it shows the summary or `current`
 * fails.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param configuration The host's configuration.
 * @returns The current item's view.
 */
const currentItem = (
  delivery: Delivery,
  session: TestSession,
  configuration: Configuration,
): ItemView => {
  const shown = Result.getOrElse(current(delivery.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown : assert.fail("current shows the summary, not an item");
};

/**
 * Give a session in which one item has a processed attempt, as a submission leaves it.
 *
 * @param session The session.
 * @param sequenceIndex The item's sequence index.
 * @returns The session with that item's `numAttempts` 1.
 */
const withAttempt = (session: TestSession, sequenceIndex: number): TestSession => ({
  ...session,
  items: session.items.map((item) =>
    item.sequenceIndex === sequenceIndex
      ? { ...item, record: { ...item.record, numAttempts: 1 } }
      : item,
  ),
});

/**
 * Name where a move went, or why it failed: `item <n>` for the sequence index it reached,
 * `refused <rule>` for a refusal, and the tag of any other failure.
 *
 * @param result What `move` or `moveTarget` gave, a move's session read as its current sequence
 *   index.
 * @returns The outcome's name.
 */
const outcome = (
  result: Result.Result<
    number,
    | EngineFailure
    | InvalidTime
    | ItemNotInSession
    | MoveRefused
    | TestNotDeliverable
    | UnknownItemRef
  >,
): string =>
  Result.match(result, {
    onFailure: (failure) =>
      failure._tag === "MoveRefused" ? `refused ${failure.rule}` : failure._tag,
    onSuccess: (sequenceIndex) => `item ${sequenceIndex}`,
  });

describe("move", () => {
  it.effect(
    "[T-4] [T-14] keeps item 1's saved responses through next, previous and the host's storage in a nonlinear part",
    () =>
      Effect.gen(function* savedSurvive() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery(
          "survive",
          onePart("nonlinear", "individual", ["one", "two", "three"]),
        );
        const left = moved(
          delivery,
          started(delivery, configuration),
          { intent: next, responses: { RESPONSE: choiceA } },
          after(1000),
        );

        assert.strictEqual(left.position, 1);
        assert.deepStrictEqual(currentItem(delivery, left, configuration).values, {
          RESPONSE: nullChoice,
        });

        const back = moved(
          delivery,
          throughHost(delivery.test, left),
          { intent: previous },
          after(2000),
        );
        const shown = currentItem(delivery, throughHost(delivery.test, back), configuration);

        assert.deepStrictEqual(
          [shown.sequenceIndex, shown.instance, shown.values],
          [1, `${instance}.1`, { RESPONSE: choiceA }],
        );
        assert.deepStrictEqual(back.items[0]?.saved, Option.some({ RESPONSE: choiceA }));
      }),
  );

  it.effect("[T-4] goes to any item of a nonlinear part, and refuses past either end of it", () =>
    Effect.gen(function* nonlinearMoves() {
      const configuration = yield* configure({});
      const delivery = yield* builtDelivery(
        "nonlinear",
        onePart("nonlinear", "simultaneous", ["one", "two", "three"]),
      );
      const session = started(delivery, configuration);
      const third = moved(delivery, session, { intent: go(3) }, after(1000));

      assert.strictEqual(third.position, 2);
      assert.deepStrictEqual(
        third.items.map((item) => item.presented),
        [true, false, true],
      );
      assert.strictEqual(ruleOf(delivery, third, next), "end-of-part");

      const second = moved(delivery, third, { intent: previous }, after(2000));

      assert.strictEqual(second.position, 1);
      assert.strictEqual(moved(delivery, second, { intent: next }, after(3000)).position, 2);
      assert.strictEqual(ruleOf(delivery, session, previous), "start-of-part");

      for (const outside of [0, 4, 1.5, Number.NaN]) {
        assert.strictEqual(ruleOf(delivery, session, go(outside)), "out-of-range");
      }

      assert.deepStrictEqual(
        refusal(delivery, session, go(4)).from,
        Option.some({ first: 1, last: 3, part: "part", sequenceIndex: 1 }),
      );
    }),
  );

  for (const submission of ["individual", "simultaneous"] as const) {
    it.effect(
      `[T-4] refuses previous and a jump in a linear, ${submission} part, and saves and stays on go to the current item`,
      () =>
        Effect.gen(function* linearRefusals() {
          const configuration = yield* configure({});
          const delivery = yield* builtDelivery(
            "linear",
            onePart("linear", submission, ["one", "two", "three"]),
          );
          const session = started(delivery, configuration);

          assert.strictEqual(ruleOf(delivery, session, previous), "linear-back");
          assert.strictEqual(ruleOf(delivery, session, go(2)), "linear-jump");
          assert.strictEqual(ruleOf(delivery, session, go(3)), "linear-jump");

          const stayed = moved(
            delivery,
            session,
            { intent: go(1), responses: { RESPONSE: choiceA } },
            after(500),
          );

          assert.strictEqual(stayed.position, 0);
          assert.deepStrictEqual(stayed.items[0]?.saved, Option.some({ RESPONSE: choiceA }));
          assert.strictEqual(stayed.items[0]?.duration, 0.5);
          assert.strictEqual(stayed.updated, after(500).toISOString());
          assert.deepStrictEqual(
            stayed.items.map((item) => item.presented),
            [true, false, false],
          );
        }),
    );
  }

  it.effect(
    "[T-4] moves forward through a linear, simultaneous part, and refuses next on its last item",
    () =>
      Effect.gen(function* linearForward() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery(
          "forward",
          onePart("linear", "simultaneous", ["one", "two", "three"]),
        );
        const second = moved(
          delivery,
          started(delivery, configuration),
          { intent: next },
          after(1000),
        );
        const third = moved(delivery, second, { intent: next }, after(2000));

        assert.deepStrictEqual([second.position, third.position], [1, 2]);
        assert.strictEqual(ruleOf(delivery, third, next), "end-of-part");
        assert.strictEqual(ruleOf(delivery, third, previous), "linear-back");
      }),
  );

  it.effect(
    "[T-4] refuses next from a linear, individual item with no processed attempt, and moves once one is processed",
    () =>
      Effect.gen(function* unsubmitted() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery(
          "individual",
          onePart("linear", "individual", ["one", "two"]),
        );
        const session = started(delivery, configuration);

        assert.strictEqual(ruleOf(delivery, session, next), "unsubmitted");
        assert.strictEqual(
          moved(delivery, withAttempt(session, 1), { intent: next }, after(1000)).position,
          1,
        );
      }),
  );

  it.effect(
    "[T-4] keeps a move inside its part: next ends nothing and go cannot reach the next part",
    () =>
      Effect.gen(function* insidePart() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery("parts", [
          {
            identifier: "first",
            navigation: "nonlinear",
            refs: ["one", "two"],
            submission: "individual",
          },
          {
            identifier: "second",
            navigation: "nonlinear",
            refs: ["three"],
            submission: "individual",
          },
        ]);
        const last = moved(
          delivery,
          started(delivery, configuration),
          { intent: go(2) },
          after(1000),
        );

        assert.strictEqual(ruleOf(delivery, last, next), "end-of-part");
        assert.strictEqual(ruleOf(delivery, last, go(3)), "out-of-range");
        assert.deepStrictEqual(last.parts, [
          { identifier: "first", status: "current" },
          { identifier: "second", status: "pending" },
        ]);
      }),
  );

  it.effect("refuses every move once the test is closed: test-closed", () =>
    Effect.gen(function* closed() {
      const configuration = yield* configure({});
      const delivery = yield* builtDelivery(
        "closed",
        onePart("nonlinear", "individual", ["one", "two"]),
      );
      const session: TestSession = { ...started(delivery, configuration), status: "closed" };

      for (const intent of [next, previous, go(1), go(2)]) {
        const refused = refusal(delivery, session, intent);

        assert.deepStrictEqual([refused.rule, refused.from], ["test-closed", Option.none()]);
      }
    }),
  );

  it.effect(
    "adds each interval to the item shown during it, so durations add up to the intervals injected",
    () =>
      Effect.gen(function* durations() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery(
          "durations",
          onePart("nonlinear", "individual", ["one", "two", "three"]),
        );
        const steps: readonly (readonly [MoveIntent, number])[] = [
          [next, 1500],
          [previous, 4000],
          [go(2), 4300],
          [go(2), 5000],
          [go(3), 5100],
        ];
        let session = started(delivery, configuration);
        for (const [intent, offset] of steps) {
          session = moved(delivery, session, { intent }, after(offset));
        }

        assert.deepStrictEqual(
          session.items.map((item) => item.duration),
          [1.8, 3.3, 0],
        );
        assert.strictEqual(session.updated, after(5100).toISOString());
        assert.strictEqual(session.items[1]?.datestamp, after(5100).toISOString());
      }),
  );

  it.effect(
    "presents an item when a move first reaches it, writing its declared default, NULL before",
    () =>
      Effect.gen(function* defaults() {
        const configuration = yield* configure({});
        const delivery = yield* builtDelivery(
          "defaults",
          onePart("nonlinear", "individual", ["one", "two"]),
          new Set(["two"]),
        );
        const session = started(delivery, configuration);

        assert.deepStrictEqual(
          [session.items[1]?.presented, session.items[1]?.record.responses],
          [false, { RESPONSE: nullChoice }],
        );

        const reached = moved(delivery, session, { intent: next }, after(1000));

        assert.deepStrictEqual(currentItem(delivery, reached, configuration).values, {
          RESPONSE: choiceB,
        });
        assert.deepStrictEqual(
          [reached.items[1]?.presented, reached.items[1]?.datestamp],
          [true, after(1000).toISOString()],
        );
      }),
  );

  it.effect("refuses an invalid now with InvalidTime", () =>
    Effect.gen(function* invalidNow() {
      const configuration = yield* configure({});
      const delivery = yield* builtDelivery(
        "time",
        onePart("nonlinear", "individual", ["one", "two"]),
      );
      const result = move(
        delivery.test,
        delivery.items,
        started(delivery, configuration),
        { intent: next },
        new Date(Number.NaN),
      );

      assert.strictEqual(
        Result.match(result, { onFailure: (failure) => failure._tag, onSuccess: () => "moved" }),
        "InvalidTime",
      );
    }),
  );
});

describe("moveTarget", () => {
  it.effect("gives the sequence index move goes to, and the refusal move gives", () =>
    Effect.gen(function* agrees() {
      const configuration = yield* configure({});
      const delivery = yield* builtDelivery(
        "agrees",
        onePart("nonlinear", "individual", ["one", "two", "three"]),
      );
      const session = moved(
        delivery,
        started(delivery, configuration),
        { intent: go(2) },
        after(1000),
      );

      for (const intent of [next, previous, go(1), go(2), go(3), go(7)]) {
        const movedTo = Result.map(
          move(delivery.test, delivery.items, session, { intent }, after(2000)),
          (reached) => reached.position + 1,
        );

        assert.strictEqual(outcome(moveTarget(delivery.test, session, intent)), outcome(movedTo));
      }

      assert.deepStrictEqual(
        [next, previous, go(3), go(7)].map((intent) =>
          outcome(moveTarget(delivery.test, session, intent)),
        ),
        ["item 3", "item 1", "item 3", "refused out-of-range"],
      );
    }),
  );
});

/**
 * Write the text of a hand-built item that a test's template default sets: the single integer
 * outcome `POINTS` and the single integer template variable `T`, which declares the default 3. Its
 * body is a passage.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const scoredItemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-outcome-declaration identifier="POINTS" cardinality="single" base-type="integer"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="integer">',
    "<qti-default-value><qti-value>3</qti-value></qti-default-value></qti-template-declaration>",
    "<qti-item-body><p>Read this passage.</p></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Open a hand-built linear, individual test of the items `one` and `two`, each through `open` on
 * its own and never as a package, whose item ref `two` sets `T` to `one.POINTS`.
 *
 * @returns The test and its items.
 */
const defaultedDelivery = Effect.fnUntraced(function* defaultedDelivery() {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    "tests/defaulted.xml",
    encoder.encode(
      [
        '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="defaulted" title="defaulted">',
        '<qti-test-part identifier="part" navigation-mode="linear" submission-mode="individual">',
        '<qti-assessment-section identifier="section" title="Section" visible="true">',
        '<qti-assessment-item-ref identifier="one" href="one.xml"/>',
        '<qti-assessment-item-ref identifier="two" href="two.xml">',
        '<qti-template-default template-identifier="T"><qti-variable identifier="one.POINTS"/></qti-template-default>',
        "</qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>",
      ].join(""),
    ),
  );
  const items = new Map<string, Accepted>();
  for (const ref of ["one", "two"]) {
    items.set(ref, yield* openItem(`tests/${ref}.xml`, encoder.encode(scoredItemXml(ref))));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Give a session whose item 1 has a processed attempt that left its outcomes as given, as a
 * submission and the host's storage leave it.
 *
 * @param session The session.
 * @param outcomes Item 1's outcomes.
 * @returns The session.
 */
const scoredFirst = (
  session: TestSession,
  outcomes: Readonly<Record<string, Value>>,
): TestSession => ({
  ...session,
  items: session.items.map((item) =>
    item.sequenceIndex === 1
      ? { ...item, record: { ...item.record, numAttempts: 1, outcomes } }
      : item,
  ),
});

describe("move and a linear item ref's template defaults", () => {
  it.effect(
    "[T-9] applies the template default of the item next reaches in a linear part, reading the item before it through a prefixed name",
    () =>
      Effect.gen(function* appliesOnMove() {
        const delivery = yield* defaultedDelivery();
        const session = started(delivery, yield* configure({}));
        const first = session.items[0] ?? assert.fail("the session has no item 1");
        const reached = moved(
          delivery,
          scoredFirst(session, { ...first.record.outcomes, POINTS: integer(4n) }),
          { intent: next },
          after(1000),
        );

        assert.deepStrictEqual(session.items[1]?.record.templates, {});
        assert.deepStrictEqual(reached.items[1]?.record.templates, { T: integer(4n) });
        assert.strictEqual(reached.position, 1);
      }),
  );

  it.effect(
    "[T-9] returns move's UnknownIdentifierError, never a throw, for a test checked apart whose stored session's record lacks the outcome a later default reads",
    () =>
      Effect.gen(function* gapOnMove() {
        const delivery = yield* defaultedDelivery();
        const session = started(delivery, yield* configure({}));
        const { POINTS: _points, ...outcomes } = (
          session.items[0] ?? assert.fail("the session has no item 1")
        ).record.outcomes;

        const failure = Option.getOrElse(
          Result.getFailure(
            move(
              delivery.test,
              delivery.items,
              scoredFirst(session, outcomes),
              { intent: next },
              after(1000),
            ),
          ),
          () => assert.fail("expected the move to fail, and it moved"),
        );

        assert.deepStrictEqual(
          failure._tag === "UnknownIdentifierError"
            ? [failure.holder, failure.identifier, failure.role]
            : assert.fail(`expected UnknownIdentifierError, not ${failure._tag}`),
          ["record", "POINTS", "outcome"],
        );
      }),
  );
});
