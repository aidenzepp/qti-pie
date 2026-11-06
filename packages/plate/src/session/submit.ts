/**
 * Submission in a test session: {@link submitItem} processes the current item's attempt in an
 * individual part, {@link submitPart} processes every presented item of a simultaneous part and
 * ends it, and {@link endPart} ends an individual part and leaves what it holds unprocessed.
 *
 * Each saves the step through `recordStep` first, then enforces the item session control the test
 * sets, then runs `score` over each item's own record, whose instance is the session's instance, a
 * `.` and the item's sequence index. A refusal is a {@link SubmissionRefused} naming the rule it
 * breaks. Every function is pure: time is the `now` the host passes, and nothing is kept between
 * calls.
 *
 * This is a boundary module, not a browser module: it calls `score`, which reads and writes the
 * stored record through its Schema codec.
 *
 * @module
 */
import { Array as Arr, Data, Option, Result } from "effect";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord } from "#plate/codec/record.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { Item } from "#plate/model/item.ts";
import { refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { Test, TestPart } from "#plate/model/test.ts";
import { isNull, match } from "#plate/model/values.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { checkResponses } from "#plate/responses.ts";
import { score } from "#plate/score.ts";
import type { InvalidResponses, RecordMismatch, ResponsesRefused } from "#plate/score.ts";
import { UnknownItemRef } from "#plate/session/control.ts";
import type { Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import {
  ItemNotInSession,
  TestNotDeliverable,
  itemView,
  present,
  recordStep,
  withItem,
} from "#plate/session/start.ts";
import type { InvalidTime } from "#plate/session/start.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The intents this module carries out.
 */
export type SubmissionIntent = "end-part" | "submit-item" | "submit-part";

/**
 * Why a submission is refused.
 *
 * - `test-closed`: the test has closed, so it takes no intent.
 * - `wrong-submission-mode`: the intent is not the current part's: `submit-item` and `end-part`
 *   belong to an individual part, `submit-part` to a simultaneous one.
 * - `attempts-exhausted`: the item's processed attempts have reached its attempt limit.
 * - `item-closed`: the item is closed for another reason.
 * - `skipping-not-allowed`: the item's `allow-skipping` is false and every response is NULL or its
 *   declared default.
 * - `responses-invalid`: the item's `validate-responses` is true and a response breaks a limit of its
 *   interaction; or, for `submit-part`, `score` refuses a presented item's responses, which break a
 *   limit the item sets whatever the configuration (tier (a)). The refusal carries the messages and
 *   names the item they concern.
 */
export type SubmissionRule =
  | "attempts-exhausted"
  | "item-closed"
  | "responses-invalid"
  | "skipping-not-allowed"
  | "test-closed"
  | "wrong-submission-mode";

/**
 * What each intent does in the part it belongs to, as {@link SubmissionRefused}'s message for
 * `wrong-submission-mode` writes it.
 */
const modeRemedies: Readonly<Record<SubmissionIntent, string>> = {
  "end-part":
    "The current part submits its items together, so it takes no end-part. Post submit-part, which processes its items and ends it.",
  "submit-item":
    "The current part submits its items together, so it takes no submit-item. Post submit-part to submit every item of the part.",
  "submit-part":
    "The current part submits each item on its own, so it takes no submit-part. Post submit-item for the current item, or end-part to end the part.",
};

/**
 * A submission the test's rules refuse now, with the rule it breaks.
 *
 * `intent` is the intent refused. `sequenceIndex` names the item the refusal concerns: the current
 * item, except for a `submit-part` whose `score` refuses another item's responses, where it is that
 * item's; none when the test has closed. `messages` holds what the item's interactions say about
 * its responses for `responses-invalid`, ready for `render`'s `messages` option with that item's
 * instance, and is empty for every other rule.
 */
export class SubmissionRefused extends Data.TaggedError("SubmissionRefused")<{
  readonly intent: SubmissionIntent;
  readonly messages: readonly ValidationMessage[];
  readonly rule: SubmissionRule;
  readonly sequenceIndex: Option.Option<number>;
}> {
  /**
   * The rule, the item it concerns, and what to post instead.
   */
  override get message(): string {
    const item = Option.match(this.sequenceIndex, {
      onNone: () => "The current item",
      onSome: (index) => `Item ${index}`,
    });

    switch (this.rule) {
      case "attempts-exhausted": {
        return `${item} has used every attempt its max-attempts allows, so it takes no further submit-item. Move to another item, or end the part.`;
      }
      case "item-closed": {
        return `${item} is closed, so it takes no submit-item. Move to an open item, or end the part.`;
      }
      case "responses-invalid": {
        const said = this.messages.map((entry) => `${entry.response}: ${entry.text}`).join("; ");

        return this.intent === "submit-part"
          ? `${item}'s saved responses break limits the item sets whatever the configuration (${said}), so score refuses them and the part is not submitted. Show these messages on that item, for example through render's messages option with its instance, and submit the part again once its responses are corrected.`
          : `${item} validates its responses (validate-responses is true), and they break its interactions' limits (${said}). Show these messages, for example through render's messages option, and submit the corrected responses.`;
      }
      case "skipping-not-allowed": {
        return `${item} may not be skipped (allow-skipping is false), and every response posted for it is NULL or its declared default. Give at least one response another value, then submit again.`;
      }
      case "test-closed": {
        return `The test session has closed, so it takes no ${this.intent}. Show the summary current gives instead.`;
      }
      case "wrong-submission-mode": {
        return modeRemedies[this.intent];
      }
      default: {
        return this.rule satisfies never;
      }
    }
  }
}

/**
 * Why `score` and the stored record's codec may fail an item's attempt.
 */
type ScoreFailure =
  | EngineFailure
  | InvalidRecord
  | InvalidResponses
  | RecordMismatch
  | ResponsesRefused;

/**
 * Why {@link endPart}, or the end of a part, may fail: a refusal, a stored session that does not
 * fit the test or the items passed, or an invalid `now`.
 */
export type PartEndFailure =
  | InvalidTime
  | ItemNotInSession
  | SubmissionRefused
  | TestNotDeliverable
  | UnknownItemRef;

/**
 * Why {@link submitItem} or {@link submitPart} may fail: a refusal, a part end's failures, or an
 * attempt `score` cannot run. For responses that break a tier (a) limit, {@link submitItem} passes
 * `score`'s `ResponsesRefused` through, and {@link submitPart} refuses with `responses-invalid`
 * naming the item.
 */
export type SubmissionFailure = PartEndFailure | ScoreFailure;

/**
 * Find the test part that holds an item ref, with its index among the test's parts.
 *
 * @param test The test.
 * @param ref The item ref's identifier.
 * @returns The part and its index, or {@link UnknownItemRef} when no part holds the ref.
 */
const partHolding = (
  test: Test,
  ref: string,
): Result.Result<{ readonly index: number; readonly part: TestPart }, UnknownItemRef> =>
  Result.fromOption(
    Arr.findFirst(test.parts, (part, index) =>
      refIdentifiersIn(part.children).includes(ref) ? Option.some({ index, part }) : Option.none(),
    ),
    () => new UnknownItemRef({ ref, test: test.identifier }),
  );

/**
 * Refuse a submission once the test has closed.
 *
 * @param session The session.
 * @param intent The intent posted.
 * @returns The session while it is open, or {@link SubmissionRefused} `test-closed`.
 */
const stillOpen = (
  session: TestSession,
  intent: SubmissionIntent,
): Result.Result<TestSession, SubmissionRefused> =>
  session.status === "closed"
    ? Result.fail(
        new SubmissionRefused({
          intent,
          messages: [],
          rule: "test-closed",
          sequenceIndex: Option.none(),
        }),
      )
    : Result.succeed(session);

/**
 * Find a session's current item: the item at its position.
 *
 * @param session The session.
 * @returns The item's index in `session.items` and the item, or {@link ItemNotInSession} when the
 *   position is past the items.
 */
const currentItem = (
  session: TestSession,
): Result.Result<readonly [number, SessionItem], ItemNotInSession> => {
  const item = session.items[session.position];

  return item === undefined
    ? Result.fail(
        new ItemNotInSession({ count: session.items.length, sequenceIndex: session.position + 1 }),
      )
    : Result.succeed([session.position, item]);
};

/**
 * Find the accepted item the host passed for a session item, and check it is the item its record
 * belongs to.
 *
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session.
 * @param item The session item.
 * @returns The accepted item, or {@link TestNotDeliverable}: `item-missing` when the items have no
 *   entry for its ref, `item-mismatch` when its entry is the item of another document.
 */
export const deliveredItem = (
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  item: SessionItem,
): Result.Result<Accepted, TestNotDeliverable> => {
  const accepted = items.get(item.ref);
  const expected = item.record.document;
  if (accepted === undefined) {
    return Result.fail(
      new TestNotDeliverable({
        expected,
        found: Option.none(),
        reason: "item-missing",
        ref: item.ref,
        test: session.test,
      }),
    );
  }

  return accepted.document === expected
    ? Result.succeed(accepted)
    : Result.fail(
        new TestNotDeliverable({
          expected,
          found: Option.some(accepted.document),
          reason: "item-mismatch",
          ref: item.ref,
          test: session.test,
        }),
      );
};

/**
 * Give the responses an item's attempt is processed with: each saved response, else its record's,
 * which holds NULL or, once the item is presented, its declared default.
 *
 * @param item The session item.
 * @returns The responses, by identifier.
 */
const valuesOf = (item: SessionItem): Responses =>
  Option.match(item.saved, {
    onNone: () => item.record.responses,
    onSome: (saved) => ({ ...item.record.responses, ...saved }),
  });

/**
 * Say whether an item's responses skip it.
 *
 * The information model defines an item as skipped when every response variable is submitted with
 * its default value or is NULL, and an item with no response variable as never skipped (Table
 * 7.19.6, `allow-skipping`). A response is at its default when it `match`es the declaration's
 * `qti-default-value`.
 *
 * @param item The item.
 * @param values The responses, by identifier; one left out is NULL.
 * @returns Whether the item is skipped.
 */
const skipped = (item: Item, values: Responses): boolean => {
  const declarations = [...item.responses.values()];

  return (
    declarations.length > 0 &&
    declarations.every((declaration) => {
      const value = Object.hasOwn(values, declaration.identifier)
        ? values[declaration.identifier]
        : undefined;

      return (
        value === undefined ||
        isNull(value) ||
        Option.exists(declaration.defaultValue, (fallback) => match(value, fallback))
      );
    })
  );
};

/**
 * Process one attempt of a session item: run `score` over its record, encoded to the form `score`
 * takes and decoded back, and clear its saved responses.
 *
 * The attempt that processes the item's first attempt writes its outcomes to `firstOutcomes`,
 * which no later attempt changes (F1).
 *
 * @param accepted The item the session item delivers.
 * @param item The session item.
 * @param values The responses to process.
 * @param datestamp The time of the transition, in ISO 8601.
 * @returns The session item after the attempt, or what `score` or the record's codec failed with.
 */
const processed = (
  accepted: Accepted,
  item: SessionItem,
  values: Responses,
  datestamp: string,
): Result.Result<SessionItem, ScoreFailure> =>
  Result.gen(function* processAttempt() {
    const stored = yield* score(accepted, values, yield* encodeRecord(item.record));
    const record = yield* decodeRecord(stored);

    return {
      ...item,
      datestamp,
      firstOutcomes: Option.orElse(item.firstOutcomes, () => Option.some(record.outcomes)),
      record,
      saved: Option.none(),
    };
  });

/**
 * Process one attempt of a session item as part of a part's submission: as {@link processed}, but
 * `score`'s refusal of the item's responses becomes a {@link SubmissionRefused} that names the
 * item, since the part's other items, the current one among them, are not the item it concerns.
 *
 * @param accepted The item the session item delivers.
 * @param item The session item.
 * @param datestamp The time of the transition, in ISO 8601.
 * @returns The session item after the attempt; `responses-invalid` naming the item with `score`'s
 *   messages; or what `score` or the record's codec failed with otherwise.
 */
const processedInPart = (
  accepted: Accepted,
  item: SessionItem,
  datestamp: string,
): Result.Result<SessionItem, ScoreFailure | SubmissionRefused> =>
  Result.mapError(processed(accepted, item, valuesOf(item), datestamp), (failure) =>
    failure._tag === "ResponsesRefused"
      ? new SubmissionRefused({
          intent: "submit-part",
          messages: failure.messages,
          rule: "responses-invalid",
          sequenceIndex: Option.some(item.sequenceIndex),
        })
      : failure,
  );

/**
 * End a test part: move to the next part that holds an item, whose first item is presented, or
 * close the test when no such part follows.
 *
 * The parts between, which hold no item, end as the candidate reaches them, as at the start.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, its step already saved.
 * @param ending The index of the part that ends, among the test's parts.
 * @param now The time of the transition.
 * @returns The session after the part's end; {@link UnknownItemRef} when the session holds no item
 *   for the next part's first item ref; or a failure of `present`.
 */
const partEnded = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  ending: number,
  now: Date,
): Result.Result<TestSession, PartEndFailure> => {
  const next = Arr.findFirst(test.parts, (part, index) =>
    index > ending
      ? Option.map(Arr.head(refIdentifiersIn(part.children)), (ref) => ({ index, ref }))
      : Option.none(),
  );
  const reached = Option.match(next, {
    onNone: () => test.parts.length,
    onSome: ({ index }) => index,
  });
  const parts = session.parts.map((part, index) => {
    if (index < ending || index > reached) {
      return part;
    }

    return {
      identifier: part.identifier,
      status: index === reached ? "current" : "ended",
    } as const;
  });

  return Option.match(next, {
    onNone: () => Result.succeed({ ...session, parts, status: "closed" }),
    onSome: ({ ref }) =>
      Result.flatMap(
        Result.fromOption(
          Arr.findFirst(session.items, (item, position) =>
            item.ref === ref ? Option.some([position, item] as const) : Option.none(),
          ),
          () => new UnknownItemRef({ ref, test: test.identifier }),
        ),
        ([position, item]) =>
          present(items, { ...session, parts, position }, item.sequenceIndex, now),
      ),
  });
};

/**
 * Submit the current item of an individual part: process one attempt over its responses.
 *
 * The step is saved first. Then, in order: a closed test is `test-closed`; a simultaneous part is
 * `wrong-submission-mode`; an item whose processed attempts, the record's `numAttempts`, have
 * reached its effective attempt limit above 0 is `attempts-exhausted`, and an item closed
 * otherwise `item-closed`; under `allow-skipping` false an item whose every response is NULL or its
 * declared default is `skipping-not-allowed`; under `validate-responses` true, responses
 * `checkResponses` gives messages for are `responses-invalid`. Otherwise `score` runs over the
 * item's record with its saved responses, and its failures, `ResponsesRefused` among them, pass
 * through. The item stays current: moving on is a move's.
 *
 * @example
 *   submitItem(test, items, session, { intent: { kind: "submit-item" }, responses }, configuration, {
 *   now: new Date(),
 *   });
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param step The request: the responses it posts are saved and processed; its intent is not read,
 *   so a step of another intent can submit the item first.
 * @param configuration The host's configuration, whose locale the messages take.
 * @param context The transition.
 * @param context.now When it happens.
 * @returns The session with the attempt processed, or a {@link SubmissionFailure}.
 */
export const submitItem = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  step: Step,
  configuration: Configuration,
  context: { readonly now: Date },
): Result.Result<TestSession, SubmissionFailure> =>
  Result.gen(function* submitCurrentItem() {
    const saved = yield* stillOpen(yield* recordStep(session, step, context.now), "submit-item");
    const [index, item] = yield* currentItem(saved);
    const view = yield* itemView(test, saved, configuration, item.sequenceIndex);
    const refuse = (rule: SubmissionRule, messages: readonly ValidationMessage[] = []) =>
      Result.fail(
        new SubmissionRefused({
          intent: "submit-item",
          messages,
          rule,
          sequenceIndex: Option.some(item.sequenceIndex),
        }),
      );
    if (view.submission === "simultaneous") {
      return yield* refuse("wrong-submission-mode");
    }

    const limit = view.configuration.maxAttempts;
    if (limit > 0 && item.record.numAttempts >= limit) {
      return yield* refuse("attempts-exhausted");
    }

    if (view.disabled) {
      return yield* refuse("item-closed");
    }

    const accepted = yield* deliveredItem(items, saved, item);
    const values = valuesOf(item);
    if (!view.configuration.allowSkipping && skipped(accepted.item, values)) {
      return yield* refuse("skipping-not-allowed");
    }

    const messages = view.configuration.validateResponses
      ? checkResponses(accepted, values, view.configuration)
      : [];
    if (messages.length > 0) {
      return yield* refuse("responses-invalid", messages);
    }

    const done = yield* processed(accepted, item, values, saved.updated);

    return { ...saved, items: withItem(saved, index, done) };
  });

