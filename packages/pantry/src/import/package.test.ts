/**
 * The importer's front door (`#pantry/import/package.ts`): its retry schedule, as
 * `RetrySchedule`'s default gives it, and the read-back that settles a `CommitUnknown` on the host,
 * and on the lease its verdicts, its retries and `CommitUnknown`'s resolution, with the failures
 * injected through `WrapApply`.
 *
 * A verdict on the lease is judged against the law oracle (`#pantry/test/oracle-verdict.ts`
 * `oracleVerdict`, a second implementation): a package the oracle accepts commits, and one it
 * refuses is refused under one of the rules its breaches keep. A disagreement is a finding of the
 * schema or the oracle, never of the package.
 */
import {
  CommitUnknown,
  Db,
  Migrating,
  query,
  ReadFailure,
  SerializationFailure,
  ServerError,
  Sqlstate,
  StaleSnapshot,
  TransientFailure,
  uuid,
  v,
} from "@bjornpagen/grizzle";
import type { ApplyError, ReadError, Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, it as plainIt, layer } from "@effect/vitest";
import { Clock, Effect, Fiber, Layer, Option, Ref, Result, Schedule } from "effect";
import { TestClock } from "effect/testing";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import {
  CommitUnresolved,
  importPackage,
  RetrySchedule,
  settleCommitUnknown,
  WrapApply,
} from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Author, AuthorApp } from "#pantry/qti/own-login.ts";
import { Package } from "#pantry/qti/package.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const fixtures = inject("fixtures");

/**
 * A package stored by its id.
 */
const packageRows = query(Author).rule((r) => {
  const { id } = v(Package, "package");

  return r
    .match(Package, { id })
    .where(r.eq(id, r.param("id", uuid)))
    .find({ id });
});

/**
 * The server's report of a serialization failure, SQLSTATE 40001, built with grizzle's own
 * constructor from the ErrorResponse the server writes, as its wire builds it.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/4b0d45ef2156b9b83d628fdb8c3bdd96dcf7f38a/packages/grizzle/src/adapter/errors/failures.ts#L61-L94
 */
const serverReport = new ServerError({
  column: undefined,
  constraint: undefined,
  dataType: undefined,
  detail: undefined,
  hint: undefined,
  message: "could not serialize access due to concurrent update",
  schema: undefined,
  sqlstate: Option.getOrThrowWith(
    Option.fromUndefinedOr(Sqlstate.parse("40001")),
    () => new Error("Sqlstate.parse refused 40001, the serialization failure's SQLSTATE."),
  ),
  table: undefined,
});

/**
 * The failure a serializable transaction meets: a `TransientFailure` over a `SerializationFailure`
 * reason and the server's report, each built with grizzle's own constructor.
 */
const serializationFailure = new TransientFailure({
  error: serverReport,
  reason: new SerializationFailure(),
});

/**
 * What a run of the default `RetrySchedule` against a failure that never clears did: the clock
 * reading at each attempt, in milliseconds after the first, and whether the retry gave up.
 */
interface RetryRun {
  readonly attemptAt: readonly number[];
  readonly gaveUp: boolean;
}

/**
 * Run the default `RetrySchedule`, read unprovided as the import reads it, against an effect that
 * always fails, on the test clock, and advance the clock well past the schedule's bound.
 */
const runRetrySchedule = Effect.gen(function* runRetrySchedule() {
  const attemptAt = yield* Ref.make<readonly number[]>([]);
  const started = yield* Clock.currentTimeMillis;
  const attempt = Effect.gen(function* failsAlways() {
    const now = yield* Clock.currentTimeMillis;

    yield* Ref.update(attemptAt, (all) => [...all, now - started]);

    return yield* Effect.fail("transient");
  });
  const fiber = yield* Effect.forkChild(Effect.result(Effect.retry(attempt, yield* RetrySchedule)));

  yield* TestClock.adjust("120 seconds");

  const result = yield* Fiber.join(fiber);
  const run: RetryRun = { attemptAt: yield* Ref.get(attemptAt), gaveUp: Result.isFailure(result) };

  return run;
});

