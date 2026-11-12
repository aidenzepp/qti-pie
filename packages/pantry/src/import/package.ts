/**
 * The importer's front door: a package as `readPackage` read it (`#pantry/import/read.ts`) in, the
 * package stored under its manifest identifier out, or one named refusal (plan W5, Q5.15; the W5
 * amendment's A, C19 and C22).
 *
 * The read package is built into its rows once (`importRowsOf` of `#pantry/import/program.ts`, the
 * rows an application writes itself with its own grizzle `Db` where it needs the package in a
 * transaction of its own), its directory never read again, and written by the author login's
 * `replaceWrite` member, the one ChangeSet step (`#pantry/qti/logins.ts`) that `grizzle generate`
 * compiled into the login's served file, applied once to those rows: it deletes the rows stored
 * under the package's manifest identifier and inserts the package's, as one set difference. The
 * caller passes its own `Db`'s workload, of any login whose workload serves `replaceWrite` and
 * `entryDigestsOf` (grizzle's `MemberHandle`): `AuthorApp`'s over `Qti` and `MediaAuthorApp`'s over
 * `QtiMedia` alike. This module is a convenience over that one apply: it retries a transient
 * refusal, settles a commit with no answer by reading the package's entries back by its manifest
 * identifier, and names a refusal's QTI rules. Every row is keyed by the package's own identity, so
 * a new package is inserted whole, the same package again is grizzle's `no-change`, a changed one
 * replaces the stored one, and nothing is minted. The apply is one transaction, so the database
 * holds the whole package or nothing of it: there is no split and no completion marker. grizzle
 * writes each relation's rows in one statement, its nested rows past one Bind message through a
 * carrier, a temporary table of the write's own (README, "Sizes"; grizzle `164aeb06`), so no
 * transport bound splits the write.
 */
import {
  CommitUnknown,
  ReadFailure,
  StaleSnapshot,
  TransientFailure,
} from "@bjornpagen/grizzle/runtime";
import type { MemberHandle } from "@bjornpagen/grizzle";
import type { ApplyError, ReadError } from "@bjornpagen/grizzle/runtime";
import {
  Array as Arr,
  Clock,
  Context,
  Duration,
  Effect,
  Random,
  Ref,
  Schedule,
  Schema,
} from "effect";
import { Digest } from "effect/crypto";
import { importRowsOf } from "#pantry/import/program.ts";
import type { QtiPackage } from "#pantry/import/read.ts";
import { refusalOf } from "#pantry/import/refusal.ts";
import type { authorReads, replaceWrite } from "#pantry/qti/logins.ts";
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
 * The schedule the import retries the `replaceWrite` apply on after a transient refusal. Its
 * default is the production schedule, so a caller provides nothing; a test provides another through
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
 * this from a read-back that found other entries, which fails with `CommitUnknown` alone.
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
    return `Package ${this.package} may or may not be stored: its commit got no answer (${this.commit.message}), and reading its entries back by its manifest identifier to see whether it committed failed (${this.cause.message}).`;
  }
}

/**
 * Settle a `CommitUnknown` by reading the package back, as grizzle's README directs for it ("read
 * back before you run it again", "Errors"): `readBack` answers whether the database holds the
 * package as the apply wrote it. Held, the apply committed, or a stored package of those rows
 * already stood, which is the same answer; not held, it did not commit, and the `CommitUnknown` is
 * the answer. A read-back that fails settles nothing, so it fails with {@link CommitUnresolved},
 * never as a package not held.
 *
 * @param commit - The apply's `CommitUnknown`.
 * @param identifier - The package's manifest identifier.
 * @param readBack - Whether the database holds the package as the apply wrote it
 *   ({@link holdsEntries} of what it reads).
 * @returns That the database holds the package. Fails with `commit` when it does not, and with
 *   `CommitUnresolved` when the read-back fails.
 */
export const settleCommitUnknown = Effect.fnUntraced(function* settleCommitUnknown(
  commit: CommitUnknown,
  identifier: QtiPackage["identifier"],
  readBack: Effect.Effect<boolean, ReadError>,
): Effect.fn.Return<{ readonly kind: "committed" }, CommitUnknown | CommitUnresolved> {
  const held = yield* readBack.pipe(
    Effect.mapError((cause) => new CommitUnresolved({ cause, commit, package: identifier })),
  );

  return held ? { kind: "committed" as const } : yield* commit;
});

/**
 * One entry of a package, by its path and the SHA-256 of its bytes, lowercase hex, as `Entry`
 * stores them (`entryDigestsOf` of `#pantry/qti/logins.ts`).
 */
interface EntryDigest {
  readonly digest: string;
  readonly path: string;
}

/**
 * Whether the stored entries of a package are the entries of the package an import wrote: one set
 * of paths, each with one digest. A replace leaves the `Package` row where it stood, so the row
 * says nothing of whether the replace landed, and a package's rows are a function of its entries'
 * bytes, so its entries do: an entry the written package lacks, or one whose bytes differ, is a
 * stored package the apply did not write.
 *
 * @param stored - The stored entries, a set keyed by path.
 * @param written - The written package's entries, a set keyed by path.
 * @returns Whether the two sets are one.
 */
