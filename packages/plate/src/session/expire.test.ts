import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import type { Value } from "#plate/model/values.ts";
import { advance } from "#plate/session/advance.ts";
import type { AdvanceFailure } from "#plate/session/advance.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Intent, Responses, SessionItem, TestSession } from "#plate/session/session.ts";
import { itemView, startTest } from "#plate/session/start.ts";
import { stub } from "#plate/test-features/contract.ts";
import type { TimedScope } from "#plate/test-features/contract.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

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
 * The deadline the fake module expires its scope at: a minute into the session.
 */
const deadline = after(60);

/**
 * Give the single identifier value of a choice.
 *
 * @param identifier The choice.
 * @returns The value.
 */
const chosen = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * The responses a step posts before the deadline: the choice `A`, the correct response.
 */
const earlier: Responses = { RESPONSE: chosen("A") };

/**
 * The responses the expiring step posts, which the expiry must not save: the choice `B`.
 */
const late: Responses = { RESPONSE: chosen("B") };

/**
 * The item refs of the test in document order: `S1a` and `S1b` in section `S1` and `S2a` in
 * section `S2`, both of part `P1`; then `S3a` and `S3b` in section `S3` of the simultaneous part
 * `P2`.
 */
const refs = ["S1a", "S1b", "S2a", "S3a", "S3b"] as const;

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
 * Write the text of a hand-built test `T` of two parts: `P1`, with individual submission, holding
 * the sections `S1` (`S1a`, `S1b`) and `S2` (`S2a`); then `P2`, nonlinear with simultaneous
 * submission, holding `S3` (`S3a`, `S3b`). Each ref names `<ref>.xml` beside the test.
 *
 * @param navigation `P1`'s navigation mode.
 * @returns The test's text.
 */
const testXml = (navigation: "linear" | "nonlinear"): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    `<qti-test-part identifier="P1" navigation-mode="${navigation}" submission-mode="individual">`,
    '<qti-assessment-section identifier="S1" title="Section 1" visible="true">',
    '<qti-assessment-item-ref identifier="S1a" href="S1a.xml"/>',
    '<qti-assessment-item-ref identifier="S1b" href="S1b.xml"/>',
    "</qti-assessment-section>",
    '<qti-assessment-section identifier="S2" title="Section 2" visible="true">',
    '<qti-assessment-item-ref identifier="S2a" href="S2a.xml"/>',
    "</qti-assessment-section>",
    "</qti-test-part>",
    '<qti-test-part identifier="P2" navigation-mode="nonlinear" submission-mode="simultaneous">',
    '<qti-assessment-section identifier="S3" title="Section 3" visible="true">',
    '<qti-assessment-item-ref identifier="S3a" href="S3a.xml"/>',
    '<qti-assessment-item-ref identifier="S3b" href="S3b.xml"/>',
    "</qti-assessment-section>",
    "</qti-test-part>",
    "</qti-assessment-test>",
  ].join("");

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open the hand-built test of {@link testXml} at `tests/T.xml` and its five items beside it.
 *
 * @param navigation `P1`'s navigation mode.
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
 * The table with a time-limits module that has landed for this test alone, in the stub's place:
 * its `gate` answers `expire` for one scope to any intent at or past {@link deadline}, and lets
 * every earlier intent through.
 *
 * @param scope The scope that expires.
 * @returns The table.
 */
