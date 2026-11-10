/**
 * The runtime's entry, its walk and its two page-side services, in each engine's page: `upgrade`
 * attaches nothing and moves no focus over every M2 fixture item as plate renders it, the walk
 * attaches a registered controller once per root with its item's live region, the live region
 * re-announces by clearing first, and the hidden-input wire keeps one input per value. Through the
 * page's registry, `upgrade` attaches, in every fixture item of every area, exactly the roots whose
 * kind has a runtime, tears them down to the SSR's markup, and never moves focus or speaks on its
 * own.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { liveRegionOf } from "#plate/runtime/announce.dom.ts";
import {
  interactionRootSelector,
  runtimeKindOf,
  runtimeKinds,
  upgradeWith,
} from "#plate/runtime/contract.dom.ts";
import type { Controller, LiveRegion, Upgraded } from "#plate/runtime/contract.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The M2 fixture package's folder, relative to the package, the in-page project's root, which
 * `commands.readFile` resolves this file's paths against.
 */
const fixtureFolder = "fixtures/m2";

/**
 * Every fixture item of every area, `fixtures/<area>/items/*.xml` for M2's folder and each fan-out
 * area's, as paths relative to the package's root. Vite expands the glob when it serves this file,
 * so an item added to any area's `items` folder is walked without a listing to update, and an area
 * with no `items` folder adds none.
 */
const everyFixtureItem = Object.keys(import.meta.glob("/fixtures/*/items/*.xml")).map((key) =>
  key.slice("/".length),
);

/**
 * The `data-slot` marker of each runtime kind's root, written out from {@link runtimeKinds} rather
 * than read through `runtimeKindOf`, the function the walk itself uses.
 */
const runtimeSlots: ReadonlySet<string> = new Set(
  runtimeKinds.map((kind) => `${kind}-interaction`),
);

/**
 * Read a file of the package as text, through the test server. A file that cannot be read fails
 * the test.
 *
 * @param path The file's path relative to the package's root.
 * @returns The file's text.
 */
const fixtureText = (path: string) => Effect.promise(() => commands.readFile(path));

/**
 * Read the items a fixture test lists, in test order, from its `qti-assessment-item-ref` elements.
 *
 * @param xml The test's XML.
 * @returns Each item's path relative to the package's root.
 */
const itemRefs = (xml: string): readonly string[] =>
  [
    ...new DOMParser()
      .parseFromString(xml, "application/xml")
      .querySelectorAll("qti-assessment-item-ref"),
  ].flatMap((ref) => Option.toArray(Option.fromNullishOr(ref.getAttribute("href"))));

/**
 * Read the items of the M2 fixture test, in test order, so an item added to the test is upgraded
 * here too.
 *
 * @returns Each item's path relative to the package's root.
 */
const fixtureItems = fixtureText(`${fixtureFolder}/test.xml`).pipe(
  Effect.map((xml) => itemRefs(xml).map((ref) => `${fixtureFolder}/${ref}`)),
);

/**
 * Render one fixture item as plate's SSR writes it, with the default configuration.
 *
 * @param path The item's path relative to the package's root.
 * @returns The item's HTML.
 */
const renderedFixture = (path: string) =>
  Effect.gen(function* renderFixture() {
    const bytes = new TextEncoder().encode(yield* fixtureText(path));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(path, bytes)));
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

/**
 * An item by hand holding roots no fixture may render yet: a Gap Match root with none of its parts,
 * whose kind has a runtime, and an Inline Choice root, whose kind has none.
 */
const unrenderedRootsItem = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><fieldset data-slot="gap-match-interaction"></fieldset><span data-slot="inline-choice-interaction"></span></div>`;

/**
 * An item by hand holding its live part and one root of every runtime kind, in
 * {@link runtimeKinds} order.
 */
const everyKindItem = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div>${runtimeKinds
  .map((kind) => `<div data-slot="${kind}-interaction"></div>`)
  .join("")}</div>`;

/**
 * The interactions whose native controls are their whole behaviour, so the runtime attaches
 * nothing to their roots.
 */
const nativeSlots = [
  "choice-interaction",
  "text-entry-interaction",
  "extended-text-interaction",
  "inline-choice-interaction",
] as const;

/**
 * Count, by `data-slot` marker, the interaction roots under a node and how many of them an upgrade
 * attached a controller to.
 *
 * @param root The node the upgrade ran under.
 * @param upgraded The upgrade.
 * @returns For each marker present, its roots and its attached roots.
 */
