import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as contracts from "#pantry/schema/contracts.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as interaction from "#pantry/schema/interaction.ts";
import * as item from "#pantry/schema/item.ts";
import * as other from "#pantry/schema/interactions/other.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiOtherProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...item.relations,
      ...interaction.relations,
      ...rosters.relations,
      ...other.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...item.rules,
      ...interaction.rules,
      ...other.rules,
    ],
  );

/**
 * The selection a containment side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

type Rule = (typeof other.rules)[number];

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

/**
 * The containments whose left side is one relation, selected or not, as plain values.
 */
const containmentsFrom = (relation: { readonly name: string }) =>
  other.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: selectionOf(rule.right)?.relation ?? rule.right.source,
    }));

const { relations } = other;

const fields = (arm: { readonly fields: object }) => Object.keys(arm.fields).toSorted();

describe("interactions/other", () => {
  it("builds a schema over node, declaration, interaction, rosters and other without refusal", () => {
    const built = probe();
    for (const name of [
      "MediaInteraction",
      "UploadInteraction",
      "DrawingInteraction",
      "SliderInteraction",
      "EndAttemptInteraction",
      "SliderStep",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the five arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(other.arms).toSorted(), [
      "qti-drawing-interaction",
      "qti-end-attempt-interaction",
      "qti-media-interaction",
      "qti-slider-interaction",
      "qti-upload-interaction",
    ]);
    assert.strictEqual(other.arms["qti-media-interaction"], relations.MediaInteraction);
    assert.strictEqual(other.arms["qti-upload-interaction"], relations.UploadInteraction);
    assert.strictEqual(other.arms["qti-drawing-interaction"], relations.DrawingInteraction);
    assert.strictEqual(other.arms["qti-slider-interaction"], relations.SliderInteraction);
    assert.strictEqual(other.arms["qti-end-attempt-interaction"], relations.EndAttemptInteraction);
  });

  it("holds the MediaPlays check, reading maxPlaysN and minPlaysN", () => {
    const checks = other.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [["MediaPlays", relations.MediaInteraction]],
    );
    assert.deepStrictEqual(
      Object.keys(relations.MediaInteraction.fields).filter((field) => field.endsWith("PlaysN")),
      ["maxPlaysN", "minPlaysN"],
    );
  });

  it("keeps the slider step an optional relation, with no step column on the arm", () => {
    assert.deepStrictEqual([...relations.SliderStep.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(relations.SliderStep.fields).toSorted(), ["node", "value"]);
    assert.notProperty(relations.SliderInteraction.fields, "step");
    assert.strictEqual(relations.SliderStep.fields.value.pattern.source, patterns.positiveDouble);
  });

  it("types the slider bounds as SliderBound and requires autostart and title", () => {
    assert.strictEqual(
      relations.SliderInteraction.fields.lowerBound.name,
      contracts.SliderBound.name,
    );
    assert.strictEqual(
      relations.SliderInteraction.fields.upperBound.name,
      contracts.SliderBound.name,
    );
    assert.property(relations.MediaInteraction.fields, "autostart");
    assert.property(relations.EndAttemptInteraction.fields, "title");
  });

  it("declares each arm's columns", () => {
    assert.deepStrictEqual(fields(relations.MediaInteraction), [
      "autostart",
      "id",
      "loop",
      "maxPlaysN",
      "minPlaysN",
      "responseIdentifier",
      "rootKind",
    ]);
    assert.deepStrictEqual(fields(relations.UploadInteraction), [
      "id",
      "responseIdentifier",
      "rootKind",
    ]);
    assert.deepStrictEqual(fields(relations.DrawingInteraction), [
      "id",
      "responseIdentifier",
      "rootKind",
    ]);
    assert.deepStrictEqual(fields(relations.SliderInteraction), [
      "id",
      "lowerBound",
      "responseIdentifier",
      "rootKind",
      "stepLabel",
      "upperBound",
    ]);
    assert.deepStrictEqual(fields(relations.EndAttemptInteraction), [
      "id",
      "responseIdentifier",
      "rootKind",
      "title",
    ]);
  });

  it("holds the root copy and the item existence containments on each arm", () => {
    for (const arm of [
      relations.MediaInteraction,
      relations.UploadInteraction,
      relations.DrawingInteraction,
      relations.SliderInteraction,
      relations.EndAttemptInteraction,
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

  it("keeps the plays markers as a node alone, their values on the arm", () => {
    assert.deepStrictEqual(Object.keys(relations.MediaMaxPlays.fields), ["node"]);
    assert.deepStrictEqual(Object.keys(relations.MediaMinPlays.fields), ["node"]);
    assert.deepStrictEqual([...relations.MediaMaxPlays.primaryKey], ["node"]);
    assert.deepStrictEqual([...relations.MediaMinPlays.primaryKey], ["node"]);
  });

  it("contains every marker and optional value into the arm it belongs to", () => {
    const owners = [
      [relations.DeclaredMediaLoop, relations.MediaInteraction],
      [relations.MediaMaxPlays, relations.MediaInteraction],
      [relations.MediaMinPlays, relations.MediaInteraction],
      [relations.MediaCoords, relations.MediaInteraction],
      [relations.UploadType, relations.UploadInteraction],
      [relations.DeclaredSliderStepLabel, relations.SliderInteraction],
      [relations.SliderStep, relations.SliderInteraction],
      [relations.SliderOrientation, relations.SliderInteraction],
      [relations.SliderReverse, relations.SliderInteraction],
      [relations.EndAttemptCountAttempt, relations.EndAttemptInteraction],
    ] as const;

    for (const [optional, arm] of owners) {
      assert.deepStrictEqual([...optional.primaryKey], ["node"], optional.name);

      const owned = containmentsFrom(optional);
      assert.strictEqual(owned.length, 1, optional.name);
      assert.strictEqual(owned[0]?.target, arm, optional.name);
      assert.deepStrictEqual(owned[0]?.left, ["node"]);
      assert.deepStrictEqual(owned[0]?.right, ["id"]);
    }
  });

  it("types the media coordinates as a rect and the upload type as a media-type list", () => {
    assert.strictEqual(relations.MediaCoords.fields.value.base.pattern.source, patterns.coordsRect);
    assert.strictEqual(relations.UploadType.fields.value.pattern.source, patterns.mimeTypeList);
  });

  it("gives no arm a child-bearing relation", () => {
    const kinds: readonly string[] = other.rules.map((rule) => rule.kind);
    assert.deepStrictEqual(
      kinds.filter((kind) => kind !== "contained" && kind !== "check"),
      [],
    );

    const targets: readonly object[] = other.rules
      .filter((rule): rule is ContainedRule => rule.kind === "contained")
      .map((rule) => rule.right.source);
    assert.notInclude(targets, node.relations.Edge);
  });

  it("types its boolean, show-hide, orientation and format columns as closedId of their rosters", () => {
    assert.strictEqual(relations.MediaInteraction.fields.autostart.roster, rosters.XsBoolean);
    assert.strictEqual(relations.MediaInteraction.fields.loop.roster, rosters.XsBoolean);
    assert.strictEqual(relations.SliderInteraction.fields.stepLabel.roster, rosters.XsBoolean);
    assert.strictEqual(relations.SliderReverse.fields.value.roster, rosters.XsBoolean);
    assert.strictEqual(relations.EndAttemptCountAttempt.fields.value.roster, rosters.XsBoolean);
    assert.strictEqual(relations.SliderOrientation.fields.value.roster, rosters.Orientation);
  });
});

describe("contracts (interactions/other)", () => {
  it("types MediaCoords.value MediaRectCoords", () => {
    assert.strictEqual(other.MediaCoords.fields.value.name, contracts.MediaRectCoords.name);
  });
});
