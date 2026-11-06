import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import type { Value } from "#plate/model/values.ts";
import { advance } from "#plate/session/advance.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

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
 * The correct choice for every item's `RESPONSE`.
 */
const answer: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "A" }],
};

/**
 * Write the text of a hand-built Choice item: `RESPONSE`, a single identifier whose correct
 * response is `A`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const choiceItemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
    '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
    '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
    "</qti-choice-interaction></qti-item-body>",
    '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
  ].join("");

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a hand-built test of one part in some modes holding the items `i1`, `i2` and `i3`, then a
 * nonlinear, individual part holding `i4`, the test at `tests/<identifier>.xml` and each item
 * beside it.
 *
 * @param identifier The test's identifier.
 * @param navigation The first part's navigation mode.
 * @param submission The first part's submission mode.
 * @returns The test and its items.
 */
const delivery = Effect.fnUntraced(function* delivery(
  identifier: string,
  navigation: "linear" | "nonlinear",
  submission: "individual" | "simultaneous",
) {
  const encoder = new TextEncoder();
  const text = [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    `<qti-test-part identifier="P1" navigation-mode="${navigation}" submission-mode="${submission}">`,
    '<qti-assessment-section identifier="S1" title="Section" visible="true">',
    ...["i1", "i2", "i3"].map(
      (ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`,
    ),
    "</qti-assessment-section></qti-test-part>",
    '<qti-test-part identifier="P2" navigation-mode="nonlinear" submission-mode="individual">',
    '<qti-assessment-section identifier="S2" title="Section" visible="true">',
    '<qti-assessment-item-ref identifier="i4" href="i4.xml"/>',
    "</qti-assessment-section></qti-test-part>",
    "</qti-assessment-test>",
  ].join("");
  const verdict = yield* open(`tests/${identifier}.xml`, encoder.encode(text));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2", "i3", "i4"]) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(choiceItemXml(ref)));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  return { items, test } satisfies Delivery;
});

/**
 * Start a session of a delivery and take some intents through `advance`, each posting the correct
 * choice, failing the test when one is refused.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param intents The intents, in order.
 * @returns The session after the last.
 */
const sessionAfter = (
  given: Delivery,
  configuration: Configuration,
  intents: readonly Intent[],
): TestSession => {
  let session = Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance: "sitting", now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );
  for (const [index, intent] of intents.entries()) {
    session = Result.getOrElse(
      advance(
        given.test,
        given.items,
        session,
        { intent, responses: { RESPONSE: answer } },
        configuration,
        { now: after(index + 1) },
      ),
      (failure) => assert.fail(`advance refused ${encodeIntent(intent)}: ${failure.message}`),
    );
  }

  return session;
};

/**
 * List the intents allowed now as their posted values.
 *
 * @param test The test.
 * @param session The session.
 * @returns The posted value of each intent, in the order `allowedIntents` lists them.
 */
const allowedNow = (test: AcceptedTest, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

describe("allowedIntents", () => {
  it.effect(
    "lists next, go to the current item and submit-item at the start of a linear, individual part",
    () =>
      Effect.gen(function* linearIndividual() {
        const given = yield* delivery("LI", "linear", "individual");
        const configuration = yield* configure({});
        assert.deepStrictEqual(allowedNow(given.test, sessionAfter(given, configuration, [])), [
          "next",
          "go:1",
          "submit-item",
        ]);

        const submitted = sessionAfter(given, configuration, [{ kind: "submit-item" }]);
        assert.deepStrictEqual(allowedNow(given.test, submitted), ["next", "go:1"]);

        const last = sessionAfter(given, configuration, [{ kind: "next" }, { kind: "next" }]);
        assert.strictEqual(last.position, 2);
        assert.deepStrictEqual(allowedNow(given.test, last), ["next", "go:3", "submit-item"]);
      }),
  );

  it.effect(
    "lists next, go to the current item and submit-part in a linear, simultaneous part",
    () =>
      Effect.gen(function* linearSimultaneous() {
        const given = yield* delivery("LS", "linear", "simultaneous");
        const configuration = yield* configure({});
        assert.deepStrictEqual(allowedNow(given.test, sessionAfter(given, configuration, [])), [
          "next",
          "go:1",
          "submit-part",
        ]);

        const last = sessionAfter(given, configuration, [{ kind: "next" }, { kind: "next" }]);
        assert.deepStrictEqual(allowedNow(given.test, last), ["go:3", "submit-part"]);
      }),
  );

  it.effect(
    "lists every move inside a nonlinear, individual part, submit-item while the item is open, and end-part",
    () =>
      Effect.gen(function* nonlinearIndividual() {
        const given = yield* delivery("NI", "nonlinear", "individual");
        const configuration = yield* configure({});
        assert.deepStrictEqual(allowedNow(given.test, sessionAfter(given, configuration, [])), [
          "next",
          "go:1",
          "go:2",
          "go:3",
          "submit-item",
          "end-part",
        ]);

        const closedLast = sessionAfter(given, configuration, [
          { kind: "go", sequenceIndex: 3 },
          { kind: "submit-item" },
        ]);
        assert.deepStrictEqual(allowedNow(given.test, closedLast), [
          "previous",
          "go:1",
          "go:2",
          "go:3",
          "end-part",
        ]);
      }),
  );

  it.effect("lists every move inside a nonlinear, simultaneous part and submit-part", () =>
    Effect.gen(function* nonlinearSimultaneous() {
      const given = yield* delivery("NS", "nonlinear", "simultaneous");
      const configuration = yield* configure({});
      assert.deepStrictEqual(
        allowedNow(given.test, sessionAfter(given, configuration, [{ kind: "next" }])),
        ["next", "previous", "go:1", "go:2", "go:3", "submit-part"],
      );

      const next = sessionAfter(given, configuration, [{ kind: "submit-part" }]);
      assert.strictEqual(next.position, 3);
      assert.deepStrictEqual(allowedNow(given.test, next), ["go:4", "submit-item", "end-part"]);
    }),
  );

  it.effect("lists nothing once the test has closed", () =>
    Effect.gen(function* closed() {
      const given = yield* delivery("NC", "nonlinear", "individual");
      const configuration = yield* configure({});
      const session = sessionAfter(given, configuration, [
        { kind: "end-part" },
        { kind: "end-part" },
      ]);
      assert.strictEqual(session.status, "closed");
      assert.deepStrictEqual(allowedNow(given.test, session), []);
    }),
  );

  it.effect("fails with UnknownItemRef for a session of another test", () =>
    Effect.gen(function* otherTest() {
      const given = yield* delivery("NO", "nonlinear", "individual");
      const configuration = yield* configure({});
      const session = sessionAfter(given, configuration, []);
      const other = { ...session, items: session.items.map((item) => ({ ...item, ref: "x" })) };
      assert.strictEqual(
        Option.getOrUndefined(Result.getFailure(allowedIntents(given.test, other)))?._tag,
        "UnknownItemRef",
      );
    }),
  );
});
