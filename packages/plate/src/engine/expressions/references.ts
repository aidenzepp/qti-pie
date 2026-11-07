/**
 * The references family of the engine: the evaluators of the expressions that read a variable, a
 * declaration or a literal, `qti-variable`, `qti-correct`, `qti-base-value`, `qti-map-response`,
 * `qti-map-response-point`, `qti-default` and `qti-null`, and of the two that draw from the scope's
 * stream, `qti-random-integer` and `qti-random-float`.
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Option`, `Array`
 * and `Result`, and reads the evaluator's types from `#plate/engine/evaluate.ts` as types, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import { Array as Arr, Option, Result } from "effect";
import type { Evaluator, FamilyTable, Variables } from "#plate/engine/evaluate.ts";
import { areaHolds } from "#plate/engine/expressions/shapes.ts";
import { UnknownIdentifierError, UnmappedResponseError } from "#plate/engine/failures.ts";
import { foldCase } from "#plate/engine/math.ts";
import {
  bitLengthOf,
  floatValue,
  integerBitBound,
  integerValue,
  numberOf,
  toFloat,
} from "#plate/engine/numbers.ts";
import { drawBelow, drawFloat } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import {
  builtInType,
  own,
  referenceInteger,
  referenceValue,
  variableValue,
} from "#plate/engine/refs.ts";
import type { FloatOrRef } from "#plate/model/expression.ts";
import type {
  AreaMapping,
  Item,
  MapEntry,
  Mapping,
  ResponseDeclaration,
} from "#plate/model/item.ts";
import { format, match, nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

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
 * Give the value a mapping or an area mapping gives its sum: a single float, the sum clamped to
 * the mapping's `lower-bound` and `upper-bound`, each unbounded when absent.
 *
 * @param mapping The mapping's bounds.
 * @param sum The sum of the mapped values.
 * @returns The single float.
 */
const clamped = (
  mapping: Pick<AreaMapping | Mapping, "lowerBound" | "upperBound">,
  sum: number,
): Value => {
  const lower = Option.getOrElse(mapping.lowerBound, () => Number.NEGATIVE_INFINITY);
  const upper = Option.getOrElse(mapping.upperBound, () => Number.POSITIVE_INFINITY);

  return floatValue(Math.min(upper, Math.max(lower, sum)));
};

/**
 * Give the value of a `qti-map-response`: a single float.
 *
 * The value is the sum of the mapped values of the response's distinct values, as {@link distinct}
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

    return clamped(mapping, sum);
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

    return clamped(mapping, areaSum(mapping, response.values));
  });

/**
 * Give the value of a `qti-variable`: the response's, the outcome's or the template variable's
 * current value, else the built-in variable's, as {@link variableValue} reads it.
 *
 * @param expression The `qti-variable`.
 * @param scope The item and the variables of the attempt.
 * @returns The variable's value, or an {@link UnknownIdentifierError} when the variables hold no
 *   value of it.
 */
const evaluateVariable: Evaluator<"variable"> = (expression, scope) =>
  variableValue(scope.variables, expression.identifier);

/**
 * Give the value of a `qti-correct`: the correct response template processing set for the response
 * (`Variables.correct`), else its declaration's correct response, else NULL of its declared type.
 *
 * The response must be declared either way, so an override map never makes an undeclared name
 * readable; `qti-set-correct-response` names only a declared response on a checked item.
 *
 * @param expression The `qti-correct`.
 * @param scope The item, whose declaration gives the correct response, and the variables, whose
 *   override comes first.
 * @returns The correct response, or an {@link UnknownIdentifierError} when the item declares no
 *   modelled response by that name.
 */
const evaluateCorrect: Evaluator<"correct"> = (expression, scope) =>
  Result.map(responseOf(scope.item, expression.identifier), (declaration) =>
    Option.getOrElse(
      Option.orElse(own(scope.variables.correct, expression.identifier), () => declaration.correct),
      () => nullOf(declaration.baseType, declaration.cardinality),
    ),
  );

/**
 * Give the value of a `qti-base-value`: the value as the item model parsed it.
 *
 * @param expression The `qti-base-value`.
 * @returns Its value.
 */
const evaluateBaseValue: Evaluator<"base-value"> = (expression) => Result.succeed(expression.value);

/**
 * Give the value of a `qti-map-response`: a single float, the response's value through its
 * declaration's mapping ({@link mapResponse}).
 *
 * @param expression The `qti-map-response`.
 * @param scope The item, whose declaration gives the mapping, and the variables.
 * @returns The mapped value, or the failure {@link mapResponse} gives.
 */
const evaluateMapResponse: Evaluator<"map-response"> = (expression, scope) =>
  mapResponse(scope.item, scope.variables, expression.identifier);

/**
 * Give the value of a `qti-map-response-point`: a single float, the response's points through its
 * declaration's area mapping ({@link mapResponsePoint}).
 *
 * @param expression The `qti-map-response-point`.
 * @param scope The item, whose declaration gives the area mapping, and the variables.
 * @returns The mapped value, or the failure {@link mapResponsePoint} gives.
 */
