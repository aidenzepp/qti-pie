/**
 * The gap-match interactions: `qti-gap-match-interaction` and `qti-graphic-gap-match-interaction`,
 * with the `qti-gap`, `qti-gap-text` and `qti-gap-img` they own and the optional values each may
 * carry. The attributes and children are the inventory entries of the same names.
 *
 * Each interaction carries the typed bounds `maxAssociationsN` and `minAssociationsN` as NOT NULL
 * columns, 1 and 0 where the source omits the attribute, beside the optional lexical
 * `max-associations` and `min-associations` relations and the markers that say the source wrote
 * them. A gap text or gap image carries `matchMax` as written and the typed `matchMaxN` and
 * `matchMinN`.
 *
 * A `qti-gap` sits in the text of a gap-match interaction at any depth, so its `interaction` is the
 * owner copy the importer writes and no containment into `Edge` can hold for it. A gap text or gap
 * image is a direct child of its interaction, so its copy is contained into `Edge.(child, parent)`.
 * A gap-match interaction's gaps bound its response variable: a single-cardinality variable takes
 * at most one gap.
 *
 * The `match-group` and `template-identifier` attributes of the three choices are the shared
 * `MatchGroup` and `ChoiceTemplateRef` of `choices.ts`, so no relation here repeats them.
 */
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
import { matchBoundsCheck } from "#qti/schema/choices.ts";
import { GapMatchBinding, InteractionBinding } from "#qti/schema/interaction.ts";
import { Edge, Node, RootKind } from "#qti/schema/node.ts";
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
 * An `xs:string` attribute's value, whitespace preserved.
 */
const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

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
 * A `qti-gap-match-interaction`.
 */
