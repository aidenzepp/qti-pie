/**
 * Hotspot's (Q-10) runtime controller in each engine's page: a click on the image selects the
 * hotspot whose real shape holds it (the one listed first where areas overlap, where the core's own
 * shapes stack the later one above; the default hotspot where no area holds it), in the page as the
 * stylesheet lays it out and without the stylesheet; selecting past `max-choices` is undone and
 * announced; each selection's count is announced through the item's live region; and the native
 * controls stay the whole of the keyboard path and of the response. With the stylesheet the core's
 * own shapes already take a click inside a real shape, so those cases pin what the core does, and
 * the same cases without the stylesheet are the ones only the controller answers.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { controller } from "#plate/interactions/hotspot.dom.ts";
import type { Value } from "#plate/model/values.ts";
import type { RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import type { Upgraded } from "#plate/runtime/contract.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's main fixture, relative to the package: a rect `A`, a circle `B`, a triangle `C` and
 * the default hotspot `D`, over a 400 by 300 image, with `max-choices` 2.
 */
const fixture = "fixtures/m3d/items/hotspot.xml";

/**
 * The core's single-choice fixture: a rect, a circle and a triangle, with no default hotspot and
 * `max-choices` 1, so its controls are radios.
 */
const singleFixture = "fixtures/m3d/items/hotspot-single.xml";

/**
 * The item instance every render here is made under.
 */
const instance = "hs1";

/**
 * The `data-slot` marker of the Hotspot Root.
 */
const rootSlot = "hotspot-interaction";

/**
 * The size, in the image's own pixels, of the fixtures' image.
 */
const imageSize = { height: 300, width: 400 } as const;

/**
 * A 400 by 300 image the page can load, which stands in for the fixtures' `images/hotspot-map.svg`
 * that the test server does not serve at the path the page resolves.
 */
const imageUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#eee"/></svg>')}`;

/**
 * The live region's text when a limit of two has been passed.
 */
const atMostTwo = "You can choose at most 2.";

/**
 * What a test passes `render` beyond the item: the mode and the values to restore.
 */
interface Showing {
  readonly mode?: RenderMode;
  readonly values?: Readonly<Record<string, Value>>;
}

/**
 * One rendered item put into the page, with the handles a case drives.
 */
interface Mounted {
  /**
   * Attach the page's registry to the item and keep the upgrade, so the case's end tears it down.
   */
  readonly begin: () => Upgraded;
  readonly container: HTMLElement;
  /**
   * Find a hotspot's Control by its identifier.
   */
  readonly control: (identifier: string) => HTMLInputElement;
  readonly image: HTMLElement;
  readonly live: HTMLElement;
  /**
   * The author's `img`, whose rendered box the hotspots lie over.
   */
  readonly picture: HTMLImageElement;
  readonly root: HTMLElement;
  readonly upgrades: Upgraded[];
}

/**
 * Wait for two animation frames, so a text the live region writes on the next frame is written.
 */
const frames = Effect.callback<number>((resume) => {
  requestAnimationFrame(() => {
    requestAnimationFrame((time) => {
      resume(Effect.succeed(time));
    });
  });
});

/**
 * Read a file of the package as text, through the test server.
 *
 * @param path The file's path relative to the package's root.
 * @returns The file's text.
 */
const fileText = (path: string) => Effect.promise(() => commands.readFile(path));

/**
 * Render an item's XML as plate's SSR writes it, in {@link instance}.
 *
 * @param xml The item's XML.
 * @param showing What the author passes to `render`.
 * @returns The item's HTML.
 */
