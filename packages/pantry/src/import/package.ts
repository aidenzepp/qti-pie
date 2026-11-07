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
import { Db } from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, Law, OpenError, Uuid } from "@bjornpagen/grizzle";
import { Clock, Duration, Effect, Option, Random, Ref, Result, Schedule, Schema } from "effect";
import type { Array as Arr, FileSystem, PlatformError } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawIdentity, refusalOfLaws } from "#pantry/import/refusal.ts";
import type { ImportRefused, RefusalWitness } from "#pantry/import/refusal.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { PackageFile } from "#pantry/package/read.ts";
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
 * Where a law the database reported without a row broke, as the host found it: the relation and
 * the fields of the row, or of the node, that breaks it.
 */
export interface Located {
  readonly relation: string;
  readonly values: Readonly<Record<string, string>>;
}

/**
 * Find where a package breaks laws the database refused it under without naming a row: a CHECK or
 * a foreign key PostgreSQL reports by its constraint alone (README, "Errors and outcomes").
 *
 * @param files - The package's entries, as `readPackage` read them.
 * @param laws - The laws the refusal names.
 * @returns The row that breaks one of them, or none when the host finds no breach of any.
 */
export type Locate = (
  files: readonly PackageFile[],
  laws: Arr.NonEmptyReadonlyArray<Law>,
) => Effect.Effect<Option.Option<Located>>;

/**
 * What a caller may replace in {@link importPackage}: how the database calls are retried, what
 * runs in place of the apply, so a test can inject a failure the cluster will not raise on demand,
 * and how a refusal that names no row is located.
 */
export interface ImportOptions {
  /**
   * Finds the row a CHECK or foreign-key refusal breaks, which grizzle's witness does not name.
   * Without one, such a refusal says that the database names no row.
   */
  readonly locate?: Locate;
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
 * The host found no breach of the laws the database refused a package under: the law oracle and
 * the schema disagree, a defect of one of them, never a verdict on the package.
 */
export class LocateDisagreement extends Schema.TaggedError<LocateDisagreement>()(
  "LocateDisagreement",
  { laws: Schema.Array(Schema.String), packageId: Schema.String },
) {
  /**
   * The laws, the package, and the repair.
   */
  override get message(): string {
    return `The database refused package ${this.packageId} under ${this.laws.join("; ")}, and the host's locator finds no breach of any of them. The schema and the law oracle disagree: find which states the law wrongly and correct it.`;
  }
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
 * Build the refusal of an `invariant-rejected` outcome: its rule and explanation by
 * `refusalOfLaws`, with the row a locator finds where grizzle's witness names none.
 *
 * @param refusal - The outcome's laws and witness, and the package's id and entries.
 * @param refusal.files - The package's entries.
 * @param refusal.laws - The laws.
 * @param refusal.packageId - The package's id.
 * @param refusal.witness - The witness.
 * @param locate - The locator, if any.
 * @returns The `ImportRefused`. Dies with `LocateDisagreement` when the locator finds no breach of
 *   the laws, and with `UnownedLaws` when no rule owns them: each a defect of this package's
 *   schema, oracle or law table, never a verdict on the package.
 */
const refusedBy = Effect.fnUntraced(function* refusedBy(
  refusal: {
    readonly files: readonly PackageFile[];
    readonly laws: Arr.NonEmptyReadonlyArray<Law>;
    readonly packageId: Uuid;
    readonly witness: RefusalWitness;
  },
  locate: Locate | undefined,
): Effect.fn.Return<ImportRefused> {
  const { files, laws, packageId } = refusal;
  let { witness } = refusal;
  if (witness.kind === "unreported" && locate !== undefined) {
    const located = yield* locate(files, laws);
    if (Option.isNone(located)) {
      return yield* Effect.die(new LocateDisagreement({ laws: laws.map(lawIdentity), packageId }));
    }

    witness = { kind: "row", ...located.value };
  }

  return yield* Result.match(refusalOfLaws(laws, witness, grammar), {
    onFailure: (unowned) => Effect.die(unowned),
    onSuccess: (refused) => Effect.succeed(refused),
  });
});

/**
 * Import the package at `dir`.
 *
 * Reads the package once, shreds the documents its manifest names, mints every id afresh and
 * builds every row, then applies them as one ChangeSet through the author role. `Db.open` and
 * `db.apply` are retried on a transient refusal and on nothing else. When the commit's outcome is
 * unknown the package row is read back by its id: present, the import was accepted; absent, the
 * error is the answer. The same package imported twice is two packages, each with its own ids.
 *
 * @param dir - The package directory or `.zip` file.
 * @param options - Replacements for the retry schedule, the apply step and the locator, for tests.
 * @returns The id of the committed package. Fails with `ImportRefused` naming the rule the package
 *   broke, whether the reader, the codec or the database refused it; with the platform's error
 *   when the directory cannot be read; and with grizzle's own error when the database failed for a
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
  const program = yield* readProgram(dir);
  const { packageId } = program;
  const changes = changeSetOf(AuthorApp.roles.author.role, program.inputs);
  const db = yield* retried("Db.open", Db.open(AuthorApp.roles.author, {}), schedule);
  const [elapsed, outcome] = yield* retried("db.apply", wrap(db.apply(changes, {})), schedule).pipe(
    Effect.catchTag("CommitUnknown", (unknown) =>
      Effect.gen(function* readBack() {
        const found = yield* db
          .get(Package, { id: packageId })
          .pipe(Effect.orElseSucceed(Option.none));

        return Option.isSome(found) ? { kind: "committed" as const } : yield* unknown;
      }),
    ),
    Effect.timed,
  );

  yield* Effect.annotateCurrentSpan({ applyMillis: Duration.toMillis(elapsed), packageId });

  if (outcome.kind === "invariant-rejected") {
    // The laws the refusal names, by how grizzle decided them (grizzle-engine
    // `src/types/changeset/changeset.ts:896` and `src/write/program/witness.ts`'s hostJudgement at
    // `a08a099`):
    // - `every`: every law of the refused row's table that the stated row breaks, each once, in
    //   the schema's order; for any other refusal, the laws its one PostgreSQL object discharges.
    // - `first`: the laws of the first CHECK PostgreSQL tried, where grizzle's host cannot witness
    //   the row, for example a law over a family's filled counts (Choice not variable's).
    // The rule is the most specific among them either way (`ruleOfLaws`). A breach in a table
    // written or checked later, or one the host cannot witness, never reaches the rule, however
    // specific its law; GEN-A's differential records any such divergence from the oracle.
    const { laws } = outcome.refused;

    return yield* Effect.fail(
      yield* refusedBy(
        { files: program.files, laws, packageId, witness: outcome.witness },
        options.locate,
      ),
    );
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
