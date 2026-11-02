import { assert, describe, it } from "@effect/vitest";
import {
  expressionKinds,
  numerical,
  resultType,
  resultTypes,
  unify,
} from "#qti/processing/types.ts";
import type { EffectiveType } from "#qti/processing/types.ts";

/**
 * The 64 expression kinds of section 3.3 table A, by name: the oracle `resultType` must be total
 * over.
 */
const tableA = [
  "qti-and",
  "qti-any-n",
  "qti-base-value",
  "qti-container-size",
  "qti-contains",
  "qti-correct",
  "qti-custom-operator",
  "qti-default",
  "qti-delete",
  "qti-divide",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-field-value",
  "qti-gcd",
  "qti-gt",
  "qti-gte",
  "qti-index",
  "qti-inside",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-is-null",
  "qti-lcm",
  "qti-lt",
  "qti-lte",
  "qti-map-response",
  "qti-map-response-point",
  "qti-match",
  "qti-math-constant",
  "qti-math-operator",
  "qti-max",
  "qti-member",
  "qti-min",
  "qti-multiple",
  "qti-not",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-or",
  "qti-ordered",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-pattern-match",
  "qti-power",
  "qti-product",
  "qti-random",
  "qti-random-float",
  "qti-random-integer",
  "qti-repeat",
  "qti-round",
  "qti-round-to",
  "qti-stats-operator",
  "qti-string-match",
  "qti-substring",
  "qti-subtract",
  "qti-sum",
  "qti-test-variables",
  "qti-truncate",
  "qti-variable",
];

const single = (baseType: EffectiveType["baseType"]): EffectiveType => ({
  baseType,
  cardinality: "single",
});

describe("resultType", () => {
  it("is defined for every one of table A's 64 kinds and no other", () => {
    assert.deepStrictEqual(expressionKinds.toSorted(), tableA.toSorted());
    assert.deepStrictEqual(Object.keys(resultTypes).toSorted(), tableA.toSorted());
    assert.strictEqual(tableA.length, 64);
  });

  it("types the boolean family boolean single", () => {
    const boolean = single("boolean");
    for (const kind of [
      "qti-and",
      "qti-or",
      "qti-not",
      "qti-any-n",
      "qti-match",
      "qti-equal",
      "qti-equal-rounded",
      "qti-gt",
      "qti-gte",
      "qti-lt",
      "qti-lte",
      "qti-duration-lt",
      "qti-duration-gte",
      "qti-member",
      "qti-contains",
      "qti-substring",
      "qti-string-match",
      "qti-pattern-match",
      "qti-inside",
      "qti-is-null",
    ] as const) {
      assert.deepStrictEqual(resultType(kind, [], {}), boolean, kind);
    }
  });

  it("types qti-sum integer over integers and float once a float joins", () => {
    assert.deepStrictEqual(
      resultType("qti-sum", [single("integer"), single("integer")], {}),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-sum", [single("integer"), single("float")], {}),
      single("float"),
    );
    assert.deepStrictEqual(
      resultType("qti-sum", [{ baseType: "integer", cardinality: "multiple" }], {}),
      single("integer"),
    );
  });

  it("types qti-divide and qti-power float", () => {
    const integers = [single("integer"), single("integer")];
    assert.deepStrictEqual(resultType("qti-divide", integers, {}), single("float"));
    assert.deepStrictEqual(resultType("qti-power", integers, {}), single("float"));
  });

  it("types the rounding family integer", () => {
    assert.deepStrictEqual(resultType("qti-round", [single("float")], {}), single("integer"));
    assert.deepStrictEqual(resultType("qti-truncate", [single("float")], {}), single("integer"));
  });

  it("types qti-math-operator by its operator name", () => {
    const operand = [single("float")];
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "signum" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "floor" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "ceil" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "ln" }),
      single("float"),
    );
  });

  it("types containers from their operands", () => {
    assert.deepStrictEqual(resultType("qti-multiple", [single("integer"), single("integer")], {}), {
      baseType: "integer",
      cardinality: "multiple",
    });
    assert.deepStrictEqual(resultType("qti-ordered", [single("string")], {}), {
      baseType: "string",
      cardinality: "ordered",
    });
    assert.deepStrictEqual(
      resultType(
        "qti-delete",
        [single("identifier"), { baseType: "identifier", cardinality: "multiple" }],
        {},
      ),
      { baseType: "identifier", cardinality: "multiple" },
    );
  });

  it("types qti-null as any, with no cardinality", () => {
    assert.deepStrictEqual(resultType("qti-null", [], {}), {
      baseType: "any",
      cardinality: "unknown",
    });
  });
});

describe("the lattice", () => {
  it("joins any away and keeps unknown", () => {
    assert.strictEqual(unify(single("any"), single("integer")).baseType, "integer");
    assert.strictEqual(unify(single("unknown"), single("integer")).baseType, "unknown");
  });

  it("calls only integer and float numerical", () => {
    assert.strictEqual(numerical(single("integer")), true);
    assert.strictEqual(numerical(single("float")), true);
    assert.strictEqual(numerical(single("duration")), false);
  });
});
