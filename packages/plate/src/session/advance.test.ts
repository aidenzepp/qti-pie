import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { drawBelow, drawStream, outcomeLabel } from "#plate/engine/random.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import type { Value } from "#plate/model/values.ts";
import { IntentRefused, advance } from "#plate/session/advance.ts";
import type { AdvanceFailure, IntentRule } from "#plate/session/advance.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import { SubmissionRefused } from "#plate/session/submit.ts";
import type { Intent, Responses, Step, TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The rules an `IntentRefused` may carry, and no other.
 */
const listedRules: readonly IntentRule[] = [
  "attempts-exhausted",
  "end-of-part",
  "item-closed",
  "linear-back",
  "linear-jump",
  "out-of-range",
  "responses-invalid",
  "skipping-not-allowed",
  "start-of-part",
  "test-closed",
  "wrong-submission-mode",
];

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

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
 * The responses every explored step posts: the correct choice, which every item's checks pass.
 */
const answer: Responses = { RESPONSE: chosen("A") };

/**
 * A multiple identifier value: the choices a candidate ticked.
 *
 * @param identifiers The ticked choices' identifiers.
 * @returns The value.
 */
const ticked = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: identifiers.map((value) => ({ baseType: "identifier", value })),
});

/**
 * What a hand-built Choice item sets beyond its fixed text.
 */
interface ChoiceOptions {
  /**
   * The Choice's `min-choices`, when it sets one.
   */
  readonly minChoices?: number;
  /**
   * Whether `RESPONSE` is a multiple identifier, so a post can tick more choices than the Choice's
   * `max-choices` of 1 allows, which `score` refuses (tier (a)).
   */
  readonly multiple?: boolean;
}

/**
 * Write the text of a hand-built Choice item: `RESPONSE`, an identifier whose correct response is
 * `A`, scored by `match_correct` into `SCORE`, from a Choice of `A` and `B` with `max-choices` 1.
 *
 * @param identifier The item's identifier.
 * @param options What the Choice sets: a single `RESPONSE` and no `min-choices` when empty.
 * @returns The item's text.
 */
const choiceItemXml = (identifier: string, options: ChoiceOptions = {}): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    `<qti-response-declaration identifier="RESPONSE" cardinality="${options.multiple === true ? "multiple" : "single"}" base-type="identifier">`,
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    "<qti-item-body>",
    `<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1"${options.minChoices === undefined ? "" : ` min-choices="${options.minChoices}"`}>`,
    '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
    '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
    "</qti-choice-interaction></qti-item-body>",
    '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
  ].join("");

/**
 * A part's two modes.
 */
interface Modes {
  readonly navigation: "linear" | "nonlinear";
  readonly submission: "individual" | "simultaneous";
}

/**
 * The four mode combinations a test part can take.
 */
const combinations: readonly Modes[] = [
  { navigation: "linear", submission: "individual" },
  { navigation: "linear", submission: "simultaneous" },
  { navigation: "nonlinear", submission: "individual" },
  { navigation: "nonlinear", submission: "simultaneous" },
];

/**
 * What a hand-built test declares of its own outcomes, as text: its outcome declarations, and the
 * rules of its `qti-outcome-processing`, which it holds only when they are not empty.
 */
interface TestOutcomes {
  readonly declarations: string;
  readonly rules: string;
}

/**
 * Write the text of a hand-built test of two parts in the same modes: `P1` holding the items `i1`,
 * `i2` and `i3`, and `P2` holding `i4`, each ref naming `<ref>.xml` beside the test.
 *
 * @param modes The parts' modes.
 * @param control The attributes of each part's item session control; none when empty.
 * @param outcomes The test's outcome declarations and outcome processing; none when absent.
 * @returns The test's text.
 */
