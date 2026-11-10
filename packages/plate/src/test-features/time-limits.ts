/**
 * Time Limits (T-2, S-2, T-6, I-16), issue m3f-01: the test model reads each `qti-time-limits` of
 * the test, a test part, a section or an item ref into a {@link TimeLimitsNode}; `gate` holds a
 * candidate to `min-time`; {@link timeStateOf} reads the time in force into the navigation; and
 * {@link timePart} renders the test chrome's `time` part from it.
 *
 * The time a scope has used is read from the session: the test's from `started`, an item ref's
 * from its session item's `duration`, a section's or a part's from the durations of the session
 * items whose refs lie in it, the current item gaining the seconds since `updated`. A `min-time`
 * holds a candidate in a scope until that time reaches it, an item ref's and a section's only in a
 * linear part, as QTI's information model gives them; once any `max-time` in force has run out no
 * `min-time` holds (the reading "where both cannot hold, `max-time` wins"). `allow-late-submission`
 * true takes a submission past `max-time`, which stays detectable through the item's `duration`
 * and the navigation's `time`. At `max-time` with `allow-late-submission` false the `time` part
 * announces the expiry and nothing more: the gate's contract can only refuse an intent or redirect
 * a move, so it can neither lock input nor submit at expiry.
 *
 * Two hooks wait for the issues after it, each with no effect until its issue fills it: issue m4-03
 * extends every `max-time` by the candidate's additional testing time ({@link extendedMaxTime}),
 * and issue m4-08 pauses and resumes the clock for a break ({@link pauseTime}, {@link resumeTime}).
 *
 * This is a browser module, reached from the session and the emitter: it value-imports from
 * `effect` only `Option` and `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import type { Locale } from "#plate/messages.ts";
import { refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { ItemRef, Section, SectionChild, Test, TestPart } from "#plate/model/test.ts";
import { elapsedSeconds } from "#plate/session/elapsed.ts";
import type { SessionItem, TestSession } from "#plate/session/session.ts";
import type { AdditionalTestingTime } from "#plate/supports.ts";
import type { GateContext, GateVerdict, TestFeatureModule } from "#plate/test-features/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";

/**
 * A `qti-time-limits` as the test model holds it (T-2, S-2, T-6, I-16; issue m3f-01): its element
 * path, which names the element it sits on (its scope) once its own last step is dropped, and its
 * three attributes, seconds for the two times.
 */
export interface TimeLimitsNode {
  /**
   * `allow-late-submission`, false when the element does not write it.
   */
  readonly allowLateSubmission: boolean;
  readonly maxTime: Option.Option<number>;
  readonly minTime: Option.Option<number>;
  readonly path: string;
}

/**
 * The time in force on a test session (T-2, S-2, T-6, I-16; issue m3f-01), as the navigation
 * carries it (`NavigationState.time`) and the `time` part and a host's timer read it: present while
 * a scope in force at the current item writes a time limit. Seconds throughout, as
 * `qti-time-limits` writes them.
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
 * What the `time` part renders (T-2, S-2, T-6, I-16; issue m3f-01): its attributes beside its
 * marker, and its children.
 */
export interface TimePart {
  readonly children: readonly Node[];
  readonly props: Attributes;
}

/**
 * One element a `qti-time-limits` may sit on, in force at the current item: what it is, its
 * identifier, the item refs it holds, the seconds it has used at the time asked, and its limits,
 * none when it writes none.
 */
interface Scope {
  readonly identifier: string;
  readonly kind: "item-ref" | "part" | "section" | "test";
  readonly limits: Option.Option<TimeLimitsNode>;
  readonly refs: ReadonlySet<string>;
  readonly used: number;
}

/**
 * Where an open session stands, as the time limits read it: the scopes in force at the current
 * item, outermost first (the test, its part, each section that holds the item ref, the item ref),
 * the current part, its session items, and whether a later part holds an item.
 */
interface Standing {
  readonly item: SessionItem;
  readonly laterItems: boolean;
  readonly part: TestPart;
  readonly partItems: readonly SessionItem[];
  readonly scopes: readonly Scope[];
}

/**
 * A section, or an item ref, with the element path the walk of the test document gives it.
 */
interface Placed<T> {
  readonly node: T;
  readonly path: string;
}

