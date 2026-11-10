/**
 * Leaving a scope or a place before its time: {@link expireScope} carries out a test-feature
 * module's `expire` verdict (`GateVerdict` in `#plate/test-features/contract.ts`), which `advance`
 * takes in place of the intent it answered; {@link exitScope} carries out an `exit` verdict, which
 * leaves the scope as an expiry does and nothing else; and {@link skipPlace} passes over a place a
 * module's `enter` skipped (`EnterVerdict`). The module names the scope; this module knows how the
 * session leaves each kind, over the submission and part-ending internals of
 * `#plate/session/submit.ts`, so a module never reads the session's structure. `qti-time-limits`
 * (issue m3f-01b) is the first module to answer `expire`, implementing reading D19 of
 * `docs/spec-readings.md`; `qti-pre-condition` (issue m5-05) is the first to answer `exit` and to
 * skip a place.
 *
 * This is a boundary module, not a browser module: it processes attempts through `processed`,
 * which calls `score`, and `score` reads and writes the stored record through its Schema codec.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import { refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { Test, TestPart } from "#plate/model/test.ts";
import { UnknownItemRef } from "#plate/session/control.ts";
import type { Intent, SessionItem, TestSession } from "#plate/session/session.ts";
import {
  ItemNotInSession,
  partHoldingScope,
  present,
  recordStep,
  valuesOf,
} from "#plate/session/start.ts";
import { deliveredItem, outcomesProcessed, partEnded, processed } from "#plate/session/submit.ts";
import type { PartEndFailure, SubmissionFailure } from "#plate/session/submit.ts";
import type { TimedScope } from "#plate/test-features/contract.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The failure of {@link expireScope} and {@link exitScope} for a scope the test does not hold: an
 * item ref, section or part of another identifier than any of the test's, or `test` under another
 * identifier than the test's own. A test-feature module names only scopes of the test it gates, so
 * this is a module defect, returned so the host can report it.
 */
export class UnknownTimedScope extends Data.TaggedError("UnknownTimedScope")<{
  readonly scope: TimedScope;
  readonly test: string;
}> {
  /**
   * The scope named, the test that lacks it, and what to do.
   */
  override get message(): string {
    return `A test feature left the ${this.scope.kind} ${JSON.stringify(this.scope.identifier)}, which the test ${JSON.stringify(this.test)} does not hold, so the expiry or the exit cannot be carried out and the session is unchanged. A module names only scopes of the test it gates; report it with the test as a renderer defect.`;
  }
}

/**
 * Why {@link expireScope} may fail: the scope is not the test's ({@link UnknownTimedScope}), or an
 * attempt it processes, the outcome run that follows, or the part's end fails as a submission's
 * does. No rule refuses an expiry: `SubmissionRefused` is in the type only through the part's end,
 * which never fails with it, and `score`'s `ResponsesRefused`, for saved responses that break a
 * limit the item sets whatever the configuration, passes through as `submitItem` passes it.
 */
export type ExpiryFailure = SubmissionFailure | UnknownTimedScope;

/**
 * Tell whether a scope has already expired in a session: the same kind and identifier is among
 * its `expired`. A scope expires once, so `advance` lets an `expire` naming such a scope through to
 * the intent's own rules.
 *
 * @param session The session.
 * @param scope The scope.
 * @returns Whether the session records the scope as expired.
 */
export const alreadyExpired = (session: TestSession, scope: TimedScope): boolean =>
  session.expired.some(
    (expired) => expired.kind === scope.kind && expired.identifier === scope.identifier,
  );

/**
 * How the session leaves a scope once its items are locked: `close` the test, `end-part` the part
 * that holds the scope, `move-on` to the first item after the scope in its part, or `stay` where it
 * is.
 */
type Leaving = "close" | "end-part" | "move-on" | "stay";

/**
 * What one expiry works with, derived from the test, the session and the scope once.
 */
interface Expiring {
  /**
   * How the session leaves the scope.
   */
  readonly leaving: Leaving;
  /**
   * The identifiers of the item refs the scope holds: the one ref, the section's or the part's
   * refs, or every ref of the test.
   */
  readonly members: ReadonlySet<string>;
  /**
   * The part that holds the scope, with its index among the test's parts; none for the test.
   */
  readonly part: Option.Option<{ readonly index: number; readonly part: TestPart }>;
  /**
   * Whether the expiry processes the scope's presented items. An item ref's or a section's expiry
   * in a simultaneous part processes none, since `submit-part` processes each item of the part
   * once; every other expiry processes them.
   */
  readonly processes: boolean;
}

