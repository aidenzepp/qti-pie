/**
 * The text interactions: `qti-text-entry-interaction`, `qti-extended-text-interaction` and
 * `qti-inline-choice-interaction`, with the `qti-inline-choice` and `qti-label` children of the
 * last, and the optional values each may carry. The attributes and children are the inventory
 * entries of the same names, and the attribute types are the XSD's: `base` is `xs:int`, the three
 * lengths and counts are `xs:nonNegativeInteger`, and a text-entry's `format` is an
 * `xs:normalizedString` with no vocabulary, where an extended-text's is `plain`, `preformatted` or
 * `xhtml`.
 *
 * A text-entry interaction is an empty element, so no relation here is the child of one. An
 * extended-text interaction's only child, `qti-prompt`, belongs to the prompt's own module.
 *
 * `string-identifier` names a second response variable of base type string, one that belongs to
 * that interaction alone: `StringBinding` holds it for either kind, keyed by the interaction node
 * and by the variable, and contains the variable in the document's response declarations. That the
 * variable differs from `response-identifier` compares two columns of two relations and is the
 * importer's guard.
 *
 * A defaulted attribute a rule or the exporter reads has a marker that says the source wrote it:
 * `base`, `format` and `min-strings` of the first two kinds, and `shuffle`, `required` and
 * `min-choices` of the third. A `qti-inline-choice` names a template variable through the shared
 * `ChoiceTemplateRef`, which holds the identifier, so no relation of this module repeats it.
 *
 * The qti-label arm is `QtiLabel`: the `Label` relation of `html/text.ts` is the HTML `label`
 * element, and a schema holds one relation of each name.
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
import { ShowHide, TextFormat, XsBoolean } from "#qti/schema/content/rosters.ts";
import { Declaration } from "#qti/schema/declaration.ts";
import { InteractionBinding } from "#qti/schema/interaction.ts";
import { Edge, Node, RootKind } from "#qti/schema/node.ts";
import {
  ChoiceCount,
  ChoiceIdentifier,
  ExpectedLength,
  ExpectedLines,
  StringCount,
} from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `xs:int` attribute's lexical form.
 */
const xsInt = str.regex(patterns.xsInt);

/**
 * An `xs:string` attribute's value, whitespace preserved.
 */
const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * A `qti-text-entry-interaction`: an empty element. `base` is the attribute's value, 10 where the
 * source omits it.
 */
export const TextEntryInteraction = relation(
  "TextEntryInteraction",
  { base: xsInt, id: uuid, responseIdentifier: ncName, rootKind: closedId(RootKind) },
  ["id"],
);

/**
 * A `qti-extended-text-interaction`. `base` is 10, `format` is `plain` and `minStrings` is 0 where
 * the source omits them.
 */
