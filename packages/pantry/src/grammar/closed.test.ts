import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { array, element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import {
  closed,
  dependentField,
  fin,
  idField,
  roster,
  sourced,
  valueField,
} from "#pantry/grammar/closed.ts";
import type { AnyField, AnyKeyField } from "#pantry/grammar/closed.ts";

/**
 * The search budget of every exploration here.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  coverage: noCoverage,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * How one row of a drawn relation is broken, if it is: the named invalid variants of a row.
 *
 * - `alias`: a key digit past its roster, a numeral that, read as its own code under unchecked mixed
 *   radix, carries into the next digit and aliases an in-range tuple (the 400-as-37 alias);
 * - `outsideKey`, `outsidePayload`: a value no code space holds;
 * - `beyondPrefix`: a dependent digit in the roster but past its prefix's size;
 * - `duplicate`: a second row at a key already stated.
 */
type Variant = "alias" | "beyondPrefix" | "duplicate" | "outsideKey" | "outsidePayload" | "valid";

/**
 * A drawn relation: the key's roster sizes, whether the last key field is a dependent `fin` and
 * its sizes per prefix, the payload's sizes, the rows as points, and the variant one row carries.
 */
interface Drawn {
  readonly dependent: Option.Option<readonly number[]>;
  readonly keySizes: readonly number[];
  readonly payloadSizes: readonly number[];
  readonly points: readonly (readonly number[])[];
  readonly variant: Variant;
}

/**
 * Draw a relation in a small box: 1 to 3 key fields over rosters of 1 to 3 handles, the last
 * dependent half the time with prefix sizes 0 to 3; 0 to 2 payload fields of 1 to 3 values; any
 * subset of points as rows (the holes are the points left out); and one named variant.
 */
const drawnRelation: Gen<Drawn> = (source) => {
  const keySizes = source.draw(array(int(1, 3), { max: 3, min: 1 }));
  const dependent = source.choose(0, 1) === 1;
  const prefixes = keySizes.slice(0, -1).reduce((product, size) => product * size, 1);
  const sizes = dependent
    ? Option.some(Array.from({ length: prefixes }, () => source.choose(0, 3)))
    : Option.none();
  const payloadSizes = source.draw(array(int(1, 3), { max: 2, min: 0 }));
  const points = source.draw(
    array(
      (inner) => [
        ...keySizes.map((size) => inner.choose(0, Math.max(0, size - 1))),
        ...payloadSizes.map((size) => inner.choose(0, size - 1)),
      ],
      { max: 4, min: 0 },
    ),
  );
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

  return { dependent: sizes, keySizes, payloadSizes, points, variant };
};

/**
 * Build the relation's fields, rows and naive model from a drawn relation.
 *
 * @param drawnCase - The drawn relation.
 * @returns The fields, the rows as stated, and the model's predictions.
 */
const built = (drawnCase: Drawn) => {
  const { dependent, keySizes, payloadSizes, variant } = drawnCase;
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
  const [first] = stated;
  const broken: Readonly<Record<Variant, readonly Readonly<Record<string, string>>[]>> = {
    alias: first === undefined ? stated : [...stated, { ...first, k0: String(keySizes[0] ?? 1) }],
    beyondPrefix:
      first === undefined ? stated : [...stated, { ...first, [`k${keySizes.length - 1}`]: "2" }],
    duplicate: first === undefined ? stated : [...stated, first],
    outsideKey: first === undefined ? stated : [...stated, { ...first, k0: "zz" }],
    outsidePayload:
      first === undefined || payloadSizes.length === 0
        ? stated
        : [...stated, { ...first, p0: "zz" }],
    valid: stated,
  };
  const rows = broken[variant];
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
  const reasons = new Set<string>();
  const seen = new Map<string, Readonly<Record<string, string>>>();
  for (const row of rows) {
    const at = keyOf(row);
    if (Option.isNone(at) || !payloadValid(row)) {
      reasons.add("OutsideCodeSpace");
    } else if (seen.has(at.value)) {
      reasons.add("KeyCollision");
    } else {
      seen.set(at.value, row);
    }
  }

  const prefixes = keySizes.slice(0, -1).reduce((product, size) => product * size, 1);
  const cells = Option.match(dependent, {
    onNone: () => keySizes.reduce((product, size) => product * size, 1),
    onSome: (sizes) => sizes.slice(0, prefixes).reduce((sum, size) => sum + size, 0),
  });
  const payloadPoints = payloadSizes.reduce((product, size) => product * size, 1);
  let width = 1;
  while (2 ** width < 1 + payloadPoints) {
    width += 1;
  }

  return { cells, key, keyOf, keyRowOf, payload, reasons, rows, seen, width };
};

describe("closed relations against a naive tuple-set model", () => {
  it.effect(
    "refuse exactly the rows the model refuses, size the string as it does, and look every point up as it does",
    (ctx) =>
      searched(
        ctx,
        explore(
          { ...budget, draw: drawn(drawnRelation), runs: 600, suite: "grammar/closed/model" },
          (drawnCase) =>
            Effect.sync(() => {
              const model = built(drawnCase);
              const result = closed({
                key: model.key,
                name: "Toy",
                payload: model.payload,
                rows: model.rows,
              });

              if (model.reasons.size > 0) {
                assert.isTrue(Result.isFailure(result), [...model.reasons].join(", "));
                assert.include(
                  [...model.reasons],
                  Result.isFailure(result) ? result.failure._tag : "",
                  "the refusal is one the model finds",
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
    searched(
      ctx,
      explore(
        {
          ...budget,
          draw: drawn(array(element(["a", "b", "c", "d"] as const), { max: 5, min: 0 })),
          runs: 300,
          suite: "grammar/closed/roster",
        },
        (handles) =>
          Effect.sync(() => {
            const result = roster("Toy", handles);
            const distinct = new Set(handles).size === handles.length;

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
    searched(
      ctx,
      explore(
        {
          ...budget,
          draw: drawn(array(int(-3, 3), { max: 6, min: 0 })),
          runs: 300,
          suite: "grammar/closed/value-field",
        },
        (column) =>
          Effect.sync(() => {
            assert.deepStrictEqual(
              valueField("v", column).values,
              [...new Set(column)].toSorted((left, right) => left - right),
            );
          }),
      ),
    ),
  );
});
