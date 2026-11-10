/**
 * Associate's (Q-1) runtime controller in each engine's page, over the core's fixture item
 * rendered as plate's SSR writes it and upgraded through the page's registry: pairs made by
 * keyboard alone and by single pointer, the refusals and their announcements, removing a pair, the
 * posted form, and the teardown.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { afterEach, assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import { controller } from "#plate/interactions/associate.dom.ts";
import type { Value } from "#plate/model/values.ts";
import type { RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import type { RuntimeKind, Upgraded } from "#plate/runtime.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's fixture item, relative to the package, which `commands.readFile` resolves against the
 * in-page project's root.
 */
const fixturePath = "fixtures/ei/items/associate.xml";

/**
 * The item instance the renders are made under.
 */
const instance = "as1";

/**
 * The form entry name the Associate's hidden inputs post under in {@link instance}.
 */
const name = entryName(instance, "RESPONSE");

/**
 * What a case passes `render` beyond the item: the mode, whether the author finished the item, and
 * the pairs to restore.
 */
interface Showing {
  readonly disabled?: boolean;
  readonly mode?: RenderMode;
  readonly pairs?: readonly (readonly [string, string])[];
}

/**
 * The actions that undo what a case set up, run after each case so a failing case leaves no
 * upgraded root or focusable element behind for the next.
 */
const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
});

/**
 * Read the core's fixture as text.
 *
 * @returns The fixture's XML.
 */
const fixtureXml = (): Promise<string> => commands.readFile(fixturePath);

/**
 * Edit the fixture's XML, failing the case when the text to replace is not there.
 *
 * @param xml The XML.
 * @param from The text to find, every occurrence of which is replaced.
 * @param to The text to put in its place.
 * @returns The edited XML.
 */
const edited = (xml: string, from: string, to: string): string => {
  assert.include(xml, from);

  return xml.replaceAll(from, to);
};

/**
 * Construct the multiple pair value that holds each pair, the two choices in the order written.
 *
 * @param pairs Each pair: its two choices.
 * @returns The value.
 */
const pairValue = (pairs: readonly (readonly [string, string])[]): Value => ({
  baseType: "pair",
  cardinality: "multiple",
  values: pairs.map(([first, second]) => ({
    baseType: "pair" as const,
    value: [first, second] as const,
  })),
});

/**
 * Render an item as plate's SSR writes it, with the default configuration.
 *
 * @param xml The item's XML.
 * @param showing What the case passes `render` beyond the item.
 * @returns The item's HTML.
 */
const renderedItem = (xml: string, showing: Showing = {}): Promise<string> =>
  Effect.runPromise(
    Effect.gen(function* renderItem() {
      const accepted = Option.getOrThrow(
        acceptedItem(yield* open(fixturePath, new TextEncoder().encode(xml))),
      );
      const configuration = yield* configure({});
      const { disabled = false, mode = "answering", pairs = [] } = showing;

      return Result.getOrThrow(
        render(redact(accepted), configuration, {
          disabled,
          instance,
          mode,
          values: { RESPONSE: pairValue(pairs) },
        }),
      ).html;
    }),
  );

/**
 * Wait for two animation frames, so a text the live region writes on the next frame is written.
 *
 * @returns A promise of the second frame's timestamp.
 */
const frames = (): Promise<number> =>
  Effect.runPromise(
    Effect.callback<number>((resume) => {
      requestAnimationFrame(() => {
        requestAnimationFrame((time) => {
          resume(Effect.succeed(time));
        });
      });
    }),
  );

/**
 * A rendered item put into a form at the end of the page's body.
 */
interface Page {
  readonly container: HTMLFormElement;
  readonly live: HTMLElement;
  readonly root: HTMLElement;
}

/**
 * Find an element a case needs, failing the case when it is missing.
 *
 * @param element The element a query gave, `null` for none.
 * @param what What the case looked for, named in the failure.
 * @returns The element.
 */
const found = <E extends Element>(element: E | null, what: string): E => {
  if (element === null) {
    throw new Error(`The page has no ${what}.`);
  }

  return element;
};

