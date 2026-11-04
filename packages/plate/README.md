# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate is parts plus pure functions, with no built-in form, submit control or submission flow.
`open` reads and validates a QTI 3.0 item, `render` emits its parts as native controls in HTML that
work inside a native form, React Hook Form, TanStack Form, or none, and `score` scores what comes
back with a pure function. The form, its submit control, the flow and the attempt limit are the
host's.

The public surface is `src/index.ts`, published through the `exports` map in `package.json`. It
exports these names and no others:

- The functions: `open`, `redact`, `render`, `renderStatus`, `score`, `checkResponses` and
  `configure`.
- The form helpers: `encode`, `decode`, `entryName`, `partition`, `checkInstance` and `isPosted`.
- The redacted item's JSON codec: `encodeRedacted` and `decodeRedacted`.
- The part constructor `h`.
- The errors: `InvalidConfiguration`, `InvalidInstance`, `InvalidRecord`, `InvalidRedacted`,
  `InvalidResponses`, `Malformed`, `OutcomeMismatchError`, `PartSwapRefused`, `RecordMismatch`,
  `ResponsesRefused`, `UnknownIdentifierError`, `UnknownPart` and `UnmappedResponseError`.
- The types: `Accepted`, `Attributes`, `Binding`, `Configuration`, `DecodeOptions`, `Element`,
  `EngineFailure`, `Entry`, `InstanceRequirement`, `Node`, `Options`, `PartFunction`,
  `PartOverrides`, `Partition`, `PostedBaseType`, `Redacted`, `RedactedJson`, `Rendered`,
  `StatusInput`, `StoredRecord`, `Text`, `ValidationMessage`, `Value` and `Verdict`.

plate reads QTI XML through `@qti-pie/crust` and never depends on `pantry`.

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
A host that sends the redacted item itself to a browser sends `encodeRedacted`'s JSON form and
reads it there with `decodeRedacted`.

- `open` runs in Node today: the shared reader `@qti-pie/crust` decodes through Node's `Buffer`, so
  `open` throws in a browser.
- Compute `redact` for each render, never once per document, because a later render state can
  change what the page may know.
- `decodeRedacted` checks the JSON's shape, not its content, so a host trusts redacted JSON only as
  far as the item it came from; the emitter's second line of defence still filters elements,
  attributes and URLs.
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
opens one with `open`, and wraps `render`'s HTML in its own native form. That form is the
playground's own composition, the way an author would compose one, not library behaviour. It
listens on `127.0.0.1` only; `PLATE_DEV_PORT` picks another port and `PLATE_CORPUS_DIR` another
corpus root.

To try a theme, paste a shadcn theme's `:root` and `.dark` blocks into the theme box, tick Dark for
the `.dark` block, apply, and the page re-renders in that theme.

## Styling

[`src/styles.css`](src/styles.css) is plate's default theme for hosts that are not React. It is not
the shadcn look, but it reads shadcn's token names, so a host's shadcn theme carries over. It reads
thirteen tokens and no others: `--primary`, `--primary-foreground`, `--accent`,
`--accent-foreground`, `--muted`, `--muted-foreground`, `--card`, `--card-foreground`,
`--destructive`, `--border`, `--input`, `--ring` and `--radius`, as shadcn's
[theming page](https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx)
names them.

- Nothing is defined at `:root`: the host's theme supplies the tokens, and the sheet carries
  shadcn's neutral light values as fallbacks.
- Parts are found by their `data-slot` marker.
- Live state comes from the controls themselves (`:checked`, `:disabled`, `aria-invalid`), never
  from a mirrored attribute.
- The host owns the page's surface and font, and declares `color-scheme` in each theme block,
  `:root` and `.dark`.
- A host that skips the stylesheet gives the item Root (`[data-slot="item"]`)
  `contain: layout paint`, `overflow: auto` and a padding of at least the focus ring's width plus
  its offset, 3px.

## Checks

From the repository root:

| Command | Runs |
|---|---|
| `pnpm --filter @qti-pie/plate run test` | This package's tests |
| `pnpm check` | Formatting, lint and the typecheck over the repository |
