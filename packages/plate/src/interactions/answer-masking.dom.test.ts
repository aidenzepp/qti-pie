/**
 * Answer masking in each engine's page: a masked Choice's Controls are neither focusable nor
 * reachable by Tab until the candidate opens their toggle, which opens by Enter, by Space or by a
 * click with no script, and an opened choice's Control takes focus and checks as it does unmasked.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`, and drives the page with the engine's own key presses.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { noSupports } from "#plate/supports.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The fixture item's path relative to the package, the in-page project's root, which
 * `commands.readFile` resolves paths against.
 */
const fixturePath = "fixtures/m4/items/answer-masking.xml";

/**
 * The selector of a toggle, the `summary` of a mask.
 */
const toggleSelector = '[data-slot="choice-interaction-mask-toggle"]';

/**
 * Render the fixture item as plate's SSR writes it, with answer masking on.
 *
 * @returns The item's HTML.
 */
const maskedItem = Effect.gen(function* renderMasked() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(fixturePath)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open(fixturePath, bytes)));
  const configuration = yield* configure({});

  return Result.getOrThrow(
    render(redact(accepted), configuration, {
      instance: "m405",
      supports: { ...noSupports, answerMasking: true },
    }),
  ).html;
});

/**
 * Put some HTML into a fresh container at the end of the page's body, run a use of it, and remove
 * the container however the use ends.
 *
 * @param html The HTML.
 * @param use What to run with the container.
 * @returns The use's result.
 */
const mounted = <A, E>(
  html: string,
  use: (container: HTMLElement) => Effect.Effect<A, E>,
): Effect.Effect<A, E> =>
  Effect.acquireUseRelease(
    Effect.sync(() => {
      const container = document.createElement("div");

      container.innerHTML = html;
      document.body.append(container);

      return container;
    }),
    use,
    (container) =>
      Effect.sync(() => {
        container.remove();
      }),
  );

/**
 * Find the key press that moves focus to the next control of any kind in this engine: Tab, or
 * Option-Tab where the engine, as WebKit on macOS does by default, makes Tab skip radios,
 * checkboxes and summaries.
 *
 * It presses Tab once from a button and reads where focus lands, as `nextControlKey` does for the
 * Node-driven browser tests.
 *
 * @returns The `userEvent.keyboard` text that moves to the next control.
 */
