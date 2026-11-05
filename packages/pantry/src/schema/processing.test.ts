import { readFileSync } from "node:fs";
import { inspect } from "node:util";
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as expressionAttributes from "#pantry/schema/expression-attributes.ts";
import * as item from "#pantry/schema/item.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#pantry/schema/seed/operator-arity.ts";
import * as value from "#pantry/schema/value.ts";
import { printSeed } from "#pantry/test/seed.ts";
import { seedPrintTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The probe schema: the modules whose relations this module's rules name, with this module's. The
 * statements that name the document, reference and test modules' relations are
 * `#pantry/schema/test/processing.ts`'s, and its test composes them.
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
      ...rosters.relations,
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
 * The names of the relations and rosters this module exports: the exports that carry fields or
 * handles.
 */
const exportedNames = (): readonly string[] =>
  Object.values(processing).flatMap((exported) =>
    Predicate.hasProperty(exported, "name") &&
    Predicate.isString(exported.name) &&
    (Predicate.hasProperty(exported, "fields") || Predicate.hasProperty(exported, "handles"))
      ? [exported.name]
      : [],
  );

/**
 * Table A of the phase-3 spec (3.3): each expression kind with the least and the most child
 * expressions its XSD content admits, `"*"` where it has no upper bound. It is the second copy of
 * the derivation `seed/operator-arity.ts` keeps in its comment.
 */
const tableA: readonly (readonly [string, number, number | "*"])[] = [
  ["qti-base-value", 0, 0],
  ["qti-variable", 0, 0],
  ["qti-default", 0, 0],
  ["qti-correct", 0, 0],
  ["qti-map-response", 0, 0],
  ["qti-map-response-point", 0, 0],
  ["qti-math-constant", 0, 0],
  ["qti-null", 0, 0],
  ["qti-random-integer", 0, 0],
  ["qti-random-float", 0, 0],
  ["qti-number-correct", 0, 0],
  ["qti-number-incorrect", 0, 0],
  ["qti-number-presented", 0, 0],
  ["qti-number-responded", 0, 0],
  ["qti-number-selected", 0, 0],
  ["qti-outcome-minimum", 0, 0],
  ["qti-outcome-maximum", 0, 0],
  ["qti-test-variables", 0, 0],
  ["qti-and", 1, "*"],
  ["qti-or", 1, "*"],
  ["qti-not", 1, 1],
  ["qti-any-n", 1, "*"],
  ["qti-match", 2, 2],
  ["qti-equal", 2, 2],
  ["qti-equal-rounded", 2, 2],
  ["qti-gt", 2, 2],
  ["qti-gte", 2, 2],
  ["qti-lt", 2, 2],
  ["qti-lte", 2, 2],
  ["qti-duration-lt", 2, 2],
  ["qti-duration-gte", 2, 2],
  ["qti-member", 2, 2],
  ["qti-contains", 2, 2],
  ["qti-delete", 2, 2],
  ["qti-substring", 2, 2],
  ["qti-string-match", 2, 2],
  ["qti-pattern-match", 1, 1],
  ["qti-inside", 1, 1],
  ["qti-multiple", 0, "*"],
  ["qti-ordered", 0, "*"],
  ["qti-repeat", 1, "*"],
  ["qti-container-size", 1, 1],
  ["qti-is-null", 1, 1],
  ["qti-random", 1, 1],
  ["qti-index", 1, 1],
  ["qti-field-value", 1, 1],
  ["qti-sum", 1, "*"],
  ["qti-product", 1, "*"],
  ["qti-subtract", 2, 2],
  ["qti-divide", 2, 2],
  ["qti-power", 2, 2],
  ["qti-integer-divide", 2, 2],
  ["qti-integer-modulus", 2, 2],
  ["qti-integer-to-float", 1, 1],
  ["qti-round", 1, 1],
  ["qti-truncate", 1, 1],
  ["qti-round-to", 1, 1],
  ["qti-min", 1, "*"],
  ["qti-max", 1, "*"],
  ["qti-gcd", 1, "*"],
  ["qti-lcm", 1, "*"],
  ["qti-math-operator", 1, "*"],
  ["qti-stats-operator", 1, 1],
  ["qti-custom-operator", 0, "*"],
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
 * The predicates of the row checks a statement list holds over one relation, as text.
 */
const predicateText = (
  statements: readonly { readonly kind: string }[],
  owner: { readonly name: string },
): readonly string[] =>
  statements.flatMap((statement) =>
    statement.kind === "check" && "relation" in statement && statement.relation === owner
      ? [
          inspect(
            Predicate.hasProperty(statement, "desc") &&
              Predicate.hasProperty(statement.desc, "predicate")
              ? statement.desc.predicate
              : undefined,
            {
              depth: null,
              maxStringLength: 100_000,
            },
          ),
        ]
      : [],
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * The containments of one relation, selected or whole on the left: the left bindings, the left
 * fields, the right relation, its bindings and its fields.
 */
const lawsFrom = (owner: { readonly name: string }) =>
  ofKind("contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === owner)
    .map((rule) => [
      selectionOf(rule.left)?.bindings,
      [...rule.left.fields],
      selectionOf(rule.right)?.relation ?? rule.right.source,
      selectionOf(rule.right)?.bindings,
      [...rule.right.fields],
    ]);

describe("processing", () => {
  it("builds a schema over node, item and processing without refusal", () => {
    const built = probe();
    for (const name of Object.keys(processing.relations)) {
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

  it("lists every relation and roster the module declares, each under its own name", () => {
    assert.includeMembers(Object.keys(processing.relations), [...exportedNames()]);
    for (const [name, member] of Object.entries(processing.relations)) {
      assert.strictEqual(member.name, name);
    }
    for (const name of [
      "ArityBound",
      "ExpressionMax",
      "OperatorArityUnbounded",
      "TemplateParameterRef",
    ]) {
      assert.include(Object.keys(processing.relations), name);
    }
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

  it("holds the ProcessingRoot check on ResponseProcessing and every check on this module's relations", () => {
    const checks = ofKind("check");
    assert.deepStrictEqual(
      checks.filter((check) => check.name === "ProcessingRoot").map((check) => check.relation),
      [processing.relations.ResponseProcessing],
    );
    for (const check of checks) {
      assert.isTrue(
        Object.values(processing.relations).some((member) => member === check.relation),
        check.name,
      );
    }
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

      return selection?.relation === processing.relations.ResponseProcessing
        ? [{ rule, selection }]
        : [];
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
    assert.strictEqual(ResponseProcessingTemplate.fields.uri.base.pattern.source, patterns.anyUri);
    assert.strictEqual(
      ResponseProcessingTemplateLocation.fields.uri.base.pattern.source,
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
    assert.deepStrictEqual(Object.keys(Expression.fields).toSorted(), [
      "bounded",
      "document",
      "id",
      "kind",
      "min",
    ]);
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
    assert.deepStrictEqual(
      containedFrom(processing.relations.Expression).filter(
        ([target]) => target === node.relations.Node,
      ),
      [[node.relations.Node, ["id", "document", "kind"], ["id", "tree", "kind"]]],
    );
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
    assert.deepStrictEqual(
      containedFrom(Operand).filter(([target]) => target === processing.relations.Expression),
      [
        [processing.relations.Expression, ["expression"], ["id"]],
        [processing.relations.Expression, ["child"], ["id"]],
      ],
    );
  });

  it("holds the three operator arity tables equal to table A, row for row", () => {
    assert.deepStrictEqual(
      operatorArity.map((row) => [row.kind, Number(row.min)]),
      tableA.map(([kind, min]) => [kind, min]),
    );
    assert.deepStrictEqual(
      operatorArityMax.map((row) => [row.kind, Number(row.max)]),
      tableA.flatMap(([kind, , max]) => (max === "*" ? [] : [[kind, max]])),
    );
    assert.deepStrictEqual(
      operatorArityUnbounded.map((row) => row.kind),
      tableA.flatMap(([kind, , max]) => (max === "*" ? [kind] : [])),
    );
  });

  it("partitions the arity kinds into the bounded and the unbounded", () => {
    const bounded = operatorArityMax.map((row) => row.kind);
    const unbounded = operatorArityUnbounded.map((row) => row.kind);
    assert.deepStrictEqual(
      bounded.filter((kind) => unbounded.includes(kind)),
      [],
    );
    assert.deepStrictEqual(
      [...bounded, ...unbounded].toSorted(),
      operatorArity.map((row) => row.kind).toSorted(),
    );
    for (const kinds of [bounded, unbounded]) {
      assert.strictEqual(new Set(kinds).size, kinds.length);
      assert.includeMembers([...node.NodeKind.handles], kinds);
    }

    const source = readFileSync(new URL("seed/operator-arity.ts", import.meta.url), "utf-8");
    assert.match(source, /python3 -I/u);
    assert.match(source, /qti-repeat\s+min=1 max=\*/u);
    assert.match(source, /qti-base-value\s+min=0 max=0/u);
    assert.match(source, /qti-sum\s+min=1 max=\*/u);
  });

  it(
    "prints as many OperatorArityUnbounded tuples as the seed module has rows",
    () => {
      const sql = printSeed([]);
      const prefix = 'INSERT INTO "qti"."operator_arity_unbounded" ("kind") VALUES ';
      const tuples = sql
        .split("\n")
        .filter((line) => line.startsWith(prefix))
        .reduce((total, line) => total + line.split("), (").length, 0);
      assert.strictEqual(tuples, operatorArityUnbounded.length);
    },
    seedPrintTestTimeoutMs,
  );

  it("binds Expression to the arity tables: min, bounded, and the two selected containments", () => {
    const { ArityBound, Expression, OperatorArity, OperatorArityMax, OperatorArityUnbounded } =
      processing.relations;
    assert.deepStrictEqual([...ArityBound.handles], ["bounded", "unbounded"]);
    assert.deepStrictEqual(Object.keys(Expression.fields).toSorted(), [
      "bounded",
      "document",
      "id",
      "kind",
      "min",
    ]);
    assert.strictEqual(Expression.fields.bounded.roster, ArityBound);
    assert.deepStrictEqual(Object.keys(OperatorArityUnbounded.fields), ["kind"]);
    assert.deepStrictEqual([...OperatorArityUnbounded.primaryKey], ["kind"]);
    assert.strictEqual(OperatorArityUnbounded.fields.kind.roster, node.NodeKind);
    assert.deepStrictEqual(
      containedFrom(Expression).filter(([target]) => target === OperatorArity),
      [[OperatorArity, ["kind", "min"], ["kind", "min"]]],
    );

    const selected = ofKind("contained").flatMap((rule) => {
      const selection = selectionOf(rule.left);

      return selection?.relation === Expression
        ? [[selection.bindings, [...rule.left.fields], rule.right.source, [...rule.right.fields]]]
        : [];
    });
    assert.deepStrictEqual(selected, [
      [{ bounded: "bounded" }, ["kind"], OperatorArityMax, ["kind"]],
      [{ bounded: "unbounded" }, ["kind"], OperatorArityUnbounded, ["kind"]],
      [{ bounded: "bounded" }, ["id", "kind"], processing.relations.ExpressionMax, ["id", "kind"]],
    ]);
  });

  it("keys ExpressionMax by id and binds it to Expression and OperatorArityMax", () => {
    const { Expression, ExpressionMax, OperatorArityMax } = processing.relations;
    assert.deepStrictEqual(Object.keys(ExpressionMax.fields).toSorted(), ["id", "kind", "max"]);
    assert.deepStrictEqual([...ExpressionMax.primaryKey], ["id"]);
    assert.deepStrictEqual(containedFrom(ExpressionMax), [
      [Expression, ["id", "kind"], ["id", "kind"]],
      [OperatorArityMax, ["kind", "max"], ["kind", "max"]],
    ]);
  });

  it("states the two capacities of an expression's operands, as ref and star, zero and ref", () => {
    const capacities = ofKind("capacity");
    assert.strictEqual(capacities.length, 2);

    const [lower, upper] = capacities;
    assert.strictEqual(lower?.target.source, processing.relations.Expression);
    assert.strictEqual(lower?.from.source, processing.relations.Operand);
    assert.deepStrictEqual([...(lower?.from.fields ?? [])], ["expression"]);
    assert.strictEqual(upper?.target.source, processing.relations.ExpressionMax);
    assert.strictEqual(upper?.from.source, processing.relations.Operand);
    assert.deepStrictEqual([...(upper?.from.fields ?? [])], ["expression"]);

    const bounds = (statement: typeof lower) =>
      inspect(
        Predicate.hasProperty(statement, "desc") && Predicate.hasProperty(statement.desc, "within")
          ? statement.desc.within
          : undefined,
        { depth: null },
      );
    assert.include(bounds(lower), "min");
    assert.include(bounds(lower), "*");
    assert.notInclude(bounds(lower), "max");
    assert.include(bounds(upper), "0n");
    assert.include(bounds(upper), "max");
  });

  it("binds each Operand to the Edge it hangs from, by (child, expression, position)", () => {
    assert.deepStrictEqual(
      containedFrom(processing.relations.Operand).filter(
        ([target]) => target === node.relations.Edge,
      ),
      [[node.relations.Edge, ["child", "expression", "position"], ["child", "parent", "position"]]],
    );
  });

  it("names the referring kinds on the three reference arms and the rules over them", () => {
    const { BuiltInRef, DeclaredRef, TemplateParameterRef } = processing.relations;
    assert.include(processing.RefKind.handles, "templateParameter");
    assert.strictEqual(processing.RefKind.handles.at(-1), "sectionVariable");
    assert.deepStrictEqual(Object.keys(DeclaredRef.fields).toSorted(), [
      "declarationKind",
      "document",
      "id",
      "identifier",
      "referrerKind",
    ]);
    assert.strictEqual(
      DeclaredRef.fields.declarationKind.roster,
      declaration.relations.DeclarationKind,
    );
    assert.deepStrictEqual(Object.keys(BuiltInRef.fields).toSorted(), [
      "id",
      "name",
      "referrerKind",
    ]);
    assert.deepStrictEqual(Object.keys(TemplateParameterRef.fields).toSorted(), [
      "document",
      "id",
      "identifier",
      "referrerKind",
      "rootKind",
    ]);
    assert.deepStrictEqual([...TemplateParameterRef.primaryKey], ["id"]);

    assert.deepStrictEqual(containedFrom(DeclaredRef), [
      [
        declaration.relations.Declaration,
        ["document", "identifier", "declarationKind"],
        ["document", "identifier", "kind"],
      ],
      [node.relations.Node, ["id", "referrerKind"], ["id", "kind"]],
    ]);
    assert.deepStrictEqual(containedFrom(BuiltInRef), [
      [node.relations.Node, ["id", "referrerKind"], ["id", "kind"]],
    ]);
    assert.deepStrictEqual(containedFrom(TemplateParameterRef), [
      [node.relations.Node, ["id", "rootKind"], ["id", "rootKind"]],
      [node.relations.Node, ["id", "document"], ["id", "tree"]],
      [node.relations.Node, ["id", "referrerKind"], ["id", "kind"]],
    ]);

    const variableRef = ofKind("alternatives").find(
      (candidate) => candidate.parent === processing.relations.VariableRef,
    );
    assert.deepStrictEqual(Object.keys(variableRef?.arms ?? {}).toSorted(), [
      "builtIn",
      "declared",
      "itemInstanceVariable",
      "itemVariable",
      "sectionDuration",
      "templateParameter",
    ]);

    const declaredChecks = predicateText(processing.rules, DeclaredRef);
    assert.strictEqual(declaredChecks.length, 1);
    for (const needle of ["referrerKind", "declarationKind", "qti-set-default-value"]) {
      assert.include(declaredChecks[0], needle);
    }
    const builtInChecks = predicateText(processing.rules, BuiltInRef);
    assert.strictEqual(builtInChecks.length, 1);
    for (const needle of ["referrerKind", "completionStatus", "qti-set-outcome-value"]) {
      assert.include(builtInChecks[0], needle);
    }
    const templateChecks = predicateText(processing.rules, TemplateParameterRef);
    assert.strictEqual(templateChecks.length, 2);
    assert.isTrue(templateChecks.some((text) => text.includes("rptemplate")));
  });

  it("names the twelve holder kinds on RuleOperand and the two outcome bounds on OutcomeMinMax", () => {
    const [holders = ""] = predicateText(ruleSchema.rules, ruleSchema.relations.RuleOperand);
    for (const kind of [
      "qti-set-outcome-value",
      "qti-lookup-outcome-value",
      "qti-set-template-value",
      "qti-set-default-value",
      "qti-set-correct-response",
      "qti-template-constraint",
      "qti-response-if",
      "qti-response-else-if",
      "qti-outcome-if",
      "qti-outcome-else-if",
      "qti-template-if",
      "qti-template-else-if",
    ]) {
      assert.include(holders, kind);
    }
    const [bounds = ""] = predicateText(
      expressionAttributes.rules,
      expressionAttributes.relations.OutcomeMinMax,
    );
    assert.include(bounds, "qti-outcome-minimum");
    assert.include(bounds, "qti-outcome-maximum");
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

  it("declares VariableRef alternatives over RefKind with the declared, built-in, template-parameter and prefixed arms", () => {
    const { VariableRef, DeclaredRef, BuiltInRef } = processing.relations;
    assert.deepStrictEqual(
      [...processing.relations.RefKind.handles],
      [
        "declared",
        "builtIn",
        "itemVariable",
        "itemInstanceVariable",
        "sectionDuration",
        "templateParameter",
        "sectionVariable",
      ],
    );
    assert.deepStrictEqual(
      [...processing.relations.BuiltIn.handles],
      ["completionStatus", "numAttempts", "duration", "QTI_CONTEXT"],
    );
    assert.deepStrictEqual(Object.keys(VariableRef.fields).toSorted(), ["document", "id", "kind"]);
    assert.deepStrictEqual(Object.keys(DeclaredRef.fields).toSorted(), [
      "declarationKind",
      "document",
      "id",
      "identifier",
      "referrerKind",
    ]);
    assert.deepStrictEqual(Object.keys(BuiltInRef.fields).toSorted(), [
      "id",
      "name",
      "referrerKind",
    ]);

    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === VariableRef,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.discriminator, "kind");
    assert.strictEqual(rule?.roster, processing.relations.RefKind);
    assert.deepStrictEqual(rule?.arms, {
      builtIn: BuiltInRef,
      declared: DeclaredRef,
      itemInstanceVariable: processing.relations.ItemInstanceVariableRef,
      itemVariable: processing.relations.ItemVariableRef,
      sectionDuration: processing.relations.SectionDurationRef,
      templateParameter: processing.relations.TemplateParameterRef,
    });
    assert.deepStrictEqual(containedFrom(VariableRef), [
      [node.relations.Node, ["id", "document"], ["id", "tree"]],
    ]);
    assert.deepStrictEqual(
      containedFrom(DeclaredRef).filter(([target]) => target === declaration.relations.Declaration),
      [
        [
          declaration.relations.Declaration,
          ["document", "identifier", "declarationKind"],
          ["document", "identifier", "kind"],
        ],
      ],
    );
  });
});

describe("contracts (processing)", () => {
  it("types ResponseProcessingTemplate.uri TemplateUri", () => {
    assert.strictEqual(
      processing.ResponseProcessingTemplate.fields.uri.name,
      contracts.TemplateUri.name,
    );
  });
  it("types ResponseProcessingTemplateLocation.uri TemplateLocationUri", () => {
    assert.strictEqual(
      processing.ResponseProcessingTemplateLocation.fields.uri.name,
      contracts.TemplateLocationUri.name,
    );
  });
  it("types TemplateParameterRef.identifier TemplateParameterName", () => {
    assert.strictEqual(
      processing.TemplateParameterRef.fields.identifier.name,
      contracts.TemplateParameterName.name,
    );
  });
});

/**
 * The relations the prefixed and section variable references add, each with its columns (sorted)
 * and primary key, in the spec's 4.9.
 */
const headings = [
  ["ItemVariableRef", ["document", "id", "prefix", "root", "variable"], ["id"]],
  ["ItemInstanceVariableRef", ["document", "id", "instance", "prefix", "root", "variable"], ["id"]],
  ["SectionDurationRef", ["document", "id", "prefix", "root"], ["id"]],
  ["SectionVariableRef", ["document", "id", "identifier", "referrerKind", "root"], ["id"]],
  ["ItemInstanceSpelling", ["ref", "value"], ["ref"]],
  [
    "PrefixedVariableSource",
    ["document", "itemDocument", "itemRef", "prefix", "ref", "refKind", "source", "test"],
    ["ref", "test"],
  ],
  ["PrefixedDeclared", ["itemDocument", "ref", "test", "variable"], ["ref", "test"]],
  ["PrefixedMapped", ["itemRef", "ref", "test", "variable"], ["ref", "test"]],
  ["PrefixedBuiltIn", ["builtIn", "ref", "test"], ["ref", "test"]],
  [
    "SectionDurationTarget",
    ["document", "holder", "holderKind", "prefix", "ref", "refKind", "test"],
    ["ref", "test"],
  ],
  ["SectionVariableResolution", ["document", "ref", "target", "test"], ["ref", "test"]],
  [
    "SectionVariableDeclared",
    ["declarationKind", "identifier", "ref", "referrerKind", "test"],
    ["ref", "test"],
  ],
  ["SectionVariablePrefixed", ["ref", "test"], ["ref", "test"]],
  ["SectionVariableDuration", ["ref", "test"], ["ref", "test"]],
] as const;

describe("processing headings: the prefixed arms and the per-test relations", () => {
  it("declares 14 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(headings.length, 14);
    for (const [name, columns, primaryKey] of headings) {
      const relation = processing.relations[name];
      assert.strictEqual(relation.name, name);
      assert.deepStrictEqual(Object.keys(relation.fields).toSorted(), [...columns], name);
      assert.deepStrictEqual([...relation.primaryKey], [...primaryKey], name);
    }
  });

  it("appends sectionVariable last to RefKind, seven handles in all", () => {
    assert.deepStrictEqual(
      [...processing.RefKind.handles],
      [
        "declared",
        "builtIn",
        "itemVariable",
        "itemInstanceVariable",
        "sectionDuration",
        "templateParameter",
        "sectionVariable",
      ],
    );
  });

  it("types the columns by their rosters and contracts", () => {
    const r = processing.relations;
    for (const name of [
      "ItemVariableRef",
      "ItemInstanceVariableRef",
      "SectionDurationRef",
      "SectionVariableRef",
    ] as const) {
      assert.strictEqual(r[name].fields.root.roster, node.RootKind, name);
    }
    assert.strictEqual(r.SectionVariableRef.fields.referrerKind.roster, node.NodeKind);
    assert.strictEqual(r.SectionVariableRef.fields.identifier.pattern.source, patterns.ncName);
    for (const name of [
      "ItemVariableRef",
      "ItemInstanceVariableRef",
      "SectionDurationRef",
      "PrefixedVariableSource",
      "SectionDurationTarget",
    ] as const) {
      assert.strictEqual(r[name].fields.prefix.name, contracts.TestStructureIdentifier.name, name);
    }
    assert.strictEqual(r.PrefixedMapped.fields.variable.name, contracts.MappedVariableName.name);
    assert.strictEqual(r.PrefixedVariableSource.fields.refKind.roster, processing.RefKind);
    assert.strictEqual(r.PrefixedVariableSource.fields.source.roster, rosters.PrefixedSource);
    assert.strictEqual(r.PrefixedBuiltIn.fields.builtIn.roster, processing.BuiltIn);
    assert.strictEqual(r.SectionDurationTarget.fields.refKind.roster, processing.RefKind);
    assert.strictEqual(r.SectionDurationTarget.fields.holderKind.roster, rosters.StructureHolder);
    assert.strictEqual(
      r.SectionVariableResolution.fields.target.roster,
      rosters.SectionVariableTarget,
    );
    assert.strictEqual(
      r.SectionVariableDeclared.fields.declarationKind.roster,
      declaration.DeclarationKind,
    );
    assert.strictEqual(r.SectionVariableDeclared.fields.referrerKind.roster, node.NodeKind);
    assert.strictEqual(
      r.ItemInstanceSpelling.fields.value.pattern.source,
      patterns.nonCanonicalInteger,
    );
  });

  it("keeps the instance spelling and positivity as laws of the instance arm", () => {
    const { ItemInstanceSpelling, ItemInstanceVariableRef } = processing.relations;
    assert.deepStrictEqual(lawsFrom(ItemInstanceSpelling), [
      [undefined, ["ref"], ItemInstanceVariableRef, undefined, ["id"]],
    ]);

    const positive = predicateText(
      ofKind("check").filter((check) => check.name === "ItemInstancePositive"),
      ItemInstanceVariableRef,
    );
    assert.strictEqual(positive.length, 1);
    assert.include(positive[0], "instance");
    assert.include(positive[0], "1n");
    assert.deepStrictEqual(
      ofKind("check")
        .filter((check) => check.relation === ItemInstanceVariableRef)
        .map((check) => check.name),
      ["ItemInstanceVariableRoot", "ItemInstancePositive"],
    );
  });

  it("binds each prefixed arm to VariableRef and to its own test's row", () => {
    const { ItemInstanceVariableRef, ItemVariableRef, SectionDurationRef, VariableRef } =
      processing.relations;
    const { PrefixedVariableSource, SectionDurationTarget } = processing.relations;
    const resolved = { root: "test" };
    for (const [arm, target] of [
      [ItemVariableRef, PrefixedVariableSource],
      [ItemInstanceVariableRef, PrefixedVariableSource],
      [SectionDurationRef, SectionDurationTarget],
    ] as const) {
      assert.deepStrictEqual(
        lawsFrom(arm),
        [
          [undefined, ["id", "document"], VariableRef, undefined, ["id", "document"]],
          [resolved, ["id", "document"], target, undefined, ["ref", "test"]],
        ],
        arm.name,
      );

      const checks = predicateText(processing.rules, arm).filter((text) => text.includes("root"));
      assert.strictEqual(checks.length, 1, arm.name);
      assert.include(checks[0], "test", arm.name);
    }
    const rootChecks = new Set([
      "ItemVariableRoot",
      "ItemInstanceVariableRoot",
      "SectionDurationRoot",
    ]);
    assert.deepStrictEqual(
      ofKind("check")
        .filter((check) => rootChecks.has(check.name))
        .map((check) => [check.name, check.relation.name]),
      [
        ["ItemVariableRoot", "ItemVariableRef"],
        ["ItemInstanceVariableRoot", "ItemInstanceVariableRef"],
        ["SectionDurationRoot", "SectionDurationRef"],
      ],
    );
  });

  it("ties the hub PrefixedVariableSource to its reference and the arms", () => {
    const { ItemInstanceVariableRef, ItemVariableRef, PrefixedVariableSource, VariableRef } =
      processing.relations;
    assert.deepStrictEqual(lawsFrom(PrefixedVariableSource), [
      [
        undefined,
        ["ref", "document", "refKind"],
        VariableRef,
        undefined,
        ["id", "document", "kind"],
      ],
      [
        { refKind: "itemVariable" },
        ["ref", "prefix"],
        ItemVariableRef,
        undefined,
        ["id", "prefix"],
      ],
      [
        { refKind: "itemInstanceVariable" },
        ["ref", "prefix"],
        ItemInstanceVariableRef,
        undefined,
        ["id", "prefix"],
      ],
    ]);

    const checks = predicateText(processing.rules, PrefixedVariableSource);
    assert.strictEqual(checks.length, 1);
    for (const handle of ["itemVariable", "itemInstanceVariable", "sectionVariable"]) {
      assert.include(checks[0], handle);
    }
    for (const handle of ["declared", "builtIn", "sectionDuration", "templateParameter"]) {
      assert.notInclude(checks[0], `'${handle}'`);
    }

    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === PrefixedVariableSource,
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.discriminator, "source");
    assert.strictEqual(rule?.roster, rosters.relations.PrefixedSource);
    assert.deepStrictEqual(rule?.arms, {
      builtIn: processing.relations.PrefixedBuiltIn,
      declared: processing.relations.PrefixedDeclared,
      mapped: processing.relations.PrefixedMapped,
    });
  });

  it("homes each prefixed source in the hub and in the declaration, mapping or built-in set it names", () => {
    const { PrefixedBuiltIn, PrefixedDeclared, PrefixedMapped, PrefixedVariableSource } =
      processing.relations;
    assert.deepStrictEqual(lawsFrom(PrefixedDeclared), [
      [
        undefined,
        ["ref", "test", "itemDocument"],
        PrefixedVariableSource,
        undefined,
        ["ref", "test", "itemDocument"],
      ],
      [
        undefined,
        ["itemDocument", "variable"],
        declaration.relations.Declaration,
        undefined,
        ["document", "identifier"],
      ],
    ]);
    assert.deepStrictEqual(lawsFrom(PrefixedMapped), [
      [
        undefined,
        ["ref", "test", "itemRef"],
        PrefixedVariableSource,
        undefined,
        ["ref", "test", "itemRef"],
      ],
    ]);
    assert.deepStrictEqual(lawsFrom(PrefixedBuiltIn), [
      [undefined, ["ref", "test"], PrefixedVariableSource, undefined, ["ref", "test"]],
    ]);

    const [builtIn = ""] = predicateText(processing.rules, PrefixedBuiltIn);
    for (const handle of ["duration", "numAttempts", "completionStatus"]) {
      assert.include(builtIn, handle);
    }
    assert.notInclude(builtIn, "QTI_CONTEXT");
    assert.deepStrictEqual(
      [PrefixedDeclared, PrefixedMapped].map((owner) => predicateText(processing.rules, owner)),
      [[], []],
    );
  });

  it("binds SectionDurationTarget to its reference and the part or section it names", () => {
    const { SectionDurationRef, SectionDurationTarget, VariableRef } = processing.relations;
    assert.deepStrictEqual(lawsFrom(SectionDurationTarget), [
      [
        undefined,
        ["ref", "document", "refKind"],
        VariableRef,
        undefined,
        ["id", "document", "kind"],
      ],
      [
        { refKind: "sectionDuration" },
        ["ref", "document", "prefix"],
        SectionDurationRef,
        undefined,
        ["id", "document", "prefix"],
      ],
    ]);

    const checks = predicateText(processing.rules, SectionDurationTarget);
    assert.strictEqual(checks.length, 2);

    const kinds = checks.find((text) => text.includes("refKind")) ?? "";
    for (const handle of ["sectionDuration", "sectionVariable"]) {
      assert.include(kinds, handle);
    }
    const holders = checks.find((text) => text.includes("holderKind")) ?? "";
    for (const handle of ["part", "section"]) {
      assert.include(holders, `'${handle}'`);
    }
    assert.notInclude(holders, "itemRef");
  });

  it("selects at most one side of every containment this module declares", () => {
    for (const rule of ofKind("contained")) {
      assert.isFalse(
        selectionOf(rule.left) !== undefined && selectionOf(rule.right) !== undefined,
        String(rule.left.fields),
      );
    }
  });
});
