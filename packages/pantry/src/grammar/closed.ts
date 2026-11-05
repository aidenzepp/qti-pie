/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Closed relations as rows of handles, and the shape of the constant each one erases to (fin.md
 * §17).
 *
 * A closed relation is fixed when the schema compiles, so it has no table: grizzle packs it into
 * one bit string, read `width` bits at a time at its key's index. This module holds the rows a
 * generator states, refuses the rows no constant can hold, sizes the constant, and answers lookups
 * on the host. It packs nothing; grizzle does.
 */
import { Array as Arr, Option, Result, Schema } from "effect";
import type { Order } from "effect";

/**
 * A field of a closed relation: its name, and its code space, every value the field ranges over in
 * code order. A value's code is its position, so a roster's handles keep their order wherever its
 * codes are stored.
 */
export interface Field<Name extends string, Value> {
  readonly name: Name;
  readonly values: readonly Value[];
}

/**
 * Any field, as the encoder reads it: a name and its code space, whatever the value type.
 */
export type AnyField = Field<string, unknown>;

/**
 * The row a list of fields describes: under each field's name, one value of its code space.
 */
export type RowOf<Fields extends readonly AnyField[]> = {
  readonly [F in Fields[number] as F["name"]]: F["values"][number];
};

/**
 * A row of a closed relation: its key fields' values and its payload fields' values.
 */
export type Row<Key extends readonly AnyField[], Payload extends readonly AnyField[]> = RowOf<Key> &
  RowOf<Payload>;

/**
 * A row as the encoder reads it: under each field's name, a value of whatever type the field holds.
 */
type AnyRow = RowOf<readonly AnyField[]>;

/**
 * A closed relation under a declared key, and the shape of the string of cells it erases to.
 *
 * The string has one cell per point of the key's code space. A row's cell sits at its key's
 * mixed-radix index, row-major over `key` in declared order: `((k₁·|K₂| + k₂)·|K₃| + k₃)…`, each kᵢ
 * the row's code in its key field. A cell is 0 where the relation holds no row, and 1 + c where it
 * does, c being the mixed-radix code of the row's payload values. A relation with no payload is a
 * set, and its cells are single bits.
 */
export interface Closed<Key extends readonly AnyField[], Payload extends readonly AnyField[]> {
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
   * The string's length in cells: the product of the key fields' code-space sizes.
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
   * @param key - A value for each key field.
   * @returns The row at that key, or none when the relation holds none there, as for a value
   *   outside its field's code space.
   */
  readonly lookup: (key: RowOf<Key>) => Option.Option<Row<Key, Payload>>;
}

/**
 * The most bits one PostgreSQL bit string holds, `VARBITMAXLEN` = INT_MAX − 7 (19rc1,
 * `src/include/utils/varbit.h:83`). A closed relation's constant is one bit string, so no relation
 * exceeds it, and every index below it is an exact JavaScript integer.
 */
const maxBits = 2_147_483_647 - 7;

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
 * A field whose code space lists one value twice, so the value has no single code.
 */
export class RepeatedValue extends Schema.TaggedError<RepeatedValue>()("RepeatedValue", {
  field: Schema.String,
  relation: Schema.String,
  value: Schema.String,
}) {
  /**
   * The relation, the field, the repeated value, and the repair.
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
  relation: Schema.String,
}) {
  /**
   * The relation, the bits it needs against the cap, and the repair.
   */
  override get message(): string {
    return `${this.relation} needs ${this.bits} bits, and one PostgreSQL bit string holds at most ${maxBits}. Give its key denser coordinates, so that its code spaces multiply to fewer cells.`;
  }
}

/**
 * The ways a stated closed relation has no constant.
 */
export type ClosedRelationError = BeyondConstant | KeyCollision | OutsideCodeSpace | RepeatedValue;

/**
 * A field with the code of each of its values.
 */
interface Space {
  readonly codes: ReadonlyMap<unknown, number>;
  readonly field: AnyField;
}

/**
 * Number a field's values by their position in its code space.
 *
 * @param relation - The relation's name, for the failure.
 * @param field - The field.
 * @returns The field with its codes, or the first value its space lists twice.
 */
const spaceOf = (relation: string, field: AnyField): Result.Result<Space, RepeatedValue> => {
  const codes = new Map(field.values.map((value, code) => [value, code]));

  return Arr.findFirst(field.values, (value, code) => codes.get(value) !== code).pipe(
    Option.match({
      onNone: () => Result.succeed({ codes, field }),
      onSome: (value) =>
        Result.fail(new RepeatedValue({ field: field.name, relation, value: String(value) })),
    }),
  );
};

/**
 * Compute a row's mixed-radix index over fields, the first field the most significant digit.
 *
 * @param spaces - The fields, in index order.
 * @param row - The row, holding a value under each field's name.
 * @returns The index, or the first field whose code space does not hold the row's value.
 */
