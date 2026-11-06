/**
 * The areas of a `qti-area-map-entry` and whether each holds a point ({@link areaHolds}), a leaf:
 * M1's area tests, which `qti-map-response-point` reads.
 *
 * Every test is geometry on floats, as HTML's image maps define it. The module value-imports only
 * `Array` from `effect`, and the area's type from the item model.
 *
 * @module
 */
import { Array as Arr } from "effect";
import type { AreaMapEntry } from "#plate/model/item.ts";

/**
 * Report whether a point lies on the segment between two vertices, its ends included.
 *
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @param from One end, as `[x, y]`.
 * @param to The other end.
 * @returns Whether the point is on the segment.
 */
export const onSegment = (
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
 * Report whether a polygon holds a point: on an edge, or inside by the even-odd rule, as HTML's
 * polygon area is. The last vertex joins the first, so a polygon that is not closed is closed.
 *
 * @param vertices The polygon's vertices, in order.
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @returns Whether the polygon holds the point.
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#attr-area-shape-poly
 */
export const polygonHolds = (
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
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Square a float as a product. ECMA-262 leaves `**` (Number::exponentiate) implementation-
 * approximated, so a last-place difference between engines could move a point across an area's
 * boundary (reading 52); a product is exact by definition in every engine.
 *
 * @param value The float.
 * @returns `value * value`.
 */
const square = (value: number): number => value * value;

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * Report whether an area of each shape holds a point, its boundary included (9.15's default,
 * reading 52), from the area's coordinates and the point's, as floats.
 *
 * The coordinates are QTI's, which are HTML's: `rect` is left-x, top-y, right-x, bottom-y;
 * `circle` is center-x, center-y, radius; `ellipse` is center-x, center-y, h-radius, v-radius;
 * `poly` is x1, y1, …, xN, yN; `default` holds every point. Where QTI says nothing, HTML's
 * image-map rules decide: an area with fewer coordinates than its shape needs holds no point,
 * coordinates beyond them are ignored (a `poly`'s odd last one too), a `rect`'s corners may come
 * in either order, and a radius of zero or less holds no point.
 *
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 */
export const areaHolds: Readonly<
  Record<AreaMapEntry["shape"], (coords: readonly number[], x: number, y: number) => boolean>
> = {
  circle: ([centerX, centerY, radius], x, y) =>
    centerX !== undefined &&
    centerY !== undefined &&
    radius !== undefined &&
    radius > 0 &&
    square(x - centerX) + square(y - centerY) <= square(radius),
  default: () => true,
  ellipse: ([centerX, centerY, across, down], x, y) =>
    centerX !== undefined &&
    centerY !== undefined &&
    across !== undefined &&
    down !== undefined &&
    across > 0 &&
    down > 0 &&
    square((x - centerX) / across) + square((y - centerY) / down) <= 1,
  poly: (coords, x, y) => {
    const vertices = Arr.chunksOf(coords, 2).flatMap(([vertexX, vertexY]) =>
      vertexY === undefined ? [] : [[vertexX, vertexY] as const],
    );

    return vertices.length >= 3 && polygonHolds(vertices, x, y);
  },
  rect: ([left, top, right, bottom], x, y) =>
    left !== undefined &&
    top !== undefined &&
    right !== undefined &&
    bottom !== undefined &&
    Math.min(left, right) <= x &&
    x <= Math.max(left, right) &&
    Math.min(top, bottom) <= y &&
    y <= Math.max(top, bottom),
};
/* oxlint-enable anti-slop/no-shape-in-symbol-names */
