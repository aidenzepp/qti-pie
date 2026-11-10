import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import {
  acceptedItem,
  advance,
  configure,
  current,
  decodeSession,
  encodeSession,
  itemRefs,
  open,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Intent,
  InvalidSession,
  ItemView,
  Responses,
  SessionMismatch,
  StoredTestSession,
  TestSession,
} from "#plate/index.ts";

/**
 * The session instance every sitting starts with.
 */
const instance = "sitting";

/**
 * The time every sitting starts and moves at: no test here sets a time limit, so nothing reads the
 * clock.
 */
const now = new Date("2026-11-10T10:00:00.000Z");

/**
 * The twenty processing seeds `s1` to `s20`, the set a test draws over when it asserts that a draw
 * varies with the seed.
 */
const seeds: readonly string[] = Array.from({ length: 20 }, (_, index) => `s${index + 1}`);

/**
 * The correct response of `choice.xml`: the choice `A`.
 */
const correct: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * Read a document of `fixtures/m3f/selection`, the two test documents and the item they name, as
 * text.
 *
 * @param name The file's name under the directory.
 * @returns The file's text.
 */
const fixtureText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m3f/selection/${name}`, import.meta.url), "utf-8");

/**
 * Rewrite the text of a fixture for a variant of it.
 *
 * @param text The document's text.
 * @param edits Each piece of text the document must hold, and what replaces it.
 * @returns The text with each edit applied, failing the test when the document no longer holds a
 *   piece of text an edit replaces.
 */
const rewritten = (text: string, ...edits: readonly (readonly [string, string])[]): string => {
  let rewriting = text;
  for (const [from, to] of edits) {
    const edited = rewriting.replace(from, to);
    if (edited === rewriting) {
      return assert.fail(`the document no longer holds ${from}`);
    }

    rewriting = edited;
  }

  return rewriting;
};

/**
 * Write an item ref that names `choice.xml`.
 *
 * @param identifier The item ref's identifier.
 * @param attributes The item ref's further attributes, each led by a space.
 * @returns The element's text.
 */
const refXml = (identifier: string, attributes = ""): string =>
  `<qti-assessment-item-ref identifier="${identifier}" href="choice.xml"${attributes}/>`;

/**
 * Write a section.
 *
 * @param identifier The section's identifier, which is also its title.
 * @param visible The section's `visible`.
 * @param attributes The section's further attributes, each led by a space.
 * @param children The section's children, as text.
 * @returns The element's text.
 */
const sectionXml = (
  identifier: string,
  visible: boolean,
  attributes: string,
  children: string,
): string =>
  `<qti-assessment-section identifier="${identifier}" title="${identifier}" visible="${visible}"${attributes}>${children}</qti-assessment-section>`;

/**
 * Write a test of one nonlinear part with individual submission.
 *
 * @param sections The part's sections, as text.
 * @returns The test's text.
 */
const testXml = (sections: string): string =>
  `<qti-assessment-test xmlns="${qtiNamespace}" identifier="built" title="Built"><qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">${sections}</qti-test-part></qti-assessment-test>`;

/**
 * Write a test whose section `outer` shuffles the item refs `x` and `y` and a sub-section `inner`
 * that holds the item refs `i1` and `i2`, in that order.
 *
 * @param visible The sub-section's `visible`.
 * @param keepTogether The sub-section's `keep-together`.
 * @returns The test's text.
 */
const shufflingXml = (visible: boolean, keepTogether: boolean): string =>
  testXml(
    sectionXml(
      "outer",
      true,
      "",
      `<qti-ordering shuffle="true"/>${refXml("x")}${sectionXml("inner", visible, ` keep-together="${keepTogether}"`, `${refXml("i1")}${refXml("i2")}`)}${refXml("y")}`,
    ),
  );

