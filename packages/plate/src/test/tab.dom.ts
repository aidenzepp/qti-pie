/**
 * The in-page Tab helper of issue gate-tab-helper: `nextControlKey` probes whether Tab or
 * Option-Tab moves focus to the next control of any kind in this page's engine, and `tabTo`
 * presses that key until a target holds focus, so a keyboard row of a `*.dom.test.ts` file passes
 * in every engine the browser suite runs.
 *
 * WebKit on macOS keeps Safari's default: Tab moves focus only between text fields and pop-up
 * menus, and Option-Tab moves it to every control, buttons, radios, checkboxes and `tabindex`
 * elements among them. Linux CI's WebKit reaches every control with Tab, so a bare
 * `userEvent.tab()` that walks to a button passes in CI and fails on a maintainer's Mac.
 *
 * The module imports nothing: it is a browser root of `src/browser.test.ts`, whose allowlist admits
 * no package, so the caller hands in its keyboard (`userEvent` from
 * `vite-plus/test/browser/context`, or a stand-in) as a {@link Keyboard}. Its Node-driven twin is
 * `nextControlKey` in `src/test/browsers.ts`, which probes a Playwright page.
 *
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */

/**
 * The `userEvent.keyboard` text that moves focus to the next control of any kind in this page's
 * engine: Tab, or Option-Tab, which the keyboard syntax writes as `{Alt>}{Tab}{/Alt}`.
 *
 * Issue gate-tab-helper's answer to Safari's split: WebKit on macOS moves Tab between text fields
 * and pop-up menus only and Option-Tab to every control, while Linux CI's WebKit reaches every
 * control with Tab. The Node-driven twin is `NextControlKey` in `src/test/browsers.ts`, which names
 * the same two keys the way Playwright does.
 *
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
export type NextControlKey = "{Alt>}{Tab}{/Alt}" | "{Tab}";

/**
 * What the helper presses keys through: `userEvent` from `vite-plus/test/browser/context`, or a
 * stand-in in the helper's own tests. Only `keyboard` is read.
 *
 * It is a parameter, not an import, because the helper is a browser root of `src/browser.test.ts`
 * (issue gate-tab-helper) and may import no package; it also lets a test drive the helper with a
 * stand-in whose Tab skips buttons, as Safari's does on macOS, to prove the Option-Tab fallback on
 * Linux. Its Node-driven twin is the Playwright `Page` that `nextControlKey` in
 * `src/test/browsers.ts` presses through.
 *
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
export interface Keyboard {
  readonly keyboard: (text: string) => Promise<void>;
}

/**
 * The key text of Tab.
 */
const tab: NextControlKey = "{Tab}";

/**
 * The key text of Option-Tab: Alt held, Tab pressed, Alt released.
 */
const optionTab: NextControlKey = "{Alt>}{Tab}{/Alt}";

/**
 * The markup {@link nextControlKey} probes with: two buttons, controls that Tab skips where it
 * moves only between text fields.
 */
const probeMarkup = '<button type="button">first</button><button type="button">second</button>';

/**
 * The answer of each keyboard that {@link tabTo} has probed, so a keyboard is probed once and a
 * stand-in's answer never leaks into another keyboard's.
 */
const probed = new WeakMap<Keyboard, NextControlKey>();

/**
 * The most presses {@link tabTo} makes when its caller names no count, as issue gate-tab-helper
 * fixes it: room for the stops of a small page, and for stops outside the document that Tab may
 * pass before focus comes back in.
 */
const defaultPresses = 14;

/**
 * Give focus back to the element that held it before a probe, when it is still in the document
 * and is not the body.
 *
 * @param held The element that held focus before the probe, or `null` when none did.
 */
const giveBack = (held: Element | null): void => {
  if (
    held !== null &&
    held !== document.body &&
    document.contains(held) &&
    (held instanceof HTMLElement || held instanceof SVGElement)
  ) {
    held.focus();
  }
};

