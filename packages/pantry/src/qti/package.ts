/**
 * The package and its record, and the manifest's overlays (plan §1.6; the W5 amendment's C17 and
 * C18; the orchestrator's rulings of 2026-11-06 and spec reading 93).
 *
 * {@link Package} owns its {@link Entry} rows, an ordered family in listing order: every entry's
 * bytes as read, the record the model is rebuildable from. The manifest's elements that a law reads
 * across rows have overlays, each a flat row keyed by its element's node: {@link ManifestId}
 * (`cp:manifest`), {@link Resource} and its optional {@link ResourceId} and {@link ResourceHref}
 * (`cp:resource`), {@link File} (`cp:file`) and {@link Dependency} (`cp:dependency`). Each copies
 * its node's {@link nodeRef} tuple, names a node of its own kind, and takes each attribute value it
 * compares from `Attribute` (C18), with the key over that attribute's selection that keeps its
 * lexical form out of every index (the tier-1 addendum's "Text in keys"). An identifier that may be
 * unwritten is a row of its own, or none (AGENTS.md, Schema intent): a `cp:manifest` that writes no
 * `identifier` has no {@link ManifestId}, and a `cp:resource` none no {@link ResourceId}, so AL3
 * refuses the element alone and no law compares an identifier it does not have.
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
 * §6.6.2), and a reference may carry a media fragment.
 *
 * The importer resolves every href before it writes a row (readings 102 and 103,
 * `#pantry/import/overlays/package.ts` `resolveIn`): it reads the value by its attribute's
 * whitespace class, merges the path with its base, the document's own path or the `xml:base` in
 * scope, removes its dot segments and percent-decodes it (RFC 3986, §2.1 and §5.2). Each row holds
 * the outcome as its {@link HrefScope} and, in the package, the entry path it names, which the laws
 * compare with `Entry`. No relation can percent-decode a name, so the resolution is the importer's,
 * and the law oracle's own resolver (`#pantry/test/resolution.ts`) is its differential; the
 * database proves what a row can: a resolved path holds no dot segment
 * ({@link resolvedPathPattern}), and a reference with a scheme or a leading `/` is external.
 *
 * Every in-package file a manifest or a document names is an entry (IMS Content Packaging 1.2,
 * InterchangePackage (b) and (d)): a `cp:file`'s resolved path (`file-exists`), and each
 * {@link ReferencePath}, a reference of a document resolved in the package. A dependency never
 * names its own resource (IMS Content Packaging 1.2, §6.11.5 B ii).
 *
 * @see {@link https://www.imsglobal.org/content/packaging/ | IMS Content Packaging 1.2}
 */
