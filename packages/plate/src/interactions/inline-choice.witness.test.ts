import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  h,
  Malformed,
  open,
  partition,
  postings,
  redact,
  render,
  renderStatus,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Attributes,
  Configuration,
  Element,
  Node,
  Redacted,
  Rendered,
  ResponseValue,
  StoredRecord,
  ValidationMessage,
} from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { BodyNode, InlineChoiceInteraction, Item } from "#plate/model/item.ts";
import { choiceOrder, redactItem } from "#plate/payload.ts";
import { attribute, checkTree } from "#plate/test/accessibility.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";

/**
 * A case reads one corpus document, which takes well under a second here; the bound leaves room
 * for a slow machine without letting a hung read stall the suite.
 */
const corpusTimeoutMs = 60_000;

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "witness";

/**
 * Shakespeare's line with one Inline Choice of Gloucester, Lancaster and York, unshuffled, scored
 * by `match_correct` against York, `Y`.
 */
const quoteItem = "QTI3_BPIG_Examples/items/QTI3-inline-choice.xml";

/**
 * A Choice, an Inline Choice, a Text Entry and a Gap Match, which shows as a notice. Its Inline
 * Choice, bound to `RESPONSE2`, is shuffled: its first choice, `P2`, is fixed, and the correct one
 * is Marion, `A2`, last in the document.
 */
const legendItem = "qtiv3-examples/packaging/items/multi-input.xml";

/**
 * The seed the shuffled case renders with. Under it and {@link instance}, the legend's Inline
 * Choice presents `P2`, then Marion, `A2`, then `B2` and `C2`, so Marion is not where the document
 * puts it.
 */
const seed = "1";

/**
 * What a forged post carries for the legend's Inline Choice: Marion's identifier in lower case,
 * which names no choice because identifiers compare exactly. No keys post it: the legend sets no
 * `required`, `min-choices` or pattern, so nothing a walk posts is refused.
 */
const forged = "a2";

/**
 * An item `open` accepted, and its redaction, the one input `render` takes.
 */
interface Opened {
  readonly accepted: Accepted;
  readonly redacted: Redacted;
}

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * A hand-built Inline Choice of three fruits, `A`, `B` and `C`, unshuffled, with a Label that
 * gives text and no Placeholder text, bound to `RESPONSE`.
 */
const fruits: InlineChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  choices: [
    {
      content: [words("apples")],
      fixed: false,
      identifier: "A",
      templateVisibility: Option.none(),
    },
    { content: [words("pears")], fixed: false, identifier: "B", templateVisibility: Option.none() },
    { content: [words("plums")], fixed: false, identifier: "C", templateVisibility: Option.none() },
  ],
  class: "",
  kind: "inline-choice",
  label: Option.some([words("Fruit")]),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response: "RESPONSE",
  shuffle: false,
};

/**
 * A hand-built item whose body is one sentence holding {@link fruits}, its response a single
 * identifier with no default value and no processing, accepted and redacted through the test
 * seams, as no corpus document holds a host replacement.
 */
const fruitItem: Opened = (() => {
  const item: Item = {
    body: [
      {
        attributes: [],
        children: [words("I would like "), fruits, words(".")],
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      },
    ],
    document: "items/fruit.xml",
    identifier: "fruit",
    lang: Option.none(),
    outcomes: new Map(),
    processing: Option.none(),
    responses: new Map([
      [
        fruits.response,
        {
          areaMapping: Option.none(),
          baseType: "identifier",
          cardinality: "single",
          correct: Option.none(),
          defaultValue: Option.none(),
          identifier: fruits.response,
          mapping: Option.none(),
        },
      ],
    ]),
    templateProcessing: Option.none(),
    templates: new Map(),
    title: "Fruit",
    unsupported: [],
  };

  return { accepted: acceptForTest(item), redacted: redactItem(item) };
})();

