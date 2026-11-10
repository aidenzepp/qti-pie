/**
 * What Graphic Order's (Q-9) runtime controller reads from the markup the core renders and shows
 * back in it: the hotspots and the positions, their names, the order the hidden inputs hold, the
 * badge each ordered hotspot shows and the text each position shows (issue ei-11).
 *
 * The controller builds no interaction structure of its own. A hotspot's badge is drawn as the SSR
 * draws a restored one, a `graphic-order-interaction-badge` SVG `text` inside its hotspot's
 * outline, after the shape, at the centre of its area, and {@link GraphicOrderView.restore} gives
 * the hotspots' and positions' content and attributes back as the SSR wrote them.
 *
 * Its texts are English and local to this module (D7).
 *
 * @module
 */
import { announcements } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * A hotspot placed in a position, as the select-then-place driver reports it.
 */
export type OrderPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * The `data-slot` marker of a hotspot, a token of the protocol.
 */
const hotspotSlot = "graphic-order-interaction-hotspot";

/**
 * The `data-slot` marker of the list that holds the hotspots over the image.
 */
const hotspotsSlot = "graphic-order-interaction-hotspots";

/**
 * The `data-slot` marker of a position, a target of the protocol.
 */
const positionSlot = "graphic-order-interaction-slot";

/**
 * The `data-slot` marker of an ordered hotspot's badge.
 */
const badgeSlot = "graphic-order-interaction-badge";

/**
 * The `data-slot` marker of the SVG that outlines a hotspot's area.
 */
const outlineSlot = "graphic-order-interaction-outline";

/**
 * The strings the runtime writes and speaks beyond the select-then-place protocol's own, English.
 */
const words = {
  area: (n: number, count: number): string => `Area ${String(n)} of ${String(count)}`,
  empty: "Empty",
  holds: (name: string): string => `Holds ${name}.`,
  position: (n: number): string => `Position ${String(n)}`,
  swapped: (name: string, position: string): string => `${name} moved to ${position}.`,
} as const;

/**
 * What Graphic Order's controller reads and shows over one rendered interaction.
 */
export interface GraphicOrderView {
  /**
   * The hotspots over the image, in document order, each with an identifier: the tokens.
   */
  readonly hotspots: readonly HTMLElement[];

  /**
   * The positions offered, in order: the targets. They are the first `data-max-choices` positions
   * the SSR wrote, or all of them when the root states no count.
   */
  readonly positions: readonly HTMLElement[];

  /**
   * Read the name a hotspot or a position is announced by.
   *
   * @param element A hotspot or a position.
   * @returns For a hotspot, its `aria-label`, else "Area n of count"; for a position, "Position n".
   */
  readonly labelOf: (element: HTMLElement) => string;

  /**
   * Write a placed hotspot as the value its hidden input holds.
   *
   * @param placement The placement.
   * @returns The hotspot's identifier.
   */
  readonly valueOf: (placement: OrderPlacement) => string;

  /**
   * Find the placement a position shows, for the key or click that returns it.
   *
   * @param placements The placements so far.
   * @param element The element the key was pressed on or the click landed on.
   * @returns The placement of the position the element is or sits in, or `undefined` for none.
   */
  readonly placementOf: (
    placements: readonly OrderPlacement[],
    element: Element,
  ) => OrderPlacement | undefined;

  /**
   * Read the order the hidden inputs hold back into placements: the first value in the first
   * position, the second in the second, each hotspot once.
   *
   * @param identifiers The values of the hidden inputs, in order.
   * @returns The placements of the values that name a hotspot and have a position, in order.
   */
  readonly restored: (identifiers: readonly string[]) => readonly OrderPlacement[];

  /**
   * Settle the placements after the protocol reports a change to them.
   *
   * The protocol appends a placement; it neither refuses a taken position nor knows a hotspot
   * appears once. A hotspot placed on a position another holds sends that one back to the source,
   * and one already placed moves, leaving its position free, or, onto a taken position, swaps with
   * the hotspot there. A placement removed passes through. The result is in position order.
   *
   * @param previous The settled placements before the change.
   * @param made The placements the protocol reports.
   * @returns The settled placements, in position order.
   */
  readonly settle: (
    previous: readonly OrderPlacement[],
    made: readonly OrderPlacement[],
  ) => readonly OrderPlacement[];

  /**
   * Give the text to announce in place of the protocol's: a hotspot placed on a taken position
   * says which one it displaced, and a move onto a taken position says which hotspot holds it.
   *
   * @param text What the protocol is about to announce.
   * @param placements The settled placements before the step.
   * @returns The sentence to announce, `text` itself when nothing is to be added.
   */
  readonly spoken: (text: string, placements: readonly OrderPlacement[]) => string;

