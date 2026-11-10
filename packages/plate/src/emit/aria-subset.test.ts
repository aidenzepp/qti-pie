/**
 * The ARIA subset reaches the rendered HTML (A-2a): `aria-describedby`, `aria-hidden`,
 * `aria-label`, `aria-labelledby`, `aria-live` and `role`, written on the HTML elements of an
 * item's body, of a Choice's Prompt and of a choice's content, are in the page as the author wrote
 * them, and each ID reference names the rendered id of its target.
 *
 * The tests read the body walk in `emit/body.ts` through `open`, `redact` and `render` alone. The
 * walk scopes every authored `id` by the item instance, and every id an ID reference names the same
 * way, so a reference still finds its target; the tests therefore compare each reference token with
 * the id the target renders with, never with a spelling they compute. Each probed element carries a
 * `probe-*` class the walk leaves as the author wrote it, which is how the tests find it.
 *
 * @module
 */
import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { redact, render } from "#plate/render.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Where the fixture item sits under the package, which `open` takes as the document's location.
 */
const location = "fixtures/m4/items/aria-subset.xml";

/**
 * The instance token the render passes, which scopes the ids the author wrote.
 */
const instance = "m412";

/**
 * Open the fixture item, redact it and render it with the default configuration, as a host does.
 *
 * @returns The item's HTML.
 */
const renderedHtml = (): Effect.Effect<string> =>
  Effect.gen(function* rendered() {
    const bytes = new Uint8Array(readFileSync(new URL(`../../${location}`, import.meta.url)));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(location, bytes)));
    const configuration = yield* configure({}).pipe(Effect.orDie);

    return Result.getOrThrow(render(redact(accepted), configuration, { instance })).html;
  });

/**
 * List every element at or below some nodes, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element among them and below them.
 */
const elementsBelow = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsBelow(node.children)] : []));

/**
 * Read an attribute of an element as text.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value, none when the attribute is absent or a boolean one.
 */
const attributeOf = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === true ? undefined : value;
};

/**
 * Split an ID reference list into its tokens, as HTML splits a space-separated token list.
 *
 * @param value The attribute's value, if it is present.
 * @returns The tokens in order, none for an absent attribute.
 */
const tokensOf = (value: string | undefined): readonly string[] =>
  (value ?? "").split(/\s+/u).filter((token) => token !== "");

/**
 * Find the one element of a page that carries a probe class.
 *
 * @param nodes The page's nodes.
 * @param probe The class the fixture gives the element, such as `probe-region`.
 * @returns The element, failing the test when the page holds none or more than one.
 */
const probed = (nodes: readonly Node[], probe: string): Element => {
  const found = elementsBelow(nodes).filter((element) =>
    tokensOf(attributeOf(element, "class")).includes(probe),
  );

  assert.lengthOf(found, 1, `the page holds exactly one element of class ${probe}`);

  return found[0] ?? assert.fail(`the page holds no element of class ${probe}`);
};

/**
 * Read the id an element renders with.
 *
 * @param element The element.
 * @returns Its rendered `id`, failing the test when it has none.
 */
const renderedId = (element: Element): string =>
  attributeOf(element, "id") ?? assert.fail(`the <${element.tag}> renders with no id`);

describe("the ARIA subset on body content", () => {
  it.effect(
    "[A-2a] aria-label, aria-hidden, aria-live and role on body content reach the HTML unchanged",
    () =>
      Effect.gen(function* attributesReach() {
        const page = parseHtml(yield* renderedHtml());
        const region = probed(page, "probe-region");
        const status = probed(page, "probe-status");
        const group = probed(page, "probe-group");
        const wave = probed(page, "probe-wave");

        assert.strictEqual(attributeOf(region, "role"), "region");
        assert.strictEqual(attributeOf(status, "role"), "status");
        assert.strictEqual(attributeOf(status, "aria-live"), "polite");
        assert.strictEqual(attributeOf(group, "role"), "group");
        assert.strictEqual(attributeOf(group, "aria-label"), "Depth readings");
        assert.strictEqual(attributeOf(wave, "aria-hidden"), "true");
      }),
  );

  it.effect(
    "[A-2a] aria-describedby and aria-labelledby name the rendered ids of their targets",
    () =>
      Effect.gen(function* referencesName() {
        const page = parseHtml(yield* renderedHtml());
        const region = probed(page, "probe-region");
        const title = renderedId(probed(page, "probe-title"));
        const intro = renderedId(probed(page, "probe-intro"));
        const hint = renderedId(probed(page, "probe-hint"));

        assert.deepStrictEqual(tokensOf(attributeOf(region, "aria-describedby")), [hint]);
        assert.deepStrictEqual(tokensOf(attributeOf(region, "aria-labelledby")), [title, intro]);

        const ids = elementsBelow(page).flatMap((element) =>
          element.attrs["id"] === undefined ? [] : [renderedId(element)],
        );

        for (const target of [title, intro, hint]) {
          assert.include(ids, target, "each token names an id of the page");
          assert.isTrue(target.startsWith(instance), `${target} is scoped by the item instance`);
        }
        assert.notInclude(ids, "pool-hint", "no element keeps the bare authored id");
        assert.strictEqual(new Set(ids).size, ids.length, "every id of the page is unique");
      }),
  );

  it.effect("[A-2a] an ID reference list keeps every target in order", () =>
    Effect.gen(function* listKeeps() {
      const page = parseHtml(yield* renderedHtml());
      const tokens = tokensOf(attributeOf(probed(page, "probe-region"), "aria-labelledby"));

      assert.lengthOf(tokens, 2);
      assert.deepStrictEqual(tokens, [
        renderedId(probed(page, "probe-title")),
        renderedId(probed(page, "probe-intro")),
      ]);
    }),
  );

  it.effect("[A-2a] ARIA in a prompt and in a choice's content reaches the HTML", () =>
    Effect.gen(function* nestedContent() {
      const page = parseHtml(yield* renderedHtml());
      const inPrompt = probed(page, "probe-prompt");
      const inChoice = probed(page, "probe-choice");

      assert.strictEqual(attributeOf(inPrompt, "aria-label"), "deepest pool");
      assert.deepStrictEqual(tokensOf(attributeOf(inChoice, "aria-describedby")), [
        renderedId(probed(page, "probe-hint")),
      ]);
    }),
  );
});
