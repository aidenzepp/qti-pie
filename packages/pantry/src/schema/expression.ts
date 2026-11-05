/**
 * The expression kinds that carry no attribute of their own: the operators, the four reference
 * leaves and the five outcome-only counters.
 *
 * Each is an arm keyed by `id` alone. An arm row is an expression; the reverse follows from the
 * `Node` alternatives the composed schema writes, so no per-arm `mirrors` is declared here.
 * `qti-base-value` is not a relation of this module: its arm is `Literal` of the processing
 * module.
 */
import { check, closedId, contained, on, relation, uuid } from "@bjornpagen/grizzle";
import { StructureHolder } from "#pantry/schema/content/rosters.ts";
import {
  CategoryList,
  SectionReference,
  TestStructureIdentifier,
} from "#pantry/schema/contracts.ts";
import { Node } from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import { TestDocument, TestReach } from "#pantry/schema/test/structure.ts";

/**
 * The `qti-and` operator; its operands are `Operand` rows.
 */
export const And = relation("And", { id: uuid }, ["id"]);

/**
 * The `qti-container-size` operator; its operands are `Operand` rows.
 */
export const ContainerSize = relation("ContainerSize", { id: uuid }, ["id"]);

/**
 * The `qti-contains` operator; its operands are `Operand` rows.
 */
export const Contains = relation("Contains", { id: uuid }, ["id"]);

/**
 * The `qti-correct` reference leaf; the variable it names is its `VariableRef` row.
 */
export const Correct = relation("Correct", { id: uuid }, ["id"]);

/**
 * The `qti-default` reference leaf; the variable it names is its `VariableRef` row.
 */
export const Default = relation("Default", { id: uuid }, ["id"]);

/**
 * The `qti-delete` operator; its operands are `Operand` rows.
 */
export const Delete = relation("Delete", { id: uuid }, ["id"]);

/**
 * The `qti-divide` operator; its operands are `Operand` rows.
 */
export const Divide = relation("Divide", { id: uuid }, ["id"]);

/**
 * The `qti-duration-gte` operator; its operands are `Operand` rows.
 */
export const DurationGte = relation("DurationGte", { id: uuid }, ["id"]);

/**
 * The `qti-duration-lt` operator; its operands are `Operand` rows.
 */
export const DurationLt = relation("DurationLt", { id: uuid }, ["id"]);

/**
 * The `qti-gcd` operator; its operands are `Operand` rows.
 */
export const Gcd = relation("Gcd", { id: uuid }, ["id"]);

/**
 * The `qti-gt` operator; its operands are `Operand` rows.
 */
export const Gt = relation("Gt", { id: uuid }, ["id"]);

/**
 * The `qti-gte` operator; its operands are `Operand` rows.
 */
export const Gte = relation("Gte", { id: uuid }, ["id"]);

/**
 * The `qti-integer-divide` operator; its operands are `Operand` rows.
 */
export const IntegerDivide = relation("IntegerDivide", { id: uuid }, ["id"]);

/**
 * The `qti-integer-modulus` operator; its operands are `Operand` rows.
 */
export const IntegerModulus = relation("IntegerModulus", { id: uuid }, ["id"]);

/**
 * The `qti-integer-to-float` operator; its operands are `Operand` rows.
 */
export const IntegerToFloat = relation("IntegerToFloat", { id: uuid }, ["id"]);

/**
 * The `qti-is-null` operator; its operands are `Operand` rows.
 */
export const IsNull = relation("IsNull", { id: uuid }, ["id"]);

/**
 * The `qti-lcm` operator; its operands are `Operand` rows.
 */
export const Lcm = relation("Lcm", { id: uuid }, ["id"]);

/**
 * The `qti-lt` operator; its operands are `Operand` rows.
 */
export const Lt = relation("Lt", { id: uuid }, ["id"]);

/**
 * The `qti-lte` operator; its operands are `Operand` rows.
 */
export const Lte = relation("Lte", { id: uuid }, ["id"]);

/**
 * The `qti-map-response` reference leaf; the variable it names is its `VariableRef` row.
 */
