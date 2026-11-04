/**
 * The test's structure: the test, its parts, sections, section references and item references.
 *
 * Each arm is thin: its node only, until the schema slice of its heading widens it. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `qti-assessment-test` element.
 */
export const AssessmentTest = relation("AssessmentTest", { id: uuid }, ["id"]);

/**
 * A `qti-test-part` element.
 */
export const TestPart = relation("TestPart", { id: uuid }, ["id"]);

/**
 * A `qti-assessment-section` element.
 */
export const AssessmentSection = relation("AssessmentSection", { id: uuid }, ["id"]);

/**
 * A `qti-assessment-section-ref` element.
 */
export const SectionRef = relation("SectionRef", { id: uuid }, ["id"]);

/**
 * A `qti-assessment-item-ref` element.
 */
export const ItemRef = relation("ItemRef", { id: uuid }, ["id"]);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-assessment-item-ref": ItemRef,
  "qti-assessment-section": AssessmentSection,
  "qti-assessment-section-ref": SectionRef,
  "qti-assessment-test": AssessmentTest,
  "qti-test-part": TestPart,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
  AssessmentSection,
  AssessmentTest,
  ItemRef,
  SectionRef,
  TestPart,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
