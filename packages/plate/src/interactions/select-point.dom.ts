/**
 * Select Point's (Q-18) runtime controller, a stub until issue ei-15 fills it with Select Point's
 * behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Select Point's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page
 * shows the registry reached it, and does nothing else; its teardown removes the mark. Issue ei-15
 * fills it.
 */
export const controller: Controller<"select-point"> = {
  kind: "select-point",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
