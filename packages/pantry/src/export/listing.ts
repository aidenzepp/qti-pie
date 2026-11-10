/**
 * The listing queries (GOAL "Summary", the listing queries): the stored packages, and one package's
 * documents, each an ordered query written over the `Qti` schema value it is handed, so that
 * grizzle pages it by its order. The author login's export workload holds both as paged members
 * (`#pantry/export/scan.ts` `authorReadsOf`), so each is compiled once per pool and its access path
 * earns its index from `grizzle generate`; `#pantry/api/list.ts` pages them for an app.
 *
 * Each is written over the schema, never over a role, for the reason `#pantry/export/scan.ts`
 * gives: a role that holds every table of `Qti` whole runs every query over `Qti`.
 */
import { query, uuid, v } from "@bjornpagen/grizzle";
import { Function as Fn } from "effect";
import { Document } from "#pantry/qti/chardata.ts";
import { Package } from "#pantry/qti/package.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the package listing over a `Qti` schema: every `Package` row's id and name, ordered by
 * `id`, the relation's key, so the order is total and grizzle pages it with no tie to complete.
 *
 * @param qti - The `Qti` schema the query reads.
 * @returns The ordered query, with no parameter.
 */
const packagesQuery = (qti: QtiSchema) =>
  query(qti)
    .rule((r) => {
      const { id, name } = v(Package, "package");

      return r.match(Package, { id, name }).find({ id, name });
    })
    .orderBy(["id", "asc"]);

/**
 * Build the document listing of one package over a `Qti` schema: each `Document` row of the
 * package, its node (the document's id), its entry path, the manifest resource type that names it
 * and its root element's kind, ordered by `path`.
 *
 * `package` is in the head so that the order is total by `path` alone: `(package, path)` is a key
 * of `Document` (`#pantry/qti/package.ts`), and with `package` fixed by its parameter, `path`
 * settles it, so grizzle appends no tie-breaking column and reads the order off that key's index
 * (the engine's `logical/order.ts`, `completeOrder`: a key's class fixed by a parameter needs no
 * column of its own).
 *
 * @param qti - The `Qti` schema the query reads.
 * @returns The ordered query, with its `package` parameter.
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/packages/engine/src/logical/order.ts
 */
const documentsQuery = (qti: QtiSchema) =>
  query(qti)
    .rule((r) => {
      const { node, package: pkg, path, resourceType, rootKind } = v(Document, "document");

      return r
        .match(Document, { node, package: pkg, path, resourceType, rootKind })
        .where(r.eq(pkg, r.param("package", uuid)))
        .find({ node, package: pkg, path, resourceType, rootKind });
    })
    .orderBy(["path", "asc"]);

/**
 * Build the listing queries over a `Qti` schema: `packages`, the stored packages by id, and
 * `documents`, one package's documents by path.
 *
 * Built once per schema value, so the author login's workload and `#pantry/api/list.ts` hold the
 * one pair of queries, and a page's cursor, which grizzle ties to its query, is the workload's.
 *
 * @param qti - The `Qti` schema the queries read (`#pantry/qti/schema.ts` `qti`).
 * @returns The record of the two ordered queries.
 */
export const listingQueriesOf = Fn.memoize((qti: QtiSchema) => ({
  documents: documentsQuery(qti),
  packages: packagesQuery(qti),
}));
