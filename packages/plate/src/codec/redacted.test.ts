import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRedacted, encodeRedacted } from "#plate/codec/redacted.ts";
import type { InvalidRedacted, RedactedJson, RedactedSchema } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  ResponseDeclaration,
  TextEntryInteraction,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { brandRedacted } from "#plate/payload.ts";
import type { Redacted, RedactedFields } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * A body node of {@link RedactedSchema}'s type.
 */
type SchemaBodyNode = (typeof RedactedSchema.Type)["body"][number];

/**
 * A body node of the Schema is a `BodyNode` of the item model, so each is assignable to the other;
 * `tsc` refuses this line when the model gains a field or a kind the Schema lacks, or the reverse.
 */
const bodyPinned: Equals<SchemaBodyNode, BodyNode> = true;

/**
 * {@link RedactedSchema}'s type is {@link RedactedFields}; `tsc` refuses this line when they part.
 */
const fieldsPinned: Equals<typeof RedactedSchema.Type, RedactedFields> = true;

/**
 * The instance every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * The default configuration.
 */
const defaults: Effect.Effect<Configuration, unknown> = configure({});

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * Construct a response declaration with no correct response, default or mapping.
 *
 * @param identifier The response identifier.
 * @param baseType Its base type.
 * @param cardinality Its cardinality.
 * @returns The declaration.
 */
const declaration = (
  identifier: string,
  baseType: ResponseDeclaration["baseType"],
  cardinality: Value["cardinality"],
): ResponseDeclaration => ({
  baseType,
  cardinality,
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier,
  mapping: Option.none(),
});

/**
 * Construct an item with no outcomes and no processing.
 *
 * @param identifier The item identifier, also its title.
 * @param lang Its `xml:lang`.
 * @param body Its body.
 * @param responses Its response declarations.
 * @param unsupported The features it does not render, none by default.
 * @returns The item.
 */
const itemOf = (
  identifier: string,
  lang: Option.Option<string>,
  body: readonly BodyNode[],
  responses: readonly ResponseDeclaration[],
  unsupported: readonly UnsupportedFeature[] = [],
): Item => ({
  body,
  document: `items/${identifier}.xml`,
  identifier,
  lang,
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map(responses.map((response) => [response.identifier, response])),
  title: identifier,
  unsupported,
});

/**
 * A multiple Choice with a Prompt that holds a `p`, the largest `max-choices` reading 46 allows,
 * `min-choices` 2, an orientation, an `aria-label` and an authored too-few message.
 */
const choice: ChoiceInteraction = {
  ariaLabel: Option.some("Prime numbers"),
  ariaLabelledby: Option.none(),
  cardinality: "multiple",
  choices: [
    { content: [words("2")], identifier: "TWO" },
    { content: [words("3")], identifier: "THREE" },
    { content: [words("4")], identifier: "FOUR" },
  ],
  class: "",
  kind: "choice",
  maxChoices: 9_223_372_036_854_775_807n,
  messages: { max: Option.none(), min: Option.some("Choose at least two.") },
  minChoices: 2n,
  orientation: Option.some("horizontal"),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([
    {
      attributes: [],
      children: [words("Which are prime?")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-prompt/p",
      tag: "p",
    },
  ]),
  response: "RESPONSE",
  shuffle: false,
};

/**
 * A Text Entry for an integer, with an `expected-length`, a placeholder and a pattern-mask
 * message.
 */
const year: TextEntryInteraction = {
  ariaLabel: Option.some("Year"),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "integer",
  class: "",
  expectedLength: Option.some(4n),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
  patternMaskMessage: Option.some("Write the year in four digits."),
  placeholder: Option.some("YYYY"),
  response: "YEAR",
};

/**
 * An Extended Text with a Prompt and `expected-lines`.
 */
const essay: ExtendedTextInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  expectedLines: Option.some(12n),
  format: "plain",
  kind: "extended-text",
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  prompt: Option.some([words("Describe the water cycle.")]),
  response: "ESSAY",
};

/**
 * The Choice item, with `xml:lang`.
 */
const choiceItem = itemOf(
  "primes",
  Option.some("en-GB"),
  [choice],
  [declaration("RESPONSE", "identifier", "multiple")],
);

/**
 * The Text Entry item, inside a paragraph, with no `xml:lang`.
 */
