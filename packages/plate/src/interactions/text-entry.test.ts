import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { emitBody } from "#plate/emit/body.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { authoredId, partForSlot, resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { Malformed, decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { renderExtendedText } from "#plate/interactions/extended-text.ts";
import { renderTextEntry, validateTextEntry } from "#plate/interactions/text-entry.ts";
import { message } from "#plate/messages.ts";
import type {
  BodyNode,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { payload, redactItem } from "#plate/payload.ts";
import type { EmitState, Payload, View } from "#plate/payload.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { keyboardWalk } from "#plate/test/keyboard.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance every payload here is built for.
 */
const instance = "6f1d2c3b-4a5e-4f60-8b71-9c2d3e4f5a6b";

/**
 * The identifier of the response the first Text Entry of every item here binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the first Text Entry's Control posts under by default.
 */
const name = entryName(instance, response);

/**
 * The path of the paragraph every item body here holds.
 */
const paragraphPath = "qti-assessment-item/qti-item-body/p";

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * An unnamed Text Entry for a city, bound to a single string, with the author's class, an
 * `expected-length` and a `placeholder-text`.
 */
const city: TextEntryInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "short-answer",
  expectedLength: Option.some(12n),
  kind: "text-entry",
  path: `${paragraphPath}/qti-text-entry-interaction`,
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.some("A city"),
  response,
};

/**
 * The city's Text Entry bound to a single float, with no class, length or placeholder.
 */
const length: TextEntryInteraction = {
  ...city,
  baseType: "float",
  class: "",
  expectedLength: Option.none(),
  placeholder: Option.none(),
};

/**
 * A second unnamed Text Entry, bound to its own string response.
 */
const second: TextEntryInteraction = { ...city, response: "SECOND" };

/**
 * A span of the paragraph whose authored id, `capital-label`, an `aria-labelledby` can name.
 */
const capitalLabel: BodyNode = {
  attributes: [{ name: "id", value: "capital-label" }],
  children: [words("Capital of England")],
  kind: "element",
  path: `${paragraphPath}/span`,
  tag: "span",
};

/**
 * The author's message for a mismatch on {@link masked}.
 */
const maskMessage = "Enter up to six digits and points.";

/**
 * The city's Text Entry with a `pattern-mask` of up to six digits and points, and the author's
 * `data-patternmask-message`.
 */
const masked: TextEntryInteraction = {
  ...city,
  patternMask: Option.some("([0-9.]{0,6})"),
  patternMaskMessage: Option.some(maskMessage),
};

/**
 * Construct an item whose body is one paragraph holding text and the Text Entries, each bound to a
 * single response of its base type, with no response processing.
 *
 * @param interactions The Text Entries, in document order.
 * @param before Body nodes the paragraph holds before them, text by default.
 * @returns The item.
 */
const itemOf = (
  interactions: readonly TextEntryInteraction[],
  before: readonly BodyNode[] = [words("The answer is ")],
): Item => ({
  body: [
    {
      attributes: [],
      children: [
        ...before,
        ...interactions.flatMap((interaction, index) =>
          index === 0 ? [interaction] : [words(" and "), interaction],
        ),
        words("."),
      ],
      kind: "element",
      path: paragraphPath,
      tag: "p",
    },
  ],
  document: "items/capitals.xml",
  identifier: "capitals",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map(
    interactions.map((interaction) => [
      interaction.response,
      {
        areaMapping: Option.none(),
        baseType: interaction.baseType,
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: interaction.response,
        mapping: Option.none(),
      },
    ]),
  ),
  title: "Capitals",
  unsupported: [],
});

/**
 * An Extended Text bound to an ordered list `RIVERS` of at most three strings, so it renders three
 * Controls in a group its Prompt names.
 */
const rivers: ExtendedTextInteraction = {
  ...city,
  cardinality: "ordered",
  class: "",
  expectedLength: Option.none(),
  expectedLines: Option.none(),
  format: "plain",
  kind: "extended-text",
  maxStrings: Option.some(3n),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  placeholder: Option.none(),
  prompt: Option.some([words("Name three rivers.")]),
  response: "RIVERS",
};

/**
 * Construct an item whose body is an Extended Text, then the paragraph of {@link itemOf} holding
 * {@link city}.
 *
 * @param group The Extended Text.
 * @returns The item.
 */
