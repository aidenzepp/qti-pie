/**
 * Fixtures the tests share: single values built by hand, and a hand-built item.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import { Option } from "effect";
import type { Item } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Construct a single integer value.
 *
 * @param value The integer.
 * @returns The value holding it.
 */
export const integer = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value holding it.
 */
export const float = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

/**
 * A BG007-shaped item, built by hand: an identifier `RESPONSE`, a float `SCORE` with default 1,
 * outcomes with no default of each kind, and one notice.
 */
export const bg007Item: Item = {
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
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
    [
      "MAXSCORE",
      {
        baseType: "float",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "MAXSCORE",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
    [
      "COUNT",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "COUNT",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
    [
      "FEEDBACK",
      {
        baseType: "identifier",
        cardinality: "multiple",
        defaultValue: Option.none(),
        identifier: "FEEDBACK",
        interpretation: Option.none(),
        longInterpretation: Option.none(),
        lookupTable: Option.none(),
        masteryValue: Option.none(),
        normalMaximum: Option.none(),
        normalMinimum: Option.none(),
        view: Option.none(),
      },
    ],
  ]),
  processing: Option.none(),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
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
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "BG true false example ",
  unsupported: [
    {
      feature: "qti-hotspot-interaction",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
      shown: "notice",
    },
  ],
};