const expiring = (scope: TimedScope): TestFeatureTable =>
  testFeatures.map((module) =>
    module.key === "qti-time-limits"
      ? {
          ...stub({
            element: module.element,
            feature: module.feature,
            issue: module.issue,
            key: module.key,
            namespace: module.namespace,
          }),
          gate: (context) =>
            Option.exists(context.now, (now) => now.getTime() >= deadline.getTime())
              ? Option.some({ kind: "expire", scope })
              : Option.none(),
          implemented: true,
        }
      : module,
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
 * Advance a session with an intent and some responses under a table, failing the test when
 * `advance` refuses.
 *
 * @param given The test and its items.
 * @param features The table.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param responses The responses posted with it.
 * @param seconds When it happens, in seconds after {@link startedAt}.
 * @returns The session after the step.
 */
const advanced = (
  given: Delivery,
  features: TestFeatureTable,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  responses: Responses,
  seconds: number,
): TestSession =>
  Result.getOrElse(
    advance(given.test, given.items, session, { intent, responses }, configuration, {
      features,
      now: after(seconds),
    }),
    (failure) => assert.fail(`advance refused ${encodeIntent(intent)}: ${failure.message}`),
  );

/**
 * Find a session's item by its ref, failing the test when the session lacks it.
 *
 * @param session The session.
 * @param ref The item ref's identifier.
 * @returns The item.
 */
const itemOf = (session: TestSession, ref: string): SessionItem =>
  session.items.find((item) => item.ref === ref) ?? assert.fail(`no item ${ref}`);

/**
 * Read the ref of the item a session shows now.
 *
 * @param session The session.
 * @returns The ref.
 */
const shownRef = (session: TestSession): string => session.items[session.position]?.ref ?? "";

/**
 * An item as an expiry leaves it: whether it was presented, its attempt, its lock, its saved
 * responses and the `RESPONSE` its record holds.
 */
interface ItemState {
  readonly attempt: SessionItem["record"]["attempt"];
  readonly locked: boolean;
  readonly presented: boolean;
  readonly response: Value | undefined;
  readonly saved: Option.Option<Responses>;
}

/**
 * Summarise an item as the expiry leaves it.
 *
 * @param item The item.
 * @returns The summary.
 */
const stateOf = (item: SessionItem): ItemState => ({
  attempt: item.record.attempt,
  locked: item.locked,
  presented: item.presented,
  response: item.record.responses["RESPONSE"],
  saved: item.saved,
});

/**
 * Encode a session and decode it against its test, failing the test when either refuses.
 *
 * @param given The test and its items.
 * @param session The session.
 * @returns The session as the host hands it back.
 */
const throughHost = (given: Delivery, session: TestSession): TestSession =>
  Result.getOrElse(
    Result.flatMap(encodeSession(session), (stored) => {
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the session survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
      const handedBack: unknown = JSON.parse(JSON.stringify(stored));

      return decodeSession(handedBack, given.test);
    }),
    (failure) => assert.fail(`the session did not survive the host: ${failure.message}`),
  );

/**
 * List the intents allowed now as their posted values.
 *
 * @param given The test and its items.
 * @param session The session.
 * @returns The posted value of each intent `allowedIntents` lists.
 */
const allowedNow = (given: Delivery, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(given.test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

describe("a section's expiry", () => {
  it.effect(
    "submits the presented item with its earlier saved responses, not the step's, ends the unpresented one, locks both, moves to the first item after the section, records the scope, and survives the host",
    () =>
      Effect.gen(function* sectionExpires() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const features = expiring({ identifier: "S1", kind: "section" });
        const atStart = started(given, configuration);
        const saved = advanced(
          given,
          features,
          configuration,
          atStart,
          { kind: "go", sequenceIndex: 1 },
          earlier,
          10,
        );
        assert.deepStrictEqual(itemOf(saved, "S1a").saved, Option.some(earlier));

        const expired = advanced(
          given,
          features,
          configuration,
          saved,
          { kind: "submit-item" },
          late,
          90,
        );

        assert.deepStrictEqual(stateOf(itemOf(expired, "S1a")), {
          attempt: "submitted",
          locked: true,
          presented: true,
          response: chosen("A"),
          saved: Option.none(),
        });
        assert.deepStrictEqual(itemOf(expired, "S1a").record.numAttempts, 1);
        assert.deepStrictEqual(stateOf(itemOf(expired, "S1b")), {
          attempt: "none",
          locked: true,
          presented: false,
          response: itemOf(atStart, "S1b").record.responses["RESPONSE"],
          saved: Option.none(),
        });
        assert.strictEqual(shownRef(expired), "S2a");
        assert.isTrue(itemOf(expired, "S2a").presented);
        assert.isFalse(itemOf(expired, "S2a").locked);
        assert.deepStrictEqual(expired.expired, [{ identifier: "S1", kind: "section" }]);
        assert.strictEqual(expired.updated, after(90).toISOString());
        assert.deepStrictEqual(throughHost(given, expired), expired);
      }),
  );

  it.effect(
    "closes the locked items: their views are disabled, submit-item is not offered on one, and a step on one saves nothing",
    () =>
      Effect.gen(function* locksClose() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const features = expiring({ identifier: "S1", kind: "section" });
        const expired = advanced(
          given,
          features,
          configuration,
          started(given, configuration),
          { kind: "next" },
          earlier,
          60,
        );

        for (const sequenceIndex of [1, 2]) {
          const view = Result.getOrElse(
            itemView(given.test, expired, configuration, sequenceIndex),
            (failure) => assert.fail(failure.message),
          );

          assert.isTrue(view.disabled, `item ${sequenceIndex}`);
        }

        const backOnLocked = advanced(
          given,
          features,
          configuration,
          expired,
          { kind: "go", sequenceIndex: 2 },
          {},
          120,
        );
        assert.strictEqual(shownRef(backOnLocked), "S1b");
        assert.notInclude(allowedNow(given, backOnLocked), encodeIntent({ kind: "submit-item" }));

        const stayed = advanced(
          given,
          features,
          configuration,
          backOnLocked,
          { kind: "go", sequenceIndex: 2 },
          late,
          130,
        );
        assert.deepStrictEqual(
          [shownRef(stayed), itemOf(stayed, "S1b").saved, stayed.expired.length],
          ["S1b", Option.none(), 1],
        );
      }),
  );

  it.effect(
    "in a simultaneous part processes nothing and stays: the items are locked, their saved responses kept, and submit-part then processes them",
    () =>
      Effect.gen(function* simultaneousSection() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const features = expiring({ identifier: "S3", kind: "section" });
        const inP2 = advanced(
          given,
          features,
          configuration,
          started(given, configuration),
          { kind: "end-part" },
          {},
          10,
        );
        assert.strictEqual(shownRef(inP2), "S3a");

        const atS3b = advanced(given, features, configuration, inP2, { kind: "next" }, earlier, 20);
        const expired = advanced(
          given,
          features,
          configuration,
          atS3b,
          { kind: "previous" },
          late,
          70,
        );

        assert.strictEqual(shownRef(expired), "S3b");
        assert.deepStrictEqual(
          ["S3a", "S3b"].map((ref) => {
            const item = itemOf(expired, ref);

            return [item.locked, item.record.attempt, item.saved];
          }),
          [
            [true, "none", Option.some(earlier)],
            [true, "none", Option.none()],
          ],
        );
        assert.deepStrictEqual(expired.expired, [{ identifier: "S3", kind: "section" }]);
        assert.include(allowedNow(given, expired), encodeIntent({ kind: "submit-part" }));

        const submitted = advanced(
          given,
          features,
          configuration,
          expired,
          { kind: "submit-part" },
          late,
          80,
        );
        assert.strictEqual(submitted.status, "closed");
        assert.deepStrictEqual(
          ["S3a", "S3b"].map((ref) => itemOf(submitted, ref).record.responses["RESPONSE"]),
          [chosen("A"), itemOf(atS3b, "S3b").record.responses["RESPONSE"]],
        );
        assert.deepStrictEqual(submitted.expired, [{ identifier: "S3", kind: "section" }]);
      }),
  );
});

