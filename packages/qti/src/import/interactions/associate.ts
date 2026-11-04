/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the hotspot and `Coords` rows name, and `ShapeHandle` the roster; the shape here is a geometric one, not a structure. */

/**
 * The rows of the associate interactions: associate, match and graphic-associate, with the sets,
 * choices and hotspots they own.
 *
 * Every `qti-associable-hotspot` is written here, whatever interaction holds it: its `parentKind`
 * copy is what tells a graphic associate's hotspot from a graphic gap match's.
 */
import { judgedLater } from "#qti/import/judged.ts";
import { Effect, Option } from "effect";
import type { AttributeReader, InteractionContext } from "#qti/import/interactions.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { closedOf, ItemRefusal, Rows, spelledInteger, withParents } from "#qti/import/tree.ts";
import type { IndexedNode, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { MatchGroup } from "#qti/schema/choices.ts";
import { Shape, ShowHide, XsBoolean } from "#qti/schema/content/rosters.ts";
import type { ShapeHandle } from "#qti/schema/content/rosters.ts";
import { ChoiceIdentifier } from "#qti/schema/contracts.ts";
import {
  AssociableHotspot,
  AssociableHotspotLabel,
  AssociableHotspotMatchMin,
  AssociateInteraction,
  DeclaredAssociableHotspotShowHide,
  DeclaredAssociateMaxAssociations,
  DeclaredAssociateMinAssociations,
  DeclaredAssociateShuffle,
  DeclaredGraphicAssociateMaxAssociations,
  DeclaredMatchMaxAssociations,
  DeclaredMatchMinAssociations,
  DeclaredMatchShuffle,
  GraphicAssociateInteraction,
  GraphicAssociateMinAssociations,
  MatchFirstColumnHeader,
  MatchInteraction,
  MatchMaxSelectionsMessage,
  MatchMinSelectionsMessage,
  SimpleAssociableChoice,
  SimpleAssociableChoiceFixed,
  SimpleAssociableChoiceMatchMin,
  SimpleAssociableChoiceMatchSet,
  SimpleAssociableChoiceShowHide,
  SimpleMatchSet,
} from "#qti/schema/interactions/associate.ts";
import type { AttributeNameHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

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
    associations.maxN,
  );

/**
 * The rows of one `qti-associate-interaction` and its binding.
 *
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for a `shuffle` outside `xs:boolean`'s
 *   four spellings or a bound outside the non-negative integers.
 */
const associate = Effect.fn("import.associate")(function* associate(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const shuffle = attributes.read("shuffle");
  const shuffleHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(shuffle, () => "false"),
    "attribute-lexical",
    "the shuffle attribute of qti-associate-interaction",
  );
  const read = yield* associationsOf(attributes, node);
  const { associations } = read;
  let built = yield* bind(ctx, read.rows, node, associations);
  built = Rows.add(built, AssociateInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
      shuffle: shuffleHandle,
    },
  ]);

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
 *
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for a `shuffle` outside `xs:boolean`'s
 *   four spellings or a bound outside the non-negative integers.
 */
const match = Effect.fn("import.match")(function* match(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const shuffle = attributes.read("shuffle");
  const minMessage = attributes.read("data-min-selections-message");
  const maxMessage = attributes.read("data-max-selections-message");
  const header = attributes.read("data-first-column-header");
  const shuffleHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(shuffle, () => "false"),
    "attribute-lexical",
    "the shuffle attribute of qti-match-interaction",
  );
  const read = yield* associationsOf(attributes, node);
  const { associations } = read;
  let built = yield* bind(ctx, read.rows, node, associations);
  built = Rows.add(built, MatchInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
      shuffle: shuffleHandle,
    },
  ]);
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
 * default marker beside `DeclaredGraphicAssociateMaxAssociations`:
 * `GraphicAssociateMinAssociations` says the source wrote it.
 */
const graphicAssociate = Effect.fn("import.graphicAssociate")(function* graphicAssociate(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const read = yield* associationsOf(attributes, node);
  const { associations } = read;
  let built = yield* bind(ctx, read.rows, node, associations);
  built = Rows.add(built, GraphicAssociateInteraction, [
    {
      id: node.id,
      maxAssociationsN: associations.maxN,
      minAssociationsN: associations.minN,
      responseIdentifier: associations.responseIdentifier,
      rootKind: "item",
    },
  ]);

  return ctx.shared.markers(
    built,
    {
      "max-associations": DeclaredGraphicAssociateMaxAssociations,
      "min-associations": GraphicAssociateMinAssociations,
    },
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
 *   for a `template-identifier` that names no typed variable; `ImportRefused`
 *   (`attribute-lexical`) for a `match-max` that is absent, a `match-max` or `match-min` outside
 *   the non-negative integers, a `fixed` outside `xs:boolean`'s four spellings, or a `show-hide`
 *   outside `show` and `hide`.
 */
const choice = Effect.fn("import.associableChoice")(function* choice(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
  const fixedHandle = Option.isSome(fixed)
    ? Option.some(
        yield* closedOf(
          XsBoolean.handles,
          fixed.value,
          "attribute-lexical",
          "the fixed attribute of qti-simple-associable-choice",
        ),
      )
    : Option.none();
  const showHideHandle = Option.isSome(showHide)
    ? Option.some(
        yield* closedOf(
          ShowHide.handles,
          showHide.value,
          "attribute-lexical",
          "the show-hide attribute of qti-simple-associable-choice",
        ),
      )
    : Option.none();
  const maximum = yield* spelledRequired(attributes.rows(), node, "match-max", matchMax);
  const minimum = yield* spelledOr(maximum.rows, node, "match-min", matchMin, 0n);
  let built = minimum.rows;
  built = Rows.add(built, SimpleAssociableChoice, [
    {
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction: owner.value.id,
      matchMaxN: maximum.value,
      matchMinN: minimum.value,
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
  built = ctx.shared.markers(
    built,
    { "match-min": SimpleAssociableChoiceMatchMin },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    SimpleAssociableChoiceFixed,
    written(fixedHandle, (own) => ({ node: node.id, value: own })),
  );
  built = Rows.add(
    built,
    SimpleAssociableChoiceShowHide,
    written(showHideHandle, (own) => ({ node: node.id, value: own })),
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
 *   interaction (rule `admission`); `ImportRefused` (`attribute-lexical`) for a `match-max` that is
 *   absent, a `match-max` or `match-min` outside the non-negative integers, or a `show-hide`
 *   outside `show` and `hide`.
 *   A hotspot with no `coords` has no `Coords` row, and the shape's capacity refuses it at commit.
 */
const hotspot = Effect.fn("import.associableHotspot")(function* hotspot(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-associable-hotspot",
  );
  const maximum = yield* spelledRequired(attributes.rows(), node, "match-max", matchMax);
  const minimum = yield* spelledOr(maximum.rows, node, "match-min", matchMin, 0n);
  let built = minimum.rows;
  built = Rows.add(built, AssociableHotspot, [
    {
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction: owner.value.id,
      matchMaxN: maximum.value,
      matchMinN: minimum.value,
      parentKind: parent.value.kind,
      shape: shape.value,
      showHide: showHideHandle,
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "match-min": AssociableHotspotMatchMin, "show-hide": DeclaredAssociableHotspotShowHide },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    AssociableHotspotLabel,
    written(label, (own) => ({ node: node.id, value: judgedLater(own) })),
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
 *   `template-identifier` names no typed variable, and a hotspot with no valid shape;
 *   `ImportRefused` for an association or match bound outside the non-negative integers.
 */
export const associateRows = Effect.fn("import.associateRows")(function* associateRows(
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