/**
 * Say how the session leaves an item ref's or a section's scope: an item ref's expiry moves on in a
 * linear part, as `next` does there, and stays in a nonlinear one; a section's moves on when the
 * current item is in the section, and stays when it is not.
 *
 * @param session The session, its step saved.
 * @param scope The scope.
 * @param part The part that holds it.
 * @param members The scope's refs.
 * @returns `move-on` or `stay`.
 */
const leavingOf = (
  session: TestSession,
  scope: TimedScope,
  part: TestPart,
  members: ReadonlySet<string>,
): Leaving => {
  const shown = session.items[session.position];
  if (shown === undefined || !members.has(shown.ref)) {
    return "stay";
  }

  return scope.kind === "section" || part.navigation === "linear" ? "move-on" : "stay";
};

/**
 * Derive what an expiry works with from the test, the session and the scope.
 *
 * @param test The test.
 * @param session The session, its step saved.
 * @param scope The scope.
 * @returns What the expiry works with, or {@link UnknownTimedScope} when the test does not hold the
 *   scope.
 */
const expiringOf = (
  test: Test,
  session: TestSession,
  scope: TimedScope,
): Result.Result<Expiring, UnknownTimedScope> => {
  if (scope.kind === "test") {
    return scope.identifier === test.identifier
      ? Result.succeed({
          leaving: "close",
          members: new Set(test.parts.flatMap((part) => refIdentifiersIn(part.children))),
          part: Option.none(),
          processes: true,
        })
      : Result.fail(new UnknownTimedScope({ scope, test: test.identifier }));
  }

  return Result.fromOption(
    Option.map(partHoldingScope(test, scope), ({ index, members, part }) => ({
      leaving: scope.kind === "part" ? "end-part" : leavingOf(session, scope, part, members),
      members,
      part: Option.some({ index, part }),
      processes: scope.kind === "part" || part.submission === "individual",
    })),
    () => new UnknownTimedScope({ scope, test: test.identifier }),
  );
};

/**
 * List the item refs of the session's ended parts, whose items an expiry never processes: an
 * individual part's end left them as they were, on purpose.
 *
 * @param test The test.
 * @param session The session.
 * @returns The refs' identifiers.
 */
const endedRefs = (test: Test, session: TestSession): ReadonlySet<string> =>
  new Set(
    test.parts.flatMap((part, index) =>
      session.parts[index]?.status === "ended" ? refIdentifiersIn(part.children) : [],
    ),
  );

/**
 * Lock every item of the scope, and process each presented one whose attempt is open or which
 * holds saved responses not yet processed, with the values it holds, when the expiry processes
 * items. An item of an ended part is locked only.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, its step saved.
 * @param expiring What the expiry works with.
 * @param now The time of the transition.
 * @returns The session with its items locked and processed, and the test's outcome processing run
 *   once when any was processed; or the failure of an attempt or of the run.
 */
const itemsExpired = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  expiring: Expiring,
  now: Date,
): Result.Result<TestSession, SubmissionFailure> => {
  const ended = endedRefs(test, session);
  const pending = (item: SessionItem): boolean =>
    expiring.processes &&
    expiring.members.has(item.ref) &&
    item.presented &&
    !ended.has(item.ref) &&
    (item.record.attempt === "none" || Option.isSome(item.saved));

  return Result.flatMap(
    Result.all(
      session.items.map((item): Result.Result<SessionItem, SubmissionFailure> => {
        if (!expiring.members.has(item.ref)) {
          return Result.succeed(item);
        }

        const locked: SessionItem = { ...item, locked: true };

        return pending(item)
          ? Result.flatMap(deliveredItem(items, session, item), (accepted) =>
              processed(accepted, locked, valuesOf(item), session.updated),
            )
          : Result.succeed(locked);
      }),
    ),
    (expired) =>
      session.items.some(pending)
        ? outcomesProcessed(test, items, { ...session, items: expired }, now)
        : Result.succeed({ ...session, items: expired }),
  );
};

/**
 * Move to the first item after the scope in its part and present it, or, when no item of the part
 * follows, end an individual part and stay in a simultaneous one, which only `submit-part` ends.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, its items locked.
 * @param expiring What the expiry works with, its part present.
 * @param index The index of the part that holds the scope.
 * @param part That part.
 * @param now The time of the transition.
 * @returns The session after the move or the part's end, or their failure.
 */
