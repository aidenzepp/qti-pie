import { pg, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as order from "#qti/schema/interactions/order.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
      ...interaction.relations,
      ...rosters.relations,
      ...order.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...interaction.rules,
      ...order.rules,
    ],
  );

/**
 * Whether a pattern's whole-string form admits a value.
 */
const admits = (source: string, value: string): boolean => new RegExp(source, "u").test(value);

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
    for (const name of ["OrderInteraction", "GraphicOrderInteraction", "OrderMinChoices"]) {
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

  it("holds the choice-bounds check on each arm", () => {
    const checks = order.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [
        ["OrderChoiceBounds", order.relations.OrderInteraction],
        ["GraphicOrderChoiceBounds", order.relations.GraphicOrderInteraction],
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

  it("refuses 0 and admits 1 under OrderMinChoices", () => {
    const { value } = order.relations.OrderMinChoices.fields;
    assert.strictEqual(value.pattern.source, patterns.positiveInteger);
    assert.isFalse(admits(value.pattern.source, "0"));
    assert.isTrue(admits(value.pattern.source, "1"));
  });

  it("types the lexical maximum as a non-negative integer and the typed copies as bigints", () => {
    const { OrderMaxChoices, OrderMaxChoicesN, OrderMinChoicesN } = order.relations;
    assert.strictEqual(OrderMaxChoices.fields.value.pattern.source, patterns.xsNonNegativeInteger);
    assert.strictEqual(OrderMaxChoicesN.fields.value, pg.bigint);
    assert.strictEqual(OrderMinChoicesN.fields.value, pg.bigint);
  });

  it("contains every optional value into the arm it belongs to", () => {
    const { relations } = order;
    const owners = [
      [relations.OrderOrientation, relations.OrderInteraction],
      [relations.OrderMinChoices, relations.OrderInteraction],
      [relations.OrderMaxChoices, relations.OrderInteraction],
      [relations.OrderMinChoicesN, relations.OrderInteraction],
      [relations.OrderMaxChoicesN, relations.OrderInteraction],
      [relations.OrderMinSelectionsMessage, relations.OrderInteraction],
      [relations.OrderMaxSelectionsMessage, relations.OrderInteraction],
      [relations.OrderChoicesContainerWidth, relations.OrderInteraction],
      [relations.GraphicOrderMinChoices, relations.GraphicOrderInteraction],
      [relations.GraphicOrderMaxChoices, relations.GraphicOrderInteraction],
      [relations.GraphicOrderMinChoicesN, relations.GraphicOrderInteraction],
      [relations.GraphicOrderMaxChoicesN, relations.GraphicOrderInteraction],
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
});
