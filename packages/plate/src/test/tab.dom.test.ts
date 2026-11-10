/**
 * The in-page Tab helper of issue gate-tab-helper, `src/test/tab.dom.ts`, in each engine's page:
 * `nextControlKey` probes Tab against Option-Tab, and `tabTo` presses whichever reaches every
 * control until its target holds focus.
 *
 * Some rows drive the helper with the page's real `userEvent`, so each engine answers for itself.
 * The rest drive it with a stand-in keyboard that moves focus by hand, the way an engine would: the
 * "Linux" stand-in sends Tab to every control, and the "macOS WebKit" stand-in sends Tab to text
 * fields and pop-up menus only, as Safari's default does, so the Option-Tab fallback is proven on
 * Linux, where no engine takes it on its own.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`, and mounts its own HTML in a container that `afterEach` removes.
 */
import { afterEach, assert, describe, it } from "@effect/vitest";
import { server, userEvent } from "vite-plus/test/browser/context";
import { nextControlKey, tabTo } from "#plate/test/tab.dom.ts";
import type { Keyboard, NextControlKey } from "#plate/test/tab.dom.ts";

/**
 * The key text of Tab.
 */
const tab: NextControlKey = "{Tab}";

/**
 * The key text of Option-Tab.
 */
const optionTab: NextControlKey = "{Alt>}{Tab}{/Alt}";

/**
 * What a "Linux" stand-in's Tab reaches: every control that takes part in the tab order.
 */
const everyControl = 'button, input:not([type="hidden"]), select, textarea, [tabindex="0"]';

/**
 * What a "macOS WebKit" stand-in's Tab reaches: text fields and pop-up menus, as Safari's default
 * moves Tab.
 */
const textFields = 'input[type="text"], select';

/**
 * A keyboard that records the key texts it is asked to press, in order.
 */
interface StandIn extends Keyboard {
  readonly calls: readonly string[];
}

/**
 * Move focus to the first element matching a selector that follows the focused one in document
 * order, or to the body when none does.
 *
 * @param selector The controls the key reaches.
 */
