import { assert, describe, it } from "@effect/vitest";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartOf } from "#plate/emit/parts.ts";
import { checkTree, isFocusable, nameOf, textOf } from "#plate/test/accessibility.ts";
import type { Check } from "#plate/test/accessibility.ts";

/**
 * Read a part's `data-slot` marker from the part table, as an emitter writes it.
 *
 * @param interaction The interaction that owns the part.
 * @param part The part.
 * @returns The part's marker.
 */
const slot = <I extends InteractionKey>(interaction: I, part: PartOf<I>): string =>
  rowFor(interaction, part).slot;

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
  h("li", { "data-slot": slot("choice-interaction", "choice") }, [
    h("input", {
      "aria-labelledby": `q1-${response}-${key}-label`,
      "data-slot": slot("choice-interaction", "control"),
      id: `q1-${response}-${key}`,
      name: `q1-${response}`,
      type: "radio",
      value: key,
      ...control,
    }),
    h(
      "label",
      {
        "data-slot": slot("choice-interaction", "label"),
        for: `q1-${response}-${key}`,
        id: `q1-${response}-${key}-label`,
      },
      [
        h("span", { "aria-hidden": "true", "data-slot": slot("choice-interaction", "indicator") }, [
          text("o"),
        ]),
        text(label),
      ],
    ),
  ]);

/**
 * Build the Choices list holding the rows.
 *
 * @param rows The Choice rows.
 * @returns The Choices part.
 */
const choices = (rows: readonly Element[]): Element =>
  h("ul", { "data-slot": slot("choice-interaction", "choices") }, rows);

/**
 * Build a Choice interaction in the legend markup: a `fieldset` Root with no role, its first child
 * a `legend` Prompt of phrasing content, which names it.
 *
 * @param prompt The Prompt's text.
 * @param rows The Choice rows.
 * @returns The interaction Root.
 */
const choice = (prompt: string, rows: readonly Element[]): Element =>
  h("fieldset", { "data-slot": slot("choice-interaction", "root") }, [
    h("legend", { "data-slot": slot("choice-interaction", "prompt") }, [text(prompt)]),
    choices(rows),
  ]);

/**
 * Build a Choice interaction in the labelledby markup: a `fieldset` Root with no role, named by
 * `aria-labelledby` → a `qti-prompt` Prompt that holds a paragraph, which a legend may not.
 *
 * @param prompt The Prompt's element: `qti-prompt` by default, `legend` for a negative case.
 * @param root The Root's naming attributes, `aria-labelledby` to the Prompt by default.
 * @returns The interaction Root.
 */
const paragraphChoice = (prompt = "qti-prompt", root?: Attributes): Element =>
  h(
    "fieldset",
    {
      "data-slot": slot("choice-interaction", "root"),
      ...(root ?? { "aria-labelledby": "q1-RESPONSE-prompt" }),
    },
    [
      h(prompt, { "data-slot": slot("choice-interaction", "prompt"), id: "q1-RESPONSE-prompt" }, [
        h("p", {}, [text("Paris is on the Seine.")]),
        h("p", {}, [text("Which city is the capital of France?")]),
      ]),
      choices([choiceRow("RESPONSE", "A", "Paris"), choiceRow("RESPONSE", "B", "London")]),
    ],
  );

/**
 * Build an Extended Text interaction whose Prompt reads "Describe Paris.".
 *
 * @param control The Control's naming attributes.
 * @returns The interaction Root.
 */
const essay = (control: Attributes): Element =>
  h("qti-extended-text-interaction", { "data-slot": slot("extended-text-interaction", "root") }, [
    h(
      "qti-prompt",
      { "data-slot": slot("extended-text-interaction", "prompt"), id: "q1-ESSAY-prompt" },
      [text("Describe Paris.")],
    ),
    h("textarea", {
      "data-slot": slot("extended-text-interaction", "control"),
      id: "q1-ESSAY",
      name: "q1-ESSAY",
      rows: "6",
      ...control,
    }),
  ]);

/**
 * The item Root's attributes, `lang` among them.
 */
const itemRoot: Attributes = { "data-slot": slot("item", "root"), id: "q1", lang: "en" };

/**
 * Build the item Root around a host's form: a plain `form` with no marker, as an author composes
 * it.
 *
 * @param children The form's children.
 * @param root The item Root's attributes, with `lang` by default.
 * @returns The item Root.
 */
const item = (children: readonly Node[], root: Attributes = itemRoot): Element =>
  h("qti-assessment-item", root, [
    h("form", { action: "/attempt", method: "post", novalidate: true }, children),
  ]);

/**
 * The Status region with its heading at base level 2.
 */
const status = h(
  "section",
  {
    "aria-labelledby": "q1-status-heading",
    "data-slot": slot("item", "status"),
    id: "q1-status",
    role: "status",
    tabindex: "-1",
  },
  [
    h("h2", { "data-slot": slot("item", "statusHeading"), id: "q1-status-heading" }, [
      text("Status"),
    ]),
  ],
);

/**
 * The host's submit button, named by its own text and carrying no marker.
 */
const submit = h("button", { type: "submit" }, [text("Submit")]);

/**
 * The positive Choice: a Prompt and two rows.
 */
