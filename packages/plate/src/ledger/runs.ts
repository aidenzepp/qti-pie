/**
 * The browser-run record: which engines a run of the browser tests (`test:browser`) ran in, each
 * with the version it reported, beside Playwright's version and the run's date, as typed data the
 * ledger reads.
 *
 * The browser run's setup (`src/test/browser-setup.ts`) writes the record to
 * {@link browserRunFile} in the ledger's folder. WebKit stands in for Safari until `safaridriver`
 * is enabled, and a WebKit entry's type requires `standsInFor: "Safari"`, while a Chromium entry's
 * refuses it, so no record can show WebKit without saying it stands in, as `passes.ts` ties an
 * OD-14 (e) result to its control.
 *
 * @module
 */
import { Schema } from "effect";

/**
 * An ISO 8601 date, `YYYY-MM-DD`, optionally followed by a time and a zone, such as
 * `2026-11-05T14:30:00Z`: the date of a browser-run record here, and of each record `passes.ts`
 * holds.
 */
export const isoDate = Schema.String.check(
  Schema.isPattern(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:T[0-9]{2}:[0-9]{2}(?::[0-9]{2}(?:\.[0-9]+)?)?(?:Z|[+-][0-9]{2}:[0-9]{2})?)?$/u,
  ),
);

/**
 * The sentence the ledger shows beside a WebKit run: what WebKit's results stand for, and until
 * when.
 */
export const standsInForSafari = "WebKit stands in for Safari until safaridriver";

/**
 * The name of the record's file in the ledger's folder.
 */
export const browserRunFile = "browser-run.json";

/**
 * The Schema of one engine's entry: Chromium's, which never stands in for another browser, or
 * WebKit's, which stands in for Safari and says so.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `EngineRun` is the Schema and the type of an entry under one name, as `passes.ts`'s records are, so a decoder and a signature read as one thing.
export const EngineRun = Schema.Union([
  Schema.Struct({
    engine: Schema.Literal("chromium"),
    /**
     * Never present: Chromium stands in for no other browser.
     */
    standsInFor: Schema.optionalKey(Schema.Never),
    /**
     * The version the launched browser reported, `browser.version()`.
     */
    version: Schema.String,
  }),
  Schema.Struct({
    engine: Schema.Literal("webkit"),
    /**
     * The browser WebKit's results stand for: {@link standsInForSafari}.
     */
    standsInFor: Schema.Literal("Safari"),
    /**
     * The version the launched browser reported, `browser.version()`.
     */
    version: Schema.String,
  }),
]);

/**
 * One engine's entry in a browser-run record.
 */
export type EngineRun = typeof EngineRun.Type;

/**
 * The Schema of the record of one browser run.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `BrowserRun` is the Schema and the type of a record under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const BrowserRun = Schema.Struct({
  /**
   * When the run started, ISO 8601.
   */
  date: isoDate,
  /**
   * Each engine the run launched, in the order it launched them.
   */
  engines: Schema.Array(EngineRun),
  /**
   * The version of `playwright-core` that drove the engines.
   */
  playwright: Schema.String,
});

/**
 * The record of one browser run.
 */
export type BrowserRun = typeof BrowserRun.Type;
