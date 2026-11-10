/**
 * The runtime's closed registry, in each engine's page: `upgrade` attaches one controller to a root
 * of every runtime kind, and each kind's controller module exports that controller alone. The item
 * Root has a controller of its own, from the registry's content slots, upgraded once per Root. A
 * content module's controller attaches to the root of its slot the same way.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { server } from "vite-plus/test/browser/context";
import * as modalFeedback from "#plate/content/modal-feedback.dom.ts";
import * as itemRoot from "#plate/content/root.dom.ts";
import * as associate from "#plate/interactions/associate.dom.ts";
import * as drawing from "#plate/interactions/drawing.dom.ts";
import * as gapMatch from "#plate/interactions/gap-match.dom.ts";
import * as graphicAssociate from "#plate/interactions/graphic-associate.dom.ts";
import * as graphicGapMatch from "#plate/interactions/graphic-gap-match.dom.ts";
import * as graphicOrder from "#plate/interactions/graphic-order.dom.ts";
import * as hotspot from "#plate/interactions/hotspot.dom.ts";
import * as hottext from "#plate/interactions/hottext.dom.ts";
import * as match from "#plate/interactions/match.dom.ts";
import * as media from "#plate/interactions/media.dom.ts";
import * as order from "#plate/interactions/order.dom.ts";
import * as portableCustom from "#plate/interactions/portable-custom.dom.ts";
import * as positionObject from "#plate/interactions/position-object.dom.ts";
import * as selectPoint from "#plate/interactions/select-point.dom.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { contentRuntimeSlots, runtimeKinds, upgradeWith } from "#plate/runtime/contract.dom.ts";
import type {
  ContentController,
  ContentSlot,
  Controller,
  RuntimeKind,
} from "#plate/runtime/contract.dom.ts";

/**
 * Every runtime kind's controller module, `src/interactions/<kind>.dom.ts`, as its namespace, by
 * the kind it is named for.
 */
const controllerModules = {
  associate,
  drawing,
  "gap-match": gapMatch,
  "graphic-associate": graphicAssociate,
  "graphic-gap-match": graphicGapMatch,
  "graphic-order": graphicOrder,
  hotspot,
  hottext,
  match,
  media,
  order,
  "portable-custom": portableCustom,
  "position-object": positionObject,
  "select-point": selectPoint,
} satisfies { readonly [K in RuntimeKind]: { readonly controller: Controller<K> } };

/**
 * Every content slot's controller module, `src/content/<name>.dom.ts`, as its namespace, by the
 * slot it upgrades: the item Root's is `src/content/root.dom.ts`.
 */
const contentModules = {
  item: itemRoot,
  "modal-feedback": modalFeedback,
} satisfies { readonly [S in ContentSlot]: { readonly controller: ContentController<S> } };

/**
 * The content slots whose root sits inside an item, beside its interactions: every slot but the
 * item Root, which is the item itself and has its own cases below.
 */
const nestedContentSlots = contentRuntimeSlots.filter((slot) => slot !== "item");

/**
 * Put one item holding one interaction root of a kind at the end of the page's body.
 *
 * @param kind The root's kind, which its `data-slot` marker names.
 * @returns The container, which the caller removes, the item's Root, and the interaction's root.
 */
const mountRoot = (kind: string) => {
  const container = document.createElement("div");

  container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="${kind}-interaction"></div></div>`;
  document.body.append(container);

  const item = container.querySelector<HTMLElement>('[data-slot="item"]');
  const root = container.querySelector<HTMLElement>(`[data-slot="${kind}-interaction"]`);

  assert.isNotNull(item, kind);
  assert.isNotNull(root, kind);

  return { container, item, root };
};

/**
 * Put one item at the end of the page's body, holding its live part and nothing else.
 *
 * @returns The container, which the caller removes, and the item's Root.
 */
const mountItem = () => {
  const container = document.createElement("div");

  container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div></div>`;
  document.body.append(container);

  const root = container.querySelector<HTMLElement>('[data-slot="item"]');

  assert.isNotNull(root);

  return { container, root };
};

