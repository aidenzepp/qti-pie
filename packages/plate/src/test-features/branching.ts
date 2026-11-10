/**
 * The walk branch rules and pre-conditions share (issue m5-05): where a place of the session sits
 * in its test, which rules are in force there, how one rule's expression is judged, and the next
 * place a linear part reaches from the item last presented. `qti-branch-rule`
 * (`#plate/test-features/branch-rule.ts`) and `qti-pre-condition`
 * (`#plate/test-features/pre-condition.ts`) each answer through it, so the order the rules are
 * judged in is written once, here.
 *
 * The order, from QTI's flow after an attempt: response processing, outcome processing, then the
 * branch rules of the item, of each section the walk leaves (innermost first) and of the part when
 * the walk leaves it; the first rule whose expression is true jumps, else the walk goes on in
 * sequence; then each item ref, section and part reached is skipped while one of its
 * pre-conditions is false, the part's judged before its sections' (outermost first) and those
 * before the item's, until one whose pre-conditions all hold is reached or the test ends.
 *
 * Where the rules apply: pre-conditions and branch rules "are only applicable to parts of the test
 * that are navigated in linear mode. In nonlinear mode they are ignored", and a test part's own
 * rules always apply, since test parts are taken in order. An item ref's and a section's rules
 * apply in a linear part with individual submission only: in a simultaneous part nothing of the
 * part is submitted until it ends, so no rule sits on its items before then.
 *
 * Expressions are judged in the test's scope as its outcome processing is (`runOutcomes` in
 * `#plate/engine/outcome.ts`): the test's outcome declarations are the holder, the session's
 * outcomes the variables, and `testScopeOf` the scope, so "prefixed variable references
 * (`ITEMREF.N.VAR`) are valid in a test's pre-conditions and branch rules as well as in its
 * outcome processing" (`docs/spec-readings.md`, reading 4) and a response reads the candidate's
 * last submitted value, the record's, never one saved and not yet submitted.
 *
 * This is a browser module, reached from the session: it value-imports from `effect` only `Data`,
 * `Option` and `Result`.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import { evaluateExpression, isTrue } from "#plate/engine/evaluate.ts";
import type { Declarations } from "#plate/engine/evaluate.ts";
import { testScopeOf } from "#plate/engine/outcome.ts";
import { drawStream } from "#plate/engine/random.ts";
import type { TestScope } from "#plate/engine/scope.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
import { refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { Section, SectionChild, Test, TestPart } from "#plate/model/test.ts";
import { attemptLimits } from "#plate/session/control.ts";
import { elapsedSeconds } from "#plate/session/elapsed.ts";
import type { TestSession } from "#plate/session/session.ts";
import type {
  EnterContext,
  EnterVerdict,
  FeatureOwner,
  GateContext,
  GateVerdict,
  TestParseContext,
} from "#plate/test-features/contract.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * A `qti-pre-condition` as the test model holds it (issue m5-05): its expression, and the test
 * part, section or item ref it sits on. The place it sits on is skipped while the expression is
 * not true.
 */
export interface PreCondition {
  readonly expression: Expression;
  readonly owner: FeatureOwner;
}

/**
 * A `qti-branch-rule` as the test model holds it (issue m5-05): its expression, the test part,
 * section or item ref it sits on, and its `target` as written with outer XML whitespace removed:
 * an item ref, a section or a later test part, or one of the reserved exits `EXIT_SECTION`,
 * `EXIT_TESTPART` and `EXIT_TEST`. By reading 87 of `docs/spec-readings.md` ("A branch rule names a
 * reserved exit, or a later part of its own kind in its own test part, never inside a section a
 * ref places from outside it, and never an item a replacement can repeat"), the validator has
 * refused every other target, so the walk only ever jumps forward.
 */
export interface BranchRule extends PreCondition {
  readonly target: string;
}

/**
 * A branch rule's or a pre-condition's node reached `render` (issue m5-05): a defect of plate,
 * since neither module presents content, so no hub holds a node of theirs to render. It is thrown,
 * never returned.
 */
export class BranchingNotRendered extends Data.TaggedError("BranchingNotRendered")<{
  /**
   * The feature's key, `qti-branch-rule` or `qti-pre-condition`.
   */
  readonly feature: string;
}> {
  /**
   * Which feature's node was rendered, and why that is a defect.
   */
  override get message(): string {
    return `${this.feature} was asked to render a node, but it presents no content: a branch rule or a pre-condition only moves the session, so a hub that renders one is a defect of plate.`;
  }
}

