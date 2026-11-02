import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as choices from "#qti/schema/choices.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as text from "#qti/schema/interactions/text.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiTextProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
      ...rosters.relations,
      ...choices.relations,
      ...text.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
      ...choices.rules,
      ...text.rules,
    ],
  );

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof text.rules)[number];

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

type KeyRule = Extract<Rule, { readonly kind: "key" }>;

type CapacityRule = Extract<Rule, { readonly kind: "capacity" }>;

/**
 * The containments whose left side is one relation, selected or not, as plain values.
 */
const containmentsFrom = (relation: { readonly name: string }) =>
  text.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: selectionOf(rule.right)?.relation ?? rule.right.source,
      targetSelection: selectionOf(rule.right)?.bindings,
    }));

const keysOf = (relation: { readonly name: string }) =>
  text.rules
    .filter((rule): rule is KeyRule => rule.kind === "key")
    .filter((rule) => rule.relation === relation)
    .map((rule) => [...rule.fields]);

const { relations } = text;

describe("interactions/text", () => {
  it("builds a schema over node, declaration, interaction, rosters, choices and text without refusal", () => {
    const built = probe();
    for (const name of [
      "TextEntryInteraction",
      "StringBinding",
      "ExtendedTextInteraction",
      "InlineChoiceInteraction",
      "InlineChoice",
      "QtiLabel",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the five arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(text.arms).toSorted(), [
      "qti-extended-text-interaction",
      "qti-inline-choice",
      "qti-inline-choice-interaction",
      "qti-label",
      "qti-text-entry-interaction",
    ]);
    assert.strictEqual(text.arms["qti-text-entry-interaction"], relations.TextEntryInteraction);
    assert.strictEqual(
      text.arms["qti-extended-text-interaction"],
      relations.ExtendedTextInteraction,
    );
    assert.strictEqual(
      text.arms["qti-inline-choice-interaction"],
      relations.InlineChoiceInteraction,
    );
    assert.strictEqual(text.arms["qti-inline-choice"], relations.InlineChoice);
    assert.strictEqual(text.arms["qti-label"], relations.QtiLabel);
  });

  it("gives StringBinding the candidate keys node and (document, identifier)", () => {
    assert.deepStrictEqual([...relations.StringBinding.primaryKey], ["node"]);
    assert.deepStrictEqual(keysOf(relations.StringBinding), [["document", "identifier"]]);
  });

  it("contains StringBinding into the response declarations and into its document's tree", () => {
    assert.deepStrictEqual(containmentsFrom(relations.StringBinding), [
      {
        left: ["document", "identifier"],
        right: ["document", "identifier"],
        selection: undefined,
        target: declaration.relations.Declaration,
        targetSelection: { kind: "response" },
      },
      {
        left: ["node", "document"],
        right: ["id", "tree"],
        selection: undefined,
        target: node.relations.Node,
        targetSelection: undefined,
      },
    ]);
  });

  it("gives a text-entry interaction no child-bearing relation", () => {
    const fields = Object.keys(relations.TextEntryInteraction.fields).toSorted();
    assert.deepStrictEqual(fields, ["base", "id", "responseIdentifier", "rootKind"]);

    const parents = text.rules
      .filter((rule): rule is ContainedRule => rule.kind === "contained")
      .filter(
        (rule) =>
          rule.right.source === node.relations.Edge &&
          rule.right.fields.join(",") === "child,parent",
      );
    assert.deepStrictEqual(
      parents.map((rule) => [rule.left.source, [...rule.left.fields]]),
      [[relations.InlineChoice, ["id", "interaction"]]],
    );

    const capacities = text.rules.filter((rule): rule is CapacityRule => rule.kind === "capacity");
    assert.isFalse(
      capacities.some((rule) => Object.is(rule.target.source, relations.TextEntryInteraction)),
    );
  });

  it("types base as xs:int and the lengths as non-negative integers, as the XSD does", () => {
    assert.strictEqual(relations.TextEntryInteraction.fields.base.pattern.source, patterns.xsInt);
    assert.strictEqual(
      relations.ExtendedTextInteraction.fields.base.pattern.source,
      patterns.xsInt,
    );
    assert.strictEqual(
      relations.TextEntryExpectedLength.fields.value.pattern.source,
      patterns.xsNonNegativeInteger,
    );
    assert.strictEqual(
      relations.ExtendedTextMaxStrings.fields.value.pattern.source,
      patterns.xsNonNegativeInteger,
    );
    assert.strictEqual(
      relations.ExtendedTextExpectedLines.fields.value.pattern.source,
      patterns.xsNonNegativeInteger,
    );
  });

  it("types extended-text format as the enumeration and text-entry format as free text", () => {
    assert.strictEqual(
      relations.ExtendedTextInteraction.fields.format.pattern.source,
      patterns.textFormat,
    );
    assert.strictEqual(
      relations.TextEntryFormat.fields.value.pattern.source,
      patterns.xsNormalizedString,
    );
  });

  it("holds the item existence containment on each interaction arm", () => {
    for (const arm of [
      relations.TextEntryInteraction,
      relations.ExtendedTextInteraction,
      relations.InlineChoiceInteraction,
    ]) {
      const owned = containmentsFrom(arm);
      assert.deepStrictEqual(
        owned.slice(0, 2).map((rule) => [rule.left, rule.right, rule.selection, rule.target]),
        [
          [["id", "rootKind"], ["id", "rootKind"], undefined, node.relations.Node],
          [
            ["id", "responseIdentifier"],
            ["node", "responseIdentifier"],
            { rootKind: "item" },
            interaction.relations.InteractionBinding,
          ],
        ],
        arm.name,
      );
    }
  });

  it("keys an inline choice by id and by interaction with identifier, under Edge.(child, parent)", () => {
    assert.deepStrictEqual(keysOf(relations.InlineChoice), [["interaction", "identifier"]]);

    const owned = containmentsFrom(relations.InlineChoice);
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right, rule.target]),
      [[["id", "interaction"], ["child", "parent"], node.relations.Edge]],
    );
  });

  it("requires at least one inline choice in an inline choice interaction", () => {
    const capacities = text.rules.filter((rule): rule is CapacityRule => rule.kind === "capacity");
    assert.strictEqual(capacities.length, 1);
    assert.strictEqual(capacities[0]?.target.source, relations.InlineChoiceInteraction);
    assert.strictEqual(capacities[0]?.from.source, relations.InlineChoice);
    assert.deepStrictEqual([...(capacities[0]?.from.fields ?? [])], ["interaction"]);
  });

  it("contains every marker and optional value into the arm it belongs to", () => {
    const owners = [
      [relations.DeclaredTextEntryBase, relations.TextEntryInteraction],
      [relations.TextEntryExpectedLength, relations.TextEntryInteraction],
      [relations.TextEntryPatternMask, relations.TextEntryInteraction],
      [relations.TextEntryPlaceholderText, relations.TextEntryInteraction],
      [relations.TextEntryFormat, relations.TextEntryInteraction],
      [relations.TextEntryPatternmaskMessage, relations.TextEntryInteraction],
      [relations.DeclaredExtendedTextBase, relations.ExtendedTextInteraction],
      [relations.DeclaredExtendedTextFormat, relations.ExtendedTextInteraction],
      [relations.DeclaredExtendedTextMinStrings, relations.ExtendedTextInteraction],
      [relations.ExtendedTextExpectedLength, relations.ExtendedTextInteraction],
      [relations.ExtendedTextPatternMask, relations.ExtendedTextInteraction],
      [relations.ExtendedTextPlaceholderText, relations.ExtendedTextInteraction],
      [relations.ExtendedTextMaxStrings, relations.ExtendedTextInteraction],
      [relations.ExtendedTextExpectedLines, relations.ExtendedTextInteraction],
      [relations.ExtendedTextPatternmaskMessage, relations.ExtendedTextInteraction],
      [relations.DeclaredInlineChoiceShuffle, relations.InlineChoiceInteraction],
      [relations.DeclaredInlineChoiceRequired, relations.InlineChoiceInteraction],
      [relations.DeclaredInlineChoiceMinChoices, relations.InlineChoiceInteraction],
      [relations.InlineChoicePrompt, relations.InlineChoiceInteraction],
      [relations.InlineChoiceMinSelectionsMessage, relations.InlineChoiceInteraction],
      [relations.DeclaredInlineChoiceFixed, relations.InlineChoice],
      [relations.DeclaredInlineChoiceShowHide, relations.InlineChoice],
    ] as const;

    for (const [optional, arm] of owners) {
      const owned = containmentsFrom(optional);
      assert.strictEqual(owned.length, 1, optional.name);
      assert.strictEqual(owned[0]?.target, arm, optional.name);
      assert.deepStrictEqual(owned[0]?.left, ["node"]);
      assert.deepStrictEqual(owned[0]?.right, ["id"]);
    }
  });

  it("keeps the label thin and the inline-choice template on ChoiceTemplateRef", () => {
    assert.deepStrictEqual(Object.keys(relations.QtiLabel.fields), ["id"]);
    assert.notProperty(relations, "Label");
    assert.notProperty(relations, "InlineChoiceTemplate");
  });
});