const rendered = (xml: string, showing: Showing = {}) =>
  Effect.gen(function* renderItem() {
    const accepted = Option.getOrThrow(
      acceptedItem(yield* open(fixture, new TextEncoder().encode(xml))),
    );
    const configuration = yield* configure({});

    return Result.getOrThrow(render(redact(accepted), configuration, { instance, ...showing }))
      .html;
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
 * Find the image a case needs, failing the case when the page has none.
 *
 * @param scope Where to look.
 * @returns The `img`.
 */
const needImage = (scope: ParentNode): HTMLImageElement => {
  const found = need(scope, "img");

  if (!(found instanceof HTMLImageElement)) {
    throw new TypeError("The rendered item's image is not an img.");
  }

  return found;
};

/**
 * Find a Control a case needs, failing the case when the page has none.
 *
 * @param scope Where to look.
 * @param selector The Control's selector.
 * @returns The Control.
 */
const needControl = (scope: ParentNode, selector: string): HTMLInputElement => {
  const found = need(scope, selector);

  if (!(found instanceof HTMLInputElement)) {
    throw new TypeError(`The rendered item's ${selector} is not an input.`);
  }

  return found;
};

/**
 * Put rendered HTML inside a form, with a button before it to hold focus, at the end of the page's
 * body, and make the image one the page can load.
 *
 * @param html The item's HTML.
 * @returns The handles of the mounted item.
 */
const mount = (html: string): Mounted => {
  const container = document.createElement("div");

  container.innerHTML = `<button type="button" data-test="anchor">anchor</button><form>${html}</form>`;
  document.body.append(container);

  const root = need(container, `[data-slot="${rootSlot}"]`);
  const image = need(root, `[data-slot="${rootSlot}-image"]`);
  const picture = needImage(image);
  const upgrades: Upgraded[] = [];

  picture.src = imageUrl;

  return {
    begin: () => {
      const upgraded = upgrade(container);

      upgrades.push(upgraded);

      return upgraded;
    },
    container,
    control: (identifier) =>
      needControl(root, `[data-slot="${rootSlot}-control"][value="${CSS.escape(identifier)}"]`),
    image,
    live: need(container, '[data-slot="item-live"]'),
    picture,
    root,
    upgrades,
  };
};

/**
 * Render an item, put it in the page, run a case over it, and take it out again whatever the case
 * does, tearing down every upgrade it began first.
 *
 * @param xml The item's XML.
 * @param showing What the author passes to `render`.
 * @param use The case.
 * @returns The case's result.
 */
const withItem = <A, E>(
  xml: string,
  showing: Showing,
  use: (item: Mounted) => Effect.Effect<A, E>,
) =>
  Effect.acquireUseRelease(Effect.map(rendered(xml, showing), mount), use, (item) =>
    Effect.sync(() => {
      for (const upgraded of item.upgrades) {
        upgraded.teardown();
      }

      item.container.remove();
    }),
  );

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
 * Run a case twice over the same item, once in the page as the stylesheet lays it out (each
 * hotspot's shape over the image) and once without the stylesheet (the image above a plain list of
 * controls), so a click at an image point is tested where the shapes catch it and where only the
 * image does.
 *
 * @param use The case, given whether the stylesheet is in the page.
 * @returns The case's result.
 */
const bothLayouts = <E>(use: (sheet: boolean) => Effect.Effect<void, E>) =>
  Effect.gen(function* inBoth() {
    yield* use(false);
    yield* withSheet(use(true));
  });

/**
 * Click the image at a point given in the image's own pixels: a real pointer click, at the place
 * of the author's `img` the point maps to.
 *
 * @param item The mounted item.
 * @param x The point's x coordinate in the image's pixels.
 * @param y The point's y coordinate in the image's pixels.
 */
const clickAt = (item: Mounted, x: number, y: number) =>
  Effect.promise(async () => {
    const part = item.image.getBoundingClientRect();
    const box = item.picture.getBoundingClientRect();

    await userEvent.click(item.image, {
      position: {
        x: box.left - part.left + (x / imageSize.width) * box.width,
        y: box.top - part.top + (y / imageSize.height) * box.height,
      },
    });
  });

/**
 * Find the key press that moves focus to the next control of any kind in this engine: Tab, or
 * Option-Tab where the engine, as WebKit on macOS does by default, makes Tab skip radios and
 * checkboxes.
 *
 * It presses Tab once from a button and reads where focus lands, as `nextControlKey` does for the
 * Node-driven browser tests (`src/test/browsers.ts`), and as the in-page cases of
 * `answer-masking.dom.test.ts` do. Its probe buttons are the test's own and leave with it.
 *
 * @returns The `userEvent.keyboard` text that moves to the next control.
 */
const nextControlKey = Effect.acquireUseRelease(
  Effect.sync(() => {
    const container = document.createElement("div");

    container.innerHTML =
      '<button type="button">first</button><button type="button">second</button>';
    document.body.append(container);

    return container;
  }),
  (container) =>
    Effect.gen(function* probe() {
      const [first, second] = container.querySelectorAll("button");

      first?.focus();
      yield* Effect.promise(() => userEvent.tab());

      return document.activeElement === second ? "{Tab}" : "{Alt>}{Tab}{/Alt}";
    }),
  (container) =>
    Effect.sync(() => {
      container.remove();
    }),
);

/**
 * Press a run of keys on the page's focused element.
 *
 * @param keys The `userEvent.keyboard` text.
 * @returns Completion once the keys are pressed.
 */
const press = (keys: string) => Effect.promise(() => userEvent.keyboard(keys));

/**
 * Press the key that moves to the next control until a control has focus, from wherever the page's
 * focus is, and fail the case when it does not get there.
 *
 * @param control The control to reach.
 * @param key The `userEvent.keyboard` text that moves to the next control,
 *   {@link nextControlKey}'s.
 */
const tabTo = (control: HTMLElement, key: string) =>
  Effect.gen(function* tabbing() {
    for (let tabs = 0; tabs < 8 && document.activeElement !== control; tabs += 1) {
      yield* press(key);
    }

    assert.strictEqual(document.activeElement, control);
  });

/**
 * Read which hotspots are checked, as the identifiers of their Controls, in document order.
 *
 * @param item The mounted item.
 * @returns The checked identifiers.
 */
const checked = (item: Mounted): readonly string[] =>
  [...item.root.querySelectorAll<HTMLInputElement>(`[data-slot="${rootSlot}-control"]`)]
    .filter((control) => control.checked)
    .map((control) => control.value);

/**
 * Read what the live region said last, once the frame that writes it has passed.
 *
 * @param item The mounted item.
 * @returns The text.
 */
const heard = (item: Mounted) => frames.pipe(Effect.map(() => item.live.textContent));

/**
 * Record every change of the live region's content, so a case can tell that nothing was announced.
 *
 * @param item The mounted item.
 * @returns The records so far, and the stop.
 */
const watched = (item: Mounted) => {
  const records: MutationRecord[] = [];
  const observer = new MutationObserver((batch) => {
    records.push(...batch);
  });

  observer.observe(item.live, { characterData: true, childList: true, subtree: true });

  return {
    records: () => [...records, ...observer.takeRecords()],
    stop: () => {
      observer.disconnect();
    },
  };
};

/**
 * An identifier value of one or more entries, as a restored response.
 *
 * @param identifiers The identifiers.
 * @returns The value.
 */
const identifierValue = (...chosen: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: chosen.map((value) => ({ baseType: "identifier" as const, value })),
});

describe(server.browser, () => {
  describe("the Hotspot controller", () => {
    it.effect("[Q-10] the Hotspot controller is implemented and leaves no stub mark", () =>
      Effect.gen(function* implemented() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.sync(() => {
            assert.isTrue(controller.implemented);

            const upgraded = item.begin();

            assert.deepStrictEqual(
              upgraded.controllers.map(({ root }) => root),
              [item.root],
            );
            assert.isUndefined(item.root.dataset["runtime"]);

            upgraded.teardown();
            assert.isUndefined(item.root.dataset["runtime"]);
          }),
        );
      }),
    );

    it.effect(
      "[Q-10] a click inside a circle's shape but outside no other area checks the circle's control",
      () =>
        Effect.gen(function* insideCircle() {
          const xml = yield* fileText(fixture);

          yield* bothLayouts((sheet) =>
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                item.begin();
                yield* clickAt(item, 300, 90);

                assert.deepStrictEqual(checked(item), ["B"], `sheet: ${String(sheet)}`);
              }),
            ),
          );
        }),
    );

    it.effect(
      "[Q-10] a click inside the circle's bounding box but outside the circle does not check it",
      () =>
        Effect.gen(function* insideBox() {
          const xml = yield* fileText(fixture);

          yield* bothLayouts((sheet) =>
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                item.begin();
                yield* clickAt(item, 257, 47);

                assert.isFalse(item.control("B").checked, `sheet: ${String(sheet)}`);
                assert.deepStrictEqual(checked(item), ["D"], `sheet: ${String(sheet)}`);
              }),
            ),
          );
        }),
    );

    it.effect("[Q-10] where two areas overlap, the one listed first wins", () =>
      Effect.gen(function* overlapping() {
        const original = yield* fileText(fixture);
        const xml = original.replace('coords="300,90,50"', 'coords="150,80,50"');

        assert.notStrictEqual(xml, original);

        yield* bothLayouts((sheet) =>
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              yield* clickAt(item, 140, 80);
              assert.deepStrictEqual(checked(item), ["A"], `sheet: ${String(sheet)}`);

              yield* clickAt(item, 140, 80);
              assert.deepStrictEqual(checked(item), [], `sheet: ${String(sheet)}`);

              yield* clickAt(item, 190, 80);
              assert.deepStrictEqual(checked(item), ["B"], `sheet: ${String(sheet)}`);
            }),
          ),
        );
      }),
    );

    it.effect("[Q-10] selecting past max-choices is undone and announced", () =>
      Effect.gen(function* pastTheLimit() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              yield* clickAt(item, 100, 80);
              yield* clickAt(item, 300, 90);
              assert.deepStrictEqual(checked(item), ["A", "B"]);

              const changes: string[] = [];
              const record = (event: Event) => {
                changes.push(event.type);
              };

              item.root.addEventListener("change", record);
              yield* clickAt(item, 140, 235);
              item.root.removeEventListener("change", record);

              assert.deepStrictEqual(checked(item), ["A", "B"]);
              assert.deepStrictEqual(changes, []);
              assert.strictEqual(yield* heard(item), atMostTwo);

              yield* clickAt(item, 100, 80);
              assert.deepStrictEqual(checked(item), ["B"]);
              yield* clickAt(item, 140, 235);
              assert.deepStrictEqual(checked(item), ["B", "C"]);
            }),
          ),
        );
      }),
    );

    it.effect("[Q-10] each selection change announces the count", () =>
      Effect.gen(function* countAnnounced() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              yield* clickAt(item, 100, 80);
              assert.strictEqual(yield* heard(item), "1 of 2 chosen.");

              yield* clickAt(item, 300, 90);
              assert.strictEqual(yield* heard(item), "2 of 2 chosen.");

              yield* clickAt(item, 100, 80);
              assert.strictEqual(yield* heard(item), "1 of 2 chosen.");
            }),
          ),
        );
      }),
    );

    it.effect(
      "[Q-10] the keyboard path is the native one and the controller does not change it",
      () =>
        Effect.gen(function* keyboardIsNative() {
          const key = yield* nextControlKey;
          const xml = yield* fileText(fixture);
          const single = yield* fileText(singleFixture);

          yield* withSheet(
            Effect.gen(function* drive() {
              yield* withItem(xml, {}, (item) =>
                Effect.gen(function* checkboxes() {
                  item.begin();
                  yield* tabTo(item.control("A"), key);

                  const reached: Element[] = [item.control("A")];

                  for (let tabs = 0; tabs < 3; tabs += 1) {
                    yield* press(key);
                    reached.push(document.activeElement ?? document.body);
                  }

                  assert.deepStrictEqual(
                    reached,
                    ["A", "B", "C", "D"].map((identifier) => item.control(identifier)),
                  );

                  yield* press(" ");
                  assert.deepStrictEqual(checked(item), ["D"]);
                  yield* press(" ");
                  assert.deepStrictEqual(checked(item), []);
                }),
              );

              yield* withItem(single, {}, (item) =>
                Effect.gen(function* radios() {
                  item.begin();
                  yield* tabTo(item.control("SQUARE"), key);

                  yield* press("{ArrowDown}");
                  assert.strictEqual(document.activeElement, item.control("ROUND"));
                  assert.deepStrictEqual(checked(item), ["ROUND"]);

                  yield* press("{ArrowDown}");
                  assert.strictEqual(document.activeElement, item.control("TRIANGLE"));
                  assert.deepStrictEqual(checked(item), ["TRIANGLE"]);

                  yield* press("{ArrowUp}");
                  assert.strictEqual(document.activeElement, item.control("ROUND"));
                  assert.deepStrictEqual(checked(item), ["ROUND"]);
                }),
              );
            }),
          );
        }),
    );

    it.effect(
      "[Q-10] upgrade moves no focus and announces nothing; teardown removes every listener",
      () =>
        Effect.gen(function* quietAndUndone() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const focused: EventTarget[] = [];
              const record = (event: FocusEvent) => {
                focused.push(event.target ?? document);
              };
              const before = document.activeElement;
              const watch = watched(item);

              document.addEventListener("focusin", record);

              const upgraded = item.begin();

              yield* frames;
              document.removeEventListener("focusin", record);

              assert.strictEqual(document.activeElement, before);
              assert.deepStrictEqual(focused, []);
              assert.deepStrictEqual(watch.records(), []);
              assert.strictEqual(item.live.textContent, "");

              yield* clickAt(item, 100, 80);
              yield* clickAt(item, 300, 90);
              assert.deepStrictEqual(checked(item), ["A", "B"]);
              assert.strictEqual(yield* heard(item), "2 of 2 chosen.");

              yield* clickAt(item, 140, 235);
              assert.deepStrictEqual(checked(item), ["A", "B"]);
              assert.strictEqual(yield* heard(item), atMostTwo);
              watch.stop();

              upgraded.teardown();

              const after = watched(item);

              yield* clickAt(item, 20, 280);
              item.control("C").click();
              yield* frames;

              assert.deepStrictEqual(checked(item), ["A", "B", "C"]);
              assert.deepStrictEqual(after.records(), []);
              after.stop();
            }),
          );
        }),
    );

    it.effect("[Q-10] a finished item gets no behaviour", () =>
      Effect.gen(function* finished() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, { mode: "review", values: { RESPONSE: identifierValue("B") } }, (item) =>
            Effect.gen(function* drive() {
              const watch = watched(item);

              item.begin();
              assert.deepStrictEqual(checked(item), ["B"]);

              yield* clickAt(item, 100, 80);
              yield* clickAt(item, 257, 47);
              yield* frames;

              assert.deepStrictEqual(checked(item), ["B"]);
              assert.deepStrictEqual(watch.records(), []);
              watch.stop();
            }),
          ),
        );
      }),
    );

    it.effect(
      "[Q-10] a click on no area checks the default hotspot, and an item with no default checks nothing",
      () =>
        Effect.gen(function* outsideEveryArea() {
          const xml = yield* fileText(fixture);
          const single = yield* fileText(singleFixture);

          yield* bothLayouts((sheet) =>
            Effect.gen(function* drive() {
              yield* withItem(xml, {}, (item) =>
                Effect.gen(function* withDefault() {
                  item.begin();
                  yield* clickAt(item, 20, 280);
                  assert.deepStrictEqual(checked(item), ["D"], `sheet: ${String(sheet)}`);

                  yield* clickAt(item, 380, 20);
                  assert.deepStrictEqual(checked(item), [], `sheet: ${String(sheet)}`);
                }),
              );

              yield* withItem(single, {}, (item) =>
                Effect.gen(function* withoutDefault() {
                  const watch = watched(item);

                  item.begin();
                  yield* clickAt(item, 20, 280);
                  yield* frames;

                  assert.deepStrictEqual(checked(item), [], `sheet: ${String(sheet)}`);
                  assert.deepStrictEqual(watch.records(), []);
                  watch.stop();
                }),
              );
            }),
          );
        }),
    );

    it.effect("[Q-10] an ellipse and a polygon hold their own shape, not their bounding box", () =>
      Effect.gen(function* ellipseAndPolygon() {
        const original = yield* fileText(fixture);
        const xml = original.replace(
          'shape="circle" coords="300,90,50"',
          'shape="ellipse" coords="300,90,80,30"',
        );

        assert.notStrictEqual(xml, original);

        yield* bothLayouts((sheet) =>
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const where = `sheet: ${String(sheet)}`;

              item.begin();

              yield* clickAt(item, 355, 90);
              assert.deepStrictEqual(checked(item), ["B"], where);
              yield* clickAt(item, 355, 90);

              yield* clickAt(item, 372, 68);
              assert.deepStrictEqual(checked(item), ["D"], where);
              yield* clickAt(item, 372, 68);

              yield* clickAt(item, 140, 235);
              assert.deepStrictEqual(checked(item), ["C"], where);
              yield* clickAt(item, 140, 235);

              yield* clickAt(item, 75, 195);
              assert.deepStrictEqual(checked(item), ["D"], where);
            }),
          ),
        );
      }),
    );

    it.effect(
      "[Q-10] a click is mapped from the rendered image box back to the image's own pixels",
      () =>
        Effect.gen(function* scaledImage() {
          const xml = yield* fileText(fixture);

          yield* bothLayouts((sheet) =>
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                const where = `sheet: ${String(sheet)}`;

                item.begin();

                for (const [width, height] of [
                  [200, 150],
                  [600, 450],
                ] as const) {
                  item.picture.style.width = `${String(width)}px`;
                  item.picture.style.height = `${String(height)}px`;

                  yield* clickAt(item, 300, 90);
                  assert.deepStrictEqual(checked(item), ["B"], `${where}, ${String(width)} wide`);
                  yield* clickAt(item, 300, 90);

                  yield* clickAt(item, 257, 47);
                  assert.deepStrictEqual(checked(item), ["D"], `${where}, ${String(width)} wide`);
                  yield* clickAt(item, 257, 47);
                }
              }),
            ),
          );
        }),
    );

    it.effect(
      "[Q-10] a radio group's pointer click selects one hotspot and announces no count",
      () =>
        Effect.gen(function* radioGroup() {
          const single = yield* fileText(singleFixture);

          yield* bothLayouts((sheet) =>
            withItem(single, {}, (item) =>
              Effect.gen(function* drive() {
                const where = `sheet: ${String(sheet)}`;
                const watch = watched(item);

                item.begin();
                yield* clickAt(item, 300, 90);
                assert.deepStrictEqual(checked(item), ["ROUND"], where);

                yield* clickAt(item, 100, 80);
                assert.deepStrictEqual(checked(item), ["SQUARE"], where);

                yield* clickAt(item, 100, 80);
                assert.deepStrictEqual(checked(item), ["SQUARE"], where);

                yield* frames;
                assert.deepStrictEqual(watch.records(), [], where);
                watch.stop();
              }),
            ),
          );
        }),
    );

    it.effect("[Q-10] with no limit every hotspot may be chosen and the count says so", () =>
      Effect.gen(function* noLimit() {
        const original = yield* fileText(fixture);
        const xml = original.replace('max-choices="2"', 'max-choices="0"');

        assert.notStrictEqual(xml, original);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              yield* clickAt(item, 100, 80);
              yield* clickAt(item, 300, 90);
              yield* clickAt(item, 140, 235);
              yield* clickAt(item, 20, 280);

              assert.deepStrictEqual(checked(item), ["A", "B", "C", "D"]);
              assert.strictEqual(yield* heard(item), "4 chosen.");
            }),
          ),
        );
      }),
    );

    it.effect("[Q-10] a checkbox chosen by keyboard past max-choices is refused too", () =>
      Effect.gen(function* keyboardPastTheLimit() {
        const key = yield* nextControlKey;
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              yield* tabTo(item.control("A"), key);
              yield* press(" ");
              yield* press(key);
              yield* press(" ");
              assert.deepStrictEqual(checked(item), ["A", "B"]);

              yield* press(key);
              assert.strictEqual(document.activeElement, item.control("C"));
              yield* press(" ");

              assert.deepStrictEqual(checked(item), ["A", "B"]);
              assert.strictEqual(yield* heard(item), atMostTwo);
              assert.strictEqual(document.activeElement, item.control("C"));
            }),
          ),
        );
      }),
    );

    it.effect("[Q-10] a root without its parts upgrades to nothing and tears down", () =>
      Effect.gen(function* bareRoots() {
        const container = document.createElement("div");

        container.innerHTML =
          '<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><fieldset data-slot="hotspot-interaction"></fieldset><fieldset data-slot="hotspot-interaction"><div data-slot="hotspot-interaction-image"></div></fieldset></div>';
        document.body.append(container);

        const live = need(container, '[data-slot="item-live"]');
        const focused: EventTarget[] = [];
        const record = (event: FocusEvent) => {
          focused.push(event.target ?? document);
        };
        const before = document.activeElement;
        const markup = container.innerHTML;

        document.addEventListener("focusin", record);

        const upgraded = upgrade(container);

        yield* frames;
        document.removeEventListener("focusin", record);

        for (const part of container.querySelectorAll<HTMLElement>(
          `[data-slot="${rootSlot}"], [data-slot="${rootSlot}-image"]`,
        )) {
          part.click();
        }

        yield* frames;

        assert.strictEqual(upgraded.controllers.length, 2);
        assert.strictEqual(document.activeElement, before);
        assert.deepStrictEqual(focused, []);
        assert.strictEqual(live.textContent, "");
        assert.strictEqual(container.innerHTML, markup);

        upgraded.teardown();
        assert.strictEqual(container.innerHTML, markup);
        container.remove();
      }),
    );

    it.effect("[Q-10] a root with its controls but no image still counts and limits them", () =>
      Effect.gen(function* controlsOnly() {
        const container = document.createElement("div");

        container.innerHTML =
          '<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><fieldset data-slot="hotspot-interaction" data-max-choices="1"><input data-slot="hotspot-interaction-control" type="checkbox" name="q" value="a"><input data-slot="hotspot-interaction-control" type="checkbox" name="q" value="b"></fieldset></div>';
        document.body.append(container);

        const live = need(container, '[data-slot="item-live"]');
        const [first, second] = [
          ...container.querySelectorAll<HTMLInputElement>("input[type=checkbox]"),
        ];
        const upgraded = upgrade(container);

        first?.click();
        yield* frames;
        assert.strictEqual(live.textContent, "1 of 1 chosen.");

        second?.click();
        yield* frames;
        assert.strictEqual(live.textContent, "You can choose at most 1.");
        assert.deepStrictEqual([first?.checked, second?.checked], [true, false]);

        upgraded.teardown();
        second?.click();
        yield* frames;
        assert.deepStrictEqual([first?.checked, second?.checked], [true, true]);
        assert.strictEqual(live.textContent, "You can choose at most 1.");
        container.remove();
      }),
    );
  });
});
