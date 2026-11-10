/**
 * Hot Text's (Q-11) runtime controller, a stub until issue m3d-10 fills it with Hot Text's
 * behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * Hot Text's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page shows
 * the registry reached it, and does nothing else; its teardown removes the mark. Issue m3d-10
 * fills it.
 */
export const controller: Controller<"hottext"> = {
  implemented: false,
  kind: "hottext",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
