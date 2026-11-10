/**
 * The select-then-place driver in each engine's page: its ARIA state on the tokens, its key map
 * over dispatched `keydown` events, its single-pointer path over `click` events, its refusals, and
 * its teardown, over a fixture built by hand in the test and a recording live region.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { server, userEvent } from "vite-plus/test/browser/context";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import { driveSelectPlace } from "#plate/runtime/select-place-driver.dom.ts";
import type { DriveOptions } from "#plate/runtime/select-place-driver.dom.ts";
import { announcements } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * The fixture's markup: two `span` tokens and a native `button` token in a source, and four targets
 * named by `aria-label`, the first showing a placed token.
 */
const fixtureHtml = `<div data-test="source"><span data-token="A">apple</span><span data-token="B" class="kept">banana</span><button type="button" data-token="C">cherry</button></div><div data-test="targets"><span data-target="1" aria-label="Basket 1"><span data-placed="A">apple</span></span><span data-target="2" aria-label="Basket 2"></span><span data-target="3" aria-label="Basket 3"></span><span data-target="4" aria-label="Basket 4"></span></div>`;

/**
 * A live region that keeps every announcement, in order.
 */
interface Recorder extends LiveRegion {
  readonly heard: string[];
}

/**
 * Make a live region that records what it is told.
 *
 * @returns The recorder.
 */
const recorder = (): Recorder => {
  const heard: string[] = [];

  return {
    announce: (text) => {
      heard.push(text);
    },
    heard,
  };
};

/**
 * A placement of the fixture's elements.
 */
type ElementPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * Put the fixture into a fresh root at the end of the page's body.
 *
 * @returns The root, which the caller removes, its tokens apple, banana and cherry, its four
 *   targets, and the placed element shown in the first target.
 */
const mounted = () => {
  const root = document.createElement("div");

  root.innerHTML = fixtureHtml;
  document.body.append(root);

  const [apple, banana, cherry] = root.querySelectorAll<HTMLElement>("[data-token]");
  const targets = [...root.querySelectorAll<HTMLElement>("[data-target]")];
  const [first, second] = targets;
  const placed = root.querySelector<HTMLElement>("[data-placed]");

  if (
    apple === undefined ||
    banana === undefined ||
    cherry === undefined ||
    first === undefined ||
    second === undefined ||
    placed === null
  ) {
    throw new Error("The driver fixture lost an element.");
  }

  return { apple, banana, cherry, first, placed, root, second, targets };
};

/**
 * Drive the fixture, recording what the live region heard and every change handed to `onChange`.
 *
 * @param fixture The mounted fixture.
 * @param options What the case changes of the default options: capacity 1, no placements.
 * @returns The fixture, the recorder, the changes and the teardown.
 */
const driven = (
  fixture: ReturnType<typeof mounted>,
  options: Partial<Omit<DriveOptions, "live" | "onChange" | "root">> = {},
) => {
  const live = recorder();
  const changes: (readonly ElementPlacement[])[] = [];
  const teardown = driveSelectPlace({
    capacity: () => 1,
    live,
    onChange: (placements) => {
      changes.push(placements);
    },
    root: fixture.root,
    targets: fixture.targets,
    tokens: [fixture.apple, fixture.banana, fixture.cherry],
    ...options,
  });

  return { ...fixture, changes, live, teardown };
};

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