/**
 * Open a corpus document as a host opens one it read from storage, and require a verdict that
 * accepts it, with or without unsupported parts.
 *
 * @param location The document's path under the corpus root.
 * @returns The accepted document and its redaction.
 */
const openCorpus = Effect.fnUntraced(function* openCorpus(location: string) {
  const verdict = yield* open(location, yield* readCorpusFile(location));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );

  return { accepted, redacted: redact(accepted) };
});

/**
 * Give the item's one Inline Choice.
 *
 * @param opened The item.
 * @returns Its Inline Choice.
 */
const inlineChoiceOf = (opened: Opened): InlineChoiceInteraction => {
  const [only, ...rest] = interactionsIn(opened.accepted.item.body).flatMap((interaction) =>
    interaction.kind === "inline-choice" ? [interaction] : [],
  );
  assert.lengthOf(rest, 0, "the item has one Inline Choice");

  return only ?? assert.fail("the item has no Inline Choice");
};

/**
 * Parse an HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the `select` that posts a response in a page.
 *
 * @param page The page.
 * @param response The response identifier.
 * @returns The one `select` named by the response's entry name.
 */
const selectOf = (page: Element, response: string): Element => {
  const [only, ...rest] = elementsOf([page]).filter(
    (element) =>
      element.tag === "select" && attribute(element, "name") === entryName(instance, response),
  );
  assert.lengthOf(rest, 0, `one select posts ${response}`);

  return only ?? assert.fail(`no select posts ${response}`);
};

/**
 * Give the `option`s of the `select` that posts a response, in the order it presents them, the
 * Placeholder first.
 *
 * @param page The page.
 * @param response The response identifier.
 * @returns The options.
 */
const optionsOf = (page: Element, response: string): readonly Element[] =>
  selectOf(page, response).children.filter(
    (child): child is Element => child.kind === "element" && child.tag === "option",
  );

/**
 * Give the values of the `option`s of the `select` that posts a response, the Placeholder's `""`
 * first.
 *
 * @param page The page.
 * @param response The response identifier.
 * @returns The values, in presented order.
 */
const valuesIn = (page: Element, response: string): readonly string[] =>
  optionsOf(page, response).map(
    (option) => attribute(option, "value") ?? assert.fail("an option has no value"),
  );

/**
 * Compose the page an author serves around one render, and check it: the Status part when there is
 * one, then the author's native form holding the item and its submit control, under a `div` that
 * gives the language. `checkTree` must pass on every page, so each step of a case is checked.
 *
 * @param item The item's render.
 * @param status The Status part's render, when the page shows one.
 * @returns The page's root.
 */
const pageOf = (item: Rendered, status: Option.Option<Rendered>): Element => {
  const page = rootOf(
    `<div lang="en">${Option.match(status, { onNone: () => "", onSome: (part) => part.html })}<form action="/submit" method="post" novalidate>${item.html}<button type="submit">Submit</button></form></div>`,
  );

  assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), [], "checkTree passes on the page");

  return page;
};

/**
 * Compose the first page of an item: its render with no inputs, in the author's form.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @returns The page's root.
 */
const firstPage = Effect.fnUntraced(function* firstPage(
  opened: Opened,
  configuration: Configuration,
) {
  return pageOf(
    yield* Effect.fromResult(render(opened.redacted, configuration, { instance })),
    Option.none(),
  );
});

/**
 * The entries a form posts, each a control's name and the text it sends, as a keyboard walk gives
 * them: the walk posts no file.
 */
type Posts = readonly (readonly [string, string])[];

/**
 * Walk a page by keys until its form submits.
 *
 * @param page The page walked.
 * @param keys The keys pressed, which must submit the form.
 * @returns The entries the form posts.
 */
const walk = (page: Element, keys: readonly Key[]): Posts =>
  Option.getOrElse(keyboardWalk(page, keys), () => assert.fail("the keys never submit the form"));

/**
 * What one post gave: each response the item's postings name, decoded, the strings the post sent
 * for each, and `checkResponses`' messages.
 */
