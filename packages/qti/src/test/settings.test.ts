import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option } from "effect";
import { corpusRequested, leaseDatabase } from "#qti/test/settings.ts";

/**
 * Resolve both settings under a provider built from `values`.
 *
 * @param values - The environment the provider reads.
 * @returns The lease database and the corpus flag.
 */
const resolve = (values: Record<string, string>) =>
  Effect.all({ corpusRequested, leaseDatabase }).pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(values))),
  );

describe("test/settings.ts, no database", () => {
  it.effect("an empty environment names no lease and does not request the corpus", () =>
    Effect.gen(function* emptyEnvironment() {
      const resolved = yield* resolve({});

      assert.deepStrictEqual(resolved.leaseDatabase, Option.none());
      assert.strictEqual(resolved.corpusRequested, false);
    }),
  );

  it.effect("a named lease and GR8DES_CORPUS=1 are read", () =>
    Effect.gen(function* namedLease() {
      const resolved = yield* resolve({
        GR8DES_CORPUS: "1",
        GR8DES_PG_DATABASE: "gr8des_qti_x",
      });

      assert.deepStrictEqual(resolved.leaseDatabase, Option.some("gr8des_qti_x"));
      assert.strictEqual(resolved.corpusRequested, true);
    }),
  );
});
