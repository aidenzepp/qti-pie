/**
 * Pre-condition (issue m5-05): the test model dispatches each `qti-pre-condition` to its `parse`,
 * which reads the element's expression and the test part, section or item ref it sits on, and its
 * `enter` skips each place a false pre-condition closes. QTI's reading: "If any is false the part,
 * section or item is skipped". A test part's pre-conditions apply in every part; a section's and an
 * item ref's only in a linear part with individual submission, since "pre-conditions and branch
 * rules are ignored in nonlinear mode". The walk is `preConditionsEntered` in
 * `#plate/test-features/branching.ts`, shared with the branch rules.
 *
 * @module
 */
import { Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import {
  BranchingNotRendered,
  preConditionsEntered,
  ruleExpression,
} from "#plate/test-features/branching.ts";
import type { PreCondition } from "#plate/test-features/branching.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";

/**
 * The Pre-condition module (issue m5-05). Its node is a {@link PreCondition}: the expression,
 * read in the test's scope as outcome processing reads its own, where "prefixed variable references
 * (`ITEMREF.N.VAR`) are valid in a test's pre-conditions and branch rules as well as in its outcome
 * processing" and "the eight outcome-only expressions are forbidden outside outcome processing"
 * (`docs/spec-readings.md`), and the owner the element sits on. Its `enter` answers through
 * `preConditionsEntered`; it gates no intent, places and presents nothing.
 */
export const preConditionModule: TestFeatureModule<"qti-pre-condition", PreCondition> = {
  deliver: (context) => context.test,
  element: "qti-pre-condition",
  enter: preConditionsEntered,
  feature: [],
  gate: () => Option.none(),
  implemented: true,
  issue: "m5-05",
  key: "qti-pre-condition",
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.map(ruleExpression(element, context, "qti-pre-condition"), (expression) =>
      expression.pipe(Option.map((read) => ({ expression: read, owner: context.owner }))),
    ),
  present: () => [],
  render: () => {
    throw new BranchingNotRendered({ feature: "qti-pre-condition" });
  },
  sequence: (context) => context.places,
};
