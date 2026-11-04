import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Item } from "#plate/model/item.ts";
import { decodeRecord, fresh, outcomeDefaults } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * A single numeric value.
 *
 * @param baseType `integer` or `float`.
 * @param value The number.
 * @returns The value holding it.
 */
const number = (baseType: "float" | "integer", value: number): Value => ({
  baseType,
  cardinality: "single",
  values: [{ baseType, value }],
});

/**
 * A BG007-shaped item, built by hand: an identifier `RESPONSE`, a float `SCORE` with default 1,
 * outcomes with no default of each kind, one notice and one mark.
 */
const item: Item = {
  body: [],
  document: "items/BG007.xml",
  identifier: "beginnersguide007",
  lang: Option.none(),
  outcomes: new Map([
    [
      "SCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.some(number("float", 1)),
        identifier: "SCORE",
      },
    ],
    [
      "MAXSCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "MAXSCORE",
      },
    ],
    [
      "COUNT",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "COUNT",
      },
    ],
    [
      "FEEDBACK",
      {
        baseType: "identifier",
        cardinality: "multiple",
        defaultValue: Option.none(),
        identifier: "FEEDBACK",
      },
    ],
  ]),
  processing: Option.none(),
  responses: new Map([
    [
      "RESPONSE",
      {
        baseType: "identifier",
        cardinality: "single",
        correct: Option.some<Value>({
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "true" }],
        }),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
  ]),
  title: "BG true false example ",
  unsupported: [
    {
      feature: "qti-hotspot-interaction",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
      shown: "notice",
    },
    {
      feature: 'shuffle="true"',
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
      shown: "mark",
    },
  ],
};

describe("fresh", () => {
  it("[I-1] [I-2] starts responses at NULL and outcomes at their defaults, else 0, else NULL", () => {
    assert.deepStrictEqual(fresh(item, "i1"), {
      attempt: "none",
      document: "items/BG007.xml",
      instance: "i1",
      item: "beginnersguide007",
      kind: "item",
      notices: ["qti-hotspot-interaction"],
      numAttempts: 0,
      outcomes: {
        COUNT: number("integer", 0),
        FEEDBACK: { baseType: "identifier", cardinality: "multiple", values: [] },
        MAXSCORE: number("float", 0),
        SCORE: number("float", 1),
      },
      responses: { RESPONSE: { baseType: "identifier", cardinality: "single", values: [] } },
    });
  });

  it("[I-2] gives the same outcomes as outcomeDefaults", () => {
    assert.deepStrictEqual(fresh(item, "i1").outcomes, outcomeDefaults(item));
  });
});

describe("decodeRecord", () => {
  it.effect("round-trips a record through its Schema and JSON", () =>
    Effect.gen(function* roundTrips() {
      const record = fresh(item, "i1");

      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the record survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
      const stored: unknown = JSON.parse(JSON.stringify(record));

      assert.deepStrictEqual(yield* decodeRecord(stored), record);
    }),
  );

  it.effect('refuses a record with attempt "late" as InvalidRecord', () =>
    Effect.gen(function* refusesLate() {
      const error = yield* Effect.flip(decodeRecord({ ...fresh(item, "i1"), attempt: "late" }));

      assert.strictEqual(error._tag, "InvalidRecord");
    }),
  );

  it.effect("refuses a negative numAttempts and a response that is not a value", () =>
    Effect.gen(function* refusesMalformed() {
      const record = fresh(item, "i1");
      const negative = yield* Effect.flip(decodeRecord({ ...record, numAttempts: -1 }));
      const malformed = yield* Effect.flip(
        decodeRecord({ ...record, responses: { RESPONSE: "true" } }),
      );

      assert.strictEqual(negative._tag, "InvalidRecord");
      assert.strictEqual(malformed._tag, "InvalidRecord");
    }),
  );
});
