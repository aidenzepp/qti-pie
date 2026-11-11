# Changelog

Every change to `@qti-pie/pantry` that an app can see, newest first: a program's name, signature, type or error; a
published relation, key or published field; a refusal rule's name; a verdict that a new reading changes; and an
upgrade that needs the app to regenerate its migration. Each breaking change says what the app does about it. Nothing
is deprecated, aliased or given a grace period. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the
readings, and the [README](README.md#versioning) states the versioning rule.

## Unreleased

pantry is not tagged yet; the first `pantry-v0.<n>.0` tag carries these entries. Before them, pantry's `package.json`
exported eight module subpaths and the command line read an install folder. [Moving an app to the entry
point](#moving-an-app-to-the-entry-point) says what replaces each.

### One migration, drawn from zero

- pantry's migration history is collapsed into one migration, `20261111045312_sterling-standard`, which
  `grizzle generate` drew from zero over the schema of every entry below. It installs what
  `20261110175742_sterling-standard` and `20261111020155_pantry-api-1` installed together, plus `Entry`'s `digest`
  column. Those two folders are gone, and no migration leads from them to the new one.
- Breaking, with no backwards compatibility: a database installed from the old chain is not migrated. Drop it, and
  the installation's PostgreSQL roles with it (roles are cluster-wide, and the new migration creates them), then
  install fresh: create the database and run `grizzle migrate` over the one migration. No stored row carries over, so
  import the packages again.
- An app's own migrations are drawn from its own snapshot, so the collapse moves none of them. The schema change it
  regenerates for is `Entry.digest`, below.
- No rule name or LawId changes: `src/vocab/law-names.json`, written again from the new snapshot, is unchanged.

### A package parsed once

- `parsePackage(source)` reads and parses a package once, with no database, and succeeds with a `ParseVerdict`:
  `parsed` with the `ParsedPackage` as `package`, or `refused` with a `Refusal` from the reader, the container or the
  codec. It fails only with the platform's error, and requires only the platform's `FileSystem`.
- `ParsedPackage` holds `name`, the stored package's name; `files`, every entry as a `File` by its path from the
  package root, in listing order, the `File`'s name that path, its bytes the entry's and its type empty; `documents`,
  the manifest and then each document the import writes a `Document` row of, each with its `path` and `documentType`
  (its `tree` is internal); and `referenced`, every path a reference of those documents resolves to, exactly the
  paths of the `ReferencePath` and `TextReferencePath` rows the import writes. Only `parsePackage` makes one, and the
  entry exports its type alone.
- `PackageSource` has a fourth kind, a `ParsedPackage`. `importPackage`, `previewPackage` and `parsePackage` take it
  and read nothing of the package again, so the bytes an app reads from `files` are the bytes the import stores as
  each entry's `content`. A path or `{ name, bytes }` is parsed into a `ParsedPackage` first.
- Breaking: an app that narrows a `PackageSource` by `typeof source === "string"` and then reads `source.bytes` no
  longer typechecks, since the other branch may be a `ParsedPackage`. It checks `"bytes" in source` instead, or
  passes the source on unread. No verdict, rule, relation or migration changes.

### Entry's digest

- `Entry` has a new published field, `digest`: the SHA-256 of the entry's `content`, written as 64 lowercase hex
  digits. PostgreSQL computes it from the stored bytes, a generated column, so no write carries one, and grizzle's
  `Addition<typeof Entry>` holds no `digest`. A content-addressed store names the file by it, and a read takes it
  without `content`, so it carries no bytes. `publishedRelations.Entry` lists it.
- `Entry`'s table gains the column, so an app regenerates its own migration over pantry's, and its served file with
  it. Where the table already holds entries, PostgreSQL rewrites it to add the column, hashing every stored entry's
  bytes while it holds the table locked.
- `Fact<typeof Entry>` and `PublishedRow<"Entry">` gain `digest`: an object literal of either type in an app's code
  adds it.

### The entry point

- `package.json` `"exports"` is `{ ".": "./src/index.ts" }`. `@qti-pie/pantry` is the only entry point, and no other
  module of `src/` resolves from outside the package.
- Importing the entry opens no file, needs no `GR8DES_*` variable, and builds no schema, role, login, workload or
  query.
- `qti(options?)` builds pantry's `Qti` level on its first call and returns that one value on every call. It reads no
  environment variable and takes no policy. `QtiSchema` is its type. `QtiOptions` holds no option yet.
- `authorRole(qti)` and `authorLogin(qti)` give the author role and the `author_app` login over a `Qti` value, with
  pantry's workloads, built once per value. `AuthorRole` and `AuthorLogin` are their types. The login's PostgreSQL
  role is `qti_queries__author_app`, named after the level of pantry's that the login is over.
- `ServedAuthorLogin` is the served author login: the login an app serves from its own served file with grizzle's
  `served<AuthorLogin>(file, "author_app")`. Every program but `previewPackage` requires
  `ServedAuthorLogin | DbLayer<AuthorRole>`, and opens its `Db` on the served login's author role. The app provides
  both, the `DbLayer` built over that same served login. The import and preview also require the platform's
  `FileSystem`.
- `importPackage(source)` stores a package and succeeds with an `ImportVerdict`: `accepted` with the `packageId`, or
  `refused` with a `Refusal`. A refusal is a value, never an error. It fails with the platform's error when the
  package cannot be read, `CommitUnresolved` when the commit got no answer and reading back failed, and grizzle's own
  error when the database fails for another reason.
- `previewPackage(source)` reads and checks a package with no database, and succeeds with a `PreviewVerdict`:
  `previewed` with the relation and row counts and `databaseChecked: false`, or `refused` with a `Refusal`.
- `Refusal` names the level and rules a package broke: `{ kind: "qti", level: "Qti", rule, rules, detail, origin }`
  for pantry's laws and its reader, or `{ kind: "above", level, rule, rules, detail, origin }` for a level above `Qti`.
  `rules` lists every rule the refusal names. The database does not always say which one law broke, so a `qti`
  refusal lists every rule of the laws it named, in the order of pantry's rule roster. `rule` is the first of
  `rules`. A `qti` refusal whose laws carry none of pantry's rules has an empty `rules` and no `rule`. An `above`
  refusal's rules are its laws' names as that level states them.
- `PackageSource` is a directory or `.zip` path, `{ name, bytes }` holding a zip archive's bytes, or a
  `ParsedPackage` ([A package parsed once](#a-package-parsed-once)). The name stands where a path would, in a refusal
  and in the stored package's name.
- `exportPackage(packageId)` gives a stored package's entries, each a `PackageEntry` (`path`, `bytes`), as QTI 3.0
  writes them. `readDocument(packageId, path)` gives one document's XML bytes. Both fail with `PackageNotFound` for an
  unknown id, and `readDocument` with `DocumentNotFound` for a path that names no document of the package. A
  document that cannot be written fails with `DocumentRowCount`, `XmlVersionUnread` or an `AssembleError`, which the
  entry exports as types. A stored document with no recorded entry path is a defect, not an error: the export stops
  naming it, before any document is read.
- `listPackages(request)` and `listDocuments(packageId, request)` read one grizzle page of the stored packages,
  ordered by id, or of a package's documents, ordered by entry path. Their rows are `PackageListing` (`id`, `name`)
  and `DocumentListing` (`node`, `package`, `path`, `documentType`, `rootKind`).
- `documentScanOf(qti)` is the document scan, a grizzle query an app runs in its own role's workload or its own
  transaction. `documentXml(document, rows)` writes a document's XML from the scan's rows with no database.
  `DocumentRows` is the rows' type; their shape is internal and changes with pantry.
- `singleCdn(base, options)` builds the refuse-only `Cdn` level over a base level, for one CDN origin. `CdnOptions`
  decodes its options, `{ origin }`: an `https://` origin with the root path, as the URL Standard serializes it, such
  as `https://cdn.example.com/`. Its type is `typeof CdnOptions.Type`. `CdnLevel` is the level's type. The level
  refuses a package that makes a player fetch from another origin, under the rules `CdnOrigin`, `CdnData`, `CdnStyle`
  and `CdnForeign`, each a `kind: "above"` refusal at level `Cdn`. `CdnOrigin`, `CdnData` and `CdnStyle` also refuse
  a value they read that keeps an entity reference, since a player may expand it to an address they never saw.

- `packageMedia(base, options)` builds the refuse-only `Media` level over a base level, for one roster of media
  extensions. `MediaOptions` decodes its options, `{ media: { <extension>: <media type> } }`: at least one lowercase
  extension, each with one lowercase media type and no parameter, and each media type under one extension, such as
  `{ "media": { "svg": "image/svg+xml", "png": "image/png" } }`. Its type is `typeof MediaOptions.Type`. `MediaLevel`
  is the level's type. The roster's media types state no law: they are what the app serves each extension's files
  with, so two rosters of the same extensions give one level. The level refuses a package that makes a player fetch
  anything but a file of the package with a listed extension, or that holds a file nothing names, each a
  `kind: "above"` refusal at level `Media`, under the rules:
  - `MediaPath`: every fetched address resolves to an entry of the package (its `ReferencePath` or
    `TextReferencePath`), is written as a relative path (no scheme, no leading `/` or `\`), and keeps no entity
    reference.
  - `MediaType`: the entry each fetched address resolves to has an extension the roster lists, matched
    case-sensitively.
  - `MediaEntryUsed`: every entry is the manifest, a document, or a path a reference resolves to.
  - `MediaData`, `MediaStyle` and `MediaForeign`: the `Cdn` level's `CdnData`, `CdnStyle` and `CdnForeign`, one rule
    each, stated for this level under its own names. Each also refuses a value it reads that keeps an entity
    reference.

  The level replaces the package-media install of the policy mode (`policy.json`, `MediaPolicySchema` and
  `qtiSchema(Option.some(policy))`). An app decodes its policy with `MediaOptions` instead, builds
  `packageMedia(qti(), options)`, and reads a refusal's level `Media` and its rule names where it read `media-path`,
  `media-type`, `media-data`, `media-style`, `media-foreign` and `entry-used`. A level is a PostgreSQL schema of its
  own, so the app regenerates its migration and served file.

### The published relations

These relations, their keys and their published fields are new, and are the contract `publishedRelations` records
and `PublishedRow<Name>` types. Every other field and relation is internal.

| Relation                | Key             | Published fields                                                                                  |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `Package`               | `id`            | `id`, `name`                                                                                      |
| `Entry`                 | `package`, `at` | `package`, `at`, `path`, `content`, `digest`                                                      |
| `Document`              | `node`          | `node`, `package`, `path`, `documentType`, `rootKind`                                             |
| `TestDocument`          | `node`          | `node`, `package`, `path`, `rootKind`                                                             |
| `Named`                 | `node`          | `node`, `document`, `identifier`, `kind`, `parent`, `part`                                        |
| `Section`               | `node`          | `node`, `document`, `parent`, `keepTogether`, `shuffle`, `withReplacement`, `members`, `required` |
| `SectionSelection`      | `node`          | `node`, `document`, `parent`, `select`, `withReplacement`                                         |
| `SectionMember`         | `node`          | `node`, `section`, `document`, `kind`, `required`, `start`                                        |
| `TestFlag`              | `node`, `name`  | `node`, `name`, `value`                                                                           |
| `ItemRefDocument`       | `node`          | `node`, `document`, `package`, `path`                                                             |
| `DeclarationIdentifier` | `node`          | `node`, `document`, `identifier`, `declarationKind`                                               |
| `ReferencePath`         | `node`, `name`  | `node`, `name`, `document`, `package`, `kind`, `path`                                             |
| `BaseType`              | roster          | Its handles, which an app's `closedId(BaseType)` columns name                                     |

- `Document`'s `resourceType` field is now `documentType`: `manifest` for the manifest, else the type of the manifest
  resource that lists the document.
- `Section` has no `visible` field. A section's visibility is its published `TestFlag` row named `visible`, a boolean
  `value`. QTI requires the attribute on every section, so every section has that row.
- `Entry` and `ReferencePath` are published with every field they declare: a reference's `ReferencePath` row holds
  its resolved `path` in its `package`, and that package's `Entry` row with the same `path` holds the file's bytes.
- `PublishedRow<"BaseType">` types a handle as a plain `string`, not as one of the roster's handles.

### Reading 178, the regex text bound, and the migration

- An attribute's value is at most 268,435,454 UTF-8 bytes, the longest text PostgreSQL's regular expressions read.
  A longer value is refused under the new rule `regex-text-bound` (reading 178, proposed). Before, it failed with a
  raw database error, so no value that was stored before is refused now, and no corpus verdict changes.
- pantry's one migration, `20261111045312_sterling-standard` ([One migration, drawn from
  zero](#one-migration-drawn-from-zero)), puts that bound on `Attribute`'s value. An app regenerates its own migration
  over it, and its served file with it.

### The command line

- `import`, `export` and `roundtrip` run the public programs. Their text, exit codes and `--output json` are
  unchanged for a package `Qti` refuses.
- A package refused by a level above `Qti` fails with `RefusedByLevel`, of kind `import-refused` and exit code 1.
- Under `--output json` a refusal's error object carries `level`, `rule` and `rules`, and `schema/error.json` names
  the new optional `level` and `rule` keys.
- The command line reads no `GR8DES_QTI_INSTALL` folder. It runs this checkout's own installation, from its committed
  served file.

### Moving an app to the entry point

An app that reached pantry's modules through its eight subpaths, or ran it over an install folder, moves to
`@qti-pie/pantry` and its own served file in one step. Those subpaths no longer resolve, nothing is aliased, and a
name the entry does not export fails the app's build.

| The app used                                                                                                                                                      | It now uses                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrationConnection`, `loginConnection` and `connectionServices` from `db/connection.ts`, with pantry's `GR8DES_PG_*` settings, password command and CA          | Its own grizzle `connection` in its configuration, and its own connection for the login's role in its layer. pantry exports no connection code                                                                                                                                                                                                                               |
| `GR8DES_QTI_INSTALL` and `db/install.ts` (`readInstall`, `installedPolicy`, `CdnPolicy`, `servedPathOf`): an install folder with `policy.json` and its migrations | No install folder. The app reads its own policy file and passes its origin to `singleCdn(qti(), { origin })`, and it reads its own served file                                                                                                                                                                                                                               |
| `qtiSchema(Option.some(policy))` or `qtiSchema(Option.none())`, and `qtiLevelsOf`, from `qti/schema.ts`                                                           | `qti()`, which takes no policy. For one CDN origin, `singleCdn(qti(), options)` with `options` decoded by `CdnOptions`. The app's level extends the `Cdn` level, and a CDN refusal names level `Cdn` and a rule such as `CdnOrigin`                                                                                                                                          |
| `import type { QtiSchema } from ".../qti/schema.ts"`                                                                                                              | `import type { QtiSchema } from "@qti-pie/pantry"`                                                                                                                                                                                                                                                                                                                           |
| `authorRoleOf(qti)` and `AuthorRole` from `qti/roles.ts`                                                                                                          | `authorRole(qti())` and `AuthorRole`                                                                                                                                                                                                                                                                                                                                         |
| `authorAppOf(qti)`, `authorWorkloadsOf` and `AuthorAppLogin` from `qti/logins.ts`                                                                                 | `authorLogin(qti())`, the same login, `qti_queries__author_app`, in its configuration's `logins`, and the type `AuthorLogin`. The workloads belong to the login                                                                                                                                                                                                              |
| pantry's own layer, an import layer such as `ImportLive`, or the install folder's served file                                                                     | Its own `DbLayer` over `served<AuthorLogin>(file, "author_app")`, `file` being the served file its own `grizzle generate` writes, merged with `Layer.succeed(ServedAuthorLogin, login)`                                                                                                                                                                                      |
| `readPackage` from `import/read.ts`, and its `QtiPackage`                                                                                                         | `parsePackage(source)`, which succeeds with `{ verdict: "parsed", package }` or a refused verdict. `package` is a `ParsedPackage`: its `files` and `referenced` are keyed by plain `string` paths, and its `documents` lists the manifest first, where `QtiPackage` held it apart as `manifest`. Pass `package` to `importPackage`, which reads nothing of the package again |
| `importPackage` failing with `ImportRefused`                                                                                                                      | `importPackage(source)` from the entry, which succeeds with an `ImportVerdict`: a refusal is `{ verdict: "refused", refusal }`                                                                                                                                                                                                                                               |
| `documentXml` and `scanXml` from `export/render.ts`, with rows typed as `Parameters<typeof documentXml>[1]`                                                       | `documentXml` and `import type { DocumentRows }` from the entry, with the same arguments. `scanXml` is not exported                                                                                                                                                                                                                                                          |
| `exportQueriesOf(qti)` from `export/scan.ts`, and `scannedRows`, `assembleScan` and the scan types from `export/pages.ts`                                         | `documentScanOf(qti())` in its own role's workload, or read in its own transaction, by a role that holds every `Qti` relation whole. Paging is grizzle's own. `DocumentRowCount` and `XmlVersionUnread` are entry types                                                                                                                                                      |
| `qti.relations.TestDocument` and the other relations, by the schema value                                                                                         | The published relations, imported by name, or still `qti().relations`, which holds the same objects. Only the published fields are the contract                                                                                                                                                                                                                              |
| `Section`'s `visible` and `Document`'s `resourceType`                                                                                                             | A section's `TestFlag` row named `visible`, and `Document`'s `documentType`                                                                                                                                                                                                                                                                                                  |
| `Named` and `Section`                                                                                                                                             | The same relations, published. `Named`'s published fields are listed above                                                                                                                                                                                                                                                                                                   |
| `Attribute`                                                                                                                                                       | Still `qti().relations`, but internal: it may change in any release without a changelog entry                                                                                                                                                                                                                                                                                |
| `Entry` and `ReferencePath`                                                                                                                                       | The same relations, published with every field they declare                                                                                                                                                                                                                                                                                                                  |

On upgrade, the app:

- Lists `authorLogin(qti())` in its grizzle configuration and regenerates its migration with `grizzle generate`. It
  resolves the drafted SQL against its deployed database, and commits the migration and the served file
  `migrations/qti/served/author_app.json` that `generate` writes. A `Cdn` level is a PostgreSQL schema of its own,
  and no CDN check is left on the root level.
- Builds its layer from that served file and provides `ServedAuthorLogin` beside it.
- Replaces each subpath import with the entry's name, by the table above.
- Reads verdicts: `importPackage` returns a `refused` value where it failed with `ImportRefused`, and reads `rules`
  where a refusal names more than one rule.
