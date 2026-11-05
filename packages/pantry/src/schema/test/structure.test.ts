import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as node from "#pantry/schema/node.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as structure from "#pantry/schema/test/structure.ts";

const { relations } = structure;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3.
 */
const declarations = [
  ["AssessmentTest", ["id"], ["id"]],
  ["TestPart", ["document", "id", "identifier", "navigationMode", "submissionMode"], ["id"]],
  ["TestPartTitle", ["node", "value"], ["node"]],
  [
    "AssessmentSection",
    ["document", "fixed", "id", "identifier", "keepTogether", "required", "title", "visible"],
    ["id"],
  ],
  ["DeclaredSectionRequired", ["node"], ["node"]],
  ["DeclaredSectionFixed", ["node"], ["node"]],
  ["DeclaredSectionKeepTogether", ["node"], ["node"]],
  ["SectionRef", ["document", "href", "id", "identifier"], ["id"]],
  ["ItemRef", ["document", "fixed", "href", "id", "identifier", "required"], ["id"]],
  ["DeclaredItemRefRequired", ["node"], ["node"]],
  ["DeclaredItemRefFixed", ["node"], ["node"]],
  ["ItemRefCategory", ["node", "value"], ["node"]],
  ["TestIdentifier", ["holder", "holderKind", "identifier", "scope"], ["holder"]],
  ["TestReach", ["holder", "holderKind", "identifier", "test"], ["test", "holder"]],
  ["TestDocument", ["document", "test"], ["test", "document"]],
  ["StructureChild", ["child", "childKind", "parent"], ["child"]],
  ["RequiredChild", ["child", "parent", "required"], ["child"]],
] as const;

/**
 * The names the module's relations take in `roles.ts`, beside the five arms' own.
 */
const added = [
  "DeclaredItemRefFixed",
  "DeclaredItemRefRequired",
  "DeclaredSectionFixed",
  "DeclaredSectionKeepTogether",
  "DeclaredSectionRequired",
  "ItemRefCategory",
  "RequiredChild",
  "StructureChild",
  "TestDocument",
  "TestIdentifier",
  "TestPartTitle",
  "TestReach",
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test structure relations", () => {
  it("declares 17 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 17);
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

  it("keeps the five arms keyed by their kinds and the test root thin", () => {
    assert.deepStrictEqual(Object.keys(structure.arms).toSorted(), [
      "qti-assessment-item-ref",
      "qti-assessment-section",
      "qti-assessment-section-ref",
      "qti-assessment-test",
      "qti-test-part",
    ]);
    assert.deepStrictEqual(fieldsOf(structure.AssessmentTest), ["id"]);
  });

  it("types the identifiers, hrefs and category by contract", () => {
    const typed = [
      [relations.TestPart.fields.identifier, contracts.TestStructureIdentifier],
      [relations.AssessmentSection.fields.identifier, contracts.TestStructureIdentifier],
      [relations.SectionRef.fields.identifier, contracts.TestStructureIdentifier],
      [relations.ItemRef.fields.identifier, contracts.TestStructureIdentifier],
      [relations.TestIdentifier.fields.identifier, contracts.TestStructureIdentifier],
      [relations.TestReach.fields.identifier, contracts.TestStructureIdentifier],
      [relations.SectionRef.fields.href, contracts.SectionRefHref],
      [relations.ItemRef.fields.href, contracts.ItemRefHref],
      [relations.ItemRefCategory.fields.value, contracts.CategoryList],
    ] as const;
    for (const [field, contract] of typed) {
      assert.strictEqual(field.name, contract.name);
    }
  });

  it("holds the closed columns to their rosters", () => {
    const closed: readonly (readonly [{ readonly roster: unknown }, unknown])[] = [
      [relations.TestPart.fields.navigationMode, rosters.NavigationMode],
      [relations.TestPart.fields.submissionMode, rosters.SubmissionMode],
      [relations.AssessmentSection.fields.visible, rosters.XsBoolean],
      [relations.AssessmentSection.fields.required, rosters.XsBoolean],
      [relations.AssessmentSection.fields.fixed, rosters.XsBoolean],
      [relations.AssessmentSection.fields.keepTogether, rosters.XsBoolean],
      [relations.ItemRef.fields.required, rosters.XsBoolean],
      [relations.ItemRef.fields.fixed, rosters.XsBoolean],
      [relations.TestIdentifier.fields.holderKind, rosters.StructureHolder],
      [relations.TestReach.fields.holderKind, rosters.StructureHolder],
      [relations.StructureChild.fields.childKind, node.NodeKind],
      [relations.RequiredChild.fields.required, rosters.XsBoolean],
    ];
    for (const [field, roster] of closed) {
      assert.strictEqual(field.roster, roster);
    }
  });

  it("gives Author a line for each of the twelve relations beside the arms", () => {
    for (const name of added) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    assert.strictEqual(added.length, 12);
  });

  it("fills the registry attributes of the five kinds from the inventory, in its order", () => {
    const registry = new Map(
      Object.entries(test.registry).map(([handle, row]) => [handle, row.attributes]),
    );
    const wanted = {
      "qti-assessment-item-ref": ["identifier", "required", "fixed", "class", "href", "category"],
      "qti-assessment-section": [
        "identifier",
        "required",
        "fixed",
        "title",
        "class",
        "visible",
        "keep-together",
      ],
      "qti-assessment-section-ref": ["identifier", "class", "href"],
      "qti-assessment-test": [
        "identifier",
        "title",
        "class",
        "xml:lang",
        "tool-name",
        "tool-version",
      ],
      "qti-test-part": ["identifier", "title", "class", "navigation-mode", "submission-mode"],
    } as const;
    for (const [handle, attributes] of Object.entries(wanted)) {
      assert.deepStrictEqual([...(registry.get(handle) ?? [])], [...attributes], handle);
    }
  });

  it("declares the names the landed headings carry, the five of p5-16 among them, alphabetically", () => {
    assert.deepStrictEqual(
      [...test.attributes],
      [
        "access",
        "allow-comment",
        "allow-late-submission",
        "allow-review",
        "allow-skipping",
        "category",
        "keep-together",
        "max-attempts",
        "max-time",
        "min-time",
        "navigation-mode",
        "select",
        "show-feedback",
        "show-solution",
        "source-identifier",
        "submission-mode",
        "target",
        "target-identifier",
        "validate-responses",
        "visible",
        "with-replacement",
      ],
    );
  });
});

