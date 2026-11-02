/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the hotspot and `Coords` rows name, and `ShapeHandle` the roster; the shape here is a geometric one, not a structure. */

/**
 * The rows of the associate interactions: associate, match and graphic-associate, with the sets,
 * choices and hotspots they own.
 *
 * Every `qti-associable-hotspot` is written here, whatever interaction holds it: its `parentKind`
 * copy is what tells a graphic associate's hotspot from a graphic gap match's.
 */
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import { ItemRefusal, Rows, withParents } from "#qti/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { MatchGroup } from "#qti/schema/choices.ts";
import { Shape } from "#qti/schema/content/rosters.ts";
import type { ShapeHandle } from "#qti/schema/content/rosters.ts";
import {
  AssociableHotspot,
  AssociableHotspotLabel,
  AssociableHotspotMatchMin,
  AssociateInteraction,
  AssociateMaxAssociations,
  AssociateMinAssociations,
  DeclaredAssociableHotspotShowHide,
  DeclaredAssociateMaxAssociations,
  DeclaredAssociateMinAssociations,
  DeclaredAssociateShuffle,
  DeclaredGraphicAssociateMaxAssociations,
  DeclaredMatchMaxAssociations,
  DeclaredMatchMinAssociations,
  DeclaredMatchShuffle,
  GraphicAssociateInteraction,
  GraphicAssociateMaxAssociations,
  GraphicAssociateMinAssociations,
  MatchFirstColumnHeader,
  MatchInteraction,
  MatchMaxAssociations,
  MatchMaxSelectionsMessage,
  MatchMinAssociations,
  MatchMinSelectionsMessage,
  SimpleAssociableChoice,
  SimpleAssociableChoiceFixed,
  SimpleAssociableChoiceMatchMin,
  SimpleAssociableChoiceMatchSet,
  SimpleAssociableChoiceShowHide,
  SimpleMatchSet,
} from "#qti/schema/interactions/associate.ts";
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
 * The value of the attribute `element` carries under `name` with no namespace, as written.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((found) => found.namespace === "" && found.local === name),
  ).pipe(Option.map((found) => found.value));

/**
 * What the three interactions read the same way: the response identifier and the two association
 * bounds, as written and as the typed columns hold them.
 */
interface Associations {
  readonly max: Option.Option<string>;
  readonly maxN: bigint;
  readonly min: Option.Option<string>;
  readonly minN: bigint;
  readonly responseIdentifier: string;
}

/**
 * Read the response identifier and the two association bounds of an interaction; an absent
 * `max-associations` reads as 1 and an absent `min-associations` as 0.
 */
const associationsOf = (ctx: InteractionContext, attributes: AttributeReader): Associations => {
  const max = attributes.read("max-associations");
  const min = attributes.read("min-associations");

  return {
    max,
    maxN: ctx.shared.typedCopy(max, 1n),
    min,
    minN: ctx.shared.typedCopy(min, 0n),
    responseIdentifier: Option.getOrElse(attributes.read("response-identifier"), () => ""),
  };
};

/**
 * Write an interaction's binding to the response variable it names; the count is its
 * `max-associations`, 1 where absent.
 */
const bind = (ctx: InteractionContext, rows: Rows, node: IndexedNode, associations: Associations) =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    associations.responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(associations.responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    ctx.shared.maxCountDefault(
      node.kind,
      new Map(
        Option.match(associations.max, {
          onNone: (): [string, string][] => [],
          onSome: (own): [string, string][] => [["max-associations", own]],
        }),
      ),
    ),
  );

/**
 * The rows of one `qti-associate-interaction` and its binding.
 */
