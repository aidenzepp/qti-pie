/**
 * One transaction per package (plan W5, Q5.20; the operator's ruling of 2026-11-05 on issue #3),
 * over the every-relation package (`#pantry/test/gen/every-relation.ts`), whose import writes a row
 * of every stored relation of `Qti`: its ChangeSet compiles, it imports in one transaction, its
 * export gives back its source, and a failure injected through `WrapApply` while the
 * import's transaction runs leaves no row of it.
 *
 * The oracles are PostgreSQL's own: the catalog and the system columns of every table of the
 * installation, read as the author role by a direct SQL reader (grizzle's README, "Direct SQL
 * access"). A row's `xmin` is the transaction that inserted it and its `cmin` the command within
 * that transaction, so one transaction id over every row an import adds is one transaction, and the
 * commands order the tables it writes. The round trip's oracle is the source itself, by canonical
 * equality (`#pantry/export/compare.ts`).
 *
 * Written to run at N1 on the lease, never by a hand.
 *
 * @see {@link https://www.postgresql.org/docs/19/ddl-system-columns.html | PostgreSQL 19, §5.6 System Columns}
 */
import { CommitUnknown, Db, writableNamesOf } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Layer, Option, Path, Ref, Schedule } from "effect";
import type { Client, QueryResultRow } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage, WrapApply } from "#pantry/import/package.ts";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/own.ts";
import { AuthorApp } from "#pantry/qti/own-login.ts";
import {
  everyRelationPackage,
  scopedPackage,
  memberCounts,
} from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts } from "#pantry/test/gen/every-relation.ts";
import {
  authorRole,
  loginSession,
  qtiSchema,
  rowsOf as sessionRows,
} from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * `Package`'s table, by grizzle's conversion of a relation's name (`grizzle names`).
 */
const packageTable = `${qtiSchema}.package`;

/**
 * The timeout of each test here: every one imports the package once per case of its box.
 */
const boxTimeoutMs = 900_000;

/**
 * The box every test but the injection's exhausts, the generator's whole space.
 */
const memberBox = "every count of 2 or 3 choices, 1 or 2 hottexts and 1 or 2 hotspots";

/**
 * A session of the author login on the lease, over verify-full TLS against the cluster's CA, as the
 * author role, closed with its scope: a direct reader of the catalog and the tables.
 */
const authorSession = loginSession.pipe(
  Effect.tap((client) => sessionRows(client, `SET ROLE ${authorRole}`)),
  Effect.orDie,
);

/**
 * Run one statement on a session and return its rows; a failure is the test's defect.
 *
 * @param client - The session.
 * @param text - The statement.
 * @param values - Its parameters, as text.
 * @returns The rows.
 */
const rowsOf = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly string[] = [],
) => sessionRows<R>(client, text, values).pipe(Effect.orDie);

/**
 * List the tables of the installation the author role reads, each by its quoted qualified name.
 *
 * @param client - The session.
 * @returns The names, sorted.
 */
const tablesOf = (client: Client) =>
  Effect.map(
    rowsOf<{ readonly name: string }>(
      client,
      `SELECT format('%I.%I', n.nspname, c.relname) AS name
         FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = $1 AND c.relkind = 'r' AND has_table_privilege(c.oid, 'SELECT')
        ORDER BY name`,
      [qtiSchema],
    ),
    (rows) => rows.map(({ name }) => name),
  );

/**
 * One table's rows as one transaction left them: how many it holds, how many the transaction
 * inserted, and the first command of the transaction that inserted any.
 */
interface TableRows {
  readonly at: number;
  readonly first: number;
  readonly total: number;
}

/**
 * Read each table's rows against one transaction id.
 *
 * @param client - The session.
 * @param tables - The tables.
 * @param xid - The transaction's id, as `xmin` prints it.
 * @returns Each table's rows, by name; `first` is -1 for a table the transaction inserted into
 *   nothing.
 */
