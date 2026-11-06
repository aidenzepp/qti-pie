import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as rules from "#pantry/schema/test/rules.ts";

const { relations } = rules;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3,
 * 4.8 and 4.9.
 */
const declarations = [
  ["PreCondition", ["id"], ["id"]],
  ["BranchRule", ["document", "id", "owner", "ownerKind", "targetKind"], ["id"]],
  ["BranchRuleExit", ["exit", "rule"], ["rule"]],
  ["BranchRuleTarget", ["holderKind", "identifier", "ownerKind", "rule", "scope"], ["rule"]],
  ["VariableMapping", ["id", "itemDocument", "itemRef", "source", "target"], ["id"]],
  ["Weight", ["id", "identifier", "itemRef", "value"], ["id"]],
  ["TemplateDefault", ["id", "itemDocument", "itemRef", "templateIdentifier"], ["id"]],
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test rule relations", () => {
  it("declares 7 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 7);
    assert.deepStrictEqual(
      Object.keys(relations).toSorted(),
      declarations.map(([name]) => name).toSorted(),
    );
    for (const [name, columns, primaryKey] of declarations) {
      const relation = relations[name];
      assert.strictEqual(relation.name, name);
      assert.deepStrictEqual(fieldsOf(relation), columns, name);
      assert.deepStrictEqual([...relation.primaryKey], primaryKey, name);
    }
  });

  it("keeps the five arms keyed by their kinds", () => {
    assert.deepStrictEqual(Object.keys(rules.arms).toSorted(), [
      "qti-branch-rule",
      "qti-pre-condition",
      "qti-template-default",
      "qti-variable-mapping",
      "qti-weight",
    ]);
    assert.deepStrictEqual(fieldsOf(rules.PreCondition), ["id"]);
  });

  it("types the identifiers, the mapped name and the weight by contract", () => {
    const typed = [
      [relations.BranchRuleTarget.fields.identifier, contracts.TestStructureIdentifier],
      [relations.VariableMapping.fields.target, contracts.MappedVariableName],
      [relations.Weight.fields.identifier, contracts.WeightReference],
      [relations.Weight.fields.value, contracts.WeightValue],
    ] as const;
    for (const [field, contract] of typed) {
      assert.strictEqual(field.name, contract.name);
    }
  });

  it("holds the bare identifiers to the plain name, with no contract of their own", () => {
    const bare: readonly object[] = [
      relations.VariableMapping.fields.source,
      relations.TemplateDefault.fields.templateIdentifier,
    ];
    for (const field of bare) {
      assert.isFalse("name" in field);
    }
  });

  it("holds the kind columns to their rosters", () => {
    const wanted: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.BranchRule.fields.ownerKind, rosters.StructureHolder],
      [relations.BranchRule.fields.targetKind, rosters.BranchTarget],
      [relations.BranchRuleExit.fields.exit, rosters.BranchExit],
      [relations.BranchRuleTarget.fields.holderKind, rosters.StructureHolder],
      [relations.BranchRuleTarget.fields.ownerKind, rosters.StructureHolder],
    ];
    for (const [field, roster] of wanted) {
      assert.strictEqual(field.roster, roster);
    }
  });

  it("keeps the one key a later containment targets, a mapping's target within its item ref", () => {
    assert.deepStrictEqual(
      rules.rules
        .filter((rule) => rule.kind === "key")
        .map((rule) => [rule.relation.name, [...rule.fields]]),
      [["VariableMapping", ["itemRef", "target"]]],
    );
  });

  it("gives Author a line for the two new relations beside the five arms", () => {
    for (const name of ["BranchRuleExit", "BranchRuleTarget"] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    for (const name of [
      "BranchRule",
      "PreCondition",
      "TemplateDefault",
      "VariableMapping",
      "Weight",
    ] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
  });

  it("fills the registry attributes of the five kinds from the inventory, in its order", () => {
    const registry = new Map(
      Object.entries(test.registry).map(([handle, row]) => [handle, row.attributes]),
    );
    const wanted = {
      "qti-branch-rule": ["target"],
      "qti-pre-condition": [],
      "qti-template-default": ["template-identifier"],
      "qti-variable-mapping": ["source-identifier", "target-identifier"],
      "qti-weight": ["identifier", "value"],
    } as const;
    for (const [handle, attributes] of Object.entries(wanted)) {
      assert.deepStrictEqual([...(registry.get(handle) ?? [])], [...attributes], handle);
    }
  });

  it("declares the three new names the kinds carry beside the seventeen landed", () => {
    for (const name of ["source-identifier", "target", "target-identifier"]) {
      assert.include(test.attributes, name);
    }
    assert.strictEqual(test.attributes.length, 21);
    assert.deepStrictEqual([...test.attributes], [...test.attributes].toSorted());
  });
});

interface Side {
  readonly fields: readonly string[];
  readonly relation: string | undefined;
  readonly selection: Readonly<Record<string, string>> | undefined;
}

interface Contains {
  readonly from: Side;
  readonly to: Side;
}

/**
 * Whether a selection's bindings are the plain record of field to handle that `select` takes.
 */
const isBindings = (value: unknown): value is Readonly<Record<string, string>> =>
  Predicate.isObject(value);

