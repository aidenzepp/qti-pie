import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import { authoredId, partForSlot, resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { Malformed, decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { renderChoice, validateChoice } from "#plate/interactions/choice.ts";
import { message } from "#plate/messages.ts";
import type { BodyNode, ChoiceInteraction, Item } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { payload, redactItem } from "#plate/payload.ts";
import type { ChoicePayload, EmitState, Payload, TextEntryPayload, View } from "#plate/payload.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { keyboardWalk } from "#plate/test/keyboard.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance every payload here is built for.
 */
const instance = "0b6c1f3e-2a4d-4c8e-9f17-5d2e8a3b6c40";

/**
 * The identifier of the response every Choice here binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Choice's Controls post under.
 */
const name = entryName(instance, response);

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * A single Choice of three colours with a phrasing Prompt, which takes the `legend` markup.
 */
const colours: ChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  cardinality: "single",
  choices: [
    { content: [words("Red")], identifier: "A" },
    { content: [words("Green")], identifier: "B" },
    { content: [words("Blue")], identifier: "C" },
  ],
  class: "swatches",
  kind: "choice",
  maxChoices: 1n,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0n,
  orientation: Option.some("horizontal"),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([words("Pick a colour.")]),
  response,
  shuffle: false,
};

/**
 * The colours as a multiple Choice that takes exactly two: checkboxes, `max-choices` and
 * `min-choices` 2.
 */
const pairs: ChoiceInteraction = {
  ...colours,
  cardinality: "multiple",
  maxChoices: 2n,
  minChoices: 2n,
};

/**
 * The colours with a Prompt of flow content, a `p`, which takes the `labelledby` markup.
 */
const paragraphPrompt: ChoiceInteraction = {
  ...colours,
  prompt: Option.some([
    {
      attributes: [],
      children: [words("Pick a colour.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-prompt/p",
      tag: "p",
    },
  ]),
};

/**
 * Construct an item whose body is one Choice, bound to an identifier response of its
 * cardinality, with no response processing.
 *
 * @param interaction The Choice.
 * @returns The item.
 */
const itemOf = (interaction: ChoiceInteraction): Item => ({
  body: [interaction],
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
        cardinality: interaction.cardinality,
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: response,
        mapping: Option.none(),
      },
    ],
  ]),
  title: "Colours",
  unsupported: [],
});

/**
 * The view of a first render: no messages, nothing posted, no values and no author's names.
 */
const answering: View = {
  finished: false,
  instance,
  locale: "en",
  messages: [],
  names: new Map(),
  posted: Option.none(),
  values: new Map(),
};

/**
 * Compute the payload of an item holding one Choice.
 *
 * @param interaction The Choice.
 * @param view How the render was asked for, a first render by default.
 * @returns The payload of the redacted item.
 */
const payloadOf = (interaction: ChoiceInteraction, view: View = answering): Payload =>
  payload(redactItem(itemOf(interaction)), view);

/**
 * Give the Choice payload a payload's body starts with.
 *
 * @param built The payload.
 * @returns Its Choice.
 */
const choiceIn = (built: Payload): ChoicePayload => {
  const [first] = built.body;

  return first?.kind === "choice" ? first : assert.fail("The body does not start with a Choice.");
};

/**
 * The emit state of every render here, with no part overrides.
 */
const emitState: Effect.Effect<EmitState> = Effect.fromResult(resolveOverrides()).pipe(
  Effect.orDie,
  Effect.map((parts): EmitState => ({
    assetBase: "",
    headingLevel: 2,
    locale: "en",
    parts,
  })),
);

/**
 * Render the Choice a payload holds.
 *
 * @param built The payload.
 * @returns The Choice Root.
 */
const render = (built: Payload): Effect.Effect<Element> =>
  emitState.pipe(
    Effect.flatMap((state) =>
      Effect.orDie(Effect.fromResult(renderChoice(choiceIn(built), built, state))),
    ),
  );

/**
 * Place a Choice Root in a minimal item: a Root carrying `lang`, and a plain `form`, as an author
 * composes it, holding the Choice and a submit button after it.
 *
 * @param root The Choice Root.
 * @param built The payload it was rendered from, which gives `lang`.
 * @returns The item's root.
 */