const rowsAt = (client: Client, tables: readonly string[], xid: string) =>
  Effect.forEach(
    tables,
    (table) =>
      rowsOf<{ readonly at: string; readonly first: string; readonly total: string }>(
        client,
        `SELECT count(*) FILTER (WHERE xmin::text = $1)::text AS at,
              coalesce(min(cmin::text::bigint) FILTER (WHERE xmin::text = $1), -1)::text AS first,
              count(*)::text AS total
         FROM ${table}`,
        [xid],
      ).pipe(
        Effect.map((rows): readonly [string, TableRows] => [
          table,
          {
            at: Number(rows[0]?.at ?? 0),
            first: Number(rows[0]?.first ?? -1),
            total: Number(rows[0]?.total ?? 0),
          },
        ]),
      ),
    { concurrency: 1 },
  ).pipe(Effect.map((entries) => new Map(entries)));

/**
 * Count each table's rows.
 *
 * @param client - The session.
 * @param tables - The tables.
 * @returns Each table's count, by name.
 */
const countsOf = (client: Client, tables: readonly string[]) =>
  Effect.forEach(
    tables,
    (table) =>
      rowsOf<{ readonly total: string }>(
        client,
        `SELECT count(*)::text AS total FROM ${table}`,
      ).pipe(Effect.map((rows) => [table, Number(rows[0]?.total ?? 0)] as const)),
    { concurrency: 1 },
  ).pipe(Effect.map((entries) => new Map(entries)));

/**
 * Read the transaction that inserted a package's row.
 *
 * @param client - The session.
 * @param id - The package's id.
 * @returns The transaction's id, as `xmin` prints it.
 */
const packageXid = (client: Client, id: string) =>
  Effect.map(
    rowsOf<{ readonly xmin: string }>(
      client,
      `SELECT xmin::text AS xmin FROM ${packageTable} WHERE id = $1`,
      [id],
    ),
    (rows) => rows[0]?.xmin ?? assert.fail(`no package row has the id ${id}`),
  );

/**
 * Import the every-relation package of member counts, its directory removed with the scope.
 *
 * @param members - The counts it is drawn by.
 * @returns The package's directory and its id.
 */
const importDrawn = (members: MemberCounts) =>
  Effect.gen(function* importsDrawn() {
    const dir = yield* scopedPackage(everyRelationPackage(members));
    const id = yield* importPackage(dir);

    return { dir, id };
  });

/**
 * Where a held table stands among the tables an import writes, ordered by the first command that
 * writes each: the first, the middle and the last.
 */
type HeldAt = "first" | "middle" | "last";

/**
 * What the injected failure found when it fired: whether the import had written another table of
 * the installation before it waited.
 */
type HeldSituation = "held before any other write" | "held after another table's write";

/**
 * The session the import waits on a held table in, as the lock manager shows it.
 */
interface Waiter {
  readonly pid: string;
  /**
   * How many other tables of the installation the session holds a row exclusive lock on: each one
   * an INSERT it has run, since its pipeline parses a statement only after the one before it has
   * run.
   */
  readonly written: number;
}

/**
 * The longest a poll of the lock manager waits for what it looks for: the import reaching the held
 * table, or its session ending once interrupted.
 */
const pollBound = Duration.minutes(1);

/**
 * Wait until a session other than this one waits on a table's lock, polling the lock manager every
 * 10 ms for at most {@link pollBound}.
 *
 * @param client - The session that holds the lock.
 * @param table - The held table.
 * @returns The waiting session; dies when none waits within the bound.
 */
const waitedOn = (client: Client, table: string) =>
  rowsOf<{ readonly pid: string; readonly written: string }>(
    client,
    `SELECT l.pid::text AS pid,
            (SELECT count(DISTINCT o.relation)
               FROM pg_catalog.pg_locks o
               JOIN pg_catalog.pg_class c ON c.oid = o.relation
               JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
              WHERE o.pid = l.pid AND o.granted AND o.mode = 'RowExclusiveLock'
                AND n.nspname = $2 AND o.relation <> l.relation)::text AS written
       FROM pg_catalog.pg_locks l
      WHERE l.locktype = 'relation' AND l.relation = $1::regclass AND NOT l.granted
        AND l.pid <> pg_backend_pid()`,
    [table, qtiSchema],
  ).pipe(
    Effect.flatMap((rows) =>
      rows[0] === undefined ? Effect.fail("not waiting" as const) : Effect.succeed(rows[0]),
    ),
    Effect.retry({ schedule: Schedule.spaced("10 millis") }),
    Effect.timeoutOrElse({
      duration: pollBound,
      orElse: () => Effect.die(new Error(`The import never waited on ${table}'s lock.`)),
    }),
    Effect.orDie,
    Effect.map(({ pid, written }): Waiter => ({ pid, written: Number(written) })),
  );

