# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate is a library of parts and pure functions. `open` checks a QTI 3.0 document, `render` writes
an item as HTML with native form controls, and `score` scores the responses that come back.
`openPackage` checks a content package, and a test session takes a candidate through a test's
items. plate renders choice, inline choice, text entry and extended text interactions, and each
verdict names the features that plate does not render. plate has no form, submit control,
submission flow or store. The host page owns those. plate reads XML through
[crust](../crust/README.md), never depends on pantry, and is pre-release.

## Install

plate is a private workspace package of [qti-pie](../../README.md). In a sibling package's
`package.json`:

```json
"dependencies": { "@qti-pie/plate": "workspace:*", "effect": "4.1.2" }
```

Then run `pnpm install` from the repository root. The package has two entry points:

| Entry point | Gives | Stability |
| --- | --- | --- |
| `@qti-pie/plate` | Every function, type and error in [`src/index.ts`](src/index.ts) | Unstable until M3 |
| `@qti-pie/plate/styles.css` | The default theme, [`src/styles.css`](src/styles.css) | Unstable until M3 |

Until M3, plate's next milestone, any name or signature can change in any commit. The
[changelog](CHANGELOG.md) records each change a host can see.

## Start

On the server, open an item and render it:

```ts
import { readFile } from "node:fs/promises";
import { Effect, Option, Result } from "effect";
import { acceptedItem, configure, open, redact, render } from "@qti-pie/plate";

const verdict = await Effect.runPromise(open("item.xml", await readFile("item.xml")));
const accepted = acceptedItem(verdict);
if (Option.isSome(accepted)) {
  const configuration = await Effect.runPromise(configure({}));
  const rendered = render(redact(accepted.value), configuration);
  if (Result.isSuccess(rendered)) console.log(rendered.success.html);
}
```