const indexIn = (spaces: readonly Space[], row: AnyRow): Result.Result<number, Space> => {
  let index = 0;
  for (const space of spaces) {
    const code = space.codes.get(row[space.field.name]);
    if (code === undefined) {
      return Result.fail(space);
    }

    index = index * space.field.values.length + code;
  }

  return Result.succeed(index);
};

/**
 * Multiply the code-space sizes of fields: the number of mixed-radix codes over them.
 *
 * @param fields - The fields.
 * @returns The product of their code-space sizes, 1 for no fields.
 */
const pointsOf = (fields: readonly AnyField[]): number => {
  let points = 1;
  for (const { values } of fields) {
    points *= values.length;
  }

  return points;
};

/**
 * Write a row's values under its fields' names, for a failure's message.
 *
 * @param spaces - The fields to write, in order.
 * @param row - The row.
 * @returns Each field's name and the row's value, comma-separated.
 */
const spell = (spaces: readonly Space[], row: AnyRow): string =>
  spaces.map(({ field }) => `${field.name} ${String(row[field.name])}`).join(", ");

/**
 * Construct the failure for a row whose value lies outside a field's code space.
 *
 * @param relation - The relation's name.
 * @param space - The field whose code space does not hold the value.
 * @param row - The row.
 * @returns The failure, naming the field and the value.
 */
const outsideOf = (relation: string, { field }: Space, row: AnyRow): OutsideCodeSpace =>
  new OutsideCodeSpace({ field: field.name, relation, value: String(row[field.name]) });

/**
 * Construct a closed relation from rows of handles, refusing the rows no constant can hold.
 *
 * Every value must lie in its field's code space, each space must list a value once, no two rows
 * may share a key (E4), and the string of cells must fit one PostgreSQL bit string.
 *
 * @param relation - The relation as a generator states it.
 * @param relation.name - The relation's name, as its laws and its failures name it.
 * @param relation.key - The key's fields in index order, the first the most significant digit.
 * @param relation.payload - The fields outside the key, none for a set.
 * @param relation.rows - The rows.
 * @returns The relation, or the first reason it has no constant.
 */
export const closed = <
  const Key extends readonly AnyField[],
  const Payload extends readonly AnyField[],
>(relation: {
  readonly key: Key;
  readonly name: string;
  readonly payload: Payload;
  readonly rows: readonly Row<Key, Payload>[];
}): Result.Result<Closed<Key, Payload>, ClosedRelationError> =>
  Result.gen(function* parseClosed() {
    const { key, name, payload, rows } = relation;
    const keySpaces = yield* Result.all(key.map((field) => spaceOf(name, field)));
    const payloadSpaces = yield* Result.all(payload.map((field) => spaceOf(name, field)));
    const cells = pointsOf(key);
    const width = pointsOf(payload).toString(2).length;
    const bits = cells * width;

    if (bits > maxBits) {
      return yield* Result.fail(new BeyondConstant({ bits, relation: name }));
    }

    const byIndex = new Map<number, Row<Key, Payload>>();

    for (const row of rows) {
      const index = yield* Result.mapError(indexIn(keySpaces, row), (space) =>
        outsideOf(name, space, row),
      );
      yield* Result.mapError(indexIn(payloadSpaces, row), (space) => outsideOf(name, space, row));

      if (byIndex.has(index)) {
        return yield* Result.fail(new KeyCollision({ key: spell(keySpaces, row), relation: name }));
      }

      byIndex.set(index, row);
    }

    return {
      bytes: Math.ceil(bits / 8) + bitStringHeader,
      cells,
      key,
      lookup: (at: RowOf<Key>) =>
        Result.getSuccess(indexIn(keySpaces, at)).pipe(
          Option.flatMap((index) => Option.fromNullishOr(byIndex.get(index))),
        ),
      name,
      payload,
      rows,
      width,
    };
  });

/**
 * Collect an open-typed field's code space: the distinct values the relation's rows hold, in
 * sorted order (fin.md §17). These codes never leave the constant, so they need no stability
 * across rows that change.
 *
 * @param column - The field's value in every row.
 * @param order - The order of the field's type.
 * @returns Each distinct value once, ascending.
 */
export const dictionary = <Value>(
  column: Iterable<Value>,
  order: Order.Order<Value>,
): readonly Value[] => [...new Set(column)].toSorted(order);

/**
 * State rows once for every schema version they hold in: each row, under each version.
 *
 * A version is one more digit of a closed relation's key (fin.md P4), so a rule that holds in
 * several versions is one statement here, and a version difference is a second statement rather
 * than an invisible duplicate.
 *
 * @param versions - The versions the rows hold in.
 * @param rows - The rows, without a version.
 * @returns Each row under each version, versions outermost.
 */
export const inVersions = <const Version, Rule extends object>(
  versions: readonly Version[],
  rows: readonly Rule[],
): readonly (Rule & { readonly version: Version })[] =>
  versions.flatMap((version) => rows.map((row) => ({ ...row, version })));
