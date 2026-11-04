/**
 * The curriculum standards metadata set: the set a resource's or manifest's metadata may carry, the
 * metadata beneath it, its sets of GUIDs and their labelled GUIDs, and the attributes and leaves of
 * each. Every node of the set is an edge child of its parent.
 *
 * This module is a leaf: nothing composes it yet.
 */
import {
  capacity,
  contained,
  key,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import type * as csmd from "#qti/schema/kinds/csmd.ts";
import { CaseItemUri } from "#qti/schema/contracts.ts";
import { Edge, Node } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * A curriculum standards metadata set, hosted by the node it sits under: file metadata, a `lom`, or
 * a manifest's or resource's metadata. The host carries no candidate key, since a second set under
 * file metadata or inside a `lom` is valid.
 */
export const CsmSet = relation("CsmSet", { host: uuid, id: uuid }, ["id"]);

/**
 * The `resourceLabel` of a set, when it has one. Its class is `replace`.
 */
export const CsmSetResourceLabel = relation(
  "CsmSetResourceLabel",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * The `resourcePartId` of a set, when it has one. Its class is `replace`.
 */
export const CsmSetResourcePartId = relation(
  "CsmSetResourcePartId",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A curriculum standards metadata element under a set.
 */
export const CsmMetadata = relation("CsmMetadata", { id: uuid, set: uuid }, ["id"]);

/**
 * The `providerId` of a metadata element, when it has one.
 */
export const CsmMetadataProviderId = relation(
  "CsmMetadataProviderId",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A set of GUIDs under a metadata element.
 */
export const CsmSetOfGuids = relation("CsmSetOfGuids", { id: uuid, metadata: uuid }, ["id"]);

/**
 * The `region` of a set of GUIDs, when it has one.
 */
export const CsmSetOfGuidsRegion = relation(
  "CsmSetOfGuidsRegion",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * The `version` of a set of GUIDs, when it has one.
 */
export const CsmSetOfGuidsVersion = relation(
  "CsmSetOfGuidsVersion",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A labelled GUID under a set of GUIDs.
 */
export const CsmLabelledGuid = relation("CsmLabelledGuid", { id: uuid, setOfGuids: uuid }, ["id"]);

/**
 * The `label` of a labelled GUID, kept after `replace`.
 */
export const CsmLabel = relation(
  "CsmLabel",
  { id: uuid, labelledGuid: uuid, value: xsNormalizedString },
  ["id"],
);

/**
 * The `caseItemURI` of a labelled GUID, kept after collapse.
 */
export const CsmCaseItemUri = relation(
  "CsmCaseItemUri",
  { id: uuid, labelledGuid: uuid, value: CaseItemUri },
  ["id"],
);

/**
 * The `GUID` of a labelled GUID, kept after `replace`.
 */
export const CsmGuid = relation(
  "CsmGuid",
  { id: uuid, labelledGuid: uuid, value: xsNormalizedString },
  ["id"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  CsmCaseItemUri,
  CsmGuid,
  CsmLabel,
  CsmLabelledGuid,
  CsmMetadata,
  CsmMetadataProviderId,
  CsmSet,
  CsmSetOfGuids,
  CsmSetOfGuidsRegion,
  CsmSetOfGuidsVersion,
  CsmSetResourceLabel,
  CsmSetResourcePartId,
};

/**
 * The statements over these relations: each node hangs under its parent by an edge; a manifest's
 * or resource's metadata holds at most one set; each level holds one or more of the next; a
 * labelled GUID holds one label, one case item URI and one GUID at most each; and each optional
 * attribute names its owner.
 */
export const rules = [
  contained(on(CsmSet, "id", "host"), on(Edge, "child", "parent")),
  capacity(on(select(Node, { kind: "cp:metadata.manifest" }), "id"), {
    from: on(CsmSet, "host"),
    within: within(0n, 1n),
  }),
  capacity(on(select(Node, { kind: "cp:metadata.resource" }), "id"), {
    from: on(CsmSet, "host"),
    within: within(0n, 1n),
  }),
  contained(on(CsmSetResourceLabel, "node"), on(CsmSet, "id")),
  contained(on(CsmSetResourcePartId, "node"), on(CsmSet, "id")),
  contained(on(CsmMetadata, "id", "set"), on(Edge, "child", "parent")),
  contained(on(CsmMetadata, "set"), on(CsmSet, "id")),
  capacity(on(CsmSet, "id"), { from: on(CsmMetadata, "set"), within: within(1n, "*") }),
  contained(on(CsmMetadataProviderId, "node"), on(CsmMetadata, "id")),
  contained(on(CsmSetOfGuids, "id", "metadata"), on(Edge, "child", "parent")),
  contained(on(CsmSetOfGuids, "metadata"), on(CsmMetadata, "id")),
  capacity(on(CsmMetadata, "id"), { from: on(CsmSetOfGuids, "metadata"), within: within(1n, "*") }),
  contained(on(CsmSetOfGuidsRegion, "node"), on(CsmSetOfGuids, "id")),
  contained(on(CsmSetOfGuidsVersion, "node"), on(CsmSetOfGuids, "id")),
  contained(on(CsmLabelledGuid, "id", "setOfGuids"), on(Edge, "child", "parent")),
  contained(on(CsmLabelledGuid, "setOfGuids"), on(CsmSetOfGuids, "id")),
  capacity(on(CsmSetOfGuids, "id"), {
    from: on(CsmLabelledGuid, "setOfGuids"),
    within: within(1n, "*"),
  }),
  contained(on(CsmLabel, "id", "labelledGuid"), on(Edge, "child", "parent")),
  contained(on(CsmLabel, "labelledGuid"), on(CsmLabelledGuid, "id")),
  key(CsmLabel, ["labelledGuid"]),
  contained(on(CsmCaseItemUri, "id", "labelledGuid"), on(Edge, "child", "parent")),
  contained(on(CsmCaseItemUri, "labelledGuid"), on(CsmLabelledGuid, "id")),
  key(CsmCaseItemUri, ["labelledGuid"]),
  contained(on(CsmGuid, "id", "labelledGuid"), on(Edge, "child", "parent")),
  contained(on(CsmGuid, "labelledGuid"), on(CsmLabelledGuid, "id")),
  key(CsmGuid, ["labelledGuid"]),
  capacity(on(CsmLabelledGuid, "id"), {
    from: on(CsmGuid, "labelledGuid"),
    within: within(1n, 1n),
  }),
] as const;

/**
 * The element arms of this module, keyed by `NodeKind` handle.
 */
export const arms = {
  "csmd:GUID": CsmGuid,
  "csmd:caseItemURI": CsmCaseItemUri,
  "csmd:curriculumStandardsMetadata": CsmMetadata,
  "csmd:curriculumStandardsMetadataSet": CsmSet,
  "csmd:label": CsmLabel,
  "csmd:labelledGUID": CsmLabelledGuid,
  "csmd:setOfGUIDs": CsmSetOfGuids,
} as const satisfies Record<(typeof csmd.kinds)[number], AnyRelation>;
