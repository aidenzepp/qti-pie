import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { acceptedItem, configure, noSupports, open, redact, render } from "#plate/index.ts";
import type { Element, Node } from "#plate/index.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The bytes of the bidirectional-text and ruby item, `fixtures/m5/items/bidi-ruby.xml`: an Arabic
 * paragraph with `dir` and `xml:lang`, a `bdi` and a `bdo`, a ruby with each of its elements, and a
 * Choice inside a right-to-left block.
 */
const itemBytes: Uint8Array = new Uint8Array(
  readFileSync(new URL("../../fixtures/m5/items/bidi-ruby.xml", import.meta.url)),
);

/**
 * Render the fixture item with no support enabled.
 *
 * @returns The HTML of the rendered item.
 */
const renderItem: Effect.Effect<string> = Effect.gen(function* renderBidiRuby() {
  const verdict = yield* open("items/bidi-ruby.xml", itemBytes);
  const accepted = Option.getOrThrow(acceptedItem(verdict));
  const configuration = yield* configure({});
  const redacted = redact(accepted, undefined, configuration, { supports: noSupports });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { instance: "q1", supports: noSupports }),
  );

  return rendered.html;
}).pipe(Effect.orDie);

/**
 * Collect every element of a tree in document order.
 *
 * @param nodes The nodes to walk.
 * @returns Each element, each before its descendants.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Find the element the body wrote with an authored `id`, which render prefixes with the instance.
 *
 * @param html The rendered HTML.
 * @param authored The `id` as the item wrote it.
 * @returns The element.
 */
const byAuthoredId = (html: string, authored: string): Element =>
  elementsOf(parseHtml(html)).find((element) => element.attrs["id"] === `q1--${authored}`) ??
  assert.fail(`no element with the authored id ${authored}`);

/**
 * A child element's tag names, in order.
 *
 * @param element The parent.
 * @returns The tag of each child element.
 */
const childTags = (element: Element): readonly string[] =>
  element.children.flatMap((child) => (child.kind === "element" ? [child.tag] : []));

/**
 * The text a node holds, descendants included.
 *
 * @param node The node.
 * @returns Its character data, concatenated.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

describe("bidirectional text (rows A-4a)", () => {
  it.effect("[A-4a] dir and lang reach the HTML on content and on an interaction", () =>
    Effect.gen(function* checkDirAndLang() {
      const html = yield* renderItem;
      const paragraph = byAuthoredId(html, "arabic");
      const block = byAuthoredId(html, "rtl-block");

      assert.strictEqual(paragraph.attrs["dir"], "rtl");
      assert.strictEqual(paragraph.attrs["lang"], "ar");
      assert.strictEqual(textOf(paragraph), "مرحبا بكم في الاختبار");
      assert.strictEqual(block.attrs["dir"], "rtl");

      const inside = elementsOf(block.children).find(
        (element) => element.attrs["data-slot"] === "choice-interaction",
      );

      assert.isDefined(
        inside,
        "the Choice renders inside the right-to-left block, which it inherits",
      );
    }),
  );

  it.effect("[A-4a] bdi and bdo render as authored", () =>
    Effect.gen(function* checkBdiAndBdo() {
      const html = yield* renderItem;
      const isolated = byAuthoredId(html, "student");
      const overridden = byAuthoredId(html, "code");

      assert.strictEqual(isolated.tag, "bdi");
      assert.strictEqual(textOf(isolated), "Nadia al-Rashid");
      assert.isUndefined(isolated.attrs["dir"]);
      assert.strictEqual(overridden.tag, "bdo");
      assert.strictEqual(overridden.attrs["dir"], "ltr");
      assert.strictEqual(textOf(overridden), "A-7-Q");
      assert.include(html, '<bdi id="q1--student">Nadia al-Rashid</bdi>');
      assert.include(html, '<bdo id="q1--code" dir="ltr">A-7-Q</bdo>');
    }),
  );
});

describe("ruby (row A-4b)", () => {
  it.effect("[A-4b] ruby, rb, rp, rt and rtc render as authored", () =>
    Effect.gen(function* checkRuby() {
      const html = yield* renderItem;
      const ruby = byAuthoredId(html, "kanji");
      const complex = elementsOf(ruby.children).find((element) => element.tag === "rtc");

      assert.strictEqual(ruby.tag, "ruby");
      assert.deepStrictEqual(childTags(ruby), ["rb", "rp", "rt", "rp", "rtc"]);
      assert.strictEqual(textOf(ruby), "漢(kan)Chinese");
      assert.isDefined(complex);
      assert.deepStrictEqual(complex === undefined ? [] : childTags(complex), ["rt"]);
      assert.include(
        html,
        '<ruby id="q1--kanji"><rb>漢</rb><rp>(</rp><rt>kan</rt><rp>)</rp><rtc><rt>Chinese</rt></rtc></ruby>',
      );
    }),
  );
});
