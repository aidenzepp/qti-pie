/**
 * Rosters and closed relations as values (fin.md §17).
 *
 * A roster is a closed vocabulary of handles, each coded by its position. A closed relation is
 * fixed when the schema compiles, so it has no table: grizzle packs it into a constant. This module
 * holds the rows a generator states and answers lookups on the host. It checks no row, packs
 * nothing and sizes nothing: grizzle refuses a value outside its field's code space and a key
 * stated twice when it declares and packs the relation, and a constant past PostgreSQL's longest
 * bit string (README, "Limits"); {@link faultOf} is the same row check for the tests over a
 * composition.
 *
 * The shapes follow grizzle's two declaration forms (grizzle D1 to D3): a roster, and
 * `closed.relation(name, fields, key, rows)`. A key digit is a closed id, a field over a roster
 * (grizzle D2), so a relation's index is the mixed radix of roster codes. A payload field is a
 * closed id or an open-typed value, the latter coded by its active domain within the relation in
 * value order (fin.md §17, "Codes").
 */
import { Array as Arr, Option, Schema } from "effect";
import type { Source, Sources } from "#pantry/vocab/inventory/types.ts";

/**
 * A roster: the handles of a closed vocabulary, each coded by its position.
 *
 * Codes are append-only (grizzle D1): a vocabulary that grows appends handles, so every code an
 * earlier roster gave keeps its handle. A roster's constant is the set of its live codes.
 */
export interface Roster<Handle extends string> {
  /**
   * The roster's name, as a relation keyed by it and its failures name it.
   */
  readonly name: string;
  /**
   * The handles, in code order.
   */
  readonly handles: readonly Handle[];
  /**
   * Find a handle's code.
   *
   * @param handle - The handle.
   * @returns Its code, or none for a string the roster does not hold.
   */
  readonly codeOf: (handle: Primitive) => Option.Option<number>;
  /**
   * Narrow a string to a handle of the roster.
   *
   * @param value - Any string.
   * @returns Whether the roster holds it.
   */
  readonly has: (value: string) => value is Handle;
}

/**
 * A field whose values are a roster's handles: a closed id. Every key field is one.
 */
export interface IdField<Name extends string, Handle extends string> {
  readonly _tag: "id";
  readonly name: Name;
  readonly roster: Roster<Handle>;
}

/**
 * The value types an open-typed payload field holds: values the relation's constant codes by
 * their place in value order, so equal values share a code.
 */
export type Primitive = bigint | boolean | number | string;

/**
 * A payload field of an open type: its code space is the distinct values the relation's rows hold,
 * in value order.
 */
export interface ValueField<Name extends string, Value extends Primitive> {
  readonly _tag: "value";
  readonly name: Name;
  readonly values: readonly Value[];
}

/**
 * A key field over `fin(O, n)` for a closed O (fin.md §17, "The index"): its codes are 0 to n − 1,
 * where n is read per prefix, the values of the key fields before it. Its relation's string is then
 * a dependent sum, Σ o. Fin(n o): a prefix's block sits at the offset of the blocks before it, so
 * no cell is spent on a code a prefix does not have.
 */
export interface DependentField<Name extends string> {
  readonly _tag: "dependent";
  readonly name: Name;
  /**
   * The codes at the widest prefix, each spelled as its numeral; a prefix holds a leading run of
   * them.
   */
  readonly roster: Roster<string>;
  /**
   * How many codes the field has under a prefix.
   *
   * @param prefix - The values of the key fields before the first dependent field.
   * @returns The size of the field's code space there.
   */
  readonly sizeOf: (prefix: Readonly<Record<string, string>>) => number;
}

/**
 * Any key field whose values are a roster's handles.
 */
export type AnyIdField = IdField<string, string>;

/**
 * Any key field: a closed id, or a dependent `fin`.
 */
export type AnyKeyField = AnyIdField | DependentField<string>;

/**
 * Any field, as the encoder reads it.
 */
export type AnyField = AnyIdField | ValueField<string, Primitive>;

/**
 * The value a field holds: a handle of its roster, or a value of its type.
 */
export type ValueOf<F> =
  F extends IdField<string, infer Handle>
    ? Handle
    : F extends ValueField<string, infer Value>
      ? Value
      : F extends DependentField<string>
        ? string
        : never;

/**
 * The row a list of fields describes: under each field's name, one value of its code space.
 */
export type RowOf<Fields extends readonly (AnyField | DependentField<string>)[]> = {
  readonly [F in Fields[number] as F["name"]]: ValueOf<F>;
};

/**
 * A row of a closed relation: its key fields' values and its payload fields' values.
 */