/**
 * Wait for two animation frames, so a text a live region writes on the next frame is written.
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

describe(server.browser, () => {
  describe("the registry", () => {
    it("[runtime] the registry holds one controller per runtime kind, each declaring its own kind", () => {
      for (const kind of runtimeKinds) {
        const { container, item, root } = mountRoot(kind);
        const upgraded = upgrade(container);

        assert.deepStrictEqual(
          upgraded.controllers,
          [
            { kind, root },
            { root: item, slot: "item" },
          ],
          kind,
        );
        assert.strictEqual(
          root.dataset["runtime"],
          controllerModules[kind].controller.implemented ? undefined : "stub",
          kind,
        );

        upgraded.teardown();
        assert.isUndefined(root.dataset["runtime"], kind);
        assert.isUndefined(item.dataset["runtime"], kind);
        container.remove();
      }
    });

    it("[W0-BC] the runtime finds a content root by slot and marks a stub", () => {
      for (const slot of nestedContentSlots) {
        const container = document.createElement("div");

        container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="gap-match-interaction"></div><div data-slot="${slot}"></div></div>`;
        document.body.append(container);

        const interaction = container.querySelector<HTMLElement>(
          '[data-slot="gap-match-interaction"]',
        );
        const content = container.querySelector<HTMLElement>(`[data-slot="${slot}"]`);

        assert.isNotNull(interaction, slot);
        assert.isNotNull(content, slot);

        const upgraded = upgrade(container);

        assert.deepStrictEqual(
          upgraded.controllers,
          [
            { kind: "gap-match", root: interaction },
            { root: content, slot },
          ],
          slot,
        );
        assert.strictEqual(
          content.dataset["runtime"],
          contentModules[slot].controller.implemented ? undefined : "stub",
          slot,
        );

        upgraded.teardown();
        container.remove();
      }
    });

    it("[W0-BC] teardown removes the content stub's mark and a second upgrade re-attaches it", () => {
      for (const slot of nestedContentSlots) {
        const container = document.createElement("div");

        container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="gap-match-interaction"></div><div data-slot="${slot}"></div></div>`;
        document.body.append(container);

        const first = upgrade(container);

        assert.lengthOf(first.controllers, 2, slot);
        assert.isAbove(container.querySelectorAll("[data-runtime]").length, 0, slot);

        first.teardown();
        assert.lengthOf(container.querySelectorAll("[data-runtime]"), 0, slot);

        const second = upgrade(container);

        assert.deepStrictEqual(second.controllers, first.controllers, slot);

        second.teardown();
        assert.lengthOf(container.querySelectorAll("[data-runtime]"), 0, slot);
        container.remove();
      }
    });

    it("[runtime] every content slot's module exports a controller of its slot and no other name", () => {
      assert.sameMembers(Object.keys(contentModules), [...contentRuntimeSlots]);

      for (const [slot, module] of Object.entries(contentModules)) {
        assert.deepStrictEqual(Object.keys(module), ["controller"], slot);
        assert.strictEqual(module.controller.slot, slot, slot);
      }
    });

    it("[runtime] every runtime-kind module exports a controller of its kind and no other name", () => {
      assert.sameMembers(Object.keys(controllerModules), [...runtimeKinds]);

      for (const [kind, module] of Object.entries(controllerModules)) {
        assert.deepStrictEqual(Object.keys(module), ["controller"], kind);
        assert.strictEqual(module.controller.kind, kind, kind);
      }
    });

    it("[W0-ROOT-CTRL] the registry holds a controller for the item slot, declaring it", () => {
      assert.include(contentRuntimeSlots, "item");
      assert.sameMembers(Object.keys(contentModules), [...contentRuntimeSlots]);
      assert.deepStrictEqual(Object.keys(itemRoot), ["controller"]);
      assert.strictEqual(itemRoot.controller.slot, "item");

      const { container, root } = mountItem();
      const upgraded = upgrade(container);

      assert.deepStrictEqual(upgraded.controllers, [{ root, slot: "item" }]);

      upgraded.teardown();
      container.remove();
    });

    it("[W0-ROOT-CTRL] a Root is upgraded once and marked while the controller is a stub", () => {
      const { container, root } = mountItem();
      const upgraded = upgrade(container);

      assert.deepStrictEqual(upgraded.controllers, [{ root, slot: "item" }]);
      assert.strictEqual(
        root.dataset["runtime"],
        itemRoot.controller.implemented ? undefined : "stub",
      );

      upgraded.teardown();
      assert.isUndefined(root.dataset["runtime"]);

      const again = upgrade(container);

      assert.deepStrictEqual(again.controllers, [{ root, slot: "item" }]);

      again.teardown();
      container.remove();
    });

    it("[W0-ROOT-CTRL] a second upgrade over an upgraded Root attaches nothing more", async () => {
      const { container, root } = mountItem();
      const first = upgrade(container);
      const second = upgrade(container);

      assert.deepStrictEqual(first.controllers, [{ root, slot: "item" }]);
      assert.deepStrictEqual(second.controllers, []);

      first.teardown();
      container.remove();

      const nested = document.createElement("div");

      nested.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div></div></div>`;
      document.body.append(nested);

      const [outer, inner] = nested.querySelectorAll<HTMLElement>('[data-slot="item"]');
      const [outerLive, innerLive] =
        nested.querySelectorAll<HTMLElement>('[data-slot="item-live"]');

      assert.isDefined(outer);
      assert.isDefined(inner);
      assert.isDefined(outerLive);
      assert.isDefined(innerLive);

      const whole = upgrade(nested);

      assert.deepStrictEqual(whole.controllers, [
        { root: outer, slot: "item" },
        { root: inner, slot: "item" },
      ]);
      assert.deepStrictEqual(upgrade(nested).controllers, []);
      assert.deepStrictEqual(upgrade(outer).controllers, []);
      assert.deepStrictEqual(upgrade(inner).controllers, []);
      assert.lengthOf(nested.querySelectorAll("[data-runtime]"), 2);

      whole.teardown();
      assert.lengthOf(nested.querySelectorAll("[data-runtime]"), 0);

      const torn: HTMLElement[] = [];
      const announcer: ContentController<"item"> = {
        implemented: true,
        slot: "item",
        upgrade: (element, live) => {
          live.announce(element === outer ? "outer" : "inner");

          return () => {
            torn.push(element);
          };
        },
      };
      const announced = upgradeWith({ content: { item: announcer } }, nested);

      await frames();

      assert.deepStrictEqual(announced.controllers, [
        { root: outer, slot: "item" },
        { root: inner, slot: "item" },
      ]);
      assert.strictEqual(outerLive.textContent, "outer");
      assert.strictEqual(innerLive.textContent, "inner");

      announced.teardown();
      assert.deepStrictEqual(torn, [inner, outer]);
      nested.remove();
    });
  });
});
