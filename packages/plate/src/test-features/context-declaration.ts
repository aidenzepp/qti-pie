/**
 * Context Declarations (I-15), landed by issue m3f-08: the test model dispatches each
 * `qti-context-declaration` of a test to its `parse`, which reads the element into a
 * {@link ContextDeclarationNode} the test holds under `qti-context-declaration`; the test's
 * outcome processing reads each such variable at its default (`Test.contexts` in
 * `#plate/model/test.ts`). An item's context declarations are the item model's
 * (`Item.contexts` in `#plate/model/item.ts`).
 *
 * The host's {@link QtiContext}, which `startTest` and `begin` take as `qtiContext`, gives the
 * values of the built-in `QTI_CONTEXT` every processing of the session reads, resolved before any
 * template, response or outcome processing runs.
 *
 * A declaration of base type `file` or cardinality `record`, whose value the engine does not hold,
 * is marked `qti-context-declaration` as the stub marked every one. The module's hooks have no
 * effect: a context declaration neither selects, orders, gates nor places anything.
 *
 * @module
 */
import { Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import type { ContextDeclaration } from "#plate/model/item.ts";
import { TestFeatureNotImplemented } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

export type { QtiContext } from "#plate/model/record.ts";

/**
 * A test's `qti-context-declaration` as the test model holds it: the declared variable, of a
 * modelled base type and cardinality, with its default.
 */
export type ContextDeclarationNode = ContextDeclaration;

/**
 * The Context Declarations module (I-15, issue m3f-08): it reads each test-level
 * `qti-context-declaration` of a modelled type into a {@link ContextDeclarationNode}, and marks one
 * of base type `file` or cardinality `record`. Its `sequence` keeps the places, its `gate` and
 * `enter` let everything through, and its `deliver` returns the test unchanged. It presents nothing
 * at any place, so its `render` is never reached and throws.
 */
export const contextDeclarationModule: TestFeatureModule<
  "qti-context-declaration",
  ContextDeclarationNode
> = {
  deliver: (context) => context.test,
  element: "qti-context-declaration",
  enter: () => Option.none(),
  feature: ["I-15"],
  gate: () => Option.none(),
  implemented: true,
  issue: "m3f-08",
  key: "qti-context-declaration",
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.flatMap(
      context.contextDeclaration(element),
      (read): Result.Result<Option.Option<ContextDeclarationNode>, Refusal> =>
        Option.isSome(read) ? Result.succeed(read) : context.mark("qti-context-declaration"),
    ),
  present: () => [],
  render: () => {
    throw new TestFeatureNotImplemented({ feature: "qti-context-declaration", issue: "m3f-08" });
  },
  sequence: (context) => context.places,
};
