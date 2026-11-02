/**
 * Which child kinds each parent kind admits under each schema version, composed from the kinds
 * files.
 */
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as csmd from "#qti/schema/kinds/csmd.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import type { AdmissionRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import * as xi from "#qti/schema/kinds/xi.ts";
import { NodeKind, SchemaVersion } from "#qti/schema/node.ts";

const kindOrder: ReadonlyMap<string, number> = new Map(
  NodeKind.handles.map((handle, index) => [handle, index]),
);

const versionOrder: ReadonlyMap<string, number> = new Map(
  SchemaVersion.handles.map((handle, index) => [handle, index]),
);

/**
 * The position of a version in its roster; a version outside the roster is a composition error.
 */
const rank = (order: ReadonlyMap<string, number>, handle: string): number => {
  const position = order.get(handle);
  if (position === undefined) {
    throw new Error(`admission names "${handle}", which its roster does not declare`);
  }

  return position;
};

/**
 * Orders two node-kind handles: roster order first, then a handle the roster does not yet declare
 * after every declared one, by name.
 */
const compareKinds = (left: string, right: string): number => {
  const leftRank = kindOrder.get(left);
  const rightRank = kindOrder.get(right);
  if (leftRank !== undefined && rightRank !== undefined) {
    return leftRank - rightRank;
  }

  if (leftRank !== undefined) {
    return -1;
  }

  if (rightRank !== undefined) {
    return 1;
  }

  return left.localeCompare(right);
};

/**
 * The admission rows of every kinds file, deduplicated on (version, parent, child) and sorted by
 * version, then parent, then child in `NodeKind` roster order, a handle not yet in the roster
 * after the roster, by name.
 */
export const admission: readonly AdmissionRow[] = [
  ...new Map(
    [
      ...generic.admission,
      ...asi.admission,
      ...html.admission,
      ...cp.admission,
      ...lom.admission,
      ...qmd.admission,
      ...cpx.admission,
      ...drd.admission,
      ...csmd.admission,
      ...ud.admission,
      ...xi.admission,
    ].map((row) => [`${row.version}\u0000${row.parent}\u0000${row.child}`, row] as const),
  ).values(),
].toSorted(
  (left, right) =>
    rank(versionOrder, left.version) - rank(versionOrder, right.version) ||
    compareKinds(left.parent, right.parent) ||
    compareKinds(left.child, right.child),
);

/**
 * The admission rows of one schema version, in the order of `admission`.
 */
export const admissionByVersion = (version: SchemaVersionHandle): readonly AdmissionRow[] =>
  admission.filter((row) => row.version === version);
