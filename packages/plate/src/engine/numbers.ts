/**
 * The engine's numbers, a leaf the evaluator and the expression families share: the one conversion
 * from an integer to a float ({@link toFloat}), the one number a single numeric value holds
 * ({@link numberOf}), exact equality of two numbers ({@link sameNumber}), and the single boolean a
 * test gives ({@link booleanOf}).
 *
 * Integers are exact `bigint`s (reading 45) and floats are 64-bit doubles. An integer and a float
 * compare exactly, never through a lossy conversion. The module value-imports only `Option` from
 * `effect`, and the value model's types.
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
export const toFloat = (integer: bigint): number => Number(integer);

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
