/**
 * The engine's references to variables: the value a `qti-variable` reads ({@link variableValue},
 * and {@link variableRead} with the item a test's run read it through), from the responses,
 * outcomes and template values the attempt holds ({@link own}), from a built-in variable
 * ({@link builtInValue}) or, in a test's run, from an item through its item ref
 * ({@link prefixedRead}); the type of each built-in the run holds ({@link builtInType}); and the
 * run-time resolver of an attribute that holds a literal or names a template or outcome variable
 * ({@link referenceValue}, and {@link referenceInteger} for an integer one).
 *
 * It value-imports only `effect`'s `Option` and `Result`, `#plate/engine/failures.ts`,
 * `#plate/engine/numbers.ts`, `#plate/engine/scope.ts`, `#plate/model/record.ts` and
 * `#plate/model/values.ts`, and reads `Variables` from `#plate/engine/evaluate.ts` and the
 * reference types from `#plate/model/expression.ts` as types, so every expression family may
 * import it.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { integerOf, integerValue, singleValue } from "#plate/engine/numbers.ts";
import { durationOf, prefixedVariable } from "#plate/engine/scope.ts";
import type { ItemName, Reading, ScopeItem, TestScope } from "#plate/engine/scope.ts";
import type {
  FloatOrRef,
  IntOrIdentifier,
  IntegerOrRef,
  StringOrRef,
} from "#plate/model/expression.ts";
import { completionStatus, completionStatusType } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Look up a value by identifier among a map's own keys.
 *
 * The variables come from plain objects, which inherit `Object.prototype`, and `constructor` or
 * `toString` is a valid identifier; reading only own keys keeps an inherited member from being
 * read as a value. A map the variables do not carry, such as the template values of an attempt
 * given none, holds no value by any name.
 *
 * @param values The responses, the outcomes, the template values or an override map, if any.
 * @param identifier The identifier.
 * @returns The value, or none when the map holds no value by that name.
 */
export const own = (
  values: Readonly<Record<string, Value>> | undefined,
  identifier: string,
): Option.Option<Value> =>
  values !== undefined && Object.hasOwn(values, identifier)
    ? Option.fromUndefinedOr(values[identifier])
    : Option.none();

/**
 * Give the value of the built-in variable an identifier names that the variables carry apart from
 * the responses, outcomes and template values: for `numAttempts`, the attempt count as a single
 * integer; for `duration`, in a test's run only, the test's own duration, a single duration of
 * its seconds, or NULL of a single duration when the test scope holds no time (`durationOf` in
 * `#plate/engine/scope.ts`; G-R3, pending: a template default reads the test's duration as NULL).
 *
 * The built-in outcome `completionStatus` is not among them: the record holds it among its
 * outcomes, where the item holds it (`holdsCompletionStatus` in `#plate/model/record.ts`), so
 * {@link variableValue} gives the record's value, as it gives any outcome's. An item's `duration`
 * is not among them either: the engine holds no value of an item's time spent, so with no test
 * scope `duration` gives none.
 *
 * @param variables The variables of the run.
 * @param identifier The variable's identifier.
 * @returns The value, or none for any other identifier, for `numAttempts` when the variables carry
 *   no count, and for `duration` when they carry no test scope.
 */
export const builtInValue = (variables: Variables, identifier: string): Option.Option<Value> => {
  switch (identifier) {
    case "numAttempts": {
      return Option.map(Option.fromUndefinedOr(variables.numAttempts), integerValue);
    }
    case "duration": {
      return Option.map(Option.fromUndefinedOr(variables.test), durationOf);
    }
    default: {
      return Option.none();
    }
  }
};

/**
 * The type of each built-in variable the engine holds in every run: the built-in outcome
 * `completionStatus` a single identifier ({@link completionStatusType}), and `numAttempts` a single
 * integer.
 *
 * `duration` is not among them: the engine holds the test's own `duration` in a test's run only
 * ({@link durationType}), and holds no value of an item's time spent, so the item model marks an
 * item's rule that reads it.
 */
const builtInTypes: ReadonlyMap<string, Pick<Value, "baseType" | "cardinality">> = new Map<
  string,
  Pick<Value, "baseType" | "cardinality">
>([
  [completionStatus, completionStatusType],
  ["numAttempts", { baseType: "integer", cardinality: "single" }],
]);

/**
 * The type of the test's own built-in `duration`, a single duration, which a test's run holds
 * ({@link builtInValue}).
 */
