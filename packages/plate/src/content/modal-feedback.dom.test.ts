/**
 * Modal Feedback's stub controller, in each engine's page: its upgrade marks the root and does
 * nothing else, and its teardown removes the mark.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { server } from "vite-plus/test/browser/context";
import * as modalFeedback from "#plate/content/modal-feedback.dom.ts";
import type { LiveRegion } from "#plate/runtime/contract.dom.ts";

describe(server.browser, () => {
  describe("the modal-feedback stub", () => {
    it("[W0-BC] the modal-feedback stub attaches nothing but its mark and tears down", () => {
      const { controller } = modalFeedback;
      const announced: string[] = [];
      const live: LiveRegion = {
        announce: (text) => {
          announced.push(text);
        },
      };
      const container = document.createElement("div");

      container.innerHTML =
        '<div data-slot="item"><div data-slot="modal-feedback"><p>Well done.</p></div></div>';
      document.body.append(container);

      const root = container.querySelector<HTMLElement>('[data-slot="modal-feedback"]');

      assert.isNotNull(root);
      assert.deepStrictEqual(Object.keys(modalFeedback), ["controller"]);
      assert.strictEqual(controller.slot, "modal-feedback");
      assert.isFalse(controller.implemented);

      const children = root.innerHTML;
      const teardown = controller.upgrade(root, live);

      assert.strictEqual(root.dataset["runtime"], "stub");
      assert.deepStrictEqual(root.getAttributeNames().toSorted(), ["data-runtime", "data-slot"]);
      assert.strictEqual(root.innerHTML, children);
      assert.deepStrictEqual(announced, []);

      teardown();
      assert.isUndefined(root.dataset["runtime"]);
      assert.deepStrictEqual(root.getAttributeNames(), ["data-slot"]);
      assert.strictEqual(root.innerHTML, children);
      container.remove();
    });
  });
});