/**
 * Round seconds to a tenth, as a session item's `duration` is truncated to one, so sums and
 * differences of durations compare without floating-point residue.
 *
 * @param seconds The seconds.
 * @returns The seconds to a tenth.
 */
const tenths = (seconds: number): number => Math.round(seconds * 10) / 10;

/**
 * Give the path steps of some sibling elements, by their local names, as the walk of a document
 * writes them: the name, followed by a 1-based `[n]` only when another sibling has the same name.
 *
 * @param names The siblings' local names, in document order.
 * @returns Each sibling's step.
 */
const stepsOf = (names: readonly string[]): readonly string[] => {
  const totals = new Map<string, number>();
  for (const name of names) {
    totals.set(name, (totals.get(name) ?? 0) + 1);
  }
  const seen = new Map<string, number>();

  return names.map((name) => {
    const position = (seen.get(name) ?? 0) + 1;
    seen.set(name, position);

    return (totals.get(name) ?? 0) > 1 ? `${name}[${position}]` : name;
  });
};

/**
 * Give the element's local name of a section child.
 *
 * @param child The child.
 * @returns `qti-assessment-item-ref` or `qti-assessment-section`.
 */
const localNameOf = (child: SectionChild): string =>
  child.kind === "item-ref" ? "qti-assessment-item-ref" : "qti-assessment-section";

/**
 * Find an item ref among some section children, nested sections included, with the sections that
 * hold it, outermost first, each with its path.
 *
 * @param children The children.
 * @param path The path of the element that holds them.
 * @param ref The item ref's identifier.
 * @returns The sections and the item ref, none when the children hold no such item ref.
 */
const placeOf = (
  children: readonly SectionChild[],
  path: string,
  ref: string,
): Option.Option<{
  readonly ref: Placed<ItemRef>;
  readonly sections: readonly Placed<Section>[];
}> => {
  const steps = stepsOf(children.map(localNameOf));
  for (const [index, child] of children.entries()) {
    const childPath = `${path}/${steps[index] ?? localNameOf(child)}`;
    if (child.kind === "item-ref") {
      if (child.identifier === ref) {
        return Option.some({ ref: { node: child, path: childPath }, sections: [] });
      }
    } else {
      const found = placeOf(child.children, childPath, ref);
      if (Option.isSome(found)) {
        return Option.some({
          ref: found.value.ref,
          sections: [{ node: child, path: childPath }, ...found.value.sections],
        });
      }
    }
  }

  return Option.none();
};

/**
 * Give the limits the test holds by the path of the element each sits on.
 *
 * @param test The test.
 * @returns Each `qti-time-limits` by its scope's path.
 */
const limitsByScope = (test: Test): ReadonlyMap<string, TimeLimitsNode> =>
  new Map(
    (test.features?.["qti-time-limits"] ?? []).map((node) => [
      node.path.slice(0, node.path.lastIndexOf("/")),
      node,
    ]),
  );

/**
 * Read where an open session stands at a time: the scopes in force at its current item, each with
 * the seconds it has used then.
 *
 * @param test The test.
 * @param session The session, open.
 * @param at The time asked about.
 * @returns Where it stands; none when the session's position or current item names nothing the
 *   test holds, which the hubs refuse on their own.
 */