const holdsEntries = (stored: readonly EntryDigest[], written: readonly EntryDigest[]): boolean => {
  const digests = new Map(stored.map(({ digest, path }) => [path, digest] as const));

  return (
    digests.size === written.length &&
    written.every(({ digest, path }) => digests.get(path) === digest)
  );
};

/**
 * The entries of a package as the import writes them, each by its path and the SHA-256 of its
 * bytes, the digest `Entry` stores (`Compute.sha256`).
 *
 * @param pkg - The package, as `readPackage` read it.
 * @returns Its entries' digests.
 */
const entryDigestsOfPackage = (pkg: QtiPackage): Effect.Effect<readonly EntryDigest[]> =>
  Effect.gen(function* digestsEntries() {
    const digest = yield* Digest.Digest;

    return yield* Effect.all(
      Arr.map([...pkg.files], ([path, file]) =>
        Effect.promise(() => file.bytes()).pipe(
          Effect.flatMap((bytes) => digest.digestHex(Digest.sha256, bytes)),
          Effect.map((hex) => ({ digest: hex, path })),
        ),
      ),
    );
  }).pipe(Effect.provide(Digest.layerWebCrypto));

/**
 * What an import did, under the package's manifest identifier: stored a package the database did
 * not hold (`accepted`), found the database holding it already, the same rows under its identifier
 * (`no-change`), or replaced the stored package under its identifier with this one, deleting at
 * least one of its stored rows (`replaced`).
 */
export interface Imported {
  readonly outcome: "accepted" | "no-change" | "replaced";
  readonly package: QtiPackage["identifier"];
}

/**
 * Import a package `readPackage` read, through a `Db`'s workload, `db.workload` of any author
 * login.
 *
 * Builds every row from the package's documents and files, reading nothing of its directory and
 * minting nothing, then applies them as one ChangeSet through the workload's `replaceWrite`, which
 * deletes the rows stored under the package's manifest identifier and inserts the new ones as one
 * set difference. A package under an identifier no package holds is `accepted`; the same package
 * again is `no-change`; a different package under a stored identifier is `replaced`, the outcome
 * grizzle answers `accepted` with some stored row deleted. The apply is retried on a transient
 * refusal and on nothing else. When the commit's outcome is unknown the package's entries are read
 * back by its manifest identifier through the workload's `entryDigestsOf` and compared with the
 * package's ({@link settleCommitUnknown}, {@link holdsEntries}): the same, the import is `accepted`,
 * since the database holds the package whatever it held before; different, the error is the answer;
 * a read-back that fails is `CommitUnresolved`. Both members are grizzle's `MemberHandle` of the
 * program the login serves, so the handle of either author login is one, `AuthorApp`'s over `Qti`
 * and `MediaAuthorApp`'s over `QtiMedia`. The retries run on {@link RetrySchedule}, and each attempt
 * of the apply through {@link WrapApply}; both are references whose defaults are the live ones, so a
 * caller provides neither.
 *
 * @param workload - The author `Db`'s workload: its `replaceWrite` and `entryDigestsOf` members.
 * @param pkg - The package, as `readPackage` read it.
 * @returns The package's manifest identifier and what the import did. Fails with `ImportRefused`
 *   naming the rules the database refused the package under; with `CommitUnresolved` when the
 *   commit's outcome is unknown and the read-back failed, so the package may or may not be stored;
 *   and with grizzle's own error when the database failed for a reason that is not a refusal.
 */
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  workload: {
    readonly entryDigestsOf: MemberHandle<typeof authorReads.entryDigestsOf>;
    readonly replaceWrite: MemberHandle<typeof replaceWrite>;
  },
  pkg: QtiPackage,
): Effect.fn.Return<Imported, ImportRefused | ApplyError | CommitUnresolved> {
  const schedule = yield* RetrySchedule;
  const wrap = yield* WrapApply;
  const rows = yield* importRowsOf(pkg);
  const identifier = rows.package;
  const readBack = Effect.gen(function* readsEntriesBack() {
    const stored = yield* (yield* workload.entryDigestsOf.execute({ package: identifier })).collect;

    return holdsEntries(stored, yield* entryDigestsOfPackage(pkg));
  });
  const [elapsed, outcome] = yield* retried(
    "replaceWrite",
    wrap(workload.replaceWrite.apply({ insert: rows.insert }, { package: identifier })),
    schedule,
  ).pipe(
    Effect.catchTag("CommitUnknown", (commit) => settleCommitUnknown(commit, identifier, readBack)),
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
      Object.fromEntries(
        outcome.counts.map((c) => [c.relation, `+${c.added} -${c.deleted}`] as const),
      ),
    );

    return {
      outcome: outcome.counts.some(({ deleted }) => deleted > 0n) ? "replaced" : "accepted",
      package: identifier,
    };
  }

  if (outcome.kind === "committed") {
    return { outcome: "accepted", package: identifier };
  }

  if (outcome.kind === "no-change") {
    return { outcome: "no-change", package: identifier };
  }

  return yield* Effect.die(
    new Error(
      `The apply of package ${identifier} answered ${outcome.kind}, which a replace through a role that holds every relation of Qti whole never does.`,
    ),
  );
});