/**
 * The mode `pg_locks` gives every predicate lock: SIRead locks are the only predicate locks
 * PostgreSQL takes, and the view lists them after the regular locks under this one mode, each under
 * the process id its serializable transaction ran in.
 *
 * @see {@link https://github.com/postgres/postgres/blob/REL_19_RC1/src/backend/utils/adt/lockfuncs.c#L421-L433 | PostgreSQL 19rc1, lockfuncs.c pg_lock_status: the holder's pid from its SERIALIZABLEXACT, and "Currently all predicate locks are SIReadLocks"}
 */
const predicateLockMode = "SIReadLock";

/**
 * Wait until a session holds no lock of its own, polling the lock manager every 10 ms for at most
 * {@link pollBound}: so an interrupted import's transaction, which grizzle's cancel aborts before
 * it destroys the session, has ended before the table it waited on is released. A transaction holds
 * an exclusive lock on its virtual transaction id from its start to its end (PostgreSQL 19, §53.12
 * `pg_locks`), so a session that holds no lock runs no transaction.
 *
 * The SIRead locks `pg_locks` lists under the session's process id are not the session's: the view
 * lists each predicate lock under the process id of the serializable transaction that took it,
 * and PostgreSQL keeps a committed one's "past transaction commit, until overlapping read write
 * transactions complete" (§13.2.3), past its session's end too. Every transaction here is
 * SERIALIZABLE, the holder's included, and so is every transaction of any other installation on
 * the cluster, so they are left out: the earlier transactions the import's session committed stay
 * listed for as long as the holder's runs, which outlives this wait.
 *
 * @param client - The session that holds the held table's lock.
 * @param pid - The session's backend.
 * @returns Nothing; dies when the session still holds a lock of its own after the bound.
 * @see {@link https://www.postgresql.org/docs/19/view-pg-locks.html | PostgreSQL 19, §53.12 pg_locks}
 * @see {@link https://www.postgresql.org/docs/19/transaction-iso.html#XACT-SERIALIZABLE | PostgreSQL 19, §13.2.3 Serializable Isolation Level}
 */
const ended = (client: Client, pid: string) =>
  rowsOf<{ readonly held: string }>(
    client,
    "SELECT count(*)::text AS held FROM pg_catalog.pg_locks WHERE pid = $1::integer AND mode <> $2",
    [pid, predicateLockMode],
  ).pipe(
    Effect.flatMap((rows) =>
      Number(rows[0]?.held ?? 0) === 0 ? Effect.void : Effect.fail("still running" as const),
    ),
    Effect.retry({ schedule: Schedule.spaced("10 millis") }),
    Effect.timeoutOrElse({
      duration: pollBound,
      orElse: () => Effect.die(new Error(`The interrupted import's session ${pid} never ended.`)),
    }),
    Effect.orDie,
  );

