/**
 * The one way the suites print a value in an assertion message: Effect's `Formatter.format`, which
 * renders what `JSON.stringify` throws on or drops. grizzle's outcomes carry bigints (an accepted
 * outcome's counts, a rejected one's witness), and `JSON.stringify` throws "Do not know how to
 * serialize a BigInt" before the assertion it labels runs.
 */
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";

describe("Formatter.format, the assertion messages' one printer", () => {
  it("renders an outcome's bigints, its Options and its Maps, where JSON.stringify throws", () => {
    // Oracle: the rendering as written, and JSON.stringify's own refusal of the same value.
    // Bound: one value holding a bigint at depth, an Option of each case and a Map.
    const outcome = {
      counts: { Node: 3n },
      kind: "accepted",
      reads: new Map([["a", Option.some(1n)]]),
      witness: Option.none(),
    };

    assert.throws(() => {
      JSON.stringify(outcome);
    }, TypeError);
    assert.strictEqual(
      Formatter.format(outcome),
      '{"counts":{"Node":3n},"kind":"accepted","reads":Map([["a",some(1n)]]),"witness":none()}',
    );
  });
});
