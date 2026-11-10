/**
 * What Graphic Associate's (Q-7, the `graphic-associate` kind) runtime controller reads from and
 * writes to the rendered interaction: the hotspots and their limits, the rules a pair must meet,
 * the list of pairs, the pair marks on the hotspots, the line each pair draws over the image, and
 * the pointer reach of each drawn area. `interactions/graphic-associate.dom.ts` (issue ei-09)
 * composes them over the select-then-place driver (issue m3d-02).
 *
 * Nothing here builds interaction structure the core (issue ei-08) did not render, but for the list
 * item of a pair made after the page loaded, which has the shape the core writes, and the `line` of
 * a pair, drawn in the outline layer the core renders. Every attribute it changes is remembered and
 * put back by {@link Memory.undo}, so a teardown leaves the root as the server wrote it.
 *
 * Its texts are English and local to this module (D7).
 *
 * @module
 */
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * A pair as the select-then-place machine holds it: the hotspot picked up and the hotspot it was
 * placed on, in the order they were made, which is the order the hidden input posts them in.
 */
export type HotspotPair = Placement<HTMLElement, HTMLElement>;

/**
 * The `data-slot` marker of each part of the interaction this module reads, as the core writes it.
 */
export const markers = {
  hotspot: "graphic-associate-interaction-hotspot",
  outline: "graphic-associate-interaction-outline",
  pair: "graphic-associate-interaction-pair",
  pairs: "graphic-associate-interaction-pairs",
} as const;

/**
 * The XML namespace of the elements an outline holds, which a `line` must be created in.
 */
const svgNamespace = "http://www.w3.org/2000/svg";

/**
 * The most a hotspot's own limit is worth when the author wrote none: `match-max` 0 and an absent
 * one are no limit.
 */
const unlimited = Number.POSITIVE_INFINITY;

/**
 * List the hotspots of an interaction in document order, the ones that name themselves by an
 * identifier.
 *
 * @param root The interaction's root.
 * @returns The hotspots' list items.
 */
export const hotspotsOf = (root: HTMLElement): readonly HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(`[data-slot="${markers.hotspot}"]`)].filter(
    (hotspot) => (hotspot.dataset["identifier"] ?? "") !== "",
  );

/**
 * Read the identifier a hotspot posts as one side of a pair.
 *
 * @param hotspot A hotspot's list item.
 * @returns Its `data-identifier`, empty when it has none.
 */
export const identifierOf = (hotspot: HTMLElement): string => hotspot.dataset["identifier"] ?? "";

/**
 * Read the name a hotspot is announced by: the `aria-label` the core wrote, its `hotspot-label` or
 * its position, else its identifier.
 *
 * @param hotspot A hotspot's list item.
 * @returns Its name.
 */
export const nameOf = (hotspot: HTMLElement): string => {
  const label = hotspot.getAttribute("aria-label")?.trim() ?? "";

  return label === "" ? identifierOf(hotspot) : label;
};

/**
 * Read the most pairs a hotspot may be in, from the `match-max` the core wrote on it.
 *
 * @param hotspot A hotspot's list item.
 * @returns The count, `Infinity` for 0 (no limit), an absent value and one that is not a number.
 */
export const matchLimitOf = (hotspot: HTMLElement): number => {
  const limit = Number(hotspot.dataset["matchMax"] ?? "0");

  return Number.isFinite(limit) && limit > 0 ? limit : unlimited;
};

/**
 * Read the most pairs the interaction may hold, from the `max-associations` the core wrote on its
 * root.
 *
 * @param root The interaction's root.
 * @returns The count, `Infinity` for 0 (no limit), an absent value and one that is not a number.
 */
export const pairLimitOf = (root: HTMLElement): number => {
  const limit = Number(root.dataset["maxAssociations"] ?? "0");

  return Number.isFinite(limit) && limit > 0 ? limit : unlimited;
};

/**
 * Read the identifiers a hotspot may pair with, from the `match-group` the core wrote on it.
 *
 * @param hotspot A hotspot's list item.
 * @returns The partners, none listed when the hotspot may pair with any.
 */
const partnersOf = (hotspot: HTMLElement): readonly string[] =>
  (hotspot.dataset["matchGroup"] ?? "").split(/\s+/u).filter((identifier) => identifier !== "");