/**
 * A statement side as the name of its relation, the selection bindings it carries and its fields.
 */
const sideOf = (statementSide: {
  readonly source: object;
  readonly fields: readonly string[];
}): Side => {
  const { source } = statementSide;
  const selected =
    Predicate.hasProperty(source, "relation") && Predicate.hasProperty(source, "bindings")
      ? source
      : undefined;
  const relation = selected?.relation ?? source;
  const bindings = selected?.bindings;

  return {
    fields: [...statementSide.fields],
    relation: Predicate.hasProperty(relation, "name") ? String(relation.name) : undefined,
    selection: isBindings(bindings) ? bindings : undefined,
  };
};

const side = (
  relation: string,
  fields: readonly string[],
  selection?: Readonly<Record<string, string>>,
): Side => ({ fields: [...fields], relation, selection });

const contains = (from: Side, to: Side): Contains => ({ from, to });

/**
 * Orders expectations by their serialized form.
 */
const order = (a: Contains, b: Contains): number =>
  JSON.stringify(a).localeCompare(JSON.stringify(b));

/**
 * The three holder kinds that hold a branch rule, each with its arm.
 */
const owners = [
  ["part", "TestPart"],
  ["section", "AssessmentSection"],
  ["itemRef", "ItemRef"],
] as const;

/**
 * Each rule relation of an item reference: its row's `(id, itemRef)` is an edge of the document,
 * its `(itemRef, itemDocument)` is the resolved item's document and its name is a declaration of
 * that document of the kind the rule needs (rows 25 and 26).
 */
const itemRefRules = [
  ["VariableMapping", "source", "outcome"],
  ["TemplateDefault", "templateIdentifier", "template"],
] as const;

const expectedContainments = [
  contains(side("BranchRule", ["id", "owner"]), side("Edge", ["child", "parent"])),
  ...owners.map(([ownerKind, arm]) =>
    contains(side("BranchRule", ["owner"], { ownerKind }), side(arm, ["id"])),
  ),
  contains(
    side("BranchRuleTarget", ["scope", "identifier", "holderKind"]),
    side("TestIdentifier", ["scope", "identifier", "holderKind"]),
  ),
  contains(side("BranchRuleTarget", ["rule", "scope"]), side("BranchRule", ["id", "document"])),
  contains(
    side("BranchRuleTarget", ["rule", "ownerKind"]),
    side("BranchRule", ["id", "ownerKind"]),
  ),
  ...(["PreCondition", "BranchRule", "TemplateDefault"] as const).map((arm) =>
    contains(side(arm, ["id"]), side("RuleOperand", ["rule"])),
  ),
  ...itemRefRules.flatMap(([relation, name, kind]) => [
    contains(side(relation, ["id", "itemRef"]), side("Edge", ["child", "parent"])),
    contains(
      side(relation, ["itemRef", "itemDocument"]),
      side("ItemRefDocument", ["itemRef", "document"]),
    ),
    contains(
      side(relation, ["itemDocument", name]),
      side("Declaration", ["document", "identifier"], { kind }),
    ),
  ]),
  contains(side("Weight", ["id", "itemRef"]), side("Edge", ["child", "parent"])),
];

describe("the test rule laws", () => {
  it("holds the containments of 4.8 and 4.9, each side by relation, selection and fields", () => {
    assert.deepStrictEqual(
      rules.rules
        .filter((rule) => rule.kind === "contained")
        .map((rule) => contains(sideOf(rule.left), sideOf(rule.right)))
        .toSorted(order),
      expectedContainments.toSorted(order),
    );
    assert.strictEqual(expectedContainments.length, 17);
  });

  it("selects exactly one side of each containment that selects, and neither side of an edge one", () => {
    for (const statement of rules.rules.filter((rule) => rule.kind === "contained")) {
      const left = sideOf(statement.left);
      const right = sideOf(statement.right);
      assert.isAtMost([left, right].filter((one) => one.selection !== undefined).length, 1);
      if (right.relation === "Edge") {
        assert.isUndefined(left.selection);
        assert.isUndefined(right.selection);
      }
    }
  });

  it("splits a branch rule by its target kind, with both handles armed", () => {
    const [rule, ...rest] = rules.rules.filter((candidate) => candidate.kind === "alternatives");
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.parent, relations.BranchRule);
    assert.strictEqual(rule?.discriminator, "targetKind");
    assert.strictEqual(rule?.roster, rosters.BranchTarget);
    assert.deepStrictEqual(
      Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["exit", relations.BranchRuleExit],
        ["ref", relations.BranchRuleTarget],
      ],
    );
    assert.deepStrictEqual(
      Object.keys(rule?.arms ?? {}).toSorted(),
      [...rosters.BranchTarget.handles].toSorted(),
    );
  });

  it("checks that a part's rule targets a part and any other rule does not", () => {
    const checks = rules.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation.name]),
      [["BranchTargetKind", "BranchRuleTarget"]],
    );
  });

  it("declares 1 key, 17 containments, 1 alternatives and 1 check: 20 statements", () => {
    assert.strictEqual(rules.rules.length, 1 + 17 + 1 + 1);
  });
});