  /**
   * Show the placements: each position holds the name of the hotspot placed there, or "Empty"; each
   * ordered hotspot carries its position as `data-position` and a badge of that number, and a
   * hotspot that is not ordered carries neither. A part already showing what it should is left as
   * it is.
   *
   * @param placements The placements.
   */
  readonly show: (placements: readonly OrderPlacement[]) => void;

  /**
   * Give the interaction's markup back as the SSR wrote it: each hotspot's `data-position`, each
   * outline's content, each badge's number, each position's content and `data-empty`, and the
   * attributes the view claimed.
   */
  readonly restore: () => void;
}

/**
 * Collapse runs of white space to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string => value.replaceAll(/\s+/gu, " ").trim();

/**
 * Round a number to four decimals and write it, as the SSR writes a coordinate.
 *
 * @param value The number.
 * @returns Its digits.
 */
const digits = (value: number): string => String(Math.round(value * 10_000) / 10_000);

/**
 * Read a numeric attribute of an SVG shape.
 *
 * @param figure The shape.
 * @param attribute The attribute's name.
 * @returns The number, `NaN` when the shape lacks it.
 */
const numberOf = (figure: Element, attribute: string): number =>
  Number(figure.getAttribute(attribute) ?? Number.NaN);

/**
 * Find the centre of a hotspot's drawn area from the shape the SSR drew.
 *
 * @param figure The `circle`, `ellipse`, `rect` or `polygon` the outline holds.
 * @returns The centre `[x, y]` in the outline's units, `undefined` for a shape it cannot read.
 */
const centreOf = (figure: Element): readonly [x: number, y: number] | undefined => {
  switch (figure.localName) {
    case "circle":
    case "ellipse": {
      return [numberOf(figure, "cx"), numberOf(figure, "cy")];
    }
    case "rect": {
      return [
        numberOf(figure, "x") + numberOf(figure, "width") / 2,
        numberOf(figure, "y") + numberOf(figure, "height") / 2,
      ];
    }
    case "polygon": {
      const points = (figure.getAttribute("points") ?? "")
        .split(/\s+/u)
        .map((pair) => pair.split(",").map(Number));
      const xs = points.map(([x = Number.NaN]) => x);
      const ys = points.map(([, y = Number.NaN]) => y);

      return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    }
    default: {
      return undefined;
    }
  }
};

/**
 * The namespace of SVG elements, which a badge inside an outline is in.
 */
const svgNamespace = "http://www.w3.org/2000/svg";

/**
 * Find the outline SVG of a hotspot, which holds its shape and its badge.
 *
 * @param hotspot The hotspot.
 * @returns The outline, `null` for a hotspot whose area holds no drawing.
 */
const outlineOf = (hotspot: HTMLElement): Element | null =>
  hotspot.querySelector(`[data-slot="${outlineSlot}"]`);

/**
 * Find the badge an outline holds.
 *
 * @param outline The outline SVG, or none.
 * @returns The badge, `null` when the hotspot is not ordered or has no outline.
 */
const badgeIn = (outline: Element | null): SVGElement | null =>
  outline === null
    ? null
    : outline.querySelector<SVGElement>(`:scope > [data-slot="${badgeSlot}"]`);

/**
 * Draw a hotspot's badge as the SSR draws one: an SVG `text` after the shape, whose `x` and `y` are
 * the centre of the area in the outline's own units (`50%` of each for a `default` area), and never
 * an inline `style`, which plate's Content Security Policy refuses.
 *
 * @param hotspot The hotspot.
 * @param outline The hotspot's outline SVG.
 * @param number The position it shows.
 * @returns The badge, not yet in the page. It carries no `x` and `y` when the shape's centre cannot
 *   be read.
 */
const badgeFor = (hotspot: HTMLElement, outline: Element, number: string): SVGElement => {
  const badge = document.createElementNS(svgNamespace, "text");
  const figure = outline.firstElementChild;
  const centre = figure === null ? undefined : centreOf(figure);

  badge.dataset["position"] = number;
  badge.dataset["slot"] = badgeSlot;

  if (hotspot.dataset["area"] === "default") {
    badge.setAttribute("x", "50%");
    badge.setAttribute("y", "50%");
  } else if (centre !== undefined) {
    badge.setAttribute("x", digits(centre[0]));
    badge.setAttribute("y", digits(centre[1]));
  }

  badge.textContent = number;

  return badge;
};

/**
 * Tell whether an element's child nodes are exactly the given ones, in order.
 *
 * @param element The element.
 * @param children The nodes it should hold.
 * @returns True when it holds those nodes and no others.
 */
const holds = (element: Element, children: readonly ChildNode[]): boolean =>
  element.childNodes.length === children.length &&
  children.every((child, index) => element.childNodes[index] === child);

/**
 * Set or remove an attribute so it has the value it had.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @param value The value it had, `null` for none.
 */