const standingOf = (test: Test, session: TestSession, at: Date): Option.Option<Standing> => {
  const item = session.items[session.position];
  if (item === undefined) {
    return Option.none();
  }

  const root = "qti-assessment-test";
  const partSteps = stepsOf(test.parts.map(() => "qti-test-part"));
  const extra = elapsedSeconds(Date.parse(session.updated), at.getTime());
  const limits = limitsByScope(test);
  const usedBy = (refs: ReadonlySet<string>): number =>
    tenths(
      session.items
        .filter((each) => refs.has(each.ref))
        .reduce((sum, each) => sum + each.duration + (each === item ? extra : 0), 0),
    );

  for (const [partIndex, part] of test.parts.entries()) {
    const partPath = `${root}/${partSteps[partIndex] ?? "qti-test-part"}`;
    const found = placeOf(part.children, partPath, item.ref);
    if (Option.isSome(found)) {
      const { ref, sections } = found.value;
      const partRefs = new Set(refIdentifiersIn(part.children));
      const laterRefs = new Set(
        test.parts.slice(partIndex + 1).flatMap((later) => refIdentifiersIn(later.children)),
      );
      const scopes: readonly Scope[] = [
        {
          identifier: test.identifier,
          kind: "test",
          limits: Option.fromUndefinedOr(limits.get(root)),
          refs: new Set(test.parts.flatMap((each) => refIdentifiersIn(each.children))),
          used: elapsedSeconds(Date.parse(session.started), at.getTime()),
        },
        {
          identifier: part.identifier,
          kind: "part",
          limits: Option.fromUndefinedOr(limits.get(partPath)),
          refs: partRefs,
          used: usedBy(partRefs),
        },
        ...sections.map(({ node, path }): Scope => {
          const refs = new Set(refIdentifiersIn(node.children));

          return {
            identifier: node.identifier,
            kind: "section",
            limits: Option.fromUndefinedOr(limits.get(path)),
            refs,
            used: usedBy(refs),
          };
        }),
        {
          identifier: ref.node.identifier,
          kind: "item-ref",
          limits: Option.fromUndefinedOr(limits.get(ref.path)),
          refs: new Set([ref.node.identifier]),
          used: tenths(item.duration + extra),
        },
      ];

      return Option.some({
        item,
        laterItems: session.items.some((each) => laterRefs.has(each.ref)),
        part,
        partItems: session.items.filter((each) => partRefs.has(each.ref)),
        scopes,
      });
    }
  }

  return Option.none();
};

/**
 * Give the seconds left on a scope's `max-time`, zero once it has run out; none when it writes no
 * `max-time`.
 *
 * @param scope The scope.
 * @returns The seconds left.
 */
const maxTimeLeft = (scope: Scope): Option.Option<number> =>
  scope.limits.pipe(
    Option.flatMap((limits) => limits.maxTime),
    Option.map((maxTime) => Math.max(0, tenths(maxTime - scope.used))),
  );

/**
 * Give the seconds a scope's `min-time` still holds the candidate, none when it writes none or its
 * time has been reached. Whether it applies in the current part is the caller's.
 *
 * @param scope The scope.
 * @returns The seconds left, above 0.
 */
const minTimeLeftOf = (scope: Scope): Option.Option<number> =>
  scope.limits.pipe(
    Option.flatMap((limits) => limits.minTime),
    Option.map((minTime) => tenths(minTime - scope.used)),
    Option.filter((left) => left > 0),
  );

/**
 * Tell whether any `max-time` in force has run out, so that no `min-time` holds the candidate.
 *
 * @param scopes The scopes in force.
 * @returns Whether one has.
 */
const expired = (scopes: readonly Scope[]): boolean =>
  scopes.some((scope) => Option.exists(maxTimeLeft(scope), (left) => left === 0));

/**
 * Tell whether a scope's `min-time` applies in a part: an item ref's and a section's only in a
 * linear part, a part's and the test's always.
 *
 * @param scope The scope.
 * @param part The current part.
 * @returns Whether it applies.
 */
const minTimeApplies = (scope: Scope, part: TestPart): boolean =>
  scope.kind === "part" || scope.kind === "test" || part.navigation === "linear";

/**
 * The words naming each kind of scope in a refusal's detail.
 */
const scopeNames: Readonly<Record<Scope["kind"], string>> = {
  "item-ref": "item ref",
  part: "test part",
  section: "section",
  test: "test",
};

/**
 * Give the refusal of an intent a scope's `min-time` holds back.
 *
 * @param scope The scope.
 * @param left The seconds its `min-time` still holds.
 * @returns The verdict, under the rule `min-time`.
 */
const heldBy = (scope: Scope, left: number): GateVerdict => {
  const minTime = scope.limits.pipe(
    Option.flatMap((limits) => limits.minTime),
    Option.getOrElse(() => left),
  );

  return {
    detail: `the ${scopeNames[scope.kind]} ${JSON.stringify(scope.identifier)} has a min-time of ${minTime} seconds and ${left} seconds of it remain, so the candidate cannot leave it yet. Nothing the request carried is saved; offer the intent again once ${left} seconds have passed.`,
    kind: "refuse",
    rule: "min-time",
  };
};

