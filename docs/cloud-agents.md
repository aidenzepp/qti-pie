# Cloud agents

The handbook for a cloud agent working one GitHub issue of plate's fan-out. Every cloud issue links here.

## Who this is for

You are a cloud agent on a fresh Ubuntu VM with this repository and one GitHub issue, and nothing else. The issue is your whole assignment: its goal, its write scope, its tests and its budget. This file is the rules. There is no operator to ask, so when the issue and this file do not settle a point, stop and follow "If blocked". The coordination tools named in `AGENTS.md` (vivi and tugboat) do not apply to you.

## What in AGENTS.md applies to you

`AGENTS.md` is written for local agents. Read it, then apply only this part of it.

| Section or rule in `AGENTS.md`                               | Applies | What it means for you                                                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Toolchain"                                                  | Yes     | Node 26 or later runs TypeScript source with no build step. pnpm workspace. Effect `4.1.2`, one copy. `vp` formats and lints. `tsc` is strict.                                                                                                                                                                                      |
| "Code" (the whole section)                                   | Yes     | Read the installed Effect `AGENTS.md` and follow its links. Use the skills under `.agents/skills/`. Use Effect error channels, never try/catch. Name generator functions. Import through `#plate/*` and the `"exports"` map, never by relative path. Read settings with Config. Tests use `@effect/vitest` and sit beside the code. |
| plate never depends on pantry                                | Yes     | plate depends on crust only.                                                                                                                                                                                                                                                                                                        |
| `docs/spec-readings.md`                                      | Yes     | The readings bind. An agent never makes a new reading.                                                                                                                                                                                                                                                                              |
| "Shared machine resources": no process outlives its slice    | Yes     | Stop every server and browser you start before you finish.                                                                                                                                                                                                                                                                          |
| "Local database", "grizzle"                                  | No      | plate has no database.                                                                                                                                                                                                                                                                                                              |
| "Coordination: vivi and tugboat", "Two checkouts, two Minds" | No      | You have no mailspace and no second checkout.                                                                                                                                                                                                                                                                                       |
| "Worktrees", the worktree cap                                | No      | Cursor gives you one checkout.                                                                                                                                                                                                                                                                                                      |
| "Planning and building with shipyard", `docs/goals`          | No      | The issue replaces the goal, the delivery spec and the slice list.                                                                                                                                                                                                                                                                  |
| The database lease                                           | No      | You never touch the cluster.                                                                                                                                                                                                                                                                                                        |
| "Workflow" > "Remote", the push list                         | No      | Cursor pushes your branch. You never push.                                                                                                                                                                                                                                                                                          |

## Toolchain and commands

Run every command from the repository root.

Install once: `pnpm install --frozen-lockfile`. It must not change `pnpm-lock.yaml`.

Check before you finish: `pnpm check`. It runs four things, and each failure looks different.

| Step                       | A failure looks like                                     | Fix                                               |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------- |
| `vp fmt --check`           | A list of files that would be reformatted                | Run the scoped fix below                          |
| `vp lint --type-aware`     | A rule name and a `file:line`, for example `sort-keys`   | Run the scoped fix, then fix what is left by hand |
| `tsc --noEmit` (root)      | `TS` error codes in `packages/*`                         | Fix the type; never loosen `tsconfig.json`        |
| `tsc --noEmit` (plate src) | `TS` error codes from `packages/plate/src/tsconfig.json` | Same                                              |

Scoped fix before a commit:

```sh
pnpm exec vp fmt packages/plate && pnpm exec vp lint --type-aware --fix packages/plate
```

Unit tests, by path, with a JSON report:

```sh
pnpm --filter @qti-pie/plate test <paths> --reporter=json --outputFile.json=work/<id>.json
```

The report path is relative to `packages/plate`, so it lands in `packages/plate/work/<id>.json`. Then check the issue's tag:

```sh
node packages/plate/scripts/cloud/tagged.mjs packages/plate/work/<id>.json "<tag>"
```

It exits 0 only when every test whose title carries the tag passed and none was skipped.

