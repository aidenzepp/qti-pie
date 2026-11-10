import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  configure,
  current,
  IntentRefused,
  itemRefs,
  open,
  permits,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  AdvanceFailure,
  Configuration,
  Intent,
  ItemView,
  Permits,
  Responses,
  Step,
  TestSession,
} from "#plate/index.ts";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every step of every walk happens at: no test here sets a time limit, so no step reads
 * the clock.
 */
const now = new Date("2026-11-06T10:00:00.000Z");

/**
 * Read a document of `fixtures/m3f/structure`, the test documents and the two items they name, as
 * text.
 *
 * @param name The file's name under the directory.
 * @returns The file's text.
 */
const fixtureText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m3f/structure/${name}`, import.meta.url), "utf-8");

/**
 * Post the identifiers a candidate chose as the Choice items' `RESPONSE`.
 *
 * @param cardinality The cardinality `RESPONSE` declares: `single` for `choice.xml`, `multiple`
 *   for `choices.xml`.
 * @param chosen The identifiers chosen, in order.
 * @returns The responses of a step.
 */
const chose = (cardinality: "multiple" | "single", ...chosen: readonly string[]): Responses => ({
  RESPONSE: {
    baseType: "identifier",
    cardinality,
    values: chosen.map((value) => ({ baseType: "identifier" as const, value })),
  },
});

/**
 * The correct response of `choice.xml`: the choice `A`.
 */
const correct: Responses = chose("single", "A");

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
 * Open an item document of `fixtures/m3f/structure` at the location the test's item refs resolve
 * to, `tests/<href>` beside the test, through the public `open`.
 *
 * @param href The item ref's `href`, which is the item's file name.
 * @returns The accepted item, failing the test when `open` does not accept it.
 */
const openedItem = Effect.fnUntraced(function* openedItem(href: string) {
  const opened = yield* open(`tests/${href}`, new TextEncoder().encode(fixtureText(href)));

  return Option.getOrElse(acceptedItem(opened), () =>
    assert.fail(`${href} is ${opened.verdict}, not an accepted item`),
  );
});

/**
 * Open a test document of `fixtures/m3f/structure` at `tests/<name>.xml` and the items its item
 * refs name, each item document once however many refs name it, through the public `open`.
 *
 * @param name The test document's name without its extension.
 * @param edit Rewrites the document's text before it is opened, for a variant of the fixture.
 * @returns The test, its items keyed by item ref, and the test's verdict.
 */
const delivery = Effect.fnUntraced(function* delivery(
  name: string,
  edit: (text: string) => string = (text) => text,
) {
  const opened = yield* open(
    `tests/${name}.xml`,
    new TextEncoder().encode(edit(fixtureText(`${name}.xml`))),
  );
  const accepted =
    opened.verdict === "accepted" || opened.verdict === "accepted-with-unsupported"
      ? opened
      : assert.fail(`${name}.xml is ${opened.verdict}`);
  const test =
    accepted.kind === "test" ? accepted.accepted : assert.fail(`${name}.xml is a ${accepted.kind}`);
  const byDocument = new Map<string, Accepted>();
  const items = new Map<string, Accepted>();
  for (const { href, identifier } of itemRefs(test)) {
    const item = byDocument.get(href) ?? (yield* openedItem(href));
    byDocument.set(href, item);
    items.set(identifier, item);
  }

  return { items, test, verdict: accepted.verdict } satisfies Delivery;
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
    startTest(given.test, given.items, configuration, { instance, now }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Write a step: an intent, and the responses posted with it when it carries any.
 *
 * @param intent The intent.
 * @param responses The responses posted with it.
 * @returns The step.
 */
const stepOf = (intent: Intent, responses?: Responses): Step =>
  responses === undefined ? { intent } : { intent, responses };

/**
 * Advance a session with an intent and the responses posted with it, leaving the result as
 * `advance` returned it.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param responses The responses posted with it.
 * @returns The session after the intent, or `advance`'s failure.
 */
const attempted = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  responses?: Responses,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(given.test, given.items, session, stepOf(intent, responses), configuration, { now });

/**
 * Advance a session with an intent and the responses posted with it, failing the test when
 * `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param responses The responses posted with it.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  responses?: Responses,
): TestSession =>
  Result.getOrElse(attempted(given, configuration, session, intent, responses), (failure) =>
    assert.fail(`advance refused ${intent.kind}: ${failure.message}`),
  );