interface Posted {
  readonly decoded: Readonly<Record<string, ResponseValue | Malformed>>;
  readonly messages: readonly ValidationMessage[];
  readonly sent: Readonly<Record<string, readonly string[]>>;
}

/**
 * Take a post as a host does: keep the entries named for the instance, decode each response the
 * item's postings name under its entry name and in its base, and check the responses.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @param entries The entries posted.
 * @returns The decoded responses, the strings sent, and the messages.
 */
const take = (opened: Opened, configuration: Configuration, entries: Posts): Posted => {
  const { own } = partition(entries, instance);
  const each = postings(opened.redacted, instance);
  const decoded = Object.fromEntries(
    each.map(
      ({ binding, identifier, options }) =>
        [identifier, Result.merge(decode(own, binding, options))] as const,
    ),
  );
  const sent = Object.fromEntries(
    each.map(({ binding, identifier }) => [
      identifier,
      entries.flatMap(([name, value]) => (name === binding.name ? [value] : [])),
    ]),
  );

  return { decoded, messages: checkResponses(opened.accepted, decoded, configuration), sent };
};

/**
 * Score an accepted post.
 *
 * @param opened The item.
 * @param posted The post, which `checkResponses` must accept.
 * @returns The record `score` returns.
 */
const scored = Effect.fnUntraced(function* scored(opened: Opened, posted: Posted) {
  assert.deepStrictEqual(posted.messages, [], "the post is accepted");

  const values = Object.fromEntries(
    Object.entries(posted.decoded).map(
      ([response, value]) =>
        [
          response,
          value instanceof Malformed ? assert.fail(`${response} is malformed`) : value,
        ] as const,
    ),
  );

  return yield* Effect.fromResult(score(opened.accepted, values));
});

/**
 * Give one variable of a stored record, as the values it stores.
 *
 * @param values The record's outcomes or its responses, by identifier, which share one type.
 * @param identifier The variable.
 * @returns The stored values, none when the record lacks the variable or it is NULL.
 */
const valuesOf = (values: StoredRecord["outcomes"], identifier: string): readonly unknown[] =>
  values[identifier]?.values.map((single) => single.value) ?? [];

