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
 * The fixture every test here reads.
 */
const file = "graphic-associate.xml";

/**
 * The marker prefix of every Graphic Associate part, read through the part table's `slotFor` rule.
 */
const owner = "graphic-associate-interaction";

/**
 * Read a fixture item as text.
 *
 * @param name The fixture's file name under `fixtures/ei/items`.
 * @returns The item's text.
 */
const textOfFixture = (name: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureFolder, name), "utf-8"));

/**
 * Open item text as a host opens a document it read from storage, and accept it.
 *
 * @param name The item's name, which the verdict carries as its location.
 * @param text The item's text.
 * @returns The accepted item, or a failed assertion naming the verdict.
 */
const accept = Effect.fnUntraced(function* accept(name: string, text: string) {
  const verdict = yield* open(`fixtures/ei/items/${name}`, new TextEncoder().encode(text));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${name} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open the fixture and accept it, with text edits applied first.
 *
 * @param edits Each `[from, to]` replaces one occurrence of `from` in the text.
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture(
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
 * Construct a multiple pair value.
 *
 * @param pairs Each pair as written, `"<a> <b>"`.
 * @returns The value.
 */
const pairs = (...written: readonly string[]): Value => ({
  baseType: "pair",
  cardinality: "multiple",
  values: written.map((pair) => {
    const [a = "", b = ""] = pair.split(" ");

    return { baseType: "pair", value: [a, b] };
  }),
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
 * @returns The elements carrying `graphic-associate-interaction<part>`.
 */
const parts = (root: Element, part: string): readonly Element[] =>
  elementsOf([root]).filter((element) => element.attrs["data-slot"] === `${owner}${part}`);

/**
 * Render an accepted item and parse its HTML.
 *
 * @param accepted The accepted item.
 * @param options The render's options, the fixed instance by default.
 * @returns The root element, the Root of the interaction, and the HTML as written.
 */
const rendered = Effect.fnUntraced(function* rendered(accepted: Accepted, options: Options = {}) {
  const configured = yield* configure({});
  const page = yield* Effect.fromResult(
    render(redact(accepted), configured, { instance, ...options }),
  );
  const [root, ...rest] = parseHtml(page.html);
  assert.lengthOf(rest, 0, "one root");
  if (root?.kind !== "element") {
    return assert.fail("the root is not an element");
  }

  const interaction = parts(root, "")[0] ?? assert.fail("the page holds no Graphic Associate Root");

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
 * Find the hotspot with an identifier.
 *
 * @param root The tree's root.
 * @param identifier The hotspot's identifier.
 * @returns The hotspot element, `undefined` when none carries the identifier.
 */
const hotspotOf = (root: Element, identifier: string): Element | undefined =>
  parts(root, "-hotspot").find((each) => attr(each, "data-identifier") === identifier);

/**
 * Read the outline of the hotspot with an identifier: its shape element and the `svg`.
 *
 * @param root The tree's root.
 * @param identifier The hotspot's identifier.
 * @returns The `svg` and the figure it holds, none when the hotspot is drawn with no outline.
 */
const outlineOf = (root: Element, identifier: string) => {
  const hotspot = hotspotOf(root, identifier);
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
 * Read the hidden inputs of a page as `[tag, type, name, value]` rows.
 *
 * @param root The tree's root.
 * @returns One row per Hidden part, in document order.
 */
const hiddenOf = (root: Element) =>
  parts(root, "-hidden").map((input) => [
    input.tag,
    attr(input, "type"),
    attr(input, "name"),
    attr(input, "value"),
  ]);

/**
 * The correct pairs of the fixture.
 */
const correct = pairs("H1 H3", "H3 H4");

describe("[Q-7] Graphic Associate", () => {
  it.effect(
    "[Q-7] open accepts the fixture, a default hotspot not last included, and its verdict lists no unsupported part",
    () =>
      Effect.gen(function* opens() {
        const accepted = yield* accept(file, yield* textOfFixture(file));

        assert.deepStrictEqual(accepted.unsupported, []);
        assert.strictEqual(
          accepted.item.body.some((node) => node.kind === "graphic-associate"),
          true,
          `${file} holds a graphic-associate node`,
        );
      }),
  );

  it.effect(
    "[Q-7] render emits the image, four hotspots in document order and an empty list of pairs",
    () =>
      Effect.gen(function* emits() {
        const page = yield* rendered(yield* fixture());
        const hotspots = parts(page.root, "-hotspot");
        const everything = elementsOf([page.root]);
        const [image] = parts(page.root, "-image");
        const [list] = parts(page.root, "-pairs");

        assert.deepStrictEqual(
          hotspots.map((hotspot) => attr(hotspot, "data-identifier")),
          ["H1", "H2", "H3", "H4"],
        );
        assert.deepStrictEqual(
          hotspots.map((hotspot) => attr(hotspot, "data-area")),
          ["rect", "default", "circle", "poly"],
        );
        assert.deepStrictEqual(
          hotspots.map((hotspot) => attr(hotspot, "data-match-max")),
          ["3", "3", "2", "3"],
        );
        assert.isDefined(image);
        assert.isDefined(list);
        assert.strictEqual(list?.tag, "ul");
        assert.lengthOf(parts(page.root, "-pair"), 0);
        assert.lengthOf(parts(page.root, "-hidden"), 0);
        assert.isTrue(
          everything.findIndex((element) => element.tag === "img") <
            everything.indexOf(parts(page.root, "-hotspots")[0] ?? page.root),
          "the hotspots follow the image in the DOM",
        );
        assert.isTrue(
          image !== undefined &&
            elementsOf([image]).some((element) => element.tag === "img") &&
            hotspots.every((hotspot) => elementsOf([image]).includes(hotspot)),
          "the image part holds the image and the hotspots",
        );
        assert.strictEqual(attr(page.interaction, "data-entry-name"), entry);
        assert.strictEqual(attr(page.interaction, "data-max-associations"), "3");
        assert.strictEqual(attr(page.interaction, "data-mode"), "answering");
        assert.isFalse(page.html.includes("Not supported here"), "no notice");
        for (const slot of [
          "",
          "-hidden",
          "-hotspot",
          "-hotspots",
          "-image",
          "-outline",
          "-pair",
          "-pairs",
          "-prompt",
        ]) {
          assert.isTrue(
            Option.exists(partForSlot(`${owner}${slot}`), (part) => part.interaction === owner),
            `${owner}${slot} is a part`,
          );
        }
      }),
  );

  it.effect(
    "[Q-7] each hotspot is named and outlined; the default one covers the image under the others",
    () =>
      Effect.gen(function* outlines() {
        const page = yield* rendered(yield* fixture());
        const unlabelled = yield* rendered(yield* fixture([[' hotspot-label="Barn"', ""]]));
        const short = yield* rendered(
          yield* fixture([['coords="20,30,90,90"', 'coords="20,30,90"']]),
        );

        assert.deepStrictEqual(
          parts(page.root, "-hotspot").map((hotspot) => nameOf(hotspot, page.root)),
          ["Well", "Anywhere else", "Barn", "Oak"],
        );
        assert.deepStrictEqual(
          parts(unlabelled.root, "-hotspot").map((hotspot) => nameOf(hotspot, unlabelled.root)),
          ["Well", "Anywhere else", "Area 3 of 4", "Oak"],
        );
        assert.deepStrictEqual(drawnOf(outlineOf(page.root, "H1")?.figure), {
          attrs: { height: "60", width: "70", x: "20", y: "30" },
          tag: "rect",
        });
        assert.deepStrictEqual(drawnOf(outlineOf(page.root, "H2")?.figure), {
          attrs: { height: "100%", width: "100%", x: "0", y: "0" },
          tag: "rect",
        });
        assert.deepStrictEqual(drawnOf(outlineOf(page.root, "H3")?.figure), {
          attrs: { cx: "170", cy: "70", r: "30" },
          tag: "circle",
        });
        assert.deepStrictEqual(drawnOf(outlineOf(page.root, "H4")?.figure), {
          attrs: { points: "220,170 260,110 300,170" },
          tag: "polygon",
        });
        for (const svg of parts(page.root, "-outline")) {
          assert.strictEqual(svg.tag, "svg");
          assert.strictEqual(attr(svg, "aria-hidden"), "true");
          assert.strictEqual(attr(svg, "viewBox"), "0 0 320 200");
        }

        assert.strictEqual(attr(hotspotOf(page.root, "H2") ?? page.root, "data-area"), "default");
        assert.strictEqual(
          parts(page.root, "-hotspot").indexOf(hotspotOf(page.root, "H2") ?? page.root),
          1,
          "the default hotspot stays where the author wrote it",
        );
        assert.isUndefined(outlineOf(short.root, "H1"), "too few coordinates draw no outline");
        assert.strictEqual(nameOf(hotspotOf(short.root, "H1") ?? short.root, short.root), "Well");
      }),
  );

  it.effect("[Q-7] restored pairs name both hotspots and write one hidden input each", () =>
    Effect.gen(function* restored() {
      const page = yield* rendered(yield* fixture(), {
        values: { RESPONSE: pairs("H1 H2", "H3 H4") },
      });
      const list = parts(page.root, "-pair");

      assert.deepStrictEqual(list.map(textOf), ["Well and Anywhere else", "Barn and Oak"]);
      assert.deepStrictEqual(
        list.map((pair) => attr(pair, "data-pair")),
        ["H1 H2", "H3 H4"],
      );
      assert.deepStrictEqual(hiddenOf(page.root), [
        ["input", "hidden", entry, "H1 H2"],
        ["input", "hidden", entry, "H3 H4"],
      ]);
      assert.deepStrictEqual(
        parts(page.root, "-hotspot").map((hotspot) => attr(hotspot, "data-paired")),
        ["", "", "", ""],
      );
      assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), []);
    }),
  );

  it.effect(
    "[Q-7] postings binds the response as a multiple pair and decode reads the posted pairs",
    () =>
      Effect.gen(function* binds() {
        const accepted = yield* fixture();
        const [posting = assert.fail("no posting"), ...rest] = postings(redact(accepted), instance);

        assert.lengthOf(rest, 0);
        assert.deepStrictEqual(posting.binding, {
          baseType: "pair",
          cardinality: "multiple",
          name: entry,
        });
        assert.strictEqual(posting.identifier, "RESPONSE");

        const decoded = yield* Effect.fromResult(
          decode(
            [
              [entry, "H1 H3"],
              ["other", "x"],
              [entry, "H4 H3"],
            ],
            posting.binding,
            posting.options,
          ),
        );

        assert.deepStrictEqual(
          isRecordValue(decoded) ? assert.fail("a record") : decoded.values.map(format),
          ["H1 H3", "H4 H3"],
        );
      }),
  );

  it.effect(
    "[Q-7] checkResponses: a hotspot with itself, or one pair twice in either order, is refused in tier (a)",
    () =>
      Effect.gen(function* refusedPairs() {
        const accepted = yield* fixture();

        for (const validateResponses of [false, true]) {
          const configured = yield* configure({ validateResponses });
          const self = checkResponses(accepted, { RESPONSE: pairs("H1 H1") }, configured);
          const twice = checkResponses(accepted, { RESPONSE: pairs("H1 H2", "H2 H1") }, configured);
          const sameOrder = checkResponses(
            accepted,
            { RESPONSE: pairs("H1 H2", "H1 H2") },
            configured,
          );

          assert.lengthOf(self, 1, `self, validateResponses ${String(validateResponses)}`);
          assert.include(self[0]?.text ?? "", "Well");
          assert.lengthOf(twice, 1, `twice, validateResponses ${String(validateResponses)}`);
          assert.include(twice[0]?.text ?? "", "Well");
          assert.include(twice[0]?.text ?? "", "Anywhere else");
          assert.lengthOf(sameOrder, 1);
          assert.deepStrictEqual(
            checkResponses(accepted, { RESPONSE: pairs("H1 H2", "H3 H4") }, configured),
            [],
          );
        }

        assert.deepStrictEqual(
          checkResponses(accepted, { RESPONSE: pairs("H1 Z9") }, yield* configure({})).map(
            (message) => message.response,
          ),
          ["RESPONSE"],
        );
      }),
  );

  it.effect(
    "[Q-7] checkResponses: a hotspot over its match-max, or outside a match-group, is refused in tier (a)",
    () =>
      Effect.gen(function* limits() {
        const accepted = yield* fixture();
        const grouped = yield* fixture([
          [
            'hotspot-label="Well" match-max="3"',
            'hotspot-label="Well" match-max="3" match-group="H3"',
          ],
        ]);

        for (const validateResponses of [false, true]) {
          const configured = yield* configure({ validateResponses });
          const over = checkResponses(
            accepted,
            { RESPONSE: pairs("H3 H1", "H3 H2", "H3 H4") },
            configured,
          );
          const outside = checkResponses(grouped, { RESPONSE: pairs("H1 H4") }, configured);
          const inside = checkResponses(grouped, { RESPONSE: pairs("H3 H1") }, configured);

          assert.lengthOf(over, 1, `over, validateResponses ${String(validateResponses)}`);
          assert.include(over[0]?.text ?? "", "Barn");
          assert.include(over[0]?.text ?? "", "2");
          assert.lengthOf(outside, 1, `outside, validateResponses ${String(validateResponses)}`);
          assert.include(outside[0]?.text ?? "", "Well");
          assert.include(outside[0]?.text ?? "", "Oak");
          assert.deepStrictEqual(inside, []);
        }
      }),
  );

  it.effect(
    "[Q-7] checkResponses: above max-associations always, below min-associations only under validateResponses",
    () =>
      Effect.gen(function* bounds() {
        const accepted = yield* fixture();
        const least = yield* fixture([
          ['max-associations="3"', 'max-associations="3" min-associations="2"'],
        ]);
        const four = { RESPONSE: pairs("H1 H2", "H1 H3", "H1 H4", "H2 H4") };
        const one = { RESPONSE: pairs("H1 H3") };

        for (const validateResponses of [false, true]) {
          const configured = yield* configure({ validateResponses });
          const over = checkResponses(accepted, four, configured);

          assert.lengthOf(over, 1, `over, validateResponses ${String(validateResponses)}`);
          assert.include(over[0]?.text ?? "", "3");
          assert.deepStrictEqual(
            checkResponses(accepted, { RESPONSE: pairs("H1 H2", "H1 H3", "H1 H4") }, configured),
            [],
          );
        }

        const lenient = checkResponses(least, one, yield* configure({}));
        const strict = checkResponses(least, one, yield* configure({ validateResponses: true }));

        assert.deepStrictEqual(lenient, []);
        assert.lengthOf(strict, 1);
        assert.include(strict[0]?.text ?? "", "2");
        assert.deepStrictEqual(
          checkResponses(
            least,
            { RESPONSE: pairs("H1 H3", "H2 H4") },
            yield* configure({ validateResponses: true }),
          ),
          [],
        );
        assert.lengthOf(
          checkResponses(least, {}, yield* configure({ validateResponses: true })),
          1,
        );
        assert.deepStrictEqual(checkResponses(least, {}, yield* configure({})), []);
      }),
  );

  it.effect("[Q-7] score maps the pairs, in either order", () =>
    Effect.gen(function* scores() {
      const accepted = yield* fixture();
      const scoreOf = (value: Value) =>
        score(accepted, { RESPONSE: value }).pipe(
          Effect.fromResult,
          Effect.map((record) => record.outcomes["SCORE"]?.values.map((single) => single.value)),
        );

      assert.deepStrictEqual(accepted.unsupported, [], "the item is not unsupported");
      assert.deepStrictEqual(yield* scoreOf(correct), [2]);
      assert.deepStrictEqual(yield* scoreOf(pairs("H3 H1", "H4 H3")), [2]);
      assert.deepStrictEqual(yield* scoreOf(pairs("H4 H3")), [1]);
      assert.deepStrictEqual(yield* scoreOf(pairs("H1 H2", "H2 H4")), [0]);
    }),
  );

  it.effect(
    "[Q-7] solution shows the correct pairs, and finished modes write no hidden input",
    () =>
      Effect.gen(function* solved() {
        const accepted = yield* fixture();
        const correctValues = solution(accepted);
        const shown = yield* rendered(accepted, { mode: "solution", values: correctValues });
        const review = yield* rendered(accepted, {
          mode: "review",
          values: { RESPONSE: pairs("H1 H2") },
        });
        const answering = yield* rendered(accepted, { values: { RESPONSE: pairs("H1 H2") } });
        const disabled = yield* rendered(accepted, {
          disabled: true,
          values: { RESPONSE: pairs("H1 H2") },
        });

        assert.deepStrictEqual(correctValues["RESPONSE"], correct);
        assert.deepStrictEqual(parts(shown.root, "-pair").map(textOf), [
          "Well and Barn",
          "Barn and Oak",
        ]);
        assert.deepStrictEqual(
          parts(shown.root, "-hotspot").map((hotspot) => attr(hotspot, "data-paired")),
          ["", undefined, "", ""],
        );
        assert.lengthOf(parts(shown.root, "-hidden"), 0);
        assert.strictEqual(attr(shown.interaction, "data-mode"), "solution");
        assert.lengthOf(parts(review.root, "-hidden"), 0);
        assert.deepStrictEqual(parts(review.root, "-pair").map(textOf), ["Well and Anywhere else"]);
        assert.lengthOf(parts(answering.root, "-hidden"), 1);
        assert.lengthOf(parts(disabled.root, "-hidden"), 0);
        assert.strictEqual(attr(disabled.interaction, "data-disabled"), "");
      }),
  );

  it.effect("[Q-7] restore gives the stored pairs back and the page shows them", () =>
    Effect.gen(function* restores() {
      const accepted = yield* fixture();
      const configured = yield* configure({});
      const record = yield* Effect.fromResult(
        score(accepted, { RESPONSE: pairs("H3 H1", "H2 H4") }),
      );
      const restored = yield* Effect.fromResult(restore(accepted, record));
      const page = yield* Effect.fromResult(
        render(redact(accepted, restored.record, configured), configured, {
          instance,
          values: restored.values,
        }),
      );
      const [root] = parseHtml(page.html);

      assert.deepStrictEqual(restored.values["RESPONSE"], pairs("H3 H1", "H2 H4"));
      assert.deepStrictEqual(
        parts(root?.kind === "element" ? root : assert.fail("no root"), "-hidden").map((input) =>
          attr(input, "value"),
        ),
        ["H3 H1", "H2 H4"],
      );
    }),
  );

  it.effect(
    "[Q-7] a refused post shows the posted pairs, leaving out what names no hotspot, a self pair and a repeat",
    () =>
      Effect.gen(function* posted() {
        const page = yield* rendered(yield* fixture(), {
          messages: [{ response: "RESPONSE", text: "Pair the areas." }],
          posted: { RESPONSE: ["H4 H1", "H1 H4", "H2 H2", "Z9 H3", "H3 H2"] },
          values: { RESPONSE: pairs("H1 H2") },
        });

        assert.deepStrictEqual(
          parts(page.root, "-hidden").map((input) => attr(input, "value")),
          ["H4 H1", "H3 H2"],
        );
        assert.deepStrictEqual(parts(page.root, "-pair").map(textOf), [
          "Oak and Well",
          "Barn and Anywhere else",
        ]);
        assert.strictEqual(attr(page.interaction, "aria-describedby"), "q1-RESPONSE-message-0");
      }),
  );

  it.effect(
    "[Q-7] a Prompt names the Root as a group, and the author's name does without one",
    () =>
      Effect.gen(function* names() {
        const prompted = yield* rendered(
          yield* fixture([
            [
              '<img src="images',
              "<qti-prompt>Join each path's two ends.</qti-prompt><img src=\"images",
            ],
          ]),
        );
        const authored = yield* rendered(
          yield* fixture([
            [
              'response-identifier="RESPONSE"',
              'response-identifier="RESPONSE" aria-label="Farm paths"',
            ],
          ]),
        );
        const [prompt = assert.fail("the page holds no Prompt")] = parts(prompted.root, "-prompt");

        assert.strictEqual(attr(prompted.interaction, "role"), "group");
        assert.strictEqual(attr(prompted.interaction, "aria-labelledby"), attr(prompt, "id"));
        assert.strictEqual(
          nameOf(prompted.interaction, prompted.root),
          "Join each path's two ends.",
        );
        assert.strictEqual(
          childrenOf(prompted.interaction)[0],
          prompt,
          "the Prompt is the Root's first child",
        );
        assert.strictEqual(nameOf(authored.interaction, authored.root), "Farm paths");
        assert.isUndefined(attr(authored.interaction, "aria-labelledby"));
      }),
  );

  it.effect("[Q-7] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* trees() {
      const accepted = yield* fixture([
        [
          '<img src="images',
          "<qti-prompt>Join each path's two ends.</qti-prompt><img src=\"images",
        ],
      ]);
      const states: readonly (readonly [string, Options])[] = [
        ["no values", {}],
        ["restored", { values: { RESPONSE: pairs("H3 H1") } }],
        [
          "refused post",
          {
            messages: [{ response: "RESPONSE", text: "Pair the areas." }],
            posted: { RESPONSE: ["H2 H4"] },
          },
        ],
        ["review", { mode: "review", values: { RESPONSE: pairs("H2 H1") } }],
        ["solution", { mode: "solution", values: solution(accepted) }],
        ["disabled", { disabled: true }],
      ];

      for (const [state, options] of states) {
        const page = yield* rendered(accepted, options);

        assert.lengthOf(parts(page.root, "-hotspot"), 4, `${state}: the hotspots render`);
        assert.isTrue(roundTrips(page.root), `${state}: the HTML round-trips`);
        assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), [], state);
      }
    }),
  );

  it.effect("[Q-7] redact's copy holds no correct response", () =>
    Effect.gen(function* redacts() {
      const accepted = yield* fixture();
      const redacted = redact(accepted);
      const written = json(redacted);
      const empty = yield* rendered(accepted);

      assert.include(
        written,
        '"kind":"graphic-associate"',
        "the body holds the interaction's node",
      );
      assert.notInclude(written, "correct");
      assert.notInclude(written, '"H1","H3"');
      assert.notInclude(written, "H1 H3");
      assert.notInclude(written, "H3 H4");
      assert.lengthOf(parts(empty.root, "-hidden"), 0);
      assert.lengthOf(parts(empty.root, "-pair"), 0);
    }),
  );

  it.effect(
    "[Q-7] the redacted JSON form round-trips through the codec and renders the same HTML",
    () =>
      Effect.gen(function* codec() {
        const accepted = yield* fixture([
          ['<img src="images', '<qti-prompt>Join <em>them</em>.</qti-prompt><img src="images'],
        ]);
        const configured = yield* configure({});
        const item = redact(accepted);
        const wire: unknown = JSON.parse(json(yield* Effect.fromResult(encodeRedacted(item))));
        const decoded = yield* Effect.fromResult(decodeRedacted(wire));
        const options = { instance, values: { RESPONSE: pairs("H1 H2") } };

        assert.strictEqual(
          (yield* Effect.fromResult(render(decoded, configured, options))).html,
          (yield* Effect.fromResult(render(item, configured, options))).html,
        );

        const tampered: unknown = JSON.parse(
          json(yield* Effect.fromResult(encodeRedacted(item))).replace(
            '"area":"rect"',
            '"area":"blob"',
          ),
        );

        assert.isTrue(Result.isFailure(decodeRedacted(tampered)));
      }),
  );
});
