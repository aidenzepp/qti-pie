/**
 * Match's (Q-13) runtime controller, a stub until issue m3d-12 fills it with Match's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Match's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows the
 * registry reached it, and does nothing else; its teardown removes the mark. Issue m3d-12 fills it.
 */
export const controller: Controller<"match"> = {
  kind: "match",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
