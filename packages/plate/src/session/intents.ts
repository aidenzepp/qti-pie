/**
 * The intents a test session takes now: {@link allowedIntents} lists exactly what `advance` of
 * `#plate/session/advance.ts` accepts, so a host offers those and a navigation part takes its
 * disabled state from them.
 *
 * The list is read from the test and the session alone: the moves through `moveTarget`, the
 * decision `move` itself makes, and the submissions from the current item's view, whose part modes
 * and closed state are what the submissions check. So the two agree without this module calling a
 * submission. It is pure and keeps nothing between calls. This is a browser module: it imports
 * neither `advance.ts` nor `submit.ts`, which reach `score`, and value-imports from `effect` only
 * `Result`.
 *
 * @module
 */
import { Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { UnknownItemRef } from "#plate/session/control.ts";
import { moveTarget } from "#plate/session/navigate.ts";
import type { MoveIntent } from "#plate/session/navigate.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import { current } from "#plate/session/start.ts";
import type { ItemNotInSession, ItemView } from "#plate/session/start.ts";
import type { AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The configuration {@link allowedIntents} reads the current item's view through.
 *
 * `itemConfiguration` writes every session-control field over the configuration it is given, so
 * the view's part modes and closed state depend on the test and the session alone, and none of
 * these values reaches the list.
 */
const readingBase: Configuration = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  maxAttempts: 1,
  showFeedback: false,
  showSolution: false,
  validateResponses: false,
};

/**
 * Say whether `advance` takes a move from where a session stands.
 *
 * A move `moveTarget` gives a target for is taken. In a linear, individual part two refusals of
 * `next` are taken too: `unsubmitted`, since `advance` submits the item first, and `end-of-part`,
 * since `next` on the part's last item ends the part.
 *
 * @param test The test.
 * @param session The session, open.
 * @param view The current item's view.
 * @param intent The move.
 * @returns Whether the move is taken; the failure of `moveTarget` when the session does not fit
 *   the test.
 */
const takesMove = (
  test: AcceptedTest,
  session: TestSession,
  view: ItemView,
  intent: MoveIntent,
): Result.Result<boolean, ItemNotInSession | UnknownItemRef> =>
  Result.orElse(
    Result.map(moveTarget(test, session, intent), () => true),
    (failure): Result.Result<boolean, ItemNotInSession | UnknownItemRef> =>
      failure._tag === "MoveRefused"
        ? Result.succeed(
            view.navigation === "linear" &&
              view.submission === "individual" &&
              (failure.rule === "unsubmitted" || failure.rule === "end-of-part"),
          )
        : Result.fail(failure),
  );

/**
 * List the intents a test session takes now: exactly those `advance` accepts, given responses that
 * pass the current item's `allow-skipping`, `validate-responses` and `score`'s own checks, which
 * depend on what a request posts. So in a linear, simultaneous part `next` is listed whatever the
 * item holds, and `advance` refuses it (`responses-invalid`) when `score` would refuse the
 * responses the item is left with, since the candidate cannot return to it.
 *
 * In order: `next`, `previous`, `go` to each sequence index it reaches, ascending, then
 * `submit-item`, `submit-part` and `end-part`. `go` to the current item is among them in every mode
 * while the test is open: it saves and stays. `submit-item` is listed in an individual part while
 * the item is open, `submit-part` in a simultaneous part, and `end-part` in a nonlinear, individual
 * part. A closed test takes none.
 *
 * @example
 *   allowedIntents(test, session);
 *   // Result.succeed([{ kind: "next" }, { kind: "go", sequenceIndex: 1 }, { kind: "submit-item" }])
 *   // at the start of a linear, individual part
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @returns The intents; {@link ItemNotInSession} for an open session whose position is past its
 *   items; {@link UnknownItemRef} when the test holds no item ref an item names, as when the
 *   session belongs to another test.
 */
export const allowedIntents = (
  test: AcceptedTest,
  session: TestSession,
): Result.Result<readonly Intent[], ItemNotInSession | UnknownItemRef> =>
  Result.flatMap(current(test, session, readingBase), (shown) => {
    if (shown.kind === "summary") {
      return Result.succeed([]);
    }

    const moves: readonly MoveIntent[] = [
      { kind: "next" },
      { kind: "previous" },
      ...session.items.map((item): MoveIntent => ({
        kind: "go",
        sequenceIndex: item.sequenceIndex,
      })),
    ];
    const submissions: readonly Intent[] = [
      ...(shown.submission === "individual" && !shown.disabled
        ? [{ kind: "submit-item" } as const]
        : []),
      ...(shown.submission === "simultaneous" ? [{ kind: "submit-part" } as const] : []),
      ...(shown.submission === "individual" && shown.navigation === "nonlinear"
        ? [{ kind: "end-part" } as const]
        : []),
    ];

    return Result.map(
      Result.all(
        moves.map((intent) =>
          Result.map(takesMove(test, session, shown, intent), (taken) => (taken ? [intent] : [])),
        ),
      ),
      (taken): readonly Intent[] => [...taken.flat(), ...submissions],
    );
  });
