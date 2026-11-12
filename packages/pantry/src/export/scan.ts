/**
 * The export's reads (fin.md §4.6, trees.md §3, plan N11; the W5 amendment's C20): one ordered
 * scan per document, and a package's entries, each with its document where it is one: plain
 * grizzle queries over `Qti`, which any role holding `Qti`'s relations whole runs. The author
 * login's workload (`#pantry/qti/logins.ts` `AuthorApp`) holds both, so `grizzle generate`
 * compiles each into the login's served file and plans its indexes; an application's own login may
 * hold them, or read `Qti`'s relations with queries of its own.
 *
 * A document is named by its key, its package's manifest identifier and its path, and a node by its
 * document's key and its `start`, its pre-order position there. `documentScan` reads one document's
 * `Node` rows by T1's key, `(package, path, start)`: filtered by `package` and `path` and ordered
 * by `start`, it is one index range in document order, with no sort and no recursion, and its
 * workload handle's `page` pages it by that key. Each row carries its own characters (`Node.chars`:
 * a text or whitespace run's, an entity reference's `&name;`) and what its node owns, each as its
 * own attachment: its comment, instruction, doctype, foreign element's name and governing type (an
 * `ElementType` or an `OpenElementType`) at most once (each keyed by its node's key), the
 * document's `Document` row on the document node alone, with its XML declaration at most once and
 * the declaration's encoding and standalone at most once each (each keyed by the document's key),
 * and its attributes, open attributes and namespace declarations, sets, each delivered in its key's
 * order, which carries no meaning: the export writes them in Canonical XML's
 * (`#pantry/model/unshred.ts`). The arms stay apart, never a union, because an attachment over a
 * union is never paged.
 */
import { query, v } from "@bjornpagen/grizzle";
import type { InputOrigin, Term } from "@bjornpagen/grizzle";
import {
  Attribute,
  AttributeEntity,
  OpenAttribute,
  OpenAttributeEntity,
} from "#pantry/qti/attributes.ts";
import {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  Namespace,
  OpenElementName,
  OpenElementType,
  Pi,
  SdDecl,
  XmlDecl,
} from "#pantry/qti/chardata.ts";
import { EntryPath, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { ElementType, Node } from "#pantry/qti/node.ts";
import { Entry } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A parent variable of a text field: a document key's `package` or `path`, as `attach` mints it
 * from a parent's head (grizzle's `InputOrigin`).
 *
 * Each input type is concrete, never a type parameter, so a match or an equality on it fixes its
 * field in the evidence the attachments read, and each `"option"` arm's child is proved at most one
 * per parent. Over a type parameter that proof stays an unresolved conditional (the vendored
 * engine's `types/evidence/evidence.ts`, `DeliveryClaim`), and every `"option"` arm is refused.
 */
type TextInput = Term<string, unknown, InputOrigin, "text">;

/**
 * A parent variable of a `natural` field: a node's `start`, as `attach` mints it from a parent's
 * head, concrete for the reason {@link TextInput} is.
 */
type PositionInput = Term<bigint, unknown, InputOrigin, "bigint">;

/**
 * A document's key as parent variables: its package's manifest identifier and its path.
 */
interface DocumentInput {
  readonly package: TextInput;
  readonly path: TextInput;
}

/**
 * A node's key as parent variables: its document's key and its `start`.
 */
interface NodeInput extends DocumentInput {
  readonly start: PositionInput;
}

/**
 * Build a node's comment, at most one (`Comment` is keyed by its node's key).
 *
 * @param node - The node's key.
 * @returns The comment's text.
 */
const commentOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { value } = v(Comment, "comment");

    return r
      .match(Comment, { package: node.package, path: node.path, start: node.start, value })
      .find({ value });
  });

/**
 * Build a node's processing instruction, at most one (`Pi` is keyed by its node's key).
 *
 * @param node - The node's key.
 * @returns The instruction's target and data.
 */
const piOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { data, target } = v(Pi, "pi");

    return r
      .match(Pi, { data, package: node.package, path: node.path, start: node.start, target })
      .find({ data, target });
  });

