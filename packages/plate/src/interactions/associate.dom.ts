/**
 * Associate's (Q-1) runtime controller, a stub until issue ei-05 fills it with Associate's
 * behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Associate's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows
 * the registry reached it, and does nothing else; its teardown removes the mark. Issue ei-05 fills
 * it.
 */
export const controller: Controller<"associate"> = {
  implemented: false,
  kind: "associate",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
