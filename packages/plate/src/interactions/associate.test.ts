import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  checkResponses,
  configure,
  decode,
  decodeRedacted,
  encodeRedacted,
  entryName,
  open,
  postings,
  redact,
  render,
  restore,
  score,
  solution,
} from "#plate/index.ts";
import type {
  Accepted,
  Element,
  Entry,
  Node,
  RenderMode,
  ResponseValue,
  Value,
  ValidationMessage,
} from "#plate/index.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { associateModule } from "#plate/interactions/associate.ts";
import { mapRegions, regionsOf } from "#plate/model/interactions.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";
import { unsupportedFeatures } from "#plate/validate/verdict.ts";

/**
 * The folder of the area's fixture items, relative to this file's package.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The fixtures: the item with a mapped multiple response, and the shuffled one with a single.
 */
const fixtures = ["associate.xml", "associate-shuffle.xml"] as const;

/**
 * The cached QTI 3.0.1 ASI XSD, which governs every item.
 */
const asiXsd = "imsqti_asiv3p0p1_v1p0.xsd";

/**
 * The ASI XSD compiles from about 18 MB of schema text on every run, which takes xmllint a second
 * or two on an idle machine; the cap lets the machine run far busier than that.
 */
const asiTimeoutMs = 120_000;

/**
 * The item instance the renders here are made under unless a test names another.
 */
const instance = "as1";

/**
 * The identifier of the response the Associate binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Associate's hidden inputs post under in {@link instance}.
 */
const name = entryName(instance, response);

/**
 * Read one fixture item as text.
 *
 * @param file The item's file name in the fixture folder.
 * @returns The item's XML.
 */
const fixtureText = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureDirectory, file), "utf-8"));

/**
 * Open an item's XML as `open` does.
 *
 * @param file The item's file name, which the verdict names as the document.
 * @param xml The item's XML.
 * @returns The verdict.
 */
const opened = (file: string, xml: string) => open(`items/${file}`, new TextEncoder().encode(xml));

/**
 * Open an item's XML and give the item the verdict accepted, failing the test when it accepts
 * none.
 *
 * @param file The item's file name.
 * @param xml The item's XML.
 * @returns The accepted item.
 */
const accept = (file: string, xml: string) =>
  Effect.map(opened(file, xml), (verdict) =>
    Option.match(acceptedItem(verdict), {
      onNone: (): Accepted => assert.fail(`${file}: ${JSON.stringify(verdict)}`),
      onSome: (accepted) => accepted,
    }),
  );

/**
 * Read a fixture item and give it accepted.
 *
 * @param file The item's file name.
 * @returns The accepted item.
 */
const acceptedFixture = (file: string) =>
  Effect.flatMap(fixtureText(file), (xml) => accept(file, xml));

/**
 * Replace the one place a text occurs in an item's XML, failing the test when it is not there.
 *
 * @param xml The item's XML.
 * @param from The text to find.
 * @param to The text to put in its place.
 * @returns The edited XML.
 */
const edited = (xml: string, from: string, to: string): string => {
  assert.include(xml, from);

  return xml.replace(from, to);
};

/**
 * Construct the multiple pair value that holds each pair, the two choices in the order written.
 *
 * @param pairs Each pair: its two choices.
 * @returns The value.
 */
const pairValue = (...pairs: readonly (readonly [string, string])[]): Value => ({
  baseType: "pair",
  cardinality: "multiple",
  values: pairs.map(([first, second]) => ({
    baseType: "pair" as const,
    value: [first, second] as const,
  })),
});

/**
 * Construct the single pair value of two choices, in the order written.
 *
 * @param first One choice.
 * @param second The other.
 * @returns The value.
 */
const singleValue = (first: string, second: string): Value => ({
  baseType: "pair",
  cardinality: "single",
  values: [{ baseType: "pair", value: [first, second] }],
});

/**
 * The correct response of the main fixture: pedal and crank, spoke and wheel, wheel and tyre.
 */
const correct = pairValue(["A", "B"], ["C", "D"], ["D", "E"]);

/**
 * Give the elements of nodes in document order, each followed by its descendants.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the marker of an Associate part.
 *
 * @param part The part's marker suffix, none for the Root.
 * @returns The `data-slot` value.
 */
const slotOf = (part = ""): string =>
  part === "" ? "associate-interaction" : `associate-interaction-${part}`;

/**
 * Read an attribute of an emitted element as a string.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @returns The value, `undefined` when the element does not carry it.
 */
