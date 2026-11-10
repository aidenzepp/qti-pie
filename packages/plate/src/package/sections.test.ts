import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { advance, configure, current, open, openPackage, startTest } from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Intent,
  PackageTest,
  PackageVerdict,
  Responses,
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
 * The path of the fixture's test document inside the package.
 */
const testPath = "tests/test.xml";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
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
 * One edit of a fixture file before the package is opened: the text to find in the file at `file`,
 * which must occur there, and what to write in its place.
 */
interface Edit {
  readonly file: string;
  readonly from: string;
  readonly to: string;
}

/**
 * Give the fixture's files with some edits applied, each to the text of one file; the test fails
 * when an edit's text is not in its file, so a reworded fixture cannot silently leave a variant
 * unbuilt.
 *
 * @param edits The edits.
 * @returns The files.
 */
const variant = Effect.fnUntraced(function* variant(edits: readonly Edit[]) {
  const files = new Map(yield* filesOf(fixtureDirectory));
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  for (const { file, from, to } of edits) {
    const text = decoder.decode(files.get(file) ?? assert.fail(`the fixture has no ${file}`));

    assert.include(text, from, `${file} holds the text the variant replaces`);
    files.set(file, encoder.encode(text.replace(from, to)));
  }

  return files;
});

/**
 * Open the fixture package, with some edits applied to its files first.
 *
 * @param edits The edits, none by default.
 * @returns The verdict on the package.
 */
const openFixture = Effect.fnUntraced(function* openFixture(edits: readonly Edit[] = []) {
  return yield* openPackage(location, yield* variant(edits));
});

/**
 * Take the fixture's test from an accepting verdict; the test fails when the package does not
 * accept or holds no test at the fixture's path.
 *
 * @param verdict The package verdict.
 * @returns The test with its items.
 */
const testOf = (verdict: PackageVerdict): PackageTest => {
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(
      `the package is ${verdict.verdict}, not accepted${
        verdict.verdict === "refused"
          ? `: ${verdict.refusals.map((refusal) => `${refusal.rule} at ${refusal.document}`).join(", ")}`
          : ""
      }`,
    );
  }

  return (
    verdict.accepted.tests.get(`${location}/${testPath}`) ??
    assert.fail(`the package delivers no test at ${testPath}`)
  );
};

/**
 * The rule and `check` of each refusal of a verdict, none when it does not refuse.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule and check, the check `undefined` when it has none.
 */
const rulesOf = (verdict: PackageVerdict): readonly (readonly [string, string | undefined])[] =>
  verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => [refusal.rule, refusal.detail["check"]] as const)
    : [];

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now: startedAt }),
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
 * Read the item view a session shows now, failing the test when it shows the summary or `current`
 * fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's ref and the attempt limit its configuration carries.
 */
const shown = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
): { readonly maxAttempts: number; readonly ref: string } => {
  const view = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return view.kind === "item"
    ? { maxAttempts: view.configuration.maxAttempts, ref: view.ref }
    : assert.fail("current shows the summary, not an item");
};

/**
 * The item refs a session over the fixture delivers, in sequence: the test's own, then `a.xml`'s
 * run (its item, then `b.xml`'s through it), then that run again for the second ref.
 */
const sequence = ["own", "a-item", "b-item", "a-item", "b-item"] as const;

/**
 * The edit that writes a `qti-item-session-control` with `max-attempts="2"` into `a.xml`'s section.
 */
const controlledA: Edit = {
  file: "sections/a.xml",
  from: '<qti-assessment-item-ref identifier="a-item"',
  to: '<qti-item-session-control max-attempts="2"/><qti-assessment-item-ref identifier="a-item"',
};

