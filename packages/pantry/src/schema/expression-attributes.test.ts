import { schema } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inspect } from "node:util";
import * as contracts from "#pantry/schema/contracts.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as expression from "#pantry/schema/expression.ts";
import * as expressionAttributes from "#pantry/schema/expression-attributes.ts";
import * as item from "#pantry/schema/item.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as referenceSchema from "#pantry/schema/reference.ts";
import * as stimulus from "#pantry/schema/stimulus.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as testRules from "#pantry/schema/test/rules.ts";
import * as testStructure from "#pantry/schema/test/structure.ts";
import * as value from "#pantry/schema/value.ts";

/**
 * The 21 attributed kinds this module arms, each with the relation that is its arm.
 */
const armNames = {
  "qti-any-n": "AnyN",
  "qti-custom-operator": "CustomOperator",
  "qti-equal": "Equal",
  "qti-equal-rounded": "EqualRounded",
  "qti-field-value": "FieldValue",
  "qti-index": "Index",
  "qti-inside": "Inside",
  "qti-math-constant": "MathConstant",
  "qti-math-operator": "MathOperator",
  "qti-outcome-maximum": "OutcomeMaximumArm",
  "qti-outcome-minimum": "OutcomeMinimumArm",
  "qti-pattern-match": "PatternMatch",
  "qti-random-float": "RandomFloat",
  "qti-random-integer": "RandomInteger",
  "qti-repeat": "Repeat",
  "qti-round-to": "RoundTo",
  "qti-stats-operator": "StatsOperator",
  "qti-string-match": "StringMatch",
  "qti-substring": "Substring",
  "qti-test-variables": "TestVariables",
  "qti-variable": "Variable",
} as const;

/**
 * The two thin arms of `OutcomeMinMax`, which are contained in it and not in `Expression`.
 */
const thinArms = ["OutcomeMaximumArm", "OutcomeMinimumArm"];

/**
 * The 19 arms that each own their columns and are contained in `Expression` by id.
 */
const singleRelationArms = Object.values(armNames).filter((name) => !thinArms.includes(name));

/**
 * Section 3.3 table A's 64 expression kinds: the oracle for the cover of `expression.ts`'s arms and
 * this module's.
 */
const tableA = [
  "qti-and",
  "qti-any-n",
  "qti-base-value",
  "qti-container-size",
  "qti-contains",
  "qti-correct",
  "qti-custom-operator",
  "qti-default",
  "qti-delete",
  "qti-divide",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-field-value",
  "qti-gcd",
  "qti-gt",
  "qti-gte",
  "qti-index",
  "qti-inside",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-is-null",
  "qti-lcm",
  "qti-lt",
  "qti-lte",
  "qti-map-response",
  "qti-map-response-point",
  "qti-match",
  "qti-math-constant",
  "qti-math-operator",
  "qti-max",
  "qti-member",
  "qti-min",
  "qti-multiple",
  "qti-not",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-or",
  "qti-ordered",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-pattern-match",
  "qti-power",
  "qti-product",
  "qti-random",
  "qti-random-float",
  "qti-random-integer",
  "qti-repeat",
  "qti-round",
  "qti-round-to",
  "qti-stats-operator",
  "qti-string-match",
  "qti-substring",
  "qti-subtract",
  "qti-sum",
  "qti-test-variables",
  "qti-truncate",
  "qti-variable",
];

/**
 * The four reference arms of a number-or-variable attribute: each is keyed by the node it names,
 * carries the variable's `identifier` and belongs to the parent whose kind column says `ref`.
 */
const refArms = {
  EqualRoundedFiguresRef: ["EqualRounded", "figuresKind", "figuresValue"],
  IndexNRef: ["Index", "nKind", "nValue"],
  RepeatNumberRepeatsRef: ["Repeat", "numberRepeatsKind", "numberRepeatsValue"],
  RoundToFiguresRef: ["RoundTo", "figuresKind", "figuresValue"],
} as const;

/**
 * Whether a containment or capacity side selects `relation` where `kindField` is `ref`.
 */