/**
 * Put an item's HTML into a form at the end of the page's body, so the case can post it.
 *
 * @param html The item's HTML.
 * @returns The form, the item's live part and the Associate's root.
 */
const mounted = (html: string): Page => {
  const container = document.createElement("form");

  container.innerHTML = html;
  document.body.append(container);
  cleanups.push(() => {
    container.remove();
  });

  return {
    container,
    live: found(container.querySelector<HTMLElement>('[data-slot="item-live"]'), "live part"),
    root: found(
      container.querySelector<HTMLElement>('[data-slot="associate-interaction"]'),
      "Associate root",
    ),
  };
};

/**
 * Upgrade a page through the runtime's registry, so its teardown runs after the case even when the
 * case fails before it.
 *
 * @param page The mounted page.
 * @returns The upgrade.
 */
const upgraded = (page: Page) => {
  const result = upgrade(page.container);

  cleanups.push(result.teardown);

  return result;
};

/**
 * The interaction roots an upgrade attached a controller to, in document order. The runtime also
 * upgrades the item Root through its content controller (`#plate/content/root.dom.ts`) and reports
 * it after the interactions, so a case about the Associate reads the interaction entries alone.
 *
 * @param result The upgrade.
 * @returns The roots of its interaction entries.
 */
const interactionRoots = (result: Upgraded): readonly HTMLElement[] =>
  result.controllers.flatMap((entry) => ("kind" in entry ? [entry.root] : []));

/**
 * The kinds of the interactions an upgrade attached a controller to, in document order, the item
 * Root's entry left out as {@link interactionRoots} leaves it out.
 *
 * @param result The upgrade.
 * @returns The kind of each interaction entry.
 */
const interactionKinds = (result: Upgraded): readonly RuntimeKind[] =>
  result.controllers.flatMap((entry) => ("kind" in entry ? [entry.kind] : []));

/**
 * Render the fixture, or an edit of it, mount it and upgrade it.
 *
 * @param showing What the case passes `render` beyond the item.
 * @param edit The edit the case makes to the fixture's XML, none to use it as written.
 * @returns The page and its upgrade.
 */
const started = async (showing: Showing = {}, edit: (xml: string) => string = (xml) => xml) => {
  const page = mounted(await renderedItem(edit(await fixtureXml()), showing));

  return { ...page, upgrade: upgraded(page) };
};

/**
 * Find a choice of the Associate by its identifier.
 *
 * @param page The mounted page.
 * @param identifier The choice's `qti-simple-associable-choice` identifier.
 * @returns The choice's element.
 */
const choice = (page: Page, identifier: string): HTMLElement =>
  found(
    page.root.querySelector<HTMLElement>(
      `[data-slot="associate-interaction-choice"][data-identifier="${identifier}"]`,
    ),
    `choice ${identifier}`,
  );

/**
 * List the pair items the page shows, in order.
 *
 * @param page The mounted page.
 * @returns The items.
 */
const rowsOf = (page: Page): readonly HTMLElement[] => [
  ...page.root.querySelectorAll<HTMLElement>('[data-slot="associate-interaction-pair"]'),
];

/**
 * Read the texts of the pair items the page shows, in order.
 *
 * @param page The mounted page.
 * @returns Each item's text.
 */
const pairTexts = (page: Page): readonly string[] => rowsOf(page).map((row) => row.textContent);

/**
 * Read the hidden inputs the page holds, in order, whatever their name.
 *
 * @param page The mounted page.
 * @returns Each input's name and value.
 */