/**
 * Read a branch rule's or a pre-condition's expression (issue m5-05): its first element child,
 * read as the test's outcome processing reads its own (`TestParseContext.expression`). An element
 * with no expression child, which the validator refuses, is marked rather than read.
 *
 * @param element The `qti-branch-rule` or `qti-pre-condition`.
 * @param context The parse.
 * @param key The feature's key, the mark of an element with no expression.
 * @returns The expression; none once the element or its expression was marked; or the refusal the
 *   reading gives.
 */
export const ruleExpression = (
  element: SourceElement,
  context: TestParseContext,
  key: "qti-branch-rule" | "qti-pre-condition",
): Result.Result<Option.Option<Expression>, Refusal> => {
  const [child] = context.readers.elementsOf(element);

  return child === undefined ? context.mark(key) : context.expression(child);
};

/**
 * Where an item ref sits in a test: its test part, that part's index among the test's parts, and
 * the sections that enclose it, outermost first.
 */
interface Located {
  readonly part: TestPart;
  readonly partIndex: number;
  readonly sections: readonly Section[];
}

/**
 * A place of the session: its index among the session's items, its item ref, whether the
 * candidate has been shown it, and where it sits in the test.
 */
interface Place extends Located {
  readonly index: number;
  readonly presented: boolean;
  readonly ref: string;
}

/**
 * What one judgement of rules reads: the test, the session, and the test scope over the session's
 * items, built once per judgement.
 */
interface Judging {
  readonly scope: TestScope;
  readonly session: TestSession;
  readonly test: Test;
}

/**
 * The separator of a draw label's fields, U+001F, as the engine's labels join theirs
 * (`#plate/engine/random.ts`).
 */
const labelSeparator = "\u001F";

/**
 * The declarations a test's holder makes of responses and template variables: none, since a test
 * is not an item.
 */
const noDeclarations: Pick<Declarations, "responses" | "templates"> = {
  responses: new Map(),
  templates: new Map(),
};

/**
 * Give the sections from a part's or a section's children down to an item ref, outermost first.
 *
 * @param children The children.
 * @param ref The item ref's identifier.
 * @returns The enclosing sections, none when the children hold no such item ref.
 */
const sectionsDownTo = (
  children: readonly SectionChild[],
  ref: string,
): Option.Option<readonly Section[]> => {
  for (const child of children) {
    if (child.kind === "item-ref") {
      if (child.identifier === ref) {
        return Option.some([]);
      }
    } else {
      const below = sectionsDownTo(child.children, ref);
      if (Option.isSome(below)) {
        return Option.some([child, ...below.value]);
      }
    }
  }

  return Option.none();
};

/**
 * Find where an item ref sits in a test.
 *
 * @param test The test.
 * @param ref The item ref's identifier.
 * @returns Its part and enclosing sections, none when the test holds no such item ref.
 */
const locate = (test: Test, ref: string): Option.Option<Located> => {
  for (const [partIndex, part] of test.parts.entries()) {
    const sections = sectionsDownTo(part.children, ref);
    if (Option.isSome(sections)) {
      return Option.some({ part, partIndex, sections: sections.value });
    }
  }

  return Option.none();
};

/**
 * Give the place at an index of the session's items.
 *
 * @param test The test.
 * @param session The session.
 * @param index The index among its items.
 * @returns The place, none for an index past the items or an item ref the test lacks.
 */
const placeAt = (test: Test, session: TestSession, index: number): Option.Option<Place> =>
  Option.flatMap(Option.fromUndefinedOr(session.items[index]), (item) =>
    Option.map(locate(test, item.ref), (located) => ({
      ...located,
      index,
      presented: item.presented,
      ref: item.ref,
    })),
  );

/**
 * Tell whether an item ref's and a section's rules apply in a part: only a linear part with
 * individual submission, whose items are submitted one at a time in order.
 *
 * @param part The part.
 * @returns Whether its items' and sections' rules apply.
 */
const takesItemRules = (part: TestPart): boolean =>
  part.navigation === "linear" && part.submission === "individual";

/**
 * Tell whether the session has presented an item of some item refs.
 *
 * @param session The session.
 * @param refs The item refs' identifiers.
 * @returns Whether one of them has been presented.
 */
