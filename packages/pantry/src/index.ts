/**
 * The public surface of `@qti-pie/pantry`, published through the `exports` map in `package.json`:
 * the schema an app builds its own level over, the author role and login its connection serves,
 * the programs that store, read and list QTI 3.0 packages, the relations an app may reference, and
 * their types and errors.
 *
 * Schema and access: `qti` builds pantry's `Qti` level on its first call and returns that one value
 * after, `authorRole` and `authorLogin` give the author role and the `author_app` login over it,
 * and `singleCdn` builds the refuse-only `Cdn` level over a base, its options decoded with the
 * `CdnOptions` schema (there is no `CdnOptions` type: read it as `typeof CdnOptions.Type`), and
 * `packageMedia` builds the refuse-only `Media` level over a base, its options decoded with the
 * `MediaOptions` schema (read as `typeof MediaOptions.Type`). The
 * published relations (`Package`, `Entry`, `Document`, `TestDocument`, `Named`, `Section`,
 * `TestFlag`, `SectionSelection`, `SectionMember`, `ItemRefDocument`, `DeclarationIdentifier`,
 * `ReferencePath` and the `BaseType` roster) are the ones an app's own level references, and
 * `publishedRelations` records each one's key and published fields, whose rows `PublishedRow`
 * types; every other relation and field is internal. A `BaseType` handle is typed as a plain
 * `string`, so `PublishedRow<"BaseType">` does not narrow its `id` to the roster's handles.
 *
 * Runtime: the programs that read or write the database run on the author login. An app provides
 * the login's `DbLayer<AuthorRole>` and, beside it, `ServedAuthorLogin`: the login served from its
 * committed served file (grizzle's `served`), which that layer is built over and whose author role
 * each program opens its `Db` on. It is the one thing an app provides beside its layer.
 *
 * Programs: `parsePackage` reads and parses a package once, `importPackage` stores a package and
 * `previewPackage` reads it without a database, each succeeding with a verdict (`ParseVerdict`,
 * `ImportVerdict`, `PreviewVerdict`) that carries a `Refusal` when the package is refused, so a
 * refusal is a value and never an error. Each takes a `PackageSource`: a path, a zip archive's
 * bytes, or the `ParsedPackage` a parse gave, whose files and referenced paths an app reads, and
 * of which the import and the preview read nothing again. `exportPackage` gives a stored package's
 * entries, `readDocument` one document's bytes, and `listPackages` and `listDocuments` page what
 * is stored. `documentScanOf` is the document scan an app may run in its own role, and
 * `documentXml` writes the scan's rows as XML with no database. The programs fail only with what is
 * not about the package: the platform's or grizzle's own error, or pantry's `PackageNotFound`,
 * `DocumentNotFound`, `CommitUnresolved`, and the write errors a document's rows can raise
 * (`DocumentRowCount`, `XmlVersionUnread`, `AssembleError`), exported as types because an app only
 * matches their tags.
 *
 * Nothing else under `src/` is reachable from outside the package. The probe that reports whether
 * the schema is built (`qtiBuilt`), the importer's apply seam (`ImportOptions.wrapApply`, which the
 * public `importPackage` does not take) and the tests' fixture (`#pantry/test/qti.ts` and
 * `#pantry/test/author.ts`) are never exported here.
 *
 * @module
 */
export type { PackageEntry } from "#pantry/api/export.ts";

export { DocumentNotFound, exportPackage, readDocument } from "#pantry/api/export.ts";

export { importPackage, parsePackage, previewPackage } from "#pantry/api/import.ts";

export type { DocumentListing, PackageListing } from "#pantry/api/list.ts";

export { listDocuments, listPackages } from "#pantry/api/list.ts";

export type { PublishedRow } from "#pantry/api/published.ts";

export {
  BaseType,
  DeclarationIdentifier,
  Document,
  Entry,
  ItemRefDocument,
  Named,
  Package,
  publishedRelations,
  ReferencePath,
  Section,
  SectionMember,
  SectionSelection,
  TestDocument,
  TestFlag,
} from "#pantry/api/published.ts";

export type { ImportVerdict, ParseVerdict, PreviewVerdict, Refusal } from "#pantry/api/verdict.ts";

export { ServedAuthorLogin } from "#pantry/db/served.ts";

export { PackageNotFound } from "#pantry/export/package.ts";

export type { DocumentRowCount, XmlVersionUnread } from "#pantry/export/pages.ts";

export type { DocumentRows } from "#pantry/export/render.ts";

export { documentXml } from "#pantry/export/render.ts";

export { documentScanOf } from "#pantry/export/scan.ts";

export { CommitUnresolved } from "#pantry/import/package.ts";

export type { PackageSource, ParsedPackage } from "#pantry/import/parsed.ts";

export type { CdnLevel } from "#pantry/levels/cdn.ts";

export { CdnOptions, singleCdn } from "#pantry/levels/cdn.ts";

export type { MediaLevel } from "#pantry/levels/media.ts";

export { MediaOptions, packageMedia } from "#pantry/levels/media.ts";

export type { AssembleError } from "#pantry/model/assemble.ts";

export type { AuthorLogin } from "#pantry/qti/logins.ts";

export { authorLogin } from "#pantry/qti/logins.ts";

export type { AuthorRole } from "#pantry/qti/roles.ts";

export { authorRole } from "#pantry/qti/roles.ts";

export type { QtiOptions, QtiSchema } from "#pantry/qti/schema.ts";

export { qti } from "#pantry/qti/schema.ts";
