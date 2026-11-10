import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { advance, begin, configure, open, openPackage, score, startTest } from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  QtiContext,
  TestSession,
} from "#plate/index.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { integer } from "#plate/test/fixtures.ts";

/**
 * The directory of this package, which the fixture paths are relative to.
 */
const packageDirectory = fileURLToPath(new URL("../..", import.meta.url));

/**
 * The fixture package's location from {@link packageDirectory}.
 */
const fixtureLocation = "fixtures/m3f/context";

/**
 * The session instance every sitting and every item use starts with.
 */
const instance = "sitting";

/**
 * The time every sitting starts and moves at: no fixture sets a time limit.
 */
const now = new Date("2026-11-10T10:00:00.000Z");

/**
 * The context a host gives in most rows: a candidate and a test, and no environment.
 */
const hostContext: QtiContext = { candidateIdentifier: "cand-7", testIdentifier: "spring-mock" };

/**
 * Give a single string.
 *
 * @param value The string.
 * @returns It, as a single string.
 */
const string = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * The NULL single string.
 */
const nullString: Value = { baseType: "string", cardinality: "single", values: [] };

/**
 * The candidate's response `NORTH`, the item's correct one.
 */
const north: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "NORTH" }],
};

/**
 * Read every file of the fixture package, keyed by its path from the package's root.
 *
 * @returns The files.
 */
const fixtureFiles = Effect.fnUntraced(function* fixtureFiles() {
  const root = path.join(packageDirectory, fixtureLocation);
  const entries = yield* Effect.tryPromise(() =>
    readdir(root, { recursive: true, withFileTypes: true }),
  );
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(
    paths.map((file) => Effect.tryPromise(() => readFile(path.join(root, file)))),
  );

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()] as const));
});

/**
 * Open one document of the fixture package by its path from the package's root.
 *
 * @param file The document's path.
 * @returns The verdict on it.
 */
const openFixture = Effect.fnUntraced(function* openFixture(file: string) {
  const files = yield* fixtureFiles();
  const bytes = files.get(file) ?? assert.fail(`the fixture has no ${file}`);

  return yield* open(`${fixtureLocation}/${file}`, bytes);
});

/**
 * Open the fixture item, failing the test when it is not accepted.
 *
 * @returns The accepted item.
 */
const contextItem = Effect.fnUntraced(function* contextItem() {
  const verdict = yield* openFixture("items/context.xml");
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the item is ${verdict.verdict}`);
  }

  return verdict.kind === "item" ? verdict.accepted : assert.fail(`the item is a ${verdict.kind}`);
});

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open the fixture test and its item apart, as a host without a package does.
 *
 * @returns The test, its item keyed by its item ref.
 */
const openedApart = Effect.fnUntraced(function* openedApart() {
  const verdict = yield* openFixture("tests/context.xml");
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the test is ${verdict.verdict}`);
  }

  const test =
    verdict.kind === "test" ? verdict.accepted : assert.fail(`the test is a ${verdict.kind}`);

  return { items: new Map([["first", yield* contextItem()]]), test } satisfies Delivery;
});

/**
 * Open the fixture package and take its test, failing when the package is not accepted.
 *
 * @returns The package's test and its items.
 */
