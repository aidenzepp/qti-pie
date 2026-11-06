import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { changeSetOf, importPackage, readRows, retrySchedule } from "#pantry/import/package.ts";
import { ImportRefused, isMappedLaw, refusalOfLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Document } from "#pantry/schema/document.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { Node } from "#pantry/schema/node.ts";
import {
  ItemInstanceSpelling,
  ItemVariableRef,
  SectionDurationTarget,
  SectionVariableRef,
  VariableRef,
} from "#pantry/schema/processing.ts";
import { materialize, negativeNames } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The eleven positive fixtures of phase 5 (the spec's 4.18). The twelfth positive, the corpus
 * package `BegGuide_March2025`, is `corpus.tests.db.test.ts`'s.
 */
const positives = [
  "test-linear",
  "test-selection",
  "test-mapping",
  "test-template-default",
  "test-section-ref",
  "test-include",
  "test-adaptive",
  "test-content",
  "stimulus-shared",
  "stimulus-301",
  "test-lti",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/`, and compare the export with the fixture.
 * The rendered report is left beside it in `work/export/<name>.report.txt`.
 *
 * @param name - The positive fixture to round-trip.
 * @returns The comparison of the export with the fixture, one outcome per source entry.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return report;
  });

/**
 * Apply rows as one `ChangeSet` through the author role, the way `importPackage` does after its
 * guards and without them.
 */
const applyRows = (rows: Rows) =>
  Effect.gen(function* applyChanges() {
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db
      .apply(changeSetOf(rows), {})
      .pipe(Effect.retry({ schedule: retrySchedule, while: (e) => e._tag === "TransientFailure" }));
  });

/**
 * Apply rows directly and expect the database to refuse them under one of `rules`. A law that fell
 * to the nearest rule is logged as a finding.
 */
const rejectedUnder = (rows: Rows, label: string, rules: readonly Rule[]) =>
  Effect.gen(function* rejectedUnderRule() {
    const outcome = yield* applyRows(rows);

    if (outcome.kind !== "invariant-rejected") {
      assert.fail(`${label} was ${outcome.kind}, not refused by the database`);
    }

    const law: ImportLaw = outcome.law;
    const refusal = refusalOfLaw(law, outcome.witness);

    if (!isMappedLaw(law)) {
      yield* Effect.logWarning(
        `FINDING ${label}: law not mapped, filed under ${refusal.rule}: ${refusal.detail}`,
        law,
      );
    }

    assert.include(rules, ruleOfLaw(law), `${label}: ${refusal.message}`);
  });

/**
 * Import a package and expect `ImportRefused` under one of `rules`, whether a guard, the checker
 * or the database refused it.
 */
const refusedUnder = (dir: string, label: string, rules: readonly Rule[]) =>
  Effect.gen(function* refusedByImporter() {
    const result = yield* Effect.result(importPackage(dir));

    if (Result.isSuccess(result)) {
      assert.fail(`${label} was accepted as package ${result.success}`);
    }

    const refusal = result.failure;

    if (!(refusal instanceof ImportRefused)) {
      assert.fail(`${label} failed with something other than a refusal: ${refusal.message}`);
    }

    assert.include(rules, refusal.rule, `${label}: ${refusal.message}`);
  });

/**
 * Replace the rows of `relation` that `where` accepts, of which there must be one, with `change`
 * of them.
 */
const mapRows = <R extends Parameters<typeof Rows.of>[1]>(
  rows: Rows,
  relation: R,
  where: (row: ReturnType<typeof Rows.of<R>>[number]) => boolean,
  change: (row: ReturnType<typeof Rows.of<R>>[number]) => ReturnType<typeof Rows.of<R>>[number],
): Rows => {
  const before = Rows.of(rows, relation);

  assert.isTrue(before.some(where), `${relation.name} holds no row to alter`);

  return new Map(rows).set(
    relation,
    before.map((row) => (where(row) ? change(row) : row)),
  );
};

/**
 * The id of the first document whose root is `root`.
 */
const documentOf = (rows: Rows, root: "item" | "test") => {
  const found = Rows.of(rows, Document).find((row) => row.root === root);

  return found?.id ?? assert.fail(`no ${root} document`);
};

/**
 * How a negative is checked.
 *
 * `database`: the importer's rows for it are applied directly, and the importer refuses it, both
 * under one of `rules` (bin 1). `importer`: a guard or the checker refuses it before any row is
 * written, under one of `rules` (bin 2, or a bin 1 whose rows the importer cannot write).
 * `direct`: the importer cannot write its breach, so `alter` changes the rows of the positive
 * that carries its name by hand and the database refuses them under one of `rules`.
 */
type Expectation =
  | { readonly kind: "database"; readonly rules: readonly Rule[] }
  | { readonly kind: "importer"; readonly rules: readonly Rule[] }
  | {
      readonly alter: (rows: Rows) => Rows;
      readonly kind: "direct";
      readonly rules: readonly Rule[];
    };

/**
 * The rule each of phase 5's negatives is refused under (the spec's 4.15, last two columns).
 *
 * A rule listed after the spec's names the rule `readRows` refused it under on 2026-11-05 at
 * `6bd1e48` where that is not the spec's: `feedback-template` and `rubric-in-rubric` and
 * `section-identifier-unknown` and `section-unprefixed-undeclared` are refused by an earlier
 * guard than the spec's bin 1 law, so they have no direct case here.
 */
const negatives: Readonly<Record<(typeof negativeNames)[number], Expectation>> = {
  "branch-backward": { kind: "importer", rules: ["branch-forward"] },
  "branch-exit-misspelled": { kind: "database", rules: ["branch-target"] },
  // Open since p5-31: no landed law or guard is known to refuse a branch rule into a section ref
  // (`phase-5.slices.md`, the note under p5-31). The spec's rule is the one expected.
  "branch-into-ref": { kind: "database", rules: ["branch-target"] },
  "branch-part-to-item": { kind: "database", rules: ["branch-target"] },
  "branch-replacement-target": { kind: "importer", rules: ["branch-forward"] },
  "branch-unknown-target": { kind: "database", rules: ["branch-target"] },
  "duration-of-item-ref": {
    alter: (rows) => {
      const itemRef = Rows.of(rows, Node).find((row) => row.kind === "qti-assessment-item-ref");

      return mapRows(
        rows,
        SectionDurationTarget,
        () => true,
        (row) => ({
          ...row,
          holder: itemRef?.id ?? assert.fail("no item ref"),
          holderKind: "itemRef" as const,
        }),
      );
    },
    kind: "direct",
    rules: ["prefixed-ref"],
  },
  "feedback-outcome-float": { kind: "database", rules: ["feedback-ref"] },
  "feedback-template": { kind: "importer", rules: ["ancestry-ban", "binding-declared"] },
  "include-text": { kind: "database", rules: ["include-parse"] },
  "include-xpointer": { kind: "database", rules: ["include-xpointer"] },
  "instance-spelling-canonical": {
    alter: (rows) =>
      mapRows(
        rows,
        ItemInstanceSpelling,
        () => true,
        (row) => ({ ...row, value: "2" }),
      ),
    kind: "direct",
    rules: ["value-lexical"],
  },
  "item-duration-in-item": { kind: "importer", rules: ["item-duration"] },
  "item-duration-not-timed": { kind: "importer", rules: ["item-duration"] },
  "item-in-section": { kind: "database", rules: ["admission"] },
  "item-prefixed": {
    alter: (rows) => {
      const item = documentOf(rows, "item");
      const ref = Rows.of(rows, ItemVariableRef)[0]?.id ?? assert.fail("no item variable ref");
      const moved = mapRows(
        rows,
        ItemVariableRef,
        (row) => row.id === ref,
        (row) => ({ ...row, document: item, root: "item" as const }),
      );

      return mapRows(
        moved,
        VariableRef,
        (row) => row.id === ref,
        (row) => ({ ...row, document: item }),
      );
    },
    kind: "direct",
    rules: ["prefixed-root"],
  },
  "item-ref-missing": { kind: "database", rules: ["item-ref-target"] },
  "item-ref-to-stimulus": { kind: "database", rules: ["item-ref-target"] },
  "mapping-target-twice": { kind: "database", rules: ["variable-mapping-target"] },
  "mapping-undeclared": { kind: "database", rules: ["variable-mapping-source"] },
  "navigation-misspelled": { kind: "importer", rules: ["attribute-lexical", "value-lexical"] },
  "part-no-section": { kind: "database", rules: ["structure-count"] },
  "part-order": { kind: "importer", rules: ["ordering"] },
  "precondition-number-correct": { kind: "importer", rules: ["P25"] },
  "prefixed-ambiguous": { kind: "importer", rules: ["prefixed-ref"] },
  "prefixed-undeclared-variable": { kind: "importer", rules: ["prefixed-ref"] },
  "prefixed-unknown-ref": { kind: "importer", rules: ["prefixed-ref"] },
  "rubric-empty-view": { kind: "database", rules: ["attribute-lexical"] },
  "rubric-in-rubric": { kind: "importer", rules: ["ancestry-ban", "unmodeled-vocabulary"] },
  "rubric-interaction": { kind: "database", rules: ["ancestry-ban"] },
  "rubric-no-body": { kind: "database", rules: ["structure-count"] },
  "rubric-printed-undeclared": { kind: "importer", rules: ["binding-declared"] },
  "section-adaptive-and-selection": { kind: "importer", rules: ["ordering"] },
  "section-empty": { kind: "database", rules: ["section-empty"] },
  "section-feedback-undeclared": { kind: "importer", rules: ["binding-declared"] },
  "section-identifier-unknown": {
    kind: "importer",
    rules: ["section-identifier-target", "reach-copy"],
  },
  "section-prefixed-unresolved": { kind: "importer", rules: ["prefixed-ref"] },
  "section-printed-undeclared": { kind: "importer", rules: ["binding-declared"] },
  "section-ref-cycle": { kind: "importer", rules: ["section-ref-cycle"] },
  "section-ref-identifier-clash": { kind: "database", rules: ["structure-identifier"] },
  "section-ref-to-item": { kind: "database", rules: ["section-ref-target"] },
  "section-two-isc": { kind: "database", rules: ["structure-count"] },
  "section-unprefixed-undeclared": { kind: "importer", rules: ["P8", "binding-declared"] },
  "section-variable-in-test": {
    alter: (rows) => {
      const test = documentOf(rows, "test");
      const ref =
        Rows.of(rows, SectionVariableRef)[0]?.id ?? assert.fail("no section variable ref");
      const moved = mapRows(
        rows,
        SectionVariableRef,
        (row) => row.id === ref,
        (row) => ({ ...row, document: test, root: "test" as const }),
      );

      return mapRows(
        moved,
        VariableRef,
        (row) => row.id === ref,
        (row) => ({ ...row, document: test }),
      );
    },
    kind: "direct",
    rules: ["section-variable-ref"],
  },
  "select-not-integer": { kind: "importer", rules: ["attribute-lexical", "value-lexical"] },
  "select-over": { kind: "database", rules: ["selection-bounds"] },
  "select-under-required": { kind: "database", rules: ["selection-required"] },
  "stimulus-300-attributes": { kind: "database", rules: ["admission", "attribute-admission"] },
  "stimulus-300-include": { kind: "database", rules: ["admission"] },
  "stimulus-body-empty": { kind: "importer", rules: ["body-empty"] },
  "stimulus-missing-image": { kind: "database", rules: ["file-exists", "document-reference"] },
  "stimulus-ref-duplicate": { kind: "database", rules: ["stimulus-ref-key"] },
  "stimulus-ref-to-item": { kind: "database", rules: ["stimulus-ref-target"] },
  "stimulus-typed-test": { kind: "database", rules: ["resource-root"] },
  "template-default-type": { kind: "importer", rules: ["P20"] },
  "template-default-undeclared": { kind: "database", rules: ["template-default-target"] },
  "test-declares-duration": { kind: "database", rules: ["declaration-reserved"] },
  "test-duplicate-identifier": { kind: "database", rules: ["structure-identifier"] },
  "test-identifier-mismatch": { kind: "database", rules: ["lom-identifier"] },
  "test-lang-no-lom": { kind: "database", rules: ["document-lang"] },
  "test-no-part": { kind: "database", rules: ["structure-count"] },
  "test-title-mismatch": { kind: "database", rules: ["lom-title"] },
  "test-undeclared-variable": { kind: "importer", rules: ["P8"] },
};

describe.skipIf(!hasLease)(
  "import/tests.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("phase 5's positives and negatives on the lease", (it) => {
      for (const name of positives) {
        it.effect(`${name} round-trips through the database, every entry equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const report = yield* roundTrip(name);

            assert.isAbove(report.length, 0);
            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              renderReport(report),
            );
          }),
        );
      }

      for (const name of negativeNames) {
        const expected = negatives[name];

        if (expected.kind === "direct") {
          it.effect(`${name} is refused by the database as a direct ChangeSet`, () =>
            Effect.gen(function* refusedDirect() {
              const { rows } = yield* readRows(yield* materialize(name));

              yield* rejectedUnder(expected.alter(rows), name, expected.rules);
            }),
          );
        } else {
          it.effect(`${name} is refused by the importer under ${expected.rules.join(" or ")}`, () =>
            Effect.gen(function* refusedImport() {
              yield* refusedUnder(yield* materialize(name), name, expected.rules);
            }),
          );
        }

        if (expected.kind === "database") {
          it.effect(`${name} is refused by the database as a direct ChangeSet`, () =>
            Effect.gen(function* refusedByDatabase() {
              const { rows } = yield* readRows(yield* materialize(name));

              yield* rejectedUnder(rows, name, expected.rules);
            }),
          );
        }
      }
    });
  },
);
