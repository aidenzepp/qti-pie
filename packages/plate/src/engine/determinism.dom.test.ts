/**
 * Criterion 7 in Chromium's and WebKit's pages: the hand-built fixture of
 * `src/test/determinism.ts`, under its fixed seed and instance, gives the template values, HTML and
 * outcomes Node pinned, on every run, its test's outcome processing gives the outcomes Node
 * pinned for runs 1 and 2, and its item ref's template defaults give the defaults and template
 * values Node pinned (`GOAL.md` criterion 7; Node's half is `determinism.test.ts`).
 *
 * The fixture runs through the browser entries only: `firstAttempt` starts the record, `redactItem`
 * and `render` write its HTML, `runAttempt` scores the attempt, `runOutcomes` runs the test's
 * outcome processing over its scope, and `evaluateTemplateDefaults` evaluates the item ref's
 * defaults, which `firstAttempt` starts its item from. Never `begin`, `score` or `restore`, the
 * Schema side a page does not load. Every pinned value is drawn from the HMAC-SHA-256 stream keyed
 * by the seed (`src/engine/sha256.ts`) and `S` is plate's FDLIBM `sin`, so an equal value here is
 * also the engine's check of SHA-256, HMAC-SHA-256 and the Math port. A value that differs from
 * Node's is a finding, never configured around (rule `c8a113fd`).
 *
 * It runs only inside the engine's page, under Vitest's browser mode in the in-page project of
 * `vite.browser.config.ts` (`test:browser`). Every case sits under a `describe` named by the engine
 * (`server.browser`), so each result's first ancestor title names the engine.
 */
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { server } from "vite-plus/test/browser/context";
import {
  observe,
  observeDefaults,
  observeOutcomes,
  otherSeed,
  pinned,
  pinnedDefaultDraws,
  pinnedOutcomeDraws,
  startRecord,
} from "#plate/test/determinism.ts";

/**
 * The runs each fresh record is driven through.
 */
const runs = [1, 2, 3] as const;

describe(server.browser, () => {
  it("[I-5] firstAttempt starts the pinned template values", () => {
    assert.deepStrictEqual(Result.getOrThrow(startRecord()).templates, pinned.templates);
  });

  it("[I-5] redactItem and render write the pinned HTML", () => {
    assert.strictEqual(
      Result.getOrThrow(observe(Result.getOrThrow(startRecord()))).html,
      pinned.html,
    );
  });

  it("[I-5] runAttempt gives the pinned outcomes", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(observe(Result.getOrThrow(startRecord()))).outcomes,
      pinned.outcomes,
    );
  });

  it("[I-5] gives the pinned template values, HTML and outcomes on three runs from each of two fresh records", () => {
    const records = [Result.getOrThrow(startRecord()), Result.getOrThrow(startRecord())] as const;

    assert.notStrictEqual(records[0], records[1]);

    for (const [index, record] of records.entries()) {
      for (const run of runs) {
        assert.deepStrictEqual(
          Result.getOrThrow(observe(record)),
          pinned,
          `record ${index + 1}, run ${run}`,
        );
      }
    }
  });

  it("[I-5] gives other template values, and other HTML, under another seed", () => {
    const other = Result.getOrThrow(startRecord(otherSeed));

    for (const drawn of ["N", "X", "S", "M"]) {
      assert.notDeepEqual(other.templates[drawn], pinned.templates[drawn], drawn);
    }

    assert.notStrictEqual(Result.getOrThrow(observe(other)).html, pinned.html);
  });

  it("runOutcomes gives the pinned outcome draws of runs 1 and 2 on two fresh starts", () => {
    const starts = [
      Result.getOrThrow(observeOutcomes()),
      Result.getOrThrow(observeOutcomes()),
    ] as const;

    assert.notStrictEqual(starts[0], starts[1]);

    for (const [index, start] of starts.entries()) {
      assert.deepStrictEqual(start, pinnedOutcomeDraws, `start ${index + 1}`);
    }
  });

  it("runOutcomes gives other outcome draws under another seed", () => {
    const other = Result.getOrThrow(observeOutcomes(otherSeed));

    for (const [index, outcomes] of other.entries()) {
      for (const drawn of ["DRAWN", "BONUS"]) {
        assert.notDeepEqual(
          outcomes[drawn],
          pinnedOutcomeDraws[index]?.[drawn],
          `run ${index + 1}, ${drawn}`,
        );
      }
    }
  });

  it("evaluateTemplateDefaults and firstAttempt give the pinned template default draws, and the template values from them, on two fresh starts", () => {
    const starts = [
      Result.getOrThrow(observeDefaults()),
      Result.getOrThrow(observeDefaults()),
    ] as const;

    assert.notStrictEqual(starts[0], starts[1]);

    for (const [index, start] of starts.entries()) {
      assert.deepStrictEqual(start, pinnedDefaultDraws, `start ${index + 1}`);
    }
  });

  it("evaluateTemplateDefaults and firstAttempt give other template default draws, and other template values, under another seed", () => {
    const other = Result.getOrThrow(observeDefaults(otherSeed));

    for (const drawn of ["LOW", "HIGH"]) {
      assert.notDeepEqual(other.defaults[drawn], pinnedDefaultDraws.defaults[drawn], drawn);
    }

    for (const drawn of ["LOW", "HIGH", "PICK", "SPAN"]) {
      assert.notDeepEqual(other.templates[drawn], pinnedDefaultDraws.templates[drawn], drawn);
    }
  });
});
