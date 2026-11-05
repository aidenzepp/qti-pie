import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { authoredId } from "#plate/emit/parts.ts";
import { authorsName, textControlName } from "#plate/interactions/name.ts";
import { message } from "#plate/messages.ts";

/**
 * The item instance every name here is scoped by.
 */
const instance = "2b8c4e1f-6d3a-4c7b-9e05-1a2f3b4c5d6e";

/**
 * The authored `aria-label` values that name nothing: empty, and only XML whitespace.
 */
const blanks = ["", "   ", " \t\n\r "];

describe("authorsName", () => {
  it("writes no aria-label for an authored one that is empty or blank", () => {
    for (const label of blanks) {
      assert.deepStrictEqual(
        authorsName({ ariaLabel: Option.some(label), ariaLabelledby: Option.none() }, instance),
        {},
        JSON.stringify(label),
      );
      assert.deepStrictEqual(
        authorsName(
          { ariaLabel: Option.some(label), ariaLabelledby: Option.some("intro") },
          instance,
        ),
        { "aria-labelledby": authoredId(instance, "intro") },
        JSON.stringify(label),
      );
    }
  });

  it("writes an aria-label that is not blank as the author wrote it", () => {
    assert.deepStrictEqual(
      authorsName({ ariaLabel: Option.some(" Capital "), ariaLabelledby: Option.none() }, instance),
      { "aria-label": " Capital " },
    );
  });
});

describe("textControlName", () => {
  it("[Q-20] names a Control whose authored aria-label is empty or blank the renderer's way", () => {
    for (const label of blanks) {
      assert.deepStrictEqual(
        textControlName(
          {
            ariaLabel: Option.some(label),
            ariaLabelledby: Option.none(),
            unnamed: Option.some({ count: 2, n: 2 }),
          },
          instance,
          "en",
        ),
        { "aria-label": message("en", "answerOf", { count: "2", n: "2" }) },
        JSON.stringify(label),
      );
    }
  });
});
