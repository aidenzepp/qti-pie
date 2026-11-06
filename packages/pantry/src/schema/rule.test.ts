/* oxlint-disable typescript/no-unnecessary-type-parameters -- `Equal` is the standard type-equality helper; its two `T` parameters are compared across the two function types by design, so each appears once per signature. */
import { schema } from "@bjornpagen/grizzle";
import type { Statement } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inspect } from "node:util";
import * as contracts from "#pantry/schema/contracts.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as item from "#pantry/schema/item.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import * as node from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as rule from "#pantry/schema/rule.ts";

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

/**
 * The thin arms the second half adds: the value-setting kinds, the template constraint, and the
 * two XInclude kinds. Handle, relation name.
 */
const added = {
  "qti-lookup-outcome-value": "LookupOutcomeValue",
  "qti-set-correct-response": "SetCorrectResponse",
  "qti-set-default-value": "SetDefaultValue",
  "qti-set-outcome-value": "SetOutcomeValue",
  "qti-set-template-value": "SetTemplateValue",
  "qti-template-constraint": "TemplateConstraint",
  "xi:fallback": "Fallback",
  "xi:include": "XInclude",
} as const;

/**
 * The five value-setting arms, each of which names a variable through its `VariableRef` row.
 */
const valueSetting = [
  "LookupOutcomeValue",
  "SetCorrectResponse",
  "SetDefaultValue",
  "SetOutcomeValue",
  "SetTemplateValue",
] as const;

/**
 * The twelve holders: the kinds that take exactly one expression.
 */
const holders = [
  ...valueSetting,
  "OutcomeElseIfArm",
  "OutcomeIfArm",
  "ResponseElseIfArm",
  "ResponseIfArm",
  "TemplateConstraint",
  "TemplateElseIfArm",
  "TemplateIfArm",
] as const;

/**
 * The six optional XInclude attribute relations: name, value pattern.
 */
const xincludeOptionals = [
  "XIncludeAccept",
  "XIncludeAcceptLanguage",
  "XIncludeEncoding",
  "XIncludeHref",
  "XIncludeParse",
  "XIncludeXpointer",
] as const;

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

/**
 * Type equality, so a tuple of literals is told from a tuple of strings.
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const holderContainments = (name: string) =>
  containedFrom(name).filter(([target]) => target === rel("RuleOperand"));

/**
 * What a containment's right side can name.
 */
type ContainmentTarget = ReturnType<typeof containedFrom>[number][0];

/**
 * Every relation a containment of this module can name, keyed by the relation, to its name.
 */
const namesByRelation = new Map<ContainmentTarget, string>(
  [node.relations, processing.relations, rule.relations].flatMap((relations) =>
    Object.entries(relations).map(([name, relation]) => [relation, name]),
  ),
);

const targetName = (target: ContainmentTarget | undefined) =>
  target === undefined ? "" : (namesByRelation.get(target) ?? "");