export type Row<
  Key extends readonly AnyKeyField[],
  Payload extends readonly AnyField[],
> = RowOf<Key> & RowOf<Payload>;

/**
 * A row as the encoder reads it: under each field's name, a value of whatever type the field holds.
 */
type AnyRow = Readonly<Record<string, Primitive>>;

/**
 * A closed relation under a declared key: its rows, one per key, each value within its field's code
 * space. A relation with no payload is a set.
 */
export interface Closed<Key extends readonly AnyKeyField[], Payload extends readonly AnyField[]> {
  readonly name: string;
  /**
   * The key's fields in index order, the first the most significant digit. Two rows never share a
   * key.
   */
  readonly key: Key;
  readonly payload: Payload;
  /**
   * The rows as stated, every value within its field's code space.
   */
  readonly rows: readonly Row<Key, Payload>[];
  /**
   * Find the row at a key.
   *
   * @param key - A handle for each key field.
   * @returns The row at that key, or none when the relation holds none there, as for a handle
   *   outside its field's roster.
   */
  readonly lookup: (key: { readonly [F in Key[number] as F["name"]]: string }) => Option.Option<
    Row<Key, Payload>
  >;
}

/**
 * A closed relation whose rows carry their spec source (Bjorn's ruling of 2026-11-05): the
 * XSD particle or declaration a row reads, by file and line in its version, or the specification
 * or spec reading that states it. A refusal maps from its law to its source rule by this lookup,
 * so it explains itself from the law, the row's keys and the grammar's constants. The source is
 * host data: it never enters the relation's constant.
 */
export interface Sourced<
  Key extends readonly AnyKeyField[],
  Payload extends readonly AnyField[],
> extends Closed<Key, Payload> {
  /**
   * Find where the row at a key comes from.
   *
   * @param key - A handle for each key field.
   * @returns The row's source, or none where the relation holds no row.
   */
  readonly sourceOf: (key: {
    readonly [F in Key[number] as F["name"]]: string;
  }) => Option.Option<Source>;
}

/**
 * A row a closed relation states, with where it comes from: the XSD particle or declaration it
 * reads, or the specification or spec reading that states it.
 */
export interface SourcedRow<
  Key extends readonly AnyKeyField[],
  Payload extends readonly AnyField[],
> {
  readonly row: Row<Key, Payload>;
  readonly source: Source;
}

/**
 * Read the source a row of the IR states for one of its versions: a row's sources align with its
 * versions, the first source the first version's (`Sources`).
 *
 * @param sources - The row's sources.
 * @param at - The version's index among the row's versions.
 * @param row - The row, as the defect's message names it: spelled only for the defect, so a load
 *   that meets none spells no row.
 * @returns The version's source.
 * @throws {Error} When the row states no source at the index, so its sources do not align with
 *   its versions: a defect of the leaf or the facet that states it.
 */
export const sourceIn = (sources: Sources, at: number, row: () => string): Source =>
  Option.getOrThrowWith(
    Arr.get(sources, at),
    () =>
      new Error(
        `${row()} states ${String(sources.length)} sources and no source for its version at index ${String(at)}, and a row states one source per version, the first version's first. State the version's source.`,
      ),
  );

/**
 * Read the handle a dependent field's prefix holds in one of the key fields before it.
 *
 * @param prefix - The prefix, each key field before the first dependent one with its handle.
 * @param name - The key field.
 * @returns The field's handle in the prefix.
 * @throws {Error} When no key field before the dependent field has the name, so the field's size
 *   reads a field its relation's key does not hold before it: a defect of the relation's
 *   declaration, met when {@link closed} lays out the key, as the grammar loads.
 */
export const prefixHandle = (prefix: Readonly<Record<string, string>>, name: string): string =>
  Option.getOrThrowWith(
    Arr.findFirst(Object.entries(prefix), ([field]) => field === name).pipe(
      Option.map(([, handle]) => handle),
    ),
    () =>
      new Error(
        `A dependent field's size reads the key field ${name}, and the key holds ${Object.keys(prefix).join(", ") || "no field"} before it. Move ${name} before the dependent field in the key, or read a field the key holds there.`,
      ),
  );

/**
 * Read the rows a grouping holds at a key, as `Map.groupBy` groups them: a group is the rows that
 * have its key, so a key no row has holds none.
 *
 * @param groups - The rows, grouped by key.
 * @param key - The key.
 * @returns The rows at the key, in order; none where no row has it.
 */
export const rowsAt = <K, R>(groups: ReadonlyMap<K, readonly R[]>, key: K): readonly R[] =>
  Option.match(Option.fromNullishOr(groups.get(key)), {
    onNone: () => [],
    onSome: (rows) => rows,
  });