const yearItem = itemOf(
  "landing",
  Option.none(),
  [
    {
      attributes: [],
      children: [words("The first Moon landing was in "), year, words(".")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  [declaration("YEAR", "integer", "single")],
);

/**
 * The Extended Text item.
 */
const essayItem = itemOf(
  "water",
  Option.none(),
  [essay],
  [declaration("ESSAY", "string", "single")],
);

/**
 * An item whose body holds an element with an attribute, text and an unsupported part shown as a
 * notice.
 */
const noticeItem = itemOf(
  "hotspot",
  Option.none(),
  [
    {
      attributes: [{ name: "class", value: "lead" }],
      children: [words("Find the capital on the map.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
    words("\n  "),
    {
      feature: "qti-hotspot-interaction",
      kind: "unsupported",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
    },
  ],
  [],
  [
    {
      feature: "qti-hotspot-interaction",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
      shown: "notice",
    },
  ],
);

/**
 * The items the round trip covers, by name.
 */
const items: readonly (readonly [string, Item])[] = [
  ["Choice", choiceItem],
  ["Text Entry", yearItem],
  ["Extended Text", essayItem],
  ["element, text and notice", noticeItem],
];

/**
 * Write the JSON form of an accepted item's redaction as JSON text.
 *
 * @param item The item, accepted through the test seam.
 * @returns The JSON text a host would send.
 */
const wireText = (item: Item): string =>
  JSON.stringify(Result.getOrThrow(encodeRedacted(redact(acceptForTest(item)))));

/**
 * Read the failure of a codec Result, asserting first that it is a failed Result.
 *
 * @param result The codec's Result.
 * @returns The failure.
 */
const failureOf = (
  result: Result.Result<unknown, InvalidRedacted>,
): Effect.Effect<InvalidRedacted, unknown> => {
  assert.isTrue(Result.isResult(result));
  assert.isTrue(Result.isFailure(result));

  return Effect.flip(Effect.fromResult(result));
};

describe("the Schema and the model", () => {
  it("agree on the body nodes and the redacted fields", () => {
    assert.isTrue(bodyPinned);
    assert.isTrue(fieldsPinned);
  });
});

describe("encodeRedacted and decodeRedacted", () => {
  it("control: JSON.stringify of a redacted Choice throws a TypeError on its bigint counts", () => {
    const redacted = redact(acceptForTest(choiceItem));

    assert.throws(() => {
      JSON.stringify(redacted);
    }, TypeError);
  });

  for (const [name, item] of items) {
    it.effect(
      `round-trip the ${name} item through JSON text to an equal Redacted that renders the same HTML`,
      () =>
        Effect.gen(function* roundTrip() {
          const redacted = redact(acceptForTest(item));
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
          const handedOver: unknown = JSON.parse(
            JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
          );
          const decoded = Result.getOrThrow(decodeRedacted(handedOver));
          const configuration = yield* defaults;

          assert.deepStrictEqual(decoded, redacted);
          assert.strictEqual(
            Result.getOrThrow(render(decoded, configuration, { instance })).html,
            Result.getOrThrow(render(redacted, configuration, { instance })).html,
          );
        }),
    );
  }

  it("write a count as its decimal digits and leave out the key of an Option that is none", () => {
    const choiceText = wireText(choiceItem);

    assert.include(choiceText, '"maxChoices":"9223372036854775807"');
    assert.include(choiceText, '"minChoices":"2"');
    assert.include(choiceText, '"lang":"en-GB"');
    assert.notInclude(choiceText, '"ariaLabelledby":');
    assert.notInclude(choiceText, '"max":');
    assert.notInclude(wireText(yearItem), '"lang":');
  });
});

describe("decodeRedacted", () => {
  it.effect(
    "refuses maxChoices written as the JSON number 2: InvalidRedacted at stage decode",
    () =>
      Effect.gen(function* refusesNumericCount() {
        const json: RedactedJson = Result.getOrThrow(
          encodeRedacted(redact(acceptForTest(choiceItem))),
        );
        const numeric = {
          ...json,
          body: json.body.map((node) =>
            node.kind === "choice" ? { ...node, maxChoices: 2 } : node,
          ),
        };
        const error = yield* failureOf(decodeRedacted(numeric));

        assert.strictEqual(error._tag, "InvalidRedacted");
        assert.strictEqual(error.stage, "decode");
      }),
  );

  it.effect("refuses the JSON form with its body removed: InvalidRedacted at stage decode", () =>
    Effect.gen(function* refusesMissingBody() {
      const json: RedactedJson = Result.getOrThrow(
        encodeRedacted(redact(acceptForTest(choiceItem))),
      );
      const bodiless = Object.fromEntries(Object.entries(json).filter(([key]) => key !== "body"));
      const error = yield* failureOf(decodeRedacted(bodiless));

      assert.strictEqual(error._tag, "InvalidRedacted");
      assert.strictEqual(error.stage, "decode");
    }),
  );
});

describe("encodeRedacted", () => {
  it.effect("refuses a count built by hand as the number 2: InvalidRedacted at stage encode", () =>
    Effect.gen(function* refusesInexactCount() {
      const redacted = redact(acceptForTest(choiceItem));
      const handBuilt = brandRedacted({
        ...redacted,
        // @ts-expect-error -- a count is a bigint; the number 2 is what encode must refuse.
        body: [{ ...choice, maxChoices: 2 }],
      });
      const error = yield* failureOf(encodeRedacted(handBuilt));

      assert.strictEqual(error._tag, "InvalidRedacted");
      assert.strictEqual(error.stage, "encode");
    }),
  );
});

describe("render", () => {
  it("refuses the JSON form and an object built by hand, and takes what decodeRedacted returns", () => {
    const redacted = redact(acceptForTest(choiceItem));
    const json = Result.getOrThrow(encodeRedacted(redacted));
    const decoded: Redacted = Result.getOrThrow(decodeRedacted(json));
    const handBuilt: RedactedFields = {
      body: redacted.body,
      document: redacted.document,
      identifier: redacted.identifier,
      lang: redacted.lang,
      notices: redacted.notices,
      responses: redacted.responses,
      title: redacted.title,
    };
    /**
     * The calls `tsc` judges. They never run: `render` reads `Option`s a `RedactedJson` does not
     * hold.
     *
     * @param configuration The configuration.
     * @returns The three renders.
     */
    const calls = (configuration: Configuration): readonly unknown[] => [
      render(decoded, configuration),
      // @ts-expect-error -- the JSON form holds counts as digits and Options as optional keys; decodeRedacted makes the Redacted render takes.
      render(json, configuration),
      // @ts-expect-error -- an object built by hand passed neither redactItem's allowlist nor decodeRedacted's check.
      render(handBuilt, configuration),
    ];

    assert.isFunction(calls);
  });
});

describe("the public surface", () => {
  it.effect("@qti-pie/plate exposes encodeRedacted and decodeRedacted", () =>
    Effect.gen(function* selfImport() {
      const surface = yield* Effect.promise(() => import("@qti-pie/plate"));

      assert.strictEqual(surface.encodeRedacted, encodeRedacted);
      assert.strictEqual(surface.decodeRedacted, decodeRedacted);
    }),
  );
});
