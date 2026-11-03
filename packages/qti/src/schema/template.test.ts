import { inspect } from "node:util";
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as template from "#qti/schema/template.ts";

/**
 * The probe schema: the spine relations the leaf reads, with the leaf's own.
 */
const probe = () =>
  schema(
    "QtiTemplateProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...rosters.relations,
      ...template.relations,
    },
    [...node.rules, ...pkg.rules, ...document.rules, ...declaration.rules, ...template.rules],
  );

/**
 * Whether a pattern's whole-string form admits a value.
 */
const admits = (source: string, value: string): boolean => new RegExp(source, "u").test(value);

/**
 * Any member of the module's relations.
 */
type TemplateMember = (typeof template.relations)[keyof typeof template.relations];

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * The containments whose source is a relation, as field lists and the target relation.
 */
const containmentsFrom = (relation: TemplateMember) =>
  template.rules
    .filter((rule) => rule.kind === "contained")
    .filter((rule) => rule.left.source === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.right)?.bindings,
      target: selectionOf(rule.right)?.relation ?? rule.right.source,
    }));

/**
 * The text of a named check's description, which the public statement type does not expose.
 */
const checkText = (name: string): string => {
  const [rule, ...rest] = template.rules
    .filter((candidate) => candidate.kind === "check")
    .filter((candidate) => candidate.name === name);
  assert.strictEqual(rest.length, 0);
  assert.isDefined(rule);

  const described: unknown = rule;

  return Predicate.hasProperty(described, "desc")
    ? inspect(described.desc, { depth: null, maxStringLength: 100_000 })
    : "";
};

