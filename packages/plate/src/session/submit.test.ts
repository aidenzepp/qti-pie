import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import { itemView, present, startTest } from "#plate/session/start.ts";
import { SubmissionRefused, endPart, submitItem, submitPart } from "#plate/session/submit.ts";
import type { SubmissionRule } from "#plate/session/submit.ts";
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
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * The folder of the CASE package's test and items under the corpus root.
 */
const caseFolder = "qtiv3-examples/packaging/CASE/testitems";

/**
 * The CASE test's three item refs in document order, each with its `href`.
 */
const caseRefs = [
  ["res_-TX_G06SAMP_001", "-TX_G06SAMP_001.xml"],
  ["res_-TX_G06SAMP_004", "-TX_G06SAMP_004.xml"],
  ["res_-TX_G06SAMP_005", "-TX_G06SAMP_005.xml"],
] as const;

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
 * A single float value, the value `match_correct` gives `SCORE`.
 *
 * @param score The score.
 * @returns The value.
 */
const scored = (score: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value: score }],
});

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a document and require an accepted item.
 *
 * @param location The document's location, which `open` takes.
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
 * @param location The document's location, which `open` takes.
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
 * Open the CASE test and its three items from the corpus cache, each item keyed by its ref, the
 * test's text first passed through an edit.
 *
 * @param edit What to change in the test's text; the text unchanged when none.
 * @returns The test and its items.
 */