describe(server.browser, () => {
  describe("the select-then-place driver", () => {
    it("[m3d-02] the driver marks tokens as toggle buttons and leaves native buttons' roles alone", () => {
      const fixture = driven(mounted());
      const { apple, cherry, first, second } = fixture;

      assert.strictEqual(apple.getAttribute("role"), "button");
      assert.strictEqual(apple.getAttribute("tabindex"), "0");
      assert.strictEqual(apple.getAttribute("aria-pressed"), "false");
      assert.isFalse(cherry.hasAttribute("role"));
      assert.isFalse(cherry.hasAttribute("tabindex"));
      assert.strictEqual(cherry.getAttribute("aria-pressed"), "false");
      assert.strictEqual(first.getAttribute("tabindex"), "0");
      assert.isFalse(second.hasAttribute("role"));
      assert.isFalse(second.hasAttribute("aria-pressed"));

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] Space on a token picks it up: aria-pressed true and the pick-up announcement", () => {
      const fixture = driven(mounted());
      const { apple, live } = fixture;
      const event = press(apple, " ");

      assert.isTrue(event.defaultPrevented);
      assert.strictEqual(apple.getAttribute("aria-pressed"), "true");
      assert.deepStrictEqual(live.heard, [announcements.pickedUp("apple")]);

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] arrow keys move the data-cursor between targets while focus stays on the token", () => {
      const fixture = driven(mounted());
      const { apple, first, live, second } = fixture;

      apple.focus();
      press(apple, "Enter");
      press(apple, "ArrowRight");
      assert.isTrue(Object.hasOwn(first.dataset, "cursor"));
      press(apple, "ArrowRight");

      assert.isTrue(Object.hasOwn(second.dataset, "cursor"));
      assert.isFalse(Object.hasOwn(first.dataset, "cursor"));
      assert.strictEqual(fixture.root.querySelectorAll("[data-cursor]").length, 1);
      assert.strictEqual(document.activeElement, apple);
      assert.strictEqual(live.heard.at(-1), announcements.moved("Basket 2", 2, 4));

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] Enter places: onChange gets the placement and the token is released", () => {
      const fixture = driven(mounted());
      const { apple, changes, live, second } = fixture;

      press(apple, "Enter");
      press(apple, "ArrowDown");
      press(apple, "ArrowDown");

      const event = press(apple, "Enter");

      assert.isTrue(event.defaultPrevented);
      assert.deepStrictEqual(changes, [[{ target: second, token: apple }]]);
      assert.strictEqual(apple.getAttribute("aria-pressed"), "false");
      assert.strictEqual(fixture.root.querySelectorAll("[data-cursor]").length, 0);
      assert.strictEqual(live.heard.at(-1), announcements.placed("apple", "Basket 2"));

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] Escape cancels: no change and the cancel announcement", () => {
      const fixture = driven(mounted());
      const { banana, changes, live } = fixture;

      press(banana, " ");
      press(banana, "End");

      const event = press(banana, "Escape");

      assert.isTrue(event.defaultPrevented);
      assert.deepStrictEqual(changes, []);
      assert.strictEqual(banana.getAttribute("aria-pressed"), "false");
      assert.strictEqual(fixture.root.querySelectorAll("[data-cursor]").length, 0);
      assert.strictEqual(live.heard.at(-1), announcements.cancelled("banana"));

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] click a token, then click a target: the single-pointer path places it", () => {
      const fixture = driven(mounted());
      const { banana, changes, live, root, second } = fixture;
      const moves: Event[] = [];
      const record = (event: Event) => {
        moves.push(event);
      };

      document.addEventListener("pointermove", record, true);
      banana.click();
      assert.strictEqual(banana.getAttribute("aria-pressed"), "true");
      second.click();
      document.removeEventListener("pointermove", record, true);

      assert.deepStrictEqual(changes, [[{ target: second, token: banana }]]);
      assert.strictEqual(banana.getAttribute("aria-pressed"), "false");
      assert.strictEqual(live.heard.at(-1), announcements.placed("banana", "Basket 2"));
      assert.deepStrictEqual(moves, []);

      banana.click();
      banana.click();
      assert.strictEqual(banana.getAttribute("aria-pressed"), "false");
      assert.strictEqual(live.heard.at(-1), announcements.cancelled("banana"));
      assert.strictEqual(changes.length, 1);
      assert.strictEqual(root.querySelectorAll("[data-cursor]").length, 0);

      fixture.teardown();
      root.remove();
    });

    it("[m3d-02] a full target refuses the token, announcing it, and the token stays held", () => {
      const fixture = mounted();
      const { apple, banana, changes, first, live, teardown } = driven(fixture, {
        placements: [{ target: fixture.first, token: fixture.apple }],
      });

      assert.strictEqual(apple.getAttribute("aria-pressed"), "false");

      press(banana, "Enter");
      press(banana, "Home");

      const event = press(banana, "Enter");

      assert.isTrue(event.defaultPrevented);
      assert.deepStrictEqual(changes, []);
      assert.strictEqual(live.heard.at(-1), announcements.full("Basket 1"));
      assert.strictEqual(banana.getAttribute("aria-pressed"), "true");
      assert.isTrue(Object.hasOwn(first.dataset, "cursor"));

      teardown();
      fixture.root.remove();
    });

    it("[m3d-02] Delete on a placed token returns it to the source", () => {
      const fixture = mounted();
      const restored: ElementPlacement = { target: fixture.first, token: fixture.apple };
      const kept: ElementPlacement = { target: fixture.second, token: fixture.banana };
      const { changes, live, placed, teardown } = driven(fixture, {
        placementOf: (element) =>
          element.closest("[data-placed]") === null ? undefined : restored,
        placements: [restored, kept],
      });

      const ignored = press(fixture.second, "Delete");

      assert.isFalse(ignored.defaultPrevented);
      assert.deepStrictEqual(changes, []);

      const event = press(placed, "Delete");

      assert.isTrue(event.defaultPrevented);
      assert.deepStrictEqual(changes, [[kept]]);
      assert.deepStrictEqual(live.heard, [announcements.returned("apple")]);

      teardown();
      fixture.root.remove();
    });

    it("[m3d-02] a click on a placed token returns it to the source", () => {
      const fixture = mounted();
      const restored: ElementPlacement = { target: fixture.first, token: fixture.apple };
      const { changes, live, placed, teardown } = driven(fixture, {
        placementOf: (element) =>
          element.closest("[data-placed]") === null ? undefined : restored,
        placements: [restored],
      });

      placed.click();

      assert.deepStrictEqual(changes, [[]]);
      assert.deepStrictEqual(live.heard, [announcements.returned("apple")]);

      teardown();
      fixture.root.remove();
    });

    it("[m3d-02] an unavailable token is aria-disabled and ignores Space, Enter and click", () => {
      const fixture = mounted();
      const { apple, banana, changes, live, second, teardown } = driven(fixture, {
        available: (token, placements) =>
          !placements.some((placement) => placement.token === token),
        placements: [{ target: fixture.first, token: fixture.apple }],
      });

      assert.strictEqual(apple.getAttribute("aria-disabled"), "true");
      assert.isFalse(banana.hasAttribute("aria-disabled"));

      press(apple, " ");
      press(apple, "Enter");
      apple.click();

      assert.deepStrictEqual(live.heard, []);
      assert.deepStrictEqual(changes, []);
      assert.strictEqual(apple.getAttribute("aria-pressed"), "false");

      banana.click();
      second.click();

      assert.strictEqual(banana.getAttribute("aria-disabled"), "true");
      assert.strictEqual(changes.length, 1);

      teardown();
      fixture.root.remove();
    });

    it("[m3d-02] an unmapped key, such as Tab or a letter, is not prevented", () => {
      const fixture = driven(mounted());
      const { apple, live, placed } = fixture;

      assert.isFalse(press(apple, "Tab").defaultPrevented);
      assert.isFalse(press(apple, "a").defaultPrevented);
      assert.isFalse(press(apple, "ArrowRight").defaultPrevented);
      assert.isFalse(press(placed, "Delete").defaultPrevented);
      assert.deepStrictEqual(live.heard, []);

      press(apple, " ");

      assert.isFalse(press(apple, "Tab").defaultPrevented);
      assert.isFalse(press(apple, "a").defaultPrevented);
      assert.isFalse(press(apple, "Delete").defaultPrevented);
      assert.strictEqual(live.heard.length, 1);

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] Space and Enter on a focused native button token pick it up once, not undone by the button's own click", async () => {
      const fixture = driven(mounted());
      const { cherry, live } = fixture;

      cherry.focus();
      await userEvent.keyboard(" ");

      assert.strictEqual(cherry.getAttribute("aria-pressed"), "true");
      assert.deepStrictEqual(live.heard, [announcements.pickedUp("cherry")]);

      await userEvent.keyboard("{Escape}");
      await userEvent.keyboard("{Enter}");

      assert.strictEqual(cherry.getAttribute("aria-pressed"), "true");
      assert.deepStrictEqual(live.heard, [
        announcements.pickedUp("cherry"),
        announcements.cancelled("cherry"),
        announcements.pickedUp("cherry"),
      ]);

      fixture.teardown();
      fixture.root.remove();
    });

    it("[m3d-02] driving never moves focus, and teardown leaves the root as it was", () => {
      const fixture = mounted();
      const before = fixture.root.outerHTML;
      const focused = document.activeElement;
      const moves: EventTarget[] = [];
      const record = (event: FocusEvent) => {
        moves.push(event.target ?? document);
      };

      document.addEventListener("focusin", record);

      const { apple, banana, live, teardown } = driven(fixture, {
        available: (token, placements) =>
          !placements.some((placement) => placement.token === token),
      });

      press(apple, "Enter");
      press(apple, "ArrowRight");
      press(apple, "ArrowRight");
      press(apple, "Enter");
      banana.click();
      press(banana, "End");
      document.removeEventListener("focusin", record);

      assert.strictEqual(document.activeElement, focused);
      assert.deepStrictEqual(moves, []);
      assert.notStrictEqual(fixture.root.outerHTML, before);

      teardown();

      assert.strictEqual(fixture.root.outerHTML, before);

      const heard = live.heard.length;

      press(apple, " ");
      apple.click();
      assert.strictEqual(live.heard.length, heard);

      fixture.root.remove();
    });

    it("[m3d-02] teardown restores attributes the driver changed", () => {
      const root = document.createElement("div");

      root.innerHTML = `<span data-token tabindex="-1" role="option" aria-pressed="mixed">fig</span><span data-target tabindex="-1">Bowl</span>`;
      document.body.append(root);

      const before = root.outerHTML;
      const tokens = [...root.querySelectorAll<HTMLElement>("[data-token]")];
      const targets = [...root.querySelectorAll<HTMLElement>("[data-target]")];
      const changes: (readonly ElementPlacement[])[] = [];
      const teardown = driveSelectPlace({
        capacity: () => Infinity,
        live: recorder(),
        onChange: (placements) => {
          changes.push(placements);
        },
        root,
        targets,
        tokens,
      });

      assert.strictEqual(tokens[0]?.getAttribute("role"), "button");
      assert.strictEqual(tokens[0]?.getAttribute("tabindex"), "0");
      assert.strictEqual(tokens[0]?.getAttribute("aria-pressed"), "false");
      assert.strictEqual(targets[0]?.getAttribute("tabindex"), "0");

      teardown();

      assert.strictEqual(root.outerHTML, before);
      assert.deepStrictEqual(changes, []);
      root.remove();
    });
  });
});
