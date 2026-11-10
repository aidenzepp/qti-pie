/**
 * Graphic Gap Match's (Q-8) runtime controller, a stub until issue m3d-06 fills it with Graphic Gap
 * Match's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Graphic Gap Match's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a
 * page shows the registry reached it, and does nothing else; its teardown removes the mark. Issue
 * m3d-06 fills it.
 */
export const controller: Controller<"graphic-gap-match"> = {
  kind: "graphic-gap-match",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
