/**
 * Hot Text's (Q-11) runtime controller in each engine's page: the native checkable controls stay
 * the whole input, and the controller adds the selection limit and the count announced through the
 * item's live region, over the fixtures the core renders.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { controller } from "#plate/interactions/hottext.dom.ts";
import type { Value } from "#plate/model/values.ts";
import type { RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import type { Upgraded } from "#plate/runtime/contract.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's multiple-response fixture, relative to the package: four hottexts in one sentence,
 * `max-choices` 2 and `min-choices` 1.
 */
const fixture = "fixtures/m3d/items/hottext.xml";

/**
 * The core's single-response fixture, relative to the package: `max-choices` 1, two hottexts and a
 * third a template hides.
 */
const singleFixture = "fixtures/m3d/items/hottext-single.xml";

/**
 * The item instance every render here is made under.
 */
const instance = "ht1";

/**
 * The `data-slot` marker of the Hot Text Root.
 */
const rootSlot = "hottext-interaction";

/**
 * The `data-slot` marker of one Hot Text Control.
 */
const controlSlot = "hottext-interaction-control";

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
   * The button before the item, which holds focus while a case checks that an upgrade moves none.
   */
  readonly anchor: HTMLElement;
  /**
   * Attach the page's registry to the item and keep the upgrade, so the case's end tears it down.
   */
  readonly begin: () => Upgraded;
  readonly container: HTMLElement;
  /**
   * Find a Control by the identifier of its hottext, its `value`.
   */
  readonly control: (identifier: string) => HTMLInputElement;
  /**
   * List the Controls in document order.
   */
  readonly controls: () => readonly HTMLInputElement[];
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
 * Construct the value of a multiple identifier response.
 *
 * @param members The identifiers it holds.
 * @returns The value.
 */
