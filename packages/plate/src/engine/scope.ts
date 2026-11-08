/**
 * The test scope: what a test's outcome processing reads of the test's items, and the lookups it
 * reads them through.
 *
 * A test is not an item, so its processing runs with a declarations holder (the evaluator's
 * `Declarations`: the test's outcome declarations, no response and no template variable) and a
 * {@link TestScope}, which the evaluator's `Variables.test` carries. `#plate/engine/refs.ts` reads
 * a prefixed name through {@link prefixedVariable}, and the outcome-only kinds read the items the
 * filters keep ({@link keptItems}) and each item's variable by name ({@link itemVariable}). The
 * scope is data: a session builds it (`testScopeOf` in `#plate/engine/outcome.ts`), and a test may
 * build one by hand.
 *
 * It is a browser module. It value-imports only `effect`'s `Option` and `Result` and two engine
 * leaves, `#plate/engine/failures.ts` and `#plate/engine/numbers.ts`, and reads the model's and the
 * evaluator's types as types: it imports no session value, and none of `#plate/engine/refs.ts`,
 * which reads a prefixed name through it.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Declarations } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { integerValue } from "#plate/engine/numbers.ts";
import type { ScopeRecord } from "#plate/model/record.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";

/**
 * A type a declaration may give a variable: any of QTI's base types, `file` included, and any of
 * its cardinalities, `record` included.
 */
export interface DeclaredType {
  readonly baseType: ModelledBaseType | "file";
  readonly cardinality: Value["cardinality"] | "record";
}

/**
 * One item of the session, as the test's processing reads it: its item ref's identifier,
 * categories, weights and variable mappings; its item's declarations; what its record holds;
 * whether it was presented; and how many of its attempts were processed.
 */
export interface ScopeItem {
  /**
   * The item ref's `category` identifiers.
   */
  readonly categories: readonly string[];
  /**
   * The item's response, outcome and template declarations of modelled types, as its item model
   * holds them.
   */
  readonly declarations: Declarations;
  /**
   * The item ref's variable mappings, each `target-identifier` keyed to its `source-identifier`.
   */
  readonly mappings: ReadonlyMap<string, string>;
  /**
   * The number of the item's attempts processed, which its built-in `numAttempts` reads.
   */
  readonly numAttempts: number;
  /**
   * Whether the candidate has been shown the item.
   */
  readonly presented: boolean;
  /**
   * What the item's record holds: its responses, its outcomes (the built-in `completionStatus`
   * among them), its template values, and the correct responses and defaults its template
   * processing set.
   */
  readonly record: ScopeRecord;
  /**
   * The identifier of the item ref the item delivers.
   */
  readonly ref: string;
  /**
   * The item's declarations of a type the value model holds no value of, base type `file` or
   * cardinality `record`, by identifier. The record never holds a value of one, so a read of one
   * gives NULL of its declared type.
   */
  readonly unheld: ReadonlyMap<string, DeclaredType>;
  /**
   * The item's response declarations of a type the value model holds no value of, by identifier,
   * each keyed to whether it declares a correct response; absent, as in a scope built by hand,
   * when the item makes none. `qti-number-correct` and `qti-number-incorrect` read it: they do not
   * judge an item one of whose responses declares no correct response, and a judged item's unheld
   * response reads NULL, which matches no correct response.
   */
  readonly unheldResponses?: ReadonlyMap<string, boolean>;
  /**
   * The item ref's weights, each `qti-weight`'s `identifier` keyed to its `value`.
   */
  readonly weights: ReadonlyMap<string, number>;
}

/**
 * What a test's processing reads of its items: one entry per session item, in sequence order; the
 * test's parts and sections, each with the item refs it holds; the names the test declares whole;
 * and the test's own `duration`.
 */
export interface TestScope {
  /**
   * The identifiers the test declares: its outcome and context declarations. A dotted one is
   * never split into an item ref and a variable.
   */
  readonly declared: ReadonlySet<string>;
  /**
   * The test's own `duration` in seconds; none in a scope that holds no time, such as a template
   * default's (G-R3, pending: a template default reads the test's duration as NULL).
   */
  readonly duration: Option.Option<number>;
  readonly items: readonly ScopeItem[];
  /**
   * Each test part's identifier, keyed to the identifiers of the item refs it holds at any depth.
   */
  readonly parts: ReadonlyMap<string, readonly string[]>;
  /**
   * Each section's identifier, keyed to the identifiers of the item refs it holds, those of its
   * nested sections included.
   */
  readonly sections: ReadonlyMap<string, readonly string[]>;
}

