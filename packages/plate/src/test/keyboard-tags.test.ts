import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";

/**
 * The tests that complete an item through `keyboardWalk`, by file under `src/`, each title as
 * written: a walk directly, or a helper that walks, such as `src/vertical.test.ts`'s `complete`.
 * Each one carries the `[keyboard]` token after its last ID token (spec §4.10).
 */
const walks: ReadonlyMap<string, readonly string[]> = new Map([
  [
    "dev/page.test.ts",
    [
      "[Q-2] [keyboard] BG007 completes in the playground: its form walked by keys, posted, and scored 1",
      "[Q-20] [keyboard] BG010 completes in the playground: York typed, posted, and scored 1",
      "[Q-5] [keyboard] BG011 completes in the playground: past the video, its answer typed, posted, and the response recorded",
    ],
  ],
  [
    "interactions/choice.test.ts",
    [
      "[Q-2] [keyboard] names every Control by the payload's form name, the author's when given",
      "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the second choice",
      "[Q-2] [keyboard] a checkbox walk posts the selected set",
      "[Q-2] [keyboard] checks the value decoded under the caller's entry name, the author's form name included, and accepts NULL",
    ],
  ],
  [
    "interactions/extended-text.test.ts",
    [
      "[Q-5] [keyboard] writes the Control's id, rows from expected-lines, placeholder and the payload's form name, the author's when given",
      String.raw`[Q-5] [keyboard] a keyboard walk in a test-built form posts multi-line text, "a\\r\\nb", which decode turns into "a\\nb"`,
      "[Q-5] [keyboard] holds the value's text as the textarea's only child, and a text that starts with a line feed round-trips",
      '[Q-5] [keyboard] presents format="xhtml" as a plain textarea marked data-format="xhtml", whose typed markup posts as text',
      "[Q-5] [keyboard] a walk that fills two of the three Controls posts an ordered value of two, which restores in order",
      '[Q-5] [keyboard] builds an Extended Text whose pattern-mask="[0-9" the translator refuses beside a Choice as a notice in its place, and a walk still posts the Choice',
    ],
  ],
  [
    "interactions/text-entry.test.ts",
    [
      "[Q-20] [keyboard] a keyboard walk (Tab, type York, Enter) posts York under the Control's name",
      "[Q-20] [keyboard] names the Control by the author's form name when names gives one",
    ],
  ],
  [
    "render.test.ts",
    [
      "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the presented second choice",
    ],
  ],
  [
    "vertical.test.ts",
    [
      "[Q-2] [I-9b] [keyboard] BG007 by keyboard: true scores 1, false 0, none 0",
      "[Q-20] [I-9b] [keyboard] BG010 by keyboard: YORK and york give 0.5, Paris and none 0",
      "[Q-5] [keyboard] BG011 by keyboard, past the video: the response is recorded, not scored",
      "[I-9b] [keyboard] the hotspot item shows one notice, posts its other entries, and scores 0",
    ],
  ],
  [
    "witness.test.ts",
    [
      "[Q-20] [keyboard] a Text Entry's pattern-mask refuses a mismatching entry with the author's message, and a matching one is accepted and scores 1",
      "[Q-5] [keyboard] Item_QTI3_WritingPostcard_02 posts the text typed into each xhtml Extended Text, as typed",
      "[Q-2] [keyboard] shuffled corpus Choices keep their order across a refused post with one instance and seed, and the presented choices post",
      "[Q-2] [I-9b] [keyboard] a shuffled corpus Choice posts the presented choice and scores it by identifier: ChoiceA, presented second, scores 1",
      "[Q-2] [I-9b] [keyboard] a ccPackage CC2_match item scores 1 by keyboard",
      "[Q-5] [keyboard] a hand-built ordered Extended Text posts its ordered value: in order it scores 1, reversed 0",
    ],
  ],
]);

/**
 * A test's title: the string literal that opens an `it(…)` or `test(…)` call, modifiers included.
 */
const titlePattern =
  /\b(?:it|test)(?:\.[A-Za-z]+)*\(\s*(?<quote>["'`])(?<title>(?:\\.|(?!\k<quote>)[^\\])*)\k<quote>/gu;

/**
 * The titles of every test in `file`, a path under `src/`, read as text.
 */
const titlesIn = (file: string): readonly string[] =>
  Array.from(
    readFileSync(new URL(import.meta.resolve(`#plate/${file}`)), "utf-8").matchAll(titlePattern),
    (match) => match.groups?.["title"] ?? "",
  );

describe("the [keyboard] token", () => {
  it("is on every test listed as completing an item through keyboardWalk", () => {
    for (const [file, listed] of walks) {
      const titles = titlesIn(file);

      for (const title of listed) {
        assert.include(title, "[keyboard]", `${file}: the listed title carries the token`);
        assert.include(titles, title, `${file}: a test is titled as listed`);
      }
    }
  });

  it("is on no test the list does not name", () => {
    for (const [file, listed] of walks) {
      assert.deepStrictEqual(
        titlesIn(file).filter((title) => title.includes("[keyboard]")),
        listed,
        `${file}: the tagged titles are the listed ones, in order`,
      );
    }
  });
});
