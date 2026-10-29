# Agent instructions

gr8des is a pnpm workspace. `packages/qti` implements IMS QTI 3.0 on [grizzle](vendor/README.md), and exists first to
put grizzle through a large, real data model. Read [docs/qti-intent.md](docs/qti-intent.md) before planning or changing
the QTI model. Everything runs locally; there is no deploy target.

## Toolchain

- Node 24 or later runs TypeScript source directly. There is no build step.
- pnpm workspace. Effect is pinned to `4.0.7`, and the workspace must keep exactly one copy (`pnpm why effect -r`).
- grizzle `1.0.0-beta.0` is vendored as tarballs; see `vendor/README.md`.
- Vite+ (`vp`) formats, lints and runs tests. TypeScript `7.0.2` typechecks under the strict settings in `tsconfig.json`.

Run before completing implementation:

```sh
pnpm check   # vp fmt --check, vp lint --type-aware, tsc --noEmit
pnpm test    # each package's tests, one package at a time
```

`pnpm fix` formats and applies lint fixes.

## Local database

The QTI package runs on grizzle's development cluster: PostgreSQL 19rc1 with grizzle's patches, on `localhost:5433`,
verify-full TLS only. Build and start it from the grizzle clone (`pnpm pg:build`, `pnpm pg:init`, `pnpm pg:doctor`;
`pnpm pg start` after a reboot). From `packages/qti`:

```sh
scripts/db.sh create    # database gr8des_qti from grizzle_template, owned by grizzle_dev
scripts/db.sh migrate   # grizzle migrate, then give each login its local password
scripts/db.sh reset     # drop the database and this package's roles, then create and migrate
```

Login passwords live outside the repo in `~/.local/var/gr8des/<database>/<role>.password`. PostgreSQL roles are
cluster-wide, so a grizzle schema name is one installation per cluster: never reuse a name grizzle's own tests use.

## grizzle

Load `.agents/skills/grizzle/SKILL.md` before editing a schema, role, login, workload or `grizzle.config.ts`, and before
running `grizzle generate` or `grizzle migrate`. Run grizzle from the package directory (`pnpm exec grizzle ...`); it
reads `grizzle.config.ts` from there.

- The lint's `sort-keys` rule orders object keys, a relation's fields included, and field order is column order. Run
  `pnpm fix` before `grizzle generate`, or the lint fix becomes an ungenerated schema change that `grizzle check`
  refuses.
- Read every drafted SQL file and resolve its markers. Never edit `snapshot.json` or `meta.json`.
- grizzle refuses what its README's Limits section lists: no nullable columns, no JSON column, no timestamp type, no
  outer joins, no window functions, no raw SQL at run time, at most 100,000 rows per ChangeSet input. Model within them.
- When grizzle behaves wrongly or a limit blocks a correct model, record it in `docs/grizzle-findings.md` with the
  smallest reproduction. That record is a deliverable of this project, not a side note.

## Code

Before writing Effect code, read `packages/qti/node_modules/effect/AGENTS.md` and follow its links. For APIs it does not
cover, read `node_modules/effect/src` of the installed version.

Use the skills in `.agents/skills/`:

- `effect-design`: Effect code, services, layers and configuration. Its Alchemy and Cloudflare examples do not apply
  here; its native-capability review does.
- `trace-effect`: effectful operations and their observability.
- `error-messages`: caller-facing errors.
- `document-code`: writing or reviewing code.
- `conventional-commits`: committing.

Use Effect error channels; built-in try/catch is prohibited by lint. Generator functions passed to `Effect.gen` are
named (`func-names`).

Import a package's own source through its `#<package>/*` alias from `package.json` `imports` (`#qti/*`, and
`#migrations/*` for committed snapshots). Relative source imports are refused by lint.

Read environment-backed settings with Effect `Config`, with constraints and defaults in Config or Schema. Test with
`ConfigProvider.fromUnknown` rather than mutating the host environment.

Tests use `@effect/vitest` (`it.effect`, `layer`) and sit beside the code they test. A test that needs the database
uses the local cluster through a login's `DbLayer`, never a mock.

## Schema intent

Data models shape the rest of the application. Before changing a schema, establish the expected domain meaning, data
preservation requirements and compatibility preferences from the user's instructions and `docs/qti-intent.md`. If those
expectations are unclear, check with the user before making consequential assumptions. Do not ask again when the
relevant expectation is already settled.

Do not introduce legacy repair paths, transitional models or compatibility layers merely because earlier iterations
used a different shape. A value that may be missing is a row of its own relation, because grizzle has no nullable
columns; that relation must represent an actual optional domain value.
