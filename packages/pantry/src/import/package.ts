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
import {
  CommitUnknown,
  Db,
  ReadFailure,
  StaleSnapshot,
  TransientFailure,
} from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, OpenError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { Clock, Context, Duration, Effect, Option, Random, Ref, Schedule, Schema } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { refusalOf } from "#pantry/import/refusal.ts";
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
 * The schedule the import retries `Db.open` and `db.apply` on after a transient refusal. Its
 * default is the production schedule, so a caller provides nothing; a test provides another
 * through `Effect.provideService`, to give up sooner than the bound allows.
 *
 * The default is bounded by elapsed time and not by count. A serialization failure never depends
 * on the call's inputs, and under contention PostgreSQL expects many attempts, so a count says
 * nothing about how long the contention lasts. The wait starts at 50 ms and doubles, is capped at
 * one second so the retries keep sampling while the burst thins out, and is then drawn uniformly
 * from zero to that wait, so attempts that collided do not retry together. The retries stop at the
 * first attempt that ends after thirty seconds, and that attempt's failure is the call's.
 */
export const RetrySchedule = Context.Reference<Schedule.Schedule<unknown>>(
  "pantry/import/package/RetrySchedule",
  {
    defaultValue: () =>
      Schedule.exponential("50 millis", 2).pipe(
        Schedule.modifyDelay(
          Effect.fnUntraced(function* jitters({ duration }) {
            const random = yield* Random.next;

            return Duration.times(Duration.min(duration, retryDelayCap), random);
          }),
        ),
        Schedule.upTo({ duration: retryBound }),
      ),
  },
);

/**
 * What runs each attempt of the import's apply: by default the attempt as it is, so a caller
 * provides nothing. A test provides a wrap through `Effect.provideService` to inject a failure
 * the cluster will not raise on demand (a `TransientFailure`, a `CommitUnknown` before or after
 * the apply ran, an interruption while it waits on a lock), and the import's retries and its
 * read-back then meet that failure as they would meet the database's.
 */
export const WrapApply = Context.Reference<
  <A>(apply: Effect.Effect<A, ApplyError>) => Effect.Effect<A, ApplyError>
>("pantry/import/package/WrapApply", { defaultValue: () => (apply) => apply });

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
 * same package imported twice is two packages, each with its own ids. The retries run on
 * {@link RetrySchedule}, and each attempt of the apply through {@link WrapApply}.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The id of the committed package. Fails with `ImportRefused` naming the rules the package
 *   was refused under, whether the reader, the codec or the database refused it; with the
 *   platform's error when the directory cannot be read; with `CommitUnresolved` when the commit's
 *   outcome is unknown and the read-back failed, so the package may or may not be stored; and with
 *   grizzle's own error when the database failed for a reason that is not a refusal.
 */
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  dir: string,
): Effect.fn.Return<
  Uuid,
  ImportRefused | PlatformError.PlatformError | ApplyError | OpenError | CommitUnresolved,
  FileSystem.FileSystem | DbLayer<typeof Author>
> {
  const schedule = yield* RetrySchedule;
  const wrap = yield* WrapApply;
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
    // The refusal is what the outcome says, read from it alone (`refusalOf`): how grizzle decided
    // its laws (`refused.kind`), every law it names with the set of their rules, and grizzle's
    // witness (grizzle-engine `src/types/changeset/changeset.ts:1013-1043`, `Witness` and
    // `Refused`, at `999facc`). `every` names the laws grizzle judged broken; `first` the laws of the CHECK
    // PostgreSQL tried first, which the row may not be alone in breaking; `some` the laws one
    // PostgreSQL object discharges, at least one of them broken and nothing deciding which. The
    // import judges no law and reads no row of its own to decide more than grizzle did, so a
    // `some` or `first` refusal stays under every rule its laws carry. The witness is the key of
    // the first stated row that breaks a law, or `unreported` for a foreign key and for a law no
    // stated row breaks as grizzle's host judges it (README "Errors and outcomes"). A law no row of
    // the law table names still prints its text, and carries no rule. The first refusal of a
    // process compiles Qti's law model to name the laws, so the naming has a span of its own.
    const { refused } = outcome;
    const refusal = yield* Effect.sync(() => refusalOf(refused, outcome.witness, grammar)).pipe(
      Effect.tap((built) =>
        Effect.annotateCurrentSpan({
          lawsNamed: refused.laws.length,
          refusedKind: refused.kind,
          rules: built.rules.join("|"),
        }),
      ),
      Effect.withSpan("import.nameRefusal"),
    );

    return yield* refusal;
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
