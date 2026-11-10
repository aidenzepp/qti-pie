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
} from "#plate/index.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { message } from "#plate/messages.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * The folder of the fan-out area's fixture items, relative to this file's package.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m3d", "items");

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
const instance = "gm1";

/**
 * The identifier of the response the Gap Match binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Gap Match's hidden inputs post under in {@link instance}.
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
 * Construct the multiple directed-pair value that pairs each source with its target.
 *
 * @param pairs Each pair: its source and its target.
 * @returns The value.
 */
const pairValue = (...pairs: readonly (readonly [string, string])[]): Value => ({
  baseType: "directedPair",
  cardinality: "multiple",
  values: pairs.map(([source, target]) => ({
    baseType: "directedPair" as const,
    value: [source, target] as const,
  })),
});

/**
 * The correct response of the main fixture: tulips in the first gap, bloom in the second.
 */
const correct = pairValue(["A", "G1"], ["B", "G2"]);

/**
 * Give the elements of nodes in document order, each followed by its descendants.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the marker of a Gap Match part.
 *
 * @param part The part's marker suffix, none for the Root.
 * @returns The `data-slot` value.
 */
const slotOf = (part = ""): string =>
  part === "" ? "gap-match-interaction" : `gap-match-interaction-${part}`;

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
 * Give the elements of a rendered page that carry a Gap Match part's marker, in document order.
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
 * What a test passes `render` beyond the item: the values and the mode the author chooses, and the
 * instance and seed the shuffle and the entry names are keyed by.
 */
