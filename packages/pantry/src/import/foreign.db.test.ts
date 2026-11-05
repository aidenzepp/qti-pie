import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Result, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage, readRows } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const exportRoot = `${import.meta.dirname}/../../work/export/foreign`;

/**
 * The five wildcard fixtures phase 11 accepts, each with the foreign relations its import must
 * write. `cut-custom-operator` holds foreign attributes but no foreign element, so it writes only
 * `ForeignAttribute` rows; every other one writes both relations.
 */
const accepted: readonly (readonly [
  FixtureName,
  { readonly attributes: boolean; readonly elements: boolean },
])[] = [
  ["cut-custom-operator", { attributes: true, elements: false }],
  ["operator-foreign-content", { attributes: true, elements: true }],
  ["fallback-3-0-1", { attributes: true, elements: true }],
  ["lom-wildcard", { attributes: true, elements: true }],
  ["nested-root-in-foreign", { attributes: true, elements: true }],
];

/**
 * The four wildcard fixtures phase 11 refuses, with the rule each refusal names: the guard's P30
 * for a foreign element before the operand, `unmodeled-vocabulary` for an unqualified attribute on
 * the operator and for a foreign element in a file's `metadata`, and `wildcard-namespace` for a
 * `qti-` element among an operator's children (the importer's wildcard guard, before the write).
 */
const refused: readonly (readonly [FixtureName, Rule])[] = [
  ["operator-foreign-first", "P30"],
  ["unqualified-on-operator", "unmodeled-vocabulary"],
  ["strict-file-foreign", "unmodeled-vocabulary"],
  ["qti-ns-under-operator", "wildcard-namespace"],
];

/**
 * An accepted apply's answer: the rows added to each relation. The apply reports each count as a
 * `bigint`.
 */
const Accepted = Schema.Struct({
  counts: Schema.Array(Schema.Struct({ added: Schema.BigInt, relation: Schema.String })),
  kind: Schema.Literal("accepted"),
});

const decodeAccepted = Schema.decodeUnknownOption(Accepted);

/**
 * Import a fixture, count the foreign rows its apply added, export it to `work/export/foreign/`
 * and compare the export with the source.
 *
 * @param name - The accepted fixture to round-trip.
 * @returns The rows the importer built, the rows the apply added per relation, the rendered report
 *   and the report.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const { rows } = yield* readRows(source);
    const added = new Map<string, bigint>();
    const id = yield* importPackage(source, {
      wrapApply: (apply) =>
        apply.pipe(
          Effect.tap((outcome) =>
            Option.match(decodeAccepted(outcome), {
              onNone: () => Effect.void,
              onSome: ({ counts }) =>
                Effect.sync(() => {
                  for (const count of counts) {
                    added.set(count.relation, (added.get(count.relation) ?? 0n) + count.added);
                  }
                }),
            }),
          ),
        ),
    });
    const exported = `${exportRoot}/${name}`;

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    return { added, rendered: renderReport(report), report, rows };
  });

describe.skipIf(!hasLease)(
  "import/foreign.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the round trip of the wildcard fixtures and the refusals", (it) => {
      for (const [name, expected] of accepted) {
        it.effect(
          `${name} is accepted, its foreign rows are read back and its export is canonical-equal`,
          () =>
            Effect.gen(function* roundTripEqual() {
              const { added, rendered, report, rows } = yield* roundTrip(name);
              const elements = Rows.of(rows, ForeignElement).length;
              const attributes = Rows.of(rows, ForeignAttribute).length;

              assert.strictEqual(elements > 0, expected.elements, `${name}: ForeignElement rows`);
              assert.strictEqual(
                attributes > 0,
                expected.attributes,
                `${name}: ForeignAttribute rows`,
              );
              assert.strictEqual(added.get("ForeignElement") ?? 0n, BigInt(elements));
              assert.strictEqual(added.get("ForeignAttribute") ?? 0n, BigInt(attributes));
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

      for (const [name, rule] of refused) {
        it.effect(`${name} is refused naming ${rule}`, () =>
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
                rule,
                String(result.failure),
              );
            }
          }),
        );
      }
    });
  },
);
