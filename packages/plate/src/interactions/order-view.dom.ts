/**
 * What Order's (Q-15) runtime controller reads from the markup the core renders and shows back in
 * it: the choices and the positions, the order they stand in, and the button each choice is
 * (issue ei-07).
 *
 * The runtime builds one native `button` per choice, which holds the choice's own content nodes,
 * and moves that button between the choice's item in the source list and the position that holds
 * it, so a choice is shown once and no authored `id` is ever duplicated. A native button is
 * focusable and pressable by itself, so the select-then-place driver adds no `tabindex` or `role`
 * to it, and the button keeps its focus when the driver is started over. The core's markup is
 * otherwise the page's: the source list stays a `ul` of `li`, the positions stay an `ol` of `li`
 * (WCAG 1.3.1), and {@link OrderView.restore} puts every node and attribute back as the SSR wrote
 * it.
 *
 * @module
 */
import { announcements } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * A choice's button placed in a position of an Order (Q-15), as the select-then-place driver
 * reports it.
 */
export type OrderPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * The `data-slot` marker of a choice in the source list.
 */
const choiceSlot = "order-interaction-choice";

/**
 * The `data-slot` marker of the list that holds the choices still to place.
 */
const choicesSlot = "order-interaction-choices";

/**
 * The `data-slot` marker of a position.
 */
const positionSlot = "order-interaction-slot";

/**
 * One choice of an Order: its identifier, the item it returns to in the source list, and the button
 * that holds its content wherever it stands.
 */
interface Choice {
  readonly home: HTMLElement;
  readonly identifier: string;
  readonly token: HTMLElement;
}

/**
 * What Order's (Q-15) controller reads and shows over one rendered `order` interaction.
 */
export interface OrderView {
  /**
   * The positions, in the order the arrow keys move through them: document order, so position 1
   * first.
   */
  readonly slots: readonly HTMLElement[];

  /**
   * The button of every choice, in the source list's order and then the order of the positions the
   * SSR restored. Each is a token of the protocol wherever it stands.
   */
  readonly tokens: readonly HTMLElement[];

  /**
   * Fold the placements the select-then-place machine reports into the order, and show it.
   *
   * The machine places a choice in a position as one more placement, so a position that was taken
   * now holds two and a choice picked up from a position holds two. The order takes the new
   * placement and settles the rest: the choice that was in the position goes back to the source,
   * or, when the picked choice came from a position, takes that position (the two swap). A choice
   * returned to the source is the placement that is missing.
   *
   * @param placements The machine's placements after a change.
   * @returns What the settling adds to the machine's own announcement, the empty string when it
   *   adds none.
   */
  readonly apply: (placements: readonly OrderPlacement[]) => string;

  /**
   * Give the choices placed, as the response lists them.
   *
   * @returns The identifiers in position order, a position with no choice skipped.
   */
  readonly identifiers: () => readonly string[];

  /**
   * Keep the positions out of the tab order, since a placed choice inside one is its own tab stop
   * and an empty position holds nothing to act on.
   */
  readonly keepSlotsOutOfTabOrder: () => void;

  /**
   * Read the name a choice or a position is announced by.
   *
   * @param element A choice's button or a position.
   * @returns For a position, "Position n" by its place in the list; for a choice, its `aria-label`,
   *   else its text, else what is inside it, else "Choice n of count".
   */
  readonly labelOf: (element: HTMLElement) => string;

  /**
   * Give the placements the order stands in now.
   *
   * @returns One placement per choice placed, in position order.
   */
  readonly placements: () => readonly OrderPlacement[];

  /**
   * Find the placement a position shows, for the key or click that returns it.
   *
   * @param element The element the key was pressed on or the click landed on.
   * @returns The placement of the position the element is or sits in, or `undefined` when that
   *   position holds no choice.
   */
  readonly placementOf: (element: Element) => OrderPlacement | undefined;

