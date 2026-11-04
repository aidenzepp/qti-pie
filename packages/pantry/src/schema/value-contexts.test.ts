import { assert, describe, it } from "@effect/vitest";
import * as valueContexts from "#pantry/schema/value-contexts.ts";

/**
 * The eleven base types a context holds a lexical form for.
 */
const baseTypes = [
  "boolean",
  "directedPair",
  "duration",
  "file",
  "float",
  "identifier",
  "integer",
  "pair",
  "point",
  "string",
  "uri",
] as const;

describe("schema/value-contexts", () => {
  it("names the eight value contexts, their prefixes and rules, and the eleven lexical forms of each", () => {
    assert.deepStrictEqual(valueContexts.valueContexts, [
      { context: "Declared", prefix: "DeclaredValue", rule: "value-lexical" },
      { context: "Literal", prefix: "Literal", rule: "P7" },
      { context: "Usage", prefix: "UsageTypedValue", rule: "usage-typed-value" },
      { context: "MapKey", prefix: "MapEntry", rule: "map-key-lexical" },
      { context: "MatchDefault", prefix: "MatchTableDefaultValue", rule: "attribute-lexical" },
      { context: "MatchTarget", prefix: "MatchTableEntry", rule: "attribute-lexical" },
      {
        context: "InterpolationDefault",
        prefix: "InterpolationTableDefaultValue",
        rule: "attribute-lexical",
      },
      {
        context: "InterpolationTarget",
        prefix: "InterpolationTableEntry",
        rule: "attribute-lexical",
      },
    ]);
    for (const { context } of valueContexts.valueContexts) {
      assert.deepStrictEqual(
        Object.keys(valueContexts.lexicalOf(context)).toSorted(),
        [...baseTypes].toSorted(),
      );
    }
  });
});
