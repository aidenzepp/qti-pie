/**
 * The export's reads (fin.md §4.6, trees.md §3, plan N11; the W5 amendment's C20): one ordered
 * scan per document, and a package's entries, each with its document where it is one: plain
 * grizzle queries over `Qti`, which any role holding `Qti`'s relations whole runs. The author
 * login's workload (`#pantry/qti/logins.ts` `AuthorApp`) holds both, so `grizzle generate`
 * compiles each into the login's served file and plans its indexes; an application's own login may
 * hold them, or read `Qti`'s relations with queries of its own.
 *
 * `documentScan` reads one document's `Node` rows by T1's key, `(document, start)`: filtered by
 * `document` and ordered by `start`, it is one index range in document order, with no sort and no
 * recursion, and its workload handle's `page` pages it by that key. Each row carries its own
 * characters (`Node.chars`: a text or whitespace run's, an entity reference's `&name;`) and what
 * its node owns, each as its own attachment: its comment, instruction, doctype, `Document` row,
 * foreign element's name and governing type (an `ElementType` or an `OpenElementType`) at most once
 * (each keyed by its node), the `Document` row with its XML declaration at most once and the
 * declaration with its encoding and standalone at most once each, and its attribute and namespace
 * families as lists in `at` order. The arms stay apart, never a union, because an attachment over a
 * union is never paged.
 */
import { query, uuid, v } from "@bjornpagen/grizzle";
import type { InputOrigin, Term, Uuid } from "@bjornpagen/grizzle";
import { Attribute, AttributeEntity, OpenAttributeName } from "#pantry/qti/attributes.ts";
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
import { ElementType, Node } from "#pantry/qti/node.ts";
import { Entry } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * A parent variable of type `uuid`: the term `attach` mints from a parent's head, which each arm
 * of the scan correlates to and {@link documentScanOf} filters by (grizzle's `InputOrigin`).
 *
 * The type is concrete, never a type parameter, so a match or an equality on it fixes its field in
 * the evidence the attachments read, and each `"option"` arm's child is proved at most one per
 * parent. Over a type parameter that proof stays an unresolved conditional (the vendored engine's
 * `types/evidence/evidence.ts`, `DeliveryClaim`), and every `"option"` arm is refused.
 */
type UuidInput = Term<Uuid, unknown, InputOrigin, "uuid">;

/**
 * Build a node's comment, at most one (`Comment` is keyed by its node).
 *
 * @param node - The node's id.
 * @returns The comment's text.
 */
const commentOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { value } = v(Comment, "comment");

    return r.match(Comment, { node, value }).find({ value });
  });

/**
 * Build a node's processing instruction, at most one (`Pi` is keyed by its node).
 *
 * @param node - The node's id.
 * @returns The instruction's target and data.
 */
const piOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { data, target } = v(Pi, "pi");

    return r.match(Pi, { data, node, target }).find({ data, target });
  });

/**
 * Build a node's doctype, at most one (`Doctype` is keyed by its node).
 *
 * @param node - The node's id.
 * @returns The doctype's text.
 */
const doctypeOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { value } = v(Doctype, "doctype");

    return r.match(Doctype, { node, value }).find({ value });
  });

/**
 * Build an element's governing type, at most one (`ElementType` is keyed by its node).
 *
 * @param node - The element's id.
 * @returns The type.
 */
const elementTypeOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { type } = v(ElementType, "elementType");

    return r.match(ElementType, { node, type }).find({ type });
  });

/**
 * Build a foreign element's governing open type, at most one (`OpenElementType` is keyed by its
 * node).
 *
 * @param node - The element's id.
 * @returns The open type.
 */
const openElementTypeOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { type } = v(OpenElementType, "openElementType");

    return r.match(OpenElementType, { node, type }).find({ type });
  });

/**
 * Build a foreign element's name, at most one (`OpenElementName` is keyed by its node).
 *
 * @param node - The element's id.
 * @returns The name's local part and namespace.
 */
const openElementNameOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { local, namespace } = v(OpenElementName, "openElementName");

    return r.match(OpenElementName, { local, namespace, node }).find({ local, namespace });
  });

/**
 * Build a declaration's encoding, at most one (`EncodingDecl` is keyed by its node).
 *
 * @param node - The document's id.
 * @returns The encoding name.
 */
const encodingOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { encoding } = v(EncodingDecl, "encodingDecl");

    return r.match(EncodingDecl, { encoding, node }).find({ encoding });
  });

/**
 * Build a declaration's standalone, at most one (`SdDecl` is keyed by its node).
 *
 * @param node - The document's id.
 * @returns The standalone value.
 */
const standaloneOf = (node: UuidInput) =>
  query(Qti).rule((r) => {
    const { standalone } = v(SdDecl, "sdDecl");

    return r.match(SdDecl, { node, standalone }).find({ standalone });
  });

/**
 * Build a document's XML declaration, at most one (`XmlDecl` is keyed by its node), with its
 * encoding and its standalone, at most one each. `node` is in the head, so each attachment
 * correlates to it, its own parent's variable.
 *
 * @param node - The document's id.
 * @returns The declaration's version, with `encoding` and `standalone` attached.
 */
const declarationOf = (node: UuidInput) =>
  query(Qti)
    .rule((r) => {
      const { version } = v(XmlDecl, "xmlDecl");

      return r.match(XmlDecl, { node, version }).find({ node, version });
    })
    .attach("encoding", (declaration) => encodingOf(declaration.node), "option")
    .attach("standalone", (declaration) => standaloneOf(declaration.node), "option");

/**
 * Build a document node's `Document` row, at most one (`Document` is keyed by its node), with its
 * XML declaration attached. `node` is in the head, so the declaration correlates to it.
 *
 * @param node - The node's id.
 * @returns The document's charsets, with `declaration` attached.
 */
const documentRowOf = (node: UuidInput) =>
  query(Qti)
    .rule((r) => {
      const { charset, exportCharset } = v(Document, "documentRow");

      return r
        .match(Document, { charset, exportCharset, node })
        .find({ charset, exportCharset, node });
    })
    .attach("declaration", (document) => declarationOf(document.node), "option");

/**
 * Build an element's attributes in `at` order, each with its entity references and its open name
 * in `at` order. An attribute keeps its element in its head, so its own families correlate to it
 * by `(node, id)`, the attribute's key: a nested attachment reads its own parent's head, never an
 * enclosing one's (the vendored engine's `query/build/attach.ts`, `runAttach`).
 *
 * @param node - The element's id.
 * @returns The attributes, with `entities` and `openName` attached.
 */
const attributesOf = (node: UuidInput) =>
  query(Qti)
    .rule((r) => {
      const { at, id, lexical, name, prefix } = v(Attribute, "attribute");

      return r
        .match(Attribute, { at, id, lexical, name, node, prefix })
        .find({ at, id, lexical, name, node, prefix });
    })
    .attach(
      "entities",
      (attribute) =>
        query(Qti)
          .rule((r) => {
            const { at, name, offset } = v(AttributeEntity, "attributeEntity");

            return r
              .match(AttributeEntity, {
                at,
                attribute: attribute.id,
                name,
                node: attribute.node,
                offset,
              })
              .find({ at, name, offset });
          })
          .orderBy(["at", "asc"]),
      "array",
    )
    .attach(
      "openName",
      (attribute) =>
        query(Qti)
          .rule((r) => {
            const { at, local, uri } = v(OpenAttributeName, "openAttributeName");

            return r
              .match(OpenAttributeName, {
                at,
                attribute: attribute.id,
                local,
                node: attribute.node,
                uri,
              })
              .find({ at, local, uri });
          })
          .orderBy(["at", "asc"]),
      "array",
    )
    .orderBy(["at", "asc"]);

/**
 * Build an element's namespace declarations in `at` order.
 *
 * @param node - The element's id.
 * @returns The declarations' prefixes and URIs.
 */
const namespacesOf = (node: UuidInput) =>
  query(Qti)
    .rule((r) => {
      const { at, prefix, uri } = v(Namespace, "namespace");

      return r.match(Namespace, { at, node, prefix, uri }).find({ at, prefix, uri });
    })
    .orderBy(["at", "asc"]);

/**
 * The scan of one document: its `Node` rows where `document = $document`, ordered by `start`,
 * each with what its node owns attached (`#pantry/export/pages.ts` `ScanRow`), the arms
 * {@link documentScanOf} attaches.
 *
 * Every list is ordered by its family's `at`, which with its owner fixed is the family's key, so
 * the list's order is the one the attachment delivers (grizzle's `adapter/reader/execution.ts`: a
 * child's rows stitch in its completed order).
 *
 * `document` is in the head so that the order completes to T1's key: fixed by its parameter, it
 * leaves `start` alone as the order, a total one, which `WHERE document = $1 ORDER BY start`
 * reads off T1's index (the engine's `logical/order.ts`, `completeOrder`: a key's class fixed by
 * a parameter needs no column of its own).
 */
