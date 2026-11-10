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
 * `parse` records the mark the test model records for its element and reads no node, and its four
 * hooks have no effect, so the verdicts, the sequence and the HTML stay what they were. The hubs
 * consult the modules through the table `testFeatures` (`#plate/test-features/table.ts`) and the
 * delegations of `#plate/test-features/dispatch.ts`, each at one site:
 *
 * - The test model (`buildTest` in `#plate/model/test.ts`) dispatches each element a module names to
 *   its `parse`, and holds the nodes it reads in `Test.features`, keyed by the module's key
 *   ({@link TestFeatureNodes});
 * - The session consults `sequence` as it starts (`startTest` in `#plate/session/start.ts`), `gate`
 *   before each move (`moveTargets` in `#plate/session/navigate.ts`) and each submission (`advance`
 *   in `#plate/session/advance.ts`), and `enter` at each place a session lands on: the first place
 *   at `startTest`, and in `advance` the place each move, submission target, expiry, exit or skip
 *   lands on;
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
import type { ReaderKit } from "#plate/interactions/contract.ts";
import type { Expression } from "#plate/model/expression.ts";
import type { AttributeReaders } from "#plate/model/reader.ts";
import type { ItemRef, Test, TestPart } from "#plate/model/test.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import type { Supports } from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

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
 * The nearest structural element that encloses a module's element, by nesting: the test, a test
 * part, a section or an item ref. `identifier` is that element's `identifier` attribute as the
 * model reads it, with its outer XML whitespace removed, and the empty string when the element
 * writes none.
 *
 * A `qti-assessment-section-ref` is a mark and owns nothing, so an element under one takes the
 * owner above it. A package assembles a test with each section document in its reference's place
 * before the test is judged, so the `qti-assessment-section` a section document's root names owns
 * what it holds.
 */
export type FeatureOwner =
  | { readonly identifier: string; readonly kind: "item-ref" }
  | { readonly identifier: string; readonly kind: "part" }
  | { readonly identifier: string; readonly kind: "section" }
  | { readonly kind: "test" };

/**
 * What the test model hands a module's `parse`: the way to record its element as a mark on the
 * verdict, the way to read an expression element as the test's processing reads one, the owner of
 * the element, the element's path, the reader kit over the test document, and the attribute
 * readers bound to the build (`#plate/model/reader.ts`), so a module reads its element, its
 * expressions and the body content under it as the models read their own and never imports the
 * readers, the expression readers or the body walk.
 */
