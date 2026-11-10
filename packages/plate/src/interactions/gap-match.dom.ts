/**
 * Gap Match's (Q-6) runtime controller, a stub until issue m3d-04 fills it with Gap Match's
 * behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Gap Match's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows
 * the registry reached it, and does nothing else; its teardown removes the mark. Issue m3d-04
 * fills it.
 */
export const controller: Controller<"gap-match"> = {
  kind: "gap-match",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
