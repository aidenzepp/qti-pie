/**
 * One entry point over a test session's intents: {@link advance} carries out what a request asks,
 * through the moves of `#plate/session/navigate.ts` and the submissions of
 * `#plate/session/submit.ts`, and refuses what the test's rules forbid now with an
 * {@link IntentRefused}.
 *
 * `allowedIntents` of `#plate/session/intents.ts` lists exactly the intents this accepts now, given
 * responses that pass the item's checks, so a host can offer those and post any of them. Every
 * function is pure: time is the `now` the host passes, and nothing is kept between calls.
 *
 * This is a boundary module, not a browser module: it calls the submissions, which call `score`,
 * and `score` reads and writes the stored record through its Schema codec.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import { encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord } from "#plate/codec/record.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { score } from "#plate/score.ts";
import type { InvalidResponses, RecordMismatch, ResponsesRefused } from "#plate/score.ts";
import type { UnknownItemRef } from "#plate/session/control.ts";
import { move, requestOf } from "#plate/session/navigate.ts";
import type { MoveRefused, MoveRule, MoveStep } from "#plate/session/navigate.ts";
import type { Intent, Step, TestSession } from "#plate/session/session.ts";
import { ItemNotInSession, current } from "#plate/session/start.ts";
import type { InvalidTime, TestNotDeliverable } from "#plate/session/start.ts";
import { deliveredItem, endPart, submitItem, submitPart } from "#plate/session/submit.ts";
import type { SubmissionFailure, SubmissionRefused } from "#plate/session/submit.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * Why {@link advance} refuses an intent: exactly the rules the test's navigation and submission
 * modes and its item session control give.
 *
 * - `test-closed`: the test has closed, so it takes no intent.
 * - `linear-back`: `previous` in a linear part.
 * - `linear-jump`: `go` to another item than the current one in a linear part, or `end-part` in a
 *   linear, individual part, whose last item's `next` ends it.
 * - `start-of-part`: `previous` from the first item of a nonlinear part.
 * - `end-of-part`: `next` from the last item of a part that `end-part` or `submit-part` ends.
 * - `out-of-range`: `go` to a sequence index that names no item of the current part.
 * - `wrong-submission-mode`: `submit-item` or `end-part` in a simultaneous part, or `submit-part` in
 *   an individual one.
 * - `attempts-exhausted`: the item's processed attempts have reached its attempt limit.
 * - `item-closed`: the item is closed for another reason.
 * - `skipping-not-allowed`: the item's `allow-skipping` is false and every response is NULL or its
 *   declared default.
 * - `responses-invalid`: the item's `validate-responses` is true and a response breaks a limit of its
 *   interaction; or `score` refuses the responses of an item `submit-part` processes, which break a
 *   limit the item sets whatever the configuration (tier (a)); or `score` would refuse the
 *   responses of the item a `next` leaves in a linear, simultaneous part, which the candidate
 *   cannot return to before `submit-part` processes it. The refusal carries the messages and names
 *   the item they concern.
 */
export type IntentRule =
  | "attempts-exhausted"
  | "end-of-part"
  | "item-closed"
  | "linear-back"
  | "linear-jump"
  | "out-of-range"
  | "responses-invalid"
  | "skipping-not-allowed"
  | "start-of-part"
  | "test-closed"
  | "wrong-submission-mode";

/**
 * The failure of {@link advance} for an intent the test's rules forbid now.
 *
 * `rule` says which rule refuses it, and `sequenceIndex` names the item it concerns: the current
 * item, except for a `submit-part` refused for another item's responses, where it is that item's;
 * none once the test has closed. `messages` holds what the item's interactions say about the
 * responses for `responses-invalid`, ready for `render`'s `messages` option with the instance of
 * the item `sequenceIndex` names, and is empty for every other rule.
 * `refusal` is the move's or the submission's own refusal, with what it knows of the place, such as
 * the part's first and last items; it is none for the three refusals `advance` makes itself:
 * `test-closed`, `end-part` in a linear, individual part, and `next` in a linear, simultaneous part
 * whose item's responses `score` would refuse (`responses-invalid`). A refused intent changes
 * nothing, the responses the request carried included.
 */
