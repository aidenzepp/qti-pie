# Changelog

Every change to `@qti-pie/plate` that a host can see, newest first. A change to how plate reads the
specification is a dated entry that names the reading and the corpus documents whose verdict
changes. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the readings.

## Unreleased

The first entry lists the surface of M1 and M2, and what M3 adds to it. plate is not published,
and both of its entry points are unstable until M3.

### Template processing (M3)

- Template processing runs. `open` reads each `qti-template-declaration` and the
  `qti-template-processing`, and the verdict no longer marks them. Response processing reads the
  template values, and the correct responses and defaults template processing set, from the item's
  record. The README's [Template processing](README.md#template-processing) section says what a
  host can rely on.
- `begin(document, { instance, seed })` is new. It starts an item's `StoredRecord`: it runs the
  item's template processing under the seed and sets each response and outcome to its default.
- `score` with no record fails with the new `RecordRequired` for an item whose template processing
  runs. `AdvanceFailure` gains `RecordRequired`, though a session never meets it, since a session
  always passes the item's record.
- An item scored alone, with no record, starts from its declared response defaults. Before, every
  response started at NULL, so a response the post left out scored as NULL. It now scores as its
  default.
- `restore`'s `Restored` gains `record`, the decoded record, beside `values`, and `restore` refuses
  another item's record with `RecordMismatch`, as `score` does. `score` and `restore` refuse with
  `InvalidRecord` a record of an item whose template processing runs that holds no value for one of
  its template variables. `ItemView`, and so the item that `current` gives, gains `record` too.
- `redact`, `checkResponses` and `solution` take the item's record as an optional last argument.
  With a record:
  - `redact` prints each printed variable, shows or hides each template block, template inline and
    choice by its template variable, and passes a `param-variable`'s value to each `param` that
    names it.
  - `checkResponses` judges only the interactions and the choices the page showed. It gives no
    message for a response that no shown interaction binds.
  - `solution` gives the correct responses template processing set.
- With no record, an item whose template processing runs shows a notice for each printed variable,
  template block, template inline and `param` that needs a template value, leaves out each choice
  that a template variable shows or hides, and gives NULL as the solution of each response that a
  `qti-set-correct-response` sets. plate fills in no value from a declaration.
- A redacted item's `notices` can name `qti-printed-variable`, `qti-template-block`,
  `qti-template-inline` and `param` for a part plate shows as a notice, and `template-identifier`,
  once, for the choices it leaves out with no record. They name no feature inside content the page
  does not see: a template block or inline that the record hides or plate withholds, a withheld
  `param`, or a choice that is hidden or left out. A redacted item's `responses` leave out each
  response that only content the page does not see binds.
- `encodeRedacted`'s JSON holds no `path`, so it does not say where hidden template content sits,
  and `decodeRedacted` gives every node the path `""`. It drops a `path` that older JSON holds.
  `redact`'s own result keeps its paths. Before, the JSON held each node's path.
- A printed variable prints. Before, it showed a notice, and the verdict listed
  `qti-printed-variable` as unsupported. With no record, an item whose template processing does not
  run prints its declared template defaults and its outcomes' starting values.
- `score` judges a post as the page its record showed. It refuses a choice that the record hides,
  with `ResponsesRefused`, and keeps the record's value for a response that only hidden template
  content binds, whether the page would show its interaction or a notice. A response that no
  interaction binds, or that only a notice in shown content binds, is scored as the host posts it.
- `qti-random`, `qti-random-integer` and `qti-random-float` run, so plate runs 53 of the 64
  expressions. A `qti-repeat` whose operands draw evaluates them once per pass, and gives NULL for
  more than 1,000,000 repeats.
- Template and response processing draw from an HMAC-SHA-256 stream keyed by the seed. A host
  built on an earlier commit of template processing, which drew from SplitMix32, gets other values
  for the same seed. A shuffle still draws from FNV-1a and SplitMix32, so no shuffled order changes.
- The seed is a string, where it was a number: `Configuration.seed`, `begin`'s `start.seed`,
  `TestSession.seed` and `StoredTestSession.seed`. A shuffle under the seed `"7"` gives the order
  the seed `7` gave. `configure` takes any string, number or boolean as the seed and keeps it as a
  string, so it now takes values it refused, such as `true` or `NaN`. It reads `""` as no seed.
- `startTest` draws a seed of 128 random bits when the configuration has none, so
  `TestSession.seed` is always present. `begin` draws one when you pass none, and `score` when it
  starts a record itself. `render` draws none and keys an absent seed as `""`. Render a session's
  item with the configuration `itemView` gives, which holds the session's seed. To fix the seed for
  `score`, start the record with `begin`.
- Both stored forms are version 2. A `StoredRecord` holds the seed, the template values, and the
  correct responses and defaults template processing set, and a `StoredTestSession` holds its seed
  as a string. plate refuses a version-1 record or session with `InvalidRecord` or
  `InvalidSession`, so a record or session written before this change no longer reads.
