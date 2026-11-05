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
import {
  capacity,
  closedId,
  contained,
  key,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import * as attributes from "#pantry/schema/attributes.ts";
import { StimulusRefHref, StimulusRefIdentifier } from "#pantry/schema/contracts.ts";
import { HtmlId } from "#pantry/schema/document.ts";
import { Edge, Node, SchemaVersion } from "#pantry/schema/node.ts";
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

const {
  AttributeAdmission: _admission,
  AttributeIdref: _idref,
  HeadersTarget: _headers,
  ...nodeKeyed
} = attributes.relations;

/**
 * The relations whose rows are attributes any element can carry, read as the `shared` homes read
 * them (`attribute-homes.ts`): the node-keyed families of `attributes.ts`, which are the `Node`
 * families and each ARIA relation, and `HtmlId`. Each carries the `kind` of its node.
 */
const sharedAttributes = [...Object.values(nodeKeyed), HtmlId] as const;

/**
 * The statements over this module's relations. A reference's identifier is its own among the
 * document's references (S-R15), its title belongs to it, and it sits on a node of its document's
 * tree. A stimulus has exactly one body, and the body's version is its node's. The 3.0.0 body has
 * no attribute: the `qti-stimulus-body` of that version admits none of the shared attributes, and
 * 3.0.1 adds the `BaseSequence` set.
 */
export const rules = [
  key(ItemStimulusRef, ["document", "identifier"]),
  contained(on(ItemStimulusRefTitle, "node"), on(ItemStimulusRef, "id")),
  contained(on(ItemStimulusRef, "id", "document"), on(Node, "id", "tree")),
  capacity(on(AssessmentStimulus, "id"), {
    from: on(
      select(Edge, { childKind: "qti-stimulus-body", parentKind: "qti-assessment-stimulus" }),
      "parent",
    ),
    within: within(1n, 1n),
  }),
  contained(on(StimulusBody, "id", "version"), on(Node, "id", "version")),
  ...sharedAttributes.map((family) =>
    capacity(on(select(StimulusBody, { version: "3.0.0" }), "id"), {
      from: on(select(family, { kind: "qti-stimulus-body" }), "node"),
      within: within(0n, 0n),
    }),
  ),
];
