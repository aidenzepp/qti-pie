import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { decode, entryName, partition } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import { redact } from "#plate/render.ts";
import { results } from "#plate/results/results.ts";
import { advance } from "#plate/session/advance.ts";
import type { Intent, Responses, TestSession } from "#plate/session/session.ts";
import { current, itemView, startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-06T09:00:00.000Z");

/**
 * The item both refs deliver: a Text Entry that reads `RESPONSE`, a single string whose correct
 * response is `seven`, scored by `match_correct` into `SCORE`. Its ref sets no `max-attempts`, so
 * one processed attempt closes it.
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
 * Write the text of a test of one part with individual submission, whose items `i1` and `i2` both
 * name `number.xml` beside the test.
 *
 * @param navigation The part's navigation mode.
 * @returns The test's text.
 */
const testXml = (navigation: "linear" | "nonlinear"): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    `<qti-test-part identifier="P" navigation-mode="${navigation}" submission-mode="individual">`,
    '<qti-assessment-section identifier="S" title="Section" visible="true">',
    '<qti-assessment-item-ref identifier="i1" href="number.xml"/>',
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
 * @param navigation The part's navigation mode.
 * @returns The delivery.
 */
const delivery = Effect.fnUntraced(function* delivery(navigation: "linear" | "nonlinear") {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/T.xml", encoder.encode(testXml(navigation)));
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

/**
 * Carry out one post the way a host does whatever the item shows: decode the current item's
 * entries through `postings`, as the README's server action does, and pass them to `advance`
 * with the intent, even when the item is closed.
 *
 * @param given The delivery.
 * @param session The session.
 * @param intent The intent posted.
 * @param posted The text posted for `RESPONSE`; none posts no entry for it, as a browser does for
 *   a disabled control.
 * @param seconds When the post happens, in seconds after {@link startedAt}.
 * @returns The session after the post.
 */
const post = (
  given: Delivery,
  session: TestSession,
  intent: Intent,
  posted: Option.Option<string>,
  seconds: number,
): TestSession => {
  const shown = ok(current(given.test, session, given.configuration), "current");
  const view = shown.kind === "item" ? shown : assert.fail("the test has closed");
  const entries: readonly Entry[] = Option.match(posted, {
    onNone: () => [],
    onSome: (value) => [[entryName(view.instance, "RESPONSE"), value]],
  });
  const { own } = partition(entries, view.instance);
  const item = given.items.get(view.ref) ?? assert.fail(`no item ${view.ref}`);
  const responses: Responses = Object.fromEntries(
    postings(redact(item), view.instance).map(({ binding, identifier, options }) => [
      identifier,
      ok(decode(own, binding, options), `decoding ${identifier}`),
    ]),
  );

  return ok(
    advance(given.test, given.items, session, { intent, responses }, given.configuration, {
      now: new Date(startedAt.getTime() + seconds * 1000),
    }),
    `advance ${intent.kind}`,
  );
};

/**
 * A response variable as a results document reports it: its `answeredStatus`, and the values of
 * its `candidateResponse`.
 */
interface ReportedResponse {
  readonly answeredStatus: string;
  readonly values: readonly string[];
}

/**
 * Read item `i1`'s `RESPONSE` as a results document reports it.
 *
 * @param xml The `assessmentResult` document.
 * @returns What the document reports for it.
 */
const reportedResponse = (xml: string): ReportedResponse => {
  const item =
    /<itemResult identifier="i1"[^>]*>(?<body>[\s\S]*?)<\/itemResult>/u.exec(xml)?.groups?.[
      "body"
    ] ?? assert.fail("the results hold no itemResult for i1");
  const variable =
    /<responseVariable identifier="RESPONSE"(?<tag>[^>]*)>(?<body>[\s\S]*?)<\/responseVariable>/u.exec(
      item,
    )?.groups ?? assert.fail("i1's result holds no RESPONSE");

  return {
    answeredStatus:
      /answeredStatus="(?<status>[^"]*)"/u.exec(variable["tag"] ?? "")?.groups?.["status"] ?? "",
    values: Array.from(
      (variable["body"] ?? "").matchAll(/<value>(?<value>[^<]*)<\/value>/gu),
      (match) => match.groups?.["value"] ?? "",
    ),
  };
};

describe("a closed item", () => {
  for (const navigation of ["nonlinear", "linear"] as const) {
    it.effect(
      `[T-4] keeps its submitted response through a next that posts no entries or forged ones, in a ${navigation} individual part`,
      () =>
        Effect.gen(function* keepsSubmitted() {
          const given = yield* delivery(navigation);
          const session = ok(
            startTest(given.test, given.items, given.configuration, {
              instance,
              now: startedAt,
            }),
            "startTest",
          );
          const submitted = post(given, session, { kind: "submit-item" }, Option.some("seven"), 10);
          const closed = ok(itemView(given.test, submitted, given.configuration, 1), "itemView");

          assert.isTrue(closed.disabled, "submit-item closes item 1");
          assert.deepStrictEqual(closed.values["RESPONSE"], text("seven"));

          for (const [label, posted] of [
            ["no entries", Option.none()],
            ["forged entries", Option.some("six")],
          ] as const) {
            const moved = post(given, submitted, { kind: "next" }, posted, 20);
            const shown = ok(itemView(given.test, moved, given.configuration, 1), "itemView");
            const xml = ok(
              results({
                context: {},
                items: given.items,
                kind: "test",
                session: ok(encodeSession(moved), "encodeSession"),
                test: given.test,
              }),
              "results",
            );

            assert.strictEqual(moved.position, 1, `${label}: next presents item 2`);
            assert.deepStrictEqual(
              moved.items[0]?.saved,
              submitted.items[0]?.saved,
              `${label}: item 1's saved responses are unchanged`,
            );
            assert.deepStrictEqual(
              shown.values["RESPONSE"],
              text("seven"),
              `${label}: item 1 shows its submitted response`,
            );
            assert.deepStrictEqual(
              reportedResponse(xml),
              { answeredStatus: "answered", values: ["seven"] },
              `${label}: results report item 1's submitted response`,
            );
          }
        }),
    );
  }
});