const identifiers = (...members: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: members.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Render an item's XML as plate's SSR writes it, in {@link instance}.
 *
 * @param xml The item's XML.
 * @param showing What the author passes to `render`.
 * @returns The item's HTML.
 */
const rendered = (xml: string, showing: Showing) =>
  Effect.gen(function* renderItem() {
    const accepted = Option.getOrThrow(
      acceptedItem(yield* open("items/hottext.xml", new TextEncoder().encode(xml))),
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
 * Put rendered HTML after a button that holds focus, at the end of the page's body.
 *
 * @param html The item's HTML.
 * @returns The handles of the mounted item.
 */
const mount = (html: string): Mounted => {
  const container = document.createElement("div");

  container.innerHTML = `<button type="button" data-test="anchor">anchor</button><form>${html}</form>`;
  document.body.append(container);

  const root = need(container, `[data-slot="${rootSlot}"]`);
  const controls = () => [
    ...root.querySelectorAll<HTMLInputElement>(`input[data-slot="${controlSlot}"]`),
  ];
  const upgrades: Upgraded[] = [];

  return {
    anchor: need(container, '[data-test="anchor"]'),
    begin: () => {
      const upgraded = upgrade(container);

      upgrades.push(upgraded);

      return upgraded;
    },
    container,
    control: (identifier) => {
      const found = controls().find((control) => control.value === identifier);

      if (found === undefined) {
        throw new Error(`The rendered item has no control for ${identifier}.`);
      }

      return found;
    },
    controls,
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
 * Click a Control with the pointer, as a candidate does.
 *
 * @param control The Control.
 * @returns The click, completed.
 */
const choose = (control: HTMLElement) => Effect.promise(() => userEvent.click(control));

/**
 * Read what the live region said last, once the frame that writes it has passed.
 *
 * @param item The mounted item.
 * @returns The text.
 */
const heard = (item: Mounted) => frames.pipe(Effect.map(() => item.live.textContent));

/**
 * List the identifiers of the checked Controls, in document order.
 *
 * @param item The mounted item.
 * @returns Each checked Control's `value`.
 */
const checkedIn = (item: Mounted): readonly string[] =>
  item
    .controls()
    .filter((control) => control.checked)
    .map((control) => control.value);

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
  describe("the Hot Text controller", () => {
    it.effect("[Q-11] the Hot Text controller is implemented and leaves no stub mark", () =>
      Effect.gen(function* implemented() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.sync(() => {
            assert.isTrue(controller.implemented);
            assert.strictEqual(controller.kind, "hottext");

            const upgraded = item.begin();

            assert.deepStrictEqual(upgraded.controllers, [{ kind: "hottext", root: item.root }]);
            assert.isUndefined(item.root.dataset["runtime"]);
            assert.strictEqual(item.container.querySelectorAll("[data-runtime]").length, 0);

            upgraded.teardown();
            assert.isUndefined(item.root.dataset["runtime"]);
          }),
        );
      }),
    );

    it.effect("[Q-11] selecting past max-choices is undone and announced", () =>
      Effect.gen(function* undoesPastTheLimit() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();

            yield* choose(item.control("LAMP"));
            yield* choose(item.control("LOG"));
            assert.deepStrictEqual(checkedIn(item), ["LAMP", "LOG"]);

            yield* choose(item.control("HORN"));

            assert.isFalse(item.control("HORN").checked);
            assert.deepStrictEqual(checkedIn(item), ["LAMP", "LOG"]);
            assert.strictEqual(
              yield* heard(item),
              "At most 2 can be chosen. sounds the horn is not chosen.",
            );

            yield* choose(item.control("LAMP"));
            yield* choose(item.control("HORN"));
            assert.deepStrictEqual(checkedIn(item), ["LOG", "HORN"]);
            assert.strictEqual(yield* heard(item), "2 of 2 chosen.");
          }),
        );
      }),
    );

    it.effect("[Q-11] each selection change announces the count", () =>
      Effect.gen(function* announcesTheCount() {
        const xml = yield* fileText(fixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            item.begin();

            yield* choose(item.control("LAMP"));
            assert.strictEqual(yield* heard(item), "1 of 2 chosen.");

            yield* choose(item.control("LOG"));
            assert.strictEqual(yield* heard(item), "2 of 2 chosen.");

            yield* choose(item.control("LOG"));
            assert.strictEqual(yield* heard(item), "1 of 2 chosen.");

            yield* choose(item.control("LAMP"));
            assert.strictEqual(yield* heard(item), "0 of 2 chosen.");
            assert.deepStrictEqual(checkedIn(item), []);
          }),
        );
      }),
    );

    it.effect("[Q-11] the radio group of a single response is untouched", () =>
      Effect.gen(function* radiosStayNative() {
        const xml = yield* fileText(singleFixture);

        yield* withItem(xml, {}, (item) =>
          Effect.gen(function* drive() {
            const radios = item.controls();

            assert.deepStrictEqual(
              radios.map((control) => [control.type, control.value]),
              [
                ["radio", "PEARS"],
                ["radio", "PLUMS"],
              ],
            );
            assert.strictEqual(item.root.dataset["maxChoices"], "1");
            item.begin();

            yield* choose(item.control("PEARS"));
            assert.deepStrictEqual(checkedIn(item), ["PEARS"]);
            assert.strictEqual(yield* heard(item), "pears chosen.");

            yield* choose(item.control("PLUMS"));
            assert.deepStrictEqual(checkedIn(item), ["PLUMS"]);
            assert.isFalse(item.control("PEARS").checked);
            assert.strictEqual(yield* heard(item), "plums chosen.");

            assert.deepStrictEqual(
              item.controls().map((control) => control.type),
              ["radio", "radio"],
            );
          }),
        );
      }),
    );

    it.effect(
      "[Q-11] the controls keep their place in the sentence and their native keyboard path",
      () =>
        Effect.gen(function* keepsItsPlace() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              const paragraph = need(item.root, "p");
              const markup = item.container.innerHTML;
              const sentence = paragraph.textContent;
              const order = item.controls();

              item.begin();

              assert.strictEqual(item.container.innerHTML, markup);
              assert.strictEqual(paragraph.textContent, sentence);
              assert.isTrue(item.controls().every((control, index) => control === order[index]));
              assert.isTrue(order.every((control) => paragraph.contains(control)));

              const visited: string[] = [];

              for (
                let tabs = 0;
                tabs < order.length + 2 && visited.length < order.length;
                tabs += 1
              ) {
                yield* Effect.promise(() => userEvent.tab());

                const active = document.activeElement;

                const reached = order.find((control) => control === active);

                if (reached !== undefined) {
                  visited.push(reached.value);
                }
              }

              assert.deepStrictEqual(
                visited,
                order.map((control) => control.value),
              );

              yield* Effect.promise(() => userEvent.keyboard(" "));
              assert.deepStrictEqual(checkedIn(item), ["TEA"]);
              assert.strictEqual(yield* heard(item), "1 of 2 chosen.");
            }),
          );
        }),
    );

    it.effect(
      "[Q-11] upgrade moves no focus and announces nothing; teardown removes every listener",
      () =>
        Effect.gen(function* quietUpgrade() {
          const xml = yield* fileText(fixture);

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              yield* Effect.promise(() => userEvent.tab());

              const focused: EventTarget[] = [];
              const record = (event: FocusEvent) => {
                focused.push(event.target ?? document);
              };

              assert.strictEqual(document.activeElement, item.anchor);
              document.addEventListener("focusin", record);

              const upgraded = item.begin();
              const watch = watched(item);

              yield* frames;
              document.removeEventListener("focusin", record);

              assert.strictEqual(document.activeElement, item.anchor);
              assert.deepStrictEqual(focused, []);
              assert.deepStrictEqual(watch.records(), []);
              assert.strictEqual(item.live.textContent, "");

              yield* choose(item.control("LAMP"));
              yield* choose(item.control("LOG"));
              yield* choose(item.control("HORN"));
              assert.deepStrictEqual(checkedIn(item), ["LAMP", "LOG"]);
              yield* frames;

              upgraded.teardown();

              const after = watched(item);

              yield* choose(item.control("HORN"));
              yield* choose(item.control("TEA"));
              yield* frames;

              assert.deepStrictEqual(checkedIn(item), ["LAMP", "LOG", "HORN", "TEA"]);
              assert.deepStrictEqual(after.records(), []);
              assert.isUndefined(item.root.dataset["runtime"]);
              after.stop();
              watch.stop();
            }),
          );
        }),
    );

    it.effect(
      "[Q-11] with max-choices 0 no check is undone, and the count is still announced",
      () =>
        Effect.gen(function* unlimited() {
          const xml = (yield* fileText(fixture)).replace(
            'max-choices="2" min-choices="1"',
            'max-choices="0"',
          );

          yield* withItem(xml, {}, (item) =>
            Effect.gen(function* drive() {
              assert.strictEqual(item.root.dataset["maxChoices"], "0");
              item.begin();

              for (const identifier of ["LAMP", "LOG", "HORN", "TEA"]) {
                yield* choose(item.control(identifier));
              }

              assert.deepStrictEqual(checkedIn(item), ["LAMP", "LOG", "HORN", "TEA"]);
              assert.strictEqual(yield* heard(item), "4 chosen.");

              yield* choose(item.control("LOG"));
              assert.strictEqual(yield* heard(item), "3 chosen.");
            }),
          );
        }),
    );

    it.effect("[Q-11] a finished item gets no behaviour", () =>
      Effect.gen(function* finishedItem() {
        const xml = yield* fileText(fixture);
        const finished: readonly Showing[] = [
          { mode: "review", values: { RESPONSE: identifiers("LAMP", "LOG") } },
          { mode: "solution" },
          { disabled: true, values: { RESPONSE: identifiers("LAMP", "LOG") } },
        ];

        for (const showing of finished) {
          yield* withItem(xml, showing, (item) =>
            Effect.gen(function* drive() {
              item.begin();

              const before = checkedIn(item);
              const watch = watched(item);
              const third = item.controls().find((control) => !control.checked);

              assert.isDefined(third);
              assert.isTrue(item.controls().every((control) => control.disabled));

              if (third !== undefined) {
                third.checked = true;
                third.dispatchEvent(new Event("change", { bubbles: true }));
              }

              yield* frames;

              assert.strictEqual(checkedIn(item).length, before.length + 1);
              assert.isTrue(third?.checked);
              assert.deepStrictEqual(watch.records(), []);
              assert.strictEqual(item.live.textContent, "");
              watch.stop();
            }),
          );
        }
      }),
    );
  });
});
