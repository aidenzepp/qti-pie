/**
 * What Associate's (Q-1) runtime controller reads from the markup the core renders and shows back
 * in it: the choices, their limits and names, the pairs the hidden inputs hold, the list of pairs
 * the page shows, and the sentences that refuse a pair (issue ei-05).
 *
 * The controller builds no structure of its own. A pair is shown as the SSR writes a restored one,
 * an `associate-interaction-pair` item in the `associate-interaction-pairs` list, and
 * {@link AssociateView.restore} puts the list and every attribute the view wrote back as the SSR
 * wrote them. Every sentence is English and local to this module.
 *
 * @module
 */
import { announcements } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * A pair of Associate (Q-1) as the select-then-place driver reports it: the choice picked up and
 * the choice it was placed on, in the order they were made.
 */
export type PairPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * The `data-slot` marker of a choice, which is both a token and a target of a pair.
 */
const choiceSlot = "associate-interaction-choice";

/**
 * The `data-slot` marker of the list that holds the choices.
 */
const choicesSlot = "associate-interaction-choices";

/**
 * The `data-slot` marker of one pair the page shows.
 */
const pairSlot = "associate-interaction-pair";

/**
 * The `data-slot` marker of the list of pairs the page shows.
 */
const pairsSlot = "associate-interaction-pairs";

/**
 * The key combinations that remove a pair from the list, which an assistive technology announces
 * for each item: the keys of `keyMap`'s `placed` context.
 */
const removeKeys = "Delete Backspace";

/**
 * Joins labels into the list a sentence names, "A or B", with the serial comma of English.
 */
const alternatives = new Intl.ListFormat("en", { style: "long", type: "disjunction" });

/**
 * Associate's sentences, English: the pair item's text, the announcements of a pair made and
 * removed, and the reasons a choice cannot be picked up or a pair cannot be made.
 */
const words = {
  already: (first: string, second: string): string => `${first} and ${second} are already paired.`,
  full: (choice: string): string => `${choice} is already in as many pairs as it may be in.`,
  group: (holder: string, others: string): string => `${holder} can only be paired with ${others}.`,
  itself: (choice: string): string => `${choice} cannot be paired with itself.`,
  limit: (most: number): string =>
    `No more pairs can be made: the most is ${most}. Remove a pair to make another.`,
  notWith: (holder: string, other: string): string => `${holder} cannot be paired with ${other}.`,
  paired: (first: string, second: string): string => `${first} paired with ${second}`,
  pickedUp: (choice: string): string =>
    `Picked up ${choice}. Use the arrow keys to choose another choice, Enter to pair them, Escape to cancel.`,
} as const;

/**
 * What Associate's (Q-1) controller reads and shows over one rendered interaction.
 */
export interface AssociateView {
  /**
   * The choices, in presented order, each with an identifier: the tokens and the targets of the
   * select-then-place protocol alike.
   */
  readonly choices: readonly HTMLElement[];

  /**
   * Tell whether a choice may be picked up now: the response holds fewer pairs than
   * `max-associations` (0 is no limit) and the choice is in fewer pairs than its `match-max`
   * (0 is no limit).
   *
   * @param choice A choice.
   * @param placements The pairs so far.
   * @returns False once either limit is reached.
   */
  readonly available: (choice: HTMLElement, placements: readonly PairPlacement[]) => boolean;

  /**
   * Find the choice an element is or sits in.
   *
   * @param element The event's target.
   * @returns The choice, or `undefined` when the element is in none.
   */
  readonly choiceAt: (element: Element) => HTMLElement | undefined;

  /**
   * Find the choice the select-then-place driver holds: the one marked `aria-pressed="true"`.
   *
   * @returns The held choice, or `undefined` when none is held.
   */
  readonly held: () => HTMLElement | undefined;

  /**
   * Read the name a choice is announced by.
   *
   * @param choice A choice.
   * @returns Its `aria-label`, else its text, else the text of the first element inside it that
   *   names itself, else "Choice n of count" by its place among the choices.
   */
  readonly labelOf: (choice: HTMLElement) => string;

  /**
   * Write a pair as the entry a hidden input holds.
   *
   * @param placement The pair.
   * @returns The first choice's identifier, a space, and the second's.
   */
  readonly pairOf: (placement: PairPlacement) => string;

