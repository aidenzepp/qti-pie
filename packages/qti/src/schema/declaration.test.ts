/* oxlint-disable anti-slop/no-shape-in-symbol-names -- the roster under test is `DeclarationShape`. */
import { inspect } from "node:util";
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";

/**
 * The schema over node's, package's, document's and this module's relations and rules.
 */
const probe = () =>
  schema(
    "QtiDeclarationProbe",
    { ...node.relations, ...pkg.relations, ...document.relations, ...declaration.relations },
    [...node.rules, ...pkg.rules, ...document.rules, ...declaration.rules],
  );

/**
 * The relations and rosters this module declares.
 */
const added = [
  "BaseType",
  "Declaration",
  "DeclarationKind",
  "DeclarationShape",
  "OutcomeDeclarationArm",
  "RecordDeclaration",
  "ResponseDeclarationArm",
  "TypedCardinality",
  "TypedDeclaration",
];

/**
 * The statements `declaration.rules` declares of one kind.
 */
const ofKind = <K extends (typeof declaration.rules)[number]["kind"]>(kind: K) =>
  declaration.rules.filter(
    (rule): rule is Extract<(typeof declaration.rules)[number], { readonly kind: K }> =>
      rule.kind === kind,
  );

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * The names of the variables a QTI processing engine sets itself, which no declaration may use.
 */
const reserved = ["completionStatus", "numAttempts", "duration"];

describe("declaration", () => {
  it("builds a schema over node, package, document and declaration without refusal", () => {
    const built = probe();
    for (const name of added) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("adds exactly the declaration relations and rosters", () => {
    assert.deepStrictEqual(Object.keys(declaration.relations).toSorted(), added);
  });

  it("fixes the four rosters", () => {
    const { BaseType, DeclarationKind, DeclarationShape, TypedCardinality } = declaration.relations;
    assert.deepStrictEqual(DeclarationKind.handles, ["context", "response", "outcome", "template"]);
    assert.deepStrictEqual(DeclarationShape.handles, ["typed", "record"]);
    assert.deepStrictEqual(TypedCardinality.handles, ["single", "multiple", "ordered"]);
    assert.deepStrictEqual(BaseType.handles, [
      "boolean",
      "integer",
      "float",
      "string",
      "identifier",
      "uri",
      "duration",
      "point",
      "pair",
      "directedPair",
      "file",
    ]);
  });

  it("gives Declaration its fields and the keys of one namespace per document", () => {
    const { Declaration } = declaration.relations;
    assert.deepStrictEqual(Object.keys(Declaration.fields).toSorted(), [
      "document",
      "id",
      "identifier",
      "kind",
      "shape",
    ]);
    assert.deepStrictEqual([...Declaration.primaryKey], ["id"]);
    assert.deepStrictEqual(
      ofKind("key")
        .filter((rule) => rule.relation === Declaration)
        .map((rule) => [...rule.fields]),
      [["document", "identifier"]],
    );
  });

  it("contains each declaration in Node by (id, document) against (id, tree)", () => {
    const into = ofKind("contained").filter(
      (rule) => rule.left.source === declaration.relations.Declaration,
    );
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [[node.relations.Node, ["id", "document"], ["id", "tree"]]],
    );
  });

  it("holds one check, on Declaration, naming the three reserved names", () => {
    const checks = ofKind("check");
    assert.strictEqual(checks.length, 1);
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [["DeclarationNotReserved", declaration.relations.Declaration]],
    );

    const check: unknown = checks[0];
    assert.isTrue(Predicate.hasProperty(check, "desc"));

    const text = Predicate.hasProperty(check, "desc")
      ? inspect(check.desc, { depth: null, maxStringLength: 100_000 })
      : "";
    for (const name of reserved) {
      assert.include(text, name);
    }
  });

  it("declares the Declaration alternatives with a typed and a record arm", () => {
    const [rule, ...rest] = ofKind("alternatives");
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.strictEqual(rule?.parent, declaration.relations.Declaration);
    assert.strictEqual(rule?.discriminator, "shape");
    assert.strictEqual(rule?.roster, declaration.relations.DeclarationShape);
    assert.deepStrictEqual(Object.keys(rule?.arms ?? {}).toSorted(), ["record", "typed"]);
    assert.strictEqual(rule?.arms.typed, declaration.relations.TypedDeclaration);
    assert.strictEqual(rule?.arms.record, declaration.relations.RecordDeclaration);
  });

  it("gives TypedDeclaration its base type, cardinality and keys, and RecordDeclaration its id", () => {
    const { RecordDeclaration, TypedDeclaration } = declaration.relations;
    assert.deepStrictEqual(Object.keys(TypedDeclaration.fields).toSorted(), [
      "baseType",
      "cardinality",
      "document",
      "id",
      "identifier",
    ]);
    assert.deepStrictEqual([...TypedDeclaration.primaryKey], ["id"]);
    assert.deepStrictEqual(Object.keys(RecordDeclaration.fields), ["id"]);
    assert.deepStrictEqual([...RecordDeclaration.primaryKey], ["id"]);
    assert.deepStrictEqual(
      ofKind("key")
        .filter((rule) => rule.relation === TypedDeclaration)
        .map((rule) => [...rule.fields]),
      [["document", "identifier"]],
    );

    const copies = ofKind("contained").filter((rule) => rule.left.source === TypedDeclaration);
    assert.deepStrictEqual(
      copies.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [
        [
          declaration.relations.Declaration,
          ["id", "document", "identifier"],
          ["id", "document", "identifier"],
        ],
      ],
    );
  });

  it("mirrors each thin kind arm with the declarations of its kind on id", () => {
    const rules = ofKind("mirrors");
    assert.strictEqual(rules.length, 2);

    const sides = rules.map((rule) => ({
      arm: rule.left.source,
      selection: selectionOf(rule.right),
    }));
    assert.deepStrictEqual(
      sides.map((side) => [side.arm, side.selection?.relation, side.selection?.bindings]),
      [
        [
          declaration.relations.ResponseDeclarationArm,
          declaration.relations.Declaration,
          { kind: "response" },
        ],
        [
          declaration.relations.OutcomeDeclarationArm,
          declaration.relations.Declaration,
          { kind: "outcome" },
        ],
      ],
    );
    for (const rule of rules) {
      assert.deepStrictEqual([...rule.left.fields], ["id"]);
      assert.deepStrictEqual([...rule.right.fields], ["id"]);
    }
  });

  it("exports the response and outcome declaration arms, and none for context or template", () => {
    assert.deepStrictEqual(Object.keys(declaration.arms).toSorted(), [
      "qti-outcome-declaration",
      "qti-response-declaration",
    ]);
    assert.strictEqual(
      declaration.arms["qti-response-declaration"],
      declaration.relations.ResponseDeclarationArm,
    );
    assert.strictEqual(
      declaration.arms["qti-outcome-declaration"],
      declaration.relations.OutcomeDeclarationArm,
    );
  });
});