describe("a package test with section refs", () => {
  it.effect(
    "[S-9] a package test delivers a placed section's items in place, in document order",
    () =>
      Effect.gen(function* inPlace() {
        const configuration = yield* configure({});
        const delivery = testOf(yield* openFixture());
        const session = started(delivery, configuration);

        assert.deepStrictEqual(
          session.items.map((item) => item.ref),
          [...sequence],
        );
      }),
  );

  it.effect("[S-9] the delivered test holds no qti-assessment-section-ref mark", () =>
    Effect.gen(function* unmarked() {
      const { test } = testOf(yield* openFixture());

      assert.notInclude(
        test.unsupported.map((feature) => feature.feature),
        "qti-assessment-section-ref",
      );
      assert.notInclude(
        test.test.unsupported.map((feature) => feature.feature),
        "qti-assessment-section-ref",
      );
    }),
  );

  it.effect(
    "[S-9] PackageTest.items holds every placed item ref's item, resolved against its own section document",
    () =>
      Effect.gen(function* everyItem() {
        const configuration = yield* configure({});
        const delivery = testOf(yield* openFixture());

        assert.deepStrictEqual([...delivery.items.keys()], ["own", "a-item", "b-item"]);
        assert.deepStrictEqual(
          [...delivery.items.values()].map((item) => item.document),
          [`${location}/items/one.xml`, `${location}/items/two.xml`, `${location}/items/three.xml`],
        );
        assert.isTrue(
          Result.isSuccess(
            startTest(delivery.test, delivery.items, configuration, { instance, now: startedAt }),
          ),
          "startTest succeeds with the package's items",
        );
      }),
  );

  it.effect(
    "[S-9] a section document placed twice gives two runs of its items, each run its own session items",
    () =>
      Effect.gen(function* twoRuns() {
        const configuration = yield* configure({});
        const delivery = testOf(yield* openFixture());
        const atFirst = started(delivery, configuration);

        assert.deepStrictEqual(
          atFirst.items.map((item) => item.sequenceIndex),
          [1, 2, 3, 4, 5],
        );
        assert.deepStrictEqual(
          atFirst.items.map((item) => item.ref),
          [...sequence],
        );

        // In a linear part with individual submission, `next` submits the current item first.
        const atFirstA = advanced(delivery, configuration, atFirst, { kind: "next" }, 10);
        const pastFirstA = advanced(delivery, configuration, atFirstA, { kind: "next" }, 20);

        assert.strictEqual(shown(delivery, configuration, atFirstA).ref, "a-item");
        assert.strictEqual(shown(delivery, configuration, pastFirstA).ref, "b-item");
        assert.isTrue(
          Option.isSome(pastFirstA.items[1]?.firstOutcomes ?? Option.none()),
          "the first run's a-item has a processed attempt",
        );
        assert.isTrue(
          Option.isNone(pastFirstA.items[3]?.firstOutcomes ?? Option.some(null)),
          "the second run's a-item has no attempt",
        );
        assert.strictEqual(pastFirstA.items[3]?.presented, false);
      }),
  );

  it.effect(
    "[P-2] [S-9] a placed section document that itself places another delivers the nested items in place",
    () =>
      Effect.gen(function* nested() {
        const configuration = yield* configure({});
        const delivery = testOf(yield* openFixture());
        const session = started(delivery, configuration);

        // `b.xml`'s item stands inside each run of `a.xml`, right after `a.xml`'s own item.
        assert.deepStrictEqual(session.items.map((item) => item.ref).slice(1, 3), [
          "a-item",
          "b-item",
        ]);
        assert.deepStrictEqual(session.items.map((item) => item.ref).slice(3, 5), [
          "a-item",
          "b-item",
        ]);
      }),
  );

  it.effect("[S-9] a section ref standing in a part, not in a section, is placed in the part", () =>
    Effect.gen(function* inPart() {
      const configuration = yield* configure({});
      // The part holds `S0` with `own`, then the ref to `a.xml`, then a section `S9` with `last`.
      const delivery = testOf(
        yield* openFixture([
          {
            file: testPath,
            from: '      <qti-assessment-section-ref identifier="RA1" href="../sections/a.xml"/>\n      <qti-assessment-section-ref identifier="RA2" href="../sections/a.xml"/>\n    </qti-assessment-section>',
            to: '    </qti-assessment-section>\n    <qti-assessment-section-ref identifier="RA1" href="../sections/a.xml"/>\n    <qti-assessment-section identifier="S9" title="The keeper\'s last question" visible="true">\n      <qti-assessment-item-ref identifier="last" href="../items/one.xml"/>\n    </qti-assessment-section>',
          },
        ]),
      );
      const session = started(delivery, configuration);

      assert.deepStrictEqual(
        session.items.map((item) => item.ref),
        ["own", "a-item", "b-item", "last"],
      );
    }),
  );

  it.effect(
    "[S-9] a placed section's session control applies to its items as if written inline",
    () =>
      Effect.gen(function* controlled() {
        const configuration = yield* configure({});
        const delivery = testOf(yield* openFixture([controlledA]));
        let session = started(delivery, configuration);
        const limits: (readonly [string, number])[] = [];
        for (let step = 0; step < sequence.length; step += 1) {
          const view = shown(delivery, configuration, session);
          limits.push([view.ref, view.maxAttempts]);
          if (step + 1 < sequence.length) {
            session = advanced(delivery, configuration, session, { kind: "next" }, 10 * (step + 1));
          }
        }

        assert.deepStrictEqual(limits, [
          ["own", 1],
          ["a-item", 2],
          ["b-item", 2],
          ["a-item", 2],
          ["b-item", 2],
        ]);
      }),
  );

  it.effect("[S-9] a package whose only marks were placed section refs is accepted", () =>
    Effect.gen(function* accepted() {
      const verdict = yield* openFixture();

      assert.deepStrictEqual(rulesOf(verdict), []);
      assert.strictEqual(verdict.verdict, "accepted");
    }),
  );

  it.effect("[S-9] a test opened alone keeps its section refs marked and places nothing", () =>
    Effect.gen(function* alone() {
      const files = yield* filesOf(fixtureDirectory);
      const verdict = yield* open(
        `${location}/${testPath}`,
        files.get(testPath) ?? assert.fail(`the fixture has no ${testPath}`),
      );

      assert.strictEqual(verdict.verdict, "accepted-with-unsupported");

      const accepted =
        verdict.verdict === "accepted-with-unsupported" && verdict.kind === "test"
          ? verdict.accepted
          : assert.fail("the test document alone is not an accepted test");

      assert.deepStrictEqual(
        accepted.unsupported.map((feature) => feature.feature),
        ["qti-assessment-section-ref", "qti-assessment-section-ref"],
      );
      assert.deepStrictEqual(
        accepted.test.parts.flatMap((part) =>
          part.children.flatMap((section) =>
            section.children.map((child) => (child.kind === "item-ref" ? child.identifier : "")),
          ),
        ),
        ["own"],
      );
    }),
  );

  it.effect(
    "[S-9] a section ref that returns to a document on its chain is still refused inclusion-cycle",
    () =>
      Effect.gen(function* cycle() {
        const verdict = yield* openFixture([
          {
            file: "sections/b.xml",
            from: '<qti-assessment-item-ref identifier="b-item" href="../items/three.xml"/>',
            to: '<qti-assessment-item-ref identifier="b-item" href="../items/three.xml"/><qti-assessment-section-ref identifier="RA" href="a.xml"/>',
          },
        ]);

        assert.strictEqual(verdict.verdict, "refused");
        assert.include(
          rulesOf(verdict).map(([rule]) => rule),
          "inclusion-cycle",
        );
      }),
  );

  it.effect(
    "[S-9] an external section ref is still refused package-path-outside with check remote-section",
    () =>
      Effect.gen(function* external() {
        const verdict = yield* openFixture([
          {
            file: testPath,
            from: '<qti-assessment-section-ref identifier="RA2" href="../sections/a.xml"/>',
            to: '<qti-assessment-section-ref identifier="RA2" href="https://example.org/s.xml"/>',
          },
        ]);

        assert.strictEqual(verdict.verdict, "refused");
        assert.deepInclude(rulesOf(verdict), ["package-path-outside", "remote-section"]);
      }),
  );
});
