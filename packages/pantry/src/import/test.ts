/**
 * The test and section documents' rows: the document itself and its root, the test's tool and
 * outcome declaration rows, the structure (test, part, section, section ref and item ref arms, the
 * identifiers they hold within the document, their children and the required ones among them), the
 * control elements (selection, ordering, adaptive selection and its references, item session
 * control and time limits), the rule elements (pre-conditions, branch rules and weights), the test
 * rubric and test feedback, and the shared attribute, HTML, include and content rows of the tree.
 *
 * The expressions under a rule, the variable mappings and template defaults, the test's processing
 * and every row that spans documents are not written here.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { attributeRows } from "#pantry/import/attributes.ts";
import { contentRows } from "#pantry/import/content.ts";
import { htmlRows } from "#pantry/import/html.ts";
import { includeRows } from "#pantry/import/include.ts";
import { toolRows } from "#pantry/import/tool.ts";
import { attributeReader, markers } from "#pantry/import/interactions.ts";
import type { AttributeReader, MarkerRelation } from "#pantry/import/interactions.ts";
import { judgedLater } from "#pantry/import/judged.ts";
import { documentLangRows, semanticRows } from "#pantry/import/item.ts";
import type { ItemInput } from "#pantry/import/item.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import {
  closedOf,
  ItemRefusal,
  kindOf,
  Rows,
  spelledInteger,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
  withParents,
} from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import { collapse } from "#pantry/import/whitespace.ts";
import {
  BranchExit,
  NavigationMode,
  ShowHide,
  SubmissionMode,
  TestFeedbackAccess,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import type { StructureHolder, XsBooleanHandle } from "#pantry/schema/content/rosters.ts";
import {
  AdaptiveRefHref,
  AdaptiveRefIdentifier,
  CategoryList,
  ItemRefHref,
  ManifestIdentifier,
  PackagePath,
  SectionRefHref,
  ShowHideIdentifier,
  TestStructureIdentifier,
  TimeLimitSeconds,
  VariableReference,
  WeightReference,
  WeightValue,
} from "#pantry/schema/contracts.ts";
import type { BaseType, TypedCardinality } from "#pantry/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { FeedbackOutcomeRef } from "#pantry/schema/feedback.ts";
import { Edge } from "#pantry/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";
import {
  TestFeedback,
  TestFeedbackContentBody,
  TestFeedbackTitle,
  TestRubricBlock,
  TestRubricBlockUse,
  TestRubricContentBody,
} from "#pantry/schema/test/content.ts";
import {
  AdaptiveEngineRef,
  AdaptiveSelection,
  AdaptiveSettingsRef,
  DeclaredAllowComment,
  DeclaredAllowLateSubmission,
  DeclaredAllowReview,
  DeclaredAllowSkipping,
  DeclaredOrderingShuffle,
  DeclaredShowFeedback,
  DeclaredShowSolution,
  DeclaredValidateResponses,
  DeclaredWithReplacement,
  ItemSessionControl,
  ItemSessionMaxAttempts,
  MetadataRef,
  Ordering,
  Selection,
  SelectionBounded,
  TimeLimitMax,
  TimeLimitMin,
  TimeLimits,
  UsageDataRef,
} from "#pantry/schema/test/control.ts";
import {
  BranchRule,
  BranchRuleExit,
  BranchRuleTarget,
  PreCondition,
  Weight,
} from "#pantry/schema/test/rules.ts";
import {
  AssessmentSection,
  AssessmentTest,
  DeclaredItemRefFixed,
  DeclaredItemRefRequired,
  DeclaredSectionFixed,
  DeclaredSectionKeepTogether,
  DeclaredSectionRequired,
  ItemRef,
  ItemRefCategory,
  RequiredChild,
  SectionRef,
  StructureChild,
  TestIdentifier,
  TestPart,
  TestPartTitle,
} from "#pantry/schema/test/structure.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

type HolderHandle = (typeof StructureHolder.handles)[number];

type BaseTypeHandle = (typeof BaseType.handles)[number];

type CardinalityHandle = (typeof TypedCardinality.handles)[number];

/**
 * The type a test's outcome declaration gives its variable, which a test feedback's reference
 * copies.
 */
