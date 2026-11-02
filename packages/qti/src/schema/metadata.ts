/**
 * The metadata a package carries: a LOM record (`lom:lom`) under a manifest's or a resource's
 * `cp:metadata`, and the arms of the LOM `general`, `lifeCycle` and `metaMetadata` categories
 * beneath it.
 *
 * A `Lom` names the kind of element that owns it. The owner's arm holds the `cp:metadata` node the
 * record hangs under, and every row below the record copies the record's id (and its owner where
 * the row's rules need it) so each can be judged against it. A parent or position a row copies is
 * bound to the `Edge` of the same child. The arms are the LOM kinds', keyed by node id; their
 * containments into `Node` are expanded from `alternatives(Node, "kind", NodeKind, ...)` in the
 * composed schema, so none is written here.
 */
import {
  alternatives,
  capacity,
  closed,
  closedId,
  contained,
  key,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Edge, Node } from "#qti/schema/node.ts";
import { Resource } from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

const resourceType = str.regex(patterns.resourceType);

const token = str.regex(patterns.xsToken, patterns.xsTokenFlags);

const boundedToken = str.regex(patterns.boundedToken, patterns.boundedTokenFlags);

const wildcard = str.regex(patterns.wildcard, patterns.wildcardFlags);

const language = str.regex(patterns.xsLanguageOrEmpty);

const xsBoolean = str.regex(patterns.xsBoolean);

const interactionTypeValue = str.regex(patterns.qmdInteractionType);

const feedbackTypeValue = str.regex(patterns.qmdFeedbackType);

const scoringModeValue = str.regex(patterns.qmdScoringMode);

const toolString = str.regex(patterns.toolString, patterns.toolStringFlags);

/**
 * The elements that own a LOM record. `file` and `external` are declared for the owners a later
 * milestone gives arms to.
 */
export const LomOwner = closed("LomOwner", ["manifest", "resource", "file", "external"]);

/**
 * A `lom:lom` record, its owner's kind and the package it lies in.
 */
export const Lom = relation("Lom", { id: uuid, owner: closedId(LomOwner), package: uuid }, ["id"]);

/**
 * A record owned by a manifest: the `cp:metadata` node it hangs under.
 */
export const ManifestLom = relation("ManifestLom", { lom: uuid, metadata: uuid, package: uuid }, [
  "lom",
]);

/**
 * A record owned by a resource: the `cp:metadata` node it hangs under and the resource, with the
 * resource's type.
 */
export const ResourceLom = relation(
  "ResourceLom",
  { lom: uuid, metadata: uuid, package: uuid, resource: ncName, type: resourceType },
  ["lom"],
);

/**
 * The `lom:general` of a record.
 */
