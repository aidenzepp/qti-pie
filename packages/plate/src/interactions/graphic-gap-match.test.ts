/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-associable-hotspot` and names an area's geometry, not a structure. */
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
  Attributes,
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
import { unsupportedFeatures } from "#plate/validate/verdict.ts";

/**
 * The folder of the fan-out area's fixture items, relative to this file's package.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m3d", "items");

/**
 * The fixture item of the Graphic Gap Match.
 */
const fixture = "graphic-gap-match.xml";

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
const instance = "ggm1";

/**
 * The identifier of the response the Graphic Gap Match binds.
 */
const response = "RESPONSE";

/**
 * The form entry name the Graphic Gap Match's hidden inputs post under in {@link instance}.
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
 * Read the fixture item and give it accepted.
 *
 * @returns The accepted item.
 */
const acceptedFixture = () => Effect.flatMap(fixtureText(fixture), (xml) => accept(fixture, xml));

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
 * The correct response of the fixture: the field on the square plot, the pond on the round water,
 * the hill on the slope.
 */
const correct = pairValue(["A", "H1"], ["B", "H2"], ["C", "H3"]);

/**
 * Give the elements of nodes in document order, each followed by its descendants.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the marker of a Graphic Gap Match part.
 *
 * @param part The part's marker suffix, none for the Root.
 * @returns The `data-slot` value.
 */
const slotOf = (part = ""): string =>
  part === "" ? "graphic-gap-match-interaction" : `graphic-gap-match-interaction-${part}`;

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
 * Give the elements below a root that carry a Graphic Gap Match part's marker, in document order.
 *
 * @param nodes The nodes searched.
 * @param part The part's marker suffix, none for the Root.
 * @returns The elements.
 */
const partsIn = (nodes: readonly Node[], part = ""): readonly Element[] =>
  elementsOf(nodes).filter((element) => attributeOf(element, "data-slot") === slotOf(part));

/**
 * Give the elements of a rendered page that carry a Graphic Gap Match part's marker, in document
 * order.
 *
 * @param html The page's HTML.
 * @param part The part's marker suffix, none for the Root.
 * @returns The elements.
 */
const partsOf = (html: string, part = ""): readonly Element[] => partsIn(parseHtml(html), part);

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
 * Give the gap identifiers of a rendered page, in document order.
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
 * Give the texts of the choices placed in a gap, in order.
 *
 * @param gap The gap's element.
 * @returns The placed choices' texts.
 */
const placedIn = (gap: Element): readonly string[] =>
  partsIn(gap.children, "gap-choice").map((placed) => textOf(placed));

/**
 * Give the one shape element an outline holds, with its attributes.
 *
 * @param outline The outline part.
 * @returns The shape's tag and attributes.
 */
const shapeOf = (outline: Element): { readonly attrs: Attributes; readonly tag: string } => {
  const shapes = outline.children.filter((child) => child.kind === "element");
  const [shape] = shapes;

  return shapes.length === 1 && shape !== undefined
    ? { attrs: shape.attrs, tag: shape.tag }
    : assert.fail(`the outline holds ${shapes.length} elements, not one shape`);
};

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

/**
 * The gap texts the six-choice variant adds after the fixture's third.
 */
const threeMoreChoices = `<qti-gap-text identifier="C" match-max="1">Green hill</qti-gap-text>
      <qti-gap-text identifier="D" match-max="1">Red barn</qti-gap-text>
      <qti-gap-text identifier="E" match-max="1">Old well</qti-gap-text>
      <qti-gap-text identifier="F" match-max="1">Stone wall</qti-gap-text>`;

describe("Graphic Gap Match", () => {
  it.effect(
    "[Q-8] the fixture validates against the QTI 3.0.1 ASI XSD",
    () =>
      Effect.gen(function* fixtureValid() {
        const result = yield* validateAgainst(asiXsd, yield* fixtureText(fixture));

        assert.isTrue(result.valid, result.messages.join("\n"));
      }),
    { tags: ["qti-xsd"], timeout: asiTimeoutMs },
  );

  it.effect("[Q-8] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      const verdict = yield* opened(fixture, yield* fixtureText(fixture));

      assert.strictEqual(verdict.verdict, "accepted");
      assert.isTrue(Option.isSome(acceptedItem(verdict)));
      assert.deepStrictEqual(unsupportedFeatures(verdict), []);
    }),
  );

  it.effect(
    "[Q-8] render emits the root, prompt, image, choices and one gap per hotspot with data-slot markers",
    () =>
      Effect.gen(function* emitsParts() {
        const html = yield* htmlOf(yield* acceptedFixture());
        const slots = elementsOf(parseHtml(html)).flatMap((element) => {
          const slot = attributeOf(element, "data-slot");

          return slot?.startsWith(slotOf()) === true ? [slot] : [];
        });
        const [root] = partsOf(html);

        assert.deepStrictEqual(slots, [
          slotOf(),
          slotOf("prompt"),
          slotOf("image"),
          slotOf("gaps"),
          slotOf("gap"),
          slotOf("outline"),
          slotOf("gap"),
          slotOf("outline"),
          slotOf("gap"),
          slotOf("outline"),
          slotOf("choices"),
          slotOf("choice"),
          slotOf("choice"),
          slotOf("choice"),
        ]);
        assert.deepStrictEqual(poolOf(html), ["A", "B", "C"]);
        assert.deepStrictEqual(gapsOf(html), ["H1", "H2", "H3"]);
        assert.strictEqual(root === undefined ? "" : attributeOf(root, "data-entry-name"), name);
        assert.strictEqual(
          root === undefined ? "" : attributeOf(root, "data-max-associations"),
          "4",
        );
        assert.deepStrictEqual(
          partsOf(html, "choice").map((choice) => attributeOf(choice, "data-match-max")),
          ["2", "1", "1"],
        );
        assert.deepStrictEqual(
          partsOf(html, "gap").map((gap) => attributeOf(gap, "data-match-max")),
          ["2", "1", "1"],
        );
        assert.isTrue(
          elementsOf(parseHtml(html)).some((element) => element.tag === "img"),
          "the author's image renders",
        );
        assert.notInclude(
          elementsOf(parseHtml(html)).map((element) => element.tag),
          "qti-associable-hotspot",
        );
        assert.deepStrictEqual(partsOf(html, "hidden"), []);
        assert.deepStrictEqual(partsOf(html, "gap-choice"), []);
      }),
  );

  it.effect("[Q-8] each gap is named by its hotspot-label and outlined from its coords", () =>
    Effect.gen(function* namesAndOutlines() {
      const html = yield* htmlOf(yield* acceptedFixture());
      const tree = rootOf(html);
      const gaps = partsOf(html, "gap");
      const hit = { "pointer-events": "visiblePainted" };

      assert.deepStrictEqual(
        gaps.map((gap) => nameOf(gap, tree)),
        ["The square plot", "The round water", "The slope"],
      );
      assert.deepStrictEqual(
        gaps.map((gap) => partsIn(gap.children, "outline").map(shapeOf)),
        [
          [
            {
              attrs: { ...hit, "data-shape": "rect", height: "90", width: "140", x: "40", y: "40" },
              tag: "rect",
            },
          ],
          [
            {
              attrs: { ...hit, cx: "300", cy: "90", "data-shape": "circle", r: "50" },
              tag: "circle",
            },
          ],
          [
            {
              attrs: { ...hit, "data-shape": "poly", points: "60,260 150,170 240,260" },
              tag: "polygon",
            },
          ],
        ],
      );
      for (const outline of partsOf(html, "outline")) {
        assert.strictEqual(outline.tag, "svg");
        assert.strictEqual(attributeOf(outline, "aria-hidden"), "true");
        assert.strictEqual(attributeOf(outline, "viewBox"), "0 0 400 300");
      }
    }),
  );

  it.effect(
    "[Q-8] an area with too few coords keeps its gap and its label but draws no outline",
    () =>
      Effect.gen(function* tooFewCoords() {
        const accepted = yield* accept(
          "graphic-gap-match-short.xml",
          edited(
            yield* fixtureText(fixture),
            'shape="circle" coords="300,90,50"',
            'shape="poly" coords="300,90,50"',
          ),
        );
        const html = yield* htmlOf(accepted, { values: { [response]: pairValue(["B", "H2"]) } });
        const tree = rootOf(html);

        assert.deepStrictEqual(gapsOf(html), ["H1", "H2", "H3"]);
        assert.deepStrictEqual(
          partsOf(html, "gap").map((gap) => partsIn(gap.children, "outline").length),
          [1, 0, 1],
        );
        assert.strictEqual(nameOf(gapOf(html, "H2"), tree), "The round water");
        assert.deepStrictEqual(placedIn(gapOf(html, "H2")), ["Duck pond"]);
      }),
  );

  it.effect(
    "[Q-8] restored pairs show inside their gaps, a repeated pair twice, each with its hidden input",
    () =>
      Effect.gen(function* restoresPairs() {
        const accepted = yield* acceptedFixture();
        const html = yield* htmlOf(accepted, {
          values: { [response]: pairValue(["A", "H1"], ["A", "H1"], ["B", "H2"]) },
        });
        const [root] = partsOf(html);

        assert.deepStrictEqual(placedIn(gapOf(html, "H1")), ["Wheat field", "Wheat field"]);
        assert.deepStrictEqual(placedIn(gapOf(html, "H2")), ["Duck pond"]);
        assert.deepStrictEqual(placedIn(gapOf(html, "H3")), []);
        assert.deepStrictEqual(
          partsOf(html, "gap-choice").map((placed) => attributeOf(placed, "data-identifier")),
          ["A", "A", "B"],
        );
        assert.deepStrictEqual(
          partsOf(html, "hidden").map((input) => [
            attributeOf(input, "name"),
            attributeOf(input, "type"),
            attributeOf(input, "value"),
          ]),
          [
            [name, "hidden", "A H1"],
            [name, "hidden", "A H1"],
            [name, "hidden", "B H2"],
          ],
        );
        assert.strictEqual(root === undefined ? "" : attributeOf(root, "data-entry-name"), name);
      }),
  );

  it.effect(
    "[Q-8] shuffle orders the choices by seed and instance and keeps a fixed choice in place",
    () =>
      Effect.gen(function* shuffles() {
        const six = yield* accept(
          "graphic-gap-match-six.xml",
          edited(
            yield* fixtureText(fixture),
            '<qti-gap-text identifier="C" match-max="1">Green hill</qti-gap-text>',
            threeMoreChoices,
          ),
        );
        const all = ["A", "B", "C", "D", "E", "F"];

        assert.deepStrictEqual(poolOf(yield* htmlOf(six, { instance: "i1", seed: "s" })), all);

        const json = yield* Effect.fromResult(encodeRedacted(redact(six)));
        const shuffled = yield* Effect.fromResult(
          decodeRedacted({
            ...json,
            body: json.body.map((node) =>
              node.kind === "graphic-gap-match"
                ? {
                    ...node,
                    choices: node.choices.map((choice, index) =>
                      index === 2 ? { ...choice, fixed: true } : choice,
                    ),
                    shuffle: true,
                  }
                : node,
            ),
          }),
        );
        const configuration = yield* configure({ seed: "s" });
        const other = yield* configure({ seed: "t" });
        const poolUnder = (token: string, keyed = configuration) =>
          Effect.fromResult(
            Result.map(render(shuffled, keyed, { instance: token }), ({ html }) => ({
              gaps: gapsOf(html),
              pool: poolOf(html),
            })),
          );
        const first = yield* poolUnder("i1");
        const again = yield* poolUnder("i1");
        const elsewhere = yield* poolUnder("i2");
        const reseeded = yield* poolUnder("i1", other);

        assert.deepStrictEqual(first, again);
        assert.notDeepEqual(first.pool, elsewhere.pool);
        assert.notDeepEqual(first.pool, reseeded.pool);
        assert.notDeepEqual(first.pool, all);
        for (const { gaps, pool } of [first, elsewhere, reseeded]) {
          assert.sameMembers([...pool], all);
          assert.strictEqual(pool[2], "C");
          assert.deepStrictEqual(gaps, ["H1", "H2", "H3"]);
        }

        const orders = new Set<string>();
        for (const token of ["i1", "i2", "i3", "i4", "i5"]) {
          const { pool } = yield* poolUnder(token);

          assert.strictEqual(pool[2], "C");
          orders.add(pool.join(" "));
        }

        assert.isAbove(orders.size, 1);
      }),
  );

  it.effect(
    "[Q-8] postings binds the response as a multiple directedPair and decode reads the posted pairs",
    () =>
      Effect.gen(function* posts() {
        const accepted = yield* acceptedFixture();
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

        form.append(name, "A H1");
        form.append(name, "A H1");
        form.append(name, "B H2");

        const entries: readonly Entry[] = [...form.entries()];

        assert.deepStrictEqual(
          decode(entries, posted.binding, posted.options),
          Result.succeed(pairValue(["A", "H1"], ["A", "H1"], ["B", "H2"])),
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

  it.effect("[Q-8] checkResponses: a hotspot over its match-max is refused in tier (a)", () =>
    Effect.gen(function* hotspotOverMatchMax() {
      const accepted = yield* acceptedFixture();
      const messages = yield* checked(accepted, pairValue(["A", "H1"], ["B", "H1"], ["C", "H1"]));

      assert.deepStrictEqual(
        messages.map(({ response: named }) => named),
        [response],
      );
      assert.match(textsOf(messages).join("\n"), /\bH1\b/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "H1"], ["B", "H1"])), []);
      assert.strictEqual((yield* checked(accepted, pairValue(["B", "H2"], ["C", "H2"]))).length, 1);
    }),
  );

  it.effect(
    "[Q-8] checkResponses: a choice over its match-max, counting repeats, is refused in tier (a)",
    () =>
      Effect.gen(function* choiceOverMatchMax() {
        const accepted = yield* acceptedFixture();
        const messages = yield* checked(accepted, pairValue(["A", "H1"], ["A", "H1"], ["A", "H2"]));

        assert.strictEqual(messages.length, 1);
        assert.match(textsOf(messages).join("\n"), /\bA\b/u);
        assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "H1"], ["A", "H1"])), []);
        assert.deepStrictEqual(yield* checked(accepted, pairValue(["A", "H1"], ["A", "H2"])), []);
        assert.strictEqual(
          (yield* checked(accepted, pairValue(["B", "H1"], ["B", "H2"]))).length,
          1,
        );
      }),
  );

  it.effect(
    "[Q-8] checkResponses: a pair outside either side's match-group is refused in tier (a)",
    () =>
      Effect.gen(function* outsideMatchGroup() {
        const base = yield* fixtureText(fixture);
        const choiceGrouped = yield* accept(
          "graphic-gap-match-choice-group.xml",
          edited(
            base,
            '<qti-gap-text identifier="A" match-max="2">',
            '<qti-gap-text identifier="A" match-max="2" match-group="H1 H3">',
          ),
        );
        const refusedChoice = yield* checked(choiceGrouped, pairValue(["A", "H2"]));

        assert.strictEqual(refusedChoice.length, 1);
        assert.match(textsOf(refusedChoice).join("\n"), /\bA\b.*\bH2\b/u);
        assert.deepStrictEqual(
          yield* checked(choiceGrouped, pairValue(["A", "H1"], ["A", "H3"])),
          [],
        );
        assert.deepStrictEqual(yield* checked(choiceGrouped, pairValue(["B", "H2"])), []);

        const hotspotGrouped = yield* accept(
          "graphic-gap-match-hotspot-group.xml",
          edited(
            base,
            'match-max="1" hotspot-label="The slope"',
            'match-max="1" match-group="A B" hotspot-label="The slope"',
          ),
        );
        const refusedHotspot = yield* checked(hotspotGrouped, pairValue(["C", "H3"]));

        assert.strictEqual(refusedHotspot.length, 1);
        assert.match(textsOf(refusedHotspot).join("\n"), /\bC\b.*\bH3\b/u);
        assert.deepStrictEqual(yield* checked(hotspotGrouped, pairValue(["B", "H3"])), []);
        assert.deepStrictEqual(yield* checked(hotspotGrouped, pairValue(["C", "H2"])), []);
      }),
  );

  it.effect(
    "[Q-8] checkResponses: above max-associations always, below min-associations only under validateResponses",
    () =>
      Effect.gen(function* associationBounds() {
        const base = yield* fixtureText(fixture);
        const roomy = edited(
          edited(
            base,
            '<qti-gap-text identifier="B" match-max="1">',
            '<qti-gap-text identifier="B" match-max="2">',
          ),
          'coords="300,90,50" match-max="1"',
          'coords="300,90,50" match-max="2"',
        );
        const capped = yield* accept("graphic-gap-match-roomy.xml", roomy);
        const five = pairValue(["A", "H1"], ["A", "H1"], ["B", "H2"], ["B", "H2"], ["C", "H3"]);
        const atMost = message("en", "atMost", { n: "4" });

        for (const validateResponses of [false, true]) {
          assert.deepStrictEqual(textsOf(yield* checked(capped, five, validateResponses)), [
            atMost,
          ]);
        }
        assert.deepStrictEqual(yield* checked(capped, correct), []);

        const floored = yield* accept(
          "graphic-gap-match-min.xml",
          edited(base, 'max-associations="4"', 'max-associations="4" min-associations="1"'),
        );
        const atLeast = message("en", "atLeast", { n: "1" });

        assert.deepStrictEqual(yield* checked(floored, pairValue()), []);
        assert.deepStrictEqual(textsOf(yield* checked(floored, pairValue(), true)), [atLeast]);
        assert.deepStrictEqual(yield* checked(floored, pairValue(["A", "H1"]), true), []);

        const worded = yield* accept(
          "graphic-gap-match-words.xml",
          edited(
            roomy,
            'max-associations="4"',
            'max-associations="4" min-associations="1" data-min-selections-message="Place a label first." data-max-selections-message="Four labels at most."',
          ),
        );

        assert.deepStrictEqual(textsOf(yield* checked(worded, undefined, true)), [
          "Place a label first.",
        ]);
        assert.deepStrictEqual(textsOf(yield* checked(worded, five)), ["Four labels at most."]);

        const unwritten = yield* accept(
          "graphic-gap-match-default.xml",
          edited(base, ' max-associations="4"', ""),
        );
        const unlimited = yield* accept(
          "graphic-gap-match-unlimited.xml",
          edited(base, 'max-associations="4"', 'max-associations="0"'),
        );

        assert.deepStrictEqual(textsOf(yield* checked(unwritten, correct)), [
          message("en", "atMost", { n: "1" }),
        ]);
        assert.deepStrictEqual(yield* checked(unwritten, pairValue(["A", "H1"])), []);
        assert.deepStrictEqual(yield* checked(unlimited, correct), []);
      }),
  );

  it.effect(
    "[Q-8] score with the correct pairs gives the maximum and a wrong pair scores below it",
    () =>
      Effect.gen(function* scores() {
        const accepted = yield* acceptedFixture();

        assert.notInclude(
          accepted.unsupported.map((entry) => entry.feature),
          "qti-graphic-gap-match-interaction",
          "the item is scored with its interaction rendered, not as a notice",
        );
        assert.deepStrictEqual(yield* scored(accepted, correct), Option.some(1));
        assert.deepStrictEqual(
          yield* scored(accepted, pairValue(["A", "H2"], ["B", "H1"], ["C", "H3"])),
          Option.some(0),
        );
        assert.deepStrictEqual(
          yield* scored(accepted, pairValue(["A", "H1"], ["B", "H2"])),
          Option.some(0),
        );
      }),
  );

  it.effect(
    "[Q-8] solution gives the correct pairs and review and solution modes write no hidden input",
    () =>
      Effect.gen(function* showsSolution() {
        const accepted = yield* acceptedFixture();
        const correctAnswer = solution(accepted);

        assert.deepStrictEqual(correctAnswer, { [response]: correct });

        const answering = yield* htmlOf(accepted, { values: correctAnswer });

        assert.deepStrictEqual(
          partsOf(answering, "hidden").map((input) => attributeOf(input, "value")),
          ["A H1", "B H2", "C H3"],
        );

        for (const mode of ["review", "solution"] as const) {
          const html = yield* htmlOf(accepted, { mode, values: correctAnswer });

          assert.deepStrictEqual(partsOf(html, "hidden"), [], mode);
          assert.deepStrictEqual(placedIn(gapOf(html, "H1")), ["Wheat field"], mode);
          assert.deepStrictEqual(placedIn(gapOf(html, "H2")), ["Duck pond"], mode);
          assert.deepStrictEqual(placedIn(gapOf(html, "H3")), ["Green hill"], mode);
          assert.strictEqual(attributeOf(partsOf(html)[0] ?? rootOf(html), "data-mode"), mode);
        }

        const finished = yield* htmlOf(accepted, { disabled: true, values: correctAnswer });

        assert.deepStrictEqual(partsOf(finished, "hidden"), []);

        const recorded = yield* Effect.fromResult(score(accepted, { [response]: correct }));
        const restored = yield* Effect.fromResult(restore(accepted, recorded));

        assert.deepStrictEqual(restored.values, { [response]: correct });
      }),
  );

  it.effect("[Q-8] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* passesCheckTree() {
      const accepted = yield* acceptedFixture();

      for (const showing of [
        {},
        { values: { [response]: pairValue(["A", "H1"], ["A", "H1"], ["B", "H2"]) } },
        { mode: "review" as const, values: { [response]: pairValue(["A", "H1"]) } },
      ]) {
        const tree = rootOf(yield* htmlOf(accepted, { ...showing, seed: "s" }));

        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(tree));
      }

      const tree = rootOf(yield* htmlOf(accepted));
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
        "Put each label on the part of the farm it names.",
      );
      assert.strictEqual(nameOf(group ?? tree, tree), textOf(prompt ?? tree));
    }),
  );

  it.effect("[Q-8] redact's copy holds no correct response", () =>
    Effect.gen(function* holdsNoAnswer() {
      const accepted = yield* acceptedFixture();
      const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redact(accepted))));

      for (const pair of ["A H1", "B H2", "C H3"]) {
        assert.notInclude(json, pair);
      }

      assert.notInclude(json, "correct");
      assert.notInclude(json, "qti-value");
      assert.notInclude(json, "SCORE");
      assert.include(json, '"kind":"graphic-gap-match"');
    }),
  );
});