interface TypedOutcome {
  readonly baseType: BaseTypeHandle;
  readonly cardinality: CardinalityHandle;
}

/**
 * What a builder of one element needs beside the element: the rows so far, its node, the node it
 * sits under and the document, and the outcomes the document declares by identifier, `None` for a
 * section document, which declares nothing and so binds no reference to a declaration.
 */
interface Site {
  readonly documentId: Uuid;
  readonly element: Element;
  readonly node: IndexedNode;
  readonly outcomes: Option.Option<ReadonlyMap<string, TypedOutcome>>;
  readonly parent: Option.Option<IndexedNode>;
  readonly rows: Rows;
}

/**
 * The holder kind each identifier-holding structure kind has.
 */
const holders: Readonly<Partial<Record<NodeKindHandle, HolderHandle>>> = {
  "qti-assessment-item-ref": "itemRef",
  "qti-assessment-section": "section",
  "qti-assessment-section-ref": "sectionRef",
  "qti-test-part": "part",
};

/**
 * The kinds that count as a child of a structure parent: every section part of a section (an
 * `xi:include` counts as one) and every section or section ref of a part.
 */
const childKinds: Readonly<Partial<Record<NodeKindHandle, ReadonlySet<NodeKindHandle>>>> = {
  "qti-assessment-section": new Set<NodeKindHandle>([
    "qti-assessment-item-ref",
    "qti-assessment-section",
    "qti-assessment-section-ref",
    "xi:include",
  ]),
  "qti-test-part": new Set<NodeKindHandle>([
    "qti-assessment-section",
    "qti-assessment-section-ref",
  ]),
};

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * A boolean attribute: the handle of `XsBoolean` it spells, the schema's default when the source
 * does not write it.
 */
const booleanOf = (
  attributes: AttributeReader,
  name: AttributeNameHandle,
  fallback: XsBooleanHandle,
  where: string,
): Effect.Effect<XsBooleanHandle, ImportRefused> =>
  closedOf(
    XsBoolean.handles,
    Option.getOrElse(attributes.read(name), () => fallback),
    "attribute-lexical",
    `the ${name} attribute of ${where}`,
  );

/**
 * Whether a boolean handle spells true.
 */
const isTrue = (handle: XsBooleanHandle): boolean => handle === "true" || handle === "1";

/**
 * The rows that say `node` is a counted child of its parent: its `StructureChild` row when the
 * parent is a part or section the node's kind counts under, and its `RequiredChild` row beside it
 * when the node is required.
 */
const childRows = (
  rows: Rows,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
  required: Option.Option<XsBooleanHandle>,
): Rows => {
  if (Option.isNone(parent) || childKinds[parent.value.kind]?.has(node.kind) !== true) {
    return rows;
  }

  const counted = Rows.add(rows, StructureChild, [
    { child: node.id, childKind: node.kind, parent: parent.value.id },
  ]);

  return Rows.add(
    counted,
    RequiredChild,
    written(required.pipe(Option.filter(isTrue)), (handle) => ({
      child: node.id,
      parent: parent.value.id,
      required: handle,
    })),
  );
};

/**
 * The `TestIdentifier` row of a part, section, section ref or item ref: its identifier within the
 * document that declares it.
 */
const identifierRow = (rows: Rows, node: IndexedNode, identifier: string, documentId: Uuid): Rows =>
  Rows.add(
    rows,
    TestIdentifier,
    written(Option.fromNullishOr(holders[node.kind]), (holderKind) => ({
      holder: node.id,
      holderKind,
      identifier: TestStructureIdentifier(identifier),
      scope: documentId,
    })),
  );

const requiredMarkers = { required: DeclaredSectionRequired } satisfies Record<
  string,
  MarkerRelation
>;

/**
 * The rows of one `qti-test-part`: its arm, its title when written, and its identifier.
 */