export interface TestParseContext {
  /**
   * Read an expression element as the test's outcome processing reads its own, over the test's
   * reading (`readExpression` in `#plate/model/expressions/read.ts` under the `ExpressionReading`
   * `buildTest` builds): the test's outcome declarations and its item refs' prefixed variables are
   * the names it knows, and an element the engine does not run is marked where the walk's marks
   * go, as none. A pre-condition's or a branch rule's expression is read this way, so the module
   * never imports the expression readers; `qti-pre-condition` (issue m5-05) is its first caller.
   *
   * @param element The expression element.
   * @returns The expression; none once the element was marked; or the refusal the reading gives.
   */
  readonly expression: (
    element: SourceElement,
  ) => Result.Result<Option.Option<Expression>, Refusal>;
  /**
   * Record the feature as a mark at the element's path, as the test model marks every element it
   * does not deliver.
   *
   * @param feature The feature's key, as the verdict names it.
   * @returns None, as the model then holds no node of the element.
   */
  readonly mark: (feature: string) => Result.Result<Option.Option<never>>;
  /**
   * The owner of the element being parsed: the test, a test part, a section or an item ref
   * ({@link FeatureOwner}), whichever encloses the element nearest. A module that acts on the
   * scope its element sits in reads it here and never walks the document for it. The modules of
   * gate unit W0-BE, which branch on a test's structure, are the first to read it.
   */
  readonly owner: FeatureOwner;
  /**
   * The element path of the element being parsed.
   */
  readonly path: string;
  /**
   * The reader kit over the test document: the attribute readers beside `nodes`, the body walk
   * that reads an element's children as body nodes, as an item-placed content module reads its own
   * (`ItemParseContext.read` in `#plate/content/contract.ts`). Issues m3e-01b, which reads a
   * section's and the test's rubric blocks, and m5-04, which reads test feedback, are the first
   * modules to read a body through it.
   *
   * The kit is a fresh build of the test document by the item model (`parseContextOf` in
   * `#plate/model/item.ts`), made when `parse` first reads `read`, so its paths are the document's
   * own and its `names` are the identifiers the document root declares, a test's outcome and
   * context declarations among them, with the built-in variables. It is valid while `parse` runs:
   * the features the walk records through it, a notice for each `qti-*` element it does not read
   * and the marks it places on a body element, are carried into the test's marks when `parse`
   * returns, as the item model places them: once per feature and path, with `shown` as the walk
   * gave it, after the marks the module recorded through `mark`, and not again for one the module
   * recorded itself at the same path.
   *
   * A `qti-printed-variable` in a body is read as the walk reads one in an item body: a node that
   * holds the `identifier` as written, with outer XML whitespace removed, its `base` and `index`
   * as a number or a variable's name by their lexical form, and its `format`, `field`,
   * `delimiter` and `mapping-indicator` as `xs:normalizedString`s. The walk resolves no value and
   * checks no name against `names`, which the item model's processing readers consult and its
   * body walk does not, so the node is the same whether `identifier` names a test outcome or
   * names nothing; what the page prints is for the code that presents the test to decide.
   */
  readonly read: ReaderKit;
  /**
   * The attribute readers, bound to the build. Kept beside `read`, whose kit holds the same
   * readers over the fresh build, for the modules that already read their element through it.
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
 * session as it stands, the test, the time of the request where the hub has one (`advance` and
 * `move` have it; `moveTargets`, which decides the moves a session allows now, has none), the
 * test's items where the hub has them, and the candidate's supports where the host passed them.
 */
export interface GateContext {
  readonly intent: Intent;
  /**
   * The test's accepted items, keyed by item ref identifier, as `startTest` took them: some from
   * `advance`, whose moves and submissions hold them; none from `allowedIntents` and `moveTargets`,
   * which decide what a session allows now without them, unless their caller passed the items.
   * A module that evaluates an expression over the items' records reads them through here.
   */
  readonly items: Option.Option<ReadonlyMap<string, Accepted>>;
  readonly now: Option.Option<Date>;
  readonly session: TestSession;
  /**
   * The candidate's supports (`Supports`, read from a PNP by `readPnp`), as the host passed them
   * to the hub that asked: absent when the host passed none, which a module reads as `noSupports`.
   * `qti-time-limits` (issue m4-03) reads `additionalTestingTime` here (A-6), so a candidate's
   * additional time reaches the gate through the one place a session function already hands the
   * modules its inputs. Only `gate` is handed it, never `enter`.
   */
  readonly supports?: Supports | undefined;
  readonly test: Test;
}

/**
 * What the session hands a module's `enter` as a place is about to be presented: the session as it
 * stands, with the place's item not yet presented, the test, the test's items, the time of the
 * transition, and the sequence index of the place. There is no intent: the hub asks the same way
 * whatever brought the session to the place.
 */
export type EnterContext = Omit<GateContext, "intent" | "supports"> & {
  /**
   * The sequence index, counted from 1, of the place the session is about to present.
   */
  readonly sequenceIndex: number;
};

/**
 * What a module's `enter` says of a place: `skip`, that the place is passed over, so its item is
 * never presented, its record untouched, and the session goes on to the place after it in the
 * part (its end when none follows); or `exit`, that the session leaves a scope from here, as an
 * `exit` {@link GateVerdict} leaves it, without submitting or locking anything, and enters what
 * follows the scope. None lets the place be entered.
 */
export type EnterVerdict =
  | { readonly kind: "skip" }
  | { readonly kind: "exit"; readonly scope: TimedScope };

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
 * words; `target`, the sequence index the intent reaches in place of the one the part's modes
 * give (a branch rule's target), which a move takes as its destination and a `submit-item` goes
 * to once the item is submitted; `expire`, that the time of a scope the intent falls in has run
 * out; or `exit`, that the session leaves a scope. None lets the intent through to the modes'
 * rules.
 *
 * An `expire` answers any intent, a move included, and the session hub (`expireScope` in
 * `#plate/session/advance.ts`, over the scope `#plate/session/expire.ts` reads) carries it out in
 * place of the intent:
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
 *
 * An `exit` also answers any intent, and the session hub (`exitScope` in
 * `#plate/session/advance.ts`, over the same scope reading) leaves the scope as an expiry leaves
 * it, and nothing else: no item is submitted, processed or locked, every item of the scope keeps
 * what it holds, and `expired` is not written. An exit answering a move replaces the move, after
 * the step is saved; one answering a submission follows it: the item or the part is submitted
 * first, then the scope is left. The position moves to the first item after the scope in its part;
 * where none follows, an individual part ends and a simultaneous one keeps its position; a part's
 * exit ends the part, and the test's ends every part and closes the test. The place the exit lands
 * on is then entered through `enter`. `qti-pre-condition` (issue m5-05) is the first module to
 * answer `exit`, and the first to answer a `submit-item` with `target`.
 */
export type GateVerdict =
  | { readonly detail: string; readonly kind: "refuse"; readonly rule: string }
  | { readonly kind: "exit"; readonly scope: TimedScope }
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
   * Say what the feature does with a place the session is about to present: none for a feature
   * that lets every place be entered.
   *
   * The hubs ask in one order, the same in every part. At `startTest`, the first place of the
   * sequence is asked for before it is presented; in `advance`, once the intent's transition, the
   * expiry or the exit it answered has run, the place it landed on is asked for, with the session
   * as it stands except that the place's item is not yet presented. A `skip` or an `exit` moves
   * the session on without presenting that item, and the place landed on next is asked for in
   * turn, until a place is entered (every module answers none) or the test closes. An item a
   * module skipped is never presented and its record stays fresh. `qti-pre-condition` (issue
   * m5-05) is the first module to answer; it decides what a pre-condition means in each navigation
   * mode, which this hub does not.
   */
  readonly enter: (context: EnterContext) => Option.Option<EnterVerdict>;
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
 * declaration's key as the element's mark and reads no node, and the four hooks with no effect,
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
  enter: () => Option.none(),
  gate: () => Option.none(),
  implemented: false,
  parse: (_element, context) => context.mark(declared.key),
  sequence: (context) => context.places,
});
