import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { scaleOf, timingScale } from "#plate/test/timing.ts";

/**
 * Read the scale a given environment gives.
 *
 * @param env The environment, as a provider reads it.
 * @returns The scale, or the `ConfigError` the environment gives.
 */
const read = (env: Record<string, string>) =>
  scaleOf.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))));

describe("the timing scale", () => {
  it.effect("is 1 when PLATE_TIMING_SCALE is unset", () =>
    Effect.gen(function* unset() {
      assert.strictEqual(yield* read({}), 1);
    }),
  );

  it.effect("is the number PLATE_TIMING_SCALE names", () =>
    Effect.gen(function* named() {
      assert.strictEqual(yield* read({ PLATE_TIMING_SCALE: "3" }), 3);
      assert.strictEqual(yield* read({ PLATE_TIMING_SCALE: "1.5" }), 1.5);
    }),
  );

  it.effect("fails for a value that is not a positive number", () =>
    Effect.gen(function* refused() {
      for (const value of ["0", "-2", "x", "Infinity"]) {
        const error = yield* Effect.flip(read({ PLATE_TIMING_SCALE: value }));

        assert.strictEqual(error._tag, "ConfigError", value);
      }
    }),
  );

  it.effect("triples a bound at 3 and leaves it at 1", () =>
    Effect.gen(function* scaled() {
      const three = yield* read({ PLATE_TIMING_SCALE: "3" });

      assert.strictEqual(100 * three, 300);
      assert.strictEqual(100 * (yield* read({})), 100);
    }),
  );

  it("timingScale reads the host environment, 1 unless a runner sets it", () => {
    assert.isTrue(timingScale() > 0);
  });
});
