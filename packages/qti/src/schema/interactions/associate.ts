/**
 * The associate interactions: `qti-associate-interaction`, `qti-match-interaction` and
 * `qti-graphic-associate-interaction`, with the choices, sets and hotspots they own and the
 * optional values each may carry. The attributes and children are the inventory entries of the same
 * names.
 *
 * Each interaction carries the typed bounds `maxAssociationsN` and `minAssociationsN` as NOT NULL
 * columns, 1 and 0 where the source omits the attribute, beside the optional lexical
 * `max-associations` and `min-associations` relations and the markers that say the source wrote
 * them. A choice or hotspot carries `matchMax` as written and the typed `matchMaxN` and
 * `matchMinN`.
 *
 * A `qti-simple-associable-choice` sits directly under an associate interaction or under one of the
 * two `qti-simple-match-set` elements of a match interaction. Its `interaction` is the nearest
 * interaction either way, so for a choice under a set it is the grandparent, and no containment of
 * `(id, interaction)` into `Edge.(child, parent)` can hold for every choice: the arm has no column
 * a selection could use to tell the two apart, so none is written. The set form is stated on
 * `SimpleAssociableChoiceMatchSet`, whose `(node, matchSet)` and `(matchSet, interaction)` are each
 * contained into `Edge.(child, parent)`, so the grandparent copy is true there; a direct child's
 * copy is bound by `Admission` and the importer alone (campaign decision 23).
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
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { Shape } from "#qti/schema/content/rosters.ts";
import { matchBoundsCheck } from "#qti/schema/choices.ts";
import { coordsBinding, shapeCapacities } from "#qti/schema/shapes.ts";
import { InteractionBinding } from "#qti/schema/interaction.ts";
import { Edge, Node, NodeKind, RootKind } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `xs:boolean` attribute's lexical form.
 */
const xsBoolean = str.regex(patterns.xsBoolean);

/**
 * An `xs:nonNegativeInteger` attribute's lexical form.
 */
const xsNonNegativeInteger = str.regex(patterns.xsNonNegativeInteger);

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * A choice's `show-hide`: `show` or `hide`.
 */
const showHide = str.regex(patterns.showHide);

/**
 * A `qti-associate-interaction`.
 */
export const AssociateInteraction = relation(
  "AssociateInteraction",
  {
    id: uuid,
    maxAssociationsN: pg.bigint,
    minAssociationsN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    shuffle: xsBoolean,
  },
  ["id"],
);

/**
 * A `qti-match-interaction`.
 */
export const MatchInteraction = relation(
  "MatchInteraction",
  {
    id: uuid,
    maxAssociationsN: pg.bigint,
    minAssociationsN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    shuffle: xsBoolean,
  },
  ["id"],
);

/**
 * A `qti-graphic-associate-interaction`.
 */
