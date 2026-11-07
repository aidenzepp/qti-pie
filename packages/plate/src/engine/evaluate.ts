/**
 * The evaluator: the response rules and the registry's landed expression kinds run over an item's
 * rule tree, as pure functions of the item and the variables of one attempt.
 *
 * {@link runRules} runs response rules in order, and {@link evaluateExpression} gives the value of
 * one expression. They take rules the item model ({@link Item}) built and variables that hold a
 * value for every modelled declaration and the built-in `completionStatus`, as the session record
 * does, and the attempt count the built-in `numAttempts` reads. A rule that names an identifier
 * outside them, sets an outcome to a value of another type, or maps a response that has no mapping
 * is a failure of what the caller passed, and the caller can cause each one: the variables come
 * from a record the host hands back. An identifier the variables hold no value of is the record's
 * gap, and one the item declares nothing of is the item's; the failure says which. So the functions
 * stay plain and synchronous and return each failure, an {@link EngineFailure}, in a `Result`; the
 * first failure ends the run.
 *
 * Each expression kind's evaluator lives in its family's table under `#plate/engine/expressions/`,
 * and this module dispatches through the one table the ten make ({@link evaluators}). A family
 * reads {@link Scope} and the evaluator's types from here as types only, so the value imports point
 * one way: from here to the families.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import { OutcomeMismatchError, UnknownIdentifierError } from "#plate/engine/failures.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { arithmeticEvaluators } from "#plate/engine/expressions/arithmetic.ts";
import { comparisonEvaluators } from "#plate/engine/expressions/comparison.ts";
import { containersEvaluators } from "#plate/engine/expressions/containers.ts";
import { functionsEvaluators } from "#plate/engine/expressions/functions.ts";
import { integersEvaluators } from "#plate/engine/expressions/integers.ts";
import { logicEvaluators } from "#plate/engine/expressions/logic.ts";
import { referencesEvaluators } from "#plate/engine/expressions/references.ts";
import { roundingEvaluators } from "#plate/engine/expressions/rounding.ts";
import { testEvaluators } from "#plate/engine/expressions/test.ts";
import { textEvaluators } from "#plate/engine/expressions/text.ts";
import { numberOf, sameNumber } from "#plate/engine/numbers.ts";
import type { NumberSingle } from "#plate/engine/numbers.ts";
import type { ExpressionKind } from "#plate/model/expression.ts";
import type { Expression, Item, LookupTable, OutcomeDeclaration, Rule } from "#plate/model/item.ts";
import {
  completionStatus,
  completionStatusType,
  holdsCompletionStatus,
} from "#plate/model/record.ts";
import { isNull, nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

export {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
} from "#plate/engine/failures.ts";

export type { EngineFailure } from "#plate/engine/failures.ts";

/**
 * The variables of one attempt: each response and each outcome by identifier, and the attempt
 * count.
 *
 * Responses and outcomes share one identifier space, because declaration identifiers are unique
 * together, so a `qti-variable` names at most one of them. The outcomes hold the built-in outcome
 * `completionStatus` beside the declared ones where the item holds it (`holdsCompletionStatus` in
 * `#plate/model/record.ts`), since it is "declared implicitly" (`info.txt:8488`): no response or
 * outcome then shares its name.
 */
export interface Variables {
  /**
   * The value of the built-in response variable `numAttempts`: the number of attempts at the
   * item, the one being processed included, because the count "increases by '1' at the start of
   * each attempt". `runAttempt` in `#plate/engine/attempt.ts` always gives it. Without it, a
   * `qti-variable` of `numAttempts` is the record's gap, as any other variable the record holds
   * no value of.
   *
   * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IV_Response
   */
  readonly numAttempts?: bigint;
  readonly outcomes: Readonly<Record<string, Value>>;
  readonly responses: Readonly<Record<string, Value>>;
}

