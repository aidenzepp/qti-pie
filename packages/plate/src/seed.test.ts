import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { drawInstance, drawSeed } from "#plate/seed.ts";

/**
 * A lowercase UUID v4: 32 hex digits in the 8-4-4-4-12 form, the version nibble 4 and the variant
 * nibble 8 to b.
 */
const uuidV4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u;

/**
 * Run an effect with `crypto.randomUUID` unreachable, as a page on plain HTTP has it (a browser
 * gives it only in a secure context), and make it reachable again afterwards.
 *
 * In Node `randomUUID` lives on `Crypto.prototype`, so deleting it from `globalThis.crypto` would
 * leave it reachable: this defines an own property, `undefined` and configurable, that shadows it,
 * and deletes that property when the effect ends, however it ends.
 *
 * @param effect The effect to run without `randomUUID`.
 * @returns The effect's result.
 */
const withoutRandomUuid = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  Effect.acquireUseRelease(
    Effect.sync(() => {
      Object.defineProperty(globalThis.crypto, "randomUUID", {
        configurable: true,
        value: undefined,
      });
    }),
    () => effect,
    () =>
      Effect.sync(() => {
        Reflect.deleteProperty(globalThis.crypto, "randomUUID");
      }),
  );

describe("drawSeed", () => {
  it("[I-5] gives 32 lowercase hex digits", () => {
    assert.match(drawSeed(), /^[0-9a-f]{32}$/u);
  });

  it("[I-5] gives another seed every call: 100 calls give 100 seeds", () => {
    const seeds = Array.from({ length: 100 }, drawSeed);

    assert.strictEqual(new Set(seeds).size, 100);
  });
});

describe("drawInstance", () => {
  it.effect("gives a lowercase UUID v4 with crypto.randomUUID unreachable", () =>
    withoutRandomUuid(
      Effect.sync(() => {
        assert.throws(() => {
          globalThis.crypto.randomUUID();
        }, TypeError);
        assert.match(drawInstance(), uuidV4);
      }),
    ),
  );

  it.effect(
    "gives another instance every call with crypto.randomUUID unreachable: 100 calls give 100",
    () =>
      withoutRandomUuid(
        Effect.sync(() => {
          const instances = Array.from({ length: 100 }, drawInstance);

          assert.strictEqual(new Set(instances).size, 100);
          for (const instance of instances) {
            assert.match(instance, uuidV4);
          }
        }),
      ),
  );
});
