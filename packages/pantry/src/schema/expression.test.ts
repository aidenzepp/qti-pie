import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { StructureHolder } from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as expression from "#pantry/schema/expression.ts";
import * as item from "#pantry/schema/item.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as value from "#pantry/schema/value.ts";

/**
 * The 42 attribute-less expression kinds, each with the relation that is its arm: the 33
 * operators table A lists with no attribute, the four reference leaves and the five counters.
 */
const thin = {
  "qti-and": "And",
  "qti-container-size": "ContainerSize",
  "qti-contains": "Contains",
  "qti-correct": "Correct",
  "qti-default": "Default",
  "qti-delete": "Delete",
  "qti-divide": "Divide",
  "qti-duration-gte": "DurationGte",
  "qti-duration-lt": "DurationLt",
  "qti-gcd": "Gcd",
  "qti-gt": "Gt",
  "qti-gte": "Gte",
  "qti-integer-divide": "IntegerDivide",
  "qti-integer-modulus": "IntegerModulus",
  "qti-integer-to-float": "IntegerToFloat",
  "qti-is-null": "IsNull",
  "qti-lcm": "Lcm",
  "qti-lt": "Lt",
  "qti-lte": "Lte",
  "qti-map-response": "MapResponse",
  "qti-map-response-point": "MapResponsePoint",
  "qti-match": "Match",
  "qti-max": "Max",
  "qti-member": "Member",
  "qti-min": "Min",
  "qti-multiple": "Multiple",
  "qti-not": "Not",
  "qti-null": "Null",
  "qti-number-correct": "NumberCorrect",
  "qti-number-incorrect": "NumberIncorrect",
  "qti-number-presented": "NumberPresented",
  "qti-number-responded": "NumberResponded",
  "qti-number-selected": "NumberSelected",
  "qti-or": "Or",
  "qti-ordered": "Ordered",
  "qti-power": "Power",
  "qti-product": "Product",
  "qti-random": "Random",
  "qti-round": "Round",
  "qti-subtract": "Subtract",
  "qti-sum": "Sum",
  "qti-truncate": "Truncate",
} as const;

/**
 * The three filter relations the outcome-only kinds share.
 */
const filters = [
  "ExpressionExcludeCategory",
  "ExpressionIncludeCategory",
  "ExpressionSectionIdentifier",
] as const;

/**
 * The reference leaves, whose row also exists in `VariableRef`.
 */
const references = ["Correct", "Default", "MapResponse", "MapResponsePoint"] as const;

const relationsByName = new Map(Object.entries(expression.relations));

const armsByKind = new Map(Object.entries(expression.arms));

/**
 * The containments whose left side names the relation whole, as the right relation's name then
 * both field lists.
 */
const containedFrom = (owner: { readonly name: string } | undefined) =>
  expression.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === owner && "name" in rule.right.source
      ? [[rule.right.source.name, [...rule.left.fields], [...rule.right.fields]]]
      : [],
  );

const probe = () =>
  schema(
    "QtiExpressionProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...item.relations,
      ...rosters.relations,
      ...processing.relations,
      ...expression.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...item.rules,
      ...processing.rules,
      ...expression.rules,
    ],
  );