/**
 * Give the scopes whose `min-time` an intent is held to, innermost first: in a linear part, the
 * item ref's for `next` and `submit-item`, and each section's that `next` leaves; the part's, and
 * the test's when no later part holds an item, for `end-part`, `submit-part` and `next` on the last
 * item of a linear part. An intent the part's modes refuse on their own is held to none, so their
 * rule stands: `submit-item` and `end-part` outside an individual part, `end-part` in a linear
 * one, `submit-part` in an individual one, and `next` on a part's last item unless the part is
 * linear and individual, where it ends the part.
 *
 * @param standing Where the session stands.
 * @param kind The intent's kind.
 * @returns The scopes, innermost first.
 */
const heldScopes = (standing: Standing, kind: GateContext["intent"]["kind"]): readonly Scope[] => {
  const { item, laterItems, part, partItems, scopes } = standing;
  const linear = part.navigation === "linear";
  const individual = part.submission === "individual";
  const offset = partItems.indexOf(item);
  const following = Option.fromUndefinedOr(partItems[offset + 1]);
  const last = Option.isNone(following);
  const ending =
    (kind === "end-part" && !linear && individual) ||
    (kind === "submit-part" && !individual) ||
    (kind === "next" && linear && individual && last);
  const inner = scopes.toReversed();

  return [
    ...inner.filter(
      (scope) =>
        linear &&
        scope.kind === "item-ref" &&
        ((kind === "next" && (!last || individual)) || (kind === "submit-item" && individual)),
    ),
    ...inner.filter(
      (scope) =>
        linear &&
        scope.kind === "section" &&
        kind === "next" &&
        (last ? individual : Option.exists(following, (next) => !scope.refs.has(next.ref))),
    ),
    ...inner.filter(
      (scope) => ending && (scope.kind === "part" || (scope.kind === "test" && !laterItems)),
    ),
  ];
};

/**
 * The intents a `min-time` can hold back: the gate lets `go` and `previous` through without
 * reading the session, so a read of every `go` target, as `allowedIntents` makes, costs nothing.
 */
const heldKinds: ReadonlySet<GateContext["intent"]["kind"]> = new Set([
  "end-part",
  "next",
  "submit-item",
  "submit-part",
]);

/**
 * Tell whether a test writes any `qti-time-limits`, so an untimed test costs the session nothing.
 *
 * @param test The test.
 * @returns Whether it does.
 */
const timed = (test: Test): boolean => (test.features?.["qti-time-limits"]?.length ?? 0) > 0;

/**
 * Give the time asked about: the request's, else the session's last transition, which a read of
 * the moves allowed now (`moveTargets` for `allowedIntents`) and the navigation have no other.
 *
 * @param session The session.
 * @param now The request's time, where the hub has one.
 * @returns The time.
 */
const timeAt = (session: TestSession, now: Option.Option<Date>): Date =>
  Option.getOrElse(now, () => new Date(session.updated));

/**
 * The Time Limits module (T-2, S-2, T-6, I-16), issue m3f-01: its `parse` reads `min-time`,
 * `max-time` and `allow-late-submission` with the element's path, and its `gate` refuses, under
 * the rule `min-time`, the intents that would leave a scope whose `min-time` still holds the
 * candidate while no `max-time` in force has run out. It places nothing and orders nothing.
 */
export const timeLimitsModule: TestFeatureModule<"qti-time-limits", TimeLimitsNode> = {
  deliver: (context) => context.test,
  element: "qti-time-limits",
  feature: ["T-2", "S-2", "T-6", "I-16"],
  gate: ({ intent, now, session, test }) => {
    if (session.status === "closed" || !heldKinds.has(intent.kind) || !timed(test)) {
      return Option.none();
    }

    return Option.flatMap(standingOf(test, session, timeAt(session, now)), (standing) => {
      if (expired(standing.scopes)) {
        return Option.none();
      }

      for (const scope of heldScopes(standing, intent.kind)) {
        const left = minTimeLeftOf(scope);
        if (Option.isSome(left)) {
          return Option.some(heldBy(scope, left.value));
        }
      }

      return Option.none();
    });
  },
  implemented: true,
  issue: "m3f-01",
  key: "qti-time-limits",
  namespace: qtiNamespace,
  parse: (element, { path, readers }) =>
    Result.gen(function* readTimeLimits() {
      const minTime = yield* readers.floatAttribute(element, "min-time");
      const maxTime = yield* readers.floatAttribute(element, "max-time");
      const allowLateSubmission = yield* readers.xsBoolean(element, "allow-late-submission", false);

      return Option.some({ allowLateSubmission, maxTime, minTime, path });
    }),
  sequence: (context) => context.places,
};

