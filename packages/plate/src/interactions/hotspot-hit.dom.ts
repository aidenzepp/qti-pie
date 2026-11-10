/**
 * Hotspot's (Q-10) pointer geometry for its runtime controller (issue m3d-08): which hotspot a
 * click on the image selects, from the areas the core drew (issue m3d-07) and the place the click
 * fell.
 *
 * The core draws each hotspot's area as the one `data-shape` element of its Outline, in the image's
 * own coordinate space, the percentages already scaled; this module reads those elements back into
 * the area's `coords` and tests a point against them as `areaHolds` does in
 * `engine/expressions/shapes.ts` (the same readings of HTML's image-map processing: an area holds
 * its boundary, a `rect`'s corners may come in either order, a radius of zero or less holds no
 * point, a polygon is even-odd), in plain numbers, because that module value-imports `effect` and
 * the page bundle carries none.
 *
 * @module
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-hotspot-choice` and names an area's geometry, not a structure. */

/**
 * The `data-slot` marker of the Hotspot Image part, the box the hotspots lie over.
 */
export const imageSlot = "hotspot-interaction-image";

/**
 * The `data-slot` marker of the Hotspot Choices part, which holds every Choice after the image.
 */
const choicesSlot = "hotspot-interaction-choices";

/**
 * The `data-slot` marker of a Hotspot Choice, the `label` that holds a hotspot's parts.
 */
const choiceSlot = "hotspot-interaction-choice";

/**
 * The `data-slot` marker of a Hotspot Control, the native radio or checkbox.
 */
export const controlSlot = "hotspot-interaction-control";

/**
 * The `data-slot` marker of a Hotspot Label, the hotspot's visually hidden name.
 */
export const labelSlot = "hotspot-interaction-label";

/**
 * The `data-slot` marker of a Hotspot Outline, the `svg` that draws a hotspot's area.
 */
const outlineSlot = "hotspot-interaction-outline";

/**
 * A point in the image's own pixels, the space the areas' coordinates are written in.
 */
export interface ImagePoint {
  readonly x: number;
  readonly y: number;
}

/**
 * One hotspot as the page holds it: its native Control, and whether the click's point is in its
 * area.
 */
export interface Area {
  readonly control: HTMLInputElement;

  /**
   * Whether this is the default hotspot, which holds every point no other area holds.
   */
  readonly fallback: boolean;

  /**
   * Test whether the area holds a point. An area the page drew no Outline for holds none.
   *
   * @param point The point in the image's own pixels.
   * @returns Whether the area holds it.
   */
  readonly holds: (point: ImagePoint) => boolean;
}

/**
 * The size of the image's own pixel space.
 */
interface ImageSize {
  readonly height: number;
  readonly width: number;
}

/**
 * A test of an area's coordinates against a point, each a number in its own place.
 */
type AreaTest = (coords: readonly number[], x: number, y: number) => boolean;

/**
 * Square a number as a product, which the source guard asks for in place of `**`.
 *
 * @param value The number.
 * @returns `value * value`.
 */
const square = (value: number): number => value * value;

/**
 * Report whether a point lies on the segment between two vertices, its ends included: on their line
 * (their cross-product is 0) and within their box.
 *
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @param from One end, as `[x, y]`.
 * @param to The other end.
 * @returns Whether the point is on the segment.
 */
const onSegment = (
  x: number,
  y: number,
  from: readonly [number, number],
  to: readonly [number, number],
): boolean => {
  const [x1, y1] = from;
  const [x2, y2] = to;

  return (
    (x2 - x1) * (y - y1) === (y2 - y1) * (x - x1) &&
    Math.min(x1, x2) <= x &&
    x <= Math.max(x1, x2) &&
    Math.min(y1, y2) <= y &&
    y <= Math.max(y1, y2)
  );
};

/**
 * Report whether a polygon holds a point: on an edge, or inside by the even-odd rule, the last
 * vertex joining the first.
 *
 * @param vertices The polygon's vertices, in order.
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @returns Whether the polygon holds the point.
 */
