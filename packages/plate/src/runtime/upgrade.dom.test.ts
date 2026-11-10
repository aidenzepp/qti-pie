/**
 * The runtime's entry, its walk and its two page-side services, in each engine's page: `upgrade`
 * attaches nothing and moves no focus over every M2 fixture item as plate renders it, the walk
 * attaches a registered controller once per root with its item's live region, the live region
 * re-announces by clearing first, and the hidden-input wire keeps one input per value.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { liveRegionOf } from "#plate/runtime/announce.dom.ts";
import { runtimeKindOf, upgradeWith } from "#plate/runtime/contract.dom.ts";
import type { Controller, LiveRegion } from "#plate/runtime/contract.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The M2 fixture package's folder, relative to the package, the in-page project's root, which
 * `commands.readFile` resolves this file's paths against.
 */
const fixtureFolder = "fixtures/m2";

/**
 * Read one of the M2 fixture package's files as text, through the test server.
 *
 * @param file The file's path relative to the package's root.
 * @returns The file's text.
 */
const fixtureText = (file: string) =>
  Effect.promise(() => commands.readFile(`${fixtureFolder}/${file}`));

/**
 * Read the items of the M2 fixture test, in test order, from its `qti-assessment-item-ref`
 * elements, so an item added to the test is upgraded here too.
 *
 * @returns Each item's path relative to the package's root.
 */
const fixtureItems = fixtureText("test.xml").pipe(
  Effect.map((xml) =>
    [
      ...new DOMParser()
        .parseFromString(xml, "application/xml")
        .querySelectorAll("qti-assessment-item-ref"),
    ].flatMap((ref) => Option.toArray(Option.fromNullishOr(ref.getAttribute("href")))),
  ),
);

/**
 * Render one fixture item as plate's SSR writes it, with the default configuration.
 *
 * @param file The item's path relative to the package's root.
 * @returns The item's HTML.
 */
const renderedFixture = (file: string) =>
  Effect.gen(function* renderFixture() {
    const bytes = new TextEncoder().encode(yield* fixtureText(file));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(file, bytes)));
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
 * An item by hand: its root, its live part, a Gap Match root and a Choice root.
 */