export class IntentRefused extends Data.TaggedError("IntentRefused")<{
  readonly intent: Intent;
  readonly messages: readonly ValidationMessage[];
  readonly refusal: Option.Option<MoveRefused | SubmissionRefused>;
  readonly rule: IntentRule;
  readonly sequenceIndex: Option.Option<number>;
}> {
  /**
   * The request, the rule that refuses it, and what to post instead.
   */
  override get message(): string {
    const request = requestOf(this.intent);
    const item = Option.match(this.sequenceIndex, {
      onNone: () => "the current item",
      onSome: (index) => `item ${index}`,
    });

    return Option.match(this.refusal, {
      onNone: () => {
        if (this.rule === "test-closed") {
          return `The test session has closed, so it takes no ${request}. Show the summary current gives instead.`;
        }

        if (this.rule === "responses-invalid") {
          const said = this.messages.map((entry) => `${entry.response}: ${entry.text}`).join("; ");

          return `The ${request} from ${item} is refused (${this.rule}) and nothing it posted is saved: its part is linear, so the candidate cannot return to the item, and its responses break limits the item sets whatever the configuration (${said}), so score would refuse them when the part is submitted. Show these messages on that item, for example through render's messages option with its instance, and post ${request} again with corrected responses.`;
        }

        return `The ${request} from ${item} is refused (${this.rule}): its part is linear with individual submission, so the candidate leaves it only with next, which on the part's last item submits that item when it has no processed attempt and ends the part. Offer next instead.`;
      },
      onSome: (refusal) =>
        refusal._tag === "SubmissionRefused" && this.intent.kind === "next"
          ? `The next from ${item} submits it first, since its part is linear with individual submission and it has no processed attempt, and that submission is refused (${this.rule}): ${refusal.message}`
          : refusal.message,
    });
  }
}

/**
 * Why {@link advance} may fail.
 *
 * {@link IntentRefused} is the test's rules refusing the intent, a `submit-part` whose `score`
 * refuses an item's responses and a `next` in a linear, simultaneous part whose item's responses
 * `score` would refuse among them (`responses-invalid`, naming the item).
 * `ResponsesRefused` is `score` refusing the responses `submit-item`, or a `next` that submits
 * first, processes on the current item; `InvalidResponses` is `score` refusing a response that does
 * not fit its declaration; and `EngineFailure` is an item's processing failing. The rest pass
 * through from the moves and the submissions for what a host passes that does not fit:
 * `InvalidTime` for an invalid `now`, `ItemNotInSession` and `UnknownItemRef` for a session that is
 * not the test's, `TestNotDeliverable` for items that lack the one an intent reaches or hold
 * another document's, and `InvalidRecord` and `RecordMismatch` for an item record `score` cannot
 * take.
 */
export type AdvanceFailure =
  | EngineFailure
  | IntentRefused
  | InvalidRecord
  | InvalidResponses
  | InvalidTime
  | ItemNotInSession
  | RecordMismatch
  | ResponsesRefused
  | TestNotDeliverable
  | UnknownItemRef;

/**
 * What every transition of one {@link advance} call works with.
 */
interface Advancing {
  readonly configuration: Configuration;
  readonly items: ReadonlyMap<string, Accepted>;
  /**
   * Whether the current part is linear with individual submission: the one combination where
   * `next` submits an item with no processed attempt first, `next` on the last item ends the part,
   * and `end-part` is not offered. A move never leaves its part and a submission keeps it, so this
   * holds for the whole call.
   */
  readonly linearIndividual: boolean;
  /**
   * Whether the current part is linear with simultaneous submission: the combination where `next`
   * leaves an item for good while its attempt waits for `submit-part`, so `next` first checks the
   * item's responses as `score` will.
   */
  readonly linearSimultaneous: boolean;
  readonly now: Date;
  readonly test: AcceptedTest;
}

/**
 * Give the {@link IntentRefused} for a move's refusal.
 *
 * @param intent The intent posted.
 * @param refusal The move's refusal.
 * @param rule Its rule, which {@link advance} never lets be `unsubmitted`.
 * @returns The refusal.
 */
const refusedMove = (
  intent: Intent,
  refusal: MoveRefused,
  rule: Exclude<MoveRule, "unsubmitted">,
): IntentRefused =>
  new IntentRefused({
    intent,
    messages: [],
    refusal: Option.some(refusal),
    rule,
    sequenceIndex: refusal.from.pipe(Option.map((origin) => origin.sequenceIndex)),
  });

