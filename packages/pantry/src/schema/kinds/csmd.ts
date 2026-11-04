/**
 * The curriculum standards metadata vocabulary: the set a resource's metadata may carry and the
 * elements beneath it, in the CSM namespace. Data only; `node.ts` spreads it.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

// targetNamespace of imsqtiv3p0_csmv1p1_v1p0.xsd, line 3.
const namespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1";

/**
 * The CSM kinds, in the schema's declaration order; each handle is the prefix and the element's
 * local name.
 */
export const kinds = [
  "csmd:curriculumStandardsMetadataSet",
  "csmd:curriculumStandardsMetadata",
  "csmd:setOfGUIDs",
  "csmd:labelledGUID",
  "csmd:label",
  "csmd:caseItemURI",
  "csmd:GUID",
] as const;

/**
 * The attribute names these kinds introduce, in the order the registry lists them.
 */
export const attributes = [
  "resourceLabel",
  "resourcePartId",
  "providerId",
  "region",
  "version",
] as const;

const element = (local: string, names: readonly string[] = []): RegistryRow => ({
  attributes: names,
  local,
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each CSM kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "csmd:GUID": element("GUID"),
  "csmd:caseItemURI": element("caseItemURI"),
  "csmd:curriculumStandardsMetadata": element("curriculumStandardsMetadata", ["providerId"]),
  "csmd:curriculumStandardsMetadataSet": element("curriculumStandardsMetadataSet", [
    "resourceLabel",
    "resourcePartId",
  ]),
  "csmd:label": element("label"),
  "csmd:labelledGUID": element("labelledGUID"),
  "csmd:setOfGUIDs": element("setOfGUIDs", ["region", "version"]),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const hostRows = (parent: string, children: readonly string[]): readonly AdmissionRow[] =>
  versions.flatMap((version) => children.map((child) => ({ child, parent, version })));

const elementOnlyExtras = ["ws", "comment", "pi"] as const;

const simpleContentChildren = ["text", "ws", "entityRef", "comment", "pi"] as const;

const set = "csmd:curriculumStandardsMetadataSet";

const leaves = [
  "csmd:label",
  "csmd:caseItemURI",
  "csmd:GUID",
] as const satisfies readonly (typeof kinds)[number][];

/**
 * The CSM admission rows, the same for both versions: the set is admitted under the four hosts the
 * schema admits (`cp:metadata.manifest`, `cp:metadata.resource`, `cp:metadata.file` and `lom:lom`
 * as an extension child); each element-only host admits its children plus `ws`, `comment` and `pi`;
 * `csmd:labelledGUID` is a sequence, and the order of its three children is judged elsewhere; each
 * leaf admits character data, `entityRef`, `comment` and `pi` and no element.
 */
export const admission: readonly AdmissionRow[] = [
  ...hostRows("cp:metadata.manifest", [set]),
  ...hostRows("cp:metadata.resource", [set]),
  ...hostRows("cp:metadata.file", [set]),
  ...hostRows("lom:lom", [set]),
  ...hostRows(set, ["csmd:curriculumStandardsMetadata", ...elementOnlyExtras]),
  ...hostRows("csmd:curriculumStandardsMetadata", ["csmd:setOfGUIDs", ...elementOnlyExtras]),
  ...hostRows("csmd:setOfGUIDs", ["csmd:labelledGUID", ...elementOnlyExtras]),
  ...hostRows("csmd:labelledGUID", [...leaves, ...elementOnlyExtras]),
  ...leaves.flatMap((parent) => hostRows(parent, simpleContentChildren)),
];
