/**
 * The importer's front door: a package as `readPackage` read it (`#pantry/import/read.ts`) in, the
 * package stored under its manifest identifier out, or one named refusal (plan W5, Q5.15; the W5
 * amendment's A, C19 and C22).
 *
 * The read package is built into its rows once (`importRowsOf` of `#pantry/import/program.ts`, the
 * rows an application writes itself with its own grizzle `Db` where it needs the package in a
 * transaction of its own), its directory never read again, and written by the author login's
 * `importWrite` member, the one ChangeSet step (`#pantry/qti/logins.ts`) that `grizzle generate`
 * compiled into the login's served file, applied once to those rows. The caller passes its own
 * `Db`'s workload, of any login whose workload serves `importWrite` and `packageOf` (grizzle's
 * `MemberHandle`): `AuthorApp`'s over `Qti` and `MediaAuthorApp`'s over `QtiMedia` alike. This
 * module is a convenience over that one apply: it retries a transient refusal, settles a commit
 * with no answer by reading the package back by its manifest identifier, and names a refusal's QTI
 * rules. Every row is keyed by the package's own identity, so the same package again is grizzle's
 * `no-change`, and nothing is minted. The apply is one
 * transaction, so the database holds the whole package or nothing of it: there is no split and no
 * completion marker. grizzle writes each relation's rows in one statement, its nested rows past one
 * Bind message through a carrier, a temporary table of the write's own (README, "Sizes"; grizzle
 * `164aeb06`), so no transport bound splits the write.
 */
import {
  CommitUnknown,
  ReadFailure,
  StaleSnapshot,
  TransientFailure,
} from "@bjornpagen/grizzle/runtime";
import type { MemberHandle } from "@bjornpagen/grizzle";
import type { ApplyError, ReadError } from "@bjornpagen/grizzle/runtime";
import { Clock, Context, Duration, Effect, Option, Random, Ref, Schedule, Schema } from "effect";
import { importRowsOf } from "#pantry/import/program.ts";
import type { QtiPackage } from "#pantry/import/read.ts";
import { refusalOf } from "#pantry/import/refusal.ts";
import type { authorReads, importWrite } from "#pantry/qti/logins.ts";
import type { ImportRefused } from "#pantry/import/rules.ts";

/**
 * The longest the retries of one database call run, in total.
 */
const retryBound = Duration.seconds(30);

/**
 * The longest one wait between attempts lasts, before jitter.
 */
const retryDelayCap = Duration.seconds(1);

/**
 * The schedule the import retries the `importWrite` apply on after a transient refusal. Its default
 * is the production schedule, so a caller provides nothing; a test provides another through
 * `Effect.provideService`, to give up sooner than the bound allows.
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
 * may succeed again: grizzle's `TransientFailure`. Nothing else is retried.
 *
 * @param error - The failure.
 * @returns Whether it is transient.
 */
