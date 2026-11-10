/**
 * Associate's (Q-1) runtime controller: a rendered Associate answers by keyboard alone and by
 * single pointer without dragging, on the select-then-place protocol (issue ei-05).
 *
 * The choices are both the protocol's tokens and its targets: a choice is picked up, the arrow keys
 * move through the choices, and placing it on another makes the pair. A pair is unordered, so
 * `A B` and `B A` are one pair, written once as the order it was made in; a choice is in at most
 * its `match-max` pairs and pairs only with the choices its `match-group` lists, and the response
 * holds at most `max-associations` pairs (0 is no limit for each). A choice with itself and a pair
 * already made are refused. Every step is announced through the item's live region, the response
 * is written as one hidden input per pair under the root's entry name (decision D2), and the list
 * of pairs shows what the response holds. The server's `checkResponses` still refuses a response
 * the page let through.
 *
 * @module
 */
import { viewOf } from "#plate/interactions/associate-view.dom.ts";
import type { PairPlacement } from "#plate/interactions/associate-view.dom.ts";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Controller, Teardown } from "#plate/runtime/contract.dom.ts";
import { driveSelectPlace } from "#plate/runtime/select-place-driver.dom.ts";
import { actionFor, announcements } from "#plate/runtime/select-place.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * Undo an upgrade that attached nothing.
 */
const attachedNothing: Teardown = (): void => undefined;

/**
 * A refusal the protocol is about to announce as a full target, with the sentence that says why.
 */
interface Refusal {
  /**
   * What the protocol announces: the target is full.
   */
  readonly heard: string;

  /**
   * What Associate announces in its place.
   */
  readonly said: string;
}

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
 * Associate's (Q-1, the `associate` kind) controller: its upgrade starts the select-then-place
 * protocol over the root's choices, from the pairs its hidden inputs already hold, and its teardown
 * removes every listener and attribute the upgrade added and gives the list of pairs back as the
 * SSR wrote it, leaving the hidden inputs, which carry the response.
 *
 * A root without an entry name to post under, or one that is finished (`data-mode` `review` or
 * `solution`, or `data-disabled`), gets nothing attached. A root without choices gets the protocol
 * over none. The upgrade moves no focus and announces nothing.
 */
export const controller: Controller<"associate"> = {
  implemented: true,
  kind: "associate",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    const name = entryNameOf(root);

    if (name === undefined || isFinished(root)) {
      return attachedNothing;
    }

    const view = viewOf(root);
    let current: readonly PairPlacement[] = view.restored(readHidden(root, name));
    let refusal: Refusal | undefined;

    view.show(current);

    /**
     * Announce why a choice cannot be picked up when the user tries. The driver ignores a choice
     * marked unavailable without a word, so a user of a screen reader who presses Space on it
     * would otherwise hear nothing.
     *
     * @param target The element the key was pressed on or the click landed on.
     */
    const refusePickUp = (target: EventTarget | null): void => {
      if (!(target instanceof Element) || view.held() !== undefined) {
        return;
      }

      const choice = view.choiceAt(target);
      const reason = choice === undefined ? undefined : view.pickUpRefusal(choice, current);

      if (reason !== undefined) {
        live.announce(reason);
      }
    };

    /**
     * Take a key pressed under the root: a pick-up key on a choice that cannot be picked up.
     *
     * @param event The `keydown` event.
     */
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        actionFor("source", event.key) === "pickUp"
      ) {
        refusePickUp(event.target);
      }
    };

    /**
     * Take a click under the root: a click on a choice that cannot be picked up.
     *
     * @param event The `click` event.
     */
    const onClick = (event: MouseEvent): void => {
      refusePickUp(event.target);
    };

    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("click", onClick);

    const stop = driveSelectPlace({
      available: view.available,
      /**
       * A choice admits the held choice or refuses it, as `pairRefusal` decides. The protocol
       * announces a refusal as "is full" the moment this returns, so the reason it found is kept
       * for the announcement below to say in its place.
       *
       * @param target The choice the held choice would be placed on.
       * @returns No limit when the pair may be made, else 0.
       */
      capacity: (target) => {
        const token = view.held();
        const said = token === undefined ? undefined : view.pairRefusal(token, target, current);

        if (said === undefined) {
          return Infinity;
        }

        refusal = { heard: announcements.full(view.labelOf(target)), said };

        return 0;
      },
      label: view.labelOf,
      live: {
        announce: (text) => {
          const pending = refusal;

          refusal = undefined;
          live.announce(
            pending !== undefined && text === pending.heard
              ? pending.said
              : (view.reworded(text) ?? text),
          );
        },
      },
      onChange: (placements) => {
        // The protocol announces "placed in" or "returned to the source" just before it calls this,
        // and the live region writes only the last text announced before its next frame
        // (`liveRegionOf`), so the sentences below replace those two.
        const before = current;
        const removed = before.find((placement) => !placements.includes(placement));
        const made = placements.find((placement) => !before.includes(placement));

        current = placements;
        writeHidden(root, name, placements.map(view.pairOf));
        view.show(placements);

        if (made !== undefined) {
          live.announce(view.madeText(made));
        } else if (removed !== undefined) {
          live.announce(view.removedText(removed));
        }
      },
      placementOf: view.placementOf,
      placements: current,
      root,
      targets: view.choices,
      tokens: view.choices,
    });

    return () => {
      stop();
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("click", onClick);
      view.restore();
    };
  },
};
