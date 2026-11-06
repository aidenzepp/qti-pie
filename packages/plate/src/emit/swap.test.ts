import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";

/**
 * The Choice parts' markers, read from the part table as an emitter reads them.
 */
const slots = {
  choice: rowFor("choice-interaction", "choice").slot,
  choices: rowFor("choice-interaction", "choices").slot,
  control: rowFor("choice-interaction", "control").slot,
  label: rowFor("choice-interaction", "label").slot,
  prompt: rowFor("choice-interaction", "prompt").slot,
  root: rowFor("choice-interaction", "root").slot,
};

/**
 * The Choice Control's attributes, as a connect function computes them.
 */
const controlProps: Attributes = {
  "aria-labelledby": "i1-RESPONSE-label-0",
  class: "a",
  "data-slot": slots.control,
  id: "i1-RESPONSE-control-0",
  name: "RESPONSE",
  type: "radio",
  value: "A",
};

/**
 * A Choice's Control root, handed to a Choice part function.
 */
const control = h("input", controlProps);

/**
 * A Choice's Label root, handed to a Choice part function.
 */
const label = h("label", { "data-slot": slots.label, for: "i1-RESPONSE-control-0" }, [text("Red")]);

/**
 * The Choice row's attributes.
 */
const choiceProps: Attributes = { "data-slot": slots.choice };

/**
 * The Choices row's attributes.
 */
const choicesProps: Attributes = { "data-slot": slots.choices };

/**
 * Construct a Choice root that a Choice replacement made a `div`.
 *
 * @param value The choice's identifier, kept in a `data-` attribute so the two roots differ.
 * @returns A `div` Choice root holding a text node.
 */
const divChoice = (value: string): Element =>
  h("div", { "data-choice": value, "data-slot": slots.choice }, [text(value)]);

/**
 * Construct a replacement that returns a fixed element regardless of what it is handed, for the
 * cases that build the returned subtree by hand.
 *
 * @param element The element the replacement returns.
 * @returns A part function returning `element`.
 */
const returning = (element: Element) => () => element;

/**
 * Construct a replacement that returns a `tag` element holding exactly the props and children it
 * is handed.
 *
 * @param tag The element the replacement returns.
 * @returns A part function returning a `tag` element.
 */
const as = (tag: string) => (props: Attributes, children: readonly Node[]) =>
  h(tag, props, children);

/**
 * A Choice replacement that wraps the first child it is handed in a `span` and keeps the rest.
 *
 * @param props The attributes the part carries.
 * @param children The nodes the part holds.
 * @returns An `li` holding the wrapped first child, then the others.
 */
const wrapFirst = (props: Attributes, children: readonly Node[]) =>
  h("li", props, [h("span", { class: "wrap" }, children.slice(0, 1)), ...children.slice(1)]);

describe("applyPart, a plain function", () => {
  it("returns a Result, failing PartSwapRefused when a replacement's root breaks I3", () => {
    const kept = applyPart(rowFor("choice-interaction", "choice"), choiceProps, [control, label]);
    assert.isTrue(Result.isResult(kept));

    const refused = applyPart(rowFor("choice-interaction", "control"), controlProps, [], as("div"));
    assert.isTrue(Result.isResult(refused));
    assert.isTrue(Result.isFailure(refused));

    const error = Option.getOrThrow(Result.getFailure(refused));
    assert.strictEqual(error._tag, "PartSwapRefused");
    assert.strictEqual(error.cause, "root-not-allowed");
  });

  it("throws HandedNodeDefect when the nodes it is handed hold one node twice", () => {
    const thrown = Result.getFailure(
      Result.try(() =>
        applyPart(
          rowFor("choice-interaction", "choice"),
          choiceProps,
          [control, control],
          as("li"),
        ),
      ),
    );
    assert.isTrue(Option.isSome(thrown));
    assert.propertyVal(Option.getOrThrow(thrown), "_tag", "HandedNodeDefect");
  });
});

