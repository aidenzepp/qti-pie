/**
 * Graphic Associate's (Q-7) runtime controller, a stub until issue ei-09 fills it with Graphic
 * Associate's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Graphic Associate's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a
 * page shows the registry reached it, and does nothing else; its teardown removes the mark. Issue
 * ei-09 fills it.
 */
export const controller: Controller<"graphic-associate"> = {
  kind: "graphic-associate",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
