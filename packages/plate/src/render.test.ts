import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import { checkInstance, entryName, partition } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Entry, InstanceRequirement } from "#plate/form/encoding.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  InlineChoiceInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { Redacted, RenderMode } from "#plate/payload.ts";
import { InvalidInstance, redact, render, renderStatus } from "#plate/render.ts";
import type { Options, Rendered } from "#plate/render.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { keyboardWalk } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

/**
 * The strings only the hidden parts of {@link item} hold: its correct responses, a mapping key, a
 * response default, an outcome default and a value in its response processing (`p1-18`'s
 * markers). None appears in its body, so none may appear in a render.
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
 * The {@link markers} of the correct responses, which a `solution` render shows only when the
 * author passes them as values.
 */
const correctMarkers: readonly string[] = ["MarkerCorrectChoice", "MarkerCorrectText"];

/**
 * The {@link markers} no render shows in any mode: the mapping key, the defaults and the rule
 * value.
 */
const hiddenMarkers: readonly string[] = markers.filter(
  (marker) => !correctMarkers.includes(marker),
);

/**
 * The item instance most renders here pass.
 */
const instance = "4c7e1a2b-9d3f-4e8a-b6c5-0f1e2d3c4b5a";

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
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * A single Choice of three cities with a Prompt, bound to `RESPONSE`.
 */
const choice: ChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  cardinality: "single",
  choices: [
    { content: [words("Paris")], fixed: false, identifier: "A", templateVisibility: Option.none() },
    { content: [words("Lyon")], fixed: false, identifier: "B", templateVisibility: Option.none() },
    { content: [words("Nice")], fixed: false, identifier: "C", templateVisibility: Option.none() },
  ],
  class: "",
  kind: "choice",
  maxChoices: 1n,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0n,
  orientation: Option.none(),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([words("Which city is the capital of France?")]),
  response: "RESPONSE",
  shuffle: false,
};

/**
 * A Text Entry bound to the single string response `CITY`, named by `aria-label`.
 */
const city: TextEntryInteraction = {
  ariaLabel: Option.some("Another city"),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p[2]/qti-text-entry-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response: "CITY",
};

/**
 * A hand-built item: a paragraph with an authored id, a Choice, a paragraph holding a Text Entry,
 * and an image whose `src` is a package path. Its hidden parts hold the {@link markers}.
 */
const item: Item = {
  body: [
    {
      attributes: [{ name: "id", value: "intro" }],
      children: [words("Answer both parts.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p[1]",
      tag: "p",
    },
    choice,
    {
      attributes: [],
      children: [words("Name another city: "), city],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p[2]",
      tag: "p",
    },
    {
      attributes: [
        { name: "alt", value: "A map of France" },
        { name: "src", value: "images/france.png" },
      ],
      children: [],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/img",
      tag: "img",
    },
  ],
  document: "items/capital.xml",
  identifier: "capital",
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
      expression: {
        kind: "base-value",
        operands: [],
        value: one({ baseType: "identifier", value: "MarkerRuleValue" }),
      },
      identifier: "FEEDBACK",
      kind: "set-outcome",
    },
  ]),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some(one({ baseType: "identifier", value: "MarkerCorrectChoice" })),
        defaultValue: Option.some(one({ baseType: "identifier", value: "MarkerResponseDefault" })),
        identifier: "RESPONSE",
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
      "CITY",
      {
        areaMapping: Option.none(),
        baseType: "string",
        cardinality: "single",
        correct: Option.some(one({ baseType: "string", value: "MarkerCorrectText" })),
        defaultValue: Option.none(),
        identifier: "CITY",
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "The capital",
  unsupported: [],
};

/**
 * A hand-built item whose body holds a `javascript:` href and an `onclick`, which `check` would
 * strip and mark: built by hand, it is never an `Accepted`.
 */
