import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  advance,
  allowedIntents,
  configure,
  current,
  encodeIntent,
  encodeSession,
  open,
  results,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Intent,
  Responses,
  TestSession,
} from "#plate/index.ts";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
 */
const startedAt = new Date("2026-11-10T09:00:00.000Z");

/**
 * Read a fixture of `fixtures/m5/branching` as text.
 *
 * @param name The fixture's file name.
 * @returns Its text.
 */
const fixture = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m5/branching/${name}`, import.meta.url), "utf-8");

/**
 * The linear test: part `P1` of sections `A` (`a1`, `a2`, `a3`), `B` (`b1`, `b2`) and `C` (`c1`),
 * then part `P2` of section `D` (`d1`).
 */
const linearText = fixture("test.xml");

/**
 * The nonlinear test: part `N1` of section `NA` (`n1`, `n2`, `n3`), part `N2` of `NB` (`m1`) and
 * part `N3` of `NC` (`r1`).
 */
const nonlinearText = fixture("nonlinear.xml");

/**
 * The item refs of the linear test, each naming the one Choice item.
 */
const linearRefs = ["a1", "a2", "a3", "b1", "b2", "c1", "d1"] as const;

/**
 * The item refs of the nonlinear test, each naming the one Choice item.
 */
const nonlinearRefs = ["n1", "n2", "n3", "m1", "r1"] as const;

/**
 * `a1`'s branch rule to `b1` on `a1.SCORE > 0`, as the linear test writes it.
 */
const a1Branch = /<qti-branch-rule target="b1">[\s\S]*?<\/qti-branch-rule>/u;

/**
 * The expression `a1`'s branch rule holds, as the linear test writes it.
 */
const a1BranchExpression = /(?<=<qti-branch-rule target="b1">)[\s\S]*?(?=<\/qti-branch-rule>)/u;

/**
 * The expression `a2`'s pre-condition holds, as the linear test writes it.
 */
const a2PreConditionExpression =
  /(?<=<qti-assessment-item-ref identifier="a2" href="choice.xml">\s*<qti-pre-condition>)[\s\S]*?(?=<\/qti-pre-condition>)/u;

/**
 * An expression that is NULL until `b1` is submitted: whether `b1`'s response is `A`, which
 * `qti-match` gives as NULL while the response is NULL.
 */
const unsubmittedMatch =
  '<qti-match><qti-variable identifier="b1.RESPONSE"/><qti-base-value base-type="identifier">A</qti-base-value></qti-match>';

/**
 * Change a fixture's text, failing the test when the pattern matches nothing, so a variant never
 * silently equals the fixture.
 *
 * @param text The fixture's text.
 * @param pattern What to replace.
 * @param replacement What replaces it.
 * @returns The variant's text.
 */
const variant = (text: string, pattern: RegExp, replacement: string): string => {
  const changed = text.replace(pattern, replacement);

  return changed === text
    ? assert.fail(`the fixture holds nothing ${String(pattern)} matches`)
    : changed;
};

/**
 * The responses that answer the Choice item right, `A`, which scores 1.
 */
const right: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * The responses that answer the Choice item wrong, `B`, which scores 0.
 */
const wrong: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "B" }],
  },
};

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a test's text at `branching/test.xml` and the Choice item beside it for each of its item
 * refs, through the public `open`. Either accepted verdict is taken, so each walk judges the
 * sequence alone; the first test pins the verdict.
 *
 * @param text The test's text.
 * @param refs The test's item refs.
 * @returns The test and its items, keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery(text: string, refs: readonly string[]) {
  const encoder = new TextEncoder();
  const verdict = yield* open("branching/test.xml", encoder.encode(text));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const opened = yield* open("branching/choice.xml", encoder.encode(fixture("choice.xml")));
  const item = Option.getOrElse(acceptedItem(opened), () =>
    assert.fail(`the Choice item is ${opened.verdict}`),
  );

  return { items: new Map(refs.map((ref) => [ref, item])), test } satisfies Delivery;
});

/**
 * One request of a walk: its intent, and the responses it posts.
 */
type Request = readonly [Intent, Responses];

/**
 * `next`, posting the responses given.
 *
 * @param responses The responses.
 * @returns The request.
 */
const nextWith = (responses: Responses): Request => [{ kind: "next" }, responses];

/**
 * `submit-item`, posting the responses given.
 *
 * @param responses The responses.
 * @returns The request.
 */
const submit = (responses: Responses): Request => [{ kind: "submit-item" }, responses];

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
 * Advance a session by each request in turn, ten seconds apart, failing the test when `advance`
 * refuses one.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param requests The requests.
 * @returns The session after the last request.
 */
const walked = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  requests: readonly Request[],
): TestSession => {
  let at = session;
  for (const [step, [intent, responses]] of requests.entries()) {
    at = Result.getOrElse(
      advance(given.test, given.items, at, { intent, responses }, configuration, {
        now: new Date(startedAt.getTime() + (step + 1) * 10_000),
      }),
      (failure) => assert.fail(`advance refused ${encodeIntent(intent)}: ${failure.message}`),
    );
  }

  return at;
};

/**
 * Read the item ref a session shows now, or `summary` once it shows the closed test's summary,
 * failing the test when `current` fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's ref, or `summary`.
 */
const shownRef = (given: Delivery, configuration: Configuration, session: TestSession): string => {
  const shown = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown.ref : "summary";
};

/**
 * Start a session of a delivery and walk it, giving where it stands.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param requests The requests.
 * @returns The session after the walk.
 */
const walk = (
  given: Delivery,
  configuration: Configuration,
  requests: readonly Request[],
): TestSession => walked(given, configuration, started(given, configuration), requests);

/**
 * List the item refs a session has presented, in sequence.
 *
 * @param session The session.
 * @returns The refs of its presented items.
 */
const presentedRefs = (session: TestSession): readonly string[] =>
  session.items.filter((item) => item.presented).map((item) => item.ref);

/**
 * Read the answered status the results report writes for an item's `RESPONSE`.
 *
 * @param xml The results report.
 * @param ref The item ref.
 * @returns The `answeredStatus` of the item's response variable.
 */
const answeredStatusOf = (xml: string, ref: string): string => {
  const result = new RegExp(
    `<itemResult[^>]*identifier="${ref}"[^>]*>([\\s\\S]*?)</itemResult>`,
    "u",
  ).exec(xml);
  const status = /<responseVariable[^>]*answeredStatus="(?<status>[a-z]+)"/u.exec(
    result?.[1] ?? "",
  );

  return (
    status?.groups?.["status"] ?? assert.fail(`the report holds no answered status for ${ref}`)
  );
};

describe("branch rules and pre-conditions", () => {
  it.effect(
    "[branching] a test holding pre-conditions and branch rules opens accepted, with neither marked",
    () =>
      Effect.gen(function* opensAccepted() {
        for (const text of [linearText, nonlinearText]) {
          const verdict = yield* open("branching/test.xml", new TextEncoder().encode(text));
          assert.strictEqual(verdict.verdict, "accepted");
          assert.deepStrictEqual(
            verdict.verdict === "accepted" && verdict.kind === "test"
              ? verdict.accepted.unsupported
              : assert.fail(`not a test: ${verdict.kind}`),
            [],
          );
        }
      }),
  );

  it.effect(
    "[branching] a true item branch rule jumps forward to its target after the item is submitted",
    () =>
      Effect.gen(function* trueItemBranch() {
        const configuration = yield* configure({});
        const given = yield* delivery(linearText, linearRefs);

        const throughNext = walk(given, configuration, [nextWith(right)]);
        assert.strictEqual(shownRef(given, configuration, throughNext), "b1");
        assert.deepStrictEqual(presentedRefs(throughNext), ["a1", "b1"]);

        const submittedFirst = walk(given, configuration, [submit(right)]);
        assert.strictEqual(shownRef(given, configuration, submittedFirst), "a1");
        assert.strictEqual(
          shownRef(
            given,
            configuration,
            walked(given, configuration, submittedFirst, [nextWith({})]),
          ),
          "b1",
        );
      }),
  );

  it.effect("[branching] a false item branch rule leaves the sequence as it is", () =>
    Effect.gen(function* falseItemBranch() {
      const configuration = yield* configure({});
      const given = yield* delivery(linearText, linearRefs);

      assert.strictEqual(
        shownRef(given, configuration, walk(given, configuration, [nextWith(wrong)])),
        "a2",
      );
    }),
  );

  it.effect("[branching] a false pre-condition skips its item", () =>
    Effect.gen(function* falsePreCondition() {
      const configuration = yield* configure({});
      const given = yield* delivery(variant(linearText, a1Branch, ""), linearRefs);

      const after = walk(given, configuration, [nextWith(right)]);
      assert.strictEqual(shownRef(given, configuration, after), "a3");
      assert.deepStrictEqual(presentedRefs(after), ["a1", "a3"]);
    }),
  );

  it.effect("[branching] pre-conditions are evaluated in order and the first false one skips", () =>
    Effect.gen(function* preConditionsInOrder() {
      const configuration = yield* configure({});
      const given = yield* delivery(linearText, linearRefs);
      const toB1 = (a3: Responses): readonly Request[] => [
        nextWith(wrong),
        nextWith(wrong),
        nextWith(a3),
        nextWith(wrong),
      ];

      assert.strictEqual(
        shownRef(given, configuration, walk(given, configuration, toB1(wrong))),
        "c1",
      );
      assert.strictEqual(
        shownRef(given, configuration, walk(given, configuration, toB1(right))),
        "b2",
      );
    }),
  );

  it.effect(
    "[branching] EXIT_TESTPART on a section ends the part and moves to the next part when its pre-condition holds",
    () =>
      Effect.gen(function* exitTestPart() {
        const configuration = yield* configure({});
        const given = yield* delivery(linearText, linearRefs);

        const stopped = walk(given, configuration, [nextWith(right), nextWith(right)]);
        assert.strictEqual(shownRef(given, configuration, stopped), "d1");
        assert.deepStrictEqual(stopped.outcomes["STOP"]?.values, [
          { baseType: "boolean", value: true },
        ]);
        assert.deepStrictEqual(presentedRefs(stopped), ["a1", "b1", "d1"]);
        assert.deepStrictEqual(
          stopped.parts.map((part) => part.status),
          ["ended", "current"],
        );

        const going = walk(given, configuration, [nextWith(right), nextWith(wrong)]);
        assert.strictEqual(shownRef(given, configuration, going), "c1");
      }),
  );

  it.effect(
    "[branching] a false part pre-condition skips the whole part, and the end of the test closes the session",
    () =>
      Effect.gen(function* falsePartPreCondition() {
        const configuration = yield* configure({});
        const given = yield* delivery(linearText, linearRefs);

        const atC1 = walk(given, configuration, [
          nextWith(wrong),
          nextWith(wrong),
          nextWith(right),
          nextWith(wrong),
          nextWith(wrong),
        ]);
        assert.strictEqual(shownRef(given, configuration, atC1), "c1");

        const closed = walked(given, configuration, atC1, [nextWith(wrong)]);
        assert.strictEqual(closed.status, "closed");
        assert.strictEqual(shownRef(given, configuration, closed), "summary");
        assert.isFalse(closed.items.some((item) => item.ref === "d1" && item.presented));
        assert.deepStrictEqual(
          closed.parts.map((part) => part.status),
          ["ended", "ended"],
        );
      }),
  );

  it.effect(
    "[branching] item and section rules are ignored in a nonlinear part, and part rules still apply",
    () =>
      Effect.gen(function* nonlinearPart() {
        const configuration = yield* configure({});
        const given = yield* delivery(nonlinearText, nonlinearRefs);

        const atN2 = walk(given, configuration, [nextWith(right)]);
        assert.strictEqual(shownRef(given, configuration, atN2), "n2");
        for (const sequenceIndex of [3, 2, 1]) {
          const reached = walked(given, configuration, atN2, [[{ kind: "go", sequenceIndex }, {}]]);
          assert.strictEqual(
            shownRef(given, configuration, reached),
            nonlinearRefs[sequenceIndex - 1],
          );
        }

        const skippedN2 = walk(given, configuration, [[{ kind: "end-part" }, {}]]);
        assert.strictEqual(shownRef(given, configuration, skippedN2), "r1");
        assert.deepStrictEqual(
          skippedN2.parts.map((part) => part.status),
          ["ended", "ended", "current"],
        );

        const enteredN2 = walk(given, configuration, [submit(right), [{ kind: "end-part" }, {}]]);
        assert.strictEqual(shownRef(given, configuration, enteredN2), "m1");
      }),
  );

  it.effect("[branching] a part branch rule jumps to a later part, in a nonlinear part too", () =>
    Effect.gen(function* partBranch() {
      const configuration = yield* configure({});
      const given = yield* delivery(nonlinearText, nonlinearRefs);

      const jumped = walk(given, configuration, [
        submit(right),
        [{ kind: "go", sequenceIndex: 2 }, {}],
        submit(right),
        [{ kind: "end-part" }, {}],
      ]);
      assert.strictEqual(shownRef(given, configuration, jumped), "r1");
      assert.isFalse(jumped.items.some((item) => item.ref === "m1" && item.presented));
    }),
  );

  it.effect("[branching] the first item's pre-conditions are evaluated as the session starts", () =>
    Effect.gen(function* firstItem() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        variant(
          linearText,
          /<qti-assessment-item-ref identifier="a1" href="choice.xml">/u,
          '$&<qti-pre-condition><qti-base-value base-type="boolean">false</qti-base-value></qti-pre-condition>',
        ),
        linearRefs,
      );

      const session = started(given, configuration);
      assert.strictEqual(shownRef(given, configuration, session), "a2");
      assert.deepStrictEqual(presentedRefs(session), ["a2"]);
    }),
  );

  it.effect("[branching] a prefixed reference reads the named item's last submitted value", () =>
    Effect.gen(function* lastSubmitted() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        variant(
          linearText,
          /(?<=<qti-assessment-item-ref identifier="a1" href="choice.xml">[\s\S]*?<\/qti-branch-rule>)/u,
          '<qti-item-session-control max-attempts="2"/>',
        ),
        linearRefs,
      );

      const rightLast = walk(given, configuration, [submit(wrong), submit(right), nextWith(wrong)]);
      assert.strictEqual(shownRef(given, configuration, rightLast), "b1");

      const wrongLast = walk(given, configuration, [submit(right), submit(wrong), nextWith(right)]);
      assert.strictEqual(shownRef(given, configuration, wrongLast), "a2");

      const savedOnly = walk(given, configuration, [submit(wrong), nextWith(right)]);
      assert.strictEqual(shownRef(given, configuration, savedOnly), "a2");
    }),
  );

  it.effect("[branching] a NULL expression neither branches nor lets its pre-condition hold", () =>
    Effect.gen(function* nullExpression() {
      const configuration = yield* configure({});

      const nullBranch = yield* delivery(
        variant(linearText, a1BranchExpression, `<qti-not>${unsubmittedMatch}</qti-not>`),
        linearRefs,
      );
      assert.strictEqual(
        shownRef(nullBranch, configuration, walk(nullBranch, configuration, [nextWith(wrong)])),
        "a2",
      );

      const nullPreCondition = yield* delivery(
        variant(linearText, a2PreConditionExpression, unsubmittedMatch),
        linearRefs,
      );
      const skipped = walk(nullPreCondition, configuration, [nextWith(wrong)]);
      assert.strictEqual(shownRef(nullPreCondition, configuration, skipped), "a3");
      assert.deepStrictEqual(presentedRefs(skipped), ["a1", "a3"]);
    }),
  );

  it.effect("[branching] a skipped item is reported notpresented", () =>
    Effect.gen(function* reportedNotPresented() {
      const configuration = yield* configure({});
      const given = yield* delivery(variant(linearText, a1Branch, ""), linearRefs);

      const report = (session: TestSession): string =>
        Result.getOrElse(
          results({
            context: {},
            items: given.items,
            kind: "test",
            session: Result.getOrElse(encodeSession(session), (failure) =>
              assert.fail(`encodeSession refused: ${failure.message}`),
            ),
            test: given.test,
          }),
          (failure) => assert.fail(`results refused: ${failure.message}`),
        );

      const pastA2 = walk(given, configuration, [nextWith(right)]);
      assert.strictEqual(answeredStatusOf(report(pastA2), "a2"), "notpresented");
      assert.strictEqual(answeredStatusOf(report(pastA2), "a1"), "answered");

      const closed = walked(given, configuration, pastA2, [
        nextWith(wrong),
        nextWith(wrong),
        nextWith(wrong),
        nextWith(wrong),
      ]);
      assert.strictEqual(closed.status, "closed");
      assert.deepStrictEqual(presentedRefs(closed), ["a1", "a3", "b1", "c1", "d1"]);
      assert.strictEqual(answeredStatusOf(report(closed), "a2"), "notpresented");
      assert.strictEqual(answeredStatusOf(report(closed), "b2"), "notpresented");
    }),
  );

  it.effect("[branching] allowedIntents agrees with the jump", () =>
    Effect.gen(function* allowedJump() {
      const configuration = yield* configure({});
      const given = yield* delivery(linearText, linearRefs);

      const submitted = walk(given, configuration, [submit(right)]);
      const offered = Result.getOrElse(allowedIntents(given.test, submitted), (failure) =>
        assert.fail(`allowedIntents failed: ${failure.message}`),
      );
      const offeredNext = Option.getOrElse(
        Option.fromUndefinedOr(offered.find((intent) => intent.kind === "next")),
        () => assert.fail("allowedIntents offers no next"),
      );
      assert.strictEqual(
        shownRef(
          given,
          configuration,
          walked(given, configuration, submitted, [[offeredNext, {}]]),
        ),
        "b1",
      );
    }),
  );
});
