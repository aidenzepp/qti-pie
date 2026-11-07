/**
 * The engine's references to variables: the value a `qti-variable` reads ({@link variableValue}),
 * from the responses and outcomes the record holds ({@link own}) or from a built-in variable
 * ({@link builtInValue}), the type of each built-in the engine holds ({@link builtInType}), and the
 * run-time resolver of an attribute that holds a literal or names a variable
 * ({@link referenceValue}, and {@link referenceInteger} for an integer one).
 *
 * It value-imports only `effect`'s `Option` and `Result`, `#plate/engine/failures.ts`,
 * `#plate/engine/numbers.ts`, `#plate/model/record.ts` and `#plate/model/values.ts`, and reads
 * `Variables` from `#plate/engine/evaluate.ts` and the reference types from
 * `#plate/model/expression.ts` as types, so every expression family may import it.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { integerOf, integerValue } from "#plate/engine/numbers.ts";
import type {
  FloatOrRef,
  IntOrIdentifier,
  IntegerOrRef,
  StringOrRef,
} from "#plate/model/expression.ts";
import { completionStatus, completionStatusType } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

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
 * Give the value of the built-in variable an identifier names that the variables carry apart from
 * the record's responses and outcomes: for `numAttempts`, the attempt count as a single integer.
 *
 * The built-in outcome `completionStatus` is not among them: the record holds it among its
 * outcomes, where the item holds it (`holdsCompletionStatus` in `#plate/model/record.ts`), so
 * {@link variableValue} gives the record's value, as it gives any outcome's.
 *
 * @param variables The variables of the attempt.
 * @param identifier The variable's identifier.
 * @returns The value, or none for any other identifier and when the variables carry no count.
 */
export const builtInValue = (variables: Variables, identifier: string): Option.Option<Value> =>
  identifier === "numAttempts"
    ? Option.map(Option.fromUndefinedOr(variables.numAttempts), integerValue)
    : Option.none();

/**
 * The type of each built-in variable the engine holds: the built-in outcome `completionStatus` a
 * single identifier ({@link completionStatusType}), and `numAttempts` a single integer.
 *
 * `duration` is not among them: the engine holds no value of it, and the item model marks a rule
 * that reads it.
 */
const builtInTypes: ReadonlyMap<string, Pick<Value, "baseType" | "cardinality">> = new Map<
  string,
  Pick<Value, "baseType" | "cardinality">
>([
  [completionStatus, completionStatusType],
  ["numAttempts", { baseType: "integer", cardinality: "single" }],
]);

/**
 * Give the type of a built-in variable the engine holds, from {@link builtInTypes} and never from
 * the attempt, so a built-in's type does not depend on what the attempt holds of it.
 *
 * It is the type a `qti-default` of the built-in gives NULL of: a built-in has no declaration, so
 * no declared default.
 *
 * @param identifier The variable's identifier.
 * @returns Its base type and cardinality, or none for an identifier that names no built-in the
 *   engine holds.
 */
export const builtInType = (
  identifier: string,
): Option.Option<Pick<Value, "baseType" | "cardinality">> =>
  Option.fromUndefinedOr(builtInTypes.get(identifier));

/**
 * Give the value of a `qti-variable`: the response or the outcome of that identifier, the built-in
 * `completionStatus` among the outcomes, else the built-in variable of that name
 * ({@link builtInValue}).
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

/**
 * An attribute that holds a literal or names a variable, with what its kind rule's reference facet
 * says of it: the base type its literal has and a named variable must have, and whether a
 * reference there is checked.
 *
 * The base type ties the attribute's type to its literal's: an `IntegerOrRef` or an
 * `IntOrIdentifier` is an integer, a `FloatOrRef` a float and a `StringOrRef` a string. Every
 * reference facet is checked but `qti-equal`'s `tolerance`, whose reference the validator does
 * not judge (9.11).
 */
export type ReferenceSite =
  | { readonly baseType: "float"; readonly checked: boolean; readonly reference: FloatOrRef }
  | {
      readonly baseType: "integer";
      readonly checked: boolean;
      readonly reference: IntOrIdentifier | IntegerOrRef;
    }
  | { readonly baseType: "string"; readonly checked: boolean; readonly reference: StringOrRef };

/**
 * Construct the single value that holds one single.
 *
 * @param single The single.
 * @returns The value, of the single's base type.
 */
const singleOf = (single: Single): Value => ({
  baseType: single.baseType,
  cardinality: "single",
  values: [single],
});

/**
 * Give the value an attribute that holds a literal or names a variable stands for when its
 * expression is evaluated.
 *
 * A literal gives itself as a single value of its base type: a `StringOrRef` literal its text as
 * written, braces included. A reference gives the named variable's value as {@link variableValue}
 * reads it, and its type is not checked: a NULL or a value of another type is the caller's to turn
 * into the NULL its kind gives. The reader split a `StringOrRef` against the item's declarations
 * (ruling R1), so the resolver never meets a braced name that names nothing.
 *
 * A name the variables hold no value of fails at a checked site, as `qti-variable` does, which a
 * checked item never reaches: the validator refuses a reference to no declaration (P8), and the
 * item model marks one to a variable the engine does not hold. At an unchecked site, `qti-equal`'s
 * `tolerance`, it gives NULL of the site's base type instead (9.11's default).
 *
 * @param variables The variables of the attempt.
 * @param site The attribute's value and its reference facet.
 * @returns The value; or an {@link UnknownIdentifierError} when a checked site names a variable the
 *   variables hold no value of.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IT_Use
 */
export const referenceValue = (
  variables: Variables,
  site: ReferenceSite,
): Result.Result<Value, UnknownIdentifierError> => {
  if (site.reference._tag === "ref") {
    const held = variableValue(variables, site.reference.identifier);

    return site.checked
      ? held
      : Result.succeed(Result.getOrElse(held, () => nullOf(site.baseType, "single")));
  }

  switch (site.baseType) {
    case "float": {
      return Result.succeed(singleOf({ baseType: "float", value: site.reference.value }));
    }
    case "integer": {
      return Result.succeed(singleOf({ baseType: "integer", value: site.reference.value }));
    }
    case "string": {
      return Result.succeed(singleOf({ baseType: "string", value: site.reference.value }));
    }
    default: {
      return site satisfies never;
    }
  }
};

/**
 * Give the integer a checked integer attribute stands for when its expression is evaluated: its
 * literal, or the value of the variable it names, through {@link referenceValue} with a checked
 * integer site, as `qti-any-n`'s bounds, `qti-round-to`'s and `qti-equal-rounded`'s `figures`,
 * `qti-index`'s `n` and `qti-repeat`'s `number-repeats` read it.
 *
 * @param variables The variables of the attempt.
 * @param reference The attribute's value.
 * @returns The integer; none when the named variable holds NULL or a value that is not a single
 *   integer, which the validator refuses (P24) on a checked item; or an
 *   {@link UnknownIdentifierError} when it names a variable the variables hold no value of.
 */
export const referenceInteger = (
  variables: Variables,
  reference: IntOrIdentifier | IntegerOrRef,
): Result.Result<Option.Option<bigint>, UnknownIdentifierError> =>
  Result.map(
    referenceValue(variables, { baseType: "integer", checked: true, reference }),
    integerOf,
  );
