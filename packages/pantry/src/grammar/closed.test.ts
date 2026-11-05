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
  closedWithin,
  dependentField,
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
 */
type Variant = "alias" | "beyondPrefix" | "duplicate" | "outsideKey" | "outsidePayload" | "valid";

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
] as const satisfies readonly Variant[];

/**
 * What a model case reaches: the variant its rows carry, and which side of the bit cap its string
 * falls on.
 */
type ModelFeature = Variant | "beyond the cap" | "within the cap";

/**
 * A drawn relation: the key's roster sizes, whether the last key field is a dependent `fin` and
 * its sizes per prefix, the payload's sizes, the rows as points, the variant one more row carries,
 * the key digit an alias breaks, and the most bits the relation's string may hold.
 */
interface Drawn {
  readonly aliased: number;
  readonly dependent: Option.Option<readonly number[]>;
  readonly keySizes: readonly number[];
  readonly maxBits: number;
  readonly payloadSizes: readonly number[];
  readonly points: readonly (readonly number[])[];
  readonly variant: Variant;
}

/**
 * The number of cells of a key, as the model counts them: the product of its rosters, or, with a
 * dependent last field, the sum of its prefixes' sizes.
 *
 * @param keySizes - The key's roster sizes.
 * @param dependent - The dependent field's size per prefix, none for no dependent field.
 * @returns The cells.
 */
const cellsOf = (keySizes: readonly number[], dependent: Option.Option<readonly number[]>) => {
  const prefixes = keySizes.slice(0, -1).reduce((product, size) => product * size, 1);

  return Option.match(dependent, {
    onNone: () => keySizes.reduce((product, size) => product * size, 1),
    onSome: (sizes) => sizes.slice(0, prefixes).reduce((sum, size) => sum + size, 0),
  });
};

/**
 * The bits one cell takes, as the model counts them: enough for every payload point and the empty
 * cell.
 *
 * @param payloadSizes - The payload's sizes.
 * @returns The width.
 */
const widthOf = (payloadSizes: readonly number[]) => {
  const payloadPoints = payloadSizes.reduce((product, size) => product * size, 1);
  let width = 1;
  while (2 ** width < 1 + payloadPoints) {
    width += 1;
  }

  return width;
};

/**
 * Draw a relation in a small box, built for its variant (rule 4: no variant falls back to valid
 * rows): 1 to 3 key fields over rosters of 1 to 3 handles, 2 or 3 for an alias, with room to carry
 * at the digit above the broken one; the last field dependent half the time, always for
 * `beyondPrefix` and never for `alias`, with prefix sizes 0 to 3, the first row's below 3 for
 * `beyondPrefix`; 0 to 2 payload fields of 1 to 3 values, at least one for `outsidePayload`; up to
 * 4 points as rows (the holes are the points left out), at least one for an invalid variant; and a
 * bit cap within 2 of the string's size, below it one case in four (rule 10: production's cap,
 * 2³¹ − 8 bits, moved into the box).
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
    ]),
  );
  const fields = variant === "alias" ? source.choose(2, 3) : source.choose(1, 3);
  const aliased = variant === "alias" ? source.choose(1, fields - 1) : 0;
  const keySizes = Array.from({ length: fields }, (_, at) =>
    source.choose(variant === "alias" && at === aliased - 1 ? 2 : 1, 3),
  );
  const isDependent =
    variant === "beyondPrefix" || (variant !== "alias" && source.choose(0, 1) === 1);
  const payloadSizes = source.draw(
    array(int(1, 3), { max: 2, min: variant === "outsidePayload" ? 1 : 0 }),
  );
  const points = source.draw(
    array(
      (inner) => [
        ...keySizes.map((size) => inner.choose(0, Math.max(0, size - 1))),
        ...payloadSizes.map((size) => inner.choose(0, size - 1)),
      ],
      { max: 4, min: variant === "valid" ? 0 : 1 },
    ),
  );
  const [first = [], ...rest] = points;
  // The digit above an alias's has room to carry: it is below its roster's last code.
  const carried =
    variant === "alias"
      ? [
          ...first.slice(0, aliased - 1),
          source.choose(0, (keySizes[aliased - 1] ?? 2) - 2),
          ...first.slice(aliased),
        ]
      : first;
  const prefixes = keySizes.slice(0, -1).reduce((product, size) => product * size, 1);
  const firstPrefix = keySizes
    .slice(0, -1)
    .reduce((index, size, at) => index * size + (carried[at] ?? 0), 0);
  const dependent = isDependent
    ? Option.some(
        Array.from({ length: prefixes }, (_, prefix) =>
          source.choose(0, variant === "beyondPrefix" && prefix === firstPrefix ? 2 : 3),
        ),
      )
    : Option.none<readonly number[]>();
  const bits = cellsOf(keySizes, dependent) * widthOf(payloadSizes);
  const maxBits =
    bits > 0 && source.choose(0, 3) === 0
      ? source.choose(Math.max(0, bits - 2), bits - 1)
      : source.choose(bits, bits + 2);

  return {
    aliased,
    dependent,
    keySizes,
    maxBits,
    payloadSizes,
    points: points.length === 0 ? [] : [carried, ...rest],
    variant,
  };
};

/**
 * Build the relation's fields, rows and naive model from a drawn relation.
 *
 * @param drawnCase - The drawn relation.
 * @returns The fields, the rows as stated, and the model's predictions: the first reason the rows
 *   have no constant, if any, as `closed` names it.
 */