const handBuiltItem = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><fieldset data-slot="gap-match-interaction"></fieldset><fieldset data-slot="choice-interaction"></fieldset></div>`;

describe(server.browser, () => {
  describe("upgrade", () => {
    it.effect("attaches nothing and moves no focus over every M2 fixture item", () =>
      Effect.gen(function* fixturesStayStill() {
        const items = yield* fixtureItems;

        assert.isAtLeast(items.length, 5);

        for (const file of items) {
          const container = mount(yield* renderedFixture(file));
          const focused: EventTarget[] = [];
          const record = (event: FocusEvent) => {
            focused.push(event.target ?? document);
          };
          const before = document.activeElement;

          document.addEventListener("focusin", record);

          const scoped = upgrade(container);
          const whole = upgrade();

          document.removeEventListener("focusin", record);

          assert.isAbove(container.querySelectorAll('[data-slot$="-interaction"]').length, 0, file);
          assert.deepStrictEqual(scoped.controllers, [], file);
          assert.deepStrictEqual(whole.controllers, [], file);
          assert.strictEqual(document.activeElement, before, file);
          assert.deepStrictEqual(focused, [], file);

          scoped.teardown();
          whole.teardown();
          container.remove();
        }
      }),
    );

    it("reads a runtime kind from an interaction root's marker only", () => {
      assert.strictEqual(runtimeKindOf("gap-match-interaction"), "gap-match");
      assert.strictEqual(runtimeKindOf("portable-custom-interaction"), "portable-custom");
      assert.isUndefined(runtimeKindOf("choice-interaction"));
      assert.isUndefined(runtimeKindOf("slider-interaction"));
      assert.isUndefined(runtimeKindOf("gap-match-interaction-gap"));
      assert.isUndefined(runtimeKindOf("gap-match"));
      assert.isUndefined(runtimeKindOf(document.createElement("div").dataset["slot"]));
    });

    it("attaches a registered controller once per root, with its item's live region, until torn down", async () => {
      const container = mount(handBuiltItem);
      const gap = container.querySelector<HTMLElement>('[data-slot="gap-match-interaction"]');
      const live = container.querySelector('[data-slot="item-live"]');
      const calls: HTMLElement[] = [];
      let teardowns = 0;
      const controller: Controller<"gap-match"> = {
        kind: "gap-match",
        upgrade: (root: HTMLElement, region: LiveRegion) => {
          calls.push(root);
          region.announce("attached");

          return () => {
            teardowns += 1;
          };
        },
      };
      const registry = { "gap-match": controller };

      const first = upgradeWith(registry, container);
      const again = upgradeWith(registry, container);

      await frames();

      assert.isNotNull(gap);
      assert.deepStrictEqual(first.controllers, [{ kind: "gap-match", root: gap }]);
      assert.deepStrictEqual(again.controllers, []);
      assert.deepStrictEqual(calls, [gap]);
      assert.strictEqual(live?.textContent, "attached");

      first.teardown();
      first.teardown();
      assert.strictEqual(teardowns, 1);

      const after = upgradeWith(registry, gap ?? container);

      assert.deepStrictEqual(after.controllers, [{ kind: "gap-match", root: gap }]);

      after.teardown();
      container.remove();
    });
  });

  describe("the live region", () => {
    it("is the item's live part, and replaces its text after a cleared frame", async () => {
      const container = mount(handBuiltItem);
      const element = container.querySelector('[data-slot="item-live"]');
      const region = liveRegionOf(container);

      assert.isFalse(region.missing);

      region.announce("first");
      assert.strictEqual(element?.textContent, "");
      await frames();
      assert.strictEqual(element?.textContent, "first");

      region.announce("first");
      assert.strictEqual(element?.textContent, "");
      await frames();
      assert.strictEqual(element?.textContent, "first");

      region.announce("dropped");
      region.announce("second");
      await frames();
      assert.strictEqual(element?.textContent, "second");

      container.remove();
    });

    it("is missing, and announces nothing, in an item without a live part", async () => {
      const container = mount(`<div data-slot="item"><p>text</p></div>`);
      const region = liveRegionOf(container);

      assert.isTrue(region.missing);

      region.announce("unheard");
      await frames();
      assert.strictEqual(container.innerHTML, `<div data-slot="item"><p>text</p></div>`);

      container.remove();
    });
  });

  describe("the wire", () => {
    it("keeps one hidden input per value, in order, and removes stale ones", () => {
      const container = mount(
        `<fieldset data-slot="gap-match-interaction" data-entry-name="q1.RESPONSE"><input type="text" name="q1.RESPONSE" value="visible"><input type="hidden" name="other" value="kept"></fieldset>`,
      );
      const root = container.querySelector<HTMLElement>("fieldset");

      assert.isNotNull(root);

      const name = entryNameOf(root) ?? "";

      assert.strictEqual(name, "q1.RESPONSE");

      writeHidden(root, name, ["A G1", "B G2", "A G1"]);
      assert.deepStrictEqual(readHidden(root, name), ["A G1", "B G2", "A G1"]);

      const [first] = root.querySelectorAll('input[type="hidden"][name="q1.RESPONSE"]');

      writeHidden(root, name, ["C G3"]);
      assert.deepStrictEqual(readHidden(root, name), ["C G3"]);
      assert.strictEqual(root.querySelector('input[type="hidden"][name="q1.RESPONSE"]'), first);

      writeHidden(root, name, []);
      assert.deepStrictEqual(readHidden(root, name), []);
      assert.deepStrictEqual(readHidden(root, "other"), ["kept"]);
      assert.strictEqual(
        root.querySelector<HTMLInputElement>('input[type="text"]')?.value,
        "visible",
      );

      container.remove();
    });

    it("reads the entry name from the root, or from its Control part", () => {
      const container = mount(
        `<span data-slot="hotspot-interaction"><input data-slot="hotspot-interaction-control" name="q2.HOT"></span><span data-slot="order-interaction"></span>`,
      );
      const [withControl, bare] = container.querySelectorAll<HTMLElement>(":scope > span");

      assert.isDefined(withControl);
      assert.isDefined(bare);
      assert.strictEqual(entryNameOf(withControl), "q2.HOT");
      assert.isUndefined(entryNameOf(bare));

      container.remove();
    });
  });
});
