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
| `partition`, `postings`, `decode` | Turn a posted form's entries into responses, each a `ResponseValue`: a `Value`, or a `RecordValue` for a `record` response |
| `checkResponses` | Validates responses without scoring them |
| `score` | Scores a map of responses, each a `ResponseValue`, and returns the record the host stores |
| `restore` | Gives an item's record and values back from its stored record |
| `solution` | Gives an item's correct responses, from its record where template processing set them |
| `openPackage` | Reads and checks a content package's files, and returns a verdict on the package |
| `itemRefs` | Lists a test's item refs in document order |
| `startTest` | Starts a test session, and fails with `EngineFailure` when a template default of its first part does not fit its variable |
| `current`, `itemView` | Give what a session shows now, and what any of its items renders with |
| `permits` | Says whether an item of a session may be shown in review or solution |
| `navigationState`, `allowedIntents`, `advance` | Give the session's navigation, list the intents it takes now, and carry one out. `advance` fails with `EngineFailure` when processing fails. Its `RecordOperandError` means a test's processing read an item's `record` response other than through `qti-field-value`, `qti-is-null` or `qti-match` |
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
import type { Accepted, AcceptedTest, Configuration, Entry, ResponseValue } from "@qti-pie/plate";

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
    const responses: Record<string, ResponseValue> = {};
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
| `StoredRecord`, `version: 4` | One item's seed, template values, attempts, responses and outcomes, its `record` answers in `records`, and the correct responses and defaults its template processing set | `begin`, `score` | `score`, `restore`, `results` |
| `StoredTestSession`, `version: 4` | A test session, with its processing seed and its shuffle seed, its items' records and template defaults, each item's saved responses and `record` answers in `saved`, its position and its parts, and the test's outcomes with the count of its outcome processing runs | `encodeSession` | `decodeSession`, `results` |

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
- A Text Entry or Extended Text bound to a `record` response is one text control, and the form
  posts the text typed into it. `postings` gives the response a `RecordBinding`, and `decode` reads
  the text into a record *(pending)*. Its `stringValue` is the text as typed, with each CRLF and
  lone CR made LF. When the text, trimmed of spaces, tabs and line breaks, is a decimal number with
  an optional exponent, the record also holds `floatValue`, `leftDigits`, `rightDigits`, `ndp` and
  `nsf`, `integerValue` when the number is whole and written with no exponent, and `exponent` when
  one is written. Every integer is exact. `INF`, `NaN` and `1,000` give `stringValue` alone, and an
  empty post gives the NULL record. `decode` does not apply a Text Entry's `base` to a record.
- `checkResponses` matches a `record` answer's `pattern-mask` against its `stringValue` as typed,
  not against a number's canonical form. `expected-length` sets a text control's size only, and
  plate never judges a text by it. `restore` gives a `record` answer back, and `render` shows its
  `stringValue` in its control again. When an item's session control does not allow skipping, a
  `record` response counts as skipped while it is absent, the NULL record or its declared default.

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

`score` takes a `record` response's answer as a `RecordValue`. It checks a record's shape and
never its fields' values, so it trusts the fields of a record a host builds by hand. It refuses
with `InvalidResponses` a malformed record, such as one that names a field twice or holds a `file`
field, with the problem `not-a-value`. It refuses a record for any other response, and a value for
a `record` response, with the problem `cardinality`. `advance` refuses a step that carries either
with `StepResponseMisfit`.

`qti-match` compares two records as wholes, so they match only when they hold the same fields with
the same values *(pending)*. A record-bound text interaction's answer holds every field its text
gives: a typed `12` holds `floatValue`, `integerValue` and the digit counts beside `stringValue`.
A correct response that writes only `stringValue` therefore never matches a typed `12`. To judge
such an answer, compare one field instead: the `qti-field-value` of `stringValue` with
`qti-match`, or that of `floatValue` with `qti-equal`.

