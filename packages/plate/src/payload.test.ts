import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { entryName } from "#plate/form/encoding.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { choiceOrder, identifyMessages, payload, postings, redactItem } from "#plate/payload.ts";
import type {
  ChoicePayload,
  ExtendedTextPayload,
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
import { acceptForTest } from "#plate/validate/verdict.ts";

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
    { content: [text("Paris")], fixed: false, identifier: "A" },
    { content: [text("Lyon")], fixed: false, identifier: "B" },
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
              expression: { kind: "base-value", value: one({ baseType: "float", value: 1 }) },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ],
          when: {
            kind: "match",
            operands: [
              { identifier: "CAPITAL", kind: "variable" },
              { identifier: "CAPITAL", kind: "correct" },
            ],
          },
        },
      ],
      kind: "condition",
      otherwise: Option.some([
        {
          expression: {
            kind: "base-value",
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
      presentedOf(planets, { ...answering, seed: 7 }),
      ordered(`7\u001F${instance}\u001FPLANET`),
    );
    assert.deepStrictEqual(
      presentedOf(planets, answering),
      ordered(`\u001F${instance}\u001FPLANET`),
    );
    assert.deepStrictEqual(presentedOf(planets, { ...answering, seed: 7 }), [
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

    for (const view of [answering, { ...answering, seed: 7 }]) {
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
  seed: Option.Option<number>,
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
const seeds: readonly Option.Option<number>[] = [Option.none(), Option.some(7), Option.some(11)];

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
