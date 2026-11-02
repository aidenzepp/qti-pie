/**
 * Feedback: the blocks and inlines a response can show, the modal feedback an item can raise, and
 * the five content bodies that hold their markup.
 *
 * A feedback block or inline shows or hides on an outcome variable's value: its
 * `outcome-identifier` names an outcome declaration of the same document, and the reference states
 * the type the declaration holds. `qti-feedback-block` and `qti-feedback-block.template` are one
 * shape, but each handle has its own arm: a node has one kind, so an arm listed under two handles
 * admits no row. A modal feedback has one content body under it in
 * `3.0.1` and at most one in `3.0.0`; the two capacities below count those bodies from the edges
 * whose child is a modal content body, so a body is counted without a row of its own.
 */
import {
  capacity,
  check,
  closedId,
  contained,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import {
  BaseType,
  Declaration,
  TypedCardinality,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { Edge, Node, SchemaVersion } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

/**
 * A feedback's `show-hide`: `show` or `hide`.
 */
const showHide = str.regex(patterns.showHide);

/**
 * A `qti-feedback-block`: the identifier its outcome value is matched against, the outcome it reads
 * and whether a match shows or hides it. The same element inside a template content body is a
 * `TemplateFeedbackBlock`.
 */
export const FeedbackBlock = relation(
  "FeedbackBlock",
  { id: uuid, identifier: ncName, outcomeIdentifier: ncName, showHide },
  ["id"],
);

/**
 * The source wrote `show-hide` on this feedback block.
 */
export const DeclaredFeedbackBlockShowHide = relation(
  "DeclaredFeedbackBlockShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-feedback-block.template`: a feedback block inside a template block's content body, with a
 * feedback block's fields.
 */
export const TemplateFeedbackBlock = relation(
  "TemplateFeedbackBlock",
  { id: uuid, identifier: ncName, outcomeIdentifier: ncName, showHide },
  ["id"],
);

/**
 * The source wrote `show-hide` on this template feedback block.
 */
export const DeclaredTemplateFeedbackBlockShowHide = relation(
  "DeclaredTemplateFeedbackBlockShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-feedback-inline`: the same shape as a feedback block.
 */
export const FeedbackInline = relation(
  "FeedbackInline",
  { id: uuid, identifier: ncName, outcomeIdentifier: ncName, showHide },
  ["id"],
);

/**
 * The source wrote `show-hide` on this feedback inline.
 */
export const DeclaredFeedbackInlineShowHide = relation(
  "DeclaredFeedbackInlineShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-modal-feedback`. Its `show-hide` is required, so it has no marker. The version copies the
 * node's, so the capacities below can ask for the modals of one schema version.
 */
export const ModalFeedback = relation(
  "ModalFeedback",
  {
    id: uuid,
    identifier: ncName,
    outcomeIdentifier: ncName,
    showHide,
    version: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * A modal feedback's `title`, when it has one.
 */
export const ModalFeedbackTitle = relation(
  "ModalFeedbackTitle",
  { node: uuid, value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags) },
  ["node"],
);

/**
 * The outcome variable a feedback reads: one row on each feedback node. `document` and `identifier`
 * name the declaration, and the pair of them with the base type and cardinality copies the typed
 * declaration's, so a reference is to a declaration of the one document.
 */
export const FeedbackOutcomeRef = relation(
  "FeedbackOutcomeRef",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    node: uuid,
  },
  ["node"],
);

/**
 * The content body under a feedback block: a `qti-content-body` the ancestry names by the flag it
 * sits under. A content body has no attribute of its own.
 */
export const ContentBodyFeedback = relation("ContentBodyFeedback", { id: uuid }, ["id"]);

/**
 * The content body under a modal feedback.
 */
export const ContentBodyModal = relation("ContentBodyModal", { id: uuid }, ["id"]);

/**
 * The content body under a rubric block.
 */
export const ContentBodyRubric = relation("ContentBodyRubric", { id: uuid }, ["id"]);

/**
 * The content body under a template block inside a rubric block.
 */
export const ContentBodyRubricTemplate = relation("ContentBodyRubricTemplate", { id: uuid }, [
  "id",
]);

/**
 * The content body under a template block or a template feedback block.
 */
export const ContentBodyTemplate = relation("ContentBodyTemplate", { id: uuid }, ["id"]);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  ContentBodyFeedback,
  ContentBodyModal,
  ContentBodyRubric,
  ContentBodyRubricTemplate,
  ContentBodyTemplate,
  DeclaredFeedbackBlockShowHide,
  DeclaredFeedbackInlineShowHide,
  DeclaredTemplateFeedbackBlockShowHide,
  FeedbackBlock,
  FeedbackInline,
  FeedbackOutcomeRef,
  ModalFeedback,
  ModalFeedbackTitle,
  TemplateFeedbackBlock,
};

/**
 * The feedback kinds' arms, keyed by their `NodeKind` handles. Each handle has its own arm:
 * `alternatives` binds each arm row to a node of every handle that lists the arm, and a node has
 * one kind, so an arm listed under two handles admits no row.
 */
export const arms = {
  "qti-content-body.feedback": ContentBodyFeedback,
  "qti-content-body.modal": ContentBodyModal,
  "qti-content-body.rubric": ContentBodyRubric,
  "qti-content-body.rubricTemplate": ContentBodyRubricTemplate,
  "qti-content-body.template": ContentBodyTemplate,
  "qti-feedback-block": FeedbackBlock,
  "qti-feedback-block.template": TemplateFeedbackBlock,
  "qti-feedback-inline": FeedbackInline,
  "qti-modal-feedback": ModalFeedback,
};

/**
 * The statements over this module's relations: a modal feedback's version is its node's, and it
 * has exactly one modal content body in `3.0.1` and at most one in `3.0.0`; every marker and
 * optional value belongs to its owner; a feedback's outcome reference is an outcome declaration of
 * its document, with the base type and cardinality that declaration holds, on a node of that
 * document's tree, and its type is an identifier of single or multiple cardinality.
 */
export const rules = [
  contained(on(ModalFeedback, "id", "version"), on(Node, "id", "version")),
  capacity(on(select(ModalFeedback, { version: "3.0.1" }), "id"), {
    from: on(select(Edge, { childKind: "qti-content-body.modal" }), "parent"),
    within: within(1n, 1n),
  }),
  capacity(on(select(ModalFeedback, { version: "3.0.0" }), "id"), {
    from: on(select(Edge, { childKind: "qti-content-body.modal" }), "parent"),
    within: within(0n, 1n),
  }),
  contained(on(DeclaredFeedbackBlockShowHide, "node"), on(FeedbackBlock, "id")),
  contained(on(DeclaredFeedbackInlineShowHide, "node"), on(FeedbackInline, "id")),
  contained(on(DeclaredTemplateFeedbackBlockShowHide, "node"), on(TemplateFeedbackBlock, "id")),
  contained(on(ModalFeedbackTitle, "node"), on(ModalFeedback, "id")),
  contained(
    on(FeedbackOutcomeRef, "document", "identifier"),
    on(select(Declaration, { kind: "outcome" }), "document", "identifier"),
  ),
  contained(
    on(FeedbackOutcomeRef, "document", "identifier", "baseType", "cardinality"),
    on(TypedDeclaration, "document", "identifier", "baseType", "cardinality"),
  ),
  contained(on(FeedbackOutcomeRef, "node", "document"), on(Node, "id", "tree")),
  check("FeedbackOutcomeRefType", FeedbackOutcomeRef, (r) =>
    r.and(r.eq(r.baseType, "identifier"), r.in(r.cardinality, ["single", "multiple"])),
  ),
] as const;
