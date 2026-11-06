/**
 * The evaluator: the engine subset (spec §4.12) run over an item's rule tree, as pure functions of
 * the item and the variables of one attempt.
 *
 * {@link runRules} runs response rules in order, and {@link evaluateExpression} gives the value of
 * one expression. They take rules the item model ({@link Item}) built and variables that hold a
 * value for every modelled declaration, as the session record does, and the attempt count the
 * built-in `numAttempts` reads. A rule that names an identifier outside them, sets an outcome to a
 * value of another type, or maps a response that has no mapping is a failure of what the caller
 * passed, and the caller can cause each one: the variables come from a record the host hands back.
 * An identifier the variables hold no value of is the record's gap, and one the item declares
 * nothing of is the item's; the failure says which. So the functions stay plain and synchronous and
 * return each failure, an {@link EngineFailure}, in a `Result`; the first failure ends the run.
 *
 * @module
 */
import { Array as Arr, Option, Result } from "effect";
import {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
} from "#plate/engine/failures.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { foldCase } from "#plate/engine/math.ts";
import { booleanOf, numberOf, sameNumber, toFloat } from "#plate/engine/numbers.ts";
import { own, variableValue } from "#plate/engine/refs.ts";
import { areaHolds } from "#plate/engine/expressions/shapes.ts";
import type {
  AreaMapping,
  Expression,
  Item,
  MapEntry,
  Mapping,
  ResponseDeclaration,
  Rule,
} from "#plate/model/item.ts";
import { format, isNull, match, nullOf } from "#plate/model/values.ts";
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
 * together, so a `qti-variable` names at most one of them.
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
 * Find the response declaration a `qti-correct`, a `qti-map-response` or a
 * `qti-map-response-point` names.
 *
 * @param item The item.
 * @param identifier The response's identifier.
 * @returns The declaration, or an {@link UnknownIdentifierError} when the item declares no
 *   modelled response by that name.
 */
const responseOf = (
  item: Item,
  identifier: string,
): Result.Result<ResponseDeclaration, UnknownIdentifierError> =>
  Result.fromOption(
    Option.fromUndefinedOr(item.responses.get(identifier)),
    () => new UnknownIdentifierError({ holder: "item", identifier, role: "response" }),
  );

/**
 * Report whether two singles are equal, as `match` compares single values: the same base type,
 * numbers by value, strings and identifiers by code point, and a `pair` in either order.
 *
 * @param left One single.
 * @param right The other.
 * @returns Whether they are equal.
 */
const equal = (left: Single, right: Single): boolean =>
  match(
    { baseType: left.baseType, cardinality: "single", values: [left] },
    { baseType: right.baseType, cardinality: "single", values: [right] },
  );

/**
 * Give the key {@link distinct} tells a value apart by: its base type and its value as `format`
 * writes it, so two values share a key exactly when {@link equal} finds them equal, however each
 * was written (`+5` and `05` are one integer, `1.0` and `1e0` one float).
 *
 * Where `equal` and `format` part, the key follows `equal`: a `pair`'s identifiers are written in
 * code-unit order, as `equal` matches a pair in either order, and a float's `-0` is written as `0`,
 * as `equal` compares floats with `===`. That `===` makes a NaN equal to no value, itself included,
 * so a NaN has no key. A base type holds no space, and neither does an identifier or a coordinate,
 * so one space between the parts keeps two keys apart.
 *
 * @param single The value.
 * @returns Its key; none for a NaN.
 */
const distinctKey = (single: Single): Option.Option<string> => {
  if (single.baseType === "float") {
    const value = Object.is(single.value, -0) ? 0 : single.value;

    return Number.isNaN(value)
      ? Option.none()
      : Option.some(`float ${format({ baseType: "float", value })}`);
  }

  if (single.baseType === "pair") {
    const [first, second] = single.value;
    const value: readonly [string, string] = first <= second ? [first, second] : [second, first];

    return Option.some(`pair ${format({ baseType: "pair", value })}`);
  }

  return Option.some(`${single.baseType} ${format(single)}`);
};

/**
 * Drop a response's repeated values: each value is kept at its first occurrence, in order, and a
 * later value {@link equal} finds equal to it is dropped.
 *
 * A `Set` of each value's {@link distinctKey} finds the repeats, so the time is linear in the
 * number of values: a candidate's post of many members costs what its length costs, where comparing
 * every pair would cost its square. A NaN has no key and is always kept, as `equal` finds it equal
 * to nothing.
 *
 * @param values The response's values.
 * @returns The values no earlier value equals, in order.
 */
const distinct = (values: readonly Single[]): readonly Single[] => {
  const seen = new Set<string>();
  const kept: Single[] = [];
  for (const single of values) {
    const key = distinctKey(single);
    if (Option.isNone(key)) {
      kept.push(single);
    } else if (!seen.has(key.value)) {
      seen.add(key.value);
      kept.push(single);
    }
  }

  return kept;
};

