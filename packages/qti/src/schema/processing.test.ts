import { readFileSync } from "node:fs";
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as processing from "#qti/schema/processing.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The probe schema: the node and item modules' relations and rules with this module's.
 */
const probe = () =>
  schema(
    "QtiProcessingProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...item.relations,
      ...processing.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...item.rules,
      ...processing.rules,
    ],
  );

/**
 * The names of the relations this module adds.
 */
const added = [
  "BuiltIn",
  "BuiltInRef",
  "DeclaredRef",
  "Expression",
  "Literal",
  "LiteralBoolean",
  "LiteralDirectedPair",
  "LiteralDuration",
  "LiteralFile",
  "LiteralFloat",
  "LiteralIdentifier",
  "LiteralInteger",
  "LiteralPair",
  "LiteralPoint",
  "LiteralString",
  "LiteralUri",
  "Operand",
  "OperatorArity",
  "OperatorArityMax",
  "RefKind",
  "ResponseProcessing",
  "ResponseProcessingItem",
  "ResponseProcessingTemplate",
  "ResponseProcessingTemplateLocation",
  "StandardTemplate",
  "StandardTemplateReference",
  "VariableRef",
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
 * The containments whose left side names a relation whole: the right relation, then both field
 * lists.
 */
const containedFrom = (owner: (typeof processing.relations)[keyof typeof processing.relations]) =>
  ofKind("contained")
    .filter((rule) => rule.left.source === owner)
    .map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]);

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
      node.rules.length +
        pkg.rules.length +
        document.rules.length +
        declaration.rules.length +
        value.rules.length +
        item.rules.length +
        processing.rules.length,
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

  it("keys Expression and OperatorArity by NodeKind and keeps no ExpressionKind roster", () => {
    const { Expression, OperatorArity, OperatorArityMax } = processing.relations;
    assert.deepStrictEqual(Object.keys(Expression.fields).toSorted(), ["document", "id", "kind"]);
    assert.deepStrictEqual([...Expression.primaryKey], ["id"]);
    assert.strictEqual(Expression.fields.kind.roster, node.NodeKind);
    assert.deepStrictEqual(Object.keys(OperatorArity.fields).toSorted(), ["kind", "min"]);
    assert.deepStrictEqual([...OperatorArity.primaryKey], ["kind"]);
    assert.strictEqual(OperatorArity.fields.kind.roster, node.NodeKind);
    assert.deepStrictEqual(Object.keys(OperatorArityMax.fields).toSorted(), ["kind", "max"]);
    assert.deepStrictEqual([...OperatorArityMax.primaryKey], ["kind"]);
    assert.strictEqual(OperatorArityMax.fields.kind.roster, node.NodeKind);
    assert.notInclude(Object.keys(processing.relations), "ExpressionKind");
  });

  it("contains Expression in Node by (id, document, kind) and Literal in Expression by id", () => {
    assert.deepStrictEqual(containedFrom(processing.relations.Expression), [
      [node.relations.Node, ["id", "document", "kind"], ["id", "tree", "kind"]],
    ]);
    assert.deepStrictEqual(containedFrom(processing.relations.Literal), [
      [processing.relations.Expression, ["id"], ["id"]],
    ]);
  });

  it("keys Operand by (expression, position) and child, both into Expression", () => {
    const { Operand } = processing.relations;
    assert.deepStrictEqual(Object.keys(Operand.fields).toSorted(), [
      "child",
      "expression",
      "position",
    ]);
    assert.deepStrictEqual([...Operand.primaryKey], ["expression", "position"]);
    assert.deepStrictEqual(
      ofKind("key")
        .filter((rule) => rule.relation === Operand)
        .map((rule) => [...rule.fields]),
      [["child"]],
    );
    assert.deepStrictEqual(containedFrom(Operand), [
      [processing.relations.Expression, ["expression"], ["id"]],
      [processing.relations.Expression, ["child"], ["id"]],
    ]);
  });

  it("holds the operator arity tables equal to the seed module's, empty until phase 3", () => {
    assert.deepStrictEqual(operatorArity, []);
    assert.deepStrictEqual(operatorArityMax, []);

    const source = readFileSync(new URL("seed/operator-arity.ts", import.meta.url), "utf-8");
    assert.match(source, /python3 -I/u);
    assert.match(source, /qti-repeat\s+min=1 max=\*/u);
    assert.match(source, /qti-base-value\s+min=0 max=0/u);
    assert.match(source, /qti-sum\s+min=1 max=\*/u);
  });

  it("gives Literal one base-type arm per base type", () => {
    const { Literal } = processing.relations;
    assert.deepStrictEqual(Object.keys(Literal.fields).toSorted(), ["baseType", "id"]);
    assert.deepStrictEqual([...Literal.primaryKey], ["id"]);

    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === Literal,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.discriminator, "baseType");
    assert.strictEqual(rule?.roster, declaration.relations.BaseType);
    assert.strictEqual(Object.keys(rule?.arms ?? {}).length, 11);
    assert.deepStrictEqual(
      Object.keys(rule?.arms ?? {}).toSorted(),
      [...declaration.BaseType.handles].toSorted(),
    );
  });

  it("declares VariableRef alternatives over RefKind with the declared and built-in arms", () => {
    const { VariableRef, DeclaredRef, BuiltInRef } = processing.relations;
    assert.deepStrictEqual(
      [...processing.relations.RefKind.handles],
      ["declared", "builtIn", "itemVariable", "itemInstanceVariable", "sectionDuration"],
    );
    assert.deepStrictEqual(
      [...processing.relations.BuiltIn.handles],
      ["completionStatus", "numAttempts", "duration", "QTI_CONTEXT"],
    );
    assert.deepStrictEqual(Object.keys(VariableRef.fields).toSorted(), ["document", "id", "kind"]);
    assert.deepStrictEqual(Object.keys(DeclaredRef.fields).toSorted(), [
      "document",
      "id",
      "identifier",
    ]);
    assert.deepStrictEqual(Object.keys(BuiltInRef.fields).toSorted(), ["id", "name"]);

    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === VariableRef,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.discriminator, "kind");
    assert.strictEqual(rule?.roster, processing.relations.RefKind);
    assert.deepStrictEqual(rule?.arms, { builtIn: BuiltInRef, declared: DeclaredRef });
    assert.deepStrictEqual(containedFrom(VariableRef), [
      [node.relations.Node, ["id", "document"], ["id", "tree"]],
    ]);
    assert.deepStrictEqual(containedFrom(DeclaredRef), [
      [declaration.relations.Declaration, ["document", "identifier"], ["document", "identifier"]],
    ]);
  });
});