describe("an item ref's expiry", () => {
  it.effect(
    "in a linear part submits the current item with what it holds and moves on, as next does; from the part's last item it ends the part",
    () =>
      Effect.gen(function* linearItem() {
        const configuration = yield* configure({});
        const given = yield* delivery("linear");
        const features = expiring({ identifier: "S1a", kind: "item-ref" });
        const expired = advanced(
          given,
          features,
          configuration,
          started(given, configuration),
          { kind: "submit-item" },
          late,
          60,
        );

        assert.deepStrictEqual(stateOf(itemOf(expired, "S1a")), {
          attempt: "submitted",
          locked: true,
          presented: true,
          response: itemOf(started(given, configuration), "S1a").record.responses["RESPONSE"],
          saved: Option.none(),
        });
        assert.strictEqual(shownRef(expired), "S1b");
        assert.isFalse(itemOf(expired, "S1b").locked);
        assert.deepStrictEqual(expired.expired, [{ identifier: "S1a", kind: "item-ref" }]);

        const lastFeatures = expiring({ identifier: "S2a", kind: "item-ref" });
        const atS2a = advanced(
          given,
          lastFeatures,
          configuration,
          expired,
          { kind: "next" },
          earlier,
          20,
        );
        assert.strictEqual(shownRef(atS2a), "S2a");

        const ended = advanced(
          given,
          lastFeatures,
          configuration,
          atS2a,
          { kind: "submit-item" },
          late,
          70,
        );
        assert.deepStrictEqual(
          ended.parts.map((part) => part.status),
          ["ended", "current"],
        );
        assert.strictEqual(shownRef(ended), "S3a");
        assert.strictEqual(itemOf(ended, "S2a").record.attempt, "submitted");
      }),
  );

  it.effect("in a nonlinear part submits and locks the item, and the position stays", () =>
    Effect.gen(function* nonlinearItem() {
      const configuration = yield* configure({});
      const given = yield* delivery("nonlinear");
      const features = expiring({ identifier: "S1a", kind: "item-ref" });
      const expired = advanced(
        given,
        features,
        configuration,
        started(given, configuration),
        { kind: "submit-item" },
        late,
        60,
      );

      assert.strictEqual(shownRef(expired), "S1a");
      assert.deepStrictEqual(
        [itemOf(expired, "S1a").locked, itemOf(expired, "S1a").record.attempt],
        [true, "submitted"],
      );
      assert.isFalse(itemOf(expired, "S1b").locked);
      assert.notInclude(allowedNow(given, expired), encodeIntent({ kind: "submit-item" }));
      assert.include(allowedNow(given, expired), encodeIntent({ kind: "next" }));
    }),
  );
});

