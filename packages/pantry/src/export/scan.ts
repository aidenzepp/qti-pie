/**
 * The export's reads (fin.md §4.6, trees.md §3, plan N11; the W5 amendment's C20): one ordered
 * scan per document, and the documents and entries of a package. The author login's workload
 * (`#pantry/qti/logins.ts`, `exportWork`) holds all three, so each is compiled once per pool and
 * its indexes are planned by `grizzle generate`.
 *
 * `documentScan` reads one document's `Node` rows by T1's key, `(document, start)`: filtered by
 * `document` and ordered by `start`, it is one index range in document order, with no sort and no
 * recursion, and `db.page` pages it by that key. Each row carries its own characters (`Node.chars`:
 * a text or whitespace run's, an entity reference's `&name;`) and what its node owns, each as its
 * own attachment: its comment, instruction, doctype, `Document` row, foreign element's name and
 * governing type (an `ElementType` or an `OpenElementType`) at most once (each keyed by its
 * node), the `Document` row with its XML declaration at most once
 * and the declaration with its encoding and standalone at most once each, and its attribute and
 * namespace families as lists in `at` order. The arms stay apart, never a union, because an
 * attachment over a union is never paged.
 */
import { query, uuid, v } from "@bjornpagen/grizzle";
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
import { Author } from "#pantry/qti/roles.ts";

/**
 * The scan of one document: its `Node` rows where `document = $document`, ordered by `start`, each
 * with what its node owns attached (`#pantry/export/pages.ts` `ScanRow`).
 *
 * An attribute is correlated to its element by `node` and keeps it in its head, so its own
 * families, its entity references and its open name, correlate to it by `(node, id)`, the
 * attribute's key: a nested attachment reads its own parent's head, never an enclosing one's (the
 * vendored engine's `query/build/attach.ts`, `runAttach`). Every list is ordered by its family's
 * `at`, which with its owner fixed is the family's key, so the list's order is the one the
 * attachment delivers (grizzle's `adapter/reader/execution.ts`: a child's rows stitch in its
 * completed order).
 *
 * `document` is in the head so that the order completes to T1's key: fixed by its parameter, it
 * leaves `start` alone as the order, a total one, which `WHERE document = $1 ORDER BY start` reads
 * off T1's index (the engine's `logical/order.ts`, `completeOrder`: a key's class fixed by a
 * parameter needs no column of its own).
 */
export const documentScan = query(Author)
  .rule((r) => {
    const { at, chars, document, end, id, kind, parent, prefix, start, version } = v(Node, "node");

    return r
      .match(Node, { at, chars, document, end, id, kind, parent, prefix, start, version })
      .where(r.eq(document, r.param("document", uuid)))
      .find({ at, chars, document, end, id, kind, parent, prefix, start, version });
  })
  .attach(
    "comment",
    (node) =>
      query(Author).rule((r) => {
        const { value } = v(Comment, "comment");

        return r.match(Comment, { node: node.id, value }).find({ value });
      }),
    "option",
  )
  .attach(
    "pi",
    (node) =>
      query(Author).rule((r) => {
        const { data, target } = v(Pi, "pi");

        return r.match(Pi, { data, node: node.id, target }).find({ data, target });
      }),
    "option",
  )
  .attach(
    "doctype",
    (node) =>
      query(Author).rule((r) => {
        const { value } = v(Doctype, "doctype");

        return r.match(Doctype, { node: node.id, value }).find({ value });
      }),
    "option",
  )
  .attach(
    "elementType",
    (node) =>
      query(Author).rule((r) => {
        const { type } = v(ElementType, "elementType");

        return r.match(ElementType, { node: node.id, type }).find({ type });
      }),
    "option",
  )
  .attach(
    "openElementType",
    (node) =>
      query(Author).rule((r) => {
        const { type } = v(OpenElementType, "openElementType");

        return r.match(OpenElementType, { node: node.id, type }).find({ type });
      }),
    "option",
  )
  .attach(
    "openElementName",
    (node) =>
      query(Author).rule((r) => {
        const { local, namespace } = v(OpenElementName, "openElementName");

        return r
          .match(OpenElementName, { local, namespace, node: node.id })
          .find({ local, namespace });
      }),
    "option",
  )
  .attach(
    "documentRow",
    (node) =>
      query(Author)
        .rule((r) => {
          const { charset, exportCharset } = v(Document, "documentRow");

          return r
            .match(Document, { charset, exportCharset, node: node.id })
            .find({ charset, exportCharset, node: node.id });
        })
        .attach(
          "declaration",
          (document) =>
            query(Author)
              .rule((r) => {
                const { version } = v(XmlDecl, "xmlDecl");

                return r
                  .match(XmlDecl, { node: document.node, version })
                  .find({ node: document.node, version });
              })
              .attach(
                "encoding",
                (declaration) =>
                  query(Author).rule((r) => {
                    const { encoding } = v(EncodingDecl, "encodingDecl");

                    return r
                      .match(EncodingDecl, { encoding, node: declaration.node })
                      .find({ encoding });
                  }),
                "option",
              )
              .attach(
                "standalone",
                (declaration) =>
                  query(Author).rule((r) => {
                    const { standalone } = v(SdDecl, "sdDecl");

                    return r
                      .match(SdDecl, { node: declaration.node, standalone })
                      .find({ standalone });
                  }),
                "option",
              ),
          "option",
        ),
    "option",
  )
  .attach(
    "attributes",
    (node) =>
      query(Author)
        .rule((r) => {
          const { at, id, lexical, name, prefix } = v(Attribute, "attribute");

          return r
            .match(Attribute, { at, id, lexical, name, node: node.id, prefix })
            .find({ at, id, lexical, name, node: node.id, prefix });
        })
        .attach(
          "entities",
          (attribute) =>
            query(Author)
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
            query(Author)
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
        .orderBy(["at", "asc"]),
    "array",
  )
  .attach(
    "namespaces",
    (node) =>
      query(Author)
        .rule((r) => {
          const { at, prefix, uri } = v(Namespace, "namespace");

          return r.match(Namespace, { at, node: node.id, prefix, uri }).find({ at, prefix, uri });
        })
        .orderBy(["at", "asc"]),
    "array",
  )
  .orderBy(["start", "asc"]);

/**
 * The documents of a package: each `Document` row's node, which is the document's id and the
 * parameter of its {@link documentScan}, and its entry path.
 */
export const documentsOf = query(Author).rule((r) => {
  const { node, path } = v(Document, "document");

  return r.match(Document, { node, package: r.param("package", uuid), path }).find({ node, path });
});

/**
 * The record of a package: every entry's path and its bytes, in listing order, the `Entry`
 * family's `at`.
 */
export const entriesOf = query(Author)
  .rule((r) => {
    const { at, content, path } = v(Entry, "entry");

    return r
      .match(Entry, { at, content, package: r.param("package", uuid), path })
      .find({ at, content, path });
  })
  .orderBy(["at", "asc"]);
