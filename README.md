# qti-pie

> *Easy as pie.*
>
> QTI isn't. qti-pie does the hard part: crust reads it, pantry keeps it, plate serves it.

A pnpm workspace for working with IMS QTI 3.0 assessments.

It reads QTI XML, stores QTI 3.0 packages in PostgreSQL and exports them back, and renders QTI 3.0. It runs on one
machine and has no deploy target. The code is pre-release, and nothing here is published to npm.

| Package                     | Does                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| [`crust`](packages/crust)   | Reads and writes XML, bytes to a tree and back.                        |
| [`pantry`](packages/pantry) | Imports QTI 3.0 packages into a strict PostgreSQL model, exports them. |
| [`plate`](packages/plate)   | Renders QTI 3.0.                                                       |

## Install

Requires Node 24 or later, pnpm and [Git LFS](https://git-lfs.com). Install Git LFS before cloning, or the migration
snapshots check out as pointer files.

```bash
git clone https://github.com/aidenzepp/qti-pie.git
cd qti-pie
pnpm install --frozen-lockfile
```

TypeScript runs directly on Node. There is no build step.

## Start

pantry needs the local PostgreSQL cluster described in [`AGENTS.md`](AGENTS.md#local-database). With it running:

```console
$ cd packages/pantry
$ scripts/db.sh create
$ scripts/db.sh migrate
$ node src/cli.ts import ./my-package
```

`node src/cli.ts --help` lists the commands.

## Development

```bash
pnpm check   # format, lint, typecheck
pnpm test    # each package's tests, one package at a time
pnpm fix     # format and apply lint fixes
```

Agents and contributors start at [`AGENTS.md`](AGENTS.md). [`docs/qti-intent.md`](docs/qti-intent.md) records what the
QTI model is for.

## License

MIT. grizzle, vendored under `vendor/`, is 0BSD; see [`vendor/README.md`](vendor/README.md).
