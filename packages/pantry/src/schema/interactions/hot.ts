/**
 * The hot interactions: `qti-hottext-interaction`, `qti-hotspot-interaction`,
 * `qti-select-point-interaction` and `qti-position-object-interaction`, with the `qti-hottext`,
 * `qti-hotspot-choice` and `qti-position-object-stage` they own or sit in, and the optional values
 * each may carry. The attributes and children are the inventory entries of the same names.
 *
 * Each interaction carries the typed bounds `maxChoicesN` and `minChoicesN` as NOT NULL columns,
 * beside the markers that say the source wrote them; a non-canonical spelling of either is an
 * `AttributeSpelling` row. The defaults are the XSD's: `max-choices` is 1 and `min-choices` is 0,
 * except that a select-point interaction's `max-choices` is 0 and a position-object interaction's
 * `min-choices` has no default, so its marker alone says whether the source wrote it and its typed
 * bound is 0 where the source omits it.
 *
 * A `qti-hottext` may sit outside a hottext interaction, because the XSD admits it under any inline
 * host, so the arm holds the identifier alone and no owner copy. `HottextOwner` is a row of its own
 * relation, written exactly when the nearest enclosing interaction is a hottext interaction: it
 * holds the key `(interaction, identifier)` that makes the identifier unique within the
 * interaction, and binds its `(node, identifier)` into the arm. The interaction the owner names is
 * the nearest enclosing one at any depth, so no containment into `Edge` can hold for it.
 *
 * A `qti-hotspot-choice` is a direct child of its interaction, a hotspot interaction or a graphic
 * order interaction, so its copy is contained into `Edge.(child, parent)`. Its coordinates are the
 * shared `Coords` rows: the binding and the five capacities are `shapes.ts`'s helpers over this
 * arm. The two capacities that bound a graphic order interaction's choices by its typed bounds are
 * declared here, where both sides are imported.
 *
 * The `template-identifier` attribute of a hottext and a hotspot choice is the shared
 * `ChoiceTemplateRef` of `choices.ts`, so no relation here repeats it. A position-object
 * interaction's `center-point` is an anonymous `xs:list` of `xs:int` with no minimum length, so its
 * pattern admits the empty list. The position-object interaction has no `xml:base`, and the stage
 * holds nothing but its `id`: the image and the interactions are its children.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `Shape`, `shape` and `shapeCapacities` are the roster and helper names `shapes.ts` fixes and the `shape` column is the contract the hotspot arms share; the shape here is a geometric one, not a structure. */
