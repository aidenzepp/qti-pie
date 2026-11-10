import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import {
  checkResponses,
  configure,
  decode,
  decodeRedacted,
  encodeRedacted,
  entryName,
  h,
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
  Node,
  Options,
  Redacted,
  RedactedJson,
  Value,
} from "#plate/index.ts";
import { partForSlot } from "#plate/emit/parts.ts";
import { regionsOf } from "#plate/model/interactions.ts";
import { format, isRecordValue } from "#plate/model/values.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The instance every render here passes, so the entry name and every id are fixed.
 */
const instance = "q1";

/**
 * The entry name the interaction's hidden inputs post under.
 */
const entry = entryName(instance, "RESPONSE");

/**
 * The fixture folder of area `ei`, beside the package's `src`.
 */
const fixtureFolder = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The marker prefix of every Graphic Order part, read through the part table's `slotFor` rule.
 */
const owner = "graphic-order-interaction";

/**
 * Read a fixture item as text.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns The item's text.
 */
const textOfFixture = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureFolder, file), "utf-8"));

/**
 * Open item text as a host opens a document it read from storage, and accept it.
 *
 * @param file The item's name, which the verdict carries as its location.
 * @param text The item's text.
 * @returns The accepted item, or a failed assertion naming the verdict.
 */
const accept = Effect.fnUntraced(function* accept(file: string, text: string) {
  const verdict = yield* open(`fixtures/ei/items/${file}`, new TextEncoder().encode(text));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${file} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open a fixture and accept it, with text edits applied first.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @param edits Each `[from, to]` replaces one occurrence of `from` in the text.
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture(
  file: string,
  edits: readonly (readonly [string, string])[] = [],
) {
  let text = yield* textOfFixture(file);
  for (const [from, to] of edits) {
    assert.include(text, from, `${file} holds ${from}`);
    text = text.replace(from, to);
  }

  return yield* accept(file, text);
});

/**
 * Construct an ordered identifier value.
 *
 * @param identifiers The identifiers, in order.
 * @returns The value.
 */
const ordered = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "ordered",
  values: identifiers.map((identifier) => ({ baseType: "identifier", value: identifier })),
});

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Select the elements one part marks, in document order.
 *
 * @param root The tree's root.
 * @param part The part's marker suffix, empty for the Root.
 * @returns The elements carrying `graphic-order-interaction<part>`.
 */
const parts = (root: Element, part: string): readonly Element[] =>
  elementsOf([root]).filter((element) => element.attrs["data-slot"] === `${owner}${part}`);

/**
 * Render an accepted item and parse its HTML.
 *
 * @param accepted The accepted item.
 * @param options The render's options, the fixed instance by default.
 * @param configuration The configuration's inputs, none by default.
 * @returns The root element, and the HTML as written.
 */
const rendered = Effect.fnUntraced(function* rendered(
  accepted: Accepted,
  options: Options = {},
  configuration: { readonly validateResponses?: boolean } = {},
) {
  const configured = yield* configure(configuration);
  const page = yield* Effect.fromResult(
    render(redact(accepted), configured, { instance, ...options }),
  );
  const [root, ...rest] = parseHtml(page.html);
  assert.lengthOf(rest, 0, "one root");
  if (root?.kind !== "element") {
    return assert.fail("the root is not an element");
  }

  const interaction = parts(root, "")[0] ?? assert.fail("the page holds no Graphic Order Root");

  return { html: page.html, interaction, root };
});

/**
 * Read an attribute as a string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, the empty string for a bare attribute, `undefined` when absent.
 */
const attr = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === true ? "" : value;
};

/**
 * Give an element's child elements.
 *
 * @param element The element.
 * @returns Its element children.
 */
const childrenOf = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Write a value or a redacted item as JSON, a bigint as its digits.
 *
 * @param value The value.
 * @returns Its JSON text.
 */
const json = (value: Redacted | RedactedJson): string =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- `JSON.stringify` hands its replacer every value, of any type; it only looks for a bigint.
  JSON.stringify(value, (_key, field: unknown) =>
    Predicate.isBigInt(field) ? String(field) : field,
  );