const attributeOf = (element: Element, attribute: string): string | undefined => {
  const value = element.attrs[attribute];

  return value === true ? "" : value;
};

/**
 * Give the elements of a rendered page that carry an Associate part's marker, in document order.
 *
 * @param html The page's HTML.
 * @param part The part's marker suffix, none for the Root.
 * @returns The elements.
 */
const partsOf = (html: string, part = ""): readonly Element[] =>
  elementsOf(parseHtml(html)).filter(
    (element) => attributeOf(element, "data-slot") === slotOf(part),
  );

/**
 * What a test passes `render` beyond the item: the values, the mode and the refused post the author
 * chooses, and the instance and seed the shuffle and the entry names are keyed by.
 */
interface Showing {
  readonly disabled?: boolean;
  readonly instance?: string;
  readonly messages?: readonly ValidationMessage[];
  readonly mode?: RenderMode;
  readonly posted?: Readonly<Record<string, readonly string[]>>;
  readonly seed?: string;
  readonly values?: Readonly<Record<string, ResponseValue>>;
}

/**
 * Render an accepted item's redaction.
 *
 * @param accepted The accepted item.
 * @param showing What the author passes to `render`.
 * @returns The page's HTML.
 */
const htmlOf = (accepted: Accepted, showing: Showing = {}) =>
  Effect.gen(function* renderPage() {
    const { seed, ...options } = showing;
    const configuration = yield* configure(seed === undefined ? {} : { seed });
    const rendered = yield* Effect.fromResult(
      render(redact(accepted, undefined, configuration), configuration, {
        instance,
        ...options,
      }),
    );

    return rendered.html;
  });

/**
 * Give the choice identifiers a rendered page presents, in the order its list shows them.
 *
 * @param html The page's HTML.
 * @returns Each choice's `data-identifier`.
 */
const poolOf = (html: string): readonly string[] =>
  partsOf(html, "choice").map((choice) => attributeOf(choice, "data-identifier") ?? "");

/**
 * Give the texts of the pairs a rendered page lists, in order.
 *
 * @param html The page's HTML.
 * @returns Each pair's text.
 */
const pairTextsOf = (html: string): readonly string[] =>
  partsOf(html, "pair").map((pair) => textOf(pair));

/**
 * Give the values of the hidden inputs a rendered page writes, in order.
 *
 * @param html The page's HTML.
 * @returns Each input's `value`.
 */
const hiddenValuesOf = (html: string): readonly string[] =>
  partsOf(html, "hidden").map((input) => attributeOf(input, "value") ?? "");

/**
 * Check a response as the item's interactions do.
 *
 * @param accepted The accepted item.
 * @param value The response's value, none to leave it out.
 * @param validateResponses Whether tier (b) limits apply too.
 * @returns The messages `checkResponses` gives.
 */
const checked = (accepted: Accepted, value?: Value, validateResponses = false) =>
  Effect.map(configure({ validateResponses }), (configuration) =>
    checkResponses(accepted, value === undefined ? {} : { [response]: value }, configuration),
  );

/**
 * The texts of the messages a check gave.
 *
 * @param messages The messages.
 * @returns Their texts, in order.
 */
const textsOf = (messages: readonly { readonly text: string }[]): readonly string[] =>
  messages.map(({ text }) => text);

/**
 * The first element of a rendered page, the item's Root.
 *
 * @param html The page's HTML.
 * @returns The Root element, failing the test when the page holds none.
 */
const rootOf = (html: string): Element => {
  const [root] = parseHtml(html);

  return root?.kind === "element" ? root : assert.fail("the page holds no element");
};

/**
 * Score a response and read the item's SCORE outcome back.
 *
 * @param accepted The accepted item.
 * @param value The response's value.
 * @returns The SCORE outcome's single float, none when the record holds no such value.
 */
const scored = (accepted: Accepted, value: Value) =>
  Effect.map(
    Effect.fromResult(Result.flatMap(score(accepted, { [response]: value }), decodeRecord)),
    (record) => {
      const [single] = record.outcomes["SCORE"]?.values ?? [];

      return single?.baseType === "float" ? Option.some(single.value) : Option.none();
    },
  );