const capital = choice("Which city is the capital of France?", [
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
  it("passes the positive tree: a Choice with a Prompt, two rows and a submit button in a form", () => {
    assert.deepStrictEqual(checkTree(item([status, capital, submit]), { baseLevel: 2 }), []);
  });

  it("passes a Choice whose Prompt holds a paragraph, named through aria-labelledby", () => {
    assert.deepStrictEqual(checksOf(item([status, paragraphChoice(), submit])), []);
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
    const entry = h(
      "qti-text-entry-interaction",
      { "data-slot": slot("text-entry-interaction", "root") },
      [
        h("input", {
          "data-slot": slot("text-entry-interaction", "control"),
          id: "q1-TEXT",
          name: "q1-TEXT",
          type: "text",
        }),
      ],
    );
    assert.deepStrictEqual(checkTree(item([status, capital, entry, submit]), { baseLevel: 2 }), [
      {
        check: "control-name",
        path: ["qti-assessment-item", "form", "qti-text-entry-interaction", "input"],
      },
    ]);
  });

  it("label-name: a Control whose aria-labelledby points at another row's Label", () => {
    const crossed = choice("Which city is the capital of France?", [
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

  it("nested-label: a label inside a label, reported once for the inner label", () => {
    const nested = h("label", {}, [h("label", {}, [text("x")])]);
    assert.deepStrictEqual(checkTree(item([status, nested, capital, submit]), { baseLevel: 2 }), [
      { check: "nested-label", path: ["qti-assessment-item", "form", "label", "label"] },
    ]);
  });

  it("nested-label: a label holding a span, and two sibling labels, pass", () => {
    const spanned = h("label", {}, [h("span", {}, [text("x")])]);
    const siblings = h("div", {}, [h("label", {}, [text("a")]), h("label", {}, [text("b")])]);
    assert.deepStrictEqual(checksOf(item([status, spanned, siblings, capital, submit])), []);
  });

  it("prompt-name: a paragraph Prompt whose Root has no aria-labelledby to it", () => {
    assert.deepStrictEqual(
      checkTree(item([status, paragraphChoice("qti-prompt", {}), submit]), { baseLevel: 2 }),
      [{ check: "prompt-name", path: ["qti-assessment-item", "form", "fieldset"] }],
    );
  });

  it("prompt-name: a paragraph Prompt rendered as the fieldset's legend", () => {
    assert.deepStrictEqual(checksOf(item([status, paragraphChoice("legend", {}), submit])), [
      "prompt-name",
    ]);
  });

  it("prompt-name: a legend Prompt that is not the fieldset's first child", () => {
    const [legend, list] = capital.children;
    assert.isDefined(legend);
    assert.isDefined(list);

    const late = h("fieldset", capital.attrs, [list, legend]);
    assert.deepStrictEqual(checkTree(item([status, late, submit]), { baseLevel: 2 }), [
      { check: "prompt-name", path: ["qti-assessment-item", "form", "fieldset"] },
    ]);
  });

  it("prompt-name: a legend Choice Root that keeps role=group", () => {
    const grouped = h("fieldset", { ...capital.attrs, role: "group" }, capital.children);
    assert.deepStrictEqual(checksOf(item([status, grouped, submit])), ["prompt-name"]);
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
      checkTree(item([status, capital, submit], { "data-slot": slot("item", "root"), id: "q1" }), {
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
    const twice = choice("Which city is the capital of France?", [
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
    const first = choice("Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
    ]);
    const second = choice("Which city is the capital of Spain?", [
      choiceRow("RESPONSE2", "B", "Madrid", { name: "q1-RESPONSE" }),
    ]);
    assert.deepStrictEqual(checksOf(item([status, first, second, submit])), ["radio-group"]);
  });

  it("radio-group: radios of two names in one Root", () => {
    const mixed = choice("Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
      choiceRow("RESPONSE", "B", "London", { name: "q1-OTHER" }),
    ]);
    assert.deepStrictEqual(checksOf(item([status, mixed, submit])), ["radio-group"]);
  });

  it("submit-order: an unmarked submit button before a control of its form", () => {
    assert.deepStrictEqual(checkTree(item([status, submit, capital]), { baseLevel: 2 }), [
      { check: "submit-order", path: ["qti-assessment-item", "form", "button"] },
    ]);
  });

  it("submit-order: a button with no type before a control, which submits by default", () => {
    const untyped = h("button", {}, [text("Submit")]);
    assert.deepStrictEqual(checksOf(item([status, untyped, capital])), ["submit-order"]);
  });

  it("submit-order: an unmarked submit button outside any form", () => {
    const root = h("qti-assessment-item", itemRoot, [
      h("form", { action: "/attempt", method: "post" }, [status, capital]),
      submit,
    ]);
    assert.deepStrictEqual(checksOf(root), ["submit-order"]);
  });

  it("submit-order: passes a form whose submit button is last", () => {
    assert.deepStrictEqual(checksOf(item([status, capital, submit])), []);
  });

  it("submit-order: passes a plain button before a control, and a control in a later form", () => {
    const plain = h("button", { type: "button" }, [text("Hint")]);
    const root = h("qti-assessment-item", itemRoot, [
      h("form", { action: "/attempt", method: "post" }, [status, plain, capital, submit]),
      h("form", { action: "/search", method: "get" }, [
        h("input", { "aria-label": "Search", name: "q" }),
      ]),
    ]);
    assert.deepStrictEqual(checksOf(root), []);
  });

  it("hidden-control: a control under aria-hidden", () => {
    const [control, label] = choiceRow("RESPONSE", "B", "London").children;
    assert.isDefined(control);
    assert.isDefined(label);

    const hidden = choice("Which city is the capital of France?", [
      choiceRow("RESPONSE", "A", "Paris"),
      h("li", { "aria-hidden": "true", "data-slot": slot("choice-interaction", "choice") }, [
        control,
        label,
      ]),
    ]);
    assert.deepStrictEqual(checksOf(item([status, hidden, submit])), ["hidden-control"]);
  });
});
