import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { runOutcomes, testScopeOf } from "#plate/engine/outcome.ts";
import { drawBelow, drawStream, outcomeLabel } from "#plate/engine/random.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { results } from "#plate/results/results.ts";
import { ResponsesRefused, score as scoreResponses } from "#plate/score.ts";
import { attemptLimits } from "#plate/session/control.ts";
import type { Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import { itemView, present, recordStep, startTest } from "#plate/session/start.ts";
import { SubmissionRefused, endPart, submitItem, submitPart } from "#plate/session/submit.ts";
import type { SubmissionRule } from "#plate/session/submit.ts";
import { open } from "#plate/validate/open.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";
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
 * @param options.unbound The identifier of a second single identifier response the item declares
 *   and no interaction binds, when it declares one.
 * @returns The item's text.
 */
const choiceItemXml = (
  identifier: string,
  options: {
    readonly defaultValue?: string;
    readonly minChoices?: number;
    readonly unbound?: string;
  } = {},
): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    options.defaultValue === undefined
      ? ""
      : `<qti-default-value><qti-value>${options.defaultValue}</qti-value></qti-default-value>`,
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    options.unbound === undefined
      ? ""
      : `<qti-response-declaration identifier="${options.unbound}" cardinality="single" base-type="identifier"/>`,
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
 * One test part of a hand-built test: its modes, the attributes of its item session control, the
 * item refs its one section holds, and the text of the template defaults an item ref holds, by its
 * identifier, none by default.
 */
interface BuiltPart {
  readonly control: string;
  readonly defaults?: Readonly<Record<string, string>>;
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
 * What a hand-built test declares of its own outcomes, as text: its outcome declarations, and the
 * rules of its `qti-outcome-processing`, which it holds only when they are not empty.
 */
interface BuiltOutcomes {
  readonly declarations: string;
  readonly rules: string;
}

/**
 * The outcomes of a test that declares none and holds no outcome processing.
 */
const noOutcomes: BuiltOutcomes = { declarations: "", rules: "" };

/**
 * Write the text of a hand-built test, each part holding one section with its item refs, each ref
 * naming the document `<ref>.xml` beside the test. A part with no item ref holds a section ref,
 * which the test marks and does not deliver, so such a part delivers no item. An empty section,
 * which reading 26 ("an assessment section may hold no part") accepts, would deliver none either.
 *
 * @param identifier The test's identifier.
 * @param parts The parts, in document order.
 * @param outcomes The test's outcome declarations and outcome processing.
 * @returns The test's text.
 */
const testXml = (
  identifier: string,
  parts: readonly BuiltPart[],
  outcomes: BuiltOutcomes = noOutcomes,
): string =>
  [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    outcomes.declarations,
    ...parts.map((part) =>
      [
        `<qti-test-part identifier="${part.identifier}" navigation-mode="${part.navigation}" submission-mode="${part.submission}">`,
        part.control === "" ? "" : `<qti-item-session-control ${part.control}/>`,
        `<qti-assessment-section identifier="${part.identifier}-section" title="Section" visible="true">`,
        ...(part.refs.length === 0
          ? [
              `<qti-assessment-section-ref identifier="${part.identifier}-elsewhere" href="elsewhere.xml"/>`,
            ]
          : part.refs.map((ref) => {
              const defaults = part.defaults?.[ref];

              return defaults === undefined
                ? `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`
                : `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml">${defaults}</qti-assessment-item-ref>`;
            })),
        "</qti-assessment-section></qti-test-part>",
      ].join(""),
    ),
    outcomes.rules === ""
      ? ""
      : `<qti-outcome-processing>${outcomes.rules}</qti-outcome-processing>`,
    "</qti-assessment-test>",
  ].join("");

/**
 * Open a hand-built test and its items, the test at `tests/<identifier>.xml` and each item beside
 * it at `tests/<ref>.xml`.
 *
 * @param identifier The test's identifier.
 * @param parts The test's parts.
 * @param items Each item ref's identifier with its item's text.
 * @param outcomes The test's outcome declarations and outcome processing.
 * @returns The test and its items.
 */
const builtDelivery = Effect.fnUntraced(function* builtDelivery(
  identifier: string,
  parts: readonly BuiltPart[],
  items: readonly (readonly [string, string])[],
  outcomes: BuiltOutcomes = noOutcomes,
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    `tests/${identifier}.xml`,
    encoder.encode(testXml(identifier, parts, outcomes)),
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
  outputBudget: 16_777_216,
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
  ...accepted(present(delivery.test.test, delivery.items, session, sequenceIndex, now)),
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

/**
 * Write the text of a hand-built Choice bound to a single identifier response, of `max-choices` 1.
 *
 * @param response The response it binds.
 * @param choices The markup of its choices.
 * @param minChoices Its `min-choices`, when it sets one.
 * @returns The interaction's text.
 */
const choiceXml = (response: string, choices: string, minChoices?: number): string =>
  `<qti-choice-interaction response-identifier="${response}" shuffle="false" max-choices="1"${minChoices === undefined ? "" : ` min-choices="${minChoices}"`}>${choices}</qti-choice-interaction>`;

/**
 * Write the text of a simple choice, shown by the template variable `T` when it holds the choice's
 * identifier.
 *
 * @param identifier The choice's identifier.
 * @returns The choice's text.
 */
const shownByT = (identifier: string): string =>
  `<qti-simple-choice identifier="${identifier}" template-identifier="T" show-hide="show">Choice ${identifier}</qti-simple-choice>`;

/**
 * Write the text of a simple choice with no template visibility.
 *
 * @param identifier The choice's identifier.
 * @returns The choice's text.
 */
const plainChoice = (identifier: string): string =>
  `<qti-simple-choice identifier="${identifier}">Choice ${identifier}</qti-simple-choice>`;

/**
 * Write the text of a hand-built Inline Choice bound to a single identifier response, its choices
 * `Choice` and their identifiers.
 *
 * @param response The response it binds.
 * @param choices The identifiers of its choices.
 * @param required Whether it carries `required="true"`, so `validate-responses` refuses a NULL
 *   post.
 * @returns The interaction's text.
 */
const inlineChoiceXml = (response: string, choices: readonly string[], required = false): string =>
  `<qti-inline-choice-interaction response-identifier="${response}" shuffle="false"${required ? ' required="true"' : ""}>${choices.map((identifier) => `<qti-inline-choice identifier="${identifier}">Choice ${identifier}</qti-inline-choice>`).join("")}</qti-inline-choice-interaction>`;

/**
 * Write the text of a paragraph holding a template inline shown by the template variable `T` when
 * it holds the inline's identifier. A template block may hold no interaction (reading 143), so an
 * interaction shown or hidden by a template sits in a template inline's `span`.
 *
 * @param identifier The inline's identifier.
 * @param content The content of its `span`.
 * @returns The paragraph's text.
 */
const inlineShownByT = (identifier: string, content: string): string =>
  `<p><qti-template-inline identifier="${identifier}" template-identifier="T" show-hide="show"><span>${content}</span></qti-template-inline></p>`;

/**
 * Write the text of a hand-built templated item: `RESPONSE`, a single identifier whose correct
 * response is `A`, scored by `match_correct` into `SCORE`, and template processing that sets the
 * single identifier template variable `T` to a value it writes, so no draw decides what the page
 * shows.
 *
 * @param identifier The item's identifier.
 * @param value The identifier template processing sets `T` to.
 * @param parts What the item holds besides.
 * @param parts.body The item body's content.
 * @param parts.declarations The response declarations it adds after `RESPONSE`'s, when it adds any.
 * @param parts.rules The template rules it adds after setting `T`, when it adds any.
 * @returns The item's text.
 */
const templatedItemXml = (
  identifier: string,
  value: string,
  parts: { readonly body: string; readonly declarations?: string; readonly rules?: string },
): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
    "</qti-response-declaration>",
    parts.declarations ?? "",
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/>',
    "<qti-template-processing>",
    `<qti-set-template-value identifier="T"><qti-base-value base-type="identifier">${value}</qti-base-value></qti-set-template-value>`,
    parts.rules ?? "",
    "</qti-template-processing>",
    `<qti-item-body>${parts.body}</qti-item-body>`,
    '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
  ].join("");

/**
 * A value whose members count each read of them, and a faithful value otherwise.
 */
interface CountedValue {
  /**
   * How many times the members have been read.
   */
  readonly reads: () => number;
  readonly value: Value;
}

/**
 * Wrap a value so each read of its members counts. Printing a variable reads its members, and
 * deciding which parts the page shows never reads a printed variable's, so the count shows whether
 * a path printed it.
 *
 * @param value The value.
 * @returns The wrapped value and its count.
 */
const counted = (value: Value): CountedValue => {
  let reads = 0;

  return {
    reads: () => reads,
    value: {
      baseType: value.baseType,
      cardinality: value.cardinality,
      get values() {
        reads += 1;

        return value.values;
      },
    },
  };
};

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
    { tags: ["corpus"] },
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
    { tags: ["corpus"] },
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
    "[T-4] under allow-skipping false counts only the responses a page can post: a value for a response no interaction binds does not answer the item",
    () =>
      Effect.gen(function* postedOnly() {
        const delivery = yield* builtDelivery(
          "posted",
          [partOf("part", ["mixed"], { control: 'allow-skipping="false"' })],
          [["mixed", choiceItemXml("mixed", { unbound: "HIDDEN" })]],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.strictEqual(
          refusedRule(
            submitItem(
              delivery.test,
              delivery.items,
              begun,
              stepOf("submit-item", { HIDDEN: chosen("A") }),
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
            stepOf("submit-item", { RESPONSE: chosen("C") }),
            configuration,
            { now: after(6) },
          ),
        );

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
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

  it.effect(
    "[I-5] under validate-responses true judges a template inline the item's record shows: its required Inline Choice refuses an empty post (responses-invalid) and accepts a choice",
    () =>
      Effect.gen(function* shownInline() {
        const delivery = yield* builtDelivery(
          "block",
          [partOf("part", ["block"], { control: 'validate-responses="true"' })],
          [
            [
              "block",
              templatedItemXml("block", "X", {
                body: inlineShownByT("X", inlineChoiceXml("RESPONSE", ["A", "B", "C"], true)),
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.deepStrictEqual(itemAt(begun, 1).record.templates["T"], chosen("X"));

        const failure = refusal(
          submitItem(delivery.test, delivery.items, begun, stepOf("submit-item"), configuration, {
            now: after(5),
          }),
        );

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

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(itemAt(answered, 1).record), scored(1));
      }),
  );

  it.effect(
    "[I-5] under validate-responses true refuses a choice the item's record hides (responses-invalid), and accepts and scores a choice it shows",
    () =>
      Effect.gen(function* shownChoice() {
        const delivery = yield* builtDelivery(
          "visible",
          [partOf("part", ["visible"], { control: 'validate-responses="true"' })],
          [
            [
              "visible",
              templatedItemXml("visible", "B", {
                body: choiceXml(
                  "RESPONSE",
                  [plainChoice("A"), shownByT("B"), shownByT("C")].join(""),
                ),
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);
        const post = (choice: string, seconds: number) =>
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen(choice) }),
            configuration,
            { now: after(seconds) },
          );

        assert.deepStrictEqual(itemAt(begun, 1).record.templates["T"], chosen("B"));

        const hidden = refusal(post("C", 5));

        assert.strictEqual(hidden.rule, "responses-invalid");
        assert.deepStrictEqual(
          hidden.messages.map((message) => message.response),
          ["RESPONSE"],
        );

        const shownAnswer = itemAt(accepted(post("B", 6)), 1).record;

        assert.strictEqual(shownAnswer.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(shownAnswer), scored(0));
        assert.deepStrictEqual(scoreOf(itemAt(accepted(post("A", 7)), 1).record), scored(1));
      }),
  );

  it.effect(
    "[I-5] under allow-skipping false counts a template inline's interaction the item's record shows: an empty submit is skipping-not-allowed, and an answer is accepted",
    () =>
      Effect.gen(function* shownInlineSkipped() {
        const delivery = yield* builtDelivery(
          "unskippable",
          [partOf("part", ["unskippable"], { control: 'allow-skipping="false"' })],
          [
            [
              "unskippable",
              templatedItemXml("unskippable", "X", {
                body: inlineShownByT("X", inlineChoiceXml("RESPONSE", ["A", "B", "C"])),
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.deepStrictEqual(itemAt(begun, 1).record.templates["T"], chosen("X"));
        assert.strictEqual(
          refusedRule(
            submitItem(delivery.test, delivery.items, begun, stepOf("submit-item"), configuration, {
              now: after(5),
            }),
          ),
          "skipping-not-allowed",
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

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(itemAt(answered, 1).record), scored(1));
      }),
  );

  it.effect(
    "[I-5] under allow-skipping false decides skipping without formatting a printed variable: the skip rule reads the walk that prints no text",
    () =>
      Effect.gen(function* skippedWithoutPrinting() {
        const delivery = yield* builtDelivery(
          "printing",
          [partOf("part", ["printing"], { control: 'allow-skipping="false"' })],
          [
            [
              "printing",
              templatedItemXml("printing", "X", {
                body: `<p><qti-printed-variable identifier="T"/></p>${choiceXml("RESPONSE", ["A", "B"].map(plainChoice).join(""))}`,
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);
        const printed = counted(chosen("X"));
        const printing: TestSession = {
          ...begun,
          items: begun.items.map((entry) =>
            entry.sequenceIndex === 1
              ? {
                  ...entry,
                  record: {
                    ...entry.record,
                    templates: { ...entry.record.templates, T: printed.value },
                  },
                }
              : entry,
          ),
        };

        assert.strictEqual(
          refusedRule(
            submitItem(
              delivery.test,
              delivery.items,
              printing,
              stepOf("submit-item"),
              configuration,
              { now: after(5) },
            ),
          ),
          "skipping-not-allowed",
        );
        assert.strictEqual(printed.reads(), 0);
      }),
  );

  it.effect(
    "[I-5] under allow-skipping false reads the default template processing sets: an empty submit and a submit of that default are skipping-not-allowed, and another value is accepted",
    () =>
      Effect.gen(function* templateDefaultSkipped() {
        const delivery = yield* builtDelivery(
          "drawn",
          [partOf("part", ["drawn"], { control: 'allow-skipping="false"' })],
          [
            [
              "drawn",
              templatedItemXml("drawn", "X", {
                body: choiceXml("RESPONSE", ["A", "B", "C"].map(plainChoice).join("")),
                rules:
                  '<qti-set-default-value identifier="RESPONSE"><qti-base-value base-type="identifier">B</qti-base-value></qti-set-default-value>',
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.deepStrictEqual(itemAt(begun, 1).record.defaults["RESPONSE"], chosen("B"));
        assert.deepStrictEqual(itemAt(begun, 1).record.responses["RESPONSE"], chosen("B"));

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
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            configuration,
            { now: after(6) },
          ),
        );

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(itemAt(answered, 1).record), scored(1));
      }),
  );

  it.effect(
    "[I-5] scores an item whose RESPONSE declares a default, posted without it, through a session as score does with no record and over begin's record (D4-11)",
    () =>
      Effect.gen(function* sessionDefault() {
        const delivery = yield* builtDelivery(
          "defaulted",
          [partOf("part", ["defaulted"])],
          [["defaulted", choiceItemXml("defaulted", { defaultValue: "A" })]],
        );
        const configuration = yield* configure({});
        const submitted = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            started(delivery, configuration),
            stepOf("submit-item"),
            configuration,
            { now: after(5) },
          ),
        );
        const item = delivery.items.get("defaulted") ?? assert.fail("defaulted is not delivered");
        const alone = yield* Effect.fromResult(
          Result.flatMap(scoreResponses(item, {}), decodeRecord),
        );
        const over = yield* Effect.fromResult(
          Result.flatMap(
            Result.flatMap(begin(item, { instance: `${instance}.1`, seed: "7" }), (record) =>
              scoreResponses(item, {}, record),
            ),
            decodeRecord,
          ),
        );

        assert.deepStrictEqual(itemAt(submitted, 1).record.responses["RESPONSE"], chosen("A"));
        assert.deepStrictEqual([itemAt(submitted, 1).record, alone, over].map(scoreOf), [
          scored(1),
          scored(1),
          scored(1),
        ]);
      }),
  );

  it.effect(
    "[I-5] under validate-responses true submits a templated item whose hidden template inline's interaction holds a non-NULL declared default, with no refusal",
    () =>
      Effect.gen(function* hiddenDefault() {
        const delivery = yield* builtDelivery(
          "hidden",
          [partOf("part", ["hidden"], { control: 'validate-responses="true"' })],
          [
            [
              "hidden",
              templatedItemXml("hidden", "X", {
                body: [
                  choiceXml("RESPONSE", ["A", "B", "C"].map(plainChoice).join("")),
                  inlineShownByT("Y", inlineChoiceXml("HIDDEN", ["D", "E"])),
                ].join(""),
                declarations:
                  '<qti-response-declaration identifier="HIDDEN" cardinality="single" base-type="identifier"><qti-default-value><qti-value>E</qti-value></qti-default-value></qti-response-declaration>',
              }),
            ],
          ],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);

        assert.deepStrictEqual(itemAt(begun, 1).record.responses["HIDDEN"], chosen("E"));

        const answered = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            configuration,
            { now: after(5) },
          ),
        );

        assert.strictEqual(itemAt(answered, 1).record.numAttempts, 1);
        assert.deepStrictEqual(scoreOf(itemAt(answered, 1).record), scored(1));
      }),
  );

  it.effect(
    "[T-14] saves a step's record on an item with a record response, and submit-item scores it into the item record's records, apart from its responses",
    () =>
      Effect.gen(function* savesAndScoresRecord() {
        const built = yield* builtDelivery(
          "recorded",
          [partOf("part", ["recorded"])],
          [["recorded", choiceItemXml("recorded")]],
        );
        const plain = built.items.get("recorded") ?? assert.fail("recorded is not delivered");
        const delivery: Delivery = {
          items: new Map([
            [
              "recorded",
              acceptForTest({
                ...plain.item,
                records: new Map([
                  [
                    "RREC",
                    { correct: Option.none(), defaultValue: Option.none(), identifier: "RREC" },
                  ],
                ]),
              }),
            ],
          ]),
          test: built.test,
        };
        const answer: RecordValue = {
          cardinality: "record",
          fields: [
            { identifier: "stringValue", value: { baseType: "string", value: "-0.050" } },
            { identifier: "floatValue", value: { baseType: "float", value: -0.05 } },
          ],
        };
        const configuration = yield* configure({});
        const saved = accepted(
          recordStep(
            started(delivery, configuration),
            stepOf("submit-item", { RESPONSE: chosen("A"), RREC: answer }),
            after(2),
          ),
        );

        assert.deepStrictEqual(
          itemAt(saved, 1).saved,
          Option.some({ RESPONSE: chosen("A"), RREC: answer }),
        );

        const submitted = accepted(
          submitItem(delivery.test, delivery.items, saved, stepOf("submit-item"), configuration, {
            now: after(5),
          }),
        );
        const { record } = itemAt(submitted, 1);

        assert.deepStrictEqual(record.records, { RREC: answer });
        assert.isFalse(Object.hasOwn(record.responses, "RREC"));
        assert.deepStrictEqual(scoreOf(record), scored(1));
        assert.deepStrictEqual(itemAt(submitted, 1).saved, Option.none());
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

  it.effect(
    "[T-4] refuses submit-part when score refuses a presented item's saved responses, naming that item with score's messages: responses-invalid",
    () =>
      Effect.gen(function* refusedElsewhere() {
        const delivery = yield* builtDelivery(
          "together",
          [partOf("together", ["one", "two"], { submission: "simultaneous" })],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
          ],
        );
        const configuration = yield* configure({});
        const unlisted: Responses = { RESPONSE: chosen("Z") };
        const savedOnOne = accepted(
          recordStep(
            started(delivery, configuration),
            { intent: { kind: "go", sequenceIndex: 1 }, responses: unlisted },
            after(2),
          ),
        );
        const one = delivery.items.get("one") ?? assert.fail("item one is not delivered");
        const said = Option.getOrElse(
          Option.flatMap(Result.getFailure(scoreResponses(one, unlisted)), (failure) =>
            failure instanceof ResponsesRefused ? Option.some(failure.messages) : Option.none(),
          ),
          () => assert.fail("score does not refuse a choice item one does not list"),
        );

        const refused = refusal(
          submitPart(
            delivery.test,
            delivery.items,
            shown(delivery, savedOnOne, 2, after(3)),
            stepOf("submit-part", { RESPONSE: chosen("A") }),
            { now: after(8) },
          ),
        );

        assert.strictEqual(refused.rule, "responses-invalid");
        assert.strictEqual(refused.intent, "submit-part");
        assert.deepStrictEqual(refused.sequenceIndex, Option.some(1));
        assert.isAbove(said.length, 0);
        assert.deepStrictEqual(refused.messages, said);
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

/**
 * The processing seed every outcome run case starts its session with, so the runs' draws are fixed.
 */
const processingSeed = "outcome-run-seed";

/**
 * The outcomes of a test whose outcome processing draws `DRAW` from 1 to 1,000,000, sums every
 * item's `SCORE` into `TOTAL`, reads item ref `one`'s `SCORE` into `FIRST` through its prefix,
 * and reads the test's own `duration` into `TIME`, in that order.
 */
const summingOutcomes: BuiltOutcomes = {
  declarations: [
    '<qti-outcome-declaration identifier="DRAW" cardinality="single" base-type="integer"/>',
    '<qti-outcome-declaration identifier="FIRST" cardinality="single" base-type="float"/>',
    '<qti-outcome-declaration identifier="TIME" cardinality="single" base-type="duration"/>',
    '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>',
  ].join(""),
  rules: [
    '<qti-set-outcome-value identifier="DRAW"><qti-random-integer min="1" max="1000000"/></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="TOTAL"><qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="FIRST"><qti-variable identifier="one.SCORE"/></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="TIME"><qti-variable identifier="duration"/></qti-set-outcome-value>',
  ].join(""),
};

/**
 * A single integer value.
 *
 * @param value The integer.
 * @returns The value.
 */
const integerOf = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * A single duration value.
 *
 * @param seconds The duration in seconds.
 * @returns The value.
 */
const secondsOf = (seconds: number): Value => ({
  baseType: "duration",
  cardinality: "single",
  values: [{ baseType: "duration", value: seconds }],
});

/**
 * Give the `DRAW` that {@link summingOutcomes}' `qti-random-integer` takes as the first draw of a
 * stream: 1 plus a draw below 1,000,000.
 *
 * @param seed The stream's seed.
 * @param label The stream's label.
 * @returns The single integer.
 */
const drawnBy = (seed: string, label: string): Value =>
  integerOf(1n + drawBelow(drawStream(seed, label), 1_000_000n));

/**
 * Give the outcomes run `run` of {@link summingOutcomes} leaves, from what it reads.
 *
 * @param run The run's number, counted from 1.
 * @param read What the run reads.
 * @param read.first Item ref `one`'s `SCORE`.
 * @param read.seconds The test's `duration`.
 * @param read.total The sum of every item's `SCORE`.
 * @returns The outcomes, by identifier.
 */
const summed = (
  run: number,
  read: { readonly first: number; readonly seconds: number; readonly total: number },
) => ({
  DRAW: drawnBy(processingSeed, outcomeLabel(instance, run)),
  FIRST: scored(read.first),
  TIME: secondsOf(read.seconds),
  TOTAL: scored(read.total),
});

/**
 * Start a session of a delivery under {@link processingSeed}, failing the test when `startTest`
 * refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const seeded = (delivery: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(delivery.test, delivery.items, configuration, {
      instance,
      now: startedAt,
      seed: processingSeed,
    }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

describe("outcome processing in a session", () => {
  it.effect(
    "[T-9] an outcome run follows each submitItem in an individual part, counted by outcomeRuns, its duration the seconds from started to now",
    () =>
      Effect.gen(function* afterSubmitItem() {
        const delivery = yield* builtDelivery(
          "summing",
          [partOf("part", ["one", "two"])],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
          ],
          summingOutcomes,
        );
        const session = seeded(delivery, defaults);
        assert.strictEqual(session.outcomeRuns, 0);

        const first = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            defaults,
            { now: after(5) },
          ),
        );
        assert.strictEqual(first.outcomeRuns, 1);
        assert.deepStrictEqual(first.outcomes, summed(1, { first: 1, seconds: 5, total: 1 }));

        const second = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            shown(delivery, first, 2, after(6)),
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            defaults,
            { now: after(9.25) },
          ),
        );
        assert.strictEqual(second.outcomeRuns, 2);
        assert.deepStrictEqual(second.outcomes, summed(2, { first: 1, seconds: 9.2, total: 2 }));
        assert.strictEqual(second.status, "interacting");
      }),
  );

  it.effect(
    "[T-9] an outcome run follows submitPart once, after every item of the simultaneous part is processed",
    () =>
      Effect.gen(function* afterSubmitPart() {
        const delivery = yield* builtDelivery(
          "summing",
          [
            partOf("together", ["one", "two"], { submission: "simultaneous" }),
            partOf("after", ["three"]),
          ],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
            ["three", choiceItemXml("three")],
          ],
          summingOutcomes,
        );
        const savedOnOne = accepted(
          recordStep(
            seeded(delivery, defaults),
            { intent: { kind: "go", sequenceIndex: 2 }, responses: { RESPONSE: chosen("A") } },
            after(2),
          ),
        );

        const submitted = accepted(
          submitPart(
            delivery.test,
            delivery.items,
            shown(delivery, savedOnOne, 2, after(3)),
            stepOf("submit-part", { RESPONSE: chosen("A") }),
            { now: after(8) },
          ),
        );

        assert.strictEqual(submitted.outcomeRuns, 1);
        assert.deepStrictEqual(submitted.outcomes, summed(1, { first: 1, seconds: 8, total: 2 }));
        assert.strictEqual(submitted.status, "interacting");
        assert.deepStrictEqual(
          submitted.parts.map((part) => part.status),
          ["ended", "current"],
        );
      }),
  );

  it.effect(
    "[T-9] the close runs one more outcome run: a submitPart that closes the test runs twice at one now, the close's run differing only in its draws",
    () =>
      Effect.gen(function* closingSubmitPart() {
        const delivery = yield* builtDelivery(
          "summing",
          [partOf("together", ["one", "two"], { submission: "simultaneous" })],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
          ],
          summingOutcomes,
        );

        const closed = accepted(
          submitPart(
            delivery.test,
            delivery.items,
            seeded(delivery, defaults),
            stepOf("submit-part", { RESPONSE: chosen("A") }),
            { now: after(8) },
          ),
        );

        assert.strictEqual(closed.status, "closed");
        assert.strictEqual(closed.outcomeRuns, 2);
        assert.deepStrictEqual(closed.outcomes, summed(2, { first: 1, seconds: 8, total: 1 }));

        const before = Result.getOrElse(
          runOutcomes(
            delivery.test.test,
            testScopeOf(
              delivery.test.test,
              delivery.items,
              closed,
              attemptLimits(delivery.test.test),
              Option.some(8),
            ),
            drawStream(processingSeed, outcomeLabel(instance, 1)),
          ),
          (failure) => assert.fail(`the first run failed: ${failure.message}`),
        );
        assert.deepStrictEqual(before, summed(1, { first: 1, seconds: 8, total: 1 }));
        assert.notDeepEqual(
          closed.outcomes["DRAW"],
          drawnBy(processingSeed, outcomeLabel(instance, 1)),
        );
      }),
  );

  it.effect(
    "[T-9] an endPart that closes the test runs an outcome run, whose duration reads the close",
    () =>
      Effect.gen(function* closingEndPart() {
        const delivery = yield* builtDelivery(
          "summing",
          [partOf("first", ["one"]), partOf("last", ["two"])],
          [
            ["one", choiceItemXml("one")],
            ["two", choiceItemXml("two")],
          ],
          summingOutcomes,
        );
        const submitted = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            seeded(delivery, defaults),
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            defaults,
            { now: after(4) },
          ),
        );
        const moved = accepted(
          endPart(delivery.test, delivery.items, submitted, stepOf("end-part"), { now: after(6) }),
        );
        assert.strictEqual(moved.status, "interacting");
        assert.strictEqual(moved.outcomeRuns, 1);
        assert.deepStrictEqual(moved.outcomes, submitted.outcomes);

        const closed = accepted(
          endPart(delivery.test, delivery.items, moved, stepOf("end-part"), { now: after(12.5) }),
        );
        assert.strictEqual(closed.status, "closed");
        assert.strictEqual(closed.outcomeRuns, 2);
        assert.deepStrictEqual(closed.outcomes, summed(2, { first: 1, seconds: 12.5, total: 1 }));
      }),
  );

  it.effect(
    "[T-9] an outcome run draws from the processing seed under its run's outcome label, never the default key",
    () =>
      Effect.gen(function* keyedDraws() {
        const delivery = yield* builtDelivery(
          "summing",
          [partOf("part", ["one"])],
          [["one", choiceItemXml("one")]],
          summingOutcomes,
        );
        const session = seeded(delivery, defaults);
        assert.strictEqual(session.seed, processingSeed);

        const submitted = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-item", { RESPONSE: chosen("B") }),
            defaults,
            { now: after(3) },
          ),
        );
        const closed = accepted(
          endPart(delivery.test, delivery.items, submitted, stepOf("end-part"), { now: after(4) }),
        );

        const runOne = drawnBy(processingSeed, outcomeLabel(instance, 1));
        const runTwo = drawnBy(processingSeed, outcomeLabel(instance, 2));
        assert.strictEqual(outcomeLabel(instance, 1), "sitting\u001Foutcome\u001F1");
        assert.deepStrictEqual(submitted.outcomes["DRAW"], runOne);
        assert.deepStrictEqual(closed.outcomes["DRAW"], runTwo);
        assert.notDeepEqual(runOne, runTwo);
        assert.notDeepEqual(runOne, drawnBy("", ""));
        assert.notDeepEqual(runTwo, drawnBy("", ""));
      }),
  );

  it.effect(
    "[T-9] a test whose outcome processing is absent or marked keeps its defaults: no outcome run is counted",
    () =>
      Effect.gen(function* notRun() {
        const declared =
          '<qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"><qti-default-value><qti-value>7</qti-value></qti-default-value></qti-outcome-declaration>';
        const kinds: readonly (readonly [string, BuiltOutcomes])[] = [
          ["absent", { declarations: declared, rules: "" }],
          [
            "marked",
            {
              declarations: declared,
              rules:
                '<qti-set-outcome-value identifier="COUNT"><qti-variable identifier="numAttempts"/></qti-set-outcome-value>',
            },
          ],
        ];
        for (const [kind, outcomes] of kinds) {
          const delivery = yield* builtDelivery(
            "unrun",
            [partOf("part", ["one"])],
            [["one", choiceItemXml("one")]],
            outcomes,
          );
          assert.strictEqual(delivery.test.test.outcomeProcessing.kind, kind);

          const session = seeded(delivery, defaults);

          const submitted = accepted(
            submitItem(
              delivery.test,
              delivery.items,
              session,
              stepOf("submit-item", { RESPONSE: chosen("A") }),
              defaults,
              { now: after(3) },
            ),
          );
          const closed = accepted(
            endPart(delivery.test, delivery.items, submitted, stepOf("end-part"), {
              now: after(4),
            }),
          );

          assert.strictEqual(closed.status, "closed", kind);
          assert.deepStrictEqual([submitted.outcomeRuns, closed.outcomeRuns], [0, 0], kind);
          assert.deepStrictEqual(closed.outcomes, { COUNT: integerOf(7n) }, kind);
        }
      }),
  );

  it.effect(
    "[T-9] an outcome run's EngineFailure passes through endPart: a stored item record lacking an outcome the run reads",
    () =>
      Effect.gen(function* failingRun() {
        const delivery = yield* builtDelivery(
          "summing",
          [partOf("part", ["one"])],
          [["one", choiceItemXml("one")]],
          summingOutcomes,
        );
        const session = seeded(delivery, defaults);
        const lacking: TestSession = {
          ...session,
          items: session.items.map((item) =>
            item.ref === "one" ? { ...item, record: { ...item.record, outcomes: {} } } : item,
          ),
        };

        const failure = Option.getOrElse(
          Result.getFailure(
            endPart(delivery.test, delivery.items, lacking, stepOf("end-part"), { now: after(2) }),
          ),
          () => assert.fail("expected the closing outcome run to fail, and endPart succeeded"),
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

/**
 * The outcomes of a test of item refs `I1` and `I2` whose outcome processing reads, in order,
 * `I1`'s built-in `numAttempts` into `ATTEMPTS`, `qti-number-incorrect` over the test into
 * `INCORRECT`, and `I2`'s `numAttempts` into `UNSEEN`.
 */
const attemptOutcomes: BuiltOutcomes = {
  declarations: [
    '<qti-outcome-declaration identifier="ATTEMPTS" cardinality="single" base-type="integer"/>',
    '<qti-outcome-declaration identifier="INCORRECT" cardinality="single" base-type="integer"/>',
    '<qti-outcome-declaration identifier="UNSEEN" cardinality="single" base-type="integer"/>',
  ].join(""),
  rules: [
    '<qti-set-outcome-value identifier="ATTEMPTS"><qti-variable identifier="I1.numAttempts"/></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="INCORRECT"><qti-number-incorrect/></qti-set-outcome-value>',
    '<qti-set-outcome-value identifier="UNSEEN"><qti-variable identifier="I2.numAttempts"/></qti-set-outcome-value>',
  ].join(""),
};

/**
 * Open the test of {@link attemptOutcomes}: one nonlinear, individual part holding `I1` and `I2`,
 * each a Choice whose correct response is `A`, under an item session control.
 *
 * @param control The attributes of the part's `qti-item-session-control`, none when empty.
 * @returns The test and its items.
 */
const attemptsDelivery = (control: string) =>
  builtDelivery(
    "attempts",
    [partOf("part", ["I1", "I2"], { control })],
    [
      ["I1", choiceItemXml("I1")],
      ["I2", choiceItemXml("I2")],
    ],
    attemptOutcomes,
  );

/**
 * Give an element's child elements of one local name.
 *
 * @param element The element.
 * @param local The local name.
 * @returns The children, in document order.
 */
const childElements = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.flatMap((child) =>
    child.kind === "element" && child.local === local ? [child] : [],
  );

/**
 * Give an element's unprefixed attribute of one name.
 *
 * @param element The element.
 * @param local The attribute's name.
 * @returns Its value, empty when the element has none.
 */
const attributeOf = (element: SourceElement, local: string): string =>
  element.attributes.find((entry) => entry.local === local && entry.namespace === "")?.value ?? "";

/**
 * Give an element's text.
 *
 * @param element The element.
 * @returns Its text children, joined.
 */
const textOf = (element: SourceElement): string =>
  element.children.map((child) => (child.kind === "text" ? child.text : "")).join("");

/**
 * Give each item's `numAttempts` as the results report writes it for a session, by item ref.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @returns Each `itemResult`'s identifier keyed to its `numAttempts` value's text.
 */
const writtenAttempts = Effect.fnUntraced(function* writtenAttempts(
  delivery: Delivery,
  session: TestSession,
) {
  const stored = Result.getOrElse(encodeSession(session), (failure) =>
    assert.fail(`encodeSession failed: ${failure.message}`),
  );
  const xml = Result.getOrElse(
    results({
      context: { sessions: [{ identifier: "s-attempts", sourceId: "https://example.org/" }] },
      items: delivery.items,
      kind: "test",
      session: stored,
      test: delivery.test,
    }),
    (failure) => assert.fail(`results failed: ${failure.message}`),
  );
  const { root } = yield* readSource("result.xml", new TextEncoder().encode(xml));

  return Object.fromEntries(
    childElements(root, "itemResult").map((item) => [
      attributeOf(item, "identifier"),
      childElements(item, "responseVariable")
        .filter((variable) => attributeOf(variable, "identifier") === "numAttempts")
        .flatMap((variable) => childElements(variable, "candidateResponse"))
        .flatMap((response) => childElements(response, "value"))
        .map(textOf)
        .join(" "),
    ]),
  );
});

/**
 * Give what {@link attemptOutcomes} leaves as text: `I1`'s attempts, the incorrect count and
 * `I2`'s attempts, each a single integer's decimal, or a note when it is not one.
 *
 * @param session The session.
 * @returns The three, in that order.
 */
const attemptsRead = (session: TestSession): readonly string[] =>
  ["ATTEMPTS", "INCORRECT", "UNSEEN"].map((identifier) => {
    const [single] = session.outcomes[identifier]?.values ?? [];

    return single?.baseType === "integer" ? String(single.value) : `${identifier} is no integer`;
  });

describe("a test reads an item's numAttempts as the attempts started", () => {
  it.effect(
    "[T-9] the started attempt count: an item presented and left unanswered when its part ends reads 1, and qti-number-incorrect counts it, as results writes it",
    () =>
      Effect.gen(function* unanswered() {
        const delivery = yield* attemptsDelivery("");
        assert.strictEqual(delivery.test.test.outcomeProcessing.kind, "runs");

        const session = seeded(delivery, defaults);
        assert.isTrue(itemAt(session, 1).presented);

        const closed = accepted(
          endPart(delivery.test, delivery.items, session, stepOf("end-part"), { now: after(4) }),
        );

        assert.strictEqual(closed.status, "closed");
        assert.strictEqual(itemAt(closed, 1).record.numAttempts, 0);
        assert.deepStrictEqual(attemptsRead(closed), ["1", "1", "0"]);
        assert.deepStrictEqual(yield* writtenAttempts(delivery, closed), { I1: "1", I2: "0" });
      }),
  );

  it.effect(
    "[T-9] the started attempt count: an item of max-attempts 2 left open after one wrong submission reads 2, as results writes it",
    () =>
      Effect.gen(function* leftOpen() {
        const delivery = yield* attemptsDelivery('max-attempts="2"');
        const configuration = yield* configure({});

        const wrong = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            seeded(delivery, configuration),
            stepOf("submit-item", { RESPONSE: chosen("B") }),
            configuration,
            { now: after(5) },
          ),
        );

        assert.strictEqual(wrong.outcomeRuns, 1);
        assert.strictEqual(itemAt(wrong, 1).record.numAttempts, 1);
        assert.isFalse(closedAt(delivery, wrong, 1));
        assert.deepStrictEqual(attemptsRead(wrong), ["2", "1", "0"]);
        assert.deepStrictEqual(yield* writtenAttempts(delivery, wrong), { I1: "2", I2: "0" });
      }),
  );

  it.effect(
    "[T-9] the started attempt count: an item of max-attempts 2 closed by its second submission reads 2, no attempt past its limit, as results writes it",
    () =>
      Effect.gen(function* limitReached() {
        const delivery = yield* attemptsDelivery('max-attempts="2"');
        const configuration = yield* configure({});
        let session = seeded(delivery, configuration);
        for (const seconds of [5, 9]) {
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

        assert.strictEqual(session.outcomeRuns, 2);
        assert.strictEqual(itemAt(session, 1).record.numAttempts, 2);
        assert.isTrue(closedAt(delivery, session, 1));
        assert.deepStrictEqual(attemptsRead(session), ["2", "1", "0"]);
        assert.deepStrictEqual(yield* writtenAttempts(delivery, session), { I1: "2", I2: "0" });
      }),
  );
});

describe("a linear item ref's template defaults at a part's end", () => {
  it.effect(
    "[T-9] applies the template default of the next linear part's first item when endPart presents it, reading the test outcome a submission's run set",
    () =>
      Effect.gen(function* appliesAtPartEnd() {
        const delivery = yield* builtDelivery(
          "defaulted",
          [
            partOf("first", ["one"], { navigation: "linear" }),
            partOf("second", ["two"], {
              defaults: {
                two: '<qti-template-default template-identifier="T"><qti-variable identifier="TOTAL"/></qti-template-default>',
              },
              navigation: "linear",
            }),
          ],
          [
            ["one", choiceItemXml("one")],
            [
              "two",
              [
                '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="two" title="two" adaptive="false" time-dependent="false">',
                '<qti-template-declaration identifier="T" cardinality="single" base-type="float"/>',
                "<qti-item-body><p>Read this passage.</p></qti-item-body></qti-assessment-item>",
              ].join(""),
            ],
          ],
          {
            declarations:
              '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>',
            rules:
              '<qti-set-outcome-value identifier="TOTAL"><qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum></qti-set-outcome-value>',
          },
        );
        const session = seeded(delivery, defaults);
        const submitted = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            defaults,
            { now: after(5) },
          ),
        );
        const ended = accepted(
          endPart(delivery.test, delivery.items, submitted, stepOf("end-part"), { now: after(6) }),
        );

        assert.deepStrictEqual(session.outcomes, { TOTAL: scored(0) });
        assert.deepStrictEqual(submitted.outcomes, { TOTAL: scored(1) });
        assert.strictEqual(ended.position, 1);
        assert.deepStrictEqual(itemAt(ended, 2).record.templates, { T: scored(1) });
      }),
  );
});

/**
 * Write the text of a hand-built item whose template variables a test's template defaults set: the
 * single float template variable `T`, with no default, and the single duration template variable
 * `U`, which declares the default 5. Its body is a passage.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const defaultedItemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-template-declaration identifier="T" cardinality="single" base-type="float"/>',
    '<qti-template-declaration identifier="U" cardinality="single" base-type="duration">',
    "<qti-default-value><qti-value>5</qti-value></qti-default-value></qti-template-declaration>",
    "<qti-item-body><p>Read this passage.</p></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * The outcomes of a test whose outcome processing sums every item's `SCORE` into `TOTAL`.
 */
const totalOutcomes: BuiltOutcomes = {
  declarations:
    '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>',
  rules:
    '<qti-set-outcome-value identifier="TOTAL"><qti-sum><qti-test-variables variable-identifier="SCORE"/></qti-sum></qti-set-outcome-value>',
};

/**
 * Write a `qti-template-default` that sets a template variable to what a name reads.
 *
 * @param target Its `template-identifier`.
 * @param name The name its `qti-variable` reads.
 * @returns The element's text.
 */
const defaultReading = (target: string, name: string): string =>
  `<qti-template-default template-identifier="${target}"><qti-variable identifier="${name}"/></qti-template-default>`;

describe("a nonlinear item ref's template defaults when its part starts", () => {
  it.effect(
    "[T-9] keeps the template default computed when its part starts, though a later submission's run sets the test outcome it read",
    () =>
      Effect.gen(function* keepsAfterRun() {
        const delivery = yield* builtDelivery(
          "kept",
          [partOf("part", ["one", "two"], { defaults: { two: defaultReading("T", "TOTAL") } })],
          [
            ["one", choiceItemXml("one")],
            ["two", defaultedItemXml("two")],
          ],
          totalOutcomes,
        );
        const session = seeded(delivery, defaults);
        const submitted = accepted(
          submitItem(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-item", { RESPONSE: chosen("A") }),
            defaults,
            { now: after(5) },
          ),
        );
        const reached = shown(delivery, submitted, 2, after(6));

        assert.deepStrictEqual(itemAt(session, 2).templateDefaults, Option.some({ T: scored(0) }));
        assert.deepStrictEqual(submitted.outcomes, { TOTAL: scored(1) });
        assert.deepStrictEqual(itemAt(reached, 2).record.templates, {
          T: scored(0),
          U: secondsOf(5),
        });
      }),
  );

  it.effect(
    "[T-9] reads the run a simultaneous part's submission left in the next nonlinear part's template default when its part starts, not the outcome's default",
    () =>
      Effect.gen(function* readsPartRun() {
        const delivery = yield* builtDelivery(
          "ordered",
          [
            partOf("first", ["one"], { submission: "simultaneous" }),
            partOf("second", ["two"], { defaults: { two: defaultReading("T", "TOTAL") } }),
          ],
          [
            ["one", choiceItemXml("one")],
            ["two", defaultedItemXml("two")],
          ],
          totalOutcomes,
        );
        const session = seeded(delivery, defaults);
        const ended = accepted(
          submitPart(
            delivery.test,
            delivery.items,
            session,
            stepOf("submit-part", { RESPONSE: chosen("A") }),
            { now: after(5) },
          ),
        );

        assert.deepStrictEqual(session.outcomes, { TOTAL: scored(0) });
        assert.deepStrictEqual(ended.outcomes, { TOTAL: scored(1) });
        assert.strictEqual(ended.position, 1);
        assert.deepStrictEqual(itemAt(ended, 2).templateDefaults, Option.some({ T: scored(1) }));
        assert.deepStrictEqual(itemAt(ended, 2).record.templates["T"], scored(1));
      }),
  );

  it.effect(
    "[T-9] reads the test's duration as NULL in a template default when its part starts after an earlier part's end",
    () =>
      Effect.gen(function* readsNoTime() {
        const delivery = yield* builtDelivery(
          "timeless",
          [
            partOf("first", ["one"]),
            partOf("second", ["two"], { defaults: { two: defaultReading("U", "duration") } }),
          ],
          [
            ["one", choiceItemXml("one")],
            ["two", defaultedItemXml("two")],
          ],
        );
        const ended = accepted(
          endPart(delivery.test, delivery.items, seeded(delivery, defaults), stepOf("end-part"), {
            now: after(60),
          }),
        );

        assert.strictEqual(ended.position, 1);
        assert.deepStrictEqual(
          itemAt(ended, 2).templateDefaults,
          Option.some({ U: nullOf("duration", "single") }),
        );
        assert.deepStrictEqual(
          itemAt(ended, 2).record.templates["U"],
          nullOf("duration", "single"),
        );
      }),
  );
});

/**
 * Write the text of a hand-built item whose one response is the record response `ANSWER`, bound to
 * a Text Entry, with no response processing.
 *
 * @param identifier The item's identifier.
 * @param options What the item adds.
 * @param options.defaultValue The `qti-value` elements of `ANSWER`'s declared default, as text,
 *   when it declares one.
 * @param options.patternMask The Text Entry's `pattern-mask`, when it sets one.
 * @returns The item's text.
 */
const recordItemXml = (
  identifier: string,
  options: { readonly defaultValue?: string; readonly patternMask?: string } = {},
): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="ANSWER" cardinality="record">',
    options.defaultValue === undefined
      ? ""
      : `<qti-default-value>${options.defaultValue}</qti-default-value>`,
    "</qti-response-declaration>",
    "<qti-item-body><p>Your number: ",
    `<qti-text-entry-interaction response-identifier="ANSWER"${options.patternMask === undefined ? "" : ` pattern-mask="${options.patternMask}"`}/>`,
    "</p></qti-item-body>",
    "</qti-assessment-item>",
  ].join("");

/**
 * Construct the record a candidate's text gives, holding only its `stringValue`, as a host may
 * build it; the NULL record for empty text.
 *
 * @param text The text as typed.
 * @returns The record.
 */
const typedRecord = (text: string): RecordValue => ({
  cardinality: "record",
  fields:
    text === "" ? [] : [{ identifier: "stringValue", value: { baseType: "string", value: text } }],
});

describe("submitItem and a record response", () => {
  it.effect(
    '[Q-20] refuses a skipped record answer in a linear part under allow-skipping="false": an empty submission, the NULL record and the declared default are skipping-not-allowed, and one that posts text is accepted',
    () =>
      Effect.gen(function* skippedRecordAnswer() {
        const configuration = yield* configure({});
        const begunWith = Effect.fnUntraced(function* begunWith(xml: string) {
          const delivery = yield* builtDelivery(
            "linear",
            [
              partOf("part", ["recorded"], {
                control: 'allow-skipping="false"',
                navigation: "linear",
              }),
            ],
            [["recorded", xml]],
          );

          return (seconds: number, responses?: Responses) =>
            submitItem(
              delivery.test,
              delivery.items,
              started(delivery, configuration),
              stepOf("submit-item", responses),
              configuration,
              { now: after(seconds) },
            );
        });
        const bare = yield* begunWith(recordItemXml("bare"));
        const defaulted = yield* begunWith(
          recordItemXml("defaulted", {
            defaultValue: [
              '<qti-value field-identifier="stringValue" base-type="string">0</qti-value>',
              '<qti-value field-identifier="integerValue" base-type="integer">0</qti-value>',
            ].join(""),
          }),
        );
        const answer = typedRecord("12");
        const reordered: RecordValue = {
          cardinality: "record",
          fields: [
            { identifier: "integerValue", value: { baseType: "integer", value: 0n } },
            { identifier: "stringValue", value: { baseType: "string", value: "0" } },
          ],
        };

        assert.strictEqual(refusedRule(bare(5)), "skipping-not-allowed");
        assert.strictEqual(
          refusedRule(bare(6, { ANSWER: typedRecord("") })),
          "skipping-not-allowed",
        );
        assert.strictEqual(refusedRule(defaulted(7)), "skipping-not-allowed");
        assert.strictEqual(
          refusedRule(defaulted(8, { ANSWER: reordered })),
          "skipping-not-allowed",
        );

        const answered = itemAt(accepted(bare(9, { ANSWER: answer })), 1).record;

        assert.strictEqual(answered.numAttempts, 1);
        assert.deepStrictEqual(answered.records["ANSWER"], answer);
        assert.strictEqual(
          itemAt(accepted(defaulted(10, { ANSWER: typedRecord("0") })), 1).record.numAttempts,
          1,
        );
      }),
  );

  it.effect(
    '[Q-20] under validate-responses="true" judges a record-bound Text Entry against its pattern-mask as typed: 12.0 is responses-invalid, and 12 is accepted',
    () =>
      Effect.gen(function* judgedRecord() {
        const delivery = yield* builtDelivery(
          "masked",
          [partOf("part", ["masked"], { control: 'validate-responses="true"' })],
          [["masked", recordItemXml("masked", { patternMask: "[0-9]+" })]],
        );
        const configuration = yield* configure({});
        const begun = started(delivery, configuration);
        const submit = (text: string, seconds: number) =>
          submitItem(
            delivery.test,
            delivery.items,
            begun,
            stepOf("submit-item", { ANSWER: typedRecord(text) }),
            configuration,
            { now: after(seconds) },
          );
        const failure = refusal(submit("12.0", 5));

        assert.strictEqual(failure.rule, "responses-invalid");
        assert.deepStrictEqual(
          failure.messages.map((message) => message.response),
          ["ANSWER"],
        );
        assert.strictEqual(itemAt(accepted(submit("12", 6)), 1).record.numAttempts, 1);
      }),
  );
});
