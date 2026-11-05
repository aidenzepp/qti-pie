/**
 * The records: the screen-reader passes, the manual checks and the unavailable readers that the
 * operator's sittings record (spec §4.9), with notes on each sitting, as typed data the ledger
 * reads.
 *
 * Every entry names the reader and its version, the browser and its version, the macOS version, the
 * item, the JavaScript state, the date, the result and notes, and the owner. A check a sitting has
 * not run yet stays in the record as an open entry, `not-observed`, until a later sitting runs it.
 * An OD-14 (e) entry also holds its control's result, and its type admits `passed` or `failed` only
 * beside `control: "ran"`, and `not-observed` only beside `control: "did-not-run"`, so no entry can
 * record a pass without its control.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * An ISO 8601 date, `YYYY-MM-DD`, optionally followed by a time and a zone, such as
 * `2026-11-05T14:30:00Z`.
 */
const isoDate = Schema.String.check(
  Schema.isPattern(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:T[0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?(?:Z|[+-][0-9]{2}:[0-9]{2})?)?$/u,
  ),
);

/**
 * The fields every entry holds, whatever its kind.
 */
const entryFields = {
  /**
   * The browser's name, such as `Safari`.
   */
  browser: Schema.String,
  /**
   * The browser's version.
   */
  browserVersion: Schema.String,
  /**
   * When the entry was recorded, ISO 8601.
   */
  date: isoDate,
  /**
   * The item the entry is about: a corpus-relative path, or a walk-corpus document's path under the
   * walk directory. The M1 walk-through, which runs over every document, names `dev playground`; an
   * unavailable reader, which runs over none, names `none`.
   */
  item: Schema.String,
  /**
   * Whether the page ran with JavaScript `on` or `off`.
   */
  javascript: Schema.Literals(["off", "on"]),
  /**
   * The macOS version.
   */
  macosVersion: Schema.String,
  /**
   * What the operator noted, in words.
   */
  notes: Schema.String,
  /**
   * Who recorded the entry.
   */
  owner: Schema.String,
  /**
   * The screen reader's name, such as `VoiceOver`, or `none` for a check run without one.
   */
  reader: Schema.String,
  /**
   * The screen reader's version, or `none` when there is no reader or no version to name.
   */
  readerVersion: Schema.String,
};

/**
 * The result of a step that ran: it `passed` or it `failed`.
 */
const ranResult = Schema.Literals(["failed", "passed"]);

/**
 * The result of a step a sitting may leave for a later one: it `passed` or `failed`, or it is
 * `not-observed`, an open entry the ledger never counts as a pass.
 */
const openResult = Schema.Literals(["failed", "not-observed", "passed"]);

/**
 * The Schema of a recorded screen-reader pass over one item, naming the Appendix A interaction IDs
 * the pass covered, or the IDs it is to cover when it is still open.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ScreenReaderPass` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const ScreenReaderPass = Schema.Struct({
  ...entryFields,
  interactions: Schema.Array(Schema.String),
  kind: Schema.Literal("screen-reader-pass"),
  result: openResult,
});

/**
 * A recorded screen-reader pass.
 */
export type ScreenReaderPass = typeof ScreenReaderPass.Type;

/**
 * The Schema of a recorded manual check: the keyboard walk-through of one item, the M1
 * walk-through in the dev playground, or the OD-14 (e) proof, whose result depends on its control.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ManualCheck` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const ManualCheck = Schema.Union([
  Schema.Struct({
    ...entryFields,
    check: Schema.Literal("keyboard-walk-through"),
    kind: Schema.Literal("manual-check"),
    result: openResult,
  }),
  Schema.Struct({
    ...entryFields,
    check: Schema.Literal("M1 walk-through"),
    kind: Schema.Literal("manual-check"),
    result: openResult,
  }),
  Schema.Struct({
    ...entryFields,
    check: Schema.Literal("OD-14 (e)"),
    control: Schema.Literal("ran"),
    kind: Schema.Literal("manual-check"),
    result: ranResult,
  }),
  Schema.Struct({
    ...entryFields,
    check: Schema.Literal("OD-14 (e)"),
    control: Schema.Literal("did-not-run"),
    kind: Schema.Literal("manual-check"),
    result: Schema.Literal("not-observed"),
  }),
]);

/**
 * A recorded manual check.
 */
