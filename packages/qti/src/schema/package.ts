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
  alternatives,
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
 * The `cp:metadata` child of a file, at most once per file.
 */
export const FileMetadata = relation("FileMetadata", { file: uuid, id: uuid }, ["id"]);

/**
 * The relations of the file metadata, spread into `relations`.
 */
export const fileMetadataRelations = { FileMetadata };

/**
 * The statements over `FileMetadata`: at most one per file, hung under its file by an edge, and
 * naming a file of a package. Spread into `rules`.
 */
export const fileMetadataRules = [
  key(FileMetadata, ["file"]),
  contained(on(FileMetadata, "id", "file"), on(Edge, "child", "parent")),
  contained(on(FileMetadata, "file"), on(File, "id")),
] as const;

/**
 * The arm of the file metadata, keyed by its `NodeKind` handle. Spread into `arms`.
 */
export const fileMetadataArms = { "cp:metadata.file": FileMetadata };

const drdLeaf = <Name extends string>(name: Name, value: ReturnType<typeof str.regex>) =>
  relation(name, { id: uuid, owner: uuid, value }, ["id"]);

/**
 * A `cpx:variant` of a resource: its `identifier`, its `identifierref` naming a sibling resource,
 * and the resource it hangs under, with that resource's `identifier` kept as a bound copy. The
 * `identifier` and `identifierref` columns hold the collapsed `xs:ID` and `xs:IDREF` values.
 */
export const Variant = relation(
  "Variant",
  {
    id: uuid,
    identifier: ncName,
    identifierref: ncName,
    package: uuid,
    resource: uuid,
    resourceIdentifier: ncName,
  },
  ["id"],
);

/**
 * The `cpx:metadata` child of a variant.
 */
export const VariantMetadata = relation("VariantMetadata", { id: uuid, variant: uuid }, ["id"]);

/**
 * The `drd:accessForAllResource` child of a variant's metadata.
 */
export const AccessForAllResource = relation("AccessForAllResource", { id: uuid, metadata: uuid }, [
  "id",
]);

/**
 * The `drd:accessMode` text of a digital resource description.
 */
export const DrdAccessMode = drdLeaf("DrdAccessMode", str.regex(patterns.drdAccessMode));

/**
 * The `drd:accessModeAdapted` text.
 */
export const DrdAccessModeAdapted = drdLeaf(
  "DrdAccessModeAdapted",
  str.regex(patterns.drdAccessModeAdapted),
);

/**
 * The `drd:adaptationDetail` text.
 */
export const DrdAdaptationDetail = drdLeaf(
  "DrdAdaptationDetail",
  str.regex(patterns.drdAdaptationDetail),
);

/**
 * The `drd:adaptationMediaType` text.
 */
export const DrdAdaptationMediaType = drdLeaf(
  "DrdAdaptationMediaType",
  str.regex(patterns.drdAdaptationMediaType),
);

/**
 * The `drd:adaptationType` text.
 */
export const DrdAdaptationType = drdLeaf(
  "DrdAdaptationType",
  str.regex(patterns.drdAdaptationType),
);

/**
 * The `drd:apiInteroperable` text.
 */
export const DrdApiInteroperable = drdLeaf(
  "DrdApiInteroperable",
  str.regex(patterns.drdApiInteroperable),
);

/**
 * The `drd:atInteroperable` text: an `xs:boolean`, at most once per resource description.
 */
export const DrdAtInteroperable = drdLeaf("DrdAtInteroperable", str.regex(patterns.xsBoolean));

/**
 * The `drd:controlFlexibility` text.
 */
export const DrdControlFlexibility = drdLeaf(
  "DrdControlFlexibility",
  str.regex(patterns.drdControlFlexibility),
);

/**
 * The `drd:displayTransformability` text.
 */
export const DrdDisplayTransformability = drdLeaf(
  "DrdDisplayTransformability",
  str.regex(patterns.drdDisplayTransformability),
);

/**
 * The `drd:educationalComplexityOfAdaptation` text, at most once per resource description.
 */
export const DrdEducationalComplexityOfAdaptation = drdLeaf(
  "DrdEducationalComplexityOfAdaptation",
  str.regex(patterns.drdEducationalComplexityOfAdaptation),
);

/**
 * The `drd:educationalLevelOfAdaptation` text: an `xs:normalizedString`.
 */
export const DrdEducationalLevelOfAdaptation = drdLeaf(
  "DrdEducationalLevelOfAdaptation",
  str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
);

/**
 * The `drd:hasAdaptation` text: an `xs:anyURI` on the collapsed value.
 */
export const DrdHasAdaptation = drdLeaf("DrdHasAdaptation", str.regex(patterns.anyUri));

/**
 * The `drd:hazard` text.
 */
export const DrdHazard = drdLeaf("DrdHazard", str.regex(patterns.drdHazard));

/**
 * The `drd:isAdaptationOf` text: an `xs:anyURI` on the collapsed value.
 */
export const DrdIsAdaptationOf = drdLeaf("DrdIsAdaptationOf", str.regex(patterns.anyUri));