/**
 * A test and the item it delivers, as a host passes them to `startTest` and `advance`, and the
 * verdict `open` gave the test.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
  readonly verdict: "accepted" | "accepted-with-unsupported";
}

/**
 * Open a test document at `tests/t.xml` and the one item its item refs name, `choice.xml` beside
 * it, through the public `open`.
 *
 * @param text The test document's text.
 * @returns The test, its item keyed by item ref, and the test's verdict.
 */
const delivery = Effect.fnUntraced(function* delivery(text: string) {
  const encoder = new TextEncoder();
  const opened = yield* open("tests/t.xml", encoder.encode(text));
  const accepted =
    opened.verdict === "accepted" || opened.verdict === "accepted-with-unsupported"
      ? opened
      : assert.fail(`the test is ${opened.verdict}`);
  const test =
    accepted.kind === "test" ? accepted.accepted : assert.fail(`the test is a ${accepted.kind}`);
  const choice = yield* open("tests/choice.xml", encoder.encode(fixtureText("choice.xml")));
  const item = Option.getOrElse(acceptedItem(choice), () =>
    assert.fail(`choice.xml is ${choice.verdict}`),
  );
  const items = new Map<string, Accepted>();
  for (const { identifier } of itemRefs(test)) {
    items.set(identifier, item);
  }

  return { items, test, verdict: accepted.verdict } satisfies Delivery;
});

/**
 * Start a session of a delivery under a processing seed, failing the test when `startTest`
 * refuses.
 *
 * @param given The test and its item.
 * @param configuration The host's configuration.
 * @param seed The processing seed.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration, seed: string): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now, seed }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * List the item refs of a session in sequence order.
 *
 * @param session The session.
 * @returns Each session item's ref.
 */
const refsOf = (session: TestSession): readonly string[] => session.items.map((item) => item.ref);

/**
 * Start a session of a delivery under each of some seeds and read its sequence.
 *
 * @param given The test and its item.
 * @param configuration The host's configuration.
 * @param under The seeds.
 * @returns Each seed's sequence of item refs, in the seeds' order.
 */
const sequencesOf = (
  given: Delivery,
  configuration: Configuration,
  under: readonly string[] = seeds,
): readonly (readonly string[])[] =>
  under.map((seed) => refsOf(started(given, configuration, seed)));

/**
 * Count the distinct sequences among some.
 *
 * @param sequences The sequences.
 * @returns How many differ.
 */
const distinctIn = (sequences: readonly (readonly string[])[]): number =>
  new Set(sequences.map((sequence) => sequence.join(" "))).size;

/**
 * Tell whether another item stands between the items `i1` and `i2` of a sequence.
 *
 * @param sequence The sequence.
 * @returns Whether `i1` and `i2` are not side by side.
 */
const splitsInner = (sequence: readonly string[]): boolean =>
  Math.abs(sequence.indexOf("i1") - sequence.indexOf("i2")) > 1;

/**
 * Tell whether a sequence holds some refs in the order of a list, each at most once, in the way
 * document order does.
 *
 * @param sequence The sequence.
 * @param order The refs in document order.
 * @returns Whether the sequence's refs are strictly ascending in `order`.
 */
const inOrder = (sequence: readonly string[], order: readonly string[]): boolean =>
  sequence.every(
    (ref, at) => at === 0 || order.indexOf(ref) > order.indexOf(sequence[at - 1] ?? ref),
  );

/**
 * Read the item a session shows now, failing the test when it shows the summary or `current`
 * fails.
 *
 * @param given The test and its item.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's view.
 */
const viewOf = (given: Delivery, configuration: Configuration, session: TestSession): ItemView => {
  const shown = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown : assert.fail("current shows the summary, not an item");
};

