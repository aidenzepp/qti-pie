/* oxlint-disable anti-slop/no-shape-in-symbol-names -- the roster under test is `DeclarationShape`. */
import { inspect } from "node:util";
import { schema, str } from "@bjornpagen/grizzle";
import { assert, describe, it, layer } from "@effect/vitest";
import { NodeServices } from "@effect/platform-node";
import { Effect, FileSystem, Predicate } from "effect";
import { inject } from "vitest";
import { itemRows } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import { readXml } from "#qti/xml/read.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
  "ContextDeclarationArm",
  "Declaration",
  "DeclarationExternalScored",
  "DeclarationInterpretation",
  "DeclarationKind",
  "DeclarationLongInterpretation",
  "DeclarationMasteryValue",
  "DeclarationNormalMaximum",
  "DeclarationNormalMinimum",
  "DeclarationShape",
  "DeclarationVariableIdentifierRef",
  "DeclarationView",
  "DeclaredMathVariable",
  "DeclaredParamVariable",
  "OutcomeDeclarationArm",
  "RecordDeclaration",
  "ResponseDeclarationArm",
  "ResponseDeclarationId",
  "TemplateDeclarationArm",
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
 * A field's whole description, for comparing two fields by their pattern.
 */
const describeField = (field: ReturnType<typeof str.regex>) =>
  inspect(field, { depth: null, maxStringLength: 100_000 });

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

  it("holds the reserved-names check on Declaration, naming the three reserved names", () => {
    const checks = ofKind("check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [
        ["DeclarationNotReserved", declaration.relations.Declaration],
        ["ReservedOutcomeTypes", declaration.relations.TypedDeclaration],
      ],
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
    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === declaration.relations.Declaration,
    );
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.strictEqual(rule?.parent, declaration.relations.Declaration);
    assert.strictEqual(rule?.discriminator, "shape");
    assert.strictEqual(rule?.roster, declaration.relations.DeclarationShape);

    const arms = Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b));
    assert.deepStrictEqual(arms, [
      ["record", declaration.relations.RecordDeclaration],
      ["typed", declaration.relations.TypedDeclaration],
    ]);
  });

  it("gives TypedDeclaration its base type, cardinality and keys, and RecordDeclaration its id", () => {
    const { RecordDeclaration, TypedDeclaration } = declaration.relations;
    assert.deepStrictEqual(Object.keys(TypedDeclaration.fields).toSorted(), [
      "baseType",
      "cardinality",
      "document",
      "id",
      "identifier",
      "kind",
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
        [declaration.relations.Declaration, ["id", "kind"], ["id", "kind"]],
      ],
    );
  });

  it("mirrors each thin kind arm with the declarations of its kind on id", () => {
    const rules = ofKind("mirrors").filter(
      (rule) => rule.left.source !== declaration.relations.ResponseDeclarationId,
    );
    assert.strictEqual(rules.length, 4);

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
        [
          declaration.relations.TemplateDeclarationArm,
          declaration.relations.Declaration,
          { kind: "template" },
        ],
        [
          declaration.relations.ContextDeclarationArm,
          declaration.relations.Declaration,
          { kind: "context" },
        ],
      ],
    );
    for (const rule of rules) {
      assert.deepStrictEqual([...rule.left.fields], ["id"]);
      assert.deepStrictEqual([...rule.right.fields], ["id"]);
    }
  });

  it("exports the response, outcome, template and context declaration arms", () => {
    assert.deepStrictEqual(Object.keys(declaration.arms).toSorted(), [
      "qti-context-declaration",
      "qti-outcome-declaration",
      "qti-response-declaration",
      "qti-template-declaration",
    ]);
    assert.strictEqual(
      declaration.arms["qti-template-declaration"],
      declaration.relations.TemplateDeclarationArm,
    );
    assert.strictEqual(
      declaration.arms["qti-context-declaration"],
      declaration.relations.ContextDeclarationArm,
    );
    assert.strictEqual(
      declaration.arms["qti-response-declaration"],
      declaration.relations.ResponseDeclarationArm,
    );
    assert.strictEqual(
      declaration.arms["qti-outcome-declaration"],
      declaration.relations.OutcomeDeclarationArm,
    );
  });

  it("gives each optional outcome value a declaration key and a containment in the outcome arm", () => {
    const optional = [
      "DeclarationExternalScored",
      "DeclarationInterpretation",
      "DeclarationLongInterpretation",
      "DeclarationMasteryValue",
      "DeclarationNormalMaximum",
      "DeclarationNormalMinimum",
      "DeclarationVariableIdentifierRef",
      "DeclarationView",
    ] as const;
    for (const name of optional) {
      const rel = declaration.relations[name];
      assert.deepStrictEqual(Object.keys(rel.fields), ["declaration", "value"]);
      assert.deepStrictEqual([...rel.primaryKey], ["declaration"]);

      const into = ofKind("contained").filter((rule) => rule.left.source === rel);
      assert.deepStrictEqual(
        into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
        [[declaration.relations.OutcomeDeclarationArm, ["declaration"], ["id"]]],
      );
    }
  });

  it("declares the DocumentId holder alternatives with five arms", () => {
    const [rule, ...rest] = ofKind("alternatives").filter(
      (candidate) => candidate.parent === document.relations.DocumentId,
    );
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.strictEqual(rule?.discriminator, "holder");
    assert.strictEqual(rule?.roster, document.relations.IdHolder);
    assert.deepStrictEqual(
      Object.entries(rule?.arms ?? {}).toSorted(([a], [b]) => a.localeCompare(b)),
      [
        ["contextDeclaration", document.relations.ContextDeclarationId],
        ["htmlId", document.relations.HtmlId],
        ["itemBody", document.relations.ItemBodyId],
        ["printedVariable", document.relations.PrintedVariableId],
        ["responseDeclaration", declaration.relations.ResponseDeclarationId],
      ],
    );
  });

  it("mirrors ResponseDeclarationId on (node, document, id) into the response Declarations", () => {
    const [rule, ...rest] = ofKind("mirrors").filter(
      (candidate) => candidate.left.source === declaration.relations.ResponseDeclarationId,
    );
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.deepStrictEqual([...(rule?.left.fields ?? [])], ["node", "document", "id"]);
    assert.deepStrictEqual([...(rule?.right.fields ?? [])], ["id", "document", "identifier"]);

    const selection = rule === undefined ? undefined : selectionOf(rule.right);
    assert.strictEqual(selection?.relation, declaration.relations.Declaration);
    assert.deepStrictEqual(selection?.bindings, { kind: "response" });
    assert.deepStrictEqual(Object.keys(declaration.relations.ResponseDeclarationId.fields), [
      "document",
      "id",
      "node",
    ]);
    assert.deepStrictEqual(
      [...declaration.relations.ResponseDeclarationId.primaryKey],
      ["document", "id"],
    );
  });

  it("gives the template arm its two typed booleans and the context arm its version", () => {
    const { ContextDeclarationArm, TemplateDeclarationArm } = declaration.relations;
    assert.deepStrictEqual(Object.keys(TemplateDeclarationArm.fields), [
      "id",
      "mathVariable",
      "paramVariable",
    ]);
    assert.deepStrictEqual([...TemplateDeclarationArm.primaryKey], ["id"]);
    assert.deepStrictEqual(Object.keys(ContextDeclarationArm.fields), ["id", "version"]);
    assert.deepStrictEqual([...ContextDeclarationArm.primaryKey], ["id"]);

    const into = ofKind("contained").filter((rule) => rule.left.source === ContextDeclarationArm);
    assert.deepStrictEqual(
      into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
      [[node.relations.Node, ["id", "version"], ["id", "version"]]],
    );
  });

  it("marks mathVariable and paramVariable per node, each contained in the template arm", () => {
    const { DeclaredMathVariable, DeclaredParamVariable, TemplateDeclarationArm } =
      declaration.relations;
    for (const marker of [DeclaredMathVariable, DeclaredParamVariable]) {
      assert.deepStrictEqual(Object.keys(marker.fields), ["node"]);
      assert.deepStrictEqual([...marker.primaryKey], ["node"]);

      const into = ofKind("contained").filter((rule) => rule.left.source === marker);
      assert.deepStrictEqual(
        into.map((rule) => [rule.right.source, [...rule.left.fields], [...rule.right.fields]]),
        [[TemplateDeclarationArm, ["node"], ["id"]]],
      );
    }
  });

  it("contains the 3.0.0 context declarations in ContextDeclarationId by node (goal 3.1)", () => {
    const [rule, ...rest] = ofKind("contained").filter(
      (candidate) =>
        selectionOf(candidate.left)?.relation === declaration.relations.ContextDeclarationArm,
    );
    assert.strictEqual(rest.length, 0);
    assert.isDefined(rule);
    assert.deepStrictEqual(selectionOf(rule?.left ?? { source: {} })?.bindings, {
      version: "3.0.0",
    });
    assert.deepStrictEqual([...(rule?.left.fields ?? [])], ["id"]);
    assert.strictEqual(rule?.right.source, document.relations.ContextDeclarationId);
    assert.deepStrictEqual([...(rule?.right.fields ?? [])], ["node"]);
  });

  it("reads kind in the ReservedOutcomeTypes check", () => {
    const [check, ...rest] = ofKind("check").filter((rule) => rule.name === "ReservedOutcomeTypes");
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(check?.relation, declaration.relations.TypedDeclaration);

    const described: unknown = check;
    const text = Predicate.hasProperty(described, "desc")
      ? inspect(described.desc, { depth: null, maxStringLength: 100_000 })
      : "";
    for (const word of ["kind", "outcome", "SCORE", "MAXSCORE", "PASSED", "float", "boolean"]) {
      assert.include(text, word);
    }
  });

  it("types DeclarationNormalMaximum.value as a positive double", () => {
    const { value } = declaration.relations.DeclarationNormalMaximum.fields;
    assert.strictEqual(describeField(value), describeField(str.regex(patterns.positiveDouble)));
    assert.notStrictEqual(describeField(value), describeField(str.regex(patterns.xsDouble)));
  });
});

layer(NodeServices.layer, { excludeTestServices: true })("declaration importer", (suite) => {
  suite.effect("writes kind on the TypedDeclaration rows of SIMPLE/choice.xml", () =>
    Effect.gen(function* importedKinds() {
      const fs = yield* FileSystem.FileSystem;
      const bytes = yield* fs.readFile(`${inject("fixtures").simple}/choice.xml`);
      const doc = yield* readXml(bytes);
      const { rows } = yield* itemRows(
        {
          doc,
          packageId: "22222222-2222-4222-8222-222222222222",
          path: "choice.xml",
          resource: "choice",
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      assert.deepStrictEqual(
        Rows.of(rows, declaration.relations.TypedDeclaration)
          .map((row) => [row.identifier, row.kind])
          .toSorted(([a], [b]) => String(a).localeCompare(String(b))),
        [
          ["RESPONSE", "response"],
          ["SCORE", "outcome"],
        ],
      );
    }),
  );
});