Browser tests: `pnpm --filter @qti-pie/plate test:browser`. It runs Chromium and WebKit, and both must pass. Report the counts per engine.

Caches. The environment pre-fetches `~/.cache/gr8des`. `PLATE_REQUIRE_CACHES` is not set in the cloud. The three `conformance-text` tests skip there, because the source text cannot be reproduced on the VM, and that is expected. Every other test must run and pass.

## Rules

Each rule is one line, and each has a reason in the fan-out plan.

1. Edit only the files your issue's write scope names. Disjoint scopes are what keep a hundred agents from conflicting.
2. Never edit a shared file: `packages/plate/src/index.ts`, any `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, any `tsconfig.json`, `src/emit/parts.ts`, `src/model/item.ts`, `src/payload.ts`, `src/messages.ts`, `src/vocabulary.ts`, `styles.css` outside your block, `README.md`, `CHANGELOG.md`, anything under `docs/`, `AGENTS.md`, or any file named `contract`.
3. Never write or change a contract; a contract is the supervisor's.
4. Never delete, skip, weaken or retag a test.
5. Never touch `packages/pantry` or `packages/crust`.
6. Never add a dependency or change the lockfile.
7. Never run the root `pnpm test`, `scripts/db.sh`, `scripts/serve.ts` or `playwright install`, and never bind ports 5190 to 5192.
8. Never copy text from 1EdTech's example packages into a fixture; write fresh content.
9. Never re-interpret a reading in `docs/spec-readings.md`; a disagreement is a question under "If blocked".
10. A bug outside your goal goes under Findings in your reply, not into a fix.
11. Strings you add live in your own module, in English. This is a stated limit, and a later pass centralises them.
12. Your CSS goes only in your delimited block of `styles.css`.
13. Tests assert at the public boundary (the exported functions, the rendered HTML or the DOM), never a private helper.
14. Every test title starts with its feature tags, for example `[Q-6]`.
15. Every exported name has TSDoc, per `.agents/skills/document-code/SKILL.md`.
16. Commit as `<type>(plate): <title>`, per `.agents/skills/conventional-commits/SKILL.md`.
17. Create no scratch file in the checkout except under `packages/plate/work/`, which git ignores.

## The pull request

Cursor's `autoCreatePR` opens the pull request, and these rules apply to it:

- The base is the issue's `startingRef`, which is `renderer/<area>/main`.
- The title is the issue title.
- The body is the three blocks of your final reply (Report, Findings, the verdict line) and then `Closes #<n>`.
- One pull request per issue.
- Never push to `main`.
- Never force-push.

## Your final reply (the verdict protocol)

End your run with a reply of exactly three blocks.

1. **Report.** What changed, file by file. List the commands you ran and their results: the `pnpm check` result, the test counts, the `tagged.mjs` exit code, and the browser counts per engine when the issue needs them.
2. **Findings.** Bugs, surprises and out-of-scope problems you saw and did not fix. Write `none` if there are none.
3. **The verdict line.** The last line of the reply, exactly one of:

```text
LANE-VERDICT: GREEN
LANE-VERDICT: RED <one-line reason>
BLOCKED: <one question>
```

| Line      | Meaning                                                                                                               |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| `GREEN`   | The done-when holds: `pnpm check` passes and the issue's tagged tests passed with none skipped.                       |
| `RED`     | You did the work but a check fails, or you stopped at the budget. The reason names the failing check or what remains. |
| `BLOCKED` | You cannot continue without an answer. See "If blocked".                                                              |

A reply with no verdict line counts as a failure.

Budget. Stop at the issue's budget with `RED` and say what remains. Two failed attempts at a red command mean `RED`, not a third attempt.

A check-first issue may end with no change. Then list each file as `INSPECTED-CLEAN`, say that you changed no source file, and add the tests the issue asks for. "No change" is a valid and complete result, and the reply says so.

## If blocked

1. Stop and change nothing more.
2. Say what you tried, in a few lines.
3. End with `BLOCKED: <one question>`.

Never guess the spec or a contract. The supervisor answers by a follow-up run on the same issue.
