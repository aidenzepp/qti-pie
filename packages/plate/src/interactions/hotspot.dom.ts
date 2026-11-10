/**
 * Hotspot's (Q-10) runtime controller: a rendered Hotspot keeps its native controls as the whole of
 * its input, and gains what its stylesheet and controls cannot give (issue m3d-08).
 *
 * The core's SVG shapes already take a click inside the real shape natively, a circle, an ellipse
 * or a polygon and not only its bounding box, but where two overlap the later hotspot lies above
 * the earlier one, and without the stylesheet the shapes are not over the image at all. So the
 * controller decides which hotspot a click on the image selects from the areas themselves: the one
 * listed first where areas overlap, and the default hotspot where no area holds the point.
 * Selecting past `max-choices` is undone and announced through the item's live region, as is each
 * selection's count. The controls are never replaced, the controller posts nothing, and it calls no
 * `focus()`.
 *
 * @module
 */
import {
  areasOf,
  controlSlot,
  imageSlot,
  labelSlot,
  pointOf,
  winnerOf,
} from "#plate/interactions/hotspot-hit.dom.ts";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Controller, Teardown } from "#plate/runtime/contract.dom.ts";

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
 * Read the most hotspots the candidate may choose from the Root's `data-max-choices`, the count the
 * Order and Graphic Order cores write for their runtimes.
 *
 * @param root The interaction's root.
 * @returns The limit, or `undefined` for no limit: `max-choices` 0, or no count written.
 */
const limitOf = (root: HTMLElement): number | undefined => {
  const written = Number(root.dataset["maxChoices"] ?? "");

  return Number.isInteger(written) && written > 0 ? written : undefined;
};

/**
 * Say what a selection past the limit was refused for.
 *
 * @param limit The most hotspots the candidate may choose.
 * @returns The announcement.
 */
const atMost = (limit: number): string => `You can choose at most ${String(limit)}.`;

/**
 * Say how many hotspots are chosen.
 *
 * @param count The number chosen.
 * @param limit The most the candidate may choose, when there is a limit.
 * @returns The announcement.
 */
const chosen = (count: number, limit: number | undefined): string =>
  limit === undefined ? `${String(count)} chosen.` : `${String(count)} of ${String(limit)} chosen.`;

/**
 * Find the Hotspot Control an event's target is, or sits inside.
 *
 * @param target The event's target.
 * @returns The Control, or `undefined` for any other target.
 */
const controlOf = (target: EventTarget | null): HTMLInputElement | undefined => {
  const control = target instanceof Element ? target.closest(`[data-slot="${controlSlot}"]`) : null;

  return control instanceof HTMLInputElement ? control : undefined;
};

/**
 * Count the Controls of a root that are checked.
 *
 * @param root The interaction's root.
 * @returns The number of checked Controls.
 */
const checkedCount = (root: HTMLElement): number =>
  [...root.querySelectorAll<HTMLInputElement>(`input[data-slot="${controlSlot}"]`)].filter(
    (control) => control.checked,
  ).length;

/**
 * Hotspot's controller: its upgrade listens for the click on the image, and for the clicks and
 * changes of the Controls, and its teardown removes those listeners, leaving the root as the SSR
 * wrote it.
 *
 * - A pointer click on the image (not on a Control or Label, which act natively) is mapped from the
 *   rendered image back to the image's own pixels. Its own default is cancelled, so the shape under
 *   the pointer toggles nothing, and the hotspot whose area holds the point, the first listed or
 *   else the default, gets `click()` on its Control, so the control toggles and fires its own
 *   events.
 * - A checkbox that would pass the limit is refused: its click is cancelled, so it stays as it was
 *   and fires no event, and the live region says "You can choose at most N."
 * - Each change of a checkbox announces the count, "N of M chosen." (or "N chosen." with no limit). A
 *   radio group announces nothing: its control states its own selection.
 *
 * The limit is the root's `data-max-choices`; a root that does not carry it has no limit enforced.
 * A finished root (`data-mode` `review` or `solution`, or `data-disabled`) gets nothing attached. A
 * root with no image part has no pointer listener but still counts and limits its Controls. The
 * upgrade moves no focus and announces nothing.
 */
export const controller: Controller<"hotspot"> = {
  implemented: true,
  kind: "hotspot",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    if (isFinished(root)) {
      return attachedNothing;
    }

    const part = root.querySelector<HTMLElement>(`[data-slot="${imageSlot}"]`);

    const onImageClick = (event: MouseEvent): void => {
      const { target } = event;

      if (
        event.defaultPrevented ||
        part === null ||
        !(target instanceof Element) ||
        target.closest(`[data-slot="${controlSlot}"], [data-slot="${labelSlot}"]`) !== null
      ) {
        return;
      }

      const point = pointOf(part, event);
      const winner = point === undefined ? undefined : winnerOf(areasOf(root), point);

      if (winner === undefined) {
        return;
      }

      event.preventDefault();

      if (!winner.control.disabled) {
        winner.control.click();
      }
    };

    const onControlClick = (event: MouseEvent): void => {
      const control = controlOf(event.target);
      const limit = limitOf(root);

      if (control === undefined || control.type !== "checkbox" || !control.checked) {
        return;
      }

      if (limit === undefined || checkedCount(root) <= limit) {
        return;
      }

      event.preventDefault();
      live.announce(atMost(limit));
    };

    const onChange = (event: Event): void => {
      const control = controlOf(event.target);

      if (control !== undefined && control.type === "checkbox") {
        live.announce(chosen(checkedCount(root), limitOf(root)));
      }
    };

    part?.addEventListener("click", onImageClick);
    root.addEventListener("click", onControlClick);
    root.addEventListener("change", onChange);

    return () => {
      part?.removeEventListener("click", onImageClick);
      root.removeEventListener("click", onControlClick);
      root.removeEventListener("change", onChange);
    };
  },
};
