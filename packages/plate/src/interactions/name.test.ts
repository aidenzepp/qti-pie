import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { authoredId } from "#plate/emit/parts.ts";
import {
  authorsName,
  givesText,
  resolvedLabelledby,
  textControlName,
} from "#plate/interactions/name.ts";
import { message } from "#plate/messages.ts";
import type { BodyNode } from "#plate/model/item.ts";
import type { PayloadNode } from "#plate/payload.ts";

/**
 * The item instance every name here is scoped by.
 */
const instance = "2b8c4e1f-6d3a-4c7b-9e05-1a2f3b4c5d6e";

/**
 * The authored `aria-label` values that name nothing: empty, and only XML whitespace.
 */
const blanks = ["", "   ", " \t\n\r "];

/**
 * Construct a `span` as the model holds it and as the payload copies it.
 *
 * @param attributes The span's attributes.
 * @param text Its one text.
 * @returns The body node and the payload node.
 */
const span = (
  attributes: readonly { readonly name: string; readonly value: string }[],
  text: string,
): readonly [BodyNode, PayloadNode] => [
  {
    attributes,
    children: [{ kind: "text", text }],
    kind: "element",
    path: "qti-label/span",
    tag: "span",
  },
  { attributes, children: [{ kind: "text", text }], kind: "element", tag: "span" },
];

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

describe("resolvedLabelledby", () => {
  /**
   * The ids the author gave the item's elements.
   */
  const ids: ReadonlySet<string> = new Set(["hint", "intro"]);

  it("keeps the ids an element of the item carries, in the author's order, and drops the others", () => {
    assert.deepStrictEqual(
      resolvedLabelledby({ ariaLabelledby: Option.some(" nope intro\tmissing hint ") }, ids),
      Option.some("intro hint"),
    );
  });

  it("gives none when no id names an element of the item, or the author named no id", () => {
    for (const value of ["nope", "nope missing", "", " \t\n "]) {
      assert.deepStrictEqual(
        resolvedLabelledby({ ariaLabelledby: Option.some(value) }, ids),
        Option.none(),
        JSON.stringify(value),
      );
    }

    assert.deepStrictEqual(
      resolvedLabelledby({ ariaLabelledby: Option.none() }, ids),
      Option.none(),
    );
  });
});

describe("givesText", () => {
  it("[Q-12] reads a Label's body nodes as it reads the payload nodes copied from them", () => {
    const cases: readonly (readonly [
      string,
      readonly BodyNode[],
      readonly PayloadNode[],
      boolean,
    ])[] = [
      ["empty", [], [], false],
      ["blank text", [{ kind: "text", text: " \t\n" }], [{ kind: "text", text: " \t\n" }], false],
      ["text", [{ kind: "text", text: "River" }], [{ kind: "text", text: "River" }], true],
      [
        "an aria-hidden span",
        [span([{ name: "aria-hidden", value: "true" }], "River")[0]],
        [span([{ name: "aria-hidden", value: "true" }], "River")[1]],
        false,
      ],
      [
        "a span's aria-label",
        [span([{ name: "aria-label", value: "River" }], " ")[0]],
        [span([{ name: "aria-label", value: "River" }], " ")[1]],
        true,
      ],
      [
        "an unsupported part, the notice it is copied into",
        [{ feature: "qti-printed-variable", kind: "unsupported", path: "qti-label/x" }],
        [{ feature: "qti-printed-variable", kind: "notice" }],
        true,
      ],
    ];

    for (const [name, body, copied, expected] of cases) {
      assert.strictEqual(givesText(body), expected, name);
      assert.strictEqual(givesText(copied), expected, name);
    }
  });
});