/**
 * Read the refusal `advance` returns for a step, failing the test unless it refuses with an
 * `IntentRefused`.
 *
 * @param result What `advance` returned.
 * @returns The refusal.
 */
const refusal = (result: Result.Result<TestSession, AdvanceFailure>): IntentRefused => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );

  return failure instanceof IntentRefused
    ? failure
    : assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
};

/**
 * Read the rule `advance` refuses a step with.
 *
 * @param result What `advance` returned.
 * @returns The rule.
 */
const refusedRule = (result: Result.Result<TestSession, AdvanceFailure>): string =>
  refusal(result).rule;

/**
 * Read the item a session shows now, failing the test when it shows the summary or `current`
 * fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's view.
 */
const viewOf = (given: Delivery, configuration: Configuration, session: TestSession): ItemView => {
  const shown = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown : assert.fail("current shows the summary, not an item");
};

/**
 * Read the item ref a session shows now.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's ref.
 */
const shownRef = (given: Delivery, configuration: Configuration, session: TestSession): string =>
  viewOf(given, configuration, session).ref;

/**
 * Find the sequence index of an item ref in a session.
 *
 * @param session The session.
 * @param ref The item ref's identifier.
 * @returns The ref's sequence index, failing the test when the session holds no such ref.
 */
const sequenceOf = (session: TestSession, ref: string): number =>
  Option.getOrElse(
    Option.map(
      Option.fromUndefinedOr(session.items.find((item) => item.ref === ref)),
      (item) => item.sequenceIndex,
    ),
    () => assert.fail(`the session holds no item ref ${ref}`),
  );

/**
 * Make an item ref current with `go`, which a nonlinear part allows to any item of the part.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param ref The item ref to show.
 * @param responses The responses posted with the move, saved on the item it leaves.
 * @returns The session with `ref` current.
 */
const gone = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  ref: string,
  responses?: Responses,
): TestSession =>
  advanced(
    given,
    configuration,
    session,
    { kind: "go", sequenceIndex: sequenceOf(session, ref) },
    responses,
  );

/**
 * Carry a session to the start of a part by ending each part before it: `end-part` for an
 * individual part, `submit-part` for a simultaneous one. The parts it ends hold nonlinear
 * individual or simultaneous items, which these intents end at any time.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param part The identifier of the part to reach.
 * @returns The session with `part` current and its first item shown, failing the test when the
 *   test closes first.
 */
const reached = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  part: string,
): TestSession => {
  const here = session.parts.find((entry) => entry.status === "current");
  if (here === undefined) {
    return assert.fail(`the test closed before part ${part} was reached`);
  }

  if (here.identifier === part) {
    return session;
  }

  const kind =
    viewOf(given, configuration, session).submission === "simultaneous"
      ? "submit-part"
      : "end-part";

  return reached(given, configuration, advanced(given, configuration, session, { kind }), part);
};

/**
 * Read what `permits` gives for an item ref of a session.
 *
 * @param given The test and its items.
 * @param session The session.
 * @param ref The item ref's identifier.
 * @returns The item's permissions, failing the test when `permits` fails.
 */
const permitted = (given: Delivery, session: TestSession, ref: string): Permits =>
  Result.getOrElse(permits(given.test, session, sequenceOf(session, ref)), (failure) =>
    assert.fail(`permits failed: ${failure.message}`),
  );

/**
 * List the item refs of a session in sequence order.
 *
 * @param session The session.
 * @returns Each session item's ref.
 */
const refsOf = (session: TestSession): readonly string[] => session.items.map((item) => item.ref);

/**
 * Meet the items of a nonlinear part in the order `next` gives them: the first item's ref, then
 * the ref each `next` shows, until the part's last item.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session, showing the part's first item.
 * @param count How many items the part holds.
 * @returns The refs shown, in order.
 */
const metInOrder = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  count: number,
): readonly string[] => {
  const shown = [shownRef(given, configuration, session)];
  let at = session;
  while (shown.length < count) {
    at = advanced(given, configuration, at, { kind: "next" });
    shown.push(shownRef(given, configuration, at));
  }

  return shown;
};