export const LomGeneral = relation("LomGeneral", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:identifier` at its position among the general category's children.
 */
export const LomIdentifier = relation(
  "LomIdentifier",
  { id: uuid, lom: uuid, owner: closedId(LomOwner), position: pg.bigint },
  ["id"],
);

/**
 * The `lom:catalog` of an identifier, with the whitespace-collapsed form it is judged on beside the
 * value as written. `position` is the identifier's.
 */
export const LomIdentifierCatalog = relation(
  "LomIdentifierCatalog",
  {
    collapsed: token,
    id: uuid,
    identifier: uuid,
    lom: uuid,
    owner: closedId(LomOwner),
    position: pg.bigint,
    value: wildcard,
  },
  ["id"],
);

/**
 * The `lom:entry` of an identifier, with the whitespace-collapsed form it is judged on beside the
 * value as written. `position` is the identifier's.
 *
 * The collapsed form holds at most 256 non-space characters, a representation limit
 * (campaign decision 26), because a key-shaped containment target or index holds it.
 */
export const LomIdentifierEntry = relation(
  "LomIdentifierEntry",
  {
    collapsed: boundedToken,
    id: uuid,
    identifier: uuid,
    lom: uuid,
    owner: closedId(LomOwner),
    position: pg.bigint,
    value: wildcard,
  },
  ["id"],
);

/**
 * The `lom:title` of the general category.
 */
export const LomGeneralTitle = relation(
  "LomGeneralTitle",
  { id: uuid, lom: uuid, owner: closedId(LomOwner) },
  ["id"],
);

/**
 * A `lom:string`, wherever it occurs, with the whitespace-collapsed form it is judged on beside the
 * value as written.
 */
export const LomString = relation("LomString", { collapsed: token, id: uuid, value: wildcard }, [
  "id",
]);

/**
 * The string under a `lom:title`, at its position, with the value and collapsed form of the
 * `LomString` of the same node.
 *
 * The collapsed form holds at most 256 non-space characters, a representation limit
 * (campaign decision 26), because a key-shaped containment target or index holds it.
 */
export const LomTitle = relation(
  "LomTitle",
  {
    collapsed: boundedToken,
    id: uuid,
    lom: uuid,
    owner: closedId(LomOwner),
    position: pg.bigint,
    value: wildcard,
  },
  ["id"],
);

/**
 * The `language` attribute of a `lom:string`; the empty string is admitted.
 */
export const LomStringLanguage = relation("LomStringLanguage", { node: uuid, value: language }, [
  "node",
]);

/**
 * A `lom:language` at its position among the general category's children; the empty string is
 * admitted.
 */
export const LomLanguage = relation(
  "LomLanguage",
  { id: uuid, lom: uuid, position: pg.bigint, value: language },
  ["id"],
);

/**
 * A `lom:description` of the general category.
 */
export const LomDescription = relation("LomDescription", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:keyword` of the general category.
 */
export const LomKeyword = relation("LomKeyword", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:coverage` of the general category.
 */
export const LomCoverage = relation("LomCoverage", { id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:structure` of the general category.
 */
export const LomStructure = relation("LomStructure", { id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:aggregationLevel` of the general category.
 */
export const LomAggregationLevel = relation("LomAggregationLevel", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:source` leaf of a vocabulary container.
 */
export const LomSource = relation("LomSource", { collapsed: token, id: uuid, value: wildcard }, [
  "id",
]);

/**
 * A `lom:value` leaf of a vocabulary container.
 */
export const LomValue = relation("LomValue", { collapsed: token, id: uuid, value: wildcard }, [
  "id",
]);

/**
 * The `lom:lifeCycle` of a record.
 */
export const LomLifeCycle = relation("LomLifeCycle", { id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:version` of a life cycle: a container of `lom:string` children.
 */
export const LomVersion = relation("LomVersion", { id: uuid, lifeCycle: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:status` of a life cycle: a vocabulary container of `lom:source` and `lom:value`.
 */
export const LomStatus = relation("LomStatus", { id: uuid, lifeCycle: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:contribute` at its position under a `lom:lifeCycle` or a `lom:metaMetadata`. The parent's
 * kind is bound through its edge's admitted kind pair, and `lom:contribute` is admitted under
 * those two parents only.
 */
export const LomContribute = relation(
  "LomContribute",
  { id: uuid, lom: uuid, parent: uuid, position: pg.bigint },
  ["id"],
);

/**
 * The `lom:role` of a contribution: a vocabulary container.
 */
export const LomRole = relation("LomRole", { contribute: uuid, id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:entity` of a contribution at its position: a `CharacterString` leaf holding vCard text,
 * with the whitespace-collapsed form beside the value as written.
 */
export const LomEntity = relation(
  "LomEntity",
  {
    collapsed: token,
    contribute: uuid,
    id: uuid,
    lom: uuid,
    position: pg.bigint,
    value: wildcard,
  },
  ["id"],
);

/**
 * The `lom:date` of a contribution: a date-time container of `lom:dateTime` and `lom:description`.
 */
export const LomDate = relation("LomDate", { contribute: uuid, id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:dateTime` of a date: a `CharacterString` leaf, with the whitespace-collapsed form beside
 * the value as written.
 */
export const LomDateTime = relation(
  "LomDateTime",
  { collapsed: token, date: uuid, id: uuid, lom: uuid, value: wildcard },
  ["id"],
);

/**
 * The `lom:metaMetadata` of a record.
 */
export const LomMetaMetadata = relation("LomMetaMetadata", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:metadataschema` of the meta-metadata category at its position: a `CharacterString` leaf,
 * with the whitespace-collapsed form beside the value as written.
 */
export const LomMetadataschema = relation(
  "LomMetadataschema",
  {
    collapsed: token,
    id: uuid,
    lom: uuid,
    metaMetadata: uuid,
    position: pg.bigint,
    value: wildcard,
  },
  ["id"],
);

/**
 * The `lom:technical` of a record.
 */
export const LomTechnical = relation("LomTechnical", { id: uuid, lom: uuid }, ["id"]);

/**
 * A `lom:format` of the technical category at its position: a `CharacterString` leaf, with the
 * whitespace-collapsed form beside the value as written.
 */
export const LomFormat = relation(
  "LomFormat",
  { collapsed: token, id: uuid, lom: uuid, position: pg.bigint, technical: uuid, value: wildcard },
  ["id"],
);

/**
 * The `lom:size` of the technical category: a `CharacterString` leaf, with the whitespace-collapsed
 * form beside the value as written.
 */
export const LomSize = relation(
  "LomSize",
  { collapsed: token, id: uuid, lom: uuid, technical: uuid, value: wildcard },
  ["id"],
);

/**
 * A `lom:location` of the technical category at its position: a `CharacterString` leaf, with the
 * whitespace-collapsed form beside the value as written.
 */
export const LomLocation = relation(
  "LomLocation",
  { collapsed: token, id: uuid, lom: uuid, position: pg.bigint, technical: uuid, value: wildcard },
  ["id"],
);

/**
 * A `lom:requirement` of the technical category at its position.
 */
export const LomRequirement = relation(
  "LomRequirement",
  { id: uuid, lom: uuid, position: pg.bigint, technical: uuid },
  ["id"],
);

/**
 * A `lom:orComposite` of a requirement at its position.
 */
export const LomOrComposite = relation(
  "LomOrComposite",
  { id: uuid, lom: uuid, position: pg.bigint, requirement: uuid },
  ["id"],
);

/**
 * The `lom:type` of an alternative requirement: a vocabulary container.
 */
export const LomType = relation("LomType", { id: uuid, lom: uuid, orComposite: uuid }, ["id"]);

/**
 * The `lom:name` of an alternative requirement: a vocabulary container.
 */
export const LomName = relation("LomName", { id: uuid, lom: uuid, orComposite: uuid }, ["id"]);

/**
 * The `lom:minimumVersion` of an alternative requirement: a `CharacterString` leaf, with the
 * whitespace-collapsed form beside the value as written.
 */
export const LomMinimumVersion = relation(
  "LomMinimumVersion",
  { collapsed: token, id: uuid, lom: uuid, orComposite: uuid, value: wildcard },
  ["id"],
);

/**
 * The `lom:maximumVersion` of an alternative requirement: a `CharacterString` leaf, with the
 * whitespace-collapsed form beside the value as written.
 */
export const LomMaximumVersion = relation(
  "LomMaximumVersion",
  { collapsed: token, id: uuid, lom: uuid, orComposite: uuid, value: wildcard },
  ["id"],
);

/**
 * The `lom:installationRemarks` of the technical category: a `LangString` container.
 */
export const LomInstallationRemarks = relation(
  "LomInstallationRemarks",
  { id: uuid, lom: uuid, technical: uuid },
  ["id"],
);

/**
 * The `lom:otherPlatformRequirements` of the technical category: a `LangString` container.
 */
export const LomOtherPlatformRequirements = relation(
  "LomOtherPlatformRequirements",
  { id: uuid, lom: uuid, technical: uuid },
  ["id"],
);

/**
 * The `lom:duration` of the technical category: a `Duration` container.
 */
export const LomDuration = relation("LomDuration", { id: uuid, lom: uuid, technical: uuid }, [
  "id",
]);

/**
 * The `CharacterString` child of a duration, the arm of `lom:duration.string`, with the
 * whitespace-collapsed form beside the value as written.
 */
export const LomDurationString = relation(
  "LomDurationString",
  { collapsed: token, duration: uuid, id: uuid, lom: uuid, value: wildcard },
  ["id"],
);

/**
 * The `lom:rights` of a record.
 */
export const LomRights = relation("LomRights", { id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:cost` of the rights category: a vocabulary container.
 */
export const LomCost = relation("LomCost", { id: uuid, lom: uuid, rights: uuid }, ["id"]);

/**
 * The `lom:copyrightAndOtherRestrictions` of the rights category: a vocabulary container.
 */
export const LomCopyrightAndOtherRestrictions = relation(
  "LomCopyrightAndOtherRestrictions",
  { id: uuid, lom: uuid, rights: uuid },
  ["id"],
);

/**
 * A resource that owns a record with at least one `lom:identifier`, bound to the resource and its
 * type like the record's `ResourceLom`.
 */
export const ResourceLomIdentified = relation(
  "ResourceLomIdentified",
  { lom: uuid, package: uuid, resource: ncName, type: resourceType },
  ["lom"],
);

/**
 * The one identifier an item resource's record names the item by: the whitespace-collapsed
 * `lom:entry` at its position, bound to the item document's `identifier`.
 */
export const LomObjectIdentifier = relation(
  "LomObjectIdentifier",
  {
    collapsed: ncName,
    lom: uuid,
    package: uuid,
    position: pg.bigint,
    resource: ncName,
    type: resourceType,
  },
  ["lom"],
);

/**
 * A resource that owns a record with a `lom:title` under its general category, bound to the
 * resource and its type like the record's `ResourceLom`.
 */
export const ResourceLomTitled = relation(
  "ResourceLomTitled",
  { lom: uuid, package: uuid, resource: ncName, type: resourceType },
  ["lom"],
);

/**
 * The one title an item resource's record names the item by: the whitespace-collapsed string at its
 * position, bound to the item document's `title`.
 *
 * The collapsed form holds at most 256 non-space characters, a representation limit
 * (campaign decision 26), because a key-shaped containment target or index holds it.
 */
export const LomObjectTitle = relation(
  "LomObjectTitle",
  {
    collapsed: boundedToken,
    lom: uuid,
    package: uuid,
    position: pg.bigint,
    resource: ncName,
    type: resourceType,
  },
  ["lom"],
);

/**
 * The QTI metadata record of a resource: the `cp:metadata.resource` node it hangs under and the
 * resource it describes.
 */
export const QtiMetadata = relation("QtiMetadata", { id: uuid, metadata: uuid, resource: uuid }, [
  "id",
]);

/**
 * The `qmd:itemTemplate` of a QTI metadata record: a boolean.
 */
export const QmdItemTemplate = relation(
  "QmdItemTemplate",
  { id: uuid, qtiMetadata: uuid, value: xsBoolean },
  ["id"],
);

/**
 * The `qmd:timeDependent` of a QTI metadata record: a boolean.
 */
export const QmdTimeDependent = relation(
  "QmdTimeDependent",
  { id: uuid, qtiMetadata: uuid, value: xsBoolean },
  ["id"],
);

/**
 * The `qmd:composite` of a QTI metadata record: a boolean.
 */
export const QmdComposite = relation(
  "QmdComposite",
  { id: uuid, qtiMetadata: uuid, value: xsBoolean },
  ["id"],
);

/**
 * The `qmd:solutionAvailable` of a QTI metadata record: a boolean.
 */
export const QmdSolutionAvailable = relation(
  "QmdSolutionAvailable",
  { id: uuid, qtiMetadata: uuid, value: xsBoolean },
  ["id"],
);

/**
 * The `qmd:interactionType` of a QTI metadata record: one of the 22 interaction types, repeated.
 */
export const QmdInteractionType = relation(
  "QmdInteractionType",
  { id: uuid, qtiMetadata: uuid, value: interactionTypeValue },
  ["id"],
);

/**
 * The `qmd:feedbackType` of a QTI metadata record: one of the three feedback types.
 */
export const QmdFeedbackType = relation(
  "QmdFeedbackType",
  { id: uuid, qtiMetadata: uuid, value: feedbackTypeValue },
  ["id"],
);

/**
 * The `qmd:scoringMode` of a QTI metadata record: one of the three scoring modes, repeated.
 */
export const QmdScoringMode = relation(
  "QmdScoringMode",
  { id: uuid, qtiMetadata: uuid, value: scoringModeValue },
  ["id"],
);

/**
 * The `qmd:toolName` of a QTI metadata record: a tool string.
 */
export const QmdToolName = relation(
  "QmdToolName",
  { id: uuid, qtiMetadata: uuid, value: toolString },
  ["id"],
);

/**
 * The `qmd:toolVersion` of a QTI metadata record: a tool string.
 */
export const QmdToolVersion = relation(
  "QmdToolVersion",
  { id: uuid, qtiMetadata: uuid, value: toolString },
  ["id"],
);

/**
 * The `qmd:toolVendor` of a QTI metadata record: a tool string.
 */
export const QmdToolVendor = relation(
  "QmdToolVendor",
  { id: uuid, qtiMetadata: uuid, value: toolString },
  ["id"],
);

/**
 * The `qmd:portableCustomInteractionContext` of a QTI metadata record: a container of a custom type
 * identifier and an interaction kind.
 */
export const QmdPortableCustomInteractionContext = relation(
  "QmdPortableCustomInteractionContext",
  { id: uuid, qtiMetadata: uuid },
  ["id"],
);

/**
 * The `qmd:customTypeIdentifier` of a portable custom interaction context.
 */
export const QmdCustomTypeIdentifier = relation(
  "QmdCustomTypeIdentifier",
  { context: uuid, id: uuid, value: wildcard },
  ["id"],
);

/**
 * The `qmd:interactionKind` of a portable custom interaction context.
 */
export const QmdInteractionKind = relation(
  "QmdInteractionKind",
  { context: uuid, id: uuid, value: wildcard },
  ["id"],
);

/**
 * The general, lifeCycle, metaMetadata, technical and rights categories' arms and the QTI metadata
 * arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "lom:aggregationLevel": LomAggregationLevel,
  "lom:catalog": LomIdentifierCatalog,
  "lom:contribute": LomContribute,
  "lom:copyrightAndOtherRestrictions": LomCopyrightAndOtherRestrictions,
  "lom:cost": LomCost,
  "lom:coverage": LomCoverage,
  "lom:date": LomDate,
  "lom:dateTime": LomDateTime,
  "lom:description": LomDescription,
  "lom:duration": LomDuration,
  "lom:duration.string": LomDurationString,
  "lom:entity": LomEntity,
  "lom:entry": LomIdentifierEntry,
  "lom:format": LomFormat,
  "lom:general": LomGeneral,
  "lom:identifier": LomIdentifier,
  "lom:installationRemarks": LomInstallationRemarks,
  "lom:keyword": LomKeyword,
  "lom:language": LomLanguage,
  "lom:lifeCycle": LomLifeCycle,
  "lom:location": LomLocation,
  "lom:lom": Lom,
  "lom:maximumVersion": LomMaximumVersion,
  "lom:metaMetadata": LomMetaMetadata,
  "lom:metadataschema": LomMetadataschema,
  "lom:minimumVersion": LomMinimumVersion,
  "lom:name": LomName,
  "lom:orComposite": LomOrComposite,
  "lom:otherPlatformRequirements": LomOtherPlatformRequirements,
  "lom:requirement": LomRequirement,
  "lom:rights": LomRights,
  "lom:role": LomRole,
  "lom:size": LomSize,
  "lom:source": LomSource,
  "lom:status": LomStatus,
  "lom:string": LomString,
  "lom:structure": LomStructure,
  "lom:technical": LomTechnical,
  "lom:title": LomGeneralTitle,
  "lom:type": LomType,
  "lom:value": LomValue,
  "lom:version": LomVersion,
  "qmd:composite": QmdComposite,
  "qmd:customTypeIdentifier": QmdCustomTypeIdentifier,
  "qmd:feedbackType": QmdFeedbackType,
  "qmd:interactionKind": QmdInteractionKind,
  "qmd:interactionType": QmdInteractionType,
  "qmd:itemTemplate": QmdItemTemplate,
  "qmd:portableCustomInteractionContext": QmdPortableCustomInteractionContext,
  "qmd:qtiMetadata": QtiMetadata,
  "qmd:scoringMode": QmdScoringMode,
  "qmd:solutionAvailable": QmdSolutionAvailable,
  "qmd:timeDependent": QmdTimeDependent,
  "qmd:toolName": QmdToolName,
  "qmd:toolVendor": QmdToolVendor,
  "qmd:toolVersion": QmdToolVersion,
};

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  Lom,
  LomAggregationLevel,
  LomContribute,
  LomCopyrightAndOtherRestrictions,
  LomCost,
  LomCoverage,
  LomDate,
  LomDateTime,
  LomDescription,
  LomDuration,
  LomDurationString,
  LomEntity,
  LomFormat,
  LomGeneral,
  LomGeneralTitle,
  LomIdentifier,
  LomIdentifierCatalog,
  LomIdentifierEntry,
  LomInstallationRemarks,
  LomKeyword,
  LomLanguage,
  LomLifeCycle,
  LomLocation,
  LomMaximumVersion,
  LomMetaMetadata,
  LomMetadataschema,
  LomMinimumVersion,
  LomName,
  LomObjectIdentifier,
  LomObjectTitle,
  LomOrComposite,
  LomOtherPlatformRequirements,
  LomOwner,
  LomRequirement,
  LomRights,
  LomRole,
  LomSize,
  LomSource,
  LomStatus,
  LomString,
  LomStringLanguage,
  LomStructure,
  LomTechnical,
  LomTitle,
  LomType,
  LomValue,
  LomVersion,
  ManifestLom,
  QmdComposite,
  QmdCustomTypeIdentifier,
  QmdFeedbackType,
  QmdInteractionKind,
  QmdInteractionType,
  QmdItemTemplate,
  QmdPortableCustomInteractionContext,
  QmdScoringMode,
  QmdSolutionAvailable,
  QmdTimeDependent,
  QmdToolName,
  QmdToolVendor,
  QmdToolVersion,
  QtiMetadata,
  ResourceLom,
  ResourceLomIdentified,
  ResourceLomTitled,
};

/**
 * The statements over this module's relations: a record lies in a node's tree and is owned by a
 * manifest or a resource; each owner's arm binds its record, its `cp:metadata` node of the owner's
 * kind and the edge between them, a resource owner also its resource and type; every row of the
 * general category belongs to a record, and a row that copies the record's owner agrees with it;
 * each identifier and language is the edge's child at the position it copies, each identifier part
 * the edge's child under the identifier it names and carries that identifier's position; each title
 * string is a string row of its own value; each string language belongs to a string. Each lifeCycle
 * and metaMetadata row belongs to a record; a version, status, contribution, role, entity, date,
 * date-time and metadata schema is the edge's child under the parent it names, at the position it
 * copies where it has one. Each technical and rights row belongs to a record, and a row that has a
 * parent is the edge's child under the parent it names, at the position it copies where it has one.
 * A resource's record names at least one identifier and exactly one title; an item resource's
 * record has one object identifier and one object title, each a row of the record and of the item
 * document's own identifier or title. A resource's QTI metadata record is the edge's child under
 * the resource's `cp:metadata.resource` node, at most one per resource; each of its leaves is the
 * edge's child under the record it names, the nine `0..1` ones at most once, and the two repeated
 * ones (`interactionType`, `scoringMode`) without a key. Each of the two context leaves
 * (`customTypeIdentifier`, `interactionKind`) is the edge's child under the context it names, at
 * most once per context. Each title string is also the edge's child at the position it copies.
 */
export const rules = [
  key(Lom, ["id", "owner"]),
  key(Lom, ["id", "package"]),
  contained(on(Lom, "id", "package"), on(Node, "id", "tree")),
  alternatives(Lom, "owner", LomOwner, { manifest: ManifestLom, resource: ResourceLom }),
  key(ManifestLom, ["package"]),
  contained(on(ManifestLom, "lom", "package"), on(Lom, "id", "package")),
  contained(on(ManifestLom, "metadata"), on(select(Node, { kind: "cp:metadata.manifest" }), "id")),
  contained(on(ManifestLom, "lom", "metadata"), on(Edge, "child", "parent")),
  key(ResourceLom, ["package", "resource"]),
  contained(on(ResourceLom, "lom", "package"), on(Lom, "id", "package")),
  contained(
    on(ResourceLom, "package", "resource", "type"),
    on(Resource, "package", "identifier", "type"),
  ),
  contained(on(ResourceLom, "metadata"), on(select(Node, { kind: "cp:metadata.resource" }), "id")),
  contained(on(ResourceLom, "lom", "metadata"), on(Edge, "child", "parent")),
  key(LomGeneral, ["lom"]),
  contained(on(LomGeneral, "lom"), on(Lom, "id")),
  key(LomIdentifier, ["lom", "position"]),
  contained(on(LomIdentifier, "lom", "owner"), on(Lom, "id", "owner")),
  contained(on(LomIdentifier, "id", "position"), on(Edge, "child", "position")),
  contained(on(LomIdentifierCatalog, "lom", "owner"), on(Lom, "id", "owner")),
  contained(on(LomIdentifierCatalog, "lom", "position"), on(LomIdentifier, "lom", "position")),
  contained(on(LomIdentifierCatalog, "id", "identifier"), on(Edge, "child", "parent")),
  key(LomIdentifierEntry, ["lom", "position"]),
  contained(on(LomIdentifierEntry, "lom", "owner"), on(Lom, "id", "owner")),
  contained(on(LomIdentifierEntry, "lom", "position"), on(LomIdentifier, "lom", "position")),
  contained(on(LomIdentifierEntry, "id", "identifier"), on(Edge, "child", "parent")),
  key(LomGeneralTitle, ["lom"]),
  contained(on(LomGeneralTitle, "lom", "owner"), on(Lom, "id", "owner")),
  key(LomTitle, ["lom", "position"]),
  contained(on(LomTitle, "lom", "owner"), on(Lom, "id", "owner")),
  contained(on(LomTitle, "id", "value", "collapsed"), on(LomString, "id", "value", "collapsed")),
  contained(on(LomTitle, "id", "position"), on(Edge, "child", "position")),
  key(LomStringLanguage, ["node"]),
  contained(on(LomStringLanguage, "node"), on(LomString, "id")),
  contained(on(LomLanguage, "lom"), on(Lom, "id")),
  contained(on(LomLanguage, "id", "position"), on(Edge, "child", "position")),
  contained(on(LomDescription, "lom"), on(Lom, "id")),
  contained(on(LomKeyword, "lom"), on(Lom, "id")),
  contained(on(LomCoverage, "lom"), on(Lom, "id")),
  contained(on(LomStructure, "lom"), on(Lom, "id")),
  contained(on(LomAggregationLevel, "lom"), on(Lom, "id")),
  key(LomLifeCycle, ["lom"]),
  contained(on(LomLifeCycle, "lom"), on(Lom, "id")),
  key(LomVersion, ["lifeCycle"]),
  contained(on(LomVersion, "lom"), on(Lom, "id")),
  contained(on(LomVersion, "id", "lifeCycle"), on(Edge, "child", "parent")),
  key(LomStatus, ["lifeCycle"]),
  contained(on(LomStatus, "lom"), on(Lom, "id")),
  contained(on(LomStatus, "id", "lifeCycle"), on(Edge, "child", "parent")),
  key(LomContribute, ["parent", "position"]),
  contained(on(LomContribute, "lom"), on(Lom, "id")),
  contained(on(LomContribute, "id", "parent"), on(Edge, "child", "parent")),
  contained(on(LomContribute, "id", "position"), on(Edge, "child", "position")),
  key(LomRole, ["contribute"]),
  contained(on(LomRole, "lom"), on(Lom, "id")),
  contained(on(LomRole, "id", "contribute"), on(Edge, "child", "parent")),
  key(LomEntity, ["contribute", "position"]),
  contained(on(LomEntity, "lom"), on(Lom, "id")),
  contained(on(LomEntity, "id", "contribute"), on(Edge, "child", "parent")),
  contained(on(LomEntity, "id", "position"), on(Edge, "child", "position")),
  key(LomDate, ["contribute"]),
  contained(on(LomDate, "lom"), on(Lom, "id")),
  contained(on(LomDate, "id", "contribute"), on(Edge, "child", "parent")),
  key(LomDateTime, ["date"]),
  contained(on(LomDateTime, "lom"), on(Lom, "id")),
  contained(on(LomDateTime, "id", "date"), on(Edge, "child", "parent")),
  key(LomMetaMetadata, ["lom"]),
  contained(on(LomMetaMetadata, "lom"), on(Lom, "id")),
  key(LomMetadataschema, ["metaMetadata", "position"]),
  contained(on(LomMetadataschema, "lom"), on(Lom, "id")),
  contained(on(LomMetadataschema, "id", "metaMetadata"), on(Edge, "child", "parent")),
  contained(on(LomMetadataschema, "id", "position"), on(Edge, "child", "position")),
  key(LomTechnical, ["lom"]),
  contained(on(LomTechnical, "lom"), on(Lom, "id")),
  key(LomFormat, ["technical", "position"]),
  contained(on(LomFormat, "lom"), on(Lom, "id")),
  contained(on(LomFormat, "id", "technical"), on(Edge, "child", "parent")),
  contained(on(LomFormat, "id", "position"), on(Edge, "child", "position")),
  key(LomSize, ["technical"]),
  contained(on(LomSize, "lom"), on(Lom, "id")),
  contained(on(LomSize, "id", "technical"), on(Edge, "child", "parent")),
  key(LomLocation, ["technical", "position"]),
  contained(on(LomLocation, "lom"), on(Lom, "id")),
  contained(on(LomLocation, "id", "technical"), on(Edge, "child", "parent")),
  contained(on(LomLocation, "id", "position"), on(Edge, "child", "position")),
  key(LomRequirement, ["technical", "position"]),
  contained(on(LomRequirement, "lom"), on(Lom, "id")),
  contained(on(LomRequirement, "id", "technical"), on(Edge, "child", "parent")),
  contained(on(LomRequirement, "id", "position"), on(Edge, "child", "position")),
  key(LomOrComposite, ["requirement", "position"]),
  contained(on(LomOrComposite, "lom"), on(Lom, "id")),
  contained(on(LomOrComposite, "id", "requirement"), on(Edge, "child", "parent")),
  contained(on(LomOrComposite, "id", "position"), on(Edge, "child", "position")),
  key(LomType, ["orComposite"]),
  contained(on(LomType, "lom"), on(Lom, "id")),
  contained(on(LomType, "id", "orComposite"), on(Edge, "child", "parent")),
  key(LomName, ["orComposite"]),
  contained(on(LomName, "lom"), on(Lom, "id")),
  contained(on(LomName, "id", "orComposite"), on(Edge, "child", "parent")),
  key(LomMinimumVersion, ["orComposite"]),
  contained(on(LomMinimumVersion, "lom"), on(Lom, "id")),
  contained(on(LomMinimumVersion, "id", "orComposite"), on(Edge, "child", "parent")),
  key(LomMaximumVersion, ["orComposite"]),
  contained(on(LomMaximumVersion, "lom"), on(Lom, "id")),
  contained(on(LomMaximumVersion, "id", "orComposite"), on(Edge, "child", "parent")),
  key(LomInstallationRemarks, ["technical"]),
  contained(on(LomInstallationRemarks, "lom"), on(Lom, "id")),
  contained(on(LomInstallationRemarks, "id", "technical"), on(Edge, "child", "parent")),
  key(LomOtherPlatformRequirements, ["technical"]),
  contained(on(LomOtherPlatformRequirements, "lom"), on(Lom, "id")),
  contained(on(LomOtherPlatformRequirements, "id", "technical"), on(Edge, "child", "parent")),
  key(LomDuration, ["technical"]),
  contained(on(LomDuration, "lom"), on(Lom, "id")),
  contained(on(LomDuration, "id", "technical"), on(Edge, "child", "parent")),
  key(LomDurationString, ["duration"]),
  contained(on(LomDurationString, "lom"), on(Lom, "id")),
  contained(on(LomDurationString, "id", "duration"), on(Edge, "child", "parent")),
  key(LomRights, ["lom"]),
  contained(on(LomRights, "lom"), on(Lom, "id")),
  key(LomCost, ["rights"]),
  contained(on(LomCost, "lom"), on(Lom, "id")),
  contained(on(LomCost, "id", "rights"), on(Edge, "child", "parent")),
  key(LomCopyrightAndOtherRestrictions, ["rights"]),
  contained(on(LomCopyrightAndOtherRestrictions, "lom"), on(Lom, "id")),
  contained(on(LomCopyrightAndOtherRestrictions, "id", "rights"), on(Edge, "child", "parent")),
  key(ResourceLomIdentified, ["lom"]),
  contained(
    on(ResourceLomIdentified, "lom", "package", "resource", "type"),
    on(ResourceLom, "lom", "package", "resource", "type"),
  ),
  contained(
    on(select(LomIdentifier, { owner: "resource" }), "lom"),
    on(ResourceLomIdentified, "lom"),
  ),
  capacity(on(ResourceLomIdentified, "lom"), {
    from: on(LomIdentifier, "lom"),
    within: within(1n, "*"),
  }),
  key(LomObjectIdentifier, ["lom"]),
  contained(
    on(LomObjectIdentifier, "lom", "position", "collapsed"),
    on(LomIdentifierEntry, "lom", "position", "collapsed"),
  ),
  contained(
    on(LomObjectIdentifier, "lom", "package", "resource", "type"),
    on(ResourceLomIdentified, "lom", "package", "resource", "type"),
  ),
  contained(
    on(LomObjectIdentifier, "package", "resource", "collapsed"),
    on(DocumentIdentifier, "package", "resource", "value"),
  ),
  capacity(on(select(ResourceLomIdentified, { type: "imsqti_item_xmlv3p0" }), "lom"), {
    from: on(LomObjectIdentifier, "lom"),
    within: within(1n, 1n),
  }),
  key(ResourceLomTitled, ["lom"]),
  contained(
    on(ResourceLomTitled, "lom", "package", "resource", "type"),
    on(ResourceLom, "lom", "package", "resource", "type"),
  ),
  contained(
    on(select(LomGeneralTitle, { owner: "resource" }), "lom"),
    on(ResourceLomTitled, "lom"),
  ),
  capacity(on(ResourceLomTitled, "lom"), {
    from: on(LomGeneralTitle, "lom"),
    within: within(1n, 1n),
  }),
  key(LomObjectTitle, ["lom"]),
  contained(
    on(LomObjectTitle, "lom", "position", "collapsed"),
    on(LomTitle, "lom", "position", "collapsed"),
  ),
  contained(
    on(LomObjectTitle, "lom", "package", "resource", "type"),
    on(ResourceLomTitled, "lom", "package", "resource", "type"),
  ),
  contained(
    on(LomObjectTitle, "package", "resource", "collapsed"),
    on(DocumentTitle, "package", "resource", "collapsed"),
  ),
  capacity(on(select(ResourceLomTitled, { type: "imsqti_item_xmlv3p0" }), "lom"), {
    from: on(LomObjectTitle, "lom"),
    within: within(1n, 1n),
  }),
  key(QtiMetadata, ["resource"]),
  contained(on(QtiMetadata, "resource"), on(Resource, "id")),
  contained(on(QtiMetadata, "metadata"), on(select(Node, { kind: "cp:metadata.resource" }), "id")),
  contained(on(QtiMetadata, "id", "metadata"), on(Edge, "child", "parent")),
  key(QmdItemTemplate, ["qtiMetadata"]),
  contained(on(QmdItemTemplate, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdTimeDependent, ["qtiMetadata"]),
  contained(on(QmdTimeDependent, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdComposite, ["qtiMetadata"]),
  contained(on(QmdComposite, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdSolutionAvailable, ["qtiMetadata"]),
  contained(on(QmdSolutionAvailable, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  contained(on(QmdInteractionType, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdFeedbackType, ["qtiMetadata"]),
  contained(on(QmdFeedbackType, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  contained(on(QmdScoringMode, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdToolName, ["qtiMetadata"]),
  contained(on(QmdToolName, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdToolVersion, ["qtiMetadata"]),
  contained(on(QmdToolVersion, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdToolVendor, ["qtiMetadata"]),
  contained(on(QmdToolVendor, "id", "qtiMetadata"), on(Edge, "child", "parent")),
  key(QmdPortableCustomInteractionContext, ["qtiMetadata"]),
  contained(
    on(QmdPortableCustomInteractionContext, "id", "qtiMetadata"),
    on(Edge, "child", "parent"),
  ),
  key(QmdCustomTypeIdentifier, ["context"]),
  contained(on(QmdCustomTypeIdentifier, "id", "context"), on(Edge, "child", "parent")),
  key(QmdInteractionKind, ["context"]),
  contained(on(QmdInteractionKind, "id", "context"), on(Edge, "child", "parent")),
] as const;

// The 21 remainder arms of the LOM categories the first milestone left out. They are declared and
// exported here and staged: `relations`, `rules` and `arms` above do not hold them yet.

/**
 * The the `lom:educational` category of a record.
 */
export const LomEducational = relation("LomEducational", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a `lom:classification` category of a record.
 */
export const LomClassification = relation("LomClassification", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a `lom:relation` category of a record.
 */
export const LomRelation = relation("LomRelation", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a `lom:annotation` category of a record.
 */
export const LomAnnotation = relation("LomAnnotation", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a `lom:taxonPath` of a classification.
 */
export const LomTaxonPath = relation("LomTaxonPath", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a `lom:taxon` of a taxon path.
 */
export const LomTaxon = relation("LomTaxon", { id: uuid, lom: uuid }, ["id"]);

/**
 * The the `lom:resource` of a relation.
 */
export const LomResource = relation("LomResource", { id: uuid, lom: uuid }, ["id"]);

/**
 * The the `lom:typicalLearningTime` of the educational category.
 */
export const LomTypicalLearningTime = relation("LomTypicalLearningTime", { id: uuid, lom: uuid }, [
  "id",
]);

/**
 * The a Vocabulary container, `lom:interactivityType`.
 */
export const LomInteractivityType = relation("LomInteractivityType", { id: uuid, lom: uuid }, [
  "id",
]);

/**
 * The a Vocabulary container, `lom:learningResourceType`.
 */
export const LomLearningResourceType = relation(
  "LomLearningResourceType",
  { id: uuid, lom: uuid },
  ["id"],
);

/**
 * The a Vocabulary container, `lom:interactivityLevel`.
 */
export const LomInteractivityLevel = relation("LomInteractivityLevel", { id: uuid, lom: uuid }, [
  "id",
]);

/**
 * The a Vocabulary container, `lom:semanticDensity`.
 */
export const LomSemanticDensity = relation("LomSemanticDensity", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a Vocabulary container, `lom:intendedEndUserRole`.
 */
export const LomIntendedEndUserRole = relation("LomIntendedEndUserRole", { id: uuid, lom: uuid }, [
  "id",
]);

/**
 * The a Vocabulary container, `lom:context`.
 */
export const LomContext = relation("LomContext", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a Vocabulary container, `lom:difficulty`.
 */
export const LomDifficulty = relation("LomDifficulty", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a Vocabulary container, `lom:purpose`.
 */
export const LomPurpose = relation("LomPurpose", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a Vocabulary container, `lom:kind`.
 */
export const LomKind = relation("LomKind", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a LangString container, `lom:typicalAgeRange`.
 */
export const LomTypicalAgeRange = relation("LomTypicalAgeRange", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a LangString container, the `lom:source` of a taxon path.
 */
export const LomSourceLangString = relation("LomSourceLangString", { id: uuid, lom: uuid }, ["id"]);

/**
 * The a LangString container, the `lom:entry` of a taxon.
 */
export const LomEntryLangString = relation("LomEntryLangString", { id: uuid, lom: uuid }, ["id"]);

/**
 * The `lom:id` leaf of a record: its text as read and its collapsed form.
 */
export const LomId = relation("LomId", { collapsed: token, id: uuid, value: wildcard }, ["id"]);

/**
 * The remainder's relations, staged.
 */
export const lomRemainderRelations = {
  LomAnnotation,
  LomClassification,
  LomContext,
  LomDifficulty,
  LomEducational,
  LomEntryLangString,
  LomId,
  LomIntendedEndUserRole,
  LomInteractivityLevel,
  LomInteractivityType,
  LomKind,
  LomLearningResourceType,
  LomPurpose,
  LomRelation,
  LomResource,
  LomSemanticDensity,
  LomSourceLangString,
  LomTaxon,
  LomTaxonPath,
  LomTypicalAgeRange,
  LomTypicalLearningTime,
};

/**
 * The remainder's statements, staged: each thin container lies in a record and is the child of its
 * parent's edge.
 */
export const lomRemainderRules = [
  contained(on(LomAnnotation, "lom"), on(Lom, "id")),
  contained(on(LomAnnotation, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomClassification, "lom"), on(Lom, "id")),
  contained(on(LomClassification, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomContext, "lom"), on(Lom, "id")),
  contained(on(LomContext, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomDifficulty, "lom"), on(Lom, "id")),
  contained(on(LomDifficulty, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomEducational, "lom"), on(Lom, "id")),
  contained(on(LomEducational, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomEntryLangString, "lom"), on(Lom, "id")),
  contained(on(LomEntryLangString, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomIntendedEndUserRole, "lom"), on(Lom, "id")),
  contained(on(LomIntendedEndUserRole, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomInteractivityLevel, "lom"), on(Lom, "id")),
  contained(on(LomInteractivityLevel, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomInteractivityType, "lom"), on(Lom, "id")),
  contained(on(LomInteractivityType, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomKind, "lom"), on(Lom, "id")),
  contained(on(LomKind, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomLearningResourceType, "lom"), on(Lom, "id")),
  contained(on(LomLearningResourceType, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomPurpose, "lom"), on(Lom, "id")),
  contained(on(LomPurpose, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomRelation, "lom"), on(Lom, "id")),
  contained(on(LomRelation, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomResource, "lom"), on(Lom, "id")),
  contained(on(LomResource, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomSemanticDensity, "lom"), on(Lom, "id")),
  contained(on(LomSemanticDensity, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomSourceLangString, "lom"), on(Lom, "id")),
  contained(on(LomSourceLangString, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomTaxon, "lom"), on(Lom, "id")),
  contained(on(LomTaxon, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomTaxonPath, "lom"), on(Lom, "id")),
  contained(on(LomTaxonPath, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomTypicalAgeRange, "lom"), on(Lom, "id")),
  contained(on(LomTypicalAgeRange, "id", "lom"), on(Edge, "child", "parent")),
  contained(on(LomTypicalLearningTime, "lom"), on(Lom, "id")),
  contained(on(LomTypicalLearningTime, "id", "lom"), on(Edge, "child", "parent")),
] as const;

/**
 * The remainder's arms, staged, keyed by their `NodeKind` handles.
 */
export const lomRemainderArms = {
  "lom:annotation": LomAnnotation,
  "lom:classification": LomClassification,
  "lom:context": LomContext,
  "lom:difficulty": LomDifficulty,
  "lom:educational": LomEducational,
  "lom:entry.langString": LomEntryLangString,
  "lom:id": LomId,
  "lom:intendedEndUserRole": LomIntendedEndUserRole,
  "lom:interactivityLevel": LomInteractivityLevel,
  "lom:interactivityType": LomInteractivityType,
  "lom:kind": LomKind,
  "lom:learningResourceType": LomLearningResourceType,
  "lom:purpose": LomPurpose,
  "lom:relation": LomRelation,
  "lom:resource": LomResource,
  "lom:semanticDensity": LomSemanticDensity,
  "lom:source.langString": LomSourceLangString,
  "lom:taxon": LomTaxon,
  "lom:taxonPath": LomTaxonPath,
  "lom:typicalAgeRange": LomTypicalAgeRange,
  "lom:typicalLearningTime": LomTypicalLearningTime,
};
