/**
 * Graphic Associate's (Q-7, the `graphic-associate` kind) runtime controller: pairs of hotspots
 * made by select-then-place, by keyboard alone and by a single pointer without dragging (issue
 * ei-09).
 *
 * The hotspots are both the tokens and the targets of the select-then-place driver (issue m3d-02):
 * a hotspot is picked up, the arrow keys move a cursor through the hotspots over the image, and
 * Enter or a second click places it on one to make the pair. Each pair is one hidden input under
 * the root's entry name, `"<a> <b>"`, an item of the core's list of pairs, a `data-paired` mark on
 * its two hotspots and a line drawn between them in the core's outline layer. A hotspot at its
 * `match-max` cannot be picked up, and a pair outside a `match-group`, a hotspot with itself and a
 * pair already made are refused; each is announced through the item's live region.
 *
 * A finished, reviewed or solved item, whose root is not `data-mode="answering"` or is
 * `data-disabled`, gets no input behaviour and only its pairs drawn.
 *
 * @module
 */
import {
  createPairLines,
  createPairList,
  createPairMarks,
  hotspotsOf,
  matchLimitOf,
  nameOf,
  pairCountOf,
  pairLimitOf,
  pairsOfList,
  pairsOfPosted,
  pairsStartedBy,
  postedOf,
  reachDrawings,
  refusalOf,
  unavailableText,
  words,
} from "#plate/interactions/graphic-associate-view.dom.ts";
import type { HotspotPair } from "#plate/interactions/graphic-associate-view.dom.ts";
import type { Controller } from "#plate/runtime/contract.dom.ts";
import { driveSelectPlace } from "#plate/runtime/select-place-driver.dom.ts";
import { entryNameOf, readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * The keys that pick a hotspot up or place it, the two the controller checks a pair against.
 */
const actKeys: ReadonlySet<string> = new Set([" ", "Enter"]);

/**
 * Undo an upgrade that attached nothing.
 */
const nothing = (): void => undefined;

/**
 * Tell whether the item takes input: the root is shown for answering and the author did not finish
 * it.
 *
 * @param root The interaction's root.
 * @returns False for a root `data-mode` names `review` or `solution`, or that carries
 *   `data-disabled`; a root with no `data-mode` is answering.
 */
const takesInput = (root: HTMLElement): boolean =>
  (root.dataset["mode"] ?? "answering") === "answering" && !Object.hasOwn(root.dataset, "disabled");

/**
 * Graphic Associate's controller. Its upgrade finds the hotspots, the entry name and the pairs the
 * server wrote, and gives them the select-then-place behaviour; a root without an entry name or
 * without hotspots attaches nothing, and a root that takes no input only draws its pairs. It moves
 * no focus and announces nothing by itself. Its teardown removes every listener and every
 * attribute and node the upgrade added, and keeps the hidden inputs, which carry the response.
 */
export const controller: Controller<"graphic-associate"> = {
  implemented: true,
  kind: "graphic-associate",
  upgrade: (root, live) => {
    const hotspots = hotspotsOf(root);
    const name = entryNameOf(root);
    const lines = createPairLines();

    if (hotspots.length === 0) {
      return nothing;
    }

    if (name === undefined || !takesInput(root)) {
      lines.draw(pairsOfList(root, hotspots));

      return () => {
        lines.clear();
      };
    }

    const list = createPairList(root);
    const marks = createPairMarks(hotspots);
    const unreach = reachDrawings(hotspots);
    const pairLimit = pairLimitOf(root);
    let pairs: readonly HotspotPair[] = pairsOfPosted(readHidden(root, name), hotspots);

    /**
     * Show the pairs made: in the list, on the hotspots and as lines over the image.
     */
    const show = (): void => {
      list.show(pairs);
      marks.show(pairs);
      lines.draw(pairs);
    };

    /**
     * Find the hotspot held, which the driver marks `aria-pressed="true"`.
     *
     * @returns The hotspot, or `undefined` when none is held.
     */
    const held = (): HTMLElement | undefined =>
      hotspots.find((hotspot) => hotspot.getAttribute("aria-pressed") === "true");

    /**
     * Find the hotspot an event's target is or sits in.
     *
     * @param target The event's target.
     * @returns The hotspot, or `undefined` for an element in none.
     */
    const hotspotAt = (target: EventTarget | null): HTMLElement | undefined =>
      target instanceof Element ? hotspots.find((hotspot) => hotspot.contains(target)) : undefined;

    /**
     * Refuse a pick-up of a hotspot the driver marks unavailable, saying why. The driver ignores
     * it in silence.
     *
     * @param hotspot The hotspot the user acted on.
     */
    const explainUnavailable = (hotspot: HTMLElement): void => {
      if (hotspot.getAttribute("aria-disabled") === "true") {
        live.announce(unavailableText(hotspot, pairs, pairLimit));
      }
    };

    /**
     * Check, before the driver does, the pair a key would make, and stop the driver when it is
     * refused. The driver listens on the same root in the bubbling phase and returns on a
     * prevented event, so this runs first, in the capture phase.
     *
     * @param event The `keydown` event.
     */
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (!actKeys.has(event.key)) {
        return;
      }

      const token = held();

      if (token === undefined) {
        const hotspot = hotspotAt(event.target);

        if (hotspot !== undefined) {
          explainUnavailable(hotspot);
        }

        return;
      }

      const target = hotspots.find((hotspot) => Object.hasOwn(hotspot.dataset, "cursor"));
      const refusal =
        target === undefined ? undefined : refusalOf({ target, token }, pairs, pairLimit, hotspots);

      if (refusal !== undefined) {
        event.preventDefault();
        live.announce(refusal);
      }
    };

    /**
     * Check, before the driver does, the pair a click would make; a click on the hotspot held is
     * the driver's cancel.
     *
     * @param event The `click` event.
     */
    const onClick = (event: MouseEvent): void => {
      const target = event.defaultPrevented ? undefined : hotspotAt(event.target);

      if (target === undefined) {
        return;
      }

      const token = held();

      if (token === undefined) {
        explainUnavailable(target);

        return;
      }

      const refusal =
        token === target ? undefined : refusalOf({ target, token }, pairs, pairLimit, hotspots);

      if (refusal !== undefined) {
        event.preventDefault();
        live.announce(refusal);
      }
    };

    show();

    const stop = driveSelectPlace({
      available: (token, made) =>
        made.length < pairLimit && pairCountOf(token, made) < matchLimitOf(token),
      capacity: (target) => matchLimitOf(target) - pairsStartedBy(target, pairs),
      label: nameOf,
      live,
      onChange: (made) => {
        const before = pairs;
        const added = made.length > before.length ? made.at(-1) : undefined;
        const removed = before.find(
          (pair) =>
            !made.some(({ target, token }) => token === pair.token && target === pair.target),
        );

        pairs = made;
        writeHidden(root, name, made.map(postedOf));
        show();

        if (added !== undefined) {
          live.announce(words.made(nameOf(added.token), nameOf(added.target)));
        } else if (removed !== undefined) {
          live.announce(words.removed(nameOf(removed.token), nameOf(removed.target)));
        }
      },
      placementOf: list.pairOf,
      placements: pairs,
      root,
      targets: hotspots,
      tokens: hotspots,
    });

    root.addEventListener("keydown", onKeyDown, true);
    root.addEventListener("click", onClick, true);

    return () => {
      root.removeEventListener("keydown", onKeyDown, true);
      root.removeEventListener("click", onClick, true);
      stop();
      lines.clear();
      list.restore();
      marks.restore();
      unreach();
    };
  },
};
