/**
 * The importer's front door: a package directory in, one committed package out or one named
 * refusal.
 *
 * The package is read whole into rows in memory (manifest, then each document the manifest lists)
 * and judged by the guards, by the dry run's own read (`#pantry/import/preview.ts`), and written as
 * one `ChangeSet` applied once, so the database holds either the whole package or nothing of it.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, Fact, OpenError, Uuid } from "@bjornpagen/grizzle";
import { Clock, Duration, Effect, Option, Random, Ref, Schedule } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { readImport } from "#pantry/import/preview.ts";
import type { ImportLaw, ImportRefused, ImportWitness } from "#pantry/import/refusal.ts";
import { refusalOfLaw } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { Package } from "#pantry/schema/package.ts";
import { Author } from "#pantry/schema/roles.ts";

/**
 * The longest the retries of one database call run, in total.
 */
const retryBound = Duration.seconds(30);

/**
 * The longest one wait between attempts lasts, before jitter.
 */
const retryDelayCap = Duration.seconds(1);

/**
 * The retry between attempts at the database, bounded by elapsed time and not by count.
 *
 * A serialization failure never depends on the call's inputs, and under contention PostgreSQL
 * expects many attempts, so a count says nothing about how long the contention lasts. The wait
 * starts at 50 ms and doubles, is capped at one second so the retries keep sampling while the
 * burst thins out, and is then drawn uniformly from zero to that wait, so attempts that collided do
 * not retry together. The retries stop at the first attempt that ends after thirty seconds, and
 * that attempt's failure is the call's.
 */
export const retrySchedule = Schedule.exponential("50 millis", 2).pipe(
  Schedule.modifyDelay(
    Effect.fnUntraced(function* jitters({ duration }) {
      const random = yield* Random.next;

      return Duration.times(Duration.min(duration, retryDelayCap), random);
    }),
  ),
  Schedule.upTo({ duration: retryBound }),
);

/**
 * What a caller may replace in {@link importPackage}: how the database calls are retried and what
 * runs in place of the apply, so a test can inject a failure the cluster will not raise on demand.
 */
export interface ImportOptions {
  /**
   * Wraps each attempt of the apply, in place of running it as is. Defaults to running it.
   */
  readonly wrapApply?: <A, E, R>(
    apply: Effect.Effect<A, E, R>,
  ) => Effect.Effect<A, E | ApplyError, R>;
  /**
   * The schedule of the retries of `Db.open` and `db.apply`. Defaults to {@link retrySchedule}.
   */
  readonly schedule?: Schedule.Schedule<unknown>;
}

/**
 * Whether the database refused an attempt for a reason outside the call's inputs, so the same call
 * may succeed again: grizzle's `TransientFailure`, or an `OpenError` whose admission was refused by
 * `SERIALIZABLE`. Nothing else is retried.
 */
const isTransient = (error: ApplyError | OpenError): boolean =>
  error._tag === "TransientFailure" ||
  (error._tag === "OpenError" && error.reason._tag === "AdmissionTransient");

/**
 * Run `attempt` again while the database calls the failure transient, on `schedule`. Each retry
 * logs the attempt it follows, the time since the first attempt and the failure's tag, so a run
 * shows how often it retried; a failure after the last retry is the error it was, logged with the
 * attempts made.
 */
const retried = <A, E extends ApplyError | OpenError, R>(
  name: string,
  attempt: Effect.Effect<A, E, R>,
  schedule: Schedule.Schedule<unknown>,
): Effect.Effect<A, E, R> =>
  Effect.gen(function* retriedAttempt() {
    const attempts = yield* Ref.make(0);
    const started = yield* Clock.currentTimeMillis;
    const logTransient = Effect.fnUntraced(function* logsRetry(failure: E) {
      if (!isTransient(failure)) {
        return;
      }

      const n = yield* Ref.get(attempts);
      const now = yield* Clock.currentTimeMillis;

      yield* Effect.logWarning(`${name} attempt ${n} failed transiently`).pipe(
        Effect.annotateLogs({ attempt: n, elapsedMillis: now - started, errorTag: failure._tag }),
      );
    });
    const counted = Effect.andThen(
      Ref.update(attempts, (n) => n + 1),
      attempt,
    ).pipe(Effect.tapError(logTransient));

    return yield* counted.pipe(
      Effect.retry({ schedule, while: isTransient }),
      Effect.tapError(() =>
        Effect.flatMap(Ref.get(attempts), (n) =>
          Effect.logError(`${name} failed after ${n} attempt${n === 1 ? "" : "s"}`),
        ),
      ),
    );
  });

