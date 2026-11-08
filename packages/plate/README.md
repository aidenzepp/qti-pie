# plate

> *You eat with your eyes first.*
>
> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.

Render QTI 3.0 items and tests for candidates, on the server and in the browser.

plate is a library of parts and pure functions. Only a value you leave out is random: `begin`,
`startTest` and `score` draw a seed, and `render` draws an instance token. `open` checks a QTI 3.0
document, `render` writes an item as HTML with native form controls, and `score` scores the
responses that come back. `openPackage` checks a content package, and a test session takes a
candidate through a test's items. plate renders choice, inline choice, text entry and extended
text interactions, and each verdict names the features that plate does not render. plate has no
form, submit control, submission flow or store. The host page owns those. plate reads XML through
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
  const rendered = render(redact(accepted.value, undefined, configuration), configuration);
  if (Result.isSuccess(rendered)) console.log(rendered.success.html);
}
```

Put that HTML inside your own form. When the form posts back, `partition` picks out the item's
entries, and `decode` reads each response that `postings` lists, in the base its interaction
declares. `score` scores the responses. The [playground](#playground) does the whole round trip.

An item whose template processing runs shows its template parts only from the record `begin`
starts. With no record, `redact` shows a notice in their place, and `score` refuses the post with
`RecordRequired`. [Template processing](#template-processing) shows that round trip.

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
      const redacted = redact(items.get(shown.ref)!, shown.record, shown.configuration);
      const item = yield* render(redacted, shown.configuration, {
        instance: shown.instance,
        values: shown.values,
      });

      return { html: item.html, stored: yield* encodeSession(session) };
    });
    if (Result.isSuccess(sitting)) console.log(sitting.success.html);
  }
}
```