const anyPresented = (session: TestSession, refs: readonly string[]): boolean =>
  session.items.some((item) => item.presented && refs.includes(item.ref));

/**
 * Tell whether a rule sits on an owner.
 *
 * @param rule The rule.
 * @param owner The owner.
 * @returns Whether the rule's owner is that owner.
 */
const sitsOn = (rule: PreCondition, owner: FeatureOwner): boolean =>
  rule.owner.kind === owner.kind &&
  (owner.kind === "test" ||
    (rule.owner.kind !== "test" && rule.owner.identifier === owner.identifier));

/**
 * Build what one judgement reads: the test scope of the session over its items, with the test's
 * duration at the time given, none without one.
 *
 * @param test The test.
 * @param session The session.
 * @param items The test's items, keyed by item ref identifier.
 * @param now The time of the transition, where the hub has one.
 * @returns The judgement's inputs.
 */
const judgingOf = (
  test: Test,
  session: TestSession,
  items: ReadonlyMap<string, Accepted>,
  now: Option.Option<Date>,
): Judging => ({
  scope: testScopeOf(
    test,
    items,
    session,
    attemptLimits(test),
    now.pipe(Option.map((at) => elapsedSeconds(Date.parse(session.started), at.getTime()))),
  ),
  session,
  test,
});

/**
 * Judge whether a rule's expression is true in the test's scope.
 *
 * A NULL value is not true, so a pre-condition whose expression is NULL skips its place and a
 * branch rule whose expression is NULL is not taken: the proposed reading of issue m5-05, since QTI
 * skips on "false" and branches on "true" and names no case for NULL. A value that is not a single
 * boolean is not true either, as `isTrue` reads a condition. An engine failure, such as a read of a
 * value a stored record lacks, is not true: `enter` and `gate` have no failure channel, so the
 * rule reads as one whose value is unknown.
 *
 * A random kind draws under the session's processing seed with a label of its own per owner and
 * rule, so a rule judged twice, by the gate before a move and by the entry after it, gives the
 * same value.
 *
 * @param judging The judgement's inputs.
 * @param rule The rule.
 * @param ordinal The rule's place among the rules of its kind on its owner, counted from 0.
 * @returns Whether the expression's value is the single boolean `true`.
 */
const holds = (judging: Judging, rule: PreCondition | BranchRule, ordinal: number): boolean => {
  const { owner } = rule;
  const label = [
    judging.session.instance,
    "target" in rule ? "branch" : "pre-condition",
    owner.kind,
    owner.kind === "test" ? "" : owner.identifier,
    String(ordinal),
  ].join(labelSeparator);

  return Result.match(
    evaluateExpression(
      rule.expression,
      { ...noDeclarations, outcomes: judging.test.outcomes },
      { outcomes: judging.session.outcomes, responses: {}, test: judging.scope },
      drawStream(judging.session.seed, label),
    ),
    { onFailure: () => false, onSuccess: isTrue },
  );
};

/**
 * Give the branch rules in force when the walk leaves an item for another place, in the order they
 * are judged: the item's own, then those of each section it leaves, innermost first, then the
 * part's when it leaves the part. In a part that is not linear and individual, only the part's.
 *
 * @param rules The test's branch rules.
 * @param left The item left.
 * @param arriving Where the walk arrives: a place, none for the end of the left item's part.
 * @returns The rules, in the order they are judged.
 */
const branchesLeaving = (
  rules: readonly BranchRule[],
  left: Place,
  arriving: Option.Option<Located>,
): readonly BranchRule[] => {
  const within = arriving.pipe(Option.filter((place) => place.part === left.part));
  const leftSections = left.sections
    .toReversed()
    .filter((section) => !Option.exists(within, (place) => place.sections.includes(section)));
  const owners: readonly FeatureOwner[] = [
    ...(takesItemRules(left.part)
      ? [
          { identifier: left.ref, kind: "item-ref" } as const,
          ...leftSections.map(
            (section) => ({ identifier: section.identifier, kind: "section" }) as const,
          ),
        ]
      : []),
    ...(Option.isNone(within) ? [{ identifier: left.part.identifier, kind: "part" } as const] : []),
  ];

  return owners.flatMap((owner) => rules.filter((rule) => sitsOn(rule, owner)));
};