export type ManualCheck = typeof ManualCheck.Type;

/**
 * The Schema of a reader recorded as unavailable on the machine, such as NVDA or JAWS on macOS.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `UnavailableReader` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const UnavailableReader = Schema.Struct({
  ...entryFields,
  kind: Schema.Literal("unavailable-reader"),
  result: Schema.Literal("unavailable"),
});

/**
 * A reader recorded as unavailable.
 */
export type UnavailableReader = typeof UnavailableReader.Type;

/**
 * The Schema of any recorded entry.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `PassRecord` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const PassRecord = Schema.Union([ScreenReaderPass, ManualCheck, UnavailableReader]);

/**
 * Any recorded entry.
 */
export type PassRecord = typeof PassRecord.Type;

/**
 * The Schema of a note on one sitting as a whole, rather than on one entry.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `SessionNote` is the Schema and the type of a note under one name, as the entries' Schemas are, so a decoder and a signature read as one thing.
export const SessionNote = Schema.Struct({
  /**
   * The sitting's date, ISO 8601.
   */
  date: isoDate,
  /**
   * Who recorded the note.
   */
  owner: Schema.String,
  /**
   * What the operator noted, in words.
   */
  text: Schema.String,
});

/**
 * A note on one sitting.
 */
export type SessionNote = typeof SessionNote.Type;

/**
 * The fields every entry of the first sitting (2026-11-05) shares: Safari and VoiceOver on this
 * Mac, with JavaScript on throughout, as the operator ran it.
 */
const firstSitting = {
  browser: "Safari",
  browserVersion: "27.2",
  date: "2026-11-05",
  javascript: "on",
  macosVersion: "27.2 (26B123)",
  owner: "operator",
  reader: "VoiceOver",
  readerVersion: "as shipped with macOS 27.2",
} as const;

/**
 * The note on each check the first sitting left open.
 */
const notRun = "not run in the first sitting (2026-11-05)";

/**
 * The reader fields of a manual check, which runs without a screen reader.
 */
const noReader = { reader: "none", readerVersion: "none" } as const;

/**
 * The step-1 items, with the Appendix A interaction each one shows: BG007 (Choice), BG010 (Text
 * Entry), BG011 (Extended Text), a shuffled Choice with a phrasing Prompt, the walk corpus's
 * `pattern-mask` Text Entry, the `xhtml` item Item_QTI3_WritingPostcard_02 and the walk corpus's
 * container essay (`ordered`).
 */
const stepOneItems = {
  bg007: { interactions: ["Q-2"], item: "QTI3_BPIG_Examples/items/BG007.xml" },
  bg010: { interactions: ["Q-20"], item: "QTI3_BPIG_Examples/items/BG010.xml" },
  bg011: { interactions: ["Q-5"], item: "QTI3_BeginnersGuide_Examples/items/BG011.xml" },
  ordered: { interactions: ["Q-5"], item: "ordered.xml" },
  pattern: { interactions: ["Q-20"], item: "pattern.xml" },
  postcard: {
    interactions: ["Q-5"],
    item: "qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml",
  },
  shuffled: { interactions: ["Q-2"], item: "qtiv3-examples/packaging/items/choice_fixed.xml" },
} as const;

/**
 * The step-1 items in the order the session lists them.
 */
const stepOne = [
  stepOneItems.bg007,
  stepOneItems.bg010,
  stepOneItems.bg011,
  stepOneItems.shuffled,
  stepOneItems.pattern,
  stepOneItems.postcard,
  stepOneItems.ordered,
] as const;

/**
 * The walk corpus's derived `pattern-mask` probes step 2 adds, one for each distinct pattern the
 * corpus uses: `([0-9.\-]{0,10})`, `([0-9.]{0,6})` and `[0-9\.]+`.
 */
