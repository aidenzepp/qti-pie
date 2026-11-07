import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, text as sourceText } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
  PrintedVariable,
  ResponseDeclaration,
  SimpleChoice,
  TemplateContent,
  TemplateDeclaration,
  TemplateVisibility,
  TextEntryInteraction,
  Unsupported,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import {
  choiceOrder,
  hiddenOnlyResponses,
  identifyMessages,
  payload,
  postings,
  redactItem,
  templateShows,
} from "#plate/payload.ts";
import type {
  ChoicePayload,
  ExtendedTextPayload,
  InlineChoicePayload,
  InteractionPayload,
  Payload,
  PayloadNode,
  Posting,
  Redacted,
  TextEntryPayload,
  View,
} from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptForTest, acceptedItem, check } from "#plate/validate/verdict.ts";

/**
 * The strings only the hidden parts of {@link item} hold: its correct responses, a mapping key, a
 * response default, an outcome default and a value in its response processing. None appears in
 * its body.
 */
const markers = [
  "MarkerCorrectChoice",
  "MarkerCorrectText",
  "MarkerMapKey",
  "MarkerOutcomeDefault",
  "MarkerResponseDefault",
  "MarkerRuleValue",
] as const;

/**
 * The item instance every payload here is built for.
 */
const instance = "6f1c2e9a-0d4b-4f3e-9a51-3b7d2c8e1f40";

/**
 * Construct a single value.
 *
 * @param single The one value it holds.
 * @returns The value of `single`'s base type, of cardinality `single`.
 */
const one = (single: Value["values"][number]): Value => ({
  baseType: single.baseType,
  cardinality: "single",
  values: [single],
});

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const text = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * Construct a paragraph that carries an authored id, which an `aria-labelledby` can name.
 *
 * @param id The id.
 * @returns The paragraph, which holds the id as text.
 */
const idParagraph = (id: string): BodyNode => ({
  attributes: [{ name: "id", value: id }],
  children: [text(id)],
  kind: "element",
  path: `qti-assessment-item/qti-item-body/p[@id="${id}"]`,
  tag: "p",
});

/**
 * Construct a Text Entry with no authored name, bound to a single string response.
 *
 * @param response The response it binds.
 * @returns The interaction.
 */
const textEntry = (response: string): TextEntryInteraction => ({
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: `qti-assessment-item/qti-item-body/p[2]/qti-text-entry-interaction[${response}]`,
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response,
});

/**
 * A Choice with a Prompt, bound to `CAPITAL`, whose correct response and mapping key are markers.
 */
const choice: ChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  cardinality: "single",
  choices: [
    { content: [text("Paris")], fixed: false, identifier: "A", templateVisibility: Option.none() },
    { content: [text("Lyon")], fixed: false, identifier: "B", templateVisibility: Option.none() },
  ],
  class: "stacked",
  kind: "choice",
  maxChoices: 1n,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0n,
  orientation: Option.none(),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([text("Which city is the capital of France?")]),
  response: "CAPITAL",
  shuffle: false,
};

/**
 * A shuffled single Choice of five planets, bound to `PLANET`, whose third choice, `P2`, is fixed.
 */
const planets: ChoiceInteraction = {
  ...choice,
  choices: ["Mercury", "Venus", "Earth", "Mars", "Jupiter"].map((planet, index) => ({
    content: [text(planet)],
    fixed: index === 2,
    identifier: `P${String(index)}`,
    templateVisibility: Option.none(),
  })),
  prompt: Option.some([text("Which planet is the largest?")]),
  response: "PLANET",
  shuffle: true,
};

/**
 * An Extended Text named by its Prompt, bound to `ESSAY`.
 */
const essay: ExtendedTextInteraction = {
  ...textEntry("ESSAY"),
  cardinality: "single",
  expectedLines: Option.some(3n),
  format: "plain",
  kind: "extended-text",
  maxStrings: Option.none(),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  prompt: Option.some([text("Why is it the capital?")]),
};

/**
 * A hand-built item: a paragraph, a Choice, a paragraph holding two unnamed Text Entries and one
 * named by `aria-label`, an Extended Text with a Prompt, and an unsupported feedback block. Its
 * correct responses, mapping key, `NAMED` default, `FEEDBACK` default and processing value are
 * the {@link markers}.
 */