const unsafe: Item = {
  ...item,
  body: [
    {
      attributes: [{ name: "onclick", value: "alert(1)" }],
      children: [
        {
          // oxlint-disable-next-line eslint/no-script-url -- the value is test input check must strip, never a URL this code navigates to.
          attributes: [{ name: "href", value: "javascript:alert(1)" }],
          children: [words("read more")],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/p/a",
          tag: "a",
        },
      ],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
};

/**
 * The item as `redact` gives it, the one input `render` takes.
 */
const redacted = redact(acceptForTest(item));

/**
 * A shuffled single Choice of five planets, bound to `PLANET`, none of them fixed.
 */
const planets: ChoiceInteraction = {
  ...choice,
  choices: ["Mercury", "Venus", "Earth", "Mars", "Jupiter"].map((planet, index) => ({
    content: [words(planet)],
    fixed: false,
    identifier: `P${String(index)}`,
    templateVisibility: Option.none(),
  })),
  prompt: Option.some([words("Which planet is the largest?")]),
  response: "PLANET",
  shuffle: true,
};

/**
 * An item whose body is the shuffled {@link planets}, redacted, with no response processing.
 */
const shuffled = redact(
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
 * An unnamed Inline Choice of three colours with no Label, bound to the single identifier response
 * `COLOUR`.
 */
const colours: InlineChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  choices: [
    { content: [words("red")], fixed: false, identifier: "R", templateVisibility: Option.none() },
    { content: [words("green")], fixed: false, identifier: "G", templateVisibility: Option.none() },
    { content: [words("blue")], fixed: false, identifier: "B", templateVisibility: Option.none() },
  ],
  class: "",
  kind: "inline-choice",
  label: Option.none(),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response: "COLOUR",
  shuffle: false,
};

/**
 * Construct an item whose one paragraph holds an Inline Choice and then {@link city} with no
 * `aria-label`, so both are unnamed unless the Inline Choice's own fields name it.
 *
 * @param inline The Inline Choice, bound to `COLOUR`.
 * @returns The item, redacted.
 */
const sentence = (inline: InlineChoiceInteraction): Redacted =>
  redact(
    acceptForTest({
      ...item,
      body: [
        {
          attributes: [],
          children: [
            words("The sky is "),
            inline,
            words(" over "),
            {
              ...city,
              ariaLabel: Option.none(),
              path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
            },
            words("."),
          ],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/p",
          tag: "p",
        },
      ],
      processing: Option.none(),
      responses: new Map([
        [
          "COLOUR",
          {
            areaMapping: Option.none(),
            baseType: "identifier",
            cardinality: "single",
            correct: Option.none(),
            defaultValue: Option.none(),
            identifier: "COLOUR",
            mapping: Option.none(),
          },
        ],
        [
          "CITY",
          {
            areaMapping: Option.none(),
            baseType: "string",
            cardinality: "single",
            correct: Option.none(),
            defaultValue: Option.none(),
            identifier: "CITY",
            mapping: Option.none(),
          },
        ],
      ]),
    }),
  );

/**
 * The values a recorded attempt of {@link item} holds, which a `review` render shows: `B` and
 * `Lyon`.
 */
const recordedValues = {
  CITY: one({ baseType: "string", value: "Lyon" }),
  RESPONSE: one({ baseType: "identifier", value: "B" }),
} satisfies Readonly<Record<string, Value>>;

/**
 * The correct responses of {@link item}, as an author passes them to a `solution` render.
 */
const correctValues = {
  CITY: one({ baseType: "string", value: "MarkerCorrectText" }),
  RESPONSE: one({ baseType: "identifier", value: "MarkerCorrectChoice" }),
} satisfies Readonly<Record<string, Value>>;

/**
 * Write a redacted item as JSON, every bigint, such as a count, as its decimal digits, which plain
 * `JSON.stringify` refuses to write, so nothing it holds is hidden from a search of the text.
 *
 * @param value The redacted item.
 * @returns Its JSON text.
 */
const jsonOf = (value: Redacted): string =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- `JSON.stringify` hands its replacer every value the item holds, of any type; the replacer only looks for a bigint to write out.
  JSON.stringify(value, (_key, field: unknown) =>
    Predicate.isBigInt(field) ? String(field) : field,
  );

/**
 * Give the element a render's HTML parses to: the item Root or the Status region.
 *
 * @param rendered The render.
 * @returns The first element of its HTML.
 */
const rootOf = (rendered: Rendered): Element => {
  const [root] = parseHtml(rendered.html);

  return root?.kind === "element" ? root : assert.fail("The HTML does not start with an element.");
};

/**
 * The default configuration.
 */
const defaults: Effect.Effect<Configuration, unknown> = configure({});

/**
 * Collect every element at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element, before its descendants.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Parse rendered HTML as a browser parses `innerHTML` and collect its elements.
 *
 * @param rendered The render.
 * @returns Every element of the HTML, in document order.
 */
const elementsIn = (rendered: Rendered): readonly Element[] => elementsOf(parseHtml(rendered.html));

/**
 * Give the Controls of one response: the elements posting under its default entry name.
 *
 * @param elements The render's elements.
 * @param token The render's instance token.
 * @param response The response identifier.
 * @returns The elements whose `name` is `entryName(token, response)`.
 */
const controlsOf = (
  elements: readonly Element[],
  token: string,
  response: string,
): readonly Element[] =>
  elements.filter((element) => element.attrs["name"] === entryName(token, response));

/**
 * Give the choices a render of {@link shuffled} presents: its `PLANET` Controls' values, in the
 * order the HTML emits them.
 *
 * @param rendered The render.
 * @returns Each Control's `value`, in emitted order.
 */
const presentedIn = (rendered: Rendered): readonly string[] =>
  controlsOf(elementsIn(rendered), rendered.instance, "PLANET").map((control) => {
    const { value } = control.attrs;

    return value === undefined || value === true ? assert.fail("A Control has no value.") : value;
  });

/**
 * Give a result's failure, after checking it is a `Result`.
 *
 * @param result The result of a render.
 * @returns The failure, none on success.
 */
const failureOf = <E>(result: Result.Result<Rendered, E>): Option.Option<E> => {
  assert.isTrue(Result.isResult(result));

  return Result.getFailure(result);
};

/**
 * Give the fields of an {@link InvalidInstance} a render failed with.
 *
 * @param result The result of a render.
 * @returns The failure's fields when it is an `InvalidInstance`, its tag when it is another
 *   failure, and none on success.
 */
const instanceFailure = (
  result: Result.Result<Rendered, { readonly _tag: string }>,
): Option.Option<
  string | { requirement: InstanceRequirement; source: InvalidInstance["source"]; token: string }
> =>
  Option.map(failureOf(result), (failure) =>
    failure instanceof InvalidInstance
      ? { requirement: failure.requirement, source: failure.source, token: failure.token }
      : failure._tag,
  );

/**
 * Hand `render` an accepted document and a hand-built item, which its type refuses: the type
 * tests are the `@ts-expect-error`s below, which `tsc` fails on if a call ever type-checks. No
 * test calls it.
 *
 * @param configuration The configuration.
 * @returns What `render` would make of each.
 */
const renderUnredacted = (configuration: Configuration): readonly unknown[] => [
  // @ts-expect-error -- an `Accepted` is not `Redacted`: `redact` makes one from it.
  render(acceptForTest(item), configuration),
  // @ts-expect-error -- an `Item` is not `Redacted`: only `redactItem` makes one, through `redact`.
  render(item, configuration),
];

/**
 * Hand `redact` a hand-built item holding a `javascript:` href and an `onclick`, which its type
 * refuses: only `check`'s `Accepted` reaches it, so the item never renders. No test calls it.
 *
 * @returns What `redact` would make of it.
 */
const redactUnchecked = (): Redacted =>
  // @ts-expect-error -- an `Item` is not `Accepted`: only `check` makes one, after it strips the onclick and the href.
  redact(unsafe);

describe("render", () => {
  it.effect("returns a Result: the Root around the body, and no form, submit or hidden part", () =>
    Effect.gen(function* rendersRoot() {
      const configuration = yield* defaults;
      const result = render(redacted, configuration, { instance });
      assert.isTrue(Result.isResult(result));

      const rendered = yield* Effect.fromResult(result);
      const [root, ...rest] = parseHtml(rendered.html);
      assert.deepStrictEqual(rest, []);
      assert.strictEqual(
        root?.kind === "element" ? root.tag : root,
        rowFor("item", "root").element,
      );
      assert.strictEqual(
        root?.kind === "element" ? root.attrs["id"] : root,
        scopedId(instance, "item"),
      );

      const elements = elementsIn(rendered);
      const tags = elements.map((element) => element.tag);
      assert.includeMembers(tags, ["p", "fieldset", "input", "img"]);
      assert.notInclude(tags, "form");
      assert.notInclude(tags, "button");
      assert.notInclude(
        elements.map((element) => element.attrs["type"]),
        "submit",
      );
      for (const marker of markers) {
        assert.notInclude(rendered.html, marker);
      }
    }),
  );

  it.effect("[Q-2] fails UnknownPart for an override of a part the table lacks", () =>
    Effect.gen(function* unknownPart() {
      const configuration = yield* defaults;
      const result = render(redacted, configuration, {
        instance,
        parts: { "choice-interaction": { knob: (props, children) => h("span", props, children) } },
      });

      assert.deepStrictEqual(
        Option.map(failureOf(result), (failure) =>
          failure._tag === "UnknownPart"
            ? { _tag: failure._tag, interaction: failure.interaction, part: failure.part }
            : failure._tag,
        ),
        Option.some({
          _tag: "UnknownPart" as const,
          interaction: "choice-interaction",
          part: Option.some("knob"),
        }),
      );
    }),
  );

  it.effect("[Q-2] fails PartSwapRefused for a Control replaced by a div", () =>
    Effect.gen(function* swapRefused() {
      const configuration = yield* defaults;
      const result = render(redacted, configuration, {
        instance,
        parts: {
          "choice-interaction": { control: (props, children) => h("div", props, children) },
        },
      });

      assert.deepStrictEqual(
        Option.map(failureOf(result), (failure) =>
          failure._tag === "PartSwapRefused"
            ? { _tag: failure._tag, cause: failure.cause, part: failure.part }
            : failure._tag,
        ),
        Option.some({
          _tag: "PartSwapRefused" as const,
          cause: "root-not-allowed" as const,
          part: "control",
        }),
      );
    }),
  );

  it("refuses, in its type, an Accepted and an Item; redact refuses a hand-built Item", () => {
    assert.isFunction(renderUnredacted);
    assert.isFunction(redactUnchecked);
  });

  it.effect("[Q-2] [Q-20] given messages, writes one autofocus, on the first invalid Control", () =>
    Effect.gen(function* autofocus() {
      const configuration = yield* defaults;
      const cityMessage = { response: "CITY", text: "Name a city." };
      const messages = [cityMessage, { response: "RESPONSE", text: "Choose one." }];
      const elements = elementsIn(
        yield* Effect.fromResult(render(redacted, configuration, { instance, messages })),
      );
      const focused = elements.filter((element) => "autofocus" in element.attrs);
      assert.deepStrictEqual(focused, controlsOf(elements, instance, "RESPONSE").slice(0, 1));

      const cityOnly = elementsIn(
        yield* Effect.fromResult(
          render(redacted, configuration, { instance, messages: [cityMessage] }),
        ),
      );
      assert.deepStrictEqual(
        cityOnly.filter((element) => "autofocus" in element.attrs),
        controlsOf(cityOnly, instance, "CITY"),
      );

      const none = elementsIn(
        yield* Effect.fromResult(render(redacted, configuration, { instance })),
      );
      assert.deepStrictEqual(
        none.filter((element) => "autofocus" in element.attrs),
        [],
      );
    }),
  );

  it.effect("gives byte-equal HTML for two runs with the same instance and inputs", () =>
    Effect.gen(function* deterministic() {
      const configuration = yield* defaults;
      const options: Options = {
        instance,
        messages: [{ response: "RESPONSE", text: "Choose one." }],
        posted: { RESPONSE: ["B"] },
      };
      const first = yield* Effect.fromResult(render(redacted, configuration, options));
      const second = yield* Effect.fromResult(render(redacted, configuration, options));
      assert.isAbove(first.html.length, 0);
      assert.strictEqual(first.html, second.html);
    }),
  );

  it.effect("[Q-2] restores posted strings, a Record by response, when it has messages", () =>
    Effect.gen(function* restoresPosted() {
      const configuration = yield* defaults;
      const elements = elementsIn(
        yield* Effect.fromResult(
          render(redacted, configuration, {
            instance,
            messages: [{ response: "RESPONSE", text: "Choose one." }],
            posted: { RESPONSE: ["B"] },
            values: { RESPONSE: one({ baseType: "identifier", value: "A" }) },
          }),
        ),
      );
      const checked = controlsOf(elements, instance, "RESPONSE").filter(
        (control) => "checked" in control.attrs,
      );
      assert.deepStrictEqual(
        checked.map((control) => control.attrs["value"]),
        ["B"],
      );
    }),
  );

  it.effect(
    "[Q-2] [Q-20] shows values, takes names and disabled, and prefers options.assetBase",
    () =>
      Effect.gen(function* readsOptions() {
        const configuration = yield* configure({ assetBase: "https://config.example/" });
        const shown = elementsIn(
          yield* Effect.fromResult(
            render(redacted, configuration, {
              instance,
              values: {
                CITY: one({ baseType: "string", value: "Lyon" }),
                RESPONSE: one({ baseType: "identifier", value: "C" }),
              },
            }),
          ),
        );
        assert.deepStrictEqual(
          controlsOf(shown, instance, "RESPONSE")
            .filter((control) => "checked" in control.attrs)
            .map((control) => control.attrs["value"]),
          ["C"],
        );
        assert.deepStrictEqual(
          controlsOf(shown, instance, "CITY").map((control) => control.attrs["value"]),
          ["Lyon"],
        );
        assert.deepStrictEqual(
          shown.filter((element) => element.tag === "img").map((image) => image.attrs["src"]),
          ["https://config.example/images/france.png"],
        );

        const named = elementsIn(
          yield* Effect.fromResult(
            render(redacted, configuration, {
              assetBase: "https://option.example/assets/",
              disabled: true,
              instance,
              names: { RESPONSE: "capital" },
            }),
          ),
        );
        assert.lengthOf(
          named.filter((element) => element.attrs["name"] === "capital"),
          3,
        );
        assert.strictEqual(named[0]?.attrs["data-disabled"], "");
        assert.deepStrictEqual(
          named.filter((element) => element.tag === "img").map((image) => image.attrs["src"]),
          ["https://option.example/assets/images/france.png"],
        );
      }),
  );
});

describe("render, an Inline Choice", () => {
  it.effect(
    "[Q-12] renders the select with its Placeholder and Options, and numbers its Control with a Text Entry",
    () =>
      Effect.gen(function* rendersInlineChoice() {
        const configuration = yield* defaults;
        const elements = elementsIn(
          yield* Effect.fromResult(render(sentence(colours), configuration, { instance })),
        );
        const [select] = controlsOf(elements, instance, "COLOUR");
        assert.strictEqual(select?.tag, "select");
        assert.deepStrictEqual(
          (select?.children ?? []).map((option) =>
            option.kind === "element" ? [option.tag, option.attrs["value"], textOf(option)] : [],
          ),
          [
            ["option", "", message("en", "selectPrompt")],
            ["option", "R", "red"],
            ["option", "G", "green"],
            ["option", "B", "blue"],
          ],
        );
        assert.deepStrictEqual(
          [
            ...controlsOf(elements, instance, "COLOUR"),
            ...controlsOf(elements, instance, "CITY"),
          ].map((control) => [control.tag, control.attrs["aria-label"]]),
          [
            ["select", "Answer 1 of 2"],
            ["input", "Answer 2 of 2"],
          ],
        );
      }),
  );

  it.effect(
    "[Q-12] counts an Inline Choice whose qti-label is empty, writing no aria-labelledby and the Label's for",
    () =>
      Effect.gen(function* emptyLabel() {
        const configuration = yield* defaults;
        const elements = elementsIn(
          yield* Effect.fromResult(
            render(sentence({ ...colours, label: Option.some([]) }), configuration, { instance }),
          ),
        );
        const [select] = controlsOf(elements, instance, "COLOUR");
        assert.deepStrictEqual(
          [
            ...controlsOf(elements, instance, "COLOUR"),
            ...controlsOf(elements, instance, "CITY"),
          ].map((control) => control.attrs["aria-label"]),
          ["Answer 1 of 2", "Answer 2 of 2"],
        );
        assert.isFalse("aria-labelledby" in (select?.attrs ?? {}));

        const labels = elements.filter((element) => element.tag === "label");
        assert.deepStrictEqual(
          labels.map((label) => label.attrs["for"]),
          [select?.attrs["id"]],
        );
      }),
  );

  it.effect(
    "[Q-12] names by Q10 an Inline Choice whose aria-labelledby names only an id inside a choice",
    () =>
      Effect.gen(function* idInsideChoice() {
        const configuration = yield* defaults;
        const hinted: InlineChoiceInteraction = {
          ...colours,
          ariaLabelledby: Option.some("hint"),
          choices: colours.choices.map((entry) =>
            entry.identifier === "G"
              ? {
                  ...entry,
                  content: [
                    {
                      attributes: [{ name: "id", value: "hint" }],
                      children: [words("green")],
                      kind: "element",
                      path: `${colours.path}/qti-inline-choice[2]/span`,
                      tag: "span",
                    },
                  ],
                }
              : entry,
          ),
        };
        const elements = elementsIn(
          yield* Effect.fromResult(render(sentence(hinted), configuration, { instance })),
        );
        const [select] = controlsOf(elements, instance, "COLOUR");
        assert.isFalse("aria-labelledby" in (select?.attrs ?? {}));
        assert.strictEqual(select?.attrs["aria-label"], "Answer 1 of 2");
        assert.isFalse(
          elements.some((element) => String(element.attrs["id"] ?? "").includes("hint")),
        );
      }),
  );
});

describe("render, the mode", () => {
  it.effect(
    "names the mode in the Root's data-mode: answering by default, else the one asked for",
    () =>
      Effect.gen(function* rootMode() {
        const configuration = yield* defaults;
        const modes: readonly (readonly [RenderMode | undefined, RenderMode])[] = [
          [undefined, "answering"],
          ["answering", "answering"],
          ["review", "review"],
          ["solution", "solution"],
        ];
        for (const [asked, named] of modes) {
          const options: Options = asked === undefined ? { instance } : { instance, mode: asked };
          const rendered = yield* Effect.fromResult(render(redacted, configuration, options));
          assert.strictEqual(rootOf(rendered).attrs["data-mode"], named, String(asked));
        }
      }),
  );

  it.effect("gives the same HTML for the default and for answering named", () =>
    Effect.gen(function* answeringByDefault() {
      const configuration = yield* defaults;
      for (const options of [
        { instance },
        { disabled: true, instance, values: recordedValues },
        {
          instance,
          messages: [{ response: "CITY", text: "Enter a city." }],
          posted: { CITY: [""] },
        },
      ] satisfies readonly Options[]) {
        const unnamed = yield* Effect.fromResult(render(redacted, configuration, options));
        const named = yield* Effect.fromResult(
          render(redacted, configuration, { ...options, mode: "answering" }),
        );
        assert.strictEqual(named.html, unnamed.html);
      }
    }),
  );

  it.effect(
    "shows no mapping, default or rule value in review or solution, and a correct response only as the author's values",
    () =>
      Effect.gen(function* hiddenInEveryMode() {
        const configuration = yield* defaults;
        const review = yield* Effect.fromResult(
          render(redacted, configuration, { instance, mode: "review", values: recordedValues }),
        );
        const bare = yield* Effect.fromResult(
          render(redacted, configuration, { instance, mode: "solution" }),
        );
        const solved = yield* Effect.fromResult(
          render(redacted, configuration, { instance, mode: "solution", values: correctValues }),
        );

        for (const marker of markers) {
          assert.notInclude(review.html, marker, `review holds ${marker}`);
          assert.notInclude(bare.html, marker, `solution without values holds ${marker}`);
        }
        for (const marker of hiddenMarkers) {
          assert.notInclude(solved.html, marker, `solution holds ${marker}`);
        }
        assert.include(solved.html, "MarkerCorrectText");
        for (const marker of correctMarkers) {
          assert.notInclude(jsonOf(redacted), marker, `redact's output holds ${marker}`);
        }
      }),
  );
});

describe("render, a shuffled Choice", () => {
  it.effect("[Q-2] gives byte-equal HTML for two renders with the same instance and seed", () =>
    Effect.gen(function* seededTwice() {
      const configuration = yield* configure({ seed: "7" });
      const first = yield* Effect.fromResult(render(shuffled, configuration, { instance }));
      const second = yield* Effect.fromResult(render(shuffled, configuration, { instance }));

      assert.isAbove(first.html.length, 0);
      assert.strictEqual(first.html, second.html);
    }),
  );

  it.effect(
    '[Q-2] keys the order by the instance alone when no seed is set, and seed "7" presents another',
    () =>
      Effect.gen(function* unseededOrder() {
        const unseeded = yield* configure({});
        assert.isFalse(Object.hasOwn(unseeded, "seed"));

        const first = yield* Effect.fromResult(render(shuffled, unseeded, { instance }));
        const second = yield* Effect.fromResult(render(shuffled, unseeded, { instance }));
        assert.strictEqual(first.html, second.html);

        const seeded = yield* Effect.fromResult(
          render(shuffled, yield* configure({ seed: "7" }), { instance }),
        );
        assert.deepStrictEqual(presentedIn(first), ["P3", "P1", "P0", "P4", "P2"]);
        assert.deepStrictEqual(presentedIn(seeded), ["P2", "P4", "P3", "P1", "P0"]);
        assert.notDeepEqual(presentedIn(first), presentedIn(seeded));
      }),
  );

  it.effect(
    "[Q-2] [keyboard] a radio walk (Tab, ArrowDown, Tab, Enter) posts the presented second choice",
    () =>
      Effect.gen(function* shuffledWalk() {
        const rendered = yield* Effect.fromResult(
          render(shuffled, yield* configure({ seed: "7" }), { instance }),
        );
        const [root] = parseHtml(rendered.html);
        const page = h("div", { lang: "en" }, [
          h("form", { action: "/submit", method: "post", novalidate: true }, [
            root ?? assert.fail("The render is empty."),
            h("button", { type: "submit" }, [text("Submit")]),
          ]),
        ]);
        const presentedSecond =
          presentedIn(rendered)[1] ?? assert.fail("The Choice presents fewer than two choices.");

        assert.notStrictEqual(presentedSecond, planets.choices[1]?.identifier);
        assert.deepStrictEqual(
          keyboardWalk(page, ["Tab", "ArrowDown", "Tab", "Enter"]),
          Option.some([[entryName(instance, "PLANET"), presentedSecond]]),
        );
        assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), []);
      }),
  );
});