/**
 * Build a node's doctype, at most one (`Doctype` is keyed by its node's key).
 *
 * @param node - The node's key.
 * @returns The doctype's text.
 */
const doctypeOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { value } = v(Doctype, "doctype");

    return r
      .match(Doctype, { package: node.package, path: node.path, start: node.start, value })
      .find({ value });
  });

/**
 * Build an element's governing type, at most one (`ElementType` is keyed by its node's key).
 *
 * @param node - The element's key.
 * @returns The type.
 */
const elementTypeOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { type } = v(ElementType, "elementType");

    return r
      .match(ElementType, { package: node.package, path: node.path, start: node.start, type })
      .find({ type });
  });

/**
 * Build a foreign element's governing open type, at most one (`OpenElementType` is keyed by its
 * node's key).
 *
 * @param node - The element's key.
 * @returns The open type.
 */
const openElementTypeOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { type } = v(OpenElementType, "openElementType");

    return r
      .match(OpenElementType, { package: node.package, path: node.path, start: node.start, type })
      .find({ type });
  });

/**
 * Build a foreign element's name, at most one (`OpenElementName` is keyed by its node's key).
 *
 * @param node - The element's key.
 * @returns The name's local part and namespace.
 */
const openElementNameOf = (node: NodeInput) =>
  query(Qti).rule((r) => {
    const { local, namespace } = v(OpenElementName, "openElementName");

    return r
      .match(OpenElementName, {
        local,
        namespace,
        package: node.package,
        path: node.path,
        start: node.start,
      })
      .find({ local, namespace });
  });

/**
 * Build a declaration's encoding, at most one (`EncodingDecl` is keyed by its document's key).
 *
 * @param document - The document's key.
 * @returns The encoding name.
 */
const encodingOf = (document: DocumentInput) =>
  query(Qti).rule((r) => {
    const { encoding } = v(EncodingDecl, "encodingDecl");

    return r
      .match(EncodingDecl, { encoding, package: document.package, path: document.path })
      .find({ encoding });
  });

/**
 * Build a declaration's standalone, at most one (`SdDecl` is keyed by its document's key).
 *
 * @param document - The document's key.
 * @returns The standalone value.
 */
const standaloneOf = (document: DocumentInput) =>
  query(Qti).rule((r) => {
    const { standalone } = v(SdDecl, "sdDecl");

    return r
      .match(SdDecl, { package: document.package, path: document.path, standalone })
      .find({ standalone });
  });

/**
 * Build a document's XML declaration, at most one (`XmlDecl` is keyed by its document's key), with
 * its encoding and its standalone, at most one each. The key is in the head, so each attachment
 * correlates to it, its own parent's variables.
 *
 * @param document - The document's key.
 * @returns The declaration's version, with `encoding` and `standalone` attached.
 */
const declarationOf = (document: DocumentInput) =>
  query(Qti)
    .rule((r) => {
      const { version } = v(XmlDecl, "xmlDecl");

      return r
        .match(XmlDecl, { package: document.package, path: document.path, version })
        .find({ package: document.package, path: document.path, version });
    })
    .attach("encoding", (declaration) => encodingOf(declaration), "option")
    .attach("standalone", (declaration) => standaloneOf(declaration), "option");

/**
 * Build the `Document` row of a node's document on the document node alone, at most one
 * (`Document` is keyed by the document's key), with its XML declaration attached. Every node of a
 * document shares that key, so the row is the document node's, the one node at `start` 0 (N1),
 * and every other node has none. The key is in the head, so the declaration correlates to it.
 *
 * @param node - The node's key.
 * @returns The document's charsets, with `declaration` attached.
 */
const documentRowOf = (node: NodeInput) =>
  query(Qti)
    .rule((r) => {
      const { charset, exportCharset } = v(Document, "documentRow");

      return r
        .match(Document, { charset, exportCharset, package: node.package, path: node.path })
        .where(r.eq(node.start, 0n))
        .find({ charset, exportCharset, package: node.package, path: node.path });
    })
    .attach("declaration", (document) => declarationOf(document), "option");