const built = (drawnCase: Drawn) => {
  const { aliased, dependent, keySizes, maxBits, payloadSizes, variant } = drawnCase;
  const keyRowOf = (row: Readonly<Record<string, string>>): Readonly<Record<string, string>> =>
    Object.fromEntries(keySizes.map((_, at) => [`k${at}`, String(row[`k${at}`])]));
  const prefixSize = (row: Readonly<Record<string, string>>) => {
    const prefix = keySizes
      .slice(0, -1)
      .reduce((index, size, at) => index * size + Number(row[`k${at}`]), 0);

    return Option.match(dependent, { onNone: () => 0, onSome: (sizes) => sizes[prefix] ?? 0 });
  };
  const key: AnyKeyField[] = keySizes.map((size, at) => {
    const last = at === keySizes.length - 1;

    return last && Option.isSome(dependent)
      ? dependentField(`k${at}`, fin(`K${at}`, 3), prefixSize)
      : idField(`k${at}`, fin(`K${at}`, size));
  });
  const payload: AnyField[] = payloadSizes.map((size, at) =>
    at === 0
      ? idField(`p${at}`, fin(`P${at}`, size))
      : valueField(
          `p${at}`,
          Array.from({ length: size }, (_, code) => `v${code}`),
        ),
  );
  const rowOf = (point: readonly number[]) =>
    Object.fromEntries([
      ...keySizes.map((_, at) => [`k${at}`, String(point[at] ?? 0)] as const),
      ...payloadSizes.map(
        (_, at) => [`p${at}`, `${at === 0 ? "" : "v"}${point[keySizes.length + at] ?? 0}`] as const,
      ),
    ]);
  const stated = drawnCase.points.map(rowOf);
  const [first = {}] = stated;
  const brokenRow = () => {
    switch (variant) {
      case "alias": {
        return { ...first, [`k${aliased}`]: String(keySizes[aliased] ?? 1) };
      }
      case "beyondPrefix": {
        return { ...first, [`k${keySizes.length - 1}`]: String(prefixSize(first)) };
      }
      case "duplicate": {
        return first;
      }
      case "outsideKey": {
        return { ...first, k0: "zz" };
      }
      case "outsidePayload": {
        return { ...first, p0: "zz" };
      }
      case "valid": {
        return first;
      }
      default: {
        return variant satisfies never;
      }
    }
  };
  const rows = variant === "valid" ? stated : [...stated, brokenRow()];
  // The model: a key point is a tuple of codes, each within its field's space at its prefix.
  const keyOf = (row: Readonly<Record<string, string>>): Option.Option<string> => {
    const codes = keySizes.map((size, at) => {
      const value = row[`k${at}`];
      const code = value !== undefined && /^\d+$/u.test(value) ? Number(value) : -1;
      const last = at === keySizes.length - 1;
      const bound = last && Option.isSome(dependent) ? prefixSize(keyRowOf(row)) : size;

      return code >= 0 && code < bound && (!last || Option.isNone(dependent) || code < 3)
        ? code
        : -1;
    });

    return codes.includes(-1) ? Option.none() : Option.some(codes.join(","));
  };
  const payloadValid = (row: Readonly<Record<string, string>>) =>
    payloadSizes.every((size, at) => {
      const value = row[`p${at}`];

      const code = value === undefined ? -1 : Number(at === 0 ? value : value.slice(1));

      return (at === 0 ? /^\d+$/u : /^v\d+$/u).test(value ?? "") && code < size;
    });
  const cells = cellsOf(keySizes, dependent);
  const width = widthOf(payloadSizes);
  const seen = new Map<string, Readonly<Record<string, string>>>();
  let reason = cells * width > maxBits ? Option.some("BeyondConstant") : Option.none<string>();
  for (const row of rows) {
    const at = keyOf(row);
    if (Option.isSome(reason)) {
      break;
    }

    if (Option.isNone(at) || !payloadValid(row)) {
      reason = Option.some("OutsideCodeSpace");
    } else if (seen.has(at.value)) {
      reason = Option.some("KeyCollision");
    } else {
      seen.set(at.value, row);
    }
  }

  return { cells, key, keyOf, keyRowOf, payload, reason, rows, seen, width };
};

