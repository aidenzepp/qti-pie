/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the hotspot and `Coords` rows name, and `ShapeHandle` the roster; the shape here is a geometric one, not a structure. */

/**
 * The rows of the hot interactions: hottext, hotspot, select-point and position-object, with the
 * hottexts, hotspot choices and position-object stages they own or sit in.
 *
 * A `qti-hottext` and a `qti-hotspot-choice` are written wherever they sit. A hottext's owner row
 * exists exactly when its nearest enclosing interaction is a hottext interaction.
 */
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import { ItemRefusal, withParents } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { Shape } from "#qti/schema/content/rosters.ts";
import type { ShapeHandle } from "#qti/schema/content/rosters.ts";
import {
  DeclaredHottextMaxChoices,
  DeclaredHottextMinChoices,
  DeclaredHotspotMaxChoices,
  DeclaredHotspotMinChoices,
  DeclaredPositionObjectMaxChoices,
  DeclaredSelectPointMaxChoices,
  DeclaredSelectPointMinChoices,
  HotspotChoice,
  HotspotChoiceLabel,
  HotspotInteraction,
  HotspotMaxChoices,
  HotspotMaxSelectionsMessage,
  HotspotMinChoices,
  HotspotMinSelectionsMessage,
  Hottext,
  HottextInteraction,
  HottextMaxChoices,
  HottextMaxSelectionsMessage,
  HottextMinChoices,
  HottextMinSelectionsMessage,
  HottextOwner,
  PositionObjectCenterPoint,
  PositionObjectInteraction,
  PositionObjectMaxChoices,
  PositionObjectMinChoices,
  PositionObjectStage,
  SelectPointInteraction,
  SelectPointMaxChoices,
  SelectPointMinChoices,
} from "#qti/schema/interactions/hot.ts";
import type { NodeKindHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of lists and
 * integers are template-literal types, and the value read is a string until that pattern says it
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
 * The value of the attribute `element` carries under `name` with no namespace, as written.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((found) => found.namespace === "" && found.local === name),
  ).pipe(Option.map((found) => found.value));

/**
 * The handle of the shape a `shape` attribute names, `None` when it names none.
 */
const shapeOf = (text: Option.Option<string>): Option.Option<ShapeHandle> =>
  Option.flatMapNullishOr(text, (known) => Shape.handles.find((handle) => handle === known));

/**
 * What the four interactions read the same way: the response identifier and the choice bounds, as
 * written and as the typed columns hold them.
 */
interface Bounds {
  readonly max: Option.Option<string>;
  readonly maxN: bigint;
  readonly min: Option.Option<string>;
  readonly minN: bigint;
  readonly responseIdentifier: string;
}

/**
 * Read the response identifier and the two choice bounds of an interaction; an absent
 * `max-choices` reads as the kind's default and an absent `min-choices` as 0.
 */
const boundsOf = (
  ctx: InteractionContext,
  attributes: AttributeReader,
  kind: NodeKindHandle,
): Bounds => {
  const max = attributes.read("max-choices");
  const min = attributes.read("min-choices");

  return {
    max,
    maxN: ctx.shared.maxCountDefault(
      kind,
      new Map(
        Option.match(max, {
          onNone: (): [string, string][] => [],
          onSome: (own): [string, string][] => [["max-choices", own]],
        }),
      ),
    ),
    min,
    minN: ctx.shared.typedCopy(min, 0n),
    responseIdentifier: Option.getOrElse(attributes.read("response-identifier"), () => ""),
  };
};

/**
 * Write an interaction's binding to the response variable it names; the count is its
 * `max-choices`, defaulted by the kind.
 */
const bind = (ctx: InteractionContext, rows: Rows, node: IndexedNode, bounds: Bounds) =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    bounds.responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(bounds.responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    bounds.maxN,
  );

/**
 * The rows of one `qti-hottext-interaction` and its binding.
 */
