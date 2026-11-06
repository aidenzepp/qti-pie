/**
 * The export on the lease: the three corpus packages the import accepts, imported, exported and
 * compared with their record, and the scan's plan read back through `db.explain`.
 *
 * - **The round trip.** Every entry of each package's export is held to canonical equality with the
 *   record its import wrote, and byte equality is reported, per package, as the test's annotation.
 *   The oracle is a universal one: export ∘ import is the identity up to Canonical XML.
 * - **Paging is invisible.** A scan in pages of 1 and of 7 rows writes the bytes the default page
 *   size writes: the metamorphic relation of `pages.test.ts`, with the database's own cursors.
 * - **The containers.** An export to a directory and one to a zip compare with the source package
 *   byte for byte where the record is written back, and canonically where a document is rebuilt.
 * - **One flight per page.** Every document's scan explains to the same statements, one for the
 *   scan's rows and one for each attachment, whatever the document: a page's cost does not grow
 *   with the rows it holds.
 * - **The plan audit.** The scan's own statement reads `Node` by an index in `start` order, with no
 *   sort, and no statement of it recurses.
 * - **The export charset.** A document is written in its `Document` row's export charset: `latin1`'s
 *   `choice.xml` in ISO-8859-1, a character that charset lacks as a character reference, and
 *   `windows-1252`'s, which no encoder writes, in UTF-8, its declaration naming it.
 */
