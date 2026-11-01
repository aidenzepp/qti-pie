/**
 * The content package: its manifest tree, the three manifest children and the `cp:metadata`
 * children that carry the package's schema name and version, and the entries a package holds.
 *
 * A manifest tree's root node id is the package id, so `Package`, `Manifest` and the manifest's
 * tree share one uuid. Each manifest child hangs under the manifest by an `Edge` and is counted
 * exactly once per manifest by a capacity statement.
 */
import {
  capacity,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { SchemaVersion, Edge, Tree } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * What a package entry is: the manifest itself, or a file the package carries.
 */
export const EntryKind = closed("EntryKind", ["manifest", "file"]);

/**
 * A content package, identified by its manifest root's node id, with the manifest's `identifier`
 * and the schema version of its manifest tree.
 */
export const Package = relation(
  "Package",
  {
    id: uuid,
    identifier: str.regex(patterns.ncName),
    schemaversion: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * The manifest of a package; its id is the package id.
 */
export const Manifest = relation("Manifest", { id: uuid }, ["id"]);

/**
 * The `cp:metadata` child of a manifest.
 */
export const ManifestMetadata = relation("ManifestMetadata", { id: uuid, manifest: uuid }, ["id"]);

/**
 * The `cp:organizations` child of a manifest.
 */
export const Organizations = relation("Organizations", { id: uuid, manifest: uuid }, ["id"]);

/**
 * The `cp:resources` child of a manifest.
 */
export const Resources = relation("Resources", { id: uuid, manifest: uuid }, ["id"]);

/**
 * The `cp:schema` text of a manifest's metadata: one of the seven names the QTI profile enumerates.
 */
export const ManifestSchema = relation(
  "ManifestSchema",
  { id: uuid, metadata: uuid, value: str.regex(patterns.cpSchema) },
  ["id"],
);

/**
 * The `cp:schemaversion` text of a manifest's metadata, `3.0.0` or `3.0.1`. It is text, not a
 * `SchemaVersion` handle: a name belongs to one identity, and the copy on `Package` is guarded
 * outside the schema.
 */
export const ManifestSchemaVersion = relation(
  "ManifestSchemaVersion",
  { id: uuid, metadata: uuid, value: str.regex(patterns.schemaVersion) },
  ["id"],
);

/**
 * A manifest or file a package carries, at its path inside the package.
 */
export const PackageEntry = relation(
  "PackageEntry",
  { kind: closedId(EntryKind), package: uuid, path: str.regex(patterns.hrefInPackage) },
  ["package", "path"],
);

/**
 * The manifest kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "cp:manifest": Package,
  "cp:metadata.manifest": ManifestMetadata,
  "cp:organizations": Organizations,
  "cp:resources": Resources,
  "cp:schema": ManifestSchema,
  "cp:schemaversion": ManifestSchemaVersion,
};

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  EntryKind,
  Manifest,
  ManifestMetadata,
  ManifestSchema,
  ManifestSchemaVersion,
  Organizations,
  Package,
  PackageEntry,
  Resources,
};

/**
 * The statements over this module's relations: the manifest tree's id is the package id and binds
 * its version; each manifest child belongs to a package, hangs under the manifest by an edge, and
 * occurs exactly once; each metadata child belongs to the metadata, hangs under it by an edge, and
 * occurs exactly once; each entry belongs to a package.
 */
export const rules = [
  mirrors(on(Manifest, "id"), on(Package, "id")),
  contained(
    on(select(Tree, { kind: "manifest" }), "id", "version"),
    on(Package, "id", "schemaversion"),
  ),
  key(ManifestMetadata, ["manifest"]),
  contained(on(ManifestMetadata, "manifest"), on(Package, "id")),
  contained(on(ManifestMetadata, "id", "manifest"), on(Edge, "child", "parent")),
  capacity(on(Package, "id"), { from: on(ManifestMetadata, "manifest"), within: within(1n, 1n) }),
  key(Organizations, ["manifest"]),
  contained(on(Organizations, "manifest"), on(Package, "id")),
  contained(on(Organizations, "id", "manifest"), on(Edge, "child", "parent")),
  capacity(on(Package, "id"), { from: on(Organizations, "manifest"), within: within(1n, 1n) }),
  key(Resources, ["manifest"]),
  contained(on(Resources, "manifest"), on(Package, "id")),
  contained(on(Resources, "id", "manifest"), on(Edge, "child", "parent")),
  capacity(on(Package, "id"), { from: on(Resources, "manifest"), within: within(1n, 1n) }),
  key(ManifestSchema, ["metadata"]),
  contained(on(ManifestSchema, "metadata"), on(ManifestMetadata, "id")),
  contained(on(ManifestSchema, "id", "metadata"), on(Edge, "child", "parent")),
  capacity(on(ManifestMetadata, "id"), {
    from: on(ManifestSchema, "metadata"),
    within: within(1n, 1n),
  }),
  key(ManifestSchemaVersion, ["metadata"]),
  contained(on(ManifestSchemaVersion, "metadata"), on(ManifestMetadata, "id")),
  contained(on(ManifestSchemaVersion, "id", "metadata"), on(Edge, "child", "parent")),
  capacity(on(ManifestMetadata, "id"), {
    from: on(ManifestSchemaVersion, "metadata"),
    within: within(1n, 1n),
  }),
  contained(on(PackageEntry, "package"), on(Package, "id")),
] as const;
