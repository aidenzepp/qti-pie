/**
 * The package and its record, and the manifest's overlays (plan §1.6; the W5 amendment's C17 and
 * C18; the orchestrator's rulings of 2026-11-06 and spec reading 93).
 *
 * {@link Package} owns its {@link Entry} rows, an ordered family in listing order: every entry's
 * bytes as read, the record the model is rebuildable from. The manifest's elements that a law reads
 * across rows have overlays, each a flat row keyed by its element's node: {@link ManifestId}
 * (`cp:manifest`), {@link Resource} and its optional {@link ResourceHref} (`cp:resource`),
 * {@link File} (`cp:file`) and {@link Dependency} (`cp:dependency`). Each copies its node's
 * {@link nodeRef} tuple, names a node of its own kind, and takes each attribute value it compares
 * from `Attribute` (C18), with the key over that attribute's selection that keeps its lexical form
 * out of every index (the tier-1 addendum's "Text in keys").
 *
 * Three relations are projections, keyed by their heading, each owning a counted family whose count
 * is above 0, so each holds exactly the values some member row holds: {@link FileHref}, the hrefs a
 * package's files name; {@link ResourceFile}, the hrefs each resource's files name; and
 * {@link NamedHref}, the (href, type) pairs the package's resources name. They state the
 * existentials a key cannot: a file may be listed by several resources and twice by one (spec
 * reading 36), so no file href is a key.
 *
 * A resource names a document only through its `href` (reading 93): a resource of a type
 * `RootOfType` maps names the document at its `href`, and every other document is the manifest.
 *
 * An href is read in two written pieces, `path ‖ params` (reading 102): `params` is empty or starts
 * at the first `?` or `#`, a query or a fragment, and only `path` names a file. So a resource's
 * `href` may carry launch parameters its file's `href` does not (IMS Content Packaging 1.2,
 * §6.6.2), and a reference may carry a media fragment. A path this representation resolves to an
 * entry is in the one stated form of `#pantry/qti/limits.ts` `resolvedHref`, under the limit law
 * "Href form"; an external href ({@link externalHrefPattern}) is admitted and never resolved
 * (reading 35), and every other value is refused under that limit, never under a QTI law.
 *
 * Every in-package file a manifest or a document names is an entry (IMS Content Packaging 1.2,
 * InterchangePackage (b) and (d)): a `cp:file`'s href in the form is an entry's path
 * (`file-exists`), and so is each {@link ReferencePath}, a reference of a document resolved against
 * the document's directory ({@link DocumentDirectory}). A dependency never names its own resource
 * (IMS Content Packaging 1.2, §6.11.5 B ii).
 *
 * @see {@link https://www.imsglobal.org/content/packaging/ | IMS Content Packaging 1.2}
 */