const evaluateMapResponsePoint: Evaluator<"map-response-point"> = (expression, scope) =>
  mapResponsePoint(scope.item, scope.variables, expression.identifier);

/**
 * Give the value of a `qti-default`: the default template processing set for the variable it names
 * (`Variables.defaults`), else the default value declared for it, else NULL of that variable's
 * type, as the information model says: it "returns the associated defaultValue or NULL if no
 * default value was declared".
 *
 * It reads the defaults and the declaration, never the attempt's value. A response, an outcome or
 * a template variable with no `qti-default-value` and no default set gives NULL of its base type
 * and cardinality, a single integer or float outcome included: the 0 an attempt starts such an
 * outcome at is not a declared default, and a template variable's current value is not its default
 * either. The variable must be declared for a set default to be read, so an override map never
 * makes an undeclared name readable; `qti-set-default-value` names only a declared response or
 * outcome on a checked item. A declared variable wins over a built-in of the same name, as
 * `qti-variable` reads it. A built-in the engine holds, `numAttempts` or `completionStatus`, has no
 * declaration and so no declared default: it gives NULL of the built-in's own type
 * ({@link builtInType}), a single integer or a single identifier, whatever the attempt holds of it.
 *
 * @param expression The `qti-default`.
 * @param scope The item, whose declarations give the defaults, and the variables, whose set
 *   defaults come first.
 * @returns The set or declared default or the NULL, or an {@link UnknownIdentifierError} when the
 *   item declares no modelled response, outcome or template variable by that name and it names no
 *   built-in the engine holds. The item model marks such a name, so a checked item never reaches
 *   that failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpDefault
 */
const evaluateDefault: Evaluator<"default"> = (expression, scope) => {
  const declaration =
    scope.item.responses.get(expression.identifier) ??
    scope.item.outcomes.get(expression.identifier) ??
    scope.item.templates.get(expression.identifier);
  if (declaration !== undefined) {
    return Result.succeed(
      Option.getOrElse(
        Option.orElse(
          own(scope.variables.defaults, expression.identifier),
          () => declaration.defaultValue,
        ),
        () => nullOf(declaration.baseType, declaration.cardinality),
      ),
    );
  }

  return Result.fromOption(
    Option.map(builtInType(expression.identifier), (type) =>
      nullOf(type.baseType, type.cardinality),
    ),
    () =>
      new UnknownIdentifierError({
        holder: "item",
        identifier: expression.identifier,
        role: "variable",
      }),
  );
};

/**
 * Give the value of a `qti-null`: NULL, "treated as if it is of any desired base-type".
 *
 * A value carries a base type and a cardinality, so this NULL carries a single string's, the type
 * of an empty string, which the information model also treats as NULL. No check reads them: the
 * kind's rule types it any base type, which every operand rule and every check of a type accepts,
 * and an outcome set to it stores its own typed NULL (`setOutcome` in
 * `#plate/engine/evaluate.ts`).
 *
 * @returns The NULL.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#AbstractAttribute_ExpressionGroup_qti-null
 */
const evaluateNull: Evaluator<"null"> = () => Result.succeed(nullOf("string", "single"));

/**
 * Draw a `qti-random-integer`'s value from its resolved attributes: `min + step × j`, with `j`
 * drawn by `drawBelow` among the `⌊(max − min) / step⌋ + 1` values the range holds, so with `min`
 * 2, `max` 11 and `step` 3 the values 2, 5, 8 and 11 are equally likely.
 *
 * Every NULL is settled before the first draw, so a NULL draws nothing and leaves the stream where
 * it was for every later draw:
 *
 * - `max` below `min`, or a `step` of 0 or below: "the range holds no value and the result is NULL"
 *   (G-R1 draft 148).
 * - `min` or `max` of more than {@link integerBitBound} bits (1,000,000): the drawn integer is a
 *   computed result, held to that bound by the operator's ruling `afb7e648`, and within the bound
 *   every value the range holds is too, so the draw is never past it (G-R2, pending).
 *
 * A range of one value, `step` beyond `max − min` among them, draws nothing and gives `min`.
 *
 * @param draw The scope's stream.
 * @param min The least value.
 * @param max The greatest value.
 * @param step The step between values.
 * @returns The single integer, or NULL of a single integer.
 */
const integerDraw = (draw: Draw, min: bigint, max: bigint, step: bigint): Value => {
  if (
    max < min ||
    step <= 0n ||
    bitLengthOf(min) > integerBitBound ||
    bitLengthOf(max) > integerBitBound
  ) {
    return nullOf("integer", "single");
  }

  return integerValue(min + step * drawBelow(draw, (max - min) / step + 1n));
};

