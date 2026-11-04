/**
 * The test's content elements: the test rubric block and test feedback, their content bodies, and
 * the per-test bindings of a section document's rubric.
 *
 * The two content bodies are thin: their node only. The arms' containments into `Node` are not
 * written here: one `mirrors` per handle in the composed schema (`#pantry/schema/qti.ts`) binds
 * them, and the statements over these rows arrive with the laws heading.
 *
 * A required attribute is a column of its arm and an optional one its own `(node, value)` relation.
 * The three `Section*` relations are the per-test twins of the feedback and printed-variable
 * bindings of `#pantry/schema/feedback.ts` and `#pantry/schema/template.ts`: a rubric in a section
 * document binds once for each test that reaches the section, so each twin adds the `test` it was
 * resolved for to its original's fields and keys.
 */
import { closedId, relation, str, uuid } from "@bjornpagen/grizzle";
import { ShowHide, TestFeedbackAccess } from "#pantry/schema/content/rosters.ts";
import { ShowHideIdentifier, VariableReference } from "#pantry/schema/contracts.ts";
import { BaseType, DeclarationKind, TypedCardinality } from "#pantry/schema/declaration.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { PrintedVariableAttr } from "#pantry/schema/template.ts";

const ncName = str.regex(patterns.ncName);

/**
 * A `qti-rubric-block` under a test, a part or a section: its required `view`, a non-empty list of
 * the roles that read it.
 */
export const TestRubricBlock = relation(
  "TestRubricBlock",
  { id: uuid, view: str.regex(patterns.viewList) },
  ["id"],
);

/**
 * A test rubric block's `use`, when it has one: unlike an item's rubric, a test's does not require
 * it.
 */
export const TestRubricBlockUse = relation(
  "TestRubricBlockUse",
  { node: uuid, value: str.regex(patterns.useEnumExt) },
  ["node"],
);

/**
 * The `qti-content-body` of a test rubric block.
 */
export const TestRubricContentBody = relation("TestRubricContentBody", { id: uuid }, ["id"]);

/**
 * A `qti-test-feedback` element: when it shows (`access`), the outcome it reads
 * (`outcomeIdentifier`), whether that value shows or hides it (`showHide`, required, with no
 * marker) and its own `identifier`, which is a value and not a key.
 */
export const TestFeedback = relation(
  "TestFeedback",
  {
    access: closedId(TestFeedbackAccess),
    id: uuid,
    identifier: ShowHideIdentifier,
    outcomeIdentifier: VariableReference,
    showHide: closedId(ShowHide),
  },
  ["id"],
);

/**
 * A test feedback's `title`, when it has one.
 */
export const TestFeedbackTitle = relation(
  "TestFeedbackTitle",
  { node: uuid, value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags) },
  ["node"],
);

/**
 * The `qti-content-body` of a test feedback.
 */
export const TestFeedbackContentBody = relation("TestFeedbackContentBody", { id: uuid }, ["id"]);

/**
 * The outcome a feedback in a section document's rubric reads, for the one `test` that reaches the
 * section: `FeedbackOutcomeRef`'s fields, keyed by the node and the test.
 */
export const SectionFeedbackOutcomeRef = relation(
  "SectionFeedbackOutcomeRef",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    node: uuid,
    test: uuid,
  },
  ["node", "test"],
);

/**
 * The variable a printed variable in a section document's rubric prints, for the one `test` that
 * reaches the section: `PrintedVariableRef`'s fields, keyed by the node and the test.
 */
export const SectionPrintedVariableRef = relation(
  "SectionPrintedVariableRef",
  {
    document: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
    node: uuid,
    test: uuid,
  },
  ["node", "test"],
);

/**
 * The variable a printed variable's `base` or `index` names in a section document's rubric, for the
 * one `test` that reaches the section: `PrintedVariableVarRef`'s fields, keyed by the node, the
 * attribute and the test.
 */
export const SectionPrintedVariableVarRef = relation(
  "SectionPrintedVariableVarRef",
  {
    attribute: closedId(PrintedVariableAttr),
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
    node: uuid,
    test: uuid,
  },
  ["node", "attribute", "test"],
);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-content-body.testFeedback": TestFeedbackContentBody,
  "qti-content-body.testRubric": TestRubricContentBody,
  "qti-rubric-block.test": TestRubricBlock,
  "qti-test-feedback": TestFeedback,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
  SectionFeedbackOutcomeRef,
  SectionPrintedVariableRef,
  SectionPrintedVariableVarRef,
  TestFeedback,
  TestFeedbackContentBody,
  TestFeedbackTitle,
  TestRubricBlock,
  TestRubricBlockUse,
  TestRubricContentBody,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