/**
 * Report whether a map entry compares its key exactly: a string key when it is `case-sensitive`,
 * and a key of every other base type always, identifiers included.
 *
 * @param entry The map entry.
 * @returns Whether its key compares exactly.
 */
const comparesExactly = (entry: MapEntry): boolean =>
  entry.caseSensitive || entry.key.baseType !== "string";

/**
 * Report whether a map entry's key matches a response value: exactly when the entry compares
 * exactly, else as strings with case folded.
 *
 * @param entry The map entry.
 * @param single The response value.
 * @returns Whether the entry maps it.
 */
const keyMatches = (entry: MapEntry, single: Single): boolean =>
  !comparesExactly(entry) && entry.key.baseType === "string" && single.baseType === "string"
    ? foldCase(entry.key.value) === foldCase(single.value)
    : equal(entry.key, single);

/**
 * Give the value a mapping maps one response value to: the value of the first entry in document
 * order that matches it, else the mapping's default.
 *
 * Overlapping entries are valid, so a value two or more entries match takes the first of them in
 * document order. That rule is a placeholder while spec §12 Q5 is open: the operator's answer
 * changes this one expression and its test. BG010 lists its case-sensitive `York` before its
 * `york`, so its `York` maps by the first and `YORK` by the second.
 *
 * @param mapping The response's mapping.
 * @param single The response value.
 * @returns The mapped value.
 */
const mappedValue = (mapping: Mapping, single: Single): number =>
  Option.match(
    Arr.findFirst(mapping.entries, (entry) => keyMatches(entry, single)),
    { onNone: () => mapping.defaultValue, onSome: (entry) => entry.value },
  );

/**
 * Give the value of a `qti-map-response`: a single float.
 *
 * A value is the sum of the mapped values of the response's distinct values, as {@link distinct}
 * finds them in time linear in their number, keyed by {@link distinctKey}: so a `single` value maps
 * to its one value's, `{B,B,C}` counts `B` once, and a NULL response maps to 0. The mapping's
 * `lower-bound` and `upper-bound` then clamp the sum, a single value's and a NULL's included
 * (reading 9.13).
 *
 * @param item The item, whose declaration gives the mapping.
 * @param variables The variables of the attempt.
 * @param identifier The response's identifier.
 * @returns The mapped value; or an {@link UnknownIdentifierError} when the item declares no
 *   modelled response by that name, an {@link UnmappedResponseError} when its declaration has no
 *   mapping, or an {@link UnknownIdentifierError} when the variables hold no value of it, checked
 *   in that order.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 */
const mapResponse = (
  item: Item,
  variables: Variables,
  identifier: string,
): Result.Result<Value, UnknownIdentifierError | UnmappedResponseError> =>
  Result.gen(function* mapOneResponse() {
    const declaration = yield* responseOf(item, identifier);
    const mapping = yield* Result.fromOption(
      declaration.mapping,
      () => new UnmappedResponseError({ identifier, mapping: "qti-mapping" }),
    );
    const response = yield* Result.fromOption(
      own(variables.responses, identifier),
      () => new UnknownIdentifierError({ holder: "record", identifier, role: "response" }),
    );
    let sum = 0;
    for (const single of distinct(response.values)) {
      sum += mappedValue(mapping, single);
    }

    const lower = Option.getOrElse(mapping.lowerBound, () => Number.NEGATIVE_INFINITY);
    const upper = Option.getOrElse(mapping.upperBound, () => Number.POSITIVE_INFINITY);
    const mapped: Value = {
      baseType: "float",
      cardinality: "single",
      values: [{ baseType: "float", value: Math.min(upper, Math.max(lower, sum)) }],
    };

    return mapped;
  });

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * Find the first area, in document order, that holds a point.
 *
 * @param mapping The area mapping.
 * @param x The point's x coordinate, as a float.
 * @param y The point's y coordinate, as a float.
 * @returns The area's index among the mapping's entries, or -1 when no area holds the point.
 */
const firstArea = (mapping: AreaMapping, x: number, y: number): number =>
  mapping.entries.findIndex((entry) => areaHolds[entry.shape](entry.coords, x, y));
/* oxlint-enable anti-slop/no-shape-in-symbol-names */

