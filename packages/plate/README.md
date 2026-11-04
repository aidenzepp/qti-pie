# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate reads a QTI 3.0 item and emits plain HTML in Node. The first milestone emits no script: a
candidate answers through a plain HTML form, and plate scores what the form sends back.

The public surface is `src/index.ts`, published through the `exports` map in `package.json`. plate
reads QTI XML through `@qti-pie/crust` and never depends on `pantry`.

Give each item on a page its own instance token, `render`'s `instance` option, which scopes the
item's ids and form entry names and which `render` returns as `instance` beside `html`, for
`renderStatus`, `entryName`, `decode` and `partition`. Omit it to draw a UUID, or pass your own,
such as React's `useId()`: ASCII letters, digits, `_`, `.`, `:` and `-`, not ending in `-` and
holding no `--`. Each token is checked on its own, so two tokens where one extends the other with
`-` or `.`, such as `a` and `a-R`, or `a` and `a.b`, can give colliding ids or colliding entry
names: instance `a` with response `b.c` and instance `a.b` with response `c` both post `a.b.c`.
Drawn UUIDs and React's `useId()` never collide.

## Checks

From the repository root:

| Command | Runs |
|---|---|
| `pnpm --filter @qti-pie/plate run test` | This package's tests |
| `pnpm check` | Formatting, lint and the typecheck over the repository |
