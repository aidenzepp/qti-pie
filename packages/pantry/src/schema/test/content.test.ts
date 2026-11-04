import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as document from "#pantry/schema/document.ts";
import * as node from "#pantry/schema/node.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as structure from "#pantry/schema/test/structure.ts";
import { ownAttributes } from "#pantry/schema/attribute-homes.ts";
import * as feedbackModule from "#pantry/schema/feedback.ts";
import { FeedbackOutcomeRef } from "#pantry/schema/feedback.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import { RubricBlock } from "#pantry/schema/rubric.ts";
import * as template from "#pantry/schema/template.ts";
import { PrintedVariableRef, PrintedVariableVarRef } from "#pantry/schema/template.ts";
import * as content from "#pantry/schema/test/content.ts";

const { relations } = content;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3 and
 * 4.10.
 */
const declarations = [
  ["TestRubricBlock", ["id", "view"], ["id"]],
  ["TestRubricBlockUse", ["node", "value"], ["node"]],
  ["TestRubricContentBody", ["id"], ["id"]],
  ["TestFeedback", ["access", "id", "identifier", "outcomeIdentifier", "showHide"], ["id"]],
  ["TestFeedbackTitle", ["node", "value"], ["node"]],
  ["TestFeedbackContentBody", ["id"], ["id"]],
  [
    "SectionFeedbackOutcomeRef",
    ["baseType", "cardinality", "document", "identifier", "node", "test"],
    ["node", "test"],
  ],
  [
    "SectionPrintedVariableRef",
    ["document", "identifier", "kind", "node", "test"],
    ["node", "test"],
  ],
  [
    "SectionPrintedVariableVarRef",
    ["attribute", "baseType", "cardinality", "document", "identifier", "kind", "node", "test"],
    ["node", "attribute", "test"],
  ],
] as const;

/**
 * The relations the module adds to `roles.ts` beside the three arms the earlier slices named.
 */
const added = [
  "SectionFeedbackOutcomeRef",
  "SectionPrintedVariableRef",
  "SectionPrintedVariableVarRef",
  "TestFeedbackTitle",
  "TestRubricBlockUse",
] as const;

/**
 * The names of the own attributes the homes table gives each kind.
 */
const homes = new Map(
  Object.entries(ownAttributes).map(([kind, own]) => [kind, own.map(([name]) => name)]),
);