const testXml = (modes: Modes, control: string, outcomes?: TestOutcomes): string => {
  const part = (identifier: string, refs: readonly string[]): string =>
    [
      `<qti-test-part identifier="${identifier}" navigation-mode="${modes.navigation}" submission-mode="${modes.submission}">`,
      control === "" ? "" : `<qti-item-session-control ${control}/>`,
      `<qti-assessment-section identifier="${identifier}-section" title="Section" visible="true">`,
      ...refs.map((ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`),
      "</qti-assessment-section></qti-test-part>",
    ].join("");

  return [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    outcomes?.declarations ?? "",
    part("P1", ["i1", "i2", "i3"]),
    part("P2", ["i4"]),
    outcomes === undefined || outcomes.rules === ""
      ? ""
      : `<qti-outcome-processing>${outcomes.rules}</qti-outcome-processing>`,
    "</qti-assessment-test>",
  ].join("");
};

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a hand-built test of {@link testXml} and its four items, the test at `tests/T.xml` and each
 * item beside it.
 *
 * @param modes The parts' modes.
 * @param options What the test sets.
 * @param options.control The attributes of each part's item session control.
 * @param options.minChoices Each Choice's `min-choices`, when it sets one.
 * @param options.multiple Whether each item's `RESPONSE` is a multiple identifier.
 * @param options.outcomes The test's outcome declarations and outcome processing, when it has any.
 * @returns The test and its items.
 */
const delivery = Effect.fnUntraced(function* delivery(
  modes: Modes,
  options: ChoiceOptions & { readonly control?: string; readonly outcomes?: TestOutcomes } = {},
) {
  const encoder = new TextEncoder();
  const verdict = yield* open(
    "tests/T.xml",
    encoder.encode(testXml(modes, options.control ?? "", options.outcomes)),
  );
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2", "i3", "i4"]) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(choiceItemXml(ref, options)));
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
 * Require `advance` to accept a step.
 *
 * @param result What `advance` returned.
 * @returns The session it gave.
 */
const accepted = (result: Result.Result<TestSession, AdvanceFailure>): TestSession =>
  Result.getOrElse(result, (failure) => assert.fail(`advance refused: ${failure.message}`));

/**
 * Require `advance` to refuse a step as an intent the test's rules forbid.
 *
 * @param result What `advance` returned.
 * @returns The refusal.
 */
const refused = (result: Result.Result<TestSession, AdvanceFailure>): IntentRefused => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );

  return failure instanceof IntentRefused
    ? failure
    : assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
};

/**
 * List the intents allowed now as their posted values, failing the test when the session does not
 * fit the test.
 *
 * @param test The test.
 * @param session The session.
 * @returns The posted value of each intent `allowedIntents` lists.
 */
const allowedNow = (test: AcceptedTest, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

/**
 * Give every intent a candidate could post in a session of some items: each move, `go` to every
 * sequence index and one past each end, and each submission.
 *
 * @param count The session's item count.
 * @returns The intents.
 */
const candidates = (count: number): readonly Intent[] => [
  { kind: "next" },
  { kind: "previous" },
  ...Array.from({ length: count + 2 }, (_, sequenceIndex): Intent => ({
    kind: "go",
    sequenceIndex,
  })),
  { kind: "submit-item" },
  { kind: "submit-part" },
  { kind: "end-part" },
];

/**
 * Write the state of a session that decides what it takes, so the exploration visits each once.
 *
 * @param session The session.
 * @returns The state, as text.
 */
const stateOf = (session: TestSession): string =>
  JSON.stringify([
    session.status,
    session.position,
    session.parts.map((part) => part.status),
    session.items.map((item) => [
      item.presented,
      item.record.numAttempts,
      Option.isSome(item.saved),
    ]),
  ]);

/**
 * What an exploration found: the states it visited, the steps `advance` accepted, the rules it
 * refused with, and whether it reached a closed test.
 */
interface Explored {
  readonly accepted: number;
  readonly closed: boolean;
  readonly rules: ReadonlySet<string>;
  readonly states: number;
}

/**
 * The most accepted steps an exploration takes from the start, breadth first: enough for the
 * linear, individual walk to close the test with four `next`s.
 */
const stepLimit = 4;

/**
 * Walk every session a delivery reaches in at most {@link stepLimit} accepted steps, and at each,
 * post every candidate intent with {@link answer}: `advance` must accept exactly the intents
 * `allowedIntents` lists, and refuse every other one with an `IntentRefused` whose rule
 * {@link listedRules} holds.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns What the walk found.
 */
const explore = (given: Delivery, configuration: Configuration): Explored => {
  const seen = new Set<string>();
  const rules = new Set<string>();
  const queue: (readonly [TestSession, number])[] = [[started(given, configuration), 0]];
  const found = { accepted: 0, closed: false };
  for (let entry = queue.shift(); entry !== undefined; entry = queue.shift()) {
    const [session, depth] = entry;
    found.closed ||= session.status === "closed";
    const listed = allowedNow(given.test, session);
    const posted = candidates(session.items.length);
    assert.includeMembers(posted.map(encodeIntent), [...listed], "a listed intent is a candidate");
    for (const intent of posted) {
      const step: Step = { intent, responses: answer };
      const result = advance(given.test, given.items, session, step, configuration, {
        now: after(depth + 1),
      });
      const where = `${encodeIntent(intent)} at ${stateOf(session)}`;
      if (Result.isSuccess(result)) {
        assert.include(listed, encodeIntent(intent), `advance accepted ${where}, unlisted`);
        found.accepted += 1;
        const state = stateOf(result.success);
        if (depth < stepLimit && !seen.has(state)) {
          seen.add(state);
          queue.push([result.success, depth + 1]);
        }
      } else {
        const refusal = refused(result);
        assert.notInclude(listed, encodeIntent(intent), `advance refused ${where}, listed`);
        assert.include(listedRules, refusal.rule, `the rule of ${where}`);
        rules.add(refusal.rule);
      }
    }
  }

  return { ...found, rules, states: seen.size + 1 };
};

/**
 * The rules each exploration must meet, by mode combination, so the walk is shown to reach each
 * refusal the combination has.
 */
const expectedRules = {
  "linear individual": [
    "attempts-exhausted",
    "linear-back",
    "linear-jump",
    "out-of-range",
    "test-closed",
    "wrong-submission-mode",
  ],
  "linear simultaneous": [
    "end-of-part",
    "linear-back",
    "linear-jump",
    "out-of-range",
    "test-closed",
    "wrong-submission-mode",
  ],
  "nonlinear individual": [
    "attempts-exhausted",
    "end-of-part",
    "out-of-range",
    "start-of-part",
    "test-closed",
    "wrong-submission-mode",
  ],
  "nonlinear simultaneous": [
    "end-of-part",
    "out-of-range",
    "start-of-part",
    "test-closed",
    "wrong-submission-mode",
  ],
} satisfies Readonly<
  Record<`${Modes["navigation"]} ${Modes["submission"]}`, readonly IntentRule[]>
>;

describe("advance and allowedIntents", () => {
  for (const modes of combinations) {
    const name = `${modes.navigation} ${modes.submission}` as const;
    it.effect(
      `agree in a ${name} part: advance accepts every intent allowedIntents lists and refuses every other`,
      () =>
        Effect.gen(function* agreeOnEveryState() {
          const explored = explore(yield* delivery(modes), yield* configure({}));
          assert.isAbove(explored.states, 3);
          assert.isAbove(explored.accepted, 3);
          assert.isTrue(explored.closed, "the walk reaches a closed test");
          assert.includeMembers([...explored.rules], [...expectedRules[name]]);
          assert.notInclude([...explored.rules], "unsubmitted");
        }),
    );
  }

  it.effect(
    "differ only on posted values: a linear, simultaneous part lists next, and advance refuses a next whose responses score would refuse",
    () =>
      Effect.gen(function* refuseOnPostedValues() {
        const given = yield* delivery(
          { navigation: "linear", submission: "simultaneous" },
          { multiple: true },
        );
        const configuration = yield* configure({});
        const session = started(given, configuration);
        assert.include(allowedNow(given.test, session), "next");

        const refusal = refused(
          advance(
            given.test,
            given.items,
            session,
            { intent: { kind: "next" }, responses: { RESPONSE: ticked("A", "B") } },
            configuration,
            { now: after(1) },
          ),
        );
        assert.strictEqual(refusal.rule, "responses-invalid");
        assert.deepStrictEqual(refusal.intent, { kind: "next" });
        assert.deepStrictEqual(refusal.sequenceIndex, Option.some(1));
        assert.deepStrictEqual(
          refusal.messages.map((said) => said.response),
          ["RESPONSE"],
        );
      }),
  );
});

describe("advance", () => {
  const linearIndividual: Modes = { navigation: "linear", submission: "individual" };

  it.effect(
    "submits a linear, individual item with no processed attempt before next moves on, so unsubmitted never surfaces",
    () =>
      Effect.gen(function* submitBeforeNext() {
        const given = yield* delivery(linearIndividual);
        const configuration = yield* configure({});
        const session = started(given, configuration);
        assert.include(allowedNow(given.test, session), "next");

        const moved = accepted(
          advance(
            given.test,
            given.items,
            session,
            { intent: { kind: "next" }, responses: answer },
            configuration,
            { now: after(5) },
          ),
        );
        const [first, second] = moved.items;
        assert.strictEqual(moved.position, 1);
        assert.strictEqual(first?.record.numAttempts, 1);
        assert.isTrue(Option.isSome(first?.firstOutcomes ?? Option.none()));
        assert.isTrue(Option.isNone(first?.saved ?? Option.some(answer)));
        assert.deepStrictEqual(first?.record.responses["RESPONSE"], chosen("A"));
        assert.isTrue(second?.presented);
        assert.strictEqual(first?.duration, 5);
      }),
  );

  it.effect("ends a linear, individual part with next on its last item, submitting it first", () =>
    Effect.gen(function* nextEndsThePart() {
      const given = yield* delivery(linearIndividual);
      const configuration = yield* configure({});
      const next: Step = { intent: { kind: "next" }, responses: answer };
      const step = (session: TestSession, seconds: number): TestSession =>
        accepted(
          advance(given.test, given.items, session, next, configuration, { now: after(seconds) }),
        );
      const onLast = step(step(started(given, configuration), 1), 2);
      assert.strictEqual(onLast.position, 2);

      const ended = step(onLast, 3);
      assert.deepStrictEqual(
        ended.parts.map((part) => part.status),
        ["ended", "current"],
      );
      assert.strictEqual(ended.position, 3);
      assert.strictEqual(ended.items[2]?.record.numAttempts, 1);
      assert.isTrue(ended.items[3]?.presented);

      const closed = step(ended, 4);
      assert.strictEqual(closed.status, "closed");
      assert.strictEqual(closed.items[3]?.record.numAttempts, 1);
    }),
  );

  it.effect("refuses end-part in a linear, individual part as linear-jump, saving nothing", () =>
    Effect.gen(function* endPartNotOffered() {
      const given = yield* delivery(linearIndividual);
      const configuration = yield* configure({});
      const session = started(given, configuration);
      assert.notInclude(allowedNow(given.test, session), "end-part");

      const refusal = refused(
        advance(
          given.test,
          given.items,
          session,
          { intent: { kind: "end-part" }, responses: answer },
          configuration,
          { now: after(1) },
        ),
      );
      assert.strictEqual(refusal.rule, "linear-jump");
      assert.deepStrictEqual(refusal.intent, { kind: "end-part" });
      assert.isTrue(Option.isNone(refusal.refusal));
      assert.deepStrictEqual(refusal.sequenceIndex, Option.some(1));
    }),
  );

  it.effect("refuses a next whose submission is refused with that submission's rule", () =>
    Effect.gen(function* nextCarriesTheSubmission() {
      const given = yield* delivery(linearIndividual, { control: 'allow-skipping="false"' });
      const configuration = yield* configure({});
      const session = started(given, configuration);
      assert.include(allowedNow(given.test, session), "next");

      const refusal = refused(
        advance(given.test, given.items, session, { intent: { kind: "next" } }, configuration, {
          now: after(1),
        }),
      );
      assert.strictEqual(refusal.rule, "skipping-not-allowed");
      assert.deepStrictEqual(refusal.intent, { kind: "next" });
      assert.instanceOf(Option.getOrUndefined(refusal.refusal), SubmissionRefused);
      assert.deepStrictEqual(refusal.sequenceIndex, Option.some(1));
    }),
  );

  it.effect("refuses responses-invalid with the interactions' messages", () =>
    Effect.gen(function* validated() {
      const given = yield* delivery(
        { navigation: "nonlinear", submission: "individual" },
        { control: 'validate-responses="true"', minChoices: 1 },
      );
      const configuration = yield* configure({});
      const refusal = refused(
        advance(
          given.test,
          given.items,
          started(given, configuration),
          { intent: { kind: "submit-item" } },
          configuration,
          { now: after(1) },
        ),
      );
      assert.strictEqual(refusal.rule, "responses-invalid");
      assert.isAbove(refusal.messages.length, 0);
      assert.strictEqual(refusal.messages[0]?.response, "RESPONSE");
    }),
  );

  it.effect(
    "refuses a submit-part that score refuses on another item with responses-invalid, naming that item",
    () =>
      Effect.gen(function* refusedElsewhere() {
        const given = yield* delivery({ navigation: "nonlinear", submission: "simultaneous" });
        const configuration = yield* configure({});
        const onTwo = accepted(
          advance(
            given.test,
            given.items,
            started(given, configuration),
            { intent: { kind: "next" }, responses: { RESPONSE: chosen("Z") } },
            configuration,
            { now: after(1) },
          ),
        );
        assert.strictEqual(onTwo.position, 1);
        assert.include(allowedNow(given.test, onTwo), "submit-part");

        const refusal = refused(
          advance(
            given.test,
            given.items,
            onTwo,
            { intent: { kind: "submit-part" }, responses: answer },
            configuration,
            { now: after(2) },
          ),
        );
        assert.strictEqual(refusal.rule, "responses-invalid");
        assert.deepStrictEqual(refusal.intent, { kind: "submit-part" });
        assert.deepStrictEqual(refusal.sequenceIndex, Option.some(1));
        assert.instanceOf(Option.getOrUndefined(refusal.refusal), SubmissionRefused);
        assert.deepStrictEqual(
          refusal.messages.map((said) => said.response),
          ["RESPONSE"],
        );
      }),
  );

  it.effect(
    "refuses next in a linear, simultaneous part over responses score would refuse, so the part's submit never meets them",
    () =>
      Effect.gen(function* checkBeforeLeaving() {
        const given = yield* delivery(
          { navigation: "linear", submission: "simultaneous" },
          { multiple: true },
        );
        const configuration = yield* configure({});
        const overTicked: Responses = { RESPONSE: ticked("A", "B") };
        const correct: Responses = { RESPONSE: ticked("A") };
        const post = (session: TestSession, step: Step, seconds: number) =>
          advance(given.test, given.items, session, step, configuration, { now: after(seconds) });
        const start = started(given, configuration);

        const posted = refused(post(start, { intent: { kind: "next" }, responses: overTicked }, 1));
        assert.strictEqual(posted.rule, "responses-invalid");
        assert.deepStrictEqual(posted.sequenceIndex, Option.some(1));
        assert.isTrue(Option.isNone(posted.refusal));
        assert.isAbove(posted.messages.length, 0);

        const kept = accepted(
          post(start, { intent: { kind: "go", sequenceIndex: 1 }, responses: overTicked }, 2),
        );
        assert.strictEqual(kept.position, 0);

        const stored = refused(post(kept, { intent: { kind: "next" } }, 3));
        assert.strictEqual(stored.rule, "responses-invalid");
        assert.deepStrictEqual(stored.sequenceIndex, Option.some(1));

        const onTwo = accepted(post(kept, { intent: { kind: "next" }, responses: correct }, 4));
        assert.strictEqual(onTwo.position, 1);

        const onLast = accepted(post(onTwo, { intent: { kind: "next" }, responses: correct }, 5));
        assert.strictEqual(onLast.position, 2);

        const submitted = accepted(
          post(onLast, { intent: { kind: "submit-part" }, responses: correct }, 6),
        );
        assert.deepStrictEqual(
          submitted.parts.map((part) => part.status),
          ["ended", "current"],
        );
        assert.deepStrictEqual(
          submitted.items.slice(0, 3).map((item) => item.record.numAttempts),
          [1, 1, 1],
        );
      }),
  );

  it.effect("refuses every intent once the test has closed, which then lists none", () =>
    Effect.gen(function* closedTest() {
      const given = yield* delivery({ navigation: "nonlinear", submission: "individual" });
      const configuration = yield* configure({});
      const end: Step = { intent: { kind: "end-part" } };
      let closed = started(given, configuration);
      for (const seconds of [1, 2]) {
        closed = accepted(
          advance(given.test, given.items, closed, end, configuration, { now: after(seconds) }),
        );
      }

      assert.strictEqual(closed.status, "closed");
      assert.deepStrictEqual(allowedNow(given.test, closed), []);
      for (const intent of candidates(closed.items.length)) {
        const refusal = refused(
          advance(given.test, given.items, closed, { intent }, configuration, { now: after(3) }),
        );
        assert.strictEqual(refusal.rule, "test-closed");
        assert.isTrue(Option.isNone(refusal.sequenceIndex));
      }
    }),
  );

  it.effect(
    "refuses a step whose responses do not fit the current item's declarations, two values in a single among them, and saves nothing",
    () =>
      Effect.gen(function* misfitStep() {
        const given = yield* delivery({ navigation: "nonlinear", submission: "individual" });
        const configuration = yield* configure({});
        const session = started(given, configuration);
        const stored = (): string => JSON.stringify(Result.getOrThrow(encodeSession(session)));
        const before = stored();
        const misfits = {
          "a multiple for a single": { RESPONSE: ticked("A", "B") },
          "a response the item does not score": { OTHER: chosen("A") },
          "another base type": {
            RESPONSE: {
              baseType: "string",
              cardinality: "single",
              values: [{ baseType: "string", value: "A" }],
            },
          },
          "two values in a single": {
            RESPONSE: {
              baseType: "identifier",
              cardinality: "single",
              values: [
                { baseType: "identifier", value: "A" },
                { baseType: "identifier", value: "B" },
              ],
            },
          },
        } satisfies Readonly<Record<string, Responses>>;
        const intents: readonly Intent[] = [
          { kind: "next" },
          { kind: "go", sequenceIndex: 2 },
          { kind: "submit-item" },
          { kind: "end-part" },
        ];

        for (const intent of intents) {
          const post = (responses: Responses) =>
            advance(given.test, given.items, session, { intent, responses }, configuration, {
              now: after(1),
            });
          accepted(post(answer));
          for (const [name, responses] of Object.entries(misfits)) {
            const where = `${encodeIntent(intent)} with ${name}`;
            const failure = Option.getOrElse(Result.getFailure(post(responses)), () =>
              assert.fail(`advance accepted ${where}`),
            );
            assert.strictEqual(failure._tag, "StepResponseMisfit", where);
            if (failure._tag === "StepResponseMisfit") {
              assert.strictEqual(failure.response, Object.keys(responses)[0], where);
              assert.strictEqual(failure.sequenceIndex, 1, where);
            }
          }
        }

        assert.strictEqual(stored(), before);
      }),
  );

  it.effect("passes an invalid time and a missing item through, as no rule of the test", () =>
    Effect.gen(function* doesNotFit() {
      const given = yield* delivery({ navigation: "nonlinear", submission: "individual" });
      const configuration = yield* configure({});
      const session = started(given, configuration);
      const next: Step = { intent: { kind: "next" } };
      const late = advance(given.test, given.items, session, next, configuration, {
        now: new Date(Number.NaN),
      });
      assert.strictEqual(Option.getOrUndefined(Result.getFailure(late))?._tag, "InvalidTime");

      const without = new Map(given.items);
      without.delete("i2");

      const missing = advance(given.test, without, session, next, configuration, { now: after(1) });
      assert.strictEqual(
        Option.getOrUndefined(Result.getFailure(missing))?._tag,
        "TestNotDeliverable",
      );
    }),
  );
});

/**
 * The processing seed every outcome run case starts its session with, so the runs' draws are fixed.
 */
const processingSeed = "advance-outcome-seed";

/**
 * The outcomes of a test whose outcome processing draws `DRAW` from 1 to 1,000,000, sums every
 * item's `SCORE` into `TOTAL`, and reads the test's own `duration` into `TIME`, in that order.
 */
const summingOutcomes: TestOutcomes = {
  declarations: [
    '<qti-outcome-declaration identifier="DRAW" cardinality="single" base-type="integer"/>',
    '<qti-outcome-declaration identifier="TIME" cardinality="single" base-type="duration"/>',
    '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>',
  ].join(""),
  rules: [
    '<qti-set-outcome-value identifier="DRAW"><qti-random-integer min="1" max="1000000"/></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="TOTAL"><qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="TIME"><qti-variable identifier="duration"/></qti-set-outcome-value>',
  ].join(""),
};

/**
 * Give the outcomes run `run` of {@link summingOutcomes} leaves, from what it reads.
 *
 * @param run The run's number, counted from 1.
 * @param seconds The test's `duration`.
 * @param total The sum of every item's `SCORE`.
 * @returns The outcomes, by identifier.
 */
const summed = (run: number, seconds: number, total: number) =>
  ({
    DRAW: {
      baseType: "integer",
      cardinality: "single",
      values: [
        {
          baseType: "integer",
          value:
            1n + drawBelow(drawStream(processingSeed, outcomeLabel(instance, run)), 1_000_000n),
        },
      ],
    },
    TIME: {
      baseType: "duration",
      cardinality: "single",
      values: [{ baseType: "duration", value: seconds }],
    },
    TOTAL: {
      baseType: "float",
      cardinality: "single",
      values: [{ baseType: "float", value: total }],
    },
  }) satisfies Readonly<Record<string, Value>>;

/**
 * Start a session of a delivery under {@link processingSeed}, failing the test when `startTest`
 * refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const seeded = (given: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, {
      instance,
      now: startedAt,
      seed: processingSeed,
    }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

describe("advance and the test's outcome processing", () => {
  it.effect(
    "[T-9] a next on the last item of a linear, individual test submits it and closes the test in one transition: two outcome runs at one now",
    () =>
      Effect.gen(function* nextCloses() {
        const given = yield* delivery(
          { navigation: "linear", submission: "individual" },
          { outcomes: summingOutcomes },
        );
        const configuration = yield* configure({});
        const next: Step = { intent: { kind: "next" }, responses: answer };
        const step = (session: TestSession, seconds: number): TestSession =>
          accepted(
            advance(given.test, given.items, session, next, configuration, { now: after(seconds) }),
          );
        const onLast = step(step(step(seeded(given, configuration), 1), 2), 3);
        assert.strictEqual(onLast.status, "interacting");
        assert.strictEqual(onLast.position, 3);
        assert.strictEqual(onLast.outcomeRuns, 3);
        assert.deepStrictEqual(onLast.outcomes, summed(3, 3, 3));

        const closed = step(onLast, 4.5);
        assert.strictEqual(closed.status, "closed");
        assert.strictEqual(closed.outcomeRuns, 5);
        assert.deepStrictEqual(closed.outcomes, summed(5, 4.5, 4));
        assert.notDeepEqual(summed(4, 4.5, 4), summed(5, 4.5, 4));
      }),
  );

  it.effect(
    "[T-9] passes an outcome run's EngineFailure through advance when an end-part closes the test over a record lacking an outcome the run reads",
    () =>
      Effect.gen(function* failingClose() {
        const given = yield* delivery(
          { navigation: "nonlinear", submission: "individual" },
          { outcomes: summingOutcomes },
        );
        const configuration = yield* configure({});
        const endPart: Step = { intent: { kind: "end-part" } };
        const inLast = accepted(
          advance(given.test, given.items, seeded(given, configuration), endPart, configuration, {
            now: after(1),
          }),
        );
        assert.strictEqual(inLast.status, "interacting");
        assert.strictEqual(inLast.outcomeRuns, 0);

        const lacking: TestSession = {
          ...inLast,
          items: inLast.items.map((item) =>
            item.ref === "i1" ? { ...item, record: { ...item.record, outcomes: {} } } : item,
          ),
        };

        const failure = Option.getOrElse(
          Result.getFailure(
            advance(given.test, given.items, lacking, endPart, configuration, { now: after(2) }),
          ),
          () => assert.fail("expected the closing outcome run to fail, and advance accepted"),
        );

        assert.instanceOf(failure, UnknownIdentifierError);
        assert.deepStrictEqual(
          failure instanceof UnknownIdentifierError
            ? [failure.holder, failure.identifier, failure.role]
            : [],
          ["record", "SCORE", "outcome"],
        );
      }),
  );
});
