/**
 * The importer's front door: a package directory in, one committed package out or one named
 * refusal (plan W5, Q5.15; the W5 amendment's A, C19 and C22).
 *
 * The package is read, shredded and built into its rows once (`readProgram` of
 * `#pantry/import/program.ts`), and written as one ChangeSet step over the author role
 * (`changeSetOf` of `#pantry/import/write.ts`), applied once by `db.apply` and compiled for that
 * call. The apply is one transaction, so the database holds the whole package or nothing of it:
 * there is no split and no completion marker, and a family past one statement's transport bounds
 * is chunked by grizzle into consecutive statements of that transaction (fin.md §4.5a).
 */
/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import {
  CommitUnknown,
  Db,
  ReadFailure,
  StaleSnapshot,
  TransientFailure,
} from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Clock, Duration, Effect, Option, Random, Ref, Result, Schedule, Schema } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { refusalOfLaws } from "#pantry/import/refusal.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import type { Author } from "#pantry/qti/roles.ts";

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
 * What a caller may replace in {@link importPackage}: how the database calls are retried, and what
 * runs in place of the apply, so a test can inject a failure the cluster will not raise on demand.
 */
export interface ImportOptions {
  /**
   * The schedule of the retries of `Db.open` and `db.apply`. Defaults to {@link retrySchedule}.
   */
  readonly schedule?: Schedule.Schedule<unknown>;
  /**
   * Wraps each attempt of the apply, in place of running it as is. Defaults to running it.
   */
  readonly wrapApply?: <A, E, R>(
    apply: Effect.Effect<A, E, R>,
  ) => Effect.Effect<A, E | ApplyError, R>;
}

/**
 * Whether the database refused an attempt for a reason outside the call's inputs, so the same call
 * may succeed again: grizzle's `TransientFailure`, or an `OpenError` whose admission was refused by
 * `SERIALIZABLE`. Nothing else is retried.
 *
 * @param error - The failure.
 * @returns Whether it is transient.
 */
const isTransient = (error: ApplyError | OpenError): boolean =>
  error._tag === "TransientFailure" ||
  (error._tag === "OpenError" && error.reason._tag === "AdmissionTransient");

/**
 * Run `attempt` again while the database calls the failure transient, on `schedule`. Each retry
 * logs the attempt it follows, the time since the first attempt and the failure's tag, so a run
 * shows how often it retried; a failure after the last retry is the error it was, logged with the
 * attempts made.
 *
 * @param name - The call's name, for the logs.
 * @param attempt - One attempt.
 * @param schedule - The retries' schedule.
 * @returns The first attempt that succeeds, or the last failure.
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
 * The apply's COMMIT got no answer, and the read-back that would say whether it committed failed:
 * the database may hold the package or not. `commit` is grizzle's `CommitUnknown` and `cause` the
 * read-back's own failure, so a caller can tell this from a read-back that found no package, which
 * fails with `CommitUnknown` alone.
 */
export class CommitUnresolved extends Schema.TaggedError<CommitUnresolved>()("CommitUnresolved", {
  cause: Schema.Union([
    Schema.instanceOf(ReadFailure),
    Schema.instanceOf(TransientFailure),
    Schema.instanceOf(StaleSnapshot),
  ]),
  commit: Schema.instanceOf(CommitUnknown),
  packageId: Schema.String,
}) {
  /**
   * The package, that its commit's outcome is unknown, and why the read-back did not settle it.
   */
  override get message(): string {
    return `Package ${this.packageId} may or may not be stored: its commit got no answer (${this.commit.message}), and reading it back to see whether it committed failed (${this.cause.message}).`;
  }
}

/**
 * Settle a `CommitUnknown` by reading the package back by its id, as grizzle's README directs for
 * it ("read back before you run it again", "Errors"): present, the apply committed; absent, it did
 * not, and the `CommitUnknown` is the answer. A read-back that fails settles nothing, so it fails
 * with {@link CommitUnresolved}, never as an absent package.
 *
 * @param commit - The apply's `CommitUnknown`.
 * @param packageId - The id the import gave the package.
 * @param readBack - The read of the package row by `packageId`.
 * @returns That the apply committed. Fails with `commit` when the read-back finds no package, and
 *   with `CommitUnresolved` when the read-back fails.
 */
export const settleCommitUnknown = Effect.fnUntraced(function* settleCommitUnknown<A>(
  commit: CommitUnknown,
  packageId: Uuid,
  readBack: Effect.Effect<Option.Option<A>, ReadError>,
): Effect.fn.Return<{ readonly kind: "committed" }, CommitUnknown | CommitUnresolved> {
  const found = yield* readBack.pipe(
    Effect.mapError((cause) => new CommitUnresolved({ cause, commit, packageId })),
  );

  return Option.isSome(found) ? { kind: "committed" as const } : yield* commit;
});