/**
 * Sum what an area mapping maps a response's points to, before the bounds.
 *
 * QTI tests the points "against each area in turn, with those listed first taking priority in the
 * case where areas overlap", and "each area can be mapped once only". The rest is open (9.15), and
 * these defaults (reading 52) hold until a ruling changes this function and its tests:
 *
 * - A point on a shape's boundary is inside (`rect`, `circle`, `ellipse` and `poly`, edges included;
 *   `default` holds every point), as {@link areaHolds} reads it.
 * - Areas are tried in document order and the first that holds a point maps it; each area is mapped
 *   at most once.
 * - Each distinct point that falls in no area adds `default-value` once, as `map_response` treats an
 *   unmapped value. Points are told apart as {@link distinct} tells values apart, by their two
 *   exact coordinates, in time linear in their number.
 *
 * A coordinate is compared after the one conversion, {@link toFloat}.
 *
 * @param mapping The response's area mapping.
 * @param points The response's values, a point each.
 * @returns The sum.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
const areaSum = (mapping: AreaMapping, points: readonly Single[]): number => {
  const mapped = new Set<number>();
  let sum = 0;
  for (const single of distinct(points)) {
    const area =
      single.baseType === "point"
        ? firstArea(mapping, toFloat(single.value[0]), toFloat(single.value[1]))
        : -1;
    const entry = mapping.entries[area];
    if (entry === undefined) {
      sum += mapping.defaultValue;
    } else if (!mapped.has(area)) {
      mapped.add(area);
      sum += entry.mappedValue;
    }
  }

  return sum;
};

/**
 * Give the value of a `qti-map-response-point`: a single float.
 *
 * The value is {@link areaSum} of the response's points, so a NULL response maps to 0. The sum is
 * clamped to the area mapping's `lower-bound` and `upper-bound`, a NULL's 0 included (9.13's rule,
 * as `qti-map-response` applies it).
 *
 * @param item The item, whose declaration gives the area mapping.
 * @param variables The variables of the attempt.
 * @param identifier The response's identifier.
 * @returns The mapped value; or an {@link UnknownIdentifierError} when the item declares no
 *   modelled response by that name, an {@link UnmappedResponseError} when its declaration has no
 *   area mapping, or an {@link UnknownIdentifierError} when the variables hold no value of it,
 *   checked in that order.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
const mapResponsePoint = (
  item: Item,
  variables: Variables,
  identifier: string,
): Result.Result<Value, UnknownIdentifierError | UnmappedResponseError> =>
  Result.gen(function* mapOnePointResponse() {
    const declaration = yield* responseOf(item, identifier);
    const mapping = yield* Result.fromOption(
      declaration.areaMapping,
      () => new UnmappedResponseError({ identifier, mapping: "qti-area-mapping" }),
    );
    const response = yield* Result.fromOption(
      own(variables.responses, identifier),
      () => new UnknownIdentifierError({ holder: "record", identifier, role: "response" }),
    );
    const lower = Option.getOrElse(mapping.lowerBound, () => Number.NEGATIVE_INFINITY);
    const upper = Option.getOrElse(mapping.upperBound, () => Number.POSITIVE_INFINITY);
    const mapped: Value = {
      baseType: "float",
      cardinality: "single",
      values: [
        {
          baseType: "float",
          value: Math.min(upper, Math.max(lower, areaSum(mapping, response.values))),
        },
      ],
    };

    return mapped;
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
 * Give the value of an expression of the engine subset.
 *
 * - `variable`: the response's or the outcome's current value, else the built-in variable's
 *   (`builtInValue` in `#plate/engine/refs.ts`).
 * - `correct`: the response's correct response, else NULL of its declared type.
 * - `base-value`: the value as the item model parsed it.
 * - `is-null`: a single boolean, whether the operand is NULL.
 * - `match`: a single boolean, whether the operands match by `match` of the value model; NULL when
 *   either is NULL.
 * - `equal`: a single boolean, whether the operands are the same number in `exact` mode
 *   ({@link sameNumber}); NULL when either is NULL. QTI types both operands as single numbers; an
 *   operand that is not one is not numerically equal to anything, so the value is false, as `match`
 *   gives false for values of different types.
 * - `map-response`: a single float, the response's value through its declaration's mapping.
 * - `map-response-point`: a single float, the response's points through its declaration's area
 *   mapping.
 *
 * Operands are evaluated left to right, and the first failure is the result.
 *
 * `typeOf` in `#plate/model/item.ts` gives each case's base type and cardinality without
 * evaluating it, so the item model marks a tree whose `qti-set-outcome-value` this function would
 * fail; it names the case or the function here that each of its cases mirrors, so a change to a
 * case's type changes it too.
 *
 * @param expression The expression.
 * @param item The item, whose declarations give the correct responses, the mappings and the area
 *   mappings.
 * @param variables The variables of the attempt.
 * @returns The expression's value; or an {@link UnknownIdentifierError} when it names a variable
 *   or response that is not held, or an {@link UnmappedResponseError} when a `map-response` names a
 *   response with no mapping or a `map-response-point` one with no area mapping.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpEqual
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIsNull
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
export const evaluateExpression = (
  expression: Expression,
  item: Item,
  variables: Variables,
): Result.Result<Value, UnknownIdentifierError | UnmappedResponseError> => {
  switch (expression.kind) {
    case "variable": {
      return variableValue(variables, expression.identifier);
    }
    case "correct": {
      return Result.map(responseOf(item, expression.identifier), (declaration) =>
        Option.getOrElse(declaration.correct, () =>
          nullOf(declaration.baseType, declaration.cardinality),
        ),
      );
    }
    case "base-value": {
      return Result.succeed(expression.value);
    }
    case "is-null": {
      const [operand] = expression.operands;

      return Result.map(evaluateExpression(operand, item, variables), (value) =>
        booleanOf(isNull(value)),
      );
    }
    case "match": {
      const [left, right] = expression.operands;

      return Result.gen(function* matchOperands() {
        const leftValue = yield* evaluateExpression(left, item, variables);
        const rightValue = yield* evaluateExpression(right, item, variables);

        return isNull(leftValue) || isNull(rightValue)
          ? nullOf("boolean", "single")
          : booleanOf(match(leftValue, rightValue));
      });
    }
    case "equal": {
      const [left, right] = expression.operands;

      return Result.gen(function* equalOperands() {
        const leftValue = yield* evaluateExpression(left, item, variables);
        const rightValue = yield* evaluateExpression(right, item, variables);
        if (isNull(leftValue) || isNull(rightValue)) {
          return nullOf("boolean", "single");
        }

        return booleanOf(
          Option.exists(Option.all([numberOf(leftValue), numberOf(rightValue)]), ([one, other]) =>
            sameNumber(one, other),
          ),
        );
      });
    }
    case "map-response": {
      return mapResponse(item, variables, expression.identifier);
    }
    case "map-response-point": {
      return mapResponsePoint(item, variables, expression.identifier);
    }
    default: {
      return expression satisfies never;
    }
  }
};

/**
 * Set an outcome, as `qti-set-outcome-value` does.
 *
 * @param item The item, whose declaration gives the outcome's type.
 * @param variables The variables before the rule.
 * @param identifier The outcome's identifier.
 * @param value The expression's value.
 * @returns The variables with the outcome set and everything else as it was; or an
 *   {@link UnknownIdentifierError} when the item declares no modelled outcome by that name, or an
 *   {@link OutcomeMismatchError} when the value's base type or cardinality differs from the
 *   outcome's.
 */