describe.skipIf(!hasLease)(
  "import/transaction.db.test.ts, on the lease",
  { timeout: boxTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("one transaction per package, over the every-relation package", (it) => {
      it.effect("compiles the every-relation package's ChangeSet", (ctx) =>
        // Oracle: PostgreSQL's installation through grizzle's compiler: `db.compile` over the
        // package's one ChangeSet (`changeSetOf` of its program) succeeds against the snapshot
        // the database holds.
        // Bound: every count the generator draws, 8 cases.
        searched(
          ctx,
          exhaust(
            {
              box: memberBox,
              caseHang: Duration.minutes(5),
              coverage: noCoverage,
              generator: memberCounts,
              limit: 8,
              literal: JSON.stringify,
              oracle: { kind: "postgresql", name: "db.compile against the installed snapshot" },
              suite: "pantry/import/transaction-compiles",
            },
            (members) =>
              Effect.gen(function* compiles() {
                const dir = yield* scopedPackage(everyRelationPackage(members));
                const program = yield* readProgram(dir);
                const db = yield* Db.open(AuthorApp.roles.author, {});
                const [elapsed] = yield* Effect.timed(
                  db.compile(changeSetOf(AuthorApp.roles.author.role, program.inputs)),
                );

                yield* Effect.log("every-relation compile", {
                  compileMillis: Duration.toMillis(elapsed),
                  members: JSON.stringify(members),
                });
              }).pipe(Effect.scoped),
          ),
        ),
      );

      it.effect(
        "imports the every-relation package in one transaction that writes every stored relation of Qti",
        (ctx) =>
          // Oracle: PostgreSQL's system columns. Every row the import adds to any table of the
          // installation carries the `xmin` of the package's own row, so one transaction inserted
          // them all, and the tables it inserted into are as many as `Qti`'s stored relations.
          // Bound: every count the generator draws, 8 cases.
          searched(
            ctx,
            exhaust(
              {
                box: memberBox,
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: memberCounts,
                limit: 8,
                literal: JSON.stringify,
                oracle: { kind: "postgresql", name: "every added row's xmin, the package's" },
                suite: "pantry/import/transaction-one",
              },
              (members) =>
                Effect.gen(function* oneTransaction() {
                  const client = yield* authorSession;
                  const tables = yield* tablesOf(client);
                  const before = yield* countsOf(client, tables);
                  const { id } = yield* importDrawn(members);
                  const after = yield* rowsAt(client, tables, yield* packageXid(client, id));
                  const written = [...after].filter(([, { at }]) => at > 0);

                  for (const [table, { at, total }] of after) {
                    assert.strictEqual(total, (before.get(table) ?? 0) + at, table);
                  }

                  assert.strictEqual(
                    written.length,
                    writableNamesOf(Qti).length,
                    `tables written: ${written.map(([table]) => table).join(", ")}`,
                  );
                }).pipe(Effect.scoped),
            ),
          ),
      );

      it.effect(
        "gives back the every-relation package's source from its export, every entry canonically equal",
        (ctx) =>
          // Oracle: universal, the round trip export ∘ import = id up to canonical equality: each
          // entry of the source is byte-identical in the export or, for an XML entry, canonically
          // equal (Canonical XML 1.0 with comments), and the export writes no other entry.
          // Bound: every count the generator draws, 8 cases.
          searched(
            ctx,
            exhaust(
              {
                box: memberBox,
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: memberCounts,
                limit: 8,
                literal: JSON.stringify,
                oracle: { kind: "universal", name: "export ∘ import = id, canonically" },
                suite: "pantry/import/transaction-roundtrip",
              },
              (members) =>
                Effect.gen(function* roundTrips() {
                  const fs = yield* FileSystem.FileSystem;
                  const path = yield* Path.Path;
                  const { dir, id } = yield* importDrawn(members);
                  const exported = yield* fs.makeTempDirectoryScoped({
                    directory: path.dirname(dir),
                    prefix: "export-",
                  });

                  yield* exportPackage(id, exported);

                  const report = yield* comparePackage(dir, exported);
                  const rendered = renderReport(report);

                  assert.strictEqual(report.length, everyRelationPackage(members).size, rendered);
                  for (const { outcome } of report) {
                    assert.include(["byte-identical", "canonical-equal"], outcome.kind, rendered);
                  }
                }).pipe(Effect.scoped),
            ),
          ),
      );

      it.effect(
        "leaves no row of the every-relation package when a failure is injected while its transaction waits on a table it writes",
        (ctx) =>
          // Oracle: PostgreSQL's catalog. A second session holds one table the import writes in
          // SHARE mode, which blocks the import's INSERT into it and nothing else, so the import's
          // one transaction stops there with every statement before it run. The failure injected
          // through `WrapApply` then interrupts the apply (grizzle cancels the statement and
          // destroys its session, README "Transactions and concurrency") and fails it as
          // `CommitUnknown`, whose read-back finds no package. Every table's count is then what it
          // was before the import.
          // Bound: the package of 3 choices, 2 hottexts and 2 hotspots, the table held the first,
          // the middle and the last of the tables a committed import of it writes, by command, 3
          // cases; the box must reach a hold before any other write and one after another
          // table's.
          searched(
            ctx,
            Effect.gen(function* injected() {
              const members: MemberCounts = { choices: 3, hotspots: 2, hottexts: 2 };
              const session = yield* authorSession;
              const tables = yield* tablesOf(session);
              const reference = yield* importDrawn(members);
              const order = [
                ...(yield* rowsAt(session, tables, yield* packageXid(session, reference.id))),
              ]
                .filter(([, { at }]) => at > 0)
                .toSorted(([, a], [, b]) => a.first - b.first)
                .map(([table]) => table);
              const positions: Readonly<Record<HeldAt, number>> = {
                first: 0,
                last: order.length - 1,
                middle: Math.floor(order.length / 2),
              };
              const heldAt = (at: HeldAt): string =>
                order[positions[at]] ?? assert.fail("the reference import wrote no table");

              return yield* exhaust(
                {
                  box: "the first, the middle and the last table the import writes, by command",
                  caseHang: Duration.minutes(5),
                  coverage: requiredInSpace<HeldSituation>([
                    "held after another table's write",
                    "held before any other write",
                  ]),
                  generator: element<HeldAt>(["first", "middle", "last"]),
                  limit: 3,
                  literal: JSON.stringify,
                  oracle: { kind: "postgresql", name: "every table's count, before and after" },
                  suite: "pantry/import/transaction-injected",
                },
                (at, c) =>
                  Effect.gen(function* noRow() {
                    const table = heldAt(at);
                    const holder = yield* authorSession;
                    const waiter = yield* Ref.make(Option.none<Waiter>());
                    const held = <A, E, R>(
                      apply: Effect.Effect<A, E, R>,
                    ): Effect.Effect<A, E | CommitUnknown, R> =>
                      Effect.raceFirst(
                        apply,
                        Effect.gen(function* injects() {
                          yield* Ref.set(waiter, Option.some(yield* waitedOn(holder, table)));

                          return yield* new CommitUnknown();
                        }),
                      );

                    yield* rowsOf(holder, "BEGIN");
                    yield* rowsOf(holder, `LOCK TABLE ${table} IN SHARE MODE`);

                    // The holder's SERIALIZABLE transaction takes its snapshot at this first read,
                    // after the lock (LOCK takes none) and before the import begins, so every
                    // transaction the import commits from here on keeps its SIRead locks until the
                    // holder's ends, listed under the import's session: `ended` meets them in every
                    // case, as it met another installation's overlap on a shared cluster.
                    const before = yield* countsOf(holder, tables);

                    const failed = yield* Effect.flip(
                      importDrawn(members).pipe(Effect.provideService(WrapApply, held)),
                    ).pipe(
                      Effect.tap(() =>
                        Ref.get(waiter).pipe(
                          Effect.flatMap(
                            Option.match({
                              onNone: () => Effect.void,
                              onSome: ({ pid }) => ended(holder, pid),
                            }),
                          ),
                        ),
                      ),
                      Effect.ensuring(rowsOf(holder, "ROLLBACK")),
                    );
                    const found = Option.getOrElse(yield* Ref.get(waiter), () =>
                      assert.fail(`the apply failed before the import waited on ${table}`),
                    );

                    c.note(
                      found.written > 0
                        ? "held after another table's write"
                        : "held before any other write",
                    );
                    assert.strictEqual(failed._tag, "CommitUnknown", table);
                    assert.deepStrictEqual(yield* countsOf(holder, tables), before, table);
                  }).pipe(Effect.scoped),
              );
            }).pipe(Effect.scoped),
          ),
      );
    });
  },
);
