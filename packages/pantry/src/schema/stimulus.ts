/**
 * The assessment stimulus: its root, its body and the reference an item makes to one.
 *
 * The root is thin: its identifier and title are the document's, and its tool fields are the tool
 * relations'. The arms' containments into `Node` are not written here: one `mirrors` per handle in
 * the composed schema (`#pantry/schema/qti.ts`) binds them, and the statements over these rows
 * arrive with the laws heading.
 *
 * A required attribute is a column of its arm and an optional one its own `(node, value)` relation.
 */
import { closedId, relation, str, uuid } from "@bjornpagen/grizzle";
import { StimulusRefHref, StimulusRefIdentifier } from "#pantry/schema/contracts.ts";
import { SchemaVersion } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * A `qti-assessment-stimulus` root.
 */
export const AssessmentStimulus = relation("AssessmentStimulus", { id: uuid }, ["id"]);

/**
 * A `qti-stimulus-body` element, with the schema `version` of its document: the version the
 * refusal of a 3.0.1-only attribute selects on.
 */
export const StimulusBody = relation(
  "StimulusBody",
  { id: uuid, version: closedId(SchemaVersion) },
  ["id"],
);

/**
 * A `qti-assessment-stimulus-ref` element, an item's reference to the stimulus `href` names, in
 * `document`.
 */
export const ItemStimulusRef = relation(
  "ItemStimulusRef",
  { document: uuid, href: StimulusRefHref, id: uuid, identifier: StimulusRefIdentifier },
  ["id"],
);

/**
 * A stimulus reference's `title`, when it has one.
 */
export const ItemStimulusRefTitle = relation(
  "ItemStimulusRefTitle",
  { node: uuid, value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags) },
  ["node"],
);

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
  ItemStimulusRefTitle,
  StimulusBody,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;