/**
 * Give the value of a `qti-random-integer`: a single integer drawn from its range
 * ({@link integerDraw}).
 *
 * Its `min`, `max` and `step` are resolved first, in that order, each its literal or the value of
 * the variable it names ({@link referenceInteger}); a NULL there gives NULL, before any draw.
 *
 * @param expression The `qti-random-integer`.
 * @param scope The variables of the attempt and the stream it draws from.
 * @returns The single integer or its NULL, or an {@link UnknownIdentifierError} when an attribute
 *   names a variable the variables hold no value of, which a checked item never reaches.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#AbstractAttribute_ExpressionGroup_qti-random-integer
 */
const evaluateRandomInteger: Evaluator<"random-integer"> = (expression, scope) =>
  Result.gen(function* drawRandomInteger() {
    const min = yield* referenceInteger(scope.variables, expression.min);
    const max = yield* referenceInteger(scope.variables, expression.max);
    const step = yield* referenceInteger(scope.variables, expression.step);

    return Option.match(Option.all([min, max, step]), {
      onNone: () => nullOf("integer", "single"),
      onSome: ([least, greatest, by]) => integerDraw(scope.draw, least, greatest, by),
    });
  });

/**
 * Give the float a `qti-random-float`'s `min` or `max` stands for: its literal, or the value of the
 * float variable it names, through `referenceValue` with the kind's checked float facet.
 *
 * @param variables The variables of the attempt.
 * @param reference The attribute's value.
 * @returns The float; none when the named variable holds NULL or a value that is not a single
 *   float, which the validator refuses (P24) on a checked item; or an
 *   {@link UnknownIdentifierError} when it names a variable the variables hold no value of.
 */
const referenceFloat = (
  variables: Variables,
  reference: FloatOrRef,
): Result.Result<Option.Option<number>, UnknownIdentifierError> =>
  Result.map(referenceValue(variables, { baseType: "float", checked: true, reference }), (value) =>
    Option.flatMap(numberOf(value), (single) =>
      single.baseType === "float" ? Option.some(single.value) : Option.none(),
    ),
  );

/**
 * Draw a `qti-random-float`'s value from its resolved bounds, with `u` the stream's next float in
 * [0, 1) (`drawFloat`, two draws): `min + u × (max − min)`, or `min × (1 − u) + max × u` when
 * `max − min` is not finite, so a range across the whole double line gives a finite float; the
 * result is then clamped to `[min, max]`, which a rounding of either form can step past.
 *
 * A bound that is NaN or infinite, or a `max` below `min`, gives NULL before the draw, so it draws
 * nothing (G-R2, pending). Each operation is one IEEE 754 addition, subtraction or multiplication,
 * correctly rounded, so every engine gives the same float for the same draws.
 *
 * @param draw The scope's stream.
 * @param min The least value.
 * @param max The greatest value.
 * @returns The single float, or NULL of a single float.
 */
const floatDraw = (draw: Draw, min: number, max: number): Value => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return nullOf("float", "single");
  }

  const u = drawFloat(draw);
  const span = max - min;
  const drawn = Number.isFinite(span) ? min + u * span : min * (1 - u) + max * u;
  if (drawn < min) {
    return floatValue(min);
  }

  return floatValue(drawn > max ? max : drawn);
};

/**
 * Give the value of a `qti-random-float`: a single float drawn from `[min, max]`
 * ({@link floatDraw}).
 *
 * Its `min` and `max` are resolved first, in that order, each its literal or the value of the
 * variable it names ({@link referenceFloat}); a NULL there gives NULL, before any draw.
 *
 * @param expression The `qti-random-float`.
 * @param scope The variables of the attempt and the stream it draws from.
 * @returns The single float or its NULL, or an {@link UnknownIdentifierError} when a bound names a
 *   variable the variables hold no value of, which a checked item never reaches.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#AbstractAttribute_ExpressionGroup_qti-random-float
 */
const evaluateRandomFloat: Evaluator<"random-float"> = (expression, scope) =>
  Result.gen(function* drawRandomFloat() {
    const min = yield* referenceFloat(scope.variables, expression.min);
    const max = yield* referenceFloat(scope.variables, expression.max);

    return Option.match(Option.all([min, max]), {
      onNone: () => nullOf("float", "single"),
      onSome: ([least, greatest]) => floatDraw(scope.draw, least, greatest),
    });
  });

/**
 * The references family's evaluators by kind.
 */
export const referencesEvaluators: FamilyTable<
  | "base-value"
  | "correct"
  | "default"
  | "map-response"
  | "map-response-point"
  | "null"
  | "random-float"
  | "random-integer"
  | "variable"
> = {
  "base-value": evaluateBaseValue,
  correct: evaluateCorrect,
  default: evaluateDefault,
  "map-response": evaluateMapResponse,
  "map-response-point": evaluateMapResponsePoint,
  null: evaluateNull,
  "random-float": evaluateRandomFloat,
  "random-integer": evaluateRandomInteger,
  variable: evaluateVariable,
};
