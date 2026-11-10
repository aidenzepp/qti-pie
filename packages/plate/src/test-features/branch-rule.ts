/**
 * Branch Rule (issue m5-05): the test model dispatches each `qti-branch-rule` to its `parse`,
 * which reads the element's expression, its `target` and the test part, section or item ref it
 * sits on. After an item's attempt is processed, the rules of the item, of each section the walk
 * leaves (innermost first) and of the part when the walk leaves it are judged, and "if the
 * expression evaluates to 'true' the test jumps forward" to the target, or out of the section, the
 * part or the test the reserved exits name. A test part's rules apply in every part; a section's
 * and an item ref's only in a linear part with individual submission, since "pre-conditions and
 * branch rules are ignored in nonlinear mode". The walk is `branchTarget` and `branchEntered` in
 * `#plate/test-features/branching.ts`, shared with the pre-conditions.
 *
 * @module
 */
import { Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import {
  BranchingNotRendered,
  branchEntered,
  branchTarget,
  ruleExpression,
} from "#plate/test-features/branching.ts";
import type { BranchRule } from "#plate/test-features/branching.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";

/**
 * The Branch Rule module (issue m5-05). Its node is a {@link BranchRule}: the expression, read in
 * the test's scope as outcome processing reads its own, where "prefixed variable references
 * (`ITEMREF.N.VAR`) are valid in a test's pre-conditions and branch rules as well as in its outcome
 * processing" and "the eight outcome-only expressions are forbidden outside outcome processing"
 * (`docs/spec-readings.md`); the target, which by reading 87 ("A branch rule names a reserved exit,
 * or a later part of its own kind in its own test part, never inside a section a ref places from
 * outside it, and never an item a replacement can repeat") only ever lies ahead; and the owner the
 * element sits on.
 *
 * Its `gate` names the place a `next` jumps to within the part (`branchTarget`), so the move and
 * its target agree; its `enter` passes over the places a jump skips and carries out the exits
 * (`branchEntered`). It places and presents nothing.
 */
export const branchRuleModule: TestFeatureModule<"qti-branch-rule", BranchRule> = {
  deliver: (context) => context.test,
  element: "qti-branch-rule",
  enter: branchEntered,
  feature: [],
  gate: branchTarget,
  implemented: true,
  issue: "m5-05",
  key: "qti-branch-rule",
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.flatMap(context.readers.identifierAttribute(element, "target"), (target) =>
      Result.map(ruleExpression(element, context, "qti-branch-rule"), (expression) =>
        expression.pipe(Option.map((read) => ({ expression: read, owner: context.owner, target }))),
      ),
    ),
  present: () => [],
  render: () => {
    throw new BranchingNotRendered({ feature: "qti-branch-rule" });
  },
  sequence: (context) => context.places,
};
