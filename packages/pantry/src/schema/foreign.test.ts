import { schema } from "@bjornpagen/grizzle";
import type { Fact } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import {
  NamespacePolicy,
  ProcessContents,
  SchemaNamespace,
  SchemaSet,
} from "#pantry/schema/content/rosters.ts";
import * as foreign from "#pantry/schema/foreign.ts";
import * as node from "#pantry/schema/node.ts";

const {
  AttributeExclusion,
  AttributeWildcard,
  ForeignAttribute,
  ForeignElement,
  GlobalAttribute,
  GlobalElement,
  RootSchemaSet,
  WildcardExclusion,
  WildcardHost,
} = foreign.relations;

type Rule = (typeof foreign.rules)[number];

type Source =
  | { readonly name: string }
  | {
      readonly bindings: Readonly<Record<string, string>>;
      readonly relation: { readonly name: string };
    };

interface Sided {
  readonly fields: readonly string[];
  readonly source: Source;
}

/**
 * One side of a statement written out: the relation, the handles a `select` fixes, and the fields.
 */
const sideOf = ({ fields, source }: Sided): string => {
  if ("relation" in source) {
    const bound = Object.entries(source.bindings).map(([key, value]) => `${key}=${value}`);

    return `${source.relation.name}{${bound.join(",")}}(${fields.join(",")})`;
  }

  return `${source.name}(${fields.join(",")})`;
};

/**
 * One statement written out by its law kind and its sides, or by its check's name and relation:
 * never a message.
 */
const stated = (rule: Rule): string => {
  if (rule.kind === "contained") {
    return `contained ${sideOf(rule.left)} in ${sideOf(rule.right)}`;
  }

  return `check ${rule.name} on ${rule.relation.name}`;
};

const statements = foreign.rules.map(stated);

const keyOf = (relation: { readonly primaryKey: readonly string[] }): readonly string[] => [
  ...relation.primaryKey,
];

describe("the foreign tree's relations", () => {
  it("builds a schema over the module's relations and statements", () => {
    const probe = schema(
      "QtiForeignProbe",
      {
        ...node.relations,
        NamespacePolicy,
        ProcessContents,
        SchemaNamespace,
        SchemaSet,
        ...foreign.relations,
      },
      [...node.rules, ...foreign.rules],
    );
    assert.deepStrictEqual(
      Object.keys(foreign.relations).toSorted(),
      Object.keys(foreign.relations)
        .filter((name) => name in probe.relations)
        .toSorted(),
    );
  });

  it("declares the nine relations", () => {
    assert.deepStrictEqual(Object.keys(foreign.relations).toSorted(), [
      "AttributeExclusion",
      "AttributeWildcard",
      "ForeignAttribute",
      "ForeignElement",
      "GlobalAttribute",
      "GlobalElement",
      "RootSchemaSet",
      "WildcardExclusion",
      "WildcardHost",
    ]);
    assert.deepStrictEqual(Object.keys(foreign.arms), ["foreign"]);
  });

  it("gives the two host relations the host, its policy, its processing and its target", () => {
    for (const relation of [WildcardHost, AttributeWildcard]) {
      assert.deepStrictEqual(Object.keys(relation.fields), ["host", "policy", "process", "target"]);
      assert.deepStrictEqual(keyOf(relation), ["host"]);
    }
  });

  it("gives the two exclusion relations a host and a namespace, keyed by both", () => {
    for (const relation of [WildcardExclusion, AttributeExclusion]) {
      assert.deepStrictEqual(Object.keys(relation.fields), ["host", "namespace"]);
      assert.deepStrictEqual(keyOf(relation), ["host", "namespace"]);
    }
  });

  it("gives the two global relations a name and its schema set, keyed by all three", () => {
    for (const relation of [GlobalElement, GlobalAttribute]) {
      assert.deepStrictEqual(Object.keys(relation.fields), ["local", "namespace", "set"]);
      assert.deepStrictEqual(keyOf(relation), ["set", "namespace", "local"]);
    }
  });

  it("keys RootSchemaSet by the root kind", () => {
    assert.deepStrictEqual(Object.keys(RootSchemaSet.fields), ["root", "set"]);
    assert.deepStrictEqual(keyOf(RootSchemaSet), ["root"]);
  });

  it("lists the seeded namespaces, and `absent` for none", () => {
    assert.deepStrictEqual(
      [...SchemaNamespace.handles],
      [
        "asi",
        "cp",
        "cpx",
        "csmd",
        "drd",
        "lom",
        "mathml",
        "qmd",
        "ssml",
        "ud",
        "xi",
        "xlink",
        "xml",
        "xmlns",
        "xsi",
        "absent",
      ],
    );
  });

  it("keeps ForeignElement as p11-2 declared it", () => {
    assert.deepStrictEqual(Object.keys(ForeignElement.fields), [
      "id",
      "local",
      "namespace",
      "parentKind",
      "prefix",
      "rootKind",
      "schemaSet",
    ]);
    assert.deepStrictEqual(keyOf(ForeignElement), ["id"]);
  });

  it("keys ForeignAttribute by its node and qualified name", () => {
    assert.deepStrictEqual(Object.keys(ForeignAttribute.fields), [
      "kind",
      "local",
      "namespace",
      "node",
      "prefix",
      "process",
      "rootKind",
      "schemaSet",
      "value",
    ]);
    assert.deepStrictEqual(keyOf(ForeignAttribute), ["node", "prefix", "local"]);
  });
});