/**
 * Probe which key moves focus to the next control in this page's engine. Appends a container of
 * two buttons to the body, focuses the first, presses `{Tab}` through `keys`, answers `{Tab}` when
 * the second holds focus and `{Alt>}{Tab}{/Alt}` otherwise, removes the container, and gives focus
 * back to the element that held it before the probe when that element is still in the document
 * and is not the body. Every call probes; `tabTo` is what memoises.
 *
 * Issue gate-tab-helper's in-page form of Safari's Tab and Option-Tab split: WebKit on macOS moves
 * Tab only between text fields and pop-up menus, so Tab never reaches the probe's second button
 * there. The Node-driven twin is `nextControlKey` in `src/test/browsers.ts`, which probes a
 * Playwright page the same way. The probe presses Tab and never the fallback, and the container
 * leaves the document whether the keyboard resolves or rejects.
 *
 * @param keys The keyboard to press through.
 * @returns `{Tab}` when Tab reaches the second button, else `{Alt>}{Tab}{/Alt}`.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
export const nextControlKey = async (keys: Keyboard): Promise<NextControlKey> => {
  const held = document.activeElement;
  const container = document.createElement("div");

  container.innerHTML = probeMarkup;
  document.body.append(container);

  const [first, second] = container.querySelectorAll("button");

  first?.focus();

  const reached = await keys
    .keyboard(tab)
    .then(() => document.activeElement === second)
    .finally(() => {
      container.remove();
      giveBack(held);
    });

  return reached ? tab : optionTab;
};

/**
 * Name an element for a message: its tag name, then its `id` or its `data-identifier` when it has
 * one.
 *
 * @param element The element.
 * @returns The tag name, followed by `#<id>` or `[data-identifier="<value>"]` when present.
 */
const describeElement = (element: Element): string => {
  const identifier =
    element instanceof HTMLElement || element instanceof SVGElement
      ? element.dataset["identifier"]
      : undefined;

  if (element.id !== "") {
    return `${element.localName}#${element.id}`;
  }

  return identifier === undefined
    ? element.localName
    : `${element.localName}[data-identifier="${identifier}"]`;
};

/**
 * Press a key through a keyboard until the target holds focus, at most a number of times.
 *
 * @param target The element that must end up holding focus.
 * @param keys The keyboard to press through.
 * @param key The key text to press.
 * @param remaining The presses left.
 * @returns Whether the target holds focus.
 */
const pressUntil = async (
  target: Element,
  keys: Keyboard,
  key: NextControlKey,
  remaining: number,
): Promise<boolean> => {
  if (remaining <= 0) {
    return false;
  }

  await keys.keyboard(key);

  return document.activeElement === target || (await pressUntil(target, keys, key, remaining - 1));
};

/**
 * Press the next-control key through `keys` until `target` holds focus, at most `presses` times
 * (default 14). Checks focus before anything else, so a target that already holds focus costs no
 * probe and no press. Probes once per `keys` object (a `WeakMap<Keyboard, NextControlKey>`), on the
 * first call that presses. Never calls `focus()` on `target`. Rejects with an `Error` when the
 * target does not hold focus after `presses` presses; the message names the count and the target
 * by tag name and its `id` or `data-identifier` when it has one.
 *
 * Issue gate-tab-helper's keyboard row helper: it reaches the target only by key presses, since
 * the rows exist to prove that a keyboard user reaches the control, and it presses Option-Tab where
 * Safari's default on macOS makes Tab skip buttons, radios, checkboxes and `tabindex` elements.
 * The Node-driven twin is `nextControlKey` in `src/test/browsers.ts`, which probes a Playwright
 * page once and presses the key it finds.
 *
 * The rejection is a `DOMException` named `NotFoundError`, which is an `Error`, and never a
 * `new Error(…)`: the "throw no bare Error" pin of `src/browser.test.ts` (rule d772ad5c point 2)
 * scans every non-test module under `src/`, this one included, and a module with no imports has no
 * tagged error to throw instead.
 *
 * @param target The element that must hold focus.
 * @param keys The keyboard to press through.
 * @param presses The most presses to make.
 * @returns A promise that resolves once `target` holds focus.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
export const tabTo = async (
  target: Element,
  keys: Keyboard,
  presses: number = defaultPresses,
): Promise<void> => {
  if (document.activeElement === target) {
    return;
  }

  if (presses > 0) {
    const key = probed.get(keys) ?? (await nextControlKey(keys));

    probed.set(keys, key);

    if (await pressUntil(target, keys, key, presses)) {
      return;
    }
  }

  throw new DOMException(
    `Focus did not reach the ${describeElement(target)} after ${presses} presses of the next-control key. Check that the element is enabled, visible and in the tab order (no tabindex="-1"), or raise the count if the page has more stops before it.`,
    "NotFoundError",
  );
};
