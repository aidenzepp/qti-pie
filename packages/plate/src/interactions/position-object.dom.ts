/**
 * Position Object's (Q-17) runtime controller, a stub until issue ei-13 fills it with Position
 * Object's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Position Object's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page
 * shows the registry reached it, and does nothing else; its teardown removes the mark. Issue ei-13
 * fills it.
 */
export const controller: Controller<"position-object"> = {
  kind: "position-object",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
