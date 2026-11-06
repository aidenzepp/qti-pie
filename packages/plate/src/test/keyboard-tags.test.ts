import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";

/**
 * The tests that walk an item by keys, by test file relative to the package directory, each title
 * as written, a `${…}` placeholder included. A walk is `keyboardWalk` in Node, directly or through
 * a helper that walks, such as `src/vertical.test.ts`'s `complete`, or Playwright's keyboard in a
 * browser test. Each one carries the `[keyboard]` token after its last ID token, and
 * no other test or `describe` block in any test file carries it, so the ledger lists only these as
 * keyboard tests.
 */
/* oxlint-disable eslint/no-template-curly-in-string -- a browser test's title is a template literal, and this list holds it as written, so its `${…}` placeholders are text to match, never to interpolate. */
const walks: ReadonlyMap<string, readonly string[]> = new Map([
  [
    "src/delivery.test.ts",
    [
      "[T-4] [T-7] [T-14] [S-0] [S-7] [keyboard] BGtest.xml, nonlinear and individual: each item answered by keys and submitted alone, Previous and an item button move between items, End part closes the test, and the scores are 1, 1, 1, 0, 1 and 0",
      "[T-4] [T-7] [T-14] [S-0] [S-7] [keyboard] CASE, linear and individual with max-attempts 2: a wrong first attempt scores 0 and leaves the item open, the second scores 1, Next submits each later item, the last Next closes the test, and the scores are 1, 1 and 1",
      "[T-4] [T-7] [T-11] [T-14] [S-0] [S-7] [keyboard] the fixture's two parts, P1 nonlinear and simultaneous then P2 linear and simultaneous: answers saved by Next, Previous and an item button, each part submitted whole, the shuffled Choice restored in its order, and the scores are 1, 1, 2, none and 1",
      "[keyboard] OD-2: two items of one session share a test-built form, and partition keeps each item's entries apart, so each decodes and scores its own",
    ],
  ],
  [
    "src/dev/keyboard-choice.browser.test.ts",
    [
      "[Q-2] [keyboard] Tab order: ${label}'s item form, from its first control to its Submit, is the Node walk's tabOrder",
      "[Q-2] [keyboard] Arrows: in ${label}'s radio group, ArrowDown and ArrowRight check the next radio, and ArrowUp and ArrowLeft the previous one",
      "[Q-2] [keyboard] Space checks ${label}'s focused radio",
      "[Q-2] [keyboard] ${label} answered by keys: its correct radio checked, Enter on Submit, scores 1",
      "[Q-2] [keyboard] Space ticks and unticks BG008's focused checkbox",
      "[Q-2] [keyboard] BG008 answered by keys: its correct choices ticked, Enter on Submit, scores 1",
      "[Q-2] [keyboard] BG008 over-ticked by keys: four of five ticked against max-choices 3, Enter on Submit, says at most 3",
    ],
  ],
  [
    "src/dev/keyboard-inline-choice.browser.test.ts",
    [
      "[Q-12] [keyboard] Tab order: QTI3-inline-choice.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      "[Q-12] [keyboard] QTI3-inline-choice.xml answered by keys: Tab to the select, type Y, Tab to Submit and Enter choose York and score 1",
      "[Q-12] [keyboard] Tab order: inline.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      '[Q-12] [keyboard] inline.xml answered by keys: Submit with nothing chosen shows "Pick a planet first." in the Status region and keeps the shuffled order, "None of these" last; then J typed and Submit record Jupiter, scoring 1, with RESPONSE2 left NULL',
    ],
  ],
  [
    "src/dev/keyboard-text.browser.test.ts",
    [
      "${tag} [keyboard] Tab order: ${label}'s item form, from its first control to its Submit, is the Node walk's tabOrder",
      "[Q-20] [keyboard] BG010 answered by keys: Tab to the Text Entry, type York, Enter submits the form and scores 1",
      "[Q-5] [keyboard] ${essay.label} answered by keys: a line, Enter, a second line, Tab to Submit and Enter record the response, and the restored textarea holds both lines",
      "[Q-5] [keyboard] Tab order: ordered.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      "[Q-5] [keyboard] ordered.xml answered by keys: Tab moves through its three Controls in order, two filled, Enter on Submit records the response, and the restored Controls hold the two in order",
      '[Q-20] [keyboard] pattern-mask: ${probe.label} refuses "${probe.mismatch}" typed by keys with its pattern message',
      '[Q-20] [keyboard] pattern-mask: ${probe.label} accepts "${probe.match}" typed by keys',
    ],
  ],
  [
    "src/dev/page.test.ts",
    [
      "[Q-2] [keyboard] BG007 completes in the playground: its form walked by keys, posted, and scored 1",
      "[Q-20] [keyboard] BG010 completes in the playground: York typed, posted, and scored 1",
      "[Q-5] [keyboard] BG011 completes in the playground: past the video, its answer typed, posted, and the response recorded",
    ],
  ],
  [
    "src/dev/session-keyboard.browser.test.ts",
    [
      "[T-4] [keyboard] P1 completed by keys alone: each item answered, Enter on Next between them, Enter on Submit part, and Enter on Confirm on the confirm page, which lists the three answered; P2's first item follows with the Part submitted Status focused",
    ],
  ],
  [
    "src/dev/walk.browser.test.ts",
    [
      "[Q-2] [keyboard] BG007 by keys alone: Tab into the group, Space on True, Tab to Submit, Enter, scores 1",
    ],
  ],
  [
    "src/interactions/choice.test.ts",
    [
      "[Q-2] [keyboard] names every Control by the payload's form name, the author's when given",
      "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the second choice",
      "[Q-2] [keyboard] a checkbox walk posts the selected set",
      "[Q-2] [keyboard] checks the value decoded under the caller's entry name, the author's form name included, and accepts NULL",
    ],
  ],
  [
    "src/interactions/extended-text.test.ts",
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
    "src/interactions/inline-choice.witness.test.ts",
    [
      "[Q-12] [I-9b] [keyboard] QTI3-inline-choice.xml by keyboard: Tab, type Y, Tab and Enter choose York and score 1, Lancaster 0, and no choice posts the Placeholder and scores 0",
      "[Q-12] [keyboard] multi-input.xml's shuffled Inline Choice keeps choiceOrder's order, its fixed choice first, across a refused post with one instance and seed, and Marion typed on the refused page posts A2",
      "[Q-12] [keyboard] a host Option replacement that selects C, with nothing restored, leaves the Placeholder selected: Tab then Enter posts its empty value, not C, and the record holds no response",
    ],
  ],
  [
    "src/interactions/text-entry.test.ts",
    [
      "[Q-20] [keyboard] a keyboard walk (Tab, type York, Enter) posts York under the Control's name",
      "[Q-20] [keyboard] names the Control by the author's form name when names gives one",
    ],
  ],
  [
    "src/render.test.ts",
    [
      "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the presented second choice",
    ],
  ],
  [
    "src/vertical.test.ts",
    [
      "[Q-2] [I-9b] [keyboard] BG007 by keyboard: true scores 1, false 0, none 0",
      "[Q-20] [I-9b] [keyboard] BG010 by keyboard: YORK and york give 0.5, Paris and none 0",
      "[Q-5] [keyboard] BG011 by keyboard, past the video: the response is recorded, not scored",
      "[I-9b] [keyboard] the hotspot item shows one notice, posts its other entries, and scores 0",
    ],
  ],
  [
    "src/witness.test.ts",
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
/* oxlint-enable eslint/no-template-curly-in-string */

/**
 * Write a pattern for text whose parentheses balance, nested to a depth.
 *
 * @param depth How deep the parentheses may nest.
 * @returns The pattern's source, which matches no unbalanced `(` or `)`.
 */
const balanced = (depth: number): string =>
  depth === 0 ? "[^()]*" : String.raw`(?:[^()]|\(${balanced(depth - 1)}\))*`;

/**
 * A test's title: the string literal that opens a `describe(…)`, `it(…)` or `test(…)` call, or an
 * `.effect(…)` call on the `it` an `it.layer(…)` scope hands its callback (`walk.effect(…)` in a
 * browser test), modifiers included. A curried `.each(table)(…)` call gives the title of its second
 * call, its table's parentheses nested up to eight deep. A `describe` title counts because the
 * ledger reads the token in a test's full name, which holds the titles of the `describe` blocks
 * around it.
 */
const titlePattern = new RegExp(
  String.raw`\b(?:describe|it|test|[a-z][A-Za-z]*(?=\.effect\b))(?:\.[A-Za-z]+)*(?:(?<=\.each)\(${balanced(8)}\))?\(\s*(?<quote>["'\x60])(?<title>(?:\\.|(?!\k<quote>)[^\\])*)\k<quote>`,
  "gu",
);

/**
 * The package directory, `packages/plate`.
 */
const packageDirectory = fileURLToPath(new URL("../", import.meta.resolve("#plate/index.ts")));

/**
 * Every test file the package's tests run, under `src/` and `scripts/`, browser files included,
 * relative to the package directory with `/` separators, sorted.
 */
const testFiles: readonly string[] = ["scripts", "src"]
  .flatMap((folder) =>
    readdirSync(path.join(packageDirectory, folder), { recursive: true })
      .map((entry) => `${folder}/${String(entry).split(path.sep).join("/")}`)
      .filter((file) => file.endsWith(".test.ts")),
  )
  .toSorted();

/**
 * The titles of every test and `describe` block in `file`, a path relative to the package
 * directory, read as text.
 */
const titlesIn = (file: string): readonly string[] =>
  Array.from(
    readFileSync(path.join(packageDirectory, file), "utf-8").matchAll(titlePattern),
    (match) => match.groups?.["title"] ?? "",
  );

describe("the keyboard token", () => {
  it("is on every test listed as walking an item by keys", () => {
    for (const [file, listed] of walks) {
      const titles = titlesIn(file);

      for (const title of listed) {
        assert.include(title, "[keyboard]", `${file}: the listed title carries the token`);
        assert.include(titles, title, `${file}: a test is titled as listed`);
      }
    }
  });

  it("is on no test or describe block the list does not name, in any test file under src/ or scripts/", () => {
    assert.includeMembers([...testFiles], [...walks.keys()], "every listed file is a test file");
    for (const file of testFiles) {
      assert.deepStrictEqual(
        titlesIn(file).filter((title) => title.includes("[keyboard]")),
        walks.get(file) ?? [],
        `${file}: the tagged titles are the listed ones, in order`,
      );
    }
  });
});
