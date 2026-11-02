/**
 * What the kinds files seed, composed once: the admission rows, the attribute admission rows and
 * the ancestry steps.
 */
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import type { AdmissionRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import { NodeKind, SchemaVersion } from "#qti/schema/node.ts";
import { KindEnters, ancestryStepRows } from "#qti/schema/seed/ancestry.ts";
import { attributeAdmissionRows } from "#qti/schema/seed/attribute-admission.ts";

/**
 * The registry of every kinds file, in composition order. A later phase's kinds file joins this
 * list in its regenerate-and-seed slice, as it joins `node.ts`'s spreads.
 */
export const registries = [
  generic.registry,
  asi.registry,
  html.registry,
  cp.registry,
  lom.registry,
  qmd.registry,
];

const kindOrder: ReadonlyMap<string, number> = new Map(
  NodeKind.handles.map((handle, index) => [handle, index]),
);

const versionOrder: ReadonlyMap<string, number> = new Map(
  SchemaVersion.handles.map((handle, index) => [handle, index]),
);

/**
 * The position of a handle in its roster; a handle outside the roster is a composition error.
 */
const rank = (order: ReadonlyMap<string, number>, handle: string): number => {
  const position = order.get(handle);
  if (position === undefined) {
    throw new Error(`admission names "${handle}", which its roster does not declare`);
  }

  return position;
};

/**
 * The admission rows of every kinds file, deduplicated on (version, parent, child) and sorted by
 * version, then parent, then child in `NodeKind` roster order.
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
    ].map((row) => [`${row.version}\u0000${row.parent}\u0000${row.child}`, row] as const),
  ).values(),
].toSorted(
  (left, right) =>
    rank(versionOrder, left.version) - rank(versionOrder, right.version) ||
    rank(kindOrder, left.parent) - rank(kindOrder, right.parent) ||
    rank(kindOrder, left.child) - rank(kindOrder, right.child),
);

/**
 * The admission rows of one schema version, in the order of `admission`.
 */
export const admissionByVersion = (version: SchemaVersionHandle): readonly AdmissionRow[] =>
  admission.filter((row) => row.version === version);

/**
 * The attribute names each kind may carry, from the one composed registry list.
 */
export const attributeAdmission = attributeAdmissionRows(registries);

/**
 * The ancestry steps of every handle of `NodeKind`: a kind a later phase appends gains its rows
 * with no edit here.
 */
export const ancestryStep = ancestryStepRows(NodeKind.handles, KindEnters);