describe("render, the instance token", () => {
  it.effect("fails InvalidInstance naming the requirement a token breaks", () =>
    Effect.gen(function* invalidTokens() {
      const configuration = yield* defaults;
      const cases: readonly (readonly [string, InstanceRequirement])[] = [
        ["", "non-empty"],
        ["a b", "characters"],
        ["«r1»", "characters"],
        ["ab-", "id-boundary"],
        ["a--b", "id-boundary"],
      ];
      for (const [token, requirement] of cases) {
        assert.deepStrictEqual(
          instanceFailure(render(redacted, configuration, { instance: token })),
          Option.some({ requirement, source: "options.instance" as const, token }),
          token,
        );
      }
    }),
  );

  it.effect("renders React's useId forms, a plain token and a UUID, every id under the token", () =>
    Effect.gen(function* validTokens() {
      const configuration = yield* defaults;
      for (const token of ["_r_1_", ":r1:", "q1", instance]) {
        const elements = elementsIn(
          yield* Effect.fromResult(render(redacted, configuration, { instance: token })),
        );
        const ids = elements.flatMap((element) => {
          const { id } = element.attrs;

          return id === undefined || id === true ? [] : [id];
        });
        assert.isAbove(ids.length, 3, token);
        assert.include(ids, `${token}--intro`, token);
        for (const id of ids) {
          assert.isTrue(id.startsWith(`${token}-`), `${token}: ${id}`);
        }
        assert.lengthOf(controlsOf(elements, token, "RESPONSE"), 3, token);
      }
    }),
  );

  it.effect("draws a lowercase UUID that checkInstance admits when no instance is given", () =>
    Effect.gen(function* drawnToken() {
      const configuration = yield* defaults;
      const [root] = parseHtml((yield* Effect.fromResult(render(redacted, configuration))).html);
      const id = root?.kind === "element" ? root.attrs["id"] : undefined;
      assert.isString(id);

      const drawn = String(id).replace(/-item$/u, "");
      assert.match(drawn, /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/u);
      assert.deepStrictEqual(checkInstance(drawn), Option.none());
    }),
  );

  it.effect("returns the instance it used, which validates and partitions its entries", () =>
    Effect.gen(function* returnedToken() {
      const configuration = yield* defaults;
      const drawn = yield* Effect.fromResult(render(redacted, configuration));
      assert.match(drawn.instance, /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/u);
      assert.deepStrictEqual(checkInstance(drawn.instance), Option.none());

      const elements = elementsIn(drawn);
      assert.strictEqual(elements[0]?.attrs["id"], scopedId(drawn.instance, "item"));

      const posted: readonly Entry[] = elements.flatMap((element) => {
        const { name } = element.attrs;

        return name === undefined || name === true ? [] : [[name, "x"] as const];
      });
      const host: Entry = ["csrf-token", "abc"];
      assert.lengthOf(posted, 4);
      assert.includeMembers(
        posted.map(([name]) => name),
        [entryName(drawn.instance, "RESPONSE"), entryName(drawn.instance, "CITY")],
      );
      assert.deepStrictEqual(partition([...posted, host], drawn.instance), {
        foreign: [],
        host: [host],
        own: posted,
      });

      const passed = yield* Effect.fromResult(render(redacted, configuration, { instance: "q1" }));
      assert.strictEqual(passed.instance, "q1");
    }),
  );
});

