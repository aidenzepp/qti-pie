/**
 * The test-feature module contract: what one test-level feature plate accepts and does not yet
 * deliver gives every hub that meets it, so a feature's facts live in its own module and each hub
 * delegates to it, as an interaction's do through `InteractionModule`
 * (`#plate/interactions/contract.ts`) and a content element's through `ContentModule`
 * (`#plate/content/contract.ts`).
 *
 * A test feature is one `testMarks` (`#plate/vocabulary.ts`) keys by an element: selection,
 * adaptive selection, ordering, time limits, pre-conditions, branch rules, a test-level rubric
 * block, test feedback, section references, a test-level stylesheet, context declarations and
 * XInclude's `include`. The other marks there (`allow-comment="true"`, a negative `max-attempts`,
 * a section or stimulus root, `lti-link`) name no element and have no module.
 *
 * Each module beside this file is a stub, built by {@link stub}: `implemented` is false, its
 * `parse` records the mark the test model records for its element and reads no node, and its three
 * hooks have no effect, so the verdicts, the sequence and the HTML stay what they were. The hubs
 * consult the modules through the table `testFeatures` (`#plate/test-features/table.ts`) and the
 * delegations of `#plate/test-features/dispatch.ts`, each at one site:
 *
 * - The test model (`buildTest` in `#plate/model/test.ts`) dispatches each element a module names to
 *   its `parse`, and holds the nodes it reads in `Test.features`, keyed by the module's key
 *   ({@link TestFeatureNodes});
 * - The session consults `sequence` as it starts (`startTest` in `#plate/session/start.ts`), and
 *   `gate` before each move (`moveTargets` in `#plate/session/navigate.ts`) and each submission
 *   (`advance` in `#plate/session/advance.ts`);
 * - The package consults `deliver` as it delivers each test (`openPackage` in
 *   `#plate/package/open.ts`).
 *
 * Landing a feature changes only its module, its test and its fixtures: `implemented` turns true,
 * `parse` reads the element into the module's own node type, and the hooks do the feature's work.
 *
 * @module
 */
import { Data, Option } from "effect";
import type { Result } from "effect";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { AttributeReaders } from "#plate/model/reader.ts";
import type { ItemRef, Test, TestPart } from "#plate/model/test.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The keys of the test features that have a module, each once: the one place that names them, in
 * the order `testMarks` lists them. The table in `#plate/test-features/table.ts` is a record over
 * {@link TestFeatureKey}, so a key added here or taken from here changes that table or fails to
 * compile. Each key is the mark the verdict records for the feature's element: its QTI name, or
 * `xi:include` for XInclude's `include`.
 */
export const testFeatureKeys = [
  "qti-selection",
  "qti-adaptive-selection",
  "qti-ordering",
  "qti-time-limits",
  "qti-pre-condition",
  "qti-branch-rule",
  "qti-rubric-block",
  "qti-test-feedback",
  "qti-assessment-section-ref",
  "qti-stylesheet",
  "qti-context-declaration",
  "xi:include",
] as const;

/**
 * The key of a test feature that has a module: the mark the verdict records for its element.
 */
export type TestFeatureKey = (typeof testFeatureKeys)[number];

/**
 * The keys as any mark is compared with them.
 */
const keyMarks: readonly string[] = testFeatureKeys;

/**
 * Tell whether a mark keys a test feature that has a module.
 *
 * @param mark A mark.
 * @returns Whether a module owns it.
 */
export const isTestFeatureKey = (mark: string): mark is TestFeatureKey => keyMarks.includes(mark);

/**
 * A feature of the QTI 3.0 conformance list, Appendix A, by its identifier: `I-` the item's, `P-`
 * the package's, `S-` the section's and `T-` the test's rows.
 */
export type TestFeatureId = `${"I" | "P" | "S" | "T"}-${number}`;

/**
 * What the test model hands a module's `parse`: the way to record its element as a mark on the
 * verdict, the element's path, and the attribute readers bound to the build
 * (`#plate/model/reader.ts`), so a module reads its element as the test model reads its own and
 * never imports the readers.
 */
export interface TestParseContext {
  /**
   * Record the feature as a mark at the element's path, as the test model marks every element it
   * does not deliver.
   *
   * @param feature The feature's key, as the verdict names it.
   * @returns None, as the model then holds no node of the element.
   */
  readonly mark: (feature: string) => Result.Result<Option.Option<never>>;
  /**
   * The element path of the element being parsed.
   */
  readonly path: string;
  /**
   * The attribute readers, bound to the build.
   */
  readonly readers: AttributeReaders;
}

/**
 * An item ref and the test part that holds it: one place of the sequence a session walks.
 */
export interface SequencePlace {
  readonly part: TestPart;
  readonly ref: ItemRef;
}

/**
 * What `startTest` hands a module's `sequence`: the places the sequence holds so far, in order, the
 * test, and the session's processing seed, which keys every draw a feature makes, so a restored
 * session keeps its sequence.
 */
export interface SequenceContext {
  readonly places: readonly SequencePlace[];
  readonly seed: string;
  readonly test: Test;
}

/**
 * What the session hands a module's `gate` before an intent is carried out: the intent, the
 * session as it stands, the test, and the time of the request where the hub has one (`advance`
 * and `move` have it; `moveTargets`, which decides the moves a session allows now, has none).
 */
export interface GateContext {
  readonly intent: Intent;
  readonly now: Option.Option<Date>;
  readonly session: TestSession;
  readonly test: Test;
}