/**
 * Give the {@link IntentRefused} for an intent posted once the test has closed.
 *
 * @param intent The intent posted.
 * @returns The `test-closed` refusal.
 */
const closedRefusal = (intent: Intent): IntentRefused =>
  new IntentRefused({
    intent,
    messages: [],
    refusal: Option.none(),
    rule: "test-closed",
    sequenceIndex: Option.none(),
  });

/**
 * Turn a submission's refusal into an {@link IntentRefused} for the intent posted, leaving its other
 * failures as they are.
 *
 * @param intent The intent posted.
 * @param result What the submission returned.
 * @returns The same result, a {@link SubmissionRefused} read as the intent's refusal.
 */
const asIntent = (
  intent: Intent,
  result: Result.Result<TestSession, SubmissionFailure>,
): Result.Result<TestSession, AdvanceFailure> =>
  Result.mapError(result, (failure) =>
    failure._tag === "SubmissionRefused"
      ? new IntentRefused({
          intent,
          messages: failure.messages,
          refusal: Option.some(failure),
          rule: failure.rule,
          sequenceIndex: failure.sequenceIndex,
        })
      : failure,
  );

/**
 * Submit the current item with the request's responses, its refusal read as the intent's.
 *
 * @param advancing What the call works with.
 * @param session The session.
 * @param step The request: `submit-item`, or a `next` that submits first.
 * @returns The session with the attempt processed, or an {@link AdvanceFailure}.
 */
const submitted = (
  advancing: Advancing,
  session: TestSession,
  step: Step,
): Result.Result<TestSession, AdvanceFailure> =>
  asIntent(
    step.intent,
    submitItem(advancing.test, advancing.items, session, step, advancing.configuration, {
      now: advancing.now,
    }),
  );

/**
 * Check the item a `next` left in a linear, simultaneous part the way `submit-part` will process
 * it: `score` over its record with its saved responses, the attempt it gives discarded.
 *
 * The candidate cannot return to an item of a linear part, and `submit-part` processes it with the
 * responses it holds when it is left. So responses `score` refuses (tier (a)) would refuse the
 * part's submission with no way to correct them; they refuse the `next` instead, as
 * `responses-invalid` naming the item, with `score`'s messages. Tier (b), `validate-responses`,
 * does not apply in a simultaneous part.
 *
 * @param advancing What the call works with.
 * @param session The session the `next` was posted on.
 * @param moved The session after the move, whose item at `session`'s position holds the step.
 * @param intent The intent posted.
 * @returns `moved` when `score` takes the item's responses; {@link IntentRefused}
 *   `responses-invalid` when it refuses them; what `score` or the record's codec fails with
 *   otherwise, which `submit-part` would meet.
 */
const leftScoreable = (
  advancing: Advancing,
  session: TestSession,
  moved: TestSession,
  intent: Intent,
): Result.Result<TestSession, AdvanceFailure> =>
  Result.gen(function* checkLeftItem() {
    const left = yield* Result.fromOption(
      Option.fromUndefinedOr(moved.items[session.position]),
      () =>
        new ItemNotInSession({ count: moved.items.length, sequenceIndex: session.position + 1 }),
    );
    const accepted = yield* deliveredItem(advancing.items, moved, left);
    const values = Option.match(left.saved, {
      onNone: () => left.record.responses,
      onSome: (saved) => ({ ...left.record.responses, ...saved }),
    });
    const attempt = score(accepted, values, yield* encodeRecord(left.record));
    if (Result.isFailure(attempt) && attempt.failure._tag === "ResponsesRefused") {
      return yield* Result.fail(
        new IntentRefused({
          intent,
          messages: attempt.failure.messages,
          refusal: Option.none(),
          rule: "responses-invalid",
          sequenceIndex: Option.some(left.sequenceIndex),
        }),
      );
    }

    yield* attempt;

    return moved;
  });

/**
 * Carry out `next`, `previous` or `go`.
 *
 * The move decides through `moveTarget`. Where it refuses `next` from a linear, individual item
 * with no processed attempt (`unsubmitted`), the item is submitted with the request's responses
 * first and the move is made again from there. Where it refuses `next` from the last item of a
 * linear, individual part (`end-of-part`), the part ends instead, as its last item's `next` does.
 * Any other refusal is the intent's. In a linear, simultaneous part, a `next` the move takes is
 * refused when `score` would refuse the responses of the item it leaves (`responses-invalid`).
 *
 * @param advancing What the call works with.
 * @param session The session.
 * @param step The move, and the responses posted with it.
 * @returns The session after the move, or the part's end; an {@link AdvanceFailure}.
 */
