import { assert, describe, it } from "@effect/vitest";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { checkTree, isFocusable, nameOf, textOf } from "#plate/test/accessibility.ts";
import type { Check } from "#plate/test/accessibility.ts";

/**
 * Build one Choice row as the part table lays it out: `li > [Control, Label > [Indicator, text]]`,
 * the Control named by `aria-labelledby` and the Label pointing back with `for`.
 *
 * @param response The response identifier the row's ids are scoped by.
 * @param key The choice identifier.
 * @param label The choice text.
 * @param control Attributes merged over the Control's defaults.
 * @returns The Choice row.
 */
const choiceRow = (
  response: string,
  key: string,
  label: string,
  control: Attributes = {},
): Element =>
  h("li", { "data-slot": "choice" }, [
    h("input", {
      "aria-labelledby": `q1-${response}-${key}-label`,
      "data-slot": "control",
      id: `q1-${response}-${key}`,
      name: `q1-${response}`,
      type: "radio",
      value: key,
      ...control,
    }),
    h(
      "label",
      { "data-slot": "label", for: `q1-${response}-${key}`, id: `q1-${response}-${key}-label` },
      [h("span", { "aria-hidden": "true", "data-slot": "indicator" }, [text("o")]), text(label)],
    ),
  ]);

/**
 * Build a Choice interaction: a `fieldset` group Root holding a Prompt and the rows' list.
 *
 * @param response The response identifier the Prompt's id is scoped by.
 * @param prompt The Prompt's text.
 * @param rows The Choice rows.
 * @param root The Root's naming attributes, `aria-labelledby` to the Prompt by default.
 * @returns The interaction Root.
 */
const choice = (
  response: string,
  prompt: string,
  rows: readonly Element[],
  root?: Attributes,
): Element =>
  h(
    "fieldset",
    {
      "data-slot": "root",
      role: "group",
      ...(root ?? { "aria-labelledby": `q1-${response}-prompt` }),
    },
    [
      h("qti-prompt", { "data-slot": "prompt", id: `q1-${response}-prompt` }, [text(prompt)]),
      h("ul", { "data-slot": "choices" }, rows),
    ],
  );

/**
 * Build an Extended Text interaction whose Prompt reads "Describe Paris.".
 *
 * @param control The Control's naming attributes.
 * @returns The interaction Root.
 */
const essay = (control: Attributes): Element =>
  h("qti-extended-text-interaction", { "data-slot": "root" }, [
    h("qti-prompt", { "data-slot": "prompt", id: "q1-ESSAY-prompt" }, [text("Describe Paris.")]),
    h("textarea", {
      "data-slot": "control",
      id: "q1-ESSAY",
      name: "q1-ESSAY",
      rows: "6",
      ...control,
    }),
  ]);

/**
 * The item Root's attributes, `lang` among them.
 */
const itemRoot: Attributes = { "data-slot": "item", id: "q1", lang: "en" };

/**
 * Build the item chrome around a Form's children.
 *
 * @param children The Form's children.
 * @param root The item Root's attributes, with `lang` by default.
 * @returns The item Root.
 */
const item = (children: readonly Node[], root: Attributes = itemRoot): Element =>
  h("qti-assessment-item", root, [
    h(
      "form",
      { action: "/attempt", "data-slot": "form", method: "post", novalidate: true },
      children,
    ),
  ]);

/**
 * The Status region with its heading at base level 2.
 */
const status = h(
  "section",
  {
    "aria-labelledby": "q1-status-heading",
    "data-slot": "status",
    id: "q1-status",
    role: "status",
    tabindex: "-1",
  },
  [h("h2", { "data-slot": "status-heading", id: "q1-status-heading" }, [text("Status")])],
);

/**
 * The Submit button, named by its own text.
 */
const submit = h("button", { "data-slot": "submit", type: "submit" }, [text("Submit")]);

/**
 * The positive Choice: a Prompt and two rows.
 */
const capital = choice("RESPONSE", "Which city is the capital of France?", [
  choiceRow("RESPONSE", "A", "Paris"),
  choiceRow("RESPONSE", "B", "London"),
]);