/**
 * The evaluator's context: the item whose declarations give the correct responses, the mappings
 * and the area mappings, and the variables of the attempt.
 *
 * Every evaluator takes it whole, so a field the engine adds reaches every family with no change
 * to an evaluator's signature. The family tests build it only through `scopeOf` in
 * `#plate/test/processing.ts`.
 */
export interface Scope {
  readonly item: Item;
  readonly variables: Variables;
}

/**
 * The variant of each expression kind: the member of {@link Expression} whose `kind` it is, `never`
 * for a kind the union does not hold.
 */
type Variants = { readonly [K in ExpressionKind]: Extract<Expression, { readonly kind: K }> };

/**
 * The evaluator an evaluator calls for its operands: it gives the value of any expression in a
 * scope.
 *
 * @param expression The expression, an operand of the caller.
 * @param scope The item and the variables of the attempt.
 * @returns The expression's value, or the first {@link EngineFailure} of its evaluation.
 */
export type Evaluate = (
  expression: Expression,
  scope: Scope,
) => Result.Result<Value, EngineFailure>;

/**
 * The evaluator of one expression kind: it takes the kind's own variant, so it destructures the
 * variant's `operands` tuple and reads its attributes with no check of the kind.
 *
 * @param expression The expression, of kind `K`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator of its operands.
 * @returns The expression's value, or the first {@link EngineFailure} of its evaluation.
 */
export type Evaluator<K extends ExpressionKind> = (
  expression: Variants[K],
  scope: Scope,
  evaluate: Evaluate,
) => Result.Result<Value, EngineFailure>;

/**
 * The stub marker: the entry of a kind its family has not landed (ruling R2). A test tells it from
 * a landed entry, which is a function. The dispatcher never reaches it on a checked item, because
 * the reader marks an unlanded kind, so its processing never runs.
 */
export type Unlanded = "unlanded";

/**
 * A family's table: one entry per kind of the family, its evaluator or the stub marker.
 */
export type FamilyTable<K extends ExpressionKind> = {
  readonly [P in K]: Evaluator<P> | Unlanded;
};

/**
 * Every kind's entry: the ten families' tables in one, keyed by {@link ExpressionKind}. Its type
 * requires an entry for each of the 64 kinds, so a kind no family holds fails the type check.
 */
export const evaluators: FamilyTable<ExpressionKind> = {
  ...arithmeticEvaluators,
  ...comparisonEvaluators,
  ...containersEvaluators,
  ...functionsEvaluators,
  ...integersEvaluators,
  ...logicEvaluators,
  ...referencesEvaluators,
  ...roundingEvaluators,
  ...testEvaluators,
  ...textEvaluators,
};

/**
 * The dispatcher reached a kind whose family holds the stub marker, a defect of the engine that no
 * checked item can cause.
 *
 * It cannot occur: the item model's reader marks every kind its family has not landed, so a
 * processing that holds one is none and never runs, and the validator holds such a kind untyped
 * (rulings R2 and R3). It is thrown, never returned, so {@link EngineFailure} holds only failures a
 * caller can cause, and it is not exported.
 */
class UnlandedKindDefect extends Data.TaggedError("UnlandedKindDefect")<{
  readonly kind: ExpressionKind;
}> {
  /**
   * The kind reached, and what to do with it.
   */
  override get message(): string {
    return `The engine reached qti-${this.kind}, whose evaluator has not landed, though the item model marks such a kind. This is a defect in the engine; report it with the item that caused it.`;
  }
}

/**
 * Give the value of an expression through its kind's entry in {@link evaluators}.
 *
 * The kind and the variant are passed apart so the entry the kind indexes takes that variant.
 *
 * @param kind The expression's kind.
 * @param expression The expression.
 * @param scope The item and the variables of the attempt.
 * @returns The expression's value, or the first {@link EngineFailure} of its evaluation.
 * @throws {UnlandedKindDefect} When the kind's entry is the stub marker, which no checked item
 *   reaches.
 */
