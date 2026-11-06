import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage, readRows } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { materialize, mathmlCommitNegatives } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export/mathml`;

/**
 * The 12 cut MathML positives of spec 4.11's first table, in the table's order.
 */
const cut = [
  "math-mathml",
  "math-stat2",
  "math-calc5",
  "math-solution",
  "math-template-block",
  "math-alttext",
  "math-polynomials",
  "math-order",
  "math-associate",
  "math-either-or",
  "math-inline-choice",
  "math-class",
] as const satisfies readonly FixtureName[];

/**
 * The 18 generated MathML positives of spec 4.11's second table: one for each group of
 * `mathmlGroups`, 16 items, a test and a stimulus.
 */
const generated = [
  "math-gen-1",
  "math-gen-2",
  "math-gen-3",
  "math-gen-4",
  "math-gen-5",
  "math-gen-6",
  "math-gen-7",
  "math-gen-8",
  "math-gen-9",
  "math-gen-10",
  "math-gen-11",
  "math-gen-12",
  "math-gen-13",
  "math-gen-14",
  "math-gen-15",
  "math-gen-16",
  "math-gen-17",
  "math-gen-18",
] as const satisfies readonly FixtureName[];

/**
 * The eight J6 positives that `readRows` reads (spec 4.9's list): the content of `m:annotation-xml`
 * and a foreign attribute on a MathML kind. `math-annotation-xml-semantics` is left out until
 * `readRows` reads it: `m:semantics` is no global element of the MathML schema, so the landed
 * classification stores it under `m:annotation-xml` as foreign and refuses it
 * (`src/test/fixtures.mathml.test.ts` pins that refusal).
 */
const annotation = [
  "math-annotation-xml-html",
  "math-annotation-xml-kind",
  "math-annotation-xml-printed-variable",
  "math-annotation-xml-qti-deep",
  "math-annotation-xml-qti-direct",
  "math-annotation-xml-qti-root",
  "math-custom-operator-printed-variable",
  "math-foreign-attribute",
] as const satisfies readonly FixtureName[];

/**
 * Every MathML positive: the 12 cut ones, the 18 generated ones, then the eight of J6.
 */
const positives: readonly FixtureName[] = [...cut, ...generated, ...annotation];

/**
 * The commit negatives `readRows` refuses itself, with the rule it names: the MathML guard fires
 * before the database can (`m:mrow`'s model names no `qti-printed-variable`), so the import fails
 * at read under that rule and not at commit under `admission`.
 */
const readFirst = new Map<FixtureName, Rule>([["math-printed-variable", "union-count"]]);

/**
 * What each positive's import cost, recorded as the positives run: the facts its rows hold and the
 * milliseconds `importPackage` took, read, commit and all.
 */
const imported = new Map<FixtureName, { readonly facts: number; readonly importMs: number }>();

/**
 * The file the import timings are written to, one line per fixture then the largest and `simple`:
 * the test runner does not print a passing test's log.
 */
const timingsFile = `${exportRoot}/timings.txt`;

/**
 * Import a fixture, export it to `work/export/mathml/` and compare the export with the source.
 *
 * @param name - The accepted fixture to round-trip.
 * @returns The facts the importer built, the milliseconds the import took, the rendered report and
 *   the report.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const { rows } = yield* readRows(source);
    const facts = [...rows.values()].reduce((sum, relationRows) => sum + relationRows.length, 0);
    const started = Date.now();
    const id = yield* importPackage(source);
    const importMs = Date.now() - started;
    const exported = `${exportRoot}/${name}`;

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    return { facts, importMs, rendered: renderReport(report), report };
  });

describe.skipIf(!hasLease)(
  "import/mathml.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the round trip of the MathML fixtures and the commit negatives", (it) => {
      for (const name of positives) {
        it.effect(`${name} is accepted and its export is canonical-equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const { facts, importMs, rendered, report } = yield* roundTrip(name);

            imported.set(name, { facts, importMs });

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
          }),
        );
      }

      for (const [name, rule] of mathmlCommitNegatives) {
        const expected = readFirst.get(name) ?? rule;

        it.effect(
          readFirst.has(name)
            ? `${name} is refused at read under ${expected} before the database can refuse it under ${rule}`
            : `${name} is refused at commit under ${rule}`,
          () =>
            Effect.gen(function* refusedNamingRule() {
              const result = yield* importPackage(yield* materialize(name)).pipe(Effect.result);

              assert.isTrue(Result.isFailure(result), `${name} was accepted`);

              if (Result.isFailure(result)) {
                assert.isTrue(
                  result.failure instanceof ImportRefused,
                  `${name} failed with ${String(result.failure)}`,
                );
                assert.strictEqual(
                  result.failure instanceof ImportRefused ? result.failure.rule : undefined,
                  expected,
                  String(result.failure),
                );
              }
            }),
        );
      }

      it.effect("records the import wall time of the largest MathML fixture and of simple", () =>
        Effect.gen(function* printsTimings() {
          const [largest] = [...imported].toSorted(([, a], [, b]) => b.facts - a.facts);

          assert.isDefined(largest);

          const [name, { facts, importMs }] = largest ?? ["simple", { facts: 0, importMs: 0 }];
          const started = Date.now();

          yield* importPackage(yield* materialize("simple"));

          const ended = Date.now();
          const fs = yield* FileSystem.FileSystem;
          const lines = [
            ...[...imported].map(
              ([each, cost]) => `${each}: ${cost.facts} facts, import ${cost.importMs} ms`,
            ),
            `largest MathML fixture ${name}: ${facts} facts, import ${importMs} ms`,
            `simple: import ${ended - started} ms`,
          ];

          yield* fs.makeDirectory(exportRoot, { recursive: true });
          yield* fs.writeFileString(timingsFile, `${lines.join("\n")}\n`);
          yield* Effect.log(lines.join("; "));
        }),
      );
    });
  },
);
