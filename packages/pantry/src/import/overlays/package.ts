/**
 * The manifest's overlay rows (plan §1.6, §C's `rowsOf`): from a manifest's XDM tree and the ids
 * its nodes are written under, the rows of every overlay `#pantry/qti/package.ts` declares, each
 * relation's rows a keyed set.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its node's tuple as
 * the tree's own rows give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form
 * as written, and each resource's type as the `ResourceType` handle its lexical form spells. The
 * database proves every one of them (`packageLaws`), so a row this builder gets wrong is refused,
 * never accepted.
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { documentTypes, grammar, interactionKinds, ResourceType } from "#pantry/grammar/install.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { DotDepth, dotDepthMax, dotPrefixedHrefPattern } from "#pantry/qti/package.ts";
import type {
  Dependency,
  DocumentDirectory,
  File,
  FileHref,
  ManifestId,
  NamedHref,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
  XmlBase,
} from "#pantry/qti/package.ts";

/**
 * The ids a manifest's rows are written under: its package's, and each of its tree's nodes', drawn
 * by the number `flatten` gives the node, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface ManifestIds {
  readonly idOf: (index: number) => NodeId;
  readonly package: Uuid;
}

/**
 * The manifest's overlay rows, one keyed set per relation: each map from the text of a row's key
 * to the row as its writer writes it. A node-keyed overlay's key text is its node's id; a
 * projection's is its heading's values in key order, as a JSON array.
 */
export interface PackageRows {
  readonly Dependency: ReadonlyMap<string, Addition<typeof Dependency>>;
  readonly File: ReadonlyMap<string, Addition<typeof File>>;
  readonly FileHref: ReadonlyMap<string, Addition<typeof FileHref>>;
  readonly ManifestId: ReadonlyMap<string, Addition<typeof ManifestId>>;
  readonly NamedHref: ReadonlyMap<string, Addition<typeof NamedHref>>;
  readonly Resource: ReadonlyMap<string, Addition<typeof Resource>>;
  readonly ResourceFile: ReadonlyMap<string, Addition<typeof ResourceFile>>;
  readonly ResourceHref: ReadonlyMap<string, Addition<typeof ResourceHref>>;
}

/**
 * The `ResourceType` handle a `cp:resource`'s `type` names: every handle but the null object is
 * spelled exactly as its lexical form (C17).
 */
type ResourceTypeHandle = Addition<typeof Resource>["type"];

/**
 * The `ResourceType` handles a lexical form can spell: every one but the null object `none`, which
 * no lexical form writes (`ResourceTypeLexical` holds no row for it).
 */
const spelledTypes: ReadonlyMap<string, ResourceTypeHandle> = new Map(
  ResourceType.handles.flatMap((handle) => (handle === "none" ? [] : [[handle, handle] as const])),
);

/**
 * The resource types a resource names a document of, `RootOfType`'s key set.
 */
const documentTyped: ReadonlySet<string> = new Set(documentTypes);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * Read the code of a resource's `type` from its lexical form.
 *
 * @param lexical - The `type` attribute's lexical form, as written.
 * @returns The handle it spells, or `none` for a form no handle spells, which `ResourceTypeOf`
 *   refuses as `resource-type`.
 */
const typeOf = (lexical: string): ResourceTypeHandle => spelledTypes.get(lexical) ?? "none";

/**
 * An href's `params` piece, as `ResourceHref` and `Reference` type it: empty, or from a `?` or `#`.
 */
type Params = Addition<typeof ResourceHref>["params"];

/**
 * XML whitespace, as `Reference` types its `lead` and `trail`.
 */
type Whitespace = Addition<typeof Reference>["lead"];

/**
 * State that a text is an href's `params` piece.
 *
 * @param text - The text.
 * @returns Whether it is empty or starts with `?` or `#`.
 */
const isParams = (text: string): text is Params =>
  text === "" || text.startsWith("?") || text.startsWith("#");