const dispatch = <K extends ExpressionKind>(
  kind: K,
  expression: Variants[K],
  scope: Scope,
): Result.Result<Value, EngineFailure> => {
  const entry: Evaluator<K> | Unlanded = evaluators[kind];
  if (entry === "unlanded") {
    throw new UnlandedKindDefect({ kind });
  }

  // oxlint-disable-next-line eslint/no-use-before-define -- `dispatch` and `evaluate` are mutually recursive, as operands nest; the call runs only after both are defined.
  return entry(expression, scope, evaluate);
};

/**
 * Give the value of an expression in a scope, as every evaluator's `evaluate` does.
 *
 * @param expression The expression.
 * @param scope The item and the variables of the attempt.
 * @returns The expression's value, or the first {@link EngineFailure} of its evaluation.
 */
const evaluate: Evaluate = (expression, scope) => dispatch(expression.kind, expression, scope);

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
 * Give the value of an expression of a landed kind.
 *
 * Each kind's evaluator in its family's table gives the value, and its doc says what that value
 * is. Operands are evaluated left to right, and the first failure is the result.
 *
 * `typeOf` in `#plate/model/item.ts` gives each kind's base type and cardinality without evaluating
 * it, through the kind's rule (`kindRules` in `#plate/model/expressions/read.ts`), so the item
 * model marks a tree whose `qti-set-outcome-value` this function would fail. Each family's tests
 * hold its evaluators to its rules (the type invariant in `#plate/test/processing.ts`), so the two
 * cannot drift apart.
 *
 * @param expression The expression.
 * @param item The item, whose declarations give the correct responses, the mappings and the area
 *   mappings.
 * @param variables The variables of the attempt.
 * @returns The expression's value; or an {@link EngineFailure}: an {@link UnknownIdentifierError}
 *   when it names a variable or response that is not held, or an {@link UnmappedResponseError} when
 *   a `map-response` names a response with no mapping or a `map-response-point` one with no area
 *   mapping.
 */
export const evaluateExpression = (
  expression: Expression,
  item: Item,
  variables: Variables,
): Result.Result<Value, EngineFailure> => evaluate(expression, { item, variables });

/**
 * Give the type of an outcome a rule sets: its modelled declaration's, else the built-in
 * `completionStatus`'s, a single identifier, where the item holds the built-in.
 *
 * @param item The item.
 * @param identifier The outcome's identifier.
 * @returns The outcome's base type and cardinality, none when the item holds no outcome by that
 *   name.
 */
const outcomeType = (
  item: Item,
  identifier: string,
): Option.Option<Pick<OutcomeDeclaration, "baseType" | "cardinality">> =>
  Option.orElse(Option.fromUndefinedOr(item.outcomes.get(identifier)), () =>
    identifier === completionStatus && holdsCompletionStatus(item)
      ? Option.some(completionStatusType)
      : Option.none(),
  );

/**
 * Set an outcome, as `qti-set-outcome-value` and `qti-lookup-outcome-value` do: a modelled
 * outcome, or the built-in `completionStatus`, which a rule sets as an identifier.
 *
 * A NULL is stored as the outcome's own NULL, of its base type and cardinality, whatever type the
 * NULL came with (spec §4.5): NULL is the absence of a value, so it has no type to differ from the
 * outcome's.
 *
 * @param item The item, whose declaration gives the outcome's type.
 * @param variables The variables before the rule.
 * @param identifier The outcome's identifier.
 * @param value The value to set.
 * @returns The variables with the outcome set and everything else as it was; or an
 *   {@link UnknownIdentifierError} when the item declares no modelled outcome by that name and it
 *   is not the built-in `completionStatus` the item holds, or an {@link OutcomeMismatchError} when
 *   the value is not NULL and its base type or cardinality differs from the outcome's.
 */