/**
 * The `drd:isFullAdaptationOf` text: an `xs:anyURI` on the collapsed value.
 */
export const DrdIsFullAdaptationOf = drdLeaf("DrdIsFullAdaptationOf", str.regex(patterns.anyUri));

/**
 * The `drd:isPartialAdaptationOf` text: an `xs:anyURI` on the collapsed value.
 */
export const DrdIsPartialAdaptationOf = drdLeaf(
  "DrdIsPartialAdaptationOf",
  str.regex(patterns.anyUri),
);

/**
 * The `drd:languageOfAdaptation` text: an `xs:normalizedString`.
 */
export const DrdLanguageOfAdaptation = drdLeaf(
  "DrdLanguageOfAdaptation",
  str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
);

/**
 * The 17 DRD leaves in one table: the node-kind handle, the relation, and whether the XSD admits
 * the element at most once per resource description (`keyed`).
 */
const drdLeaves = [
  { handle: "drd:accessMode", keyed: false, relation: DrdAccessMode },
  { handle: "drd:accessModeAdapted", keyed: false, relation: DrdAccessModeAdapted },
  { handle: "drd:adaptationDetail", keyed: false, relation: DrdAdaptationDetail },
  { handle: "drd:adaptationMediaType", keyed: false, relation: DrdAdaptationMediaType },
  { handle: "drd:adaptationType", keyed: false, relation: DrdAdaptationType },
  { handle: "drd:apiInteroperable", keyed: false, relation: DrdApiInteroperable },
  { handle: "drd:atInteroperable", keyed: true, relation: DrdAtInteroperable },
  { handle: "drd:controlFlexibility", keyed: false, relation: DrdControlFlexibility },
  { handle: "drd:displayTransformability", keyed: false, relation: DrdDisplayTransformability },
  {
    handle: "drd:educationalComplexityOfAdaptation",
    keyed: true,
    relation: DrdEducationalComplexityOfAdaptation,
  },
  {
    handle: "drd:educationalLevelOfAdaptation",
    keyed: false,
    relation: DrdEducationalLevelOfAdaptation,
  },
  { handle: "drd:hasAdaptation", keyed: false, relation: DrdHasAdaptation },
  { handle: "drd:hazard", keyed: false, relation: DrdHazard },
  { handle: "drd:isAdaptationOf", keyed: false, relation: DrdIsAdaptationOf },
  { handle: "drd:isFullAdaptationOf", keyed: false, relation: DrdIsFullAdaptationOf },
  { handle: "drd:isPartialAdaptationOf", keyed: false, relation: DrdIsPartialAdaptationOf },
  { handle: "drd:languageOfAdaptation", keyed: false, relation: DrdLanguageOfAdaptation },
] as const;

/**
 * The relations of the variant and DRD vocabulary, spread into `relations`.
 */
export const variantDrdRelations = {
  AccessForAllResource,
  DrdAccessMode,
  DrdAccessModeAdapted,
  DrdAdaptationDetail,
  DrdAdaptationMediaType,
  DrdAdaptationType,
  DrdApiInteroperable,
  DrdAtInteroperable,
  DrdControlFlexibility,
  DrdDisplayTransformability,
  DrdEducationalComplexityOfAdaptation,
  DrdEducationalLevelOfAdaptation,
  DrdHasAdaptation,
  DrdHazard,
  DrdIsAdaptationOf,
  DrdIsFullAdaptationOf,
  DrdIsPartialAdaptationOf,
  DrdLanguageOfAdaptation,
  Variant,
  VariantMetadata,
};

/**
 * The statements over the variant and DRD relations. A variant belongs to a resource, which
 * it names by id and by a bound copy of the resource's identifier, hangs under it by an edge, and
 * points at a sibling resource, never its own parent. Its metadata and the metadata's
 * access-for-all resource each occur exactly once and hang under their parent by an edge. Each
 * leaf hangs under the access-for-all resource that owns it. No statement binds a child arm's
 * owner to a parent kind: the `Edge` admission law judges that.
 */
export const variantDrdRules = [
  key(Variant, ["package", "identifier"]),
  contained(on(Variant, "id", "resource"), on(Edge, "child", "parent")),
  contained(
    on(Variant, "resource", "package", "resourceIdentifier"),
    on(Resource, "id", "package", "identifier"),
  ),
  contained(on(Variant, "package", "identifierref"), on(Resource, "package", "identifier")),
  check("VariantNotSelf", Variant, (v) => v.ne(v.identifierref, v.resourceIdentifier)),
  key(VariantMetadata, ["variant"]),
  contained(on(VariantMetadata, "id", "variant"), on(Edge, "child", "parent")),
  contained(on(VariantMetadata, "variant"), on(Variant, "id")),
  capacity(on(Variant, "id"), { from: on(VariantMetadata, "variant"), within: within(1n, 1n) }),
  key(AccessForAllResource, ["metadata"]),
  contained(on(AccessForAllResource, "id", "metadata"), on(Edge, "child", "parent")),
  contained(on(AccessForAllResource, "metadata"), on(VariantMetadata, "id")),
  capacity(on(VariantMetadata, "id"), {
    from: on(AccessForAllResource, "metadata"),
    within: within(1n, 1n),
  }),
  ...drdLeaves.flatMap(({ keyed, relation: leaf }) => [
    contained(on(leaf, "id", "owner"), on(Edge, "child", "parent")),
    contained(on(leaf, "owner"), on(AccessForAllResource, "id")),
    ...(keyed ? [key(leaf, ["owner"])] : []),
  ]),
] as const;

