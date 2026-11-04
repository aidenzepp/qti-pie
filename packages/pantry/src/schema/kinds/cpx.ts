/**
 * The CP extension vocabulary: the variant element a resource carries and its metadata container,
 * in the extension namespace. Data only; `node.ts` spreads it.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

// targetNamespace of imsqtiv3p0_cpextv1p2_v1p0.xsd, line 3.
const namespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2";

/**
 * The CP extension kinds, in append-only order; each handle is the prefixed local name. The
 * namespace differs from `cp:metadata`'s, so `cpx:metadata` is not a dotted handle.
 */
export const kinds = ["cpx:variant", "cpx:metadata"] as const;

/**
 * The attribute names these kinds introduce: none. `identifier` and `identifierref` are `asi`'s and
 * `cp`'s names.
 */
export const attributes = [] as const;

/**
 * The registry row of each CP extension kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "cpx:metadata": {
    attributes: [],
    local: "metadata",
    namespace,
    parent: Option.none(),
  },
  "cpx:variant": {
    attributes: ["identifier", "identifierref"],
    local: "variant",
    namespace,
    parent: Option.none(),
  },
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const elementOnly = ["ws", "comment", "pi"] as const;

const children: Readonly<Record<(typeof kinds)[number], readonly string[]>> = {
  "cpx:metadata": ["drd:accessForAllResource", ...elementOnly],
  "cpx:variant": ["cpx:metadata", ...elementOnly],
};

/**
 * The CP extension admission rows: both versions for the kinds' own children, and under 3.0.0
 * only the resource's `cpx:variant`; no 3.0.1 row admits it.
 */
export const admission: readonly AdmissionRow[] = [
  { child: "cpx:variant", parent: "cp:resource", version: "3.0.0" },
  ...Object.entries(children).flatMap(([parent, kids]) =>
    versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
  ),
];