describe("applyPart, the fast path", () => {
  it.effect("returns the default element with the props and children as handed", () =>
    Effect.gen(function* fastPath() {
      const row = rowFor("choice-interaction", "choice");
      const children = [control, label];
      const result = yield* Effect.fromResult(applyPart(row, choiceProps, children));
      assert.deepStrictEqual(result, h(row.element, choiceProps, children));
      assert.strictEqual(result.attrs, choiceProps);
      assert.strictEqual(result.children, children);
    }),
  );
});

describe("applyPart, I1", () => {
  it.effect("writes the props over the replacement's root and joins class", () =>
    Effect.gen(function* requiredAttributesWin() {
      const replacement = returning(
        h("input", {
          "aria-labelledby": "theirs",
          class: "b",
          "data-x": "1",
          id: "theirs",
          title: "Their title",
          type: "radio",
        }),
      );
      const result = yield* Effect.fromResult(
        applyPart(rowFor("choice-interaction", "control"), controlProps, [], replacement),
      );
      assert.strictEqual(result.tag, "input");
      assert.strictEqual(result.attrs["id"], "i1-RESPONSE-control-0");
      assert.strictEqual(result.attrs["aria-labelledby"], "i1-RESPONSE-label-0");
      assert.strictEqual(result.attrs["name"], "RESPONSE");
      assert.strictEqual(result.attrs["data-x"], "1");
      assert.strictEqual(result.attrs["title"], "Their title");
      assert.strictEqual(result.attrs["class"], "a b");
    }),
  );

  it.effect("writes each class token once, the props' first", () =>
    Effect.gen(function* classJoined() {
      const replacement = returning(h("span", { class: "c  b" }));
      const result = yield* Effect.fromResult(
        applyPart(
          rowFor("choice-interaction", "indicator"),
          { "aria-hidden": "true", class: "a b" },
          [],
          replacement,
        ),
      );
      assert.strictEqual(result.attrs["class"], "a b c");
      assert.strictEqual(result.attrs["aria-hidden"], "true");
    }),
  );

  it.effect("writes no class when neither side has one", () =>
    Effect.gen(function* noClass() {
      const result = yield* Effect.fromResult(
        applyPart(
          rowFor("choice-interaction", "indicator"),
          { "aria-hidden": "true" },
          [],
          as("svg"),
        ),
      );
      assert.isFalse(Object.hasOwn(result.attrs, "class"));
    }),
  );
});

/**
 * A test-only row of a `button` part whose `type` is defaulted to `button` and never merged, as a
 * navigation part's is: the Notice's row with a `button` element any tag may replace.
 */
const buttonRow: PartRow = {
  ...rowFor("item", "notice"),
  defaults: { type: "button" },
  element: "button",
  merged: ["disabled"],
  tagClass: "any",
};

/**
 * The button row's attributes, as a connect function computes them: its marker only.
 */
const buttonProps: Attributes = { "data-slot": buttonRow.slot };

describe("applyPart, a row's defaults", () => {
  it.effect("writes a default onto the default element on the fast path", () =>
    Effect.gen(function* defaultsOnFastPath() {
      const result = yield* Effect.fromResult(applyPart(buttonRow, buttonProps, [text("Next")]));
      assert.strictEqual(result.tag, "button");
      assert.deepStrictEqual(result.attrs, { "data-slot": buttonRow.slot, type: "button" });
    }),
  );

  it.effect(
    "keeps a replacement's own attributes over the defaults, and writes the props over both",
    () =>
      Effect.gen(function* replacementOverDefaults() {
        const replacement = returning(h("button", { name: "n", type: "submit", value: "v" }));
        const result = yield* Effect.fromResult(applyPart(buttonRow, buttonProps, [], replacement));
        assert.deepStrictEqual(result.attrs, {
          "data-slot": buttonRow.slot,
          name: "n",
          type: "submit",
          value: "v",
        });
      }),
  );

  it.effect("writes a default a replacement leaves out", () =>
    Effect.gen(function* defaultUnderReplacement() {
      const result = yield* Effect.fromResult(applyPart(buttonRow, buttonProps, [], as("button")));
      assert.deepStrictEqual(result.attrs, { "data-slot": buttonRow.slot, type: "button" });
    }),
  );
});

