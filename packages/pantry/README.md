# pantry

> *No mystery jars.*
>
> pantry keeps everything labeled: it stores QTI in PostgreSQL and refuses anything it can't name.

Store QTI 3.0 packages in a strict PostgreSQL model, and export them unchanged.

pantry imports a QTI 3.0 package, a directory or a `.zip` file, into a local PostgreSQL database, and exports it back
to files. It exists first to put [grizzle](../../vendor/README.md) through a large, real data model, so delivery is
out of scope. It is pre-release, and it reads XML through [crust](../crust/README.md). Its `package.json` exports only
what an install outside this workspace composes: the `Qti` schema built for a policy, the author role and login, the
connections, and the export's document scan with its rows-to-XML step.

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
- `GR8DES_QTI_INSTALL` names a package-media install's folder: its `policy.json`, exactly
  `{ "media": { "svg": "image/svg+xml", ... } }`, each lowercase extension a player may fetch with the one media type
  it is served as, and the `migrations/qti/snapshot.json` its own grizzle config generated. `import` and `export` then
  build `Qti` with the policy, whose laws the database alone judges: every address a player fetches is a path to a
  file of the package, with an extension the policy lists; no address is a `data:` one; no `style` holds `url(`,
  `@import`, `image-set(`, `src(` or a CSS escape; and no foreign markup is kept. A reference that names a document,
  such as a manifest's or an item ref's `href`, is held only to name a file of the package. Each entry's `digest`,
  the SHA-256 of its bytes that PostgreSQL computes, is what such an install serves the file by.
  `grizzle.config.ts` installs this package's own `Qti` whatever the setting says.

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