/**
 * Read the time in force on a session at its last transition, for `navigationState` (T-2, S-2,
 * T-6, I-16; issue m3f-01): the least time left over the `max-time`s in force at the current item,
 * with the `allow-late-submission` of the scope that gives it (the innermost on a tie), and the
 * longest a `min-time` still holds the candidate, none once any `max-time` in force has run out.
 *
 * @param test The test.
 * @param session The session.
 * @returns The time in force; none for a closed session or when no scope in force at the current
 *   item writes a time limit.
 */
export const timeStateOf = (test: Test, session: TestSession): Option.Option<TimeState> => {
  if (session.status === "closed" || !timed(test)) {
    return Option.none();
  }

  return Option.flatMap(standingOf(test, session, timeAt(session, Option.none())), (standing) => {
    const { part, scopes } = standing;
    if (!scopes.some((scope) => Option.isSome(scope.limits))) {
      return Option.none();
    }

    let tightest: Option.Option<{ readonly left: number; readonly scope: Scope }> = Option.none();
    for (const scope of scopes) {
      const left = maxTimeLeft(scope);
      if (
        Option.isSome(left) &&
        Option.match(tightest, { onNone: () => true, onSome: (held) => left.value <= held.left })
      ) {
        tightest = Option.some({ left: left.value, scope });
      }
    }

    const holding = expired(scopes)
      ? []
      : scopes
          .filter((scope) => minTimeApplies(scope, part))
          .flatMap((scope) => Option.toArray(minTimeLeftOf(scope)));

    return Option.some({
      allowLateSubmission: Option.exists(tightest, ({ scope }) =>
        Option.exists(scope.limits, (limits) => limits.allowLateSubmission),
      ),
      minTimeLeft: holding.length === 0 ? Option.none() : Option.some(Math.max(...holding)),
      timeLeft: tightest.pipe(Option.map(({ left }) => left)),
    });
  });
};

/**
 * Give the seconds a `max-time` (T-2, S-2, T-6, I-16; issue m3f-01) allows a candidate, given the
 * additional testing time they are allowed (A-6, `Supports.additionalTestingTime`): the hook issue
 * m4-03 fills, so that it changes
 * only how the time allowed is computed and no session function's signature. Until then it has no
 * effect: every extension leaves the `max-time` as written. `min-time` never passes through it.
 *
 * @param maxTime The seconds a `max-time` in force writes.
 * @param _extension The candidate's additional testing time; none for a candidate allowed none.
 * @returns The seconds allowed, or none for a limit the extension lifts; until issue m4-03, the
 *   `max-time` unchanged.
 */
export const extendedMaxTime = (
  maxTime: number,
  _extension: Option.Option<AdditionalTestingTime>,
): Option.Option<number> => Option.some(maxTime);

/**
 * Pause the clock of the time limits (T-2, S-2, T-6, I-16; issue m3f-01) at a time, for a
 * candidate's break (A-11): the hook issue m4-08 fills, after which no `max-time` runs until
 * {@link resumeTime} and the session holds the break. Until then it has no effect: the clock runs
 * on, and the session is given back as it was.
 *
 * @param session The session.
 * @param _at When the break starts.
 * @returns The session; until issue m4-08, the same session.
 */
export const pauseTime = (session: TestSession, _at: Date): TestSession => session;

/**
 * Resume the clock of the time limits (T-2, S-2, T-6, I-16; issue m3f-01) at a time, ending the
 * break {@link pauseTime} started: the hook issue m4-08 fills, after which the time on the break is
 * not counted against any `max-time`. Until then it has no effect, and the session is given back as
 * it was.
 *
 * @param session The session.
 * @param _at When the break ends.
 * @returns The session; until issue m4-08, the same session.
 */
export const resumeTime = (session: TestSession, _at: Date): TestSession => session;

/**
 * Tell whether the navigation Root holds the `time` part when the author names no order: only
 * while a time is in force (T-2, S-2, T-6, I-16; issue m3f-01), which {@link timeStateOf} reports.
 *
 * @param state The navigation's time.
 * @returns Whether the Root holds the part by default.
 */