const putBack = (element: Element, attribute: string, value: string | null): void => {
  if (value === null) {
    element.removeAttribute(attribute);
  } else if (element.getAttribute(attribute) !== value) {
    element.setAttribute(attribute, value);
  }
};

/**
 * Give each element an attribute it lacks, leaving every element that already has one as the
 * author wrote it.
 *
 * @param elements The elements.
 * @param attribute The attribute's name.
 * @param value The value to write.
 * @returns The elements the attribute was written on, so a teardown removes it from those alone.
 */
const claim = (
  elements: readonly Element[],
  attribute: string,
  value: string,
): readonly Element[] => {
  const written = elements.filter((element) => !element.hasAttribute(attribute));

  for (const element of written) {
    element.setAttribute(attribute, value);
  }

  return written;
};

/**
 * Show a hotspot's place in the order: its `data-position` and a badge of that number in its
 * outline, or neither for a hotspot that is not ordered. A badge already showing the number is left
 * as it is, and a hotspot whose area holds no drawing shows no badge, as the SSR writes none.
 *
 * @param hotspot The hotspot.
 * @param place The index of the position it is placed in, -1 for none.
 */
const showHotspot = (hotspot: HTMLElement, place: number): void => {
  const outline = outlineOf(hotspot);
  const badge = badgeIn(outline);

  if (place === -1) {
    badge?.remove();
    delete hotspot.dataset["position"];

    return;
  }

  const number = String(place + 1);

  if (hotspot.dataset["position"] !== number) {
    hotspot.dataset["position"] = number;
  }

  if (outline === null) {
    return;
  }

  if (badge === null) {
    outline.append(badgeFor(hotspot, outline, number));
  } else {
    putBack(badge, "data-position", number);

    if (badge.textContent !== number) {
      badge.textContent = number;
    }
  }
};

/**
 * Tell whether two lists hold the same placements, whatever their order.
 *
 * @param first One list.
 * @param second The other list.
 * @returns True when each holds every placement of the other.
 */
export const samePlacements = (
  first: readonly OrderPlacement[],
  second: readonly OrderPlacement[],
): boolean =>
  first.length === second.length &&
  first.every((placement) =>
    second.some(({ target, token }) => target === placement.target && token === placement.token),
  );

/**
 * Read the parts of a rendered Graphic Order.
 *
 * Every hotspot and position takes `tabindex="0"` here, before the select-then-place driver gives
 * it to them: the driver's teardown puts back the value it found, so a hotspot that holds focus
 * keeps it while the controller restarts the driver after a placement displaces another, instead of
 * losing its `tabindex` for the instant between the two. The driver gives each hotspot, an `li`,
 * `role="button"`, so the `ul` that holds them is no longer a list of list items (axe's `list`
 * rule, WCAG 1.3.1): the view gives that `ul` `role="none"` while the upgrade holds.
 *
 * The stylesheet keeps the hotspots' boxes, which are the image's, out of the pointer's way, so
 * each drawn area takes the pointer by the SVG `pointer-events="all"` presentation attribute the
 * view writes on the shape the outline holds: a specified value beats the `none` the shape
 * inherits, so a click lands on the area it is over, and on no hotspot where the image shows no
 * area.
 *
 * @param root The interaction's root, `data-slot="graphic-order-interaction"`.
 * @returns The view; its lists are empty for a root without the parts.
 */
