/**
 * The ruling's swap tests for Choice (`fb4fe744` S2, "Tests the spec names"): a witness over
 * `applyPart`'s invariant and `renderChoice`, with every override resolved as an embedder's would
 * be. The three refusing cases are its proof that it can fail.
 *
 * @module
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, PartFunction } from "#plate/emit/node.ts";
import { partForSlot, resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import type { BodyNode, ChoiceInteraction, Item } from "#plate/model/item.ts";
import { payload, redactItem } from "#plate/payload.ts";
import type { ChoicePayload, EmitState, Payload } from "#plate/payload.ts";
import { nameOf } from "#plate/test/accessibility.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The identifier of the response the Choice binds.
 */
const response = "RESPONSE";

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * A single Choice of three colours whose Prompt is a `p`, so the Root names its group through
 * `aria-labelledby`, which `nameOf` reads.
 */
const colours: ChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  cardinality: "single",
  choices: [
    { content: [words("Red")], fixed: false, identifier: "A", templateVisibility: Option.none() },
    { content: [words("Green")], fixed: false, identifier: "B", templateVisibility: Option.none() },
    { content: [words("Blue")], fixed: false, identifier: "C", templateVisibility: Option.none() },
  ],
  class: "",
  kind: "choice",
  maxChoices: 1n,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0n,
  orientation: Option.none(),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([
    {
      attributes: [],
      children: [words("Pick a colour.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-prompt/p",
      tag: "p",
    },
  ]),
  response,
  shuffle: false,
};

/**
 * An item whose body is the Choice, bound to a single identifier response, with no response
 * processing.
 */
const item: Item = {
  body: [colours],
  document: "items/colours.xml",
  identifier: "colours",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map([
    [
      response,
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: response,
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Colours",
  unsupported: [],
};

/**
 * The payload of a first render of the item: no messages, nothing posted, no values.
 */
const built: Payload = payload(redactItem(item), {
  finished: false,
  instance: "6f2c9a1e-3b7d-4e05-8c21-9d4a7b0e5f13",
  locale: "en",
  messages: [],
  mode: "answering",
  names: new Map(),
  posted: Option.none(),
  values: new Map(),
});

/**
 * The Choice payload the body holds.
 */
const choice: ChoicePayload = ((): ChoicePayload => {
  const [first] = built.body;

  return first?.kind === "choice" ? first : assert.fail("The body does not start with a Choice.");
})();

/**
 * The colours' texts, in document order, which name the Controls.
 */
const colourNames = ["Red", "Green", "Blue"];

/**
 * The Prompt's text, which names the group.
 */
const promptText = "Pick a colour.";

/**
 * Render the Choice with replacements for some of its parts, resolved through `resolveOverrides`
 * into the emit state's `parts`, as an embedder's overrides are.
 *
 * @param replacements The Choice parts' replacements, keyed by part.
 * @returns The Choice Root, or the refusal of a replacement that breaks the swap invariant.
 */
const renderSwapped = (
  replacements: Partial<Record<PartOf<"choice-interaction">, PartFunction<Attributes>>>,
): Effect.Effect<Element, PartSwapRefused> =>
  Effect.fromResult(resolveOverrides({ "choice-interaction": replacements })).pipe(
    Effect.orDie,
    Effect.flatMap((parts) => {
      const state: EmitState = { assetBase: "", headingLevel: 2, locale: "en", parts };

      return Effect.fromResult(renderChoice(choice, built, state));
    }),
  );

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
 * Find the elements of a tree that are one Choice part, by their `data-slot` marker read through
 * the part table, which I1 writes onto a replacement's root.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsIn = (tree: Element, part: PartOf<"choice-interaction">): readonly Element[] =>
  elementsIn(tree).filter((element) => {
    const slot = element.attrs["data-slot"];

    return (
      slot !== undefined &&
      slot !== true &&
      Option.exists(
        partForSlot(slot),
        (found) => found.interaction === "choice-interaction" && found.part === part,
      )
    );
  });

/**
 * Give the names `nameOf` computes for each Control of a rendered Choice.
 *
 * @param root The Choice Root.
 * @returns One name per Control, in document order.
 */
const controlNames = (root: Element): readonly string[] =>
  partsIn(root, "control").map((control) => nameOf(control, root));

/**
 * Give an element's element children.
 *
 * @param element The element.
 * @returns Its children that are elements, in order.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

describe("renderChoice under the ruling's swaps", () => {
  it.effect(
    "[Q-2] merges role list and listitem when Choices and Choice become divs, and both names survive",
    () =>
      Effect.gen(function* listRolesMerged() {
        const root = yield* renderSwapped({
          choice: (props, children) => h("div", props, children),
          choices: (props, children) => h("div", props, children),
        });
        const lists = partsIn(root, "choices");
        const items = partsIn(root, "choice");

        assert.deepStrictEqual(
          lists.map((list) => [list.tag, list.attrs["role"]]),
          [["div", "list"]],
        );
        assert.deepStrictEqual(
          items.map((entry) => [entry.tag, entry.attrs["role"]]),
          [
            ["div", "listitem"],
            ["div", "listitem"],
            ["div", "listitem"],
          ],
        );
        assert.deepStrictEqual(controlNames(root), colourNames);
        assert.strictEqual(nameOf(root, root), promptText);
      }),
  );

  it.effect("[Q-2] keeps each Control's name when the Label becomes a span", () =>
    Effect.gen(function* labelAsSpan() {
      const root = yield* renderSwapped({
        label: (props, children) => h("span", props, children),
      });

      assert.deepStrictEqual(
        partsIn(root, "label").map((label) => label.tag),
        ["span", "span", "span"],
      );
      assert.deepStrictEqual(controlNames(root), colourNames);
    }),
  );

  it.effect("[Q-2] accepts a Choice that wraps the Control in a span, and the names survive", () =>
    Effect.gen(function* controlWrapped() {
      const root = yield* renderSwapped({
        choice: (props, children) =>
          h("li", props, [
            h("span", { class: "control-wrap" }, children.slice(0, 1)),
            ...children.slice(1),
          ]),
      });

      for (const entry of partsIn(root, "choice")) {
        const [wrapper] = elementChildren(entry);

        assert.strictEqual(wrapper?.tag, "span");
        assert.deepStrictEqual(
          wrapper === undefined ? [] : elementChildren(wrapper).map((child) => child.tag),
          ["input"],
        );
      }

      assert.deepStrictEqual(controlNames(root), colourNames);
      assert.strictEqual(nameOf(root, root), promptText);
    }),
  );

  it.effect("[Q-2] refuses a Choice that omits the Control as child-missing", () =>
    Effect.gen(function* controlOmitted() {
      const refused = yield* Effect.flip(
        renderSwapped({ choice: (props, children) => h("li", props, children.slice(1)) }),
      );

      assert.strictEqual(refused._tag, "PartSwapRefused");
      assert.strictEqual(refused.cause, "child-missing");
      assert.strictEqual(refused.interaction, "choice-interaction");
      assert.strictEqual(refused.part, "choice");
    }),
  );

  it.effect("[Q-2] refuses a Control swapped to a div as root-not-allowed", () =>
    Effect.gen(function* controlAsDiv() {
      const refused = yield* Effect.flip(renderSwapped({ control: (props) => h("div", props) }));

      assert.strictEqual(refused._tag, "PartSwapRefused");
      assert.strictEqual(refused.cause, "root-not-allowed");
      assert.strictEqual(refused.interaction, "choice-interaction");
      assert.strictEqual(refused.part, "control");
    }),
  );

  it.effect("[Q-2] refuses a Choice swapped to a div under the default ul as list-item", () =>
    Effect.gen(function* choiceAsDivUnderList() {
      const refused = yield* Effect.flip(
        renderSwapped({ choice: (props, children) => h("div", props, children) }),
      );

      assert.strictEqual(refused._tag, "PartSwapRefused");
      assert.strictEqual(refused.cause, "list-item");
      assert.strictEqual(refused.interaction, "choice-interaction");
      assert.strictEqual(refused.part, "choices");
    }),
  );

  it.effect(
    "[Q-2] keeps aria-hidden and the marker on the tier-2 svg Indicator, and the tree round-trips",
    () =>
      Effect.gen(function* svgIndicator() {
        const root = yield* renderSwapped({
          indicator: (props) => h("svg", props, [h("use", { href: "#app-radio-dot" })]),
        });
        const indicators = partsIn(root, "indicator");

        assert.lengthOf(indicators, 3);
        for (const indicator of indicators) {
          assert.strictEqual(indicator.tag, "svg");
          assert.strictEqual(indicator.attrs["aria-hidden"], "true");
          assert.strictEqual(
            indicator.attrs["data-slot"],
            rowFor("choice-interaction", "indicator").slot,
          );
          assert.deepStrictEqual(
            elementChildren(indicator).map((child) => [child.tag, child.attrs["href"]]),
            [["use", "#app-radio-dot"]],
          );
        }

        assert.deepStrictEqual(controlNames(root), colourNames);
        assert.isTrue(roundTrips(root));
      }),
  );
});
