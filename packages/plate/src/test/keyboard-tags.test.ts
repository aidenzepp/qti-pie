import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";

/**
 * The tests that complete an item through `keyboardWalk`, by file under `src/`, each title as
 * written: a walk directly, or `src/vertical.test.ts`'s helper `complete`, which walks. Each one
 * carries the `[keyboard]` token after its last ID token (spec §4.10).
 */
const walks: ReadonlyMap<string, readonly string[]> = new Map([
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
    "vertical.test.ts",
    [
      "[Q-2] [I-9b] [keyboard] BG007 by keyboard: true scores 1, false 0, none 0",
      "[Q-20] [I-9b] [keyboard] BG010 by keyboard: YORK and york give 0.5, Paris and none 0",
      "[Q-5] [keyboard] BG011 by keyboard, past the video: the response is recorded, not scored",
      "[I-9b] [keyboard] the hotspot item shows one notice, posts its other entries, and scores 0",
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