import {
  bytes,
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
  RootOfType,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { Document, EntryPath } from "#pantry/qti/chardata.ts";
import { anyText, keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * The path of a package's manifest, the one entry no `cp:file` need list and the one document that
 * is no resource's (spec reading 146).
 */
export const manifestPath = "imsmanifest.xml";

/**
 * A package: its id, its name, and its count of entries, which the family draws. Its name is the
 * last segment of the directory or zip file it was read from, as the importer writes it
 * (`#pantry/import/record.ts` `packageNameOf`), any text: no law and no export reads it, and no key
 * holds it, so it carries no shape and no bound.
 */
export const Package = relation("Package", { entries: drawn(natural), id: uuid, name: anyText }, [
  "id",
]);

/**
 * One entry of a package, the record (plan §1.6, fin.md P7): its path and its bytes, at its slot in
 * the listing, which the family draws from its place in the nesting.
 *
 * `content` is the entry's bytes as read, a grizzle `bytes` field: PostgreSQL's bytea, written in
 * binary and read back whole, at most grizzle's `bytesMaxLength` bytes, which its column's CHECK
 * holds. No law reads it. Whether it is the manifest is a function of `path`, and its byte length
 * one of `content`, so neither is stored (review R19).
 */
export const Entry = relation(
  "Entry",
  { at: drawn(natural), content: bytes, package: uuid, path: EntryPath },
  ["package", "at"],
);

/**
 * A package's entries in listing order, nested at `Package.entries`.
 */
export const entryFamily = ordered(on(Entry, "package", "at"), fin(Package, "entries"));

/**
 * The manifest's identifier, keyed by the `cp:manifest` node, where the manifest writes one: its
 * {@link nodeRef} tuple, its package, and its `identifier`'s lexical form, which
 * {@link ManifestIdSpace} holds beside the resources' identifiers.
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
 * A resource's overlay, keyed by the `cp:resource` node: its {@link nodeRef} tuple, its package and
 * its `type`'s lexical form. Its identifier is its optional part {@link ResourceId}, and the code
 * its `type` spells {@link ResourceTyped}.
 *
 * `typeLexical` is empty where the resource writes no `type`, which AL3 refuses: it is copied onto
 * {@link ResourceHref}, so a typed resource's href is required to have its {@link TypedHref}
 * without a join of the two optional parts, which no grizzle law states (README, Limits: no outer
 * joins). The empty form spells no handle, as a written form that spells none, so no law reads it
 * as a type.
 */
export const Resource = relation(
  "Resource",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    package: uuid,
    parent: uuid,
    start: natural,
    typeLexical: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A resource's identifier, keyed by the `cp:resource` node, where the resource writes one: its
 * package and its `identifier`'s lexical form, which the package's resources hold once each
 * ("DocumentId key") and a dependency's `identifierref` names ("Dependency target").
 */
export const ResourceId = relation(
  "ResourceId",
  { identifier: keyText, node: uuid, package: uuid },
  ["node"],
);

/**
 * The identifiers of a package's manifest and its resources, one `xs:ID` space (IMS Content
 * Packaging 1.2), a projection keyed by its heading: one row per identifier and kind of element
 * that writes it, `cp:manifest` ({@link ManifestId}) or `cp:resource` ({@link ResourceId}). Two
 * resources of one identifier are one row, which "DocumentId key" refuses over {@link ResourceId};
 * a resource of the manifest's identifier is a second row of its (package, identifier), which
 * "Manifest id space" refuses. A side that writes no identifier has no row, so it is compared
 * with nothing.
 *
 * Its kind is `cp:manifest` or `cp:resource` by its containments and its key alone, with no check:
 * every check is named by an oracle law, and these rows are "Manifest overlay"'s, a law the law
 * oracle does not state (`hostlessLaws`). A row that is not the manifest's names a
 * {@link ResourceId}'s (package, identifier), that resource's own `cp:resource` row is in the space,
 * and the key over (package, identifier) leaves that row alone of its pair, so the row is it.
 */
export const ManifestIdSpace = relation(
  "ManifestIdSpace",
  { identifier: keyText, kind: closedId(NodeKind), package: uuid },
  ["package", "identifier", "kind"],
);

/**
 * A resource's type, keyed by the `cp:resource` node, where its `type` spells a `ResourceType`
 * handle (C17): its package, its lexical form, Resource's, and the code. A resource whose `type`
 * spells none has no row here and names no type anywhere, so AL1's value domain refuses its `type`
 * alone (spec reading 67), and no law reads a type it does not have.
 */
export const ResourceTyped = relation(
  "ResourceTyped",
  {
    node: uuid,
    package: uuid,
    type: closedId(ResourceType),
    typeLexical: keyText,
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
 * compares but "Include fragment identifier", written beside the reference's target it follows so
 * the pieces concatenate to the lexical form.
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
 * A `srcset` this representation reads: one image candidate, its URL alone between any outer
 * whitespace, so it holds no comma and no inner whitespace, and the importer resolves it as one
 * URL. The HTML Standard's `srcset` is a comma-separated list of candidates, each a URL and an
 * optional width or density descriptor after whitespace; reading each candidate at its index needs
 * that standard's parsing algorithm, which this representation does not state, so a `srcset` of
 * several candidates or with a descriptor is refused under "Href form", a stated limit (the
 * corpus's four `srcset` values are each one URL with no descriptor).
 *
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#srcset-attributes | HTML, srcset}
 */
export const srcsetCandidatePattern = "^[\\t\\n\\r ]*[^,\\t\\n\\r ]*[\\t\\n\\r ]*$";

/**
 * How an href resolves (readings 102 and 103), the outcome the importer writes on every href's row:
 *
 * - `entry`: a path in the package, which names the entry the row holds as its `path`;
 * - `external`: a location outside the package, admitted and never resolved: a URI with a scheme
 *   (reading 35), a network or absolute path (a leading `/`, reading 102), a path whose `..`
 *   segments climb above the package root, and any relative href in the scope of an `xml:base` that
 *   is one of those;
 * - `document`: its own document, admitted and never resolved: a path that is empty, as the empty
 *   reference, a query alone and a fragment alone have (RFC 3986, §4.4, a same-document reference,
 *   whose dereference "should not result in a new retrieval action");
 * - `unresolved`: a path this representation reads no name from, refused under the stated limit "Href
 *   form" (`#pantry/import/overlays/package.ts` `Limit`).
 */
export const HrefScope = closed("HrefScope", ["entry", "external", "document", "unresolved"]);

/**
 * The form of a path the importer resolved in the package (RFC 3986, §5.2.4, after which no dot
 * segment remains): `/`-separated segments, the first nonempty, none `.` or `..`, any other
 * character allowed, since a decoded name may hold `?`, `#`, `%`, `:` or a space. A path that ends
 * with `/` names a directory, and the empty path the package root, which no entry is.
 */
export const resolvedPathPattern =
  "^(?:(?:[^/.][^/]*|\\.[^./][^/]*|\\.\\.[^/]+)(?:/(?:[^/.][^/]*|\\.[^./][^/]*|\\.\\.[^/]+)?)*)?$";

/**
 * A resource's `href`, keyed by the resource's node: an optional attribute is a row of its own. It
 * carries its resource's package and its `type`'s lexical form, which decides whether it has a
 * {@link TypedHref}; its {@link HrefScope}; and `path`, what it is compared by: the entry path it
 * resolves to in the package, and otherwise its path as written, its launch parameters aside (CP
 * 1.2 §6.6.2, reading 102), which is how an external href is compared with its resource's files.
 */
export const ResourceHref = relation(
  "ResourceHref",
  {
    href: keyText,
    node: uuid,
    package: uuid,
    path: keyText,
    scope: closedId(HrefScope),
    typeLexical: keyText,
  },
  ["node"],
);

/**
 * The href of a resource that has a type, keyed by the resource's node: its {@link ResourceHref}'s
 * package, path and scope, and its {@link ResourceTyped}'s code, so a document-typed resource's href
 * is judged as the document it names. A resource with an href whose `type` spells nothing names no
 * (path, type) pair.
 */
export const TypedHref = relation(
  "TypedHref",
  {
    node: uuid,
    package: uuid,
    path: keyText,
    scope: closedId(HrefScope),
    type: closedId(ResourceType),
  },
  ["node"],
);

/**
 * The (path, type) pairs a package's typed resources name, a projection keyed by its heading: one
 * row per pair, its `names` the resources whose href's path it is ({@link TypedHref}).
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
 * node's parent, its resource's package, its `href`'s lexical form, its {@link HrefScope}, and
 * `path`, what it is compared by as {@link ResourceHref}'s is: the entry path it resolves to in
 * the package, and otherwise its path as written.
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
    path: keyText,
    resource: uuid,
    scope: closedId(HrefScope),
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The paths a package's files name, a projection keyed by its heading, the scope beside the path
 * so a written external path never stands for an entry's: its `files` the files that name it.
 */
export const FileHref = relation(
  "FileHref",
  { files: drawn(natural), package: uuid, path: keyText, scope: closedId(HrefScope) },
  ["package", "scope", "path"],
);

/**
 * The paths each resource's files name, a projection keyed by its heading: its `files` the files of
 * the resource that name it.
 */
export const ResourceFile = relation(
  "ResourceFile",
  { files: drawn(natural), path: keyText, resource: uuid, scope: closedId(HrefScope) },
  ["resource", "scope", "path"],
);

/**
 * A dependency's overlay, keyed by the `cp:dependency` node: its {@link nodeRef} tuple, its
 * `resource` the node's parent, its resource's package, and its `identifierref`'s lexical form,
 * which names a resource of its package through its {@link DependencyTarget}.
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
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The resource a dependency names, keyed by the `cp:dependency` node: its {@link Dependency}'s
 * package, `identifierref` and own resource, and `target`, the resource whose identifier its
 * `identifierref` is ({@link ResourceId}), its own where its own is one. A dependency whose
 * `identifierref` names no resource has no row, which "Dependency target" refuses; one that names
 * its own resource is refused by "Self dependency" (IMS Content Packaging 1.2, §6.11.5 B ii), so a
 * resource that writes no identifier is named by none.
 */
export const DependencyTarget = relation(
  "DependencyTarget",
  { node: uuid, package: uuid, ref: keyText, resource: uuid, target: uuid },
  ["node"],
);

/**
 * A reference attribute's value, keyed by its element and its attribute's name: every attribute of
 * the reference census (`ReferenceAttribute`, the grammar's, spec reading 103), its lexical form
 * and its element's document and kind copied from `Attribute` (C18), and its split, which
 * `E1_derived` proves: `lexical = lead ‖ target ‖ params ‖ trail`, its outer whitespace, which a
 * URL "potentially surrounded by spaces" and an `xs:anyURI` both set aside, then its path and its
 * query or fragment (reading 102). `params` is what "Include fragment identifier" reads.
 *
 * Its {@link HrefScope} is the importer's resolution of its value (readings 102 and 103): a
 * reference in the package has its {@link ReferencePath}, and no other reference has one.
 * `E1_derived` holds what the written form decides: a target with a scheme or a leading `/` is
 * external, and only an empty target names its own document.
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
    scope: closedId(HrefScope),
    target: keyText,
    trail: Space,
  },
  ["node", "name"],
);

/**
 * A reference resolved in the package, keyed by its element and its attribute's name: its
 * {@link Reference}'s document and element kind, its document's package, and `path`, the entry
 * path the importer resolved it to (RFC 3986, §5.2 and §2.1; readings 102 and 103).
 *
 * Every in-package file a document references is an entry (`file-exists`, IMS Content Packaging
 * 1.2, InterchangePackage (d)), and a law that reads what a reference names (an item ref's item,
 * Q5.13's) reads it here. `path` is `keyText`: it rides the containment into `Entry`.
 */
export const ReferencePath = relation(
  "ReferencePath",
  {
    document: uuid,
    kind: closedId(NodeKind),
    name: closedId(AttributeName),
    node: uuid,
    package: uuid,
    path: keyText,
  },
  ["node", "name"],
);

/**
 * An element's text as a reference to a file, keyed by its element: every element of a kind of
 * `textReferenceKinds` (spec reading R9-b), its string value, `Node.stringValue`, and its document
 * and kind copied from `Node` (C18), and the split of its string value, which `E1_derived` proves
 * as it does a {@link Reference}'s: `lexical = lead ‖ target ‖ params ‖ trail` (reading 102). The
 * census names elements, not attributes, so no attribute name keys it, and no `srcset` form
 * applies.
 *
 * Its {@link HrefScope} is the importer's resolution of its text (readings 102 and 103): a text
 * reference in the package has its {@link TextReferencePath}, and no other has one.
 */
export const TextReference = relation(
  "TextReference",
  {
    document: uuid,
    kind: closedId(NodeKind),
    lead: Space,
    lexical: keyText,
    node: uuid,
    params: HrefParams,
    scope: closedId(HrefScope),
    target: keyText,
    trail: Space,
  },
  ["node"],
);

/**
 * A text reference resolved in the package, keyed by its element: its {@link TextReference}'s
 * document and element kind, its document's package, and `path`, the entry path the importer
 * resolved it to (RFC 3986, §5.2 and §2.1; readings 102 and 103), which rides the containment into
 * `Entry` as a {@link ReferencePath}'s does.
 */
export const TextReferencePath = relation(
  "TextReferencePath",
  {
    document: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    package: uuid,
    path: keyText,
  },
  ["node"],
);

/**
 * The paths a package's files name, counted per (scope, path): each file names its owner by
 * `(package, scope, path)`.
 */
export const fileHrefFamily = counted(on(File, "package", "scope", "path"), fin(FileHref, "files"));

/**
 * The paths each resource's files name, counted per (resource, scope, path).
 */
export const resourceFileFamily = counted(
  on(File, "resource", "scope", "path"),
  fin(ResourceFile, "files"),
);

/**
 * The (path, type) pairs a package's typed resources name, counted per pair.
 */
export const namedHrefFamily = counted(
  on(TypedHref, "package", "path", "type"),
  fin(NamedHref, "names"),
);

/**
 * Select the attributes of one name on elements of one kind in the package's manifest: the source
 * of an overlay's copy (C18). The manifest is the package's one `imsmanifest.xml` (IMS Content
 * Packaging 1.2), the one document of type `none` (`RootOfType`'s check), and a content packaging
 * element of another document describes no part of the package (170356bd's ruling), so its
 * attributes are no overlay's source.
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
) =>
  select(Attribute, (a) =>
    a.and(a.eq(a.name, name), a.eq(a.kind, kind), a.eq(a.documentType, "none")),
  );

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
const documentHrefs = select(TypedHref, (h) => h.in(h.type, documentTypes));

/**
 * A pattern holding exactly the lexical forms of a resource's `type` that spell a `ResourceType`
 * handle (`ResourceTypeLexical`'s, every handle but `none`), each as written, since the attribute's
 * type is an `xs:string` enumeration, whose whitespace is preserved (XSD 1.1 Part 2, §4.3.6).
 */
const spelledResourceTypes = `^(?:${ResourceTypeLexical.rows
  .map(({ lexical }) => lexical.replaceAll(/[$()*+.?[\\\]^{|}]/gu, "\\$&"))
  .join("|")})$`;

/**
 * The resources whose `type` spells a handle: each has its {@link ResourceTyped}.
 */
const typedResources = select(Resource, (r) =>
  Compute.matches(r.typeLexical, spelledResourceTypes),
);

/**
 * The manifests' identifiers in their package's identifier space.
 */
const manifestIdSpaces = select(ManifestIdSpace, (m) => m.eq(m.kind, "cp:manifest"));

/**
 * The resources' identifiers in their package's identifier space.
 */
const resourceIdSpaces = select(ManifestIdSpace, (m) => m.eq(m.kind, "cp:resource"));

/**
 * The identifiers in their package's identifier space that are not its manifest's: each is a
 * resource's, so the space holds the manifest's and the resources' alone ({@link ManifestIdSpace}).
 */
const nonManifestIdSpaces = select(ManifestIdSpace, (m) => m.ne(m.kind, "cp:manifest"));

/**
 * The hrefs of the resources whose `type` spells a handle: each has its {@link TypedHref}.
 */
const typedResourceHrefs = select(ResourceHref, (h) =>
  Compute.matches(h.typeLexical, spelledResourceTypes),
);

/**
 * The files the importer resolved in the package: each names an entry (`file-exists`). An external
 * href is left out (reading 35), and so is one that names its own document, the manifest.
 */
const entryFiles = select(File, (f) => f.eq(f.scope, "entry"));

/**
 * The paths a package's files name in the package, a constant selection keyed by its
 * `(package, path)`: every entry but the manifest is one of them (`file-listed`).
 */
const entryFileHrefs = select(FileHref, (h) => h.eq(h.scope, "entry"));

/**
 * The entries a `cp:file` lists: every one but the manifest.
 */
const listedEntries = select(Entry, (e) => e.ne(e.path, manifestPath));

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
 * The references the importer resolved in the package, a constant selection keyed by its
 * `(node, name)`: each has its {@link ReferencePath}, and every {@link ReferencePath} is one's.
 */
const entryReferences = select(Reference, (r) => r.eq(r.scope, "entry"));

/**
 * The elements of the text census (`textReferenceKinds`, spec reading R9-b): each a
 * {@link TextReference}'s copy (C18). The key over its `id`, true since `Node` is keyed by it,
 * serves the copy's reverse probe, so no index holds the string value.
 */
const textReferenceNodes = select(Node, (n) =>
  n.in(
    n.kind,
    NodeKind.handles.filter((handle) => textReferenceKinds.some(({ kind }) => kind === handle)),
  ),
);

/**
 * The text references the importer resolved in the package, a constant selection keyed by its
 * `node`: each has its {@link TextReferencePath}, and every {@link TextReferencePath} is one's.
 */
const entryTextReferences = select(TextReference, (r) => r.eq(r.scope, "entry"));

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
 * - **P1 (spec reading 67):** a resource's type is one its version's content-packaging XSD
 *   enumerates, which the attribute's value domain states (`attribute-lexical`), and nothing here.
 * - **P2 `root-type-reverse` ("RootOfType"):** a document's (resource type, root kind) is a row of
 *   the set `RootOfType`, or it is the manifest, of type `none` (an included fragment's type holds
 *   every kind an include stands for, spec reading 114); and every document but the manifest is one
 *   a resource names, of the type it names.
 * - **P3 `file-listed` ("File listed"), `href-listed` ("Href listed") and `entry-kind` ("Document
 *   entry"):** every entry but the manifest is the resolved path of a file; a resource's href names
 *   the file one of its own files names, compared by resolved path in the package and as written
 *   outside it (reading 102); every document-typed href resolves in the package, to an entry, and
 *   names the one document there, of the href's type (reading 93), so a path with no entry, or one
 *   listed under two document types, is refused here and never under `root-type-reverse`.
 * - **P4 `manifest-id-space` ("Manifest id space"):** no resource's identifier is its manifest's: the
 *   two are one (package, identifier) of {@link ManifestIdSpace}, each side's rows exactly its
 *   written identifiers, and every row but the manifest's a resource's.
 * - **C17 ("E1 derived"):** a resource's type code is the one its lexical form spells, or `none`; a
 *   path resolved in the package holds no dot segment ({@link resolvedPathPattern}); a reference is
 *   its written pieces, external where its target has a scheme or a leading `/`, and its own
 *   document's only where its target is empty.
 * - **`href-form` ("Href form"), a stated limit:** no href is one the importer reads no name from
 *   (`unresolved`), and a `srcset` is one candidate, its URL alone.
 * - **`include-href` ("Include fragment identifier"):** an `xi:include`'s href carries no fragment
 *   identifier, wherever its `#` stands in its params (XInclude 1.0 Second Edition, §3.1: "Fragment
 *   identifiers must not be used; their appearance is a fatal error"; spec reading 115). Its query
 *   is admitted and names no other file (reading 102).
 * - **the references:** every attribute of the reference census (`ReferenceAttribute`, spec reading 103)
 *   is one {@link Reference}, copied from `Attribute` both ways; each resolved in the package has
 *   its {@link ReferencePath} and no other has one. Every element of the text census
 *   (`textReferenceKinds`, spec reading R9-b) is one {@link TextReference}, copied from `Node` both
 *   ways, with its {@link TextReferencePath} the same way.
 * - **`file-exists` ("File exists"):** a file's path resolved in the package is an entry's path (IMS
 *   Content Packaging 1.2, InterchangePackage (b)), and so is every resolved reference's path, an
 *   attribute's and a text's (d, R6).
 * - **`stimulus-ref-target` ("Stimulus ref target"):** a stimulus ref's href that resolves in the
 *   package names a document whose root is a stimulus (information model §7.6: the structure
 *   "enables reference to a 'qti-assessment-stimulus' instance", its href "The uri used to refer to
 *   the stimulus file"); an external one is not resolved (reading 35's reading of an absolute
 *   URI).
 * - **a dependency names a resource:** its `identifierref` is a resource identifier of its package
 *   (IMS Content Packaging 1.2, `dependency`), the resources' identifiers distinct per package, so
 *   it has its {@link DependencyTarget}; and **`self-dependency` ("Self dependency"):** the target
 *   is never its own resource (§6.11.5 B ii).
 */
export const packageLawsByName = {
  "Dependency target": [contained(on(Dependency, "node"), on(DependencyTarget, "node"))],
  "Document entry": [
    key(on(Document, "package", "path")),
    contained(on(Document, "package", "path"), on(Entry, "package", "path")),
    check("Document_entry", TypedHref, (h) =>
      h.or(h.not(h.in(h.type, documentTypes)), h.eq(h.scope, "entry")),
    ),
    contained(on(documentHrefs, "package", "path"), on(Entry, "package", "path")),
    contained(
      on(documentHrefs, "package", "path", "type"),
      on(Document, "package", "path", "resourceType"),
    ),
    key(on(stimulusDocuments, "package", "path")),
  ],
  "DocumentId key": [
    key(on(manifestIdentifiers, "node")),
    key(on(resourceIdentifiers, "node")),
    key(on(resourceTypes, "node")),
    key(on(ResourceId, "package", "identifier")),
    key(on(resourceHrefs, "node")),
    key(on(fileHrefs, "node")),
    key(on(dependencyRefs, "node")),
  ],
  "E1 derived": [
    check("E1_derived", ResourceTyped, (r) =>
      r.eq(ResourceTypeLexical.at("lexical", r.type), r.typeLexical),
    ),
    contained(on(typedResources, "node"), on(ResourceTyped, "node")),
    contained(
      on(ResourceTyped, "node", "package", "typeLexical"),
      on(Resource, "node", "package", "typeLexical"),
    ),
    contained(on(typedResourceHrefs, "node"), on(TypedHref, "node")),
    contained(
      on(TypedHref, "node", "package", "path", "scope"),
      on(ResourceHref, "node", "package", "path", "scope"),
    ),
    contained(
      on(TypedHref, "node", "package", "type"),
      on(ResourceTyped, "node", "package", "type"),
    ),
    check("E1_derived", ResourceHref, (h) =>
      h.or(h.ne(h.scope, "entry"), Compute.matches(h.path, resolvedPathPattern)),
    ),
    check("E1_derived", File, (f) =>
      f.or(f.ne(f.scope, "entry"), Compute.matches(f.path, resolvedPathPattern)),
    ),
    key(on(censusAttributes, "node", "name")),
    check("E1_derived", Reference, (r) =>
      r.and(
        r.eq(
          r.lexical,
          Compute.concat(
            Compute.concat(
              Compute.concat(Compute.base(r.lead), Compute.base(r.target)),
              Compute.base(r.params),
            ),
            Compute.base(r.trail),
          ),
        ),
        Compute.matches(r.target, hrefPathPattern),
        r.or(r.not(Compute.matches(r.target, externalHrefPattern)), r.eq(r.scope, "external")),
        r.or(r.ne(r.scope, "document"), r.eq(r.target, "")),
      ),
    ),
    check("E1_derived", ReferencePath, (p) => Compute.matches(p.path, resolvedPathPattern)),
    check("E1_derived", TextReference, (r) =>
      r.and(
        r.eq(
          r.lexical,
          Compute.concat(
            Compute.concat(
              Compute.concat(Compute.base(r.lead), Compute.base(r.target)),
              Compute.base(r.params),
            ),
            Compute.base(r.trail),
          ),
        ),
        Compute.matches(r.target, hrefPathPattern),
        r.or(r.not(Compute.matches(r.target, externalHrefPattern)), r.eq(r.scope, "external")),
        r.or(r.ne(r.scope, "document"), r.eq(r.target, "")),
      ),
    ),
    check("E1_derived", TextReferencePath, (p) => Compute.matches(p.path, resolvedPathPattern)),
  ],
  "Entry family": [entryFamily, key(on(Entry, "package", "path"))],
  "File exists": [
    contained(on(entryFiles, "package", "path"), on(Entry, "package", "path")),
    contained(on(ReferencePath, "package", "path"), on(Entry, "package", "path")),
    contained(on(TextReferencePath, "package", "path"), on(Entry, "package", "path")),
  ],
  "File listed": [
    fileHrefFamily,
    check("File_listed", FileHref, (h) => h.gt(h.files, 0n)),
    key(on(entryFileHrefs, "package", "path")),
    contained(on(listedEntries, "package", "path"), on(entryFileHrefs, "package", "path")),
  ],
  "Href form": [
    check("Href_form", ResourceHref, (h) => h.ne(h.scope, "unresolved")),
    check("Href_form", File, (f) => f.ne(f.scope, "unresolved")),
    check("Href_form", Reference, (r) =>
      r.and(
        r.ne(r.scope, "unresolved"),
        r.or(r.ne(r.name, "srcset"), Compute.matches(r.lexical, srcsetCandidatePattern)),
      ),
    ),
    check("Href_form", TextReference, (r) => r.ne(r.scope, "unresolved")),
  ],
  "Href listed": [
    contained(
      on(ResourceHref, "node", "scope", "path"),
      on(ResourceFile, "resource", "scope", "path"),
    ),
    resourceFileFamily,
    check("Href_listed", ResourceFile, (h) => h.gt(h.files, 0n)),
  ],
  "Include fragment identifier": [
    check("Include_fragment_identifier", Reference, (r) =>
      r.or(r.ne(r.kind, "xi:include"), r.not(Compute.matches(r.params, "#"))),
    ),
  ],
  "Manifest id space": [key(on(ManifestIdSpace, "package", "identifier"))],
  "Manifest overlay": [
    contained(
      on(ManifestId, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(ManifestId, "node"), on(nodesOf("cp:manifest"), "id")),
    contained(on(ManifestId, "document", "package"), on(Document, "node", "package")),
    contained(on(manifestIdentifiers, "node", "lexical"), on(ManifestId, "node", "identifier")),
    contained(on(ManifestId, "node"), on(manifestIdentifiers, "node")),
    key(on(ManifestId, "package")),
    contained(
      on(ManifestId, "package", "identifier"),
      on(manifestIdSpaces, "package", "identifier"),
    ),
    contained(
      on(manifestIdSpaces, "package", "identifier"),
      on(ManifestId, "package", "identifier"),
    ),
    contained(
      on(Resource, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(Resource, "node"), on(nodesOf("cp:resource"), "id")),
    contained(on(Resource, "document", "package"), on(Document, "node", "package")),
    contained(on(resourceIdentifiers, "node", "lexical"), on(ResourceId, "node", "identifier")),
    contained(on(ResourceId, "node"), on(resourceIdentifiers, "node")),
    contained(on(ResourceId, "node", "package"), on(Resource, "node", "package")),
    contained(
      on(ResourceId, "package", "identifier"),
      on(resourceIdSpaces, "package", "identifier"),
    ),
    contained(
      on(nonManifestIdSpaces, "package", "identifier"),
      on(ResourceId, "package", "identifier"),
    ),
    contained(on(resourceTypes, "node", "lexical"), on(Resource, "node", "typeLexical")),
    contained(on(resourceHrefs, "node", "lexical"), on(ResourceHref, "node", "href")),
    contained(
      on(ResourceHref, "node", "package", "typeLexical"),
      on(Resource, "node", "package", "typeLexical"),
    ),
    contained(
      on(File, "node", "document", "kind", "start", "nearest", "version", "resource"),
      nodeRef,
    ),
    contained(on(File, "node"), on(nodesOf("cp:file"), "id")),
    contained(on(File, "resource", "package"), on(Resource, "node", "package")),
    contained(on(fileHrefs, "node", "lexical"), on(File, "node", "href")),
    contained(
      on(Dependency, "node", "document", "kind", "start", "nearest", "version", "resource"),
      nodeRef,
    ),
    contained(on(Dependency, "node"), on(nodesOf("cp:dependency"), "id")),
    contained(on(Dependency, "resource", "package"), on(Resource, "node", "package")),
    contained(on(dependencyRefs, "node", "lexical"), on(Dependency, "node", "ref")),
    contained(
      on(DependencyTarget, "node", "package", "ref", "resource"),
      on(Dependency, "node", "package", "ref", "resource"),
    ),
    contained(
      on(DependencyTarget, "package", "ref", "target"),
      on(ResourceId, "package", "identifier", "node"),
    ),
  ],
  "Node key": [key(on(textReferenceNodes, "id"))],
  "Reference overlay": [
    contained(
      on(censusAttributes, "node", "name", "lexical", "document", "kind"),
      on(Reference, "node", "name", "lexical", "document", "kind"),
    ),
    contained(on(Reference, "node", "name"), on(censusAttributes, "node", "name")),
    key(on(entryReferences, "node", "name")),
    contained(
      on(entryReferences, "node", "name", "document", "kind"),
      on(ReferencePath, "node", "name", "document", "kind"),
    ),
    contained(
      on(ReferencePath, "node", "name", "document", "kind"),
      on(entryReferences, "node", "name", "document", "kind"),
    ),
    key(on(hrefPaths, "node")),
    contained(on(ReferencePath, "document", "package"), on(Document, "node", "package")),
    contained(
      on(textReferenceNodes, "id", "document", "kind", "stringValue"),
      on(TextReference, "node", "document", "kind", "lexical"),
    ),
    contained(on(TextReference, "node"), on(textReferenceNodes, "id")),
    key(on(entryTextReferences, "node")),
    contained(
      on(entryTextReferences, "node", "document", "kind"),
      on(TextReferencePath, "node", "document", "kind"),
    ),
    contained(
      on(TextReferencePath, "node", "document", "kind"),
      on(entryTextReferences, "node", "document", "kind"),
    ),
    contained(on(TextReferencePath, "document", "package"), on(Document, "node", "package")),
  ],
  RootOfType: [
    namedHrefFamily,
    check("RootOfType", NamedHref, (h) => h.gt(h.names, 0n)),
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
  ],
  "Self dependency": [
    check("Self_dependency", DependencyTarget, (d) => d.ne(d.target, d.resource)),
  ],
  "Stimulus ref target": [
    contained(on(stimulusPaths, "package", "path"), on(stimulusDocuments, "package", "path")),
  ],
} as const;

/**
 * {@link packageLawsByName}'s statements in one list, the module's laws as the schema composes them.
 */
export const packageLaws = Object.values(packageLawsByName).flat();
