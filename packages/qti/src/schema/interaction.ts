/**
 * The choice interaction: `qti-choice-interaction` and its `qti-simple-choice` children, each
 * attribute the source wrote marked by a row of its own, and the optional values a choice
 * interaction or choice may carry.
 *
 * A lexical column keeps an attribute as read; the typed `maxChoicesN` and `minChoicesN` are copies
 * the importer writes, defaulting to 1 and 0. Whether a marker row exists says whether the source
 * wrote the attribute, so an export omits what the source omitted.
 *
 * A simple choice's owner is carried by `Edge.(child, parent)` and by `Admission`, because a
 * `qti-simple-choice` is also valid under `qti-order-interaction` in a later phase; a containment
 * of `SimpleChoice.(interaction)` into `ChoiceInteraction.(id)` would refuse that, so none is
 * written.
 *
 * `TypedBinding.maxCount` follows one rule per interaction kind (spec 4.4): `max-choices` defaults
 * to 1 for choice, hottext, hotspot and position-object and to 0 (unlimited) for select-point;
 * `max-associations` defaults to 1 for associate, match, graphic-associate and gap-match. An
 * interaction that is always multiple (graphic-gap-match) or always ordered (order, graphic-order)
 * has `BindingFit` rows alone and no count; every other kind has no count rule and writes
 * `maxCount = 1`.
 *
 * A binding records the ancestry its node sits in and the `adaptive` of its item. Feedback
 * (`fb`-flagged ancestry) is valid only in an adaptive item, which the `AdaptiveFeedback` check
 * states over the one `fbFlagged` roster.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the declaration module names; the shape here is the typed-or-record choice, not a structure. */
