# Vendored grizzle

The three [grizzle](https://github.com/bjornpagen/grizzle) tarballs `@qti-pie/pantry` depends on.

grizzle is not on npm yet. These tarballs come from `pnpm pack` on an export of the repository at trunk commit
`48256f8d61484d18aea2023f2d6fb54d07d46abf`, so each package installs as the npm release will.

grizzle is Bjorn Pagen's. Its repository licenses it under 0BSD (`LICENSE`: "Permission to use, copy, modify,
and/or distribute this software for any purpose with or without fee is hereby granted"), and the tarballs are
redistributed here under that license, with the author's agreement. The rest of this repository is MIT (`LICENSE` at the root).

| Tarball                                      | Package                      | Source                          |
| -------------------------------------------- | ---------------------------- | ------------------------------- |
| `bjornpagen-grizzle-1.0.0-beta.0.tgz`        | `@bjornpagen/grizzle`        | `packages/grizzle` at `48256f8` |
| `bjornpagen-grizzle-engine-1.0.0-beta.0.tgz` | `@bjornpagen/grizzle-engine` | `packages/engine` at `48256f8`  |
| `grizzle-testing-0.0.0.tgz`                  | `@grizzle/testing`           | `packages/testing` at `48256f8` |

`packages/pantry` depends on the grizzle tarball by path, and on the testing tarball by path as a devDependency. The
grizzle tarball depends on the engine by version, and `pnpm-workspace.yaml` overrides that version to the engine
tarball.

`@grizzle/testing` is grizzle's choice-stream testing library, and the one pantry's tests use. It is private and has no
`version`, which `pnpm pack` requires, so the packed manifest carries `"version": "0.0.0"`, the version grizzle gives
its other private package, `@grizzle/devtools`; every other file is the commit's. It ships TypeScript source, and Vitest
transforms it. Its dependencies are grizzle's catalog versions at pack time. They match the workspace's, except
`oxlint`, which `pnpm-workspace.yaml` holds to the copy Vite+ pins, so the workspace keeps one.

## Refresh

Export the commit from the grizzle clone, without touching its working tree, and pack the three packages into this
directory:

```bash
mkdir -p ~/.cache/gr8des/grizzle-<commit>
git -C <grizzle clone> archive <commit> | tar -x -C ~/.cache/gr8des/grizzle-<commit>
cd ~/.cache/gr8des/grizzle-<commit>
pnpm install --frozen-lockfile --ignore-scripts
(cd packages/engine && pnpm pack --pack-destination <this-repo>/vendor)
(cd packages/grizzle && pnpm pack --pack-destination <this-repo>/vendor)
(cd packages/testing && npm pkg set version=0.0.0 && pnpm pack --pack-destination <this-repo>/vendor)
cd && rm -rf ~/.cache/gr8des/grizzle-<commit>
```

At `48256f8` this reproduces the three tarballs here byte for byte. Skip `npm pkg set` once
`packages/testing/package.json` has a version of its own. Then remove any tarball a new name replaces and point
`packages/pantry/package.json` and `pnpm-workspace.yaml` at the new names, run `pnpm install --force` in this
repository, check that `pnpm why <package> -r` still finds one version of `effect`, `vite`, `vitest`, `@effect/vitest`
and `oxlint`, and update the commit hash above.

## When grizzle is published

Replace each `file:` dependency in `packages/pantry/package.json` with the published version, and remove the engine and
testing overrides from `pnpm-workspace.yaml`. Delete this directory once none of the three is vendored.
