/**
 * Graphic Order's (Q-9) runtime controller, a stub until issue ei-11 fills it with Graphic Order's
 * behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Graphic Order's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page
 * shows the registry reached it, and does nothing else; its teardown removes the mark. Issue ei-11
 * fills it.
 */
export const controller: Controller<"graphic-order"> = {
  kind: "graphic-order",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
