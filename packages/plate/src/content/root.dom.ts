/**
 * The item Root's runtime controller, a stub until issue m3e-09b fills it: the Root, the chrome's
 * `data-slot="item"` element, is the one place a page-wide display preference reaches an item.
 *
 * @module
 */
import type { ContentController } from "#plate/runtime/contract.dom.ts";

/**
 * The item Root's controller, a stub: its upgrade marks the Root `data-runtime="stub"`, so a page
 * shows the registry reached it, and does nothing else; its teardown removes the mark. It never
 * moves focus and never announces. Issue m3e-09b fills it: the controller there reads the
 * magnification marker the Root carries and applies the text and background colours through the
 * CSSOM, an enhancement of the sheet's own contract, and then declares `implemented: true` and
 * drops the mark.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-arguments -- `ContentSlot` has one member until the modal-feedback slot lands, so the slot is the parameter's default; naming it keeps the stub typed to its own slot.
export const controller: ContentController<"item"> = {
  implemented: false,
  slot: "item",
  upgrade: (root) => {
    root.dataset["runtime"] = "stub";

    return () => {
      delete root.dataset["runtime"];
    };
  },
};
