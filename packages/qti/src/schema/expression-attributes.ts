/**
 * The expression kinds that carry attributes: the variable reference with its test weight, the
 * constants and named operators, the bounded random kinds, the matchers, the test statistics, the
 * equality and rounding operators, the index and repeat operators, and the outcome bounds.
 *
 * An arm is keyed by `id`. A required attribute is a column of its arm; one stored as the
 * `whiteSpace`-processed value, so the pattern admits no padding. An optional attribute is a
 * relation of its own, keyed by `node`, that exists only when the source wrote it: the XSD
 * defaults `0` and `1` of `qti-random-integer`'s `min` and `step` are never written. A defaulted
 * boolean the source wrote is a marker relation. An attribute that is a number or a variable name
 * is kept as read, with its kind and the number where it is one, so a check can judge the number.
 * `qti-test-variables` shares its weight identifier relation with the outcome bounds, so that
 * relation is contained in `Expression` and either kind may own a row. The outcome bounds are one
 * relation under two thin arms.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute `qti-inside` names and the `shape` pattern of the patterns module; it is the region kind, not a structure. */
import {
  check,
  closed,
  closedId,
  contained,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as processing from "#qti/schema/processing.ts";

const ncName = str.regex(patterns.ncName);

const anyUri = str.regex(patterns.anyUri);

const baseType = str.regex(patterns.baseType);

const coords = str.regex(patterns.coords);

const floatOrVariableRef = str.regex(patterns.floatOrVariableRef);

const intOrIdentifier = str.regex(patterns.intOrIdentifier);

const integerOrVariableRef = str.regex(patterns.integerOrVariableRef);

const mathConstantName = str.regex(patterns.mathConstantName);

const mathOperatorName = str.regex(patterns.mathOperatorName);

const roundingMode = str.regex(patterns.roundingMode);

const shape = str.regex(patterns.shape);

const statsOperatorName = str.regex(patterns.statsOperatorName);

const toleranceList = str.regex(patterns.toleranceList);

const toleranceMode = str.regex(patterns.toleranceMode);

const xsBoolean = str.regex(patterns.xsBoolean);

const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

/**
 * The `qti-variable` expression; the variable it names is its `VariableRef` row.
 */
export const Variable = relation("Variable", { id: uuid }, ["id"]);

/**
 * The `weight-identifier` of a `qti-variable`, which only a test document may write; its root
 * kind is carried to be judged against.
 */
export const VariableWeightIdentifier = relation(
  "VariableWeightIdentifier",
  { node: uuid, rootKind: closedId(node.RootKind), value: ncName },
  ["node"],
);

/**
 * The `qti-math-constant` expression and the constant it names.
 */
export const MathConstant = relation("MathConstant", { id: uuid, name: mathConstantName }, ["id"]);

/**
 * The `qti-math-operator` expression and the function it names; its operands are `Operand` rows.
 */
export const MathOperator = relation("MathOperator", { id: uuid, name: mathOperatorName }, ["id"]);

/**
 * The `qti-stats-operator` expression and the statistic it names; its operand is an `Operand`
 * row.
 */
export const StatsOperator = relation("StatsOperator", { id: uuid, name: statsOperatorName }, [
  "id",
]);

/**
 * The `qti-any-n` operator with its two required bounds, each an integer or a variable name as
 * read; its operands are `Operand` rows.
 */
export const AnyN = relation(
  "AnyN",
  { id: uuid, max: integerOrVariableRef, min: integerOrVariableRef },
  ["id"],
);

/**
 * The `qti-random-integer` expression and its required upper bound.
 */
export const RandomInteger = relation("RandomInteger", { id: uuid, max: integerOrVariableRef }, [
  "id",
]);

/**
 * The `min` of a `qti-random-integer` whose source wrote it.
 */
export const RandomIntegerMin = relation(
  "RandomIntegerMin",
  { node: uuid, value: integerOrVariableRef },
  ["node"],
);

/**
 * The `step` of a `qti-random-integer` whose source wrote it.
 */
export const RandomIntegerStep = relation(
  "RandomIntegerStep",
  { node: uuid, value: integerOrVariableRef },
  ["node"],
);

/**
 * The `qti-random-float` expression and its required upper bound.
 */
export const RandomFloat = relation("RandomFloat", { id: uuid, max: floatOrVariableRef }, ["id"]);

/**
 * The `min` of a `qti-random-float` whose source wrote it.
 */
export const RandomFloatMin = relation(
  "RandomFloatMin",
  { node: uuid, value: floatOrVariableRef },
  ["node"],
);

/**
 * The `qti-field-value` operator and the record field it reads.
 */
export const FieldValue = relation("FieldValue", { fieldIdentifier: ncName, id: uuid }, ["id"]);

/**
 * The `qti-inside` operator: the region, as a shape and its coordinates.
 */
export const Inside = relation("Inside", { coords, id: uuid, shape }, ["id"]);

/**
 * The `qti-pattern-match` operator and its pattern, a string or a braced reference as read.
 */
export const PatternMatch = relation("PatternMatch", { id: uuid, pattern: xsString }, ["id"]);

/**
 * The `qti-substring` operator and its required `case-sensitive`.
 */
export const Substring = relation("Substring", { caseSensitive: xsBoolean, id: uuid }, ["id"]);

/**
 * The `qti-string-match` operator: `case-sensitive` is required, and `substring` is carried as read
 * with its default `false` where the source omitted it.
 */
export const StringMatch = relation(
  "StringMatch",
  { caseSensitive: xsBoolean, id: uuid, substring: xsBoolean },
  ["id"],
);

/**
 * The source wrote `substring` on this `qti-string-match`.
 */
export const DeclaredSubstring = relation("DeclaredSubstring", { node: uuid }, ["node"]);

/**
 * The `qti-custom-operator` expression; its operands are `Operand` rows.
 */
export const CustomOperator = relation("CustomOperator", { id: uuid }, ["id"]);

/**
 * The `class` of a `qti-custom-operator` whose source wrote it.
 */
export const CustomOperatorClass = relation("CustomOperatorClass", { node: uuid, value: ncName }, [
  "node",
]);

/**
 * The `definition` of a `qti-custom-operator` whose source wrote it.
 */
export const CustomOperatorDefinition = relation(
  "CustomOperatorDefinition",
  { node: uuid, value: anyUri },
  ["node"],
);

/**
 * The `qti-test-variables` expression and the outcome it totals.
 */
export const TestVariables = relation("TestVariables", { id: uuid, variableIdentifier: ncName }, [
  "id",
]);

/**
 * The `base-type` of a `qti-test-variables` whose source wrote it.
 */
export const TestVariablesBaseType = relation(
  "TestVariablesBaseType",
  { node: uuid, value: baseType },
  ["node"],
);

/**
 * The `weight-identifier` of an expression whose source wrote it; `qti-test-variables` and
 * `qti-outcome-minimum` and `qti-outcome-maximum` each may own a row.
 */
export const ExpressionWeightIdentifier = relation(
  "ExpressionWeightIdentifier",
  { node: uuid, value: ncName },
  ["node"],
);

/**
 * Whether an attribute that is a variable name or a number was read as the number: the typed copy
 * beside it is the number where this is `literal`, and `0` where this is `ref`.
 */
export const RefOrLiteral = closed("RefOrLiteral", ["literal", "ref"]);

/**
 * The `qti-equal` operator with its two interval bounds and its tolerance mode, each carried as
 * read with the XSD default where the source omitted it; the `Declared*` markers say which the
 * source wrote.
 */
export const Equal = relation(
  "Equal",
  {
    id: uuid,
    includeLowerBound: xsBoolean,
    includeUpperBound: xsBoolean,
    toleranceMode,
  },
  ["id"],
);

/**
 * The source wrote `tolerance-mode` on this `qti-equal`.
 */
export const DeclaredToleranceMode = relation("DeclaredToleranceMode", { node: uuid }, ["node"]);

/**
 * The source wrote `include-lower-bound` on this `qti-equal`.
 */
export const DeclaredIncludeLowerBound = relation("DeclaredIncludeLowerBound", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `include-upper-bound` on this `qti-equal`.
 */
export const DeclaredIncludeUpperBound = relation("DeclaredIncludeUpperBound", { node: uuid }, [
  "node",
]);

/**
 * The `tolerance` of a `qti-equal` whose source wrote it, with the mode the `qti-equal` carries.
 */
export const EqualTolerance = relation(
  "EqualTolerance",
  { node: uuid, toleranceMode, value: toleranceList },
  ["node"],
);

/**
 * The `qti-equal-rounded` operator: `figures` as read, whether it was a number or a variable name,
 * and the number where it was one.
 */
export const EqualRounded = relation(
  "EqualRounded",
  {
    figures: integerOrVariableRef,
    figuresKind: closedId(RefOrLiteral),
    figuresValue: pg.bigint,
    id: uuid,
    roundingMode,
  },
  ["id"],
);

/**
 * The source wrote `rounding-mode` on this `qti-equal-rounded`.
 */
export const DeclaredRoundingMode = relation("DeclaredRoundingMode", { node: uuid }, ["node"]);

/**
 * The `qti-round-to` operator, with the columns of `EqualRounded`; its `rounding-mode` is required.
 */
export const RoundTo = relation(
  "RoundTo",
  {
    figures: integerOrVariableRef,
    figuresKind: closedId(RefOrLiteral),
    figuresValue: pg.bigint,
    id: uuid,
    roundingMode,
  },
  ["id"],
);

/**
 * The `qti-index` operator: `n` as read, whether it was a number or a variable name, and the number
 * where it was one.
 */
export const Index = relation(
  "Index",
  { id: uuid, n: intOrIdentifier, nKind: closedId(RefOrLiteral), nValue: pg.bigint },
  ["id"],
);

/**
 * The `qti-repeat` operator: `number-repeats` as read, whether it was a number or a variable name,
 * and the number where it was one.
 */
export const Repeat = relation(
  "Repeat",
  {
    id: uuid,
    numberRepeats: intOrIdentifier,
    numberRepeatsKind: closedId(RefOrLiteral),
    numberRepeatsValue: pg.bigint,
  },
  ["id"],
);

/**
 * The outcome bound a `qti-outcome-minimum` or `qti-outcome-maximum` reads; `kind` is the node's
 * own, so the two thin arms below are contained in this one relation.
 */
export const OutcomeMinMax = relation(
  "OutcomeMinMax",
  { id: uuid, kind: closedId(node.NodeKind), outcomeIdentifier: ncName },
  ["id"],
);

/**
 * The `qti-outcome-minimum` expression.
 */
export const OutcomeMinimumArm = relation("OutcomeMinimumArm", { id: uuid }, ["id"]);

/**
 * The `qti-outcome-maximum` expression.
 */
export const OutcomeMaximumArm = relation("OutcomeMaximumArm", { id: uuid }, ["id"]);

/**
 * The attributed kinds of this module, each keyed by its `NodeKind` handle.
 */
export const arms = {
  "qti-any-n": AnyN,
  "qti-custom-operator": CustomOperator,
  "qti-equal": Equal,
  "qti-equal-rounded": EqualRounded,
  "qti-field-value": FieldValue,
  "qti-index": Index,
  "qti-inside": Inside,
  "qti-math-constant": MathConstant,
  "qti-math-operator": MathOperator,
  "qti-outcome-maximum": OutcomeMaximumArm,
  "qti-outcome-minimum": OutcomeMinimumArm,
  "qti-pattern-match": PatternMatch,
  "qti-random-float": RandomFloat,
  "qti-random-integer": RandomInteger,
  "qti-repeat": Repeat,
  "qti-round-to": RoundTo,
  "qti-stats-operator": StatsOperator,
  "qti-string-match": StringMatch,
  "qti-substring": Substring,
  "qti-test-variables": TestVariables,
  "qti-variable": Variable,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  AnyN,
  CustomOperator,
  CustomOperatorClass,
  CustomOperatorDefinition,
  DeclaredIncludeLowerBound,
  DeclaredIncludeUpperBound,
  DeclaredRoundingMode,
  DeclaredSubstring,
  DeclaredToleranceMode,
  Equal,
  EqualRounded,
  EqualTolerance,
  ExpressionWeightIdentifier,
  FieldValue,
  Index,
  Inside,
  MathConstant,
  MathOperator,
  OutcomeMaximumArm,
  OutcomeMinMax,
  OutcomeMinimumArm,
  PatternMatch,
  RandomFloat,
  RandomFloatMin,
  RandomInteger,
  RandomIntegerMin,
  RandomIntegerStep,
  RefOrLiteral,
  Repeat,
  RoundTo,
  StatsOperator,
  StringMatch,
  Substring,
  TestVariables,
  TestVariablesBaseType,
  Variable,
  VariableWeightIdentifier,
};

/**
 * The statements over this module's relations: every arm row is an expression, a variable
 * expression has its `VariableRef` row, each optional relation belongs to its arm, and a variable
 * weight exists only in a test document. The row check names the root kind as a literal, as the
 * processing module's does.
 */
export const rules = [
  contained(on(AnyN, "id"), on(processing.Expression, "id")),
  contained(on(CustomOperator, "id"), on(processing.Expression, "id")),
  contained(on(Equal, "id"), on(processing.Expression, "id")),
  contained(on(EqualRounded, "id"), on(processing.Expression, "id")),
  contained(on(FieldValue, "id"), on(processing.Expression, "id")),
  contained(on(Index, "id"), on(processing.Expression, "id")),
  contained(on(Inside, "id"), on(processing.Expression, "id")),
  contained(on(MathConstant, "id"), on(processing.Expression, "id")),
  contained(on(MathOperator, "id"), on(processing.Expression, "id")),
  contained(on(OutcomeMinMax, "id"), on(processing.Expression, "id")),
  contained(on(PatternMatch, "id"), on(processing.Expression, "id")),
  contained(on(RandomFloat, "id"), on(processing.Expression, "id")),
  contained(on(RandomInteger, "id"), on(processing.Expression, "id")),
  contained(on(Repeat, "id"), on(processing.Expression, "id")),
  contained(on(RoundTo, "id"), on(processing.Expression, "id")),
  contained(on(StatsOperator, "id"), on(processing.Expression, "id")),
  contained(on(StringMatch, "id"), on(processing.Expression, "id")),
  contained(on(Substring, "id"), on(processing.Expression, "id")),
  contained(on(TestVariables, "id"), on(processing.Expression, "id")),
  contained(on(Variable, "id"), on(processing.Expression, "id")),
  contained(on(Variable, "id"), on(processing.VariableRef, "id")),
  contained(on(VariableWeightIdentifier, "node"), on(Variable, "id")),
  contained(on(VariableWeightIdentifier, "node", "rootKind"), on(node.Node, "id", "rootKind")),
  check("VariableWeightInTest", VariableWeightIdentifier, (w) => w.eq(w.rootKind, "test")),
  contained(on(RandomIntegerMin, "node"), on(RandomInteger, "id")),
  contained(on(RandomIntegerStep, "node"), on(RandomInteger, "id")),
  contained(on(RandomFloatMin, "node"), on(RandomFloat, "id")),
  contained(on(DeclaredSubstring, "node"), on(StringMatch, "id")),
  contained(on(CustomOperatorClass, "node"), on(CustomOperator, "id")),
  contained(on(CustomOperatorDefinition, "node"), on(CustomOperator, "id")),
  contained(on(TestVariablesBaseType, "node"), on(TestVariables, "id")),
  contained(on(ExpressionWeightIdentifier, "node"), on(processing.Expression, "id")),
  contained(on(DeclaredToleranceMode, "node"), on(Equal, "id")),
  contained(on(DeclaredIncludeLowerBound, "node"), on(Equal, "id")),
  contained(on(DeclaredIncludeUpperBound, "node"), on(Equal, "id")),
  contained(on(EqualTolerance, "node", "toleranceMode"), on(Equal, "id", "toleranceMode")),
  contained(on(select(Equal, { toleranceMode: "absolute" }), "id"), on(EqualTolerance, "node")),
  contained(on(select(Equal, { toleranceMode: "relative" }), "id"), on(EqualTolerance, "node")),
  contained(on(DeclaredRoundingMode, "node"), on(EqualRounded, "id")),
  check("EqualRoundedFigures", EqualRounded, (e) =>
    e.or(
      e.eq(e.figuresKind, "ref"),
      e.and(e.eq(e.roundingMode, "significantFigures"), e.ge(e.figuresValue, 1n)),
      e.and(e.eq(e.roundingMode, "decimalPlaces"), e.ge(e.figuresValue, 0n)),
    ),
  ),
  check("RoundToFigures", RoundTo, (r) =>
    r.or(
      r.eq(r.figuresKind, "ref"),
      r.and(r.eq(r.roundingMode, "significantFigures"), r.ge(r.figuresValue, 1n)),
      r.and(r.eq(r.roundingMode, "decimalPlaces"), r.ge(r.figuresValue, 0n)),
    ),
  ),
  check("IndexPositive", Index, (i) => i.or(i.eq(i.nKind, "ref"), i.ge(i.nValue, 1n))),
  check("RepeatInt", Repeat, (r) =>
    r.or(
      r.eq(r.numberRepeatsKind, "ref"),
      r.and(
        r.ge(r.numberRepeatsValue, -2_147_483_648n),
        r.le(r.numberRepeatsValue, 2_147_483_647n),
      ),
    ),
  ),
  contained(on(OutcomeMinMax, "id", "kind"), on(node.Node, "id", "kind")),
  contained(on(OutcomeMinimumArm, "id"), on(OutcomeMinMax, "id")),
  contained(on(OutcomeMaximumArm, "id"), on(OutcomeMinMax, "id")),
] as const;