/**
 * What a module's `gate` says of an intent: `refuse`, with the module's own rule and the reason in
 * words, or, for a move, `target`, the sequence index the move reaches in place of the one the
 * part's modes give (a branch rule's target). None lets the intent through to the modes' rules.
 */
export type GateVerdict =
  | { readonly detail: string; readonly kind: "refuse"; readonly rule: string }
  | { readonly kind: "target"; readonly sequenceIndex: number };

/**
 * An intent a test feature refused: which feature, its rule, and the reason in words, as a
 * `MoveRefused` or an `IntentRefused` carries it under the rule `feature`.
 */
export interface FeatureRefusal {
  readonly detail: string;
  readonly feature: TestFeatureKey;
  readonly rule: string;
}

/**
 * What `openPackage` hands a module's `deliver` for one test of an accepted package: the test as
 * the package delivers it so far, its document, and every document of the package the reader read,
 * keyed by its path from the package's root, so a feature that places a section document or an
 * included fragment reads it from here.
 */
export interface DeliveryContext {
  readonly documents: ReadonlyMap<string, SourceDocument>;
  readonly source: SourceDocument;
  readonly test: Test;
}

/**
 * The members every test-feature module has.
 *
 * @template K The feature's key.
 * @template N The feature's model node, `never` for a stub, which has none yet.
 */
export interface TestFeatureModule<K extends TestFeatureKey, N> {
  /**
   * Give the test `openPackage` delivers, given what the package holds: the test unchanged for a
   * feature that places nothing.
   */
  readonly deliver: (context: DeliveryContext) => Test;
  /**
   * The element's local name, which the test model dispatches on with the module's `namespace`.
   */
  readonly element: string;
  /**
   * The feature's Appendix A identifiers; none for one no row names.
   */
  readonly feature: readonly TestFeatureId[];
  /**
   * Say what the feature does with an intent before the part's modes rule on it: none for a
   * feature that lets every intent through.
   */
  readonly gate: (context: GateContext) => Option.Option<GateVerdict>;
  /**
   * Whether the module delivers the feature: false for a stub, whose `parse` records the mark.
   */
  readonly implemented: boolean;
  /**
   * The issue that fills the module, such as `m3f-01`, which its errors name.
   */
  readonly issue: string;
  readonly key: K;
  /**
   * The element's namespace: QTI's, or XInclude's for `include`.
   */
  readonly namespace: string;
  /**
   * Read the element into the module's node, or none once it has recorded the element's mark.
   */
  readonly parse: (
    element: SourceElement,
    context: TestParseContext,
  ) => Result.Result<Option.Option<N>, Refusal>;
  /**
   * Give the places a session walks, from those the sequence holds so far: unchanged for a feature
   * that neither selects nor orders.
   */
  readonly sequence: (context: SequenceContext) => readonly SequencePlace[];
}

/**
 * The model node a module's `parse` reads its element into: `never` for a stub, which has none
 * yet.
 *
 * @template M The module.
 */
export type TestFeatureNodeOf<M> = M extends {
  readonly parse: (...args: never[]) => Result.Result<Option.Option<infer N>, Refusal>;
}
  ? N
  : never;

/**
 * The nodes the test model holds of the elements the modules read: each key whose module read a
 * node keys those nodes, in document order; one it read none of is absent. A stub's key is always
 * absent, as its `parse` reads no node. Derived from the modules, so a module that lands a model
 * node lands it here with no change to the test model.
 *
 * @template M The modules.
 */
export type TestFeatureNodes<M extends { readonly key: string }> = {
  readonly [Module in M as Module["key"]]?: readonly TestFeatureNodeOf<Module>[];
};

/**
 * A step of a stub test-feature module ran, or a public function a stub backs was called: a defect
 * of plate, or a call ahead of the issue that fills the stub, which the message names. It is
 * thrown, never returned.
 */
export class TestFeatureNotImplemented extends Data.TaggedError("TestFeatureNotImplemented")<{
  /**
   * The feature's key, or the name of the function called.
   */
  readonly feature: string;
  /**
   * The issue that fills it, such as `m3f-04`.
   */
  readonly issue: string;
}> {
  /**
   * Which feature is a stub, and the issue that fills it.
   */
  override get message(): string {
    return `${this.feature} is a stub: issue ${this.issue} fills it. Until it lands, plate accepts the feature and marks it on the verdict, and delivers nothing of it.`;
  }
}

/**
 * What a stub declares: the fields of {@link TestFeatureModule} that are the feature's facts, which
 * do not change when the module lands.
 *
 * @template K The feature's key.
 */
export type StubDeclaration<K extends TestFeatureKey> = Pick<
  TestFeatureModule<K, never>,
  "element" | "feature" | "issue" | "key" | "namespace"
>;

/**
 * Build a stub module from its declaration: `implemented` false, a `parse` that records the
 * declaration's key as the element's mark and reads no node, and the three hooks with no effect,
 * so a test that holds the feature is marked and delivered as it was before the module existed.
 *
 * @template K The feature's key.
 * @param declared The feature's facts.
 * @returns The stub.
 */
export const stub = <K extends TestFeatureKey>(
  declared: StubDeclaration<K>,
): TestFeatureModule<K, never> => ({
  ...declared,
  deliver: (context) => context.test,
  gate: () => Option.none(),
  implemented: false,
  parse: (_element, context) => context.mark(declared.key),
  sequence: (context) => context.places,
});
