/**
 * The evaluator: phase 1's engine subset (spec §4.12) run over an item's rule tree, as pure
 * functions of the item and the variables of one attempt.
 *
 * {@link runRules} runs response rules in order, and {@link evaluateExpression} gives the value of
 * one expression. They take rules the item model ({@link Item}) built and variables that hold a
 * value for every modelled declaration, as the session record does. A rule that names an identifier
 * outside them, sets an outcome to a value of another type, or holds an expression this evaluator
 * does not run is a defect in what the caller passed, thrown as {@link UnknownIdentifierError},
 * {@link OutcomeMismatchError} or {@link UnevaluatedExpressionError}.
 *
 * @module
 */
import { Option } from "effect";
import type { Expression, Item, ResponseDeclaration, Rule } from "#plate/model/item.ts";
import { isNull, match, nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * The variables of one attempt: each response and each outcome by identifier.
 *
 * Responses and outcomes share one identifier space, because declaration identifiers are unique
 * together, so a `qti-variable` names at most one of them.
 */
export interface Variables {
  readonly outcomes: Readonly<Record<string, Value>>;
  readonly responses: Readonly<Record<string, Value>>;
}

/**
 * The defect of a rule tree that names an identifier the item or the variables do not hold in the
 * role the rule reads it in: a variable with no value, a `qti-correct` of no response, or a
 * `qti-set-outcome-value` of no outcome.
 *
 * In a valid item every identifier a rule names is declared, and the record holds a value for every
 * modelled declaration, so the evaluator, which returns a value and has no error channel, throws
 * it.
 */
export class UnknownIdentifierError extends Error {
  /**
   * The identifier the rule names.
   */
  readonly identifier: string;

  /**
   * What the rule reads the identifier as.
   */
  readonly role: "outcome" | "response" | "variable";

  /**
   * Construct the defect for `identifier` read as `role`.
   *
   * @param identifier The identifier the rule names.
   * @param role What the rule reads it as.
   */
  constructor(identifier: string, role: "outcome" | "response" | "variable") {
    super(
      `The rules read ${JSON.stringify(identifier)} as a ${role}, and the item holds no ${role} by that name: run rules built from this item, with the variables its record holds.`,
    );
    this.name = "UnknownIdentifierError";
    this.identifier = identifier;
    this.role = role;
  }
}

/**
 * The defect of a `qti-set-outcome-value` whose expression's base type or cardinality differs from
 * the outcome's declaration.
 *
 * QTI assigns without conversion: "floating point values can not be assigned to integer variables
 * and vice-versa", and the expression's type must match the target's. A NULL keeps the type of the
 * expression that gave it, so it is checked the same way. The engine stores no value of another
 * type, so the record always holds each outcome at its declared type.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_SetValue
 */
export class OutcomeMismatchError extends Error {
  /**
   * The base type and cardinality the expression gave.
   */
  readonly actual: string;

  /**
   * The base type and cardinality the outcome is declared with.
   */
  readonly expected: string;

  /**
   * The outcome's identifier.
   */
  readonly identifier: string;

  /**
   * Construct the defect for the outcome `identifier`.
   *
   * @param identifier The outcome's identifier.
   * @param expected Its declared base type and cardinality.
   * @param actual The expression's base type and cardinality.
   */
  constructor(identifier: string, expected: string, actual: string) {
    super(
      `The rules set ${JSON.stringify(identifier)}, declared ${expected}, to a ${actual} value: give its qti-set-outcome-value an expression of base type and cardinality ${expected}.`,
    );
    this.name = "OutcomeMismatchError";
    this.identifier = identifier;
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * The defect of an expression kind the item model admits and this evaluator does not run yet.
 *
 * The item model marks every element outside the engine unsupported and builds no rules for it,
 * so only a kind of its {@link Expression} union can reach here.
 */
export class UnevaluatedExpressionError extends Error {
  /**
   * The expression's kind.
   */
  readonly kind: string;

  /**
   * Construct the defect for the expression kind `kind`.
   *
   * @param kind The expression's kind.
   */
  constructor(kind: string) {
    super(
      `The engine does not evaluate ${kind} expressions: build rules that use only match, variable, correct, base-value and is-null.`,
    );
    this.name = "UnevaluatedExpressionError";
    this.kind = kind;
  }
}

/**
 * Look up a variable by identifier among the record's own keys.
 *
 * The variables come from plain objects, which inherit `Object.prototype`, and `constructor` or
 * `toString` is a valid identifier; reading only own keys keeps an inherited member from being
 * read as a value.
 *
 * @param values The responses or the outcomes.
 * @param identifier The identifier.
 * @returns The value, or none when the record holds no value by that name.
 */
const own = (values: Readonly<Record<string, Value>>, identifier: string): Option.Option<Value> =>
  Object.hasOwn(values, identifier) ? Option.fromUndefinedOr(values[identifier]) : Option.none();

/**
 * Give the value of a `qti-variable`: the response or the outcome of that identifier.
 *
 * @param variables The variables of the attempt.
 * @param identifier The variable's identifier.
 * @returns Its current value.
 * @throws {UnknownIdentifierError} When neither the responses nor the outcomes hold it.
 */
const variableValue = (variables: Variables, identifier: string): Value =>
  Option.getOrThrowWith(
    Option.orElse(own(variables.responses, identifier), () => own(variables.outcomes, identifier)),
    () => new UnknownIdentifierError(identifier, "variable"),
  );

/**
 * Find the response declaration a `qti-correct` names.
 *
 * @param item The item.
 * @param identifier The response's identifier.
 * @returns The declaration.
 * @throws {UnknownIdentifierError} When the item declares no modelled response by that name.
 */
const responseOf = (item: Item, identifier: string): ResponseDeclaration =>
  Option.getOrThrowWith(
    Option.fromUndefinedOr(item.responses.get(identifier)),
    () => new UnknownIdentifierError(identifier, "response"),
  );

/**
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value.
 */
const booleanOf = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * Report whether a condition's value is true.
 *
 * A response condition runs a branch only on a single boolean `true`: false or NULL counts as not
 * true, and so does a value of any other type.
 *
 * @param value The condition's value.
 * @returns Whether it is the single boolean `true`.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_ResponseCondition
 */
const isTrue = (value: Value): boolean => {
  const [single] = value.values;

  return value.cardinality === "single" && single?.baseType === "boolean" && single.value;
};

/**
 * Give the value of an expression of phase 1's engine subset.
 *
 * - `variable`: the response's or the outcome's current value.
 * - `correct`: the response's correct response, else NULL of its declared type.
 * - `base-value`: the value as the item model parsed it.
 * - `is-null`: a single boolean, whether the operand is NULL.
 * - `match`: a single boolean, whether the operands match by `match` of the value model; NULL when
 *   either is NULL.
 *
 * @param expression The expression.
 * @param item The item, whose declarations give the correct responses.
 * @param variables The variables of the attempt.
 * @returns The expression's value.
 * @throws {UnknownIdentifierError} When the expression names a variable or response that is not
 *   held.
 * @throws {UnevaluatedExpressionError} For a `map-response`, which this evaluator does not run.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIsNull
 */
export const evaluateExpression = (
  expression: Expression,
  item: Item,
  variables: Variables,
): Value => {
  if (expression.kind === "variable") {
    return variableValue(variables, expression.identifier);
  }

  if (expression.kind === "correct") {
    const declaration = responseOf(item, expression.identifier);

    return Option.getOrElse(declaration.correct, () =>
      nullOf(declaration.baseType, declaration.cardinality),
    );
  }

  if (expression.kind === "base-value") {
    return expression.value;
  }

  if (expression.kind === "is-null") {
    return booleanOf(isNull(evaluateExpression(expression.operand, item, variables)));
  }

  if (expression.kind === "match") {
    const [left, right] = expression.operands;
    const leftValue = evaluateExpression(left, item, variables);
    const rightValue = evaluateExpression(right, item, variables);

    return isNull(leftValue) || isNull(rightValue)
      ? nullOf("boolean", "single")
      : booleanOf(match(leftValue, rightValue));
  }

  throw new UnevaluatedExpressionError(expression.kind);
};

/**
 * Set an outcome, as `qti-set-outcome-value` does.
 *
 * @param item The item, whose declaration gives the outcome's type.
 * @param variables The variables before the rule.
 * @param identifier The outcome's identifier.
 * @param value The expression's value.
 * @returns The variables with the outcome set and everything else as it was.
 * @throws {UnknownIdentifierError} When the item declares no modelled outcome by that name.
 * @throws {OutcomeMismatchError} When the value's base type or cardinality differs from the
 *   outcome's.
 */
const setOutcome = (
  item: Item,
  variables: Variables,
  identifier: string,
  value: Value,
): Variables => {
  const declaration = Option.getOrThrowWith(
    Option.fromUndefinedOr(item.outcomes.get(identifier)),
    () => new UnknownIdentifierError(identifier, "outcome"),
  );
  if (value.baseType !== declaration.baseType || value.cardinality !== declaration.cardinality) {
    throw new OutcomeMismatchError(
      identifier,
      `${declaration.baseType} ${declaration.cardinality}`,
      `${value.baseType} ${value.cardinality}`,
    );
  }

  return { ...variables, outcomes: { ...variables.outcomes, [identifier]: value } };
};

/**
 * Run one response rule.
 *
 * A condition runs the rules of its first branch whose condition is true, else its `otherwise`,
 * else nothing; the conditions after the chosen branch are not evaluated.
 *
 * @param rule The rule.
 * @param item The item.
 * @param variables The variables before the rule.
 * @returns The variables after it.
 */
const runRule = (rule: Rule, item: Item, variables: Variables): Variables => {
  if (rule.kind === "set-outcome") {
    return setOutcome(
      item,
      variables,
      rule.identifier,
      evaluateExpression(rule.expression, item, variables),
    );
  }

  const chosen = rule.branches.find((branch) =>
    isTrue(evaluateExpression(branch.when, item, variables)),
  );
  const then = chosen === undefined ? Option.getOrElse(rule.otherwise, () => []) : chosen.then;

  // oxlint-disable-next-line eslint/no-use-before-define -- `runRule` and `runRules` are mutually recursive, as conditions nest; the call runs only after both are defined.
  return runRules(then, item, variables);
};

/**
 * Run response rules in order, each seeing the variables the rules before it left.
 *
 * Only outcomes change; the responses are returned as given.
 *
 * @param rules The rules, as the item model built them.
 * @param item The item they belong to.
 * @param variables The variables before the rules run.
 * @returns The variables after the last rule.
 * @throws {UnknownIdentifierError} When a rule names an identifier the item or the variables do not
 *   hold in the role the rule reads it in.
 * @throws {OutcomeMismatchError} When a rule sets an outcome to a value of another type.
 * @throws {UnevaluatedExpressionError} When a rule holds an expression this evaluator does not run.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Root_ResponseProcessing
 */
export const runRules = (rules: readonly Rule[], item: Item, variables: Variables): Variables => {
  let current = variables;
  for (const rule of rules) {
    current = runRule(rule, item, current);
  }

  return current;
};
