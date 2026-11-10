/**
 * Graphic Order's (Q-9) runtime controller in each engine's page: the select-then-place protocol
 * over the hotspots and positions the core renders, by keyboard alone and by single pointer without
 * dragging, its announcements through the item's live region, its response as one hidden input per
 * placed hotspot in position order under the root's entry name, the badge each ordered hotspot
 * shows, and its teardown.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import axe from "axe-core";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { controller } from "#plate/interactions/graphic-order.dom.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import type { Redacted, RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import type { Upgraded } from "#plate/runtime/contract.dom.ts";
import { announcements } from "#plate/runtime/select-place.dom.ts";
import { readHidden } from "#plate/runtime/wire.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's main fixture, relative to the package: four hotspots, a rectangle `H1` (House), a
 * circle `H2` (Sun), a polygon `H3` (Hill) and an ellipse `H4` (Boat), over a 320 by 200 image,
 * with no `min-choices`, so every hotspot is ordered and four positions are offered.
 */
const fixture = "fixtures/ei/items/graphic-order.xml";

/**
 * The core's subset fixture: `min-choices` 2 and `max-choices` 3, so three positions are offered,
 * a polygon `H3` with no label, and a `default` hotspot `H4`.
 */
const subsetFixture = "fixtures/ei/items/graphic-order-subset.xml";

/**
 * The item instance every render here is made under, which scopes the entry name.
 */
const instance = "go1";

/**
 * The entry name the fixtures' hidden inputs post under in {@link instance}.
 */
const name = entryName(instance, "RESPONSE");

/**
 * The `data-slot` marker of the Graphic Order Root.
 */
const rootSlot = "graphic-order-interaction";

/**
 * The `data-slot` marker of a hotspot.
 */
const hotspotSlot = `${rootSlot}-hotspot`;

/**
 * The `data-slot` marker of a position.
 */
const positionSlot = `${rootSlot}-slot`;

/**
 * The `data-slot` marker of an ordered hotspot's badge.
 */
const badgeSlot = `${rootSlot}-badge`;

/**
 * Construct the ordered identifier value that lists the hotspots in order.
 *
 * @param identifiers The hotspots' identifiers, in order.
 * @returns The value.
 */
const orderValue = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "ordered",
  values: identifiers.map((value) => ({ baseType: "identifier" as const, value })),
});

/**
 * What a test passes `render` beyond the item: the mode the author chooses and the values to
 * restore.
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

  /**
   * Find the badge an ordered hotspot shows, or none.
   */
  readonly badge: (identifier: string) => HTMLElement | null;
  readonly container: HTMLElement;
  readonly form: HTMLFormElement;

  /**
   * Find a hotspot by its identifier.
   */
  readonly hotspot: (identifier: string) => HTMLElement;
  readonly live: HTMLElement;

  /**
   * Find a position by its place in the list, from 1.
   */
  readonly position: (place: number) => HTMLElement;
  readonly positions: () => readonly HTMLElement[];
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
 * @returns The item's HTML and its redacted form.
 */