/**
 * State that a text is XML whitespace, possibly none.
 *
 * @param text - The text.
 * @returns Whether every character is a tab, a line feed, a carriage return or a space.
 */
const isWhitespace = (text: string): text is Whitespace => /^[\t\n\r ]*$/u.test(text);

/**
 * An href's two written pieces (reading 94), `href = path ‖ params`.
 */
export interface HrefPieces {
  readonly params: Params;
  readonly path: string;
}

/**
 * A reference's written pieces, `lexical = lead ‖ target ‖ params ‖ trail`.
 */
export interface ReferencePieces {
  readonly lead: Whitespace;
  readonly params: Params;
  readonly target: string;
  readonly trail: Whitespace;
}

/**
 * A document's path split at its last `/`, `path = directory ‖ name`.
 */
export interface DirectorySplit {
  readonly directory: string;
  readonly name: string;
}

/**
 * Split an href into its two written pieces (reading 94): `path`, up to its first `?` or `#`, and
 * `params`, the query or fragment from there, so `href = path ‖ params`.
 *
 * @param href - The href, as written.
 * @returns Its pieces.
 */
export const hrefPiecesOf = (href: string): HrefPieces => {
  const at = href.search(/[?#]/u);
  const params = at === -1 ? "" : href.slice(at);

  return {
    params: isParams(params) ? params : "",
    path: at === -1 ? href : href.slice(0, at),
  };
};

/**
 * Split a reference's lexical form into the pieces `Reference` holds: its leading and trailing XML
 * whitespace, and between them its path and its query or fragment.
 *
 * @param lexical - The attribute's lexical form.
 * @returns `lead ‖ target ‖ params ‖ trail`, the lexical form.
 */
export const referencePiecesOf = (lexical: string): ReferencePieces => {
  const lead = /^[\t\n\r ]*/u.exec(lexical)?.[0] ?? "";
  const rest = lexical.slice(lead.length);
  const trail = /[\t\n\r ]*$/u.exec(rest)?.[0] ?? "";
  const { params, path } = hrefPiecesOf(rest.slice(0, rest.length - trail.length));

  return {
    lead: isWhitespace(lead) ? lead : "",
    params,
    target: path,
    trail: isWhitespace(trail) ? trail : "",
  };
};

/**
 * Write the key text of a projection's row.
 *
 * @param values - The heading's values, in the relation's key order.
 * @returns Their JSON array.
 */
const headingKey = (values: readonly string[]): string => JSON.stringify(values);

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * itself; a child of an interaction's is that interaction; every other node's is its parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @returns Each node's nearest interaction, by its id.
 */
const nearestOf = (nodes: readonly NodeRow<Composed>[]): ReadonlyMap<NodeId, NodeId> => {
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();

  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, node.id);
      continue;
    }

    const parentKind = kinds.get(node.parent) ?? "";
    nearest.set(
      node.id,
      interactions.has(parentKind) ? node.parent : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes' lexical forms, by the element's id and the attribute's name.
 */
const attributesOf = (
  rows: FlatRows<Composed>,
): ReadonlyMap<NodeId, ReadonlyMap<string, string>> => {
  const byNode = new Map<NodeId, Map<string, string>>();

  for (const { lexical, name, node } of rows.attributes) {
    const named = byNode.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    byNode.set(node, named);
  }

  return byNode;
};

/**
 * Build the overlay rows of a package's manifest.
 *
 * An element's required attribute that is absent leaves its field empty (a `cp:resource`'s
 * `identifier` or `type`, the `cp:manifest`'s `identifier`), or leaves out the row whose existence
 * the attribute's copy proves (a `cp:file`'s `href`, a `cp:dependency`'s `identifierref`): AL3
 * refuses the element either way. A resource's `href` is a row only where it is written.
 *
 * @param doc - The manifest's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: ManifestIds): PackageRows => {
  const rows = flatten(doc, ids.idOf);
  const attributes = attributesOf(rows);
  const nearest = nearestOf(rows.nodes);
  const document = rows.document.node;
  const tupleOf = (node: NodeRow<Composed>) => ({
    document,
    kind: node.kind,
    nearest: nearest.get(node.id) ?? document,
    node: node.id,
    start: node.start,
    version: node.version,
  });
  const valueOf = (node: NodeRow<Composed>, name: string): string | undefined =>
    attributes.get(node.id)?.get(name);
  const manifestIdentifier =
    rows.nodes.flatMap((node) =>
      node.kind === "cp:manifest" ? [valueOf(node, "identifier") ?? ""] : [],
    )[0] ?? "";
  const dependencies = new Map<string, Addition<typeof Dependency>>();
  const files = new Map<string, Addition<typeof File>>();
  const fileHrefs = new Map<string, Addition<typeof FileHref>>();
  const manifests = new Map<string, Addition<typeof ManifestId>>();
  const namedHrefs = new Map<string, Addition<typeof NamedHref>>();
  const resources = new Map<string, Addition<typeof Resource>>();
  const resourceFiles = new Map<string, Addition<typeof ResourceFile>>();
  const resourceHrefs = new Map<string, Addition<typeof ResourceHref>>();
  const resourceIdentifiers = new Map<NodeId, string>();

  for (const node of rows.nodes) {
    if (node.kind === "cp:manifest") {
      manifests.set(node.id, {
        ...tupleOf(node),
        identifier: valueOf(node, "identifier") ?? "",
        package: ids.package,
        parent: node.parent,
      });
    }

    if (node.kind === "cp:resource") {
      const typeLexical = valueOf(node, "type") ?? "";
      const type = typeOf(typeLexical);
      const href = valueOf(node, "href");

      resourceIdentifiers.set(node.id, valueOf(node, "identifier") ?? "");
      resources.set(node.id, {
        ...tupleOf(node),
        identifier: valueOf(node, "identifier") ?? "",
        manifestIdentifier,
        package: ids.package,
        parent: node.parent,
        type,
        typeLexical,
      });

      if (href !== undefined) {
        const { params, path } = hrefPiecesOf(href);
        resourceHrefs.set(node.id, {
          href,
          node: node.id,
          package: ids.package,
          params,
          path,
          type,
        });
        namedHrefs.set(headingKey([ids.package, path, type]), { package: ids.package, path, type });
      }
    }

    const href = node.kind === "cp:file" ? valueOf(node, "href") : undefined;

    if (href !== undefined) {
      files.set(node.id, { ...tupleOf(node), href, package: ids.package, resource: node.parent });
      fileHrefs.set(headingKey([ids.package, href]), { href, package: ids.package });
      resourceFiles.set(headingKey([node.parent, href]), { href, resource: node.parent });
    }

    const ref = node.kind === "cp:dependency" ? valueOf(node, "identifierref") : undefined;

    if (ref !== undefined) {
      dependencies.set(node.id, {
        ...tupleOf(node),
        package: ids.package,
        ref,
        resource: node.parent,
        resourceIdentifier: resourceIdentifiers.get(node.parent) ?? "",
      });
    }
  }

  return {
    Dependency: dependencies,
    File: files,
    FileHref: fileHrefs,
    ManifestId: manifests,
    NamedHref: namedHrefs,
    Resource: resources,
    ResourceFile: resourceFiles,
    ResourceHref: resourceHrefs,
  };
};

/**
 * Name the documents a manifest's resources name (reading 84): each pair of an href's path and a
 * resource type `RootOfType` maps, so the importer reads the entry at the path as a document of
 * that type (reading 94: the href's launch parameters name no other file).
 *
 * @param rows - The manifest's overlay rows.
 * @returns The named documents' paths and types, a keyed set by (path, type). One path named under
 *   two types is two pairs, and the database refuses the package, since a document has one type.
 */
export const namedDocuments = (
  rows: PackageRows,
): ReadonlyMap<string, { readonly path: string; readonly type: ResourceTypeHandle }> =>
  new Map(
    [...rows.NamedHref.values()].flatMap(({ path, type }) =>
      documentTyped.has(type) ? [[headingKey([path, type]), { path, type }] as const] : [],
    ),
  );

/**
 * The ids a document's reference rows are written under: the manifest's, and the document's own
 * path in its package. It is the part of the importer's `NodeIds` (Q5.15) this builder reads.
 */
export interface DocumentIds extends ManifestIds {
  readonly path: string;
}

/**
 * How an attribute of the reference census holds its references: one URL, or a `srcset`'s image
 * candidates (`ReferenceAttribute`'s `form`, the grammar's).
 */
export type ReferenceForm = "srcset" | "uri";

/**
 * The reference census: the form of the references an attribute of a name holds on an element of a
 * kind, under a schema version, none for an attribute that names no file.
 */
export type ReferenceCensus = (
  version: string,
  kind: string,
  name: string,
) => ReferenceForm | undefined;

/**
 * The grammar's reference census, `ReferenceAttribute` (spec reading 95): the census the database's
 * copy into `Reference` selects by, so the builder writes a row for exactly the attributes the
 * copy requires one of.
 *
 * @param version - The element's schema version.
 * @param kind - Its kind.
 * @param name - The attribute's name.
 * @returns The form of the references it holds, none for an attribute the census does not list.
 */
export const referenceCensus: ReferenceCensus = (version, kind, name) =>
  Option.getOrUndefined(
    Option.map(
      grammar.references.referenceAttribute.lookup({ kind, name, version }),
      ({ form }) => form,
    ),
  );

/**
 * A document's reference rows, one keyed set per relation, keyed as {@link PackageRows} are: its
 * directory and each `xml:base` by their node's id, and each reference and each resolved reference
 * by the JSON array of its key's values.
 */
export interface ReferenceRows {
  readonly DocumentDirectory: ReadonlyMap<string, Addition<typeof DocumentDirectory>>;
  readonly Reference: ReadonlyMap<string, Addition<typeof Reference>>;
  readonly ReferencePath: ReadonlyMap<string, Addition<typeof ReferencePath>>;
  readonly XmlBase: ReadonlyMap<string, Addition<typeof XmlBase>>;
}

/**
 * The targets this representation resolves, `dotPrefixedHrefPattern` read as the database reads
 * it: leading dot segments, then a path in the `resolvedHref` form.
 */
const resolvable = new RegExp(dotPrefixedHrefPattern, "u");

/**
 * A target's leading dot segments: each `./` and `../` before its first plain segment.
 */
const leadingDots = /^(?:\.\.?\/)*/u;

/**
 * The `DotDepth` handle a `ReferencePath` writes its climb as.
 */
type Depth = Addition<typeof ReferencePath>["climb"];

/**
 * State that a text is a `DotDepth` handle.
 *
 * @param text - The text.
 * @returns Whether `DotDepth` names it.
 */
const isDepth = (text: string): text is Depth => DotDepth.handles.some((handle) => handle === text);

/**
 * The pieces a `ReferencePath` proves its path by (reading 94): `target = ups ‖ rest`,
 * `directory = kept ‖ removed`, and `path = kept ‖ rest`, with `climb` the `../` segments of
 * `ups`.
 */
export interface Resolution {
  readonly climb: Depth;
  readonly kept: string;
  readonly path: string;
  readonly removed: string;
  readonly rest: string;
  readonly ups: string;
}

/**
 * Split a document's path at its last `/`.
 *
 * @param path - The path, an entry's.
 * @returns Its directory, empty at the root and ending with `/` below it, and its name.
 */
export const directoryOf = (path: string): DirectorySplit => {
  const at = path.lastIndexOf("/") + 1;

  return { directory: path.slice(0, at), name: path.slice(at) };
};

/**
 * Split a resolvable target into the pieces its `ReferencePath` proves (RFC 3986, §5.2.4, for
 * leading dot segments): its leading `./` and `../` segments and the path after them, and the
 * directory with as many of its last segments split off as `../` segments climb. A target that
 * climbs above the package root, or by more than `dotDepthMax`, keeps the whole directory in
 * `removed` and a depth its pattern refuses, so "Href form" refuses it.
 *
 * @param directory - The document's directory, empty at the root and ending with `/` below it.
 * @param target - The reference's target, its path piece.
 * @returns Its pieces, or none for a target this representation does not resolve.
 */
export const resolutionOf = (directory: string, target: string): Resolution | undefined => {
  if (!resolvable.test(target)) {
    return undefined;
  }

  const ups = leadingDots.exec(target)?.[0] ?? "";
  const rest = target.slice(ups.length);
  const climb = ups.split("/").filter((segment) => segment === "..").length;
  const segments = directory.split("/").slice(0, -1);
  const removed =
    climb <= segments.length && climb <= dotDepthMax
      ? segments
          .slice(segments.length - climb)
          .map((segment) => `${segment}/`)
          .join("")
      : directory;
  const kept = directory.slice(0, directory.length - removed.length);
  const depth = String(Math.min(climb, dotDepthMax));

  return { climb: isDepth(depth) ? depth : "0", kept, path: `${kept}${rest}`, removed, rest, ups };
};

/**
 * Resolve a reference's target against its document's directory, as `ReferencePath` proves it:
 * the entry a resolvable target names.
 *
 * @param directory - The document's directory, empty at the root and ending with `/` below it.
 * @param target - The reference's target, its path piece.
 * @returns The path it names, or none for a target this representation does not resolve.
 */
export const resolvedPathOf = (directory: string, target: string): string | undefined =>
  resolutionOf(directory, target)?.path;

/**
 * Build a document's reference rows (`#pantry/qti/package.ts`): its directory, each `xml:base` it
 * holds, each attribute of the census with its split, and each reference whose target resolves
 * ({@link resolutionOf}) with its resolution's pieces, at index 0.
 *
 * A `srcset` is read as one candidate (`srcsetCandidatePattern`): its row is written as any other
 * reference's, and "Href form" refuses a `srcset` of several candidates or with a descriptor.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its path.
 * @param census - The reference census.
 * @returns Its reference rows.
 */
export const referenceRowsOf = (
  doc: XdmDocument<Composed>,
  ids: DocumentIds,
  census: ReferenceCensus,
): ReferenceRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const { directory, name } = directoryOf(ids.path);
  const nodes = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const bases = new Map<string, Addition<typeof XmlBase>>();
  const references = new Map<string, Addition<typeof Reference>>();
  const paths = new Map<string, Addition<typeof ReferencePath>>();

  for (const { lexical, name: attribute, node } of rows.attributes) {
    if (attribute === "xml:base") {
      bases.set(node, { document, node });
    }

    const element = nodes.get(node);
    if (element === undefined || census(element.version, element.kind, attribute) === undefined) {
      continue;
    }

    const pieces = referencePiecesOf(lexical);
    const resolution = resolutionOf(directory, pieces.target);
    references.set(headingKey([node, attribute]), {
      document,
      kind: element.kind,
      lexical,
      name: attribute,
      node,
      ...pieces,
    });
    if (resolution !== undefined) {
      paths.set(headingKey([node, attribute, "0"]), {
        ...resolution,
        at: 0n,
        directory,
        document,
        kind: element.kind,
        name: attribute,
        node,
        package: ids.package,
        target: pieces.target,
      });
    }
  }

  return {
    DocumentDirectory: new Map([
      [document, { directory, name, node: document, package: ids.package, path: ids.path }],
    ]),
    Reference: references,
    ReferencePath: paths,
    XmlBase: bases,
  };
};
