import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, PlatformError, Record as Rec, Result } from "effect";
import { BadPackageId, requirePackage, requirePackageId } from "#pantry/cli/args.ts";
import { NotADirectory } from "#pantry/cli/errors.ts";

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

/**
 * Every reason a file system call fails with, each once, so the guard below is checked over all of
 * them.
 */
const systemReasons = Rec.keys({
  AlreadyExists: null,
  BadResource: null,
  Busy: null,
  InvalidData: null,
  NotFound: null,
  PermissionDenied: null,
  TimedOut: null,
  UnexpectedEof: null,
  Unknown: null,
  WouldBlock: null,
  WriteZero: null,
} satisfies Record<PlatformError.SystemErrorTag, null>);

describe("requirePackage", () => {
  it.effect(
    "refuses a path that is not there as NotADirectory, and passes every other failure to read it through as itself",
    () =>
      Effect.gen(function* everyReason() {
        for (const reason of systemReasons) {
          const failure = PlatformError.systemError({
            _tag: reason,
            method: "stat",
            module: "FileSystem",
            pathOrDescriptor: "package",
          });
          const result = yield* Effect.result(
            requirePackage("package").pipe(
              Effect.provide(FileSystem.layerNoop({ stat: () => Effect.fail(failure) })),
            ),
          );

          assert.isTrue(Result.isFailure(result), reason);
          if (Result.isSuccess(result)) {
            return;
          }

          if (reason === "NotFound") {
            assert.instanceOf(result.failure, NotADirectory, reason);
          } else {
            assert.strictEqual(result.failure, failure, reason);
          }
        }
      }),
  );
});
