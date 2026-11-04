# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate reads a QTI 3.0 item and emits plain HTML in Node. The first milestone emits no script: a
candidate answers through a plain HTML form, and plate scores what the form sends back.

The public surface is `src/index.ts`, published through the `exports` map in `package.json`. plate
reads QTI XML through `@qti-pie/crust` and never depends on `pantry`.

## Checks

From the repository root:

| Command | Runs |
|---|---|
| `pnpm --filter @qti-pie/plate run test` | This package's tests |
| `pnpm check` | Formatting, lint and the typecheck over the repository |
