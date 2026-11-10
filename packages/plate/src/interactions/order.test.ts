import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { decodeRedacted, encodeRedacted } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import { orderModule } from "#plate/interactions/order.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { restore } from "#plate/restore.ts";
import { checkResponses } from "#plate/responses.ts";
import { score } from "#plate/score.ts";
import { solution } from "#plate/solution.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Accepted, Verdict } from "#plate/validate/verdict.ts";

/**
 * The item instance every render here passes.
 */
const instance = "q1";

/**
 * The response every Order here binds, and the entry name its hidden inputs post under.
 */
const response = "RESPONSE";

/**
 * The entry name the response posts under in {@link instance}.
 */
const name = entryName(instance, response);

/**
 * The marker of each Order part, as `partRow` derives it: a Root carries the component's name and
 * every other part `<component>-<part>`.
 */
const slot = {
  choice: "order-interaction-choice",
  choices: "order-interaction-choices",
  hidden: "order-interaction-hidden",
  ordered: "order-interaction-ordered",
  prompt: "order-interaction-prompt",
  root: "order-interaction",
  slot: "order-interaction-slot",
} as const;

/**
 * Read a fixture item of area `ei` as bytes.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns Its bytes.
 */
const fixtureBytes = (file: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/ei/items/${file}`, import.meta.url)));

/**
 * Open a fixture item as the host does, by its location and bytes.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns The verdict `open` gave.
 */
const verdictOf = (file: string) => open(`fixtures/ei/items/${file}`, fixtureBytes(file));

/**
 * Open a fixture item that `open` must accept, with or without unsupported features.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns The accepted item.
 */
const acceptedOf = Effect.fnUntraced(function* acceptedOf(file: string) {
  const verdict = yield* verdictOf(file);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${file} is ${verdict.verdict}, not accepted.`),
  );
});

/**
 * Construct the ordered identifier value that places each identifier in turn.
 *
 * @param identifiers The identifiers, in order.
 * @returns The value.
 */
const orderOf = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "ordered",
  values: identifiers.map((value) => ({ baseType: "identifier", value })),
});

/**
 * What a render of an Order shows, read from its HTML.
 */
interface Shown {
  /**
   * The identifier each choice of the source list carries, in the order shown.
   */
  readonly source: readonly string[];
  /**
   * Each position, in order: the text it holds and the identifier it names, none for an empty one.
   */
  readonly positions: readonly {
    readonly identifier: Option.Option<string>;
    readonly text: string;
  }[];
  /**
   * The value of each hidden input of the response, in document order.
   */
  readonly hidden: readonly string[];
  readonly root: Element;
  readonly html: string;
}

/**
 * Collect every element at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element, before its descendants.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read an element's attribute as a string.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @returns Its value, none when the element lacks it.
 */
const attributeOf = (element: Element, attribute: string): Option.Option<string> => {
  const value = element.attrs[attribute];

  return value === undefined ? Option.none() : Option.some(value === true ? "" : value);
};

/**
 * Tell whether an element is the part a marker names.
 *
 * @param element The element.
 * @param marker The part's `data-slot` marker.
 * @returns Whether the element carries that marker.
 */
const isPart = (element: Element, marker: string): boolean =>
  Option.exists(attributeOf(element, "data-slot"), (written) => written === marker);

/**
 * Read what a render of an Order shows from its HTML.
 *
 * @param html The item's HTML.
 * @returns The source list, the positions and the hidden inputs.
 */
const shownIn = (html: string): Shown => {
  const elements = elementsOf(parseHtml(html));
  const marked = (marker: string) => elements.filter((element) => isPart(element, marker));
  const [root] = marked(slot.root);

  return {
    hidden: marked(slot.hidden).flatMap((input) => Option.toArray(attributeOf(input, "value"))),
    html,
    positions: marked(slot.slot).map((position) => ({
      identifier: attributeOf(position, "data-identifier"),
      text: textOf(position),
    })),
    root: root ?? assert.fail("The HTML holds no Order Root."),
    source: marked(slot.choice).flatMap((choice) =>
      Option.toArray(attributeOf(choice, "data-identifier")),
    ),
  };
};