/**
 * Build an element's attributes of closed names, a set keyed by name, each with its entity
 * references by offset. An attribute keeps its key in its head, so its entity references correlate
 * to it, `(package, path, start, name)`: a nested attachment reads its own parent's head, never an
 * enclosing one's (the vendored engine's `query/build/attach.ts`, `runAttach`).
 *
 * @param node - The element's key.
 * @returns The attributes in key order, with `entities` attached.
 */
const attributesOf = (node: NodeInput) =>
  query(Qti)
    .rule((r) => {
      const { lexical, name, prefix } = v(Attribute, "attribute");

      return r
        .match(Attribute, {
          lexical,
          name,
          package: node.package,
          path: node.path,
          prefix,
          start: node.start,
        })
        .find({
          lexical,
          name,
          package: node.package,
          path: node.path,
          prefix,
          start: node.start,
        });
    })
    .attach(
      "entities",
      (attribute) =>
        query(Qti)
          .rule((r) => {
            const { entity, offset } = v(AttributeEntity, "attributeEntity");

            return r
              .match(AttributeEntity, {
                entity,
                name: attribute.name,
                offset,
                package: attribute.package,
                path: attribute.path,
                start: attribute.start,
              })
              .find({ entity, offset });
          })
          .orderBy(["offset", "asc"]),
      "array",
    )
    .orderBy(["name", "asc"]);

/**
 * Build an element's attributes of open names (`data-*`, foreign, no-namespace and own-namespace
 * attributes), a set keyed by expanded name, each with its class and its entity references by
 * offset, correlated to its key `(package, path, start, uri, local)` as {@link attributesOf}'s are.
 *
 * @param node - The element's key.
 * @returns The open attributes in key order, with `entities` attached.
 */
const openAttributesOf = (node: NodeInput) =>
  query(Qti)
    .rule((r) => {
      const { class: openClass, lexical, local, prefix, uri } = v(OpenAttribute, "openAttribute");

      return r
        .match(OpenAttribute, {
          class: openClass,
          lexical,
          local,
          package: node.package,
          path: node.path,
          prefix,
          start: node.start,
          uri,
        })
        .find({
          class: openClass,
          lexical,
          local,
          package: node.package,
          path: node.path,
          prefix,
          start: node.start,
          uri,
        });
    })
    .attach(
      "entities",
      (attribute) =>
        query(Qti)
          .rule((r) => {
            const { entity, offset } = v(OpenAttributeEntity, "openAttributeEntity");

            return r
              .match(OpenAttributeEntity, {
                entity,
                local: attribute.local,
                offset,
                package: attribute.package,
                path: attribute.path,
                start: attribute.start,
                uri: attribute.uri,
              })
              .find({ entity, offset });
          })
          .orderBy(["offset", "asc"]),
      "array",
    )
    .orderBy(["uri", "asc"], ["local", "asc"]);

/**
 * Build an element's namespace declarations, a set keyed by prefix.
 *
 * @param node - The element's key.
 * @returns The declarations' prefixes and URIs, in key order.
 */
const namespacesOf = (node: NodeInput) =>
  query(Qti)
    .rule((r) => {
      const { prefix, uri } = v(Namespace, "namespace");

      return r
        .match(Namespace, {
          package: node.package,
          path: node.path,
          prefix,
          start: node.start,
          uri,
        })
        .find({ prefix, uri });
    })
    .orderBy(["prefix", "asc"]);

/**
 * The scan of one document: its `Node` rows where `package = $package` and `path = $path`, ordered
 * by `start`, each with what its node owns attached (`#pantry/export/pages.ts` `ScanRow`), the arms
 * {@link documentScanOf} attaches.
 *
 * `package` and `path` are in the head so that the order completes to T1's key: fixed by their
 * parameters, they leave `start` alone as the order, a total one, which `WHERE package = $1 AND
 * path = $2 ORDER BY start` reads off T1's index (the engine's `logical/order.ts`,
 * `completeOrder`: a key's class fixed by a parameter needs no column of its own).
 */