const setOutcome = (
  item: Item,
  variables: Variables,
  identifier: string,
  value: Value,
): Result.Result<Variables, OutcomeMismatchError | UnknownIdentifierError> =>
  Result.gen(function* setOneOutcome() {
    const declaration = yield* Result.fromOption(
      Option.fromUndefinedOr(item.outcomes.get(identifier)),
      () => new UnknownIdentifierError({ holder: "item", identifier, role: "outcome" }),
    );
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
 * Run one response rule.
 *
 * A condition runs the rules of its first branch whose condition is true, else its `otherwise`,
 * else nothing; the conditions after the chosen branch are not evaluated.
 *
 * @param rule The rule.
 * @param item The item.
 * @param variables The variables before the rule.
 * @returns The variables after it, or the first failure of the rule.
 */
const runRule = (
  rule: Rule,
  item: Item,
  variables: Variables,
): Result.Result<Variables, EngineFailure> =>
  Result.gen(function* runOneRule() {
    if (rule.kind === "set-outcome") {
      const value = yield* evaluateExpression(rule.expression, item, variables);

      return yield* setOutcome(item, variables, rule.identifier, value);
    }

    const then = yield* chosenRules(rule, item, variables);

    // oxlint-disable-next-line eslint/no-use-before-define -- `runRule` and `runRules` are mutually recursive, as conditions nest; the call runs only after both are defined.
    return yield* runRules(then, item, variables);
  });

/**
 * Run response rules in order, each seeing the variables the rules before it left.
 *
 * Only outcomes change; the responses are returned as given.
 *
 * @param rules The rules, as the item model built them.
 * @param item The item they belong to.
 * @param variables The variables before the rules run.
 * @returns The variables after the last rule; or the first failure, after which no rule runs: an
 *   {@link UnknownIdentifierError} when a rule names an identifier the item or the variables do not
 *   hold in the role the rule reads it in, an {@link OutcomeMismatchError} when a rule sets an
 *   outcome to a value of another type, or an {@link UnmappedResponseError} when a rule maps a
 *   response that has no mapping.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Root_ResponseProcessing
 */
export const runRules = (
  rules: readonly Rule[],
  item: Item,
  variables: Variables,
): Result.Result<Variables, EngineFailure> =>
  Result.gen(function* runInOrder() {
    let current = variables;
    for (const rule of rules) {
      current = yield* runRule(rule, item, current);
    }

    return current;
  });
