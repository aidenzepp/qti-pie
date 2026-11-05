# pantry

> *No mystery jars.*
>
> pantry keeps everything labeled: it stores QTI in PostgreSQL and refuses anything it can't name.

Store QTI 3.0 packages in a strict PostgreSQL model, and export them unchanged.

pantry imports a QTI 3.0 package, a directory or a `.zip` file, into a local PostgreSQL database, and exports it back
to files. It exists first to put [grizzle](../../vendor/README.md) through a large, real data model, so delivery is
out of scope. It is pre-release, it is not a library (its `package.json` exports nothing), and it reads XML through
[crust](../crust/README.md).

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

`scripts/db.sh reset` drops the database and this package's roles, then creates and migrates again.

## Development

[`docs/qti-intent.md`](../../docs/qti-intent.md) records what was settled before the model was planned. Read it before
changing the model. From the repository root:

```bash
pnpm check
pnpm --filter @qti-pie/pantry test
```

Tests that need the database use the local cluster. Agents start at [`AGENTS.md`](../../AGENTS.md).

## License

MIT