/**
 * The arms of the variant and DRD vocabulary, spread into `arms` and keyed by their `NodeKind`
 * handles.
 */
export const variantDrdArms = {
  "cpx:metadata": VariantMetadata,
  "cpx:variant": Variant,
  "drd:accessForAllResource": AccessForAllResource,
  "drd:accessMode": DrdAccessMode,
  "drd:accessModeAdapted": DrdAccessModeAdapted,
  "drd:adaptationDetail": DrdAdaptationDetail,
  "drd:adaptationMediaType": DrdAdaptationMediaType,
  "drd:adaptationType": DrdAdaptationType,
  "drd:apiInteroperable": DrdApiInteroperable,
  "drd:atInteroperable": DrdAtInteroperable,
  "drd:controlFlexibility": DrdControlFlexibility,
  "drd:displayTransformability": DrdDisplayTransformability,
  "drd:educationalComplexityOfAdaptation": DrdEducationalComplexityOfAdaptation,
  "drd:educationalLevelOfAdaptation": DrdEducationalLevelOfAdaptation,
  "drd:hasAdaptation": DrdHasAdaptation,
  "drd:hazard": DrdHazard,
  "drd:isAdaptationOf": DrdIsAdaptationOf,
  "drd:isFullAdaptationOf": DrdIsFullAdaptationOf,
  "drd:isPartialAdaptationOf": DrdIsPartialAdaptationOf,
  "drd:languageOfAdaptation": DrdLanguageOfAdaptation,
};

/**
 * What holds an `xs:ID` of a manifest: the manifest itself, a resource, or a variant.
 */
export const ManifestIdHolder = closed("ManifestIdHolder", ["manifest", "resource", "variant"]);

/**
 * An `xs:ID` of a manifest, one row per value: the manifest document has one ID space, so a
 * package's manifest, resources and variants share it. `holder` names which of the three owns the
 * value, and the holder's arm below binds it to that owner.
 */
export const ManifestId = relation(
  "ManifestId",
  { holder: closedId(ManifestIdHolder), id: ncName, package: uuid },
  ["package", "id"],
);

/**
 * The `ManifestId` of a package's manifest: the manifest's `identifier`.
 */
export const ManifestIdOfManifest = relation(
  "ManifestIdOfManifest",
  { id: ncName, package: uuid },
  ["package", "id"],
);

/**
 * The `ManifestId` of a resource: the resource's `identifier`.
 */
export const ManifestIdOfResource = relation(
  "ManifestIdOfResource",
  { id: ncName, package: uuid },
  ["package", "id"],
);

/**
 * The `ManifestId` of a variant: the variant's `identifier`.
 */
export const ManifestIdOfVariant = relation("ManifestIdOfVariant", { id: ncName, package: uuid }, [
  "package",
  "id",
]);

/**
 * The statements of the manifest-wide `xs:ID` space. Each id belongs to a package, and the
 * alternatives statement sends each holder to its arm. Each arm is mirrored onto its owner's
 * `identifier`, so every package, resource and variant has exactly its id row and no id row lacks
 * an owner. `p4-01`'s probe (`probe.test.ts`) admitted mirroring onto the owner's superkey `(id,
 * identifier)`, so each is one `mirrors` and not two containments each way.
 */
const manifestIdRules = [
  contained(on(ManifestId, "package"), on(Package, "id")),
  alternatives(ManifestId, "holder", ManifestIdHolder, {
    manifest: ManifestIdOfManifest,
    resource: ManifestIdOfResource,
    variant: ManifestIdOfVariant,
  }),
  mirrors(on(ManifestIdOfManifest, "package", "id"), on(Package, "id", "identifier")),
  mirrors(on(ManifestIdOfResource, "package", "id"), on(Resource, "package", "identifier")),
  mirrors(on(ManifestIdOfVariant, "package", "id"), on(Variant, "package", "identifier")),
] as const;

/**
 * The manifest kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  ...fileMetadataArms,
  ...variantDrdArms,
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
  ...fileMetadataRelations,
  ...variantDrdRelations,
  Dependency,
  EntryKind,
  File,
  FileContent,
  Manifest,
  ManifestId,
  ManifestIdHolder,
  ManifestIdOfManifest,
  ManifestIdOfResource,
  ManifestIdOfVariant,
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
 * content is the bytes of an entry. The variant and DRD statements and the `ManifestId` statements
 * follow.
 */
export const rules = [
  ...fileMetadataRules,
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
  ...variantDrdRules,
  ...manifestIdRules,
] as const;