/**
 * The inputs of one render of a fixture: `render`'s options, and the configuration's `seed`.
 */
type Showing = Options & { readonly seed?: string };

/**
 * The messages of a refused post, which a render that restores the posted strings carries.
 */
const refused = [{ response, text: "Check the order." }];

/**
 * Render an accepted item the way a host does, with the default configuration unless the seed
 * says otherwise.
 *
 * @param accepted The accepted item.
 * @param showing The inputs of the render.
 * @returns The item's HTML.
 */
const htmlOf = Effect.fnUntraced(function* htmlOf(
  accepted: Accepted,
  { seed, ...options }: Showing = {},
) {
  const configuration = yield* configure(seed === undefined ? {} : { seed });
  const rendered = yield* Effect.fromResult(
    render(redact(accepted), configuration, { instance, ...options }),
  );

  return rendered.html;
});

/**
 * Render a fixture and read what it shows.
 *
 * @param file The fixture's file name.
 * @param showing The inputs of the render.
 * @returns What the render shows.
 */
const shownOf = Effect.fnUntraced(function* shownOf(file: string, showing: Showing = {}) {
  return shownIn(yield* htmlOf(yield* acceptedOf(file), showing));
});

/**
 * Give the messages `checkResponses` gives for one order posted to a fixture's Order.
 *
 * @param file The fixture's file name.
 * @param posted The response, or what its entries failed to decode as.
 * @param configuration The configuration.
 * @returns The messages' texts.
 */
const refusalsOf = Effect.fnUntraced(function* refusalsOf(
  file: string,
  posted: Value,
  configuration: Configuration,
) {
  const accepted = yield* acceptedOf(file);

  return checkResponses(accepted, { [response]: posted }, configuration).map(({ text }) => text);
});

/**
 * Read the SCORE a record holds.
 *
 * @param stored The stored record `score` returned.
 * @returns The outcome's float.
 */
const scoreOf = Effect.fnUntraced(function* scoreOf(stored: Parameters<typeof decodeRecord>[0]) {
  const decoded = yield* Effect.fromResult(decodeRecord(stored));
  const [value] = decoded.outcomes["SCORE"]?.values ?? [];

  return value?.baseType === "float" ? value.value : assert.fail("SCORE holds no float.");
});

/**
 * Find the Orders of an accepted item's model, in document order.
 *
 * @param accepted The accepted item.
 * @returns Each Order the body holds, among its interactions.
 */
const ordersOf = (accepted: Accepted) =>
  interactionsIn(accepted.item.body).flatMap((interaction) =>
    interaction.kind === "order" ? [interaction] : [],
  );

