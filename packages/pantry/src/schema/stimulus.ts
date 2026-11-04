/**
 * The assessment stimulus: its root, its body and the reference an item makes to one.
 *
 * Each arm is thin: its node only, until the schema slice of its heading widens it. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `qti-assessment-stimulus` root.
 */
export const AssessmentStimulus = relation("AssessmentStimulus", { id: uuid }, ["id"]);

/**
 * A `qti-stimulus-body` element.
 */
export const StimulusBody = relation("StimulusBody", { id: uuid }, ["id"]);

/**
 * A `qti-assessment-stimulus-ref` element, an item's reference to a stimulus.
 */
export const ItemStimulusRef = relation("ItemStimulusRef", { id: uuid }, ["id"]);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-assessment-stimulus": AssessmentStimulus,
  "qti-assessment-stimulus-ref": ItemStimulusRef,
  "qti-stimulus-body": StimulusBody,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
  AssessmentStimulus,
  ItemStimulusRef,
  StimulusBody,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
