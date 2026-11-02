import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it, layer } from "@effect/vitest";
import { NodeServices } from "@effect/platform-node";
import { Effect, FileSystem, Predicate } from "effect";
import path from "node:path";
import { inspect } from "node:util";
import { inject } from "vitest";
import { itemRows } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import { readXml } from "#qti/xml/read.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { fbFlagged } from "#qti/schema/seed/ancestry.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import { recordBindingFit } from "#qti/schema/seed/record-binding-fit.ts";

/**
 * The probe schema: the node module's relations and rules with this module's.
 */
const probe = () =>
  schema(
    "QtiInteractionProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
    ],
  );

/**
 * The names of the relations this module adds.
 */
const added = [
  "BindingFit",
  "ChoiceInteraction",
  "ChoiceInteractionMaxSelectionsMessage",
  "ChoiceInteractionMinSelectionsMessage",
  "DeclaredFixed",
  "DeclaredMaxChoices",
  "DeclaredMinChoices",
  "DeclaredOrientation",
  "DeclaredShowHide",
  "DeclaredShuffle",
  "GapMatchBinding",
  "InteractionBinding",
  "RecordBinding",
  "RecordBindingFit",
  "SimpleChoice",
  "SimpleChoiceTemplateIdentifier",
  "TypedBinding",
];

/**
 * The containments whose left side is the whole of one binding relation: each one's target
 * relation, then the left and right fields.
 */
const containedFrom = (
  relation:
    | typeof interaction.relations.InteractionBinding
    | typeof interaction.relations.TypedBinding,
) =>
  interaction.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === relation
      ? [
          [
            "relation" in rule.right.source ? rule.right.source.relation : rule.right.source,
            [...rule.left.fields],
            [...rule.right.fields],
          ],
        ]
      : [],
  );

