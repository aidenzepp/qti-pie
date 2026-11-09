import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { SourceElement } from "#plate/document/source.ts";
import { readSource } from "#plate/document/read.ts";
import {
  acceptedItem,
  advance,
  configure,
  current,
  decode,
  encodeSession,
  entryName,
  partition,
  postings,
  redact,
  results,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Entry,
  Intent,
  ItemView,
  Responses,
  TestSession,
  Value,
} from "#plate/index.ts";
import { open } from "#plate/validate/open.ts";

/**
 * The session instance the sitting starts with.
 */
const instance = "c2d84b0e-5f1a-4c7e-9b3d-6a0f2e8d1c47";

/**
 * When the sitting starts.
 */
const startedAt = Date.parse("2026-11-06T09:00:00.000Z");

/**
 * The item ref of the item that declares the defaulted, unbound response.
 */
const defaultedRef = "defaulted";

/**
 * The item ref of the passage after it, which declares no response.
 */
const passageRef = "passage";

/**
 * The response the defaulted item declares with a `qti-default-value` and binds to no interaction.
 */
const hidden = "HIDDEN";

/**
 * The value {@link hidden} declares as its default.
 */
const kept: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "KEEP" }],
};

/**
 * The text of the defaulted item: `RESPONSE`, bound to a Choice, and {@link hidden}, a single
 * identifier that defaults to `KEEP` and that no interaction binds, as a response set by default
 * and read by processing is. Processing sets `SCORE` to 1 only when `HIDDEN` is `KEEP`.
 */
const defaultedXml = [
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${defaultedRef}" title="Defaulted" adaptive="false" time-dependent="false">`,
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
  `<qti-response-declaration identifier="${hidden}" cardinality="single" base-type="identifier">`,
  "<qti-default-value><qti-value>KEEP</qti-value></qti-default-value>",
  "</qti-response-declaration>",
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  "<qti-item-body>",
  '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
  '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
  '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body>",
  "<qti-response-processing><qti-response-condition><qti-response-if>",
  `<qti-match><qti-variable identifier="${hidden}"/><qti-base-value base-type="identifier">KEEP</qti-base-value></qti-match>`,
  '<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>',
  "</qti-response-if></qti-response-condition></qti-response-processing>",
  "</qti-assessment-item>",
].join("");

/**
 * The text of the passage, an item that declares no response.
 */
const passageXml = [
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${passageRef}" title="Passage" adaptive="false" time-dependent="false">`,
  "<qti-item-body><p>Read this passage, then move on.</p></qti-item-body>",
  "</qti-assessment-item>",
].join("");

/**
 * The text of the test: one nonlinear part with individual submission, whose section holds the
 * defaulted item and then the passage, each ref naming the document `<ref>.xml` beside the test.
 */
