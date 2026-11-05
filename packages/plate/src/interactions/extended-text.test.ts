import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, text as sourceText } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitBody } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { authoredId, partForSlot, resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { Malformed, decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import { renderExtendedText, validateExtendedText } from "#plate/interactions/extended-text.ts";
import { renderTextEntry } from "#plate/interactions/text-entry.ts";
import { message } from "#plate/messages.ts";
import { buildItem } from "#plate/model/item.ts";
import type {
  BodyNode,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { payload, redactItem } from "#plate/payload.ts";
import type { EmitState, ExtendedTextPayload, Payload, View } from "#plate/payload.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { keyboardWalk } from "#plate/test/keyboard.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance every payload here is built for.
 */
const instance = "7d3e9a10-4b2c-4f6e-8a51-2c9b0e7f4d13";

/**
 * The identifier of the response the first Extended Text here binds.
 */
const response = "ESSAY";

/**
 * The form entry name the first Extended Text's Control posts under.
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
 * A plain string Extended Text with a Prompt, the author's class and five expected lines.
 */
const essay: ExtendedTextInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  cardinality: "single",
  class: "qti-height-lines-6",
  expectedLength: Option.none(),
  expectedLines: Option.some(5n),
  format: "plain",
  kind: "extended-text",
  maxStrings: Option.none(),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  prompt: Option.some([words("Describe your day.")]),
  response,
};

/**
 * The essay with no Prompt, no class and no expected lines, which the renderer names.
 */
const bare: ExtendedTextInteraction = {
  ...essay,
  class: "",
  expectedLines: Option.none(),
  prompt: Option.none(),
};

/**
 * The bare essay bound to a float, so its posted text is read as a number.
 */
const measure: ExtendedTextInteraction = { ...bare, baseType: "float" };

/**
 * The essay in the `xhtml` format, which plate presents as a plain textarea of text.
 */
const rich: ExtendedTextInteraction = { ...essay, format: "xhtml" };

/**
 * The `xhtml` essay with a `pattern-mask` of lower-case words and the author's message for it.
 */
const masked: ExtendedTextInteraction = {
  ...rich,
  patternMask: Option.some("[a-z ]+"),
  patternMaskMessage: Option.some("Write in lower-case words."),
};

/**
 * The essay bound to an `ordered` response of at most three strings, so it renders three Controls
 * in a group its Prompt names.
 */
const rivers: ExtendedTextInteraction = {
  ...essay,
  cardinality: "ordered",
  maxStrings: Option.some(3n),
  prompt: Option.some([words("Name three rivers.")]),
};

/**
 * Construct an item whose body is the given Extended Texts, each bound to a response of its base
 * type and cardinality, with no response processing.
 *
 * @param interactions The Extended Texts, in body order.
 * @returns The item.
 */
const itemOf = (...interactions: readonly ExtendedTextInteraction[]): Item => ({
  body: interactions,
  document: "items/essay.xml",
  identifier: "essay",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map(
    interactions.map((interaction) => [
      interaction.response,
      {
        areaMapping: Option.none(),
        baseType: interaction.baseType,
        cardinality: interaction.cardinality,
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: interaction.response,
        mapping: Option.none(),
      },
    ]),
  ),
  title: "Essay",
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
 * The view of a first render whose Extended Text shows a text, as an author's recorded value.
 *
 * @param value The text the first Extended Text's response holds.
 * @returns The view.
 */
const restored = (value: string): View => ({
  ...answering,
  values: new Map([
    [
      response,
      {
        baseType: "string",
        cardinality: "single",
        values: [{ baseType: "string", value }],
      },
    ],
  ]),
});

/**
 * Compute the payload of an item holding the given Extended Texts.
 *
 * @param interactions The Extended Texts, in body order.
 * @param view How the render was asked for, a first render by default.
 * @returns The payload of the redacted item.
 */
const payloadOf = (
  interactions: readonly ExtendedTextInteraction[],
  view: View = answering,
): Payload => payload(redactItem(itemOf(...interactions)), view);

/**
 * Give the Extended Text payload at a position of a payload's body.
 *
 * @param built The payload.
 * @param index The position in the body, the first by default.
 * @returns The Extended Text there.
 */
const extendedTextIn = (built: Payload, index = 0): ExtendedTextPayload => {
  const node = built.body[index];

  return node?.kind === "extended-text"
    ? node
    : assert.fail(`The body holds no Extended Text at ${index}.`);
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
 * Render the Extended Text at a position of a payload's body.
 *
 * @param built The payload.
 * @param index The position in the body, the first by default.
 * @returns The Extended Text Root.
 */
const render = (built: Payload, index = 0): Effect.Effect<Element> =>
  emitState.pipe(
    Effect.flatMap((state) =>
      Effect.orDie(
        Effect.fromResult(renderExtendedText(extendedTextIn(built, index), built, state)),
      ),
    ),
  );

/**
 * Place nodes in a minimal item: a Root carrying `lang`, and a plain `form`, as an author composes
 * it, holding the nodes and a submit button after them.
 *
 * @param nodes The nodes, such as an Extended Text Root.
 * @param built The payload they were rendered from, which gives `lang`.
 * @returns The item's root.
 */
const page = (nodes: readonly Node[], built: Payload): Element =>
  h("qti-assessment-item", { "data-slot": rowFor("item", "root").slot, lang: built.lang }, [
    h("form", { action: "/submit", method: "post", novalidate: true }, [
      ...nodes,
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
 * Find the elements of a tree that are one Extended Text part, by their `data-slot` marker read
 * through the part table.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsIn = (tree: Element, part: PartOf<"extended-text-interaction">): readonly Element[] =>
  elementsIn(tree).filter((element) => {
    const slot = element.attrs["data-slot"];

    return (
      slot !== undefined &&
      slot !== true &&
      Option.exists(
        partForSlot(slot),
        (found) => found.interaction === "extended-text-interaction" && found.part === part,
      )
    );
  });

/**
 * Give the one element of a tree that is an Extended Text part, failing the test unless there is
 * exactly one.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's element.
 */
const onePart = (tree: Element, part: PartOf<"extended-text-interaction">): Element => {
  const found = partsIn(tree, part);

  return found.length === 1 && found[0] !== undefined
    ? found[0]
    : assert.fail(`The tree holds ${found.length} ${part} parts, not one.`);
};

/**
 * Decode the entries posted for an Extended Text as its caller does, under the default entry name,
 * as a value of the interaction's base type and cardinality.
 *
 * @param interaction The Extended Text.
 * @param entries The posted entries.
 * @returns The decoded value, or the {@link Malformed} `decode` gave.
 */
const decoded = (
  interaction: ExtendedTextInteraction,
  entries: readonly Entry[],
): Effect.Effect<Value | Malformed> =>
  Effect.succeed(
    Result.merge(
      decode(entries, {
        baseType: interaction.baseType,
        cardinality: interaction.cardinality,
        name: entryName(instance, interaction.response),
      }),
    ),
  );

describe("renderExtendedText", () => {
  it.effect(
    "[Q-5] names the Control by its Prompt, holds the Prompt then the textarea, and passes checkTree",
    () =>
      Effect.gen(function* namedByPrompt() {
        const built = payloadOf([essay]);
        const root = yield* render(built);
        const tree = page([root], built);
        const prompt = onePart(root, "prompt");
        const control = onePart(root, "control");

        assert.strictEqual(root.tag, "qti-extended-text-interaction");
        assert.deepStrictEqual(partsIn(root, "root"), [root]);
        assert.deepStrictEqual(root.children, [prompt, control]);
        assert.strictEqual(prompt.tag, "qti-prompt");
        assert.strictEqual(control.tag, "textarea");
        assert.strictEqual(control.attrs["aria-labelledby"], prompt.attrs["id"]);
        assert.isUndefined(control.attrs["aria-label"]);
        assert.strictEqual(nameOf(control, tree), "Describe your day.");
        assert.strictEqual(textOf(prompt), "Describe your day.");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    '[Q-5] names a Control with no Prompt "Answer", and "Answer 2 of 2" for the second of two',
    () =>
      Effect.gen(function* defaultName() {
        const single = payloadOf([bare]);
        const alone = yield* render(single);
        const aloneControl = onePart(alone, "control");

        assert.deepStrictEqual(partsIn(alone, "prompt"), []);
        assert.deepStrictEqual(alone.children, [aloneControl]);
        assert.strictEqual(nameOf(aloneControl, page([alone], single)), "Answer");
        assert.deepStrictEqual(checkTree(page([alone], single), { baseLevel: 2 }), []);

        const two = payloadOf([bare, { ...bare, response: "NOTES" }]);
        const first = yield* render(two, 0);
        const second = yield* render(two, 1);
        const tree = page([first, second], two);

        assert.strictEqual(nameOf(onePart(first, "control"), tree), "Answer 1 of 2");
        assert.strictEqual(nameOf(onePart(second, "control"), tree), "Answer 2 of 2");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-5] with no Prompt, the author's aria-label wins, and the author's aria-labelledby is scoped",
    () =>
      Effect.gen(function* authorsName() {
        const labelled = payloadOf([{ ...bare, ariaLabel: Option.some("Your essay") }]);
        const labelledControl = onePart(yield* render(labelled), "control");

        assert.strictEqual(labelledControl.attrs["aria-label"], "Your essay");
        assert.isUndefined(labelledControl.attrs["aria-labelledby"]);

        const referenced = payloadOf([{ ...bare, ariaLabelledby: Option.some("intro hint") }]);
        const referencedControl = onePart(yield* render(referenced), "control");

        assert.strictEqual(
          referencedControl.attrs["aria-labelledby"],
          `${authoredId(instance, "intro")} ${authoredId(instance, "hint")}`,
        );
        assert.isUndefined(referencedControl.attrs["aria-label"]);
      }),
  );

  it.effect(
    '[Q-5] with no Prompt, writes no aria-labelledby for an authored one that names no id, and names the Control "Answer"',
    () =>
      Effect.gen(function* emptyAriaLabelledby() {
        const control = onePart(
          yield* render(payloadOf([{ ...bare, ariaLabelledby: Option.some(" \t\n ") }])),
          "control",
        );

        assert.isUndefined(control.attrs["aria-labelledby"]);
        assert.strictEqual(control.attrs["aria-label"], message("en", "answer"));
      }),
  );

  it.effect(
    "[Q-5] puts the author's class, data-mode and, for preformatted, data-format on the Root, and data-disabled only when finished",
    () =>
      Effect.gen(function* rootState() {
        const root = yield* render(payloadOf([essay]));

        assert.strictEqual(root.attrs["class"], "qti-height-lines-6");
        assert.strictEqual(root.attrs["data-mode"], "answering");
        assert.isUndefined(root.attrs["data-format"]);
        assert.isUndefined(root.attrs["data-disabled"]);
        assert.isUndefined(root.attrs["data-attempt"]);

        const preformatted = yield* render(payloadOf([{ ...essay, format: "preformatted" }]));
        assert.strictEqual(preformatted.attrs["data-format"], "preformatted");

        const plain = yield* render(payloadOf([bare]));
        assert.isUndefined(plain.attrs["class"]);

        const finished = yield* render(payloadOf([essay], { ...answering, finished: true }));
        assert.isTrue(finished.attrs["data-disabled"]);
        assert.notProperty(finished.attrs, "data-finished");
        assert.isTrue(onePart(finished, "control").attrs["disabled"]);
        assert.isUndefined(onePart(root, "control").attrs["disabled"]);
      }),
  );

  it.effect(
    "[Q-5] [keyboard] writes the Control's id, rows from expected-lines, placeholder and the payload's form name, the author's when given",
    () =>
      Effect.gen(function* controlAttributes() {
        const control = onePart(yield* render(payloadOf([essay])), "control");

        assert.strictEqual(control.attrs["id"], scopedId(instance, response, "control"));
        assert.strictEqual(control.attrs["rows"], "5");
        assert.strictEqual(control.attrs["name"], name);
        assert.isUndefined(control.attrs["placeholder"]);

        const hinted = onePart(
          yield* render(payloadOf([{ ...bare, placeholder: Option.some("Write here") }])),
          "control",
        );
        assert.isUndefined(hinted.attrs["rows"]);
        assert.strictEqual(hinted.attrs["placeholder"], "Write here");

        const authored = payloadOf([essay], {
          ...answering,
          names: new Map([[response, "essay"]]),
        });
        const authoredRoot = yield* render(authored);

        assert.strictEqual(extendedTextIn(authored).formName, "essay");
        assert.strictEqual(onePart(authoredRoot, "control").attrs["name"], "essay");
        assert.deepStrictEqual(
          keyboardWalk(page([authoredRoot], authored), ["Tab", { type: "hi" }, "Tab", "Enter"]),
          Option.some([["essay", "hi"]]),
        );
      }),
  );

  it.effect(
    '[Q-5] [keyboard] a keyboard walk in a test-built form posts multi-line text, "a\\r\\nb", which decode turns into "a\\nb"',
    () =>
      Effect.gen(function* multiLineWalk() {
        const built = payloadOf([essay]);
        const root = yield* render(built);
        const posted = keyboardWalk(page([root], built), [
          "Tab",
          { type: "a" },
          "Enter",
          { type: "b" },
          "Tab",
          "Enter",
        ]);

        assert.deepStrictEqual(posted, Option.some([[name, "a\r\nb"]]));

        const value = yield* decoded(
          essay,
          Option.getOrElse(posted, () => []),
        );
        assert.deepStrictEqual(value, {
          baseType: "string",
          cardinality: "single",
          values: [{ baseType: "string", value: "a\nb" }],
        });
        assert.deepStrictEqual(validateExtendedText(essay, value, yield* configure({})), []);
      }),
  );

  it.effect(
    "[Q-5] [keyboard] holds the value's text as the textarea's only child, and a text that starts with a line feed round-trips",
    () =>
      Effect.gen(function* restoredText() {
        const built = payloadOf([essay], restored("first\nsecond"));
        const control = onePart(yield* render(built), "control");
        assert.deepStrictEqual(control.children, [text("first\nsecond")]);

        const leading = payloadOf([essay], restored("\nafter a blank line"));
        const leadingRoot = yield* render(leading);
        const tree = page([leadingRoot], leading);

        assert.deepStrictEqual(onePart(leadingRoot, "control").children, [
          text("\nafter a blank line"),
        ]);
        assert.isTrue(roundTrips(tree));
        assert.deepStrictEqual(
          keyboardWalk(tree, ["Tab", "Tab", "Enter"]),
          Option.some([[name, "\r\nafter a blank line"]]),
        );

        const empty = onePart(yield* render(payloadOf([essay])), "control");
        assert.deepStrictEqual(empty.children, []);
      }),
  );

  it.effect(
    '[Q-5] [keyboard] presents format="xhtml" as a plain textarea marked data-format="xhtml", whose typed markup posts as text',
    () =>
      Effect.gen(function* xhtmlControl() {
        const built = payloadOf([rich]);
        const root = yield* render(built);
        const tree = page([root], built);
        const control = onePart(root, "control");

        assert.strictEqual(control.tag, "textarea");
        assert.strictEqual(control.attrs["data-format"], "xhtml");
        assert.isUndefined(root.attrs["data-format"]);
        assert.isUndefined(
          onePart(yield* render(payloadOf([essay])), "control").attrs["data-format"],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));

        const posted = keyboardWalk(tree, ["Tab", { type: "<b>x</b>" }, "Tab", "Enter"]);
        assert.deepStrictEqual(posted, Option.some([[name, "<b>x</b>"]]));
        assert.deepStrictEqual(
          yield* decoded(
            rich,
            Option.getOrElse(posted, () => []),
          ),
          {
            baseType: "string",
            cardinality: "single",
            values: [{ baseType: "string", value: "<b>x</b>" }],
          },
        );

        const again = payloadOf([rich], restored("<b>x</b>"));
        const againRoot = yield* render(again);
        const againControl = onePart(againRoot, "control");

        assert.deepStrictEqual(againControl.children, [text("<b>x</b>")]);
        assert.include(toHtml(againControl), "&lt;b&gt;x&lt;/b&gt;</textarea>");
        assert.isTrue(roundTrips(page([againRoot], again)));
      }),
  );

  it.effect(
    "[Q-5] with a refused post, shows the posted text, marks the Control invalid and described, and autofocuses it",
    () =>
      Effect.gen(function* afterRefused() {
        const configuration = yield* configure({});
        const messages = validateExtendedText(
          measure,
          yield* decoded(measure, [[name, "abc"]]),
          configuration,
        );

        assert.deepStrictEqual(messages, [{ response, text: message("en", "malformedNumber") }]);

        const built = payloadOf([measure], {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["abc"]]])),
        });
        const root = yield* render(built);
        const tree = page([root], built);
        const control = onePart(root, "control");

        assert.deepStrictEqual(control.children, [text("abc")]);
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.strictEqual(
          control.attrs["aria-describedby"],
          scopedId(instance, response, "message", 0),
        );
        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          [control],
        );

        const calm = onePart(yield* render(payloadOf([measure])), "control");
        assert.isUndefined(calm.attrs["aria-invalid"]);
        assert.isUndefined(calm.attrs["aria-describedby"]);
        assert.isUndefined(calm.attrs["autofocus"]);
      }),
  );
});

describe("validateExtendedText", () => {
  it.effect(
    "[Q-5] under validateResponses, checks a single entry against the pattern-mask, and the refused post comes back as escaped text",
    () =>
      Effect.gen(function* patternChecked() {
        const configuration = yield* configure({ validateResponses: true });
        const mismatch = yield* decoded(masked, [[name, "<b>x</b>"]]);
        const messages = validateExtendedText(masked, mismatch, configuration);

        assert.deepStrictEqual(messages, [{ response, text: "Write in lower-case words." }]);
        assert.deepStrictEqual(
          validateExtendedText(
            { ...masked, patternMaskMessage: Option.none() },
            mismatch,
            configuration,
          ),
          [{ response, text: message("en", "patternMismatch") }],
        );
        assert.deepStrictEqual(validateExtendedText(masked, mismatch, yield* configure({})), []);
        assert.deepStrictEqual(
          validateExtendedText(
            masked,
            yield* decoded(masked, [[name, "a quiet day"]]),
            configuration,
          ),
          [],
        );
        assert.deepStrictEqual(
          validateExtendedText(masked, yield* decoded(masked, []), configuration),
          [],
        );

        const built = payloadOf([masked], {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["<b>x</b>"]]])),
        });
        const root = yield* render(built);
        const tree = page([root], built);
        const control = onePart(root, "control");

        assert.deepStrictEqual(control.children, [text("<b>x</b>")]);
        assert.include(toHtml(control), "&lt;b&gt;x&lt;/b&gt;</textarea>");
        assert.strictEqual(control.attrs["data-format"], "xhtml");
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.strictEqual(
          control.attrs["aria-describedby"],
          scopedId(instance, response, "message", 0),
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    "[Q-5] refuses text that is not a number for a float or an integer, with the author's message when set",
    () =>
      Effect.gen(function* malformedNumber() {
        const configuration = yield* configure({ validateResponses: true });
        const counted: ExtendedTextInteraction = { ...bare, baseType: "integer" };

        for (const interaction of [measure, counted]) {
          assert.deepStrictEqual(
            validateExtendedText(
              interaction,
              yield* decoded(interaction, [[name, "abc"]]),
              configuration,
            ),
            [{ response, text: message("en", "malformedNumber") }],
          );
        }

        const authored: ExtendedTextInteraction = {
          ...measure,
          patternMaskMessage: Option.some("Write a measurement, such as 2.5."),
        };
        assert.deepStrictEqual(
          validateExtendedText(authored, yield* decoded(authored, [[name, "abc"]]), configuration),
          [{ response, text: "Write a measurement, such as 2.5." }],
        );

        assert.deepStrictEqual(
          validateExtendedText(measure, yield* decoded(measure, [[name, "2.5"]]), configuration),
          [],
        );
      }),
  );

  it.effect(
    "[Q-5] accepts any decoded text, and refuses a string response posted twice or as a file, each with its own message",
    () =>
      Effect.gen(function* stringValues() {
        const configuration = yield* configure({ validateResponses: true });

        for (const posted of [[], [[name, ""]], [[name, "a\r\nb"]]] as const) {
          assert.deepStrictEqual(
            validateExtendedText(essay, yield* decoded(essay, posted), configuration),
            [],
          );
        }

        const twice = yield* decoded(essay, [
          [name, "a"],
          [name, "b"],
        ]);
        assert.instanceOf(twice, Malformed);
        assert.strictEqual(twice.reason, "single-many");
        assert.deepStrictEqual(validateExtendedText(essay, twice, configuration), [
          { response, text: message("en", "malformedSingleMany") },
        ]);

        const file = yield* decoded(essay, [[name, new Blob(["My day."])]]);
        assert.instanceOf(file, Malformed);
        assert.strictEqual(file.reason, "file");
        assert.deepStrictEqual(validateExtendedText(essay, file, configuration), [
          { response, text: message("en", "malformedFile") },
        ]);
      }),
  );
});

/**
 * Give the accessible name of each Control of an Extended Text, in document order.
 *
 * @param root The Extended Text Root.
 * @param tree The tree the Root stands in, which `aria-labelledby` resolves against.
 * @returns The Controls' names.
 */
const controlNames = (root: Element, tree: Element): readonly string[] =>
  partsIn(root, "control").map((control) => nameOf(control, tree));

/**
 * The renderer's names for the Controls of an Extended Text that holds several.
 *
 * @param count How many Controls it holds.
 * @returns "Answer n of count" for each, in order.
 */
const answersOf = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) =>
    message("en", "answerOf", { count: String(count), n: String(index + 1) }),
  );

/**
 * Construct the entries a form posts for the first Extended Text, one per text, in order.
 *
 * @param texts The texts, one per Control.
 * @returns The entries, each under the default entry name.
 */
const entriesOf = (...texts: readonly string[]): readonly Entry[] =>
  texts.map((posted): Entry => [name, posted]);

/**
 * Construct an `ordered` string value.
 *
 * @param texts Its members, in order.
 * @returns The value.
 */
const orderedOf = (...texts: readonly string[]): Value => ({
  baseType: "string",
  cardinality: "ordered",
  values: texts.map((value) => ({ baseType: "string", value })),
});

/**
 * An unnamed Text Entry bound to a single string `CITY`, which the renderer names.
 */
const city: TextEntryInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response: "CITY",
};

/**
 * Construct an item whose body is a paragraph holding {@link city}, then an Extended Text.
 *
 * @param interaction The Extended Text.
 * @returns The item.
 */
const besideCity = (interaction: ExtendedTextInteraction): Item => {
  const alone = itemOf(interaction);

  return {
    ...alone,
    body: [
      {
        attributes: [],
        children: [words("City: "), city],
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      },
      interaction,
    ],
    responses: new Map([
      ...alone.responses,
      [
        city.response,
        {
          areaMapping: Option.none(),
          baseType: "string",
          cardinality: "single",
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier: city.response,
          mapping: Option.none(),
        },
      ],
    ]),
  };
};

/**
 * Render a payload's whole body, its Text Entries and Extended Texts, and place it as {@link page}
 * does.
 *
 * @param built The payload.
 * @returns The item's root.
 */
const pageOf = (built: Payload): Effect.Effect<Element> =>
  Effect.gen(function* renderPage() {
    const state = yield* emitState;
    const renderInteraction: RenderInteraction = (interaction) => {
      switch (interaction.kind) {
        case "extended-text": {
          return renderExtendedText(interaction, built, state);
        }
        case "text-entry": {
          return renderTextEntry(interaction, built, state);
        }
        case "choice": {
          return assert.fail("This page renders no Choice.");
        }
        default: {
          return interaction satisfies never;
        }
      }
    };

    return page(
      yield* Effect.orDie(Effect.fromResult(emitBody(built, state, renderInteraction))),
      built,
    );
  });

describe("an Extended Text bound to a container", () => {
  it.effect(
    '[Q-5] renders an ordered binding with max-strings="3" as three textareas posting under one name, in a group its Prompt names, each "Answer n of 3"',
    () =>
      Effect.gen(function* threeControls() {
        const built = payloadOf([rivers]);
        const root = yield* render(built);
        const tree = page([root], built);
        const prompt = onePart(root, "prompt");
        const controls = partsIn(root, "control");

        assert.deepStrictEqual(root.children, [prompt, ...controls]);
        assert.deepStrictEqual(
          controls.map((control) => control.tag),
          ["textarea", "textarea", "textarea"],
        );
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["name"]),
          [name, name, name],
        );
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["id"]),
          [0, 1, 2].map((index) => scopedId(instance, response, "control", index)),
        );
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["rows"]),
          ["5", "5", "5"],
        );
        assert.strictEqual(root.attrs["role"], "group");
        assert.strictEqual(root.attrs["aria-labelledby"], prompt.attrs["id"]);
        assert.strictEqual(nameOf(root, tree), "Name three rivers.");
        assert.deepStrictEqual(controlNames(root, tree), answersOf(3));
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));

        const single = yield* render(payloadOf([essay]));
        assert.isUndefined(single.attrs["role"]);
        assert.isUndefined(single.attrs["aria-labelledby"]);
        assert.strictEqual(
          onePart(single, "control").attrs["id"],
          scopedId(instance, response, "control"),
        );
      }),
  );

  it.effect(
    "[Q-5] with no Prompt, names the group by the author's aria-label or aria-labelledby, else leaves it unnamed, and names each Control",
    () =>
      Effect.gen(function* groupNames() {
        const unprompted: ExtendedTextInteraction = { ...rivers, prompt: Option.none() };

        const labelled = payloadOf([{ ...unprompted, ariaLabel: Option.some("Rivers") }]);
        const labelledRoot = yield* render(labelled);
        assert.strictEqual(labelledRoot.attrs["role"], "group");
        assert.strictEqual(labelledRoot.attrs["aria-label"], "Rivers");
        assert.isUndefined(labelledRoot.attrs["aria-labelledby"]);
        assert.deepStrictEqual(
          controlNames(labelledRoot, page([labelledRoot], labelled)),
          answersOf(3),
        );

        const referenced = yield* render(
          payloadOf([{ ...unprompted, ariaLabelledby: Option.some("intro") }]),
        );
        assert.strictEqual(referenced.attrs["aria-labelledby"], authoredId(instance, "intro"));
        assert.isUndefined(referenced.attrs["aria-label"]);
        for (const control of partsIn(referenced, "control")) {
          assert.isUndefined(control.attrs["aria-labelledby"]);
        }

        const unnamed = payloadOf([unprompted]);
        const unnamedRoot = yield* render(unnamed);
        const tree = page([unnamedRoot], unnamed);
        assert.strictEqual(unnamedRoot.attrs["role"], "group");
        assert.isUndefined(unnamedRoot.attrs["aria-label"]);
        assert.isUndefined(unnamedRoot.attrs["aria-labelledby"]);
        assert.deepStrictEqual(controlNames(unnamedRoot, tree), answersOf(3));
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    '[Q-20] [Q-5] numbers an unnamed Text Entry and each Control of an unnamed group in one sequence, "Answer 1 of 4" to "Answer 4 of 4"',
    () =>
      Effect.gen(function* oneSequence() {
        const built = payload(
          redactItem(besideCity({ ...rivers, prompt: Option.none() })),
          answering,
        );
        const tree = yield* pageOf(built);
        const inputs = elementsIn(tree).filter((element) => element.tag === "input");

        assert.deepStrictEqual(
          [...inputs, ...partsIn(tree, "control")].map((control) => nameOf(control, tree)),
          answersOf(4),
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    "[Q-5] [keyboard] a walk that fills two of the three Controls posts an ordered value of two, which restores in order",
    () =>
      Effect.gen(function* fillTwo() {
        const built = payloadOf([rivers]);
        const tree = page([yield* render(built)], built);
        const posted = keyboardWalk(tree, [
          "Tab",
          { type: "Nile" },
          "Tab",
          "Tab",
          { type: "Amazon" },
          "Tab",
          "Enter",
        ]);

        assert.deepStrictEqual(posted, Option.some(entriesOf("Nile", "", "Amazon")));

        const value = yield* decoded(
          rivers,
          Option.getOrElse(posted, () => []),
        );
        assert.deepStrictEqual(value, orderedOf("Nile", "Amazon"));
        assert.deepStrictEqual(
          validateExtendedText(rivers, value, yield* configure({ validateResponses: true })),
          [],
        );

        const again = payloadOf([rivers], {
          ...answering,
          values: new Map([[response, orderedOf("Nile", "Amazon")]]),
        });
        const againRoot = yield* render(again);
        assert.deepStrictEqual(
          partsIn(againRoot, "control").map((control) => control.children),
          [[text("Nile")], [text("Amazon")], []],
        );
        assert.isTrue(roundTrips(page([againRoot], again)));
      }),
  );

  it.effect(
    '[Q-5] renders 10 textareas for a max-strings above 10 or of 0, 100 for min-strings="100", and for min-strings="101" the notice and none',
    () =>
      Effect.gen(function* controlCounts() {
        const counted = (interaction: ExtendedTextInteraction) =>
          Effect.map(render(payloadOf([interaction])), (root) => partsIn(root, "control").length);

        assert.strictEqual(
          yield* counted({ ...rivers, maxStrings: Option.some(1_000_000_000_000n) }),
          10,
        );
        assert.strictEqual(yield* counted({ ...rivers, maxStrings: Option.some(0n) }), 10);

        const hundred = payloadOf([{ ...rivers, maxStrings: Option.some(200n), minStrings: 100n }]);
        const hundredRoot = yield* render(hundred);
        const hundredTree = page([hundredRoot], hundred);
        assert.lengthOf(partsIn(hundredRoot, "control"), 100);
        assert.deepStrictEqual(controlNames(hundredRoot, hundredTree), answersOf(100));
        assert.deepStrictEqual(checkTree(hundredTree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(hundredTree));

        const over = payloadOf([{ ...rivers, maxStrings: Option.some(200n), minStrings: 101n }]);
        const overRoot = yield* render(over);
        const overTree = page([overRoot], over);
        const notices = elementsIn(overRoot).filter(
          (element) => element.attrs["data-slot"] === rowFor("item", "notice").slot,
        );

        assert.deepStrictEqual(partsIn(overRoot, "control"), []);
        assert.lengthOf(notices, 1);
        assert.include(textOf(notices[0] ?? overRoot), "min-strings>100");
        assert.isUndefined(overRoot.attrs["role"]);
        assert.deepStrictEqual(checkTree(overTree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(overTree));
      }),
  );

  it.effect(
    "[Q-5] with a refused post, restores each entry to its Control, marks every Control invalid and described, and autofocuses the first",
    () =>
      Effect.gen(function* afterRefused() {
        const pair: ExtendedTextInteraction = { ...rivers, minStrings: 2n };
        const configuration = yield* configure({ validateResponses: true });
        const messages = validateExtendedText(
          pair,
          yield* decoded(pair, entriesOf("Nile", "", "")),
          configuration,
        );

        assert.lengthOf(messages, 1);

        const built = payloadOf([pair], {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["Nile", "", ""]]])),
        });
        const root = yield* render(built);
        const tree = page([root], built);
        const controls = partsIn(root, "control");

        assert.deepStrictEqual(
          controls.map((control) => control.children),
          [[text("Nile")], [], []],
        );
        for (const control of controls) {
          assert.strictEqual(control.attrs["aria-invalid"], "true");
          assert.strictEqual(
            control.attrs["aria-describedby"],
            scopedId(instance, response, "message", 0),
          );
        }
        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          controls.slice(0, 1),
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }),
  );

  it.effect(
    "[Q-5] refuses more entries than a nonzero max-strings whatever validateResponses says, and fewer than min-strings only under it",
    () =>
      Effect.gen(function* counts() {
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });
        const four = yield* decoded(rivers, entriesOf("a", "b", "c", "d"));

        for (const configuration of [lenient, strict]) {
          assert.deepStrictEqual(validateExtendedText(rivers, four, configuration), [
            { response, text: message("en", "atMostStrings", { n: "3" }) },
          ]);
        }
        assert.deepStrictEqual(
          validateExtendedText(rivers, yield* decoded(rivers, entriesOf("a", "b", "c")), strict),
          [],
        );

        const pair: ExtendedTextInteraction = { ...rivers, minStrings: 2n };
        const one = yield* decoded(pair, entriesOf("a", "", ""));
        assert.deepStrictEqual(validateExtendedText(pair, one, strict), [
          { response, text: message("en", "atLeastStrings", { n: "2" }) },
        ]);
        assert.deepStrictEqual(validateExtendedText(pair, one, lenient), []);

        const atMostOne: ExtendedTextInteraction = { ...rivers, maxStrings: Option.some(1n) };
        assert.deepStrictEqual(
          validateExtendedText(atMostOne, yield* decoded(atMostOne, entriesOf("a", "b")), lenient),
          [{ response, text: message("en", "atMostOneString") }],
        );

        const atLeastOne: ExtendedTextInteraction = { ...rivers, minStrings: 1n };
        assert.deepStrictEqual(
          validateExtendedText(
            atLeastOne,
            yield* decoded(atLeastOne, entriesOf("", "", "")),
            strict,
          ),
          [{ response, text: message("en", "atLeastOneString") }],
        );

        const unlimited: ExtendedTextInteraction = { ...rivers, maxStrings: Option.some(0n) };
        const many = Array.from({ length: 25 }, (_, index) => `river ${index}`);
        assert.deepStrictEqual(
          validateExtendedText(unlimited, yield* decoded(unlimited, entriesOf(...many)), strict),
          [],
        );
      }),
  );

  it.effect(
    "[Q-5] under validateResponses, checks the pattern-mask on each member of a container",
    () =>
      Effect.gen(function* eachMember() {
        const strict = yield* configure({ validateResponses: true });
        const lowered: ExtendedTextInteraction = {
          ...rivers,
          patternMask: Option.some("[a-z ]+"),
          patternMaskMessage: Option.some("Write in lower-case words."),
        };
        const mixed = yield* decoded(lowered, entriesOf("nile", "Amazon"));

        assert.deepStrictEqual(validateExtendedText(lowered, mixed, strict), [
          { response, text: "Write in lower-case words." },
        ]);
        assert.deepStrictEqual(validateExtendedText(lowered, mixed, yield* configure({})), []);
        assert.deepStrictEqual(
          validateExtendedText(
            lowered,
            yield* decoded(lowered, entriesOf("nile", "amazon")),
            strict,
          ),
          [],
        );
      }),
  );
});