`open` accepts a rule that sets a variable from `qti-field-value`, whatever the field, as pantry
does. A `record` declaration types none of its fields, so neither `open` nor pantry knows a field's
base type before the candidate answers. The same holds for an expression whose type follows a
field's, such as a `qti-sum` or `qti-max` over the field. When the field's base type, or the type
of such an expression, is not the variable's, `score` returns `OutcomeMismatchError` and does not
throw. For example, a rule that sets the `float` `SCORE` from `integerValue` fails when the
candidate types `12`, and sets `SCORE` to NULL for `abc`, which has no `integerValue`. A rule that
sets the `integer` `COUNT` from the `qti-sum` of `integerValue` and `2.0` also fails for `12`,
because that sum is a `float`. Read the field whose base type is the variable's, such as
`floatValue` for a `float`. Keep the type of an expression over a field fixed: for example, set a
`float` from a sum that includes a `float`.

A value that two or more entries of a `qti-mapping` match maps by the first entry listed, as a
point that two areas of a `qti-area-mapping` hold maps by the first area listed.

The verdict marks each of these, and `score` runs no processing that holds one:

- A `%` coordinate in a `qti-inside`, or in an area mapping that `qti-map-response-point` reads
- A `qti-pattern-match` pattern that plate cannot translate
- A `qti-lookup-outcome-value` that sets an outcome of cardinality `multiple` or `ordered`
- A variable that plate holds no value for, such as a `file` response, a `record` response with a
  `file` field, a `record` outcome or template variable, `QTI_CONTEXT` or another context variable,
  the built-in `duration`, whether or not the item is time dependent, or a template variable of
  template processing that does not run

The item's outcomes then stay at their defaults. The verdict also marks `qti-custom-operator`, but
its processing runs, and the operator's value is NULL. A `qti-multiple`, `qti-ordered` or
`qti-repeat` built over a `qti-field-value` is NULL too, even when the field holds a value, so
`qti-container-size` of one is 0. To collect a field's value, set a variable from the field and
build the container from that variable.

`open` refuses the following, each as pantry does where the last column names its rule:

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A `qti-response-if`, `qti-response-else-if`, `qti-template-if`, `qti-template-else-if` or `qti-template-constraint` whose condition is not a single `boolean` | `expression-type` | P21 |
| An operand of a type its expression does not take | `expression-type` | P23 |
| A reference attribute, such as `qti-index`'s `n`, that names a variable other than a single template or outcome variable of the attribute's base type | `expression-type` | P24 |
| A reference attribute that names no declared variable | `undeclared-variable` | P8 |
| A `qti-variable` with a `weight-identifier`, which only a test's outcome processing may hold | `expression-placement` | none: pantry once refused it as P12, and no law of pantry's names it now |
| A literal `figures` below 1, or below 0 in `decimalPlaces` mode | `attribute-type` | P10 |
| A literal `n` of `qti-index` below 1 | `attribute-type` | `attribute-lexical` |
| An item's declaration named `completionStatus`, `numAttempts` or `duration`, the names of an item's built-in variables, or a test's named `duration` | `attribute-type` | `declaration-reserved` |
| An item's outcome declaration named `SCORE` or `MAXSCORE` whose base type is not `float`, or an item's or a test's named `PASSED` whose base type is not `boolean`, a `record` one among them | `attribute-type` | `reserved-type` |
| A `qti-equal` whose `tolerance` is not one or two values, each a number above 0 or a variable's name, such as `0`, `-1`, an empty value or three values. `+INF` is accepted, and so is `1,5`, as a name read at run time | `attribute-type` | P36 |
| A `qti-equal` in `absolute` or `relative` mode that has no `tolerance` | `missing-attribute` | P36 |
| A `qti-mapping` in a response declaration of base type `file` or `duration`, or of cardinality `record`, or a `qti-area-mapping` in one whose base type is not `point` | `misplaced-element` | `mapping-base-type` |
| A `qti-value` without `field-identifier` or `base-type` in the `qti-correct-response` or `qti-default-value` of a `record` declaration | `missing-attribute` | `value-cardinality` |

