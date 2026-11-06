# Changelog

Every change to `@qti-pie/plate` that a host can see, newest first. A change to how plate reads the
specification is a dated entry that names the reading and the corpus documents whose verdict
changes. [`docs/spec-readings.md`](../../docs/spec-readings.md) numbers the readings.

## Unreleased

The first entry lists the surface of M1 and M2. plate is not published, and both of its entry
points are unstable until M3.

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
- `restore` gives an item's values back from its `StoredRecord`, and `solution` gives its correct
  responses.
- `render`'s `mode` option shows an item in `review` or `solution`, and `renderStatus` takes the
  headings `review`, `solution`, `partSubmitted` and `testFinished`.
- `results` writes a Results Reporting document for an item or a test session.
- `@qti-pie/plate/styles.css` is an entry point.

### Changed since M1

- `open` accepts tests, sections and stimuli, which M1 left unchecked. Every verdict carries `kind`,
  so read an accepted item with `acceptedItem`.
- A `StoredRecord` carries `version: 1`. plate refuses a record that M1's `score` wrote, since it
  names no version.
- A Text Entry's and an Extended Text's controls carry `autocomplete="off"` in every mode.