/**
 * The seven session control fields of an item's configuration, as the item's view carries them.
 *
 * @param view The item's view.
 * @returns The seven fields.
 */
const controlOf = (view: ItemView) => ({
  allowComment: view.configuration.allowComment,
  allowReview: view.configuration.allowReview,
  allowSkipping: view.configuration.allowSkipping,
  maxAttempts: view.configuration.maxAttempts,
  showFeedback: view.configuration.showFeedback,
  showSolution: view.configuration.showSolution,
  validateResponses: view.configuration.validateResponses,
});

/**
 * The item refs of `nested.xml` in document order: the outer section's first item, the middle
 * section's, the inner section's two, the rest of the middle section, the rest of the outer
 * section, then the section after the nest.
 */
const nestedOrder = [
  "outer-first",
  "middle-first",
  "inner-first",
  "inner-second",
  "middle-last",
  "outer-last",
  "after-only",
];

/**
 * Rewrite the text of `nested.xml` so its middle section is not visible.
 *
 * @param text The document's text.
 * @returns The text with the middle section's `visible` false, failing the test when the document
 *   no longer writes that section visible.
 */
const hideMiddle = (text: string): string => {
  const visible = 'identifier="middle" title="Middle section" visible="true"';
  const hidden = text.replace(visible, visible.replace('"true"', '"false"'));

  return hidden === text
    ? assert.fail("nested.xml no longer writes the middle section visible")
    : hidden;
};

/**
 * List the status of each test part of a session, in order.
 *
 * @param session The session.
 * @returns Each part's status.
 */
const statusesOf = (session: TestSession): readonly string[] =>
  session.parts.map((part) => part.status);

