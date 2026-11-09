import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRedacted, encodeRedacted } from "#plate/codec/redacted.ts";
import type {
  InvalidRedacted,
  RedactedJson,
  RedactedSchema,
  SchemaBodyNode,
} from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
  PrintedVariable,
  ResponseDeclaration,
  TemplateContent,
  TextEntryInteraction,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import type { RedactRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { brandRedacted } from "#plate/payload.ts";
import type { Redacted, RedactedFields } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { acceptedOf, openCorpus, recordStates, templated } from "#plate/test/sweep.ts";
import { open } from "#plate/validate/open.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The members of the codec's body-node union, read from the union itself, are the kinds of
 * `BodyNode` with the same fields; `tsc` refuses this line when the model gains a field or a kind
 * the union lacks, or the reverse. `RedactedSchema`'s body cannot serve: it holds the union through
 * a suspended reference whose annotation declares its type `BodyNode`, so it would compare
 * `BodyNode` with itself.
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
  areaMapping: Option.none(),
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
  templateProcessing: Option.none(),
  templates: new Map(),
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
    { content: [words("2")], fixed: false, identifier: "TWO", templateVisibility: Option.none() },
    { content: [words("3")], fixed: false, identifier: "THREE", templateVisibility: Option.none() },
    { content: [words("4")], fixed: false, identifier: "FOUR", templateVisibility: Option.none() },
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
 * A Text Entry for an integer, with an `expected-length`, a placeholder, a `pattern-mask` and its
 * message.
 */
const year: TextEntryInteraction = {
  ariaLabel: Option.some("Year"),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "integer",
  cardinality: "single",
  class: "",
  expectedLength: Option.some(4n),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
  patternMask: Option.some("[0-9]{4}"),
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
  cardinality: "single",
  class: "",
  expectedLength: Option.none(),
  expectedLines: Option.some(12n),
  format: "plain",
  kind: "extended-text",
  maxStrings: Option.none(),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  prompt: Option.some([words("Describe the water cycle.")]),
  response: "ESSAY",
};

/**
 * An Extended Text bound to an ordered response, with counts past 2^63-1, which no reading bounds.
 */
const stages: ExtendedTextInteraction = {
  ...essay,
  cardinality: "ordered",
  maxStrings: Option.some(18_446_744_073_709_551_616n),
  minStrings: 2n,
  prompt: Option.some([words("Name the stages in order.")]),
  response: "STAGES",
};

/**
 * An Inline Choice with every field: an author's name both ways, a class, a Label that holds an
 * element, a placeholder, `required`, `min-choices` 1, an authored too-few message, a fixed choice
 * whose content holds an element, and `shuffle`.
 */
const colour: InlineChoiceInteraction = {
  ariaLabel: Option.some("Colour"),
  ariaLabelledby: Option.some("colour-hint"),
  choices: [
    { content: [words("red")], fixed: false, identifier: "RED", templateVisibility: Option.none() },
    {
      content: [
        {
          attributes: [],
          children: [words("green")],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction/qti-inline-choice/em",
          tag: "em",
        },
      ],
      fixed: true,
      identifier: "GREEN",
      templateVisibility: Option.none(),
    },
    {
      content: [words("blue")],
      fixed: false,
      identifier: "BLUE",
      templateVisibility: Option.none(),
    },
  ],
  class: "wide",
  kind: "inline-choice",
  label: Option.some([
    words("The sky's "),
    {
      attributes: [],
      children: [words("colour")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction/qti-label/strong",
      tag: "strong",
    },
  ]),
  messages: { min: Option.some("Choose a colour.") },
  minChoices: 1n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.some("Pick one"),
  required: true,
  response: "COLOUR",
  shuffle: true,
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
 * The ordered Extended Text item.
 */
const stagesItem = itemOf(
  "stages",
  Option.none(),
  [stages],
  [declaration("STAGES", "string", "ordered")],
);

/**
 * The Inline Choice item, inside a paragraph, with no `xml:lang`.
 */
const colourItem = itemOf(
  "sky",
  Option.none(),
  [
    {
      attributes: [],
      children: [words("The sky is "), colour, words(".")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  [declaration("COLOUR", "identifier", "single")],
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
 * The Text Entry item with a second Text Entry, for a string, bound to the record response
 * `ANSWER`, built by hand: the model builds no interaction bound to a record yet.
 */
const answerItem: Item = {
  ...itemOf(
    "landing-answer",
    Option.none(),
    [
      {
        attributes: [],
        children: [
          words("The first Moon landing was in "),
          year,
          words(". Its crew numbered "),
          { ...year, baseType: "string", patternMask: Option.none(), response: "ANSWER" },
          words("."),
        ],
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      },
    ],
    [declaration("YEAR", "integer", "single")],
  ),
  records: new Map([
    ["ANSWER", { correct: Option.none(), defaultValue: Option.none(), identifier: "ANSWER" }],
  ]),
};

/**
 * The items the round trip covers, by name.
 */
const items: readonly (readonly [string, Item])[] = [
  ["Choice", choiceItem],
  ["Text Entry", yearItem],
  ["Extended Text", essayItem],
  ["ordered Extended Text", stagesItem],
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

/**
 * The JSON form of the notice item with its body replaced by one chain of `span`s, each the only
 * child of the one around it, with a run of text in the innermost.
 *
 * @param levels How many `span`s deep the chain nests.
 * @returns The JSON form, which `encodeRedacted` never writes for a chain deeper than the reader
 *   lets an item nest.
 */
const nestedSpans = (levels: number): RedactedJson => {
  let node: RedactedJson["body"][number] = { kind: "text", text: "deep" };
  for (let level = 0; level < levels; level += 1) {
    node = {
      attributes: [],
      children: [node],
      kind: "element",
      tag: "span",
    };
  }

  return { ...Result.getOrThrow(encodeRedacted(redact(acceptForTest(noticeItem)))), body: [node] };
};

/**
 * An item document whose body is one chain of `div`s, each the only child of the one around it,
 * with a run of text in the innermost.
 *
 * @param levels How many `div`s deep the chain nests under `qti-item-body`.
 * @returns The document's bytes.
 */
const nestedDivs = (levels: number): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="deep" title="deep" adaptive="false" time-dependent="false"><qti-item-body>${"<div>".repeat(levels)}deep${"</div>".repeat(levels)}</qti-item-body></qti-assessment-item>`,
  );

/**
 * A node of the body in the JSON form.
 */
type BodyNodeJson = RedactedJson["body"][number];

/**
 * The JSON form `encodeRedacted` writes for an accepted item's redaction.
 *
 * @param item The item, accepted through the test seam.
 * @returns The JSON form, before any JSON text.
 */
const jsonOf = (item: Item): RedactedJson =>
  Result.getOrThrow(encodeRedacted(redact(acceptForTest(item))));

/**
 * A Text Entry for the response `YEAR` in the JSON form, which the edits below place where QTI's
 * schema admits no interaction.
 */
const yearJson: BodyNodeJson = {
  base: 10,
  baseType: "integer",
  cardinality: "single",
  class: "",
  kind: "text-entry",
  response: "YEAR",
};

/**
 * Construct an HTML element of the body in the JSON form, with no attributes.
 *
 * @param tag The element's name.
 * @param children Its children.
 * @returns The element.
 */
const elementJson = (tag: string, children: readonly BodyNodeJson[]): BodyNodeJson => ({
  attributes: [],
  children,
  kind: "element",
  tag,
});

/**
 * The JSON form of the Choice item with its first choice's content replaced.
 *
 * @param content The content the first choice, `TWO`, holds instead of its text.
 * @returns The edited JSON form.
 */
const withFirstChoice = (content: readonly BodyNodeJson[]): RedactedJson => {
  const json = jsonOf(choiceItem);

  return {
    ...json,
    body: json.body.map((node) =>
      node.kind === "choice"
        ? {
            ...node,
            choices: node.choices.map((simple, index) =>
              index === 0 ? { ...simple, content } : simple,
            ),
          }
        : node,
    ),
  };
};

/**
 * An Inline Choice in the JSON form.
 */
type InlineChoiceJson = Extract<BodyNodeJson, { readonly kind: "inline-choice" }>;

/**
 * The JSON form of the Inline Choice item with its Inline Choice edited.
 *
 * @param edit What to make of the Inline Choice inside the item's paragraph.
 * @returns The edited JSON form.
 */
const withInlineChoice = (edit: (node: InlineChoiceJson) => InlineChoiceJson): RedactedJson => {
  const json = jsonOf(colourItem);

  return {
    ...json,
    body: json.body.map((node) =>
      node.kind === "element"
        ? {
            ...node,
            children: node.children.map((child) =>
              child.kind === "inline-choice" ? edit(child) : child,
            ),
          }
        : node,
    ),
  };
};

/**
 * One chain of `span`s in the JSON form, each the only child of the one around it.
 *
 * @param spans How many `span`s the chain holds.
 * @param innermost The children of the innermost `span`.
 * @returns The outermost `span`.
 */
const spanChain = (spans: number, innermost: readonly BodyNodeJson[]): BodyNodeJson => {
  let node = elementJson("span", innermost);
  for (let span = 1; span < spans; span += 1) {
    node = elementJson("span", [node]);
  }

  return node;
};

/**
 * Give body nodes with every path `""`, at any depth: an element's children, a Prompt, a Label, a
 * choice's content and a template block's or inline's content included, as `decodeRedacted` gives
 * them, since the JSON form holds no path (review P2-6).
 *
 * @param nodes The body nodes, with their paths.
 * @returns The same nodes, each path `""`.
 */
const withoutPaths = (nodes: readonly BodyNode[]): readonly BodyNode[] =>
  nodes.map((node): BodyNode => {
    switch (node.kind) {
      case "element": {
        return { ...node, children: withoutPaths(node.children), path: "" };
      }
      case "choice": {
        return {
          ...node,
          choices: node.choices.map((simple) => ({
            ...simple,
            content: withoutPaths(simple.content),
          })),
          path: "",
          prompt: node.prompt.pipe(Option.map((prompt) => withoutPaths(prompt))),
        };
      }
      case "inline-choice": {
        return {
          ...node,
          choices: node.choices.map((simple) => ({
            ...simple,
            content: withoutPaths(simple.content),
          })),
          label: node.label.pipe(Option.map((label) => withoutPaths(label))),
          path: "",
        };
      }
      case "extended-text": {
        return {
          ...node,
          path: "",
          prompt: node.prompt.pipe(Option.map((prompt) => withoutPaths(prompt))),
        };
      }
      case "feedback-block":
      case "feedback-inline":
      case "template-block":
      case "template-inline": {
        return { ...node, content: withoutPaths(node.content), path: "" };
      }
      case "printed-variable":
      case "text-entry":
      case "unsupported": {
        return { ...node, path: "" };
      }
      case "text": {
        return node;
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Give a redacted item as its JSON form decodes: every body node's path `""`, each modal
 * feedback's content's too, and `unprinted`'s.
 *
 * @param redacted The item `redact` gave.
 * @returns The same item, each path in its body, its modal feedback and `unprinted`, `""`.
 */
const pathless = (redacted: Redacted): Redacted =>
  brandRedacted({
    ...redacted,
    body: withoutPaths(redacted.body),
    modalFeedback: redacted.modalFeedback.map((feedback) => ({
      ...feedback,
      content: withoutPaths(feedback.content),
    })),
    unprinted: redacted.unprinted.pipe(Option.map((unprinted) => ({ ...unprinted, path: "" }))),
  });

/**
 * Collect the path of every body node that has one, at any depth, in document order: an element's
 * children, a Prompt, a Label, a choice's content and a template block's or inline's content
 * included.
 *
 * @param nodes The body nodes.
 * @returns Their paths.
 */
const pathsOf = (nodes: readonly BodyNode[]): readonly string[] =>
  nodes.flatMap((node): readonly string[] => {
    switch (node.kind) {
      case "element": {
        return [node.path, ...pathsOf(node.children)];
      }
      case "choice": {
        return [
          node.path,
          ...Option.toArray(node.prompt).flatMap((prompt) => pathsOf(prompt)),
          ...node.choices.flatMap((simple) => pathsOf(simple.content)),
        ];
      }
      case "inline-choice": {
        return [
          node.path,
          ...Option.toArray(node.label).flatMap((label) => pathsOf(label)),
          ...node.choices.flatMap((simple) => pathsOf(simple.content)),
        ];
      }
      case "extended-text": {
        return [node.path, ...Option.toArray(node.prompt).flatMap((prompt) => pathsOf(prompt))];
      }
      case "feedback-block":
      case "feedback-inline":
      case "template-block":
      case "template-inline": {
        return [node.path, ...pathsOf(node.content)];
      }
      case "printed-variable":
      case "text-entry":
      case "unsupported": {
        return [node.path];
      }
      case "text": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

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
      `round-trip the ${name} item through JSON text to the equal Redacted with every path "", which renders the same HTML`,
      () =>
        Effect.gen(function* roundTrip() {
          const redacted = redact(acceptForTest(item));
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
          const handedOver: unknown = JSON.parse(
            JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
          );
          const decoded = Result.getOrThrow(decodeRedacted(handedOver));
          const configuration = yield* defaults;

          assert.deepStrictEqual(decoded, pathless(redacted));
          assert.strictEqual(
            Result.getOrThrow(render(decoded, configuration, { instance })).html,
            Result.getOrThrow(render(redacted, configuration, { instance })).html,
          );
        }),
    );
  }

  it.effect(
    "[Q-12] round-trip an item whose Inline Choice carries every field through JSON text: the decoded body equals the model's, and renders the same HTML",
    () =>
      Effect.gen(function* inlineChoiceRoundTrip() {
        const redacted = redact(acceptForTest(colourItem));
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(
          JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
        );
        const decoded = Result.getOrThrow(decodeRedacted(handedOver));
        const configuration = yield* defaults;

        assert.deepStrictEqual(decoded.body, withoutPaths(colourItem.body));
        assert.deepStrictEqual(decoded, pathless(redacted));
        assert.strictEqual(
          Result.getOrThrow(render(decoded, configuration, { instance })).html,
          Result.getOrThrow(render(redacted, configuration, { instance })).html,
        );
      }),
  );

  it.effect(
    "[Q-20] record binding in the page: a redacted item with a record binding round-trips its JSON form, which writes the binding with no base type",
    () =>
      Effect.gen(function* recordBindingRoundTrip() {
        const redacted = redact(acceptForTest(answerItem));
        const json = Result.getOrThrow(encodeRedacted(redacted));
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(JSON.stringify(json));
        const decoded = Result.getOrThrow(decodeRedacted(handedOver));
        const configuration = yield* defaults;

        assert.deepStrictEqual(json.responses, [
          { baseType: "integer", cardinality: "single", identifier: "YEAR" },
          { cardinality: "record", identifier: "ANSWER" },
        ]);
        assert.deepStrictEqual(decoded, pathless(redacted));
        assert.strictEqual(
          Result.getOrThrow(render(decoded, configuration, { instance })).html,
          Result.getOrThrow(render(redacted, configuration, { instance })).html,
        );
      }),
  );

  it("write a count as its decimal digits and leave out the key of an Option that is none", () => {
    const choiceText = wireText(choiceItem);

    assert.include(choiceText, '"maxChoices":"9223372036854775807"');
    assert.include(choiceText, '"minChoices":"2"');
    assert.include(choiceText, '"lang":"en-GB"');
    assert.notInclude(choiceText, '"ariaLabelledby":');
    assert.notInclude(choiceText, '"max":');
    assert.notInclude(wireText(yearItem), '"lang":');
    assert.include(wireText(stagesItem), '"maxStrings":"18446744073709551616"');
    assert.include(wireText(stagesItem), '"minStrings":"2"');
    assert.notInclude(wireText(essayItem), '"maxStrings":');
  });
});

/**
 * An item document whose body holds one text interaction bound to a string `RESPONSE`.
 *
 * @param body The body's markup.
 * @param cardinality The response's cardinality, `single` by default.
 * @returns The document's bytes.
 */
const textItemBytes = (body: string, cardinality = "single"): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="text" title="Text" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="${cardinality}" base-type="string"/><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  );

/**
 * Open an item document, assert it is accepted naming exactly the unsupported features given, and
 * assert its redaction round-trips through JSON text to the equal `Redacted` with every path `""`
 * that renders the same HTML.
 *
 * @param name The case, which a failure names.
 * @param bytes The document's bytes.
 * @param unsupported The features the verdict must name, in order; none for `accepted`.
 * @returns Nothing; each check is an assertion.
 */
const acceptedAndRoundTripped = Effect.fnUntraced(function* acceptedAndRoundTripped(
  name: string,
  bytes: Uint8Array,
  unsupported: readonly string[],
) {
  const verdict = yield* open("items/text.xml", bytes);
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${name} is ${verdict.verdict}`),
  );

  assert.strictEqual(
    verdict.verdict,
    unsupported.length === 0 ? "accepted" : "accepted-with-unsupported",
  );
  assert.deepStrictEqual(
    accepted.unsupported.map((entry) => entry.feature),
    [...unsupported],
  );

  const redacted = redact(accepted);
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
  const handedOver: unknown = JSON.parse(
    JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
  );
  const decoded = Result.getOrThrow(decodeRedacted(handedOver));
  const configuration = yield* defaults;

  assert.deepStrictEqual(decoded, pathless(redacted));
  assert.strictEqual(
    Result.getOrThrow(render(decoded, configuration, { instance })).html,
    Result.getOrThrow(render(redacted, configuration, { instance })).html,
  );
});

describe('the verdict and the codec on pattern-mask and format="xhtml"', () => {
  const documents = [
    [
      '[Q-20] a Text Entry with pattern-mask="[0-9]+"',
      '<p>Code: <qti-text-entry-interaction response-identifier="RESPONSE" pattern-mask="[0-9]+"/></p>',
      [],
    ],
    [
      '[Q-20] a Text Entry whose pattern-mask="[0-9" the translator refuses',
      '<p>Code: <qti-text-entry-interaction response-identifier="RESPONSE" pattern-mask="[0-9"/></p>',
      ["pattern-mask"],
    ],
    [
      '[Q-5] an Extended Text with format="xhtml"',
      '<qti-extended-text-interaction response-identifier="RESPONSE" format="xhtml"/>',
      [],
    ],
  ] as const;

  for (const [name, body, unsupported] of documents) {
    it.effect(
      `${name}: is accepted, naming only ${JSON.stringify(unsupported)} unsupported, and round-trips through JSON text`,
      () => acceptedAndRoundTripped(name, textItemBytes(body), unsupported),
    );
  }
});

describe("the verdict and the codec on shuffle and fixed", () => {
  it.effect(
    '[Q-2] a shuffled Choice with fixed="true" and unmarked choices: is accepted, naming nothing unsupported, and round-trips fixed through JSON text',
    () =>
      Effect.gen(function* shuffledRoundTrip() {
        const bytes = new TextEncoder().encode(
          '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="shuffled" title="Shuffled" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="true"><qti-simple-choice identifier="A">Ant</qti-simple-choice><qti-simple-choice identifier="B" fixed="true">Bee</qti-simple-choice><qti-simple-choice identifier="C">Cat</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>',
        );

        yield* acceptedAndRoundTripped("a shuffled Choice", bytes, []);

        const verdict = yield* open("items/shuffled.xml", bytes);
        const accepted = acceptedItem(verdict).pipe(
          Option.filter(() => verdict.verdict === "accepted"),
          Option.getOrElse(() => assert.fail(verdict.verdict)),
        );
        const text = JSON.stringify(Result.getOrThrow(encodeRedacted(redact(accepted))));

        assert.include(text, '"fixed":true,"identifier":"B"');
        assert.include(text, '"fixed":false,"identifier":"A"');
        assert.include(text, '"shuffle":true');
      }),
  );
});

describe("the verdict and the codec on Extended Text containers", () => {
  const documents = [
    ['max-strings="3"', []],
    ['max-strings="1000000000000"', []],
    ['min-strings="100" max-strings="200"', []],
    ['max-strings="0"', []],
    ['min-strings="101" max-strings="200"', ["min-strings>100"]],
    ['min-strings="1000000000000" max-strings="1000000000000"', ["min-strings>100"]],
    ['max-strings="5" min-strings="101"', ["min-strings>100"]],
  ] as const;

  for (const [counts, unsupported] of documents) {
    const name = `[Q-5] an ordered Extended Text with ${counts}`;

    it.effect(
      `${name}: is accepted, naming only ${JSON.stringify(unsupported)} unsupported, and round-trips through JSON text`,
      () =>
        acceptedAndRoundTripped(
          name,
          textItemBytes(
            `<qti-extended-text-interaction response-identifier="RESPONSE" ${counts}/>`,
            "ordered",
          ),
          unsupported,
        ),
    );
  }
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

/**
 * The path the printed variable built by hand in the printed-variable cases sits at; the JSON
 * form holds no path.
 */
const printedPath = "qti-assessment-item/qti-item-body/p/qti-printed-variable";

/**
 * A printed variable as the JSON form would write one if it held any; it holds none.
 */
interface PrintedVariableJson {
  readonly base: { readonly _tag: "literal"; readonly value: string };
  readonly delimiter: string;
  readonly identifier: string;
  readonly kind: "printed-variable";
  readonly mappingIndicator: string;
  readonly powerForm: boolean;
}

/**
 * A template block or inline as the JSON form would write one if it held any; it holds none.
 */
interface TemplateContentJson {
  readonly content: readonly BodyNodeJson[];
  readonly identifier: string;
  readonly kind: "template-block" | "template-inline";
  readonly templateVisibility: {
    readonly showHide: "hide" | "show";
    readonly templateIdentifier: string;
  };
}

/**
 * A body node the JSON form never holds, which decoding must refuse.
 */
type UnredactedJson = PrintedVariableJson | TemplateContentJson;

/**
 * A paragraph in the JSON form whose children may hold a printed variable or a template block or
 * inline.
 */
interface HoldingJson {
  readonly attributes: Extract<BodyNodeJson, { readonly kind: "element" }>["attributes"];
  readonly children: readonly (BodyNodeJson | UnredactedJson)[];
  readonly kind: "element";
  readonly tag: string;
}

/**
 * The JSON form with a body that may hold a printed variable or a template block or inline, at the
 * top or in a paragraph.
 */
type PrintingJson = Omit<RedactedJson, "body"> & {
  readonly body: readonly (BodyNodeJson | HoldingJson | UnredactedJson)[];
};

/**
 * A printed variable in the JSON form, which decoding must refuse.
 */
const printedJson: PrintedVariableJson = {
  base: { _tag: "literal", value: "10" },
  delimiter: ";",
  identifier: "SCORE",
  kind: "printed-variable",
  mappingIndicator: "=",
  powerForm: false,
};

/**
 * Put a node at the end of the choice item's JSON body, inside a paragraph or beside it.
 *
 * @param node The node.
 * @param nested Whether a paragraph holds it.
 * @returns The JSON form, the node added.
 */
const withNode = (node: BodyNodeJson | UnredactedJson, nested: boolean): PrintingJson => {
  const json = Result.getOrThrow(encodeRedacted(redact(acceptForTest(choiceItem))));

  return {
    ...json,
    body: [
      ...json.body,
      nested
        ? {
            attributes: [],
            children: [node],
            kind: "element",
            tag: "p",
          }
        : node,
    ],
  };
};

describe("the codec on a printed variable (OD-P8-14)", () => {
  for (const nested of [false, true]) {
    it.effect(
      `[I-5] decodeRedacted refuses a body that holds a printed variable${nested ? " inside a paragraph" : ""}: InvalidRedacted at stage decode, where its notice decodes`,
      () =>
        Effect.gen(function* refusesPrintedVariable() {
          const error = yield* failureOf(decodeRedacted(withNode(printedJson, nested)));
          const notice = decodeRedacted(
            withNode({ feature: "qti-printed-variable", kind: "unsupported" }, nested),
          );

          assert.strictEqual(error._tag, "InvalidRedacted");
          assert.strictEqual(error.stage, "decode");
          assert.isTrue(Result.isSuccess(notice));
        }),
    );
  }

  it.effect(
    "[I-5] encodeRedacted refuses a body built by hand that holds a printed variable: InvalidRedacted at stage encode",
    () =>
      Effect.gen(function* refusesPrintedVariableOut() {
        const node: PrintedVariable = {
          base: { _tag: "literal", value: 10n },
          delimiter: ";",
          field: Option.none(),
          format: Option.none(),
          identifier: "SCORE",
          index: Option.none(),
          kind: "printed-variable",
          mappingIndicator: "=",
          path: printedPath,
          powerForm: false,
        };
        const redacted = redact(acceptForTest(choiceItem));
        const error = yield* failureOf(
          encodeRedacted(brandRedacted({ ...redacted, body: [...redacted.body, node] })),
        );

        assert.strictEqual(error._tag, "InvalidRedacted");
        assert.strictEqual(error.stage, "encode");
      }),
  );
});

/**
 * The path each template block or inline built by hand in the template cases sits at; the JSON
 * form holds no path.
 */
const templatePath = (kind: TemplateContent["kind"]): string =>
  `qti-assessment-item/qti-item-body/p/qti-${kind}`;

describe("the codec on a template block or inline (OD-P8-14)", () => {
  for (const kind of ["template-block", "template-inline"] as const) {
    for (const nested of [false, true]) {
      it.effect(
        `[I-5] decodeRedacted refuses a body that holds a ${kind}${nested ? " inside a paragraph" : ""}: InvalidRedacted at stage decode, where its notice decodes`,
        () =>
          Effect.gen(function* refusesTemplateContent() {
            const error = yield* failureOf(
              decodeRedacted(
                withNode(
                  {
                    content: [{ kind: "text", text: "Shown by a template value" }],
                    identifier: "SHOWN",
                    kind,
                    templateVisibility: { showHide: "show", templateIdentifier: "VISIBLE" },
                  },
                  nested,
                ),
              ),
            );
            const notice = decodeRedacted(
              withNode({ feature: `qti-${kind}`, kind: "unsupported" }, nested),
            );

            assert.strictEqual(error._tag, "InvalidRedacted");
            assert.strictEqual(error.stage, "decode");
            assert.isTrue(Result.isSuccess(notice));
          }),
      );
    }

    it.effect(
      `[I-5] encodeRedacted refuses a body built by hand that holds a ${kind}: InvalidRedacted at stage encode`,
      () =>
        Effect.gen(function* refusesTemplateContentOut() {
          const node: TemplateContent = {
            content: [{ kind: "text", text: "Shown by a template value" }],
            identifier: "SHOWN",
            kind,
            path: templatePath(kind),
            responses: [],
            templateVisibility: { showHide: "show", templateIdentifier: "VISIBLE" },
          };
          const redacted = redact(acceptForTest(choiceItem));
          const error = yield* failureOf(
            encodeRedacted(brandRedacted({ ...redacted, body: [...redacted.body, node] })),
          );

          assert.strictEqual(error._tag, "InvalidRedacted");
          assert.strictEqual(error.stage, "encode");
        }),
    );
  }
});

/**
 * Review P2-6's shape, built by hand: two template blocks and a Choice whose second choice has a
 * template visibility, each shown when the template variable `VISIBLE` contains its identifier.
 */
const pathsBytes = new TextEncoder().encode(
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="paths" title="Paths" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-template-declaration identifier="VISIBLE" cardinality="multiple" base-type="identifier"/><qti-item-body><qti-template-block identifier="BLOCK1" template-identifier="VISIBLE" show-hide="show"><qti-content-body><p>Hidden block text</p></qti-content-body></qti-template-block><qti-template-block identifier="BLOCK2" template-identifier="VISIBLE" show-hide="show"><qti-content-body><p>Shown block text</p></qti-content-body></qti-template-block><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A"><span>Ant</span></qti-simple-choice><qti-simple-choice identifier="B" template-identifier="VISIBLE" show-hide="show"><span>Bee</span></qti-simple-choice><qti-simple-choice identifier="C"><span>Cat</span></qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>',
);

/**
 * The template values that show the second template block, `BLOCK2`, and hide the first block and
 * the Choice's second choice, `B`.
 */
const pathsRecord: RedactRecord = {
  attempt: "none",
  defaults: {},
  outcomes: {},
  templates: {
    VISIBLE: {
      baseType: "identifier",
      cardinality: "multiple",
      values: [{ baseType: "identifier", value: "BLOCK2" }],
    },
  },
};

/**
 * The paths item, opened and redacted by {@link pathsRecord}.
 */
const pathsRedacted = Effect.gen(function* pathsRedacted() {
  const verdict = yield* open("items/paths.xml", pathsBytes);
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`The paths item is ${verdict.verdict}, not accepted.`),
  );

  return redact(accepted, pathsRecord);
});

describe("the codec and source paths (review P2-6)", () => {
  it.effect(
    '[I-5] the JSON of a shown template block beside a hidden one and of a Choice whose second choice is hidden holds no "path" key, no qti-template-block and no qti-simple-choice[, where the redacted item keeps its paths',
    () =>
      Effect.gen(function* noPathInJson() {
        const redacted = yield* pathsRedacted;
        const text = JSON.stringify(Result.getOrThrow(encodeRedacted(redacted)));
        const kept = pathsOf(redacted.body);

        assert.isTrue(
          kept.some((path) => path.includes("/qti-template-block[2]/qti-content-body/")),
        );
        assert.isTrue(kept.some((path) => path.includes("/qti-simple-choice[3]/")));
        assert.notInclude(text, '"path"');
        assert.notInclude(text, "qti-template-block");
        assert.notInclude(text, "qti-simple-choice[");
      }),
  );

  it.effect(
    '[I-5] decoding the JSON gives every body node the path "", and so does decoding JSON that holds path keys, as JSON written before the change does',
    () =>
      Effect.gen(function* decodesEmptyPaths() {
        const redacted = yield* pathsRedacted;
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(
          JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
        );
        const decoded = Result.getOrThrow(decodeRedacted(handedOver));
        const placed = Result.getOrThrow(
          decodeRedacted({
            ...jsonOf(noticeItem),
            body: [
              {
                attributes: [],
                children: [{ kind: "text", text: "Find the capital." }],
                kind: "element",
                path: "qti-assessment-item/qti-item-body/p",
                tag: "p",
              },
              {
                feature: "qti-hotspot-interaction",
                kind: "unsupported",
                path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
              },
            ],
          }),
        );

        assert.isNotEmpty(pathsOf(decoded.body));
        assert.deepStrictEqual(new Set(pathsOf(decoded.body)), new Set([""]));
        assert.deepStrictEqual(placed.body, [
          {
            attributes: [],
            children: [{ kind: "text", text: "Find the capital." }],
            kind: "element",
            path: "",
            tag: "p",
          },
          { feature: "qti-hotspot-interaction", kind: "unsupported", path: "" },
        ]);
      }),
  );

  it.effect(
    '[I-5] the JSON round-trips through JSON text to the redacted item with every path "", which renders the same HTML',
    () =>
      Effect.gen(function* roundTripsPathless() {
        const redacted = yield* pathsRedacted;
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(
          JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
        );
        const decoded = Result.getOrThrow(decodeRedacted(handedOver));
        const configuration = yield* defaults;

        assert.deepStrictEqual(decoded, pathless(redacted));
        assert.strictEqual(
          Result.getOrThrow(render(decoded, configuration, { instance })).html,
          Result.getOrThrow(render(redacted, configuration, { instance })).html,
        );
      }),
  );
});

/**
 * An item with no template processing whose paragraph prints the string template variable `S`,
 * declared with a default of 1,000,001 characters, one past the bound a printed text keeps to.
 */
const lengthyBytes = new TextEncoder().encode(
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="lengthy" title="Lengthy" time-dependent="false"><qti-template-declaration identifier="S" cardinality="single" base-type="string"><qti-default-value><qti-value>${"y".repeat(1_000_001)}</qti-value></qti-default-value></qti-template-declaration><qti-item-body><p>Value: <qti-printed-variable identifier="S"/></p></qti-item-body></qti-assessment-item>`,
);

describe("the codec on a printed text past its bound", () => {
  it.effect(
    "[I-5] round-trips unprinted through JSON text, its bound and identifier kept and no path written, so render of the decoded item fails OutputTooLarge naming them",
    () =>
      Effect.gen(function* roundTripsUnprinted() {
        const verdict = yield* open("items/lengthy.xml", lengthyBytes);
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`The lengthy item is ${verdict.verdict}, not accepted.`),
        );
        const redacted = redact(accepted);
        const json = Result.getOrThrow(encodeRedacted(redacted));
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(JSON.stringify(json));
        const decoded = Result.getOrThrow(decodeRedacted(handedOver));
        const failed = render(decoded, yield* defaults, { instance });

        assert.deepStrictEqual(
          redacted.unprinted,
          Option.some({
            bound: 1_000_000,
            identifier: "S",
            limit: "text",
            path: "qti-assessment-item/qti-item-body/p/qti-printed-variable",
          }),
        );
        assert.deepStrictEqual(json.unprinted, {
          bound: 1_000_000,
          identifier: "S",
          limit: "text",
        });
        assert.deepStrictEqual(decoded, pathless(redacted));
        assert.deepStrictEqual(
          decoded.unprinted,
          Option.some({ bound: 1_000_000, identifier: "S", limit: "text", path: "" }),
        );
        assert.deepStrictEqual(
          Result.getFailure(failed).pipe(
            Option.map((failure) =>
              failure._tag === "OutputTooLarge" ? failure.printed : failure._tag,
            ),
          ),
          Option.some(Option.some({ bound: 1_000_000, identifier: "S", limit: "text" })),
        );
      }),
  );

  it("[I-5] writes no unprinted key for an item whose every text fits, and decodes its absence as none", () => {
    const redacted = redact(acceptForTest(choiceItem));
    const json = Result.getOrThrow(encodeRedacted(redacted));
    const decoded = Result.getOrThrow(decodeRedacted(json));

    assert.isTrue(Option.isNone(redacted.unprinted));
    assert.notProperty(json, "unprinted");
    assert.isTrue(Option.isNone(decoded.unprinted));
  });

  it.effect(
    "[I-5] refuses an unprinted bound that is not a whole number of at least 1: InvalidRedacted at stage decode",
    () =>
      Effect.gen(function* refusesBadBound() {
        const json = Result.getOrThrow(encodeRedacted(redact(acceptForTest(choiceItem))));

        for (const bound of [0, 1.5, "1000000"]) {
          const error = yield* failureOf(
            decodeRedacted({ ...json, unprinted: { bound, identifier: "S", limit: "text" } }),
          );

          assert.strictEqual(error.stage, "decode", String(bound));
        }

        assert.isTrue(
          Result.isSuccess(
            decodeRedacted({
              ...json,
              unprinted: { bound: 1_000_000, identifier: "S", limit: "text" },
            }),
          ),
        );
      }),
  );

  it.effect(
    "[I-5] round-trips which limit an unprinted text passed, the budget or the text, and refuses an unprinted without it or with another value: InvalidRedacted at stage decode",
    () =>
      Effect.gen(function* roundTripsWhichLimit() {
        const json = Result.getOrThrow(encodeRedacted(redact(acceptForTest(choiceItem))));

        for (const limit of ["budget", "text"] as const) {
          const unprinted = { bound: 1_000_000, identifier: "S", limit };
          const decoded = Result.getOrThrow(decodeRedacted({ ...json, unprinted }));

          assert.deepStrictEqual(decoded.unprinted, Option.some({ ...unprinted, path: "" }), limit);
          assert.deepStrictEqual(
            Result.getOrThrow(encodeRedacted(decoded)).unprinted,
            unprinted,
            limit,
          );
        }

        for (const unprinted of [
          { bound: 1_000_000, identifier: "S" },
          { bound: 1_000_000, identifier: "S", limit: "length" },
          { bound: 1_000_000, identifier: "S", limit: "Budget" },
          { bound: 1_000_000, identifier: "S", limit: 1 },
        ]) {
          const error = yield* failureOf(decodeRedacted({ ...json, unprinted }));

          assert.strictEqual(error.stage, "decode", JSON.stringify(unprinted));
        }
      }),
  );
});

/**
 * Opening the corpus (about 800 members) and redacting each templated item in three states runs in
 * seconds here; the bound leaves room for a slow machine without letting a hung run stall the
 * suite.
 */
const corpusTimeoutMs = 600_000;

describe("the codec on the templated corpus items", () => {
  it.effect(
    '[I-5] the JSON of each templated corpus item, redacted under two seeds and with no record, round-trips through JSON text to the equal Redacted with every path ""',
    () =>
      Effect.gen(function* templatedRoundTrip() {
        const members = yield* openCorpus;
        const swept = members.flatMap((member) =>
          Option.toArray(acceptedOf(member))
            .filter(templated)
            .map((accepted) => ({
              accepted,
              location: member.location,
            })),
        );
        const redactions = swept.flatMap(({ accepted, location }) =>
          Result.getOrThrow(recordStates(accepted)).map((state) => ({
            name: `${location} (${state.name})`,
            redacted: redact(accepted, Option.getOrUndefined(state.record)),
          })),
        );

        assert.isNotEmpty(swept, "no accepted corpus item has template processing");
        assert.lengthOf(redactions, swept.length * 3);
        for (const { name, redacted } of redactions) {
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
          const handedOver: unknown = JSON.parse(
            JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
          );

          assert.deepStrictEqual(
            Result.getOrThrow(decodeRedacted(handedOver)),
            pathless(redacted),
            name,
          );
        }
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );
});

describe("decodeRedacted on a deeply nested body", () => {
  for (const levels of [1000, 10_000]) {
    it.effect(
      `refuses a body nested ${String(levels)} levels: InvalidRedacted at stage decode, not a throw`,
      () =>
        Effect.gen(function* refusesDeepBody() {
          const error = yield* failureOf(decodeRedacted(nestedSpans(levels)));

          assert.strictEqual(error._tag, "InvalidRedacted");
          assert.strictEqual(error.stage, "decode");
        }),
    );
  }

  it.effect(
    "refuses one span past the bound, 511 spans nesting 1,025 levels, and decodes 510 spans nesting 1,023",
    () =>
      Effect.gen(function* boundsDepth() {
        const error = yield* failureOf(decodeRedacted(nestedSpans(511)));

        assert.strictEqual(error.stage, "decode");
        assert.include(error.issue, "more than 1024 levels deep");
        assert.isTrue(Result.isSuccess(decodeRedacted(nestedSpans(510))));
      }),
  );

  it.effect(
    "decodes the deepest body the reader lets an item nest: 254 divs under qti-item-body, 256 elements open at once",
    () =>
      Effect.gen(function* decodesDeepestItem() {
        const deepest: Verdict = yield* open("deep.xml", nestedDivs(254));
        const pastReader: Verdict = yield* open("deep.xml", nestedDivs(255));
        const accepted = acceptedItem(deepest).pipe(
          Option.filter(() => deepest.verdict === "accepted"),
          Option.getOrElse(() =>
            assert.fail(`The 254-deep item is ${deepest.verdict}, not accepted.`),
          ),
        );
        const redacted = redact(accepted);
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(
          JSON.stringify(Result.getOrThrow(encodeRedacted(redacted))),
        );

        assert.deepStrictEqual(
          pastReader.verdict === "refused"
            ? pastReader.refusals.map((refusal) => refusal.readerRule)
            : pastReader.verdict,
          [Option.some("element-depth")],
        );
        assert.deepStrictEqual(Result.getOrThrow(decodeRedacted(handedOver)), pathless(redacted));
      }),
  );
});

describe("decodeRedacted on a live object", () => {
  it.effect(
    "refuses an object whose fields, a body nested 10,000 spans among them, it inherits: InvalidRedacted at stage decode, not a throw",
    () =>
      Effect.gen(function* refusesInheritedBody() {
        const error = yield* failureOf(decodeRedacted(Object.create(nestedSpans(10_000))));

        assert.strictEqual(error._tag, "InvalidRedacted");
        assert.strictEqual(error.stage, "decode");
      }),
  );

  it.effect(
    "refuses an object whose body, nested 10,000 spans, is not enumerable: InvalidRedacted at stage decode, not a throw",
    () =>
      Effect.gen(function* refusesHiddenBody() {
        const { body, ...fields } = nestedSpans(10_000);
        const hidden = Object.defineProperty(fields, "body", { enumerable: false, value: body });
        const error = yield* failureOf(decodeRedacted(hidden));

        assert.strictEqual(error._tag, "InvalidRedacted");
        assert.strictEqual(error.stage, "decode");
      }),
  );

  it.effect(
    "refuses an object whose body is a getter that throws: InvalidRedacted at stage decode, not a throw",
    () =>
      Effect.gen(function* refusesThrowingGetter() {
        const { body: _body, ...fields } = nestedSpans(1);
        const throwing = Object.defineProperty(fields, "body", {
          enumerable: true,
          get: (): never => {
            throw new TypeError("the host's getter");
          },
        });
        const error = yield* failureOf(decodeRedacted(throwing));

        assert.strictEqual(error._tag, "InvalidRedacted");
        assert.strictEqual(error.stage, "decode");
        assert.include(error.issue, "the host's getter");
      }),
  );
});

describe("decodeRedacted on an interaction render cannot emit", () => {
  const choiceJson = jsonOf(choiceItem);
  const essayJson = jsonOf(essayItem);
  /**
   * Each edit of the JSON form that places the Text Entry where QTI's schema admits no
   * interaction, with the response of the interaction whose content holds it.
   */
  const misplaced: readonly (readonly [string, RedactedJson, string])[] = [
    [
      "a choice's content, two elements down",
      withFirstChoice([elementJson("p", [elementJson("span", [yearJson])])]),
      "RESPONSE",
    ],
    [
      "the Choice's Prompt",
      {
        ...choiceJson,
        body: choiceJson.body.map((node) =>
          node.kind === "choice"
            ? { ...node, prompt: [elementJson("p", [{ kind: "text", text: "In " }, yearJson])] }
            : node,
        ),
      },
      "RESPONSE",
    ],
    [
      "an Extended Text's Prompt",
      {
        ...essayJson,
        body: essayJson.body.map((node) =>
          node.kind === "extended-text"
            ? { ...node, prompt: [{ kind: "text", text: "Since " }, yearJson] }
            : node,
        ),
      },
      "ESSAY",
    ],
  ];

  for (const [place, json, owner] of misplaced) {
    it.effect(
      `refuses a Text Entry in ${place}: InvalidRedacted at stage decode naming it and its place`,
      () =>
        Effect.gen(function* refusesMisplacedInteraction() {
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the refusal on JSON text, the form a host sends.
          const handedOver: unknown = JSON.parse(JSON.stringify(json));
          const error = yield* failureOf(decodeRedacted(handedOver));

          assert.strictEqual(error._tag, "InvalidRedacted");
          assert.strictEqual(error.stage, "decode");
          assert.include(error.issue, "text-entry");
          assert.include(error.issue, '"YEAR"');
          assert.include(error.issue, JSON.stringify(owner));
        }),
    );
  }

  const inlineMisplaced: readonly (readonly [string, () => RedactedJson, string])[] = [
    [
      "a Choice in an Inline Choice's Label",
      () =>
        withInlineChoice((node) => ({
          ...node,
          label: [elementJson("span", jsonOf(choiceItem).body)],
        })),
      'choice interaction for the response "RESPONSE" sits inside the Label of the inline-choice interaction for the response "COLOUR"',
    ],
    [
      "a Choice in an Inline Choice's choice content",
      () =>
        withInlineChoice((node) => ({
          ...node,
          choices: node.choices.map((inline) =>
            inline.identifier === "GREEN"
              ? { ...inline, content: [elementJson("em", jsonOf(choiceItem).body)] }
              : inline,
          ),
        })),
      'choice interaction for the response "RESPONSE" sits inside the content of the choice "GREEN" of the inline-choice interaction for the response "COLOUR"',
    ],
    [
      "an Inline Choice in a Choice's choice content",
      () =>
        withFirstChoice(
          jsonOf(colourItem).body.flatMap((node) =>
            node.kind === "element"
              ? node.children.filter((child) => child.kind === "inline-choice")
              : [],
          ),
        ),
      'inline-choice interaction for the response "COLOUR" sits inside the content of the choice "TWO" of the choice interaction for the response "RESPONSE"',
    ],
  ];

  for (const [place, jsonFor, issue] of inlineMisplaced) {
    it.effect(
      `[Q-12] refuses ${place}: InvalidRedacted at stage decode naming it and its place, so render never meets it`,
      () =>
        Effect.gen(function* refusesInlineMisplaced() {
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the refusal on JSON text, the form a host sends.
          const handedOver: unknown = JSON.parse(JSON.stringify(jsonFor()));
          const error = yield* failureOf(decodeRedacted(handedOver));

          assert.strictEqual(error._tag, "InvalidRedacted");
          assert.strictEqual(error.stage, "decode");
          assert.include(error.issue, issue);
        }),
    );
  }

  it.effect("control: decodes the unedited Choice JSON, and render of it succeeds", () =>
    Effect.gen(function* decodesUnedited() {
      const configuration = yield* defaults;
      const decoded = Result.getOrThrow(decodeRedacted(choiceJson));

      assert.isTrue(Result.isSuccess(render(decoded, configuration, { instance })));
    }),
  );

  it.effect(
    "decodes a chain of 497 spans nesting 1,000 levels in a choice's content, and refuses it with a Text Entry in the innermost span",
    () =>
      Effect.gen(function* walksDeepContent() {
        const error = yield* failureOf(
          decodeRedacted(withFirstChoice([spanChain(497, [yearJson])])),
        );

        assert.isTrue(Result.isSuccess(decodeRedacted(withFirstChoice([spanChain(497, [])]))));
        assert.strictEqual(error.stage, "decode");
        assert.include(error.issue, '"YEAR"');
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
      modalFeedback: redacted.modalFeedback,
      notices: redacted.notices,
      responses: redacted.responses,
      title: redacted.title,
      unprinted: redacted.unprinted,
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