/**
 * Submit the current part when it is simultaneous: process every presented item of it, then end
 * it.
 *
 * The step is saved first. A closed test is `test-closed`; an individual part is
 * `wrong-submission-mode`. Each presented item of the part is processed once, in sequence, with its
 * saved responses over its record's; `allow-skipping` and `validate-responses` do not apply in a
 * simultaneous part. An item the candidate never saw is not processed: it closes as it is, with
 * NULL responses, its default outcomes and `numAttempts` 0. The part then ends as
 * {@link endPart} ends one. An attempt `score` cannot run fails the whole submission: where `score`
 * refuses an item's responses (tier (a)), the refusal is `responses-invalid` naming that item,
 * which need not be the current one, with `score`'s messages.
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param step The request, whose responses are saved on the current item first.
 * @param context The transition.
 * @param context.now When it happens.
 * @returns The session after the part's end, or a {@link SubmissionFailure}.
 */
export const submitPart = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  step: Step,
  context: { readonly now: Date },
): Result.Result<TestSession, SubmissionFailure> =>
  Result.gen(function* submitCurrentPart() {
    const saved = yield* stillOpen(yield* recordStep(session, step, context.now), "submit-part");
    const [, item] = yield* currentItem(saved);
    const { index, part } = yield* partHolding(test.test, item.ref);
    if (part.submission !== "simultaneous") {
      return yield* Result.fail(
        new SubmissionRefused({
          intent: "submit-part",
          messages: [],
          rule: "wrong-submission-mode",
          sequenceIndex: Option.some(item.sequenceIndex),
        }),
      );
    }

    const members = new Set(refIdentifiersIn(part.children));
    const after = yield* Result.all(
      saved.items.map((entry) =>
        members.has(entry.ref) && entry.presented
          ? Result.flatMap(deliveredItem(items, saved, entry), (accepted) =>
              processedInPart(accepted, entry, saved.updated),
            )
          : Result.succeed(entry),
      ),
    );

    return yield* partEnded(test.test, items, { ...saved, items: after }, index, context.now);
  });