const isTransient = (error: ApplyError): boolean => error._tag === "TransientFailure";

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
const retried = <A, E extends ApplyError, R>(
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
 * the database may hold the package or not. `package` is the package's manifest identifier,
 * `commit` grizzle's `CommitUnknown` and `cause` the read-back's own failure, so a caller can tell
 * this from a read-back that found no package, which fails with `CommitUnknown` alone.
 */
export class CommitUnresolved extends Schema.TaggedError<CommitUnresolved>()("CommitUnresolved", {
  cause: Schema.Union([
    Schema.instanceOf(ReadFailure),
    Schema.instanceOf(TransientFailure),
    Schema.instanceOf(StaleSnapshot),
  ]),
  commit: Schema.instanceOf(CommitUnknown),
  package: Schema.String,
}) {
  /**
   * The package, that its commit's outcome is unknown, and why the read-back did not settle it.
   */
  override get message(): string {
    return `Package ${this.package} may or may not be stored: its commit got no answer (${this.commit.message}), and reading it back by its manifest identifier to see whether it committed failed (${this.cause.message}).`;
  }
}

/**
 * Settle a `CommitUnknown` by reading the package back by its manifest identifier, as grizzle's
 * README directs for it ("read back before you run it again", "Errors"): present, the database
 * holds the package, so the apply committed or a stored package of those rows already stood, which
 * is the same answer; absent, it did not commit, and the `CommitUnknown` is the answer. A read-back
 * that fails settles nothing, so it fails with {@link CommitUnresolved}, never as an absent
 * package.
 *
 * @param commit - The apply's `CommitUnknown`.
 * @param identifier - The package's manifest identifier.
 * @param readBack - The read of the `Package` row at `identifier`.
 * @returns That the database holds the package. Fails with `commit` when the read-back finds no
 *   package, and with `CommitUnresolved` when the read-back fails.
 */
export const settleCommitUnknown = Effect.fnUntraced(function* settleCommitUnknown<A>(
  commit: CommitUnknown,
  identifier: QtiPackage["identifier"],
  readBack: Effect.Effect<Option.Option<A>, ReadError>,
): Effect.fn.Return<{ readonly kind: "committed" }, CommitUnknown | CommitUnresolved> {
  const found = yield* readBack.pipe(
    Effect.mapError((cause) => new CommitUnresolved({ cause, commit, package: identifier })),
  );

  return Option.isSome(found) ? { kind: "committed" as const } : yield* commit;
});

/**
 * What an import did, under the package's manifest identifier: stored the package (`accepted`), or
 * found the database holding it already, the same rows under its identifier (`no-change`).
 */
export interface Imported {
  readonly outcome: "accepted" | "no-change";
  readonly package: QtiPackage["identifier"];
}

/**
 * Import a package `readPackage` read, through a `Db`'s workload, `db.workload` of any author
 * login.
 *
 * Builds every row from the package's documents and files, reading nothing of its directory and
 * minting nothing, then applies them as one ChangeSet through the workload's `importWrite`. The
 * same package again is `no-change`; a different package under a stored manifest identifier is
 * refused on a key it shares with the stored one. The apply is retried on a transient refusal and
 * on nothing else. When the commit's outcome is unknown the `Package` row is read back by its
 * manifest identifier through the workload's `packageOf` ({@link settleCommitUnknown}): present,
 * the import is `accepted`; absent, the error is the answer; a read-back that fails is
 * `CommitUnresolved`. Both members are grizzle's `MemberHandle` of the program the login serves, so
 * the handle of either author login is one, `AuthorApp`'s over `Qti` and `MediaAuthorApp`'s over
 * `QtiMedia`. The retries run on {@link RetrySchedule}, and each attempt of the apply through
 * {@link WrapApply}; both are references whose defaults are the live ones, so a caller provides
 * neither.
 *
 * @param workload - The author `Db`'s workload: its `importWrite` and `packageOf` members.
 * @param pkg - The package, as `readPackage` read it.
 * @returns The package's manifest identifier and what the import did. Fails with `ImportRefused`
 *   naming the rules the database refused the package under, a changed package under a stored
 *   identifier among them; with `CommitUnresolved` when the commit's outcome is unknown and the
 *   read-back failed, so the package may or may not be stored; and with grizzle's own error when
 *   the database failed for a reason that is not a refusal.
 */
// GRIZZLE-PENDING(WHOLEDEL): a changed package under a stored identifier is written through the
// replace (`replaceWrite` of `#pantry/qti/logins.ts`), grizzle's set-difference write; until it is
// served it is refused on its key.
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  workload: {
    readonly importWrite: MemberHandle<typeof importWrite>;
    readonly packageOf: MemberHandle<typeof authorReads.packageOf>;
  },
  pkg: QtiPackage,
): Effect.fn.Return<Imported, ImportRefused | ApplyError | CommitUnresolved> {
  const schedule = yield* RetrySchedule;
  const wrap = yield* WrapApply;
  const rows = yield* importRowsOf(pkg);
  const identifier = rows.package;
  const [elapsed, outcome] = yield* retried(
    "importWrite",
    wrap(workload.importWrite.apply({ insert: rows.insert }, {})),
    schedule,
  ).pipe(
    Effect.catchTag("CommitUnknown", (commit) =>
      settleCommitUnknown(commit, identifier, workload.packageOf.get({ identifier })),
    ),
    Effect.timed,
  );

  yield* Effect.annotateCurrentSpan({
    applyMillis: Duration.toMillis(elapsed),
    outcome: outcome.kind,
    package: identifier,
  });

  if (outcome.kind === "invariant-rejected") {
    // The refusal is what the outcome says, read from it alone (`refusalOf`): how grizzle decided
    // its laws (`refused.kind`), every law it names with the set of their rules, and grizzle's
    // witness (grizzle-engine `src/types/changeset/changeset.ts:1140-1198`, `Witness`, `Refused`
    // and `RefusedLaw`, at `eb56d58`). `every` names the laws grizzle judged broken; `first` the
    // laws of the CHECK PostgreSQL tried first, which the row may not be alone in breaking; `some`
    // the laws one PostgreSQL object discharges, at least one of them broken and nothing deciding
    // which. The import judges no law and reads no row of its own to decide more than grizzle did,
    // so a `some` or `first` refusal stays under every rule its laws carry. The witness is the key
    // of the first stated row that breaks a law, or `unreported` for a foreign key and for a law no
    // stated row breaks as grizzle's host judges it (README "Errors and outcomes"). A law no row of
    // the law table names still prints its text, and carries no rule. Naming the laws reads the
    // committed dictionary alone, which compiles nothing, and that step has a span of its own,
    // which records the laws it named and their rules.
    const { refused } = outcome;
    const refusal = yield* Effect.sync(() => refusalOf(refused, outcome.witness)).pipe(
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
    return { outcome: "accepted", package: identifier };
  }

  if (outcome.kind === "no-change") {
    return { outcome: "no-change", package: identifier };
  }

  return yield* Effect.die(
    new Error(
      `The apply of package ${identifier} answered ${outcome.kind}, which an insert through a role that holds every relation of Qti whole never does.`,
    ),
  );
});
