import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { partForSlot, resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf, PartOverrides } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed, entryName } from "#plate/form/encoding.ts";
import { renderInlineChoice, validateInlineChoice } from "#plate/interactions/inline-choice.ts";
import { message } from "#plate/messages.ts";
import type {
  BodyNode,
  InlineChoiceInteraction,
  Item,
  TemplateVisibility,
} from "#plate/model/item.ts";
import type { ResponsesRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { payload, postings, redactItem } from "#plate/payload.ts";
import type {
  EmitState,
  InlineChoicePayload,
  Payload,
  PayloadNode,
  RenderMode,
} from "#plate/payload.ts";
import { checkResponses } from "#plate/responses.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance the entry name here is built for.
 */
const instance = "0b6c1f3e-2a4d-4c8e-9f17-5d2e8a3b6c40";

/**
 * The identifier of the response every Inline Choice here binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Inline Choice's Control posts under.
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
 * An Inline Choice of three fruits, `A`, `B` and `C`, that needs nothing: neither `required` nor
 * `min-choices`.
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
  label: Option.none(),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response,
  shuffle: false,
};

/**
 * The fruits with `required` true.
 */
const required: InlineChoiceInteraction = { ...fruits, required: true };

/**
 * The NULL response, which the Placeholder's `""` decodes to.
 */
const nothing: Value = nullOf("identifier", "single");

/**
 * Construct the single identifier response that chooses one identifier.
 *
 * @param identifier The chosen identifier, as posted.
 * @returns The response.
 */
const chosen = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * Construct the message the catalog's `atLeast` gives for a count.
 *
 * @param n The count, as the locale writes it.
 * @returns The message for {@link response}.
 */
const atLeast = (n: string) => ({ response, text: message("en", "atLeast", { n }) });

/**
 * The message the catalog's `unknownChoice` gives.
 */
const unknown = { response, text: message("en", "unknownChoice") };

describe("validateInlineChoice", () => {
  it.effect(
    "[Q-12] gives a Malformed single-many atMost 1, and any other reason unknownChoice",
    () =>
      Effect.gen(function* malformedInput() {
        const configuration = yield* configure({});

        assert.deepStrictEqual(
          validateInlineChoice(
            fruits,
            new Malformed({ entry: name, reason: "single-many" }),
            configuration,
          ),
          [{ response, text: message("en", "atMost", { n: "1" }) }],
        );
        for (const reason of ["character", "file", "identifier", "number"] as const) {
          assert.deepStrictEqual(
            validateInlineChoice(fruits, new Malformed({ entry: name, reason }), configuration),
            [unknown],
            reason,
          );
        }
      }),
  );

  it.effect(
    "[Q-12] refuses an identifier no choice names, with validateResponses false and true alike",
    () =>
      Effect.gen(function* stray() {
        for (const validateResponses of [false, true]) {
          const configuration = yield* configure({ validateResponses });

          assert.deepStrictEqual(validateInlineChoice(fruits, chosen("Z"), configuration), [
            unknown,
          ]);
          assert.deepStrictEqual(validateInlineChoice(fruits, chosen("a"), configuration), [
            unknown,
          ]);
          assert.deepStrictEqual(validateInlineChoice(fruits, chosen("A"), configuration), []);
        }
      }),
  );

  it.effect(
    "[Q-12] refuses NULL for a required Inline Choice only with validateResponses true",
    () =>
      Effect.gen(function* requiredNull() {
        const lenient = validateInlineChoice(required, nothing, yield* configure({}));
        const strict = validateInlineChoice(
          required,
          nothing,
          yield* configure({ validateResponses: true }),
        );

        assert.deepStrictEqual(lenient, []);
        assert.deepStrictEqual(strict, [atLeast("1")]);
      }),
  );

  it.effect("[Q-12] writes the author's data-min-selections-message in place of atLeast", () =>
    Effect.gen(function* authorMessage() {
      const authored: InlineChoiceInteraction = {
        ...required,
        messages: { min: Option.some("Pick a fruit.") },
      };

      assert.deepStrictEqual(
        validateInlineChoice(authored, nothing, yield* configure({ validateResponses: true })),
        [{ response, text: "Pick a fruit." }],
      );
    }),
  );

  it.effect(
    "[Q-12] refuses NULL under min-choices 1, and accepts NULL when nothing is needed",
    () =>
      Effect.gen(function* minimumOne() {
        const configuration = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(
          validateInlineChoice({ ...fruits, minChoices: 1n }, nothing, configuration),
          [atLeast("1")],
        );
        assert.deepStrictEqual(validateInlineChoice(fruits, nothing, configuration), []);
      }),
  );

  it.effect("[Q-12] accepts a chosen identifier for a required Inline Choice", () =>
    Effect.gen(function* requiredChosen() {
      const configuration = yield* configure({ validateResponses: true });

      assert.deepStrictEqual(validateInlineChoice(required, chosen("B"), configuration), []);
      assert.deepStrictEqual(
        validateInlineChoice({ ...required, minChoices: 1n }, chosen("C"), configuration),
        [],
      );
    }),
  );

  it.effect("[Q-12] validates min-choices 2 as written: a chosen identifier gives atLeast 2", () =>
    Effect.gen(function* minimumTwo() {
      const two: InlineChoiceInteraction = { ...required, minChoices: 2n };

      assert.deepStrictEqual(
        validateInlineChoice(two, chosen("A"), yield* configure({ validateResponses: true })),
        [atLeast("2")],
      );
      assert.deepStrictEqual(validateInlineChoice(two, chosen("A"), yield* configure({})), []);
    }),
  );
});

/**
 * Construct a text node of a payload.
 *
 * @param value The text.
 * @returns The node.
 */
const said = (value: string): PayloadNode => ({ kind: "text", text: value });

/**
 * The Inline Choice payload of three fruits with no Label, named by the renderer as the only
 * Control it names: `A` plain text, `B` blank, and `C` an `em` among runs of whitespace.
 */
const picker: InlineChoicePayload = {
  autofocus: false,
  choices: [
    { content: [said("apples")], identifier: "A" },
    { content: [said(" \n\t ")], identifier: "B" },
    {
      content: [
        said("  ripe\n "),
        { attributes: [], children: [said("red   plums")], kind: "element", tag: "em" },
        said(" \t"),
      ],
      identifier: "C",
    },
  ],
  class: "fruit",
  editable: true,
  formName: name,
  invalid: false,
  kind: "inline-choice",
  label: Option.none(),
  messageIds: [],
  name: {
    ariaLabel: Option.none(),
    ariaLabelledby: Option.none(),
    unnamed: Option.some({ count: 1, n: 1 }),
  },
  placeholder: Option.none(),
  response,
  restore: "",
};

/**
 * The fruits with a Label whose content gives text, an `em` among it, so the Label names the
 * Control and the renderer names nothing.
 */
const labelled: InlineChoicePayload = {
  ...picker,
  label: Option.some([
    said("Fruit "),
    { attributes: [], children: [said("to buy")], kind: "element", tag: "em" },
  ]),
  name: { ...picker.name, unnamed: Option.none() },
};

/**
 * The fruits with a Label whose content gives no text, so the renderer names the Control.
 */
const blankLabel: InlineChoicePayload = { ...picker, label: Option.some([said(" \n ")]) };

/**
 * Construct the payload of a render holding the Inline Choice.
 *
 * @param mode The render's mode.
 * @param finished Whether the author disabled every control.
 * @returns The payload; its body is unread, as {@link renderInlineChoice} takes the interaction.
 */
const pageOf = (mode: RenderMode = "answering", finished = false): Payload => ({
  body: [],
  finished,
  instance,
  lang: "en",
  messages: [],
  mode,
  notices: [],
  title: "Fruits",
});

/**
 * Give the Inline Choice payload as its mode builds it: editable only in `answering`.
 *
 * @param interaction The Inline Choice.
 * @param mode The render's mode.
 * @returns The payload with `editable` set by the mode.
 */
const inMode = (interaction: InlineChoicePayload, mode: RenderMode): InlineChoicePayload => ({
  ...interaction,
  editable: mode === "answering",
});

/**
 * Construct the emit state of a render, with the part overrides given.
 *
 * @param overrides The replacement part functions, none by default.
 * @returns The emit state.
 */
const stateOf = (overrides: PartOverrides = {}): Effect.Effect<EmitState> =>
  Effect.fromResult(resolveOverrides(overrides)).pipe(
    Effect.orDie,
    Effect.map((parts): EmitState => ({ assetBase: "", headingLevel: 2, locale: "en", parts })),
  );

/**
 * Render an Inline Choice through {@link renderInlineChoice}.
 *
 * @param interaction The Inline Choice.
 * @param built The payload of the render.
 * @param overrides The replacement part functions, none by default.
 * @returns The Root, or the refusal of a part swap.
 */
const rendered = (
  interaction: InlineChoicePayload,
  built: Payload = pageOf(),
  overrides: PartOverrides = {},
): Effect.Effect<Result.Result<Element, PartSwapRefused>> =>
  Effect.map(stateOf(overrides), (state) => renderInlineChoice(interaction, built, state));

/**
 * Render an Inline Choice and place its Root in a minimal item, as an author composes one: a Root
 * carrying `lang`, and a plain `form` holding a paragraph, the Root inside its sentence, and a
 * submit button after it.
 *
 * @param interaction The Inline Choice.
 * @param built The payload of the render.
 * @param overrides The replacement part functions, none by default.
 * @returns The item's root.
 */
const page = (
  interaction: InlineChoicePayload,
  built: Payload = pageOf(),
  overrides: PartOverrides = {},
): Effect.Effect<Element> =>
  Effect.gen(function* renderPage() {
    const root = yield* Effect.orDie(
      Effect.flatMap(rendered(interaction, built, overrides), Effect.fromResult),
    );

    return h("qti-assessment-item", { "data-slot": rowFor("item", "root").slot, lang: "en" }, [
      h("form", { action: "/submit", method: "post", novalidate: true }, [
        h("p", {}, [text("I would like "), root, text(", please.")]),
        h("button", { type: "submit" }, [text("Submit")]),
      ]),
    ]);
  });

/**
 * Render an Inline Choice whose part swap is refused, and give the refusal.
 *
 * @param interaction The Inline Choice.
 * @param overrides The replacement part functions.
 * @returns The refusal, failing the test when the swap was accepted.
 */
const refusal = (
  interaction: InlineChoicePayload,
  overrides: PartOverrides,
): Effect.Effect<PartSwapRefused> =>
  Effect.map(rendered(interaction, pageOf(), overrides), (result) =>
    Result.isFailure(result) ? result.failure : assert.fail("The swap was accepted."),
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
 * The Inline Choice parts, in the part table's order.
 */
const inlineChoiceParts = [
  "root",
  "label",
  "control",
  "placeholder",
  "option",
] as const satisfies readonly PartOf<"inline-choice-interaction">[];

/**
 * Read the Inline Choice part a node is, by its `data-slot` marker read through the part table.
 *
 * @param node The node.
 * @returns The part, or none when the node is no Inline Choice part.
 */
const partOf = (node: Node): Option.Option<PartOf<"inline-choice-interaction">> => {
  if (node.kind !== "element") {
    return Option.none();
  }

  const slot = node.attrs["data-slot"];
  if (slot === undefined || slot === true) {
    return Option.none();
  }

  return partForSlot(slot).pipe(
    Option.filter((found) => found.interaction === "inline-choice-interaction"),
    Option.flatMap((found) =>
      Option.fromUndefinedOr(inlineChoiceParts.find((part) => part === found.part)),
    ),
  );
};

/**
 * Find the elements of a tree that are one Inline Choice part.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsIn = (tree: Element, part: PartOf<"inline-choice-interaction">): readonly Element[] =>
  elementsIn(tree).filter((element) => Option.contains(partOf(element), part));

/**
 * Give the one element of a part in a tree holding a single Inline Choice, failing the test
 * otherwise.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's element.
 */
const onlyPart = (tree: Element, part: PartOf<"inline-choice-interaction">): Element => {
  const found = partsIn(tree, part);

  return found.length === 1 && found[0] !== undefined
    ? found[0]
    : assert.fail(`The tree holds ${found.length} ${part} parts, not one.`);
};

/**
 * Give the text of an option part, failing the test unless its only child is one text node.
 *
 * @param option The Placeholder or an Option.
 * @returns Its text.
 */
const onlyText = (option: Element): string => {
  const [child] = option.children;

  return option.children.length === 1 && child?.kind === "text"
    ? child.text
    : assert.fail(`The option holds ${option.children.length} children, not one text node.`);
};

/**
 * Read which options of a tree holding one Inline Choice are selected: the Placeholder, then each
 * Option in order.
 *
 * @param tree The tree.
 * @returns Whether each option carries `selected`.
 */
const selectedOptions = (tree: Element): readonly boolean[] =>
  [onlyPart(tree, "placeholder"), ...partsIn(tree, "option")].map(
    (option) => option.attrs["selected"] === true,
  );

/**
 * A replacement part function that returns an element of a given tag holding what it was handed.
 *
 * @param tag The element's tag.
 * @returns The part function.
 */
const as =
  (tag: string) =>
  (props: Attributes, children: readonly Node[]): Element =>
    h(tag, props, children);

describe("renderInlineChoice", () => {
  it.effect(
    "[Q-12] renders Root > [Control > [Placeholder, Option…]], and Root > [Label, Control] with a Label",
    () =>
      Effect.gen(function* structure() {
        const bare = yield* page(picker);
        const named = yield* page(labelled);

        for (const tree of [bare, named]) {
          const root = onlyPart(tree, "root");
          const control = onlyPart(tree, "control");

          assert.strictEqual(root.tag, "qti-inline-choice-interaction");
          assert.strictEqual(root.attrs["class"], "fruit");
          assert.strictEqual(root.attrs["data-mode"], "answering");
          assert.strictEqual(control.tag, "select");
          assert.strictEqual(control.attrs["name"], name);
          assert.strictEqual(control.attrs["autocomplete"], "off");
          assert.deepStrictEqual(control.children.map(partOf), [
            Option.some("placeholder"),
            Option.some("option"),
            Option.some("option"),
            Option.some("option"),
          ]);
          assert.isTrue(
            control.children.every((child) => child.kind === "element" && child.tag === "option"),
          );
          for (const absent of ["required", "aria-required", "size", "multiple"]) {
            assert.isUndefined(control.attrs[absent], absent);
          }
        }

        assert.deepStrictEqual(onlyPart(bare, "root").children.map(partOf), [
          Option.some("control"),
        ]);
        assert.lengthOf(partsIn(bare, "label"), 0);
        assert.deepStrictEqual(onlyPart(named, "root").children.map(partOf), [
          Option.some("label"),
          Option.some("control"),
        ]);
        assert.strictEqual(onlyPart(named, "label").tag, "label");
      }),
  );

  it.effect(
    "[Q-12] writes each Option as one text node, ASCII whitespace collapsed and trimmed, and a blank choice as Choice n of count",
    () =>
      Effect.gen(function* optionText() {
        const options = partsIn(yield* page(picker), "option");

        assert.deepStrictEqual(
          options.map((option) => option.attrs["value"]),
          ["A", "B", "C"],
        );
        assert.deepStrictEqual(options.map(onlyText), [
          "apples",
          message("en", "choiceOf", { count: "3", n: "2" }),
          "ripe red plums",
        ]);
      }),
  );

  it.effect(
    "[Q-12] puts the Placeholder first with value empty and data-prompt's text, else selectPrompt's, a blank data-prompt counting as none",
    () =>
      Effect.gen(function* placeholder() {
        const prompted = yield* page({ ...picker, placeholder: Option.some("Pick a fruit") });
        const [first] = onlyPart(prompted, "control").children;

        assert.strictEqual(first, onlyPart(prompted, "placeholder"));
        assert.strictEqual(onlyPart(prompted, "placeholder").attrs["value"], "");
        assert.strictEqual(onlyText(onlyPart(prompted, "placeholder")), "Pick a fruit");
        for (const blank of [Option.none(), Option.some(""), Option.some(" \t\r\n ")]) {
          const tree = yield* page({ ...picker, placeholder: blank });
          const shown = onlyPart(tree, "placeholder");

          assert.strictEqual(onlyText(shown), message("en", "selectPrompt"));
          assert.strictEqual(shown.attrs["value"], "");
          assert.isUndefined(shown.attrs["disabled"]);
          assert.isUndefined(shown.attrs["hidden"]);
        }
      }),
  );

  it.effect(
    "[Q-12] selects the restored identifier's Option, and the Placeholder for none or an unknown one",
    () =>
      Effect.gen(function* restore() {
        assert.deepStrictEqual(selectedOptions(yield* page({ ...picker, restore: "C" })), [
          false,
          false,
          false,
          true,
        ]);
        for (const restored of ["", "Z", "c"]) {
          assert.deepStrictEqual(
            selectedOptions(yield* page({ ...picker, restore: restored })),
            [true, false, false, false],
            restored,
          );
        }
      }),
  );

  it.effect(
    "[Q-12] names the Control by a Label that gives text, its for the Control's id and the Control's aria-labelledby its id",
    () =>
      Effect.gen(function* labelNames() {
        const tree = yield* page(labelled);
        const label = onlyPart(tree, "label");
        const control = onlyPart(tree, "control");

        assert.isString(label.attrs["id"]);
        assert.strictEqual(control.attrs["aria-labelledby"], label.attrs["id"]);
        assert.strictEqual(label.attrs["for"], control.attrs["id"]);
        assert.isUndefined(control.attrs["aria-label"]);
        assert.strictEqual(nameOf(control, tree), "Fruit to buy");
      }),
  );

  it.effect(
    '[Q-12] names the Control "Answer" when its Label gives no text, the Label still rendered with its for',
    () =>
      Effect.gen(function* blankLabelNames() {
        const tree = yield* page(blankLabel);
        const label = onlyPart(tree, "label");
        const control = onlyPart(tree, "control");

        assert.strictEqual(label.attrs["for"], control.attrs["id"]);
        assert.strictEqual(control.attrs["aria-label"], message("en", "answer"));
        assert.isUndefined(control.attrs["aria-labelledby"]);
        assert.strictEqual(nameOf(control, tree), message("en", "answer"));
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    '[Q-12] lets the author\'s aria-label win over Q10, and names an unnamed Control "Answer", or "Answer 2 of 2"',
    () =>
      Effect.gen(function* q10Names() {
        const authored = yield* page({
          ...picker,
          name: {
            ariaLabel: Option.some("Fruit"),
            ariaLabelledby: Option.none(),
            unnamed: Option.none(),
          },
        });
        const second = yield* page({
          ...picker,
          name: { ...picker.name, unnamed: Option.some({ count: 2, n: 2 }) },
        });

        assert.strictEqual(onlyPart(authored, "control").attrs["aria-label"], "Fruit");
        assert.strictEqual(
          nameOf(onlyPart(yield* page(picker), "control"), yield* page(picker)),
          message("en", "answer"),
        );
        assert.strictEqual(
          onlyPart(second, "control").attrs["aria-label"],
          message("en", "answerOf", { count: "2", n: "2" }),
        );
      }),
  );

  it.effect(
    "[Q-12] disables the Control in review and solution and when finished, and leaves it enabled while answering",
    () =>
      Effect.gen(function* modes() {
        const answering = yield* page(picker);

        assert.isUndefined(onlyPart(answering, "control").attrs["disabled"]);
        assert.isUndefined(onlyPart(answering, "root").attrs["data-disabled"]);
        for (const mode of ["review", "solution"] as const) {
          const tree = yield* page(inMode({ ...picker, restore: "A" }, mode), pageOf(mode));

          assert.strictEqual(onlyPart(tree, "root").attrs["data-mode"], mode);
          assert.isTrue(onlyPart(tree, "control").attrs["disabled"], mode);
          assert.isTrue(partsIn(tree, "option")[0]?.attrs["selected"], mode);
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], mode);
        }

        const finished = yield* page(picker, pageOf("answering", true));

        assert.isTrue(onlyPart(finished, "control").attrs["disabled"]);
        assert.isTrue(onlyPart(finished, "root").attrs["data-disabled"]);
      }),
  );

  it.effect(
    "[Q-12] writes aria-invalid, aria-describedby with the message ids and autofocus as the payload says",
    () =>
      Effect.gen(function* validationState() {
        const tree = yield* page({
          ...picker,
          autofocus: true,
          invalid: true,
          messageIds: ["m-0", "m-1"],
        });
        const control = onlyPart(tree, "control");
        const quiet = onlyPart(yield* page(picker), "control");

        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.strictEqual(control.attrs["aria-describedby"], "m-0 m-1");
        assert.isTrue(control.attrs["autofocus"]);
        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          [control],
        );
        for (const absent of ["aria-invalid", "aria-describedby", "autofocus"]) {
          assert.isUndefined(quiet.attrs[absent], absent);
        }
      }),
  );

  it.effect(
    "[Q-12] writes an authored label inside the qti-label as a span, so no label nests and checkTree passes",
    () =>
      Effect.gen(function* labelInLabel() {
        const tree = yield* page({
          ...labelled,
          label: Option.some([
            said("Fruit "),
            {
              attributes: [{ name: "for", value: "elsewhere" }],
              children: [said("to buy")],
              kind: "element",
              tag: "label",
            },
          ]),
        });
        const label = onlyPart(tree, "label");
        const [, inner] = label.children;

        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.tag === "label"),
          [label],
        );
        assert.strictEqual(inner?.kind === "element" ? inner.tag : undefined, "span");
        assert.isUndefined(inner?.kind === "element" ? inner.attrs["for"] : undefined);
        assert.strictEqual(nameOf(onlyPart(tree, "control"), tree), "Fruit to buy");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect("[Q-12] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      for (const interaction of [
        picker,
        labelled,
        blankLabel,
        { ...picker, placeholder: Option.some("Pick a fruit"), restore: "B" },
      ]) {
        const tree = yield* page(interaction);

        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }
    }),
  );

  it.effect(
    "[Q-12] refuses a Control swapped to a div, an Option swapped to a span and a Label swapped to a div, at root-not-allowed",
    () =>
      Effect.gen(function* refusedSwaps() {
        const control = yield* refusal(picker, {
          "inline-choice-interaction": { control: as("div") },
        });
        const option = yield* refusal(picker, {
          "inline-choice-interaction": { option: as("span") },
        });
        const label = yield* refusal(labelled, {
          "inline-choice-interaction": { label: as("div") },
        });

        assert.deepStrictEqual(
          [control, option, label].map((refused) => [refused.cause, refused.part]),
          [
            ["root-not-allowed", "control"],
            ["root-not-allowed", "option"],
            ["root-not-allowed", "label"],
          ],
        );
      }),
  );

  it.effect(
    "[Q-12] accepts a Label swapped to a span, which keeps the Control's name, and a Root swapped to a span",
    () =>
      Effect.gen(function* acceptedSwaps() {
        const spanned = yield* page(labelled, pageOf(), {
          "inline-choice-interaction": { label: as("span") },
        });
        const rooted = yield* page(picker, pageOf(), {
          "inline-choice-interaction": { root: as("span") },
        });

        assert.strictEqual(onlyPart(spanned, "label").tag, "span");
        assert.strictEqual(nameOf(onlyPart(spanned, "control"), spanned), "Fruit to buy");
        assert.strictEqual(onlyPart(rooted, "root").tag, "span");
        assert.strictEqual(onlyPart(rooted, "root").attrs["class"], "fruit");
        assert.deepStrictEqual(checkTree(rooted, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(spanned));
      }),
  );
});

