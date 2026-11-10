/**
 * The Hotspot's (Q-10) pointer path in each engine's page, with no script: the fixture the core
 * renders, mounted with plate's stylesheet and never upgraded, takes a click inside each area and
 * a click where no other area is drawn, which reaches the default hotspot.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's main Hotspot fixture, relative to the package: a `rect` (`A`), a `circle` (`B`), a
 * `poly` (`C`) and the default hotspot (`D`), over a 400 by 300 image, with `max-choices` 2.
 */
const fixture = "fixtures/m3d/items/hotspot.xml";

/**
 * The `data-slot` marker of the Hotspot Image part, the box every area lies over.
 */
const imageSlot = "hotspot-interaction-image";

/**
 * One rendered item put into the page, with the handles a case drives.
 */
interface Mounted {
  /**
   * Find the shape that draws one area, by the geometry it carries.
   */
  readonly area: (geometry: string) => HTMLElement;
  readonly box: HTMLElement;
  readonly container: HTMLElement;
}

/**
 * Read a file of the package as text, through the test server.
 *
 * @param path The file's path relative to the package's root.
 * @returns The file's text.
 */
const fileText = (path: string) => Effect.promise(() => commands.readFile(path));

/**
 * Render the fixture's XML as plate's SSR writes it, with nothing restored.
 *
 * @param xml The item's XML.
 * @returns The item's HTML.
 */
const rendered = (xml: string) =>
  Effect.gen(function* renderItem() {
    const accepted = Option.getOrThrow(
      acceptedItem(yield* open("items/hotspot.xml", new TextEncoder().encode(xml))),
    );
    const configuration = yield* configure({});

    return Result.getOrThrow(render(redact(accepted), configuration, { instance: "hs1" })).html;
  });

/**
 * Find an element a case needs, failing the case when the page has none.
 *
 * @param scope Where to look.
 * @param selector The element's selector.
 * @returns The element.
 */
const need = (scope: ParentNode, selector: string): HTMLElement => {
  const found = scope.querySelector<HTMLElement>(selector);

  if (found === null) {
    throw new Error(`The rendered item has no ${selector}.`);
  }

  return found;
};

/**
 * Put the rendered HTML inside a form at the end of the page's body, and upgrade nothing.
 *
 * @param html The item's HTML.
 * @returns The handles of the mounted item.
 */
const mount = (html: string): Mounted => {
  const container = document.createElement("div");

  container.innerHTML = `<form>${html}</form>`;
  document.body.append(container);

  return {
    area: (geometry) => need(container, `[data-shape="${geometry}"]`),
    box: need(container, `[data-slot="${imageSlot}"]`),
    container,
  };
};

/**
 * Run a case with plate's stylesheet in the page, and take it out again whatever the case does.
 *
 * @param use The case.
 * @returns The case's result.
 */
const withSheet = <A, E>(use: Effect.Effect<A, E>) =>
  Effect.acquireUseRelease(
    Effect.map(fileText("src/styles.css"), (sheet) => {
      const style = document.createElement("style");

      style.textContent = sheet;
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
 * Render an item, put it in the page, run a case over it, and take it out again whatever the case
 * does.
 *
 * @param xml The item's XML.
 * @param use The case.
 * @returns The case's result.
 */
const withItem = <A, E>(xml: string, use: (item: Mounted) => Effect.Effect<A, E>) =>
  Effect.acquireUseRelease(Effect.map(rendered(xml), mount), use, ({ container }) =>
    Effect.sync(() => {
      container.remove();
    }),
  );

/**
 * Give the element the pointer reaches at a point of the page.
 *
 * @param x The point's distance from the viewport's left edge, in CSS pixels.
 * @param y The point's distance from the viewport's top edge, in CSS pixels.
 * @returns The topmost element there, failing the case when the point is outside the viewport.
 */
const reachedAt = (x: number, y: number): Element => {
  const reached = document.elementFromPoint(x, y);

  if (reached === null) {
    throw new Error(`The point (${String(x)}, ${String(y)}) is outside the viewport.`);
  }

  return reached;
};

/**
 * Give the element the pointer reaches at the centre of another element, which is where a click
 * on it lands.
 *
 * @param element The element.
 * @returns The topmost element at its centre.
 */
const reachedAtCentre = (element: Element): Element => {
  const { height, left, top, width } = element.getBoundingClientRect();

  return reachedAt(left + width / 2, top + height / 2);
};

/**
 * Read which Controls of a mounted item are checked, by their values in document order.
 *
 * @param item The mounted item.
 * @returns The checked Controls' values.
 */
const checkedIn = (item: Mounted): readonly string[] =>
  [...item.container.querySelectorAll("input")]
    .filter((control) => control.checked)
    .map((control) => control.value);

describe(server.browser, () => {
  describe("the Hotspot with no script", () => {
    it.effect(
      "[Q-10] without script, a click where no other area is drawn checks the default hotspot, and a click inside an area checks that area",
      () =>
        Effect.gen(function* pointer() {
          const xml = yield* fileText(fixture);

          yield* withSheet(
            withItem(xml, (item) =>
              Effect.gen(function* drive() {
                item.box.scrollIntoView({ block: "center" });

                const { left, top, width } = item.box.getBoundingClientRect();

                assert.isAtLeast(width, 381, "the image box spans the fixture's image");

                assert.strictEqual(reachedAt(left + 380, top + 20), item.area("default"));
                assert.deepStrictEqual(
                  ["rect", "circle", "poly"].map((geometry) =>
                    reachedAtCentre(item.area(geometry)),
                  ),
                  [item.area("rect"), item.area("circle"), item.area("poly")],
                  "an area listed before the default lies above it",
                );
                assert.deepStrictEqual(checkedIn(item), []);

                yield* Effect.promise(() => userEvent.click(item.area("default")));
                assert.deepStrictEqual(checkedIn(item), ["D"]);

                yield* Effect.promise(() => userEvent.click(item.area("circle")));
                assert.deepStrictEqual(checkedIn(item), ["B", "D"]);

                assert.deepStrictEqual(
                  [...item.container.querySelectorAll("input")].map((control) => control.value),
                  ["A", "B", "C", "D"],
                );
                assert.lengthOf(item.container.querySelectorAll("[style]"), 0);
              }),
            ),
          );
        }),
    );
  });
});
