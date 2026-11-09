/**
 * The manifest's overlay rows (plan §1.6, §C's `rowsOf`), each document's reference rows
 * (`referenceRowsOf`), and the one resolver of an href the importer has (`resolveIn`): from a
 * document's XDM tree and the ids its nodes are written under, the rows of every overlay
 * `#pantry/qti/package.ts` declares, each relation's rows a keyed set.
 *
 * The rows restate what the tree says: each overlay copies its node's tuple as the tree's own rows
 * give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form as written, and
 * each resource's type as the `ResourceType` handle its lexical form spells. The database proves
 * every one of them (`packageLaws`), so a row this builder gets wrong is refused, never accepted.
 *
 * Every href is resolved here before a row is written (readings 102 and 103): its value read by
 * its attribute's whitespace class, its path merged with its base, the `xml:base` in scope or its
 * document's own path, its dot segments removed, and each segment percent-decoded (RFC 3986, §2.1,
 * §5.2 and §6.2.2.2). No relation can percent-decode a name, so the database holds the outcome and
 * compares it with the entries, and the law oracle's own resolver (`#pantry/test/resolution.ts`)
 * is the differential that holds this one to RFC 3986.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.2 | RFC 3986, §5.2}
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Option, Result } from "effect";
import { documentTypes, grammar, ResourceType } from "#pantry/grammar/install.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import { foldAt, foldOf, ownContext } from "#pantry/import/fold.ts";
import { stringValuesOf } from "#pantry/import/overlays/string-values.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import type {
  Dependency,
  DependencyTarget,
  File,
  FileHref,
  ManifestId,
  ManifestIdSpace,
  NamedHref,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceTyped,
  TextReference,
  TextReferencePath,
  TypedHref,
} from "#pantry/qti/package.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

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
  readonly DependencyTarget: ReadonlyMap<string, Addition<typeof DependencyTarget>>;
  readonly File: ReadonlyMap<string, Addition<typeof File>>;
  readonly FileHref: ReadonlyMap<string, Addition<typeof FileHref>>;
  readonly ManifestId: ReadonlyMap<string, Addition<typeof ManifestId>>;
  readonly ManifestIdSpace: ReadonlyMap<string, Addition<typeof ManifestIdSpace>>;
  readonly NamedHref: ReadonlyMap<string, Addition<typeof NamedHref>>;
  readonly Resource: ReadonlyMap<string, Addition<typeof Resource>>;
  readonly ResourceFile: ReadonlyMap<string, Addition<typeof ResourceFile>>;
  readonly ResourceHref: ReadonlyMap<string, Addition<typeof ResourceHref>>;
  readonly ResourceId: ReadonlyMap<string, Addition<typeof ResourceId>>;
  readonly ResourceTyped: ReadonlyMap<string, Addition<typeof ResourceTyped>>;
  readonly TypedHref: ReadonlyMap<string, Addition<typeof TypedHref>>;
}

/**
 * The manifest overlays of a document that is not its package's manifest: none. The package's
 * manifest is its one `imsmanifest.xml` (IMS Content Packaging 1.2), so a `cp:*` element of any
 * other document describes no part of the package: what refuses it is the content laws over its
 * own node (its root's resource type, its required attributes), never a manifest overlay's key or
 * copy, one cause, one rule.
 */
export const noPackageRows: PackageRows = {
  Dependency: new Map(),
  DependencyTarget: new Map(),
  File: new Map(),
  FileHref: new Map(),
  ManifestId: new Map(),
  ManifestIdSpace: new Map(),
  NamedHref: new Map(),
  Resource: new Map(),
  ResourceFile: new Map(),
  ResourceHref: new Map(),
  ResourceId: new Map(),
  ResourceTyped: new Map(),
  TypedHref: new Map(),
};

/**
 * The `ResourceType` handle a `cp:resource`'s `type` names: every handle but the null object is
 * spelled exactly as its lexical form (C17).
 */
type ResourceTypeHandle = Addition<typeof ResourceTyped>["type"];

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
 * Read the code of a resource's `type` from its lexical form, as written: the attribute's type is
 * an `xs:string` enumeration, whose whitespace is preserved (XSD 1.1 Part 2, §4.3.6).
 *
 * @param lexical - The `type` attribute's lexical form, as written.
 * @returns The handle it spells; none for a form no handle spells, which has no code anywhere and
 *   which the attribute's value domain refuses as `attribute-lexical` alone (spec reading 67).
 */
const typeOf = (lexical: string): Option.Option<ResourceTypeHandle> =>
  Option.fromUndefinedOr(spelledTypes.get(lexical));

/**
 * An href's `params` piece, as `ResourceHref` and `Reference` type it: empty, or from a `?` or `#`.
 */
type Params = Addition<typeof Reference>["params"];

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
 * Hold a piece the split cut as an href's `params` to its type.
 *
 * @param text - The piece: empty, or from the href's first `?` or `#`.
 * @returns The piece.
 * @throws {Error} When it is neither, which the split never cuts.
 */
const paramsOf = (text: string): Params => {
  if (isParams(text)) {
    return text;
  }

  throw new Error(
    `The href split cut ${JSON.stringify(text)} as params, which start at a "?" or "#". Correct hrefPiecesOf.`,
  );
};

