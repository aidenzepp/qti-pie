import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as interaction from "#qti/schema/interaction.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The probe schema: the node module's relations and rules with this module's.
 */
const probe = () =>
  schema("QtiInteractionProbe", { ...node.relations, ...interaction.relations }, [
    ...node.rules,
    ...interaction.rules,
  ]);

/**
 * The names of the relations this module adds.
 */
const added = [
  "ChoiceInteraction",
  "ChoiceInteractionMaxSelectionsMessage",
  "ChoiceInteractionMinSelectionsMessage",
  "DeclaredFixed",
  "DeclaredMaxChoices",
  "DeclaredMinChoices",
  "DeclaredOrientation",
  "DeclaredShowHide",
  "DeclaredShuffle",
  "SimpleChoice",
  "SimpleChoiceTemplateIdentifier",
];

describe("interaction", () => {
  it("builds a schema over node and interaction without refusal", () => {
    const built = probe();
    for (const name of added) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.strictEqual(built.statements.length, node.rules.length + interaction.rules.length);
  });

  it("adds exactly the choice relations", () => {
    assert.deepStrictEqual(Object.keys(interaction.relations).toSorted(), added);
  });

  it("holds the choice-count capacity: every ChoiceInteraction has one to unbounded SimpleChoice", () => {
    const capacities = interaction.rules.filter((rule) => rule.kind === "capacity");
    assert.strictEqual(capacities.length, 1);

    const [capacity] = capacities;
    assert.strictEqual(capacity?.target.source, interaction.relations.ChoiceInteraction);
    assert.deepStrictEqual([...(capacity?.target.fields ?? [])], ["id"]);
    assert.strictEqual(capacity?.from.source, interaction.relations.SimpleChoice);
    assert.deepStrictEqual([...(capacity?.from.fields ?? [])], ["interaction"]);
  });

  it("holds the ChoiceBounds check on ChoiceInteraction", () => {
    const checks = interaction.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation === interaction.relations.ChoiceInteraction]),
      [["ChoiceBounds", true]],
    );
  });

  it("keys SimpleChoice by (interaction, identifier) as well as its id", () => {
    const keys = interaction.rules.filter(
      (rule) => rule.kind === "key" && rule.relation === interaction.relations.SimpleChoice,
    );
    assert.deepStrictEqual(
      keys.map((rule) => (rule.kind === "key" ? [...rule.fields] : [])),
      [["interaction", "identifier"]],
    );
    assert.deepStrictEqual([...interaction.relations.SimpleChoice.primaryKey], ["id"]);
  });

  it("contains each SimpleChoice in Edge by (child, parent) and in nothing else", () => {
    const from = interaction.rules.filter(
      (rule) =>
        rule.kind === "contained" && rule.left.source === interaction.relations.SimpleChoice,
    );
    assert.deepStrictEqual(
      from.map((rule) =>
        rule.kind === "contained"
          ? [rule.right.source, [...rule.left.fields], [...rule.right.fields]]
          : [],
      ),
      [[node.relations.Edge, ["id", "interaction"], ["child", "parent"]]],
    );
  });

  it("keys each marker and optional value by its node, contained in its owner by id", () => {
    const markers = {
      ChoiceInteractionMaxSelectionsMessage: "ChoiceInteraction",
      ChoiceInteractionMinSelectionsMessage: "ChoiceInteraction",
      DeclaredFixed: "SimpleChoice",
      DeclaredMaxChoices: "ChoiceInteraction",
      DeclaredMinChoices: "ChoiceInteraction",
      DeclaredOrientation: "ChoiceInteraction",
      DeclaredShowHide: "SimpleChoice",
      DeclaredShuffle: "ChoiceInteraction",
      SimpleChoiceTemplateIdentifier: "SimpleChoice",
    } as const;
    const relations: Record<string, { primaryKey: readonly string[] }> = interaction.relations;
    for (const [name, owner] of Object.entries(markers)) {
      assert.deepStrictEqual([...(relations[name]?.primaryKey ?? [])], ["node"], name);

      const owned = interaction.rules.filter(
        (rule) =>
          rule.kind === "contained" &&
          rule.left.source === relations[name] &&
          rule.right.source === relations[owner],
      );
      assert.strictEqual(owned.length, 1, name);
    }
  });

  it("types the selection messages as xsNormalizedString and the orientation by its pattern", () => {
    const { ChoiceInteraction, ChoiceInteractionMinSelectionsMessage } = interaction.relations;
    assert.strictEqual(
      ChoiceInteractionMinSelectionsMessage.fields.value.pattern.source,
      patterns.xsNormalizedString,
    );
    assert.strictEqual(ChoiceInteraction.fields.orientation.pattern.source, patterns.orientation);
  });

  it("keys each arm by its NodeKind handle and by id", () => {
    assert.deepStrictEqual(Object.keys(interaction.arms).toSorted(), [
      "qti-choice-interaction",
      "qti-simple-choice",
    ]);
    for (const arm of Object.values(interaction.arms)) {
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
  });
});
