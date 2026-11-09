/**
 * A package past one Bind message (plan W5, Q5.20; fin.md §4.5a; the operator's ruling of
 * 2026-11-05 on issue #3): the every-relation package (`#pantry/test/gen/every-relation.ts`) with a
 * bulk of binary entries whose record alone is longer than PostgreSQL's longest message, imported
 * in one transaction and exported back equal.
 *
 * A package's record is one `Entry` family under its `Package` row, every entry's bytes as read in
 * a grizzle `bytes` field (`#pantry/import/record.ts`), written in one ChangeSet step, at most
 * grizzle's `bytesMaxLength` bytes a value. grizzle sends a family's bytes column as one binary
 * `bytea[]` a statement, each value copied into it once (grizzle-engine `codec/bytea.ts`
 * `byteaArray`), so the record counts its raw bytes. One statement's Bind message carries at most
 * 1,073,741,822 bytes (PostgreSQL's `PQ_LARGE_MESSAGE_LIMIT`, grizzle's `messageMaxBytes`). A
 * family past it is written by grizzle as one count update and consecutive inserts in ascending
 * slot order, in the same transaction and its one flight (`write/family/order.ts`; fin.md §4.5a).
 * So the importer never splits a package: the whole package is one transaction, and one whose
 * flight is past grizzle's `flightMaxBytes` is refused whole before any byte is sent
 * (`qti/package.db.test.ts`).
 *
 * Written to run at N1 on the lease, never by a hand. The import holds each entry's bytes once as
 * read, 1 GiB outside the JavaScript heap, and grizzle's write one copy of each value in its
 * statement's array; the export reads the record in one statement, each value in chunks of 16 MiB
 * (grizzle's `bytesChunkLength`). Measured 2026-11-08 at grizzle `fd4e8b7`, in Node's default heap
 * of 4,192 MiB: the worker's heap peaked at 718 MiB used, 899 MiB committed, beside 3,224 MiB of
 * `ArrayBuffer`s outside it; the import took 26 s and the export 18 s. On disk the bulk's entries
 * are hard links to one file, and the export writes them out whole under the package's `work/`,
 * removed when the test ends.
 *
 * @see {@link https://www.postgresql.org/docs/19/protocol-message-formats.html | PostgreSQL 19, §54.7 Message Formats}
 */
import { bytesMaxLength, Db, flightMaxBytes, messageMaxBytes } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Duration, Effect, FileSystem, Layer, Option, Path } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { AuthorApp } from "#pantry/qti/own-login.ts";
import { Package } from "#pantry/qti/package.ts";
import { authorRole, loginSession, qtiSchema, rowsOf } from "#pantry/test/direct-sql.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The bytes of each bulk entry: 64 MiB, one `bytes` value within grizzle's `bytesMaxLength`, so the
 * Bind bound admits fifteen of them in one statement.
 */
const bulkEntryBytes = 64 * 1024 * 1024;

/**
 * The bulk's entries: the fewest whose record content alone, in raw bytes, is past
 * {@link messageMaxBytes}: 16.
 */
const bulkEntries = Math.floor(messageMaxBytes.value / bulkEntryBytes) + 1;

/**
 * The timeout of the test: it sends past a gibibyte to the server and reads it back.
 */
const largeTimeoutMs = 1_800_000;

/**
 * A session of the author login on the lease, as the author role, which holds SELECT on every table
 * of `Qti` it writes whole, closed with its scope: a direct reader of the tables' system columns.
 */
const authorSession = loginSession.pipe(
  Effect.tap((client) => rowsOf(client, `SET ROLE ${authorRole}`)),
  Effect.orDie,
);

/**
 * Read a package's record against its own row's transaction: how many entries it holds, how many
 * transactions inserted them, and whether the package's row's is one of them.
 *
 * @param client - The session.
 * @param id - The package's id.
 * @returns The counts.
 */
const recordTransactions = (client: Client, id: string) =>
  Effect.tryPromise(() =>
    client.query<{
      readonly entries: string;
      readonly ours: string;
      readonly transactions: string;
    }>(
      `SELECT count(*)::text AS entries,
              count(DISTINCT e.xmin::text)::text AS transactions,
              count(*) FILTER (WHERE e.xmin::text = p.xmin::text)::text AS ours
         FROM ${qtiSchema}.entry e JOIN ${qtiSchema}.package p ON p.id = e.package
        WHERE p.id = $1`,
      [id],
    ),
  ).pipe(
    Effect.map(({ rows }) => ({
      entries: Number(rows[0]?.entries ?? 0),
      ours: Number(rows[0]?.ours ?? 0),
      transactions: Number(rows[0]?.transactions ?? 0),
    })),
    Effect.orDie,
  );

describe.skipIf(!hasLease)(
  "import/package.large.db.test.ts, on the lease",
  { timeout: largeTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("a package whose record is past one Bind message", (it) => {
      it.effect(
        "imports in one transaction as grizzle's chunked appends, and its export compares all equal",
        () =>
          // Oracle: PostgreSQL's system columns and the round trip. Every entry of the record
          // carries its package row's `xmin`, so the one transaction that inserted the package
          // inserted its whole record, though no one statement can carry it; and the export gives
          // back every entry of the source, byte for byte or canonically.
          // Bound: the every-relation package of 3 choices, 2 hottexts and 2 hotspots, with
          // 16 bulk entries of 64 MiB, the fewest past the Bind bound.
          Effect.gen(function* pastOneBind() {
            const fs = yield* FileSystem.FileSystem;
            const path = yield* Path.Path;
            const entries = everyRelationPackage(
              { choices: 3, hotspots: 2, hottexts: 2 },
              { bytes: new Uint8Array(bulkEntryBytes), entries: bulkEntries },
            );
            const recordBytes = [...entries.values()].reduce((sum, bytes) => sum + bytes.length, 0);

            assert.isAtMost(
              bulkEntryBytes,
              bytesMaxLength.value,
              "a bulk entry is one bytes value",
            );
            assert.isAbove(recordBytes, messageMaxBytes.value, "the record fits one Bind message");
            assert.isBelow(recordBytes, flightMaxBytes.value, "the record is past one flight");

            const source = yield* scopedPackage(entries);
            const [importElapsed, id] = yield* Effect.timed(importPackage(source));
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const client = yield* authorSession;
            const record = yield* recordTransactions(client, id);

            assert.isTrue(Option.isSome(yield* db.get(Package, { id })), id);
            assert.deepStrictEqual(record, {
              entries: entries.size,
              ours: entries.size,
              transactions: 1,
            });

            const exported = yield* fs.makeTempDirectoryScoped({
              directory: path.dirname(source),
              prefix: "export-",
            });
            const [exportElapsed] = yield* Effect.timed(exportPackage(id, exported));
            const report = yield* comparePackage(source, exported);
            const rendered = renderReport(report);

            yield* Effect.log("past one Bind message", {
              exportMillis: Duration.toMillis(exportElapsed),
              importMillis: Duration.toMillis(importElapsed),
              recordBytes,
            });

            assert.strictEqual(report.length, entries.size, rendered);
            for (const { outcome } of report) {
              assert.include(["byte-identical", "canonical-equal"], outcome.kind, rendered);
            }
          }).pipe(Effect.scoped),
      );
    });
  },
);
