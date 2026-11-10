/**
 * Order's (Q-15) runtime controller: a rendered Order is reordered by keyboard alone and by single
 * pointer without dragging, on the select-then-place protocol (issue ei-07).
 *
 * The choices are the protocol's tokens and the positions its targets, in order. A choice is picked
 * up from the source list or from a position, moved through the positions, and placed in one; a
 * choice placed on a taken position sends the taken one back to the source, or, when the picked
 * choice came from a position, swaps with it. A placed choice goes back to the source with Delete
 * or Backspace, or a click. Every step is announced through the item's live region, and the
 * response is written as one hidden input per placed choice, in position order, under the root's
 * entry name (decision D2). The server's `checkResponses` still refuses a response the page let
 * through.
 *
 * @module
 */
import { viewOf } from "#plate/interactions/order-view.dom.ts";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Controller, Teardown } from "#plate/runtime/contract.dom.ts";
import { driveSelectPlace } from "#plate/runtime/select-place-driver.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * Undo an upgrade that attached nothing.
 */
const attachedNothing: Teardown = (): void => undefined;

/**
 * The most choices a position holds while the machine settles a placement: the choice already
 * there and the one being placed. The machine refuses a position that is full, so this admits the
 * incoming choice, and the view then settles the pair before the next step.
 */
const settlingCapacity = 2;

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
 * Order's (Q-15) controller, for the `order` kind: its upgrade starts the select-then-place
 * protocol over the root's choices and positions, from the order its hidden inputs already hold,
 * and its teardown removes every listener and attribute the upgrade added and gives the list and
 * the positions back as the SSR wrote them, leaving the hidden inputs, which carry the response.
 *
 * A root without an entry name to post under, or one that is finished (`data-mode` `review` or
 * `solution`, or `data-disabled`), or one without its source list, a position or a choice, gets
 * nothing attached. The upgrade moves no focus and announces nothing.
 *
 * The machine records a placement as one more entry, so after each placement or return the
 * controller settles the order in the view, writes the hidden inputs, and, once the driver has
 * finished handling the event, starts the driver again over the settled order. A driver started
 * over the order the machine holds has no stale entry to trip on.
 */
export const controller: Controller<"order"> = {
  implemented: true,
  kind: "order",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    const name = entryNameOf(root);

    if (name === undefined || isFinished(root)) {
      return attachedNothing;
    }

    const view = viewOf(root);

    if (view === undefined) {
      return attachedNothing;
    }

    view.start(readHidden(root, name));

    let spoken = "";
    let changed = false;
    let release: Teardown = attachedNothing;

    const speak: LiveRegion = {
      announce: (text) => {
        spoken = view.phrase(text);
        live.announce(spoken);
      },
    };

    /**
     * Start the driver over the order the view stands in, and a listener after it that starts it
     * over again once an event has changed the order.
     *
     * The driver's own listeners run first, since they were added first on the same root, so the
     * machine has finished its step, and the driver its own marks, when the listener runs.
     *
     * @returns The teardown of this driver and its listener.
     */
    const bind = (): Teardown => {
      const stop = driveSelectPlace({
        capacity: () => settlingCapacity,
        label: view.labelOf,
        live: speak,
        onChange: (placements) => {
          const addition = view.apply(placements);

          writeHidden(root, name, view.identifiers());
          changed = true;

          if (addition !== "") {
            spoken = `${spoken} ${addition}`;
            live.announce(spoken);
          }
        },
        placementOf: view.placementOf,
        placements: view.placements(),
        root,
        targets: view.slots,
        tokens: view.tokens,
      });
      const ended = new AbortController();

      /**
       * End this driver and start the next over the settled order, when the event that just ran
       * changed it.
       */
      const settle = (): void => {
        if (!changed) {
          return;
        }

        changed = false;
        ended.abort();
        stop();
        release = bind();
      };

      root.addEventListener("click", settle, { signal: ended.signal });
      root.addEventListener("keydown", settle, { signal: ended.signal });
      view.keepSlotsOutOfTabOrder();

      return () => {
        ended.abort();
        stop();
      };
    };

    release = bind();

    return () => {
      release();
      view.restore();
    };
  },
};