const derivedProbes = [
  "derived/QTI3_BPIG_Examples/items/Example03-feedbackBlock-solution/RESPONSE.xml",
  "derived/qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_RichardTake3_01/text_entry_qti3/RESPONSE10.xml",
  "derived/qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip.d/Items/Item_QTI3_RichardTake3_01/text_entry_qti3/RESPONSE10.xml",
] as const;

/**
 * The recorded entries, in the order they were recorded.
 *
 * The first sitting (2026-11-05) ran step 1 in part, with JavaScript on: BG007, BG010 and BG011
 * under VoiceOver, and BG011's submit. Every other check of the session (the other four step-1
 * items, all of step 2, step 3's OD-14 (e) proof and the M1 walk-through) is an open entry,
 * `not-observed`. NVDA and JAWS are unavailable on this machine.
 */
export const passes: readonly PassRecord[] = [
  {
    ...firstSitting,
    ...stepOneItems.bg007,
    kind: "screen-reader-pass",
    notes:
      'Passed for control name, role and n of N. VoiceOver read: "False, radio button, 2 of 2, list 2 items". Group name not reported.',
    result: "passed",
  },
  {
    ...firstSitting,
    ...stepOneItems.bg010,
    kind: "screen-reader-pass",
    notes:
      'Role passed. Note: the accessible name is the generic "Answer" ("Answer, edit text"), not the question text. Decide whether that is acceptable when the group carries the question.',
    result: "passed",
  },
  {
    ...firstSitting,
    ...stepOneItems.bg011,
    kind: "screen-reader-pass",
    notes: 'Role passed. Same note as BG010: "Answer, text entry area".',
    result: "passed",
  },
  {
    ...firstSitting,
    ...stepOneItems.bg011,
    kind: "screen-reader-pass",
    notes:
      'BG011 submit, Status region: FAILED in practice. The "response recorded" status is read, but only after VoiceOver re-reads the whole page from the top, because the submit reloads the page. A screen-reader user hears the result last, not first.',
    result: "failed",
  },
  ...stepOne.slice(3).map((item): PassRecord => ({
    ...firstSitting,
    ...item,
    kind: "screen-reader-pass",
    notes: notRun,
    result: "not-observed",
  })),
  ...[...stepOne.map(({ item }) => item), ...derivedProbes].map((item): PassRecord => ({
    ...firstSitting,
    ...noReader,
    check: "keyboard-walk-through",
    item,
    kind: "manual-check",
    notes: notRun,
    result: "not-observed",
  })),
  {
    ...firstSitting,
    ...noReader,
    check: "OD-14 (e)",
    control: "did-not-run",
    item: "od14/od14-probe.xml",
    kind: "manual-check",
    notes: notRun,
    result: "not-observed",
  },
  {
    ...firstSitting,
    ...noReader,
    check: "M1 walk-through",
    item: "dev playground",
    kind: "manual-check",
    notes: notRun,
    result: "not-observed",
  },
  ...["NVDA", "JAWS"].map((reader): PassRecord => ({
    ...firstSitting,
    item: "none",
    kind: "unavailable-reader",
    notes: "Unavailable on this machine.",
    reader,
    readerVersion: "none",
    result: "unavailable",
  })),
];

/**
 * The notes on each sitting, in the order they were recorded: what the operator noted about a
 * sitting as a whole rather than about one entry.
 */
export const sessionNotes: readonly SessionNote[] = [
  {
    date: "2026-11-05",
    owner: "operator",
    text: "Partial session, step 1 only (relayed by the overseer). JavaScript was left ON: the operator could not find Disable JavaScript, so treat every line as JS on. Served from merge-phase-3 with pnpm --filter @qti-pie/plate serve.",
  },
  {
    date: "2026-11-05",
    owner: "operator",
    text: 'Odd: near Submit and the Theme heading, VoiceOver read a group as "play, and 3 more items, and 1 more item, group". The name looks truncated or unlabeled. Probably playground chrome, but check it.',
  },
  {
    date: "2026-11-05",
    owner: "operator",
    text: "Not observed: refused-submit messages, group names, the other four step-1 items, all of step 2 (keyboard only), step 3 (OD-14 sandbox proof) and the M1 walk-through. The operator will do the rest in a later sitting.",
  },
];
