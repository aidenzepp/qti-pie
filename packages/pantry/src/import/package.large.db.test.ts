/**
 * A package past one Bind message (plan W5, Q5.20; fin.md §4.5a; the operator's ruling of
 * 2026-11-05 on issue #3): the every-relation package (`#pantry/test/gen/every-relation.ts`) with a
 * bulk of binary entries whose record, as grizzle writes it, is longer than PostgreSQL's longest
 * message, imported in one transaction and exported back equal.
 *
 * A package's record is one `Entry` family under its `Package` row, every entry's bytes as read in
 * a grizzle `bytes` field (`#pantry/import/record.ts`), written in one ChangeSet step, at most
 * grizzle's `bytesMaxLength` bytes a value. grizzle 1.0.0-beta.1 writes a family member's bytes as
 * their hex text, `\x` and two digits a byte, in a text array (grizzle-engine
 * `scalar/values/bytes.ts` `bytesText`), not in binary as its README says. One statement's Bind
 * message carries at most 1,073,741,822 bytes (PostgreSQL's `PQ_LARGE_MESSAGE_LIMIT`, grizzle's
 * `messageMaxBytes`). A family past it is written by grizzle as one count update and consecutive
 * inserts in ascending slot order, in the same transaction, and never refused as `InputTooLarge`
 * (fin.md §4.5a, grizzle's W2.P1). So the importer never splits a package: the whole package is one
 * transaction, however large.
 *
 * The bulk is 8 entries of 64 MiB: 512 MiB of bytes, whose text is past the Bind bound. Twice as
 * many, past it in raw bytes, make about 2 GiB of text, which grizzle 1.0.0-beta.1 sends as one
 * TLS write that Node refuses (`SSL_write` takes an `int` length), so it loses the connection after
 * sending COMMIT and answers `CommitUnknown`. The bulk returns to 16 once grizzle writes a family's
 * bytes in binary and bounds a flight.
 *
 * Written to run at N1 on the lease, never by a hand. The import holds each entry's bytes once as
 * read, 512 MiB outside the JavaScript heap, and grizzle's write holds for each value an admitted
 * copy, its hex text as the fact's identity and again as its row's text, and each statement's
 * literal: up to 2.8 GB of heap outlived a full collection during the apply, from 0.6 GB before
 * it. The export reads the record in one result, every value's hex text beside its bytes. Measured
 * 2026-11-07, this ran out of heap under `--max-old-space-size` 2,560 MiB and passed under 3,072;
 * the database project's workers run with twice the least both large files passed under
 * (`vite.config.ts`), until grizzle's after-beta "bytes past 268,435,443" item removes those
 * copies. On disk the bulk's entries are hard links to one file, and the export writes them out
 * whole under the package's `work/`, removed when the test ends.
 *
 * @see {@link https://www.postgresql.org/docs/19/protocol-message-formats.html | PostgreSQL 19, §54.7 Message Formats}
 */
import { bytesMaxLength, Db, messageMaxBytes } from "@bjornpagen/grizzle";
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
 * The bytes of each bulk entry: 64 MiB, one `bytes` value within grizzle's `bytesMaxLength`.
 */
const bulkEntryBytes = 64 * 1024 * 1024;

/**
 * The text grizzle's family write carries for one bulk entry: its hex form, `\x` and two digits a
 * byte (grizzle-engine `scalar/values/bytes.ts` `bytesText`).
 */
const bulkEntryTextBytes = "\\x".length + 2 * bulkEntryBytes;

/**
 * The bulk's entries: the fewest whose text, as the family write carries it, is past
 * {@link messageMaxBytes}: 8.
 */
const bulkEntries = Math.floor(messageMaxBytes.value / bulkEntryTextBytes) + 1;

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
          // 8 bulk entries of 64 MiB, the fewest whose text passes the Bind bound.
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
            assert.isAbove(
              bulkEntries * bulkEntryTextBytes,
              messageMaxBytes.value,
              "the bulk's text fits one Bind message",
            );

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
