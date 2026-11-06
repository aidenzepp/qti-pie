# Changelog

Every change to `@qti-pie/plate` that a host can see, newest first. A change to how plate reads the
specification is a dated entry that names the reading and the corpus documents whose verdict
changes. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the readings.

## Unreleased

The first entry lists the surface of M1 and M2, and what M3 adds to it. plate is not published,
and both of its entry points are unstable until M3.

### Response processing (M3)

- In inline response processing, `score` runs every response rule and 50 of the 64 expressions
  QTI 3.0 defines. Before, it ran `qti-response-condition` and `qti-set-outcome-value` over eight
  expressions. `open` marked processing that held anything else, and that processing did not run.
  The README's [Scoring](README.md#scoring) section lists the 14 expressions that later stages of M3
  bring.
- `qti-lookup-outcome-value` maps a value through its outcome's `qti-match-table` or
  `qti-interpolation-table`, and the verdict no longer marks either table. `qti-exit-response` ends
  processing, and a `qti-response-processing-fragment`'s rules run where the fragment stands.
- `qti-equal` runs in its `absolute` and `relative` tolerance modes, as well as in `exact`.
- The verdict still marks `qti-custom-operator`, but its processing now runs, with the operator's
  value NULL.
- The verdict still marks processing that holds any of these, and `score` does not run it: one of
  the later expressions that an item may hold, an `xi:include`, a `%` coordinate in a `qti-inside`
  or an area mapping, a `qti-pattern-match` pattern that plate cannot translate, or a variable that
  plate holds no value for.
- `open` refuses each of the following, as pantry's processing checker does. The refusals with
  `expression-type` and `undeclared-variable` judge only inline response processing.
  - With `expression-type`: a `qti-response-if` or `qti-response-else-if` whose condition is not a
    single `boolean` (P21), an operand of a type its expression does not take (P23), and a
    reference attribute, such as `qti-index`'s `n`, that names a variable other than a single
    template or outcome variable of the attribute's base type (P24). Before, `open` judged the
    operands of `qti-equal` alone.
  - With `undeclared-variable`: a reference attribute that names no declared variable (P8), the
    built-in `duration` read in an item that is not time dependent (`item-duration`), and a
    `qti-lookup-outcome-value` that sets the built-in `completionStatus` (P9).
  - With `attribute-type`: a literal `figures` below 1, or below 0 in `decimalPlaces` mode (P10),
    and a literal `n` of `qti-index` below 1 (P11).
  - With `missing-attribute`: a `qti-equal` in `absolute` or `relative` mode that has no
    `tolerance` (P36).
- Where QTI makes an integer a float, an integer beyond the largest finite float becomes the
  largest finite float of its sign (reading 45). Before, it became an infinity.
- The math functions run on plate's own port of FDLIBM 5.3, so they give the same result in Node,
  Chromium and WebKit. [`NOTICE`](NOTICE) holds Sun's notice for the ported routines.