/**
 * The largest `int8`, 2⁶³ − 1: the top of the carrier of a count of children, the bound that bounds
 * nothing where an arity is unbounded.
 */
export const int8Max = 9_223_372_036_854_775_807n;

/**
 * Two rows of a closed relation at one key, a fault {@link faultOf} finds. A key is a law of the
 * relation (fin.md §17, E4): its string has one cell per key, so the second row has nowhere to go.
 */
export class KeyCollision extends Schema.TaggedError<KeyCollision>()("KeyCollision", {
  key: Schema.String,
  relation: Schema.String,
}) {
  /**
   * The relation, the key it states twice, and the repair.
   */
  override get message(): string {
    return `${this.relation} states two rows at (${this.key}), and a closed relation holds one row per key. State the row once, or move the field that tells the rows apart into the key.`;
  }
}

/**
 * A row of a closed relation whose value for a field is not in that field's code space, so the
 * value has no code: a fault {@link faultOf} finds.
 */
export class OutsideCodeSpace extends Schema.TaggedError<OutsideCodeSpace>()("OutsideCodeSpace", {
  field: Schema.String,
  relation: Schema.String,
  value: Schema.String,
}) {
  /**
   * The relation, the field, the value without a code, and the repair.
   */
  override get message(): string {
    return `${this.relation} has a row whose ${this.field} is ${this.value}, which the field's code space does not hold. Add ${this.value} to the field's values, or correct the row.`;
  }
}

/**
 * A roster that lists one handle twice, so the handle has no single code: a fault {@link repeatOf}
 * finds.
 */
export class RepeatedValue extends Schema.TaggedError<RepeatedValue>()("RepeatedValue", {
  field: Schema.String,
  relation: Schema.String,
  value: Schema.String,
}) {
  /**
   * The roster, the repeated handle, and the repair.
   */
  override get message(): string {
    return `${this.relation}'s field ${this.field} lists ${this.value} twice, so it has no single code. List each value once.`;
  }
}

/**
 * Construct a roster from its handles in code order. It checks no handle: grizzle refuses a roster
 * that lists a handle twice when it declares one (`closed(name, handles)`), and {@link repeatOf}
 * is the same check for the tests over a composition, a roster grizzle never sees among them.
 *
 * @param name - The roster's name.
 * @param handles - The handles, in code order.
 * @returns The roster.
 */
export const roster = <const Handle extends string>(
  name: string,
  handles: readonly Handle[],
): Roster<Handle> => {
  const codes = new Map<Primitive, number>(handles.map((handle, code) => [handle, code]));

  return {
    codeOf: (handle: Primitive) => Option.fromNullishOr(codes.get(handle)),
    handles,
    has: (value: string): value is Handle => codes.has(value),
    name,
  };
};

/**
 * Find the first handle a roster lists twice, which has no single code. A composition's rosters are
 * fixed data, so this is the tests' reading of them (`compose.test.ts`), never a load's.
 *
 * @param held - The roster.
 * @returns The fault, or none.
 */
export const repeatOf = (held: Roster<string>): Option.Option<RepeatedValue> => {
  const seen = new Set<string>();

  return Arr.findFirst(held.handles, (handle) => {
    const repeated = seen.has(handle);
    seen.add(handle);

    return repeated;
  }).pipe(
    Option.map(
      (handle) => new RepeatedValue({ field: "handle", relation: held.name, value: handle }),
    ),
  );
};

/**
 * Construct the roster of the whole numbers 0 to `size` − 1, each spelled as its numeral: the code
 * space of a dense coordinate, `fin(size)`, such as a parent's child positions.
 *
 * @param name - The roster's name.
 * @param size - The number of codes.
 * @returns The roster; its numerals are distinct, so it is always one.
 */
export const fin = (name: string, size: number): Roster<string> => {
  const handles = Array.from({ length: size }, (_, code) => String(code));
  const codes = new Map<Primitive, number>(handles.map((handle, code) => [handle, code]));

  return {
    codeOf: (handle) => Option.fromNullishOr(codes.get(handle)),
    handles,
    has: (value: string): value is string => codes.has(value),
    name,
  };
};

/**
 * Construct a key or payload field over a roster.
 *
 * @param name - The field's name.
 * @param over - The roster whose handles it holds.
 * @returns The field.
 */
export const idField = <const Name extends string, Handle extends string>(
  name: Name,
  over: Roster<Handle>,
): IdField<Name, Handle> => ({ _tag: "id", name, roster: over });

