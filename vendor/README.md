# Vendored grizzle

The two [grizzle](https://github.com/bjornpagen/grizzle) tarballs `@qti-pie/pantry` depends on.

grizzle is not on npm yet. These tarballs come from `pnpm pack` on a local clone of the repository, built from trunk
commit `ee3b5fca4b5b72bb042c6ce56d31d5ed4c70759b`, so the package installs as the npm release will.

grizzle is Bjorn Pagen's, under the 0BSD licence in its repository (`LICENSE`: "Permission to use, copy, modify,
and/or distribute this software for any purpose with or without fee is hereby granted"). The tarballs are
redistributed here under it, with the author's agreement. The rest of this repository is MIT (`LICENSE` at the root).

| Tarball                                      | Package                      | Source                       |
| -------------------------------------------- | ---------------------------- | ---------------------------- |
| `bjornpagen-grizzle-1.0.0-beta.0.tgz`        | `@bjornpagen/grizzle`        | `packages/grizzle` at `ee3b5fc` |
| `bjornpagen-grizzle-engine-1.0.0-beta.0.tgz` | `@bjornpagen/grizzle-engine` | `packages/engine` at `ee3b5fc`  |

`packages/pantry` depends on the grizzle tarball by path. The grizzle tarball depends on the engine by version, and
`pnpm-workspace.yaml` overrides that version to the engine tarball.

## Refresh

In the grizzle clone, check out the commit, then pack both packages into this directory:

```bash
git checkout --detach <commit>
pnpm install --frozen-lockfile
(cd packages/engine && pnpm pack --pack-destination <this-repo>/vendor)
(cd packages/grizzle && pnpm pack --pack-destination <this-repo>/vendor)
```

Then run `pnpm install --force` in this repository and update the commit above.

## When grizzle is published

Replace the `file:` dependency in `packages/pantry/package.json` with the published version, remove the engine
override from `pnpm-workspace.yaml`, and delete this directory.