/**
 * The filters a test-level count or aggregate takes over a test's items: the section whose items
 * it reads and the categories it includes and excludes, each optional. It has the shape of the
 * outcome-only kinds' filters in `#plate/model/expression.ts`, so their variants pass as they are.
 */
export interface ItemFilters {
  readonly excludeCategory: Option.Option<readonly string[]>;
  readonly includeCategory: Option.Option<readonly string[]>;
  readonly sectionIdentifier: Option.Option<string>;
}

/**
 * What a test-level read of an item variable gives: `held`, a value of a type the value model
 * holds, NULL included; or `unheld`, NULL of a declared type it does not hold, base type `file` or
 * cardinality `record`.
 */
export type Reading =
  | { readonly kind: "held"; readonly value: Value }
  | { readonly kind: "unheld"; readonly type: DeclaredType };

/**
 * The item-session built-ins a test reads through an item ref (pantry's `itemSessionBuiltIns`,
 * `processing/env.ts`; `QTI_CONTEXT` is not one).
 */
type ItemBuiltIn = "completionStatus" | "duration" | "numAttempts";

/**
 * What a name read through an item ref names in its item, with the variable's type: one of its
 * declared variables of a modelled type, by the item's own identifier; one of a type the value
 * model does not hold; or an item-session built-in.
 */
export type ItemName =
  | {
      readonly identifier: string;
      readonly kind: "outcome" | "response" | "template";
      readonly type: DeclaredType;
    }
  | { readonly identifier: string; readonly kind: "unheld"; readonly type: DeclaredType }
  | { readonly identifier: ItemBuiltIn; readonly kind: "built-in"; readonly type: DeclaredType };

/**
 * A prefixed name's one resolving reading: the item it reads through, and what it reads.
 */
export interface PrefixedRead {
  readonly item: ScopeItem;
  readonly reading: Reading;
}

/**
 * The type of each item-session built-in, as pantry types it through an item ref
 * (`builtInsOf("item")`, `processing/env.ts`): `duration` is a float in an item.
 */
const itemBuiltIns: Readonly<Record<ItemBuiltIn, DeclaredType>> = {
  completionStatus: { baseType: "identifier", cardinality: "single" },
  duration: { baseType: "float", cardinality: "single" },
  numAttempts: { baseType: "integer", cardinality: "single" },
};

/**
 * Report whether a name is an item-session built-in.
 *
 * @param name The name.
 * @returns Whether it is one.
 */
const isItemBuiltIn = (name: string): name is ItemBuiltIn => Object.hasOwn(itemBuiltIns, name);

/**
 * Look up a value by identifier among a record map's own keys, so an inherited member such as
 * `constructor`, a valid identifier, is never read as a value (as `own` in
 * `#plate/engine/refs.ts` reads the variables, which this module may not value-import).
 *
 * @param values The record's responses, outcomes or template values.
 * @param identifier The identifier.
 * @returns The value, or none when the map holds no value by that name.
 */
const ownValue = (
  values: Readonly<Record<string, Value>>,
  identifier: string,
): Option.Option<Value> =>
  Object.hasOwn(values, identifier) ? Option.fromUndefinedOr(values[identifier]) : Option.none();

/**
 * The occurrence form of a prefixed name's rest, `N.VAR` (reading 4): `N` a decimal from 1, its
 * leading zeros allowed, as pantry's `prefixedReadings` reads it (`processing/prefixed.ts`), so
 * `0.VAR` is no occurrence.
 */
const occurrenceForm = /^(?<occurrence>0*[1-9]\d*)\.(?<variable>.+)$/su;

/**
 * What the rest of a prefixed name names in its item: the occurrence, counted from 1, and the
 * variable's name.
 */
export interface Occurrence {
  readonly occurrence: bigint;
  readonly variable: string;
}

/**
 * Split the rest of a prefixed name, what follows its item ref, into the occurrence it names and
 * the variable: `N.VAR` in the occurrence form (reading 4) names occurrence `N`, and any other rest
 * names occurrence 1 and is the variable whole.
 *
 * @param rest The part of the name after the item ref and its dot.
 * @returns The occurrence and the variable's name.
 */
