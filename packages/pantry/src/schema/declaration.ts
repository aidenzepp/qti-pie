/**
 * Variable declarations: the `qti-response-declaration`, `qti-outcome-declaration`,
 * `qti-template-declaration` and `qti-context-declaration` elements of an item.
 *
 * A declaration names a variable once per document. It is typed, with a base type and a
 * cardinality, or a record, which has neither; the shape arms say which, so a base type exists
 * exactly when the shape is typed. The declaration's kind is a thin arm of its own for the two
 * four kinds. Three names belong to the processing engine and no declaration takes them, and
 * the outcomes the processing engine types itself keep those types.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the value and processing modules name; the shape here is the typed-or-record choice, not a structure. */
import {
  alternatives,
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { FieldBase } from "@bjornpagen/grizzle";
import { ExternalScored, XsBoolean } from "#pantry/schema/content/rosters.ts";
import * as document from "#pantry/schema/document.ts";
import * as node from "#pantry/schema/node.ts";
import {
  LongInterpretationUri,
  OutcomeScaleValue,
  VariableReference,
} from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

/**
 * The element a declaration is written as.
 */
export const DeclarationKind = closed("DeclarationKind", [
  "context",
  "response",
  "outcome",
  "template",
]);

/**
 * Whether a declaration has a base type and a cardinality, or is a record.
 */
export const DeclarationShape = closed("DeclarationShape", ["typed", "record"]);

/**
 * The base types of a typed variable.
 */
export const BaseType = closed("BaseType", [
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

/**
 * The cardinalities of a typed variable.
 */
export const TypedCardinality = closed("TypedCardinality", ["single", "multiple", "ordered"]);

/**
 * A variable a document declares, named once per document, on a node of that document's tree.
 */
export const Declaration = relation(
  "Declaration",
  {
    document: uuid,
    id: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
    shape: closedId(DeclarationShape),
  },
  ["id"],
);

/**
 * A declaration with a base type and a cardinality. `document` and `identifier` copy the
 * declaration's so the pair stays unique for the typed shape alone, and `kind` copies it so the
 * reserved outcomes can be typed.
 */
export const TypedDeclaration = relation(
  "TypedDeclaration",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    id: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
  },
  ["id"],
);

/**
 * A declaration whose value is a record: it has no base type and no cardinality.
 */
export const RecordDeclaration = relation("RecordDeclaration", { id: uuid }, ["id"]);

/**
 * The `qti-response-declaration` element: a declaration of the response kind.
 */
export const ResponseDeclarationArm = relation("ResponseDeclarationArm", { id: uuid }, ["id"]);

/**
 * The `qti-outcome-declaration` element: a declaration of the outcome kind.
 */
export const OutcomeDeclarationArm = relation("OutcomeDeclarationArm", { id: uuid }, ["id"]);

/**
 * The `qti-template-declaration` element: a declaration of the template kind. The two booleans are
 * written as the source wrote them; a marker below says whether the source wrote each.
 */
export const TemplateDeclarationArm = relation(
  "TemplateDeclarationArm",
  {
    id: uuid,
    mathVariable: closedId(XsBoolean),
    paramVariable: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * The source wrote `math-variable` on this template declaration; absent, it is `false`.
 */
export const DeclaredMathVariable = relation("DeclaredMathVariable", { node: uuid }, ["node"]);

/**
 * The source wrote `param-variable` on this template declaration; absent, it is `false`.
 */
export const DeclaredParamVariable = relation("DeclaredParamVariable", { node: uuid }, ["node"]);

/**
 * The `qti-context-declaration` element: a declaration of the context kind. The version copies
 * the node's, because a 3.0.0 context declaration must hold an `identifier` the document's ids
 * list, which 3.0.1 does not require.
 */
export const ContextDeclarationArm = relation(
  "ContextDeclarationArm",
  { id: uuid, version: closedId(node.SchemaVersion) },
  ["id"],
);

/**
 * An optional-value relation of an outcome declaration: one row where the attribute is written.
 */
const outcomeValue = <Name extends string, Value extends FieldBase>(name: Name, value: Value) =>
  relation(name, { declaration: uuid, value }, ["declaration"]);

/**
 * The `view` attribute: a space-separated list of views.
 */
export const DeclarationView = outcomeValue("DeclarationView", str.regex(patterns.viewList));

/**
 * The `interpretation` attribute, an `xs:string`.
 */
export const DeclarationInterpretation = outcomeValue(
  "DeclarationInterpretation",
  str.regex(patterns.xsString, patterns.xsStringFlags),
);

/**
 * The `long-interpretation` attribute, a URI.
 */
export const DeclarationLongInterpretation = outcomeValue(
  "DeclarationLongInterpretation",
  LongInterpretationUri,
);

/**
 * The `normal-maximum` attribute.
 */
export const DeclarationNormalMaximum = outcomeValue(
  "DeclarationNormalMaximum",
  str.regex(patterns.positiveDouble),
);

/**
 * The `normal-minimum` attribute.
 */
export const DeclarationNormalMinimum = outcomeValue("DeclarationNormalMinimum", OutcomeScaleValue);

/**
 * The `mastery-value` attribute.
 */
export const DeclarationMasteryValue = outcomeValue("DeclarationMasteryValue", OutcomeScaleValue);

/**
 * The `external-scored` attribute: `human` or `externalMachine`.
 */
export const DeclarationExternalScored = outcomeValue(
  "DeclarationExternalScored",
  closedId(ExternalScored),
);

/**
 * The `variable-identifier-ref` attribute: the identifier of another variable.
 */
export const DeclarationVariableIdentifierRef = outcomeValue(
  "DeclarationVariableIdentifierRef",
  VariableReference,
);

/**
 * The `identifier` of a response declaration as the document's id holder: one holder per id.
 */
export const ResponseDeclarationId = relation(
  "ResponseDeclarationId",
  { document: uuid, id: ncName, node: uuid },
  ["document", "id"],
);

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  BaseType,
  ContextDeclarationArm,
  Declaration,
  DeclarationExternalScored,
  DeclarationInterpretation,
  DeclarationKind,
  DeclarationLongInterpretation,
  DeclarationMasteryValue,
  DeclarationNormalMaximum,
  DeclarationNormalMinimum,
  DeclarationShape,
  DeclarationVariableIdentifierRef,
  DeclarationView,
  DeclaredMathVariable,
  DeclaredParamVariable,
  OutcomeDeclarationArm,
  RecordDeclaration,
  ResponseDeclarationArm,
  ResponseDeclarationId,
  TemplateDeclarationArm,
  TypedCardinality,
  TypedDeclaration,
};

/**
 * The element arms of this module, by element name.
 */
export const arms = {
  "qti-context-declaration": ContextDeclarationArm,
  "qti-outcome-declaration": OutcomeDeclarationArm,
  "qti-response-declaration": ResponseDeclarationArm,
  "qti-template-declaration": TemplateDeclarationArm,
};

/**
 * The statements over this module's relations: a declaration is named once per document and lies
 * on a node of that document's tree; it is typed or a record, each shape's row copying the
 * declaration's document, identifier and kind where it keeps them; each kind's arm exists
 * exactly for a declaration of its kind; no declaration takes a name the processing engine sets
 * itself; the reserved outcomes keep their base types; and a 3.0.0 context declaration holds an
 * `identifier` the document's id list holds.
 */
export const rules = [
  key(Declaration, ["document", "identifier"]),
  contained(on(Declaration, "id", "document"), on(node.Node, "id", "tree")),
  check("DeclarationNotReserved", Declaration, (d) =>
    d.not(d.in(d.identifier, ["completionStatus", "numAttempts", "duration"])),
  ),
  alternatives(Declaration, "shape", DeclarationShape, {
    record: RecordDeclaration,
    typed: TypedDeclaration,
  }),
  key(TypedDeclaration, ["document", "identifier"]),
  contained(
    on(TypedDeclaration, "id", "document", "identifier"),
    on(Declaration, "id", "document", "identifier"),
  ),
  mirrors(on(ResponseDeclarationArm, "id"), on(select(Declaration, { kind: "response" }), "id")),
  mirrors(on(OutcomeDeclarationArm, "id"), on(select(Declaration, { kind: "outcome" }), "id")),
  mirrors(on(TemplateDeclarationArm, "id"), on(select(Declaration, { kind: "template" }), "id")),
  mirrors(on(ContextDeclarationArm, "id"), on(select(Declaration, { kind: "context" }), "id")),
  contained(on(TypedDeclaration, "id", "kind"), on(Declaration, "id", "kind")),
  check("ReservedOutcomeTypes", TypedDeclaration, (d) =>
    d.and(
      d.or(
        d.not(d.and(d.eq(d.kind, "outcome"), d.in(d.identifier, ["SCORE", "MAXSCORE"]))),
        d.eq(d.baseType, "float"),
      ),
      d.or(
        d.not(d.and(d.eq(d.kind, "outcome"), d.eq(d.identifier, "PASSED"))),
        d.eq(d.baseType, "boolean"),
      ),
    ),
  ),
  contained(on(DeclaredMathVariable, "node"), on(TemplateDeclarationArm, "id")),
  contained(on(DeclaredParamVariable, "node"), on(TemplateDeclarationArm, "id")),
  contained(on(ContextDeclarationArm, "id", "version"), on(node.Node, "id", "version")),
  contained(
    on(select(ContextDeclarationArm, { version: "3.0.0" }), "id"),
    on(document.ContextDeclarationId, "node"),
  ),
  ...[
    DeclarationExternalScored,
    DeclarationInterpretation,
    DeclarationLongInterpretation,
    DeclarationMasteryValue,
    DeclarationNormalMaximum,
    DeclarationNormalMinimum,
    DeclarationVariableIdentifierRef,
    DeclarationView,
  ].map((value) => contained(on(value, "declaration"), on(OutcomeDeclarationArm, "id"))),
  mirrors(
    on(ResponseDeclarationId, "node", "document", "id"),
    on(select(Declaration, { kind: "response" }), "id", "document", "identifier"),
  ),
  alternatives(document.DocumentId, "holder", document.IdHolder, {
    contextDeclaration: document.ContextDeclarationId,
    htmlId: document.HtmlId,
    itemBody: document.ItemBodyId,
    printedVariable: document.PrintedVariableId,
    responseDeclaration: ResponseDeclarationId,
  }),
] as const;