type Selection = Readonly<Record<string, string>>;

/**
 * Whether a selection's bindings are the plain record of field to handle that `select` takes.
 */
const isBindings = (value: unknown): value is Selection => Predicate.isObject(value);

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

  return {
    fields: [...statementSide.fields],
    relation: Predicate.hasProperty(relation, "name") ? String(relation.name) : undefined,
    selection:
      selected !== undefined && isBindings(selected.bindings) ? selected.bindings : undefined,
  };
};

interface Side {
  readonly fields: readonly string[];
  readonly relation: string | undefined;
  readonly selection: Selection | undefined;
}

interface Contains {
  readonly from: Side;
  readonly to: Side;
}

interface Counted {
  readonly bounds: readonly [string, string];
  readonly from: Side;
  readonly target: string | undefined;
}

/**
 * Orders expectations by their serialized form; bounds are strings, so nothing here is a bigint.
 */
const order = (a: Contains | Counted, b: Contains | Counted): number =>
  JSON.stringify(a).localeCompare(JSON.stringify(b));

/**
 * One expected side: relation, fields and the selection it is read through.
 */
const side = (relation: string, fields: readonly string[], selection?: Selection): Side => ({
  fields: [...fields],
  relation,
  selection,
});

const contains = (from: Side, to: Side): Contains => ({ from, to });

const holders = [
  ["part", "TestPart"],
  ["section", "AssessmentSection"],
  ["sectionRef", "SectionRef"],
  ["itemRef", "ItemRef"],
] as const;

/**
 * The (parent kind, child kind) pairs a structure child is complete by.
 */
const childPairs = [
  ["qti-assessment-section", "qti-assessment-item-ref"],
  ["qti-assessment-section", "qti-assessment-section"],
  ["qti-assessment-section", "qti-assessment-section-ref"],
  ["qti-assessment-section", "xi:include"],
  ["qti-test-part", "qti-assessment-section"],
  ["qti-test-part", "qti-assessment-section-ref"],
] as const;

/**
 * The arms with a `required` column and the two spellings of true each is complete by.
 */
const requiredArms = ["ItemRef", "AssessmentSection"] as const;

const trueSpellings = ["true", "1"] as const;

const expectedContainments = [
  ...holders.flatMap(([holderKind, arm]) => [
    contains(
      side(arm, ["id", "document", "identifier"]),
      side("TestIdentifier", ["holder", "scope", "identifier"], { holderKind }),
    ),
    contains(side("TestIdentifier", ["holder"], { holderKind }), side(arm, ["id"])),
    contains(side(arm, ["id", "document"]), side("Node", ["id", "tree"])),
  ]),
  contains(
    side("TestReach", ["holder", "identifier", "holderKind"]),
    side("TestIdentifier", ["holder", "identifier", "holderKind"]),
  ),
  contains(side("TestDocument", ["test"]), side("Document", ["id"], { root: "test" })),
  contains(side("TestDocument", ["document"]), side("Document", ["id"])),
  contains(side("TestPartTitle", ["node"]), side("TestPart", ["id"])),
  contains(side("ItemRefCategory", ["node"]), side("ItemRef", ["id"])),
  contains(side("StructureChild", ["child", "parent"]), side("Edge", ["child", "parent"])),
  ...childPairs.map(([parentKind, childKind]) =>
    contains(
      side("Edge", ["child", "parent"], { childKind, parentKind }),
      side("StructureChild", ["child", "parent"]),
    ),
  ),
  contains(side("RequiredChild", ["child", "parent"]), side("StructureChild", ["child", "parent"])),
  ...requiredArms.flatMap((arm) =>
    trueSpellings.map((required) =>
      contains(side(arm, ["id"], { required }), side("RequiredChild", ["child"])),
    ),
  ),
];

