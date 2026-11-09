import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import {
  closed,
  dependentField,
  faultOf,
  fin,
  idField,
  roster,
  sourced,
  valueField,
} from "#pantry/grammar/closed.ts";
import type { AnyField, AnyKeyField } from "#pantry/grammar/closed.ts";

/**
 * The search budget of every exploration here; each states its own coverage.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * How one row of a drawn relation is broken, if it is: the named invalid variants of a row, each
 * built so the relation it is drawn for holds it.
 *
 * - `alias`: a key digit, not the most significant, one past its roster, under a more significant
 *   digit with room to carry into: unchecked mixed radix reads it as an in-range tuple of the next
 *   value of that digit (the 400-as-37 alias);
 * - `outsideKey`, `outsidePayload`: a value no code space holds;
 * - `beyondPrefix`: a dependent digit in its roster but past its prefix's size;
 * - `duplicate`: a second row at a key already stated.
 *
 * /**
 * How one row of a drawn relation is broken, if it is: the named invalid variants of a row, each
 * built so the relation it is drawn for holds it.
 *
 * - `alias`: a key digit, not the most significant, one past its roster, under a more significant
 *   digit with room to carry into: unchecked mixed radix reads it as an in-range tuple of the next
 *   value of that digit (the 400-as-37 alias);
 * - `outsideKey`, `outsidePayload`: a value no code space holds, at any key or payload field, a value
 *   field's included;
 * - `beyondPrefix`: a dependent digit in its widest roster but past its prefix's size;
 * - `duplicate`: a second row at a key already stated;
 * - `missingKey`, `missingPayload`: a row that holds no value under one of its fields.
 */
type Variant =
  | "alias"
  | "beyondPrefix"
  | "duplicate"
  | "missingKey"
  | "missingPayload"
  | "outsideKey"
  | "outsidePayload"
  | "valid";

/**
 * Every variant, the valid one first.
 */
const variants = [
  "valid",
  "alias",
  "outsideKey",
  "outsidePayload",
  "beyondPrefix",
  "duplicate",
  "missingKey",
  "missingPayload",
] as const satisfies readonly Variant[];

/**
 * The layouts of key a relation's code spaces branch on, each a situation the search must reach: a
 * dependent field that is not the key's last, an id field after a dependent one, two dependent
 * fields, two prefix fields before the first dependent one, rows in two prefix blocks, uneven
 * blocks (rows in two blocks of different sizes under prefix fields of different sizes, where a
 * prefix read in the wrong field sizes the wrong block), a value payload field, and a lookup of a
 * key that leaves a field out.
 */
const layouts = [
  "dependent inner",
  "id after dependent",
  "two dependent",
  "two prefix fields",
  "two blocks",
  "uneven blocks",
  "value payload",
  "lookup missing a field",
] as const;

/**
 * A situation the relation search reaches: a variant, or a keyFields.
 */
type Situation = Variant | (typeof layouts)[number];

/**
 * The widest roster of every dependent field: the codes 0 to 2.
 */
const dependentWidth = 3;

/**
 * One key field as drawn: an id field over a roster of `size` handles, or a dependent `fin` whose
 * size under the prefix numbered `p` (the mixed radix of the fields before the key's first
 * dependent one) is `sizes[p]`, at most {@link dependentWidth}.
 */
type DrawnKeyField =
  | { readonly _tag: "dependent"; readonly sizes: readonly number[] }
  | { readonly _tag: "id"; readonly size: number };

/**
 * One payload field as drawn: an id field over `size` handles, or a value field over `size`
 * values.
 */
interface DrawnPayloadField {
  readonly _tag: "id" | "value";
  readonly size: number;
}

/**
 * A drawn relation: its key's and payload's fields, the rows as points (a code per key field, then
 * per payload field), the variant one more row carries and the field it breaks.
 */
