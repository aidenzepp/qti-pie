/**
 * The rows of the text interactions: text-entry, extended-text and inline-choice.
 *
 * Each interaction is written as its arm, the optional values and markers its attributes call for,
 * and its binding to the response variable it names. A binding's `maxCount` is the sentinel 1: no
 * count attribute bounds these kinds, and the kind's `BindingFit` rows alone say which variables
 * they accept.
 */
import { judgedLater } from "#qti/import/judged.ts";
import { Effect, Option } from "effect";
import type { InteractionContext, MarkerRelation, NodeRef } from "#qti/import/interactions.ts";
import type { ImportRefused } from "#qti/import/refusal.ts";
import { closedOf, Rows } from "#qti/import/tree.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { ShowHide, TextFormat, XsBoolean } from "#qti/schema/content/rosters.ts";
import {
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
} from "#qti/schema/interactions/text.ts";
import type { AncestryHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * The `maxCount` the text interactions' typed bindings hold.
 */
const sentinelCount = 1n;

/**
 * The rows of an optional value's relation: one row when the source wrote the attribute, none
 * otherwise.
 */
const valueFact = <T extends string>(
  node: string,
  value: Option.Option<string>,
  judge: (read: string) => T,
): readonly { readonly node: string; readonly value: T }[] =>
  Option.match(value, {
    onNone: () => [],
    onSome: (own) => [{ node, value: judge(own) }],
  });

/**
 * The text value as an optional's column holds it: a plain string.
 */
const plain = (read: string): string => read;

/**
 * A count as an `xs:nonNegativeInteger` column holds it.
 */
const natural = (read: string): `${number}` | `+${number}` => judgedLater(read);

/**
 * The marker relations of the defaulted attributes of one kind, by attribute name.
 */
type MarkerSet = Readonly<Record<string, MarkerRelation>>;

const textEntryMarkers = { base: DeclaredTextEntryBase } satisfies MarkerSet;

const extendedTextMarkers = {
  base: DeclaredExtendedTextBase,
  format: DeclaredExtendedTextFormat,
  "min-strings": DeclaredExtendedTextMinStrings,
} satisfies MarkerSet;

const inlineChoiceInteractionMarkers = {
  "min-choices": DeclaredInlineChoiceMinChoices,
  required: DeclaredInlineChoiceRequired,
  shuffle: DeclaredInlineChoiceShuffle,
} satisfies MarkerSet;

/**
 * The shape of the `StringBinding` row the interactions that name a `string-identifier` write.
 *
 * @param rows - The rows so far.
 * @param node - The id of the interaction.
 * @param document - The id of the item's document.
 * @param identifier - The interaction's `string-identifier`, `None` when the source omits it.
 * @returns The rows with one `StringBinding` row when `identifier` is written, unchanged otherwise.
 */
export const stringBindingRow = (
  rows: Rows,
  node: string,
  document: string,
  identifier: Option.Option<string>,
): Rows =>
  Option.match(identifier, {
    onNone: () => rows,
    onSome: (own) => Rows.add(rows, StringBinding, [{ document, identifier: own, node }]),
  });

/**
 * Write the binding of one text interaction to the variable its `response-identifier` names.
 */
const bound = (
  ctx: InteractionContext,
  rows: Rows,
  node: NodeRef & { readonly ancestry: AncestryHandle },
  responseIdentifier: string,
): Effect.Effect<Rows, ItemRefusal> =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    sentinelCount,
  );

/**
 * The rows of one `qti-text-entry-interaction`.
 */