describe("closed relations against a naive tuple-set model", () => {
  it.effect(
    "refuse exactly the rows the model refuses, by the first reason it finds, size the string as it does against a cap drawn within 2 bits of it, and look every point up as it does",
    (ctx) =>
      // Oracle: a second implementation, a naive tuple-set model of the relation and its string.
      // Bound: up to 3 key fields of up to 3 handles, 2 payload fields, 4 rows and one variant a
      // case; the cap within 2 bits of the string's size.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<ModelFeature>([...variants, "beyond the cap", "within the cap"], {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawn(drawnRelation),
            runs: 600,
            suite: "grammar/closed/model",
          },
          (drawnCase, c) =>
            Effect.sync(() => {
              const model = built(drawnCase);
              const result = closedWithin(drawnCase.maxBits)({
                key: model.key,
                name: "Toy",
                payload: model.payload,
                rows: model.rows,
              });
              c.note(drawnCase.variant);
              c.note(
                model.cells * model.width > drawnCase.maxBits ? "beyond the cap" : "within the cap",
              );

              if (Option.isSome(model.reason)) {
                assert.strictEqual(
                  Result.isFailure(result) ? result.failure._tag : "constructed",
                  model.reason.value,
                );
              } else {
                assert.isTrue(
                  Result.isSuccess(result),
                  Result.isFailure(result) ? result.failure.message : "",
                );
                if (Result.isSuccess(result)) {
                  const relation = result.success;
                  assert.strictEqual(relation.cells, model.cells);
                  assert.strictEqual(relation.width, model.width);
                  assert.strictEqual(
                    relation.bytes,
                    Math.ceil((model.cells * model.width) / 8) + 8,
                  );

                  const probes = [
                    ...model.rows,
                    ...model.rows.map((row) => ({
                      ...row,
                      k0: String(drawnCase.keySizes[0] ?? 1),
                    })),
                  ];
                  // Each row's source is its own stated index, so a key that answers another
                  // row's source names the wrong row.
                  const indexOf = new Map(model.rows.map((row, index) => [row, index]));
                  const withSources = sourced(relation, (row) => ({
                    _tag: "spec",
                    cite: String(indexOf.get(row) ?? -1),
                  }));
                  for (const probe of probes) {
                    const expected = Option.flatMap(model.keyOf(probe), (at) =>
                      Option.fromNullishOr(model.seen.get(at)),
                    );
                    assert.deepStrictEqual(relation.lookup(model.keyRowOf(probe)), expected);
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
              }
            }),
        ),
      ),
  );
});

describe("rosters and value fields", () => {
  it.effect("code each handle by its position, and refuse a handle listed twice", (ctx) =>
    // Oracle: the specification as a checker: a roster's code is a handle's position, and a
    // repeated handle has no single one.
    // Bound: up to 5 handles over 4.
    searched(
      ctx,
      explore(
        {
          ...budget,
          coverage: required<"distinct" | "repeated" | "empty">(["distinct", "repeated", "empty"], {
            cases: 300,
            sense: notesOnly,
          }),
          draw: drawn(array(element(["a", "b", "c", "d"] as const), { max: 5, min: 0 })),
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
              assert.deepStrictEqual(
                handles.map((handle) => result.success.codeOf(handle)),
                handles.map((_, at) => Option.some(at)),
              );
              assert.deepStrictEqual(result.success.codeOf("z"), Option.none());
            }
          }),
      ),
    ),
  );

  it.effect("hold a column's distinct values in value order", (ctx) =>
    // Oracle: a second implementation, a set of the column sorted by value.
    // Bound: up to 6 values of -3 to 3.
    searched(
      ctx,
      explore(
        {
          ...budget,
          coverage: required<"empty" | "repeats" | "out of order">(
            ["empty", "repeats", "out of order"],
            { cases: 300, sense: notesOnly },
          ),
          draw: drawn(array(int(-3, 3), { max: 6, min: 0 })),
          runs: 300,
          suite: "grammar/closed/value-field",
        },
        (column, c) =>
          Effect.sync(() => {
            if (column.length === 0) {
              c.note("empty");
            }

            if (new Set(column).size < column.length) {
              c.note("repeats");
            }

            if (column.some((value, at) => at > 0 && value < (column[at - 1] ?? value))) {
              c.note("out of order");
            }

            assert.deepStrictEqual(
              valueField("v", column).values,
              [...new Set(column)].toSorted((left, right) => left - right),
            );
          }),
      ),
    ),
  );
});
