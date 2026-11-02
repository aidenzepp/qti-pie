/**
 * Variable declarations: the `qti-response-declaration` and `qti-outcome-declaration` elements of
 * an item, and the context and template kinds the roster reserves for later arms.
 *
 * A declaration names a variable once per document. It is typed, with a base type and a
 * cardinality, or a record, which has neither; the shape arms say which, so a base type exists
 * exactly when the shape is typed. The declaration's kind is a thin arm of its own for the two
 * kinds this module owns. Three names belong to the processing engine and no declaration takes
 * them.
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
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

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
 * declaration's so the pair stays unique for the typed shape alone.
 */
export const TypedDeclaration = relation(
  "TypedDeclaration",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    id: uuid,
    identifier: ncName,
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
 * An optional-value relation of an outcome declaration: one row where the attribute is written.
 */
const outcomeValue = <Name extends string>(name: Name, value: ReturnType<typeof str.regex>) =>
  relation(name, { declaration: uuid, value }, ["declaration"]);

/**
 * The `view` attribute: a space-separated list of views.
 */
export const DeclarationView = outcomeValue(
  "DeclarationView",
  str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
);

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
  str.regex(patterns.anyUri),
);

/**
 * The `normal-maximum` attribute.
 */
export const DeclarationNormalMaximum = outcomeValue(
  "DeclarationNormalMaximum",
  str.regex(patterns.xsDouble),
);

/**
 * The `normal-minimum` attribute.
 */
export const DeclarationNormalMinimum = outcomeValue(
  "DeclarationNormalMinimum",
  str.regex(patterns.xsDouble),
);

/**
 * The `mastery-value` attribute.
 */
export const DeclarationMasteryValue = outcomeValue(
  "DeclarationMasteryValue",
  str.regex(patterns.xsDouble),
);

/**
 * The `external-scored` attribute: `human` or `externalMachine`.
 */
export const DeclarationExternalScored = outcomeValue(
  "DeclarationExternalScored",
  str.regex(patterns.externalScored),
);

/**
 * The `variable-identifier-ref` attribute: the identifier of another variable.
 */
export const DeclarationVariableIdentifierRef = outcomeValue(
  "DeclarationVariableIdentifierRef",
  ncName,
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
  OutcomeDeclarationArm,
  RecordDeclaration,
  ResponseDeclarationArm,
  ResponseDeclarationId,
  TypedCardinality,
  TypedDeclaration,
};

/**
 * The element arms of this module, by element name. The `context` and `template` kinds have none
 * yet; their arms belong to the phase that reads those elements.
 */
export const arms = {
  "qti-outcome-declaration": OutcomeDeclarationArm,
  "qti-response-declaration": ResponseDeclarationArm,
};

/**
 * The statements over this module's relations: a declaration is named once per document and lies
 * on a node of that document's tree; it is typed or a record, each shape's row copying the
 * declaration's document and identifier where it keeps them; a response or outcome arm exists
 * exactly for a declaration of its kind; and no declaration takes a name the processing engine
 * sets itself.
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
    responseDeclaration: ResponseDeclarationId,
  }),
] as const;
