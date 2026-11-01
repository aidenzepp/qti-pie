/**
 * The content package: its manifest tree, the three manifest children and the `cp:metadata`
 * children that carry the package's schema name and version, the resources the manifest lists with
 * their files and dependencies, and the entries a package holds.
 *
 * A manifest tree's root node id is the package id, so `Package`, `Manifest` and the manifest's
 * tree share one uuid. Each manifest child hangs under the manifest by an `Edge` and is counted
 * exactly once per manifest by a capacity statement.
 */
import {
  capacity,
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { Edge, Node, RootKind, SchemaVersion, Tree } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

const base64 = str.regex(patterns.base64);

const hrefInPackage = str.regex(patterns.hrefInPackage);

const mimeType = str.regex(patterns.mimeType);

const ncName = str.regex(patterns.ncName);

const resourceType = str.regex(patterns.resourceType);

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
 * The resource types one schema version admits. Seeded by a custom migration and read-only to every
 * role.
 */
export const ResourceTypeOf = relation(
  "ResourceTypeOf",
  { type: resourceType, version: closedId(SchemaVersion) },
  ["version", "type"],
);

/**
 * The resource type each QTI document root is listed under. Seeded by a custom migration and
 * read-only to every role.
 */
export const RootOfType = relation("RootOfType", { root: closedId(RootKind), type: resourceType }, [
  "type",
]);

/**
 * A `cp:resource` of a package, with its `identifier`, its `type` and the schema version it
 * carries so the type can be judged against `ResourceTypeOf`.
 */
export const Resource = relation(
  "Resource",
  {
    id: uuid,
    identifier: ncName,
    package: uuid,
    type: resourceType,
    version: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * The `href` of a resource, when it has one.
 */
export const ResourceHref = relation(
  "ResourceHref",
  { href: hrefInPackage, package: uuid, resource: uuid },
  ["resource"],
);

/**
 * The `cp:metadata` child of a resource.
 */
export const ResourceMetadata = relation("ResourceMetadata", { id: uuid, resource: uuid }, ["id"]);

/**
 * A `cp:file` of a resource at its position among the resource's files. Its `href` is an entry of
 * the package; two files of one resource may share an `href`.
 */
export const File = relation(
  "File",
  { href: hrefInPackage, id: uuid, package: uuid, position: pg.bigint, resource: uuid },
  ["id"],
);

/**
 * A `cp:dependency` of a resource: `resource` is the owning resource's `identifier` and `target`
 * the `identifierref` it points at.
 */
export const Dependency = relation(
  "Dependency",
  { id: uuid, package: uuid, resource: ncName, target: ncName },
  ["id"],
);

/**
 * The bytes of a package entry, once per entry: its length, its base64 content and its media type.
 */
export const FileContent = relation(
  "FileContent",
  {
    byteLength: pg.bigint,
    content: base64,
    mimeType,
    package: uuid,
    path: hrefInPackage,
  },
  ["package", "path"],
);

/**
 * The manifest kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "cp:dependency": Dependency,
  "cp:file": File,
  "cp:manifest": Package,
  "cp:metadata.manifest": ManifestMetadata,
  "cp:metadata.resource": ResourceMetadata,
  "cp:organizations": Organizations,
  "cp:resource": Resource,
  "cp:resources": Resources,
  "cp:schema": ManifestSchema,
  "cp:schemaversion": ManifestSchemaVersion,
};

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  Dependency,
  EntryKind,
  File,
  FileContent,
  Manifest,
  ManifestMetadata,
  ManifestSchema,
  ManifestSchemaVersion,
  Organizations,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
  ResourceMetadata,
  ResourceTypeOf,
  Resources,
  RootOfType,
};

/**
 * The statements over this module's relations: the manifest tree's id is the package id and binds
 * its version; each manifest child belongs to a package, hangs under the manifest by an edge, and
 * occurs exactly once; each metadata child belongs to the metadata, hangs under it by an edge, and
 * occurs exactly once; each entry belongs to a package; each resource belongs to a package under
 * the package's version, has a type its version admits and is a node of the manifest tree; each
 * file hangs under its resource by an edge, names an entry of the package, and every resource has
 * at least one; each dependency names two resources of its package, never the same one; each file
 * content is the bytes of an entry.
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
  key(Resource, ["package", "identifier"]),
  contained(on(Resource, "package"), on(Package, "id")),
  contained(on(Resource, "package", "version"), on(Package, "id", "schemaversion")),
  contained(on(Resource, "version", "type"), on(ResourceTypeOf, "version", "type")),
  contained(on(Resource, "id", "package"), on(Node, "id", "tree")),
  contained(on(ResourceHref, "resource", "package"), on(Resource, "id", "package")),
  key(ResourceMetadata, ["resource"]),
  contained(on(ResourceMetadata, "resource"), on(Resource, "id")),
  contained(on(ResourceMetadata, "id", "resource"), on(Edge, "child", "parent")),
  key(File, ["package", "resource", "position"]),
  contained(on(File, "resource", "package"), on(Resource, "id", "package")),
  contained(on(File, "package", "href"), on(PackageEntry, "package", "path")),
  contained(on(File, "id", "resource", "position"), on(Edge, "child", "parent", "position")),
  capacity(on(Resource, "id"), { from: on(File, "resource"), within: within(1n, "*") }),
  contained(on(Dependency, "package", "resource"), on(Resource, "package", "identifier")),
  contained(on(Dependency, "package", "target"), on(Resource, "package", "identifier")),
  check("DependencyNotSelf", Dependency, (d) => d.ne(d.resource, d.target)),
  contained(on(Dependency, "id", "package"), on(Node, "id", "tree")),
  contained(on(FileContent, "package", "path"), on(PackageEntry, "package", "path")),
] as const;
