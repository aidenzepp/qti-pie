# qti-pie

> *Easy as pie.*
>
> QTI isn't. qti-pie does the hard part: crust reads it, pantry keeps it, plate serves it.

| Package   | Folder             | Role                                                    |
| --------- | ------------------ | ------------------------------------------------------- |
| `crust`   | `packages/crust`   | Reads and writes QTI XML, bytes to a tree and back.     |
| `pantry`  | `packages/pantry`  | Stores QTI 3.0 in a strict PostgreSQL model (grizzle).  |
| `plate`   | `packages/plate`   | Renders QTI 3.0. Planned.                               |

Toolchain: Node 24 or later, pnpm workspace. `pnpm check` formats, lints and typechecks; `pnpm test` runs each
package's tests.

[AGENTS.md](AGENTS.md) holds the rules for working here.