const movedOn = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  expiring: Expiring,
  index: number,
  part: TestPart,
  now: Date,
): Result.Result<TestSession, PartEndFailure> => {
  const last = session.items.findLastIndex((item) => expiring.members.has(item.ref));
  const next = last === -1 ? session.items.length : last + 1;
  const target = session.items[next];
  if (target !== undefined && refIdentifiersIn(part.children).includes(target.ref)) {
    return present(test, items, { ...session, position: next }, target.sequenceIndex, now);
  }

  return part.submission === "individual"
    ? partEnded(test, items, session, index, now)
    : Result.succeed(session);
};

/**
 * Leave the scope as its kind asks: close the test, end the part, move on, or stay.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, its items locked and processed.
 * @param expiring What the expiry works with.
 * @param now The time of the transition.
 * @returns The session after leaving the scope, or the failure of the part's end, the move or the
 *   closing outcome run.
 */
const left = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  expiring: Expiring,
  now: Date,
): Result.Result<TestSession, PartEndFailure> =>
  Option.match(expiring.part, {
    onNone: () =>
      outcomesProcessed(
        test,
        items,
        {
          ...session,
          parts: session.parts.map(({ identifier }) => ({ identifier, status: "ended" as const })),
          status: "closed",
        },
        now,
      ),
    onSome: ({ index, part }) => {
      switch (expiring.leaving) {
        case "end-part": {
          return partEnded(test, items, session, index, now);
        }
        case "move-on": {
          return movedOn(test, items, session, expiring, index, part, now);
        }
        case "close":
        case "stay": {
          return Result.succeed(session);
        }
        default: {
          return expiring.leaving satisfies never;
        }
      }
    },
  });

/**
 * Carry out the expiry of a timed scope, in place of the intent a test-feature module answered
 * with it. `advance` calls this once per scope: it checks {@link alreadyExpired} first.
 *
 * The step is saved without its responses: the time the current item was shown is added to its
 * duration and `now` becomes its datestamp and the session's `updated`, through `recordStep`, and
 * the item keeps the responses it held. Every item of the scope is then locked. When the expiry
 * processes items, each presented item of the scope whose attempt is open, or which holds saved
 * responses not yet processed, is processed once with the values it holds, as a submission
 * processes it, and the test's outcome processing then runs once; an item never presented, and an
 * item of an ended part, is locked without an attempt. An item ref's or a section's expiry in a
 * simultaneous part processes nothing, since `submit-part` processes each item of the part once,
 * and that submission still processes the locked items. The scope is then left: an item ref's
 * expiry moves on in a linear part, as `next` does there, and stays in a nonlinear one; a section's
 * moves to the first item after the section when the current item is in it, else stays; moving on
 * from the last item of an individual part ends the part, and of a simultaneous part stays; a
 * part's expiry ends the part, so the next part that holds an item becomes current or the test
 * closes; the test's ends every part and closes the test, running its outcome processing once more.
 * Last, the scope is appended to the session's `expired`.
 *
 * @example
 *   expireScope(test, items, session, { kind: "submit-item" }, { identifier: "S1", kind: "section" }, new Date());
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session.
 * @param intent The intent the expiry answers, which is not carried out.
 * @param scope The scope whose time has run out.
 * @param now The time of the transition.
 * @returns The session after the expiry, or an {@link ExpiryFailure}.
 */
export const expireScope = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  intent: Intent,
  scope: TimedScope,
  now: Date,
): Result.Result<TestSession, ExpiryFailure> =>
  Result.gen(function* expireOne() {
    const saved = yield* recordStep(session, { intent }, now);
    const expiring = yield* expiringOf(test.test, saved, scope);
    const locked = yield* itemsExpired(test.test, items, saved, expiring, now);
    const after = yield* left(test.test, items, locked, expiring, now);

    return { ...after, expired: [...after.expired, scope] };
  });

/**
 * Why {@link exitScope} may fail: the scope is not the test's ({@link UnknownTimedScope}), or the
 * part's end, the move or the closing outcome run fails as a part's end does.
 */
export type ExitFailure = PartEndFailure | UnknownTimedScope;

