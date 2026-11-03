/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shapes` is the module the hotspot arms share and `shape` the column it fixes; the shape here is a geometric one, not a structure. */
import { closedId, schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as contracts from "#qti/schema/contracts.ts";
import * as choices from "#qti/schema/choices.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as hot from "#qti/schema/interactions/hot.ts";
import * as order from "#qti/schema/interactions/order.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as shapes from "#qti/schema/shapes.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiHotProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
      ...rosters.relations,
      ...choices.relations,
      ...shapes.relations,
      ...order.relations,
      ...hot.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
      ...choices.rules,
      ...shapes.rules,
      ...order.rules,
      ...hot.rules,
    ],
  );

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof hot.rules)[number];

type CapacityRule = Extract<Rule, { readonly kind: "capacity" }>;

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

type KeyRule = Extract<Rule, { readonly kind: "key" }>;

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

/**
 * The containments whose left side is one relation, selected or not, as plain values.
 */
const containmentsFrom = (relation: { readonly name: string }) =>
  hot.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: rule.right.source,
    }));

const { relations } = hot;

describe("interactions/hot", () => {
  it("builds a schema over the spine, rosters, choices, shapes, order and hot without refusal", () => {
    const built = probe();
    for (const name of [
      "HottextInteraction",
      "Hottext",
      "HottextOwner",
      "HotspotInteraction",
      "HotspotChoice",
      "SelectPointInteraction",
      "PositionObjectStage",
      "PositionObjectInteraction",
      "PositionObjectCenterPoint",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the seven arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(hot.arms).toSorted(), [
      "qti-hotspot-choice",
      "qti-hotspot-interaction",
      "qti-hottext",
      "qti-hottext-interaction",
      "qti-position-object-interaction",
      "qti-position-object-stage",
      "qti-select-point-interaction",
    ]);
    assert.strictEqual(hot.arms["qti-hottext-interaction"], relations.HottextInteraction);
    assert.strictEqual(hot.arms["qti-hottext"], relations.Hottext);
    assert.strictEqual(hot.arms["qti-hotspot-interaction"], relations.HotspotInteraction);
    assert.strictEqual(hot.arms["qti-hotspot-choice"], relations.HotspotChoice);
    assert.strictEqual(hot.arms["qti-select-point-interaction"], relations.SelectPointInteraction);
    assert.strictEqual(hot.arms["qti-position-object-stage"], relations.PositionObjectStage);
    assert.strictEqual(
      hot.arms["qti-position-object-interaction"],
      relations.PositionObjectInteraction,
    );
  });

  it("gives each of the four interactions the typed bounds, its identifier and its root kind", () => {
    for (const arm of [
      relations.HottextInteraction,
      relations.HotspotInteraction,
      relations.SelectPointInteraction,
      relations.PositionObjectInteraction,
    ]) {
      assert.deepStrictEqual(
        Object.keys(arm.fields),
        ["id", "maxChoicesN", "minChoicesN", "responseIdentifier", "rootKind"],
        arm.name,
      );
    }
    assert.deepStrictEqual(Object.keys(relations.PositionObjectStage.fields), ["id"]);
  });

  it("holds the root copy and the item existence containments on each interaction", () => {
    for (const arm of [
      relations.HottextInteraction,
      relations.HotspotInteraction,
      relations.SelectPointInteraction,
      relations.PositionObjectInteraction,
    ]) {
      assert.deepStrictEqual(
        containmentsFrom(arm),
        [
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
        ],
        arm.name,
      );
    }
  });

  it("holds the bounds checks by name", () => {
    const checks = hot.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((rule) => [rule.name, rule.relation]),
      [
        ["HotspotChoiceBounds", relations.HotspotInteraction],
        ["HottextChoiceBounds", relations.HottextInteraction],
        ["PositionObjectChoiceBounds", relations.PositionObjectInteraction],
        ["SelectPointChoiceBounds", relations.SelectPointInteraction],
      ],
    );
  });

  it("declares HotspotChoice's shape as the Shape roster and keys it by id and by interaction with identifier", () => {
    assert.deepStrictEqual(Object.keys(relations.HotspotChoice.fields), [
      "id",
      "identifier",
      "interaction",
      "shape",
      "showHide",
    ]);
    assert.deepStrictEqual(relations.HotspotChoice.fields.shape, closedId(rosters.Shape));

    const keys = hot.rules.filter((rule): rule is KeyRule => rule.kind === "key");
    assert.deepStrictEqual(
      keys.map((rule) => [rule.relation, [...rule.fields]]),
      [
        [relations.HottextOwner, ["interaction", "identifier"]],
        [relations.HotspotChoice, ["interaction", "identifier"]],
      ],
    );
  });

  it("copies the hotspot choice's interaction into Edge.(child, parent)", () => {
    const owned = containmentsFrom(relations.HotspotChoice).filter(
      (rule) => rule.target === node.relations.Edge,
    );
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right]),
      [
        [
          ["id", "interaction"],
          ["child", "parent"],
        ],
      ],
    );
  });

  it("selects the Coords binding on the hotspot choice's owner kind", () => {
    const bound = containmentsFrom(shapes.Coords).filter(
      (rule) => rule.target === relations.HotspotChoice,
    );
    assert.strictEqual(bound.length, 1);
    assert.deepStrictEqual(bound[0]?.selection, { ownerKind: "qti-hotspot-choice" });
    assert.deepStrictEqual(bound[0]?.left, ["node", "shape"]);
    assert.deepStrictEqual(bound[0]?.right, ["id", "shape"]);
  });

  it("states the five Coords capacities of the hotspot choice: one for four shapes and at most one for default", () => {
    const capacities = hot.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" && selectionOf(rule.target)?.relation === relations.HotspotChoice,
    );
    for (const rule of capacities) {
      assert.strictEqual(rule.from.source, shapes.Coords);
      assert.deepStrictEqual([...rule.from.fields], ["node"]);
    }
    assert.deepStrictEqual(
      capacities
        .map((rule) => [
          JSON.stringify(selectionOf(rule.target)?.bindings),
          boundOf(rule, "low"),
          boundOf(rule, "high"),
        ])
        .toSorted((a, b) => (a[0] ?? "").localeCompare(b[0] ?? "")),
      [
        ["circle", "1", "1"],
        ["default", "0", "1"],
        ["ellipse", "1", "1"],
        ["poly", "1", "1"],
        ["rect", "1", "1"],
      ].map(([shape, low, high]) => [JSON.stringify({ shape }), low, high]),
    );
  });

  it("bounds the hotspot choices of a bounded graphic order interaction by its two typed bounds", () => {
    const capacities = hot.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" &&
        selectionOf(rule.target)?.relation === order.relations.GraphicOrderInteraction,
    );
    assert.deepStrictEqual(
      capacities.map((rule) => [
        selectionOf(rule.target)?.bindings,
        [...rule.target.fields],
        rule.from.source,
        [...rule.from.fields],
        boundOf(rule, "low"),
        boundOf(rule, "high"),
      ]),
      [
        [
          { maxBound: "bounded" },
          ["id"],
          relations.HotspotChoice,
          ["interaction"],
          "maxChoicesN",
          "*",
        ],
        [
          { maxBound: "bounded" },
          ["id"],
          relations.HotspotChoice,
          ["interaction"],
          "minChoicesN",
          "*",
        ],
      ],
    );
  });

  it("gives Hottext no interaction column and owns the interaction by HottextOwner", () => {
    assert.deepStrictEqual(Object.keys(relations.Hottext.fields), ["id", "identifier", "showHide"]);
    assert.deepStrictEqual(Object.keys(relations.HottextOwner.fields), [
      "identifier",
      "interaction",
      "node",
    ]);

    const owned = containmentsFrom(relations.HottextOwner);
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right, rule.target]),
      [
        [["node", "identifier"], ["id", "identifier"], relations.Hottext],
        [["interaction"], ["id"], relations.HottextInteraction],
      ],
    );
  });

  it("keys HottextOwner by node", () => {
    assert.deepStrictEqual([...relations.HottextOwner.primaryKey], ["node"]);
    assert.deepStrictEqual([...relations.Hottext.primaryKey], ["id"]);
  });

  it("reads PositionObjectCenterPoint as the integer list, which admits the empty list", () => {
    assert.deepStrictEqual(Object.keys(relations.PositionObjectCenterPoint.fields), [
      "node",
      "value",
    ]);
    assert.strictEqual(
      relations.PositionObjectCenterPoint.fields.value.pattern.source,
      patterns.integerList,
    );
    assert.match("", new RegExp(patterns.integerList, "u"));
    assert.match("-3 4", new RegExp(patterns.integerList, "u"));
  });

  it("holds the choice bounds as integers only, with no lexical relation beside them", () => {
    for (const name of [
      "HottextMaxChoices",
      "HottextMinChoices",
      "HotspotMaxChoices",
      "HotspotMinChoices",
      "SelectPointMaxChoices",
      "SelectPointMinChoices",
      "PositionObjectMaxChoices",
    ]) {
      assert.notInclude(Object.keys(relations), name);
    }

    assert.deepStrictEqual(Object.keys(relations.PositionObjectMinChoices.fields), ["node"]);

    for (const arm of [
      relations.HottextInteraction,
      relations.HotspotInteraction,
      relations.SelectPointInteraction,
      relations.PositionObjectInteraction,
    ]) {
      const fields = Object.keys(arm.fields);

      assert.include(fields, "maxChoicesN", arm.name);
      assert.include(fields, "minChoicesN", arm.name);
    }
  });

  it("contains every marker and optional value into the arm it belongs to", () => {
    const owners = [
      [relations.DeclaredHottextMaxChoices, relations.HottextInteraction],
      [relations.DeclaredHottextMinChoices, relations.HottextInteraction],
      [relations.HottextMinSelectionsMessage, relations.HottextInteraction],
      [relations.HottextMaxSelectionsMessage, relations.HottextInteraction],
      [relations.DeclaredHotspotMaxChoices, relations.HotspotInteraction],
      [relations.DeclaredHotspotMinChoices, relations.HotspotInteraction],
      [relations.HotspotMinSelectionsMessage, relations.HotspotInteraction],
      [relations.HotspotMaxSelectionsMessage, relations.HotspotInteraction],
      [relations.HotspotChoiceLabel, relations.HotspotChoice],
      [relations.DeclaredHottextShowHide, relations.Hottext],
      [relations.DeclaredHotspotChoiceShowHide, relations.HotspotChoice],
      [relations.DeclaredSelectPointMaxChoices, relations.SelectPointInteraction],
      [relations.DeclaredSelectPointMinChoices, relations.SelectPointInteraction],
      [relations.DeclaredPositionObjectMaxChoices, relations.PositionObjectInteraction],
      [relations.PositionObjectMinChoices, relations.PositionObjectInteraction],
      [relations.PositionObjectCenterPoint, relations.PositionObjectInteraction],
    ] as const;

    for (const [optional, arm] of owners) {
      const owned = containmentsFrom(optional);
      assert.strictEqual(owned.length, 1, optional.name);
      assert.strictEqual(owned[0]?.target, arm, optional.name);
      assert.deepStrictEqual(owned[0]?.left, ["node"]);
      assert.deepStrictEqual(owned[0]?.right, ["id"]);
    }
  });

  it("types its boolean, show-hide, orientation and format columns as closedId of their rosters", () => {
    assert.strictEqual(relations.Hottext.fields.showHide.roster, rosters.ShowHide);
    assert.strictEqual(relations.HotspotChoice.fields.showHide.roster, rosters.ShowHide);
  });
});

describe("contracts (interactions/hot)", () => {
  it("types Hottext.identifier ChoiceIdentifier", () => {
    assert.strictEqual(hot.Hottext.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types HottextOwner.identifier ChoiceIdentifier", () => {
    assert.strictEqual(hot.HottextOwner.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types HotspotChoice.identifier ChoiceIdentifier", () => {
    assert.strictEqual(hot.HotspotChoice.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types Hottext.identifier and HottextOwner.identifier alike, so the pair is one containment component", () => {
    assert.strictEqual(hot.Hottext.fields.identifier.name, hot.HottextOwner.fields.identifier.name);
  });
});

describe("contracts (shapes)", () => {
  it("types Coords.value and CoordsDefault.value ShapeCoords", () => {
    assert.strictEqual(shapes.Coords.fields.value.name, contracts.ShapeCoords.name);
    assert.strictEqual(shapes.CoordsDefault.fields.value.name, contracts.ShapeCoords.name);
  });
  it("types CoordsEllipse.value and CoordsRect.value RectCoords", () => {
    assert.strictEqual(shapes.CoordsEllipse.fields.value.name, contracts.RectCoords.name);
    assert.strictEqual(shapes.CoordsRect.fields.value.name, contracts.RectCoords.name);
  });
});