export const MapResponse = relation("MapResponse", { id: uuid }, ["id"]);

/**
 * The `qti-map-response-point` reference leaf; the variable it names is its `VariableRef` row.
 */
export const MapResponsePoint = relation("MapResponsePoint", { id: uuid }, ["id"]);

/**
 * The `qti-match` operator; its operands are `Operand` rows.
 */
export const Match = relation("Match", { id: uuid }, ["id"]);

/**
 * The `qti-max` operator; its operands are `Operand` rows.
 */
export const Max = relation("Max", { id: uuid }, ["id"]);

/**
 * The `qti-member` operator; its operands are `Operand` rows.
 */
export const Member = relation("Member", { id: uuid }, ["id"]);

/**
 * The `qti-min` operator; its operands are `Operand` rows.
 */
export const Min = relation("Min", { id: uuid }, ["id"]);

/**
 * The `qti-multiple` operator; its operands are `Operand` rows.
 */
export const Multiple = relation("Multiple", { id: uuid }, ["id"]);

/**
 * The `qti-not` operator; its operands are `Operand` rows.
 */
export const Not = relation("Not", { id: uuid }, ["id"]);

/**
 * The `qti-null` operator; its operands are `Operand` rows.
 */
export const Null = relation("Null", { id: uuid }, ["id"]);

/**
 * The `qti-number-correct` outcome-only count; its optional filters are the shared `Expression*`
 * relations.
 */
export const NumberCorrect = relation("NumberCorrect", { id: uuid }, ["id"]);

/**
 * The `qti-number-incorrect` outcome-only count; its optional filters are the shared `Expression*`
 * relations.
 */
export const NumberIncorrect = relation("NumberIncorrect", { id: uuid }, ["id"]);

/**
 * The `qti-number-presented` outcome-only count; its optional filters are the shared `Expression*`
 * relations.
 */
export const NumberPresented = relation("NumberPresented", { id: uuid }, ["id"]);

/**
 * The `qti-number-responded` outcome-only count; its optional filters are the shared `Expression*`
 * relations.
 */
export const NumberResponded = relation("NumberResponded", { id: uuid }, ["id"]);

/**
 * The `qti-number-selected` outcome-only count; its optional filters are the shared `Expression*`
 * relations.
 */
export const NumberSelected = relation("NumberSelected", { id: uuid }, ["id"]);

/**
 * The `qti-or` operator; its operands are `Operand` rows.
 */
export const Or = relation("Or", { id: uuid }, ["id"]);

/**
 * The `qti-ordered` operator; its operands are `Operand` rows.
 */
export const Ordered = relation("Ordered", { id: uuid }, ["id"]);

/**
 * The `qti-power` operator; its operands are `Operand` rows.
 */
export const Power = relation("Power", { id: uuid }, ["id"]);

/**
 * The `qti-product` operator; its operands are `Operand` rows.
 */
export const Product = relation("Product", { id: uuid }, ["id"]);

/**
 * The `qti-random` operator; its operands are `Operand` rows.
 */
export const Random = relation("Random", { id: uuid }, ["id"]);

/**
 * The `qti-round` operator; its operands are `Operand` rows.
 */
export const Round = relation("Round", { id: uuid }, ["id"]);

/**
 * The `qti-subtract` operator; its operands are `Operand` rows.
 */
export const Subtract = relation("Subtract", { id: uuid }, ["id"]);

/**
 * The `qti-sum` operator; its operands are `Operand` rows.
 */
export const Sum = relation("Sum", { id: uuid }, ["id"]);

/**
 * The `qti-truncate` operator; its operands are `Operand` rows.
 */
export const Truncate = relation("Truncate", { id: uuid }, ["id"]);

/**
 * The category identifiers an outcome-only counter excludes, as written and collapsed.
 */
export const ExpressionExcludeCategory = relation(
  "ExpressionExcludeCategory",
  { node: uuid, value: CategoryList },
  ["node"],
);

/**
 * The category identifiers an outcome-only counter includes, as written and collapsed.
 */
export const ExpressionIncludeCategory = relation(
  "ExpressionIncludeCategory",
  { node: uuid, value: CategoryList },
  ["node"],
);