const nextControlKey = mounted(
  '<button type="button">first</button><button type="button">second</button>',
  (container) =>
    Effect.gen(function* probe() {
      const [first, second] = container.querySelectorAll("button");

      first?.focus();
      yield* Effect.promise(() => userEvent.tab());

      return document.activeElement === second ? "{Tab}" : "{Alt>}{Tab}{/Alt}";
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
 * Press the key that moves to the next control, and read what holds focus after it.
 *
 * @param key The `userEvent.keyboard` text that moves to the next control.
 * @returns The element that holds focus, none when nothing does.
 */
const tabbed = (key: string) =>
  Effect.gen(function* tabStop() {
    yield* press(key);

    return document.activeElement;
  });

/**
 * Read an element the page must hold, failing the test when it does not.
 *
 * @param element The element, if any.
 * @param what What the test looked for.
 * @returns The element.
 */
const required = <T extends Element>(element: T | null | undefined, what: string): T =>
  element ?? assert.fail(`The page holds no ${what}.`);

/**
 * Read the name of the element that holds focus, for a failure message.
 *
 * @returns The focused element's tag and `data-slot`.
 */
const focused = (): string => {
  const element = document.activeElement;

  return element instanceof HTMLElement
    ? `<${element.localName} data-slot="${element.dataset["slot"] ?? ""}">`
    : "nothing";
};

describe(server.browser, () => {
  describe("answer masking", () => {
    it.effect("[A-8] in the page a masked Control is not focusable until its toggle opens", () =>
      Effect.gen(function* maskedControl() {
        const key = yield* nextControlKey;
        const html = yield* maskedItem;

        yield* mounted(
          `<button type="button" id="before">Before</button><form>${html}</form>`,
          (container) =>
            Effect.gen(function* walk() {
              const before = required(
                container.querySelector<HTMLElement>("#before"),
                "button before it",
              );
              const radios = [
                ...container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
              ];
              const [toggle, secondToggle] = container.querySelectorAll(toggleSelector);
              const first = required(toggle, "first toggle");
              const mask = required(first.closest("details"), "mask of the first toggle");
              const radio = required(radios[0], "first radio");

              assert.lengthOf(radios, 3);
              assert.isFalse(mask.open, "the mask starts closed");

              before.focus();
              yield* press(key);
              assert.strictEqual(document.activeElement, first, `Tab stopped at ${focused()}`);
              assert.strictEqual(first.textContent, "Show choice 1 of 3");

              for (const control of radios) {
                control.focus();
                assert.notStrictEqual(
                  document.activeElement,
                  control,
                  "a Control in a closed mask takes no focus, even by script",
                );
              }

              assert.strictEqual(document.activeElement, first);
              yield* press("{Enter}");
              assert.isTrue(mask.open, "Enter on the toggle opens the mask");
              assert.strictEqual(document.activeElement, first, "focus stays on the toggle");
              assert.isFalse(
                required(secondToggle, "second toggle").closest("details")?.open ?? true,
                "the other masks stay closed",
              );

              yield* press(key);
              assert.strictEqual(
                document.activeElement,
                radio,
                `Tab from the opened toggle reached ${focused()}`,
              );
              assert.isFalse(radio.checked);
              yield* press(" ");
              assert.isTrue(radio.checked, "the opened choice's radio checks by Space");
              assert.isFalse(radios[1]?.checked ?? true);

              yield* press(key);
              assert.strictEqual(
                document.activeElement,
                secondToggle,
                `Tab past the checked radio reached ${focused()}, not a Control of a closed mask`,
              );
            }),
        );
      }),
    );

    it.effect("[A-8] in the page Tab visits only the toggles while every mask is closed", () =>
      Effect.gen(function* toggleStops() {
        const key = yield* nextControlKey;
        const html = yield* maskedItem;

        yield* mounted(
          `<button type="button" id="before">Before</button><form>${html}</form><button type="button" id="after">After</button>`,
          (container) =>
            Effect.gen(function* walk() {
              const before = required(
                container.querySelector<HTMLElement>("#before"),
                "button before it",
              );
              const after = required(
                container.querySelector<HTMLElement>("#after"),
                "button after it",
              );
              const toggles = [...container.querySelectorAll(toggleSelector)];
              assert.lengthOf(toggles, 6);
              before.focus();

              const stops = yield* Effect.all(toggles.map(() => tabbed(key)));

              assert.deepStrictEqual(stops, toggles, "every Tab stop is a toggle, in order");
              yield* press(key);
              assert.strictEqual(document.activeElement, after, `Tab ended at ${focused()}`);
            }),
        );
      }),
    );

    it.effect("[A-8] in the page Space and a click open a toggle as Enter does", () =>
      Effect.gen(function* otherOpeners() {
        const key = yield* nextControlKey;
        const html = yield* maskedItem;

        yield* mounted(
          `<button type="button" id="before">Before</button><form>${html}</form>`,
          (container) =>
            Effect.gen(function* walk() {
              const [first, second] = container.querySelectorAll(toggleSelector);
              const spaced = required(first?.closest("details"), "first mask");
              const clicked = required(second?.closest("details"), "second mask");

              required(container.querySelector<HTMLElement>("#before"), "button").focus();
              yield* press(key);
              assert.strictEqual(document.activeElement, first);
              yield* press(" ");
              assert.isTrue(spaced.open, "Space on the toggle opens the mask");

              const target = required(second, "second toggle");

              yield* Effect.promise(() => userEvent.click(target));
              assert.isTrue(clicked.open, "a click on the toggle opens the mask");
            }),
        );
      }),
    );

    it.effect("[A-8] in the page a checkbox Choice's Controls open and check by keys alike", () =>
      Effect.gen(function* checkboxes() {
        const key = yield* nextControlKey;
        const html = yield* maskedItem;

        yield* mounted(
          `<button type="button" id="before">Before</button><form>${html}</form>`,
          (container) =>
            Effect.gen(function* walk() {
              const boxes = [
                ...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
              ];
              const toggle = required(
                boxes[0]?.closest("details")?.querySelector<HTMLElement>(toggleSelector),
                "toggle of the first checkbox",
              );

              assert.lengthOf(boxes, 3);
              toggle.focus();
              for (const box of boxes) {
                assert.isFalse(box.closest("details")?.open ?? true);
              }

              yield* press("{Enter}");
              yield* press(key);
              assert.strictEqual(document.activeElement, boxes[0]);
              yield* press(" ");
              assert.isTrue(boxes[0]?.checked ?? false);
              assert.isFalse(
                boxes[2]?.checked ?? true,
                "a choice of a closed mask stays unchecked",
              );
            }),
        );
      }),
    );
  });
});
