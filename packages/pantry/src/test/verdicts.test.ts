/**
 * The verdict file's machinery, checked as properties against the file's format as AGENTS.md
 * states it: TSV with LF line ends, the header `file`, `verdict`, `rule`, one row per corpus zip
 * sorted by `file` in UTF-16 code-unit order, `rule` empty exactly when the row is accepted and
 * otherwise a rule of the importer's roster.
 */
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import type { Oracle } from "@grizzle/testing/explore";
import { noCoverage, required } from "@grizzle/testing/features";
import type { Coverage } from "@grizzle/testing/features";
import { array, element, int, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { ImportRule } from "#pantry/import/refusal.ts";
import { parseVerdicts, renderVerdicts, verdictsPath } from "#pantry/test/verdicts.ts";
import type { VerdictRow } from "#pantry/test/verdicts.ts";

const HEADER = "file\tverdict\trule";

const caseHang = Duration.seconds(10);

/**
 * The letters a member path is drawn from: a few that sort differently by code unit than by
 * case-folded or locale order (`B` before `a`, `é` after `z`), the path separator and a dot.
 */
const pathLetter = element(["a", "B", "z", "é", "/", ".", "_"] as const);

/**
 * A row of the format: a member path of one to eight letters, made distinct by its index, and a
 * verdict whose rule is empty when accepted and a roster rule when refused.
 */
const rowOf =
  (index: number): Gen<VerdictRow> =>
  (source) => {
    const file = `${source.draw(string(pathLetter, { max: 8, min: 1 }))}-${index}.zip`;

    return source.draw(element(["accepted", "refused"] as const)) === "accepted"
      ? { file, rule: "", verdict: "accepted" }
      : { file, rule: source.draw(element(ImportRule.literals)), verdict: "refused" };
  };

/**
 * Between `min` and six distinct rows, in drawn order, unsorted.
 */
const rowsOf =
  (min: number): Gen<readonly VerdictRow[]> =>
  (source) =>
    Array.from({ length: source.draw(int(min, 6)) }, (_, index) => source.draw(rowOf(index)));

const byFile = (left: VerdictRow, right: VerdictRow): number => {
  if (left.file === right.file) {
    return 0;
  }

  return left.file < right.file ? -1 : 1;
};

/**
 * The format's text for rows, written from the format's statement, not from `verdicts.ts`.
 */
const formatted = (rows: readonly VerdictRow[]): string =>
  [HEADER, ...rows.toSorted(byFile).map((row) => [row.file, row.verdict, row.rule].join("\t"))]
    .map((line) => `${line}\n`)
    .join("");

/**
 * The named ways a row breaks the format, and `valid`, the floor.
 */
const ROW_FAULTS = [
  "valid",
  "tab-in-file",
  "line-feed-in-file",
  "carriage-return-in-file",
  "refused-without-rule",
  "accepted-with-rule",
] as const;

type RowFault = (typeof ROW_FAULTS)[number];

/**
 * Each row fault applied to one row.
 */
const BROKEN_ROW: Readonly<Record<RowFault, (row: VerdictRow) => VerdictRow>> = {
  "accepted-with-rule": (row) => ({ ...row, rule: "admission", verdict: "accepted" }),
  "carriage-return-in-file": (row) => ({ ...row, file: `${row.file}\r` }),
  "line-feed-in-file": (row) => ({ ...row, file: `x\n${row.file}` }),
  "refused-without-rule": (row) => ({ ...row, rule: "", verdict: "refused" }),
  "tab-in-file": (row) => ({ ...row, file: `x\t${row.file}` }),
  valid: (row) => row,
};

/**
 * Rows with at most one broken row, under a swarm of the faults.
 */
const rowsWithFault: Gen<Readonly<{ fault: RowFault; rows: readonly VerdictRow[] }>> = (source) => {
  const fault = source.draw(swarmChoice(source.draw(swarm(ROW_FAULTS)), ROW_FAULTS));
  const rows = source.draw(rowsOf(1));
  const at = source.draw(int(0, rows.length - 1));

  return { fault, rows: rows.map((row, index) => (index === at ? BROKEN_ROW[fault](row) : row)) };
};

/**
 * The named ways a text breaks the format, beside the rows a broken row gives, and `valid`.
 */
const TEXT_FAULTS = [
  "valid",
  "empty",
  "no-final-newline",
  "wrong-header",
  "two-columns",
  "four-columns",
  "unknown-verdict",
  "refused-without-rule",
  "accepted-with-rule",
  "unknown-rule",
] as const;

type TextFault = (typeof TEXT_FAULTS)[number];

/**
 * Each text fault applied to valid rows' text, at its first data line where it breaks a line.
 */
const BROKEN_TEXT: Readonly<Record<TextFault, (rows: readonly VerdictRow[]) => string>> = {
  "accepted-with-rule": (rows) => `${formatted(rows)}late.zip\taccepted\tadmission\n`,
  empty: () => "",
  "four-columns": (rows) => `${formatted(rows)}late.zip\taccepted\t\textra\n`,
  "no-final-newline": (rows) => formatted(rows).slice(0, -1),
  "refused-without-rule": (rows) => `${formatted(rows)}late.zip\trefused\t\n`,
  "two-columns": (rows) => `${formatted(rows)}late.zip\taccepted\n`,
  "unknown-rule": (rows) => `${formatted(rows)}late.zip\trefused\tnot-a-rule\n`,
  "unknown-verdict": (rows) => `${formatted(rows)}late.zip\tmaybe\t\n`,
  valid: formatted,
  "wrong-header": (rows) => formatted(rows).replace(HEADER, "file\tverdict"),
};

const textWithFault: Gen<
  Readonly<{ fault: TextFault; text: string; rows: readonly VerdictRow[] }>
> = (source) => {
  const fault = source.draw(swarmChoice(source.draw(swarm(TEXT_FAULTS)), TEXT_FAULTS));
  const rows = source.draw(rowsOf(0));

  return { fault, rows, text: BROKEN_TEXT[fault](rows) };
};

/**
 * A failure's tag, or `succeeded`.
 */
const outcomeOf = <A>(outcome: Result.Result<A, { readonly _tag: string }>): string =>
  Result.isSuccess(outcome) ? "succeeded" : outcome.failure._tag;

/**
 * This file's budget for a search over `generator`, checked against `oracle`.
 */
const search = <S, F extends string>(
  suite: string,
  generator: Gen<S>,
  coverage: Coverage<F>,
  oracle: Oracle,
) => ({
  caseHang,
  concurrency: 1,
  coverage,
  draw: drawn(generator),
  kept: [],
  literal: Formatter.format,
  oracle,
  runs: 300,
  shrink: completeShrink,
  steerEvery: 16,
  suite,
});

describe("test/verdicts.ts", () => {
  it.effect(
    "renderVerdicts writes exactly the format's text, and parseVerdicts reads it back",
    (ctx) =>
      searched(
        ctx,
        explore(
          search("pantry/verdicts/round-trip", rowsOf(0), noCoverage, {
            kind: "specification",
            name: "the format as AGENTS.md states it, written by formatted, and parseVerdicts ∘ renderVerdicts = the rows sorted by file",
          }),
          (rows) =>
            Effect.gen(function* roundTrip() {
              const text = yield* renderVerdicts(rows);

              assert.strictEqual(text, formatted(rows));
              assert.deepStrictEqual(yield* parseVerdicts(text), rows.toSorted(byFile));
            }),
        ),
      ),
  );

  it.effect("renderVerdicts refuses exactly the rows that break the format", (ctx) =>
    searched(
      ctx,
      explore(
        search(
          "pantry/verdicts/render-refusals",
          rowsWithFault,
          required<RowFault>(ROW_FAULTS, { cases: 300, sense: notesOnly }),
          {
            kind: "specification",
            name: "AGENTS.md's format: rows break it exactly by the fault drawn into one of them",
          },
        ),
        ({ fault, rows }, c) =>
          Effect.gen(function* refusals() {
            c.note(fault);

            assert.strictEqual(
              outcomeOf(yield* Effect.result(renderVerdicts(rows))),
              fault === "valid" ? "succeeded" : "VerdictsInvalid",
            );
          }),
      ),
    ),
  );

  it.effect("parseVerdicts refuses exactly the texts that break the format", (ctx) =>
    searched(
      ctx,
      explore(
        search(
          "pantry/verdicts/parse-refusals",
          textWithFault,
          required<TextFault>(TEXT_FAULTS, { cases: 300, sense: notesOnly }),
          {
            kind: "specification",
            name: "AGENTS.md's format: a text breaks it exactly by the fault drawn into it, and a valid one reads back as its rows sorted by file",
          },
        ),
        ({ fault, rows, text }, c) =>
          Effect.gen(function* refusals() {
            c.note(fault);

            const outcome = yield* Effect.result(parseVerdicts(text));

            assert.strictEqual(
              outcomeOf(outcome),
              fault === "valid" ? "succeeded" : "VerdictsInvalid",
            );
            if (Result.isSuccess(outcome)) {
              assert.deepStrictEqual(outcome.success, rows.toSorted(byFile));
            }
          }),
      ),
    ),
  );

  it.effect("verdictsPath names the tarball's basename under pantry's verdicts/", (ctx) =>
    searched(
      ctx,
      explore(
        search(
          "pantry/verdicts/path",
          array(string(element(["a", "x", "-", "0"] as const), { max: 6, min: 1 }), {
            max: 4,
            min: 1,
          }),
          noCoverage,
          {
            kind: "specification",
            name: "AGENTS.md's path, packages/pantry/verdicts/<tarball basename>.tsv, resolved by node:path",
          },
        ),
        (segments) =>
          Effect.sync(() => {
            const name = segments.at(-1) ?? "a";
            const tarball = path.join("/", ...segments.slice(0, -1), `${name}.tar.gz`);

            assert.strictEqual(
              verdictsPath(tarball),
              path.resolve(import.meta.dirname, "../../verdicts", `${name}.tsv`),
            );
          }),
      ),
    ),
  );
});