const partRows = Effect.fn("import.test.partRows")(function* partRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const navigation = yield* requiredAttribute(
    element,
    "navigation-mode",
    attributes.read("navigation-mode"),
  );
  const submission = yield* requiredAttribute(
    element,
    "submission-mode",
    attributes.read("submission-mode"),
  );
  const title = attributes.read("title");
  const navigationMode = yield* closedOf(
    NavigationMode.handles,
    navigation,
    "attribute-lexical",
    "the navigation-mode attribute of qti-test-part",
  );
  const submissionMode = yield* closedOf(
    SubmissionMode.handles,
    submission,
    "attribute-lexical",
    "the submission-mode attribute of qti-test-part",
  );

  let built = attributes.rows();
  built = Rows.add(built, TestPart, [
    {
      document: documentId,
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      navigationMode,
      submissionMode,
    },
  ]);
  built = Rows.add(
    built,
    TestPartTitle,
    written(title, (value) => ({ node: node.id, value })),
  );

  return identifierRow(built, node, identifier, documentId);
});

/**
 * What a section's builder hands on: the rows, and the identifier and title the section wrote,
 * which a section document's root repeats.
 */
interface SectionBuilt {
  readonly identifier: string;
  readonly rows: Rows;
  readonly title: string;
}

/**
 * The rows of one `qti-assessment-section`: its arm with the markers of the booleans it wrote, its
 * identifier and its place among the children of its parent.
 */
const sectionRows = Effect.fn("import.test.sectionRows")(function* sectionRows(
  site: Site,
): Effect.fn.Return<SectionBuilt, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const title = yield* requiredAttribute(element, "title", attributes.read("title"));
  const visibleText = yield* requiredAttribute(element, "visible", attributes.read("visible"));
  const visible = yield* closedOf(
    XsBoolean.handles,
    visibleText,
    "attribute-lexical",
    "the visible attribute of qti-assessment-section",
  );
  const required = yield* booleanOf(attributes, "required", "false", "qti-assessment-section");
  const fixed = yield* booleanOf(attributes, "fixed", "false", "qti-assessment-section");
  const keepTogether = yield* booleanOf(
    attributes,
    "keep-together",
    "true",
    "qti-assessment-section",
  );

  let built = attributes.rows();
  built = Rows.add(built, AssessmentSection, [
    {
      document: documentId,
      fixed,
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      keepTogether,
      required,
      title,
      visible,
    },
  ]);
  built = markers(
    built,
    {
      ...requiredMarkers,
      fixed: DeclaredSectionFixed,
      "keep-together": DeclaredSectionKeepTogether,
    },
    node.id,
    attributes.written(),
  );
  built = identifierRow(built, node, identifier, documentId);

  return {
    identifier,
    rows: childRows(built, node, site.parent, Option.some(required)),
    title,
  };
});

/**
 * The rows of one `qti-assessment-section-ref`.
 */
const sectionRefRows = Effect.fn("import.test.sectionRefRows")(function* sectionRefRows(
  site: Site,
): Effect.fn.Return<Rows, ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));

  let built = attributes.rows();
  built = Rows.add(built, SectionRef, [
    {
      document: documentId,
      href: SectionRefHref(href),
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
    },
  ]);
  built = identifierRow(built, node, identifier, documentId);

  return childRows(built, node, site.parent, Option.none());
});

/**
 * The rows of one `qti-assessment-item-ref`: its arm with the markers of the booleans it wrote, its
 * category when written, its identifier and its place among the children of its parent.
 */
const itemRefRows = Effect.fn("import.test.itemRefRows")(function* itemRefRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));
  const required = yield* booleanOf(attributes, "required", "false", "qti-assessment-item-ref");
  const fixed = yield* booleanOf(attributes, "fixed", "false", "qti-assessment-item-ref");
  const category = attributes.read("category");

  let built = attributes.rows();
  built = Rows.add(built, ItemRef, [
    {
      document: documentId,
      fixed,
      href: ItemRefHref(href),
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      required,
    },
  ]);
  built = markers(
    built,
    { fixed: DeclaredItemRefFixed, required: DeclaredItemRefRequired },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    ItemRefCategory,
    written(category, (value) => ({ node: node.id, value: CategoryList(value) })),
  );
  built = identifierRow(built, node, identifier, documentId);

  return childRows(built, node, site.parent, Option.some(required));
});

/**
 * The rows of one `qti-selection`: the selection under its section, the marker of a written
 * `with-replacement`, the spelling of a non-canonical `select`, and, for a selection without
 * replacement, its copy on the section.
 */
