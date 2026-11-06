/**
 * The engine's references to variables, a leaf: the value a `qti-variable` reads
 * ({@link variableValue}), from the responses and outcomes the record holds ({@link own}) or from a
 * built-in variable ({@link builtInValue}).
 *
 * It value-imports only `effect` and `#plate/engine/failures.ts`, and reads `Variables` from
 * `#plate/engine/evaluate.ts` as a type.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import type { Value } from "#plate/model/values.ts";

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
export const own = (
  values: Readonly<Record<string, Value>>,
  identifier: string,
): Option.Option<Value> =>
  Object.hasOwn(values, identifier) ? Option.fromUndefinedOr(values[identifier]) : Option.none();

/**
 * Give the value of the built-in variable an identifier names, when the variables carry it: for
 * `numAttempts`, the attempt count as a single integer.
 *
 * @param variables The variables of the attempt.
 * @param identifier The variable's identifier.
 * @returns The value, or none for any other identifier and when the variables carry no count.
 */
export const builtInValue = (variables: Variables, identifier: string): Option.Option<Value> =>
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
export const variableValue = (
  variables: Variables,
  identifier: string,
): Result.Result<Value, UnknownIdentifierError> =>
  Result.fromOption(
    Option.orElse(own(variables.responses, identifier), () =>
      Option.orElse(own(variables.outcomes, identifier), () => builtInValue(variables, identifier)),
    ),
    () => new UnknownIdentifierError({ holder: "record", identifier, role: "variable" }),
  );
