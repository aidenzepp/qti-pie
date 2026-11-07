import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { encodeSession } from "#plate/codec/session.ts";
import type { StoredTestSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import { entryName } from "#plate/form/encoding.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { InlineChoiceInteraction } from "#plate/model/item.ts";
import { fresh, startingValue } from "#plate/model/record.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import { results } from "#plate/results/results.ts";
import type { ResultContext, ResultsInput } from "#plate/results/results.ts";
import { score } from "#plate/score.ts";
import type { Responses, SessionItem, SessionPart } from "#plate/session/session.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, acceptForTest } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The cached Results Reporting XSD, named relative to the XSD cache.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The M2 fixture package, whose items the hand-built tests reference.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m2");

/**
 * BG007, a true-or-false Choice scored by `match_correct`, by its path under the corpus root.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * A UUID that starts with a digit, as about 62% of them do, so it is no NCName by itself.
 */
const uuid = "0f8fad5b-d9cb-469f-a165-70867728950e";

/**
 * The context every valid result is written with: an NCName `sourcedId`, and the playground's
 * session identifier, `s-` and a UUID.
 */
const context: ResultContext = {
  sessions: [{ identifier: `s-${uuid}`, sourceId: "http://localhost:5190/" }],
  sourcedId: "candidate-1",
};

/**
 * The hand-built sessions' instance, whose item `n` is rendered under `sit-1.n`.
 */
const instance = "sit-1";

/**
 * The hand-built sessions' seed, which keys a shuffled Choice's order.
 */
const seed = "7";

/**
 * When the hand-built sessions started and last changed: 123.45 seconds apart.
 */
const started = "2026-11-05T10:00:00.000Z";

const updated = "2026-11-05T10:02:03.450Z";

/**
 * Construct a single identifier value.
 *
 * @param identifiers The identifiers, one for a single value, several for a multiple one.
 * @returns The value, single for one identifier and multiple otherwise.
 */
const identifiers = (...chosen: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: chosen.length === 1 ? "single" : "multiple",
  values: chosen.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Open a document and give the item it accepts, failing the test otherwise.
 *
 * @param location The document's location.
 * @param bytes Its bytes.
 * @returns The accepted item.
 */
const acceptItem = Effect.fnUntraced(function* acceptItem(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Open one of the M2 fixture package's items.
 *
 * @param name The item's file name under `items/`.
 * @returns The accepted item, located at `items/<name>`.
 */
const fixtureItem = Effect.fnUntraced(function* fixtureItem(name: string) {
  const bytes = yield* Effect.tryPromise(() =>
    readFile(path.join(fixtureDirectory, "items", name)),
  );

  return yield* acceptItem(`items/${name}`, bytes);
});

/**
 * An item written for this test whose single identifier response declares the default `A`.
 */
const defaultedXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="defaulted"',
  ' title="Defaulted" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "<qti-default-value><qti-value>A</qti-value></qti-default-value>",
  "</qti-response-declaration>",
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '<qti-simple-choice identifier="A">Yes</qti-simple-choice>',
  '<qti-simple-choice identifier="B">No</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
].join("");

/**
 * An item written for this test whose response processing sets the built-in `completionStatus` to
 * `completed` when its single identifier response is the correct `A`, and sets nothing otherwise.
 */
const completingXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="completing"',
  ' title="Completing" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
  "</qti-response-declaration>",
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '<qti-simple-choice identifier="A">Yes</qti-simple-choice>',
  '<qti-simple-choice identifier="B">No</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body>",
  "<qti-response-processing><qti-response-condition><qti-response-if>",
  '<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>',
  '<qti-set-outcome-value identifier="completionStatus">',
  '<qti-base-value base-type="identifier">completed</qti-base-value>',
  "</qti-set-outcome-value>",
  "</qti-response-if></qti-response-condition></qti-response-processing>",
  "</qti-assessment-item>",
].join("");

/**
 * An item ref of a hand-built test.
 *
 * @param identifier The ref's identifier.
 * @param href The item it names, under `items/`.
 * @param maxAttempts Its own `max-attempts`, none to set nothing.
 * @returns The ref's markup.
 */
const ref = (identifier: string, href: string, maxAttempts = ""): string =>
  [
    `<qti-assessment-item-ref identifier="${identifier}" href="items/${href}">`,
    maxAttempts === "" ? "" : `<qti-item-session-control max-attempts="${maxAttempts}"/>`,
    "</qti-assessment-item-ref>",
  ].join("");

/**
 * A test part of a hand-built test, holding one section.
 *
 * @param identifier The part's identifier.
 * @param modes Its navigation and submission modes.
 * @param refs Its section's item refs.
 * @returns The part's markup.
 */
const part = (
  identifier: string,
  modes: { readonly navigation: string; readonly submission: string },
  refs: readonly string[],
): string =>
  [
    `<qti-test-part identifier="${identifier}" navigation-mode="${modes.navigation}"`,
    ` submission-mode="${modes.submission}">`,
    `<qti-assessment-section identifier="${identifier}-S" title="Section" visible="true">`,
    ...refs,
    "</qti-assessment-section></qti-test-part>",
  ].join("");

/**
 * Open a hand-built test and give the test it accepts, failing the test otherwise.
 *
 * @param identifier The test's identifier.
 * @param body Its outcome declarations, parts and outcome processing, in document order.
 * @returns The accepted test, located at `tests/<identifier>.xml`.
 */
const acceptTest = Effect.fnUntraced(function* acceptTest(
  identifier: string,
  body: readonly string[],
) {
  const location = `tests/${identifier}.xml`;
  const xml = [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
    ` identifier="${identifier}" title="Results">`,
    ...body,
    "</qti-assessment-test>",
  ].join("");
  const verdict = yield* open(location, new TextEncoder().encode(xml));

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
    ? verdict.accepted
    : assert.fail(`${location} is ${verdict.verdict}, not an accepted test`);
});

/**
 * The nonlinear, individual modes.
 */
const individual = { navigation: "nonlinear", submission: "individual" } as const;

/**
 * The linear, simultaneous modes.
 */
const simultaneous = { navigation: "linear", submission: "simultaneous" } as const;

/**
 * A test outcome declaration with a default, which a test with no outcome processing reports.
 */
const totalDeclaration = [
  '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float">',
  "<qti-default-value><qti-value>0.5</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
].join("");

/**
 * Outcome processing that sets `TOTAL`, which M2 marks and does not run.
 */
const totalProcessing = [
  '<qti-outcome-processing><qti-set-outcome-value identifier="TOTAL">',
  '<qti-base-value base-type="float">3</qti-base-value>',
  "</qti-set-outcome-value></qti-outcome-processing>",
].join("");

/**
 * A test's float `SCORE` with a default, which a test with no outcome processing reports.
 */
const scoreDeclaration = [
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  "<qti-default-value><qti-value>0.5</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
].join("");

/**
 * Outcome processing that reads the built-in `numAttempts`, which the engine does not hold in a
 * test, so the test model marks it.
 */
const attemptsProcessing = [
  "<qti-outcome-processing><qti-outcome-condition><qti-outcome-if>",
  '<qti-gte><qti-variable identifier="numAttempts"/><qti-base-value base-type="integer">1</qti-base-value></qti-gte>',
  '<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>',
  "</qti-outcome-if></qti-outcome-condition></qti-outcome-processing>",
].join("");

/**
 * The six attributes of an outcome declaration that Results Reporting mirrors, as written.
 */
const reportingMarkup = [
  'view="candidate scorer"',
  'interpretation="Points, out of 10"',
  'long-interpretation="https://example.org/scales/points"',
  'normal-maximum="10"',
  'normal-minimum="0"',
  'mastery-value="7.5"',
].join(" ");

/**
 * {@link reportingMarkup} as an `outcomeVariable` carries it.
 */
const reportingWritten = {
  interpretation: "Points, out of 10",
  longInterpretation: "https://example.org/scales/points",
  masteryValue: "7.5",
  normalMaximum: "10",
  normalMinimum: "0",
  view: "candidate scorer",
};

/**
 * An item written for this test: `SCORE` declares the six attributes Results Reporting mirrors,
 * and `MAXSCORE` none of them.
 */
const reportingXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="reporting"',
  ' title="Reporting" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
  `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" ${reportingMarkup}>`,
  "<qti-default-value><qti-value>2</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
  '<qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float"/>',
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '<qti-simple-choice identifier="A">Yes</qti-simple-choice>',
  '<qti-simple-choice identifier="B">No</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
].join("");

