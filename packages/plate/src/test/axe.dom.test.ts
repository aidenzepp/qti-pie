/**
 * The accessibility sweep's in-page half, in each engine's page: axe-core's WCAG 2.2 A and AA
 * rules over every fixture item as plate renders it, before and after `upgrade()`, so the
 * markup the runtime's controllers write is checked beside the markup the server writes.
 *
 * The fixtures render with the default configuration and the default stylesheet, under the
 * fallbacks palette (`#plate/test/axe-page.ts`): the page's `<style>` holds the sheet and the
 * palette's surface and text colours. The Node-driven half (`axe.browser.test.ts`) and the corpus
 * command (`scripts/sweep.ts`) sweep the corpus in the same two engines.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import axe from "axe-core";
import { Effect, Option, Result } from "effect";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { fallbackPalette, paletteRule, wcagTags } from "#plate/test/axe-page.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Every fixture item of every area, `fixtures/<area>/items/*.xml`, as paths relative to the
 * package's root, which Vite expands when it serves this file: an item added to any area's `items`
 * folder is swept without a list to update.
 */
const everyFixtureItem = Object.keys(import.meta.glob("/fixtures/*/items/*.xml")).map((key) =>
  key.slice("/".length),
);

/**
 * Read a file of the package as text, through the test server. A file that cannot be read fails
 * the test.
 *
 * @param path The file's path relative to the package's root.
 * @returns The file's text.
 */
const fileText = (path: string) => Effect.promise(() => commands.readFile(path));

/**
 * Render one fixture item as plate's SSR writes it, with the default configuration, when `open`
 * accepts it.
 *
 * @param path The item's path relative to the package's root.
 * @returns The item's HTML; none when `open` does not accept the document as an item.
 */
const renderedFixture = (path: string) =>
  Effect.gen(function* renderFixture() {
    const bytes = new TextEncoder().encode(yield* fileText(path));
    const accepted = acceptedItem(yield* open(path, bytes));

    if (Option.isNone(accepted)) {
      return Option.none<string>();
    }

    const configuration = yield* configure({});

    return Option.some(
      Result.getOrThrow(render(redact(accepted.value), configuration, { instance: "w0d" })).html,
    );
  });

/**
 * Put some HTML into a fresh container at the end of the page's body.
 *
 * @param html The HTML.
 * @returns The container, which the caller removes.
 */
const mount = (html: string): HTMLElement => {
  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.append(container);

  return container;
};

/**
 * Run axe-core's WCAG 2.2 A and AA rules over a subtree and name each violation.
 *
 * @param root The subtree: page-level rules, which need the whole document, do not run.
 * @returns One line per violating node, `<rule> <selector>`; empty when the subtree is clean.
 */
const violationsIn = (root: Element) =>
  Effect.promise(() =>
    axe.run(root, { resultTypes: ["violations"], runOnly: { type: "tag", values: [...wcagTags] } }),
  ).pipe(
    Effect.map((results) =>
      results.violations.flatMap((violation) =>
        violation.nodes.map((node) => `${violation.id} ${node.target.join(" ")}`),
      ),
    ),
  );

/**
 * Put plate's default stylesheet and the fallbacks palette's surface and text colours in the
 * page's head, as the sweep's page shell does, and remove them when the use ends.
 *
 * @param use The work to do with the styles in place.
 * @returns What `use` returns.
 */
const withStyles = <A, E, R>(use: Effect.Effect<A, E, R>) =>
  Effect.acquireUseRelease(
    Effect.gen(function* addStyles() {
      const style = document.createElement("style");

      style.textContent = `${yield* fileText("src/styles.css")}\n${paletteRule(fallbackPalette)}`;
      document.head.append(style);

      return style;
    }),
    () => use,
    (style) =>
      Effect.sync(() => {
        style.remove();
      }),
  );

/**
 * Sweep every fixture item `open` accepts, mounted under the default sheet, with or without an
 * upgrade first.
 *
 * @param upgraded Whether to call `upgrade` on each item's container before the check.
 * @returns Each item's path and the lines its violations name, and how many items were swept.
 */
const sweepFixtures = (upgraded: boolean) =>
  withStyles(
    Effect.gen(function* sweepEach() {
      const found: string[] = [];
      let swept = 0;

      for (const path of everyFixtureItem) {
        const html = yield* renderedFixture(path);

        if (Option.isNone(html)) {
          continue;
        }

        const container = mount(html.value);
        const controllers = upgraded ? upgrade(container) : undefined;

        swept += 1;
        for (const line of yield* violationsIn(container)) {
          found.push(`${path}: ${line}`);
        }

        controllers?.teardown();
        container.remove();
      }

      return { found, swept };
    }),
  );

describe(server.browser, () => {
  it.effect("[sweep] [runtime] the in-page check finds image-alt in a hand-written page", () =>
    Effect.gen(function* findsImageAlt() {
      const container = mount('<div data-slot="choice-interaction"><img src="a.png"></div>');
      const found = yield* violationsIn(container);

      container.remove();
      assert.strictEqual(found.length, 1);
      assert.match(found[0] ?? "", /^image-alt /u);
    }),
  );

  it.effect(
    "[sweep] every fixture item, rendered with the default sheet, reports no WCAG 2.2 A or AA violation before upgrade",
    () =>
      Effect.gen(function* beforeUpgrade() {
        const { found, swept } = yield* sweepFixtures(false);

        assert.isAtLeast(swept, 5, "the fixtures swept");
        assert.deepStrictEqual(found, []);
      }),
  );

  it.effect(
    "[sweep] [runtime] every fixture item reports no WCAG 2.2 A or AA violation after upgrade()",
    () =>
      Effect.gen(function* afterUpgrade() {
        const { found, swept } = yield* sweepFixtures(true);

        assert.isAtLeast(swept, 5, "the fixtures swept");
        assert.deepStrictEqual(found, []);
      }),
  );
});