interface Drawn {
  readonly at: number;
  readonly key: readonly DrawnKeyField[];
  readonly payload: readonly DrawnPayloadField[];
  readonly points: readonly (readonly number[])[];
  readonly variant: Variant;
}

/**
 * The number of the fields before a key's first dependent field, its prefix: all of them for a
 * key with none.
 *
 * @param key - The key's fields.
 * @returns The prefix's length.
 */
const prefixLength = (key: readonly DrawnKeyField[]): number => {
  const split = key.findIndex(({ _tag }) => _tag === "dependent");

  return split === -1 ? key.length : split;
};

/**
 * Draw a relation in a small box, built for its variant (rule 4: no variant falls back to valid
 * rows): 1 to 4 key fields, each an id field over 1 to 3 handles or, after the first field, a
 * dependent one half the time, at least one for `beyondPrefix` and none for `alias`, each
 * dependent field's prefix sizes 0 to 3 (the first row's below 3 at the broken field for
 * `beyondPrefix`); 0 to 3 payload fields, id or value, of 1 to 3 codes, at least one for a payload
 * variant; up to 5 points as rows (the holes are the points left out), at least one for an invalid
 * variant.
 */
const drawnRelation: Gen<Drawn> = (source) => {
  const variant = source.draw(
    weighted<Variant>([
      [6, () => "valid"],
      [1, () => "alias"],
      [1, () => "outsideKey"],
      [1, () => "outsidePayload"],
      [1, () => "beyondPrefix"],
      [1, () => "duplicate"],
      [1, () => "missingKey"],
      [1, () => "missingPayload"],
    ]),
  );
  const fields = variant === "alias" ? source.choose(2, 4) : source.choose(1, 4);
  const aliased = variant === "alias" ? source.choose(1, fields - 1) : 0;
  const tags = Array.from({ length: fields }, (_, at) =>
    at > 0 && variant !== "alias" && source.choose(0, 1) === 1 ? "dependent" : "id",
  );
  if (variant === "beyondPrefix" && !tags.includes("dependent")) {
    tags[tags.length - 1] = fields === 1 ? "id" : "dependent";
  }

  const idSizes = tags.map((_, at) =>
    source.choose(variant === "alias" && at === aliased - 1 ? 2 : 1, 3),
  );
  const split = tags.indexOf("dependent");
  const prefixes = (split === -1 ? idSizes : idSizes.slice(0, split)).reduce(
    (product, size) => product * size,
    1,
  );
  const key = tags.map((tag, at): DrawnKeyField =>
    tag === "dependent"
      ? {
          _tag: "dependent",
          sizes: Array.from({ length: prefixes }, () => source.choose(0, dependentWidth)),
        }
      : { _tag: "id", size: idSizes[at] ?? 1 },
  );
  const payloadVariant = variant === "outsidePayload" || variant === "missingPayload";
  const payload = source.draw(
    array(
      (inner): DrawnPayloadField => ({
        _tag: inner.choose(0, 1) === 1 ? "value" : "id",
        size: inner.choose(1, 3),
      }),
      { max: 3, min: payloadVariant ? 1 : 0 },
    ),
  );
  const points = source.draw(
    array(
      (inner) => [
        ...key.map((field) =>
          inner.choose(0, (field._tag === "id" ? field.size : dependentWidth) - 1),
        ),
        ...payload.map(({ size }) => inner.choose(0, size - 1)),
      ],
      { max: 5, min: variant === "valid" ? 0 : 1 },
    ),
  );
  const [first = [], ...rest] = points;
  // The digit above an alias's has room to carry: it is below its roster's last code.
  const carried =
    variant === "alias"
      ? [
          ...first.slice(0, aliased - 1),
          source.choose(0, (idSizes[aliased - 1] ?? 2) - 2),
          ...first.slice(aliased),
        ]
      : first;
  const dependents = key.flatMap((field, at) => (field._tag === "dependent" ? [at] : []));
  const broken = ((): number => {
    switch (variant) {
      case "alias": {
        return aliased;
      }
      case "beyondPrefix": {
        return dependents[source.choose(0, dependents.length - 1)] ?? 0;
      }
      case "missingKey":
      case "outsideKey": {
        return source.choose(0, key.length - 1);
      }
      case "missingPayload":
      case "outsidePayload": {
        return source.choose(0, payload.length - 1);
      }
      case "duplicate":
      case "valid": {
        return 0;
      }
      default: {
        return variant satisfies never;
      }
    }
  })();
  // A beyond-prefix row needs room in the widest roster past its prefix's size.
  const firstPrefix = key
    .slice(0, prefixLength(key))
    .reduce(
      (index, field, at) => index * (field._tag === "id" ? field.size : 1) + (carried[at] ?? 0),
      0,
    );
  const keyed = key.map((field, at): DrawnKeyField => {
    if (variant !== "beyondPrefix" || at !== broken || field._tag !== "dependent") {
      return field;
    }

    return {
      _tag: "dependent",
      sizes: field.sizes.map((size, prefix) =>
        prefix === firstPrefix ? Math.min(size, dependentWidth - 1) : size,
      ),
    };
  });

  return {
    at: broken,
    key: keyed,
    payload,
    points: points.length === 0 ? [] : [carried, ...rest],
    variant,
  };
};

