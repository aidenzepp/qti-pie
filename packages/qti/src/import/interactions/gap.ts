/**
 * The rows of the gap interactions: gap-match and graphic-gap-match, with the gaps, gap texts and
 * gap images they own.
 *
 * A `qti-gap` sits at any depth inside its gap-match's block content, so its interaction is the
 * nearest enclosing one; a gap text and a gap image are direct children and take their parent's.
 */
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import { ItemRefusal, Rows, withParents } from "#qti/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { MatchGroup } from "#qti/schema/choices.ts";
import {
  DeclaredGapImgShowHide,
  DeclaredGapMatchMaxAssociations,
  DeclaredGapMatchShuffle,
  DeclaredGapRequired,
  DeclaredGapShowHide,
  DeclaredGapTextShowHide,
  DeclaredGraphicGapMatchMaxAssociations,
  Gap,
  GapImg,
  GapImgLeft,
  GapImgMatchMin,
  GapImgObjectLabel,
  GapImgTop,
  GapMatchChoicesContainerWidth,
  GapMatchInteraction,
  GapMatchMaxAssociations,
  GapMatchMaxSelectionsMessage,
  GapMatchMinAssociations,
  GapMatchMinSelectionsMessage,
  GapText,
  GapTextMatchMin,
  GraphicGapMatchChoicesContainerWidth,
  GraphicGapMatchInteraction,
  GraphicGapMatchMaxAssociations,
  GraphicGapMatchMaxSelectionsMessage,
  GraphicGapMatchMinAssociations,
  GraphicGapMatchMinSelectionsMessage,
} from "#qti/schema/interactions/gap.ts";
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
 * What the two interactions read the same way: the response identifier and the two association
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
 * Write an interaction's binding to the response variable it names; the count is the
 * `maxCountDefault` of its kind, which a graphic gap match leaves at 1.
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
 * The rows of one `qti-gap-match-interaction`: the interaction, its binding and the
 * `GapMatchBinding` copied from the variable, and the optionals and markers the source wrote.
 */