/**
 * A test outcome declaration with a default and the six attributes Results Reporting mirrors.
 */
const reportedDeclaration = [
  `<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float" ${reportingMarkup}>`,
  "<qti-default-value><qti-value>0.5</qti-value></qti-default-value>",
  "</qti-outcome-declaration>",
].join("");

/**
 * An item written for this test whose template processing sets the default of its single
 * identifier response `RESPONSE`, which declares none, to `B`.
 */
const defaultingXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="defaulting"',
  ' title="Defaulting" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
  "<qti-template-processing>",
  '<qti-set-default-value identifier="RESPONSE">',
  '<qti-base-value base-type="identifier">B</qti-base-value>',
  "</qti-set-default-value>",
  "</qti-template-processing>",
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '<qti-simple-choice identifier="A">Yes</qti-simple-choice>',
  '<qti-simple-choice identifier="B">No</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
].join("");

/**
 * An item written for this test whose template processing sets `HIDDEN` to `B` and `BLOCK` to `Y`.
 * Its shuffled Choice bound to `RESPONSE` holds `A` to `D`, `B` hidden while `HIDDEN` holds `B`;
 * its template block `X`, shown only while `BLOCK` holds `X`, holds a shuffled Choice bound to
 * `INNER`. So the page shows three of `RESPONSE`'s choices and no `INNER` at all.
 */
const hidingXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="hiding"',
  ' title="Hiding" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
  '<qti-response-declaration identifier="INNER" cardinality="single" base-type="identifier"/>',
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  '<qti-template-declaration identifier="HIDDEN" cardinality="single" base-type="identifier"/>',
  '<qti-template-declaration identifier="BLOCK" cardinality="single" base-type="identifier"/>',
  "<qti-template-processing>",
  '<qti-set-template-value identifier="HIDDEN">',
  '<qti-base-value base-type="identifier">B</qti-base-value>',
  "</qti-set-template-value>",
  '<qti-set-template-value identifier="BLOCK">',
  '<qti-base-value base-type="identifier">Y</qti-base-value>',
  "</qti-set-template-value>",
  "</qti-template-processing>",
  "<qti-item-body>",
  '<qti-choice-interaction response-identifier="RESPONSE" max-choices="1" shuffle="true">',
  '<qti-simple-choice identifier="A">Alpha</qti-simple-choice>',
  '<qti-simple-choice identifier="B" template-identifier="HIDDEN" show-hide="hide">Bravo</qti-simple-choice>',
  '<qti-simple-choice identifier="C">Charlie</qti-simple-choice>',
  '<qti-simple-choice identifier="D">Delta</qti-simple-choice>',
  "</qti-choice-interaction>",
  '<qti-template-block identifier="X" template-identifier="BLOCK" show-hide="show">',
  "<qti-content-body><div>",
  '<qti-choice-interaction response-identifier="INNER" max-choices="1" shuffle="true">',
  '<qti-simple-choice identifier="P">Papa</qti-simple-choice>',
  '<qti-simple-choice identifier="Q">Quebec</qti-simple-choice>',
  '<qti-simple-choice identifier="R">Romeo</qti-simple-choice>',
  "</qti-choice-interaction>",
  "</div></qti-content-body></qti-template-block>",
  "</qti-item-body></qti-assessment-item>",
].join("");

/**
 * The `templateVariable` of {@link hidingXml}'s single identifier template variable, its values
 * aside.
 *
 * @param identifier The template variable's identifier.
 * @returns Its attributes as written.
 */
const hidingTemplate = (identifier: string) =>
  ({
    baseType: "identifier",
    cardinality: "single",
    identifier,
  }) satisfies Readonly<Record<string, string>>;

/**
 * A shuffled Inline Choice of five tones bound to the single identifier response `RESPONSE`, whose
 * last choice is fixed, so it keeps the last place in every order.
 */
const tones: InlineChoiceInteraction = {
  ariaLabel: Option.some("Tone"),
  ariaLabelledby: Option.none(),
  choices: ["A", "B", "C", "D", "E"].map((identifier) => ({
    content: [{ kind: "text", text: `Tone ${identifier}` }],
    fixed: identifier === "E",
    identifier,
    templateVisibility: Option.none(),
  })),
  class: "",
  kind: "inline-choice",
  label: Option.none(),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response: "RESPONSE",
  shuffle: true,
};

/**
 * An item built for this test whose one paragraph holds {@link tones} in its sentence, as `check`
 * would accept it, located at `items/tones.xml`.
 */
