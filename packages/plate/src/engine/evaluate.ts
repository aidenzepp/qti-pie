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
import { Array as Arr, Data, Option, Result } from "effect";
import type {
  AreaMapEntry,
  AreaMapping,
  Expression,
  Item,
  MapEntry,
  Mapping,
  ResponseDeclaration,
  Rule,
} from "#plate/model/item.ts";
import { isNull, match, nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

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
 * The failure of a rule tree that names an identifier the item or the variables do not hold in the
 * role the rule reads it in: a variable or a mapped response with no value, a `qti-correct`, a
 * `qti-map-response` or a `qti-map-response-point` of no declared response, or a
 * `qti-set-outcome-value` of no declared outcome.
 *
 * In a valid item every identifier a rule names is declared, but the variables come from the record
 * the host hands back, which may lack a value, so the evaluator returns it. Its `holder` says which
 * of the two lacks the identifier, and the message names the one to fix.
 */
export class UnknownIdentifierError extends Data.TaggedError("UnknownIdentifierError")<{
  /**
   * What lacks the identifier: `"record"` when the variables, which come from the session record,
   * hold no value of it, and `"item"` when the item declares no modelled response or outcome by
   * that name.
   */
  readonly holder: "item" | "record";

  /**
   * The identifier the rule names.
   */
  readonly identifier: string;

  /**
   * What the rule reads the identifier as.
   */
  readonly role: "outcome" | "response" | "variable";
}> {
  /**
   * The identifier, the role it is read in, what lacks it, and what to pass instead, in one line.
   */
  override get message(): string {
    const identifier = JSON.stringify(this.identifier);

    return this.holder === "record"
      ? `The session record holds no value for ${identifier}, which the rules read as a ${this.role}: pass back, unchanged, the record score returned for this item, or none to start it afresh.`
      : `The rules read ${identifier} as a ${this.role}, and the item holds no ${this.role} by that name: run rules built from this item, with the variables its record holds.`;
  }
}

/**
 * The failure of a `qti-set-outcome-value` whose expression's base type or cardinality differs
 * from the outcome's declaration, which the evaluator returns.
 *
 * QTI assigns without conversion: "floating point values can not be assigned to integer variables
 * and vice-versa", and the expression's type must match the target's. A NULL keeps the type of the
 * expression that gave it, so it is checked the same way. The engine stores no value of another
 * type, so the record always holds each outcome at its declared type.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_SetValue
 */
export class OutcomeMismatchError extends Data.TaggedError("OutcomeMismatchError")<{
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
}> {
  /**
   * The outcome, both types, and the expression to give it, in one line.
   */
  override get message(): string {
    return `The rules set ${JSON.stringify(this.identifier)}, declared ${this.expected}, to a ${this.actual} value: give its qti-set-outcome-value an expression of base type and cardinality ${this.expected}.`;
  }
}

/**
 * The failure of a `qti-map-response` whose response is declared without a `qti-mapping`, or of a
 * `qti-map-response-point` whose response is declared without a `qti-area-mapping`.
 *
 * QTI maps a response "using the associated mapping, which must have been declared", and a point
 * response through its "associated areaMapping"; the evaluator returns it.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
export class UnmappedResponseError extends Data.TaggedError("UnmappedResponseError")<{
  /**
   * The response's identifier.
   */
  readonly identifier: string;

  /**
   * The mapping the expression reads and the declaration lacks: `qti-mapping` for
   * `qti-map-response`, `qti-area-mapping` for `qti-map-response-point`.
   */
  readonly mapping: "qti-area-mapping" | "qti-mapping";
}> {
  /**
   * The response, the mapping it lacks and the two ways to score it, in one line.
   */
  override get message(): string {
    const expression =
      this.mapping === "qti-mapping" ? "qti-map-response" : "qti-map-response-point";

    return `The rules map the response ${JSON.stringify(this.identifier)}, and its declaration has no ${this.mapping}: give the declaration a ${this.mapping}, or score it without ${expression}.`;
  }
}

/**
 * A failure the engine returns: the rules name an identifier the item or the variables do not hold,
 * set an outcome to a value of another type, or map a response that has no mapping.
 */
export type EngineFailure = OutcomeMismatchError | UnknownIdentifierError | UnmappedResponseError;

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
 * Give the value of the built-in variable an identifier names, when the variables carry it: for
 * `numAttempts`, the attempt count as a single integer.
 *
 * @param variables The variables of the attempt.
 * @param identifier The variable's identifier.
 * @returns The value, or none for any other identifier and when the variables carry no count.
 */
