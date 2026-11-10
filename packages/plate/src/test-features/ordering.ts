/**
 * Ordering (S-4), landed by issue m3f-02: the test model dispatches each `qti-ordering` to its
 * `parse`, which reads the element's `shuffle` into an {@link OrderingNode} the test holds under
 * `qti-ordering`, so a test holding it is accepted and no longer marked.
 *
 * The module delivers no sequence of its own. Ordering runs right after selection within each
 * section (reading 66, "Selection runs first. Ordering then shuffles the selected children"), and
 * a section's selection and its ordering are applied in one walk of the test's sections, since a
 * sub-section that is invisible and does not keep together hands its selected children to its
 * parent's shuffle, which only a walk that holds both can do. That walk is the Selection module's
 * `sequence` (`#plate/test-features/selection.ts`), which reads these nodes; this module's
 * `sequence` leaves the places it is given as they are.
 *
 * This is a browser module, reached from the session: it value-imports from `effect` only
 * `Option` and `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";

/**
 * A `qti-ordering` as the test model holds it (S-4, issue m3f-02): whether its section's selected
 * children are shuffled, and the element's path, from which the section it orders is found: the
 * path less its last step.
 */
export interface OrderingNode {
  readonly path: string;
  /**
   * The element's `shuffle`, false when unwritten. When true, the section's selected children that
   * are not fixed are shuffled around those that are, under the session's processing seed.
   */
  readonly shuffle: boolean;
}

/**
 * The Ordering module (S-4, issue m3f-02): it reads each `qti-ordering` into an
 * {@link OrderingNode}, whose `shuffle` the Selection module's `sequence` applies right after its
 * section's selection. Its own `sequence`, `gate` and `deliver` have no effect.
 */
export const orderingModule: TestFeatureModule<"qti-ordering", OrderingNode> = {
  deliver: (context) => context.test,
  element: "qti-ordering",
  feature: ["S-4"],
  gate: () => Option.none(),
  implemented: true,
  issue: "m3f-02",
  key: "qti-ordering",
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.map(context.readers.xsBoolean(element, "shuffle", false), (shuffle) =>
      Option.some({ path: context.path, shuffle }),
    ),
  sequence: (context) => context.places,
};
