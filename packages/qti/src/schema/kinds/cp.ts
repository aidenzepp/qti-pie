/**
 * The content-package vocabulary: the manifest elements of an IMS content package, in the CP
 * namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The CP kinds, in append-only order; a dotted handle names an element by its parent.
 */
export const kinds = [
  "cp:manifest",
  "cp:metadata.manifest",
  "cp:metadata.resource",
  "cp:schema",
  "cp:schemaversion",
  "cp:organizations",
  "cp:resources",
  "cp:resource",
  "cp:file",
  "cp:dependency",
] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster:
 * `identifier` belongs to the ASI vocabulary under the first-vocabulary rule.
 */
export const attributes = ["type", "href", "identifierref"] as const;

/**
 * The registry row of each CP kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "cp:dependency": {
    attributes: ["identifierref"],
    local: "dependency",
    namespace,
    parent: Option.none(),
  },
  "cp:file": { attributes: ["href"], local: "file", namespace, parent: Option.none() },
  "cp:manifest": {
    attributes: ["identifier"],
    local: "manifest",
    namespace,
    parent: Option.none(),
  },
  "cp:metadata.manifest": {
    attributes: [],
    local: "metadata",
    namespace,
    parent: Option.some("cp:manifest"),
  },
  "cp:metadata.resource": {
    attributes: [],
    local: "metadata",
    namespace,
    parent: Option.some("cp:resource"),
  },
  "cp:organizations": { attributes: [], local: "organizations", namespace, parent: Option.none() },
  "cp:resource": {
    attributes: ["identifier", "type", "href"],
    local: "resource",
    namespace,
    parent: Option.none(),
  },
  "cp:resources": { attributes: [], local: "resources", namespace, parent: Option.none() },
  "cp:schema": { attributes: [], local: "schema", namespace, parent: Option.none() },
  "cp:schemaversion": { attributes: [], local: "schemaversion", namespace, parent: Option.none() },
};

/**
 * The CP admission rows: none yet.
 */
export const admission: readonly AdmissionRow[] = [];
