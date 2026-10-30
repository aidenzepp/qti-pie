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

## Planning and building with shipyard

Work runs through [shipyard](https://github.com/ianzepp/shipyard)'s skills: `goal-forge`, `goal-check`, `campaign`,
`delivery`, `slicer`, `factory`, then `auditor`, with `correctness`, `poker-face`, `cleanliness`, `housekeeping` and
`polish` as the lenses `factory` calls. Their artifacts live in `docs/shipyard/`, which git ignores: planning work is
never committed. Write them nowhere else, and never stage them.

| Artifact                         | Path                                       |
| -------------------------------- | ------------------------------------------ |
| Goal                             | `docs/shipyard/GOAL.md`                    |
| Campaign                         | `docs/shipyard/campaign.md`                |
| Delivery spec per campaign stage | `docs/shipyard/delivery/<stage>.md`        |
| Slice list per spec              | `docs/shipyard/delivery/<stage>.slices.md` |
| Factory ledger                   | `docs/shipyard/ledger.md`                  |

An ignored file is not in a new worktree. A worker in a worktree reads these artifacts from the main checkout,
`~/Documents/dev/workspaces/personal/gr8des/docs/shipyard/`, and only the orchestrator in the main checkout writes them.

The shared machine resource rules below bind every stage:

- Every delivery spec has a `Resources` part: which units need the database, how they avoid the cluster-wide role
  collision, and the cleanup its phase ends with.
- Every slice states whether it needs a database.
- `factory` ends every phase with the cleanup and the size report, and records both in the ledger.

## Shared machine resources

This runs on one laptop with limited disk. Storage, databases and ports are not free, and leftovers are a defect. Every
plan and every orchestrator run budgets them, and every agent cleans up what it made. Clean up at phase boundaries, not
after every step, but never leave it for someone else.

**Worktrees.**

- Parallel work uses git worktrees under `.worktrees/<slice>` in this repo, or under `.claude/worktrees/` when Claude
  Code's subagent isolation creates them. Both are ignored by git, and both count toward the limit. Never create a
  worktree anywhere else, `/tmp` included.
- At most 6 exist at once. That matches the number of database connections a parallel run can hold (see below).
- A worktree is removed (`git worktree remove`, then its branch deleted) as soon as its slice is merged or abandoned. The
  orchestrator runs `git worktree prune` and confirms `git worktree list` shows only active slices at the end of every
  phase.
- `pnpm install` in a worktree links from the shared pnpm store, so a worktree's `node_modules` costs little. Never copy
  a `node_modules`, a build output or a cache between worktrees.

**PostgreSQL.**

- There is one cluster: grizzle's development cluster on `localhost:5433`. Never start another cluster, run `initdb`,
  open another port, or use Docker.
- At most one database per active worktree, named `gr8des_qti_<slice>`, created from `grizzle_template` and dropped when
  its worktree is removed. The orchestrator lists `gr8des_%` databases at the end of every phase and drops any without
  an active worktree.
- Roles are cluster-wide: two worktrees cannot install the same grizzle schema at the same time, because the second
  collides on its role names. The plan must say how parallel slices that need the database avoid that (for example,
  one database lease at a time, or schema names unique per worktree) before any of them run.

**Disk.**

- Budget: the worktrees and `gr8des_*` databases together stay under 5 GB. The orchestrator reports their size at the end
  of every phase (`du -sh .worktrees`, and `pg_database_size` for each `gr8des_%` database).
- Downloaded inputs, such as 1EdTech's QTI example packages, are fetched once into a single shared location the plan
  names, never once per worktree.
- Scratch files go in the worktree's `work/` folder and leave with the worktree. Never use `/tmp` for repositories,
  databases or large files.
- No process outlives its slice except the shared cluster.

## Schema intent

Data models shape the rest of the application. Before changing a schema, establish the expected domain meaning, data
preservation requirements and compatibility preferences from the user's instructions and `docs/qti-intent.md`. If those
expectations are unclear, check with the user before making consequential assumptions. Do not ask again when the
relevant expectation is already settled.

Do not introduce legacy repair paths, transitional models or compatibility layers merely because earlier iterations
used a different shape. A value that may be missing is a row of its own relation, because grizzle has no nullable
columns; that relation must represent an actual optional domain value.
