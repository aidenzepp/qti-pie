import { assert, describe, it } from "@effect/vitest";
import { locales, message, numeral } from "#plate/messages.ts";
import type { MessageKey } from "#plate/messages.ts";

/**
 * A value for every placeholder any key's text has.
 */
const sample = {
  count: "2",
  feature: "pattern-mask",
  intent: "Submit part",
  item: "Item 1",
  n: "1",
  score: "3",
  state: "Scored",
  test: "Fractions",
  title: "Fractions",
};

/**
 * Every key's English text with {@link sample} filled in: the catalog the renderer must write.
 */
const english = {
  answer: "Answer",
  answerOf: "Answer 1 of 2",
  answering: "Answering",
  atLeast: "Select at least 1.",
  atLeastOneString: "Enter at least 1 answer.",
  atLeastStrings: "Enter at least 1 answers.",
  atMost: "Select at most 1.",
  atMostOneString: "Enter at most 1 answer.",
  atMostStrings: "Enter at most 1 answers.",
  choiceOf: "Choice 1 of 2",
  confirm: "Confirm",
  confirmList: "Unanswered or unsubmitted items",
  confirmTitle: "Confirm: Submit part, Fractions",
  downloadResults: "Download results (XML)",
  endOfPart: "This is the last item in this part. End the part to go on.",
  endPart: "End part",
  finished: "Finished",
  item: "Item 1",
  itemAnswered: "answered",
  itemClosed: "closed",
  itemNotAnswered: "not answered",
  itemOf: "Item 1 of 2",
  itemState: "Item 1, Scored",
  itemSubmitted: "submitted",
  malformedFile: "Enter text, not a file.",
  malformedNumber: "Enter a number.",
  malformedSingleMany: "Enter one answer.",
  nextItem: "Next item",
  notAccepted: "Not accepted",
  notice: "Not supported here: pattern-mask",
  partSubmitted: "Part submitted",
  patternMismatch: "Enter an answer in the form this question asks for.",
  previousItem: "Previous item",
  responseRecorded: "Response recorded",
  resume: "Resume: Fractions, Item 1 of 2",
  return: "Return",
  review: "Review",
  reviewItem: "Review: Item 1",
  reviewNotAllowed: "review not allowed",
  score: "Score: 3",
  scored: "Scored",
  selectPrompt: "Select an answer",
  skippingNotAllowed: "Answer this item before you submit it.",
  solution: "Solution",
  solutionItem: "Solution: Item 1",
  solutionNotAllowed: "solution not allowed",
  submit: "Submit",
  submitAnswer: "Submit answer",
  submitPart: "Submit part",
  testFinished: "Test finished",
  testNavigation: "Test navigation",
  title: "Scored: Fractions",
  unknownChoice: "Choose one of the listed options.",
} satisfies Record<MessageKey, string>;

/**
 * Decide whether a string is a message key.
 *
 * @param name The candidate key.
 * @returns Whether {@link english}, which has exactly the message keys, has `name` as its own key.
 */
const isMessageKey = (name: string): name is MessageKey => Object.hasOwn(english, name);

/**
 * Every message key, once.
 */
const keys = Object.keys(english).filter(isMessageKey);