/**
 * The navigation Next button's row, a plain button whose `type` is a default.
 */
const nextRow = rowFor("test-navigation", "next");

/**
 * The Next button's attributes, as the navigation parts compute them for a disabled Next.
 */
const nextProps: Attributes = { "data-intent": "next", "data-slot": nextRow.slot, disabled: true };

describe("applyPart, the navigation Next button", () => {
  it.effect("writes type button onto the default button on the fast path", () =>
    Effect.gen(function* nextFastPath() {
      const result = yield* Effect.fromResult(applyPart(nextRow, nextProps, [text("Next item")]));
      assert.strictEqual(result.tag, "button");
      assert.deepStrictEqual(result.attrs, { ...nextProps, type: "button" });
    }),
  );

  it.effect(
    "keeps a host submit button's type, name and value, and writes the props over them",
    () =>
      Effect.gen(function* nextSubmitSwap() {
        const replacement = returning(
          h("button", { "data-slot": "host-button", name: "n", type: "submit", value: "v" }),
        );
        const result = yield* Effect.fromResult(applyPart(nextRow, nextProps, [], replacement));
        assert.deepStrictEqual(result.attrs, {
          ...nextProps,
          name: "n",
          type: "submit",
          value: "v",
        });
      }),
  );

  it.effect("writes type button onto a replacement button that names no type", () =>
    Effect.gen(function* nextUntypedSwap() {
      const result = yield* Effect.fromResult(applyPart(nextRow, nextProps, [], as("button")));
      assert.deepStrictEqual(result.attrs, { ...nextProps, type: "button" });
    }),
  );

  it.effect("refuses a div for the Next button as root-not-allowed", () =>
    Effect.gen(function* nextNotButton() {
      const error = yield* Effect.flip(
        Effect.fromResult(applyPart(nextRow, nextProps, [], as("div"))),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.interaction, "test-navigation");
      assert.strictEqual(error.part, "next");
    }),
  );
});

describe("applyPart, I2", () => {
  it.effect("accepts a wrapper between the root and the children it was handed", () =>
    Effect.gen(function* wrapperAccepted() {
      const result = yield* Effect.fromResult(
        applyPart(rowFor("choice-interaction", "choice"), choiceProps, [control, label], wrapFirst),
      );
      const [wrapper, kept] = result.children;
      assert.strictEqual(wrapper?.kind === "element" ? wrapper.children[0] : undefined, control);
      assert.strictEqual(kept, label);
    }),
  );

  it.effect("refuses a replacement that drops a child as child-missing", () =>
    Effect.gen(function* childMissing() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(
            rowFor("choice-interaction", "choice"),
            choiceProps,
            [control, label],
            (props) => h("li", props, [label]),
          ),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "child-missing");
      assert.strictEqual(error.interaction, "choice-interaction");
      assert.strictEqual(error.part, "choice");
    }),
  );

  it.effect("refuses a replacement that returns a child it was handed as its root", () =>
    Effect.gen(function* childAsRoot() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(rowFor("choice-interaction", "label"), {}, [label], (_props, children) =>
            children[0]?.kind === "element" ? children[0] : h("span", {}),
          ),
        ),
      );
      assert.strictEqual(error.cause, "child-missing");
    }),
  );

  it.effect("refuses a replacement that repeats a child as child-duplicated", () =>
    Effect.gen(function* childDuplicated() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(
            rowFor("choice-interaction", "choice"),
            choiceProps,
            [control, label],
            (props) => h("li", props, [control, label, control]),
          ),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "child-duplicated");
      assert.strictEqual(error.part, "choice");
    }),
  );

  it.effect("refuses a replacement that swaps two children as child-reordered", () =>
    Effect.gen(function* childReordered() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(
            rowFor("choice-interaction", "choice"),
            choiceProps,
            [control, label],
            (props) => h("li", props, [label, control]),
          ),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "child-reordered");
      assert.strictEqual(error.part, "choice");
    }),
  );
});

