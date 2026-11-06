/**
 * Item session control in a test: each `qti-item-session-control` attribute resolved for one item
 * ref, and the configuration an item is rendered and scored under there.
 *
 * {@link sessionControl} reads the attributes the test model holds as written and resolves them;
 * {@link itemConfiguration} writes the result into the host's configuration, turning
 * `max-attempts` into the attempt limit the session counts against. Both are pure.
 *
 * @module
 */
import { Array as Arr, Data, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { ControlAttributes, SectionChild, Test } from "#plate/model/test.ts";
import { sessionControlDefaults } from "#plate/session/control-defaults.ts";
import type { SubmissionMode } from "#plate/vocabulary.ts";

/**
 * The item session control in force for one item ref: each of the seven attributes taken from the
 * nearest element that sets it, and the submission mode of the part the ref sits in.
 *
 * `maxAttempts` is the resolved `max-attempts` as written, negative included, and 1 when no
 * element sets it. It is not the attempt limit: {@link itemConfiguration} derives that, with the
 * submission mode.
 */
export interface SessionControl {
  readonly allowComment: boolean;
  readonly allowReview: boolean;
  readonly allowSkipping: boolean;
  readonly maxAttempts: number;
  readonly showFeedback: boolean;
  readonly showSolution: boolean;
  /**
   * The submission mode of the test part that holds the item ref.
   */
  readonly submission: SubmissionMode;
  readonly validateResponses: boolean;
}

/**
 * The failure of {@link sessionControl}: the test holds no item ref of the identifier asked for,
 * as when a session started from one test is read against another.
 */
export class UnknownItemRef extends Data.TaggedError("UnknownItemRef")<{
  readonly ref: string;
  readonly test: string;
}> {
  /**
   * The identifier, the test, and what to pass instead.
   */
  override get message(): string {
    return `The test ${JSON.stringify(this.test)} has no item ref ${JSON.stringify(this.ref)}. Pass the identifier of one of its qti-assessment-item-ref elements, with the test the session was started from.`;
  }
}

/**
 * The six boolean fields of {@link SessionControl}, each with the attribute it reads, as
 * `sessionControlDefaults` spells it.
 */
const booleanAttributes = {
  allowComment: "allow-comment",
  allowReview: "allow-review",
  allowSkipping: "allow-skipping",
  showFeedback: "show-feedback",
  showSolution: "show-solution",
  validateResponses: "validate-responses",
} as const satisfies Readonly<
  Record<Exclude<keyof ControlAttributes, "maxAttempts">, keyof typeof sessionControlDefaults>
>;

/**
 * The `max-attempts` of an item none of its enclosing elements limits: one attempt.
 *
 * QTI gives an unspecified `max-attempts` as 1 for a non-adaptive item (`info.txt:68764`). An
 * adaptive item is a mark the session does not deliver, so every delivered item is non-adaptive.
 */
const unsetAttempts = 1;

/**
 * Find the session controls that govern an item ref among a section's children: the ref's own,
 * then each enclosing section's, innermost first.
 *
 * @param children The children to search, in document order.
 * @param ref The item ref's identifier.
 * @param enclosing The controls of the sections that hold `children`, innermost first.
 * @returns The controls from the ref outward to the part, or none when no child is or holds the
 *   ref.
 */
const controlsOf = (
  children: readonly SectionChild[],
  ref: string,
  enclosing: readonly ControlAttributes[],
): Option.Option<readonly ControlAttributes[]> =>
  Arr.findFirst(children, (child) => {
    if (child.kind === "item-ref") {
      return child.identifier === ref ? Option.some([child.control, ...enclosing]) : Option.none();
    }

    return controlsOf(child.children, ref, [child.control, ...enclosing]);
  });

/**
 * Read one attribute from the nearest of some session controls that sets it.
 *
 * @param controls The controls, nearest first.
 * @param read The attribute as one control writes it.
 * @returns The nearest control's value, or none when no control sets the attribute.
 */
const nearest = <A>(
  controls: readonly ControlAttributes[],
  read: (control: ControlAttributes) => Option.Option<A>,
): Option.Option<A> => Option.firstSomeOf(controls.map(read));

/**
 * Resolve one boolean attribute: the nearest control's value, else the attribute's XSD default.
 *
 * @param controls The controls, nearest first.
 * @param field The attribute's field.
 * @returns The value in force.
 */
const flag = (
  controls: readonly ControlAttributes[],
  field: keyof typeof booleanAttributes,
): boolean =>
  Option.getOrElse(
    nearest(controls, (control) => control[field]),
    () => sessionControlDefaults[booleanAttributes[field]],
  );

/**
 * Resolve the item session control in force for one item ref.
 *
 * Each attribute comes from the nearest element that sets it: the item ref, each enclosing section
 * innermost first, then the test part (`info.txt:68737`). An attribute none of them sets takes
 * its XSD default, and `max-attempts` 1. A test's item ref identifiers are unique
 * (`duplicate-identifier`), so the identifier names one ref.
 *
 * @example
 *   sessionControl(test, session.items[0].ref); // the first item's control, or UnknownItemRef
 *
 * @param test The test, as `buildTest` read it.
 * @param ref The item ref's identifier, as a session item names it.
 * @returns The ref's session control, or {@link UnknownItemRef} when the test holds no item ref of
 *   that identifier.
 */
export const sessionControl = (
  test: Test,
  ref: string,
): Result.Result<SessionControl, UnknownItemRef> => {
  const found = Arr.findFirst(test.parts, (part) =>
    Option.map(controlsOf(part.children, ref, [part.control]), (controls) => ({
      controls,
      submission: part.submission,
    })),
  );

  return Result.fromOption(found, () => new UnknownItemRef({ ref, test: test.identifier })).pipe(
    Result.map(({ controls, submission }): SessionControl => ({
      allowComment: flag(controls, "allowComment"),
      allowReview: flag(controls, "allowReview"),
      allowSkipping: flag(controls, "allowSkipping"),
      maxAttempts: Option.getOrElse(
        nearest(controls, (control) => control.maxAttempts),
        () => unsetAttempts,
      ),
      showFeedback: flag(controls, "showFeedback"),
      showSolution: flag(controls, "showSolution"),
      submission,
      validateResponses: flag(controls, "validateResponses"),
    })),
  );
};

/**
 * Derive the attempt limit an item's session counts against, where 0 is no limit.
 *
 * A simultaneous part allows one and only one attempt at each item (`info.txt:9176`), whatever
 * `max-attempts` says. Elsewhere a negative `max-attempts`, valid as an `xs:int` and marked
 * `max-attempts:negative`, is no limit, and so 0, since `Configuration.maxAttempts` admits no
 * negative.
 *
 * @param control The item's session control.
 * @returns The limit, a non-negative integer.
 */
const attemptLimit = (control: SessionControl): number => {
  if (control.submission === "simultaneous") {
    return 1;
  }

  return Math.max(control.maxAttempts, 0);
};

/**
 * Write an item's session control over a configuration: the configuration the item is rendered
 * and scored under in the test.
 *
 * The seven session-control fields are replaced, `maxAttempts` with the effective attempt limit,
 * so the result always holds what the `Configuration` Schema admits. Every other field, `seed`
 * included, is the host's.
 *
 * @param configuration The host's configuration.
 * @param control The item's session control, from {@link sessionControl}.
 * @returns The configuration with the item's session control written in.
 */
export const itemConfiguration = (
  configuration: Configuration,
  control: SessionControl,
): Configuration => ({
  ...configuration,
  allowComment: control.allowComment,
  allowReview: control.allowReview,
  allowSkipping: control.allowSkipping,
  maxAttempts: attemptLimit(control),
  showFeedback: control.showFeedback,
  showSolution: control.showSolution,
  validateResponses: control.validateResponses,
});