/**
 * Build a BG011-shaped body: an `img` with `alt` and a `video` with two `source`s and a `track`.
 *
 * @param video The `video` element's attributes.
 * @returns The body, its root carrying `lang`.
 */
const sunflower = (video: Attributes): Element =>
  h("qti-item-body", { lang: "en" }, [
    h("p", {}, [h("img", { alt: "A sunflower", src: "images/sunflower.png" })]),
    h("video", video, [
      h("source", { src: "video/sunflower.mp4", type: "video/mp4" }),
      h("source", { src: "video/sunflower.webm", type: "video/webm" }),
      h("track", { kind: "captions", src: "video/sunflower.vtt", srclang: "en" }),
    ]),
  ]);

/**
 * List the checks a tree violates, in the order `checkTree` reports them.
 *
 * @param tree The tree to check.
 * @param baseLevel The heading level the tree's headings start at.
 * @returns The violated checks.
 */
const checksOf = (tree: Element, baseLevel = 2): readonly Check[] =>
  checkTree(tree, { baseLevel }).map((violation) => violation.check);

describe("textOf", () => {
  it("collects descendant text, skipping aria-hidden subtrees, collapsed and trimmed", () => {
    const label = h("label", {}, [
      h("span", { "aria-hidden": "true" }, [text("o")]),
      text("  Paris \n "),
      h("b", {}, [text("France")]),
    ]);
    assert.strictEqual(textOf(label), "Paris France");
  });
});

describe("nameOf", () => {
  it("reads the aria-labelledby targets in the attribute's order before aria-label", () => {
    const input = h("input", { "aria-label": "Ignored", "aria-labelledby": "b a", type: "text" });
    const tree = h("div", {}, [
      h("span", { id: "a" }, [text("Alpha")]),
      h("span", { id: "b" }, [text("Beta")]),
      input,
    ]);
    assert.strictEqual(nameOf(input, tree), "Beta Alpha");
  });

  it("falls back to aria-label when no aria-labelledby target exists", () => {
    const input = h("input", {
      "aria-label": "Answer",
      "aria-labelledby": "missing",
      type: "text",
    });
    assert.strictEqual(nameOf(input, h("div", {}, [input])), "Answer");
  });

  it("falls back to the label whose for is the control's id", () => {
    const input = h("input", { id: "q1-name", type: "text" });
    const tree = h("div", {}, [h("label", { for: "q1-name" }, [text("Name")]), input]);
    assert.strictEqual(nameOf(input, tree), "Name");
  });

  it("names a button by its own text, and gives an unnamed control the empty name", () => {
    const input = h("input", { type: "text" });
    const tree = h("div", {}, [submit, input]);
    assert.strictEqual(nameOf(submit, tree), "Submit");
    assert.strictEqual(nameOf(input, tree), "");
  });
});

describe("isFocusable", () => {
  it("counts the native focusable kinds and any element with a tabindex", () => {
    const focusable = [
      h("input", { type: "text" }),
      h("textarea", {}),
      h("select", {}),
      h("button", {}),
      h("a", { href: "#x" }),
      h("area", { href: "#x" }),
      h("audio", { controls: true }),
      h("video", { controls: true }),
      h("div", { tabindex: "-1" }),
    ];
    for (const element of focusable) {
      assert.isTrue(isFocusable(element, h("div", {}, [element])), element.tag);
    }
  });

  it("refuses a hidden input, a disabled control, a bare link and a video with no controls", () => {
    const unfocusable = [
      h("input", { type: "hidden" }),
      h("button", { disabled: true }),
      h("input", { disabled: true, tabindex: "0", type: "text" }),
      h("a", {}),
      h("video", {}),
      h("div", {}),
    ];
    for (const element of unfocusable) {
      assert.isFalse(isFocusable(element, h("div", {}, [element])), element.tag);
    }
  });

  it("counts only the first summary of a details element", () => {
    const first = h("summary", {}, [text("More")]);
    const second = h("summary", {}, [text("Other")]);
    const details = h("details", {}, [text(" "), first, second]);
    assert.isTrue(isFocusable(first, details));
    assert.isFalse(isFocusable(second, details));

    const stray = h("summary", {}, [text("More")]);
    assert.isFalse(isFocusable(stray, h("div", {}, [stray])));
  });
});