  /**
   * Announce a pair made.
   *
   * @param placement The pair.
   * @returns The sentence naming both choices.
   */
  readonly madeText: (placement: PairPlacement) => string;

  /**
   * Announce a pair removed.
   *
   * @param placement The pair.
   * @returns The sentence naming both choices.
   */
  readonly removedText: (placement: PairPlacement) => string;

  /**
   * Find the pair a pair item of the list shows, for the key or click that removes it.
   *
   * @param element The element the key was pressed on or the click landed on.
   * @returns The pair of the item the element is or sits in, or `undefined` for none.
   */
  readonly placementOf: (element: Element) => PairPlacement | undefined;

  /**
   * Give the reason a choice cannot be picked up.
   *
   * @param choice A choice.
   * @param placements The pairs so far.
   * @returns The sentence for the most the response may hold, else for the choice's own `match-max`,
   *   or `undefined` when the choice may be picked up.
   */
  readonly pickUpRefusal: (
    choice: HTMLElement,
    placements: readonly PairPlacement[],
  ) => string | undefined;

  /**
   * Give the reason a held choice cannot be paired with another, in the order the facts refuse it:
   * the same choice, a pair already made in either order, a `match-group` of either choice that
   * omits the other, then the other choice's `match-max`.
   *
   * @param token The held choice.
   * @param target The choice it would be paired with.
   * @param placements The pairs so far.
   * @returns The sentence, or `undefined` when the pair may be made.
   */
  readonly pairRefusal: (
    token: HTMLElement,
    target: HTMLElement,
    placements: readonly PairPlacement[],
  ) => string | undefined;

  /**
   * Say the select-then-place protocol's pick-up announcement in Associate's words.
   *
   * @param text What the protocol is about to announce.
   * @returns The sentence to announce in its place, or `undefined` for any other text.
   */
  readonly reworded: (text: string) => string | undefined;

  /**
   * Read the pairs of a response back into placements.
   *
   * @param entries The pairs as the hidden inputs hold them, `<a> <b>`.
   * @returns The pairs whose two identifiers name choices, in the order given, each as written: a
   *   choice paired with itself and a pair given twice stay, which the server refuses.
   */
  readonly restored: (entries: readonly string[]) => readonly PairPlacement[];

  /**
   * Give the interaction's markup back as the SSR wrote it: the list of pairs with the items it
   * held, and without the attributes the view wrote.
   */
  readonly restore: () => void;

  /**
   * Show the pairs in the list: an item for each, in order, and none for a pair that was removed.
   * An item the SSR wrote for a restored pair is kept as it is.
   *
   * @param placements The pairs.
   */
  readonly show: (placements: readonly PairPlacement[]) => void;
}

/**
 * Collapse runs of white space to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string => value.replaceAll(/\s+/gu, " ").trim();

/**
 * Read a choice's identifier as the core writes it.
 *
 * @param choice A choice.
 * @returns The `data-identifier`, empty when it carries none.
 */
const identifierOf = (choice: HTMLElement): string => choice.dataset["identifier"] ?? "";

/**
 * Read a count a `data-*` attribute holds: a whole number, 0 for no limit.
 *
 * @param written The attribute's value, `undefined` when it is absent.
 * @returns The count, 0 when the value is absent, negative or not a number.
 */
const countOf = (written: string | undefined): number => {
  const count = Math.trunc(Number(written ?? ""));

  return Number.isNaN(count) || count < 0 ? 0 : count;
};

/**
 * Read the choices a choice may pair with from its `match-group`.
 *
 * @param choice A choice.
 * @returns The identifiers, none when the choice names no group and so pairs with any choice.
 */
const groupOf = (choice: HTMLElement): readonly string[] =>
  (choice.dataset["matchGroup"] ?? "").split(/\s+/u).filter((identifier) => identifier !== "");

/**
 * Count the pairs a choice is in, on either side.
 *
 * @param choice A choice.
 * @param placements The pairs so far.
 * @returns How many pairs name the choice.
 */
const pairsOf = (choice: HTMLElement, placements: readonly PairPlacement[]): number =>
  placements.filter(({ target, token }) => token === choice || target === choice).length;

/**
 * Tell whether two choices are already a pair, in either order: a `pair` is unordered.
 *
 * @param first One choice.
 * @param second The other.
 * @param placements The pairs so far.
 * @returns True when a pair names both.
 */