const openedPackage = Effect.fnUntraced(function* openedPackage() {
  const verdict = yield* openPackage(fixtureLocation, yield* fixtureFiles());
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the package is ${verdict.verdict}`);
  }

  const packaged =
    verdict.accepted.tests.get(`${fixtureLocation}/tests/context.xml`) ??
    assert.fail("the package delivers no test at tests/context.xml");

  return { items: packaged.items, test: packaged.test } satisfies Delivery;
});

/**
 * Start a sitting of a delivery under the host's context, failing the test when `startTest`
 * refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @param qtiContext The host's context.
 * @returns The session.
 */
const started = (
  delivery: Delivery,
  configuration: Configuration,
  qtiContext: QtiContext,
): TestSession =>
  Result.getOrElse(
    startTest(delivery.test, delivery.items, configuration, {
      instance,
      now,
      qtiContext,
      seed: "11",
    }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Submit the first item of a sitting with the response `NORTH`, failing the test when `advance`
 * refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The session after the submission, the test's outcome processing run.
 */
const submitted = (
  delivery: Delivery,
  configuration: Configuration,
  session: TestSession,
): TestSession =>
  Result.getOrElse(
    advance(
      delivery.test,
      delivery.items,
      session,
      { intent: { kind: "submit-item" }, responses: { RESPONSE: north } },
      configuration,
      { now },
    ),
    (failure) => assert.fail(`advance refused: ${failure.message}`),
  );

/**
 * The record of the first item of a sitting.
 *
 * @param session The session.
 * @returns The record.
 */
const firstRecord = (session: TestSession): ItemRecord =>
  session.items[0]?.record ?? assert.fail("the session holds no item");

/**
 * Begin the fixture item under a context, then decode the record `begin` stored.
 *
 * @param accepted The item.
 * @param qtiContext The host's context.
 * @returns The decoded record.
 */
const begun = (accepted: Accepted, qtiContext: QtiContext): ItemRecord => {
  const stored = Result.getOrElse(begin(accepted, { instance, qtiContext, seed: "7" }), (failure) =>
    assert.fail(`begin failed: ${failure.message}`),
  );

  return Result.getOrElse(decodeRecord(stored), (failure) =>
    assert.fail(`the stored record does not decode: ${failure.message}`),
  );
};

describe("context declarations", () => {
  it.effect("[I-15] an item holding a qti-context-declaration opens accepted, with no mark", () =>
    Effect.gen(function* opensAccepted() {
      const verdict = yield* openFixture("items/context.xml");

      assert.strictEqual(verdict.verdict, "accepted");
    }),
  );

  it.effect(
    "[I-15] template processing reads QTI_CONTEXT.candidateIdentifier as the host gave it",
    () =>
      Effect.gen(function* readsCandidate() {
        const record = begun(yield* contextItem(), hostContext);

        assert.deepStrictEqual(record.templates["CANDIDATE"], string("cand-7"));
      }),
  );

  it.effect("[I-15] a QTI_CONTEXT field the host omits reads NULL, and processing still runs", () =>
    Effect.gen(function* omittedField() {
      const record = begun(yield* contextItem(), hostContext);

      assert.deepStrictEqual(
        [record.templates["ENVIRONMENT"], record.templates["CANDIDATE"]],
        [nullString, string("cand-7")],
      );
    }),
  );

  it.effect("[I-15] a declared context variable reads its default", () =>
    Effect.gen(function* declaredDefault() {
      const record = begun(yield* contextItem(), {});

      assert.deepStrictEqual(record.templates["SEAT"], integer(12n));
    }),
  );

  it.effect("[I-15] response processing reads QTI_CONTEXT.testIdentifier", () =>
    Effect.gen(function* responseReads() {
      const accepted = yield* contextItem();
      const stored = Result.getOrElse(
        begin(accepted, { instance, qtiContext: hostContext, seed: "7" }),
        (failure) => assert.fail(`begin failed: ${failure.message}`),
      );
      const scored = Result.getOrElse(score(accepted, { RESPONSE: north }, stored), (failure) =>
        assert.fail(`score failed: ${failure.message}`),
      );
      const record = Result.getOrElse(decodeRecord(scored), (failure) =>
        assert.fail(`the scored record does not decode: ${failure.message}`),
      );

      assert.deepStrictEqual(record.outcomes["SITTING"], string("spring-mock"));
    }),
  );

  it.effect("[I-15] a test's outcome processing reads a test-level context declaration", () =>
    Effect.gen(function* testLevel() {
      const delivery = yield* openedApart();
      const configuration = yield* configure({ seed: "3" });
      const session = submitted(
        delivery,
        configuration,
        started(delivery, configuration, hostContext),
      );

      assert.deepStrictEqual(session.outcomes["VENUE"], string("harbour"));
    }),
  );

  it.effect(
    "[I-15] a test's processing reads an item's context variable through its item ref",
    () =>
      Effect.gen(function* throughItemRef() {
        const delivery = yield* openedPackage();
        const configuration = yield* configure({ seed: "3" });
        const session = submitted(
          delivery,
          configuration,
          started(delivery, configuration, hostContext),
        );

        assert.deepStrictEqual(session.outcomes["ROOMS"], integer(12n));
      }),
  );

  it.effect(
    "[I-15] QTI_CONTEXT is resolved before template processing of the first presented item",
    () =>
      Effect.gen(function* firstPresented() {
        const delivery = yield* openedApart();
        const configuration = yield* configure({ seed: "3" });
        const session = started(delivery, configuration, hostContext);

        assert.deepStrictEqual(
          [session.items[0]?.presented, firstRecord(session).templates["CANDIDATE"]],
          [true, string("cand-7")],
        );
      }),
  );
});