export const occurrenceOf = (rest: string): Occurrence => {
  const groups = occurrenceForm.exec(rest)?.groups;

  return {
    occurrence: BigInt(groups?.["occurrence"] ?? "1"),
    variable: groups?.["variable"] ?? rest,
  };
};

/**
 * Report whether an item ref's categories share one with a list (9.25; G-R3, pending: one shared
 * category is enough to include an item, and one to exclude it).
 *
 * @param item The item.
 * @param categories The list.
 * @returns Whether they share one.
 */
const sharesCategory = (item: ScopeItem, categories: readonly string[]): boolean =>
  item.categories.some((category) => categories.includes(category));

/**
 * Give the items a test-level count or aggregate reads: those the `section-identifier` holds, the
 * section's nested sections included, then those with a category of `include-category`, then
 * those with none of `exclude-category` (9.25; G-R3, pending: one shared category is enough to
 * include an item, and one to exclude it).
 *
 * An absent filter keeps every item. A written list may be empty: an empty `include-category`
 * keeps no item and an empty `exclude-category` drops none. A `section-identifier` names a section,
 * as QTI's `sectionIdentifier` does ("the assessmentSection with matching identifier"), so one that
 * names no section of the test keeps no item.
 *
 * @param scope The test scope.
 * @param filters The filters.
 * @returns The items kept, in sequence order.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Derived_Number
 */
export const keptItems = (scope: TestScope, filters: ItemFilters): readonly ScopeItem[] => {
  const inSection = filters.sectionIdentifier.pipe(
    Option.map((identifier) => new Set(scope.sections.get(identifier))),
  );

  return scope.items.filter(
    (item) =>
      Option.match(inSection, { onNone: () => true, onSome: (refs) => refs.has(item.ref) }) &&
      Option.match(filters.includeCategory, {
        onNone: () => true,
        onSome: (categories) => sharesCategory(item, categories),
      }) &&
      !Option.exists(filters.excludeCategory, (categories) => sharesCategory(item, categories)),
  );
};

/**
 * Find the declaration an item makes of a variable, of a modelled type or not.
 *
 * Declaration identifiers are unique together, so the order responses, outcomes, template
 * variables, unheld never decides between two.
 *
 * @param item The item.
 * @param identifier The variable's identifier in the item.
 * @returns What it names, none when the item declares nothing by that name.
 */
const declarationOf = (item: ScopeItem, identifier: string): Option.Option<ItemName> => {
  const { outcomes, responses, templates } = item.declarations;
  const declared = (
    kind: "outcome" | "response" | "template",
    declaration: DeclaredType | undefined,
  ): Option.Option<ItemName> =>
    Option.map(Option.fromUndefinedOr(declaration), (type) => ({
      identifier,
      kind,
      type: { baseType: type.baseType, cardinality: type.cardinality },
    }));

  return Option.firstSomeOf([
    declared("response", responses.get(identifier)),
    declared("outcome", outcomes.get(identifier)),
    declared("template", templates.get(identifier)),
    Option.map(Option.fromUndefinedOr(item.unheld.get(identifier)), (type): ItemName => ({
      identifier,
      kind: "unheld",
      type,
    })),
  ]);
};

/**
 * Resolve a name an item is read by, in pantry's order (`resolveReading`, `processing/env.ts`): a
 * target of the item ref's variable mappings names the variable its source names, else the item's
 * own declaration of the name, else an item-session built-in.
 *
 * A mapping counts only when the item declares its source, as pantry keeps a mapping in an item
 * ref's scope; one whose source the item does not declare is passed over. A checked package's
 * mapping source names an outcome of its item, so there the passing over never happens.
 *
 * @param item The item.
 * @param name The name, as the test's processing writes it.
 * @returns What it names, none when it names nothing of the item.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Derived_VariableMapping
 */
export const itemName = (item: ScopeItem, name: string): Option.Option<ItemName> =>
  Option.firstSomeOf([
    Option.flatMap(Option.fromUndefinedOr(item.mappings.get(name)), (source) =>
      declarationOf(item, source),
    ),
    declarationOf(item, name),
    isItemBuiltIn(name)
      ? Option.some<ItemName>({ identifier: name, kind: "built-in", type: itemBuiltIns[name] })
      : Option.none<ItemName>(),
  ]);

/**
 * Give the reading of a value the record holds.
 *
 * @param value The value.
 * @returns It, `held`.
 */
