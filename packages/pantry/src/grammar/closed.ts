/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Rosters and closed relations as values, and the shape of the constant each relation erases to
 * (fin.md §17).
 *
 * A roster is a closed vocabulary of handles, each coded by its position. A closed relation is
 * fixed when the schema compiles, so it has no table: grizzle packs it into one bit string, read
 * `width` bits at a time at its key's index. This module holds the rows a generator states,
 * refuses the rows no constant can hold, sizes the constant, and answers lookups on the host. It
 * packs nothing; grizzle does.
 *
 * The shapes follow grizzle's two declaration forms (grizzle D1 to D3): a roster, and
 * `closed.relation(name, fields, key, rows)`. A key digit is a closed id, a field over a roster
 * (grizzle D2), so a relation's index is the mixed radix of roster codes. A payload field is a
 * closed id or an open-typed value, the latter coded by its active domain within the relation in
 * value order (fin.md §17, "Codes").
 */
import { Array as Arr, Option, Result, Schema } from "effect";
import type { Source } from "#pantry/vocab/inventory/types.ts";

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
 * Any roster, as the encoder reads it.
 */
export type AnyRoster = Roster<string>;

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
 * A closed relation under a declared key, and the shape of the string of cells it erases to.
 *
 * The string has one cell per point of the key's code space. A row's cell sits at its key's
 * mixed-radix index, row-major over `key` in declared order: `((k₁·|K₂| + k₂)·|K₃| + k₃)…`, each kᵢ
 * the row's code in its key field. A cell is 0 where the relation holds no row, and 1 + c where it
 * does, c being the mixed-radix code of the row's payload values. A relation with no payload is a
 * set, and its cells are single bits.
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
   * The string's length in cells: the product of the key fields' roster sizes, a dependent field's
   * size summed over its prefixes.
   */
  readonly cells: number;
  /**
   * The bits per cell, w = ⌈log₂(1 + |payload space|)⌉, with |payload space| the product of the
   * payload fields' code-space sizes: the fewest bits that hold 0 for absent and 1 + c for every
   * payload code c. A set's payload space has one point, so its width is 1.
   */
  readonly width: number;
  /**
   * The constant's size as PostgreSQL stores it, before compression: ⌈cells · width / 8⌉ bytes of
   * bits after an 8-byte header.
   */
  readonly bytes: number;
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
 * Any closed relation, as a size report or a reader reads it.
 */
export type AnyClosed = Closed<readonly AnyKeyField[], readonly AnyField[]>;

/**
 * A closed relation whose rows carry their spec source (the operator's ruling of 2026-11-05): the
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
 * Give a closed relation's rows their sources.
 *
 * @param relation - The relation.
 * @param source - Where a row comes from, read from the row.
 * @returns The relation, answering each key's source.
 */
export const sourced = <
  const Key extends readonly AnyKeyField[],
  const Payload extends readonly AnyField[],
>(
  relation: Closed<Key, Payload>,
  source: (row: Row<Key, Payload>) => Source,
): Sourced<Key, Payload> => ({
  ...relation,
  sourceOf: (key) => Option.map(relation.lookup(key), source),
});

/**
 * The largest `int2`, 2¹⁵ − 1: the top of the carrier of `Node.state` and `Node.hi`, the bound that
 * bounds nothing where an order interval is free.
 */
export const int2Max = 32_767;

/**
 * The largest `int8`, 2⁶³ − 1: the top of the carrier of a count of children, the bound that bounds
 * nothing where an arity is unbounded.
 */
export const int8Max = 9_223_372_036_854_775_807n;

/**
 * The most bits one PostgreSQL bit string holds, `VARBITMAXLEN` = INT_MAX − 7 (19rc1,
 * `src/include/utils/varbit.h:83`). A closed relation's constant is one bit string, so no relation
 * exceeds it, and every index below it is an exact JavaScript integer.
 */
export const varbitMaxBits = 2_147_483_647 - 7;

/**
 * The bytes PostgreSQL stores before a bit string's bits: the 4-byte varlena header and the 4-byte
 * bit length (`VARBITTOTALLEN`, 19rc1, `src/include/utils/varbit.h:77`).
 */
const bitStringHeader = 8;