const polygonHolds = (
  vertices: readonly (readonly [number, number])[],
  x: number,
  y: number,
): boolean => {
  let inside = false;

  for (const [index, to] of vertices.entries()) {
    const from = vertices.at(index - 1) ?? to;

    if (onSegment(x, y, from, to)) {
      return true;
    }

    const [x1, y1] = from;
    const [x2, y2] = to;

    if (y1 > y !== y2 > y) {
      const left = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);

      if (y2 > y1 ? left > 0 : left < 0) {
        inside = !inside;
      }
    }
  }

  return inside;
};

/**
 * Whether an area of each geometry holds a point, from the area's coordinates as QTI writes them:
 * `rect` is left-x, top-y, right-x, bottom-y; `circle` is center-x, center-y, radius; `ellipse` is
 * center-x, center-y, h-radius, v-radius; `poly` is x1, y1, …, xN, yN; `default` holds every point.
 * An area with fewer coordinates than its geometry needs holds no point, and coordinates beyond
 * them are ignored.
 */
const areaTests = {
  circle: ([cx = Number.NaN, cy = Number.NaN, radius = Number.NaN], x, y) =>
    radius > 0 && square(x - cx) + square(y - cy) <= square(radius),
  default: () => true,
  ellipse: ([cx = Number.NaN, cy = Number.NaN, across = Number.NaN, down = Number.NaN], x, y) =>
    across > 0 &&
    down > 0 &&
    square((x - cx) * down) + square((y - cy) * across) <= square(across * down),
  poly: (coords, x, y) => {
    const vertices: (readonly [number, number])[] = [];

    for (let index = 0; index + 1 < coords.length; index += 2) {
      vertices.push([coords[index] ?? Number.NaN, coords[index + 1] ?? Number.NaN]);
    }

    return vertices.length >= 3 && polygonHolds(vertices, x, y);
  },
  rect: ([left = Number.NaN, top = Number.NaN, right = Number.NaN, bottom = Number.NaN], x, y) =>
    Math.min(left, right) <= x &&
    x <= Math.max(left, right) &&
    Math.min(top, bottom) <= y &&
    y <= Math.max(top, bottom),
} satisfies Readonly<Record<string, AreaTest>>;

/**
 * Find the test of a geometry.
 *
 * @param geometry The value of a hotspot's `data-shape` marker.
 * @returns The test, or `undefined` for a geometry this module does not know.
 */
const testOf = (geometry: string): AreaTest | undefined =>
  Object.entries(areaTests).find(([name]) => name === geometry)?.[1];

/**
 * Read the numbers an SVG element's attributes write.
 *
 * @param element The element.
 * @param names The attributes' names.
 * @returns Each attribute as a number, `NaN` for one the element lacks or writes as no number.
 */
const numbersOf = (element: Element, names: readonly string[]): readonly number[] =>
  names.map((name) => {
    const written = element.getAttribute(name);

    return written === null || written.trim() === "" ? Number.NaN : Number(written);
  });

/**
 * Read an Outline's drawn shape back into the area's QTI coordinates.
 *
 * @param drawn The element with the `data-shape` marker.
 * @param geometry The marker's value.
 * @returns The coordinates, in the order QTI writes them for the geometry.
 */
const coordsOf = (drawn: Element, geometry: string): readonly number[] => {
  switch (geometry) {
    case "rect": {
      const [x = Number.NaN, y = Number.NaN, width = Number.NaN, height = Number.NaN] = numbersOf(
        drawn,
        ["x", "y", "width", "height"],
      );

      return [x, y, x + width, y + height];
    }
    case "circle": {
      return numbersOf(drawn, ["cx", "cy", "r"]);
    }
    case "ellipse": {
      return numbersOf(drawn, ["cx", "cy", "rx", "ry"]);
    }
    case "poly": {
      return (drawn.getAttribute("points") ?? "")
        .split(/[\s,]+/u)
        .filter((token) => token !== "")
        .map(Number);
    }
    default: {
      return [];
    }
  }
};

/**
 * Test whether a Choice's drawn area holds a point.
 *
 * @param choice The Choice.
 * @returns The area's test, which holds no point when the Choice drew no area.
 */