const textEntryRows = Effect.fn("import.textEntryRows")(function* textEntryRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: NodeRef & { readonly ancestry: AncestryHandle },
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const base = attributes.read("base");
  const stringIdentifier = attributes.read("string-identifier");
  const expectedLength = attributes.read("expected-length");
  const patternMask = attributes.read("pattern-mask");
  const placeholderText = attributes.read("placeholder-text");
  const format = attributes.read("format");
  const message = attributes.read("data-patternmask-message");

  let built = attributes.rows();
  built = Rows.add(built, TextEntryInteraction, [
    {
      base: judgedLater(Option.getOrElse(base, () => "10")),
      id: node.id,
      responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = ctx.shared.markers(built, textEntryMarkers, node.id, attributes.written());
  built = Rows.add(built, TextEntryExpectedLength, valueFact(node.id, expectedLength, natural));
  built = Rows.add(built, TextEntryPatternMask, valueFact(node.id, patternMask, plain));
  built = Rows.add(built, TextEntryPlaceholderText, valueFact(node.id, placeholderText, plain));
  built = Rows.add(built, TextEntryFormat, valueFact(node.id, format, plain));
  built = Rows.add(built, TextEntryPatternmaskMessage, valueFact(node.id, message, plain));
  built = yield* bound(ctx, built, node, responseIdentifier);

  return stringBindingRow(built, node.id, ctx.documentId, stringIdentifier);
});

/**
 * The rows of one `qti-extended-text-interaction`.
 */
const extendedTextRows = Effect.fn("import.extendedTextRows")(function* extendedTextRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: NodeRef & { readonly ancestry: AncestryHandle },
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const base = attributes.read("base");
  const format = attributes.read("format");
  const minStrings = attributes.read("min-strings");
  const maxStrings = attributes.read("max-strings");
  const stringIdentifier = attributes.read("string-identifier");
  const expectedLength = attributes.read("expected-length");
  const expectedLines = attributes.read("expected-lines");
  const patternMask = attributes.read("pattern-mask");
  const placeholderText = attributes.read("placeholder-text");
  const message = attributes.read("data-patternmask-message");
  const formatHandle = yield* closedOf(
    TextFormat.handles,
    Option.getOrElse(format, () => "plain"),
    "attribute-lexical",
    "the format attribute of qti-extended-text-interaction",
  );

  let built = attributes.rows();
  built = Rows.add(built, ExtendedTextInteraction, [
    {
      base: judgedLater(Option.getOrElse(base, () => "10")),
      format: formatHandle,
      id: node.id,
      minStrings: judgedLater(Option.getOrElse(minStrings, () => "0")),
      responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = ctx.shared.markers(built, extendedTextMarkers, node.id, attributes.written());
  built = Rows.add(built, ExtendedTextMaxStrings, valueFact(node.id, maxStrings, natural));
  built = Rows.add(built, ExtendedTextExpectedLength, valueFact(node.id, expectedLength, natural));
  built = Rows.add(built, ExtendedTextExpectedLines, valueFact(node.id, expectedLines, natural));
  built = Rows.add(built, ExtendedTextPatternMask, valueFact(node.id, patternMask, plain));
  built = Rows.add(built, ExtendedTextPlaceholderText, valueFact(node.id, placeholderText, plain));
  built = Rows.add(built, ExtendedTextPatternmaskMessage, valueFact(node.id, message, plain));
  built = yield* bound(ctx, built, node, responseIdentifier);

  return stringBindingRow(built, node.id, ctx.documentId, stringIdentifier);
});

/**
 * The rows of one `qti-inline-choice-interaction`.
 */
const inlineChoiceInteractionRows = Effect.fn("import.inlineChoiceInteractionRows")(
  function* inlineChoiceInteractionRows(
    ctx: InteractionContext,
    rows: Rows,
    element: Element,
    node: NodeRef & { readonly ancestry: AncestryHandle },
  ): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
    const attributes = ctx.shared.attributes(rows, element, node);
    const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
    const shuffle = attributes.read("shuffle");
    const required = attributes.read("required");
    const minChoices = attributes.read("min-choices");
    const prompt = attributes.read("data-prompt");
    const message = attributes.read("data-min-selections-message");
    const requiredHandle = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(required, () => "false"),
      "attribute-lexical",
      "the required attribute of qti-inline-choice-interaction",
    );
    const shuffleHandle = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(shuffle, () => "false"),
      "attribute-lexical",
      "the shuffle attribute of qti-inline-choice-interaction",
    );

    let built = attributes.rows();
    built = Rows.add(built, InlineChoiceInteraction, [
      {
        id: node.id,
        minChoices: judgedLater(Option.getOrElse(minChoices, () => "0")),
        required: requiredHandle,
        responseIdentifier,
        rootKind: "item",
        shuffle: shuffleHandle,
      },
    ]);
    built = ctx.shared.markers(
      built,
      inlineChoiceInteractionMarkers,
      node.id,
      attributes.written(),
    );
    built = Rows.add(built, InlineChoicePrompt, valueFact(node.id, prompt, plain));
    built = Rows.add(built, InlineChoiceMinSelectionsMessage, valueFact(node.id, message, plain));

    return yield* bound(ctx, built, node, responseIdentifier);
  },
);

/**
 * The rows of one `qti-inline-choice`: its identifier, its `fixed` flag and its owner, the nearest
 * interaction above it, and the template variable it takes its identifier from.
 *
 * A choice with no interaction above it gets no row; the arm law refuses its node at commit.
 */
const inlineChoiceRows = Effect.fn("import.inlineChoiceRows")(function* inlineChoiceRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: NodeRef & { readonly ancestry: AncestryHandle },
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  if (Option.isNone(owner)) {
    return rows;
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const fixed = attributes.read("fixed");
  const showHide = attributes.read("show-hide");
  const templateIdentifier = attributes.read("template-identifier");
  const fixedHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(fixed, () => "false"),
    "attribute-lexical",
    "the fixed attribute of qti-inline-choice",
  );
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-inline-choice",
  );

  let built = attributes.rows();
  built = Rows.add(built, InlineChoice, [
    {
      fixed: fixedHandle,
      id: node.id,
      identifier,
      interaction: owner.value.id,
      showHide: showHideHandle,
    },
  ]);
  built = ctx.shared.markers(
    built,
    { fixed: DeclaredInlineChoiceFixed, "show-hide": DeclaredInlineChoiceShowHide },
    node.id,
    attributes.written(),
  );
  if (Option.isNone(templateIdentifier)) {
    return built;
  }

  return yield* ctx.shared.templateRef(
    built,
    node.id,
    ctx.documentId,
    templateIdentifier.value,
    ctx.declarations,
  );
});

/**
 * The text interactions' rows.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with each text-entry, extended-text and inline-choice interaction's arm,
 *   optional values, markers and binding, each inline choice's arm and template reference, and
 *   each `qti-label`'s arm; `ItemRefusal` for a `response-identifier` or a `template-identifier`
 *   no declaration of the item names; `ImportRefused` (`attribute-lexical`) for a `format`,
 *   `required`, `shuffle`, `fixed` or `show-hide` outside its roster.
 */
export const textRows = Effect.fn("import.textRows")(function* textRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | UnmodeledVocabulary | ItemRefusal> {
  let built = rows;
  for (const [element, indexed] of ctx.nodes) {
    const node = { ancestry: indexed.ancestry, id: indexed.id, kind: indexed.kind };
    if (indexed.kind === "qti-text-entry-interaction") {
      built = yield* textEntryRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-extended-text-interaction") {
      built = yield* extendedTextRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-inline-choice-interaction") {
      built = yield* inlineChoiceInteractionRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-inline-choice") {
      built = yield* inlineChoiceRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-label") {
      built = Rows.add(built, QtiLabel, [{ id: indexed.id }]);
    }
  }

  return built;
});
