import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";

/**
 * The Status region the item chrome places before the host's form: focusable by script only.
 */
const status = h("div", { "data-slot": rowFor("item", "status").slot, tabindex: "-1" });

/**
 * Build the host's submit button, a plain `button` with no marker.
 *
 * @param attrs Attributes merged over the button's defaults.
 * @returns The submit button.
 */
const submitButton = (attrs: Attributes = {}): Element =>
  h("button", { type: "submit", ...attrs }, [text("Submit")]);

/**
 * Build an item around some controls: the Status region, then a plain `form`, as an author
 * composes it, holding the controls and the submit button after them.
 *
 * @param controls The nodes the form holds before its submit button.
 * @param submit The submit button, enabled by default.
 * @returns The item's root.
 */
const item = (controls: readonly Node[], submit: Element = submitButton()): Element =>
  h("div", { "data-slot": rowFor("item", "root").slot, lang: "en" }, [
    status,
    h("form", { method: "post" }, [...controls, submit]),
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

/**
 * Build a native `select` as Inline Choice's Control renders it: its Placeholder, `value=""`, then
 * one `option` per choice.
 *
 * @param choices Each option's text and the `value` it posts, in presented order; an option with
 *   no value posts its text.
 * @param attrs Attributes merged over the select's defaults.
 * @returns The select.
 */
const select = (
  choices: readonly (readonly [string, string | undefined])[],
  attrs: Attributes = {},
): Element =>
  h("select", { autocomplete: "off", name: "q1-RESPONSE", ...attrs }, [
    h("option", { value: "" }, [text("Select an answer")]),
    ...choices.map(([label, value]) =>
      h("option", value === undefined ? {} : { value }, [text(label)]),
    ),
  ]);

/**
 * The three cities Inline Choice's walk fixture offers, each posting its first letter.
 */
const cities = [
  ["Gloucester", "G"],
  ["Lancaster", "L"],
  ["York", "Y"],
] as const;

/**
 * Build an item whose form holds one sentence around a `select`, then the submit button.
 *
 * @param control The select the sentence holds.
 * @returns The item's root.
 */
const sentence = (control: Element): Element =>
  item([h("p", {}, [text("The city on the Ouse is "), control, text(".")])]);

/**
 * Build a bare form holding a sentence around a `select`, a text field after it and some buttons,
 * with nothing around the form.
 *
 * @param buttons The buttons the form ends with.
 * @returns The form.
 */
const noteForm = (buttons: readonly Element[]): Element =>
  h("form", { method: "post" }, [
    h("p", {}, [text("The city on the Ouse is "), select(cities), text(".")]),
    h("input", { name: "q1-NOTE", type: "text" }),
    ...buttons,
  ]);

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

  it("gives a select one stop, in document order, and skips a disabled one", () => {
    const control = select(cities);
    const off = select(cities, { disabled: true, name: "q1-OFF" });
    const submit = submitButton();
    const tree = item([h("p", {}, [text("From "), off, text(" to "), control, text(".")])], submit);

    assert.deepStrictEqual(tabOrder(tree), [control, submit]);
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

  it("a text input: Enter does not submit while the submit button is disabled", () => {
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

describe("keyboardWalk over a select", () => {
  it("Tab, typing Y, Tab, Enter posts York's value", () => {
    assert.deepStrictEqual(
      keyboardWalk(sentence(select(cities)), ["Tab", { type: "Y" }, "Tab", "Enter"]),
      Option.some([["q1-RESPONSE", "Y"]]),
    );
  });

  it("Tab, Tab, Enter with no choice posts the Placeholder's empty value", () => {
    assert.deepStrictEqual(
      keyboardWalk(sentence(select(cities)), ["Tab", "Tab", "Enter"]),
      Option.some([["q1-RESPONSE", ""]]),
    );
  });

  it("a disabled select is no tab stop and posts nothing", () => {
    const tree = sentence(select(cities, { disabled: true }));

    assert.deepStrictEqual(keyboardWalk(tree, ["Tab", { type: "Y" }, "Enter"]), Option.some([]));
  });

  it("Enter on the focused select submits its form with the selected option's value", () => {
    const tree = sentence(select(cities));

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", { type: "Y" }, "Enter"]),
      Option.some([["q1-RESPONSE", "Y"]]),
    );
    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "Enter"]),
      Option.some([["q1-RESPONSE", ""]]),
    );
  });

  it("Enter on the select submits only through the form's first enabled submit button", () => {
    const keys: readonly Key[] = ["Tab", { type: "Y" }, "Enter"];

    assert.isTrue(Option.isNone(keyboardWalk(noteForm([submitButton({ disabled: true })]), keys)));
    assert.isTrue(Option.isNone(keyboardWalk(noteForm([]), keys)));
    assert.deepStrictEqual(
      keyboardWalk(noteForm([submitButton({ disabled: true }), submitButton()]), keys),
      Option.some([
        ["q1-RESPONSE", "Y"],
        ["q1-NOTE", ""],
      ]),
    );
  });

  it("arrows and Space leave the value: they open the list, which the walk does not model", () => {
    const tree = sentence(select(cities));

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "ArrowDown", "ArrowDown", "ArrowUp", "Space", "Enter"]),
      Option.some([["q1-RESPONSE", ""]]),
    );
    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", { type: "Y" }, "ArrowUp", "ArrowDown", "Space", "Enter"]),
      Option.some([["q1-RESPONSE", "Y"]]),
    );
  });

  it("type-ahead: one run matches a prefix, and a pause between runs starts a new search", () => {
    const tree = sentence(select(cities));
    const walk = (keys: readonly Key[]) => keyboardWalk(tree, ["Tab", ...keys, "Enter"]);

    assert.deepStrictEqual(walk([{ type: "y" }]), Option.some([["q1-RESPONSE", "Y"]]));
    assert.deepStrictEqual(walk([{ type: "La" }]), Option.some([["q1-RESPONSE", "L"]]));
    assert.deepStrictEqual(
      walk([{ type: "G" }, { type: "L" }]),
      Option.some([["q1-RESPONSE", "L"]]),
    );
    assert.deepStrictEqual(walk([{ type: "S" }]), Option.some([["q1-RESPONSE", ""]]));
    assert.deepStrictEqual(walk([{ type: "Lx" }]), Option.some([["q1-RESPONSE", "L"]]));
  });

  it("type-ahead: a repeated letter cycles through the options it starts, wrapping", () => {
    const tree = sentence(
      select([
        ["Lancaster", undefined],
        [" leeds ", undefined],
        ["York", undefined],
      ]),
    );
    const walk = (keys: readonly Key[]) => keyboardWalk(tree, ["Tab", ...keys, "Enter"]);

    assert.deepStrictEqual(walk([{ type: "LL" }]), Option.some([["q1-RESPONSE", "leeds"]]));
    assert.deepStrictEqual(
      walk([{ type: "L" }, { type: "L" }, { type: "L" }]),
      Option.some([["q1-RESPONSE", "Lancaster"]]),
    );
  });

  it("starts at the option carrying selected and posts it", () => {
    const tree = sentence(
      h("select", { name: "q1-RESPONSE" }, [
        h("option", { value: "" }, [text("Select an answer")]),
        h("option", { selected: true, value: "G" }, [text("Gloucester")]),
        h("option", { value: "L" }, [text("Lancaster")]),
      ]),
    );

    assert.deepStrictEqual(
      keyboardWalk(tree, ["Tab", "Enter"]),
      Option.some([["q1-RESPONSE", "G"]]),
    );
  });
});