const associate = Effect.fn("import.associate")(function* associate(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const associations = associationsOf(ctx, attributes);
  const shuffle = attributes.read("shuffle");
  let built = yield* bind(ctx, attributes.rows(), node, associations);
  built = Rows.add(built, AssociateInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
      shuffle: judgedLater(Option.getOrElse(shuffle, () => "false")),
    },
  ]);
  built = Rows.add(
    built,
    AssociateMaxAssociations,
    written(associations.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    AssociateMinAssociations,
    written(associations.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    {
      "max-associations": DeclaredAssociateMaxAssociations,
      "min-associations": DeclaredAssociateMinAssociations,
      shuffle: DeclaredAssociateShuffle,
    },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-match-interaction` and its binding.
 */
const match = Effect.fn("import.match")(function* match(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const associations = associationsOf(ctx, attributes);
  const shuffle = attributes.read("shuffle");
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const header = attributes.read("data-first-column-header");
  let built = yield* bind(ctx, attributes.rows(), node, associations);
  built = Rows.add(built, MatchInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
      shuffle: judgedLater(Option.getOrElse(shuffle, () => "false")),
    },
  ]);
  built = Rows.add(
    built,
    MatchMaxAssociations,
    written(associations.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    MatchMinAssociations,
    written(associations.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    MatchMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    MatchMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    MatchFirstColumnHeader,
    written(header, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    {
      "max-associations": DeclaredMatchMaxAssociations,
      "min-associations": DeclaredMatchMinAssociations,
      shuffle: DeclaredMatchShuffle,
    },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-graphic-associate-interaction` and its binding. Its `min-associations` has
 * no schema default, so the optional relation alone says whether the source wrote it.
 */
const graphicAssociate = Effect.fn("import.graphicAssociate")(function* graphicAssociate(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const associations = associationsOf(ctx, attributes);
  let built = yield* bind(ctx, attributes.rows(), node, associations);
  built = Rows.add(built, GraphicAssociateInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = Rows.add(
    built,
    GraphicAssociateMaxAssociations,
    written(associations.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicAssociateMinAssociations,
    written(associations.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { "max-associations": DeclaredGraphicAssociateMaxAssociations },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-simple-associable-choice`: the choice, its match bounds, the optionals the
 * source wrote, the set it sits in when its parent is a `qti-simple-match-set`, and the template
 * variable it names.
 *
 * @returns The rows; `ItemRefusal` for a choice that sits in no interaction (rule `admission`), and
 *   for a `template-identifier` that names no typed variable.
 */
const choice = Effect.fn("import.associableChoice")(function* choice(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  if (Option.isNone(owner)) {
    return yield* new ItemRefusal({
      detail:
        "A qti-simple-associable-choice sits inside no interaction. Move it into a qti-associate-interaction or a qti-simple-match-set of a qti-match-interaction.",
      rule: "admission",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const matchMax = attributes.read("match-max");
  const matchMin = attributes.read("match-min");
  const fixed = attributes.read("fixed");
  const showHide = attributes.read("show-hide");
  const matchGroup = attributes.read("match-group");
  const template = attributes.read("template-identifier");
  let built = attributes.rows();
  built = Rows.add(built, SimpleAssociableChoice, [
    {
      id: node.id,
      identifier,
      interaction: owner.value.id,
      matchMax: judgedLater(Option.getOrElse(matchMax, () => "")),
      matchMaxN: ctx.shared.typedCopy(matchMax, 0n),
      matchMinN: ctx.shared.typedCopy(matchMin, 0n),
    },
  ]);
  built = Rows.add(
    built,
    SimpleAssociableChoiceMatchSet,
    Option.match(parent, {
      onNone: () => [],
      onSome: (above) =>
        above.kind === "qti-simple-match-set"
          ? [{ interaction: owner.value.id, matchSet: above.id, node: node.id }]
          : [],
    }),
  );
  built = Rows.add(
    built,
    SimpleAssociableChoiceMatchMin,
    written(matchMin, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    SimpleAssociableChoiceFixed,
    written(fixed, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    SimpleAssociableChoiceShowHide,
    written(showHide, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    MatchGroup,
    written(matchGroup, (own) => ({ node: node.id, value: judgedLater(own) })),
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

  return built;
});

/**
 * The handle of the shape a `shape` attribute names, `None` when it names none.
 */
const shapeOf = (text: Option.Option<string>): Option.Option<ShapeHandle> =>
  Option.flatMapNullishOr(text, (known) => Shape.handles.find((handle) => handle === known));

/**
 * The rows of one `qti-associable-hotspot`: the hotspot with its parent's kind and the interaction
 * that encloses it, its match bounds, its label when it has one, and its coordinates.
 *
 * @returns The rows; `ItemRefusal` for a hotspot with no valid `shape`, and for one with no enclosing
 *   interaction (rule `admission`).
 *   A hotspot with no `coords` has no `Coords` row, and the shape's capacity refuses it at commit.
 */
const hotspot = Effect.fn("import.associableHotspot")(function* hotspot(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  const shape = shapeOf(lexicalOf(element, "shape"));
  if (Option.isNone(owner) || Option.isNone(parent)) {
    return yield* new ItemRefusal({
      detail:
        "A qti-associable-hotspot sits inside no interaction. Move it into a qti-graphic-associate-interaction or a qti-graphic-gap-match-interaction.",
      rule: "admission",
    });
  }

  if (Option.isNone(shape)) {
    return yield* new ItemRefusal({
      detail: `The qti-associable-hotspot has the shape "${Option.getOrElse(lexicalOf(element, "shape"), () => "")}", which is not a shape. Use circle, default, ellipse, poly or rect.`,
      rule: "typed-copy",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const matchMax = attributes.read("match-max");
  const matchMin = attributes.read("match-min");
  const label = attributes.read("hotspot-label");
  const showHide = attributes.read("show-hide");
  let built = attributes.rows();
  built = Rows.add(built, AssociableHotspot, [
    {
      id: node.id,
      identifier,
      interaction: owner.value.id,
      matchMax: judgedLater(Option.getOrElse(matchMax, () => "")),
      matchMaxN: ctx.shared.typedCopy(matchMax, 0n),
      matchMinN: ctx.shared.typedCopy(matchMin, 0n),
      parentKind: parent.value.kind,
      shape: shape.value,
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "show-hide": DeclaredAssociableHotspotShowHide },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    AssociableHotspotLabel,
    written(label, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    AssociableHotspotMatchMin,
    written(matchMin, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return Option.match(lexicalOf(element, "coords"), {
    onNone: () => built,
    onSome: (coords) =>
      ctx.shared.coordsRows(built, node.id, "qti-associable-hotspot", shape.value, coords),
  });
});

/**
 * The associate interactions' rows: the three interactions with their bindings, the sets, choices
 * and hotspots beneath them, and every hotspot of the item.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with every associate, match and graphic-associate interaction, simple match
 *   set, simple associable choice and associable hotspot of the item; `ItemRefusal` for an
 *   interaction whose `response-identifier` names no declaration, a choice whose
 *   `template-identifier` names no typed variable, and a hotspot with no valid shape.
 */
export const associateRows = Effect.fn("import.associateRows")(function* associateRows(
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
    if (node.kind === "qti-associable-hotspot") {
      built = yield* hotspot(ctx, built, element, node, parent);
    } else if (node.kind === "qti-associate-interaction") {
      built = yield* associate(ctx, built, element, node);
    } else if (node.kind === "qti-graphic-associate-interaction") {
      built = yield* graphicAssociate(ctx, built, element, node);
    } else if (node.kind === "qti-match-interaction") {
      built = yield* match(ctx, built, element, node);
    } else if (node.kind === "qti-simple-associable-choice") {
      built = yield* choice(ctx, built, element, node, parent);
    } else if (node.kind === "qti-simple-match-set") {
      built = Rows.add(built, SimpleMatchSet, [{ id: node.id }]);
    }
  }

  return built;
});