describe("applyPart, I3", () => {
  it.effect("refuses a div for a Control as root-not-allowed", () =>
    Effect.gen(function* rootNotAllowed() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(rowFor("choice-interaction", "control"), controlProps, [], as("div")),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.interaction, "choice-interaction");
      assert.strictEqual(error.part, "control");
    }),
  );

  it.effect(
    '[Q-12] refuses a Text Entry Control replacement whose TYPE="checkbox" names its type in upper case',
    () =>
      Effect.gen(function* upperCaseType() {
        const row = rowFor("text-entry-interaction", "control");
        const error = yield* Effect.flip(
          Effect.fromResult(
            applyPart(
              row,
              {
                "data-slot": row.slot,
                id: "i1-RESPONSE-control-0",
                name: "RESPONSE",
                type: "text",
              },
              [],
              () => h("input", { TYPE: "checkbox" }),
            ),
          ),
        );
        assert.strictEqual(error._tag, "PartSwapRefused");
        assert.strictEqual(error.cause, "root-not-allowed");
        assert.strictEqual(error.interaction, "text-entry-interaction");
        assert.strictEqual(error.part, "control");
      }),
  );
});

describe("applyPart, the list joint rule", () => {
  it.effect("refuses a div Choice root under the default ul Choices as list-item", () =>
    Effect.gen(function* listItem() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(rowFor("choice-interaction", "choices"), choicesProps, [
            divChoice("A"),
            h("li", { "data-slot": slots.choice }),
          ]),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "list-item");
      assert.strictEqual(error.interaction, "choice-interaction");
      assert.strictEqual(error.part, "choices");
    }),
  );

  it.effect("gives Choices swapped to a div the list role, and its Choice roots listitem", () =>
    Effect.gen(function* listRoles() {
      const result = yield* Effect.fromResult(
        applyPart(
          rowFor("choice-interaction", "choices"),
          choicesProps,
          [divChoice("A"), divChoice("B")],
          as("div"),
        ),
      );
      assert.strictEqual(result.tag, "div");
      assert.strictEqual(result.attrs["role"], "list");
      assert.strictEqual(result.attrs["data-slot"], slots.choices);
      assert.strictEqual(result.children.length, 2);
      for (const [index, child] of result.children.entries()) {
        assert.strictEqual(child.kind === "element" ? child.tag : undefined, "div");
        assert.strictEqual(child.kind === "element" ? child.attrs["role"] : undefined, "listitem");
        assert.strictEqual(
          child.kind === "element" ? child.attrs["data-choice"] : undefined,
          ["A", "B"][index],
        );
      }
    }),
  );

  it.effect("finds the Choice roots below a wrapper when it adds listitem", () =>
    Effect.gen(function* listRolesWrapped() {
      const result = yield* Effect.fromResult(
        applyPart(
          rowFor("choice-interaction", "choices"),
          choicesProps,
          [divChoice("A"), divChoice("B")],
          (props, children) => h("div", props, [h("div", { class: "grid" }, children)]),
        ),
      );
      const [grid] = result.children;
      const roots = grid?.kind === "element" ? grid.children : [];
      assert.strictEqual(roots.length, 2);
      for (const root of roots) {
        assert.strictEqual(root.kind === "element" ? root.attrs["role"] : undefined, "listitem");
      }
      assert.isFalse(grid?.kind === "element" && Object.hasOwn(grid.attrs, "role"));
    }),
  );

  it.effect("leaves li Choice roots under a list replacement as they are", () =>
    Effect.gen(function* listKept() {
      const children = [
        h("li", { "data-slot": slots.choice }),
        h("li", { "data-slot": slots.choice }),
      ];
      const result = yield* Effect.fromResult(
        applyPart(rowFor("choice-interaction", "choices"), choicesProps, children, as("ol")),
      );
      assert.strictEqual(result.tag, "ol");
      assert.isFalse(Object.hasOwn(result.attrs, "role"));
      assert.strictEqual(result.children[0], children[0]);
      assert.strictEqual(result.children[1], children[1]);
    }),
  );
});

