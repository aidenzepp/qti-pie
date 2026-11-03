/**
 * The order interactions: `qti-order-interaction` and `qti-graphic-order-interaction`, with the
 * optional values each may carry. The attributes and children are the inventory entries of the same
 * names.
 *
 * Both arms carry the typed bounds `maxChoicesN` and `minChoicesN` as NOT NULL columns, 0 where the
 * source omits the attribute, beside the optional lexical `max-choices` and `min-choices`
 * relations. A capacity's `ref` must name a field of its target, so the typed copy is a column of
 * the arm and not only the optional relation `OrderMaxChoicesN`. The importer writes the optional
 * typed copies when the attribute is present, and `maxBound` is `bounded` when `max-choices` is
 * present and non-zero, else `unlimited`.
 *
 * The capacity of the graphic arm over `HotspotChoice.interaction` is declared in
 * `interactions/hot.ts`, where both sides are imported, and not here; the order arm's capacity over
 * `SimpleChoice.interaction` is below. A `qti-simple-choice` is bound to its owner by
 * `Edge.(child, parent)` and `Admission` alone (campaign decision 23), so no containment of
 * `SimpleChoice.(interaction)` into this arm is written.
 */
import {
  capacity,
  check,
  closedId,
  contained,
  on,
  pg,
  ref,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { Bound } from "#qti/schema/content/rosters.ts";
import { InteractionBinding, SimpleChoice } from "#qti/schema/interaction.ts";
import { Node, RootKind } from "#qti/schema/node.ts";
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
 * An `xs:positiveInteger` attribute's lexical form.
 */
const positiveInteger = str.regex(patterns.positiveInteger);

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * An `orientation`: `vertical` or `horizontal`.
 */
const orientation = str.regex(patterns.orientation);

/**
 * A `qti-order-interaction`. `maxBound` says whether `max-choices` bounds the order.
 */
export const OrderInteraction = relation(
  "OrderInteraction",
  {
    id: uuid,
    maxBound: closedId(Bound),
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    shuffle: xsBoolean,
  },
  ["id"],
);

/**
 * The source wrote `shuffle` on this order interaction.
 */
export const DeclaredOrderShuffle = relation("DeclaredOrderShuffle", { node: uuid }, ["node"]);

/**
 * A `qti-graphic-order-interaction`.
 */
export const GraphicOrderInteraction = relation(
  "GraphicOrderInteraction",
  {
    id: uuid,
    maxBound: closedId(Bound),
    maxChoicesN: pg.bigint,
    minChoicesN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * An order interaction's `orientation`, when it has one.
 */
export const OrderOrientation = relation("OrderOrientation", { node: uuid, value: orientation }, [
  "node",
]);

/**
 * An order interaction's `min-choices` as written, when it has one: at least 1.
 */
export const OrderMinChoices = relation("OrderMinChoices", { node: uuid, value: positiveInteger }, [
  "node",
]);

/**
 * An order interaction's `max-choices` as written, when it has one.
 */
export const OrderMaxChoices = relation(
  "OrderMaxChoices",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * The integer value of `OrderMinChoices`, written when the attribute is present.
 */
export const OrderMinChoicesN = relation("OrderMinChoicesN", { node: uuid, value: pg.bigint }, [
  "node",
]);

/**
 * The integer value of `OrderMaxChoices`, written when the attribute is present.
 */
export const OrderMaxChoicesN = relation("OrderMaxChoicesN", { node: uuid, value: pg.bigint }, [
  "node",
]);

/**
 * An order interaction's `data-min-selections-message`, when it has one.
 */
export const OrderMinSelectionsMessage = relation(
  "OrderMinSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An order interaction's `data-max-selections-message`, when it has one.
 */
export const OrderMaxSelectionsMessage = relation(
  "OrderMaxSelectionsMessage",
  { node: uuid, value: xsNormalizedString },
  ["node"],
);

/**
 * An order interaction's `data-choices-container-width`, when it has one.
 */
export const OrderChoicesContainerWidth = relation(
  "OrderChoicesContainerWidth",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A graphic order interaction's `min-choices` as written, when it has one: at least 1.
 */
export const GraphicOrderMinChoices = relation(
  "GraphicOrderMinChoices",
  { node: uuid, value: positiveInteger },
  ["node"],
);

/**
 * A graphic order interaction's `max-choices` as written, when it has one.
 */
export const GraphicOrderMaxChoices = relation(
  "GraphicOrderMaxChoices",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * The integer value of `GraphicOrderMinChoices`, written when the attribute is present.
 */
export const GraphicOrderMinChoicesN = relation(
  "GraphicOrderMinChoicesN",
  { node: uuid, value: pg.bigint },
  ["node"],
);

/**
 * The integer value of `GraphicOrderMaxChoices`, written when the attribute is present.
 */
export const GraphicOrderMaxChoicesN = relation(
  "GraphicOrderMaxChoicesN",
  { node: uuid, value: pg.bigint },
  ["node"],
);

/**
 * The arms of the two order kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are expanded by `alternatives` in the composed schema.
 */
export const arms = {
  "qti-graphic-order-interaction": GraphicOrderInteraction,
  "qti-order-interaction": OrderInteraction,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  DeclaredOrderShuffle,
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
};

/**
 * The statements over this module's relations: each arm is a node of its root kind, and an item's
 * order interaction has a binding for its response variable; an order interaction's minimum is at
 * most its maximum unless the maximum is 0 (unbounded); a bounded order interaction has at least
 * as many simple choices as its maximum and as its minimum; every optional value belongs to its
 * arm.
 */
export const rules = [
  contained(on(OrderInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(OrderInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(GraphicOrderInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(GraphicOrderInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("OrderChoiceBounds", OrderInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  check("GraphicOrderChoiceBounds", GraphicOrderInteraction, (r) =>
    r.or(r.eq(r.maxChoicesN, 0n), r.le(r.minChoicesN, r.maxChoicesN)),
  ),
  capacity(on(select(OrderInteraction, { maxBound: "bounded" }), "id"), {
    from: on(SimpleChoice, "interaction"),
    within: within(ref("maxChoicesN"), "*"),
  }),
  capacity(on(select(OrderInteraction, { maxBound: "bounded" }), "id"), {
    from: on(SimpleChoice, "interaction"),
    within: within(ref("minChoicesN"), "*"),
  }),
  contained(on(DeclaredOrderShuffle, "node"), on(OrderInteraction, "id")),
  contained(on(OrderOrientation, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMinChoices, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMaxChoices, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMinChoicesN, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMaxChoicesN, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMinSelectionsMessage, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMaxSelectionsMessage, "node"), on(OrderInteraction, "id")),
  contained(on(OrderChoicesContainerWidth, "node"), on(OrderInteraction, "id")),
  contained(on(GraphicOrderMinChoices, "node"), on(GraphicOrderInteraction, "id")),
  contained(on(GraphicOrderMaxChoices, "node"), on(GraphicOrderInteraction, "id")),
  contained(on(GraphicOrderMinChoicesN, "node"), on(GraphicOrderInteraction, "id")),
  contained(on(GraphicOrderMaxChoicesN, "node"), on(GraphicOrderInteraction, "id")),
] as const;