/**
 * The section an outcome-only counter is restricted to, as written and collapsed.
 */
export const ExpressionSectionIdentifier = relation(
  "ExpressionSectionIdentifier",
  { node: uuid, value: SectionReference },
  ["node"],
);

/**
 * The structure node a section identifier names, once per test that reaches the expression's
 * document: the identifier as written and the kind of node that holds it.
 */
export const SectionIdentifierTarget = relation(
  "SectionIdentifierTarget",
  {
    document: uuid,
    holderKind: closedId(StructureHolder),
    identifier: TestStructureIdentifier,
    node: uuid,
    test: uuid,
  },
  ["node", "test"],
);

/**
 * The expression kinds' arms, keyed by `NodeKind` handle. `qti-base-value` is the constant arm,
 * `Literal` of the processing module. The containment of an arm into `Node` is not written here:
 * `alternatives(Node, "kind", NodeKind, ...)` in the composed schema expands to it.
 */
export const arms = {
  "qti-and": And,
  "qti-base-value": processing.Literal,
  "qti-container-size": ContainerSize,
  "qti-contains": Contains,
  "qti-correct": Correct,
  "qti-default": Default,
  "qti-delete": Delete,
  "qti-divide": Divide,
  "qti-duration-gte": DurationGte,
  "qti-duration-lt": DurationLt,
  "qti-gcd": Gcd,
  "qti-gt": Gt,
  "qti-gte": Gte,
  "qti-integer-divide": IntegerDivide,
  "qti-integer-modulus": IntegerModulus,
  "qti-integer-to-float": IntegerToFloat,
  "qti-is-null": IsNull,
  "qti-lcm": Lcm,
  "qti-lt": Lt,
  "qti-lte": Lte,
  "qti-map-response": MapResponse,
  "qti-map-response-point": MapResponsePoint,
  "qti-match": Match,
  "qti-max": Max,
  "qti-member": Member,
  "qti-min": Min,
  "qti-multiple": Multiple,
  "qti-not": Not,
  "qti-null": Null,
  "qti-number-correct": NumberCorrect,
  "qti-number-incorrect": NumberIncorrect,
  "qti-number-presented": NumberPresented,
  "qti-number-responded": NumberResponded,
  "qti-number-selected": NumberSelected,
  "qti-or": Or,
  "qti-ordered": Ordered,
  "qti-power": Power,
  "qti-product": Product,
  "qti-random": Random,
  "qti-round": Round,
  "qti-subtract": Subtract,
  "qti-sum": Sum,
  "qti-truncate": Truncate,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  And,
  ContainerSize,
  Contains,
  Correct,
  Default,
  Delete,
  Divide,
  DurationGte,
  DurationLt,
  ExpressionExcludeCategory,
  ExpressionIncludeCategory,
  ExpressionSectionIdentifier,
  Gcd,
  Gt,
  Gte,
  IntegerDivide,
  IntegerModulus,
  IntegerToFloat,
  IsNull,
  Lcm,
  Lt,
  Lte,
  MapResponse,
  MapResponsePoint,
  Match,
  Max,
  Member,
  Min,
  Multiple,
  Not,
  Null,
  NumberCorrect,
  NumberIncorrect,
  NumberPresented,
  NumberResponded,
  NumberSelected,
  Or,
  Ordered,
  Power,
  Product,
  Random,
  Round,
  SectionIdentifierTarget,
  Subtract,
  Sum,
  Truncate,
};

/**
 * The statements over this module's relations: every arm row is an expression, an outcome-only
 * counter's filter belongs to an expression, a reference leaf has its `VariableRef` row, and a
 * section identifier target names a node of its document, a document its test reaches and an
 * identifier its test reaches held by a section or a section reference.
 *
 * The containment of `ExpressionSectionIdentifier` into the target is not written here: grizzle
 * refuses a containment between two contracts while `value` is `SectionReference`, so it comes
 * with the retype of that column.
 */