/**
 * Import the package at `dir`.
 *
 * Reads the package once, shreds the documents its manifest names, mints every id afresh and
 * builds every row, then applies them as one ChangeSet through the author role. `Db.open` and
 * `db.apply` are retried on a transient refusal and on nothing else. When the commit's outcome is
 * unknown the package row is read back by its id ({@link settleCommitUnknown}): present, the import
 * was accepted; absent, the error is the answer; a read-back that fails is `CommitUnresolved`. The
 * same package imported twice is two packages, each with its own ids.
 *
 * @param dir - The package directory or `.zip` file.
 * @param options - Replacements for the retry schedule and the apply step, for tests.
 * @returns The id of the committed package. Fails with `ImportRefused` naming the rule the package
 *   broke, whether the reader, the codec or the database refused it; with the platform's error
 *   when the directory cannot be read; with `CommitUnresolved` when the commit's outcome is
 *   unknown and the read-back failed, so the package may or may not be stored; and with grizzle's
 *   own error when the database failed for a reason that is not a refusal.
 */
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  dir: string,
  options: ImportOptions = {},
): Effect.fn.Return<
  Uuid,
  ImportRefused | PlatformError.PlatformError | ApplyError | OpenError | CommitUnresolved,
  FileSystem.FileSystem | DbLayer<typeof Author>
> {
  const schedule = options.schedule ?? retrySchedule;
  const wrap = options.wrapApply ?? (<A, E, R>(apply: Effect.Effect<A, E, R>) => apply);
  const program = yield* readProgram(dir);
  const { packageId } = program;
  const changes = changeSetOf(AuthorApp.roles.author.role, program.inputs);
  const db = yield* retried("Db.open", Db.open(AuthorApp.roles.author, {}), schedule);
  const [elapsed, outcome] = yield* retried("db.apply", wrap(db.apply(changes, {})), schedule).pipe(
    Effect.catchTag("CommitUnknown", (commit) =>
      settleCommitUnknown(commit, packageId, db.get(Package, { id: packageId })),
    ),
    Effect.timed,
  );

  yield* Effect.annotateCurrentSpan({ applyMillis: Duration.toMillis(elapsed), packageId });

  if (outcome.kind === "invariant-rejected") {
    // The laws the refusal names, by how grizzle decided them (grizzle-engine
    // `src/types/changeset/changeset.ts:1044` and `src/write/program/witness.ts`'s hostJudgement at
    // `0c2154c`):
    // - `every`: every law of the refused row's table that the stated row breaks, each once, in
    //   the schema's order, a domain's one per column whose value it refuses; for any other
    //   refusal, the one law its PostgreSQL object discharges.
    // - `first`: the laws of the first CHECK PostgreSQL tried, where grizzle's host cannot witness
    //   the row, for example a law over a family's filled counts (Choice not variable's).
    // - `some`: the laws one PostgreSQL object discharges, two or more, at least one of them broken
    //   and nothing deciding which: a family's axis foreign key and every law merged into it, or a
    //   domain over a row the host does not judge whole. A stated limit: the import cannot yet
    //   decide which law broke (a recorded follow-up), so its rule stays the most specific among
    //   them, what it ruled when grizzle named these laws `every` before.
    // The rule is the most specific among them in every arm (`ruleOfLaws`). A breach in a table
    // written or checked later, or one the host cannot witness, never reaches the rule, however
    // specific its law; GEN-A's differential records any such divergence from the oracle.
    // The witness is grizzle's own, as the refusal carries it: the key of the first stated row
    // that breaks the law, or `unreported` for a foreign key and for a law no stated row breaks as
    // the host judges it (README "Errors and outcomes"). Laws no rule owns die as `UnownedLaws`, a
    // defect of the law table, never a verdict on the package.
    return yield* Result.match(refusalOfLaws(outcome.refused.laws, outcome.witness, grammar), {
      onFailure: (unowned) => Effect.die(unowned),
      onSuccess: (refused) => Effect.fail(refused),
    });
  }

  if (outcome.kind === "accepted") {
    yield* Effect.logDebug(
      "import applied",
      Object.fromEntries(outcome.counts.map((c) => [c.relation, String(c.added)])),
    );
  }

  if (outcome.kind === "accepted" || outcome.kind === "committed") {
    return packageId;
  }

  return yield* Effect.die(
    new Error(
      `The apply of package ${packageId} answered ${outcome.kind}, which a first insert of a new package never does.`,
    ),
  );
});
