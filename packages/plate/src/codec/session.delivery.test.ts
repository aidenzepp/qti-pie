import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord, versionIssue } from "#plate/codec/record.ts";
import {
  acceptedItem,
  advance,
  begin,
  configure,
  decodeSession,
  encodeSession,
  itemRefs,
  open,
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
 * document's location is `fixtures/m3f/section-refs/<path>`.
 */
const location = "fixtures/m3f/section-refs";

/**
 * The fixture package's directory on disk.
 */
const fixtureDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "m3f",
  "section-refs",
);

/**
 * The path of the fixture's test document inside the package, which places `sections/a.xml` twice.
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
 * The twenty processing seeds `s1` to `s20`.
 */
const seeds: readonly string[] = Array.from({ length: 20 }, (_, index) => `s${index + 1}`);

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
 * The item refs a session over the fixture package delivers, in sequence: the test's own, then
 * `a.xml`'s run (its item, then `b.xml`'s through it), then that run again for the second
 * placement.
 */
const placedSequence = ["own", "a-item", "b-item", "a-item", "b-item"] as const;

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
 * Open the fixture package, read from disk, and take its test.
 *
 * @returns The test that places `sections/a.xml` twice, with its items.
 */
const placedTwice = Effect.fnUntraced(function* placedTwice() {
  return packageTestOf(yield* openPackage(location, yield* filesOf(fixtureDirectory)));
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
 * @param stored The stored form, as written or edited: a version, a sequence or an item may be
 *   changed or left out, as a host may hand back what this renderer did not write.
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
 * Read a document of `fixtures/m3f/selection` as text.
 *
 * @param name The file's name under the directory.
 * @returns The file's text.
 */
const selectionText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m3f/selection/${name}`, import.meta.url), "utf-8");

/**
 * Rewrite the text of `select.xml` into a section that selects four of two children with
 * replacement: the two children `c` and `d` and the section after the selection are taken out.
 *
 * @returns The test's text.
 */
const replacingText = (): string => {
  const edits: readonly (readonly [string, string])[] = [
    ['      <qti-assessment-item-ref identifier="c" href="choice.xml"/>\n', ""],
    ['      <qti-assessment-item-ref identifier="d" href="choice.xml"/>\n', ""],
    [
      '    <qti-assessment-section identifier="plain" title="Plain section" visible="true">\n      <qti-assessment-item-ref identifier="z" href="choice.xml"/>\n    </qti-assessment-section>\n',
      "",
    ],
    ['<qti-selection select="2"/>', '<qti-selection select="4" with-replacement="true"/>'],
  ];
  let rewriting = selectionText("select.xml");
  for (const [from, to] of edits) {
    const edited = rewriting.replace(from, to);

    assert.notStrictEqual(edited, rewriting, `select.xml no longer holds ${from}`);
    rewriting = edited;
  }

  return rewriting;
};

/**
 * Open a test document at `tests/t.xml` and the one item its item refs name, `choice.xml` beside
 * it, through the public `open`.
 *
 * @param text The test document's text.
 * @returns The test and its item keyed by item ref.
 */
const delivered = Effect.fnUntraced(function* delivered(text: string) {
  const encoder = new TextEncoder();
  const opened = yield* open("tests/t.xml", encoder.encode(text));
  const test =
    (opened.verdict === "accepted" || opened.verdict === "accepted-with-unsupported") &&
    opened.kind === "test"
      ? opened.accepted
      : assert.fail(`the test is ${opened.verdict}`);
  const choice = yield* open("tests/choice.xml", encoder.encode(selectionText("choice.xml")));
  const item = Option.getOrElse(acceptedItem(choice), () =>
    assert.fail(`choice.xml is ${choice.verdict}`),
  );
  const items = new Map<string, Accepted>();
  for (const { identifier } of itemRefs(test)) {
    items.set(identifier, item);
  }

  return { items, test } satisfies Delivery;
});

describe("a session of a test that places one section document twice", () => {
  it.effect(
    "[S-9] [T-14] a started session of a test that places one section document twice restores exactly",
    () =>
      Effect.gen(function* restoresPlacedTwice() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const session = started(given, configuration, "s1");

        assert.deepStrictEqual(
          session.items.map((item) => item.ref),
          [...placedSequence],
        );
        assertRestores(given, session);
      }),
  );

  it.effect(
    "[S-9] [T-14] every step of the placed test restores: after submit-item and next on the first run, the restored session still shows the second run's a-item unanswered",
    () =>
      Effect.gen(function* restoresEveryStep() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const steps = [started(given, configuration, "s1")];
        for (const seconds of [10, 20, 30, 40, 50]) {
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

        const pastFirstA = steps.at(2) ?? assert.fail("the walk holds no third session");
        const restored = Result.getOrElse(decodedAgainst(given, storedOf(pastFirstA)), (failure) =>
          assert.fail(`decodeSession refused: ${failure.message}`),
        );
        const second =
          restored.items.at(3) ?? assert.fail("the restored session holds no fourth item");

        assert.strictEqual(second.ref, "a-item");
        assert.strictEqual(second.presented, false);
        assert.isTrue(Option.isNone(second.firstOutcomes));
      }),
  );

  it.effect(
    "[S-9] [T-14] a stored session that delivers a placed item ref more times than the test places it is refused",
    () =>
      Effect.gen(function* refusesTooManyInstances() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const stored = storedOf(started(given, configuration, "s1"));
        const second = itemAt(stored, 3);
        const third = {
          ...second,
          record: { ...second.record, instance: `${stored.instance}.6` },
          sequenceIndex: 6,
        };

        assert.deepStrictEqual(stored.sequence, [...placedSequence]);
        assert.deepStrictEqual(
          refusal(given, {
            ...stored,
            items: [...stored.items, third],
            sequence: [...stored.sequence, "a-item"],
          }),
          ["InvalidSession", "decode", Option.some(5)],
        );
      }),
  );

  it.effect(
    "[S-9] [T-14] a stored session of the placed test that drops one instance is refused: a test without a selection delivers every instance",
    () =>
      Effect.gen(function* refusesMissingInstance() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const stored = storedOf(started(given, configuration, "s1"));

        assert.deepStrictEqual(
          refusal(given, {
            ...stored,
            items: stored.items.slice(0, -1),
            sequence: stored.sequence.slice(0, -1),
          }),
          ["InvalidSession", "decode", Option.some(5)],
        );
      }),
  );
});

describe("a session of a test that selects with replacement", () => {
  it.effect(
    "[S-3] [S-4] [T-14] a selection with replacement still restores its repeated instances",
    () =>
      Effect.gen(function* restoresRepeated() {
        const configuration = yield* configure({});
        const given = yield* delivered(replacingText());

        for (const seed of seeds) {
          const session = started(given, configuration, seed);

          assert.strictEqual(session.items.length, 4, seed);
          assertRestores(given, session);
        }
      }),
  );
});

describe("the stored version", () => {
  it.effect("[T-14] both stored forms are written at version 5", () =>
    Effect.gen(function* writesVersion() {
      const configuration = yield* configure({});
      const given = yield* placedTwice();
      const stored = storedOf(started(given, configuration, "s1"));
      const own = given.items.get("own") ?? assert.fail("the package delivers no item for own");
      const record = Result.getOrElse(begin(own, { instance: "q1", seed: "s1" }), (failure) =>
        assert.fail(`begin refused: ${failure.message}`),
      );

      assert.strictEqual(stored.version, 5);
      assert.strictEqual(itemAt(stored, 0).record.version, 5);
      assert.strictEqual(record.version, 5);
    }),
  );

  it.effect(
    "[T-14] a stored session and a stored item record at version 4 are refused by their version before any field is read",
    () =>
      Effect.gen(function* refusesVersionFour() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const stored = storedOf(started(given, configuration, "s1"));
        const { record } = itemAt(stored, 0);
        const olderRecord = { ...record, version: 4 };
        const failure = Option.getOrElse(Result.getFailure(decodeRecord(olderRecord)), () =>
          assert.fail("decodeRecord accepted the record at version 4"),
        );

        assert.deepStrictEqual(refusal(given, { ...stored, version: 4 }), [
          "InvalidSession",
          "decode",
          Option.some(4),
        ]);
        assert.deepStrictEqual(
          refusal(given, {
            ...stored,
            items: stored.items.map((item) => ({ ...item, record: olderRecord })),
          }),
          ["InvalidSession", "decode", Option.some(5)],
        );
        assert.deepStrictEqual(
          [failure._tag, failure.stage, Option.some(failure.issue)],
          ["InvalidRecord", "decode", versionIssue(olderRecord)],
        );
        assert.isTrue(Option.isSome(versionIssue(olderRecord)));
        assert.isTrue(Result.isSuccess(decodeRecord(record)));
      }),
  );

  it.effect(
    "[T-14] a stored session from before the sequence, version 4 and no sequence, is refused by its version",
    () =>
      Effect.gen(function* refusesBeforeSequence() {
        const configuration = yield* configure({});
        const given = yield* placedTwice();
        const { sequence: _sequence, ...beforeSequence } = storedOf(
          started(given, configuration, "s1"),
        );

        assert.deepStrictEqual(refusal(given, { ...beforeSequence, version: 4 }), [
          "InvalidSession",
          "decode",
          Option.some(4),
        ]);
      }),
  );
});
