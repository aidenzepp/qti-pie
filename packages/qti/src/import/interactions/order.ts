/**
 * The rows of the order interactions: order and graphic-order.
 *
 * A `qti-hotspot-choice` of a graphic order interaction is written by the hot builder, whatever its
 * parent. A `qti-simple-choice` is written here when its parent is an order interaction.
 */
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import type { ItemRefusal } from "#qti/import/item.ts";
import { withParents } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#qti/import/tree.ts";
import {
  DeclaredFixed,
  DeclaredShowHide,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
} from "#qti/schema/interaction.ts";
import {
  GraphicOrderInteraction,
  GraphicOrderMaxChoices,
  GraphicOrderMaxChoicesN,
  GraphicOrderMinChoices,
  GraphicOrderMinChoicesN,
  OrderChoicesContainerWidth,
  OrderInteraction,
  OrderMaxChoices,
  OrderMaxChoicesN,
  OrderMaxSelectionsMessage,
  OrderMinChoices,
  OrderMinChoicesN,
  OrderMinSelectionsMessage,
  OrderOrientation,
} from "#qti/schema/interactions/order.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans and
 * lists are template-literal types, and the value read is a string until that pattern says it
 * fits, so the cast narrows only the type; a value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * What the two order interactions read the same way: the response identifier and the two bounds, as
 * written and as the typed columns hold them.
 */
interface Choices {
  readonly max: Option.Option<string>;
  readonly maxN: bigint;
  readonly min: Option.Option<string>;
  readonly minN: bigint;
  readonly responseIdentifier: string;
}

/**
 * Read the response identifier and the two bounds of an order interaction; an absent `max-choices`
 * or `min-choices` reads as 0, and a `max-choices` of 0 is unbounded.
 */
const choicesOf = (ctx: InteractionContext, attributes: AttributeReader): Choices => {
  const max = attributes.read("max-choices");
  const min = attributes.read("min-choices");

  return {
    max,
    maxN: ctx.shared.typedCopy(max, 0n),
    min,
    minN: ctx.shared.typedCopy(min, 0n),
    responseIdentifier: Option.getOrElse(attributes.read("response-identifier"), () => ""),
  };
};

/**
 * Write an order interaction's binding to the response variable it names. The count is 1: an order
 * interaction is always ordered, which its `BindingFit` rows say alone.
 */
const bind = (ctx: InteractionContext, rows: Rows, node: IndexedNode, choices: Choices) =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    choices.responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(choices.responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    ctx.shared.maxCountDefault(node.kind, new Map()),
  );

/**
 * The rows of one `qti-order-interaction` and its binding.
 */
const order = Effect.fn("import.order")(function* order(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const choices = choicesOf(ctx, attributes);
  const shuffle = attributes.read("shuffle");
  const orientation = attributes.read("orientation");
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const width = attributes.read("data-choices-container-width");
  let built = yield* bind(ctx, attributes.rows(), node, choices);
  built = Rows.add(built, OrderInteraction, [
    {
      id: node.id,
      maxBound: ctx.shared.maxBoundOf(choices.maxN),
      maxChoicesN: choices.maxN,
      minChoicesN: choices.minN,
      responseIdentifier: choices.responseIdentifier,
      rootKind: "item",
      shuffle: judgedLater(Option.getOrElse(shuffle, () => "false")),
    },
  ]);
  built = Rows.add(
    built,
    OrderMaxChoices,
    written(choices.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    OrderMinChoices,
    written(choices.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    OrderMaxChoicesN,
    written(choices.max, () => ({ node: node.id, value: choices.maxN })),
  );
  built = Rows.add(
    built,
    OrderMinChoicesN,
    written(choices.min, () => ({ node: node.id, value: choices.minN })),
  );
  built = Rows.add(
    built,
    OrderOrientation,
    written(orientation, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    OrderMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    OrderMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return Rows.add(
    built,
    OrderChoicesContainerWidth,
    written(width, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
});

/**
 * The rows of one `qti-graphic-order-interaction` and its binding.
 */
const graphicOrder = Effect.fn("import.graphicOrder")(function* graphicOrder(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const choices = choicesOf(ctx, attributes);
  let built = yield* bind(ctx, attributes.rows(), node, choices);
  built = Rows.add(built, GraphicOrderInteraction, [
    {
      id: node.id,
      maxBound: ctx.shared.maxBoundOf(choices.maxN),
      maxChoicesN: choices.maxN,
      minChoicesN: choices.minN,
      responseIdentifier: choices.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    GraphicOrderMaxChoices,
    written(choices.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicOrderMinChoices,
    written(choices.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicOrderMaxChoicesN,
    written(choices.max, () => ({ node: node.id, value: choices.maxN })),
  );

  return Rows.add(
    built,
    GraphicOrderMinChoicesN,
    written(choices.min, () => ({ node: node.id, value: choices.minN })),
  );
});

/**
 * The rows of one `qti-simple-choice` of the order interaction `interaction`: the choice, the
 * markers of the defaulted attributes the source wrote, and its template identifier when it has
 * one.
 */
const choice = (
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  interaction: IndexedNode,
): Rows => {
  const attributes = ctx.shared.attributes(rows, element, node);
  const fixed = attributes.read("fixed");
  const showHide = attributes.read("show-hide");
  const template = attributes.read("template-identifier");
  const built = Rows.add(attributes.rows(), SimpleChoice, [
    {
      fixed: judgedLater(Option.getOrElse(fixed, () => "false")),
      id: node.id,
      identifier: Option.getOrElse(attributes.read("identifier"), () => ""),
      interaction: interaction.id,
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);

  return Rows.add(
    ctx.shared.markers(
      built,
      { fixed: DeclaredFixed, "show-hide": DeclaredShowHide },
      node.id,
      attributes.written(),
    ),
    SimpleChoiceTemplateIdentifier,
    written(template, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
};

/**
 * The order interactions' rows: the two interactions with their bindings, and the simple choices
 * whose parent is an order interaction.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with every order and graphic-order interaction of the item and each simple
 *   choice directly beneath an order interaction; `ItemRefusal` for an interaction whose
 *   `response-identifier` names no declaration.
 */
export const orderRows = Effect.fn("import.orderRows")(function* orderRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal> {
  let built = rows;
  for (const [element, parentElement] of withParents(ctx.root, Option.none())) {
    const node = ctx.nodes.get(element);
    if (node === undefined) {
      continue;
    }

    const parent = Option.flatMapNullishOr(parentElement, (above) => ctx.nodes.get(above));
    if (node.kind === "qti-order-interaction") {
      built = yield* order(ctx, built, element, node);
    } else if (node.kind === "qti-graphic-order-interaction") {
      built = yield* graphicOrder(ctx, built, element, node);
    } else if (
      node.kind === "qti-simple-choice" &&
      Option.isSome(parent) &&
      parent.value.kind === "qti-order-interaction"
    ) {
      built = choice(ctx, built, element, node, parent.value);
    }
  }

  return built;
});