/**
 * Find the first branch rule whose expression is true among those in force, judging each rule
 * against its rank among the rules on its owner.
 *
 * @param judging The judgement's inputs.
 * @param rules The test's branch rules, in document order.
 * @param candidates The rules in force, in the order they are judged.
 * @returns The first rule taken, none when none is true.
 */
const firstTaken = (
  judging: Judging,
  rules: readonly BranchRule[],
  candidates: readonly BranchRule[],
): Option.Option<BranchRule> =>
  Option.fromUndefinedOr(
    candidates.find((rule) =>
      holds(judging, rule, rules.filter((each) => sitsOn(each, rule.owner)).indexOf(rule)),
    ),
  );

/**
 * Find the first place a branch target names after the item left: the item ref itself, or the
 * first item of the section it names, in the left item's part.
 *
 * @param test The test.
 * @param session The session.
 * @param left The item left.
 * @param target The target, an item ref's or a section's identifier.
 * @returns The place's index among the session's items, none when the target names nothing that
 *   follows in the part, as a section ref no package placed or an item ref a selection left out.
 */
const targetIndex = (
  test: Test,
  session: TestSession,
  left: Place,
  target: string,
): Option.Option<number> => {
  const named = (children: readonly SectionChild[]): Option.Option<readonly string[]> => {
    for (const child of children) {
      if (child.identifier === target) {
        return Option.some(
          child.kind === "item-ref" ? [child.identifier] : refIdentifiersIn(child.children),
        );
      }

      if (child.kind === "section") {
        const below = named(child.children);
        if (Option.isSome(below)) {
          return below;
        }
      }
    }

    return Option.none();
  };

  return Option.flatMap(named(left.part.children), (refs) => {
    const index = session.items.findIndex((item, at) => at > left.index && refs.includes(item.ref));

    return index === -1 || Option.isNone(placeAt(test, session, index))
      ? Option.none()
      : Option.some(index);
  });
};

/**
 * Where a branch rule taken from an item sends the walk.
 */
type Destination =
  | { readonly index: number; readonly kind: "place" }
  | { readonly kind: "exit-part"; readonly part: TestPart }
  | { readonly kind: "exit-section"; readonly section: Section }
  | { readonly kind: "exit-test" }
  | { readonly kind: "part"; readonly partIndex: number };

/**
 * Give the section an `EXIT_SECTION` leaves: the rule's own section when it sits on one, the
 * section that holds the item when it sits on the item ref.
 *
 * @param left The item left.
 * @param owner The rule's owner.
 * @returns The section, none for a rule on a part or the test, which sits in no section.
 */
const sectionExited = (left: Place, owner: FeatureOwner): Option.Option<Section> => {
  switch (owner.kind) {
    case "section": {
      return Option.fromUndefinedOr(
        left.sections.find((section) => section.identifier === owner.identifier),
      );
    }
    case "item-ref": {
      return Option.fromUndefinedOr(left.sections.at(-1));
    }
    case "part":
    case "test": {
      return Option.none();
    }
    default: {
      return owner satisfies never;
    }
  }
};

/**
 * Resolve where a branch rule taken from an item sends the walk: the reserved exits leave the
 * item's section (the rule's own section when it sits on one), its part, or the test; another
 * target is a later part, or a place of the item's part.
 *
 * @param test The test.
 * @param session The session.
 * @param left The item left.
 * @param rule The rule taken.
 * @returns The destination, none for an `EXIT_SECTION` on a part, which has no section to leave
 *   before its own end, and for a target that names nothing the session holds.
 */
const destinationOf = (
  test: Test,
  session: TestSession,
  left: Place,
  rule: BranchRule,
): Option.Option<Destination> => {
  switch (rule.target) {
    case "EXIT_TEST": {
      return Option.some({ kind: "exit-test" });
    }
    case "EXIT_TESTPART": {
      return Option.some({ kind: "exit-part", part: left.part });
    }
    case "EXIT_SECTION": {
      return Option.map(sectionExited(left, rule.owner), (section) => ({
        kind: "exit-section",
        section,
      }));
    }
    default: {
      const partIndex = test.parts.findIndex((part) => part.identifier === rule.target);

      return partIndex === -1
        ? Option.map(targetIndex(test, session, left, rule.target), (index) => ({
            index,
            kind: "place",
          }))
        : Option.some({ kind: "part", partIndex });
    }
  }
};