const besideGroup = (group: ExtendedTextInteraction): Item => {
  const alone = itemOf([city]);

  return {
    ...alone,
    body: [group, ...alone.body],
    responses: new Map([
      ...alone.responses,
      [
        group.response,
        {
          areaMapping: Option.none(),
          baseType: group.baseType,
          cardinality: group.cardinality,
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier: group.response,
          mapping: Option.none(),
        },
      ],
    ]),
  };
};

/**
 * The view of a first render: no messages, nothing posted, no values and no author's names.
 */
const answering: View = {
  finished: false,
  instance,
  locale: "en",
  messages: [],
  mode: "answering",
  names: new Map(),
  posted: Option.none(),
  values: new Map(),
};

/**
 * Compute the payload of an item holding Text Entries.
 *
 * @param interactions The Text Entries, in document order.
 * @param view How the render was asked for, a first render by default.
 * @param before Body nodes the paragraph holds before them, text by default.
 * @returns The payload of the redacted item.
 */
const payloadOf = (
  interactions: readonly TextEntryInteraction[],
  view: View = answering,
  before?: readonly BodyNode[],
): Payload => payload(redactItem(itemOf(interactions, before)), view);

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
 * Render a payload's body, each Text Entry through {@link renderTextEntry} and each Extended Text
 * through {@link renderExtendedText}, and place it in a minimal item: a Root carrying `lang`, and a
 * plain `form`, as an author composes it, holding the body and a submit button after it.
 *
 * @param built The payload.
 * @returns The item's root.
 */
