/**
 * Order's (Q-15) runtime controller, a stub until issue ei-07 fills it with Order's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Order's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows the
 * registry reached it, and does nothing else; its teardown removes the mark. Issue ei-07 fills it.
 */
export const controller: Controller<"order"> = {
  implemented: false,
  kind: "order",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
