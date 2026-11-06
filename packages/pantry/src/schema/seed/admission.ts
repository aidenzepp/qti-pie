/**
 * What the kinds files seed, composed once: the admission rows, the attribute admission rows and
 * the ancestry steps.
 */
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as foreign from "#pantry/schema/kinds/foreign.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import type { AdmissionRow, SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as mathml from "#pantry/schema/kinds/mathml.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { NodeKind, SchemaVersion } from "#pantry/schema/node.ts";
import { KindEnters, ancestryStepRows } from "#pantry/schema/seed/ancestry.ts";
import { attributeAdmissionRows } from "#pantry/schema/seed/attribute-admission.ts";
import {
  globalElement,
  wildcardAttributeAdmission,
  wildcardHost,
} from "#pantry/schema/seed/wildcard.ts";
import { wildcardAdmissionRows } from "#pantry/schema/seed/wildcard-admission.ts";

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
  cpx.registry,
  drd.registry,
  csmd.registry,
  ud.registry,
  xi.registry,
  test.registry,
  mathml.registry,
];

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

const kindsRows: readonly AdmissionRow[] = [
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
  ...test.admission,
  ...foreign.admission,
  ...mathml.admission,
];

/**
 * Deduplicates rows on (version, parent, child) and sorts them by version, then parent, then child
 * in `NodeKind` roster order, a handle not yet in the roster after the roster, by name.
 */
const composeAdmission = (rows: readonly AdmissionRow[]): readonly AdmissionRow[] =>
  [
    ...new Map(
      rows.map((row) => [`${row.version}\u0000${row.parent}\u0000${row.child}`, row] as const),
    ).values(),
  ].toSorted(
    (left, right) =>
      rank(versionOrder, left.version) - rank(versionOrder, right.version) ||
      compareKinds(left.parent, right.parent) ||
      compareKinds(left.child, right.child),
  );

/**
 * The admission rows of every kinds file alone, the host's explicit particles (spec 4.1 step 1),
 * composed as `admission` is. The derived wildcard rows are left out: they are the database's
 * representation of what a wildcard admits, not particles a host declares.
 */
export const explicitAdmission: readonly AdmissionRow[] = composeAdmission(kindsRows);

/**
 * The admission rows of every kinds file with the rows derived from the wildcard hosts, composed
 * by `composeAdmission`.
 */
export const admission: readonly AdmissionRow[] = composeAdmission([
  ...kindsRows,
  ...wildcardAdmissionRows({ globals: globalElement, hosts: wildcardHost, registries }),
]);

/**
 * The admission rows of one schema version, in the order of `admission`.
 */
export const admissionByVersion = (version: SchemaVersionHandle): readonly AdmissionRow[] =>
  admission.filter((row) => row.version === version);

/**
 * The attribute names each kind may carry: the one composed registry list, and the names a
 * wildcard host admits as typed (`foreign`'s own names reach it through the latter, so its registry
 * row is not in `registries`).
 */
export const attributeAdmission = attributeAdmissionRows(registries, wildcardAttributeAdmission);

/**
 * The ancestry steps of every handle of `NodeKind`: a kind a later phase appends gains its rows
 * with no edit here.
 */
export const ancestryStep = ancestryStepRows(NodeKind.handles, KindEnters);