/**
 * Carry out the exit from a scope a test-feature module answered with, leaving the scope as its
 * expiry leaves it ({@link expireScope}) and nothing else: no step is saved here, no item is
 * processed or locked, every item keeps what it holds, and `expired` is not written. The caller
 * has saved the step or carried the submission out; `advance` calls this for an `exit`
 * `GateVerdict` and for an `exit` `EnterVerdict`, and then enters the place landed on.
 *
 * The scope is left as its kind asks: an item ref's exit moves on in a linear part and stays in a
 * nonlinear one; a section's moves to the first item after the section when the current item is
 * in it, else stays; moving on from the last item of an individual part ends the part, and of a
 * simultaneous part stays; a part's exit ends the part, so the next part that holds an item
 * becomes current or the test closes; the test's ends every part and closes the test, running its
 * outcome processing once. A part already ended is left as it is: the exit changes nothing.
 *
 * @example
 *   exitScope(test, items, session, { identifier: "S1", kind: "section" }, new Date());
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session, its step saved.
 * @param scope The scope the session leaves.
 * @param now The time of the transition.
 * @returns The session after the exit, or an {@link ExitFailure}.
 */
export const exitScope = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  scope: TimedScope,
  now: Date,
): Result.Result<TestSession, ExitFailure> =>
  Result.flatMap(expiringOf(test.test, session, scope), (expiring) =>
    Option.exists(expiring.part, ({ index }) => session.parts[index]?.status === "ended")
      ? Result.succeed(session)
      : left(test.test, items, session, expiring, now),
  );

/**
 * Process every presented item of a simultaneous part once, with the values it holds, and run the
 * test's outcome processing once, as `submit-part` does before the part ends; an item never
 * presented is left as it is.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session.
 * @param refs The identifiers of the part's item refs.
 * @param now The time of the transition.
 * @returns The session with the part's attempts processed, or the failure of an attempt or of the
 *   run.
 */
const partProcessed = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  refs: ReadonlySet<string>,
  now: Date,
): Result.Result<TestSession, SubmissionFailure> =>
  Result.flatMap(
    Result.all(
      session.items.map((item): Result.Result<SessionItem, SubmissionFailure> =>
        refs.has(item.ref) && item.presented
          ? Result.flatMap(deliveredItem(items, session, item), (accepted) =>
              processed(accepted, item, valuesOf(item), session.updated),
            )
          : Result.succeed(item),
      ),
    ),
    (after) => outcomesProcessed(test, items, { ...session, items: after }, now),
  );

/**
 * Why {@link skipPlace} may fail: the session's position is past its items
 * ({@link ItemNotInSession}), the test holds no item ref the current item names
 * ({@link UnknownItemRef}), or an attempt a simultaneous part's end processes, the outcome run that
 * follows, or the part's end fails as a submission's does.
 */
export type SkipFailure = ItemNotInSession | SubmissionFailure | UnknownItemRef;

/**
 * Pass over the place at the session's position, which a test-feature module's `enter` skipped and
 * which is not presented: move to the next item of its part and present it; where none follows,
 * end the part. An individual part ends as `end-part` ends it, its items left as they are. A
 * simultaneous part ends as `submit-part` ends it: each presented item of the part is processed
 * once with the values it holds, the test's outcome processing runs once, and the part ends; the
 * skipped item, never presented, closes as it is. `advance` calls this for a `skip` `EnterVerdict`
 * and then enters the place landed on.
 *
 * @example
 *   skipPlace(test, items, session, new Date());
 *
 * @param test The test the session was started from.
 * @param items The test's items, keyed by item ref identifier, as `startTest` took them.
 * @param session The session, positioned on the skipped place, its item not presented.
 * @param now The time of the transition.
 * @returns The session on the next place or after the part's end, or a {@link SkipFailure}.
 */
export const skipPlace = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  now: Date,
): Result.Result<TestSession, SkipFailure> =>
  Result.gen(function* skipOne() {
    const skipped = yield* Result.fromOption(
      Option.fromUndefinedOr(session.items[session.position]),
      () =>
        new ItemNotInSession({ count: session.items.length, sequenceIndex: session.position + 1 }),
    );
    const { index, part } = yield* Result.fromOption(
      partHoldingScope(test.test, { identifier: skipped.ref, kind: "item-ref" }),
      () => new UnknownItemRef({ ref: skipped.ref, test: test.test.identifier }),
    );
    const refs = new Set(refIdentifiersIn(part.children));
    const following = Option.fromUndefinedOr(
      session.items.find((item, at) => at > session.position && refs.has(item.ref)),
    );
    if (Option.isSome(following)) {
      const position = session.items.indexOf(following.value);

      return yield* present(
        test.test,
        items,
        { ...session, position },
        following.value.sequenceIndex,
        now,
      );
    }

    const processedPart =
      part.submission === "simultaneous"
        ? yield* partProcessed(test.test, items, session, refs, now)
        : session;

    return yield* partEnded(test.test, items, processedPart, index, now);
  });
