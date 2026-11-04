import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";

/**
 * The Status region the item chrome places before the Form: focusable by script only.
 */
const status = h("div", { "data-slot": rowFor("item", "status").slot, tabindex: "-1" });

/**
 * Build the Submit button.
 *
 * @param attrs Attributes merged over the button's defaults.
 * @returns The Submit part.
 */
const submitButton = (attrs: Attributes = {}): Element =>
  h("button", { "data-slot": rowFor("item", "submit").slot, type: "submit", ...attrs }, [
    text("Submit"),
  ]);

/**
 * Build an item around some controls: the Status region, then a Form holding the controls and the
 * Submit after them.
 *
 * @param controls The nodes the Form holds before its Submit.
 * @param submit The Submit, enabled by default.
 * @returns The item's root.
 */
const item = (controls: readonly Node[], submit: Element = submitButton()): Element =>
  h("div", { "data-slot": rowFor("item", "root").slot, lang: "en" }, [
    status,
    h("form", { "data-slot": rowFor("item", "form").slot, method: "post" }, [...controls, submit]),
  ]);

/**
 * Build one input of a Choice: a radio or a checkbox in the `RESPONSE` group.
 *
 * @param type The input's type.
 * @param value The choice identifier it posts.
 * @param attrs Attributes merged over the input's defaults.
 * @returns The input.
 */
const option = (type: "checkbox" | "radio", value: string, attrs: Attributes = {}): Element =>
  h("input", { name: "q1-RESPONSE", type, value, ...attrs });

/**
 * Build a Choice group Root holding its inputs: a native `fieldset`, with no role.
 *
 * @param inputs The radios or checkboxes.
 * @returns The interaction Root.
 */
const group = (inputs: readonly Element[]): Element =>
  h("fieldset", { "data-slot": rowFor("choice-interaction", "root").slot }, inputs);

describe("tabOrder", () => {
  it("gives one stop per radio group, at its checked radio, and skips tabindex -1 and disabled controls", () => {
    const [a, b, c] = [
      option("radio", "A"),
      option("radio", "B", { checked: true }),
      option("radio", "C"),
    ];
    const [x, y] = [
      h("input", { name: "q1-OTHER", type: "radio", value: "X" }),
      h("input", { name: "q1-OTHER", type: "radio", value: "Y" }),
    ];
    const answer = h("input", { name: "q1-ANSWER", type: "text" });
    const disabled = h("input", { disabled: true, name: "q1-OFF", type: "text" });
    const skipped = h("span", { tabindex: "-1" }, [text("Skipped")]);
    const submit = submitButton();
    const tree = item([group([a, b, c]), group([x, y]), skipped, disabled, answer], submit);

    assert.deepStrictEqual(tabOrder(tree), [b, x, answer, submit]);
  });
});

describe("keyboardWalk", () => {
  it("radios: Tab, ArrowDown, Tab, Enter posts the second radio's value", () => {
    const tree = item([group([option("radio", "A"), option("radio", "B"), option("radio", "C")])]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "ArrowDown", "Tab", "Enter"]),
      Option.some([["q1-RESPONSE", "B"]]),
    );
  });

  it("radios: arrows wrap within the group, and Tab enters the group at its checked radio", () => {
    const radios = [
      option("radio", "A"),
      option("radio", "B", { checked: true }),
      option("radio", "C"),
    ];
    const tree = item([group(radios)]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "ArrowRight", "ArrowDown", "Tab", "Space"]),
      Option.some([["q1-RESPONSE", "A"]]),
    );
    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "ArrowUp", "ArrowLeft", "Tab", "Enter"]),
      Option.some([["q1-RESPONSE", "C"]]),
    );
  });

  it("a checkbox group: Tab, Space, Tab, Tab, Space, Tab, Enter posts both values", () => {
    const tree = item([
      group([option("checkbox", "A"), option("checkbox", "B"), option("checkbox", "C")]),
    ]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "Space", "Tab", "Tab", "Space", "Tab", "Enter"]),
      Option.some([
        ["q1-RESPONSE", "A"],
        ["q1-RESPONSE", "C"],
      ]),
    );
  });

  it("a text input: Tab, typing, Enter posts the typed text", () => {
    const tree = item([h("input", { name: "q1-RESPONSE", type: "text" })]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", { type: "York" }, "Enter"]),
      Option.some([["q1-RESPONSE", "York"]]),
    );
  });

  it("a text input: Enter does not submit while the Submit is disabled", () => {
    const tree = item(
      [h("input", { name: "q1-RESPONSE", type: "text" })],
      submitButton({ disabled: true }),
    );

    assert.isTrue(Option.isNone(keyboardWalk(tree, ["Tab", { type: "York" }, "Enter"])));
  });

  it("a textarea: Enter adds a line, posted as CRLF", () => {
    const tree = item([h("textarea", { name: "q1-ESSAY" })]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", { type: "a" }, "Enter", { type: "b" }, "Tab", "Enter"]),
      Option.some([["q1-ESSAY", "a\r\nb"]]),
    );
  });

  it("Shift+Tab moves back along the tab order", () => {
    const tree = item([
      h("input", { name: "q1-FIRST", type: "text" }),
      h("input", { name: "q1-SECOND", type: "text" }),
    ]);

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "Tab", "Shift+Tab", { type: "x" }, "Enter"]),
      Option.some([
        ["q1-FIRST", "x"],
        ["q1-SECOND", ""],
      ]),
    );
  });

  it("a disabled control posts nothing", () => {
    const tree = item([
      h("input", {
        checked: true,
        disabled: true,
        name: "q1-CHOICE",
        type: "checkbox",
        value: "A",
      }),
      h("input", { disabled: true, name: "q1-RESPONSE", type: "text", value: "York" }),
    ]);

    assert.deepStrictEqual(keyboardWalk(tree, ["Tab", "Enter"]), Option.some([]));
  });

  it("starts at the autofocus element and posts the initial state in tree order", () => {
    const tree = item(
      [
        group([option("radio", "A"), option("radio", "B", { checked: true })]),
        h("input", { checked: true, name: "q1-AGREE", type: "checkbox" }),
        h("input", { checked: true, type: "checkbox", value: "nameless" }),
        h("input", { name: "q1-CITY", type: "text", value: "York" }),
        h("textarea", { name: "q1-ESSAY" }, [text("one\ntwo")]),
      ],
      submitButton({ autofocus: true }),
    );

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Enter"]),
      Option.some([
        ["q1-RESPONSE", "B"],
        ["q1-AGREE", "on"],
        ["q1-CITY", "York"],
        ["q1-ESSAY", "one\r\ntwo"],
      ]),
    );
  });

  it("keys that never submit give none", () => {
    const tree = item([group([option("radio", "A"), option("radio", "B")])]);

    assert.isTrue(Option.isNone(keyboardWalk(tree, [])));
    assert.isTrue(Option.isNone(keyboardWalk(tree, ["Tab", "ArrowDown", "Enter", "Tab"])));
  });
});
