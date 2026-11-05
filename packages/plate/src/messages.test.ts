import { assert, describe, it } from "@effect/vitest";
import { locales, message } from "#plate/messages.ts";
import type { MessageKey } from "#plate/messages.ts";

/**
 * A value for every placeholder any key's text has.
 */
const sample = {
  count: "2",
  feature: "pattern-mask",
  n: "1",
  score: "3",
  state: "Scored",
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
  malformedFile: "Enter text, not a file.",
  malformedNumber: "Enter a number.",
  malformedSingleMany: "Enter one answer.",
  notAccepted: "Not accepted",
  notice: "Not supported here: pattern-mask",
  patternMismatch: "Enter an answer in the form this question asks for.",
  responseRecorded: "Response recorded",
  score: "Score: 3",
  scored: "Scored",
  submit: "Submit",
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

  it("refuses, in its type, a call that leaves a placeholder unfilled", () => {
    // @ts-expect-error: answerOf's text has {n} and {count}, so its params are required.
    assert.strictEqual(message("en", "answerOf"), "Answer {n} of {count}");
    // @ts-expect-error: answerOf's params need count beside n.
    assert.strictEqual(message("en", "answerOf", { n: "1" }), "Answer 1 of {count}");
  });
});

describe("locales", () => {
  it("is en alone", () => {
    assert.deepStrictEqual(locales, ["en"]);
  });
});
