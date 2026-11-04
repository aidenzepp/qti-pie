/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shapes` is the module the hotspot arms share and `shape` the column it fixes; the shape here is a geometric one, not a structure. */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as contracts from "#qti/schema/contracts.ts";
import * as choices from "#qti/schema/choices.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as associate from "#qti/schema/interactions/associate.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as shapes from "#qti/schema/shapes.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiAssociateProbe",
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
      ...associate.relations,
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
      ...associate.rules,
    ],
  );

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof associate.rules)[number];

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
  associate.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: rule.right.source,
    }));

const { relations } = associate;

describe("interactions/associate", () => {
  it("builds a schema over node, declaration, interaction, rosters, choices, shapes and associate without refusal", () => {
    const built = probe();
    for (const name of [
      "AssociateInteraction",
      "MatchInteraction",
      "GraphicAssociateInteraction",
      "SimpleAssociableChoice",
      "SimpleMatchSet",
      "AssociableHotspot",
      "SimpleAssociableChoiceMatchSet",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the six arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(associate.arms).toSorted(), [
      "qti-associable-hotspot",
      "qti-associate-interaction",
      "qti-graphic-associate-interaction",
      "qti-match-interaction",
      "qti-simple-associable-choice",
      "qti-simple-match-set",
    ]);
    assert.strictEqual(associate.arms["qti-associate-interaction"], relations.AssociateInteraction);
    assert.strictEqual(associate.arms["qti-match-interaction"], relations.MatchInteraction);
    assert.strictEqual(
      associate.arms["qti-graphic-associate-interaction"],
      relations.GraphicAssociateInteraction,
    );
    assert.strictEqual(
      associate.arms["qti-simple-associable-choice"],
      relations.SimpleAssociableChoice,
    );
    assert.strictEqual(associate.arms["qti-simple-match-set"], relations.SimpleMatchSet);
    assert.strictEqual(associate.arms["qti-associable-hotspot"], relations.AssociableHotspot);
  });

  it("carries shuffle on the associate and match arms only", () => {
    assert.deepStrictEqual(Object.keys(relations.AssociateInteraction.fields).toSorted(), [
      "id",
      "maxAssociationsN",
      "minAssociationsN",
      "responseIdentifier",
      "rootKind",
      "shuffle",
    ]);
    assert.deepStrictEqual(
      Object.keys(relations.MatchInteraction.fields),
      Object.keys(relations.AssociateInteraction.fields),
    );
    assert.deepStrictEqual(Object.keys(relations.GraphicAssociateInteraction.fields).toSorted(), [
      "id",
      "maxAssociationsN",
      "minAssociationsN",
      "responseIdentifier",
      "rootKind",
    ]);
  });

  it("states exactly two simple match sets as a capacity from the set edges into the match arm", () => {
    const capacities = associate.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" && rule.target.source === relations.MatchInteraction,
    );
    assert.strictEqual(capacities.length, 1);

    const [rule] = capacities;
    assert.isDefined(rule);
    assert.deepStrictEqual([...rule.target.fields], ["id"]);

    const from = selectionOf(rule.from);
    assert.strictEqual(from?.relation, node.relations.Edge);
    assert.deepStrictEqual(from?.bindings, { childKind: "qti-simple-match-set" });
    assert.deepStrictEqual([...rule.from.fields], ["parent"]);
    assert.strictEqual(boundOf(rule, "low"), "2");
    assert.strictEqual(boundOf(rule, "high"), "2");
  });

  it("keys a simple associable choice by id and by interaction with identifier", () => {
    const keys = associate.rules.filter((rule): rule is KeyRule => rule.kind === "key");
    assert.deepStrictEqual(
      keys.map((rule) => [rule.relation, [...rule.fields]]),
      [
        [relations.SimpleAssociableChoice, ["interaction", "identifier"]],
        [relations.AssociableHotspot, ["interaction", "identifier"]],
      ],
    );
  });

  it("contains the match-set form of a choice into Edge.(child, parent) twice", () => {
    const owned = containmentsFrom(relations.SimpleAssociableChoiceMatchSet).filter(
      (rule) => rule.target === node.relations.Edge,
    );
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right]),
      [
        [
          ["node", "matchSet"],
          ["child", "parent"],
        ],
        [
          ["matchSet", "interaction"],
          ["child", "parent"],
        ],
      ],
    );
  });

  it("binds no direct (id, interaction) containment for a choice that may sit under a set", () => {
    const direct = containmentsFrom(relations.SimpleAssociableChoice).filter(
      (rule) => rule.target === node.relations.Edge,
    );
    assert.deepStrictEqual(direct, []);
  });

  it("selects the Coords binding on the associable hotspot's owner kind", () => {
    const bound = containmentsFrom(shapes.Coords).filter(
      (rule) => rule.target === relations.AssociableHotspot,
    );
    assert.strictEqual(bound.length, 1);
    assert.deepStrictEqual(bound[0]?.selection, { ownerKind: "qti-associable-hotspot" });
    assert.deepStrictEqual(bound[0]?.left, ["node", "shape"]);
    assert.deepStrictEqual(bound[0]?.right, ["id", "shape"]);
  });

  it("states the five shape capacities of the associable hotspot", () => {
    const capacities = associate.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" &&
        selectionOf(rule.target)?.relation === relations.AssociableHotspot,
    );
    assert.deepStrictEqual(
      capacities
        .map((rule) => JSON.stringify(selectionOf(rule.target)?.bindings))
        .toSorted((a, b) => a.localeCompare(b)),
      ["circle", "default", "ellipse", "poly", "rect"].map((shape) => JSON.stringify({ shape })),
    );
  });

  it("copies the parent kind of a hotspot into Edge.(child, parentKind)", () => {
    const owned = containmentsFrom(relations.AssociableHotspot).filter(
      (rule) => rule.target === node.relations.Edge,
    );
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right]),
      [
        [
          ["id", "parentKind"],
          ["child", "parentKind"],
        ],
        [
          ["id", "interaction"],
          ["child", "parent"],
        ],
      ],
    );
  });

  it("holds the bounds checks by name", () => {
    const checks = associate.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((rule) => [rule.name, rule.relation]),
      [
        ["AssociableHotspotBounds", relations.AssociableHotspot],
        ["AssociateBounds", relations.AssociateInteraction],
        ["GraphicAssociateBounds", relations.GraphicAssociateInteraction],
        ["MatchBounds", relations.MatchInteraction],
        ["NoDefaultHotspotInGraphicGapMatch", relations.AssociableHotspot],
        ["SimpleAssociableChoiceBounds", relations.SimpleAssociableChoice],
      ],
    );
  });

  it("holds the root copy and the item existence containments on each interaction", () => {
    for (const arm of [
      relations.AssociateInteraction,
      relations.MatchInteraction,
      relations.GraphicAssociateInteraction,
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

  it("holds the association and match bounds as integers only, with no lexical relation or column beside them", () => {
    for (const name of [
      "AssociateMaxAssociations",
      "AssociateMinAssociations",
      "GraphicAssociateMaxAssociations",
      "MatchMaxAssociations",
      "MatchMinAssociations",
    ]) {
      assert.notInclude(Object.keys(relations), name);
    }

    for (const marker of [
      relations.GraphicAssociateMinAssociations,
      relations.SimpleAssociableChoiceMatchMin,
      relations.AssociableHotspotMatchMin,
    ]) {
      assert.deepStrictEqual(Object.keys(marker.fields), ["node"], marker.name);
    }

    for (const arm of [relations.SimpleAssociableChoice, relations.AssociableHotspot]) {
      const fields = Object.keys(arm.fields);

      assert.include(fields, "matchMaxN");
      assert.include(fields, "matchMinN");
      assert.notInclude(fields, "matchMax", arm.name);
    }
  });

  it("contains every marker and optional value into the arm it belongs to", () => {
    const owners = [
      [relations.DeclaredAssociateShuffle, relations.AssociateInteraction],
      [relations.DeclaredAssociateMaxAssociations, relations.AssociateInteraction],
      [relations.DeclaredAssociateMinAssociations, relations.AssociateInteraction],
      [relations.DeclaredMatchShuffle, relations.MatchInteraction],
      [relations.DeclaredMatchMaxAssociations, relations.MatchInteraction],
      [relations.DeclaredMatchMinAssociations, relations.MatchInteraction],
      [relations.MatchMinSelectionsMessage, relations.MatchInteraction],
      [relations.MatchMaxSelectionsMessage, relations.MatchInteraction],
      [relations.MatchFirstColumnHeader, relations.MatchInteraction],
      [relations.DeclaredGraphicAssociateMaxAssociations, relations.GraphicAssociateInteraction],
      [relations.GraphicAssociateMinAssociations, relations.GraphicAssociateInteraction],
      [relations.SimpleAssociableChoiceFixed, relations.SimpleAssociableChoice],
      [relations.SimpleAssociableChoiceShowHide, relations.SimpleAssociableChoice],
      [relations.SimpleAssociableChoiceMatchMin, relations.SimpleAssociableChoice],
      [relations.AssociableHotspotLabel, relations.AssociableHotspot],
      [relations.AssociableHotspotMatchMin, relations.AssociableHotspot],
      [relations.DeclaredAssociableHotspotShowHide, relations.AssociableHotspot],
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
    assert.strictEqual(relations.AssociateInteraction.fields.shuffle.roster, rosters.XsBoolean);
    assert.strictEqual(relations.MatchInteraction.fields.shuffle.roster, rosters.XsBoolean);
    assert.strictEqual(
      relations.SimpleAssociableChoiceFixed.fields.value.roster,
      rosters.XsBoolean,
    );
    assert.strictEqual(
      relations.SimpleAssociableChoiceShowHide.fields.value.roster,
      rosters.ShowHide,
    );
    assert.strictEqual(relations.AssociableHotspot.fields.showHide.roster, rosters.ShowHide);
  });
});

describe("contracts (interactions/associate)", () => {
  it("types SimpleAssociableChoice.identifier ChoiceIdentifier", () => {
    assert.strictEqual(
      associate.SimpleAssociableChoice.fields.identifier.name,
      contracts.ChoiceIdentifier.name,
    );
  });
  it("types AssociableHotspot.identifier ChoiceIdentifier", () => {
    assert.strictEqual(
      associate.AssociableHotspot.fields.identifier.name,
      contracts.ChoiceIdentifier.name,
    );
  });
});
