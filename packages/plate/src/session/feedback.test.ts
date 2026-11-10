import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { Value } from "#plate/model/values.ts";
import { advance } from "#plate/session/advance.ts";
import { feedbackShown } from "#plate/session/feedback.ts";
import { itemView, startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-10T09:00:00.000Z");

/**
 * The item both refs deliver: a Text Entry that reads `RESPONSE`, a single string whose correct
 * response is `seven`, scored by `match_correct` into `SCORE`.
 */
const numberItemXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="number" title="A number" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string">',
  "<qti-correct-response><qti-value>seven</qti-value></qti-correct-response>",
  "</qti-response-declaration>",
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  "<qti-item-body><p>Three and four make ",
  '<qti-text-entry-interaction response-identifier="RESPONSE"/>.</p></qti-item-body>',
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
  "</qti-assessment-item>",
].join("");

/**
 * Write the text of a linear test of one part with individual submission, whose first item ref
 * allows one attempt and sets `show-feedback` as given, and whose second sets neither.
 *
 * @param showFeedback The first ref's `show-feedback`.
 * @returns The test's text.
 */
const testXml = (showFeedback: boolean): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    '<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
    '<qti-assessment-section identifier="S" title="Section" visible="true">',
    '<qti-assessment-item-ref identifier="i1" href="number.xml">',
    `<qti-item-session-control max-attempts="1" show-feedback="${showFeedback}"/>`,
    "</qti-assessment-item-ref>",
    '<qti-assessment-item-ref identifier="i2" href="number.xml"/>',
    "</qti-assessment-section></qti-test-part></qti-assessment-test>",
  ].join("");

/**
 * A test and the items it delivers, with the host's configuration.
 */
interface Delivery {
  readonly configuration: Configuration;
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open the test of {@link testXml} at `tests/T.xml` and its item beside it.
 *
 * @param showFeedback The first ref's `show-feedback`.
 * @returns The delivery, under the default configuration, whose `showFeedback` is false.
 */
const delivery = Effect.fnUntraced(function* delivery(showFeedback: boolean) {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/T.xml", encoder.encode(testXml(showFeedback)));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const opened = yield* open("tests/number.xml", encoder.encode(numberItemXml));
  const item = Option.getOrElse(acceptedItem(opened), () =>
    assert.fail(`the item is ${opened.verdict}, not an accepted item`),
  );

  return {
    configuration: yield* configure({}),
    items: new Map([
      ["i1", item],
      ["i2", item],
    ]),
    test,
  } satisfies Delivery;
});

/**
 * Require a result to succeed.
 *
 * @param result The result.
 * @param what What gave it, for a failure's message.
 * @returns Its success.
 */
const ok = <A, E>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what} failed: ${String(failure)}`));

/**
 * A single string value.
 *
 * @param value The string.
 * @returns The value.
 */
const text = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

describe("feedbackShown", () => {
  it.effect(
    "[W0-BC] feedbackShown is true for an open item and the item's show-feedback for a closed one",
    () =>
      Effect.gen(function* decides() {
        for (const showFeedback of [false, true]) {
          const given = yield* delivery(showFeedback);
          const started = ok(
            startTest(given.test, given.items, given.configuration, {
              instance: "sitting",
              now: startedAt,
            }),
            "startTest",
          );
          const before = ok(itemView(given.test, started, given.configuration, 1), "itemView");

          assert.isFalse(before.disabled, `show-feedback ${showFeedback}: item 1 starts open`);
          assert.isTrue(feedbackShown(before), `show-feedback ${showFeedback}: open`);

          const submitted = ok(
            advance(
              given.test,
              given.items,
              started,
              { intent: { kind: "submit-item" }, responses: { RESPONSE: text("seven") } },
              given.configuration,
              { now: new Date(startedAt.getTime() + 10_000) },
            ),
            "advance submit-item",
          );
          const after = ok(itemView(given.test, submitted, given.configuration, 1), "itemView");

          assert.isTrue(after.disabled, `show-feedback ${showFeedback}: one attempt closes item 1`);
          assert.strictEqual(
            feedbackShown(after),
            showFeedback,
            `show-feedback ${showFeedback}: closed`,
          );
        }
      }),
  );
});
