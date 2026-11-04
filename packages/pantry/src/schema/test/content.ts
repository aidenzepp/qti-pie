/**
 * The test's content elements: the test rubric block and test feedback, and their content bodies.
 *
 * Each arm is thin: its node only, until the schema slice of its heading widens it. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `qti-rubric-block` under a test, a part or a section.
 */
export const TestRubricBlock = relation("TestRubricBlock", { id: uuid }, ["id"]);

/**
 * The `qti-content-body` of a test rubric block.
 */
export const TestRubricContentBody = relation("TestRubricContentBody", { id: uuid }, ["id"]);

/**
 * A `qti-test-feedback` element.
 */
export const TestFeedback = relation("TestFeedback", { id: uuid }, ["id"]);

/**
 * The `qti-content-body` of a test feedback.
 */
export const TestFeedbackContentBody = relation("TestFeedbackContentBody", { id: uuid }, ["id"]);

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
  TestFeedback,
  TestFeedbackContentBody,
  TestRubricBlock,
  TestRubricContentBody,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