- From version 2, the record and the session are server data. The seed keys every drawn value,
  and the template values and correct responses can give the answers away. `ItemView` and
  `Restored` carry the record, so a host that sends either to the page now sends the answers, with
  no type error to warn it. Keep them where only your server reads them.
- A test session starts each item's record when it first shows the item, so a templated item in a
  test shows its template values. A session checks each post, and the skip rule, against the
  item's record. The skip rule, and the answered status `results` reports, take a response's
  default to be the one template processing set for it, else its declared one. So the
  `skipping-not-allowed` message says each response posted is "NULL or the default it started
  with", where it said "NULL or its declared default".
- `results` writes a `templateVariable` for each template declaration, and a shuffled interaction's
  `choiceSequence` lists only the choices the page showed. For a response that only hidden template
  content binds, it reports the value the item's record holds, as `score` keeps it, not the value a
  step saved for it.
- The plain-HTML host, `src/hosts/html.ts`, and the Astro host keep no record, so neither can
  score an item whose template processing runs.
- `Accepted`'s `item` holds `templates` and `templateProcessing`, its body holds printed
  variables, template blocks and template inlines, and a choice holds its template visibility.

### How plate reads template processing (2026-11-07)

- These 14 corpus documents now run template processing and response processing: the seven below,
  each also as its copy inside `BPIG_22April.zip`, `BBQsTest.zip` or `items.zip`.
  - `QTI3_BPIG_Examples/items/adaptiveTemplate.xml`
  - `QTI3_BPIG_Examples/items/template_digging.xml`
  - `QTI3_BPIG_Examples/items/template_image.xml`
  - `qtiv3-examples/packaging/BBQsTest/id-bd44a757f562/SineRule-001.xml`
  - `qtiv3-examples/packaging/BBQsTest/id-13b92f311fc0/SineRule-002-maths.xml`
  - `qtiv3-examples/packaging/items/adaptive_template.xml`
  - `qtiv3-examples/packaging/items/template_image.xml`
- Both `template_digging.xml` and both `template_image.xml`, each with its zip copy, are now
  `accepted`. They were `accepted-with-unsupported` for their template marks. The other eight keep
  `accepted-with-unsupported` for features plate does not render, such as feedback.
- The verdict marks a template declaration of base type `duration` or `file`, of cardinality
  `record`, or with no base type, as it marks such a response or outcome declaration. Template
  processing that holds a marked feature does not run.
- The verdict marks template processing that reads `QTI_CONTEXT` or a context variable, or that
  reads or sets a variable plate does not model, and that processing does not run. Nothing is
  refused: the item is `accepted-with-unsupported`, and its record starts with no template value.
- `open` refuses each of the following, as pantry does.
  - With `expression-type`: a `qti-set-template-value`, `qti-set-correct-response` or
    `qti-set-default-value` whose expression is not of its variable's type (P20), a
    `qti-template-if`, `qti-template-else-if` or `qti-template-constraint` whose condition is not a
    single `boolean` (P21), and, in template processing, an operand of a type its expression does
    not take (P23) and a reference attribute that names a variable of another kind or type (P24).
  - With `expression-type`: a read in template processing of a response, an outcome or a built-in
    other than `QTI_CONTEXT`, through `qti-variable`, `qti-correct`, `qti-default`,
    `qti-map-response`, `qti-map-response-point` or a reference attribute (P26).
  - With `undeclared-variable`: in template processing, a reference attribute that names no
    declared variable (P8), and a template rule that names no variable of the kind it sets (P8, or
    P9 for a built-in).
  - With `attribute-type`: a printed variable's `format` that is not one printf conversion, such as
    `%d`, `%u` or `Score: %.1f` (R38).
  - With `undeclared-variable` or `expression-type`: a printed variable whose `identifier`, or
    whose `base` or `index` written as a name, names no variable of the kind and type it needs
    (`printed-variable-ref`), which in a test is an outcome the test declares, and a
    `template-identifier` that names no template variable of base type `identifier`, single or
    multiple (`template-ref`).
- `qtiv3-examples/packaging/items/template.xml` and its copy inside `items.zip` are now `refused`
  with `expression-type`. They were `accepted-with-unsupported`. Their `qti-set-correct-response`
  sets the `float` `RESPONSE` to a `qti-integer-divide`, an `integer` (P20). `items.zip` itself
  was already `refused`, so plate still agrees with pantry.
- plate and pantry differ in three places until pantry follows. plate accepts a `format` whose
  precision has no digits, such as `%.f`, and a printed variable that names the built-in
  `completionStatus`. It refuses a wrong `template-identifier` on a `qti-simple-choice`, which
  pantry does not check.