describe("Associate", () => {
  it.effect(
    "[Q-1] the fixtures validate against the QTI 3.0.1 ASI XSD",
    () =>
      Effect.gen(function* fixturesValid() {
        for (const file of fixtures) {
          const result = yield* validateAgainst(asiXsd, yield* fixtureText(file));

          assert.isTrue(result.valid, `${file}: ${result.messages.join("\n")}`);
        }
      }),
    { tags: ["qti-xsd"], timeout: asiTimeoutMs },
  );

  it.effect("[Q-1] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      for (const file of fixtures) {
        const verdict = yield* opened(file, yield* fixtureText(file));

        assert.strictEqual(verdict.verdict, "accepted", file);
        assert.isTrue(Option.isSome(acceptedItem(verdict)), file);
        assert.deepStrictEqual(unsupportedFeatures(verdict), [], file);
      }
    }),
  );

  it.effect(
    "[Q-1] an unrendered binding, a response that is not a pair or is ordered, stays the notice",
    () =>
      Effect.gen(function* noticesBindings() {
        const base = yield* fixtureText("associate.xml");
        const directed = edited(base, 'base-type="pair"', 'base-type="directedPair"');
        const ordered = edited(
          edited(base, 'cardinality="multiple"', 'cardinality="ordered"'),
          ' max-associations="3"',
          "",
        );

        for (const [xml, feature] of [
          [directed, 'base-type="directedPair"'],
          [ordered, 'cardinality="ordered"'],
        ] as const) {
          const verdict = yield* opened("associate-binding.xml", xml);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported", feature);
          assert.deepStrictEqual(
            unsupportedFeatures(verdict).map((entry) => entry.feature),
            [feature],
          );
        }
      }),
  );

  it.effect(
    "[Q-1] render emits the root, prompt, five choices and an empty list of pairs, with data-slot markers",
    () =>
      Effect.gen(function* emitsParts() {
        const html = yield* htmlOf(yield* acceptedFixture("associate.xml"));
        const slots = elementsOf(parseHtml(html)).flatMap((element) => {
          const slot = attributeOf(element, "data-slot");

          return slot?.startsWith(slotOf()) === true ? [slot] : [];
        });

        assert.deepStrictEqual(slots, [
          slotOf(),
          slotOf("prompt"),
          slotOf("choices"),
          slotOf("choice"),
          slotOf("choice"),
          slotOf("choice"),
          slotOf("choice"),
          slotOf("choice"),
          slotOf("pairs"),
        ]);
        assert.deepStrictEqual(poolOf(html), ["A", "B", "C", "D", "E"]);
        assert.deepStrictEqual(
          partsOf(html, "choice").map((choice) => textOf(choice)),
          ["Pedal", "Crank", "Spoke", "Wheel", "Tyre"],
        );
        assert.deepStrictEqual(
          partsOf(html, "choice").map((choice) => [
            attributeOf(choice, "data-match-max"),
            attributeOf(choice, "data-match-group"),
          ]),
          [
            ["1", undefined],
            ["1", undefined],
            ["1", undefined],
            ["2", undefined],
            ["1", "C D"],
          ],
        );
        assert.deepStrictEqual(partsOf(html, "pair"), []);
        assert.deepStrictEqual(partsOf(html, "hidden"), []);

        const [root] = partsOf(html);

        assert.strictEqual(root === undefined ? "" : attributeOf(root, "data-entry-name"), name);
        assert.strictEqual(
          root === undefined ? "" : attributeOf(root, "data-max-associations"),
          "3",
        );

        const [unwritten] = partsOf(yield* htmlOf(yield* acceptedFixture("associate-shuffle.xml")));

        assert.strictEqual(
          unwritten === undefined ? "" : attributeOf(unwritten, "data-max-associations"),
          "1",
        );
      }),
  );

  it.effect("[Q-1] restored pairs show both labels and write one hidden input each", () =>
    Effect.gen(function* restoresPairs() {
      const accepted = yield* acceptedFixture("associate.xml");
      const html = yield* htmlOf(accepted, {
        values: { [response]: pairValue(["A", "B"], ["D", "C"]) },
      });

      assert.deepStrictEqual(pairTextsOf(html), [
        "Pedal paired with Crank",
        "Wheel paired with Spoke",
      ]);
      assert.deepStrictEqual(
        partsOf(html, "hidden").map((input) => [
          attributeOf(input, "name"),
          attributeOf(input, "type"),
          attributeOf(input, "value"),
        ]),
        [
          [name, "hidden", "A B"],
          [name, "hidden", "D C"],
        ],
      );
      assert.deepStrictEqual(poolOf(html), ["A", "B", "C", "D", "E"]);

      const pairs = partsOf(html, "pairs");

      assert.lengthOf(pairs, 1);
      assert.strictEqual(pairs[0]?.tag, "ul");
      assert.deepStrictEqual(
        pairs[0]?.children.flatMap((child) => (child.kind === "element" ? [child.tag] : [])),
        ["li", "li"],
      );

      const [root] = partsOf(html);

      assert.strictEqual(root === undefined ? "" : attributeOf(root, "data-entry-name"), name);
    }),
  );

  it.effect(
    "[Q-1] a refused post shows the pairs it posted, and a pair that names no choice is not shown",
    () =>
      Effect.gen(function* showsPost() {
        const accepted = yield* acceptedFixture("associate.xml");
        const html = yield* htmlOf(accepted, {
          messages: [{ response, text: "Pair each choice with a different one." }],
          posted: { [response]: ["A A", "A B", "B A", "A Z", "C"] },
          values: { [response]: pairValue(["C", "D"]) },
        });

        assert.deepStrictEqual(pairTextsOf(html), [
          "Pedal paired with Pedal",
          "Pedal paired with Crank",
          "Crank paired with Pedal",
        ]);
        assert.deepStrictEqual(hiddenValuesOf(html), ["A A", "A B", "B A"]);
      }),
  );

  it.effect(
    "[Q-1] a choice with no text is named by its image's alt text, else by its position",
    () =>
      Effect.gen(function* namesChoices() {
        const base = yield* fixtureText("associate.xml");
        const pictured = edited(
          edited(
            base,
            '<qti-simple-associable-choice identifier="A" match-max="1">Pedal</qti-simple-associable-choice>',
            '<qti-simple-associable-choice identifier="A" match-max="1"><img src="pedal.png" alt="Flat pedal"/></qti-simple-associable-choice>',
          ),
          '<qti-simple-associable-choice identifier="B" match-max="1">Crank</qti-simple-associable-choice>',
          '<qti-simple-associable-choice identifier="B" match-max="1"><img src="crank.png" alt=" "/></qti-simple-associable-choice>',
        );
        const accepted = yield* accept("associate-images.xml", pictured);
        const html = yield* htmlOf(accepted, {
          values: { [response]: pairValue(["A", "C"], ["B", "D"]) },
        });

        assert.deepStrictEqual(pairTextsOf(html), [
          "Flat pedal paired with Spoke",
          "Choice 2 of 5 paired with Wheel",
        ]);
      }),
  );

  it.effect(
    "[Q-1] shuffle orders the choices by seed and instance and keeps a fixed choice in place",
    () =>
      Effect.gen(function* shuffles() {
        const accepted = yield* acceptedFixture("associate-shuffle.xml");
        const first = yield* htmlOf(accepted, { instance: "i1", seed: "s" });
        const again = yield* htmlOf(accepted, { instance: "i1", seed: "s" });
        const other = yield* htmlOf(accepted, { instance: "i2", seed: "s" });
        const keyed = yield* htmlOf(accepted, { instance: "i1", seed: "t" });

        assert.deepStrictEqual(poolOf(first), poolOf(again));
        assert.notDeepEqual(poolOf(first), poolOf(other));
        assert.notDeepEqual(poolOf(first), poolOf(keyed));
        assert.notDeepEqual(poolOf(first), ["A", "B", "C", "D", "E", "F"]);
        for (const html of [first, other, keyed]) {
          assert.sameMembers([...poolOf(html)], ["A", "B", "C", "D", "E", "F"]);
          assert.strictEqual(poolOf(html)[2], "C");
        }

        const orders = new Set<string>();

        for (const token of ["i1", "i2", "i3", "i4", "i5"]) {
          orders.add(poolOf(yield* htmlOf(accepted, { instance: token, seed: "s" })).join(" "));
        }

        assert.isAbove(orders.size, 1);

        const plain = yield* htmlOf(yield* acceptedFixture("associate.xml"), { instance: "i2" });

        assert.deepStrictEqual(poolOf(plain), ["A", "B", "C", "D", "E"]);
      }),
  );

  it.effect("[Q-1] sequence reports the order render presents, and none without shuffle", () =>
    Effect.gen(function* sequences() {
      const shuffled = yield* acceptedFixture("associate-shuffle.xml");
      const plain = yield* acceptedFixture("associate.xml");
      const shuffledNode = shuffled.item.body.find((node) => node.kind === "associate");
      const plainNode = plain.item.body.find((node) => node.kind === "associate");

      assert.isDefined(shuffledNode);
      assert.isDefined(plainNode);
      if (shuffledNode?.kind !== "associate" || plainNode?.kind !== "associate") {
        return;
      }

      const html = yield* htmlOf(shuffled, { instance: "i1", seed: "s" });

      assert.deepStrictEqual(
        associateModule.sequence(shuffledNode, Option.some("s"), "i1"),
        Option.some(poolOf(html).join(" ")),
      );
      assert.deepStrictEqual(
        associateModule.sequence(plainNode, Option.some("s"), "i1"),
        Option.none(),
      );
    }),
  );

  it.effect(
    "[Q-1] postings binds the response as a multiple pair and decode reads the posted pairs",
    () =>
      Effect.gen(function* posts() {
        const accepted = yield* acceptedFixture("associate.xml");
        const [posting, ...rest] = postings(redact(accepted), instance);

        assert.strictEqual(rest.length, 0);
        assert.isDefined(posting);

        const posted = posting ?? assert.fail("the item has no posting for its response");

        assert.strictEqual(posted.identifier, response);
        assert.deepStrictEqual(posted.binding, {
          baseType: "pair",
          cardinality: "multiple",
          name,
        });

        const form = new FormData();

        form.append(name, "A B");
        form.append(name, "D C");

        const entries: readonly Entry[] = [...form.entries()];

        assert.deepStrictEqual(
          decode(entries, posted.binding, posted.options),
          Result.succeed(pairValue(["A", "B"], ["D", "C"])),
        );
        assert.deepStrictEqual(
          Result.match(decode([[name, "A"]], posted.binding, posted.options), {
            onFailure: (malformed) => malformed.reason,
            onSuccess: () => "decoded",
          }),
          "identifier",
        );

        const [single] = postings(
          redact(yield* acceptedFixture("associate-shuffle.xml")),
          instance,
        );

        assert.deepStrictEqual(single?.binding, {
          baseType: "pair",
          cardinality: "single",
          name,
        });
      }),
  );

  it.effect(
    "[Q-1] checkResponses: a choice paired with itself, or one pair twice in either order, is refused in tier (a)",
    () =>
      Effect.gen(function* refusesSelfAndRepeats() {
        const accepted = yield* acceptedFixture("associate.xml");
        const itself = yield* checked(accepted, pairValue(["A", "A"]));

        assert.lengthOf(itself, 1);
        assert.match(textsOf(itself).join("\n"), /\bA\b.*\bitself\b/u);

        for (const repeated of [
          pairValue(["A", "B"], ["B", "A"]),
          pairValue(["A", "B"], ["A", "B"]),
          pairValue(["C", "D"], ["C", "D"], ["A", "B"]),
        ]) {
          const messages = yield* checked(accepted, repeated);

          assert.lengthOf(messages, 1);
          assert.match(textsOf(messages).join("\n"), /more than once/u);
        }

        assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "B"])), []);
        assert.deepStrictEqual(yield* checked(accepted, pairValue(["B", "A"])), []);
        assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "B"], ["D", "C"])), []);
        assert.deepStrictEqual(yield* checked(accepted, correct), []);
      }),
  );

  it.effect("[Q-1] checkResponses: a pair that names no choice is refused in tier (a)", () =>
    Effect.gen(function* refusesUnknown() {
      const accepted = yield* acceptedFixture("associate.xml");

      for (const unknown of [pairValue(["A", "Z"]), pairValue(["Y", "Z"])]) {
        assert.lengthOf(yield* checked(accepted, unknown), 1);
      }

      const malformed = decode([[name, "A"]], { baseType: "pair", cardinality: "multiple", name });
      const twice = decode(
        [
          [name, "A B"],
          [name, "C D"],
        ],
        { baseType: "pair", cardinality: "single", name },
      );
      const configuration = yield* configure({});

      for (const given of [malformed, twice]) {
        const failure = Result.match(given, {
          onFailure: (error) => error,
          onSuccess: () => assert.fail("the post decoded"),
        });
        const messages = checkResponses(
          yield* acceptedFixture("associate-shuffle.xml"),
          { [response]: failure },
          configuration,
        );

        assert.lengthOf(messages, 1);
      }
    }),
  );

  it.effect("[Q-1] checkResponses: a choice over its match-max is refused in tier (a)", () =>
    Effect.gen(function* overMatchMax() {
      const accepted = yield* acceptedFixture("associate.xml");
      const messages = yield* checked(accepted, pairValue(["A", "B"], ["A", "C"]));

      assert.lengthOf(messages, 1);
      assert.match(textsOf(messages).join("\n"), /\bA\b.*at most 1 pair\b/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["D", "C"], ["D", "E"])), []);

      const wheel = yield* checked(accepted, pairValue(["D", "A"], ["D", "B"], ["D", "C"]));

      assert.lengthOf(wheel, 1);
      assert.match(textsOf(wheel).join("\n"), /\bD\b.*at most 2 pairs\b/u);

      const unlimited = yield* accept(
        "associate-unlimited.xml",
        edited(
          yield* fixtureText("associate.xml"),
          '<qti-simple-associable-choice identifier="A" match-max="1">',
          '<qti-simple-associable-choice identifier="A" match-max="0">',
        ),
      );

      assert.deepStrictEqual(yield* checked(unlimited, pairValue(["A", "B"], ["A", "C"])), []);
    }),
  );

  it.effect("[Q-1] checkResponses: a pair outside a match-group is refused in tier (a)", () =>
    Effect.gen(function* outsideMatchGroup() {
      const accepted = yield* acceptedFixture("associate.xml");

      for (const outside of [pairValue(["E", "A"]), pairValue(["A", "E"])]) {
        const messages = yield* checked(accepted, outside);

        assert.lengthOf(messages, 1);
        assert.match(textsOf(messages).join("\n"), /\bE\b.*\bA\b.*\bC, D\b/u);
      }

      assert.deepStrictEqual(yield* checked(accepted, pairValue(["E", "C"])), []);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["D", "E"])), []);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "B"])), []);
    }),
  );

  it.effect(
    "[Q-1] checkResponses: above max-associations always, below min-associations only under validateResponses",
    () =>
      Effect.gen(function* associationBounds() {
        const base = yield* fixtureText("associate.xml");
        const roomy = yield* accept(
          "associate-roomy.xml",
          base.replaceAll(/ match-max="\d+"/gu, ' match-max="0"'),
        );
        const four = pairValue(["A", "B"], ["A", "C"], ["A", "D"], ["B", "C"]);

        for (const validateResponses of [false, true]) {
          const messages = yield* checked(roomy, four, validateResponses);

          assert.lengthOf(messages, 1);
          assert.match(textsOf(messages).join("\n"), /at most 3 pairs/u);
        }

        assert.deepStrictEqual(yield* checked(roomy, correct), []);

        const floored = yield* accept(
          "associate-min.xml",
          edited(base, 'max-associations="3"', 'max-associations="3" min-associations="1"'),
        );

        assert.deepStrictEqual(yield* checked(floored, pairValue()), []);
        assert.deepStrictEqual(yield* checked(floored), []);

        const missing = yield* checked(floored, pairValue(), true);

        assert.lengthOf(missing, 1);
        assert.match(textsOf(missing).join("\n"), /at least 1 pair\b/u);
        assert.lengthOf(yield* checked(floored, undefined, true), 1);
        assert.deepStrictEqual(yield* checked(floored, pairValue(["A", "B"]), true), []);

        const required = yield* accept(
          "associate-match-min.xml",
          edited(
            base,
            '<qti-simple-associable-choice identifier="B" match-max="1">',
            '<qti-simple-associable-choice identifier="B" match-min="1" match-max="1">',
          ),
        );

        assert.deepStrictEqual(yield* checked(required, pairValue(["C", "D"])), []);

        const unused = yield* checked(required, pairValue(["C", "D"]), true);

        assert.lengthOf(unused, 1);
        assert.match(textsOf(unused).join("\n"), /\bB\b.*at least 1 pair\b/u);
        assert.deepStrictEqual(yield* checked(required, pairValue(["C", "B"]), true), []);

        const unwritten = yield* accept(
          "associate-default.xml",
          edited(base, ' max-associations="3"', ""),
        );
        const unlimited = yield* accept(
          "associate-no-limit.xml",
          edited(base, 'max-associations="3"', 'max-associations="0"'),
        );

        assert.lengthOf(yield* checked(unwritten, pairValue(["A", "B"], ["C", "D"])), 1);
        assert.deepStrictEqual(yield* checked(unwritten, pairValue(["A", "B"])), []);
        assert.deepStrictEqual(yield* checked(unlimited, correct), []);
      }),
  );

  it.effect("[Q-1] score maps the pairs, in either order", () =>
    Effect.gen(function* scores() {
      const accepted = yield* acceptedFixture("associate.xml");

      assert.deepStrictEqual(yield* scored(accepted, correct), Option.some(3));
      assert.deepStrictEqual(
        yield* scored(accepted, pairValue(["B", "A"], ["D", "C"], ["E", "D"])),
        Option.some(3),
      );
      assert.deepStrictEqual(
        yield* scored(accepted, pairValue(["B", "A"], ["C", "D"], ["E", "D"])),
        Option.some(3),
      );
      assert.deepStrictEqual(yield* scored(accepted, pairValue(["B", "A"])), Option.some(1));
      assert.deepStrictEqual(
        yield* scored(accepted, pairValue(["A", "C"], ["B", "D"])),
        Option.some(0),
      );

      const single = yield* acceptedFixture("associate-shuffle.xml");

      assert.deepStrictEqual(yield* scored(single, singleValue("A", "D")), Option.some(1));
      assert.deepStrictEqual(yield* scored(single, singleValue("D", "A")), Option.some(1));
      assert.deepStrictEqual(yield* scored(single, singleValue("A", "E")), Option.some(0));
    }),
  );

  it.effect(
    "[Q-1] solution shows the correct pairs, and finished modes write no hidden input",
    () =>
      Effect.gen(function* showsSolution() {
        const accepted = yield* acceptedFixture("associate.xml");
        const correctAnswer = solution(accepted);

        assert.deepStrictEqual(correctAnswer, { [response]: correct });

        const answering = yield* htmlOf(accepted, { values: correctAnswer });

        assert.deepStrictEqual(hiddenValuesOf(answering), ["A B", "C D", "D E"]);

        for (const mode of ["review", "solution"] as const) {
          const html = yield* htmlOf(accepted, { mode, values: correctAnswer });

          assert.deepStrictEqual(partsOf(html, "hidden"), [], mode);
          assert.deepStrictEqual(
            pairTextsOf(html),
            ["Pedal paired with Crank", "Spoke paired with Wheel", "Wheel paired with Tyre"],
            mode,
          );
          assert.strictEqual(attributeOf(partsOf(html)[0] ?? rootOf(html), "data-mode"), mode);
        }

        const finished = yield* htmlOf(accepted, { disabled: true, values: correctAnswer });

        assert.deepStrictEqual(partsOf(finished, "hidden"), []);
        assert.lengthOf(partsOf(finished, "pair"), 3);

        const recorded = yield* Effect.fromResult(score(accepted, { [response]: correct }));
        const restored = yield* Effect.fromResult(restore(accepted, recorded));

        assert.deepStrictEqual(restored.values, { [response]: correct });
      }),
  );

  it.effect("[Q-1] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* passesCheckTree() {
      for (const file of fixtures) {
        const accepted = yield* acceptedFixture(file);

        for (const showing of [
          {},
          { values: { [response]: pairValue(["A", "B"], ["C", "D"]) } },
          { mode: "review" as const, values: { [response]: pairValue(["A", "B"]) } },
          {
            messages: [{ response, text: "Pair each choice with a different one." }],
            posted: { [response]: ["A A", "A B"] },
          },
        ]) {
          const tree = rootOf(yield* htmlOf(accepted, { ...showing, seed: "s" }));

          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], file);
          assert.isTrue(roundTrips(tree), file);
        }
      }

      const tree = rootOf(yield* htmlOf(yield* acceptedFixture("associate.xml")));
      const group = elementsOf([tree]).find(
        (element) => attributeOf(element, "data-slot") === slotOf(),
      );
      const prompt = elementsOf([tree]).find(
        (element) => attributeOf(element, "data-slot") === slotOf("prompt"),
      );

      assert.isDefined(group);
      assert.isDefined(prompt);
      assert.strictEqual(attributeOf(group ?? tree, "role"), "group");
      assert.strictEqual(
        nameOf(group ?? tree, tree),
        "Pair each part of a bicycle with a part it attaches to.",
      );
      assert.strictEqual(nameOf(group ?? tree, tree), textOf(prompt ?? tree));
    }),
  );

  it.effect(
    "[Q-1] a Root with no Prompt is named by the author's aria-label, else left unnamed",
    () =>
      Effect.gen(function* namesRoot() {
        const base = yield* fixtureText("associate-shuffle.xml");
        const [unnamed] = partsOf(yield* htmlOf(yield* accept("associate-plain.xml", base)));

        assert.isDefined(unnamed);
        for (const attribute of ["aria-label", "aria-labelledby", "role"]) {
          assert.isUndefined(
            unnamed === undefined ? "" : attributeOf(unnamed, attribute),
            attribute,
          );
        }

        const named = yield* accept(
          "associate-named.xml",
          edited(
            base,
            '<qti-associate-interaction response-identifier="RESPONSE" shuffle="true">',
            '<qti-associate-interaction response-identifier="RESPONSE" shuffle="true" aria-label="Match each fruit to a colour." class="wide">',
          ),
        );
        const tree = rootOf(yield* htmlOf(named));
        const [group] = partsOf(yield* htmlOf(named));

        assert.isDefined(group);
        assert.strictEqual(attributeOf(group ?? tree, "role"), "group");
        assert.strictEqual(
          attributeOf(group ?? tree, "aria-label"),
          "Match each fruit to a colour.",
        );
        assert.strictEqual(attributeOf(group ?? tree, "class"), "wide");
        assert.strictEqual(nameOf(group ?? tree, tree), "Match each fruit to a colour.");
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect("[Q-1] the part rows hold every attribute the render writes beyond the state", () =>
    Effect.gen(function* holdsMerged() {
      const accepted = yield* acceptedFixture("associate.xml");
      const html = yield* htmlOf(accepted, {
        messages: [{ response, text: "Pair each choice with a different one." }],
        posted: { [response]: ["A B", "C D"] },
        values: { [response]: pairValue(["A", "B"], ["C", "D"]) },
      });
      const state = new Set(["data-disabled", "data-mode", "data-slot"]);

      for (const [part, spec] of Object.entries(associateModule.parts)) {
        const written = new Set(
          partsOf(html, part === "root" ? "" : part).flatMap((element) =>
            Object.keys(element.attrs).filter((attribute) => !state.has(attribute)),
          ),
        );

        for (const attribute of written) {
          assert.include(spec.merged, attribute, part);
        }
      }

      assert.sameMembers(Object.keys(associateModule.parts), [
        "choice",
        "choices",
        "hidden",
        "pair",
        "pairs",
        "prompt",
        "root",
      ]);
    }),
  );

  it.effect(
    "[Q-1] regions list the Prompt then each choice, and mapRegions replaces each content in place",
    () =>
      Effect.gen(function* mapsRegions() {
        for (const [file, parts, identifiers] of [
          [
            "associate.xml",
            ["prompt", "choice", "choice", "choice", "choice", "choice"],
            ["A", "B", "C", "D", "E"],
          ],
          [
            "associate-shuffle.xml",
            ["choice", "choice", "choice", "choice", "choice", "choice"],
            ["A", "B", "C", "D", "E", "F"],
          ],
        ] as const) {
          const accepted = yield* acceptedFixture(file);
          const node =
            accepted.item.body.find((found) => found.kind === "associate") ??
            assert.fail(`${file} holds no Associate`);
          const regions = regionsOf(node);

          assert.deepStrictEqual(
            regions.map((region) => region.part),
            [...parts],
            file,
          );
          assert.deepStrictEqual(
            regions.flatMap((region) => Option.toArray(region.choice)),
            [...identifiers],
            file,
          );

          const replaced = mapRegions(node, (region): readonly BodyNode[] => [
            { kind: "text", text: `${region.part} ${Option.getOrElse(region.choice, () => "-")}` },
          ]);

          assert.deepStrictEqual(
            regionsOf(replaced).map((region) =>
              region.nodes.map((content) => (content.kind === "text" ? content.text : "")),
            ),
            regions.map((region) => [
              `${region.part} ${Option.getOrElse(region.choice, () => "-")}`,
            ]),
            file,
          );
        }
      }),
  );

  it.effect("[Q-1] redact's copy holds no correct response", () =>
    Effect.gen(function* holdsNoAnswer() {
      for (const file of fixtures) {
        const accepted = yield* acceptedFixture(file);
        const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redact(accepted))));

        for (const pair of ["A B", "C D", "D E", "A D", "D A", "B A", "E D"]) {
          assert.notInclude(json, pair, file);
        }

        assert.notInclude(json, "correct", file);
        assert.notInclude(json, "qti-value", file);
        assert.notInclude(json, "qti-mapping", file);
        assert.notInclude(json, "SCORE", file);
        assert.include(json, '"kind":"associate"', file);
      }
    }),
  );

  it.effect("[Q-1] a redacted body decodes back to a page that renders the same HTML", () =>
    Effect.gen(function* roundTripsRedacted() {
      const accepted = yield* acceptedFixture("associate.xml");
      const configuration = yield* configure({});
      const direct = redact(accepted, undefined, configuration);
      const decoded = yield* Effect.fromResult(
        decodeRedacted(yield* Effect.fromResult(encodeRedacted(direct))),
      );
      const showing = { instance, values: { [response]: pairValue(["A", "B"]) } };
      const html = (redacted: typeof direct) =>
        Effect.map(
          Effect.fromResult(render(redacted, configuration, showing)),
          ({ html: page }) => page,
        );

      assert.strictEqual(yield* html(decoded), yield* html(direct));
    }),
  );
});
