/**
 * The Portable Custom Interaction's frame host (Q-16, issue pci-04), in each engine's page: the
 * rendered fixture item `fixtures/pci/items/pci.xml`, mounted and given the host facts the test
 * writes onto its root, gains one sandboxed frame that loads the fixture package's counter module
 * through the frame's own AMD loader and bridge, and the page sees the PCI's life as events on the
 * root: ready, changed, done, completed, resized, failed.
 *
 * The page cannot reach into the frame (its origin is opaque), so every observation here goes
 * through the page: the root's events, the frame's attributes, and real keyboard input, which
 * `userEvent` sends through the engine.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/runtime/upgrade.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { controller } from "#plate/interactions/portable-custom.dom.ts";
import type {
  PciChangedDetail,
  PciCompletedDetail,
  PciDoneDetail,
  PciFailedDetail,
  PciReadyDetail,
  PciResizedDetail,
} from "#plate/pci/frame-host.dom.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The fixture item the frame host is proven on: one PCI whose counter starts at 1 and whose
 * module the configuration file routes to `modules/counter`.
 */
const fixtureItem = "fixtures/pci/items/pci.xml";

/**
 * The URL the test server serves the frame boot at, derived from this module's own URL so it is
 * absolute and on the same server: the frame loads it as a classic script.
 */
const loaderUrl = new URL("frame-boot.dom.ts", import.meta.url).href;

/**
 * The URL of the fixture package's counter module, served by the test server.
 */
const counterUrl = new URL("../../fixtures/pci/package/modules/counter.js", import.meta.url).href;

/**
 * A URL under the fixture package that answers 404: a primary route that fails.
 */
const missingUrl = new URL("../../fixtures/pci/package/modules/missing.js", import.meta.url).href;

/**
 * An empty script: it loads without error and defines nothing, so a loader waiting for a define
 * waits out the route's seconds.
 */
const emptyScriptUrl = "data:text/javascript,";

/**
 * The longest a test waits for an event the frame should produce, in milliseconds.
 */
const bound = 8000;

/**
 * How long a test waits to be sure an event does not arrive, in milliseconds.
 */
const quiet = 400;

/**
 * The marker of the PCI's root.
 */
const rootSelector = '[data-slot="portable-custom-interaction"]';

/**
 * The marker of the PCI's Notice part.
 */
const noticeSelector = '[data-slot="portable-custom-interaction-notice"]';

/**
 * One route of `data-pci-routes`, as the declared shape writes it.
 */
interface Route {
  readonly fallback?: string;
  readonly id: string;
  readonly primary?: string;
  readonly waitSeconds: { readonly fallback: number; readonly primary: number };
}

/**
 * The route that loads the counter from its primary location.
 */
const counterRoute: Route = {
  id: "counter",
  primary: counterUrl,
  waitSeconds: { fallback: 7, primary: 30 },
};

/**
 * Render the fixture item as plate's SSR writes it, with the default configuration.
 *
 * @returns The item's HTML.
 */
const renderedFixture = Effect.gen(function* renderFixture() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(fixtureItem)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open(fixtureItem, bytes)));
  const configuration = yield* configure({});

  return Result.getOrThrow(render(redact(accepted), configuration, { instance: "w0d" })).html;
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
 * Find the PCI roots under a container.
 *
 * @param container The container.
 * @returns The roots, in document order.
 */
const rootsOf = (container: HTMLElement): readonly HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>(rootSelector),
];

/**
 * Find the one PCI root under a container.
 *
 * @param container The container.
 * @returns The root.
 */
const rootOf = (container: HTMLElement): HTMLElement => {
  const [root, ...rest] = rootsOf(container);

  assert.isDefined(root);
  assert.deepStrictEqual(rest, []);

  return root;
};

/**
 * Write the host facts onto a root, as the declared shapes give them.
 *
 * @param root The PCI's root.
 * @param routes The routes of `data-pci-routes`.
 * @param entry The entry module's id, when the PCI names one.
 */
const writeFacts = (root: HTMLElement, routes: readonly Route[], entry?: string): void => {
  root.dataset["pciLoader"] = loaderUrl;
  root.dataset["pciRoutes"] = JSON.stringify(routes);

  if (entry !== undefined) {
    root.dataset["pciEntry"] = entry;
  }
};