import {
  alternatives,
  capacity,
  check,
  closedId,
  Compute,
  contained,
  key,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import * as declaration from "#qti/schema/declaration.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { fbFlagged } from "#qti/schema/seed/ancestry.ts";

/**
 * The `Ancestry` handles that sit inside feedback: `fbFlagged`, typed as handles of the roster.
 */
const feedbackAncestries = node.Ancestry.handles.filter((handle) => fbFlagged.includes(handle));

/**
 * An `xs:boolean` attribute's lexical form.
 */
const xsBoolean = str.regex(patterns.xsBoolean);

/**
 * An `xs:nonNegativeInteger` attribute's lexical form.
 */
const xsNonNegativeInteger = str.regex(patterns.xsNonNegativeInteger);

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * A choice interaction's `orientation`: `vertical` or `horizontal`.
 */
const orientation = str.regex(patterns.orientation);

/**
 * A choice's `show-hide`: `show` or `hide`.
 */
const showHide = str.regex(patterns.showHide);

/**
 * A `qti-choice-interaction`.
 *
 * `maxChoices` and `minChoices` are the attributes as written; `maxChoicesN` and `minChoicesN` are
 * their integer values.
 */
export const ChoiceInteraction = relation(
  "ChoiceInteraction",
  {
    id: uuid,
    maxChoices: xsNonNegativeInteger,
    maxChoicesN: pg.bigint,
    minChoices: xsNonNegativeInteger,
    minChoicesN: pg.bigint,
    orientation,
    responseIdentifier: ncName,
    rootKind: closedId(node.RootKind),
    shuffle: xsBoolean,
  },
  ["id"],
);

/**
 * A `qti-simple-choice` of a choice interaction, by its identifier within that interaction.
 */
export const SimpleChoice = relation(
  "SimpleChoice",
  {
    fixed: xsBoolean,
    id: uuid,
    identifier: ncName,
    interaction: uuid,
    showHide,
  },
  ["id"],
);

/**
 * The source wrote `shuffle` on this choice interaction.
 */
export const DeclaredShuffle = relation("DeclaredShuffle", { node: uuid }, ["node"]);

/**
 * The source wrote `max-choices` on this choice interaction.
 */
export const DeclaredMaxChoices = relation("DeclaredMaxChoices", { node: uuid }, ["node"]);

/**
 * The source wrote `min-choices` on this choice interaction.
 */
export const DeclaredMinChoices = relation("DeclaredMinChoices", { node: uuid }, ["node"]);

/**
 * The source wrote `orientation` on this choice interaction.
 */
export const DeclaredOrientation = relation("DeclaredOrientation", { node: uuid }, ["node"]);

/**
 * The source wrote `fixed` on this simple choice.
 */
export const DeclaredFixed = relation("DeclaredFixed", { node: uuid }, ["node"]);

/**
 * The source wrote `show-hide` on this simple choice.
 */
export const DeclaredShowHide = relation("DeclaredShowHide", { node: uuid }, ["node"]);

/**
 * A choice interaction's `data-min-selections-message`, when it has one.
 */
export const ChoiceInteractionMinSelectionsMessage = relation(
  "ChoiceInteractionMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A choice interaction's `data-max-selections-message`, when it has one.
 */
export const ChoiceInteractionMaxSelectionsMessage = relation(
  "ChoiceInteractionMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A simple choice's `template-identifier`, when it has one.
 */
export const SimpleChoiceTemplateIdentifier = relation(
  "SimpleChoiceTemplateIdentifier",
  { node: uuid, value: ncName },
  ["node"],
);

/**
 * A pairing of base type and cardinality an interaction kind accepts. Seeded by a custom migration
 * and read-only to every role.
 */
export const BindingFit = relation(
  "BindingFit",
  {
    baseType: closedId(declaration.BaseType),
    cardinality: closedId(declaration.TypedCardinality),
    interactionKind: closedId(node.NodeKind),
  },
  ["interactionKind", "baseType", "cardinality"],
);

/**
 * The interaction that collects a response variable's value. A response variable has at most one,
 * and its shape copies the variable's.
 */
export const InteractionBinding = relation(
  "InteractionBinding",
  {
    adaptive: xsBoolean,
    ancestry: closedId(node.Ancestry),
    document: uuid,
    interactionKind: closedId(node.NodeKind),
    node: uuid,
    responseIdentifier: ncName,
    shape: closedId(declaration.DeclarationShape),
  },
  ["node"],
);

/**
 * A binding to a typed variable. `maxCount` is the interaction's `max-choices`, 1 where the source
 * omits it; 0 means unlimited.
 */
export const TypedBinding = relation(
  "TypedBinding",
  {
    baseType: closedId(declaration.BaseType),
    cardinality: closedId(declaration.TypedCardinality),
    document: uuid,
    interactionKind: closedId(node.NodeKind),
    maxCount: pg.bigint,
    node: uuid,
    responseIdentifier: ncName,
  },
  ["node"],
);

/**
 * A binding to a gap-match interaction's typed variable, whose cardinality the interaction's gaps
 * bound.
 */
export const GapMatchBinding = relation(
  "GapMatchBinding",
  { cardinality: closedId(declaration.TypedCardinality), node: uuid },
  ["node"],
);

/**
 * A binding to a record variable.
 */
export const RecordBinding = relation(
  "RecordBinding",
  { interactionKind: closedId(node.NodeKind), node: uuid },
  ["node"],
);

/**
 * An interaction kind that may bind a record variable. Seeded by a custom migration and read-only
 * to every role.
 */
export const RecordBindingFit = relation(
  "RecordBindingFit",
  { interactionKind: closedId(node.NodeKind) },
  ["interactionKind"],
);

/**
 * The choice kinds' arms, keyed by their `NodeKind` handles.
 *
 * Their containments into `Node` are not written here: `alternatives(Node, "kind", NodeKind, ...)`
 * in the composed schema expands to them, and writing both is a duplicate identity.
 */
export const arms = {
  "qti-choice-interaction": ChoiceInteraction,
  "qti-simple-choice": SimpleChoice,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  BindingFit,
  ChoiceInteraction,
  ChoiceInteractionMaxSelectionsMessage,
  ChoiceInteractionMinSelectionsMessage,
  DeclaredFixed,
  DeclaredMaxChoices,
  DeclaredMinChoices,
  DeclaredOrientation,
  DeclaredShowHide,
  DeclaredShuffle,
  GapMatchBinding,
  InteractionBinding,
  RecordBinding,
  RecordBindingFit,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
  TypedBinding,
};

/**
 * The statements over this module's relations: a choice interaction is a node of its root kind; its
 * minimum is at most its maximum unless the maximum is 0 (unbounded); every marker and optional
 * value belongs to its owner; a simple choice is the edge child of its parent, is named
 * uniquely within it, and every interaction has at least one. A binding names one interaction node
 * of its document for one response variable of the same shape; a typed binding is a pairing the fit
 * table lists, and a single-valued one takes at most one choice; every item choice interaction has
 * a binding.
 */
export const rules = [
  contained(on(ChoiceInteraction, "id", "rootKind"), on(node.Node, "id", "rootKind")),
  check("ChoiceBounds", ChoiceInteraction, (c) =>
    c.or(c.eq(c.maxChoicesN, 0n), c.le(c.minChoicesN, c.maxChoicesN)),
  ),
  contained(on(DeclaredShuffle, "node"), on(ChoiceInteraction, "id")),
  contained(on(DeclaredMaxChoices, "node"), on(ChoiceInteraction, "id")),
  contained(on(DeclaredMinChoices, "node"), on(ChoiceInteraction, "id")),
  contained(on(DeclaredOrientation, "node"), on(ChoiceInteraction, "id")),
  contained(on(ChoiceInteractionMinSelectionsMessage, "node"), on(ChoiceInteraction, "id")),
  contained(on(ChoiceInteractionMaxSelectionsMessage, "node"), on(ChoiceInteraction, "id")),
  key(SimpleChoice, ["interaction", "identifier"]),
  contained(on(SimpleChoice, "id", "interaction"), on(node.Edge, "child", "parent")),
  contained(on(DeclaredFixed, "node"), on(SimpleChoice, "id")),
  contained(on(DeclaredShowHide, "node"), on(SimpleChoice, "id")),
  contained(on(SimpleChoiceTemplateIdentifier, "node"), on(SimpleChoice, "id")),
  capacity(on(ChoiceInteraction, "id"), {
    from: on(SimpleChoice, "interaction"),
    within: within(1n, "*"),
  }),
  key(InteractionBinding, ["document", "responseIdentifier"]),
  contained(
    on(InteractionBinding, "document", "responseIdentifier"),
    on(select(declaration.Declaration, { kind: "response" }), "document", "identifier"),
  ),
  contained(
    on(InteractionBinding, "document", "responseIdentifier", "shape"),
    on(declaration.Declaration, "document", "identifier", "shape"),
  ),
  contained(
    on(InteractionBinding, "node", "document", "interactionKind"),
    on(node.Node, "id", "tree", "kind"),
  ),
  contained(on(InteractionBinding, "node", "ancestry"), on(node.Node, "id", "ancestry")),
  contained(
    on(InteractionBinding, "document", "adaptive"),
    on(item.AssessmentItem, "tree", "adaptive"),
  ),
  check("AdaptiveFeedback", InteractionBinding, (b) =>
    b.or(b.not(Compute.in(b.ancestry, feedbackAncestries)), b.eq(b.adaptive, "true")),
  ),
  alternatives(InteractionBinding, "shape", declaration.DeclarationShape, {
    record: RecordBinding,
    typed: TypedBinding,
  }),
  contained(
    on(TypedBinding, "document", "responseIdentifier", "baseType", "cardinality"),
    on(declaration.TypedDeclaration, "document", "identifier", "baseType", "cardinality"),
  ),
  contained(
    on(TypedBinding, "interactionKind", "baseType", "cardinality"),
    on(BindingFit, "interactionKind", "baseType", "cardinality"),
  ),
  contained(on(GapMatchBinding, "node", "cardinality"), on(TypedBinding, "node", "cardinality")),
  contained(on(RecordBinding, "interactionKind"), on(RecordBindingFit, "interactionKind")),
  check("BindingMax", TypedBinding, (b) =>
    b.or(b.eq(b.maxCount, 1n), b.eq(b.cardinality, "multiple")),
  ),
  contained(
    on(select(ChoiceInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
] as const;