Put that HTML inside your own form. When the form posts back, `partition` picks out the item's
entries, and `decode` reads each response that `postings` lists, in the base its interaction
declares. `score` scores the responses. The [playground](#playground) does the whole round trip.

A test arrives in a content package. Unzip the package into `files`, each file's bytes by its path
from the package's root. Then open it, start a session on one of its tests, and render the test's
first item:

```ts
import { Effect, Result } from "effect";
import {
  configure,
  encodeSession,
  itemView,
  openPackage,
  redact,
  render,
  startTest,
} from "@qti-pie/plate";

const verdict = await Effect.runPromise(openPackage("package", files));
if (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") {
  const configuration = await Effect.runPromise(configure({}));
  for (const { items, test } of verdict.accepted.tests.values()) {
    const sitting = Result.gen(function* start() {
      const instance = `s-${crypto.randomUUID()}`;
      const session = yield* startTest(test, items, configuration, { instance, now: new Date() });
      const shown = yield* itemView(test, session, configuration, 1);
      const item = yield* render(redact(items.get(shown.ref)!), shown.configuration, {
        instance: shown.instance,
        values: shown.values,
      });

      return { html: item.html, stored: yield* encodeSession(session) };
    });
    if (Result.isSuccess(sitting)) console.log(sitting.success.html);
  }
}
```

Store `stored`, and hand it to `decodeSession` on the next request. [Navigation](#navigation)
moves the session on.

## Functions

| Function | Does |
| --- | --- |
| `open` | Reads and checks a document's bytes, and returns a verdict |
| `acceptedItem` | Reads the accepted item out of a verdict |
| `configure` | Decodes the host's settings into a `Configuration` |
| `redact` | Copies an accepted item without its correct responses and response processing |
| `render` | Writes an item as HTML |
| `renderStatus` | Writes the Status part, which shows the result after a submit |
| `partition`, `postings`, `decode` | Turn a posted form's entries into responses |
| `checkResponses` | Validates responses without scoring them |
| `score` | Scores responses and returns the record the host stores |
| `restore` | Gives an item's values back from its stored record |
| `solution` | Gives an item's correct responses |
| `openPackage` | Reads and checks a content package's files, and returns a verdict on the package |
| `itemRefs` | Lists a test's item refs in document order |
| `startTest` | Starts a test session |
| `current`, `itemView` | Give what a session shows now, and what any of its items renders with |
| `permits` | Says whether an item of a session may be shown in review or solution |
| `navigationState`, `allowedIntents`, `advance` | Give the session's navigation, list the intents it takes now, and carry one out |
| `renderNavigation` | Writes the navigation parts as HTML |
| `intentName`, `encodeIntent`, `decodeIntent` | Name, write and read the form entry an intent posts under |
| `encodeSession`, `decodeSession` | Write a session as the record the host stores, and check one handed back |
| `results` | Writes a Results Reporting document for an item or a test session |

`open`, `openPackage` and `configure` return Effects. Every other function is plain and returns
its value, or a `Result` when it can fail. `render`'s `parts` option swaps a part for the host's
own markup, built with `h`, and its `mode` option shows an item in `review` or `solution`. A host
that builds its own Status part reads the fields `StatusInput` documents.
[`src/index.ts`](src/index.ts) lists every export, and the TSDoc on each name is its reference.

## Navigation

`navigationState`, `allowedIntents`, `advance` and the intent helpers `intentName`,
`encodeIntent` and `decodeIntent` are the navigation API. All six are pure functions.
`navigationState` gives the current test part's modes, the candidate's position, the state of
each item in the part and the intents the session takes now. `advance` carries out one intent, or
refuses it with `IntentRefused`. When the current item is open, `advance` refuses with
`StepResponseMisfit` a step that carries a response the item does not declare, or one that does
not match its declaration's base type and cardinality. When the current item is closed, `advance`
ignores the responses that come with the intent and still carries out the intent, so a host can
post a closed item's form as rendered. `current` and `itemView` mark a closed item as `disabled`.

`renderNavigation` writes plate's navigation parts from that data. Every button it writes is
`type="button"`, with no name, value, form attribute or other submit semantics, so a click does
what the host decides. A button is disabled when the session does not take its intent, and it
carries that intent in `data-intent`.

An intent posts under `intentName(instance)`, where `instance` is the session's. When that
instance is a bare UUID, `partition` calls the intent's entry foreign, so read the intent with
`decodeIntent` before you refuse foreign entries.

### A script-free native form post

Swap each button for your own submit button, named for the session and valued with its
`data-intent`:

```ts
import { Result } from "effect";
import { h, intentName, navigationState, renderNavigation } from "@qti-pie/plate";
import type { Attributes, Node } from "@qti-pie/plate";

const submitting = (props: Attributes, children: readonly Node[]) =>
  h(
    "button",
    { name: intentName(session.instance), type: "submit", value: props["data-intent"] ?? "" },
    children,
  );
const navigation = Result.flatMap(navigationState(test, session), (state) =>
  renderNavigation(state, configuration, {
    parts: {
      "test-navigation": {
        end: submitting,
        itemButton: submitting,
        next: submitting,
        previous: submitting,
        submit: submitting,
      },
    },
  }),
);
```

Put that HTML in the item's `<form method="post">`. The [plain server
action](#a-plain-server-action) reads the post.

### React Hook Form

React Hook Form does not register plate's controls, and its submit handler does not see which
button was pressed. So build the buttons from `navigationState`, give each one a handler that
carries its intent, and send the form's entries with that intent written in. `post` sends them to
your server, which hands them to the [plain server action](#a-plain-server-action), and `label`
gives your own words for an intent:

```tsx
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { encodeIntent, intentName } from "@qti-pie/plate";
import type { Intent, NavigationState } from "@qti-pie/plate";

type Props = {
  html: string;
  instance: string;
  post: (entries: FormData) => Promise<void>;
  state: NavigationState;
};

export function TestForm({ html, instance, post, state }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const { handleSubmit } = useForm();
  const send = (intent: Intent) =>
    handleSubmit(() => {
      const entries = new FormData(form.current!);
      entries.set(intentName(instance), encodeIntent(intent));
      return post(entries);
    });

  return (
    <form ref={form} autoComplete="off">
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {state.allowed.map((intent) => (
        <button key={encodeIntent(intent)} type="button" onClick={send(intent)}>
          {label(intent)}
        </button>
      ))}
    </form>
  );
}
```

### TanStack Form

The same component, with the intent passed as TanStack Form's submit meta. The form keeps its
`ref`, here `element`, and each button's `onClick` is `() => form.handleSubmit({ intent })`:

```tsx
import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { encodeIntent, intentName } from "@qti-pie/plate";
import type { Intent } from "@qti-pie/plate";

const element = useRef<HTMLFormElement>(null);
const form = useForm({
  onSubmitMeta: { intent: { kind: "next" } as Intent },
  onSubmit: ({ meta }) => {
    const entries = new FormData(element.current!);
    entries.set(intentName(instance), encodeIntent(meta.intent));
    return post(entries);
  },
});
```

### A plain server action

Every recipe ends in this function. Your POST route or server action calls it with the posted
entries, such as `[...formData]`, and the session it stored. The function decodes the current
item's responses through `postings`, carries out the posted intent, and returns the session to
store:

```ts
import { Result } from "effect";
import {
  advance,
  current,
  decode,
  decodeIntent,
  decodeSession,
  encodeSession,
  partition,
  postings,
  redact,
} from "@qti-pie/plate";
import type { Accepted, AcceptedTest, Configuration, Entry, Value } from "@qti-pie/plate";

export const step = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  stored: unknown,
  entries: readonly Entry[],
  configuration: Configuration,
) =>
  Result.gen(function* stepSession() {
    const session = yield* decodeSession(stored, test);
    const intent = yield* Result.fromOption(
      decodeIntent(entries, session.instance),
      () => "The post names no intent.",
    );
    const shown = yield* current(test, session, configuration);
    const responses: Record<string, Value> = {};
    if (shown.kind === "item") {
      const { own } = partition(entries, shown.instance);
      const item = redact(items.get(shown.ref)!);
      for (const { binding, identifier, options } of postings(item, shown.instance)) {
        responses[identifier] = yield* decode(own, binding, options);
      }
    }

    const now = new Date();
    const next = yield* advance(test, items, session, { intent, responses }, configuration, { now });

    return yield* encodeSession(next);
  });
```

## Records

The host stores two records as JSON and hands each back on the next request. plate writes both.
Each function that reads one back checks that it has version 2, that each field has its type, and
that each value is well formed. `restore` also checks that each response and outcome in an item's
record fits the item's declarations, as `results` does. `decodeSession` also checks that the
session names the test you pass it and that test's document. It does not check the session's items
against the test's item refs, so keep the stored session where only your server can change it.

| Record | Holds | Written by | Read by |
| --- | --- | --- | --- |
| `StoredRecord`, `version: 2` | One item's seed, template values, attempts, responses and outcomes, with the correct responses and defaults its template processing set | `score` | `score`, `restore`, `results` |
| `StoredTestSession`, `version: 2` | A test session, with its items' records and saved responses, its position and its parts | `encodeSession` | `decodeSession`, `results` |

plate reads only version 2, and refuses a record of another version with `InvalidRecord` or
`InvalidSession`. A change to either form is a changelog entry. The TSDoc on each type documents
its fields.

`restore(document, record)` gives an item's values back from its `StoredRecord`. In a test,
`itemView` gives them.

## Results

`results` writes a Results Reporting `assessmentResult` document as XML text, for one item's
`StoredRecord` or for a whole `StoredTestSession`. The document holds no correct response, but
`results` reads the accepted items, so call it on the server.

## Interactions

A host can rely on these, and [`src/interactions/`](src/interactions/) documents the rest:

- A shuffled Choice's or Inline Choice's order follows the configuration's `seed`, `render`'s
  `instance` and the response. Keep the `seed` stable across restarts, pass the `instance` you
  stored, and vary the `seed` per candidate when every candidate gets the same instance.
- An Inline Choice is a native `select`. Its first option, the author's `data-prompt` or else
  "Select an answer", posts an empty value, which `decode` reads as NULL.
- An `option` shows only text, so an Inline Choice renders only when its choices hold nothing but
  text and the inline elements that [`src/vocabulary.ts`](src/vocabulary.ts) lists, such as `em`
  and `code`. Any other Inline Choice shows a notice in its place, and the verdict names it.
- In `review` and `solution`, an Inline Choice's `select` is disabled, so the form posts nothing
  for it.
- `checkResponses` checks a `pattern-mask` only when `validateResponses` is on, and matches a number
  in its canonical form ([`src/interactions/pattern.ts`](src/interactions/pattern.ts)). `score`
  never checks it.
- An Extended Text with `format="xhtml"` is a plain `textarea`.
- A `multiple` or `ordered` Extended Text renders at most 100 `textarea`s, and shows a notice in
  their place when `min-strings` is above 100.
- A Text Entry or Extended Text bound to a `record` response shows a notice in its place, since
  plate does not take `record` answers yet.

## Scoring

`score` runs inline response processing and six built-in templates: `match_correct`,
`map_response`, `map_response_point`, `CC2_match`, `CC2_match_basic` and `CC2_map_response`.
`open`'s verdict names any other template, and any inline rule that plate does not run. No
interaction that plate renders collects a `point`, so `map_response_point` scores only a point
your own control supplies.

Inline processing runs every response rule. `qti-lookup-outcome-value` maps a value through a
match or interpolation table, `qti-exit-response` ends processing, and a
`qti-response-processing-fragment`'s rules run where the fragment stands. Of the 64 expressions
QTI 3.0 defines, plate runs 50. Later stages of M3 bring the other 14:

| Stage | Expressions | Lands with |
| --- | --- | --- |
| M3.b-2 | `qti-random`, `qti-random-integer`, `qti-random-float` | Template processing |
| M3.b-3 | `qti-duration-lt`, `qti-duration-gte` | Duration values |
| M3.b-3 | `qti-number-correct`, `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`, `qti-number-selected`, `qti-outcome-maximum`, `qti-outcome-minimum`, `qti-test-variables` | A test's outcome processing |
| M3.b-4 | `qti-field-value` | Record values |

Until M3.b-4 lands, the [ledger](#conformance-ledger) reports row I-9a (Response Processing: Full)
as `limited`. Only a test's outcome processing may hold the eight expressions of the third row, so
`open` refuses one in an item with `expression-placement`.

The verdict marks each of these, and `score` runs no processing that holds one:

- One of the other six expressions in the table
- An `xi:include`, which plate never fetches
- A `%` coordinate in a `qti-inside`, or in an area mapping that `qti-map-response-point` reads
- A `qti-pattern-match` pattern that plate cannot translate
- A `qti-lookup-outcome-value` that sets an outcome of cardinality `multiple` or `ordered`
- A variable that plate holds no value for, such as a `file` response, a template variable or the
  built-in `duration` of a time-dependent item

The item's outcomes then stay at their defaults. The verdict also marks `qti-custom-operator`, but
its processing runs, and the operator's value is NULL.

`open` refuses the following, each as pantry does:

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A `qti-response-if` or `qti-response-else-if` whose condition is not a single `boolean` | `expression-type` | P21 |
| An operand of a type its expression does not take | `expression-type` | P23 |
| A reference attribute, such as `qti-index`'s `n`, that names a variable other than a single template or outcome variable of the attribute's base type | `expression-type` | P24 |
| A reference attribute that names no declared variable | `undeclared-variable` | P8 |
| The built-in `duration`, read in an item that is not time dependent | `undeclared-variable` | `item-duration` |
| A `qti-lookup-outcome-value` that sets the built-in `completionStatus` | `undeclared-variable` | P9 |
| A literal `figures` below 1, or below 0 in `decimalPlaces` mode | `attribute-type` | P10 |
| A literal `n` of `qti-index` below 1 | `attribute-type` | P11 |
| A declaration named `completionStatus`, `numAttempts` or `duration`, the names of the built-in variables | `attribute-type` | `DeclarationNotReserved` |
| A `qti-equal` whose `tolerance` holds a token that is neither an `xs:double` nor a variable's name (an NCName), such as `1,5` | `attribute-type` | P6 |
| A `qti-equal` in `absolute` or `relative` mode that has no `tolerance` | `missing-attribute` | P36 |

The refusals with `expression-type` and `undeclared-variable` judge only inline response processing.
The refusal of a declaration named after a built-in variable judges a test's declarations as
well as an item's.

Integers are exact. `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an
integer result of more than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give
NULL for a container of more than 1,000,000 values. Values written in an item or stored in a
record are never bounded. These bounds limit size, not time. To score items you do not trust, call
`score` and `advance` under a time limit, for example in a worker that you can stop.

Where QTI makes an integer a float, an integer beyond the largest finite float becomes the largest
finite float of its sign, not an infinity ([reading 45](../../docs/spec-readings.md)). The math
functions, such as those of `qti-math-operator` and `qti-power`, run on plate's own port of FDLIBM
5.3, so they give the same result in Node, Chromium and WebKit.

Processing reads and sets the built-in `completionStatus`. It is `unknown` when the first
attempt's processing starts, and each later attempt starts from the value the last one left. An
item's `StoredRecord` holds it among the outcomes.

The verdict marks an adaptive item `adaptive="true"`, and its processing runs as a non-adaptive
item's. Each attempt starts from the declared defaults, so outcomes do not add up across attempts
until M5.

## Server and browser

The server keeps what `open` accepted, correct responses included. The browser gets only the HTML
that `render` makes from `redact`'s copy, and the server scores the post. plate does not enforce
this split. A host that sends the accepted item to the browser sends what `redact` removes.

- `open` and `openPackage` run on Node, not in a browser.
- An accepted item is not JSON, so a stateless server opens the bytes again for each request. To
  send the redacted item itself, write it with `encodeRedacted` and read it with `decodeRedacted`.
- A page that holds a `TestSession` holds every item's outcomes, scores included. A page that
  calls `solution`, `results` or `advance` holds the accepted items, correct responses included.
  Keep the session and those calls on the server.
- Each item on a page needs its own instance token, `render`'s `instance` option, so that every
  form entry name on the page is unique. `render` draws a UUID when you pass none. Two tokens where
  one extends the other after a `.` or `-`, such as `a` and `a.b`, can collide.
- A form that holds a Choice carries `autocomplete="off"`, and its pages send `Cache-Control: no-store`.
  HTML does not allow the attribute on a radio or a checkbox, and without both, the browser can
  show a choice that plate did not render.
- Render a restored item with the instance and the configuration you first rendered it with. Its
  record does not say which they were, and a shuffled Choice's or Inline Choice's order depends
  on both.
- An accepted package's `files` holds each file inside the package that the manifest lists, except
  the documents of its QTI resources, which can hold correct responses. A QTI resource's document
  is the file its `href` names, such as an item, a test or a response-processing document. For a
  QTI resource without an `href`, or with an absolute one, `files` leaves out every file the
  resource lists, because plate cannot tell which one is its document. A QTI document listed in
  any other way stays in `files`, because plate does not read a file to tell what it is. Serve
  only the files `files` holds, from another origin or under the CSP `sandbox` directive, since
  some are live documents. Refuse an asset path that leaves the package once it is
  percent-decoded.

## Hosts

A host composes these functions with its own page, form, routes and store.

To decode a post, call `postings(redacted, instance)` with the instance you rendered with. It
lists each response that an interaction binds, with the response's binding and the options
`decode` takes. With those options, `decode` reads a posted Text Entry in the base its binding
declares, not always in base 10. `postings` leaves out a response that no interaction binds. The
form never posts one, so the response keeps the value its record holds, such as its declared
default.

[`src/hosts/html.ts`](src/hosts/html.ts) is a plain-HTML host, written as a Fetch handler. It
serves one item inside its own `<form method="post" autocomplete="off">` and submit button, on a
page that links plate's sheet and sends `Cache-Control: no-store`. It scores a post with
`partition`, `postings`, `decode`, `checkResponses` and `score`, and uses only what
`@qti-pie/plate` exports.

In Astro, render on an on-demand page, import plate's stylesheet so that Astro links it, and put
the HTML in with `set:html`:

```astro
---
import "@qti-pie/plate/styles.css";
import { readFile } from "node:fs/promises";
import { Effect, Option, Result } from "effect";
import { acceptedItem, configure, open, redact, render } from "@qti-pie/plate";

export const prerender = false;

const verdict = await Effect.runPromise(open("item.xml", await readFile("item.xml")));
const configuration = await Effect.runPromise(configure({}));
const item = Option.getOrThrow(acceptedItem(verdict));
const { html } = Result.getOrThrow(render(redact(item), configuration, { instance: "q1" }));
Astro.response.headers.set("cache-control", "no-store");
---
<form method="POST" autocomplete="off">
  <Fragment set:html={html} />
  <button type="submit">Submit</button>
</form>
```

On a `POST`, read `await Astro.request.formData()` and score it as the plain-HTML host does.
[`hosts/astro/`](hosts/astro/src/pages/index.astro) renders and scores BG010 this way, and
`pnpm --filter @qti-pie/plate host:astro` serves it at `http://127.0.0.1:5192`. Serve a production
build, such as `@astrojs/node`'s standalone server: Astro's dev server adds a script to every page.

## Styling

[`src/styles.css`](src/styles.css) is plate's default theme. Resolve `@qti-pie/plate/styles.css`
through the `exports` map, serve the file, and link it from the page. It reads shadcn's token
names, so a shadcn theme carries over, and its opening comment lists them. The host's theme sets
the tokens at `:root` and `.dark`. The page's surface and font are the host's. A host that skips
the sheet copies its `[data-slot="item"]` rule, which keeps authored content inside the item.

## Playground

From the repository root:

```console
$ pnpm --filter @qti-pie/plate serve
```

Then open `http://localhost:5190`. The playground, [`src/dev/page.ts`](src/dev/page.ts), lists every
document in
[1EdTech's QTI 3 examples](https://github.com/1EdTech/qti-examples/tree/0a92fbbb6d2e620a1f7fad19977be4c418246bc0)
by its verdict, renders the items `open` accepts inside its own form, and scores what you submit. Its
Verdicts page shows every verdict, and its Ledger page shows the last [ledger](#conformance-ledger).
It listens on `127.0.0.1` only. `PLATE_DEV_PORT` picks another port. `PLATE_CORPUS_DIR` names the
directory that holds the extracted examples, and when that directory is missing, the page shows
where it looked and the command that extracts them. To try a theme, paste a shadcn theme's `:root`
and `.dark` blocks into the theme box.

Its Packages page lists each package in the examples, and the fixture package `fixtures/m2/`, with
its verdict. The page of an accepted package starts any of its tests. A test session shows one item
at a time, asks you to confirm before a part is submitted, and ends on a summary. The summary links
each item's review and solution where the item's session control allows them, and the results as a
Results Reporting XML file. The playground keeps sessions in memory until it stops, and its first
page lists each session in progress with a Resume link. `/hosts/html` serves BG007 through the
[plain-HTML host](#hosts).

## Conformance ledger

From the repository root:

```bash
pnpm --filter @qti-pie/plate ledger
```

The command runs plate's tests, opens every document in 1EdTech's examples, and writes the ledger
and the verdicts to `packages/plate/work/ledger/`, or to the folder `PLATE_LEDGER_DIR` names. It
needs every cache the tests read, among them the QTI 3.0 conformance text at
`~/.cache/gr8des/qti3-text/conf.txt`. Because it runs the tests with `PLATE_REQUIRE_CACHES=1`, a
missing cache makes it fail. The ledger says only that these tests pass over these fixtures, never
that plate is conformant or certified. The command exits with 1 when a test fails or
[`src/ledger/honesty.ts`](src/ledger/honesty.ts) finds a problem.

## Development

From the repository root:

```bash
pnpm check
pnpm --filter @qti-pie/plate test
```

Tests sit beside the code they test. A test that reads a cache under `~/.cache/gr8des` carries a tag
that names the cache, and `pnpm --filter @qti-pie/plate exec vp test --list-tags` lists each tag
with its path. When a cache is missing, the run prints where it belongs and how to fetch it, then
skips the tests that need it, or fails them when `PLATE_REQUIRE_CACHES=1` is set.
[`docs/spec-readings.md`](../../docs/spec-readings.md) records how the packages read the
specifications. Agents start at [`AGENTS.md`](../../AGENTS.md).

## License

MIT

[`src/engine/math.ts`](src/engine/math.ts) ports routines of FDLIBM 5.3, and [NOTICE](NOTICE)
holds Sun's notice for them.
