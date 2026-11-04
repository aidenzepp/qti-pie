import { assert, describe, it } from "@effect/vitest";
import { fresh, outcomeDefaults } from "#plate/model/record.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";

describe("fresh", () => {
  it("[I-1] [I-2] starts responses at NULL and outcomes at their defaults, else 0, else NULL", () => {
    assert.deepStrictEqual(fresh(bg007Item, "i1"), {
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
    assert.deepStrictEqual(fresh(bg007Item, "i1").outcomes, outcomeDefaults(bg007Item));
  });
});