interface Showing {
  readonly disabled?: boolean;
  readonly instance?: string;
  readonly mode?: RenderMode;
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
 * Give the choice identifiers a rendered page presents, in the order its pool lists them.
 *
 * @param html The page's HTML.
 * @returns Each choice's `data-identifier`.
 */
const poolOf = (html: string): readonly string[] =>
  partsOf(html, "choice").map((choice) => attributeOf(choice, "data-identifier") ?? "");

/**
 * Give the gap identifiers of a rendered page's content, in document order.
 *
 * @param html The page's HTML.
 * @returns Each gap's `data-gap`.
 */
const gapsOf = (html: string): readonly string[] =>
  partsOf(html, "gap").map((gap) => attributeOf(gap, "data-gap") ?? "");

/**
 * Find the gap of a rendered page by its identifier.
 *
 * @param html The page's HTML.
 * @param identifier The gap's identifier.
 * @returns The gap's element, failing the test when the page has none.
 */
const gapOf = (html: string, identifier: string): Element =>
  partsOf(html, "gap").find((gap) => attributeOf(gap, "data-gap") === identifier) ??
  assert.fail(`the page has no gap ${identifier}`);

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

describe("Gap Match", () => {
  it.effect(
    "[Q-6] the fixtures validate against the QTI 3.0.1 ASI XSD",
    () =>
      Effect.gen(function* fixturesValid() {
        for (const file of ["gap-match.xml", "gap-match-shuffle.xml"]) {
          const result = yield* validateAgainst(asiXsd, yield* fixtureText(file));

          assert.isTrue(result.valid, `${file}: ${result.messages.join("\n")}`);
        }
      }),
    { tags: ["qti-xsd"], timeout: asiTimeoutMs },
  );

  it.effect("[Q-6] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      for (const file of ["gap-match.xml", "gap-match-shuffle.xml"]) {
        const verdict = yield* opened(file, yield* fixtureText(file));

        assert.strictEqual(verdict.verdict, "accepted", file);
        assert.isTrue(Option.isSome(acceptedItem(verdict)), file);
      }
    }),
  );

  it.effect(
    "[Q-6] render emits the root, prompt, choices, content and every gap with data-slot markers",
    () =>
      Effect.gen(function* emitsParts() {
        const html = yield* htmlOf(yield* acceptedFixture("gap-match.xml"));
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
          slotOf("content"),
          slotOf("gap"),
          slotOf("gap"),
        ]);
        assert.deepStrictEqual(poolOf(html), ["A", "B", "C"]);
        assert.deepStrictEqual(gapsOf(html), ["G1", "G2"]);
      }),
  );

  it.effect(
    "[Q-6] an empty gap renders empty and a restored pair writes its choice's text into the gap",
    () =>
      Effect.gen(function* restoresPair() {
        const accepted = yield* acceptedFixture("gap-match.xml");
        const empty = yield* htmlOf(accepted);

        assert.deepStrictEqual(gapOf(empty, "G1").children, []);
        assert.deepStrictEqual(partsOf(empty, "hidden"), []);

        const html = yield* htmlOf(accepted, { values: { [response]: pairValue(["A", "G1"]) } });
        const [root] = partsOf(html);
        const [chosen] = partsOf(html, "gap-choice");

        assert.strictEqual(textOf(gapOf(html, "G1")), "tulips");
        assert.strictEqual(chosen === undefined ? "" : attributeOf(chosen, "data-identifier"), "A");
        assert.deepStrictEqual(gapOf(html, "G2").children, []);
        assert.deepStrictEqual(
          partsOf(html, "hidden").map((input) => [
            attributeOf(input, "name"),
            attributeOf(input, "type"),
            attributeOf(input, "value"),
          ]),
          [[name, "hidden", "A G1"]],
        );
        assert.strictEqual(root === undefined ? "" : attributeOf(root, "data-entry-name"), name);
      }),
  );

  it.effect(
    "[Q-6] shuffle orders the choices by seed and instance and keeps a fixed choice in place",
    () =>
      Effect.gen(function* shuffles() {
        const accepted = yield* acceptedFixture("gap-match-shuffle.xml");
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
          assert.deepStrictEqual(gapsOf(html), ["G1", "G2", "G3"]);
        }

        const plain = yield* htmlOf(yield* acceptedFixture("gap-match.xml"), { instance: "i2" });

        assert.deepStrictEqual(poolOf(plain), ["A", "B", "C"]);

        const json = yield* Effect.fromResult(encodeRedacted(redact(accepted)));
        const withFixed = yield* Effect.fromResult(
          decodeRedacted({
            ...json,
            body: json.body.map((node) =>
              node.kind === "gap-match"
                ? {
                    ...node,
                    choices: node.choices.map((choice, index) =>
                      index === 2 ? { ...choice, fixed: true } : choice,
                    ),
                  }
                : node,
            ),
          }),
        );
        const configuration = yield* configure({ seed: "s" });
        const pools = ["i1", "i2", "i3", "i4", "i5"].map((token) =>
          Result.map(render(withFixed, configuration, { instance: token }), ({ html }) =>
            poolOf(html),
          ),
        );

        for (const pool of pools) {
          const shown = yield* Effect.fromResult(pool);

          assert.strictEqual(shown[2], "C");
          assert.sameMembers([...shown], ["A", "B", "C", "D", "E", "F"]);
        }

        const orders = new Set(pools.map((pool) => Result.getOrElse(pool, () => []).join(" ")));

        assert.isAbove(orders.size, 1);
      }),
  );

  it.effect(
    "[Q-6] postings binds the response as a multiple directedPair and decode reads the posted pairs",
    () =>
      Effect.gen(function* posts() {
        const accepted = yield* acceptedFixture("gap-match.xml");
        const [posting, ...rest] = postings(redact(accepted), instance);

        assert.strictEqual(rest.length, 0);
        assert.isDefined(posting);

        const posted = posting ?? assert.fail("the item has no posting for its response");

        assert.strictEqual(posted.identifier, response);
        assert.deepStrictEqual(posted.binding, {
          baseType: "directedPair",
          cardinality: "multiple",
          name,
        });

        const form = new FormData();

        form.append(name, "A G1");
        form.append(name, "B G2");

        const entries: readonly Entry[] = [...form.entries()];

        assert.deepStrictEqual(
          decode(entries, posted.binding, posted.options),
          Result.succeed(correct),
        );
        assert.deepStrictEqual(
          Result.match(decode([[name, "A"]], posted.binding, posted.options), {
            onFailure: (malformed) => malformed.reason,
            onSuccess: () => "decoded",
          }),
          "identifier",
        );
      }),
  );

  it.effect("[Q-6] checkResponses: a gap filled twice is refused in tier (a)", () =>
    Effect.gen(function* filledTwice() {
      const accepted = yield* acceptedFixture("gap-match.xml");
      const messages = yield* checked(accepted, pairValue(["A", "G1"], ["B", "G1"]));

      assert.deepStrictEqual(
        messages.map(({ response: named }) => named),
        [response],
      );
      assert.match(textsOf(messages).join("\n"), /G1/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "G1"], ["B", "G2"])), []);
    }),
  );

  it.effect("[Q-6] checkResponses: a choice over its match-max is refused in tier (a)", () =>
    Effect.gen(function* overMatchMax() {
      const accepted = yield* acceptedFixture("gap-match.xml");
      const messages = yield* checked(accepted, pairValue(["A", "G1"], ["A", "G2"]));

      assert.strictEqual(messages.length, 1);
      assert.match(textsOf(messages).join("\n"), /\bA\b/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["B", "G1"], ["B", "G2"])), []);
    }),
  );

  it.effect("[Q-6] checkResponses: a pair outside match-group is refused in tier (a)", () =>
    Effect.gen(function* outsideMatchGroup() {
      const xml = edited(
        yield* fixtureText("gap-match.xml"),
        '<qti-gap-text identifier="A" match-max="1">',
        '<qti-gap-text identifier="A" match-max="1" match-group="G1">',
      );
      const accepted = yield* accept("gap-match-group.xml", xml);
      const messages = yield* checked(accepted, pairValue(["A", "G2"]));

      assert.strictEqual(messages.length, 1);
      assert.match(textsOf(messages).join("\n"), /\bA\b.*\bG2\b/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "G1"])), []);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["B", "G2"])), []);
    }),
  );

  it.effect(
    "[Q-6] checkResponses: above max-associations is refused in tier (a); below min-associations only under validateResponses",
    () =>
      Effect.gen(function* associationBounds() {
        const base = yield* fixtureText("gap-match.xml");
        const threeGaps = edited(
          base,
          'they <qti-gap identifier="G2"/> in spring.',
          'they <qti-gap identifier="G2"/> in spring and <qti-gap identifier="G3"/> in the sun.',
        );
        const capped = yield* accept("gap-match-three.xml", threeGaps);
        const atMost = message("en", "atMost", { n: "2" });
        const three = pairValue(["A", "G1"], ["B", "G2"], ["C", "G3"]);

        for (const validateResponses of [false, true]) {
          assert.deepStrictEqual(textsOf(yield* checked(capped, three, validateResponses)), [
            atMost,
          ]);
        }

        const floored = yield* accept(
          "gap-match-min.xml",
          edited(base, 'max-associations="2"', 'max-associations="2" min-associations="1"'),
        );
        const atLeast = message("en", "atLeast", { n: "1" });

        assert.deepStrictEqual(yield* checked(floored, pairValue()), []);
        assert.deepStrictEqual(textsOf(yield* checked(floored, pairValue(), true)), [atLeast]);
        assert.deepStrictEqual(yield* checked(floored, pairValue(["A", "G1"]), true), []);

        const worded = yield* accept(
          "gap-match-words.xml",
          edited(
            threeGaps,
            'max-associations="2"',
            'max-associations="2" min-associations="1" data-min-selections-message="Fill a gap first." data-max-selections-message="Two gaps at most."',
          ),
        );

        assert.deepStrictEqual(textsOf(yield* checked(worded, undefined, true)), [
          "Fill a gap first.",
        ]);
        assert.deepStrictEqual(textsOf(yield* checked(worded, three)), ["Two gaps at most."]);
      }),
  );

  it.effect("[Q-6] a required gap left empty is refused under validateResponses", () =>
    Effect.gen(function* requiredGap() {
      const accepted = yield* accept(
        "gap-match-required.xml",
        edited(
          yield* fixtureText("gap-match.xml"),
          '<qti-gap identifier="G1"/>',
          '<qti-gap identifier="G1" required="true"/>',
        ),
      );

      assert.deepStrictEqual(yield* checked(accepted, pairValue(["B", "G2"])), []);

      const messages = yield* checked(accepted, pairValue(["B", "G2"]), true);

      assert.strictEqual(messages.length, 1);
      assert.match(textsOf(messages).join("\n"), /G1/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "G1"]), true), []);
    }),
  );

  it.effect(
    "[Q-6] score with the correct pairs gives the maximum and a wrong pair scores below it",
    () =>
      Effect.gen(function* scores() {
        const verdict = yield* opened("gap-match.xml", yield* fixtureText("gap-match.xml"));

        assert.strictEqual(verdict.verdict, "accepted");

        const accepted = yield* acceptedFixture("gap-match.xml");

        assert.deepStrictEqual(yield* scored(accepted, correct), Option.some(1));
        assert.deepStrictEqual(
          yield* scored(accepted, pairValue(["A", "G2"], ["B", "G1"])),
          Option.some(0),
        );
        assert.deepStrictEqual(yield* scored(accepted, pairValue(["A", "G1"])), Option.some(0));
      }),
  );

  it.effect(
    "[Q-6] solution gives the correct pairs and review disables nothing it did not render",
    () =>
      Effect.gen(function* showsSolution() {
        const accepted = yield* acceptedFixture("gap-match.xml");
        const correctAnswer = solution(accepted);

        assert.deepStrictEqual(correctAnswer, { [response]: correct });

        const answering = yield* htmlOf(accepted, { values: correctAnswer });

        assert.deepStrictEqual(
          partsOf(answering, "hidden").map((input) => attributeOf(input, "value")),
          ["A G1", "B G2"],
        );

        for (const mode of ["review", "solution"] as const) {
          const html = yield* htmlOf(accepted, { mode, values: correctAnswer });

          assert.deepStrictEqual(partsOf(html, "hidden"), [], mode);
          assert.strictEqual(textOf(gapOf(html, "G1")), "tulips", mode);
          assert.strictEqual(textOf(gapOf(html, "G2")), "bloom", mode);
          assert.strictEqual(attributeOf(partsOf(html)[0] ?? rootOf(html), "data-mode"), mode);
        }

        const finished = yield* htmlOf(accepted, { disabled: true, values: correctAnswer });

        assert.deepStrictEqual(partsOf(finished, "hidden"), []);

        const recorded = yield* Effect.fromResult(score(accepted, { [response]: correct }));
        const restored = yield* Effect.fromResult(restore(accepted, recorded));

        assert.deepStrictEqual(restored.values, { [response]: correct });
      }),
  );

  it.effect("[Q-6] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* passesCheckTree() {
      for (const file of ["gap-match.xml", "gap-match-shuffle.xml"]) {
        const accepted = yield* acceptedFixture(file);

        for (const showing of [
          {},
          { values: { [response]: pairValue(["A", "G1"], ["B", "G2"]) } },
          { mode: "review" as const, values: { [response]: pairValue(["A", "G1"]) } },
        ]) {
          const tree = rootOf(yield* htmlOf(accepted, { ...showing, seed: "s" }));

          assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), [], file);
          assert.isTrue(roundTrips(tree), file);
        }
      }

      const tree = rootOf(yield* htmlOf(yield* acceptedFixture("gap-match.xml")));
      const group = elementsOf([tree]).find(
        (element) => attributeOf(element, "data-slot") === slotOf(),
      );
      const prompt = elementsOf([tree]).find(
        (element) => attributeOf(element, "data-slot") === slotOf("prompt"),
      );

      assert.isDefined(group);
      assert.isDefined(prompt);
      assert.strictEqual(attributeOf(group ?? tree, "role"), "group");
      assert.strictEqual(nameOf(group ?? tree, tree), "Finish the sentence with two of the words.");
      assert.strictEqual(nameOf(group ?? tree, tree), textOf(prompt ?? tree));
    }),
  );

  it.effect("[Q-6] redact's copy holds no correct response", () =>
    Effect.gen(function* holdsNoAnswer() {
      for (const file of ["gap-match.xml", "gap-match-shuffle.xml"]) {
        const accepted = yield* acceptedFixture(file);
        const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redact(accepted))));
        const pairs = ["A G1", "B G2", "C G3"];

        for (const pair of pairs) {
          assert.notInclude(json, pair, file);
        }

        assert.notInclude(json, "correct", file);
        assert.notInclude(json, "qti-value", file);
        assert.notInclude(json, "SCORE", file);
        assert.include(json, '"kind":"gap-match"', file);
      }
    }),
  );
});