const moved = (
  advancing: Advancing,
  session: TestSession,
  step: MoveStep,
): Result.Result<TestSession, AdvanceFailure> =>
  Result.orElse(
    Result.flatMap(
      move(advancing.test, advancing.items, session, step, advancing.now),
      (after): Result.Result<TestSession, AdvanceFailure> =>
        step.intent.kind === "next" && advancing.linearSimultaneous
          ? leftScoreable(advancing, session, after, step.intent)
          : Result.succeed(after),
    ),
    (failure): Result.Result<TestSession, AdvanceFailure> => {
      if (failure._tag !== "MoveRefused") {
        return Result.fail(failure);
      }

      const { rule } = failure;
      if (rule === "unsubmitted") {
        return Result.flatMap(submitted(advancing, session, step), (after) =>
          moved(advancing, after, { intent: step.intent }),
        );
      }

      if (rule === "end-of-part" && advancing.linearIndividual) {
        return asIntent(
          step.intent,
          endPart(advancing.test, advancing.items, session, step, { now: advancing.now }),
        );
      }

      return Result.fail(refusedMove(step.intent, failure, rule));
    },
  );

/**
 * Carry out what one request asks of a test session: move, submit the current item or part, or end
 * the current part, after saving the responses it posts on the current item.
 *
 * Each intent goes to the transition that owns it, which saves the step first. In a linear part
 * with individual submission, `next` from an item with no processed attempt submits it first and
 * then moves, and `next` on the part's last item ends the part; `end-part` is not offered there
 * and is refused (`linear-jump`). In a linear part with simultaneous submission, `next` is refused
 * (`responses-invalid`) when `score` would refuse the responses of the item it leaves, which the
 * candidate cannot return to before `submit-part` processes it. A refused intent returns no
 * session, so nothing it carried is saved. `allowedIntents` lists exactly the intents this accepts
 * now, given responses that pass the item's `allow-skipping`, `validate-responses` and `score`'s
 * own checks.
 *
 * @example
 *   advance(test, items, session, { intent: { kind: "next" }, responses }, configuration, {
 *     now: new Date(),
 *   });
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param step The intent, and the responses posted with it.
 * @param configuration The host's configuration, whose locale a submission's messages take.
 * @param context The transition.
 * @param context.now When it happens.
 * @returns The session after the intent; {@link IntentRefused} when the test's rules forbid it now;
 *   another {@link AdvanceFailure} when `score` refuses the responses or the host's arguments do
 *   not fit.
 */
export const advance = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  step: Step,
  configuration: Configuration,
  context: { readonly now: Date },
): Result.Result<TestSession, AdvanceFailure> => {
  if (session.status === "closed") {
    return Result.fail(closedRefusal(step.intent));
  }

  return Result.flatMap(
    current(test, session, configuration),
    (shown): Result.Result<TestSession, AdvanceFailure> => {
      const { intent } = step;
      if (shown.kind === "summary") {
        return Result.fail(closedRefusal(intent));
      }

      const advancing: Advancing = {
        configuration,
        items,
        linearIndividual: shown.navigation === "linear" && shown.submission === "individual",
        linearSimultaneous: shown.navigation === "linear" && shown.submission === "simultaneous",
        now: context.now,
        test,
      };
      switch (intent.kind) {
        case "go":
        case "next":
        case "previous": {
          return moved(advancing, session, { ...step, intent });
        }
        case "submit-item": {
          return submitted(advancing, session, step);
        }
        case "submit-part": {
          return asIntent(intent, submitPart(test, items, session, step, context));
        }
        case "end-part": {
          return advancing.linearIndividual
            ? Result.fail(
                new IntentRefused({
                  intent,
                  messages: [],
                  refusal: Option.none(),
                  rule: "linear-jump",
                  sequenceIndex: Option.some(shown.sequenceIndex),
                }),
              )
            : asIntent(intent, endPart(test, items, session, step, context));
        }
        default: {
          return intent satisfies never;
        }
      }
    },
  );
};