describe("applyPart, the Choice Prompt's two markups", () => {
  /**
   * A legend Prompt as the emitter hands it to the Root.
   */
  const legend = h("legend", { "data-slot": slots.prompt }, [text("Pick a colour.")]);

  /**
   * The Choices list as the emitter hands it to the Root.
   */
  const list = h("ul", choicesProps, [h("li", choiceProps, [control, label])]);

  it.effect("keeps a swapped legend Prompt a legend, refusing a span as root-not-allowed", () =>
    Effect.gen(function* legendPrompt() {
      const row = rowFor("choice-interaction", "prompt", { promptMarkup: "legend" });
      const swapped = yield* Effect.fromResult(
        applyPart(row, { "data-slot": slots.prompt }, [], as("legend")),
      );
      assert.strictEqual(swapped.tag, "legend");

      const error = yield* Effect.flip(
        Effect.fromResult(applyPart(row, { "data-slot": slots.prompt }, [], as("span"))),
      );
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.part, "prompt");
    }),
  );

  it.effect("keeps the id the Root names on a swapped labelledby Prompt", () =>
    Effect.gen(function* labelledPrompt() {
      const row = rowFor("choice-interaction", "prompt", { promptMarkup: "labelledby" });
      const props = { "data-slot": slots.prompt, id: "i1-RESPONSE-prompt" };
      const result = yield* Effect.fromResult(
        applyPart(row, props, [], returning(h("div", { id: "theirs" }))),
      );
      assert.strictEqual(result.tag, "div");
      assert.strictEqual(result.attrs["id"], "i1-RESPONSE-prompt");
    }),
  );

  it.effect("accepts a Root swap that keeps the legend first and wraps the Choices", () =>
    Effect.gen(function* legendKept() {
      const row = rowFor("choice-interaction", "root", { promptMarkup: "legend" });
      const result = yield* Effect.fromResult(
        applyPart(row, { "data-slot": slots.root }, [legend, list], (props, [prompt, ...rest]) =>
          h("fieldset", props, [
            ...(prompt === undefined ? [] : [prompt]),
            h("div", { class: "grid" }, rest),
          ]),
        ),
      );
      assert.strictEqual(result.tag, "fieldset");
      assert.strictEqual(result.children[0], legend);
    }),
  );

  it.effect("refuses a Root swap that wraps the legend Prompt as legend-first", () =>
    Effect.gen(function* legendWrapped() {
      const row = rowFor("choice-interaction", "root", { promptMarkup: "legend" });
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(row, { "data-slot": slots.root }, [legend, list], (props, children) =>
            h("fieldset", props, [h("div", { class: "frame" }, children)]),
          ),
        ),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "legend-first");
      assert.strictEqual(error.interaction, "choice-interaction");
      assert.strictEqual(error.part, "root");
    }),
  );

  it.effect("refuses a div for the Choice Root as root-not-allowed", () =>
    Effect.gen(function* rootStaysFieldset() {
      const error = yield* Effect.flip(
        Effect.fromResult(
          applyPart(
            rowFor("choice-interaction", "root"),
            { "data-slot": slots.root },
            [list],
            as("div"),
          ),
        ),
      );
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.part, "root");
    }),
  );
});