describe("the Order module", () => {
  it.effect("[Q-15] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      for (const file of ["order.xml", "order-subset.xml"]) {
        const verdict: Verdict = yield* verdictOf(file);

        assert.isTrue(Option.isSome(acceptedItem(verdict)), file);
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).filter(({ feature }) => feature === "qti-order-interaction"),
          [],
          file,
        );
      }
    }),
  );

  it.effect(
    "[Q-15] render emits the choices and one position per choice to order, with data-slot markers",
    () =>
      Effect.gen(function* emitsParts() {
        const all = yield* shownOf("order.xml");

        assert.strictEqual(all.root.attrs["data-slot"], slot.root);
        assert.deepStrictEqual(all.source, ["A", "B", "C", "D"]);
        assert.strictEqual(all.positions.length, 4);
        assert.deepStrictEqual(all.hidden, []);

        const parts = elementsOf(parseHtml(all.html)).flatMap((element) =>
          Option.toArray(attributeOf(element, "data-slot")),
        );

        assert.strictEqual(parts.filter((part) => part === slot.choice).length, 4);
        assert.strictEqual(parts.filter((part) => part === slot.slot).length, 4);
        assert.strictEqual(parts.filter((part) => part === slot.choices).length, 1);
        assert.strictEqual(parts.filter((part) => part === slot.ordered).length, 1);

        const choices = elementsOf(parseHtml(all.html)).find((element) =>
          isPart(element, slot.choices),
        );
        const ordered = elementsOf(parseHtml(all.html)).find((element) =>
          isPart(element, slot.ordered),
        );

        assert.strictEqual(choices?.tag, "ul");
        assert.strictEqual(ordered?.tag, "ol");
        assert.deepStrictEqual(
          [...(ordered?.children ?? [])].flatMap((child) =>
            child.kind === "element" ? [child.tag] : [],
          ),
          ["li", "li", "li", "li"],
        );

        const subset = yield* shownOf("order-subset.xml");

        assert.strictEqual(subset.source.length, 5);
        assert.strictEqual(subset.positions.length, 3);
        assert.isTrue(
          elementsOf(parseHtml(subset.html)).some((element) => isPart(element, slot.prompt)),
        );
      }),
  );

  it.effect("[Q-15] the root carries the effective bounds and the entry name", () =>
    Effect.gen(function* carriesBounds() {
      const all = yield* shownOf("order.xml");
      const subset = yield* shownOf("order-subset.xml");

      assert.strictEqual(all.root.attrs["data-min-choices"], "4");
      assert.strictEqual(all.root.attrs["data-max-choices"], "4");
      assert.strictEqual(all.root.attrs["data-entry-name"], name);
      assert.strictEqual(subset.root.attrs["data-min-choices"], "2");
      assert.strictEqual(subset.root.attrs["data-max-choices"], "3");
      assert.strictEqual(subset.root.attrs["data-entry-name"], name);
    }),
  );

  it.effect(
    "[Q-15] a restored order fills the positions in order and writes one hidden input per value, in order",
    () =>
      Effect.gen(function* restoresOrder() {
        const shown = yield* shownOf("order.xml", {
          values: { [response]: orderOf("C", "A", "D", "B") },
        });

        assert.deepStrictEqual(
          shown.positions.map(({ identifier }) => Option.getOrUndefined(identifier)),
          ["C", "A", "D", "B"],
        );
        assert.deepStrictEqual(
          shown.positions.map(({ text }) => text),
          ["Bake the cake", "Mix the batter", "Slice and serve", "Heat the oven"],
        );
        assert.deepStrictEqual(shown.hidden, ["C", "A", "D", "B"]);
        assert.deepStrictEqual(shown.source, []);

        const hiddenNames = elementsOf(parseHtml(shown.html))
          .filter((element) => isPart(element, slot.hidden))
          .map((input) => [input.tag, input.attrs["type"], input.attrs["name"]]);

        assert.deepStrictEqual(
          hiddenNames,
          Array.from({ length: 4 }, () => ["input", "hidden", name]),
        );
      }),
  );

  it.effect(
    "[Q-15] a restored subset leaves the other choices in the source list and the spare positions empty",
    () =>
      Effect.gen(function* restoresSubset() {
        const shown = yield* shownOf("order-subset.xml", {
          values: { [response]: orderOf("D", "B") },
        });

        assert.deepStrictEqual(
          shown.positions.map(({ identifier }) => Option.getOrUndefined(identifier)),
          ["D", "B", undefined],
        );
        assert.deepStrictEqual(shown.hidden, ["D", "B"]);
        assert.sameMembers([...shown.source], ["A", "C", "E"]);
      }),
  );

  it.effect(
    "[Q-15] shuffle orders the source by seed and instance and keeps a fixed choice in place",
    () =>
      Effect.gen(function* shuffles() {
        const document = ["A", "B", "C", "D", "E"];
        const orders = new Map<string, readonly string[]>();

        for (const seed of ["1", "2", "3", "4"]) {
          for (const token of ["i1", "i2", "i3"]) {
            const shown = yield* shownOf("order-subset.xml", { instance: token, seed });
            const again = yield* shownOf("order-subset.xml", { instance: token, seed });
            const key = [seed, token, response].join("\u001F");
            const expected = shuffleOrder(
              key,
              document.map((identifier) => identifier === "C"),
            ).map((index) => document[index] ?? "");

            assert.deepStrictEqual(shown.source, again.source);
            assert.deepStrictEqual(shown.source, expected);
            assert.strictEqual(shown.source.indexOf("C"), 2, `${seed} ${token}`);
            assert.sameMembers([...shown.source], document);
            orders.set(`${seed} ${token}`, shown.source);
          }
        }

        assert.isAbove(new Set([...orders.values()].map((order) => order.join(""))).size, 1);
        assert.isAbove(
          new Set(["i1", "i2", "i3"].map((token) => orders.get(`1 ${token}`)?.join(""))).size,
          1,
          "the instance changes the order",
        );
        assert.isAbove(
          new Set(["1", "2", "3", "4"].map((seed) => orders.get(`${seed} i1`)?.join(""))).size,
          1,
          "the seed changes the order",
        );
      }),
  );

  it.effect("[Q-15] sequence reports the presented order of a shuffled Order, none otherwise", () =>
    Effect.gen(function* reportsSequence() {
      const shuffled = yield* acceptedOf("order-subset.xml");
      const plain = yield* acceptedOf("order.xml");
      const seed = Option.some("3");
      const [node] = ordersOf(shuffled);
      const [unshuffled] = ordersOf(plain);
      const shown = yield* shownOf("order-subset.xml", { instance: "i2", seed: "3" });

      assert.strictEqual(
        node === undefined
          ? undefined
          : Option.getOrUndefined(orderModule.sequence(node, seed, "i2")),
        shown.source.join(" "),
      );
      assert.isTrue(
        unshuffled !== undefined && Option.isNone(orderModule.sequence(unshuffled, seed, "i2")),
      );
    }),
  );

  it.effect("[Q-15] a binding other than an ordered identifier gives the notice naming it", () =>
    Effect.gen(function* givesNotice() {
      const verdict = yield* verdictOf("order-string.xml");
      const accepted = Option.getOrElse(acceptedItem(verdict), () =>
        assert.fail("order-string.xml is not accepted."),
      );
      const unsupported = unsupportedFeatures(verdict);

      assert.deepStrictEqual(
        unsupported.map(({ feature, path, shown }) => [feature, path, shown]),
        [
          [
            'cardinality="multiple"',
            "qti-assessment-item/qti-item-body/qti-order-interaction",
            "notice",
          ],
        ],
      );

      const html = yield* htmlOf(accepted);
      const texts = elementsOf(parseHtml(html)).map((element) => textOf(element));

      assert.isTrue(
        texts.some((text) =>
          text.includes(message("en", "notice", { feature: 'cardinality="multiple"' })),
        ),
        html,
      );
      assert.isFalse(html.includes(slot.root));
      assert.deepStrictEqual(postings(redact(accepted), instance), []);
    }),
  );

  it.effect(
    "[Q-15] postings binds the response as an ordered identifier and decode keeps the posted order",
    () =>
      Effect.gen(function* bindsOrdered() {
        const accepted = yield* acceptedOf("order.xml");
        const [posting, ...rest] = postings(redact(accepted), instance);

        assert.deepStrictEqual(rest, []);
        assert.deepStrictEqual(posting?.identifier, response);
        assert.deepStrictEqual(posting?.binding, {
          baseType: "identifier",
          cardinality: "ordered",
          name,
        });

        const decoded = decode(
          [
            [name, "B"],
            [name, "A"],
          ],
          posting?.binding ?? assert.fail("The Order posts nothing."),
          posting?.options,
        );

        assert.deepStrictEqual(Result.getOrUndefined(decoded), orderOf("B", "A"));
      }),
  );

  it.effect("[Q-15] checkResponses: a choice twice is refused in tier (a)", () =>
    Effect.gen(function* refusesRepeat() {
      for (const validateResponses of [false, true]) {
        const configuration = yield* configure({ validateResponses });
        const texts = yield* refusalsOf("order.xml", orderOf("A", "A", "B"), configuration);

        assert.strictEqual(
          texts.filter((text) => text.includes("Choice A ")).length,
          1,
          String(validateResponses),
        );
        assert.deepStrictEqual(
          yield* refusalsOf("order.xml", orderOf("A", "B"), yield* configure({})),
          [],
        );
      }
    }),
  );

  it.effect("[Q-15] checkResponses: a choice no Order presents is refused in tier (a)", () =>
    Effect.gen(function* refusesStray() {
      const configuration = yield* configure({});

      assert.deepStrictEqual(yield* refusalsOf("order.xml", orderOf("Z", "A"), configuration), [
        message("en", "unknownChoice"),
      ]);
      assert.deepStrictEqual(
        yield* refusalsOf("order.xml", orderOf("A", "B", "C", "D", "E"), configuration),
        [message("en", "unknownChoice")],
      );
    }),
  );

  it.effect(
    "[Q-15] checkResponses: without min-choices every choice must be ordered, under validateResponses",
    () =>
      Effect.gen(function* needsEveryChoice() {
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });

        assert.deepStrictEqual(yield* refusalsOf("order.xml", orderOf("A", "B"), lenient), []);
        assert.deepStrictEqual(yield* refusalsOf("order.xml", orderOf("A", "B"), strict), [
          "Put all 4 choices in order.",
        ]);
        assert.deepStrictEqual(
          yield* refusalsOf("order.xml", orderOf("B", "A", "C", "D"), strict),
          [],
        );
        assert.deepStrictEqual(
          yield* refusalsOf("order.xml", { ...orderOf(), values: [] }, strict),
          ["Put all 4 choices in order."],
        );
      }),
  );

  it.effect("[Q-15] checkResponses: the subset bounds of order-subset.xml", () =>
    Effect.gen(function* checksSubset() {
      const lenient = yield* configure({});
      const strict = yield* configure({ validateResponses: true });

      assert.deepStrictEqual(yield* refusalsOf("order-subset.xml", orderOf("D"), lenient), []);
      assert.deepStrictEqual(yield* refusalsOf("order-subset.xml", orderOf("D"), strict), [
        "Put at least two items in order.",
      ]);
      assert.deepStrictEqual(yield* refusalsOf("order-subset.xml", orderOf("D", "A"), strict), []);
      assert.deepStrictEqual(
        yield* refusalsOf("order-subset.xml", orderOf("D", "A", "B"), strict),
        [],
      );

      for (const configuration of [lenient, strict]) {
        assert.deepStrictEqual(
          yield* refusalsOf("order-subset.xml", orderOf("D", "A", "B", "E"), configuration),
          ["Put no more than three items in order."],
        );
      }
    }),
  );

  it.effect("[Q-15] checkResponses: a response that did not decode is refused as unknown", () =>
    Effect.gen(function* refusesMalformed() {
      const accepted = yield* acceptedOf("order.xml");
      const [posting] = postings(redact(accepted), instance);
      const malformed = decode(
        [[name, "9 not an identifier"]],
        posting?.binding ?? assert.fail("No posting."),
      );

      assert.isTrue(Result.isFailure(malformed));
      assert.deepStrictEqual(
        checkResponses(
          accepted,
          { [response]: Result.getFailure(malformed).pipe(Option.getOrThrow) },
          yield* configure({}),
        ).map(({ text }) => text),
        [message("en", "unknownChoice")],
      );
    }),
  );

  it.effect(
    "[Q-15] score with the correct order gives the maximum and a swap scores below it",
    () =>
      Effect.gen(function* scores() {
        const accepted = yield* acceptedOf("order.xml");
        const [posting] = postings(redact(accepted), instance);
        const binding = posting?.binding ?? assert.fail("The Order posts nothing.");
        const answer = (...identifiers: readonly string[]) =>
          Result.getOrThrow(
            decode(
              identifiers.map((identifier): readonly [string, string] => [name, identifier]),
              binding,
            ),
          );
        const correct = yield* scoreOf(
          yield* Effect.fromResult(score(accepted, { [response]: answer("B", "A", "C", "D") })),
        );
        const swapped = yield* scoreOf(
          yield* Effect.fromResult(score(accepted, { [response]: answer("A", "B", "C", "D") })),
        );

        assert.strictEqual(correct, 1);
        assert.isBelow(swapped, correct);
      }),
  );

  it.effect(
    "[Q-15] restore gives back the order a scored attempt posted, and the render shows it",
    () =>
      Effect.gen(function* restoresStored() {
        const accepted = yield* acceptedOf("order.xml");
        const posted = orderOf("C", "A", "D", "B");
        const started = yield* Effect.fromResult(begin(accepted, { instance }));
        const stored = yield* Effect.fromResult(score(accepted, { [response]: posted }, started));
        const restored = yield* Effect.fromResult(restore(accepted, stored));

        assert.deepStrictEqual(restored.values[response], posted);

        const shown = yield* shownOf("order.xml", { values: restored.values });

        assert.deepStrictEqual(shown.hidden, ["C", "A", "D", "B"]);
      }),
  );

  it.effect(
    "[Q-15] solution shows the correct order, and review and solution modes write no hidden input",
    () =>
      Effect.gen(function* showsSolution() {
        const accepted = yield* acceptedOf("order.xml");
        const correct = solution(accepted);

        assert.deepStrictEqual(correct[response], orderOf("B", "A", "C", "D"));

        const shown = yield* shownOf("order.xml", { mode: "solution", values: correct });

        assert.deepStrictEqual(
          shown.positions.map(({ identifier }) => Option.getOrUndefined(identifier)),
          ["B", "A", "C", "D"],
        );
        assert.deepStrictEqual(shown.hidden, []);
        assert.strictEqual(shown.root.attrs["data-mode"], "solution");

        for (const mode of ["review", "solution"] as const) {
          const finished = yield* shownOf("order.xml", {
            mode,
            values: { [response]: orderOf("C", "A", "D", "B") },
          });

          assert.deepStrictEqual(finished.hidden, [], mode);
          assert.deepStrictEqual(
            finished.positions.map(({ identifier }) => Option.getOrUndefined(identifier)),
            ["C", "A", "D", "B"],
            mode,
          );
        }

        const answered = yield* shownOf("order.xml", {
          disabled: true,
          values: { [response]: orderOf("C", "A", "D", "B") },
        });

        assert.deepStrictEqual(answered.hidden, []);
        assert.isTrue(answered.root.attrs["data-disabled"] !== undefined);
      }),
  );

  it.effect(
    "[Q-15] a refused post shows the entries it posted that name a choice, once each, and writes them back",
    () =>
      Effect.gen(function* showsPost() {
        const shown = yield* shownOf("order.xml", {
          messages: refused,
          posted: { [response]: ["D", "Z", "D", "A"] },
          values: { [response]: orderOf("B", "A") },
        });

        assert.deepStrictEqual(
          shown.positions.map(({ identifier }) => Option.getOrUndefined(identifier)),
          ["D", "A", undefined, undefined],
        );
        assert.deepStrictEqual(shown.hidden, ["D", "A"]);
        assert.sameMembers([...shown.source], ["B", "C"]);
      }),
  );

  it.effect(
    "[Q-15] a refused post of more entries than positions keeps each one in a position of its own",
    () =>
      Effect.gen(function* keepsEveryEntry() {
        const shown = yield* shownOf("order-subset.xml", {
          messages: refused,
          posted: { [response]: ["D", "A", "B", "E"] },
        });

        assert.deepStrictEqual(shown.hidden, ["D", "A", "B", "E"]);
        assert.strictEqual(shown.positions.length, 4);
      }),
  );

  it.effect("[Q-15] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* passesTree() {
      for (const showing of [
        {},
        { values: { [response]: orderOf("C", "A", "D", "B") } },
        { mode: "review", values: { [response]: orderOf("C", "A", "D", "B") } },
      ] satisfies readonly Showing[]) {
        const html = yield* htmlOf(yield* acceptedOf("order.xml"), showing);
        const [root] = parseHtml(html);

        shownIn(html);
        assert.isTrue(root?.kind === "element");
        assert.isTrue(roundTrips(root ?? assert.fail("The render is empty.")));
        assert.deepStrictEqual(
          checkTree(
            {
              attrs: { lang: "en" },
              children: root === undefined ? [] : [root],
              kind: "element",
              tag: "div",
            },
            { baseLevel: 2 },
          ),
          [],
        );
      }
    }),
  );

  it.effect("[Q-15] names its lists and its group, and numbers its positions in an ol", () =>
    Effect.gen(function* namesParts() {
      const subset = yield* shownOf("order-subset.xml");
      const elements = elementsOf(parseHtml(subset.html));
      const find = (marker: string) => elements.find((element) => isPart(element, marker));
      const prompt = find(slot.prompt);

      assert.strictEqual(subset.root.attrs["role"], "group");
      assert.strictEqual(subset.root.attrs["aria-labelledby"], prompt?.attrs["id"]);
      assert.isTrue(
        Option.isSome(
          Option.flatMap(Option.fromUndefinedOr(find(slot.choices)), (list) =>
            attributeOf(list, "aria-label"),
          ),
        ),
      );
      assert.isTrue(
        Option.isSome(
          Option.flatMap(Option.fromUndefinedOr(find(slot.ordered)), (list) =>
            attributeOf(list, "aria-label"),
          ),
        ),
      );
      assert.deepStrictEqual(
        subset.positions.map((_, index) => index + 1),
        [1, 2, 3],
      );
    }),
  );

  it.effect(
    "[Q-15] records a choice's template-identifier as not rendered, and shows the choice",
    () =>
      Effect.gen(function* marksTemplateChoice() {
        const source = new TextDecoder()
          .decode(fixtureBytes("order.xml"))
          .replace(
            "<qti-outcome-declaration",
            '<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-outcome-declaration',
          )
          .replace(
            '<qti-simple-choice identifier="B">',
            '<qti-simple-choice identifier="B" template-identifier="T" show-hide="show">',
          );
        const verdict = yield* open(
          "fixtures/ei/items/order-template.xml",
          new TextEncoder().encode(source),
        );
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`The item is ${verdict.verdict}, not accepted.`),
        );

        assert.deepStrictEqual(
          unsupportedFeatures(verdict).map(({ feature, shown }) => [feature, shown]),
          [["template-identifier", "mark"]],
        );
        assert.deepStrictEqual(shownIn(yield* htmlOf(accepted)).source, ["A", "B", "C", "D"]);
      }),
  );

  it.effect("[Q-15] names its group by the author's aria-label, else the renderer's", () =>
    Effect.gen(function* namesGroup() {
      const source = new TextDecoder()
        .decode(fixtureBytes("order.xml"))
        .replace(
          "<qti-order-interaction ",
          '<qti-order-interaction aria-label="Steps of baking" class="qti-bordered" orientation="horizontal" ',
        );
      const verdict = yield* open(
        "fixtures/ei/items/order-named.xml",
        new TextEncoder().encode(source),
      );
      const named = shownIn(
        yield* htmlOf(
          Option.getOrElse(acceptedItem(verdict), () =>
            assert.fail(`The item is ${verdict.verdict}, not accepted.`),
          ),
        ),
      );
      const unnamed = yield* shownOf("order.xml");

      assert.strictEqual(named.root.attrs["aria-label"], "Steps of baking");
      assert.strictEqual(named.root.attrs["class"], "qti-bordered");
      assert.strictEqual(named.root.attrs["data-orientation"], "horizontal");
      assert.strictEqual(unnamed.root.attrs["aria-label"], "Choices to put in order");
      assert.isUndefined(unnamed.root.attrs["aria-labelledby"]);
    }),
  );

  it.effect("[Q-15] redact's copy holds no correct response", () =>
    Effect.gen(function* holdsNoAnswer() {
      const accepted = yield* acceptedOf("order.xml");
      const redacted = redact(accepted);
      const json = JSON.stringify(Result.getOrThrow(encodeRedacted(redacted)));
      const html = yield* htmlOf(accepted);

      assert.isTrue(json.includes('"kind":"order"'));
      assert.isFalse(json.includes('"B","A","C","D"'));
      assert.isFalse(/correct/iu.test(json));
      assert.isFalse(/correct/iu.test(html));

      const decoded = yield* Effect.fromResult(decodeRedacted(JSON.parse(json)));
      const configuration = yield* configure({});

      assert.strictEqual(
        Result.getOrThrow(render(decoded, configuration, { instance })).html,
        html,
      );
    }),
  );
});
