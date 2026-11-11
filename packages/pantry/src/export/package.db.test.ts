/**
 * The export on the lease: three packages the import accepts, one per kind of storage the scan
 * reads back, imported, exported and compared with their record, and the scan's plan read back
 * through its served member, `db.workload.documentScan.explain`. The rendering itself is the
 * host's, held generatively on the free tier (`model/unshred.test.ts`,
 * `test/attribute-order.export.test.ts`, `export/pages.test.ts`); what only the lease holds is that
 * the rows the database stores and the served scan returns are the ones the import wrote.
 *
 * - **The round trip.** Every entry of each package's export is held to canonical equality with the
 *   record its import wrote, and byte equality is reported, per package, as the test's annotation.
 *   The oracle is a universal one: export ∘ import is the identity up to Canonical XML.
 * - **Paging is invisible.** A scan of `simple` in pages of 1 and of 7 rows writes the bytes the
 *   default page size writes: the metamorphic relation of `pages.test.ts`, with the database's own
 *   cursors. One package crosses page boundaries at both sizes; the relation is the scan's, not the
 *   package's.
 * - **The containers.** An export of `simple` and of `svg` to a directory and to a zip compare with
 *   the source package byte for byte where the record is written back, and canonically where a
 *   document is rebuilt.
 * - **One statement per page.** Every document's scan explains to one statement, its attachments
 *   lowered into it, whatever the document: a page's cost does not grow with the rows it holds.
 * - **The plan audit.** The scan reads `Node` only through an index whose key columns in the
 *   committed snapshot lead with `(document, start)` (grizzle's `indexesOf`), by an index scan, an
 *   index-only scan or a bitmap index scan, and never by a sequential scan, and no statement of it
 *   recurses. Only `Node`'s reads are held to an index: the attachments' tables are read however
 *   PostgreSQL's cost model plans them, and a sequential scan of a small one is its choice, as is
 *   which of those indexes reads `Node` and whether a small document's rows are sorted after a
 *   bitmap scan. The contract's order is the scan's output: every document's rows come back in
 *   `start` order.
 * - **The export charset.** A document is written in its `Document` row's export charset: `latin1`'s
 *   `choice.xml` in ISO-8859-1, a character that charset lacks as a character reference, and
 *   `windows-1252`'s, which no encoder writes, in UTF-8, its declaration naming it.
 */
import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import type { Plan, Uuid } from "@bjornpagen/grizzle";
import { indexesOf } from "@bjornpagen/grizzle/compile";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { compareWithRecord, exportEntries, exportPackage } from "#pantry/export/package.ts";

import { importDir } from "#pantry/test/import-dir.ts";
import { readEntries } from "#pantry/package/read.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { AuthorLogin } from "#pantry/db/served.ts";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };

/**
 * The directory every export is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The packages the import accepts, each materialized as the import reads it, one per kind of
 * storage the scan reads back: `simple`, a directory of QTI documents; `svg`, a zip whose item
 * holds a foreign element under its own namespace (`verdicts/qti-examples-0a92fbb.tsv`); and
 * `data-entity`, `data-*` attributes with an entity reference (held by
 * `fixtures.data.oracle.test.ts`).
 */
const accepted = [
  { name: "simple", source: materialize("simple") },
  { name: "svg", source: materializeZip("svg") },
  { name: "data-entity", source: materialize("data-entity") },
] as const;

/**
 * The packages the container test exports to a directory and to a zip: one read from a directory
 * and one from a zip.
 */
const containerPackages: ReadonlySet<string> = new Set(["simple", "svg"]);

/**
 * The statements one page of `documentScan` runs: one. Since grizzle's ATTACH-02 (698880ac), a read
 * with attachments is one statement, with its attachments lowered into it. The scan's fifteen
 * pieces (the `Node` rows, the nine attachments on a node, the XML declaration with its encoding
 * and standalone, and an attribute's entity references and open name) used to be fifteen pipelined
 * statements in one flight. So the count is the scan's shape and no row's.
 */
const scanStatements = 1;

/**
 * The plan node types that make a statement recursive: a recursive CTE's union and its working
 * table.
 */
const recursive: ReadonlySet<string> = new Set(["Recursive Union", "WorkTable Scan"]);

/**
 * List every node of a plan that reads `Qti`'s `Node`, by its relation or through one of its
 * indexes, as grizzle names what each node reads (`on`), the node's own first, then each child's
 * in order.
 *
 * @param plan - The plan.
 * @returns The nodes.
 */
const nodeReadsOf = (plan: Plan): readonly Plan[] => [
  ...((plan.on.kind === "relation" || plan.on.kind === "index") && plan.on.relation === "Node"
    ? [plan]
    : []),
  ...plan.children.flatMap(nodeReadsOf),
];

/**
 * The key columns an index of `Node` leads with to serve the scan, in order: `(document, start)`,
 * each ascending.
 */
const documentStart = ["document", "start"] as const;

/**
 * The indexes of `Node` that lead with `(document, start)`, by name, read from the committed
 * snapshot's index key columns (grizzle's `indexesOf`).
 */