/**
 * Give the item a place is reached from: the last item presented before it in the session's
 * sequence, when the place is not yet presented and the walk arrives at it from that item, which
 * is so in the item's own part or as the session first enters the place's part.
 *
 * @param test The test.
 * @param session The session, the place's item not yet presented.
 * @param entering The place.
 * @returns The item left, none at the session's first place, for a place shown before, and for a
 *   place of a part the candidate already moves about in.
 */
const leftFor = (test: Test, session: TestSession, entering: Place): Option.Option<Place> => {
  if (entering.presented) {
    return Option.none();
  }

  const index = session.items.findLastIndex((item, at) => at < entering.index && item.presented);

  return Option.filter(
    placeAt(test, session, index),
    (left) =>
      left.part === entering.part ||
      !anyPresented(session, refIdentifiersIn(entering.part.children)),
  );
};

/**
 * Give the place a hub is about to enter, by its sequence index.
 *
 * @param context The entry.
 * @returns The place, none when the session holds no such item.
 */
const enteringOf = (context: EnterContext): Option.Option<Place> =>
  placeAt(
    context.test,
    context.session,
    context.session.items.findIndex((item) => item.sequenceIndex === context.sequenceIndex),
  );

/**
 * Give the branch rules a test holds, in document order.
 *
 * @param test The test.
 * @returns Its branch rules.
 */
const branchRulesOf = (test: Test): readonly BranchRule[] =>
  test.features?.["qti-branch-rule"] ?? [];

/**
 * Give the pre-conditions a test holds, in document order.
 *
 * @param test The test.
 * @returns Its pre-conditions.
 */
const preConditionsOf = (test: Test): readonly PreCondition[] =>
  test.features?.["qti-pre-condition"] ?? [];

/**
 * Say what the branch rules do with a place the session is about to enter: the place is passed
 * over (`skip`) while a branch rule taken from the item last presented targets a later place of
 * the part, and the session leaves the section, the part or the test (`exit`) a reserved exit or a
 * later part names, while the place still lies inside what it leaves (issue m5-05).
 *
 * The rules judged are those in force as the walk leaves the item last presented for this place
 * ({@link branchesLeaving}), with the session as it stands, the place not yet presented. A place
 * the walk reaches past the rule's destination, by a pre-condition's skip, is entered: a jump goes
 * forward to its target, and no further. A skip moves one place, and the hub asks again for the
 * place it lands on, so a jump to a later place skips each place between, none presented.
 *
 * @param context The place's sequence index, the session with its item not yet presented, the
 *   test, the items and the time.
 * @returns The skip or the exit, none when the place is entered as far as branch rules go.
 */
export const branchEntered = (context: EnterContext): Option.Option<EnterVerdict> => {
  const rules = branchRulesOf(context.test);
  if (rules.length === 0 || Option.isNone(context.items)) {
    return Option.none();
  }

  const items = context.items.value;
  const { session, test } = context;

  return Option.flatMap(enteringOf(context), (entering) =>
    Option.flatMap(leftFor(test, session, entering), (left) =>
      Option.flatMap(
        firstTaken(
          judgingOf(test, session, items, context.now),
          rules,
          branchesLeaving(rules, left, Option.some(entering)),
        ),
        (rule) =>
          Option.flatMap(
            destinationOf(test, session, left, rule),
            (destination): Option.Option<EnterVerdict> => {
              switch (destination.kind) {
                case "exit-test": {
                  return Option.some({
                    kind: "exit",
                    scope: { identifier: test.identifier, kind: "test" },
                  });
                }
                case "exit-part": {
                  return entering.part === destination.part
                    ? Option.some({
                        kind: "exit",
                        scope: { identifier: entering.part.identifier, kind: "part" },
                      })
                    : Option.none();
                }
                case "exit-section": {
                  return entering.sections.includes(destination.section)
                    ? Option.some({
                        kind: "exit",
                        scope: { identifier: destination.section.identifier, kind: "section" },
                      })
                    : Option.none();
                }
                case "part": {
                  return entering.partIndex < destination.partIndex
                    ? Option.some({
                        kind: "exit",
                        scope: { identifier: entering.part.identifier, kind: "part" },
                      })
                    : Option.none();
                }
                case "place": {
                  return destination.index > entering.index
                    ? Option.some({ kind: "skip" })
                    : Option.none();
                }
                default: {
                  return destination satisfies never;
                }
              }
            },
          ),
      ),
    ),
  );
};