const builtInValue = (variables: Variables, identifier: string): Option.Option<Value> =>
  identifier === "numAttempts"
    ? Option.map(Option.fromUndefinedOr(variables.numAttempts), (count): Value => ({
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: count }],
      }))
    : Option.none();

/**
 * Give the value of a `qti-variable`: the response or the outcome of that identifier, else the
 * built-in variable of that name.
 *
 * A declared variable wins over a built-in of the same name, as the prose rules read a reference
 * (`variableType` in `#plate/validate/rules.ts`).
 *
 * @param variables The variables of the attempt.
 * @param identifier The variable's identifier.
 * @returns Its current value, or an {@link UnknownIdentifierError} when neither the responses, the
 *   outcomes nor the built-in variables hold it.
 */
const variableValue = (
  variables: Variables,
  identifier: string,
): Result.Result<Value, UnknownIdentifierError> =>
  Result.fromOption(
    Option.orElse(own(variables.responses, identifier), () =>
      Option.orElse(own(variables.outcomes, identifier), () => builtInValue(variables, identifier)),
    ),
    () => new UnknownIdentifierError({ holder: "record", identifier, role: "variable" }),
  );

/**
 * Find the response declaration a `qti-correct` or a `qti-map-response` names.
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
 * Fold a string's case for a case-insensitive map entry: upper case then lower case, by Unicode's
 * default mappings and independent of locale, so `YORK` and `york`, or `SS` and `ß`, compare
 * equal.
 *
 * @param text The string.
 * @returns Its folded form.
 */