const item: Item = {
  body: [
    {
      attributes: [{ name: "class", value: "lead" }],
      children: [text("Answer each part.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p[1]",
      tag: "p",
    },
    choice,
    {
      attributes: [],
      children: [
        text("Two other cities: "),
        textEntry("FIRST"),
        text(" and "),
        textEntry("SECOND"),
        text(". A third: "),
        { ...textEntry("NAMED"), ariaLabel: Option.some("Third city") },
      ],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p[2]",
      tag: "p",
    },
    essay,
    {
      feature: "qti-feedback-block",
      kind: "unsupported",
      path: "qti-assessment-item/qti-item-body/qti-feedback-block",
    },
  ],
  document: "items/capitals.xml",
  identifier: "capitals",
  lang: Option.none(),
  outcomes: new Map([
    [
      "SCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "SCORE",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
    [
      "FEEDBACK",
      {
        baseType: "identifier",
        cardinality: "single",
        defaultValue: Option.some(one({ baseType: "identifier", value: "MarkerOutcomeDefault" })),
        identifier: "FEEDBACK",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
  ]),
  processing: Option.some([
    {
      branches: [
        {
          // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the item model fixes; it is an array, never a function.
          then: [
            {
              expression: {
                kind: "base-value",
                operands: [],
                value: one({ baseType: "float", value: 1 }),
              },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ],
          when: {
            kind: "match",
            operands: [
              {
                identifier: "CAPITAL",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              { identifier: "CAPITAL", kind: "correct", operands: [] },
            ],
          },
        },
      ],
      kind: "condition",
      otherwise: Option.some([
        {
          expression: {
            kind: "base-value",
            operands: [],
            value: one({ baseType: "identifier", value: "MarkerRuleValue" }),
          },
          identifier: "FEEDBACK",
          kind: "set-outcome",
        },
      ]),
    },
  ]),
  responses: new Map([
    [
      "CAPITAL",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some(one({ baseType: "identifier", value: "MarkerCorrectChoice" })),
        defaultValue: Option.none(),
        identifier: "CAPITAL",
        mapping: Option.some({
          defaultValue: 0,
          entries: [
            {
              caseSensitive: false,
              key: { baseType: "identifier", value: "MarkerMapKey" },
              value: 1,
            },
          ],
          lowerBound: Option.none(),
          upperBound: Option.none(),
        }),
      },
    ],
    [
      "FIRST",
      {
        areaMapping: Option.none(),
        baseType: "string",
        cardinality: "single",
        correct: Option.some(one({ baseType: "string", value: "MarkerCorrectText" })),
        defaultValue: Option.none(),
        identifier: "FIRST",
        mapping: Option.none(),
      },
    ],
    ...["SECOND", "NAMED", "ESSAY"].map(
      (identifier) =>
        [
          identifier,
          {
            areaMapping: Option.none(),
            baseType: "string",
            cardinality: "single",
            correct: Option.none(),
            defaultValue:
              identifier === "NAMED"
                ? Option.some(one({ baseType: "string", value: "MarkerResponseDefault" }))
                : Option.none(),
            identifier,
            mapping: Option.none(),
          },
        ] as const,
    ),
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Capitals",
  unsupported: [
    {
      feature: "qti-feedback-block",
      path: "qti-assessment-item/qti-item-body/qti-feedback-block",
      shown: "notice",
    },
  ],
};

/**
 * The item as the page may know it.
 */
const redacted = redactItem(item);

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
 * The values the author's flow holds for this instance: `CAPITAL` answered `A` and `FIRST`
 * answered `Marseille`.
 */
const held: ReadonlyMap<string, Value> = new Map([
  ["CAPITAL", one({ baseType: "identifier", value: "A" })],
  ["FIRST", one({ baseType: "string", value: "Marseille" })],
]);

/**
 * The view the author asks for after refusing what was posted: the posted strings, a message for
 * `SECOND` and two for `ESSAY`, beside the values held before the post.
 */
const refused: View = {
  ...answering,
  messages: [
    { response: "SECOND", text: "Enter a city." },
    { response: "ESSAY", text: "Write at least a sentence." },
    { response: "ESSAY", text: "Name the river." },
  ],
  posted: Option.some(
    new Map([
      ["CAPITAL", ["B"]],
      ["FIRST", ["Nice"]],
      ["SECOND", ["Lyon?"]],
    ]),
  ),
  values: held,
};

/**
 * The view the author asks for once every control is disabled: the held values, no messages, and
 * stale posted strings, which apply only beside messages.
 */
const finished: View = {
  ...answering,
  finished: true,
  posted: Option.some(new Map([["FIRST", ["Nice"]]])),
  values: held,
};

/**
 * Hand `payload` a full item, which its type refuses: the type test is the `@ts-expect-error`
 * below, which `tsc` fails on if the call ever type-checks. No test calls it.
 *
 * @returns What `payload` would make of the item.
 */
const payloadOfItem = (): Payload =>
  // @ts-expect-error -- an `Item` is not `Redacted`: only `redactItem` makes one, so the hidden parts never reach `payload`.
  payload(item, answering);

/**
 * Write a value as JSON, with every `Map` and `Set` written as its entries, so nothing it holds is
 * hidden from a search of the text, and every bigint, such as a count, as its decimal digits, which
 * plain `JSON.stringify` refuses to write.
 *
 * @param value The value.
 * @returns Its JSON text.
 */
const json = (value: Item | Payload | Redacted): string =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- `JSON.stringify` hands its replacer every value the payload holds, of any type; the replacer only looks for a bigint, a `Map` or a `Set` to write out.
  JSON.stringify(value, (_key, field: unknown) => {
    if (Predicate.isBigInt(field)) {
      return String(field);
    }

    return field instanceof Map || field instanceof Set ? [...field] : field;
  });

/**
 * Collect the interaction payloads of a body in document order, inside elements included.
 *
 * @param nodes The body.
 * @returns The interaction payloads.
 */
const interactionsIn = (nodes: readonly PayloadNode[]): readonly InteractionPayload[] =>
  nodes.flatMap((node) => {
    if (node.kind === "element") {
      return interactionsIn(node.children);
    }

    return node.kind === "text" || node.kind === "notice" ? [] : [node];
  });

/**
 * Find the interaction payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The interaction payload; the test fails when there is none.
 */
const interactionFor = (built: Payload, response: string): InteractionPayload => {
  const found = interactionsIn(built.body).find((interaction) => interaction.response === response);

  return found ?? assert.fail(`no interaction is bound to ${response}`);
};

/**
 * Find the Choice payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The Choice payload; the test fails when the interaction is not a Choice.
 */
const choiceFor = (built: Payload, response: string): ChoicePayload => {
  const found = interactionFor(built, response);

  return found.kind === "choice" ? found : assert.fail(`${response} is not a Choice`);
};

/**
 * Find the text control payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The Text Entry or Extended Text payload; the test fails when it is a Choice or an
 *   Inline Choice.
 */
const textFor = (built: Payload, response: string): ExtendedTextPayload | TextEntryPayload => {
  const found = interactionFor(built, response);

  switch (found.kind) {
    case "extended-text":
    case "text-entry": {
      return found;
    }
    case "choice": {
      return assert.fail(`${response} is a Choice`);
    }
    case "inline-choice": {
      return assert.fail(`${response} is an Inline Choice`);
    }
    default: {
      return found satisfies never;
    }
  }
};

/**
 * Give the identifiers of a Choice's choices in the order its payload presents them.
 *
 * @param interaction The Choice, the item's whole body.
 * @param view The view of the render.
 * @returns The identifiers, in presented order.
 */
const presentedOf = (interaction: ChoiceInteraction, view: View): readonly string[] =>
  choiceFor(
    payload(redactItem({ ...item, body: [interaction] }), view),
    interaction.response,
  ).choices.map((entry) => entry.identifier);

/**
 * Find the Extended Text payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The Extended Text payload; the test fails when the interaction is not an Extended Text.
 */
const extendedTextFor = (built: Payload, response: string): ExtendedTextPayload => {
  const found = interactionFor(built, response);

  return found.kind === "extended-text"
    ? found
    : assert.fail(`${response} is not an Extended Text`);
};

/**
 * Find the Inline Choice payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The Inline Choice payload; the test fails when the interaction is not an Inline Choice.
 */
const inlineChoiceFor = (built: Payload, response: string): InlineChoicePayload => {
  const found = interactionFor(built, response);

  return found.kind === "inline-choice"
    ? found
    : assert.fail(`${response} is not an Inline Choice`);
};

/**
 * An Inline Choice of two rivers with a Label, a placeholder and a too-few message, bound to the
 * single identifier response `RIVER`.
 */
const river: InlineChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  choices: [
    { content: [text("Seine")], fixed: false, identifier: "S", templateVisibility: Option.none() },
    { content: [text("Loire")], fixed: false, identifier: "L", templateVisibility: Option.none() },
  ],
  class: "pick",
  kind: "inline-choice",
  label: Option.some([text("River")]),
  messages: { min: Option.some("Pick a river.") },
  minChoices: 1n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.some("Choose one"),
  required: true,
  response: "RIVER",
  shuffle: false,
};

/**
 * An item whose one paragraph holds {@link river} in its sentence, redacted.
 */
const riverRedacted = redactItem({
  ...item,
  body: [
    {
      attributes: [],
      children: [text("Paris stands on the "), river, text(".")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  responses: new Map([
    [
      "RIVER",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "RIVER",
        mapping: Option.none(),
      },
    ],
  ]),
  unsupported: [],
});

/**
 * Find the Text Entry payload bound to a response.
 *
 * @param built The payload.
 * @param response The response identifier.
 * @returns The Text Entry payload; the test fails when the interaction is not a Text Entry.
 */
const textEntryFor = (built: Payload, response: string): TextEntryPayload => {
  const found = interactionFor(built, response);

  return found.kind === "text-entry" ? found : assert.fail(`${response} is not a Text Entry`);
};

/**
 * Construct an item whose body is one Extended Text bound to an ordered string response `LIST`,
 * with the counts given.
 *
 * @param maxStrings `max-strings`, none when absent.
 * @param minStrings `min-strings`.
 * @returns The item, redacted.
 */
const listOf = (maxStrings: Option.Option<bigint>, minStrings: bigint): Redacted =>
  redactItem({
    ...item,
    body: [
      {
        ...essay,
        cardinality: "ordered",
        maxStrings,
        minStrings,
        path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction[LIST]",
        response: "LIST",
      },
    ],
    responses: new Map([
      [
        "LIST",
        {
          areaMapping: Option.none(),
          baseType: "string",
          cardinality: "ordered",
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier: "LIST",
          mapping: Option.none(),
        },
      ],
    ]),
    unsupported: [],
  });

/**
 * Construct {@link item} with its Extended Text bound to an ordered list and stripped of its
 * Prompt, so the renderer names its Controls beside the two unnamed Text Entries.
 *
 * @param maxStrings `max-strings`, none when absent.
 * @param minStrings `min-strings`.
 * @returns The item, redacted.
 */
const unpromptedOf = (maxStrings: Option.Option<bigint>, minStrings: bigint): Redacted =>
  redactItem({
    ...item,
    body: item.body.map((node) =>
      node.kind === "extended-text"
        ? { ...node, cardinality: "ordered", maxStrings, minStrings, prompt: Option.none() }
        : node,
    ),
  });

/**
 * Give a body node of {@link item} the `aria-labelledby` `ids`: the Choice and the Extended Text,
 * and `NAMED` below a paragraph, which loses its `aria-label`. The Choice's first choice becomes
 * a paragraph `paris` and the Extended Text's Prompt a paragraph `why`.
 *
 * @param node The body node.
 * @param ids The `aria-labelledby` value.
 * @returns The node, changed.
 */
const referencingNode = (node: BodyNode, ids: string): BodyNode => {
  switch (node.kind) {
    case "choice": {
      return {
        ...node,
        ariaLabelledby: Option.some(ids),
        choices: node.choices.map((entry, index) =>
          index === 0 ? { ...entry, content: [idParagraph("paris")] } : entry,
        ),
      };
    }
    case "extended-text": {
      return {
        ...node,
        ariaLabelledby: Option.some(ids),
        prompt: Option.some([idParagraph("why")]),
      };
    }
    case "element": {
      return {
        ...node,
        children: node.children.map((child) =>
          child.kind === "text-entry" && child.response === "NAMED"
            ? { ...child, ariaLabel: Option.none(), ariaLabelledby: Option.some(ids) }
            : child,
        ),
      };
    }
    case "inline-choice":
    case "printed-variable":
    case "template-block":
    case "template-inline":
    case "text":
    case "text-entry":
    case "unsupported": {
      return node;
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Construct {@link item} after a paragraph `intro`, with the Choice, `NAMED` and the Extended Text
 * each given the `aria-labelledby` `ids` ({@link referencingNode}).
 *
 * @param ids The `aria-labelledby` value.
 * @returns The item, redacted.
 */
const referencing = (ids: string): Redacted =>
  redactItem({
    ...item,
    body: [idParagraph("intro"), ...item.body.map((node) => referencingNode(node, ids))],
  });

/**
 * Name the stages of a list, `stage 1` onwards.
 *
 * @param count How many.
 * @returns The names, in order.
 */
const stages = (count: number): readonly string[] =>
  Array.from({ length: count }, (_, index) => `stage ${String(index + 1)}`);

/**
 * Construct an ordered string value.
 *
 * @param members Its strings, in order.
 * @returns The value.
 */
const orderedOf = (members: readonly string[]): Value => ({
  baseType: "string",
  cardinality: "ordered",
  values: members.map((value) => ({ baseType: "string", value })),
});

describe("redactItem", () => {
  it("[Q-2] [Q-20] keeps no correct response, mapping key, default or rule value", () => {
    const written = json(redacted);

    for (const marker of markers) {
      assert.include(json(item), marker, `the item holds ${marker}`);
      assert.notInclude(written, marker, `the redacted item holds ${marker}`);
    }

    assert.include(written, "Which city is the capital of France?");
  });

  it("[I-1] copies only the fields it names, and each response's binding", () => {
    // TypeScript admits a wider object wherever an `Item` is expected, so a field the model gains,
    // or one a caller adds, reaches `redactItem` with no cast; it must not reach the output.
    const extra = "MarkerExtraField";
    const widened = {
      ...item,
      extra,
      responses: new Map(
        [...item.responses].map(([identifier, declaration]) => [
          identifier,
          { ...declaration, extra },
        ]),
      ),
    };
    const copied = redactItem(widened);

    assert.notInclude(json(copied), extra);
    assert.deepStrictEqual(Object.keys(copied).toSorted(), [
      "body",
      "document",
      "identifier",
      "lang",
      "notices",
      "responses",
      "title",
    ]);
    assert.deepStrictEqual(copied.responses, [
      { baseType: "identifier", cardinality: "single", identifier: "CAPITAL" },
      { baseType: "string", cardinality: "single", identifier: "FIRST" },
      { baseType: "string", cardinality: "single", identifier: "SECOND" },
      { baseType: "string", cardinality: "single", identifier: "NAMED" },
      { baseType: "string", cardinality: "single", identifier: "ESSAY" },
    ]);
    assert.deepStrictEqual(copied.notices, ["qti-feedback-block"]);
    assert.strictEqual(copied.document, "items/capitals.xml");
    assert.strictEqual(copied.identifier, "capitals");
  });
});

/**
 * A `javascript:` URL, which `check` drops from a link.
 */
// oxlint-disable-next-line eslint/no-script-url -- the value is test input check must drop, never a URL this code navigates to.
const scriptUrl = "javascript:alert(1)";

/**
 * The path of the item body, which every body path in the printed-variable cases starts with.
 */
const bodyPath = "qti-assessment-item/qti-item-body";

/**
 * Construct a printed variable at its attributes' defaults.
 *
 * @param identifier The variable it writes.
 * @param path Its path.
 * @returns The body node.
 */
const printed = (identifier: string, path: string): PrintedVariable => ({
  base: { _tag: "literal", value: 10n },
  delimiter: ";",
  field: Option.none(),
  format: Option.none(),
  identifier,
  index: Option.none(),
  kind: "printed-variable",
  mappingIndicator: "=",
  path,
  powerForm: false,
});

/**
 * Construct the notice a body part is shown as.
 *
 * @param feature The feature.
 * @param path The part's path.
 * @returns The body node.
 */
const noticeOf = (feature: string, path: string): Unsupported => ({
  feature,
  kind: "unsupported",
  path,
});

/**
 * The paths of the printed variables in {@link printing}, in document order: in a paragraph, in
 * the Choice's Prompt, in its second choice's content, and in a second paragraph.
 */
const printedPaths = [
  `${bodyPath}/p[1]/qti-printed-variable`,
  `${bodyPath}/qti-choice-interaction/qti-prompt/qti-printed-variable`,
  `${bodyPath}/qti-choice-interaction/qti-simple-choice[2]/qti-printed-variable`,
  `${bodyPath}/p[2]/qti-printed-variable`,
] as const;

/**
 * Construct the body of {@link printing} with each printed variable's place filled by a node.
 *
 * @param place The node for the printed variable at a path, given the variable's identifier.
 * @returns The body: a paragraph, a hotspot's notice, a Choice, a second paragraph and a feedback
 *   block's notice.
 */
const printingBody = (
  place: (identifier: string, path: string) => BodyNode,
): readonly BodyNode[] => [
  {
    attributes: [],
    children: [text("Score: "), place("SCORE", printedPaths[0])],
    kind: "element",
    path: `${bodyPath}/p[1]`,
    tag: "p",
  },
  noticeOf("qti-hotspot-interaction", `${bodyPath}/qti-hotspot-interaction`),
  {
    ...choice,
    choices: [
      {
        content: [text("Paris")],
        fixed: false,
        identifier: "A",
        templateVisibility: Option.none(),
      },
      {
        content: [text("Lyon, "), place("ROUND", printedPaths[2])],
        fixed: false,
        identifier: "B",
        templateVisibility: Option.none(),
      },
    ],
    prompt: Option.some([text("Round "), place("ROUND", printedPaths[1])]),
  },
  {
    attributes: [],
    children: [place("TOTAL", printedPaths[3])],
    kind: "element",
    path: `${bodyPath}/p[2]`,
    tag: "p",
  },
  noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
];

/**
 * An item that prints variables at four places among two notices and a mark, as the model holds
 * it: each printed variable a body node, and none among the unsupported features. Its template
 * processing runs, so with no record `redactItem` withholds every printed variable (H3).
 */
const printing: Item = {
  ...item,
  body: printingBody(printed),
  templateProcessing: Option.some([]),
  unsupported: [
    {
      feature: "qti-hotspot-interaction",
      path: `${bodyPath}/qti-hotspot-interaction`,
      shown: "notice",
    },
    { feature: "qti-feedback-block", path: `${bodyPath}/qti-feedback-block`, shown: "notice" },
    { feature: "xml:base", path: `${bodyPath}/p[2]`, shown: "mark" },
  ],
};

describe("redactItem on printed variables", () => {
  it("[I-5] withholds each printed variable of a templated item with no record behind its notice, named among the notices in document order: the redaction of the item holding each as that notice (H3)", () => {
    const asNotices: Item = {
      ...printing,
      body: printingBody((_, path) => noticeOf("qti-printed-variable", path)),
      unsupported: [
        { feature: "qti-printed-variable", path: printedPaths[0], shown: "notice" },
        ...printing.unsupported.slice(0, 1),
        ...printedPaths
          .slice(1)
          .map((path) => ({ feature: "qti-printed-variable", path, shown: "notice" as const })),
        ...printing.unsupported.slice(1),
      ],
    };
    const withheld = redactItem(printing);

    assert.deepStrictEqual(withheld, redactItem(asNotices));
    assert.deepStrictEqual(withheld.notices, [
      "qti-printed-variable",
      "qti-hotspot-interaction",
      "qti-printed-variable",
      "qti-printed-variable",
      "qti-printed-variable",
      "qti-feedback-block",
    ]);
  });

  it("[I-5] puts the notice of a printed variable the record holds no value of after the notice of a URL dropped from the link that holds it, in the order check lists them", () => {
    const verdict = check(
      doc(
        "item.xml",
        el(
          "qti-assessment-item",
          [
            attr("identifier", "printing"),
            attr("time-dependent", "false"),
            attr("title", "Printing"),
          ],
          [
            el("qti-outcome-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "SCORE"),
            ]),
            el(
              "qti-item-body",
              [],
              [
                el(
                  "p",
                  [],
                  [
                    el(
                      "a",
                      [attr("href", scriptUrl)],
                      [el("qti-printed-variable", [attr("identifier", "SCORE")])],
                    ),
                    sourceText("."),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
      tables,
    );
    const accepted = Option.getOrThrow(acceptedItem(verdict));
    const withheld = redact(accepted, { outcomes: {}, templates: {} });
    const link = `${bodyPath}/p/a`;

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "url-scheme:javascript", path: link, shown: "notice" },
    ]);
    assert.deepStrictEqual(withheld.notices, ["url-scheme:javascript", "qti-printed-variable"]);
    assert.deepStrictEqual(withheld.body, [
      {
        attributes: [],
        children: [
          {
            attributes: [],
            children: [noticeOf("qti-printed-variable", `${link}/qti-printed-variable`)],
            kind: "element",
            path: link,
            tag: "a",
          },
          noticeOf("url-scheme:javascript", link),
          text("."),
        ],
        kind: "element",
        path: `${bodyPath}/p`,
        tag: "p",
      },
    ]);
  });

  it("[I-5] copies a printed variable that reaches the payload by hand as its notice", () => {
    const handBuilt = payload(
      { ...redacted, body: [printed("SCORE", printedPaths[0])] },
      answering,
    );

    assert.deepStrictEqual(handBuilt.body, [{ feature: "qti-printed-variable", kind: "notice" }]);
  });
});

/**
 * Construct a single integer value.
 *
 * @param value The integer.
 * @returns The value.
 */
const integerValue = (value: bigint): Value => one({ baseType: "integer", value });

/**
 * Construct a single float value.
 *
 * @param value The float.
 * @returns The value.
 */
const floatValue = (value: number): Value => one({ baseType: "float", value });

/**
 * Construct an ordered integer value.
 *
 * @param values The integers, in order.
 * @returns The value.
 */
const orderedIntegers = (values: readonly bigint[]): Value => ({
  baseType: "integer",
  cardinality: "ordered",
  values: values.map((value) => ({ baseType: "integer", value })),
});

/**
 * Construct a template declaration, neither a parameter nor a math variable.
 *
 * @param identifier The variable's identifier.
 * @param declared Its declared default, which gives its base type and cardinality; NULL declares
 *   none.
 * @returns The declaration.
 */
const templateOf = (identifier: string, declared: Value): TemplateDeclaration => ({
  baseType: declared.baseType,
  cardinality: declared.cardinality,
  defaultValue: declared.values.length === 0 ? Option.none() : Option.some(declared),
  identifier,
  mathVariable: false,
  paramVariable: false,
});

/**
 * The paragraph every printed variable of {@link templated} sits in.
 */
const printingParagraph = `${bodyPath}/p`;

/**
 * Give the path of a printed variable of {@link templated}'s paragraph.
 *
 * @param n Its position among them, from 1.
 * @returns The path.
 */
const printedAt = (n: number): string => `${printingParagraph}/qti-printed-variable[${String(n)}]`;

/**
 * An item whose template processing runs, with one paragraph that prints, each after a label: `N`
 * in its default form, `SCORE` through `%.2f`, the `POS`-th member of `LIST`, `N` through `%i` in
 * the base `RADIX` holds, and `SCORE` in its default form; then a feedback block's notice. `N`
 * defaults to 3, `RADIX` to 16 and `LIST` to 10, 20, 30, and `POS` declares no default.
 */
const templated: Item = {
  ...item,
  body: [
    {
      attributes: [],
      children: [
        text("N "),
        printed("N", printedAt(1)),
        text(", score "),
        { ...printed("SCORE", printedAt(2)), format: Option.some("%.2f") },
        text(", member "),
        {
          ...printed("LIST", printedAt(3)),
          index: Option.some({ _tag: "ref", identifier: "POS" }),
        },
        text(", hex "),
        {
          ...printed("N", printedAt(4)),
          base: { _tag: "ref", identifier: "RADIX" },
          format: Option.some("%i"),
        },
        text(", raw "),
        printed("SCORE", printedAt(5)),
      ],
      kind: "element",
      path: printingParagraph,
      tag: "p",
    },
    noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
  ],
  templateProcessing: Option.some([]),
  templates: new Map(
    [
      templateOf("N", integerValue(3n)),
      templateOf("POS", nullOf("integer", "single")),
      templateOf("RADIX", integerValue(16n)),
      templateOf("LIST", orderedIntegers([10n, 20n, 30n])),
    ].map((declaration) => [declaration.identifier, declaration] as const),
  ),
  unsupported: [
    { feature: "qti-feedback-block", path: `${bodyPath}/qti-feedback-block`, shown: "notice" },
  ],
};

/**
 * {@link templated} without template processing, so with no record it reads as the record its
 * first attempt starts with: its declared values.
 */
const untemplated: Item = { ...templated, templateProcessing: Option.none() };

/**
 * The record of an attempt of {@link templated}: `N` 255, `POS` 2, `RADIX` 16, `LIST` 10, 20, 30,
 * and `SCORE` 2.675.
 */
const drawn: ItemRecord = {
  ...fresh(templated, instance),
  outcomes: { ...fresh(templated, instance).outcomes, SCORE: floatValue(2.675) },
  templates: {
    LIST: orderedIntegers([10n, 20n, 30n]),
    N: integerValue(255n),
    POS: integerValue(2n),
    RADIX: integerValue(16n),
  },
};

/**
 * Construct a text node of the body for each string.
 *
 * @param texts The texts.
 * @returns The nodes.
 */
const texts = (...values: readonly string[]): readonly BodyNode[] => values.map(text);

/**
 * Give the nodes of a redacted item's first body element, the printing paragraph.
 *
 * @param redaction The redacted item.
 * @returns The paragraph's children.
 */
const paragraphOf = (redaction: Redacted): readonly BodyNode[] => {
  const [first] = redaction.body;

  return first?.kind === "element"
    ? first.children
    : assert.fail("The body starts with no element.");
};

/**
 * The notice of the printed variable at a position of {@link templated}'s paragraph.
 *
 * @param n Its position, from 1.
 * @returns The notice node.
 */
const printedNoticeAt = (n: number): Unsupported => noticeOf("qti-printed-variable", printedAt(n));

describe("redactItem with a record", () => {
  it("[I-5] prints each printed variable from the record as text: a template value and an outcome value, through a format and in the default form, with an index and a base written as names read from the record", () => {
    const printedOut = redactItem(templated, drawn);

    assert.deepStrictEqual(
      paragraphOf(printedOut),
      texts("N ", "255", ", score ", "2.68", ", member ", "20", ", hex ", "ff", ", raw ", "2.675"),
    );
    assert.deepStrictEqual(printedOut.notices, ["qti-feedback-block"]);
  });

  it("[I-5] prints nothing for a NULL value", () => {
    const empty = redactItem(templated, {
      ...drawn,
      templates: { ...drawn.templates, N: nullOf("integer", "single") },
    });

    assert.deepStrictEqual(
      paragraphOf(empty),
      texts("N ", ", score ", "2.68", ", member ", "20", ", hex ", ", raw ", "2.675"),
    );
    assert.deepStrictEqual(empty.notices, ["qti-feedback-block"]);
  });

  it("[I-5] leaves the notice where the record holds no value of the variable, or of the name its base or index names", () => {
    const gaps = redactItem(templated, {
      ...drawn,
      templates: { N: integerValue(255n), POS: integerValue(2n) },
    });

    assert.deepStrictEqual(paragraphOf(gaps), [
      ...texts("N ", "255", ", score ", "2.68", ", member "),
      printedNoticeAt(3),
      text(", hex "),
      printedNoticeAt(4),
      ...texts(", raw ", "2.675"),
    ]);
    assert.deepStrictEqual(gaps.notices, [
      "qti-printed-variable",
      "qti-printed-variable",
      "qti-feedback-block",
    ]);
  });

  it("[I-5] reads only the record's own entries, never a name an object inherits", () => {
    const inherited = redactItem(
      { ...templated, body: [{ ...printed("constructor", printedAt(1)) }], unsupported: [] },
      drawn,
    );

    assert.deepStrictEqual(inherited.body, [printedNoticeAt(1)]);
  });

  it("[I-5] with no record, withholds every printed variable of an item whose template processing runs (H3)", () => {
    const withheld = redactItem(templated);

    assert.deepStrictEqual(paragraphOf(withheld), [
      text("N "),
      printedNoticeAt(1),
      text(", score "),
      printedNoticeAt(2),
      text(", member "),
      printedNoticeAt(3),
      text(", hex "),
      printedNoticeAt(4),
      text(", raw "),
      printedNoticeAt(5),
    ]);
  });

  it("[I-5] with no record, prints what an item without template processing starts with: each template variable at its declared default, each outcome at its starting value (H3)", () => {
    assert.deepStrictEqual(
      paragraphOf(redactItem(untemplated)),
      texts("N ", "3", ", score ", "0.00", ", member ", "10;20;30", ", hex ", "3", ", raw ", "0"),
    );
  });

  it("[I-5] with no record, prints no template value of an item whose template processing does not run, which leaves its notice (0.13 decision 15)", () => {
    const unrun: Item = {
      ...untemplated,
      unsupported: [
        {
          feature: "qti-template-processing",
          path: "qti-assessment-item/qti-template-processing",
          shown: "mark",
        },
        ...untemplated.unsupported,
      ],
    };

    assert.deepStrictEqual(paragraphOf(redactItem(unrun)), [
      text("N "),
      printedNoticeAt(1),
      ...texts(", score ", "0.00", ", member "),
      printedNoticeAt(3),
      text(", hex "),
      printedNoticeAt(4),
      ...texts(", raw ", "0"),
    ]);
  });

  it("[I-5] names the notices the record names, with the record and, for an item without template processing, without one; a templated item with no record names each printed variable it withholds besides (Mind amendment, H3)", () => {
    const started: ItemRecord = {
      ...fresh(untemplated, instance),
      templates: {
        LIST: orderedIntegers([10n, 20n, 30n]),
        N: integerValue(3n),
        POS: nullOf("integer", "single"),
        RADIX: integerValue(16n),
      },
    };

    assert.deepStrictEqual(redactItem(templated, drawn).notices, drawn.notices);
    assert.deepStrictEqual(redactItem(untemplated, started).notices, started.notices);
    assert.deepStrictEqual(redactItem(untemplated).notices, started.notices);
    assert.deepStrictEqual(redactItem(templated).notices, [
      ...Array.from({ length: 5 }, () => "qti-printed-variable"),
      ...drawn.notices,
    ]);
  });
});

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => one({ baseType: "identifier", value });

/**
 * Construct a multiple identifier value.
 *
 * @param values The identifiers, in order.
 * @returns The value.
 */
const multipleOf = (...values: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: values.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Construct the template visibility of a part `VISIBLE` controls.
 *
 * @param showHide Its `show-hide`.
 * @returns The visibility.
 */
const byVisible = (showHide: TemplateVisibility["showHide"]): TemplateVisibility => ({
  showHide,
  templateIdentifier: "VISIBLE",
});

/**
 * The path of the template block every template case holds, at the top of the body.
 */
const blockPath = `${bodyPath}/qti-template-block`;

/**
 * The path of the template inline every template case holds, inside a paragraph.
 */
const inlinePath = `${bodyPath}/p/qti-template-inline`;

/**
 * Construct a template block or inline.
 *
 * @param kind Which of the two it is.
 * @param visibility Its template visibility.
 * @param content Its content.
 * @param responses The responses its content binds, as `buildItem` reads them; none by default,
 *   for content that holds no interaction.
 * @returns The body node, with the identifier `X`, at {@link blockPath} or {@link inlinePath}.
 */
const templatePart = (
  kind: TemplateContent["kind"],
  visibility: TemplateVisibility,
  content: readonly BodyNode[],
  responses: readonly string[] = [],
): TemplateContent => ({
  content,
  identifier: "X",
  kind,
  path: kind === "template-block" ? blockPath : inlinePath,
  responses,
  templateVisibility: visibility,
});

/**
 * Construct the paragraph that holds the template inline, between two texts.
 *
 * @param inline What stands in the inline's place.
 * @returns The paragraph.
 */
const inlineParagraph = (...inline: readonly BodyNode[]): BodyNode => ({
  attributes: [],
  children: [text("before "), ...inline, text(" after")],
  kind: "element",
  path: `${bodyPath}/p`,
  tag: "p",
});

/**
 * Construct a choice of {@link visibleChoice}'s Choice.
 *
 * @param identifier Its identifier.
 * @param visibility Its template visibility, none for a choice always shown.
 * @returns The choice.
 */
const choiceShownBy = (
  identifier: string,
  visibility: Option.Option<TemplateVisibility>,
): SimpleChoice => ({
  content: [text(identifier)],
  fixed: false,
  identifier,
  templateVisibility: visibility,
});

/**
 * A Choice bound to `CAPITAL` whose choice `X` shows by `VISIBLE` (`show`), whose `Y` has no
 * template visibility, and whose `Z` hides by it (`hide`, so shown unless `VISIBLE` holds `Z`).
 */
const visibleChoice: ChoiceInteraction = {
  ...choice,
  choices: [
    choiceShownBy("X", Option.some(byVisible("show"))),
    choiceShownBy("Y", Option.none()),
    choiceShownBy("Z", Option.some(byVisible("hide"))),
  ],
};

/**
 * The template declaration of `VISIBLE`, a multiple identifier whose declared default holds `X`.
 */
const visibleDeclaration = templateOf("VISIBLE", multipleOf("X"));

/**
 * An item whose template processing runs, whose body holds a template block shown by `VISIBLE`
 * (`show`), a paragraph with a template inline hidden by it (`hide`), {@link visibleChoice}, and a
 * feedback block's notice.
 */
const visibility: Item = {
  ...item,
  body: [
    templatePart("template-block", byVisible("show"), [text("block")]),
    inlineParagraph(templatePart("template-inline", byVisible("hide"), [text("inline")])),
    visibleChoice,
    noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
  ],
  templateProcessing: Option.some([]),
  templates: new Map([["VISIBLE", visibleDeclaration]]),
  unsupported: [
    { feature: "qti-feedback-block", path: `${bodyPath}/qti-feedback-block`, shown: "notice" },
  ],
};

/**
 * Give the identifiers of the Choice of a redacted item, the first interaction its body holds.
 *
 * @param redaction The redacted item.
 * @returns The identifiers of its choices, in document order.
 */
const choicesShown = (redaction: Redacted): readonly string[] => {
  const found = redaction.body.find((node) => node.kind === "choice");

  return found?.kind === "choice"
    ? found.choices.map((entry) => entry.identifier)
    : assert.fail("The body holds no Choice.");
};

/**
 * The template values a record holds, with no outcome.
 *
 * @param templates The template values by identifier.
 * @returns The record's part `redact` reads.
 */
const holding = (templates: Readonly<Record<string, Value>>): RedactRecord => ({
  outcomes: {},
  templates,
});

/**
 * Give a choice of {@link planets} the template visibility `hide` by `VISIBLE` when it is `P1`.
 *
 * @param entry The choice.
 * @returns The choice, `P1` hidden whenever `VISIBLE` holds `P1`.
 */
const hidingP1 = (entry: SimpleChoice): SimpleChoice =>
  entry.identifier === "P1"
    ? { ...entry, templateVisibility: Option.some(byVisible("hide")) }
    : entry;

/**
 * A case of the visibility rule: the `show-hide`, the value `VISIBLE` holds and how a title says
 * it, and whether the part with the identifier `X` is shown.
 */
interface VisibilityCase {
  readonly holds: string;
  readonly shown: boolean;
  readonly showHide: TemplateVisibility["showHide"];
  readonly value: Value;
}

/**
 * The visibility rule over a single and a multiple variable, under `show` and `hide`, NULL
 * included.
 */
const visibilityCases: readonly VisibilityCase[] = [
  { holds: "the single X", showHide: "show", shown: true, value: identifierValue("X") },
  { holds: "the single Y", showHide: "show", shown: false, value: identifierValue("Y") },
  { holds: "the single X", showHide: "hide", shown: false, value: identifierValue("X") },
  { holds: "the single Y", showHide: "hide", shown: true, value: identifierValue("Y") },
  { holds: "W and X", showHide: "show", shown: true, value: multipleOf("W", "X") },
  { holds: "only W", showHide: "show", shown: false, value: multipleOf("W") },
  { holds: "W and X", showHide: "hide", shown: false, value: multipleOf("W", "X") },
  { holds: "only W", showHide: "hide", shown: true, value: multipleOf("W") },
  { holds: "NULL", showHide: "show", shown: false, value: nullOf("identifier", "single") },
  { holds: "NULL", showHide: "hide", shown: true, value: nullOf("identifier", "multiple") },
];

/**
 * Build an item whose template processing sets `T` and whose body holds a Choice with a `mailto:`
 * link in its prompt and in its first choice, then a template block, shown when `T` holds
 * `SECRET`, whose content holds a `javascript:` link. `check` lists the three links' notices in
 * document order, so with the prompt after the choices it lists the choice's link before the
 * prompt's, where `redactItem`'s walk reaches the prompt first.
 *
 * @param promptLast Whether the prompt follows the choices.
 * @returns The item's document.
 */
const linkedItem = (promptLast: boolean): SourceDocument => {
  const prompt = el(
    "qti-prompt",
    [],
    [el("a", [attr("href", "mailto:prompt@example.com")], [sourceText("prompt link")])],
  );
  const choices = [
    el(
      "qti-simple-choice",
      [attr("identifier", "A")],
      [el("a", [attr("href", "mailto:choice@example.com")], [sourceText("choice link")])],
    ),
    el("qti-simple-choice", [attr("identifier", "B")], [sourceText("Bee")]),
  ];

  return doc(
    "item.xml",
    el(
      "qti-assessment-item",
      [attr("identifier", "linked"), attr("time-dependent", "false"), attr("title", "Linked")],
      [
        el("qti-response-declaration", [
          attr("base-type", "identifier"),
          attr("cardinality", "single"),
          attr("identifier", "RESPONSE"),
        ]),
        el("qti-template-declaration", [
          attr("base-type", "identifier"),
          attr("cardinality", "single"),
          attr("identifier", "T"),
        ]),
        el(
          "qti-template-processing",
          [],
          [
            el(
              "qti-set-template-value",
              [attr("identifier", "T")],
              [el("qti-base-value", [attr("base-type", "identifier")], [sourceText("SECRET")])],
            ),
          ],
        ),
        el(
          "qti-item-body",
          [],
          [
            el(
              "qti-choice-interaction",
              [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
              promptLast ? [...choices, prompt] : [prompt, ...choices],
            ),
            el(
              "qti-template-block",
              [
                attr("identifier", "SECRET"),
                attr("show-hide", "show"),
                attr("template-identifier", "T"),
              ],
              [
                el(
                  "qti-content-body",
                  [],
                  [el("p", [], [el("a", [attr("href", scriptUrl)], [sourceText("hidden link")])])],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  );
};

describe("redactItem on template blocks, inlines and choices", () => {
  it.effect(
    "[I-5] copies a choice its template value shows with no template visibility, and the JSON of the redacted item holds no template-identifier, show-hide or template value (R5)",
    () =>
      Effect.gen(function* copiesShownChoice() {
        const accepted = yield* Effect.fromOption(
          acceptedItem(
            check(
              doc(
                "item.xml",
                el(
                  "qti-assessment-item",
                  [
                    attr("identifier", "visibility"),
                    attr("time-dependent", "false"),
                    attr("title", "Visibility"),
                  ],
                  [
                    el("qti-response-declaration", [
                      attr("base-type", "identifier"),
                      attr("cardinality", "single"),
                      attr("identifier", "RESPONSE"),
                    ]),
                    el("qti-template-declaration", [
                      attr("base-type", "identifier"),
                      attr("cardinality", "multiple"),
                      attr("identifier", "VISIBLE"),
                    ]),
                    el(
                      "qti-item-body",
                      [],
                      [
                        el(
                          "qti-choice-interaction",
                          [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
                          [
                            el(
                              "qti-simple-choice",
                              [
                                attr("identifier", "A"),
                                attr("show-hide", "show"),
                                attr("template-identifier", "VISIBLE"),
                              ],
                              [sourceText("Ant")],
                            ),
                            el("qti-simple-choice", [attr("identifier", "B")], [sourceText("Bee")]),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              tables,
            ),
          ),
        );
        const shown = redact(accepted, holding({ VISIBLE: multipleOf("A", "MarkerTemplate") }));
        const [interaction] = shown.body;
        const written = JSON.stringify(Result.getOrThrow(encodeRedacted(shown)));

        assert.deepStrictEqual(interaction?.kind === "choice" ? interaction.choices : [], [
          {
            content: [text("Ant")],
            fixed: false,
            identifier: "A",
            templateVisibility: Option.none(),
          },
          {
            content: [text("Bee")],
            fixed: false,
            identifier: "B",
            templateVisibility: Option.none(),
          },
        ]);
        for (const hidden of [
          "templateVisibility",
          "templateIdentifier",
          "template-identifier",
          "showHide",
          "show-hide",
          "VISIBLE",
          "MarkerTemplate",
        ]) {
          assert.notInclude(written, hidden);
        }
      }),
  );

  for (const { holds, shown, showHide, value } of visibilityCases) {
    it(`[I-5] under ${showHide}, with VISIBLE ${holds}, ${shown ? "shows" : "hides"} a template block's and a template inline's content: its content in its place, or nothing`, () => {
      const parts: Item = {
        ...visibility,
        body: [
          templatePart("template-block", byVisible(showHide), [text("block")]),
          inlineParagraph(templatePart("template-inline", byVisible(showHide), [text("inline")])),
        ],
        unsupported: [],
      };
      const record = holding({ VISIBLE: value });
      const redaction = redactItem(parts, record);

      assert.strictEqual(templateShows(byVisible(showHide), "X", record.templates), shown);
      assert.deepStrictEqual(
        redaction.body,
        shown ? [text("block"), inlineParagraph(text("inline"))] : [inlineParagraph()],
      );
      assert.deepStrictEqual(redaction.notices, []);
    });
  }

  it("[I-5] shows a choice by its template value, keeps one with no template visibility, and leaves out one its value hides", () => {
    assert.deepStrictEqual(
      choicesShown(redactItem(visibility, holding({ VISIBLE: multipleOf("X") }))),
      ["X", "Y", "Z"],
    );
    assert.deepStrictEqual(
      choicesShown(redactItem(visibility, holding({ VISIBLE: multipleOf("X", "Z") }))),
      ["X", "Y"],
    );
    assert.deepStrictEqual(
      choicesShown(redactItem(visibility, holding({ VISIBLE: multipleOf("Z") }))),
      ["Y"],
    );
    assert.deepStrictEqual(
      choicesShown(redactItem(visibility, holding({ VISIBLE: multipleOf("W") }))),
      ["Y", "Z"],
    );
  });

  it("[I-5] presents a shuffled Choice with a template-hidden choice in choiceOrder's order over the choices shown, under the same key (R6)", () => {
    const shuffled: Item = {
      ...visibility,
      body: [{ ...planets, choices: planets.choices.map(hidingP1) }],
      unsupported: [],
    };
    const redaction = redactItem(shuffled, holding({ VISIBLE: identifierValue("P1") }));
    const remaining = planets.choices.filter((entry) => entry.identifier !== "P1");

    for (const seed of [Option.some("7"), Option.none<string>()]) {
      const view: View = Option.match(seed, {
        onNone: () => answering,
        onSome: (given) => ({ ...answering, seed: given }),
      });
      const presented = choiceFor(payload(redaction, view), "PLANET").choices.map(
        (entry) => entry.identifier,
      );

      assert.deepStrictEqual(
        presented,
        choiceOrder({ ...planets, choices: remaining }, seed, instance),
      );
      assert.sameMembers([...presented], ["P0", "P2", "P3", "P4"]);
    }
  });

  it("[I-5] with no record, withholds a templated item's template block and inline behind their notices and leaves out each choice with a template visibility, naming template-identifier once; the redacted item still encodes (H3)", () => {
    const withheld = redactItem(visibility);

    assert.deepStrictEqual(withheld.body, [
      noticeOf("qti-template-block", blockPath),
      inlineParagraph(noticeOf("qti-template-inline", inlinePath)),
      { ...visibleChoice, choices: [choiceShownBy("Y", Option.none())] },
      noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
    ]);
    assert.deepStrictEqual(withheld.notices, [
      "qti-template-block",
      "qti-template-inline",
      "template-identifier",
      "qti-feedback-block",
    ]);
    assert.isTrue(Result.isSuccess(encodeRedacted(withheld)));
  });

  it("[I-5] withholds a template block, inline or choice whose template variable the record holds no value of, as with no record (0.13 decision 15)", () => {
    assert.deepStrictEqual(redactItem(visibility, holding({})), redactItem(visibility));
    assert.deepStrictEqual(
      redactItem(visibility, holding({ OTHER: multipleOf("X") })),
      redactItem(visibility),
    );
  });

  it("[I-5] with no record, shows an item without template processing by its declared defaults, the values its first record holds (H3)", () => {
    const untemplatedParts: Item = { ...visibility, templateProcessing: Option.none() };
    const started = redactItem(untemplatedParts);

    assert.deepStrictEqual(
      started,
      redactItem(untemplatedParts, holding({ VISIBLE: multipleOf("X") })),
    );
    assert.deepStrictEqual(started.body, [
      text("block"),
      inlineParagraph(),
      {
        ...visibleChoice,
        choices: [
          choiceShownBy("X", Option.none()),
          choiceShownBy("Y", Option.none()),
          choiceShownBy("Z", Option.none()),
        ],
      },
      noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
    ]);
    assert.deepStrictEqual(started.notices, ["qti-feedback-block"]);
  });

  it("[I-5] names the notices of a template block's content only where its template value shows it", () => {
    const hotspot = `${blockPath}/qti-content-body/qti-hotspot-interaction`;
    const holdingNotice: Item = {
      ...visibility,
      body: [
        templatePart("template-block", byVisible("show"), [
          noticeOf("qti-hotspot-interaction", hotspot),
        ]),
        noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
      ],
      unsupported: [
        { feature: "qti-hotspot-interaction", path: hotspot, shown: "notice" },
        ...visibility.unsupported,
      ],
    };
    const shown = redactItem(holdingNotice, holding({ VISIBLE: multipleOf("X") }));
    const hidden = redactItem(holdingNotice, holding({ VISIBLE: multipleOf("W") }));

    assert.deepStrictEqual(shown.notices, ["qti-hotspot-interaction", "qti-feedback-block"]);
    assert.deepStrictEqual(shown.body, [
      noticeOf("qti-hotspot-interaction", hotspot),
      noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
    ]);
    assert.deepStrictEqual(hidden.notices, ["qti-feedback-block"]);
    assert.deepStrictEqual(hidden.body, [
      noticeOf("qti-feedback-block", `${bodyPath}/qti-feedback-block`),
    ]);
  });

  for (const promptLast of [true, false]) {
    it(`[I-5] names no notice from inside a template block the page does not see, whatever the order check lists it in, and the rest in document order, with the Choice's prompt ${promptLast ? "after" : "before"} its choices`, () => {
      const accepted = Option.getOrThrow(acceptedItem(check(linkedItem(promptLast), tables)));
      const choiceLink = `${bodyPath}/qti-choice-interaction/qti-simple-choice[1]/a`;
      const promptLink = `${bodyPath}/qti-choice-interaction/qti-prompt/a`;
      const mailto = "url-scheme:mailto";

      assert.deepStrictEqual(
        accepted.unsupported.filter((entry) => entry.shown === "notice").map((entry) => entry.path),
        [
          ...(promptLast ? [choiceLink, promptLink] : [promptLink, choiceLink]),
          `${bodyPath}/qti-template-block/qti-content-body/p/a`,
        ],
      );
      assert.deepStrictEqual(redact(accepted, holding({ T: identifierValue("OTHER") })).notices, [
        mailto,
        mailto,
      ]);
      assert.deepStrictEqual(redact(accepted, holding({ T: identifierValue("SECRET") })).notices, [
        mailto,
        mailto,
        "url-scheme:javascript",
      ]);
      assert.deepStrictEqual(redact(accepted).notices, [mailto, mailto, "qti-template-block"]);
    });
  }

  it("[I-5] gives no posting for the response of an interaction a hidden template block holds", () => {
    const holdingEntry: Item = {
      ...visibility,
      body: [templatePart("template-block", byVisible("show"), [textEntry("FIRST")], ["FIRST"])],
      unsupported: [],
    };
    const postedOf = (value: Value): readonly string[] =>
      postings(redactItem(holdingEntry, holding({ VISIBLE: value })), instance).map(
        (posting) => posting.identifier,
      );

    assert.deepStrictEqual(postedOf(multipleOf("X")), ["FIRST"]);
    assert.deepStrictEqual(postedOf(multipleOf("W")), []);
  });

  it("[I-5] copies a template block or inline that reaches the payload by hand as its notice", () => {
    const handBuilt = payload(
      {
        ...redacted,
        body: [
          templatePart("template-block", byVisible("show"), [text("block")]),
          templatePart("template-inline", byVisible("hide"), [text("inline")]),
        ],
      },
      answering,
    );

    assert.deepStrictEqual(handBuilt.body, [
      { feature: "qti-template-block", kind: "notice" },
      { feature: "qti-template-inline", kind: "notice" },
    ]);
  });
});

/**
 * Build a template block of `T`, shown when `T` holds its identifier, whose content holds a Text
 * Entry bound to the response given.
 *
 * @param identifier The block's identifier.
 * @param response The response its Text Entry binds.
 * @returns The block's source element.
 */
const answeringBlock = (identifier: string, response: string): SourceElement =>
  el(
    "qti-template-block",
    [attr("identifier", identifier), attr("show-hide", "show"), attr("template-identifier", "T")],
    [
      el(
        "qti-content-body",
        [],
        [el("p", [], [el("qti-text-entry-interaction", [attr("response-identifier", response)])])],
      ),
    ],
  );

/**
 * An item whose body holds two template blocks of `T`: `A`, whose Text Entry binds the string
 * response `SHOWN_ANSWER`, and `B`, whose Text Entry binds the float response `HIDDEN_ANSWER`.
 */
const blockAnswers: SourceDocument = doc(
  "item.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "answers"), attr("time-dependent", "false"), attr("title", "Answers")],
    [
      el("qti-response-declaration", [
        attr("base-type", "string"),
        attr("cardinality", "single"),
        attr("identifier", "SHOWN_ANSWER"),
      ]),
      el("qti-response-declaration", [
        attr("base-type", "float"),
        attr("cardinality", "single"),
        attr("identifier", "HIDDEN_ANSWER"),
      ]),
      el("qti-template-declaration", [
        attr("base-type", "identifier"),
        attr("cardinality", "single"),
        attr("identifier", "T"),
      ]),
      el(
        "qti-item-body",
        [],
        [answeringBlock("A", "SHOWN_ANSWER"), answeringBlock("B", "HIDDEN_ANSWER")],
      ),
    ],
  ),
);

/**
 * Construct the declaration of a single string response with no correct response, mapping or
 * default.
 *
 * @param identifier The response's identifier.
 * @returns The declaration.
 */
const declaredString = (identifier: string): ResponseDeclaration => ({
  areaMapping: Option.none(),
  baseType: "string",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier,
  mapping: Option.none(),
});

/**
 * Build an item whose template processing runs, with `VISIBLE` its template variable, the body
 * given, a single string response declared for each identifier given, in that order, and each
 * notice given listed among its notice-shown features.
 *
 * @param body The body.
 * @param responses The identifiers of the responses it declares.
 * @param notices The notice nodes its body holds.
 * @returns The item.
 */
const bindingOf = (
  body: readonly BodyNode[],
  responses: readonly string[],
  notices: readonly Unsupported[] = [],
): Item => ({
  ...visibility,
  body,
  responses: new Map(responses.map((identifier) => [identifier, declaredString(identifier)])),
  unsupported: notices.map(({ feature, path }): UnsupportedFeature => ({
    feature,
    path,
    shown: "notice",
  })),
});

/**
 * Give the identifiers of a redacted item's responses.
 *
 * @param redaction The redacted item.
 * @returns The identifiers, in the order of its `responses`.
 */
const respondedTo = (redaction: Redacted): readonly string[] =>
  redaction.responses.map((binding) => binding.identifier);

describe("redactItem on responses only hidden content binds", () => {
  it("[I-5] lists no response only a template block the record hides binds, in the redacted item or its JSON, and names that response as hidden-only", () => {
    const accepted = Option.getOrThrow(acceptedItem(check(blockAnswers, tables)));
    const showingA = holding({ T: identifierValue("A") });
    const shown = redact(accepted, showingA);

    assert.deepStrictEqual(shown.responses, [
      { baseType: "string", cardinality: "single", identifier: "SHOWN_ANSWER" },
    ]);
    assert.deepStrictEqual(
      Result.getOrThrow(encodeRedacted(shown)).responses.map((binding) => binding.identifier),
      ["SHOWN_ANSWER"],
    );
    assert.deepStrictEqual([...hiddenOnlyResponses(accepted.item, showingA)], ["HIDDEN_ANSWER"]);
    assert.deepStrictEqual(
      postings(shown, instance).map((posting) => posting.identifier),
      ["SHOWN_ANSWER"],
    );

    const showingB = holding({ T: identifierValue("B") });

    assert.deepStrictEqual(respondedTo(redact(accepted, showingB)), ["HIDDEN_ANSWER"]);
    assert.deepStrictEqual([...hiddenOnlyResponses(accepted.item, showingB)], ["SHOWN_ANSWER"]);
  });

  it("[I-5] counts a notice's response as hidden-only inside a template block the record hides, and passes it through inside one it shows", () => {
    const order = noticeOf(
      "qti-order-interaction",
      `${blockPath}/qti-content-body/qti-order-interaction`,
    );
    const holdingOrder = bindingOf(
      [templatePart("template-block", byVisible("show"), [order], ["R2"])],
      ["R2"],
      [order],
    );
    const hiding = holding({ VISIBLE: multipleOf("W") });
    const showing = holding({ VISIBLE: multipleOf("X") });

    assert.deepStrictEqual([...hiddenOnlyResponses(holdingOrder, hiding)], ["R2"]);
    assert.deepStrictEqual(respondedTo(redactItem(holdingOrder, hiding)), []);
    assert.deepStrictEqual([...hiddenOnlyResponses(holdingOrder, showing)], []);
    assert.deepStrictEqual(respondedTo(redactItem(holdingOrder, showing)), ["R2"]);
  });

  it("[I-5] passes through the response of a notice outside any template block, with a record and without one", () => {
    const order = noticeOf("qti-order-interaction", `${bodyPath}/qti-order-interaction`);
    const loose = bindingOf([order], ["R2"], [order]);

    for (const record of [holding({ VISIBLE: multipleOf("W") }), undefined]) {
      assert.deepStrictEqual([...hiddenOnlyResponses(loose, record)], []);
      assert.deepStrictEqual(respondedTo(redactItem(loose, record)), ["R2"]);
    }
  });

  it("[I-5] keeps a response a Choice in a hidden template block binds when a Text Entry the page sees binds it too", () => {
    const twice = bindingOf(
      [
        templatePart("template-block", byVisible("show"), [{ ...choice, response: "R1" }], ["R1"]),
        textEntry("R1"),
      ],
      ["R1"],
    );

    for (const record of [holding({ VISIBLE: multipleOf("W") }), undefined]) {
      assert.deepStrictEqual([...hiddenOnlyResponses(twice, record)], []);
      assert.deepStrictEqual(respondedTo(redactItem(twice, record)), ["R1"]);
    }
  });

  it("[I-5] with no record, names as hidden-only each response of an item whose template processing runs that only a template block or inline binds, and keeps one no interaction binds (H3)", () => {
    const inside = bindingOf(
      [
        templatePart("template-block", byVisible("show"), [textEntry("R1")], ["R1"]),
        inlineParagraph(
          templatePart("template-inline", byVisible("hide"), [textEntry("R3")], ["R3"]),
        ),
        textEntry("R2"),
      ],
      ["R1", "R2", "R3", "R4"],
    );

    assert.deepStrictEqual([...hiddenOnlyResponses(inside)], ["R1", "R3"]);
    assert.deepStrictEqual(respondedTo(redactItem(inside)), ["R2", "R4"]);
  });
});

describe("payload", () => {
  it("[Q-2] [Q-20] [Q-5] holds no correct response, mapping key, default or rule value in any view", () => {
    const views: readonly (readonly [string, View])[] = [
      ["no messages", answering],
      ["messages and posted text", refused],
      ["finished", finished],
      ["review", { ...answering, mode: "review", values: held }],
      ["solution without values", { ...answering, mode: "solution" }],
    ];

    for (const [state, view] of views) {
      const written = json(payload(redacted, view));

      assert.include(written, "Which city is the capital of France?", state);
      for (const marker of markers) {
        assert.notInclude(written, marker, `${state} holds ${marker}`);
      }
    }
  });

  it("[Q-12] gives an Inline Choice exactly its thirteen keys, and restores the posted string with messages, else the value", () => {
    const opened = inlineChoiceFor(payload(riverRedacted, answering), "RIVER");

    assert.deepStrictEqual(Object.keys(opened).toSorted(), [
      "autofocus",
      "choices",
      "class",
      "editable",
      "formName",
      "invalid",
      "kind",
      "label",
      "messageIds",
      "name",
      "placeholder",
      "response",
      "restore",
    ]);
    assert.deepStrictEqual(opened.choices, [
      { content: [{ kind: "text", text: "Seine" }], identifier: "S" },
      { content: [{ kind: "text", text: "Loire" }], identifier: "L" },
    ]);
    assert.deepStrictEqual(opened.label, Option.some([{ kind: "text", text: "River" }]));
    assert.deepStrictEqual(opened.placeholder, Option.some("Choose one"));
    assert.strictEqual(opened.formName, entryName(instance, "RIVER"));
    assert.strictEqual(opened.restore, "");

    const valued: View = {
      ...answering,
      posted: Option.some(new Map([["RIVER", ["L"]]])),
      values: new Map([["RIVER", one({ baseType: "identifier", value: "S" })]]),
    };
    assert.strictEqual(inlineChoiceFor(payload(riverRedacted, valued), "RIVER").restore, "S");

    const refusedRiver = inlineChoiceFor(
      payload(riverRedacted, {
        ...valued,
        messages: [{ response: "RIVER", text: "Pick a river." }],
      }),
      "RIVER",
    );
    assert.strictEqual(refusedRiver.restore, "L");
    assert.deepStrictEqual(
      [refusedRiver.invalid, refusedRiver.autofocus, refusedRiver.messageIds],
      [true, true, [`${instance}-RIVER-message-0`]],
    );
  });

  it("refuses a full item in its type", () => {
    assert.isFunction(payloadOfItem);
  });

  it("[I-7] keeps the body's elements and text, and shows an unsupported part as its notice", () => {
    const built = payload(redacted, answering);

    assert.deepStrictEqual(built.body[0], {
      attributes: [{ name: "class", value: "lead" }],
      children: [{ kind: "text", text: "Answer each part." }],
      kind: "element",
      tag: "p",
    });
    assert.deepStrictEqual(built.body.at(-1), { feature: "qti-feedback-block", kind: "notice" });
    assert.deepStrictEqual(built.notices, ["qti-feedback-block"]);
    assert.deepStrictEqual(
      interactionsIn(built.body).map((interaction) => interaction.response),
      ["CAPITAL", "FIRST", "SECOND", "NAMED", "ESSAY"],
    );
  });

  it("[I-0] carries the view's instance, the title, and the locale as lang when the item has none", () => {
    const built = payload(redacted, answering);
    const welsh = payload(redactItem({ ...item, lang: Option.some("cy") }), answering);

    assert.deepStrictEqual(Object.keys(built).toSorted(), [
      "body",
      "finished",
      "instance",
      "lang",
      "messages",
      "mode",
      "notices",
      "title",
    ]);
    assert.strictEqual(built.instance, instance);
    assert.strictEqual(built.title, "Capitals");
    assert.strictEqual(built.mode, "answering");
    assert.strictEqual(built.lang, "en");
    assert.strictEqual(welsh.lang, "cy");
    assert.isFalse(built.finished);
  });

  it("carries the view's mode, and editable on every interaction only when answering, finished or not", () => {
    for (const mode of ["answering", "review", "solution"] as const) {
      for (const view of [answering, finished, refused]) {
        const built = payload(redacted, { ...view, mode });
        const interactions = interactionsIn(built.body);

        assert.strictEqual(built.mode, mode);
        assert.lengthOf(interactions, 5);
        for (const interaction of interactions) {
          assert.strictEqual(
            interaction.editable,
            mode === "answering",
            `${mode}, ${interaction.response}`,
          );
        }
      }
    }
  });

  it("[Q-2] presents the choices in document order with the Prompt and the binding", () => {
    const capital = choiceFor(payload(redacted, answering), "CAPITAL");

    assert.deepStrictEqual(capital.choices, [
      { content: [{ kind: "text", text: "Paris" }], identifier: "A" },
      { content: [{ kind: "text", text: "Lyon" }], identifier: "B" },
    ]);
    assert.deepStrictEqual(
      capital.prompt,
      Option.some([{ kind: "text", text: "Which city is the capital of France?" }]),
    );
    assert.strictEqual(capital.cardinality, "single");
    assert.strictEqual(capital.maxChoices, 1n);
    assert.strictEqual(capital.class, "stacked");
    assert.deepStrictEqual(capital.restore, []);
  });

  it("[Q-2] presents a shuffled Choice in shuffleOrder's order, keyed by the seed, the instance and the response", () => {
    const identifiers = planets.choices.map((entry) => entry.identifier);
    const fixed = planets.choices.map((entry) => entry.fixed);
    const ordered = (key: string): readonly string[] =>
      shuffleOrder(key, fixed).map((index) => identifiers[index] ?? "");

    assert.deepStrictEqual(
      presentedOf(planets, { ...answering, seed: "7" }),
      ordered(`7\u001F${instance}\u001FPLANET`),
    );
    assert.deepStrictEqual(
      presentedOf(planets, answering),
      ordered(`\u001F${instance}\u001FPLANET`),
    );
    assert.deepStrictEqual(presentedOf(planets, { ...answering, seed: "7" }), [
      "P1",
      "P0",
      "P2",
      "P4",
      "P3",
    ]);
    assert.deepStrictEqual(presentedOf(planets, answering), ["P4", "P3", "P2", "P1", "P0"]);
  });

  it("[Q-2] keeps a fixed choice at its index, and two instances present a shuffled Choice in different orders", () => {
    const first = presentedOf(planets, answering);
    const second = presentedOf(planets, { ...answering, instance: "q1" });

    assert.strictEqual(first[2], "P2");
    assert.strictEqual(second[2], "P2");
    assert.notDeepEqual(first, second);
    for (const order of [first, second]) {
      assert.sameMembers([...order], ["P0", "P1", "P2", "P3", "P4"]);
    }
  });

  it("[Q-2] keeps document order when shuffle is false, whatever the seed", () => {
    const ordered = { ...planets, shuffle: false };

    for (const view of [answering, { ...answering, seed: "7" }]) {
      assert.deepStrictEqual(presentedOf(ordered, view), ["P0", "P1", "P2", "P3", "P4"]);
    }
  });

  it("[Q-2] carries the Choice's aria-label and aria-labelledby as the model holds them when each id names an element of the item", () => {
    const named: ChoiceInteraction = {
      ...choice,
      ariaLabel: Option.some("Pick a city"),
      ariaLabelledby: Option.some("intro"),
    };

    for (const interaction of [choice, named]) {
      const capital = choiceFor(
        payload(redactItem({ ...item, body: [idParagraph("intro"), interaction] }), answering),
        "CAPITAL",
      );

      assert.deepStrictEqual(capital.ariaLabel, interaction.ariaLabel);
      assert.deepStrictEqual(capital.ariaLabelledby, interaction.ariaLabelledby);
    }
  });

  it("[Q-2] [Q-20] [Q-5] with messages, restores the posted strings and autofocuses the first interaction with a message", () => {
    const built = payload(redacted, refused);

    assert.deepStrictEqual(choiceFor(built, "CAPITAL").restore, ["B"]);
    assert.strictEqual(textEntryFor(built, "FIRST").restore, "Nice");
    assert.strictEqual(textEntryFor(built, "SECOND").restore, "Lyon?");
    assert.strictEqual(textEntryFor(built, "NAMED").restore, "");
    assert.deepStrictEqual(
      interactionsIn(built.body).map((interaction) => [
        interaction.response,
        interaction.invalid,
        interaction.autofocus,
      ]),
      [
        ["CAPITAL", false, false],
        ["FIRST", false, false],
        ["SECOND", true, true],
        ["NAMED", false, false],
        ["ESSAY", true, false],
      ],
    );
    assert.deepStrictEqual(textFor(built, "ESSAY").messageIds, [
      `${instance}-ESSAY-message-0`,
      `${instance}-ESSAY-message-1`,
    ]);
    assert.deepStrictEqual(built.messages, [
      { id: `${instance}-SECOND-message-0`, response: "SECOND", text: "Enter a city." },
      { id: `${instance}-ESSAY-message-0`, response: "ESSAY", text: "Write at least a sentence." },
      { id: `${instance}-ESSAY-message-1`, response: "ESSAY", text: "Name the river." },
    ]);
    assert.deepStrictEqual(identifyMessages(instance, refused.messages), built.messages);
  });

  it("[Q-2] [Q-20] with no messages, restores the view's values, ignores posted text, and autofocuses nothing", () => {
    const built = payload(redacted, finished);
    const opened = payload(redacted, answering);

    assert.deepStrictEqual(choiceFor(built, "CAPITAL").restore, ["A"]);
    assert.strictEqual(textEntryFor(built, "FIRST").restore, "Marseille");
    assert.strictEqual(textEntryFor(built, "SECOND").restore, "");
    assert.isFalse(interactionsIn(built.body).some((interaction) => interaction.autofocus));
    assert.isTrue(built.finished);
    assert.deepStrictEqual(choiceFor(opened, "CAPITAL").restore, []);
    assert.strictEqual(textEntryFor(opened, "FIRST").restore, "");
  });

  it("[Q-2] [Q-20] names each control's entries by the instance and response, or by the author's name", () => {
    const named = payload(redacted, {
      ...answering,
      names: new Map([
        ["CAPITAL", "capital"],
        ["FIRST", "first-city"],
      ]),
    });
    const plain = payload(redacted, answering);

    assert.deepStrictEqual(
      interactionsIn(plain.body).map((interaction) => interaction.formName),
      ["CAPITAL", "FIRST", "SECOND", "NAMED", "ESSAY"].map((response) =>
        entryName(instance, response),
      ),
    );
    assert.strictEqual(choiceFor(named, "CAPITAL").formName, "capital");
    assert.strictEqual(textFor(named, "FIRST").formName, "first-city");
    assert.strictEqual(textFor(named, "SECOND").formName, entryName(instance, "SECOND"));
  });

  it("[Q-20] restores an integer value in the interaction's base", () => {
    const hex: TextEntryInteraction = { ...textEntry("HEX"), base: 16, baseType: "integer" };
    const hexItem: Item = {
      ...item,
      body: [hex],
      responses: new Map([
        [
          "HEX",
          {
            areaMapping: Option.none(),
            baseType: "integer",
            cardinality: "single",
            correct: Option.none(),
            defaultValue: Option.none(),
            identifier: "HEX",
            mapping: Option.none(),
          },
        ],
      ]),
    };
    const view: View = {
      ...answering,
      values: new Map([["HEX", one({ baseType: "integer", value: 255n })]]),
    };

    assert.strictEqual(textEntryFor(payload(redactItem(hexItem), view), "HEX").restore, "ff");
  });

  it('[Q-5] carries an Extended Text\'s format, format="xhtml" included', () => {
    const xhtml: Item = {
      ...item,
      body: item.body.map((node) =>
        node.kind === "extended-text" ? { ...node, format: "xhtml" } : node,
      ),
    };
    const essayPayload = textFor(payload(redactItem(xhtml), answering), "ESSAY");

    assert.strictEqual(essayPayload.kind, "extended-text");
    assert.strictEqual(
      essayPayload.kind === "extended-text" ? essayPayload.format : undefined,
      "xhtml",
    );
  });

  it("[Q-20] [Q-5] numbers the text controls with no authored name and no Prompt", () => {
    const built = payload(redacted, answering);

    assert.deepStrictEqual(textFor(built, "FIRST").name.unnamed, Option.some({ count: 2, n: 1 }));
    assert.deepStrictEqual(textFor(built, "SECOND").name.unnamed, Option.some({ count: 2, n: 2 }));
    assert.deepStrictEqual(textFor(built, "NAMED").name, {
      ariaLabel: Option.some("Third city"),
      ariaLabelledby: Option.none(),
      unnamed: Option.none(),
    });
    assert.deepStrictEqual(textFor(built, "ESSAY").name.unnamed, Option.none());
  });

  it("[Q-20] counts a text control whose aria-labelledby names no id as one with no authored name", () => {
    const blank: Item = {
      ...item,
      body: item.body.map((node) =>
        node.kind === "element"
          ? {
              ...node,
              children: node.children.map((child) =>
                child.kind === "text-entry" && child.response === "NAMED"
                  ? { ...child, ariaLabel: Option.none(), ariaLabelledby: Option.some(" \t ") }
                  : child,
              ),
            }
          : node,
      ),
    };
    const built = payload(redactItem(blank), answering);

    assert.deepStrictEqual(textFor(built, "FIRST").name.unnamed, Option.some({ count: 3, n: 1 }));
    assert.deepStrictEqual(textFor(built, "NAMED").name.unnamed, Option.some({ count: 3, n: 3 }));
  });

  it("[Q-20] counts a text control whose aria-label is empty or blank as one with no authored name", () => {
    for (const label of ["", "   ", " \t\n\r "]) {
      const blank: Item = {
        ...item,
        body: item.body.map((node) =>
          node.kind === "element"
            ? {
                ...node,
                children: node.children.map((child) =>
                  child.kind === "text-entry" && child.response === "NAMED"
                    ? { ...child, ariaLabel: Option.some(label) }
                    : child,
                ),
              }
            : node,
        ),
      };
      const built = payload(redactItem(blank), answering);

      assert.deepStrictEqual(
        textFor(built, "FIRST").name.unnamed,
        Option.some({ count: 3, n: 1 }),
        JSON.stringify(label),
      );
      assert.deepStrictEqual(
        textFor(built, "NAMED").name,
        {
          ariaLabel: Option.some(label),
          ariaLabelledby: Option.none(),
          unnamed: Option.some({ count: 3, n: 3 }),
        },
        JSON.stringify(label),
      );
    }
  });

  it("[Q-2] [Q-20] [Q-5] keeps the ids of an authored aria-labelledby that an element of the item carries, in order, and drops the others", () => {
    const namesOf = (built: Payload): readonly Option.Option<string>[] => [
      choiceFor(built, "CAPITAL").ariaLabelledby,
      textFor(built, "NAMED").name.ariaLabelledby,
      textFor(built, "ESSAY").name.ariaLabelledby,
    ];

    for (const ids of ["nope", "nope missing", " nope "]) {
      const built = payload(referencing(ids), answering);

      assert.deepStrictEqual(namesOf(built), [Option.none(), Option.none(), Option.none()], ids);
      assert.deepStrictEqual(
        textFor(built, "NAMED").name.unnamed,
        Option.some({ count: 3, n: 3 }),
        ids,
      );
    }

    const kept = payload(referencing("nope intro\tmissing why paris"), answering);
    const intro = Option.some("intro why paris");
    assert.deepStrictEqual(namesOf(kept), [intro, intro, intro]);
    assert.deepStrictEqual(textFor(kept, "NAMED").name.unnamed, Option.none());
    assert.deepStrictEqual(textFor(kept, "FIRST").name.unnamed, Option.some({ count: 2, n: 1 }));
  });

  it("[Q-20] [Q-5] numbers each Control of an unnamed Extended Text group in one sequence with the unnamed Text Entries", () => {
    const built = payload(unpromptedOf(Option.some(3n), 0n), answering);

    assert.strictEqual(extendedTextFor(built, "ESSAY").n, 3);
    assert.deepStrictEqual(textFor(built, "FIRST").name.unnamed, Option.some({ count: 5, n: 1 }));
    assert.deepStrictEqual(textFor(built, "SECOND").name.unnamed, Option.some({ count: 5, n: 2 }));
    assert.deepStrictEqual(textFor(built, "NAMED").name.unnamed, Option.none());
    assert.deepStrictEqual(textFor(built, "ESSAY").name.unnamed, Option.some({ count: 5, n: 3 }));
  });

  it("[Q-20] [Q-5] counts the Controls a restored value adds to an unnamed Extended Text, and none of one over the cap", () => {
    const restoring = payload(unpromptedOf(Option.none(), 0n), {
      ...answering,
      values: new Map([["ESSAY", orderedOf(stages(12))]]),
    });

    assert.strictEqual(extendedTextFor(restoring, "ESSAY").n, 12);
    assert.deepStrictEqual(
      textFor(restoring, "SECOND").name.unnamed,
      Option.some({ count: 14, n: 2 }),
    );
    assert.deepStrictEqual(
      textFor(restoring, "ESSAY").name.unnamed,
      Option.some({ count: 14, n: 3 }),
    );

    const over = payload(unpromptedOf(Option.none(), 101n), answering);

    assert.strictEqual(extendedTextFor(over, "ESSAY").n, 0);
    assert.deepStrictEqual(textFor(over, "FIRST").name.unnamed, Option.some({ count: 2, n: 1 }));
    assert.deepStrictEqual(textFor(over, "SECOND").name.unnamed, Option.some({ count: 2, n: 2 }));
    assert.deepStrictEqual(textFor(over, "ESSAY").name.unnamed, Option.none());
  });

  it("[Q-5] gives a single Extended Text one Control, restoring the text its control shows", () => {
    const built = payload(redacted, {
      ...answering,
      values: new Map([["ESSAY", one({ baseType: "string", value: "Rivers" })]]),
    });
    const essayPayload = extendedTextFor(built, "ESSAY");

    assert.deepStrictEqual(
      [essayPayload.cardinality, essayPayload.n, essayPayload.restores, essayPayload.notice],
      ["single", 1, ["Rivers"], Option.none()],
    );
  });

  for (const [counts, maxStrings, minStrings, n] of [
    ['max-strings="3"', Option.some(3n), 0n, 3],
    ['max-strings="1000000000000" and no min-strings', Option.some(1_000_000_000_000n), 0n, 10],
    ['min-strings="100" max-strings="200"', Option.some(200n), 100n, 100],
    ['max-strings="0"', Option.some(0n), 0n, 10],
    ["no max-strings", Option.none(), 0n, 10],
    ['min-strings="12" max-strings="0"', Option.some(0n), 12n, 12],
  ] as const) {
    it(`[Q-5] gives an ordered Extended Text with ${counts} ${String(n)} Controls`, () => {
      const list = extendedTextFor(payload(listOf(maxStrings, minStrings), answering), "LIST");

      assert.deepStrictEqual(
        [list.cardinality, list.n, list.restores, list.notice],
        ["ordered", n, Array.from({ length: n }, () => ""), Option.none()],
      );
    });
  }

  for (const [counts, maxStrings, minStrings] of [
    ['min-strings="101" max-strings="200"', Option.some(200n), 101n],
    ['min-strings="1000000000000"', Option.some(1_000_000_000_000n), 1_000_000_000_000n],
    ['max-strings="5" min-strings="101"', Option.some(5n), 101n],
  ] as const) {
    it(`[Q-5] holds the notice min-strings>100 and no Control for an ordered Extended Text with ${counts}`, () => {
      const list = extendedTextFor(
        payload(listOf(maxStrings, minStrings), {
          ...answering,
          values: new Map([
            [
              "LIST",
              {
                baseType: "string",
                cardinality: "ordered",
                values: [{ baseType: "string", value: "first" }],
              },
            ],
          ]),
        }),
        "LIST",
      );

      assert.deepStrictEqual(
        [list.n, list.restores, list.notice],
        [0, [], Option.some({ feature: "min-strings>100", kind: "notice" })],
      );
    });
  }

  for (const [counts, maxStrings] of [
    ['max-strings="0"', Option.some(0n)],
    ['max-strings="1000000000000"', Option.some(1_000_000_000_000n)],
    ["no max-strings", Option.none()],
  ] as const) {
    it(`[Q-5] gives an ordered Extended Text with ${counts} a Control for each of a 12-member value, each restoring its member`, () => {
      const list = listOf(maxStrings, 0n);
      const members = stages(12);
      const shownValues = extendedTextFor(
        payload(list, { ...answering, values: new Map([["LIST", orderedOf(members)]]) }),
        "LIST",
      );
      const posted = extendedTextFor(
        payload(list, {
          ...answering,
          messages: [{ response: "LIST", text: "Name each stage." }],
          posted: Option.some(new Map([["LIST", members]])),
        }),
        "LIST",
      );

      assert.deepStrictEqual(
        [shownValues.n, shownValues.restores, shownValues.notice],
        [12, members, Option.none()],
      );
      assert.deepStrictEqual(
        [posted.n, posted.restores, posted.notice],
        [12, members, Option.none()],
      );
    });
  }

  it("[Q-5] shows the first 100 members of a 150-member value and the cap's notice beside them", () => {
    const members = stages(150);
    const list = extendedTextFor(
      payload(listOf(Option.some(0n), 0n), {
        ...answering,
        values: new Map([["LIST", orderedOf(members)]]),
      }),
      "LIST",
    );

    assert.deepStrictEqual(
      [list.n, list.restores, list.notice],
      [100, members.slice(0, 100), Option.some({ feature: "min-strings>100", kind: "notice" })],
    );
  });

  it('[Q-5] covers a value\'s members only up to max-strings="12", with no notice', () => {
    const members = stages(15);
    const list = extendedTextFor(
      payload(listOf(Option.some(12n), 0n), {
        ...answering,
        values: new Map([["LIST", orderedOf(members)]]),
      }),
      "LIST",
    );

    assert.deepStrictEqual(
      [list.n, list.restores, list.notice],
      [12, members.slice(0, 12), Option.none()],
    );
  });

  it("[Q-5] fills a container's Controls in order with its values, or with the posted strings beside messages", () => {
    const list = listOf(Option.some(3n), 0n);
    const shownValues = payload(list, {
      ...answering,
      values: new Map([
        [
          "LIST",
          {
            baseType: "string",
            cardinality: "ordered",
            values: [
              { baseType: "string", value: "evaporation" },
              { baseType: "string", value: "condensation" },
            ],
          },
        ],
      ]),
    });
    const posted = payload(list, {
      ...answering,
      messages: [{ response: "LIST", text: "Enter at least 3 answers." }],
      posted: Option.some(new Map([["LIST", ["rain", "", "rivers"]]])),
    });

    assert.deepStrictEqual(extendedTextFor(shownValues, "LIST").restores, [
      "evaporation",
      "condensation",
      "",
    ]);
    assert.deepStrictEqual(extendedTextFor(posted, "LIST").restores, ["rain", "", "rivers"]);
  });
});

/**
 * Collect every element of some nodes, each before its descendants.
 *
 * @param nodes The nodes.
 * @returns Each element, in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * The shuffled {@link planets} as the one interaction of an accepted item, redacted for `render`.
 */
const planetsRedacted = redact(
  acceptForTest({
    ...item,
    body: [planets],
    processing: Option.none(),
    responses: new Map([
      [
        "PLANET",
        {
          areaMapping: Option.none(),
          baseType: "identifier",
          cardinality: "single",
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier: "PLANET",
          mapping: Option.none(),
        },
      ],
    ]),
  }),
);

/**
 * Render {@link planetsRedacted} and give the choices its HTML presents: the values of the Controls
 * posting under `PLANET`'s entry name, in the order the HTML emits them.
 *
 * @param seed The configuration's seed, none for a configuration without one.
 * @param token The render's instance.
 * @returns Each Control's value, in emitted order.
 */
const renderedOrder = Effect.fn(function* renderedOrder(
  seed: Option.Option<string>,
  token: string,
) {
  const configuration = yield* configure(
    Option.match(seed, { onNone: () => ({}), onSome: (value) => ({ seed: value }) }),
  );
  const rendered = yield* Effect.fromResult(
    render(planetsRedacted, configuration, { instance: token }),
  );

  return elementsOf(parseHtml(rendered.html))
    .filter((element) => element.attrs["name"] === entryName(token, "PLANET"))
    .map((control) => {
      const { value } = control.attrs;

      return value === undefined || value === true ? assert.fail("A Control has no value.") : value;
    });
});

/**
 * The seeds the order is checked under: none, and two others.
 */
const seeds: readonly Option.Option<string>[] = [
  Option.none(),
  Option.some("7"),
  Option.some("11"),
];

/**
 * The instances the order is checked under.
 */
const instances: readonly string[] = [instance, "q1"];

describe("choiceOrder", () => {
  it.effect(
    "gives the order render presents for a shuffled Choice, under two seeds, no seed and two instances",
    () =>
      Effect.gen(function* presentedOrders() {
        const orders: string[] = [];
        for (const seed of seeds) {
          for (const token of instances) {
            const presented = yield* renderedOrder(seed, token);

            assert.lengthOf(presented, planets.choices.length);
            assert.deepStrictEqual(choiceOrder(planets, seed, token), presented);
            orders.push(presented.join(" "));
          }
        }

        assert.isAbove(new Set(orders).size, 1);
      }),
  );

  it("keeps a fixed choice at its document index in a shuffled Choice", () => {
    for (const seed of seeds) {
      for (const token of instances) {
        assert.strictEqual(choiceOrder(planets, seed, token)[2], "P2");
      }
    }
  });

  it("keeps document order for a Choice that is not shuffled, whatever the seed and instance", () => {
    const ordered = { ...planets, shuffle: false };

    for (const seed of seeds) {
      for (const token of instances) {
        assert.deepStrictEqual(choiceOrder(ordered, seed, token), ["P0", "P1", "P2", "P3", "P4"]);
      }
    }
  });
});

/**
 * Construct the posting of a single response with the entry name `render` gives it here.
 *
 * @param identifier The response's identifier.
 * @param baseType Its declared base type.
 * @param base The number base its entries are read in.
 * @returns The posting.
 */
const postingOf = (
  identifier: string,
  baseType: Posting["binding"]["baseType"],
  base: number,
): Posting => ({
  binding: { baseType, cardinality: "single", name: entryName(instance, identifier) },
  identifier,
  options: { base },
});

/**
 * The responses of the smaller item the growth check reads, each bound to its own Text Entry,
 * before it reads one with {@link growthFactor} times as many.
 */
const fewerEntries = 2000;

/**
 * The growth check reads 16,000 responses three times and 2,000 responses 24 times. A read that
 * searched every interaction for each response took about a second at 16,000 responses, and a
 * failing check should report its ratio, not a timeout.
 */
const growthTimeoutMs = 300_000;

/**
 * Construct a redacted item whose body is one paragraph of Text Entries, each bound to its own
 * single string response, `R1` to `R<count>`.
 *
 * @param count How many responses and Text Entries it holds.
 * @returns The redacted item.
 */
const entriesItem = (count: number): Redacted => {
  const identifiers = Array.from({ length: count }, (_, index) => `R${String(index + 1)}`);

  return redactItem({
    ...item,
    body: [
      {
        attributes: [],
        children: identifiers.map((identifier) => textEntry(identifier)),
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      },
    ],
    responses: new Map(
      identifiers.map((identifier) => [
        identifier,
        {
          areaMapping: Option.none(),
          baseType: "string",
          cardinality: "single",
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier,
          mapping: Option.none(),
        },
      ]),
    ),
  });
};

describe("postings", () => {
  it("gives each posted response its binding and its first text interaction's base, in declaration order", () => {
    const bound: Item = {
      ...item,
      body: [
        { ...essay, base: 8 },
        choice,
        { ...textEntry("FIRST"), base: 16 },
        {
          attributes: [],
          children: [{ ...textEntry("FIRST"), base: 2 }, textEntry("SECOND"), textEntry("NAMED")],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/p",
          tag: "p",
        },
      ],
      responses: new Map([
        ...item.responses,
        [
          "POINT",
          {
            areaMapping: Option.none(),
            baseType: "point",
            cardinality: "single",
            correct: Option.none(),
            defaultValue: Option.none(),
            identifier: "POINT",
            mapping: Option.none(),
          },
        ],
      ]),
    };

    assert.deepStrictEqual(postings(redactItem(bound), instance), [
      postingOf("CAPITAL", "identifier", 10),
      postingOf("FIRST", "string", 16),
      postingOf("SECOND", "string", 10),
      postingOf("NAMED", "string", 10),
      postingOf("ESSAY", "string", 8),
    ]);
  });

  it("[Q-12] gives an Inline Choice's response its posting in base 10, which decodes an empty entry as NULL and refuses two entries", () => {
    const [posting, ...others] = postings(riverRedacted, instance);
    assert.deepStrictEqual(posting, postingOf("RIVER", "identifier", 10));
    assert.lengthOf(others, 0);

    const { binding, options } = posting ?? assert.fail("RIVER has no posting.");
    assert.deepStrictEqual(
      Result.getSuccess(decode([[binding.name, ""]], binding, options)),
      Option.some(nullOf("identifier", "single")),
    );
    assert.deepStrictEqual(
      Option.map(
        Result.getFailure(
          decode(
            [
              [binding.name, "S"],
              [binding.name, "L"],
            ],
            binding,
            options,
          ),
        ),
        (malformed) => [malformed._tag, malformed.reason],
      ),
      Option.some(["Malformed", "single-many"]),
    );
  });

  it("gives no posting to a declared response no interaction binds, so a post carries nothing over its record value", () => {
    const unbound: Item = { ...item, body: [choice] };

    assert.deepStrictEqual(postings(redactItem(unbound), instance), [
      postingOf("CAPITAL", "identifier", 10),
    ]);
  });

  it.effect(
    "gives the postings of 8 times the responses, each bound to its own Text Entry, in under 32 times the time",
    () =>
      Effect.gen(function* postingsInLinearTime() {
        const fewer = entriesItem(fewerEntries);
        const more = entriesItem(fewerEntries * growthFactor);
        assert.lengthOf(postings(more, instance), fewerEntries * growthFactor);

        const growth = yield* growthRatio(
          () => {
            postings(fewer, instance);
          },
          () => {
            postings(more, instance);
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the bound responses took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );
});

/**
 * The parameters of {@link parameterDocument}'s `object`, each a `name` and the `value` written:
 * one for each `param-variable` template variable, `N` an integer, `F` a float, `P` a point, `Q` a
 * pair, `D` a directed pair and `B` a boolean; `PLAIN`, a template variable not declared
 * `param-variable`; and a literal no variable is named by.
 */
const writtenParameters = [
  ["count", "N"],
  ["ratio", "F"],
  ["spot", "P"],
  ["link", "Q"],
  ["arrow", "D"],
  ["flag", "B"],
  ["plain", "PLAIN"],
  ["literal", "hello"],
] as const;

/**
 * Construct a `qti-template-declaration` with a declared default.
 *
 * @param identifier The variable's identifier.
 * @param baseType Its base type.
 * @param lexical Its default, as written.
 * @param parameter Whether it is declared `param-variable="true"`.
 * @returns The element.
 */
const parameterDeclaration = (
  identifier: string,
  baseType: string,
  lexical: string,
  parameter: boolean,
) =>
  el(
    "qti-template-declaration",
    [
      attr("base-type", baseType),
      attr("cardinality", "single"),
      attr("identifier", identifier),
      ...(parameter ? [attr("param-variable", "true")] : []),
    ],
    [el("qti-default-value", [], [el("qti-value", [], [sourceText(lexical)])])],
  );

/**
 * An item whose template processing runs, with a paragraph holding an `object` whose parameters
 * are {@link writtenParameters}. Each template variable declares a default, and the processing
 * sets `N` to 255.
 */
const parameterDocument = doc(
  "item.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "parameters"), attr("time-dependent", "false"), attr("title", "Params")],
    [
      parameterDeclaration("N", "integer", "3", true),
      parameterDeclaration("F", "float", "0.5", true),
      parameterDeclaration("P", "point", "1 2", true),
      parameterDeclaration("Q", "pair", "C D", true),
      parameterDeclaration("D", "directedPair", "C D", true),
      parameterDeclaration("B", "boolean", "false", true),
      parameterDeclaration("PLAIN", "integer", "7", false),
      el(
        "qti-template-processing",
        [],
        [
          el(
            "qti-set-template-value",
            [attr("identifier", "N")],
            [el("qti-base-value", [attr("base-type", "integer")], [sourceText("255")])],
          ),
        ],
      ),
      el(
        "qti-item-body",
        [],
        [
          el(
            "p",
            [],
            [
              el(
                "object",
                [attr("data", "applet.html"), attr("type", "text/html")],
                [
                  ...writtenParameters.map(([name, value]) =>
                    el("param", [
                      attr("name", name),
                      attr("value", value),
                      attr("valuetype", "DATA"),
                    ]),
                  ),
                  sourceText("Applet"),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
);

/**
 * The template values of an attempt of {@link parameterDocument}: `N` 255, `F` 1234567.5, `P` the
 * point 3 4, `Q` the pair A B, `D` the directed pair B A, `B` true and `PLAIN` 7.
 */
const parameterValues = holding({
  B: one({ baseType: "boolean", value: true }),
  D: one({ baseType: "directedPair", value: ["B", "A"] }),
  F: floatValue(1_234_567.5),
  N: integerValue(255n),
  P: one({ baseType: "point", value: [3n, 4n] }),
  PLAIN: integerValue(7n),
  Q: one({ baseType: "pair", value: ["A", "B"] }),
});

/**
 * Give the children of the `object` in a body of {@link parameterDocument}: the paragraph's one
 * element.
 *
 * @param body The body, as the model reads it or as a redaction leaves it.
 * @returns The object's children.
 */
const objectChildren = (body: readonly BodyNode[]): readonly BodyNode[] => {
  const [paragraph] = body;
  const [object] = paragraph?.kind === "element" ? paragraph.children : [];

  return object?.kind === "element" && object.tag === "object"
    ? object.children
    : assert.fail("The paragraph holds no object.");
};

/**
 * Give each `param` among some body nodes as its `name` and its `value`.
 *
 * @param nodes The nodes.
 * @returns Each parameter's name and value, in document order.
 */
const parametersOf = (nodes: readonly BodyNode[]): readonly (readonly [string, string])[] =>
  nodes.flatMap((node): readonly (readonly [string, string])[] => {
    if (node.kind !== "element" || node.tag !== "param") {
      return [];
    }

    const valueOf = (name: string): string =>
      node.attributes.find((entry) => entry.name === name)?.value ??
      assert.fail(`A param has no ${name}.`);

    return [[valueOf("name"), valueOf("value")]];
  });

/**
 * The parameters {@link parameterValues} gives {@link parameterDocument}'s `object`: each
 * `param-variable` value written as the information model's `param` `value` converts it, and the
 * others as written.
 */
const expandedParameters = [
  ["count", "255"],
  ["ratio", "1.23457E+06"],
  ["spot", "3 4"],
  ["link", "A B"],
  ["arrow", "B A"],
  ["flag", "true"],
  ["plain", "PLAIN"],
  ["literal", "hello"],
] as const;

/**
 * The notice a withheld `param` of {@link parameterDocument} is shown as.
 *
 * @param node The `param` as the model reads it.
 * @returns The notice at its path.
 */
const parameterNoticeAt = (node: BodyNode | undefined): Unsupported =>
  node?.kind === "element"
    ? noticeOf("param", node.path)
    : assert.fail("The object holds fewer params.");

describe("redactItem on param-variable parameters", () => {
  it.effect(
    "[I-5] gives a param whose value names a param-variable template variable that variable's value from the record, which render writes: an integer by %i, a float by %G, a point x then y, a pair and a directed pair as their identifiers, a boolean as true or false (R§4.4)",
    () =>
      Effect.gen(function* rendersParameterValues() {
        const accepted = yield* Effect.fromOption(acceptedItem(check(parameterDocument, tables)));
        const expanded = redact(accepted, parameterValues);
        const configuration = yield* configure({});
        const rendered = yield* Effect.fromResult(render(expanded, configuration, { instance }));
        const written: readonly (readonly [unknown, unknown])[] = elementsOf(
          parseHtml(rendered.html),
        )
          .filter((element) => element.tag === "param")
          .map((element) => [element.attrs["name"], element.attrs["value"]]);

        assert.deepStrictEqual(parametersOf(objectChildren(expanded.body)), expandedParameters);
        assert.deepStrictEqual(written, expandedParameters);
        assert.deepStrictEqual(expanded.notices, []);
      }),
  );

  it.effect(
    "[I-5] keeps the written value of a param that names a template variable not declared param-variable, or names none",
    () =>
      Effect.gen(function* keepsWrittenValues() {
        const accepted = yield* Effect.fromOption(acceptedItem(check(parameterDocument, tables)));
        const kept = parametersOf(objectChildren(redact(accepted, parameterValues).body));

        assert.deepStrictEqual(kept.slice(-2), [
          ["plain", "PLAIN"],
          ["literal", "hello"],
        ]);
      }),
  );

  it.effect(
    "[I-5] with no record, withholds each param-variable param of an item whose template processing runs behind its notice, param at its path, named among the notices in document order (H3)",
    () =>
      Effect.gen(function* withholdsParameters() {
        const accepted = yield* Effect.fromOption(acceptedItem(check(parameterDocument, tables)));
        const withheld = redact(accepted);
        const [count, ratio, spot, link, arrow, flag, ...rest] = objectChildren(accepted.item.body);

        assert.deepStrictEqual(objectChildren(withheld.body), [
          ...[count, ratio, spot, link, arrow, flag].map(parameterNoticeAt),
          ...rest,
        ]);
        assert.deepStrictEqual(
          withheld.notices,
          Array.from({ length: 6 }, () => "param"),
        );
      }),
  );

  it.effect(
    "[I-5] withholds a param-variable param whose template variable the record holds no value of, as with no record (0.13 decision 15)",
    () =>
      Effect.gen(function* withholdsUnheldParameter() {
        const accepted = yield* Effect.fromOption(acceptedItem(check(parameterDocument, tables)));
        const { N: _held, ...unheld } = parameterValues.templates;
        const gap = redact(accepted, holding(unheld));
        const [count] = objectChildren(accepted.item.body);
        const [, ...expandedOthers] = objectChildren(redact(accepted, parameterValues).body);

        assert.deepStrictEqual(objectChildren(gap.body), [
          parameterNoticeAt(count),
          ...expandedOthers,
        ]);
        assert.deepStrictEqual(gap.notices, ["param"]);
      }),
  );

  it.effect(
    "[I-5] with no record, gives an item without template processing's param-variable params their declared defaults, the values its first record holds (H3)",
    () =>
      Effect.gen(function* givesDeclaredDefaults() {
        const accepted = yield* Effect.fromOption(acceptedItem(check(parameterDocument, tables)));
        const started = redactItem({ ...accepted.item, templateProcessing: Option.none() });

        assert.deepStrictEqual(parametersOf(objectChildren(started.body)), [
          ["count", "3"],
          ["ratio", "0.5"],
          ["spot", "1 2"],
          ["link", "C D"],
          ["arrow", "C D"],
          ["flag", "false"],
          ["plain", "PLAIN"],
          ["literal", "hello"],
        ]);
        assert.deepStrictEqual(started.notices, []);
      }),
  );
});