const caseDelivery = Effect.fnUntraced(function* caseDelivery(
  edit: (text: string) => string = (text) => text,
) {
  const testLocation = `${caseFolder}/-TX_G06SAMP_000.xml`;
  const text = new TextDecoder().decode(yield* readCorpusFile(testLocation));
  const test = yield* openTest(testLocation, new TextEncoder().encode(edit(text)));
  const items = new Map<string, Accepted>();
  for (const [ref, href] of caseRefs) {
    const location = `${caseFolder}/${href}`;
    items.set(ref, yield* openItem(location, yield* readCorpusFile(location)));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Write the text of a hand-built Choice item: `RESPONSE`, a single identifier whose correct
 * response is `A`, scored by `match_correct` into `SCORE`.
 *
 * @param identifier The item's identifier.
 * @param options What the item adds.
 * @param options.defaultValue The choice `RESPONSE` declares as its default, when it declares one.
 * @param options.minChoices The Choice's `min-choices`, when it sets one.
 * @returns The item's text.
 */
const choiceItemXml = (
  identifier: string,
  options: { readonly defaultValue?: string; readonly minChoices?: number } = {},
): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    options.defaultValue === undefined
      ? ""
      : `<qti-default-value><qti-value>${options.defaultValue}</qti-value></qti-default-value>`,
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    "<qti-item-body>",
    `<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1"${options.minChoices === undefined ? "" : ` min-choices="${options.minChoices}"`}>`,
    '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
    '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
    '<qti-simple-choice identifier="C">Choice C</qti-simple-choice>',
    "</qti-choice-interaction></qti-item-body>",
    '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built item that declares no response: a passage to read.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const passageItemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    "<qti-item-body><p>Read this passage, then move on.</p></qti-item-body>",
    "</qti-assessment-item>",
  ].join("");

/**
 * One test part of a hand-built test: its modes, the attributes of its item session control, and
 * the item refs its one section holds.
 */
interface BuiltPart {
  readonly control: string;
  readonly identifier: string;
  readonly navigation: "linear" | "nonlinear";
  readonly refs: readonly string[];
  readonly submission: "individual" | "simultaneous";
}

/**
 * Describe a nonlinear, individual part with no item session control.
 *
 * @param identifier The part's identifier.
 * @param refs The item refs its section holds.
 * @param settings What the part sets otherwise.
 * @returns The part.
 */
const partOf = (
  identifier: string,
  refs: readonly string[],
  settings: Partial<Omit<BuiltPart, "identifier" | "refs">> = {},
): BuiltPart => ({
  control: "",
  identifier,
  navigation: "nonlinear",
  refs,
  submission: "individual",
  ...settings,
});

/**
 * Write the text of a hand-built test, each part holding one section with its item refs, each ref
 * naming the document `<ref>.xml` beside the test. A part with no item ref holds a section ref,
 * which the test marks and does not deliver, since a section must hold a child (reading 26): such
 * a part delivers no item.
 *
 * @param identifier The test's identifier.
 * @param parts The parts, in document order.
 * @returns The test's text.
 */
const testXml = (identifier: string, parts: readonly BuiltPart[]): string =>
  [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    ...parts.map((part) =>
      [
        `<qti-test-part identifier="${part.identifier}" navigation-mode="${part.navigation}" submission-mode="${part.submission}">`,
        part.control === "" ? "" : `<qti-item-session-control ${part.control}/>`,
        `<qti-assessment-section identifier="${part.identifier}-section" title="Section" visible="true">`,
        ...(part.refs.length === 0
          ? [
              `<qti-assessment-section-ref identifier="${part.identifier}-elsewhere" href="elsewhere.xml"/>`,
            ]
          : part.refs.map(
              (ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`,
            )),
        "</qti-assessment-section></qti-test-part>",
      ].join(""),
    ),
    "</qti-assessment-test>",
  ].join("");

/**
 * Open a hand-built test and its items, the test at `tests/<identifier>.xml` and each item beside
 * it at `tests/<ref>.xml`.
 *
 * @param identifier The test's identifier.
 * @param parts The test's parts.
 * @param items Each item ref's identifier with its item's text.
 * @returns The test and its items.
 */
const builtDelivery = Effect.fnUntraced(function* builtDelivery(
  identifier: string,
  parts: readonly BuiltPart[],
  items: readonly (readonly [string, string])[],
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    `tests/${identifier}.xml`,
    encoder.encode(testXml(identifier, parts)),
  );
  const accepted = new Map<string, Accepted>();
  for (const [ref, xml] of items) {
    accepted.set(ref, yield* openItem(`tests/${ref}.xml`, encoder.encode(xml)));
  }

  return { items: accepted, test } satisfies Delivery;
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
 * Give a step of an intent, with the responses it posts when it posts any.
 *
 * @param kind The intent.
 * @param responses The responses posted with it.
 * @returns The step.
 */
const stepOf = (kind: "end-part" | "submit-item" | "submit-part", responses?: Responses): Step =>
  responses === undefined ? { intent: { kind } } : { intent: { kind }, responses };

/**
 * Require a transition to succeed.
 *
 * @param result What the transition returned.
 * @returns The session it gave.
 */
const accepted = <E extends { readonly message: string }>(
  result: Result.Result<TestSession, E>,
): TestSession =>
  Result.getOrElse(result, (failure) => assert.fail(`the transition refused: ${failure.message}`));

/**
 * Require a transition to be refused as a submission.
 *
 * @param result What the transition returned.
 * @returns The refusal.
 */
const refusal = <E extends { readonly _tag: string }>(
  result: Result.Result<TestSession, E>,
): SubmissionRefused => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected the submission to be refused, and it was accepted"),
  );

  return failure instanceof SubmissionRefused
    ? failure
    : assert.fail(`expected SubmissionRefused, not ${failure._tag}`);
};

/**
 * Require a transition to be refused as a submission, and give the rule it names.
 *
 * @param result What the transition returned.
 * @returns The rule.
 */
const refusedRule = <E extends { readonly _tag: string }>(
  result: Result.Result<TestSession, E>,
): SubmissionRule => refusal(result).rule;

/**
 * Give a session's item at a sequence index.
 *
 * @param session The session.
 * @param sequenceIndex The sequence index, counted from 1.
 * @returns The item.
 */
const itemAt = (session: TestSession, sequenceIndex: number): SessionItem =>
  session.items.find((item) => item.sequenceIndex === sequenceIndex) ??
  assert.fail(`the session has no item ${sequenceIndex}`);

/**
 * The host's configuration in every test: every default.
 */
const defaults: Configuration = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  maxAttempts: 1,
  showFeedback: false,
  showSolution: false,
  validateResponses: false,
};

/**
 * Say whether a session's item at a sequence index renders disabled, as its view gives it.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param sequenceIndex The sequence index.
 * @returns Whether the item is closed.
 */
const closedAt = (delivery: Delivery, session: TestSession, sequenceIndex: number): boolean =>
  Result.getOrElse(itemView(delivery.test, session, defaults, sequenceIndex), (failure) =>
    assert.fail(`itemView failed: ${failure.message}`),
  ).disabled;

/**
 * Show a session's item at a sequence index, as a move to it would: present it and make it
 * current. It stands in for the moves, which submission does not own.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param sequenceIndex The sequence index.
 * @param now The time of the move.
 * @returns The session with the item current.
 */
const shown = (
  delivery: Delivery,
  session: TestSession,
  sequenceIndex: number,
  now: Date,
): TestSession => ({
  ...accepted(present(delivery.items, session, sequenceIndex, now)),
  position: sequenceIndex - 1,
});

/**
 * Give each item's record instance, in sequence.
 *
 * @param session The session.
 * @returns The instances.
 */
const instancesOf = (session: TestSession): readonly string[] =>
  session.items.map((item) => item.record.instance);

/**
 * Give an item's `SCORE`.
 *
 * @param record The item's record.
 * @returns Its `SCORE`.
 */
const scoreOf = (record: ItemRecord): Value | undefined => record.outcomes["SCORE"];

describe("submitItem", () => {
  it.effect(
    "[T-4] on CASE's part of max-attempts 2, accepts the second submit and closes the item, then refuses a third: attempts-exhausted",
    () =>
      Effect.gen(function* caseAttempts() {
        const delivery = yield* caseDelivery();
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        const first = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("A_0") }),
            configuration,
            { now: after(5) },
          ),
        );

        assert.strictEqual(itemAt(first, 1).record.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(itemAt(first, 1).record), scored(0));
        assert.deepStrictEqual(itemAt(first, 1).saved, Option.none());
        assert.isFalse(closedAt(delivery, first, 1));

        const second = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            first,
            stepOf("submit-item", { RESPONSE: chosen("A_2") }),
            configuration,
            { now: after(9) },
          ),
        );

        assert.strictEqual(itemAt(second, 1).record.numAttempts, 2);
        assert.deepStrictEqual(scoreOf(itemAt(second, 1).record), scored(1));
        assert.isTrue(closedAt(delivery, second, 1));
        assert.strictEqual(itemAt(second, 1).record.instance, `${instance}.1`);
        assert.strictEqual(second.updated, after(9).toISOString());
        assert.strictEqual(itemAt(second, 1).datestamp, after(9).toISOString());

        assert.strictEqual(
          refusedRule(
            submitItem(
              delivery.test,
              delivery.items,
              second,
              stepOf("submit-item", { RESPONSE: chosen("A_1") }),
              configuration,
              { now: after(12) },
            ),
          ),
          "attempts-exhausted",
        );
      }),
  );

  it.effect(
    "[T-4] under allow-skipping false refuses CASE's item with every response NULL: skipping-not-allowed",
    () =>
      Effect.gen(function* caseSkipping() {
        const delivery = yield* caseDelivery((text) => {
          const edited = text.replace(
            'max-attempts="2"',
            'max-attempts="2" allow-skipping="false"',
          );

          return edited === text ? assert.fail("CASE's part sets no max-attempts to edit") : edited;
        });
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.strictEqual(
          refusedRule(
            submitItem(delivery.test, delivery.items, begun, stepOf("submit-item"), configuration, {
              now: after(5),
            }),
          ),
          "skipping-not-allowed",
        );
        assert.strictEqual(
          refusedRule(
            submitItem(
              delivery.test,
              delivery.items,
              begun,
              stepOf("submit-item", { RESPONSE: nullOf("identifier", "single") }),
              configuration,
              { now: after(5) },
            ),
          ),
          "skipping-not-allowed",
        );

        const answered = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("A_3") }),
            configuration,
            { now: after(6) },
          ),
        );

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
      }),
  );

  it.effect(
    "[T-4] under allow-skipping false refuses a response equal to its declared default, and submits an item with no response declaration",
    () =>
      Effect.gen(function* builtSkipping() {
        const delivery = yield* builtDelivery(
          "skipping",
          [partOf("part", ["defaulted", "passage"], { control: 'allow-skipping="false"' })],
          [
            ["defaulted", choiceItemXml("defaulted", { defaultValue: "B" })],
            ["passage", passageItemXml("passage")],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        for (const step of [
          stepOf("submit-item"),
          stepOf("submit-item", { RESPONSE: chosen("B") }),
        ]) {
          assert.strictEqual(
            refusedRule(
              submitItem(delivery.test, delivery.items, begun, step, configuration, {
                now: after(5),
              }),
            ),
            "skipping-not-allowed",
          );
        }

        const answered = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("C") }),
            configuration,
            { now: after(6) },
          ),
        );

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);

        const onPassage = shown(delivery, answered, 2, after(7));
        const passed = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            onPassage,
            stepOf("submit-item"),
            configuration,
            {
              now: after(8),
            },
          ),
        );

        assert.strictEqual(itemAt(passed, 2).record.numAttempts, 1);
        assert.strictEqual(itemAt(passed, 2).record.instance, `${instance}.2`);
      }),
  );

  it.effect(
    "[T-4] under validate-responses true refuses responses that break a tier (b) limit, with its messages: responses-invalid",
    () =>
      Effect.gen(function* validated() {
        const delivery = yield* builtDelivery(
          "validated",
          [partOf("part", ["bounded"], { control: 'validate-responses="true"' })],
          [["bounded", choiceItemXml("bounded", { minChoices: 1 })]],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        const refused = submitItem(
          delivery.test,
          delivery.items,
          begun,
          stepOf("submit-item"),
          configuration,
          { now: after(5) },
        );
        const failure = refusal(refused);

        assert.strictEqual(failure.rule, "responses-invalid");
        assert.deepStrictEqual(
          failure.messages.map((message) => message.response),
          ["RESPONSE"],
        );

        const answered = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            configuration,
            { now: after(6) },
          ),
        );

        assert.deepStrictEqual(scoreOf(itemAt(answered, 1).record), scored(1));
      }),
  );

  it.effect(
    "[T-4] keeps the first processed attempt's outcomes in firstOutcomes, and the latest in the record, when the limit is 0",
    () =>
      Effect.gen(function* firstOutcomes() {
        const delivery = yield* builtDelivery(
          "unlimited",
          [partOf("part", ["open"], { control: 'max-attempts="0"' })],
          [["open", choiceItemXml("open")]],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.deepStrictEqual(itemAt(begun, 1).firstOutcomes, Option.none());

        const wrong = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("B") }),
            configuration,
            { now: after(5) },
          ),
        );
        const right = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            wrong,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            configuration,
            { now: after(9) },
          ),
        );

        assert.deepStrictEqual(
          itemAt(right, 1).firstOutcomes.pipe(Option.map((outcomes) => outcomes["SCORE"])),
          Option.some(scored(0)),
        );
        assert.deepStrictEqual(scoreOf(itemAt(right, 1).record), scored(1));
        assert.strictEqual(itemAt(right, 1).record.numAttempts, 2);
        assert.isFalse(closedAt(delivery, right, 1));
        assert.strictEqual(itemAt(right, 1).record.instance, `${instance}.1`);
      }),
  );

  it.effect("[T-4] sets no attempt limit for a negative max-attempts", () =>
    Effect.gen(function* negativeLimit() {
      const delivery = yield* builtDelivery(
        "negative",
        [partOf("part", ["open"], { control: 'max-attempts="-1"' })],
        [["open", choiceItemXml("open")]],
      );
      const configuration = yield* configure({});
      let session = started(delivery, configuration);
      for (const seconds of [5, 6, 7]) {
        session = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-item", { RESPONSE: chosen("B") }),
            configuration,
            { now: after(seconds) },
          ),
        );
      }

      assert.strictEqual(itemAt(session, 1).record.numAttempts, 3);
      assert.isFalse(closedAt(delivery, session, 1));
    }),
  );

  it.effect("refuses submit-item in a simultaneous part: wrong-submission-mode", () =>
    Effect.gen(function* itemInSimultaneous() {
      const delivery = yield* builtDelivery(
        "together",
        [partOf("part", ["one"], { submission: "simultaneous" })],
        [["one", choiceItemXml("one")]],
      );
      const configuration = yield* configure({});

      assert.strictEqual(
        refusedRule(
          submitItem(
            delivery.test,
            delivery.items,
            started(delivery, configuration),
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            configuration,
            { now: after(5) },
          ),
        ),
        "wrong-submission-mode",
      );
    }),
  );
});

describe("submitPart", () => {
  it.effect(
    "[T-4] scores every presented item of a simultaneous part, closes a never-presented item unprocessed, and presents the next part's first item",
    () =>
      Effect.gen(function* simultaneous() {
        const delivery = yield* builtDelivery(
          "together",
          [
            partOf("together", ["one", "two", "three"], { submission: "simultaneous" }),
            partOf("after", ["four"]),
          ],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
            ["three", choiceItemXml("three")],
            ["four", choiceItemXml("four")],
          ],
        );
        const configuration = yield* configure({});
        const onTwo = shown(delivery, started(delivery, configuration), 2, after(3));

        const submitted = accepted(
          submitPart(
            delivery.test,
            delivery.items,
            onTwo,
            stepOf("submit-part", { RESPONSE: chosen("A") }),
            { now: after(8) },
          ),
        );

        assert.deepStrictEqual(
          [1, 2, 3, 4].map((index) => itemAt(submitted, index).record.numAttempts),
          [1, 1, 0, 0],
        );
        assert.deepStrictEqual(scoreOf(itemAt(submitted, 1).record), scored(0));
        assert.deepStrictEqual(scoreOf(itemAt(submitted, 2).record), scored(1));
        assert.deepStrictEqual(
          itemAt(submitted, 2).firstOutcomes.pipe(Option.map((outcomes) => outcomes["SCORE"])),
          Option.some(scored(1)),
        );
        assert.deepStrictEqual(itemAt(submitted, 2).saved, Option.none());

        const three = delivery.items.get("three") ?? assert.fail("item three is not delivered");
        assert.deepStrictEqual(itemAt(submitted, 3).record, fresh(three.item, `${instance}.3`));
        assert.isFalse(itemAt(submitted, 3).presented);
        assert.deepStrictEqual(itemAt(submitted, 3).firstOutcomes, Option.none());
        assert.isTrue(closedAt(delivery, submitted, 3));

        assert.deepStrictEqual(submitted.parts, [
          { identifier: "together", status: "ended" },
          { identifier: "after", status: "current" },
        ]);
        assert.strictEqual(submitted.status, "interacting");
        assert.strictEqual(submitted.position, 3);
        assert.isTrue(itemAt(submitted, 4).presented);
        assert.deepStrictEqual(
          instancesOf(submitted),
          [1, 2, 3, 4].map((index) => `${instance}.${index}`),
        );
      }),
  );

  it.effect("refuses submit-part in an individual part: wrong-submission-mode", () =>
    Effect.gen(function* partInIndividual() {
      const delivery = yield* builtDelivery(
        "alone",
        [partOf("part", ["one"])],
        [["one", choiceItemXml("one")]],
      );

      assert.strictEqual(
        refusedRule(
          submitPart(
            delivery.test,
            delivery.items,
            started(delivery, yield* configure({})),
            stepOf("submit-part"),
            { now: after(5) },
          ),
        ),
        "wrong-submission-mode",
      );
    }),
  );
});

describe("endPart", () => {
  it.effect(
    "[T-4] ending a nonlinear individual part leaves a saved item unprocessed, skips an empty part, and presents the next part's first item",
    () =>
      Effect.gen(function* nonlinearEnd() {
        const delivery = yield* builtDelivery(
          "ending",
          [
            partOf("first", ["one"]),
            partOf("empty", []),
            partOf("last", ["two"], { navigation: "linear" }),
          ],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
          ],
        );
        const configuration = yield* configure({});

        const ended = accepted(
          endPart(
            delivery.test,
            delivery.items,
            started(delivery, configuration),
            stepOf("end-part", { RESPONSE: chosen("A") }),
            { now: after(5) },
          ),
        );

        assert.deepStrictEqual(itemAt(ended, 1).saved, Option.some({ RESPONSE: chosen("A") }));
        assert.strictEqual(itemAt(ended, 1).record.numAttempts, 0);
        assert.deepStrictEqual(itemAt(ended, 1).firstOutcomes, Option.none());
        assert.isTrue(closedAt(delivery, ended, 1));
        assert.deepStrictEqual(ended.parts, [
          { identifier: "first", status: "ended" },
          { identifier: "empty", status: "ended" },
          { identifier: "last", status: "current" },
        ]);
        assert.strictEqual(ended.position, 1);
        assert.isTrue(itemAt(ended, 2).presented);
        assert.strictEqual(ended.status, "interacting");
      }),
  );

  it.effect(
    "closes the test when its last part ends, and then refuses every submission: test-closed",
    () =>
      Effect.gen(function* lastEnd() {
        const delivery = yield* builtDelivery(
          "closing",
          [partOf("only", ["one"])],
          [["one", choiceItemXml("one")]],
        );
        const configuration = yield* configure({});

        const closed = accepted(
          endPart(
            delivery.test,
            delivery.items,
            started(delivery, configuration),
            stepOf("end-part"),
            { now: after(5) },
          ),
        );

        assert.strictEqual(closed.status, "closed");
        assert.deepStrictEqual(closed.parts, [{ identifier: "only", status: "ended" }]);
        assert.deepStrictEqual(
          [
            submitItem(
              delivery.test,
              delivery.items,
              closed,
              stepOf("submit-item"),
              configuration,
              {
                now: after(6),
              },
            ),
            submitPart(delivery.test, delivery.items, closed, stepOf("submit-part"), {
              now: after(6),
            }),
            endPart(delivery.test, delivery.items, closed, stepOf("end-part"), { now: after(6) }),
          ].map(refusedRule),
          ["test-closed", "test-closed", "test-closed"],
        );
      }),
  );

  it.effect("refuses end-part in a simultaneous part: wrong-submission-mode", () =>
    Effect.gen(function* endSimultaneous() {
      const delivery = yield* builtDelivery(
        "together",
        [partOf("part", ["one"], { submission: "simultaneous" })],
        [["one", choiceItemXml("one")]],
      );

      assert.strictEqual(
        refusedRule(
          endPart(
            delivery.test,
            delivery.items,
            started(delivery, yield* configure({})),
            stepOf("end-part"),
            { now: after(5) },
          ),
        ),
        "wrong-submission-mode",
      );
    }),
  );
});
