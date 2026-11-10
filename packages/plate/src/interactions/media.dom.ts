/**
 * Media's (Q-14) runtime controller, a stub until issue ei-03 fills it with Media's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Media's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows the
 * registry reached it, and does nothing else; its teardown removes the mark. Issue ei-03 fills it.
 */
export const controller: Controller<"media"> = {
  implemented: false,
  kind: "media",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