/**
 * Tell whether a hotspot's `match-group` leaves another hotspot out.
 *
 * @param side The hotspot whose group is read.
 * @param other The hotspot it would be paired with.
 * @returns Whether the group is written and does not list the other.
 */
const excludes = (side: HTMLElement, other: HTMLElement): boolean => {
  const partners = partnersOf(side);

  return partners.length > 0 && !partners.includes(identifierOf(other));
};

/**
 * Count the pairs a hotspot is in, on either side.
 *
 * @param hotspot A hotspot's list item.
 * @param pairs The pairs made.
 * @returns How many name it.
 */
export const pairCountOf = (hotspot: HTMLElement, pairs: readonly HotspotPair[]): number =>
  pairs.filter(({ target, token }) => token === hotspot || target === hotspot).length;

/**
 * Count the pairs a hotspot is in as the hotspot picked up, so the machine, which counts a
 * hotspot's pairs as the target alone, can be given what is left of the whole limit.
 *
 * @param hotspot A hotspot's list item.
 * @param pairs The pairs made.
 * @returns How many have it as their first side.
 */
export const pairsStartedBy = (hotspot: HTMLElement, pairs: readonly HotspotPair[]): number =>
  pairs.filter(({ token }) => token === hotspot).length;

/**
 * Write "1 pair" or "n pairs".
 *
 * @param count The count.
 * @returns The count and its noun.
 */
const pairsOfCount = (count: number): string =>
  `${String(count)} ${count === 1 ? "pair" : "pairs"}`;

/**
 * The announcements of Graphic Associate's runtime, English, each given the hotspots' names as the
 * interaction labels them. The protocol's own announcements are `announcements` in
 * `runtime/select-place.dom.ts`; these say what they cannot, because a pair is unordered, its sides
 * are the same kind of hotspot, and a hotspot has limits of its own.
 */
export const words = {
  already: (first: string, second: string): string => `${first} and ${second} are already paired.`,
  full: (name: string, limit: number): string =>
    `${name} is at its limit of ${pairsOfCount(limit)}.`,
  itself: (name: string): string => `${name} cannot be paired with itself.`,
  made: (first: string, second: string): string => `${first} is paired with ${second}.`,
  outside: (name: string, other: string, allowed: readonly string[]): string =>
    `${name} cannot be paired with ${other}; pair it with one of ${allowed.join(", ")}.`,
  removeHint: "Press Delete to remove this pair.",
  removed: (first: string, second: string): string =>
    `${first} and ${second} are no longer paired.`,
  tooMany: (limit: number): string =>
    `Make at most ${pairsOfCount(limit)}; remove a pair to make another.`,
} as const;

/**
 * Write the text a pair's list item shows, as the core writes it for the pairs it restores.
 *
 * @param pair The pair.
 * @returns The two hotspots' names.
 */
const pairText = ({ target, token }: HotspotPair): string =>
  `${nameOf(token)} and ${nameOf(target)}`;

/**
 * Write a pair as it is posted: its two identifiers separated by a space.
 *
 * @param pair The pair.
 * @returns The posted form.
 */
export const postedOf = ({ target, token }: HotspotPair): string =>
  `${identifierOf(token)} ${identifierOf(target)}`;

/**
 * Tell whether two pairs associate the same two hotspots, in either order.
 *
 * @param left One pair.
 * @param right The other.
 * @returns Whether they are one association.
 */
const samePair = (left: HotspotPair, right: HotspotPair): boolean =>
  (left.token === right.token && left.target === right.target) ||
  (left.token === right.target && left.target === right.token);

/**
 * Read the pairs a list of posted strings holds, each `"<a> <b>"`, over the interaction's hotspots.
 *
 * @param posted The strings, such as the values of the hidden inputs.
 * @param hotspots The interaction's hotspots.
 * @returns The pairs that name two hotspots, in order; a string that is not two identifiers of the
 *   hotspots is left out.
 */
export const pairsOfPosted = (
  posted: readonly string[],
  hotspots: readonly HTMLElement[],
): readonly HotspotPair[] =>
  posted.flatMap((value) => {
    const [first, second, ...rest] = value.split(/\s+/u).filter((part) => part !== "");
    const token = hotspots.find((hotspot) => identifierOf(hotspot) === first);
    const target = hotspots.find((hotspot) => identifierOf(hotspot) === second);

    return token === undefined || target === undefined || rest.length > 0
      ? []
      : [{ target, token }];
  });