describe("item session control through a test session", () => {
  it.effect(
    "[T-5] [S-1] where no element sets a session control attribute, the item's view carries the seven defaults",
    () =>
      Effect.gen(function* unset() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({
          allowComment: true,
          allowReview: false,
          allowSkipping: false,
          maxAttempts: 5,
          showFeedback: true,
          showSolution: true,
          validateResponses: true,
        });
        const view = viewOf(given, configuration, started(given, configuration));

        assert.strictEqual(view.ref, "unset");
        assert.deepStrictEqual(controlOf(view), {
          allowComment: false,
          allowReview: true,
          allowSkipping: true,
          maxAttempts: 1,
          showFeedback: false,
          showSolution: false,
          validateResponses: false,
        });
        assert.isFalse(view.disabled);
      }),
  );

  it.effect(
    "[T-5] [S-1] a part's max-attempts 2 lets an item be submitted twice and refuses the third: attempts-exhausted",
    () =>
      Effect.gen(function* twoAttempts() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const atItem = reached(given, configuration, started(given, configuration), "attempts");
        const before = viewOf(given, configuration, atItem);
        assert.strictEqual(before.ref, "twice");
        assert.strictEqual(before.configuration.maxAttempts, 2);

        const afterFirst = advanced(given, configuration, atItem, { kind: "submit-item" }, correct);
        const first = viewOf(given, configuration, afterFirst);
        assert.strictEqual(first.record.numAttempts, 1);
        assert.isFalse(first.disabled);

        const afterSecond = advanced(
          given,
          configuration,
          afterFirst,
          { kind: "submit-item" },
          correct,
        );
        const second = viewOf(given, configuration, afterSecond);
        assert.strictEqual(second.record.numAttempts, 2);
        assert.isTrue(second.disabled);

        assert.strictEqual(
          refusedRule(
            attempted(given, configuration, afterSecond, { kind: "submit-item" }, correct),
          ),
          "attempts-exhausted",
        );
      }),
  );

  it.effect(
    "[S-1] a section's max-attempts overrides the part's, and an item ref's overrides the section's",
    () =>
      Effect.gen(function* overriddenAttempts() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const atPart = reached(given, configuration, started(given, configuration), "attempts");
        const limits = ["twice", "thrice", "once"].map((ref) =>
          viewOf(given, configuration, gone(given, configuration, atPart, ref)),
        );

        assert.deepStrictEqual(
          limits.map((view) => [view.ref, view.configuration.maxAttempts]),
          [
            ["twice", 2],
            ["thrice", 3],
            ["once", 1],
          ],
        );
      }),
  );

  it.effect(
    "[S-1] [S-8] a sub-section's allow-review overrides its section's, attribute by attribute",
    () =>
      Effect.gen(function* subSectionReview() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const controls = ["outer-item", "inner-item"].map((ref) =>
          controlOf(viewOf(given, configuration, gone(given, configuration, begun, ref))),
        );

        assert.deepStrictEqual(
          controls.map(({ allowReview, showSolution }) => ({ allowReview, showSolution })),
          [
            { allowReview: false, showSolution: true },
            { allowReview: true, showSolution: true },
          ],
        );

        const ended = advanced(given, configuration, begun, { kind: "end-part" });

        assert.deepStrictEqual(permitted(given, ended, "inner-item"), {
          review: true,
          solution: true,
        });
        assert.deepStrictEqual(permitted(given, ended, "outer-item"), {
          review: false,
          solution: true,
        });
      }),
  );

  it.effect(
    "[S-1] show-solution set on one item ref permits the solution of that item alone, and only once it is closed",
    () =>
      Effect.gen(function* solutionOnOneRef() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const atSolved = gone(given, configuration, started(given, configuration), "solved");
        const unpermitted = { review: false, solution: false };
        assert.deepStrictEqual(permitted(given, atSolved, "solved"), unpermitted);
        assert.deepStrictEqual(permitted(given, atSolved, "unsolved"), unpermitted);

        const submitted = advanced(
          given,
          configuration,
          atSolved,
          { kind: "submit-item" },
          correct,
        );
        assert.deepStrictEqual(permitted(given, submitted, "solved"), {
          review: true,
          solution: true,
        });
        assert.deepStrictEqual(permitted(given, submitted, "unsolved"), unpermitted);

        const ended = advanced(given, configuration, submitted, { kind: "end-part" });
        assert.deepStrictEqual(permitted(given, ended, "solved"), { review: true, solution: true });
        assert.deepStrictEqual(permitted(given, ended, "unsolved"), {
          review: true,
          solution: false,
        });
      }),
  );

  it.effect(
    "[S-1] allow-skipping false on a section refuses an empty submit of its items only",
    () =>
      Effect.gen(function* strictSection() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const begun = started(given, configuration);

        const atStrict = gone(given, configuration, begun, "strict-item");
        assert.isFalse(viewOf(given, configuration, atStrict).configuration.allowSkipping);
        assert.strictEqual(
          refusedRule(attempted(given, configuration, atStrict, { kind: "submit-item" })),
          "skipping-not-allowed",
        );

        const answered = advanced(given, configuration, atStrict, { kind: "submit-item" }, correct);
        assert.strictEqual(viewOf(given, configuration, answered).record.numAttempts, 1);

        const atLax = gone(given, configuration, begun, "lax-item");
        assert.isTrue(viewOf(given, configuration, atLax).configuration.allowSkipping);

        const skipped = advanced(given, configuration, atLax, { kind: "submit-item" });
        const view = viewOf(given, configuration, skipped);
        assert.strictEqual(view.record.numAttempts, 1);
        assert.isTrue(view.disabled);
      }),
  );

  it.effect(
    "[S-1] validate-responses true on an item ref refuses responses that break the interaction's limits",
    () =>
      Effect.gen(function* validatedRef() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        const one = chose("multiple", "A");

        const atValidated = gone(given, configuration, begun, "validated");
        assert.isTrue(viewOf(given, configuration, atValidated).configuration.validateResponses);

        const refused = refusal(
          attempted(given, configuration, atValidated, { kind: "submit-item" }, one),
        );
        assert.strictEqual(refused.rule, "responses-invalid");
        assert.deepStrictEqual(
          refused.messages.map((message) => message.response),
          ["RESPONSE"],
        );

        const answered = advanced(
          given,
          configuration,
          atValidated,
          { kind: "submit-item" },
          chose("multiple", "A", "B"),
        );
        assert.strictEqual(viewOf(given, configuration, answered).record.numAttempts, 1);

        const atUnvalidated = gone(given, configuration, begun, "unvalidated");
        assert.isFalse(viewOf(given, configuration, atUnvalidated).configuration.validateResponses);

        const accepted = advanced(
          given,
          configuration,
          atUnvalidated,
          { kind: "submit-item" },
          one,
        );
        assert.strictEqual(viewOf(given, configuration, accepted).record.numAttempts, 1);
      }),
  );

  it.effect(
    "[T-5] [S-1] in a simultaneous part the part's max-attempts gives each item one attempt",
    () =>
      Effect.gen(function* simultaneousAttempts() {
        const given = yield* delivery("controls");
        const configuration = yield* configure({});
        const atFirst = reached(given, configuration, started(given, configuration), "together");
        const first = viewOf(given, configuration, atFirst);
        const atSecond = gone(given, configuration, atFirst, "joint-second", correct);
        const second = viewOf(given, configuration, atSecond);

        assert.deepStrictEqual(
          [first, second].map((view) => [
            view.ref,
            view.submission,
            view.configuration.maxAttempts,
          ]),
          [
            ["joint-first", "simultaneous", 1],
            ["joint-second", "simultaneous", 1],
          ],
        );

        const closed = advanced(given, configuration, atSecond, { kind: "submit-part" }, correct);
        const summary = Result.getOrElse(current(given.test, closed, configuration), (failure) =>
          assert.fail(`current failed: ${failure.message}`),
        );
        assert.strictEqual(summary.kind, "summary");
        assert.deepStrictEqual(
          summary.kind === "summary"
            ? summary.items
                .filter((item) => item.ref.startsWith("joint-"))
                .map((item) => [item.ref, item.numAttempts])
            : [],
          [
            ["joint-first", 1],
            ["joint-second", 1],
          ],
        );
      }),
  );

  it.effect("[S-1] show-feedback on a part reaches each item's configuration", () =>
    Effect.gen(function* feedbackOnPart() {
      const given = yield* delivery("controls");
      const configuration = yield* configure({});
      const begun = started(given, configuration);
      const shown = ["plain", "attempts", "feedback"].map((part) => {
        const view = viewOf(given, configuration, reached(given, configuration, begun, part));

        return [part, view.ref, view.configuration.showFeedback];
      });

      assert.deepStrictEqual(shown, [
        ["plain", "unset", false],
        ["attempts", "twice", false],
        ["feedback", "feedbacked", true],
      ]);
    }),
  );

  it.effect("[S-1] allow-comment true is accepted and marked, never refused", () =>
    Effect.gen(function* commentAllowed() {
      const given = yield* delivery("controls");
      const configuration = yield* configure({});

      assert.strictEqual(given.verdict, "accepted-with-unsupported");
      assert.deepStrictEqual(given.test.unsupported, [
        {
          feature: 'allow-comment="true"',
          path: "qti-assessment-test/qti-test-part[1]/qti-assessment-section[2]/qti-assessment-item-ref/qti-item-session-control",
          shown: "mark",
        },
      ]);

      const begun = started(given, configuration);
      const commented = gone(given, configuration, begun, "commented");
      assert.deepStrictEqual(
        ["unset", "commented"].map((ref) => [
          ref,
          viewOf(given, configuration, gone(given, configuration, begun, ref)).configuration
            .allowComment,
        ]),
        [
          ["unset", false],
          ["commented", true],
        ],
      );
      assert.strictEqual(shownRef(given, configuration, commented), "commented");
    }),
  );
});