/**
 * A row without one of its fields.
 *
 * @param row - The row.
 * @param name - The field it leaves out.
 * @returns The row without it.
 */
const without = (row: Readonly<Record<string, string>>, name: string) =>
  Object.fromEntries(Object.entries(row).filter(([held]) => held !== name));

/**
 * Build the relation's fields, rows and naive model from a drawn relation.
 *
 * @param drawnCase - The drawn relation.
 * @returns The fields, the rows as stated, the model's predictions (the first reason the rows have
 *   no constant, if any, as `closed` names it) and the layouts the relation holds.
 */
const built = (drawnCase: Drawn) => {
  const { at, key: keyFields, payload: payloadFields, variant } = drawnCase;
  const prefix = prefixLength(keyFields);
  const prefixOf = (row: Readonly<Record<string, string>>): number =>
    keyFields
      .slice(0, prefix)
      .reduce(
        (index, field, place) =>
          index * (field._tag === "id" ? field.size : 1) + Number(row[`k${place}`] ?? 0),
        0,
      );
  const keyRowOf = (row: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
    Object.fromEntries(
      keyFields.flatMap((_, place) => {
        const value = row[`k${place}`];

        return value === undefined ? [] : [[`k${place}`, value] as const];
      }),
    );
  const key: AnyKeyField[] = keyFields.map((field, place) =>
    field._tag === "dependent"
      ? dependentField(`k${place}`, fin(`K${place}`, dependentWidth), (row) =>
          Math.min(field.sizes[prefixOf(row)] ?? 0, dependentWidth),
        )
      : idField(`k${place}`, fin(`K${place}`, field.size)),
  );
  const payload: AnyField[] = payloadFields.map(({ _tag, size }, place) =>
    _tag === "id"
      ? idField(`p${place}`, fin(`P${place}`, size))
      : valueField(
          `p${place}`,
          Array.from({ length: size }, (_, code) => `v${code}`),
        ),
  );
  const rowOf = (point: readonly number[]): Readonly<Record<string, string>> =>
    Object.fromEntries([
      ...keyFields.map((_, place) => [`k${place}`, String(point[place] ?? 0)] as const),
      ...payloadFields.map(
        ({ _tag }, place) =>
          [
            `p${place}`,
            `${_tag === "id" ? "" : "v"}${point[keyFields.length + place] ?? 0}`,
          ] as const,
      ),
    ]);
  const stated = drawnCase.points.map(rowOf);
  const [first = {}] = stated;
  const brokenRow = () => {
    const field = keyFields[at];
    switch (variant) {
      case "alias": {
        return { ...first, [`k${at}`]: String(field?._tag === "id" ? field.size : 1) };
      }
      case "beyondPrefix": {
        return {
          ...first,
          [`k${at}`]: String(field?._tag === "dependent" ? (field.sizes[prefixOf(first)] ?? 0) : 0),
        };
      }
      case "duplicate":
      case "valid": {
        return first;
      }
      case "missingKey": {
        return without(first, `k${at}`);
      }
      case "missingPayload": {
        return without(first, `p${at}`);
      }
      case "outsideKey": {
        return { ...first, [`k${at}`]: "zz" };
      }
      case "outsidePayload": {
        return { ...first, [`p${at}`]: payloadFields[at]?._tag === "value" ? "vzz" : "zz" };
      }
      default: {
        return variant satisfies never;
      }
    }
  };
  const rows = variant === "valid" ? stated : [...stated, brokenRow()];
  // The model: a key point is a tuple of codes, each within its field's space at its prefix.
  const keyOf = (row: Readonly<Record<string, string>>): Option.Option<string> => {
    const codes = keyFields.map((field, place) => {
      const value = row[`k${place}`];
      const code = value !== undefined && /^\d+$/u.test(value) ? Number(value) : -1;
      const bound =
        field._tag === "id"
          ? field.size
          : Math.min(field.sizes[prefixOf(row)] ?? 0, dependentWidth);

      return code < bound ? code : -1;
    });

    return codes.includes(-1) ? Option.none() : Option.some(codes.join(","));
  };
  const payloadValid = (row: Readonly<Record<string, string>>) =>
    payloadFields.every(({ _tag, size }, place) => {
      const value = row[`p${place}`] ?? "";
      const digits = _tag === "id" ? value : value.slice(1);

      return (_tag === "id" ? /^\d+$/u : /^v\d+$/u).test(value) && Number(digits) < size;
    });
  const seen = new Map<string, Readonly<Record<string, string>>>();
  let reason = Option.none<string>();
  for (const row of rows) {
    const point = keyOf(row);
    if (Option.isSome(reason)) {
      break;
    }

    if (Option.isNone(point) || !payloadValid(row)) {
      reason = Option.some("OutsideCodeSpace");
    } else if (seen.has(point.value)) {
      reason = Option.some("KeyCollision");
    } else {
      seen.set(point.value, row);
    }
  }

  const dependentAt = keyFields.flatMap((field, place) =>
    field._tag === "dependent" ? [place] : [],
  );
  // The number of keys under the prefix numbered `at`: the product of the sizes after it.
  const blockSize = (block: number): number =>
    keyFields
      .slice(prefix)
      .reduce(
        (product, field) =>
          product *
          (field._tag === "id" ? field.size : Math.min(field.sizes[block] ?? 0, dependentWidth)),
        1,
      );
  // Every key point the relation's code spaces hold, prefix by prefix: each a key a lookup may
  // ask for, held by a row or not.
  let points: readonly (readonly number[])[] = [[]];
  for (const [place, field] of keyFields.entries()) {
    points = points.flatMap((tuple) => {
      const prefixIndex = keyFields
        .slice(0, Math.min(place, prefix))
        .reduce(
          (index, held, slot) => index * (held._tag === "id" ? held.size : 1) + (tuple[slot] ?? 0),
          0,
        );
      const bound =
        field._tag === "id" ? field.size : Math.min(field.sizes[prefixIndex] ?? 0, dependentWidth);

      return Array.from({ length: bound }, (_, code) => [...tuple, code]);
    });
  }

  const pointRows = points.map((tuple) =>
    Object.fromEntries(tuple.map((code, place) => [`k${String(place)}`, String(code)] as const)),
  );
  const blocks = new Set(
    [...seen.values()].map((row) => prefixOf(row)).filter(() => dependentAt.length > 0),
  );
  const layoutsHeld = new Set<(typeof layouts)[number]>([
    ...(dependentAt.some((place) => place < keyFields.length - 1)
      ? (["dependent inner"] as const)
      : []),
    ...(keyFields.some((field, place) => field._tag === "id" && place > (dependentAt[0] ?? place))
      ? (["id after dependent"] as const)
      : []),
    ...(dependentAt.length > 1 ? (["two dependent"] as const) : []),
    ...(dependentAt.length > 0 && prefix > 1 ? (["two prefix fields"] as const) : []),
    ...(blocks.size > 1 ? (["two blocks"] as const) : []),
    ...(blocks.size > 1 &&
    new Set(keyFields.slice(0, prefix).map((field) => (field._tag === "id" ? field.size : 1)))
      .size > 1 &&
    new Set([...blocks].map(blockSize)).size > 1
      ? (["uneven blocks"] as const)
      : []),
    ...(payloadFields.some(({ _tag }) => _tag === "value") ? (["value payload"] as const) : []),
  ]);

  return { key, keyOf, keyRowOf, layoutsHeld, payload, pointRows, reason, rows, seen };
};

describe("closed relations against a naive tuple-set model", () => {
  it.effect(
    "fault exactly the rows the model refuses, by the first reason it finds, and look every point of a faultless relation up as it does",
    (ctx) =>
      // Bound: up to 4 key fields of up to 3 handles, dependent ones anywhere after the first, 3
      // payload fields, 5 rows and one variant a case. `closed` checks no row on a load; `faultOf`
      // is the check the tests read, so the model is held against it.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<Situation>([...variants, ...layouts], {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(drawnRelation),
            oracle: {
              kind: "second-implementation",
              name: "a naive tuple-set model of the relation (built)",
            },
            runs: 600,
            suite: "grammar/closed/model",
          },
          (drawnCase, c) =>
            Effect.sync(() => {
              const model = built(drawnCase);
              const relation = closed({
                key: model.key,
                name: "Toy",
                payload: model.payload,
                rows: model.rows,
              });
              c.note(drawnCase.variant);
              c.noteAll(model.layoutsHeld);

              assert.deepStrictEqual(
                Option.map(faultOf(relation), ({ _tag }) => _tag),
                model.reason,
              );
              if (Option.isNone(model.reason)) {
                // Every key point of the code spaces, held or not, each row, each row with its
                // most significant field one past its roster, and each row with one key field
                // left out, which no key holds.
                const probes = [
                  ...model.pointRows,
                  ...model.rows,
                  ...model.rows.map((row) => ({
                    ...row,
                    k0: String(
                      drawnCase.key[0]?._tag === "id" ? drawnCase.key[0].size : dependentWidth,
                    ),
                  })),
                  ...model.rows.flatMap((row) =>
                    drawnCase.key.map((_, place) =>
                      Object.fromEntries(
                        Object.entries(row).filter(([name]) => name !== `k${String(place)}`),
                      ),
                    ),
                  ),
                ];
                if (model.rows.length > 0) {
                  c.note("lookup missing a field");
                }

                // Each row's source is its own stated index, so a key that answers another row's
                // source names the wrong row.
                const indexOf = new Map(model.rows.map((row, index) => [row, index]));
                const withSources = sourced({
                  key: model.key,
                  name: "Toy",
                  payload: model.payload,
                  rows: model.rows.map((row, index) => ({
                    row,
                    source: { _tag: "spec", cite: String(index) } as const,
                  })),
                });
                assert.deepStrictEqual(withSources.rows, relation.rows);
                for (const probe of probes) {
                  const expected = Option.flatMap(model.keyOf(probe), (point) =>
                    Option.fromNullishOr(model.seen.get(point)),
                  );
                  assert.deepStrictEqual(relation.lookup(model.keyRowOf(probe)), expected);
                  assert.deepStrictEqual(withSources.lookup(model.keyRowOf(probe)), expected);
                  assert.deepStrictEqual(
                    withSources.sourceOf(model.keyRowOf(probe)),
                    expected.pipe(
                      Option.map((row) => ({
                        _tag: "spec",
                        cite: String(indexOf.get(row) ?? -1),
                      })),
                    ),
                  );
                }
              }
            }),
        ),
      ),
  );
});