/**
 * Construct a `qti-simple-choice` holding only text.
 *
 * @param identifier The choice's identifier.
 * @param label The choice's text.
 * @returns The choice element.
 */
const simpleChoice = (identifier: string, label: string): SourceElement =>
  el("qti-simple-choice", [attr("identifier", identifier)], [sourceText(label)]);

/**
 * Construct a response declaration of a single value.
 *
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @returns The declaration element.
 */
const declaration = (identifier: string, baseType: string): SourceElement =>
  el("qti-response-declaration", [
    attr("base-type", baseType),
    attr("cardinality", "single"),
    attr("identifier", identifier),
  ]);

describe("an Extended Text the renderer does not support", () => {
  it.effect(
    '[Q-5] [keyboard] builds an Extended Text whose pattern-mask="[0-9" the translator refuses beside a Choice as a notice in its place, and a walk still posts the Choice',
    () =>
      Effect.gen(function* refusedPatternNotice() {
        const item = yield* buildItem(
          doc(
            "items/mixed.xml",
            el(
              "qti-assessment-item",
              [attr("identifier", "mixed"), attr("title", "Mixed")],
              [
                declaration("RESPONSE", "identifier"),
                declaration(response, "string"),
                el(
                  "qti-item-body",
                  [],
                  [
                    el(
                      "qti-choice-interaction",
                      [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
                      [
                        el("qti-prompt", [], [sourceText("Pick a colour.")]),
                        simpleChoice("A", "Red"),
                        simpleChoice("B", "Green"),
                      ],
                    ),
                    el(
                      "qti-extended-text-interaction",
                      [attr("pattern-mask", "[0-9"), attr("response-identifier", response)],
                      [el("qti-prompt", [], [sourceText("Describe your day.")])],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
        const path = "qti-assessment-item/qti-item-body/qti-extended-text-interaction";

        assert.deepStrictEqual(item.body[1], {
          feature: "pattern-mask",
          kind: "unsupported",
          path,
        });
        assert.deepStrictEqual(item.unsupported, [
          { feature: "pattern-mask", path, shown: "notice" },
        ]);

        const built = payload(redactItem(item), answering);
        const state = yield* emitState;
        const renderInteraction: RenderInteraction = (interaction) => {
          switch (interaction.kind) {
            case "choice": {
              return renderChoice(interaction, built, state);
            }
            case "extended-text": {
              return renderExtendedText(interaction, built, state);
            }
            case "text-entry": {
              return assert.fail("This item holds no Text Entry.");
            }
            default: {
              return interaction satisfies never;
            }
          }
        };
        const nodes = yield* Effect.orDie(
          Effect.fromResult(emitBody(built, state, renderInteraction)),
        );
        const tree = page(nodes, built);

        assert.lengthOf(
          elementsIn(tree).filter(
            (element) => element.attrs["data-slot"] === rowFor("item", "notice").slot,
          ),
          1,
        );
        assert.deepStrictEqual(partsIn(tree, "control"), []);
        assert.deepStrictEqual(
          keyboardWalk(tree, ["Tab", "ArrowDown", "Tab", "Enter"]),
          Option.some([[entryName(instance, "RESPONSE"), "B"]]),
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );
});