const selectionRows = Effect.fn("import.test.selectionRows")(function* selectionRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const selectText = yield* requiredAttribute(element, "select", attributes.read("select"));
  const withReplacement = yield* booleanOf(
    attributes,
    "with-replacement",
    "false",
    "qti-selection",
  );
  const select = yield* spelledInteger(
    attributes.rows(),
    node.id,
    node.kind,
    "select",
    selectText,
    "integer",
    "attribute-lexical",
    "the select attribute of qti-selection",
  );
  const section = Option.match(site.parent, {
    onNone: () => node.id,
    onSome: (parent) => parent.id,
  });

  let built = Rows.add(select.rows, Selection, [
    { id: node.id, section, select: select.value, withReplacement },
  ]);
  built = markers(
    built,
    { "with-replacement": DeclaredWithReplacement },
    node.id,
    attributes.written(),
  );

  return Rows.add(
    built,
    SelectionBounded,
    isTrue(withReplacement) ? [] : [{ section, select: select.value, withReplacement }],
  );
});

/**
 * The rows of one `qti-ordering`.
 */
const orderingRows = Effect.fn("import.test.orderingRows")(function* orderingRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = attributeReader(site.rows, site.element, site.node);
  const shuffle = yield* booleanOf(attributes, "shuffle", "false", "qti-ordering");

  return markers(
    Rows.add(attributes.rows(), Ordering, [{ id: site.node.id, shuffle }]),
    { shuffle: DeclaredOrderingShuffle },
    site.node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-adaptive-selection`, which carries no attribute.
 */
const adaptiveSelectionRows = (site: Site): Rows =>
  Rows.add(site.rows, AdaptiveSelection, [{ id: site.node.id }]);

/**
 * The relations of the four adaptive references, which hold the same two required attributes.
 */
const referenceArms = {
  "qti-adaptive-engine-ref": AdaptiveEngineRef,
  "qti-adaptive-settings-ref": AdaptiveSettingsRef,
  "qti-metadata-ref": MetadataRef,
  "qti-usagedata-ref": UsageDataRef,
} as const;

/**
 * The rows of one adaptive reference: its `identifier` and `href`, both required.
 */
const referenceRows = Effect.fn("import.test.referenceRows")(function* referenceRows(
  site: Site,
  arm: (typeof referenceArms)[keyof typeof referenceArms],
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = attributeReader(site.rows, site.element, site.node);
  const identifier = yield* requiredAttribute(
    site.element,
    "identifier",
    attributes.read("identifier"),
  );
  const href = yield* requiredAttribute(site.element, "href", attributes.read("href"));

  return Rows.add(attributes.rows(), arm, [
    {
      href: AdaptiveRefHref(href),
      id: site.node.id,
      identifier: AdaptiveRefIdentifier(identifier),
    },
  ]);
});

/**
 * The rows of one `qti-item-session-control`: the six booleans with the markers of those the source
 * wrote, and `max-attempts` with its spelling when it has one.
 */
const sessionControlRows = Effect.fn("import.test.sessionControlRows")(function* sessionControlRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const { element, node } = site;
  const kind = "qti-item-session-control";
  const attributes = attributeReader(site.rows, element, node);
  const maxAttempts = attributes.read("max-attempts");
  const showFeedback = yield* booleanOf(attributes, "show-feedback", "false", kind);
  const allowReview = yield* booleanOf(attributes, "allow-review", "true", kind);
  const showSolution = yield* booleanOf(attributes, "show-solution", "false", kind);
  const allowComment = yield* booleanOf(attributes, "allow-comment", "false", kind);
  const allowSkipping = yield* booleanOf(attributes, "allow-skipping", "true", kind);
  const validateResponses = yield* booleanOf(attributes, "validate-responses", "false", kind);
  const attempts = yield* Option.match(maxAttempts, {
    onNone: () => Effect.succeed({ rows: attributes.rows(), value: Option.none<bigint>() }),
    onSome: (text) =>
      spelledInteger(
        attributes.rows(),
        node.id,
        node.kind,
        "max-attempts",
        text,
        "integer",
        "attribute-lexical",
        "the max-attempts attribute of qti-item-session-control",
      ).pipe(Effect.map((spelled) => ({ rows: spelled.rows, value: Option.some(spelled.value) }))),
  });

  let built = Rows.add(attempts.rows, ItemSessionControl, [
    {
      allowComment,
      allowReview,
      allowSkipping,
      id: node.id,
      showFeedback,
      showSolution,
      validateResponses,
    },
  ]);
  built = markers(
    built,
    {
      "allow-comment": DeclaredAllowComment,
      "allow-review": DeclaredAllowReview,
      "allow-skipping": DeclaredAllowSkipping,
      "show-feedback": DeclaredShowFeedback,
      "show-solution": DeclaredShowSolution,
      "validate-responses": DeclaredValidateResponses,
    },
    node.id,
    attributes.written(),
  );

  return Rows.add(
    built,
    ItemSessionMaxAttempts,
    written(attempts.value, (value) => ({ node: node.id, value })),
  );
});

/**
 * The rows of one `qti-time-limits`: `allow-late-submission` with its marker, and `min-time` and
 * `max-time` as written when they are.
 */
const timeLimitsRows = Effect.fn("import.test.timeLimitsRows")(function* timeLimitsRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const { node } = site;
  const attributes = attributeReader(site.rows, site.element, node);
  const minTime = attributes.read("min-time");
  const maxTime = attributes.read("max-time");
  const allowLateSubmission = yield* booleanOf(
    attributes,
    "allow-late-submission",
    "false",
    "qti-time-limits",
  );

  let built = Rows.add(attributes.rows(), TimeLimits, [{ allowLateSubmission, id: node.id }]);
  built = markers(
    built,
    { "allow-late-submission": DeclaredAllowLateSubmission },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    TimeLimitMin,
    written(minTime, (value) => ({ node: node.id, value: TimeLimitSeconds(value) })),
  );

  return Rows.add(
    built,
    TimeLimitMax,
    written(maxTime, (value) => ({ node: node.id, value: TimeLimitSeconds(value) })),
  );
});

/**
 * The rows of one `qti-pre-condition`, which holds nothing but its expression.
 */
const preConditionRows = (site: Site): Rows =>
  Rows.add(site.rows, PreCondition, [{ id: site.node.id }]);

/**
 * The rows of one `qti-weight`: the identifier it names and its value as written, owned by the item
 * reference it sits under. A weight under any other parent has no row; the admission of its kind
 * refuses it.
 */
const weightRows = Effect.fn("import.test.weightRows")(function* weightRows(
  site: Site,
): Effect.fn.Return<Rows, ItemRefusal> {
  const { element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const value = yield* requiredAttribute(element, "value", attributes.read("value"));
  const owner = site.parent.pipe(
    Option.filter((above) => above.kind === "qti-assessment-item-ref"),
  );

  return Rows.add(
    attributes.rows(),
    Weight,
    written(owner, (above) => ({
      id: node.id,
      identifier: WeightReference(identifier),
      itemRef: above.id,
      value: WeightValue(value),
    })),
  );
});

/**
 * The rows of one test `qti-rubric-block`: its `view` as the list it wrote, and its `use` collapsed
 * with the lexical form kept when it wrote one.
 */
const rubricRows = Effect.fn("import.test.rubricRows")(function* rubricRows(
  site: Site,
): Effect.fn.Return<Rows, ItemRefusal> {
  const { element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const view = yield* requiredAttribute(element, "view", attributes.read("view"));
  const use = attributes.read("use");
  const read = attributes.rows();
  const collapsed = Option.match(use, {
    onNone: () => ({ rows: read, value: Option.none<string>() }),
    onSome: (text) => {
      const typed = typedAttribute(read, node.id, node.kind, "use", text, "collapse");

      return { rows: typed.rows, value: Option.some(typed.value) };
    },
  });

  return Rows.add(
    Rows.add(collapsed.rows, TestRubricBlock, [{ id: node.id, view: judgedLater(view) }]),
    TestRubricBlockUse,
    written(collapsed.value, (value) => ({ node: node.id, value: judgedLater(value) })),
  );
});

/**
 * The refusal of a test feedback that names an outcome the test does not declare with a base type
 * and a cardinality, since no type can be copied into its reference.
 */
const undeclaredOutcome = (identifier: string): ItemRefusal =>
  new ItemRefusal({
    detail: `The qti-test-feedback names the outcome "${identifier}" in its outcome-identifier, which no qti-outcome-declaration of this test declares with a base-type and a cardinality. Declare it, or correct the outcome-identifier.`,
    rule: "binding-declared",
  });

/**
 * The rows of one `qti-test-feedback`: the arm with its required attributes, its title when
 * written, and, in a test document, its reference to the test's outcome. A section document
 * declares nothing, so it writes no reference.
 */
const feedbackRows = Effect.fn("import.test.feedbackRows")(function* feedbackRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const outcome = yield* requiredAttribute(
    element,
    "outcome-identifier",
    attributes.read("outcome-identifier"),
  );
  const access = yield* closedOf(
    TestFeedbackAccess.handles,
    yield* requiredAttribute(element, "access", attributes.read("access")),
    "attribute-lexical",
    "the access attribute of qti-test-feedback",
  );
  const showHide = yield* closedOf(
    ShowHide.handles,
    yield* requiredAttribute(element, "show-hide", attributes.read("show-hide")),
    "attribute-lexical",
    "the show-hide attribute of qti-test-feedback",
  );
  const title = attributes.read("title");

  let built = Rows.add(attributes.rows(), TestFeedback, [
    {
      access,
      id: node.id,
      identifier: ShowHideIdentifier(identifier),
      outcomeIdentifier: VariableReference(outcome),
      showHide,
    },
  ]);
  built = Rows.add(
    built,
    TestFeedbackTitle,
    written(title, (value) => ({ node: node.id, value: judgedLater(value) })),
  );
  if (Option.isNone(site.outcomes)) {
    return built;
  }

  const declared = site.outcomes.value.get(outcome);
  if (declared === undefined) {
    return yield* undeclaredOutcome(outcome);
  }

  return Rows.add(built, FeedbackOutcomeRef, [
    {
      baseType: declared.baseType,
      cardinality: declared.cardinality,
      document: documentId,
      identifier: outcome,
      node: node.id,
    },
  ]);
});

/**
 * The thin arm row of a content body, which carries no attribute of its own.
 */
const bodyRows =
  (arm: typeof TestRubricContentBody | typeof TestFeedbackContentBody) =>
  (site: Site): Rows =>
    Rows.add(site.rows, arm, [{ id: site.node.id }]);

/**
 * The builder of each kind that is not the document's root, which write the rows of one element.
 */
const builders: ReadonlyMap<
  NodeKindHandle,
  (site: Site) => Effect.Effect<Rows, ImportRefused | ItemRefusal>
> = new Map<NodeKindHandle, (site: Site) => Effect.Effect<Rows, ImportRefused | ItemRefusal>>([
  [
    "qti-adaptive-engine-ref",
    (site) => referenceRows(site, referenceArms["qti-adaptive-engine-ref"]),
  ],
  ["qti-adaptive-selection", (site) => Effect.succeed(adaptiveSelectionRows(site))],
  [
    "qti-adaptive-settings-ref",
    (site) => referenceRows(site, referenceArms["qti-adaptive-settings-ref"]),
  ],
  ["qti-assessment-item-ref", itemRefRows],
  ["qti-assessment-section", (site) => Effect.map(sectionRows(site), (built) => built.rows)],
  ["qti-assessment-section-ref", sectionRefRows],
  [
    "qti-content-body.testFeedback",
    (site) => Effect.succeed(bodyRows(TestFeedbackContentBody)(site)),
  ],
  ["qti-content-body.testRubric", (site) => Effect.succeed(bodyRows(TestRubricContentBody)(site))],
  ["qti-item-session-control", sessionControlRows],
  ["qti-metadata-ref", (site) => referenceRows(site, referenceArms["qti-metadata-ref"])],
  ["qti-ordering", orderingRows],
  ["qti-pre-condition", (site) => Effect.succeed(preConditionRows(site))],
  ["qti-rubric-block.test", rubricRows],
  ["qti-selection", selectionRows],
  ["qti-test-feedback", feedbackRows],
  ["qti-test-part", partRows],
  ["qti-time-limits", timeLimitsRows],
  ["qti-usagedata-ref", (site) => referenceRows(site, referenceArms["qti-usagedata-ref"])],
  ["qti-weight", weightRows],
]);

/**
 * The structure, control, rule and content rows of every element of the tree under the root, in
 * document order, except the branch rules'. The `xi:include` of a section keeps its
 * `StructureChild` row here; its arm and attributes come from `includeRows`.
 */
const elementRows = Effect.fn("import.test.elementRows")(function* elementRows(
  rows: Rows,
  root: Element,
  nodes: NodeIndex,
  documentId: Uuid,
  outcomes: Option.Option<ReadonlyMap<string, TypedOutcome>>,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined || element === root) {
      continue;
    }

    const builder = builders.get(node.kind);
    if (builder !== undefined) {
      built = yield* builder({
        documentId,
        element,
        node,
        outcomes,
        parent: parentNode,
        rows: built,
      });
    } else if (node.kind === "xi:include") {
      built = childRows(built, node, parentNode, Option.none());
    }
  }

  return built;
});

/**
 * The rows of every `qti-branch-rule` of the tree: the rule with the node that holds it, and its
 * target as an exit when it is spelled exactly as one of the three reserved values and as an
 * identifier of the document otherwise.
 *
 * An identifier target takes the holder kind the document's own `TestIdentifier` row gives that
 * identifier, so the containment into `TestIdentifier.(scope, identifier, holderKind)` and the
 * check that only a test-part rule targets a part judge it at commit. A target no structure of the
 * document declares takes its owner's kind, which satisfies the check and leaves the containment to
 * refuse it. A rule under a parent that holds none (a part, section or item reference) has no row;
 * the admission of its kind refuses it.
 *
 * It runs after the structure rows, because a rule precedes the structure it targets.
 */
const branchRuleRows = Effect.fn("import.test.branchRuleRows")(function* branchRuleRows(
  rows: Rows,
  root: Element,
  nodes: NodeIndex,
  documentId: Uuid,
): Effect.fn.Return<Rows, ItemRefusal> {
  const holderOf = new Map<string, HolderHandle>();
  for (const row of Rows.of(rows, TestIdentifier)) {
    if (row.scope === documentId && !holderOf.has(row.identifier)) {
      holderOf.set(row.identifier, row.holderKind);
    }
  }

  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    if (node?.kind !== "qti-branch-rule") {
      continue;
    }

    const attributes = attributeReader(built, element, node);
    const target = yield* requiredAttribute(element, "target", attributes.read("target"));
    built = attributes.rows();
    const owner = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    const ownerKind = Option.flatMapNullishOr(owner, (above) => holders[above.kind]);
    if (Option.isNone(owner) || Option.isNone(ownerKind)) {
      continue;
    }

    const exit = BranchExit.handles.find((handle) => handle === target);
    built = Rows.add(built, BranchRule, [
      {
        document: documentId,
        id: node.id,
        owner: owner.value.id,
        ownerKind: ownerKind.value,
        targetKind: exit === undefined ? "ref" : "exit",
      },
    ]);
    built =
      exit === undefined
        ? Rows.add(built, BranchRuleTarget, [
            {
              holderKind: holderOf.get(target) ?? ownerKind.value,
              identifier: TestStructureIdentifier(target),
              ownerKind: ownerKind.value,
              rule: node.id,
              scope: documentId,
            },
          ])
        : Rows.add(built, BranchRuleExit, [{ exit, rule: node.id }]);
  }

  return built;
});

/**
 * Write the rows of a test or section document: its tree, its `Document` row with the identifier
 * and title rows, the root and, for a test, its tool rows, then the declarations, the structure and
 * the control elements under it.
 *
 * Every attribute passes through the attribute reader with the whitespace class of its kind's
 * inventory entry: `title` replaces, the booleans, integers, lists and references collapse, the
 * modes are kept as read. A boolean the source omits takes its XSD default with no marker; one it
 * writes gets its `Declared*` marker. `select` and `max-attempts` are `xs:int`s read as integers
 * with the spelling kept when it is not canonical; the 32-bit range is the schema's statement. A
 * required attribute the source omits is refused as `required-attribute` before its row.
 *
 * The test's outcome declarations go through the declaration pass the item builder runs. The
 * attribute, HTML, include and content passes then run over the tree, the content pass with the
 * test's outcomes as its variables: a test feedback, a feedback inline and a printed variable bind
 * into them and one that names an undeclared variable is refused `binding-declared`, and the
 * content pass writes the test's context declarations. A section document declares nothing, so it
 * binds none of the three. A test's `DocumentLang` rows are written as an item's are; a section
 * has none.
 *
 * @param input - The decoded test or section and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this document's added, the node index of its tree and the document's id,
 *   which is the tree's; `UnmodeledVocabulary` for a root that is neither `qti-assessment-test` nor
 *   `qti-assessment-section`, naming it, and for any element or attribute the registries do not
 *   model; `ItemRefusal` (`required-attribute`) for a required attribute the source omits;
 *   `ImportRefused` (`attribute-lexical`) for a value outside its roster or integer space;
 *   `ItemRefusal` (`binding-declared`) for a test feedback, feedback inline or printed variable
 *   that names a variable the test does not declare.
 */
export const testRows = Effect.fn("import.testRows")(function* testRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: Uuid },
  ImportRefused | UnmodeledVocabulary | ItemRefusal
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  const rootKind = Option.getOrUndefined(kindOf(root, Option.none()));
  const kind = rootKind === "qti-assessment-test" ? "test" : "section";
  if (rootKind !== "qti-assessment-test" && rootKind !== "qti-assessment-section") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: kind, version },
    rows,
  );
  const { nodes } = tree;
  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new ItemRefusal({
      detail: "The document's root element has no node.",
      rule: "binding-declared",
    });
  }

  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: PackagePath(input.path),
      resource: ManifestIdentifier(input.resource),
      resourceType: input.resourceType,
      root: kind,
      version,
    },
  ]);
  const common = {
    document: documentId,
    package: packageId,
    resource: ManifestIdentifier(input.resource),
    root: kind,
  } as const;
  const own = {
    documentId,
    element: root,
    node: rootNode,
    outcomes: Option.none<ReadonlyMap<string, TypedOutcome>>(),
    parent: Option.none(),
    rows: built,
  };
  let identifier: Option.Option<string>;
  let title: Option.Option<string>;
  if (kind === "test") {
    const attributes = attributeReader(built, root, rootNode);
    identifier = attributes.read("identifier");
    title = attributes.read("title");
    const toolName = attributes.read("tool-name");
    const toolVersion = attributes.read("tool-version");
    built = toolRows(
      Rows.add(attributes.rows(), AssessmentTest, [{ id: rootNode.id }]),
      "test",
      documentId,
      toolName,
      toolVersion,
    );
  } else {
    const section = yield* sectionRows(own);
    built = section.rows;
    identifier = Option.some(section.identifier);
    title = Option.some(section.title);
  }

  built = Rows.add(
    built,
    DocumentIdentifier,
    written(identifier, (value) => ({ ...common, value })),
  );
  built = Rows.add(
    built,
    DocumentTitle,
    written(title, (value) => ({ ...common, collapsed: collapse(value), value })),
  );

  const walked = withParents(root, Option.none());
  if (kind === "test") {
    built = documentLangRows(built, input, documentId, walked);
  }

  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  const semantic = yield* semanticRows(
    built,
    { adaptive: "false", documentId, nodes, positions, rootId: rootNode.id },
    walked,
  );
  const outcomeIds = new Set(
    [...nodes.values()]
      .filter((entry) => entry.kind === "qti-outcome-declaration")
      .map((entry) => entry.id),
  );
  const outcomes = new Map<string, TypedOutcome>();
  for (const [name, declared] of semantic.declarations) {
    if (
      outcomeIds.has(declared.id) &&
      Option.isSome(declared.baseType) &&
      Option.isSome(declared.cardinality)
    ) {
      outcomes.set(name, {
        baseType: declared.baseType.value,
        cardinality: declared.cardinality.value,
      });
    }
  }

  built = yield* elementRows(
    semantic.rows,
    root,
    nodes,
    documentId,
    kind === "test" ? Option.some(outcomes) : Option.none(),
  );
  built = yield* branchRuleRows(built, root, nodes, documentId);
  built = yield* attributeRows(root, nodes, documentId, built);
  built = yield* htmlRows(root, nodes, built);
  built = yield* includeRows(root, nodes, built);
  built = yield* contentRows(root, nodes, documentId, kind, semantic.declarations, built);

  return { documentId, nodes, rows: built };
});