const setOutcome = (
  item: Item,
  variables: Variables,
  identifier: string,
  value: Value,
): Result.Result<Variables, OutcomeMismatchError | UnknownIdentifierError> =>
  Result.gen(function* setOneOutcome() {
    const declaration = yield* Result.fromOption(
      outcomeType(item, identifier),
      () => new UnknownIdentifierError({ holder: "item", identifier, role: "outcome" }),
    );
    if (isNull(value)) {
      const typed = nullOf(declaration.baseType, declaration.cardinality);

      return { ...variables, outcomes: { ...variables.outcomes, [identifier]: typed } };
    }

    if (value.baseType !== declaration.baseType || value.cardinality !== declaration.cardinality) {
      return yield* Result.fail(
        new OutcomeMismatchError({
          actual: `${value.baseType} ${value.cardinality}`,
          expected: `${declaration.baseType} ${declaration.cardinality}`,
          identifier,
        }),
      );
    }

    return { ...variables, outcomes: { ...variables.outcomes, [identifier]: value } };
  });

/**
 * Choose the rules a condition runs: those of its first branch whose condition is true, else its
 * `otherwise`, else none.
 *
 * Branch conditions are evaluated in order, and those after the chosen branch, or after a
 * condition that fails, are not evaluated.
 *
 * @param condition The `qti-response-condition`.
 * @param item The item.
 * @param variables The variables before the condition.
 * @returns The chosen rules, or the first failure of a branch condition.
 */
const chosenRules = (
  condition: Extract<Rule, { readonly kind: "condition" }>,
  item: Item,
  variables: Variables,
): Result.Result<readonly Rule[], EngineFailure> =>
  Result.gen(function* chooseBranch() {
    for (const branch of condition.branches) {
      if (isTrue(yield* evaluateExpression(branch.when, item, variables))) {
        return branch.then;
      }
    }

    return Option.getOrElse(condition.otherwise, () => []);
  });

/**
 * Report whether a number is at or above an interpolation entry's `source-value`, the equal case
 * counting only when the entry includes its boundary. An integer and a float compare exactly: `>`
 * between a `bigint` and a `number` loses nothing, and equality is {@link sameNumber}'s.
 *
 * @param number The looked-up number.
 * @param bound The entry's `source-value`.
 * @param includeBoundary The entry's `include-boundary`.
 * @returns Whether the entry maps the number.
 */
const reaches = (number: NumberSingle, bound: number, includeBoundary: boolean): boolean =>
  number.value > bound ||
  (includeBoundary && sameNumber(number, { baseType: "float", value: bound }));

/**
 * Map a value through a lookup table, as `qti-lookup-outcome-value` does: a match table by the
 * first entry whose `source-value` is the value exactly, an interpolation table by the first entry
 * whose `source-value` the value is at or above ({@link reaches}).
 *
 * A NULL, or a value no entry maps, gives the table's `default-value`, else nothing; the outcome's
 * own `qti-default-value` is not used (9.12). The validator holds a match table's value to a single
 * integer and an interpolation table's to a single integer or float (reading 28), so a value of
 * another type maps through no entry.
 *
 * @param table The outcome's lookup table.
 * @param value The expression's value.
 * @returns The entry's or the table's value, or none.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_LookupOutcomeValue
 */
const lookUp = (table: LookupTable, value: Value): Option.Option<Single> => {
  const mapped = Option.flatMap(numberOf(value), (source): Option.Option<Single> => {
    const entry =
      table.kind === "match"
        ? table.entries.find(
            (each) => source.baseType === "integer" && each.sourceValue === source.value,
          )
        : table.entries.find((each) => reaches(source, each.sourceValue, each.includeBoundary));

    return Option.map(Option.fromUndefinedOr(entry), (found) => found.targetValue);
  });

  return Option.orElse(mapped, () => table.defaultValue);
};

/**
 * Give the value a `qti-lookup-outcome-value` sets its outcome to: the single its outcome's lookup
 * table maps the value to ({@link lookUp}), else NULL.
 *
 * An outcome with no lookup table maps every value to NULL; the validator refuses a lookup of one
 * (`template-requirements`), so no checked item reaches it. An outcome the item does not declare
 * maps to NULL too, and {@link setOutcome} then fails it, unless it is the built-in
 * `completionStatus`, whose NULL it stores; the validator refuses a lookup of the built-in
 * (`undeclared-variable`'s `built-in-target` check).
 *
 * @param item The item, whose outcome declaration holds the table.
 * @param identifier The outcome's identifier.
 * @param value The expression's value.
 * @returns The value to set.
 */
