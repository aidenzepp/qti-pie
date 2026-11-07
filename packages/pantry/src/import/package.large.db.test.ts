/**
 * A package past one Bind message (plan W5, Q5.20; fin.md §4.5a; the operator's ruling of
 * 2026-11-05 on issue #3): the every-relation package (`#pantry/test/gen/every-relation.ts`) with a
 * bulk of binary entries whose record alone is longer than PostgreSQL's longest message, imported
 * in one transaction and exported back equal.
 *
 * A package's record is one `Entry` family under its `Package` row, every entry's bytes as its
 * canonical base64 (`#pantry/import/record.ts`), written in one ChangeSet step. One statement's
 * Bind message carries at most 1,073,741,822 bytes (PostgreSQL's `PQ_LARGE_MESSAGE_LIMIT`,
 * grizzle's `messageMaxBytes`), and one array literal at most 536,870,888 UTF-16 code units (V8's
 * longest string, `maxStringLength`). A family past either is written by grizzle as one count
 * update and consecutive inserts in ascending slot order, in the same transaction, and never
 * refused as `InputTooLarge` (fin.md §4.5a, grizzle's W2.P1). So the importer never splits a
 * package: the whole package is one transaction, however large.
 *
 * Written to run at N1 on the lease, never by a hand. It holds about 1.1 GB of base64 text on the
 * JavaScript heap at once, the record as the import builds it and again as the export reads it,
 * within Node's default heap of about 4 GB; on disk the bulk's entries are hard links to one file,
 * and the export writes them out whole under the package's `work/`, removed when the test ends.
 *
 * @see {@link https://www.postgresql.org/docs/19/protocol-message-formats.html | PostgreSQL 19, §54.7 Message Formats}
 */
import { Db } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Duration, Effect, FileSystem, Layer, Option, Path } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import { authorRole, loginSession, rowsOf } from "#pantry/test/direct-sql.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The longest Bind message a PostgreSQL 19 backend reads, as its length word counts it: grizzle's
 * `messageMaxBytes`, from `PQ_LARGE_MESSAGE_LIMIT` (grizzle's README, "Limits": "One statement's
 * parameters are at most 1,073,741,822 bytes"). grizzle's public API does not export it.
 *
 * @see {@link https://github.com/postgres/postgres/blob/REL_19_RC1/src/include/libpq/libpq.h#L34 | libpq.h, PQ_LARGE_MESSAGE_LIMIT, one less than MaxAllocSize}
 */
const messageMaxBytes = 1_073_741_822;

/**
 * The bytes of each bulk entry: 64 MiB, whose base64 is 89,478,488 characters, so the literal
 * bound admits five of them in one statement and the Bind bound twelve.
 */
const bulkEntryBytes = 64 * 1024 * 1024;

/**
 * The length of the canonical base64 of a byte string, padded (RFC 4648, §4).
 *
 * @param bytes - The byte string's length.
 * @returns Its base64's length, in characters, which are its UTF-8 bytes.
 */
const base64Length = (bytes: number): number => 4 * Math.ceil(bytes / 3);

/**
 * The bulk's entries: the fewest whose record content alone is past {@link messageMaxBytes}.
 */
const bulkEntries = Math.floor(messageMaxBytes / base64Length(bulkEntryBytes)) + 1;

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
         FROM qti.entry e JOIN qti.package p ON p.id = e.package
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
          // 12 bulk entries of 64 MiB, the fewest past the Bind bound.
          Effect.gen(function* pastOneBind() {
            const fs = yield* FileSystem.FileSystem;
            const path = yield* Path.Path;
            const entries = everyRelationPackage(
              { choices: 3, hotspots: 2, hottexts: 2 },
              { bytes: new Uint8Array(bulkEntryBytes), entries: bulkEntries },
            );
            const recordBytes = [...entries.values()].reduce(
              (sum, bytes) => sum + base64Length(bytes.length),
              0,
            );

            assert.isAbove(recordBytes, messageMaxBytes, "the record fits one Bind message");

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