import {
  capacity,
  check,
  closedId,
  contained,
  key,
  on,
  pg,
  ref,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { Shape, ShowHide } from "#pantry/schema/content/rosters.ts";
import { GraphicOrderInteraction } from "#pantry/schema/interactions/order.ts";
import { InteractionBinding } from "#pantry/schema/interaction.ts";
import { Edge, Node, RootKind } from "#pantry/schema/node.ts";
import { ChoiceIdentifier } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { coordsBinding, shapeCapacities } from "#pantry/schema/shapes.ts";

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * A `center-point`: a list of `xs:int` tokens, possibly empty.
 */
const integerList = str.regex(patterns.integerList);

/**
 * A `qti-hottext-interaction`. `maxChoicesN` is 1 and `minChoicesN` is 0 where the source omits
 * the attributes; a `maxChoicesN` of 0 is unbounded.
 */
export const HottextInteraction = relation(
  "HottextInteraction",
  {
    id: uuid,
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-hottext`, by the identifier its owner, where it has one, keys. `showHide` is `show` where
 * the source omits it.
 */
export const Hottext = relation(
  "Hottext",
  { id: uuid, identifier: ChoiceIdentifier, showHide: closedId(ShowHide) },
  ["id"],
);

/**
 * The hottext interaction that owns a hottext: one row where the nearest enclosing interaction of
 * the hottext is a hottext interaction, and none where it sits outside every interaction.
 */
export const HottextOwner = relation(
  "HottextOwner",
  { identifier: ChoiceIdentifier, interaction: uuid, node: uuid },
  ["node"],
);

/**
 * A `qti-hotspot-interaction`. `maxChoicesN` is 1 and `minChoicesN` is 0 where the source omits
 * the attributes; a `maxChoicesN` of 0 is unbounded.
 */
export const HotspotInteraction = relation(
  "HotspotInteraction",
  {
    id: uuid,
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-hotspot-choice`, by its identifier within the interaction that owns it. `shape` is the
 * shape its coordinates are for. `showHide` is `show` where the source omits it.
 */
export const HotspotChoice = relation(
  "HotspotChoice",
  {
    id: uuid,
    identifier: ChoiceIdentifier,
    interaction: uuid,
    shape: closedId(Shape),
    showHide: closedId(ShowHide),
  },
  ["id"],
);

/**
 * A `qti-select-point-interaction`: an empty element of an image. `maxChoicesN` is 0, unbounded,
 * and `minChoicesN` is 0 where the source omits the attributes.
 */
export const SelectPointInteraction = relation(
  "SelectPointInteraction",
  {
    id: uuid,
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-position-object-stage`: the image the position-object interactions share, and those
 * interactions.
 */
export const PositionObjectStage = relation("PositionObjectStage", { id: uuid }, ["id"]);

/**
 * A `qti-position-object-interaction`. `maxChoicesN` is 1 where the source omits the attribute and
 * `minChoicesN` is 0 where it omits its own, which has no default.
 */
export const PositionObjectInteraction = relation(
  "PositionObjectInteraction",
  {
    id: uuid,
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * The source wrote `max-choices` on this hottext interaction.
 */
export const DeclaredHottextMaxChoices = relation("DeclaredHottextMaxChoices", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `min-choices` on this hottext interaction.
 */
export const DeclaredHottextMinChoices = relation("DeclaredHottextMinChoices", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `max-choices` on this hotspot interaction.
 */
export const DeclaredHotspotMaxChoices = relation("DeclaredHotspotMaxChoices", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `min-choices` on this hotspot interaction.
 */
export const DeclaredHotspotMinChoices = relation("DeclaredHotspotMinChoices", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `max-choices` on this select-point interaction.
 */
export const DeclaredSelectPointMaxChoices = relation(
  "DeclaredSelectPointMaxChoices",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `min-choices` on this select-point interaction.
 */
export const DeclaredSelectPointMinChoices = relation(
  "DeclaredSelectPointMinChoices",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `max-choices` on this position-object interaction.
 */
export const DeclaredPositionObjectMaxChoices = relation(
  "DeclaredPositionObjectMaxChoices",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `min-choices` on this position-object interaction. It has no default, so this
 * row alone says whether the source wrote it.
 */
export const PositionObjectMinChoices = relation("PositionObjectMinChoices", { node: uuid }, [
  "node",
]);

/**
 * A hottext interaction's `data-min-selections-message`, when it has one.
 */
export const HottextMinSelectionsMessage = relation(
  "HottextMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A hottext interaction's `data-max-selections-message`, when it has one.
 */
export const HottextMaxSelectionsMessage = relation(
  "HottextMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A hotspot interaction's `data-min-selections-message`, when it has one.
 */
export const HotspotMinSelectionsMessage = relation(
  "HotspotMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A hotspot interaction's `data-max-selections-message`, when it has one.
 */
export const HotspotMaxSelectionsMessage = relation(
  "HotspotMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A hotspot choice's `hotspot-label`, when it has one.
 */
export const HotspotChoiceLabel = relation(
  "HotspotChoiceLabel",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A position-object interaction's `center-point`, when it has one.
 */
export const PositionObjectCenterPoint = relation(
  "PositionObjectCenterPoint",
  { node: uuid, value: integerList },
  ["node"],
);

/**
 * A `qti-hottext` that wrote `show-hide`.
 */
export const DeclaredHottextShowHide = relation("DeclaredHottextShowHide", { node: uuid }, [
  "node",
]);

/**
 * A `qti-hotspot-choice` that wrote `show-hide`.
 */
export const DeclaredHotspotChoiceShowHide = relation(
  "DeclaredHotspotChoiceShowHide",
  { node: uuid },
  ["node"],
);

/**
 * The arms of the seven hot kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are bound by one `mirrors` per handle in the composed schema.
 */
export const arms = {
  "qti-hotspot-choice": HotspotChoice,
  "qti-hotspot-interaction": HotspotInteraction,
  "qti-hottext": Hottext,
  "qti-hottext-interaction": HottextInteraction,
  "qti-position-object-interaction": PositionObjectInteraction,
  "qti-position-object-stage": PositionObjectStage,
  "qti-select-point-interaction": SelectPointInteraction,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  DeclaredHotspotChoiceShowHide,
  DeclaredHotspotMaxChoices,
  DeclaredHotspotMinChoices,
  DeclaredHottextMaxChoices,
  DeclaredHottextMinChoices,
  DeclaredHottextShowHide,
  DeclaredPositionObjectMaxChoices,
  DeclaredSelectPointMaxChoices,
  DeclaredSelectPointMinChoices,
  HotspotChoice,
  HotspotChoiceLabel,
  HotspotInteraction,
  HotspotMaxSelectionsMessage,
  HotspotMinSelectionsMessage,
  Hottext,
  HottextInteraction,
  HottextMaxSelectionsMessage,
  HottextMinSelectionsMessage,
  HottextOwner,
  PositionObjectCenterPoint,
  PositionObjectInteraction,
  PositionObjectMinChoices,
  PositionObjectStage,
  SelectPointInteraction,
};

/**
 * The statements over this module's relations: each interaction is a node of its root kind, and an
 * item's interaction has a binding for its response variable; an interaction's minimum is at most
 * its maximum unless the maximum is 0 (unbounded); a hottext's owner is named uniquely within its
 * hottext interaction and binds its identifier into the hottext; a hotspot choice is named uniquely
 * within its interaction, is the edge child of it, and has the coordinates of its shape; a bounded
 * graphic order interaction has at least as many hotspot choices as its maximum and as its minimum;
 * every marker and optional value belongs to its owner.
 */
export const rules = [
  contained(on(HottextInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(HottextInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("HottextChoiceBounds", HottextInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  key(HottextOwner, ["interaction", "identifier"]),
  contained(on(HottextOwner, "node", "identifier"), on(Hottext, "id", "identifier")),
  contained(on(HottextOwner, "interaction"), on(HottextInteraction, "id")),
  contained(on(HotspotInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(HotspotInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("HotspotChoiceBounds", HotspotInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  key(HotspotChoice, ["interaction", "identifier"]),
  contained(on(HotspotChoice, "id", "interaction"), on(Edge, "child", "parent")),
  coordsBinding(HotspotChoice, "qti-hotspot-choice"),
  ...shapeCapacities(HotspotChoice),
  capacity(on(select(GraphicOrderInteraction, { maxBound: "bounded" }), "id"), {
    from: on(HotspotChoice, "interaction"),
    within: within(ref("maxChoicesN"), "*"),
  }),
  capacity(on(select(GraphicOrderInteraction, { maxBound: "bounded" }), "id"), {
    from: on(HotspotChoice, "interaction"),
    within: within(ref("minChoicesN"), "*"),
  }),
  contained(on(SelectPointInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(SelectPointInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("SelectPointChoiceBounds", SelectPointInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  contained(on(PositionObjectInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(PositionObjectInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("PositionObjectChoiceBounds", PositionObjectInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  contained(on(DeclaredHottextMaxChoices, "node"), on(HottextInteraction, "id")),
  contained(on(DeclaredHottextMinChoices, "node"), on(HottextInteraction, "id")),
  contained(on(HottextMinSelectionsMessage, "node"), on(HottextInteraction, "id")),
  contained(on(HottextMaxSelectionsMessage, "node"), on(HottextInteraction, "id")),
  contained(on(DeclaredHotspotMaxChoices, "node"), on(HotspotInteraction, "id")),
  contained(on(DeclaredHotspotMinChoices, "node"), on(HotspotInteraction, "id")),
  contained(on(HotspotMinSelectionsMessage, "node"), on(HotspotInteraction, "id")),
  contained(on(HotspotMaxSelectionsMessage, "node"), on(HotspotInteraction, "id")),
  contained(on(HotspotChoiceLabel, "node"), on(HotspotChoice, "id")),
  contained(on(DeclaredHotspotChoiceShowHide, "node"), on(HotspotChoice, "id")),
  contained(on(DeclaredHottextShowHide, "node"), on(Hottext, "id")),
  contained(on(DeclaredSelectPointMaxChoices, "node"), on(SelectPointInteraction, "id")),
  contained(on(DeclaredSelectPointMinChoices, "node"), on(SelectPointInteraction, "id")),
  contained(on(DeclaredPositionObjectMaxChoices, "node"), on(PositionObjectInteraction, "id")),
  contained(on(PositionObjectMinChoices, "node"), on(PositionObjectInteraction, "id")),
  contained(on(PositionObjectCenterPoint, "node"), on(PositionObjectInteraction, "id")),
] as const;