type Capacity = Extract<(typeof structure.rules)[number], { readonly kind: "capacity" }>;

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose; `"*"` is the unbounded top.
 */
const boundsOf = (statement: Capacity): readonly [string, string] => {
  const within =
    Predicate.hasProperty(statement, "desc") &&
    Predicate.hasProperty(statement.desc, "within") &&
    Predicate.hasProperty(statement.desc.within, "low") &&
    Predicate.hasProperty(statement.desc.within, "high")
      ? statement.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [String(within.low), String(within.high)];
};

/**
 * One expected capacity: the counted relation's id, the relation counted, its selection and bounds.
 */
const counts = (target: string, from: Side, low: bigint, high: bigint | "*"): Counted => ({
  bounds: [String(low), String(high)],
  from,
  target,
});

const atMostOne = [
  ["qti-assessment-test", "AssessmentTest", ["qti-time-limits", "qti-outcome-processing"]],
  ["qti-test-part", "TestPart", ["qti-item-session-control", "qti-time-limits"]],
  ["qti-assessment-item-ref", "ItemRef", ["qti-item-session-control", "qti-time-limits"]],
  [
    "qti-assessment-section",
    "AssessmentSection",
    [
      "qti-item-session-control",
      "qti-time-limits",
      "qti-selection",
      "qti-ordering",
      "qti-adaptive-selection",
    ],
  ],
] as const;

const expectedCapacities = [
  counts("TestPart", side("StructureChild", ["parent"]), 1n, "*"),
  counts("AssessmentSection", side("StructureChild", ["parent"]), 1n, "*"),
  counts(
    "AssessmentTest",
    side("Edge", ["parent"], { childKind: "qti-test-part", parentKind: "qti-assessment-test" }),
    1n,
    "*",
  ),
  ...atMostOne.flatMap(([parentKind, arm, children]) =>
    children.map((childKind) =>
      counts(arm, side("Edge", ["parent"], { childKind, parentKind }), 0n, 1n),
    ),
  ),
];

describe("the test structure laws", () => {
  it("holds the containments of 4.4 and 4.7, each side by relation, selection and fields", () => {
    assert.deepStrictEqual(
      structure.rules
        .filter((rule) => rule.kind === "contained")
        .map((rule) => contains(sideOf(rule.left), sideOf(rule.right)))
        .toSorted(order),
      expectedContainments.toSorted(order),
    );
  });

  it("selects exactly one side of each containment that selects", () => {
    for (const statement of structure.rules.filter((rule) => rule.kind === "contained")) {
      const selected = [sideOf(statement.left), sideOf(statement.right)].filter(
        (one) => one.selection !== undefined,
      );
      assert.isAtMost(selected.length, 1);
    }
  });

  it("keeps the two candidate keys beside the laws", () => {
    assert.deepStrictEqual(
      structure.rules
        .filter((rule) => rule.kind === "key")
        .map((rule) => [rule.relation.name, [...rule.fields]]),
      [
        ["TestIdentifier", ["scope", "identifier"]],
        ["TestReach", ["test", "identifier"]],
      ],
    );
  });

  it("checks that a required child's required is true or 1", () => {
    const checks = structure.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation.name]),
      [["RequiredChildRequired", "RequiredChild"]],
    );
  });

  it("counts a part's and a section's children at least one, a test's parts, and the optional ones", () => {
    const capacities = structure.rules
      .filter((rule) => rule.kind === "capacity")
      .map((rule) => ({
        bounds: boundsOf(rule),
        from: sideOf(rule.from),
        target: sideOf(rule.target).relation,
      }));
    assert.deepStrictEqual(capacities.toSorted(order), expectedCapacities.toSorted(order));
    assert.strictEqual(capacities.length, 14);
  });

  it("declares 46 statements in all", () => {
    assert.strictEqual(structure.rules.length, 2 + expectedContainments.length + 1 + 14);
    assert.strictEqual(expectedContainments.length, 29);
  });
});