const selectionOn = (
  side: { readonly source: object },
  relation: AnyRelation | undefined,
  kindField: string,
): boolean => {
  const selection =
    "relation" in side.source && "bindings" in side.source ? side.source : undefined;

  return (
    selection?.relation === relation &&
    JSON.stringify(selection?.bindings) === JSON.stringify({ [kindField]: "ref" })
  );
};

/**
 * The markers and optional values `Equal` and `EqualRounded` own, and the relation that is not an
 * arm: `EqualTolerance` and `OutcomeMinMax` and the roster the typed copies name.
 */
const others = ["EqualTolerance", "OutcomeMinMax", "RefOrLiteral"];

/**
 * The optional relations, each with the field set it carries and the arm its `node` is contained
 * in.
 */
const optional = {
  CustomOperatorClass: ["CustomOperator", ["node", "value"]],
  CustomOperatorDefinition: ["CustomOperator", ["node", "value"]],
  DeclaredIncludeLowerBound: ["Equal", ["node"]],
  DeclaredIncludeUpperBound: ["Equal", ["node"]],
  DeclaredRoundingMode: ["EqualRounded", ["node"]],
  DeclaredSubstring: ["StringMatch", ["node"]],
  DeclaredToleranceMode: ["Equal", ["node"]],
  ExpressionWeightIdentifier: ["Expression", ["node", "value"]],
  RandomFloatMin: ["RandomFloat", ["node", "value"]],
  RandomIntegerMin: ["RandomInteger", ["node", "value"]],
  RandomIntegerStep: ["RandomInteger", ["node", "value"]],
  TestVariablesBaseType: ["TestVariables", ["node", "value"]],
  VariableWeightIdentifier: ["Variable", ["node", "rootKind", "value"]],
} as const;

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

const relationsByName = new Map(
  Object.entries(expressionAttributes.relations).flatMap(([name, member]) =>
    "primaryKey" in member ? [[name, member] as const] : [],
  ),
);

const armsByKind = new Map(Object.entries(expressionAttributes.arms));

/**
 * The containments whose left side names the relation whole, as the right relation's name then
 * both field lists.
 */
const containedFrom = (owner: { readonly name: string } | undefined) =>
  expressionAttributes.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === owner && "name" in rule.right.source
      ? [[rule.right.source.name, [...rule.left.fields], [...rule.right.fields]]]
      : [],
  );

/**
 * The column names of the relation of this module called `name`.
 */
const fields = (name: string) => Object.keys(relationsByName.get(name)?.fields ?? {});

const probe = () =>
  schema(
    "QtiExpressionAttributesProbe",
    {
      ...node.relations,
      ...attributes.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...item.relations,
      ...rosters.relations,
      ...processing.relations,
      ...referenceSchema.relations,
      ...stimulus.relations,
      ...testRules.relations,
      ...testStructure.relations,
      ...expression.relations,
      ...expressionAttributes.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...item.rules,
      ...processing.rules,
      ...testStructure.rules,
      ...expression.rules,
      ...expressionAttributes.rules,
    ],
  );

