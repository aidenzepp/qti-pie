/**
 * The Portable Custom Interaction's (Q-16) runtime controller, a stub until issue pci-04 fills it
 * with the Portable Custom Interaction's behaviour.
 *
 * @module
 */
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * The Portable Custom Interaction's controller, a stub: its upgrade marks the root
 * `data-runtime="stub"`, so a page shows the registry reached it, and does nothing else; its
 * teardown removes the mark. Issue pci-04 fills it.
 */
export const controller: Controller<"portable-custom"> = {
  kind: "portable-custom",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