/**
 * Advance a session with an intent and the responses posted with it, failing the test when
 * `advance` refuses.
 *
 * @param given The test and its item.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param responses The responses posted with it.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  responses?: Responses,
): TestSession =>
  Result.getOrElse(
    advance(
      given.test,
      given.items,
      session,
      responses === undefined ? { intent } : { intent, responses },
      configuration,
      { now },
    ),
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
 * Pass a stored session through a host and decode it against a test: write it as JSON text, read
 * the text back and decode what the host hands back.
 *
 * @param given The test the session belongs to.
 * @param stored The stored session.
 * @returns The session as the library reads it back, or the failure.
 */
const decodedAgainst = (
  given: Delivery,
  stored: StoredTestSession,
): Result.Result<TestSession, InvalidSession | SessionMismatch> => {
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- The session reaches decodeSession as JSON text, the form a host stores.
  const handedBack: unknown = JSON.parse(JSON.stringify(stored));

  return decodeSession(handedBack, given.test);
};

/**
 * Pass a session through a host and read it back, failing the test unless it comes back exactly and
 * its stored form carries the sequence its items deliver.
 *
 * @param given The test the session belongs to.
 * @param session The session.
 */
const assertRestores = (given: Delivery, session: TestSession): void => {
  const stored = storedOf(session);

  assert.deepStrictEqual(stored.sequence, refsOf(session));
  assert.deepStrictEqual(
    Result.getOrElse(decodedAgainst(given, stored), (failure) =>
      assert.fail(`decodeSession refused: ${failure.message}`),
    ),
    session,
  );
};

/**
 * Read why `decodeSession` refuses a stored session, failing the test when it decodes.
 *
 * @param given The test the session belongs to.
 * @param stored The stored session.
 * @returns The issue an `InvalidSession` names.
 */
const refusedBecause = (given: Delivery, stored: StoredTestSession): string => {
  const failure = Option.getOrElse(Result.getFailure(decodedAgainst(given, stored)), () =>
    assert.fail("decodeSession accepted the session"),
  );

  return failure._tag === "InvalidSession"
    ? failure.issue
    : assert.fail(`decodeSession failed with ${failure._tag}`);
};

/**
 * The section `drawn` of `select.xml` writes `select="2"`.
 */
const selectsTwo = 'select="2"';

/**
 * The section `drawn` of `select.xml` writes `shuffle="true"`.
 */
const shuffles = 'shuffle="true"';

/**
 * The item refs of `select.xml`'s section `drawn`, in document order.
 */
const drawnRefs = ["a", "b", "c", "d"] as const;

/**
 * Keep the refs of a sequence that the section `drawn` of `select.xml` holds, which the section
 * `plain` after it leaves out.
 *
 * @param sequence The session's sequence.
 * @returns The refs of `drawn`, in the order they are met.
 */
const drawnIn = (sequence: readonly string[]): readonly string[] =>
  sequence.filter((ref) => ref !== "z");