const hiddenOf = (page: Page): readonly (readonly [string, string])[] =>
  [...page.container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map(
    (input) => [input.name, input.value] as const,
  );

/**
 * Read the values of the hidden inputs of the response's name.
 *
 * @param page The mounted page.
 * @returns Each value, in order.
 */
const posted = (page: Page): readonly string[] =>
  hiddenOf(page).flatMap(([entry, value]) => (entry === name ? [value] : []));

/**
 * Click the choices in turn, as a single pointer does: each click is its own press and release,
 * with no movement between them.
 *
 * @param page The mounted page.
 * @param identifiers The choices to click, in order.
 */
const clickChoices = (page: Page, identifiers: readonly string[]): void => {
  for (const identifier of identifiers) {
    choice(page, identifier).click();
  }
};

/**
 * Press Tab until an element has focus, as a keyboard user reaches it, without calling `focus()`.
 * Focus may leave the document and come back to its start, so the presses are bounded rather than
 * stopped by the first time it does.
 *
 * @param target The element to reach.
 * @param presses How many more presses to make before failing the case.
 */
const tabTo = async (target: Element, presses = 14): Promise<void> => {
  if (document.activeElement === target) {
    return;
  }

  assert.isAbove(presses, 0, "Tab never reached the element.");
  await userEvent.tab();
  await tabTo(target, presses - 1);
};

/**
 * Read what the item's live region says once the frame that writes it has run.
 *
 * @param page The mounted page.
 * @returns The live region's text.
 */
const heard = async (page: Page): Promise<string> => {
  await frames();

  return page.live.textContent;
};

/**
 * Tell whether a choice is marked unavailable.
 *
 * @param page The mounted page.
 * @param identifier The choice's identifier.
 * @returns True when it carries `aria-disabled="true"`.
 */
const unavailable = (page: Page, identifier: string): boolean =>
  choice(page, identifier).getAttribute("aria-disabled") === "true";

/**
 * Check that a finished item is upgraded without input behaviour: its choices and its pair items
 * gain no role, focus stop or state, a click on them changes nothing, and the page announces
 * nothing.
 *
 * @param showing How the item is rendered: a finished one, with a pair to show.
 */
const staysInert = async (showing: Showing): Promise<void> => {
  const page = await started(showing);
  const before = page.root.outerHTML;

  assert.strictEqual(interactionRoots(page.upgrade).length, 1);
  assert.strictEqual(pairTexts(page).length, 1);

  clickChoices(page, ["A", "C", "D"]);
  rowsOf(page)[0]?.click();
  await frames();

  assert.strictEqual(page.root.outerHTML, before);
  assert.deepStrictEqual(hiddenOf(page), []);
  assert.strictEqual(page.live.textContent, "");

  page.upgrade.teardown();
  assert.strictEqual(page.root.outerHTML, before);
};

describe(server.browser, () => {
  describe("the Associate controller", () => {
    it("[Q-1] the Associate controller is implemented and leaves no stub mark", async () => {
      const page = await started();

      assert.isTrue(controller.implemented);
      assert.strictEqual(controller.kind, "associate");
      assert.deepStrictEqual(interactionKinds(page.upgrade), ["associate"]);
      assert.isUndefined(page.root.dataset["runtime"]);

      page.upgrade.teardown();
      assert.isUndefined(page.root.dataset["runtime"]);
    });

    it("[Q-1] keyboard only: pick A, move to C, Enter makes the pair and writes its hidden input", async () => {
      const page = await started();
      const [a, c] = [choice(page, "A"), choice(page, "C")];

      await tabTo(a);
      await userEvent.keyboard(" ");
      assert.strictEqual(a.getAttribute("aria-pressed"), "true");

      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      assert.isTrue(Object.hasOwn(c.dataset, "cursor"));
      assert.isFalse(Object.hasOwn(a.dataset, "cursor"));
      assert.deepStrictEqual(posted(page), []);

      await userEvent.keyboard("{Enter}");

      assert.deepStrictEqual(hiddenOf(page), [[name, "A C"]]);
      assert.deepStrictEqual(pairTexts(page), ["Pedal paired with Spoke"]);
      assert.strictEqual(a.getAttribute("aria-pressed"), "false");
      assert.isFalse(Object.hasOwn(c.dataset, "cursor"));
      assert.strictEqual(await heard(page), "Pedal paired with Spoke.");
      assert.strictEqual(document.activeElement, a);
    });

    it("[Q-1] single pointer: click A, click C (WCAG 2.5.7)", async () => {
      const page = await started();
      const moves: Event[] = [];
      const record = (event: Event) => {
        moves.push(event);
      };

      document.addEventListener("pointermove", record, true);
      choice(page, "A").click();
      assert.strictEqual(choice(page, "A").getAttribute("aria-pressed"), "true");
      choice(page, "C").click();
      document.removeEventListener("pointermove", record, true);

      assert.deepStrictEqual(hiddenOf(page), [[name, "A C"]]);
      assert.deepStrictEqual(pairTexts(page), ["Pedal paired with Spoke"]);
      assert.strictEqual(choice(page, "A").getAttribute("aria-pressed"), "false");
      assert.strictEqual(await heard(page), "Pedal paired with Spoke.");
      assert.deepStrictEqual(moves, []);
    });

    it("[Q-1] a choice placed on itself is refused and announced", async () => {
      const page = await started();
      const a = choice(page, "A");

      await tabTo(a);
      await userEvent.keyboard(" ");
      await userEvent.keyboard("{ArrowRight}");
      assert.isTrue(Object.hasOwn(a.dataset, "cursor"));
      await userEvent.keyboard("{Enter}");

      assert.deepStrictEqual(hiddenOf(page), []);
      assert.deepStrictEqual(pairTexts(page), []);
      assert.strictEqual(await heard(page), "Pedal cannot be paired with itself.");
      assert.strictEqual(a.getAttribute("aria-pressed"), "true");
    });

    it("[Q-1] a pair already made, in either order, is refused and announced", async () => {
      const page = await started({}, (xml) =>
        edited(edited(xml, 'match-max="1"', 'match-max="0"'), 'match-max="2"', 'match-max="0"'),
      );

      clickChoices(page, ["A", "C"]);
      assert.deepStrictEqual(posted(page), ["A C"]);

      clickChoices(page, ["C", "A"]);
      assert.deepStrictEqual(posted(page), ["A C"]);
      assert.strictEqual(await heard(page), "Spoke and Pedal are already paired.");
      assert.strictEqual(choice(page, "C").getAttribute("aria-pressed"), "true");
      choice(page, "C").click();

      clickChoices(page, ["A", "C"]);
      assert.deepStrictEqual(posted(page), ["A C"]);
      assert.strictEqual(await heard(page), "Pedal and Spoke are already paired.");
      choice(page, "A").click();

      assert.deepStrictEqual(pairTexts(page), ["Pedal paired with Spoke"]);
      assert.deepStrictEqual(
        ["A", "B", "C", "D", "E"].map((identifier) =>
          choice(page, identifier).getAttribute("aria-pressed"),
        ),
        ["false", "false", "false", "false", "false"],
      );
    });

    it("[Q-1] a choice at its match-max is unavailable, and a pair outside a match-group is refused", async () => {
      const page = await started();

      clickChoices(page, ["E", "A"]);
      assert.deepStrictEqual(posted(page), []);
      assert.strictEqual(await heard(page), "Tyre can only be paired with Spoke or Wheel.");
      choice(page, "E").click();

      clickChoices(page, ["A", "E"]);
      assert.deepStrictEqual(posted(page), []);
      assert.strictEqual(await heard(page), "Tyre can only be paired with Spoke or Wheel.");
      choice(page, "A").click();

      clickChoices(page, ["A", "B"]);
      assert.deepStrictEqual(posted(page), ["A B"]);
      assert.deepStrictEqual(
        ["A", "B", "C", "D", "E"].map((identifier) => unavailable(page, identifier)),
        [true, true, false, false, false],
      );

      choice(page, "A").click();
      assert.strictEqual(choice(page, "A").getAttribute("aria-pressed"), "false");
      assert.strictEqual(await heard(page), "Pedal is already in as many pairs as it may be in.");

      clickChoices(page, ["C", "A"]);
      assert.deepStrictEqual(posted(page), ["A B"]);
      assert.strictEqual(await heard(page), "Pedal is already in as many pairs as it may be in.");
      choice(page, "C").click();

      clickChoices(page, ["E", "D"]);
      assert.deepStrictEqual(posted(page), ["A B", "E D"]);
      assert.deepStrictEqual(
        ["A", "B", "C", "D", "E"].map((identifier) => unavailable(page, identifier)),
        [true, true, false, false, true],
      );
    });

    it("[Q-1] at max-associations, picking up is refused and announced", async () => {
      const page = await started({}, (xml) =>
        edited(xml, 'identifier="E" match-max="1"', 'identifier="E" match-max="2"'),
      );

      assert.strictEqual(page.root.dataset["maxAssociations"], "3");
      clickChoices(page, ["A", "B", "C", "D", "D", "E"]);
      assert.deepStrictEqual(posted(page), ["A B", "C D", "D E"]);
      assert.deepStrictEqual(
        ["A", "B", "C", "D", "E"].map((identifier) => unavailable(page, identifier)),
        [true, true, true, true, true],
      );

      const e = choice(page, "E");

      await tabTo(e);
      await userEvent.keyboard(" ");

      assert.strictEqual(e.getAttribute("aria-pressed"), "false");
      assert.deepStrictEqual(posted(page), ["A B", "C D", "D E"]);
      assert.strictEqual(
        await heard(page),
        "No more pairs can be made: the most is 3. Remove a pair to make another.",
      );
    });

    it("[Q-1] removing a pair removes its hidden input and frees both choices", async () => {
      const page = await started();

      clickChoices(page, ["A", "B", "C", "D"]);
      assert.deepStrictEqual(posted(page), ["A B", "C D"]);
      assert.deepStrictEqual(pairTexts(page), [
        "Pedal paired with Crank",
        "Spoke paired with Wheel",
      ]);
      assert.isTrue(unavailable(page, "A"));
      assert.isTrue(unavailable(page, "B"));

      const [first, second] = rowsOf(page);

      assert.isDefined(first);
      assert.isDefined(second);
      await tabTo(first ?? page.root);
      await userEvent.keyboard("{Delete}");

      assert.deepStrictEqual(posted(page), ["C D"]);
      assert.deepStrictEqual(pairTexts(page), ["Spoke paired with Wheel"]);
      assert.isFalse(unavailable(page, "A"));
      assert.isFalse(unavailable(page, "B"));
      assert.isTrue(unavailable(page, "C"));
      assert.strictEqual(await heard(page), "Removed Pedal paired with Crank.");

      second?.click();
      assert.deepStrictEqual(posted(page), []);
      assert.deepStrictEqual(pairTexts(page), []);
      assert.isFalse(unavailable(page, "C"));
      assert.strictEqual(await heard(page), "Removed Spoke paired with Wheel.");

      clickChoices(page, ["A", "B"]);

      const [made] = rowsOf(page);

      await tabTo(made ?? page.root);
      await userEvent.keyboard("{Backspace}");
      assert.deepStrictEqual(posted(page), []);
      assert.deepStrictEqual(pairTexts(page), []);
    });

    it("[Q-1] the posted form decodes to the pairs made", async () => {
      const page = await started();

      clickChoices(page, ["A", "C", "D", "B"]);

      const entries = [...new FormData(page.container)];
      const decoded = Result.getOrThrow(
        decode(entries, { baseType: "pair", cardinality: "multiple", name }),
      );

      assert.deepStrictEqual(entries, [
        [name, "A C"],
        [name, "D B"],
      ]);
      assert.strictEqual(decoded.cardinality, "multiple");
      assert.deepStrictEqual(
        decoded.values.map((single) => (single.baseType === "pair" ? single.value : [])),
        [
          ["A", "C"],
          ["D", "B"],
        ],
      );
    });

    it("[Q-1] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden inputs", async () => {
      const page = mounted(await renderedItem(await fixtureXml()));
      const before = page.root.outerHTML;
      const focused: EventTarget[] = [];
      const record = (event: FocusEvent) => {
        focused.push(event.target ?? document);
      };
      const active = document.activeElement;

      document.addEventListener("focusin", record);

      const result = upgraded(page);

      await frames();
      document.removeEventListener("focusin", record);

      assert.deepStrictEqual(interactionRoots(result), [page.root]);
      assert.strictEqual(document.activeElement, active);
      assert.deepStrictEqual(focused, []);
      assert.strictEqual(page.live.textContent, "");

      clickChoices(page, ["A", "C"]);
      assert.deepStrictEqual(posted(page), ["A C"]);

      result.teardown();
      await frames();

      assert.deepStrictEqual(posted(page), ["A C"]);

      let rest = page.root.outerHTML;

      for (const input of page.root.querySelectorAll('input[type="hidden"]')) {
        rest = rest.replace(input.outerHTML, "");
      }

      assert.strictEqual(rest, before);

      const heardBefore = page.live.textContent;

      clickChoices(page, ["D", "B"]);
      choice(page, "E").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }),
      );
      await frames();

      assert.deepStrictEqual(posted(page), ["A C"]);
      assert.isFalse(choice(page, "D").hasAttribute("aria-pressed"));
      assert.isFalse(choice(page, "E").hasAttribute("aria-pressed"));
      assert.strictEqual(page.live.textContent, heardBefore);
    });

    it("[Q-1] Escape cancels a held choice, and Home and End move to the first and last choice", async () => {
      const page = await started();
      const b = choice(page, "B");

      await tabTo(b);
      await userEvent.keyboard(" ");
      await userEvent.keyboard("{End}");
      assert.isTrue(Object.hasOwn(choice(page, "E").dataset, "cursor"));
      assert.strictEqual(await heard(page), "Tyre, 5 of 5.");

      await userEvent.keyboard("{Home}");
      assert.isTrue(Object.hasOwn(choice(page, "A").dataset, "cursor"));
      assert.strictEqual(await heard(page), "Pedal, 1 of 5.");

      await userEvent.keyboard("{Escape}");
      assert.strictEqual(b.getAttribute("aria-pressed"), "false");
      assert.strictEqual(page.root.querySelectorAll("[data-cursor]").length, 0);
      assert.deepStrictEqual(hiddenOf(page), []);
      assert.strictEqual(await heard(page), "Cancelled. Crank is back in the source.");
    });

    it("[Q-1] picking up announces the choice to pair with, in the Associate's words", async () => {
      const page = await started();

      choice(page, "D").click();

      assert.strictEqual(
        await heard(page),
        "Picked up Wheel. Use the arrow keys to choose another choice, Enter to pair them, Escape to cancel.",
      );
    });

    it("[Q-1] a restored response is shown, limits the choices it uses, and carries on from it", async () => {
      const page = await started({
        pairs: [
          ["A", "B"],
          ["D", "C"],
        ],
      });

      assert.deepStrictEqual(posted(page), ["A B", "D C"]);

      const [first, second] = rowsOf(page);

      assert.deepStrictEqual(pairTexts(page), [
        "Pedal paired with Crank",
        "Wheel paired with Spoke",
      ]);
      assert.deepStrictEqual(
        ["A", "B", "C", "D", "E"].map((identifier) => unavailable(page, identifier)),
        [true, true, true, false, false],
      );

      clickChoices(page, ["D", "E"]);
      assert.deepStrictEqual(posted(page), ["A B", "D C", "D E"]);
      assert.strictEqual(rowsOf(page)[0], first);
      assert.strictEqual(rowsOf(page)[1], second);
      assert.strictEqual(pairTexts(page).at(-1), "Wheel paired with Tyre");

      rowsOf(page)[1]?.click();
      assert.deepStrictEqual(posted(page), ["A B", "D E"]);
      assert.deepStrictEqual(pairTexts(page), [
        "Pedal paired with Crank",
        "Wheel paired with Tyre",
      ]);
      assert.isFalse(unavailable(page, "C"));
    });

    it("[Q-1] an item shown in review gets no input behaviour", async () => {
      await staysInert({ mode: "review", pairs: [["A", "B"]] });
    });

    it("[Q-1] an item the author disabled gets no input behaviour", async () => {
      await staysInert({ disabled: true, pairs: [["A", "B"]] });
    });

    it("[Q-1] a root without choices or without an entry name is upgraded, moves no focus, announces nothing and tears down", async () => {
      const bare = mounted(
        `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="associate-interaction"></div><div data-slot="associate-interaction" data-entry-name="${name}"></div></div>`,
      );
      const before = bare.container.innerHTML;
      const active = document.activeElement;
      const result = upgraded(bare);

      assert.strictEqual(interactionRoots(result).length, 2);
      assert.strictEqual(await heard(bare), "");
      assert.strictEqual(document.activeElement, active);

      result.teardown();
      assert.strictEqual(bare.container.innerHTML, before);
    });
  });
});
