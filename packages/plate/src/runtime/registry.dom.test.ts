/**
 * The runtime's closed registry, in each engine's page: `upgrade` attaches one controller to a root
 * of every runtime kind, and each kind's controller module exports that controller alone.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { server } from "vite-plus/test/browser/context";
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
import { runtimeKinds } from "#plate/runtime/contract.dom.ts";
import type { Controller, RuntimeKind } from "#plate/runtime/contract.dom.ts";

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
 * Put one item holding one interaction root of a kind at the end of the page's body.
 *
 * @param kind The root's kind, which its `data-slot` marker names.
 * @returns The container, which the caller removes, and the root.
 */
const mountRoot = (kind: string) => {
  const container = document.createElement("div");

  container.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="${kind}-interaction"></div></div>`;
  document.body.append(container);

  const root = container.querySelector<HTMLElement>(`[data-slot="${kind}-interaction"]`);

  assert.isNotNull(root, kind);

  return { container, root };
};

describe(server.browser, () => {
  describe("the registry", () => {
    it("[runtime] the registry holds one controller per runtime kind, each declaring its own kind", () => {
      for (const kind of runtimeKinds) {
        const { container, root } = mountRoot(kind);
        const upgraded = upgrade(container);

        assert.deepStrictEqual(upgraded.controllers, [{ kind, root }], kind);
        assert.strictEqual(root.dataset["runtime"], "stub", kind);

        upgraded.teardown();
        container.remove();
      }
    });

    it("[runtime] every runtime-kind module exports a controller of its kind and no other name", () => {
      assert.sameMembers(Object.keys(controllerModules), [...runtimeKinds]);

      for (const [kind, module] of Object.entries(controllerModules)) {
        assert.deepStrictEqual(Object.keys(module), ["controller"], kind);
        assert.strictEqual(module.controller.kind, kind, kind);
      }
    });
  });
});
