/**
 * Gap Match's (Q-6) runtime controller in each engine's page: the select-then-place protocol over
 * the fixture the core renders, by keyboard alone and by single pointer without dragging, its
 * announcements through the item's live region, its response as hidden inputs under the root's
 * entry name, and its teardown.
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
import { controller } from "#plate/interactions/gap-match.dom.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import type { Redacted, RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import type { Upgraded } from "#plate/runtime/contract.dom.ts";
import { readHidden } from "#plate/runtime/wire.dom.ts";
import { announcements } from "#plate/runtime/select-place.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's main fixture, relative to the package: three gap texts (tulips `A` with `match-max`
 * 1, bloom `B` and wilt `C` with `match-max` 2) and two gaps, `G1` and `G2`.
 */
const fixture = "fixtures/m3d/items/gap-match.xml";

/**
 * The item instance every render here is made under, which scopes the entry name.
 */
const instance = "gm1";

/**
 * The entry name the fixture's hidden inputs post under in {@link instance}.
 */
const name = entryName(instance, "RESPONSE");

/**
 * The `data-slot` marker of the Gap Match Root.
 */
const rootSlot = "gap-match-interaction";

/**
 * The `data-slot` marker of a placed choice shown inside its gap.
 */
const gapChoiceSlot = "gap-match-interaction-gap-choice";

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
  /**
   * Find a gap text of the word bank by its identifier.
   */
  readonly choice: (identifier: string) => HTMLElement;
  readonly container: HTMLElement;
  readonly form: HTMLFormElement;
  /**
   * Find a gap of the sentence by its identifier.
   */
  readonly gap: (identifier: string) => HTMLElement;
  readonly live: HTMLElement;
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
 * @returns The item's HTML and its postings.
 */
