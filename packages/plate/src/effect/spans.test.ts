import { assert, describe, it } from "@effect/vitest";
import {
  Cause,
  Effect,
  Exit,
  Formatter,
  Layer,
  Logger,
  Option,
  Predicate,
  References,
  Tracer,
} from "effect";
import { SecureRandom } from "effect/crypto";
import { TestClock } from "effect/testing";
import type { StoredRecord } from "#plate/codec/record.ts";
import type { StoredTestSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import { Configuration } from "#plate/effect/configuration.ts";
import {
  checkResponses,
  decodeRedacted,
  decodeSession,
  encodeRedacted,
  encodeSession,
  redact,
  render,
  renderStatus,
  restore,
  score,
} from "#plate/effect/operations.ts";
import { Randomness } from "#plate/effect/randomness.ts";
import { advance, begin, results, startTest } from "#plate/effect/session.ts";
import type { Value } from "#plate/model/values.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The seed the host gives `begin`.
 */
const hostItemSeed = "SeedSecretS1";

/**
 * The processing seed the host gives `startTest`.
 */
const hostTestSeed = "SeedSecretS2";

/**
 * The value the item's responses carry, posted to `score`, stored in its record and shown by
 * `render`.
 */
const itemValue = "ValueSecretV1";

/**
 * The value the test session's steps carry, saved in the session and stored with it.
 */
const stepValue = "ValueSecretV2";

/**
 * The template value template processing sets `W` to.
 */
const templateValue = "TemplateSecretW";

/**
 * The correct response template processing sets for `TEXT`.
 */
const correctValue = "CorrectSecretC";

/**
 * The default template processing sets for `TEXT`.
 */
const defaultValue = "DefaultSecretD";

/**
 * The default value of the outcome `NOTE`, which every record holds.
 */
const outcomeValue = "OutcomeSecretN";

/**
 * The span every case wraps the operations in: the host's own request.
 */
const callerSpan = "host.request";

/**
 * The test's identifier.
 */
const testIdentifier = "spanned";

/**
 * A test `Randomness` over a fixed byte source: each call returns a fresh array whose byte at index
 * `n` is `n`, so every draw of the same size gives the same bytes.
 */
const countingBytes = SecureRandom.make((size) =>
  Uint8Array.from({ length: size }, (_, index) => index % 0x1_00),
);

/**
 * Write the text of a hand-built templated item: a Choice over `A`, `B` and `C` bound to the
 * single identifier `RESPONSE`, a text entry bound to the single string `TEXT` and one bound to
 * the single integer `COUNT`, an outcome `NOTE` with a default, and template processing that draws
 * the integer `T` from the seed and sets the string `W`, the correct response of `TEXT` and its
 * default.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
    '<qti-response-declaration identifier="TEXT" cardinality="single" base-type="string"/>',
    '<qti-response-declaration identifier="COUNT" cardinality="single" base-type="integer"/>',
    `<qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="string"><qti-default-value><qti-value>${outcomeValue}</qti-value></qti-default-value></qti-outcome-declaration>`,
    '<qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
    '<qti-template-declaration identifier="W" cardinality="single" base-type="string"/>',
    "<qti-template-processing>",
    '<qti-set-template-value identifier="T"><qti-random-integer min="1000000" max="999999999"/></qti-set-template-value>',
    `<qti-set-template-value identifier="W"><qti-base-value base-type="string">${templateValue}</qti-base-value></qti-set-template-value>`,
    `<qti-set-correct-response identifier="TEXT"><qti-base-value base-type="string">${correctValue}</qti-base-value></qti-set-correct-response>`,
    `<qti-set-default-value identifier="TEXT"><qti-base-value base-type="string">${defaultValue}</qti-base-value></qti-set-default-value>`,
    "</qti-template-processing><qti-item-body>",
    '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction>",
    '<p>Name <qti-text-entry-interaction response-identifier="TEXT"/> and count <qti-text-entry-interaction response-identifier="COUNT"/>.</p>',
    "</qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * The text of a hand-built test: one nonlinear, individual part with one section that holds the
 * item refs `first` and `second`, each ref's `href` its identifier with `.xml`.
 */
const testXml = [
  `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${testIdentifier}" title="${testIdentifier}">`,
  '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
  '<qti-assessment-section identifier="section" title="Section" visible="true">',
  ...["first", "second"].map(
    (ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`,
  ),
  "</qti-assessment-section></qti-test-part></qti-assessment-test>",
].join("");

/**
 * A single string value.
 *
 * @param text The string.
 * @returns The value.
 */
const singleString = (text: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value: text }],
});

/**
 * Open a hand-built item and require it accepted.
 *
 * @param identifier The item's identifier, which also names its file under `tests/`.
 * @returns The accepted item.
 */
const openedItem = Effect.fnUntraced(function* openedItem(identifier: string) {
  const location = `tests/${identifier}.xml`;
  const verdict = yield* open(location, new TextEncoder().encode(itemXml(identifier)));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Open the hand-built test over its two items, `first` and `second`, each beside it under
 * `tests/`.
 *
 * @returns The accepted test and its items, keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery() {
  const location = `tests/${testIdentifier}.xml`;
  const verdict = yield* open(location, new TextEncoder().encode(testXml));
  const test: AcceptedTest =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`${location} is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>([
    ["first", yield* openedItem("first")],
    ["second", yield* openedItem("second")],
  ]);

  return { items, test };
});

/**
 * Copy a stored session, dropping the base type of the `TEXT` response its first item saved, a
 * value the session codec refuses as missing its base type.
 *
 * @param stored The stored session, whose first item saved a `TEXT` value.
 * @returns The copy, which is no longer a stored session.
 */
const withoutSavedBaseType = (stored: StoredTestSession) => {
  const saved = stored.items[0]?.saved?.["TEXT"];
  const unbased =
    saved !== undefined && saved.cardinality !== "record"
      ? { cardinality: saved.cardinality, values: saved.values }
      : assert.fail("the session's first item saved no TEXT value");

  return {
    ...stored,
    items: stored.items.map((entry, index) =>
      index === 0 ? { ...entry, saved: { ...entry.saved, TEXT: unbased } } : entry,
    ),
  };
};

/**
 * Give the integer template value `T` a stored record holds, as its decimal digits.
 *
 * @param record The stored record.
 * @returns The digits.
 */
const drawnTemplate = (record: StoredRecord): string => {
  const single = record.templates["T"]?.values[0];

  return single === undefined ? assert.fail("the record holds no T") : String(single.value);
};

/**
 * One log a recording `Logger` kept: its message's parts joined by spaces, and the annotations in
 * force when it was made, each written as a string.
 */
interface RecordedLog {
  readonly annotations: Readonly<Record<string, string>>;
  readonly message: string;
}

/**
 * Give the name of a span's parent, `none` for a root span.
 *
 * @param span The span.
 * @returns The parent's name.
 */
const parentName = (span: Tracer.Span): string =>
  Option.match(span.parent, {
    onNone: () => "none",
    onSome: (parent) => (parent._tag === "Span" ? parent.name : "external"),
  });

/**
 * Give the cause a span's exit records, none while it runs or when it succeeded.
 *
 * @param span The span.
 * @returns The cause of its failure.
 */
const failureOf = (span: Tracer.Span): Option.Option<Cause.Cause<unknown>> =>
  span.status._tag === "Ended" && Exit.isFailure(span.status.exit)
    ? Option.some(span.status.exit.cause)
    : Option.none();

/**
 * Give the tag of the failure a span's exit records, none when it succeeded.
 *
 * @param span The span.
 * @returns The failure's tag.
 */
const failureTag = (span: Tracer.Span): Option.Option<string> =>
  Option.flatMap(failureOf(span), (cause) =>
    Option.flatMap(Cause.findErrorOption(cause), (failure) =>
      Predicate.hasProperty(failure, "_tag") && Predicate.isString(failure._tag)
        ? Option.some(failure._tag)
        : Option.none(),
    ),
  );

/**
 * Write what a span's failed exit records as text, as an exporter would see it: the cause as
 * Effect prints it, the failure's fields and its message; none when the span succeeded.
 *
 * @param span The span.
 * @returns The text.
 */
const failureText = (span: Tracer.Span): Option.Option<string> =>
  Option.map(failureOf(span), (cause) =>
    [
      Cause.pretty(cause),
      ...Option.match(Cause.findErrorOption(cause), {
        onNone: () => [],
        onSome: (failure) => [
          Formatter.format(failure, { ignoreToString: true }),
          failure instanceof Error ? failure.message : "",
        ],
      }),
    ].join("\n"),
  );

/**
 * The spans of the operations this module's table names, the ones each case reads.
 */
const tracedNames = new Set([
  "plate.advance",
  "plate.begin",
  "plate.checkResponses",
  "plate.decodeRedacted",
  "plate.decodeSession",
  "plate.encodeRedacted",
  "plate.encodeSession",
  "plate.redact",
  "plate.render",
  "plate.renderStatus",
  "plate.restore",
  "plate.results",
  "plate.score",
  "plate.startTest",
]);

/**
 * Run each traced `./effect` operation once under a recording `Tracer` and a recording `Logger`
 * at the debug level, inside the host's own span, with the host's secrets in its seeds and values,
 * including two failures built from host input: a step whose response holds a value of the wrong
 * base type, and a stored session whose saved response lost its base type.
 *
 * @returns The spans and logs recorded, and every secret the operations were given or drew.
 */
const recorded = Effect.fnUntraced(function* recorded() {
  const { items, test } = yield* delivery();
  const document = items.get("first") ?? assert.fail("the test has no item first");
  const configuration = yield* configure({});
  yield* TestClock.setTime(Date.parse("2026-11-05T10:00:00.000Z"));

  const spans: Tracer.NativeSpan[] = [];
  const logs: RecordedLog[] = [];
  const tracer = Tracer.make({
    span: (options) => {
      const span = new Tracer.NativeSpan(options);
      spans.push(span);

      return span;
    },
  });
  const logger = Logger.make(({ fiber, message }) => {
    logs.push({
      annotations: Object.fromEntries(
        Object.entries(fiber.getRef(References.CurrentLogAnnotations)).map(([key, value]) => [
          key,
          String(value),
        ]),
      ),
      message: Array.isArray(message) ? message.map(String).join(" ") : String(message),
    });
  });

  const program = Effect.gen(function* operations() {
    const seeded = yield* begin(document, { instance: "q1", seed: hostItemSeed });
    const drawn = yield* begin(document, { instance: "q1" });
    const scored = yield* score(document, { TEXT: singleString(itemValue) }, seeded);
    yield* Effect.flip(
      score(
        document,
        {
          RESPONSE: {
            baseType: "identifier",
            cardinality: "single",
            values: [{ baseType: "identifier", value: itemValue }],
          },
        },
        seeded,
      ),
    );

    const restored = yield* restore(document, scored);
    const redacted = yield* redact(document, restored.record);
    const rendered = yield* render(redacted, { values: { TEXT: singleString(itemValue) } });
    yield* renderStatus({ heading: "scored", instance: rendered.instance });
    yield* checkResponses(document, { TEXT: singleString(itemValue) }, restored.record);

    const json = yield* encodeRedacted(redacted);
    yield* decodeRedacted(json);
    yield* results({ context: {}, document, kind: "item", record: scored });

    const session = yield* startTest(test, items, { instance: "sitting", seed: hostTestSeed });
    const drawnSession = yield* startTest(test, items, { instance: "sitting" });
    const moved = yield* advance(test, items, session, {
      intent: { kind: "next" },
      responses: { TEXT: singleString(stepValue) },
    });
    yield* Effect.flip(
      advance(test, items, moved, {
        intent: { kind: "next" },
        responses: { COUNT: singleString(stepValue) },
      }),
    );

    const stored = yield* encodeSession(moved);
    assert.deepStrictEqual(stored.items[0]?.saved?.["TEXT"], {
      baseType: "string",
      cardinality: "single",
      values: [{ baseType: "string", value: stepValue }],
    });
    yield* decodeSession(stored, test);
    yield* Effect.flip(decodeSession(withoutSavedBaseType(stored), test));
    yield* results({ context: {}, items, kind: "test", session: stored, test });

    return [drawn.seed, drawnSession.seed, drawnTemplate(seeded), drawnTemplate(drawn)];
  }).pipe(
    Effect.withSpan(callerSpan),
    Effect.provide(Layer.succeed(Configuration, configuration)),
    Effect.provideService(Randomness, countingBytes),
    Effect.provide(Logger.layer([logger, Logger.tracerLogger])),
    Effect.provideService(References.MinimumLogLevel, "Debug"),
    Effect.withTracer(tracer),
  );
  const drawnSecrets = yield* program;

  return {
    logs,
    secrets: [
      hostItemSeed,
      hostTestSeed,
      itemValue,
      stepValue,
      templateValue,
      correctValue,
      defaultValue,
      outcomeValue,
      ...drawnSecrets,
    ],
    spans,
  };
});

describe("the ./effect operations' spans and logs", () => {
  it.effect(
    "no secret in telemetry: each operation's span carries the table's name and attributes, under its caller's span",
    () =>
      Effect.gen(function* tableSpans() {
        const { spans } = yield* recorded();
        const traced = spans
          .filter((span) => tracedNames.has(span.name))
          .map((span) => ({
            attributes: Object.fromEntries(span.attributes),
            name: span.name,
            parent: parentName(span),
          }));
        const item = { "item.identifier": "first" };
        const ofTest = { "test.identifier": testIdentifier };

        assert.deepStrictEqual(
          traced,
          [
            { attributes: item, name: "plate.begin" },
            { attributes: item, name: "plate.begin" },
            { attributes: { ...item, "responses.count": 1 }, name: "plate.score" },
            { attributes: { ...item, "responses.count": 1 }, name: "plate.score" },
            { attributes: item, name: "plate.restore" },
            { attributes: item, name: "plate.redact" },
            { attributes: { ...item, "render.mode": "answering" }, name: "plate.render" },
            { attributes: { "status.heading": "scored" }, name: "plate.renderStatus" },
            { attributes: { ...item, "messages.count": 0 }, name: "plate.checkResponses" },
            { attributes: item, name: "plate.encodeRedacted" },
            { attributes: item, name: "plate.decodeRedacted" },
            { attributes: { ...item, "results.kind": "item" }, name: "plate.results" },
            { attributes: { ...ofTest, "items.count": 2 }, name: "plate.startTest" },
            { attributes: { ...ofTest, "items.count": 2 }, name: "plate.startTest" },
            { attributes: { ...ofTest, "intent.kind": "next" }, name: "plate.advance" },
            { attributes: { ...ofTest, "intent.kind": "next" }, name: "plate.advance" },
            { attributes: ofTest, name: "plate.encodeSession" },
            { attributes: ofTest, name: "plate.decodeSession" },
            { attributes: ofTest, name: "plate.decodeSession" },
            { attributes: { ...ofTest, "results.kind": "test" }, name: "plate.results" },
          ].map((expected) => ({ ...expected, parent: callerSpan })),
        );
      }),
  );

  it.effect(
    "no secret in telemetry: a failure built from host input fails its span by tag, StepResponseMisfit and InvalidSession",
    () =>
      Effect.gen(function* failedSpans() {
        const { spans } = yield* recorded();
        const failed = spans.flatMap((span) =>
          tracedNames.has(span.name)
            ? Option.match(failureTag(span), {
                onNone: () => [],
                onSome: (tag) => [{ name: span.name, tag }],
              })
            : [],
        );

        assert.deepStrictEqual(failed, [
          { name: "plate.score", tag: "ResponsesRefused" },
          { name: "plate.advance", tag: "StepResponseMisfit" },
          { name: "plate.decodeSession", tag: "InvalidSession" },
        ]);
      }),
  );

  it.effect(
    "no secret in telemetry: no attribute, log message, log annotation or recorded failure holds a seed, a response value or a record value",
    () =>
      Effect.gen(function* noSecret() {
        const { logs, secrets, spans } = yield* recorded();
        const written = [
          ...spans.flatMap((span) => [
            { text: span.name, where: `the span ${span.name}` },
            ...[...span.attributes].map(([key, value]) => ({
              text: `${key} ${String(value)}`,
              where: `${span.name}'s attribute ${key}`,
            })),
            ...span.events.map(([name, , attributes]) => ({
              text: `${name} ${Formatter.format(attributes)}`,
              where: `${span.name}'s event ${name}`,
            })),
            ...Option.match(failureText(span), {
              onNone: () => [],
              onSome: (text) => [{ text, where: `${span.name}'s recorded failure` }],
            }),
          ]),
          ...logs.map((log) => ({
            text: `${log.message} ${Formatter.format(log.annotations)}`,
            where: `the log ${log.message}`,
          })),
        ];

        assert.isAbove(written.length, 0);
        for (const { text, where } of written) {
          for (const secret of secrets) {
            assert.notInclude(text, secret, `${where} holds a secret`);
          }
        }
      }),
  );

  it.effect(
    "no secret in telemetry: a drawn seed is logged with seed.source and no seed, as is a drawn instance and a datestamp from the Clock",
    () =>
      Effect.gen(function* decisionLogs() {
        const { logs, spans } = yield* recorded();
        const item = { "item.identifier": "first" };
        const drawnSeed = { "seed.source": "drawn" };

        assert.deepStrictEqual(logs, [
          { annotations: { ...item, ...drawnSeed }, message: "a seed was drawn" },
          { annotations: item, message: "an instance was drawn" },
          { annotations: item, message: "the datestamp came from the Clock" },
          {
            annotations: { "test.identifier": testIdentifier, ...drawnSeed },
            message: "a seed was drawn",
          },
        ]);
        assert.deepStrictEqual(
          spans.flatMap((span) => span.events.map(([name]) => ({ event: name, span: span.name }))),
          [
            { event: "a seed was drawn", span: "plate.begin" },
            { event: "an instance was drawn", span: "plate.render" },
            { event: "the datestamp came from the Clock", span: "plate.results" },
            { event: "a seed was drawn", span: "plate.startTest" },
          ],
        );
      }),
  );
});
