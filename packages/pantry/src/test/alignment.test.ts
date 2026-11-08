/**
 * The spec-alignment census as a test (slice A12): every XSD rule and spec reading, by family and
 * status, against the composed grammar.
 *
 * Oracle: the specification turned into a checker. The XSD rules are the content-model and
 * attribute IR the deriver writes from the 23 pinned XSDs (its own tests check a re-run
 * reproduces it byte for byte from the cache), and the readings are `docs/spec-readings.md`'s;
 * `census` (`#pantry/test/alignment.ts`) joins each to the relation that owns it.
 *
 * The contract, the operator's completion criterion for exact alignment:
 *
 * - No rule is contradicted (`X`): a rule the grammar breaks is either aligned or recorded as a spec
 *   reading (`reading`) or a ruled gap (`R`: reading 2's recorded MathML limits and reading 50),
 *   never left;
 * - The census holds every spec reading the readings file states, and no other;
 * - The unowned count (`U`, XSD-invalid content accepted with no owner) is a ratchet: the goal is
 *   zero, and the number recorded here only goes down, recorded anew each time it moves.
 *
 * It reads no cache: the IR is committed, and its fidelity to the pinned XSDs is the deriver's
 * cache-gated tests'. It writes `work/alignment/rules.tsv`, every rule with its status and owner.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { census, countsOf, readings, statuses } from "#pantry/test/alignment.ts";
import type { Rule } from "#pantry/test/alignment.ts";

/**
 * The folder this test writes to, `packages/pantry/work/alignment`.
 */
const outputRoot = path.resolve(import.meta.dirname, "..", "..", "work", "alignment");

/**
 * The readings file, whose numbered readings the census must hold.
 */
const readingsFile = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "spec-readings.md",
);

/**
 * The unowned count of the census, a ratchet: the goal is zero. A change that lowers it records the
 * new count here; a change that raises it names an owner for each new rule instead.
 *
 * Taken on 2026-11-05 on the shared tree, after the attribute grammar's cutover and the unowned
 * readings' laws (2, 3, 9, 39, 41, 42, 43 and 47): every XSD rule and every spec reading is owned.
 */
const unownedCeiling = 0;

/**
 * The composed grammar the census reads, built once while the file is collected: building it is
 * the slow part (43.6 s measured on 2026-11-05 at a load average near 30), and the census itself
 * takes about a second.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The timeout, in milliseconds, for the census test, which takes the census of the grammar built
 * above and writes one file: 1.2 s measured on 2026-11-05 at a load average near 30. Measured
 * 2026-11-07: 3.3 s at a load average of 75, under V8 coverage. The budget is the larger of twice
 * that and 20 s. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const censusTimeoutMs = 20_000;

/**
 * Write a rule as one line.
 *
 * @param rule - The rule.
 * @returns Its family, version, parent, subject and what the grammar states.
 */
const ruleLine = (rule: Rule): string =>
  `${rule.family} ${rule.version} ${rule.parent} ${rule.subject}: ${rule.detail}`;

describe("alignment.test.ts, the census", () => {
  layer(NodeServices.layer, { excludeTestServices: true })("every XSD rule and reading", (it) => {
    it.effect(
      "no rule is contradicted, every reading is held, and the unowned count holds",
      () =>
        Effect.gen(function* takeCensus() {
          const fs = yield* FileSystem.FileSystem;
          const rules = census(grammar);
          const counts = countsOf(rules);
          const numbered = [
            ...readFileSync(readingsFile, "utf-8").matchAll(/^(?<number>\d+)\. \*\*/gmu),
          ].map((found) => Number(found.groups?.["number"]));

          yield* fs.makeDirectory(outputRoot, { recursive: true });
          yield* fs.writeFileString(
            `${outputRoot}/rules.tsv`,
            [
              "family\tversion\tparent\tsubject\tstatus\towner\tdetail",
              ...rules.map((rule) =>
                [
                  rule.family,
                  rule.version,
                  rule.parent,
                  rule.subject,
                  rule.status,
                  rule.owner,
                  rule.detail,
                ]
                  .map((field) => field.replaceAll(/[\t\r\n]+/gu, " "))
                  .join("\t"),
              ),
            ]
              .map((line) => `${line}\n`)
              .join(""),
          );
          yield* Console.log(
            [
              `alignment: ${String(counts.total)} rules; unowned ${String(counts.unowned)} (ceiling ${String(unownedCeiling)})`,
              ...Object.entries(counts.byFamily).map(
                ([family, held]) =>
                  `  ${family}: ${statuses
                    .flatMap((status) =>
                      held[status] === undefined ? [] : [`${status} ${String(held[status])}`],
                    )
                    .join(", ")}`,
              ),
            ].join("\n"),
          );

          assert.deepStrictEqual(
            rules.filter(({ status }) => status === "X").map(ruleLine),
            [],
            "no rule is contradicted without a recorded reading or a ruled gap",
          );
          assert.deepStrictEqual(
            [...readings.keys()].toSorted((left, right) => left - right),
            numbered.toSorted((left, right) => left - right),
            "the census holds exactly the readings docs/spec-readings.md states",
          );
          assert.isAtMost(counts.unowned, unownedCeiling, "the unowned count only goes down");
          assert.strictEqual(
            counts.unowned,
            unownedCeiling,
            "the unowned count moved down: record the new count as the ceiling",
          );
        }),
      { timeout: censusTimeoutMs },
    );
  });
});
