/**
 * The processing packages' stated verdicts (`processing-verdicts.ts`), judged by the law oracle and
 * the import's reader with no database: the verdict `import/program.oracle.db.test.ts` holds
 * PostgreSQL to is the one the oracle predicts for the same package.
 *
 * Oracle: the law oracle (`judge`, `verdictOf`) over each package as `readPackage` reads it, and
 * the import's own reader for the codec's refusals, which happen before any row exists.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import { materializeProcessing, processingFixtureNames } from "#pantry/test/processing-fixtures.ts";
import { processingVerdicts } from "#pantry/test/processing-verdicts.ts";

/**
 * The composed grammar every package is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The laws a guard's package is refused under, as `import/program.oracle.db.test.ts` picks them
 * from the database's outcome: AL3's required attribute, N7's last slot and N5's follow.
 */
const guardLaws: ReadonlySet<LawName> = new Set(["AL3 required", "N5 Follow", "N7 Last"]);

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/processing-verdicts.ts, judged by the law oracle",
  (it) => {
    it.effect(
      "predicts each processing package's stated verdict, and the codec's refusals exactly where it states them",
      () =>
        // Oracle: the law oracle's verdict on each package, and the import's reader, which refuses a
        // codec-refused package before any row under the same rule. Bound: every processing
        // package, 38.
        Effect.gen(function* statedVerdicts() {
          const statedOf = yield* processingVerdicts;
          for (const name of processingFixtureNames) {
            const dir = yield* materializeProcessing(name);
            const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
            const held = statedOf(name);

            assert.strictEqual(
              judgment._tag === "CodecRefusal",
              Option.exists(held, ({ source }) => source === "codec"),
              `${name}: the oracle refuses it by the codec exactly when the verdicts say so`,
            );
            if (Option.isNone(held)) {
              continue;
            }

            const stated = held.value;

            if (stated.source === "guard" && stated.rule !== "accepted") {
              const broken =
                judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [];

              assert.isNotEmpty(broken, name);
              assert.deepStrictEqual(
                broken.filter((law) => !guardLaws.has(law)),
                [],
                `${name}: only a guard's law breaks`,
              );

              continue;
            }

            assert.deepStrictEqual(
              verdictOf(judgment),
              stated.rule === "accepted"
                ? { verdict: "accepted" }
                : { rule: stated.rule, verdict: "refused" },
              name,
            );
            if (stated.source === "codec") {
              const refused = yield* Effect.flip(readProgram(dir));

              assert.strictEqual(
                refused._tag === "ImportRefused" ? refused.rule : refused._tag,
                stated.rule,
                `${name}: the import's reader`,
              );
            }
          }
        }),
      240_000,
    );
  },
);