describe("RetrySchedule's default", () => {
  plainIt.effect("keeps retrying past the fifth retry while under its time bound", () =>
    // Oracle: the specification as a checker, the schedule's contract: bounded by elapsed time,
    // not by count.
    Effect.gen(function* keepsRetrying() {
      const { attemptAt } = yield* runRetrySchedule;

      assert.isAbove(attemptAt.length, 6);
      assert.isBelow(attemptAt[6] ?? Number.POSITIVE_INFINITY, 30_000);
    }),
  );

  plainIt.effect("waits at most one second between attempts", () =>
    // Oracle: the specification as a checker, the cap of one second before jitter.
    Effect.gen(function* capsDelays() {
      const { attemptAt } = yield* runRetrySchedule;
      const gaps = attemptAt.slice(1).map((at, i) => at - (attemptAt[i] ?? 0));

      assert.isAtMost(Math.max(...gaps), 1000);
    }),
  );

  plainIt.effect("stops once thirty seconds have passed, and then fails", () =>
    // Oracle: the specification as a checker, the schedule's bound of thirty seconds: the attempt
    // that ends past it is the last.
    Effect.gen(function* stopsAtBound() {
      const { attemptAt, gaveUp } = yield* runRetrySchedule;
      const last = attemptAt.at(-1) ?? 0;

      assert.isTrue(gaveUp);
      assert.isAbove(last, 30_000);
      assert.isAtMost(last, 31_000);
    }),
  );
});

/**
 * Retries with no wait, so a test of the retry logic does not sleep.
 */
const quickly = Schedule.recurs(2);

/**
 * Fail `failures` times in a row, then succeed, retried on `schedule` while the failure is
 * transient, with the delays driven by the test clock so nothing sleeps. Gives the attempts made.
 *
 * @param schedule - The retries' schedule.
 * @param failures - How many attempts fail before one succeeds.
 * @returns The attempts made.
 */
const attemptsUnder = (schedule: Schedule.Schedule<unknown>, failures: number) =>
  Effect.gen(function* simulated() {
    const attempts = yield* Ref.make(0);
    const attempt = Effect.flatMap(
      Ref.updateAndGet(attempts, (n) => n + 1),
      (n) => (n <= failures ? Effect.fail(serializationFailure) : Effect.succeed(n)),
    );
    const fiber = yield* Effect.forkChild(Effect.result(Effect.retry(attempt, { schedule })));

    yield* TestClock.adjust("10 seconds");
    yield* Fiber.join(fiber);

    return yield* Ref.get(attempts);
  });

describe("import/package.test.ts, the retry budget", () => {
  plainIt.effect("the production schedule retries an injected failure and two real ones", () =>
    // Oracle: the specification as a checker, the schedule's time bound, under which three
    // transient failures are retried.
    Effect.gen(function* survives() {
      assert.strictEqual(yield* attemptsUnder(yield* RetrySchedule, 3), 4);
    }),
  );

  plainIt.effect("the test schedule gives up after one injected failure and two real ones", () =>
    // Oracle: the specification as a checker, `Schedule.recurs(2)`: three attempts in all.
    Effect.gen(function* gaveUp() {
      assert.strictEqual(yield* attemptsUnder(quickly, 3), 3);
    }),
  );
});

/**
 * The id a settled `CommitUnknown` reads back, as the import gives it.
 */
const readBackId: Uuid = "00000000-0000-4000-8000-000000000001";

/**
 * A failure of each kind grizzle's README gives a read ("Errors": `ReadFailure`, `TransientFailure`
 * or `StaleSnapshot`), each built with grizzle's own constructor: a `StaleSnapshot` takes the
 * snapshot's fingerprint as text and admits it itself.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/4b0d45ef2156b9b83d628fdb8c3bdd96dcf7f38a/packages/grizzle/src/adapter/errors/execution.ts#L335-L350
 */
const readFailures: readonly ReadError[] = [
  new ReadFailure({ reason: serverReport }),
  serializationFailure,
  new StaleSnapshot({
    error: serverReport,
    reason: new Migrating(),
    snapshot: "fingerprint-of-another-snapshot",
  }),
];

/**
 * What the read-back of a `CommitUnknown` can answer: the package row, no row, or a failure.
 */
type ReadBack =
  | { readonly kind: "present" }
  | { readonly kind: "absent" }
  | { readonly failure: ReadError; readonly kind: "fails" };

/**
 * Every read-back: present, absent, and a failure of each kind a read has.
 */
