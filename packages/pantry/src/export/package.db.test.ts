/**
 * The export on the lease: three packages the import accepts, one per kind of storage the scan
 * reads back, imported, exported and compared with their record, and the scan's plan read back
 * through `db.explain`. The rendering itself is the host's, held generatively on the free tier
 * (`model/unshred.test.ts`, `test/attribute-order.export.test.ts`, `export/pages.test.ts`); what
 * only the lease holds is that the rows the database stores and the served scan returns are the
 * ones the import wrote.
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
 * - **The plan audit.** The scan reads `Node` through an index of the derived key `(document,
 *   start)`, by an index scan, an index-only scan or a bitmap index scan, and never by a sequential
 *   scan, and no statement of it recurses. Only `Node`'s reads are held to an index: the
 *   attachments' tables are read however PostgreSQL's cost model plans them, and a sequential scan
 *   of a small one is its choice, as is which of the indexes over `(document, start)` reads `Node`
 *   and whether a small document's rows are sorted after a bitmap scan. The contract's order is the
 *   scan's output: every document's rows come back in `start` order.
 * - **The export charset.** A document is written in its `Document` row's export charset: `latin1`'s
 *   `choice.xml` in ISO-8859-1, a character that charset lacks as a character reference, and
 *   `windows-1252`'s, which no encoder writes, in UTF-8, its declaration naming it.
 */
import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import type { Plan, Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Option, Schema } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { compareWithRecord, exportEntries, exportPackage } from "#pantry/export/package.ts";

import { importDir } from "#pantry/test/import-dir.ts";
import { readEntries } from "#pantry/package/read.ts";
import { authorRole, loginSession, qtiSchema, rowsOf } from "#pantry/test/direct-sql.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { AuthorLogin, servedPath } from "#pantry/db/served.ts";
import { explainMember } from "@bjornpagen/grizzle/compile";

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
 * The plan node types that read a relation through an index: in the index's order, from the index
 * alone, or as the heap scan over a bitmap of the index's matches.
 */
const indexReads: ReadonlySet<string> = new Set([
  "Bitmap Heap Scan",
  "Index Only Scan",
  "Index Scan",
]);

/**
 * One node of PostgreSQL's `EXPLAIN (FORMAT JSON, VERBOSE)` plan, read for what the plan audit
 * reads: its type, the relation it scans and that relation's schema, the index it reads, and its
 * children. grizzle's `Plan` (`explainMember`) keeps each node's type and estimates and drops the
 * relation and the index (grizzle's `adapter/explain/plan.ts`), so the audit plans the scan's
 * statement again to see which relation each scan reads.
 */
interface ShownPlan {
  readonly "Index Name"?: string;
  readonly "Node Type": string;
  readonly Plans?: readonly ShownPlan[];
  readonly "Relation Name"?: string;
  readonly Schema?: string;
}

/**
 * The schema of a {@link ShownPlan}.
 */
const ShownPlanSchema: Schema.Codec<ShownPlan> = Schema.Struct({
  "Index Name": Schema.optionalKey(Schema.String),
  "Node Type": Schema.String,
  Plans: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<ShownPlan> => ShownPlanSchema)),
  ),
  "Relation Name": Schema.optionalKey(Schema.String),
  Schema: Schema.optionalKey(Schema.String),
});

/**
 * The schema of an `EXPLAIN (FORMAT JSON)` answer's one value: one object holding the root node.
 */
const ExplainedSchema = Schema.Tuple([Schema.Struct({ Plan: ShownPlanSchema })]);

/**
 * The schema of the author login's served file, read for the SQL text of each read member's
 * statement, as `grizzle generate` compiled it for the author role: the text `explainMember` plans
 * for a read or a paged member (its `read`), which the audit plans again with its relations and
 * indexes shown.
 */