/**
 * Order two values of one primitive type: numbers and bigints by magnitude, strings by code unit,
 * `false` before `true`. The positive branch is needed though V8's sort reads only whether a
 * comparison is below zero: ECMA-262's `Array.prototype.sort` leaves the order
 * implementation-defined for a comparator that is not consistent (§23.1.3.30), as one that never
 * answers positive is not.
 *
 * @param left - A value.
 * @param right - A value of the same type.
 * @returns Negative, zero or positive, as `left` sorts before, with or after `right`.
 */
const byValue = <Value extends Primitive>(left: Value, right: Value): number => {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

/**
 * Construct an open-typed payload field from the values its relation's rows hold: its code space
 * is their distinct values in value order (fin.md §17). These codes never leave the constant, so
 * they need no stability across rows that change.
 *
 * @param name - The field's name.
 * @param column - The field's value in every row.
 * @returns The field, each distinct value once, ascending.
 */
export const valueField = <const Name extends string, Value extends Primitive>(
  name: Name,
  column: Iterable<Value>,
): ValueField<Name, Value> => ({
  _tag: "value",
  name,
  values: [...new Set(column)].toSorted(byValue),
});

/**
 * Construct a dependent `fin` key field.
 *
 * @param name - The field's name.
 * @param over - The codes at the widest prefix.
 * @param sizeOf - The size of its code space under a prefix.
 * @returns The field.
 */
export const dependentField = <const Name extends string>(
  name: Name,
  over: Roster<string>,
  sizeOf: (prefix: Readonly<Record<string, string>>) => number,
): DependentField<Name> => ({ _tag: "dependent", name, roster: over, sizeOf });

/**
 * Write a row's values under its fields' names, for a failure's message.
 *
 * @param fields - The fields to write, in order.
 * @param row - The row.
 * @returns Each field's name and the row's value, comma-separated.
 */
const spell = (fields: readonly (AnyField | DependentField<string>)[], row: AnyRow): string =>
  fields.map(({ name }) => `${name} ${String(row[name])}`).join(", ");

/**
 * A key as a lookup names it: a handle for each key field.
 */
type KeyOf<Key extends readonly AnyKeyField[]> = {
  readonly [F in Key[number] as F["name"]]: string;
};

/**
 * Write the text a row's key is found by: its key fields' handles in key order, NUL between them,
 * as grizzle keys a closed relation's rows (`closedRows`, `schema/relation.ts`). No handle holds
 * NUL, which no XML name, URI or numeral does, so two keys write one text exactly when they are
 * one key.
 *
 * @param key - The key's fields.
 * @param row - The row, or a lookup's key.
 * @returns The key's text.
 */
const keyTextOf = (key: readonly AnyKeyField[], row: Readonly<Record<string, unknown>>): string =>
  key.map(({ name }) => String(row[name])).join("\u0000");

/**
 * Index a relation's entries by their rows' keys, for its lookups: the entry at a key, none where
 * no row is, and none for a key that leaves a field out.
 *
 * It checks no row. A row's values lie in their code spaces and its key is its own because the
 * relation's constant says so: grizzle refuses a closed id outside its roster and two rows of one
 * key when `install.ts` declares the relation (`closed.relation`, `closedRows` in grizzle's
 * `schema/relation.ts`), and a slot past its owner's count when it packs the relation
 * (`plannedRelation` in `physical/ddl/constants.ts`); {@link faultOf} is the same check for the
 * tests over a composition, a relation grizzle never sees among them, and no load runs it.
 *
 * @param key - The relation's key fields.
 * @param entries - Its rows, each with whatever the host reads beside it.
 * @returns The entry at a key.
 */
const lookupOf = <Key extends readonly AnyKeyField[], Entry extends { readonly row: AnyRow }>(
  key: Key,
  entries: readonly Entry[],
): ((at: KeyOf<Key>) => Option.Option<Entry>) => {
  const byKey = new Map(entries.map((entry) => [keyTextOf(key, entry.row), entry] as const));

  return (at) =>
    key.every(({ name }) => Object.hasOwn(at, name))
      ? Option.fromNullishOr(byKey.get(keyTextOf(key, at)))
      : Option.none();
};

/**
 * Whether a field's code space holds a row's value: a roster's handle for a closed id, one of its
 * values for an open field, and for a dependent `fin` a code below the size its prefix gives it.
 *
 * @param field - The field.
 * @param value - The row's value under the field's name, if it holds one.
 * @param prefix - The row's handles in the key fields before the key's first dependent one.
 * @returns Whether the value has a code.
 */
const holds = (
  field: AnyField | DependentField<string>,
  value: Primitive | undefined,
  prefix: Readonly<Record<string, string>>,
): boolean => {
  switch (field._tag) {
    case "id": {
      return typeof value === "string" && field.roster.has(value);
    }
    case "value": {
      return field.values.some((held) => held === value);
    }
    case "dependent": {
      return (
        typeof value === "string" &&
        Option.exists(field.roster.codeOf(value), (code) => code < field.sizeOf(prefix))
      );
    }
    default: {
      return field satisfies never;
    }
  }
};

/**
 * Find the first fault of a relation's rows, in row order: a value outside its field's code space,
 * a dependent one past its prefix's size among them, or a second row at a key already stated (E4:
 * a closed relation's string has one cell per key).
 *
 * A composition's relations are fixed data, so this is the tests' reading of them
 * (`compose.test.ts`, over every relation a composition states, and each generator's own test),
 * never a load's: a load builds a relation's lookups and checks nothing ({@link closed}).
 *
 * @param relation - The relation.
 * @param relation.key - Its key's fields in index order.
 * @param relation.name - Its name, as the fault names it.
 * @param relation.payload - The fields outside the key.
 * @param relation.rows - Its rows.
 * @returns The first fault, or none.
 */
export const faultOf = (relation: {
  readonly key: readonly AnyKeyField[];
  readonly name: string;
  readonly payload: readonly AnyField[];
  readonly rows: readonly AnyRow[];
}): Option.Option<KeyCollision | OutsideCodeSpace> => {
  const { key, name, payload, rows } = relation;
  const split = key.findIndex((field) => field._tag === "dependent");
  const prefixFields = split === -1 ? key : key.slice(0, split);
  const fields = [...key, ...payload];
  const seen = new Set<string>();
  for (const row of rows) {
    const prefix = Object.fromEntries(
      prefixFields.map(({ name: field }) => [field, String(row[field])] as const),
    );
    const outside = fields.find((field) => !holds(field, row[field.name], prefix));
    if (outside !== undefined) {
      return Option.some(
        new OutsideCodeSpace({
          field: outside.name,
          relation: name,
          value: String(row[outside.name]),
        }),
      );
    }

    const text = keyTextOf(key, row);
    if (seen.has(text)) {
      return Option.some(new KeyCollision({ key: spell(key, row), relation: name }));
    }

    seen.add(text);
  }

  return Option.none();
};

/**
 * Construct a closed relation from rows of handles and values, answering lookups by key. It
 * checks no row ({@link lookupOf}).
 *
 * @param relation - The relation as a generator states it.
 * @param relation.key - Its key's fields in index order, the first the most significant digit.
 * @param relation.name - Its name, as its laws and its failures name it.
 * @param relation.payload - The fields outside the key, none for a set.
 * @param relation.rows - Its rows.
 * @returns The relation.
 */
export const closed = <
  const Key extends readonly AnyKeyField[],
  const Payload extends readonly AnyField[],
>(relation: {
  readonly key: Key;
  readonly name: string;
  readonly payload: Payload;
  readonly rows: readonly Row<Key, Payload>[];
}): Closed<Key, Payload> => {
  const at = lookupOf(
    relation.key,
    relation.rows.map((row) => ({ row })),
  );

  return {
    key: relation.key,
    lookup: (key) => Option.map(at(key), ({ row }) => row),
    name: relation.name,
    payload: relation.payload,
    rows: relation.rows,
  };
};

/**
 * Construct a closed relation whose rows carry their sources (Bjorn's ruling of 2026-11-05),
 * each row stated with its own: the source is host data, read by key, and never enters the
 * relation's constant. It checks no row ({@link lookupOf}).
 *
 * @param relation - The relation as a generator states it, each row with its source.
 * @param relation.key - Its key's fields in index order, the first the most significant digit.
 * @param relation.name - Its name, as its laws and its failures name it.
 * @param relation.payload - The fields outside the key, none for a set.
 * @param relation.rows - Its rows, each with where it comes from.
 * @returns The relation, answering each key's source.
 */
export const sourced = <
  const Key extends readonly AnyKeyField[],
  const Payload extends readonly AnyField[],
>(relation: {
  readonly key: Key;
  readonly name: string;
  readonly payload: Payload;
  readonly rows: readonly SourcedRow<Key, Payload>[];
}): Sourced<Key, Payload> => {
  const at = lookupOf(relation.key, relation.rows);

  return {
    key: relation.key,
    lookup: (key) => Option.map(at(key), ({ row }) => row),
    name: relation.name,
    payload: relation.payload,
    rows: relation.rows.map(({ row }) => row),
    sourceOf: (key) => Option.map(at(key), ({ source }) => source),
  };
};
