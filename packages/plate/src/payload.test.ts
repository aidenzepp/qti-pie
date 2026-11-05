import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate } from "effect";
import { entryName } from "#plate/form/encoding.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { identifyMessages, payload, redactItem } from "#plate/payload.ts";
import type {
  ChoicePayload,
  ExtendedTextPayload,
  InteractionPayload,
  Payload,
  PayloadNode,
  Redacted,
  TextEntryPayload,
  View,
} from "#plate/payload.ts";

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
      },
    ],
    [
      "FEEDBACK",
      {
        baseType: "identifier",
        cardinality: "single",
        defaultValue: Option.some(one({ baseType: "identifier", value: "MarkerOutcomeDefault" })),
        identifier: "FEEDBACK",
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
 * @returns The Text Entry or Extended Text payload; the test fails when it is a Choice.
 */
const textFor = (built: Payload, response: string): ExtendedTextPayload | TextEntryPayload => {
  const found = interactionFor(built, response);

  return found.kind === "choice" ? assert.fail(`${response} is a Choice`) : found;
};

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

  it("[Q-2] carries the Choice's aria-label and aria-labelledby as the model holds them", () => {
    const named: ChoiceInteraction = {
      ...choice,
      ariaLabel: Option.some("Pick a city"),
      ariaLabelledby: Option.some("intro"),
    };

    for (const interaction of [choice, named]) {
      const capital = choiceFor(
        payload(redactItem({ ...item, body: [interaction] }), answering),
        "CAPITAL",
      );

      assert.deepStrictEqual(capital.ariaLabel, interaction.ariaLabel);
      assert.deepStrictEqual(capital.ariaLabelledby, interaction.ariaLabelledby);
    }
  });

  it("[Q-2] [Q-20] [Q-5] with messages, restores the posted strings and autofocuses the first interaction with a message", () => {
    const built = payload(redacted, refused);

    assert.deepStrictEqual(choiceFor(built, "CAPITAL").restore, ["B"]);
    assert.strictEqual(textFor(built, "FIRST").restore, "Nice");
    assert.strictEqual(textFor(built, "SECOND").restore, "Lyon?");
    assert.strictEqual(textFor(built, "NAMED").restore, "");
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
    assert.strictEqual(textFor(built, "FIRST").restore, "Marseille");
    assert.strictEqual(textFor(built, "SECOND").restore, "");
    assert.isFalse(interactionsIn(built.body).some((interaction) => interaction.autofocus));
    assert.isTrue(built.finished);
    assert.deepStrictEqual(choiceFor(opened, "CAPITAL").restore, []);
    assert.strictEqual(textFor(opened, "FIRST").restore, "");
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

    assert.strictEqual(textFor(payload(redactItem(hexItem), view), "HEX").restore, "ff");
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