export const documentScan = query(Qti)
  .rule((r) => {
    const { at, chars, document, end, id, kind, parent, prefix, start, version } = v(Node, "node");

    return r
      .match(Node, { at, chars, document, end, id, kind, parent, prefix, start, version })
      .where(r.eq(document, r.param("document", uuid)))
      .find({ at, chars, document, end, id, kind, parent, prefix, start, version });
  })
  .attach("comment", (node) => commentOf(node.id), "option")
  .attach("pi", (node) => piOf(node.id), "option")
  .attach("doctype", (node) => doctypeOf(node.id), "option")
  .attach("elementType", (node) => elementTypeOf(node.id), "option")
  .attach("openElementType", (node) => openElementTypeOf(node.id), "option")
  .attach("openElementName", (node) => openElementNameOf(node.id), "option")
  .attach("documentRow", (node) => documentRowOf(node.id), "option")
  .attach("attributes", (node) => attributesOf(node.id), "array")
  .attach("namespaces", (node) => namespacesOf(node.id), "array")
  .orderBy(["start", "asc"]);

/**
 * Build the whole scan of the document `document` names, unpaged: its `Node` rows where
 * `document` is that term, ordered by `start`, with {@link documentScan}'s arms attached, so each
 * row is a `#pantry/export/pages.ts` `ScanRow`. An application attaches it inside its own read's
 * attachment, where the term is in scope: `.attach("document", (served) =>
 * documentScanOf(served.item), "array")`.
 *
 * It is built in the attachment's callback, never imported whole: a parent variable reaches only
 * the top-level rules of its own attachment's child (`runAttach`), an ordered query has no `bind`,
 * and a bound query is a match source, which carries no attachment (`query/build/query.ts`).
 *
 * @param document - The document's id, a parent variable of the read the scan attaches to.
 * @returns The ordered scan, which an attachment delivers as an `"array"`.
 */
export const documentScanOf = (document: UuidInput) =>
  query(Qti)
    .rule((r) => {
      const {
        at,
        chars,
        document: owner,
        end,
        id,
        kind,
        parent,
        prefix,
        start,
        version,
      } = v(Node, "node");

      return r
        .match(Node, { at, chars, document: owner, end, id, kind, parent, prefix, start, version })
        .where(r.eq(owner, document))
        .find({ at, chars, document: owner, end, id, kind, parent, prefix, start, version });
    })
    .attach("comment", (node) => commentOf(node.id), "option")
    .attach("pi", (node) => piOf(node.id), "option")
    .attach("doctype", (node) => doctypeOf(node.id), "option")
    .attach("elementType", (node) => elementTypeOf(node.id), "option")
    .attach("openElementType", (node) => openElementTypeOf(node.id), "option")
    .attach("openElementName", (node) => openElementNameOf(node.id), "option")
    .attach("documentRow", (node) => documentRowOf(node.id), "option")
    .attach("attributes", (node) => attributesOf(node.id), "array")
    .attach("namespaces", (node) => namespacesOf(node.id), "array")
    .orderBy(["start", "asc"]);

/**
 * The record of a package: every entry's path and its bytes, in listing order, the `Entry`
 * family's `at`, each with its document where the entry is one: the `Document` row at the
 * entry's package and path, keyed there ("Document entry" holds every document to an entry),
 * whose node is the document's id and the parameter of its {@link documentScan}.
 *
 * `package` is in the head, fixed by its parameter, so the attachment correlates to it, as
 * {@link documentScan}'s `document` is.
 */
export const entriesOf = query(Qti)
  .rule((r) => {
    const { at, content, package: owner, path } = v(Entry, "entry");

    return r
      .match(Entry, { at, content, package: owner, path })
      .where(r.eq(owner, r.param("package", uuid)))
      .find({ at, content, package: owner, path });
  })
  .attach(
    "document",
    (entry) =>
      query(Qti).rule((r) => {
        const { node } = v(Document, "entryDocument");

        return r.match(Document, { node, package: entry.package, path: entry.path }).find({ node });
      }),
    "option",
  )
  .orderBy(["at", "asc"]);
