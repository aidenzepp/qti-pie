import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Result, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import type { Rule } from "#qti/import/refusal.ts";
import { ncName } from "#qti/schema/patterns.ts";
import { materializeProcessing } from "#qti/processing/fixtures.ts";
import type { ProcessingFixtureName } from "#qti/processing/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export`;

/**
 * The packages whose import is accepted and whose export compares all equal: the two round-trip
 * packages of M3 and the guard package whose four padded attributes are decision 19's witnesses.
 */
const roundTripped = [
  "processing-item",
  "rptemplates",
  "padded-processing",
] as const satisfies readonly ProcessingFixtureName[];

/**
 * Each package the XML path refuses, with the rule its refusal names.
 *
 * The checker's P8, P20, P21, P22 (the lookup without a table), P23, P24, P25 (the response case),
 * P27 come from `broken/`, the builder's P5 and the guard's P30 from `guards/`, and the two padded
 * packages are refused by the database (P6: the pattern law on `figures`; `value-lexical`: the
 * identifier value arm's pattern on the content as read, which a pattern law cannot tell from P7).
 * `p29-test-variables-weight-integer` has a test root, which the reader refuses as
 * `unmodeled-vocabulary`; its XML path is M4's. Five packages hold content's vocabulary
 * (`qti-template-declaration`, `qti-context-declaration`, `qti-match-table`) that the reader
 * refuses on this branch, so their XML path is the join's (`join-m1-m3.db.test.ts`):
 * `p22-string-into-lookup`, `p25-number-correct-in-template`, `p26-template-reads-response` and
 * `empty-template-processing` are refused there, and `p26-template-reads-context` accepted, as it
 * is the positive control. P31 and P32 have no XML-path package: their negatives are the in-memory
 * sets of `guards/processing.test.ts`.
 */
const refused: readonly (readonly [ProcessingFixtureName, Rule])[] = [
  ["undeclared-reference", "P8"],
  ["p20-float-into-integer-outcome", "P20"],
  ["p21-sum-as-condition", "P21"],
  ["p22-lookup-without-table", "P22"],
  ["p23-and-string-operand", "P23"],
  ["p23-contains-singles", "P23"],
  ["p23-divide-multiple", "P23"],
  ["p23-duration-lt-integers", "P23"],
  ["p23-field-value-single", "P23"],
  ["p23-gcd-floats", "P23"],
  ["p23-gt-strings", "P23"],
  ["p23-index-single", "P23"],
  ["p23-inside-integer", "P23"],
  ["p23-integer-divide-floats", "P23"],
  ["p23-match-duration-pair", "P23"],
  ["p23-member-multiple-first", "P23"],
  ["p23-multiple-two-base-types", "P23"],
  ["p23-stats-operator-single", "P23"],
  ["p23-substring-integers", "P23"],
  ["p23-sum-record", "P23"],
  ["p24-figures-float-variable", "P24"],
  ["p25-number-correct-in-response", "P25"],
  ["p27-map-response-unmapped", "P27"],
  ["p29-test-variables-weight-integer", "unmodeled-vocabulary"],
  ["missing-identifier", "P5"],
  ["else-before-if", "P30"],
  ["padded-reference", "P6"],
  ["padded-literal", "value-lexical"],
];

/**
 * A pattern law as grizzle reports it: the regex and its flags, and no relation.
 */
const PatternLaw = Schema.Struct({ kind: Schema.Literal("pattern"), source: Schema.String });

/**
 * Whether a refusal's law is a pattern law.
 */
const isPatternLaw = Schema.is(PatternLaw);

/**
 * The rows an apply added to one relation.
 */
interface Count {
  readonly added: number;
  readonly relation: string;
}

/**
 * Whether an apply's answer is `accepted`, which carries the rows added per relation.
 *
 * @param outcome - What `db.apply` answered.
 * @returns True for `accepted`.
 */
const isAccepted = (
  outcome: unknown,
): outcome is { readonly counts: readonly Count[]; readonly kind: "accepted" } =>
  typeof outcome === "object" &&
  outcome !== null &&
  "kind" in outcome &&
  outcome.kind === "accepted" &&
  "counts" in outcome;

