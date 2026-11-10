/**
 * The session item the session tests share: one builder that fills every required field of a
 * {@link SessionItem} with a default, so a test names only the fields it is about, and a new
 * required field of `SessionItem` is added here, once, with its default.
 *
 * `src/dev/store.test.ts`, `src/effect/schemas.test.ts` and `src/engine/outcome.test.ts` call it.
 * `src/results/results.test.ts` and `src/codec/session.test.ts` still spell the item by hand, so a
 * new required field is added to their literals until they call it too.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import { Option } from "effect";
import { fresh } from "#plate/model/record.ts";
import type { SessionItem } from "#plate/session/session.ts";
import { bg007Item } from "#plate/test/fixtures.ts";

/**
 * Construct a session item from its defaults and the fields given; a given field wins.
 *
 * The defaults are `adaptive` false, `datestamp` `"2026-11-05T10:00:00.000Z"`, `duration` 0,
 * `firstOutcomes` none, `locked` false, `presented` false, `record` `fresh(bg007Item, "s1.1")` (the
 * item of a session whose instance is `s1`, at sequence index 1), `saved` none, `sequenceIndex` 1
 * and `templateDefaults` none. Every default is a literal, so the same call builds an equal item
 * each time.
 *
 * `ref` follows the record unless given: it is the `item` of the record in force, the one given
 * when `record` is, and the identifier of `bg007Item`, `beginnersguide007`, otherwise. A test whose
 * session `decodeSession` checks against a test passes the `ref` the test's item ref carries.
 *
 * @param overrides The fields that differ from the defaults.
 * @returns The session item.
 */
export const sessionItem = (overrides: Partial<SessionItem> = {}): SessionItem => {
  const record = overrides.record ?? fresh(bg007Item, "s1.1");

  return {
    adaptive: false,
    datestamp: "2026-11-05T10:00:00.000Z",
    duration: 0,
    firstOutcomes: Option.none(),
    locked: false,
    presented: false,
    record,
    ref: record.item,
    saved: Option.none(),
    sequenceIndex: 1,
    templateDefaults: Option.none(),
    ...overrides,
  };
};
