import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as declaration from "#qti/schema/declaration.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as processing from "#qti/schema/processing.ts";
import * as rule from "#qti/schema/rule.ts";

/**
 * The probe schema: the node, item, declaration and processing relations this module's rules
 * reach, with this module's.
 */
const probe = () =>
  schema(
    "QtiRuleProbe",
    {
      ...node.relations,
      ...item.relations,
      ...declaration.relations,
      ...processing.relations,
      ...rule.relations,
    },
    [...rule.rules],
  );

/**
 * The thin arms: handle, relation name.
 */
const thin = {
  "qti-exit-response": "ExitResponse",
  "qti-exit-template": "ExitTemplate",
  "qti-exit-test": "ExitTest",
  "qti-outcome-condition": "OutcomeConditionArm",
  "qti-outcome-else-if": "OutcomeElseIfArm",
  "qti-outcome-processing": "OutcomeProcessing",
  "qti-outcome-processing-fragment": "OutcomeProcessingFragment",
  "qti-response-condition": "ResponseConditionArm",
  "qti-response-else-if": "ResponseElseIfArm",
  "qti-response-processing-fragment": "ResponseProcessingFragment",
  "qti-template-condition": "TemplateConditionArm",
  "qti-template-else-if": "TemplateElseIfArm",
} as const;

/**
 * The branch arms, each holding its condition: handle, relation name, condition arm name.
 */
const branches = {
  "qti-outcome-else": ["OutcomeElseArm", "OutcomeConditionArm"],
  "qti-outcome-if": ["OutcomeIfArm", "OutcomeConditionArm"],
  "qti-response-else": ["ResponseElseArm", "ResponseConditionArm"],
  "qti-response-if": ["ResponseIfArm", "ResponseConditionArm"],
  "qti-template-else": ["TemplateElseArm", "TemplateConditionArm"],
  "qti-template-if": ["TemplateIfArm", "TemplateConditionArm"],
} as const;

const relationsByName = new Map(Object.entries(rule.relations));

const armsByKind = new Map(Object.entries(rule.arms));

const rel = (name: string) => {
  const found = relationsByName.get(name);
  assert.isDefined(found, name);

  return found;
};

/**
 * A statement side's relation name; a side that names no relation whole gives an empty string.
 */
const nameOf = (source: { readonly name?: string }) => source.name ?? "";

const ofKind = <K extends (typeof rule.rules)[number]["kind"]>(kind: K) =>
  rule.rules.filter(
    (statement): statement is Extract<(typeof rule.rules)[number], { readonly kind: K }> =>
      statement.kind === kind,
  );

const containedFrom = (name: string) =>
  ofKind("contained")
    .filter((statement) => statement.left.source === rel(name))
    .map((statement) => [
      statement.right.source,
      [...statement.left.fields],
      [...statement.right.fields],
    ]);

const keysOf = (name: string) =>
  ofKind("key")
    .filter((statement) => statement.relation === rel(name))
    .map((statement) => [...statement.fields]);

describe("rule", () => {
  it("builds a probe schema without refusal", () => {
    const built = probe();
    for (const name of Object.keys(rule.relations)) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.isAbove(Object.keys(rule.relations).length, 0);
  });

  it("keys the 19 arms by their NodeKind handles", () => {
    assert.deepStrictEqual(
      Object.keys(rule.arms).toSorted(),
      [...Object.keys(thin), ...Object.keys(branches), "qti-template-processing"].toSorted(),
    );
  });

  it("adds exactly the 19 relations, each the arm of its handle", () => {
    assert.deepStrictEqual(
      Object.keys(rule.relations).toSorted(),
      [
        ...Object.values(thin),
        ...Object.values(branches).map(([name]) => name),
        "TemplateProcessing",
      ].toSorted(),
    );

    for (const [handle, name] of Object.entries(thin)) {
      assert.isTrue(armsByKind.get(handle) === rel(name), handle);
    }
    for (const [handle, [name]] of Object.entries(branches)) {
      assert.isTrue(armsByKind.get(handle) === rel(name), handle);
    }
    assert.isTrue(armsByKind.get("qti-template-processing") === rel("TemplateProcessing"));
  });

  it("keys each thin arm by id alone, with no statement of its own", () => {
    for (const name of Object.values(thin)) {
      assert.deepStrictEqual(Object.keys(rel(name).fields), ["id"], name);
      assert.deepStrictEqual([...rel(name).primaryKey], ["id"], name);
      assert.deepStrictEqual(keysOf(name), [], name);
      assert.deepStrictEqual(containedFrom(name), [], name);
    }
  });

  it("gives each if and else arm the fields condition and id, keyed by id, with the key (condition)", () => {
    for (const [name] of Object.values(branches)) {
      assert.deepStrictEqual(Object.keys(rel(name).fields).toSorted(), ["condition", "id"], name);
      assert.deepStrictEqual([...rel(name).primaryKey], ["id"], name);
      assert.deepStrictEqual(keysOf(name), [["condition"]], name);
    }
  });

  it("contains each if and else arm's (id, condition) in Edge by (child, parent)", () => {
    for (const [name] of Object.values(branches)) {
      assert.deepStrictEqual(
        containedFrom(name),
        [[node.relations.Edge, ["id", "condition"], ["child", "parent"]]],
        name,
      );
    }
  });

  it("gives TemplateProcessing id and item, the key (item), and containments in Edge and AssessmentItem", () => {
    const name = "TemplateProcessing";
    assert.deepStrictEqual(Object.keys(rel(name).fields).toSorted(), ["id", "item"]);
    assert.deepStrictEqual([...rel(name).primaryKey], ["id"]);
    assert.deepStrictEqual(keysOf(name), [["item"]]);
    assert.deepStrictEqual(containedFrom(name), [
      [node.relations.Edge, ["id", "item"], ["child", "parent"]],
      [item.relations.AssessmentItem, ["item"], ["id"]],
    ]);
  });

  it("holds exactly three mirrors, each condition arm against its if arm's condition", () => {
    const expected = [
      ["ResponseConditionArm", "ResponseIfArm"],
      ["OutcomeConditionArm", "OutcomeIfArm"],
      ["TemplateConditionArm", "TemplateIfArm"],
    ];
    const described = ofKind("mirrors").map(
      (statement) =>
        `${nameOf(statement.left.source)}.${statement.left.fields.join(",")} ~ ${nameOf(statement.right.source)}.${statement.right.fields.join(",")}`,
    );
    assert.deepStrictEqual(
      described.toSorted((a, b) => a.localeCompare(b)),
      expected
        .map(([from, to]) => `${from}.id ~ ${to}.condition`)
        .toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it("holds only keys, containments and mirrors", () => {
    assert.deepStrictEqual(
      [...new Set(rule.rules.map((statement) => statement.kind))].toSorted((a, b) =>
        a.localeCompare(b),
      ),
      ["contained", "key", "mirrors"],
    );
    assert.strictEqual(ofKind("key").length, 7);
    assert.strictEqual(ofKind("contained").length, 8);
  });
});
