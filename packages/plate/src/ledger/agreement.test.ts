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
  staleRulings,
  verdictColumns,
  verdictsCommit,
  verdictsCopy,
  verdictsSource,
} from "#plate/ledger/agreement.ts";
import type { Disagreement, Finding } from "#plate/ledger/agreement.ts";

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

/**
 * The disagreement a finding row records: its package and both sides, as the row states them.
 *
 * @param row The finding row.
 * @returns The row's disagreement.
 */
const recordedDisagreement = (row: Finding): Disagreement => ({
  file: row.file,
  pantry: row.pantry,
  plate: row.plate,
});

/**
 * Report whether a finding row records a disagreement that is resolved: its sides, as the row now
 * states them, agree. Such a row stays in the file as the record of the difference and of what
 * resolved it, and the run must find its package agreeing.
 *
 * @param row The finding row.
 * @returns Whether the row's sides agree.
 */
const resolved = (row: Finding): boolean => agrees(row.plate, row.pantry);

describe("ledger/agreement.ts", () => {
  it.effect(
    "every disagreement has its finding row, every open finding row is a disagreement, and every resolved row's package agrees",
    () =>
      Effect.gen(function* disagreementsRecorded() {
        const found = yield* disagreements;
        const rows = yield* findings;
        const seen = found.map(keyOf);
        const recorded = rows.filter((row) => !resolved(row)).map(keyOf);

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
        assert.deepStrictEqual(
          rows
            .filter(resolved)
            .map((row) => row.file)
            .filter((file) => found.some((entry) => entry.file === file)),
          [],
          "resolved rows whose package still disagrees",
        );
        assert.strictEqual(
          new Set(rows.map((row) => row.file)).size,
          rows.length,
          "one row per package",
        );
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect("every finding row says what it found", () =>
    Effect.gen(function* findingRows() {
      for (const row of yield* findings) {
        assert.isAbove(row.finding.trim().length, 0, row.file);
      }
    }),
  );

  it.effect(
    "no ruling is stale: each open ruled row still disagrees, in the state its ruling was made on, and a resolved row's ruling records the sides that agree",
    () =>
      Effect.gen(function* rulingsHold() {
        const rows = yield* findings;

        assert.deepStrictEqual(
          staleRulings(
            rows.filter((row) => !resolved(row)),
            yield* disagreements,
          ),
          [],
          "stale rulings",
        );
        for (const row of rows.filter(resolved)) {
          assert.notStrictEqual(row.ruling, "pending", `${row.file}: a resolved row is ruled`);
          if (row.ruling !== "pending") {
            assert.deepStrictEqual(
              { pantry: row.ruling.state.pantry, plate: row.ruling.state.plate },
              { pantry: row.pantry, plate: row.plate },
              `${row.file}: the ruling records the sides that agree`,
            );
          }
        }
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "a ruling is stale once its row's state changes or its row agrees, naming the row",
    () =>
      Effect.gen(function* staleFlagged() {
        const rows = yield* findings;
        const seen = rows.map(recordedDisagreement);
        const row = rows.find((entry) => entry.ruling !== "pending");

        assert.isDefined(row, "the findings file holds a ruled row");
        if (row === undefined || row.ruling === "pending") {
          return;
        }

        assert.deepStrictEqual(staleRulings(rows, seen), [], "the recorded state");

        const changed: Finding = {
          ...row,
          ruling: {
            ...row.ruling,
            state: { ...row.ruling.state, pantry: { ...row.ruling.state.pantry, rule: "changed" } },
          },
        };
        assert.deepStrictEqual(
          staleRulings(
            rows.map((entry) => (entry === row ? changed : entry)),
            seen,
          ),
          [{ file: row.file, reason: "state-changed" }],
        );
        assert.deepStrictEqual(
          staleRulings(
            rows,
            seen.filter((entry) => entry.file !== row.file),
          ),
          [{ file: row.file, reason: "agrees" }],
        );
      }),
  );

  it.effect("a ruling whose recorded commit alone differs from the copy's is not stale", () =>
    Effect.gen(function* commitOnly() {
      const rows = yield* findings;
      const seen = rows.map(recordedDisagreement);
      const recommitted = rows.map((row): Finding =>
        row.ruling === "pending"
          ? row
          : {
              ...row,
              ruling: { ...row.ruling, state: { ...row.ruling.state, commit: "0000000" } },
            },
      );

      assert.isTrue(
        recommitted.some(
          (row) => row.ruling !== "pending" && row.ruling.state.commit !== verdictsCommit,
        ),
        "a ruled row records another commit",
      );
      assert.deepStrictEqual(staleRulings(recommitted, seen), []);
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
    { tags: ["corpus"], timeout: corpusTimeoutMs },
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