describe("message", () => {
  it("has en text for every key", () => {
    for (const key of keys) {
      assert.strictEqual(message("en", key, sample), english[key], key);
    }
  });

  it("fills every placeholder of every key from sample params", () => {
    for (const key of keys) {
      assert.notInclude(message("en", key, sample), "{", key);
    }
  });

  it("writes answerOf with its n and count", () => {
    assert.strictEqual(message("en", "answerOf", { count: "2", n: "1" }), "Answer 1 of 2");
  });

  it("writes choiceOf with its n and count", () => {
    assert.strictEqual(message("en", "choiceOf", { count: "4", n: "2" }), "Choice 2 of 4");
  });

  it("[Q-12] writes selectPrompt, an Inline Choice's placeholder text when it has no data-prompt", () => {
    assert.strictEqual(message("en", "selectPrompt"), "Select an answer");
  });

  it("writes patternMismatch, the pattern-mask message a locale gives", () => {
    assert.strictEqual(
      message("en", "patternMismatch"),
      "Enter an answer in the form this question asks for.",
    );
  });

  it("writes atLeastStrings and atMostStrings, an Extended Text container's counts, with their n", () => {
    assert.strictEqual(message("en", "atLeastStrings", { n: "3" }), "Enter at least 3 answers.");
    assert.strictEqual(message("en", "atMostStrings", { n: "5" }), "Enter at most 5 answers.");
  });

  it("writes atLeastOneString and atMostOneString, the singular a count of 1 takes", () => {
    assert.strictEqual(message("en", "atLeastOneString"), "Enter at least 1 answer.");
    assert.strictEqual(message("en", "atMostOneString"), "Enter at most 1 answer.");
  });

  it("writes a key with no placeholder without params", () => {
    assert.strictEqual(message("en", "submit"), "Submit");
  });

  it("gives each string text control refusal its own text, apart from the number and status ones", () => {
    const texts = [
      message("en", "malformedFile"),
      message("en", "malformedSingleMany"),
      message("en", "malformedNumber"),
      message("en", "notAccepted"),
    ];

    assert.strictEqual(new Set(texts).size, texts.length);
  });

  it("writes an item navigation button's label: its position, then its state in words", () => {
    const states = {
      answered: message("en", "itemAnswered"),
      closed: message("en", "itemClosed"),
      "not-answered": message("en", "itemNotAnswered"),
      submitted: message("en", "itemSubmitted"),
    };
    const item = message("en", "itemOf", { count: "6", n: "3" });

    assert.deepStrictEqual(states, {
      answered: "answered",
      closed: "closed",
      "not-answered": "not answered",
      submitted: "submitted",
    });
    assert.strictEqual(item, "Item 3 of 6");
    assert.strictEqual(
      message("en", "itemState", { item, state: states.answered }),
      "Item 3 of 6, answered",
    );
  });

  it("writes the test navigation's landmark and button labels", () => {
    assert.deepStrictEqual(
      [
        message("en", "testNavigation"),
        message("en", "previousItem"),
        message("en", "nextItem"),
        message("en", "submitAnswer"),
        message("en", "submitPart"),
        message("en", "endPart"),
      ],
      ["Test navigation", "Previous item", "Next item", "Submit answer", "Submit part", "End part"],
    );
  });

  it("writes the four new Status headings under the keys StatusInput's heading names", () => {
    assert.deepStrictEqual(
      [
        message("en", "review"),
        message("en", "solution"),
        message("en", "partSubmitted"),
        message("en", "testFinished"),
      ],
      ["Review", "Solution", "Part submitted", "Test finished"],
    );
  });

  it("writes every title state into title, the summary page's title among them", () => {
    const states = [
      "answering",
      "notAccepted",
      "partSubmitted",
      "review",
      "solution",
      "finished",
    ] as const;

    assert.deepStrictEqual(
      states.map((state) =>
        message("en", "title", { state: message("en", state), title: "Fractions" }),
      ),
      [
        "Answering: Fractions",
        "Not accepted: Fractions",
        "Part submitted: Fractions",
        "Review: Fractions",
        "Solution: Fractions",
        "Finished: Fractions",
      ],
    );
  });

  it("writes the confirm page's title with its intent and test, and an item of its list", () => {
    assert.strictEqual(
      message("en", "confirmTitle", { intent: message("en", "submitPart"), test: "Fractions" }),
      "Confirm: Submit part, Fractions",
    );
    assert.strictEqual(
      message("en", "itemState", {
        item: message("en", "item", { n: "2" }),
        state: message("en", "itemNotAnswered"),
      }),
      "Item 2, not answered",
    );
    assert.deepStrictEqual(
      [message("en", "confirmList"), message("en", "confirm"), message("en", "return")],
      ["Unanswered or unsubmitted items", "Confirm", "Return"],
    );
  });

  it("writes the summary page's links and the words for a link it does not give", () => {
    assert.deepStrictEqual(
      [
        message("en", "reviewItem", { n: "3" }),
        message("en", "solutionItem", { n: "3" }),
        message("en", "reviewNotAllowed"),
        message("en", "solutionNotAllowed"),
        message("en", "downloadResults"),
      ],
      [
        "Review: Item 3",
        "Solution: Item 3",
        "review not allowed",
        "solution not allowed",
        "Download results (XML)",
      ],
    );
  });

  it("writes a session's Resume link with its test, n and count", () => {
    assert.strictEqual(
      message("en", "resume", { count: "5", n: "2", test: "Fractions" }),
      "Resume: Fractions, Item 2 of 5",
    );
  });

  it("gives skipping-not-allowed and end-of-part each their own text, apart from notAccepted", () => {
    const texts = [
      message("en", "skippingNotAllowed"),
      message("en", "endOfPart"),
      message("en", "notAccepted"),
    ];

    assert.strictEqual(new Set(texts).size, texts.length);
  });

  it("refuses, in its type, a call that leaves a placeholder unfilled", () => {
    // @ts-expect-error: answerOf's text has {n} and {count}, so its params are required.
    assert.strictEqual(message("en", "answerOf"), "Answer {n} of {count}");
    // @ts-expect-error: answerOf's params need count beside n.
    assert.strictEqual(message("en", "answerOf", { n: "1" }), "Answer 1 of {count}");
    assert.strictEqual(
      // @ts-expect-error: confirmTitle's params need test beside intent.
      message("en", "confirmTitle", { intent: "End part" }),
      "Confirm: End part, {test}",
    );
  });
});

describe("numeral", () => {
  it("writes a number and a bigint as the locale writes numbers", () => {
    assert.strictEqual(numeral("en", 3), "3");
    assert.strictEqual(numeral("en", 12_000), "12,000");
    assert.strictEqual(numeral("en", 12_000n), "12,000");
  });

  it("writes a bigint beyond 2^53 exactly", () => {
    assert.strictEqual(numeral("en", 9_007_199_254_740_993n), "9,007,199,254,740,993");
  });
});

describe("locales", () => {
  it("is en alone", () => {
    assert.deepStrictEqual(locales, ["en"]);
  });
});
