/**
 * The records: the screen-reader passes, the manual checks and the unavailable readers that the
 * operator's session records (spec §4.9), as typed data the ledger reads.
 *
 * Every entry names the reader and its version, the browser and its version, the macOS version, the
 * item, the JavaScript state, the date, the result and notes, and the owner. An OD-14 (e) entry
 * also holds its control's result, and its type admits `passed` or `failed` only beside
 * `control: "ran"`, and `not-observed` only beside `control: "did-not-run"`, so no entry can record
 * a pass without its control. The list is empty until the session is transcribed (P3-27).
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
   * The item the entry is about: a corpus-relative path, or a walk-corpus document's name.
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
   * The screen reader's name, such as `VoiceOver`.
   */
  reader: Schema.String,
  /**
   * The screen reader's version.
   */
  readerVersion: Schema.String,
};

/**
 * The result of a step that ran: it `passed` or it `failed`.
 */
const ranResult = Schema.Literals(["failed", "passed"]);

/**
 * The Schema of a recorded screen-reader pass over one item, naming the Appendix A interaction IDs
 * the pass covered.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ScreenReaderPass` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const ScreenReaderPass = Schema.Struct({
  ...entryFields,
  interactions: Schema.Array(Schema.String),
  kind: Schema.Literal("screen-reader-pass"),
  result: ranResult,
});

/**
 * A recorded screen-reader pass.
 */
export type ScreenReaderPass = typeof ScreenReaderPass.Type;

/**
 * The Schema of a recorded manual check: the keyboard walk-through of one item, or the OD-14 (e)
 * proof, whose result depends on its control.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ManualCheck` is the Schema and the type of an entry under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const ManualCheck = Schema.Union([
  Schema.Struct({
    ...entryFields,
    check: Schema.Literal("keyboard-walk-through"),
    kind: Schema.Literal("manual-check"),
    result: ranResult,
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
 * The recorded entries, in the order they were recorded. Empty until the operator's session is
 * transcribed (P3-27).
 */
export const passes: readonly PassRecord[] = [];