describe("the session's sequence, selected and ordered under its seed", () => {
  it.effect(
    "[S-3] [S-4] a test holding qti-selection and qti-ordering opens accepted, with neither marked",
    () =>
      Effect.gen(function* opensAccepted() {
        const given = yield* delivery(fixtureText("select.xml"));

        assert.strictEqual(given.verdict, "accepted");
        assert.deepStrictEqual(given.test.test.unsupported, []);
      }),
  );

  it.effect("[S-3] select 2 of 4 gives two distinct children of the section, in source order", () =>
    Effect.gen(function* selectsTwoOfFour() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        rewritten(fixtureText("select.xml"), [shuffles, 'shuffle="false"']),
      );
      const sequences = sequencesOf(given, configuration);

      for (const sequence of sequences) {
        const drawn = drawnIn(sequence);

        assert.strictEqual(drawn.length, 2, sequence.join(" "));
        assert.strictEqual(new Set(drawn).size, 2);
        assert.isTrue(drawn.every((ref) => drawnRefs.some((each) => each === ref)));
        assert.isTrue(inOrder(drawn, drawnRefs), `${drawn.join(" ")} is not in source order`);
        assert.strictEqual(sequence.at(-1), "z", "the section after the selection follows it");
      }
      assert.isAbove(distinctIn(sequences), 1, "the selection varies with the seed");
    }),
  );

  it.effect("[S-3] a required child is selected in every session", () =>
    Effect.gen(function* keepsRequired() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        rewritten(fixtureText("select.xml"), ['identifier="c"', 'identifier="c" required="true"']),
      );
      const sequences = sequencesOf(given, configuration);

      for (const sequence of sequences) {
        const drawn = drawnIn(sequence);

        assert.strictEqual(drawn.length, 2, sequence.join(" "));
        assert.include(drawn, "c");
      }
      assert.isAbove(
        new Set(sequences.flatMap((sequence) => drawnIn(sequence).filter((ref) => ref !== "c")))
          .size,
        1,
        "the second child is drawn from the rest",
      );
    }),
  );

  it.effect("[S-3] select 0 delivers none of the section's children", () =>
    Effect.gen(function* selectsNone() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        rewritten(fixtureText("select.xml"), [selectsTwo, 'select="0"']),
      );

      for (const sequence of sequencesOf(given, configuration)) {
        assert.deepStrictEqual(sequence, ["z"]);
      }
    }),
  );

  it.effect(
    "[S-3] a select below the number of required children selects every required child and nothing else",
    () =>
      Effect.gen(function* selectsOnlyRequired() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          rewritten(
            fixtureText("select.xml"),
            ['identifier="a"', 'identifier="a" required="true"'],
            ['identifier="c"', 'identifier="c" required="true"'],
            [selectsTwo, 'select="1"'],
            [shuffles, 'shuffle="false"'],
          ),
        );

        for (const sequence of sequencesOf(given, configuration)) {
          assert.deepStrictEqual(sequence, ["a", "c", "z"]);
        }
      }),
  );

  it.effect(
    "[S-3] with replacement, select 6 of 3 gives every child once and three further instances, each item's instances together",
    () =>
      Effect.gen(function* selectsWithReplacement() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          testXml(
            sectionXml(
              "drawn",
              true,
              "",
              `<qti-selection select="6" with-replacement="true"/>${refXml("a")}${refXml("b")}${refXml("c")}`,
            ),
          ),
        );
        const sequences = sequencesOf(given, configuration);

        for (const sequence of sequences) {
          assert.strictEqual(sequence.length, 6, sequence.join(" "));
          for (const ref of ["a", "b", "c"]) {
            assert.isAtLeast(sequence.filter((each) => each === ref).length, 1, ref);
          }
          const runs = sequence.filter((ref, at) => ref !== sequence[at - 1]);

          assert.deepStrictEqual(runs, ["a", "b", "c"], `${sequence.join(" ")} breaks a run`);
        }
        assert.isAbove(distinctIn(sequences), 1, "the further instances vary with the seed");
      }),
  );

  it.effect("[S-3] a selected sub-section counts as 1 and runs its own selection", () =>
    Effect.gen(function* selectsSubSection() {
      const configuration = yield* configure({});
      const given = yield* delivery(fixtureText("nested.xml"));
      const sequences = sequencesOf(given, configuration);

      for (const sequence of sequences) {
        assert.strictEqual(sequence.length, 1, sequence.join(" "));
      }
      assert.deepStrictEqual(
        [...new Set(sequences.flat())].toSorted(),
        ["inner-a", "inner-b", "solo"],
        "the outer selection reaches the sub-section and the item ref, and the inner one both of its items",
      );
    }),
  );

  it.effect(
    "[S-3] [S-4] two sessions started with one seed walk one sequence; another seed gives another over twenty seeds",
    () =>
      Effect.gen(function* walksOneSequence() {
        const configuration = yield* configure({});
        const given = yield* delivery(fixtureText("select.xml"));
        const twice = sequencesOf(given, configuration, ["same", "same"]);

        assert.deepStrictEqual(twice[0], twice[1]);
        assert.isAbove(distinctIn(sequencesOf(given, configuration)), 1);
      }),
  );

  it.effect(
    "[S-4] shuffle true reorders the selected children under the seed, keeping the same members",
    () =>
      Effect.gen(function* shufflesSelected() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          rewritten(fixtureText("select.xml"), [selectsTwo, 'select="4"']),
        );
        const sequences = sequencesOf(given, configuration);

        for (const sequence of sequences) {
          assert.deepStrictEqual(drawnIn(sequence).toSorted(), [...drawnRefs]);
          assert.strictEqual(sequence.at(-1), "z");
        }
        assert.isAbove(distinctIn(sequences), 1, "the order varies with the seed");
      }),
  );

  it.effect("[S-4] a fixed child keeps its position in the selected sequence", () =>
    Effect.gen(function* keepsFixedPosition() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        rewritten(
          fixtureText("select.xml"),
          [selectsTwo, 'select="3"'],
          ['identifier="b"', 'identifier="b" fixed="true"'],
        ),
      );
      const sequences = sequencesOf(given, configuration);
      let selectedWithFixed = 0;

      for (const sequence of sequences) {
        const drawn = drawnIn(sequence);

        assert.strictEqual(drawn.length, 3, sequence.join(" "));
        if (drawn.includes("b")) {
          selectedWithFixed += 1;
          assert.strictEqual(
            drawn.indexOf("b"),
            drawn.includes("a") ? 1 : 0,
            `${drawn.join(" ")} moves b off its place in the selected sequence`,
          );
        }
      }
      assert.isAbove(selectedWithFixed, 0, "the fixed child is selected in some session");
      assert.isAbove(distinctIn(sequences), 1, "the others still shuffle around it");
    }),
  );

  it.effect("[S-4] a visible sub-section is shuffled as one block", () =>
    Effect.gen(function* shufflesVisibleBlock() {
      const configuration = yield* configure({});
      const given = yield* delivery(shufflingXml(true, false));
      const sequences = sequencesOf(given, configuration);

      for (const sequence of sequences) {
        assert.deepStrictEqual(sequence.toSorted(), ["i1", "i2", "x", "y"]);
        assert.strictEqual(
          sequence.indexOf("i2"),
          sequence.indexOf("i1") + 1,
          `${sequence.join(" ")} splits the block`,
        );
      }
      assert.isAbove(distinctIn(sequences), 1, "the block moves with the seed");
    }),
  );

  it.effect(
    "[S-4] an invisible sub-section with keep-together false has its items mixed among the parent's",
    () =>
      Effect.gen(function* mixesInvisibleChildren() {
        const configuration = yield* configure({});
        const apart = sequencesOf(yield* delivery(shufflingXml(false, false)), configuration);
        const together = sequencesOf(yield* delivery(shufflingXml(false, true)), configuration);

        for (const sequence of [...apart, ...together]) {
          assert.deepStrictEqual(sequence.toSorted(), ["i1", "i2", "x", "y"]);
        }
        assert.isTrue(apart.some(splitsInner), "a parent child stands between the mixed items");
        assert.isFalse(together.some(splitsInner), "kept together, the items stand side by side");
      }),
  );

  it.effect("[S-4] shuffle false keeps the selected children in source order", () =>
    Effect.gen(function* keepsSourceOrder() {
      const configuration = yield* configure({});
      const given = yield* delivery(
        rewritten(
          fixtureText("select.xml"),
          [selectsTwo, 'select="3"'],
          [shuffles, 'shuffle="false"'],
        ),
      );

      for (const sequence of sequencesOf(given, configuration)) {
        assert.isTrue(inOrder(drawnIn(sequence), drawnRefs), sequence.join(" "));
      }
    }),
  );

  it.effect(
    "[S-3] each instance of a child selected twice is its own session item: submitting one leaves the other open",
    () =>
      Effect.gen(function* instancesAreItems() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          testXml(
            sectionXml(
              "drawn",
              true,
              "",
              `<qti-selection select="2" with-replacement="true"/>${refXml("a")}`,
            ),
          ),
        );
        const begun = started(given, configuration, "twice");

        assert.deepStrictEqual(refsOf(begun), ["a", "a"]);
        assert.deepStrictEqual(
          begun.items.map((item) => item.sequenceIndex),
          [1, 2],
        );

        const submitted = advanced(given, configuration, begun, { kind: "submit-item" }, correct);
        const first = viewOf(given, configuration, submitted);
        assert.strictEqual(first.sequenceIndex, 1);
        assert.isTrue(first.disabled, "the submitted instance has used its one attempt");

        const second = viewOf(
          given,
          configuration,
          advanced(given, configuration, submitted, { kind: "go", sequenceIndex: 2 }),
        );
        assert.deepStrictEqual(
          [second.ref, second.sequenceIndex, second.disabled, second.record.numAttempts],
          ["a", 2, false, 0],
        );
        assert.notStrictEqual(second.instance, first.instance);
      }),
  );
});