/**
 * End the current part when it is individual, leaving its items as they are.
 *
 * The step is saved first. A closed test is `test-closed`; a simultaneous part, which ends only by
 * {@link submitPart}, is `wrong-submission-mode`. No item is processed: an item with saved,
 * unsubmitted responses keeps them, unscored, and every item of the part closes. The next part
 * that holds an item becomes current and its first item is presented, the parts between ending as
 * the candidate passes them; when none follows, the test closes.
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param step The request, whose responses are saved on the current item first.
 * @param context The transition.
 * @param context.now When it happens.
 * @returns The session after the part's end, or a {@link PartEndFailure}.
 */
export const endPart = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  step: Step,
  context: { readonly now: Date },
): Result.Result<TestSession, PartEndFailure> =>
  Result.gen(function* endCurrentPart() {
    const saved = yield* stillOpen(yield* recordStep(session, step, context.now), "end-part");
    const [, item] = yield* currentItem(saved);
    const { index, part } = yield* partHolding(test.test, item.ref);
    if (part.submission === "simultaneous") {
      return yield* Result.fail(
        new SubmissionRefused({
          intent: "end-part",
          messages: [],
          rule: "wrong-submission-mode",
          sequenceIndex: Option.some(item.sequenceIndex),
        }),
      );
    }

    return yield* partEnded(test.test, items, saved, index, context.now);
  });