describe("expression-attributes", () => {
  it("keys the arms by the 21 attributed kinds", () => {
    assert.deepStrictEqual(
      Object.keys(expressionAttributes.arms).toSorted(),
      Object.keys(armNames).toSorted(),
    );
  });

  it("covers table A's 64 kinds exactly once with expression.ts's arms", () => {
    const kinds = [...Object.keys(expression.arms), ...Object.keys(expressionAttributes.arms)];
    assert.strictEqual(new Set(kinds).size, kinds.length);
    assert.deepStrictEqual(kinds.toSorted(), tableA.toSorted());
    assert.strictEqual(tableA.length, 64);
  });

  it("gives each kind its own arm relation, keyed by id", () => {
    for (const [kind, name] of Object.entries(armNames)) {
      const relation = relationsByName.get(name);
      assert.isDefined(relation, name);
      assert.isTrue(armsByKind.get(kind) === relation, kind);
      assert.include(Object.keys(relation?.fields ?? {}), "id", name);
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["id"], name);
    }
  });

  it("adds exactly the 21 arms, the optional relations, the four reference arms and the three others", () => {
    assert.deepStrictEqual(
      Object.keys(expressionAttributes.relations).toSorted(),
      [
        ...Object.values(armNames),
        ...Object.keys(optional),
        ...Object.keys(refArms),
        ...others,
      ].toSorted(),
    );
  });

  it("gives each arm the columns table A names", () => {
    assert.deepStrictEqual(fields("Variable"), ["id"]);
    assert.deepStrictEqual(fields("MathConstant"), ["id", "name"]);
    assert.deepStrictEqual(fields("MathOperator"), ["id", "name"]);
    assert.deepStrictEqual(fields("StatsOperator"), ["id", "name"]);
    assert.deepStrictEqual(fields("AnyN"), ["id", "max", "min"]);
    assert.deepStrictEqual(fields("RandomInteger"), ["id", "max"]);
    assert.deepStrictEqual(fields("RandomFloat"), ["id", "max"]);
    assert.deepStrictEqual(fields("FieldValue"), ["fieldIdentifier", "id"]);
    assert.deepStrictEqual(fields("Inside"), ["coords", "id", "shape"]);
    assert.deepStrictEqual(fields("PatternMatch"), ["id", "pattern"]);
    assert.deepStrictEqual(fields("Substring"), ["caseSensitive", "id"]);
    assert.deepStrictEqual(fields("StringMatch"), ["caseSensitive", "id", "substring"]);
    assert.deepStrictEqual(fields("CustomOperator"), ["id"]);
    assert.deepStrictEqual(fields("TestVariables"), ["id", "variableIdentifier"]);
    assert.deepStrictEqual(fields("Equal"), [
      "id",
      "includeLowerBound",
      "includeUpperBound",
      "toleranceMode",
    ]);
    assert.deepStrictEqual(fields("EqualTolerance"), ["node", "toleranceMode", "value"]);
    assert.deepStrictEqual(fields("EqualRounded"), [
      "figuresKind",
      "figuresValue",
      "id",
      "roundingMode",
    ]);
    assert.deepStrictEqual(fields("RoundTo"), [
      "figuresKind",
      "figuresValue",
      "id",
      "roundingMode",
    ]);
    assert.deepStrictEqual(fields("Index"), ["id", "nKind", "nValue"]);
    assert.deepStrictEqual(fields("Repeat"), ["id", "numberRepeatsKind", "numberRepeatsValue"]);
    assert.deepStrictEqual(fields("OutcomeMinMax"), ["id", "kind", "outcomeIdentifier"]);
    assert.deepStrictEqual(fields("OutcomeMinimumArm"), ["id"]);
    assert.deepStrictEqual(fields("OutcomeMaximumArm"), ["id"]);
  });

  it("keys each optional relation by node with its own field set", () => {
    for (const [name, [, columns]] of Object.entries(optional)) {
      const relation = relationsByName.get(name);
      assert.isDefined(relation, name);
      assert.deepStrictEqual(Object.keys(relation?.fields ?? {}).toSorted(), [...columns], name);
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["node"], name);
    }
  });

  it("contains each optional relation's node in its owner's id", () => {
    for (const [name, [owner]] of Object.entries(optional)) {
      const into = containedFrom(relationsByName.get(name)).filter(([target]) => target === owner);
      assert.deepStrictEqual(into, [[owner, ["node"], ["id"]]], name);
    }
  });

  it("contains each of the 19 single-relation arms and OutcomeMinMax in Expression by id", () => {
    assert.strictEqual(singleRelationArms.length, 19);
    for (const name of [...singleRelationArms, "OutcomeMinMax"]) {
      const into = containedFrom(relationsByName.get(name)).filter(
        ([target]) => target === "Expression",
      );
      assert.deepStrictEqual(into, [["Expression", ["id"], ["id"]]], name);
    }
  });

  it("contains the two thin arms in OutcomeMinMax by id and in nothing else", () => {
    for (const name of thinArms) {
      assert.deepStrictEqual(
        containedFrom(relationsByName.get(name)),
        [["OutcomeMinMax", ["id"], ["id"]]],
        name,
      );
    }
  });

  it("keys OutcomeMinMax by id and binds (id, kind) into Node", () => {
    const outcome = relationsByName.get("OutcomeMinMax");
    assert.deepStrictEqual([...(outcome?.primaryKey ?? [])], ["id"]);
    assert.deepStrictEqual(
      containedFrom(outcome).filter(([target]) => target === "Node"),
      [["Node", ["id", "kind"], ["id", "kind"]]],
    );
  });

  it("holds the selected containments of P36 from Equal into EqualTolerance", () => {
    const tolerance = relationsByName.get("EqualTolerance");
    assert.deepStrictEqual([...(tolerance?.primaryKey ?? [])], ["node"]);
    assert.deepStrictEqual(
      containedFrom(tolerance).filter(([target]) => target === "Equal"),
      [["Equal", ["node", "toleranceMode"], ["id", "toleranceMode"]]],
    );

    const selected = expressionAttributes.rules.flatMap((rule) => {
      const selection = rule.kind === "contained" ? selectionOf(rule.left) : undefined;

      return rule.kind === "contained" && selection !== undefined ? [{ rule, selection }] : [];
    });
    assert.deepStrictEqual(
      selected.map(({ selection }) => [
        Predicate.hasProperty(selection.relation, "name") ? selection.relation.name : undefined,
        selection.bindings,
      ]),
      [
        ["Equal", { toleranceMode: "absolute" }],
        ["Equal", { toleranceMode: "relative" }],
      ],
    );
    for (const { rule } of selected) {
      assert.deepStrictEqual([...rule.left.fields], ["id"]);
      assert.isTrue(rule.right.source === tolerance);
      assert.deepStrictEqual([...rule.right.fields], ["node"]);
    }
  });

  it("types the closed attributes as closedId of their rosters", () => {
    const { relations } = expressionAttributes;
    assert.strictEqual(relations.Substring.fields.caseSensitive.roster, rosters.XsBoolean);
    assert.strictEqual(relations.StringMatch.fields.caseSensitive.roster, rosters.XsBoolean);
    assert.strictEqual(relations.StringMatch.fields.substring.roster, rosters.XsBoolean);
    assert.strictEqual(relations.Equal.fields.includeLowerBound.roster, rosters.XsBoolean);
    assert.strictEqual(relations.Equal.fields.includeUpperBound.roster, rosters.XsBoolean);
    assert.strictEqual(relations.Equal.fields.toleranceMode.roster, rosters.ToleranceMode);
    assert.strictEqual(relations.EqualTolerance.fields.toleranceMode.roster, rosters.ToleranceMode);
    assert.strictEqual(relations.EqualRounded.fields.roundingMode.roster, rosters.RoundingMode);
    assert.strictEqual(relations.RoundTo.fields.roundingMode.roster, rosters.RoundingMode);
    assert.strictEqual(relations.TestVariablesBaseType.fields.value.roster, declaration.BaseType);
    assert.strictEqual(relations.Inside.fields.shape.roster, rosters.Shape);
    assert.strictEqual(relations.MathConstant.fields.name.roster, rosters.MathConstantName);
    assert.strictEqual(relations.MathOperator.fields.name.roster, rosters.MathOperatorName);
    assert.strictEqual(relations.StatsOperator.fields.name.roster, rosters.StatsOperatorName);
  });

  it("states the toleranceMode containments and roundingMode checks over handles of their rosters", () => {
    const selected = expressionAttributes.rules.flatMap((rule) => {
      const selection = rule.kind === "contained" ? selectionOf(rule.left) : undefined;

      return selection === undefined ? [] : [selection.bindings];
    });
    assert.deepStrictEqual(selected, [
      { toleranceMode: "absolute" },
      { toleranceMode: "relative" },
    ]);
    assert.includeMembers([...rosters.ToleranceMode.handles], ["absolute", "relative"]);

    for (const name of ["EqualRounded", "RoundTo"] as const) {
      const rule = expressionAttributes.rules.find(
        (found) => found.kind === "check" && found.relation === relationsByName.get(name),
      );
      const text = inspect(rule && "desc" in rule ? rule.desc : undefined, {
        depth: null,
        maxStringLength: 100_000,
      });
      for (const handle of rosters.RoundingMode.handles) {
        assert.include(text, handle, name);
      }
    }
  });

  it("holds the P10, P11 and range checks on their relations and no mirrors", () => {
    const checks = expressionAttributes.rules.filter((rule) => rule.kind === "check");
    const onRelation = (name: string) =>
      checks.filter((rule) => rule.relation === relationsByName.get(name));
    const text = (name: string) => {
      const [rule] = onRelation(name);

      return inspect(rule && "desc" in rule ? rule.desc : undefined, {
        depth: null,
        maxStringLength: 100_000,
      });
    };
    for (const name of ["EqualRounded", "RoundTo", "Index", "Repeat"]) {
      assert.strictEqual(onRelation(name).length, 2, name);
    }

    assert.strictEqual(onRelation("VariableWeightIdentifier").length, 1);
    for (const rule of checks) {
      assert.isTrue(
        [...relationsByName.values()].some((relation) => relation === rule.relation),
        rule.name,
      );
    }

    for (const name of ["EqualRounded", "RoundTo"]) {
      for (const needle of ["figuresKind", "significantFigures", "decimalPlaces", "figuresValue"]) {
        assert.include(text(name), needle, name);
      }
    }
    assert.include(text("Index"), "nValue");
    assert.include(text("Repeat"), "-2147483648");
    assert.include(text("Repeat"), "2147483647");

    const kinds: readonly string[] = expressionAttributes.rules.map((rule) => rule.kind);
    assert.notInclude(kinds, "mirrors");
  });

  it("contains Variable in VariableRef by id, the only referring kind", () => {
    const refs = Object.values(armNames).flatMap((name) =>
      containedFrom(relationsByName.get(name)).filter(([target]) => target === "VariableRef"),
    );
    assert.deepStrictEqual(refs, [["VariableRef", ["id"], ["id"]]]);
    assert.deepStrictEqual(
      containedFrom(relationsByName.get("Variable")).filter(([t]) => t === "VariableRef"),
      refs,
    );
  });

  it("pins VariableWeightIdentifier to the node's root kind, which must be test", () => {
    const weight = relationsByName.get("VariableWeightIdentifier");
    assert.deepStrictEqual(
      containedFrom(weight).filter(([target]) => target === "Node"),
      [["Node", ["node", "rootKind"], ["id", "rootKind"]]],
    );

    const checks = expressionAttributes.rules.filter(
      (rule) => rule.kind === "check" && rule.relation === weight,
    );
    assert.strictEqual(checks.length, 1);
  });

  it("builds a schema over the leaves without refusal", () => {
    const built = probe();
    for (const name of [
      ...Object.values(armNames),
      ...Object.keys(optional),
      ...Object.keys(refArms),
      ...others,
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("states each reference arm by form: containment, capacity of one and zero beside it", () => {
    let statements = 0;
    for (const [name, [parentName, kindField, valueField]] of Object.entries(refArms)) {
      const reference = relationsByName.get(name);
      const parent = relationsByName.get(parentName);
      assert.deepStrictEqual(Object.keys(reference?.fields ?? {}), ["identifier", "node"], name);
      assert.deepStrictEqual([...(reference?.primaryKey ?? [])], ["node"], name);

      const contained = expressionAttributes.rules.filter(
        (rule) =>
          rule.kind === "contained" &&
          rule.left.source === reference &&
          selectionOn(rule.right, parent, kindField),
      );
      assert.strictEqual(contained.length, 1, name);
      for (const rule of contained) {
        if (rule.kind === "contained") {
          assert.deepStrictEqual([...rule.left.fields], ["node"], name);
          assert.deepStrictEqual([...rule.right.fields], ["id"], name);
        }
      }

      const capacities = expressionAttributes.rules.filter(
        (rule) =>
          rule.kind === "capacity" &&
          rule.from.source === reference &&
          selectionOn(rule.target, parent, kindField),
      );
      assert.strictEqual(capacities.length, 1, name);
      for (const rule of capacities) {
        const within = inspect(Predicate.hasProperty(rule, "desc") ? rule.desc : undefined, {
          depth: null,
        });
        assert.match(within, /low: 1n/u, name);
        assert.match(within, /high: 1n/u, name);
      }

      const zero = expressionAttributes.rules.filter(
        (rule) => rule.kind === "check" && rule.name === `${name}Zero`,
      );
      assert.strictEqual(zero.length, 1, name);
      for (const rule of zero) {
        if (rule.kind === "check") {
          assert.strictEqual(rule.relation, parent, name);

          const text = inspect(Predicate.hasProperty(rule, "desc") ? rule.desc : undefined, {
            depth: null,
            maxStringLength: 100_000,
          });
          for (const needle of [kindField, valueField, "literal", "0n"]) {
            assert.include(text, needle, name);
          }
        }
      }

      statements += contained.length + capacities.length + zero.length;
    }

    assert.strictEqual(statements, 12);
  });
});

describe("contracts (expression-attributes)", () => {
  it("types VariableWeightIdentifier.value WeightReference", () => {
    assert.strictEqual(
      expressionAttributes.VariableWeightIdentifier.fields.value.name,
      contracts.WeightReference.name,
    );
  });
  it("types ExpressionWeightIdentifier.value WeightReference", () => {
    assert.strictEqual(
      expressionAttributes.ExpressionWeightIdentifier.fields.value.name,
      contracts.WeightReference.name,
    );
  });
  it("types AnyN.max ExpressionIntegerOrVariable", () => {
    assert.strictEqual(
      expressionAttributes.AnyN.fields.max.name,
      contracts.ExpressionIntegerOrVariable.name,
    );
  });
  it("types AnyN.min ExpressionIntegerOrVariable", () => {
    assert.strictEqual(
      expressionAttributes.AnyN.fields.min.name,
      contracts.ExpressionIntegerOrVariable.name,
    );
  });
  it("types RandomInteger.max ExpressionIntegerOrVariable", () => {
    assert.strictEqual(
      expressionAttributes.RandomInteger.fields.max.name,
      contracts.ExpressionIntegerOrVariable.name,
    );
  });
  it("types RandomIntegerMin.value ExpressionIntegerOrVariable", () => {
    assert.strictEqual(
      expressionAttributes.RandomIntegerMin.fields.value.name,
      contracts.ExpressionIntegerOrVariable.name,
    );
  });
  it("types RandomIntegerStep.value ExpressionIntegerOrVariable", () => {
    assert.strictEqual(
      expressionAttributes.RandomIntegerStep.fields.value.name,
      contracts.ExpressionIntegerOrVariable.name,
    );
  });
  it("types FieldValue.fieldIdentifier RecordFieldIdentifier", () => {
    assert.strictEqual(
      expressionAttributes.FieldValue.fields.fieldIdentifier.name,
      contracts.RecordFieldIdentifier.name,
    );
  });
  it("types Inside.coords ExpressionCoords", () => {
    assert.strictEqual(
      expressionAttributes.Inside.fields.coords.name,
      contracts.ExpressionCoords.name,
    );
  });
  it("types CustomOperatorClass.value CustomOperatorClassName", () => {
    assert.strictEqual(
      expressionAttributes.CustomOperatorClass.fields.value.name,
      contracts.CustomOperatorClassName.name,
    );
  });
  it("types CustomOperatorDefinition.value CustomOperatorDefinitionUri", () => {
    assert.strictEqual(
      expressionAttributes.CustomOperatorDefinition.fields.value.name,
      contracts.CustomOperatorDefinitionUri.name,
    );
  });
  it("types TestVariables.variableIdentifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.TestVariables.fields.variableIdentifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types EqualRoundedFiguresRef.identifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.EqualRoundedFiguresRef.fields.identifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types RoundToFiguresRef.identifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.RoundToFiguresRef.fields.identifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types IndexNRef.identifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.IndexNRef.fields.identifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types RepeatNumberRepeatsRef.identifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.RepeatNumberRepeatsRef.fields.identifier.name,
      contracts.VariableReference.name,
    );
  });
  it("types OutcomeMinMax.outcomeIdentifier VariableReference", () => {
    assert.strictEqual(
      expressionAttributes.OutcomeMinMax.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
  });
});
