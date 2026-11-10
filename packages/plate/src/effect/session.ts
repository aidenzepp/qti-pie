/**
 * The Effect versions of the session lifecycle: {@link begin}, {@link startTest}, {@link advance}
 * and {@link results}.
 *
 * Each calls its plain function and lifts the plain `Result` with `Effect.fromResult`, so a mirror
 * succeeds and fails exactly as the plain function does given the same arguments. What a mirror
 * changes is where the arguments the plain function takes from its caller come from: the time from
 * Effect's `Clock`, an absent seed from {@link drawnSeed}, and the configuration from the
 * {@link Configuration} service. A program provides `TestClock` or its own `Randomness` to fix
 * them; the plain functions keep taking `now`, the datestamp and their seeds. Nothing outside
 * `src/effect/` imports this module.
 *
 * @module
 */
import { DateTime, Effect } from "effect";
import { begin as plainBegin } from "#plate/begin.ts";
import type { InvalidRecord, StoredRecord } from "#plate/codec/record.ts";
import type { InvalidSession, SessionMismatch } from "#plate/codec/session.ts";
import { Configuration } from "#plate/effect/configuration.ts";
import { drawnSeed } from "#plate/effect/randomness.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import { results as plainResults } from "#plate/results/results.ts";
import type {
  InvalidResultContext,
  ResultItemMissing,
  ResultsInput as PlainResultsInput,
} from "#plate/results/results.ts";
import type { RecordMismatch } from "#plate/score.ts";
import { advance as plainAdvance } from "#plate/session/advance.ts";
import type { AdvanceFailure } from "#plate/session/advance.ts";
import type { Step, TestSession } from "#plate/session/session.ts";
import { startTest as plainStartTest } from "#plate/session/start.ts";
import type {
  InvalidSessionInstance,
  InvalidTime,
  TestNotDeliverable,
} from "#plate/session/start.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * What {@link results} reports: the plain `ResultsInput`, but an item's `datestamp` may be left
 * out, and then it is the `Clock`'s now.
 */
type ClockedResultsInput =
  | (Omit<Extract<PlainResultsInput, { readonly kind: "item" }>, "datestamp"> & {
      readonly datestamp?: Date;
    })
  | Extract<PlainResultsInput, { readonly kind: "test" }>;

/**
 * Start the stored record of an item's first attempt, as the plain `begin` does, drawing its seed
 * through `Randomness` when the host gives none.
 *
 * A host's seed is used as given, `""` included, and then nothing is drawn. Absent, the seed is
 * {@link drawnSeed}'s, in `drawSeed`'s format, so the same document, instance and drawn bytes give
 * the record the plain `begin` gives under that seed.
 *
 * @example
 *   begin(accepted, { instance: "q1" });
 *   // an Effect of the record begin(accepted, { instance: "q1", seed }) gives in the plain API,
 *   // under the seed Randomness draws
 *
 * @param document The document `check` accepted.
 * @param start The use of the item the record starts.
 * @param start.instance The host's name for this use of the item, which scopes its ids.
 * @param start.seed The host's seed, which keys every value template processing draws, used as
 *   given; with none, one is drawn through `Randomness`.
 * @returns The record of the first attempt, in the form the host stores, or the plain `begin`'s
 *   failure: {@link InvalidRecord} at stage `encode`, a renderer defect, or an
 *   {@link EngineFailure} from template processing.
 */
export const begin = Effect.fnUntraced(function* begin(
  document: Accepted,
  start: { readonly instance: string; readonly seed?: string },
): Effect.fn.Return<StoredRecord, EngineFailure | InvalidRecord> {
  const seed = start.seed ?? (yield* drawnSeed);

  return yield* Effect.fromResult(plainBegin(document, { instance: start.instance, seed }));
});

