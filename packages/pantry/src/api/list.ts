/**
 * The listing programs: the stored packages, and one package's documents, each one grizzle page at
 * a time over the author login's paged listing queries (`#pantry/export/listing.ts`).
 *
 * A page is grizzle's `Page`: its rows as edges, each with its cursor, and its `pageInfo`. An app
 * asks for the first page with `{ first: n }` and for the next with `{ first: n, after }`, `after`
 * being the page's `pageInfo.endCursor` while `pageInfo.hasNextPage` holds; `{ last: n }` and `{
 * last: n, before }` page backwards from `startCursor` the same way. A cursor belongs to the query
 * that made it, so a cursor from one listing handed to the other fails with grizzle's
 * `CursorError`. Each page is read in a snapshot of its own, so the pages of a listing see each
 * other's later writes.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/packages/engine/src/types/page/page.ts
 */
import { Db } from "@bjornpagen/grizzle";
import type {
  CursorError,
  DbLayer,
  Fact,
  OpenError,
  Page,
  PageRequest,
  ReadError,
  Uuid,
} from "@bjornpagen/grizzle";
import { Effect } from "effect";
import type { listingQueriesOf } from "#pantry/export/listing.ts";
import type { Document } from "#pantry/qti/chardata.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import type { Package } from "#pantry/qti/package.ts";
import type { AuthorRole } from "#pantry/qti/roles.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * One stored package as the package listing gives it: its id and the name of the directory or zip
 * it was read from, each a published field of `Package`.
 */
export type PackageListing = Pick<Fact<typeof Package>, "id" | "name">;

/**
 * One document of a package as the document listing gives it: its node, which is the document's id,
 * its package, its entry path, the manifest resource type that names it and its root element's
 * kind, each a published field of `Document`.
 */
export type DocumentListing = Pick<
  Fact<typeof Document>,
  "node" | "package" | "path" | "resourceType" | "rootKind"
>;

/**
 * The listing queries, whose types a page's cursors carry.
 */
type Listings = ReturnType<typeof listingQueriesOf>;

/**
 * One page of the package listing, ordered by package id.
 */
export type PackagePage = Page<PackageListing, Listings["packages"]>;

/**
 * One page of a package's document listing, ordered by entry path.
 */
export type DocumentPage = Page<DocumentListing, Listings["documents"]>;

/**
 * What can stop a listing page: the database refusing the author login's session (`OpenError`) or
 * the read (`ReadError`), or a request whose cursor this listing did not make (`CursorError`).
 */
export type ListError = OpenError | ReadError | CursorError;

/**
 * Read one page of the stored packages, ordered by id.
 *
 * @param request - Which page: `{ first: n }` for the first, then `{ first: n, after }` with the
 *   previous page's `pageInfo.endCursor` for each next one while `pageInfo.hasNextPage` holds.
 * @returns The page of packages, with its cursors.
 */
export const listPackages = Effect.fn("api.listPackages")(function* listPackages(
  request: PageRequest,
): Effect.fn.Return<PackagePage, ListError, DbLayer<AuthorRole>> {
  const db = yield* Db.open(authorLogin(qti()).roles.author, {});

  return yield* db.workload.packages.page({}, request);
});

/**
 * Read one page of a package's documents, ordered by entry path. A package with no documents, or
 * none stored under `packageId`, gives an empty page.
 *
 * @param packageId - The package whose documents are listed, a `PackageListing` id.
 * @param request - Which page: `{ first: n }` for the first, then `{ first: n, after }` with the
 *   previous page's `pageInfo.endCursor` for each next one while `pageInfo.hasNextPage` holds.
 * @returns The page of the package's documents, with its cursors.
 */
export const listDocuments = Effect.fn("api.listDocuments")(function* listDocuments(
  packageId: Uuid,
  request: PageRequest,
): Effect.fn.Return<DocumentPage, ListError, DbLayer<AuthorRole>> {
  yield* Effect.annotateCurrentSpan({ packageId });

  const db = yield* Db.open(authorLogin(qti()).roles.author, {});

  return yield* db.workload.documents.page({ package: packageId }, request);
});