/**
 * The detail of a root event the host dispatches, or `undefined` when an event carried none.
 */
type Detail =
  | PciChangedDetail
  | PciCompletedDetail
  | PciDoneDetail
  | PciFailedDetail
  | PciReadyDetail
  | PciResizedDetail
  | undefined;

/**
 * Report whether an event's detail is one of the host's: an object, since every host detail is.
 *
 * @param value The detail.
 * @returns Whether it is.
 */
const isDetail = (value: unknown): value is Exclude<Detail, undefined> =>
  typeof value === "object" && value !== null;

/**
 * Read a custom event's detail as one of the host's.
 *
 * @param event The event.
 * @returns Its detail, or `undefined` when it is not an object.
 */
const detailOf = (event: CustomEvent): Detail => {
  const detail: unknown = event.detail;

  return isDetail(detail) ? detail : undefined;
};

/**
 * The details of one kind of root event, recorded from the moment the recorder is attached.
 */
interface Recorded {
  readonly details: Detail[];
  readonly stop: () => void;
}

/**
 * Record every event of a name on a root, in order.
 *
 * @param root The root.
 * @param name The event's name.
 * @returns The recorded details and a function that stops recording.
 */
const record = (root: HTMLElement, name: string): Recorded => {
  const details: Detail[] = [];
  const listening = new AbortController();

  root.addEventListener(
    name,
    (event) => {
      details.push(event instanceof CustomEvent ? detailOf(event) : undefined);
    },
    { signal: listening.signal },
  );

  return {
    details,
    stop: () => {
      listening.abort();
    },
  };
};

/**
 * Wait for the next event of a name on a root, failing when none arrives within the bound.
 *
 * @param root The root.
 * @param name The event's name.
 * @param within The bound, in milliseconds.
 * @returns The event's detail.
 */
const nextEvent = (root: HTMLElement, name: string, within = bound): Promise<Detail> => {
  const { promise, reject, resolve } = Promise.withResolvers<Detail>();
  const listening = new AbortController();
  const timer = setTimeout(() => {
    listening.abort();
    reject(new Error(`${name} did not fire on the root within ${String(within)} ms`));
  }, within);

  root.addEventListener(
    name,
    (event) => {
      clearTimeout(timer);
      listening.abort();
      resolve(event instanceof CustomEvent ? detailOf(event) : undefined);
    },
    { once: true, signal: listening.signal },
  );

  return promise;
};

/**
 * Wait some milliseconds.
 *
 * @param milliseconds How long.
 * @returns A promise that resolves after them.
 */
const sleep = (milliseconds: number): Promise<undefined> => {
  const { promise, resolve } = Promise.withResolvers<undefined>();

  setTimeout(resolve, milliseconds);

  return promise;
};

/**
 * Wait until a condition holds, failing when it does not within the bound.
 *
 * @param condition The condition.
 * @param what What is awaited, for the failure.
 * @param remaining How many 50 ms steps remain.
 */
const until = async (
  condition: () => boolean,
  what: string,
  remaining = bound / 50,
): Promise<void> => {
  if (condition()) {
    return;
  }

  assert.isAbove(remaining, 0, `${what} did not come to pass within ${String(bound)} ms`);
  await sleep(50);
  await until(condition, what, remaining - 1);
};

/**
 * Press Tab until the page's active element is a target, at most a few times.
 *
 * @param target The element that should hold focus.
 * @param remaining How many presses remain.
 */
const tabUntil = async (target: Element, remaining = 6): Promise<void> => {
  if (document.activeElement === target) {
    return;
  }

  assert.isAbove(remaining, 0, "Tab never reached the frame");
  await userEvent.tab();
  await tabUntil(target, remaining - 1);
};

/**
 * Find the one frame under a root.
 *
 * @param root The root.
 * @returns The frame.
 */
const frameOf = (root: HTMLElement): HTMLIFrameElement => {
  const frames = root.querySelectorAll("iframe");

  assert.strictEqual(frames.length, 1, "one frame under the root");

  const [frame] = frames;

  assert.isDefined(frame);

  return frame;
};