/**
 * Start a test session, as the plain `startTest` does, at the `Clock`'s now, under the
 * {@link Configuration} service, drawing the processing seed through `Randomness` when the host
 * gives none.
 *
 * The configuration's `seed` stays the session's shuffle seed and never its processing seed. A
 * host's processing seed is used as given, and then nothing is drawn.
 *
 * @example
 *   startTest(test, items, { instance: "sitting-42" }).pipe(Effect.provide(ConfigurationFromEnv));
 *
 * @param test The test, as `check` accepted it.
 * @param items The test's items, each as `check` accepted it, keyed by the identifier of the item
 *   ref that names its document.
 * @param context The sitting.
 * @param context.instance The host's name for this sitting, which scopes every item's ids: a token
 *   `checkInstance` passes, such as a lowercase UUID.
 * @param context.seed The processing seed, which keys every value the session's processing draws,
 *   used as given; with none, one is drawn through `Randomness`. Server data: keep it from the
 *   page.
 * @returns The session, or the plain `startTest`'s failure: {@link TestNotDeliverable},
 *   {@link InvalidSessionInstance}, an {@link EngineFailure} of the first part's template defaults,
 *   or {@link InvalidTime}, which only a `Clock` whose time is not a number gives.
 */
export const startTest = Effect.fnUntraced(function* startTest(
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  context: { readonly instance: string; readonly seed?: string },
): Effect.fn.Return<
  TestSession,
  EngineFailure | InvalidSessionInstance | InvalidTime | TestNotDeliverable,
  Configuration
> {
  const configuration = yield* Configuration;
  const now = yield* DateTime.nowAsDate;
  const seed = context.seed ?? (yield* drawnSeed);

  return yield* Effect.fromResult(
    plainStartTest(test, items, configuration, { instance: context.instance, now, seed }),
  );
});

/**
 * Carry out what one request asks of a test session, as the plain `advance` does, at the
 * `Clock`'s now and under the {@link Configuration} service.
 *
 * @example
 *   advance(test, items, session, { intent: { kind: "next" }, responses }).pipe(
 *     Effect.provide(ConfigurationFromEnv),
 *   );
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param step The intent, and the responses posted with it, which are checked and saved only on an
 *   open item.
 * @returns The session after the intent, or the plain `advance`'s {@link AdvanceFailure}; its
 *   `InvalidTime` only a `Clock` whose time is not a number gives.
 */
export const advance = Effect.fnUntraced(function* advance(
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  step: Step,
): Effect.fn.Return<TestSession, AdvanceFailure, Configuration> {
  const configuration = yield* Configuration;
  const now = yield* DateTime.nowAsDate;

  return yield* Effect.fromResult(plainAdvance(test, items, session, step, configuration, { now }));
});

/**
 * Write the Results Reporting document for an item or a test session, as the plain `results`
 * does, where an item's `datestamp` left out is the `Clock`'s now.
 *
 * The plain `datestamp` is the `Date` of the item session's last change, so a host that writes an
 * item's result as that change happens leaves it out; one that writes it later passes the time of
 * the change. A test session's result reads its times from the stored session, never the `Clock`.
 *
 * @example
 *   results({ context: { sourcedId: "candidate-1" }, document: accepted, kind: "item", record });
 *   // its itemResult's datestamp is the Clock's now
 *
 * @param input The item or the test session to report, and the context; an item's `datestamp` may
 *   be left out.
 * @returns The document's text, or the plain `results`' failure: {@link InvalidResultContext},
 *   {@link InvalidRecord}, {@link InvalidSession}, {@link SessionMismatch}, {@link RecordMismatch}
 *   or {@link ResultItemMissing}.
 */
export const results = Effect.fnUntraced(function* results(
  input: ClockedResultsInput,
): Effect.fn.Return<
  string,
  | InvalidRecord
  | InvalidResultContext
  | InvalidSession
  | RecordMismatch
  | ResultItemMissing
  | SessionMismatch
> {
  if (input.kind === "test") {
    return yield* Effect.fromResult(plainResults(input));
  }

  const datestamp = input.datestamp ?? (yield* DateTime.nowAsDate);

  return yield* Effect.fromResult(plainResults({ ...input, datestamp }));
});