/**
 * Construct a template visibility by the template variable `VISIBLE`.
 *
 * @param showHide Its `show-hide`.
 * @returns The visibility.
 */
const byVisible = (showHide: TemplateVisibility["showHide"]): TemplateVisibility => ({
  showHide,
  templateIdentifier: "VISIBLE",
});

/**
 * Construct the record part `checkResponses` reads, with `VISIBLE` holding one identifier.
 *
 * @param identifier What `VISIBLE` holds.
 * @returns The record part.
 */
const visibleAs = (identifier: string): ResponsesRecord => ({
  templates: { VISIBLE: chosen(identifier) },
});

/**
 * The fruits with `B` shown by `VISIBLE` (`show`) and `C` hidden by it (`hide`, so shown unless
 * `VISIBLE` holds `C`); `A` has no template visibility.
 */
const templatedFruits: InlineChoiceInteraction = {
  ...fruits,
  choices: fruits.choices.map((choice) =>
    choice.identifier === "A"
      ? choice
      : {
          ...choice,
          templateVisibility: Option.some(byVisible(choice.identifier === "B" ? "show" : "hide")),
        },
  ),
};

/**
 * Construct an item whose template processing runs and declares `VISIBLE`, a single identifier
 * with no default, whose body is a paragraph around the given nodes, binding {@link response} as a
 * single identifier.
 *
 * @param nodes What the paragraph holds.
 * @returns The item.
 */