const page = (built: Payload): Effect.Effect<Element> =>
  Effect.gen(function* renderPage() {
    const state = yield* emitState;
    const body = yield* Effect.orDie(
      Effect.fromResult(
        emitBody(built, state, (interaction) => {
          switch (interaction.kind) {
            case "text-entry": {
              return renderTextEntry(interaction, built, state);
            }
            case "extended-text": {
              return renderExtendedText(interaction, built, state);
            }
            case "choice": {
              return assert.fail("This test renders no Choice.");
            }
            default: {
              return interaction satisfies never;
            }
          }
        }),
      ),
    );

    return h(
      "qti-assessment-item",
      { "data-slot": rowFor("item", "root").slot, lang: built.lang },
      [
        h("form", { action: "/submit", method: "post", novalidate: true }, [
          ...body,
          h("button", { type: "submit" }, [text("Submit")]),
        ]),
      ],
    );
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
 * Find the elements of a tree that are one Text Entry part, by their `data-slot` marker read
 * through the part table.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsIn = (tree: Element, part: PartOf<"text-entry-interaction">): readonly Element[] =>
  elementsIn(tree).filter((element) => {
    const slot = element.attrs["data-slot"];

    return (
      slot !== undefined &&
      slot !== true &&
      Option.exists(
        partForSlot(slot),
        (found) => found.interaction === "text-entry-interaction" && found.part === part,
      )
    );
  });

/**
 * Give the one element of a part in a tree holding a single Text Entry, failing the test
 * otherwise.
 *
 * @param tree The tree.
 * @param part The part.
 * @returns The part's element.
 */
const onlyPart = (tree: Element, part: PartOf<"text-entry-interaction">): Element => {
  const found = partsIn(tree, part);

  return found.length === 1 && found[0] !== undefined
    ? found[0]
    : assert.fail(`The tree holds ${found.length} ${part} parts, not one.`);
};

/**
 * Decode the entries posted for a Text Entry as its caller does: under the entry name the caller
 * gave its Control, as a single value of its base type, an integer in its `base`.
 *
 * @param interaction The Text Entry.
 * @param entries The posted entries.
 * @param entry The entry name the caller reads, the first Text Entry's default name unless given.
 * @returns The decoded value, or the {@link Malformed} `decode` gave.
 */
const decoded = (
  interaction: TextEntryInteraction,
  entries: readonly Entry[],
  entry: string = name,
): Effect.Effect<Value | Malformed> =>
  Effect.succeed(
    Result.merge(
      decode(
        entries,
        { baseType: interaction.baseType, cardinality: "single", name: entry },
        { base: interaction.base },
      ),
    ),
  );

describe("renderTextEntry", () => {
  it.effect('[Q-20] names the Control "Answer", and "Answer 2 of 2" for the second of two', () =>
    Effect.gen(function* defaultNames() {
      const alone = yield* page(payloadOf([city]));
      const pair = yield* page(payloadOf([city, second]));

      assert.strictEqual(nameOf(onlyPart(alone, "control"), alone), message("en", "answer"));
      assert.deepStrictEqual(
        partsIn(pair, "control").map((control) => nameOf(control, pair)),
        [
          message("en", "answerOf", { count: "2", n: "1" }),
          message("en", "answerOf", { count: "2", n: "2" }),
        ],
      );
    }),
  );

  it.effect(
    "[Q-20] lets the author's aria-label win, and scopes the ids of the author's aria-labelledby",
    () =>
      Effect.gen(function* authoredNames() {
        const labelled = yield* page(payloadOf([{ ...city, ariaLabel: Option.some("Capital") }]));
        const labelledControl = onlyPart(labelled, "control");
        const referenced = yield* page(
          payloadOf([{ ...city, ariaLabelledby: Option.some("capital-label") }], answering, [
            capitalLabel,
            words(": "),
          ]),
        );
        const referencedControl = onlyPart(referenced, "control");

        assert.strictEqual(labelledControl.attrs["aria-label"], "Capital");
        assert.strictEqual(nameOf(labelledControl, labelled), "Capital");
        assert.strictEqual(
          referencedControl.attrs["aria-labelledby"],
          authoredId(instance, "capital-label"),
        );
        assert.isUndefined(referencedControl.attrs["aria-label"]);
        assert.strictEqual(nameOf(referencedControl, referenced), "Capital of England");
        assert.deepStrictEqual(checkTree(referenced, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    '[Q-20] writes no aria-labelledby for an authored one that names no id, and names the Control "Answer"',
    () =>
      Effect.gen(function* emptyAriaLabelledby() {
        const tree = yield* page(payloadOf([{ ...city, ariaLabelledby: Option.some(" \t\n ") }]));
        const control = onlyPart(tree, "control");

        assert.isUndefined(control.attrs["aria-labelledby"]);
        assert.strictEqual(nameOf(control, tree), message("en", "answer"));
      }),
  );

  it.effect(
    "[Q-20] writes no aria-labelledby whose ids name no element of the item, and names the Control the renderer's way",
    () =>
      Effect.gen(function* danglingAriaLabelledby() {
        const answers = [
          message("en", "answerOf", { count: "2", n: "1" }),
          message("en", "answerOf", { count: "2", n: "2" }),
        ];

        for (const ids of ["nope", "nope missing"]) {
          const tree = yield* page(
            payloadOf([{ ...city, ariaLabelledby: Option.some(ids) }, second]),
          );
          const controls = partsIn(tree, "control");

          assert.deepStrictEqual(
            controls.map((control) => control.attrs["aria-labelledby"]),
            [undefined, undefined],
            ids,
          );
          assert.deepStrictEqual(
            controls.map((control) => control.attrs["aria-label"]),
            answers,
            ids,
          );
          assert.deepStrictEqual(
            controls.map((control) => nameOf(control, tree)),
            answers,
            ids,
          );
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], ids);
        }
      }),
  );

  it.effect(
    "[Q-20] keeps the ids of the author's aria-labelledby that name an element of the item, and drops the others",
    () =>
      Effect.gen(function* partlyDangling() {
        const tree = yield* page(
          payloadOf([{ ...city, ariaLabelledby: Option.some("nope capital-label") }], answering, [
            capitalLabel,
            words(": "),
          ]),
        );
        const control = onlyPart(tree, "control");

        assert.strictEqual(control.attrs["aria-labelledby"], authoredId(instance, "capital-label"));
        assert.isUndefined(control.attrs["aria-label"]);
        assert.strictEqual(nameOf(control, tree), "Capital of England");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-20] writes no aria-label for an authored one that is empty or blank, and names the Control the renderer's way",
    () =>
      Effect.gen(function* blankAriaLabel() {
        for (const label of ["", "   "]) {
          const tree = yield* page(payloadOf([{ ...city, ariaLabel: Option.some(label) }, second]));

          assert.deepStrictEqual(
            partsIn(tree, "control").map((control) => control.attrs["aria-label"]),
            [
              message("en", "answerOf", { count: "2", n: "1" }),
              message("en", "answerOf", { count: "2", n: "2" }),
            ],
            JSON.stringify(label),
          );
          assert.deepStrictEqual(
            partsIn(tree, "control").map((control) => nameOf(control, tree)),
            [
              message("en", "answerOf", { count: "2", n: "1" }),
              message("en", "answerOf", { count: "2", n: "2" }),
            ],
            JSON.stringify(label),
          );
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], JSON.stringify(label));
        }
      }),
  );

  it.effect(
    "[Q-20] [keyboard] a keyboard walk (Tab, type York, Enter) posts York under the Control's name",
    () =>
      Effect.gen(function* typeAndSubmit() {
        const tree = yield* page(payloadOf([city]));
        const posted = keyboardWalk(tree, ["Tab", { type: "York" }, "Enter"]);

        assert.strictEqual(onlyPart(tree, "control").attrs["name"], name);
        assert.deepStrictEqual(posted, Option.some([[name, "York"]]));
        assert.deepStrictEqual(
          validateTextEntry(
            city,
            yield* decoded(
              city,
              Option.getOrElse(posted, () => []),
            ),
            yield* configure({}),
          ),
          [],
        );
      }),
  );

  it.effect(
    "[Q-20] [keyboard] names the Control by the author's form name when names gives one",
    () =>
      Effect.gen(function* authoredFormName() {
        const tree = yield* page(
          payloadOf([city], { ...answering, names: new Map([[response, "city"]]) }),
        );

        assert.strictEqual(onlyPart(tree, "control").attrs["name"], "city");
        assert.deepStrictEqual(
          keyboardWalk(tree, ["Tab", { type: "York" }, "Enter"]),
          Option.some([["city", "York"]]),
        );
      }),
  );

  it.effect(
    "[Q-20] renders abc for a float back with its message: the posted text, aria-invalid and one autofocus",
    () =>
      Effect.gen(function* afterMalformed() {
        const messages = validateTextEntry(
          length,
          yield* decoded(length, [[name, "abc"]]),
          yield* configure({}),
        );
        const built = payloadOf([length], {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["abc"]]])),
        });
        const tree = yield* page(built);
        const control = onlyPart(tree, "control");

        assert.deepStrictEqual(messages, [{ response, text: message("en", "malformedNumber") }]);
        assert.strictEqual(control.attrs["value"], "abc");
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.strictEqual(
          control.attrs["aria-describedby"],
          built.messages.map((entry) => entry.id).join(" "),
        );
        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          [control],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-20] renders 12a refused by pattern-mask back with its message: aria-invalid, aria-describedby and one autofocus",
    () =>
      Effect.gen(function* afterPatternMismatch() {
        const messages = validateTextEntry(
          masked,
          yield* decoded(masked, [[name, "12a"]]),
          yield* configure({ validateResponses: true }),
        );
        const built = payloadOf([masked], {
          ...answering,
          messages,
          posted: Option.some(new Map([[response, ["12a"]]])),
        });
        const tree = yield* page(built);
        const control = onlyPart(tree, "control");

        assert.deepStrictEqual(messages, [{ response, text: maskMessage }]);
        assert.lengthOf(built.messages, 1);
        assert.strictEqual(control.attrs["value"], "12a");
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.strictEqual(control.attrs["aria-describedby"], built.messages[0]?.id);
        assert.deepStrictEqual(
          elementsIn(tree).filter((element) => element.attrs["autofocus"] !== undefined),
          [control],
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-20] sets inputmode decimal for a float and numeric for a decimal integer, and none for a string or a base above 10",
    () =>
      Effect.gen(function* inputModes() {
        const modes = [];
        for (const interaction of [
          length,
          { ...length, baseType: "integer" },
          city,
          { ...length, base: 16, baseType: "integer" },
        ] satisfies readonly TextEntryInteraction[]) {
          modes.push(onlyPart(yield* page(payloadOf([interaction])), "control").attrs["inputmode"]);
        }

        assert.deepStrictEqual(modes, ["decimal", "numeric", undefined, undefined]);
      }),
  );

  it.effect(
    "[Q-20] makes the Root a qti-text-entry-interaction carrying the author's class, and the Control a text input with size and placeholder",
    () =>
      Effect.gen(function* rootAndControl() {
        const tree = yield* page(payloadOf([city]));
        const root = onlyPart(tree, "root");
        const control = onlyPart(tree, "control");
        const plain = yield* page(payloadOf([{ ...length, expectedLength: Option.some(0n) }]));

        assert.strictEqual(root.tag, "qti-text-entry-interaction");
        assert.strictEqual(root.attrs["class"], "short-answer");
        assert.strictEqual(root.attrs["data-mode"], "answering");
        assert.isUndefined(root.attrs["data-attempt"]);
        assert.isUndefined(root.attrs["data-disabled"]);
        assert.deepStrictEqual(root.children, [control]);
        assert.strictEqual(control.tag, "input");
        assert.strictEqual(control.attrs["type"], "text");
        assert.isString(control.attrs["id"]);
        assert.strictEqual(control.attrs["size"], "12");
        assert.strictEqual(control.attrs["placeholder"], "A city");
        assert.strictEqual(control.attrs["value"], "");
        assert.isUndefined(control.attrs["disabled"]);
        assert.isUndefined(control.attrs["aria-invalid"]);
        assert.isUndefined(control.attrs["autofocus"]);
        assert.isUndefined(onlyPart(plain, "root").attrs["class"]);
        assert.isUndefined(onlyPart(plain, "control").attrs["size"]);
        assert.isUndefined(onlyPart(plain, "control").attrs["placeholder"]);
      }),
  );

  it.effect("[Q-20] disables the Control when the view is finished, showing the view's value", () =>
    Effect.gen(function* afterFinishing() {
      const tree = yield* page(
        payloadOf([city], {
          ...answering,
          finished: true,
          values: new Map([
            [
              response,
              {
                baseType: "string",
                cardinality: "single",
                values: [{ baseType: "string", value: "York" }],
              },
            ],
          ]),
        }),
      );
      const control = onlyPart(tree, "control");

      assert.strictEqual(onlyPart(tree, "root").attrs["data-disabled"], true);
      assert.notProperty(onlyPart(tree, "root").attrs, "data-finished");
      assert.strictEqual(control.attrs["disabled"], true);
      assert.strictEqual(control.attrs["value"], "York");
      assert.isUndefined(control.attrs["aria-invalid"]);
      assert.isTrue(elementsIn(tree).every((element) => element.attrs["autofocus"] === undefined));
    }),
  );

  it.effect(
    '[Q-20] [Q-5] names the Control "Answer" beside an Extended Text group its Prompt or its author names, whose Controls the group numbers',
    () =>
      Effect.gen(function* besideNamedGroup() {
        const authored: ExtendedTextInteraction = {
          ...rivers,
          ariaLabel: Option.some("Rivers"),
          prompt: Option.none(),
        };

        for (const group of [rivers, authored]) {
          const tree = yield* page(payload(redactItem(besideGroup(group)), answering));
          const textareas = elementsIn(tree).filter((element) => element.tag === "textarea");

          assert.strictEqual(nameOf(onlyPart(tree, "control"), tree), message("en", "answer"));
          assert.deepStrictEqual(
            textareas.map((control) => nameOf(control, tree)),
            ["1", "2", "3"].map((n) => message("en", "answerOf", { count: "3", n })),
          );
          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
          assert.isTrue(roundTrips(tree));
        }
      }),
  );

  it.effect("[Q-20] passes checkTree inside a p, and the tree round-trips", () =>
    Effect.gen(function* insideParagraph() {
      for (const interactions of [[city], [city, second], [length]]) {
        const tree = yield* page(payloadOf(interactions));
        const paragraphs = elementsIn(tree).filter((element) => element.tag === "p");
        const roots: readonly Node[] = partsIn(tree, "root");

        assert.lengthOf(paragraphs, 1);
        assert.deepStrictEqual(
          paragraphs[0]?.children.filter((child) => child.kind === "element"),
          roots,
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }
    }),
  );
});

describe("validateTextEntry", () => {
  it.effect(
    "[Q-20] gives a Malformed number malformedNumber, or the author's pattern-mask message",
    () =>
      Effect.gen(function* malformedInput() {
        const configuration = yield* configure({});
        const authored: TextEntryInteraction = {
          ...length,
          patternMaskMessage: Option.some("Enter a length in metres."),
        };
        const abc = yield* decoded(length, [[name, "abc"]]);

        assert.instanceOf(abc, Malformed);
        assert.deepStrictEqual(validateTextEntry(length, abc, configuration), [
          { response, text: message("en", "malformedNumber") },
        ]);
        assert.deepStrictEqual(validateTextEntry(authored, abc, configuration), [
          { response, text: "Enter a length in metres." },
        ]);
      }),
  );

  it.effect(
    "[Q-20] gives a string's file malformedFile and its second entry malformedSingleMany, and an integer's file malformedFile",
    () =>
      Effect.gen(function* stringRefusals() {
        const configuration = yield* configure({});
        const file = yield* decoded(city, [[name, new Blob(["York"])]]);
        const twice = yield* decoded(city, [
          [name, "York"],
          [name, "Leeds"],
        ]);

        assert.instanceOf(file, Malformed);
        assert.strictEqual(file.reason, "file");
        assert.deepStrictEqual(validateTextEntry(city, file, configuration), [
          { response, text: message("en", "malformedFile") },
        ]);
        assert.instanceOf(twice, Malformed);
        assert.strictEqual(twice.reason, "single-many");
        assert.deepStrictEqual(validateTextEntry(city, twice, configuration), [
          { response, text: message("en", "malformedSingleMany") },
        ]);

        const counted: TextEntryInteraction = { ...length, baseType: "integer" };
        assert.deepStrictEqual(
          validateTextEntry(
            counted,
            yield* decoded(counted, [[name, new Blob(["3"])]]),
            configuration,
          ),
          [{ response, text: message("en", "malformedFile") }],
        );
      }),
  );

  it.effect(
    "[Q-20] checks pattern-mask under validateResponses only: 12a gives the author's message, 12.5 none",
    () =>
      Effect.gen(function* patternMismatch() {
        const strict = yield* configure({ validateResponses: true });
        const lenient = yield* configure({});
        const mismatch = yield* decoded(masked, [[name, "12a"]]);

        assert.deepStrictEqual(validateTextEntry(masked, mismatch, strict), [
          { response, text: maskMessage },
        ]);
        assert.deepStrictEqual(
          validateTextEntry({ ...masked, patternMaskMessage: Option.none() }, mismatch, strict),
          [{ response, text: message("en", "patternMismatch") }],
        );
        assert.deepStrictEqual(
          validateTextEntry(masked, yield* decoded(masked, [[name, "12.5"]]), strict),
          [],
        );
        assert.deepStrictEqual(validateTextEntry(masked, mismatch, lenient), []);
      }),
  );

  it.effect("[Q-20] checks no NULL against pattern-mask, even one that refuses empty text", () =>
    Effect.gen(function* nullAgainstPattern() {
      const digits: TextEntryInteraction = { ...masked, patternMask: Option.some("[0-9]+") };
      const value = yield* decoded(digits, [[name, ""]]);

      assert.deepStrictEqual(value, { baseType: "string", cardinality: "single", values: [] });
      assert.deepStrictEqual(
        validateTextEntry(digits, value, yield* configure({ validateResponses: true })),
        [],
      );
    }),
  );

  it.effect(
    "[Q-20] matches a float posted 1.50 against pattern-mask as 1.5, and a string as typed",
    () =>
      Effect.gen(function* canonicalFloat() {
        const strict = yield* configure({ validateResponses: true });
        const oneDecimal = Option.some(String.raw`[0-9]\.[0-9]`);
        const measured: TextEntryInteraction = { ...length, patternMask: oneDecimal };
        const typed: TextEntryInteraction = { ...city, patternMask: oneDecimal };
        const mismatch = [{ response, text: message("en", "patternMismatch") }];

        assert.deepStrictEqual(
          validateTextEntry(measured, yield* decoded(measured, [[name, "1.50"]]), strict),
          [],
        );
        assert.deepStrictEqual(
          validateTextEntry(measured, yield* decoded(measured, [[name, "1.55"]]), strict),
          mismatch,
        );
        assert.deepStrictEqual(
          validateTextEntry(typed, yield* decoded(typed, [[name, "1.50"]]), strict),
          mismatch,
        );
      }),
  );

  it.effect(
    "[Q-20] accepts every decoded value without a pattern-mask, an integer in its base and NULL included, whatever validateResponses says",
    () =>
      Effect.gen(function* decodedValues() {
        const hex: TextEntryInteraction = { ...length, base: 16, baseType: "integer" };

        for (const validateResponses of [false, true]) {
          const configuration = yield* configure({ validateResponses });

          for (const [interaction, posted] of [
            [city, "York"],
            [length, "2.5"],
            [hex, "-ff"],
            [city, ""],
          ] as const) {
            const value = yield* decoded(interaction, [[name, posted]]);

            assert.notInstanceOf(value, Malformed);
            assert.deepStrictEqual(validateTextEntry(interaction, value, configuration), []);
          }
        }

        assert.deepStrictEqual(
          validateTextEntry(hex, yield* decoded(hex, [[name, "fg"]]), yield* configure({})),
          [{ response, text: message("en", "malformedNumber") }],
        );
      }),
  );
});