/**
 * Read the outline of the hotspot with an identifier: its shape element and the `svg`.
 *
 * @param root The tree's root.
 * @param identifier The hotspot's identifier.
 * @returns The `svg` and the figure it holds, none when the hotspot is drawn with no outline.
 */
const outlineOf = (root: Element, identifier: string) => {
  const hotspot = parts(root, "-hotspot").find(
    (each) => attr(each, "data-identifier") === identifier,
  );
  const svg = hotspot === undefined ? undefined : parts(hotspot, "-outline")[0];

  return svg === undefined ? undefined : { figure: childrenOf(svg)[0], svg };
};

/**
 * Read the figure element's attributes as a plain record of strings.
 *
 * @param figure The figure element, if any.
 * @returns Its tag and attributes.
 */
const drawnOf = (figure: Element | undefined) =>
  figure === undefined
    ? undefined
    : {
        attrs: Object.fromEntries(
          Object.entries(figure.attrs).map(([name, value]) => [name, String(value)]),
        ),
        tag: figure.tag,
      };

/**
 * The correct order of the fixture `graphic-order.xml`.
 */
const correct = ordered("H2", "H4", "H1", "H3");

describe("[Q-9] Graphic Order", () => {
  it.effect("[Q-9] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opens() {
      for (const file of ["graphic-order.xml", "graphic-order-subset.xml"]) {
        const accepted = yield* accept(file, yield* textOfFixture(file));

        assert.deepStrictEqual(accepted.unsupported, [], file);
        assert.strictEqual(
          accepted.item.body.some((node) => node.kind === "graphic-order"),
          true,
          `${file} holds a graphic-order node`,
        );
      }
    }),
  );

  it.effect(
    "[Q-9] render emits the image, one hotspot per choice and one position per hotspot to order",
    () =>
      Effect.gen(function* emits() {
        const full = yield* rendered(yield* fixture("graphic-order.xml"));
        const subset = yield* rendered(yield* fixture("graphic-order-subset.xml"));
        const hotspots = parts(full.root, "-hotspot");
        const list = parts(full.root, "-ordered");
        const everything = elementsOf([full.root]);
        const [image] = parts(full.root, "-image");

        assert.deepStrictEqual(
          hotspots.map((hotspot) => attr(hotspot, "data-identifier")),
          ["H1", "H2", "H3", "H4"],
        );
        assert.lengthOf(list, 1);
        assert.strictEqual(list[0]?.tag, "ol");
        assert.lengthOf(parts(full.root, "-slot"), 4);
        assert.lengthOf(parts(subset.root, "-hotspot"), 4);
        assert.lengthOf(parts(subset.root, "-slot"), 3);
        assert.isDefined(image);
        assert.isTrue(
          everything.findIndex((element) => element.tag === "img") <
            everything.indexOf(parts(full.root, "-hotspots")[0] ?? full.root),
          "the hotspots follow the image in the DOM",
        );
        assert.isTrue(
          image !== undefined &&
            elementsOf([image]).some((element) => element.tag === "img") &&
            hotspots.every((hotspot) => elementsOf([image]).includes(hotspot)),
          "the image part holds the image and the hotspots",
        );
        assert.isFalse(full.html.includes("Not supported here"), "no notice");
        for (const slot of [
          "",
          "-badge",
          "-hidden",
          "-hotspot",
          "-hotspots",
          "-image",
          "-ordered",
          "-outline",
          "-prompt",
          "-slot",
        ]) {
          assert.isTrue(
            Option.exists(partForSlot(`${owner}${slot}`), (part) => part.interaction === owner),
            `${owner}${slot} is a part`,
          );
        }
      }),
  );

  it.effect("[Q-9] each hotspot is named by its hotspot-label and outlined from its coords", () =>
    Effect.gen(function* outlines() {
      const full = yield* rendered(yield* fixture("graphic-order.xml"));
      const subset = yield* rendered(yield* fixture("graphic-order-subset.xml"));

      assert.deepStrictEqual(
        parts(full.root, "-hotspot").map((hotspot) => nameOf(hotspot, full.root)),
        ["House", "Sun", "Hill", "Boat"],
      );
      assert.deepStrictEqual(
        parts(subset.root, "-hotspot").map((hotspot) => nameOf(hotspot, subset.root)),
        ["House", "Sun", "Area 3 of 4", "Anywhere else"],
      );
      assert.deepStrictEqual(drawnOf(outlineOf(full.root, "H1")?.figure), {
        attrs: { height: "50", width: "70", x: "30", y: "40" },
        tag: "rect",
      });
      assert.deepStrictEqual(drawnOf(outlineOf(full.root, "H2")?.figure), {
        attrs: { cx: "160", cy: "70", r: "30" },
        tag: "circle",
      });
      assert.deepStrictEqual(drawnOf(outlineOf(full.root, "H3")?.figure), {
        attrs: { points: "220,110 260,50 300,110" },
        tag: "polygon",
      });
      assert.deepStrictEqual(drawnOf(outlineOf(full.root, "H4")?.figure), {
        attrs: { cx: "90", cy: "165", rx: "45", ry: "20" },
        tag: "ellipse",
      });
      for (const svg of parts(full.root, "-outline")) {
        assert.strictEqual(svg.tag, "svg");
        assert.strictEqual(attr(svg, "aria-hidden"), "true");
        assert.strictEqual(attr(svg, "viewBox"), "0 0 320 200");
      }

      assert.deepStrictEqual(
        parts(subset.root, "-hotspot").map((hotspot) => attr(hotspot, "data-area")),
        ["rect", "circle", "poly", "default"],
      );
      assert.deepStrictEqual(drawnOf(outlineOf(subset.root, "H4")?.figure), {
        attrs: { height: "100%", width: "100%", x: "0", y: "0" },
        tag: "rect",
      });
    }),
  );

  it.effect(
    "[Q-9] a shape with too few coordinates is listed and labelled but drawn with no outline, and a percentage is read against the image",
    () =>
      Effect.gen(function* readings() {
        const short = yield* rendered(
          yield* fixture("graphic-order.xml", [
            ['coords="30,40,100,90"', 'coords="30,40,100"'],
            ['coords="160,70,30"', 'coords="160,70,0"'],
          ]),
        );
        const percent = yield* rendered(
          yield* fixture("graphic-order.xml", [
            ['coords="30,40,100,90"', 'coords="10%,20%,50%,60%"'],
          ]),
        );
        const hotspot = (identifier: string) =>
          parts(short.root, "-hotspot").find(
            (each) => attr(each, "data-identifier") === identifier,
          );

        assert.isUndefined(outlineOf(short.root, "H1"));
        assert.isUndefined(outlineOf(short.root, "H2"));
        assert.isDefined(outlineOf(short.root, "H3"));
        assert.strictEqual(nameOf(hotspot("H1") ?? assert.fail("no H1"), short.root), "House");
        assert.deepStrictEqual(drawnOf(outlineOf(percent.root, "H1")?.figure), {
          attrs: { height: "80", width: "128", x: "32", y: "40" },
          tag: "rect",
        });
      }),
  );

  it.effect(
    "[Q-9] a hotspot's template-identifier is a mark on the verdict, and the hotspot renders as shown",
    () =>
      Effect.gen(function* templated() {
        const accepted = yield* fixture("graphic-order.xml", [
          [
            'identifier="H1" shape="rect"',
            'identifier="H1" template-identifier="T1" show-hide="hide" shape="rect"',
          ],
          [
            "<qti-outcome-declaration",
            '<qti-template-declaration identifier="T1" cardinality="single" base-type="identifier"/><qti-outcome-declaration',
          ],
        ]);
        const page = yield* rendered(accepted);

        assert.deepStrictEqual(accepted.unsupported, [
          {
            feature: "template-identifier",
            path: "qti-assessment-item/qti-item-body/qti-graphic-order-interaction/qti-hotspot-choice[1]",
            shown: "mark",
          },
        ]);
        assert.lengthOf(parts(page.root, "-hotspot"), 4);
      }),
  );

  it.effect(
    "[Q-9] a restored order shows a badge on each ordered hotspot and fills the positions",
    () =>
      Effect.gen(function* restored() {
        const accepted = yield* fixture("graphic-order.xml");
        const page = yield* rendered(accepted, { values: { RESPONSE: ordered("H3", "H1") } });
        const badges = (identifier: string) => {
          const hotspot = parts(page.root, "-hotspot").find(
            (each) => attr(each, "data-identifier") === identifier,
          );

          return hotspot === undefined ? [] : parts(hotspot, "-badge").map(textOf);
        };
        const hidden = parts(page.root, "-hidden");

        assert.deepStrictEqual(badges("H3"), ["1"]);
        assert.deepStrictEqual(badges("H1"), ["2"]);
        assert.deepStrictEqual(badges("H2"), []);
        assert.deepStrictEqual(badges("H4"), []);
        assert.deepStrictEqual(parts(page.root, "-slot").map(textOf), [
          "Hill",
          "House",
          "Empty",
          "Empty",
        ]);
        assert.deepStrictEqual(
          hidden.map((input) => [
            input.tag,
            attr(input, "type"),
            attr(input, "name"),
            attr(input, "value"),
          ]),
          [
            ["input", "hidden", entry, "H3"],
            ["input", "hidden", entry, "H1"],
          ],
        );
        assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-9] a refused post shows the posted order, leaving out what names no hotspot and a repeat",
    () =>
      Effect.gen(function* posted() {
        const accepted = yield* fixture("graphic-order.xml");
        const page = yield* rendered(accepted, {
          messages: [{ response: "RESPONSE", text: "Order the markers." }],
          posted: { RESPONSE: ["H4", "H4", "Z9", "H2"] },
          values: { RESPONSE: ordered("H1") },
        });

        assert.deepStrictEqual(
          parts(page.root, "-hidden").map((input) => attr(input, "value")),
          ["H4", "H2"],
        );
        assert.deepStrictEqual(parts(page.root, "-slot").map(textOf), [
          "Boat",
          "Sun",
          "Empty",
          "Empty",
        ]);
        assert.strictEqual(attr(page.interaction, "aria-describedby"), "q1-RESPONSE-message-0");
      }),
  );

  it.effect("[Q-9] the root carries the effective bounds and the entry name", () =>
    Effect.gen(function* bounds() {
      const full = yield* rendered(yield* fixture("graphic-order.xml"));
      const subset = yield* rendered(yield* fixture("graphic-order-subset.xml"));
      const written = yield* rendered(
        yield* fixture("graphic-order-subset.xml", [[' max-choices="3"', ""]]),
      );

      assert.deepStrictEqual(
        [attr(full.interaction, "data-min-choices"), attr(full.interaction, "data-max-choices")],
        ["4", "4"],
      );
      assert.deepStrictEqual(
        [
          attr(subset.interaction, "data-min-choices"),
          attr(subset.interaction, "data-max-choices"),
        ],
        ["2", "3"],
      );
      assert.deepStrictEqual(
        [
          attr(written.interaction, "data-min-choices"),
          attr(written.interaction, "data-max-choices"),
        ],
        ["2", "4"],
      );
      assert.strictEqual(attr(full.interaction, "data-entry-name"), entry);
      assert.strictEqual(attr(full.interaction, "data-mode"), "answering");
    }),
  );

  it.effect(
    "[Q-9] postings binds the response as an ordered identifier and decode keeps the posted order",
    () =>
      Effect.gen(function* binds() {
        const accepted = yield* fixture("graphic-order.xml");
        const [posting = assert.fail("no posting"), ...rest] = postings(redact(accepted), instance);

        assert.lengthOf(rest, 0);
        assert.deepStrictEqual(posting.binding, {
          baseType: "identifier",
          cardinality: "ordered",
          name: entry,
        });
        assert.strictEqual(posting.identifier, "RESPONSE");

        const decoded = yield* Effect.fromResult(
          decode(
            [
              [entry, "H3"],
              [entry, "H1"],
              ["other", "x"],
              [entry, "H4"],
            ],
            posting.binding,
            posting.options,
          ),
        );

        assert.deepStrictEqual(
          isRecordValue(decoded) ? assert.fail("a record") : decoded.values.map(format),
          ["H3", "H1", "H4"],
        );
      }),
  );

  it.effect("[Q-9] checkResponses: a hotspot twice is refused in tier (a)", () =>
    Effect.gen(function* twice() {
      const accepted = yield* fixture("graphic-order.xml");

      for (const validateResponses of [false, true]) {
        const messages = checkResponses(
          accepted,
          { RESPONSE: ordered("H1", "H1", "H2", "H3") },
          yield* configure({ validateResponses }),
        );

        assert.lengthOf(messages, 1, `validateResponses ${String(validateResponses)}`);
        assert.strictEqual(messages[0]?.response, "RESPONSE");
        assert.include(messages[0]?.text ?? "", "House");
      }

      assert.deepStrictEqual(
        checkResponses(accepted, { RESPONSE: ordered("H1", "Z9") }, yield* configure({})).map(
          (message) => message.response,
        ),
        ["RESPONSE"],
      );
    }),
  );

  it.effect(
    "[Q-9] checkResponses: without min-choices all must be ordered, under validateResponses",
    () =>
      Effect.gen(function* allOrdered() {
        const accepted = yield* fixture("graphic-order.xml");
        const partial = { RESPONSE: ordered("H1", "H2") };
        const lenient = checkResponses(accepted, partial, yield* configure({}));
        const strict = checkResponses(
          accepted,
          partial,
          yield* configure({ validateResponses: true }),
        );
        const whole = checkResponses(
          accepted,
          { RESPONSE: ordered("H4", "H3", "H2", "H1") },
          yield* configure({ validateResponses: true }),
        );

        assert.deepStrictEqual(lenient, []);
        assert.lengthOf(strict, 1);
        assert.include(strict[0]?.text ?? "", "4");
        assert.deepStrictEqual(whole, []);
      }),
  );

  it.effect("[Q-9] checkResponses: the subset bounds", () =>
    Effect.gen(function* subset() {
      const accepted = yield* fixture("graphic-order-subset.xml");
      const check = (identifiers: readonly string[], validateResponses: boolean) =>
        configure({ validateResponses }).pipe(
          Effect.map((configuration) =>
            checkResponses(accepted, { RESPONSE: ordered(...identifiers) }, configuration),
          ),
        );

      assert.deepStrictEqual(yield* check(["H1"], false), []);
      assert.lengthOf(yield* check(["H1"], true), 1);
      assert.deepStrictEqual(yield* check(["H1", "H2"], true), []);
      assert.deepStrictEqual(yield* check(["H1", "H2", "H4"], true), []);
      assert.lengthOf(yield* check(["H1", "H2", "H3", "H4"], false), 1);
      assert.lengthOf(yield* check(["H1", "H2", "H3", "H4"], true), 1);
      assert.lengthOf(yield* check([], true), 1);
      assert.deepStrictEqual(yield* check([], false), []);
    }),
  );

  it.effect("[Q-9] score with the correct order gives the maximum and a swap scores below it", () =>
    Effect.gen(function* scores() {
      const accepted = yield* fixture("graphic-order.xml");
      const scoreOf = (value: Value) =>
        score(accepted, { RESPONSE: value }).pipe(
          Effect.fromResult,
          Effect.map((record) => record.outcomes["SCORE"]?.values.map((single) => single.value)),
        );

      assert.deepStrictEqual(accepted.unsupported, [], "the item is not unsupported");
      assert.deepStrictEqual(yield* scoreOf(correct), [1]);
      assert.deepStrictEqual(yield* scoreOf(ordered("H4", "H2", "H1", "H3")), [0]);
      assert.deepStrictEqual(yield* scoreOf(ordered("H2", "H4", "H1")), [0]);
    }),
  );

  it.effect(
    "[Q-9] solution shows the correct order, and finished modes write no hidden input",
    () =>
      Effect.gen(function* solved() {
        const accepted = yield* fixture("graphic-order.xml");
        const correctValues = solution(accepted);
        const shown = yield* rendered(accepted, { mode: "solution", values: correctValues });
        const review = yield* rendered(accepted, {
          mode: "review",
          values: { RESPONSE: ordered("H1", "H2") },
        });
        const answering = yield* rendered(accepted, { values: { RESPONSE: ordered("H1", "H2") } });
        const disabled = yield* rendered(accepted, {
          disabled: true,
          values: { RESPONSE: ordered("H1", "H2") },
        });

        assert.deepStrictEqual(correctValues["RESPONSE"], correct);
        assert.deepStrictEqual(parts(shown.root, "-slot").map(textOf), [
          "Sun",
          "Boat",
          "House",
          "Hill",
        ]);
        assert.deepStrictEqual(
          parts(shown.root, "-hotspot").map((hotspot) => parts(hotspot, "-badge").map(textOf)),
          [["3"], ["1"], ["4"], ["2"]],
        );
        assert.lengthOf(parts(shown.root, "-hidden"), 0);
        assert.strictEqual(attr(shown.interaction, "data-mode"), "solution");
        assert.lengthOf(parts(review.root, "-hidden"), 0);
        assert.deepStrictEqual(parts(review.root, "-slot").map(textOf).slice(0, 2), [
          "House",
          "Sun",
        ]);
        assert.lengthOf(parts(answering.root, "-hidden"), 2);
        assert.lengthOf(parts(disabled.root, "-hidden"), 0);
        assert.strictEqual(attr(disabled.interaction, "data-disabled"), "");
      }),
  );

  it.effect("[Q-9] restore gives the stored order back and the page shows it", () =>
    Effect.gen(function* restores() {
      const accepted = yield* fixture("graphic-order.xml");
      const configured = yield* configure({});
      const record = yield* Effect.fromResult(
        score(accepted, { RESPONSE: ordered("H3", "H1", "H4") }),
      );
      const restored = yield* Effect.fromResult(restore(accepted, record));
      const page = yield* Effect.fromResult(
        render(redact(accepted, restored.record, configured), configured, {
          instance,
          values: restored.values,
        }),
      );
      const [root] = parseHtml(page.html);

      assert.deepStrictEqual(restored.values["RESPONSE"], ordered("H3", "H1", "H4"));
      assert.deepStrictEqual(
        parts(root?.kind === "element" ? root : assert.fail("no root"), "-hidden").map((input) =>
          attr(input, "value"),
        ),
        ["H3", "H1", "H4"],
      );
    }),
  );

  it.effect(
    "[Q-9] a Prompt names the Root as a group, and the author's name does without one",
    () =>
      Effect.gen(function* names() {
        const prompted = yield* rendered(
          yield* fixture("graphic-order.xml", [
            [
              '<img src="images',
              '<qti-prompt>Put the sights in order of the tour.</qti-prompt><img src="images',
            ],
          ]),
        );
        const authored = yield* rendered(
          yield* fixture("graphic-order.xml", [
            [
              'response-identifier="RESPONSE"',
              'response-identifier="RESPONSE" aria-label="Tour order"',
            ],
          ]),
        );
        const [prompt = assert.fail("the page holds no Prompt")] = parts(prompted.root, "-prompt");

        assert.strictEqual(attr(prompted.interaction, "role"), "group");
        assert.strictEqual(prompt.tag, "qti-prompt");
        assert.strictEqual(attr(prompted.interaction, "aria-labelledby"), attr(prompt, "id"));
        assert.strictEqual(
          nameOf(prompted.interaction, prompted.root),
          "Put the sights in order of the tour.",
        );
        assert.strictEqual(
          childrenOf(prompted.interaction)[0],
          prompt,
          "the Prompt is the Root's first child",
        );
        assert.strictEqual(nameOf(authored.interaction, authored.root), "Tour order");
        assert.isUndefined(attr(authored.interaction, "aria-labelledby"));
      }),
  );

  it.effect("[Q-9] a host swaps a part through the part overrides", () =>
    Effect.gen(function* swapped() {
      const accepted = yield* fixture("graphic-order.xml");
      const page = yield* rendered(accepted, {
        parts: {
          [owner]: {
            badge: (props, children) => h("strong", props, children),
            slot: (props, children) => h("li", { ...props, "data-swapped": "yes" }, children),
          },
        },
        values: { RESPONSE: ordered("H1") },
      });

      assert.deepStrictEqual(
        parts(page.root, "-badge").map((badge) => badge.tag),
        ["strong"],
      );
      assert.isTrue(
        parts(page.root, "-slot").every((slot) => attr(slot, "data-swapped") === "yes"),
      );
    }),
  );

  it.effect("[Q-9] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* trees() {
      for (const file of ["graphic-order.xml", "graphic-order-subset.xml"]) {
        const accepted = yield* fixture(file);
        const states: readonly (readonly [string, Options])[] = [
          ["no values", {}],
          ["restored", { values: { RESPONSE: ordered("H3", "H1") } }],
          [
            "refused post",
            {
              messages: [{ response: "RESPONSE", text: "Order the markers." }],
              posted: { RESPONSE: ["H2"] },
            },
          ],
          ["review", { mode: "review", values: { RESPONSE: ordered("H2", "H1") } }],
          ["solution", { mode: "solution", values: solution(accepted) }],
          ["disabled", { disabled: true }],
        ];

        for (const [state, options] of states) {
          const page = yield* rendered(accepted, options);

          assert.lengthOf(
            parts(page.root, "-hotspot"),
            4,
            `${file}, ${state}: the hotspots render`,
          );
          assert.isTrue(roundTrips(page.root), `${file}, ${state}: the HTML round-trips`);
          assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), [], `${file}, ${state}`);
        }
      }
    }),
  );

  it.effect("[Q-9] redact's copy holds no correct response", () =>
    Effect.gen(function* redacts() {
      const accepted = yield* fixture("graphic-order.xml");
      const redacted = redact(accepted);
      const written = json(redacted);
      const empty = yield* rendered(accepted);

      assert.include(written, '"kind":"graphic-order"', "the body holds the interaction's node");
      assert.notInclude(written, "correct");
      assert.notInclude(written, '"H2","H4","H1","H3"');
      assert.lengthOf(parts(empty.root, "-hidden"), 0);
      assert.isTrue(parts(empty.root, "-slot").every((slot) => textOf(slot) === "Empty"));
      assert.lengthOf(
        parts(empty.root, "-badge")
          .map(textOf)
          .filter((badge) => badge !== ""),
        0,
      );
    }),
  );

  it.effect(
    "[Q-9] the redacted JSON form round-trips through the codec and renders the same HTML",
    () =>
      Effect.gen(function* codec() {
        for (const file of ["graphic-order.xml", "graphic-order-subset.xml"]) {
          const accepted = yield* fixture(file, [
            ['<img src="images', '<qti-prompt>Order <em>them</em>.</qti-prompt><img src="images'],
          ]);
          const configured = yield* configure({});
          const item = redact(accepted);
          const wire: unknown = JSON.parse(json(yield* Effect.fromResult(encodeRedacted(item))));
          const decoded = yield* Effect.fromResult(decodeRedacted(wire));
          const options = { instance, values: { RESPONSE: ordered("H1", "H2") } };

          assert.strictEqual(
            (yield* Effect.fromResult(render(decoded, configured, options))).html,
            (yield* Effect.fromResult(render(item, configured, options))).html,
            file,
          );
          assert.isTrue(
            regionsOf(
              accepted.item.body.find((node) => node.kind === "graphic-order") ??
                assert.fail("no node"),
            ).some((region) => region.part === "prompt"),
            "the Prompt is a region",
          );
        }

        const tampered: unknown = JSON.parse(
          json(
            yield* Effect.fromResult(encodeRedacted(redact(yield* fixture("graphic-order.xml")))),
          ).replace('"area":"rect"', '"area":"blob"'),
        );
        const refused = decodeRedacted(tampered);

        assert.isTrue(Result.isFailure(refused));
      }),
  );
});
