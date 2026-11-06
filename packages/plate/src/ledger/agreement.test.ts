import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import {
  agrees,
  corpusZips,
  disagreements,
  findings,
  pantryVerdicts,
  readVerdicts,
  verdictColumns,
  verdictsCommit,
  verdictsCopy,
  verdictsSource,
} from "#plate/ledger/agreement.ts";
import type { Disagreement } from "#plate/ledger/agreement.ts";

/**
 * Opening the 28 packages runs in under a second here; the bound leaves room for a slow machine
 * without letting a hung run stall the suite.
 */
const corpusTimeoutMs = 120_000;

/**
 * The package directory, which `git` runs in.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The bytes of a file at a commit, as `git show <commit>:<path>` prints them.
 *
 * @param commit The commit.
 * @param file The file, as a path from the repository's root.
 * @returns The file's bytes at that commit.
 */
const committedBytes = (commit: string, file: string) =>
  Effect.try(
    () =>
      new Uint8Array(execFileSync("git", ["show", `${commit}:${file}`], { cwd: packageDirectory })),
  );

/**
 * The facts of a disagreement or a finding that the two are compared by, as one string: the file,
 * both verdicts and both rules.
 *
 * @param entry The disagreement or finding.
 * @returns Its key.
 */
const keyOf = (entry: Disagreement): string =>
  JSON.stringify([
    entry.file,
    entry.plate.verdict,
    entry.plate.rules,
    entry.pantry.verdict,
    entry.pantry.rule,
  ]);

describe("ledger/agreement.ts", () => {
  it.effect(
    "every disagreement has its finding row, and every finding row is a disagreement",
    () =>
      Effect.gen(function* disagreementsRecorded() {
        const seen = (yield* disagreements).map(keyOf);
        const recorded = (yield* findings).map(keyOf);

        assert.deepStrictEqual(
          seen.filter((key) => !recorded.includes(key)),
          [],
          "disagreements with no finding row",
        );
        assert.deepStrictEqual(
          recorded.filter((key) => !seen.includes(key)),
          [],
          "finding rows with no disagreement",
        );
        assert.strictEqual(new Set(recorded).size, recorded.length, "one row per disagreement");
      }),
    corpusTimeoutMs,
  );

  it.effect("every finding row says what it found and carries a ruling", () =>
    Effect.gen(function* findingRows() {
      for (const row of yield* findings) {
        assert.isAbove(row.finding.trim().length, 0, row.file);
        assert.include(["pending"], row.ruling, row.file);
      }
    }),
  );

  it.effect("the copy's header row is the verdict file's columns", () =>
    Effect.gen(function* copyHeader() {
      const { header, rows } = yield* pantryVerdicts;

      assert.deepStrictEqual(header, [...verdictColumns]);
      assert.isAbove(rows.length, 0);
    }),
  );

  it.effect(
    "the copy is byte-equal to pantry's verdict file at the commit agreement.ts names",
    () =>
      Effect.gen(function* copyCommit() {
        const copy = yield* Effect.tryPromise(() => readFile(verdictsCopy));
        const committed = yield* committedBytes(verdictsCommit, verdictsSource);

        assert.match(verdictsCommit, /^[0-9a-f]{7,40}$/u);
        assert.deepStrictEqual(new Uint8Array(copy), committed);
      }),
  );

  it.effect(
    "the copy has one row for each corpus zip outside the QTI 2.2 examples",
    () =>
      Effect.gen(function* oneRowPerZip() {
        const { rows } = yield* pantryVerdicts;

        assert.deepStrictEqual(rows.map((row) => row.file).toSorted(), yield* corpusZips);
      }),
    corpusTimeoutMs,
  );

  it.effect("a row that lacks a column the reader names fails to decode", () =>
    Effect.gen(function* missingColumn() {
      const exit = yield* Effect.exit(readVerdicts("file\tverdict\na.zip\taccepted\n"));

      assert.isTrue(Exit.isFailure(exit));
    }),
  );

  it("plate agrees when it accepts what pantry accepts or refuses what pantry refuses", () => {
    const accepted = { rule: "", verdict: "accepted" } as const;
    const refused = { rule: "not-qti3", verdict: "refused" } as const;

    assert.isTrue(agrees({ rules: [], verdict: "accepted" }, accepted));
    assert.isTrue(agrees({ rules: [], verdict: "accepted-with-unsupported" }, accepted));
    assert.isTrue(agrees({ rules: ["resource-type-mismatch"], verdict: "refused" }, refused));
    assert.isFalse(agrees({ rules: [], verdict: "accepted" }, refused));
    assert.isFalse(agrees({ rules: ["child-count"], verdict: "refused" }, accepted));
    assert.isFalse(agrees({ rules: [], verdict: "unchecked" }, accepted));
    assert.isFalse(agrees({ rules: [], verdict: "unchecked" }, refused));
  });
});