The refusals with `expression-type` and `undeclared-variable` judge inline response processing and
template processing. [Template processing](#template-processing) lists the refusals that only
template processing meets. The refusal of a mistyped `PASSED` judges a test's declarations as well
as an item's. A test may declare `numAttempts` or `completionStatus`, and only `duration` is
reserved there ([reading 168](../../docs/spec-readings.md), "a test may declare a variable named
`numAttempts` or `completionStatus`; in a test only `duration` is reserved"). A test's `SCORE` and
`MAXSCORE` may have any base type, a `record` among them, since QTI 3.0 types only an item's. pantry
accepts them too.

A built-in variable is named as the kind of variable it stands as
([reading 111](../../docs/spec-readings.md), "a processing element's `identifier` names a variable
of the kind the element reads or sets"): `numAttempts` and `duration` as responses, and
`completionStatus` as an outcome. So `open` accepts a `qti-correct` of `numAttempts` or `duration`,
a `qti-lookup-outcome-value` that sets `completionStatus`, and in template processing a
`qti-set-default-value` of `completionStatus` or `numAttempts` and a `qti-set-correct-response` of
`numAttempts`, and processing runs each. A `qti-correct` or `qti-default` of a built-in reads what
template processing set, or NULL, and never the built-in's own value. A built-in declares no
mapping, so `open` still refuses a `qti-map-response` of one.

Integers are exact. `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an
integer result of more than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give
NULL for a container of more than 1,000,000 values. Values written in an item or stored in a
record are never bounded. These bounds limit size, not time. `decode` takes no step for a
`record` answer that it does not take for an `integer` one. It scans the text and reads each
integer in it as it reads an `integer` answer. How long a posted text can be is the host's bound,
so cap the request body's size.

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
items you `open` one at a time reach that failure. The one exception is a default whose type
follows a field that `qti-field-value` reads. `openPackage` accepts it, and `startTest` or
`advance` returns `OutcomeMismatchError` when its type is not the template variable's, as
[Outcome processing](#outcome-processing) describes. A
default that reads a variable plate holds no value for in a test, one that
[Outcome processing](#outcome-processing) names, is marked and not applied, so its variable starts
at its declared default *(pending)*. A default that reads the test's own `duration` reads NULL
*(pending)*.

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
- A printed variable with a `format` prints its value in the format's first conversion, and the text
  around it as written, `%%` as a percent sign. A format of text alone prints the text. `%d` prints
  as `%i` does, and a conversion after the first prints as written, as the operator ruled. A tie
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

`open` refuses the following. pantry refuses the same.

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A `qti-set-template-value`, `qti-set-correct-response` or `qti-set-default-value` whose expression is not of its variable's base type and cardinality | `expression-type` | P20 |
| A read in template processing of a response, an outcome or a built-in other than `QTI_CONTEXT`, through `qti-variable`, `qti-correct`, `qti-default`, `qti-map-response`, `qti-map-response-point` or a reference attribute. Template processing reads only template and context variables | `expression-type` | P26 |
| A `qti-set-template-value` that names no template variable, a `qti-set-correct-response` that names no response, or a `qti-set-default-value` that names neither a response nor an outcome, each built-in named as the kind it stands as | `undeclared-variable` | P8, or `variable-kind` for a built-in |
| A printed variable's `format` with a conversion that ends in no code from `d E e f G g r R i o X x`, such as `%q`, `%u` or a trailing `%` | `attribute-type` | `attribute-lexical` |
| A printed variable whose `identifier` names no outcome or template variable, or whose `base` or `index`, written as a name, names no single integer outcome or template variable; in a test, whose `identifier` names no outcome the test declares, or whose `base` or `index` names no single integer outcome the test declares | `undeclared-variable` for a name nothing declares, else `expression-type` | `printed-variable-ref` |
| A `template-identifier`, on a template block or inline or on a choice, that names no template variable of base type `identifier` and cardinality `single` or `multiple` | `undeclared-variable` for a name nothing declares, else `expression-type` | `template-ref` |

The verdict marks a template declaration of base type `file`, of cardinality `record`, or with no
base type, as it marks such an outcome declaration and a response declaration of base type `file`
or with no base type. A `record` response has no base type of its own, and the verdict marks one
only when it or one of its fields has base type `file`. The verdict also marks template processing
that reads `QTI_CONTEXT` or a context variable, or that reads or sets a variable plate does not
model. It marks a `qti-set-correct-response` or `qti-set-default-value` that sets a `record`
response `record-set` *(pending)*, so a `record` response always keeps the correct response and
default its declaration writes. Template processing that holds a feature the verdict marks does
not run, and its template variables hold no value.

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
names ([reading 48](../../docs/spec-readings.md), "a dotted reference is accepted when exactly one
reading names a real item ref, test part or section and its variable"). An item ref's
`qti-variable-mapping` applies to every read by name, dotted or through one of the eight
expressions, so a mapped name reads the item's source outcome. A `qti-variable` whose
`weight-identifier` names a `qti-weight` of its item ref reads an integer or a float as a float
times the weight.

The verdict marks a test's outcome processing, and the session does not run it, when it holds an
expression plate does not run. It does the same when the processing reads or sets a variable plate
holds no value for in a test *(pending)*: the test's own `numAttempts` or `completionStatus` where
the test declares none, `QTI_CONTEXT` or a context variable, the `duration` of a part, a section or
an item ref, such as `ITEM1.duration` or the occurrence form `ITEM1.1.duration`, or a
`qti-test-variables` of `duration`. In a test that holds a `qti-assessment-section-ref`, it also
marks a dotted name, judged by the test document alone, unless the name is a part, section or item
ref of the test document itself, a dot, and a variable name that holds no dot. After an item ref
that a selection with replacement can repeat, an occurrence number may come before the variable
name, as in `a.2.SCORE`. So it marks `I1.SCORE` where `I1` is an item ref in a section document, and
`a.b.SCORE` where `a` is the test's own item ref and `a.b` a section document's, even when `a`'s
item declares `b.SCORE`. It also marks such a test's outcome processing when the processing holds
one of the eight expressions above, because they would look up only the test document's own items: a
session delivers none of a section document's items. `openPackage` reads the items, and marks a name
that the test document alone leaves unmarked when the one reading that resolves the name is through
an item ref or section that a section document holds. It marks `x.y.SCORE`, for example, where the
test's own item ref `x.y` names an item that declares no `SCORE` and a section document's item ref
`x` names one that declares `y.SCORE`. `openPackage` also marks a test's outcome processing, and
leaves out a template default, that reads an item's context variable through its item ref, such as
`ITEM1.CTX` where the item declares `CTX` in a `qti-context-declaration`: the item marks that
declaration, and plate holds no value of it. A test checked apart from its items cannot see this, so
there its processing runs and fails at that read with `UnknownIdentifierError`. `open` accepts
these, as pantry does.

`openPackage` accepts a test that sets a variable from `qti-field-value` of an item's `record`
response, whatever the field, in its outcome processing or in an item ref's template default.
When the field's base type, or the type of an expression over it such as a `qti-sum`, is not the
variable's, `startTest` or `advance` returns `OutcomeMismatchError` and does not throw.
`startTest` returns it for a default that it applies as the first part starts, since a default can
read a field of the record an item's declaration writes, through `qti-default` or `qti-correct`,
before anyone answers. `advance` returns it for the step that runs the rule or applies a later
default. For example, a `float` `T_SCORE` set from the `integerValue` of `ITEM1.RESPONSE` fails
once the candidate types `12`. As in an item ([Scoring](#scoring)), read the field whose base type
is the variable's, and keep the type of an expression over a field fixed.

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
  a `qti-variable`, `qti-correct` or `qti-default` of a `file` variable, of a `record` outcome or
  template variable, or of a `record` response with a `file` field, and a read of an item's second
  or later occurrence, such as `ITEM1.2.SCORE` *(pending)*. plate never reads a context variable
  through an item ref. `openPackage` marks the processing that reads one, or leaves out the
  template default. When you `open` a test and its items one at a time, that read fails with
  `UnknownIdentifierError`.
- A read through an item ref of an item's `record` response, such as `ITEM1.RESPONSE`, gives the
  `record` answer that the item's record holds, or the NULL record when it holds none or the name
  reads a second occurrence. Its `qti-correct` and `qti-default` give the record its declaration
  writes, or the NULL record when it writes none. `qti-field-value`, `qti-is-null` and `qti-match`
  read it as they read a `record` response in an item *(pending)*.
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
  correct nor incorrect. A `record` response matches its correct response when the two hold the
  same fields, as `qti-match` compares two records *(pending)*. A `file` response, or a `record`
  response with a `file` field, reads NULL, which matches no correct response, so an item with one
  that declares a correct response is never correct *(pending)*. `qti-number-responded` counts an
  item whose `record` response differs from its declared default.
- In a package whose manifest says QTI 3.0.1, an outcome that writes no `normal-minimum` has the
  minimum 0.0 ([reading 149](../../docs/spec-readings.md), "an outcome declaration's
  `normal-minimum` is 0.0 where a QTI 3.0.1 document writes none"), so `qti-outcome-minimum` counts
  it, and `results` writes `normalMinimum="0"` for it. Elsewhere `qti-outcome-minimum` leaves out an
  item whose outcome declares no `normal-minimum`, and applies no default in its place *(pending)*.
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
| A `qti-map-response` or `qti-map-response-point` of a test's built-in `duration`, or of `numAttempts` where the test declares none (reading 166): a built-in declares no mapping | `template-requirements` | P27 |
| A `qti-outcome-if` or `qti-outcome-else-if` whose condition is not a single `boolean` | `expression-type` | P21 |
| A `qti-base-value` whose text is not of its base type | `value-type` | `attribute-lexical` |
| A `qti-test-variables` with a `weight-identifier` and a `base-type` other than `float` | `expression-type` | P29 |

`open` refuses a test's `record` outcome declaration as it refuses an item's. It refuses with
`missing-attribute` a `qti-value` in the declaration's `qti-default-value` that has no
`field-identifier` or no `base-type`, and with `value-type` one whose text is not of its own
`base-type`.

A dotted name the test declares whole, such as an outcome named `S.TOTAL`, is that declaration,
and the table judges it as it judges an undotted name. A `qti-correct` of `S.TOTAL` is refused,
since it names an outcome and not a response.

`openPackage` also refuses the following, which need the documents that a test's item refs and
section refs name. A name that a rule sets is the test's own variable, so `openPackage` never splits
it into an item ref and a variable ([reading 112](../../docs/spec-readings.md), "a test's setter
sets a variable of its own document, so a prefixed reading never resolves it"). A name that the test
reads counts every reading: the test's own variable of the whole name, each item ref, part or
section that a split reaches, and a numbered reading such as `Q1.2.SCORE` only where a selection
with replacement can repeat `Q1` ([reading 88](../../docs/spec-readings.md), "a numbered reference
such as `Q01.2.SCORE` names an instance of an item ref that a selection with replacement can repeat,
and nothing else").

| Refused | Rule | pantry's rule |
| --- | --- | --- |
| A dotted name, read, that no reading resolves to an item ref, a test part or a section and one of its variables, a numbered name with no selection that can repeat its item ref among them | `undeclared-variable` | `prefixed-ref` |
| A dotted name, read, that two readings resolve, such as `a.b` that the test declares whole beside an item ref `a` whose item declares `b` | `ambiguous-reference` | `prefixed-ref` |
| A dotted name that `qti-set-outcome-value` or `qti-lookup-outcome-value` sets and the test does not declare, such as `ITEM1.SCORE` | `undeclared-variable` | `variable-kind` |
| A name read from outside a section document that the test places twice, through that document | `ambiguous-reference` | `prefixed-ref` |
| A dotted read whose variable's type breaks a rule of the table above, a braced name in a string attribute such as `pattern="{ITEM1.N}"` among them, or a template default whose value is not of its variable's type | `expression-type` | P20 to P24 |
| A `qti-variable-mapping` whose `source-identifier` names no outcome its item declares | `undeclared-variable` | `variable-mapping-source` |
| A `qti-variable-mapping` whose `target-identifier` names another variable of its item or a built-in, or a second mapping on one item ref with the same `target-identifier`. Under an item ref that names an LTI link, the second mapping and a target that names `completionStatus`, `numAttempts` or `duration` other than its own source | `duplicate-identifier` | `variable-mapping-target` |
| A `qti-template-default` whose `template-identifier` names no template variable of its item | `undeclared-variable` | `template-default-target` |
| A part, section or item ref identifier given twice across a test and the section documents it reaches, refused at the second | `duplicate-identifier` | `structure-identifier` |
| A section ref that leads back to a section document already on its chain | `inclusion-cycle` | `inclusion-cycle` |
| A branch rule, in the test or in a section document it places, that jumps backward, to itself, into another part, to a name the assembled test does not hold, or to an item ref a selection with replacement can repeat | `branch-target` | `branch-target`, `branch-forward` |
| A dotted `qti-correct` that reads anything but a response | `undeclared-variable` | `variable-kind` |
| A dotted `qti-map-response` or `qti-map-response-point` that reads anything but a response | `undeclared-variable` | `variable-kind` |
| A dotted `qti-map-response` or `qti-map-response-point` whose response declares no mapping or area mapping | `template-requirements` | P27 |

pantry refuses the last three rows too, under its laws "Variable kind" and "Mapped response"
([reading 166](../../docs/spec-readings.md), "a test's prefixed `qti-map-response` names a response
variable whose declaration holds a `qti-mapping`, and a test's prefixed `qti-correct` names a
response variable").

`openPackage` reads a section document that a test reaches through a `qti-assessment-section-ref`
as if it were inline in that test ([reading 5](../../docs/spec-readings.md)). The test's dotted
names resolve through the section document's item refs. `openPackage` refuses the item refs,
section refs, variable mappings and template defaults of every section document the manifest lists
as it refuses the test's, whether or not a test reaches it, and judges its expressions under each
test that reaches it. A session delivers only the items of the test document's own item refs, which
is why the verdict marks the dotted names listed earlier in this section.

A section ref whose `href`, through the `xml:base` in scope, leads outside the package is refused
`package-path-outside` with the check `remote-section`, in the test and in each section document it
places. plate never fetches a section, so it cannot assemble that test.
[Reading 170](../../docs/spec-readings.md) ("a section ref whose href is external is refused under
the stated limit 'Remote section ref'") calls the refusal a stated limit, not a rule of QTI.

## Documents and packages

`open` checks a document against the QTI 3.0 XSD and the readings in
[`docs/spec-readings.md`](../../docs/spec-readings.md), which pantry follows too. A refusal names
its `rule`, and its `detail` names the `check` where a rule has several. The
[changelog](CHANGELOG.md) lists each check as it lands. A host can rely on these:

- A document that holds MathML, SSML, an unexpanded entity reference or an `xi:include` is
  `unchecked`, whatever its root, and plate gives no accepted document for it. plate never fetches
  an included fragment, so it cannot judge the document that places one.
- A choice's identifier is used by no other choice of its item or stimulus, of any class, a
  `qti-gap` among them. In an item it names no item variable or built-in
  ([reading 104](../../docs/spec-readings.md), "a choice's identifier is used by no other choice of
  any class in its document, and names no item variable").
- On an element that the Schematron's extension-attribute lists cover, an attribute the XSD does not
  declare is refused unless it is a `data-` attribute ([reading 90](../../docs/spec-readings.md),
  "an attribute its XSD does not declare is a `data-` attribute, or the document is refused"). The
  ASI XSD declares no `xml:base` on a test, a test part, a section or an item ref, so `open` refuses
  one there. Where QTI allows it, an `xml:base` is a base for the references under it.
- A catalog holds one card per support, and a card holds at most one default entry. A
  `data-catalog-idref` names a `qti-catalog` (R9-a, "the catalog sentences of the information model
  hold as written").
- A `qti-portable-custom-interaction` names its module by `module`, by `qti-interaction-modules`, or
  by both (R10-a, "a PCI names its module by `module`, by `qti-interaction-modules`, or by both").
- A `data-ssml` value is Data-SSML JSON in every document, as the operator ruled, or the document is
  refused `attribute-type`, the check `data-ssml` naming the problem.
- Each token of a table cell's `headers` names a `th` of the cell's own table
  ([reading 126](../../docs/spec-readings.md), "each token of a `td`'s or a `th`'s `headers` is the
  `id` of a `th` of the cell's own table"), and no quotation mark stands immediately before, after
  or inside a `q` ([reading 127](../../docs/spec-readings.md), "no quotation punctuation stands
  immediately before, after or inside a `q`"). Like the `data-ssml` rule, both hold in every
  document: an item, a stimulus, a test's or a section's rubric block, and a test's feedback.

In a package, the manifest's QTI version decides three more rules, which a document you `open` alone
does not meet, since plate cannot know its version. Under 3.0.0, an item that holds a
`qti-custom-interaction` is refused `unknown-element`, as the operator ruled, since 3.0.0 deprecates
it for a PCI. One inside lax wildcard content is not refused: the XSD gives it no global
declaration, so the walk does not check it as QTI there ([reading 57](../../docs/spec-readings.md),
"in lax wildcard content, every prose rule judges the QTI elements the structural walk checks
there"). Under 3.0.1, an item whose root carries a `label` carries `tool-name` and
`tool-version` ([reading 128](../../docs/spec-readings.md), "a `label` asks for the tool that
labelled it where its own characteristic's description says so"). Also under 3.0.1, an outcome that
writes no `normal-minimum` has the minimum 0.0, which `qti-outcome-minimum`, a `mastery-value` and
`results` read ([reading 149](../../docs/spec-readings.md)).

`openPackage` reads the files you unzipped, never a zip, so
[reading 139](../../docs/spec-readings.md) ("a package zip's central directory ends where its end
record begins") is your unzip's to keep. Refuse a zip that holds other bytes between the two. A file
key that holds a backslash or begins with a drive prefix, such as `C:/x.xml`, is refused
`package-path-outside` ([reading 138](../../docs/spec-readings.md)). Beyond each document's own
verdict, `openPackage` refuses:

- A file reference that resolves inside the package, through the `xml:base` in scope, and names no
  file the package holds or its manifest lists, with `package-file-missing`
  ([reading 103](../../docs/spec-readings.md), "a document's file references are the attributes its
  vocabularies define as the location of a file"). The references are those reading 103 lists, an
  image, a stylesheet, an item ref and a module configuration among them, and a card's
  `qti-file-href` and a `qti-resource-icon` (R9-b, "card files and resource icons are file
  references").
- A language an item's or a test's `xml:lang` states that the general category of its LOM record
  does not list, with `document-lang`. An `xml:lang` inside a catalog asks for no listing (R9-c,
  "R26 counts the metadata binding's elements, and catalog content is not among them").
- An item's or a test's title that matches no LOM title string of the document's language, read as
  an `xs:normalizedString`, with `lom-title`.
- A QTI 2 document, such as QTI 2 usage data, with `not-qti-root`.
- A document resource whose `href` is absolute, rooted or leads outside the package, with
  `package-path-outside`. A `cp:file` or another resource's `href` that leads outside is an external
  link, and is not refused.

The `path` of a file reference's `package-file-missing` and of an `item-ref-unresolved`, and the
`chain` of an `inclusion-cycle`, are at most 1,024 characters: a longer one keeps its first 512 and
its last 511 characters around one `…`.

To open packages you do not trust, call `openPackage` under a time limit too, as [Scoring](#scoring)
says for `score`. A package whose tests together place section documents more than 4,096 times, or
place more than 4 MiB of them, is refused `assembly-limit` before any test is judged
([Limits](#limits)). Within that limit, a package built to be slow can still take seconds.

An item ref may name an LTI link in place of an item ([reading 110](../../docs/spec-readings.md),
"under an item ref that names an LTI link a variable mapping is accepted unchecked, a recorded
limit, and a template default is refused"). `openPackage` delivers the test with the ref marked
`lti-link` and left out, since plate launches no LTI link. A variable mapping's source under the ref
is not checked. Its target is judged by [reading 97](../../docs/spec-readings.md) ("a variable
mapping's target names no other variable its item ref's item holds"): a second mapping with the
same target, and a target that names `completionStatus`, `numAttempts` or `duration` other than the
mapping's own source, are refused `duplicate-identifier`. A name read through the ref is accepted,
and the processing that reads it is marked and does not run. The package also marks outcome
processing that counts over the test's items, which would count only the delivered items. A template
default under the ref is refused `undeclared-variable`.

## Limits

Each row is a limit of plate's own, not a rule of QTI. In each, plate refuses valid content it
cannot represent, accepts content it cannot check, or marks processing it cannot run, for the cause
the row names.

| Limit | Cause | What would lift it |
| --- | --- | --- |
| A document nested deeper than 256 elements is refused `reader-refused`, its `readerRule` `element-depth`, as crust refuses it. XML and QTI set no depth | The bound protects the recursive walks over a read document | Walks that keep their own stack, then a higher bound in crust's reader |
| A package whose tests together place section documents more than 4,096 times, or place more than 4 MiB (4,194,304 bytes) of them, is refused `assembly-limit`, its `bound` `placements` or `bytes`, and none of its tests is judged. A section document placed in two test parts, or in two tests, counts twice, and its bytes count each time | A section document is judged once for each placement (readings 5 and 145), so the work follows the assembled tests, which test parts, tests and chains of section documents can make far larger than the package | The redesign that [issue #64](https://github.com/aidenzepp/qti-pie/issues/64) tracks: no placement for each test part, and a section document judged once across tests whose reaches agree |
| A section ref whose `href` leads outside the package is refused `package-path-outside`, check `remote-section` (reading 170) | plate never fetches a section, so it cannot assemble the test | Fetching the section when the package is opened |
| A document that holds an `xi:include` is `unchecked`. A loop through includes is not seen, and the `xml:lang` of an included fragment asks for no LOM listing | plate never fetches an included fragment | Fetching each fragment and judging it in place |
| Under an item ref that names an LTI link, a variable mapping's source and a name read through the ref are accepted unchecked (readings 106 and 110). The mapping's target is judged by reading 97 | The package declares nothing that a link reports | A source that lists the outcomes a link reports |
| plate holds no item's `duration` for processing, so processing that reads one, timed or not, is marked and does not run: an item's own, and a test's through an item ref, such as `ITEM1.duration` (reading 150) | The engine holds no measured item duration | An engine given the session's measured item durations by its host |
| Text that an `xsi:type` types with a simple type, under a wildcard, is accepted unchecked (reading 60), and an ID such text carries takes no part in the ID table | plate does not check simply typed text | A check of XML Schema's simple types on text |
| The walk never visits four kinds of content, or anything below them: what a `skip` wildcard admits; an element of a namespace plate holds no tables for, such as MathML in an item or XLink in a manifest, that its parent's table names or a `strict` wildcard admits; a QTI root or a manifest nested in lax content (reading 6); and content a complex `xsi:type` keeps unchecked (reading 50). There an `xml:lang` is not checked (reading 129), an `xml:id` takes no part in the ID table, and an IDREF that names the `id` of a MathML or SSML element is not refused | plate holds no tables for those namespaces, and readings 6 and 50 keep the rest foreign | A walk that visits every element, with tables for each namespace the schemas import |
| An IDREF is not refused in a document that includes a fragment, or where an ID's value holds an unexpanded entity reference | The document's IDs are not all known | Fetching fragments and expanding entities |
| A manifest's IDs and IDREFs are not judged by the ID table | The manifest's own rules already refuse a dependency that names no resource (`dependency-unresolved`) | Applying the content-packaging XSD's ID types |
| A default hotspot whose interaction's type an `xsi:type` gives, under another element name, is not judged | No official package has one | Judging hotspots by their governing type |
| A comment or processing instruction between a quotation mark and a `q` is not seen, so the mark is refused (reading 127) | plate's reader drops comments and processing instructions | A reader that keeps them |
| A `data-ssml` value's `break.time` is not checked against CSS's time format, nor `prosody.rate` against its percentage, beyond their whitespace | The binding's JSON Schema types both as strings | A check of each format |
| A `data-ssml` name written twice in one JSON object is judged by its last value | plate's JSON reader keeps the last value | A JSON reader that keeps every value |
| A test's or a section's `data-catalog-idref` that names a catalog of a section document it places is refused `attribute-type`, check `idref-target` | plate judges each document's IDs alone | Judging catalog references over the assembled test |
| `a%2Fb.xml` and `a%252Fb.xml` name one file, the one whose name is spelled `a%2Fb.xml` | A package keys a file by one text, which holds no `/` inside a segment | Keys that keep a segment's escapes |
| A fragment, LOM metadata or usage-data document is read for its root alone. A QTI 2 root is refused, and nothing else of it is judged | plate models none of these documents | Judging each document, usage data's values among them |
| Where resources name an included fragment's path as two types of document, any element in QTI's namespace but a root no include stands for bears out the fragment's type. The choice moves no verdict, only which resource is refused | plate holds no table of what an include stands for | That table |
| A `srcset` URL that holds a comma not followed by whitespace is split at the comma | plate splits a `srcset` at its commas | HTML's `srcset` parsing algorithm |
| A `qti-interaction-modules` that writes no `primary-configuration` is not checked for its default file, `modules/module_resolution.js` | Only a written attribute is a reference, and no official package leaves it unwritten without the file | Looking for the default file |
| A branch rule's backward target that a `fixed` choice keeps in order under a shuffle is accepted (reading 87) | plate does not read `fixed` when it judges order | Reading `fixed` |

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