/**
 * An item whose template processing runs, with a paragraph that prints the template variable `N`,
 * declared with the default 3, and no response processing.
 */
const counting: Item = {
  ...item,
  body: [
    {
      attributes: [],
      children: [
        words("There are "),
        {
          base: { _tag: "literal", value: 10n },
          delimiter: ";",
          field: Option.none(),
          format: Option.none(),
          identifier: "N",
          index: Option.none(),
          kind: "printed-variable",
          mappingIndicator: "=",
          path: "qti-assessment-item/qti-item-body/p/qti-printed-variable",
          powerForm: false,
        },
        words(" cities."),
      ],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  processing: Option.none(),
  templateProcessing: Option.some([]),
  templates: new Map([
    [
      "N",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.some(one({ baseType: "integer", value: 3n })),
        identifier: "N",
        mathVariable: false,
        paramVariable: false,
      },
    ],
  ]),
};

/**
 * Give the texts of the Notice parts a render shows, in document order.
 *
 * @param rendered The render.
 * @returns Each Notice's text.
 */
const noticesIn = (rendered: Rendered): readonly string[] =>
  elementsIn(rendered)
    .filter((element) => element.attrs["data-slot"] === rowFor("item", "notice").slot)
    .map(textOf);

describe("redact, a printed variable", () => {
  it.effect("[I-5] prints the value the record holds, which render writes as text", () =>
    Effect.gen(function* printsRecorded() {
      const configuration = yield* defaults;
      const recorded = redact(acceptForTest(counting), {
        outcomes: {},
        templates: { N: one({ baseType: "integer", value: 7n }) },
      });
      const rendered = yield* Effect.fromResult(render(recorded, configuration, { instance }));

      assert.include(textOf(rootOf(rendered)), "There are 7 cities.");
      assert.deepStrictEqual(noticesIn(rendered), []);
    }),
  );

  it.effect(
    "[I-5] shows a templated item's printed variable as its notice when no record is passed (H3)",
    () =>
      Effect.gen(function* withholdsUnrecorded() {
        const configuration = yield* defaults;
        const rendered = yield* Effect.fromResult(
          render(redact(acceptForTest(counting)), configuration, { instance }),
        );

        assert.deepStrictEqual(noticesIn(rendered), [
          message(configuration.locale, "notice", { feature: "qti-printed-variable" }),
        ]);
        assert.notInclude(textOf(rootOf(rendered)), "There are 3");
      }),
  );

  it.effect(
    "[I-5] prints the declared default of an item without template processing when no record is passed (H3)",
    () =>
      Effect.gen(function* printsDeclared() {
        const configuration = yield* defaults;
        const declared = redact(acceptForTest({ ...counting, templateProcessing: Option.none() }));
        const rendered = yield* Effect.fromResult(render(declared, configuration, { instance }));

        assert.include(textOf(rootOf(rendered)), "There are 3 cities.");
        assert.deepStrictEqual(noticesIn(rendered), []);
      }),
  );
});

describe("renderStatus", () => {
  /**
   * A scored Status input for {@link instance}.
   */
  const scored: StatusInput = { heading: "scored", instance, score: "1" };

  it.effect("[I-0] returns { html, instance }, whose html parses to the Status region", () =>
    Effect.gen(function* statusRegion() {
      const configuration = yield* defaults;
      const result = renderStatus(scored, configuration);
      assert.isTrue(Result.isResult(result));

      const rendered = yield* Effect.fromResult(result);
      assert.deepStrictEqual(Object.keys(rendered).toSorted(), ["html", "instance"]);
      assert.strictEqual(rendered.instance, instance);

      const [region, ...rest] = parseHtml(rendered.html);
      assert.deepStrictEqual(rest, []);
      assert.strictEqual(region?.kind, "element");
      if (region?.kind === "element") {
        assert.strictEqual(region.tag, rowFor("item", "status").element);
        assert.strictEqual(region.attrs["role"], "status");
        assert.strictEqual(region.attrs["id"], scopedId(instance, "status"));
      }
    }),
  );

  it.effect("names the region by each heading of a review, a solution, a part and a test", () =>
    Effect.gen(function* statusHeadings() {
      const configuration = yield* defaults;
      for (const heading of ["review", "solution", "partSubmitted", "testFinished"] as const) {
        const region = rootOf(
          yield* Effect.fromResult(renderStatus({ heading, instance }, configuration)),
        );
        const title = region.children.find((child) => child.kind === "element");
        assert.strictEqual(region.attrs["role"], "status");
        assert.strictEqual(
          title?.kind === "element" ? textOf(title) : title,
          message("en", heading),
        );
        assert.strictEqual(nameOf(region, region), message("en", heading));
      }
    }),
  );

  it.effect("fails InvalidInstance for an input.instance that breaks a requirement", () =>
    Effect.gen(function* statusToken() {
      const configuration = yield* defaults;
      assert.deepStrictEqual(
        instanceFailure(renderStatus({ ...scored, instance: "ab-" }, configuration)),
        Option.some({
          requirement: "id-boundary" as const,
          source: "input.instance" as const,
          token: "ab-",
        }),
      );
    }),
  );

  it.effect("fails UnknownPart through the same overrides as render", () =>
    Effect.gen(function* statusOverrides() {
      const configuration = yield* defaults;
      assert.deepStrictEqual(
        instanceFailure(
          renderStatus(scored, configuration, {
            parts: { item: { form: (props, children) => h("form", props, children) } },
          }),
        ),
        Option.some("UnknownPart"),
      );
    }),
  );
});