const accessIndexesOfNode = Effect.map(
  Effect.fromResult(indexesOf(snapshot)),
  (indexes): ReadonlySet<string> =>
    new Set(
      [...(indexes.get("Node") ?? [])].flatMap(([name, { columns }]) =>
        documentStart.every((field, at) => {
          const column = columns[at];

          return column?.kind === "field" && column.field === field && column.direction === "asc";
        })
          ? [name]
          : [],
      ),
    ),
);

/**
 * Whether a plan reads `Node` only through indexes of `earned`, and through at least one: every
 * node on one of `Node`'s indexes (an index scan, an index-only scan or a bitmap index scan) reads
 * one of `earned`, and every node on `Node` itself is a bitmap heap scan, which reads the heap
 * over its bitmap index scans' matches. A sequential scan of `Node`, or a read through any other
 * index, fails it. Nodes on other relations are not read.
 *
 * @param reads - The plan's nodes that read `Node` ({@link nodeReadsOf}).
 * @param earned - The indexes of `Node` the workload's access earned ({@link accessIndexesOfNode}).
 * @returns Whether they do.
 */
const readsNodeByAccess = (reads: readonly Plan[], earned: ReadonlySet<string>): boolean =>
  reads.some(({ on }) => on.kind === "index") &&
  reads.every(({ node, on }) =>
    on.kind === "index" ? earned.has(on.index.name) : node === "Bitmap Heap Scan",
  );

/**
 * Describe a plan's reads of `Node`, for a failure's message.
 *
 * @param reads - The plan's nodes that read `Node` ({@link nodeReadsOf}).
 * @returns Each node's type and the index it reads, if any.
 */
const describeReads = (reads: readonly Plan[]): string =>
  reads
    .map(({ node, on }) => (on.kind === "index" ? `${node} on ${on.index.name}` : node))
    .join("; ") || "no scan";

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

        return { dir, id: yield* importDir(dir), name };
      }),
    { concurrency: 1 },
  ),
).pipe(Layer.provideMerge(Layer.mergeAll(AuthorAppLayer, NodeServices.layer)));

/**
 * The timeout, in milliseconds, of the hook that builds {@link TestLayer}: the author layer's load,
 * which compiles nothing, and the imports it runs, each a lease write, given twice a lease test's
 * budget. A measurement of the hook on the lease is owed after the repin.
 */
const importHookTimeoutMs = 2 * leaseTestTimeoutMs;

/**
 * Import a fixture of `simple`'s shape and export it.
 *
 * @param dir - The fixture's directory.
 * @returns The bytes the export writes for its item, `choice.xml`.
 */
const exportedChoice = (dir: string) =>
  Effect.gen(function* exportChoice() {
    const entries = yield* exportEntries(yield* importDir(dir));
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

        it.effect("writes simple's bytes whatever size its scan's pages are", () =>
          Effect.gen(function* everyPageSize() {
            for (const { id, name } of (yield* Imported).filter((one) => one.name === "simple")) {
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
              for (const { dir, id, name } of (yield* Imported).filter((one) =>
                containerPackages.has(one.name),
              )) {
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

                assert.deepStrictEqual(yield* readEntries(zip), yield* readEntries(directory));
              }
            }).pipe(Effect.scoped),
        );

        it.effect(
          "scans every document in one statement, reading Node through an index the workload's access earned, in start order, with no recursion",
          () =>
            // Oracle: PostgreSQL's planner, the committed snapshot's index reasons and the scan's
            // own output. The served member's plans count the scan's statements, show no
            // recursion, and name what each node reads (`on`), so they show how it reads Node, and
            // only Node: its attachments' tables are the cost model's to plan.
            // Bound: every document of the accepted packages.
            Effect.gen(function* planAudit() {
              const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
              const earned = yield* accessIndexesOfNode;

              assert.isAbove(earned.size, 0, "an index of Node the workload's access earned");

              for (const { id, name } of yield* Imported) {
                const documents = (yield* (yield* db.workload.entriesOf.execute({ package: id }))
                  .collect).flatMap(({ document, path: entry }) =>
                  Option.toArray(document).map(({ node }) => ({ entry, node })),
                );

                assert.isAbove(documents.length, 0, name);
                for (const { entry, node } of documents) {
                  const plans = yield* db.workload.documentScan.explain({ document: node });
                  const where = `${name} ${entry}`;

                  assert.strictEqual(plans.length, scanStatements, where);
                  for (const { plan } of plans) {
                    const reads = nodeReadsOf(plan);

                    assert.isTrue(
                      readsNodeByAccess(reads, earned),
                      `${where}: Node read by ${describeReads(reads)}, not by an index of ${[...earned].join(", ")}`,
                    );
                  }

                  const starts = (yield* (yield* db.workload.documentScan.execute({
                    document: node,
                  })).collect).map(({ start }) => start);
                  assert.isTrue(
                    starts.every((start, at) => at === 0 || (starts[at - 1] ?? start) < start),
                    `${where}: the scan's rows in start order`,
                  );

                  for (const { plan } of plans) {
                    assert.isFalse(
                      nodeTypesOf(plan).some((type) => recursive.has(type)),
                      where,
                    );
                  }
                }
              }
            }).pipe(Effect.scoped),
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