const templatedOf = (...nodes: readonly BodyNode[]): Item => ({
  body: [
    {
      attributes: [],
      children: nodes,
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/fruits.xml",
  identifier: "fruits",
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
  templateProcessing: Option.some([]),
  templates: new Map([
    [
      "VISIBLE",
      {
        baseType: "identifier",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "VISIBLE",
        mathVariable: false,
        paramVariable: false,
      },
    ],
  ]),
  title: "Fruits",
  unsupported: [],
});

/**
 * Give the Inline Choice a payload's first paragraph holds.
 *
 * @param built The payload.
 * @returns The Inline Choice.
 */
const inlineIn = (built: Payload): InlineChoicePayload => {
  const [first] = built.body;
  const found =
    first?.kind === "element"
      ? first.children.find((child): child is InlineChoicePayload => child.kind === "inline-choice")
      : undefined;

  return found ?? assert.fail("The first paragraph holds no Inline Choice.");
};

describe("checkResponses", () => {
  it.effect(
    "[I-5] judges an inline choice its template hides as absent from the payload and checkResponses, so posting it gives unknownChoice, and a shown one as today",
    () =>
      Effect.gen(function* hiddenChoice() {
        const configuration = yield* configure({});
        const accepted = acceptForTest(templatedOf(templatedFruits));
        const hiding = visibleAs("C");
        const redacted = redactItem(accepted.item, { outcomes: {}, ...hiding });
        const shown = payload(redacted, {
          finished: false,
          instance,
          locale: "en",
          messages: [],
          mode: "answering",
          names: new Map(),
          posted: Option.none(),
          values: new Map(),
        });

        assert.deepStrictEqual(
          inlineIn(shown).choices.map(({ identifier }) => identifier),
          ["A"],
        );
        assert.deepStrictEqual(
          postings(redacted, instance).map(({ identifier }) => identifier),
          [response],
        );
        for (const hidden of ["B", "C"]) {
          assert.deepStrictEqual(
            checkResponses(accepted, { [response]: chosen(hidden) }, configuration, hiding),
            [unknown],
            hidden,
          );
        }
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: chosen("A") }, configuration, hiding),
          [],
        );
        for (const identifier of ["A", "B", "C"]) {
          assert.deepStrictEqual(
            checkResponses(
              accepted,
              { [response]: chosen(identifier) },
              configuration,
              visibleAs("B"),
            ),
            [],
            identifier,
          );
        }
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: chosen("B") }, configuration),
          [unknown],
        );
      }),
  );

  it.effect(
    "[I-5] ignores a response bound only to a hidden or withheld template inline's Inline Choice, whatever it holds, and judges the inline shown",
    () =>
      Effect.gen(function* ignoredInline() {
        const strict = yield* configure({ validateResponses: true });
        const accepted = acceptForTest(
          templatedOf({
            content: [
              {
                ...required,
                path: "qti-assessment-item/qti-item-body/p/qti-template-inline/qti-inline-choice-interaction",
              },
            ],
            identifier: "X",
            kind: "template-inline",
            path: "qti-assessment-item/qti-item-body/p/qti-template-inline",
            templateVisibility: byVisible("show"),
          }),
        );

        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: chosen("Z") }, strict, visibleAs("W")),
          [],
        );
        assert.deepStrictEqual(checkResponses(accepted, { [response]: chosen("Z") }, strict), []);
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: nothing }, strict, visibleAs("W")),
          [],
        );
        assert.deepStrictEqual(checkResponses(accepted, {}, strict, visibleAs("W")), []);
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: chosen("Z") }, strict, visibleAs("X")),
          [unknown],
        );
        assert.deepStrictEqual(checkResponses(accepted, {}, strict, visibleAs("X")), [
          atLeast("1"),
        ]);
      }),
  );
});