describe("the foreign tree's statements", () => {
  it("states the two exclusion containments", () => {
    assert.includeMembers(statements, [
      "contained WildcardExclusion(host) in WildcardHost(host)",
      "contained AttributeExclusion(host) in AttributeWildcard(host)",
    ]);
  });

  it("states the ForeignElement containments and check", () => {
    assert.includeMembers(statements, [
      "contained ForeignElement(id,parentKind) in Edge(child,parentKind)",
      "contained ForeignElement(id,prefix,rootKind) in Node(id,prefix,rootKind)",
      "contained ForeignElement(rootKind,schemaSet) in RootSchemaSet(root,set)",
      "check ForeignUnqualifiedUnprefixed on ForeignElement",
    ]);
  });

  it("states the ForeignAttribute containments and check", () => {
    assert.includeMembers(statements, [
      "contained ForeignAttribute(node,kind,rootKind) in Node(id,kind,rootKind)",
      "contained ForeignAttribute(rootKind,schemaSet) in RootSchemaSet(root,set)",
      "contained ForeignAttribute(kind,process) in AttributeWildcard(host,process)",
      "check ForeignAttributePrefix on ForeignAttribute",
    ]);
  });

  it("states those ten statements and no other", () => {
    assert.strictEqual(statements.length, 10);
    assert.strictEqual(new Set(statements).size, 10);
  });

  it("states no capacity: the namespace policy is the importer's (decision 270)", () => {
    assert.isFalse(
      foreign.rules.some((rule: { readonly kind: string }) => rule.kind === "capacity"),
    );
  });
});

const mathml = "http://www.w3.org/1998/Math/MathML";

const hold = (value: string): string => value;

describe("the seeded namespace columns", () => {
  it("hold a roster handle, never an author's namespace text", () => {
    hold("absent" satisfies Fact<typeof WildcardHost>["target"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof WildcardHost>["target"]);
    hold("absent" satisfies Fact<typeof AttributeWildcard>["target"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof AttributeWildcard>["target"]);
    hold("absent" satisfies Fact<typeof WildcardExclusion>["namespace"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof WildcardExclusion>["namespace"]);
    hold("absent" satisfies Fact<typeof AttributeExclusion>["namespace"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof AttributeExclusion>["namespace"]);
    hold("absent" satisfies Fact<typeof GlobalElement>["namespace"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof GlobalElement>["namespace"]);
    hold("absent" satisfies Fact<typeof GlobalAttribute>["namespace"]);
    // @ts-expect-error a roster handle is not a namespace URI
    hold(mathml satisfies Fact<typeof GlobalAttribute>["namespace"]);
  });
});
