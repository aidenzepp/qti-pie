# Changelog

Every change to `@qti-pie/pantry` that an app can see, newest first: a program's name, signature, type or error; a
published relation, key or published field; a refusal rule's name; a verdict that a new reading changes; and an
upgrade that needs the app to regenerate its migration. Each breaking change says what the app does about it. Nothing
is deprecated, aliased or given a grace period. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the
readings, and the [README](README.md#versioning) states the versioning rule.

## Unreleased

pantry is not tagged yet; the first `pantry-v0.<n>.0` tag carries these entries. Before them, pantry's `package.json`
exported nothing, so no app could import any of its modules.

### The entry point

- `package.json` `"exports"` is `{ ".": "./src/index.ts" }`. `@qti-pie/pantry` is the only entry point, and no other
  module of `src/` resolves from outside the package.
- Importing the entry opens no file, needs no `GR8DES_*` variable, and builds no schema, role, login, workload or
  query.
- `qti(options?)` builds pantry's `Qti` level on its first call and returns that one value on every call. `QtiSchema`
  is its type. `QtiOptions` holds no option yet.
- `authorRole(qti)` and `authorLogin(qti)` give the author role and the `author_app` login over a `Qti` value, with
  pantry's workloads, built once per value. `AuthorRole` and `AuthorLogin` are their types. The login's PostgreSQL
  role stays `qti__author_app`.
- `importPackage(source)` stores a package and succeeds with an `ImportVerdict`: `accepted` with the `packageId`, or
  `refused` with a `Refusal`. A refusal is a value, never an error. It fails with the platform's error when the
  package cannot be read, `CommitUnresolved` when the commit got no answer and reading back failed, and grizzle's own
  error when the database fails for another reason.
- `previewPackage(source)` reads and checks a package with no database, and succeeds with a `PreviewVerdict`:
  `previewed` with the relation and row counts and `databaseChecked: false`, or `refused` with a `Refusal`.
- `Refusal` names the level and rule a package broke: `{ kind: "qti", level: "Qti", rule, detail, origin }` for
  pantry's laws and its reader, or `{ kind: "above", level, rule, detail, origin }` for a level above `Qti`, whose
  `rule` is the law's name as that level states it.
- `PackageSource` is a directory or `.zip` path, or `{ name, bytes }` holding a zip archive's bytes. The name stands
  where a path would, in a refusal and in the stored package's name.
- `exportPackage(packageId)` gives a stored package's entries, each a `PackageEntry` (`path`, `bytes`), as QTI 3.0
  writes them. `readDocument(packageId, path)` gives one document's XML bytes. Both fail with `PackageNotFound` for an
  unknown id, and `readDocument` with `DocumentNotFound` for a path that names no document of the package. A
  document that cannot be written fails with `DocumentRowCount`, `XmlVersionUnread` or an `AssembleError`, which the
  entry exports as types.
- `listPackages(request)` and `listDocuments(packageId, request)` read one grizzle page of the stored packages,
  ordered by id, or of a package's documents, ordered by entry path. Their rows are `PackageListing` (`id`, `name`)
  and `DocumentListing` (`node`, `package`, `path`, `resourceType`, `rootKind`).
- `documentScanOf(qti)` is the document scan, a grizzle query an app runs in its own role's workload or its own
  transaction. `documentXml(document, rows)` writes a document's XML from the scan's rows with no database.
  `DocumentRows` is the rows' type; their shape is internal and changes with pantry.
- `singleCdn(base, options)` builds the refuse-only `Cdn` level over a base level, for one CDN origin. `CdnOptions`
  decodes its options, `{ origin }`: an `https://` origin with the root path, as the URL Standard serializes it, such
  as `https://cdn.example.com/`. Its type is `typeof CdnOptions.Type`. `CdnLevel` is the level's type. The level
  refuses a package that makes a player fetch from another origin, under the rules `CdnOrigin`, `CdnData`, `CdnStyle`
  and `CdnForeign`, each a `kind: "above"` refusal at level `Cdn`. `CdnOrigin`, `CdnData` and `CdnStyle` also refuse
  a value they read that keeps an entity reference, since a player may expand it to an address they never saw.
- Every program but `previewPackage` requires the author login's `DbLayer<AuthorRole>`, and the import and preview
  require the platform's `FileSystem`.

### The published relations

These relations, their keys and their published fields are new, and are the contract `publishedRelations` records
and `PublishedRow<Name>` types. Every other field and relation is internal.

| Relation                | Key    | Published fields                                                                                             |
| ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| `Package`               | `id`   | `id`, `name`                                                                                                 |
| `Document`              | `node` | `node`, `package`, `path`, `resourceType`, `rootKind`                                                        |
| `TestDocument`          | `node` | `node`, `package`, `path`, `rootKind`                                                                        |
| `Named`                 | `node` | `node`, `document`, `identifier`, `kind`, `parent`, `part`                                                   |
| `Section`               | `node` | `node`, `document`, `parent`, `visible`, `keepTogether`, `shuffle`, `withReplacement`, `members`, `required` |
| `SectionSelection`      | `node` | `node`, `document`, `parent`, `select`, `withReplacement`                                                    |
| `SectionMember`         | `node` | `node`, `section`, `document`, `kind`, `required`, `start`                                                   |
| `ItemRefDocument`       | `node` | `node`, `document`, `package`, `path`                                                                        |
| `DeclarationIdentifier` | `node` | `node`, `document`, `identifier`, `declarationKind`                                                          |
| `BaseType`              | roster | Its handles, which an app's `closedId(BaseType)` columns name                                                |

`PublishedRow<"BaseType">` types a handle as a plain `string`, not as one of the roster's handles.

### Reading 178, the regex text bound, and the migration

- An attribute's value is at most 268,435,454 UTF-8 bytes, the longest text PostgreSQL's regular expressions read.
  A longer value is refused under the new rule `regex-text-bound` (reading 178, proposed). Before, it failed with a
  raw database error, so no value that was stored before is refused now, and no corpus verdict changes.
- The migration `20261110065101_pantry-api-1` puts that bound on `Attribute`'s value and records the listing
  workloads. An app regenerates its own migration over it.

### The command line

- `import`, `export` and `roundtrip` run the public programs. Their text, exit codes and `--output json` are
  unchanged for a package `Qti` refuses.
- A package refused by a level above `Qti` fails with `RefusedByLevel`, of kind `import-refused` and exit code 1.
  Under `--output json` its error object carries `rule` and `level`, and `schema/error.json` names the new optional
  `level` key.
- `pnpm --filter @qti-pie/pantry run rosters` writes `src/db/rosters.json`, the roster order the grammar reads, from
  `migrations/qti/snapshot.json`. Run it after any `grizzle generate` that changes a roster.

### Moving an app to the entry point

An app that reached pantry's modules through deep subpaths moves to `@qti-pie/pantry` in one step. Those subpaths no
longer resolve, nothing is aliased, and a name the entry does not export fails the app's build.

| The app used                                                                                                                                                     | It now uses                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrationConnection` and `connectionServices` from `db/connection.ts` in its `grizzle.config.ts`, with pantry's `GR8DES_PG_*` settings, password command and CA | Its own `defineConfig` `connection` (host, port, database, CA, password or IAM token) through grizzle. pantry exports no connection code                                                                                     |
| The module-level `Qti`, `Author`, `AuthorApp`, `exportWork` and `importWork`                                                                                     | `qti()`, `authorRole(qti())` and `authorLogin(qti())`. The workloads belong to the login                                                                                                                                     |
| `authorAppOf(Qti)` from `qti/logins.ts` in its configuration's `logins`                                                                                          | `authorLogin(qti())`, the same login, `qti__author_app`                                                                                                                                                                      |
| `qtiSchema(Option.some(policy))` from `qti/schema.ts`, single-CDN mode as checks of the root level                                                               | `qti()`, then `singleCdn(qti(), options)` with `options` decoded by `CdnOptions`. The app's level extends the `Cdn` level, and a CDN refusal names level `Cdn` and a rule such as `CdnOrigin`                                |
| Its own policy file, `{ "cdn": "<origin>" }`                                                                                                                     | The same file, read by the app, its origin passed as `{ origin }`                                                                                                                                                            |
| `import type { QtiSchema } from ".../qti/schema.ts"`                                                                                                             | `import type { QtiSchema } from "@qti-pie/pantry"`                                                                                                                                                                           |
| `qti.relations.TestDocument` and the other relations, by the schema value                                                                                        | The published relations, imported by name, or still `qti().relations`, which holds the same objects. Only the published fields are the contract                                                                              |
| `query(qti).rule(...)` and `schema.extend(qti, "<Level>", ...)`                                                                                                  | Queries over `qti()`; the app's level extends `singleCdn(qti(), options)`, or `qti()` with no CDN level                                                                                                                      |
| `documentXml` from `export/render.ts`, and its rows as `Parameters<typeof documentXml>[1]`                                                                       | `documentXml` and `import type { DocumentRows }` from `@qti-pie/pantry`, with the same arguments                                                                                                                             |
| A dynamic `import(".../qti/schema.ts")` that times the schema's load                                                                                             | `import("@qti-pie/pantry")`, which builds nothing. The schema is built on the first `qti()` call                                                                                                                             |
| The scan workload, `scannedRows` from `export/pages.ts` and the export's queries from `export/scan.ts`                                                           | `documentScanOf(qti())` in its own role's workload, or read in its own transaction, by a role that holds every `Qti` relation whole (`wholeEntriesOf(qti())`). `scannedRows` is not exported; grizzle's own paging covers it |
| `importPackage` failing with `ImportRefused`                                                                                                                     | An `ImportVerdict`: a refusal is `{ verdict: "refused", refusal }`                                                                                                                                                           |

On upgrade, the app:

- Regenerates its migration with `grizzle generate`. The `Cdn` level is a PostgreSQL schema of its own, and no CDN
  check is left on the root level. The app resolves the drafted SQL against its deployed database.
- Replaces each deep import with the entry's name, by the table above.
- Reads verdicts: `importPackage` returns a `refused` value where it failed with `ImportRefused`.
