# Agent instructions

qti-pie (the first local checkout is still the folder `gr8des`) is a pnpm workspace of three packages. `packages/crust`
(`@qti-pie/crust`) is the shared XML reader and writer, bytes to an XML tree and back; its dependencies stay `effect`
and `saxes`, so grizzle stays out of anything that depends on it. `packages/pantry` (`@qti-pie/pantry`) implements IMS
QTI 3.0 on [grizzle](vendor/README.md), and exists first to put grizzle through a large, real data model. Read
[docs/qti-intent.md](docs/qti-intent.md) before planning or changing the QTI model. `packages/plate` (`@qti-pie/plate`)
is planned: it renders QTI 3.0, depends on crust and never on pantry, and its intent and rules arrive with its own goal;
pantry's intent (a grizzle test vehicle, delivery out of scope) does not bind it. The packages read the specifications the same way: [docs/spec-readings.md](docs/spec-readings.md). Everything runs locally; there is no deploy target. The shared repository
is [aidenzepp/qti-pie](https://github.com/aidenzepp/qti-pie) (public, MIT-licensed; main is protected), the remote `origin`.

## Toolchain

- Node 26 or later runs TypeScript source directly. There is no build step.
- pnpm workspace. Effect is pinned to `4.1.2`, and the workspace must keep exactly one copy (`pnpm why effect -r`).
- grizzle trunk at commit `1bf3dbb` (`1bf3dbb0a625949c086c28785f60b275d758b2b1`) is vendored as tarballs; see
  `vendor/README.md`.
- Git LFS holds every `packages/*/migrations/**/snapshot.json` (`.gitattributes`). Install `git-lfs` before cloning;
  without it the snapshot checks out as a pointer file and grizzle refuses it.
- Vite+ (`vp`) formats, lints and runs tests. TypeScript `7.0.2` typechecks under the strict settings in `tsconfig.json`.

Run before completing implementation:

```sh
pnpm check   # vp fmt --check, vp lint --type-aware, tsc --noEmit (root, then packages/plate/src/tsconfig.json)
pnpm test    # each package's tests, one package at a time
```

`pnpm fix` formats and applies lint fixes.

## Local database

The QTI package runs on grizzle's development cluster: PostgreSQL 19rc1 with grizzle's patches, on `localhost:5433`,
verify-full TLS only. Build and start it from the grizzle clone (`pnpm pg:build`, `pnpm pg:init`, `pnpm pg:doctor`;
`pnpm pg start` after a reboot). Its state is in `~/.local/var/grizzle/pg19rc1`. From `packages/pantry`:

```sh
scripts/db.sh create    # database gr8des_qti from grizzle_template, owned by grizzle_dev
scripts/db.sh migrate   # grizzle migrate, then give each login its local password
scripts/db.sh reset     # drop the database and this package's roles, then create and migrate
```

Login passwords live outside the repo in `~/.local/var/gr8des/<database>/<role>.password`. PostgreSQL roles are
cluster-wide, so a grizzle schema name is one installation per cluster: the cluster holds at most one installation of
the Qti schema at a time, and no schema name is one grizzle's own tests use.

## grizzle

Load `.agents/skills/grizzle/SKILL.md` before editing a schema, role, login, workload or `grizzle.config.ts`, and before
running `grizzle generate` or `grizzle migrate`. Run grizzle from the package directory (`pnpm exec grizzle ...`); it
reads `grizzle.config.ts` from there.

- The lint's `sort-keys` rule orders object keys, a relation's fields included, and field order is column order. Run
  `pnpm fix` before `grizzle generate`, or the lint fix becomes an ungenerated schema change that `grizzle check`
  refuses.
- Read every drafted SQL file and resolve its markers. Never edit `snapshot.json` or `meta.json`.
- grizzle refuses what its README's Limits section lists: no nullable columns, no timestamp type, no outer joins, no
  window functions, no raw SQL at run time. Its field types (README, "Tables
  and types") include no JSON or XML type. Model within them.
- When grizzle behaves wrongly or a limit blocks a correct model, record it in `docs/grizzle-findings.md` with the
  smallest reproduction. That record is a deliverable of this project, not a side note.
- grizzle is new, so expect real defects, and prove each one before blaming grizzle. Triage every
  finding against grizzle's source, the clone at `~/Documents/dev/workspaces/personal/grizzle` checked out at the
  vendored commit (`vendor/README.md`), and classify it as one of: our misuse (fix it here, record nothing), a
  documented limit (record it as a limit), or a grizzle defect (record the cause with `file:line` anchors and a minimal
  reproduction that does not need this repository). A workaround in our code does not close a finding: record the
  workaround beside the cause. A confirmed grizzle defect becomes a GitHub issue on `bjornpagen/grizzle`.
- **Pull first.** Before treating anything as a grizzle defect, fetch trunk in `~/.cache/gr8des/grizzle-trunk`,
  re-run the minimal reproduction on the newest `main`, and take the six-step gate below only if it still fails. Record
  the commit checked in `docs/grizzle-findings.md`.
- **Re-pinning.** Move the vendored grizzle one exact commit at a time, never floating, as a small gate pull request
  with the full checks.

### Filing grizzle issues

Agents may file a grizzle issue without asking the operator, but only after every step below passes, in order. The
operator's standing authorization replaces the `issue-authoring` skill's per-issue yes; nothing else in that skill is
waived. If any step fails or is in doubt, record the finding and do not file.

1. **Triage against source.** The finding is classified a grizzle defect, with the cause traced to `file:line` in
   grizzle's source at the vendored commit and checked against grizzle's README and agent guide, so documented
   behavior is not reported as a bug.
2. **Standalone reproduction, run.** A minimal reproduction that needs nothing from this repository runs and fails as
   claimed, with its output kept verbatim, beside a control: the nearest input that works.
3. **Independent check.** A second seat that did not find it (an `auditor`, from another model family when one is
   available) re-reads the source and re-runs the reproduction, and confirms the problem is grizzle's, not our use of
   it.
4. **Draft with `issue-authoring`.** Follow the skill completely: the duplicate search, pinned permalinks, voice, the
   lint and the disclosure block, with the settings line the Mind puts in the task.
5. **Hater pass.** A `hater` reads the draft cold, as grizzle's maintainer reading a report they suspect is user error.
   A head turns its report into changes, and the draft is revised and linted again.
6. **File.** As the operator's `aidenzepp` account, for that command only:
   `GH_TOKEN="$(gh auth token --user aidenzepp)" gh issue create --repo bjornpagen/grizzle --title … --body-file …`,
   with no labels or assignees. Record the issue URL in `docs/grizzle-findings.md` and mail the operator the link.

**Issues only.** `bjornpagen/grizzle` is public (since 2026-11-03), and `aidenzepp` holds write access to it so that it can
file issues. The issues are public under the operator's account, so a draft carries none of this project's names,
internals or anything private.
Opening an issue is the only thing any agent does there. Never push, create or delete a branch or tag, open or review
a pull request, comment, edit or close an issue, or change any setting. The local clone's push URL is disabled on
purpose; never restore it. Pushing code may come later, but only on an explicit operator ruling.

## Code

Before writing Effect code, read `packages/pantry/node_modules/effect/AGENTS.md` and follow its links. For APIs it does not
cover, read `node_modules/effect/src` of the installed version.

Use the skills in `.agents/skills/`. `.claude/skills/` holds a link to each, so Claude Code lists them too; edit only
`.agents/skills/`. `.agents/skills/grizzle` is the skill grizzle ships (`node_modules/@bjornpagen/grizzle/skills/grizzle`): when
the grizzle pin moves, copy the new one over it in the same pull request.

- `effect-design`: the native-capability review and this repository's local Effect rulings. Effect structure and style
  stay with the installed Effect guide above.
- `trace-effect`: effectful operations and their observability.
- `error-messages`: caller-facing errors.
- `document-code`: writing or reviewing code.
- `conventional-commits`: committing.

Use Effect error channels; built-in try/catch is prohibited by lint. Generator functions passed to `Effect.gen` are
named (`func-names`).

Import shape, for every package: it exposes its public parts through an `"exports"` map in `package.json` pointing at
TypeScript source (no build step), consumers depend with `"workspace:*"`, and it imports its own files through its own
`#<package>/*` alias from `package.json` `imports` (`#pantry/*` in pantry, `#crust/*` in crust, and `#migrations/*`
for committed snapshots), never relative paths. pantry's `"exports"` is `{}`: it exports nothing, so nothing depends on it. Nothing outside a package reaches a file its `"exports"` map does not
list. The checks that enforce it:

- The resolver (`tsc` in `pnpm check`, and Node at run time) refuses a subpath an `"exports"` map does not list, and
  another package's alias.
- pnpm refuses an undeclared workspace dependency.
- Lint refuses relative, absolute and `file:` specifiers, and crust importing itself by name.
- crust's `src/package.test.ts` pins its dependencies.

Read environment-backed settings with Effect `Config`, with constraints and defaults in Config or Schema. Test with
`ConfigProvider.fromUnknown` rather than mutating the host environment.

Tests use `@effect/vitest` (`it.effect`, `layer`) and sit beside the code they test. A test that needs the database
uses the local cluster through a login's `DbLayer`, never a mock.

The corpus verdict file, `packages/pantry/verdicts/<corpus tarball basename>.tsv` (today `qti-examples-0a92fbb.tsv`),
records what the importer did with each 1EdTech example zip. It is TSV with LF line ends and the columns `file`,
`verdict` (`accepted` or `refused`) and `rule` (the refusal rule, empty when accepted), sorted by `file`, one row per
corpus zip keyed by its tarball member. It holds no 1EdTech content, only member paths, verdicts and rule names. To
regenerate it, run the corpus witness under a lease (`GR8DES_CORPUS=1 GR8DES_PG_DATABASE=<database> pnpm
--fail-if-no-match --filter @qti-pie/pantry run test src/cli.corpus.db.test.ts`), then run the `cp` its failure message
prints to adopt `packages/pantry/work/verdicts/<name>.tsv`. A stale file fails that corpus run; a renamed rule or a
corpus zip without a row fails `src/test/verdicts.committed.test.ts`, which needs no lease.

## Planning and building with shipyard

Work runs through [shipyard](https://github.com/ianzepp/shipyard)'s skills: `goal-forge`, `goal-check`, `campaign`,
`delivery`, `slicer`, `factory`, then `auditor`, with `correctness`, `poker-face`, `cleanliness`, `housekeeping` and
`polish` as the lenses `factory` calls. Their artifacts are bookkeeping, and here bookkeeping is never committed: it
lives in the git-ignored paths below, in shipyard's default layout, and is never staged. That overrides shipyard's
default of integrating bookkeeping with the work.

| Artifact                                | Path                                         |
| --------------------------------------- | -------------------------------------------- |
| Goal                                    | `docs/goals/<goal>/GOAL.md`                  |
| Factory ledger, one per run             | `docs/goals/<goal>/ledger.md`                |
| Delivery spec for phase n               | `docs/goals/<goal>/phase-<n>.md`             |
| Slice list for phase n                  | `docs/goals/<goal>/phase-<n>.slices.md`      |
| Slice list for a repair phase           | `docs/goals/<goal>/repair-<n>.slices.md`     |
| Audit reports                           | `docs/goals/<goal>/audit.md`, `audit-<n>.md` |
| Campaign                                | `docs/campaigns/<campaign>/CAMPAIGN.md`      |
| Research findings, per vivi task handle | `docs/research/<handle>.md`                  |

These files live only in the main checkout, `~/Documents/dev/workspaces/personal/gr8des/`; an ignored file is not in a
new worktree, so a seat in a worktree reads them from there. The Mind is their sole writer, except that a researcher
writes its own handle's findings file. Bookkeeping is durable as files in the main checkout; shipyard's clean-tree and
scope checks already exclude it.

### Workflow

This is the workflow `factory` records in its ledger; it meets shipyard's five requirements.

- **Structure A, a branch per slice.** Each feature has a branch `qti/<feature>/main` from `main`, checked out only in
  that feature's merge worktree `.worktrees/merge-<feature>/`; the main checkout stays on `main`, so several features
  can run at once. Each slice has a sibling branch `qti/<feature>/<slice-id>` from the feature branch, checked out in
  its own worktree (see Shared machine resources). Merge worktrees count toward the worktree limit. Slices with
  disjoint write scopes run in parallel.
- **Who records.** The hand commits its own slice on its slice branch (`<type>(<scope>): <slice title>` with a
  `Slice: <id>` trailer) and reports. Sign-off diffs the slice branch against its base. The Mind then files a merge task
  for the `merge` seat, depending on the slice's task: in the feature's merge worktree, it merges the slice branch into
  the feature branch, runs the checks the task names, and, on success, removes the slice's worktree and deletes its
  branch. For a slice that touches
  no database, the checks are `pnpm check` and that slice's own tests. A slice that touches the database, and the phase
  freeze, run `pnpm check` and the affected package's full test suite. These checks belong to the merge seat, never to a
  hand. The Mind accepts the merge task; that feature-branch tip is the slice's ref. The Mind does not run git itself.
- **Integration.** A feature, or a `gate/<name>` fix, reaches `main` through a pull request on `origin`, on a merge
  task. Two checkouts push to `origin`, so the merge seat first fetches `origin` and fast-forwards local `main` to
  `origin/main`. It then merges the branch into `main` locally and runs the integration checks (`pnpm check`,
  `grizzle check`, the full suite under a lease). Only on green does it push the branch, open the pull request as
  `aidenzepp` (`GH_TOKEN="$(gh auth token --user aidenzepp)"` on that command only, `gh pr create --base main`), merge
  it with `gh pr merge --merge` (a merge commit, never squash or rebase), and fast-forward local `main`. A failed check
  leaves no pull request. If `origin/main` moves after the checks ran, fetch, merge again and re-run the checks before
  merging the pull request. Slices still merge into their feature branch locally and are never pushed.
- **Remote.** Push only `main`, `qti/<feature>/main`, `renderer/<feature>/main` and `gate/<name>`. Never force-push, and never rewrite a pushed
  branch: fixes go forward and are pushed again. Issues that track this project's work may be opened on `origin`.
- **Audits** take a frozen range on the feature branch. Never rewrite accepted history, never force anything, fix
  forward. The one exception was the operator-authorized move of `snapshot.json` into Git LFS on 2026-11-03, which
  changed every commit hash. A hash written before it (in the ledger, a slice list, the findings or a commit message)
  translates through `~/.local/var/gr8des/lfs-commit-map.csv` (old,new) and still resolves in the mirror
  `~/.cache/gr8des/pre-lfs.git`.

The shared machine resource rules below bind every stage:

- Every delivery spec has a `Resources` part: which units need the database, how they avoid the cluster-wide role
  collision, and the cleanup its phase ends with.
- Every slice states whether it needs a database.
- `factory` ends every phase with the cleanup and the size report, and records both in the ledger.

## Coordination: vivi and tugboat

This project coordinates through a [vivi](https://github.com/ianzepp/vivi) mailspace in `.vivi/` (machine-local and
never committed) and runs the tugboat protocol in Mind mode: the Mind routes, and worker seats do the work. Load the
`vivi` and `tugboat` skills, and start every session with `vivi boot --project .`. Its project rules are the
non-negotiables of this file, shown to every seat.

| Seat         | Band    | Does                                                                                                         |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| `mind`       | `P1-S2` | The orchestrating session. Files work in vivi, spawns seats, accepts or reopens their reports, runs shipyard |
| `planner`    | `P1-S2` | Lowers goals through shipyard: `goal-forge`, `goal-check`, `delivery`, and slices with `slicer`              |
| `researcher` | `P1-S1` | Answers one question from primary sources into its findings file; changes no code                            |
| `hand`       | `P2-S0` | One logical change or one experiment, in its own worktree, committed and reported                            |
| `merge`      | `P2-S0` | Merges an accepted slice into its feature branch, runs the integration checks, removes the slice's worktree  |
| `auditor`    | `P1-S1` | Reviews a frozen range: settled specs or landed phases                                                       |
| `hater`      | `P3-S0` | A cold, hostile first read of one artifact for one skeptical audience; a head extracts the merit             |
| `head-cto`   | `P0-S2` | Advises on architecture and gate honesty                                                                     |
| `head-cxo`   | `P0-S2` | Advises on purity and complexity                                                                             |

`operator` is the person. `pump-planner` and the pump came with the mailspace and are not used. Seats run as
subagents of the Mind's session (`harness: subagent`): the Mind files the task first, then spawns the seat with the
four-line tugboat pointer and nothing else, and a hand gets its own worktree. `scripts/boot-probe` measures the
resource budget for `vivi boot`.

### Two checkouts, two Minds

Two checkouts of `origin` work at once, each with its own Mind and its own vivi mailspace:

| Checkout                                               | Package           | Feature branches          | Mailspace        |
| ------------------------------------------------------ | ----------------- | ------------------------- | ---------------- |
| `~/Documents/dev/workspaces/personal/gr8des`           | `packages/pantry` | `qti/<feature>/main`      | its own `.vivi/` |
| `~/Documents/dev/workspaces/personal/qti-pie-renderer` | `packages/plate`  | `renderer/<feature>/main` | its own `.vivi/` |

- A Mind and its seats work only in their own checkout and its worktrees. Never run `vivi` against the other checkout,
  and never create a worktree of one checkout inside the other.
- A checkout changes the other package's files only through a `gate/<name>` pull request the operator asked for. Files
  both touch (`AGENTS.md`, `docs/spec-readings.md`, the root `package.json`, `pnpm-lock.yaml`, the lint and TypeScript
  configuration) change by pull request, and a conflict is fixed forward.
- The two Minds do not mail each other. They coordinate through the operator and through the repository.

## Shared machine resources

This runs on one laptop with limited disk. Storage, databases and ports are not free, and leftovers are a defect. Every
plan and every orchestrator run budgets them, and every agent cleans up what it made. Clean up at phase boundaries, not
after every step, but never leave it for someone else.

**Worktrees.**

- Parallel work uses git worktrees under `.worktrees/<slice>` in this repo, or under `.claude/worktrees/` when Claude
  Code's subagent isolation creates them. Both are ignored by git, and both count toward the limit. Never create a
  worktree anywhere else, `/tmp` included.
- At most 10 exist at once in each checkout, slice and merge worktrees together. Only one seat holds the database at a time (see below),
  so worktrees that need no database are the ones that run in parallel.
- A worktree is removed (`git worktree remove`, then its branch deleted) as soon as its slice is merged or abandoned. The
  orchestrator runs `git worktree prune` and confirms `git worktree list` shows only active slices at the end of every
  phase.
- `pnpm install` in a worktree links from the shared pnpm store, so a worktree's `node_modules` costs little. Never copy
  a `node_modules`, a build output or a cache between worktrees.

**PostgreSQL.**

- There is exactly one cluster, on `localhost:5433`: grizzle's patched PostgreSQL 19rc1. Never start a second, run
  `initdb` outside grizzle's `scripts/pg/init.sh`, open another port, or use Docker.
- At most one database per active worktree, named `gr8des_qti_<slice>`, created from `grizzle_template` and dropped when
  its worktree is removed. The orchestrator lists `gr8des_%` databases at the end of every phase and drops any without
  an active worktree.
- Roles are cluster-wide: two worktrees cannot install the same grizzle schema at the same time, because the second
  collides on its role names. So one seat at a time holds a database. The plan must still say how parallel slices that
  need the database avoid the collision (one lease at a time) before any of them run.

**Disk.**

- Budget: each checkout's worktrees and databases together stay under 20 GB. The renderer uses no database; its dev
  servers and browsers take ports its own plan fixes, never 5433, and are stopped when their slice ends.
- Size report: each orchestrator reports its checkout's size at the end
  of every phase (`du -sh .worktrees`, and `pg_database_size` for each `gr8des_%` database).
- Downloaded inputs, such as specifications, schema files and 1EdTech's QTI example packages, are fetched once into
  `~/.cache/gr8des/`, never into the repository or once per worktree.
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
