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
 * `parse` records the mark the test model records for its element and reads no node, its three
 * hooks have no effect, and its `render` throws {@link TestFeatureNotImplemented}, which no hub
 * reaches since no hub holds a node of a stub, so the verdicts, the sequence and the HTML stay what
 * they were. The hubs
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
import type { Element, Node } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { BodyNode } from "#plate/model/item.ts";
import type { AttributeReaders } from "#plate/model/reader.ts";
import type { ItemRef, Test, TestPart } from "#plate/model/test.ts";
import type { EmitState } from "#plate/payload.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import type { Supports } from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { OutcomeView } from "#plate/vocabulary.ts";

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
 * A scope a time limit bounds, named for the session hub: an item ref, a section, a test part or
 * the test, by its identifier (the test's own for `test`). A module's `gate` names the scope whose
 * time has run out, and the hub knows how to leave each kind, so the module never reads the
 * session's structure. The session records each scope that expired, in order, as
 * `TestSession.expired`.
 */
export interface TimedScope {
  readonly identifier: string;
  readonly kind: "item-ref" | "part" | "section" | "test";
}

/**
 * What a module's `gate` says of an intent: `refuse`, with the module's own rule and the reason in
 * words; for a move, `target`, the sequence index the move reaches in place of the one the part's
 * modes give (a branch rule's target); or `expire`, that the time of a scope the intent falls in
 * has run out. None lets the intent through to the modes' rules.
 *
 * An `expire` answers any intent, a move included, and the session hub (`expireScope` in
 * `#plate/session/expire.ts`, which `advance` calls) carries it out in place of the intent:
 *
 * - The request's own responses are not saved: the expiry runs before the step is saved, so the
 *   current item keeps what it held, and only the time the item was shown is added.
 * - Every presented item of the scope whose attempt is open, or which holds saved responses not yet
 *   processed, is submitted with its saved responses, as a submission processes it; an item of the
 *   scope never presented is ended without an attempt. In a simultaneous part an item ref's or a
 *   section's expiry processes nothing, since the part's submission processes each item once: the
 *   items are locked and wait for `submit-part`. A part's or the test's expiry processes each
 *   presented item once in either submission mode.
 * - The scope is left: an item ref's expiry moves on in a linear part, as `next` does there, and in a
 *   nonlinear part leaves the position where it is; a section's expiry moves to the first item
 *   after the section when the current item is in it, else leaves the position, and ends the part
 *   when no item of the part follows an individual section; a part's expiry ends the part, so the
 *   next part that holds an item becomes current or the test closes; the test's expiry ends every
 *   part and closes the test.
 * - Each item of the scope is left `locked`, so it is closed: its controls render disabled, and
 *   `submit-item` is no longer offered for it.
 * - The scope is appended to the session's `expired`, so a host learns it happened by reading the
 *   session `advance` returns; `advance` returns the session as for any other step. A scope expires
 *   once: an `expire` naming a scope already in `expired` lets the intent through to the modes'
 *   rules, so a module states that a scope's time is over as often as it is asked, and keeps no
 *   memory of what the hub did.
 * - A restored session reads `locked` and `expired` back, so the stored form carries them.
 *
 * `qti-time-limits` (issue m3f-01b) is the first module to answer `expire`, implementing reading
 * D19 of `docs/spec-readings.md`.
 */
export type GateVerdict =
  | { readonly detail: string; readonly kind: "refuse"; readonly rule: string }
  | { readonly kind: "expire"; readonly scope: TimedScope }
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
 * What a test-feature module's `render` is handed, beside the emit state: the emission of body
 * nodes and the supports and the view the content is shown under, and the two facts of this render
 * that only the host and the render know, the host's reader of package files and the instance of
 * the item the content is shown with.
 *
 * Issue `m5-06` fills the test-level stylesheet module from `files` and `instance`: plate reads no
 * file itself (`openPackage` hands the host paths only, and the host holds the texts), and the host
 * passes the item's instance to the item's render and to this one, so a `<style>` the module
 * renders is confined to that item's Root, `#<scopedId(instance, "item")>`.
 */
export interface TestContentRenderKit {
  /**
   * Read the text of one package file from the host: `renderTestContent`'s `options.files`, or
   * `() => Option.none()` when the host passed none. The kit resolves nothing: a module resolves
   * the path it asks for against the test document. A module that finds no file renders nothing
   * for it and says so through the Notice part, since the host decides at render time what it
   * holds.
   *
   * @param path A package-relative path, as the module resolved it.
   * @returns The file's text, none when the host holds no such file.
   */
  readonly files: (path: string) => Option.Option<string>;
  /**
   * The instance of the item the content is shown with: the item Root's id is
   * `scopedId(instance, "item")`, so a module that confines a rule to that Root writes the
   * selector `#<id>`. Two renderings of one item differ by it, so the selector does too.
   */
  readonly instance: string;
  /**
   * Prints the body nodes by the session's outcomes and emits them; refuses any interaction.
   *
   * @param nodes The body nodes.
   * @returns The emitted nodes, or the first refusal of a part swap.
   */
  readonly nodes: (nodes: readonly BodyNode[]) => Result.Result<readonly Node[], PartSwapRefused>;
  /**
   * The supports the host enabled, `noSupports` when it named none.
   */
  readonly supports: Supports;
  /**
   * The view the content is shown to, the candidate's when the host named none.
   */
  readonly view: OutcomeView;
}

/**
 * One module's node as a hub holds it, erased as {@link TestFeatureNodes} erases it: the key of the
 * module that presents it, and the node, which only that module's `render` reads.
 */
export interface TestContent {
  readonly key: TestFeatureKey;
  readonly node: unknown;
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
   * Render the module's node as one element, given the emit state and the kit, whose `files` and
   * `instance` a stylesheet module reads. Issue `m5-06` fills the test-level stylesheet module's.
   *
   * @param node The module's node.
   * @param state The emit state.
   * @param kit The render kit.
   * @returns The element, or the first refusal of a part swap.
   */
  // oxlint-disable-next-line typescript/method-signature-style -- A method signature is bivariant in `node`, so a stub, `TestFeatureModule<K, never>`, stays assignable to the `TestFeatureModule<TestFeatureKey, unknown>` every hub's table holds; a property signature is contravariant and refuses it.
  render(
    node: N,
    state: EmitState,
    kit: TestContentRenderKit,
  ): Result.Result<Element, PartSwapRefused>;
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
 * declaration's key as the element's mark and reads no node, the three hooks with no effect, and a
 * `render` that throws {@link TestFeatureNotImplemented}, which is unreachable since the module
 * reads no node to render. A test that holds the feature is marked and delivered as it was before
 * the module existed.
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
  render: () => {
    throw new TestFeatureNotImplemented({ feature: declared.key, issue: declared.issue });
  },
  sequence: (context) => context.places,
});