export const placesTime = (state: { readonly time?: TimeState }): boolean =>
  state.time !== undefined;

/**
 * The seconds left at or under which the `time` part's status region warns of the expiry.
 */
const warningSeconds = 60;

/**
 * The words of the `time` part in one locale: the expiry notice, which says whether late answers
 * are still accepted, the time left and how long `min-time` still holds, each around its clock,
 * and the warning a minute or less before expiry.
 */
interface TimeWords {
  readonly expired: (allowLateSubmission: boolean) => string;
  readonly left: (clock: string) => string;
  readonly min: (clock: string) => string;
  readonly warning: string;
}

/**
 * The words of the `time` part, by locale: kept here until a later pass gathers every module's
 * strings into the catalogs.
 */
const timeWords: Readonly<Record<Locale, TimeWords>> = {
  en: {
    expired: (allowLateSubmission) =>
      allowLateSubmission ? "The time is up. Late answers are still accepted." : "The time is up.",
    left: (clock) => `Time left: ${clock}`,
    min: (clock) => `You can move on in ${clock}`,
    warning: "One minute or less is left.",
  },
};

/**
 * Write whole seconds as a clock: `m:ss`, or `h:mm:ss` from an hour.
 *
 * @param seconds The whole seconds.
 * @returns The clock.
 */
const clockOf = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
};

/**
 * Give what the `time` part's status region says: nothing while no `max-time` is in force or more
 * than a minute is left, the warning at a minute or less, and the expiry notice once the time left
 * is 0.
 *
 * @param time The time in force.
 * @param words The part's words.
 * @returns The notice, empty for none.
 */
const noticeOf = (time: TimeState, words: TimeWords): string => {
  if (Option.isNone(time.timeLeft)) {
    return "";
  }

  const left = Math.ceil(time.timeLeft.value);
  if (left === 0) {
    return words.expired(time.allowLateSubmission);
  }

  return left <= warningSeconds ? words.warning : "";
};

/**
 * Construct one count of the `time` part: a `span` naming what it counts as `data-time` and its
 * whole seconds as `data-seconds`, holding the count in words.
 *
 * @param counted `left` for the time left, `min` for how long `min-time` still holds.
 * @param seconds The whole seconds.
 * @param words The count in words.
 * @returns The span.
 */
const countdown = (counted: "left" | "min", seconds: number, words: string): Element =>
  h("span", { "data-seconds": String(seconds), "data-time": counted }, [text(words)]);

/**
 * Give what the `time` part renders (T-2, S-2, T-6, I-16; issue m3f-01): a `timer` region, hidden
 * while no time is in force, holding the time left (`data-time="left"`) and how long `min-time`
 * still holds the candidate (`data-time="min"`), each with its whole seconds, rounded up, as
 * `data-seconds` and followed by a space so the counts read apart with no stylesheet, and always a
 * `role="status"` region (`data-time="notice"`), which is empty while
 * more than a minute is left and warns at a minute or less and at expiry. The status region is
 * rendered empty first so its later text is announced (WCAG 4.1.3 Status Messages); the words are
 * static, and a host's live countdown is the host's.
 *
 * @param time The time in force, if any.
 * @param locale The locale the part's words are written in.
 * @returns The part's attributes and children.
 */
export const timePart = (time: TimeState | undefined, locale: Locale): TimePart => {
  const words = timeWords[locale];
  const left = time === undefined ? Option.none() : time.timeLeft.pipe(Option.map(Math.ceil));
  const min = time === undefined ? Option.none() : time.minTimeLeft.pipe(Option.map(Math.ceil));
  const notice = time === undefined ? "" : noticeOf(time, words);

  return {
    children: [
      ...(Option.isSome(left)
        ? [countdown("left", left.value, words.left(clockOf(left.value))), text(" ")]
        : []),
      ...(Option.isSome(min)
        ? [countdown("min", min.value, words.min(clockOf(min.value))), text(" ")]
        : []),
      h("span", { "data-time": "notice", role: "status" }, notice === "" ? [] : [text(notice)]),
    ],
    props: time === undefined ? { hidden: true, role: "timer" } : { role: "timer" },
  };
};
