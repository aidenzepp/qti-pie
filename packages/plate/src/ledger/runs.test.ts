import { assert, describe, it } from "@effect/vitest";
import { Result, Schema } from "effect";
import { BrowserRun, standsInForSafari } from "#plate/ledger/runs.ts";

/**
 * An engine entry as a record's file may hold it, before `BrowserRun` checks it.
 */
interface RawEntry {
  readonly engine: string;
  readonly standsInFor?: string;
  readonly version: string;
}

/**
 * A Chromium entry as the browser run's setup writes it.
 */
const chromiumEntry = { engine: "chromium", version: "149.0.7795.2" } as const;

/**
 * A WebKit entry as the browser run's setup writes it, marked as standing in for Safari.
 */
const webkitEntry = { engine: "webkit", standsInFor: "Safari", version: "26.4" } as const;

/**
 * Decode a record of one browser run with the given engine entries.
 *
 * @param engines The entries.
 * @returns The decoded record, or the decoder's failure.
 */
const decodeRun = (engines: readonly RawEntry[]) =>
  Schema.decodeUnknownResult(BrowserRun)({
    date: "2026-11-05T18:38:05.000Z",
    engines,
    playwright: "1.64.1",
  });

describe("BrowserRun", () => {
  it("decodes a record with both engines, WebKit's entry standing in for Safari", () => {
    const decoded = decodeRun([chromiumEntry, webkitEntry]);

    assert.isTrue(Result.isSuccess(decoded));
    assert.deepStrictEqual(Result.getOrUndefined(decoded)?.engines, [chromiumEntry, webkitEntry]);
  });

  it("refuses a WebKit entry without standsInFor", () => {
    assert.isTrue(
      Result.isFailure(decodeRun([chromiumEntry, { engine: "webkit", version: "26.4" }])),
    );
  });

  it("refuses a Chromium entry with standsInFor", () => {
    assert.isTrue(
      Result.isFailure(decodeRun([{ ...chromiumEntry, standsInFor: "Safari" }, webkitEntry])),
    );
  });

  it("names WebKit's stand-in in the sentence the ledger shows", () => {
    assert.strictEqual(standsInForSafari, "WebKit stands in for Safari until safaridriver");
  });
});