- `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an integer result of more
  than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give NULL for a container of
  more than 1,000,000 values. Values written in an item or stored in a record are never bounded.
  These bounds limit size, not time, so call `score` and `advance` on items you do not trust under
  a time limit.
- Processing reads and sets the built-in `completionStatus`. Unless a declaration names it, an
  item's `StoredRecord` holds it among the outcomes. It is `not_attempted` before the first
  attempt and `unknown` when the first attempt's processing starts, and each later attempt starts
  from the value the last one left. The record's `version` stays 1. A record that does not hold
  `completionStatus`, such as one written before this change, still reads, and its next attempt
  starts it at `unknown`. Once an attempt has run, `results` reports the value the record holds.
- The verdict still marks an adaptive item `adaptive="true"`, and its processing runs as a
  non-adaptive item's. Each attempt starts from the declared defaults, so outcomes do not add up
  across attempts until M5.
- `Accepted`, which `@qti-pie/plate` exports, holds `item: Item`, so a host's types see the `Rule`
  and `Expression` types of `item.processing`. Their shape changed. Every expression is a
  `{ kind, operands, … }` variant of one of the 64 kinds. A leaf such as `variable` has
  `operands: []`, and `is-null`'s `operand` is now `operands`. `Rule` gains the kinds
  `lookup-outcome` and `exit`, and an `OutcomeDeclaration` holds its `lookupTable`. The list of
  exports is unchanged, and so is `EngineFailure`.

### Inline Choice (M3)

- `render` writes an Inline Choice as a native `select`. Its first option, the author's
  `data-prompt` or else "Select an answer", posts an empty value, which `decode` reads as NULL. In
  `review` and `solution`, the `select` is disabled and posts nothing.
- `render`'s `parts` option takes the key `inline-choice-interaction`, with the parts `root`,
  `label`, `control`, `placeholder` and `option`.
- `PartSwapRefused` has a new cause, `select-content`. It refuses a replacement for `control`,
  `placeholder` or `option` whose root does not hold exactly the nodes the part function receives,
  directly under it and in the order given.
- A replacement for `control` may not return a `select` that is `multiple` or has a `size` other
  than 1, and one for `placeholder` or `option` may not return an `option` with a `label`.
  `PartSwapRefused` refuses either with the cause `root-not-allowed`.
- `checkResponses` and `score` judge an Inline Choice's response. For an identifier that names none
  of its choices, `checkResponses` gives a message and `score` returns `ResponsesRefused`. Before,
  both took any identifier.
- `encodeRedacted` and `decodeRedacted` carry an Inline Choice, `results` reports a shuffled Inline
  Choice's order, and `src/styles.css` styles its parts.

### How plate reads an Inline Choice (2026-11-06)

- `open` builds an Inline Choice where it showed a notice before.
  `QTI3_BPIG_Examples/items/QTI3-inline-choice.xml` and
  `qtiv3-examples/packaging/items/inline_choice.xml` are now `accepted`. They were
  `accepted-with-unsupported`.
- `open` refuses an Inline Choice whose response is not of cardinality `single` and base type
  `identifier`, with the rule `binding`. The rule judges every Inline Choice, whatever its choices
  hold, one inside a feedback block included.
- `open` refuses two choices of one Inline Choice that share an identifier, with the rule
  `duplicate-identifier`.
- An item that breaks either rule is now `refused`. Before, it was `accepted-with-unsupported`, or
  `unchecked` when it also held something plate leaves unchecked, such as MathML. No corpus
  document breaks either rule.
- An Inline Choice whose choices hold anything but text and the inline elements that
  [`src/vocabulary.ts`](src/vocabulary.ts) lists keeps its notice, since an `option` shows only
  text. The verdict lists it as unsupported, and nothing is refused for it.
- `min-choices` above 1 on an Inline Choice is validated as written, as a Choice's is. Its response
  holds at most one identifier, so under `validateResponses`, `checkResponses` gives a message for
  every response.

### Items (M1)

- `open` checks an item's bytes and returns a verdict that names each feature plate does not render.
- `configure` decodes the host's settings into a `Configuration`.
- `redact` copies an accepted item without its correct responses and response processing.
  `encodeRedacted` and `decodeRedacted` carry that copy as JSON.
- `render` writes an item as HTML, with native controls for choice, text entry and extended text.
  Its `parts` option swaps a part for the host's own markup, built with `h`.
- `renderStatus` writes the Status part.
- `entryName`, `encode`, `decode`, `partition`, `isPosted` and `checkInstance` write and read a
  native form's entries.
- `checkResponses` validates responses. `score` scores them with inline response processing and six
  built-in templates, and returns the record the host stores.
- `src/styles.css` is the default theme. It reads shadcn's token names.

### Tests and packages (M2)

- `openPackage` checks a content package, and `itemRefs` lists a test's item refs.
- `startTest`, `current`, `itemView` and `permits` start a test session and say what it shows.
- `navigationState`, `allowedIntents`, `advance`, `intentName`, `encodeIntent` and `decodeIntent`
  are the navigation API. `renderNavigation` writes the navigation parts as plain buttons.
- `encodeSession` and `decodeSession` write a test session as a `StoredTestSession` and check one
  handed back.
- `restore(document, record)` gives an item's values back from its `StoredRecord`, and `solution`
  gives its correct responses.
- `render`'s `mode` option shows an item in `review` or `solution`, and `renderStatus` takes the
  headings `review`, `solution`, `partSubmitted` and `testFinished`.
- `results` writes a Results Reporting document for an item or a test session.
- `postings` lists each response that an interaction binds, with the response's binding and the
  options `decode` takes, so `decode` reads a posted Text Entry in the base its binding declares,
  not always in base 10. A response that no interaction binds has no posting, and keeps the value
  its record holds.
- `@qti-pie/plate/styles.css` is an entry point.

### Changed since M1

- `open` accepts tests, sections and stimuli, which M1 left unchecked. Every verdict carries `kind`,
  so read an accepted item with `acceptedItem`.
- A `StoredRecord` carries `version: 1`. plate refuses a record that M1's `score` wrote, since it
  names no version.
- A Text Entry's and an Extended Text's controls carry `autocomplete="off"` in every mode.
- `PartSwapRefused` refuses with `root-not-allowed` a replacement for a Text Entry's `control`
  that writes its type in another case, such as `TYPE="checkbox"`, as it already refused
  `type="checkbox"`.
- A replacement's attribute whose name differs only in case from one plate computes, such as
  `NAME` beside `name`, is dropped, so the root holds one attribute of that name, plate's. Before,
  both were written, and the browser read the replacement's.
- A replacement can no longer set a state plate leaves off: its `checked`, `selected`, `disabled`,
  `readonly`, `name`, `value` or `type`, in any case, is dropped on a part whose state plate
  computes, as are `disabled` and `hidden` on an Inline Choice option. So a replacement cannot set
  a control's own state or content. Disabling controls through an ancestor, such as a container
  swapped to a `fieldset disabled` or marked `inert`, is the host's; `render`'s `disabled` option
  is the supported way to disable every control. A Label replacement that is not a `label` carries
  no `for`, and still names the control through its id. Before, both were written.
- `PartSwapRefused` refuses with `select-content` a replacement for an Extended Text's `control`
  whose `textarea` holds anything beside the restored answer, or anything at all when no answer is
  restored, since a textarea posts its text. Before, host text beside the answer was accepted and
  posted as the candidate's.
- `decode` refuses posted text that holds a character XML 1.0 cannot carry, such as U+0000 or
  U+FFFE, with `Malformed` and the reason `character`. A stored record or session with a string or
  URI value that holds such a character is refused when plate reads it back.

### Changed during M2

A host built on an earlier commit of M2 sees these changes.

- `advance` ignores the responses a step carries when the current item is closed, and still carries
  out the step's intent. A closed item keeps the responses it closed with, which `itemView` shows
  and `results` reports.
- When the current item is open, `advance` refuses with `StepResponseMisfit` a step that carries a
  response the item does not declare, or one that does not match its declaration's base type and
  cardinality. `results` refuses with `InvalidSession` a test session whose item holds such a saved
  response.
- Under `allow-skipping="false"`, only the responses that `postings` lists count as answering an
  item. An item with none of them is never refused as `skipping-not-allowed`.
- An accepted package's `files` leaves out the document of every QTI resource: items, tests,
  sections, stimuli, outcome declarations, response processing, response-processing templates and
  fragments. It also leaves out every file listed by a QTI resource that has no `href` or an
  absolute one, because plate cannot tell which of them is its document. A QTI document listed in
  any other way stays.
- `restore` takes the item as well as its record, `restore(document, record)`. It refuses with
  `InvalidRecord` a record whose responses or outcomes do not fit the item's declarations.
  `results` refuses such a record too: with `InvalidRecord` for an item, and with `InvalidSession`
  for an item of a test session.
- `results` refuses a context with a `sourceId` that holds a character XML 1.0 cannot carry, with
  `InvalidResultContext`.
- `startTest` resolves a test's item hrefs as `openPackage` does. A test now starts when its
  package's location holds a percent escape such as `%41` or a `./` segment, or when its
  directory's name holds a percent escape. Before, `startTest` refused each with
  `TestNotDeliverable` and the reason `item-mismatch`.
