import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type {
  BodyNode,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
} from "#plate/model/item.ts";
import { redactItem } from "#plate/payload.ts";
import { render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

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
 * Construct a Choice root that a Choice replacement made a `div` with a role of its own, named in
 * upper case.
 *
 * @param value The choice's identifier, kept in a `data-` attribute so the two roots differ.
 * @returns A `div` Choice root with `ROLE="option"`, holding a text node.
 */
const roleChoice = (value: string): Element =>
  h("div", { ROLE: "option", "data-choice": value, "data-slot": slots.choice }, [text(value)]);

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

/**
 * Give the attributes whose names match a name in ASCII lower case, as HTML matches them.
 *
 * @param attrs The attributes of an element.
 * @param name The name, in lower case.
 * @returns Each matching attribute as a name and value pair, in the element's order.
 */
const spelledAs = (attrs: Attributes, name: string) =>
  Object.entries(attrs).filter(
    ([candidate]) => candidate.replaceAll(/[A-Z]/gu, (letter) => letter.toLowerCase()) === name,
  );

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

  /**
   * The Text Entry Control's row.
   */
  const textRow = rowFor("text-entry-interaction", "control");

  /**
   * The Text Entry Control's attributes, as its connect function computes them.
   */
  const textProps: Attributes = {
    "aria-label": "Answer",
    autocomplete: "off",
    "data-slot": textRow.slot,
    id: "i1-RESPONSE-control-0",
    name: "RESPONSE",
    type: "text",
  };

  it.effect(
    "writes the props over a replacement's NAME, ID and ARIA-LABEL, leaving one attribute of each name",
    () =>
      Effect.gen(function* propsOverOtherCase() {
        for (const [written, name] of [
          ["NAME", "name"],
          ["ID", "id"],
          ["ARIA-LABEL", "aria-label"],
        ] as const) {
          const result = yield* Effect.fromResult(
            applyPart(textRow, textProps, [], returning(h("input", { [written]: "HOST" }))),
          );
          assert.deepStrictEqual(spelledAs(result.attrs, name), [[name, textProps[name]]], written);
        }
      }),
  );

  it.effect("keeps a replacement's own attributes in any case when no prop shares their name", () =>
    Effect.gen(function* otherCaseKept() {
      const result = yield* Effect.fromResult(
        applyPart(
          textRow,
          textProps,
          [],
          returning(h("input", { "DATA-HOST": "1", Title: "Their title" })),
        ),
      );
      assert.strictEqual(result.attrs["DATA-HOST"], "1");
      assert.strictEqual(result.attrs["Title"], "Their title");
      assert.strictEqual(result.attrs["name"], "RESPONSE");
    }),
  );

  it.effect("joins a replacement's CLASS with the props' class into one class attribute", () =>
    Effect.gen(function* classOtherCase() {
      const result = yield* Effect.fromResult(
        applyPart(
          rowFor("choice-interaction", "control"),
          controlProps,
          [],
          returning(h("input", { CLASS: "b c", type: "radio" })),
        ),
      );
      assert.deepStrictEqual(spelledAs(result.attrs, "class"), [["class", "a b c"]]);
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

  it.effect("keeps a replacement's TYPE over the defaulted type, leaving one type attribute", () =>
    Effect.gen(function* rootOverDefaultOtherCase() {
      const result = yield* Effect.fromResult(
        applyPart(buttonRow, buttonProps, [], returning(h("button", { TYPE: "submit" }))),
      );
      assert.deepStrictEqual(spelledAs(result.attrs, "type"), [["TYPE", "submit"]]);
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

  it.effect(
    "writes the list roles over a ROLE the replacement or a Choice root names, leaving one",
    () =>
      Effect.gen(function* listRolesOtherCase() {
        const result = yield* Effect.fromResult(
          applyPart(
            rowFor("choice-interaction", "choices"),
            choicesProps,
            [roleChoice("A"), roleChoice("B")],
            (props, children) => h("div", { ...props, ROLE: "group" }, children),
          ),
        );
        assert.deepStrictEqual(spelledAs(result.attrs, "role"), [["role", "list"]]);
        for (const child of result.children) {
          assert.deepStrictEqual(child.kind === "element" ? spelledAs(child.attrs, "role") : [], [
            ["role", "listitem"],
          ]);
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

  it.effect("[Q-12] writes the props' name over a Control replacement's NAME, leaving one", () =>
    Effect.gen(function* selectNameOtherCase() {
      const result = yield* Effect.fromResult(
        applyPart(selectRow, selectProps, options, (_props, children) =>
          h("select", { NAME: "HOST" }, children),
        ),
      );
      assert.deepStrictEqual(spelledAs(result.attrs, "name"), [["name", "RESPONSE"]]);
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

/**
 * Construct a replacement that returns a `tag` element holding the props it is handed with
 * `extra` laid over them, and the children it is handed.
 *
 * @param tag The element the replacement returns.
 * @param extra The attributes the replacement adds.
 * @returns A part function returning a `tag` element.
 */
const adding = (tag: string, extra: Attributes) => (props: Attributes, children: readonly Node[]) =>
  h(tag, { ...props, ...extra }, children);

describe("applyPart, the state attributes plate leaves off", () => {
  /**
   * The Inline Choice Control's row.
   */
  const selectRow = rowFor("inline-choice-interaction", "control");

  /**
   * The Inline Choice Control's attributes in answering, as its connect function computes them:
   * no `disabled` and no `aria-describedby`.
   */
  const selectProps: Attributes = {
    "aria-label": "Answer",
    autocomplete: "off",
    "data-slot": selectRow.slot,
    id: "i1-RESPONSE-control-0",
    name: "RESPONSE",
  };

  /**
   * The Inline Choice Option's row.
   */
  const optionRow = rowFor("inline-choice-interaction", "option");

  /**
   * An Option's attributes for a choice that is not restored: no `selected`.
   */
  const optionProps: Attributes = { "data-slot": optionRow.slot, value: "A" };

  /**
   * The Text Entry Control's row.
   */
  const textRow = rowFor("text-entry-interaction", "control");

  /**
   * The Text Entry Control's attributes in answering: no `readonly` and no `disabled`.
   */
  const textProps: Attributes = {
    "aria-label": "Answer",
    autocomplete: "off",
    "data-slot": textRow.slot,
    id: "i1-RESPONSE-control-0",
    name: "RESPONSE",
    type: "text",
  };

  /**
   * The Extended Text Control's row.
   */
  const essayRow = rowFor("extended-text-interaction", "control");

  /**
   * The Extended Text Control's attributes in answering: no `readonly` and no `disabled`.
   */
  const essayProps: Attributes = {
    "aria-label": "Answer",
    "data-slot": essayRow.slot,
    id: "i1-RESPONSE-control-0",
    name: "RESPONSE",
  };

  it.effect(
    "[Q-12] drops an Option replacement's selected, in any case, on a choice plate leaves unselected",
    () =>
      Effect.gen(function* optionSelectedDropped() {
        for (const extra of [{ selected: true }, { SELECTED: "" }] as const) {
          const result = yield* Effect.fromResult(
            applyPart(optionRow, optionProps, [text("Apple")], adding("option", extra)),
          );
          assert.deepStrictEqual(spelledAs(result.attrs, "selected"), [], Object.keys(extra)[0]);
          assert.strictEqual(result.attrs["value"], "A");
        }
      }),
  );

  it.effect(
    "[Q-12] drops disabled and hidden, in any case, from an Option or Placeholder replacement",
    () =>
      Effect.gen(function* optionHiddenDropped() {
        for (const part of ["option", "placeholder"] as const) {
          const row = rowFor("inline-choice-interaction", part);
          const props: Attributes = { "data-slot": row.slot, value: part === "option" ? "A" : "" };
          for (const extra of [
            { disabled: true },
            { hidden: true },
            { DISABLED: "", HIDDEN: "hidden" },
          ] as const) {
            const result = yield* Effect.fromResult(
              applyPart(row, props, [text("Apple")], adding("option", extra)),
            );
            const named = Object.keys(extra).join(" ");
            assert.deepStrictEqual(spelledAs(result.attrs, "disabled"), [], `${part} ${named}`);
            assert.deepStrictEqual(spelledAs(result.attrs, "hidden"), [], `${part} ${named}`);
          }
        }
      }),
  );

  it.effect(
    "drops a Choice Control replacement's checked, in any case, on an unchecked choice",
    () =>
      Effect.gen(function* choiceCheckedDropped() {
        for (const extra of [{ checked: true }, { CHECKED: "checked" }] as const) {
          const result = yield* Effect.fromResult(
            applyPart(
              rowFor("choice-interaction", "control"),
              controlProps,
              [],
              adding("input", extra),
            ),
          );
          assert.deepStrictEqual(spelledAs(result.attrs, "checked"), [], Object.keys(extra)[0]);
          assert.strictEqual(result.attrs["value"], "A");
        }
      }),
  );

  it.effect(
    "drops a text Control replacement's readonly or disabled while plate leaves it editable",
    () =>
      Effect.gen(function* textStateDropped() {
        for (const [row, props, tag] of [
          [textRow, textProps, "input"],
          [essayRow, essayProps, "textarea"],
        ] as const) {
          for (const extra of [{ readonly: true }, { disabled: true }, { READONLY: "" }] as const) {
            const result = yield* Effect.fromResult(applyPart(row, props, [], adding(tag, extra)));
            const named = `${row.slot} ${Object.keys(extra)[0]}`;
            assert.deepStrictEqual(spelledAs(result.attrs, "readonly"), [], named);
            assert.deepStrictEqual(spelledAs(result.attrs, "disabled"), [], named);
            assert.strictEqual(result.attrs["name"], "RESPONSE", named);
          }
        }
      }),
  );

  it.effect(
    "[Q-12] drops a select Control replacement's disabled while plate leaves it enabled",
    () =>
      Effect.gen(function* selectDisabledDropped() {
        const result = yield* Effect.fromResult(
          applyPart(selectRow, selectProps, [], adding("select", { DISABLED: "" })),
        );
        assert.deepStrictEqual(spelledAs(result.attrs, "disabled"), []);
      }),
  );

  it.effect("drops a navigation button replacement's disabled where plate leaves it enabled", () =>
    Effect.gen(function* navigationDisabledDropped() {
      for (const part of ["previous", "next", "itemButton", "submit", "end"] as const) {
        const row = rowFor("test-navigation", part);
        const props: Attributes = { "data-intent": part, "data-slot": row.slot };
        const result = yield* Effect.fromResult(
          applyPart(row, props, [text(part)], adding("button", { disabled: true })),
        );
        assert.deepStrictEqual(spelledAs(result.attrs, "disabled"), [], part);
        assert.strictEqual(result.attrs["type"], "button", part);
      }
    }),
  );

  it.effect(
    "[Q-12] keeps a replacement's data attribute, title and aria-describedby where plate writes none, beside a dropped state",
    () =>
      Effect.gen(function* othersStand() {
        const result = yield* Effect.fromResult(
          applyPart(
            selectRow,
            selectProps,
            [],
            adding("select", {
              "aria-describedby": "host-hint",
              "data-host": "1",
              disabled: true,
              title: "Fruit",
            }),
          ),
        );
        assert.strictEqual(result.attrs["aria-describedby"], "host-hint");
        assert.strictEqual(result.attrs["data-host"], "1");
        assert.strictEqual(result.attrs["title"], "Fruit");
        assert.deepStrictEqual(spelledAs(result.attrs, "disabled"), []);
      }),
  );

  it.effect(
    "[Q-12] keeps plate's selected on a restored Option and plate's disabled in review, over a replacement's in another case",
    () =>
      Effect.gen(function* plateStateStands() {
        const option = yield* Effect.fromResult(
          applyPart(
            optionRow,
            { ...optionProps, selected: true },
            [text("Apple")],
            adding("option", { SELECTED: "host" }),
          ),
        );
        assert.deepStrictEqual(spelledAs(option.attrs, "selected"), [["selected", true]]);

        const select = yield* Effect.fromResult(
          applyPart(
            selectRow,
            { ...selectProps, disabled: true },
            [],
            adding("select", { DISABLED: "host" }),
          ),
        );
        assert.deepStrictEqual(spelledAs(select.attrs, "disabled"), [["disabled", true]]);
      }),
  );
});

describe("applyPart, a Label that is not a label", () => {
  it.effect("writes no for onto a Label replacement whose root is a span, and keeps its id", () =>
    Effect.gen(function* labelAsSpan() {
      for (const interaction of ["choice-interaction", "inline-choice-interaction"] as const) {
        const row = rowFor(interaction, "label");
        const props: Attributes = {
          "data-slot": row.slot,
          for: "i1-RESPONSE-control",
          id: "i1-RESPONSE-label",
        };
        const result = yield* Effect.fromResult(applyPart(row, props, [text("Fruit")], as("span")));
        assert.strictEqual(result.tag, "span", interaction);
        assert.deepStrictEqual(spelledAs(result.attrs, "for"), [], interaction);
        assert.strictEqual(result.attrs["id"], "i1-RESPONSE-label", interaction);
      }
    }),
  );

  it.effect(
    "writes for onto a Label replacement whose root is a label, over the replacement's",
    () =>
      Effect.gen(function* labelKeepsFor() {
        const row = rowFor("inline-choice-interaction", "label");
        const props: Attributes = {
          "data-slot": row.slot,
          for: "i1-RESPONSE-control",
          id: "i1-RESPONSE-label",
        };
        const result = yield* Effect.fromResult(
          applyPart(row, props, [text("Fruit")], adding("label", { FOR: "elsewhere" })),
        );
        assert.deepStrictEqual(spelledAs(result.attrs, "for"), [["for", "i1-RESPONSE-control"]]);
      }),
  );
});

/**
 * The instance every render here uses.
 */
const instance = "swap-0";

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * An Inline Choice of three fruits, `A`, `B` and `C`, with a Label that gives text.
 */
const fruits: InlineChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  choices: [
    {
      content: [words("apples")],
      fixed: false,
      identifier: "A",
      templateVisibility: Option.none(),
    },
    { content: [words("pears")], fixed: false, identifier: "B", templateVisibility: Option.none() },
    { content: [words("plums")], fixed: false, identifier: "C", templateVisibility: Option.none() },
  ],
  class: "",
  kind: "inline-choice",
  label: Option.some([words("Fruit")]),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response: "RESPONSE",
  shuffle: false,
};

/**
 * An item whose body is one sentence holding {@link fruits}, bound to a single identifier response.
 */
const fruitItem: Item = {
  body: [
    {
      attributes: [],
      children: [words("I would like "), fruits, words(".")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/fruit.xml",
  identifier: "fruit",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map([
    [
      fruits.response,
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: fruits.response,
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Fruit",
  unsupported: [],
};

/**
 * Render {@link fruitItem} and place it in a form, as a host composes one.
 *
 * @param options The render's options, beside its instance.
 * @returns The form holding the rendered item.
 */
const fruitForm = (options: Options) =>
  Effect.gen(function* renderFruitForm() {
    const configuration = yield* configure({});
    const { html } = yield* Effect.fromResult(
      render(redactItem(fruitItem), configuration, { ...options, instance }),
    );
    const [form] = parseHtml(`<form method="post">${html}</form>`);

    return form?.kind === "element" ? form : assert.fail("The render placed no form.");
  });

/**
 * List an element and every element below it, in document order.
 *
 * @param element The subtree's root.
 * @returns The elements, `element` first.
 */
const elementsIn = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsIn(child) : [])),
];

/**
 * Give the values of the options a form's elements hold that carry `selected` in any case.
 *
 * @param form The form.
 * @returns Each selected option's `value`, in document order.
 */
const selectedValues = (form: Element): readonly (string | true | undefined)[] =>
  elementsIn(form)
    .filter(
      (element) => element.tag === "option" && spelledAs(element.attrs, "selected").length > 0,
    )
    .map((element) => element.attrs["value"]);

describe("render, a host replacement and the state plate leaves off", () => {
  /**
   * An Option replacement that marks every choice selected, in each spelling.
   */
  const selecting = [{ selected: true }, { SELECTED: "" }] as const;

  it.effect(
    "[Q-12] selects only the Placeholder, whose value is empty, when nothing is restored, under an Option replacement that selects every choice",
    () =>
      Effect.gen(function* nothingRestored() {
        for (const extra of selecting) {
          const form = yield* fruitForm({
            parts: { "inline-choice-interaction": { option: adding("option", extra) } },
          });
          assert.deepStrictEqual(selectedValues(form), [""], Object.keys(extra)[0]);
        }
      }),
  );

  it.effect(
    "[Q-12] selects only the restored Option under an Option replacement that selects every choice",
    () =>
      Effect.gen(function* restored() {
        for (const extra of selecting) {
          const form = yield* fruitForm({
            parts: { "inline-choice-interaction": { option: adding("option", extra) } },
            values: {
              [fruits.response]: {
                baseType: "identifier",
                cardinality: "single",
                values: [{ baseType: "identifier", value: "B" }],
              },
            },
          });
          assert.deepStrictEqual(selectedValues(form), ["B"], Object.keys(extra)[0]);
        }
      }),
  );

  it.effect(
    "[Q-12] keeps the way back to no answer under a Placeholder replacement that disables or hides it",
    () =>
      Effect.gen(function* placeholderKept() {
        const form = yield* fruitForm({
          parts: {
            "inline-choice-interaction": {
              placeholder: adding("option", { disabled: true, hidden: true }),
            },
          },
        });
        const placeholder = elementsIn(form).find(
          (element) =>
            element.attrs["data-slot"] === rowFor("inline-choice-interaction", "placeholder").slot,
        );
        assert.strictEqual(placeholder?.attrs["value"], "");
        assert.deepStrictEqual(spelledAs(placeholder?.attrs ?? {}, "disabled"), []);
        assert.deepStrictEqual(spelledAs(placeholder?.attrs ?? {}, "hidden"), []);
      }),
  );

  it.effect(
    "[Q-12] writes no for onto a Label swapped to a span, and the Control's aria-labelledby still names it",
    () =>
      Effect.gen(function* spanLabel() {
        const form = yield* fruitForm({
          parts: { "inline-choice-interaction": { label: as("span") } },
        });
        const elements = elementsIn(form);
        const span = elements.find(
          (element) =>
            element.attrs["data-slot"] === rowFor("inline-choice-interaction", "label").slot,
        );
        const select = elements.find((element) => element.tag === "select");
        assert.strictEqual(span?.tag, "span");
        assert.deepStrictEqual(spelledAs(span?.attrs ?? {}, "for"), []);
        assert.isDefined(span?.attrs["id"]);
        assert.strictEqual(select?.attrs["aria-labelledby"], span?.attrs["id"]);
      }),
  );
});

/**
 * A plain string Extended Text with no Prompt, bound to a single string response.
 */
const essay: ExtendedTextInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  cardinality: "single",
  class: "",
  expectedLength: Option.none(),
  expectedLines: Option.none(),
  format: "plain",
  kind: "extended-text",
  maxStrings: Option.none(),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  prompt: Option.none(),
  response: "RESPONSE",
};

/**
 * An item whose body is {@link essay}, with no response processing.
 */
const essayItem: Item = {
  body: [essay],
  document: "items/essay.xml",
  identifier: "essay",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map([
    [
      essay.response,
      {
        areaMapping: Option.none(),
        baseType: "string",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: essay.response,
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Essay",
  unsupported: [],
};

/**
 * The candidate's restored answer to {@link essay}.
 */
const answer = "The river floods in spring.";

/**
 * The render options that restore {@link answer} to the essay.
 */
const answered: Options = {
  values: {
    [essay.response]: {
      baseType: "string",
      cardinality: "single",
      values: [{ baseType: "string", value: answer }],
    },
  },
};

/**
 * Render {@link essayItem}.
 *
 * @param options The render's options, beside its instance.
 * @returns The render's result, success or refusal.
 */
const renderEssay = (options: Options) =>
  Effect.gen(function* renderEssayItem() {
    const configuration = yield* configure({});

    return render(redactItem(essayItem), configuration, { ...options, instance });
  });

/**
 * Give what a render of the essay came to: the refusal's tag, and for a swap refusal its cause and
 * where, or `rendered`.
 *
 * @param result The render's result.
 * @returns `rendered`, the swap refusal's facts, or another refusal's tag.
 */
const outcomeOf = (result: ReturnType<typeof render>) => {
  if (Result.isSuccess(result)) {
    return "rendered";
  }

  const { failure } = result;
  if (failure._tag !== "PartSwapRefused") {
    return failure._tag;
  }

  return {
    _tag: failure._tag,
    cause: failure.cause,
    interaction: failure.interaction,
    part: failure.part,
  };
};

/**
 * The textarea of a rendered essay, read back as a browser parses the HTML.
 *
 * @param result The render's result, which must be a success.
 * @returns The one `textarea` element.
 */
const textareaOf = (result: ReturnType<typeof render>): Element => {
  const html = Result.isSuccess(result) ? result.success.html : assert.fail("The render refused.");
  const textareas = parseHtml(html)
    .flatMap((node) => (node.kind === "element" ? elementsIn(node) : []))
    .filter((element) => element.tag === "textarea");

  return textareas.length === 1 && textareas[0] !== undefined
    ? textareas[0]
    : assert.fail(`The render placed ${textareas.length} textareas.`);
};

describe("render, an Extended Text Control replacement holds exactly the handed answer", () => {
  /**
   * The swap refusal a textarea that holds more than the handed answer earns.
   */
  const handedOnly = {
    _tag: "PartSwapRefused",
    cause: "select-content",
    interaction: "extended-text-interaction",
    part: "control",
  } as const;

  it.effect("refuses a textarea that adds host text beside the restored answer", () =>
    Effect.gen(function* hostTextBesideAnswer() {
      for (const [where, replacement] of [
        [
          "before",
          (props: Attributes, children: readonly Node[]) =>
            h("textarea", props, [text("host answer "), ...children]),
        ],
        [
          "after",
          (props: Attributes, children: readonly Node[]) =>
            h("textarea", props, [...children, text(" host answer")]),
        ],
      ] as const) {
        const result = yield* renderEssay({
          ...answered,
          parts: { "extended-text-interaction": { control: replacement } },
        });
        assert.deepStrictEqual(outcomeOf(result), handedOnly, where);
      }
    }),
  );

  it.effect("refuses a textarea that holds host content when nothing is restored", () =>
    Effect.gen(function* hostContentUnanswered() {
      for (const [what, added] of [
        ["text", text("host answer")],
        ["element", h("b", {}, [text("host answer")])],
      ] as const) {
        const result = yield* renderEssay({
          parts: {
            "extended-text-interaction": {
              control: (props, children) => h("textarea", props, [added, ...children]),
            },
          },
        });
        assert.deepStrictEqual(outcomeOf(result), handedOnly, what);
      }
    }),
  );

  it.effect(
    "renders a textarea that holds exactly the restored answer with the host's own attributes, posting the answer under plate's name",
    () =>
      Effect.gen(function* handedAnswerKept() {
        const plain = textareaOf(yield* renderEssay(answered));
        const swapped = textareaOf(
          yield* renderEssay({
            ...answered,
            parts: {
              "extended-text-interaction": {
                control: adding("textarea", { "data-host": "essay", title: "Your essay" }),
              },
            },
          }),
        );
        assert.deepStrictEqual(swapped.children, [text(answer)]);
        assert.deepStrictEqual(swapped.children, plain.children);
        assert.isDefined(plain.attrs["name"]);
        assert.strictEqual(swapped.attrs["name"], plain.attrs["name"]);
        assert.strictEqual(swapped.attrs["data-host"], "essay");
        assert.strictEqual(swapped.attrs["title"], "Your essay");
      }),
  );
});
