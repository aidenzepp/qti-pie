import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { Malformed, entryName } from "#plate/form/encoding.ts";
import { validateInlineChoice } from "#plate/interactions/inline-choice.ts";
import { message } from "#plate/messages.ts";
import type { BodyNode, InlineChoiceInteraction } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

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
    { content: [words("apples")], fixed: false, identifier: "A" },
    { content: [words("pears")], fixed: false, identifier: "B" },
    { content: [words("plums")], fixed: false, identifier: "C" },
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