describe("a part's and the test's expiry", () => {
  it.effect(
    "a part's processes its presented items, locks every item of it and ends it, so the next part starts",
    () =>
      Effect.gen(function* partExpires() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const features = expiring({ identifier: "P1", kind: "part" });
        const atS2a = advanced(
          given,
          features,
          configuration,
          started(given, configuration),
          { kind: "go", sequenceIndex: 3 },
          earlier,
          10,
        );
        const expired = advanced(
          given,
          features,
          configuration,
          atS2a,
          { kind: "end-part" },
          late,
          60,
        );

        assert.deepStrictEqual(
          ["S1a", "S1b", "S2a"].map((ref) => {
            const item = itemOf(expired, ref);

            return [item.locked, item.record.attempt, item.record.responses["RESPONSE"]];
          }),
          [
            [true, "submitted", chosen("A")],
            [true, "none", itemOf(atS2a, "S1b").record.responses["RESPONSE"]],
            [true, "submitted", itemOf(atS2a, "S2a").record.responses["RESPONSE"]],
          ],
        );
        assert.deepStrictEqual(
          expired.parts.map((part) => part.status),
          ["ended", "current"],
        );
        assert.strictEqual(shownRef(expired), "S3a");
        assert.isFalse(itemOf(expired, "S3a").locked);
        assert.deepStrictEqual(expired.expired, [{ identifier: "P1", kind: "part" }]);
        assert.deepStrictEqual(throughHost(given, expired), expired);
      }),
  );

  it.effect(
    "the test's processes the presented items of its open parts, locks every item, ends every part and closes the test",
    () =>
      Effect.gen(function* testExpires() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const features = expiring({ identifier: "T", kind: "test" });
        const expired = advanced(
          given,
          features,
          configuration,
          started(given, configuration),
          { kind: "next" },
          earlier,
          60,
        );

        assert.strictEqual(expired.status, "closed");
        assert.deepStrictEqual(
          expired.parts.map((part) => part.status),
          ["ended", "ended"],
        );
        assert.deepStrictEqual(
          expired.items.map((item) => [item.locked, item.record.attempt]),
          [
            [true, "submitted"],
            [true, "none"],
            [true, "none"],
            [true, "none"],
            [true, "none"],
          ],
        );
        assert.deepStrictEqual(itemOf(expired, "S1a").saved, Option.none());
        assert.deepStrictEqual(expired.expired, [{ identifier: "T", kind: "test" }]);
        assert.deepStrictEqual(allowedNow(given, expired), []);
        assert.deepStrictEqual(throughHost(given, expired), expired);
      }),
  );

  it.effect(
    "a scope the test does not hold is UnknownTimedScope, naming the scope and the test, and nothing is saved",
    () =>
      Effect.gen(function* unknownScope() {
        const configuration = yield* configure({});
        const given = yield* delivery("nonlinear");
        const session = started(given, configuration);
        const result: Result.Result<TestSession, AdvanceFailure> = advance(
          given.test,
          given.items,
          session,
          { intent: { kind: "submit-item" }, responses: late },
          configuration,
          { features: expiring({ identifier: "S9", kind: "section" }), now: after(60) },
        );
        const failure = Option.getOrElse(Result.getFailure(result), () =>
          assert.fail("expected advance to fail, and it accepted"),
        );

        assert.strictEqual(failure._tag, "UnknownTimedScope");
        assert.include(failure.message, '"S9"');
        assert.include(failure.message, '"T"');
      }),
  );
});
