/**
 * The export's reads (fin.md §4.6, trees.md §3, plan N11; the W5 amendment's C20): one ordered
 * scan per document, and the documents and entries of a package, each built over the `Qti` schema
 * value it is handed. The author login's export workload (`#pantry/qti/logins.ts` `authorLogin`)
 * holds all three, so each is compiled once per pool and its indexes are planned by
 * `grizzle generate`.
 *
 * Each query is written over the schema, never over a role: a role that holds every table of `Qti`
 * whole runs every query over `Qti`, so the author role runs them, and so does a role over an
 * app's level above `Qti` that holds `Qti`'s tables whole. A query written over a role runs on that
 * role only.
 *
 * The scan reads one document's `Node` rows by T1's key, `(document, start)`: filtered by
 * `document` and ordered by `start`, it is one index range in document order, with no sort and no
 * recursion, and `db.page` pages it by that key. Each row carries its own characters (`Node.chars`:
 * a text or whitespace run's, an entity reference's `&name;`) and what its node owns, each as its
 * own attachment: its comment, instruction, doctype, `Document` row and foreign element's name at
 * most once (each keyed by its node), the `Document` row with its XML declaration at most once
 * and the declaration with its encoding and standalone at most once each, and its attribute and
 * namespace families as lists in `at` order. The arms stay apart, never a union, because an
 * attachment over a union is never paged.
 */
import { paged, query, uuid, v } from "@bjornpagen/grizzle";
import { Function as Fn } from "effect";
import { Attribute, AttributeEntity, OpenAttributeName } from "#pantry/qti/attributes.ts";
import {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  Namespace,
  OpenElementName,
  Pi,
  SdDecl,
  XmlDecl,
} from "#pantry/qti/chardata.ts";
import { Node } from "#pantry/qti/node.ts";
import { Entry } from "#pantry/qti/package.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the scan of one document over a `Qti` schema: its `Node` rows where
 * `document = $document`, ordered by `start`, each with what its node owns attached
 * (`#pantry/export/pages.ts` `ScanRow`).
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
 *
 * Built once per schema value, so the export workload and a caller that explains or runs the scan
 * hold the one query.
 *
 * @param qti - The `Qti` schema the scan reads (`#pantry/qti/schema.ts` `qti`).
 * @returns The scan, with its `document` parameter.
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L2097-L2105
 */
export const documentScanOf = Fn.memoize((qti: QtiSchema) =>
  query(qti)
    .rule((r) => {
      const { at, chars, document, end, governs, id, kind, parent, prefix, start, version } = v(
        Node,
        "node",
      );

      return r
        .match(Node, {
          at,
          chars,
          document,
          end,
          governs,
          id,
          kind,
          parent,
          prefix,
          start,
          version,
        })
        .where(r.eq(document, r.param("document", uuid)))
        .find({ at, chars, document, end, governs, id, kind, parent, prefix, start, version });
    })
    .attach(
      "comment",
      (node) =>
        query(qti).rule((r) => {
          const { value } = v(Comment, "comment");

          return r.match(Comment, { node: node.id, value }).find({ value });
        }),
      "option",
    )
    .attach(
      "pi",
      (node) =>
        query(qti).rule((r) => {
          const { data, target } = v(Pi, "pi");

          return r.match(Pi, { data, node: node.id, target }).find({ data, target });
        }),
      "option",
    )
    .attach(
      "doctype",
      (node) =>
        query(qti).rule((r) => {
          const { value } = v(Doctype, "doctype");

          return r.match(Doctype, { node: node.id, value }).find({ value });
        }),
      "option",
    )
    .attach(
      "openElementName",
      (node) =>
        query(qti).rule((r) => {
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
        query(qti)
          .rule((r) => {
            const { charset, exportCharset } = v(Document, "documentRow");

            return r
              .match(Document, { charset, exportCharset, node: node.id })
              .find({ charset, exportCharset, node: node.id });
          })
          .attach(
            "declaration",
            (document) =>
              query(qti)
                .rule((r) => {
                  const { version } = v(XmlDecl, "xmlDecl");

                  return r
                    .match(XmlDecl, { node: document.node, version })
                    .find({ node: document.node, version });
                })
                .attach(
                  "encoding",
                  (declaration) =>
                    query(qti).rule((r) => {
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
                    query(qti).rule((r) => {
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
        query(qti)
          .rule((r) => {
            const { at, id, lexical, name, prefix } = v(Attribute, "attribute");

            return r
              .match(Attribute, { at, id, lexical, name, node: node.id, prefix })
              .find({ at, id, lexical, name, node: node.id, prefix });
          })
          .attach(
            "entities",
            (attribute) =>
              query(qti)
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
              query(qti)
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
        query(qti)
          .rule((r) => {
            const { at, prefix, uri } = v(Namespace, "namespace");

            return r.match(Namespace, { at, node: node.id, prefix, uri }).find({ at, prefix, uri });
          })
          .orderBy(["at", "asc"]),
      "array",
    )
    .orderBy(["start", "asc"]),
);

/**
 * Build the documents of a package over a `Qti` schema: each `Document` row's node, which is the
 * document's id and the parameter of its scan ({@link documentScanOf}), and its entry path.
 *
 * @param qti - The `Qti` schema the query reads.
 * @returns The query, with its `package` parameter.
 */
const documentsQuery = (qti: QtiSchema) =>
  query(qti).rule((r) => {
    const { node, path } = v(Document, "document");

    return r
      .match(Document, { node, package: r.param("package", uuid), path })
      .find({ node, path });
  });

/**
 * Build the record of a package over a `Qti` schema: every entry's path and its bytes, in listing
 * order, the `Entry` family's `at`.
 *
 * @param qti - The `Qti` schema the query reads.
 * @returns The query, with its `package` parameter.
 */
const entriesQuery = (qti: QtiSchema) =>
  query(qti)
    .rule((r) => {
      const { at, content, path } = v(Entry, "entry");

      return r
        .match(Entry, { at, content, package: r.param("package", uuid), path })
        .find({ at, content, path });
    })
    .orderBy(["at", "asc"]);

/**
 * Build the author workload's export reads over a `Qti` schema: one document's ordered scan,
 * `documentScan`, which the export pages; the documents of a package, `documentsOf`; and a
 * package's record, `entriesOf`. A `Db` opened on the author login runs them as
 * `db.workload.documentScan`, `db.workload.documentsOf` and `db.workload.entriesOf`.
 *
 * Built once per schema value, so the login's workload holds the queries {@link documentScanOf}
 * gives.
 *
 * @param qti - The `Qti` schema the queries read.
 * @returns The workload's record of named queries.
 */
export const authorReadsOf = Fn.memoize((qti: QtiSchema) => ({
  documentScan: paged(documentScanOf(qti)),
  documentsOf: documentsQuery(qti),
  entriesOf: entriesQuery(qti),
}));