describe("rule", () => {
  it("builds a probe schema without refusal", () => {
    const built = probe();
    for (const name of Object.keys(rule.relations)) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.isAbove(Object.keys(rule.relations).length, 0);
  });

  it("keys the 27 arms by their NodeKind handles", () => {
    assert.deepStrictEqual(
      Object.keys(rule.arms).toSorted(),
      [
        ...Object.keys(thin),
        ...Object.keys(branches),
        ...Object.keys(added),
        "qti-template-processing",
      ].toSorted(),
    );
    assert.strictEqual(Object.keys(rule.arms).length, 27);
  });

  it("adds exactly the 34 relations, each arm the relation of its handle", () => {
    assert.deepStrictEqual(
      Object.keys(rule.relations).toSorted(),
      [
        ...Object.values(thin),
        ...Object.values(branches).map(([name]) => name),
        ...Object.values(added),
        ...xincludeOptionals,
        "RuleOperand",
        "TemplateProcessing",
      ].toSorted(),
    );

    for (const [handle, name] of Object.entries({ ...thin, ...added })) {
      assert.isTrue(armsByKind.get(handle) === rel(name), handle);
    }
    for (const [handle, [name]] of Object.entries(branches)) {
      assert.isTrue(armsByKind.get(handle) === rel(name), handle);
    }
    assert.isTrue(armsByKind.get("qti-template-processing") === rel("TemplateProcessing"));
  });

  it("keys each thin arm by id alone, with no key of its own", () => {
    for (const name of [...Object.values(thin), ...Object.values(added)]) {
      assert.deepStrictEqual(Object.keys(rel(name).fields), ["id"], name);
      assert.deepStrictEqual([...rel(name).primaryKey], ["id"], name);
      assert.deepStrictEqual(keysOf(name), [], name);
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
        containedFrom(name).filter(([target]) => target === node.relations.Edge),
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

  it("gives RuleOperand its four fields, keyed by rule, with the key (child)", () => {
    assert.deepStrictEqual(Object.keys(rel("RuleOperand").fields).toSorted(), [
      "child",
      "position",
      "rule",
      "ruleKind",
    ]);
    assert.deepStrictEqual([...rel("RuleOperand").primaryKey], ["rule"]);
    assert.deepStrictEqual(keysOf("RuleOperand"), [["child"]]);
  });

  it("contains RuleOperand in Edge, Node and Expression", () => {
    assert.deepStrictEqual(containedFrom("RuleOperand"), [
      [node.relations.Edge, ["child", "rule", "position"], ["child", "parent", "position"]],
      [node.relations.Node, ["rule", "ruleKind"], ["id", "kind"]],
      [processing.relations.Expression, ["child"], ["id"]],
    ]);
  });

  it("contains exactly the twelve holder arms in RuleOperand.(rule)", () => {
    const from = ofKind("contained")
      .filter((statement) => statement.right.source === rel("RuleOperand"))
      .filter((statement) => statement.left.fields.join(",") === "id");
    for (const statement of from) {
      assert.deepStrictEqual([...statement.right.fields], ["rule"]);
    }
    assert.deepStrictEqual(
      from.map((statement) => nameOf(statement.left.source)).toSorted(),
      [...holders].toSorted(),
    );
    assert.strictEqual(holders.length, 12);
    for (const name of holders) {
      assert.strictEqual(holderContainments(name).length, 1, name);
    }
  });

  it("contains exactly the five value-setting arms in VariableRef.(id)", () => {
    const from = ofKind("contained").filter(
      (statement) => statement.right.source === processing.relations.VariableRef,
    );
    for (const statement of from) {
      assert.deepStrictEqual([...statement.left.fields], ["id"]);
      assert.deepStrictEqual([...statement.right.fields], ["id"]);
    }
    assert.deepStrictEqual(
      from.map((statement) => nameOf(statement.left.source)).toSorted(),
      [...valueSetting].toSorted(),
    );
  });

  it("keeps every other thin arm clear of containments", () => {
    const touched = new Set<string>(holders);
    const setting = new Set<string>(valueSetting);
    for (const name of [...Object.values(thin), ...Object.values(added)]) {
      if (touched.has(name)) {
        continue;
      }

      assert.deepStrictEqual(containedFrom(name), [], name);
    }
    for (const name of holders) {
      const expected = setting.has(name) ? ["RuleOperand", "VariableRef"] : ["RuleOperand"];
      const found = containedFrom(name)
        .map(([target]) => targetName(target))
        .filter((target) => target !== "Edge");
      assert.deepStrictEqual(found.toSorted(), expected, name);
    }
  });

  it("gives each optional XInclude relation node and value, keyed by node, contained in XInclude", () => {
    for (const name of xincludeOptionals) {
      assert.deepStrictEqual(Object.keys(rel(name).fields).toSorted(), ["node", "value"], name);
      assert.deepStrictEqual([...rel(name).primaryKey], ["node"], name);
      assert.deepStrictEqual(
        containedFrom(name).map(([target, left, right]) => [targetName(target), left, right]),
        [["XInclude", ["node"], ["id"]]],
        name,
      );
    }
  });

  it("types XIncludeParse as closedId of its roster", () => {
    assert.strictEqual(
      rule.relations.XIncludeParse.fields.value.roster,
      rosters.XIncludeParseValue,
    );
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

  it("holds exactly the XInclude xpointer capacity: every XInclude has zero XIncludeXpointer rows", () => {
    const capacities = ofKind("capacity");
    assert.strictEqual(capacities.length, 1);

    const [capacity] = capacities;
    assert.strictEqual(capacity?.target.source, rule.relations.XInclude);
    assert.deepStrictEqual([...(capacity?.target.fields ?? [])], ["id"]);
    assert.strictEqual(capacity?.from.source, rule.relations.XIncludeXpointer);
    assert.deepStrictEqual([...(capacity?.from.fields ?? [])], ["node"]);

    const described: unknown = capacity;
    const bounds = inspect(
      Predicate.hasProperty(described, "desc") && Predicate.hasProperty(described.desc, "within")
        ? described.desc.within
        : undefined,
      { depth: null },
    );
    assert.strictEqual(bounds.match(/0n/gu)?.length, 2, bounds);
  });

  it("holds XIncludeParse to the value xml, as a check on that relation", () => {
    const checks = ofKind("check").filter((statement) => statement.name === "XIncludeParseXml");
    assert.strictEqual(checks.length, 1);
    assert.strictEqual(checks[0]?.relation, rule.relations.XIncludeParse);

    const described: unknown = checks[0];
    const text = inspect(Predicate.hasProperty(described, "desc") ? described.desc : undefined, {
      depth: null,
      maxStringLength: 100_000,
    });
    assert.include(text, "value");
    assert.include(text, "xml");
    assert.notInclude(text, "text");
  });

  it("widens RuleOperandKind to the twelve holders and the three single-expression owners", () => {
    const checks = ofKind("check").filter((statement) => statement.name === "RuleOperandKind");
    assert.strictEqual(checks.length, 1);
    assert.strictEqual(checks[0]?.relation, rule.relations.RuleOperand);

    const described: unknown = checks[0];
    const text = inspect(Predicate.hasProperty(described, "desc") ? described.desc : undefined, {
      depth: null,
      maxStringLength: 100_000,
    });
    const handles = [
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
      "qti-pre-condition",
      "qti-branch-rule",
      "qti-template-default",
    ];
    for (const handle of handles) {
      assert.include(text, `'${handle}'`, handle);
    }
    for (const handle of ["qti-pre-condition", "qti-branch-rule", "qti-template-default"]) {
      assert.include(node.relations.NodeKind.handles, handle);
    }
    assert.strictEqual(text.match(/'qti-[a-z-]+'/gu)?.length, handles.length, text);
  });

  it("holds only keys, containments, mirrors and checks, each check on this module's relations", () => {
    const statements: readonly Statement[] = rule.rules;
    for (const kind of new Set(statements.map((statement) => statement.kind))) {
      assert.include(["capacity", "check", "contained", "key", "mirrors"], kind);
    }
    for (const statement of statements.filter((candidate) => candidate.kind === "check")) {
      assert.isTrue(
        [...relationsByName.values()].some((relation) => relation === statement.relation),
        statement.name,
      );
    }
  });
});

describe("kinds/xi", () => {
  it("holds exactly the two XInclude kinds and five attributes, as literal unions", () => {
    const kindsAreLiterals: Equal<(typeof xi.kinds)[number], "xi:fallback" | "xi:include"> = true;
    const attributesAreLiterals: Equal<
      (typeof xi.attributes)[number],
      "accept" | "accept-language" | "encoding" | "parse" | "xpointer"
    > = true;
    assert.isTrue(kindsAreLiterals);
    assert.isTrue(attributesAreLiterals);
    assert.deepStrictEqual([...xi.kinds].toSorted(), ["xi:fallback", "xi:include"]);
    assert.deepStrictEqual([...xi.attributes].toSorted(), [
      "accept",
      "accept-language",
      "encoding",
      "parse",
      "xpointer",
    ]);
  });

  it("admits exactly the 78 pairs of 3.0.0 and the 79 of 3.0.1, by name", () => {
    const mixed = ["comment", "entityRef", "pi", "text", "ws"];
    const hosts = [
      "a",
      "abbr",
      "acronym",
      "address",
      "article",
      "aside",
      "b",
      "big",
      "caption",
      "cite",
      "code",
      "dd",
      "dfn",
      "div",
      "dt",
      "em",
      "figcaption",
      "footer",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "i",
      "kbd",
      "label",
      "li",
      "nav",
      "object",
      "p",
      "pre",
      "q",
      "qti-assessment-section",
      "qti-content-body.feedback",
      "qti-content-body.modal",
      "qti-content-body.rubric",
      "qti-content-body.rubricTemplate",
      "qti-content-body.template",
      "qti-content-body.testFeedback",
      "qti-content-body.testRubric",
      "qti-feedback-inline",
      "qti-gap-match-interaction",
      "qti-gap-text",
      "qti-hottext",
      "qti-hottext-interaction",
      "qti-inline-choice",
      "qti-item-body",
      "qti-label",
      "qti-prompt",
      "qti-simple-associable-choice",
      "qti-simple-choice",
      "qti-template-inline",
      "qti-template-inline.rubric",
      "samp",
      "section",
      "small",
      "span",
      "strong",
      "sub",
      "sup",
      "td",
      "th",
      "tt",
      "var",
    ];
    const shared = [
      "xi:include>xi:fallback",
      "xi:fallback>xi:include",
      ...hosts.map((host) => `${host}>xi:include`),
      ...mixed.map((child) => `xi:include>${child}`),
      ...mixed.map((child) => `xi:fallback>${child}`),
    ];
    const expected = {
      "3.0.0": shared.toSorted(),
      "3.0.1": [...shared, "qti-stimulus-body>xi:include"].toSorted(),
    };
    for (const version of ["3.0.0", "3.0.1"] as const) {
      const found = xi.admission
        .filter((row) => row.version === version)
        .map((row) => `${row.parent}>${row.child}`)
        .toSorted();
      assert.deepStrictEqual(found, expected[version], version);
    }
    assert.strictEqual(hosts.length, 66);
    assert.strictEqual(expected["3.0.0"].length, 78);
    assert.strictEqual(expected["3.0.1"].length, 79);
    assert.strictEqual(xi.admission.length, 157);
  });

  it("names the six XInclude attributes on xi:include", () => {
    assert.deepStrictEqual([...xi.registry["xi:include"].attributes].toSorted(), [
      "accept",
      "accept-language",
      "encoding",
      "href",
      "parse",
      "xpointer",
    ]);
  });
});

describe("contracts (rule)", () => {
  it("types XIncludeHref.value XIncludeUri", () => {
    assert.strictEqual(rule.XIncludeHref.fields.value.name, contracts.XIncludeUri.name);
  });
});