describe("interaction", () => {
  it("builds a schema over node and interaction without refusal", () => {
    const built = probe();
    for (const name of added) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.strictEqual(
      built.statements.length,
      node.rules.length +
        pkg.rules.length +
        document.rules.length +
        declaration.rules.length +
        item.rules.length +
        interaction.rules.length,
    );
  });

  it("adds exactly the choice and binding relations", () => {
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

  it("holds the AdaptiveFeedback, ChoiceBounds and BindingMax checks on their relations", () => {
    const checks = interaction.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((rule) => [rule.name, rule.relation]),
      [
        ["AdaptiveFeedback", interaction.relations.InteractionBinding],
        ["BindingMax", interaction.relations.TypedBinding],
        ["ChoiceBounds", interaction.relations.ChoiceInteraction],
      ],
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

  it("the seed rows are distinct, roster-valid, and hold phase 1's two choice rows", () => {
    const keys = bindingFit.map((row) =>
      [row.interactionKind, row.baseType, row.cardinality].join("\u0000"),
    );
    assert.strictEqual(new Set(keys).size, bindingFit.length);

    for (const row of bindingFit) {
      assert.include(node.relations.NodeKind.handles, row.interactionKind);
      assert.include(declaration.relations.BaseType.handles, row.baseType);
      assert.include(declaration.relations.TypedCardinality.handles, row.cardinality);
    }

    assert.deepStrictEqual(
      bindingFit
        .filter((row) => row.interactionKind === "qti-choice-interaction")
        .toSorted((a, b) => a.cardinality.localeCompare(b.cardinality)),
      [
        {
          baseType: "identifier",
          cardinality: "multiple",
          interactionKind: "qti-choice-interaction",
        },
        {
          baseType: "identifier",
          cardinality: "single",
          interactionKind: "qti-choice-interaction",
        },
      ],
    );

    const { BindingFit } = interaction.relations;
    assert.deepStrictEqual(Object.keys(BindingFit.fields).toSorted(), [
      "baseType",
      "cardinality",
      "interactionKind",
    ]);
    assert.deepStrictEqual(
      [...BindingFit.primaryKey],
      ["interactionKind", "baseType", "cardinality"],
    );
  });

  it("keys InteractionBinding by node and by (document, responseIdentifier)", () => {
    const { InteractionBinding } = interaction.relations;
    assert.deepStrictEqual([...InteractionBinding.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(InteractionBinding.fields).toSorted(), [
      "adaptive",
      "ancestry",
      "document",
      "interactionKind",
      "node",
      "responseIdentifier",
      "shape",
    ]);

    const keys = interaction.rules.filter(
      (rule) => rule.kind === "key" && rule.relation === InteractionBinding,
    );
    assert.deepStrictEqual(
      keys.map((rule) => (rule.kind === "key" ? [...rule.fields] : [])),
      [["document", "responseIdentifier"]],
    );
  });

  it("declares the InteractionBinding alternatives with a typed and a record arm", () => {
    const rules = interaction.rules.filter(
      (rule) =>
        rule.kind === "alternatives" && rule.parent === interaction.relations.InteractionBinding,
    );
    assert.strictEqual(rules.length, 1);

    const [rule] = rules;
    if (rule?.kind !== "alternatives") {
      assert.fail("no alternatives rule");
    }

    assert.strictEqual(rule.discriminator, "shape");
    assert.strictEqual(rule.roster, declaration.relations.DeclarationShape);
    assert.deepStrictEqual(
      Object.entries(rule.arms).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["record", interaction.relations.RecordBinding],
        ["typed", interaction.relations.TypedBinding],
      ],
    );
  });

  it("contains each binding in the declaration, the fit table and the node", () => {
    const { InteractionBinding, TypedBinding } = interaction.relations;
    assert.deepStrictEqual(containedFrom(TypedBinding), [
      [
        declaration.relations.TypedDeclaration,
        ["document", "responseIdentifier", "baseType", "cardinality"],
        ["document", "identifier", "baseType", "cardinality"],
      ],
      [
        interaction.relations.BindingFit,
        ["interactionKind", "baseType", "cardinality"],
        ["interactionKind", "baseType", "cardinality"],
      ],
    ]);
    assert.strictEqual(containedFrom(InteractionBinding).length, 5);
  });

  it("contains each binding's ancestry in its node and its adaptive in its item", () => {
    assert.deepStrictEqual(
      containedFrom(interaction.relations.InteractionBinding).filter(
        ([target]) => target === node.relations.Node || target === item.relations.AssessmentItem,
      ),
      [
        [node.relations.Node, ["node", "document", "interactionKind"], ["id", "tree", "kind"]],
        [node.relations.Node, ["node", "ancestry"], ["id", "ancestry"]],
        [item.relations.AssessmentItem, ["document", "adaptive"], ["tree", "adaptive"]],
      ],
    );
  });

  it("holds AdaptiveFeedback over ancestry and adaptive, from the one fbFlagged roster", () => {
    const rule = interaction.rules.find(
      (candidate) => candidate.kind === "check" && candidate.name === "AdaptiveFeedback",
    );
    if (rule?.kind !== "check") {
      assert.fail("no AdaptiveFeedback check");
    }

    assert.strictEqual(rule.relation, interaction.relations.InteractionBinding);

    const described: unknown = rule;
    const text = Predicate.hasProperty(described, "desc")
      ? inspect(described.desc, { depth: null, maxStringLength: 100_000 })
      : "";
    assert.include(text, "ancestry");
    assert.include(text, "adaptive");
    assert.include(text, "true");
    for (const handle of fbFlagged) {
      assert.include(text, handle);
    }
  });

  it("keys GapMatchBinding by node, contained in TypedBinding by (node, cardinality)", () => {
    const { GapMatchBinding, TypedBinding } = interaction.relations;
    assert.deepStrictEqual([...GapMatchBinding.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(GapMatchBinding.fields).toSorted(), ["cardinality", "node"]);

    const owned = interaction.rules.filter(
      (rule) => rule.kind === "contained" && rule.left.source === GapMatchBinding,
    );
    assert.deepStrictEqual(
      owned.map((rule) =>
        rule.kind === "contained"
          ? [rule.right.source, [...rule.left.fields], [...rule.right.fields]]
          : [],
      ),
      [[TypedBinding, ["node", "cardinality"], ["node", "cardinality"]]],
    );
  });

  it("keys RecordBindingFit by interactionKind and contains each RecordBinding in it", () => {
    const { RecordBinding, RecordBindingFit } = interaction.relations;
    assert.deepStrictEqual([...RecordBindingFit.primaryKey], ["interactionKind"]);
    assert.deepStrictEqual(Object.keys(RecordBindingFit.fields), ["interactionKind"]);
    assert.deepStrictEqual(
      interaction.rules
        .filter((rule) => rule.kind === "contained" && rule.left.source === RecordBinding)
        .map((rule) =>
          rule.kind === "contained"
            ? [rule.right.source, [...rule.left.fields], [...rule.right.fields]]
            : [],
        ),
      [[RecordBindingFit, ["interactionKind"], ["interactionKind"]]],
    );
    assert.deepStrictEqual(recordBindingFit.map((row) => row.interactionKind).toSorted(), [
      "qti-extended-text-interaction",
      "qti-text-entry-interaction",
    ]);
  });

  it("holds no containment of SimpleChoice.(interaction) into ChoiceInteraction.(id) (decision 23)", () => {
    const offending = interaction.rules.filter(
      (rule) =>
        rule.kind === "contained" &&
        rule.left.source === interaction.relations.SimpleChoice &&
        rule.right.source === interaction.relations.ChoiceInteraction,
    );
    assert.strictEqual(offending.length, 0);
  });

  it("requires every item choice interaction to have a binding", () => {
    const rule = interaction.rules.find(
      (candidate) =>
        candidate.kind === "contained" &&
        candidate.right.source === interaction.relations.InteractionBinding,
    );
    if (rule?.kind !== "contained") {
      assert.fail("no existence containment");
    }

    const { source } = rule.left;
    assert.isTrue(
      "relation" in source && source.relation === interaction.relations.ChoiceInteraction,
    );
    assert.deepStrictEqual([...rule.left.fields], ["id", "responseIdentifier"]);
    assert.deepStrictEqual([...rule.right.fields], ["node", "responseIdentifier"]);
    assert.deepStrictEqual("bindings" in source ? source.bindings : undefined, {
      rootKind: "item",
    });
  });
});

layer(NodeServices.layer, { excludeTestServices: true })("the importer's copies", (suite) => {
  suite.effect("the choice interaction's InteractionBinding carries ancestry and adaptive", () =>
    Effect.gen(function* bindingCopies() {
      const fs = yield* FileSystem.FileSystem;
      const bytes = yield* fs.readFile(path.join(inject("fixtures").simple, "choice.xml"));
      const doc = yield* readXml(bytes);
      const { rows } = yield* itemRows(
        {
          doc,
          packageId: "22222222-2222-4222-8222-222222222222",
          path: "choice.xml",
          resource: "choice",
          resourceLomHasGeneral: true,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const [binding, ...rest] = Rows.of(rows, interaction.InteractionBinding);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(binding?.ancestry, "root");
      assert.strictEqual(binding?.adaptive, "false");
    }),
  );
});
