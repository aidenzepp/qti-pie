# Changelog

Every change to `@qti-pie/plate` that a host can see, newest first. A change to how plate reads the
specification is a dated entry that names the reading and the corpus documents whose verdict
changes. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the readings.

## Unreleased

The first entry lists the surface of M1 and M2, and what M3 adds to it. plate is not published,
and both of its entry points are unstable until M3.

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