const readBacks: readonly ReadBack[] = [
  { kind: "present" },
  { kind: "absent" },
  ...readFailures.map((failure): ReadBack => ({ failure, kind: "fails" })),
];

/**
 * The read a {@link ReadBack} stands for, as `db.get` of the package row would answer it.
 *
 * @param readBack - The read-back.
 * @returns The stub of the read.
 */
const stubRead = (
  readBack: ReadBack,
): Effect.Effect<Option.Option<{ readonly id: Uuid }>, ReadError> =>
  readBack.kind === "fails"
    ? Effect.fail(readBack.failure)
    : Effect.succeed(readBack.kind === "present" ? Option.some({ id: readBackId }) : Option.none());

/**
 * Name a {@link ReadBack}, for an assertion's message.
 *
 * @param readBack - The read-back.
 * @returns Its kind, and a failure's tag.
 */
const readBackName = (readBack: ReadBack): string =>
  readBack.kind === "fails" ? `fails with ${readBack.failure._tag}` : readBack.kind;

describe("import/package.test.ts, the read-back that settles a CommitUnknown", () => {
  plainIt.effect("answers by the read-back alone, and a failed read-back never as absent", () =>
    // Oracle: the specification as a checker, grizzle's README on `CommitUnknown` ("The change may
    // have committed: read back before you run it again"), over every read-back a read can give:
    // a package read back committed; no package read back did not, and the `CommitUnknown` is the
    // answer; a read-back that fails settles nothing, so the answer is `CommitUnresolved` carrying
    // the `CommitUnknown` and the read's own failure, never the absent package's answer.
    Effect.gen(function* everyReadBack() {
      for (const readBack of readBacks) {
        const name = readBackName(readBack);
        const commit = new CommitUnknown();
        const answer = yield* Effect.result(
          settleCommitUnknown(commit, readBackId, stubRead(readBack)),
        );

        if (readBack.kind === "present") {
          assert.deepStrictEqual(answer, Result.succeed({ kind: "committed" }), name);
        } else if (readBack.kind === "absent") {
          assert.deepStrictEqual(answer, Result.fail(commit), name);
        } else {
          const failure = Result.isFailure(answer) ? answer.failure : undefined;

          assert.instanceOf(failure, CommitUnresolved, name);
          assert.strictEqual(failure.commit, commit, name);
          assert.strictEqual(failure.cause, readBack.failure, name);
          assert.include(failure.message, readBackId, name);
          assert.include(failure.message, readBack.failure.message, name);
        }
      }
    }),
  );
});

/**
 * The refusing fixtures, each a copy of `simple` with one hand edit.
 */
const broken: readonly FixtureName[] = [
  "undeclared-response",
  "choice-in-prompt",
  "choice-bounds",
  "body-empty",
  "bad-template-uri",
  "identifier-mismatch",
];

/**
 * The refusing fixtures whose law the oracle states no host predicate for (Q5.08's value laws),
 * with the rules the law each breaks keeps: judged against the rule, not the oracle.
 * `title-mismatch`, whose `lom-title` the oracle states none for either, is judged in
 * `program.oracle.db.test.ts` with Q5.12's cases.
 */
const brokenBeyondOracle: readonly (readonly [FixtureName, readonly string[]])[] = [
  ["two-values-single", ["value-cardinality"]],
  ["bad-identifier-value", ["typed-copy", "attribute-lexical"]],
];

/**
 * The accepted fixtures, each a copy of `simple` in another encoding or layout.
 */
const clean: readonly FixtureName[] = [
  "doctype",
  "latin1",
  "external",
  "utf16",
  "comment-in-element",
  "padded-identifier-value",
  "windows-1252",
  "padded-attributes",
  "padded-text",
];