/**
 * One `ChangeSet` inserting every row of `rows`, relation by relation, the package's own first.
 */
export const changeSetOf = (rows: Rows) => {
  let changes = ChangeSet.empty(Author).insert(Package, Rows.of(rows, Package));

  for (const [relation, facts] of rows) {
    if (relation !== Package && facts.length > 0) {
      // SAFETY: `Rows` holds each relation's own facts under that relation, and every relation it holds is one the author role writes, but a map keyed by `AnyRelation` cannot say so to `insert`'s per-relation write check; `Package` stands for any of them, and `insert` reads only the relation's name and the facts at run time.
      changes = changes.insert(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
        relation as typeof Package,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
        facts as readonly Fact<typeof Package>[],
      );
    }
  }

  return changes;
};

/**
 * Import the package at `dir`.
 *
 * Reads `imsmanifest.xml` and every QTI document it lists, judges the rows with the tree, manifest,
 * item, content, processing, usage and wildcard guards, and applies them in one `ChangeSet` through
 * the author role. `Db.open` and `db.apply` are retried on a transient refusal and on nothing else.
 * When the commit's outcome is unknown the package row is read back by its id: present, the import
 * was accepted; absent, the error is the answer.
 *
 * @param dir - The package directory.
 * @param options - Replacements for the retry schedule and the apply step, for tests.
 * @returns The id of the committed package. Fails with `ImportRefused` naming the rule the package
 *   broke, whether a guard, the reader or the database refused it; with the platform's error when
 *   the directory cannot be read; and with grizzle's own error when the database failed for a
 *   reason that is not a refusal.
 */
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  dir: string,
  options: ImportOptions = {},
): Effect.fn.Return<
  Uuid,
  ImportRefused | PlatformError.PlatformError | ApplyError | OpenError,
  FileSystem.FileSystem | DbLayer<typeof Author>
> {
  const schedule = options.schedule ?? retrySchedule;
  const wrap = options.wrapApply ?? (<A, E, R>(apply: Effect.Effect<A, E, R>) => apply);
  const { packageId, rows } = yield* readImport(dir);
  const changes = changeSetOf(rows);
  const db = yield* retried("Db.open", Db.open(AuthorApp.roles.author, {}), schedule);
  const outcome = yield* retried("db.apply", wrap(db.apply(changes, {})), schedule).pipe(
    Effect.catchTag("CommitUnknown", (unknown) =>
      Effect.gen(function* readBack() {
        const found = yield* db
          .get(Package, { id: packageId })
          .pipe(Effect.orElseSucceed(Option.none));

        return Option.isSome(found) ? { kind: "committed" as const } : yield* unknown;
      }),
    ),
  );

  if (outcome.kind === "invariant-rejected") {
    return yield* refusalOfLaw(
      outcome.law satisfies ImportLaw,
      outcome.witness satisfies ImportWitness,
    );
  }

  if (outcome.kind === "accepted" || outcome.kind === "committed") {
    if (outcome.kind === "accepted") {
      yield* Effect.logDebug(
        "import applied",
        Object.fromEntries(outcome.counts.map((c) => [c.relation, String(c.added)])),
      );
    }

    return packageId;
  }

  return yield* Effect.die(
    new Error(
      `The apply of package ${packageId} answered ${outcome.kind}, which a first insert of a new package never does.`,
    ),
  );
});
