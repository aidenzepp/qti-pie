import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { IntentRefused, advance } from "#plate/session/advance.ts";
import type { AdvanceFailure } from "#plate/session/advance.ts";
import type { TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The namespace of every hand-built document here.
 */
const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-06T10:00:00.000Z");

/**
 * The time of every step a test takes.
 */
const steppedAt = new Date("2026-11-06T10:00:05.000Z");

/**
 * Write the text of a hand-built item that declares `RESPONSE` and holds a body.
 *
 * @param identifier The item's identifier.
 * @param declaration The `RESPONSE` declaration's cardinality and base type, as attributes.
 * @param body The item body's content.
 * @returns The item's text.
 */
const itemXml = (identifier: string, declaration: string, body: string): string =>
  [
    `<qti-assessment-item xmlns="${namespace}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    `<qti-response-declaration identifier="RESPONSE" ${declaration}/>`,
    `<qti-item-body>${body}</qti-item-body>`,
    "</qti-assessment-item>",
  ].join("");

/**
 * An item whose only response an Order binds, which M2 shows as a notice: no rendered control can
 * post it.
 */
const orderItem = itemXml(
  "held",
  'cardinality="ordered" base-type="identifier"',
  [
    '<qti-order-interaction response-identifier="RESPONSE">',
    '<qti-simple-choice identifier="A">A</qti-simple-choice>',
    '<qti-simple-choice identifier="B">B</qti-simple-choice>',
    "</qti-order-interaction>",
  ].join(""),
);

/**
 * An item that declares a response no interaction binds: a passage to read.
 */
const unboundItem = itemXml(
  "held",
  'cardinality="single" base-type="identifier"',
  "<p>Read this passage, then move on.</p>",
);

/**
 * An item whose only response a Choice binds, which the page can post.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const choiceItem = (identifier: string): string =>
  itemXml(
    identifier,
    'cardinality="single" base-type="identifier"',
    [
      '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
      '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
      '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
      "</qti-choice-interaction>",
    ].join(""),
  );

/**
 * The text of a test of one linear, individual part under `allow-skipping="false"`, whose section
 * holds the item ref `held` and then `after`.
 */
const testXml = [
  `<qti-assessment-test xmlns="${namespace}" identifier="T" title="T">`,
  '<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
  '<qti-item-session-control allow-skipping="false"/>',
  '<qti-assessment-section identifier="S" title="S" visible="true">',
  '<qti-assessment-item-ref identifier="held" href="held.xml"/>',
  '<qti-assessment-item-ref identifier="after" href="after.xml"/>',
  "</qti-assessment-section></qti-test-part></qti-assessment-test>",
].join("");

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open {@link testXml} at `tests/T.xml`, the item `held` beside it from its text, and `after` as a
 * Choice item.
 *
 * @param held The text of the item `held`.
 * @returns The test and its items.
 */
const delivery = Effect.fnUntraced(function* delivery(held: string) {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/T.xml", encoder.encode(testXml));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const [ref, xml] of [
    ["held", held],
    ["after", choiceItem("after")],
  ] as const) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(xml));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  return { items, test } satisfies Delivery;
});

/**
 * Give the accepted item a delivery holds for `held`.
 *
 * @param given The test and its items.
 * @returns The item.
 */
const heldOf = (given: Delivery): Accepted =>
  given.items.get("held") ?? assert.fail("the delivery holds no item for held");

/**
 * Take one step of an intent that posts no response, on a session of a delivery just started.
 *
 * @param given The test and its items.
 * @param kind The intent.
 * @param configuration The host's configuration.
 * @returns What `advance` gave.
 */
const stepped = (
  given: Delivery,
  kind: "next" | "submit-item",
  configuration: Configuration,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(
    given.test,
    given.items,
    Result.getOrElse(
      startTest(given.test, given.items, configuration, { instance, now: startedAt }),
      (failure) => assert.fail(`startTest refused: ${failure.message}`),
    ),
    { intent: { kind } },
    configuration,
    { now: steppedAt },
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
 * Require `advance` to refuse a step, and give the rule it names.
 *
 * @param result What `advance` returned.
 * @returns The rule.
 */
const refusedRule = (result: Result.Result<TestSession, AdvanceFailure>): string => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );

  return failure instanceof IntentRefused
    ? failure.rule
    : assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
};

/**
 * Assert that `next` and `submit-item`, posting no response, each process `held`'s attempt, and
 * that `next` then moves to `after`: the item does not trap the candidate.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 */
const proceeds = (given: Delivery, configuration: Configuration): void => {
  const moved = accepted(stepped(given, "next", configuration));
  assert.strictEqual(moved.position, 1);
  assert.strictEqual(moved.items[0]?.record.numAttempts, 1);

  const submitted = accepted(stepped(given, "submit-item", configuration));
  assert.strictEqual(submitted.position, 0);
  assert.strictEqual(submitted.items[0]?.record.numAttempts, 1);
};

describe("the skip test under allow-skipping false", () => {
  it.effect(
    "[T-4] lets next and submit-item pass an item whose only response an Order, shown as a notice, binds",
    () =>
      Effect.gen(function* orderNotice() {
        const given = yield* delivery(orderItem);
        const configuration = yield* configure({});
        const { item } = heldOf(given);

        assert.isTrue(item.responses.has("RESPONSE"));
        assert.deepStrictEqual(
          item.unsupported.map(({ shown }) => shown),
          [],
        );
        proceeds(given, configuration);
      }),
  );

  it.effect(
    "[T-4] lets next and submit-item pass an item whose declared response no interaction binds",
    () =>
      Effect.gen(function* unbound() {
        const given = yield* delivery(unboundItem);
        const configuration = yield* configure({});

        assert.isTrue(heldOf(given).item.responses.has("RESPONSE"));
        proceeds(given, configuration);
      }),
  );

  it.effect(
    "[T-4] still refuses next and submit-item on an item with an unanswered Choice: skipping-not-allowed",
    () =>
      Effect.gen(function* unansweredChoice() {
        const given = yield* delivery(choiceItem("held"));
        const configuration = yield* configure({});

        for (const kind of ["next", "submit-item"] as const) {
          assert.strictEqual(
            refusedRule(stepped(given, kind, configuration)),
            "skipping-not-allowed",
          );
        }
      }),
  );
});
