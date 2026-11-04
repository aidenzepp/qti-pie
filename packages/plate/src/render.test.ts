import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import { checkInstance, entryName } from "#plate/form/encoding.ts";
import type { InstanceRequirement } from "#plate/form/encoding.ts";
import type { BodyNode, ChoiceInteraction, Item, TextEntryInteraction } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { Redacted } from "#plate/payload.ts";
import { InvalidInstance, redact, render, renderStatus } from "#plate/render.ts";
import type { Options, Rendered } from "#plate/render.ts";
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
    { content: [words("Paris")], identifier: "A" },
    { content: [words("Lyon")], identifier: "B" },
    { content: [words("Nice")], identifier: "C" },
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
      expression: {
        kind: "base-value",
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
        baseType: "string",
        cardinality: "single",
        correct: Option.some(one({ baseType: "string", value: "MarkerCorrectText" })),
        defaultValue: Option.none(),
        identifier: "CITY",
        mapping: Option.none(),
      },
    ],
  ]),
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
});

describe("renderStatus", () => {
  /**
   * A scored Status input for {@link instance}.
   */
  const scored: StatusInput = { heading: "scored", instance, score: "1" };

  it.effect("[I-0] returns { html }, which parses to the Status region", () =>
    Effect.gen(function* statusRegion() {
      const configuration = yield* defaults;
      const result = renderStatus(scored, configuration);
      assert.isTrue(Result.isResult(result));

      const rendered = yield* Effect.fromResult(result);
      assert.deepStrictEqual(Object.keys(rendered), ["html"]);

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
