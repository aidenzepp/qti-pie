/**
 * The closed vocabularies the content schema shares: data only, each a closed roster with no
 * relation and no attribute name. A relation of another module reads one through `closedId`, and
 * the engine requires the schema to declare the roster, so `relations` carries them all and the
 * composed schema spreads this file like a module.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `Shape` and `ToolShape` are the roster names the spec fixes and `shapes.ts` imports. */
import { closed } from "@bjornpagen/grizzle";

/**
 * The `shape` of a coordinate list; `shapes.ts` reads this roster.
 */
export const Shape = closed("Shape", ["circle", "default", "ellipse", "poly", "rect"]);

/**
 * The `show` and `hide` values of a visibility attribute.
 */
export const ShowHide = closed("ShowHide", ["show", "hide"]);

/**
 * The two layout axes.
 */
export const Orientation = closed("Orientation", ["vertical", "horizontal"]);

/**
 * A limit that is either capped or open.
 */
export const Bound = closed("Bound", ["bounded", "unlimited"]);

/**
 * Which of a name and a version a tool entry carries.
 */
export const ToolShape = closed("ToolShape", ["both", "nameOnly", "versionOnly"]);

/**
 * A two-way yes or no.
 */
export const YesNo = closed("YesNo", ["yes", "no"]);

/**
 * The attributes whose value is an `IDREF` or `IDREFS`, in alphabetical order.
 */
export const IdrefAttribute = closed("IdrefAttribute", [
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
  "data-catalog-idref",
  "headers",
]);

/**
 * The rosters as schema members.
 */
export const relations = { Bound, IdrefAttribute, Orientation, Shape, ShowHide, ToolShape, YesNo };

/**
 * The statements of this module: none.
 */
export const rules = [];

/**
 * A handle of `Shape`.
 */
export type ShapeHandle = (typeof Shape.handles)[number];

/**
 * A handle of `ShowHide`.
 */
export type ShowHideHandle = (typeof ShowHide.handles)[number];

/**
 * A handle of `Orientation`.
 */
export type OrientationHandle = (typeof Orientation.handles)[number];

/**
 * A handle of `Bound`.
 */
export type BoundHandle = (typeof Bound.handles)[number];

/**
 * A handle of `ToolShape`.
 */
export type ToolShapeHandle = (typeof ToolShape.handles)[number];

/**
 * A handle of `YesNo`.
 */
export type YesNoHandle = (typeof YesNo.handles)[number];

/**
 * A handle of `IdrefAttribute`.
 */
export type IdrefAttributeHandle = (typeof IdrefAttribute.handles)[number];