export const viewOf = (root: HTMLElement): GraphicOrderView => {
  const hotspots = [...root.querySelectorAll<HTMLElement>(`[data-slot="${hotspotSlot}"]`)].filter(
    (hotspot) => (hotspot.dataset["identifier"] ?? "") !== "",
  );
  const written = [...root.querySelectorAll<HTMLElement>(`[data-slot="${positionSlot}"]`)];
  const most = Number(root.dataset["maxChoices"]);
  const positions = Number.isInteger(most) && most > 0 ? written.slice(0, most) : written;
  const originals = hotspots.map((hotspot) => {
    const outline = outlineOf(hotspot);
    const badge = badgeIn(outline);

    return {
      badge:
        badge === null
          ? undefined
          : {
              element: badge,
              number: badge.dataset["position"] ?? null,
              text: badge.textContent,
            },
      children: outline === null ? [] : [...outline.childNodes],
      element: hotspot,
      outline,
      position: hotspot.dataset["position"] ?? null,
    };
  });
  const contents = positions.map((position) => ({
    children: [...position.childNodes],
    element: position,
    empty: Object.hasOwn(position.dataset, "empty"),
  }));
  const focusable = claim([...hotspots, ...positions], "tabindex", "0");
  const unlisted = claim(
    [...root.querySelectorAll<HTMLElement>(`[data-slot="${hotspotsSlot}"]`)],
    "role",
    "none",
  );
  const areas = claim(
    hotspots.flatMap((hotspot) =>
      [...(outlineOf(hotspot)?.children ?? [])].filter(
        (area) => !area.matches(`[data-slot="${badgeSlot}"]`),
      ),
    ),
    "pointer-events",
    "all",
  );

  /**
   * Read the name a hotspot or a position is announced by.
   *
   * @param element A hotspot or a position.
   * @returns For a position, "Position n"; for a hotspot, its `aria-label`, else "Area n of count".
   */
  const labelOf = (element: HTMLElement): string => {
    const place = positions.indexOf(element);

    if (place !== -1) {
      return words.position(place + 1);
    }

    const labelled = collapse(element.getAttribute("aria-label") ?? "");

    return labelled === "" ? words.area(hotspots.indexOf(element) + 1, hotspots.length) : labelled;
  };

  /**
   * Compare two placements by the place of their positions.
   *
   * @param first One placement.
   * @param second The other placement.
   * @returns Negative when the first sits in an earlier position.
   */
  const byPosition = (first: OrderPlacement, second: OrderPlacement): number =>
    positions.indexOf(first.target) - positions.indexOf(second.target);

  return {
    hotspots,
    labelOf,
    placementOf: (placements, element) => {
      const position = positions.find((candidate) => candidate.contains(element));

      return placements.find((placement) => placement.target === position);
    },
    positions,
    restore: () => {
      for (const { badge, children, element, outline, position } of originals) {
        if (outline !== null && !holds(outline, children)) {
          outline.replaceChildren(...children);
        }

        putBack(element, "data-position", position);

        if (badge !== undefined) {
          putBack(badge.element, "data-position", badge.number);

          if (badge.element.textContent !== badge.text) {
            badge.element.textContent = badge.text;
          }
        }
      }

      for (const { children, element, empty } of contents) {
        if (!holds(element, children)) {
          element.replaceChildren(...children);
        }

        putBack(element, "data-empty", empty ? "" : null);
      }

      for (const element of focusable) {
        element.removeAttribute("tabindex");
      }

      for (const element of unlisted) {
        element.removeAttribute("role");
      }

      for (const element of areas) {
        element.removeAttribute("pointer-events");
      }
    },
    restored: (identifiers) => {
      const placements: OrderPlacement[] = [];

      for (const [place, identifier] of identifiers.entries()) {
        const token = hotspots.find((hotspot) => hotspot.dataset["identifier"] === identifier);
        const target = positions[place];

        if (
          token !== undefined &&
          target !== undefined &&
          !placements.some((placement) => placement.token === token)
        ) {
          placements.push({ target, token });
        }
      }

      return placements;
    },
    settle: (previous, made) => {
      const added = made.length > previous.length ? made.at(-1) : undefined;

      if (added === undefined) {
        return made.toSorted(byPosition);
      }

      const from = previous.find((placement) => placement.token === added.token);
      const holder = previous.find((placement) => placement.target === added.target);

      if (holder?.token === added.token) {
        return previous;
      }

      const swapped =
        from === undefined || holder === undefined
          ? []
          : [{ target: from.target, token: holder.token }];

      return [
        ...previous.filter((placement) => placement !== from && placement !== holder),
        added,
        ...swapped,
      ].toSorted(byPosition);
    },
    show: (placements) => {
      for (const hotspot of hotspots) {
        const placement = placements.find((candidate) => candidate.token === hotspot);

        showHotspot(hotspot, placement === undefined ? -1 : positions.indexOf(placement.target));
      }

      for (const position of positions) {
        const placement = placements.find((candidate) => candidate.target === position);
        const text = placement === undefined ? words.empty : labelOf(placement.token);

        if (position.textContent !== text) {
          position.textContent = text;
        }

        position.toggleAttribute("data-empty", placement === undefined);
      }
    },
    spoken: (text, placements) => {
      const held = hotspots.find((hotspot) => hotspot.getAttribute("aria-pressed") === "true");

      for (const [place, position] of positions.entries()) {
        const holder = placements.find((placement) => placement.target === position)?.token;

        if (text === announcements.moved(labelOf(position), place + 1, positions.length)) {
          return holder === undefined ? text : `${text} ${words.holds(labelOf(holder))}`;
        }

        if (
          held !== undefined &&
          holder !== undefined &&
          holder !== held &&
          text === announcements.placed(labelOf(held), labelOf(position))
        ) {
          const from = placements.find((placement) => placement.token === held);

          return `${text} ${
            from === undefined
              ? announcements.returned(labelOf(holder))
              : words.swapped(labelOf(holder), labelOf(from.target))
          }`;
        }
      }

      return text;
    },
    valueOf: ({ token }) => token.dataset["identifier"] ?? "",
  };
};