/**
 * The frame's data block, as far as this test reads it.
 */
interface DataBlock {
  readonly nonce?: unknown;
}

/**
 * Report whether a parsed value is an object, so its `nonce` can be read.
 *
 * @param value The parsed value.
 * @returns Whether it is.
 */
const isDataBlock = (value: unknown): value is DataBlock =>
  typeof value === "object" && value !== null;

/**
 * Read the nonce the frame's `srcdoc` carries in its data block.
 *
 * @param frame The frame.
 * @returns The nonce.
 */
const nonceOf = (frame: HTMLIFrameElement): string => {
  const parsed = new DOMParser().parseFromString(frame.srcdoc, "text/html");
  const block = parsed.querySelector('script[type="application/json"]');

  assert.isNotNull(block, "the srcdoc holds a JSON data block");

  const data: unknown = JSON.parse(block?.textContent ?? "null");
  const nonce = isDataBlock(data) ? data.nonce : undefined;

  if (!Predicate.isString(nonce)) {
    assert.fail("the data block names the nonce");
  }

  return nonce;
};

/**
 * Render and mount the fixture item with the counter's facts on its root, and upgrade it.
 *
 * @param routes The routes to write, the counter's primary route by default.
 * @param before What to do to the root before the upgrade.
 * @returns The container, the root, the upgrade and the promise of the ready event's detail.
 */
const upgradedFixture = async (
  routes: readonly Route[] = [counterRoute],
  before: (root: HTMLElement) => void = () => {},
) => {
  const container = mount(await Effect.runPromise(renderedFixture));
  const root = rootOf(container);

  writeFacts(root, routes, "counter");
  before(root);

  const ready = nextEvent(root, "pci-ready");
  const upgraded = upgrade(container);

  return { container, ready, root, upgraded };
};

/**
 * Press the counter's button once, through the keyboard: Tab into the frame, then Enter.
 *
 * @param root The root.
 * @param before A control before the root to start from.
 */
const press = async (root: HTMLElement, before: HTMLElement): Promise<void> => {
  before.focus();
  await tabUntil(frameOf(root));
  await userEvent.keyboard("{Enter}");
};

/**
 * A focusable control before a container's item, and one after it.
 */
interface Bracket {
  readonly after: HTMLElement;
  readonly before: HTMLElement;
}

/**
 * Put a focusable control before and after a container's item.
 *
 * @param container The container.
 * @returns The two controls.
 */
const bracket = (container: HTMLElement): Bracket => {
  const before = document.createElement("button");
  const after = document.createElement("button");

  before.type = "button";
  before.textContent = "before";
  after.type = "button";
  after.textContent = "after";
  container.prepend(before);
  container.append(after);

  return { after, before };
};

