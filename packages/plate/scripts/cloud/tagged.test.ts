import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import type { SpawnSyncReturns } from "node:child_process";
import path from "node:path";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`, new for each run.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `tagged-test-${randomUUID()}`,
);

/**
 * The script under test.
 */
const script = path.resolve(import.meta.dirname, "tagged.mjs");

/**
 * The text every case's tagged tests carry.
 */
const tag = "the cloud tag";

/**
 * The failure of running the script.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class TaggedRunFailed extends Schema.TaggedError<TaggedRunFailed>()("TaggedRunFailed", {
  detail: Schema.String,
}) {}

/**
 * Write a Vitest JSON report holding the given tests.
 *
 * @param name The report's file name under {@link scratch}.
 * @param tests Each test's full name and status.
 * @returns The report's path.
 */
const report = (
  name: string,
  tests: readonly { readonly fullName: string; readonly status: string }[],
): string => {
  mkdirSync(scratch, { recursive: true });

  const file = path.join(scratch, name);

  writeFileSync(file, JSON.stringify({ testResults: [{ assertionResults: tests }] }));

  return file;
};

/**
 * Run the script on a report, resolving with its exit status whatever the status is.
 *
 * @param file The report's path.
 * @returns The exit status and what the script printed.
 */
const run = (file: string): Effect.Effect<SpawnSyncReturns<string>, TaggedRunFailed> =>
  Effect.try({
    catch: (cause) => new TaggedRunFailed({ detail: String(cause) }),
    try: () => spawnSync(process.execPath, [script, file, tag], { encoding: "utf-8" }),
  });

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("tagged.mjs", () => {
  it.effect("exits 0 when every tagged test passed and none failed", () =>
    Effect.gen(function* passed() {
      const result = yield* run(
        report("passed.json", [
          { fullName: `a ${tag} one`, status: "passed" },
          { fullName: "an untagged test", status: "skipped" },
        ]),
      );

      assert.strictEqual(result.status, 0);
      assert.deepStrictEqual(JSON.parse(result.stdout), { failed: 0, skipped: 0, tagged: 1 });
    }),
  );

  it.effect("exits 1 when a tagged test is skipped", () =>
    Effect.gen(function* skipped() {
      const result = yield* run(
        report("skipped.json", [
          { fullName: `a ${tag} one`, status: "passed" },
          { fullName: `a ${tag} two`, status: "skipped" },
        ]),
      );

      assert.strictEqual(result.status, 1);
      assert.deepStrictEqual(JSON.parse(result.stdout), { failed: 0, skipped: 1, tagged: 1 });
    }),
  );

  it.effect("exits 1 when any test failed, tagged or not", () =>
    Effect.gen(function* failed() {
      const result = yield* run(
        report("failed.json", [
          { fullName: `a ${tag} one`, status: "passed" },
          { fullName: "an untagged test", status: "failed" },
        ]),
      );

      assert.strictEqual(result.status, 1);
      assert.deepStrictEqual(JSON.parse(result.stdout), { failed: 1, skipped: 0, tagged: 1 });
    }),
  );
});
