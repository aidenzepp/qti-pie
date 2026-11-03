/**
 * The rows of the order interactions: order and graphic-order.
 *
 * A `qti-hotspot-choice` of a graphic order interaction is written by the hot builder, whatever its
 * parent. A `qti-simple-choice` is written here when its parent is an order interaction.
 */
import { judgedLater } from "#qti/import/judged.ts";
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import type { ImportRefused } from "#qti/import/refusal.ts";
import { closedOf, Rows, spelledInteger, withParents } from "#qti/import/tree.ts";
import { Orientation, ShowHide, XsBoolean } from "#qti/schema/content/rosters.ts";
import type { IndexedNode, ItemRefusal, UnmodeledVocabulary } from "#qti/import/tree.ts";
import {
  DeclaredFixed,
  DeclaredShowHide,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
} from "#qti/schema/interaction.ts";
import {
  DeclaredOrderShuffle,
  GraphicOrderInteraction,
  GraphicOrderMaxChoicesN,
  GraphicOrderMinChoicesN,
  OrderChoicesContainerWidth,
  OrderInteraction,
  OrderMaxChoicesN,
  OrderMaxSelectionsMessage,
  OrderMinChoicesN,
  OrderMinSelectionsMessage,
  OrderOrientation,
} from "#qti/schema/interactions/order.ts";
import type { AttributeNameHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * What the two order interactions read the same way: the response identifier and the two bounds, as
 * the typed columns hold them, and whether the source wrote each.
 */
interface Choices {
  readonly max: Option.Option<string>;
  readonly maxN: bigint;
  readonly min: Option.Option<string>;
  readonly minN: bigint;
  readonly responseIdentifier: string;
}

/**
 * The value of an integer attribute that may be absent, and the rows with its spelling kept where
 * the source spelled it other than the way the value is written: 0 where the source omits it.
 *
 * @param rows - The rows so far.
 * @param node - The element that carries the attribute.
 * @param name - The attribute's registry name.
 * @param text - The attribute's text after its whitespace step, none when it is omitted.
 * @param space - The integer space the attribute is written in.
 * @returns The value and the rows; `ImportRefused` (`attribute-lexical`) for text outside `space`.
 */
const spelledOr = (
  rows: Rows,
  node: IndexedNode,
  name: AttributeNameHandle,
  text: Option.Option<string>,
  space: "nonNegativeInteger" | "positiveInteger",
) =>
  Option.match(text, {
    onNone: () => Effect.succeed({ rows, value: 0n }),
    onSome: (own) =>
      spelledInteger(
        rows,
        node.id,
        node.kind,
        name,
        own,
        space,
        "attribute-lexical",
        `${node.kind} ${name}`,
      ),
  });

/**
 * Read the response identifier and the two bounds of an order interaction; an absent `max-choices`
 * or `min-choices` reads as 0, and a `max-choices` of 0 is unbounded.
 *
 * The caller reads its other attributes first: the rows returned are the reader's rows at the
 * moment of the call, with the spelling rows added.
 *
 * @param attributes - The interaction's attribute reader.
 * @param node - The interaction's node.
 * @returns The bounds and the rows; `ImportRefused` (`attribute-lexical`) for a `max-choices`
 *   outside the non-negative integers or a `min-choices` outside the positive integers.
 */
const choicesOf = Effect.fn("import.choicesOf")(function* choicesOf(
  attributes: AttributeReader,
  node: IndexedNode,
): Effect.fn.Return<{ choices: Choices; rows: Rows }, ImportRefused> {
  const max = attributes.read("max-choices");
  const min = attributes.read("min-choices");
  const maximum = yield* spelledOr(
    attributes.rows(),
    node,
    "max-choices",
    max,
    "nonNegativeInteger",
  );
  const minimum = yield* spelledOr(maximum.rows, node, "min-choices", min, "positiveInteger");

  return {
    choices: {
      max,
      maxN: maximum.value,
      min,
      minN: minimum.value,
      responseIdentifier: Option.getOrElse(attributes.read("response-identifier"), () => ""),
    },
    rows: minimum.rows,
  };
});

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
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const shuffle = attributes.read("shuffle");
  const orientation = attributes.read("orientation");
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const width = attributes.read("data-choices-container-width");
  const shuffleHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(shuffle, () => "false"),
    "attribute-lexical",
    "the shuffle attribute of qti-order-interaction",
  );
  const orientationHandle = Option.isSome(orientation)
    ? Option.some(
        yield* closedOf(
          Orientation.handles,
          orientation.value,
          "attribute-lexical",
          "the orientation attribute of qti-order-interaction",
        ),
      )
    : Option.none();
  const read = yield* choicesOf(attributes, node);
  const { choices } = read;
  let built = yield* bind(ctx, read.rows, node, choices);
  built = Rows.add(built, OrderInteraction, [
    {
      id: node.id,
      maxBound: ctx.shared.maxBoundOf(choices.maxN),
      maxChoicesN: choices.maxN,
      minChoicesN: choices.minN,
      responseIdentifier: choices.responseIdentifier,
      rootKind: "item",
      shuffle: shuffleHandle,
    },
  ]);
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
    written(orientationHandle, (own) => ({ node: node.id, value: own })),
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

  built = Rows.add(
    built,
    OrderChoicesContainerWidth,
    written(width, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { shuffle: DeclaredOrderShuffle },
    node.id,
    attributes.written(),
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
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const read = yield* choicesOf(attributes, node);
  const { choices } = read;
  let built = yield* bind(ctx, read.rows, node, choices);
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
const choice = Effect.fn("import.orderChoice")(function* choice(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  interaction: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const fixed = attributes.read("fixed");
  const showHide = attributes.read("show-hide");
  const template = attributes.read("template-identifier");
  const fixedHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(fixed, () => "false"),
    "attribute-lexical",
    "the fixed attribute of qti-simple-choice",
  );
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-simple-choice",
  );
  const built = Rows.add(attributes.rows(), SimpleChoice, [
    {
      fixed: fixedHandle,
      id: node.id,
      identifier: Option.getOrElse(attributes.read("identifier"), () => ""),
      interaction: interaction.id,
      showHide: showHideHandle,
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
});

/**
 * The order interactions' rows: the two interactions with their bindings, and the simple choices
 * whose parent is an order interaction.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with every order and graphic-order interaction of the item and each simple
 *   choice directly beneath an order interaction; `ItemRefusal` for an interaction whose
 *   `response-identifier` names no declaration; `ImportRefused` (`attribute-lexical`) for a
 *   `max-choices` outside the non-negative integers or a `min-choices` outside the positive
 *   integers.
 */
export const orderRows = Effect.fn("import.orderRows")(function* orderRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | UnmodeledVocabulary | ItemRefusal> {
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
      built = yield* choice(ctx, built, element, node, parent.value);
    }
  }

  return built;
});