describe("a session of a test that selects or shuffles, stored and restored", () => {
  it.effect(
    "[S-3] [S-4] restores exactly through encodeSession and decodeSession: the stored form carries the delivered sequence, a selection with replacement's repeated instances and every move of the session included",
    () =>
      Effect.gen(function* restoresExactly() {
        const configuration = yield* configure({});
        for (const text of [fixtureText("select.xml"), fixtureText("nested.xml")]) {
          const given = yield* delivery(text);

          for (const seed of seeds) {
            assertRestores(given, started(given, configuration, seed));
          }
        }

        const repeating = yield* delivery(
          testXml(
            sectionXml(
              "drawn",
              true,
              "",
              `<qti-selection select="4" with-replacement="true"/>${refXml("a")}${refXml("b")}`,
            ),
          ),
        );
        const begun = started(repeating, configuration, "twice");
        const submitted = advanced(
          repeating,
          configuration,
          begun,
          { kind: "submit-item" },
          correct,
        );
        const moved = advanced(repeating, configuration, submitted, { kind: "next" });

        assert.strictEqual(refsOf(begun).length, 4);
        for (const session of [begun, submitted, moved]) {
          assertRestores(repeating, session);
        }
      }),
  );

  it.effect(
    "[S-3] [S-4] refuses a stored session whose items differ from the sequence it carries, or whose sequence is no delivery of the test",
    () =>
      Effect.gen(function* refusesBrokenSequences() {
        const configuration = yield* configure({});
        const given = yield* delivery(fixtureText("select.xml"));
        const session = started(given, configuration, "s1");
        const stored = storedOf(session);

        assert.deepStrictEqual(stored.sequence, ["d", "c", "z"]);
        assert.include(
          refusedBecause(given, { ...stored, sequence: stored.sequence.toReversed() }),
          "stored sequence",
        );
        assert.include(
          refusedBecause(
            given,
            storedOf({
              ...session,
              items: session.items.map((item, at) => (at === 0 ? { ...item, ref: "ghost" } : item)),
            }),
          ),
          "no item ref of the test",
        );
        assert.include(
          refusedBecause(
            given,
            storedOf({
              ...session,
              items: [...session.items.slice(0, 2), ...session.items.slice(0, 1)].map(
                (item, at) => ({ ...item, sequenceIndex: at + 1 }),
              ),
            }),
          ),
          "already delivers",
        );

        const everything = yield* delivery(
          rewritten(fixtureText("select.xml"), ['<qti-selection select="2"/>', ""]),
        );
        const whole = started(everything, configuration, "s1");

        assert.strictEqual(whole.items.length, 5);
        assertRestores(everything, whole);
        assert.include(
          refusedBecause(everything, storedOf({ ...whole, items: whole.items.slice(0, 4) })),
          "delivers each of its item refs",
        );
      }),
  );
});
