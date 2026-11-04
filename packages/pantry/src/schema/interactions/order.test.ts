import { pg, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as contracts from "#pantry/schema/contracts.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as interaction from "#pantry/schema/interaction.ts";
import * as item from "#pantry/schema/item.ts";
import * as order from "#pantry/schema/interactions/order.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiOrderProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
      ...rosters.relations,
      ...order.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
      ...order.rules,
    ],
  );

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof order.rules)[number];

type CapacityRule = Extract<Rule, { readonly kind: "capacity" }>;

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

/**
 * One end of a capacity's bounds as text: a literal as written, a `ref` as the field it names. The
 * public statement type does not expose the description.
 */
const boundOf = (rule: CapacityRule, end: "low" | "high"): string => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, end)
      ? rule.desc.within[end]
      : undefined;

  assert.isDefined(within, "capacity description");

  return Predicate.hasProperty(within, "ref") ? String(within.ref) : String(within);
};

describe("interactions/order", () => {
  it("builds a schema over node, declaration, interaction, rosters and order without refusal", () => {
    const built = probe();
    for (const name of ["OrderInteraction", "GraphicOrderInteraction", "OrderMinChoicesN"]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the two arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(order.arms).toSorted(), [
      "qti-graphic-order-interaction",
      "qti-order-interaction",
    ]);
    assert.strictEqual(order.arms["qti-order-interaction"], order.relations.OrderInteraction);
    assert.strictEqual(
      order.arms["qti-graphic-order-interaction"],
      order.relations.GraphicOrderInteraction,
    );
  });

  it("carries the bound copies on both arms and shuffle only on the order arm", () => {
    assert.deepStrictEqual(Object.keys(order.relations.OrderInteraction.fields).toSorted(), [
      "id",
      "maxBound",
      "maxChoicesN",
      "minChoicesN",
      "responseIdentifier",
      "rootKind",
      "shuffle",
    ]);
    assert.deepStrictEqual(Object.keys(order.relations.GraphicOrderInteraction.fields).toSorted(), [
      "id",
      "maxBound",
      "maxChoicesN",
      "minChoicesN",
      "responseIdentifier",
      "rootKind",
    ]);
  });

  it("states the two capacities from SimpleChoice.interaction on the bounded order arms", () => {
    const capacities = order.rules.filter((rule) => rule.kind === "capacity");
    assert.strictEqual(capacities.length, 2);
    for (const rule of capacities) {
      const selection = selectionOf(rule.target);
      assert.strictEqual(selection?.relation, order.relations.OrderInteraction);
      assert.deepStrictEqual(selection?.bindings, { maxBound: "bounded" });
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.strictEqual(rule.from.source, interaction.relations.SimpleChoice);
      assert.deepStrictEqual([...rule.from.fields], ["interaction"]);
      assert.strictEqual(boundOf(rule, "high"), "*");
    }
    assert.deepStrictEqual(capacities.map((rule) => boundOf(rule, "low")).toSorted(), [
      "maxChoicesN",
      "minChoicesN",
    ]);
  });

  it("holds the choice-bounds check on each arm and the positive-minimum check on each minimum and the positive-minimum check on each minimum", () => {
    const checks = order.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [
        ["OrderChoiceBounds", order.relations.OrderInteraction],
        ["GraphicOrderChoiceBounds", order.relations.GraphicOrderInteraction],
        ["OrderMinChoicesPositive", order.relations.OrderMinChoicesN],
        ["GraphicOrderMinChoicesPositive", order.relations.GraphicOrderMinChoicesN],
      ],
    );
  });

  it("holds the root copy and the item existence containments", () => {
    const owned = order.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => {
        const source = selectionOf(rule.left)?.relation ?? rule.left.source;

        return source === order.relations.OrderInteraction;
      })
      .map((rule) => ({
        left: [...rule.left.fields],
        right: [...rule.right.fields],
        selection: selectionOf(rule.left)?.bindings,
        target: rule.right.source,
      }));
    assert.deepStrictEqual(owned, [
      {
        left: ["id", "rootKind"],
        right: ["id", "rootKind"],
        selection: undefined,
        target: node.relations.Node,
      },
      {
        left: ["id", "responseIdentifier"],
        right: ["node", "responseIdentifier"],
        selection: { rootKind: "item" },
        target: interaction.relations.InteractionBinding,
      },
    ]);
  });

  it("holds the typed copies as bigints and no lexical bound relation", () => {
    const { OrderMaxChoicesN, OrderMinChoicesN, GraphicOrderMaxChoicesN, GraphicOrderMinChoicesN } =
      order.relations;
    for (const relation of [
      OrderMaxChoicesN,
      OrderMinChoicesN,
      GraphicOrderMaxChoicesN,
      GraphicOrderMinChoicesN,
    ]) {
      assert.strictEqual(relation.fields.value, pg.bigint, relation.name);
    }
    for (const name of [
      "OrderMinChoices",
      "OrderMaxChoices",
      "GraphicOrderMinChoices",
      "GraphicOrderMaxChoices",
    ]) {
      assert.notInclude(Object.keys(order.relations), name);
    }
  });

  it("contains every optional value into the arm it belongs to", () => {
    const { relations } = order;
    const owners = [
      [relations.DeclaredOrderShuffle, relations.OrderInteraction],
      [relations.OrderOrientation, relations.OrderInteraction],
      [relations.OrderMinSelectionsMessage, relations.OrderInteraction],
      [relations.OrderMaxSelectionsMessage, relations.OrderInteraction],
      [relations.OrderChoicesContainerWidth, relations.OrderInteraction],
    ] as const;

    for (const [optional, arm] of owners) {
      const owned = order.rules.filter(
        (rule): rule is ContainedRule => rule.kind === "contained" && rule.left.source === optional,
      );
      assert.strictEqual(owned.length, 1, optional.name);
      assert.strictEqual(owned[0]?.right.source, arm, optional.name);
      assert.deepStrictEqual([...(owned[0]?.left.fields ?? [])], ["node"]);
      assert.deepStrictEqual([...(owned[0]?.right.fields ?? [])], ["id"]);
    }
  });

  it("contains each bound marker through (node, value) into the arm's own bound column", () => {
    const { relations } = order;
    const bounds = [
      [relations.OrderMinChoicesN, relations.OrderInteraction, "minChoicesN"],
      [relations.OrderMaxChoicesN, relations.OrderInteraction, "maxChoicesN"],
      [relations.GraphicOrderMinChoicesN, relations.GraphicOrderInteraction, "minChoicesN"],
      [relations.GraphicOrderMaxChoicesN, relations.GraphicOrderInteraction, "maxChoicesN"],
    ] as const;

    for (const [marker, arm, column] of bounds) {
      const owned = order.rules.filter(
        (rule): rule is ContainedRule => rule.kind === "contained" && rule.left.source === marker,
      );
      assert.strictEqual(owned.length, 1, marker.name);
      assert.strictEqual(owned[0]?.right.source, arm, marker.name);
      assert.deepStrictEqual([...(owned[0]?.left.fields ?? [])], ["node", "value"]);
      assert.deepStrictEqual([...(owned[0]?.right.fields ?? [])], ["id", column]);
    }
  });

  it("types its boolean, show-hide, orientation and format columns as closedId of their rosters", () => {
    assert.strictEqual(order.relations.OrderInteraction.fields.shuffle.roster, rosters.XsBoolean);
    assert.strictEqual(order.relations.OrderOrientation.fields.value.roster, rosters.Orientation);
  });
});

describe("contracts (interactions/order)", () => {
  it("types OrderChoicesContainerWidth.value ContainerWidth", () => {
    assert.strictEqual(
      order.OrderChoicesContainerWidth.fields.value.name,
      contracts.ContainerWidth.name,
    );
  });
});