const gapMatch = Effect.fn("import.gapMatch")(function* gapMatch(
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
  const width = attributes.read("data-choices-container-width");
  let built = yield* bind(ctx, attributes.rows(), node, associations);
  const declared = ctx.declarations.get(associations.responseIdentifier);
  if (declared !== undefined) {
    built = ctx.shared.gapMatchBindingRow(built, node.id, declared);
  }

  built = Rows.add(built, GapMatchInteraction, [
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
    GapMatchMaxAssociations,
    written(associations.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapMatchMinAssociations,
    written(associations.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapMatchMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapMatchMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapMatchChoicesContainerWidth,
    written(width, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    {
      "max-associations": DeclaredGapMatchMaxAssociations,
      shuffle: DeclaredGapMatchShuffle,
    },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-graphic-gap-match-interaction` and its binding. The interaction always
 * binds a multiple variable, so its binding carries the count 1 and no `GapMatchBinding`.
 */
const graphicGapMatch = Effect.fn("import.graphicGapMatch")(function* graphicGapMatch(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const associations = associationsOf(ctx, attributes);
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const width = attributes.read("data-choices-container-width");
  let built = yield* bind(ctx, attributes.rows(), node, associations);
  built = Rows.add(built, GraphicGapMatchInteraction, [
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
    GraphicGapMatchMaxAssociations,
    written(associations.max, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicGapMatchMinAssociations,
    written(associations.min, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicGapMatchMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicGapMatchMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GraphicGapMatchChoicesContainerWidth,
    written(width, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return ctx.shared.markers(
    built,
    { "max-associations": DeclaredGraphicGapMatchMaxAssociations },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows the `match-group` and `template-identifier` of a gap, a gap text or a gap image write.
 */
const groupAndTemplate = Effect.fn("import.gapGroupAndTemplate")(function* groupAndTemplate(
  ctx: InteractionContext,
  rows: Rows,
  attributes: AttributeReader,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const matchGroup = attributes.read("match-group");
  const template = attributes.read("template-identifier");
  let built = Rows.add(
    rows,
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
 * The rows of one `qti-gap`: the gap with the gap-match interaction that nearest encloses it, its
 * `required` flag and marker, its match group and its template variable.
 *
 * @returns The rows; `ItemRefusal` with rule `ancestry-ban` for a gap that sits in no gap-match
 *   interaction, and `ItemRefusal` for a `template-identifier` that names no typed variable.
 */
const gap = Effect.fn("import.gap")(function* gap(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = ctx.shared.nearestInteraction(ctx.nodes, element);
  if (Option.isNone(owner) || owner.value.kind !== "qti-gap-match-interaction") {
    return yield* new ItemRefusal({
      detail:
        "A qti-gap sits inside no qti-gap-match-interaction. Move it into the block content of a qti-gap-match-interaction.",
      rule: "ancestry-ban",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const required = attributes.read("required");
  const showHide = attributes.read("show-hide");
  const built = Rows.add(attributes.rows(), Gap, [
    {
      id: node.id,
      identifier,
      interaction: owner.value.id,
      required: judgedLater(Option.getOrElse(required, () => "false")),
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);
  const grouped = yield* groupAndTemplate(ctx, built, attributes, node);

  return ctx.shared.markers(
    grouped,
    { required: DeclaredGapRequired, "show-hide": DeclaredGapShowHide },
    node.id,
    attributes.written(),
  );
});

/**
 * The gap interaction a gap text or a gap image belongs to: its nearest enclosing interaction,
 * when that is a gap-match or a graphic gap-match.
 */
const gapOwner = (ctx: InteractionContext, element: Element): Option.Option<string> =>
  ctx.shared.nearestInteraction(ctx.nodes, element).pipe(
    Option.filter(
      (owner) =>
        owner.kind === "qti-gap-match-interaction" ||
        owner.kind === "qti-graphic-gap-match-interaction",
    ),
    Option.map((owner) => owner.id),
  );

/**
 * The rows of one `qti-gap-text`: the text, its match bounds, its `match-min` when written, its
 * match group and its template variable.
 *
 * @returns The rows; `ItemRefusal` for a gap text that sits in no gap interaction (rule
 *   `admission`) and for a `template-identifier` that names no typed variable.
 */
const gapText = Effect.fn("import.gapText")(function* gapText(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = gapOwner(ctx, element);
  if (Option.isNone(owner)) {
    return yield* new ItemRefusal({
      detail:
        "A qti-gap-text sits inside no gap interaction. Move it into a qti-gap-match-interaction or a qti-graphic-gap-match-interaction.",
      rule: "admission",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const matchMax = attributes.read("match-max");
  const matchMin = attributes.read("match-min");
  const showHide = attributes.read("show-hide");
  let built = Rows.add(attributes.rows(), GapText, [
    {
      id: node.id,
      identifier,
      interaction: owner.value,
      matchMax: judgedLater(Option.getOrElse(matchMax, () => "")),
      matchMaxN: ctx.shared.typedCopy(matchMax, 0n),
      matchMinN: ctx.shared.typedCopy(matchMin, 0n),
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "show-hide": DeclaredGapTextShowHide },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    GapTextMatchMin,
    written(matchMin, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return yield* groupAndTemplate(ctx, built, attributes, node);
});

/**
 * The rows of one `qti-gap-img`: the image, its match bounds, the optionals the source wrote, its
 * match group and its template variable. The `object` or `img` it holds is the HTML rows' own.
 *
 * @returns The rows; `ItemRefusal` for a gap image that sits in no gap interaction (rule
 *   `admission`) and for a `template-identifier` that names no typed variable.
 */
const gapImg = Effect.fn("import.gapImg")(function* gapImg(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const owner = gapOwner(ctx, element);
  if (Option.isNone(owner)) {
    return yield* new ItemRefusal({
      detail:
        "A qti-gap-img sits inside no gap interaction. Move it into a qti-gap-match-interaction or a qti-graphic-gap-match-interaction.",
      rule: "admission",
    });
  }

  const attributes = ctx.shared.attributes(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const matchMax = attributes.read("match-max");
  const matchMin = attributes.read("match-min");
  const label = attributes.read("object-label");
  const top = attributes.read("top");
  const left = attributes.read("left");
  const showHide = attributes.read("show-hide");
  let built = Rows.add(attributes.rows(), GapImg, [
    {
      id: node.id,
      identifier,
      interaction: owner.value,
      matchMax: judgedLater(Option.getOrElse(matchMax, () => "")),
      matchMaxN: ctx.shared.typedCopy(matchMax, 0n),
      matchMinN: ctx.shared.typedCopy(matchMin, 0n),
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "show-hide": DeclaredGapImgShowHide },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    GapImgMatchMin,
    written(matchMin, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapImgObjectLabel,
    written(label, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapImgTop,
    written(top, (own) => ({ node: node.id, value: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    GapImgLeft,
    written(left, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return yield* groupAndTemplate(ctx, built, attributes, node);
});

/**
 * The gap interactions' rows: the two interactions with their bindings, and the gaps, gap texts
 * and gap images beneath them.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with every gap-match and graphic-gap-match interaction, gap, gap text and gap
 *   image of the item; `ItemRefusal` for an interaction whose `response-identifier` names no
 *   declaration, a gap, gap text or gap image outside its interaction, and a `template-identifier`
 *   that names no typed variable.
 */
export const gapRows = Effect.fn("import.gapRows")(function* gapRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal> {
  let built = rows;
  for (const [element] of withParents(ctx.root, Option.none())) {
    const node = ctx.nodes.get(element);
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-gap-match-interaction") {
      built = yield* gapMatch(ctx, built, element, node);
    } else if (node.kind === "qti-graphic-gap-match-interaction") {
      built = yield* graphicGapMatch(ctx, built, element, node);
    } else if (node.kind === "qti-gap") {
      built = yield* gap(ctx, built, element, node);
    } else if (node.kind === "qti-gap-text") {
      built = yield* gapText(ctx, built, element, node);
    } else if (node.kind === "qti-gap-img") {
      built = yield* gapImg(ctx, built, element, node);
    }
  }

  return built;
});