describe("template content and printed variables", () => {
  it("builds a schema over node, declaration, rosters and template without refusal", () => {
    const built = probe();
    for (const name of Object.keys(template.relations)) {
      assert.include(Object.keys(built.relations), name);
    }
    assert.include(Object.keys(built.relations), "PrintedVariableVarRef");
  });

  it("keys the five template handles to their arms", () => {
    assert.deepStrictEqual(Object.keys(template.arms).toSorted(), [
      "qti-printed-variable",
      "qti-template-block",
      "qti-template-block.rubric",
      "qti-template-inline",
      "qti-template-inline.rubric",
    ]);
    assert.strictEqual(template.arms["qti-template-block"], template.relations.TemplateBlock);
    assert.strictEqual(
      template.arms["qti-template-block.rubric"],
      template.relations.RubricTemplateBlock,
    );
    assert.strictEqual(template.arms["qti-template-inline"], template.relations.TemplateInline);
    assert.strictEqual(
      template.arms["qti-template-inline.rubric"],
      template.relations.RubricTemplateInline,
    );
    assert.strictEqual(template.arms["qti-printed-variable"], template.relations.PrintedVariable);
    for (const handle of Object.keys(template.arms)) {
      assert.include(node.relations.NodeKind.handles, handle);
    }
  });

  it("gives the four template arms the same fields, keyed by id, with a show-hide marker each", () => {
    for (const arm of [
      template.relations.TemplateBlock,
      template.relations.TemplateInline,
      template.relations.RubricTemplateBlock,
      template.relations.RubricTemplateInline,
    ]) {
      assert.deepStrictEqual(Object.keys(arm.fields), [
        "id",
        "identifier",
        "showHide",
        "templateIdentifier",
      ]);
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
    assert.deepStrictEqual(containmentsFrom(template.relations.DeclaredTemplateBlockShowHide), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: template.relations.TemplateBlock,
      },
    ]);
    assert.deepStrictEqual(containmentsFrom(template.relations.DeclaredTemplateInlineShowHide), [
      {
        left: ["node"],
        right: ["id"],
        selection: undefined,
        target: template.relations.TemplateInline,
      },
    ]);
    assert.deepStrictEqual(
      containmentsFrom(template.relations.DeclaredRubricTemplateBlockShowHide),
      [
        {
          left: ["node"],
          right: ["id"],
          selection: undefined,
          target: template.relations.RubricTemplateBlock,
        },
      ],
    );
    assert.deepStrictEqual(
      containmentsFrom(template.relations.DeclaredRubricTemplateInlineShowHide),
      [
        {
          left: ["node"],
          right: ["id"],
          selection: undefined,
          target: template.relations.RubricTemplateInline,
        },
      ],
    );
  });

  it("admits %.2f and %i and refuses %q and 2f under PrintedVariableFormat", () => {
    const { value } = template.relations.PrintedVariableFormat.fields;
    assert.strictEqual(value.pattern.source, patterns.printfFormat);
    assert.isTrue(admits(value.pattern.source, "%.2f"));
    assert.isTrue(admits(value.pattern.source, "%i"));
    assert.isFalse(admits(value.pattern.source, "%q"));
    assert.isFalse(admits(value.pattern.source, "2f"));
    assert.deepStrictEqual([...template.relations.PrintedVariableFormat.primaryKey], ["node"]);
  });

  it("stores base and index under the integer-or-variable pattern, field under ncName", () => {
    const { PrintedVariable, PrintedVariableField, PrintedVariableIndex } = template.relations;
    assert.strictEqual(
      PrintedVariable.fields.base.pattern.source,
      patterns.integerOrVariableString,
    );
    assert.strictEqual(
      PrintedVariableIndex.fields.value.pattern.source,
      patterns.integerOrVariableString,
    );
    assert.strictEqual(PrintedVariableField.fields.value.pattern.source, patterns.ncName);
    assert.deepStrictEqual(Object.keys(PrintedVariable.fields), [
      "base",
      "delimiter",
      "id",
      "identifier",
      "mappingIndicator",
      "powerForm",
    ]);
    assert.isTrue(admits(PrintedVariable.fields.base.pattern.source, "16"));
    assert.isTrue(admits(PrintedVariable.fields.base.pattern.source, "BASE"));
    assert.isFalse(admits(PrintedVariable.fields.base.pattern.source, "1.5"));
  });

  it("contains each optional and each default marker in PrintedVariable by node", () => {
    const { PrintedVariable } = template.relations;
    for (const name of [
      "DeclaredPrintedVariableBase",
      "DeclaredPrintedVariableDelimiter",
      "DeclaredPrintedVariableMappingIndicator",
      "DeclaredPrintedVariablePowerForm",
      "PrintedVariableField",
      "PrintedVariableFormat",
      "PrintedVariableIndex",
    ] as const) {
      assert.deepStrictEqual(
        containmentsFrom(template.relations[name]),
        [{ left: ["node"], right: ["id"], selection: undefined, target: PrintedVariable }],
        name,
      );
    }
  });

  it("contains TemplateContentRef in a template declaration of the document and its typed copy", () => {
    const { TemplateContentRef } = template.relations;
    assert.deepStrictEqual([...TemplateContentRef.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(TemplateContentRef.fields).toSorted(), [
      "baseType",
      "cardinality",
      "document",
      "identifier",
      "node",
    ]);
    assert.deepStrictEqual(containmentsFrom(TemplateContentRef), [
      {
        left: ["document", "identifier"],
        right: ["document", "identifier"],
        selection: { kind: "template" },
        target: declaration.relations.Declaration,
      },
      {
        left: ["document", "identifier", "baseType", "cardinality"],
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
    ]);

    const text = checkText("TemplateContentRefType");
    for (const name of ["baseType", "cardinality", "identifier", "single", "multiple"]) {
      assert.include(text, name);
    }
  });

  it("R37: PrintedVariableRef is contained in Declaration.(document, identifier, kind) and checks kind", () => {
    const { PrintedVariableRef } = template.relations;
    assert.deepStrictEqual([...PrintedVariableRef.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(PrintedVariableRef.fields).toSorted(), [
      "document",
      "identifier",
      "kind",
      "node",
    ]);

    const into = containmentsFrom(PrintedVariableRef).find(
      (c) => c.target === declaration.relations.Declaration,
    );
    assert.deepStrictEqual(into?.left, ["document", "identifier", "kind"]);
    assert.deepStrictEqual(into?.right, ["document", "identifier", "kind"]);

    const text = checkText("PrintedVariableRefKind");
    for (const name of ["kind", "outcome", "template"]) {
      assert.include(text, name);
    }
  });

  it("R39: PrintedVariableVarRef is contained in TypedDeclaration and Declaration and checks the type", () => {
    const { PrintedVariableAttr, PrintedVariableVarRef } = template.relations;
    assert.deepStrictEqual([...PrintedVariableAttr.handles], ["base", "index"]);
    assert.deepStrictEqual([...PrintedVariableVarRef.primaryKey], ["node", "attribute"]);
    assert.deepStrictEqual(Object.keys(PrintedVariableVarRef.fields).toSorted(), [
      "attribute",
      "baseType",
      "cardinality",
      "document",
      "identifier",
      "kind",
      "node",
    ]);

    const from = containmentsFrom(PrintedVariableVarRef);
    const typed = from.find((c) => c.target === declaration.relations.TypedDeclaration);
    assert.deepStrictEqual(typed?.left, ["document", "identifier", "baseType", "cardinality"]);
    assert.deepStrictEqual(typed?.right, ["document", "identifier", "baseType", "cardinality"]);

    const declared = from.find((c) => c.target === declaration.relations.Declaration);
    assert.deepStrictEqual(declared?.left, ["document", "identifier", "kind"]);
    assert.deepStrictEqual(declared?.right, ["document", "identifier", "kind"]);

    const text = checkText("PrintedVariableVarRefType");
    for (const name of [
      "baseType",
      "cardinality",
      "kind",
      "integer",
      "single",
      "outcome",
      "template",
    ]) {
      assert.include(text, name);
    }
  });
});