const countBySlot = (
  root: ParentNode,
  upgraded: Upgraded,
): ReadonlyMap<string, { readonly attached: number; readonly roots: number }> => {
  const counts = new Map<string, { attached: number; roots: number }>();
  const attachedRoots = new Set(upgraded.controllers.map(({ root: element }) => element));

  for (const element of root.querySelectorAll<HTMLElement>(interactionRootSelector)) {
    const slot = element.dataset["slot"] ?? "";
    const count = counts.get(slot) ?? { attached: 0, roots: 0 };

    count.roots += 1;
    count.attached += attachedRoots.has(element) ? 1 : 0;
    counts.set(slot, count);
  }

  return counts;
};

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
        implemented: true,
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

    it.effect(
      "[runtime] upgrade over each fixture item of every area attaches exactly the roots whose kind has a runtime",
      () =>
        Effect.gen(function* fixturesAttachByKind() {
          assert.includeMembers(everyFixtureItem, yield* fixtureItems);

          const items: (readonly [string, string])[] = [];

          for (const path of everyFixtureItem) {
            items.push([path, yield* renderedFixture(path)]);
          }

          items.push(["the hand-built item", unrenderedRootsItem]);
          assert.strictEqual(items.length, everyFixtureItem.length + 1);

          const totals = new Map<string, { attached: number; roots: number }>();

          for (const [label, html] of items) {
            const container = mount(html);
            const roots = [...container.querySelectorAll<HTMLElement>(interactionRootSelector)];
            const upgraded = upgrade(container);

            assert.deepStrictEqual(
              upgraded.controllers.map(({ root }) => root),
              roots.filter((root) => runtimeSlots.has(root.dataset["slot"] ?? "")),
              label,
            );

            for (const { kind, root } of upgraded.controllers) {
              assert.strictEqual(root.dataset["slot"], `${kind}-interaction`, label);
            }

            for (const [slot, count] of countBySlot(container, upgraded)) {
              const total = totals.get(slot) ?? { attached: 0, roots: 0 };

              total.attached += count.attached;
              total.roots += count.roots;
              totals.set(slot, total);
            }

            upgraded.teardown();
            container.remove();
          }

          for (const slot of nativeSlots) {
            assert.isAbove(totals.get(slot)?.roots ?? 0, 0, slot);
            assert.strictEqual(totals.get(slot)?.attached, 0, slot);
          }

          const gapMatch = totals.get("gap-match-interaction");

          assert.isAtLeast(gapMatch?.roots ?? 0, 1);
          assert.strictEqual(gapMatch?.attached, gapMatch?.roots);
        }),
    );

    it("[runtime] teardown removes every mark and a second upgrade re-attaches", () => {
      const container = mount(everyKindItem);
      const first = upgrade(container);

      assert.strictEqual(first.controllers.length, runtimeKinds.length);

      const upgradedRoots = new Set<Element>(first.controllers.map(({ root }) => root));

      for (const mark of container.querySelectorAll("[data-runtime]")) {
        assert.isTrue(upgradedRoots.has(mark), "a mark sits on an upgraded root");
      }

      first.teardown();
      assert.strictEqual(container.querySelectorAll("[data-runtime]").length, 0);

      const second = upgrade(container);

      assert.deepStrictEqual(second.controllers, first.controllers);

      second.teardown();
      assert.strictEqual(container.querySelectorAll("[data-runtime]").length, 0);
      container.remove();
    });

    it("[runtime] upgrade never moves focus and announces nothing by itself", async () => {
      const container = mount(everyKindItem);
      const live = container.querySelector('[data-slot="item-live"]');
      const focused: EventTarget[] = [];
      const record = (event: FocusEvent) => {
        focused.push(event.target ?? document);
      };
      const before = document.activeElement;

      document.addEventListener("focusin", record);

      const upgraded = upgrade(container);

      await frames();
      document.removeEventListener("focusin", record);

      assert.isNotNull(live);
      assert.strictEqual(document.activeElement, before);
      assert.deepStrictEqual(focused, []);
      assert.strictEqual(live?.textContent, "");

      upgraded.teardown();
      await frames();
      assert.strictEqual(live?.textContent, "");
      container.remove();
    });

    it("[runtime] an unknown kind in a data-slot attaches nothing and is not in controllers", () => {
      const container = mount(
        `<div data-slot="item"><div data-slot="zzz-interaction"></div><fieldset data-slot="gap-match-interaction"></fieldset></div>`,
      );
      const unknown = container.querySelector<HTMLElement>('[data-slot="zzz-interaction"]');
      const upgraded = upgrade(container);

      assert.isNotNull(unknown);
      assert.isUndefined(runtimeKindOf(unknown?.dataset["slot"]));
      assert.notInclude(
        upgraded.controllers.map(({ root }) => root),
        unknown,
      );
      assert.isUndefined(unknown?.dataset["runtime"]);

      upgraded.teardown();
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