const testXml = [
  '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="defaults" title="Defaults">',
  '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
  '<qti-assessment-section identifier="section" title="Section" visible="true">',
  `<qti-assessment-item-ref identifier="${defaultedRef}" href="${defaultedRef}.xml"/>`,
  `<qti-assessment-item-ref identifier="${passageRef}" href="${passageRef}.xml"/>`,
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
 * Require a result to succeed.
 *
 * @param result The result.
 * @param what What gave it, for a failure's message.
 * @returns Its success.
 */
const ok = <A, E>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what} failed: ${String(failure)}`));

/**
 * Open the test and its two items, the test at `tests/defaults.xml` and each item beside it.
 *
 * @returns The delivery.
 */
const delivery = Effect.fnUntraced(function* delivery() {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/defaults.xml", encoder.encode(testXml));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const [ref, xml] of [
    [defaultedRef, defaultedXml],
    [passageRef, passageXml],
  ] as const) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(xml));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () =>
        assert.fail(`${ref} is ${opened.verdict}, not an accepted item`),
      ),
    );
  }

  return { configuration: yield* configure({}), items, test } satisfies Delivery;
});

/**
 * Give the current item's view, failing the test when the session shows its summary.
 *
 * @param target The delivery.
 * @param session The session.
 * @returns The current item's view.
 */
const viewOf = (target: Delivery, session: TestSession): ItemView => {
  const shown = ok(current(target.test, session, target.configuration), "current");

  return shown.kind === "item" ? shown : assert.fail("the session shows its summary, not an item");
};

/**
 * Decode what a host's form posts for the current item, as a host does: its own entries,
 * partitioned by the item's instance, each response decoded through `postings`.
 *
 * @param target The delivery.
 * @param view The current item's view.
 * @param entries The posted entries.
 * @returns Each posted response's value.
 */
const postedResponses = (
  target: Delivery,
  view: ItemView,
  entries: readonly Entry[],
): Responses => {
  const accepted = target.items.get(view.ref) ?? assert.fail(`no accepted item for ${view.ref}`);
  const { own } = partition(entries, view.instance);

  return Object.fromEntries(
    postings(redact(accepted), view.instance).map(({ binding, identifier, options }) => [
      identifier,
      ok(decode(own, binding, options), `decode ${identifier}`),
    ]),
  );
};

/**
 * Carry out one step of the sitting on the current item, its responses decoded from the post.
 *
 * @param target The delivery.
 * @param session The session.
 * @param intent The intent.
 * @param entries The entries the form posts for the current item.
 * @param transition The transition's number, which sets its time.
 * @returns The session after the step.
 */
const stepped = (
  target: Delivery,
  session: TestSession,
  intent: Intent,
  entries: (view: ItemView) => readonly Entry[],
  transition: number,
): TestSession => {
  const view = viewOf(target, session);

  return ok(
    advance(
      target.test,
      target.items,
      session,
      { intent, responses: postedResponses(target, view, entries(view)) },
      target.configuration,
      { now: new Date(startedAt + transition * 10_000) },
    ),
    `advance ${intent.kind}`,
  );
};

/**
 * The defaulted item's post: the candidate chooses `B`, and nothing else is posted.
 *
 * @param view The defaulted item's view.
 * @returns The entries.
 */
const choseB = (view: ItemView): readonly Entry[] => [[entryName(view.instance, "RESPONSE"), "B"]];

/**
 * The passage's post, which carries no entry.
 *
 * @returns No entry.
 */
const nothingPosted = (): readonly Entry[] => [];

/**
 * Walk the sitting through the public engine: save a step on the defaulted item and move to the
 * passage, come back, and submit the defaulted item, each step's responses decoded through
 * `postings`.
 *
 * @returns The delivery, the session after the saved step, back on the defaulted item, and the
 *   session after the submission.
 */
const walk = Effect.fnUntraced(function* walk() {
  const target = yield* delivery();
  const started = ok(
    startTest(target.test, target.items, target.configuration, {
      instance,
      now: new Date(startedAt),
    }),
    "startTest",
  );
  const saved = stepped(target, started, { kind: "next" }, choseB, 1);
  const returned = stepped(target, saved, { kind: "previous" }, nothingPosted, 2);
  const submitted = stepped(target, returned, { kind: "submit-item" }, choseB, 3);

  return { returned, started, submitted, target };
});

/**
 * Give an element's children of one local name.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns Those children, in order.
 */
const childrenNamed = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.flatMap((child) =>
    child.kind === "element" && child.local === local ? [child] : [],
  );

/**
 * Give the value of an element's unprefixed attribute.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, none when the element has no such attribute.
 */
const attributeOf = (element: SourceElement, name: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    element.attributes.find((entry) => entry.namespace === "" && entry.local === name)?.value,
  );

/**
 * Read the candidate response a result reports for one response of one item.
 *
 * @param xml The `assessmentResult` document.
 * @param item The item result's identifier, its item ref.
 * @param response The response variable's identifier.
 * @returns The text of each `value` of its `candidateResponse`.
 */
const candidateResponse = Effect.fnUntraced(function* candidateResponse(
  xml: string,
  item: string,
  response: string,
) {
  const { root } = yield* readSource("result.xml", new TextEncoder().encode(xml));
  const itemResult =
    childrenNamed(root, "itemResult").find((element) =>
      Option.contains(attributeOf(element, "identifier"), item),
    ) ?? assert.fail(`the results report no itemResult for ${item}`);
  const variable =
    childrenNamed(itemResult, "responseVariable").find((element) =>
      Option.contains(attributeOf(element, "identifier"), response),
    ) ?? assert.fail(`${item}'s result reports no responseVariable ${response}`);

  return childrenNamed(variable, "candidateResponse")
    .flatMap((candidate) => childrenNamed(candidate, "value"))
    .map((value) =>
      value.children.map((child) => (child.kind === "text" ? child.text : "")).join(""),
    );
});

describe("a declared response default no interaction binds", () => {
  it.effect("is written at presentation and survives a saved step decoded through postings", () =>
    Effect.gen(function* savedStep() {
      const { returned, started, target } = yield* walk();
      const [first] = started.items;

      assert.deepStrictEqual(
        first?.record.responses[hidden],
        kept,
        "presentation writes the default into the record",
      );
      assert.deepStrictEqual(
        viewOf(target, returned).values[hidden],
        kept,
        "the item's values after the saved step hold the default",
      );
    }),
  );

  it.effect(
    "is what the submission scores from and what results report as the candidate response",
    () =>
      Effect.gen(function* submission() {
        const { submitted, target } = yield* walk();
        const [first] = submitted.items;
        const record = first?.record ?? assert.fail("the session has no first item");

        assert.strictEqual(record.numAttempts, 1);
        assert.deepStrictEqual(
          record.responses[hidden],
          kept,
          "the submitted record holds the default",
        );
        assert.deepStrictEqual(
          record.outcomes["SCORE"],
          { baseType: "float", cardinality: "single", values: [{ baseType: "float", value: 1 }] },
          "score read the default",
        );

        const xml = ok(
          results({
            context: {
              sessions: [{ identifier: `s-${instance}`, sourceId: "http://localhost:5190/" }],
            },
            items: target.items,
            kind: "test",
            session: ok(encodeSession(submitted), "encodeSession"),
            test: target.test,
          }),
          "results",
        );

        assert.deepStrictEqual(yield* candidateResponse(xml, defaultedRef, hidden), ["KEEP"]);
      }),
  );
});