const durationType: Pick<Value, "baseType" | "cardinality"> = {
  baseType: "duration",
  cardinality: "single",
};

/**
 * Give the type of a built-in variable the run holds, from {@link builtInTypes}, and, in a test's
 * run, the test's own `duration` a single duration ({@link durationType}), never from the attempt,
 * so a built-in's type does not depend on what the attempt holds of it. It holds the built-ins
 * {@link builtInValue} gives a value of.
 *
 * It is the type a `qti-default` of the built-in gives NULL of: a built-in declares no default, so
 * a test's `qti-default` of `duration` is NULL of a single duration, timed or not.
 *
 * @param variables The variables of the run, whose test scope, when it has one, makes the run a
 *   test's.
 * @param identifier The variable's identifier.
 * @returns Its base type and cardinality, or none for an identifier that names no built-in the run
 *   holds: `duration` outside a test's run among them.
 */
export const builtInType = (
  variables: Variables,
  identifier: string,
): Option.Option<Pick<Value, "baseType" | "cardinality">> =>
  identifier === "duration"
    ? Option.as(Option.fromUndefinedOr(variables.test), durationType)
    : Option.fromUndefinedOr(builtInTypes.get(identifier));

/**
 * Give the value a test-level read of an item variable stands for.
 *
 * A value of a type the value model holds is itself. NULL of a declared type it does not hold, base
 * type `file` or cardinality `record` (G-R3, pending: such a variable reads NULL), is the NULL
 * `qti-null` gives, a single string's, "treated as if it is of any desired base-type": the value
 * model holds no value of that type, and an outcome set to it stores its own typed NULL
 * (`setOutcome` in `#plate/engine/evaluate.ts`).
 *
 * @param reading The reading.
 * @returns The value.
 */
const readValue = (reading: Reading): Value =>
  reading.kind === "held" ? reading.value : nullOf("string", "single");

/**
 * A prefixed name a test's run reads through an item ref: the item, what the name names in it,
 * whether it names the item's one occurrence, and the value of that variable.
 */
export interface PrefixedName {
  /**
   * Whether the name reads the item's one occurrence: `ITEMREF.VAR` or `ITEMREF.1.VAR`. A name
   * `ITEMREF.N.VAR` with `N` other than 1 names an occurrence that does not exist, since selection
   * with replacement is marked (reading 4; G-R3, pending), and its value is NULL of the variable's
   * type.
   */
  readonly first: boolean;
  readonly item: ScopeItem;
  readonly named: ItemName;
  readonly value: Value;
}

/**
 * Read a prefixed name of a test's processing through its item ref: the one reading of the name
 * that resolves, by reading 48, as `prefixedVariable` in `#plate/engine/scope.ts` resolves it (a
 * name the test declares whole never split, a mapping target before the item's own declaration),
 * with what it names in the item and whether it reads the item's one occurrence.
 *
 * @param test The test scope.
 * @param name The name, as the test's processing writes it.
 * @returns The prefixed name; or the {@link UnknownIdentifierError} `prefixedVariable` gives, with
 *   holder `record`, when no reading or more than one resolves the name, when the test declares it
 *   whole, or when the item's record holds no value of the response or outcome it names.
 */
export const prefixedRead = (
  test: TestScope,
  name: string,
): Result.Result<PrefixedName, UnknownIdentifierError> =>
  Result.map(prefixedVariable(test, name), ({ item, named, occurrence, reading }) => ({
    first: occurrence === 1n,
    item,
    named,
    value: readValue(reading),
  }));

/**
 * What a `qti-variable` reads: the value, and the item a test's run read it through when the name
 * was a prefixed one, which a `weight-identifier` weights through.
 */
export interface VariableRead {
  readonly item: Option.Option<ScopeItem>;
  readonly value: Value;
}

/**
 * Give what a `qti-variable` reads: the response, the outcome or the template variable of that
 * identifier, the built-in `completionStatus` among the outcomes, else the built-in variable of
 * that name ({@link builtInValue}), else, in a test's run, the item variable the name reads through
 * its item ref ({@link prefixedRead}).
 *
 * Declaration identifiers are unique together, so the order responses, outcomes, template values
 * never decides between two declared variables. A declared variable wins over a built-in of the
 * same name, as the prose rules read a reference (`variableType` in `#plate/validate/rules.ts`).
 * With no template values, a template variable is the record's gap. A prefixed name is read
 * through the test scope only when the run's own variables hold no value by that name, so a test
 * outcome named `ITEM1.SCORE` is read as the test's own.
 *
 * @param variables The variables of the run.
 * @param identifier The variable's identifier.
 * @returns The value, with the item when it was read through an item ref; or an
 *   {@link UnknownIdentifierError}, with holder `record`, when neither the responses, the
 *   outcomes, the template values, the built-in variables nor, in a test's run, an item ref hold
 *   it.
 */
