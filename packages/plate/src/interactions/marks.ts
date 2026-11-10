/**
 * The Marks a `review` render writes against the item's correct responses, which the author passes
 * as `render`'s `solution`: what each Mark part says, for a Choice's choice and beside a Text
 * Entry's or an Inline Choice's Control.
 *
 * A Mark carries its mark as `data-answer` and holds words, which a screen reader reads where the
 * eye reads the ✓ or ✗ the stylesheet draws on `data-answer`, so colour is never the only signal
 * (WCAG 1.4.1). This is a browser module: it value-imports from `effect` only `Option`.
 *
 * @module
 */
import { Option } from "effect";
import { message } from "#plate/messages.ts";
import type { Locale, MessageKey } from "#plate/messages.ts";
import type { AnswerMark, ControlMarks } from "#plate/payload.ts";

/**
 * The words of each mark that names no answer: the candidate's answer, right or wrong, and a
 * Choice's right choice the candidate did not pick, whose content is the answer.
 */
const markWords = {
  missed: "markMissed",
  right: "markRight",
  wrong: "markWrong",
} as const satisfies Readonly<Record<AnswerMark, MessageKey>>;

/**
 * One Mark as an interaction writes it: the mark its `data-answer` carries, and its words.
 */
export interface Mark {
  readonly answer: AnswerMark;
  readonly words: string;
}

/**
 * Give the Mark of one mark that names no answer, as a Choice's choice carries it.
 *
 * @param answer The mark.
 * @param locale The locale of the renderer's own text.
 * @returns The Mark: "Your answer, right", "Your answer, wrong" or "Right answer" in English.
 */
export const markOf = (answer: AnswerMark, locale: Locale): Mark => ({
  answer,
  words: message(locale, markWords[answer]),
});

/**
 * Give the Marks a `review` render writes beside a Text Entry's or an Inline Choice's Control, in
 * order: the answer's own, then the right answer's, which names it ("Right answer: 2").
 *
 * @param marks The payload's marks of the interaction.
 * @param answerText Write the right answer as the page shows it, from the payload's `missed`: a
 *   Text Entry's text as it is, an Inline Choice's choice identifier as its option's text.
 * @param locale The locale of the renderer's own text.
 * @returns The Marks, none when the payload marks nothing.
 */
export const controlMarks = (
  marks: ControlMarks,
  answerText: (missed: string) => string,
  locale: Locale,
): readonly Mark[] => [
  ...Option.toArray(marks.given).map((answer) => markOf(answer, locale)),
  ...Option.toArray(marks.missed).map((missed): Mark => ({
    answer: "missed",
    words: message(locale, "markMissedAnswer", { answer: answerText(missed) }),
  })),
];