const holdsOf = (choice: HTMLElement): Area["holds"] => {
  const drawn = choice.querySelector<SVGElement>(`[data-slot="${outlineSlot}"] [data-shape]`);
  const geometry = drawn?.dataset["shape"] ?? "";
  const test = testOf(geometry);

  if (drawn === null || test === undefined) {
    return () => false;
  }

  const coords = coordsOf(drawn, geometry);

  return ({ x, y }) => test(coords, x, y);
};

/**
 * List the hotspots of a Hotspot Root in document order, each with its Control and the test of its
 * drawn area. The default hotspot is the one whose area is the whole image.
 *
 * @param root The Hotspot's root.
 * @returns The hotspots that have a Control.
 */
export const areasOf = (root: HTMLElement): readonly Area[] =>
  [...root.querySelectorAll<HTMLElement>(`[data-slot="${choiceSlot}"]`)].flatMap((choice) => {
    const control = choice.querySelector<HTMLInputElement>(`input[data-slot="${controlSlot}"]`);

    if (control === null) {
      return [];
    }

    const drawn = choice.querySelector<SVGElement>(`[data-slot="${outlineSlot}"] [data-shape]`);

    return [{ control, fallback: drawn?.dataset["shape"] === "default", holds: holdsOf(choice) }];
  });

/**
 * Find the author's image inside the Image part: its first `img` or `object` outside the Choices.
 *
 * @param part The Hotspot Image part.
 * @returns The image element, or the part itself when it holds none.
 */
const imageOf = (part: HTMLElement): HTMLElement => {
  const choices = part.querySelector(`[data-slot="${choicesSlot}"]`);

  return (
    [...part.querySelectorAll<HTMLElement>("img, object")].find(
      (element) => choices === null || !choices.contains(element),
    ) ?? part
  );
};

/**
 * Read the size of the image's own pixel space: the `viewBox` the core gave its Outlines, which is
 * the `width` and `height` the author wrote; else the image's natural size; else its rendered size.
 *
 * @param part The Hotspot Image part.
 * @param image The author's image.
 * @param box The image's rendered box.
 * @returns The width and the height.
 */
const sizeOf = (part: HTMLElement, image: HTMLElement, box: DOMRect): ImageSize => {
  const outline = part.querySelector(`svg[data-slot="${outlineSlot}"]`);
  const written = outline instanceof SVGSVGElement ? outline.viewBox.baseVal : undefined;

  if (written !== undefined && written.width > 0 && written.height > 0) {
    return { height: written.height, width: written.width };
  }

  if (image instanceof HTMLImageElement && image.naturalWidth > 0 && image.naturalHeight > 0) {
    return { height: image.naturalHeight, width: image.naturalWidth };
  }

  return { height: box.height, width: box.width };
};

/**
 * Map a click back from the rendered image to the image's own pixels: its offset in the image's
 * rendered box, scaled by the ratio of the image's own size to the rendered one.
 *
 * @param part The Hotspot Image part.
 * @param event The click.
 * @returns The point, or `undefined` when the click fell outside the rendered image or the image
 *   has no rendered size.
 */
export const pointOf = (part: HTMLElement, event: MouseEvent): ImagePoint | undefined => {
  const image = imageOf(part);
  const box = image.getBoundingClientRect();
  const left = event.clientX - box.left;
  const top = event.clientY - box.top;

  if (box.width <= 0 || box.height <= 0 || left < 0 || top < 0) {
    return undefined;
  }

  if (left > box.width || top > box.height) {
    return undefined;
  }

  const size = sizeOf(part, image, box);

  return { x: left * (size.width / box.width), y: top * (size.height / box.height) };
};

/**
 * Pick the hotspot a point selects: the first one listed whose area holds it, so that where areas
 * overlap the first hides the later ones; else the default hotspot; else none.
 *
 * @param areas The hotspots in document order.
 * @param point The point in the image's own pixels.
 * @returns The hotspot, or `undefined` when no area holds the point and there is no default.
 */
export const winnerOf = (areas: readonly Area[], point: ImagePoint): Area | undefined =>
  areas.find((area) => !area.fallback && area.holds(point)) ?? areas.find((area) => area.fallback);