  /**
   * Put the protocol's "moved" announcement in the words of an ordered list.
   *
   * The protocol names a target and then its place, "Position 2, 2 of 4." A position's name is
   * already its place, so the view says "Position 2 of 4." instead.
   *
   * @param text What the protocol is about to announce.
   * @returns The sentence to announce, the text itself when it is not a "moved" announcement.
   */
  readonly phrase: (text: string) => string;

  /**
   * Give the interaction's markup back as the SSR wrote it: each choice's content in the item or
   * position it came from, no button, no item the view added, and the attributes it changed.
   */
  readonly restore: () => void;

  /**
   * Show a response in the positions: its choices from position 1, in order, and the others in the
   * source list. An identifier that names no choice, or one already listed, is left out.
   *
   * @param identifiers The response's identifiers, as the hidden inputs hold them.
   */
  readonly start: (identifiers: readonly string[]) => void;
}

/**
 * Collapse runs of white space to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string => value.replaceAll(/\s+/gu, " ").trim();

/**
 * Read an element's identifier as the core writes it.
 *
 * @param element The element.
 * @returns The `data-identifier`, empty when it carries none.
 */
const identifierOf = (element: HTMLElement): string => element.dataset["identifier"] ?? "";

/**
 * Read the text a choice is named by when it holds no text: the `alt`, `aria-label` or `title` of
 * the first element inside it that has one, as a choice that is an image does.
 *
 * @param token A choice's button.
 * @returns The text, empty when nothing inside names it.
 */
const innerName = (token: HTMLElement): string => {
  for (const element of token.querySelectorAll("[alt], [aria-label], [title]")) {
    const named = collapse(
      element.getAttribute("alt") ??
        element.getAttribute("aria-label") ??
        element.getAttribute("title") ??
        "",
    );

    if (named !== "") {
      return named;
    }
  }

  return "";
};

/**
 * Tell whether the engine's elements have `Node.moveBefore`, which the DOM types declare for every
 * element though an engine may not ship it.
 *
 * @param parent An element.
 * @returns True when the element can move a child without removing it.
 */
const canMove = (parent: HTMLElement): boolean => "moveBefore" in parent;

/**
 * Move a node to the end of an element, keeping the node's focus and state where the engine can.
 *
 * `Node.moveBefore` moves a node without removing it, so a focused button stays focused. An
 * engine without it removes and inserts the node as `append` does, which drops focus to the page.
 *
 * @param parent The element that takes the node.
 * @param node The node to move; it and the parent share one tree.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/moveBefore
 */
const relocate = (parent: HTMLElement, node: HTMLElement): void => {
  if (canMove(parent)) {
    parent.moveBefore(node, null);
  } else {
    parent.append(node);
  }
};

/**
 * Name a position by its place in the list.
 *
 * @param index The position's index from 0.
 * @returns "Position n", n from 1.
 */
const positionName = (index: number): string => `Position ${String(index + 1)}`;

/**
 * Collect the first element of each identifier, dropping a repeat.
 *
 * @param elements Elements that carry an identifier.
 * @returns The elements, each identifier once.
 */
const eachOnce = (elements: readonly HTMLElement[]): readonly HTMLElement[] =>
  elements.filter(
    (element, index) =>
      identifierOf(element) !== "" &&
      elements.findIndex((other) => identifierOf(other) === identifierOf(element)) === index,
  );

/**
 * List each identifier once, in the order first seen.
 *
 * @param identifiers The identifiers, repeats allowed.
 * @returns The identifiers without repeats.
 */
const eachIdentifier = (identifiers: readonly string[]): readonly string[] => [
  ...new Set(identifiers),
];

/**
 * Build the source list's item for a choice the SSR placed, which the list does not hold. The item
 * joins the list only while its choice is in the source.
 *
 * @param identifier The choice's identifier.
 * @returns The item, outside the list.
 */
const homeFor = (identifier: string): HTMLElement => {
  const home = document.createElement("li");

  home.dataset["slot"] = choiceSlot;
  home.dataset["identifier"] = identifier;

  return home;
};

