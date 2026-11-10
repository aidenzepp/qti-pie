/**
 * Hot Text's (Q-11) runtime controller: a rendered Hot Text keeps its native checkable controls,
 * set inline in the author's sentence, as the whole input, and gains the selection limit and the
 * count announced through the item's live region (issue m3d-10).
 *
 * The controls post the response themselves (decision D3), so the controller keeps no state and
 * writes no hidden input. A change that takes the checked count past the limit the Root states in
 * `data-max-choices` is undone on the control the candidate just changed, and the live region says
 * so; every other change announces the count chosen, or, in a radio group, the choice.
 * `max-choices` 0 is no limit. A finished item gets no behaviour, the server's `checkResponses`
 * still refuses a response the page let through, and the module imports nothing but runtime types:
 * the runtime's bundle carries no library.
 *
 * @module
 */
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";
import type { Controller, Teardown } from "#plate/runtime/contract.dom.ts";

/**
 * The `data-slot` marker of one Hot Text Control, which `hottext.ts` writes on each native radio or
 * checkbox.
 */
const controlSlot = "hottext-interaction-control";

/**
 * Undo an upgrade that attached nothing.
 */
const attachedNothing: Teardown = (): void => undefined;

/**
 * The announcements, English and local to this module until a later pass centralises the runtime's
 * strings.
 */
const announcements = {
  chosen: (choice: string): string => `${choice} chosen.`,
  count: (chosen: number, limit: number): string =>
    limit > 0 ? `${chosen} of ${limit} chosen.` : `${chosen} chosen.`,
  limit: (limit: number, choice: string): string =>
    `At most ${limit} can be chosen. ${choice} is not chosen.`,
} as const;

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
 * Read the most the candidate may choose, which the Root states as `data-max-choices`, the count as
 * written in the item.
 *
 * @param root The interaction's root.
 * @returns The count, 0 when the item states none or it is no count: no limit.
 */
const limitOf = (root: HTMLElement): number => {
  const written = Math.trunc(Number(root.dataset["maxChoices"] ?? ""));

  return Number.isNaN(written) || written < 0 ? 0 : written;
};

/**
 * Tell whether an event's target is a Hot Text Control.
 *
 * @param target The event's target.
 * @returns Whether it is an `input` carrying the Control marker.
 */
const isControl = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement && target.dataset["slot"] === controlSlot;

/**
 * Read what names a Control: its own `aria-label` when the hottext gave the renderer no words to
 * name it by, else the text of the Choice that holds it, with its whitespace collapsed.
 *
 * @param control The Control.
 * @returns Its name, empty when it has none.
 */
const nameOf = (control: HTMLInputElement): string =>
  (control.getAttribute("aria-label") ?? control.labels?.item(0)?.textContent ?? "")
    .replaceAll(/\s+/gu, " ")
    .trim();

/**
 * Hot Text's controller: its upgrade listens for changes among the root's Controls, and its
 * teardown removes that one listener, leaving the Controls as the candidate set them.
 *
 * A root without Controls, or one that is finished (`data-mode` `review` or `solution`, or
 * `data-disabled`), gets nothing attached. A root without `data-max-choices` limits nothing. The
 * upgrade moves no focus and announces nothing, and the undo of a check past the limit leaves
 * focus where the candidate put it.
 */
export const controller: Controller<"hottext"> = {
  implemented: true,
  kind: "hottext",
  upgrade: (root: HTMLElement, live: LiveRegion): Teardown => {
    if (isFinished(root) || root.querySelector(`input[data-slot="${controlSlot}"]`) === null) {
      return attachedNothing;
    }

    const limit = limitOf(root);
    const onChange = (event: Event): void => {
      const { target } = event;

      if (!isControl(target)) {
        return;
      }

      if (target.type === "radio") {
        live.announce(announcements.chosen(nameOf(target)));

        return;
      }

      const chosen = root.querySelectorAll(`input[data-slot="${controlSlot}"]:checked`).length;

      if (target.checked && limit > 0 && chosen > limit) {
        target.checked = false;
        live.announce(announcements.limit(limit, nameOf(target)));

        return;
      }

      live.announce(announcements.count(chosen, limit));
    };

    root.addEventListener("change", onChange);

    return () => {
      root.removeEventListener("change", onChange);
    };
  },
};
