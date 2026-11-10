/**
 * Drawing's (Q-3) runtime controller, a stub until issue ei-18 fills it with Drawing's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Drawing's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows
 * the registry reached it, and does nothing else; its teardown removes the mark. Issue ei-18 fills
 * it.
 */
export const controller: Controller<"drawing"> = {
  kind: "drawing",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