const rendered = (xml: string, showing: Showing = {}) =>
  Effect.gen(function* renderItem() {
    const path = "items/graphic-order.xml";
    const accepted = Option.getOrThrow(
      acceptedItem(yield* open(path, new TextEncoder().encode(xml))),
    );
    const configuration = yield* configure({});
    const redacted = redact(accepted);
    const page = Result.getOrThrow(render(redacted, configuration, { instance, ...showing }));

    return { html: page.html, redacted };
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
 * Put rendered HTML inside a form, with a button before it to hold focus, at the end of the page's
 * body.
 *
 * @param html The item's HTML.
 * @returns The handles of the mounted item.
 */
const mount = (html: string): Mounted => {
  const container = document.createElement("div");

  container.innerHTML = `<button type="button" data-test="anchor">anchor</button><form>${html}</form>`;
  document.body.append(container);

  const root = need(container, `[data-slot="${rootSlot}"]`);
  const form = container.querySelector("form");
  const upgrades: Upgraded[] = [];

  if (form === null) {
    throw new Error("The mounted item lost its form.");
  }

  const positions = (): readonly HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>(`[data-slot="${positionSlot}"]`),
  ];
  const hotspot = (identifier: string): HTMLElement =>
    need(root, `[data-slot="${hotspotSlot}"][data-identifier="${identifier}"]`);

  return {
    badge: (identifier) =>
      hotspot(identifier).querySelector<HTMLElement>(`[data-slot="${badgeSlot}"]`),
    begin: () => {
      const upgraded = upgrade(container);

      upgrades.push(upgraded);

      return upgraded;
    },
    container,
    form,
    hotspot,
    live: need(container, '[data-slot="item-live"]'),
    position: (place) => {
      const found = positions()[place - 1];

      if (found === undefined) {
        throw new Error(`The rendered item has no position ${String(place)}.`);
      }

      return found;
    },
    positions,
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
  use: (item: Mounted, redacted: Redacted) => Effect.Effect<A, E>,
) =>
  Effect.acquireUseRelease(
    Effect.map(rendered(xml, showing), ({ html, redacted }) => ({ item: mount(html), redacted })),
    ({ item, redacted }) => use(item, redacted),
    ({ item }) =>
      Effect.sync(() => {
        for (const upgraded of item.upgrades) {
          upgraded.teardown();
        }

        item.container.remove();
      }),
  );

/**
 * Dispatch a `keydown` at an element, bubbling and cancelable, as a key press reaches the page.
 *
 * @param element The element the key is pressed on.
 * @param key The event's `key`.
 * @returns The event, to read `defaultPrevented` from.
 */
const press = (element: Element, key: string): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });

  element.dispatchEvent(event);

  return event;
};

/**
 * Place a hotspot in a position by keys: Space picks it up, ArrowDown moves to the position, Enter
 * places it.
 *
 * @param hotspot The hotspot.
 * @param place The position's place in the list, from 1.
 */
