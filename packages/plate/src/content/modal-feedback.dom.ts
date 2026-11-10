/**
 * Modal Feedback's runtime controller, a stub until issue m5-01 fills it with the behaviour its
 * native `dialog` cannot give alone, such as returning focus.
 *
 * @module
 */
import type { ContentController } from "#plate/runtime/contract.dom.ts";

/**
 * Modal Feedback's controller, a stub: its upgrade marks the root `data-runtime="stub"`, so a page
 * shows the registry reached it, and does nothing else; its teardown removes the mark. It follows
 * decision D1, as every controller does: no custom element, the runtime upgrades the root the
 * server rendered, found by its `data-slot="modal-feedback"`. Issue m5-01, the first content module
 * with a controller, fills it.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-arguments -- `ContentSlot` has one member today, so the slot is the parameter's default; naming it keeps the stub typed to its own slot when a second slot lands.
export const controller: ContentController<"modal-feedback"> = {
  implemented: false,
  slot: "modal-feedback",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