const tonesItem = acceptForTest({
  body: [
    {
      attributes: [],
      children: [{ kind: "text", text: "The tone is " }, tones, { kind: "text", text: "." }],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/tones.xml",
  identifier: "tones",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Tones",
  unsupported: [],
});

/**
 * Score one attempt over a record, as a session's submission does.
 *
 * @param accepted The item.
 * @param record The record before the attempt.
 * @param responses The responses.
 * @returns The record after the attempt.
 */
const scored = Effect.fnUntraced(function* scored(
  accepted: Accepted,
  record: ItemRecord,
  responses: Responses,
) {
  const stored = yield* Effect.fromResult(encodeRecord(record));

  return yield* Effect.fromResult(
    decodeRecord(yield* Effect.fromResult(score(accepted, responses, stored))),
  );
});

/**
 * Construct a session item that has not been presented, fresh under its instance.
 *
 * @param accepted The item its ref names.
 * @param refId The ref's identifier.
 * @param sequenceIndex Its place in the session, from 1.
 * @param changes The fields that differ from a never-presented item.
 * @returns The session item.
 */
const sessionItem = (
  accepted: Accepted,
  refId: string,
  sequenceIndex: number,
  changes: Partial<SessionItem> = {},
): SessionItem => ({
  datestamp: updated,
  duration: 0,
  firstOutcomes: Option.none(),
  presented: false,
  record: fresh(accepted.item, `${instance}.${String(sequenceIndex)}`),
  ref: refId,
  saved: Option.none(),
  sequenceIndex,
  templateDefaults: Option.none(),
  ...changes,
});

/**
 * A record that counts `processed` attempts, as attempts whose processing set nothing leave it:
 * after one, the built-in `completionStatus` is `unknown`.
 *
 * @param item The session item whose record it is.
 * @param processed The attempts processed.
 * @returns The record.
 */
const processedRecord = (item: SessionItem, processed: number): ItemRecord => ({
  ...item.record,
  attempt: processed === 0 ? "none" : "submitted",
  numAttempts: processed,
  outcomes:
    processed === 0
      ? item.record.outcomes
      : { ...item.record.outcomes, completionStatus: identifiers("unknown") },
});

/**
 * Write a test session in the form the host stores, its test's outcomes at their starting values,
 * with no outcome processing run and no shuffle seed.
 *
 * @param test The test it is a session of.
 * @param items Its items.
 * @param parts Its parts, each ended by default.
 * @returns The stored session, closed.
 */
const storedSession = (
  test: AcceptedTest,
  items: readonly SessionItem[],
  parts: readonly SessionPart[] = test.test.parts.map(({ identifier }) => ({
    identifier,
    status: "ended",
  })),
): StoredTestSession =>
  Result.getOrElse(
    encodeSession({
      document: test.document,
      instance,
      items,
      kind: "test",
      outcomeRuns: 0,
      outcomes: Object.fromEntries(
        Array.from(test.test.outcomes, ([identifier, outcome]) => [
          identifier,
          startingValue(outcome),
        ]),
      ),
      parts,
      position: 0,
      seed,
      shuffleSeed: Option.none(),
      started,
      status: "closed",
      test: test.test.identifier,
      updated,
    }),
    (failure) => assert.fail(failure.message),
  );

/**
 * A variable of a result as written: its attributes and its values' text.
 */
interface WrittenVariable {
  readonly attributes: Readonly<Record<string, string>>;
  readonly values: readonly string[];
}

/**
 * An item or test result as written: its attributes, its variables by identifier, and each
 * variable's element name and identifier in document order.
 */
interface Written {
  readonly attributes: Readonly<Record<string, string>>;
  readonly order: readonly (readonly [string, string])[];
  readonly outcomes: Readonly<Record<string, WrittenVariable>>;
  readonly responses: Readonly<Record<string, WrittenVariable>>;
  readonly templates: Readonly<Record<string, WrittenVariable>>;
}

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
 * Give an element's unprefixed attributes by name.
 *
 * @param element The element.
 * @returns Its attributes in no namespace.
 */
const attributesOf = (element: SourceElement): Readonly<Record<string, string>> =>
  Object.fromEntries(
    element.attributes.flatMap((entry) =>
      entry.namespace === "" ? [[entry.local, entry.value] as const] : [],
    ),
  );

/**
 * Give the text of each `value` child of an element.
 *
 * @param element The element.
 * @returns Each value's text, in order.
 */
const valuesOf = (element: SourceElement): readonly string[] =>
  childrenNamed(element, "value").map((value) =>
    value.children.map((child) => (child.kind === "text" ? child.text : "")).join(""),
  );

/**
 * Read a result element's attributes and variables.
 *
 * @param element The `testResult` or `itemResult`.
 * @returns What it holds.
 */
const writtenOf = (element: SourceElement): Written => ({
  attributes: attributesOf(element),
  order: element.children.flatMap((child) =>
    child.kind === "element" && child.local.endsWith("Variable")
      ? [[child.local, attributesOf(child)["identifier"] ?? ""] as const]
      : [],
  ),
  outcomes: Object.fromEntries(
    childrenNamed(element, "outcomeVariable").map((variable) => [
      attributesOf(variable)["identifier"] ?? "",
      { attributes: attributesOf(variable), values: valuesOf(variable) },
    ]),
  ),
  responses: Object.fromEntries(
    childrenNamed(element, "responseVariable").map((variable) => [
      attributesOf(variable)["identifier"] ?? "",
      {
        attributes: attributesOf(variable),
        values: childrenNamed(variable, "candidateResponse").flatMap(valuesOf),
      },
    ]),
  ),
  templates: Object.fromEntries(
    childrenNamed(element, "templateVariable").map((variable) => [
      attributesOf(variable)["identifier"] ?? "",
      { attributes: attributesOf(variable), values: valuesOf(variable) },
    ]),
  ),
});

/**
 * A written `assessmentResult`, read back: its context, its test result and its item results.
 */
interface Report {
  readonly context: SourceElement;
  readonly items: readonly Written[];
  readonly test: Option.Option<Written>;
}

/**
 * Write a result and read it back.
 *
 * @param input The result's input.
 * @returns The document's text and what it holds.
 */
const reported = Effect.fnUntraced(function* reported(input: ResultsInput) {
  const xml = yield* Effect.fromResult(results(input));
  const source = yield* readSource("result.xml", new TextEncoder().encode(xml));
  const { root } = source;

  assert.strictEqual(root.local, "assessmentResult");
  assert.strictEqual(root.namespace, "http://www.imsglobal.org/xsd/imsqti_result_v3p0");

  const report: Report = {
    context: childrenNamed(root, "context")[0] ?? assert.fail("The result has no context."),
    items: childrenNamed(root, "itemResult").map(writtenOf),
    test: Option.fromUndefinedOr(childrenNamed(root, "testResult")[0]).pipe(Option.map(writtenOf)),
  };

  return { report, xml };
});

/**
 * Give the item result of one identifier.
 *
 * @param report The read-back result.
 * @param identifier The item ref's or the item's identifier.
 * @returns The item result.
 */
const itemOf = (report: Report, identifier: string): Written =>
  report.items.find((item) => item.attributes["identifier"] === identifier) ??
  assert.fail(`The result has no itemResult ${identifier}.`);

/**
 * Validate a written result against the cached Results XSD, failing with xmllint's lines.
 *
 * @param xml The result's text.
 */
const assertValid = Effect.fnUntraced(function* assertValid(xml: string) {
  const verdict = yield* validateAgainst(resultsXsd, xml);

  assert.isTrue(verdict.valid, verdict.messages.join("\n"));
});

/**
 * Give every element of a rendered tree, each before its descendants.
 *
 * @param nodes The nodes.
 * @returns Their elements, in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * The order `render` presents a Choice's choices in, read off the rendered Controls.
 *
 * @param accepted The item.
 * @param response The Choice's response.
 * @param token The instance it is rendered under.
 * @param record The record the item is redacted under, none for none.
 * @returns Each Control's value, in emitted order.
 */
const renderedOrder = Effect.fnUntraced(function* renderedOrder(
  accepted: Accepted,
  response: string,
  token: string,
  record?: RedactRecord,
) {
  const rendered = yield* Effect.fromResult(
    render(redact(accepted, record), yield* configure({ seed }), { instance: token }),
  );

  return elementsOf(parseHtml(rendered.html))
    .filter((element) => element.attrs["name"] === entryName(token, response))
    .map((control) => {
      const { value } = control.attrs;

      return value === undefined || value === true ? assert.fail("A Control has no value.") : value;
    });
});

/**
 * The order `render` presents an Inline Choice's choices in, read off its `select`'s Options. An
 * Option carries no `name`, so the one `select` named for the response is found instead, and its
 * Placeholder, the first Option, with the value `""`, is dropped.
 *
 * @param accepted The item.
 * @param response The Inline Choice's response.
 * @param token The instance it is rendered under.
 * @returns Each Option's value after the Placeholder, in emitted order.
 */
const renderedOptions = Effect.fnUntraced(function* renderedOptions(
  accepted: Accepted,
  response: string,
  token: string,
) {
  const rendered = yield* Effect.fromResult(
    render(redact(accepted), yield* configure({ seed }), { instance: token }),
  );
  const selects = elementsOf(parseHtml(rendered.html)).filter(
    (element) => element.tag === "select" && element.attrs["name"] === entryName(token, response),
  );
  assert.lengthOf(selects, 1);

  const [placeholder, ...options] = (selects[0]?.children ?? []).flatMap((child) =>
    child.kind === "element" && child.tag === "option" ? [child.attrs["value"]] : [],
  );
  assert.strictEqual(placeholder, "");

  return options.map((value) =>
    value === undefined || value === true ? assert.fail("An Option has no value.") : value,
  );
});

/**
 * The tag of a result's failure.
 *
 * @param input The result's input.
 * @returns The failure's `_tag`, none when the result was written.
 */
const failureTag = (input: ResultsInput): Option.Option<string> =>
  Option.map(Result.getFailure(results(input)), (failure) => failure._tag);

/**
 * The fields of a result's {@link InvalidResultContext}.
 *
 * @param input The result's input.
 * @returns The field at fault, the session entry's index and the value, none when the result
 *   was written or failed otherwise.
 */
const contextFailure = (
  input: ResultsInput,
): Option.Option<readonly [string, Option.Option<number>, string]> =>
  Option.flatMap(Result.getFailure(results(input)), (failure) =>
    failure._tag === "InvalidResultContext"
      ? Option.some([failure.field, failure.session, failure.value] as const)
      : Option.none(),
  );

/**
 * Give the session item fields of an item presented with saved responses.
 *
 * @param responses The responses saved.
 * @returns The fields that differ from a never-presented item.
 */
const saving = (responses: Responses): Partial<SessionItem> => ({
  presented: true,
  saved: Option.some(responses),
});

describe("results", () => {
  it.effect(
    "writes BG007's item result, scored, valid against the Results XSD, with no correctResponse or choiceSequence",
    () =>
      Effect.gen(function* bg007Result() {
        const accepted = yield* acceptItem(bg007, yield* readCorpusFile(bg007));
        const record = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("true") }));
        const { report, xml } = yield* reported({
          context,
          datestamp: new Date(updated),
          document: accepted,
          kind: "item",
          record,
        });

        yield* assertValid(xml);
        assert.notInclude(xml, "correctResponse");
        assert.notInclude(xml, "choiceSequence");
        assert.isTrue(Option.isNone(report.test));

        const item = itemOf(report, accepted.item.identifier);
        assert.deepStrictEqual(item.attributes, {
          datestamp: updated,
          identifier: accepted.item.identifier,
          sessionStatus: "final",
        });
        assert.deepStrictEqual(item.responses["numAttempts"]?.values, ["1"]);
        assert.deepStrictEqual(item.responses["RESPONSE"], {
          attributes: {
            answeredStatus: "answered",
            baseType: "identifier",
            cardinality: "single",
            identifier: "RESPONSE",
          },
          values: ["true"],
        });
        assert.deepStrictEqual(item.outcomes["completionStatus"]?.values, ["unknown"]);
        assert.deepStrictEqual(item.outcomes["SCORE"]?.values, ["1"]);
        assert.deepStrictEqual(attributesOf(report.context), { sourcedId: "candidate-1" });
        assert.deepStrictEqual(
          childrenNamed(report.context, "sessionIdentifier").map(attributesOf),
          [{ identifier: `s-${uuid}`, sourceID: "http://localhost:5190/" }],
        );
      }),
    { tags: ["corpus", "qti-xsd"] },
  );

  it.effect(
    "[I-9a] writes the completionStatus processing set, and the derived value where it set none, valid against the Results XSD",
    () =>
      Effect.gen(function* completionResult() {
        const accepted = yield* acceptItem(
          "items/completing.xml",
          new TextEncoder().encode(completingXml),
        );
        const written = Effect.fnUntraced(function* written(record: StoredRecord) {
          const { report, xml } = yield* reported({
            context,
            datestamp: new Date(updated),
            document: accepted,
            kind: "item",
            record,
          });
          yield* assertValid(xml);

          return itemOf(report, "completing").outcomes["completionStatus"];
        });
        const completed = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("A") }));
        const unset = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("B") }));
        const unattempted = yield* Effect.fromResult(encodeRecord(fresh(accepted.item, "")));
        const lacking: StoredRecord = {
          ...completed,
          outcomes: Object.fromEntries(
            Object.entries(completed.outcomes).filter(
              ([identifier]) => identifier !== "completionStatus",
            ),
          ),
        };

        assert.isTrue(Option.isSome(accepted.item.processing));
        assert.deepStrictEqual(yield* written(completed), {
          attributes: {
            baseType: "identifier",
            cardinality: "single",
            identifier: "completionStatus",
          },
          values: ["completed"],
        });
        assert.deepStrictEqual((yield* written(unset))?.values, ["unknown"]);
        assert.deepStrictEqual((yield* written(unattempted))?.values, ["not_attempted"]);
        assert.deepStrictEqual((yield* written(lacking))?.values, ["unknown"]);
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "writes no choiceSequence in an item result, even for a shuffled Choice",
    () =>
      Effect.gen(function* itemShuffled() {
        const accepted = yield* fixtureItem("p1-multiple-choice.xml");
        const record = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("A", "C") }),
        );
        const { xml } = yield* reported({
          context: {},
          datestamp: new Date(updated),
          document: accepted,
          kind: "item",
          record,
        });

        yield* assertValid(xml);
        assert.notInclude(xml, "choiceSequence");
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "writes a closed session over three items, one never presented and one a shuffled Choice, valid against the Results XSD",
    () =>
      Effect.gen(function* testResult() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const shuffled = yield* fixtureItem("p1-multiple-choice.xml");
        const text = yield* fixtureItem("p1-text-entry.xml");
        const test = yield* acceptTest("three", [
          totalDeclaration,
          part("P1", individual, [
            ref("one", "p1-single-choice.xml"),
            ref("two", "p1-multiple-choice.xml"),
            ref("three", "p1-text-entry.xml"),
          ]),
        ]);
        const first = sessionItem(single, "one", 1, { duration: 12.3, presented: true });
        const second = sessionItem(shuffled, "two", 2, { duration: 4, presented: true });
        const items: readonly SessionItem[] = [
          {
            ...first,
            record: yield* scored(single, first.record, { RESPONSE: identifiers("B") }),
          },
          {
            ...second,
            record: yield* scored(shuffled, second.record, { RESPONSE: identifiers("C", "A") }),
          },
          sessionItem(text, "three", 3),
        ];
        const { report, xml } = yield* reported({
          context,
          items: new Map([
            ["one", single],
            ["two", shuffled],
            ["three", text],
          ]),
          kind: "test",
          session: storedSession(test, items),
          test,
        });

        yield* assertValid(xml);
        assert.notInclude(xml, "correctResponse");

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(written.attributes, { datestamp: updated, identifier: "three" });
        assert.deepStrictEqual(written.responses["duration"], {
          attributes: { baseType: "duration", cardinality: "single", identifier: "duration" },
          values: ["123.4"],
        });
        assert.deepStrictEqual(written.outcomes["TOTAL"], {
          attributes: { baseType: "float", cardinality: "single", identifier: "TOTAL" },
          values: ["0.5"],
        });

        assert.deepStrictEqual(
          report.items.map((item) => [
            item.attributes["identifier"],
            item.attributes["sequenceIndex"],
          ]),
          [
            ["one", "1"],
            ["two", "2"],
            ["three", "3"],
          ],
        );
        assert.deepStrictEqual(itemOf(report, "one").responses["duration"], {
          attributes: { baseType: "float", cardinality: "single", identifier: "duration" },
          values: ["12.3"],
        });

        const unseen = itemOf(report, "three");
        assert.strictEqual(unseen.attributes["sessionStatus"], "initial");
        assert.strictEqual(
          unseen.responses["RESPONSE"]?.attributes["answeredStatus"],
          "notpresented",
        );

        const [interaction] = interactionsIn(shuffled.item.body);
        assert.isTrue(interaction?.kind === "choice" && interaction.shuffle);

        const order = yield* renderedOrder(shuffled, "RESPONSE", `${instance}.2`);
        assert.lengthOf(order, 4);
        assert.strictEqual(
          itemOf(report, "two").responses["RESPONSE"]?.attributes["choiceSequence"],
          order.join(" "),
        );
        assert.isUndefined(
          itemOf(report, "one").responses["RESPONSE"]?.attributes["choiceSequence"],
        );
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[Q-12] writes a shuffled Inline Choice's choiceSequence in the order render presents its Options, its fixed choice last",
    () =>
      Effect.gen(function* inlineChoiceSequence() {
        const test = yield* acceptTest("tones", [
          part("P1", individual, [ref("tones", "tones.xml")]),
        ]);
        const items: readonly SessionItem[] = [
          sessionItem(tonesItem, "tones", 1, { duration: 2, presented: true }),
        ];
        const { report, xml } = yield* reported({
          context,
          items: new Map([["tones", tonesItem]]),
          kind: "test",
          session: storedSession(test, items),
          test,
        });

        yield* assertValid(xml);

        const order = yield* renderedOptions(tonesItem, "RESPONSE", `${instance}.1`);
        assert.deepStrictEqual(order.toSorted(), ["A", "B", "C", "D", "E"]);
        assert.notDeepEqual(order, ["A", "B", "C", "D", "E"], "The seed must shuffle the order.");
        assert.strictEqual(order.at(-1), "E");
        assert.strictEqual(
          itemOf(report, "tones").responses["RESPONSE"]?.attributes["choiceSequence"],
          order.join(" "),
        );
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-5] writes a shuffled Choice's choiceSequence in the order the page renders under the record, without the choice its template hides, none for a Choice a hidden template block holds, and the template variables between the responses and the outcomes",
    () =>
      Effect.gen(function* hiddenChoice() {
        const hiding = yield* acceptItem("items/hiding.xml", new TextEncoder().encode(hidingXml));
        const test = yield* acceptTest("hiding", [
          part("P1", individual, [ref("hiding", "hiding.xml")]),
        ]);
        const token = `${instance}.1`;
        const record = yield* Effect.fromResult(
          firstAttempt(hiding.item, { instance: token, seed }),
        );
        const { report, xml } = yield* reported({
          context,
          items: new Map([["hiding", hiding]]),
          kind: "test",
          session: storedSession(test, [
            sessionItem(hiding, "hiding", 1, { duration: 2, presented: true, record }),
          ]),
          test,
        });

        yield* assertValid(xml);

        const order = yield* renderedOrder(hiding, "RESPONSE", token, record);
        assert.deepStrictEqual(order.toSorted(), ["A", "C", "D"]);
        assert.deepStrictEqual(yield* renderedOrder(hiding, "INNER", token, record), []);

        const written = itemOf(report, "hiding");
        assert.strictEqual(
          written.responses["RESPONSE"]?.attributes["choiceSequence"],
          order.join(" "),
        );
        assert.isUndefined(written.responses["INNER"]?.attributes["choiceSequence"]);
        assert.deepStrictEqual(written.templates, {
          BLOCK: { attributes: hidingTemplate("BLOCK"), values: ["Y"] },
          HIDDEN: { attributes: hidingTemplate("HIDDEN"), values: ["B"] },
        });
        assert.deepStrictEqual(written.order, [
          ["responseVariable", "numAttempts"],
          ["responseVariable", "duration"],
          ["outcomeVariable", "completionStatus"],
          ["responseVariable", "RESPONSE"],
          ["responseVariable", "INNER"],
          ["templateVariable", "HIDDEN"],
          ["templateVariable", "BLOCK"],
          ["outcomeVariable", "SCORE"],
        ]);
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-5] writes the template variables of a templated item never presented with no value, its record holding none",
    () =>
      Effect.gen(function* unseenTemplates() {
        const hiding = yield* acceptItem("items/hiding.xml", new TextEncoder().encode(hidingXml));
        const test = yield* acceptTest("unseen", [
          part("P1", individual, [ref("hiding", "hiding.xml")]),
        ]);
        const unseen = sessionItem(hiding, "hiding", 1);
        assert.strictEqual(unseen.record.seed, "");
        assert.deepStrictEqual(unseen.record.templates, {});

        const { report, xml } = yield* reported({
          context,
          items: new Map([["hiding", hiding]]),
          kind: "test",
          session: storedSession(test, [unseen]),
          test,
        });

        yield* assertValid(xml);

        const written = itemOf(report, "hiding");
        assert.strictEqual(written.attributes["sessionStatus"], "initial");
        assert.isUndefined(written.responses["RESPONSE"]?.attributes["choiceSequence"]);
        assert.deepStrictEqual(written.templates, {
          BLOCK: { attributes: hidingTemplate("BLOCK"), values: [] },
          HIDDEN: { attributes: hidingTemplate("HIDDEN"), values: [] },
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-5] writes an item delivered alone's template variables from the record begin started",
    () =>
      Effect.gen(function* itemTemplates() {
        const hiding = yield* acceptItem("items/hiding.xml", new TextEncoder().encode(hidingXml));
        const record = yield* Effect.fromResult(begin(hiding, { instance, seed }));
        const { report, xml } = yield* reported({
          context,
          datestamp: new Date(updated),
          document: hiding,
          kind: "item",
          record,
        });

        yield* assertValid(xml);
        assert.deepStrictEqual(itemOf(report, "hiding").templates, {
          BLOCK: { attributes: hidingTemplate("BLOCK"), values: ["Y"] },
          HIDDEN: { attributes: hidingTemplate("HIDDEN"), values: ["B"] },
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-5] gives the answeredStatus against the default template processing set: presented for a response left at it, in a session and alone, answered for another value",
    () =>
      Effect.gen(function* templateDefaultAnswered() {
        const defaulting = yield* acceptItem(
          "items/defaulting.xml",
          new TextEncoder().encode(defaultingXml),
        );
        const test = yield* acceptTest("defaulting", [
          part("P1", individual, [
            ref("untouched", "defaulting.xml"),
            ref("answered", "defaulting.xml"),
          ]),
        ]);
        const untouched = yield* Effect.fromResult(
          firstAttempt(defaulting.item, { instance: `${instance}.1`, seed }),
        );
        const answering = yield* Effect.fromResult(
          firstAttempt(defaulting.item, { instance: `${instance}.2`, seed }),
        );
        assert.deepStrictEqual(untouched.defaults["RESPONSE"], identifiers("B"));
        assert.deepStrictEqual(untouched.responses["RESPONSE"], identifiers("B"));

        const { report, xml } = yield* reported({
          context,
          items: new Map([
            ["untouched", defaulting],
            ["answered", defaulting],
          ]),
          kind: "test",
          session: storedSession(test, [
            sessionItem(defaulting, "untouched", 1, { presented: true, record: untouched }),
            sessionItem(defaulting, "answered", 2, {
              ...saving({ RESPONSE: identifiers("A") }),
              record: answering,
            }),
          ]),
          test,
        });

        yield* assertValid(xml);
        assert.deepStrictEqual(
          ["untouched", "answered"].map((identifier) => {
            const response = itemOf(report, identifier).responses["RESPONSE"];

            return [response?.attributes["answeredStatus"], response?.values];
          }),
          [
            ["presented", ["B"]],
            ["answered", ["A"]],
          ],
        );

        const begun = yield* Effect.fromResult(begin(defaulting, { instance, seed }));
        const aloneStatus = Effect.fnUntraced(function* aloneStatus(responses: Responses) {
          const record = yield* Effect.fromResult(score(defaulting, responses, begun));
          const written = yield* reported({
            context,
            datestamp: new Date(updated),
            document: defaulting,
            kind: "item",
            record,
          });

          return itemOf(written.report, "defaulting").responses["RESPONSE"]?.attributes[
            "answeredStatus"
          ];
        });
        assert.deepStrictEqual(
          [yield* aloneStatus({}), yield* aloneStatus({ RESPONSE: identifiers("A") })],
          ["presented", "answered"],
        );
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-5] reports the record's value, not the saved one, for a response only a template block the record hides binds, as score keeps it, and a shown response's saved value",
    () =>
      Effect.gen(function* savedHidden() {
        const hiding = yield* acceptItem("items/hiding.xml", new TextEncoder().encode(hidingXml));
        const test = yield* acceptTest("saved-hidden", [
          part("P1", individual, [ref("hiding", "hiding.xml")]),
        ]);
        const record = yield* Effect.fromResult(
          firstAttempt(hiding.item, { instance: `${instance}.1`, seed }),
        );
        const posted = { INNER: identifiers("P"), RESPONSE: identifiers("A") };
        const kept = yield* scored(hiding, record, posted);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["hiding", hiding]]),
          kind: "test",
          session: storedSession(test, [
            sessionItem(hiding, "hiding", 1, { ...saving(posted), record }),
          ]),
          test,
        });

        yield* assertValid(xml);
        assert.deepStrictEqual(kept.responses["INNER"], record.responses["INNER"]);

        const written = itemOf(report, "hiding");
        assert.deepStrictEqual(
          ["INNER", "RESPONSE"].map((identifier) => {
            const response = written.responses[identifier];

            return [response?.attributes["answeredStatus"], response?.values];
          }),
          [
            ["presented", []],
            ["answered", ["A"]],
          ],
        );
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[T-9] writes no test outcome of its own for a test whose outcome processing is marked",
    () =>
      Effect.gen(function* markedTest() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("marked", [
          scoreDeclaration,
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
          attemptsProcessing,
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["one", single]]),
          kind: "test",
          session: storedSession(test, [sessionItem(single, "one", 1)]),
          test,
        });

        yield* assertValid(xml);
        assert.strictEqual(test.test.outcomeProcessing.kind, "marked");

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(Object.keys(written.outcomes), []);
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[T-9] writes SCORE at its default for a test with no outcome processing",
    () =>
      Effect.gen(function* unprocessedTest() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("unprocessed", [
          scoreDeclaration,
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["one", single]]),
          kind: "test",
          session: storedSession(test, [sessionItem(single, "one", 1)]),
          test,
        });

        yield* assertValid(xml);
        assert.strictEqual(test.test.outcomeProcessing.kind, "absent");

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(written.outcomes["SCORE"], {
          attributes: { baseType: "float", cardinality: "single", identifier: "SCORE" },
          values: ["0.5"],
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "writes no test outcome for a test with outcome processing",
    () =>
      Effect.gen(function* processedTest() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("processed", [
          totalDeclaration,
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
          totalProcessing,
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["one", single]]),
          kind: "test",
          session: storedSession(test, [sessionItem(single, "one", 1)]),
          test,
        });

        yield* assertValid(xml);

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(Object.keys(written.outcomes), []);
        assert.deepStrictEqual(Object.keys(written.responses), ["duration"]);
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "mirrors an item outcome's six reporting attributes on its outcomeVariable, and writes none an outcome does not declare",
    () =>
      Effect.gen(function* itemReporting() {
        const accepted = yield* acceptItem(
          "items/reporting.xml",
          new TextEncoder().encode(reportingXml),
        );
        const record = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("A") }));
        const { report, xml } = yield* reported({
          context,
          datestamp: new Date(updated),
          document: accepted,
          kind: "item",
          record,
        });

        yield* assertValid(xml);

        const item = itemOf(report, "reporting");
        assert.deepStrictEqual(item.outcomes["SCORE"], {
          attributes: {
            baseType: "float",
            cardinality: "single",
            identifier: "SCORE",
            ...reportingWritten,
          },
          values: ["2"],
        });
        assert.deepStrictEqual(item.outcomes["MAXSCORE"]?.attributes, {
          baseType: "float",
          cardinality: "single",
          identifier: "MAXSCORE",
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "mirrors a test outcome's six reporting attributes on the test result's outcomeVariable",
    () =>
      Effect.gen(function* testReporting() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("reporting", [
          reportedDeclaration,
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["one", single]]),
          kind: "test",
          session: storedSession(test, [sessionItem(single, "one", 1)]),
          test,
        });

        yield* assertValid(xml);

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(written.outcomes["TOTAL"], {
          attributes: {
            baseType: "float",
            cardinality: "single",
            identifier: "TOTAL",
            ...reportingWritten,
          },
          values: ["0.5"],
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "[I-9a] writes a test's SCORE and MAXSCORE of the base types they declare, a string and an integer, which the information model types in an item only, at their defaults",
    () =>
      Effect.gen(function* untypedTestScores() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("untyped", [
          '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="string">',
          "<qti-default-value><qti-value>high</qti-value></qti-default-value>",
          "</qti-outcome-declaration>",
          '<qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="integer">',
          "<qti-default-value><qti-value>7</qti-value></qti-default-value>",
          "</qti-outcome-declaration>",
          '<qti-outcome-declaration identifier="LEVEL" cardinality="single" base-type="identifier">',
          "<qti-default-value><qti-value>gold</qti-value></qti-default-value>",
          "</qti-outcome-declaration>",
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([["one", single]]),
          kind: "test",
          session: storedSession(test, [sessionItem(single, "one", 1)]),
          test,
        });

        yield* assertValid(xml);

        const written = Option.getOrElse(report.test, () => assert.fail("No testResult."));
        assert.deepStrictEqual(written.outcomes, {
          LEVEL: {
            attributes: { baseType: "identifier", cardinality: "single", identifier: "LEVEL" },
            values: ["gold"],
          },
          MAXSCORE: {
            attributes: { baseType: "integer", cardinality: "single", identifier: "MAXSCORE" },
            values: ["7"],
          },
          SCORE: {
            attributes: { baseType: "string", cardinality: "single", identifier: "SCORE" },
            values: ["high"],
          },
        });
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect("counts the attempts started, and gives each sessionStatus and completionStatus", () =>
    Effect.gen(function* attempts() {
      const accepted = yield* fixtureItem("p2-choice.xml");
      const test = yield* acceptTest("counting", [
        part("P1", individual, [
          ref("one", "p2-choice.xml"),
          ref("two", "p2-choice.xml", "2"),
          ref("unlimited", "p2-choice.xml", "0"),
        ]),
        part("P2", simultaneous, [ref("together", "p2-choice.xml")]),
      ]);
      const items = new Map([
        ["one", accepted],
        ["two", accepted],
        ["unlimited", accepted],
        ["together", accepted],
      ]);
      const current: readonly SessionPart[] = [
        { identifier: "P1", status: "current" },
        { identifier: "P2", status: "pending" },
      ];
      const cases: readonly {
        readonly label: string;
        readonly ref: string;
        readonly changes: Partial<SessionItem>;
        readonly processed: number;
        readonly parts?: readonly SessionPart[];
        readonly expected: readonly [string, string, string];
      }[] = [
        {
          changes: {},
          expected: ["0", "initial", "not_attempted"],
          label: "never presented",
          processed: 0,
          ref: "one",
        },
        {
          changes: { presented: true },
          expected: ["1", "pendingSubmission", "unknown"],
          label: "presented and unsubmitted",
          parts: current,
          processed: 0,
          ref: "one",
        },
        {
          changes: { presented: true, saved: Option.some({ RESPONSE: identifiers("B") }) },
          expected: ["1", "pendingSubmission", "unknown"],
          label: "saved, unsubmitted, at the part's end",
          processed: 0,
          ref: "one",
        },
        {
          changes: { presented: true },
          expected: ["1", "final", "unknown"],
          label: "1 of 1 processed",
          processed: 1,
          ref: "one",
        },
        {
          changes: { presented: true },
          expected: ["2", "pendingSubmission", "unknown"],
          label: "1 of 2 processed, open",
          parts: current,
          processed: 1,
          ref: "two",
        },
        {
          changes: { presented: true },
          expected: ["2", "pendingSubmission", "unknown"],
          label: "1 of 2 processed, at the part's end",
          processed: 1,
          ref: "two",
        },
        {
          changes: { presented: true },
          expected: ["2", "final", "unknown"],
          label: "2 of 2 processed",
          processed: 2,
          ref: "two",
        },
        {
          changes: { presented: true },
          expected: ["4", "pendingSubmission", "unknown"],
          label: "3 processed with no limit",
          processed: 3,
          ref: "unlimited",
        },
        {
          changes: { presented: true },
          expected: ["1", "final", "unknown"],
          label: "a simultaneous part, submitted",
          processed: 1,
          ref: "together",
        },
        {
          changes: { presented: true },
          expected: ["1", "pendingSubmission", "unknown"],
          label: "a simultaneous part, presented",
          parts: [
            { identifier: "P1", status: "ended" },
            { identifier: "P2", status: "current" },
          ],
          processed: 0,
          ref: "together",
        },
      ];

      for (const entry of cases) {
        const base = sessionItem(accepted, entry.ref, 1, entry.changes);
        const item = { ...base, record: processedRecord(base, entry.processed) };
        const { report } = yield* reported({
          context,
          items,
          kind: "test",
          session: storedSession(test, [item], entry.parts),
          test,
        });
        const written = itemOf(report, entry.ref);

        assert.deepStrictEqual(
          [
            written.responses["numAttempts"]?.values[0],
            written.attributes["sessionStatus"],
            written.outcomes["completionStatus"]?.values[0],
          ],
          [...entry.expected],
          entry.label,
        );
      }
    }),
  );

  it.effect(
    "reports the first outcomes of an item with no limit, and the last of one limited to 2",
    () =>
      Effect.gen(function* firstOutcomes() {
        const accepted = yield* fixtureItem("p2-choice.xml");
        const test = yield* acceptTest("outcomes", [
          part("P1", individual, [
            ref("unlimited", "p2-choice.xml", "0"),
            ref("two", "p2-choice.xml", "2"),
          ]),
        ]);
        const attempted = Effect.fnUntraced(function* attempted(refId: string, index: number) {
          const base = sessionItem(accepted, refId, index, { presented: true });
          const wrong = yield* scored(accepted, base.record, { RESPONSE: identifiers("B") });
          const right = yield* scored(accepted, wrong, { RESPONSE: identifiers("A") });

          return { ...base, firstOutcomes: Option.some(wrong.outcomes), record: right };
        });
        const { report } = yield* reported({
          context,
          items: new Map([
            ["unlimited", accepted],
            ["two", accepted],
          ]),
          kind: "test",
          session: storedSession(test, [
            yield* attempted("unlimited", 1),
            yield* attempted("two", 2),
          ]),
          test,
        });

        assert.deepStrictEqual(itemOf(report, "unlimited").outcomes["SCORE"]?.values, ["0"]);
        assert.deepStrictEqual(itemOf(report, "two").outcomes["SCORE"]?.values, ["1"]);
      }),
  );

  it.effect(
    "gives each answeredStatus by Results Reporting's criteria",
    () =>
      Effect.gen(function* answered() {
        const multiple = yield* fixtureItem("p1-multiple-choice.xml");
        const single = yield* fixtureItem("p2-choice.xml");
        const defaulted = yield* acceptItem(
          "items/defaulted.xml",
          new TextEncoder().encode(defaultedXml),
        );
        const test = yield* acceptTest("answered", [
          part("P1", individual, [
            ref("unseen", "p2-choice.xml"),
            ref("blank", "p2-choice.xml"),
            ref("default", "defaulted.xml"),
            ref("over", "p1-multiple-choice.xml"),
            ref("done", "p1-multiple-choice.xml"),
          ]),
        ]);
        const { report, xml } = yield* reported({
          context,
          items: new Map([
            ["unseen", single],
            ["blank", single],
            ["default", defaulted],
            ["over", multiple],
            ["done", multiple],
          ]),
          kind: "test",
          session: storedSession(test, [
            sessionItem(single, "unseen", 1),
            sessionItem(single, "blank", 2, { presented: true }),
            sessionItem(defaulted, "default", 3, saving({ RESPONSE: identifiers("A") })),
            sessionItem(multiple, "over", 4, saving({ RESPONSE: identifiers("A", "B", "C") })),
            sessionItem(multiple, "done", 5, saving({ RESPONSE: identifiers("A", "C") })),
          ]),
          test,
        });

        yield* assertValid(xml);
        assert.deepStrictEqual(
          ["unseen", "blank", "default", "over", "done"].map(
            (identifier) =>
              itemOf(report, identifier).responses["RESPONSE"]?.attributes["answeredStatus"],
          ),
          ["notpresented", "presented", "presented", "attempted", "answered"],
        );
        assert.deepStrictEqual(itemOf(report, "over").responses["RESPONSE"]?.values, [
          "A",
          "B",
          "C",
        ]);
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "refuses a sourcedId, a session identifier or a sourceId the Results XSD refuses, and an invalid datestamp",
    () =>
      Effect.gen(function* refusedContext() {
        const accepted = yield* fixtureItem("p2-choice.xml");
        const record: StoredRecord = yield* Effect.fromResult(
          score(accepted, { RESPONSE: identifiers("A") }),
        );
        const input = (
          changes: Partial<Extract<ResultsInput, { kind: "item" }>>,
        ): ResultsInput => ({
          context,
          datestamp: new Date(updated),
          document: accepted,
          kind: "item",
          record,
          ...changes,
        });

        assert.deepStrictEqual(
          contextFailure(
            input({
              context: { sessions: [{ identifier: uuid, sourceId: "http://localhost:5190/" }] },
            }),
          ),
          Option.some(["identifier", Option.some(0), uuid] as const),
        );
        assert.deepStrictEqual(
          contextFailure(input({ context: { sourcedId: "1candidate" } })),
          Option.some(["sourcedId", Option.none(), "1candidate"] as const),
        );
        assert.deepStrictEqual(
          contextFailure(
            input({ context: { sessions: [{ identifier: "s-1", sourceId: "not a uri" }] } }),
          ),
          Option.some(["sourceId", Option.some(0), "not a uri"] as const),
        );
        assert.deepStrictEqual(
          Option.map(
            contextFailure(input({ datestamp: new Date(Number.NaN) })),
            ([field]) => field,
          ),
          Option.some("datestamp"),
        );
      }),
  );

  it.effect(
    "refuses a sourceId holding a character XML cannot carry, which URL.canParse reads",
    () =>
      Effect.gen(function* unwritableSourceId() {
        const accepted = yield* fixtureItem("p2-choice.xml");
        const record = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("A") }));

        for (const sourceId of ["\u0000http://a/", "http://a/\u0001", "http://a/\uFFFE"]) {
          assert.isTrue(URL.canParse(sourceId), JSON.stringify(sourceId));
          assert.deepStrictEqual(
            contextFailure({
              context: { sessions: [{ identifier: "s-1", sourceId }] },
              datestamp: new Date(updated),
              document: accepted,
              kind: "item",
              record,
            }),
            Option.some(["sourceId", Option.some(0), sourceId] as const),
            JSON.stringify(sourceId),
          );
        }
      }),
  );

  it.effect(
    "refuses an item's record that does not fit its declarations, a response of two values where one is declared or an outcome of another base type, as score refuses the first",
    () =>
      Effect.gen(function* misfitItemRecord() {
        const accepted = yield* fixtureItem("p2-choice.xml");
        const good = yield* Effect.fromResult(score(accepted, { RESPONSE: identifiers("A") }));
        const decoded = yield* Effect.fromResult(decodeRecord(good));
        const twoValues = yield* Effect.fromResult(
          encodeRecord({ ...decoded, responses: { RESPONSE: identifiers("A", "B") } }),
        );
        const fullScore = yield* Effect.fromResult(
          encodeRecord({ ...decoded, outcomes: { SCORE: identifiers("full") } }),
        );
        const input = (record: StoredRecord): ResultsInput => ({
          context,
          datestamp: new Date(updated),
          document: accepted,
          kind: "item",
          record,
        });

        assert.deepStrictEqual(failureTag(input(good)), Option.none());
        assert.deepStrictEqual(
          Option.map(Result.getFailure(score(accepted, {}, twoValues)), ({ _tag }) => _tag),
          Option.some("InvalidRecord"),
        );
        assert.deepStrictEqual(failureTag(input(twoValues)), Option.some("InvalidRecord"));
        assert.deepStrictEqual(failureTag(input(fullScore)), Option.some("InvalidRecord"));
      }),
  );

  it.effect("refuses a session whose item record does not fit the item's declarations", () =>
    Effect.gen(function* misfitSessionRecord() {
      const single = yield* fixtureItem("p1-single-choice.xml");
      const test = yield* acceptTest("misfit", [
        part("P1", individual, [ref("one", "p1-single-choice.xml")]),
      ]);
      const item = sessionItem(single, "one", 1, { presented: true });
      const input = (record: ItemRecord): ResultsInput => ({
        context,
        items: new Map([["one", single]]),
        kind: "test",
        session: storedSession(test, [{ ...item, record }]),
        test,
      });

      assert.deepStrictEqual(failureTag(input(item.record)), Option.none());
      assert.deepStrictEqual(
        failureTag(input({ ...item.record, responses: { RESPONSE: identifiers("A", "B") } })),
        Option.some("InvalidSession"),
      );
      assert.deepStrictEqual(
        failureTag(input({ ...item.record, outcomes: { SCORE: identifiers("full") } })),
        Option.some("InvalidSession"),
      );
    }),
  );

  it.effect(
    "refuses a session whose item holds saved responses that do not fit the item's declarations, naming that item",
    () =>
      Effect.gen(function* misfitSavedResponses() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const test = yield* acceptTest("saved", [
          part("P1", individual, [
            ref("one", "p1-single-choice.xml"),
            ref("two", "p1-single-choice.xml"),
          ]),
        ]);
        const input = (saved: Responses): ResultsInput => ({
          context,
          items: new Map([
            ["one", single],
            ["two", single],
          ]),
          kind: "test",
          session: storedSession(test, [
            sessionItem(single, "one", 1, saving({ RESPONSE: identifiers("A") })),
            sessionItem(single, "two", 2, saving(saved)),
          ]),
          test,
        });
        const misfits = {
          "a response the item does not score": { OTHER: identifiers("A") },
          "another base type": {
            RESPONSE: {
              baseType: "string",
              cardinality: "single",
              values: [{ baseType: "string", value: "A" }],
            },
          },
          "two values where one is declared": { RESPONSE: identifiers("A", "B") },
        } satisfies Readonly<Record<string, Responses>>;

        assert.deepStrictEqual(failureTag(input({ RESPONSE: identifiers("B") })), Option.none());
        for (const [name, saved] of Object.entries(misfits)) {
          const failure = Option.getOrElse(Result.getFailure(results(input(saved))), () =>
            assert.fail(`results wrote a session holding ${name}`),
          );
          assert.strictEqual(failure._tag, "InvalidSession", name);
          assert.strictEqual(
            failure._tag === "InvalidSession" ? failure.stage : "",
            "decode",
            name,
          );

          const issue = failure._tag === "InvalidSession" ? failure.issue : "";
          assert.include(issue, JSON.stringify("two"), name);
          assert.notInclude(issue, JSON.stringify("one"), name);
        }
      }),
  );

  it.effect(
    "refuses items that do not hold the session's items, and a session that does not fit its test",
    () =>
      Effect.gen(function* refusedSession() {
        const single = yield* fixtureItem("p1-single-choice.xml");
        const other = yield* fixtureItem("p2-choice.xml");
        const test = yield* acceptTest("fit", [
          part("P1", individual, [ref("one", "p1-single-choice.xml")]),
        ]);
        const input = (
          items: ReadonlyMap<string, Accepted>,
          session: StoredTestSession,
        ): ResultsInput => ({ context, items, kind: "test", session, test });
        const session = storedSession(test, [sessionItem(single, "one", 1)]);

        assert.deepStrictEqual(
          failureTag(input(new Map(), session)),
          Option.some("ResultItemMissing"),
        );
        assert.deepStrictEqual(
          failureTag(input(new Map([["one", other]]), session)),
          Option.some("RecordMismatch"),
        );
        assert.deepStrictEqual(
          failureTag(
            input(
              new Map([["one", single]]),
              storedSession(test, [sessionItem(single, "elsewhere", 1)]),
            ),
          ),
          Option.some("InvalidSession"),
        );
        assert.deepStrictEqual(
          failureTag(input(new Map([["one", single]]), { ...session, updated: "yesterday" })),
          Option.some("InvalidSession"),
        );
      }),
  );
});