const placeByKeys = (hotspot: HTMLElement, place: number): void => {
  press(hotspot, " ");

  for (let step = 0; step < place; step += 1) {
    press(hotspot, "ArrowDown");
  }

  press(hotspot, "Enter");
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
 * Read the text each position shows, in order.
 *
 * @param item The mounted item.
 * @returns The positions' texts.
 */
const shown = (item: Mounted): readonly (string | null)[] =>
  item.positions().map((position) => position.textContent);

/**
 * Read the position number each hotspot's badge shows, by hotspot, for the hotspots that show one.
 *
 * @param item The mounted item.
 * @param identifiers The hotspots to read.
 * @returns Each hotspot's identifier and the badge's text, only for those with a badge.
 */
const badges = (item: Mounted, identifiers: readonly string[]): Readonly<Record<string, string>> =>
  Object.fromEntries(
    identifiers.flatMap((identifier) => {
      const badge = item.badge(identifier);

      return badge === null ? [] : [[identifier, badge.textContent ?? ""] as const];
    }),
  );

/**
 * Read the identifiers of the hotspots of the main fixture.
 */
const allHotspots = ["H1", "H2", "H3", "H4"] as const;

describe(server.browser, () => {
  describe("the Graphic Order controller", () => {
    it.effect("[Q-9] the Graphic Order controller is implemented and leaves no stub mark", () =>
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
      "[Q-9] keyboard only: pick H2, move to position 1, Enter places it; its badge reads 1",
      () =>
        Effect.gen(function* keyboardOnly() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const sun = item.hotspot("H2");

              item.begin();

              for (let tabs = 0; tabs < 12 && document.activeElement !== sun; tabs += 1) {
                yield* Effect.promise(() => userEvent.tab());
              }

              assert.strictEqual(document.activeElement, sun);

              yield* Effect.promise(() => userEvent.keyboard(" "));
              assert.strictEqual(sun.getAttribute("aria-pressed"), "true");
              yield* Effect.promise(() => userEvent.keyboard("{ArrowDown}"));
              assert.isTrue(Object.hasOwn(item.position(1).dataset, "cursor"));
              yield* Effect.promise(() => userEvent.keyboard("{Enter}"));

              assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
              assert.strictEqual(item.position(1).textContent, "Sun");
              assert.strictEqual(item.badge("H2")?.textContent, "1");
              assert.strictEqual(item.badge("H2")?.dataset["position"], "1");
              assert.strictEqual(sun.dataset["position"], "1");
              assert.isFalse(Object.hasOwn(item.position(1).dataset, "empty"));
              assert.isTrue(Object.hasOwn(item.position(2).dataset, "empty"));
              assert.strictEqual(document.activeElement, sun);
              assert.strictEqual(yield* heard(item), announcements.placed("Sun", "Position 1"));
            }),
          );
        }),
    );

    it.effect(
      "[Q-9] single pointer: click a hotspot on the image, click a position (WCAG 2.5.7)",
      () =>
        Effect.gen(function* singlePointer() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const pointers: string[] = [];
              const record = (event: Event) => {
                pointers.push(event.type);
              };

              for (const type of ["pointerdown", "pointermove", "pointerup"]) {
                document.addEventListener(type, record, true);
              }

              item.begin();
              item.hotspot("H2").click();
              assert.strictEqual(item.hotspot("H2").getAttribute("aria-pressed"), "true");
              item.position(1).click();

              for (const type of ["pointerdown", "pointermove", "pointerup"]) {
                document.removeEventListener(type, record, true);
              }

              assert.deepStrictEqual(pointers, []);
              assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
              assert.strictEqual(item.position(1).textContent, "Sun");
              assert.strictEqual(item.badge("H2")?.textContent, "1");
              assert.strictEqual(yield* heard(item), announcements.placed("Sun", "Position 1"));
            }),
          );
        }),
    );

    it.effect(
      "[Q-9] under the stylesheet a click on a hotspot's area on the image picks it up",
      () =>
        Effect.gen(function* clickOnTheImage() {
          const xml = yield* fileText(fixture);

          yield* withSheet(
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                item.begin();

                const image = need(
                  item.root,
                  `[data-slot="${rootSlot}-image"]`,
                ).getBoundingClientRect();
                const scale = image.width / 320;
                const hit = (x: number, y: number): Element | null =>
                  document.elementFromPoint(image.left + x * scale, image.top + y * scale);
                const areas = [
                  ["H1", 65, 65],
                  ["H2", 160, 70],
                  ["H3", 260, 100],
                  ["H4", 90, 165],
                ] as const;

                for (const [identifier, x, y] of areas) {
                  const found = hit(x, y);

                  assert.isNotNull(found, identifier);
                  assert.isTrue(item.hotspot(identifier).contains(found), identifier);
                }

                const bare = hit(10, 10);

                assert.isNotNull(bare);
                assert.isNull(bare.closest(`[data-slot="${hotspotSlot}"]`));

                const sun = hit(160, 70);

                sun?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
                assert.strictEqual(item.hotspot("H2").getAttribute("aria-pressed"), "true");
                item.position(2).click();
                assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
                assert.strictEqual(item.position(2).textContent, "Sun");
                yield* frames;
              }),
            ),
          );
        }),
    );

    it.effect(
      "[Q-9] by single pointer a taken position sends the earlier hotspot back, and a placed hotspot is picked up again to move",
      () =>
        Effect.gen(function* pointerDisplaces() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              const place = (identifier: string, position: number): void => {
                item.hotspot(identifier).click();
                item.position(position).click();
              };

              place("H2", 1);
              place("H1", 2);
              assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H1"]);

              place("H3", 1);
              assert.deepStrictEqual(readHidden(item.root, name), ["H3", "H1"]);
              assert.strictEqual(
                yield* heard(item),
                `${announcements.placed("Hill", "Position 1")} ${announcements.returned("Sun")}`,
              );

              place("H1", 1);
              assert.deepStrictEqual(readHidden(item.root, name), ["H1", "H3"]);
              assert.deepStrictEqual(shown(item), ["House", "Hill", "Empty", "Empty"]);
              assert.deepStrictEqual(badges(item, allHotspots), { H1: "1", H3: "2" });
              assert.strictEqual(
                yield* heard(item),
                `${announcements.placed("House", "Position 1")} Hill moved to Position 2.`,
              );

              item.hotspot("H1").click();
              item.hotspot("H1").click();
              assert.strictEqual(item.hotspot("H1").getAttribute("aria-pressed"), "false");
              assert.strictEqual(yield* heard(item), announcements.cancelled("House"));
              assert.deepStrictEqual(readHidden(item.root, name), ["H1", "H3"]);
            }),
          );
        }),
    );

    it.effect("[Q-9] moving announces the position reached", () =>
      Effect.gen(function* movingAnnounces() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const sun = item.hotspot("H2");

            item.begin();
            press(sun, " ");
            assert.strictEqual(yield* heard(item), announcements.pickedUp("Sun"));

            press(sun, "ArrowDown");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 1", 1, 4));
            assert.isTrue(Object.hasOwn(item.position(1).dataset, "cursor"));

            press(sun, "ArrowDown");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 2", 2, 4));
            assert.isFalse(Object.hasOwn(item.position(1).dataset, "cursor"));

            press(sun, "ArrowUp");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 1", 1, 4));

            press(sun, "End");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 4", 4, 4));

            press(sun, "ArrowRight");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 1", 1, 4));

            press(sun, "Home");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 1", 1, 4));
            assert.deepStrictEqual(readHidden(item.root, name), []);

            press(sun, "Escape");
            assert.strictEqual(yield* heard(item), announcements.cancelled("Sun"));
          }),
        );
      }),
    );

    it.effect("[Q-9] moving onto a position that holds a hotspot says which one", () =>
      Effect.gen(function* movingOntoTaken() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item.hotspot("H2"), 1);

            const house = item.hotspot("H1");

            press(house, " ");
            press(house, "ArrowDown");
            assert.strictEqual(
              yield* heard(item),
              `${announcements.moved("Position 1", 1, 4)} Holds Sun.`,
            );

            press(house, "ArrowDown");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 2", 2, 4));
          }),
        );
      }),
    );

    it.effect("[Q-9] a taken position sends the earlier hotspot back, or swaps a moved one", () =>
      Effect.gen(function* takenPosition() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const sun = item.hotspot("H2");
            const house = item.hotspot("H1");
            const hill = item.hotspot("H3");

            item.begin();
            placeByKeys(sun, 1);
            placeByKeys(house, 2);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H1"]);

            placeByKeys(hill, 1);
            assert.deepStrictEqual(readHidden(item.root, name), ["H3", "H1"]);
            assert.deepStrictEqual(shown(item), ["Hill", "House", "Empty", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "2", H3: "1" });
            assert.isFalse(Object.hasOwn(sun.dataset, "position"));
            assert.isNull(item.badge("H2"));
            assert.strictEqual(
              yield* heard(item),
              `${announcements.placed("Hill", "Position 1")} ${announcements.returned("Sun")}`,
            );

            placeByKeys(sun, 2);
            assert.deepStrictEqual(readHidden(item.root, name), ["H3", "H2"]);
            assert.deepStrictEqual(shown(item), ["Hill", "Sun", "Empty", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H2: "2", H3: "1" });
            assert.isNull(item.badge("H1"));

            placeByKeys(sun, 1);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H3"]);
            assert.deepStrictEqual(shown(item), ["Sun", "Hill", "Empty", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H2: "1", H3: "2" });
            assert.strictEqual(
              yield* heard(item),
              `${announcements.placed("Sun", "Position 1")} Hill moved to Position 2.`,
            );

            placeByKeys(house, 4);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H3", "H1"]);
            assert.deepStrictEqual(shown(item), ["Sun", "Hill", "Empty", "House"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "4", H2: "1", H3: "2" });

            placeByKeys(house, 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H3", "H1"]);
            assert.deepStrictEqual(shown(item), ["Sun", "Hill", "House", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "3", H2: "1", H3: "2" });

            placeByKeys(house, 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H3", "H1"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "3", H2: "1", H3: "2" });
            assert.strictEqual(yield* heard(item), announcements.placed("House", "Position 3"));
          }),
        );
      }),
    );

    it.effect("[Q-9] a hotspot moved onto a taken position keeps focus where the user put it", () =>
      Effect.gen(function* focusStays() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const house = item.hotspot("H1");

            item.begin();
            placeByKeys(item.hotspot("H2"), 1);

            for (let tabs = 0; tabs < 12 && document.activeElement !== house; tabs += 1) {
              yield* Effect.promise(() => userEvent.tab());
            }

            assert.strictEqual(document.activeElement, house);

            const focused: EventTarget[] = [];
            const record = (event: FocusEvent) => {
              focused.push(event.target ?? document);
            };

            document.addEventListener("focusout", record);
            yield* Effect.promise(() => userEvent.keyboard(" "));
            yield* Effect.promise(() => userEvent.keyboard("{ArrowDown}"));
            yield* Effect.promise(() => userEvent.keyboard("{Enter}"));
            document.removeEventListener("focusout", record);

            assert.deepStrictEqual(readHidden(item.root, name), ["H1"]);
            assert.deepStrictEqual(focused, []);
            assert.strictEqual(document.activeElement, house);
            assert.strictEqual(house.getAttribute("aria-pressed"), "false");

            yield* Effect.promise(() => userEvent.keyboard(" "));
            assert.strictEqual(house.getAttribute("aria-pressed"), "true");
            yield* Effect.promise(() => userEvent.keyboard("{Escape}"));
            assert.strictEqual(house.getAttribute("aria-pressed"), "false");
          }),
        );
      }),
    );

    it.effect("[Q-9] the subset fixture offers three positions", () =>
      Effect.gen(function* subsetPositions() {
        const xml = yield* fileText(subsetFixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const house = item.hotspot("H1");

            assert.strictEqual(item.positions().length, 3);
            assert.strictEqual(item.root.dataset["maxChoices"], "3");
            item.begin();

            press(house, " ");
            press(house, "End");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 3", 3, 3));
            assert.isTrue(Object.hasOwn(item.position(3).dataset, "cursor"));

            press(house, "ArrowDown");
            assert.strictEqual(yield* heard(item), announcements.moved("Position 1", 1, 3));
            press(house, "Escape");

            placeByKeys(item.hotspot("H3"), 2);
            placeByKeys(item.hotspot("H4"), 1);
            placeByKeys(item.hotspot("H2"), 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["H4", "H3", "H2"]);
            assert.deepStrictEqual(shown(item), ["Anywhere else", "Area 3 of 4", "Sun"]);
            assert.strictEqual(item.badge("H4")?.getAttribute("style"), "left:50%;top:50%");
          }),
        );
      }),
    );

    it.effect("[Q-9] the posted form decodes to the order made", () =>
      Effect.gen(function* formDecodes() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item, redacted) =>
          Effect.sync(() => {
            const [posting, ...rest] = postings(redacted, instance);

            assert.strictEqual(rest.length, 0);

            if (posting === undefined) {
              throw new Error("The item has no posting for its response.");
            }

            item.begin();
            placeByKeys(item.hotspot("H4"), 1);
            placeByKeys(item.hotspot("H2"), 2);
            placeByKeys(item.hotspot("H3"), 4);

            const entries: readonly Entry[] = [...new FormData(item.form).entries()].flatMap(
              ([key, value]) => (value instanceof File ? [] : [[key, value] as const]),
            );

            assert.deepStrictEqual(entries, [
              [name, "H4"],
              [name, "H2"],
              [name, "H3"],
            ]);
            assert.deepStrictEqual(
              decode(entries, posting.binding, posting.options),
              Result.succeed(orderValue("H4", "H2", "H3")),
            );
          }),
        );
      }),
    );

    it.effect("[Q-9] a badge the runtime draws is the one the SSR draws for the same order", () =>
      Effect.gen(function* badgesMatchTheSsr() {
        const xml = yield* fileText(fixture);
        const { html } = yield* rendered(xml, {
          values: { RESPONSE: orderValue("H2", "H4", "H1", "H3") },
        });
        const ssr = document.createElement("template");

        ssr.innerHTML = html;

        yield* withItem(xml, {}, (item) =>
          Effect.sync(() => {
            item.begin();
            placeByKeys(item.hotspot("H2"), 1);
            placeByKeys(item.hotspot("H4"), 2);
            placeByKeys(item.hotspot("H1"), 3);
            placeByKeys(item.hotspot("H3"), 4);

            for (const identifier of allHotspots) {
              const written = need(
                ssr.content,
                `[data-slot="${hotspotSlot}"][data-identifier="${identifier}"] [data-slot="${badgeSlot}"]`,
              );

              assert.strictEqual(item.badge(identifier)?.outerHTML, written.outerHTML, identifier);
              assert.strictEqual(
                item.hotspot(identifier).dataset["position"],
                need(ssr.content, `[data-identifier="${identifier}"]`).dataset["position"],
                identifier,
              );
            }

            const slots = [
              ...ssr.content.querySelectorAll<HTMLElement>(`[data-slot="${positionSlot}"]`),
            ];

            assert.deepStrictEqual(
              shown(item),
              slots.map((slot) => slot.textContent),
            );
            assert.deepStrictEqual(
              item.positions().map((slot) => Object.hasOwn(slot.dataset, "empty")),
              slots.map((slot) => Object.hasOwn(slot.dataset, "empty")),
            );
            assert.deepStrictEqual(
              readHidden(item.root, name),
              [...ssr.content.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
                (input) => input.value,
              ),
            );
          }),
        );
      }),
    );

    it.effect(
      "[Q-9] Delete or Backspace on a position, or a click on it, returns its hotspot",
      () =>
        Effect.gen(function* returns() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              placeByKeys(item.hotspot("H2"), 1);
              placeByKeys(item.hotspot("H1"), 2);
              placeByKeys(item.hotspot("H3"), 3);
              assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H1", "H3"]);

              const event = press(item.position(1), "Delete");

              assert.isTrue(event.defaultPrevented);
              assert.deepStrictEqual(readHidden(item.root, name), ["H1", "H3"]);
              assert.deepStrictEqual(shown(item), ["Empty", "House", "Hill", "Empty"]);
              assert.isNull(item.badge("H2"));
              assert.deepStrictEqual(badges(item, allHotspots), { H1: "2", H3: "3" });
              assert.strictEqual(yield* heard(item), announcements.returned("Sun"));

              press(item.position(2), "Backspace");
              assert.deepStrictEqual(readHidden(item.root, name), ["H3"]);
              assert.strictEqual(yield* heard(item), announcements.returned("House"));

              item.position(3).click();
              assert.deepStrictEqual(readHidden(item.root, name), []);
              assert.deepStrictEqual(shown(item), ["Empty", "Empty", "Empty", "Empty"]);
              assert.deepStrictEqual(badges(item, allHotspots), {});
              assert.strictEqual(yield* heard(item), announcements.returned("Hill"));

              press(item.position(1), "Delete");
              assert.deepStrictEqual(readHidden(item.root, name), []);
            }),
          );
        }),
    );

    it.effect("[Q-9] Escape cancels and changes no hidden input", () =>
      Effect.gen(function* escapeCancels() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item.hotspot("H2"), 1);

            const house = item.hotspot("H1");

            press(house, " ");
            press(house, "ArrowDown");
            press(house, "ArrowDown");

            const event = press(house, "Escape");

            assert.isTrue(event.defaultPrevented);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
            assert.strictEqual(item.position(2).textContent, "Empty");
            assert.strictEqual(house.getAttribute("aria-pressed"), "false");
            assert.strictEqual(item.root.querySelectorAll("[data-cursor]").length, 0);
            assert.strictEqual(yield* heard(item), announcements.cancelled("House"));
          }),
        );
      }),
    );

    it.effect("[Q-9] a restored order is the starting state", () =>
      Effect.gen(function* restoredStart() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, { values: { RESPONSE: orderValue("H2", "H4") } }, (item) =>
          Effect.gen(function* drive() {
            const sunBadge = item.badge("H2");

            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H4"]);
            item.begin();
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H4"]);
            assert.deepStrictEqual(shown(item), ["Sun", "Boat", "Empty", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H2: "1", H4: "2" });
            assert.isNotNull(sunBadge);
            assert.strictEqual(item.badge("H2"), sunBadge);

            placeByKeys(item.hotspot("H1"), 2);
            assert.deepStrictEqual(readHidden(item.root, name), ["H2", "H1"]);
            assert.strictEqual(
              yield* heard(item),
              `${announcements.placed("House", "Position 2")} ${announcements.returned("Boat")}`,
            );
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "2", H2: "1" });

            press(item.position(1), "Delete");
            assert.deepStrictEqual(readHidden(item.root, name), ["H1"]);
            assert.deepStrictEqual(shown(item), ["Empty", "House", "Empty", "Empty"]);
            assert.deepStrictEqual(badges(item, allHotspots), { H1: "2" });
          }),
        );
      }),
    );

    it.effect("[Q-9] a finished item gets no input behaviour", () =>
      Effect.gen(function* finished() {
        const xml = yield* fileText(fixture);

        for (const mode of ["review", "solution"] as const) {
          yield* withItem(xml, { mode, values: { RESPONSE: orderValue("H2", "H4") } }, (item) =>
            Effect.gen(function* drive() {
              const before = item.root.cloneNode(true);

              item.begin();

              const sun = item.hotspot("H2");

              press(sun, " ");
              sun.click();
              item.position(1).click();
              yield* frames;

              assert.isTrue(item.root.isEqualNode(before), mode);
              assert.isFalse(sun.hasAttribute("aria-pressed"), mode);
              assert.isFalse(sun.hasAttribute("tabindex"), mode);
              assert.strictEqual(item.live.textContent, "", mode);
            }),
          );
        }
      }),
    );

    it.effect("[Q-9] a root with no entry name or none of its parts is upgraded quietly", () =>
      Effect.gen(function* bareRoots() {
        const container = document.createElement("div");

        container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="${rootSlot}"></div><div data-slot="${rootSlot}" data-entry-name="q.R"></div></div>`;
        document.body.append(container);

        const live = need(container, '[data-slot="item-live"]');
        const before = container.cloneNode(true);
        const focused: EventTarget[] = [];
        const record = (event: FocusEvent) => {
          focused.push(event.target ?? document);
        };

        document.addEventListener("focusin", record);

        const upgraded = upgrade(container);

        yield* frames;
        document.removeEventListener("focusin", record);

        assert.strictEqual(upgraded.controllers.length, 2);
        assert.deepStrictEqual(focused, []);
        assert.strictEqual(live.textContent, "");
        assert.isTrue(container.isEqualNode(before));

        upgraded.teardown();
        assert.isTrue(container.isEqualNode(before));
        container.remove();
      }),
    );

    it.effect(
      "[Q-9] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden inputs",
      () =>
        Effect.gen(function* quietUpgrade() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              yield* Effect.promise(() => userEvent.tab());

              const anchor = need(item.container, '[data-test="anchor"]');
              const focused: EventTarget[] = [];
              const record = (event: FocusEvent) => {
                focused.push(event.target ?? document);
              };

              assert.strictEqual(document.activeElement, anchor);
              document.addEventListener("focusin", record);

              const upgraded = item.begin();
              const watch = watched(item);

              yield* frames;
              document.removeEventListener("focusin", record);

              assert.strictEqual(document.activeElement, anchor);
              assert.deepStrictEqual(focused, []);
              assert.deepStrictEqual(watch.records(), []);
              assert.strictEqual(item.live.textContent, "");

              placeByKeys(item.hotspot("H2"), 1);
              yield* frames;
              assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
              assert.strictEqual(item.live.textContent, announcements.placed("Sun", "Position 1"));

              upgraded.teardown();

              const afterTeardown = watched(item);
              const house = item.hotspot("H1");

              press(house, " ");
              press(house, "ArrowDown");
              press(house, "Enter");
              house.click();
              item.position(2).click();
              press(item.position(1), "Delete");
              yield* frames;

              assert.deepStrictEqual(afterTeardown.records(), []);
              assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
              assert.strictEqual(item.live.textContent, announcements.placed("Sun", "Position 1"));

              for (const element of item.root.querySelectorAll<HTMLElement>(
                `[data-slot="${hotspotSlot}"], [data-slot="${positionSlot}"]`,
              )) {
                for (const attribute of ["aria-pressed", "data-cursor", "role", "tabindex"]) {
                  assert.isFalse(element.hasAttribute(attribute), attribute);
                }
              }

              afterTeardown.stop();
              watch.stop();
            }),
          );
        }),
    );

    it.effect("[Q-9] teardown gives the SSR's markup back, but for the hidden inputs", () =>
      Effect.gen(function* teardownRestores() {
        const xml = yield* fileText(fixture);

        for (const values of [{}, { RESPONSE: orderValue("H2", "H4") }]) {
          yield* withItem(xml, { values }, (item) =>
            Effect.sync(() => {
              const before = item.root.cloneNode(true);
              const upgraded = item.begin();

              placeByKeys(item.hotspot("H3"), 1);
              placeByKeys(item.hotspot("H1"), 3);
              press(item.position(3), "Delete");
              placeByKeys(item.hotspot("H4"), 4);
              upgraded.teardown();

              assert.deepStrictEqual(readHidden(item.root, name), ["H3", "H4"]);

              const after = item.root.cloneNode(true);

              for (const copy of [before, after]) {
                if (copy instanceof Element) {
                  for (const input of copy.querySelectorAll('input[type="hidden"]')) {
                    input.remove();
                  }
                }
              }

              assert.isTrue(after.isEqualNode(before));
            }),
          );
        }
      }),
    );

    it.effect("[Q-9] each position is at least 24 by 24 CSS pixels (WCAG 2.5.8)", () =>
      Effect.gen(function* targetSize() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* measure() {
              const assertSizes = (state: string) => {
                for (const target of item.positions()) {
                  const { height, width } = target.getBoundingClientRect();

                  assert.isAtLeast(width, 24, `${state}: width`);
                  assert.isAtLeast(height, 24, `${state}: height`);
                }
              };

              item.begin();
              assertSizes("empty");
              placeByKeys(item.hotspot("H1"), 1);
              assert.deepStrictEqual(readHidden(item.root, name), ["H1"]);
              assertSizes("placed");
              item.root.style.fontSize = "8px";
              assertSizes("placed, in an 8px font");
              yield* frames;
            }),
          ),
        );
      }),
    );

    it.effect("[Q-9] the upgraded interaction has no accessibility violation", () =>
      Effect.gen(function* noViolations() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* check() {
              item.begin();
              placeByKeys(item.hotspot("H2"), 1);

              const held = item.hotspot("H1");

              press(held, " ");
              press(held, "ArrowDown");
              assert.deepStrictEqual(readHidden(item.root, name), ["H2"]);
              assert.strictEqual(held.getAttribute("aria-pressed"), "true");

              const results = yield* Effect.promise(() =>
                axe.run(item.root, {
                  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
                }),
              );

              assert.deepStrictEqual(
                results.violations.map(({ id, nodes }) => [id, nodes.map(({ target }) => target)]),
                [],
              );
            }),
          ),
        );
      }),
    );
  });
});
