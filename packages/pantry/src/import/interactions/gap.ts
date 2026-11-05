/**
 * The rows of the gap interactions: gap-match and graphic-gap-match, with the gaps, gap texts and
 * gap images they own.
 *
 * A `qti-gap` sits at any depth inside its gap-match's block content, so its interaction is the
 * nearest enclosing one; a gap text and a gap image are direct children and take their parent's.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { judgedLater } from "#pantry/import/judged.ts";
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#pantry/import/interactions.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { closedOf, ItemRefusal, Rows, spelledInteger, withParents } from "#pantry/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import { MatchGroup } from "#pantry/schema/choices.ts";
import { ShowHide, XsBoolean } from "#pantry/schema/content/rosters.ts";
import { ChoiceIdentifier } from "#pantry/schema/contracts.ts";
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
  GapMatchMaxSelectionsMessage,
  GapMatchMinAssociations,
  GapMatchMinSelectionsMessage,
  GapText,
  GapTextMatchMin,
  GraphicGapMatchChoicesContainerWidth,
  GraphicGapMatchInteraction,
  GraphicGapMatchMaxSelectionsMessage,
  GraphicGapMatchMinAssociations,
  GraphicGapMatchMinSelectionsMessage,
} from "#pantry/schema/interactions/gap.ts";
import type { AttributeNameHandle } from "#pantry/schema/node.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * What the two interactions read the same way: the response identifier and the two association
 * bounds, as the typed columns hold them.
 */
interface Associations {
  readonly maxN: bigint;
  readonly minN: bigint;
  readonly responseIdentifier: string;
}

/**
 * The value of an integer attribute of `node`, and the rows with its spelling kept where the
 * source spelled it other than the way the value is written.
 *
 * @param rows - The rows so far.
 * @param node - The element that carries the attribute.
 * @param name - The attribute's registry name.
 * @param text - The attribute's text after its whitespace step.
 * @returns The value and the rows; `ImportRefused` (`attribute-lexical`) for text outside the
 *   non-negative integers.
 */
const spelled = (rows: Rows, node: IndexedNode, name: AttributeNameHandle, text: string) =>
  spelledInteger(
    rows,
    node.id,
    node.kind,
    name,
    text,
    "nonNegativeInteger",
    "attribute-lexical",
    `${node.kind} ${name}`,
  );

/**
 * The value of a required integer attribute of `node`, as {@link spelled} reads it; an absent
 * attribute is refused as missing, not read as an empty value.
 *
 * @param rows - The rows so far.
 * @param node - The element that carries the attribute.
 * @param name - The attribute's registry name.
 * @param text - The attribute's text after its whitespace step, when the element has one.
 * @returns The value and the rows; `ImportRefused` (`attribute-lexical`) when the attribute is
 *   absent or its text is outside the non-negative integers.
 */
const spelledRequired = (
  rows: Rows,
  node: IndexedNode,
  name: AttributeNameHandle,
  text: Option.Option<string>,
) =>
  Option.match(text, {
    onNone: () =>
      Effect.fail(
        new ImportRefused({
          detail: `The ${node.kind} has no ${name}, which it requires. Add a ${name} that is a whole number of zero or more.`,
          rule: "attribute-lexical",
        }),
      ),
    onSome: (own) => spelled(rows, node, name, own),
  });

/**
 * The value of an integer attribute that may be absent: `fallback` where the source omits it, and
 * otherwise what {@link spelled} makes of its text.
 */
const spelledOr = (
  rows: Rows,
  node: IndexedNode,
  name: AttributeNameHandle,
  text: Option.Option<string>,
  fallback: bigint,
) =>
  Option.match(text, {
    onNone: () => Effect.succeed({ rows, value: fallback }),
    onSome: (own) => spelled(rows, node, name, own),
  });

/**
 * Read the response identifier and the two association bounds of an interaction; an absent
 * `max-associations` reads as 1 and an absent `min-associations` as 0.
 *
 * The caller reads its other attributes first: the rows returned are the reader's rows at the
 * moment of the call, with the spelling rows added.
 *
 * @param attributes - The interaction's attribute reader.
 * @param node - The interaction's node.
 * @returns The bounds and the rows; `ImportRefused` (`attribute-lexical`) for a bound outside the
 *   non-negative integers.
 */
const associationsOf = Effect.fn("import.associationsOf")(function* associationsOf(
  attributes: AttributeReader,
  node: IndexedNode,
): Effect.fn.Return<{ associations: Associations; rows: Rows }, ImportRefused> {
  const max = attributes.read("max-associations");
  const min = attributes.read("min-associations");
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const maximum = yield* spelledOr(attributes.rows(), node, "max-associations", max, 1n);
  const minimum = yield* spelledOr(maximum.rows, node, "min-associations", min, 0n);

  return {
    associations: { maxN: maximum.value, minN: minimum.value, responseIdentifier },
    rows: minimum.rows,
  };
});

/**
 * Write an interaction's binding to the response variable it names, with the count it holds: the
 * interaction's `max-associations` for a gap-match, 1 for a graphic gap-match.
 */