const homed = (handle: string): readonly string[] => homes.get(handle) ?? [];

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test content relations", () => {
  it("declares 9 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 9);
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

  it("keeps the four arms keyed by their kinds, the two content bodies thin", () => {
    assert.deepStrictEqual(Object.keys(content.arms).toSorted(), [
      "qti-content-body.testFeedback",
      "qti-content-body.testRubric",
      "qti-rubric-block.test",
      "qti-test-feedback",
    ]);
    assert.deepStrictEqual(fieldsOf(content.TestRubricContentBody), ["id"]);
    assert.deepStrictEqual(fieldsOf(content.TestFeedbackContentBody), ["id"]);
  });

  it("types the rubric's view and use as the item rubric's", () => {
    assert.deepStrictEqual(relations.TestRubricBlock.fields.view, RubricBlock.fields.view);
    assert.deepStrictEqual(relations.TestRubricBlockUse.fields.value, RubricBlock.fields.use);
  });

  it("types the feedback's identifiers by contract and its kinds by roster", () => {
    assert.strictEqual(
      relations.TestFeedback.fields.identifier.name,
      contracts.ShowHideIdentifier.name,
    );
    assert.strictEqual(
      relations.TestFeedback.fields.outcomeIdentifier.name,
      contracts.VariableReference.name,
    );
    assert.strictEqual(relations.TestFeedback.fields.access.roster, rosters.TestFeedbackAccess);
    assert.strictEqual(relations.TestFeedback.fields.showHide.roster, rosters.ShowHide);
  });

  it("types each twin's fields as the field of the relation it copies", () => {
    const feedback = [
      [relations.SectionFeedbackOutcomeRef.fields.baseType, FeedbackOutcomeRef.fields.baseType],
      [
        relations.SectionFeedbackOutcomeRef.fields.cardinality,
        FeedbackOutcomeRef.fields.cardinality,
      ],
      [relations.SectionFeedbackOutcomeRef.fields.document, FeedbackOutcomeRef.fields.document],
      [relations.SectionFeedbackOutcomeRef.fields.identifier, FeedbackOutcomeRef.fields.identifier],
      [relations.SectionPrintedVariableRef.fields.document, PrintedVariableRef.fields.document],
      [relations.SectionPrintedVariableRef.fields.identifier, PrintedVariableRef.fields.identifier],
      [relations.SectionPrintedVariableRef.fields.kind, PrintedVariableRef.fields.kind],
      [
        relations.SectionPrintedVariableVarRef.fields.attribute,
        PrintedVariableVarRef.fields.attribute,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.baseType,
        PrintedVariableVarRef.fields.baseType,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.cardinality,
        PrintedVariableVarRef.fields.cardinality,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.document,
        PrintedVariableVarRef.fields.document,
      ],
      [
        relations.SectionPrintedVariableVarRef.fields.identifier,
        PrintedVariableVarRef.fields.identifier,
      ],
      [relations.SectionPrintedVariableVarRef.fields.kind, PrintedVariableVarRef.fields.kind],
    ] as const;
    for (const [twin, original] of feedback) {
      assert.deepStrictEqual(twin, original);
    }
  });

  it("gives Author a line for each relation", () => {
    for (const name of added) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    for (const name of [
      "TestFeedback",
      "TestFeedbackContentBody",
      "TestRubricBlock",
      "TestRubricContentBody",
    ] as const) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
  });

  it("fills the registry attributes of the four kinds from the inventory, in its order", () => {
    for (const handle of [
      "qti-content-body.testFeedback",
      "qti-content-body.testRubric",
      "qti-rubric-block.test",
      "qti-test-feedback",
    ] as const) {
      assert.deepStrictEqual(
        [...test.registry[handle].attributes],
        testInventory[handle]?.attributes.map((attribute) => attribute.name),
        handle,
      );
    }
    assert.deepStrictEqual(
      [...test.registry["qti-test-feedback"].attributes],
      ["access", "outcome-identifier", "show-hide", "identifier", "title"],
    );
  });

  it("homes the own attributes of the rubric and the feedback, the bodies keeping none", () => {
    assert.deepStrictEqual(homed("qti-rubric-block.test").toSorted(), ["use", "view"]);
    assert.deepStrictEqual(homed("qti-test-feedback").toSorted(), [
      "access",
      "identifier",
      "outcome-identifier",
      "show-hide",
      "title",
    ]);
    assert.deepStrictEqual(homed("qti-content-body.testRubric"), []);
    assert.deepStrictEqual(homed("qti-content-body.testFeedback"), []);
  });

  it("declares the one new name, access, beside the twenty landed", () => {
    assert.include(test.attributes, "access");
    assert.strictEqual(test.attributes.length, 21);
    assert.deepStrictEqual([...test.attributes], [...test.attributes].toSorted());
  });

  it("holds exactly the laws of the spec's 4.10, rows 3 and 20 to 24, and no other", () => {
    assert.strictEqual(content.rules.length, 20);
    assert.deepStrictEqual(
      content.rules.map((rule) => rule.kind).toSorted(),
      [
        ...Array.from({ length: 2 }, () => "capacity"),
        ...Array.from({ length: 3 }, () => "check"),
        ...Array.from({ length: 15 }, () => "contained"),
      ].toSorted(),
    );
  });
});

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * One containment of the module, as its owner, fields, target relation, selection and target
 * fields.
 */
const containments = (owner: (typeof relations)[keyof typeof relations]) =>
  content.rules
    .filter((rule) => rule.kind === "contained")
    .filter((rule) => rule.left.source === owner)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.right)?.bindings,
      target: selectionOf(rule.right)?.relation ?? rule.right.source,
    }));

const capacityRules = content.rules.filter((rule) => rule.kind === "capacity");

type Capacity = (typeof capacityRules)[number];

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

