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
  capacity,
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  ref,
  relation,
  select,
  str,
  uuid,
  within,
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
 * Whether an expression kind has an upper bound on its operands.
 */
export const ArityBound = closed("ArityBound", ["bounded", "unbounded"]);

/**
 * A node of an expression kind, in the document that holds it. `min` and `bounded` copy the
 * seeded arity of its kind, so the operand capacities can read them.
 */
export const Expression = relation(
  "Expression",
  {
    bounded: closedId(ArityBound),
    document: uuid,
    id: uuid,
    kind: closedId(node.NodeKind),
    min: pg.bigint,
  },
  ["id"],
);

/**
 * The most operands a bounded expression admits, a copy of its kind's `OperatorArityMax` row. An
 * unbounded expression has no row.
 */
export const ExpressionMax = relation(
  "ExpressionMax",
  { id: uuid, kind: closedId(node.NodeKind), max: pg.bigint },
  ["id"],
);

/**
 * The fewest operands an expression kind admits. Seeded by a custom migration and read-only to
 * every role.
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
 * The expression kinds with no upper bound on their operands. Seeded and read-only like
 * `OperatorArity`; it and `OperatorArityMax` partition the kinds of `OperatorArity`.
 */
export const OperatorArityUnbounded = relation(
  "OperatorArityUnbounded",
  { kind: closedId(node.NodeKind) },
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
  "templateParameter",
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
 * A reference to a variable the document declares, with the kind of node that refers and the kind
 * of declaration it names.
 */
export const DeclaredRef = relation(
  "DeclaredRef",
  {
    declarationKind: closedId(declaration.DeclarationKind),
    document: uuid,
    id: uuid,
    identifier: ncName,
    referrerKind: closedId(node.NodeKind),
  },
  ["id"],
);

/**
 * A reference to a built-in variable, with the kind of node that refers.
 */
export const BuiltInRef = relation(
  "BuiltInRef",
  { id: uuid, name: closedId(BuiltIn), referrerKind: closedId(node.NodeKind) },
  ["id"],
);

/**
 * A reference inside a response-processing template document, whose names resolve to nothing in
 * the document itself: the identifier as written, with the kind of node that refers and the root
 * kind of its tree.
 */
export const TemplateParameterRef = relation(
  "TemplateParameterRef",
  {
    document: uuid,
    id: uuid,
    identifier: ncName,
    referrerKind: closedId(node.NodeKind),
    rootKind: closedId(node.RootKind),
  },
  ["id"],
);

/**
 * The response processing kind's arm, keyed by its `NodeKind` handle.
 *
 * `ResponseProcessingItem` is a companion row, not an arm. The containment of the arm into `Node`
 * is not written here: `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands
 * to it.
 */
export const arms = {
  "qti-response-processing": ResponseProcessing,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  ArityBound,
  BuiltIn,
  BuiltInRef,
  DeclaredRef,
  Expression,
  ExpressionMax,
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
  OperatorArityUnbounded,
  RefKind,
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplate,
  StandardTemplateReference,
  TemplateParameterRef,
  VariableRef,
};

/**
 * The statements over this module's relations: a processing node is item- or template-rooted; an
 * item-rooted one and its item row name each other, and the row hangs under its item by an edge; a
 * template-rooted one is the root of its tree; the template attributes belong to a processing
 * node, and a standard template reference to a written `template`. An expression is a node of
 * its document's tree, a literal is an expression with an arm per base type, and an operand hangs
 * from its expression at a position and from the same edge in the tree. An expression copies its
 * kind's seeded arity: the lower bound is a capacity over `min`, the upper bound a capacity over
 * `ExpressionMax`, which every bounded expression has and no unbounded one can. A variable
 * reference is a node of its document's tree with a declared, a built-in or a template-parameter
 * arm, each naming the kind of node that refers.
 *
 * The row checks name root kinds and node kinds as literals: `RootKind.handle("item")` is typed
 * exactly `"item"`, and a comparison against a `closedId` field takes the field's own type, so the
 * handle term is refused there. The declared and built-in checks list the allowed pairs and
 * refuse every other referring kind, so they are also the check that the kind is one of the ten
 * that refer; the template-parameter arm has a check of its own for that.
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
  contained(on(Expression, "kind", "min"), on(OperatorArity, "kind", "min")),
  contained(on(select(Expression, { bounded: "bounded" }), "kind"), on(OperatorArityMax, "kind")),
  contained(
    on(select(Expression, { bounded: "unbounded" }), "kind"),
    on(OperatorArityUnbounded, "kind"),
  ),
  contained(on(ExpressionMax, "id", "kind"), on(Expression, "id", "kind")),
  contained(on(ExpressionMax, "kind", "max"), on(OperatorArityMax, "kind", "max")),
  contained(
    on(select(Expression, { bounded: "bounded" }), "id", "kind"),
    on(ExpressionMax, "id", "kind"),
  ),
  capacity(on(Expression, "id"), {
    from: on(Operand, "expression"),
    within: within(ref("min"), "*"),
  }),
  capacity(on(ExpressionMax, "id"), {
    from: on(Operand, "expression"),
    within: within(0n, ref("max")),
  }),
  contained(on(Literal, "id"), on(Expression, "id")),
  alternatives(Literal, "baseType", declaration.BaseType, literalArms),
  key(Operand, ["child"]),
  contained(on(Operand, "expression"), on(Expression, "id")),
  contained(on(Operand, "child"), on(Expression, "id")),
  contained(
    on(Operand, "child", "expression", "position"),
    on(node.Edge, "child", "parent", "position"),
  ),
  contained(on(VariableRef, "id", "document"), on(node.Node, "id", "tree")),
  alternatives(VariableRef, "kind", RefKind, {
    builtIn: BuiltInRef,
    declared: DeclaredRef,
    templateParameter: TemplateParameterRef,
  }),
  contained(
    on(DeclaredRef, "document", "identifier", "declarationKind"),
    on(declaration.Declaration, "document", "identifier", "kind"),
  ),
  contained(on(DeclaredRef, "id", "referrerKind"), on(node.Node, "id", "kind")),
  check("DeclaredRefKind", DeclaredRef, (r) =>
    r.or(
      r.in(r.referrerKind, ["qti-variable", "qti-default"]),
      r.and(
        r.in(r.referrerKind, [
          "qti-correct",
          "qti-map-response",
          "qti-map-response-point",
          "qti-set-correct-response",
        ]),
        r.eq(r.declarationKind, "response"),
      ),
      r.and(
        r.in(r.referrerKind, ["qti-set-outcome-value", "qti-lookup-outcome-value"]),
        r.eq(r.declarationKind, "outcome"),
      ),
      r.and(r.eq(r.referrerKind, "qti-set-template-value"), r.eq(r.declarationKind, "template")),
      r.and(
        r.eq(r.referrerKind, "qti-set-default-value"),
        r.in(r.declarationKind, ["response", "outcome"]),
      ),
    ),
  ),
  contained(on(BuiltInRef, "id", "referrerKind"), on(node.Node, "id", "kind")),
  check("BuiltInRefKind", BuiltInRef, (r) =>
    r.or(
      r.in(r.referrerKind, ["qti-variable", "qti-default"]),
      r.and(r.eq(r.referrerKind, "qti-set-outcome-value"), r.eq(r.name, "completionStatus")),
    ),
  ),
  contained(on(TemplateParameterRef, "id", "rootKind"), on(node.Node, "id", "rootKind")),
  contained(on(TemplateParameterRef, "id", "document"), on(node.Node, "id", "tree")),
  contained(on(TemplateParameterRef, "id", "referrerKind"), on(node.Node, "id", "kind")),
  check("TemplateParameterRoot", TemplateParameterRef, (r) => r.eq(r.rootKind, "rptemplate")),
  check("TemplateParameterReferrer", TemplateParameterRef, (r) =>
    r.in(r.referrerKind, [
      "qti-variable",
      "qti-default",
      "qti-correct",
      "qti-map-response",
      "qti-map-response-point",
      "qti-set-outcome-value",
      "qti-lookup-outcome-value",
      "qti-set-template-value",
      "qti-set-default-value",
      "qti-set-correct-response",
    ]),
  ),
] as const;