const page = (root: Element, built: Payload): Element =>
  h("qti-assessment-item", { "data-slot": rowFor("item", "root").slot, lang: built.lang }, [
    h("form", { action: "/submit", method: "post", novalidate: true }, [
      root,
      h("button", { type: "submit" }, [text("Submit")]),
    ]),
  ]);

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
 * the part table.
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
 * Give an element's element children.
 *
 * @param element The element.
 * @returns Its children that are elements, in order.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Give an element's element child at a position, failing the test when it has none there.
 *
 * @param element The element.
 * @param index The position among its element children, from 0.
 * @returns The child.
 */
const childAt = (element: Element, index: number): Element =>
  elementChildren(element)[index] ?? assert.fail(`<${element.tag}> has no element child ${index}.`);

/**
 * Construct the entries a form posts for the Choice's response.
 *
 * @param values The identifiers posted, in order.
 * @returns One entry per identifier, under the Choice's entry name.
 */
const posting = (...values: readonly string[]): readonly Entry[] =>
  values.map((value) => [name, value]);

/**
 * Decode the entries posted for a Choice as its caller does, under the entry name the caller gave
 * its Controls, as identifiers of the Choice's cardinality.
 *
 * @param interaction The Choice.
 * @param entries The posted entries.
 * @param entry The entry name the caller reads, the Choice's default name unless given.
 * @returns The decoded value, or the {@link Malformed} `decode` gave.
 */
const decoded = (
  interaction: ChoiceInteraction,
  entries: readonly Entry[],
  entry: string = name,
): Effect.Effect<Value | Malformed> =>
  Effect.succeed(
    Result.merge(
      decode(entries, {
        baseType: "identifier",
        cardinality: interaction.cardinality,
        name: entry,
      }),
    ),
  );

/**
 * The path of a choice's content in the fixtures that build it.
 */
const choicePath = "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-simple-choice";

/**
 * Construct an element of a choice's content.
 *
 * @param tag The element's local name.
 * @param attributes Its attributes, by name.
 * @param children Its children, none by default.
 * @returns The element node.
 */
const contentElement = (
  tag: string,
  attributes: Readonly<Record<string, string>>,
  children: readonly BodyNode[] = [],
): BodyNode => ({
  attributes: Object.entries(attributes).map(([attribute, value]) => ({ name: attribute, value })),
  children,
  kind: "element",
  path: `${choicePath}/${tag}`,
  tag,
});

/**
 * An image the author marked decorative, `alt=""`, which gives a reader no text.
 *
 * @param source The image's `src`.
 * @returns The `img` node.
 */
const decorative = (source: string): BodyNode => contentElement("img", { alt: "", src: source });

/**
 * Four colour swatches, the second only an image the author marked decorative, as the corpus's
 * image-only Choices are; the others give text: words, an image's `alt`, words.
 */
const swatches: ChoiceInteraction = {
  ...colours,
  choices: [
    { content: [words("Red")], identifier: "A" },
    { content: [decorative("images/green.png")], identifier: "B" },
    {
      content: [contentElement("img", { alt: "A blue swatch", src: "images/blue.png" })],
      identifier: "C",
    },
    { content: [words("Yellow")], identifier: "D" },
  ],
};