/**
 * Read the pairs the server wrote into the list of pairs, each item's `data-pair`, over the
 * interaction's hotspots; the response of an item that is shown and not editable, which posts none.
 *
 * @param root The interaction's root.
 * @param hotspots The interaction's hotspots.
 * @returns The pairs the list shows, in order.
 */
export const pairsOfList = (
  root: HTMLElement,
  hotspots: readonly HTMLElement[],
): readonly HotspotPair[] =>
  pairsOfPosted(
    [...root.querySelectorAll<HTMLElement>(`[data-slot="${markers.pair}"]`)].map(
      (item) => item.dataset["pair"] ?? "",
    ),
    hotspots,
  );

/**
 * Say why a hotspot cannot be picked up now.
 *
 * @param hotspot The hotspot the user tried to pick up.
 * @param pairs The pairs made.
 * @param pairLimit The most pairs the interaction holds.
 * @returns The text to announce.
 */
export const unavailableText = (
  hotspot: HTMLElement,
  pairs: readonly HotspotPair[],
  pairLimit: number,
): string =>
  pairs.length >= pairLimit
    ? words.tooMany(pairLimit)
    : words.full(nameOf(hotspot), matchLimitOf(hotspot));

/**
 * Check the pair a user is about to make against the rules of the interaction, in this order: a
 * hotspot with itself, a pair outside the `match-group` either side names, a pair already made in
 * either order, a hotspot at its `match-max` on either side, and the interaction's
 * `max-associations`. The core refuses the same in its validation of a post; this says it before
 * the pair is made.
 *
 * @param pair The hotspot picked up and the one it would be placed on.
 * @param pairs The pairs made.
 * @param pairLimit The most pairs the interaction holds.
 * @param hotspots The interaction's hotspots, to name the partners a group allows.
 * @returns The text to announce, or `undefined` when the pair may be made.
 */
export const refusalOf = (
  pair: HotspotPair,
  pairs: readonly HotspotPair[],
  pairLimit: number,
  hotspots: readonly HTMLElement[],
): string | undefined => {
  const { target, token } = pair;
  const nameFor = (identifier: string): string => {
    const found = hotspots.find((hotspot) => identifierOf(hotspot) === identifier);

    return found === undefined ? identifier : nameOf(found);
  };

  if (token === target) {
    return words.itself(nameOf(token));
  }

  if (excludes(token, target)) {
    return words.outside(nameOf(token), nameOf(target), partnersOf(token).map(nameFor));
  }

  if (excludes(target, token)) {
    return words.outside(nameOf(target), nameOf(token), partnersOf(target).map(nameFor));
  }

  if (pairs.some((made) => samePair(made, pair))) {
    return words.already(nameOf(token), nameOf(target));
  }

  const full = [token, target].find(
    (hotspot) => pairCountOf(hotspot, pairs) >= matchLimitOf(hotspot),
  );

  if (full !== undefined) {
    return words.full(nameOf(full), matchLimitOf(full));
  }

  return pairs.length >= pairLimit ? words.tooMany(pairLimit) : undefined;
};

/**
 * What a part of the view changed on an element, so it can be put back.
 */
export interface Memory {
  /**
   * Remove an attribute, remembering the value it had.
   *
   * @param element The element.
   * @param name The attribute's name.
   */
  readonly remove: (element: Element, name: string) => void;

  /**
   * Set an attribute, remembering the value it had.
   *
   * @param element The element.
   * @param name The attribute's name.
   * @param value The value.
   */
  readonly set: (element: Element, name: string, value: string) => void;

  /**
   * Put every attribute it changed back to the value it had before the first change, removing one
   * it added.
   */
  readonly undo: () => void;
}

/**
 * Start a record of the attributes a part of the view changes.
 *
 * @returns The record.
 */
export const createMemory = (): Memory => {
  const kept = new Map<Element, Map<string, string | null>>();

  /**
   * Keep an attribute's value the first time it is about to change.
   *
   * @param element The element.
   * @param name The attribute's name.
   */
  const keep = (element: Element, name: string): void => {
    const names = kept.get(element) ?? new Map<string, string | null>();

    if (!names.has(name)) {
      names.set(name, element.getAttribute(name));
    }

    kept.set(element, names);
  };

  return {
    remove: (element, name) => {
      keep(element, name);
      element.removeAttribute(name);
    },
    set: (element, name, value) => {
      keep(element, name);

      if (element.getAttribute(name) !== value) {
        element.setAttribute(name, value);
      }
    },
    undo: () => {
      for (const [element, names] of kept) {
        for (const [name, value] of names) {
          if (value === null) {
            element.removeAttribute(name);
          } else {
            element.setAttribute(name, value);
          }
        }
      }

      kept.clear();
    },
  };
};