const ServedReadsSchema = Schema.fromJsonString(
  Schema.Struct({
    roles: Schema.Struct({
      "~a": Schema.Array(
        Schema.Struct({
          members: Schema.Struct({
            "~a": Schema.Array(
              Schema.Struct({
                name: Schema.String,
                read: Schema.optionalKey(
                  Schema.Struct({
                    source: Schema.Struct({
                      statement: Schema.Struct({
                        spec: Schema.Struct({ text: Schema.Struct({ sql: Schema.String }) }),
                      }),
                    }),
                  }),
                ),
              }),
            ),
          }),
        }),
      ),
    }),
  }),
);

/**
 * Read the SQL text of the statement the author role's served `documentScan` runs.
 *
 * @returns The text, none where the served file holds no such read member.
 */
const scanTextOf = Effect.gen(function* scanText() {
  const fs = yield* FileSystem.FileSystem;
  const file = yield* Schema.decodeUnknownEffect(ServedReadsSchema)(
    yield* fs.readFileString(servedPath),
  );

  return Option.fromNullishOr(
    file.roles["~a"]
      .flatMap(({ members }) => members["~a"])
      .find(({ name }) => name === "documentScan")?.read?.source.statement.spec.text.sql,
  );
});

/**
 * Plan one statement as the author role, in a read-only transaction that is rolled back, and read
 * the plan with each scan's relation, schema and index.
 *
 * @param client - A session of the author login.
 * @param text - The statement's SQL text, its one parameter the document.
 * @param document - The document's node.
 * @returns The plan's root node.
 */
const shownPlanOf = (client: Client, text: string, document: string) =>
  Effect.gen(function* shownPlan() {
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY");
    yield* rowsOf(client, `SET LOCAL ROLE ${authorRole}`);

    const rows = yield* rowsOf<{ readonly "QUERY PLAN": unknown }>(
      client,
      `EXPLAIN (FORMAT JSON, VERBOSE) ${text}`,
      [document],
    );
    const [{ Plan: root }] = yield* Schema.decodeUnknownEffect(ExplainedSchema)(
      rows[0]?.["QUERY PLAN"],
    );

    return root;
  }).pipe(Effect.ensuring(Effect.ignore(rowsOf(client, "ROLLBACK"))));

/**
 * List the index of each bitmap index scan below a node of a shown plan.
 *
 * @param plan - The node, a bitmap heap scan.
 * @returns The indexes, in plan order.
 */
const bitmapIndexesOf = (plan: ShownPlan): readonly string[] =>
  (plan.Plans ?? []).flatMap((child) => [
    ...(child["Node Type"] === "Bitmap Index Scan" && child["Index Name"] !== undefined
      ? [child["Index Name"]]
      : []),
    ...bitmapIndexesOf(child),
  ]);

/**
 * One scan of `Node` in a shown plan: its node type, and the indexes it reads, its own or, for a
 * bitmap heap scan, its bitmap index scans'.
 */
interface NodeRead {
  readonly indexes: readonly string[];
  readonly type: string;
}

/**
 * List every scan of `Qti`'s `Node` table in a shown plan, the node's own first, then each
 * child's in order.
 *
 * @param plan - The shown plan.
 * @returns The scans.
 */
const nodeReadsOf = (plan: ShownPlan): readonly NodeRead[] => [
  ...(plan["Relation Name"] === "node" && plan.Schema === qtiSchema
    ? [
        {
          indexes:
            plan["Node Type"] === "Bitmap Heap Scan"
              ? bitmapIndexesOf(plan)
              : Option.toArray(Option.fromNullishOr(plan["Index Name"])),
          type: plan["Node Type"],
        },
      ]
    : []),
  ...(plan.Plans ?? []).flatMap(nodeReadsOf),
];

/**
 * Whether a plan's scans of `Node` all read it through an index of `ordered`, an index scan, an
 * index-only scan or a bitmap heap scan over bitmap index scans of it, and at least one does: a
 * sequential scan of `Node`, or a read through any other index, fails it. Scans of other tables
 * are not read.
 *
 * @param reads - The plan's scans of `Node` ({@link nodeReadsOf}).
 * @param ordered - The indexes of `Node` that lead with `(document, start)`.
 * @returns Whether they do.
 */