const bind = (
  ctx: InteractionContext,
  rows: Rows,
  node: IndexedNode,
  associations: Associations,
  count: bigint,
) =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    associations.responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(associations.responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    count,
  );

/**
 * The rows of one `qti-gap-match-interaction`: the interaction, its binding and the
 * `GapMatchBinding` copied from the variable, and the optionals and markers the source wrote.
 *
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for a `shuffle` outside `xs:boolean`'s
 *   four spellings or a bound outside the non-negative integers.
 */
const gapMatch = Effect.fn("import.gapMatch")(function* gapMatch(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const shuffle = attributes.read("shuffle");
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const width = attributes.read("data-choices-container-width");
  const shuffleHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(shuffle, () => "false"),
    "attribute-lexical",
    "the shuffle attribute of qti-gap-match-interaction",
  );
  const read = yield* associationsOf(attributes, node);
  const { associations } = read;
  let built = yield* bind(ctx, read.rows, node, associations, associations.maxN);
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
      rootKind: ctx.rootKind,
      shuffle: shuffleHandle,
    },
  ]);
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
      "min-associations": GapMatchMinAssociations,
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
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const width = attributes.read("data-choices-container-width");
  const read = yield* associationsOf(attributes, node);
  const { associations } = read;
  let built = yield* bind(ctx, read.rows, node, associations, 1n);
  built = Rows.add(built, GraphicGapMatchInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: ctx.rootKind,
    },
  ]);
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
    {
      "max-associations": DeclaredGraphicGapMatchMaxAssociations,
      "min-associations": GraphicGapMatchMinAssociations,
    },
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
 *   interaction, and `ItemRefusal` for a `template-identifier` that names no typed variable;
 *   `ImportRefused` (`attribute-lexical`) for a `required` or `show-hide` outside its roster.
 */
const gap = Effect.fn("import.gap")(function* gap(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
  const requiredHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(required, () => "false"),
    "attribute-lexical",
    "the required attribute of qti-gap",
  );
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-gap",
  );
  const built = Rows.add(attributes.rows(), Gap, [
    {
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction: owner.value.id,
      required: requiredHandle,
      showHide: showHideHandle,
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
const gapOwner = (ctx: InteractionContext, element: Element): Option.Option<Uuid> =>
  ctx.shared.nearestInteraction(ctx.nodes, element).pipe(
    Option.filter(
      (owner) =>
        owner.kind === "qti-gap-match-interaction" ||
        owner.kind === "qti-graphic-gap-match-interaction",
    ),
    Option.map((owner) => owner.id),
  );

/**
 * The rows of one `qti-gap-text`: the text, its match bounds, its `match-min` marker when written,
 * its match group and its template variable.
 *
 * @returns The rows; `ItemRefusal` for a gap text that sits in no gap interaction (rule
 *   `admission`) and for a `template-identifier` that names no typed variable; `ImportRefused`
 *   (`attribute-lexical`) for a `match-max` that is absent, a `match-max` or `match-min` outside
 *   the non-negative integers, or a `show-hide` outside `show` and `hide`.
 */
const gapText = Effect.fn("import.gapText")(function* gapText(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-gap-text",
  );
  const maximum = yield* spelledRequired(attributes.rows(), node, "match-max", matchMax);
  const minimum = yield* spelledOr(maximum.rows, node, "match-min", matchMin, 0n);
  let built = Rows.add(minimum.rows, GapText, [
    {
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction: owner.value,
      matchMaxN: maximum.value,
      matchMinN: minimum.value,
      showHide: showHideHandle,
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "match-min": GapTextMatchMin, "show-hide": DeclaredGapTextShowHide },
    node.id,
    attributes.written(),
  );

  return yield* groupAndTemplate(ctx, built, attributes, node);
});

/**
 * The rows of one `qti-gap-img`: the image, its match bounds, the optionals the source wrote, its
 * match group and its template variable. The `object` or `img` it holds is the HTML rows' own.
 *
 * @returns The rows; `ItemRefusal` for a gap image that sits in no gap interaction (rule
 *   `admission`) and for a `template-identifier` that names no typed variable; `ImportRefused`
 *   (`attribute-lexical`) for a `match-max` that is absent, a `match-max` or `match-min` outside
 *   the non-negative integers, or a `show-hide` outside `show` and `hide`.
 */
const gapImg = Effect.fn("import.gapImg")(function* gapImg(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-gap-img",
  );
  const maximum = yield* spelledRequired(attributes.rows(), node, "match-max", matchMax);
  const minimum = yield* spelledOr(maximum.rows, node, "match-min", matchMin, 0n);
  let built = Rows.add(minimum.rows, GapImg, [
    {
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction: owner.value,
      matchMaxN: maximum.value,
      matchMinN: minimum.value,
      showHide: showHideHandle,
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "match-min": GapImgMatchMin, "show-hide": DeclaredGapImgShowHide },
    node.id,
    attributes.written(),
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
 *   that names no typed variable; `ImportRefused` for an association or match bound outside the
 *   non-negative integers.
 */
export const gapRows = Effect.fn("import.gapRows")(function* gapRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | UnmodeledVocabulary | ItemRefusal> {
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
