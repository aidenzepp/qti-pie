/**
 * The coordinates of a hotspot-like element, by the shape that says how to read them.
 *
 * A `Coords` row belongs to the node of one hotspot element and carries that element's kind, so a
 * hotspot arm can ask for exactly the rows of its own kind. The shape arms hold the pattern each
 * shape's coordinate list must match. Each hotspot arm module states its own capacity and
 * containment through the two helpers below.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `Shape` is the roster name the spec fixes and `shapeCapacities` and the `shape` field are the contract the three hotspot arm modules call; the shape here is a geometric one, not a structure. */
import {
  alternatives,
  capacity,
  closedId,
  contained,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import type { ClosedIdField, Relation } from "@bjornpagen/grizzle";
import { Shape } from "#qti/schema/content/rosters.ts";
import { Node, NodeKind } from "#qti/schema/node.ts";
import type { NodeKindHandle } from "#qti/schema/node.ts";
import { RectCoords, ShapeCoords } from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The coordinates of one hotspot-like element, and what shape they are for. `ownerKind` copies the
 * element's node kind.
 */
export const Coords = relation(
  "Coords",
  {
    node: uuid,
    ownerKind: closedId(NodeKind),
    shape: closedId(Shape),
    value: ShapeCoords,
  },
  ["node"],
);

/**
 * A circle's coordinates: centre and radius.
 */
export const CoordsCircle = relation(
  "CoordsCircle",
  { node: uuid, value: str.regex(patterns.coordsCircle) },
  ["node"],
);

/**
 * The default shape's coordinates, which the shape leaves free.
 */
export const CoordsDefault = relation("CoordsDefault", { node: uuid, value: ShapeCoords }, [
  "node",
]);

/**
 * An ellipse's coordinates: the same four values as a rectangle.
 */
export const CoordsEllipse = relation("CoordsEllipse", { node: uuid, value: RectCoords }, ["node"]);

/**
 * A polygon's coordinates: at least three points.
 */
export const CoordsPoly = relation(
  "CoordsPoly",
  { node: uuid, value: str.regex(patterns.coordsPoly) },
  ["node"],
);

/**
 * A rectangle's coordinates: two corners.
 */
export const CoordsRect = relation("CoordsRect", { node: uuid, value: RectCoords }, ["node"]);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  Coords,
  CoordsCircle,
  CoordsDefault,
  CoordsEllipse,
  CoordsPoly,
  CoordsRect,
};

/**
 * No arms: `Coords` is keyed by a node of a kind another module owns.
 */
export const arms = {};

/**
 * A hotspot-like arm: keyed by `id` and recording its `shape`.
 */
export type HotspotArm = Relation<
  string,
  { readonly id: typeof uuid; readonly shape: ClosedIdField<typeof Shape> },
  readonly ["id"]
>;

/**
 * A hotspot-like arm's capacity over its coordinates: a rect, circle, ellipse or poly element has
 * exactly one `Coords` row, and a default one has at most one. The row counts for the one arm row
 * whose `id` is its node, so no selection of `Coords` is needed.
 */
export const shapeCapacities = (arm: HotspotArm) =>
  [
    capacity(on(select(arm, { shape: "circle" } as const), "id"), {
      from: on(Coords, "node"),
      within: within(1n, 1n),
    }),
    capacity(on(select(arm, { shape: "default" } as const), "id"), {
      from: on(Coords, "node"),
      within: within(0n, 1n),
    }),
    capacity(on(select(arm, { shape: "ellipse" } as const), "id"), {
      from: on(Coords, "node"),
      within: within(1n, 1n),
    }),
    capacity(on(select(arm, { shape: "poly" } as const), "id"), {
      from: on(Coords, "node"),
      within: within(1n, 1n),
    }),
    capacity(on(select(arm, { shape: "rect" } as const), "id"), {
      from: on(Coords, "node"),
      within: within(1n, 1n),
    }),
  ] as const;

/**
 * Every `Coords` row of one owner kind is the coordinates of an element of that kind's arm, with
 * the shape the arm records. The source is selected on the owner: a containment holds for every
 * source row, so an unselected one would demand every `Coords` row in every arm.
 */
export const coordsBinding = (arm: HotspotArm, ownerKind: NodeKindHandle) =>
  contained(on(select(Coords, { ownerKind }), "node", "shape"), on(arm, "id", "shape"));

/**
 * The statements over `Coords`: its owner copy is the owner's node kind, and each shape's
 * coordinates are an arm of it.
 */
export const rules = [
  contained(on(Coords, "node", "ownerKind"), on(Node, "id", "kind")),
  alternatives(Coords, "shape", Shape, {
    circle: CoordsCircle,
    default: CoordsDefault,
    ellipse: CoordsEllipse,
    poly: CoordsPoly,
    rect: CoordsRect,
  }),
] as const;
