import { readFileSync } from "node:fs";
import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { ImportRule } from "#pantry/import/refusal.ts";
import { examplesTarball, zipMembers } from "#pantry/test/fixtures.ts";
import { parseVerdicts, verdictsPath } from "#pantry/test/verdicts.ts";

/**
 * Guards the committed verdict file without a lease or the corpus tarball: it reads only the file
 * and the table of zip members, so a plain run notices a missing row or a renamed rule.
 */
const isRule = Schema.is(ImportRule);

const committedRows = Effect.gen(function* committedRows() {
  const tarball = yield* examplesTarball;

  return yield* parseVerdicts(readFileSync(verdictsPath(tarball), "utf-8"));
});

it.effect("the committed verdict file has one row for each corpus zip", () =>
  Effect.gen(function* rowsPerZip() {
    const rows = yield* committedRows;

    assert.deepStrictEqual(
      rows.map((row) => row.file).toSorted(),
      Object.values(zipMembers).toSorted(),
    );
  }),
);

it.effect("every refused row names a rule of the roster", () =>
  Effect.gen(function* refusedRules() {
    const rows = yield* committedRows;

    for (const row of rows.filter((candidate) => candidate.verdict === "refused")) {
      assert.isTrue(isRule(row.rule), `${row.file} names "${row.rule}", not a rule of the roster`);
    }
  }),
);

it.effect("every accepted row names no rule", () =>
  Effect.gen(function* acceptedRules() {
    const rows = yield* committedRows;

    for (const row of rows.filter((candidate) => candidate.verdict === "accepted")) {
      assert.strictEqual(row.rule, "", `${row.file} is accepted but names "${row.rule}"`);
    }
  }),
);
