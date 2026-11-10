import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { acceptedItem, configure, itemRefs, open, startTest } from "#plate/index.ts";
import type { Accepted, AcceptedTest, Configuration, TestSession } from "#plate/index.ts";

/**
 * The session instance every sitting starts with.
 */
const instance = "sitting";

/**
 * The time every sitting starts at: no test here sets a time limit, so nothing reads the clock.
 */
const now = new Date("2026-11-10T10:00:00.000Z");

/**
 * The twenty processing seeds `s1` to `s20`, the set a test draws over when it asserts that a draw
 * varies with the seed.
 */
const seeds: readonly string[] = Array.from({ length: 20 }, (_, index) => `s${index + 1}`);

/**
 * Read a document of `fixtures/m3f/selection`, the test documents and the item they name, as text.
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
 * A test and the item it delivers, as a host passes them to `startTest`, and the verdict `open`
 * gave the test.
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
 * Start a session of a delivery under each of the twenty seeds and read its sequence.
 *
 * @param given The test and its item.
 * @param configuration The host's configuration.
 * @returns Each seed's sequence of item refs, in the seeds' order.
 */
const sequencesOf = (
  given: Delivery,
  configuration: Configuration,
): readonly (readonly string[])[] =>
  seeds.map((seed) => started(given, configuration, seed).items.map((item) => item.ref));

/**
 * Count the distinct sequences among some.
 *
 * @param sequences The sequences.
 * @returns How many differ.
 */
const distinctIn = (sequences: readonly (readonly string[])[]): number =>
  new Set(sequences.map((sequence) => sequence.join(" "))).size;

/**
 * Tell whether another item stands between the items `y1` and `y2` of a sequence.
 *
 * @param sequence The sequence.
 * @returns Whether `y1` and `y2` are not side by side.
 */
const splitsInner = (sequence: readonly string[]): boolean =>
  Math.abs(sequence.indexOf("y1") - sequence.indexOf("y2")) > 1;

describe("the defaults of a selection below its required children", () => {
  it.effect(
    "[S-3] a select below zero selects the required children and nothing else, and the test is accepted",
    () =>
      Effect.gen(function* selectsOnlyRequired() {
        const configuration = yield* configure({});
        const given = yield* delivery(fixtureText("negative.xml"));

        assert.strictEqual(given.verdict, "accepted");
        assert.deepStrictEqual(given.test.test.unsupported, []);
        for (const sequence of sequencesOf(given, configuration)) {
          assert.deepStrictEqual(sequence, ["b"]);
        }
      }),
  );

  it.effect(
    "[S-3] a select below the number of required children selects every required child",
    () =>
      Effect.gen(function* selectsEveryRequired() {
        const configuration = yield* configure({});
        const given = yield* delivery(
          rewritten(
            fixtureText("negative.xml"),
            ['select="-1"', 'select="1"'],
            ['identifier="d"', 'identifier="d" required="true"'],
          ),
        );

        assert.strictEqual(given.verdict, "accepted");
        for (const sequence of sequencesOf(given, configuration)) {
          assert.deepStrictEqual(sequence, ["b", "d"]);
        }
      }),
  );
});

describe("the blocks a section's shuffle moves", () => {
  it.effect(
    "[S-4] a fixed invisible sub-section that does not keep together is one block that keeps its index",
    () =>
      Effect.gen(function* keepsBlockIndex() {
        const configuration = yield* configure({});
        const given = yield* delivery(fixtureText("block.xml"));
        const sequences = sequencesOf(given, configuration);

        for (const sequence of sequences) {
          assert.deepStrictEqual(sequence.toSorted(), ["r", "x", "y1", "y2", "z"]);
          assert.strictEqual(sequence.indexOf("y1"), 2, sequence.join(" "));
          assert.strictEqual(sequence.indexOf("y2"), 3, sequence.join(" "));
        }
        assert.isAtLeast(
          distinctIn(sequences.map((sequence) => sequence.filter((ref) => !ref.startsWith("y")))),
          2,
          "the children around the fixed block still shuffle",
        );
      }),
  );

  it.effect("[S-4] the same sub-section not fixed is mixed among its parent's children", () =>
    Effect.gen(function* mixesUnfixedBlock() {
      const configuration = yield* configure({});
      const given = yield* delivery(rewritten(fixtureText("block.xml"), [' fixed="true"', ""]));
      const sequences = sequencesOf(given, configuration);

      for (const sequence of sequences) {
        assert.deepStrictEqual(sequence.toSorted(), ["r", "x", "y1", "y2", "z"]);
      }
      assert.isTrue(sequences.some(splitsInner), "a parent child stands between the mixed items");
    }),
  );
});