export const variableRead = (
  variables: Variables,
  identifier: string,
): Result.Result<VariableRead, UnknownIdentifierError> => {
  const direct = Option.firstSomeOf([
    own(variables.responses, identifier),
    own(variables.outcomes, identifier),
    own(variables.templates, identifier),
    builtInValue(variables, identifier),
  ]);
  if (Option.isSome(direct)) {
    return Result.succeed({ item: Option.none(), value: direct.value });
  }

  return variables.test === undefined
    ? Result.fail(new UnknownIdentifierError({ holder: "record", identifier, role: "variable" }))
    : Result.map(prefixedRead(variables.test, identifier), ({ item, value }) => ({
        item: Option.some(item),
        value,
      }));
};

/**
 * Give the value of a `qti-variable`: what {@link variableRead} reads, unweighted.
 *
 * @param variables The variables of the run.
 * @param identifier The variable's identifier.
 * @returns Its current value, or the {@link UnknownIdentifierError} {@link variableRead} gives.
 */
export const variableValue = (
  variables: Variables,
  identifier: string,
): Result.Result<Value, UnknownIdentifierError> =>
  Result.map(variableRead(variables, identifier), (read) => read.value);

/**
 * An attribute that holds a literal or names a variable, with what its kind rule's reference facet
 * says of it: the base type its literal has and a named variable must have, and whether a
 * reference there is checked.
 *
 * The base type ties the attribute's type to its literal's: an `IntegerOrRef` or an
 * `IntOrIdentifier` is an integer, a `FloatOrRef` a float and a `StringOrRef` a string. Every
 * reference facet is checked but `qti-equal`'s `tolerance`, whose reference the validator does
 * not judge (9.11), so {@link referenceValue} itself keeps an unchecked site to the variables such
 * an attribute may name.
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
 * Give the value an attribute that holds a literal or names a variable stands for when its
 * expression is evaluated.
 *
 * A literal gives itself as a single value of its base type: a `StringOrRef` literal its text as
 * written, braces included. A reference gives the named variable's value, and its type is not
 * checked: a NULL or a value of another type is the caller's to turn into the NULL its kind gives.
 * The reader split a `StringOrRef` against the item's declarations (ruling R1), so the resolver
 * never meets a braced name that names nothing.
 *
 * Such an attribute may name only "a template or outcome variable" (`info.txt:9102-9106`). At a
 * checked site the validator holds a reference to that (P24 refuses a response, a context variable
 * and a built-in; P8 a name nothing declares), so the site reads the variable as
 * {@link variableValue} does, a template value among them and, in a test's run, a prefixed name
 * through its item ref (`n="ITEM1.N"`, which the package accepts), and a name the variables hold
 * no value of fails, as `qti-variable` does, which a checked item never reaches.
 *
 * At an unchecked site, `qti-equal`'s `tolerance`, the validator judges nothing, so the resolver
 * keeps to that rule itself: it reads only the outcomes and the template values the attempt holds,
 * and gives NULL of the site's base type for any other name, a response, the built-in
 * `numAttempts`, a prefixed name or a name nothing declares (9.11's default). The built-in
 * `completionStatus`, which the record holds among its outcomes, is a single identifier, so the
 * caller's type check gives its NULL.
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
    const { identifier } = site.reference;

    return site.checked
      ? variableValue(variables, identifier)
      : Result.succeed(
          Option.getOrElse(
            Option.orElse(own(variables.outcomes, identifier), () =>
              own(variables.templates, identifier),
            ),
            () => nullOf(site.baseType, "single"),
          ),
        );
  }

  switch (site.baseType) {
    case "float": {
      return Result.succeed(singleValue({ baseType: "float", value: site.reference.value }));
    }
    case "integer": {
      return Result.succeed(singleValue({ baseType: "integer", value: site.reference.value }));
    }
    case "string": {
      return Result.succeed(singleValue({ baseType: "string", value: site.reference.value }));
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