export const GapMatchInteraction = relation(
  "GapMatchInteraction",
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
 * A `qti-graphic-gap-match-interaction`.
 */
export const GraphicGapMatchInteraction = relation(
  "GraphicGapMatchInteraction",
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
 * A `qti-gap`, by its identifier within the gap-match interaction that owns it. `interaction` is
 * the importer-written owner copy at any depth. `required` is `false` where the source omits it,
 * and `showHide` is `show`.
 */
export const Gap = relation(
  "Gap",
  { id: uuid, identifier: ncName, interaction: uuid, required: xsBoolean, showHide },
  ["id"],
);

/**
 * A `qti-gap-text`, by its identifier within the interaction that owns it. `matchMax` is the
 * attribute as written and `matchMaxN` and `matchMinN` the integer values the match bounds are
 * checked on. `showHide` is `show` where the source omits it.
 */
export const GapText = relation(
  "GapText",
  {
    id: uuid,
    identifier: ncName,
    interaction: uuid,
    matchMax: xsNonNegativeInteger,
    matchMaxN: pg.bigint,
    matchMinN: pg.bigint,
    showHide,
  },
  ["id"],
);

/**
 * A `qti-gap-img`: a gap text's fields, the same way, `showHide` included.
 */
export const GapImg = relation(
  "GapImg",
  {
    id: uuid,
    identifier: ncName,
    interaction: uuid,
    matchMax: xsNonNegativeInteger,
    matchMaxN: pg.bigint,
    matchMinN: pg.bigint,
    showHide,
  },
  ["id"],
);

/**
 * The source wrote `shuffle` on this gap-match interaction.
 */
export const DeclaredGapMatchShuffle = relation("DeclaredGapMatchShuffle", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `max-associations` on this gap-match interaction. Its `min-associations` has no
 * default, so the optional relation alone says whether the source wrote it.
 */
export const DeclaredGapMatchMaxAssociations = relation(
  "DeclaredGapMatchMaxAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `max-associations` on this graphic gap-match interaction. Its `min-associations`
 * has no default, so the optional relation alone says whether the source wrote it.
 */
export const DeclaredGraphicGapMatchMaxAssociations = relation(
  "DeclaredGraphicGapMatchMaxAssociations",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `required` on this gap.
 */
export const DeclaredGapRequired = relation("DeclaredGapRequired", { node: uuid }, ["node"]);

/**
 * A `qti-gap` that wrote `show-hide`.
 */
export const DeclaredGapShowHide = relation("DeclaredGapShowHide", { node: uuid }, ["node"]);

/**
 * A `qti-gap-text` that wrote `show-hide`.
 */
export const DeclaredGapTextShowHide = relation("DeclaredGapTextShowHide", { node: uuid }, [
  "node",
]);

/**
 * A `qti-gap-img` that wrote `show-hide`.
 */
export const DeclaredGapImgShowHide = relation("DeclaredGapImgShowHide", { node: uuid }, ["node"]);

/**
 * A gap-match interaction's `max-associations` as written, when it has one.
 */
export const GapMatchMaxAssociations = relation(
  "GapMatchMaxAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A gap-match interaction's `min-associations` as written, when it has one.
 */
export const GapMatchMinAssociations = relation(
  "GapMatchMinAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A gap-match interaction's `data-min-selections-message`, when it has one.
 */
export const GapMatchMinSelectionsMessage = relation(
  "GapMatchMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A gap-match interaction's `data-max-selections-message`, when it has one.
 */
export const GapMatchMaxSelectionsMessage = relation(
  "GapMatchMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A gap-match interaction's `data-choices-container-width` as written, when it has one.
 */
export const GapMatchChoicesContainerWidth = relation(
  "GapMatchChoicesContainerWidth",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic gap-match interaction's `max-associations` as written, when it has one.
 */
export const GraphicGapMatchMaxAssociations = relation(
  "GraphicGapMatchMaxAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic gap-match interaction's `min-associations` as written, when it has one.
 */
export const GraphicGapMatchMinAssociations = relation(
  "GraphicGapMatchMinAssociations",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic gap-match interaction's `data-min-selections-message`, when it has one.
 */
export const GraphicGapMatchMinSelectionsMessage = relation(
  "GraphicGapMatchMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A graphic gap-match interaction's `data-max-selections-message`, when it has one.
 */
export const GraphicGapMatchMaxSelectionsMessage = relation(
  "GraphicGapMatchMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * A graphic gap-match interaction's `data-choices-container-width` as written, when it has one.
 */
export const GraphicGapMatchChoicesContainerWidth = relation(
  "GraphicGapMatchChoicesContainerWidth",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A gap text's `match-min` as written, when it has one.
 */
export const GapTextMatchMin = relation(
  "GapTextMatchMin",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A gap image's `match-min` as written, when it has one.
 */
export const GapImgMatchMin = relation(
  "GapImgMatchMin",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A gap image's `object-label`, when it has one.
 */
export const GapImgObjectLabel = relation("GapImgObjectLabel", { node: uuid, value: xsString }, [
  "node",
]);

/**
 * A gap image's `top`, when it has one. The inventory states no format, so the column holds the
 * attribute after replacement.
 */
export const GapImgTop = relation("GapImgTop", { node: uuid, value: xsNormalizedString }, ["node"]);

/**
 * A gap image's `left`, when it has one. The inventory states no format, so the column holds the
 * attribute after replacement.
 */
export const GapImgLeft = relation("GapImgLeft", { node: uuid, value: xsNormalizedString }, [
  "node",
]);

/**
 * The arms of the five gap kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are expanded by `alternatives` in the composed schema.
 */
export const arms = {
  "qti-gap": Gap,
  "qti-gap-img": GapImg,
  "qti-gap-match-interaction": GapMatchInteraction,
  "qti-gap-text": GapText,
  "qti-graphic-gap-match-interaction": GraphicGapMatchInteraction,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
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
};

/**
 * The statements over this module's relations: each interaction is a node of its root kind, and an
 * item's interaction has a binding for its response variable; an interaction's minimum is at most
 * its maximum unless the maximum is 0 (unbounded), and so is a gap text's or gap image's; a gap
 * belongs to a gap-match interaction and a single-cardinality binding of one takes at most one
 * gap; a gap, gap text and gap image are named uniquely within their interaction, and the last two
 * are its edge children; every marker and optional value belongs to its owner.
 */
export const rules = [
  contained(on(GapMatchInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(GapMatchInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("GapMatchBounds", GapMatchInteraction, (r) =>
    r.or(r.eq(r.maxAssociationsN, 0n), r.le(r.minAssociationsN, r.maxAssociationsN)),
  ),
  contained(on(GraphicGapMatchInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(GraphicGapMatchInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("GraphicGapMatchBounds", GraphicGapMatchInteraction, (r) =>
    r.or(r.eq(r.maxAssociationsN, 0n), r.le(r.minAssociationsN, r.maxAssociationsN)),
  ),
  key(Gap, ["interaction", "identifier"]),
  contained(on(Gap, "interaction"), on(GapMatchInteraction, "id")),
  capacity(on(select(GapMatchBinding, { cardinality: "single" }), "node"), {
    from: on(Gap, "interaction"),
    within: within(0n, 1n),
  }),
  key(GapText, ["interaction", "identifier"]),
  contained(on(GapText, "id", "interaction"), on(Edge, "child", "parent")),
  matchBoundsCheck("GapTextBounds", GapText),
  key(GapImg, ["interaction", "identifier"]),
  contained(on(GapImg, "id", "interaction"), on(Edge, "child", "parent")),
  matchBoundsCheck("GapImgBounds", GapImg),
  contained(on(DeclaredGapMatchShuffle, "node"), on(GapMatchInteraction, "id")),
  contained(on(DeclaredGapMatchMaxAssociations, "node"), on(GapMatchInteraction, "id")),
  contained(on(GapMatchMaxAssociations, "node"), on(GapMatchInteraction, "id")),
  contained(on(GapMatchMinAssociations, "node"), on(GapMatchInteraction, "id")),
  contained(on(GapMatchMinSelectionsMessage, "node"), on(GapMatchInteraction, "id")),
  contained(on(GapMatchMaxSelectionsMessage, "node"), on(GapMatchInteraction, "id")),
  contained(on(GapMatchChoicesContainerWidth, "node"), on(GapMatchInteraction, "id")),
  contained(
    on(DeclaredGraphicGapMatchMaxAssociations, "node"),
    on(GraphicGapMatchInteraction, "id"),
  ),
  contained(on(GraphicGapMatchMaxAssociations, "node"), on(GraphicGapMatchInteraction, "id")),
  contained(on(GraphicGapMatchMinAssociations, "node"), on(GraphicGapMatchInteraction, "id")),
  contained(on(GraphicGapMatchMinSelectionsMessage, "node"), on(GraphicGapMatchInteraction, "id")),
  contained(on(GraphicGapMatchMaxSelectionsMessage, "node"), on(GraphicGapMatchInteraction, "id")),
  contained(on(GraphicGapMatchChoicesContainerWidth, "node"), on(GraphicGapMatchInteraction, "id")),
  contained(on(DeclaredGapRequired, "node"), on(Gap, "id")),
  contained(on(DeclaredGapShowHide, "node"), on(Gap, "id")),
  contained(on(DeclaredGapTextShowHide, "node"), on(GapText, "id")),
  contained(on(DeclaredGapImgShowHide, "node"), on(GapImg, "id")),
  contained(on(GapTextMatchMin, "node"), on(GapText, "id")),
  contained(on(GapImgMatchMin, "node"), on(GapImg, "id")),
  contained(on(GapImgObjectLabel, "node"), on(GapImg, "id")),
  contained(on(GapImgTop, "node"), on(GapImg, "id")),
  contained(on(GapImgLeft, "node"), on(GapImg, "id")),
] as const;
