import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { Item } from "#plate/model/item.ts";
import { fresh, holdsCompletionStatus, outcomeDefaults } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * BG007's item with one more outcome, an integer it declares as `completionStatus`.
 */
const declaringCompletionStatus: Item = {
  ...bg007Item,
  outcomes: new Map([
    ...bg007Item.outcomes,
    [
      "completionStatus",
      {
        baseType: "integer",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "completionStatus",
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
};

describe("fresh", () => {
  it("[I-1] [I-2] starts responses at NULL and outcomes at their defaults, else 0, else NULL", () => {
    assert.deepStrictEqual(fresh(bg007Item, "i1"), {
      attempt: "none",
      correct: {},
      defaults: {},
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
        completionStatus: identifierValue("not_attempted"),
      },
      responses: { RESPONSE: { baseType: "identifier", cardinality: "single", values: [] } },
      seed: "",
      templates: {},
    });
  });

  it("[I-5] starts with the seed empty and no template value, correct response or default set", () => {
    const record = fresh(bg007Item, "i1");

    assert.deepStrictEqual(
      [record.seed, record.templates, record.correct, record.defaults],
      ["", {}, {}, {}],
    );
  });

  it("[I-2] gives the same outcomes as outcomeDefaults", () => {
    assert.deepStrictEqual(fresh(bg007Item, "i1").outcomes, outcomeDefaults(bg007Item));
  });

  it("[I-9a] holds the built-in completionStatus at not_attempted", () => {
    assert.isTrue(holdsCompletionStatus(bg007Item));
    assert.deepStrictEqual(
      fresh(bg007Item, "i1").outcomes["completionStatus"],
      identifierValue("not_attempted"),
    );
  });

  it("[I-9a] holds a declared outcome named completionStatus in its place, at its own starting value", () => {
    assert.isFalse(holdsCompletionStatus(declaringCompletionStatus));
    assert.deepStrictEqual(
      outcomeDefaults(declaringCompletionStatus)["completionStatus"],
      integer(0n),
    );
  });
});