const lookedUp = (item: Item, identifier: string, value: Value): Value => {
  const target = Option.fromUndefinedOr(item.outcomes.get(identifier)).pipe(
    Option.flatMap((declared) => declared.lookupTable),
    Option.flatMap((table) => lookUp(table, value)),
  );

  return Option.match(target, {
    onNone: () => nullOf(value.baseType, value.cardinality),
    onSome: (single): Value => ({
      baseType: single.baseType,
      cardinality: "single",
      values: [single],
    }),
  });
};

/**
 * The variables after a run of rules, and whether a `qti-exit-response` ended it.
 */
interface Run {
  readonly exited: boolean;
  readonly variables: Variables;
}

/**
 * Run one response rule.
 *
 * A condition runs the rules of its first branch whose condition is true, else its `otherwise`,
 * else nothing; the conditions after the chosen branch are not evaluated. A set gives its
 * outcome the expression's value, a lookup the value its outcome's table maps the expression's
 * value to ({@link lookedUp}), and an exit ends the run, at any depth.
 *
 * @param rule The rule.
 * @param item The item.
 * @param variables The variables before the rule.
 * @returns The variables after it with whether it exited, or the first failure of the rule.
 */
const runRule = (rule: Rule, item: Item, variables: Variables): Result.Result<Run, EngineFailure> =>
  Result.gen(function* runOneRule() {
    if (rule.kind === "exit") {
      return { exited: true, variables };
    }

    if (rule.kind === "condition") {
      const then = yield* chosenRules(rule, item, variables);

      // oxlint-disable-next-line eslint/no-use-before-define -- `runRule` and `runSequence` are mutually recursive, as conditions nest; the call runs only after both are defined.
      return yield* runSequence(then, item, variables);
    }

    const value = yield* evaluateExpression(rule.expression, item, variables);
    const set = rule.kind === "set-outcome" ? value : lookedUp(item, rule.identifier, value);

    return { exited: false, variables: yield* setOutcome(item, variables, rule.identifier, set) };
  });

/**
 * Run response rules in order until one exits, each seeing the variables the rules before it left.
 *
 * @param rules The rules.
 * @param item The item.
 * @param variables The variables before the rules run.
 * @returns The variables after the last rule run with whether an exit ended the run, or the first
 *   failure.
 */
const runSequence = (
  rules: readonly Rule[],
  item: Item,
  variables: Variables,
): Result.Result<Run, EngineFailure> =>
  Result.gen(function* runInOrder() {
    let current = variables;
    for (const rule of rules) {
      const run = yield* runRule(rule, item, current);
      if (run.exited) {
        return run;
      }

      current = run.variables;
    }

    return { exited: false, variables: current };
  });

/**
 * Run response rules in order, each seeing the variables the rules before it left. A
 * `qti-exit-response` ends the run, nested or not: the rules after it do not run, and what the
 * rules before it set stays.
 *
 * Only outcomes change; the responses are returned as given.
 *
 * @param rules The rules, as the item model built them.
 * @param item The item they belong to.
 * @param variables The variables before the rules run.
 * @returns The variables after the last rule run; or the first failure, after which no rule runs:
 *   an {@link UnknownIdentifierError} when a rule names an identifier the item or the variables do
 *   not hold in the role the rule reads it in, an {@link OutcomeMismatchError} when a rule sets an
 *   outcome to a value of another type that is not NULL, or an {@link UnmappedResponseError} when
 *   a rule maps a response that has no mapping.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Root_ResponseProcessing
 */
export const runRules = (
  rules: readonly Rule[],
  item: Item,
  variables: Variables,
): Result.Result<Variables, EngineFailure> =>
  Result.map(runSequence(rules, item, variables), (run) => run.variables);
