# Vendored grizzle

The three [grizzle](https://github.com/bjornpagen/grizzle) tarballs `@qti-pie/pantry` depends on.

grizzle is not on npm yet. These tarballs come from `pnpm pack` on an export of the repository at trunk commit
`b0e98c4563183c9145ea69a0360b936fbbc0cdb6`, so each package installs as the npm release will.

grizzle is Bjorn Pagen's. Its repository licenses it under 0BSD (`LICENSE`: "Permission to use, copy, modify,
and/or distribute this software for any purpose with or without fee is hereby granted"), and the tarballs are
redistributed here under that license, with the author's agreement. The rest of this repository is MIT (`LICENSE` at the root).

| Tarball                                      | Package                      | Source                          |
| -------------------------------------------- | ---------------------------- | ------------------------------- |
| `bjornpagen-grizzle-1.0.0-beta.0.tgz`        | `@bjornpagen/grizzle`        | `packages/grizzle` at `b0e98c4` |
| `bjornpagen-grizzle-engine-1.0.0-beta.0.tgz` | `@bjornpagen/grizzle-engine` | `packages/engine` at `b0e98c4`  |
| `grizzle-testing-0.0.0.tgz`                  | `@grizzle/testing`           | `packages/testing` at `b0e98c4` |

`packages/pantry` depends on the grizzle tarball by path, and on the testing tarball by path as a devDependency. The
grizzle tarball depends on the engine by version, and `pnpm-workspace.yaml` overrides that version to the engine
tarball.

`@grizzle/testing` is grizzle's choice-stream testing library, and the one pantry's tests use. It is private and has no
`version`, which `pnpm pack` requires, so the packed manifest carries `"version": "0.0.0"`, the version grizzle gives
its other private package, `@grizzle/devtools`; every other file is the commit's. It ships TypeScript source, and Vitest
transforms it. Its dependencies are grizzle's catalog versions at pack time, and they match the workspace's but one:
`typescript` 7.1.0-beta, whose native API (`typescript/sync`) its mutation tester typechecks with. The workspace's
`vite` override makes the tarball's `vite` Vite+'s core, which takes `typescript` as an optional peer, so the tarball's
copy would give Vite+'s core, and Vitest with it, a second instance beside the workspace's, and a test file would load
another Vitest than the one running it. So `pnpm-workspace.yaml` overrides `typescript` everywhere to the root's 7.0.2,
and the workspace holds one TypeScript. The grizzle tarball takes `pg` as a peer, which pnpm installs
(`autoInstallPeers`).

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

At `b0e98c4` this reproduces the three tarballs here byte for byte. Skip `npm pkg set` once
`packages/testing/package.json` has a version of its own. Then remove any tarball a new name replaces and point
`packages/pantry/package.json` and `pnpm-workspace.yaml` at the new names, run `pnpm install --fix-lockfile --force`
in this repository (at `64f0427`, where only the engine tarball changed, `--force` alone kept the engine's lockfile
integrity and its installed copy at the previous pin), check that `pnpm why <package> -r` still finds one version, and
one instance, of `effect`, `vite`, `vitest`, `@effect/vitest`, `oxlint` and `typescript`, and update the commit hash
above.

## Mutation runs

`@grizzle/testing` ships the mutation tester as the bin `grizzle-mutate`. It imports `typescript/ast`, `typescript/fs`
and `typescript/sync`, which TypeScript 7.0.2 exports only under `./unstable/`, so under the workspace's override it
stops at load with `ERR_PACKAGE_PATH_NOT_EXPORTED`, and nothing in this repository runs it. With a TypeScript that
exports them, from a package directory:

```bash
pnpm exec grizzle-mutate --package . --file <source> --test <test file> [--workers N] [--sample N] [--seed N]
```

Each `--file` is mutated and each `--test` is a Vitest filter. The tester writes nothing to the tree: it typechecks
each mutant in process against the package's `tsconfig.json` and runs the package's Vitest config in process. It
refuses to start unless the unmutated package typechecks with no error at all. `--list` prints the mutants and runs
nothing. The run is a measurement, never a gate: it reports killed, survived, timed out and invalid.

## When grizzle is published

Replace each `file:` dependency in `packages/pantry/package.json` with the published version, and remove the engine and
testing overrides from `pnpm-workspace.yaml`. Delete this directory once none of the three is vendored.