/**
 * A column of one primitive type, drawn from a pool of values whose order each type's own
 * comparison decides: integers about zero, bigints, booleans, and strings whose code units order
 * them otherwise than their code points (an astral character after U+FFFF in code points, before
 * it in code units) or their case.
 */
const columns: Gen<
  | { readonly _tag: "bigint"; readonly column: readonly bigint[] }
  | { readonly _tag: "boolean"; readonly column: readonly boolean[] }
  | { readonly _tag: "number"; readonly column: readonly number[] }
  | { readonly _tag: "string"; readonly column: readonly string[] }
> = (source) => {
  const length = { max: 8, min: 0 };
  switch (source.choose(0, 3)) {
    case 0: {
      return { _tag: "number", column: source.draw(array(int(-3, 3), length)) };
    }
    case 1: {
      return {
        _tag: "bigint",
        column: source.draw(array((inner) => BigInt(inner.choose(-3, 3)), length)),
      };
    }
    case 2: {
      return { _tag: "boolean", column: source.draw(array(element([false, true]), length)) };
    }
    default: {
      return {
        _tag: "string",
        column: source.draw(
          array(element(["", "a", "aa", "b", "B", "é", "￿", "\u{10000}", "｡"]), length),
        ),
      };
    }
  }
};

/**
 * Order two strings by their UTF-16 code units, the first that differs deciding, a prefix first:
 * a comparison written from the code units themselves, not from the relational operators.
 *
 * @param left - A string.
 * @param right - A string.
 * @returns Negative, zero or positive.
 */
