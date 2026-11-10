/**
 * Gap Match's (Q-6) runtime controller: a rendered Gap Match answers by keyboard alone and by
 * single pointer without dragging, on the select-then-place protocol (issue m3d-04).
 *
 * The gap texts are the protocol's tokens and the gaps its targets, in document order. A gap holds
 * one gap text; a gap text fills at most its `match-max` gaps and is refused once it has, and one
 * with a `match-group` fills only the gaps it names. Every step is announced through the item's
 * live region, the response is written as one hidden input per pair under the root's entry name
 * (decision D2), and a placed gap text shows inside its gap. The server's `checkResponses` still
 * refuses a response the page let through.
 *
 * @module
 */
import { viewOf } from "#plate/interactions/gap-match-view.dom.ts";
import type { GapPlacement } from "#plate/interactions/gap-match-view.dom.ts";
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
 * Gap Match's controller: its upgrade starts the select-then-place protocol over the root's gap
 * texts and gaps, from the pairs its hidden inputs already hold, and its teardown removes every
 * listener and attribute the upgrade added and gives the gaps back as the SSR wrote them, leaving
 * the hidden inputs, which carry the response.
 *
 * A root without an entry name to post under, or one that is finished (`data-mode` `review` or
 * `solution`, or `data-disabled`), gets nothing attached. A root without gap texts or gaps gets
 * the protocol over none. The upgrade moves no focus and announces nothing.
 */
export const controller: Controller<"gap-match"> = {
  implemented: true,
  kind: "gap-match",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    const name = entryNameOf(root);

    if (name === undefined || isFinished(root)) {
      return attachedNothing;
    }

    const view = viewOf(root);
    let current: readonly GapPlacement[] = view.restored(readHidden(root, name));

    view.show(current);

    const stop = driveSelectPlace({
      available: view.available,
      capacity: (gap) => {
        const token = view.held();

        return token !== undefined && !view.admits(token, gap) ? 0 : 1;
      },
      label: view.labelOf,
      live: {
        announce: (text) => {
          live.announce(view.refusal(text, current) ?? text);
        },
      },
      onChange: (placements) => {
        current = placements;
        writeHidden(root, name, placements.map(view.pairOf));
        view.show(placements);
      },
      placementOf: (element) => view.placementOf(current, element),
      placements: current,
      root,
      targets: view.gaps,
      tokens: view.tokens,
    });

    return () => {
      stop();
      view.restore();
    };
  },
};
