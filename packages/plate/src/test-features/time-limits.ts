/**
 * Time Limits (T-2, S-2, T-6, I-16), a stub module: the test model dispatches each
 * `qti-time-limits` to its `parse`, which records the mark `qti-time-limits`, and its hooks have no
 * effect, so a timed test runs untimed, as it did. Issue m3f-01 fills the module: `gate` ends the
 * time allowed and holds a candidate to `min-time`, {@link timeStateOf} reads the time in force
 * into the navigation, and {@link timePart} renders the test chrome's `time` part from it. Issue
 * m4-03 then extends the state by the candidate's additional testing time.
 *
 * This is a browser module, reached from the session and the emitter: it value-imports from
 * `effect` only `Option`.
 *
 * @module
 */
import { Option } from "effect";
import type { Attributes, Node } from "#plate/emit/node.ts";
import type { Locale } from "#plate/messages.ts";
import type { Test } from "#plate/model/test.ts";
import type { TestSession } from "#plate/session/session.ts";
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * The time in force on a test session, as the navigation carries it (`NavigationState.time`) and
 * the `time` part and a host's timer read it. Absent from the navigation until issue m3f-01 reads
 * the test's time limits. Seconds throughout, as `qti-time-limits` writes them.
 */
export interface TimeState {
  /**
   * Whether a response past `max-time` is still accepted, `allow-late-submission` of the tightest
   * limit in force.
   */
  readonly allowLateSubmission: boolean;
  /**
   * The seconds the candidate must still spend before `min-time` lets them move on; none when no
   * `min-time` holds them.
   */
  readonly minTimeLeft: Option.Option<number>;
  /**
   * The seconds left on the tightest `max-time` in force, zero once it has run out; none when no
   * `max-time` is in force.
   */
  readonly timeLeft: Option.Option<number>;
}

/**
 * What the `time` part renders: its attributes beside its marker, and its children.
 */
export interface TimePart {
  readonly children: readonly Node[];
  readonly props: Attributes;
}

/**
 * The Time Limits module, a stub until issue m3f-01 lands it.
 */
export const timeLimitsModule: TestFeatureModule<"qti-time-limits", never> = stub({
  element: "qti-time-limits",
  feature: ["T-2", "S-2", "T-6", "I-16"],
  issue: "m3f-01",
  key: "qti-time-limits",
  namespace: qtiNamespace,
});

/**
 * Read the time in force on a session, for `navigationState`: none until issue m3f-01 reads the
 * test's time limits, so the navigation carries no `time`.
 *
 * @param _test The test.
 * @param _session The session.
 * @returns None.
 */
export const timeStateOf = (_test: Test, _session: TestSession): Option.Option<TimeState> =>
  Option.none();

/**
 * Tell whether the navigation Root holds the `time` part when the author names no order: only
 * while a time is in force, which the stub never reports, so the default order is what it was.
 *
 * @param state The navigation's time.
 * @returns Whether the Root holds the part by default.
 */
export const placesTime = (state: { readonly time?: TimeState }): boolean =>
  state.time !== undefined;

/**
 * Give what the `time` part renders: a `timer` region that is hidden while no time is in force,
 * and holds nothing until issue m3f-01 writes the time left into it.
 *
 * @param time The time in force, if any.
 * @param _locale The locale the part's words are written in.
 * @returns The part's attributes and children.
 */
export const timePart = (time: TimeState | undefined, _locale: Locale): TimePart => ({
  children: [],
  props: time === undefined ? { hidden: true, role: "timer" } : { role: "timer" },
});