Store `stored` where only your server reads it, and hand it to `decodeSession` on the next
request. [Navigation](#navigation) moves the session on.

## Functions

| Function | Does |
| --- | --- |
| `open` | Reads and checks a document's bytes, and returns a verdict |
| `acceptedItem` | Reads the accepted item out of a verdict |
| `configure` | Decodes the host's settings into a `Configuration` |
| `begin` | Starts an item's stored record, running its template processing |
| `redact` | Copies an accepted item without its correct responses, processing or template rules, with its template values from the record |
| `render` | Writes an item as HTML |
| `renderStatus` | Writes the Status part, which shows the result after a submit |
| `partition`, `postings`, `decode` | Turn a posted form's entries into responses |
| `checkResponses` | Validates responses without scoring them |
| `score` | Scores responses and returns the record the host stores |
| `restore` | Gives an item's record and values back from its stored record |
| `solution` | Gives an item's correct responses, from its record where template processing set them |
| `openPackage` | Reads and checks a content package's files, and returns a verdict on the package |
| `itemRefs` | Lists a test's item refs in document order |
| `startTest` | Starts a test session, and fails with `EngineFailure` when a template default of its first part does not fit its variable |
| `current`, `itemView` | Give what a session shows now, and what any of its items renders with |
| `permits` | Says whether an item of a session may be shown in review or solution |
| `navigationState`, `allowedIntents`, `advance` | Give the session's navigation, list the intents it takes now, and carry one out |
| `renderNavigation` | Writes the navigation parts as HTML |
| `intentName`, `encodeIntent`, `decodeIntent` | Name, write and read the form entry an intent posts under |
| `encodeSession`, `decodeSession` | Write a session as the record the host stores, and check one handed back |
| `results` | Writes a Results Reporting document for an item or a test session |

`open`, `openPackage` and `configure` return Effects. Every other function is plain and returns
its value, or a `Result` when it can fail. `redact`, `checkResponses` and `solution` take the
item's record as an optional last argument, and `redact` takes the output budget after it.
`render`'s `parts` option swaps a part for the host's
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
      const item = redact(items.get(shown.ref)!, shown.record, shown.configuration);
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
Each function that reads one back checks that it has version 4, that each field has its type, and
that each value is well formed. `restore` also checks that each response and outcome in an item's
record fits the item's declarations, as `results` does, and refuses another item's record with
`RecordMismatch`, as `score` does. For an item whose template processing runs, `score` and
`restore` also refuse, with `InvalidRecord`, a record that holds no value for one of its template
variables.

`decodeSession` refuses with `SessionMismatch` a session that names another test or test document.
It refuses with `InvalidSession` a session that does not fit the test you pass it:

- its items are not the test's item refs in document order, numbered from 1
- its parts are not the test's parts in order, ended, then at most one current, then pending, with
  none current after the test closes
- an item's record does not carry the session's instance and the item's number
- its dates are not UTC instants, or it was updated before it started
- its position names none of its items
- in a nonlinear part that has started, an item's template defaults are not keyed by exactly the
  template variables its item ref's `qti-template-default`s set
- its outcomes are not the test's declared outcomes, each of its declared base type and cardinality

`decodeSession` does not check the values of an item's template defaults, since the test does not
hold the items. `advance` checks them when it shows the item, and fails with `EngineFailure` when
one does not fit. Keep the stored session where only your server can change it.

| Record | Holds | Written by | Read by |
| --- | --- | --- | --- |
| `StoredRecord`, `version: 4` | One item's seed, template values, attempts, responses and outcomes, with the correct responses and defaults its template processing set | `begin`, `score` | `score`, `restore`, `results` |
| `StoredTestSession`, `version: 4` | A test session, with its processing seed and its shuffle seed, its items' records, saved responses and template defaults, its position and its parts, and the test's outcomes with the count of its outcome processing runs | `encodeSession` | `decodeSession`, `results` |

plate reads only version 4, and refuses a record of another version with `InvalidRecord` or
`InvalidSession`. A change to either form is a changelog entry. The TSDoc on each type documents
its fields.

Both records are server data. An item's record holds the seed that keys every value its
processing draws, and its template values and correct responses can give the answers away. Keep
both where only your server reads them, never in a hidden field, a cookie or the browser's
storage. `ItemView`, the item that `current` gives, and `restore`'s `Restored` each carry the
record, so they are server data too.

`restore(document, record)` gives an item's decoded record and its values back from its
`StoredRecord`. In a test, `itemView` gives them. plate exports no `ItemRecord` type: the record's
type is `Restored["record"]`, and the narrower type that `redact`, `checkResponses` and `solution`
each take is `Parameters<typeof redact>[1]`, `Parameters<typeof checkResponses>[3]` and
`Parameters<typeof solution>[1]`.

## Results

`results` writes a Results Reporting `assessmentResult` document as XML text, for one item's
`StoredRecord` or for a whole `StoredTestSession`. The document holds no correct response, but
`results` reads the accepted items, so call it on the server. For a test session it writes the
test's own outcomes as [Outcome processing](#outcome-processing) says.

## Interactions

A host can rely on these, and [`src/interactions/`](src/interactions/) documents the rest:

- A shuffled Choice's or Inline Choice's order follows the configuration's `seed`, `render`'s
  `instance` and the response. The `seed` is a string. `render` draws none and keys an absent
  `seed` as `""`, so the order then follows the instance alone. Keep the `seed` stable across
  restarts, pass the `instance` you stored, and vary the `seed` per candidate when every candidate
  gets the same instance.
- A test session keeps two seeds. Its shuffles follow the configuration's `seed` it started with,
  or the instance alone when that configuration had none, so render a session's item with the
  configuration `itemView` gives, whatever `seed` you pass later. Its processing follows a seed of
  its own: the `seed` in `startTest`'s context, or 128 random bits `startTest` draws when you pass
  none. `begin` and `score` draw a record's seed the same way, and that seed keys the item's
  processing, never its shuffle.
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

`score` judges a post as the page its record showed. It refuses a choice that the record's
template values hide, with `ResponsesRefused`, and keeps the record's value for a response that
only hidden template content binds, whatever the post holds. A response that both an interaction
inside hidden template content and a notice on shown content bind counts as hidden, so its posted
value is dropped too. A response that no interaction on the page binds, because the item never
asks for it or shows a notice in its place, is scored as the host posts it. Do not trust a posted
value for such a response: validate it, or draw its interaction yourself.

Inline processing runs every response rule. `qti-lookup-outcome-value` maps a value through a
match or interpolation table, `qti-exit-response` ends processing, and a
`qti-response-processing-fragment`'s rules run where the fragment stands. Of the 64 expressions
QTI 3.0 defines, plate runs 64. `qti-field-value` reads one field of a record response, and
`qti-is-null` and `qti-match` read a record whole. Eight of the 64 belong to a test's outcome
processing, as [Outcome processing](#outcome-processing) says, so `open` refuses one in an item
with `expression-placement`.

A value that two or more entries of a `qti-mapping` match maps by the first entry listed, as a
point that two areas of a `qti-area-mapping` hold maps by the first area listed.

The verdict marks each of these, and `score` runs no processing that holds one:

- An `xi:include`, which plate never fetches
- A `%` coordinate in a `qti-inside`, or in an area mapping that `qti-map-response-point` reads
- A `qti-pattern-match` pattern that plate cannot translate
- A `qti-lookup-outcome-value` that sets an outcome of cardinality `multiple` or `ordered`
- A variable that plate holds no value for, such as a `file` response, the built-in `duration` of
  a time-dependent item, or a template variable of template processing that does not run

The item's outcomes then stay at their defaults. The verdict also marks `qti-custom-operator`, but
its processing runs, and the operator's value is NULL.

`open` refuses the following, each as pantry does:

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A `qti-response-if`, `qti-response-else-if`, `qti-template-if`, `qti-template-else-if` or `qti-template-constraint` whose condition is not a single `boolean` | `expression-type` | P21 |
| An operand of a type its expression does not take | `expression-type` | P23 |
| A reference attribute, such as `qti-index`'s `n`, that names a variable other than a single template or outcome variable of the attribute's base type | `expression-type` | P24 |
| A reference attribute that names no declared variable | `undeclared-variable` | P8 |
| The built-in `duration`, read in an item that is not time dependent | `undeclared-variable` | `item-duration` |
| A `qti-lookup-outcome-value` that sets the built-in `completionStatus` | `undeclared-variable` | P9 |
| A `qti-variable` with a `weight-identifier`, which only a test's outcome processing may hold | `expression-placement` | P12 |
| A literal `figures` below 1, or below 0 in `decimalPlaces` mode | `attribute-type` | P10 |
| A literal `n` of `qti-index` below 1 | `attribute-type` | P11 |
| A declaration named `completionStatus`, `numAttempts` or `duration`, the names of the built-in variables | `attribute-type` | `DeclarationNotReserved` |
| An item's outcome declaration named `SCORE` or `MAXSCORE` whose base type is not `float`, or an item's or a test's named `PASSED` whose base type is not `boolean`. A `record` one is accepted *(pending)* | `attribute-type` | `ReservedOutcomeTypes` |
| A `qti-equal` whose `tolerance` holds a token that is neither an `xs:double` nor a variable's name (an NCName), such as `1,5` | `attribute-type` | P6 |
| A `qti-equal` in `absolute` or `relative` mode that has no `tolerance` | `missing-attribute` | P36 |
| A `qti-mapping` in a response declaration of base type `file` or `duration`, or of cardinality `record`, or a `qti-area-mapping` in one whose base type is not `point` | `misplaced-element` | `mapping-base-type`, `area-mapping-point` |

The refusals with `expression-type` and `undeclared-variable` judge inline response processing and
template processing. [Template processing](#template-processing) lists the refusals that only
template processing meets. The refusals of a declaration named after a built-in variable, and of
a mistyped `PASSED`, judge a test's declarations as well as an item's. A test's `SCORE` and
`MAXSCORE` may have any base type, since QTI 3.0 types only an item's. pantry refuses them in a
test too, so there plate accepts what pantry refuses until pantry follows.

Integers are exact. `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an
integer result of more than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give
NULL for a container of more than 1,000,000 values. Values written in an item or stored in a
record are never bounded. These bounds limit size, not time.

A duration is a number of seconds, held as a double and written as a float is, such as `90.5`, `INF`
or `-2`, in `qti-value`, `qti-base-value` and a stored record. `open` refuses an ISO 8601 duration
such as `PT1M30.5S` with `value-type`. `qti-match` must not compare durations, and a duration is not
numerical *(pending)*, so `open` refuses one as an operand of `qti-match`, of arithmetic or of an
order comparison such as `qti-lt`, with `expression-type`. `qti-duration-lt` and `qti-duration-gte`
compare two durations' seconds exactly, so 89.95 is shorter than 90. NaN is neither shorter nor as
long as anything, and `INF` and `-INF` compare as infinities *(pending)*. `results` writes a
duration as its seconds, and a printed variable prints one as it prints a float *(pending)*.

To score items you do not trust, call `begin`, `score` and `advance` under a time limit, for
example in a worker that you can stop. `render` writes at most the configuration's `outputBudget`
characters of HTML, counted as a string's `length` counts them. `outputBudget` is 16,777,216 by
default, and you can set it from 1 to 536,870,888. Past it, `render` returns `OutputTooLarge`,
which names the budget and the item, and writes nothing, so a page never shows an item with a part
left out. `redact` takes the same budget as its last argument, as `{ outputBudget }` or the
configuration itself. It stops printing once the item's printed variables pass the budget, and
`render` then returns `OutputTooLarge`, which names the printed variable. Pass the same
configuration to both. `OutputTooLarge`'s `printed` and the redacted item's `unprinted` name the
limit passed in `limit`: `"text"` for the 1,000,000 characters one printed text may hold, or
`"budget"` for the output budget. `redact` holds a budget outside 1 to 536,870,888 to that range,
and reads `NaN` as the default.

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

## Template processing

An item's template processing runs once, when its record starts. It gives each template variable a
value, and it can set a response's correct response and a response's or an outcome's default.
Response processing reads those values. The page shows them through printed variables, template
blocks and inlines, choices that a template variable shows or hides, and `param`s that name a
template variable.

`begin(document, { instance, seed })` starts the record. Store it where only your server reads it,
render the first page from what `restore` gives back, and pass the stored record to `score` with
each post:

```ts
import { Result } from "effect";
import { begin, redact, render, restore } from "@qti-pie/plate";

const first = Result.gen(function* firstPage() {
  const stored = yield* begin(accepted, { instance: "q1" });
  const { record, values } = yield* restore(accepted, stored);
  const redacted = redact(accepted, record, configuration);
  const { html } = yield* render(redacted, configuration, { instance: "q1", values });

  return { html, stored };
});
```

`score(accepted, responses, stored)` then scores the post and returns the record to store in its
place. A test session starts each item's record when it first shows the item, and `itemView` and
`current` give it as `record`. Pass that record to `redact`, `checkResponses` and `solution`.

In a test, an item ref's `qti-template-default` gives a template variable the value its template
processing starts from, in place of its declared default, and again each time a
`qti-template-constraint` starts that processing over. A linear part evaluates an item's defaults
when it first shows the item. A nonlinear part evaluates the defaults of all its items when it
starts, and the session keeps them until it first shows each item. Either way, a default reads the
test's outcomes as the session holds them then, may read an item's variable by a dotted name
*(pending)*, and draws from the session's processing seed.

`startTest` fails with `EngineFailure` when a default of its first part names no template variable
of its item or gives a value of another base type or cardinality. `advance` fails with it when it
shows a later item or starts a later part. `openPackage` refuses such a default, so only a test and
items you `open` one at a time reach that failure. A default that reads a variable plate holds no
value for in a test, one that [Outcome processing](#outcome-processing) names, is marked and not
applied, so its variable starts at its declared default *(pending)*. A default that reads the test's
own `duration` reads NULL *(pending)*.

The seed is a string, and it is the record's secret: it keys every value that template and
response processing draw. A seed someone can guess, such as `"7"` or `""`, lets anyone who sees
the page and the item work those values out. When you pass no seed, `begin` draws 128 random bits,
as `startTest` does for a session's processing seed when its context gives none, and `score` does
for a record it starts itself. `begin` uses a given `""` as the seed, and `score` uses the seed of
the record it is handed. `configure` reads a `seed` of `""` as no seed, so a `startTest` session's
shuffles then follow the instance alone. The same document, instance and seed give the same record
every run. To fix the seed for `score`, start the record with `begin`.

With no record, plate fills in no value that template processing sets. For an item whose template
processing runs:

| Function | With no record |
| --- | --- |
| `score` | Fails with `RecordRequired` |
| `redact` | Shows a notice in place of each printed variable, template block, template inline and `param` that needs a template value, and leaves out each choice that a template variable shows or hides. The redacted item's `notices` names `template-identifier` once for those choices |
| `checkResponses` | Treats those choices, and the interactions inside those blocks, as absent |
| `solution` | Gives NULL for each response that a `qti-set-correct-response` sets |

Any other item reads, with no record, as the record its first attempt starts with: each template
variable at its declared default and each outcome at its starting value.

With a record, `redact` prints each printed variable from it. A template block, a template inline
or a choice shows when its template variable matches or contains its `template-identifier`, or the
reverse under `show-hide="hide"`. A `param` whose `value` names a `param-variable` template
variable passes that variable's value. A part whose variable the record holds no value for shows
its notice, as with no record.

`qti-random`, `qti-random-integer` and `qti-random-float` draw from an HMAC-SHA-256 stream keyed by
the seed. A shuffle draws from FNV-1a and SplitMix32 instead, since its order is on the page. A
`qti-repeat` whose operands draw evaluates them once per pass, so each pass draws anew. It gives
NULL for more than 1,000,000 repeats, and NULL as soon as a pass gives no value. The passes of
nested repeats multiply, so plate states no maximum time: call `begin` under a time limit too, as
[Scoring](#scoring) says for `score`.

Where QTI 3.0 leaves a choice open, plate makes one. A choice marked *(pending)* awaits approval
and can change.

- A `qti-template-constraint` that is false or NULL starts template processing again from the
  declared values, at most 100 times in one run. After that, the declared values stand and
  processing goes on after the constraint.
- `qti-random-integer` gives NULL when `max` is below `min` or `step` is 0 or below, and when `min`
  or `max` has more than 1,000,000 bits *(pending)*. `qti-random-float` gives NULL for a NaN or
  infinite bound, or when `max` is below `min` *(pending)*. `qti-random` of NULL is NULL.
- A printed variable with a `format` prints as its one printf conversion writes the value. A tie
  rounds half away from zero on the shortest decimal that reads back, so 0.25 at `%.1f` prints
  `0.3`, where C's `printf` prints `0.2`.
- Under `%i`, `%o`, `%x` or `%X`, a float prints its shortest decimal's integer digits
  *(pending)*, a negative under `%o`, `%x` or `%X` writes `-` and its digits *(pending)*, and an
  infinity or NaN prints `inf`, `-inf` or `nan`, in upper case under `%X` *(pending)*. A `base`
  outside 2 to 36 writes base 10 *(pending)*.
- A width or precision past 1,000,000 makes `render` fail with `OutputTooLarge`, which names the
  printed variable and the bound, rather than leave its place blank. So does a value whose whole
  printed text, delimiters included, would pass 1,000,000 characters, and a `param-variable` value
  whose text would, named by its template variable. A hidden template block is not printed, so
  what it holds never fails a render. Scoring is unaffected.
- With no `format`, it prints an integer as its digits, a float as its shortest decimal and
  negative zero as `-0`. `power-form` writes such a float's exponent as `x 10 to the power n`
  *(pending)*.
- NULL prints nothing, and a container prints its values joined by `delimiter`. `index` picks one
  member of an ordered value, counting from 1, and prints them all when it is out of range
  *(pending)*.
- QTI 3.0 sets no written form for a `param`'s list or NULL value, so a `param-variable` follows
  the printed-value defaults: a container passes its values joined by `;`, and NULL passes an empty
  value.

`open` refuses the following. pantry refuses the same, except in the three places named below the
table.

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A `qti-set-template-value`, `qti-set-correct-response` or `qti-set-default-value` whose expression is not of its variable's base type and cardinality | `expression-type` | P20 |
| A read in template processing of a response, an outcome or a built-in other than `QTI_CONTEXT`, through `qti-variable`, `qti-correct`, `qti-default`, `qti-map-response`, `qti-map-response-point` or a reference attribute. Template processing reads only template and context variables | `expression-type` | P26 |
| A `qti-set-template-value` that names no template variable, a `qti-set-correct-response` that names no response, or a `qti-set-default-value` that names neither a response nor an outcome | `undeclared-variable` | P8, or P9 for a built-in |
| A printed variable's `format` that is not one printf conversion with a code from `E e f G g r R i o X x`, such as `%d`, `%u` or `Score: %.1f` | `attribute-type` | R38 |
| A printed variable whose `identifier` names no outcome or template variable, or whose `base` or `index`, written as a name, names no single integer outcome or template variable; in a test, whose `identifier` names no outcome the test declares, or whose `base` or `index` names no single integer outcome the test declares | `undeclared-variable` for a name nothing declares, else `expression-type` | `printed-variable-ref` |
| A `template-identifier`, on a template block or inline or on a choice, that names no template variable of base type `identifier` and cardinality `single` or `multiple` | `undeclared-variable` for a name nothing declares, else `expression-type` | `template-ref` |

plate and pantry differ in three places until pantry follows. plate accepts a `format` whose
precision has no digits, such as `%.f`, and a printed variable that names the built-in
`completionStatus`. It refuses a wrong `template-identifier` on a `qti-simple-choice`, which pantry
does not check.

The verdict marks a template declaration of base type `file`, of cardinality `record`, or with no
base type, as it marks such a response or outcome declaration. It also marks template processing
that reads `QTI_CONTEXT` or a context variable, or that reads or sets a variable plate does not
model. Template processing that holds a feature the verdict marks does not run, and its template
variables hold no value.

## Outcome processing

A test's outcome processing sets the test's own outcomes from what its items' records hold. A test
session runs it after the items' response processing, each time from the declared defaults:

- after `advance` submits an item of an individual part
- once after `advance` submits a simultaneous part, over every item of the part
- once more when the test closes

`TestSession.outcomes` holds what the last run left, and the stored session keeps it. A run reads
the test's built-in `duration` as the seconds from the session's start to the `now` of the step
that runs it. It draws from the session's processing seed, so the same seed and the same steps give
the same outcomes. `results` writes the test's outcomes as the session holds them. A test with no
outcome processing writes its outcomes' defaults. A test whose outcome processing the verdict marks
writes none of its own, since nothing ran, so no default reads as a score.

Outcome processing runs every outcome rule, and the eight expressions only a test may hold:
`qti-number-correct`, `qti-number-incorrect`, `qti-number-presented`, `qti-number-responded`,
`qti-number-selected`, `qti-outcome-minimum`, `qti-outcome-maximum` and `qti-test-variables`. A
dotted name such as `ITEM1.SCORE` reads the variable `SCORE` of the item that the item ref `ITEM1`
names ([reading 48](../../docs/spec-readings.md)). An item ref's `qti-variable-mapping` applies to
every read by name, dotted or through one of the eight expressions, so a mapped name reads the
item's source outcome. A `qti-variable` whose `weight-identifier` names a `qti-weight` of its item
ref reads an integer or a float as a float times the weight.

The verdict marks a test's outcome processing, and the session does not run it, when it holds an
expression plate does not run or an `xi:include`. It does the same when the processing reads or
sets a variable plate holds no value for in a test *(pending)*: the test's own `numAttempts`,
`completionStatus`, `QTI_CONTEXT` or a context variable, the `duration` of a part, a section or an
item ref, such as `ITEM1.duration` or the occurrence form `ITEM1.1.duration`, or a
`qti-test-variables` of `duration`. In a test that holds a `qti-assessment-section-ref`, it also
marks a dotted name that does not start with a part, section or item ref of the test document
itself, such as `I1.SCORE` where `I1` is an item ref in a section document. It also marks such a
test's outcome processing when the processing holds one of the eight expressions above, because they
would look up only the test document's own items: a session delivers none of a section document's
items. `openPackage` also marks a test's outcome processing, and leaves out a template default,
that reads an item's context variable through its item ref, such as `ITEM1.CTX` where the item
declares `CTX` in a `qti-context-declaration`: the item marks that declaration, and plate holds no
value of it. A test checked apart from its items cannot see this, so there its processing runs and
fails at that read with `UnknownIdentifierError`. `open` accepts these, as pantry does.

Where QTI 3.0 leaves a choice open, plate makes one. A choice marked *(pending)* awaits approval
and can change.

- `qti-exit-test` ends only the current run, and the next run starts the rules again.
- A weight that the item ref does not define is 1.0. A weighted read of a base type other than
  integer or float, or of a name with no item ref, reads unweighted *(pending)*.
- A weighted `qti-variable` that reads an item's `integer` or `float` variable through its item ref
  is a `float` of that variable's cardinality, in `openPackage`'s checks and when a session runs
  it, whether or not the item ref defines the weight. pantry leaves the read's type unknown, so
  plate may refuse a package that pantry accepts, but only one that would fail at run time.
- A read through an item ref gives NULL of the variable's declared type and cardinality when the
  item's record holds no value for it, such as a template variable of an item not yet shown. So do
  a `qti-variable`, `qti-correct` or `qti-default` of a `file` or `record` variable, and a read of
  an item's second or later occurrence, such as `ITEM1.2.SCORE` *(pending)*.
- A test's `qti-default` of its own `duration` gives NULL of a single duration, since a built-in
  declares no default.
- A test reads an item's `numAttempts` as the number of attempts started, the count `results`
  writes. An item counts as attempted for `qti-number-incorrect` once it is shown, answered or not.
- An item ref that shares one category with `include-category` is included, and one that shares
  one with `exclude-category` is left out *(pending)*.
- An item that declares no response is neither correct nor incorrect to `qti-number-correct` and
  `qti-number-incorrect` *(pending)*.
- `qti-number-correct` and `qti-number-incorrect` consider an item's `file` and `record` responses
  as they consider its others, so an item with one that declares no correct response is neither
  correct nor incorrect. Such a response reads NULL, which matches no correct response, so an item
  with one that declares a correct response is never correct *(pending)*.
- `qti-outcome-minimum` leaves out an item whose outcome declares no `normal-minimum`, and applies
  no default in its place *(pending)*.
- `qti-test-variables`, `qti-outcome-minimum` and `qti-outcome-maximum` read an item's
  `numAttempts` and `completionStatus` as a dotted name reads them. A built-in declares no
  `normal-minimum` or `normal-maximum`, so the minimum leaves the item out and the maximum is NULL
  *(pending)*.
- `qti-outcome-minimum` and `qti-outcome-maximum` give a multiple `float`. `qti-test-variables`
  gives a multiple of its `base-type`, or, with no `base-type`, a multiple `float` when it has a
  `weight-identifier`. With neither, `openPackage` and a session type it from the declarations of
  its variable in the test's items, read through each item ref's variable mappings, whatever its
  filters: a multiple `integer` when every single `integer` or `float` declaration is `integer`,
  and a multiple `float` otherwise. QTI 3.0 speaks of the values collected. plate decides by the
  declarations so that the check and the run agree, and the two differ only when every value
  collected from a `float` declaration is NULL. `open` checks a test without its items, so it
  types this collection unknown. pantry types all three by their written `base-type`, or unknown
  with none, so plate may refuse a package that pantry accepts, but only one that would fail at
  run time.

`open` refuses the following in a test's or a section's processing, each as pantry does:

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A name that nothing declares, other than a dotted name, in outcome processing, a pre-condition, a branch rule or a template default | `undeclared-variable` | P8 |
| An operand of a type its expression does not take, or a reference attribute that names a variable of another kind or type | `expression-type` | P23, P24 |
| A `qti-set-outcome-value` whose value is not of its outcome's type, or a `qti-lookup-outcome-value` whose value its outcome's table does not take | `expression-type` | P20, P22 |
| A `qti-lookup-outcome-value` of a dotted name whose value is not a single `integer`, `float` or `duration` | `expression-type` | P22 |
| A `qti-lookup-outcome-value` whose outcome holds no lookup table | `template-requirements` | P22 |
| A `qti-outcome-if` or `qti-outcome-else-if` whose condition is not a single `boolean` | `expression-type` | P21 |
| A `qti-base-value` whose text is not of its base type | `value-type` | P7 |
| A `qti-test-variables` with a `weight-identifier` and a `base-type` other than `float` | `expression-type` | P29 |

A dotted name the test declares whole, such as an outcome named `S.TOTAL`, is that declaration,
and the table judges it as it judges an undotted name. A `qti-correct` of `S.TOTAL` is refused,
since it names an outcome and not a response.

`openPackage` also refuses the following, which need the documents that a test's item refs and
section refs name. It never splits a dotted name the test declares whole into an item ref and a
variable.

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A dotted name, read or set by `qti-set-outcome-value` or `qti-lookup-outcome-value`, that no reading resolves to an item ref, a test part or a section and one of its variables | `undeclared-variable` | `prefixed-ref` |
| A dotted name, read or set, that two readings resolve | `ambiguous-reference` | `prefixed-ref` |
| A dotted name that reads the built-in `duration` of an item that is not time dependent | `undeclared-variable` | `item-duration` |
| A dotted read whose variable's type breaks a rule of the table above, a braced name in a string attribute such as `pattern="{ITEM1.N}"` among them, or a template default whose value is not of its variable's type | `expression-type` | P20 to P24 |
| A `qti-variable-mapping` whose `source-identifier` names no outcome its item declares | `undeclared-variable` | `variable-mapping-source` |
| A second `qti-variable-mapping` on one item ref with the same `target-identifier` | `duplicate-identifier` | `variable-mapping-target` |
| A `qti-template-default` whose `template-identifier` names no template variable of its item | `undeclared-variable` | `template-default-target` |
| A part, section or item ref identifier given twice across a test and the section documents it reaches, refused at the second | `duplicate-identifier` | `structure-identifier` |
| A dotted `qti-correct` that reads anything but a response *(pending)* | `undeclared-variable` | none |
| A dotted `qti-map-response` or `qti-map-response-point` that reads anything but a response *(pending)* | `undeclared-variable` | none |
| A dotted `qti-map-response` or `qti-map-response-point` whose response declares no mapping or area mapping *(pending)* | `template-requirements` | none |

plate and pantry differ in the last three rows until pantry follows: pantry accepts all three.

`openPackage` reads a section document that a test reaches through a `qti-assessment-section-ref`
as if it were inline in that test ([reading 5](../../docs/spec-readings.md)). The test's dotted
names resolve through the section document's item refs. `openPackage` refuses the section
document's variable mappings and template defaults as it refuses the test's, and judges its
expressions under each test that reaches it. A session delivers only the items of the test
document's own item refs, so the verdict marks a dotted name that reads through a section document.

## Server and browser

The server keeps what `open` accepted, correct responses included. The browser gets only the HTML
that `render` makes from `redact`'s copy, and the server scores the post. plate does not enforce
this split. A host that sends the accepted item to the browser sends what `redact` removes.

- `open` and `openPackage` run on Node, not in a browser.
- An accepted item is not JSON, so a stateless server opens the bytes again for each request. To
  send the redacted item itself, write it with `encodeRedacted` and read it with `decodeRedacted`.
- A page that holds a `TestSession` holds every item's outcomes and the test's own, scores included,
  and every item's record. A page that calls `solution`, `results` or `advance` holds the accepted
  items, correct responses included. Keep the session and those calls on the server.
- A `TestSession`'s `seed` is its processing seed, which keys every value the session's processing
  draws, so it is server data, as an item's record is. Pass `startTest` a processing seed apart
  from the configuration's `seed`, never one string as both: the configuration's `seed` orders the
  shuffles the page shows, and their order can give it away. `itemView`'s configuration never
  carries the processing seed. Its `seed` is the session's shuffle seed, absent when the session
  has none.
- An item's record, `ItemView` and `Restored` are server data, as [Records](#records) says. A host
  that sends one to the page sends the seed and the item's answers.
- `redact`'s copy holds no seed, no template rule, no hidden template content, and no correct
  response or default that template processing set. A template value reaches the page only
  through what the item shows: the text a printed variable prints, the value a `param` passes and
  the template content its variable shows. An answer that an item computes from what it shows can
  be worked out from the page, by the item's design.
- Each item on a page needs its own instance token, `render`'s `instance` option, so that every
  form entry name on the page is unique. `render` draws a UUID when you pass none. Two tokens where
  one extends the other after a `.` or `-`, such as `a` and `a.b`, can collide.
- A form that holds a Choice carries `autocomplete="off"`, and its pages send `Cache-Control: no-store`.
  HTML does not allow the attribute on a radio or a checkbox, and without both, the browser can
  show a choice that plate did not render.
- Render a restored item with the instance and the configuration you first rendered it with. Its
  record holds the instance and the seed `begin` was given or drew, but not the configuration,
  whose `seed` orders a shuffled Choice or Inline Choice. A record that `score` started holds the
  instance `""`.
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
`@qti-pie/plate` exports. It keeps no record, so it cannot score an item whose template processing
runs: `score` refuses that item with `RecordRequired`.

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
const redacted = redact(item, undefined, configuration);
const { html } = Result.getOrThrow(render(redacted, configuration, { instance: "q1" }));
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
Like the plain-HTML host, it keeps no record, so it cannot score an item whose template processing
runs.

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
Results Reporting XML file. The playground keeps sessions, and each opened item's record, in
memory on its server until it stops, and its first page lists each session in progress with a
Resume link. `/hosts/html` serves BG007 through the [plain-HTML host](#hosts).

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

The XSD cache, `~/.cache/gr8des/qti3/xsd/`, keeps the ASI, metadata, content-packaging and Results
Reporting XSDs at its top, and every other XSD in its publisher's folder: `cpext/`, `csm/`, `drd/`,
`lom/`, `mathml/`, `ssml/`, `w3/` and `xlink/`. [`src/test/xsd-layout.ts`](src/test/xsd-layout.ts)
lists each file with the URL it is published at and its SHA-256. The tests that validate against the
Results Reporting XSD carry the tag `results-xsd`, and the other tests that read the cache carry
`qti-xsd`.

## License

MIT

[`src/engine/math.ts`](src/engine/math.ts) ports routines of FDLIBM 5.3, and [NOTICE](NOTICE)
holds Sun's notice for them.