/**
 * Swap a part and give its refusal, failing the test when the swap is accepted.
 *
 * @param row The part's row.
 * @param props The attributes the part carries.
 * @param children The nodes the emitter hands over.
 * @param replacement The embedder's part function.
 * @returns The refusal.
 */
const refusedAt = (
  row: PartRow,
  props: Attributes,
  children: readonly Node[],
  replacement: (props: Attributes, children: readonly Node[]) => Element,
) => Effect.flip(Effect.fromResult(applyPart(row, props, children, replacement)));

describe("applyPart, the select joint rule", () => {
  /**
   * The Inline Choice Control's row, of tag class `select`.
   */
  const selectRow = rowFor("inline-choice-interaction", "control");

  /**
   * The Inline Choice Option's row, of tag class `option`.
   */
  const optionRow = rowFor("inline-choice-interaction", "option");

  /**
   * The Inline Choice Control's attributes, as its connect function computes them.
   */
  const selectProps: Attributes = {
    "aria-label": "Answer",
    autocomplete: "off",
    "data-slot": selectRow.slot,
    id: "i1-RESPONSE-control-0",
    name: "RESPONSE",
  };

  /**
   * An Option's attributes, as the connect function computes them for an unselected choice.
   */
  const optionProps: Attributes = { "data-slot": optionRow.slot, value: "A" };

  /**
   * The Placeholder and two Options, as the emitter hands them to the Control.
   */
  const options = [
    h(
      "option",
      { "data-slot": rowFor("inline-choice-interaction", "placeholder").slot, value: "" },
      [text("Select an answer")],
    ),
    h("option", optionProps, [text("Apple")]),
    h("option", { "data-slot": optionRow.slot, value: "B" }, [text("Pear")]),
  ];

  /**
   * An Option's text, as the emitter hands it to the Option.
   */
  const optionText = [text("Apple")];

  it.effect("[Q-12] refuses a Control replacement that wraps the options in an optgroup", () =>
    Effect.gen(function* selectWrapsOptions() {
      const error = yield* refusedAt(selectRow, selectProps, options, (props, children) =>
        h("select", props, [h("optgroup", { label: "Fruit" }, children)]),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "select-content");
      assert.strictEqual(error.interaction, "inline-choice-interaction");
      assert.strictEqual(error.part, "control");
    }),
  );

  it.effect("[Q-12] refuses a Control replacement that adds an option beside the handed ones", () =>
    Effect.gen(function* selectAddsOption() {
      const error = yield* refusedAt(selectRow, selectProps, options, (props, children) =>
        h("select", props, [...children, h("option", { value: "C" }, [text("Plum")])]),
      );
      assert.strictEqual(error.cause, "select-content");
      assert.strictEqual(error.part, "control");
    }),
  );

  it.effect("[Q-12] refuses an Option replacement that wraps its text in a span", () =>
    Effect.gen(function* optionWrapsText() {
      const error = yield* refusedAt(optionRow, optionProps, optionText, (props, children) =>
        h("option", props, [h("span", { class: "fruit" }, children)]),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "select-content");
      assert.strictEqual(error.interaction, "inline-choice-interaction");
      assert.strictEqual(error.part, "option");
    }),
  );

  it.effect("[Q-12] refuses an Option replacement that adds an element beside its text", () =>
    Effect.gen(function* optionAddsElement() {
      const error = yield* refusedAt(optionRow, optionProps, optionText, (props, children) =>
        h("option", props, [...children, h("b", {}, [text("!")])]),
      );
      assert.strictEqual(error.cause, "select-content");
      assert.strictEqual(error.part, "option");
    }),
  );

  it.effect("[Q-12] refuses an Option replacement that adds a text node beside its text", () =>
    Effect.gen(function* optionAddsText() {
      const error = yield* refusedAt(optionRow, optionProps, optionText, (props, children) =>
        h("option", props, [...children, text(" (ripe)")]),
      );
      assert.strictEqual(error.cause, "select-content");
      assert.strictEqual(error.part, "option");
    }),
  );

  it.effect(
    "[Q-12] refuses a Control replacement that makes the select multiple, in any case",
    () =>
      Effect.gen(function* selectMultiple() {
        const variants: readonly Attributes[] = [{ multiple: true }, { MULTIPLE: "multiple" }];
        for (const multiple of variants) {
          const error = yield* refusedAt(selectRow, selectProps, options, (props, children) =>
            h("select", { ...props, ...multiple }, children),
          );
          assert.strictEqual(error._tag, "PartSwapRefused");
          assert.strictEqual(error.cause, "root-not-allowed");
          assert.strictEqual(error.interaction, "inline-choice-interaction");
          assert.strictEqual(error.part, "control");
        }
      }),
  );

  it.effect("[Q-12] refuses a Control replacement that sizes the select as a list box", () =>
    Effect.gen(function* selectSized() {
      const error = yield* refusedAt(selectRow, selectProps, options, (props, children) =>
        h("select", { ...props, size: "4" }, children),
      );
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.part, "control");
    }),
  );

  it.effect("[Q-12] accepts a Control replacement whose select is sized 1, a drop-down", () =>
    Effect.gen(function* selectSizedOne() {
      const result = yield* Effect.fromResult(
        applyPart(selectRow, selectProps, options, (_props, children) =>
          h("select", { size: "1" }, children),
        ),
      );
      assert.strictEqual(result.tag, "select");
      assert.strictEqual(result.attrs["size"], "1");
      assert.strictEqual(result.attrs["name"], "RESPONSE");
    }),
  );

  it.effect("[Q-12] refuses an Option or Placeholder replacement that carries a label", () =>
    Effect.gen(function* optionLabelled() {
      for (const part of ["option", "placeholder"] as const) {
        const row = rowFor("inline-choice-interaction", part);
        const error = yield* refusedAt(row, optionProps, optionText, (props, children) =>
          h("option", { ...props, label: "host text" }, children),
        );
        assert.strictEqual(error._tag, "PartSwapRefused");
        assert.strictEqual(error.cause, "root-not-allowed");
        assert.strictEqual(error.interaction, "inline-choice-interaction");
        assert.strictEqual(error.part, part);
      }
    }),
  );

  it.effect("[Q-12] accepts an Option replacement that adds a class, and keeps its text", () =>
    Effect.gen(function* optionClassed() {
      const result = yield* Effect.fromResult(
        applyPart(optionRow, optionProps, optionText, (props, children) =>
          h("option", { ...props, class: "host" }, children),
        ),
      );
      assert.strictEqual(result.tag, "option");
      assert.strictEqual(result.attrs["class"], "host");
      assert.strictEqual(result.attrs["value"], "A");
      assert.deepStrictEqual(result.children, optionText);
    }),
  );

  it.effect(
    "[Q-12] accepts a Control replacement whose select holds the handed options unwrapped, and writes the props over it",
    () =>
      Effect.gen(function* selectKeepsOptions() {
        const result = yield* Effect.fromResult(
          applyPart(selectRow, selectProps, options, (_props, children) =>
            h("select", { class: "host", id: "theirs", name: "theirs" }, children),
          ),
        );
        assert.strictEqual(result.tag, "select");
        assert.strictEqual(result.attrs["id"], "i1-RESPONSE-control-0");
        assert.strictEqual(result.attrs["name"], "RESPONSE");
        assert.strictEqual(result.attrs["autocomplete"], "off");
        assert.strictEqual(result.attrs["aria-label"], "Answer");
        assert.strictEqual(result.attrs["class"], "host");
        assert.strictEqual(result.children.length, options.length);
        for (const [index, child] of result.children.entries()) {
          assert.strictEqual(child, options[index]);
        }
      }),
  );
});
