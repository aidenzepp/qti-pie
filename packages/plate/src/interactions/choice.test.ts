import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import { partForSlot, resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { renderChoice, validateChoice } from "#plate/interactions/choice.ts";
import { message } from "#plate/messages.ts";
import type { BodyNode, ChoiceInteraction, Item } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { payload } from "#plate/payload.ts";
import type { ChoicePayload, EmitState, Payload, View } from "#plate/payload.ts";
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
  cardinality: "single",
  choices: [
    { content: [words("Red")], identifier: "A" },
    { content: [words("Green")], identifier: "B" },
    { content: [words("Blue")], identifier: "C" },
  ],
  class: "swatches",
  kind: "choice",
  maxChoices: 1,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0,
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
  maxChoices: 2,
  minChoices: 2,
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
 * The view of a first `open`.
 */
const answering: View = {
  attempt: "none",
  finished: false,
  locale: "en",
  messages: [],
  posted: Option.none(),
};

/**
 * Compute the payload of an item holding one Choice.
 *
 * @param interaction The Choice.
 * @param view How the render was asked for, a first `open` by default.
 * @param record The session record, a fresh one by default.
 * @returns The payload.
 */
const payloadOf = (
  interaction: ChoiceInteraction,
  view: View = answering,
  record: ItemRecord = fresh(itemOf(interaction), instance),
): Payload => payload(itemOf(interaction), record, view);

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
const emitState: Effect.Effect<EmitState> = resolveOverrides().pipe(
  Effect.orDie,
  Effect.map((parts): EmitState => ({
    action: "/submit",
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
    Effect.flatMap((state) => Effect.orDie(renderChoice(choiceIn(built), built, state))),
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
          assert.strictEqual(root.attrs["data-attempt"], "none");
          assert.isUndefined(root.attrs["data-finished"]);
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

  it.effect("[Q-2] a radio walk (Tab, ArrowDown, Tab, Enter) posts the second choice", () =>
    Effect.gen(function* radioWalk() {
      const built = payloadOf(colours);
      const root = yield* render(built);
      const posted = keyboardWalk(page(root, built), ["Tab", "ArrowDown", "Tab", "Enter"]);

      assert.deepStrictEqual(posted, Option.some([[name, "B"]]));

      const validation = validateChoice(
        colours,
        Option.getOrElse(posted, () => []),
        yield* configure({}),
        instance,
      );
      assert.deepStrictEqual(validation, {
        messages: [],
        value: {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "B" }],
        },
      });
    }),
  );

  it.effect("[Q-2] a checkbox walk posts the selected set", () =>
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

      const validation = validateChoice(
        pairs,
        Option.getOrElse(posted, () => []),
        yield* configure({ validateResponses: true }),
        instance,
      );
      assert.deepStrictEqual(validation.messages, []);
      assert.deepStrictEqual(
        validation.value.values.map((single) => single.value),
        ["A", "C"],
      );
    }),
  );

  it.effect(
    "[Q-2] after a refused submit, restores the posted choices, marks every Control invalid and described, and autofocuses the first",
    () =>
      Effect.gen(function* afterRefused() {
        const configuration = yield* configure({});
        const entries = posting("A", "B", "C");
        const validation = validateChoice(pairs, entries, configuration, instance);
        const built = payloadOf(pairs, {
          attempt: "refused",
          finished: false,
          locale: "en",
          messages: validation.messages,
          posted: Option.some(new Map([[response, ["A", "B", "C"]]])),
        });
        const root = yield* render(built);
        const tree = page(root, built);
        const controls = partsIn(root, "control");
        const describedBy = built.messages.map((entry) => entry.id).join(" ");

        assert.isNotEmpty(built.messages);
        assert.strictEqual(root.attrs["data-attempt"], "refused");
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

  it.effect("[Q-2] after finishing, disables every Control and restores the recorded choice", () =>
    Effect.gen(function* afterFinishing() {
      const record: ItemRecord = {
        ...fresh(itemOf(colours), instance),
        attempt: "submitted",
        numAttempts: 1,
        responses: {
          [response]: {
            baseType: "identifier",
            cardinality: "single",
            values: [{ baseType: "identifier", value: "B" }],
          },
        },
      };
      const built = payloadOf(
        colours,
        { attempt: "submitted", finished: true, locale: "en", messages: [], posted: Option.none() },
        record,
      );
      const root = yield* render(built);
      const controls = partsIn(root, "control");

      assert.strictEqual(root.attrs["data-finished"], true);
      assert.strictEqual(root.attrs["data-attempt"], "submitted");
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
});

describe("validateChoice", () => {
  it.effect("[Q-2] refuses over-ticking with validateResponses false and true alike", () =>
    Effect.gen(function* overTicking() {
      for (const validateResponses of [false, true]) {
        const validation = validateChoice(
          pairs,
          posting("A", "B", "C"),
          yield* configure({ validateResponses }),
          instance,
        );

        assert.deepStrictEqual(validation.messages, [
          { response, text: message("en", "atMost", { n: "2" }) },
        ]);
      }
    }),
  );

  it.effect("[Q-2] refuses fewer than min-choices only with validateResponses true", () =>
    Effect.gen(function* tooFew() {
      const lenient = validateChoice(pairs, posting("A"), yield* configure({}), instance);
      const strict = validateChoice(
        pairs,
        posting("A"),
        yield* configure({ validateResponses: true }),
        instance,
      );

      assert.deepStrictEqual(lenient.messages, []);
      assert.deepStrictEqual(strict.messages, [
        { response, text: message("en", "atLeast", { n: "2" }) },
      ]);
    }),
  );

  it.effect(
    "[Q-2] refuses an identifier no choice presents, a duplicate and a second entry for a single",
    () =>
      Effect.gen(function* tierA() {
        const configuration = yield* configure({});
        const unknown = { response, text: message("en", "unknownChoice") };

        assert.deepStrictEqual(
          validateChoice(colours, posting("Z"), configuration, instance).messages,
          [unknown],
        );
        assert.deepStrictEqual(
          validateChoice(colours, posting("not an identifier"), configuration, instance).messages,
          [unknown],
        );
        assert.deepStrictEqual(
          validateChoice(pairs, posting("A", "A"), configuration, instance).messages,
          [unknown],
        );

        const single = validateChoice(colours, posting("A", "B"), configuration, instance);
        assert.deepStrictEqual(single, {
          messages: [{ response, text: message("en", "atMost", { n: "1" }) }],
          value: { baseType: "identifier", cardinality: "single", values: [] },
        });
      }),
  );

  it.effect("[Q-2] reads only this response's entries, and no entry is NULL", () =>
    Effect.gen(function* ownEntries() {
      const configuration = yield* configure({});
      const other = entryName(instance, "OTHER");

      assert.deepStrictEqual(
        validateChoice(colours, [[other, "A"], ...posting("B")], configuration, instance),
        {
          messages: [],
          value: {
            baseType: "identifier",
            cardinality: "single",
            values: [{ baseType: "identifier", value: "B" }],
          },
        },
      );
      assert.deepStrictEqual(validateChoice(colours, [[other, "A"]], configuration, instance), {
        messages: [],
        value: { baseType: "identifier", cardinality: "single", values: [] },
      });
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
          validateChoice(authored, posting("A", "B", "C"), configuration, instance).messages,
          [{ response, text: "Two at most, please." }],
        );
        assert.deepStrictEqual(
          validateChoice(authored, posting("A"), configuration, instance).messages,
          [{ response, text: "Pick two." }],
        );
      }),
  );
});