- These readings are not yet numbered in `docs/spec-readings.md`, and each marked _pending_ awaits
  approval and can change:
  - A false or NULL `qti-template-constraint` starts template processing again, at most 100 times
    in one run, and then the declared values stand.
  - `qti-random-integer` gives NULL when `max` is below `min` or `step` is 0 or below, and when
    `min` or `max` has more than 1,000,000 bits _(pending)_. `qti-random-float` gives NULL for a
    NaN or infinite bound, or when `max` is below `min` _(pending)_.
  - A drawing `qti-repeat` gives NULL for more than 1,000,000 repeats, and NULL as soon as a pass
    gives no value.
  - A printed tie rounds half away from zero on the shortest decimal, so 0.25 at `%.1f` prints
    `0.3`. Negative zero prints as `-0`. `index` counts from 1 _(pending)_, and `power-form`
    applies only with no `format` _(pending)_.
  - Under `%i`, `%o`, `%x` or `%X`, a float prints its shortest decimal's integer part, truncated
    toward zero _(pending)_, and an infinity or NaN prints `inf`, `-inf` or `nan`, in upper case
    under `%X` _(pending)_. Under `%o`, `%x` or `%X`, a negative writes `-` and its digits
    _(pending)_. A `base` outside 2 to 36 writes base 10 _(pending)_, and a width or precision past
    1,000,000 prints nothing, as NULL does _(pending)_.
  - A `param-variable` that holds a container passes its values joined by `;`, and NULL passes an
    empty value. The standard sets no written form for either, so these follow how a printed
    variable prints a container and NULL by default.

### How plate reads SCORE, MAXSCORE and PASSED (2026-11-07)

- `open` refuses an outcome declaration named `SCORE` or `MAXSCORE` whose base type is not `float`,
  or one named `PASSED` whose base type is not `boolean`, in an item or a test. The rule is
  `attribute-type`, at the declaration's `base-type`. The information model says these outcomes
  must have those types, and pantry refuses the same. A `record` declaration of those names is
  accepted _(pending)_, and so is a response or template declaration of them.
- `qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml`,
  which declares an `integer` `SCORE`, and its copy inside `shared-vocabulary-imsmanifest.zip`, are
  now `refused`. They were `accepted`. The package `shared-vocabulary-imsmanifest.zip` is now
  `refused`, as pantry has it. It was `unchecked`.

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
  value NULL. That NULL stands for a value plate cannot know, so a `qti-multiple`, `qti-ordered`,
  or `qti-repeat` that holds the operator's value is NULL as well. `qti-container-size` of such a
  container is 0, `qti-is-null` of it is true, and `qti-member` and `qti-contains` of it are NULL.
- The verdict still marks processing that holds any of these, and `score` does not run it: one of
  the later expressions that an item may hold, an `xi:include`, a `%` coordinate in a `qti-inside`
  or an area mapping, a `qti-pattern-match` pattern that plate cannot translate, a
  `qti-lookup-outcome-value` that sets an outcome of cardinality `multiple` or `ordered`, or a
  variable that plate holds no value for.
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
- `open` also refuses each of the following with `attribute-type`, as pantry does. Before, `open`
  refused none of them.
  - A declaration named `completionStatus`, `numAttempts` or `duration`, the names of the built-in
    variables, in an item or a test (`DeclarationNotReserved`).
  - A `qti-equal` whose `tolerance` holds a token that is neither an `xs:double` nor a variable's
    name (an NCName), such as `1,5` (P6).
- Where QTI makes an integer a float, an integer beyond the largest finite float becomes the
  largest finite float of its sign (reading 45). Before, it became an infinity.
- `qti-inside` and an area mapping decide exactly whether a `circle`, `ellipse` or `poly` area
  holds a point, at any size. A point on the area's boundary is inside it (reading 52). For
  example, the point (312, 305) is now inside the ellipse `300,300,13,13`, so an answer at that
  point can score differently. Before, these tests rounded and could overflow. A point on the
  boundary could fall outside, and a huge area could hold a point far outside it. A coordinate
  beyond the largest finite float still reads as that float, as before.
- The math functions run on plate's own port of FDLIBM 5.3, so they give the same result in Node,
  Chromium and WebKit. [`NOTICE`](NOTICE) holds Sun's notice for the ported routines.
- `qti-sum`, `qti-subtract`, `qti-product` and `qti-lcm` give NULL for an integer result of more
  than 1,000,000 bits. `qti-multiple`, `qti-ordered` and `qti-repeat` give NULL for a container of
  more than 1,000,000 values. Values written in an item or stored in a record are never bounded.
  These bounds limit size, not time, so call `score` and `advance` on items you do not trust under
  a time limit.
- Processing reads and sets the built-in `completionStatus`, and an item's `StoredRecord` holds it
  among the outcomes. It is `not_attempted` before the first attempt and `unknown` when the first
  attempt's processing starts, and each later attempt starts from the value the last one left. The
  record's `version` stays 1. A record that does not hold `completionStatus`, such as one written
  before this change, still reads, and its next attempt starts it at `unknown`. Once an attempt has
  run, `results` reports the value the record holds.
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
