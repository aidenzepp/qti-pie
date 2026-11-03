/**
 * The order interactions: `qti-order-interaction` and `qti-graphic-order-interaction`, with the
 * optional values each may carry. The attributes and children are the inventory entries of the same
 * names.
 *
 * Both arms carry the typed bounds `maxChoicesN` and `minChoicesN` as NOT NULL columns, 0 where the
 * source omits the attribute. `OrderMaxChoicesN` and its three siblings are markers that the source
 * wrote the attribute: each holds the arm's own bound and is contained through `(node, value)` into
 * the arm's matching column, so it cannot disagree with it; a minimum is at least 1, by the checks
 * `OrderMinChoicesPositive` and `GraphicOrderMinChoicesPositive`. A non-canonical spelling of
 * either attribute is an `AttributeSpelling` row. `maxBound` is `bounded` when `max-choices` is
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
import { Bound, Orientation, XsBoolean } from "#qti/schema/content/rosters.ts";
import { InteractionBinding, SimpleChoice } from "#qti/schema/interaction.ts";
import { Node, RootKind } from "#qti/schema/node.ts";
import { ContainerWidth } from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

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
    shuffle: closedId(XsBoolean),
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
export const OrderOrientation = relation(
  "OrderOrientation",
  { node: uuid, value: closedId(Orientation) },
  ["node"],
);

/**
 * An order interaction's `min-choices` value, written when the attribute is present: at least 1.
 */
export const OrderMinChoicesN = relation("OrderMinChoicesN", { node: uuid, value: pg.bigint }, [
  "node",
]);

/**
 * An order interaction's `max-choices` value, written when the attribute is present.
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
  { node: uuid, value: ContainerWidth },
  ["node"],
);

/**
 * A graphic order interaction's `min-choices` value, written when the attribute is present: at
 * least 1.
 */
export const GraphicOrderMinChoicesN = relation(
  "GraphicOrderMinChoicesN",
  { node: uuid, value: pg.bigint },
  ["node"],
);

/**
 * A graphic order interaction's `max-choices` value, written when the attribute is present.
 */
export const GraphicOrderMaxChoicesN = relation(
  "GraphicOrderMaxChoicesN",
  { node: uuid, value: pg.bigint },
  ["node"],
);

/**
 * The arms of the two order kinds, keyed by their `NodeKind` handles. Their containments into
 * `Node` are bound by one `mirrors` per handle in the composed schema.
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
  GraphicOrderMaxChoicesN,
  GraphicOrderMinChoicesN,
  OrderChoicesContainerWidth,
  OrderInteraction,
  OrderMaxChoicesN,
  OrderMaxSelectionsMessage,
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
  contained(on(OrderMinChoicesN, "node", "value"), on(OrderInteraction, "id", "minChoicesN")),
  contained(on(OrderMaxChoicesN, "node", "value"), on(OrderInteraction, "id", "maxChoicesN")),
  contained(on(OrderMinSelectionsMessage, "node"), on(OrderInteraction, "id")),
  contained(on(OrderMaxSelectionsMessage, "node"), on(OrderInteraction, "id")),
  contained(on(OrderChoicesContainerWidth, "node"), on(OrderInteraction, "id")),
  contained(
    on(GraphicOrderMinChoicesN, "node", "value"),
    on(GraphicOrderInteraction, "id", "minChoicesN"),
  ),
  contained(
    on(GraphicOrderMaxChoicesN, "node", "value"),
    on(GraphicOrderInteraction, "id", "maxChoicesN"),
  ),
  check("OrderMinChoicesPositive", OrderMinChoicesN, (r) => r.ge(r.value, 1n)),
  check("GraphicOrderMinChoicesPositive", GraphicOrderMinChoicesN, (r) => r.ge(r.value, 1n)),
] as const;