/**
 * Two rows of a closed relation at one key. A key is a law of the relation (fin.md §17, E4): its
 * string has one cell per key, so the second row has nowhere to go.
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
 * value has no code.
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
 * A roster that lists one handle twice, so the handle has no single code.
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
 * A closed relation whose string of cells is longer than one PostgreSQL bit string can be.
 */
export class BeyondConstant extends Schema.TaggedError<BeyondConstant>()("BeyondConstant", {
  bits: Schema.Number,
  max: Schema.Number,
  relation: Schema.String,
}) {
  /**
   * The relation, the bits it needs against the cap, and the repair.
   */
  override get message(): string {
    return `${this.relation} needs ${this.bits} bits, and one PostgreSQL bit string holds at most ${this.max}. Give its key denser coordinates, so that its code spaces multiply to fewer cells.`;
  }
}

/**
 * The ways a stated closed relation has no constant.
 */
export type ClosedRelationError = BeyondConstant | KeyCollision | OutsideCodeSpace | RepeatedValue;

/**
 * Construct a roster from its handles in code order.
 *
 * @param name - The roster's name.
 * @param handles - The handles, in code order.
 * @returns The roster, or the first handle it lists twice.
 */
export const roster = <const Handle extends string>(
  name: string,
  handles: readonly Handle[],
): Result.Result<Roster<Handle>, RepeatedValue> => {
  const codes = new Map<Primitive, number>(handles.map((handle, code) => [handle, code]));

  return Arr.findFirst(handles, (handle, code) => codes.get(handle) !== code).pipe(
    Option.match({
      onNone: () =>
        Result.succeed({
          codeOf: (handle: Primitive) => Option.fromNullishOr(codes.get(handle)),
          handles,
          has: (value: string): value is Handle => codes.has(value),
          name,
        }),
      onSome: (handle) =>
        Result.fail(new RepeatedValue({ field: "handle", relation: name, value: handle })),
    }),
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
 * `false` before `true`.
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
 * A field's code space, every value it ranges over in code order, at its widest.
 *
 * @param field - The field.
 * @returns A roster's handles, or an open field's values.
 */
const spaceOf = (field: AnyField | DependentField<string>): readonly unknown[] =>
  field._tag === "value" ? field.values : field.roster.handles;

/**
 * Code a value in a field's code space.
 *
 * @param field - The field.
 * @param value - The value.
 * @returns Its code, or none for a value outside the code space.
 */
const codeIn = (
  field: AnyField | DependentField<string>,
  value: Primitive | undefined,
): Option.Option<number> => {
  if (value === undefined) {
    return Option.none();
  }

  return field._tag === "value"
    ? Arr.findFirstIndex(field.values, (held) => held === value)
    : field.roster.codeOf(value);
};

/**
 * Compute a row's mixed-radix index over fields, the first field the most significant digit.
 *
 * @param fields - The fields, in index order.
 * @param row - The row, holding a value under each field's name.
 * @returns The index, or the first field whose code space does not hold the row's value.
 */
const indexIn = <F extends AnyField | DependentField<string>>(
  fields: readonly F[],
  row: AnyRow,
): Result.Result<number, F> => {
  let index = 0;
  for (const field of fields) {
    const code = codeIn(field, row[field.name]);
    if (Option.isNone(code)) {
      return Result.fail(field);
    }

    index = index * spaceOf(field).length + code.value;
  }

  return Result.succeed(index);
};

/**
 * Multiply the code-space sizes of fields: the number of mixed-radix codes over them.
 *
 * @param fields - The fields.
 * @returns The product of their code-space sizes, 1 for no fields.
 */
const pointsOf = (fields: readonly (AnyField | DependentField<string>)[]): number =>
  fields.reduce((points, field) => points * spaceOf(field).length, 1);

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
 * The index space of a key: its leading closed ids, and the dependent fields that follow them
 * (with any closed ids among them), each prefix's block at its offset.
 */
interface Layout {
  readonly cells: number;
  readonly indexOf: (row: AnyRow) => Result.Result<number, AnyField | DependentField<string>>;
}

/**
 * Lay out a key's index space: row-major mixed radix over the closed ids before the first dependent
 * field, then each such prefix's block, the mixed radix of the remaining fields at the sizes the
 * prefix gives them, at the sum of the earlier prefixes' block sizes (fin.md §17, "The index").
 *
 * @param key - The key's fields.
 * @returns The layout.
 */
const layoutOf = (key: readonly AnyKeyField[]): Layout => {
  const split = key.findIndex((field) => field._tag === "dependent");
  if (split === -1) {
    return { cells: pointsOf(key), indexOf: (row) => indexIn(key, row) };
  }

  const prefix = key.slice(0, split);
  const rest = key.slice(split);
  const prefixes = pointsOf(prefix);
  const prefixRow = (index: number) => {
    const digits: (readonly [string, string])[] = [];
    let remaining = index;
    for (const field of prefix.toReversed()) {
      const size = spaceOf(field).length;
      digits.push([field.name, String(spaceOf(field)[remaining % size])]);
      remaining = Math.floor(remaining / size);
    }

    return Object.fromEntries(digits);
  };
  const sizesOf = (row: Readonly<Record<string, string>>) =>
    rest.map((field) => (field._tag === "dependent" ? field.sizeOf(row) : spaceOf(field).length));
  const offsets = new Float64Array(prefixes + 1);
  for (let index = 0; index < prefixes; index += 1) {
    offsets[index + 1] =
      (offsets[index] ?? 0) +
      sizesOf(prefixRow(index)).reduce((product, size) => product * size, 1);
  }

  return {
    cells: offsets[prefixes] ?? 0,
    indexOf: (row) =>
      Result.flatMap(indexIn(prefix, row), (at) => {
        const sizes = sizesOf(
          Object.fromEntries(prefix.map(({ name }) => [name, String(row[name])])),
        );
        let index = 0;
        for (const [position, field] of rest.entries()) {
          const code = codeIn(field, row[field.name]);
          const size = sizes[position] ?? 0;
          if (Option.isNone(code) || code.value >= size) {
            return Result.fail(field);
          }

          index = index * size + code.value;
        }

        return Result.succeed((offsets[at] ?? 0) + index);
      }),
  };
};

/**
 * Construct closed relations whose string of cells may hold at most `maxBits` bits: production's
 * cap is {@link varbitMaxBits}, which {@link closed} applies; a test gives a small one, so the edge
 * lies within the relations it can draw.
 *
 * Every value must lie in its field's code space, no two rows may share a key (E4), and the string
 * of cells must fit the cap.
 *
 * @param maxBits - The most bits a relation's string may hold.
 * @returns The constructor: from the relation as a generator states it (its name, as its laws and
 *   its failures name it; its key's fields in index order, the first the most significant digit;
 *   the fields outside the key, none for a set; and its rows), the relation, or the first reason
 *   it has no constant.
 */
export const closedWithin =
  (maxBits: number) =>
  <const Key extends readonly AnyKeyField[], const Payload extends readonly AnyField[]>(relation: {
    readonly key: Key;
    readonly name: string;
    readonly payload: Payload;
    readonly rows: readonly Row<Key, Payload>[];
  }): Result.Result<Closed<Key, Payload>, ClosedRelationError> =>
    Result.gen(function* parseClosed() {
      const { key, name, payload, rows } = relation;
      const layout = layoutOf(key);
      const { cells } = layout;
      const width = pointsOf(payload).toString(2).length;
      const bits = cells * width;

      if (bits > maxBits) {
        return yield* Result.fail(new BeyondConstant({ bits, max: maxBits, relation: name }));
      }

      const byIndex = new Map<number, Row<Key, Payload>>();
      const outside = (row: AnyRow) => (field: AnyField | DependentField<string>) =>
        new OutsideCodeSpace({ field: field.name, relation: name, value: String(row[field.name]) });

      for (const row of rows) {
        const index = yield* Result.mapError(layout.indexOf(row), outside(row));
        yield* Result.mapError(indexIn(payload, row), outside(row));

        if (byIndex.has(index)) {
          return yield* Result.fail(new KeyCollision({ key: spell(key, row), relation: name }));
        }

        byIndex.set(index, row);
      }

      return {
        bytes: Math.ceil(bits / 8) + bitStringHeader,
        cells,
        key,
        lookup: (at) =>
          Result.getSuccess(layout.indexOf(at)).pipe(
            Option.flatMap((index) => Option.fromNullishOr(byIndex.get(index))),
          ),
        name,
        payload,
        rows,
        width,
      };
    });

/**
 * Construct a closed relation from rows of handles and values, refusing the rows no constant can
 * hold: {@link closedWithin} under one PostgreSQL bit string's cap, {@link varbitMaxBits}.
 */
export const closed = closedWithin(varbitMaxBits);