const byCodeUnits = (left: string, right: string): number => {
  for (let at = 0; at < Math.min(left.length, right.length); at += 1) {
    // oxlint-disable-next-line unicorn/prefer-code-point -- the order is the code units', which codePointAt does not read
    const difference = left.charCodeAt(at) - right.charCodeAt(at);
    if (difference !== 0) {
      return difference;
    }
  }

  return left.length - right.length;
};

describe("rosters and value fields", () => {
  it.effect(
    "code each handle by its position, hold exactly its handles, and refuse a handle listed twice",
    (ctx) =>
      // Bound: up to 5 handles over 4.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<"distinct" | "repeated" | "empty">(
              ["distinct", "repeated", "empty"],
              {
                cases: 300,
                sense: notesOnly,
              },
            ),
            draw: drawn(array(element(["a", "b", "c", "d"] as const), { max: 5, min: 0 })),
            oracle: {
              kind: "specification",
              name: "a roster's code is a handle's position, it holds its handles and no other string, and a repeated handle has no single one",
            },
            runs: 300,
            suite: "grammar/closed/roster",
          },
          (handles, c) =>
            Effect.sync(() => {
              const result = roster("Toy", handles);
              const distinct = new Set(handles).size === handles.length;
              if (handles.length === 0) {
                c.note("empty");
              } else {
                c.note(distinct ? "distinct" : "repeated");
              }

              assert.strictEqual(Result.isSuccess(result), distinct);
              if (Result.isSuccess(result)) {
                const absent = ["a", "b", "c", "d", "z", ""].filter(
                  (value) => !handles.some((handle) => handle === value),
                );
                assert.deepStrictEqual(
                  handles.map((handle) => result.success.codeOf(handle)),
                  handles.map((_, at) => Option.some(at)),
                );
                assert.deepStrictEqual(
                  absent.map((value) => result.success.codeOf(value)),
                  absent.map(() => Option.none()),
                );
                assert.deepStrictEqual(
                  [...handles, ...absent].map((value) => result.success.has(value)),
                  [...handles.map(() => true), ...absent.map(() => false)],
                );
              }
            }),
        ),
      ),
  );

  it.effect("number the codes of fin(n) 0 to n − 1 as numerals, and hold no other string", (ctx) =>
    // Bound: n from 0 to 6, each probed at every code, one past the last, and three spellings of
    // no code.
    searched(
      ctx,
      explore(
        {
          ...budget,
          coverage: required<"empty" | "sized">(["empty", "sized"], {
            cases: 100,
            sense: notesOnly,
          }),
          draw: drawn(int(0, 6)),
          oracle: {
            kind: "specification",
            name: "fin(n)'s handle for code k is k's numeral, for each k below n, and no other string is one",
          },
          runs: 100,
          suite: "grammar/closed/fin",
        },
        (size, c) =>
          Effect.sync(() => {
            c.note(size === 0 ? "empty" : "sized");

            const space = fin("Toy", size);
            const codes = Array.from({ length: size }, (_, code) => String(code));
            const absent = [String(size), "-1", "01", " 0", "x", ""];

            assert.deepStrictEqual(space.handles, codes);
            assert.deepStrictEqual(
              [...codes, ...absent].map((value) => space.codeOf(value)),
              [...codes.map((_, code) => Option.some(code)), ...absent.map(() => Option.none())],
            );
            assert.deepStrictEqual(
              [...codes, ...absent].map((value) => space.has(value)),
              [...codes.map(() => true), ...absent.map(() => false)],
            );
          }),
      ),
    ),
  );

  it.effect("hold a column's distinct values in value order, for each primitive type", (ctx) =>
    // Bound: up to 8 values of one of four types.
    searched(
      ctx,
      explore(
        {
          ...budget,
          coverage: required<
            "empty" | "repeats" | "out of order" | "bigint" | "boolean" | "number" | "string"
          >(["empty", "repeats", "out of order", "bigint", "boolean", "number", "string"], {
            cases: 300,
            sense: notesOnly,
          }),
          draw: drawn(columns),
          oracle: {
            kind: "second-implementation",
            name: "a set of the column sorted by each type's own order: subtraction for numbers, Number() for booleans, code units for strings, bigints by sign of the difference",
          },
          runs: 300,
          suite: "grammar/closed/value-field",
        },
        (drawnColumn, c) =>
          Effect.sync(() => {
            const { column } = drawnColumn;
            c.note(drawnColumn._tag);

            if (column.length === 0) {
              c.note("empty");
            }

            if (new Set<unknown>(column).size < column.length) {
              c.note("repeats");
            }

            const [actual, expected] = ((): readonly [readonly unknown[], readonly unknown[]] => {
              switch (drawnColumn._tag) {
                case "bigint": {
                  return [
                    valueField("v", drawnColumn.column).values,
                    [...new Set(drawnColumn.column)].toSorted((left, right) =>
                      Number(left - right),
                    ),
                  ];
                }
                case "boolean": {
                  return [
                    valueField("v", drawnColumn.column).values,
                    [...new Set(drawnColumn.column)].toSorted(
                      (left, right) => Number(left) - Number(right),
                    ),
                  ];
                }
                case "number": {
                  return [
                    valueField("v", drawnColumn.column).values,
                    [...new Set(drawnColumn.column)].toSorted((left, right) => left - right),
                  ];
                }
                case "string": {
                  return [
                    valueField("v", drawnColumn.column).values,
                    [...new Set(drawnColumn.column)].toSorted(byCodeUnits),
                  ];
                }
                default: {
                  return drawnColumn satisfies never;
                }
              }
            })();
            if (expected.some((value, at) => value !== [...new Set<unknown>(column)][at])) {
              c.note("out of order");
            }

            assert.deepStrictEqual(actual, expected);
          }),
      ),
    ),
  );
});
