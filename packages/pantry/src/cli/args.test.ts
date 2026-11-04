import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { BadPackageId, requirePackageId } from "#pantry/cli/args.ts";

describe("requirePackageId", () => {
  it.effect("refuses text that is not a UUID with BadPackageId", () =>
    Effect.gen(function* refuses() {
      const result = yield* Effect.result(requirePackageId("not-a-uuid"));

      assert.isTrue(Result.isFailure(result));
      if (Result.isSuccess(result)) {
        return;
      }

      assert.instanceOf(result.failure, BadPackageId);
      assert.strictEqual(result.failure._tag, "BadPackageId");
      assert.strictEqual(result.failure.packageId, "not-a-uuid");
    }),
  );

  it.effect("returns a UUID as the same value", () =>
    Effect.gen(function* accepts() {
      const text = "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40";
      const id = yield* requirePackageId(text);

      assert.strictEqual(id, text);
    }),
  );
});
