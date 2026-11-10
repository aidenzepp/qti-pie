/**
 * Hotspot's (Q-10) runtime controller, a stub until issue m3d-08 fills it with Hotspot's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Hotspot's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows
 * the registry reached it, and does nothing else; its teardown removes the mark. Issue m3d-08
 * fills it.
 */
export const controller: Controller<"hotspot"> = {
  kind: "hotspot",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