export const GraphicAssociateInteraction = relation(
  "GraphicAssociateInteraction",
  {
    id: uuid,
    maxAssociationsN: pg.bigint,
    minAssociationsN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-simple-associable-choice`, by its identifier within the interaction that owns it.
 * `matchMax` is the attribute as written and `matchMaxN` and `matchMinN` the integer values the
 * match bounds are checked on.
 */
export const SimpleAssociableChoice = relation(
  "SimpleAssociableChoice",
  {
    id: uuid,
    identifier: ncName,
    interaction: uuid,
    matchMax: xsNonNegativeInteger,
    matchMaxN: pg.bigint,
    matchMinN: pg.bigint,
  },
  ["id"],
);

/**
 * A `qti-simple-match-set` of a match interaction.
 */
export const SimpleMatchSet = relation("SimpleMatchSet", { id: uuid }, ["id"]);

/**
 * A `qti-associable-hotspot`. `parentKind` copies its parent's node kind, so a hotspot is refused
 * where its parent is not the kind the copy claims, and `shape` is the shape its coordinates are
 * for. `showHide` is `show` where the source omits it.
 */
export const AssociableHotspot = relation(
  "AssociableHotspot",
  {
    id: uuid,
    identifier: ncName,
    interaction: uuid,
    matchMax: xsNonNegativeInteger,
    matchMaxN: pg.bigint,
    matchMinN: pg.bigint,
    parentKind: closedId(NodeKind),
    shape: closedId(Shape),
    showHide,
  },
  ["id"],
);

/**
 * The set a simple associable choice sits in, one row where the choice is a child of a
 * `qti-simple-match-set` and none where it is a child of an associate interaction. `interaction` is
 * the match interaction that owns the set.
 */
export const SimpleAssociableChoiceMatchSet = relation(
  "SimpleAssociableChoiceMatchSet",
  { interaction: uuid, matchSet: uuid, node: uuid },
  ["node"],
);

/**
 * The source wrote `shuffle` on this associate interaction.
 */
export const DeclaredAssociateShuffle = relation("DeclaredAssociateShuffle", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `max-associations` on this associate interaction.
 */
export const DeclaredAssociateMaxAssociations = relation(
  "DeclaredAssociateMaxAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `min-associations` on this associate interaction.
 */
export const DeclaredAssociateMinAssociations = relation(
  "DeclaredAssociateMinAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `shuffle` on this match interaction.
 */
export const DeclaredMatchShuffle = relation("DeclaredMatchShuffle", { node: uuid }, ["node"]);

/**
 * The source wrote `max-associations` on this match interaction.
 */
export const DeclaredMatchMaxAssociations = relation(
  "DeclaredMatchMaxAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `min-associations` on this match interaction.
 */
export const DeclaredMatchMinAssociations = relation(
  "DeclaredMatchMinAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `max-associations` on this graphic associate interaction. Its `min-associations`
 * has no default, so the optional relation alone says whether the source wrote it.
 */
export const DeclaredGraphicAssociateMaxAssociations = relation(
  "DeclaredGraphicAssociateMaxAssociations",
  { node: uuid },
  ["node"],
);

/**
 * An associate interaction's `max-associations` as written, when it has one.
 */
export const AssociateMaxAssociations = relation(
  "AssociateMaxAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * An associate interaction's `min-associations` as written, when it has one.
 */
export const AssociateMinAssociations = relation(
  "AssociateMinAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A match interaction's `max-associations` as written, when it has one.
 */
export const MatchMaxAssociations = relation(
  "MatchMaxAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A match interaction's `min-associations` as written, when it has one.
 */
export const MatchMinAssociations = relation(
  "MatchMinAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic associate interaction's `max-associations` as written, when it has one.
 */
export const GraphicAssociateMaxAssociations = relation(
  "GraphicAssociateMaxAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic associate interaction's `min-associations` as written, when it has one.
 */
export const GraphicAssociateMinAssociations = relation(
  "GraphicAssociateMinAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A match interaction's `data-min-selections-message`, when it has one.
 */
export const MatchMinSelectionsMessage = relation(
  "MatchMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A match interaction's `data-max-selections-message`, when it has one.
 */
export const MatchMaxSelectionsMessage = relation(
  "MatchMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A match interaction's `data-first-column-header`, when it has one.
 */
export const MatchFirstColumnHeader = relation(
  "MatchFirstColumnHeader",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A simple associable choice's `fixed`, when the source wrote it: the attribute has no default.
 */
export const SimpleAssociableChoiceFixed = relation(
  "SimpleAssociableChoiceFixed",
  { node: uuid, value: xsBoolean },
  ["node"],
);

/**
 * A `qti-associable-hotspot` that wrote `show-hide`.
 */
export const DeclaredAssociableHotspotShowHide = relation(
  "DeclaredAssociableHotspotShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A simple associable choice's `show-hide`, when the source wrote it: the attribute has no default.
 */
export const SimpleAssociableChoiceShowHide = relation(
  "SimpleAssociableChoiceShowHide",
  { node: uuid, value: showHide },
  ["node"],
);

/**
 * A simple associable choice's `match-min` as written, when it has one.
 */
export const SimpleAssociableChoiceMatchMin = relation(
  "SimpleAssociableChoiceMatchMin",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * An associable hotspot's `hotspot-label`, when it has one.
 */
export const AssociableHotspotLabel = relation(
  "AssociableHotspotLabel",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An associable hotspot's `match-min` as written, when it has one.
 */
export const AssociableHotspotMatchMin = relation(
  "AssociableHotspotMatchMin",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * The arms of the six associate kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are bound by one `mirrors` per handle in the composed schema.
 */
export const arms = {
  "qti-associable-hotspot": AssociableHotspot,
  "qti-associate-interaction": AssociateInteraction,
  "qti-graphic-associate-interaction": GraphicAssociateInteraction,
  "qti-match-interaction": MatchInteraction,
  "qti-simple-associable-choice": SimpleAssociableChoice,
  "qti-simple-match-set": SimpleMatchSet,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
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
};

/**
 * The statements over this module's relations: each interaction is a node of its root kind, and an
 * item's interaction has a binding for its response variable; an interaction's minimum is at most
 * its maximum unless the maximum is 0 (unbounded), and so is a choice's or hotspot's; a match
 * interaction has exactly two sets; a choice is named uniquely within its interaction, and one
 * under a set has both the set and the interaction as edge ancestors; a hotspot's coordinates are
 * those of its shape, and a graphic gap match admits no default hotspot; every marker and optional
 * value belongs to its owner.
 */
export const rules = [
  contained(on(AssociateInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(AssociateInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("AssociateBounds", AssociateInteraction, (r) =>
    r.or(r.eq(r.maxAssociationsN, 0n), r.le(r.minAssociationsN, r.maxAssociationsN)),
  ),
  contained(on(MatchInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(MatchInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("MatchBounds", MatchInteraction, (r) =>
    r.or(r.eq(r.maxAssociationsN, 0n), r.le(r.minAssociationsN, r.maxAssociationsN)),
  ),
  capacity(on(MatchInteraction, "id"), {
    from: on(select(Edge, { childKind: "qti-simple-match-set" }), "parent"),
    within: within(2n, 2n),
  }),
  contained(on(GraphicAssociateInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(GraphicAssociateInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("GraphicAssociateBounds", GraphicAssociateInteraction, (r) =>
    r.or(r.eq(r.maxAssociationsN, 0n), r.le(r.minAssociationsN, r.maxAssociationsN)),
  ),
  key(SimpleAssociableChoice, ["interaction", "identifier"]),
  matchBoundsCheck("SimpleAssociableChoiceBounds", SimpleAssociableChoice),
  contained(on(SimpleAssociableChoiceMatchSet, "node"), on(SimpleAssociableChoice, "id")),
  contained(
    on(SimpleAssociableChoiceMatchSet, "node", "interaction"),
    on(SimpleAssociableChoice, "id", "interaction"),
  ),
  contained(on(SimpleAssociableChoiceMatchSet, "matchSet"), on(SimpleMatchSet, "id")),
  contained(on(SimpleAssociableChoiceMatchSet, "node", "matchSet"), on(Edge, "child", "parent")),
  contained(
    on(SimpleAssociableChoiceMatchSet, "matchSet", "interaction"),
    on(Edge, "child", "parent"),
  ),
  key(AssociableHotspot, ["interaction", "identifier"]),
  contained(on(AssociableHotspot, "id", "parentKind"), on(Edge, "child", "parentKind")),
  contained(on(AssociableHotspot, "id", "interaction"), on(Edge, "child", "parent")),
  coordsBinding(AssociableHotspot, "qti-associable-hotspot"),
  ...shapeCapacities(AssociableHotspot),
  matchBoundsCheck("AssociableHotspotBounds", AssociableHotspot),
  check("NoDefaultHotspotInGraphicGapMatch", AssociableHotspot, (r) =>
    r.or(r.ne(r.parentKind, "qti-graphic-gap-match-interaction"), r.ne(r.shape, "default")),
  ),
  contained(on(DeclaredAssociateShuffle, "node"), on(AssociateInteraction, "id")),
  contained(on(DeclaredAssociateMaxAssociations, "node"), on(AssociateInteraction, "id")),
  contained(on(DeclaredAssociateMinAssociations, "node"), on(AssociateInteraction, "id")),
  contained(on(AssociateMaxAssociations, "node"), on(AssociateInteraction, "id")),
  contained(on(AssociateMinAssociations, "node"), on(AssociateInteraction, "id")),
  contained(on(DeclaredMatchShuffle, "node"), on(MatchInteraction, "id")),
  contained(on(DeclaredMatchMaxAssociations, "node"), on(MatchInteraction, "id")),
  contained(on(DeclaredMatchMinAssociations, "node"), on(MatchInteraction, "id")),
  contained(on(MatchMaxAssociations, "node"), on(MatchInteraction, "id")),
  contained(on(MatchMinAssociations, "node"), on(MatchInteraction, "id")),
  contained(on(MatchMinSelectionsMessage, "node"), on(MatchInteraction, "id")),
  contained(on(MatchMaxSelectionsMessage, "node"), on(MatchInteraction, "id")),
  contained(on(MatchFirstColumnHeader, "node"), on(MatchInteraction, "id")),
  contained(
    on(DeclaredGraphicAssociateMaxAssociations, "node"),
    on(GraphicAssociateInteraction, "id"),
  ),
  contained(on(GraphicAssociateMaxAssociations, "node"), on(GraphicAssociateInteraction, "id")),
  contained(on(GraphicAssociateMinAssociations, "node"), on(GraphicAssociateInteraction, "id")),
  contained(on(SimpleAssociableChoiceFixed, "node"), on(SimpleAssociableChoice, "id")),
  contained(on(SimpleAssociableChoiceShowHide, "node"), on(SimpleAssociableChoice, "id")),
  contained(on(SimpleAssociableChoiceMatchMin, "node"), on(SimpleAssociableChoice, "id")),
  contained(on(AssociableHotspotLabel, "node"), on(AssociableHotspot, "id")),
  contained(on(AssociableHotspotMatchMin, "node"), on(AssociableHotspot, "id")),
  contained(on(DeclaredAssociableHotspotShowHide, "node"), on(AssociableHotspot, "id")),
] as const;