export const ExtendedTextInteraction = relation(
  "ExtendedTextInteraction",
  {
    base: xsInt,
    format: closedId(TextFormat),
    id: uuid,
    minStrings: StringCount,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-inline-choice-interaction`. `minChoices` is 0, `required` and `shuffle` are `false` where
 * the source omits them.
 */
export const InlineChoiceInteraction = relation(
  "InlineChoiceInteraction",
  {
    id: uuid,
    minChoices: ChoiceCount,
    required: closedId(XsBoolean),
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    shuffle: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * A `qti-inline-choice`, by its identifier within the interaction that owns it. `fixed` is `false`
 * and `showHide` is `show` where the source omits it.
 */
export const InlineChoice = relation(
  "InlineChoice",
  {
    fixed: closedId(XsBoolean),
    id: uuid,
    identifier: ChoiceIdentifier,
    interaction: uuid,
    showHide: closedId(ShowHide),
  },
  ["id"],
);

/**
 * A `qti-label`: the label an inline choice interaction may open with. An inline host.
 */
export const QtiLabel = relation("QtiLabel", { id: uuid }, ["id"]);

/**
 * The response variable an interaction's `string-identifier` names, one row where the source
 * writes it. The variable belongs to that interaction alone, so the pair is a key, and it is a
 * response declaration of the interaction's own document.
 */
export const StringBinding = relation(
  "StringBinding",
  { document: uuid, identifier: ncName, node: uuid },
  ["node"],
);

/**
 * A text-entry interaction's `expected-length`, when it has one.
 */
export const TextEntryExpectedLength = relation(
  "TextEntryExpectedLength",
  { node: uuid, value: ExpectedLength },
  ["node"],
);

/**
 * A text-entry interaction's `pattern-mask`, when it has one.
 */
export const TextEntryPatternMask = relation(
  "TextEntryPatternMask",
  { node: uuid, value: xsString },
  ["node"],
);

/**
 * A text-entry interaction's `placeholder-text`, when it has one.
 */
export const TextEntryPlaceholderText = relation(
  "TextEntryPlaceholderText",
  { node: uuid, value: xsString },
  ["node"],
);

/**
 * A text-entry interaction's `format`, when it has one: the XSD defines no vocabulary for it.
 */
export const TextEntryFormat = relation(
  "TextEntryFormat",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A text-entry interaction's `data-patternmask-message`, when it has one.
 */
export const TextEntryPatternmaskMessage = relation(
  "TextEntryPatternmaskMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An extended-text interaction's `expected-length`, when it has one.
 */
export const ExtendedTextExpectedLength = relation(
  "ExtendedTextExpectedLength",
  { node: uuid, value: ExpectedLength },
  ["node"],
);

/**
 * An extended-text interaction's `pattern-mask`, when it has one.
 */
export const ExtendedTextPatternMask = relation(
  "ExtendedTextPatternMask",
  { node: uuid, value: xsString },
  ["node"],
);

/**
 * An extended-text interaction's `placeholder-text`, when it has one.
 */
export const ExtendedTextPlaceholderText = relation(
  "ExtendedTextPlaceholderText",
  { node: uuid, value: xsString },
  ["node"],
);

/**
 * An extended-text interaction's `max-strings`, when it has one.
 */
export const ExtendedTextMaxStrings = relation(
  "ExtendedTextMaxStrings",
  { node: uuid, value: StringCount },
  ["node"],
);

/**
 * An extended-text interaction's `expected-lines`, when it has one.
 */
export const ExtendedTextExpectedLines = relation(
  "ExtendedTextExpectedLines",
  { node: uuid, value: ExpectedLines },
  ["node"],
);

/**
 * An extended-text interaction's `data-patternmask-message`, when it has one.
 */
export const ExtendedTextPatternmaskMessage = relation(
  "ExtendedTextPatternmaskMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An inline choice interaction's `data-prompt`, when it has one.
 */
export const InlineChoicePrompt = relation(
  "InlineChoicePrompt",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An inline choice interaction's `data-min-selections-message`, when it has one.
 */
export const InlineChoiceMinSelectionsMessage = relation(
  "InlineChoiceMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * The source wrote `base` on this text-entry interaction.
 */
export const DeclaredTextEntryBase = relation("DeclaredTextEntryBase", { node: uuid }, ["node"]);

/**
 * The source wrote `base` on this extended-text interaction.
 */
export const DeclaredExtendedTextBase = relation("DeclaredExtendedTextBase", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `format` on this extended-text interaction.
 */
export const DeclaredExtendedTextFormat = relation("DeclaredExtendedTextFormat", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `min-strings` on this extended-text interaction.
 */
export const DeclaredExtendedTextMinStrings = relation(
  "DeclaredExtendedTextMinStrings",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `shuffle` on this inline choice interaction.
 */
export const DeclaredInlineChoiceShuffle = relation("DeclaredInlineChoiceShuffle", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `required` on this inline choice interaction.
 */
export const DeclaredInlineChoiceRequired = relation(
  "DeclaredInlineChoiceRequired",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `min-choices` on this inline choice interaction.
 */
export const DeclaredInlineChoiceMinChoices = relation(
  "DeclaredInlineChoiceMinChoices",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `fixed` on this inline choice.
 */
export const DeclaredInlineChoiceFixed = relation("DeclaredInlineChoiceFixed", { node: uuid }, [
  "node",
]);

/**
 * A `qti-inline-choice` that wrote `show-hide`.
 */
export const DeclaredInlineChoiceShowHide = relation(
  "DeclaredInlineChoiceShowHide",
  { node: uuid },
  ["node"],
);

/**
 * The arms of the five text kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are bound by one `mirrors` per handle in the composed schema.
 */
export const arms = {
  "qti-extended-text-interaction": ExtendedTextInteraction,
  "qti-inline-choice": InlineChoice,
  "qti-inline-choice-interaction": InlineChoiceInteraction,
  "qti-label": QtiLabel,
  "qti-text-entry-interaction": TextEntryInteraction,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  DeclaredExtendedTextBase,
  DeclaredExtendedTextFormat,
  DeclaredExtendedTextMinStrings,
  DeclaredInlineChoiceFixed,
  DeclaredInlineChoiceMinChoices,
  DeclaredInlineChoiceRequired,
  DeclaredInlineChoiceShowHide,
  DeclaredInlineChoiceShuffle,
  DeclaredTextEntryBase,
  ExtendedTextExpectedLength,
  ExtendedTextExpectedLines,
  ExtendedTextInteraction,
  ExtendedTextMaxStrings,
  ExtendedTextPatternMask,
  ExtendedTextPatternmaskMessage,
  ExtendedTextPlaceholderText,
  InlineChoice,
  InlineChoiceInteraction,
  InlineChoiceMinSelectionsMessage,
  InlineChoicePrompt,
  QtiLabel,
  StringBinding,
  TextEntryExpectedLength,
  TextEntryFormat,
  TextEntryInteraction,
  TextEntryPatternMask,
  TextEntryPatternmaskMessage,
  TextEntryPlaceholderText,
};

/**
 * The statements over this module's relations: each interaction is a node of its root kind, and an
 * item's interaction has a binding for its response variable; a string binding is a response
 * declaration of its node's document, and names its variable for that interaction alone; an inline
 * choice is named uniquely within its interaction and is the edge child of it, and every inline
 * choice interaction has at least one; every marker and optional value belongs to its owner.
 */
export const rules = [
  contained(on(TextEntryInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(TextEntryInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(ExtendedTextInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(ExtendedTextInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(InlineChoiceInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(InlineChoiceInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  key(StringBinding, ["document", "identifier"]),
  contained(
    on(StringBinding, "document", "identifier"),
    on(select(Declaration, { kind: "response" }), "document", "identifier"),
  ),
  contained(on(StringBinding, "node", "document"), on(Node, "id", "tree")),
  key(InlineChoice, ["interaction", "identifier"]),
  contained(on(InlineChoice, "id", "interaction"), on(Edge, "child", "parent")),
  capacity(on(InlineChoiceInteraction, "id"), {
    from: on(InlineChoice, "interaction"),
    within: within(1n, "*"),
  }),
  contained(on(TextEntryExpectedLength, "node"), on(TextEntryInteraction, "id")),
  contained(on(TextEntryPatternMask, "node"), on(TextEntryInteraction, "id")),
  contained(on(TextEntryPlaceholderText, "node"), on(TextEntryInteraction, "id")),
  contained(on(TextEntryFormat, "node"), on(TextEntryInteraction, "id")),
  contained(on(TextEntryPatternmaskMessage, "node"), on(TextEntryInteraction, "id")),
  contained(on(ExtendedTextExpectedLength, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(ExtendedTextPatternMask, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(ExtendedTextPlaceholderText, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(ExtendedTextMaxStrings, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(ExtendedTextExpectedLines, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(ExtendedTextPatternmaskMessage, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(InlineChoicePrompt, "node"), on(InlineChoiceInteraction, "id")),
  contained(on(InlineChoiceMinSelectionsMessage, "node"), on(InlineChoiceInteraction, "id")),
  contained(on(DeclaredTextEntryBase, "node"), on(TextEntryInteraction, "id")),
  contained(on(DeclaredExtendedTextBase, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(DeclaredExtendedTextFormat, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(DeclaredExtendedTextMinStrings, "node"), on(ExtendedTextInteraction, "id")),
  contained(on(DeclaredInlineChoiceShuffle, "node"), on(InlineChoiceInteraction, "id")),
  contained(on(DeclaredInlineChoiceRequired, "node"), on(InlineChoiceInteraction, "id")),
  contained(on(DeclaredInlineChoiceMinChoices, "node"), on(InlineChoiceInteraction, "id")),
  contained(on(DeclaredInlineChoiceFixed, "node"), on(InlineChoice, "id")),
  contained(on(DeclaredInlineChoiceShowHide, "node"), on(InlineChoice, "id")),
] as const;