const rendered = (xml: string, showing: Showing = {}) =>
  Effect.gen(function* renderItem() {
    const path = "items/gap-match.xml";
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
    choice: (identifier) =>
      need(root, `[data-slot="${rootSlot}-choice"][data-identifier="${identifier}"]`),
    container,
    form,
    gap: (identifier) => need(root, `[data-slot="${rootSlot}-gap"][data-gap="${identifier}"]`),
    live: need(container, '[data-slot="item-live"]'),
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
 * Place a gap text in a gap by keys: Space picks it up, the arrows move to the gap, Enter places.
 *
 * @param token The gap text.
 * @param position The gap's place among the gaps, from 1.
 */
const placeByKeys = (token: HTMLElement, position: number): void => {
  press(token, " ");

  for (let step = 0; step < position; step += 1) {
    press(token, "ArrowRight");
  }

  press(token, "Enter");
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
 * Read the text a placed choice shows inside its gap.
 *
 * @param gap The gap.
 * @returns The text, or `undefined` when the gap shows no placed choice.
 */
const shownIn = (gap: HTMLElement): string | undefined =>
  gap.querySelector(`[data-slot="${gapChoiceSlot}"]`)?.textContent ?? undefined;

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
  describe("the Gap Match controller", () => {
    it.effect("[Q-6] the Gap Match controller is implemented and leaves no stub mark", () =>
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
      "[Q-6] keyboard only: Tab to a gap text, Space, an arrow, Enter places it in the gap and writes its hidden input",
      () =>
        Effect.gen(function* keyboardOnly() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const tulips = item.choice("A");

              item.begin();

              for (let tabs = 0; tabs < 8 && document.activeElement !== tulips; tabs += 1) {
                yield* Effect.promise(() => userEvent.tab());
              }

              assert.strictEqual(document.activeElement, tulips);

              yield* Effect.promise(() => userEvent.keyboard(" "));
              assert.strictEqual(tulips.getAttribute("aria-pressed"), "true");
              yield* Effect.promise(() => userEvent.keyboard("{ArrowRight}"));
              assert.isTrue(Object.hasOwn(item.gap("G1").dataset, "cursor"));
              yield* Effect.promise(() => userEvent.keyboard("{Enter}"));

              assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
              assert.strictEqual(shownIn(item.gap("G1")), "tulips");
              assert.strictEqual(document.activeElement, tulips);
              assert.strictEqual(yield* heard(item), announcements.placed("tulips", "Gap 1"));
            }),
          );
        }),
    );

    it.effect(
      "[Q-6] single pointer: click a gap text, click a gap; no drag is needed (WCAG 2.5.7)",
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
              item.choice("A").click();
              assert.strictEqual(item.choice("A").getAttribute("aria-pressed"), "true");
              item.gap("G1").click();

              for (const type of ["pointerdown", "pointermove", "pointerup"]) {
                document.removeEventListener(type, record, true);
              }

              assert.deepStrictEqual(pointers, []);
              assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
              assert.strictEqual(shownIn(item.gap("G1")), "tulips");
              assert.strictEqual(yield* heard(item), announcements.placed("tulips", "Gap 1"));
            }),
          );
        }),
    );

    it.effect("[Q-6] a gap already holding a choice is full", () =>
      Effect.gen(function* gapIsFull() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item.choice("A"), 1);

            const bloom = item.choice("B");

            press(bloom, " ");
            press(bloom, "ArrowRight");
            press(bloom, "Enter");

            assert.strictEqual(yield* heard(item), announcements.full("Gap 1"));
            assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
            assert.strictEqual(shownIn(item.gap("G1")), "tulips");
            assert.strictEqual(bloom.getAttribute("aria-pressed"), "true");
          }),
        );
      }),
    );

    it.effect("[Q-6] a gap text at its match-max cannot be picked up again", () =>
      Effect.gen(function* atMatchMax() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const tulips = item.choice("A");
            const bloom = item.choice("B");

            item.begin();
            placeByKeys(tulips, 1);
            placeByKeys(bloom, 2);
            assert.strictEqual(tulips.getAttribute("aria-disabled"), "true");
            assert.isFalse(bloom.hasAttribute("aria-disabled"));
            assert.strictEqual(yield* heard(item), announcements.placed("bloom", "Gap 2"));

            const watch = watched(item);

            press(tulips, " ");
            press(tulips, "Enter");
            tulips.click();
            yield* frames;

            assert.deepStrictEqual(watch.records(), []);
            assert.strictEqual(tulips.getAttribute("aria-pressed"), "false");
            assert.strictEqual(item.live.textContent, announcements.placed("bloom", "Gap 2"));
            watch.stop();
          }),
        );
      }),
    );

    it.effect(
      "[Q-6] Delete on a placed text returns it: its hidden input goes and the gap is empty",
      () =>
        Effect.gen(function* deleteReturns() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const tulips = item.choice("A");

              item.begin();
              placeByKeys(tulips, 1);
              placeByKeys(item.choice("B"), 2);
              assert.deepStrictEqual(readHidden(item.root, name), ["A G1", "B G2"]);

              const placed = need(item.gap("G1"), `[data-slot="${gapChoiceSlot}"]`);
              const event = press(placed, "Delete");

              assert.isTrue(event.defaultPrevented);
              assert.deepStrictEqual(readHidden(item.root, name), ["B G2"]);
              assert.isUndefined(shownIn(item.gap("G1")));
              assert.strictEqual(shownIn(item.gap("G2")), "bloom");
              assert.isFalse(tulips.hasAttribute("aria-disabled"));
              assert.strictEqual(yield* heard(item), announcements.returned("tulips"));

              press(item.gap("G2"), "Backspace");
              assert.deepStrictEqual(readHidden(item.root, name), []);
              assert.isUndefined(shownIn(item.gap("G2")));
            }),
          );
        }),
    );

    it.effect("[Q-6] Escape cancels and changes no hidden input", () =>
      Effect.gen(function* escapeCancels() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();
            placeByKeys(item.choice("A"), 1);

            const bloom = item.choice("B");

            press(bloom, " ");
            press(bloom, "ArrowRight");
            press(bloom, "ArrowRight");

            const event = press(bloom, "Escape");

            assert.isTrue(event.defaultPrevented);
            assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
            assert.isUndefined(shownIn(item.gap("G2")));
            assert.strictEqual(bloom.getAttribute("aria-pressed"), "false");
            assert.strictEqual(item.root.querySelectorAll("[data-cursor]").length, 0);
            assert.strictEqual(yield* heard(item), announcements.cancelled("bloom"));
          }),
        );
      }),
    );

    it.effect("[Q-6] a restored response is the starting state", () =>
      Effect.gen(function* restoredStart() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, { values: { RESPONSE: pairValue(["A", "G1"]) } }, (item) =>
          Effect.gen(function* drive() {
            const tulips = item.choice("A");
            const bloom = item.choice("B");

            assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
            item.begin();
            assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
            assert.strictEqual(shownIn(item.gap("G1")), "tulips");
            assert.strictEqual(tulips.getAttribute("aria-disabled"), "true");

            press(bloom, " ");
            press(bloom, "ArrowRight");
            press(bloom, "Enter");
            assert.strictEqual(yield* heard(item), announcements.full("Gap 1"));
            assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
            press(bloom, "Escape");

            press(item.gap("G1"), "Delete");
            assert.deepStrictEqual(readHidden(item.root, name), []);
            assert.isUndefined(shownIn(item.gap("G1")));
            assert.isFalse(tulips.hasAttribute("aria-disabled"));
            assert.strictEqual(yield* heard(item), announcements.returned("tulips"));
          }),
        );
      }),
    );

    it.effect("[Q-6] the posted form decodes to the placed pairs", () =>
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
            placeByKeys(item.choice("A"), 1);
            placeByKeys(item.choice("C"), 2);

            const entries: readonly Entry[] = [...new FormData(item.form).entries()].flatMap(
              ([key, value]) => (value instanceof File ? [] : [[key, value] as const]),
            );

            assert.deepStrictEqual(entries, [
              [name, "A G1"],
              [name, "C G2"],
            ]);
            assert.deepStrictEqual(
              decode(entries, posting.binding, posting.options),
              Result.succeed(pairValue(["A", "G1"], ["C", "G2"])),
            );
          }),
        );
      }),
    );

    it.effect("[Q-6] each gap text and each gap is at least 24 by 24 CSS pixels (WCAG 2.5.8)", () =>
      Effect.gen(function* targetSize() {
        const xml = yield* fileText(fixture);

        yield* withSheet(
          withItem(xml, {}, (item) =>
            Effect.gen(function* measure() {
              const targets = [
                ...item.root.querySelectorAll<HTMLElement>(
                  `[data-slot="${rootSlot}-choice"], [data-slot="${rootSlot}-gap"]`,
                ),
              ];

              const assertSizes = (state: string) => {
                assert.strictEqual(targets.length, 5, state);

                for (const target of targets) {
                  const { height, width } = target.getBoundingClientRect();

                  assert.isAtLeast(width, 24, `${state}: ${target.dataset["slot"]} width`);
                  assert.isAtLeast(height, 24, `${state}: ${target.dataset["slot"]} height`);
                }
              };

              item.begin();
              assertSizes("empty");

              const tulips = item.choice("A");

              press(tulips, " ");
              press(tulips, "ArrowRight");
              assertSizes("held, cursor on the first gap");

              press(tulips, "Enter");
              assertSizes("placed");
              assert.strictEqual(shownIn(item.gap("G1")), "tulips");

              item.root.style.fontSize = "8px";
              assertSizes("placed, in an 8px font");
              press(item.choice("B"), " ");
              press(item.choice("B"), "ArrowRight");
              press(item.choice("B"), "ArrowRight");
              assertSizes("held, in an 8px font");
              yield* frames;
            }),
          ),
        );
      }),
    );

    it.effect(
      "[Q-6] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden inputs",
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

              placeByKeys(item.choice("A"), 1);
              yield* frames;
              assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
              assert.strictEqual(item.live.textContent, announcements.placed("tulips", "Gap 1"));

              upgraded.teardown();

              const afterTeardown = watched(item);
              const bloom = item.choice("B");

              press(bloom, " ");
              press(bloom, "ArrowRight");
              press(bloom, "Enter");
              bloom.click();
              item.gap("G2").click();
              yield* frames;

              assert.deepStrictEqual(afterTeardown.records(), []);
              assert.deepStrictEqual(readHidden(item.root, name), ["A G1"]);
              assert.strictEqual(item.live.textContent, announcements.placed("tulips", "Gap 1"));

              for (const element of item.root.querySelectorAll<HTMLElement>(
                `[data-slot="${rootSlot}-choice"], [data-slot="${rootSlot}-gap"]`,
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

    it.effect("[Q-6] a finished item gets no input behaviour", () =>
      Effect.gen(function* finished() {
        const xml = yield* fileText(fixture);
        const values = { RESPONSE: pairValue(["A", "G1"]) };
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

              const bloom = item.choice("B");

              press(bloom, " ");
              press(bloom, "ArrowRight");
              press(bloom, "Enter");
              bloom.click();
              item.gap("G2").click();
              press(item.gap("G1"), "Delete");
              yield* frames;

              assert.deepStrictEqual(watch.records(), [], label);
              assert.strictEqual(item.live.textContent, "", label);
              assert.deepStrictEqual(readHidden(item.root, name), [], label);
              assert.strictEqual(item.root.outerHTML, before, label);
              assert.strictEqual(shownIn(item.gap("G1")), "tulips", label);
              watch.stop();
            }),
          );
        }
      }),
    );

    it.effect(
      "[Q-6] a gap text refused by its match-group says so, and the gaps it may fill take it",
      () =>
        Effect.gen(function* matchGroup() {
          const plain = yield* fileText(fixture);
          const from = '<qti-gap-text identifier="A" match-max="1">';
          const xml = plain.replace(
            from,
            '<qti-gap-text identifier="A" match-max="1" match-group="G2">',
          );

          assert.notStrictEqual(xml, plain);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const tulips = item.choice("A");

              item.begin();
              press(tulips, " ");
              press(tulips, "ArrowRight");
              press(tulips, "Enter");

              assert.strictEqual(yield* heard(item), "tulips cannot go in Gap 1.");
              assert.deepStrictEqual(readHidden(item.root, name), []);
              assert.isUndefined(shownIn(item.gap("G1")));
              assert.strictEqual(tulips.getAttribute("aria-pressed"), "true");

              press(tulips, "ArrowRight");
              press(tulips, "Enter");
              assert.deepStrictEqual(readHidden(item.root, name), ["A G2"]);
              assert.strictEqual(shownIn(item.gap("G2")), "tulips");
              assert.strictEqual(yield* heard(item), announcements.placed("tulips", "Gap 2"));
            }),
          );
        }),
    );

    it.effect(
      "[Q-6] a second upgrade after teardown starts from the hidden inputs, so the gaps show the response again",
      () =>
        Effect.gen(function* upgradedAgain() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const first = item.begin();

              placeByKeys(item.choice("A"), 1);
              placeByKeys(item.choice("B"), 2);
              first.teardown();
              assert.isUndefined(shownIn(item.gap("G1")));
              assert.deepStrictEqual(readHidden(item.root, name), ["A G1", "B G2"]);

              const second = item.begin();

              assert.deepStrictEqual(
                second.controllers.map(({ root }) => root),
                [item.root],
              );
              assert.strictEqual(shownIn(item.gap("G1")), "tulips");
              assert.strictEqual(shownIn(item.gap("G2")), "bloom");
              assert.strictEqual(item.choice("A").getAttribute("aria-disabled"), "true");

              press(item.gap("G1"), "Delete");
              assert.deepStrictEqual(readHidden(item.root, name), ["B G2"]);
              assert.strictEqual(yield* heard(item), announcements.returned("tulips"));
            }),
          );
        }),
    );

    it.effect("[Q-6] a restored gap image keeps the text the SSR showed in its gap", () =>
      Effect.gen(function* restoredImage() {
        const plain = yield* fileText(fixture);
        const text = '<qti-gap-text identifier="C" match-max="2">wilt</qti-gap-text>';
        const image =
          '<qti-gap-img identifier="C" match-max="2" object-label="a wilted flower"><object type="image/png" data="wilt.png" width="32" height="32"/></qti-gap-img>';
        const xml = plain.replace(text, image);

        assert.notStrictEqual(xml, plain);

        yield* withItem(xml, { values: { RESPONSE: pairValue(["C", "G1"]) } }, (item) =>
          Effect.gen(function* drive() {
            assert.strictEqual(shownIn(item.gap("G1")), "a wilted flower");

            const before = item.gap("G1").innerHTML;

            item.begin();
            assert.strictEqual(item.gap("G1").innerHTML, before);
            assert.deepStrictEqual(readHidden(item.root, name), ["C G1"]);

            press(item.gap("G1"), "Delete");
            assert.deepStrictEqual(readHidden(item.root, name), []);
            assert.isUndefined(shownIn(item.gap("G1")));
            assert.strictEqual(yield* heard(item), announcements.returned("Choice 3 of 3"));
          }),
        );
      }),
    );

    it.effect(
      "[Q-6] the upgraded item has no axe violation of WCAG 2.2 A or AA, in the source and with a text placed",
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

                placeByKeys(item.choice("A"), 1);
                press(item.choice("B"), " ");

                const during = yield* Effect.promise(() => axe.run(item.container, rules));

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

    it.effect(
      "[Q-6] each gap is a named group and the word bank gives up its list role while the upgrade holds, and teardown restores the SSR's markup",
      () =>
        Effect.gen(function* namedGaps() {
          const xml = yield* fileText(fixture);
          const showings: readonly Showing[] = [
            {},
            { values: { RESPONSE: pairValue(["A", "G1"], ["B", "G2"]) } },
          ];

          for (const showing of showings) {
            yield* withItem(xml, showing, (item) =>
              Effect.sync(() => {
                const before = item.container.innerHTML;
                const upgraded = item.begin();

                assert.strictEqual(item.gap("G1").getAttribute("role"), "group");
                assert.strictEqual(item.gap("G1").getAttribute("aria-label"), "Gap 1");
                assert.strictEqual(item.gap("G2").getAttribute("aria-label"), "Gap 2");
                assert.strictEqual(
                  need(item.root, `[data-slot="${rootSlot}-choices"]`).getAttribute("role"),
                  "none",
                );

                upgraded.teardown();
                assert.strictEqual(item.container.innerHTML, before);
              }),
            );
          }
        }),
    );
  });
});