describe.skipIf(!hasLease)(
  "import/package.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "60 seconds",
    })("importPackage on the lease", (it) => {
      it.effect("accepts simple and returns the package's id", () =>
        // Oracle: PostgreSQL, every law over `simple`, and the package read back by its id.
        Effect.gen(function* acceptsSimple() {
          const id = yield* importPackage(fixtures.simple);
          const db = yield* Db.open(AuthorApp.roles.author, {});

          assert.match(id, uuidPattern);
          assert.lengthOf(yield* (yield* db.execute(packageRows, { id })).collect, 1);
        }),
      );

      for (const name of [...broken, ...clean]) {
        it.effect(`gives ${name} the law oracle's verdict`, () =>
          // Oracle: a second implementation, the law oracle's verdict over the same entries.
          Effect.gen(function* oracleAgrees() {
            yield* importAgreesWithOracle(yield* materialize(name), name);
          }),
        );
      }

      for (const [name, rules] of brokenBeyondOracle) {
        it.effect(`refuses ${name} under rules that meet ${rules.join(", ")}`, () =>
          // Oracle: the specification as a checker, the rule Q5.08's law keeps (the retired guard's,
          // `value-single` and `value-lexical`, as the refusal table maps them).
          Effect.gen(function* refusedBeyondOracle() {
            const refused = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.isTrue(
              refused instanceof ImportRefused &&
                refused.rules.some((rule) => rules.includes(rule)),
              `${name}: ${refused.message}`,
            );
          }),
        );
      }

      for (const [name, dir] of [
        ["lti", fixtures.lti],
        ["metaData", fixtures.metaData],
        ["CAT_Test01_Adaptive_EchoAdapt", fixtures.CAT_Test01_Adaptive_EchoAdapt],
        ["sample_pci", fixtures.sample_pci],
      ] as const) {
        it.effect(`gives the published ${name} the law oracle's verdict`, () =>
          // Oracle: a second implementation, the law oracle's verdict over the same entries.
          importAgreesWithOracle(dir, name),
        );
      }

      it.effect("retries one injected TransientFailure and then accepts", () =>
        // Oracle: the specification as a checker, the retry rule: a transient failure is retried.
        Effect.gen(function* retriesTransient() {
          const attempts = yield* Ref.make(0);
          const id: Uuid = yield* importPackage(fixtures.simple).pipe(
            Effect.provideService(WrapApply, <A>(apply: Effect.Effect<A, ApplyError>) =>
              Effect.flatMap(
                Ref.getAndUpdate(attempts, (n) => n + 1),
                (n): Effect.Effect<A, ApplyError> =>
                  n === 0 ? Effect.fail(serializationFailure) : apply,
              ),
            ),
          );

          assert.match(id, uuidPattern);
          assert.isAtLeast(yield* Ref.get(attempts), 2);
        }),
      );

      it.effect("fails with the TransientFailure itself after the last retry", () =>
        // Oracle: the specification as a checker, the retry rule: the last attempt's failure is the
        // call's.
        Effect.gen(function* givesUp() {
          const attempts = yield* Ref.make(0);
          const result = yield* Effect.result(
            importPackage(fixtures.simple).pipe(
              Effect.provideService(RetrySchedule, quickly),
              Effect.provideService(WrapApply, () =>
                Effect.andThen(
                  Ref.update(attempts, (n) => n + 1),
                  Effect.fail(serializationFailure),
                ),
              ),
            ),
          );

          assert.strictEqual(
            Result.isFailure(result) ? result.failure : undefined,
            serializationFailure,
          );
          assert.strictEqual(yield* Ref.get(attempts), 3);
        }),
      );

      it.effect("reads the package back when the commit's outcome is unknown", () =>
        // Oracle: the specification as a checker, `CommitUnknown`'s resolution: the apply ran and
        // committed, so the package is read back and the import answers its id.
        Effect.gen(function* readsBack() {
          const id = yield* importPackage(fixtures.simple).pipe(
            Effect.provideService(WrapApply, (apply) =>
              Effect.andThen(apply, Effect.fail(new CommitUnknown())),
            ),
          );
          const db = yield* Db.open(AuthorApp.roles.author, {});

          assert.lengthOf(yield* (yield* db.execute(packageRows, { id })).collect, 1);
        }),
      );

      it.effect("fails with CommitUnknown when the package is not there", () =>
        // Oracle: the specification as a checker, `CommitUnknown`'s resolution: no package was
        // read back, so the error is the answer.
        Effect.gen(function* notThere() {
          const result = yield* Effect.result(
            importPackage(fixtures.simple).pipe(
              Effect.provideService(WrapApply, () => Effect.fail(new CommitUnknown())),
            ),
          );

          assert.isTrue(Result.isFailure(result) && result.failure._tag === "CommitUnknown");
        }),
      );
    });
  },
);
