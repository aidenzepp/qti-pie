/**
 * The content-package vocabulary: the manifest elements of an IMS content package, in the CP
 * namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";

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
  "cp:metadata.file",
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
  "cp:metadata.file": {
    attributes: [],
    local: "metadata",
    namespace,
    parent: Option.some("cp:file"),
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

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const simpleContentChildren = ["text", "ws", "entityRef", "comment", "pi"] as const;

/**
 * The children each CP kind admits, by content type: the spec's 3.6 and 4.3. `cp:organizations` and
 * `cp:dependency` are empty types, so they admit no character data; `cp:metadata.file` admits the
 * record `lom:lom` and no `qmd:qtiMetadata`.
 */
const children: Readonly<Record<(typeof kinds)[number], readonly string[]>> = {
  "cp:dependency": ["comment", "pi"],
  "cp:file": ["cp:metadata.file", "ws", "comment", "pi"],
  "cp:manifest": [
    "cp:metadata.manifest",
    "cp:organizations",
    "cp:resources",
    "ws",
    "comment",
    "pi",
  ],
  "cp:metadata.file": ["lom:lom", "ws", "comment", "pi"],
  "cp:metadata.manifest": ["cp:schema", "cp:schemaversion", "lom:lom", "ws", "comment", "pi"],
  "cp:metadata.resource": ["qmd:qtiMetadata", "lom:lom", "ws", "comment", "pi"],
  "cp:organizations": ["comment", "pi"],
  "cp:resource": ["cp:metadata.resource", "cp:file", "cp:dependency", "ws", "comment", "pi"],
  "cp:resources": ["cp:resource", "ws", "comment", "pi"],
  "cp:schema": simpleContentChildren,
  "cp:schemaversion": simpleContentChildren,
};

/**
 * The CP admission rows, the same for both versions.
 */
export const admission: readonly AdmissionRow[] = Object.entries(children).flatMap(
  ([parent, kids]) =>
    versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);