describe("renderChoice", () => {
  it.effect(
    "[Q-2] names each Control by its choice text and the group by its Prompt, and passes checkTree",
    () =>
      Effect.gen(function* namesEveryControl() {
        for (const interaction of [colours, paragraphPrompt]) {
          const built = payloadOf(interaction);
          const root = yield* render(built);
          const tree = page(root, built);

          assert.deepStrictEqual(
            partsIn(tree, "control").map((control) => nameOf(control, tree)),
            ["Red", "Green", "Blue"],
          );
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        }

        const legendRoot = yield* render(payloadOf(colours));
        const legend = childAt(legendRoot, 0);
        assert.strictEqual(legend.tag, "legend");
        assert.deepStrictEqual(partsIn(legendRoot, "prompt"), [legend]);
        assert.strictEqual(textOf(legend), "Pick a colour.");
        assert.isUndefined(legendRoot.attrs["aria-labelledby"]);

        const labelledBuilt = payloadOf(paragraphPrompt);
        const labelledRoot = yield* render(labelledBuilt);
        const [prompt] = partsIn(labelledRoot, "prompt");
        assert.strictEqual(prompt?.tag, "qti-prompt");
        assert.strictEqual(labelledRoot.attrs["aria-labelledby"], prompt?.attrs["id"]);
        assert.strictEqual(
          nameOf(labelledRoot, page(labelledRoot, labelledBuilt)),
          "Pick a colour.",
        );
      }),
  );

  it.effect("[Q-2] names no group and holds no Prompt when the Choice has none", () =>
    Effect.gen(function* namesNoGroup() {
      const built = payloadOf({ ...colours, prompt: Option.none() });
      const root = yield* render(built);

      assert.isUndefined(root.attrs["aria-labelledby"]);
      assert.deepStrictEqual(partsIn(root, "prompt"), []);
      assert.deepStrictEqual(elementChildren(root), partsIn(root, "choices"));
      assert.lengthOf(partsIn(root, "control"), 3);
      assert.deepStrictEqual(checkTree(page(root, built), { baseLevel: 2 }), []);
    }),
  );

  it.effect("[Q-2] names a Choice with no Prompt by the author's aria-label", () =>
    Effect.gen(function* namesByAriaLabel() {
      const built = payloadOf({
        ...colours,
        ariaLabel: Option.some("Pick a city"),
        prompt: Option.none(),
      });
      const root = yield* render(built);

      assert.strictEqual(root.attrs["aria-label"], "Pick a city");
      assert.isUndefined(root.attrs["aria-labelledby"]);
      assert.strictEqual(nameOf(root, page(root, built)), "Pick a city");
    }),
  );

  it.effect(
    "[Q-2] names a Choice with no Prompt by the author's aria-labelledby, each id scoped by the instance",
    () =>
      Effect.gen(function* namesByAriaLabelledby() {
        const root = yield* render(
          payloadOf({
            ...colours,
            ariaLabelledby: Option.some("intro note"),
            prompt: Option.none(),
          }),
        );

        assert.strictEqual(
          root.attrs["aria-labelledby"],
          `${authoredId(instance, "intro")} ${authoredId(instance, "note")}`,
        );
        assert.isUndefined(root.attrs["aria-label"]);
      }),
  );

  it.effect(
    "[Q-2] writes no aria-labelledby for an authored one that names no id, and falls back as with none",
    () =>
      Effect.gen(function* emptyAriaLabelledby() {
        const blank = Option.some(" \t\n ");
        const unnamed = yield* render(
          payloadOf({ ...colours, ariaLabelledby: blank, prompt: Option.none() }),
        );

        assert.isUndefined(unnamed.attrs["aria-labelledby"]);
        assert.isUndefined(unnamed.attrs["aria-label"]);

        const labelled = yield* render(
          payloadOf({
            ...colours,
            ariaLabel: Option.some("Pick a city"),
            ariaLabelledby: blank,
            prompt: Option.none(),
          }),
        );

        assert.isUndefined(labelled.attrs["aria-labelledby"]);
        assert.strictEqual(labelled.attrs["aria-label"], "Pick a city");
      }),
  );

  it.effect(
    "[Q-2] names a Choice by its Prompt, not the author's attributes, when it has one",
    () =>
      Effect.gen(function* promptWins() {
        const legendRoot = yield* render(
          payloadOf({ ...colours, ariaLabel: Option.some("Pick a city") }),
        );

        assert.strictEqual(childAt(legendRoot, 0).tag, "legend");
        assert.isUndefined(legendRoot.attrs["aria-label"]);
        assert.isUndefined(legendRoot.attrs["aria-labelledby"]);

        const labelledRoot = yield* render(
          payloadOf({ ...paragraphPrompt, ariaLabelledby: Option.some("intro") }),
        );
        const [prompt] = partsIn(labelledRoot, "prompt");

        assert.strictEqual(prompt?.tag, "qti-prompt");
        assert.isDefined(prompt?.attrs["id"]);
        assert.strictEqual(labelledRoot.attrs["aria-labelledby"], prompt?.attrs["id"]);
        assert.isUndefined(labelledRoot.attrs["aria-label"]);
      }),
  );

  it.effect(
    "[Q-2] makes the Root a fieldset with no role for max-choices 1 and for more, and emits no radiogroup",
    () =>
      Effect.gen(function* rootIsFieldset() {
        for (const [interaction, type] of [
          [colours, "radio"],
          [pairs, "checkbox"],
        ] as const) {
          const built = payloadOf(interaction);
          const root = yield* render(built);

          assert.strictEqual(root.tag, "fieldset");
          assert.deepStrictEqual(partsIn(root, "root"), [root]);
          assert.isUndefined(root.attrs["role"]);
          assert.notInclude(toHtml(page(root, built)), "radiogroup");
          assert.deepStrictEqual(
            partsIn(root, "control").map((control) => control.attrs["type"]),
            [type, type, type],
          );
          assert.strictEqual(root.attrs["class"], "swatches");
          assert.strictEqual(root.attrs["data-orientation"], "horizontal");
          assert.strictEqual(root.attrs["data-mode"], "answering");
          assert.isUndefined(root.attrs["data-attempt"]);
          assert.isUndefined(root.attrs["data-disabled"]);
        }
      }),
  );

  it.effect(
    "[Q-2] holds one li per choice, a Control then a Label holding the Indicator and the content, and round-trips",
    () =>
      Effect.gen(function* listStructure() {
        const built = payloadOf(colours);
        const root = yield* render(built);
        const list = childAt(root, 1);

        assert.strictEqual(list.tag, "ul");
        assert.deepStrictEqual(partsIn(root, "choices"), [list]);
        assert.deepStrictEqual(list.children, partsIn(root, "choice"));
        assert.deepStrictEqual(
          elementChildren(list).map((choice) => choice.tag),
          ["li", "li", "li"],
        );

        for (const [index, choice] of elementChildren(list).entries()) {
          const control = childAt(choice, 0);
          const label = childAt(choice, 1);
          const indicator = childAt(label, 0);

          assert.strictEqual(choice.children.length, 2);
          assert.strictEqual(control.tag, "input");
          assert.strictEqual(label.tag, "label");
          assert.strictEqual(control.attrs["name"], name);
          assert.strictEqual(control.attrs["value"], ["A", "B", "C"][index]);
          assert.strictEqual(label.attrs["for"], control.attrs["id"]);
          assert.strictEqual(control.attrs["aria-labelledby"], label.attrs["id"]);
          assert.deepStrictEqual(partsIn(choice, "indicator"), [indicator]);
          assert.strictEqual(indicator.attrs["aria-hidden"], "true");
          assert.deepStrictEqual(label.children, [
            indicator,
            text(["Red", "Green", "Blue"][index] ?? ""),
          ]);
        }

        assert.isTrue(roundTrips(page(root, built)));
      }),
  );

  it.effect(
    "[Q-2] keeps a phrasing Prompt a legend when it holds a notice, the notice a span",
    () =>
      Effect.gen(function* noticeInLegend() {
        const built = payloadOf({
          ...colours,
          prompt: Option.some([
            words("Pick a colour "),
            {
              feature: "qti-printed-variable",
              kind: "unsupported",
              path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-prompt/qti-printed-variable",
            },
          ]),
        });
        const root = yield* render(built);
        const legend = childAt(root, 0);
        const notice = childAt(legend, 0);
        const tree = page(root, built);

        assert.strictEqual(legend.tag, "legend");
        assert.strictEqual(notice.tag, "span");
        assert.strictEqual(notice.attrs["data-slot"], rowFor("item", "notice").slot);
        assert.strictEqual(notice.attrs["role"], "note");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    "[Q-2] [keyboard] names every Control by the payload's form name, the author's when given",
    () =>
      Effect.gen(function* namesControls() {
        const authored = payloadOf(colours, {
          ...answering,
          names: new Map([[response, "colour"]]),
        });
        const root = yield* render(authored);
        const plain = yield* render(payloadOf(colours));

        assert.strictEqual(choiceIn(authored).formName, "colour");
        assert.deepStrictEqual(
          partsIn(root, "control").map((control) => control.attrs["name"]),
          ["colour", "colour", "colour"],
        );
        assert.deepStrictEqual(
          partsIn(plain, "control").map((control) => control.attrs["name"]),
          [name, name, name],
        );
        assert.deepStrictEqual(
          keyboardWalk(page(root, authored), ["Tab", "ArrowDown", "Tab", "Enter"]),
          Option.some([["colour", "B"]]),
        );
      }),
  );

  it.effect(
    "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the second choice",
    () =>
      Effect.gen(function* radioWalk() {
        const built = payloadOf(colours);
        const root = yield* render(built);
        const posted = keyboardWalk(page(root, built), ["Tab", "ArrowDown", "Tab", "Enter"]);

        assert.deepStrictEqual(posted, Option.some([[name, "B"]]));

        assert.deepStrictEqual(
          validateChoice(
            colours,
            yield* decoded(
              colours,
              Option.getOrElse(posted, () => []),
            ),
            yield* configure({}),
          ),
          [],
        );
      }),
  );

  it.effect("[Q-2] [keyboard] a checkbox walk posts the selected set", () =>
    Effect.gen(function* checkboxWalk() {
      const built = payloadOf(pairs);
      const root = yield* render(built);
      const posted = keyboardWalk(page(root, built), [
        "Tab",
        "Space",
        "Tab",
        "Tab",
        "Space",
        "Tab",
        "Enter",
      ]);

      assert.deepStrictEqual(
        posted,
        Option.some([
          [name, "A"],
          [name, "C"],
        ]),
      );

      assert.deepStrictEqual(
        validateChoice(
          pairs,
          yield* decoded(
            pairs,
            Option.getOrElse(posted, () => []),
          ),
          yield* configure({ validateResponses: true }),
        ),
        [],
      );
    }),
  );

  it.effect(
    "[Q-2] with messages, restores the posted choices, marks every Control invalid and described, and autofocuses the first",
    () =>
      Effect.gen(function* afterRefused() {
        const configuration = yield* configure({});
        const messages = validateChoice(
          pairs,
          yield* decoded(pairs, posting("A", "B", "C")),
          configuration,
        );
        const built = payloadOf(pairs, {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["A", "B", "C"]]])),
        });
        const root = yield* render(built);
        const tree = page(root, built);
        const controls = partsIn(root, "control");
        const describedBy = built.messages.map((entry) => entry.id).join(" ");

        assert.isNotEmpty(built.messages);
        assert.isUndefined(root.attrs["data-attempt"]);
        for (const control of controls) {
          assert.strictEqual(control.attrs["checked"], true);
          assert.strictEqual(control.attrs["aria-invalid"], "true");
          assert.strictEqual(control.attrs["aria-describedby"], describedBy);
        }

        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          controls.slice(0, 1),
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect("[Q-2] when finished, disables every Control and restores the view's value", () =>
    Effect.gen(function* afterFinishing() {
      const built = payloadOf(colours, {
        ...answering,
        finished: true,
        values: new Map([
          [
            response,
            {
              baseType: "identifier",
              cardinality: "single",
              values: [{ baseType: "identifier", value: "B" }],
            },
          ],
        ]),
      });
      const root = yield* render(built);
      const controls = partsIn(root, "control");

      assert.strictEqual(root.attrs["data-disabled"], true);
      assert.doesNotHaveAnyKeys(root.attrs, ["data-attempt", "data-finished"]);
      assert.deepStrictEqual(
        controls.map((control) => control.attrs["disabled"]),
        [true, true, true],
      );
      assert.deepStrictEqual(
        controls.map((control) => control.attrs["checked"]),
        [undefined, true, undefined],
      );
      assert.isTrue(controls.every((control) => control.attrs["aria-invalid"] === undefined));
      assert.isTrue(elementsIn(root).every((element) => element.attrs["autofocus"] === undefined));
    }),
  );

  it.effect(
    "[Q-2] [I-8] emits a choice's content as the body does: an h1 at the heading level, an authored id scoped",
    () =>
      Effect.gen(function* contentAsBody() {
        const headed: ChoiceInteraction = {
          ...colours,
          choices: [
            {
              content: [
                {
                  attributes: [{ name: "id", value: "red" }],
                  children: [words("Red")],
                  kind: "element",
                  path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-simple-choice/h1",
                  tag: "h1",
                },
              ],
              identifier: "A",
            },
            ...colours.choices.slice(1),
          ],
        };
        const state = yield* emitState;
        const built = payloadOf(headed);
        const root = yield* render(built);
        const tree = page(root, built);
        const [label] = partsIn(root, "label");
        const heading = childAt(label ?? assert.fail("The Choice has no Label."), 1);

        assert.strictEqual(heading.tag, `h${state.headingLevel}`);
        assert.strictEqual(heading.attrs["id"], authoredId(instance, "red"));
        assert.deepStrictEqual(
          partsIn(tree, "control").map((control) => nameOf(control, tree)),
          ["Red", "Green", "Blue"],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: state.headingLevel }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    "[Q-2] names a Control whose content gives no text Choice n of count, and passes checkTree",
    () =>
      Effect.gen(function* namesUnnamedChoice() {
        const built = payloadOf(swatches);
        const root = yield* render(built);
        const tree = page(root, built);
        const controls = partsIn(tree, "control");
        const labels = partsIn(tree, "label");
        const unnamed = controls[1] ?? assert.fail("The Choice has no second Control.");

        assert.strictEqual(unnamed.attrs["aria-label"], "Choice 2 of 4");
        assert.isUndefined(unnamed.attrs["aria-labelledby"]);
        assert.deepStrictEqual(
          controls.map((control) => nameOf(control, tree)),
          ["Red", "Choice 2 of 4", "A blue swatch", "Yellow"],
        );

        for (const index of [0, 2, 3]) {
          const control = controls[index] ?? assert.fail(`The Choice has no Control ${index}.`);

          assert.strictEqual(control.attrs["aria-labelledby"], labels[index]?.attrs["id"]);
          assert.isUndefined(control.attrs["aria-label"]);
        }

        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect("[Q-2] keeps the Label naming a Control whose content carries an aria-label", () =>
    Effect.gen(function* keepsAuthoredLabel() {
      const built = payloadOf({
        ...swatches,
        choices: [
          {
            content: [contentElement("span", { "aria-label": "A green swatch", role: "img" })],
            identifier: "B",
          },
        ],
      });
      const root = yield* render(built);
      const [control] = partsIn(root, "control");
      const [label] = partsIn(root, "label");

      assert.strictEqual(control?.attrs["aria-labelledby"], label?.attrs["id"]);
      assert.isUndefined(control?.attrs["aria-label"]);
      assert.deepStrictEqual(checkTree(page(root, built), { baseLevel: 2 }), []);
    }),
  );

  it.effect(
    "[Q-2] names a Control the renderer's way when its content's only text is blank or hidden, not when it holds a notice",
    () =>
      Effect.gen(function* blankOrHidden() {
        const built = payloadOf({
          ...swatches,
          choices: [
            {
              content: [words(" \n\t"), contentElement("img", { alt: " ", src: "images/red.png" })],
              identifier: "A",
            },
            {
              content: [
                contentElement("span", { "aria-hidden": "true" }, [words("Green")]),
                decorative("images/green.png"),
              ],
              identifier: "B",
            },
            {
              content: [
                {
                  feature: "qti-printed-variable",
                  kind: "unsupported",
                  path: `${choicePath}/qti-printed-variable`,
                },
              ],
              identifier: "C",
            },
          ],
        });
        const root = yield* render(built);
        const controls = partsIn(root, "control");
        const labels = partsIn(root, "label");

        assert.deepStrictEqual(
          controls.map((control) => control.attrs["aria-label"]),
          ["Choice 1 of 3", "Choice 2 of 3", undefined],
        );
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["aria-labelledby"]),
          [undefined, undefined, labels[2]?.attrs["id"]],
        );
        assert.deepStrictEqual(checkTree(page(root, built), { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-2] numbers the renderer's names by each Choice's emitted position when shuffled",
    () =>
      Effect.gen(function* shuffledNumbers() {
        const built = payloadOf({
          ...swatches,
          choices: ["red", "green", "blue"].map((colour, index) => ({
            content: [decorative(`images/${colour}.png`)],
            identifier: ["A", "B", "C"][index] ?? "",
          })),
          shuffle: true,
        });
        const root = yield* render(built);
        const tree = page(root, built);

        assert.deepStrictEqual(
          partsIn(tree, "control").map((control) => control.attrs["aria-label"]),
          ["Choice 1 of 3", "Choice 2 of 3", "Choice 3 of 3"],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-2] writes an authored label in a choice's content as a span, so no label nests a label",
    () =>
      Effect.gen(function* labelAsSpan() {
        const labelled: ChoiceInteraction = {
          ...colours,
          choices: [
            {
              content: [
                {
                  attributes: [{ name: "id", value: "red" }],
                  children: [
                    words("Bright "),
                    {
                      attributes: [],
                      children: [words("red")],
                      kind: "element",
                      path: `${choicePath}/label/strong`,
                      tag: "strong",
                    },
                  ],
                  kind: "element",
                  path: `${choicePath}/label`,
                  tag: "label",
                },
              ],
              identifier: "A",
            },
            ...colours.choices.slice(1),
          ],
        };
        const built = payloadOf(labelled);
        const root = yield* render(built);
        const tree = page(root, built);
        const [label] = partsIn(root, "label");
        const choiceLabel = label ?? assert.fail("The Choice has no Label.");

        assert.deepStrictEqual(
          elementsIn(choiceLabel)
            .slice(1)
            .filter((element) => element.tag === "label"),
          [],
        );

        const span = childAt(choiceLabel, 1);
        assert.strictEqual(span.tag, "span");
        assert.strictEqual(span.attrs["id"], authoredId(instance, "red"));
        assert.strictEqual(textOf(span), "Bright red");
        assert.strictEqual(childAt(span, 0).tag, "strong");
        assert.deepStrictEqual(
          partsIn(tree, "control").map((control) => nameOf(control, tree)),
          ["Bright red", "Green", "Blue"],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect("returns a Result, a plain function callable with no Effect runtime", () =>
    Effect.gen(function* plainResult() {
      const built = payloadOf(colours);
      const rendered = renderChoice(choiceIn(built), built, yield* emitState);

      assert.isTrue(Result.isResult(rendered));
      assert.isTrue(Result.isSuccess(rendered));
    }),
  );

  it.effect(
    "throws NestedInteractionDefect when a choice's content holds an interaction, which QTI admits nowhere there",
    () =>
      Effect.gen(function* nestedInContent() {
        const built = payloadOf(colours);
        const outer = choiceIn(built);
        const nested: ChoicePayload = {
          ...outer,
          choices: [{ content: [outer], identifier: "A" }],
        };
        const state = yield* emitState;
        const thrown = Result.getFailure(Result.try(() => renderChoice(nested, built, state)));
        assert.isTrue(Option.isSome(thrown));

        const defect = Option.getOrThrow(thrown);
        assert.propertyVal(defect, "_tag", "NestedInteractionDefect");
        assert.propertyVal(defect, "within", "choice-interaction");
        assert.propertyVal(defect, "kind", "choice");
      }),
  );

  it.effect(
    "throws NestedInteractionDefect when the Prompt holds a Text Entry, which QTI admits nowhere there",
    () =>
      Effect.gen(function* nestedInPrompt() {
        const built = payloadOf(colours);
        const textEntry: TextEntryPayload = {
          autofocus: false,
          base: 10,
          baseType: "string",
          class: "",
          expectedLength: Option.none(),
          formName: entryName(instance, "TEXT"),
          invalid: false,
          kind: "text-entry",
          messageIds: [],
          name: {
            ariaLabel: Option.none(),
            ariaLabelledby: Option.none(),
            unnamed: Option.some({ count: 1, n: 1 }),
          },
          placeholder: Option.none(),
          response: "TEXT",
          restore: "",
        };
        const prompted: ChoicePayload = { ...choiceIn(built), prompt: Option.some([textEntry]) };
        const state = yield* emitState;
        const thrown = Result.getFailure(Result.try(() => renderChoice(prompted, built, state)));
        assert.isTrue(Option.isSome(thrown));

        const defect = Option.getOrThrow(thrown);
        assert.propertyVal(defect, "_tag", "NestedInteractionDefect");
        assert.propertyVal(defect, "within", "choice-interaction");
        assert.propertyVal(defect, "kind", "text-entry");
        assert.propertyVal(defect, "response", "TEXT");
      }),
  );
});

describe("validateChoice", () => {
  it.effect("[Q-2] refuses over-ticking with validateResponses false and true alike", () =>
    Effect.gen(function* overTicking() {
      for (const validateResponses of [false, true]) {
        const messages = validateChoice(
          pairs,
          yield* decoded(pairs, posting("A", "B", "C")),
          yield* configure({ validateResponses }),
        );

        assert.deepStrictEqual(messages, [{ response, text: message("en", "atMost", { n: "2" }) }]);
      }
    }),
  );

  it.effect("[Q-2] refuses fewer than min-choices only with validateResponses true", () =>
    Effect.gen(function* tooFew() {
      const one = yield* decoded(pairs, posting("A"));
      const lenient = validateChoice(pairs, one, yield* configure({}));
      const strict = validateChoice(pairs, one, yield* configure({ validateResponses: true }));

      assert.deepStrictEqual(lenient, []);
      assert.deepStrictEqual(strict, [{ response, text: message("en", "atLeast", { n: "2" }) }]);
    }),
  );

  it.effect(
    "[Q-2] refuses an identifier no choice presents, a duplicate and a second entry for a single",
    () =>
      Effect.gen(function* tierA() {
        const configuration = yield* configure({});
        const unknown = { response, text: message("en", "unknownChoice") };

        assert.deepStrictEqual(
          validateChoice(colours, yield* decoded(colours, posting("Z")), configuration),
          [unknown],
        );
        assert.deepStrictEqual(
          validateChoice(
            colours,
            yield* decoded(colours, posting("not an identifier")),
            configuration,
          ),
          [unknown],
        );
        assert.deepStrictEqual(
          validateChoice(pairs, yield* decoded(pairs, posting("A", "A")), configuration),
          [unknown],
        );
        assert.deepStrictEqual(
          validateChoice(colours, yield* decoded(colours, posting("A", "B")), configuration),
          [{ response, text: message("en", "atMost", { n: "1" }) }],
        );
      }),
  );

  it.effect(
    "[Q-2] [keyboard] checks the value decoded under the caller's entry name, the author's form name included, and accepts NULL",
    () =>
      Effect.gen(function* callerDecodes() {
        const configuration = yield* configure({});
        const other = entryName(instance, "OTHER");
        const authored = payloadOf(colours, {
          ...answering,
          names: new Map([[response, "colour"]]),
        });
        const walked = keyboardWalk(page(yield* render(authored), authored), [
          "Tab",
          "ArrowDown",
          "Tab",
          "Enter",
        ]);
        const colour = choiceIn(authored).formName;

        assert.deepStrictEqual(
          validateChoice(
            colours,
            yield* decoded(colours, [[other, "A"], ...posting("B")]),
            configuration,
          ),
          [],
        );
        assert.deepStrictEqual(
          validateChoice(
            colours,
            yield* decoded(
              colours,
              Option.getOrElse(walked, () => []),
              colour,
            ),
            configuration,
          ),
          [],
        );
        assert.deepStrictEqual(
          validateChoice(
            pairs,
            yield* decoded(
              pairs,
              [
                [colour, "A"],
                [colour, "B"],
                [colour, "C"],
              ],
              colour,
            ),
            configuration,
          ),
          [{ response, text: message("en", "atMost", { n: "2" }) }],
        );
        assert.deepStrictEqual(
          validateChoice(colours, yield* decoded(colours, [[other, "A"]]), configuration),
          [],
        );
      }),
  );

  it.effect(
    "[Q-2] gives a Malformed single-many atMost 1, the author's max message when set, and any other unknownChoice",
    () =>
      Effect.gen(function* malformedInput() {
        const configuration = yield* configure({});
        const twice = new Malformed({ entry: name, reason: "single-many" });
        const authored: ChoiceInteraction = {
          ...colours,
          messages: { max: Option.some("One only, please."), min: Option.none() },
        };

        assert.deepStrictEqual(validateChoice(colours, twice, configuration), [
          { response, text: message("en", "atMost", { n: "1" }) },
        ]);
        assert.deepStrictEqual(validateChoice(authored, twice, configuration), [
          { response, text: "One only, please." },
        ]);
        for (const reason of ["identifier", "number", "file"] as const) {
          assert.deepStrictEqual(
            validateChoice(colours, new Malformed({ entry: name, reason }), configuration),
            [{ response, text: message("en", "unknownChoice") }],
          );
        }
      }),
  );

  it.effect(
    "[Q-2] writes the author's data-max-selections-message and data-min-selections-message",
    () =>
      Effect.gen(function* authorMessages() {
        const authored: ChoiceInteraction = {
          ...pairs,
          messages: { max: Option.some("Two at most, please."), min: Option.some("Pick two.") },
        };
        const configuration = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(
          validateChoice(authored, yield* decoded(authored, posting("A", "B", "C")), configuration),
          [{ response, text: "Two at most, please." }],
        );
        assert.deepStrictEqual(
          validateChoice(authored, yield* decoded(authored, posting("A")), configuration),
          [{ response, text: "Pick two." }],
        );
      }),
  );
});
