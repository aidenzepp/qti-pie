# Vendored grizzle

grizzle is not on npm yet (`npm view @bjornpagen/grizzle` returns 404). These tarballs are what `pnpm pack` produced
from a local clone of [bjornpagen/grizzle](https://github.com/bjornpagen/grizzle), so the package installs as the npm
release will: built `dist/`, real dependency versions, the `grizzle` binary and the agent skill.

| Tarball                                      | Package                      | Source                                                           |
| -------------------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `bjornpagen-grizzle-1.0.0-beta.0.tgz`        | `@bjornpagen/grizzle`        | `packages/grizzle` at `a1d5af193cee117ab481f5897edd41101ff5d679` |
| `bjornpagen-grizzle-engine-1.0.0-beta.0.tgz` | `@bjornpagen/grizzle-engine` | `packages/engine` at the same commit                             |

`@qti-pie/pantry` depends on the grizzle tarball by path. The grizzle tarball depends on the engine by version, so
`pnpm-workspace.yaml` overrides that version to the engine tarball. Both list `effect` as a peer, so the workspace keeps
one copy of Effect.

## Refreshing

```sh
cd ~/.cache/gr8des/grizzle-trunk/build && git fetch && git checkout --detach <commit> && pnpm install --frozen-lockfile
(cd packages/engine && pnpm pack --pack-destination <worktree>/vendor)
(cd packages/grizzle && pnpm pack --pack-destination <worktree>/vendor)
cd <worktree> && pnpm install --force
```

Update the commit in the table above.

## When grizzle is published

Replace the `file:` dependency in `packages/pantry/package.json` with the published version, remove the engine override
from `pnpm-workspace.yaml`, and delete this directory. Imports do not change.
