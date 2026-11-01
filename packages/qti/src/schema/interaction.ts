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
 */
import {
  capacity,
  check,
  closedId,
  contained,
  key,
  on,
  pg,
  relation,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
  ChoiceInteraction,
  ChoiceInteractionMaxSelectionsMessage,
  ChoiceInteractionMinSelectionsMessage,
  DeclaredFixed,
  DeclaredMaxChoices,
  DeclaredMinChoices,
  DeclaredOrientation,
  DeclaredShowHide,
  DeclaredShuffle,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
};

/**
 * The statements over this module's relations: a choice interaction is a node of its root kind; its
 * minimum is at most its maximum unless the maximum is 0 (unbounded); every marker and optional
 * value belongs to its owner; a simple choice is the edge child of its parent, is named
 * uniquely within it, and every interaction has at least one.
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
] as const;