describe("expression", () => {
  it("keys the arms by the 42 thin kinds and qti-base-value", () => {
    assert.deepStrictEqual(
      Object.keys(expression.arms).toSorted(),
      [...Object.keys(thin), "qti-base-value"].toSorted(),
    );
  });

  it("points qti-base-value at the Literal relation of processing", () => {
    assert.strictEqual(armsByKind.get("qti-base-value"), processing.relations.Literal);
  });

  it("gives each thin kind its own relation, keyed and fielded by id alone", () => {
    for (const [kind, name] of Object.entries(thin)) {
      const relation = relationsByName.get(name);
      assert.isDefined(relation, name);
      assert.isTrue(armsByKind.get(kind) === relation, kind);
      assert.deepStrictEqual(Object.keys(relation?.fields ?? {}), ["id"], name);
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["id"], name);
    }
  });

  it("adds exactly the 42 arms, the three filter relations and the section identifier target", () => {
    assert.deepStrictEqual(
      Object.keys(expression.relations).toSorted(),
      [...Object.values(thin), ...filters, "SectionIdentifierTarget"].toSorted(),
    );
  });

  it("keys each filter relation by node, with a value column", () => {
    for (const name of filters) {
      const relation = relationsByName.get(name);
      assert.deepStrictEqual(
        Object.keys(relation?.fields ?? {}).toSorted(),
        ["node", "value"],
        name,
      );
      assert.deepStrictEqual([...(relation?.primaryKey ?? [])], ["node"], name);
    }
  });

  it("contains each filter relation's node in Expression by id", () => {
    for (const name of filters) {
      assert.deepStrictEqual(
        containedFrom(relationsByName.get(name)),
        [["Expression", ["node"], ["id"]]],
        name,
      );
    }
  });

  it("contains each thin arm in Expression by id, and the reference leaves also in VariableRef", () => {
    for (const name of Object.values(thin)) {
      const into = [["Expression", ["id"], ["id"]]];
      const reference = references.some((leaf) => leaf === name)
        ? [["VariableRef", ["id"], ["id"]]]
        : [];
      assert.deepStrictEqual(
        containedFrom(relationsByName.get(name)),
        [...into, ...reference],
        name,
      );
    }
  });

  it("holds only containments, 42 into Expression, 3 more and 4 into VariableRef", () => {
    assert.isTrue(expression.rules.every((rule) => rule.kind === "contained"));
    assert.strictEqual(expression.rules.length, 42 + 3 + 4);
  });

  it("builds a schema over the leaves without refusal", () => {
    const built = probe();
    for (const name of [...Object.values(thin), ...filters]) {
      assert.include(Object.keys(built.relations), name);
    }
  });
});

describe("contracts (expression)", () => {
  it("types ExpressionExcludeCategory.value CategoryList", () => {
    assert.strictEqual(
      expression.ExpressionExcludeCategory.fields.value.name,
      contracts.CategoryList.name,
    );
  });
  it("types ExpressionIncludeCategory.value CategoryList", () => {
    assert.strictEqual(
      expression.ExpressionIncludeCategory.fields.value.name,
      contracts.CategoryList.name,
    );
  });
  it("types ExpressionSectionIdentifier.value SectionReference", () => {
    assert.strictEqual(
      expression.ExpressionSectionIdentifier.fields.value.name,
      contracts.SectionReference.name,
    );
  });
});

/**
 * A relation name widened to a string, so a comparison against a name outside the union is allowed.
 */
const sourceName = (name: string): string => name;

describe("expression: the section identifier target", () => {
  it("declares SectionIdentifierTarget keyed by (node, test)", () => {
    const target = expression.SectionIdentifierTarget;
    assert.strictEqual(target.name, "SectionIdentifierTarget");
    assert.deepStrictEqual(Object.keys(target.fields).toSorted(), [
      "document",
      "holderKind",
      "identifier",
      "node",
      "test",
    ]);
    assert.deepStrictEqual([...target.primaryKey], ["node", "test"]);
    assert.strictEqual(target.fields.identifier.name, contracts.TestStructureIdentifier.name);
    assert.strictEqual(target.fields.holderKind.roster, StructureHolder);
    assert.strictEqual(expression.relations.SectionIdentifierTarget, target);
  });

  it("declares no statement over it and leaves ExpressionSectionIdentifier.value SectionReference", () => {
    assert.deepStrictEqual(
      expression.rules.filter(
        (rule) =>
          "left" in rule &&
          "name" in rule.left.source &&
          sourceName(rule.left.source.name) === expression.relations.SectionIdentifierTarget.name,
      ),
      [],
    );
    assert.strictEqual(
      expression.ExpressionSectionIdentifier.fields.value.name,
      contracts.SectionReference.name,
    );
  });
});
