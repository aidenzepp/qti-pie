/**
 * Response processing: the `qti-response-processing` node, the item it belongs to, and the
 * standard template a document may name.
 *
 * A processing node is rooted in an item or in a response-processing template. An item-rooted node
 * has a `ResponseProcessingItem` row naming its item, and a template-rooted node is the root of
 * its tree. A `template` or `templateLocation` URI is kept as written and never fetched; a
 * `StandardTemplateReference` exists only where the `template` URI named one of the published
 * templates.
 *
 * Expressions are nodes keyed by `NodeKind`: an expression, its operands, its literals and the
 * variable references it holds. The operator-arity tables are seeded by a custom migration.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` is the roster the declaration module names; this module reads it only through the value arms. */
import {
  alternatives,
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import * as declaration from "#qti/schema/declaration.ts";
import * as item from "#qti/schema/item.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as value from "#qti/schema/value.ts";

const ncName = str.regex(patterns.ncName);

/**
 * The response-processing templates 1EdTech publishes.
 */
export const StandardTemplate = closed("StandardTemplate", [
  "match_correct",
  "map_response",
  "map_response_point",
  "CC2_match",
  "CC2_match_basic",
  "CC2_map_response",
]);

/**
 * A `qti-response-processing` node, with the root kind of its tree.
 */
export const ResponseProcessing = relation(
  "ResponseProcessing",
  { id: uuid, rootKind: closedId(node.RootKind) },
  ["id"],
);

/**
 * The item an item-rooted response processing belongs to; an item has at most one.
 */
export const ResponseProcessingItem = relation("ResponseProcessingItem", { id: uuid, item: uuid }, [
  "id",
]);

/**
 * A response processing's `template` attribute, as written and collapsed.
 */
export const ResponseProcessingTemplate = relation(
  "ResponseProcessingTemplate",
  { node: uuid, uri: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * A response processing's `template-location` attribute, as written and collapsed.
 */
export const ResponseProcessingTemplateLocation = relation(
  "ResponseProcessingTemplateLocation",
  { node: uuid, uri: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * The published template a response processing's `template` URI names.
 */
export const StandardTemplateReference = relation(
  "StandardTemplateReference",
  { node: uuid, template: closedId(StandardTemplate) },
  ["node"],
);

/**
 * A node of an expression kind, in the document that holds it.
 */
export const Expression = relation(
  "Expression",
  { document: uuid, id: uuid, kind: closedId(node.NodeKind) },
  ["id"],
);

/**
 * The fewest operands an expression kind admits. Seeded by a custom migration and read-only to
 * every role; empty until phase 3 appends the expression kinds.
 */
export const OperatorArity = relation(
  "OperatorArity",
  { kind: closedId(node.NodeKind), min: pg.bigint },
  ["kind"],
);

/**
 * The most operands an expression kind admits; a kind with no upper bound has no row. Seeded and
 * read-only like `OperatorArity`.
 */
export const OperatorArityMax = relation(
  "OperatorArityMax",
  { kind: closedId(node.NodeKind), max: pg.bigint },
  ["kind"],
);

/**
 * An expression that is a constant of one base type. Its value is an arm of the base type.
 */
export const Literal = relation("Literal", { baseType: closedId(declaration.BaseType), id: uuid }, [
  "id",
]);

const literalArms = value.valueArms("Literal");

/**
 * An expression held at a position under another expression.
 */
export const Operand = relation("Operand", { child: uuid, expression: uuid, position: pg.bigint }, [
  "expression",
  "position",
]);

/**
 * The ways a variable reference names its variable.
 */
export const RefKind = closed("RefKind", [
  "declared",
  "builtIn",
  "itemVariable",
  "itemInstanceVariable",
  "sectionDuration",
]);

/**
 * The variables the processing engine provides.
 */
export const BuiltIn = closed("BuiltIn", [
  "completionStatus",
  "numAttempts",
  "duration",
  "QTI_CONTEXT",
]);

/**
 * A reference to a variable, by one of the ways `RefKind` lists.
 */
export const VariableRef = relation(
  "VariableRef",
  { document: uuid, id: uuid, kind: closedId(RefKind) },
  ["id"],
);

/**
 * A reference to a variable the document declares.
 */
export const DeclaredRef = relation(
  "DeclaredRef",
  { document: uuid, id: uuid, identifier: ncName },
  ["id"],
);

/**
 * A reference to a built-in variable.
 */
export const BuiltInRef = relation("BuiltInRef", { id: uuid, name: closedId(BuiltIn) }, ["id"]);

/**
 * The response processing kind's arm, keyed by its `NodeKind` handle.
 *
 * `ResponseProcessingItem` is a companion row, not an arm. The containment of the arm into `Node`
 * is not written here: one `mirrors` per handle in the composed schema (`#qti/schema/qti.ts`)
 * binds it.
 */
export const arms = {
  "qti-response-processing": ResponseProcessing,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  BuiltIn,
  BuiltInRef,
  DeclaredRef,
  Expression,
  Literal,
  LiteralBoolean: literalArms.boolean,
  LiteralDirectedPair: literalArms.directedPair,
  LiteralDuration: literalArms.duration,
  LiteralFile: literalArms.file,
  LiteralFloat: literalArms.float,
  LiteralIdentifier: literalArms.identifier,
  LiteralInteger: literalArms.integer,
  LiteralPair: literalArms.pair,
  LiteralPoint: literalArms.point,
  LiteralString: literalArms.string,
  LiteralUri: literalArms.uri,
  Operand,
  OperatorArity,
  OperatorArityMax,
  RefKind,
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplate,
  StandardTemplateReference,
  VariableRef,
};

/**
 * The statements over this module's relations: a processing node is item- or template-rooted; an
 * item-rooted one and its item row name each other, and the row hangs under its item by an edge; a
 * template-rooted one is the root of its tree; the template attributes belong to a processing
 * node, and a standard template reference to a written `template`. An expression is a node of
 * its document's tree, a literal is an expression with an arm per base type, an operand hangs
 * from its expression at a position, and a variable reference is a node of its document's tree
 * with a declared or a built-in arm.
 *
 * The row check names the root kinds as literals: `RootKind.handle("item")` is typed exactly
 * `"item"`, and a comparison against a `closedId` field takes the field's own type, so the handle
 * term is refused there.
 */
export const rules = [
  contained(on(ResponseProcessing, "id", "rootKind"), on(node.Node, "id", "rootKind")),
  check("ProcessingRoot", ResponseProcessing, (r) =>
    r.or(r.eq(r.rootKind, "item"), r.eq(r.rootKind, "rptemplate")),
  ),
  key(ResponseProcessingItem, ["item"]),
  contained(on(ResponseProcessingItem, "id", "item"), on(node.Edge, "child", "parent")),
  contained(on(ResponseProcessingItem, "item"), on(item.AssessmentItem, "id")),
  mirrors(
    on(select(ResponseProcessing, { rootKind: "item" }), "id"),
    on(ResponseProcessingItem, "id"),
  ),
  contained(
    on(select(ResponseProcessing, { rootKind: "rptemplate" }), "id"),
    on(node.TreeRoot, "node"),
  ),
  contained(on(ResponseProcessingTemplate, "node"), on(ResponseProcessing, "id")),
  contained(on(ResponseProcessingTemplateLocation, "node"), on(ResponseProcessing, "id")),
  contained(on(StandardTemplateReference, "node"), on(ResponseProcessingTemplate, "node")),
  contained(on(Expression, "id", "document", "kind"), on(node.Node, "id", "tree", "kind")),
  contained(on(Literal, "id"), on(Expression, "id")),
  alternatives(Literal, "baseType", declaration.BaseType, literalArms),
  key(Operand, ["child"]),
  contained(on(Operand, "expression"), on(Expression, "id")),
  contained(on(Operand, "child"), on(Expression, "id")),
  contained(on(VariableRef, "id", "document"), on(node.Node, "id", "tree")),
  alternatives(VariableRef, "kind", RefKind, { builtIn: BuiltInRef, declared: DeclaredRef }),
  contained(
    on(DeclaredRef, "document", "identifier"),
    on(declaration.Declaration, "document", "identifier"),
  ),
] as const;
