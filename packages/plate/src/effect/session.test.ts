import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Option, Result } from "effect";
import { SecureRandom } from "effect/crypto";
import { TestClock } from "effect/testing";
import { begin as plainBegin } from "#plate/begin.ts";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration as PlainConfiguration } from "#plate/configuration.ts";
import { Configuration } from "#plate/effect/configuration.ts";
import { Randomness } from "#plate/effect/randomness.ts";
import { advance, begin, results, startTest } from "#plate/effect/session.ts";
import { results as plainResults } from "#plate/results/results.ts";
import { startTest as plainStartTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The time each case sets the test clock to before the session starts.
 */
const startedAt = Date.parse("2026-11-05T10:00:00.000Z");

/**
 * The session instance every case starts with.
 */
const instance = "sitting";

/**
 * The seed a test `Randomness` over {@link countingBytes} draws: bytes 0x00 to 0x0f as hex.
 */
const countedSeed = "000102030405060708090a0b0c0d0e0f";

/**
 * A test `Randomness` over a fixed byte source: each call returns a fresh array whose byte at index
 * `n` is `n`, so every draw of the same size gives the same bytes.
 */
const countingBytes = SecureRandom.make((size) =>
  Uint8Array.from({ length: size }, (_, index) => index % 0x1_00),
);

/**
 * A test `Randomness` that fails the case the moment anything draws from it.
 */
const forbiddenBytes = SecureRandom.make(() =>
  assert.fail("a seed was drawn although the host gave one"),
);

/**
 * Write the text of a hand-built templated item: one Choice over `A`, `B` and `C` bound to the
 * single identifier `RESPONSE`, and template processing that draws the single integer template
 * variable `T` from 1 to 10^9, so the record differs from seed to seed.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const templatedXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
    "<qti-template-processing>",
    '<qti-set-template-value identifier="T"><qti-random-integer min="1" max="1000000000"/></qti-set-template-value>',
    '</qti-template-processing><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="false">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test: one nonlinear, individual part with one section that holds
 * each item ref, each ref's `href` its identifier with `.xml`.
 *
 * @param refs Each item ref's identifier, in document order.
 * @returns The test's text.
 */
const testXml = (refs: readonly string[]): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="clocked" title="clocked">',
    '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
    '<qti-assessment-section identifier="section" title="Section" visible="true">',
    ...refs.map((ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`),
    "</qti-assessment-section></qti-test-part></qti-assessment-test>",
  ].join("");

/**
 * Open a hand-built item and require it accepted.
 *
 * @param identifier The item's identifier, which also names its file under `tests/`.
 * @returns The accepted item.
 */
const openedItem = Effect.fnUntraced(function* openedItem(identifier: string) {
  const location = `tests/${identifier}.xml`;
  const verdict = yield* open(location, new TextEncoder().encode(templatedXml(identifier)));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Open the hand-built test over two templated items, `first` and `second`, each beside it under
 * `tests/`.
 *
 * @returns The accepted test and its items, keyed by item ref.
 */
const delivery = Effect.fnUntraced(function* delivery() {
  const location = "tests/clocked.xml";
  const verdict = yield* open(location, new TextEncoder().encode(testXml(["first", "second"])));
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
 * Provide a configuration as the {@link Configuration} service, with `Layer.succeed`.
 *
 * @param configuration The configuration the mirrors read.
 * @returns A function that provides it to a program.
 */
const configured = (configuration: PlainConfiguration) =>
  Effect.provide(Layer.succeed(Configuration, configuration));

describe("the session mirrors", () => {
  it.effect(
    "startTest's session starts at the time from Clock, and advance records the later time from Clock after TestClock.adjust",
    () =>
      Effect.gen(function* clockedTransitions() {
        const { items, test } = yield* delivery();
        yield* TestClock.setTime(startedAt);

        const session = yield* startTest(test, items, { instance, seed: "7" }).pipe(
          configured(yield* configure({})),
        );

        assert.strictEqual(session.started, "2026-11-05T10:00:00.000Z");
        assert.strictEqual(session.updated, "2026-11-05T10:00:00.000Z");

        yield* TestClock.adjust("90 seconds");

        const moved = yield* advance(test, items, session, { intent: { kind: "next" } }).pipe(
          configured(yield* configure({})),
        );

        assert.strictEqual(moved.position, 1);
        assert.strictEqual(moved.started, "2026-11-05T10:00:00.000Z");
        assert.strictEqual(moved.updated, "2026-11-05T10:01:30.000Z");
      }),
  );

  it.effect(
    "results with no item datestamp writes the time from Clock, and one with a datestamp writes that",
    () =>
      Effect.gen(function* clockedResults() {
        const document = yield* openedItem("first");
        const record = yield* begin(document, { instance: "q1", seed: "7" });
        yield* TestClock.setTime(startedAt);

        const given = new Date("2026-01-02T03:04:05.000Z");
        const clocked = yield* results({ context: {}, document, kind: "item", record });
        const dated = yield* results({
          context: {},
          datestamp: given,
          document,
          kind: "item",
          record,
        });

        assert.include(clocked, 'datestamp="2026-11-05T10:00:00.000Z"');
        assert.deepStrictEqual(
          Result.succeed(clocked),
          plainResults({
            context: {},
            datestamp: new Date(startedAt),
            document,
            kind: "item",
            record,
          }),
        );
        assert.include(dated, 'datestamp="2026-01-02T03:04:05.000Z"');
        assert.deepStrictEqual(
          Result.succeed(dated),
          plainResults({ context: {}, datestamp: given, document, kind: "item", record }),
        );
      }),
  );

  it.effect(
    "begin and startTest under a test Randomness and the time from Clock equal the plain functions given the seed its bytes make",
    () =>
      Effect.gen(function* drawnSeeds() {
        const { items, test } = yield* delivery();
        const document = yield* openedItem("first");
        const configuration = yield* configure({ seed: "shuffle-key" });
        yield* TestClock.setTime(startedAt);

        const record = yield* begin(document, { instance: "q1" }).pipe(
          Effect.provideService(Randomness, countingBytes),
        );
        const session = yield* startTest(test, items, { instance }).pipe(
          configured(configuration),
          Effect.provideService(Randomness, countingBytes),
        );

        assert.deepStrictEqual(
          Result.succeed(record),
          plainBegin(document, { instance: "q1", seed: countedSeed }),
        );
        assert.strictEqual(session.seed, countedSeed);
        assert.deepStrictEqual(
          encodeSession(session),
          Result.flatMap(
            plainStartTest(test, items, configuration, {
              instance,
              now: new Date(startedAt),
              seed: countedSeed,
            }),
            encodeSession,
          ),
        );
      }),
  );

  it.effect(
    "with a host seed, begin and startTest under the time from Clock draw nothing and equal the plain functions",
    () =>
      Effect.gen(function* hostSeeds() {
        const { items, test } = yield* delivery();
        const document = yield* openedItem("first");
        const configuration = yield* configure({});
        yield* TestClock.setTime(startedAt);

        const withoutDraws = Effect.provideService(Randomness, forbiddenBytes);
        const seeded = yield* begin(document, { instance: "q1", seed: "7" }).pipe(withoutDraws);
        const empty = yield* begin(document, { instance: "q1", seed: "" }).pipe(withoutDraws);
        const session = yield* startTest(test, items, { instance, seed: "7" }).pipe(
          configured(configuration),
          withoutDraws,
        );

        assert.deepStrictEqual(
          Result.succeed(seeded),
          plainBegin(document, { instance: "q1", seed: "7" }),
        );
        assert.deepStrictEqual(
          Result.succeed(empty),
          plainBegin(document, { instance: "q1", seed: "" }),
        );
        assert.strictEqual(session.seed, "7");
        assert.deepStrictEqual(
          encodeSession(session),
          Result.flatMap(
            plainStartTest(test, items, configuration, {
              instance,
              now: new Date(startedAt),
              seed: "7",
            }),
            encodeSession,
          ),
        );
      }),
  );

  it.effect(
    "a mirror's failure under the time from Clock is the plain function's, by tag: startTest for items that lack an item ref is TestNotDeliverable",
    () =>
      Effect.gen(function* undeliverable() {
        const { test } = yield* delivery();
        const configuration = yield* configure({});
        const refused = yield* Effect.flip(
          startTest(test, new Map(), { instance, seed: "7" }).pipe(configured(configuration)),
        );
        const plain = plainStartTest(test, new Map(), configuration, {
          instance,
          now: new Date(startedAt),
          seed: "7",
        });
        const expected = Result.isFailure(plain)
          ? plain.failure
          : assert.fail("the plain startTest delivered a test whose items lack its item refs");

        assert.strictEqual(refused._tag, "TestNotDeliverable");
        assert.strictEqual(refused._tag, expected._tag);
        assert.deepStrictEqual(Object.entries(refused), Object.entries(expected));
      }),
  );
});
