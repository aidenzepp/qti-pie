/**
 * Order's (Q-15) runtime controller in each engine's page: the select-then-place protocol over the
 * fixtures the core renders, by keyboard alone and by single pointer without dragging, a choice
 * placed on a taken position sending the taken one back or swapping with it, each step announced
 * through the item's live region with the position reached, the response as one hidden input per
 * placed choice in position order under the root's entry name, and its teardown.
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
import { controller } from "#plate/interactions/order.dom.ts";
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
 * The core's main fixture, relative to the package: four choices (`A` "Mix the batter", `B` "Heat
 * the oven", `C` "Bake the cake", `D` "Slice and serve"), no `min-choices`, so four positions.
 */
const fixture = "fixtures/ei/items/order.xml";

/**
 * The core's subset fixture: five choices and `max-choices` 3, so three positions.
 */
const subsetFixture = "fixtures/ei/items/order-subset.xml";

/**
 * The item instance every render here is made under, which scopes the entry name.
 */
const instance = "or1";

/**
 * The entry name the fixtures' hidden inputs post under in {@link instance}.
 */
const name = entryName(instance, "RESPONSE");

/**
 * The `data-slot` marker of the Order Root.
 */
const rootSlot = "order-interaction";

/**
 * The `data-slot` marker of a choice still to place, in the source list.
 */
const choiceSlot = `${rootSlot}-choice`;

/**
 * The `data-slot` marker of the source list.
 */
const choicesSlot = `${rootSlot}-choices`;

/**
 * The `data-slot` marker of a position.
 */
const positionSlot = `${rootSlot}-slot`;

/**
 * What the fixtures' choices say, by identifier.
 */
const words = {
  A: "Mix the batter",
  B: "Heat the oven",
  C: "Bake the cake",
  D: "Slice and serve",
} as const;

/**
 * Construct the ordered identifier value that lists some choices.
 *
 * @param identifiers The choices' identifiers, in order.
 * @returns The value.
 */
const orderedValue = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "ordered",
  values: identifiers.map((value) => ({ baseType: "identifier" as const, value })),
});

/**
 * What a test passes `render` beyond the item: the mode the author chooses, whether the author
 * disabled every control, and the values to restore.
 */
interface Showing {
  readonly disabled?: boolean;
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
  readonly form: HTMLFormElement;
  readonly live: HTMLElement;
  readonly root: HTMLElement;
  /**
   * Find a position by its number from 1.
   */
  readonly slot: (position: number) => HTMLElement;
  /**
   * Find the source list's own item of a choice, the one the SSR wrote there.
   */
  readonly source: (identifier: string) => HTMLElement;
  /**
   * Find the element the select-then-place driver acts on for a choice: its button, in the source
   * list or in a position.
   */
  readonly token: (identifier: string) => HTMLElement;
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
    const path = "items/order.xml";
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