/**
 * Import a package, export it to `work/export/<name>/`, compare the export with the package, and
 * leave the rendered report beside it in `work/export/<name>.report.txt`.
 *
 * @param name - The derived package to round-trip.
 * @returns The package id, the rendered report, and the rows the apply added per relation.
 */
const roundTrip = (name: ProcessingFixtureName) =>
  Effect.gen(function* roundTripPackage() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materializeProcessing(name);
    const exported = `${exportRoot}/${name}`;
    const counts: Count[] = [];
    const id = yield* importPackage(source, {
      wrapApply: (apply) =>
        apply.pipe(
          Effect.tap((outcome) =>
            Effect.sync(() => {
              if (isAccepted(outcome)) {
                counts.push(...outcome.counts);
              }
            }),
          ),
        ),
    });

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);
    const rendered = renderReport(report);

    yield* fs.writeFileString(`${exported}.report.txt`, `${rendered}\n`);

    return { counts, rendered, report };
  });

describe.skipIf(!hasLease)(
  "import/processing.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the round trip of the processing packages and the XML-path refusals", (it) => {
      for (const name of roundTripped) {
        it.effect(`${name} is accepted and its export compares all equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const started = Date.now();
            const { counts, rendered, report } = yield* roundTrip(name);

            assert.isAbove(report.length, 0);
            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              rendered,
            );
            assert.strictEqual(
              report.find((item) => item.path === "imsmanifest.xml")?.outcome.kind,
              "canonical-equal",
            );

            yield* Effect.log(`${name}: round trip ${Date.now() - started} ms`);

            if (name === "processing-item") {
              const fs = yield* FileSystem.FileSystem;
              const lines = counts
                .filter((count) => count.added > 0)
                .map((count) => `${count.relation}: ${count.added}`)
                .toSorted();

              yield* fs.writeFileString(
                `${exportRoot}/${name}.counts.txt`,
                `${lines.join("\n")}\n`,
              );
            }
          }),
        );
      }

      it.effect("rptemplates round-trips each of the five template documents canonical-equal", () =>
        Effect.gen(function* templatesEqual() {
          const { report } = yield* roundTrip("rptemplates");
          const documents = report.filter((item) => item.path.startsWith("rptemplates/"));

          assert.deepStrictEqual(documents.map((item) => item.path).toSorted(), [
            "rptemplates/CC2_map_response.xml",
            "rptemplates/CC2_match.xml",
            "rptemplates/CC2_match_basic.xml",
            "rptemplates/map_response.xml",
            "rptemplates/match_correct.xml",
          ]);
          assert.deepStrictEqual(
            documents.map((item) => item.outcome.kind),
            documents.map(() => "canonical-equal"),
          );
        }),
      );

      for (const [name, rule] of refused) {
        it.effect(`${name} is refused naming ${rule}`, () =>
          Effect.gen(function* refusedNamingRule() {
            const result = yield* importPackage(yield* materializeProcessing(name)).pipe(
              Effect.result,
            );

            assert.isTrue(Result.isFailure(result), `${name} was accepted`);

            if (Result.isFailure(result)) {
              assert.isTrue(
                result.failure instanceof ImportRefused,
                `${name} failed with ${String(result.failure)}`,
              );
              assert.strictEqual(
                result.failure instanceof ImportRefused ? result.failure.rule : undefined,
                rule,
                String(result.failure),
              );

              if (name === "padded-literal" && result.failure instanceof ImportRefused) {
                // A pattern law carries no relation (`refusal.ts`), so the map cannot tell P7 from
                // `value-lexical`: the law is the `LiteralIdentifier` arm's `ncName` pattern.
                const { law } = result.failure;

                assert.isTrue(
                  isPatternLaw(law),
                  `law is not a pattern law: ${JSON.stringify(law)}`,
                );

                if (isPatternLaw(law)) {
                  assert.strictEqual(law.source, ncName);
                }

                yield* Effect.log(`padded-literal detail: ${result.failure.detail}`);

                yield* Effect.log(`padded-literal law: ${JSON.stringify(law)}`);
              }
            }
          }),
        );
      }
    });
  },
);
