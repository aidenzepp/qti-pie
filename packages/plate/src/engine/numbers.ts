/**
 * The engine's numbers, a leaf the evaluator and the expression families share: the one conversion
 * from an integer to a float ({@link toFloat}), the one number a single numeric value holds
 * ({@link numberOf}), exact equality of two numbers ({@link sameNumber}), the single boolean a
 * test gives ({@link booleanOf}), and the bounds on what the engine computes
 * ({@link integerBitBound}, {@link containerSizeBound}).
 *
 * Integers are exact `bigint`s (reading 45) and floats are 64-bit doubles, never infinite when made
 * from an integer. An integer and a float compare exactly, never through a lossy conversion. The
 * module value-imports only `Option` from `effect`, and the value model's types.
 *
 * @module
 */
import { Option } from "effect";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value.
 */
export const booleanOf = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * Convert an exact integer to a float: the nearest double, ties to even, and the largest finite
 * double of its sign for an integer beyond it. It is the one conversion from an integer to a float
 * (integer plan `10f98260` part C), so every kind that makes a float of an integer clamps alike.
 *
 * Beyond 2^53 a double cannot hold every integer, so `2^53 + 1` becomes `2^53`. That loss is the
 * float QTI specifies wherever an integer is compared as one, so it is not reported.
 *
 * An integer has no largest value (reading 45), and the float base type holds no infinity, so "an
 * integer beyond the largest finite float becomes the largest finite float of its sign" (reading
 * 45): from 2^1024 − 2^970, the least integer whose nearest double is an infinity, `10^400`
 * among them, it gives `Number.MAX_VALUE`, and its negative `-Number.MAX_VALUE`. `Number` of a
 * `bigint` is never NaN.
 *
 * @param integer The integer.
 * @returns The nearest double, finite.
 */
export const toFloat = (integer: bigint): number => {
  const nearest = Number(integer);
  if (nearest === Number.POSITIVE_INFINITY) {
    return Number.MAX_VALUE;
  }

  return nearest === Number.NEGATIVE_INFINITY ? -Number.MAX_VALUE : nearest;
};

/**
 * A single integer or float.
 */
export type NumberSingle = Extract<Single, { readonly baseType: "float" | "integer" }>;

/**
 * Give the one number a single integer or float value holds.
 *
 * @param value The value, not NULL.
 * @returns The single integer or float, or none when the value is not a single of a numeric base
 *   type.
 */
export const numberOf = (value: Value): Option.Option<NumberSingle> => {
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
export const sameNumber = (left: NumberSingle, right: NumberSingle): boolean => {
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
 * The most bits an integer the engine computes may have: 1,000,000 (the operator's ruling
 * `afb7e648`, option B). An integer is unbounded (reading 45), so an item whose rules square an
 * outcome rule after rule would double its size each time and hang scoring; a computed integer
 * past this bound is NULL instead, as other impossible results are. An integer as written (a
 * literal, a declared default, a stored value) is never held to it.
 */
export const integerBitBound = 1_000_000;

/**
 * The most values a container the engine computes may hold: 1,000,000, the principle of the
 * operator's ruling `afb7e648` applied to containers. A computed container past it is NULL instead,
 * so `qti-repeat` with a `number-repeats` of 2147483647 cannot hang scoring. A container as written
 * or stored is never held to it.
 */
export const containerSizeBound = 1_000_000;

/**
 * Give the number of bits an integer has: the binary digits of its magnitude, so 0 has none, 1 has
 * one and 2^999999 has 1,000,000, and an integer and its negative have the same. It reads the
 * hexadecimal digits, which `bigint` writes in time linear in its size.
 *
 * @param integer The integer.
 * @returns Its bit length.
 */
export const bitLengthOf = (integer: bigint): number => {
  if (integer === 0n) {
    return 0;
  }

  const digits = (integer < 0n ? -integer : integer).toString(16);

  return (digits.length - 1) * 4 + 32 - Math.clz32(Number.parseInt(digits.charAt(0), 16));
};

/**
 * Give an integer the engine computed when it is within {@link integerBitBound}.
 *
 * @param integer The computed integer.
 * @returns The integer, or none when it has more than 1,000,000 bits, for the kind's NULL.
 */
export const boundedInteger = (integer: bigint): Option.Option<bigint> =>
  bitLengthOf(integer) <= integerBitBound ? Option.some(integer) : Option.none();

/**
 * Give the product of two integers when it is within {@link integerBitBound}, without computing a
 * product that must be past it: a product of two integers that are not 0, of `a` and `b` bits, has
 * `a + b` or `a + b − 1` bits, so one whose operands' bits sum to more than the bound plus one is
 * none before any multiplication, and any other is computed, at most one bit past the bound, and
 * checked exactly. A product with 0 is 0, whatever the other's size.
 *
 * @param left One integer.
 * @param right The other.
 * @returns The product, or none when it has more than 1,000,000 bits.
 */
export const boundedProduct = (left: bigint, right: bigint): Option.Option<bigint> => {
  if (left === 0n || right === 0n) {
    return Option.some(0n);
  }

  return bitLengthOf(left) + bitLengthOf(right) > integerBitBound + 1
    ? Option.none()
    : boundedInteger(left * right);
};

/**
 * Report whether a container the engine computes, of a size, is within {@link containerSizeBound}.
 *
 * @param size How many values it holds, or would hold if it were built.
 * @returns Whether it holds at most 1,000,000 values.
 */
export const withinContainerBound = (size: bigint): boolean => size <= BigInt(containerSizeBound);