  return {
    begin: () => {
      const upgraded = upgrade(container);

      upgrades.push(upgraded);

      return upgraded;
    },
    container,
    form,
    live: need(container, '[data-slot="item-live"]'),
    root,
    slot: (position) =>
      need(root, `[data-slot="${positionSlot}"][data-position="${String(position)}"]`),
    source: (identifier) =>
      need(root, `[data-slot="${choiceSlot}"][data-identifier="${identifier}"]`),
    token: (identifier) => need(root, `button[data-identifier="${identifier}"]`),
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
 * Put a choice in a position by keys: Space picks it up, the down arrow moves to the position, and
 * Enter places it. The choice may be in the source list or in a position already.
 *
 * @param item The mounted item.
 * @param identifier The choice's identifier.
 * @param position The position's number from 1.
 */
const placeByKeys = (item: Mounted, identifier: string, position: number): void => {
  press(item.token(identifier), " ");

  for (let step = 0; step < position; step += 1) {
    press(item.token(identifier), "ArrowDown");
  }

  press(item.token(identifier), "Enter");
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
 * Read the text the choice in a position shows.
 *
 * @param slot The position.
 * @returns The text, or `undefined` when the position holds no choice.
 */
const shownIn = (slot: HTMLElement): string | undefined =>
  slot.querySelector("button")?.textContent.trim() ?? undefined;

/**
 * Read the choices the source list shows now: the text of each item it holds.
 *
 * @param item The mounted item.
 * @returns The texts, in the list's order.
 */
const inSource = (item: Mounted): readonly string[] =>
  [
    ...item.root.querySelectorAll<HTMLElement>(
      `[data-slot="${choicesSlot}"] [data-slot="${choiceSlot}"]`,
    ),
  ].map((element) => element.textContent.trim());

/**
 * Copy a mounted item's container without its hidden inputs, which an upgrade leaves behind, and
 * without the text its live region last announced, to compare with `isEqualNode`, which ignores
 * the order of attributes.
 *
 * @param item The mounted item.
 * @returns The copy, with every `input[type=hidden]` taken out and the live region emptied.
 */
const snapshot = (item: Mounted): HTMLElement => {
  const copy = item.container.cloneNode(true);

  if (!(copy instanceof HTMLElement)) {
    throw new TypeError("The container did not clone as an element.");
  }

  for (const input of copy.querySelectorAll('input[type="hidden"]')) {
    input.remove();
  }

  for (const live of copy.querySelectorAll('[data-slot="item-live"]')) {
    live.textContent = "";
  }

  return copy;
};

/**
 * Check that a mounted item is, but for its hidden inputs and its live region's text, the DOM a
 * snapshot recorded.
 *
 * @param item The mounted item.
 * @param before The snapshot taken before the upgrade.
 */
const assertAsBefore = (item: Mounted, before: HTMLElement): void => {
  const now = snapshot(item);

  assert.isTrue(now.isEqualNode(before), now.innerHTML);
};

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

describe(server.browser, () => {
  describe("the Order controller", () => {
    it.effect("[Q-15] the Order controller is implemented and leaves no stub mark", () =>
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
      "[Q-15] keyboard only: pick a choice, move to position 2, Enter places it; the hidden inputs follow position order",
      () =>
        Effect.gen(function* keyboardOnly() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              const batter = item.token("A");

              for (let tabs = 0; tabs < 8 && document.activeElement !== batter; tabs += 1) {
                yield* Effect.promise(() => userEvent.tab());
              }

              assert.strictEqual(document.activeElement, batter);

              yield* Effect.promise(() => userEvent.keyboard(" "));
              assert.strictEqual(batter.getAttribute("aria-pressed"), "true");
              yield* Effect.promise(() => userEvent.keyboard("{ArrowDown}{ArrowDown}"));
              assert.isTrue(Object.hasOwn(item.slot(2).dataset, "cursor"));
              yield* Effect.promise(() => userEvent.keyboard("{Enter}"));

              assert.strictEqual(shownIn(item.slot(2)), words.A);
              assert.isUndefined(shownIn(item.slot(1)));
              assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
              assert.strictEqual(yield* heard(item), announcements.placed(words.A, "Position 2"));

              placeByKeys(item, "B", 1);
              assert.strictEqual(shownIn(item.slot(1)), words.B);
              assert.strictEqual(shownIn(item.slot(2)), words.A);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);
              assert.deepStrictEqual(inSource(item), [words.C, words.D]);
            }),
          );
        }),
    );

    it.effect(
      "[Q-15] a placed choice keeps its focus exactly where the engine can move a node without removing it",
      () =>
        Effect.gen(function* focusAfterPlacing() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              const batter = item.token("A");

              for (let tabs = 0; tabs < 8 && document.activeElement !== batter; tabs += 1) {
                yield* Effect.promise(() => userEvent.tab());
              }

              assert.strictEqual(document.activeElement, batter);
              yield* Effect.promise(() => userEvent.keyboard(" {ArrowDown}{Enter}"));
              yield* frames;

              assert.strictEqual(shownIn(item.slot(1)), words.A);
              assert.strictEqual(
                document.activeElement === batter,
                "moveBefore" in Element.prototype,
              );
            }),
          );
        }),
    );

    it.effect("[Q-15] moving announces the position reached", () =>
      Effect.gen(function* movingAnnounces() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();

            const batter = item.token("A");

            press(batter, " ");
            press(batter, "ArrowDown");
            press(batter, "ArrowDown");
            assert.strictEqual(yield* heard(item), "Position 2 of 4.");

            press(batter, "ArrowUp");
            assert.strictEqual(yield* heard(item), "Position 1 of 4.");

            press(batter, "End");
            assert.strictEqual(yield* heard(item), "Position 4 of 4.");

            press(batter, "Home");
            assert.strictEqual(yield* heard(item), "Position 1 of 4.");

            press(batter, "ArrowUp");
            assert.strictEqual(yield* heard(item), "Position 4 of 4.");
            assert.deepStrictEqual(readHidden(item.root, name), []);
          }),
        );
      }),
    );

    it.effect("[Q-15] single pointer: click a choice, click a position (WCAG 2.5.7)", () =>
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
            item.token("C").click();
            assert.strictEqual(item.token("C").getAttribute("aria-pressed"), "true");
            item.slot(3).click();

            for (const type of ["pointerdown", "pointermove", "pointerup"]) {
              document.removeEventListener(type, record, true);
            }

            assert.deepStrictEqual(pointers, []);
            assert.strictEqual(shownIn(item.slot(3)), words.C);
            assert.deepStrictEqual(readHidden(item.root, name), ["C"]);
            assert.strictEqual(yield* heard(item), announcements.placed(words.C, "Position 3"));
          }),
        );
      }),
    );

    it.effect(
      "[Q-15] a choice from the source placed on a taken position sends the taken one back",
      () =>
        Effect.gen(function* sendsBack() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              placeByKeys(item, "B", 1);
              assert.deepStrictEqual(readHidden(item.root, name), ["B"]);
              assert.deepStrictEqual(inSource(item), [words.A, words.C, words.D]);

              placeByKeys(item, "A", 1);

              assert.strictEqual(shownIn(item.slot(1)), words.A);
              assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
              assert.strictEqual(item.root.querySelectorAll('input[type="hidden"]').length, 1);
              assert.deepStrictEqual(inSource(item), [words.B, words.C, words.D]);
              assert.strictEqual(
                yield* heard(item),
                `${announcements.placed(words.A, "Position 1")} ${announcements.returned(words.B)}`,
              );
            }),
          );
        }),
    );

    it.effect("[Q-15] a choice moved from one position to a taken one swaps the two", () =>
      Effect.gen(function* swaps() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item, "A", 1);
            placeByKeys(item, "B", 2);
            placeByKeys(item, "C", 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["A", "B", "C"]);

            placeByKeys(item, "A", 3);

            assert.strictEqual(shownIn(item.slot(1)), words.C);
            assert.strictEqual(shownIn(item.slot(2)), words.B);
            assert.strictEqual(shownIn(item.slot(3)), words.A);
            assert.deepStrictEqual(readHidden(item.root, name), ["C", "B", "A"]);
            assert.deepStrictEqual(inSource(item), [words.D]);
            assert.strictEqual(
              yield* heard(item),
              `${announcements.placed(words.A, "Position 3")} Swapped with ${words.C}, which is now in Position 1.`,
            );
          }),
        );
      }),
    );

    it.effect(
      "[Q-15] a choice moved to an empty position leaves its own empty, and one placed where it is changes nothing",
      () =>
        Effect.gen(function* movesAndStays() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              item.begin();
              placeByKeys(item, "A", 1);
              placeByKeys(item, "B", 2);
              placeByKeys(item, "A", 4);

              assert.isUndefined(shownIn(item.slot(1)));
              assert.strictEqual(shownIn(item.slot(2)), words.B);
              assert.strictEqual(shownIn(item.slot(4)), words.A);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);
              assert.deepStrictEqual(inSource(item), [words.C, words.D]);
              assert.strictEqual(yield* heard(item), announcements.placed(words.A, "Position 4"));

              placeByKeys(item, "B", 2);

              assert.strictEqual(shownIn(item.slot(2)), words.B);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);
              assert.strictEqual(item.root.querySelectorAll('input[type="hidden"]').length, 2);
              assert.deepStrictEqual(inSource(item), [words.C, words.D]);
            }),
          );
        }),
    );

    it.effect("[Q-15] the subset fixture offers three positions", () =>
      Effect.gen(function* subset() {
        const xml = yield* fileText(subsetFixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const slots = item.root.querySelectorAll(`[data-slot="${positionSlot}"]`);

            assert.strictEqual(slots.length, 3);
            assert.strictEqual(item.root.dataset["maxChoices"], "3");
            item.begin();
            placeByKeys(item, "A", 1);
            placeByKeys(item, "B", 2);
            placeByKeys(item, "D", 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["A", "B", "D"]);

            const umbrella = item.token("E");

            press(umbrella, " ");

            for (let step = 0; step < 4; step += 1) {
              press(umbrella, "ArrowDown");
            }

            assert.strictEqual(yield* heard(item), "Position 1 of 3.");

            press(umbrella, "ArrowDown");
            assert.strictEqual(yield* heard(item), "Position 2 of 3.");
            press(umbrella, "Enter");

            assert.deepStrictEqual(readHidden(item.root, name), ["A", "E", "D"]);
            assert.strictEqual(item.root.querySelectorAll('input[type="hidden"]').length, 3);
            assert.strictEqual(shownIn(item.slot(2)), "Umbrella");
            assert.include(inSource(item), "Toothbrush");
            assert.include(inSource(item), "Passport");
            assert.notInclude(inSource(item), "Umbrella");
          }),
        );
      }),
    );

    it.effect("[Q-15] returning a placed choice removes it from the order", () =>
      Effect.gen(function* returns() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item, "A", 1);
            placeByKeys(item, "B", 2);
            placeByKeys(item, "C", 3);
            assert.deepStrictEqual(readHidden(item.root, name), ["A", "B", "C"]);

            const event = press(item.token("B"), "Delete");

            assert.isTrue(event.defaultPrevented);
            assert.isUndefined(shownIn(item.slot(2)));
            assert.deepStrictEqual(readHidden(item.root, name), ["A", "C"]);
            assert.include(inSource(item), words.B);
            assert.strictEqual(yield* heard(item), announcements.returned(words.B));

            press(item.slot(3), "Backspace");
            assert.isUndefined(shownIn(item.slot(3)));
            assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
            assert.include(inSource(item), words.C);
            assert.strictEqual(yield* heard(item), announcements.returned(words.C));
          }),
        );
      }),
    );

    it.effect("[Q-15] a click on a placed choice returns it, with no drag", () =>
      Effect.gen(function* clickReturns() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            item.token("D").click();
            item.slot(2).click();
            assert.deepStrictEqual(readHidden(item.root, name), ["D"]);

            item.token("D").click();

            assert.isUndefined(shownIn(item.slot(2)));
            assert.deepStrictEqual(readHidden(item.root, name), []);
            assert.include(inSource(item), words.D);
            assert.strictEqual(yield* heard(item), announcements.returned(words.D));
          }),
        );
      }),
    );

    it.effect("[Q-15] Escape cancels and changes no hidden input", () =>
      Effect.gen(function* escapeCancels() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item, "A", 1);

            const oven = item.token("B");

            press(oven, " ");
            press(oven, "ArrowDown");
            press(oven, "ArrowDown");

            const event = press(oven, "Escape");

            assert.isTrue(event.defaultPrevented);
            assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
            assert.strictEqual(oven.getAttribute("aria-pressed"), "false");
            assert.isUndefined(shownIn(item.slot(2)));
            assert.deepStrictEqual(inSource(item), [words.B, words.C, words.D]);
            assert.strictEqual(yield* heard(item), announcements.cancelled(words.B));
          }),
        );
      }),
    );

    it.effect("[Q-15] the posted form decodes to the order made", () =>
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
            placeByKeys(item, "A", 3);
            placeByKeys(item, "D", 1);
            placeByKeys(item, "C", 2);

            const entries: readonly Entry[] = [...new FormData(item.form).entries()].flatMap(
              ([key, value]) => (value instanceof File ? [] : [[key, value] as const]),
            );

            assert.deepStrictEqual(entries, [
              [name, "D"],
              [name, "C"],
              [name, "A"],
            ]);
            assert.deepStrictEqual(
              decode(entries, posting.binding, posting.options),
              Result.succeed(orderedValue("D", "C", "A")),
            );
          }),
        );
      }),
    );

    it.effect(
      "[Q-15] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden inputs",
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
              const before = snapshot(item);

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

              placeByKeys(item, "A", 2);
              yield* frames;
              assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
              assert.strictEqual(
                item.live.textContent,
                announcements.placed(words.A, "Position 2"),
              );

              upgraded.teardown();

              const afterTeardown = watched(item);

              item.source("B").click();
              press(item.source("B"), " ");
              press(item.source("B"), "Enter");
              item.slot(3).click();
              press(item.slot(2), "Delete");
              yield* frames;

              assert.deepStrictEqual(afterTeardown.records(), []);
              assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
              assert.strictEqual(
                item.live.textContent,
                announcements.placed(words.A, "Position 2"),
              );
              assertAsBefore(item, before);

              for (const element of item.root.querySelectorAll<HTMLElement>(
                `[data-slot="${choiceSlot}"], [data-slot="${positionSlot}"]`,
              )) {
                assert.isFalse(element.hasAttribute("aria-pressed"), element.outerHTML);
                assert.isFalse(element.hasAttribute("aria-disabled"), element.outerHTML);
                assert.isFalse(Object.hasOwn(element.dataset, "cursor"), element.outerHTML);
                assert.isFalse(element.hasAttribute("tabindex"), element.outerHTML);
                assert.isFalse(element.hasAttribute("role"), element.outerHTML);
              }

              watch.stop();
              afterTeardown.stop();
            }),
          );
        }),
    );

    it.effect("[Q-15] a finished item gets no input behaviour", () =>
      Effect.gen(function* finished() {
        const xml = yield* fileText(fixture);
        const values = { RESPONSE: orderedValue("B", "A") };
        const showings: readonly (readonly [string, Showing])[] = [
          ["review", { mode: "review", values }],
          ["solution", { mode: "solution", values }],
          ["disabled", { disabled: true, values }],
        ];

        for (const [label, showing] of showings) {
          yield* withItem(xml, showing, (item) =>
            Effect.gen(function* drive() {
              const before = item.root.outerHTML;
              const watch = watched(item);

              item.begin();

              const choice = item.source("C");

              press(choice, " ");
              press(choice, "ArrowDown");
              press(choice, "Enter");
              choice.click();
              item.slot(3).click();
              press(item.slot(1), "Delete");
              yield* frames;

              assert.deepStrictEqual(watch.records(), [], label);
              assert.strictEqual(item.live.textContent, "", label);
              assert.strictEqual(item.root.outerHTML, before, label);
              assert.strictEqual(item.slot(1).textContent.trim(), words.B, label);
              watch.stop();
            }),
          );
        }
      }),
    );

    it.effect(
      "[Q-15] a restored order shows in its positions, and a restored choice can swap",
      () =>
        Effect.gen(function* restored() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, { values: { RESPONSE: orderedValue("B", "A") } }, (item) =>
            Effect.gen(function* drive() {
              assert.strictEqual(item.slot(1).textContent.trim(), words.B);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);

              const before = snapshot(item);
              const upgraded = item.begin();

              assert.strictEqual(shownIn(item.slot(1)), words.B);
              assert.strictEqual(shownIn(item.slot(2)), words.A);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);
              assert.deepStrictEqual(inSource(item), [words.C, words.D]);

              placeByKeys(item, "B", 2);

              assert.strictEqual(shownIn(item.slot(1)), words.A);
              assert.strictEqual(shownIn(item.slot(2)), words.B);
              assert.deepStrictEqual(readHidden(item.root, name), ["A", "B"]);
              assert.strictEqual(
                yield* heard(item),
                `${announcements.placed(words.B, "Position 2")} Swapped with ${words.A}, which is now in Position 1.`,
              );

              press(item.token("A"), "Delete");
              assert.deepStrictEqual(readHidden(item.root, name), ["B"]);
              assert.deepStrictEqual(inSource(item), [words.C, words.D, words.A]);

              upgraded.teardown();
              assertAsBefore(item, before);
            }),
          );
        }),
    );

    it.effect(
      "[Q-15] a second upgrade after teardown starts from the hidden inputs, so the positions show the response again",
      () =>
        Effect.gen(function* upgradedAgain() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const before = snapshot(item);
              const first = item.begin();

              placeByKeys(item, "A", 2);
              placeByKeys(item, "B", 1);
              first.teardown();
              assertAsBefore(item, before);
              assert.deepStrictEqual(readHidden(item.root, name), ["B", "A"]);

              const second = item.begin();

              assert.deepStrictEqual(
                second.controllers.map(({ root }) => root),
                [item.root],
              );
              assert.strictEqual(shownIn(item.slot(1)), words.B);
              assert.strictEqual(shownIn(item.slot(2)), words.A);
              assert.deepStrictEqual(inSource(item), [words.C, words.D]);

              press(item.token("B"), "Delete");
              assert.deepStrictEqual(readHidden(item.root, name), ["A"]);
              assert.strictEqual(yield* heard(item), announcements.returned(words.B));
            }),
          );
        }),
    );

    it.effect("[Q-15] a root without its parts, or its entry name, gets nothing attached", () =>
      Effect.gen(function* bareRoots() {
        const container = document.createElement("div");

        container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="${rootSlot}" data-entry-name="r"></div><div data-slot="${rootSlot}" data-entry-name="s"><ul data-slot="${choicesSlot}"></ul></div><div data-slot="${rootSlot}"><ul data-slot="${choicesSlot}"><li data-slot="${choiceSlot}" data-identifier="A">a</li></ul><ol data-slot="${rootSlot}-ordered"><li data-slot="${positionSlot}" data-position="1"></li></ol></div></div>`;
        document.body.append(container);

        const before = container.innerHTML;
        const live = need(container, '[data-slot="item-live"]');
        const focused: EventTarget[] = [];
        const record = (event: FocusEvent) => {
          focused.push(event.target ?? document);
        };
        const active = document.activeElement;

        document.addEventListener("focusin", record);

        const upgraded = upgrade(container);

        yield* frames;
        document.removeEventListener("focusin", record);

        assert.strictEqual(upgraded.controllers.length, 3);
        assert.strictEqual(container.innerHTML, before);
        assert.strictEqual(live.textContent, "");
        assert.strictEqual(document.activeElement, active);
        assert.deepStrictEqual(focused, []);

        upgraded.teardown();
        assert.strictEqual(container.innerHTML, before);
        container.remove();
      }),
    );

    it.effect(
      "[Q-15] each choice and each position is at least 24 by 24 CSS pixels (WCAG 2.5.8)",
      () =>
        Effect.gen(function* targetSize() {
          const xml = yield* fileText(fixture);

          yield* withSheet(
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                const assertSizes = (state: string) => {
                  const targets = [
                    ...item.root.querySelectorAll<HTMLElement>(
                      `button, [data-slot="${positionSlot}"]`,
                    ),
                  ];

                  assert.strictEqual(targets.length, 8, state);

                  for (const target of targets) {
                    const { height, width } = target.getBoundingClientRect();

                    assert.isAtLeast(width, 24, `${state}: ${target.outerHTML} width`);
                    assert.isAtLeast(height, 24, `${state}: ${target.outerHTML} height`);
                  }
                };

                item.begin();
                assertSizes("source");

                placeByKeys(item, "A", 1);
                assertSizes("one placed");

                press(item.token("B"), " ");
                press(item.token("B"), "ArrowDown");
                assertSizes("held, cursor on a position");

                item.root.style.fontSize = "8px";
                assertSizes("held, in an 8px font");
                yield* frames;
              }),
            ),
          );
        }),
    );

    it.effect(
      "[Q-15] the upgraded item has no axe violation of WCAG 2.2 A or AA, and the positions stay an ordered list",
      () =>
        Effect.gen(function* axeClean() {
          const xml = yield* fileText(fixture);

          yield* withSheet(
            withItem(xml, {}, (item) =>
              Effect.gen(function* drive() {
                const rules = {
                  runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
                };

                item.begin();

                const before = yield* Effect.promise(() => axe.run(item.container, rules));

                placeByKeys(item, "A", 1);
                press(item.token("B"), " ");
                press(item.token("B"), "ArrowDown");

                const during = yield* Effect.promise(() => axe.run(item.container, rules));
                const ordered = need(item.root, `[data-slot="${rootSlot}-ordered"]`);

                assert.strictEqual(ordered.tagName, "OL");
                assert.deepStrictEqual(
                  [...ordered.children].map((child) => child.tagName),
                  ["LI", "LI", "LI", "LI"],
                );
                assert.deepStrictEqual(
                  before.violations.map(({ id }) => id),
                  [],
                );
                assert.deepStrictEqual(
                  during.violations.map(({ id }) => id),
                  [],
                );
              }),
            ),
          );
        }),
    );
  });
});
