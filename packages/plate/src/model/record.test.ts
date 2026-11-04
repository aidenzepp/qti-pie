import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { Item } from "#plate/model/item.ts";
import { fresh, outcomeDefaults } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * A single integer value.
 *
 * @param value The integer.
 * @returns The value holding it.
 */
const integer = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * A single float value.
 *
 * @param value The number.
 * @returns The value holding it.
 */
const float = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
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
        defaultValue: Option.some(float(1)),
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
        defaultValue: Option.none(),
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
        COUNT: integer(0n),
        FEEDBACK: { baseType: "identifier", cardinality: "multiple", values: [] },
        MAXSCORE: float(0),
        SCORE: float(1),
      },
      responses: { RESPONSE: { baseType: "identifier", cardinality: "single", values: [] } },
    });
  });

  it("[I-2] gives the same outcomes as outcomeDefaults", () => {
    assert.deepStrictEqual(fresh(item, "i1").outcomes, outcomeDefaults(item));
  });
});
