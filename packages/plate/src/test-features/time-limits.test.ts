import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { TestSession } from "#plate/session/session.ts";
import type { AdditionalTestingTime } from "#plate/supports.ts";
import { extendedMaxTime, pauseTime, resumeTime } from "#plate/test-features/time-limits.ts";

/**
 * A test session with no items, as the hooks take one: none of its fields matters to a stub.
 */
const session: TestSession = {
  document: "tests/t.xml",
  instance: "sitting",
  items: [],
  kind: "test",
  outcomeRuns: 0,
  outcomes: {},
  parts: [],
  position: 0,
  seed: "seed",
  shuffleSeed: Option.none(),
  started: "1970-01-01T00:00:00.000Z",
  status: "interacting",
  test: "t",
  updated: "1970-01-01T00:00:00.000Z",
};

/**
 * Each kind of additional testing time a candidate may be allowed.
 */
const extensions: readonly AdditionalTestingTime[] = [
  { factor: 1.5, kind: "multiplier" },
  { kind: "minutes", minutes: 10 },
  { kind: "unlimited" },
];

describe("the time-limits stub's hooks for m4-03 and m4-08", () => {
  it("extendedMaxTime gives the max-time unextended, with or without additional testing time", () => {
    assert.deepStrictEqual(extendedMaxTime(600, Option.none()), Option.some(600));
    for (const extension of extensions) {
      assert.deepStrictEqual(
        extendedMaxTime(600, Option.some(extension)),
        Option.some(600),
        extension.kind,
      );
    }
  });

  it("pauseTime and resumeTime give the session back unchanged", () => {
    const at = new Date(100_000);

    assert.strictEqual(pauseTime(session, at), session);
    assert.strictEqual(resumeTime(session, at), session);
  });
});