describe("the Inline Choice witness: open, redact, render, keys, postings, decode, checkResponses and score", () => {
  it.effect(
    "[Q-12] [I-9b] [keyboard] QTI3-inline-choice.xml by keyboard: Tab, type Y, Tab and Enter choose York and score 1, Lancaster 0, and no choice posts the Placeholder and scores 0",
    () =>
      Effect.gen(function* quote() {
        const configuration = yield* configure({});
        const opened = yield* openCorpus(quoteItem);
        const walks: readonly (readonly [readonly Key[], string, readonly unknown[], number])[] = [
          [["Tab", { type: "Y" }, "Tab", "Enter"], "Y", ["Y"], 1],
          [["Tab", { type: "L" }, "Enter"], "L", ["L"], 0],
          [["Tab", "Tab", "Enter"], "", [], 0],
        ];

        for (const [keys, posted, chosen, expected] of walks) {
          const page = yield* firstPage(opened, configuration);

          assert.deepStrictEqual(
            tabOrder(page).map((stop) => stop.tag),
            ["select", "button"],
          );
          assert.deepStrictEqual(valuesIn(page, "RESPONSE"), ["", "G", "L", "Y"]);

          const taken = take(opened, configuration, walk(page, keys));

          assert.deepStrictEqual(taken.sent, { RESPONSE: [posted] }, "the select posts one entry");

          const record = yield* scored(opened, taken);

          assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), chosen);
          assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [expected]);
        }
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "[Q-12] [keyboard] multi-input.xml's shuffled Inline Choice keeps choiceOrder's order, its fixed choice first, across a refused post with one instance and seed, and Marion typed on the refused page posts A2",
    () =>
      Effect.gen(function* legend() {
        const configuration = yield* configure({ seed });
        const opened = yield* openCorpus(legendItem);
        const interaction = inlineChoiceOf(opened);
        const documentOrder = interaction.choices.map((choice) => choice.identifier);
        const order = choiceOrder(interaction, Option.some(seed), instance);

        assert.strictEqual(interaction.response, "RESPONSE2");
        assert.sameMembers([...order], documentOrder, "the order presents every choice once");
        assert.notDeepEqual(order, documentOrder, "the order is shuffled");
        assert.strictEqual(order[0], "P2", "the fixed choice keeps its place");

        const first = yield* firstPage(opened, configuration);

        assert.deepStrictEqual(valuesIn(first, "RESPONSE2"), ["", ...order]);
        assert.deepStrictEqual(
          tabOrder(first).map((stop) => stop.tag),
          ["input", "select", "input", "button"],
          "the Choice's radio group, then the select, the Text Entry and Submit",
        );

        const walked = walk(first, ["Tab", "Tab", "Enter"]);
        const name = entryName(instance, "RESPONSE2");

        assert.deepStrictEqual(
          walked.filter(([posted]) => posted === name),
          [[name, ""]],
          "Enter on the untouched select posts its Placeholder",
        );

        const refused = take(
          opened,
          configuration,
          walked.map(([posted, value]) => [posted, posted === name ? forged : value] as const),
        );

        assert.deepStrictEqual(refused.messages, [
          { response: "RESPONSE2", text: message("en", "unknownChoice") },
        ]);

        const status = yield* Effect.fromResult(
          renderStatus(
            { heading: "notAccepted", instance, messages: refused.messages },
            configuration,
          ),
        );
        const again = pageOf(
          yield* Effect.fromResult(
            render(opened.redacted, configuration, {
              instance,
              messages: refused.messages,
              posted: refused.sent,
            }),
          ),
          Option.some(status),
        );
        const [placeholder] = optionsOf(again, "RESPONSE2");

        assert.deepStrictEqual(valuesIn(again, "RESPONSE2"), ["", ...order], "the order survives");
        assert.deepStrictEqual(
          optionsOf(again, "RESPONSE2").filter(
            (option) => attribute(option, "selected") !== undefined,
          ),
          [placeholder ?? assert.fail("the select has no options")],
          "the forged identifier restores no choice, so the Placeholder is selected",
        );
        assert.isDefined(
          attribute(selectOf(again, "RESPONSE2"), "autofocus"),
          "the invalid select takes focus",
        );

        const answered = take(opened, configuration, walk(again, [{ type: "Marion" }, "Enter"]));

        assert.deepStrictEqual(answered.sent["RESPONSE2"], ["A2"]);

        const record = yield* scored(opened, answered);

        assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE2"), ["A2"]);
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "[Q-12] [keyboard] a host Option replacement that selects C, with nothing restored, leaves the Placeholder selected: Tab then Enter posts its empty value, not C, and the record holds no response",
    () =>
      Effect.gen(function* unprompted() {
        const configuration = yield* configure({});

        for (const extra of [{ selected: true }, { SELECTED: "" }] as const) {
          const selectingC = (props: Attributes, children: readonly Node[]): Element =>
            h("option", props["value"] === "C" ? { ...props, ...extra } : props, children);
          const page = pageOf(
            yield* Effect.fromResult(
              render(fruitItem.redacted, configuration, {
                instance,
                parts: { "inline-choice-interaction": { option: selectingC } },
              }),
            ),
            Option.none(),
          );

          assert.deepStrictEqual(valuesIn(page, fruits.response), ["", "A", "B", "C"]);

          const taken = take(fruitItem, configuration, walk(page, ["Tab", "Enter"]));

          assert.deepStrictEqual(
            taken.sent,
            { [fruits.response]: [""] },
            `under ${Object.keys(extra).join(", ")}, the select posts its Placeholder`,
          );

          const record = yield* scored(fruitItem, taken);

          assert.deepStrictEqual(valuesOf(record.responses, fruits.response), []);
        }
      }),
  );
});
