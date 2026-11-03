import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as contracts from "#qti/schema/contracts.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as feedback from "#qti/schema/feedback.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";

/**
 * The probe schema: the spine relations feedback reads, with this module's own.
 */
const probe = () =>
  schema(
    "QtiFeedbackProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...feedback.relations,
    },
    [...node.rules, ...pkg.rules, ...document.rules, ...declaration.rules, ...feedback.rules],
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

const capacities = feedback.rules.filter((rule) => rule.kind === "capacity");

type Capacity = (typeof capacities)[number];

/**
 * The version a capacity's target selects, or the empty string where it selects none.
 */
const selectedVersion = (rule: Capacity): string => {
  const bindings = selectionOf(rule.target)?.bindings;

  return Predicate.hasProperty(bindings, "version") ? String(bindings.version) : "";
};

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity | undefined): readonly [unknown, unknown] => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [within.low, within.high];
};

describe("feedback", () => {
  it("builds the probe over node, declaration and feedback without refusal", () => {
    const built = probe();
    for (const name of [
      "FeedbackBlock",
      "TemplateFeedbackBlock",
      "FeedbackInline",
      "ModalFeedback",
      "FeedbackOutcomeRef",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("exports the nine handles, each feedback block kind on its own arm", () => {
    assert.deepStrictEqual(Object.keys(feedback.arms).toSorted(), [
      "qti-content-body.feedback",
      "qti-content-body.modal",
      "qti-content-body.rubric",
      "qti-content-body.rubricTemplate",
      "qti-content-body.template",
      "qti-feedback-block",
      "qti-feedback-block.template",
      "qti-feedback-inline",
      "qti-modal-feedback",
    ]);
    assert.strictEqual(feedback.arms["qti-feedback-block"], feedback.relations.FeedbackBlock);
    assert.strictEqual(
      feedback.arms["qti-feedback-block.template"],
      feedback.relations.TemplateFeedbackBlock,
    );
  });

  it("gives the template feedback block a feedback block's fields, keyed by id, with its own show-hide marker", () => {
    const { FeedbackBlock, TemplateFeedbackBlock } = feedback.relations;
    assert.deepStrictEqual(
      Object.keys(TemplateFeedbackBlock.fields),
      Object.keys(FeedbackBlock.fields),
    );
    assert.deepStrictEqual(Object.keys(TemplateFeedbackBlock.fields), [
      "id",
      "identifier",
      "outcomeIdentifier",
      "showHide",
    ]);
    assert.deepStrictEqual([...TemplateFeedbackBlock.primaryKey], ["id"]);

    const markers = feedback.rules
      .filter((rule) => rule.kind === "contained")
      .filter(
        (rule) => rule.left.source === feedback.relations.DeclaredTemplateFeedbackBlockShowHide,
      );
    assert.strictEqual(markers.length, 1);
    assert.deepStrictEqual([...(markers[0]?.left.fields ?? [])], ["node"]);
    assert.strictEqual(markers[0]?.right.source, TemplateFeedbackBlock);
    assert.deepStrictEqual([...(markers[0]?.right.fields ?? [])], ["id"]);
  });

  it("declares the selected-source probe: one body per 3.0.1 modal, at most one per 3.0.0", () => {
    assert.strictEqual(capacities.length, 2);

    const byVersion = new Map(capacities.map((rule) => [selectedVersion(rule), rule]));
    assert.deepStrictEqual([...byVersion.keys()].toSorted(), ["3.0.0", "3.0.1"]);
    for (const rule of capacities) {
      assert.strictEqual(selectionOf(rule.target)?.relation, feedback.relations.ModalFeedback);
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
      assert.strictEqual(selectionOf(rule.from)?.relation, node.relations.Edge);
      assert.deepStrictEqual(selectionOf(rule.from)?.bindings, {
        childKind: "qti-content-body.modal",
      });
      assert.deepStrictEqual([...rule.from.fields], ["parent"]);
    }
    assert.deepStrictEqual(boundsOf(byVersion.get("3.0.1")), [1n, 1n]);
    assert.deepStrictEqual(boundsOf(byVersion.get("3.0.0")), [0n, 1n]);
  });

  it("keeps ModalFeedback's version in step with its node, and holds no ModalContentBody", () => {
    assert.notProperty(feedback.relations, "ModalContentBody");

    const owned = feedback.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === feedback.relations.ModalFeedback);
    assert.strictEqual(owned.length, 1);
    assert.strictEqual(owned[0]?.right.source, node.relations.Node);
    assert.deepStrictEqual([...(owned[0]?.left.fields ?? [])], ["id", "version"]);
    assert.deepStrictEqual([...(owned[0]?.right.fields ?? [])], ["id", "version"]);
  });

  it("holds the FeedbackOutcomeRef key, both containments, the Node containment and the check", () => {
    const { FeedbackOutcomeRef } = feedback.relations;
    assert.deepStrictEqual([...FeedbackOutcomeRef.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(FeedbackOutcomeRef.fields).toSorted(), [
      "baseType",
      "cardinality",
      "document",
      "identifier",
      "node",
    ]);

    const from = feedback.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === FeedbackOutcomeRef)
      .map((rule) => ({
        left: [...rule.left.fields],
        right: [...rule.right.fields],
        selection: selectionOf(rule.right)?.bindings,
        target: selectionOf(rule.right)?.relation ?? rule.right.source,
      }));
    assert.deepStrictEqual(from, [
      {
        left: ["document", "identifier"],
        right: ["document", "identifier"],
        selection: { kind: "outcome" },
        target: declaration.relations.Declaration,
      },
      {
        left: ["document", "identifier", "baseType", "cardinality"],
        right: ["document", "identifier", "baseType", "cardinality"],
        selection: undefined,
        target: declaration.relations.TypedDeclaration,
      },
      {
        left: ["node", "document"],
        right: ["id", "tree"],
        selection: undefined,
        target: node.relations.Node,
      },
    ]);

    const checks = feedback.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [["FeedbackOutcomeRefType", FeedbackOutcomeRef]],
    );
  });
});

describe("contracts (feedback)", () => {
  it("types FeedbackBlock.outcomeIdentifier VariableReference", () => {
    assert.strictEqual(
      feedback.FeedbackBlock.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types TemplateFeedbackBlock.outcomeIdentifier VariableReference", () => {
    assert.strictEqual(
      feedback.TemplateFeedbackBlock.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types FeedbackInline.outcomeIdentifier VariableReference", () => {
    assert.strictEqual(
      feedback.FeedbackInline.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types ModalFeedback.outcomeIdentifier VariableReference", () => {
    assert.strictEqual(
      feedback.ModalFeedback.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
  });
});

describe("contracts (feedback)", () => {
  it("types FeedbackBlock.identifier ShowHideIdentifier", () => {
    assert.strictEqual(
      feedback.FeedbackBlock.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
  });
  it("types TemplateFeedbackBlock.identifier ShowHideIdentifier", () => {
    assert.strictEqual(
      feedback.TemplateFeedbackBlock.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
  });
  it("types FeedbackInline.identifier ShowHideIdentifier", () => {
    assert.strictEqual(
      feedback.FeedbackInline.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
  });
  it("types ModalFeedback.identifier ShowHideIdentifier", () => {
    assert.strictEqual(
      feedback.ModalFeedback.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
  });
});