export const rules = [
  contained(on(And, "id"), on(processing.Expression, "id")),
  contained(on(ContainerSize, "id"), on(processing.Expression, "id")),
  contained(on(Contains, "id"), on(processing.Expression, "id")),
  contained(on(Correct, "id"), on(processing.Expression, "id")),
  contained(on(Default, "id"), on(processing.Expression, "id")),
  contained(on(Delete, "id"), on(processing.Expression, "id")),
  contained(on(Divide, "id"), on(processing.Expression, "id")),
  contained(on(DurationGte, "id"), on(processing.Expression, "id")),
  contained(on(DurationLt, "id"), on(processing.Expression, "id")),
  contained(on(Gcd, "id"), on(processing.Expression, "id")),
  contained(on(Gt, "id"), on(processing.Expression, "id")),
  contained(on(Gte, "id"), on(processing.Expression, "id")),
  contained(on(IntegerDivide, "id"), on(processing.Expression, "id")),
  contained(on(IntegerModulus, "id"), on(processing.Expression, "id")),
  contained(on(IntegerToFloat, "id"), on(processing.Expression, "id")),
  contained(on(IsNull, "id"), on(processing.Expression, "id")),
  contained(on(Lcm, "id"), on(processing.Expression, "id")),
  contained(on(Lt, "id"), on(processing.Expression, "id")),
  contained(on(Lte, "id"), on(processing.Expression, "id")),
  contained(on(MapResponse, "id"), on(processing.Expression, "id")),
  contained(on(MapResponsePoint, "id"), on(processing.Expression, "id")),
  contained(on(Match, "id"), on(processing.Expression, "id")),
  contained(on(Max, "id"), on(processing.Expression, "id")),
  contained(on(Member, "id"), on(processing.Expression, "id")),
  contained(on(Min, "id"), on(processing.Expression, "id")),
  contained(on(Multiple, "id"), on(processing.Expression, "id")),
  contained(on(Not, "id"), on(processing.Expression, "id")),
  contained(on(Null, "id"), on(processing.Expression, "id")),
  contained(on(NumberCorrect, "id"), on(processing.Expression, "id")),
  contained(on(NumberIncorrect, "id"), on(processing.Expression, "id")),
  contained(on(NumberPresented, "id"), on(processing.Expression, "id")),
  contained(on(NumberResponded, "id"), on(processing.Expression, "id")),
  contained(on(NumberSelected, "id"), on(processing.Expression, "id")),
  contained(on(Or, "id"), on(processing.Expression, "id")),
  contained(on(Ordered, "id"), on(processing.Expression, "id")),
  contained(on(Power, "id"), on(processing.Expression, "id")),
  contained(on(Product, "id"), on(processing.Expression, "id")),
  contained(on(Random, "id"), on(processing.Expression, "id")),
  contained(on(Round, "id"), on(processing.Expression, "id")),
  contained(on(Subtract, "id"), on(processing.Expression, "id")),
  contained(on(Sum, "id"), on(processing.Expression, "id")),
  contained(on(Truncate, "id"), on(processing.Expression, "id")),
  contained(on(ExpressionExcludeCategory, "node"), on(processing.Expression, "id")),
  contained(on(ExpressionIncludeCategory, "node"), on(processing.Expression, "id")),
  contained(on(ExpressionSectionIdentifier, "node"), on(processing.Expression, "id")),
  contained(on(Default, "id"), on(processing.VariableRef, "id")),
  contained(on(Correct, "id"), on(processing.VariableRef, "id")),
  contained(on(MapResponse, "id"), on(processing.VariableRef, "id")),
  contained(on(MapResponsePoint, "id"), on(processing.VariableRef, "id")),
  contained(on(SectionIdentifierTarget, "node", "document"), on(Node, "id", "tree")),
  contained(on(SectionIdentifierTarget, "test", "document"), on(TestDocument, "test", "document")),
  contained(
    on(SectionIdentifierTarget, "test", "identifier", "holderKind"),
    on(TestReach, "test", "identifier", "holderKind"),
  ),
  check("SectionIdentifierTargetHolderKind", SectionIdentifierTarget, (row) =>
    row.or(row.eq(row.holderKind, "section"), row.eq(row.holderKind, "sectionRef")),
  ),
] as const;