describe(server.browser, () => {
  describe("the PCI frame host", () => {
    it("[Q-16] the PCI controller is implemented and leaves no stub mark", async () => {
      const container = mount(await Effect.runPromise(renderedFixture));
      const root = rootOf(container);
      const upgraded = upgrade(container);

      assert.isTrue(controller.implemented);
      assert.isUndefined(root.dataset["runtime"]);

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a root without a loader fact gets no frame, keeps its notice, and still tears down", async () => {
      const container = mount(await Effect.runPromise(renderedFixture));
      const root = rootOf(container);
      const live = container.querySelector('[data-slot="item-live"]');
      const notice = root.querySelector<HTMLElement>(noticeSelector);
      const rendered = root.outerHTML;
      const active = document.activeElement;

      assert.isUndefined(root.dataset["pciLoader"]);

      const upgraded = upgrade(container);

      await sleep(quiet);
      assert.deepStrictEqual(upgraded.controllers, [{ kind: "portable-custom", root }]);
      assert.isNull(root.querySelector("iframe"));
      assert.isFalse(notice?.hidden);
      assert.strictEqual(document.activeElement, active);
      assert.strictEqual(live?.textContent, "");

      upgraded.teardown();
      assert.strictEqual(root.outerHTML, rendered);
      container.remove();
    });

    it("[Q-16] upgrade creates one sandboxed frame per PCI, allow-scripts only, titled, and hides the notice", async () => {
      const { container, ready, root, upgraded } = await upgradedFixture();
      const frame = frameOf(root);
      const notice = root.querySelector<HTMLElement>(noticeSelector);

      assert.strictEqual(frame.getAttribute("sandbox"), "allow-scripts");
      assert.isAbove(frame.srcdoc.length, 0);
      assert.strictEqual(frame.title, "Press the button three times.");
      assert.isTrue(notice?.hidden);
      assert.strictEqual(root.querySelectorAll('iframe[sandbox~="allow-same-origin"]').length, 0);
      assert.strictEqual(root.querySelectorAll("[style]").length, 0);

      await ready;
      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] two PCIs on one page get two frames, and each root receives only its own events", async () => {
      const html = await Effect.runPromise(renderedFixture);
      const container = mount(html + html);
      const roots = rootsOf(container);

      assert.strictEqual(roots.length, 2);

      const recorders = roots.map((root) => {
        writeFacts(root, [counterRoute], "counter");

        return record(root, "pci-ready");
      });
      const readies = roots.map((root) => nextEvent(root, "pci-ready"));
      const upgraded = upgrade(container);

      await Promise.all(readies);
      await sleep(quiet);

      const frames = container.querySelectorAll("iframe");

      assert.strictEqual(frames.length, 2);
      assert.notStrictEqual(frames[0]?.srcdoc, frames[1]?.srcdoc);
      assert.notStrictEqual(
        nonceOf(frameOf(roots[0] ?? container)),
        nonceOf(frameOf(roots[1] ?? container)),
      );

      for (const recorder of recorders) {
        assert.strictEqual(recorder.details.length, 1);
        recorder.stop();
      }

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] the frame loads the module through its primary route and the PCI becomes ready", async () => {
      const { container, ready, upgraded } = await upgradedFixture();

      assert.deepStrictEqual(await ready, {
        choice: "exact",
        responseIdentifier: "RESPONSE",
        state: { count: 1 },
        typeIdentifier: "urn:qti-pie:pci:counter",
        written: "urn:qti-pie:pci:counter",
      });

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a primary route that fails falls back to the fallback route", async () => {
      const { container, ready, upgraded } = await upgradedFixture([
        {
          fallback: counterUrl,
          id: "counter",
          primary: missingUrl,
          waitSeconds: { fallback: 7, primary: 1 },
        },
      ]);
      const detail = await ready;

      assert.isObject(detail);
      assert.include(detail, { choice: "exact", typeIdentifier: "urn:qti-pie:pci:counter" });

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a route that times out falls back", async () => {
      const started = performance.now();
      const { container, ready, upgraded } = await upgradedFixture([
        {
          fallback: counterUrl,
          id: "counter",
          primary: emptyScriptUrl,
          waitSeconds: { fallback: 7, primary: 1 },
        },
      ]);
      const detail = await ready;

      assert.isAtLeast(performance.now() - started, 1000);
      assert.isObject(detail);
      assert.include(detail, { choice: "exact", typeIdentifier: "urn:qti-pie:pci:counter" });

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a written type identifier that matches no registered one still gets the only factory, and the ready event says so", async () => {
      const { container, ready, upgraded } = await upgradedFixture([counterRoute], (root) => {
        root.dataset["pciType"] = "urn:qti-pie:pci:other";
      });
      const detail = await ready;

      assert.isObject(detail);
      assert.include(detail, {
        choice: "only",
        typeIdentifier: "urn:qti-pie:pci:counter",
        written: "urn:qti-pie:pci:other",
      });

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a press inside the frame reaches the page as a change with the response value", async () => {
      const { container, ready, root, upgraded } = await upgradedFixture();
      const { before } = bracket(container);

      await ready;

      const changed = nextEvent(root, "pci-changed");

      await press(root, before);
      assert.deepStrictEqual(await changed, {
        responseIdentifier: "RESPONSE",
        valid: undefined,
        value: { base: { integer: 2 } },
      });

      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] a message from another window, or with another nonce, is ignored", async () => {
      const { container, ready, root, upgraded } = await upgradedFixture();
      const { before } = bracket(container);

      await ready;

      const nonce = nonceOf(frameOf(root));
      const recorder = record(root, "pci-changed");
      const forged = {
        kind: "changed",
        nonce,
        responseIdentifier: "RESPONSE",
        valid: undefined,
        value: { base: { integer: 9 } },
      };

      window.postMessage(forged, "*");
      await sleep(quiet);
      assert.deepStrictEqual(recorder.details, []);

      window.postMessage({ ...forged, nonce: `${nonce}-forged` }, "*");
      await sleep(quiet);
      assert.deepStrictEqual(recorder.details, []);

      const changed = nextEvent(root, "pci-changed");

      await press(root, before);
      assert.deepStrictEqual(await changed, {
        responseIdentifier: "RESPONSE",
        valid: undefined,
        value: { base: { integer: 2 } },
      });
      assert.strictEqual(recorder.details.length, 1);

      recorder.stop();
      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] the frame's height attribute follows what the frame reports", async () => {
      const container = mount(await Effect.runPromise(renderedFixture));
      const root = rootOf(container);

      writeFacts(root, [counterRoute], "counter");

      const resized = record(root, "pci-resized");
      const ready = nextEvent(root, "pci-ready");
      const upgraded = upgrade(container);

      await ready;
      await until(() => resized.details.length > 0, "a pci-resized event");
      await sleep(quiet);

      const frame = frameOf(root);
      const height = frame.getAttribute("height") ?? "";
      const last = resized.details.at(-1);

      assert.match(height, /^[1-9]\d*$/u);
      assert.isObject(last);
      assert.deepStrictEqual(last, { pixels: Number(height) });
      assert.isFalse(frame.hasAttribute("style"));

      resized.stop();
      upgraded.teardown();
      container.remove();
    });

    it("[Q-16] teardown asks the PCI to complete, and removes the frame once it has", async () => {
      const { container, ready, root, upgraded } = await upgradedFixture();
      const { before } = bracket(container);
      const notice = root.querySelector<HTMLElement>(noticeSelector);

      await ready;

      const changed = nextEvent(root, "pci-changed");

      await press(root, before);
      await changed;

      const done = nextEvent(root, "pci-done");
      const completed = nextEvent(root, "pci-completed");

      upgraded.teardown();

      assert.deepStrictEqual(await done, {
        response: { base: { integer: 2 } },
        responseIdentifier: "RESPONSE",
        state: { count: 2 },
        status: "closed",
      });
      assert.deepStrictEqual(await completed, {
        response: { base: { integer: 2 } },
        responseIdentifier: "RESPONSE",
        state: { count: 2 },
      });
      await until(() => root.querySelector("iframe") === null, "the frame's removal");
      assert.isFalse(notice?.hidden);

      const readyAgain = nextEvent(root, "pci-ready");
      const again = upgrade(container);

      assert.deepStrictEqual(again.controllers, [{ kind: "portable-custom", root }]);
      assert.strictEqual(root.querySelectorAll("iframe").length, 1);
      await readyAgain;

      again.teardown();
      await until(() => root.querySelector("iframe") === null, "the second frame's removal");
      container.remove();
    });

    it("[Q-16] upgrade moves no focus, and Tab moves into the frame and out of it", async () => {
      const container = mount(await Effect.runPromise(renderedFixture));
      const root = rootOf(container);
      const { after, before } = bracket(container);
      const focused: EventTarget[] = [];
      const recordFocus = (event: FocusEvent) => {
        focused.push(event.target ?? document);
      };

      writeFacts(root, [counterRoute], "counter");

      const active = document.activeElement;
      const ready = nextEvent(root, "pci-ready");

      document.addEventListener("focusin", recordFocus);

      const upgraded = upgrade(container);

      await ready;
      document.removeEventListener("focusin", recordFocus);
      assert.strictEqual(document.activeElement, active);
      assert.deepStrictEqual(focused, []);

      const frame = frameOf(root);

      before.focus();
      assert.strictEqual(document.activeElement, before);
      await userEvent.tab();
      assert.strictEqual(document.activeElement, frame);
      await userEvent.tab();
      assert.strictEqual(document.activeElement, after);

      upgraded.teardown();
      container.remove();
    });
  });
});
