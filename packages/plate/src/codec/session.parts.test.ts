import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  advance,
  configure,
  decodeSession,
  encodeSession,
  openPackage,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Intent,
  InvalidSession,
  PackageVerdict,
  Responses,
  SessionMismatch,
  StoredTestSession,
  TestSession,
} from "#plate/index.ts";

/**
 * The fixture package's directory, which is also the location `openPackage` is given, so each
 * document's location is `fixtures/m3f/section-parts/<path>`.
 */
const location = "fixtures/m3f/section-parts";

/**
 * The fixture package's directory on disk.
 */
const fixtureDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "m3f",
  "section-parts",
);

/**
 * The path of the fixture's test document inside the package, which places `sections/shared.xml`
 * once in each of its two parts.
 */
const testPath = "tests/test.xml";

/**
 * The session instance every sitting starts with.
 */
const instance = "sitting";

/**
 * The time every sitting starts its session at.
 */
const startedAt = new Date("2026-11-10T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * The responses every step posts: the choice `A`, the correct response of every fixture item.
 */
const answer: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * The item refs a session over the fixture package delivers, in sequence: part `P1`'s own item and
 * the placed document's item, then part `P2`'s own item and the placed document's item again.
 */
const placedSequence = ["first", "shared-item", "second", "shared-item"] as const;

/**
 * Read every file under a directory, keyed by its path from the directory with `/` separators, as
 * a host unzips a package.
 *
 * @param root The directory.
 * @returns The files.
 */
const filesOf = Effect.fnUntraced(function* filesOf(root: string) {
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
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Take the fixture's test from an accepting package verdict; the test fails when the package does
 * not accept or holds no test at the fixture's path.
 *
 * @param verdict The package verdict.
 * @returns The test with its items.
 */
const packageTestOf = (verdict: PackageVerdict): Delivery => {
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the package is ${verdict.verdict}, not accepted`);
  }

  return (
    verdict.accepted.tests.get(`${location}/${testPath}`) ??
    assert.fail(`the package delivers no test at ${testPath}`)
  );
};

/**
 * Open the fixture package, read from disk.
 *
 * @returns The verdict on the package.
 */
const openedFixture = Effect.fnUntraced(function* openedFixture() {
  return yield* openPackage(location, yield* filesOf(fixtureDirectory));
});

/**
 * Open the fixture package, read from disk, and take its test.
 *
 * @returns The test that places `sections/shared.xml` in each of its two parts, with its items.
 */
const placedInTwoParts = Effect.fnUntraced(function* placedInTwoParts() {
  return packageTestOf(yield* openedFixture());
});

/**
 * Start a session of a delivery under a processing seed, failing the test when `startTest`
 * refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param seed The processing seed.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration, seed: string): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now: startedAt, seed }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Advance a session with an intent and {@link answer}, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after {@link startedAt}.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  seconds: number,
): TestSession =>
  Result.getOrElse(
    advance(given.test, given.items, session, { intent, responses: answer }, configuration, {
      now: after(seconds),
    }),
    (failure) => assert.fail(`advance refused ${intent.kind}: ${failure.message}`),
  );

/**
 * Write a session in the form a host stores, failing the test when `encodeSession` refuses.
 *
 * @param session The session.
 * @returns The stored session.
 */
const storedOf = (session: TestSession): StoredTestSession =>
  Result.getOrElse(encodeSession(session), (failure) =>
    assert.fail(`encodeSession refused: ${failure.message}`),
  );

/**
 * Pass a stored form through a host and decode it against a test: write it as JSON text, read the
 * text back and decode what the host hands back.
 *
 * @param given The test the session belongs to.
 * @param stored The stored form, as written or edited: a sequence or an item may be changed, as a
 *   host may hand back what this renderer did not write.
 * @returns The session as the library reads it back, or the failure.
 */
const decodedAgainst = (
  given: Delivery,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The stored form is a session as a host could hand it back, any value.
  stored: unknown,
): Result.Result<TestSession, InvalidSession | SessionMismatch> => {
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- The stored form reaches decodeSession as JSON text, the form a host stores.
  const handedBack: unknown = JSON.parse(JSON.stringify(stored));

  return decodeSession(handedBack, given.test);
};

/**
 * Pass a session through a host and read it back, failing the test unless it comes back exactly.
 *
 * @param given The test the session belongs to.
 * @param session The session.
 */
const assertRestores = (given: Delivery, session: TestSession): void => {
  assert.deepStrictEqual(
    Result.getOrElse(decodedAgainst(given, storedOf(session)), (failure) =>
      assert.fail(`decodeSession refused: ${failure.message}`),
    ),
    session,
  );
};

/**
 * Read what `decodeSession` refuses a stored form with, failing the test when it decodes or fails
 * with a mismatch.
 *
 * @param given The test the session belongs to.
 * @param stored The stored form, as written or edited.
 * @returns The failure's tag, its stage and the version it names.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The stored form is a session as a host could hand it back, any value.
const refusal = (given: Delivery, stored: unknown): readonly unknown[] => {
  const failure = Option.getOrElse(Result.getFailure(decodedAgainst(given, stored)), () =>
    assert.fail("decodeSession accepted the stored form"),
  );

  return failure._tag === "InvalidSession"
    ? [failure._tag, failure.stage, failure.version]
    : assert.fail(`decodeSession failed with ${failure._tag}`);
};

/**
 * Read the stored item at an index, failing the test when the stored form holds none there.
 *
 * @param stored The stored session.
 * @param index The item's index.
 * @returns The stored item.
 */
const itemAt = (stored: StoredTestSession, index: number): StoredTestSession["items"][number] =>
  stored.items[index] ?? assert.fail(`the stored session holds no item at ${String(index)}`);

/**
 * Read the session item at an index, failing the test when the session holds none there.
 *
 * @param session The session.
 * @param index The item's index.
 * @returns The session item.
 */
const sessionItemAt = (session: TestSession, index: number): TestSession["items"][number] =>
  session.items.at(index) ?? assert.fail(`the session holds no item at ${String(index)}`);

/**
 * Write a stored session again with its items taken from the stored form's own, in an order the
 * caller gives, an item taken twice included: each item is numbered from 1 in the new order, its
 * `sequenceIndex` and its record's `instance` with it, and the sequence lists the new order's item
 * refs.
 *
 * @param stored The stored session.
 * @param order The index in `stored.items` of each item the new form holds, in its order.
 * @returns The stored form with those items.
 */
const restitched = (stored: StoredTestSession, order: readonly number[]): StoredTestSession => {
  const items = order.map((index, position) => {
    const item = itemAt(stored, index);

    return {
      ...item,
      record: { ...item.record, instance: `${stored.instance}.${String(position + 1)}` },
      sequenceIndex: position + 1,
    };
  });

  return { ...stored, items, sequence: items.map(({ ref }) => ref) };
};

describe("a session of a test that places one section document in two parts", () => {
  it.effect(
    "[S-9] a package test that places one section document in two parts starts with each part's own item and the placed item, in part order",
    () =>
      Effect.gen(function* startsInPartOrder() {
        const configuration = yield* configure({});
        const verdict = yield* openedFixture();
        const session = started(packageTestOf(verdict), configuration, "s1");

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual(
          session.items.map((item) => item.ref),
          [...placedSequence],
        );
        assert.deepStrictEqual(
          session.items.map((item) => item.sequenceIndex),
          [1, 2, 3, 4],
        );
        assert.deepStrictEqual(session.parts, [
          { identifier: "P1", status: "current" },
          { identifier: "P2", status: "pending" },
        ]);
      }),
  );

  it.effect(
    "[S-9] [T-14] a started session of a test that places one section document in two parts restores exactly",
    () =>
      Effect.gen(function* restoresPlacedInTwoParts() {
        const configuration = yield* configure({});
        const given = yield* placedInTwoParts();
        const session = started(given, configuration, "s1");

        assert.deepStrictEqual(
          session.items.map((item) => item.ref),
          [...placedSequence],
        );
        assertRestores(given, session);
      }),
  );

  it.effect(
    "[S-9] [T-14] every step of a walk by next through the two-part test restores: the second part's placed item is its own unpresented instance after the first step",
    () =>
      Effect.gen(function* restoresEveryStep() {
        const configuration = yield* configure({});
        const given = yield* placedInTwoParts();
        const steps = [started(given, configuration, "s1")];
        for (const seconds of [10, 20, 30, 40]) {
          steps.push(
            advanced(
              given,
              configuration,
              steps.at(-1) ?? assert.fail("the walk holds no session"),
              { kind: "next" },
              seconds,
            ),
          );
        }

        for (const session of steps) {
          assertRestores(given, session);
        }

        const pastFirstStep = steps.at(1) ?? assert.fail("the walk holds no second session");
        const restored = Result.getOrElse(
          decodedAgainst(given, storedOf(pastFirstStep)),
          (failure) => assert.fail(`decodeSession refused: ${failure.message}`),
        );
        const own = sessionItemAt(restored, 0);
        const firstPlaced = sessionItemAt(restored, 1);
        const secondPlaced = sessionItemAt(restored, 3);

        assert.isTrue(Option.isSome(own.firstOutcomes));
        assert.strictEqual(firstPlaced.ref, "shared-item");
        assert.isTrue(firstPlaced.presented);
        assert.strictEqual(secondPlaced.ref, "shared-item");
        assert.isFalse(secondPlaced.presented);
        assert.isTrue(Option.isNone(secondPlaced.firstOutcomes));
      }),
  );

  it.effect(
    "[S-9] [T-14] a stored session that delivers a first-part item after a second-part item is refused: the parts are still met in order",
    () =>
      Effect.gen(function* refusesPartsOutOfOrder() {
        const configuration = yield* configure({});
        const given = yield* placedInTwoParts();
        const stored = storedOf(started(given, configuration, "s1"));
        const edited = restitched(stored, [1, 2, 3, 0]);

        assert.deepStrictEqual(stored.sequence, [...placedSequence]);
        assert.deepStrictEqual(edited.sequence, ["shared-item", "second", "shared-item", "first"]);
        assert.deepStrictEqual(refusal(given, edited), [
          "InvalidSession",
          "decode",
          Option.some(6),
        ]);
      }),
  );

  it.effect(
    "[S-9] [T-14] a stored session that delivers the placed document three times is refused by the placement count",
    () =>
      Effect.gen(function* refusesThirdPlacement() {
        const configuration = yield* configure({});
        const given = yield* placedInTwoParts();
        const stored = storedOf(started(given, configuration, "s1"));
        const edited = restitched(stored, [0, 1, 2, 3, 3]);

        assert.deepStrictEqual(edited.sequence, [...placedSequence, "shared-item"]);
        assert.deepStrictEqual(refusal(given, edited), [
          "InvalidSession",
          "decode",
          Option.some(6),
        ]);
      }),
  );
});