/**
 * Hold a piece the split cut as a reference's outer whitespace to its type.
 *
 * @param text - The piece: the XML whitespace at one end of a lexical form.
 * @returns The piece.
 * @throws {Error} When it holds anything but XML whitespace, which the split never cuts.
 */
const whitespaceOf = (text: string): Whitespace => {
  if (isWhitespace(text)) {
    return text;
  }

  throw new Error(
    `The reference split cut ${JSON.stringify(text)} as whitespace, and it holds more. Correct referencePiecesOf.`,
  );
};

/**
 * An href's two written pieces (reading 102), `href = path ‖ params`.
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
 * Split an href into its two written pieces (reading 102): `path`, up to its first `?` or `#`, and
 * `params`, the query or fragment from there, so `href = path ‖ params`.
 *
 * @param href - The href, as written.
 * @returns Its pieces.
 */
export const hrefPiecesOf = (href: string): HrefPieces => {
  const at = href.search(/[?#]/u);

  return at === -1
    ? { params: "", path: href }
    : { params: paramsOf(href.slice(at)), path: href.slice(0, at) };
};

/**
 * Split a reference's lexical form into the pieces `Reference` holds: its leading and trailing XML
 * whitespace, and between them its path and its query or fragment.
 *
 * @param lexical - The attribute's lexical form.
 * @returns `lead ‖ target ‖ params ‖ trail`, the lexical form.
 */
export const referencePiecesOf = (lexical: string): ReferencePieces => {
  // Both patterns match at some index of any text, the second at its end at the latest, so
  // neither search gives -1.
  const start = lexical.search(/[^\t\n\r ]|$/u);
  const end = start + lexical.slice(start).search(/[\t\n\r ]*$/u);
  const { params, path } = hrefPiecesOf(lexical.slice(start, end));

  return {
    lead: whitespaceOf(lexical.slice(0, start)),
    params,
    target: path,
    trail: whitespaceOf(lexical.slice(end)),
  };
};

/**
 * The whitespace class an href's attribute type reads its value under (XML Schema Part 2, §4.3.6):
 * `collapse` for `xs:anyURI`, every QTI `href` and `xml:base`; `replace` for `URLDType`, an
 * `xs:normalizedString`, HTML's `src`, `srcset` and `poster`; `preserve` for `xs:string`,
 * `object@data`.
 */
export type WhiteSpace = "collapse" | "preserve" | "replace";

/**
 * Set aside the XML whitespace around a text.
 *
 * @param inner - The text.
 * @returns It, with no tab, line feed, carriage return or space at either end.
 */
const trimmed = (inner: string): string =>
  inner.replace(/^[\t\n\r ]+/u, "").replace(/[\t\n\r ]+$/u, "");

/**
 * Read an href's value as its attribute's type reads it (XML Schema Part 2, §4.3.6), and set aside
 * the whitespace around it, as an `xs:anyURI` collapses it and an HTML URL may be "potentially
 * surrounded by spaces": `collapse` turns each run of XML whitespace into one space, `replace` each
 * tab, line feed and carriage return into a space, and `preserve` keeps the inner text as written.
 *
 * @param lexical - The attribute's lexical form.
 * @param whiteSpace - Its type's whitespace class.
 * @returns The value an href is resolved from.
 */
export const hrefValueOf = (lexical: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return trimmed(lexical.replaceAll(/[\t\n\r ]+/gu, " "));
  }

  return trimmed(whiteSpace === "replace" ? lexical.replaceAll(/[\t\n\r]/gu, " ") : lexical);
};

/**
 * Why the importer reads no name from an href, each a stated limit of the representation, refused
 * under "Href form" (reading 102), never under a law of QTI or Content Packaging:
 *
 * - `percent`: a `%` that starts no percent-encoding (`a%zz.png`, a `%` at the end). RFC 3986, §2.1,
 *   gives such a `%` no octet, so the path names nothing; the URL Standard keeps it as written, as
 *   a validation error. An `xs:anyURI`'s value domain refuses it first.
 * - `octets`: percent-encoded octets that spell no UTF-8 (`%FF`, `%C3` alone). XLink's escaping
 *   writes a name's characters as their UTF-8 octets (RFC 3986, §2.5), and an entry's path is
 *   Unicode text, so the octets name no entry this representation can compare: the file they name
 *   depends on the archive's own name encoding (a zip without its UTF-8 flag names in code page
 *   437).
 * - `separator`: a segment that decodes to a `/` or U+0000 (`a%2Fb.png`, `%00`). An encoded `/` is
 *   data within its segment (RFC 3986, §2.2), naming a file whose name holds `/`, and a resolved
 *   path is one text whose segments are separated by `/`, so it cannot hold that segment apart;
 *   PostgreSQL text holds no U+0000.
 * - `backslash`: a `\` in the path. XLink's escaping makes it the name's octet `%5C`, and the URL
 *   Standard reads it as `/` in a URL of a special scheme, so the two sources an href answers to
 *   name different files by it.
 * - `control`: a tab, line feed or carriage return the attribute's type preserves inside the path
 *   (`object@data`, an `xs:string`). XLink's escaping makes it a name's octet, and the URL Standard
 *   removes it from the URL.
 * - `colon`: a `:` in the first segment of a path with no scheme (`1:a.png`). RFC 3986, §4.2, makes
 *   it no relative reference ("would be mistaken for a scheme name"), and the URL Standard reads it
 *   as a path.
 * - `srcset`: a `srcset` of several image candidates or with a descriptor, which the HTML Standard's
 *   own parsing algorithm splits (`#pantry/qti/package.ts` `srcsetCandidatePattern`).
 */
export type Limit =
  | "backslash"
  | "colon"
  | "control"
  | "octets"
  | "percent"
  | "separator"
  | "srcset";

/**
 * How an href resolves, the `HrefScope` its row holds (`#pantry/qti/package.ts`): in the
 * package, to the entry path it names; outside it; to its own document; or not at all, under a
 * {@link Limit}.
 */
export type HrefResolution =
  | { readonly path: string; readonly scope: "entry" }
  | { readonly scope: "document" | "external" }
  | { readonly limit: Limit; readonly scope: "unresolved" };

/**
 * The base an element's hrefs resolve against (RFC 3986, §5.1; `xml:base`, xml.xsd: "provides a
 * URI to be used as the base for interpreting any relative URIs in the scope of the element on
 * which it appears; its value is inherited"): a path in the package, as its segments in their
 * written form, the last its file's name or empty for a directory; a location outside the package;
 * or a base the importer reads no path from, under its {@link Limit}.
 */
export type HrefBase =
  | { readonly _tag: "package"; readonly segments: readonly string[] }
  | { readonly _tag: "external" }
  | { readonly _tag: "unresolved"; readonly limit: Limit };

/**
 * A URI's scheme at the start of an href (RFC 3986, §3.1): `ALPHA *( ALPHA / DIGIT / "+" / "-" /
 * "." ) ":"`.
 */
const schemeStart = /^[A-Za-z][A-Za-z0-9+.-]*:/u;

/**
 * A `%` that starts no percent-encoding, `"%" HEXDIG HEXDIG` (RFC 3986, §2.1).
 */
const strayPercent = /%(?![0-9A-Fa-f]{2})/u;

/**
 * A segment made of dots alone, each written as `.` or as its percent-encoding `%2E`, an
 * unreserved character, which RFC 3986, §2.3 and §6.2.2.2, reads as the character itself.
 */
const dotsOnly = /^(?:\.|%2[Ee])+$/u;

/**
 * Write an entry path's segment, a name, in the written form a base's segments are held in: each
 * `%` as `%25`, so that decoding the segment gives the name back.
 *
 * @param name - The segment, as the entry's path holds it.
 * @returns Its written form.
 */
const writtenNameOf = (name: string): string => name.replaceAll("%", "%25");

/**
 * The base of a document's hrefs where no `xml:base` is in scope: the document's own path in the
 * package (RFC 3986, §5.1.3, the URI it was retrieved from), the manifest's directory being the
 * package root.
 *
 * @param path - The document's path, an entry's.
 * @returns Its base.
 */
export const documentBase = (path: string): HrefBase => ({
  _tag: "package",
  segments: path.split("/").map(writtenNameOf),
});

/**
 * Count a segment's dots, where it is made of dots alone.
 *
 * @param segment - The segment, written.
 * @returns How many, `.` and `..` being the dot segments; 0 for any other segment.
 */
const dotsOf = (segment: string): number =>
  dotsOnly.test(segment) ? segment.replaceAll(/%2[Ee]/gu, ".").length : 0;

/**
 * Remove a merged path's dot segments (RFC 3986, §5.2.4): each `.` is dropped and each `..` drops
 * the segment before it, and either one as the last segment leaves the path ending with `/`.
 *
 * @param segments - The merged path's segments, its base's directory first.
 * @returns The segments that remain, or none for a path whose `..` climb above the package root,
 *   which resolves outside the package.
 */
const removeDotSegments = (segments: readonly string[]): readonly string[] | undefined => {
  const kept: string[] = [];
  for (const [at, segment] of segments.entries()) {
    const dots = dotsOf(segment);
    if (dots !== 1 && dots !== 2) {
      kept.push(segment);
      continue;
    }

    if (dots === 2 && kept.pop() === undefined) {
      return undefined;
    }

    if (at === segments.length - 1) {
      kept.push("");
    }
  }

  return kept;
};

/**
 * Name the limit a written path meets before it is merged, if any: a stray `%`, a backslash, a
 * tab, line feed or carriage return, or a `:` in its first segment.
 *
 * @param path - The path piece of an href with no scheme.
 * @returns The limit, or none.
 */
const writtenLimitOf = (path: string): Limit | undefined => {
  if (strayPercent.test(path)) {
    return "percent";
  }

  if (path.includes("\\")) {
    return "backslash";
  }

  if (/[\t\n\r]/u.test(path)) {
    return "control";
  }

  return /^[^/]*:/u.test(path) ? "colon" : undefined;
};

/**
 * What an href's path comes to against a base before any segment is decoded.
 */
type Step =
  | { readonly _tag: "document" }
  | { readonly _tag: "external" }
  | { readonly _tag: "unresolved"; readonly limit: Limit }
  | { readonly _tag: "segments"; readonly segments: readonly string[] };

/**
 * Read the path piece of an href (reading 102): up to its first `?` or `#`, where its query or
 * fragment starts (RFC 3986, §3.3).
 *
 * @param value - The href's value.
 * @returns Its path.
 */
export const hrefPathOf = (value: string): string => {
  const at = value.search(/[?#]/u);

  return at === -1 ? value : value.slice(0, at);
};

/**
 * Resolve an href's path against a base, as far as its written segments (RFC 3986, §5.2.2 to
 * §5.2.4): a scheme, or a path that starts with `/`, is external (readings 35 and 102); an empty
 * path names its own document (§4.4); a relative path against an external base is external, and
 * against an unresolved one unresolved; a path that meets a {@link Limit} as written is
 * unresolved; and any other is merged with the base's directory and its dot segments removed.
 *
 * @param value - The href's value, read by its whitespace class.
 * @param base - The base in scope.
 * @returns The step.
 */
const stepOf = (value: string, base: HrefBase): Step => {
  const path = hrefPathOf(value);
  if (schemeStart.test(value) || path.startsWith("/")) {
    return { _tag: "external" };
  }

  if (path === "") {
    return { _tag: "document" };
  }

  if (base._tag !== "package") {
    return base;
  }

  const limit = writtenLimitOf(path);
  if (limit !== undefined) {
    return { _tag: "unresolved", limit };
  }

  const segments = removeDotSegments([...base.segments.slice(0, -1), ...path.split("/")]);

  return segments === undefined ? { _tag: "external" } : { _tag: "segments", segments };
};

/**
 * The strict UTF-8 decoder a resolved segment's octets are read by: it refuses an invalid
 * sequence rather than replace it, and keeps a leading U+FEFF as a character of the name, where
 * the default decoder would drop it as a byte order mark.
 */
const utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/**
 * Encode text as UTF-8, each character's octets as XLink's escaping writes them.
 */
const encoder = new TextEncoder();

/**
 * Percent-decode one segment (RFC 3986, §2.1): each `%HH` its octet and every other character its
 * UTF-8 octets, read back as UTF-8.
 *
 * @param segment - The segment, written, every `%` the start of a percent-encoding.
 * @returns The name it spells, or the limit it meets: octets that are no UTF-8, or a name holding
 *   `/` or U+0000.
 */
const decodedSegmentOf = (segment: string): Result.Result<string, Limit> => {
  const octets: number[] = [];
  for (const [token] of segment.matchAll(/%[0-9A-Fa-f]{2}|./gsu)) {
    octets.push(
      ...(token.startsWith("%") ? [Number.parseInt(token.slice(1), 16)] : encoder.encode(token)),
    );
  }

  return Result.match(
    Result.try(() => utf8.decode(Uint8Array.from(octets))),
    {
      onFailure: (): Result.Result<string, Limit> => Result.fail("octets"),
      onSuccess: (name): Result.Result<string, Limit> =>
        name.includes("/") || name.includes("\u0000")
          ? Result.fail("separator")
          : Result.succeed(name),
    },
  );
};

/**
 * Resolve an href against its base (readings 102 and 103): {@link stepOf}, then each remaining
 * segment percent-decoded, so `my%20sign.png` and `my sign.png` both name the entry `my sign.png`.
 *
 * @param value - The href's value, read by its whitespace class ({@link hrefValueOf}).
 * @param base - The base in scope.
 * @returns Its resolution.
 */
export const resolveIn = (value: string, base: HrefBase): HrefResolution => {
  const step = stepOf(value, base);
  if (step._tag === "document" || step._tag === "external") {
    return { scope: step._tag };
  }

  if (step._tag === "unresolved") {
    return { limit: step.limit, scope: "unresolved" };
  }

  const names: string[] = [];
  for (const segment of step.segments) {
    const decoded = decodedSegmentOf(segment);
    if (Result.isFailure(decoded)) {
      return { limit: decoded.failure, scope: "unresolved" };
    }

    names.push(decoded.success);
  }

  return { path: names.join("/"), scope: "entry" };
};

/**
 * Take the base an `xml:base` sets for its element's scope (xml.xsd; RFC 3986, §5.1.1): its value
 * resolved against the base in scope as an href's is, its segments left as written, since only a
 * reference's own resolution is decoded. An `xml:base` whose path is empty leaves the base as it
 * is.
 *
 * @param value - The `xml:base`'s value, collapsed as an `xs:anyURI` is.
 * @param base - The base in scope at its element's parent.
 * @returns The element's base.
 */
export const baseIn = (value: string, base: HrefBase): HrefBase => {
  const step = stepOf(value, base);
  if (step._tag === "document") {
    return base;
  }

  return step._tag === "segments" ? { _tag: "package", segments: step.segments } : step;
};

/**
 * Read the base of a node of a document.
 *
 * @param bases - The document's bases, as {@link basesOf} computes them.
 * @param node - The id of a node of the document.
 * @returns Its base.
 * @throws {Error} When the node has none: every node of a document has a base, each computed after
 *   its parent's, so a miss names a node of another document, or one read before its parent.
 */
const baseAt = (bases: ReadonlyMap<NodeId, HrefBase>, node: NodeId): HrefBase => {
  const base = bases.get(node);
  if (base === undefined) {
    throw new Error(
      `Node ${node} has no base: every node of a document has one, each computed after its parent's. Resolve each href against its own document's rows, in document order.`,
    );
  }

  return base;
};

/**
 * Compute the base of every node of a document: the document's own path at its root, and below it
 * each element's parent's, resolved with the element's own `xml:base` where it holds one (XML
 * Base: an element's other attributes resolve against its own `xml:base`).
 *
 * @param rows - The document's flat rows, in document order, so each parent precedes its children.
 * @param path - The document's path in its package.
 * @returns Each node's base, by its id.
 */
export const basesOf = (rows: FlatRows<Composed>, path: string): ReadonlyMap<NodeId, HrefBase> => {
  const written = new Map(
    rows.attributes.flatMap(({ lexical, name, node }) =>
      name === "xml:base" ? [[node, lexical] as const] : [],
    ),
  );
  const root = documentBase(path);
  const bases = new Map<NodeId, HrefBase>();
  for (const node of rows.nodes) {
    const inherited = node.parent === node.id ? root : baseAt(bases, node.parent);
    const own = written.get(node.id);
    bases.set(
      node.id,
      own === undefined ? inherited : baseIn(hrefValueOf(own, "collapse"), inherited),
    );
  }

  return bases;
};

/**
 * Resolve an attribute of a node of a document as an href, its value read by its whitespace class.
 */
export type HrefResolver = (
  node: NodeId,
  lexical: string,
  whiteSpace?: WhiteSpace,
) => HrefResolution;

/**
 * Build the resolver of a document's hrefs: each against its element's base ({@link basesOf}).
 * Every builder that reads what an href names reads it here, so a reference's `ReferencePath`, an
 * item ref's target and a site's path are one resolution.
 *
 * @param rows - The document's flat rows.
 * @param path - The document's path in its package.
 * @returns The resolver; its `whiteSpace` is `collapse` unless given, an `xs:anyURI`'s.
 */
export const hrefResolverOf = (rows: FlatRows<Composed>, path: string): HrefResolver => {
  const bases = basesOf(rows, path);

  return (node, lexical, whiteSpace = "collapse") =>
    resolveIn(hrefValueOf(lexical, whiteSpace), baseAt(bases, node));
};

/**
 * The entry path a resolution names, none for one outside the package.
 *
 * @param resolution - The resolution.
 * @returns Its path where its scope is `entry`.
 */
export const entryPathOf = (resolution: HrefResolution): string | undefined =>
  resolution.scope === "entry" ? resolution.path : undefined;

/**
 * The path an href is compared by, `ResourceHref`'s and `File`'s `path`, and an item ref's or a
 * site's (`#pantry/import/overlays/tests.ts` `ResolvedHref`): the entry path it resolves to in the
 * package, and otherwise its path piece as read, so two external hrefs are compared as written
 * (reading 102).
 *
 * @param resolution - Its resolution.
 * @param lexical - Its lexical form, an `xs:anyURI`'s.
 * @returns The path.
 */
export const comparedPathOf = (resolution: HrefResolution, lexical: string): string =>
  resolution.scope === "entry" ? resolution.path : hrefPathOf(hrefValueOf(lexical, "collapse"));

/**
 * Write the key text of a projection's row.
 *
 * @param values - The heading's values, in the relation's key order.
 * @returns Their JSON array.
 */
const headingKey = (values: readonly string[]): string => JSON.stringify(values);

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes' lexical forms, by the element's id and the attribute's name.
 */
const attributesOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, ReadonlyMap<string, string>> =>
  new Map(
    [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
      ([node, held]) => [node, new Map(held.map(({ lexical, name }) => [name, lexical]))] as const,
    ),
  );

/**
 * Name the resource each dependency names: the one whose identifier its `identifierref` is, as
 * written, its own resource where its own resource's identifier is that one, so that "Self
 * dependency" judges it, else the first in document order; none where no resource's is.
 *
 * @param dependencies - The manifest's dependencies.
 * @param resourceIds - Its resources' identifiers, in document order.
 * @returns Each dependency's target, keyed by its node.
 */
const dependencyTargetsOf = (
  dependencies: Iterable<Addition<typeof Dependency>>,
  resourceIds: Iterable<Addition<typeof ResourceId>>,
): ReadonlyMap<string, Addition<typeof DependencyTarget>> => {
  const firsts = new Map<string, NodeId>();
  const owns = new Set<string>();
  for (const { identifier, node } of resourceIds) {
    if (!firsts.has(identifier)) {
      firsts.set(identifier, node);
    }

    owns.add(headingKey([node, identifier]));
  }

  return new Map(
    [...dependencies].flatMap(({ node, package: pkg, ref, resource }) =>
      Option.toArray(
        owns.has(headingKey([resource, ref]))
          ? Option.some(resource)
          : Option.fromUndefinedOr(firsts.get(ref)),
      ).map((target) => [node, { node, package: pkg, ref, resource, target }] as const),
    ),
  );
};

/**
 * The `type` a `cp:resource` that writes none is held under, `Resource`'s and `ResourceHref`'s
 * `typeLexical` (`#pantry/qti/package.ts`): the empty form, which spells no handle, as an unspelled
 * written form does, so no `ResourceTyped` or `TypedHref` row stands for it and AL3 refuses the
 * resource alone. It is a field of both rows rather than a row of its own because a typed
 * resource's href is required to have its `TypedHref` without a join of the two optional parts.
 */
const unwrittenType = "";

/**
 * Build the overlay rows of a package's manifest.
 *
 * An element's identifier is a row only where it is written: a `cp:manifest`'s is its
 * `ManifestId`, a `cp:resource`'s its `ResourceId`, each beside its row of the package's
 * identifier space (`ManifestIdSpace`). A row whose existence an attribute's copy proves is left
 * out where the attribute is absent (a `cp:file`'s `href`, a `cp:dependency`'s `identifierref`),
 * and a resource's `href` is a row only where it is written; AL3 refuses an absent required
 * attribute. A resource's absent `type` is held as {@link unwrittenType}.
 *
 * A dependency names the resource whose identifier its `identifierref` is, its own where its own
 * resource's is (`DependencyTarget`), and none where no resource's is.
 *
 * A resource's `href` and a file's are resolved against the manifest's path, the package root,
 * through every `xml:base` of a `cp:manifest`, `cp:resources` or `cp:resource` in scope (IMS
 * Content Packaging 1.2, §6.11.1, the Base class: "Relative references appearing within the scope
 * of a Base object shall then be interpreted according to the rules defined in RFC3986").
 *
 * @param doc - The manifest's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: ManifestIds): PackageRows => {
  const rows = flatten(doc, ids.idOf);
  const attributes = attributesOf(rows);
  const resolve = hrefResolverOf(rows, manifestPath);
  const folds = foldOf(rows.nodes, ownContext(rows.document.node));
  const document = rows.document.node;
  const tupleOf = (node: NodeRow<Composed>) => ({
    document,
    kind: node.kind,
    nearest: foldAt(folds, node.id).nearest,
    node: node.id,
    start: node.start,
    version: node.version,
  });
  const valueOf = (node: NodeRow<Composed>, name: string): Option.Option<string> =>
    Option.fromUndefinedOr(attributes.get(node.id)?.get(name));
  const dependencies = new Map<string, Addition<typeof Dependency>>();
  const files = new Map<string, Addition<typeof File>>();
  const fileHrefs = new Map<string, Addition<typeof FileHref>>();
  const idSpace = new Map<string, Addition<typeof ManifestIdSpace>>();
  const manifests = new Map<string, Addition<typeof ManifestId>>();
  const namedHrefs = new Map<string, Addition<typeof NamedHref>>();
  const resources = new Map<string, Addition<typeof Resource>>();
  const resourceFiles = new Map<string, Addition<typeof ResourceFile>>();
  const resourceHrefs = new Map<string, Addition<typeof ResourceHref>>();
  const resourceIds = new Map<string, Addition<typeof ResourceId>>();
  const resourceTypes = new Map<string, Addition<typeof ResourceTyped>>();
  const typedHrefs = new Map<string, Addition<typeof TypedHref>>();
  const spaceOf = (identifier: string, kind: "cp:manifest" | "cp:resource"): void => {
    idSpace.set(headingKey([ids.package, identifier, kind]), {
      identifier,
      kind,
      package: ids.package,
    });
  };

  for (const node of rows.nodes) {
    if (node.kind === "cp:manifest") {
      for (const identifier of Option.toArray(valueOf(node, "identifier"))) {
        manifests.set(node.id, {
          ...tupleOf(node),
          identifier,
          package: ids.package,
          parent: node.parent,
        });
        spaceOf(identifier, "cp:manifest");
      }
    }

    if (node.kind === "cp:resource") {
      const typeLexical = Option.getOrElse(valueOf(node, "type"), () => unwrittenType);
      const type = typeOf(typeLexical);

      resources.set(node.id, {
        ...tupleOf(node),
        package: ids.package,
        parent: node.parent,
        typeLexical,
      });
      for (const identifier of Option.toArray(valueOf(node, "identifier"))) {
        resourceIds.set(node.id, { identifier, node: node.id, package: ids.package });
        spaceOf(identifier, "cp:resource");
      }

      for (const code of Option.toArray(type)) {
        resourceTypes.set(node.id, {
          node: node.id,
          package: ids.package,
          type: code,
          typeLexical,
        });
      }

      for (const href of Option.toArray(valueOf(node, "href"))) {
        const resolution = resolve(node.id, href);
        const path = comparedPathOf(resolution, href);
        resourceHrefs.set(node.id, {
          href,
          node: node.id,
          package: ids.package,
          path,
          scope: resolution.scope,
          typeLexical,
        });
        for (const code of Option.toArray(type)) {
          typedHrefs.set(node.id, {
            node: node.id,
            package: ids.package,
            path,
            scope: resolution.scope,
            type: code,
          });
          namedHrefs.set(headingKey([ids.package, path, code]), {
            package: ids.package,
            path,
            type: code,
          });
        }
      }
    }

    for (const href of node.kind === "cp:file" ? Option.toArray(valueOf(node, "href")) : []) {
      const resolution = resolve(node.id, href);
      const path = comparedPathOf(resolution, href);
      const { scope } = resolution;
      files.set(node.id, {
        ...tupleOf(node),
        href,
        package: ids.package,
        path,
        resource: node.parent,
        scope,
      });
      fileHrefs.set(headingKey([ids.package, scope, path]), { package: ids.package, path, scope });
      resourceFiles.set(headingKey([node.parent, scope, path]), {
        path,
        resource: node.parent,
        scope,
      });
    }

    for (const ref of node.kind === "cp:dependency"
      ? Option.toArray(valueOf(node, "identifierref"))
      : []) {
      dependencies.set(node.id, {
        ...tupleOf(node),
        package: ids.package,
        ref,
        resource: node.parent,
      });
    }
  }

  return {
    Dependency: dependencies,
    DependencyTarget: dependencyTargetsOf(dependencies.values(), resourceIds.values()),
    File: files,
    FileHref: fileHrefs,
    ManifestId: manifests,
    ManifestIdSpace: idSpace,
    NamedHref: namedHrefs,
    Resource: resources,
    ResourceFile: resourceFiles,
    ResourceHref: resourceHrefs,
    ResourceId: resourceIds,
    ResourceTyped: resourceTypes,
    TypedHref: typedHrefs,
  };
};

/**
 * Name the documents a manifest's resources name (reading 93): each pair of the entry path an href
 * resolves to in the package and a resource type `RootOfType` maps, so the importer reads the entry
 * at the path as a document of that type (reading 102: the href's launch parameters name no other
 * file). An href outside the package names no document, and "Document entry" refuses it.
 *
 * @param rows - The manifest's overlay rows.
 * @returns The named documents' paths and types, a keyed set by (path, type), in the manifest's
 *   order. One path named under two types is two pairs; the import reads the path once, as the
 *   type its root bears out (`#pantry/import/program.ts`, reading 162), so the other's href names
 *   no document of its type, and "Document entry" refuses it.
 */
export const namedDocuments = (
  rows: PackageRows,
): ReadonlyMap<string, { readonly path: string; readonly type: ResourceTypeHandle }> =>
  new Map(
    [...rows.TypedHref.values()].flatMap(({ path, scope, type }) =>
      scope === "entry" && documentTyped.has(type)
        ? [[headingKey([path, type]), { path, type }] as const]
        : [],
    ),
  );

/**
 * Read the path each resource's `href` is compared by, as its `ResourceHref` row holds it: for the
 * builders of other overlays that read the document a resource names (its LOM record's object,
 * reading 62).
 *
 * @param rows - The manifest's flat rows.
 * @returns Each `cp:resource`'s path, by its node, for every resource that writes an `href`.
 */
export const resourcePathsOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, string> => {
  const resolve = hrefResolverOf(rows, manifestPath);
  const resources = new Set(
    rows.nodes.flatMap((node) => (node.kind === "cp:resource" ? [node.id] : [])),
  );

  return new Map(
    rows.attributes.flatMap(({ lexical, name, node }) =>
      name === "href" && resources.has(node)
        ? [[node, comparedPathOf(resolve(node, lexical), lexical)] as const]
        : [],
    ),
  );
};

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
 * A census attribute as the builder reads it: the form of the references it holds, and the
 * whitespace class of its type, which its value is read under before it resolves.
 */
export interface CensusEntry {
  readonly form: ReferenceForm;
  readonly whiteSpace: WhiteSpace;
}

/**
 * The reference census: how an attribute of a name on an element of a kind holds its references,
 * under a schema version, none for an attribute that names no file.
 */
export type ReferenceCensus = (
  version: string,
  kind: string,
  name: string,
) => Option.Option<CensusEntry>;

/**
 * Each declared attribute's whitespace class, by `version kind name`: its type's, a union's read
 * as `preserve`, which keeps every character for the limits to judge (no census attribute is a
 * union).
 */
const whiteSpaces: ReadonlyMap<string, WhiteSpace> = new Map(
  attributeDeclarations.flatMap(({ kind, name, type, versions }) =>
    versions.map(
      (version) =>
        [
          `${version} ${kind} ${name}`,
          type.whiteSpace === "union" ? "preserve" : type.whiteSpace,
        ] as const,
    ),
  ),
);

/**
 * Read a census attribute's whitespace class from its declaration.
 *
 * @param version - The element's schema version.
 * @param kind - Its kind.
 * @param name - The attribute's name.
 * @returns Its type's whitespace class ({@link whiteSpaces}).
 * @throws {Error} When no XSD declares the attribute: every attribute of the census is declared
 *   (`#pantry/vocab/inventory/attributes.ts`), so a miss is a defect of the grammar.
 */
const whiteSpaceOf = (version: string, kind: string, name: string): WhiteSpace => {
  const whiteSpace = whiteSpaces.get(`${version} ${kind} ${name}`);
  if (whiteSpace === undefined) {
    throw new Error(
      `ReferenceAttribute lists ${kind}@${name} under ${version}, which no XSD of the inventory declares. Regenerate the grammar's reference census from the declarations.`,
    );
  }

  return whiteSpace;
};

/**
 * The grammar's reference census, `ReferenceAttribute` (spec reading 103): the census the
 * database's copy into `Reference` selects by, so the builder writes a row for exactly the
 * attributes the copy requires one of, with each attribute's whitespace class from its XSD
 * declaration.
 *
 * @param version - The element's schema version.
 * @param kind - Its kind.
 * @param name - The attribute's name.
 * @returns How it holds its references, none for an attribute the census does not list.
 */
export const referenceCensus: ReferenceCensus = (version, kind, name) =>
  Option.map(
    grammar.references.referenceAttribute.lookup({ kind, name, version }),
    ({ form }): CensusEntry => ({ form, whiteSpace: whiteSpaceOf(version, kind, name) }),
  );

/**
 * A document's reference rows, one keyed set per relation, keyed as {@link PackageRows} are: each
 * reference and each resolved reference by the JSON array of its key's values.
 */
export interface ReferenceRows {
  readonly Reference: ReadonlyMap<string, Addition<typeof Reference>>;
  readonly ReferencePath: ReadonlyMap<string, Addition<typeof ReferencePath>>;
  readonly TextReference: ReadonlyMap<string, Addition<typeof TextReference>>;
  readonly TextReferencePath: ReadonlyMap<string, Addition<typeof TextReferencePath>>;
}

/**
 * Resolve a census attribute's value as its row holds it: as any href ({@link resolveIn}), but a
 * `srcset` whose value holds a comma or inner whitespace, several candidates or one with a
 * descriptor, is unresolved under the `srcset` limit unless it is external, where `Href_form`'s
 * own pattern over the lexical form refuses it (`srcsetCandidatePattern`).
 *
 * @param resolve - The document's resolver.
 * @param node - The attribute's element.
 * @param lexical - Its lexical form.
 * @param entry - Its census entry.
 * @returns Its resolution.
 */
const censusResolutionOf = (
  resolve: HrefResolver,
  node: NodeId,
  lexical: string,
  entry: CensusEntry,
): HrefResolution => {
  const resolution = resolve(node, lexical, entry.whiteSpace);

  return entry.form === "srcset" &&
    resolution.scope !== "external" &&
    /[,\t\n\r ]/u.test(hrefValueOf(lexical, entry.whiteSpace))
    ? { limit: "srcset", scope: "unresolved" }
    : resolution;
};

/**
 * The whitespace class each kind of the text census reads its text under, by kind.
 */
const textWhiteSpaces: ReadonlyMap<string, WhiteSpace> = new Map(
  textReferenceKinds.map(({ kind, whiteSpace }) => [kind, whiteSpace] as const),
);

/**
 * Build a document's reference rows (`#pantry/qti/package.ts`): each attribute of the census with
 * its written split and its `HrefScope`, and each that resolves in the package with the
 * entry path it names, its `ReferencePath`; and each element of the text census
 * (`textReferenceKinds`, spec reading R9-b) with its string value split and resolved the same way,
 * its `TextReference` and `TextReferencePath`.
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
  const resolve = hrefResolverOf(rows, ids.path);
  const nodes = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const references = new Map<string, Addition<typeof Reference>>();
  const paths = new Map<string, Addition<typeof ReferencePath>>();
  const textReferences = new Map<string, Addition<typeof TextReference>>();
  const textPaths = new Map<string, Addition<typeof TextReferencePath>>();
  const values = stringValuesOf(rows);

  for (const element of rows.nodes) {
    const whiteSpace = textWhiteSpaces.get(element.kind);
    if (whiteSpace === undefined) {
      continue;
    }

    const lexical = values.get(element.id) ?? "";
    const resolution = resolve(element.id, lexical, whiteSpace);
    const key = headingKey([element.id]);
    textReferences.set(key, {
      document,
      kind: element.kind,
      lexical,
      node: element.id,
      scope: resolution.scope,
      ...referencePiecesOf(lexical),
    });
    if (resolution.scope === "entry") {
      textPaths.set(key, {
        document,
        kind: element.kind,
        node: element.id,
        package: ids.package,
        path: resolution.path,
      });
    }
  }

  for (const { lexical, name: attribute, node } of rows.attributes) {
    const element = nodes.get(node);
    if (element === undefined) {
      throw new Error(
        `flatten wrote an attribute ${attribute} of node ${node}, and wrote no such node. Correct flatten.`,
      );
    }

    const listed = census(element.version, element.kind, attribute);
    if (Option.isNone(listed)) {
      continue;
    }

    const entry = listed.value;
    const resolution = censusResolutionOf(resolve, node, lexical, entry);
    const key = headingKey([node, attribute]);
    references.set(key, {
      document,
      kind: element.kind,
      lexical,
      name: attribute,
      node,
      scope: resolution.scope,
      ...referencePiecesOf(lexical),
    });
    if (resolution.scope === "entry") {
      paths.set(key, {
        document,
        kind: element.kind,
        name: attribute,
        node,
        package: ids.package,
        path: resolution.path,
      });
    }
  }

  return {
    Reference: references,
    ReferencePath: paths,
    TextReference: textReferences,
    TextReferencePath: textPaths,
  };
};
