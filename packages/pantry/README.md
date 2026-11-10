# pantry

> *No mystery jars.*
>
> pantry keeps everything labeled: it stores QTI in PostgreSQL and refuses anything it can't name.

Store QTI 3.0 packages in a strict PostgreSQL model, and export them unchanged.

pantry imports a QTI 3.0 package, a directory or a `.zip` file, into a PostgreSQL database, and exports it back to
files. It exists first to put [grizzle](../../vendor/README.md) through a large, real data model, so delivery is out of
scope. It is a library with one entry point, `@qti-pie/pantry`, and a command line over the same programs. It is
pre-release, and it reads XML through [crust](../crust/README.md).

## Install

From the repository root, after the setup in [qti-pie's README](../../README.md#install):

```bash
pnpm install --frozen-lockfile
```

The database is grizzle's patched PostgreSQL 19rc1 on `localhost:5433`, with verify-full TLS only. [`AGENTS.md`](../../AGENTS.md#local-database) describes how to build it and how to choose a server.

pantry is a private workspace package of [qti-pie](../../README.md). An app depends on it from a sibling package's
`package.json`:

```json
"dependencies": { "@qti-pie/pantry": "workspace:*", "effect": "4.1.2" }
```

The app uses the grizzle pantry pins ([`vendor/README.md`](../../vendor/README.md)), so the workspace holds one copy of
grizzle and one of Effect. pantry gives no connection, configuration or plugin layer. The app installs pantry's schema
as the lowest levels of its own grizzle installation and connects with its own grizzle configuration. It gives pantry's
programs the author login's `DbLayer` and `ServedAuthorLogin`, both from the served file its own `grizzle generate`
writes for that login. [Database](#database) states what that requires.

## Entry point

`@qti-pie/pantry` is the only entry point; `package.json` `"exports"` lists [`src/index.ts`](src/index.ts) and nothing
else, so no other module of `src/` resolves from outside the package. Every export:

| Export | Kind | Gives |
| --- | --- | --- |
| `qti` | function | pantry's `Qti` level. It is built on the first call, and every call returns that one value |
| `QtiSchema` | type | The type of the `Qti` level |
| `QtiOptions` | type | The options `qti` takes. It holds none yet |
| `authorRole` | function | The author role over a `Qti` value: it holds every stored relation and roster whole, and writes every stored relation |
| `AuthorRole` | type | The author role's type. Every program but `previewPackage` requires `ServedAuthorLogin \| DbLayer<AuthorRole>` |
| `authorLogin` | function | The `author_app` login over a `Qti` value, with the workloads pantry's programs run. An app lists it in its grizzle configuration |
| `AuthorLogin` | type | The author login's type, which an app's `served<AuthorLogin>(file, "author_app")` serves |
| `ServedAuthorLogin` | service | The served author login, which an app provides beside the `DbLayer` it built over that login. Each program opens its `Db` on its author role |
| `singleCdn` | function | The refuse-only `Cdn` level over a base level, for one CDN origin |
| `CdnOptions` | schema | Decodes `singleCdn`'s options, `{ origin }`. Its type is `typeof CdnOptions.Type` |
| `CdnLevel` | type | The `Cdn` level's type, which an app's own level extends |
| `importPackage` | program | Stores a package, and succeeds with an `ImportVerdict` |
| `previewPackage` | program | Reads and checks a package without a database, and succeeds with a `PreviewVerdict` |
| `exportPackage` | program | A stored package's entries as QTI 3.0 writes them |
| `readDocument` | program | One stored document's XML bytes, by package id and entry path |
| `listPackages` | program | One page of the stored packages, ordered by id |
| `listDocuments` | program | One page of a package's documents, ordered by entry path |
| `documentScanOf` | function | The document scan over a `Qti` value, a grizzle query an app runs in its own role and transaction |
| `documentXml` | function | Writes a document's XML from the scan's rows, with no database |
| `DocumentRows` | type | The scan's rows. Their shape is internal and changes with pantry; pass them through unread |
| `PackageSource` | type | A package to read: a directory or `.zip` path, or `{ name, bytes }` holding a zip archive |
| `ImportVerdict` | type | `accepted` with the stored `packageId`, or `refused` with a `Refusal` |
| `PreviewVerdict` | type | `previewed` with relation and row counts and `databaseChecked: false`, or `refused` with a `Refusal` |
| `Refusal` | type | The level and rules a package broke: `kind: "qti"` at level `Qti`, or `kind: "above"` at a level above it. `rules` lists every rule the refusal names, and `rule` is the first of them |
| `PackageEntry` | type | One exported entry, its `path` and `bytes` |
| `PackageListing` | type | One listed package: its `id` and `name` |
| `DocumentListing` | type | One listed document: its `node`, `package`, `path`, `documentType` and `rootKind` |
| `publishedRelations` | value | Each published relation's key and published fields, and the `BaseType` roster |
| `PublishedRow` | type | A published relation's row, narrowed to its published fields |
| `PackageNotFound` | error | No stored package has the id |
| `DocumentNotFound` | error | The stored package holds no document at the path |
| `CommitUnresolved` | error | An import's commit got no answer and reading the package back failed, so it may or may not be stored |
| `DocumentRowCount` | error type | A document's scan held no `Document` row, or more than one |
| `XmlVersionUnread` | error type | A document's stored XML version is no XML version, so no declaration can be written |
| `AssembleError` | error type | A document's rows do not assemble into one document: `RootMissing`, `RowMissing` or `RowsOutsideImage` |

The eleven published relations are exports too: [Published relations](#published-relations) lists them. A refusal is a
verdict value, never an error: the programs fail only for what is not about the package, with the platform's error,
grizzle's own error, or pantry's errors above. The TSDoc on each name in `src/index.ts` is its reference.

## Published relations

An app's own level references these relations, and its own role reads them. Each one's key and published fields are
a contract: they change only on purpose, and [the changelog](CHANGELOG.md) names every change. Every other field, and
every other relation of `Qti`, is internal and changes with pantry.

| Relation | Key | Published fields |
| --- | --- | --- |
| `Package` | `id` | `id`, `name` |
| `Document` | `node` | `node`, `package`, `path`, `documentType`, `rootKind` |
| `TestDocument` | `node` | `node`, `package`, `path`, `rootKind` |
| `Named` | `node` | `node`, `document`, `identifier`, `kind`, `parent`, `part` |
| `Section` | `node` | `node`, `document`, `parent`, `keepTogether`, `shuffle`, `withReplacement`, `members`, `required` |
| `SectionSelection` | `node` | `node`, `document`, `parent`, `select`, `withReplacement` |
| `SectionMember` | `node` | `node`, `section`, `document`, `kind`, `required`, `start` |
| `TestFlag` | `node`, `name` | `node`, `name`, `value` |
| `ItemRefDocument` | `node` | `node`, `document`, `package`, `path` |
| `DeclarationIdentifier` | `node` | `node`, `document`, `identifier`, `declarationKind` |
| `BaseType` | roster | Its handles, which an app's `closedId(BaseType)` columns name |

A section's visibility is its `TestFlag` row named `visible`. QTI requires the attribute on every section, so every
section has that row. A document's `documentType` is `manifest` for the manifest, and the type of the manifest resource
that lists it for any other document.

A published field's type is part of the contract, and a closed id carries its roster's handle names. A `BaseType`
handle is typed as a plain `string`, so `PublishedRow<"BaseType">` does not narrow its `id` to the roster's handles.

## Database

pantry runs only on grizzle's PostgreSQL. An app installs pantry as levels of its own grizzle installation: `qti()` at
the bottom, then any level pantry builds, such as `singleCdn(qti(), options)`, then the app's own levels over them. The
app's grizzle configuration lists the author login, `authorLogin(qti())`, so pantry's programs run unchanged inside the
app's database, and the app writes and runs its own migrations.

`grizzle generate` writes the login's served file beside the app's snapshot, `migrations/qti/served/author_app.json`
in the app's migrations folder. The app commits it, and at run time it serves the login from that file and builds the
login's `DbLayer` over it. The programs compile nothing and evaluate no schema module at run time. Every program but
`previewPackage` requires `ServedAuthorLogin | DbLayer<AuthorRole>`, so the app provides both:

```ts
import { DbLayer, roleNameOf, served } from "@bjornpagen/grizzle/runtime";
import { ServedAuthorLogin } from "@qti-pie/pantry";
import type { AuthorLogin } from "@qti-pie/pantry";
import { Layer } from "effect";

// file: the app's served file, read and parsed as JSON.
const login = served<AuthorLogin>(file, "author_app");
const pantryLayer = Layer.merge(
  DbLayer.make({ ...connectionOf(roleNameOf(login)), login, pool }),
  Layer.succeed(ServedAuthorLogin, login),
);
```

`connectionOf` and `pool` are the app's: its connection to the database for the login's role, and its pool bounds.
pantry reads no environment variable and no install folder for an app; its
[optional settings](#optional-settings) are its own command line's and tests'.

One installation per PostgreSQL server: PostgreSQL roles belong to the whole server, and pantry's root level is always
named `Qti`, so a server holds at most one installation of pantry. Relation, role and login names share one namespace
across an installation, so an app relation named like one of pantry's is refused when the schema is built.

## Versioning

pantry is versioned by git tags `pantry-v<version>` on 0.x, and the tags are informational. There is no backwards
compatibility: nothing is deprecated, aliased or given a grace period. Every breaking change is listed in
[`CHANGELOG.md`](CHANGELOG.md) with what the app does about it. A change is breaking when it changes a program's name,
signature, type or error; a published relation, key or published field; a refusal rule's name; a verdict, through a
new reading; or an upgrade that needs the app to regenerate its migration.

## Start

```console
$ cd packages/pantry
$ scripts/db.sh create
$ scripts/db.sh migrate
$ node src/cli.ts import ./my-package
$ node src/cli.ts export ./out <package-id>
$ node src/cli.ts roundtrip ./my-package
```

`import` prints the package id that `export` takes.

## Commands

| Command       | Writes                | Does                                                    |
| ------------- | --------------------- | ------------------------------------------------------- |
| `import`      | the database          | Imports a package and prints its id                     |
| `export`      | files                 | Writes an imported package back out                     |
| `roundtrip`   | the database, files   | Imports, exports and compares the two                   |
| `schema`      | no                    | Prints the JSON Schema of `--output json`               |
| `completions` | no                    | Prints a shell completion script                        |

Every input is a path. Nothing is read from standard input. `--dry-run` reads and checks without writing. `export`
needs `--yes` to replace a directory that already has content. `--output json` prints one JSON value. `--help` is the reference for the flags and the exit codes.

An item ref may name an LTI link instead of an item. pantry accepts it and does not check the variable mappings or the
item-prefixed names that pass through it, because the package declares nothing the tool reports (spec reading 110).

`scripts/db.sh reset` drops the database and this package's roles, then creates and migrates again.

## Optional settings

- `GR8DES_PG_PASSWORD_COMMAND` names an executable that prints a role's password. Every connection attempt runs it,
  without a shell, with the role's name as its one argument, in place of `GR8DES_PG_MIGRATION_PASSWORD` and the logins'
  password files.

## Development

[`docs/qti-intent.md`](../../docs/qti-intent.md) records what was settled before the model was planned. Read it before
changing the model. From the repository root:

```bash
pnpm check
pnpm --filter @qti-pie/pantry test
```

Tests that need the database use the local cluster. Agents start at [`AGENTS.md`](../../AGENTS.md).

The vocabulary's derivations and the XSD differentials read the 23 XSDs that
[`src/vocab/derive/sources.ts`](src/vocab/derive/sources.ts) pins by URL and SHA-256, all published by 1EdTech under
`https://purl.imsglobal.org/spec/`. They are cached outside the repository, in `~/.cache/gr8des/qti3/xsd/`:
`pnpm --filter @qti-pie/pantry run fetch-xsds` downloads them there and checks each digest. Without them those tests
are skipped, or fail naming that command.

## License

MIT
