import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as processing from "#qti/schema/processing.ts";

/**
 * The probe schema: the node and item modules' relations and rules with this module's.
 */
const probe = () =>
  schema("QtiProcessingProbe", { ...node.relations, ...item.relations, ...processing.relations }, [
    ...node.rules,
    ...item.rules,
    ...processing.rules,
  ]);

/**
 * The names of the relations this module adds.
 */
const added = [
  "ResponseProcessing",
  "ResponseProcessingItem",
  "ResponseProcessingTemplate",
  "ResponseProcessingTemplateLocation",
  "StandardTemplate",
  "StandardTemplateReference",
];

/**
 * The statements `processing.rules` declares of one kind.
 */
const ofKind = <K extends (typeof processing.rules)[number]["kind"]>(kind: K) =>
  processing.rules.filter(
    (rule): rule is Extract<(typeof processing.rules)[number], { readonly kind: K }> =>
      rule.kind === kind,
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

describe("processing", () => {
  it("builds a schema over node, item and processing without refusal", () => {
    const built = probe();
    for (const name of added) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.strictEqual(
      built.statements.length,
      node.rules.length + item.rules.length + processing.rules.length,
    );
  });

  it("adds exactly the processing relations", () => {
    assert.deepStrictEqual(Object.keys(processing.relations).toSorted(), added);
  });

  it("gives ResponseProcessing exactly the fields id and rootKind", () => {
    assert.deepStrictEqual(Object.keys(processing.relations.ResponseProcessing.fields).toSorted(), [
      "id",
      "rootKind",
    ]);
    assert.deepStrictEqual([...processing.relations.ResponseProcessing.primaryKey], ["id"]);
  });

  it("carries the candidate key (item) on ResponseProcessingItem", () => {
    const { ResponseProcessingItem } = processing.relations;
    assert.deepStrictEqual(Object.keys(ResponseProcessingItem.fields).toSorted(), ["id", "item"]);
    assert.deepStrictEqual([...ResponseProcessingItem.primaryKey], ["id"]);
    assert.deepStrictEqual(
      ofKind("key")
        .filter((rule) => rule.relation === ResponseProcessingItem)
        .map((rule) => [...rule.fields]),
      [["item"]],
    );
  });

  it("holds the ProcessingRoot check on ResponseProcessing, and no other check", () => {
    assert.deepStrictEqual(
      ofKind("check").map((rule) => [rule.name, rule.relation]),
      [["ProcessingRoot", processing.relations.ResponseProcessing]],
    );
  });

  it("mirrors the item-rooted processing nodes with ResponseProcessingItem on id", () => {
    const [rule, ...rest] = ofKind("mirrors");
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    if (rule === undefined) {
      return;
    }

    const selection = selectionOf(rule.left);
    assert.strictEqual(selection?.relation, processing.relations.ResponseProcessing);
    assert.deepStrictEqual(selection?.bindings, { rootKind: "item" });
    assert.deepStrictEqual([...rule.left.fields], ["id"]);
    assert.strictEqual(rule.right.source, processing.relations.ResponseProcessingItem);
    assert.deepStrictEqual([...rule.right.fields], ["id"]);
  });

  it("contains the template-rooted processing nodes in TreeRoot by node", () => {
    const selected = ofKind("contained").flatMap((rule) => {
      const selection = selectionOf(rule.left);

      return selection === undefined ? [] : [{ rule, selection }];
    });
    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0]?.selection.relation, processing.relations.ResponseProcessing);
    assert.deepStrictEqual(selected[0]?.selection.bindings, { rootKind: "rptemplate" });
    assert.deepStrictEqual([...(selected[0]?.rule.left.fields ?? [])], ["id"]);
    assert.strictEqual(selected[0]?.rule.right.source, node.relations.TreeRoot);
    assert.deepStrictEqual([...(selected[0]?.rule.right.fields ?? [])], ["node"]);
  });

  it("contains each processing node in Node by (id, rootKind)", () => {
    const into = ofKind("contained").filter(
      (rule) => rule.left.source === processing.relations.ResponseProcessing,
    );
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [[node.relations.Node, ["id", "rootKind"], ["id", "rootKind"]]],
    );
  });

  it("contains a processing item row in Edge by (id, item) and in AssessmentItem by item", () => {
    const from = ofKind("contained").filter(
      (rule) => rule.left.source === processing.relations.ResponseProcessingItem,
    );
    assert.deepStrictEqual(
      from.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [
        [node.relations.Edge, ["id", "item"], ["child", "parent"]],
        [item.relations.AssessmentItem, ["item"], ["id"]],
      ],
    );
  });

  it("chains the template relations by node, each keyed by node", () => {
    const { ResponseProcessing, ResponseProcessingTemplate } = processing.relations;
    const chain = [
      [ResponseProcessingTemplate, ResponseProcessing],
      [processing.relations.ResponseProcessingTemplateLocation, ResponseProcessing],
      [processing.relations.StandardTemplateReference, ResponseProcessingTemplate],
    ] as const;
    for (const [relation, owner] of chain) {
      assert.deepStrictEqual([...relation.primaryKey], ["node"], relation.name);

      const owned = ofKind("contained").filter(
        (rule) => rule.left.source === relation && rule.right.source === owner,
      );
      assert.strictEqual(owned.length, 1, relation.name);
    }
  });

  it("types both template URIs as anyUri", () => {
    const { ResponseProcessingTemplate, ResponseProcessingTemplateLocation } = processing.relations;
    assert.strictEqual(ResponseProcessingTemplate.fields.uri.pattern.source, patterns.anyUri);
    assert.strictEqual(
      ResponseProcessingTemplateLocation.fields.uri.pattern.source,
      patterns.anyUri,
    );
  });

  it("lists the six published standard templates in order", () => {
    assert.deepStrictEqual(
      [...processing.StandardTemplate.handles],
      [
        "match_correct",
        "map_response",
        "map_response_point",
        "CC2_match",
        "CC2_match_basic",
        "CC2_map_response",
      ],
    );
  });

  it("keys the response processing kind arm by id", () => {
    assert.deepStrictEqual(Object.keys(processing.arms), ["qti-response-processing"]);
    assert.strictEqual(
      processing.arms["qti-response-processing"],
      processing.relations.ResponseProcessing,
    );
  });
});
