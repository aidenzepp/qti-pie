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
