/**
 * The metadata a package carries: a LOM record (`lom:lom`) under a manifest's or a resource's
 * `cp:metadata`, and the arms of the LOM `general` category beneath it.
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
} from "@bjornpagen/grizzle";
import { Edge, Node } from "#qti/schema/node.ts";
import { Resource } from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

const resourceType = str.regex(patterns.resourceType);

const token = str.regex(patterns.xsToken, patterns.xsTokenFlags);

const wildcard = str.regex(patterns.wildcard, patterns.wildcardFlags);

const language = str.regex(patterns.xsLanguageOrEmpty);

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
 */
export const LomIdentifierEntry = relation(
  "LomIdentifierEntry",
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
 */
export const LomTitle = relation(
  "LomTitle",
  {
    collapsed: token,
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
 * The general category's arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "lom:aggregationLevel": LomAggregationLevel,
  "lom:catalog": LomIdentifierCatalog,
  "lom:coverage": LomCoverage,
  "lom:description": LomDescription,
  "lom:entry": LomIdentifierEntry,
  "lom:general": LomGeneral,
  "lom:identifier": LomIdentifier,
  "lom:keyword": LomKeyword,
  "lom:language": LomLanguage,
  "lom:lom": Lom,
  "lom:source": LomSource,
  "lom:string": LomString,
  "lom:structure": LomStructure,
  "lom:title": LomGeneralTitle,
  "lom:value": LomValue,
};

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  Lom,
  LomAggregationLevel,
  LomCoverage,
  LomDescription,
  LomGeneral,
  LomGeneralTitle,
  LomIdentifier,
  LomIdentifierCatalog,
  LomIdentifierEntry,
  LomKeyword,
  LomLanguage,
  LomOwner,
  LomSource,
  LomString,
  LomStringLanguage,
  LomStructure,
  LomTitle,
  LomValue,
  ManifestLom,
  ResourceLom,
};

/**
 * The statements over this module's relations: a record lies in a node's tree and is owned by a
 * manifest or a resource; each owner's arm binds its record, its `cp:metadata` node of the owner's
 * kind and the edge between them, a resource owner also its resource and type; every row of the
 * general category belongs to a record, and a row that copies the record's owner agrees with it;
 * each identifier and language is the edge's child at the position it copies, each identifier part
 * the edge's child under the identifier it names and carries that identifier's position; each
 * title string is a string row of its own value; each string language belongs to a string.
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
  key(LomStringLanguage, ["node"]),
  contained(on(LomStringLanguage, "node"), on(LomString, "id")),
  contained(on(LomLanguage, "lom"), on(Lom, "id")),
  contained(on(LomLanguage, "id", "position"), on(Edge, "child", "position")),
  contained(on(LomDescription, "lom"), on(Lom, "id")),
  contained(on(LomKeyword, "lom"), on(Lom, "id")),
  contained(on(LomCoverage, "lom"), on(Lom, "id")),
  contained(on(LomStructure, "lom"), on(Lom, "id")),
  contained(on(LomAggregationLevel, "lom"), on(Lom, "id")),
] as const;