describe("the test content laws", () => {
  it("owns a test rubric's use and a test feedback's title", () => {
    assert.deepStrictEqual(containments(relations.TestRubricBlockUse), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: relations.TestRubricBlock,
      },
    ]);
    assert.deepStrictEqual(containments(relations.TestFeedbackTitle), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: relations.TestFeedback,
      },
    ]);
  });

  it("gives a test rubric exactly one body and a test feedback at most one", () => {
    const capacities = capacityRules;
    assert.strictEqual(capacities.length, 2);

    const byOwner = new Map(
      capacities.map((rule) => [selectionOf(rule.target)?.relation ?? rule.target.source, rule]),
    );
    const rubric = byOwner.get(relations.TestRubricBlock);
    const feedback = byOwner.get(relations.TestFeedback);
    for (const [rule, childKind, parentKind] of [
      [rubric, "qti-content-body.testRubric", "qti-rubric-block.test"],
      [feedback, "qti-content-body.testFeedback", "qti-test-feedback"],
    ] as const) {
      assert.isDefined(rule);
      assert.deepStrictEqual([...(rule?.target.fields ?? [])], ["id"]);
      assert.strictEqual(selectionOf(rule?.from ?? { source: {} })?.relation, node.relations.Edge);
      assert.deepStrictEqual(selectionOf(rule?.from ?? { source: {} })?.bindings, {
        childKind,
        parentKind,
      });
      assert.deepStrictEqual([...(rule?.from.fields ?? [])], ["parent"]);
    }
    assert.deepStrictEqual(boundsOf(rubric), [1n, 1n]);
    assert.deepStrictEqual(boundsOf(feedback), [0n, 1n]);
  });

  it("binds a section feedback's outcome into the test's outcome declarations, typed", () => {
    assert.deepStrictEqual(containments(relations.SectionFeedbackOutcomeRef), [
      {
        left: ["test", "identifier"],
        right: ["document", "identifier"],
        selection: { kind: "outcome" },
        target: declaration.relations.Declaration,
      },
      {
        left: ["test", "identifier", "baseType", "cardinality"],
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
      {
        left: ["test", "document"],
        right: ["test", "document"],
        selection: undefined,
        target: structure.relations.TestDocument,
      },
    ]);
  });

  it("binds a section printed variable into the test's declarations, on a printed variable", () => {
    assert.deepStrictEqual(containments(relations.SectionPrintedVariableRef), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: template.relations.PrintedVariable,
      },
      {
        left: ["test", "identifier", "kind"],
        right: ["document", "identifier", "kind"],
        selection: undefined,
        target: declaration.relations.Declaration,
      },
      {
        left: ["node", "document"],
        right: ["id", "tree"],
        selection: undefined,
        target: node.relations.Node,
      },
      {
        left: ["test", "document"],
        right: ["test", "document"],
        selection: undefined,
        target: structure.relations.TestDocument,
      },
    ]);
  });

  it("binds a section printed variable's base and index into the test's typed declarations", () => {
    assert.deepStrictEqual(containments(relations.SectionPrintedVariableVarRef), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: template.relations.PrintedVariable,
      },
      {
        left: ["test", "identifier", "baseType", "cardinality"],
        right: ["document", "identifier", "baseType", "cardinality"],
        selection: undefined,
        target: declaration.relations.TypedDeclaration,
      },
      {
        left: ["test", "identifier", "kind"],
        right: ["document", "identifier", "kind"],
        selection: undefined,
        target: declaration.relations.Declaration,
      },
      {
        left: ["node", "document"],
        right: ["id", "tree"],
        selection: undefined,
        target: node.relations.Node,
      },
      {
        left: ["test", "document"],
        right: ["test", "document"],
        selection: undefined,
        target: structure.relations.TestDocument,
      },
    ]);
  });

  it("carries one check per twin, named for its C twin's", () => {
    assert.deepStrictEqual(
      content.rules
        .filter((rule) => rule.kind === "check")
        .map((rule) => [rule.name, rule.relation]),
      [
        ["SectionFeedbackOutcomeRefType", relations.SectionFeedbackOutcomeRef],
        ["SectionPrintedVariableRefKind", relations.SectionPrintedVariableRef],
        ["SectionPrintedVariableVarRefType", relations.SectionPrintedVariableVarRef],
      ],
    );
  });

  it("builds in a schema with the spine, the declarations, C's bindings and the structure", () => {
    const built = schema(
      "QtiTestContentProbe",
      {
        ...node.relations,
        ...pkg.relations,
        ...document.relations,
        ...declaration.relations,
        ...feedbackModule.relations,
        ...template.relations,
        ...structure.relations,
        ...relations,
      },
      [
        ...node.rules,
        ...pkg.rules,
        ...document.rules,
        ...declaration.rules,
        ...feedbackModule.rules,
        ...template.rules,
        ...structure.rules,
        ...content.rules,
      ],
    );
    assert.include(Object.keys(built.relations), "SectionPrintedVariableVarRef");
  });
});
