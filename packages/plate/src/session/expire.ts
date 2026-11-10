/**
 * The scope of a timed expiry or an exit: what a test-feature module's `expire` or `exit` verdict
 * (`GateVerdict` in `#plate/test-features/contract.ts`, and an `exit` `EnterVerdict`) names, read
 * against the test and the session. The module names the scope; {@link expiringOf} derives which
 * item refs it holds, which part holds it, whether its expiry processes items and how the session
 * leaves it, so a module never reads the session's structure. `advance`
 * (`#plate/session/advance.ts`) carries the expiry and the exit out from that. `qti-time-limits`
 * (issue m3f-01b) is the first module to answer `expire`, implementing reading D19 of
 * `docs/spec-readings.md`; `qti-pre-condition` (issue m5-05) is the first to answer `exit`.
 *
 * This is a browser module: it reads the test and the session and touches no codec, so the
 * expiry's processing, which calls `score`, stays in `advance`.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import { refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { Test, TestPart } from "#plate/model/test.ts";
import type { TestSession } from "#plate/session/session.ts";
import { partHoldingScope } from "#plate/session/start.ts";
import type { TimedScope } from "#plate/test-features/contract.ts";

/**
 * The failure of {@link expiringOf}, which the expiry and the exit derive their scope through, for
 * a scope the test does not hold: an item ref, section or part of another identifier than any of
 * the test's, or `test` under another identifier than the test's own. A test-feature module names
 * only scopes of the test it gates, so this is a module defect, returned so the host can report
 * it.
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
export interface Expiring {
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
export const expiringOf = (
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