describe("sections, nested sections and test parts of a test session", () => {
  it.effect(
    "[S-8] [T-12] three levels of nested sections deliver their items depth-first in document order",
    () =>
      Effect.gen(function* nestedSections() {
        const given = yield* delivery("nested");
        const configuration = yield* configure({});
        const begun = started(given, configuration);

        assert.strictEqual(given.verdict, "accepted");
        assert.deepStrictEqual(refsOf(begun), nestedOrder);
        assert.deepStrictEqual(
          begun.items.map((item) => item.sequenceIndex),
          [1, 2, 3, 4, 5, 6, 7],
        );
        assert.deepStrictEqual(metInOrder(given, configuration, begun, 7), nestedOrder);
      }),
  );

  it.effect(
    "[S-8] an invisible section's items are delivered in place, the same sequence as a visible one",
    () =>
      Effect.gen(function* invisibleSection() {
        const configuration = yield* configure({});
        const shown = yield* delivery("nested");
        const hidden = yield* delivery("nested", hideMiddle);
        const atShown = started(shown, configuration);
        const atHidden = started(hidden, configuration);

        assert.strictEqual(hidden.verdict, "accepted");
        assert.deepStrictEqual(refsOf(atHidden), refsOf(atShown));
        assert.deepStrictEqual(refsOf(atHidden), nestedOrder);
        assert.deepStrictEqual(metInOrder(hidden, configuration, atHidden, 7), nestedOrder);
      }),
  );

  it.effect("[T-11] three test parts run in order and an ended part never reopens", () =>
    Effect.gen(function* threeParts() {
      const given = yield* delivery("parts");
      const configuration = yield* configure({});
      const begun = started(given, configuration);

      assert.strictEqual(given.verdict, "accepted");
      assert.deepStrictEqual(refsOf(begun), [
        "s1-first",
        "s1-second",
        "s2-only",
        "together-first",
        "together-second",
        "linear-first",
        "linear-last",
      ]);
      assert.deepStrictEqual(statusesOf(begun), ["current", "pending", "pending"]);

      const inSecond = advanced(given, configuration, begun, { kind: "end-part" });
      assert.deepStrictEqual(statusesOf(inSecond), ["ended", "current", "pending"]);
      assert.strictEqual(shownRef(given, configuration, inSecond), "together-first");
      assert.strictEqual(
        refusedRule(attempted(given, configuration, inSecond, { kind: "go", sequenceIndex: 1 })),
        "out-of-range",
      );
      assert.strictEqual(
        refusedRule(attempted(given, configuration, inSecond, { kind: "go", sequenceIndex: 6 })),
        "out-of-range",
      );
      assert.strictEqual(
        refusedRule(attempted(given, configuration, inSecond, { kind: "previous" })),
        "start-of-part",
      );

      const inThird = advanced(given, configuration, inSecond, { kind: "submit-part" });
      assert.deepStrictEqual(statusesOf(inThird), ["ended", "ended", "current"]);
      assert.strictEqual(shownRef(given, configuration, inThird), "linear-first");

      const atLast = advanced(given, configuration, inThird, { kind: "next" }, correct);
      assert.strictEqual(shownRef(given, configuration, atLast), "linear-last");
      assert.strictEqual(atLast.status, "interacting");

      const closed = advanced(given, configuration, atLast, { kind: "next" }, correct);
      assert.strictEqual(closed.status, "closed");
      assert.deepStrictEqual(statusesOf(closed), ["ended", "ended", "ended"]);

      const summary = Result.getOrElse(current(given.test, closed, configuration), (failure) =>
        assert.fail(`current failed: ${failure.message}`),
      );
      assert.strictEqual(summary.kind, "summary");
      assert.deepStrictEqual(
        summary.kind === "summary" ? summary.items.map((item) => item.ref) : [],
        refsOf(begun),
      );
      assert.strictEqual(
        refusedRule(attempted(given, configuration, closed, { kind: "go", sequenceIndex: 1 })),
        "test-closed",
      );
    }),
  );

  it.effect(
    "[T-11] [T-12] a nonlinear part's go reaches an item of its other section; the next, linear part refuses go and previous",
    () =>
      Effect.gen(function* acrossSections() {
        const given = yield* delivery("parts");
        const configuration = yield* configure({});
        const begun = started(given, configuration);
        assert.strictEqual(shownRef(given, configuration, begun), "s1-first");

        const inOtherSection = gone(given, configuration, begun, "s2-only");
        assert.strictEqual(shownRef(given, configuration, inOtherSection), "s2-only");

        const back = advanced(given, configuration, inOtherSection, { kind: "previous" });
        assert.strictEqual(shownRef(given, configuration, back), "s1-second");

        const inLinear = reached(given, configuration, begun, "third");
        const view = viewOf(given, configuration, inLinear);
        assert.deepStrictEqual(
          [view.ref, view.navigation, view.submission],
          ["linear-first", "linear", "individual"],
        );

        const refused = [
          { kind: "go", sequenceIndex: sequenceOf(inLinear, "linear-last") },
          { kind: "previous" },
          { kind: "end-part" },
        ] satisfies readonly Intent[];
        assert.deepStrictEqual(
          refused.map((intent) => refusedRule(attempted(given, configuration, inLinear, intent))),
          ["linear-jump", "linear-back", "linear-jump"],
        );
      }),
  );
});