const paired = (
  first: HTMLElement,
  second: HTMLElement,
  placements: readonly PairPlacement[],
): boolean =>
  placements.some(
    ({ target, token }) =>
      (token === first && target === second) || (token === second && target === first),
  );

/**
 * Read the text a choice is named by when it holds no text: the `alt`, `aria-label` or `title` of
 * the first element inside it that has one, as a choice image's does.
 *
 * @param choice A choice.
 * @returns The text, empty when nothing inside names it.
 */
const innerName = (choice: HTMLElement): string => {
  for (const element of choice.querySelectorAll("[alt], [aria-label], [title]")) {
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
 * Give each element an attribute it lacks, leaving every element that already has one as the
 * author wrote it.
 *
 * @param elements The elements.
 * @param name The attribute's name.
 * @param value The value to write.
 * @returns The elements the attribute was written on, so a teardown removes it from those alone.
 */
const claim = (
  elements: readonly HTMLElement[],
  name: string,
  value: string,
): readonly HTMLElement[] => {
  const written: HTMLElement[] = [];

  for (const element of elements) {
    if (!element.hasAttribute(name)) {
      element.setAttribute(name, value);
      written.push(element);
    }
  }

  return written;
};

/**
 * Tell whether an element's child nodes are exactly the given ones, in order.
 *
 * @param element The element.
 * @param children The nodes it should hold.
 * @returns True when it holds those nodes and no others.
 */
const holds = (element: HTMLElement, children: readonly ChildNode[]): boolean =>
  element.childNodes.length === children.length &&
  children.every((child, index) => element.childNodes[index] === child);

/**
 * Read the parts of a rendered Associate (Q-1, the `associate` kind) and show the pairs made in its
 * list.
 *
 * The select-then-place driver gives each choice, an `li`, `role="button"`, so the `ul` that holds
 * the choices is no longer a list of list items (axe's `list` rule, WCAG 1.3.1): the view gives
 * that `ul` `role="none"` while the upgrade holds. Each pair item takes `tabindex="0"` so a
 * keyboard reaches it, and `aria-keyshortcuts` for the keys that remove it; the markup stays
 * recoverable, since {@link AssociateView.restore} removes what the view wrote.
 *
 * @param root The interaction's root, `data-slot="associate-interaction"`.
 * @returns The view; its lists are empty and its limits are none for a root without the parts.
 */
export const viewOf = (root: HTMLElement): AssociateView => {
  const choices = [...root.querySelectorAll<HTMLElement>(`[data-slot="${choiceSlot}"]`)].filter(
    (choice) => identifierOf(choice) !== "",
  );
  const list = root.querySelector<HTMLElement>(`[data-slot="${pairsSlot}"]`);
  const written = [...(list?.childNodes ?? [])];
  const unclaimed = [...(list?.querySelectorAll<HTMLElement>(`[data-slot="${pairSlot}"]`) ?? [])];
  const template = unclaimed.at(0);
  const unlisted = claim(
    [...root.querySelectorAll<HTMLElement>(`[data-slot="${choicesSlot}"]`)],
    "role",
    "none",
  );
  const items = new Map<PairPlacement, HTMLElement>();
  const created: HTMLElement[] = [];
  const marked: (readonly [HTMLElement, string])[] = [];
  const most = countOf(root.dataset["maxAssociations"]);

  /**
   * Read the name a choice is announced by.
   *
   * @param choice A choice.
   * @returns Its name.
   */
  const labelOf = (choice: HTMLElement): string => {
    const labelled = collapse(choice.getAttribute("aria-label") ?? "");
    const text = labelled === "" ? collapse(choice.textContent) : labelled;

    if (text !== "") {
      return text;
    }

    const inside = innerName(choice);

    return inside === "" ? `Choice ${choices.indexOf(choice) + 1} of ${choices.length}` : inside;
  };

  /**
   * Write the sentence that names both choices of a pair, as the SSR writes a pair item's text.
   *
   * @param placement The pair.
   * @returns The text.
   */
  const textOf = ({ target, token }: PairPlacement): string =>
    words.paired(labelOf(token), labelOf(target));

  /**
   * Make a pair item reachable by keyboard and name the keys that remove it.
   *
   * @param item The pair item.
   */
  const reachable = (item: HTMLElement): void => {
    for (const [name, value] of [
      ["tabindex", "0"],
      ["aria-keyshortcuts", removeKeys],
    ] as const) {
      for (const element of claim([item], name, value)) {
        marked.push([element, name]);
      }
    }
  };

  /**
   * Give a pair an item: one the SSR wrote that no pair holds yet, else a new one shaped like the
   * SSR's.
   *
   * @param placement The pair.
   * @returns The item, which is not yet in the list when it is new.
   */
  const itemFor = (placement: PairPlacement): HTMLElement => {
    const adopted = unclaimed.shift();

    if (adopted !== undefined) {
      return adopted;
    }

    const copy = template?.cloneNode(false);
    const item = copy instanceof HTMLElement ? copy : document.createElement("li");

    item.dataset["slot"] = pairSlot;
    item.textContent = textOf(placement);
    created.push(item);

    return item;
  };

  return {
    available: (choice, placements) => {
      const limit = countOf(choice.dataset["matchMax"]);

      return (
        (most === 0 || placements.length < most) &&
        (limit === 0 || pairsOf(choice, placements) < limit)
      );
    },
    choiceAt: (element) => choices.find((choice) => choice.contains(element)),
    choices,
    held: () => choices.find((choice) => choice.getAttribute("aria-pressed") === "true"),
    labelOf,
    madeText: (placement) => `${textOf(placement)}.`,
    pairOf: ({ target, token }) => `${identifierOf(token)} ${identifierOf(target)}`,
    pairRefusal: (token, target, placements) => {
      if (token === target) {
        return words.itself(labelOf(token));
      }

      if (paired(token, target, placements)) {
        return words.already(labelOf(token), labelOf(target));
      }

      const outside = (
        [
          [token, target],
          [target, token],
        ] as const
      ).find(([holder, other]) => {
        const group = groupOf(holder);

        return group.length > 0 && !group.includes(identifierOf(other));
      });

      if (outside !== undefined) {
        const [holder, other] = outside;
        const names = groupOf(holder).flatMap((identifier) =>
          choices.filter((choice) => identifierOf(choice) === identifier).map(labelOf),
        );

        return names.length === 0
          ? words.notWith(labelOf(holder), labelOf(other))
          : words.group(labelOf(holder), alternatives.format(names));
      }

      const limit = countOf(target.dataset["matchMax"]);

      return limit > 0 && pairsOf(target, placements) >= limit
        ? words.full(labelOf(target))
        : undefined;
    },
    pickUpRefusal: (choice, placements) => {
      if (most > 0 && placements.length >= most) {
        return words.limit(most);
      }

      const limit = countOf(choice.dataset["matchMax"]);

      return limit > 0 && pairsOf(choice, placements) >= limit
        ? words.full(labelOf(choice))
        : undefined;
    },
    placementOf: (element) => [...items].find(([, item]) => item.contains(element))?.[0],
    removedText: (placement) => `Removed ${textOf(placement)}.`,
    restore: () => {
      for (const [element, name] of marked) {
        element.removeAttribute(name);
      }

      for (const item of created) {
        item.remove();
      }

      if (list !== null && !holds(list, written)) {
        list.replaceChildren(...written);
      }

      for (const element of unlisted) {
        element.removeAttribute("role");
      }

      items.clear();
    },
    restored: (entries) => {
      const placements: PairPlacement[] = [];

      for (const entry of entries) {
        const [first, second, ...rest] = entry.split(/\s+/u).filter((part) => part !== "");
        const token = choices.find((choice) => identifierOf(choice) === first);
        const target = choices.find((choice) => identifierOf(choice) === second);

        if (token !== undefined && target !== undefined && rest.length === 0) {
          placements.push({ target, token });
        }
      }

      return placements;
    },
    reworded: (text) => {
      const choice = choices.find(
        (candidate) => text === announcements.pickedUp(labelOf(candidate)),
      );

      return choice === undefined ? undefined : words.pickedUp(labelOf(choice));
    },
    show: (placements) => {
      if (list === null) {
        return;
      }

      const wanted = new Set(placements);

      for (const [placement, item] of items) {
        if (!wanted.has(placement)) {
          item.remove();
          items.delete(placement);
        }
      }

      for (const placement of placements) {
        if (!items.has(placement)) {
          const item = itemFor(placement);

          reachable(item);
          list.append(item);
          items.set(placement, item);
        }
      }

      for (const left of unclaimed.splice(0)) {
        left.remove();
      }
    },
  };
};