/**
 * Read the parts of a rendered Order (Q-15) and give its choices their buttons, or find there is
 * nothing to drive.
 *
 * A root needs its source list, a position and a choice, in the source list or in a position. A
 * root without them is left exactly as it is, so the upgrade attaches nothing to it.
 *
 * @param root The interaction's root, `data-slot="order-interaction"`.
 * @returns The view, or `undefined` for a root that lacks the parts, which the call did not touch.
 */
export const viewOf = (root: HTMLElement): OrderView | undefined => {
  const list = root.querySelector<HTMLElement>(`[data-slot="${choicesSlot}"]`);
  const slots = [...root.querySelectorAll<HTMLElement>(`[data-slot="${positionSlot}"]`)];
  const listed = [...(list?.children ?? [])].filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.dataset["slot"] === choiceSlot,
  );
  const sources = eachOnce(listed);
  const known = new Set(sources.map(identifierOf));
  const restored = eachOnce(
    slots.filter((slot) => identifierOf(slot) !== "" && !known.has(identifierOf(slot))),
  );

  if (list === null || slots.length === 0 || sources.length + restored.length === 0) {
    return undefined;
  }

  const kept = {
    contents: new Map<HTMLElement, readonly ChildNode[]>(),
    identifiers: new Map<HTMLElement, string | undefined>(),
    items: [...list.childNodes],
    tabindexes: new Map<HTMLElement, string | null>(),
  };

  for (const slot of slots) {
    kept.contents.set(slot, [...slot.childNodes]);
  }

  /**
   * Build a choice's button around the content nodes of the element that holds them now, and put
   * the button there.
   *
   * @param holder The item or position whose child nodes are the choice's content.
   * @param identifier The choice's identifier.
   * @returns The button.
   */
  const wrap = (holder: HTMLElement, identifier: string): HTMLElement => {
    const token = document.createElement("button");

    token.type = "button";
    kept.contents.set(holder, [...holder.childNodes]);
    token.dataset["identifier"] = identifier;
    token.append(...holder.childNodes);
    holder.append(token);

    return token;
  };

  const choices: readonly Choice[] = [
    ...sources.map((home) => ({
      home,
      identifier: identifierOf(home),
      token: wrap(home, identifierOf(home)),
    })),
    ...restored.map((slot) => ({
      home: homeFor(identifierOf(slot)),
      identifier: identifierOf(slot),
      token: wrap(slot, identifierOf(slot)),
    })),
  ];

  for (const slot of slots) {
    kept.identifiers.set(slot, slot.dataset["identifier"]);
    kept.tabindexes.set(slot, slot.getAttribute("tabindex"));
  }

  let occupants: readonly (Choice | undefined)[] = Array.from<Choice | undefined>({
    length: slots.length,
  });

  /**
   * Find the choice a button belongs to.
   *
   * @param token A choice's button.
   * @returns The choice, or `undefined` for an element that is none's button.
   */
  const choiceOf = (token: HTMLElement): Choice | undefined =>
    choices.find((choice) => choice.token === token);

  /**
   * Read the name a choice's button is announced by.
   *
   * @param token A choice's button.
   * @returns Its name.
   */
  const tokenName = (token: HTMLElement): string => {
    const labelled = collapse(token.getAttribute("aria-label") ?? "");
    const written = labelled === "" ? collapse(token.textContent) : labelled;

    if (written !== "") {
      return written;
    }

    const inside = innerName(token);

    return inside === ""
      ? `Choice ${choices.findIndex((choice) => choice.token === token) + 1} of ${choices.length}`
      : inside;
  };

  /**
   * Read the name a choice's button or a position is announced by.
   *
   * @param element A choice's button or a position.
   * @returns Its name.
   */
  const labelOf = (element: HTMLElement): string => {
    const index = slots.indexOf(element);

    return index === -1 ? tokenName(element) : positionName(index);
  };

  /**
   * Put a choice's item back in the source list, before the next choice's item the list holds so
   * the list keeps the choices' order.
   *
   * @param choice The choice whose item to put back.
   */
  const enlist = (choice: Choice): void => {
    if (choice.home.parentElement === list) {
      return;
    }

    const next = choices
      .slice(choices.indexOf(choice) + 1)
      .find((later) => later.home.parentElement === list);

    if (next === undefined) {
      list.append(choice.home);
    } else {
      next.home.before(choice.home);
    }
  };

  /**
   * Move every choice's button to where the order puts it, and write the positions' identifiers.
   * A choice in the source list has its item there, and one in a position leaves its item out.
   */
  const show = (): void => {
    for (const choice of choices) {
      const slot = slots[occupants.indexOf(choice)];

      if (slot === undefined) {
        enlist(choice);

        if (choice.token.parentElement !== choice.home) {
          relocate(choice.home, choice.token);
        }
      } else {
        if (choice.token.parentElement !== slot) {
          relocate(slot, choice.token);
        }

        choice.home.remove();
      }
    }

    for (const [index, slot] of slots.entries()) {
      const occupant = occupants[index];

      if (occupant === undefined) {
        delete slot.dataset["identifier"];
      } else {
        slot.dataset["identifier"] = occupant.identifier;
      }
    }
  };

  /**
   * Give the placements the order stands in now.
   *
   * @returns One placement per choice placed, in position order.
   */
  const placements = (): readonly OrderPlacement[] =>
    slots.flatMap((target, index) => {
      const choice = occupants[index];

      return choice === undefined ? [] : [{ target, token: choice.token }];
    });

  return {
    apply: (reported) => {
      const count = occupants.filter((occupant) => occupant !== undefined).length;
      const last = reported.at(-1);

      if (reported.length > count && last !== undefined) {
        const choice = choiceOf(last.token);
        const to = slots.indexOf(last.target);

        if (choice === undefined || to === -1) {
          return "";
        }

        const from = occupants.indexOf(choice);
        const displaced = occupants[to];
        const next = [...occupants];

        if (from !== to) {
          next[to] = choice;

          if (from !== -1) {
            next[from] = displaced;
          }
        }

        occupants = next;
        show();

        if (from === to || displaced === undefined) {
          return "";
        }

        return from === -1
          ? announcements.returned(tokenName(displaced.token))
          : `Swapped with ${tokenName(displaced.token)}, which is now in ${positionName(from)}.`;
      }

      occupants = slots.map((slot) => {
        const placement = reported.find((candidate) => candidate.target === slot);

        return placement === undefined ? undefined : choiceOf(placement.token);
      });
      show();

      return "";
    },
    identifiers: () =>
      occupants.flatMap((occupant) => (occupant === undefined ? [] : [occupant.identifier])),
    keepSlotsOutOfTabOrder: () => {
      for (const slot of slots) {
        slot.setAttribute("tabindex", "-1");
      }
    },
    labelOf,
    phrase: (text) => {
      const slot = slots.find(
        (candidate, index) =>
          text === announcements.moved(labelOf(candidate), index + 1, slots.length),
      );

      return slot === undefined ? text : `${labelOf(slot)} of ${String(slots.length)}.`;
    },
    placementOf: (element) => placements().find(({ target }) => target.contains(element)),
    placements,
    restore: () => {
      for (const [holder, contents] of kept.contents) {
        holder.replaceChildren(...contents);
      }

      for (const [slot, identifier] of kept.identifiers) {
        if (identifier === undefined) {
          delete slot.dataset["identifier"];
        } else {
          slot.dataset["identifier"] = identifier;
        }
      }

      for (const [slot, tabindex] of kept.tabindexes) {
        if (tabindex === null) {
          slot.removeAttribute("tabindex");
        } else {
          slot.setAttribute("tabindex", tabindex);
        }
      }

      list.replaceChildren(...kept.items);
    },
    slots,
    start: (identifiers) => {
      const placed = eachIdentifier(identifiers)
        .flatMap((identifier) => choices.filter((choice) => choice.identifier === identifier))
        .slice(0, slots.length);

      occupants = slots.map((_, index) => placed[index]);
      show();
    },
    tokens: choices.map((choice) => choice.token),
  };
};
