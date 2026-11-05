# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate is a library of parts and pure functions. `open` checks a QTI 3.0 item, `render` writes it as
HTML with native form controls, and `score` scores the responses that come back. It renders choice,
text entry and extended text interactions, and `open`'s verdict names each feature that plate does
not render. plate has no form, submit control, submission flow or attempt limit. The host page owns
those. plate reads XML through [crust](../crust/README.md), never depends on pantry, and is
pre-release.

## Install

plate is a private workspace package of [qti-pie](../../README.md). In a sibling package's
`package.json`:

```json
"dependencies": { "@qti-pie/plate": "workspace:*", "effect": "4.0.7" }
```

Then run `pnpm install` from the repository root.

## Start

On the server, open an item and render it:

```ts
import { readFile } from "node:fs/promises";
import { Effect, Result } from "effect";
import { configure, open, redact, render } from "@qti-pie/plate";

const verdict = await Effect.runPromise(open("item.xml", await readFile("item.xml")));
if (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") {
  const configuration = await Effect.runPromise(configure({}));
  const rendered = render(redact(verdict.accepted), configuration);
  if (Result.isSuccess(rendered)) console.log(rendered.success.html);
}
```

Put that HTML inside your own form. When the form posts back, `partition` and `decode` read its
entries and `score` scores them. The [playground](#playground) does the whole round trip.

## Functions

| Function | Does |
| --- | --- |
| `open` | Reads and checks an item's bytes, and returns a verdict |
| `configure` | Decodes the host's settings into a `Configuration` |
| `redact` | Copies an accepted item without its correct responses and response processing |
| `render` | Writes an item as HTML |
| `renderStatus` | Writes the Status part, which shows the result after a submit |
| `partition`, `decode` | Turn a posted form's entries into responses |
| `checkResponses` | Validates responses without scoring them |
| `score` | Scores responses and returns the record the host stores |

`open` and `configure` return Effects. Every other function is plain and returns its value, or a
`Result` when it can fail. `render`'s `parts` option swaps a part for the host's own markup, built
with `h`. A host that builds its own Status part reads the fields `StatusInput` documents.
[`src/index.ts`](src/index.ts) lists every export, and the TSDoc on each name is its reference.

## Server and browser

The server keeps what `open` accepted, correct responses included. The browser gets only the HTML
that `render` makes from `redact`'s copy, and the server scores the post. plate does not enforce
this split. A host that sends the accepted item to the browser sends what `redact` removes.

- `open` runs on Node, not in a browser.
- An accepted item is not JSON, so a stateless server opens the bytes again for each request. To
  send the redacted item itself, write it with `encodeRedacted` and read it with `decodeRedacted`.
- Each item on a page needs its own instance token, `render`'s `instance` option. `render` draws a
  UUID when you pass none. Two tokens where one extends the other after a `.` or `-`, such as `a`
  and `a.b`, can collide.
- A package's documents are live documents. Serve its assets from another origin or under the CSP
  `sandbox` directive, and refuse an asset path that leaves the package once it is percent-decoded.

## Styling

[`src/styles.css`](src/styles.css) is plate's default theme. The `exports` map does not list it, so
serve the file and link it from the page. It reads shadcn's token names, so a shadcn theme carries
over, and its opening comment lists them. The host's theme sets the tokens at `:root` and `.dark`.
The page's surface and font are the host's. A host that skips the sheet copies its
`[data-slot="item"]` rule, which keeps authored content inside the item.

## Playground

From the repository root:

```console
$ pnpm --filter @qti-pie/plate serve
```

Then open `http://localhost:5190`. The playground, [`src/dev/page.ts`](src/dev/page.ts), lists four
documents from
[1EdTech's QTI 3 examples](https://github.com/1EdTech/qti-examples/tree/0a92fbbb6d2e620a1f7fad19977be4c418246bc0),
renders the ones `open` accepts inside its own form, and scores what you submit. It listens on
`127.0.0.1` only. `PLATE_DEV_PORT` picks another port. `PLATE_CORPUS_DIR` names the directory that
holds the extracted examples, and when that directory is missing, the page shows where it looked and
the command that extracts them. To try a theme, paste a shadcn theme's `:root` and `.dark` blocks
into the theme box.

## Development

From the repository root:

```bash
pnpm check
pnpm --filter @qti-pie/plate test
```

Tests sit beside the code they test. [`docs/spec-readings.md`](../../docs/spec-readings.md) records
how the packages read the specifications. Agents start at [`AGENTS.md`](../../AGENTS.md).

## License

MIT