/**
 * The list of pairs: the core's Pairs part, which shows one item per pair.
 */
export interface PairList {
  /**
   * Find the pair a list item or an element inside one shows, for Delete, Backspace or a click on
   * it.
   *
   * @param element The element the key was pressed on or the click landed on.
   * @returns The pair, or `undefined` when the element is in no pair's item.
   */
  readonly pairOf: (element: Element) => HotspotPair | undefined;

  /**
   * Put the list back as the server wrote it: its own items, in order, and each attribute this
   * list changed on them.
   */
  readonly restore: () => void;

  /**
   * Show the pairs: one item each, in order, reaching an item the server wrote for the same pair
   * and writing one for a pair made since.
   *
   * @param pairs The pairs made, in order.
   */
  readonly show: (pairs: readonly HotspotPair[]) => void;
}

/**
 * Take over the interaction's list of pairs. A root without one keeps no list and shows no pairs.
 * An item the list holds is made reachable, with `tabindex="0"` and the key that removes it named
 * in `aria-description`, since a pair is removed by Delete or Backspace on it or a click on it.
 *
 * @param root The interaction's root.
 * @returns The list.
 */
export const createPairList = (root: HTMLElement): PairList => {
  const list = root.querySelector<HTMLElement>(`[data-slot="${markers.pairs}"]`);
  const original = list === null ? [] : [...list.children];
  const memory = createMemory();
  const shown = new Map<string, HTMLElement>();
  const reached = new Map<Element, HotspotPair>();

  /**
   * Find or write the item of a pair: the one the server wrote for the posted form, or a new one
   * with the shape the core writes.
   *
   * @param pair The pair.
   * @returns The item.
   */
  const itemFor = (pair: HotspotPair): HTMLElement => {
    const key = postedOf(pair);
    const known =
      shown.get(key) ??
      original.find(
        (item): item is HTMLElement => item instanceof HTMLElement && item.dataset["pair"] === key,
      );
    const item = known ?? document.createElement("li");

    if (known === undefined) {
      item.dataset["slot"] = markers.pair;
      item.dataset["pair"] = key;
      item.textContent = pairText(pair);
    }

    memory.set(item, "tabindex", "0");
    memory.set(item, "aria-description", words.removeHint);
    shown.set(key, item);

    return item;
  };

  return {
    pairOf: (element) => {
      const item = element.closest(`[data-slot="${markers.pair}"]`);

      return item === null ? undefined : reached.get(item);
    },
    restore: () => {
      memory.undo();
      list?.replaceChildren(...original);
      shown.clear();
      reached.clear();
    },
    show: (pairs) => {
      reached.clear();

      if (list === null) {
        return;
      }

      const items = pairs.map((pair) => {
        const item = itemFor(pair);

        reached.set(item, pair);

        return item;
      });

      const current = new Set<Element>(items);

      for (const item of list.querySelectorAll(":scope > *")) {
        if (!current.has(item)) {
          item.remove();
        }
      }

      for (const item of items) {
        if (item.parentElement !== list) {
          list.append(item);
        }
      }

      for (const [key, item] of shown) {
        if (!items.includes(item)) {
          shown.delete(key);
        }
      }
    },
  };
};

/**
 * The `data-paired` mark of each hotspot a pair names, which the theme strokes so a pairing never
 * shows by colour alone.
 */
export interface PairMarks {
  /**
   * Put every hotspot's mark back as the server wrote it.
   */
  readonly restore: () => void;

  /**
   * Mark the hotspots the pairs name, and clear the mark of the others.
   *
   * @param pairs The pairs made.
   */
  readonly show: (pairs: readonly HotspotPair[]) => void;
}

/**
 * Keep the `data-paired` mark of the hotspots in step with the pairs.
 *
 * @param hotspots The interaction's hotspots.
 * @returns The marks.
 */
