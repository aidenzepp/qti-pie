import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as contracts from "#qti/schema/contracts.ts";
import * as choices from "#qti/schema/choices.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as gap from "#qti/schema/interactions/gap.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiGapProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
      ...rosters.relations,
      ...choices.relations,
      ...gap.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
      ...choices.rules,
      ...gap.rules,
    ],
  );

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof gap.rules)[number];

type CapacityRule = Extract<Rule, { readonly kind: "capacity" }>;

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

type KeyRule = Extract<Rule, { readonly kind: "key" }>;

/**
 * One end of a capacity's bounds as text. The public statement type does not expose the
 * description.
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
  gap.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: rule.right.source,
    }));

const { relations } = gap;

describe("interactions/gap", () => {
  it("builds a schema over node, declaration, interaction, choices and gap without refusal", () => {
    const built = probe();
    for (const name of [
      "GapMatchInteraction",
      "GraphicGapMatchInteraction",
      "Gap",
      "GapText",
      "GapImg",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the five arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(gap.arms).toSorted(), [
      "qti-gap",
      "qti-gap-img",
      "qti-gap-match-interaction",
      "qti-gap-text",
      "qti-graphic-gap-match-interaction",
    ]);
    assert.strictEqual(gap.arms["qti-gap-match-interaction"], relations.GapMatchInteraction);
    assert.strictEqual(
      gap.arms["qti-graphic-gap-match-interaction"],
      relations.GraphicGapMatchInteraction,
    );
    assert.strictEqual(gap.arms["qti-gap"], relations.Gap);
    assert.strictEqual(gap.arms["qti-gap-text"], relations.GapText);
    assert.strictEqual(gap.arms["qti-gap-img"], relations.GapImg);
  });

  it("carries shuffle on the gap match arm only", () => {
    assert.deepStrictEqual(Object.keys(relations.GapMatchInteraction.fields).toSorted(), [
      "id",
      "maxAssociationsN",
      "minAssociationsN",
      "responseIdentifier",
      "rootKind",
      "shuffle",
    ]);
    assert.deepStrictEqual(Object.keys(relations.GraphicGapMatchInteraction.fields).toSorted(), [
      "id",
      "maxAssociationsN",
      "minAssociationsN",
      "responseIdentifier",
      "rootKind",
    ]);
  });

  it("bounds a gap to at most one single-cardinality gap-match binding per interaction", () => {
    const capacities = gap.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" &&
        selectionOf(rule.target)?.relation === interaction.relations.GapMatchBinding,
    );
    assert.strictEqual(capacities.length, 1);

    const [rule] = capacities;
    assert.isDefined(rule);
    assert.deepStrictEqual(selectionOf(rule.target)?.bindings, { cardinality: "single" });
    assert.deepStrictEqual([...rule.target.fields], ["node"]);
    assert.strictEqual(rule.from.source, relations.Gap);
    assert.deepStrictEqual([...rule.from.fields], ["interaction"]);
    assert.strictEqual(boundOf(rule, "low"), "0");
    assert.strictEqual(boundOf(rule, "high"), "1");
  });

  it("keys a gap, a gap text and a gap image by interaction with identifier", () => {
    const keys = gap.rules.filter((rule): rule is KeyRule => rule.kind === "key");
    assert.deepStrictEqual(
      keys.map((rule) => [rule.relation, [...rule.fields]]),
      [
        [relations.Gap, ["interaction", "identifier"]],
        [relations.GapText, ["interaction", "identifier"]],
        [relations.GapImg, ["interaction", "identifier"]],
      ],
    );
  });

  it("contains a gap's interaction in the gap match arm and binds no Edge copy for it", () => {
    assert.deepStrictEqual(containmentsFrom(relations.Gap), [
      {
        left: ["interaction"],
        right: ["id"],
        selection: undefined,
        target: relations.GapMatchInteraction,
      },
    ]);
  });

  it("copies a gap text's and a gap image's interaction into Edge.(child, parent)", () => {
    for (const arm of [relations.GapText, relations.GapImg]) {
      assert.deepStrictEqual(
        containmentsFrom(arm),
        [
          {
            left: ["id", "interaction"],
            right: ["child", "parent"],
            selection: undefined,
            target: node.relations.Edge,
          },
        ],
        arm.name,
      );
    }
  });

  it("holds the root copy and the item existence containments on each interaction", () => {
    for (const arm of [relations.GapMatchInteraction, relations.GraphicGapMatchInteraction]) {
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
    const checks = gap.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((rule) => [rule.name, rule.relation]),
      [
        ["GapImgBounds", relations.GapImg],
        ["GapMatchBounds", relations.GapMatchInteraction],
        ["GapTextBounds", relations.GapText],
        ["GraphicGapMatchBounds", relations.GraphicGapMatchInteraction],
      ],
    );
  });

  it("holds the association and match bounds as integers only, with no lexical relation or column beside them", () => {
    for (const name of ["GapMatchMaxAssociations", "GraphicGapMatchMaxAssociations"]) {
      assert.notInclude(Object.keys(relations), name);
    }

    for (const marker of [
      relations.GapMatchMinAssociations,
      relations.GraphicGapMatchMinAssociations,
      relations.GapTextMatchMin,
      relations.GapImgMatchMin,
    ]) {
      assert.deepStrictEqual(Object.keys(marker.fields), ["node"], marker.name);
    }

    for (const arm of [relations.GapText, relations.GapImg]) {
      const fields = Object.keys(arm.fields);

      assert.include(fields, "matchMaxN");
      assert.include(fields, "matchMinN");
      assert.notInclude(fields, "matchMax", arm.name);
    }
  });

  it("contains every marker and optional value into the arm it belongs to", () => {
    const owners = [
      [relations.DeclaredGapMatchShuffle, relations.GapMatchInteraction],
      [relations.DeclaredGapMatchMaxAssociations, relations.GapMatchInteraction],
      [relations.GapMatchMinAssociations, relations.GapMatchInteraction],
      [relations.GapMatchMinSelectionsMessage, relations.GapMatchInteraction],
      [relations.GapMatchMaxSelectionsMessage, relations.GapMatchInteraction],
      [relations.GapMatchChoicesContainerWidth, relations.GapMatchInteraction],
      [relations.DeclaredGraphicGapMatchMaxAssociations, relations.GraphicGapMatchInteraction],
      [relations.GraphicGapMatchMinAssociations, relations.GraphicGapMatchInteraction],
      [relations.GraphicGapMatchMinSelectionsMessage, relations.GraphicGapMatchInteraction],
      [relations.GraphicGapMatchMaxSelectionsMessage, relations.GraphicGapMatchInteraction],
      [relations.GraphicGapMatchChoicesContainerWidth, relations.GraphicGapMatchInteraction],
      [relations.DeclaredGapRequired, relations.Gap],
      [relations.DeclaredGapShowHide, relations.Gap],
      [relations.DeclaredGapTextShowHide, relations.GapText],
      [relations.DeclaredGapImgShowHide, relations.GapImg],
      [relations.GapTextMatchMin, relations.GapText],
      [relations.GapImgMatchMin, relations.GapImg],
      [relations.GapImgObjectLabel, relations.GapImg],
      [relations.GapImgTop, relations.GapImg],
      [relations.GapImgLeft, relations.GapImg],
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
    assert.strictEqual(relations.GapMatchInteraction.fields.shuffle.roster, rosters.XsBoolean);
    assert.strictEqual(relations.Gap.fields.required.roster, rosters.XsBoolean);
    assert.strictEqual(relations.Gap.fields.showHide.roster, rosters.ShowHide);
    assert.strictEqual(relations.GapText.fields.showHide.roster, rosters.ShowHide);
    assert.strictEqual(relations.GapImg.fields.showHide.roster, rosters.ShowHide);
  });
});

describe("contracts (interactions/gap)", () => {
  it("types Gap.identifier ChoiceIdentifier", () => {
    assert.strictEqual(gap.Gap.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types GapText.identifier ChoiceIdentifier", () => {
    assert.strictEqual(gap.GapText.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types GapImg.identifier ChoiceIdentifier", () => {
    assert.strictEqual(gap.GapImg.fields.identifier.name, contracts.ChoiceIdentifier.name);
  });
  it("types GapMatchChoicesContainerWidth.value ContainerWidth", () => {
    assert.strictEqual(
      gap.GapMatchChoicesContainerWidth.fields.value.name,
      contracts.ContainerWidth.name,
    );
  });
  it("types GraphicGapMatchChoicesContainerWidth.value ContainerWidth", () => {
    assert.strictEqual(
      gap.GraphicGapMatchChoicesContainerWidth.fields.value.name,
      contracts.ContainerWidth.name,
    );
  });
});
