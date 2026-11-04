# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate is parts and pure functions. `open` reads and validates a QTI 3.0 item, `render` emits its
native controls as HTML that works inside any native form, and `score` scores what the form sends
back with a pure function. The form, its Submit, the flow and the attempt limit are the host's.

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

## Secure composition

Start from `redact`: the server keeps the full item `open` accepted, with its correct responses,
mappings and processing; the browser gets only the HTML `render` makes from `redact`'s item; and
the server scores the post with `score`. plate does not enforce this split, so a host that sends
the item itself to the browser sends what redaction removed.

- `open` runs in Node today: the shared reader `@qti-pie/crust` decodes through Node's `Buffer`, so
  `open` throws in a browser.
- Compute `redact` for each render, never once per document, because a later render state can
  change what the page may know.
- Post the form's entries to the server and decode them there with `decode`.
- A serverless host re-runs `open(location, bytes)` for each request, because an `Accepted` holds
  Maps, bigints and `Option`s and is not JSON.
- A native `form` around the parts submits with script off.
- Form names are unique per page: give each item on the page its own instance token.
- After a submit, put `renderStatus`'s part first with `autofocus`, or pass the messages to
  `render`, which puts `autofocus` on the first invalid Control, and keep any fragment out of the
  form's `action`, so the browser moves focus to it.
- Serve package assets from a separate origin or with the CSP `sandbox` directive, because package
  documents are live documents, and refuse a request path that resolves outside the package once
  it is percent-decoded.

## Dev playground

From the repository root:

```sh
pnpm --filter @qti-pie/plate serve
```

Then open `http://localhost:5190`. The playground, `src/dev/page.ts`, is an example host composed
from the parts: it lists BG007, BG010, BG011 and the CAT test from the 1EdTech example corpus,
opens one with `open`, and wraps `render`'s HTML in its own native form. It listens on `127.0.0.1`
only; `PLATE_DEV_PORT` picks another port and `PLATE_CORPUS_DIR` another corpus root.

## Checks

From the repository root:

| Command | Runs |
|---|---|
| `pnpm --filter @qti-pie/plate run test` | This package's tests |
| `pnpm check` | Formatting, lint and the typecheck over the repository |