const moveFocus = (selector: string): void => {
  const order = [...document.querySelectorAll("*")];
  const from = order.indexOf(document.activeElement ?? document.body);
  const next = [...document.querySelectorAll<HTMLElement>(selector)].find(
    (control) => order.indexOf(control) > from,
  );

  if (next !== undefined) {
    next.focus();
  } else if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

/**
 * Make a keyboard that records each key text and moves focus by hand: Tab to the next element in
 * document order among `tabReaches`, and Option-Tab to the next of any control, each leaving focus
 * on the body when none follows. Its moves call `focus()`, which is the stand-in's privilege and
 * never the helper's.
 *
 * @param tabReaches The selector of what the stand-in's Tab reaches.
 * @returns The keyboard.
 */
const standIn = (tabReaches: string): StandIn => {
  const calls: string[] = [];

  return {
    calls,
    keyboard: (text) => {
      calls.push(text);

      if (text === tab) {
        moveFocus(tabReaches);
      } else if (text === optionTab) {
        moveFocus(everyControl);
      }

      return Promise.resolve();
    },
  };
};

/**
 * The containers the running case mounted, which `afterEach` removes.
 */
const mounted: HTMLElement[] = [];

/**
 * Append a container holding some HTML to the body.
 *
 * @param html The container's markup.
 * @returns The container, which `afterEach` removes.
 */
const mount = (html: string): HTMLElement => {
  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.append(container);
  mounted.push(container);

  return container;
};

/**
 * Find the element a selector names in a container, failing the case when there is none.
 *
 * @param container The container.
 * @param selector The selector.
 * @returns The first match.
 */
const find = (container: HTMLElement, selector: string): HTMLElement => {
  const found = container.querySelector<HTMLElement>(selector);

  if (found === null) {
    return assert.fail(`${selector} is not in the mounted markup.`);
  }

  return found;
};

describe(server.browser, () => {
  afterEach(() => {
    for (const container of mounted.splice(0)) {
      container.remove();
    }
  });

  it("[GATE-TAB] nextControlKey answers {Tab} for a keyboard whose Tab reaches every control, and presses once", async () => {
    const linux = standIn(everyControl);

    assert.strictEqual(await nextControlKey(linux), tab);
    assert.deepStrictEqual(linux.calls, [tab]);
  });

  it("[GATE-TAB] nextControlKey answers {Alt>}{Tab}{/Alt} for a keyboard whose Tab skips buttons, as WebKit on macOS does", async () => {
    const macOs = standIn(textFields);

    assert.strictEqual(await nextControlKey(macOs), optionTab);
    assert.deepStrictEqual(macOs.calls, [tab]);
  });

  it("[GATE-TAB] nextControlKey leaves the document as it found it and gives focus back", async () => {
    const container = mount('<input type="text">');
    const input = find(container, "input");

    input.focus();

    const children = document.body.childElementCount;
    const key = await nextControlKey(userEvent);

    assert.include([tab, optionTab], key);
    assert.strictEqual(document.body.childElementCount, children);
    assert.deepStrictEqual(
      [...document.body.querySelectorAll("button")].filter(({ textContent }) =>
        ["first", "second"].includes(textContent ?? ""),
      ),
      [],
    );
    assert.strictEqual(document.activeElement, input);
  });

  it("[GATE-TAB] nextControlKey from the body leaves focus on the body", async () => {
    mount("<p>nothing here takes focus</p>");

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    assert.strictEqual(document.activeElement, document.body);

    const children = document.body.childElementCount;

    await nextControlKey(userEvent);

    assert.strictEqual(document.activeElement, document.body);
    assert.strictEqual(document.body.childElementCount, children);
  });

  it("[GATE-TAB] tabTo reaches a button behind a text field in this engine", async () => {
    const container = mount('<input type="text"><button type="button">go</button>');
    const button = find(container, "button");
    let focusCalls = 0;

    button.focus = () => {
      focusCalls += 1;
    };

    await tabTo(button, userEvent);

    assert.strictEqual(document.activeElement, button);
    assert.strictEqual(focusCalls, 0);
  });

  it("[GATE-TAB] tabTo reaches a checkbox past a radio in this engine", async () => {
    const container = mount('<input type="radio" name="r"><input type="checkbox">');
    const checkbox = find(container, 'input[type="checkbox"]');

    await tabTo(checkbox, userEvent);

    assert.strictEqual(document.activeElement, checkbox);
  });

  it("[GATE-TAB] tabTo reaches a tabindex span in this engine", async () => {
    const container = mount('<span tabindex="0">A</span><span tabindex="0">B</span>');
    const [, second] = container.querySelectorAll("span");

    if (second === undefined) {
      assert.fail("The second span is not in the mounted markup.");
    }

    await tabTo(second, userEvent);

    assert.strictEqual(document.activeElement, second);
  });

  it("[GATE-TAB] tabTo presses nothing when the target already holds focus", async () => {
    const container = mount('<button type="button">here</button>');
    const button = find(container, "button");
    const keys = standIn(textFields);

    button.focus();
    await tabTo(button, keys);

    assert.deepStrictEqual(keys.calls, []);
  });

  it("[GATE-TAB] tabTo probes once per keyboard", async () => {
    const container = mount(
      '<input type="text"><button type="button">a</button><button type="button">b</button>',
    );
    const [a, b] = container.querySelectorAll("button");

    if (a === undefined || b === undefined) {
      assert.fail("The two buttons are not in the mounted markup.");
    }

    const keys = standIn(textFields);

    await tabTo(a, keys);
    await tabTo(b, keys);

    assert.strictEqual(document.activeElement, b);
    assert.strictEqual(keys.calls.filter((call) => call === tab).length, 1);
    assert.strictEqual(keys.calls[0], tab);
    assert.isAbove(keys.calls.length, 1);
    assert.isTrue(keys.calls.slice(1).every((call) => call === optionTab));
  });

  it("[GATE-TAB] tabTo with a keyboard that skips buttons on Tab reaches a button behind a text field by Option-Tab", async () => {
    const container = mount('<input type="text"><button type="button">go</button>');
    const button = find(container, "button");
    const keys = standIn(textFields);

    await tabTo(button, keys);

    assert.strictEqual(document.activeElement, button);
    assert.deepStrictEqual(keys.calls, [tab, optionTab, optionTab]);
  });

  it("[GATE-TAB] tabTo rejects after its presses when the target cannot take focus, and the document is unchanged", async () => {
    const container = mount('<button type="button">x</button><span tabindex="-1">no</span>');
    const span = find(container, "span");
    const children = document.body.childElementCount;
    const outcomes = await Promise.allSettled([tabTo(span, userEvent, 3)]);
    const errors = outcomes.flatMap((outcome) =>
      outcome.status === "rejected" && outcome.reason instanceof Error ? [outcome.reason] : [],
    );

    assert.lengthOf(errors, 1);
    assert.strictEqual(document.body.childElementCount, children);
  });
});
