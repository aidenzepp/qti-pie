/**
 * Graphic Order's (Q-9) runtime controller: a rendered Graphic Order is ordered by keyboard alone
 * and by single pointer without dragging, on the select-then-place protocol (issue ei-11).
 *
 * The hotspots over the image are the protocol's tokens and the positions beside it its targets, in
 * document order; `data-max-choices` positions are offered. A hotspot appears once in the order. A
 * hotspot placed on a taken position sends the earlier one back to the source, or, when the moved
 * hotspot was itself in a position, swaps with it. Every step is announced through the item's live
 * region with the position it reached, the order is written as one hidden input per placed hotspot
 * in position order under the root's entry name (decision D2), each ordered hotspot shows its
 * position as a badge on the image, and each position shows the hotspot placed in it. The server's
 * `checkResponses` still refuses a response the page let through.
 *
 * @module
 */
import { samePlacements, viewOf } from "#plate/interactions/graphic-order-view.dom.ts";
import type { OrderPlacement } from "#plate/interactions/graphic-order-view.dom.ts";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Controller, Teardown } from "#plate/runtime/contract.dom.ts";
import { driveSelectPlace } from "#plate/runtime/select-place-driver.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * Undo an upgrade that attached nothing.
 */
const attachedNothing: Teardown = (): void => undefined;

/**
 * Tell whether a root is a finished item, which gets no input behaviour: shown in `review` or
 * `solution`, or disabled by the author.
 *
 * @param root The interaction's root.
 * @returns True for a finished item.
 */
const isFinished = (root: HTMLElement): boolean =>
  root.dataset["mode"] === "review" ||
  root.dataset["mode"] === "solution" ||
  Object.hasOwn(root.dataset, "disabled");

/**
 * Graphic Order's controller: its upgrade starts the select-then-place protocol over the root's
 * hotspots and positions, from the order its hidden inputs already hold, and its teardown removes
 * every listener and attribute the upgrade added and gives the hotspots and positions back as the
 * SSR wrote them, leaving the hidden inputs, which carry the response.
 *
 * The protocol appends a placement and refuses a position past its capacity, and it keeps the
 * placements it was started with: it knows neither that a hotspot appears once nor that a taken
 * position sends its hotspot back. The controller therefore gives every position room for the
 * placement, settles the placements the protocol reports, and, when settling changed them, starts
 * the driver again from the settled ones, so the protocol never holds a placement the page does not
 * show. The restart happens inside the driver's own event handler, which finishes with the
 * superseded driver's last step; that step writes the same attributes the new driver wrote, since
 * both read the one settled order.
 *
 * Delete or Backspace on a position, or a click on one with nothing held, returns its hotspot to
 * the source; a click on an ordered hotspot picks it up to move it.
 *
 * A root without an entry name to post under, or one that is finished (`data-mode` `review` or
 * `solution`, or `data-disabled`), gets nothing attached. A root without hotspots or positions gets
 * the protocol over none. The upgrade moves no focus and announces nothing.
 */
export const controller: Controller<"graphic-order"> = {
  implemented: true,
  kind: "graphic-order",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    const name = entryNameOf(root);

    if (name === undefined || isFinished(root)) {
      return attachedNothing;
    }

    const view = viewOf(root);
    let current: readonly OrderPlacement[] = view.restored(readHidden(root, name));
    let stop: Teardown = attachedNothing;

    /**
     * Run the driver over the hotspots and positions from some placements.
     *
     * @param placements The placements to start from.
     * @returns The driver's teardown.
     */
    const start = (placements: readonly OrderPlacement[]): Teardown =>
      driveSelectPlace({
        capacity: () => Infinity,
        label: view.labelOf,
        live: {
          announce: (text) => {
            live.announce(view.spoken(text, current));
          },
        },
        onChange: (made) => {
          const settled = view.settle(current, made);

          current = settled;
          writeHidden(root, name, settled.map(view.valueOf));
          view.show(settled);

          if (!samePlacements(made, settled)) {
            stop();
            stop = start(settled);
          }
        },
        placementOf: (element) => view.placementOf(current, element),
        placements,
        root,
        targets: view.positions,
        tokens: view.hotspots,
      });

    stop = start(current);

    return () => {
      stop();
      view.restore();
    };
  },
};