export const documentScan = query(Qti)
  .rule((r) => {
    const {
      at,
      chars,
      end,
      kind,
      package: owner,
      parent,
      path,
      prefix,
      start,
      version,
    } = v(Node, "node");

    return r
      .match(Node, { at, chars, end, kind, package: owner, parent, path, prefix, start, version })
      .where(r.eq(owner, r.param("package", ManifestIdentifier)))
      .where(r.eq(path, r.param("path", EntryPath)))
      .find({ at, chars, end, kind, package: owner, parent, path, prefix, start, version });
  })
  .attach("comment", (node) => commentOf(node), "option")
  .attach("pi", (node) => piOf(node), "option")
  .attach("doctype", (node) => doctypeOf(node), "option")
  .attach("elementType", (node) => elementTypeOf(node), "option")
  .attach("openElementType", (node) => openElementTypeOf(node), "option")
  .attach("openElementName", (node) => openElementNameOf(node), "option")
  .attach("documentRow", (node) => documentRowOf(node), "option")
  .attach("attributes", (node) => attributesOf(node), "array")
  .attach("openAttributes", (node) => openAttributesOf(node), "array")
  .attach("namespaces", (node) => namespacesOf(node), "array")
  .orderBy(["start", "asc"]);

/**
 * Build the whole scan of the document `document` names, unpaged: its `Node` rows at that key,
 * ordered by `start`, with {@link documentScan}'s arms attached, so each row is a
 * `#pantry/export/pages.ts` `ScanRow`. An application attaches it inside its own read's
 * attachment, where the key's terms are in scope: `.attach("document", (served) =>
 * documentScanOf({ package: served.package, path: served.item }), "array")`.
 *
 * It is built in the attachment's callback, never imported whole: a parent variable reaches only
 * the top-level rules of its own attachment's child (`runAttach`), an ordered query has no `bind`,
 * and a bound query is a match source, which carries no attachment (`query/build/query.ts`).
 *
 * @param document - The document's key, parent variables of the read the scan attaches to.
 * @returns The ordered scan, which an attachment delivers as an `"array"`.
 */
export const documentScanOf = (document: DocumentInput) =>
  query(Qti)
    .rule((r) => {
      const { at, chars, end, kind, parent, prefix, start, version } = v(Node, "node");

      return r
        .match(Node, {
          at,
          chars,
          end,
          kind,
          package: document.package,
          parent,
          path: document.path,
          prefix,
          start,
          version,
        })
        .find({
          at,
          chars,
          end,
          kind,
          package: document.package,
          parent,
          path: document.path,
          prefix,
          start,
          version,
        });
    })
    .attach("comment", (node) => commentOf(node), "option")
    .attach("pi", (node) => piOf(node), "option")
    .attach("doctype", (node) => doctypeOf(node), "option")
    .attach("elementType", (node) => elementTypeOf(node), "option")
    .attach("openElementType", (node) => openElementTypeOf(node), "option")
    .attach("openElementName", (node) => openElementNameOf(node), "option")
    .attach("documentRow", (node) => documentRowOf(node), "option")
    .attach("attributes", (node) => attributesOf(node), "array")
    .attach("openAttributes", (node) => openAttributesOf(node), "array")
    .attach("namespaces", (node) => namespacesOf(node), "array")
    .orderBy(["start", "asc"]);

/**
 * The record of a package: every entry's path and its bytes, a set keyed by path, delivered in
 * path order, each with its document where the entry is one: the `Document` row at the entry's
 * package and path, the key they share ("Document entry" holds every document to an entry), which
 * is the parameter of the document's {@link documentScan}.
 *
 * `package` is in the head, fixed by its parameter, so the attachment correlates to it, as
 * {@link documentScan}'s `package` is.
 */
export const entriesOf = query(Qti)
  .rule((r) => {
    const { content, package: owner, path } = v(Entry, "entry");

    return r
      .match(Entry, { content, package: owner, path })
      .where(r.eq(owner, r.param("package", ManifestIdentifier)))
      .find({ content, package: owner, path });
  })
  .attach(
    "document",
    (entry) =>
      query(Qti).rule((r) => {
        const { path } = v(Document, "entryDocument");

        return r
          .match(Document, { package: entry.package, path })
          .where(r.eq(path, entry.path))
          .find({ path });
      }),
    "option",
  )
  .orderBy(["path", "asc"]);