const held = (value: Value): Reading => ({ kind: "held", value });

/**
 * Give NULL of a declared type.
 *
 * @param type The type.
 * @returns The `held` NULL of a type the value model holds, else the `unheld` NULL.
 */
const nullReading = (type: DeclaredType): Reading => {
  const { baseType, cardinality } = type;

  return baseType === "file" || cardinality === "record"
    ? { kind: "unheld", type }
    : { kind: "held", value: { baseType, cardinality, values: [] } };
};

/**
 * Read the value of the variable a name names in an item, from its record.
 *
 * - A response or an outcome reads the record's value; a record that holds none is the record's gap,
 *   as a stored record lacking a value is in an item's own processing.
 * - A template variable reads the record's value; with none, because the item has not been presented
 *   or its template processing does not run, it reads NULL of its declared type (G-R3, pending: an
 *   item variable with no value reads NULL; Admission A3).
 * - A variable of base type `file` or cardinality `record` reads NULL of its declared type, which the
 *   record never holds (G-R3, pending).
 * - The built-in `numAttempts` reads the processed attempt count, a single integer, and
 *   `completionStatus` the record's outcome of that name. The engine holds no item's `duration`,
 *   and the test model marks a processing that reads it, so it is the record's gap.
 *
 * @param item The item.
 * @param named What the name names.
 * @returns The reading, or an {@link UnknownIdentifierError} with holder `record` when the record
 *   holds no value of a response, an outcome, `completionStatus` or `duration`.
 */
const readingOf = (
  item: ScopeItem,
  named: ItemName,
): Result.Result<Reading, UnknownIdentifierError> => {
  const { record } = item;
  const gap = (role: "outcome" | "response" | "variable") =>
    new UnknownIdentifierError({ holder: "record", identifier: named.identifier, role });

  switch (named.kind) {
    case "response": {
      return Result.fromOption(Option.map(ownValue(record.responses, named.identifier), held), () =>
        gap("response"),
      );
    }
    case "outcome": {
      return Result.fromOption(Option.map(ownValue(record.outcomes, named.identifier), held), () =>
        gap("outcome"),
      );
    }
    case "template": {
      return Result.succeed(
        Option.match(ownValue(record.templates, named.identifier), {
          onNone: () => nullReading(named.type),
          onSome: held,
        }),
      );
    }
    case "unheld": {
      return Result.succeed(nullReading(named.type));
    }
    case "built-in": {
      if (named.identifier === "numAttempts") {
        return Result.succeed(held(integerValue(BigInt(item.numAttempts))));
      }

      return named.identifier === "completionStatus"
        ? Result.fromOption(Option.map(ownValue(record.outcomes, named.identifier), held), () =>
            gap("outcome"),
          )
        : Result.fail(gap("variable"));
    }
    default: {
      return named satisfies never;
    }
  }
};

/**
 * Give the value of an item variable by name, as `qti-test-variables`, `qti-outcome-minimum` and
 * `qti-outcome-maximum` read one: the variable {@link itemName} resolves the name to, read from
 * the item's record.
 *
 * A response or an outcome reads the record's value, a template variable the record's value or,
 * with none, NULL of its declared type, a variable of base type `file` or cardinality `record`
 * NULL of its declared type, `numAttempts` the processed attempt count and `completionStatus` the
 * record's (G-R3, pending: an item variable with no value reads NULL; Admission A3).
 *
 * @param item The item.
 * @param name The name, as the test's processing writes it.
 * @returns The reading; or an {@link UnknownIdentifierError}: with holder `item` when the name
 *   names nothing of the item, or with holder `record` when the record holds no value of a
 *   declared response or outcome.
 */
export const itemVariable = (
  item: ScopeItem,
  name: string,
): Result.Result<Reading, UnknownIdentifierError> =>
  Option.match(itemName(item, name), {
    onNone: () =>
      Result.fail(
        new UnknownIdentifierError({ holder: "item", identifier: name, role: "variable" }),
      ),
    onSome: (named) => readingOf(item, named),
  });

/**
 * One reading of a dotted name that resolves (reading 48): through an item ref, the item variable
 * its rest names at an occurrence; or a part's or a section's `duration`.
 */
type Resolved =
  | {
      readonly item: ScopeItem;
      readonly kind: "item";
      readonly named: ItemName;
      readonly occurrence: bigint;
    }
  | { readonly kind: "duration" };