const readsNodeInOrder = (reads: readonly NodeRead[], ordered: ReadonlySet<string>): boolean =>
  reads.length > 0 &&
  reads.every(
    ({ indexes, type }) =>
      indexReads.has(type) && indexes.length > 0 && indexes.every((name) => ordered.has(name)),
  );

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
          "scans every document in one statement, reading Node through the (document, start) key's index, in start order, with no recursion",
          () =>
            // Oracle: PostgreSQL's planner and the scan's own output. The catalogue names the key
            // by grizzle's comment on it, and every index of Node that leads with `document`
            // continues with `start`, so a read of Node through one of them reads the key's order.
            // grizzle's plans count the scan's statements and show no recursion; the same
            // statement, planned again with its relations and indexes shown, shows how it reads
            // Node, and only Node: its attachments' tables are the cost model's to plan.
            // Bound: every document of the accepted packages.
            Effect.gen(function* planAudit() {
              const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
              const client = yield* loginSession;
              const scanText = Option.getOrUndefined(yield* scanTextOf);
              assert.isDefined(scanText, "the served documentScan's statement");

              const key = yield* rowsOf<{ readonly name: string }>(
                client,
                `SELECT c.conname AS name FROM pg_catalog.pg_constraint c
                  WHERE c.conrelid = '${qtiSchema}.node'::regclass AND c.contype = 'u'
                    AND pg_catalog.obj_description(c.oid, 'pg_constraint') = 'key Node(document, start)'`,
              );
              const byDocument = yield* rowsOf<{
                readonly columns: readonly string[];
                readonly name: string;
              }>(
                client,
                `SELECT i.relname AS name,
                        ARRAY(SELECT a.attname::text
                                FROM unnest(x.indkey::int2[]) WITH ORDINALITY AS k(n, o)
                                JOIN pg_catalog.pg_attribute a
                                  ON a.attrelid = x.indrelid AND a.attnum = k.n
                               ORDER BY k.o) AS columns
                   FROM pg_catalog.pg_index x
                   JOIN pg_catalog.pg_class i ON i.oid = x.indexrelid
                  WHERE x.indrelid = '${qtiSchema}.node'::regclass`,
              ).pipe(Effect.map((rows) => rows.filter(({ columns }) => columns[0] === "document")));

              assert.lengthOf(key, 1, "the key Node(document, start)");
              assert.includeMembers(
                byDocument.map(({ name }) => name),
                key.map(({ name }) => name),
                "the key's index leads with document",
              );
              for (const { columns, name } of byDocument) {
                assert.strictEqual(columns[1], "start", `${name} continues with start`);
              }

              const ordered = new Set(byDocument.map(({ name }) => name));

              for (const { id, name } of yield* Imported) {
                const documents = (yield* (yield* db.workload.entriesOf.execute({ package: id }))
                  .collect).flatMap(({ document, path: entry }) =>
                  Option.toArray(document).map(({ node }) => ({ entry, node })),
                );

                assert.isAbove(documents.length, 0, name);
                for (const { entry, node } of documents) {
                  const plans = yield* explainMember(
                    (yield* AuthorLogin).roles.author,
                    "documentScan",
                    { kind: "params", params: { document: node } },
                    {},
                  );
                  const where = `${name} ${entry}`;

                  assert.strictEqual(plans.length, scanStatements, where);
                  if (scanText !== undefined) {
                    const reads = nodeReadsOf(yield* shownPlanOf(client, scanText, node));

                    assert.isTrue(
                      readsNodeInOrder(reads, ordered),
                      `${where}: Node read by ${reads.map(({ indexes, type }) => `${type} on ${indexes.join(", ") || "no index"}`).join("; ") || "no scan"}, not by an index of ${[...ordered].join(", ")}`,
                    );
                  }

                  const starts = (yield* (yield* db.workload.documentScan.execute({
                    document: node,
                  })).collect).map(({ start }) => start);
                  assert.isTrue(
                    starts.every((start, at) => at === 0 || (starts[at - 1] ?? start) < start),
                    `${where}: the scan's rows in start order`,
                  );

                  for (const plan of plans) {
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