import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import type { Plan, Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { compareWithRecord, exportEntries, exportPackage } from "#pantry/export/package.ts";
import { documentScan, documentsOf } from "#pantry/export/scan.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readPackage } from "#pantry/package/read.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The directory every export is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The corpus packages the import accepts (`verdicts/qti-examples-0a92fbb.tsv`), each materialized
 * as the import reads it: `simple` and `sharedMedia` as directories, `svg` as its zip.
 */
const accepted = [
  { name: "simple", source: materialize("simple") },
  { name: "sharedMedia", source: materialize("sharedMedia") },
  { name: "svg", source: materializeZip("svg") },
] as const;

/**
 * The statements one page of `documentScan` runs in its flight: one for the `Node` rows, one for
 * each of the seven attachments on a node (comment, instruction, doctype, foreign element name,
 * `Document` row, attributes, namespace declarations), and one for each of the two on an attribute
 * (entity references, open name). An attachment over exact parents is pipelined, its own statement
 * in the parent's flight and snapshot (the engine's `lower/shapes/attach/index.ts`,
 * `chooseAttachment`), so the count is the scan's shape and no row's.
 */
const scanStatements = 10;

/**
 * The plan node types that make a statement recursive: a recursive CTE's union and its working
 * table.
 */
const recursive: ReadonlySet<string> = new Set(["Recursive Union", "WorkTable Scan"]);

/**
 * The plan node types that sort.
 */
const sorts: ReadonlySet<string> = new Set(["Sort", "Incremental Sort"]);

/**
 * The plan node types that read a relation through an index, in the index's order.
 */
const indexScans: ReadonlySet<string> = new Set(["Index Scan", "Index Only Scan"]);

/**
 * List a plan's node types, the plan's own first, then each child's in order.
 *
 * @param plan - The plan.
 * @returns Every node type the plan holds.
 */
const nodeTypesOf = (plan: Plan): readonly string[] => [
  plan.node,
  ...plan.children.flatMap(nodeTypesOf),
];

/**
 * Count a report's outcomes by kind.
 *
 * @param report - The comparison.
 * @returns The number of byte-identical, canonical-equal and differing paths.
 */
const tally = (report: Report) => ({
  byteIdentical: report.filter(({ outcome }) => outcome.kind === "byte-identical").length,
  canonicalEqual: report.filter(({ outcome }) => outcome.kind === "canonical-equal").length,
  differing: report.filter(({ outcome }) => outcome.kind === "differs").length,
});

/**
 * The accepted packages as one import of each put them in the database: each package's name, its
 * source and the id its import answered, in {@link accepted} order.
 */
class Imported extends Context.Service<
  Imported,
  readonly { readonly dir: string; readonly id: Uuid; readonly name: string }[]
>()("pantry/export/package.db.test/Imported") {}

/**
 * The database and the platform every test here runs on, with each accepted package imported
 * once, for every test of the file to export and compare.
 */
const TestLayer = Layer.effect(
  Imported,
  Effect.forEach(
    accepted,
    ({ name, source }) =>
      Effect.gen(function* importOne() {
        const dir = yield* source;

        return { dir, id: yield* importPackage(dir), name };
      }),
    { concurrency: 1 },
  ),
).pipe(Layer.provideMerge(Layer.mergeAll(AuthorAppLayer, NodeServices.layer)));

/**
 * The timeout, in milliseconds, of the hook that builds {@link TestLayer}: the author layer's own
 * budget, and a lease write's for the three imports it runs.
 */
const importHookTimeoutMs = authorLayerHookTimeoutMs + leaseTestTimeoutMs;

/**
 * Import a fixture of `simple`'s shape and export it.
 *
 * @param dir - The fixture's directory.
 * @returns The bytes the export writes for its item, `choice.xml`.
 */
const exportedChoice = (dir: string) =>
  Effect.gen(function* exportChoice() {
    const entries = yield* exportEntries(yield* importPackage(dir));
    const choice = entries.find((entry) => entry.path === "choice.xml");

    assert.isDefined(choice, dir);

    return choice?.bytes ?? new Uint8Array();
  });

describe.skipIf(!hasLease)(
  "export/package.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(TestLayer, { excludeTestServices: true, timeout: importHookTimeoutMs })(
      "the export of the accepted packages",
      (it) => {
        it.effect(
          "exports every accepted package canonically equal to its record, reporting the bytes it writes back",
          (ctx) =>
            Effect.gen(function* roundTrip() {
              for (const { id, name } of yield* Imported) {
                const report = yield* compareWithRecord(id);
                const counts = tally(report);

                assert.strictEqual(counts.differing, 0, `${name}:\n${renderReport(report)}`);
                yield* Effect.promise(() =>
                  ctx.annotate(
                    `${name}: ${String(counts.byteIdentical)} byte-identical, ${String(counts.canonicalEqual)} canonical-equal of ${String(report.length)}`,
                  ),
                );
              }
            }),
        );

        it.effect("writes the same bytes whatever size its scan's pages are", () =>
          Effect.gen(function* everyPageSize() {
            for (const { id, name } of yield* Imported) {
              const whole = yield* exportEntries(id);
              for (const size of [1, 7]) {
                assert.deepStrictEqual(
                  yield* exportEntries(id, size),
                  whole,
                  `${name} at ${String(size)}`,
                );
              }
            }
          }),
        );

        it.effect(
          "exports to a directory and to a zip that compare with the source package and hold the same entries",
          () =>
            Effect.gen(function* containers() {
              const fs = yield* FileSystem.FileSystem;

              yield* fs.makeDirectory(workDirectory, { recursive: true });

              const parent = yield* fs.makeTempDirectoryScoped({
                directory: workDirectory,
                prefix: "export-db-test-",
              });
              for (const { dir, id, name } of yield* Imported) {
                const directory = `${parent}/${name}`;
                const zip = `${parent}/${name}.zip`;

                yield* exportPackage(id, directory);
                yield* exportPackage(id, zip);

                for (const target of [directory, zip]) {
                  const report = yield* comparePackage(dir, target);

                  assert.strictEqual(
                    tally(report).differing,
                    0,
                    `${target}:\n${renderReport(report)}`,
                  );
                }

                assert.deepStrictEqual(yield* readPackage(zip), yield* readPackage(directory));
              }
            }).pipe(Effect.scoped),
        );

        it.effect(
          "scans every document in one flight of the same statements, by an index in start order, with no sort and no recursion",
          () =>
            Effect.gen(function* planAudit() {
              const db = yield* Db.open(AuthorApp.roles.author, {});
              for (const { id, name } of yield* Imported) {
                const documents = yield* (yield* db.execute(documentsOf, { package: id })).collect;

                assert.isAbove(documents.length, 0, name);
                for (const { node, path: entry } of documents) {
                  const plans = yield* db.explain(documentScan, { document: node });
                  const [scan] = plans;
                  const where = `${name} ${entry}`;

                  assert.strictEqual(plans.length, scanStatements, where);
                  assert.isDefined(scan, where);
                  if (scan !== undefined) {
                    const types = nodeTypesOf(scan);

                    assert.isTrue(
                      types.some((type) => indexScans.has(type)),
                      `${where}: ${types.join(" > ")}`,
                    );
                    assert.isFalse(
                      types.some((type) => sorts.has(type)),
                      `${where}: ${types.join(" > ")}`,
                    );
                  }

                  for (const plan of plans) {
                    assert.isFalse(
                      nodeTypesOf(plan).some((type) => recursive.has(type)),
                      where,
                    );
                  }
                }
              }
            }),
        );

        it.effect(
          "writes latin1's document in ISO-8859-1 with a character reference, and windows-1252's in UTF-8, declared",
          () =>
            Effect.gen(function* exportCharsets() {
              const latin1 = yield* exportedChoice(yield* materialize("latin1"));
              const windows1252 = yield* exportedChoice(yield* materialize("windows-1252"));
              const text = new TextDecoder("utf-8", { fatal: true }).decode(windows1252);

              assert.strictEqual(latin1.filter((byte) => byte === 0x85).length, 1);
              assert.include(Buffer.from(latin1).toString("latin1"), "&#x20AC;");
              assert.include(text.slice(0, text.indexOf("?>")), 'encoding="UTF-8"');
            }),
        );
      },
    );
  },
);