/**
 * Resolve one reading of a dotted name, in pantry's order (`resolveReading`,
 * `processing/env.ts`), as the package resolves it (`readingOf` in `#plate/package/open.ts`).
 *
 * After an item ref, the rest names, directly or in the occurrence form `N.VAR` (reading 4), what
 * {@link itemName} resolves it to. After a part or a section, the rest is its `duration`.
 *
 * @param scope The test scope.
 * @param prefix The part before the dot the reading splits at.
 * @param rest The part after it.
 * @returns The reading, none when it does not resolve.
 */
const resolve = (scope: TestScope, prefix: string, rest: string): Option.Option<Resolved> => {
  const item = scope.items.find((each) => each.ref === prefix);
  if (item === undefined) {
    return (scope.parts.has(prefix) || scope.sections.has(prefix)) && rest === "duration"
      ? Option.some({ kind: "duration" })
      : Option.none();
  }

  const { occurrence, variable } = occurrenceOf(rest);

  return Option.map(itemName(item, variable), (named) => ({
    item,
    kind: "item",
    named,
    occurrence,
  }));
};

/**
 * Give the value of a dotted name, a prefixed reference of a test's processing, by reading 48.
 *
 * A name has one reading for each dot it may split at, from the first, and the name reads its one
 * resolving reading ({@link resolve}): `ITEMREF.VAR` and `ITEMREF.1.VAR` read the item's variable
 * as {@link itemVariable} does, a mapping target first. `ITEMREF.N.VAR` with `N` other than 1
 * names an occurrence that does not exist, since selection with replacement is marked, and reads
 * NULL of the variable's type (G-R3, pending; Admission A3).
 *
 * A name the test declares whole is never split. A name no reading resolves, or two readings
 * resolve (Admission A4), reads nothing: on a checked package the first is refused
 * `undeclared-variable` and the second `ambiguous-reference`, so only a test and items checked
 * apart reach either. The engine holds no part's or section's `duration`, and the test model marks
 * a processing that reads one, so that reading reads nothing too.
 *
 * @param scope The test scope.
 * @param name The name, as the test's processing writes it.
 * @returns The item the name reads through and its reading; or an {@link UnknownIdentifierError}
 *   with holder `record` when the test declares the name whole, when no reading or more than one
 *   resolves it, when it reads a part's or a section's `duration`, or when the item's record holds
 *   no value of the response or outcome it names.
 */
export const prefixedVariable = (
  scope: TestScope,
  name: string,
): Result.Result<PrefixedRead, UnknownIdentifierError> => {
  const nothing = new UnknownIdentifierError({
    holder: "record",
    identifier: name,
    role: "variable",
  });
  if (scope.declared.has(name)) {
    return Result.fail(nothing);
  }

  const readings: Resolved[] = [];
  for (let dot = name.indexOf("."); dot !== -1; dot = name.indexOf(".", dot + 1)) {
    readings.push(...Option.toArray(resolve(scope, name.slice(0, dot), name.slice(dot + 1))));
  }

  const [only, ...more] = readings;
  if (only === undefined || more.length > 0 || only.kind === "duration") {
    return Result.fail(nothing);
  }

  const { item, named, occurrence } = only;
  if (occurrence !== 1n) {
    return Result.succeed({ item, reading: nullReading(named.type) });
  }

  return Result.map(readingOf(item, named), (reading) => ({ item, reading }));
};

/**
 * Give the weight an item ref gives a variable: its `qti-weight` of that identifier, else 1.0
 * (G-R3, pending: a weight the item ref does not define is 1.0).
 *
 * @param item The item.
 * @param identifier The `weight-identifier`.
 * @returns The weight.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#DataCharacteristic_Weight
 */
export const weightOf = (item: ScopeItem, identifier: string): number =>
  item.weights.get(identifier) ?? 1;

/**
 * Give the value of the test's own built-in `duration`: a single duration of its seconds, or NULL
 * of base type duration when the scope holds no time (G-R3, pending: a template default reads the
 * test's duration as NULL).
 *
 * @param scope The test scope.
 * @returns The value.
 */
export const durationOf = (scope: TestScope): Value => ({
  baseType: "duration",
  cardinality: "single",
  values: Option.match(scope.duration, {
    onNone: () => [],
    onSome: (seconds) => [{ baseType: "duration", value: seconds }],
  }),
});
