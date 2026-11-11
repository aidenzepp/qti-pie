# pantry

> *No mystery jars.*
>
> pantry keeps everything labeled: it stores QTI in PostgreSQL and refuses anything it can't name.

Store QTI 3.0 packages in a strict PostgreSQL model, and export them unchanged.

pantry imports a QTI 3.0 package, a directory or a `.zip` file, into a local PostgreSQL database, and exports it back
to files. It exists first to put [grizzle](../../vendor/README.md) through a large, real data model, so delivery is
out of scope. It is pre-release, and it reads XML through [crust](../crust/README.md).

## As a library

Its `package.json` exports plain grizzle values an application composes into its own grizzle config, and the steps
around them. There is no pantry runtime: the application opens its own connections and `Db`.

| Module | Values |
| --- | --- |
| `qti/schema.ts` | `Qti`, the one schema constant, every relation public and typed on `Qti.relations` |
| `qti/media.ts` | `QtiMedia`, the package-media level to stack with `schema.extend`; its policy is `MediaType` rows |
| `qti/roles.ts`, `qti/logins.ts` | `Author`, `AuthorApp`, and `importWrite`, the import's write program |
| `import/read.ts` | `readPackage`: one read, bytes to documents, files by path and referenced paths |
| `import/program.ts` | `importRowsOf`: the rows a read package is written as, for `importWrite` |
| `import/package.ts` | `importPackage`: `importRowsOf` applied through `AuthorLogin` (`db/served.ts`), with retries |
| `import/refusal.ts`, `vocab/laws.ts` | `lawNameOf`, `rulesOf` and `lawTable`: a refused law's QTI rule |
| `export/scan.ts`, `export/render.ts` | `documentScan` and `entriesOf` (grizzle queries), `documentScanOf(document)`, and `documentXml(rows)` |
| `db/install.ts` | `MediaPolicySchema`, which parses `policy.json`, `{ "media": { "<extension>": "<type>" } }` |

An application imports a package in its own transaction:

```ts
const pkg = yield* readPackage(dir)
const { insert, packageId } = yield* importRowsOf(pkg)
const db = yield* Db.open(AuthorServed.roles.author, {})
const outcome = yield* db.workload.importWrite.apply({ insert }, {})
```

A refusal is grizzle's `invariant-rejected` outcome; `rulesOf(outcome.refused.laws)` names its QTI rules.

An application reads a document inside its own read with `documentScanOf`, the scan `documentScan` pages, unpaged,
over a document term its attachment mints. Each row is a `ScanRow` (`export/pages.ts`):

```ts
.attach("document", (served) => documentScanOf(served.item), "array")
```

## Install

From the repository root, after the setup in [qti-pie's README](../../README.md#install):

```bash
pnpm install --frozen-lockfile
```

The database is grizzle's patched PostgreSQL 19rc1 on `localhost:5433`, with verify-full TLS only. [`AGENTS.md`](../../AGENTS.md#local-database) describes how to build it and how to choose a server.

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

Package-media mode is no setting of pantry's: an application lists `QtiMedia` (or a level of its own over it) in its
grizzle config and writes its policy as `MediaType` rows, one per entry of its `policy.json`. Write them through a
role of their own, one that writes nothing a READ COMMITTED reader reads: the media laws read `MediaType`, so a role
that writes it beside relations a reader reads makes grizzle's certifier lift that reader to SERIALIZABLE. The database alone
judges its laws: every address a player fetches is a path to a file of the package, with an extension a `MediaType`
row lists; no address is a `data:` one; no `style` holds `url(`, `@import`, `image-set(`, `src(` or a CSS escape; no
foreign markup is kept; and every entry is used. Each entry's `digest`, the SHA-256 of its bytes that PostgreSQL
computes, is what such an application serves the file by.

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
