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
import { Malformed, decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import { renderExtendedText, validateExtendedText } from "#plate/interactions/extended-text.ts";
import { message } from "#plate/messages.ts";
import { buildItem } from "#plate/model/item.ts";
import type { BodyNode, ExtendedTextInteraction, Item } from "#plate/model/item.ts";
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
  class: "qti-height-lines-6",
  expectedLength: Option.none(),
  expectedLines: Option.some(5n),
  format: "plain",
  kind: "extended-text",
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
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
 * Construct an item whose body is the given Extended Texts, each bound to a single response of its
 * base type, with no response processing.
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
        baseType: interaction.baseType,
        cardinality: "single",
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
 * as a single value of the interaction's base type.
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
        cardinality: "single",
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
    "[Q-5] writes the Control's id, rows from expected-lines, placeholder and the payload's form name, the author's when given",
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
    '[Q-5] a keyboard walk in a test-built form posts multi-line text, "a\\r\\nb", which decode turns into "a\\nb"',
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
    "[Q-5] holds the value's text as the textarea's only child, and a text that starts with a line feed round-trips",
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
    '[Q-5] builds format="xhtml" beside a Choice as a notice in its place, and a walk still posts the Choice',
    () =>
      Effect.gen(function* xhtmlNotice() {
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
                      [attr("format", "xhtml"), attr("response-identifier", response)],
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
          feature: 'format="xhtml"',
          kind: "unsupported",
          path,
        });
        assert.deepStrictEqual(item.unsupported, [
          { feature: 'format="xhtml"', path, shown: "notice" },
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