describe("checkTree", () => {
  it("passes the positive tree: a Choice with a Prompt, two rows and a Submit inside a Form", () => {
    assert.deepStrictEqual(checkTree(item([status, capital, submit]), { baseLevel: 2 }), []);
  });

  it("passes an Extended Text whose Control is named by its Prompt", () => {
    assert.deepStrictEqual(
      checksOf(item([status, essay({ "aria-labelledby": "q1-ESSAY-prompt" }), submit])),
      [],
    );
  });

  it("passes autofocus on the Status region", () => {
    const focused = h("section", { ...status.attrs, autofocus: true }, status.children);
    assert.deepStrictEqual(checksOf(item([focused, capital, submit])), []);
  });

  it("[A-1] passes a BG011-shaped body whose video has controls, tabindex or none", () => {
    assert.deepStrictEqual(checksOf(sunflower({ controls: true })), []);
    assert.deepStrictEqual(checksOf(sunflower({ controls: true, tabindex: "0" })), []);
    assert.deepStrictEqual(checksOf(sunflower({ tabindex: "0" })), ["focusable-native"]);
  });

  it("control-name: a control with no name", () => {
    const entry = h("qti-text-entry-interaction", { "data-slot": "root" }, [
      h("input", { "data-slot": "control", id: "q1-TEXT", name: "q1-TEXT", type: "text" }),
    ]);
    assert.deepStrictEqual(checkTree(item([status, capital, entry, submit]), { baseLevel: 2 }), [
      {
        check: "control-name",
        path: ["qti-assessment-item", "form", "qti-text-entry-interaction", "input"],
      },
    ]);
  });

  it("label-name: a Control whose aria-labelledby points at another row's Label", () => {
    const crossed = choice("RESPONSE", "Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris", { "aria-labelledby": "q1-RESPONSE-B-label" }),
      choiceRow("RESPONSE", "B", "London"),
    ]);
    assert.deepStrictEqual(checkTree(item([status, crossed, submit]), { baseLevel: 2 }), [
      {
        check: "label-name",
        path: ["qti-assessment-item", "form", "fieldset", "ul", "li", "input"],
      },
    ]);
  });

  it("prompt-name: a Choice Root with a Prompt but no aria-labelledby to it", () => {
    const unnamed = choice(
      "RESPONSE",
      "Which city is the capital of France?",
      [choiceRow("RESPONSE", "A", "Paris"), choiceRow("RESPONSE", "B", "London")],
      {},
    );
    assert.deepStrictEqual(checkTree(item([status, unnamed, submit]), { baseLevel: 2 }), [
      { check: "prompt-name", path: ["qti-assessment-item", "form", "fieldset"] },
    ]);
  });

  it("prompt-name: an Extended Text Control named by something other than its Prompt", () => {
    assert.deepStrictEqual(checksOf(item([status, essay({ "aria-label": "Essay" }), submit])), [
      "prompt-name",
    ]);
  });

  it("list-item: a stray li", () => {
    const stray = h("li", {}, [text("Stray")]);
    assert.deepStrictEqual(checksOf(item([status, stray, capital, submit])), ["list-item"]);
  });

  it("[A-1] img-alt: an img with no alt", () => {
    const figure = h("p", {}, [h("img", { src: "images/map.png" })]);
    assert.deepStrictEqual(checksOf(item([status, figure, capital, submit])), ["img-alt"]);
  });

  it("lang: a root with no lang", () => {
    assert.deepStrictEqual(
      checkTree(item([status, capital, submit], { "data-slot": "item", id: "q1" }), {
        baseLevel: 2,
      }),
      [{ check: "lang", path: ["qti-assessment-item"] }],
    );
  });

  it("heading-order: an h4 under base level 2 after an h2", () => {
    const heading = h("h4", {}, [text("Details")]);
    assert.deepStrictEqual(checksOf(item([status, heading, capital, submit])), ["heading-order"]);
  });

  it("heading-order: an h1 under base level 2", () => {
    const heading = h("h1", {}, [text("Details")]);
    assert.deepStrictEqual(checksOf(item([status, heading, capital, submit])), ["heading-order"]);
  });

  it("duplicate-id: a duplicate id", () => {
    const copy = h("p", { id: "q1-status" }, [text("Copy")]);
    assert.deepStrictEqual(checkTree(item([status, copy, capital, submit]), { baseLevel: 2 }), [
      { check: "duplicate-id", path: ["qti-assessment-item", "form", "p"] },
    ]);
  });

  it("focusable-native: a div with tabindex 0", () => {
    const widget = h("div", { tabindex: "0" }, [text("Widget")]);
    assert.deepStrictEqual(checksOf(item([status, widget, capital, submit])), ["focusable-native"]);
  });

  it("tabindex-positive: a positive tabindex", () => {
    const first = h("button", { ...submit.attrs, tabindex: "1" }, submit.children);
    assert.deepStrictEqual(checksOf(item([status, capital, first])), ["tabindex-positive"]);
  });

  it("tabindex-minus-one: tabindex -1 outside the Status region", () => {
    const target = h("div", { tabindex: "-1" }, [text("Target")]);
    assert.deepStrictEqual(checksOf(item([status, target, capital, submit])), [
      "tabindex-minus-one",
    ]);
  });

  it("autofocus: two autofocus", () => {
    const twice = choice("RESPONSE", "Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris", { autofocus: true }),
      choiceRow("RESPONSE", "B", "London", { autofocus: true }),
    ]);
    assert.deepStrictEqual(checkTree(item([status, twice, submit]), { baseLevel: 2 }), [
      {
        check: "autofocus",
        path: ["qti-assessment-item", "form", "fieldset", "ul", "li", "input"],
      },
    ]);
  });

  it("autofocus: autofocus on an element that cannot take focus", () => {
    const note = h("p", { autofocus: true }, [text("Note")]);
    assert.deepStrictEqual(checksOf(item([status, note, capital, submit])), ["autofocus"]);
  });

  it("radio-group: a radio group split across two Roots", () => {
    const first = choice("RESPONSE", "Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
    ]);
    const second = choice("RESPONSE2", "Which city is the capital of Spain?", [
      choiceRow("RESPONSE2", "B", "Madrid", { name: "q1-RESPONSE" }),
    ]);
    assert.deepStrictEqual(checksOf(item([status, first, second, submit])), ["radio-group"]);
  });

  it("radio-group: radios of two names in one Root", () => {
    const mixed = choice("RESPONSE", "Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
      choiceRow("RESPONSE", "B", "London", { name: "q1-OTHER" }),
    ]);
    assert.deepStrictEqual(checksOf(item([status, mixed, submit])), ["radio-group"]);
  });

  it("submit-order: a Submit before a control", () => {
    assert.deepStrictEqual(checkTree(item([status, submit, capital]), { baseLevel: 2 }), [
      { check: "submit-order", path: ["qti-assessment-item", "form", "button"] },
    ]);
  });

  it("submit-order: a Submit outside the Form", () => {
    const root = h("qti-assessment-item", { "data-slot": "item", id: "q1", lang: "en" }, [
      h("form", { action: "/attempt", "data-slot": "form", method: "post" }, [status, capital]),
      submit,
    ]);
    assert.deepStrictEqual(checksOf(root), ["submit-order"]);
  });

  it("hidden-control: a control under aria-hidden", () => {
    const [control, label] = choiceRow("RESPONSE", "B", "London").children;
    assert.isDefined(control);
    assert.isDefined(label);

    const hidden = choice("RESPONSE", "Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
      h("li", { "aria-hidden": "true", "data-slot": "choice" }, [control, label]),
    ]);
    assert.deepStrictEqual(checksOf(item([status, hidden, submit])), ["hidden-control"]);
  });
});