export const createPairMarks = (hotspots: readonly HTMLElement[]): PairMarks => {
  const memory = createMemory();

  return {
    restore: () => {
      memory.undo();
    },
    show: (pairs) => {
      for (const hotspot of hotspots) {
        if (pairCountOf(hotspot, pairs) > 0) {
          memory.set(hotspot, "data-paired", "");
        } else {
          memory.remove(hotspot, "data-paired");
        }
      }
    },
  };
};

/**
 * Find the elements a hotspot draws in its outline: the `rect`, `circle`, `ellipse` or `polygon`
 * the core writes, none for an area that holds no point.
 *
 * @param hotspot A hotspot's list item.
 * @returns The drawn elements.
 */
const drawingsOf = (hotspot: HTMLElement): readonly SVGGraphicsElement[] =>
  [...hotspot.querySelectorAll(`[data-slot="${markers.outline}"] > *`)].filter(
    (drawing): drawing is SVGGraphicsElement => drawing instanceof SVGGraphicsElement,
  );

/**
 * Let each drawn area take the pointer. The hotspots list takes none, so that without script an
 * area is no control and the image under it keeps the pointer; the area an author drew is the
 * target of a click, and a presentation attribute on the drawn element alone lets it take one
 * without the outline around it, which spans the whole image, taking every click.
 *
 * @param hotspots The interaction's hotspots.
 * @returns The undo, which puts every drawn element back as the server wrote it.
 */
export const reachDrawings = (hotspots: readonly HTMLElement[]): (() => void) => {
  const memory = createMemory();

  for (const hotspot of hotspots) {
    for (const drawing of drawingsOf(hotspot)) {
      memory.set(drawing, "pointer-events", "auto");
      memory.set(drawing, "cursor", "pointer");
    }
  }

  return () => {
    memory.undo();
  };
};

/**
 * The lines the pairs draw over the image.
 */
export interface PairLines {
  /**
   * Remove every line.
   */
  readonly clear: () => void;

  /**
   * Draw one line for each pair, in place of the lines drawn before.
   *
   * @param pairs The pairs made.
   */
  readonly draw: (pairs: readonly HotspotPair[]) => void;
}

/**
 * Find the middle of what a drawn element covers.
 *
 * @param drawing A drawn element.
 * @returns Its bounding box's centre in the outline's coordinates, or `undefined` for one with
 *   no box, such as one in an interaction that is not displayed.
 */
const centreOf = (
  drawing: SVGGraphicsElement,
): { readonly x: number; readonly y: number } | undefined => {
  const box = drawing.getBBox();

  return box.width === 0 && box.height === 0
    ? undefined
    : { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

/**
 * Draw the pairs as lines in the outline layer the core renders: each `line` is an `aria-hidden`
 * decoration from the centre of one hotspot's drawn area to the other's, put in the outline of the
 * first hotspot that is not the `default` area, which lies under the others. Every outline has the
 * image's `viewBox`, so a line scales with the image. A pair with a hotspot that draws no area, or
 * a hotspot that is not displayed, has no line and keeps its place in the list.
 *
 * @returns The lines.
 */
export const createPairLines = (): PairLines => {
  const drawn: SVGLineElement[] = [];

  /**
   * Remove every line drawn so far.
   */
  const clear = (): void => {
    for (const line of drawn.splice(0)) {
      line.remove();
    }
  };

  return {
    clear,
    draw: (pairs) => {
      clear();

      for (const pair of pairs) {
        const [from] = drawingsOf(pair.token);
        const [to] = drawingsOf(pair.target);
        const host = [pair.token, pair.target]
          .find((hotspot) => hotspot.dataset["area"] !== "default")
          ?.querySelector(`[data-slot="${markers.outline}"]`);
        const start = from === undefined ? undefined : centreOf(from);
        const end = to === undefined ? undefined : centreOf(to);

        if (host !== null && host !== undefined && start !== undefined && end !== undefined) {
          const line = document.createElementNS(svgNamespace, "line");

          line.setAttribute("x1", String(start.x));
          line.setAttribute("y1", String(start.y));
          line.setAttribute("x2", String(end.x));
          line.setAttribute("y2", String(end.y));
          line.setAttribute("aria-hidden", "true");
          line.dataset["pair"] = postedOf(pair);
          line.setAttribute("stroke-dasharray", "none");
          line.setAttribute("stroke-linecap", "round");
          host.append(line);
          drawn.push(line);
        }
      }
    },
  };
};