import {
  check,
  closed,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  key,
  natural,
  on,
  ordered,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import {
  AttributeName,
  documentTypes,
  NodeKind,
  ReferenceAttribute,
  ResourceType,
  ResourceTypeLexical,
  ResourceTypeOf,
  RootOfType,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { Document, EntryPath } from "#pantry/qti/chardata.ts";
import { keyText, resolvedHref } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * The path of a package's manifest, the one entry no `cp:file` lists and the one document no
 * resource names.
 */
export const manifestPath = "imsmanifest.xml";

/**
 * An entry's bytes as standard base64 with padding, the canonical `xs:base64Binary` form (RFC 4648,
 * §4), since grizzle has no bytes type (A11): one spelling per byte string.
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648#section-4 | RFC 4648, §4}
 */
export const EntryContent = str.regex(
  "^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$",
);

/**
 * A package's name: the last segment of the directory or zip file it was read from, which the
 * importer writes (`#pantry/import/record.ts` `packageNameOf`). No law reads it, and no key holds
 * it; a file name is at most 255 code points on every file system the reader runs on.
 *
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const PackageName = str.regex("^[^/]{1,255}$");

/**
 * A package: its id, its name, and its count of entries, which the family draws.
 */
export const Package = relation(
  "Package",
  { entries: drawn(natural), id: uuid, name: PackageName },
  ["id"],
);

/**
 * One entry of a package, the record (plan §1.6, fin.md P7): its path and its bytes, at its slot in
 * the listing, which the family draws from its place in the nesting.
 *
 * Whether it is the manifest is a function of `path`, and its byte length one of `content`, so
 * neither is stored (review R19).
 */
export const Entry = relation(
  "Entry",
  { at: drawn(natural), content: EntryContent, package: uuid, path: EntryPath },
  ["package", "at"],
);

/**
 * A package's entries in listing order, nested at `Package.entries`.
 */
export const entryFamily = ordered(on(Entry, "package", "at"), fin(Package, "entries"));

/**
 * The manifest's overlay, keyed by the `cp:manifest` node: its {@link nodeRef} tuple, its package,
 * and its `identifier`'s lexical form, which every resource's identifier is compared with.
 */
export const ManifestId = relation(
  "ManifestId",
  {
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    package: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A resource's overlay, keyed by the `cp:resource` node: its {@link nodeRef} tuple, its package, its
 * `identifier`'s and `type`'s lexical forms, its `type`'s `ResourceType` code, and its manifest's
 * identifier, copied so a row check compares the two.
 *
 * The code is the builder's (C17): the handle the lexical form spells, or `none` for a form no
 * handle spells, which no `ResourceTypeOf` row holds.
 */
export const Resource = relation(
  "Resource",
  {
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    manifestIdentifier: keyText,
    nearest: uuid,
    node: uuid,
    package: uuid,
    parent: uuid,
    start: natural,
    type: closedId(ResourceType),
    typeLexical: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The pattern of an href's `params` piece (reading 102): empty, or a query or a fragment, from the
 * first `?` or `#` to the end (RFC 3986, §3.4 and §3.5, which end a path at either). The `path`
 * before it holds neither ({@link hrefPathPattern}), so the split of an href is one.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-3.4 | RFC 3986, §3.4}
 */
export const hrefParamsPattern = "^(?:[?#].*)?$";

/**
 * The pattern of an href's `path` piece: no `?` and no `#`, the characters that start `params`.
 */
export const hrefPathPattern = "^[^?#]*$";

/**
 * An href's `params` piece, its query or fragment (reading 102): text no key holds and no law
 * compares, written beside the `path` it follows so the two concatenate to the href.
 */
export const HrefParams = str.regex(hrefParamsPattern, "su");

/**
 * An external href, which names no package entry and is never resolved: a URI with a scheme
 * (reading 35's absolute href), or a reference that starts with `/`, a network path or an absolute
 * path, which resolves against the location a package is read from rather than within it (reading
 * 102). The pattern reads the start of the href alone.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-4.2 | RFC 3986, §4.2}
 */
export const externalHrefPattern = "^(?:[A-Za-z][A-Za-z0-9+.\\-]*:|/)";

/**
 * A document's name in its directory, the last segment of its path: no `/`.
 */
export const documentNamePattern = "^[^/]+$";

/**
 * A `srcset` this representation reads: one image candidate, its URL alone, so it holds no comma,
 * and "Href form" judges it as one URL. The HTML Standard's `srcset` is a comma-separated list of
 * candidates, each a URL and an optional width or density descriptor; reading each candidate at
 * its index needs a split this representation does not yet prove, so a `srcset` of several
 * candidates or with a descriptor is refused under that limit (the corpus's four `srcset` values
 * are each one URL with no descriptor).
 *
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#srcset-attributes | HTML, srcset}
 */
export const srcsetCandidatePattern = "^[^,]*$";

/**
 * The number of leading `../` segments a resolved reference climbs by, `0` to eight: RFC 3986's
 * dot-segment removal (§5.2.4) for a reference that starts with them is stated for each depth,
 * read from {@link DotSegments}, and a reference that climbs further is refused under "Href form",
 * a stated limit (the corpus climbs by one at most).
 */
export const DotDepth = closed("DotDepth", ["0", "1", "2", "3", "4", "5", "6", "7", "8"]);

/**
 * The most `../` segments a reference may climb by, {@link DotDepth}'s last handle.
 */
export const dotDepthMax = DotDepth.handles.length - 1;

/**
 * A pattern payload's text: any text, the pattern grammar's own.
 */
const patternText = str.regex("^.*$", "su");

/**
 * The pattern of a reference's leading dot segments that climb by `depth` (reading 102): any number
 * of `./`, and exactly `depth` of `../`, each segment ending with `/`, in any order.
 *
 * @param depth - The number of `../` segments.
 * @returns The pattern.
 */
export const upsPattern = (depth: number): string =>
  `^(?:\\./)*${"(?:\\.\\./(?:\\./)*)".repeat(depth)}$`;

/**
 * The pattern of the directory segments a climb of `depth` removes: exactly `depth` segments, each
 * nonempty and ending with `/`.
 *
 * @param depth - The number of segments.
 * @returns The pattern.
 */
export const removedPattern = (depth: number): string => `^${"[^/]+/".repeat(depth)}$`;

/**
 * `DotSegments`: depth → (ups, removed), the patterns a resolved reference's leading dot segments
 * and the directory segments they remove are read under, so a row check states RFC 3986 §5.2.4's
 * removal of leading dot segments (reading 102) with no loop: `ups` holds `depth` `../` segments
 * and `removed` exactly `depth` segments of the directory.
 */
export const DotSegments = closed.relation(
  "DotSegments",
  { depth: closedId(DotDepth), removed: patternText, ups: patternText },
  ["depth"],
  DotDepth.handles.map((depth) => ({
    depth,
    removed: removedPattern(Number(depth)),
    ups: upsPattern(Number(depth)),
  })),
);

/**
 * A reference's target this representation resolves (reading 102): any run of leading `./` and
 * `../` segments, then a path in the `resolvedHref` form, its first segment holding no `:`.
 */
export const dotPrefixedHrefPattern = `^(?:\\.\\.?/)*${resolvedHref.slice(1)}`;

/**
 * A resource's `href`, keyed by the resource's node: an optional attribute is a row of its own. It
 * carries its resource's package and type, so a document-typed resource's href is judged as the
 * document it names, and its two pieces (reading 102): `path`, the file it names, and `params`, the
 * launch parameters CP 1.2 §6.6.2 lets it carry beyond its file's href, which `E1_derived` proves
 * concatenate to `href`.
 */
export const ResourceHref = relation(
  "ResourceHref",
  {
    href: keyText,
    node: uuid,
    package: uuid,
    params: HrefParams,
    path: keyText,
    type: closedId(ResourceType),
  },
  ["node"],
);

/**
 * The (path, type) pairs a package's resources name, a projection keyed by its heading: one row per
 * pair, its `names` the resources whose href's path it is.
 */
export const NamedHref = relation(
  "NamedHref",
  {
    names: drawn(natural),
    package: uuid,
    path: keyText,
    type: closedId(ResourceType),
  },
  ["package", "path", "type"],
);

/**
 * A file's overlay, keyed by the `cp:file` node: its {@link nodeRef} tuple, its `resource` the
 * node's parent, its resource's package, and its `href`'s lexical form.
 */
export const File = relation(
  "File",
  {
    document: uuid,
    href: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    package: uuid,
    resource: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The hrefs a package's files name, a projection keyed by its heading: its `files` the files that
 * name it.
 */
export const FileHref = relation(
  "FileHref",
  { files: drawn(natural), href: keyText, package: uuid },
  ["package", "href"],
);

/**
 * The hrefs each resource's files name, a projection keyed by its heading: its `files` the files of
 * the resource that name it.
 */
export const ResourceFile = relation(
  "ResourceFile",
  { files: drawn(natural), href: keyText, resource: uuid },
  ["resource", "href"],
);

/**
 * A dependency's overlay, keyed by the `cp:dependency` node: its {@link nodeRef} tuple, its
 * `resource` the node's parent, its resource's package and identifier, and its `identifierref`'s
 * lexical form. The resource's identifier is copied so a row check compares the two: a dependency
 * names a sibling resource, never its own (IMS Content Packaging 1.2, §6.11.5 B ii).
 */
export const Dependency = relation(
  "Dependency",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    package: uuid,
    ref: keyText,
    resource: uuid,
    resourceIdentifier: keyText,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A document's directory, keyed by its document node: its package and path, `Document`'s, and the
 * split of the path at its last `/`, `directory ‖ name`, which `E1_derived` proves; `directory` is
 * empty at the package root and ends with `/` below it. A reference of the document that is a path
 * in the `resolvedHref` form names `directory ‖ path` (RFC 3986, §5.2.2 and §5.2.3: such a
 * reference merges with the base's directory, and removing dot segments changes nothing).
 *
 * It owns two counted families, whose counts the "Href form" limit reads: `bases`, the document's
 * `xml:base` attributes ({@link XmlBase}), and `references`, its {@link ReferencePath} rows. This
 * representation resolves no `xml:base`, so a document that holds both is refused under that limit,
 * whether or not the base is in the reference's scope.
 *
 * `directory` is `keyText`: every reference path copies it, so it rides keys.
 */
export const DocumentDirectory = relation(
  "DocumentDirectory",
  {
    bases: drawn(natural),
    directory: keyText,
    name: keyText,
    node: uuid,
    package: uuid,
    path: EntryPath,
    references: drawn(natural),
  },
  ["node"],
);

/**
 * An `xml:base` attribute of a document, keyed by its element's node: the element and its document,
 * copied from `Attribute`. No law reads its value, since this representation resolves no base; its
 * existence is counted against its document's references ({@link DocumentDirectory}).
 */
export const XmlBase = relation("XmlBase", { document: uuid, node: uuid }, ["node"]);

/**
 * A reference attribute's value, keyed by its element and its attribute's name: every attribute of
 * the reference census (`ReferenceAttribute`, the grammar's, spec reading 103), its lexical form
 * and its element's document and kind copied from `Attribute` (C18), and its split, which
 * `E1_derived` proves: `lexical = lead ‖ target ‖ params ‖ trail`, its outer whitespace, which a
 * URL "potentially surrounded by spaces" and an `xs:anyURI` both set aside, then its path and its
 * query or fragment (reading 102).
 *
 * "Href form" judges `target`: a path in the `resolvedHref` form, after any leading dot segments,
 * is an in-package path, which has its {@link ReferencePath}; an external target
 * ({@link externalHrefPattern}) and an empty one, a reference to its own document, are admitted
 * with none; anything else is refused under that limit.
 */
export const Reference = relation(
  "Reference",
  {
    document: uuid,
    kind: closedId(NodeKind),
    lead: Space,
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    params: HrefParams,
    target: keyText,
    trail: Space,
  },
  ["node", "name"],
);

/**
 * An in-package reference resolved against its document's directory, keyed by its element, its
 * attribute's name and `at`, the candidate's index in its attribute's value, 0 for every attribute
 * that holds one URL. Its fields:
 *
 * - **the host's:** `node` and `name`; `document`, `package` and `directory`, its document's
 *   {@link DocumentDirectory} row's; `kind` and `target`, its {@link Reference}'s element kind and
 *   path piece; and the pieces of RFC 3986's resolution (§5.2.2 to §5.2.4, reading 102), each
 *   proved: `target = ups ‖ rest`, its leading `./` and `../` segments and the path after them;
 *   `directory = kept ‖ removed`, the directory with the `climb` segments its `../` remove split
 *   off; and `path = kept ‖ rest`, the entry it names (`E1_derived`). "Href form" holds `rest` to
 *   the `resolvedHref` form and `ups` and `removed` to their {@link DotSegments} patterns at
 *   `climb`, so a reference that climbs above the package root, by more than {@link dotDepthMax},
 *   or with a dot segment after a plain one, is refused under that stated limit.
 *
 * Every in-package file a document references is an entry (`file-exists`, IMS Content Packaging
 * 1.2, InterchangePackage (d)), and a law that reads what a reference names (an item ref's item,
 * Q5.13's) reads it here. `path` is `keyText`: it rides the containment into `Entry`.
 */
export const ReferencePath = relation(
  "ReferencePath",
  {
    at: natural,
    climb: closedId(DotDepth),
    directory: keyText,
    document: uuid,
    kept: keyText,
    kind: closedId(NodeKind),
    name: closedId(AttributeName),
    node: uuid,
    package: uuid,
    path: keyText,
    removed: keyText,
    rest: keyText,
    target: keyText,
    ups: keyText,
  },
  ["node", "name", "at"],
);

/**
 * The hrefs a package's files name, counted per href: each file names its owner by
 * `(package, href)`.
 */
export const fileHrefFamily = counted(on(File, "package", "href"), fin(FileHref, "files"));

/**
 * The hrefs each resource's files name, counted per (resource, href).
 */
export const resourceFileFamily = counted(on(File, "resource", "href"), fin(ResourceFile, "files"));

/**
 * The (path, type) pairs a package's resources name, counted per pair.
 */
export const namedHrefFamily = counted(
  on(ResourceHref, "package", "path", "type"),
  fin(NamedHref, "names"),
);

/**
 * Each document's `xml:base` attributes, counted by its {@link DocumentDirectory}'s `bases`.
 */
export const xmlBaseFamily = counted(on(XmlBase, "document"), fin(DocumentDirectory, "bases"));

/**
 * Each document's resolved references, counted by its {@link DocumentDirectory}'s `references`.
 */
export const referencePathFamily = counted(
  on(ReferencePath, "document"),
  fin(DocumentDirectory, "references"),
);

/**
 * Select the attributes of one name on elements of one kind: the source of an overlay's copy (C18).
 *
 * A copy, `contained(on(selection, "node", "lexical"), on(O, "node", field))`, makes the
 * attribute's lexical form the overlay's field and its existence the overlay row's. Every
 * containment lowers to a foreign key and a reverse index over its source's columns, and grizzle
 * refuses an index over `Attribute.lexical`, which no pattern bounds (`UnrepresentableKey`); so
 * each copy sits beside `key(on(selection, "node"))`, whose UNIQUE over the selection's node serves
 * that reverse probe, and no index holds the lexical form. The key holds already, since an element
 * has one attribute of a name (AL2). Each selection is one value, so the key and the copy read one
 * law column.
 *
 * @param kind - The element's kind.
 * @param name - The attribute's name.
 * @returns The selection.
 */
const attributesOf = (
  kind: "cp:dependency" | "cp:file" | "cp:manifest" | "cp:resource",
  name: "href" | "identifier" | "identifierref" | "type",
) => select(Attribute, (a) => a.and(a.eq(a.name, name), a.eq(a.kind, kind)));

/**
 * The `identifier` of each `cp:manifest`.
 */
const manifestIdentifiers = attributesOf("cp:manifest", "identifier");

/**
 * The `identifier` of each `cp:resource`.
 */
const resourceIdentifiers = attributesOf("cp:resource", "identifier");

/**
 * The `type` of each `cp:resource`.
 */
const resourceTypes = attributesOf("cp:resource", "type");

/**
 * The `href` of each `cp:resource` that has one.
 */
const resourceHrefs = attributesOf("cp:resource", "href");

/**
 * The `href` of each `cp:file`.
 */
const fileHrefs = attributesOf("cp:file", "href");

/**
 * The `identifierref` of each `cp:dependency`.
 */
const dependencyRefs = attributesOf("cp:dependency", "identifierref");

/**
 * Select the nodes of one kind, a constant selection: a containment into it carries the constant,
 * so every such containment references the one `UNIQUE (id, kind)` on `Node` that the document
 * layer's arms share (`laws/model/plan.ts` `#constantTarget`).
 *
 * @param kind - The kind.
 * @returns The selection.
 */
const nodesOf = (kind: "cp:dependency" | "cp:file" | "cp:manifest" | "cp:resource") =>
  select(Node, (n) => n.eq(n.kind, kind));

/**
 * The resource hrefs whose type `RootOfType` maps: each names a document of that type.
 */
const documentHrefs = select(ResourceHref, (h) => h.in(h.type, documentTypes));

/**
 * The files whose href is a path in the `resolvedHref` form, the ones this representation resolves:
 * each names an entry (`file-exists`). An external href is left out (reading 35).
 */
const inPackageFiles = select(File, (f) => Compute.matches(f.href, resolvedHref));

/**
 * The elements whose `xml:base` scopes a `cp:file`'s href: CP 1.2's Base class has the parents
 * Manifest, Resources and Resource, and its value is appended to the bases above it before a
 * file's href resolves against it, which this representation does not state.
 */
const manifestBaseKinds = ["cp:manifest", "cp:resources", "cp:resource"] as const;

/**
 * Every `xml:base` attribute, which {@link XmlBase} copies.
 */
const xmlBases = select(Attribute, (a) => a.eq(a.name, "xml:base"));

/**
 * The attributes of the reference census (`ReferenceAttribute`, spec reading 103): each an
 * attribute by which an element of its kind names a file under its version, of either form. Each is
 * a {@link Reference}'s copy (C18); the key over its `(node, name)`, true since an element holds one
 * attribute of a closed name (AL2), serves the copy's reverse probe, so no index holds the lexical
 * form.
 */
const censusAttributes = select(Attribute, (a) =>
  a.in(ReferenceAttribute.at("form", a.version, a.kind, a.name), ["uri", "srcset"]),
);

/**
 * The references whose target is an in-package path, `resolvedHref`'s form after any leading
 * dot segments: each has its {@link ReferencePath}.
 */
const inPackageReferences = select(Reference, (r) =>
  Compute.matches(r.target, dotPrefixedHrefPattern),
);

/**
 * The resolved hrefs of stimulus refs: each names a stimulus document (the UP audit's B5).
 */
const stimulusPaths = select(ReferencePath, (p) => p.eq(p.kind, "qti-assessment-stimulus-ref"));

/**
 * The documents whose root is a stimulus, the documents a stimulus ref names: a constant
 * selection, keyed by its `(package, path)`.
 */
const stimulusDocuments = select(Document, (d) => d.eq(d.rootKind, "qti-assessment-stimulus"));

/**
 * The resolved references of `href` attributes, one per element: the side Q5.13's item refs,
 * section refs, stimulus refs and includes resolve through.
 */
export const hrefPaths = select(ReferencePath, (p) => p.eq(p.name, "href"));

/**
 * Every statement over the package, its record and the manifest's overlays, each `check` named by
 * its oracle law with spaces written as underscores:
 *
 * - **the record:** the entries in listing order, one per path, and every document an entry.
 * - **the overlays:** each copies its node's {@link nodeRef} tuple, names a node of its kind and its
 *   package's `Document` row, and takes its attribute values from `Attribute` (C18); a file's and a
 *   dependency's resource is their node's parent; the manifest is one per package.
 * - **P1 `resource-type` ("ResourceTypeOf"):** a resource's (version, type) is in `ResourceTypeOf`.
 * - **P2 `root-type-reverse` ("RootOfType"):** a document's (resource type, root kind) is a row of
 *   the set `RootOfType`, or it is the manifest, of type `none` (an included fragment's type holds
 *   every kind an include stands for, spec reading 114); every document-typed resource href's path
 *   is a document of that type; and every document but the manifest is one a resource names, of the
 *   type it names.
 * - **P3 `file-listed` ("File listed"), `href-listed` ("Href listed") and `entry-kind` ("Document
 *   entry"):** every entry but the manifest is the href of a file; a resource's href's path is the
 *   href of one of its own files (reading 102); every document-typed href's path is an entry.
 * - **P4 `manifest-id-space` ("Manifest id space"):** no resource's identifier is its manifest's.
 * - **C17 ("E1 derived"):** a resource's type code is the one its lexical form spells, or `none`; an
 *   href is `path ‖ params` (reading 102); a document's path is `directory ‖ name`; a resolved
 *   reference's path is `directory ‖ target`.
 * - **`href-form` ("Href form"), a stated limit:** a file's href and a resource href's path are in
 *   the `resolvedHref` form or external; a reference's target is in the form, external, or empty;
 *   no `xml:base` scopes a file's href; and no document holds both an `xml:base` and a resolved
 *   reference.
 * - **`include-href` ("Include fragment identifier"):** an `xi:include`'s href carries no fragment
 *   identifier, wherever its `#` stands in its params (XInclude 1.0 Second Edition, §3.1: "Fragment
 *   identifiers must not be used; their appearance is a fatal error"; spec reading 115). Its query
 *   is admitted and names no other file (reading 102).
 * - **the references:** every attribute of the reference census (`ReferenceAttribute`, spec reading 103)
 *   is one {@link Reference}, copied from `Attribute` both ways; each whose target is in the form
 *   has its {@link ReferencePath} and no other has one; each document's directory is its
 *   `Document`'s path split at its last `/`.
 * - **`file-exists` ("File exists"):** a file's href in the form is an entry's path (IMS Content
 *   Packaging 1.2, InterchangePackage (b)), and so is every resolved reference's path (d, R6).
 * - **`stimulus-ref-target` ("Stimulus ref target"):** a stimulus ref's href that resolves in the
 *   package names a document whose root is a stimulus (information model §7.6: the structure
 *   "enables reference to a 'qti-assessment-stimulus' instance", its href "The uri used to refer to
 *   the stimulus file"); an external one is not resolved (reading 35's reading of an absolute
 *   URI).
 * - **a dependency names a resource:** its `identifierref` is a resource identifier of its package
 *   (IMS Content Packaging 1.2, `dependency`), the resources' identifiers distinct per package; and
 *   **`self-dependency` ("Self dependency"):** never its own resource's (§6.11.5 B ii).
 */
export const packageLaws = [
  entryFamily,
  key(on(Entry, "package", "path")),
  key(on(Document, "package", "path")),
  contained(on(Document, "package", "path"), on(Entry, "package", "path")),

  contained(
    on(ManifestId, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(ManifestId, "node"), on(nodesOf("cp:manifest"), "id")),
  contained(on(ManifestId, "document", "package"), on(Document, "node", "package")),
  key(on(manifestIdentifiers, "node")),
  contained(on(manifestIdentifiers, "node", "lexical"), on(ManifestId, "node", "identifier")),
  key(on(ManifestId, "package")),

  contained(
    on(Resource, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(Resource, "node"), on(nodesOf("cp:resource"), "id")),
  contained(on(Resource, "document", "package"), on(Document, "node", "package")),
  key(on(resourceIdentifiers, "node")),
  contained(on(resourceIdentifiers, "node", "lexical"), on(Resource, "node", "identifier")),
  key(on(resourceTypes, "node")),
  contained(on(resourceTypes, "node", "lexical"), on(Resource, "node", "typeLexical")),
  check("E1_derived", Resource, (r) =>
    r.or(r.eq(r.type, "none"), r.eq(ResourceTypeLexical.at("lexical", r.type), r.typeLexical)),
  ),
  contained(on(Resource, "version", "type"), on(ResourceTypeOf, "version", "type")),
  contained(on(Resource, "package", "manifestIdentifier"), on(ManifestId, "package", "identifier")),
  check("Manifest_id_space", Resource, (r) => r.ne(r.identifier, r.manifestIdentifier)),
  key(on(Resource, "package", "identifier")),

  key(on(resourceHrefs, "node")),
  contained(on(resourceHrefs, "node", "lexical"), on(ResourceHref, "node", "href")),
  contained(on(ResourceHref, "node", "package", "type"), on(Resource, "node", "package", "type")),
  check("E1_derived", ResourceHref, (h) =>
    h.and(h.eq(h.href, Compute.concat(h.path, h.params)), Compute.matches(h.path, hrefPathPattern)),
  ),
  check("Href_form", ResourceHref, (h) =>
    h.or(Compute.matches(h.path, resolvedHref), Compute.matches(h.path, externalHrefPattern)),
  ),
  contained(on(ResourceHref, "node", "path"), on(ResourceFile, "resource", "href")),
  namedHrefFamily,
  check("RootOfType", NamedHref, (h) => h.gt(h.names, 0n)),
  contained(
    on(documentHrefs, "package", "path", "type"),
    on(Document, "package", "path", "resourceType"),
  ),
  contained(on(documentHrefs, "package", "path"), on(Entry, "package", "path")),
  contained(
    on(
      select(Document, (d) => d.ne(d.resourceType, "none")),
      "package",
      "path",
      "resourceType",
    ),
    on(NamedHref, "package", "path", "type"),
  ),
  check("RootOfType", Document, (d) =>
    d.or(d.ne(d.resourceType, "none"), d.eq(d.path, manifestPath)),
  ),
  contained(
    on(
      select(Document, (d) => d.ne(d.resourceType, "none")),
      "resourceType",
      "rootKind",
    ),
    on(RootOfType, "type", "root"),
  ),

  contained(
    on(File, "node", "document", "kind", "start", "nearest", "version", "resource"),
    nodeRef,
  ),
  contained(on(File, "node"), on(nodesOf("cp:file"), "id")),
  contained(on(File, "resource", "package"), on(Resource, "node", "package")),
  key(on(fileHrefs, "node")),
  contained(on(fileHrefs, "node", "lexical"), on(File, "node", "href")),
  check("Href_form", File, (f) =>
    f.or(Compute.matches(f.href, resolvedHref), Compute.matches(f.href, externalHrefPattern)),
  ),
  check("Href_form", Attribute, (a) =>
    a.not(a.and(a.eq(a.name, "xml:base"), a.in(a.kind, manifestBaseKinds))),
  ),
  contained(on(inPackageFiles, "package", "href"), on(Entry, "package", "path")),
  fileHrefFamily,
  resourceFileFamily,
  check("File_listed", FileHref, (h) => h.gt(h.files, 0n)),
  check("Href_listed", ResourceFile, (h) => h.gt(h.files, 0n)),
  contained(
    on(
      select(Entry, (e) => e.ne(e.path, manifestPath)),
      "package",
      "path",
    ),
    on(FileHref, "package", "href"),
  ),

  contained(
    on(Dependency, "node", "document", "kind", "start", "nearest", "version", "resource"),
    nodeRef,
  ),
  contained(on(Dependency, "node"), on(nodesOf("cp:dependency"), "id")),
  contained(
    on(Dependency, "resource", "package", "resourceIdentifier"),
    on(Resource, "node", "package", "identifier"),
  ),
  key(on(dependencyRefs, "node")),
  contained(on(dependencyRefs, "node", "lexical"), on(Dependency, "node", "ref")),
  contained(on(Dependency, "package", "ref"), on(Resource, "package", "identifier")),
  check("Self_dependency", Dependency, (d) => d.ne(d.ref, d.resourceIdentifier)),

  contained(
    on(DocumentDirectory, "node", "package", "path"),
    on(Document, "node", "package", "path"),
  ),
  check("E1_derived", DocumentDirectory, (d) =>
    d.and(
      d.eq(d.path, Compute.concat(d.directory, d.name)),
      Compute.matches(d.name, documentNamePattern),
      d.or(d.eq(d.directory, ""), d.eq(Compute.endsWith(d.directory, "/"), true)),
    ),
  ),
  xmlBaseFamily,
  referencePathFamily,
  check("Href_form", DocumentDirectory, (d) => d.or(d.eq(d.bases, 0n), d.eq(d.references, 0n))),
  contained(on(xmlBases, "node", "document"), on(XmlBase, "node", "document")),
  contained(on(XmlBase, "node"), on(xmlBases, "node")),
  key(on(xmlBases, "node")),

  key(on(censusAttributes, "node", "name")),
  contained(
    on(censusAttributes, "node", "name", "lexical", "document", "kind"),
    on(Reference, "node", "name", "lexical", "document", "kind"),
  ),
  contained(on(Reference, "node", "name"), on(censusAttributes, "node", "name")),
  check("E1_derived", Reference, (r) =>
    r.and(
      r.eq(
        r.lexical,
        Compute.concat(Compute.concat(Compute.concat(r.lead, r.target), r.params), r.trail),
      ),
      Compute.matches(r.target, hrefPathPattern),
    ),
  ),
  check("Include_fragment_identifier", Reference, (r) =>
    r.or(r.ne(r.kind, "xi:include"), r.not(Compute.matches(r.params, "#"))),
  ),
  check("Href_form", Reference, (r) =>
    r.and(
      r.or(
        Compute.matches(r.target, dotPrefixedHrefPattern),
        Compute.matches(r.target, externalHrefPattern),
        r.eq(r.target, ""),
      ),
      r.or(r.ne(r.name, "srcset"), Compute.matches(r.lexical, srcsetCandidatePattern)),
    ),
  ),
  contained(
    on(inPackageReferences, "node", "name", "document", "kind", "target"),
    on(ReferencePath, "node", "name", "document", "kind", "target"),
  ),
  key(on(ReferencePath, "node", "name")),
  contained(
    on(ReferencePath, "node", "name", "document", "kind", "target"),
    on(Reference, "node", "name", "document", "kind", "target"),
  ),
  key(on(hrefPaths, "node")),
  contained(
    on(ReferencePath, "document", "package", "directory"),
    on(DocumentDirectory, "node", "package", "directory"),
  ),
  check("E1_derived", ReferencePath, (p) =>
    p.and(
      p.eq(p.target, Compute.concat(p.ups, p.rest)),
      p.eq(p.directory, Compute.concat(p.kept, p.removed)),
      p.eq(p.path, Compute.concat(p.kept, p.rest)),
      p.eq(p.at, 0n),
    ),
  ),
  check("Href_form", ReferencePath, (p) =>
    p.and(
      Compute.matches(p.rest, resolvedHref),
      Compute.matches(p.ups, DotSegments.at("ups", p.climb)),
      Compute.matches(p.removed, DotSegments.at("removed", p.climb)),
    ),
  ),
  contained(on(ReferencePath, "package", "path"), on(Entry, "package", "path")),
  key(on(stimulusDocuments, "package", "path")),
  contained(on(stimulusPaths, "package", "path"), on(stimulusDocuments, "package", "path")),
] as const;