/**
 * Say where `next` goes from the current item by its branch rules, before the part's modes rule on
 * it: the target a rule taken names, when it is a later place of the current part (issue m5-05).
 * So `moveTarget` and `move` name the place the jump reaches, as `advance` lands on it.
 *
 * Only `next` from a submitted item of a linear part with individual submission is answered, with
 * the test's items at hand: a branch rule is judged "after response and outcome processing on the
 * current item", and an item with no processed attempt is submitted before it is left. An exit, a
 * later part, or a target outside the part is left to the modes, and {@link branchEntered} carries
 * it out at the place the move lands on, as it does after a submission's own move.
 *
 * @param context The intent, the session, the test, the items and the time.
 * @returns The target, none when the modes decide the move.
 */
export const branchTarget = (context: GateContext): Option.Option<GateVerdict> => {
  const rules = branchRulesOf(context.test);
  const { intent, session, test } = context;
  if (rules.length === 0 || intent.kind !== "next" || Option.isNone(context.items)) {
    return Option.none();
  }

  const items = context.items.value;

  return Option.flatMap(placeAt(test, session, session.position), (left) => {
    const record = session.items[left.index]?.record;
    if (!takesItemRules(left.part) || record === undefined || record.numAttempts === 0) {
      return Option.none();
    }

    const arriving = placeAt(test, session, left.index + 1);

    return Option.flatMap(
      firstTaken(
        judgingOf(test, session, items, context.now),
        rules,
        branchesLeaving(rules, left, arriving),
      ),
      (rule) =>
        Option.flatMap(destinationOf(test, session, left, rule), (destination) =>
          destination.kind === "place"
            ? Option.map(Option.fromUndefinedOr(session.items[destination.index]), (item) => ({
                kind: "target",
                sequenceIndex: item.sequenceIndex,
              }))
            : Option.none(),
        ),
    );
  });
};

/**
 * Say what the pre-conditions do with a place the session is about to enter (issue m5-05): the
 * session leaves the place's part (`exit`) when it is entering the part and one of the part's
 * pre-conditions is false; leaves a section of the place when it is entering the section and one of
 * the section's is false, the outermost section judged first; and passes over the place (`skip`)
 * when one of the item ref's own is false. Each owner's pre-conditions are judged in document
 * order, and the first false one decides: "The order of the conditions is significant".
 *
 * A part's pre-conditions apply in every part; a section's and an item ref's only in a linear part
 * with individual submission. A place shown before, as a nonlinear part's `previous` or `go`
 * reaches, is entered as it is. The hub asks again for the place it lands on, so the walk goes on
 * "until the delivery engine arrives at a test part, section, and item whose preconditions are
 * met, or the end of the test".
 *
 * @param context The place's sequence index, the session with its item not yet presented, the
 *   test, the items and the time.
 * @returns The skip or the exit, none when every pre-condition in force holds.
 */
export const preConditionsEntered = (context: EnterContext): Option.Option<EnterVerdict> => {
  const rules = preConditionsOf(context.test);
  if (rules.length === 0 || Option.isNone(context.items)) {
    return Option.none();
  }

  const items = context.items.value;
  const { session, test } = context;

  return Option.flatMap(
    Option.filter(enteringOf(context), (entering) => !entering.presented),
    (entering) => {
      const judging = judgingOf(test, session, items, context.now);
      const fails = (owner: FeatureOwner): boolean =>
        rules
          .filter((rule) => sitsOn(rule, owner))
          .some((rule, ordinal) => !holds(judging, rule, ordinal));
      const { part } = entering;
      if (
        !anyPresented(session, refIdentifiersIn(part.children)) &&
        fails({ identifier: part.identifier, kind: "part" })
      ) {
        return Option.some({ kind: "exit", scope: { identifier: part.identifier, kind: "part" } });
      }

      if (!takesItemRules(part)) {
        return Option.none();
      }

      const closed = entering.sections.find(
        (section) =>
          !anyPresented(session, refIdentifiersIn(section.children)) &&
          fails({ identifier: section.identifier, kind: "section" }),
      );
      if (closed !== undefined) {
        return Option.some({
          kind: "exit",
          scope: { identifier: closed.identifier, kind: "section" },
        });
      }

      return fails({ identifier: entering.ref, kind: "item-ref" })
        ? Option.some({ kind: "skip" })
        : Option.none();
    },
  );
};