const foldCase = (text: string): string => text.toUpperCase().toLowerCase();

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
 * A value is the sum of the mapped values of the response's distinct values, so a `single` value
 * maps to its one value's, `{B,B,C}` counts `B` once, and a NULL response maps to 0. The mapping's
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
    for (const single of Arr.dedupeWith(response.values, equal)) {
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

/**
 * Convert an exact integer to a float: the nearest double, ties to even. It is the one conversion
 * from an integer to a float (integer plan `10f98260` part C).
 *
 * Beyond 2^53 a double cannot hold every integer, so `2^53 + 1` becomes `2^53`. That loss is the
 * float QTI specifies wherever an integer is compared as one, so it is not reported.
 *
 * @param integer The integer.
 * @returns The nearest double.
 */
// oxlint-disable-next-line unicorn/prefer-native-coercion-functions -- `toFloat` names the one integer-to-float conversion the integer plan fixes, so its precision loss is documented and found in one place.
const toFloat = (integer: bigint): number => Number(integer);

/**
 * Report whether a point lies on the segment between two vertices, its ends included.
 *
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @param from One end, as `[x, y]`.
 * @param to The other end.
 * @returns Whether the point is on the segment.
 */
const onSegment = (
  x: number,
  y: number,
  from: readonly [number, number],
  to: readonly [number, number],
): boolean => {
  const [x1, y1] = from;
  const [x2, y2] = to;

  return (
    (x2 - x1) * (y - y1) === (y2 - y1) * (x - x1) &&
    Math.min(x1, x2) <= x &&
    x <= Math.max(x1, x2) &&
    Math.min(y1, y2) <= y &&
    y <= Math.max(y1, y2)
  );
};

/**
 * Report whether a polygon holds a point: on an edge, or inside by the even-odd rule, as HTML's
 * polygon area is. The last vertex joins the first, so a polygon that is not closed is closed.
 *
 * @param vertices The polygon's vertices, in order.
 * @param x The point's x coordinate.
 * @param y The point's y coordinate.
 * @returns Whether the polygon holds the point.
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#attr-area-shape-poly
 */
const polygonHolds = (
  vertices: readonly (readonly [number, number])[],
  x: number,
  y: number,
): boolean => {
  let inside = false;
  for (const [index, to] of vertices.entries()) {
    const from = vertices.at(index - 1) ?? to;
    if (onSegment(x, y, from, to)) {
      return true;
    }

    const [x1, y1] = from;
    const [x2, y2] = to;
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }

  return inside;
};

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * Report whether an area of each shape holds a point, its boundary included (9.15's default, R-b),
 * from the area's coordinates and the point's, as floats.
 *
 * The coordinates are QTI's, which are HTML's: `rect` is left-x, top-y, right-x, bottom-y;
 * `circle` is center-x, center-y, radius; `ellipse` is center-x, center-y, h-radius, v-radius;
 * `poly` is x1, y1, …, xN, yN; `default` holds every point. Where QTI says nothing, HTML's
 * image-map rules decide: an area with fewer coordinates than its shape needs holds no point,
 * coordinates beyond them are ignored (a `poly`'s odd last one too), a `rect`'s corners may come
 * in either order, and a radius of zero or less holds no point.
 *
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 */
const areaHolds: Readonly<
  Record<AreaMapEntry["shape"], (coords: readonly number[], x: number, y: number) => boolean>
> = {
  circle: ([centerX, centerY, radius], x, y) =>
    centerX !== undefined &&
    centerY !== undefined &&
    radius !== undefined &&
    radius > 0 &&
    (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2,
  default: () => true,
  ellipse: ([centerX, centerY, across, down], x, y) =>
    centerX !== undefined &&
    centerY !== undefined &&
    across !== undefined &&
    down !== undefined &&
    across > 0 &&
    down > 0 &&
    ((x - centerX) / across) ** 2 + ((y - centerY) / down) ** 2 <= 1,
  poly: (coords, x, y) => {
    const vertices = Arr.chunksOf(coords, 2).flatMap(([vertexX, vertexY]) =>
      vertexY === undefined ? [] : [[vertexX, vertexY] as const],
    );

    return vertices.length >= 3 && polygonHolds(vertices, x, y);
  },
  rect: ([left, top, right, bottom], x, y) =>
    left !== undefined &&
    top !== undefined &&
    right !== undefined &&
    bottom !== undefined &&
    Math.min(left, right) <= x &&
    x <= Math.max(left, right) &&
    Math.min(top, bottom) <= y &&
    y <= Math.max(top, bottom),
};

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
 * these defaults (R-b) hold until a ruling changes this function and its tests:
 *
 * - A point on a shape's boundary is inside (`rect`, `circle`, `ellipse` and `poly`, edges included;
 *   `default` holds every point), as {@link areaHolds} reads it.
 * - Areas are tried in document order and the first that holds a point maps it; each area is mapped
 *   at most once.
 * - Each distinct point that falls in no area adds `default-value` once, as `map_response` treats an
 *   unmapped value.
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
  for (const single of Arr.dedupeWith(points, equal)) {
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
 * A single integer or float.
 */
type NumberSingle = Extract<Single, { readonly baseType: "float" | "integer" }>;

/**
 * Give the one number a single integer or float value holds.
 *
 * @param value The value, not NULL.
 * @returns The single integer or float, or none when the value is not a single of a numeric base
 *   type.
 */
const numberOf = (value: Value): Option.Option<NumberSingle> => {
  const [single, ...rest] = value.values;
  if (value.cardinality !== "single" || single === undefined || rest.length > 0) {
    return Option.none();
  }

  return single.baseType === "integer" || single.baseType === "float"
    ? Option.some(single)
    : Option.none();
};

/**
 * Report whether an integer and a float are the same number, exactly: the float is integral and
 * converts to that integer. A float that is integral and finite converts to a `bigint` exactly, so
 * the comparison loses nothing, as `bigint == number` would not (integer plan `10f98260` part C);
 * no integer is converted to a float.
 *
 * @param integer The integer.
 * @param float The float.
 * @returns Whether they are equal.
 */
const integerIsFloat = (integer: bigint, float: number): boolean =>
  Number.isInteger(float) && BigInt(float) === integer;

/**
 * Report whether two numbers are equal exactly: two integers or two floats by value, and an integer
 * and a float as {@link integerIsFloat} compares them, so `1` and `1.0` are equal and `1` and
 * `1.0000000000000002` are not.
 *
 * @param left One number.
 * @param right The other.
 * @returns Whether they are equal.
 */
const sameNumber = (left: NumberSingle, right: NumberSingle): boolean => {
  if (left.baseType === "integer") {
    return right.baseType === "integer"
      ? left.value === right.value
      : integerIsFloat(left.value, right.value);
  }

  return right.baseType === "integer"
    ? integerIsFloat(right.value, left.value)
    : left.value === right.value;
};

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
 * - `variable`: the response's or the outcome's current value.
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
      return Result.map(evaluateExpression(expression.operand, item, variables), (value) =>
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