const hottextInteraction = Effect.fn("import.hottextInteraction")(function* hottextInteraction(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const bounds = boundsOf(ctx, attributes, node.kind);
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  let built = yield* bind(ctx, attributes.rows(), node, bounds);
  built = Rows.add(built, HottextInteraction, [
    {
      id: node.id,
      maxChoicesN: bounds.maxN,
      minChoicesN: bounds.minN,
      responseIdentifier: bounds.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    HottextMaxChoices,
    written(bounds.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HottextMinChoices,
    written(bounds.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HottextMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HottextMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { "max-choices": DeclaredHottextMaxChoices, "min-choices": DeclaredHottextMinChoices },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-hotspot-interaction` and its binding.
 */
const hotspotInteraction = Effect.fn("import.hotspotInteraction")(function* hotspotInteraction(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const bounds = boundsOf(ctx, attributes, node.kind);
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  let built = yield* bind(ctx, attributes.rows(), node, bounds);
  built = Rows.add(built, HotspotInteraction, [
    {
      id: node.id,
      maxChoicesN: bounds.maxN,
      minChoicesN: bounds.minN,
      responseIdentifier: bounds.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    HotspotMaxChoices,
    written(bounds.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HotspotMinChoices,
    written(bounds.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HotspotMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    HotspotMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { "max-choices": DeclaredHotspotMaxChoices, "min-choices": DeclaredHotspotMinChoices },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-select-point-interaction` and its binding. An absent `max-choices` reads as
 * 0, which is unbounded.
 */
const selectPoint = Effect.fn("import.selectPoint")(function* selectPoint(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const bounds = boundsOf(ctx, attributes, node.kind);
  let built = yield* bind(ctx, attributes.rows(), node, bounds);
  built = Rows.add(built, SelectPointInteraction, [
    {
      id: node.id,
      maxChoicesN: bounds.maxN,
      minChoicesN: bounds.minN,
      responseIdentifier: bounds.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    SelectPointMaxChoices,
    written(bounds.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    SelectPointMinChoices,
    written(bounds.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    {
      "max-choices": DeclaredSelectPointMaxChoices,
      "min-choices": DeclaredSelectPointMinChoices,
    },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-position-object-interaction` and its binding. Its `min-choices` has no
 * schema default, so the optional relation alone says whether the source wrote it.
 */
const positionObject = Effect.fn("import.positionObject")(function* positionObject(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const bounds = boundsOf(ctx, attributes, node.kind);
  const center = attributes.read("center-point");
  let built = yield* bind(ctx, attributes.rows(), node, bounds);
  built = Rows.add(built, PositionObjectInteraction, [
    {
      id: node.id,
      maxChoicesN: bounds.maxN,
      minChoicesN: bounds.minN,
      responseIdentifier: bounds.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    PositionObjectMaxChoices,
    written(bounds.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    PositionObjectMinChoices,
    written(bounds.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    PositionObjectCenterPoint,
    written(center, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { "max-choices": DeclaredPositionObjectMaxChoices },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-hottext`: the hottext, its owner row when the nearest enclosing interaction
 * is a hottext interaction, and the template variable it names.
 *
 * @returns The rows; `ItemRefusal` for a `template-identifier` that names no typed variable.
 */
const hottext = Effect.fn("import.hottext")(function* hottext(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const template = attributes.read("template-identifier");
  let built = Rows.add(attributes.rows(), Hottext, [{ id: node.id, identifier }]);
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  if (Option.isSome(owner) && owner.value.kind === "qti-hottext-interaction") {
    built = Rows.add(built, HottextOwner, [
      { identifier, interaction: owner.value.id, node: node.id },
    ]);
  }

  if (Option.isSome(template)) {
    built = yield* ctx.shared.templateRef(
      built,
      node.id,
      ctx.documentId,
      template.value,
      ctx.declarations,
    );
  }

  return built;
});

/**
 * The rows of one `qti-hotspot-choice`: the choice with the interaction that encloses it, its
 * label when it has one, its template variable, and its coordinates.
 *
 * @returns The rows; `ItemRefusal` for a choice with no valid `shape`, no enclosing interaction, or
 *   a `template-identifier` that names no typed variable. A choice with no `coords` has no
 *   `Coords` row, and the shape's capacity refuses it at commit.
 */
const hotspotChoice = Effect.fn("import.hotspotChoice")(function* hotspotChoice(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  if (Option.isNone(owner)) {
    return yield* new ItemRefusal({
      detail:
        "A qti-hotspot-choice sits inside no interaction. Move it into a qti-hotspot-interaction or a qti-graphic-order-interaction.",
      rule: "binding-declared",
    });
  }

  const shape = shapeOf(lexicalOf(element, "shape"));
  if (Option.isNone(shape)) {
    return yield* new ItemRefusal({
      detail: `The qti-hotspot-choice has the shape "${Option.getOrElse(lexicalOf(element, "shape"), () => "")}", which is not a shape. Use circle, default, ellipse, poly or rect.`,
      rule: "typed-copy",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const label = attributes.read("hotspot-label");
  const template = attributes.read("template-identifier");
  let built = Rows.add(attributes.rows(), HotspotChoice, [
    { id: node.id, identifier, interaction: owner.value.id, shape: shape.value },
  ]);
  built = Rows.add(
    built,
    HotspotChoiceLabel,
    written(label, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  if (Option.isSome(template)) {
    built = yield* ctx.shared.templateRef(
      built,
      node.id,
      ctx.documentId,
      template.value,
      ctx.declarations,
    );
  }

  return Option.match(lexicalOf(element, "coords"), {
    onNone: () => built,
    onSome: (coords) =>
      ctx.shared.coordsRows(built, node.id, "qti-hotspot-choice", shape.value, coords),
  });
});

/**
 * The hot interactions' rows: the four interactions with their bindings, every hottext, every
 * hotspot choice and every position-object stage of the item.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with every hottext, hotspot, select-point and position-object interaction and
 *   the elements beneath them; `ItemRefusal` for an interaction whose `response-identifier` names
 *   no declaration, a choice whose `template-identifier` names no typed variable, and a hotspot
 *   choice with no valid shape or no enclosing interaction.
 */
export const hotRows = Effect.fn("import.hotRows")(function* hotRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal> {
  let built = rows;
  for (const [element] of withParents(ctx.root, Option.none())) {
    const node = ctx.nodes.get(element);
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-hottext-interaction") {
      built = yield* hottextInteraction(ctx, built, element, node);
    } else if (node.kind === "qti-hotspot-interaction") {
      built = yield* hotspotInteraction(ctx, built, element, node);
    } else if (node.kind === "qti-select-point-interaction") {
      built = yield* selectPoint(ctx, built, element, node);
    } else if (node.kind === "qti-position-object-interaction") {
      built = yield* positionObject(ctx, built, element, node);
    } else if (node.kind === "qti-position-object-stage") {
      built = Rows.add(built, PositionObjectStage, [{ id: node.id }]);
    } else if (node.kind === "qti-hottext") {
      built = yield* hottext(ctx, built, element, node);
    } else if (node.kind === "qti-hotspot-choice") {
      built = yield* hotspotChoice(ctx, built, element, node);
    }
  }

  return built;
});
