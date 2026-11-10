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

Begin every run with the committed install, then put Node 26 first on `PATH`:

```sh
bash .cursor/install.sh && export PATH=/usr/local/node26/bin:$PATH && hash -r && node -v
```

The install is idempotent. It sets up Node 26.13.0, pnpm 12.16.1, the workspace, Playwright's Chromium and WebKit, and the caches, and takes seconds when the build already holds them. The `export` is needed because the agent shell keeps an older Node first on `PATH`. `node -v` must print a version that starts with `v26`. In the cloud, the three tests tagged `conformance-text` skip, and no other test does.

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

## Issue ids

The work is cut into issues, each with an id such as `m3d-01`. A GitHub issue carries its id in its title, before a colon, so a source comment that names an issue by its id resolves through this table or through a search of the repository's issues.

| id         | title                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m3d-01`   | runtime core: the controller registry wired to one stub per runtime kind, with in-page tests over every fixture                                                   |
| `m3d-02`   | select-then-place core: pick up, move, place, cancel, announcements, key map, pointer drag over the same model                                                    |
| `m3d-03`   | Gap Match core: model, redact, parts, SSR, validation, bindings, fixture                                                                                          |
| `m3d-04`   | Gap Match runtime controller and in-page tests (keyboard-only, 2.5.7, 2.5.8)                                                                                      |
| `m3d-05`   | Graphic Gap Match core: shapes, coords (reading 59), area semantics                                                                                               |
| `m3d-06`   | Graphic Gap Match runtime controller and in-page tests                                                                                                            |
| `m3d-07`   | Hotspot core: positioned native checkable controls over the image; reading 80's default hotspot                                                                   |
| `m3d-08`   | Hotspot runtime polish (pointer areas, announcements) and in-page tests                                                                                           |
| `m3d-09`   | Hot Text core: inline native checkable controls; reading 38                                                                                                       |
| `m3d-10`   | Hot Text runtime polish and in-page tests                                                                                                                         |
| `m3d-11`   | Match core: the matrix, max-associations, directed pairs                                                                                                          |
| `m3d-12`   | Match runtime controller and in-page tests                                                                                                                        |
| `m3d-13`   | the playground serves the runtime bundle (opt-in) so the browser walk can upgrade                                                                                 |
| `m3d-14`   | pointer-drag enhancement over select-then-place (optional drag, never the only path)                                                                              |
| `m3e-01`   | rubric blocks (reading 65): item rubric by view; section and test rubric shown with each item                                                                     |
| `m3e-02`   | shared stimulus: the referenced stimulus body rendered with its items; stimulus resources                                                                         |
| `m3e-03`   | composite items: check-first; tagged tests over a multi-interaction item's render, post and score                                                                 |
| `m3e-04`   | catalogs: listing, and the resolution function (document, supports) -> content \| dormant behind render's supports option                                         |
| `m3e-05`   | MathML (readings 2, 71): normalisation (mfenced, menclose), validity per the MathML 3 Recommendation, cn hex doubles                                              |
| `m3e-06`   | the full shared vocabulary and CSS classes: vocabulary.ts and the class table are this issue's alone                                                              |
| `m3e-07`   | captions: track on media, catalog captions                                                                                                                        |
| `m3e-08`   | glossary on screen: catalog glossary as a native details/popover, keyboard reachable                                                                              |
| `m3e-09`   | magnification and text/background colour: supports-driven CSS variables                                                                                           |
| `m3f-01`   | time limits: enforcement in advance, allow-late-submission, the time navigation part that warns before expiry                                                     |
| `m3f-02`   | selection and ordering: check-first; tagged tests over the session's selection and shuffle; fixes                                                                 |
| `m3f-03`   | section references (reading 170): a local section document assembled at openPackage                                                                               |
| `m3f-04`   | package and resource metadata: qti-metadata and LOM on PackageResource                                                                                            |
| `m3f-05`   | item session control and structure claims: check-first tagged tests; fixes                                                                                        |
| `m3f-06`   | includes: XInclude at item and section level, or the stated limit with its row                                                                                    |
| `m3f-07`   | context declarations and the remaining packaging rows: claims, limited where member-only                                                                          |
| `m3g-01`   | React core: Item, useParts, the parts override map, state props, useUpgrade                                                                                       |
| `m3g-02`   | React components for the shipped interactions and chrome: Choice, Text Entry, Extended Text, Inline Choice, Status, Navigation                                    |
| `m3g-03`   | React wrappers for the M3.d interactions                                                                                                                          |
| `m3g-04`   | React wrappers for the elective interactions and PortableCustom over the frame host                                                                               |
| `m3g-05`   | the shadcn registry item: registry.json, the item installing the components and the sheet                                                                         |
| `m3g-06`   | TestProvider: the transport, the hooks, and createTestServer over plate's session functions                                                                       |
| `m3g-07`   | the React 19 host fixture (criterion 10): one item rendered and scored with a shadcn theme                                                                        |
| `m3g-08`   | the reference app: React, shadcn, React Hook Form, a sample test end to end in Chromium and WebKit; README examples compile and run                               |
| `m4-01`    | PNP reader (AfA PNP 3.0, read tolerantly across the 12 contradictions) -> Supports                                                                                |
| `m4-02`    | SSML and PLS model (readings 3, 39 to 44): both carriers to one speech plan; validity per speak fragment; data-qti-suppress-tts                                   |
| `m4-03`    | additional testing time: multiplier, fixed minutes, unlimited, on the displayed and the enforced timer                                                            |
| `m4-04`    | read-aloud engine: candidate-started, pause, stop, Web Speech, off for screen-reader, pronunciations never in aria-label                                          |
| `m4-05`    | answer masking: visually and programmatically unavailable, a toggle per choice                                                                                    |
| `m4-06`    | audio description, PNP-driven                                                                                                                                     |
| `m4-07`    | braille, PNP-driven                                                                                                                                               |
| `m4-08`    | breaks, PNP-driven                                                                                                                                                |
| `m4-09`    | long description, PNP-driven                                                                                                                                      |
| `m4-10`    | sign language, PNP-driven                                                                                                                                         |
| `m4-11`    | tactile, PNP-driven                                                                                                                                               |
| `m4-12`    | transcript and the ARIA subset claim, PNP-driven                                                                                                                  |
| `pci-01`   | PCI module resolution (readings 11, 20; PCI-2, PCI-3, PCI-5): every corpus route, .js never doubled, type-identifier notice                                       |
| `pci-02`   | the Appendix C JSON binding, both ways, for every base type and cardinality                                                                                       |
| `pci-03`   | PCI SSR: the model, the inert template, verdict rows, a fresh fixture package; the corpus packages' verdicts (PCI-1)                                              |
| `pci-04`   | the frame host: one sandboxed iframe per PCI, AMD loader and bridge inside, event.source plus nonce, ResizeObserver height, oncompleted before teardown           |
| `pci-05`   | PCI responses and solution: Appendix C JSON in the hidden input, scored on the server; boundTo only in the solution state; 3.0.1 deltas; Q-16 limited             |
| `ei-01`    | Upload: input type=file, the file value, the host's multipart/form-data duty                                                                                      |
| `ei-02`    | End Attempt: a native submit button naming its response; count-attempt at the stated default pending G-928                                                        |
| `ei-03`    | Media (reading I-8.11 controls): native video/audio, play count by runtime, min-plays/max-plays                                                                   |
| `ei-04`    | Associate core                                                                                                                                                    |
| `ei-05`    | Associate runtime over select-then-place                                                                                                                          |
| `ei-06`    | Order core (readings 18, 172)                                                                                                                                     |
| `ei-07`    | Order runtime over select-then-place; a non-drag reorder path                                                                                                     |
| `ei-08`    | Graphic Associate core                                                                                                                                            |
| `ei-09`    | Graphic Associate runtime                                                                                                                                         |
| `ei-10`    | Graphic Order core (reading 18)                                                                                                                                   |
| `ei-11`    | Graphic Order runtime                                                                                                                                             |
| `ei-12`    | Position Object core                                                                                                                                              |
| `ei-13`    | Position Object runtime                                                                                                                                           |
| `ei-14`    | Select Point core: number inputs as the script-free path; the point value                                                                                         |
| `ei-15`    | Select Point runtime: click and arrow-key crosshair over the image                                                                                                |
| `ei-16`    | Slider core: native input type=range, step, lower-bound, upper-bound, reverse, step-label                                                                         |
| `ei-17`    | Drawing core: the model, the file response, the notice without script                                                                                             |
| `ei-18`    | Drawing runtime: canvas, pen, erase, undo, PNG into the file value, keyboard path                                                                                 |
| `ei-19`    | elective interactions' accessibility pages: one fixture page per interaction for the local screen-reader pass                                                     |
| `m5-01`    | modal feedback: a native dialog that returns focus; dialog[open] without script                                                                                   |
| `m5-02`    | inline and block feedback (qti-feedback-inline, qti-feedback-block; reading 77)                                                                                   |
| `m5-03`    | adaptive items: adaptive, attempts until completionStatus, the metadata rows                                                                                      |
| `m5-04`    | test feedback: during and atEnd, in the test part and the test                                                                                                    |
| `m5-05`    | branch rules and pre-conditions (reading 4, C6, T-O10) in advance                                                                                                 |
| `m5-06`    | stylesheets: @scope wrap or selector prefix, the package file served                                                                                              |
| `m5-07`    | companion materials (reading 12)                                                                                                                                  |
| `m5-08`    | elementary and content MathML, hand-written fixtures                                                                                                              |
| `m5-09`    | elective result content: candidate comment, test feedback outcomes                                                                                                |
| `m5-10`    | PNP tool preferences exposed in Supports for the host; limited rows where plate renders no tool                                                                   |
| `m5-11`    | PNP catalog content supports                                                                                                                                      |
| `m5-12`    | display preferences                                                                                                                                               |
| `m5-13`    | spoken preferences                                                                                                                                                |
| `m5-14`    | ARIA full and the remaining A-family rows' tests                                                                                                                  |
| `m5-15`    | the ledger's goal-close completeness: every unsupported-with-notice row named with its owner                                                                      |
| `m5-16`    | data-* and foreign content in the new interactions (readings 13, 49)                                                                                              |
| `m3h-01`   | the browser and accessibility sweep: axe-core class WCAG 2.2 AA over every rendered corpus item in Chromium and WebKit; the contrast sweep; one command at freeze |
| `m3h-02`   | runtime size per module, published with the ledger (information, criterion 11)                                                                                    |
| `docs-m3d` | README and CHANGELOG for area m3d, replacing the (pending) lines from the modules' TSDoc                                                                          |
| `docs-m3e` | README and CHANGELOG for area m3e                                                                                                                                 |
| `docs-m3f` | README and CHANGELOG for area m3f                                                                                                                                 |
| `docs-m3g` | README and CHANGELOG for area m3g                                                                                                                                 |
| `docs-m4`  | README and CHANGELOG for area m4                                                                                                                                  |
| `docs-pci` | README and CHANGELOG for area pci                                                                                                                                 |
| `docs-ei`  | README and CHANGELOG for area ei                                                                                                                                  |
| `docs-m5`  | README and CHANGELOG for area m5                                                                                                                                  |
